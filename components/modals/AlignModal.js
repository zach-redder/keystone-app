import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Dimensions, PanResponder, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AffirmIdentityModal from './AffirmIdentityModal';
import LogActionModal from './LogActionModal';
import ActionLogResultModal from './ActionLogResultModal';
import ShareProgressModal from './ShareProgressModal';
import ProUpgradeModal from './ProUpgradeModal';
import { checkUserProStatus } from '../../services/auth';
import { fetchTodaysActionLogCount } from '../../services/actionLogs';

const { height: screenHeight } = Dimensions.get('window');

const AlignModal = ({ visible, onClose, onUpgradePress, onAffirmIdentity, onLogActionResult }) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const dragOffset = useRef(new Animated.Value(0)).current;
  const isClosing = useRef(false);
  const [showLogActionModal, setShowLogActionModal] = useState(false);
  const [showShareProgressModal, setShowShareProgressModal] = useState(false);
  const [showProUpgradeModal, setShowProUpgradeModal] = useState(false);

  // Animation refs for sequential icon fade-ins
  const affirmIconAnim = useRef(new Animated.Value(0)).current;
  const logIconAnim = useRef(new Animated.Value(0)).current;
  const shareIconAnim = useRef(new Animated.Value(0)).current;
  
  // Button press animations
  const affirmScaleAnim = useRef(new Animated.Value(1)).current;
  const logScaleAnim = useRef(new Animated.Value(1)).current;
  const shareScaleAnim = useRef(new Animated.Value(1)).current;

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

  // Enhanced button press handlers with smooth animations
  const createButtonPressHandler = (scaleAnim, callback, hapticType = Haptics.ImpactFeedbackStyle.Medium) => {
    return () => {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          useNativeDriver: true,
          tension: 200,
          friction: 8,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 8,
        }),
      ]).start();
      
      Haptics.impactAsync(hapticType);
      setTimeout(callback, 100); // Small delay for animation feedback
    };
  };

  const handleAffirmIdentity = createButtonPressHandler(
    affirmScaleAnim,
    () => {
      console.log('AlignModal: Affirm Identity clicked');
      if (onAffirmIdentity) onAffirmIdentity();
    }
  );

  const handleLogAction = createButtonPressHandler(
    logScaleAnim,
    async () => {
      // Check if user is pro
      const isPro = await checkUserProStatus();
      
      if (!isPro) {
        // Check daily limit for free users (3 per day)
        const todaysCount = await fetchTodaysActionLogCount();
        if (todaysCount >= 3) {
          // Close current modal and show ProUpgradeModal
          closeModal();
          setTimeout(() => {
            setShowProUpgradeModal(true);
          }, 300);
          return;
        }
      }
      
      // User is pro or under limit, allow action logging
      setShowLogActionModal(true);
    }
  );

  const handleLogActionClose = () => {
    setShowLogActionModal(false);
    // Close the entire modal flow after logging action
    onClose();
  };

  const handleShareProgress = createButtonPressHandler(
    shareScaleAnim,
    () => {
      setShowShareProgressModal(true);
    }
  );

  const handleShareProgressClose = () => {
    setShowShareProgressModal(false);
    onClose();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeModal();
  };

  useEffect(() => {
    if (visible) {
      // Reset values and closing flag
      slideAnim.setValue(screenHeight);
      overlayOpacity.setValue(0);
      dragOffset.setValue(0);
      isClosing.current = false;
      
      // Reset icon animations
      affirmIconAnim.setValue(0);
      logIconAnim.setValue(0);
      shareIconAnim.setValue(0);
      
      // Opening animation - slide up from bottom
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Sequential icon fade-ins with staggered delays
        Animated.stagger(150, [
          Animated.spring(affirmIconAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(logIconAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(shareIconAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
        ]).start();
      });
    } else {
      // Reset icon animations when modal closes
      affirmIconAnim.setValue(0);
      logIconAnim.setValue(0);
      shareIconAnim.setValue(0);
    }
  }, [visible]);

  return (
    <>
      <Modal
        visible={visible && !showLogActionModal && !showShareProgressModal}
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
              <Text style={styles.title}>Align Yourself</Text>

              {/* Description */}
              <Text style={styles.description}>
                Choose how you want to align with your identity and values.
              </Text>
            </View>

            {/* Action buttons - separate from draggable area */}
            <View style={styles.buttonContainer}>
              <Animated.View style={{ 
                opacity: affirmIconAnim,
                transform: [
                  { scale: affirmScaleAnim },
                  { 
                    translateY: affirmIconAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })
                  }
                ]
              }}>
                <TouchableOpacity style={styles.actionButton} onPress={handleAffirmIdentity}>
                  <Ionicons name="heart" size={20} color="#D4DE95" style={styles.buttonIcon} />
                  <Text style={styles.actionButtonText}>Affirm Identity</Text>
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View style={{ 
                opacity: logIconAnim,
                transform: [
                  { scale: logScaleAnim },
                  { 
                    translateY: logIconAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })
                  }
                ]
              }}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLogAction}>
                  <Ionicons name="pencil" size={20} color="#D4DE95" style={styles.buttonIcon} />
                  <Text style={styles.actionButtonText}>Log Action</Text>
                </TouchableOpacity>
              </Animated.View>

              {/* <Animated.View style={{
                opacity: shareIconAnim,
                transform: [
                  { scale: shareScaleAnim },
                  { 
                    translateY: shareIconAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })
                  }
                ]
              }}>
                <TouchableOpacity style={styles.actionButton} onPress={handleShareProgress}>
                  <Ionicons name="share-social" size={20} color="#D4DE95" style={styles.buttonIcon} />
                  <Text style={styles.actionButtonText}>Share Progress</Text>
                </TouchableOpacity>
              </Animated.View> */}
              
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      <LogActionModal
        visible={showLogActionModal}
        onClose={handleLogActionClose}
        onSubmit={(log) => {
          setShowLogActionModal(false);
          // Wait for modal close animation, then show result
          setTimeout(() => {
            // Pass the result back to parent for display
            if (onLogActionResult) {
              onLogActionResult(log);
            }
            onClose();
          }, 300);
        }}
        onUpgradePress={onUpgradePress}
      />

      <ShareProgressModal
        visible={showShareProgressModal}
        onClose={handleShareProgressClose}
      />
      
      <ProUpgradeModal
        visible={showProUpgradeModal}
        onClose={() => setShowProUpgradeModal(false)}
      />
    </>
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
    minHeight: screenHeight * 0.35,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    color: '#A1A1AA',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 16,
  },
  actionButton: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#D4DE95',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(212, 222, 149, 0.2)',
  },
  buttonIcon: {
    marginRight: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#555',
    borderRadius: 25,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
};

export default AlignModal;
