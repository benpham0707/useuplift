/**
 * Security Module
 *
 * Centralized security utilities for:
 * - JWT verification with Clerk SDK
 * - Input sanitization for AI prompts
 * - Security audit logging
 * - Error message sanitization
 * - Rate limiting helpers
 */

import { createClerkClient, verifyToken } from '@clerk/backend';

// ============================================================================
// CONFIGURATION
// ============================================================================

const isProduction = process.env.NODE_ENV === 'production';

// Clerk configuration - REQUIRED in production
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY;

if (isProduction && !CLERK_SECRET_KEY) {
  console.error('[SECURITY] CRITICAL: CLERK_SECRET_KEY is required in production');
  process.exit(1);
}

// Initialize Clerk client (only if configured)
const clerkClient = CLERK_SECRET_KEY ? createClerkClient({
  secretKey: CLERK_SECRET_KEY,
  publishableKey: CLERK_PUBLISHABLE_KEY,
}) : null;

// ============================================================================
// JWT VERIFICATION (Clerk)
// ============================================================================

export interface JWTVerificationResult {
  valid: boolean;
  userId: string | null;
  error?: string;
  claims?: Record<string, unknown>;
}

/**
 * Verify Clerk JWT token with proper signature verification
 *
 * SECURITY: This properly verifies the JWT signature, not just decoding.
 * In production, tokens that fail verification are rejected.
 */
export async function verifyClerkJWT(token: string): Promise<JWTVerificationResult> {
  // Production: require proper Clerk verification
  if (isProduction) {
    if (!CLERK_SECRET_KEY) {
      return { valid: false, userId: null, error: 'Clerk not configured' };
    }

    try {
      const verifiedToken = await verifyToken(token, {
        secretKey: CLERK_SECRET_KEY,
      });

      if (!verifiedToken || !verifiedToken.sub) {
        return { valid: false, userId: null, error: 'Invalid token claims' };
      }

      // Log successful verification (without sensitive data)
      logSecurityEvent('jwt_verification_success', {
        userId: verifiedToken.sub,
        tokenId: verifiedToken.jti,
      });

      return {
        valid: true,
        userId: verifiedToken.sub,
        claims: verifiedToken as unknown as Record<string, unknown>,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logSecurityEvent('jwt_verification_failed', {
        error: errorMessage,
        tokenPrefix: token.substring(0, 20) + '...',
      });

      return { valid: false, userId: null, error: errorMessage };
    }
  }

  // Development: try Clerk verification first, fall back to decode-only with warning
  if (CLERK_SECRET_KEY) {
    try {
      const verifiedToken = await verifyToken(token, {
        secretKey: CLERK_SECRET_KEY,
      });

      if (verifiedToken && verifiedToken.sub) {
        return {
          valid: true,
          userId: verifiedToken.sub,
          claims: verifiedToken as unknown as Record<string, unknown>,
        };
      }
    } catch (error) {
      // In development, log but allow fallback
      console.warn('[SECURITY] Clerk verification failed, trying decode fallback:', error);
    }
  }

  // Development fallback: decode without verification (WITH WARNING)
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, userId: null, error: 'Invalid JWT format' };
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

    // Validate basic structure
    if (!payload.sub) {
      return { valid: false, userId: null, error: 'Missing sub claim' };
    }

    // Check for Clerk token markers
    const isClerkToken = payload.iss?.includes('clerk') || payload.azp?.includes('http');
    if (!isClerkToken) {
      return { valid: false, userId: null, error: 'Not a Clerk token' };
    }

    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return { valid: false, userId: null, error: 'Token expired' };
    }

    console.warn('[SECURITY] JWT decoded without signature verification (dev mode only)');

    return {
      valid: true,
      userId: payload.sub,
      claims: payload,
    };

  } catch (error) {
    return { valid: false, userId: null, error: 'Failed to decode token' };
  }
}

// ============================================================================
// AI PROMPT SANITIZATION
// ============================================================================

/**
 * Characters and patterns that could be used for prompt injection
 */
