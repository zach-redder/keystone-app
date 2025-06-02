import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={() => ({
        tabBarStyle: {
          backgroundColor: '#2b2b2b',
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#b3b3b3',
        headerShown: false,
      })}
    >
      <Tabs.Screen name="keys" options={{
        title: 'Keys',
        tabBarIcon: ({ focused }) => (
          <Image
            source={
              focused
                ? require('../../assets/keystone_transparent.png')        // Active icon
                : require('../../assets/keystone_grey.png')   // Inactive icon
            }
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
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
