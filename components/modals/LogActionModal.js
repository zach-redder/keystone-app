import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Dimensions } from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

const LogActionModal = ({ visible, onClose, onSubmit }) => {
  const [action, setAction] = useState('');

  const handleSubmit = () => {
    if (action.trim()) {
      onSubmit(action);
      setAction('');
      onClose();
    }
  };

  const handleClose = () => {
    setAction('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Log an Action</Text>
          <Text style={styles.subtitle}>
            Log an action or decision you made to determine if it aligns with your character.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Your action..."
            placeholderTextColor="#A1A1AA"
            value={action}
            onChangeText={setAction}
            multiline
            numberOfLines={4}
          />
          <Text style={styles.relatedKeys}>Related Keys</Text>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#232323',
    borderRadius: 24,
    padding: 24,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 18,
  },
  input: {
    backgroundColor: '#353535',
    borderRadius: 16,
    color: '#fff',
    fontSize: 16,
    padding: 16,
    minHeight: 80,
    marginBottom: 12,
  },
  relatedKeys: {
    color: '#CCCCCC',
    fontSize: 13,
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#D4DE95',
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#D4DE95',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButtonText: {
    color: '#232323',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    backgroundColor: '#B0B0B0',
    borderRadius: 32,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#232323',
    fontSize: 17,
    fontWeight: '700',
  },
};

export default LogActionModal;
