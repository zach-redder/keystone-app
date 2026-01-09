import { View, Text, Pressable, SafeAreaView, TouchableOpacity, Image, ScrollView, Animated, Share, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useState, useRef, useEffect } from 'react';
import keysStyles from '../../styles/keys';
import AlignModal from '../../components/modals/AlignModal';
import ActionLogResultModal from '../../components/modals/ActionLogResultModal';
import AlignButton from '../../components/buttons/AlignButton';
import Menu from '../../components/forms/Menu';
import InfoModal from '../../components/modals/InfoModal';
import DeleteConfirmationModal from '../../components/modals/DeleteConfirmationModal';
import EditKeyModal from '../../components/modals/EditKeyModal';
import CreateKeyModal from '../../components/modals/CreateKeyModal';
// Removed ProUpgradeModal import - no longer needed in paid-only app
import CommunityModal from '../../components/modals/CommunityModal';
import AffirmIdentityModal from '../../components/modals/AffirmIdentityModal';
import ShareProgressModal from '../../components/modals/ShareProgressModal';
// Removed ReferralModal - now using direct app sharing
import { fetchIdentityKeys, deleteIdentityKey, updateIdentityKey, addIdentityKey } from '../../services/userKeys';
import { checkUserProStatus } from '../../services/auth';
import { getAppStoreLink, APP_NAME } from '../../constants/appStore';
import { getUserDayStreak } from '../../services/userPreferences';
import ProUpgradeModal from '../../components/modals/ProUpgradeModal';

