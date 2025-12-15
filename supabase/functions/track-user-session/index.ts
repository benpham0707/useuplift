/**
 * Track User Session Edge Function
 * Tracks IP address and device fingerprint on user signup/signin
 *
 * Called by frontend after authentication to register device and IP
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  trackUserIP,
  trackDeviceFingerprint,
  checkIPSignupLimit,
  getClientIP,
  type DeviceFingerprintComponents,
} from '../_shared/fraudPrevention.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface TrackSessionRequest {
  action: 'signup' | 'signin';
  deviceFingerprint: {
    hash: string;
    components: Partial<DeviceFingerprintComponents>;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: TrackSessionRequest = await req.json();

    // Get client IP
    const ipAddress = getClientIP(req);

    // Check IP signup limit (only on signup)
    if (body.action === 'signup') {
      const ipCheck = await checkIPSignupLimit(supabase, ipAddress);

      if (!ipCheck.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            blocked: true,
            reason: ipCheck.reason,
            metadata: ipCheck.metadata,
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Track IP on signup
      await trackUserIP(supabase, user.id, ipAddress);
    }

    // Track device fingerprint
    const deviceResult = await trackDeviceFingerprint(
      supabase,
      user.id,
      body.deviceFingerprint.hash,
      body.deviceFingerprint.components
    );

    if (!deviceResult.success) {
      console.warn('[Fraud] Device tracking failed:', deviceResult.error);
      // Don't block user if tracking fails (graceful degradation)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Session tracked successfully',
        metadata: {
          ipAddress: ipAddress.slice(0, 8) + '...', // Partial IP for privacy
          deviceTracked: deviceResult.success,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Fraud] Session tracking error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
