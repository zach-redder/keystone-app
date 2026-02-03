import React, { useRef } from 'react';
import { Pressable, View, Text, Image, Animated, Easing, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import alignButtonStyles from '../../styles/AlignButton';


export default function AlignButton({ onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const shadowAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.92,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.85,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(shadowAnim, {
        toValue: 0.9,
        useNativeDriver: false,
        speed: 20,
        bounciness: 4,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Reset and play ripple
    rippleAnim.setValue(0);
    Animated.timing(rippleAnim, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.08,
          useNativeDriver: true,
          speed: 20,
          bounciness: 14,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.spring(shadowAnim, {
          toValue: 1.08,
          useNativeDriver: false,
          speed: 20,
          bounciness: 14,
        }),
      ]),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 14,
          bounciness: 5,
        }),
        Animated.spring(shadowAnim, {
          toValue: 1,
          useNativeDriver: false,
          speed: 14,
          bounciness: 5,
        }),
      ]),
    ]).start();
  };

  const handlePress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onPress?.();
  };

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 2],
  });

  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.3, 0.15, 0],
  });

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={alignButtonStyles.alignBtn}
    >
      <View style={styles.centerWrap}>
        <Animated.View
          style={[
            styles.ripple,
            {
              transform: [{ scale: rippleScale }],
              opacity: rippleOpacity,
            },
          ]}
        />
        <Animated.View
          style={[
            {
              shadowColor: '#D4DE95',
              shadowOpacity: 0.5,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: shadowAnim.interpolate({
                inputRange: [0.9, 1.08],
                outputRange: [2, 10],
              }),
              elevation: 8,
            },
          ]}
        >
          <Animated.View
            style={[
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <View style={alignButtonStyles.alignContent}>
              <Image
                source={require('../../assets/images/icons/checkmark.png')}
                style={alignButtonStyles.plusImage}
              />
              <Text style={alignButtonStyles.alignText}>Align Now</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 240,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D4DE95',
    zIndex: -1,
  },
});