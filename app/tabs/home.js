import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import globalStyles from '../../styles/global';
import keysStyles from '../../styles/keys';
import AlignButton from '../../components/AlignButton';
import ProUpgradeModal from '../../components/ProUpgradeModal';
import CommunityModal from '../../components/CommunityModal';
import { checkUserProStatus } from '../../services/auth';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const [proModalVisible, setProModalVisible] = useState(false);
  const [communityModalVisible, setCommunityModalVisible] = useState(false);
  const [badgeText, setBadgeText] = useState('PRO');

  useEffect(() => {
    // Check Pro status on component mount
    checkProStatus();
  }, []);

  const checkProStatus = async () => {
    try {
      const isPro = await checkUserProStatus();
      setBadgeText(isPro ? 'COMMUNITY' : 'PRO');
    } catch (error) {
      console.error('Error checking Pro status:', error);
      // Default to non-Pro if error
      setBadgeText('PRO');
    }
  };

  const handleBadgePress = async () => {
    try {
      const isPro = await checkUserProStatus();
      if (isPro) {
        // Show Community modal for Pro users
        setCommunityModalVisible(true);
      } else {
        // Show Pro upgrade modal for non-Pro users
        setProModalVisible(true);
      }
    } catch (error) {
      console.error('Error checking Pro status:', error);
      // Show Pro modal on error to be safe
      setProModalVisible(true);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <SafeAreaView style={globalStyles.pageBg}>
      <View style={globalStyles.pageBg}>
        <View style={globalStyles.headerRow}>
          <Text style={globalStyles.header}>Keystone</Text>
          <TouchableOpacity style={keysStyles.proBadgeWrap} onPress={handleBadgePress}>
            <Text style={keysStyles.proBadge}>{badgeText}</Text>
          </TouchableOpacity>
        </View>
        {/* Other home content here */}
        <AlignButton onPress={() => {}} />
        
        <ProUpgradeModal
          visible={proModalVisible}
          onClose={() => setProModalVisible(false)}
        />
        
        <CommunityModal
          visible={communityModalVisible}
          onClose={() => setCommunityModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}