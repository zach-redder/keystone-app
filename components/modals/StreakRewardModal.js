import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function StreakRewardModal({ visible, milestone, onClose }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const emojiScaleAnim = useRef(new Animated.Value(0)).current;
  const emojiRotateAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef([...Array(12)].map(() => ({
    translateY: new Animated.Value(-50),
    translateX: new Animated.Value(0),
    rotate: new Animated.Value(0),
    opacity: new Animated.Value(1)
  }))).current;

  useEffect(() => {
    if (visible && milestone) {
      // Start entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();

      // Animate emoji after a short delay
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(emojiScaleAnim, {
            toValue: 1,
            tension: 150,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(emojiRotateAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(emojiRotateAnim, {
              toValue: -1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(emojiRotateAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            })
          ])
        ]).start();

        // Start confetti animation
        animateConfetti();
        
        // Haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 200);
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.3);
      emojiScaleAnim.setValue(0);
      emojiRotateAnim.setValue(0);
      confettiAnims.forEach(anim => {
        anim.translateY.setValue(-50);
        anim.translateX.setValue(0);
        anim.rotate.setValue(0);
        anim.opacity.setValue(1);
      });
    }
  }, [visible, milestone]);

  const animateConfetti = () => {
    const confettiAnimations = confettiAnims.map((anim, index) => {
      // Random horizontal spread
      const randomX = (Math.random() - 0.5) * screenWidth * 0.8;
      const randomRotation = Math.random() * 720 - 360;
      
      return Animated.parallel([
        Animated.timing(anim.translateY, {
          toValue: screenHeight * 0.7,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateX, {
          toValue: randomX,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: randomRotation,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        })
      ]);
    });

    Animated.parallel(confettiAnimations).start();
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
    });
  };

  if (!milestone) return null;

  const confettiColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.8)" barStyle="light-content" />
      
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        
        {/* Confetti */}
        {confettiAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                backgroundColor: confettiColors[index % confettiColors.length],
                left: screenWidth * 0.1 + (index % 6) * (screenWidth * 0.8 / 6),
                transform: [
                  { translateY: anim.translateY },
                  { translateX: anim.translateX },
                  { rotate: anim.rotate.interpolate({
                    inputRange: [-360, 360],
                    outputRange: ['-360deg', '360deg']
                  }) }
                ],
                opacity: anim.opacity
              }
            ]}
          />
        ))}

        {/* Main content */}
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Emoji */}
          <Animated.View 
            style={[
              styles.emojiContainer,
              {
                transform: [
                  { scale: emojiScaleAnim },
                  { rotate: emojiRotateAnim.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: ['-15deg', '0deg', '15deg']
                  }) }
                ]
              }
            ]}
          >
            <Text style={styles.emoji}>{milestone.emoji}</Text>
          </Animated.View>

          {/* Title */}
          <Text style={[styles.title, { color: milestone.color }]}>
            {milestone.title}
          </Text>

          {/* Days streak */}
          <View style={[styles.streakBadge, { backgroundColor: milestone.color }]}>
            <Text style={styles.streakText}>{milestone.days} Day Streak!</Text>
          </View>

          {/* Message */}
          <Text style={styles.message}>{milestone.message}</Text>

          {/* Continue button */}
          <TouchableOpacity 
            style={[styles.continueButton, { backgroundColor: milestone.color }]}
            onPress={handleClose}
          >
            <Text style={styles.continueButtonText}>Keep Going! 🚀</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    width: '90%',
    maxWidth: 350,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  emojiContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  emoji: {
    fontSize: 80,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 15,
  },
  streakBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  streakText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: '#333',
    marginBottom: 30,
  },
  continueButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});