const DANGEROUS_PATTERNS = [
  // System prompt override attempts
  /\[system\]/gi,
  /\[assistant\]/gi,
  /\[user\]/gi,
  /<\|system\|>/gi,
  /<\|assistant\|>/gi,
  /<\|user\|>/gi,
  /\{\{system\}\}/gi,
  /<<SYS>>/gi,
  /<\/s>/gi,
  // Role hijacking
  /you are now/gi,
  /ignore (all )?(previous |prior )?instructions/gi,
  /disregard (all )?(previous |prior )?instructions/gi,
  /forget (all )?(previous |prior )?(instructions|rules)/gi,
  /new instructions:/gi,
  /override:/gi,
  /admin mode/gi,
  /developer mode/gi,
  /jailbreak/gi,
  /DAN mode/gi,
  // Delimiter manipulation
  /```system/gi,
  /"""system/gi,
  /'''system/gi,
];

/**
 * Sanitize user input before including in AI prompts
 *
 * SECURITY: Prevents prompt injection attacks by:
 * 1. Escaping special delimiters
 * 2. Removing dangerous patterns
 * 3. Enforcing length limits
 * 4. Adding clear boundaries
 */
export function sanitizeForAIPrompt(
  userContent: string,
  options: {
    maxLength?: number;
    allowNewlines?: boolean;
    wrapInDelimiters?: boolean;
  } = {}
): string {
  const {
    maxLength = 50000,
    allowNewlines = true,
    wrapInDelimiters = true,
  } = options;

  let sanitized = userContent;

  // 1. Enforce length limit
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
    logSecurityEvent('ai_prompt_truncated', { originalLength: userContent.length, maxLength });
  }

  // 2. Normalize whitespace
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]+/g, ' ');
  }

  // 3. Remove dangerous patterns (replace with safe markers)
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      sanitized = sanitized.replace(pattern, '[FILTERED]');
      logSecurityEvent('ai_prompt_injection_blocked', { pattern: pattern.source });
    }
  }

  // 4. Escape XML-like tags that could confuse Claude
  sanitized = sanitized.replace(/<([a-zA-Z_]+)>/g, '&lt;$1&gt;');
  sanitized = sanitized.replace(/<\/([a-zA-Z_]+)>/g, '&lt;/$1&gt;');

  // 5. Wrap in clear delimiters if requested
  if (wrapInDelimiters) {
    sanitized = `<user_content>\n${sanitized}\n</user_content>`;
  }

  return sanitized;
}

/**
 * Sanitize essay content specifically (more permissive, keeps formatting)
 */
export function sanitizeEssayContent(essay: string): string {
  return sanitizeForAIPrompt(essay, {
    maxLength: 100000,
    allowNewlines: true,
    wrapInDelimiters: true,
  });
}

/**
 * Sanitize chat message (more restrictive)
 */
export function sanitizeChatMessage(message: string): string {
  return sanitizeForAIPrompt(message, {
    maxLength: 10000,
    allowNewlines: true,
    wrapInDelimiters: false,
  });
}

// ============================================================================
// ERROR MESSAGE SANITIZATION
// ============================================================================

/**
 * Patterns that indicate sensitive information in error messages
 */
const SENSITIVE_ERROR_PATTERNS = [
  /password/gi,
  /secret/gi,
  /key[=:]/gi,
  /token[=:]/gi,
  /authorization/gi,
  /credential/gi,
  /api[_-]?key/gi,
  /connection string/gi,
  /database url/gi,
  /supabase/gi,
  /stripe/gi,
  /clerk/gi,
  /anthropic/gi,
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, // JWT pattern
  /sk_[a-zA-Z0-9_]+/g, // Stripe key pattern
  /pk_[a-zA-Z0-9_]+/g, // Stripe publishable key pattern
  /sk-[a-zA-Z0-9_]+/g, // Anthropic key pattern
];

/**
 * Generic error codes for client responses
 */
export const ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BILLING_ERROR: 'BILLING_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Sanitize error message for client response
 *
 * SECURITY: Never expose internal error details to clients.
 * Log the full error server-side, return generic message to client.
 */
export function sanitizeErrorForClient(
  error: unknown,
  context?: string
): { code: ErrorCode; message: string } {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log full error server-side
  logSecurityEvent('error_sanitized', {
    context,
    originalMessage: errorMessage,
    hasStack: !!errorStack,
  });

  // Check for sensitive information
  const containsSensitive = SENSITIVE_ERROR_PATTERNS.some(pattern =>
    pattern.test(errorMessage)
  );

  if (containsSensitive) {
    logSecurityEvent('sensitive_error_blocked', { context });
    return {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'An internal error occurred. Please try again.',
    };
  }

  // Map common error types to generic messages
  if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
    return { code: ERROR_CODES.AUTH_INVALID, message: 'Authentication failed' };
  }
  if (errorMessage.includes('Forbidden') || errorMessage.includes('403')) {
    return { code: ERROR_CODES.PERMISSION_DENIED, message: 'Permission denied' };
  }
  if (errorMessage.includes('Not found') || errorMessage.includes('404')) {
    return { code: ERROR_CODES.NOT_FOUND, message: 'Resource not found' };
  }
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return { code: ERROR_CODES.RATE_LIMITED, message: 'Too many requests. Please wait.' };
  }
  if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    return { code: ERROR_CODES.SERVICE_UNAVAILABLE, message: 'Service temporarily unavailable' };
  }

  // Default: generic error
  return {
    code: ERROR_CODES.INTERNAL_ERROR,
    message: 'An error occurred. Please try again.',
  };
}

// ============================================================================
// SECURITY AUDIT LOGGING
// ============================================================================

export type SecurityEventType =
  | 'jwt_verification_success'
  | 'jwt_verification_failed'
  | 'auth_bypass_attempt'
  | 'dev_auth_used'
  | 'ai_prompt_injection_blocked'
  | 'ai_prompt_truncated'
  | 'error_sanitized'
  | 'sensitive_error_blocked'
  | 'stripe_webhook_verified'
  | 'stripe_webhook_failed'
  | 'stripe_webhook_bypass_blocked'
  | 'rate_limit_exceeded'
  | 'cors_blocked'
  | 'input_validation_failed'
  | 'credit_deduction'
  | 'suspicious_activity';

interface SecurityEvent {
  timestamp: string;
  type: SecurityEventType;
  severity: 'info' | 'warning' | 'error' | 'critical';
  data: Record<string, unknown>;
  environment: string;
}

/**
 * Log security event for audit trail
 *
 * In production, this should be sent to a dedicated logging service
 * (e.g., CloudWatch, Datadog, Splunk)
 */
export function logSecurityEvent(
  type: SecurityEventType,
  data: Record<string, unknown> = {}
): void {
  const severity = getEventSeverity(type);

  const event: SecurityEvent = {
    timestamp: new Date().toISOString(),
    type,
    severity,
    data: sanitizeLogData(data),
    environment: process.env.NODE_ENV || 'development',
  };

  // In production, you'd send this to a logging service
  // For now, log to console with appropriate level
  const logPrefix = `[SECURITY:${severity.toUpperCase()}]`;

  switch (severity) {
    case 'critical':
      console.error(logPrefix, JSON.stringify(event));
      break;
    case 'error':
      console.error(logPrefix, JSON.stringify(event));
      break;
    case 'warning':
      console.warn(logPrefix, JSON.stringify(event));
      break;
    default:
      // Only log info in non-production to avoid noise
      if (!isProduction) {
        console.log(logPrefix, JSON.stringify(event));
      }
  }
}

function getEventSeverity(type: SecurityEventType): SecurityEvent['severity'] {
  const severityMap: Record<SecurityEventType, SecurityEvent['severity']> = {
    jwt_verification_success: 'info',
    jwt_verification_failed: 'warning',
    auth_bypass_attempt: 'critical',
    dev_auth_used: 'warning',
    ai_prompt_injection_blocked: 'warning',
    ai_prompt_truncated: 'info',
    error_sanitized: 'info',
    sensitive_error_blocked: 'warning',
    stripe_webhook_verified: 'info',
    stripe_webhook_failed: 'error',
    stripe_webhook_bypass_blocked: 'critical',
    rate_limit_exceeded: 'warning',
    cors_blocked: 'warning',
    input_validation_failed: 'warning',
    credit_deduction: 'info',
    suspicious_activity: 'error',
  };

  return severityMap[type] || 'info';
}

/**
 * Remove sensitive data from log payloads
 */
function sanitizeLogData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip sensitive keys
    if (/password|secret|key|token|credential/i.test(key)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Truncate long strings
    if (typeof value === 'string' && value.length > 500) {
      sanitized[key] = value.substring(0, 500) + '...[truncated]';
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

// ============================================================================
// INPUT VALIDATION HELPERS
// ============================================================================

/**
 * Validate that a string is a safe Clerk user ID
 */
export function isValidClerkUserId(userId: unknown): userId is string {
  if (typeof userId !== 'string') return false;
  // Clerk user IDs start with "user_" followed by alphanumeric characters
  return /^user_[a-zA-Z0-9]+$/.test(userId);
}

/**
 * Validate email format
 */
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate that a value is a positive integer
 */
export function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { clerkClient };
