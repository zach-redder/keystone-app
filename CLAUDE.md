# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Keystone is an Expo/React Native AI self-reflection app. Users define "identity keys" across six categories (Core Values, Identity Traits, Future Self Vision, Life Goals, Avoidances, Motivations) and talk to an AI in one of two modes: **Affirm** (counters self-doubt) or **Question** (Socratic). The keys are the AI's memory; after a chat, "Review keys" proposes add/update/delete changes that apply only when the user accepts. Tapping the home orb starts a **voice conversation** (Pro only) over OpenAI Realtime/WebRTC; chat is one tap away. There are no scores and no action logs. The app uses **Superwall** (`expo-superwall@0.3.2`) for paywall/subscription management and **Supabase** for auth, data, and two Edge Functions checked into this repo. AI features call the sibling `keystone-ai-service` backend.

## Tech Stack

- Expo ~54, Expo Router ~6 (file-based routing), React Native 0.81, React 19
- TypeScript for `services/`, JavaScript for most `app/`/`components/` screens
- Supabase (`@supabase/supabase-js`) — auth, Postgres, `handle-subscription` Edge Function
- Superwall (`expo-superwall`) — subscriptions
- EAS Build for native builds

## Development Commands

- `npm start` — Start Expo development server
- `npm run android` — Run on Android device/emulator
- `npm run ios` — Run on iOS device/simulator
- `npm run web` — Run on web browser
- `npm test` — unit tests for the pure logic in `services/voice`, `services/onboarding`, `services/subscription` and friends (`*.test.ts`, run with `tsx`)

After changing native dependencies:
```bash
npx expo prebuild --clean
cd ios && pod install && cd ..
```

There is no `lint` script. **Voice mode cannot run in Expo Go**: it uses `react-native-webrtc` and `@shopify/react-native-skia`, so use a dev build (`npx expo run:ios` / `eas build --profile development`) on a real device; simulator microphones and audio routing are unreliable.

## Architecture

### Core Structure
- **Expo Router**: file-based routing in `/app`, using route groups (`(auth)`, `(identity)`, `(screens)`, `(subscription)`, etc.) to organize onboarding sub-flows without affecting the URL path.
- **Supabase**: backend for authentication, Postgres data, and receipt validation.
- **Context API**: global state via React Context (`SuperwallContext`); no Redux/Zustand.

### Key Directories
- `/app` — screens and routing
  - `/app/tabs` — bottom tab navigation (`keys.js`, `home.js` = AI orb, `stats.js`, `profile.js`) and two full-screen routes outside the tabs: `/app/voice/[mode].js` (voice, the default) and `/app/chat/[mode].js` (text). `/hooks` holds `useVoiceSession` and `useKeyReview` (shared by both screens); `/components/voice` holds the orb
  - `/app/onboarding` — the onboarding flow (see Onboarding Flow below): quiz, identity key selection, preview, post-sign-up screens, paywall
  - `/app/(auth)` — sign in, register, reset password, email confirmation
- `/contexts` — React Context providers for global state (`SuperwallContext.js`)
- `/services` — business logic, split into `auth/`, `features/`, `integrations/`, `subscription/`, `user/`
- `/lib` — `apiConfig.ts` (keystone-ai-service base URL) and `supabase.ts` (client config)
- `/supabase/functions` — `handle-subscription` (Superwall webhook receiver) Edge Function, deployed to the shared Supabase project (see Subscriptions below)

### Navigation Flow
`app/index.js` computes a status via `checkUserStatus()` (`services/auth/auth.ts`) — one of `no_session`, `needs_email_confirmation`, `needs_onboarding`, `needs_profile`, `complete`, `error` — by inspecting the Supabase session, `users` table, and AsyncStorage, then redirects accordingly. `needs_profile` means signed in and confirmed but the profile row was never created (the app was closed mid-sign-up); it routes to `/emailconfirmation`, which finishes creating it from the selections still stored locally.

