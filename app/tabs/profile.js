import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Linking, AppState, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as StoreReview from 'expo-store-review';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { signOutUser, checkUserProStatus } from '../../services/auth';
import { fetchIdentityKeys } from '../../services/userKeys';
import { getPreferredAiPersona, updateNotificationOptIn, getUserEmail, getPreferredReminderTime, getUserDayStreak} from '../../services/userPreferences';
import profileStyles from '../../styles/profile';
import ProUpgradeModal from '../../components/modals/ProUpgradeModal';
import CommunityModal from '../../components/modals/CommunityModal';
import ContactReportModal from '../../components/modals/ContactReportModal';
import FAQModal from '../../components/modals/FAQModal';
import AIPersonalityModal from '../../components/modals/AIPersonalityModal';
import ReminderTimeModal from '../../components/modals/ReminderTimeModal';
import EditProfileModal from '../../components/modals/EditProfileModal';
import { shareProfilePage } from '../../services/shareService';

export default function ProfileScreen() {
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const lastNotificationStatus = useRef(false);
  const [badgeText, setBadgeText] = useState('PRO');
  const [proModalVisible, setProModalVisible] = useState(false);
  const [communityModalVisible, setCommunityModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [faqModalVisible, setFaqModalVisible] = useState(false);
  const [aiPersonalityModalVisible, setAiPersonalityModalVisible] = useState(false);
  const [reminderTimeModalVisible, setReminderTimeModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [keyCount, setKeyCount] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [aiPersona, setAiPersona] = useState('Default');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('9:00 AM');
  const [dayStreak, setDayStreak] = useState(0);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    checkProStatus();
    loadKeyCount();
    loadAiPersona();
    loadReminderTime();
    loadDayStreak();
    checkNotificationPermissions();
    loadUserEmail();
  }, []);

  // Listen for app state changes to detect when user returns from Settings
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground, check notification permissions
        checkAndUpdateNotificationPermissions();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Refresh AI persona when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAiPersona();
      loadReminderTime();
      loadDayStreak();
      checkAndUpdateNotificationPermissions();
    }, [])
  );

  const checkProStatus = async () => {
    try {
      const proStatus = await checkUserProStatus();
      setIsPro(proStatus);
      setBadgeText(proStatus ? 'COMMUNITY' : 'PRO');
    } catch (error) {
      console.error('Error checking Pro status:', error);
      setBadgeText('PRO');
    }
  };

  const loadKeyCount = async () => {
    try {
      const keys = await fetchIdentityKeys();
      setKeyCount(keys?.length || 0);
    } catch (error) {
      console.error('Error loading keys:', error);
    }
  };

  const loadAiPersona = async () => {
    try {
      const persona = await getPreferredAiPersona();
      setAiPersona(persona);
    } catch (error) {
      console.error('Error loading AI persona:', error);
      setAiPersona('Default');
    }
  };

  const loadReminderTime = async () => {
    try {
      const time = await getPreferredReminderTime();
      setReminderTime(time);
    } catch (error) {
      console.error('Error loading reminder time:', error);
      setReminderTime('9:00 AM');
    }
  };

  const loadDayStreak = async () => {
    try {
      const streak = await getUserDayStreak();
      setDayStreak(streak);
    } catch (error) {
      console.error('Error loading day streak:', error);
      setDayStreak(0);
    }
  };

  const checkNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const isEnabled = status === 'granted';
      setNotificationsEnabled(isEnabled);
      lastNotificationStatus.current = isEnabled;
      
      // Update database with current permission status on initial load
      await updateNotificationOptIn(isEnabled);
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      setNotificationsEnabled(false);
      lastNotificationStatus.current = false;
    }
  };

  const checkAndUpdateNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const isEnabled = status === 'granted';
      
      // Check if the permission status changed by comparing with the ref value
      if (isEnabled !== lastNotificationStatus.current) {
        console.log('Notification permission changed:', lastNotificationStatus.current, '->', isEnabled);
        setNotificationsEnabled(isEnabled);
        lastNotificationStatus.current = isEnabled;
        
        // Update the database with the new preference
        const success = await updateNotificationOptIn(isEnabled);
        if (success) {
          console.log('Notification preference updated in database:', isEnabled);
        } else {
          console.error('Failed to update notification preference in database');
        }
      }
    } catch (error) {
      console.error('Error checking and updating notification permissions:', error);
    }
  };

  const loadUserEmail = async () => {
    try {
      const email = await getUserEmail();
      setUserEmail(email);
    } catch (error) {
      console.error('Error loading user email:', error);
      setUserEmail('');
    }
  };

  const truncateEmail = (email) => {
    if (!email) return '';
    if (email.length <= 15) return email;
    return email.substring(0, 15) + '...';
  };

  const formatTime = (time) => {
    if (!time) return '9:00 AM';
    
    // If it's already in 12-hour format, return as is
    if (time.includes('AM') || time.includes('PM')) {
      return time;
    }
    
    // Convert from 24-hour to 12-hour format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const min = minutes || '00';
    
    if (hour === 0) {
      return `12:${min} AM`;
    } else if (hour < 12) {
      return `${hour}:${min} AM`;
    } else if (hour === 12) {
      return `12:${min} PM`;
    } else {
      return `${hour - 12}:${min} PM`;
    }
  };

  const handleBadgePress = async () => {
    try {
      const proStatus = await checkUserProStatus();
      if (proStatus) {
        setCommunityModalVisible(true);
      } else {
        setProModalVisible(true);
      }
    } catch (error) {
      console.error('Error checking Pro status:', error);
      setProModalVisible(true);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  function handleSignOut() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    signOutUser();
    router.replace('/signin');
  }

  const openSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Error opening settings:', error);
      // Fallback: open the app's settings page
      try {
        await Linking.openURL('app-settings:');
      } catch (fallbackError) {
        console.error('Error opening settings fallback:', fallbackError);
      }
    }
  };

  const handleRateUs = async () => {
    try {
      // Check if store review is available on this platform
      const isAvailable = await StoreReview.isAvailableAsync();
      
      if (isAvailable) {
        // Request review using the native store review dialog
        await StoreReview.requestReview();
      } else {
        // Fallback: open the app store page directly
        const storeUrl = await StoreReview.storeUrl();
        if (storeUrl) {
          await Linking.openURL(storeUrl);
        } else {
          console.log('Store review not available and no store URL found');
        }
      }
    } catch (error) {
      console.error('Error opening store review:', error);
    }
  };

  const handleContactUs = () => {
    setContactModalVisible(true);
  };

  const handleReportProblem = () => {
    setReportModalVisible(true);
  };

  const handleFAQ = () => {
    setFaqModalVisible(true);
  };

  const handleAIPersonality = () => {
    setAiPersonalityModalVisible(true);
  };

  const handleUpgradeFromAI = () => {
    setAiPersonalityModalVisible(false);
    setProModalVisible(true);
  };

  const handleReminderTime = () => {
    setReminderTimeModalVisible(true);
  };

  const handleTimeUpdated = (newTime) => {
    setReminderTime(newTime);
  };

  const handleSharePress = async () => {
    try {
      await shareProfilePage();
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };

  return (
    <SafeAreaView style={profileStyles.pageBg}>
      <View style={profileStyles.pageBg}>
        <View style={profileStyles.headerRow}>
          <Text style={profileStyles.header}>Profile</Text>
          <View style={profileStyles.headerButtons}>
            <TouchableOpacity style={profileStyles.proBadgeWrap} onPress={handleBadgePress}>
              <Text style={profileStyles.proBadge}>{badgeText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={profileStyles.shareButton} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleSharePress();
            }}>
              <Ionicons name="share-outline" size={28} color="#CCCCCC" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={profileStyles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* Stats Section */}
          <View style={profileStyles.statsContainer}>
            <View style={profileStyles.statItem}>
              <LinearGradient
                colors={['#D4DE95', '#B9C096']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={profileStyles.statItemGlow}
              />
              <Text style={profileStyles.statNumber}>{keyCount}</Text>
              <Text style={profileStyles.statLabel}>Total Keys</Text>
            </View>
            <View style={profileStyles.statItem}>
              <LinearGradient
                colors={['#D4DE95', '#B9C096']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={profileStyles.statItemGlow}
              />
              <Text style={profileStyles.statNumber}>{dayStreak}</Text>
              <Text style={profileStyles.statLabel}>Day Streak</Text>
            </View>
          </View>

          {/* Account Section */}
          <View style={profileStyles.profileSection}>
            <Text style={profileStyles.sectionTitle}>Account</Text>
            
            <TouchableOpacity style={profileStyles.profileItem} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEditProfileModalVisible(true);
            }}>
              <Ionicons name="person-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>Edit Profile</Text>
              <View style={profileStyles.profileItemRight}>
                <Text style={profileStyles.profileItemValue}>{truncateEmail(userEmail)}</Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[profileStyles.profileItem, profileStyles.profileItemLast]} onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const url = Platform.OS === 'ios'
                ? 'https://apps.apple.com/account/subscriptions'
                : 'https://play.google.com/store/account/subscriptions';
              try {
                await Linking.openURL(url);
              } catch (error) {
                console.error('Error opening subscription management:', error);
              }
            }}>
              <Ionicons name="star-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>My Subscription</Text>
              <View style={profileStyles.profileItemRight}>
                <Text style={profileStyles.profileItemValue}>{isPro ? 'Pro' : 'Free'}</Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Settings Section */}
          <View style={profileStyles.profileSection}>
            <Text style={profileStyles.sectionTitle}>Settings</Text>
            
            <TouchableOpacity style={profileStyles.profileItem} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              openSettings();
            }}>
              <Ionicons name="notifications-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>Notifications</Text>
              <View style={profileStyles.profileItemRight}>
                <Text style={profileStyles.profileItemValue}>{notificationsEnabled ? 'Enabled' : 'Disabled'}</Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={profileStyles.profileItem} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleReminderTime();
            }}>
              <Ionicons name="time-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>Reminder Time</Text>
              <View style={profileStyles.profileItemRight}>
                <Text style={profileStyles.profileItemValue}>{formatTime(reminderTime)}</Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={[profileStyles.profileItem, profileStyles.profileItemLast]} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleAIPersonality();
            }}>
              <Ionicons name="sparkles-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>AI Personality</Text>
              <View style={profileStyles.profileItemRight}>
                <Text style={profileStyles.profileItemValue}>{aiPersona}</Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Support Section */}
          <View style={profileStyles.profileSection}>
            <Text style={profileStyles.sectionTitle}>Support</Text>
            
            <TouchableOpacity style={profileStyles.profileItem} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleReportProblem();
            }}>
              <Ionicons name="bug-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>Report a Problem</Text>
              <View style={profileStyles.profileItemRight}>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={profileStyles.profileItem} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleFAQ();
            }}>
              <Ionicons name="help-circle-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>FAQ</Text>
              <View style={profileStyles.profileItemRight}>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[profileStyles.profileItem, profileStyles.profileItemLast]} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleContactUs();
            }}>
              <Ionicons name="mail-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>Contact Us</Text>
              <View style={profileStyles.profileItemRight}>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* More Section */}
          <View style={profileStyles.profileSection}>
            <Text style={profileStyles.sectionTitle}>More</Text>
            
            <TouchableOpacity style={profileStyles.profileItem} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCommunityModalVisible(true);
            }}>
              <Ionicons name="people-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>Keystone Community</Text>
              <View style={profileStyles.profileItemRight}>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={profileStyles.profileItem} onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              try {
                await Linking.openURL('https://thekeystoneapp.com');
              } catch (error) {
                console.error('Error opening website:', error);
              }
            }}>
              <Ionicons name="information-circle-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>About Keystone</Text>
              <View style={profileStyles.profileItemRight}>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[profileStyles.profileItem, profileStyles.profileItemLast]} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleRateUs();
            }}>
              <Ionicons name="heart-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>Rate Us</Text>
              <View style={profileStyles.profileItemRight}>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity style={profileStyles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#fff" style={profileStyles.signOutIcon} />
            <Text style={profileStyles.signOutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ProUpgradeModal
        visible={proModalVisible}
        onClose={() => setProModalVisible(false)}
        currentPage="profile"
      />
      <CommunityModal
        visible={communityModalVisible}
        onClose={() => setCommunityModalVisible(false)}
      />
      <ContactReportModal
        visible={contactModalVisible}
        onClose={() => setContactModalVisible(false)}
        type="contact"
      />
      <ContactReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        type="report"
      />
      <FAQModal
        visible={faqModalVisible}
        onClose={() => setFaqModalVisible(false)}
      />
      <AIPersonalityModal
        visible={aiPersonalityModalVisible}
        onClose={() => setAiPersonalityModalVisible(false)}
        onUpgradePress={handleUpgradeFromAI}
      />
      <ReminderTimeModal
        visible={reminderTimeModalVisible}
        onClose={() => setReminderTimeModalVisible(false)}
        onTimeUpdated={handleTimeUpdated}
      />
      <EditProfileModal
        visible={editProfileModalVisible}
        onClose={() => setEditProfileModalVisible(false)}
        userEmail={userEmail}
        onSave={() => {}}
      />
    </SafeAreaView>
  );
}