function AppButton({ title, onPress, style, icon, iconRight, plusMarginRight }) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      style={[keysStyles.button, style]}
      activeOpacity={0.8}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        {icon && <Text style={keysStyles.buttonIcon}>{icon}</Text>}
        <Text style={keysStyles.buttonText}>{title}</Text>
        {iconRight && (
          <Image source={require('../../assets/plus.png')} style={{ ...keysStyles.plusImage, marginRight: plusMarginRight }} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// Simple key row component without complex animations
function KeyRow({ keyData, onEdit, onDelete }) {
  const handleEditPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit(keyData);
  };

  const handleDeletePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDelete(keyData);
  };

  return (
    <View style={keysStyles.inputRow}>
      <TouchableOpacity 
        style={keysStyles.keyTextContainer}
        onPress={handleEditPress}
        activeOpacity={0.8}
      >
        <Text style={keysStyles.keyText}>{keyData.description}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={keysStyles.trashWrap}
        onPress={handleDeletePress}
        activeOpacity={0.7}
      >
        <Image source={require('../../assets/delete.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
      </TouchableOpacity>
    </View>
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
  // Removed proModalVisible state - no longer needed in paid-only app
  const [communityModalVisible, setCommunityModalVisible] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);
  const [keyToEdit, setKeyToEdit] = useState(null);
  const [dayStreak, setDayStreak] = useState(0);
  const menuBtnRef = useRef(null);
  const [alignModalVisible, setAlignModalVisible] = useState(false);
  const [affirmIdentityModalVisible, setAffirmIdentityModalVisible] = useState(false);
  const [shareProgressModalVisible, setShareProgressModalVisible] = useState(false);
  // Removed referralModalVisible - now using direct app sharing
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [resultLog, setResultLog] = useState(null);
  const [proUpgradeModalVisible, setProUpgradeModalVisible] = useState(false);

  const scrollViewRef = useRef(null);

  // Load user keys when component mounts or selected item changes
  useEffect(() => {
    loadUserKeys();
  }, [selectedItem]);

  // Load streak whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadDayStreak();
    }, [])
  );

  const loadDayStreak = async () => {
    try {
      const streak = await getUserDayStreak();
      setDayStreak(streak);
    } catch (error) {
      console.error('Error loading day streak:', error);
      setDayStreak(0);
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
      <KeyRow
        key={`${selectedItem.category}-${key.id || index}`}
        keyData={key}
        onEdit={handleEditPress}
        onDelete={handleDeletePress}
      />
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
    // Check if this is a pro-only category
    const proOnlyCategories = ['identity_traits', 'motivations', 'avoidances'];
    const isProOnlyCategory = proOnlyCategories.includes(item.category);
    
    if (isProOnlyCategory) {
      // Check if user is pro
      const isPro = await checkUserProStatus();
      if (!isPro) {
        // Close menu and show ProUpgradeModal
        setMenuVisible(false);
        setTimeout(() => {
          setProUpgradeModalVisible(true);
        }, 300);
        return;
      }
    }
    
    // Only change if actually changing category
    if (item.category !== selectedItem.category) {
      setSelectedItem(item);
      
      // Scroll to top
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    }
    
    setMenuVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleInfoPress = () => {
    setInfoPressed(true);
    setTimeout(() => {
      setInfoPressed(false);
      setInfoVisible(true);
    }, 50);
  };

  const handleDeletePress = (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setKeyToDelete(key);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!keyToDelete) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setKeyToEdit(key);
    setEditModalVisible(true);
  };

  const handleEditSave = async (newValue) => {
    if (!keyToEdit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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
    // 🔒 PAID-ONLY APP: All users have unlimited key creation
    
    // Open modal instantly
    setCreateModalVisible(true);
  };

  const handleCreateSave = async (value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  // Removed handleBadgePress - no longer needed with streak UI

  const handleSharePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const appStoreLink = getAppStoreLink();
      await Share.share({
        message: `Check out ${APP_NAME} - the app that helps you overcome doubt and become your best self! Download it here: ${appStoreLink}`,
        url: appStoreLink,
        title: `${APP_NAME} - Overcome Doubt`
      });
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };

  // Removed handleRequestProUpgrade - no longer needed in paid-only app

  // Handler for Affirm Identity from AlignModal
  const handleAffirmIdentity = () => {
    setAlignModalVisible(false);
    setAffirmIdentityModalVisible(true);
  };

  return (
    <SafeAreaView style={keysStyles.pageBg}>
      <View style={keysStyles.pageBg}>
        <View style={keysStyles.headerRow}>
          <Text style={keysStyles.header}>Your Keys</Text>
          <View style={keysStyles.headerButtons}>
            <View style={keysStyles.streakBadgeWrap}>
              <Ionicons name="flame" size={16} color="#D4DE95" />
              <Text style={keysStyles.streakBadge}>{dayStreak}</Text>
            </View>
            <TouchableOpacity style={keysStyles.shareButton} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleSharePress();
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

        <ScrollView 
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={keysStyles.scrollView}
          scrollEventThrottle={16}
        >  
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
      {/* Removed ProUpgradeModal - no longer needed in paid-only app */}
      <CommunityModal
        visible={communityModalVisible}
        onClose={() => setCommunityModalVisible(false)}
      />
      <AlignModal
        visible={alignModalVisible}
        onClose={() => setAlignModalVisible(false)}
        onUpgradePress={() => {
          // No longer needed - all users have full access
        }}
        onAffirmIdentity={handleAffirmIdentity}
        onLogActionResult={(log) => {
          // Automatically show result modal after successful log action
          setResultLog(log);
          setResultModalVisible(true);
        }}
      />
      <AffirmIdentityModal
        visible={affirmIdentityModalVisible}
        onClose={() => setAffirmIdentityModalVisible(false)}
      />
      <ActionLogResultModal
        visible={resultModalVisible}
        onClose={() => setResultModalVisible(false)}
        log={resultLog}
      />
        <ShareProgressModal
          visible={shareProgressModalVisible}
          onClose={() => setShareProgressModalVisible(false)}
        />
        <ProUpgradeModal
          visible={proUpgradeModalVisible}
          onClose={() => setProUpgradeModalVisible(false)}
        />
    </SafeAreaView>
  );
}