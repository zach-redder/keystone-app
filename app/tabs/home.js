import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import globalStyles from '../../styles/global';
import keysStyles from '../../styles/keys';
import homeStyles from '../../styles/home';
import ProUpgradeModal from '../../components/ProUpgradeModal';
import CommunityModal from '../../components/CommunityModal';
import AlignModal from '../../components/AlignModal';
import AlignButton from '../../components/AlignButton';
import { checkUserProStatus } from '../../services/auth';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const [proModalVisible, setProModalVisible] = useState(false);
  const [communityModalVisible, setCommunityModalVisible] = useState(false);
  const [alignModalVisible, setAlignModalVisible] = useState(false);
  const [badgeText, setBadgeText] = useState('PRO');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('Week');
  const [selectedKeyTypeIndex, setSelectedKeyTypeIndex] = useState(0);

  const keyTypes = [
    'Core Values',
    'Future Identity',
    'Life Goals',
    'Motivations',
    'Avoidances',
    'Identity Traits'
  ];

  useEffect(() => {
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

  const handleTimePeriodPress = (period) => {
    setSelectedTimePeriod(period);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleKeyTypeNavigation = (direction) => {
    if (direction === 'left') {
      setSelectedKeyTypeIndex((prev) => 
        prev > 0 ? prev - 1 : keyTypes.length - 1
      );
    } else {
      setSelectedKeyTypeIndex((prev) => 
        prev < keyTypes.length - 1 ? prev + 1 : 0
      );
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDiscordPress = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Linking.openURL('https://discord.me/thealignedcore');
    } catch (error) {
      console.error('Error opening Discord link:', error);
    }
  };

  const handleAlignButtonPress = () => {
    setAlignModalVisible(true);
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
        
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Daily Reminder Section */}
          <View style={homeStyles.sectionContainer}>
            <Text style={homeStyles.sectionTitle}>Daily Reminder</Text>
            <TouchableOpacity style={homeStyles.reminderCard}>
              <Text style={homeStyles.reminderText}>
                "The actions you take should be aligned with your goals."
              </Text>
              <Text style={homeStyles.arrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Alignment Trends Section */}
          <View style={homeStyles.sectionContainer}>
            <Text style={homeStyles.sectionTitle}>Alignment Trends</Text>
            <View style={homeStyles.trendsContainer}>
              <View style={homeStyles.timePeriodButtons}>
                {['Week', 'Month', 'Year'].map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      homeStyles.timePeriodButton,
                      selectedTimePeriod === period && homeStyles.selectedTimePeriodButton
                    ]}
                    onPress={() => handleTimePeriodPress(period)}
                  >
                    <Text style={[
                      homeStyles.timePeriodButtonText,
                      selectedTimePeriod === period && homeStyles.selectedTimePeriodButtonText
                    ]}>
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={homeStyles.trendsChart}>
                {/* Placeholder for chart - you can add chart library here */}
              </View>
              
              {/* Key Type Selector */}
              <View style={homeStyles.keyTypeSelector}>
                <TouchableOpacity onPress={() => handleKeyTypeNavigation('left')}>
                  <Text style={homeStyles.keyTypeArrow}>‹</Text>
                </TouchableOpacity>
                <Text style={homeStyles.keyTypeText}>
                  {keyTypes[selectedKeyTypeIndex]}
                </Text>
                <TouchableOpacity onPress={() => handleKeyTypeNavigation('right')}>
                  <Text style={homeStyles.keyTypeArrow}>›</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Community Section */}
          <View style={homeStyles.sectionContainer}>
            <Text style={homeStyles.sectionTitle}>Community</Text>
            <View style={homeStyles.communityCard}>
              <Text style={homeStyles.communityMainText}>
                <Text style={homeStyles.communityHighlight}>You are 12% more aligned than your peers.</Text>
                {'\n\n'}Keep using Keystone to improve & join the discord community to be supported.
              </Text>
              <TouchableOpacity 
                style={homeStyles.joinDiscordButton}
                onPress={handleDiscordPress}
              >
                <Text style={homeStyles.joinDiscordButtonText}>Join Discord</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <AlignButton onPress={handleAlignButtonPress} />
        
        <AlignModal
          visible={alignModalVisible}
          onClose={() => setAlignModalVisible(false)}
        />
        
        <ProUpgradeModal
          visible={proModalVisible}
          onClose={() => setProModalVisible(false)}
          currentPage="home"
        />
        
        <CommunityModal
          visible={communityModalVisible}
          onClose={() => setCommunityModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}