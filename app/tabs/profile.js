import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { signOutUser, checkUserProStatus } from '../../services/auth';
import { fetchIdentityKeys } from '../../services/userKeys';
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

  useEffect(() => {
    checkProStatus();
    loadKeyCount();
  }, []);

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
              <Text style={profileStyles.statNumber}>{keyCount}</Text>
              <Text style={profileStyles.statLabel}>Total Keys</Text>
            </View>
            <View style={profileStyles.statItem}>
              <Text style={profileStyles.statNumber}>{isPro ? 'Pro' : 'Free'}</Text>
              <Text style={profileStyles.statLabel}>Plan</Text>
            </View>
          </View>

          {/* Account Section */}
          <View style={profileStyles.profileSection}>
            <Text style={profileStyles.sectionTitle}>Account</Text>
            
            <View style={profileStyles.profileItem}>
              <Ionicons name="person-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>Account Type</Text>
              <Text style={profileStyles.profileItemValue}>{isPro ? 'Pro Member' : 'Free User'}</Text>
            </View>

            <View style={[profileStyles.profileItem, profileStyles.profileItemLast]}>
              <Ionicons name="key-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>Identity Keys</Text>
              <Text style={profileStyles.profileItemValue}>{keyCount} created</Text>
            </View>
          </View>

          {/* Settings Section */}
          <View style={profileStyles.profileSection}>
            <Text style={profileStyles.sectionTitle}>Settings</Text>
            
            <View style={profileStyles.profileItem}>
              <Ionicons name="notifications-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>Notifications</Text>
              <Text style={profileStyles.profileItemValue}>Enabled</Text>
            </View>

            <View style={profileStyles.profileItem}>
              <Ionicons name="shield-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>Privacy</Text>
              <Text style={profileStyles.profileItemValue}>Secure</Text>
            </View>

            <View style={[profileStyles.profileItem, profileStyles.profileItemLast]}>
              <Ionicons name="help-circle-outline" size={20} color="#B9C096" style={profileStyles.profileItemIcon} />
              <Text style={profileStyles.profileItemText}>Support</Text>
              <Text style={profileStyles.profileItemValue}>Get Help</Text>
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity style={profileStyles.signOutButton} onPress={handleSignOut}>
            <Text style={profileStyles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ProUpgradeModal
        visible={proModalVisible}
        onClose={() => setProModalVisible(false)}
      />
      <CommunityModal
        visible={communityModalVisible}
        onClose={() => setCommunityModalVisible(false)}
      />
    </SafeAreaView>
  );
}
