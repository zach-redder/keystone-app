# Keystone App

The Keystone mobile app — an Expo/React Native self-reflection companion.

## Overview

Keystone helps users define who they want to be across six "identity key" categories — **Core Values, Identity Traits, Future Self Vision, Life Goals, Avoidances, Motivations** —. The saved keys act as the AI's memory. The idea underneath is the golden mean: not blind certainty, not constant doubt, but the center between them.

The home screen is a central, audio-reactive AI orb. Tapping it starts a **voice conversation** (Pro) like ChatGPT voice, with the user's keys, persona and mode as context; chat is one tap away. There are two modes: **Affirm** (counters self-doubt) and **Question** (Socratic, challenges beliefs and decisions). Personas change tone only. The AI (via the sibling [`keystone-ai-service`](../keystone-ai-service) backend) reflects the user's own words back, and after a chat the user can tap **Review keys** to see proposed adds, updates and removals to their keys. Nothing changes unless they accept it. The app also handles onboarding, auth, daily reminders, referrals, a lightweight community/sharing layer, and a freemium subscription model via Superwall.

## Tech Stack

- **Expo** (~54) with **Expo Router** (~6, file-based routing) — React Native 0.81, React 19
- **TypeScript** for services, **JavaScript** for most screens/components
- **Supabase** — auth, Postgres data store, two Edge Functions checked in here (`handle-subscription`, `generate-daily-message`)
- **Superwall** (`expo-superwall`) — paywall and subscription management (current/primary subscription system — see [Subscriptions](#subscriptions))
- **EAS Build** — development, preview, and production build profiles

## Getting Started

### Prerequisites
- Node.js and npm
- Expo CLI / EAS CLI (`npm install -g eas-cli`)
- Xcode (for iOS) and/or Android Studio (for Android)
- Access to the shared Supabase project and a Superwall app

### Install

```bash
npm install
```

### Configure

Copy `.env.example` to `.env.local` and fill in real values (see [Environment Variables](#environment-variables)).

### Run

```bash
npm start          # Expo dev server
npm run ios        # Run on iOS simulator/device
npm run android    # Run on Android emulator/device
npm run web        # Run in a browser
```

After changing native dependencies:

```bash
npx expo prebuild --clean
cd ios && pod install && cd ..
```

There is no `test`, `lint`, or `build` npm script — EAS builds are triggered directly via the `eas` CLI (see [Deployment](#deployment)).

## Project Structure

```
app/                        # Expo Router file-based routes
├── (auth)/                  # Sign in, register, reset password, email confirmation
├── onboarding/               # Multi-step onboarding: identity keys, quiz, benefits, subscription paywall
├── tabs/                     # Authenticated app: keys, home (AI bubble), stats, profile (bottom tab nav)
├── _layout.js                # Root providers, deep linking, reminder scheduling
└── index.js                  # Entry router — redirects based on auth/onboarding state
components/                  # Shared UI components
constants/                   # appStore, legal text, subscription plan definitions
contexts/                    # SuperwallContext (subscription state)
lib/                         # apiConfig.ts (AI service base URL), supabase.ts (client)
services/
├── auth/                     # Sign up/in, onboarding-status routing, account deletion
├── features/                  # Chat, key proposals, reminders, sharing, streaks
├── integrations/               # Deep links, Resend email list
├── subscription/               # subscriptionService.ts — sole owner of pro/free status logic
└── user/                       # Referrals, user keys, preferences
styles/                       # Per-screen StyleSheet modules
supabase/functions/
├── handle-subscription/        # Superwall webhook receiver — keeps users.is_pro in sync
└── generate-daily-message/     # Scheduled cron function that calls keystone-ai-service
utils/superwallCompat.js     # Swaps mock/real Superwall SDK based on Expo Go vs. build
```

## Key Flows

- **Onboarding** — Welcome → identity key selection → scored quiz → user info → benefits/doubt deep dives → notification permission → app rating → referral code → subscription paywall.
- **Auth** — Supabase email/password (with email confirmation), Google Sign-In, Sign in with Apple, password reset — all deep-link aware (see [Deep Linking](#deep-linking)).
- **AI chat & key proposals** — `services/features/affirmationService.ts` (chat, one thread per mode) and `keyProposalService.ts` call the `keystone-ai-service` backend with the user's Supabase access token. Accepted proposals are applied by the app through `services/user/userKeys.ts`, never by the backend.
- **Reminders** — Daily push notifications, rescheduled on app foreground and at local midnight.
- **Referrals & community** — Referral code redemption grants pro time; lightweight community/sharing features with share-image generation.

## Deep Linking

The app registers the `keystone://` custom scheme (see `app.json`) plus experimental HTTPS universal-link config (`associatedDomains` / Android App Links pointed at `thekeystoneapp.com`, though the `.well-known` files on the landing page side still need real Apple Team ID / Android signing-cert values before those work).

All incoming links are handled by one central listener in `app/_layout.js`, which:
1. Parses the `keystone://<path>?<query>#<hash>` shape itself, without relying on `Linking.parse()`'s ambiguous hostname/path handling for custom schemes.
2. For `resetpassword`/`emailconfirmation`/`signin` links, establishes a Supabase session from whichever payload shape is present — `token_hash`+`type` (`verifyOtp`), `access_token`/`refresh_token` (`setSession`), or a PKCE `code` (`exchangeCodeForSession`) — before navigating to the matching screen.
3. For `?ref=CODE` links, hands off to `services/integrations/deepLinkService.ts` to validate and stage the referral code for redemption during onboarding.

The landing page's `/verify` route (`keystone-landingpage`) generates the `resetpassword`/`emailconfirmation`/`signin` links above — see that repo's docs for why it forwards the raw Supabase payload instead of exchanging it itself.

## Subscriptions

The app uses **Superwall** (`expo-superwall`) as the subscription/paywall system: `SuperwallProvider` initializes the SDK, `usePlacement` presents paywalls, `useUser`/`useSuperwallEvents` track status and transactions. `SuperwallContext` calls into `services/subscription/subscriptionService.ts` — the sole owner of pro/free status logic — to sync subscription state to the Supabase `users` table (`is_pro`, `subscription_source`, `pro_expires_at`). `utils/superwallCompat.js` swaps in a mock implementation automatically when running in Expo Go (no native modules available) and the real SDK in dev/production builds.

Server-side sync happens via a Superwall webhook: `supabase/functions/handle-subscription/` verifies the webhook's Svix signature and updates `users.is_pro` based on the real Superwall event names (`initial_purchase`/`renewal`/`uncancellation`/`non_renewing_purchase` activate; `expiration`/`subscription_paused` deactivate; `cancellation`/`billing_issue` are left alone since access continues until the subscription actually expires). This function needs a `SUPERWALL_WEBHOOK_SECRET` set on the Supabase project (from Superwall's webhook dashboard) to accept real webhook calls — without it, every webhook is rejected.

There is no raw-IAP fallback path anymore — the earlier `iap-verify-apple` Edge Function (native Apple receipt verification) has been removed from this repo. If it's still deployed on Supabase, it needs to be deleted separately (`supabase functions delete iap-verify-apple` or via the dashboard) since edge function deletion isn't available through the tooling used to make this change.

## Environment Variables

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `EXPO_PUBLIC_API_URL` | Base URL of the `keystone-ai-service` backend |
| `EXPO_PUBLIC_SUPERWALL_API_KEY` | Superwall SDK key |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google Sign-In web client ID |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google Sign-In iOS client ID |

The Supabase and API URL clients throw at import time if their env vars are missing. See `.env.example`.

## Deployment

Builds are managed via **EAS Build** (`eas.json`): `development` (simulator, dev client), `preview` (internal, real device), `production` (store submission, auto-incrementing build number).

**iOS is automated end-to-end:** an EAS build trigger (Expo dashboard → Project Settings → GitHub) watches pushes to `main` and automatically runs `eas build --profile production` followed by `eas submit`, landing the build in TestFlight without any manual CLI step. Credentials (distribution cert, App Store Connect API key) live in EAS's credential service, not in this repo or in GitHub secrets — manage them via `eas credentials --platform ios` or the dashboard's Credentials page. Manual builds/submits (`eas build --platform ios --profile production`, `eas submit -p ios --latest`) still work the same way for ad hoc use.

## Known Limitations

- **No automated tests** — no Jest config, no test files.
- **CI is disabled** — the EAS build/submit GitHub Actions workflow is commented out.
- **Universal links are only half-configured** — `app.json`'s `associatedDomains`/App Links config is in place, but `keystone-landingpage/public/.well-known/apple-app-site-association` and `assetlinks.json` still have placeholder values (real Apple Team ID and Android signing-cert fingerprint needed).
- **`handle-subscription` needs a webhook secret** — `SUPERWALL_WEBHOOK_SECRET` must be set on the Supabase project (from Superwall's webhook config) before real subscription webhooks will be accepted.
- **Deep-link and referral flows need an on-device test pass** — the session-establishment and referral-tracking logic was rewritten based on Supabase's/Superwall's documented behavior, but hasn't been exercised against a real device yet.
- Old alignment/action-log tables and `users` score columns still exist in Supabase but the app no longer reads or writes them. Dropping them is a separate follow-up.
- `supabase/migrations/` holds hand-written SQL that must be applied to the Supabase project manually; there is no migration runner.
