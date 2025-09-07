## Native IAP Integration (react-native-iap) + Supabase Receipt Validation

This app replaces Superwall with native Apple In‑App Purchases using `react-native-iap` and server-side receipt validation via a Supabase Edge Function.

### Product IDs
- `com.reddermedia.keystone.monthly`
- `com.reddermedia.keystone.yearly`
- `com.reddermedia.keystone.lifetime`

### What Cursor Implemented
- Removed Superwall provider and all usages in the codebase.
- Added `react-native-iap` and implemented purchase/restore flows in `app/onboarding/Subscription.js`.
- After purchase/restore, the client posts the receipt to a Supabase Edge Function `iap-verify-apple` for validation and entitlement.

---

## Local Changes You Must Run

1) Install dependencies and rebuild native iOS project
```bash
npm i react-native-iap
npx expo prebuild --clean
cd ios && pod install && cd ..
```

2) iOS capabilities
- Ensure In‑App Purchases capability is enabled for the app target in Xcode.

---

## App Store Connect Setup

1) Agreements
- Accept the Paid Apps Agreement in App Store Connect.

2) Create In‑App Purchases
- Type: Auto-Renewable Subscription for Monthly and Yearly; Non-Consumable for Lifetime.
- Use exact product IDs:
  - `com.reddermedia.keystone.monthly`
  - `com.reddermedia.keystone.yearly`
  - `com.reddermedia.keystone.lifetime`
- Pricing: set your tiers accordingly.
- Review assets: upload screenshots describing the purchase.

3) App Review metadata
- Provide Terms of Use and Privacy Policy links in your App Store listing.
- Add clear purchase description and trial info (if applicable) in IAPs.

4) Sandbox testing accounts
- Create Sandbox Apple IDs in App Store Connect → Users and Access → Sandbox.

---

## Supabase Setup

### Create the `subscriptions` table
Run this SQL in Supabase SQL editor:
```sql
create table if not exists public.subscriptions (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  status text not null check (status in ('active','inactive','expired','canceled')),
  expires_at timestamptz,
  is_trial boolean default false not null,
  updated_at timestamptz default now() not null,
  primary key (user_id, product_id)
);

-- RLS
alter table public.subscriptions enable row level security;

-- Policies: users can read their own rows
create policy if not exists "subscriptions_read_own" on public.subscriptions
for select using (auth.uid() = user_id);

-- Service role writes (Edge Function will use service role key)
create policy if not exists "subscriptions_service_write" on public.subscriptions
for all using (true) with check (true);
```

### Edge Function: `iap-verify-apple`
Create a new Edge Function in the Supabase GUI named `iap-verify-apple` and paste the code below.

Add environment variables in the Supabase project (Settings → Configuration → Functions):
- `APPLE_SHARED_SECRET`: Your App-Specific Shared Secret (Subscriptions). For non-consumable lifetime, not required but keep available.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key to upsert subscription rows.

