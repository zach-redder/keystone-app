import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import globalStyles from '../../styles/global';
import keysStyles from '../../styles/keys';
import homeStyles from '../../styles/home';
import AIOrb from '../../components/voice/AIOrb';
import ProUpgradeModal from '../../components/modals/ProUpgradeModal';
import StreakRewardModal from '../../components/modals/StreakRewardModal';
import StreakInfoModal from '../../components/modals/StreakInfoModal';
import FreeMonthOfferModal from '../../components/modals/FreeMonthOfferModal';
import { CHAT_MODES, DEFAULT_CHAT_MODE, isChatMode } from '../../constants/chatModes';
import { getAppStoreLink, APP_NAME } from '../../constants/appStore';
import { fetchTodayReminder, setupReminderNotifications } from '../../services/features/reminderService';
import { getUserDayStreak, getUserLongestStreak } from '../../services/user/userPreferences';
import { checkForStreakMilestone, markMilestoneAsShown } from '../../services/features/streakRewardsService';
import { shouldShowFreeMonthOffer, markFreeMonthOfferShown } from '../../services/user/freeMonthOfferService';
import { checkUserProStatus } from '../../services/subscription/subscriptionService';

const SELECTED_MODE_STORAGE_KEY = 'home_selected_chat_mode';
const ORB_SIZE = 280;

export default function HomeScreen() {
  const router = useRouter();
  const [mode, setMode] = useState(DEFAULT_CHAT_MODE);
  const [dayStreak, setDayStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [dailyReminder, setDailyReminder] = useState('');
  const [streakRewardModalVisible, setStreakRewardModalVisible] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState(null);
  const [streakInfoModalVisible, setStreakInfoModalVisible] = useState(false);
  const [freeMonthOfferModalVisible, setFreeMonthOfferModalVisible] = useState(false);
  const [proUpgradeVisible, setProUpgradeVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SELECTED_MODE_STORAGE_KEY);
        if (isChatMode(stored)) setMode(stored);
      } catch (error) {
        console.error('Error restoring chat mode:', error);
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkFreeMonthOffer();
      loadStreaks();
      loadDailyReminder();
      setupReminderNotifications().catch(console.error);
    }, [])
  );

  const checkFreeMonthOffer = async () => {
    try {
      if (await shouldShowFreeMonthOffer()) {
        setFreeMonthOfferModalVisible(true);
        await markFreeMonthOfferShown();
      }
    } catch (error) {
      console.error('Error checking free month offer:', error);
    }
  };

  const loadStreaks = async () => {
    try {
      const streak = await getUserDayStreak();
      setDayStreak(streak);

      if (streak > 0) {
        const milestone = await checkForStreakMilestone(streak);
        if (milestone) {
          setCurrentMilestone(milestone);
          setStreakRewardModalVisible(true);
          await markMilestoneAsShown(milestone.days);
        }
      }
    } catch (error) {
      console.error('Error loading day streak:', error);
      setDayStreak(0);
    }

    try {
      setLongestStreak(await getUserLongestStreak());
    } catch (error) {
      console.error('Error loading longest streak:', error);
      setLongestStreak(0);
    }
  };

  const loadDailyReminder = async () => {
    try {
      setDailyReminder(await fetchTodayReminder());
    } catch (error) {
      console.error('Error loading daily reminder:', error);
      setDailyReminder('');
    }
  };

  const handleSelectMode = async (nextMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode(nextMode);
    try {
      await AsyncStorage.setItem(SELECTED_MODE_STORAGE_KEY, nextMode);
    } catch (error) {
      console.error('Error saving chat mode:', error);
    }
  };

  // Voice is the default; it's a Pro feature, so free users see the upgrade sheet instead
  const handleStartVoice = async () => {
    try {
      if (await checkUserProStatus()) {
        router.push(`/voice/${mode}`);
      } else {
        setProUpgradeVisible(true);
      }
    } catch (error) {
      console.error('Error checking Pro status:', error);
      setProUpgradeVisible(true);
    }
  };

  const handleSharePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const appStoreLink = getAppStoreLink();
      await Share.share({
        message: `Check out ${APP_NAME} - the app that helps you overcome doubt and become your best self! Download it here: ${appStoreLink}`,
        url: appStoreLink,
        title: `${APP_NAME} - Overcome Doubt`
      });
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };

  const config = CHAT_MODES[mode];

  return (
    <SafeAreaView style={globalStyles.pageBg}>
      <View style={globalStyles.pageBg}>
        <View style={globalStyles.headerRow}>
          <Text style={globalStyles.header}>Keystone</Text>
          <View style={globalStyles.headerButtons}>
            <TouchableOpacity
              style={homeStyles.streakBadgeWrap}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStreakInfoModalVisible(true);
              }}
            >
              <Ionicons name="flame" size={16} color="#D4DE95" />
              <Text style={homeStyles.streakBadge}>{dayStreak}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={keysStyles.shareButton} onPress={handleSharePress}>
              <Ionicons name="share-outline" size={28} color="#CCCCCC" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={homeStyles.bubbleScreen}>
          {dailyReminder ? (
            <Text style={homeStyles.bubbleReminder} numberOfLines={3}>{dailyReminder}</Text>
          ) : null}

          <View style={homeStyles.modeSwitch}>
            {Object.values(CHAT_MODES).map(item => {
              const active = item.id === mode;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[homeStyles.modeOption, active && homeStyles.modeOptionActive]}
                  onPress={() => handleSelectMode(item.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[homeStyles.modeOptionText, active && homeStyles.modeOptionTextActive]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <AIOrb
            mode={mode}
            state="idle"
            size={ORB_SIZE}
            label={`Start a ${config.title} voice conversation`}
            onPress={handleStartVoice}
          />

          <Text style={homeStyles.bubbleTagline}>{config.tagline}</Text>
          <Text style={homeStyles.bubbleDescription}>{config.description}</Text>

          <TouchableOpacity
            style={homeStyles.typeInstead}
            onPress={() => router.push(`/chat/${mode}`)}
            hitSlop={8}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#B9C096" />
            <Text style={homeStyles.typeInsteadText}>Prefer to type? Chat</Text>
          </TouchableOpacity>
        </View>

        <StreakRewardModal
          visible={streakRewardModalVisible}
          milestone={currentMilestone}
          onClose={() => {
            setStreakRewardModalVisible(false);
            setCurrentMilestone(null);
          }}
        />
        <StreakInfoModal
          visible={streakInfoModalVisible}
          currentStreak={dayStreak}
          longestStreak={longestStreak}
          onClose={() => setStreakInfoModalVisible(false)}
        />
        <ProUpgradeModal visible={proUpgradeVisible} onClose={() => setProUpgradeVisible(false)} />
        <FreeMonthOfferModal
          visible={freeMonthOfferModalVisible}
          onClose={() => setFreeMonthOfferModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}
