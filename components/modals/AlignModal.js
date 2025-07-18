import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Dimensions, PanResponder } from 'react-native';
import * as Haptics from 'expo-haptics';
import AffirmIdentityModal from './AffirmIdentityModal';
import LogActionModal from './LogActionModal';
import { checkUserProStatus } from '../../services/auth';
import { fetchTodaysActionLogCount } from '../../services/actionLogs';

const { height: screenHeight } = Dimensions.get('window');

const AlignModal = ({ visible, onClose, onUpgradePress }) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const dragOffset = useRef(new Animated.Value(0)).current;
  const isClosing = useRef(false);
  const [showAffirmIdentityModal, setShowAffirmIdentityModal] = useState(false);
  const [showLogActionModal, setShowLogActionModal] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(false);

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

  const handleAffirmIdentity = () => {
    console.log('AlignModal: Affirm Identity clicked');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAffirmIdentityModal(true);
  };

  const handleLogAction = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCheckingLimit(true);
    try {
      const isPro = await checkUserProStatus();
      if (!isPro) {
        const count = await fetchTodaysActionLogCount();
        console.log('AlignModal: count', count);
        if (count >= 2) {
          setCheckingLimit(false);
          if (onUpgradePress) onUpgradePress();
          return;
        }
      }
      setShowLogActionModal(true);
    } catch (e) {
      // fallback: open upgrade modal if error
      if (onUpgradePress) onUpgradePress();
    } finally {
      setCheckingLimit(false);
    }
  };

  const handleLogActionClose = () => {
    setShowLogActionModal(false);
    // Close the entire modal flow after logging action
    onClose();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeModal();
  };

  const handleAffirmIdentityClose = () => {
    console.log('AlignModal: AffirmIdentityModal is closing');
    setShowAffirmIdentityModal(false);
    // Close the entire modal flow after affirmation
    console.log('AlignModal: Closing parent modal');
    onClose();
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
  }, [visible]);

  return (
    <>
      <Modal
        visible={visible && !showAffirmIdentityModal && !showLogActionModal}
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
              <TouchableOpacity style={styles.actionButton} onPress={handleAffirmIdentity}>
                <Text style={styles.actionButtonText}>Affirm Identity</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={handleLogAction}>
                <Text style={styles.actionButtonText}>Log Action</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      <AffirmIdentityModal
        visible={showAffirmIdentityModal}
        onClose={handleAffirmIdentityClose}
      />

      <LogActionModal
        visible={showLogActionModal}
        onClose={handleLogActionClose}
        onUpgradePress={onUpgradePress}
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
    shadowColor: '#D4DE95',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
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
