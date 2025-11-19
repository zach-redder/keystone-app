# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Keystone is a React Native application built with Expo that implements a psychological profiling and self-improvement app. The app uses **Superwall** (`expo-superwall@0.3.2`) for paywall and subscription management, with Supabase for backend services, authentication, and user data management.

## Development Commands

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run on web browser

For development after making changes:
```bash
npx expo prebuild --clean
cd ios && pod install && cd ..
```

## Architecture Overview

### Core Structure
- **Expo Router**: File-based routing system located in `/app` directory
- **Supabase**: Backend service for authentication, data storage, and receipt validation
- **Context API**: State management via React Context (SuperwallContext)

### Key Directories
- `/app` - Main application screens and routing
  - `/tabs` - Bottom tab navigation (home.js, keys.js, profile.js)
  - `/onboarding` - User onboarding flow including quiz and subscription
- `/contexts` - React Context providers for global state
- `/services` - Business logic services (userKeys.ts, reminderService, etc.)
- `/lib` - Core utilities including Supabase client configuration

### Navigation Flow
The app uses Expo Router with the following structure:
- Root layout (`_layout.js`) handles app-wide providers and deep linking
- Main screens in `/app` for authentication (signin, register, email confirmation)
- Tab navigation for authenticated users in `/app/tabs`
- Onboarding flow in `/app/onboarding` for new users

### Subscription System
The app uses **Superwall** for paywall presentation and subscription management:
- **SuperwallProvider**: Root provider that initializes the Superwall SDK with API keys
- **SuperwallLoading/SuperwallLoaded**: Components that conditionally render based on SDK initialization state
- **usePlacement hook**: For presenting paywalls (e.g., `presentPlacement('subscription_required')`)
- **useUser hook**: For getting subscription status and identifying users
- **useSuperwallEvents hook**: For handling transaction and subscription events

The app implements a freemium model with subscription products managed through Superwall's dashboard. Product IDs are configured in the Superwall web interface, not hardcoded in the app.

### State Management
- **SuperwallContext**: Manages subscription status and handles Superwall events
- Uses React Context API for global state sharing
- AsyncStorage for offline persistence of subscription data
- Supabase `users` table stores `is_pro` status and `subscription_source` for backend validation

### Key Services
- **reminderService**: Handles push notification scheduling
- **userKeys.ts**: Manages user profile and psychological profiling data
- **superwallService.ts**: Handles Superwall purchase completion and subscription status checks
- **superwallCompat.js**: Provides mock Superwall hooks for Expo Go development (automatically switches to real Superwall SDK in dev/production builds)

## Important Development Notes

- The app uses **expo-superwall** (NOT react-native-iap) for all subscription functionality
- Superwall API key must be set in `.env.local` as `EXPO_PUBLIC_SUPERWALL_API_KEY`
- All subscription logic flows through the SuperwallContext provider
- Push notifications are rescheduled on app foreground and at midnight
- Paywall placements are configured in the Superwall dashboard (https://superwall.com)
- The app uses TypeScript for services but primarily JavaScript for React components
- **superwallCompat.js** provides mock implementations for Expo Go testing

## Testing Considerations

- **Development Builds**: Use `npx expo run:ios` to test real Superwall integration
- **Expo Go**: Uses mock Superwall implementation (no real purchases)
- Superwall handles all App Store Connect configuration and receipt validation automatically
- Test subscription flows using Superwall's test mode in their dashboard
- Sandbox Apple IDs required for testing real purchases in development builds
- Monitor Superwall events in the console using `useSuperwallEvents` hook