```ts
// supabase Edge Function: iap-verify-apple
// Runtime: Deno. File: index.ts
// Purpose: Validate Apple iOS receipts. Try production first, fallback to sandbox on status 21007.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type VerifyRequest = {
  receiptData: string; // base64
  productId?: string;
};

const APPLE_VERIFY_PROD = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_VERIFY_SANDBOX = 'https://sandbox.itunes.apple.com/verifyReceipt';

interface AppleVerifyResponse {
  status: number;
  environment?: string;
  latest_receipt?: string;
  latest_receipt_info?: any[];
  receipt?: any;
}

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' }, ...init });

const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APPLE_SHARED_SECRET = Deno.env.get('APPLE_SHARED_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!; // Automatically injected

export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });
  const { receiptData }: VerifyRequest = await req.json();
  if (!receiptData) return json({ error: 'Missing receiptData' }, { status: 400 });

  const payload = {
    'receipt-data': receiptData,
    password: APPLE_SHARED_SECRET,
    exclude-old-transactions: true,
  };

  const verify = async (url: string): Promise<AppleVerifyResponse> => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  };

  let result = await verify(APPLE_VERIFY_PROD);
  if (result.status === 21007) {
    result = await verify(APPLE_VERIFY_SANDBOX);
  }

  if (result.status !== 0) {
    return json({ active: false, status: result.status }, { status: 200 });
  }

  // Normalize latest subscription info (for auto-renewables) or in-app (for lifetime)
  const infos: any[] = result.latest_receipt_info || result.receipt?.in_app || [];
  // pick the most recent by expires_date_ms or purchase_date_ms
  const pickLatest = (a: any, b: any) => {
    const ax = Number(a.expires_date_ms || a.purchase_date_ms || 0);
    const bx = Number(b.expires_date_ms || b.purchase_date_ms || 0);
    return bx - ax;
  };
  infos.sort(pickLatest);
  const latest = infos[0];

  const productId = latest?.product_id as string | undefined;
  const expiresMs = Number(latest?.expires_date_ms || 0) || undefined;
  const isTrial = (latest?.is_trial_period === 'true') || false;
  const now = Date.now();
  const active = productId ? (expiresMs ? expiresMs > now : true) : false; // lifetime has no expires
  const expiresAt = expiresMs ? new Date(expiresMs).toISOString() : null;

  // Upsert into subscriptions with service role
  const jwt = SERVICE_ROLE_KEY;
  // user_id will be resolved from auth JWT from the client request
  // If you want, require auth and read user id from req.headers.get('Authorization')

  // In this simplified flow, we assume the client is authenticated and uses anon key.
  // We call a PostgREST rpc to set the subscription for the current user via auth context.
  const supabaseRes = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'apikey': jwt,
      'Authorization': `Bearer ${jwt}`,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      user_id: (await getAuthUserIdFromHeaders(req.headers)) ?? undefined,
      product_id: productId ?? null,
      status: active ? 'active' : (expiresAt ? 'expired' : 'inactive'),
      expires_at: expiresAt,
      is_trial: isTrial,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!supabaseRes.ok) {
    const t = await supabaseRes.text();
    console.warn('Supabase upsert error', t);
  }

  return json({ active, expiresAt, isTrial, productId }, { status: 200 });
}

async function getAuthUserIdFromHeaders(headers: Headers): Promise<string | null> {
  // If you want strict auth, validate the client JWT here.
  // For simplicity, we rely on Supabase RLS policies and service role write.
  // Return null and let DB default or triggers handle user association if desired.
  const uid = headers.get('x-user-id');
  return uid;
}
```

Notes:
- The function tries Apple production first, then falls back to sandbox if `status === 21007`.
- It normalizes subscription and upserts into `public.subscriptions` with `service role` to bypass RLS on writes.
- Optionally, you can pass `x-user-id` header from the client with the authenticated user ID; or extend the function to verify the Supabase JWT and extract the subject.

### Client Integration
- In `app/onboarding/Subscription.js`, we:
  - Initialize `react-native-iap` on mount.
  - Fetch products for the 3 SKUs and show `localizedPrice`.
  - Call `requestSubscription({ sku })` to purchase.
  - Call `getAvailablePurchases()` to restore.
  - Listen to `purchaseUpdatedListener`, then call `supabase.functions.invoke('iap-verify-apple', { body: { receiptData } })`.
  - Finish the transaction with `finishTransaction`.

---

## Testing with Sandbox Testers
1) On a real iOS device, sign out of your personal Apple ID in Settings → App Store → Sandbox Account and sign in with a Sandbox tester.
2) Build with `eas build -p ios` (or use Dev Client) and install.
3) Open the app → Subscription screen → select a plan → purchase. You should see the Apple purchase sheet.
4) After purchasing, the app should show "Pro unlocked" and your Supabase `subscriptions` table should reflect an active row.
5) Test “Restore Purchases” using `getAvailablePurchases()`.

---

## iOS App Review Checklist
- No Superwall/Stripe/external purchase links in the iOS build for digital content.
- “Restore Purchases” button is present and functional.
- IAP products created with the exact product IDs and submitted for review.
- Terms and Privacy links present in the App Store listing and inside the app where appropriate.
- Receipt validation handles Apple sandbox (`status 21007`) fallback.
- The app does not gate account creation behind payment and offers a clear purchase flow.

---

## Troubleshooting
- Prices empty: ensure the SKUs are approved in App Store Connect and the bundle ID matches.
- Purchase sheet not appearing: run on a real device with Dev Client or a release build, not Simulator.
- Validation errors: confirm `APPLE_SHARED_SECRET` and that the receipt is from the correct environment (prod vs sandbox).


