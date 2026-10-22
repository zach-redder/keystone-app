import { View, Text, Modal, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { deleteUserAccount } from '../../services/auth/auth';
import { useRouter } from 'expo-router';
import keysStyles from '../../styles/keys';

const styles = {
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '88%',
    backgroundColor: '#2B2B2B',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 6,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconLabel: {
    marginLeft: 8,
    color: '#FF5757',
    fontSize: 15,
    fontWeight: '500',
  },
  bodyText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  subtleText: {
    color: '#AAAAAA',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
  },
  subscriptionBox: {
    backgroundColor: 'rgba(212, 222, 149, 0.10)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 222, 149, 0.35)',
  },
  subscriptionText: {
    color: '#D4DE95',
    fontSize: 13,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  secondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#555555',
    backgroundColor: '#3A3A3A',
  },
  secondaryButtonText: {
    color: '#DDDDDD',
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#D4DE95',
  },
  primaryButtonText: {
    color: '#1F1F1F',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#FF5757',
  },
  dangerButtonText: {
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
};

const DeleteAccountModal = ({ visible, onClose }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState(1); // 1 = warning, 2 = subscription, 3 = final delete

  const handleDelete = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsDeleting(true);

    try {
      await deleteUserAccount();

      // Navigate to Welcome page (route groups are handled automatically)
      router.replace('/onboarding/Welcome');

      Alert.alert(
        'Account deleted',
        'Your account and data have been removed.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error deleting account:', error);
      setIsDeleting(false);

      Alert.alert(
        'Could not delete account',
        'Please try again later or contact support.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(1);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>
              {step === 1 && 'Before you delete'}
              {step === 2 && 'Subscriptions'}
              {step === 3 && 'Delete account'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} disabled={isDeleting}>
              <Ionicons name="close" size={20} color={isDeleting ? '#666' : '#999'} />
            </TouchableOpacity>
          </View>

          {step === 1 && (
            <>
              <View style={styles.iconRow}>
                <Ionicons name="warning" size={20} color="#FF5757" />
                <Text style={styles.iconLabel}>Permanent action</Text>
              </View>
              <Text style={styles.bodyText}>
                Deleting your account erases your identity keys, conversations, streaks, reminders, and all saved progress. This can’t be undone.
              </Text>
              <Text style={styles.subtleText}>
                If something isn’t working, you can also reach out through Contact Us in your profile.
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleClose}
                  disabled={isDeleting}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setStep(2);
                  }}
                  disabled={isDeleting}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <View style={styles.subscriptionBox}>
                <Text style={styles.subscriptionText}>
                  Subscriptions are managed by Apple or Google. Deleting your Keystone account does{' '}
                  not cancel billing. You must cancel any active subscription in your device’s
                  subscription settings.
                </Text>
              </View>
              <Text style={styles.subtleText}>
                iOS: Settings → Your Name → Subscriptions.{'\n'}
                Android: Play Store → Profile → Payments & subscriptions.
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setStep(1);
                  }}
                  disabled={isDeleting}
                >
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setStep(3);
                  }}
                  disabled={isDeleting}
                >
                  <Text style={styles.primaryButtonText}>I understand</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <View style={styles.iconRow}>
                <Ionicons name="trash-outline" size={20} color="#FF5757" />
                <Text style={styles.iconLabel}>Ready to delete?</Text>
              </View>
              <Text style={styles.bodyText}>
                This will sign you out and remove your account and data from Keystone.
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleClose}
                  disabled={isDeleting}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    styles.dangerButton,
                    isDeleting && styles.disabledButton,
                  ]}
                  onPress={handleDelete}
                  disabled={isDeleting}
                >
                  <Text
                    style={[styles.primaryButtonText, styles.dangerButtonText]}
                  >
                    {isDeleting ? 'Deleting…' : 'Delete my account'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default DeleteAccountModal;
