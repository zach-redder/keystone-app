import { View, Text, Modal, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { submitMessage } from '../../services/messageService';
import keysStyles from '../../styles/keys';

const ContactReportModal = ({ visible, onClose, type = 'contact' }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing Information', 'Please fill in both subject and message fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitMessage(type, subject.trim(), message.trim());
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      Alert.alert(
        'Message Sent!',
        `Your ${type === 'contact' ? 'message' : 'report'} has been submitted successfully. We'll get back to you soon!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setSubject('');
              setMessage('');
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting message:', error);
      Alert.alert(
        'Error',
        'Failed to submit your message. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubject('');
    setMessage('');
    onClose();
  };

  const isContact = type === 'contact';
  const title = isContact ? 'Contact Us' : 'Report a Problem';
  const placeholder = isContact 
    ? 'Tell us how we can help you...' 
    : 'Describe the problem you encountered...';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={keysStyles.infoModalContainer}>
        <View style={keysStyles.horizontalBar} />
        
        <View style={styles.header}>
          <Text style={keysStyles.infoSectionTitle}>{title}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color="#999" />
          </TouchableOpacity>
        </View>

        <ScrollView style={keysStyles.infoContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder={isContact ? "What's this about?" : "Brief description of the issue"}
              placeholderTextColor="#999"
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              value={message}
              onChangeText={setMessage}
              placeholder={placeholder}
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!isSubmitting}
            />

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Sending...' : `Send ${isContact ? 'Message' : 'Report'}`}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = {
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 5,
    paddingBottom: 10,
    paddingTop: 15,
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
  formContainer: {
    paddingTop: 20,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 20,
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
  messageInput: {
    minHeight: 120,
    maxHeight: 200,
  },
  submitButton: {
    backgroundColor: '#B9C096',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
};

export default ContactReportModal;
