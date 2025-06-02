import React from 'react';
import { View, Text, Button } from 'react-native';

export default function PreferredReminderTimeScreen({ navigation }) {
  return (
    <View>
      <Text>Select your preferred reminder time</Text>
      {/* Add your time selection UI here */}
      <Button title="Next" onPress={() => navigation.navigate('SignUp')} />
    </View>
  );
}