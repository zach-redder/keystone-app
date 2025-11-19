import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

export default function EditKeyModal({ visible, onClose, onSave, initialValue, keyType }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible && initialValue) {
      setValue(initialValue);
    }
  }, [visible, initialValue]);

  const handleSave = () => {
    onSave(value);
    setValue('');
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <BlurView intensity={20} tint="dark" style={styles.centeredView}>
        <TouchableOpacity
          style={styles.blurOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            style={styles.modalView}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Edit {keyType}</Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              multiline={true}
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
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalView: {
    backgroundColor: 'rgba(80, 80, 80, 0.45)',
    borderRadius: 25,
    padding: 20,
    width: '80%',
    maxWidth: 350,
    marginBottom: 250,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderTopColor: 'rgba(255, 255, 255, 0.20)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
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
  saveButton: {
    backgroundColor: '#D4DE95',
  },
  cancelButtonText: {
    color: '#black',
    fontWeight: '600',
    fontSize: 17,
  },
  saveButtonText: {
    color: 'black',
    fontSize: 17,
    fontWeight: '600',
  },
}); 