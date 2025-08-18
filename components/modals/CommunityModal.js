import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Dimensions, PanResponder, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: screenHeight } = Dimensions.get('window');

const CommunityModal = ({ visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const dragOffset = useRef(new Animated.Value(0)).current;
  const isClosing = useRef(false);

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
        dragOffset.flattenOffset();
        
        // If dragged down more than 80px or with sufficient velocity, close modal
        if (gestureState.dy > 80 || gestureState.vy > 0.3) {
          closeModal();
        } else {
          // Snap back to original position
          Animated.timing(dragOffset, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const closeModal = () => {
    if (isClosing.current) return;
    isClosing.current = true;
    
    // Animate the modal off screen smoothly
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset values after animation completes
      dragOffset.setValue(0);
      isClosing.current = false;
      onClose();
    });
  };

  const handleJoinCommunity = async () => {
    try {
      await Linking.openURL('https://whop.com/the-aligned-core');
      closeModal();
    } catch (error) {
      console.error('Error opening Whop link:', error);
      // Still close modal even if link fails
      closeModal();
    }
  };

  useEffect(() => {
    if (visible) {
      // Reset values and closing flag
      slideAnim.setValue(screenHeight);
      overlayOpacity.setValue(0);
      dragOffset.setValue(0);
      isClosing.current = false;
      
      // Opening animation - slide up from bottom
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // Note: We don't handle closing animation here anymore - closeModal handles it
  }, [visible]);

  const communityPerks = [
    'Exclusive community discussions',
    'Clip content for rewards',
    'Early access to new features',
    'Connect with like-minded people',
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={styles.overlayTouchable} activeOpacity={1} onPress={closeModal} />
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [
                { translateY: Animated.add(slideAnim, dragOffset) }
              ]
            }
          ]}
        >
          {/* Draggable content area */}
          <View {...panResponder.panHandlers}>
            {/* Draggable handle area */}
            <View style={styles.handleArea}>
              <View style={styles.handleBar} />
            </View>

            {/* Title */}
            <Text style={styles.title}>Join The Aligned Core</Text>

            {/* Community Perks */}
            <View style={styles.perksContainer}>
              {communityPerks.map((perk) => (
                <View key={perk} style={styles.perkRow}>
                  <Ionicons name="people" size={20} color="#D4DE95" style={styles.perkIcon} />
                  <Text style={styles.perkText}>{perk}</Text>
                </View>
              ))}
            </View>

            {/* Thank you message */}
            <Text style={styles.thankYouText}>
              Connect with others on their journey to achieve their dreams and get exclusive perks.
            </Text>
          </View>

          {/* Join Community button - completely separate from draggable area */}
          <TouchableOpacity style={styles.joinButton} onPress={handleJoinCommunity}>
            <Text style={styles.joinButtonText}>Join Community</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#2B2B2B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    minHeight: screenHeight * 0.55,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#555',
    borderRadius: 2,
    alignSelf: 'center',
  },
  handleArea: {
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  perksContainer: {
    marginBottom: 20,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  perkIcon: {
    marginRight: 12,
  },
  perkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  thankYouText: {
    color: '#A1A1AA',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 32,
  },
  joinButton: {
    backgroundColor: '#D4DE95',
    borderRadius: 35,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#D4DE95',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 12,
  },
  joinButtonText: {
    color: '#2B2B2B',
    fontSize: 18,
    fontWeight: '700',
  },
};

export default CommunityModal;
