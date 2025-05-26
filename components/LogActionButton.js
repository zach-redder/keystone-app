import React from 'react';
import { Pressable, View, Text, Image } from 'react-native';
import logActionButtonStyles from '../styles/LogActionButton';

export default function LogActionButton({ onPress }) {
  return (
    <Pressable style={logActionButtonStyles.logActionBtn} onPress={onPress}>
      <View style={logActionButtonStyles.logActionContent}>
        <Image source={require('../assets/plus.png')} style={logActionButtonStyles.plusImage} />
        <Text style={logActionButtonStyles.logActionText}>Log Action</Text>
      </View>
    </Pressable>
  );
} 