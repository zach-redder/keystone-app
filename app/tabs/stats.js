import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import globalStyles from '../../styles/global';
import homeStyles from '../../styles/home';
import StreakCounter from '../../components/cards/StreakCounter';
import HeaderStreakShare from '../../components/common/HeaderStreakShare';
import { KEY_CATEGORIES } from '../../constants/keyCategories';
import useUserStats from '../../hooks/useUserStats';
import useIdentityKeys from '../../hooks/useIdentityKeys';

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
  const { stats, loaded: statsLoaded } = useUserStats();
  const { keys, loaded: keysLoaded } = useIdentityKeys();
  const loaded = statsLoaded && keysLoaded;

  const { dayStreak, longestStreak, activeDays, dailyCounts: dailyActivityCounts, total: totalChats, week: weekChats, modeCounts } = stats;

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
          <HeaderStreakShare dayStreak={dayStreak} longestStreak={longestStreak} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
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

          <StreakCounter activeDays={activeDays} dailyActivityCounts={dailyActivityCounts} />

          <View style={homeStyles.analyticsRow}>
            <View style={homeStyles.analyticsCard}>
              <View style={homeStyles.analyticsHeader}>
                <Ionicons name="flame" size={20} color="#D4DE95" />
                <Text style={homeStyles.analyticsCardTitle}>Longest streak</Text>
              </View>
              <Text style={homeStyles.analyticsNumber}>{longestStreak}</Text>
              <Text style={homeStyles.analyticsLabel}>days</Text>
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
