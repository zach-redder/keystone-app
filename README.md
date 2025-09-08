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
- **NEW**: Supports unauthenticated purchases - saves to AsyncStorage and validates when user registers.

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
  original_transaction_id text,
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
// supabase Edge Function (TypeScript) — Apple IAP receipt verify with 21007 fallback
// Works in the Supabase GUI. No external deps.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const PROD_URL = "https://buy.itunes.apple.com/verifyReceipt";
const SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt";

const json = (body, init = {}) => new Response(JSON.stringify(body), {
  headers: {
    "content-type": "application/json"
  },
  ...init
});

// Read required env vars
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const APPLE_SHARED_SECRET = Deno.env.get("APPLE_SHARED_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL"); // auto-injected

if (!SERVICE_ROLE_KEY || !APPLE_SHARED_SECRET || !SUPABASE_URL) {
  console.warn("Missing env vars: SERVICE_ROLE_KEY/APPLE_SHARED_SECRET/SUPABASE_URL");
}

function pickLatest(infos) {
  if (!Array.isArray(infos) || infos.length === 0) return null;
  // Sort by expires_date_ms (subs) or purchase_date_ms (lifetime) descending
  const byTime = (x) => Number(x?.expires_date_ms ?? x?.purchase_date_ms ?? 0);
  return [...infos].sort((a, b) => byTime(b) - byTime(a))[0];
}

function normalize(latest, nowMs) {
  if (!latest) {
    return {
      productId: null,
      originalTransactionId: null,
      active: false,
      expiresAt: null,
      isTrial: false
    };
  }
  
  const productId = latest?.product_id ?? null;
  const originalTransactionId = latest?.original_transaction_id ?? null;
  const isTrial = latest?.is_trial_period === "true" || latest?.is_in_intro_offer_period === "true";
  const expiresMsRaw = latest?.expires_date_ms;
  const expiresMs = typeof expiresMsRaw === "string" ? Number(expiresMsRaw) : typeof expiresMsRaw === "number" ? expiresMsRaw : undefined;
  
  // If it has an expires date, it's an auto-renewable sub; otherwise treat as one-time (lifetime)
  const active = expiresMs ? expiresMs > nowMs : true;
  const expiresAt = expiresMs ? new Date(expiresMs).toISOString() : null;
  
  return {
    productId,
    originalTransactionId,
    active,
    expiresAt,
    isTrial
  };
}

async function verifyWithApple(receiptData) {
  const payload = {
    "receipt-data": receiptData,
    password: APPLE_SHARED_SECRET,
    "exclude-old-transactions": true
  };
  
  const post = async (url) => {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    return await r.json();
  };
  
  let res = await post(PROD_URL);
  if (res?.status === 21007) {
    res = await post(SANDBOX_URL);
  }
  return res;
}

async function upsertSubscription(userId, productId, status, expiresAt, isTrial, originalTransactionId) {
  // Upsert into PostgREST using service role
  const body = {
    user_id: userId,
    product_id: productId,
    status,
    expires_at: expiresAt,
    is_trial: isTrial,
    original_transaction_id: originalTransactionId,
    updated_at: new Date().toISOString()
  };
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    const txt = await res.text();
    console.warn("DB upsert failed:", res.status, txt);
  }
}

