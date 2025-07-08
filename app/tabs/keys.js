import { View, Text, Pressable, SafeAreaView, TouchableOpacity, Image, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState, useRef, useEffect } from 'react';
import keysStyles from '../../styles/keys';
import AlignModal from '../../components/AlignModal';
import AlignButton from '../../components/AlignButton';
import Menu from '../../components/Menu';
import InfoModal from '../../components/InfoModal';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import EditKeyModal from '../../components/EditKeyModal';
import CreateKeyModal from '../../components/CreateKeyModal';
import ProUpgradeModal from '../../components/ProUpgradeModal';
import CommunityModal from '../../components/CommunityModal';
import { fetchIdentityKeys, deleteIdentityKey, updateIdentityKey, addIdentityKey } from '../../services/userKeys';
import { checkUserProStatus } from '../../services/auth';

function AppButton({ title, onPress, style, icon, iconRight, plusMarginRight, animatedStyle }) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const pressOpacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(pressScale, {
        toValue: 0.96,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(pressOpacity, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    // Trigger onPress when finger is released
    if (onPress) {
      onPress();
    }
    
    Animated.parallel([
      Animated.timing(pressScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(pressOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const combinedAnimatedStyle = [
    animatedStyle,
    {
      transform: [
        ...(animatedStyle?.transform || []),
        { scale: pressScale }
      ],
      opacity: pressOpacity,
    }
  ];

  return (
    <Animated.View style={combinedAnimatedStyle}>
      <Pressable 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[keysStyles.button, style]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          {icon && <Text style={keysStyles.buttonIcon}>{icon}</Text>}
          <Text style={keysStyles.buttonText}>{title}</Text>
          {iconRight && (
            <Image source={require('../../assets/plus.png')} style={{ ...keysStyles.plusImage, marginRight: plusMarginRight }} />
          )}
        </View>
      </Pressable>
    </Animated.View>
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
  const [selectedItem, setSelectedItem] = useState(menuItems[0]);
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoPressed, setInfoPressed] = useState(false);
  const [userKeys, setUserKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [proModalVisible, setProModalVisible] = useState(false);
  const [communityModalVisible, setCommunityModalVisible] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);
  const [keyToEdit, setKeyToEdit] = useState(null);
  const [badgeText, setBadgeText] = useState('PRO');
  const menuBtnRef = useRef(null);
  const [alignModalVisible, setAlignModalVisible] = useState(false);

  // Load user keys when component mounts or selected item changes
  useEffect(() => {
    loadUserKeys();
    checkProStatus();
  }, [selectedItem]);

  const checkProStatus = async () => {
    try {
      const isPro = await checkUserProStatus();
      setBadgeText(isPro ? 'COMMUNITY' : 'PRO');
    } catch (error) {
      console.error('Error checking Pro status:', error);
      setBadgeText('PRO');
    }
  };

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

  const handleAlignButtonPress = () => {
    setAlignModalVisible(true);
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
        <TouchableOpacity 
          style={keysStyles.keyTextContainer}
          onPress={() => handleEditPress(key)}
        >
          <Text style={keysStyles.keyText}>{key.description}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={keysStyles.trashWrap}
          onPress={() => handleDeletePress(key)}
        >
          <Image source={require('../../assets/delete.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
        </TouchableOpacity>
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleMenuItemSelect = async (item) => {
    // Define Pro-only categories
    const proOnlyCategories = ['identity_traits', 'motivations', 'avoidances'];
    
    // Check if the selected category requires Pro
    if (proOnlyCategories.includes(item.category)) {
      try {
        const isPro = await checkUserProStatus();
        if (!isPro) {
          // User doesn't have Pro, show upgrade modal instead
          setProModalVisible(true);
          setMenuVisible(false);
          return;
        }
      } catch (error) {
        console.error('Error checking Pro status:', error);
        // Show Pro modal on error for restricted categories
        setProModalVisible(true);
        setMenuVisible(false);
        return;
      }
    }
    
    // User has Pro or category is free, proceed normally
    setSelectedItem(item);
    setMenuVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleInfoPress = () => {
    setInfoPressed(true);
    setTimeout(() => {
      setInfoPressed(false);
      setInfoVisible(true);
    }, 50);
  };

  const handleDeletePress = (key) => {
    setKeyToDelete(key);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!keyToDelete) return;

    try {
      await deleteIdentityKey(keyToDelete.id);
      // Update local state to remove the deleted key
      setUserKeys(userKeys.filter(key => key.id !== keyToDelete.id));
    } catch (error) {
      console.error('Error deleting key:', error);
    } finally {
      setDeleteModalVisible(false);
      setKeyToDelete(null);
    }
  };

  const handleEditPress = (key) => {
    setKeyToEdit(key);
    setEditModalVisible(true);
  };

  const handleEditSave = async (newValue) => {
    if (!keyToEdit) return;

    try {
      await updateIdentityKey(keyToEdit.id, { description: newValue });
      // Update local state
      setUserKeys(userKeys.map(key => 
        key.id === keyToEdit.id 
          ? { ...key, description: newValue }
          : key
      ));
    } catch (error) {
      console.error('Error updating key:', error);
    } finally {
      setEditModalVisible(false);
      setKeyToEdit(null);
    }
  };

  const handleCreatePress = async () => {
    const categoryKeys = getCurrentCategoryKeys();
    
    try {
      const isPro = await checkUserProStatus();
      
      // Check if user already has 5 keys in this category and is not Pro
      if (categoryKeys.length >= 5 && !isPro) {
        // Show pro upgrade modal instead
        setProModalVisible(true);
        return;
      }
    } catch (error) {
      console.error('Error checking Pro status:', error);
      // If there's an error checking Pro status and user has 5+ keys, show Pro modal
      if (categoryKeys.length >= 5) {
        setProModalVisible(true);
        return;
      }
    }
    
    // Open modal instantly
    setCreateModalVisible(true);
  };

  const handleCreateSave = async (value) => {
    try {
      await addIdentityKey(selectedItem.category, value);
      // Reload keys to get the complete data with ID
      await loadUserKeys();
    } catch (error) {
      console.error('Error creating key:', error);
    } finally {
      setCreateModalVisible(false);
    }
  };

  const handleBadgePress = async () => {
    try {
      const isPro = await checkUserProStatus();
      if (isPro) {
        // Show Community modal for Pro users
        setCommunityModalVisible(true);
      } else {
        // Show Pro upgrade modal for non-Pro users
        setProModalVisible(true);
      }
    } catch (error) {
      console.error('Error checking Pro status:', error);
      // Show Pro modal on error to be safe
      setProModalVisible(true);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <SafeAreaView style={keysStyles.pageBg}>
      <View style={keysStyles.pageBg}>
        <View style={keysStyles.headerRow}>
          <Text style={keysStyles.header}>Your Keys</Text>
          <View style={keysStyles.headerButtons}>
            <TouchableOpacity style={keysStyles.proBadgeWrap} onPress={handleBadgePress}>
              <Text style={keysStyles.proBadge}>{badgeText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={keysStyles.shareButton} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Share functionality to be implemented
            }}>
              <Ionicons name="share-outline" size={28} color="#CCCCCC" />
            </TouchableOpacity>
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

          {renderCategoryKeys()}

          <AppButton
            title={`New ${selectedItem.label == 'Future Identity' ? 'Future Identity' : selectedItem.label.slice(0, -1)}`}
            style={keysStyles.newCoreValueBtn}
            onPress={handleCreatePress}
            iconRight={"+"}
            plusMarginRight={0}
          />

        </ScrollView>

        <AlignButton onPress={handleAlignButtonPress} />
      </View>

      <InfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} />
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setKeyToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
      <EditKeyModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setKeyToEdit(null);
        }}
        onSave={handleEditSave}
        initialValue={keyToEdit?.description}
        keyType={selectedItem.label.slice(0, -1)}
      />
      <CreateKeyModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreate={handleCreateSave}
        keyType={selectedItem.label.slice(0, -1)}
      />
      <ProUpgradeModal
        visible={proModalVisible}
        onClose={() => setProModalVisible(false)}
        currentPage="keys"
      />
      <CommunityModal
        visible={communityModalVisible}
        onClose={() => setCommunityModalVisible(false)}
      />
      <AlignModal
        visible={alignModalVisible}
        onClose={() => setAlignModalVisible(false)}
      />
    </SafeAreaView>
  );
}