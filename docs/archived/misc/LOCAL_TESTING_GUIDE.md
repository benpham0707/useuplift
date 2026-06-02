# Local Development Testing Guide

## Problem
Clerk authentication is configured for production, making it difficult to test locally without going through the full OAuth flow.

## Solution
Development-only endpoints that bypass Clerk authentication using query parameters or headers.

⚠️ **These endpoints are ONLY available when `NODE_ENV !== 'production'`**

---

## Quick Start

### 1. Start the Backend Server
```bash
npm run server
# Server runs on http://localhost:8789
```

### 2. Create Test Users

**Create a new test user:**
```bash
curl -X POST http://localhost:8789/api/v1/dev/test-user \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_alice"}'
```

**Response:**
```json
{
  "message": "Test user created (development only)",
  "userId": "user_alice",
  "devToken": "...",
  "usage": {
    "queryParam": "?dev_user_id=user_alice",
    "header": "X-Dev-User-ID: user_alice",
    "apiCalls": {
      "referrals": "curl \"http://localhost:8789/api/v1/dev/referrals/me?dev_user_id=user_alice\"",
      "claim": "curl -X POST \"http://localhost:8789/api/v1/dev/referrals/claim?dev_user_id=user_alice\" ..."
    }
  }
}
```

**List existing test users:**
```bash
curl http://localhost:8789/api/v1/dev/test-users
```

---

## Testing the Referral Flow

### Scenario: Alice refers Bob

#### Step 1: Alice gets her referral code
```bash
curl "http://localhost:8789/api/v1/dev/referrals/me?dev_user_id=user_alice"
```

**Response:**
```json
{
  "code": "ABC123",
  "shareLink": "http://localhost:5173/auth?mode=sign-up&ref=ABC123",
  "stats": {
    "totalReferrals": 0,
    "signupBonuses": 0,
    "purchaseBonuses": 0,
    "totalCreditsEarned": 0
  },
  "createdAt": "2025-12-21T10:00:00.000Z"
}
```

#### Step 2: Bob claims Alice's referral code
```bash
curl -X POST "http://localhost:8789/api/v1/dev/referrals/claim?dev_user_id=user_bob" \
  -H "Content-Type: application/json" \
  -d '{"code": "ABC123"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Referral claimed successfully! You received +10 credits and 10% off all credit packs.",
  "creditsReceived": 10,
  "discountActive": true
}
```

**What happened:**
- ✅ Bob received +10 credits
- ✅ Alice received +25 credits  
- ✅ Bob's `referral_discount_active` set to `true`
- ✅ Bob's `referred_by` set to `user_alice`

#### Step 3: Verify Alice got her signup bonus
```bash
curl "http://localhost:8789/api/v1/dev/referrals/me?dev_user_id=user_alice"
```

**Expected Response:**
```json
{
  "code": "ABC123",
  "shareLink": "...",
  "stats": {
    "totalReferrals": 1,
    "signupBonuses": 1,
    "purchaseBonuses": 0,
    "totalCreditsEarned": 25
  }
}
```

#### Step 4: Bob makes a purchase (triggers purchase bonus)
```bash
curl -X POST "http://localhost:8789/api/v1/dev/billing/checkout?dev_user_id=user_bob" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "starter_pack",
    "successUrl": "http://localhost:5173/pricing?success=true",
    "cancelUrl": "http://localhost:5173/pricing?canceled=true"
  }'
```

**Expected Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

