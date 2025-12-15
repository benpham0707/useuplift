# Practical Anti-Fraud System Implementation Plan
## IP + Device Tracking Without Excessive Barriers

**Created**: December 10, 2025
**Purpose**: Implement pragmatic fraud prevention focused on IP and device tracking while maintaining user experience
**Priority**: High (impacts unit economics and sustainability)

---

## Executive Summary

### Current Situation
- Users already verify email via Clerk/Supabase authentication
- Users can still create multiple accounts using alternate/disposable emails
- **Core Problem**: Email verification alone is insufficient - users bypass by using alternate emails

### Key Insight
Email verification is already handled ✅, but users game the system with:
- Alternate personal emails (user123@gmail.com, user456@outlook.com)
- New disposable emails created specifically for verification
- Friend/family email addresses

### Proposed Solution
**Focus on IP + Device tracking as primary fraud prevention**, not email tricks. This is more practical because:
1. **Harder to bypass**: Users can't easily change their device fingerprint
2. **Less friction**: No additional verification steps for legitimate users
3. **More effective**: Catches account farming even with legitimate emails
4. **Better UX**: Works silently in the background

### Expected Impact
- **Fraud rate**: 40-60% → 5-10%
- **Free tier cost**: $0.40-1.50 → $0.30-0.35
- **False positive rate**: <3% (minimal legitimate user blocking)
- **No additional verification burden** on 95%+ of users

---

## Table of Contents

