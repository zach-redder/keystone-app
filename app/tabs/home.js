import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import globalStyles from '../../styles/global';
import keysStyles from '../../styles/keys';
import homeStyles from '../../styles/home';
import ProUpgradeModal from '../../components/modals/ProUpgradeModal';
import CommunityModal from '../../components/modals/CommunityModal';
import AlignModal from '../../components/modals/AlignModal';
import AlignButton from '../../components/buttons//AlignButton';
import { checkUserProStatus } from '../../services/auth';
import { fetchRecentActionLog } from '../../services/actionLogs';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const [proModalVisible, setProModalVisible] = useState(false);
  const [communityModalVisible, setCommunityModalVisible] = useState(false);
  const [alignModalVisible, setAlignModalVisible] = useState(false);
  const [badgeText, setBadgeText] = useState('PRO');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('Week');
  const [selectedKeyTypeIndex, setSelectedKeyTypeIndex] = useState(0);
  const [recentActionLog, setRecentActionLog] = useState(null);
  const [loadingActionLog, setLoadingActionLog] = useState(true);

  const keyTypes = [
    'Core Values',
    'Future Identity',
    'Life Goals',
    'Motivations',
    'Avoidances',
    'Identity Traits'
  ];

  // Mock Golden Mean alignment data (0.5 is the golden mean/ideal)
  const goldenMeanData = {
    'Core Values': 0.7, // Slightly excessive
    'Future Identity': 0.5, // Perfect balance
    'Life Goals': 0.3, // Deficient
    'Motivations': 0.6, // Slightly excessive
    'Avoidances': 0.4, // Slightly deficient
    'Identity Traits': 0.8 // Excessive
  };

  // Labels for each key type
  const keyTypeLabels = {
    'Core Values': { deficient: 'Conformity', ideal: 'Integrity', excess: 'Dogmatism' },
    'Identity Traits': { deficient: 'Suppression', ideal: 'Authenticity', excess: 'Egotism' },
    'Future Identity': { deficient: 'Drift', ideal: 'Purpose', excess: 'Obsession' },
    'Avoidances': { deficient: 'Denial', ideal: 'Discernment', excess: 'Paranoia' },
    'Motivations': { deficient: 'Apathy', ideal: 'Drive', excess: 'Fixation' },
    'Life Goals': { deficient: 'Aimlessness', ideal: 'Vision', excess: 'Overreach' }
  };

  const getCurrentAlignment = () => {
    const currentKey = keyTypes[selectedKeyTypeIndex];
    return goldenMeanData[currentKey] || 0.5;
  };

  const getCurrentLabels = () => {
    const currentKey = keyTypes[selectedKeyTypeIndex];
    return keyTypeLabels[currentKey] || { deficient: 'Deficient', ideal: 'Aligned', excess: 'Excessive' };
  };

  useEffect(() => {
    checkProStatus();
    loadRecentActionLog();
  }, []);

  const loadRecentActionLog = async () => {
    try {
      setLoadingActionLog(true);
      const actionLog = await fetchRecentActionLog();
      setRecentActionLog(actionLog);
    } catch (error) {
      console.error('Error loading action log:', error);
      setRecentActionLog(null);
    } finally {
      setLoadingActionLog(false);
    }
  };

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

  const formatActionLogDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <SafeAreaView style={globalStyles.pageBg}>
      <View style={globalStyles.pageBg}>
        <View style={globalStyles.headerRow}>
          <Text style={globalStyles.header}>Keystone</Text>
          <View style={globalStyles.headerButtons}>
            <TouchableOpacity style={keysStyles.proBadgeWrap} onPress={handleBadgePress}>
              <Text style={keysStyles.proBadge}>{badgeText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={keysStyles.shareButton} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Share functionality to be implemented
            }}>
              <Ionicons name="share-outline" size={28} color="#CCCCCC" />
            </TouchableOpacity>
          </View>
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
            <Text style={homeStyles.sectionTitle}>Alignment</Text>
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
                {/* Golden Mean Alignment Chart */}
                <View style={homeStyles.goldenMeanContainer}>
                  <View style={homeStyles.goldenMeanChart}>
                    {/* Scale Labels */}
                    <View style={homeStyles.scaleLabels}>
                      <Text style={homeStyles.scaleLabelDeficient}>{getCurrentLabels().deficient}</Text>
                      <Text style={homeStyles.scaleLabelIdeal}>{getCurrentLabels().ideal}</Text>
                      <Text style={homeStyles.scaleLabelExcess}>{getCurrentLabels().excess}</Text>
                    </View>
                    
                    {/* Progress Bar */}
                    <View style={homeStyles.progressContainer}>
                      <View style={homeStyles.progressBar}>
                        {/* Golden Mean Indicator */}
                        <View style={homeStyles.goldenMeanIndicator} />
                        
                        {/* User Position */}
                        <View style={[
                          homeStyles.userPosition,
                          { left: `${getCurrentAlignment() * 100}%` }
                        ]}>
                          <View style={homeStyles.userDot} />

                        </View>
                        
                        {/* Progress Fill */}
                        <View style={[
                          homeStyles.progressFill,
                          { 
                            left: `${Math.min(50, getCurrentAlignment() * 100)}%`,
                            width: `${Math.abs(getCurrentAlignment() * 100 - 50)}%`,
                            backgroundColor: '#D4DE95' // Use app's primary accent color
                          }
                        ]} />
                      </View>
                    </View>
                    
                    {/* Subtitle Labels Below */}
                    <View style={homeStyles.scaleSubtitles}>
                      <Text style={homeStyles.scaleSubtitleDeficient}>Deficiency</Text>
                      <Text style={homeStyles.scaleSubtitleIdeal}>Aligned</Text>
                      <Text style={homeStyles.scaleSubtitleExcess}>Excess</Text>
                    </View>
                  </View>
                </View>
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

          {/* Previous Action Log Section */}
          <View style={homeStyles.sectionContainer}>
            <Text style={homeStyles.sectionTitle}>Previous Action Log</Text>
            <View style={homeStyles.actionLogCard}>
              {loadingActionLog ? (
                <Text style={homeStyles.actionLogLoading}>Loading...</Text>
              ) : recentActionLog ? (
                <View>
                  <Text style={homeStyles.actionLogAction}>{recentActionLog.action}</Text>
                  <Text style={homeStyles.actionLogDate}>
                    {formatActionLogDate(recentActionLog.created_at)}
                  </Text>
                  {recentActionLog.key_type && (
                    <Text style={homeStyles.actionLogKeyType}>
                      {recentActionLog.key_type}
                    </Text>
                  )}
                </View>
              ) : (
                <View style={homeStyles.noActionLogContainer}>
                  <Text style={homeStyles.noActionLogText}>
                    No actions logged yet. Start tracking your alignment journey!
                  </Text>
                  <TouchableOpacity 
                    style={homeStyles.firstActionButton}
                    onPress={handleAlignButtonPress}
                  >
                    <Text style={homeStyles.firstActionButtonText}>Log Your First Action</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Community Section
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
          </View> */}
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