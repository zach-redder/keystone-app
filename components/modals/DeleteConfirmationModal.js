import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

export default function DeleteConfirmationModal({ visible, onClose, onConfirm }) {
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
    alignItems: 'center',
    width: '80%',
    maxWidth: 350,
    height: 185,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderTopColor: 'rgba(255, 255, 255, 0.20)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
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