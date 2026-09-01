// Supabase Edge Function -- receives Superwall subscription webhooks and keeps
// public.users.is_pro / pro_expires_at / subscription_source in sync.
//
// Superwall signs webhooks with Svix (svix-id/svix-timestamp/svix-signature headers,
// HMAC-SHA256 over "<id>.<timestamp>.<raw body>"). Deployed with verify_jwt=false
// since a real webhook can never present a Supabase user JWT -- this signature check
// is the auth mechanism instead. Docs: https://superwall.com/docs/integrations/webhooks
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("SUPERWALL_WEBHOOK_SECRET"); // format: whsec_<base64>

// Per Superwall's docs, these event names are universal across App Store/Play Store/Stripe.
// "cancellation" only turns off auto-renew -- access continues until "expiration" actually
// fires, so it must NOT be treated as an immediate deactivation.
const ACTIVATING_EVENTS = new Set([
  "initial_purchase",
  "renewal",
  "uncancellation",
  "non_renewing_purchase",
]);

const DEACTIVATING_EVENTS = new Set([
  "expiration",
  "subscription_paused", // Play Store only
]);

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

async function verifySignature(
  payload: string,
  msgId: string,
  msgTimestamp: string,
  msgSignature: string,
): Promise<boolean> {
  if (!WEBHOOK_SECRET) {
    console.error("SUPERWALL_WEBHOOK_SECRET is not set -- rejecting all webhooks");
    return false;
  }

  const timestamp = parseInt(msgTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (!timestamp || Math.abs(now - timestamp) > 300) {
    return false; // reject missing/stale timestamps (replay protection)
  }

  const secretBytes = base64ToBytes(WEBHOOK_SECRET.split("_")[1]);
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signedContent = `${msgId}.${msgTimestamp}.${payload}`;
  const signatureBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedContent));
  const expectedSignature = `v1,${bytesToBase64(new Uint8Array(signatureBytes))}`;

  return msgSignature.split(" ").some((sig) => timingSafeEqual(sig, expectedSignature));
}

async function updateUser(userId: string, fields: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(fields),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DB update failed: ${res.status} ${text}`);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.text();
  const msgId = req.headers.get("svix-id");
  const msgTimestamp = req.headers.get("svix-timestamp");
  const msgSignature = req.headers.get("svix-signature");

  if (!msgId || !msgTimestamp || !msgSignature) {
    return new Response("Missing Svix headers", { status: 400 });
  }

  const valid = await verifySignature(payload, msgId, msgTimestamp, msgSignature);
  if (!valid) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(payload);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const eventName = event?.data?.name ?? event?.type;
  const userId = event?.data?.originalAppUserId;

  if (!userId || !eventName) {
    return new Response("Missing userId or event name", { status: 400 });
  }

  // originalAppUserId is a Superwall-generated alias ($SuperwallAlias:...) unless the
  // app identified the user with its own ID first. This app calls identify(userId)
  // with the Supabase auth user id (see contexts/SuperwallContext.js), so this should
  // always be a real users.id -- but guard against the alias case defensively.
  if (userId.startsWith("$SuperwallAlias:")) {
    console.warn("Webhook for an unidentified (alias) user, skipping:", userId);
    return new Response("OK (unidentified user, skipped)", { status: 200 });
  }

  const fields: Record<string, unknown> = { subscription_source: "superwall" };

  if (ACTIVATING_EVENTS.has(eventName)) {
    fields.is_pro = true;
  } else if (DEACTIVATING_EVENTS.has(eventName)) {
    fields.is_pro = false;
  }
  // "cancellation"/"billing_issue": access continues until expiration actually fires,
  // so is_pro is intentionally left untouched here.

  if (event?.data?.expirationAt) {
    fields.pro_expires_at = new Date(event.data.expirationAt).toISOString();
  }

  try {
    await updateUser(userId, fields);
  } catch (e) {
    console.error("Update error:", e);
    return new Response("DB error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
});
