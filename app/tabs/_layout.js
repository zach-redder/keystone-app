import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';


export default function TabLayout() {
  return (
    <Tabs
      screenOptions={() => ({
        tabBarStyle: {
          backgroundColor: '#2b2b2b',
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#aaa',
        headerShown: false,
      })}
    >
      <Tabs.Screen name="keys" options={{
        title: 'Keys',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="key" size={size} color={color} />
        ),
      }} />
      <Tabs.Screen name="home" options={{
        title: 'Home',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="home" size={size} color={color} />
        ),
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profile',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="person" size={size} color={color} />
        ),
      }} />
    </Tabs>
  );
}
