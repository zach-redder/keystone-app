import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        // Custom slide animation from right to left
        animation: 'slide_from_right',
        animationDuration: 300,
        // For Android, use custom transition spec
        ...(Platform.OS === 'android' && {
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
                opacity: current.progress.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.8, 1],
                }),
              },
            };
          },
        }),
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        options={{
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="Animation" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="GoodNews" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="Quiz/[questionNumber]" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="Progress" 
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false, // Disable back gesture for progress screen
        }}
      />
      <Stack.Screen 
        name="IdentityScore" 
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false, // Disable back gesture for score screen
        }}
      />
      <Stack.Screen 
        name="[step]" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="doubt-consequences/[page]" 
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false, // No back gesture in doubt sequence
        }}
      />
      <Stack.Screen 
        name="benefits/[page]" 
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false, // No back gesture in benefits sequence
        }}
      />
      <Stack.Screen 
        name="Quiz/UserInfo" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="BenefitsDeepDive" 
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="ReferralCode" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="AppRating" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="AnimatedProfileCard" 
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="PaywallTrial" 
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="Subscription" 
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}