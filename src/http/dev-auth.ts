/**
 * Development-only authentication bypass
 *
 * SECURITY HARDENING:
 * - Requires EXPLICIT opt-in via ALLOW_DEV_AUTH=true
 * - Only works when NODE_ENV === 'development'
 * - Logs all dev auth usage for audit
 * - Never exposes real user data
 */

import { Request, Response, NextFunction } from 'express';
import { logSecurityEvent, isValidClerkUserId } from './security';

/**
 * SECURITY: Dev mode requires BOTH conditions:
 * 1. NODE_ENV === 'development' (explicit, not just !== 'production')
 * 2. ALLOW_DEV_AUTH === 'true' (explicit opt-in)
 *
 * This prevents accidental exposure in staging, preview, or misconfigured environments.
 */
const isDevelopment = process.env.NODE_ENV === 'development';
const devAuthAllowed = process.env.ALLOW_DEV_AUTH === 'true';
const isDevModeEnabled = isDevelopment && devAuthAllowed;

// Log configuration at startup
if (isDevelopment) {
  console.log('🔧 NODE_ENV is development');
  console.log(`🔐 ALLOW_DEV_AUTH: ${devAuthAllowed ? 'ENABLED' : 'DISABLED (set ALLOW_DEV_AUTH=true to enable)'}`);
}

/**
 * Development-only middleware that allows testing with a fake user ID
 *
 * SECURITY:
 * - Requires explicit ALLOW_DEV_AUTH=true
 * - Logs all usage for audit trail
 * - Validates user ID format
 */
export function devAuthBypass(req: Request, res: Response, next: NextFunction) {
  // SECURITY: Block in any non-development environment
  if (!isDevModeEnabled) {
    logSecurityEvent('auth_bypass_attempt', {
      ip: req.ip,
      path: req.path,
      nodeEnv: process.env.NODE_ENV,
      devAuthAllowed,
    });
    return res.status(403).json({
      error: 'Development endpoints are disabled',
      hint: 'Set NODE_ENV=development and ALLOW_DEV_AUTH=true',
    });
  }

  const devUserId = req.query.dev_user_id || req.headers['x-dev-user-id'];

  if (!devUserId || typeof devUserId !== 'string') {
    return res.status(400).json({
      error: 'Missing dev_user_id query parameter or X-Dev-User-ID header',
      hint: 'Add ?dev_user_id=user_test123 to your request',
    });
  }

  // Validate user ID format (should look like a Clerk user ID)
  // Allow both real Clerk IDs (user_xxx) and test IDs (user_test_xxx)
  const isValidFormat = /^user_[a-zA-Z0-9_]+$/.test(devUserId);
  if (!isValidFormat) {
    return res.status(400).json({
      error: 'Invalid dev_user_id format',
      hint: 'Use format: user_test123 or user_xxx',
    });
  }

  // Log dev auth usage
  logSecurityEvent('dev_auth_used', {
    userId: devUserId,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Set fake auth for development
  req.auth = {
    userId: devUserId,
  };

  next();
}

/**
 * Check if dev mode is enabled
 * Useful for conditionally loading routes
 */
export function isDevModeActive(): boolean {
  return isDevModeEnabled;
}

/**
 * Creates a simple test token for development
 * This is just a base64-encoded JSON object for local testing
 */
export function createDevToken(userId: string): string {
  if (!isDevModeEnabled) {
    throw new Error('Dev tokens can only be created in development mode with ALLOW_DEV_AUTH=true');
  }

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
  if (!isDevModeEnabled) {
    logSecurityEvent('auth_bypass_attempt', {
      path: req.path,
      nodeEnv: process.env.NODE_ENV,
    });
    return res.status(403).json({ error: 'Not available - requires ALLOW_DEV_AUTH=true in development' });
  }

  const { userId } = req.body;
  const testUserId = userId || `user_test_${Date.now()}`;
  const devToken = createDevToken(testUserId);

  logSecurityEvent('dev_auth_used', {
    action: 'create_test_user',
    userId: testUserId,
  });

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
 * Get test user info - MODIFIED for security
 *
 * SECURITY:
 * - Only returns mock/sample data, never real user data
 * - Requires explicit dev mode
 */
export const getTestUsers = async (req: Request, res: Response) => {
  if (!isDevModeEnabled) {
    logSecurityEvent('auth_bypass_attempt', {
      path: req.path,
      nodeEnv: process.env.NODE_ENV,
    });
    return res.status(403).json({ error: 'Not available - requires ALLOW_DEV_AUTH=true in development' });
  }

  // SECURITY: Return mock data only, never expose real user data
  // Even in dev mode, we shouldn't query real user data through dev endpoints
  const mockUsers = [
    { user_id: 'user_test_sample1', credits: 100, referral_discount_active: false },
    { user_id: 'user_test_sample2', credits: 50, referral_discount_active: true },
    { user_id: 'user_test_sample3', credits: 0, referral_discount_active: false },
  ];

  res.json({
    message: 'Sample test users for development',
    users: mockUsers,
    hint: 'Use any user_id with ?dev_user_id=USER_ID to test as that user',
    warning: 'These are mock users. For real user testing, create test accounts through the normal flow.',
  });
};
