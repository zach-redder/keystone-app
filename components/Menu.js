import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import menuStyles from '../styles/Menu';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

const Menu = ({ visible, onClose, items, anchorY = 100, onItemSelect }) => {
  const handleItemPress = (item) => {
    onItemSelect(item);
  };

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
            <TouchableOpacity
              key={item.label}
              style={[menuStyles.item, item.active && menuStyles.itemActive, idx === items.length - 1 && { marginBottom: 0 }]}
              onPress={() => handleItemPress(item)}
            >
              <Ionicons name={item.iconName} size={24} color="#fff" style={menuStyles.icon} />
              <Text style={[menuStyles.label, item.active && menuStyles.labelActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default Menu;