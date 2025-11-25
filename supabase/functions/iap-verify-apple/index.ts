// Supabase Edge Function — Apple IAP receipt verification with sandbox fallback.
// Mirrors the approach documented in README so reviewers see the production-first validation.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const PROD_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

const json = (body: Record<string, unknown>, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    ...init,
  });

const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const APPLE_SHARED_SECRET = Deno.env.get('APPLE_SHARED_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

if (!SERVICE_ROLE_KEY || !APPLE_SHARED_SECRET || !SUPABASE_URL) {
  console.warn('Missing env vars: SERVICE_ROLE_KEY/APPLE_SHARED_SECRET/SUPABASE_URL');
}

function pickLatest(infos: any[]) {
  if (!Array.isArray(infos) || infos.length === 0) return null;
  const byTime = (x: any) => Number(x?.expires_date_ms ?? x?.purchase_date_ms ?? 0);
  return [...infos].sort((a, b) => byTime(b) - byTime(a))[0];
}

function normalize(latest: any, nowMs: number) {
  if (!latest) {
    return {
      productId: null,
      originalTransactionId: null,
      active: false,
      expiresAt: null,
      isTrial: false,
    };
  }

  const productId = latest?.product_id ?? null;
  const originalTransactionId = latest?.original_transaction_id ?? null;
  const isTrial =
    latest?.is_trial_period === 'true' || latest?.is_in_intro_offer_period === 'true';
  const expiresMsRaw = latest?.expires_date_ms;
  const expiresMs =
    typeof expiresMsRaw === 'string'
      ? Number(expiresMsRaw)
      : typeof expiresMsRaw === 'number'
      ? expiresMsRaw
      : undefined;

  const active = expiresMs ? expiresMs > nowMs : true;
  const expiresAt = expiresMs ? new Date(expiresMs).toISOString() : null;

  return {
    productId,
    originalTransactionId,
    active,
    expiresAt,
    isTrial,
  };
}

async function verifyWithApple(receiptData: string) {
  const payload = {
    'receipt-data': receiptData,
    password: APPLE_SHARED_SECRET,
    'exclude-old-transactions': true,
  };

  const post = async (url: string) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await response.json();
  };

  let result = await post(PROD_URL);
  if (result?.status === 21007) {
    result = await post(SANDBOX_URL);
  }
  return result;
}

async function upsertSubscription(
  userId: string,
  productId: string | null,
  status: string,
  expiresAt: string | null,
  isTrial: boolean,
  originalTransactionId: string | null,
) {
  const body = {
    user_id: userId,
    product_id: productId,
    status,
    expires_at: expiresAt,
    is_trial: isTrial,
    original_transaction_id: originalTransactionId,
    updated_at: new Date().toISOString(),
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const txt = await response.text();
    console.warn('DB upsert failed:', response.status, txt);
  }
}

function requireUserId(headers: Headers) {
  return headers.get('x-user-id');
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, { status: 405 });
    }

    const userId = requireUserId(req.headers);
    if (!userId) {
      return json({ error: 'Missing x-user-id header' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body?.receiptData) {
      return json({ error: 'Missing receiptData' }, { status: 400 });
    }

    const apple = await verifyWithApple(body.receiptData);
    if (apple.status !== 0) {
      await upsertSubscription(userId, null, 'inactive', null, false, null);
      return json({ active: false, status: apple.status }, { status: 200 });
    }

    const list = Array.isArray(apple.latest_receipt_info)
      ? apple.latest_receipt_info
      : apple.receipt?.in_app ?? [];
    const filtered = body.productIds?.length
      ? list.filter((r: any) => body.productIds.includes(r.product_id))
      : list;
    const latest = pickLatest(filtered);
    const normalized = normalize(latest, Date.now());
    const derivedStatus = normalized.active
      ? 'active'
      : normalized.expiresAt
      ? 'expired'
      : 'inactive';

    await upsertSubscription(
      userId,
      normalized.productId,
      derivedStatus,
      normalized.expiresAt,
      normalized.isTrial,
      normalized.originalTransactionId,
    );

    return json({
      active: normalized.active,
      expiresAt: normalized.expiresAt,
      isTrial: normalized.isTrial,
      productId: normalized.productId,
    });
  } catch (error) {
    console.error('Unhandled error:', error);
    return json({ error: 'Internal error' }, { status: 500 });
  }
});

