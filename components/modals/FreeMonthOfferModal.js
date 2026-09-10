import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getUserEmail } from '../../services/user/userPreferences';
import { isValidEmail } from '../../services/integrations/resendService';
import { grantFreeMonthOffer } from '../../services/user/freeMonthOfferService';

const FreeMonthOfferModal = ({ visible, onClose, onGranted }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setResultMessage('');
    setGranted(false);
    getUserEmail().then(setEmail);
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleSubmit = async () => {
    if (!isValidEmail(email) || isSubmitting) return;

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await grantFreeMonthOffer(email);
      // Always a positive-toned result -- an "already granted" outcome is not an
      // error state, it's just inert (see Rule C in freeMonthOfferService.ts).
      setResultMessage(result.message);
      setGranted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onGranted?.();
    } catch (error) {
      console.error('Error claiming free month offer:', error);
      setResultMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>
          <View style={styles.horizontalBarOuter}>
            <View style={styles.horizontalBar} />
          </View>

          <View style={styles.heroSection}>
            <View style={styles.heroIcon}>
              <Ionicons name="gift" size={48} color="#D4DE95" />
            </View>
            <Text style={styles.heroTitle}>Get 1 Month of Pro, Free</Text>
            <Text style={styles.heroDescription}>
              {granted
                ? resultMessage
                : "Confirm your email and we'll unlock 1 month of Keystone Pro on this account."}
            </Text>
          </View>

          {!granted && (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Your email address"
                placeholderTextColor="#888"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!isSubmitting}
              />
            </View>
          )}

          <View style={styles.buttonColumn}>
            {!granted ? (
              <>
                <TouchableOpacity
                  style={[styles.primaryButton, (!isValidEmail(email) || isSubmitting) && styles.primaryButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={!isValidEmail(email) || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#232323" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Claim My Free Month</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleClose}>
                  <Text style={styles.secondaryButtonText}>Not Now</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.primaryButton} onPress={handleClose}>
                <Text style={styles.primaryButtonText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = {
  modalContainer: {
    flex: 1,
    backgroundColor: '#2B2B2B',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  horizontalBarOuter: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  horizontalBar: {
    width: 48,
    height: 5,
    backgroundColor: '#555',
    borderRadius: 3,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3C3C3C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  form: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#555',
  },
  buttonColumn: {
    width: '100%',
    marginTop: 'auto',
    marginBottom: 24,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#D4DE95',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#232323',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
};

export default FreeMonthOfferModal;
