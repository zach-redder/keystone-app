import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import globalStyles from '../../styles/global';
import keysStyles from '../../styles/keys';
import homeStyles from '../../styles/home';
import StreakInfoModal from '../modals/StreakInfoModal';
import { getAppStoreLink, APP_NAME } from '../../constants/appStore';

const shareApp = async () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  try {
    const appStoreLink = getAppStoreLink();
    await Share.share({
      message: `Check out ${APP_NAME} - the app that helps you overcome doubt and become your best self! Download it here: ${appStoreLink}`,
      url: appStoreLink,
      title: `${APP_NAME} - Overcome Doubt`,
    });
  } catch (error) {
    console.error('Error sharing app:', error);
  }
};

// Streak badge (opens the streak info sheet) + share icon, shared by the tab headers
export default function HeaderStreakShare({ dayStreak, longestStreak }) {
  const [infoVisible, setInfoVisible] = useState(false);

  return (
    <>
      <View style={globalStyles.headerButtons}>
        <TouchableOpacity
          style={homeStyles.streakBadgeWrap}
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setInfoVisible(true);
          }}
        >
          <Ionicons name="flame" size={16} color="#D4DE95" />
          <Text style={homeStyles.streakBadge}>{dayStreak}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={keysStyles.shareButton} onPress={shareApp} accessibilityLabel="Share Keystone">
          <Ionicons name="share-outline" size={28} color="#CCCCCC" />
        </TouchableOpacity>
      </View>
      <StreakInfoModal
        visible={infoVisible}
        currentStreak={dayStreak}
        longestStreak={longestStreak}
        onClose={() => setInfoVisible(false)}
      />
    </>
  );
}
