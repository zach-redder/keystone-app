import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
  return (
      <Tabs
      screenOptions={() => ({
        tabBarStyle: {
          left: 20,
          right: 20,
          height: 70,
          backgroundColor: '#2b2b2b',
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#888',
        tabBarShowLabel: false,
        headerShown: false,
        tabBarItemStyle: {
          marginTop: -5,
        },
      })}
    >
      <Tabs.Screen name="keys" options={{
        title: 'Keys',
        tabBarIcon: ({ focused }) => (
          <Image
            source={
              focused
                ? require('../../assets/images/logos/keystone_transparent.png')
                : require('../../assets/images/logos/keystone_grey.png')
            }
            style={{ 
              width: focused ? 46 : 38, 
              height: focused ? 46 : 38,
              opacity: focused ? 1 : 0.7,
            }}
            resizeMode="contain"
          />
        ),
      }} 
      listeners={() => ({
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      })}
      />
      <Tabs.Screen name="home" options={{
        title: 'Home',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons 
            name={focused ? "home" : "home-outline"} 
            size={focused ? 28 : 24} 
            color={color}
            style={{
              opacity: focused ? 1 : 0.7,
            }}
          />
        ),
      }} 
      listeners={() => ({
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      })}
      />
      <Tabs.Screen name="stats" options={{
        title: 'Stats',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={focused ? "stats-chart" : "stats-chart-outline"}
            size={focused ? 28 : 24}
            color={color}
            style={{
              opacity: focused ? 1 : 0.7,
            }}
          />
        ),
      }}
      listeners={() => ({
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      })}
      />
      <Tabs.Screen name="profile" options={{
        title: 'Profile',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons 
            name={focused ? "person" : "person-outline"} 
            size={focused ? 28 : 24} 
            color={color}
            style={{
              opacity: focused ? 1 : 0.7,
            }}
          />
        ),
      }} 
      listeners={() => ({
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      })}
      />
      </Tabs>
  );
}