**Check pricing:**
- Without discount: $80
- With 10% referral discount: $72 (Bob's price)

After Bob completes the Stripe checkout, Alice will automatically receive +25 credits (purchase bonus).

---

## Alternative: Using Headers

Instead of query parameters, you can use the `X-Dev-User-ID` header:

```bash
curl http://localhost:8789/api/v1/dev/referrals/me \
  -H "X-Dev-User-ID: user_alice"
```

---

## Testing Edge Cases

### 1. Try to claim own code (should fail)
```bash
# Alice tries to use her own code
curl -X POST "http://localhost:8789/api/v1/dev/referrals/claim?dev_user_id=user_alice" \
  -H "Content-Type: application/json" \
  -d '{"code": "ABC123"}'
```

**Expected Error:**
```json
{
  "error": "You cannot use your own referral code"
}
```

### 2. Try to claim twice (should fail)
```bash
# Bob tries to claim again
curl -X POST "http://localhost:8789/api/v1/dev/referrals/claim?dev_user_id=user_bob" \
  -H "Content-Type: application/json" \
  -d '{"code": "XYZ789"}'
```

**Expected Error:**
```json
{
  "error": "You have already claimed a referral code",
  "alreadyClaimed": true
}
```

### 3. Invalid code (should fail)
```bash
curl -X POST "http://localhost:8789/api/v1/dev/referrals/claim?dev_user_id=user_charlie" \
  -H "Content-Type: application/json" \
  -d '{"code": "INVALID"}'
```

**Expected Error:**
```json
{
  "error": "Invalid referral code"
}
```

---

## Verifying in Database

You can check the database directly:

```sql
-- Check referral codes
SELECT * FROM referral_codes WHERE user_id IN ('user_alice', 'user_bob');

-- Check referral relationships
SELECT * FROM referrals WHERE referrer_user_id = 'user_alice' OR referee_user_id = 'user_bob';

-- Check credits
SELECT user_id, credits, referral_discount_active, referred_by 
FROM profiles 
WHERE user_id IN ('user_alice', 'user_bob');

-- Check transaction history
SELECT user_id, amount, type, description, created_at
FROM credit_transactions
WHERE user_id IN ('user_alice', 'user_bob')
ORDER BY created_at DESC;
```

---

## Complete Test Script

Here's a complete bash script to test the full flow:

```bash
#!/bin/bash

BASE_URL="http://localhost:8789/api/v1/dev"

echo "=== Creating test users ==="
curl -X POST $BASE_URL/test-user -H "Content-Type: application/json" -d '{"userId": "user_alice"}'
echo "\n"
curl -X POST $BASE_URL/test-user -H "Content-Type: application/json" -d '{"userId": "user_bob"}'
echo "\n\n"

echo "=== Alice gets her referral code ==="
ALICE_CODE=$(curl -s "$BASE_URL/referrals/me?dev_user_id=user_alice" | jq -r '.code')
echo "Alice's code: $ALICE_CODE"
echo "\n"

echo "=== Bob claims Alice's code ==="
curl -X POST "$BASE_URL/referrals/claim?dev_user_id=user_bob" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"$ALICE_CODE\"}"
echo "\n\n"

echo "=== Checking Alice's stats (should show 1 referral) ==="
curl -s "$BASE_URL/referrals/me?dev_user_id=user_alice" | jq '.stats'
echo "\n"

echo "=== Checking Bob's discount (should be active) ==="
curl -s "$BASE_URL/referrals/me?dev_user_id=user_bob" | jq
echo "\n"

echo "=== Test complete! ==="
```

Save as `test_referrals.sh`, make executable (`chmod +x test_referrals.sh`), and run!

---

## Important Notes

1. **Development Only**: These `/dev/*` endpoints are automatically disabled in production
2. **No Real Authentication**: This bypasses Clerk entirely for local testing
3. **Real Database**: Changes are made to your actual database (use test data!)
4. **Stripe Checkout**: The checkout endpoint still creates real Stripe sessions (use test mode)

---

## Troubleshooting

**Q: Endpoints return 403 "Development endpoints are disabled"**  
A: Make sure `NODE_ENV` is not set to `production`. By default it should be undefined or `development`.

**Q: Missing dev_user_id error**  
A: Add `?dev_user_id=USER_ID` to your URL or use `-H "X-Dev-User-ID: USER_ID"` header.

**Q: Cannot find user in database**  
A: You need to create a profile first. The test-user endpoint only gives you a user ID, you may need to manually insert into the profiles table or use existing users from `dev/test-users`.

---

## When Ready for Production

Before deploying:
1. Ensure `NODE_ENV=production` is set in your deployment
2. The `/dev/*` routes will be automatically disabled
3. All production requests will require real Clerk authentication
4. Test the production flow with real Clerk signup/login
