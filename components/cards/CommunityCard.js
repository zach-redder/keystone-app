import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getUserCommunityComparison } from '../../services/features/communityService';

const CommunityCard = ({ onJoinPress }) => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadCommunityComparison();
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadCommunityComparison = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await getUserCommunityComparison();
      setComparison(data);
    } catch (err) {
      console.error('Error loading community comparison:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleExploreCommunity = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Call the onPress handler if provided, otherwise open link directly
      if (onJoinPress) {
        onJoinPress();
      } else {
        const whopLink = 'https://discord.me/thealignedcore';
        await Linking.openURL(whopLink);
      }
    } catch (error) {
      console.error('Error opening community link:', error);
    }
  };

  const getComparisonText = () => {
    if (loading) {
      return "Calculating your community standing...";
    }
    
    if (error || !comparison) {
      return "Join our community of aligned individuals.";
    }

    if (comparison.isAboveAverage) {
      return `You're more aligned than ${comparison.percentile}% of Keystone users. Support others by sharing your journey.`;
    } else {
      return `Most Keystone users are ${comparison.differencePercent}% more aligned. Be supported in your journey.`;
    }
  };



  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        }],
      }}
    >
      <View style={styles.container}>
        <Text style={[styles.comparisonText, { color: '#fff' }]}>
          {getComparisonText()}
        </Text>

                 <TouchableOpacity
           style={styles.exploreButton}
           onPress={handleExploreCommunity}
           activeOpacity={0.8}
         >
           <Text style={styles.exploreButtonText}>Join the Community</Text>
           <Ionicons name="arrow-forward" size={16} color="#1E1E1E" />
         </TouchableOpacity>

        <Text style={styles.subtext}>
          Creators in our community are getting paid for sharing their journey and clipping content.
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = {
  container: {
    backgroundColor: 'rgba(80, 80, 80, 0.45)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 55,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderTopColor: 'rgba(255, 255, 255, 0.20)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },

  comparisonText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: '500',
  },
  exploreButton: {
    backgroundColor: '#B9C096',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#D4DE95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  exploreButtonText: {
    color: '#1E1E1E',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  subtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
};

export default CommunityCard; 