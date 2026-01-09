import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Dimensions, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { getSuperwallImplementation } from '../../utils/superwallCompat';

const { usePlacement } = getSuperwallImplementation();

const { height: screenHeight } = Dimensions.get('window');

const ProUpgradeModal = ({ visible, onClose, currentPage }) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const dragOffset = useRef(new Animated.Value(0)).current;
  const isClosing = useRef(false);
  const router = useRouter();
  const { registerPlacement } = usePlacement();

  // Pan responder for drag gestures - applies only to draggable content area
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to downward movement
        return gestureState.dy > 5;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        // Only capture downward gestures
        return gestureState.dy > 5;
      },
      onPanResponderGrant: () => {
        // Set initial offset value
        dragOffset.setOffset(dragOffset._value);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow downward dragging, completely prevent upward movement
        if (gestureState.dy < 0) return; // Block any upward movement
        
        dragOffset.setValue(gestureState.dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Reset offset
        dragOffset.flattenOffset();
        
        // If dragged down significantly, close the modal
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          handleClose();
        } else {
          // Snap back to original position
          Animated.spring(dragOffset, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      slideAnim.setValue(screenHeight);
      overlayOpacity.setValue(0);
      dragOffset.setValue(0);
      isClosing.current = false;
      
      // Animate in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [visible]);

  const handleClose = () => {
    if (isClosing.current) return;
    isClosing.current = true;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: screenHeight,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleUpgradePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      // Close the ProUpgradeModal first
      handleClose();
      
      // Small delay to allow modal to close before opening Superwall paywall
      setTimeout(async () => {
        await registerPlacement({
          placement: 'pro_upgrade',
          feature: () => {
            console.log('User has access to pro features');
          }
        });
      }, 300);
    } catch (error) {
      console.warn('Error presenting paywall:', error);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          opacity: overlayOpacity,
        }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            transform: [
              {
                translateY: Animated.add(slideAnim, dragOffset),
              },
            ],
          }}
          {...panResponder.panHandlers}
        >
          <View
            style={{
              backgroundColor: '#2B2B2B',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 20,
              paddingBottom: 40,
              paddingHorizontal: 20,
              minHeight: 400,
            }}
          >
            {/* Drag indicator */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: '#666',
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 20,
              }}
            />
            
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 30 }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: '#B9C096',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 15,
                }}
              >
                <Ionicons name="star" size={30} color="#2B2B2B" />
              </View>
              
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#fff',
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                Unlock Premium
              </Text>
              
              <Text
                style={{
                  fontSize: 16,
                  color: '#ccc',
                  textAlign: 'center',
                  lineHeight: 22,
                }}
              >
                Get unlimited access to all features and take your alignment to the next level
              </Text>
            </View>
            
            {/* Features list */}
            <View style={{ marginBottom: 30 }}>
              {[
                { icon: 'infinite', text: 'Unlimited daily alignments' },
                { icon: 'sparkles', text: 'Advanced AI feedback' },
                { icon: 'key', text: 'Unlimited identity keys' },
                { icon: 'people', text: 'Community access' },
                { icon: 'trending-up', text: 'Detailed progress insights' },
              ].map((feature, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 15,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: '#B9C096',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 15,
                    }}
                  >
                    <Ionicons name={feature.icon} size={18} color="#2B2B2B" />
                  </View>
                  
                  <Text
                    style={{
                      fontSize: 16,
                      color: '#fff',
                      flex: 1,
                    }}
                  >
                    {feature.text}
                  </Text>
                </View>
              ))}
            </View>
            
            {/* Upgrade button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#B9C096',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                marginBottom: 15,
              }}
              onPress={handleUpgradePress}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#2B2B2B',
                }}
              >
                Upgrade Now
              </Text>
            </TouchableOpacity>
            
            {/* Close button */}
            <TouchableOpacity
              style={{
                paddingVertical: 12,
                alignItems: 'center',
              }}
              onPress={handleClose}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: '#999',
                }}
              >
                Maybe Later
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default ProUpgradeModal; 