import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import ShareProgressCard from './ShareProgressCard';
import ShareProgressCardEnhanced from './ShareProgressCardEnhanced';

const { width: screenWidth } = Dimensions.get('window');

const ShareProgressCardShowcase = () => {
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [selectedVariant, setSelectedVariant] = useState('standard');
  const [selectedComponent, setSelectedComponent] = useState('enhanced');

  const themes = [
    { id: 'dark', name: 'Dark', color: '#D4DE95' },
    { id: 'light', name: 'Light', color: '#2B2B2B' },
    { id: 'builder', name: 'Builder', color: '#3b82f6' },
    { id: 'minimal', name: 'Minimal', color: '#ffffff' },
    { id: 'gradient', name: 'Gradient', color: '#667eea' },
  ];

  const variants = [
    { id: 'standard', name: 'Standard' },
    { id: 'minimal', name: 'Minimal' },
    { id: 'trophy', name: 'Trophy' },
    { id: 'achievement', name: 'Achievement' },
  ];

  const components = [
    { id: 'basic', name: 'Basic Card' },
    { id: 'enhanced', name: 'Enhanced Card' },
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

  const renderCard = (data, index) => {
    const props = {
      dayNumber: data.dayNumber,
      label: data.label,
      quote: data.quote,
      theme: selectedTheme,
      streakPercent: data.streakPercent,
      showQuote: true,
      showProgress: true,
      animated: true,
    };

    if (selectedComponent === 'enhanced') {
      return (
        <ShareProgressCardEnhanced
          {...props}
          variant={selectedVariant}
        />
      );
    } else {
      return <ShareProgressCard {...props} />;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Share Progress Card Showcase</Text>
        <Text style={styles.subtitle}>Digital Trophy & Badge Designs</Text>
      </View>

      {/* Component Selector */}
      <View style={styles.selectorSection}>
        <Text style={styles.sectionTitle}>Component Type</Text>
        <View style={styles.selectorButtons}>
          {components.map((component) => (
            <TouchableOpacity
              key={component.id}
              style={[
                styles.selectorButton,
                selectedComponent === component.id && styles.selectedSelectorButton,
              ]}
              onPress={() => setSelectedComponent(component.id)}
            >
              <Text style={[
                styles.selectorButtonText,
                selectedComponent === component.id && styles.selectedSelectorButtonText,
              ]}>
                {component.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Theme Selector */}
      <View style={styles.selectorSection}>
        <Text style={styles.sectionTitle}>Theme</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeScroll}>
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
        </ScrollView>
      </View>

      {/* Variant Selector (only for enhanced component) */}
      {selectedComponent === 'enhanced' && (
        <View style={styles.selectorSection}>
          <Text style={styles.sectionTitle}>Variant</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.variantScroll}>
            {variants.map((variant) => (
              <TouchableOpacity
                key={variant.id}
                style={[
                  styles.variantButton,
                  selectedVariant === variant.id && styles.selectedVariantButton,
                ]}
                onPress={() => setSelectedVariant(variant.id)}
              >
                <Text style={[
                  styles.variantButtonText,
                  selectedVariant === variant.id && styles.selectedVariantButtonText,
                ]}>
                  {variant.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Card Examples */}
      <View style={styles.cardsContainer}>
        <Text style={styles.sectionTitle}>Card Examples</Text>
        
        {demoData.map((data, index) => (
          <View key={index} style={styles.cardWrapper}>
            <Text style={styles.cardLabel}>
              Example {index + 1}: {data.label} (Day {data.dayNumber})
            </Text>
            <View style={styles.cardContainer}>
              {renderCard(data, index)}
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
                Looks like a badge of honor that users want to share on social media
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎨</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Multiple Themes</Text>
              <Text style={styles.featureDescription}>
                5 different themes: Dark, Light, Builder, Minimal, and Gradient
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📱</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Story-Optimized</Text>
              <Text style={styles.featureDescription}>
                9:16 aspect ratio perfect for Instagram Stories, TikTok, and other social platforms
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚡</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Animated Progress</Text>
              <Text style={styles.featureDescription}>
                Smooth animations for progress bars and status indicators
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎯</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Dynamic Status</Text>
              <Text style={styles.featureDescription}>
                Progress-based emojis and status text (UNSTOPPABLE, ON FIRE, etc.)
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💎</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Viral Marketing</Text>
              <Text style={styles.featureDescription}>
                Subtle "Made with Keystone" branding for organic growth
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎪</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Multiple Variants</Text>
              <Text style={styles.featureDescription}>
                Standard, Minimal, Trophy, and Achievement variants for different use cases
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔧</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Highly Customizable</Text>
              <Text style={styles.featureDescription}>
                Props for day number, label, quote, progress, themes, and variants
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Usage Instructions */}
      <View style={styles.usageContainer}>
        <Text style={styles.sectionTitle}>Usage</Text>
        <View style={styles.usageContent}>
          <Text style={styles.usageText}>
            <Text style={styles.usageBold}>Basic Usage:</Text>{'\n'}
            {'<ShareProgressCard dayNumber={7} label="Monk Mode" />'}
          </Text>
          
          <Text style={styles.usageText}>
            <Text style={styles.usageBold}>Enhanced Usage:</Text>{'\n'}
            {'<ShareProgressCardEnhanced\n'}
            {'  dayNumber={21}\n'}
            {'  label="Product Sprint"\n'}
            {'  theme="builder"\n'}
            {'  variant="trophy"\n'}
            {'  animated={true}\n'}
            {'/>'}
          </Text>
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
  },
  selectorSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  selectorButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: '#444',
  },
  selectedSelectorButton: {
    backgroundColor: 'rgba(212, 222, 149, 0.1)',
    borderColor: '#D4DE95',
  },
  selectorButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  selectedSelectorButtonText: {
    color: '#D4DE95',
  },
  themeScroll: {
    marginBottom: 8,
  },
  themeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 12,
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
  variantScroll: {
    marginBottom: 8,
  },
  variantButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: '#444',
  },
  selectedVariantButton: {
    backgroundColor: 'rgba(212, 222, 149, 0.1)',
    borderColor: '#D4DE95',
  },
  variantButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  selectedVariantButtonText: {
    color: '#D4DE95',
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
  usageContainer: {
    marginBottom: 30,
  },
  usageContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  usageText: {
    fontSize: 12,
    color: '#A1A1AA',
    fontFamily: 'monospace',
    lineHeight: 18,
    marginBottom: 12,
  },
  usageBold: {
    color: '#D4DE95',
    fontWeight: '600',
  },
});

export default ShareProgressCardShowcase; 