import React, { useState, useCallback } from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import globalStyles from '../../styles/global';
import homeStyles from '../../styles/home';
import StreakCounter from '../../components/cards/StreakCounter';
import { KEY_CATEGORIES } from '../../constants/keyCategories';
import {
  fetchChatPairCountsByMode,
  fetchTotalAIChatMessagePairCount,
  fetchCurrentWeekAIChatMessagePairCount,
} from '../../services/features/affirmationService';
import { fetchIdentityKeys } from '../../services/user/userKeys';
import {
  getUserDayStreak,
  getUserLongestStreak,
  getUserActiveDays,
  getUserDailyActivityCounts,
} from '../../services/user/userPreferences';

const WEEKS_SHOWN = 8;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_COLUMN_HEIGHT = 70;

// Keys added per week for the last WEEKS_SHOWN weeks, oldest first
const buildKeysAddedByWeek = (keys) => {
  const now = Date.now();
  const buckets = Array.from({ length: WEEKS_SHOWN }, (_, i) => ({ weeksAgo: WEEKS_SHOWN - 1 - i, count: 0 }));
  keys.forEach(key => {
    const weeksAgo = Math.floor((now - new Date(key.created_at).getTime()) / (7 * MS_PER_DAY));
    const bucket = buckets.find(item => item.weeksAgo === weeksAgo);
    if (bucket) bucket.count += 1;
  });
  return buckets;
};

