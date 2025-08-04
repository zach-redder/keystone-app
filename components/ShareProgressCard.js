import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = Math.min(screenWidth * 0.9, 320);
const CARD_HEIGHT = CARD_WIDTH * (16 / 9); // 9:16 aspect ratio for stories

const ShareProgressCard = ({
  dayNumber = 10,
  label = "Monk Mode",
  quote = "Discipline is choosing between what you want now and what you want most.",
  theme = "dark", // "dark", "light", "builder"
  streakPercent = 0.75,
  showQuote = true,
  showProgress = true,
}) => {
  const themes = {
    dark: {
      background: ['#1a1a1a', '#2B2B2B', '#1a1a1a'],
      cardBg: 'rgba(43, 43, 43, 0.95)',
      primaryColor: '#D4DE95',
      secondaryColor: '#B9C096',
      textColor: '#ffffff',
      subtitleColor: '#A1A1AA',
      accentColor: '#FF6B35',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      progressBg: '#444',
      progressFill: '#D4DE95',
    },
    light: {
      background: ['#f8f9fa', '#ffffff', '#f8f9fa'],
      cardBg: 'rgba(255, 255, 255, 0.95)',
      primaryColor: '#2B2B2B',
      secondaryColor: '#444',
      textColor: '#1a1a1a',
      subtitleColor: '#666',
      accentColor: '#FF6B35',
      borderColor: 'rgba(0, 0, 0, 0.1)',
      progressBg: '#e9ecef',
      progressFill: '#2B2B2B',
    },
    builder: {
      background: ['#1e3a8a', '#3b82f6', '#1e3a8a'],
      cardBg: 'rgba(30, 58, 138, 0.95)',
      primaryColor: '#ffffff',
      secondaryColor: '#93c5fd',
      textColor: '#ffffff',
      subtitleColor: '#cbd5e1',
      accentColor: '#fbbf24',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      progressBg: '#1e40af',
      progressFill: '#fbbf24',
    },
  };

  const currentTheme = themes[theme];

  const getProgressColor = () => {
    if (streakPercent >= 0.8) return currentTheme.accentColor;
    if (streakPercent >= 0.6) return currentTheme.primaryColor;
    return currentTheme.secondaryColor;
  };

  const getProgressEmoji = () => {
    if (streakPercent >= 0.9) return '🔥';
    if (streakPercent >= 0.7) return '⚡';
    if (streakPercent >= 0.5) return '💪';
    return '🎯';
  };

  const getProgressText = () => {
    if (streakPercent >= 0.9) return 'UNSTOPPABLE';
    if (streakPercent >= 0.7) return 'ON FIRE';
    if (streakPercent >= 0.5) return 'STRONG';
    return 'BUILDING';
  };

  return (
    <View style={[styles.container, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
      {/* Premium gradient background */}
      <LinearGradient
        colors={currentTheme.background}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Main content card */}
      <View style={[styles.contentCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.borderColor }]}>
        
        {/* Header with app branding */}
        <View style={styles.header}>
          <View style={styles.appBrand}>
            <View style={[styles.appIcon, { backgroundColor: currentTheme.primaryColor }]}>
              <Ionicons name="diamond" size={16} color={currentTheme.cardBg} />
            </View>
            <Text style={[styles.appName, { color: currentTheme.primaryColor }]}>Keystone</Text>
          </View>
          <Text style={[styles.appTagline, { color: currentTheme.subtitleColor }]}>Elite Discipline</Text>
        </View>

        {/* Main achievement content */}
        <View style={styles.mainContent}>
          {/* Achievement badge */}
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: currentTheme.primaryColor }]}>
              <Text style={styles.badgeEmoji}>{getProgressEmoji()}</Text>
            </View>
          </View>

          {/* Achievement title */}
          <Text style={[styles.achievementTitle, { color: currentTheme.textColor }]}>
            Day {dayNumber} of {label}
          </Text>

          {/* Progress indicator */}
          {showProgress && (
            <View style={styles.progressSection}>
              <View style={[styles.progressBar, { backgroundColor: currentTheme.progressBg }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${streakPercent * 100}%`,
                      backgroundColor: getProgressColor()
                    }
                  ]} 
                />
                <View 
                  style={[
                    styles.progressIndicator,
                    { 
                      left: `${Math.min(streakPercent * 100, 95)}%`,
                      backgroundColor: getProgressColor()
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.progressText, { color: getProgressColor() }]}>
                {getProgressText()}
              </Text>
            </View>
          )}

          {/* Motivational quote */}
          {showQuote && quote && (
            <View style={styles.quoteContainer}>
              <Text style={[styles.quote, { color: currentTheme.subtitleColor }]}>
                "{quote}"
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Ionicons name="diamond" size={12} color={currentTheme.subtitleColor} />
            <Text style={[styles.footerText, { color: currentTheme.subtitleColor }]}>
              Made with Keystone
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  contentCard: {
    flex: 1,
    margin: 12,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  appTagline: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    marginBottom: 20,
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeEmoji: {
    fontSize: 32,
  },
  achievementTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    position: 'relative',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  progressIndicator: {
    position: 'absolute',
    top: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  quoteContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
  },
  quote: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default ShareProgressCard; 