# Superwall Migration Setup Guide

## 🔧 Environment Configuration

### 1. Set up your environment variables
Create or update your `.env.local` file with your Superwall API keys:

```bash
# Add your actual Superwall API keys here
EXPO_PUBLIC_SUPERWALL_API_KEY=pk_live_your_actual_key_here
```

### 2. Development vs Production Testing

#### **Testing in Expo Go (Development)**
- The app will show an orange banner: "🚧 EXPO GO MODE - Superwall disabled for development"
- All Superwall functionality is mocked for compatibility
- Users are automatically treated as "subscribed" for testing app functionality
- This allows you to test the app flow without native builds

#### **Testing with Development Build (Recommended)**
```bash
# Build development version with native modules
npx expo run:ios
# or
npx expo run:android
```

## 🎯 Superwall Dashboard Configuration

### Required Placements
Create these placements in your Superwall dashboard:

1. **`subscription_required`** (Hard Paywall)
   - Type: Hard paywall
   - Frequency: Always show
   - Products: Your subscription tiers
   - Trial: 3-day free trial

### Required Products
Configure these in your App Store Connect / Google Play Console and Superwall:
- Monthly subscription with 3-day trial
- Yearly subscription with 3-day trial
- Lifetime purchase (optional)

## 🚀 Testing Checklist

### In Expo Go:
- [ ] App loads without crashes
- [ ] Orange development banner appears
- [ ] All screens accessible (subscription gating disabled)
- [ ] Console shows "[Mock Superwall]" messages

### In Development Build:
- [ ] App loads with real Superwall
- [ ] Hard paywall appears immediately (if no subscription)
- [ ] Subscription flow works
- [ ] Purchase completion updates user status
- [ ] Restore purchases works

## 🔄 Migration Status

### Completed:
- ✅ Removed react-native-iap dependency
- ✅ Added expo-superwall with compatibility layer
- ✅ Created hard paywall system
- ✅ Updated all subscription checks
- ✅ Added user management integration
- ✅ Created migration support for existing users

### Next Steps:
1. Add your real Superwall API keys to `.env.local`
2. Configure products and placements in Superwall dashboard
3. Test with `npx expo run:ios` or `npx expo run:android`
4. Deploy and test subscription flow

## 🔧 Architecture

### Key Files:
- `utils/superwallCompat.js` - Expo Go compatibility layer
- `contexts/SuperwallContext.js` - Global subscription state
- `components/SubscriptionGate.js` - Hard paywall protection
- `services/superwallService.ts` - Superwall integration functions

### How It Works:
1. App detects if running in Expo Go vs production
2. Uses mock Superwall in Expo Go for development
3. Uses real Superwall in production builds
4. Hard paywall blocks all app access until subscribed
5. Automatic user identification and status tracking

## 📱 User Experience

### New Users:
1. Complete onboarding flow
2. Reach main app → Hard paywall appears
3. Must subscribe to continue (3-day trial available)
4. After subscription → Full app access

### Existing Users:
1. Existing `is_pro: true` users → Marked as migrated
2. Automatic access without re-subscription
3. Can still restore purchases if needed

## 🐛 Troubleshooting

### "Cannot find native module 'SuperwallExpo'"
- This is expected in Expo Go
- Use development build: `npx expo run:ios/android`

### Paywall not showing
- Check Superwall dashboard configuration
- Verify API keys in environment
- Check placement name matches: `subscription_required`

### Events not firing
- Verify you're using development build (not Expo Go)
- Check console for Superwall event logs
- Ensure proper dashboard setup