export default function StatsScreen() {
  const [loaded, setLoaded] = useState(false);
  const [dayStreak, setDayStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [activeDays, setActiveDays] = useState([]);
  const [dailyActivityCounts, setDailyActivityCounts] = useState({});
  const [weekChats, setWeekChats] = useState(0);
  const [totalChats, setTotalChats] = useState(0);
  const [modeCounts, setModeCounts] = useState({ affirm: 0, question: 0 });
  const [keys, setKeys] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [streak, longest, days, daily, week, total, modes, userKeys] = await Promise.all([
          getUserDayStreak().catch(() => 0),
          getUserLongestStreak().catch(() => 0),
          getUserActiveDays().catch(() => []),
          getUserDailyActivityCounts().catch(() => ({})),
          fetchCurrentWeekAIChatMessagePairCount(),
          fetchTotalAIChatMessagePairCount(),
          fetchChatPairCountsByMode(),
          fetchIdentityKeys().catch(() => []),
        ]);
        if (!active) return;
        setDayStreak(streak);
        setLongestStreak(longest);
        setActiveDays(days);
        setDailyActivityCounts(daily);
        setWeekChats(week);
        setTotalChats(total);
        setModeCounts(modes);
        setKeys(userKeys || []);
        setLoaded(true);
      })();
      return () => { active = false; };
    }, [])
  );

  const keysPerCategory = KEY_CATEGORIES.map(item => ({
    label: item.label,
    count: keys.filter(key => key.category === item.category).length,
  }));
  const maxCategoryCount = Math.max(1, ...keysPerCategory.map(item => item.count));

  const keysByWeek = buildKeysAddedByWeek(keys);
  const maxWeekCount = Math.max(1, ...keysByWeek.map(item => item.count));

  const modeTotal = modeCounts.affirm + modeCounts.question;
  const affirmShare = modeTotal === 0 ? 0 : (modeCounts.affirm / modeTotal) * 100;

  return (
    <SafeAreaView style={globalStyles.pageBg}>
      <View style={globalStyles.pageBg}>
        <View style={globalStyles.headerRow}>
          <Text style={globalStyles.header}>Stats</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <StreakCounter activeDays={activeDays} dailyActivityCounts={dailyActivityCounts} />

          <View style={homeStyles.analyticsRow}>
            <View style={homeStyles.analyticsCard}>
              <View style={homeStyles.analyticsHeader}>
                <Ionicons name="flame" size={20} color="#D4DE95" />
                <Text style={homeStyles.analyticsCardTitle}>Streak</Text>
              </View>
              <Text style={homeStyles.analyticsNumber}>{dayStreak}</Text>
              <Text style={homeStyles.analyticsLabel}>best {longestStreak}</Text>
            </View>
            <View style={homeStyles.analyticsCard}>
              <View style={homeStyles.analyticsHeader}>
                <Ionicons name="chatbubbles" size={20} color="#D4DE95" />
                <Text style={homeStyles.analyticsCardTitle}>Chats</Text>
              </View>
              <Text style={homeStyles.analyticsNumber}>{weekChats}</Text>
              <Text style={homeStyles.analyticsLabel}>this week</Text>
            </View>
          </View>

          <View style={homeStyles.analyticsRow}>
            <View style={homeStyles.analyticsCard}>
              <View style={homeStyles.analyticsHeader}>
                <Ionicons name="calendar" size={20} color="#D4DE95" />
                <Text style={homeStyles.analyticsCardTitle}>Days reflected</Text>
              </View>
              <Text style={homeStyles.analyticsNumber}>{activeDays.length}</Text>
              <Text style={homeStyles.analyticsLabel}>all time</Text>
            </View>
            <View style={homeStyles.analyticsCard}>
              <View style={homeStyles.analyticsHeader}>
                <Ionicons name="key" size={20} color="#D4DE95" />
                <Text style={homeStyles.analyticsCardTitle}>Keys</Text>
              </View>
              <Text style={homeStyles.analyticsNumber}>{keys.length}</Text>
              <Text style={homeStyles.analyticsLabel}>{totalChats} chats total</Text>
            </View>
          </View>

          <View style={homeStyles.statsCard}>
            <Text style={homeStyles.statsCardTitle}>Between certainty and doubt</Text>
            <Text style={homeStyles.statsCardSubtitle}>
              How you split your reflection: affirming who you are vs. questioning who you are becoming.
            </Text>
            {modeTotal === 0 ? (
              <Text style={homeStyles.emptyText}>Have a conversation to see your balance.</Text>
            ) : (
              <>
                <View style={homeStyles.balanceTrack}>
                  <View style={[homeStyles.balanceAffirm, { width: `${affirmShare}%` }]} />
                  <View style={[homeStyles.balanceQuestion, { width: `${100 - affirmShare}%` }]} />
                </View>
                <View style={homeStyles.balanceLegend}>
                  <Text style={homeStyles.balanceLegendText}>Affirm {modeCounts.affirm}</Text>
                  <Text style={homeStyles.balanceLegendText}>Question {modeCounts.question}</Text>
                </View>
              </>
            )}
          </View>

          <View style={homeStyles.statsCard}>
            <Text style={homeStyles.statsCardTitle}>Keys by category</Text>
            <Text style={homeStyles.statsCardSubtitle}>What you have defined about yourself so far.</Text>
            {!loaded || keys.length === 0 ? (
              <Text style={homeStyles.emptyText}>{loaded ? 'No keys yet. Add some in the Keys tab.' : 'Loading...'}</Text>
            ) : (
              keysPerCategory.map(item => (
                <View key={item.label} style={homeStyles.barRow}>
                  <Text style={homeStyles.barLabel}>{item.label}</Text>
                  <View style={homeStyles.barTrack}>
                    <View style={[homeStyles.barFill, { width: `${(item.count / maxCategoryCount) * 100}%` }]} />
                  </View>
                  <Text style={homeStyles.barValue}>{item.count}</Text>
                </View>
              ))
            )}
          </View>

          <View style={homeStyles.statsCard}>
            <Text style={homeStyles.statsCardTitle}>Keys added</Text>
            <Text style={homeStyles.statsCardSubtitle}>Per week, last {WEEKS_SHOWN} weeks.</Text>
            <View style={homeStyles.columnChart}>
              {keysByWeek.map(item => (
                <View key={item.weeksAgo} style={homeStyles.columnWrap}>
                  <View style={[homeStyles.column, { height: Math.max(4, (item.count / maxWeekCount) * MAX_COLUMN_HEIGHT) }]} />
                  <Text style={homeStyles.columnLabel}>{item.weeksAgo === 0 ? 'now' : `-${item.weeksAgo}w`}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
