/**
 * Check Fraud Risk Edge Function
 * Comprehensive fraud check before allowing expensive operations
 *
 * Called before essay analysis to verify user is not a fraudster
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  runFraudChecks,
  calculateUserRisk,
  getClientIP,
} from '../_shared/fraudPrevention.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface FraudCheckRequest {
  checkIP?: boolean;
  checkRisk?: boolean;
  checkEssay?: boolean;
  essayText?: string;
  promptText?: string;
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

    // Create Supabase client with service role for full access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
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
    const body: FraudCheckRequest = await req.json().catch(() => ({}));

    // Get client IP
    const ipAddress = getClientIP(req);

    // Run comprehensive fraud checks
    const fraudResult = await runFraudChecks(supabase, user.id, ipAddress, {
      checkIP: body.checkIP !== false,
      checkRisk: body.checkRisk !== false,
      checkEssay: body.checkEssay === true,
      essayText: body.essayText,
      promptText: body.promptText,
    });

    // If blocked, return 403
    if (!fraudResult.allowed) {
      return new Response(
        JSON.stringify({
          allowed: false,
          blocked: true,
          reason: fraudResult.reason,
          riskScore: fraudResult.riskScore,
          metadata: fraudResult.metadata,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // If allowed, return success with warnings (if any)
    return new Response(
      JSON.stringify({
        allowed: true,
        riskScore: fraudResult.riskScore,
        warnings: fraudResult.warnings,
        metadata: fraudResult.metadata,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Fraud] Fraud check error:', error);

    // Graceful degradation: allow request if fraud check fails
    return new Response(
      JSON.stringify({
        allowed: true,
        warnings: ['Fraud check failed - request allowed'],
        error: error instanceof Error ? error.message : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
