import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FingerprintPayload {
  ua?: string
  os?: string
  browser?: string
  country?: string
}

function hash(value: string): string {
  // Simple non-cryptographic hash for IP; replace with HMAC in production
  let h = 0
  for (let i = 0; i < value.length; i++) h = Math.imul(31, h) + value.charCodeAt(i) | 0
  return String(h)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const body = (await req.json().catch(() => ({}))) as FingerprintPayload
    const ip = req.headers.get('x-forwarded-for') ?? '0.0.0.0'
    const country = body.country ?? req.headers.get('x-country') ?? undefined

    const { error: upsertErr } = await supabase
      .from('devices')
      .upsert({
        user_id: user.id,
        ua: body.ua,
        os: body.os,
        browser: body.browser,
        ip_hash: hash(ip),
        country: country,
        last_seen: new Date().toISOString()
      }, { onConflict: 'user_id,ip_hash,ua' })

    if (upsertErr) 
    // TODO: send branded email via Supabase SMTP or provider. Placeholder no-op.

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