1. [Architecture Overview](#architecture)
2. [Layer 1: IP Tracking & Rate Limiting](#ip-tracking)
3. [Layer 2: Device Fingerprinting](#device-fingerprinting)
4. [Layer 3: Usage Pattern Analysis](#usage-patterns)
5. [Layer 4: Conditional Phone Verification](#phone-verification)
6. [Database Schema](#database)
7. [Implementation Roadmap](#roadmap)
8. [Testing Strategy](#testing)
9. [Cost-Benefit Analysis](#cost-benefit)
10. [Monitoring & Alerts](#monitoring)

---

<a name="architecture"></a>
## 1. Architecture Overview

### Core Philosophy
**"Trust but verify with silent monitoring"**

Instead of blocking users upfront, we:
1. **Track** IP addresses and device fingerprints
2. **Monitor** usage patterns silently
3. **Flag** suspicious behavior for automated responses
4. **Require phone verification only** when risk score is high

### Why This Works Better

**Traditional approach (what we're NOT doing)**:
- Block email aliases → Users just use different email providers
- Require phone upfront → Friction reduces conversion by 20-30%
- Manual review queue → Doesn't scale, slow, expensive

**Our approach**:
- Track device + IP → Hard to bypass without technical knowledge
- Silent monitoring → No UX friction for 95% of users
- Automatic risk scoring → Scalable, fast, data-driven
- Conditional phone verification → Only high-risk users (5%)

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│  User Sign-Up Flow                                          │
│  ↓                                                           │
│  1. Email verification (already exists via Clerk)           │
│  2. Silent device fingerprint capture                       │
│  3. IP address logging                                      │
│  4. Check IP + device limits                                │
│  5. Allow account creation (track everything)               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Usage Monitoring (Passive)                                 │
│  ↓                                                           │
│  1. Track all analyses/chat usage                           │
│  2. Associate usage with IP + device + user                 │
│  3. Calculate cross-account patterns                        │
│  4. Update risk scores in real-time                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Risk-Based Actions (Automated)                             │
│  ↓                                                           │
│  Low Risk (0-0.3)    → Normal usage                         │
│  Medium Risk (0.3-0.6) → Gentle rate limiting               │
│  High Risk (0.6-0.8)  → Require phone verification          │
│  Very High (0.8-1.0)  → Block new usage, manual review      │
└─────────────────────────────────────────────────────────────┘
```

---

<a name="ip-tracking"></a>
## 2. Layer 1: IP Tracking & Rate Limiting

### Objectives
1. **Track** how many free accounts are created from each IP
2. **Limit** free account creation per IP to reasonable thresholds
3. **Detect** shared IPs (schools, libraries) and adjust limits
4. **Monitor** cross-account usage patterns from same IP

### Technical Implementation

#### 2.1 IP Extraction & Validation

```typescript
/**
 * src/utils/ip-tracking.ts
 * Get real IP address (handle proxies, load balancers)
 */
export function getClientIP(req: Request): string {
  // Check various headers in order of reliability
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const cfConnectingIP = req.headers['cf-connecting-ip']; // Cloudflare

  if (cfConnectingIP) {
    return cfConnectingIP as string;
  }

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
    const ips = (forwardedFor as string).split(',');
    return ips[0].trim(); // First IP is the client
  }

  if (realIP) {
    return realIP as string;
  }

  // Fallback to connection remote address
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Normalize IP address (handle IPv4, IPv6)
 */
export function normalizeIP(ip: string): string {
  // Convert IPv6-mapped IPv4 to IPv4
  // ::ffff:192.0.2.1 → 192.0.2.1
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }

  // For IPv6, keep as-is
  return ip;
}
```

#### 2.2 IP-Based Signup Limiting

```typescript
/**
 * src/services/fraud/ip-rate-limiter.ts
 * Check if IP can create another free account
 */

interface IPLimitCheck {
  allowed: boolean;
  reason?: string;
  accountCount: number;
  isSharedIP: boolean;
}

export async function checkIPSignupLimit(
  ipAddress: string
): Promise<IPLimitCheck> {
  const normalizedIP = normalizeIP(ipAddress);

  // Time windows
  const LAST_30_DAYS = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const LAST_24_HOURS = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Count recent free account signups from this IP
  const accountsLast30Days = await db.query(`
    SELECT COUNT(DISTINCT user_id) as count
    FROM ip_signup_tracking
    WHERE ip_address = $1
      AND created_at >= $2
      AND is_free_account = true
  `, [normalizedIP, LAST_30_DAYS]);

  const accountsLast24Hours = await db.query(`
    SELECT COUNT(DISTINCT user_id) as count
    FROM ip_signup_tracking
    WHERE ip_address = $1
      AND created_at >= $2
      AND is_free_account = true
  `, [normalizedIP, LAST_24_HOURS]);

  const count30Days = accountsLast30Days.rows[0].count;
  const count24Hours = accountsLast24Hours.rows[0].count;

  // Detect if this is a shared IP (school, library, etc.)
  const isShared = await isSharedIPAddress(normalizedIP);

  // Set limits based on IP type
  const MAX_PER_30_DAYS = isShared ? 20 : 3;  // Higher for schools
  const MAX_PER_24_HOURS = isShared ? 10 : 2; // Prevent rapid abuse

  // Check 30-day limit
  if (count30Days >= MAX_PER_30_DAYS) {
    return {
      allowed: false,
      reason: isShared
        ? `This network has reached its monthly limit of ${MAX_PER_30_DAYS} free accounts. Please contact support if you believe this is an error.`
        : `Maximum ${MAX_PER_30_DAYS} free accounts per household. Upgrade to paid or contact support.`,
      accountCount: count30Days,
      isSharedIP: isShared,
    };
  }

  // Check 24-hour limit (prevents rapid account farming)
  if (count24Hours >= MAX_PER_24_HOURS) {
    return {
      allowed: false,
      reason: `Maximum ${MAX_PER_24_HOURS} accounts per day from this network. Please wait 24 hours or contact support.`,
      accountCount: count24Hours,
      isSharedIP: isShared,
    };
  }

  return {
    allowed: true,
    accountCount: count30Days,
    isSharedIP: isShared,
  };
}

/**
 * Detect shared IPs (schools, libraries, coffee shops)
 */
async function isSharedIPAddress(ipAddress: string): Promise<boolean> {
  const LAST_7_DAYS = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Count unique users from this IP in last 7 days
  const result = await db.query(`
    SELECT COUNT(DISTINCT user_id) as unique_users
    FROM ip_usage_tracking
    WHERE ip_address = $1
      AND created_at >= $2
  `, [ipAddress, LAST_7_DAYS]);

  const uniqueUsers = result.rows[0].unique_users;

  // If >15 unique users from same IP, it's likely shared
  return uniqueUsers > 15;
}
```

#### 2.3 Cross-Account Usage Tracking

```typescript
/**
 * Track usage across all accounts from same IP
 * Prevents users from creating account, using credits, creating another, etc.
 */

interface IPUsageLimit {
  allowed: boolean;
  reason?: string;
  usageCount: number;
}

export async function checkIPUsageLimit(
  ipAddress: string,
  actionType: 'analysis' | 'chat'
): Promise<IPUsageLimit> {
  const normalizedIP = normalizeIP(ipAddress);
  const LAST_24_HOURS = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Count ALL usage from this IP (across all accounts) in last 24 hours
  const result = await db.query(`
    SELECT
      COUNT(*) as action_count,
      COALESCE(SUM(credits_used), 0) as total_credits_used
    FROM ip_usage_tracking
    WHERE ip_address = $1
      AND action_type = $2
      AND created_at >= $3
  `, [normalizedIP, actionType, LAST_24_HOURS]);

  const actionCount = result.rows[0].action_count;
  const creditsUsed = result.rows[0].total_credits_used;

  // Check if shared IP
  const isShared = await isSharedIPAddress(normalizedIP);

  // Set limits
  const MAX_ANALYSES_PER_DAY = isShared ? 50 : 15; // Across ALL accounts
  const MAX_CREDITS_PER_DAY = isShared ? 300 : 100; // Total free credits per IP

  if (actionType === 'analysis' && actionCount >= MAX_ANALYSES_PER_DAY) {
    return {
      allowed: false,
      reason: `This network has used ${actionCount} analyses today (limit: ${MAX_ANALYSES_PER_DAY}). This prevents abuse. Upgrade to remove limits.`,
      usageCount: actionCount,
    };
  }

  if (creditsUsed >= MAX_CREDITS_PER_DAY) {
    return {
      allowed: false,
      reason: `This network has used ${creditsUsed} free credits today (limit: ${MAX_CREDITS_PER_DAY}). Upgrade for unlimited usage.`,
      usageCount: creditsUsed,
    };
  }

  return {
    allowed: true,
    usageCount: actionCount,
  };
}
```

#### 2.4 Integration into Signup Flow

```typescript
/**
 * src/api/auth/signup.ts
 * Integrate IP checking into signup
 */

export async function handleSignup(req: Request, res: Response) {
  const { email, password } = req.body;

  // Get IP address
  const ipAddress = getClientIP(req);

  try {
    // Check IP signup limit
    const ipCheck = await checkIPSignupLimit(ipAddress);

    if (!ipCheck.allowed) {
      return res.status(429).json({
        error: 'Account limit reached',
        message: ipCheck.reason,
        details: {
          accountCount: ipCheck.accountCount,
          isSharedNetwork: ipCheck.isSharedIP,
        },
      });
    }

    // Create user via Clerk/Supabase (email verification handled automatically)
    const user = await createUser({ email, password });

    // Track signup in our system
    await db.query(`
      INSERT INTO ip_signup_tracking (
        ip_address,
        user_id,
        is_free_account,
        created_at
      ) VALUES ($1, $2, true, NOW())
    `, [normalizeIP(ipAddress), user.id]);

    // Also store IP on user record for quick reference
    await db.query(`
      UPDATE users
      SET signup_ip = $1, last_seen_ip = $1
      WHERE id = $2
    `, [normalizeIP(ipAddress), user.id]);

    // Warn if approaching limit
    if (ipCheck.accountCount >= 2) {
      console.warn(`IP ${ipAddress} has created ${ipCheck.accountCount + 1} accounts (limit: 3)`);
    }

    return res.status(201).json({
      success: true,
      user: sanitizeUser(user),
      warnings: ipCheck.accountCount >= 2 ? [
        'This is your final free account from this network. Additional accounts will require verification.',
      ] : [],
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      error: 'Signup failed',
      message: error.message,
    });
  }
}
```

#### 2.5 Integration into Usage Flow

```typescript
/**
 * src/api/analysis/run-analysis.ts
 * Check IP limits before running analysis
 */

export async function handleRunAnalysis(req: Request, res: Response) {
  const { essayText, promptType } = req.body;
  const userId = req.user.id; // From auth middleware
  const ipAddress = getClientIP(req);

  try {
    // Check IP-based usage limit
    const ipUsageCheck = await checkIPUsageLimit(ipAddress, 'analysis');

    if (!ipUsageCheck.allowed) {
      return res.status(429).json({
        error: 'Usage limit reached',
        message: ipUsageCheck.reason,
        details: {
          usageCount: ipUsageCheck.usageCount,
        },
      });
    }

    // Check user credits
    const user = await getUserById(userId);
    if (user.credits < 6) {
      return res.status(402).json({
        error: 'Insufficient credits',
        message: 'Purchase more credits to continue.',
      });
    }

    // Run analysis
    const result = await performAnalysis(essayText, promptType);

    // Deduct credits
    await db.query(`
      UPDATE users
      SET credits = credits - 6,
          last_seen_ip = $1
      WHERE id = $2
    `, [normalizeIP(ipAddress), userId]);

    // Track usage for IP monitoring
    await db.query(`
      INSERT INTO ip_usage_tracking (
        ip_address,
        user_id,
        action_type,
        credits_used,
        created_at
      ) VALUES ($1, $2, 'analysis', 6, NOW())
    `, [normalizeIP(ipAddress), userId]);

    return res.status(200).json({
      success: true,
      result,
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({
      error: 'Analysis failed',
      message: error.message,
    });
  }
}
```

---

<a name="device-fingerprinting"></a>
## 3. Layer 2: Device Fingerprinting

### Objectives
1. **Identify** unique devices even when IP changes (VPN, different networks)
2. **Limit** free accounts per device (harder to bypass than IP)
3. **Detect** suspicious patterns (same device, multiple accounts, different IPs)
4. **Silent tracking** - no user action required

### Why Device Fingerprinting > Email Tricks

**Email normalization issues**:
- Users can use totally different email providers
- Gmail+tricks only catch lazy users
- Creates false sense of security

**Device fingerprinting advantages**:
- Tracks browser/device, not email
- Persists across sessions, incognito mode
- Very hard to bypass without technical knowledge
- Works even if user switches emails

### Technical Implementation

#### 3.1 Fingerprint.js Integration (Client-side)

```typescript
/**
 * src/lib/fingerprint.ts
 * Client-side device fingerprinting
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs-pro';

// Initialize once, reuse across app
const fpPromise = FingerprintJS.load({
  apiKey: process.env.NEXT_PUBLIC_FINGERPRINT_API_KEY!,
  region: 'us',

  // Endpoint for server-side integration (optional)
  endpoint: '/api/fingerprint/result',
});

/**
 * Get device fingerprint
 * Returns stable visitor ID across sessions
 */
export async function getDeviceFingerprint(): Promise<{
  visitorId: string;
  confidence: number;
  requestId: string;
  metadata?: {
    incognito: boolean;
    bot: boolean;
    vpn: boolean;
  };
}> {
  try {
    const fp = await fpPromise;
    const result = await fp.get();

    return {
      visitorId: result.visitorId,
      confidence: result.confidence.score,
      requestId: result.requestId,
      metadata: {
        incognito: result.incognito || false,
        bot: result.bot?.result !== 'notDetected',
        vpn: result.vpn?.result === 'yes',
      },
    };
  } catch (error) {
    console.error('Fingerprint error:', error);
    // Fail gracefully - return fallback
    return {
      visitorId: 'unknown',
      confidence: 0,
      requestId: '',
    };
  }
}
```

#### 3.2 Send Fingerprint on Signup

```typescript
/**
 * src/components/auth/SignupForm.tsx
 * Capture fingerprint during signup
 */

import { getDeviceFingerprint } from '@/lib/fingerprint';

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get device fingerprint
      const fingerprint = await getDeviceFingerprint();

      // Send to signup endpoint
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          deviceFingerprint: fingerprint, // Include fingerprint
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // Success - redirect
      router.push('/dashboard');

    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... form fields ... */}
    </form>
  );
}
```

#### 3.3 Backend Fingerprint Validation

```typescript
/**
 * src/services/fraud/device-fingerprint.ts
 * Server-side fingerprint tracking and limits
 */

interface DeviceLimitCheck {
  allowed: boolean;
  reason?: string;
  accountCount: number;
  confidenceScore: number;
  requiresPhoneVerification: boolean;
}

export async function checkDeviceFingerprintLimit(
  visitorId: string,
  confidence: number,
  metadata?: {
    incognito?: boolean;
    bot?: boolean;
    vpn?: boolean;
  }
): Promise<DeviceLimitCheck> {

  // Reject bots immediately
  if (metadata?.bot) {
    return {
      allowed: false,
      reason: 'Automated bot detected. Please contact support if this is an error.',
      accountCount: 0,
      confidenceScore: confidence,
      requiresPhoneVerification: false,
    };
  }

  // Count free accounts from this device
  const result = await db.query(`
    SELECT COUNT(DISTINCT u.id) as account_count
    FROM device_fingerprints df
    JOIN users u ON df.user_id = u.id
    WHERE df.fingerprint_id = $1
      AND u.is_paid = false
      AND u.account_status = 'active'
  `, [visitorId]);

  const accountCount = result.rows[0].account_count;

  // Base limit: 2 free accounts per device
  const MAX_FREE_ACCOUNTS_PER_DEVICE = 2;

  if (accountCount >= MAX_FREE_ACCOUNTS_PER_DEVICE) {
    return {
      allowed: false,
      reason: `Maximum ${MAX_FREE_ACCOUNTS_PER_DEVICE} free accounts detected from this device. Upgrade to paid or contact support if you believe this is an error.`,
      accountCount,
      confidenceScore: confidence,
      requiresPhoneVerification: false,
    };
  }

  // Low confidence fingerprint? Require phone verification instead of blocking
  if (confidence < 0.7 && accountCount >= 1) {
    return {
      allowed: true, // Allow but flag for phone verification
      reason: 'Device verification required for additional account.',
      accountCount,
      confidenceScore: confidence,
      requiresPhoneVerification: true,
    };
  }

  // VPN detected + multiple accounts? Require phone verification
  if (metadata?.vpn && accountCount >= 1) {
    return {
      allowed: true,
      reason: 'VPN detected. Phone verification required for security.',
      accountCount,
      confidenceScore: confidence,
      requiresPhoneVerification: true,
    };
  }

  // Incognito + multiple accounts? Flag but allow
  const requiresPhone = metadata?.incognito && accountCount >= 1;

  return {
    allowed: true,
    accountCount,
    confidenceScore: confidence,
    requiresPhoneVerification: requiresPhone,
  };
}

/**
 * Store device fingerprint
 */
export async function trackDeviceFingerprint(
  userId: number,
  visitorId: string,
  ipAddress: string,
  userAgent: string,
  metadata: any
): Promise<void> {
  await db.query(`
    INSERT INTO device_fingerprints (
      fingerprint_id,
      user_id,
      ip_address,
      user_agent,
      confidence_score,
      is_incognito,
      is_vpn,
      is_bot,
      created_at,
      last_seen_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    ON CONFLICT (fingerprint_id, user_id)
    DO UPDATE SET
      last_seen_at = NOW(),
      ip_address = EXCLUDED.ip_address
  `, [
    visitorId,
    userId,
    ipAddress,
    userAgent,
    metadata.confidence || 1.0,
    metadata.incognito || false,
    metadata.vpn || false,
    metadata.bot || false,
  ]);
}
```

#### 3.4 Integrated Signup Flow

```typescript
/**
 * src/api/auth/signup.ts
 * Complete signup with IP + Device checks
 */

export async function handleSignup(req: Request, res: Response) {
  const { email, password, deviceFingerprint } = req.body;
  const ipAddress = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';

  try {
    // LAYER 1: Check IP limit
    const ipCheck = await checkIPSignupLimit(ipAddress);
    if (!ipCheck.allowed) {
      return res.status(429).json({
        error: 'IP limit reached',
        message: ipCheck.reason,
      });
    }

    // LAYER 2: Check device fingerprint limit (if provided)
    let requiresPhoneVerification = false;

    if (deviceFingerprint?.visitorId !== 'unknown') {
      const deviceCheck = await checkDeviceFingerprintLimit(
        deviceFingerprint.visitorId,
        deviceFingerprint.confidence,
        deviceFingerprint.metadata
      );

      if (!deviceCheck.allowed) {
        return res.status(429).json({
          error: 'Device limit reached',
          message: deviceCheck.reason,
        });
      }

      requiresPhoneVerification = deviceCheck.requiresPhoneVerification;
    }

    // Create user via Clerk/Supabase
    const user = await createUser({ email, password });

    // Track IP signup
    await db.query(`
      INSERT INTO ip_signup_tracking (
        ip_address, user_id, is_free_account
      ) VALUES ($1, $2, true)
    `, [normalizeIP(ipAddress), user.id]);

    // Track device fingerprint (if provided)
    if (deviceFingerprint?.visitorId !== 'unknown') {
      await trackDeviceFingerprint(
        user.id,
        deviceFingerprint.visitorId,
        ipAddress,
        userAgent,
        deviceFingerprint
      );
    }

    // Update user record
    await db.query(`
      UPDATE users
      SET
        signup_ip = $1,
        last_seen_ip = $1,
        signup_fingerprint = $2,
        requires_phone_verification = $3
      WHERE id = $4
    `, [
      normalizeIP(ipAddress),
      deviceFingerprint?.visitorId || null,
      requiresPhoneVerification,
      user.id,
    ]);

    return res.status(201).json({
      success: true,
      user: sanitizeUser(user),
      requiresPhoneVerification,
      message: requiresPhoneVerification
        ? 'Account created. Phone verification required before using credits.'
        : 'Account created successfully.',
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      error: 'Signup failed',
      message: error.message,
    });
  }
}
```

---

<a name="usage-patterns"></a>
## 4. Layer 3: Usage Pattern Analysis

### Objectives
1. **Detect** suspicious behavior patterns (account farming signals)
2. **Calculate** risk scores based on multiple signals
3. **Automate** responses (rate limiting, phone verification)
4. **Improve** over time with feedback loop

### Behavioral Signals to Track

#### High-Risk Signals (Strong fraud indicators)
1. **Multiple accounts from same device/IP with different emails**
2. **Immediate usage** (analysis within 60 seconds of signup)
3. **Analysis-only pattern** (no chat, no workshop, just analyses)
4. **Rapid account cycling** (exhaust credits → new account → repeat)
5. **Identical essays** across multiple accounts (copy-paste farming)

#### Medium-Risk Signals
1. **VPN + multiple accounts**
2. **Low fingerprint confidence + multiple accounts**
3. **Unusual signup time** (2am-5am)
4. **No interaction** with teaching content (skip workshop)

#### Low-Risk Signals
1. **Incognito mode** (privacy-conscious, not fraud)
2. **Shared IP** (schools, libraries)
3. **Multiple devices** (phone + laptop = normal)

### Risk Scoring Implementation

```typescript
/**
 * src/services/fraud/risk-scoring.ts
 * Calculate fraud risk score for users
 */

interface RiskSignal {
  type: string;
  score: number; // 0-1
  weight: number;
  description: string;
}

interface RiskAssessment {
  overallScore: number; // 0-1
  signals: RiskSignal[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: string;
}

/**
 * Calculate comprehensive risk score
 */
export async function assessUserRisk(userId: number): Promise<RiskAssessment> {
  const signals: RiskSignal[] = [];

  // Get user data
  const user = await getUserById(userId);
  const ipAddress = user.last_seen_ip;
  const fingerprint = user.signup_fingerprint;

  // SIGNAL 1: Multiple accounts from same device
  if (fingerprint) {
    const deviceAccountCount = await db.query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM device_fingerprints
      WHERE fingerprint_id = $1
    `, [fingerprint]);

    const count = deviceAccountCount.rows[0].count;

    if (count > 1) {
      signals.push({
        type: 'multiple_accounts_same_device',
        score: Math.min(count / 2, 1.0), // 2 accounts = 1.0
        weight: 3.0, // High weight
        description: `${count} accounts detected from this device`,
      });
    }
  }

  // SIGNAL 2: Multiple accounts from same IP
  const ipAccountCount = await db.query(`
    SELECT COUNT(DISTINCT user_id) as count
    FROM ip_signup_tracking
    WHERE ip_address = $1
      AND created_at >= NOW() - INTERVAL '30 days'
  `, [ipAddress]);

  const ipCount = ipAccountCount.rows[0].count;

  if (ipCount > 2) {
    signals.push({
      type: 'multiple_accounts_same_ip',
      score: Math.min(ipCount / 3, 1.0),
      weight: 2.0,
      description: `${ipCount} accounts from this IP in 30 days`,
    });
  }

  // SIGNAL 3: Immediate usage after signup
  const timeToFirstAnalysis = await db.query(`
    SELECT EXTRACT(EPOCH FROM (MIN(created_at) - $1)) as seconds
    FROM ip_usage_tracking
    WHERE user_id = $2 AND action_type = 'analysis'
  `, [user.created_at, userId]);

  const secondsToFirstUse = timeToFirstAnalysis.rows[0]?.seconds;

  if (secondsToFirstUse && secondsToFirstUse < 60) {
    signals.push({
      type: 'immediate_usage',
      score: 0.6,
      weight: 1.5,
      description: `First analysis within ${Math.round(secondsToFirstUse)}s of signup`,
    });
  }

  // SIGNAL 4: Analysis-only usage (no workshop engagement)
  const usageStats = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE action_type = 'analysis') as analysis_count,
      COUNT(*) FILTER (WHERE action_type = 'chat') as chat_count
    FROM ip_usage_tracking
    WHERE user_id = $1
  `, [userId]);

  const { analysis_count, chat_count } = usageStats.rows[0];

  if (analysis_count >= 2 && chat_count === 0) {
    signals.push({
      type: 'analysis_only_usage',
      score: 0.7,
      weight: 2.0,
      description: `${analysis_count} analyses, 0 workshop messages`,
    });
  }

  // SIGNAL 5: VPN detected
  if (fingerprint) {
    const fingerprintData = await db.query(`
      SELECT is_vpn
      FROM device_fingerprints
      WHERE fingerprint_id = $1 AND user_id = $2
      LIMIT 1
    `, [fingerprint, userId]);

    if (fingerprintData.rows[0]?.is_vpn) {
      signals.push({
        type: 'vpn_detected',
        score: 0.4,
        weight: 1.5,
        description: 'VPN usage detected',
      });
    }
  }

  // SIGNAL 6: Low fingerprint confidence
  if (fingerprint) {
    const confidenceData = await db.query(`
      SELECT confidence_score
      FROM device_fingerprints
      WHERE fingerprint_id = $1 AND user_id = $2
      LIMIT 1
    `, [fingerprint, userId]);

    const confidence = confidenceData.rows[0]?.confidence_score || 1.0;

    if (confidence < 0.7) {
      signals.push({
        type: 'low_fingerprint_confidence',
        score: 1.0 - confidence,
        weight: 1.0,
        description: `Fingerprint confidence: ${(confidence * 100).toFixed(0)}%`,
      });
    }
  }

  // Calculate weighted risk score
  let totalScore = 0;
  let totalWeight = 0;

  for (const signal of signals) {
    totalScore += signal.score * signal.weight;
    totalWeight += signal.weight;
  }

  const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;

  // Determine risk level and action
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  let recommendedAction: string;

  if (overallScore < 0.3) {
    riskLevel = 'low';
    recommendedAction = 'allow_normal_usage';
  } else if (overallScore < 0.6) {
    riskLevel = 'medium';
    recommendedAction = 'apply_rate_limiting';
  } else if (overallScore < 0.8) {
    riskLevel = 'high';
    recommendedAction = 'require_phone_verification';
  } else {
    riskLevel = 'critical';
    recommendedAction = 'block_usage_pending_review';
  }

  // Store risk assessment
  await db.query(`
    INSERT INTO user_risk_scores (
      user_id,
      overall_risk_score,
      risk_level,
      signals,
      recommended_action,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      overall_risk_score = EXCLUDED.overall_risk_score,
      risk_level = EXCLUDED.risk_level,
      signals = EXCLUDED.signals,
      recommended_action = EXCLUDED.recommended_action,
      updated_at = NOW()
  `, [userId, overallScore, riskLevel, JSON.stringify(signals), recommendedAction]);

  return {
    overallScore,
    signals,
    riskLevel,
    recommendedAction,
  };
}
```

### Automated Risk-Based Actions

```typescript
/**
 * src/services/fraud/risk-actions.ts
 * Take automatic actions based on risk score
 */

export async function handleUserRisk(
  userId: number,
  riskAssessment: RiskAssessment
): Promise<void> {
  const { riskLevel, overallScore } = riskAssessment;

  switch (riskLevel) {
    case 'low':
      // No action needed
      await db.query(`
        UPDATE users
        SET
          rate_limit_multiplier = 1.0,
          requires_phone_verification = false,
          account_status = 'active'
        WHERE id = $1
      `, [userId]);
      break;

    case 'medium':
      // Apply gentle rate limiting (50% of normal limits)
      await db.query(`
        UPDATE users
        SET
          rate_limit_multiplier = 0.5,
          requires_phone_verification = false,
          account_status = 'active'
        WHERE id = $1
      `, [userId]);
      break;

    case 'high':
      // Require phone verification before further usage
      await db.query(`
        UPDATE users
        SET
          requires_phone_verification = true,
          credits_frozen = true,
          account_status = 'active'
        WHERE id = $1
      `, [userId]);

      // Send email notification
      await sendEmail({
        to: user.email,
        subject: 'Phone Verification Required',
        template: 'phone-verification-required',
        data: {
          reason: 'For security purposes, we need to verify your phone number.',
        },
      });
      break;

    case 'critical':
      // Block usage, flag for manual review
      await db.query(`
        UPDATE users
        SET
          account_status = 'under_review',
          credits_frozen = true,
          requires_manual_review = true
        WHERE id = $1
      `, [userId]);

      // Alert admin
      await notifyAdmin({
        type: 'critical_risk_user',
        userId,
        riskScore: overallScore,
        signals: riskAssessment.signals,
      });

      // Send email to user
      await sendEmail({
        to: user.email,
        subject: 'Account Under Review',
        template: 'account-under-review',
        data: {
          message: 'Our security system flagged your account. We\'ll review within 24 hours.',
        },
      });
      break;
  }
}

/**
 * Check risk score before allowing usage
 */
export async function checkRiskBeforeUsage(userId: number): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  // Get latest risk assessment
  const riskData = await db.query(`
    SELECT risk_level, requires_phone_verification, account_status
    FROM users u
    LEFT JOIN user_risk_scores rs ON u.id = rs.user_id
    WHERE u.id = $1
  `, [userId]);

  const { risk_level, requires_phone_verification, account_status } = riskData.rows[0];

  if (account_status === 'under_review') {
    return {
      allowed: false,
      reason: 'Your account is under security review. Our team will contact you within 24 hours.',
    };
  }

  if (account_status === 'suspended') {
    return {
      allowed: false,
      reason: 'Your account has been suspended. Please contact support.',
    };
  }

  if (requires_phone_verification) {
    const phoneVerified = await db.query(`
      SELECT phone_verified FROM users WHERE id = $1
    `, [userId]);

    if (!phoneVerified.rows[0].phone_verified) {
      return {
        allowed: false,
        reason: 'Phone verification required before using credits. Please verify your phone number.',
      };
    }
  }

  return { allowed: true };
}
```

---

<a name="phone-verification"></a>
## 5. Layer 4: Conditional Phone Verification

### Key Principle
**Only require phone verification for high-risk users (~5%), not everyone**

This balances security with user experience:
- 95% of users never see phone verification
- High-risk users must verify (hard to get multiple phone numbers)
- Much better conversion than requiring phone upfront

### When to Require Phone Verification

1. **Risk score > 0.6** (high/critical risk)
2. **Multiple accounts from same device** (2+)
3. **VPN detected + existing account** from similar fingerprint
4. **Low fingerprint confidence** (<0.7) + multiple accounts

### Implementation

```typescript
/**
 * src/services/phone-verification/twilio.ts
 * Phone verification via Twilio
 */

import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send verification code
 */
export async function sendVerificationCode(
  userId: number,
  phoneNumber: string
): Promise<void> {
  // Validate phone number format
  const validation = validatePhoneNumber(phoneNumber);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid phone number');
  }

  const normalizedPhone = validation.normalized!;

  // Check if phone already used by another account
  const existing = await db.query(`
    SELECT id FROM users
    WHERE phone_number = $1
      AND phone_verified = true
      AND id != $2
  `, [normalizedPhone, userId]);

  if (existing.rows.length > 0) {
    throw new Error('This phone number is already associated with another account.');
  }

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash code for storage
  const hashedCode = crypto
    .createHash('sha256')
    .update(code + process.env.VERIFICATION_SALT!)
    .digest('hex');

  // Store verification record
  await db.query(`
    INSERT INTO phone_verifications (
      user_id,
      phone_number,
      code_hash,
      expires_at,
      attempts_remaining,
      created_at
    ) VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes', 3, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      phone_number = EXCLUDED.phone_number,
      code_hash = EXCLUDED.code_hash,
      expires_at = EXCLUDED.expires_at,
      attempts_remaining = 3,
      created_at = NOW()
  `, [userId, normalizedPhone, hashedCode]);

  // Send SMS
  await client.messages.create({
    body: `Your Uplift verification code is: ${code}\n\nValid for 10 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: normalizedPhone,
  });
}

/**
 * Verify code
 */
export async function verifyCode(
  userId: number,
  code: string
): Promise<boolean> {
  // Get verification record
  const result = await db.query(`
    SELECT
      id, phone_number, code_hash, attempts_remaining,
      expires_at > NOW() as is_valid
    FROM phone_verifications
    WHERE user_id = $1
      AND verified_at IS NULL
  `, [userId]);

  if (result.rows.length === 0) {
    throw new Error('No pending verification found. Please request a new code.');
  }

  const verification = result.rows[0];

  if (!verification.is_valid) {
    throw new Error('Verification code expired. Please request a new code.');
  }

  if (verification.attempts_remaining <= 0) {
    throw new Error('Too many failed attempts. Please request a new code.');
  }

  // Hash input code
  const hashedInput = crypto
    .createHash('sha256')
    .update(code + process.env.VERIFICATION_SALT!)
    .digest('hex');

  // Check if code matches
  if (hashedInput !== verification.code_hash) {
    // Wrong code - decrement attempts
    await db.query(`
      UPDATE phone_verifications
      SET attempts_remaining = attempts_remaining - 1
      WHERE id = $1
    `, [verification.id]);

    const remaining = verification.attempts_remaining - 1;
    throw new Error(
      remaining > 0
        ? `Incorrect code. ${remaining} attempts remaining.`
        : 'Too many failed attempts. Please request a new code.'
    );
  }

  // Correct code - mark verified
  await db.query(`
    UPDATE phone_verifications
    SET verified_at = NOW()
    WHERE id = $1
  `, [verification.id]);

  await db.query(`
    UPDATE users
    SET
      phone_number = $1,
      phone_verified = true,
      credits_frozen = false,
      requires_phone_verification = false
    WHERE id = $2
  `, [verification.phone_number, userId]);

  return true;
}

/**
 * Validate phone number
 */
function validatePhoneNumber(phone: string): {
  valid: boolean;
  normalized?: string;
  error?: string;
} {
  const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

  try {
    const number = phoneUtil.parse(phone, 'US');

    if (!phoneUtil.isValidNumber(number)) {
      return { valid: false, error: 'Invalid phone number' };
    }

    const normalized = phoneUtil.format(
      number,
      require('google-libphonenumber').PhoneNumberFormat.E164
    );

    return { valid: true, normalized };
  } catch (error) {
    return { valid: false, error: 'Invalid phone number format' };
  }
}
```

### API Endpoints

```typescript
/**
 * src/api/phone-verification/send-code.ts
 */
export async function handleSendCode(req: Request, res: Response) {
  const userId = req.user.id;
  const { phoneNumber } = req.body;

  try {
    await sendVerificationCode(userId, phoneNumber);

    return res.status(200).json({
      success: true,
      message: 'Verification code sent. Check your phone.',
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message,
    });
  }
}

/**
 * src/api/phone-verification/verify-code.ts
 */
export async function handleVerifyCode(req: Request, res: Response) {
  const userId = req.user.id;
  const { code } = req.body;

  try {
    await verifyCode(userId, code);

    return res.status(200).json({
      success: true,
      message: 'Phone verified successfully. Your credits are now unlocked.',
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message,
    });
  }
}
```

---

<a name="database"></a>
## 6. Database Schema

### Complete SQL Schema

```sql
-- =====================================================
-- FRAUD PREVENTION DATABASE SCHEMA
-- =====================================================

-- -----------------------------------------------------
-- Table: ip_signup_tracking
-- Purpose: Track free account signups by IP address
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS ip_signup_tracking (
  id SERIAL PRIMARY KEY,
  ip_address INET NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_free_account BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ip_signups_ip_created
ON ip_signup_tracking(ip_address, created_at DESC);

CREATE INDEX idx_ip_signups_user
ON ip_signup_tracking(user_id);

-- -----------------------------------------------------
-- Table: ip_usage_tracking
-- Purpose: Track credit usage by IP (across all accounts)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS ip_usage_tracking (
  id SERIAL PRIMARY KEY,
  ip_address INET NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- 'analysis', 'chat'
  credits_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ip_usage_ip_time
ON ip_usage_tracking(ip_address, created_at DESC);

CREATE INDEX idx_ip_usage_user
ON ip_usage_tracking(user_id);

CREATE INDEX idx_ip_usage_action
ON ip_usage_tracking(action_type, created_at DESC);

-- -----------------------------------------------------
-- Table: device_fingerprints
-- Purpose: Track unique devices for fraud detection
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS device_fingerprints (
  id SERIAL PRIMARY KEY,
  fingerprint_id VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 1.0, -- 0.00 - 1.00
  is_incognito BOOLEAN DEFAULT false,
  is_vpn BOOLEAN DEFAULT false,
  is_bot BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(fingerprint_id, user_id)
);

CREATE INDEX idx_fingerprints_id
ON device_fingerprints(fingerprint_id);

CREATE INDEX idx_fingerprints_user
ON device_fingerprints(user_id);

CREATE INDEX idx_fingerprints_last_seen
ON device_fingerprints(last_seen_at DESC);

-- -----------------------------------------------------
-- Table: user_risk_scores
-- Purpose: Store calculated fraud risk scores
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_risk_scores (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  overall_risk_score DECIMAL(3,2) NOT NULL, -- 0.00 - 1.00
  risk_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  signals JSONB NOT NULL, -- Array of risk signals
  recommended_action VARCHAR(100) NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_risk_scores_level
ON user_risk_scores(risk_level);

CREATE INDEX idx_risk_scores_score
ON user_risk_scores(overall_risk_score DESC);

-- -----------------------------------------------------
-- Table: phone_verifications
-- Purpose: Track phone verification attempts
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS phone_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  code_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts_remaining INTEGER DEFAULT 3,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id) -- One active verification per user
);

CREATE INDEX idx_phone_verifications_user
ON phone_verifications(user_id);

CREATE INDEX idx_phone_verifications_phone
ON phone_verifications(phone_number);

-- -----------------------------------------------------
-- Table: admin_review_queue
-- Purpose: Queue for manual review of flagged accounts
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_review_queue (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flagged_reason TEXT NOT NULL,
  risk_score DECIMAL(3,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'suspended'
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_review_queue_status
ON admin_review_queue(status, created_at DESC);

CREATE INDEX idx_review_queue_user
ON admin_review_queue(user_id);

-- -----------------------------------------------------
-- Updates to users table
-- Add fraud-related columns
-- -----------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_ip INET;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_ip INET;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_fingerprint VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rate_limit_multiplier DECIMAL(3,2) DEFAULT 1.0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS requires_phone_verification BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_frozen BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS requires_manual_review BOOLEAN DEFAULT false;

CREATE INDEX idx_users_signup_ip ON users(signup_ip);
CREATE INDEX idx_users_signup_fingerprint ON users(signup_fingerprint);
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_requires_review ON users(requires_manual_review) WHERE requires_manual_review = true;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get account count from IP
CREATE OR REPLACE FUNCTION get_ip_account_count(ip_addr INET, days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
  SELECT COUNT(DISTINCT user_id)::INTEGER
  FROM ip_signup_tracking
  WHERE ip_address = ip_addr
    AND created_at >= NOW() - (days || ' days')::INTERVAL
    AND is_free_account = true;
$$ LANGUAGE SQL;

-- Function to get account count from device
CREATE OR REPLACE FUNCTION get_device_account_count(fingerprint VARCHAR)
RETURNS INTEGER AS $$
  SELECT COUNT(DISTINCT user_id)::INTEGER
  FROM device_fingerprints
  WHERE fingerprint_id = fingerprint;
$$ LANGUAGE SQL;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update last_seen_at for device fingerprints
CREATE OR REPLACE FUNCTION update_device_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE device_fingerprints
  SET last_seen_at = NOW()
  WHERE fingerprint_id = NEW.fingerprint_id
    AND user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Trigger would be created on usage table, not shown here for brevity

-- =====================================================
-- ANALYTICS VIEWS
-- =====================================================

-- View: High-risk users summary
CREATE OR REPLACE VIEW high_risk_users AS
SELECT
  u.id,
  u.email,
  u.created_at as signup_date,
  u.account_status,
  u.requires_phone_verification,
  u.phone_verified,
  rs.overall_risk_score,
  rs.risk_level,
  rs.signals,
  (SELECT COUNT(*) FROM ip_signup_tracking WHERE ip_address = u.signup_ip) as accounts_from_ip,
  (SELECT COUNT(*) FROM device_fingerprints WHERE fingerprint_id = u.signup_fingerprint) as accounts_from_device
FROM users u
LEFT JOIN user_risk_scores rs ON u.id = rs.user_id
WHERE rs.risk_level IN ('high', 'critical')
   OR u.requires_manual_review = true
ORDER BY rs.overall_risk_score DESC;

-- View: Daily fraud stats
CREATE OR REPLACE VIEW daily_fraud_stats AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_signups,
  COUNT(*) FILTER (WHERE requires_phone_verification = true) as phone_verification_required,
  COUNT(*) FILTER (WHERE requires_manual_review = true) as manual_review_required,
  ROUND(AVG((SELECT overall_risk_score FROM user_risk_scores WHERE user_id = users.id))::numeric, 3) as avg_risk_score
FROM users
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

<a name="roadmap"></a>
## 7. Implementation Roadmap

### Phase 1: Foundation (Week 1) - LAUNCH BLOCKER

**Goal**: Basic IP tracking to prevent most obvious fraud

#### Tasks
- [ ] **Day 1-2**: Database schema setup
  - Create all tables (ip_signup_tracking, ip_usage_tracking, device_fingerprints, etc.)
  - Add columns to users table
  - Create indexes
  - Write migration scripts
  - Test migrations on staging

- [ ] **Day 3-4**: IP tracking implementation
  - Implement `getClientIP()` utility
  - Implement `checkIPSignupLimit()`
  - Implement `checkIPUsageLimit()`
  - Integrate into signup endpoint
  - Integrate into analysis/chat endpoints
  - Add logging

- [ ] **Day 5**: Testing & deployment
  - Unit tests for IP tracking
  - Integration tests for signup flow
  - Load testing (simulate 100 signups from same IP)
  - Deploy to staging
  - Monitor for issues

**Deliverable**: Blocks 30-40% of fraud (IP-based account farming)

**Cost**: $0 (dev time only)

---

### Phase 2: Device Tracking (Week 2) - HIGH PRIORITY

**Goal**: Add device fingerprinting for stronger protection

#### Tasks
- [ ] **Day 1-2**: Fingerprint.js setup
  - Sign up for Fingerprint.js Pro account
  - Integrate client-side SDK
  - Test fingerprint stability
  - Implement `getDeviceFingerprint()`
  - Handle errors/fallbacks

- [ ] **Day 3-4**: Backend integration
  - Implement `checkDeviceFingerprintLimit()`
  - Implement `trackDeviceFingerprint()`
  - Update signup endpoint to check device limits
  - Add device tracking to usage endpoints
  - Store fingerprint metadata (VPN, incognito, etc.)

- [ ] **Day 5**: Testing
  - Test across browsers (Chrome, Safari, Firefox)
  - Test incognito mode detection
  - Test VPN detection
  - Test device limit enforcement
  - Deploy to production

**Deliverable**: Blocks 60-70% of fraud (IP + Device)

**Cost**: $99/month (Fingerprint.js Pro)

---

### Phase 3: Risk Scoring (Week 3-4) - MEDIUM PRIORITY

**Goal**: Intelligent risk assessment and automated responses

#### Tasks
- [ ] **Week 3**: Risk scoring engine
  - Implement `assessUserRisk()` with all signals
  - Implement risk score calculation
  - Create risk score update cron job (hourly)
  - Build risk assessment dashboard (admin view)
  - Test accuracy on historical data

- [ ] **Week 4**: Automated actions
  - Implement `handleUserRisk()`
  - Implement risk-based rate limiting
  - Implement conditional phone verification triggers
  - Add user-facing risk notifications
  - Create appeal/contact support flow

**Deliverable**: Blocks 80-90% of fraud with minimal false positives

**Cost**: Dev time only

---

### Phase 4: Phone Verification (Month 2) - CONDITIONAL

**Goal**: Final barrier for high-risk users

#### Tasks
- [ ] **Week 1**: Twilio setup
  - Sign up for Twilio account
  - Get phone number
  - Implement `sendVerificationCode()`
  - Implement `verifyCode()`
  - Build phone verification UI

- [ ] **Week 2**: Integration & testing
  - Add phone verification endpoints
  - Integrate with risk scoring
  - Test SMS delivery (various carriers)
  - Test international numbers
  - Handle edge cases (VOIP numbers, etc.)

**Deliverable**: Blocks 95%+ of fraud

**Cost**: ~$50/month (estimated for 5% of users requiring phone verification)

---

### Phase 5: Admin Tools (Month 3+) - NICE TO HAVE

**Goal**: Manual review and operations tools

#### Tasks
- [ ] Manual review dashboard
- [ ] Admin approval/suspension workflows
- [ ] Fraud analytics dashboard
- [ ] Automated fraud reports
- [ ] Support ticket integration

**Deliverable**: Complete fraud operations system

**Cost**: Dev time only

---

<a name="testing"></a>
## 8. Testing Strategy

### Unit Tests

```typescript
/**
 * tests/fraud/ip-tracking.test.ts
 */

import { checkIPSignupLimit, checkIPUsageLimit, normalizeIP } from '@/services/fraud/ip-rate-limiter';

describe('IP Tracking', () => {
  describe('normalizeIP', () => {
    it('should convert IPv6-mapped IPv4 to IPv4', () => {
      expect(normalizeIP('::ffff:192.0.2.1')).toBe('192.0.2.1');
    });

    it('should keep IPv6 as-is', () => {
      expect(normalizeIP('2001:0db8:85a3::8a2e:0370:7334')).toBe('2001:0db8:85a3::8a2e:0370:7334');
    });
  });

  describe('checkIPSignupLimit', () => {
    it('should allow first signup from IP', async () => {
      const result = await checkIPSignupLimit('192.0.2.1');
      expect(result.allowed).toBe(true);
      expect(result.accountCount).toBe(0);
    });

    it('should block 4th signup from same IP', async () => {
      // Create 3 accounts from same IP
      await createTestSignup('192.0.2.1', 'user1@test.com');
      await createTestSignup('192.0.2.1', 'user2@test.com');
      await createTestSignup('192.0.2.1', 'user3@test.com');

      const result = await checkIPSignupLimit('192.0.2.1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Maximum 3 free accounts');
    });

    it('should allow more signups from shared IPs', async () => {
      // Simulate shared IP by creating many unique users
      for (let i = 0; i < 20; i++) {
        await createTestSignup('192.0.2.100', `user${i}@test.com`);
      }

      const result = await checkIPSignupLimit('192.0.2.100');
      expect(result.isSharedIP).toBe(true);
      // Should allow more than 3 for shared IPs
    });
  });

  describe('checkIPUsageLimit', () => {
    it('should allow usage under limit', async () => {
      await createTestUsage('192.0.2.2', 'analysis', 5);

      const result = await checkIPUsageLimit('192.0.2.2', 'analysis');
      expect(result.allowed).toBe(true);
    });

    it('should block usage over limit', async () => {
      await createTestUsage('192.0.2.3', 'analysis', 16);

      const result = await checkIPUsageLimit('192.0.2.3', 'analysis');
      expect(result.allowed).toBe(false);
    });
  });
});
```

### Integration Tests

```typescript
/**
 * tests/fraud/signup-flow.test.ts
 */

describe('Signup Flow with Fraud Prevention', () => {
  it('should successfully create account with valid IP and device', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123!',
        deviceFingerprint: {
          visitorId: 'fp_test_123',
          confidence: 0.95,
        },
      })
      .set('X-Forwarded-For', '192.0.2.10');

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.requiresPhoneVerification).toBe(false);
  });

  it('should block 4th account from same IP', async () => {
    // Create 3 accounts
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: `user${i}@example.com`,
          password: 'SecurePass123!',
        })
        .set('X-Forwarded-For', '192.0.2.20');
    }

    // 4th should fail
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'user4@example.com',
        password: 'SecurePass123!',
      })
      .set('X-Forwarded-For', '192.0.2.20');

    expect(response.status).toBe(429);
    expect(response.body.error).toContain('limit reached');
  });

  it('should require phone verification for 3rd account from same device', async () => {
    const fingerprint = 'fp_test_duplicate';

    // Create 2 accounts with same fingerprint
    await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'device1@example.com',
        password: 'SecurePass123!',
        deviceFingerprint: { visitorId: fingerprint, confidence: 0.9 },
      });

    await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'device2@example.com',
        password: 'SecurePass123!',
        deviceFingerprint: { visitorId: fingerprint, confidence: 0.9 },
      });

    // 3rd should be blocked
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'device3@example.com',
        password: 'SecurePass123!',
        deviceFingerprint: { visitorId: fingerprint, confidence: 0.9 },
      });

    expect(response.status).toBe(429);
    expect(response.body.error).toContain('device');
  });
});
```

### Load Tests

```typescript
/**
 * tests/fraud/load-test.ts
 * Simulate realistic fraud attempts
 */

