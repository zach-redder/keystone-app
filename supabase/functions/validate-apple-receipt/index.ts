// @ts-nocheck
/*
 Edge Function: validate-apple-receipt

 Implements Apple's recommended server-side receipt validation flow.
 1. Always send receipt to production https://buy.itunes.apple.com/verifyReceipt first.
 2. If status == 21007 (sandbox receipt), retry against https://sandbox.itunes.apple.com/verifyReceipt
  3. If status == 0 (success), parse latest_receipt_info / latest_expired_receipt_info
 4. Determine active subscription entitlement and update Supabase 'users.is_pro'

 Environment variables required:
 - APPLE_SHARED_SECRET (App Store Connect > App Specific Shared Secret for auto-renewable subscriptions)
 - SUPABASE_SERVICE_ROLE_KEY (in Edge Function env)

 Request JSON body:
 {
   "receiptData": "<base64 receipt string>",
   "userId": "<supabase auth user id>"
 }

 Response JSON:
 {
   "success": boolean,
   "is_pro": boolean,
   "status": number,
   "expiresDateMs": string | null,
   "raw": { ...apple response subset }
 }
*/

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'

interface VerifyReceiptRequest {
  'receipt-data': string
  password: string
  exclude_old_transactions?: boolean
}

interface AppleInAppReceipt {
  expires_date_ms?: string
  cancellation_date_ms?: string
  product_id?: string
  transaction_id?: string
  original_transaction_id?: string
  is_in_intro_offer_period?: string
  is_trial_period?: string
}

interface AppleVerifyReceiptResponse {
  status: number
  environment?: string
  latest_receipt_info?: AppleInAppReceipt[]
  latest_expired_receipt_info?: AppleInAppReceipt[]
  pending_renewal_info?: any[]
}

const PROD_ENDPOINT = 'https://buy.itunes.apple.com/verifyReceipt'
const SANDBOX_ENDPOINT = 'https://sandbox.itunes.apple.com/verifyReceipt'

async function postToApple(url: string, body: VerifyReceiptRequest): Promise<AppleVerifyReceiptResponse> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    return { status: -1 }
  }
  return await res.json() as AppleVerifyReceiptResponse
}

function getNewestActive(receipts: AppleInAppReceipt[] | undefined): AppleInAppReceipt | null {
  if (!receipts || receipts.length === 0) return null
  const sorted = receipts.slice().sort((a,b) => (Number(b.expires_date_ms||'0') - Number(a.expires_date_ms||'0')))
  return sorted[0]
}

function isActive(r: AppleInAppReceipt | null): boolean {
  if (!r) return false
  const now = Date.now()
  const exp = Number(r.expires_date_ms || '0')
  return exp > now
}

async function updateUserProStatus(userId: string, isPro: boolean) {
  // Supabase server-side client (service role key injected automatically in Edge Function env as SUPABASE_URL & SUPABASE_ANON_KEY not service role; need service key). Use globalThis to access env.
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
  const client = createClient(supabaseUrl, serviceKey)
  const { error } = await client.from('users').update({ is_pro: isPro }).eq('id', userId)
  if (error) console.error('Error updating user is_pro:', error)
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
    const { receiptData, userId } = await req.json()
    if (!receiptData || !userId) return new Response(JSON.stringify({ error: 'Missing receiptData or userId' }), { status: 400 })

    const sharedSecret = Deno.env.get('APPLE_SHARED_SECRET')
    if (!sharedSecret) return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500 })

    const baseRequest: VerifyReceiptRequest = {
      'receipt-data': receiptData,
      password: sharedSecret,
      exclude_old_transactions: true
    }

    // Step 1: production
    let appleResp = await postToApple(PROD_ENDPOINT, baseRequest)

    // Step 2: if 21007 sandbox receipt, retry sandbox
    if (appleResp.status === 21007) {
      appleResp = await postToApple(SANDBOX_ENDPOINT, baseRequest)
    }

    // Optional: handle 21008 (production receipt sent to sandbox) edge-case
    if (appleResp.status === 21008) {
      appleResp = await postToApple(PROD_ENDPOINT, baseRequest)
    }

    const newest = getNewestActive(appleResp.latest_receipt_info)
    const active = isActive(newest)

    if (appleResp.status === 0) {
      await updateUserProStatus(userId, active)
    }

    return new Response(JSON.stringify({
      success: appleResp.status === 0,
      is_pro: active,
      status: appleResp.status,
      expiresDateMs: newest?.expires_date_ms || null,
      raw: {
        status: appleResp.status,
        environment: appleResp.environment,
        latestCount: appleResp.latest_receipt_info?.length || 0
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('Unhandled error', e)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
})
