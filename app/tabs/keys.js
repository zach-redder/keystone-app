import { View, Text, TextInput, Pressable, SafeAreaView, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import keysStyles from '../../styles/keys';
import AlignButton from '../../components/AlignButton';
import Menu from '../../components/Menu';
import InfoModal from '../../components/InfoModal';
import { fetchIdentityKeys } from '../../services/userKeys';

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
    category: 'core_values',
    display: 'core value'
  },
  { 
    label: 'Life Goals', 
    iconName: 'flag',
    category: 'life_goals',
    display: 'life goal'
  },
  { 
    label: 'Future Identity', 
    iconName: 'eye',
    category: 'future_self_vision',
    display: 'future identity'
  },
  { 
    label: 'Identity Traits', 
    iconName: 'person',
    category: 'identity_traits',
    display: 'identity trait'
  },
  { 
    label: 'Motivations', 
    iconName: 'flash',
    category: 'motivations',
    display: 'motivation'
  },
  { 
    label: 'Avoidances', 
    iconName: 'warning',
    category: 'avoidances',
    display: 'avoidance'
  },
];

export default function Keys() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchorY, setMenuAnchorY] = useState(100);
  const [selectedItem, setSelectedItem] = useState(menuItems[0]); // Track selected item
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoPressed, setInfoPressed] = useState(false);
  const [userKeys, setUserKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const menuBtnRef = useRef(null);

  // Load user keys when component mounts or selected item changes
  useEffect(() => {
    loadUserKeys();
  }, [selectedItem]);

  const loadUserKeys = async () => {
    try {
      setLoading(true);
      const keys = await fetchIdentityKeys();
      setUserKeys(keys || []);
    } catch (error) {
      console.error('Error loading user keys:', error);
      setUserKeys([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter keys by current selected category
  const getCurrentCategoryKeys = () => {
    return userKeys.filter(key => key.category === selectedItem.category);
  };

  // Render keys for current category
  const renderCategoryKeys = () => {
    if (loading) {
      return (
        <View style={keysStyles.inputRow}>
          <Text style={keysStyles.starterText}>Loading...</Text>
        </View>
      );
    }

    const categoryKeys = getCurrentCategoryKeys();
    
    if (categoryKeys.length === 0) {
      return (
        <View style={keysStyles.inputRow}>
          <Text style={keysStyles.starterText}>
            Add your first {selectedItem.display}!
          </Text>
        </View>
      );
    }

    return categoryKeys.map((key, index) => (
      <View key={key.id || index} style={keysStyles.inputRow}>
        <TextInput
          placeholder="Enter value..."
          placeholderTextColor="#aaa"
          style={keysStyles.input}
          value={key.description}
          editable={false}
        />
        <Pressable style={keysStyles.trashWrap}>
          <Image source={require('../../assets/delete.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
        </Pressable>
      </View>
    ));
  };

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

        <AppButton
            title={`New ${selectedItem.label == 'Future Identity' ? 'Future Identity' : selectedItem.label.slice(0, -1)}`}
            style={keysStyles.newCoreValueBtn}
            iconRight={"+"}
            plusMarginRight={0}
          />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={keysStyles.scrollView}>  

          <Text style={keysStyles.subSectionTitle}>My {selectedItem.label}</Text>

          {renderCategoryKeys()}

        </ScrollView>

        <AlignButton onPress={() => {}} />
      </View>

      <InfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} />
    </SafeAreaView>
  );
}