import { performance } from 'perf_hooks';

describe('Load Testing', () => {
  it('should handle 100 concurrent signups from same IP', async () => {
    const promises = [];

    for (let i = 0; i < 100; i++) {
      promises.push(
        request(app)
          .post('/api/auth/signup')
          .send({
            email: `load${i}@example.com`,
            password: 'SecurePass123!',
          })
          .set('X-Forwarded-For', '192.0.2.50')
      );
    }

    const start = performance.now();
    const results = await Promise.all(promises);
    const duration = performance.now() - start;

    // Should block after 3 accounts
    const successful = results.filter(r => r.status === 201).length;
    expect(successful).toBe(3);

    // Should respond quickly (<5s for 100 requests)
    expect(duration).toBeLessThan(5000);
  });
});
```

### Manual Testing Checklist

- [ ] Create account normally (should succeed)
- [ ] Create 3 accounts from same IP with different emails (3rd should succeed, 4th should fail)
- [ ] Create 2 accounts with same device fingerprint (3rd should fail)
- [ ] Use VPN and create account (should succeed but may require phone verification)
- [ ] Run analysis immediately after signup (should flag as suspicious but allow)
- [ ] Exhaust credits, create new account, try again (should hit IP usage limit)
- [ ] Test from school IP (should detect as shared, higher limits)
- [ ] Test phone verification flow (send code, verify, unlock credits)
- [ ] Test wrong phone code (should decrement attempts)
- [ ] Test expired phone code (should reject)

---

<a name="cost-benefit"></a>
## 9. Cost-Benefit Analysis

### Costs

#### Development (One-Time)
| Phase | Duration | Cost @ $100/hr |
|-------|----------|----------------|
| Phase 1: IP Tracking | 5 days | $4,000 |
| Phase 2: Device Fingerprinting | 5 days | $4,000 |
| Phase 3: Risk Scoring | 10 days | $8,000 |
| Phase 4: Phone Verification | 10 days | $8,000 |
| **Total Development** | **30 days** | **$24,000** |

#### Services (Monthly Recurring)
| Service | Cost | Notes |
|---------|------|-------|
| Fingerprint.js Pro | $99/month | 100K identifications/month |
| Twilio SMS | $50/month | ~1,000 verifications @ $0.05 each (5% of users) |
| **Total Recurring** | **$149/month** | **$1,788/year** |

#### Total Year 1 Cost
**$24,000 (dev) + $1,788 (services) = $25,788**

---

### Benefits

#### Without Fraud Prevention (Current State)
Assumptions:
- 10,000 signups/month
- 40% fraud rate (4,000 fraudulent users)
- Average fraudster creates 3 accounts → uses 30 credits
- Cost per analysis: $0.05 (Claude API cost)
- 30 credits × $0.05 = $1.50 per fraudster

**Monthly fraud cost**: 4,000 fraudsters × $1.50 = **$6,000/month**
**Annual fraud cost**: **$72,000/year**

---

#### With Fraud Prevention (Proposed)
Assumptions:
- 10,000 signups/month
- 5% fraud rate (fraud reduced by 90%)
- 500 fraudulent users get through
- Same usage pattern

**Monthly fraud cost**: 500 fraudsters × $1.50 = **$750/month**
**Annual fraud cost**: **$9,000/year**

---

### ROI Calculation

| Metric | Value |
|--------|-------|
| **Annual fraud savings** | $72,000 - $9,000 = **$63,000** |
| **Total Year 1 investment** | $25,788 |
| **Net benefit Year 1** | $63,000 - $25,788 = **$37,212** |
| **ROI** | ($37,212 / $25,788) × 100 = **144%** |
| **Payback period** | $25,788 / ($63,000/12) = **4.9 months** |

---

### Year 2+ (Recurring Only)

| Metric | Value |
|--------|-------|
| **Annual fraud savings** | $63,000 |
| **Annual cost** | $1,788 |
| **Net benefit** | **$61,212** |
| **ROI** | **3,425%** |

---

### Break-Even Analysis

**Monthly break-even point** (fraud prevented):
- Need to prevent: $25,788 / 12 = $2,149/month in fraud costs
- At $1.50 per fraudster: 2,149 / 1.50 = **1,433 fraudulent accounts/month**
- Current fraud rate: 4,000/month
- **We exceed break-even by 2.8x** ✅

---

### Additional Benefits (Not Quantified)

1. **Better unit economics** → More attractive to investors
2. **Higher conversion rates** → Legitimate users get better experience
3. **Reduced support burden** → Fewer fraud-related tickets
4. **Scalability** → Can safely offer free tier without fear of abuse
5. **Data insights** → Better understanding of user behavior
6. **Competitive advantage** → More generous free tier than competitors

---

<a name="monitoring"></a>
## 10. Monitoring & Alerts

### Real-Time Dashboards

#### Fraud Prevention Dashboard (Grafana/Datadog)

**Key Metrics**:
1. **Signup Metrics**
   - Total signups (today, this week, this month)
   - Blocked signups (IP limit, device limit)
   - Phone verification required (count, %)
   - Average time to signup

2. **Usage Metrics**
   - Analyses run (total, free credits, paid)
   - Cross-account usage from same IP
   - Credits consumed per IP
   - Usage patterns (immediate vs gradual)

3. **Risk Metrics**
   - Users by risk level (low, medium, high, critical)
   - Average risk score (trending)
   - High-risk signups (per day)
   - Manual review queue size

4. **Device & IP Metrics**
   - Unique IPs (daily active)
   - Unique devices (daily active)
   - Average accounts per IP
   - Average accounts per device
   - Shared IPs detected

5. **Phone Verification Metrics**
   - Verification requests (per day)
   - Verification completion rate
   - Failed verification attempts
   - Cost (Twilio spend)

---

### Automated Alerts

```typescript
/**
 * src/services/monitoring/fraud-alerts.ts
 * Automated alerting system
 */

