import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function CreateKeyModal({ visible, onClose, onCreate, keyType }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible) {
      setValue('');
    }
  }, [visible]);

  const handleCreate = () => {
    if (value.trim()) {
      onCreate(value.trim());
      setValue('');
    }
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.centeredView} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.modalView} 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.modalTitle}>Add {keyType}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            multiline={true}
            placeholder={`Enter your ${keyType.toLowerCase()}...`}
            placeholderTextColor="#666"
            autoFocus={true}
            selectionColor="#d4de95"
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.createButton]}
              onPress={handleCreate}
            >
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  modalView: {
    backgroundColor: '#2b2b2b',
    borderRadius: 25,
    padding: 20,
    width: '80%',
    maxWidth: 350,
    marginBottom: 250,
  },
  modalTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  button: {
    borderRadius: 16,
    padding: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#B3B3B3',
  },
  createButton: {
    backgroundColor: '#D4DE95',
  },
  cancelButtonText: {
    color: '#black',
    fontWeight: '600',
    fontSize: 17,
  },
  createButtonText: {
    color: 'black',
    fontSize: 17,
    fontWeight: '600',
  },
});
