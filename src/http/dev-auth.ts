/**
 * Development-only authentication bypass
 * ONLY USE IN LOCAL DEVELOPMENT - DO NOT DEPLOY TO PRODUCTION
 */

import { Request, Response, NextFunction } from 'express';

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Development-only middleware that allows testing with a fake user ID
 * Usage: Add ?dev_user_id=user_test123 to your request
 */
export function devAuthBypass(req: Request, res: Response, next: NextFunction) {
  if (!isDevelopment) {
    return res.status(403).json({ 
      error: 'Development endpoints are disabled in production' 
    });
  }

  const devUserId = req.query.dev_user_id || req.headers['x-dev-user-id'];
  
  if (!devUserId) {
    return res.status(400).json({ 
      error: 'Missing dev_user_id query parameter or X-Dev-User-ID header',
      hint: 'Add ?dev_user_id=user_test123 to your request'
    });
  }

  // Set fake auth for development
  (req as any).auth = { 
    userId: devUserId as string 
  };
  
  next();
}

/**
 * Creates a simple test token for development
 * This is just a base64-encoded JSON object for local testing
 */
export function createDevToken(userId: string): string {
  const payload = {
    sub: userId,
    iss: 'dev-local',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Helper endpoint to create development test users
 */
export const createTestUser = async (req: Request, res: Response) => {
  if (!isDevelopment) {
    return res.status(403).json({ error: 'Not available in production' });
  }

  const { userId } = req.body;
  const testUserId = userId || `user_test_${Date.now()}`;
  const devToken = createDevToken(testUserId);

  res.json({
    message: 'Test user created (development only)',
    userId: testUserId,
    devToken,
    usage: {
      queryParam: `?dev_user_id=${testUserId}`,
      header: `X-Dev-User-ID: ${testUserId}`,
      apiCalls: {
        referrals: `curl "http://localhost:8789/api/v1/dev/referrals/me?dev_user_id=${testUserId}"`,
        claim: `curl -X POST "http://localhost:8789/api/v1/dev/referrals/claim?dev_user_id=${testUserId}" -H "Content-Type: application/json" -d '{"code":"ABC123"}'`,
      }
    }
  });
};

/**
 * Get test user info
 */
export const getTestUsers = async (req: Request, res: Response) => {
  if (!isDevelopment) {
    return res.status(403).json({ error: 'Not available in production' });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get some test users from profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, credits, referral_discount_active, referred_by')
    .limit(5);

  res.json({
    message: 'Available test users (development only)',
    users: profiles || [],
    hint: 'Use any user_id with ?dev_user_id=USER_ID to test as that user'
  });
};