import { sendSlackAlert, sendEmailAlert } from '@/lib/notifications';

interface AlertCondition {
  name: string;
  condition: () => Promise<boolean>;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  channels: ('slack' | 'email')[];
}

const ALERT_CONDITIONS: AlertCondition[] = [
  {
    name: 'fraud_spike',
    condition: async () => {
      const blockedLast1Hour = await db.query(`
        SELECT COUNT(*) as count
        FROM audit_log
        WHERE event_type = 'signup_blocked'
          AND created_at >= NOW() - INTERVAL '1 hour'
      `);
      return blockedLast1Hour.rows[0].count > 50;
    },
    severity: 'warning',
    message: 'Fraud spike detected: >50 blocked signups in last hour',
    channels: ['slack', 'email'],
  },

  {
    name: 'high_risk_users',
    condition: async () => {
      const highRiskCount = await db.query(`
        SELECT COUNT(*) as count
        FROM user_risk_scores
        WHERE risk_level = 'critical'
          AND updated_at >= NOW() - INTERVAL '1 hour'
      `);
      return highRiskCount.rows[0].count > 10;
    },
    severity: 'warning',
    message: 'High number of critical risk users detected',
    channels: ['slack'],
  },

  {
    name: 'identical_essay_abuse',
    condition: async () => {
      // Check for same essay across multiple accounts
      const duplicates = await db.query(`
        SELECT essay_hash, COUNT(DISTINCT user_id) as account_count
        FROM analyses
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY essay_hash
        HAVING COUNT(DISTINCT user_id) >= 3
      `);
      return duplicates.rows.length > 0;
    },
    severity: 'critical',
    message: 'Same essay detected across 3+ accounts',
    channels: ['slack', 'email'],
  },

  {
    name: 'fingerprint_service_down',
    condition: async () => {
      // Check error rate for fingerprint API
      const errors = await db.query(`
        SELECT COUNT(*) as count
        FROM error_log
        WHERE error_type = 'fingerprint_api_error'
          AND created_at >= NOW() - INTERVAL '10 minutes'
      `);
      return errors.rows[0].count > 10;
    },
    severity: 'critical',
    message: 'Fingerprint.js API experiencing high error rate',
    channels: ['slack', 'email'],
  },

  {
    name: 'twilio_service_down',
    condition: async () => {
      const errors = await db.query(`
        SELECT COUNT(*) as count
        FROM phone_verifications
        WHERE created_at >= NOW() - INTERVAL '1 hour'
          AND verified_at IS NULL
          AND attempts_remaining = 3
      `);
      // High number of unsent codes (stuck at 3 attempts = never got SMS)
      return errors.rows[0].count > 20;
    },
    severity: 'critical',
    message: 'Twilio SMS delivery may be failing',
    channels: ['slack', 'email'],
  },
];

