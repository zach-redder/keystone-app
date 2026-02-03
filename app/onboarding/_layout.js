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
        name="(screens)/Animation" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="(screens)/GoodNews" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="(screens)/BenefitsDeepDive" 
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="Quiz/[questionNumber]" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="Quiz/UserInfo" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="(quiz)/Progress" 
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false, // Disable back gesture for progress screen
        }}
      />
      <Stack.Screen 
        name="(quiz)/IdentityScore" 
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false, // Disable back gesture for score screen
        }}
      />
      <Stack.Screen 
        name="(identity)/[step]" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="(identity)/AnimatedProfileCard" 
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="doubt-consequences"
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false, // No back gesture in doubt sequence
        }}
      />
      <Stack.Screen
        name="benefits"
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false, // No back gesture in benefits sequence
        }}
      />
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
        name="(subscription)/PaywallTrial" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="(subscription)/Subscription" 
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="(rating)/NotificationPermission" 
        options={{
          animation: 'slide_from_right',
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