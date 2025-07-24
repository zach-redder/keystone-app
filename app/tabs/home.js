import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import globalStyles from '../../styles/global';
import keysStyles from '../../styles/keys';
import homeStyles from '../../styles/home';
import ProUpgradeModal from '../../components/modals/ProUpgradeModal';
import CommunityModal from '../../components/modals/CommunityModal';
import AlignModal from '../../components/modals/AlignModal';
import AlignButton from '../../components/buttons/AlignButton';
import LogActionModal from '../../components/modals/LogActionModal';
import { checkUserProStatus } from '../../services/auth';
import { fetchRecentActionLog, fetchActionLogs } from '../../services/actionLogs';
import { shareHomePage } from '../../services/shareService';
import { fetchTodayReminder, setupReminderNotifications } from '../../services/reminderService';
import { 
  fetchAlignmentValue, 
  fetchLatestWeeklySnapshot, 
  fetchAlignmentScoreChange,
  KEY_TYPE_LABELS,
  getScoreLabel,
  getScoreColor
} from '../../services/alignmentService';
import * as Haptics from 'expo-haptics';
import ActionLogResultModal from '../../components/modals/ActionLogResultModal';
import AffirmIdentityModal from '../../components/modals/AffirmIdentityModal';

export default function HomeScreen() {
  const [proModalVisible, setProModalVisible] = useState(false);
  const [communityModalVisible, setCommunityModalVisible] = useState(false);
  const [alignModalVisible, setAlignModalVisible] = useState(false);
  const [badgeText, setBadgeText] = useState('PRO');
  const [selectedKeyTypeIndex, setSelectedKeyTypeIndex] = useState(0);
  const [recentActionLog, setRecentActionLog] = useState(null);
  const [loadingActionLog, setLoadingActionLog] = useState(true);
  const [dailyReminder, setDailyReminder] = useState('');
  const [loadingReminder, setLoadingReminder] = useState(true);
  const [alignmentValue, setAlignmentValue] = useState(null);
  const [weeklySnapshot, setWeeklySnapshot] = useState(null);
  const [loadingWeeklySnapshot, setLoadingWeeklySnapshot] = useState(true);
  const [alignmentScoreChange, setAlignmentScoreChange] = useState(null);
  const [loadingScoreChange, setLoadingScoreChange] = useState(true);
  const [logActionModalVisible, setLogActionModalVisible] = useState(false);
  const [recentActionLogs, setRecentActionLogs] = useState([]);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [resultLog, setResultLog] = useState(null);
  const [affirmIdentityModalVisible, setAffirmIdentityModalVisible] = useState(false);

  const HIGH_VALUE = 0.6; // Threshold for excessive alignment
  const LOW_VALUE = 0.4; // Threshold for deficient alignment

  // Map UI key types to backend key types
  const keyTypes = [
    'core_values',
    'future_self_vision',
    'life_goals',
    'identity_traits',
    'motivations',
    'avoidances',
  ];

  // Map for display names
  const keyTypeDisplayNames = {
    core_values: 'Core Values',
    future_self_vision: 'Future Identity',
    life_goals: 'Life Goals',
    identity_traits: 'Identity Traits',
    motivations: 'Motivations',
    avoidances: 'Avoidances',
  };

  // Use the new KEY_TYPE_LABELS from alignmentService
  const keyTypeLabels = KEY_TYPE_LABELS;

  // Load data whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Home screen focused - reloading data');
      checkProStatus();
      loadRecentActionLog();
      loadDailyReminder();
      loadWeeklySnapshot();
      loadAlignmentScoreChange();
      setupReminderNotifications().catch(console.error);
      loadRecentActionLogs();
      return () => {
        // Optional cleanup if needed
      };
    }, [])
  );

  useEffect(() => {
    const loadAlignment = async () => {
      const keyType = keyTypes[selectedKeyTypeIndex];
      const value = await fetchAlignmentValue(keyType);
      setAlignmentValue(value);
    };
    loadAlignment();
  }, [selectedKeyTypeIndex]);

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

  const loadDailyReminder = async () => {
    try {
      setLoadingReminder(true);
      const reminder = await fetchTodayReminder();
      setDailyReminder(reminder);
    } catch (error) {
      console.error('Error loading daily reminder:', error);
    } finally {
      setLoadingReminder(false);
    }
  };

  const loadWeeklySnapshot = async () => {
    setLoadingWeeklySnapshot(true);
    try {
      const snapshot = await fetchLatestWeeklySnapshot();
      setWeeklySnapshot(snapshot);
    } catch (error) {
      setWeeklySnapshot(null);
    } finally {
      setLoadingWeeklySnapshot(false);
    }
  };

  const loadAlignmentScoreChange = async () => {
    setLoadingScoreChange(true);
    try {
      const change = await fetchAlignmentScoreChange();
      setAlignmentScoreChange(change);
    } catch (error) {
      setAlignmentScoreChange(null);
    } finally {
      setLoadingScoreChange(false);
    }
  };

  const loadRecentActionLogs = async () => {
    try {
      const logs = await fetchActionLogs(3);
      setRecentActionLogs(logs);
    } catch (error) {
      setRecentActionLogs([]);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  const handleAlignButtonPress = () => {
    setAlignModalVisible(true);
  };

  const handleLogFirstActionPress = () => {
    setLogActionModalVisible(true);
  };

  const handleSharePress = async () => {
    try {
      await shareHomePage();
    } catch (error) {
      console.error('Error sharing app:', error);
    }
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

  const getCurrentAlignment = () => {
    if (alignmentValue === null) return 0.5;
    return alignmentValue;
  };

  const getCurrentLabels = () => {
    const currentKey = keyTypes[selectedKeyTypeIndex];
    return keyTypeLabels[currentKey] || { deficient: 'Deficient', ideal: 'Aligned', excess: 'Excessive' };
  };

  // Helper to get the current key type's display name
  const getCurrentKeyTypeDisplay = () => {
    const currentKey = keyTypes[selectedKeyTypeIndex];
    return keyTypeDisplayNames[currentKey] || currentKey;
  };

  // Helper to get the current alignment state
  const getCurrentAlignmentState = () => {
    const score = getCurrentAlignment();
    const currentKey = keyTypes[selectedKeyTypeIndex];
    return {
      label: getScoreLabel(currentKey, score),
      color: getScoreColor(score)
    };
  };

  // Helper to format week range
  const formatWeekRange = (start, end) => {
    if (!start || !end) return '';
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  // Handler to open Pro modal from AffirmIdentityModal
  const handleRequestProUpgrade = () => {
    setAffirmIdentityModalVisible(false);
    setProModalVisible(true); // Add delay to ensure modal sequencing
  };

  // Handler for Affirm Identity from AlignModal
  const handleAffirmIdentity = () => {
    setAlignModalVisible(false);
    setAffirmIdentityModalVisible(true);
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
              handleSharePress();
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
            <View style={homeStyles.reminderCard}>
              {loadingReminder ? (
                <Text style={homeStyles.reminderText}>Loading...</Text>
              ) : (
                <Text style={homeStyles.reminderText}>{dailyReminder}</Text>
              )}
            </View>
          </View>

          {/* Alignment Trends Section */}
          <View style={homeStyles.sectionContainer}>
            <Text style={homeStyles.sectionTitle}>Current Alignment</Text>
            <View style={homeStyles.trendsContainer}>
              <View style={{ minHeight: 130, height: 130, justifyContent: 'center' }}>
                {alignmentValue === null ? (
                  <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                    <Text style={{ color: '#888', fontSize: 16, textAlign: 'center', marginBottom: 16 }}>
                      No alignment data yet for this key. Align now to see your progress!
                    </Text>
                  </View>
                ) : (
                  <View style={homeStyles.trendsChart}>
                    {/* Golden Mean Alignment Chart */}
                    <View style={homeStyles.goldenMeanContainer}>
                      <View style={homeStyles.goldenMeanChart}>
                        {/* Scale Labels */}
                        <View style={homeStyles.scaleLabels}>
                          <Text style={[
                            homeStyles.scaleLabelDeficient,
                            getCurrentAlignment() < LOW_VALUE && { color: '#FF4C4C' },
                            getCurrentAlignment() > HIGH_VALUE && { color: '#999' },
                            getCurrentAlignment() >= LOW_VALUE && getCurrentAlignment() <= HIGH_VALUE && { color: '#999' },
                          ]}>{getCurrentLabels().deficient}</Text>
                          <Text style={[
                            homeStyles.scaleLabelIdeal,
                            getCurrentAlignment() >= LOW_VALUE && getCurrentAlignment() <= HIGH_VALUE && { color: '#D4DE95' },
                            (getCurrentAlignment() < LOW_VALUE || getCurrentAlignment() > HIGH_VALUE) && { color: '#999' },
                          ]}>{getCurrentLabels().ideal}</Text>
                          <Text style={[
                            homeStyles.scaleLabelExcess,
                            getCurrentAlignment() > HIGH_VALUE && { color: '#FF4C4C' },
                            getCurrentAlignment() < LOW_VALUE && { color: '#999' },
                            getCurrentAlignment() >= LOW_VALUE && getCurrentAlignment() <= HIGH_VALUE && { color: '#999' },
                          ]}>{getCurrentLabels().excess}</Text>
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
                              <View style={[
                                homeStyles.userDot,
                                (getCurrentAlignment() < LOW_VALUE || getCurrentAlignment() > HIGH_VALUE) && {
                                  borderColor: '#FF4C4C',
                                  shadowColor: '#FF4C4C',
                                  backgroundColor: '#fff',
                                },
                              ]} />
                            </View>
                            {/* Progress Fill */}
                            <View style={[
                              homeStyles.progressFill,
                              { 
                                left: `${Math.min(50, getCurrentAlignment() * 100)}%`,
                                width: `${Math.abs(getCurrentAlignment() * 100 - 50)}%`,
                                backgroundColor:
                                  (getCurrentAlignment() < LOW_VALUE || getCurrentAlignment() > HIGH_VALUE)
                                    ? '#FF4C4C'
                                    : '#D4DE95',
                                shadowColor:
                                  (getCurrentAlignment() < LOW_VALUE || getCurrentAlignment() > HIGH_VALUE)
                                    ? '#FF4C4C'
                                    : '#D4DE95',
                              }
                            ]} />
                          </View>
                        </View>
                        {/* Subtitle Labels Below */}
                        <View style={homeStyles.scaleSubtitles}>
                          <Text style={[
                            homeStyles.scaleSubtitleDeficient,
                            getCurrentAlignment() < LOW_VALUE && { color: '#FF4C4C' },
                            getCurrentAlignment() > HIGH_VALUE && { color: '#666' },
                            getCurrentAlignment() >= LOW_VALUE && getCurrentAlignment() <= HIGH_VALUE && { color: '#666' },
                          ]}>Deficient</Text>
                          <Text style={[
                            homeStyles.scaleSubtitleIdeal,
                            getCurrentAlignment() >= LOW_VALUE && getCurrentAlignment() <= HIGH_VALUE && { color: '#A8B89E' },
                            (getCurrentAlignment() < LOW_VALUE || getCurrentAlignment() > HIGH_VALUE) && { color: '#666' },
                          ]}>Aligned</Text>
                          <Text style={[
                            homeStyles.scaleSubtitleExcess,
                            getCurrentAlignment() > HIGH_VALUE && { color: '#FF4C4C' },
                            getCurrentAlignment() < LOW_VALUE && { color: '#666' },
                            getCurrentAlignment() >= LOW_VALUE && getCurrentAlignment() <= HIGH_VALUE && { color: '#666' },
                          ]}>Excessive</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
              {/* Key Type Selector */}
              <View style={homeStyles.keyTypeSelector}>
                <TouchableOpacity onPress={() => handleKeyTypeNavigation('left')}>
                  <Text style={homeStyles.keyTypeArrow}>‹</Text>
                </TouchableOpacity>
                <Text style={homeStyles.keyTypeText}>
                  {getCurrentKeyTypeDisplay()}
                </Text>
                <TouchableOpacity onPress={() => handleKeyTypeNavigation('right')}>
                  <Text style={homeStyles.keyTypeArrow}>›</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Previous Action Log Section */}
          <View style={homeStyles.sectionContainer}>
            <Text style={homeStyles.sectionTitle}>Previous Action Logs</Text>
            <View style={homeStyles.actionLogCard}>
              {recentActionLogs.length === 0 ? (
                <View style={homeStyles.noActionLogContainer}>
                  <Text style={homeStyles.noActionLogText}>
                    No actions logged yet. Start tracking your alignment journey!
                  </Text>
                  <TouchableOpacity 
                    style={homeStyles.firstActionButton}
                    onPress={handleLogFirstActionPress}
                  >
                    <Text style={homeStyles.firstActionButtonText}>Log Your First Action</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                recentActionLogs.map((log, idx) => (
                  <TouchableOpacity
                    key={log.id || idx}
                    style={homeStyles.actionLogCardSingle}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setResultLog(log);
                      setResultModalVisible(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={homeStyles.actionLogAction} numberOfLines={1}>
                      {log.action_description || 'No description'}
                    </Text>
                    {Array.isArray(log.key_tags) && log.key_tags.length > 0 && (
                      <Text style={homeStyles.actionLogKeyType} numberOfLines={1}>
                        {log.key_tags.join(', ')}
                      </Text>
                    )}
                    <Text style={homeStyles.actionLogDate}>
                      {formatActionLogDate(log.created_at)}
                    </Text>                   
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

          {/* Weekly Overview Section */}
          <View style={homeStyles.sectionContainer}>
            <Text style={homeStyles.sectionTitle}>Weekly Overview</Text>
            <TouchableOpacity style={homeStyles.weeklyOverviewCard} activeOpacity={0.85}>
              {loadingWeeklySnapshot ? (
                <Text style={{ color: '#aaa', fontSize: 16 }}>Loading...</Text>
              ) : weeklySnapshot ? (
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                    <Text style={homeStyles.weekRangeBadge}>
                      {formatWeekRange(weeklySnapshot.start_date, weeklySnapshot.end_date)}
                    </Text>
                    {loadingScoreChange ? null : alignmentScoreChange ? (
                      <Text
                        style={[
                          homeStyles.alignmentScoreBadge,
                          {
                            backgroundColor: alignmentScoreChange.isImprovement ? '#D4DE95' : '#FF4C4C',
                            color: alignmentScoreChange.isImprovement ? '#23272F' : '#fff',
                          },
                        ]}
                      >
                        {alignmentScoreChange.isImprovement ? '+ ' : '- '}
                        {Math.abs(alignmentScoreChange.percentChange).toFixed(1)}%
                      </Text>
                    ) : null}
                  </View>
                  <View style={homeStyles.statRow}>
                    <View style={homeStyles.statBlock}>
                      <Text style={homeStyles.statNumber}>{weeklySnapshot.keys_hit_count}</Text>
                      <Text style={homeStyles.statLabel}>Keys Hit</Text>
                    </View>
                    <View style={homeStyles.statBlock}>
                      <Text style={homeStyles.statNumber}>{weeklySnapshot.keys_missed_count}</Text>
                      <Text style={homeStyles.statLabel}>Keys Missed</Text>
                    </View>
                  </View>
                  <View style={homeStyles.divider} />
                  <View style={homeStyles.keysRow}>
                    <View style={homeStyles.keysColumn}>
                      <Text style={homeStyles.keysTitleHit}>Top Keys Hit</Text>
                      {Array.isArray(weeklySnapshot.top_keys_hit) && weeklySnapshot.top_keys_hit.length > 0 ? (
                        weeklySnapshot.top_keys_hit.map((key, idx) => (
                          <Text key={idx} style={homeStyles.keyPill}>{key}</Text>
                        ))
                      ) : (
                        <Text style={{ color: '#aaa', fontSize: 15 }}>None</Text>
                      )}
                    </View>
                    <View style={homeStyles.keysColumn}>
                      <Text style={homeStyles.keysTitleMissed}>Top Keys Missed</Text>
                      {Array.isArray(weeklySnapshot.top_keys_missed) && weeklySnapshot.top_keys_missed.length > 0 ? (
                        weeklySnapshot.top_keys_missed.map((key, idx) => (
                          <Text key={idx} style={homeStyles.keyPill}>{key}</Text>
                        ))
                      ) : (
                        <Text style={{ color: '#aaa', fontSize: 15 }}>None</Text>
                      )}
                    </View>
                  </View>
                </View>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ color: '#888', fontSize: 16, textAlign: 'center', marginBottom: 16 }}>
                    No weekly overview yet. Align consistently this week to see your progress here!
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <AlignButton onPress={handleAlignButtonPress} />
        
        <AlignModal
          visible={alignModalVisible}
          onClose={() => setAlignModalVisible(false)}
          onUpgradePress={() => {
            setAlignModalVisible(false);
            setProModalVisible(true);
          }}
          onAffirmIdentity={handleAffirmIdentity}
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

        <LogActionModal
          visible={logActionModalVisible}
          onClose={() => setLogActionModalVisible(false)}
          onSubmit={log => {
            setResultLog(log);
            setResultModalVisible(true);
          }}
        />
        <ActionLogResultModal
          visible={resultModalVisible}
          onClose={() => setResultModalVisible(false)}
          log={resultLog}
        />
        <AffirmIdentityModal
          visible={affirmIdentityModalVisible}
          onClose={() => setAffirmIdentityModalVisible(false)}
          onRequestProUpgrade={handleRequestProUpgrade}
        />
      </View>
    </SafeAreaView>
  );
}