/**
 * Run alert checks (called by cron every 5 minutes)
 */
export async function checkAlertConditions(): Promise<void> {
  for (const alert of ALERT_CONDITIONS) {
    try {
      const triggered = await alert.condition();

      if (triggered) {
        // Log alert
        await db.query(`
          INSERT INTO alerts (
            alert_name,
            severity,
            message,
            triggered_at
          ) VALUES ($1, $2, $3, NOW())
        `, [alert.name, alert.severity, alert.message]);

        // Send notifications
        if (alert.channels.includes('slack')) {
          await sendSlackAlert({
            severity: alert.severity,
            title: alert.name,
            message: alert.message,
          });
        }

        if (alert.channels.includes('email')) {
          await sendEmailAlert({
            to: 'admin@uplift.app',
            subject: `[${alert.severity.toUpperCase()}] ${alert.name}`,
            body: alert.message,
          });
        }
      }
    } catch (error) {
      console.error(`Alert check failed: ${alert.name}`, error);
    }
  }
}

// Schedule to run every 5 minutes
// cron.schedule('*/5 * * * *', checkAlertConditions);
```

---

### Daily Fraud Report

```typescript
/**
 * src/services/monitoring/daily-report.ts
 * Generate and send daily fraud report
 */

export async function generateDailyFraudReport(): Promise<string> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Signups
  const signupStats = await db.query(`
    SELECT
      COUNT(*) as total_signups,
      COUNT(*) FILTER (WHERE account_status = 'active') as active,
      COUNT(*) FILTER (WHERE requires_phone_verification) as needs_phone,
      COUNT(*) FILTER (WHERE requires_manual_review) as needs_review
    FROM users
    WHERE created_at >= $1
  `, [yesterday]);

  // Blocked signups
  const blockedStats = await db.query(`
    SELECT
      COUNT(*) as total_blocked,
      COUNT(*) FILTER (WHERE reason LIKE '%IP%') as ip_blocks,
      COUNT(*) FILTER (WHERE reason LIKE '%device%') as device_blocks
    FROM audit_log
    WHERE event_type = 'signup_blocked'
      AND created_at >= $1
  `, [yesterday]);

  // Risk scores
  const riskStats = await db.query(`
    SELECT
      risk_level,
      COUNT(*) as count,
      ROUND(AVG(overall_risk_score)::numeric, 3) as avg_score
    FROM user_risk_scores
    WHERE updated_at >= $1
    GROUP BY risk_level
  `, [yesterday]);

  // Usage stats
  const usageStats = await db.query(`
    SELECT
      COUNT(*) as total_analyses,
      SUM(credits_used) as total_credits,
      COUNT(DISTINCT ip_address) as unique_ips,
      COUNT(DISTINCT user_id) as unique_users
    FROM ip_usage_tracking
    WHERE created_at >= $1
      AND action_type = 'analysis'
  `, [yesterday]);

  const report = `
📊 **Daily Fraud Report** - ${new Date().toLocaleDateString()}

**Signups (Last 24h)**
• Total: ${signupStats.rows[0].total_signups}
• Active: ${signupStats.rows[0].active}
• Phone verification required: ${signupStats.rows[0].needs_phone}
• Manual review required: ${signupStats.rows[0].needs_review}

**Blocked Signups**
• Total blocked: ${blockedStats.rows[0].total_blocked}
• IP limit blocks: ${blockedStats.rows[0].ip_blocks}
• Device limit blocks: ${blockedStats.rows[0].device_blocks}

**Risk Distribution**
${riskStats.rows.map(r => `• ${r.risk_level}: ${r.count} users (avg: ${r.avg_score})`).join('\n')}

**Usage Stats**
• Total analyses: ${usageStats.rows[0].total_analyses}
• Credits used: ${usageStats.rows[0].total_credits}
• Unique IPs: ${usageStats.rows[0].unique_ips}
• Unique users: ${usageStats.rows[0].unique_users}

**Fraud Rate Estimate**
${calculateFraudRate(signupStats.rows[0], blockedStats.rows[0])}%

---
View full dashboard: https://uplift.app/admin/fraud
  `;

  return report;
}

