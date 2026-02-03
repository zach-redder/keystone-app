import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import ShareProgressCard from './ShareProgressCard';

const ShareProgressCardDemo = () => {
  const [selectedTheme, setSelectedTheme] = useState('dark');

  const themes = [
    { id: 'dark', name: 'Dark Theme', color: '#D4DE95' },
    { id: 'light', name: 'Light Theme', color: '#2B2B2B' },
    { id: 'builder', name: 'Builder Theme', color: '#3b82f6' },
  ];

  const demoData = [
    {
      dayNumber: 7,
      label: "Monk Mode",
      quote: "Discipline is choosing between what you want now and what you want most.",
      streakPercent: 0.85,
    },
    {
      dayNumber: 21,
      label: "Product Sprint",
      quote: "The best time to plant a tree was 20 years ago. The second best time is now.",
      streakPercent: 0.95,
    },
    {
      dayNumber: 30,
      label: "Fitness Journey",
      quote: "Strength does not come from the physical capacity. It comes from an indomitable will.",
      streakPercent: 0.75,
    },
    {
      dayNumber: 100,
      label: "Meditation",
      quote: "Peace comes from within. Do not seek it without.",
      streakPercent: 0.90,
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Share Progress Card Demo</Text>
        <Text style={styles.subtitle}>Digital Trophy & Badge Designs</Text>
      </View>

      {/* Theme Selector */}
      <View style={styles.themeSelector}>
        <Text style={styles.sectionTitle}>Choose Theme</Text>
        <View style={styles.themeButtons}>
          {themes.map((theme) => (
            <TouchableOpacity
              key={theme.id}
              style={[
                styles.themeButton,
                selectedTheme === theme.id && styles.selectedThemeButton,
                { borderColor: theme.color }
              ]}
              onPress={() => setSelectedTheme(theme.id)}
            >
              <Text style={[
                styles.themeButtonText,
                selectedTheme === theme.id && { color: theme.color }
              ]}>
                {theme.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Card Examples */}
      <View style={styles.cardsContainer}>
        <Text style={styles.sectionTitle}>Card Variants</Text>
        
        {demoData.map((data, index) => (
          <View key={index} style={styles.cardWrapper}>
            <Text style={styles.cardLabel}>
              Example {index + 1}: {data.label}
            </Text>
            <View style={styles.cardContainer}>
              <ShareProgressCard
                dayNumber={data.dayNumber}
                label={data.label}
                quote={data.quote}
                theme={selectedTheme}
                streakPercent={data.streakPercent}
                showQuote={true}
                showProgress={true}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Feature Highlights */}
      <View style={styles.featuresContainer}>
        <Text style={styles.sectionTitle}>Design Features</Text>
        
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🏆</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Digital Trophy Design</Text>
              <Text style={styles.featureDescription}>
                Looks like a badge of honor that users want to share
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎨</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Multiple Themes</Text>
              <Text style={styles.featureDescription}>
                Dark, Light, and Builder themes for different vibes
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📱</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Story-Optimized</Text>
              <Text style={styles.featureDescription}>
                9:16 aspect ratio perfect for Instagram Stories
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚡</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Dynamic Progress</Text>
              <Text style={styles.featureDescription}>
                Visual progress bars with motivational status text
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💎</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Premium Branding</Text>
              <Text style={styles.featureDescription}>
                Subtle "Made with Keystone" footer for viral marketing
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
  },
  themeSelector: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedThemeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  cardsContainer: {
    marginBottom: 30,
  },
  cardWrapper: {
    marginBottom: 24,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4DE95',
    marginBottom: 12,
    textAlign: 'center',
  },
  cardContainer: {
    alignItems: 'center',
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#A1A1AA',
    lineHeight: 20,
  },
});

export default ShareProgressCardDemo; 