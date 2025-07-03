import React from 'react';
import { Pressable, View, Text, Image } from 'react-native';
import alignButtonStyles from '../styles/AlignButton';

export default function AlignButton({ onPress }) {
  return (
    <Pressable style={alignButtonStyles.alignBtn} onPress={onPress}>
      <View style={alignButtonStyles.alignContent}>
        <Image source={require('../assets/checkmark.png')} style={alignButtonStyles.plusImage} />
        <Text style={alignButtonStyles.alignText}>Align Now</Text>
      </View>
    </Pressable>
  );
} 