function calculateFraudRate(signups: any, blocked: any): string {
  const totalAttempts = signups.total_signups + blocked.total_blocked;
  const fraudRate = (blocked.total_blocked / totalAttempts) * 100;
  return fraudRate.toFixed(1);
}

/**
 * Send daily report (run at 9am daily)
 */
export async function sendDailyFraudReport(): Promise<void> {
  const report = await generateDailyFraudReport();

  await sendEmailAlert({
    to: 'admin@uplift.app',
    subject: 'Daily Fraud Report',
    body: report,
  });

  await sendSlackAlert({
    severity: 'info',
    title: 'Daily Fraud Report',
    message: report,
  });
}

// Schedule daily at 9am
// cron.schedule('0 9 * * *', sendDailyFraudReport);
```

---

## Success Criteria

### Phase 1 (IP Tracking) - Week 1
- [ ] Blocks ≥30% of fraud attempts
- [ ] <3% false positive rate
- [ ] <100ms latency added to signup
- [ ] No production incidents

### Phase 2 (Device Fingerprinting) - Week 2
- [ ] Blocks ≥60% of fraud attempts
- [ ] <2% false positive rate
- [ ] Fingerprint.js uptime >99.5%
- [ ] Device fingerprint captured in >90% of signups

### Phase 3 (Risk Scoring) - Week 3-4
- [ ] Blocks ≥80% of fraud attempts
- [ ] Risk scores update within 1 hour of suspicious activity
- [ ] Manual review queue <20 users/day
- [ ] <5% of users require phone verification

### Phase 4 (Phone Verification) - Month 2
- [ ] Blocks ≥95% of fraud attempts
- [ ] Phone verification completion rate >70%
- [ ] SMS delivery rate >95%
- [ ] Twilio costs <$100/month

### Overall Success Metrics
- [ ] Fraud rate: 40-60% → <5%
- [ ] Free tier cost per user: $0.40-1.50 → $0.30
- [ ] False positive rate: <3%
- [ ] Support tickets related to fraud: <10/week
- [ ] Manual review time: <30 min/user
- [ ] System uptime: >99.9%

---

## Appendix

### A. Privacy & Legal Considerations

#### Privacy Policy Updates Required
Must disclose:
1. IP address collection and storage
2. Device fingerprinting technology usage
3. Cross-account usage tracking
4. Phone number collection (when required)
5. Data retention policies
6. User rights (data deletion, opt-out)

#### GDPR Compliance (if serving EU users)
- [ ] Obtain consent for device fingerprinting
- [ ] Provide data access/deletion mechanisms
- [ ] Implement data retention limits
- [ ] Allow users to export their data
- [ ] Document legal basis for fraud prevention

#### Terms of Service Updates
- [ ] Clarify account limits (1-3 free accounts per household)
- [ ] Define prohibited behavior (account farming)
- [ ] State consequences of fraud (suspension)
- [ ] Appeal process for false positives

---

### B. Support Documentation

#### For Support Team

**Common scenarios**:

1. **"I got blocked but I'm not cheating!"**
   - Check IP account count
   - Check device fingerprint count
   - Review risk signals
   - If legitimate (e.g., large family, shared computer), manually approve

2. **"Phone verification isn't working"**
   - Verify phone number format
   - Check Twilio delivery logs
   - Resend code
   - If persistent issues, manually verify

3. **"Why do I need phone verification?"**
   - Explain security measure
   - Reassure data privacy
   - Offer alternative (paid plan)

**Escalation process**:
- Level 1: Support agent checks dashboard, resolves obvious issues
- Level 2: Engineer reviews risk signals, adjusts if false positive
- Level 3: Product/security team for policy violations

---

### C. Future Enhancements (Post-Launch)

**Advanced features** (optional, 6+ months):

1. **Machine Learning Risk Model**
   - Train on historical fraud data
   - Improve risk scoring accuracy
   - Predict fraud before it happens

2. **Essay Similarity Detection**
   - Use embeddings to find copy-paste abuse
   - Detect paraphrased versions
   - Flag cross-account essay reuse

3. **Browser Fingerprinting**
   - Supplement Fingerprint.js with custom browser fingerprint
   - Track canvas fingerprint, WebGL, fonts, etc.
   - More robust device identification

4. **Network Analysis**
   - Graph-based fraud detection
   - Find connected accounts (same essays, timing patterns)
   - Identify fraud rings

5. **A/B Testing Framework**
   - Test different limits (3 vs 5 accounts per IP)
   - Optimize for fraud reduction vs conversion
   - Data-driven policy tuning

---

## Summary

This plan provides a **pragmatic, user-friendly fraud prevention system** focused on:

✅ **IP + Device tracking** (hardest to bypass)
✅ **Minimal user friction** (95% never see phone verification)
✅ **Scalable automation** (risk scoring, automated actions)
✅ **Strong ROI** (144% Year 1, 3,425% Year 2+)
✅ **Production-ready** (complete implementation details)

**Next Steps**:
1. ✅ Review and approve this plan
2. ⏳ Implement Phase 1 (IP tracking) - Week 1
3. ⏳ Deploy to production and monitor
4. ⏳ Iterate based on real fraud data

Questions or concerns? Let's discuss! 🚀
