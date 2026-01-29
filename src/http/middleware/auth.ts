/**
 * Authentication Middleware
 *
 * SECURITY: This middleware properly verifies JWT signatures using the Clerk SDK.
 * Tokens are NOT just decoded - they are cryptographically verified.
 */

import type { Request, Response, NextFunction } from "express";
import { verifyClerkJWT, logSecurityEvent, isValidClerkUserId } from "../security";

// Extend Express Request type to include auth
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        claims?: Record<string, unknown>;
      };
    }
  }
}

/**
 * Require authenticated user for route access
 *
 * SECURITY:
 * - Properly verifies JWT signature (not just decode)
 * - Validates token structure and claims
 * - Logs authentication attempts for audit
 * - Returns generic error messages
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

    if (!token) {
      logSecurityEvent('jwt_verification_failed', {
        reason: 'no_token',
        path: req.path,
        method: req.method,
      });
      return res.status(401).json({
        error: "Unauthorized",
        code: "AUTH_REQUIRED",
      });
    }

    // Verify JWT with proper signature verification
    const result = await verifyClerkJWT(token);

    if (!result.valid || !result.userId) {
      logSecurityEvent('jwt_verification_failed', {
        reason: result.error || 'invalid_token',
        path: req.path,
        method: req.method,
      });
      return res.status(401).json({
        error: "Unauthorized",
        code: "AUTH_INVALID",
      });
    }

    // Validate user ID format
    if (!isValidClerkUserId(result.userId)) {
      logSecurityEvent('jwt_verification_failed', {
        reason: 'invalid_user_id_format',
        path: req.path,
        method: req.method,
      });
      return res.status(401).json({
        error: "Unauthorized",
        code: "AUTH_INVALID",
      });
    }

    // Attach verified auth info to request
    req.auth = {
      userId: result.userId,
      claims: result.claims,
    };

    next();
  } catch (error) {
    console.error('[Auth] Unexpected error:', error);
    logSecurityEvent('jwt_verification_failed', {
      reason: 'unexpected_error',
      path: req.path,
      method: req.method,
    });
    return res.status(401).json({
      error: "Unauthorized",
      code: "AUTH_INVALID",
    });
  }
}

/**
 * Optional authentication - allows both authenticated and unauthenticated requests
 * Useful for endpoints that behave differently based on auth status
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    // No token is OK for optional auth
    return next();
  }

  try {
    const result = await verifyClerkJWT(token);

    if (result.valid && result.userId && isValidClerkUserId(result.userId)) {
      req.auth = {
        userId: result.userId,
        claims: result.claims,
      };
    }
    // Invalid token is silently ignored for optional auth
  } catch (error) {
    // Silently continue without auth
  }

  next();
}
