import React from 'react';
import { Modal, TouchableOpacity, View, Text, Image, Dimensions } from 'react-native';
import menuStyles from '../../styles/Menu';

const { width: screenWidth } = Dimensions.get('window');

export default function Menu({ visible, onClose, items, anchorY = 100 }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={menuStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[menuStyles.container, { top: anchorY, left: 20, width: screenWidth / 2 }]}> 
          {items.map((item, idx) => (
            <View
              key={item.label}
              style={[menuStyles.item, item.active && menuStyles.itemActive, idx === items.length - 1 && { marginBottom: 0 }]}
            >
              <Image source={item.icon} style={menuStyles.icon} resizeMode="contain" />
              <Text style={[menuStyles.label, item.active && menuStyles.labelActive]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
} 