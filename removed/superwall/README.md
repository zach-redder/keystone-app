Legacy Superwall integration files were removed on migration to native IAP (react-native-iap + server receipt validation).

Removed files:
- src/paywall/superwallAdapter.ts
- src/paywall/superwallEvents.ts
- services/superwallService.ts (stubbed then removed)

Dependency removed from package.json: expo-superwall

If rollback needed, restore these from version control prior to this commit.
