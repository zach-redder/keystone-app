import { View, Text, TextInput, Pressable, SafeAreaView, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef } from 'react';
import keysStyles from '../../styles/keys';
import AlignButton from '../../components/AlignButton';
import Menu from '../../components/Menu';
import InfoModal from '../../components/InfoModal';

function AppButton({ title, onPress, style, icon, iconRight, plusMarginRight }) {
  return (
    <Pressable onPress={onPress} style={[keysStyles.button, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        {icon && <Text style={keysStyles.buttonIcon}>{icon}</Text>}
        <Text style={keysStyles.buttonText}>{title}</Text>
        {iconRight && (
          <Image source={require('../../assets/plus.png')} style={{ ...keysStyles.plusImage, marginRight: plusMarginRight }} />
        )}
      </View>
    </Pressable>
  );
}

const menuItems = [
  { 
    label: 'Core Values', 
    iconName: 'diamond',
  },
  { 
    label: 'Life Goals', 
    iconName: 'flag'
  },
  { 
    label: 'Identity Traits', 
    iconName: 'person'
  },
  { 
    label: 'Future Identity', 
    iconName: 'eye'
  },
  { 
    label: 'Motivations', 
    iconName: 'flash'
  },
  { 
    label: 'Avoidances', 
    iconName: 'warning'
  },
];

export default function Keys() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchorY, setMenuAnchorY] = useState(100);
  const [selectedItem, setSelectedItem] = useState(menuItems[0]); // Track selected item
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoPressed, setInfoPressed] = useState(false);
  const menuBtnRef = useRef(null);

  const handleMenuPress = () => {
    if (menuBtnRef.current) {
      menuBtnRef.current.measure((fx, fy, width, height, px, py) => {
        setMenuAnchorY(py + height);
        setMenuVisible(true);
      });
    } else {
      setMenuVisible(true);
    }
  };

  const handleMenuItemSelect = (item) => {
    setSelectedItem(item);
    setMenuVisible(false);
  };

  const handleInfoPress = () => {
    setInfoPressed(true);
    // Add a small delay to show the pressed state before opening the modal
    setTimeout(() => {
      setInfoPressed(false);
      setInfoVisible(true);
    }, 50);
  };

  return (
    <SafeAreaView style={keysStyles.pageBg}>
      <View style={keysStyles.pageBg}>
        <View style={keysStyles.headerRow}>
          <Text style={keysStyles.header}>Your Keys</Text>
          <View style={keysStyles.proBadgeWrap}>
            <Text style={keysStyles.proBadge}>PRO</Text>
          </View>
        </View>

        <View style={keysStyles.sectionRow}>
          <TouchableOpacity
            ref={menuBtnRef}
            style={[
              { 
                flexDirection: 'row', 
                alignItems: 'center', 
                height: 50,
                backgroundColor: '#2b2b2b',
                paddingHorizontal: 8,
                marginLeft: 2,
                borderRadius: 14,
              }, 
              menuVisible && { 
                opacity: 0.7,
                backgroundColor: '#353535', 
              }
            ]}
            activeOpacity={0.7}
            onPress={handleMenuPress}
          >
            <Ionicons 
              name={selectedItem.iconName} 
              size={24} 
              color="#fff" 
              style={keysStyles.mainIcon} 
            />
            <Text style={keysStyles.sectionTitle}>{selectedItem.label}</Text>
            <View style={keysStyles.chevronWrap}>
              <Ionicons name="chevron-up" size={20} color="#fff" style={{ marginBottom: -3 }} />
              <Ionicons name="chevron-down" size={20} color="#fff" style={{ marginTop: -3 }} />
            </View>
          </TouchableOpacity>
          <Pressable 
            style={[
              keysStyles.infoIconWrap, 
              infoPressed && keysStyles.infoIconPressed
            ]} 
            onPress={handleInfoPress}
          >
            <Ionicons 
              name="information-circle-outline" 
              size={20} 
              color={infoPressed ? "#fff" : "#2b2b2b"} 
              style={keysStyles.infoIcon} 
            />
          </Pressable>
        </View>

        <Menu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          items={menuItems.map(item => ({ ...item, active: item.label === selectedItem.label }))}
          anchorY={menuAnchorY}
          onItemSelect={handleMenuItemSelect}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={keysStyles.scrollView}>  
          <AppButton
            title={`New ${selectedItem.label == 'Future Identity' ? 'Future Identity' : selectedItem.label.slice(0, -1)}`}
            style={keysStyles.newCoreValueBtn}
            iconRight={"+"}
            plusMarginRight={0}
          />

          <Text style={keysStyles.subSectionTitle}>My {selectedItem.label}</Text>

          <View style={keysStyles.inputRow}>
            <Text style={keysStyles.starterText}>
              Press 'New {selectedItem.label == 'Future Identity' ? 'Future Identity' : selectedItem.label.slice(0, -1)}'
            </Text>
          </View>

          <View style={keysStyles.inputRow}>
            <TextInput
              placeholder="Enter value..."
              placeholderTextColor="#aaa"
              style={keysStyles.input}
            />
            <Pressable style={keysStyles.trashWrap}>
              <Image source={require('../../assets/delete.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
            </Pressable>
          </View>

          <Text style={keysStyles.subSectionTitle}>AI Suggestions</Text>
          <View style={keysStyles.suggestionRow}>
            <View style={keysStyles.suggestionBox}>
              <Text style={keysStyles.suggestionText}>Open-Mindedness</Text>
              <Pressable style={keysStyles.suggestionAdd}><Text style={keysStyles.suggestionAddText}>+ Add</Text></Pressable>
            </View>
            <View style={keysStyles.suggestionBox}>
              <Text style={keysStyles.suggestionText}>Fitness</Text>
              <Pressable style={keysStyles.suggestionAdd}><Text style={keysStyles.suggestionAddText}>+ Add</Text></Pressable>
            </View>
          </View>

        </ScrollView>

        <AlignButton onPress={() => {}} />
      </View>

      <InfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} />
    </SafeAreaView>
  );
}