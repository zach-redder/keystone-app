import { View, Text, TextInput, Pressable, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useRef } from 'react';
import keysStyles from '../../styles/keys';
import LogActionButton from '../../components/LogActionButton';
import Menu from '../../components/Menu';

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
  { label: 'Core Values', icon: require('../../assets/core_values.png'), active: true },
  { label: 'Life Goals', icon: require('../../assets/life_goals.png') },
  { label: 'Identity Traits', icon: require('../../assets/identity_traits.png') },
  { label: 'Future Identity', icon: require('../../assets/future_identity.png') },
  { label: 'Motivations', icon: require('../../assets/motivations.png') },
  { label: 'Avoidances', icon: require('../../assets/avoidances.png') },
];

export default function Keys() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchorY, setMenuAnchorY] = useState(100);
  const coreValuesBtnRef = useRef(null);

  const handleCoreValuesPress = () => {
    if (coreValuesBtnRef.current) {
      coreValuesBtnRef.current.measure((fx, fy, width, height, px, py) => {
        setMenuAnchorY(py + height);
        setMenuVisible(true);
      });
    } else {
      setMenuVisible(true);
    }
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
            ref={coreValuesBtnRef}
            style={[{ flexDirection: 'row', alignItems: 'center', flex: 1 }, menuVisible && { opacity: 0.7, backgroundColor: '#353535', borderRadius: 14 }]}
            activeOpacity={0.7}
            onPress={handleCoreValuesPress}
          >
            <Image 
              source={require('../../assets/core_values.png')}
              style={keysStyles.atomImage}
              resizeMode="contain"
              width={32}
              height={32}
            />
            <Text style={keysStyles.sectionTitle}>Core Values</Text>
            <View style={keysStyles.chevronWrap}>
              <Ionicons name="chevron-up" size={20} color="#fff" style={{ marginBottom: -3 }} />
              <Ionicons name="chevron-down" size={20} color="#fff" style={{ marginTop: -3 }} />
            </View>
          </TouchableOpacity>
          <Pressable style={keysStyles.infoIconWrap}>
            <Ionicons name="information-circle-outline" size={20} color="#2b2b2b" style={keysStyles.infoIcon} />
          </Pressable>
        </View>

        <Menu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          items={menuItems}
          anchorY={menuAnchorY}
        />

        <AppButton
          title="New Core Value"
          style={keysStyles.newCoreValueBtn}
          iconRight={"+"}
          plusMarginRight={0}
        />

        <Text style={keysStyles.subSectionTitle}>My Core Values</Text>
    
    <View style={keysStyles.inputRow}>
          <TextInput
            placeholder="Enter Value"
            placeholderTextColor="#fff"
            style={keysStyles.input}
          />
          <Pressable style={keysStyles.trashWrap}>
            <Image source={require('../../assets/delete.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
          </Pressable>
        </View>

        <Text style={keysStyles.subSectionTitle}>Suggestions</Text>
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

        <LogActionButton onPress={() => {}} />
      </View>
    </SafeAreaView>
  );
}