import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import keysStyles from '../../styles/keys';

const EditProfileModal = ({ visible, onClose, userEmail, onSave }) => {
  const [email, setEmail] = useState(userEmail || '');

  useEffect(() => {
    setEmail(userEmail || '');
  }, [userEmail, visible]);

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
          <TouchableOpacity onPress={onClose} style={{ position: 'absolute', right: 18, top: 18, zIndex: 10 }}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={[keysStyles.infoContent, { paddingTop: 10 }]}> 
            <Text style={keysStyles.infoSectionTitle}>Edit Profile</Text>
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Email</Text>
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
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <TouchableOpacity
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 22,
                  borderRadius: 12,
                  backgroundColor: '#444',
                  marginRight: 10,
                }}
                onPress={onClose}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 22,
                  borderRadius: 12,
                  backgroundColor: '#B9C096',
                }}
                onPress={() => { onSave({ email }); onClose(); }}
              >
                <Text style={{ color: '#232323', fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default EditProfileModal;
