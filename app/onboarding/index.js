import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PreferredAIPersonaScreen from './PreferredAIPersonaScreen';
import NotificationOptInScreen from './NotificationOptInScreen';
import PreferredReminderTimeScreen from './PreferredReminderTimeScreen';
import SignUpScreen from './SignUpScreen';

const Stack = createStackNavigator();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator initialRouteName="PreferredAIPersona">
      <Stack.Screen name="PreferredAIPersona" component={PreferredAIPersonaScreen} />
      <Stack.Screen name="NotificationOptIn" component={NotificationOptInScreen} />
      <Stack.Screen name="PreferredReminderTime" component={PreferredReminderTimeScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}