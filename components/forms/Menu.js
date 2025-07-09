import { View, Text, TouchableOpacity, Modal, Dimensions, Animated } from 'react-native';
import menuStyles from '../../styles/Menu';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';

const { width: screenWidth } = Dimensions.get('window');

const Menu = ({ visible, onClose, items, anchorY = 100, onItemSelect }) => {
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset values first
      slideAnim.setValue(-20);
      opacityAnim.setValue(0);
      
      // Opening animation - slide down and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Closing animation - slide up and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleItemPress = (item) => {
    onItemSelect(item);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={menuStyles.overlay} activeOpacity={1} onPress={onClose}>
        <Animated.View 
          style={[
            menuStyles.container, 
            { 
              top: anchorY, 
              left: 20, 
              width: screenWidth / 2,
              transform: [
                { 
                  translateY: slideAnim 
                }
              ],
              opacity: opacityAnim,
            }
          ]}
        > 
          {items.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[menuStyles.item, item.active && menuStyles.itemActive, idx === items.length - 1 && { marginBottom: 0 }]}
              onPress={() => handleItemPress(item)}
            >
              <Ionicons name={item.iconName} size={24} color="#fff" style={menuStyles.icon} />
              <Text style={[menuStyles.label, item.active && menuStyles.labelActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

export default Menu;