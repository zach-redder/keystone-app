import { supabase } from '../../lib/supabase';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyMessageContext, pickDailyMessage } from '../../constants/dailyMessages';

const DEFAULT_REMINDER_TIME = '09:00';
const DAYS_SCHEDULED_AHEAD = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RECENT_CHATS_WINDOW_DAYS = 7;
const RECENT_CHATS_LIMIT = 500;
const SCHEDULED_IDS_KEY = 'daily_reminder_notification_ids';

// The daily message is picked on the device from a fixed list, so the notification schedule
// needs nothing from a server. Scheduling several days ahead keeps reminders arriving even if
// the app isn't opened for a week.

const fetchMessageContext = async (userId: string): Promise<DailyMessageContext> => {
  const since = new Date(Date.now() - RECENT_CHATS_WINDOW_DAYS * MS_PER_DAY).toISOString();

  const [recent, latest] = await Promise.all([
    supabase
      .from('ai_chat_logs')
      .select('mode')
      .eq('user_id', userId)
      .gte('created_at', since)
      .limit(RECENT_CHATS_LIMIT),
    supabase
      .from('ai_chat_logs')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (recent.error) throw recent.error;
  if (latest.error) throw latest.error;

  const rows = recent.data ?? [];
  const affirmCount7d = rows.filter(row => row.mode === 'affirm').length;
  const questionCount7d = rows.filter(row => row.mode === 'question').length;
  const daysSinceLastChat = latest.data
    ? Math.floor((Date.now() - new Date(latest.data.created_at).getTime()) / MS_PER_DAY)
    : null;

  return { affirmCount7d, questionCount7d, daysSinceLastChat };
};

const cancelPreviouslyScheduled = async () => {
  const stored = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
  if (stored === null) {
    // First run of this scheduler: clear whatever the old single-notification scheduler left behind
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }
  const ids: string[] = JSON.parse(stored);
  await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)));
};

export const setupReminderNotifications = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      console.log('User not authenticated, skipping notification setup');
      return;
    }

    // Permission is requested during onboarding and from Profile; never prompt from here
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted - notifications will not be scheduled');
      return;
    }

    const { data: preferences, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('preferred_reminder_time')
      .eq('user_id', userId)
      .maybeSingle();
    if (preferencesError) throw preferencesError;

    const preferredTime = preferences?.preferred_reminder_time || DEFAULT_REMINDER_TIME;
    const [hours, minutes] = preferredTime.split(':').map(Number);

    let context: DailyMessageContext;
    try {
      context = await fetchMessageContext(userId);
    } catch (error) {
      // Still send a reminder if usage can't be read; fall back to the general pool
      console.error('Error loading recent chat activity for daily message:', error);
      context = { affirmCount7d: 0, questionCount7d: 0, daysSinceLastChat: 0 };
    }

    await cancelPreviouslyScheduled();

    const now = new Date();
    const ids: string[] = [];
    for (let dayOffset = 0; dayOffset < DAYS_SCHEDULED_AHEAD; dayOffset++) {
      const fireAt = new Date(now);
      fireAt.setDate(now.getDate() + dayOffset);
      fireAt.setHours(hours, minutes, 0, 0);
      if (fireAt <= now) continue;

      // Each later day assumes one more day without chatting; the schedule is refreshed on every app open
      const dayContext: DailyMessageContext = {
        ...context,
        daysSinceLastChat: context.daysSinceLastChat === null ? null : context.daysSinceLastChat + dayOffset,
      };

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Keystone',
          body: pickDailyMessage(dayContext, userId, fireAt),
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { type: SchedulableTriggerInputTypes.DATE, date: fireAt },
      });
      ids.push(id);
    }

    await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(ids));
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
