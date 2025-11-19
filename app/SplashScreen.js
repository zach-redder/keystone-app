import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/keystone_transparent.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2b2b2b', // Adjust to match your app's theme
  },
  logo: {
    width: 200, // Adjust size as needed
    height: 200, // Adjust size as needed
  },
}); 