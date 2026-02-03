import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import keysStyles from '../../styles/keys';
import {
  updateUserName,
  getUserName,
} from '../../services/user/userPreferences';

const EditProfileModal = ({ visible, onClose, userEmail }) => {
  const [email, setEmail] = useState(userEmail || '');
  const [name, setName] = useState('');
  const [initialName, setInitialName] = useState('');

  // Fetch fresh name + phone every time modal opens
  useEffect(() => {
    const loadProfile = async () => {
      const fetchedName = await getUserName();
      setName(fetchedName);
      setInitialName(fetchedName);
    };

    if (visible) {
      setEmail(userEmail || '');
      loadProfile();
    }
  }, [visible, userEmail]);

  const handleSave = async () => {
    let updated = false;

    if (name !== initialName) {
      await updateUserName(name);
      updated = true;
    }

    if (updated) {
      const fetchedName = await getUserName();
      setName(fetchedName);
      setInitialName(fetchedName);
    }

    onClose();
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
              <Text style={keysStyles.infoSectionTitle}>Edit Profile</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={[keysStyles.infoContent, { paddingTop: 10 }]}> 
              {/* Email */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                  Email
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#3a3a3a',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: '#fff',
                    borderWidth: 1,
                    borderColor: '#555',
                  }}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="Email"
                  placeholderTextColor="#888"
                />
              </View>

              {/* Name */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                  Name
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#3a3a3a',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: '#fff',
                    borderWidth: 1,
                    borderColor: '#555',
                  }}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholder="Full Name"
                  placeholderTextColor="#888"
                />
              </View>
            </View>
            <View style={styles.buttonColumn}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    marginBottom: 100,
  },
  buttonColumn: {
    width: '100%',
    marginTop: 0,
    marginBottom: 0,
    gap: 10,
  },
  saveButton: {
    backgroundColor: '#B9C096',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 10,
  },
  saveButtonText: {
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

export default EditProfileModal;
