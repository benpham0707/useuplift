# API Testing Guide for Referral System

## Base URL
```
http://localhost:8789/api/v1
```

## Authentication
All endpoints require a Clerk JWT token in the Authorization header:
```
Authorization: Bearer <clerk_jwt_token>
```

## Endpoints

### 1. Get Referral Info
**GET** `/referrals/me`

Returns the current user's referral code, share link, and statistics.

**Example Request**:
```bash
curl -X GET http://localhost:8789/api/v1/referrals/me \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

**Example Response**:
```json
{
  "code": "ABC123",
  "shareLink": "http://localhost:5173/auth?mode=sign-up&ref=ABC123",
  "stats": {
    "totalReferrals": 3,
    "signupBonuses": 3,
    "purchaseBonuses": 1,
    "totalCreditsEarned": 100
  },
  "createdAt": "2025-12-21T10:00:00.000Z"
}
```

### 2. Claim Referral Code
**POST** `/referrals/claim`

Claims a referral code for the current user. Grants bonuses to both parties.

**Request Body**:
```json
{
  "code": "ABC123"
}
```

**Example Request**:
```bash
curl -X POST http://localhost:8789/api/v1/referrals/claim \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "ABC123"}'
```

**Success Response**:
```json
{
  "success": true,
  "message": "Referral claimed successfully! You received +10 credits and 10% off all credit packs.",
  "creditsReceived": 10,
  "discountActive": true
}
```

**Error Responses**:
```json
// Already claimed
{
  "error": "You have already claimed a referral code",
  "alreadyClaimed": true
}

// Invalid code
{
  "error": "Invalid referral code"
}

// Self-referral
{
  "error": "You cannot use your own referral code"
}
```

### 3. Create Checkout Session (Updated)
**POST** `/billing/checkout`

Creates a Stripe checkout session for credit packs. Applies 10% referral discount if active.

**Request Body**:
```json
{
  "type": "starter_pack",
  "successUrl": "http://localhost:5173/pricing?success=true",
  "cancelUrl": "http://localhost:5173/pricing?canceled=true"
}
```

**Pack Types**:
- `starter_pack` - 400 credits for $80 ($72 with referral)
- `full_season_pack` - 1200 credits for $200 ($180 with referral)
- `custom_50` to `custom_2000` - Custom amounts (e.g., `custom_100` = 100 credits for $26 or $23.40 with referral)

**Example Request**:
```bash
curl -X POST http://localhost:8789/api/v1/billing/checkout \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "starter_pack",
    "successUrl": "http://localhost:5173/pricing?success=true",
    "cancelUrl": "http://localhost:5173/pricing?canceled=true"
  }'
```

**Response**:
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

## Testing Workflow

### Test 1: Basic Referral Flow
1. **User A** calls `GET /referrals/me` → Gets code "ABC123"
2. **User B** calls `POST /referrals/claim` with `{"code": "ABC123"}`
3. Verify:
   - User B receives +10 credits
   - User A receives +25 credits
   - User B's `referral_discount_active` = true
   - Transactions logged for both users

### Test 2: Purchase Bonus
1. Complete Test 1
2. **User B** calls `POST /billing/checkout` with `{"type": "starter_pack"}`
3. Complete Stripe checkout
4. Verify:
   - User B charged $72 (10% discount applied)
   - User B receives 400 credits
   - User A receives +25 credits (purchase bonus)
   - User A's bonus appears in transaction history

### Test 3: Idempotency
1. **User B** calls `POST /referrals/claim` twice with same code
2. Verify: Second call returns error "already claimed"
3. Check credit transactions - only one signup bonus for User A
4. Simulate Stripe webhook retry (same payment_intent)
5. Verify: No duplicate credits granted

### Test 4: Invalid Cases
1. **User A** tries to claim own code → Error
2. Try invalid code "INVALID" → Error
3. Try already-used code → Error

## Database Queries for Verification

### Check Referral Codes
```sql
SELECT * FROM referral_codes WHERE user_id = 'user_xxx';
```

### Check Referral Relationships
```sql
SELECT * FROM referrals WHERE referrer_user_id = 'user_xxx' OR referee_user_id = 'user_xxx';
```

### Check Credit Transactions
```sql
SELECT * FROM credit_transactions 
WHERE user_id = 'user_xxx' 
AND type = 'bonus'
ORDER BY created_at DESC;
```

### Check Credits Balance
```sql
SELECT user_id, credits, referral_discount_active, referred_by 
FROM profiles 
WHERE user_id = 'user_xxx';
```

## Stripe Webhook Events

The system listens for:
- `checkout.session.completed` - Grants credits and purchase bonus

Webhook endpoint:
```
POST /api/v1/billing/webhook
```

Note: Requires valid Stripe signature in header.

## Environment Variables Required

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```
