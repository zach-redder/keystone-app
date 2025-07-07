import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { signOutUser, checkUserProStatus } from '../../services/auth';
import { fetchIdentityKeys } from '../../services/userKeys';
import { getPreferredAiPersona } from '../../services/userPreferences';
import profileStyles from '../../styles/profile';
import ProUpgradeModal from '../../components/ProUpgradeModal';
import CommunityModal from '../../components/CommunityModal';

export default function ProfileScreen() {
  const router = useRouter();
  const [badgeText, setBadgeText] = useState('PRO');
  const [proModalVisible, setProModalVisible] = useState(false);
  const [communityModalVisible, setCommunityModalVisible] = useState(false);
  const [keyCount, setKeyCount] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [aiPersona, setAiPersona] = useState('Default');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    checkProStatus();
    loadKeyCount();
    loadAiPersona();
    checkNotificationPermissions();
  }, []);

  // Refresh AI persona when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAiPersona();
      checkNotificationPermissions();
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

  const checkNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      setNotificationsEnabled(false);
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

  return (
    <SafeAreaView style={profileStyles.pageBg}>
      <View style={profileStyles.pageBg}>
        <View style={profileStyles.headerRow}>
          <Text style={profileStyles.header}>Profile</Text>
          <TouchableOpacity style={profileStyles.proBadgeWrap} onPress={handleBadgePress}>
            <Text style={profileStyles.proBadge}>{badgeText}</Text>
          </TouchableOpacity>
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
              <Text style={profileStyles.statNumber}>1</Text>
              <Text style={profileStyles.statLabel}>Day Streak</Text>
            </View>
          </View>

          {/* Account Section */}
          <View style={profileStyles.profileSection}>
            <Text style={profileStyles.sectionTitle}>Account</Text>
            
            <TouchableOpacity style={profileStyles.profileItem} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Navigate to edit profile
            }}>
              <Ionicons name="person-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>Edit Profile</Text>
              <View style={profileStyles.profileItemRight}>
                <Text style={profileStyles.profileItemValue}>{isPro ? 'Pro Member' : 'Free User'}</Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={profileStyles.profileItem} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Navigate to AI personality settings
            }}>
              <Ionicons name="sparkles-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>AI Personality</Text>
              <View style={profileStyles.profileItemRight}>
                <Text style={profileStyles.profileItemValue}>{aiPersona}</Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[profileStyles.profileItem, profileStyles.profileItemLast]} onPress={handleBadgePress}>
              <Ionicons name="star-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>My Subscription</Text>
              <View style={profileStyles.profileItemRight}>
                <Text style={profileStyles.profileItemValue}>{isPro ? 'Pro Active' : 'Free Plan'}</Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Settings Section */}
          <View style={profileStyles.profileSection}>
            <Text style={profileStyles.sectionTitle}>Settings</Text>
            
            <TouchableOpacity style={profileStyles.profileItem} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Navigate to notifications settings
            }}>
              <Ionicons name="notifications-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>Notifications</Text>
              <View style={profileStyles.profileItemRight}>
                <Text style={profileStyles.profileItemValue}>{notificationsEnabled ? 'Enabled' : 'Disabled'}</Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Support Section */}
          <View style={profileStyles.profileSection}>
            <Text style={profileStyles.sectionTitle}>Support</Text>
            
            <TouchableOpacity style={profileStyles.profileItem} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Navigate to report problem
            }}>
              <Ionicons name="bug-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>Report a Problem</Text>
              <View style={profileStyles.profileItemRight}>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[profileStyles.profileItem, profileStyles.profileItemLast]} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Navigate to help & support
            }}>
              <Ionicons name="help-circle-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>Help & Support</Text>
              <View style={profileStyles.profileItemRight}>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Community Section */}
          <View style={profileStyles.profileSection}>
            <Text style={profileStyles.sectionTitle}>Community</Text>
            
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

            <TouchableOpacity style={[profileStyles.profileItem, profileStyles.profileItemLast]} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Navigate to rate us
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
            <Ionicons name="log-out-outline" size={20} color="#FF4444" style={profileStyles.signOutIcon} />
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
    </SafeAreaView>
  );
}
