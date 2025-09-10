import { supabase } from '../lib/supabase';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

// Welcome reminder for new users
const WELCOME_REMINDER = "Welcome to Keystone! You just chose to overcome internal tension and achieve your dreams.";

// Hardcoded reminders for inactive users
const DEFAULT_REMINDERS = [
  "Missing you! Time to realign your actions with your values.",
  "Your journey towards authenticity continues. Come back and track your progress!",
  "Haven't seen you in a while. Your goals are waiting for you!",
  "Ready to get back on track? Your alignment journey misses you.",
  "Take a moment today to reflect on your path. We're here to help!",
];

export const createFirstReminder = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw userError;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create the welcome reminder
    const { error } = await supabase
      .from('user_daily_reminders')
      .insert([{
        user_id: user.id,
        message: WELCOME_REMINDER,
        created_at: today.toISOString()
      }]);

    if (error) throw error;
    return WELCOME_REMINDER;
  } catch (error) {
    console.error('Error creating first reminder:', error);
    return WELCOME_REMINDER; // Still return the welcome message even if DB insert fails
  }
};

export const fetchTodayReminder = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('User not authenticated, returning default reminder');
      return DEFAULT_REMINDERS[0];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('user_daily_reminders')
      .select('message, created_at')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      return data[0].message;
    } else {
      // Return a random default reminder if no reminder exists for today
      return DEFAULT_REMINDERS[Math.floor(Math.random() * DEFAULT_REMINDERS.length)];
    }
  } catch (error) {
    console.error('Error fetching daily reminder:', error);
    return DEFAULT_REMINDERS[0]; // Fallback to first default reminder
  }
};

/**
 * Fetch the reminder for a specific local date. Uses an inclusive lower bound
 * and exclusive upper bound to avoid cross-day bleed due to timezones.
 */
export const fetchReminderForDate = async (date: Date) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('User not authenticated, returning default reminder');
      return DEFAULT_REMINDERS[0];
    }

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const { data, error } = await supabase
      .from('user_daily_reminders')
      .select('message, created_at')
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      return data[0].message as string;
    } else {
      // Fallback to a deterministic default for that day
      return DEFAULT_REMINDERS[Math.floor(Math.random() * DEFAULT_REMINDERS.length)];
    }
  } catch (error) {
    console.error('Error fetching reminder for date:', error);
    return DEFAULT_REMINDERS[0];
  }
};

export const setupReminderNotifications = async () => {
  try {
    // Check if user is authenticated first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('User not authenticated, skipping notification setup');
      return;
    }

    // Request notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      throw new Error('Permission not granted for notifications');
    }

    // Get user's preferred reminder time
    const { data: preferences, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('preferred_reminder_time')
      .maybeSingle();

    if (preferencesError) throw preferencesError;

    // If no preferred time is set, default to 9:00 AM
    const preferredTime = preferences?.preferred_reminder_time || '09:00';
    const [hours, minutes] = preferredTime.split(':').map(Number);

    // Calculate next notification time
    const now = new Date();
    const nextNotification = new Date(now);
    nextNotification.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (nextNotification <= now) {
      nextNotification.setDate(nextNotification.getDate() + 1);
    }

    // Cancel any existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Fetch the reminder for the day we're scheduling the notification for
    const message = await fetchReminderForDate(nextNotification);

    // Schedule a one-time notification for the next occurrence
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Keystone",
        body: message,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: nextNotification },
    });

  } catch (error) {
    console.error('Error setting up notifications:', error);
  }
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
}); 