### Onboarding Flow

Welcome → quiz (4 questions, `Quiz/[questionNumber].js`) → Core Values → Life Goals → Future Self Vision (`(identity)/[step].js`) → `HearYou` → `Preview` (scripted, built from the user's own keys; no AI call) → `/register` (account created here) → `NotificationPermission` → `AppRating` → `KeysReady` → `FreeTrial` (the Superwall `onboarding_complete` placement) → home.

Two AsyncStorage markers let a killed app resume (`services/onboarding/resume.ts`, allow-listed routes only): `onboarding_resume_route` before the account exists (read by `app/index.js` when there is no session) and `post_signup_pending` after it (set by `insertUserProfileAfterConfirmation`, cleared by `finishPostSignup()` when the paywall step is handled). Screens record their own step with `usePreAuthResume` / `usePostSignupResume` (`hooks/useOnboardingResume.js`). Quiz Q1 stores `onboarding_intent` (drives suggested key chips in `services/onboarding/keySuggestions.ts`); Q4 stores `onboarding_nudge` (becomes `preferred_reminder_time` via `services/onboarding/defaultPreferences.ts`).

**Hard paywall is built but off.** `app/index.js` asks `services/subscription/accessGateService.ts` before entering the app; `constants/accessConfig.ts` holds `HARD_PAYWALL_ENABLED` (false), `HARD_PAYWALL_GRANDFATHER_BEFORE` and `COMMUNITY_URL`. Turning it on without a cutoff date paywalls every existing free account. When on, closing the paywall without buying leads to `NotReady`, not the app.

Root layout (`_layout.js`) handles app-wide providers and deep linking (see Deep Linking below). Tab navigation for authenticated users lives in `/app/tabs`. Onboarding flow lives in `/app/onboarding`.

### Deep Linking

`app/_layout.js` owns a single `Linking.addEventListener('url', ...)` listener for the whole app — don't add a second one elsewhere. It:
1. Parses `keystone://<path>?<query>#<hash>` manually (splitting on `?`/`#`) rather than trusting `Linking.parse()`, since that API's hostname-vs-path handling for custom schemes is ambiguous.
2. For `resetpassword`/`emailconfirmation`/`signin` paths, tries three ways to establish a session depending on what Supabase actually sent — `token_hash`+`type` via `verifyOtp` (works from any client, no local state needed), `access_token`/`refresh_token` via `setSession` (implicit-flow style), or a PKCE `code` via `exchangeCodeForSession` (only works if this same app instance's `AsyncStorage` holds the matching verifier, i.e. this app initiated the original request) — then navigates to the matching route.
3. For `?ref=CODE` links, delegates to `services/integrations/deepLinkService.ts`'s `handleReferralDeepLink`, which validates the code and stages it in `pending_referral_code` (AsyncStorage) for the existing onboarding redemption flow to pick up.

These links are generated by `keystone-landingpage`'s `/verify` route. **Important**: that page deliberately does NOT call `exchangeCodeForSession` itself — a PKCE code is single-use and can only be redeemed by the client that requested it (this app, via its own `AsyncStorage`-stored verifier). It just forwards whatever Supabase sent, unmodified, onto the `keystone://` URI.

`app/(auth)/resetpassword.js` no longer re-parses the URL or re-attempts the exchange — it just checks `supabase.auth.getSession()` on mount, trusting that `_layout.js` already established the session before navigating there. `app/(auth)/signin.js` and `app/(auth)/emailconfirmation.js` follow the same pattern for the `signin` and `emailconfirmation` deep-link paths: `signin.js` checks `getSession()` on mount and redirects straight into the app if a session already exists (e.g. from an `email_change` confirmation) instead of showing a blank login form; `emailconfirmation.js` is dual-purpose — rendered directly by `RegisterForm.js` with real `email`/`preferences` props (the password-polling flow, unchanged), or reached as the bare `/emailconfirmation` route via the deep link (no props), in which case it checks `getSession()` directly rather than relying on the password-polling loop, which has no `email` to check against in that case.

### Subscription System (Superwall)

The app uses **Superwall** for paywall presentation and subscription management, and is a **freemium** product (not fully paid-only, despite some stale comments that used to say otherwise — see Gotchas):
- **SuperwallProvider**: root provider that initializes the SDK with the API key.
- **SuperwallLoading/SuperwallLoaded**: conditionally render based on SDK init state.
- **usePlacement hook**: presents paywalls (e.g., `presentPlacement('subscription_required')`).
- **useUser hook**: subscription status + user identification. `identify(user.id)` is called with the Supabase auth user's UUID, so Superwall's `originalAppUserId` in webhooks/exports is always that same UUID, not a Superwall-generated alias.
- **useSuperwallEvents hook**: transaction/subscription event handling.

Product IDs and paywall placements are configured in the Superwall dashboard, not hardcoded in the app (prices and the App Store billing disclosure live only there and in App Store Connect — the app no longer carries copies).

**Two sync paths keep `users.is_pro` current:**
1. **Client-side**: `SuperwallContext` calls `services/subscription/subscriptionService.ts`'s `handleSuperwallPurchaseComplete` whenever `useSuperwallEvents`' `onSubscriptionStatusChange` fires with an active status, writing `is_pro`/`subscription_source` directly.
2. **Server-side (source of truth)**: `supabase/functions/handle-subscription/` receives Superwall's webhook, verifies its Svix HMAC signature (`svix-id`/`svix-timestamp`/`svix-signature` headers — deployed with `verify_jwt: false` since a real webhook can't present a Supabase JWT), and updates `is_pro`/`pro_expires_at`/`subscription_source` based on the real event name in `data.name` (`initial_purchase`/`renewal`/`uncancellation`/`non_renewing_purchase` activate; `expiration`/`subscription_paused` deactivate; `cancellation`/`billing_issue` are deliberately left alone — cancelling only turns off auto-renew, access continues until an actual `expiration` event). Requires `SUPERWALL_WEBHOOK_SECRET` (from Superwall's webhook dashboard) set as a Supabase secret — without it, the function rejects every webhook.

There is no raw-IAP fallback anymore. The old `supabase/functions/iap-verify-apple` (native Apple receipt verification, bypassing Superwall) has been removed from this repo since Superwall is the confirmed system. If it's still deployed on Supabase, it needs a separate manual `supabase functions delete iap-verify-apple` — deployment tooling doesn't support deleting functions.

### State Management
- React Context (`SuperwallContext`) for subscription state; otherwise local `useState`/`useEffect` per screen.
- AsyncStorage for onboarding progress, cached user info, offline subscription persistence.
- Supabase is the source of truth for authenticated/server state. TanStack Query (`lib/queryClient.ts`, provider in `components/common/QueryProvider.js`) caches it and persists the cache to AsyncStorage, so launches paint cached data and revalidate in the background. Shared queries: `userStats` (`hooks/useUserStats`), `identityKeys`, `proStatus`. Anything that writes the underlying data must invalidate the matching key. The cache is cleared when the signed-in user changes.

### Key Services
- **`services/voice/`** — `realtimeSession.ts` is the only file that talks WebRTC: it asks `keystone-ai-service` for a short-lived key (`POST /voice/session`), connects straight to OpenAI, and primes the conversation with recent history. `voiceEvents.ts` (event stream to UI state, caption and paired turns) and `voiceStats.ts` (loudness from WebRTC stats) are pure and unit-tested. Finished turns are saved with `insertAIChatMessagePair`, so voice and text share one thread per mode and Review keys works on spoken conversations.
- **`components/voice/AIOrb.js`** — Skia shader orb (`orbShader.js`); mic and AI levels are Reanimated shared values, so it animates on the UI thread. If the shader fails to compile it falls back to a plain circle. The shader can be checked off-device with `canvaskit-wasm`'s `RuntimeEffect.Make`.
- **`services/auth/auth.ts`** — sign up/in (email, Google, Apple), `checkUserStatus()` routing, account deletion (cascades across ~13 Supabase tables).
- **`services/features/reminderService`** — schedules the next 7 days of local daily-message notifications from the fixed list in `constants/dailyMessages.ts`, chosen by recent Affirm/Question usage (rescheduled on foreground + local midnight).
- **`services/user/userKeys.ts`** — identity key CRUD. Category list, labels and pro-only flags live in `constants/keyCategories.js`; don't duplicate them.
- **`services/subscription/subscriptionService.ts`** — sole owner of pro/free status logic: `checkUserProStatus`, `upgradeUserToPro`, `downgradeUserToFree`, `getUserSubscriptionDetails`, `handleSuperwallPurchaseComplete`, `migrateFromIAPToSuperwall`. This used to be split three ways across `auth.ts`, `referralService.ts`, and a now-deleted `superwallService.ts` — consolidate any new pro-status logic here too rather than adding a fourth location.
- **`services/integrations/deepLinkService.ts`** — `handleReferralDeepLink`, called from `_layout.js`'s central listener for `?ref=CODE` links.
- **`utils/superwallCompat.js`** — mock Superwall hooks for Expo Go; switches to the real SDK automatically in dev/production builds. The same "environment-aware compatibility shim" pattern is used in `services/auth/auth.ts` for lazily loading `@react-native-google-signin` in a try/catch, so it doesn't crash in environments without the native module.
- **`services/features/affirmationService.ts` / `keyProposalService.ts`** — call `keystone-ai-service`'s `/generate-ai-message` and `/propose-key-changes` via `lib/apiConfig.ts`'s `BASE_URL`, sending `Authorization: Bearer <access token>`. Chat rows in `ai_chat_logs` carry a `mode`, a `reviewed_at` (set after a key review) and a `cleared_at`: "Reset chat" only sets `cleared_at`, because streaks, the calendar and stats are all derived from these rows. Reads of the conversation filter `cleared_at IS NULL`; stats never do. Stats come from the `get_user_stats` RPC (falls back to per-query reads if it is missing). Use `getSessionUser()` (`services/auth/currentUser.ts`), not `supabase.auth.getUser()`, which is a network call. The backend only proposes; the app applies accepted changes.

## Environment Variables

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `EXPO_PUBLIC_API_URL` | `keystone-ai-service` base URL |
| `EXPO_PUBLIC_SUPERWALL_API_KEY` | Superwall SDK key |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google Sign-In |

`lib/supabase.ts` and `lib/apiConfig.ts` throw at import time if their required vars are missing. See `.env.example`.

## Related Repos

- **`../keystone-ai-service`** — Python/FastAPI backend called via `EXPO_PUBLIC_API_URL` for AI chat and key-change proposals. Shares the same Supabase project/`users` table.
- **`../keystone-landingpage`** — marketing/waitlist site. Shares the same Supabase auth project; the `keystone://` deep-link scheme is how the landing page's `/verify` route hands email-confirmation, email-change, and password-reset callbacks back to this app (`keystone://emailconfirmation`, `keystone://signin`, `keystone://resetpassword`, each carrying the actual Supabase session payload as a query string or hash fragment — see Deep Linking above).

## Gotchas / Known Gaps

- **Tests cover only the pure voice logic; no CI.** Orb visuals, audio levels and the live WebRTC session can only be verified on a device. iOS deploys are automated at the infrastructure level instead: an EAS "build trigger" (Expo dashboard → Project Settings → GitHub) watches pushes to `main` and runs `eas build --profile production` then `eas submit` automatically, using the App Store Connect API key stored in EAS's credential service — no GitHub Actions workflow, no repo secrets. `eas.json`'s `submit.production` block is intentionally empty to make it resolve credentials that way.
- **`app.config.js` has a stale `// Superwall removed` comment** even though Superwall is still fully wired into the app — don't trust that comment as documentation.
- **Dead tables remain.** `action_logs`, `user_alignment_scores`, `weekly_alignment_snapshots`, `alignment_score_changes` and the `users` score columns are no longer used by the app. Account deletion still clears them. Dropping them is a deliberate, separate step.
- **Schema changes are hand-applied.** `supabase/migrations/*.sql` is not run by any tool; apply it to the right Supabase project before shipping the matching app build. The `ai_chat_logs` `mode`/`reviewed_at` and `cleared_at` migrations must be live before this build, or chat reads fail. `get_user_stats` (20261014000100) is optional but makes stats much faster.
- **Voice is Pro-only and capped server-side by messages** (50 user messages/day, with a 30 min per-session safety net; the app reports each finished turn to `POST /voice/session/message`, and the service reads `users.is_pro` itself and tracks `voice_sessions.message_count`). Each persona has its own OpenAI voice: defaults are mapped in `services/voice/personaVoice.ts`, custom personas store a `voice` column. OpenAI has no endpoint listing voices, so that list is pinned in both repos and must be kept in sync. The custom-personality form has a play button per voice (`services/voice/voicePreview.ts`, `expo-audio`) that plays a bundled clip from `assets/voice-previews/{voice}.mp3`; adding a voice means adding its clip (`npm run generate:voice-previews` with `OPENAI_API_KEY`) and a `require` line there, which `npm test` checks. `expo-audio` is native, so it needs a new dev/EAS build. The `20261015*` migrations must be applied before this build. The model id, transcription model and the `realtime/calls` URL come from OpenAI docs that disagree with each other; run `keystone-ai-service/scripts/check_realtime.py` with a real key before shipping.
- **Version lives only in `app.json`** (`expo.version`, now 2.0.0; keep `package.json` in sync). Build numbers come from EAS (`appVersionSource: remote`); don't set `buildNumber`/`versionCode`. Every push to `main` builds and submits to the stores, so work on a branch.
- **Older app builds break against the new AI service** (no bearer token → 401). Ship the app build before enforcing, or accept 401s for old builds.
- **Universal links are only half-configured** — `app.json` has `associatedDomains`/App Links config pointed at `thekeystoneapp.com`, but the landing page's `.well-known/apple-app-site-association` and `assetlinks.json` still have placeholder values for the Apple Team ID and Android signing-cert fingerprint. Custom-scheme (`keystone://`) links work regardless; HTTPS universal links don't yet.
- **`handle-subscription` rejects everything until `SUPERWALL_WEBHOOK_SECRET` is set** as a Supabase secret (get it from Superwall's webhook config when setting up the webhook URL there).
- The app uses TypeScript for `services/` but mostly plain JavaScript for screens/components — match whichever convention the file you're editing already uses.
- Non-blocking side effects are a deliberate pattern (e.g. Resend email-list sync is wrapped in `setTimeout` + try/catch so failures don't block account creation) — preserve this pattern for similar "best-effort" integrations.
- **"Fully paid-only" comments in `home.js`/`profile.js` are stale and wrong** — the app is freemium. Each feature (`app/chat/[mode].js`, `AIPersonalityModal`) self-contains its own `checkUserProStatus()` check, daily free-tier limit (10 chat pairs/day shared across both modes), and `ProUpgradeModal` — that gating is real and current, the removed top-level `home.js`/`profile.js` upgrade-prompt wiring was just redundant with it, not a functional gap.

## Testing Considerations

- **Development builds**: use `npx expo run:ios` to test real Superwall integration.
- **Expo Go**: uses the mock Superwall implementation — no real purchases.
- Sandbox Apple IDs are required to test real purchases in development builds.
- Monitor Superwall events in the console via `useSuperwallEvents`.