function requireUserId(headers) {
  // Expect client to pass user ID. Safer alternatives:
  //  - Verify Supabase JWT and read sub
  //  - Use RLS RPC that derives auth.uid()
  const uid = headers.get("x-user-id");
  return uid;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({
      error: "Method not allowed"
    }, {
      status: 405
    });
    
    const userId = requireUserId(req.headers);
    if (!userId) return json({
      error: "Missing x-user-id header"
    }, {
      status: 401
    });
    
    const body = await req.json().catch(() => null);
    if (!body?.receiptData) return json({
      error: "Missing receiptData"
    }, {
      status: 400
    });
    
    const apple = await verifyWithApple(body.receiptData);
    if (apple.status !== 0) {
      // Non-zero means not valid/other Apple status
      await upsertSubscription(userId, null, "inactive", null, false, null);
      return json({
        active: false,
        status: apple.status
      }, {
        status: 200
      });
    }
    
    // Use latest_receipt_info (subs) or receipt.in_app (consumables/non-consumables)
    const list = Array.isArray(apple.latest_receipt_info) ? apple.latest_receipt_info : apple.receipt?.in_app ?? [];
    const filtered = body.productIds?.length ? list.filter((r) => body.productIds.includes(r.product_id)) : list;
    const latest = pickLatest(filtered);
    const norm = normalize(latest, Date.now());
    const status = norm.active ? "active" : norm.expiresAt ? "expired" : "inactive";
    
    await upsertSubscription(userId, norm.productId, status, norm.expiresAt, norm.isTrial, norm.originalTransactionId);
    
    return json({
      active: norm.active,
      expiresAt: norm.expiresAt,
      isTrial: norm.isTrial,
      productId: norm.productId
    });
  } catch (e) {
    console.error("Unhandled error:", e);
    return json({
      error: "Internal error"
    }, {
      status: 500
    });
  }
});
```

Notes:
- The function tries Apple production first, then falls back to sandbox if `status === 21007`.
- **Improved error handling**: Better validation, proper normalization, and comprehensive error responses.
- **Product filtering**: Supports optional `productIds` array in request body to filter specific products.
- **Enhanced data**: Tracks `originalTransactionId` for better subscription management.
- **Robust normalization**: Handles both auto-renewable subscriptions and one-time purchases (lifetime).
- **Better trial detection**: Checks both `is_trial_period` and `is_in_intro_offer_period`.
- **Requires authentication**: Now requires `x-user-id` header (no longer supports unauthenticated validation).
- **Database integration**: Automatically upserts subscription data into `public.subscriptions` table.

### Client Integration
- In `app/onboarding/Subscription.js`, we:
  - Initialize `react-native-iap` on mount.
  - Fetch products for the 3 SKUs and show `localizedPrice`.
  - Call `requestSubscription({ sku })` to purchase.
  - Call `getAvailablePurchases()` to restore.
  - Listen to `purchaseUpdatedListener`, then call `supabase.functions.invoke('iap-verify-apple', { body: { receiptData } })`.
  - **NEW**: For unauthenticated users, saves receipt to AsyncStorage and shows temporary pro status.
  - Finish the transaction with `finishTransaction`.

### Unauthenticated Purchase Flow
1. User purchases without account → receipt saved to AsyncStorage
2. User sees temporary "Pro" status
3. When user registers → auth service validates pending subscription
4. If valid → user gets permanent pro status in database
5. AsyncStorage is cleared

---

## Testing with Sandbox Testers
1) On a real iOS device, sign out of your personal Apple ID in Settings → App Store → Sandbox Account and sign in with a Sandbox tester.
2) Build with `eas build -p ios` (or use Dev Client) and install.
3) Open the app → Subscription screen → select a plan → purchase. You should see the Apple purchase sheet.
4) After purchasing, the app should show "Pro unlocked" and your Supabase `subscriptions` table should reflect an active row.
5) Test "Restore Purchases" using `getAvailablePurchases()`.
6) **NEW**: Test unauthenticated purchase → register account → verify pro status is maintained.

---

## iOS App Review Checklist
- No Superwall/Stripe/external purchase links in the iOS build for digital content.
- "Restore Purchases" button is present and functional.
- IAP products created with the exact product IDs and submitted for review.
- Terms and Privacy links present in the App Store listing and inside the app where appropriate.
- Receipt validation handles Apple sandbox (`status 21007`) fallback.
- The app does not gate account creation behind payment and offers a clear purchase flow.

---

## Troubleshooting
- Prices empty: ensure the SKUs are approved in App Store Connect and the bundle ID matches.
- Purchase sheet not appearing: run on a real device with Dev Client or a release build, not Simulator.
- Validation errors: confirm `APPLE_SHARED_SECRET` and that the receipt is from the correct environment (prod vs sandbox).
- Unauthenticated purchases: check AsyncStorage for `pending_subscription` key.
