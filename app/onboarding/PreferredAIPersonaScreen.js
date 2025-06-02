import React from 'react';
import { View, Text, Button } from 'react-native';

export default function PreferredAIPersonaScreen({ navigation }) {
  return (
    <View>
      <Text>Select your preferred AI persona</Text>
      {/* Add your selection UI here */}
      <Button title="Next" onPress={() => navigation.navigate('NotificationOptIn')} />
    </View>
  );
}