import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="(screens)/Welcome" 
        options={{
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="Quiz/[questionNumber]" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen name="(screens)/HearYou" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="(screens)/Preview" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen 
        name="(identity)/[step]" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="(identity)/KeysReady" 
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="(subscription)/NotReady" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen 
        name="(subscription)/FreeTrial" 
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="(subscription)/ReferralCode" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="(rating)/NotificationPermission" 
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="(rating)/AppRating" 
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}