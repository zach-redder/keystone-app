import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = Math.min(screenWidth * 0.7, 280); // Slightly larger for better preview
const CARD_HEIGHT = CARD_WIDTH * (16 / 9); // 9:16 aspect ratio to match capture dimensions

const ShareProgressCardEnhanced = ({
  dayNumber = 10,
  label = "Core Values",
  quote = "Discipline is choosing between what you want now and what you want most.",
  theme = "dark", // "dark", "light", "builder", "minimal", "gradient"
  streakPercent = 0.75,
  showQuote = true,
  showProgress = true,
  variant = "standard", // "standard", "minimal", "trophy", "achievement"
  animated = true,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: streakPercent,
          duration: 1200,
          delay: 400,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
      progressAnim.setValue(streakPercent);
    }
  }, [animated, streakPercent]);

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
    minimal: {
      background: ['#000000', '#111111', '#000000'],
      cardBg: 'rgba(0, 0, 0, 0.9)',
      primaryColor: '#ffffff',
      secondaryColor: '#888888',
      textColor: '#ffffff',
      subtitleColor: '#666666',
      accentColor: '#ffffff',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      progressBg: '#333333',
      progressFill: '#ffffff',
    },
    gradient: {
      background: ['#667eea', '#764ba2', '#667eea'],
      cardBg: 'rgba(102, 126, 234, 0.95)',
      primaryColor: '#ffffff',
      secondaryColor: '#e0e7ff',
      textColor: '#ffffff',
      subtitleColor: '#cbd5e1',
      accentColor: '#fbbf24',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      progressBg: '#4c63d2',
      progressFill: '#fbbf24',
    },
  };

  const currentTheme = themes[theme] || themes.dark;

  const getProgressColor = () => {
    if (streakPercent >= 0.8) return currentTheme.accentColor;
    if (streakPercent >= 0.6) return currentTheme.primaryColor;
    return currentTheme.secondaryColor;
  };

  const getProgressText = () => {
    if (streakPercent >= 0.9) return 'UNSTOPPABLE';
    if (streakPercent >= 0.7) return 'ON FIRE';
    if (streakPercent >= 0.5) return 'STRONG';
    return 'BUILDING';
  };

  const getAlignmentStatus = (value) => {
    if (value === null) return 'No data';
    if (value < 0.1) return 'Very Deficient';
    if (value < 0.2) return 'Deficient';
    if (value < 0.3) return 'Somewhat Deficient';
    if (value < 0.4) return 'Somewhat Aligned';
    if (value < 0.45) return 'Aligned';
    if (value < 0.5) return 'Very Aligned';
    if (value < 0.55) return 'Very Aligned';
    if (value < 0.6) return 'Aligned';
    if (value < 0.7) return 'Somewhat Aligned';
    if (value < 0.8) return 'Somewhat Excessive';
    if (value < 0.9) return 'Excessive';
    if (value < 1) return 'Very Excessive';
    return 'Excessive';
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'trophy':
        return {
          container: { borderWidth: 0 },
          contentCard: { backgroundColor: currentTheme.cardBg },
          achievementTitle: { fontSize: 18, fontWeight: '800' },
        };
      case 'achievement':
        return {
          container: { borderWidth: 0 },
          contentCard: { backgroundColor: currentTheme.cardBg },
          achievementTitle: { fontSize: 16, fontWeight: '700' },
        };
      case 'minimal':
        return {
          container: { borderWidth: 0 },
          contentCard: { backgroundColor: 'transparent' },
          achievementTitle: { fontSize: 14, fontWeight: '600' },
        };
      default:
        return {
          container: { borderWidth: 0 },
          contentCard: {},
          achievementTitle: { fontSize: 16, fontWeight: '700' },
        };
    }
  };

  const variantStyles = getVariantStyles();

  const renderMinimalVariant = () => (
    <Animated.View style={[styles.container, { width: CARD_WIDTH, height: CARD_HEIGHT }, variantStyles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={currentTheme.background}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={[styles.contentCard, variantStyles.contentCard]}>
        <View style={styles.minimalHeader}>
          <Text style={[styles.minimalAppName, { color: currentTheme.primaryColor }]}>KEYSTONE</Text>
        </View>

        <View style={styles.minimalContent}>
          <Text style={[styles.minimalTitle, { color: currentTheme.textColor }]}>
            {dayNumber}
          </Text>
          <Text style={[styles.minimalLabel, { color: currentTheme.subtitleColor }]}>
            {label}
          </Text>

          {showProgress && (
            <View style={styles.minimalProgress}>
              <View style={[styles.minimalProgressBar, { backgroundColor: currentTheme.progressBg }]}>
                <Animated.View 
                  style={[
                    styles.minimalProgressFill, 
                    { 
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: getProgressColor()
                    }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.minimalFooter}>
          <Text style={[styles.minimalFooterText, { color: currentTheme.subtitleColor }]}>
            Made with Keystone
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderStandardVariant = () => (
    <Animated.View style={[styles.container, { width: CARD_WIDTH, height: CARD_HEIGHT }, variantStyles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={currentTheme.background}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={[styles.contentCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.borderColor }, variantStyles.contentCard]}>
        <View style={styles.header}>
          <View style={styles.appBrand}>
            <Text style={[styles.appName, { color: currentTheme.primaryColor }]}>Keystone</Text>
          </View>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: currentTheme.primaryColor }, variantStyles.badge]}>
              <Text style={[styles.badgeText, { color: currentTheme.cardBg }]}>{dayNumber}</Text>
            </View>
          </View>

          <Text style={[styles.achievementTitle, { color: currentTheme.textColor }, variantStyles.achievementTitle]}>
            {label}
          </Text>

          {showProgress && (
            <View style={styles.progressSection}>
              <View style={[styles.progressBar, { backgroundColor: currentTheme.progressBg }]}>
                <Animated.View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
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

          {showQuote && quote && (
            <View style={styles.quoteContainer}>
              <Text style={[styles.quote, { color: currentTheme.subtitleColor }]}>
                "{quote}"
              </Text>
            </View>
          )}
        </View>

                 <View style={styles.footer}>
           <View style={styles.footerContent}>
             <Image 
               source={require('../../assets/images/logos/keystone.png')} 
               style={styles.logo} 
               resizeMode="contain"
             />
             <Text style={[styles.footerText, { color: currentTheme.subtitleColor }]}>
               Made with Keystone
             </Text>
           </View>
         </View>
      </View>
    </Animated.View>
  );

  if (variant === 'minimal') {
    return renderMinimalVariant();
  }

  return renderStandardVariant();
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  contentCard: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  appBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appName: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    marginBottom: 12,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    fontSize: 18,
    fontWeight: '800',
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    width: '70%',
    height: 4,
    borderRadius: 2,
    marginBottom: 6,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  quoteContainer: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
  },
  quote: {
    fontSize: 9,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 12,
  },
     footerContent: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 4,
   },
     logo: {
     width: 12,
     height: 12,
   },
   footerText: {
     fontSize: 8,
     fontWeight: '500',
     letterSpacing: 0.5,
   },
  // Minimal variant styles
  minimalHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  minimalAppName: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 2,
  },
  minimalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimalTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 2,
  },
  minimalLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  minimalProgress: {
    width: '100%',
    alignItems: 'center',
  },
  minimalProgressBar: {
    width: '50%',
    height: 2,
    borderRadius: 1,
  },
  minimalProgressFill: {
    height: '100%',
    borderRadius: 1,
  },
  minimalFooter: {
    alignItems: 'center',
  },
  minimalFooterText: {
    fontSize: 6,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
});

export default ShareProgressCardEnhanced; 