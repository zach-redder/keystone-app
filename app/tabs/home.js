import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Share, useWindowDimensions } from 'react-native';
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
import useAiConsent from '../../hooks/useAiConsent';
import StreakRewardModal from '../../components/modals/StreakRewardModal';
import StreakInfoModal from '../../components/modals/StreakInfoModal';
import FreeMonthOfferModal from '../../components/modals/FreeMonthOfferModal';
import { CHAT_MODES, DEFAULT_CHAT_MODE, isChatMode } from '../../constants/chatModes';
import { getAppStoreLink, APP_NAME } from '../../constants/appStore';
import useUserStats from '../../hooks/useUserStats';
import { checkForStreakMilestone, markMilestoneAsShown } from '../../services/features/streakRewardsService';
import { maybeRequestReview } from '../../services/features/reviewPromptService';
import { isMilestoneWorthAsking } from '../../services/features/reviewPromptPolicy';
import { shouldShowFreeMonthOffer, markFreeMonthOfferShown } from '../../services/user/freeMonthOfferService';
import { checkUserProStatus } from '../../services/subscription/subscriptionService';

const SELECTED_MODE_STORAGE_KEY = 'home_selected_chat_mode';
const MAX_ORB_SIZE = 330;
const ORB_WIDTH_RATIO = 0.85;

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const orbSize = Math.min(MAX_ORB_SIZE, width * ORB_WIDTH_RATIO);
  const [mode, setMode] = useState(DEFAULT_CHAT_MODE);
  const { stats, loaded: statsLoaded, refetch: refetchStats } = useUserStats();
  const { dayStreak, longestStreak } = stats;
  const [streakRewardModalVisible, setStreakRewardModalVisible] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState(null);
  const [streakInfoModalVisible, setStreakInfoModalVisible] = useState(false);
  const [freeMonthOfferModalVisible, setFreeMonthOfferModalVisible] = useState(false);
  const [proUpgradeVisible, setProUpgradeVisible] = useState(false);
  const consent = useAiConsent();

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
      refetchStats();
    }, [refetchStats])
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

  // Celebrate a streak milestone the first time the cached or fresh streak reaches it
  useEffect(() => {
    if (!statsLoaded || dayStreak <= 0) return;
    (async () => {
      try {
        const milestone = await checkForStreakMilestone(dayStreak);
        if (milestone) {
          setCurrentMilestone(milestone);
          setStreakRewardModalVisible(true);
          await markMilestoneAsShown(milestone.days);
        }
      } catch (error) {
        console.error('Error checking streak milestone:', error);
      }
    })();
  }, [dayStreak, statsLoaded]);

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
        if (await consent.ensureConsent()) router.push(`/voice/${mode}`);
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
            size={orbSize}
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
            if (currentMilestone && isMilestoneWorthAsking(currentMilestone.days)) maybeRequestReview();
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
        {consent.consentModal}
        <FreeMonthOfferModal
          visible={freeMonthOfferModalVisible}
          onClose={() => setFreeMonthOfferModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}
