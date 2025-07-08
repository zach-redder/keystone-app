import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function DeleteConfirmationModal({ visible, onClose, onConfirm }) {
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
          <Text style={styles.modalText}>Are you sure you want{'\n'}to delete?</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={onConfirm}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
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
    alignItems: 'center',
    width: '80%',
    maxWidth: 350,
    height: 185,
    justifyContent: 'center',
  },
  modalText: {
    color: 'white',
    fontSize: 20,
    marginBottom: 40,
    textAlign: 'center',
    
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 16,
    padding: 12,
    flex: 1,
    marginHorizontal: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#B3B3B3',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  cancelButtonText: {
    color: '#2b2b2b',
    fontSize: 17,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});