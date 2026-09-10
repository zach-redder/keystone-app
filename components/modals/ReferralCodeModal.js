import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import keysStyles from '../../styles/keys';
import {
  validateReferralCode,
  redeemReferralCode,
  hasUserUsedReferralCode,
} from '../../services/user/referralService';
import { supabase } from '../../lib/supabase';

const VALIDATE_DEBOUNCE_MS = 500;

const ReferralCodeModal = ({ visible, onClose, onRedeemed }) => {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);
  const [alreadyRedeemed, setAlreadyRedeemed] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!visible) return;

    setCode('');
    setIsValid(false);
    setMessage('');
    setMessageIsError(false);
    setCheckingStatus(true);

    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAlreadyRedeemed(await hasUserUsedReferralCode(user.id));
      }
      setCheckingStatus(false);
    };
    checkStatus();
  }, [visible]);

  const validateCode = async (value) => {
    if (!value || value.length < 3) {
      setMessage('');
      setIsValid(false);
      return;
    }

    setIsValidating(true);
    try {
      const validation = await validateReferralCode(value);
      if (validation.valid && validation.referralCode) {
        setIsValid(true);
        setMessageIsError(false);
        const type = validation.referralCode.subscription_type;
        const typeLabel = type === 'monthly' ? '1 month' : type === 'yearly' ? '1 year' : 'lifetime';
        setMessage(`Valid code! Get ${typeLabel} of Pro access.`);
      } else {
        setIsValid(false);
        setMessageIsError(true);
        setMessage(validation.error || 'Invalid code');
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
      setIsValid(false);
      setMessageIsError(true);
      setMessage('Error validating code');
    } finally {
      setIsValidating(false);
    }
  };

  const handleChangeCode = (text) => {
    setCode(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => validateCode(text), VALIDATE_DEBOUNCE_MS);
  };

  const handleRedeem = async () => {
    if (!isValid || isRedeeming) return;

    setIsRedeeming(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await redeemReferralCode(code);
      setMessageIsError(!result.success);
      setMessage(result.message);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onRedeemed?.();
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch (error) {
      console.error('Error redeeming referral code:', error);
      setMessageIsError(true);
      setMessage('Something went wrong. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={keysStyles.infoModalContainer}>
          <View style={keysStyles.horizontalBar} />
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={keysStyles.infoSectionTitle}>Enter Referral Code</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {checkingStatus ? (
              <ActivityIndicator size="small" color="#B9C096" style={{ marginTop: 24 }} />
            ) : alreadyRedeemed ? (
              <Text style={styles.infoText}>
                You've already redeemed a referral code on this account.
              </Text>
            ) : (
              <>
                <TextInput
                  style={[
                    styles.input,
                    isValid && { borderColor: '#4CAF50' },
                    message && !isValid && { borderColor: '#F44336' },
                  ]}
                  value={code}
                  onChangeText={handleChangeCode}
                  placeholder="Enter referral code"
                  placeholderTextColor="#888"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isRedeeming}
                />
                {isValidating && (
                  <ActivityIndicator size="small" color="#B9C096" style={{ marginTop: 8 }} />
                )}
                {!!message && (
                  <Text style={[styles.messageText, messageIsError ? styles.errorText : styles.successText]}>
                    {message}
                  </Text>
                )}
              </>
            )}
          </View>

          {!checkingStatus && !alreadyRedeemed && (
            <View style={styles.buttonColumn}>
              <TouchableOpacity
                style={[styles.redeemButton, (!isValid || isRedeeming) && styles.redeemButtonDisabled]}
                onPress={handleRedeem}
                disabled={!isValid || isRedeeming}
              >
                {isRedeeming ? (
                  <ActivityIndicator size="small" color="#232323" />
                ) : (
                  <Text style={styles.redeemButtonText}>Redeem</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = {
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 0,
    paddingBottom: 20,
    paddingTop: 15,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 15,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
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
  messageText: {
    marginTop: 10,
    fontSize: 14,
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#F44336',
  },
  infoText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 24,
    textAlign: 'center',
  },
  buttonColumn: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  redeemButton: {
    backgroundColor: '#B9C096',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  redeemButtonDisabled: {
    opacity: 0.5,
  },
  redeemButtonText: {
    color: '#232323',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
};

export default ReferralCodeModal;
