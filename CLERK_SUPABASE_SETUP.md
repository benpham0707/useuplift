# Clerk + Supabase JWT Authentication Setup

## Problem Fixed

The save system wasn't working because Supabase Row Level Security (RLS) policies require a JWT token to authenticate requests. The previous implementation didn't pass Clerk's JWT token to Supabase.

## Solution Implemented

1. **Created Authenticated Supabase Client** ([src/services/auth/getAuthenticatedSupabaseClient.ts](src/services/auth/getAuthenticatedSupabaseClient.ts))
   - Factory function that creates Supabase client with Clerk JWT in Authorization header
   - Token verification helper

2. **Updated Database Service** ([src/services/piqWorkshop/piqDatabaseService.ts](src/services/piqWorkshop/piqDatabaseService.ts))
   - All functions now accept `clerkToken` as first parameter
   - Each function creates an authenticated Supabase client
   - Token is verified before making requests

3. **Updated PIQWorkshop Component** ([src/pages/PIQWorkshop.tsx](src/pages/PIQWorkshop.tsx))
   - Uses `useAuth()` hook from Clerk to get `getToken` function
   - Passes JWT token to all database service calls
   - Handles token errors gracefully

## Required: Clerk JWT Template Configuration

For this to work, you **MUST** configure a Supabase JWT template in Clerk:

### Step 1: Create JWT Template in Clerk

1. Go to Clerk Dashboard: https://dashboard.clerk.com/
2. Select your application
3. Navigate to **JWT Templates** (in sidebar under "Configure")
4. Click **New template**
5. Choose **Supabase** from the template list

### Step 2: Configure the Template

Use these settings:

**Name:** `supabase`

**Claims:**
```json
{
  "aud": "authenticated",
  "exp": "{{timestamp}}",
  "iat": "{{timestamp}}",
  "iss": "https://{{domain}}",
  "sub": "{{user.id}}"
}
```

**Key points:**
- The `sub` claim MUST contain `{{user.id}}` (the Clerk user ID like "user_2q...")
- The `aud` claim should be `"authenticated"` to match Supabase's expected audience
- Save the template with the name exactly as `supabase`

### Step 3: Get Supabase JWT Secret

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **JWT Secret** (not the anon key!)

### Step 4: Add JWT Secret to Clerk

1. Back in Clerk's JWT Template settings
2. Find **Signing algorithm** section
3. Choose **RS256** or **HS256** (Supabase uses HS256 by default)
4. If using HS256, paste your Supabase JWT Secret
5. Save the template

## How Authentication Flow Works

```
User clicks "Save"
    ↓
PIQWorkshop.tsx gets Clerk token via:
    const token = await getToken({ template: 'supabase' })
    ↓
Token passed to saveOrUpdatePIQEssay(token, userId, ...)
    ↓
getAuthenticatedSupabaseClient(token) creates client with:
    Authorization: Bearer <clerk-jwt-token>
    ↓
Supabase receives request with JWT
    ↓
RLS policy extracts user ID from JWT:
    (select auth.jwt() ->> 'sub') = user_id
    ↓
If user IDs match → Request succeeds ✅
If no JWT or wrong user → Request denied ❌
```

## Testing the Fix

### 1. Check Clerk Token in Console

Open browser DevTools and run:
```javascript
// In PIQWorkshop page, check token
const token = await window.Clerk.session.getToken({ template: 'supabase' })
console.log('Token:', token)

// Decode to see claims
const payload = JSON.parse(atob(token.split('.')[1]))
console.log('Payload:', payload)
// Should show: { sub: "user_...", aud: "authenticated", ... }
```

### 2. Test Save Functionality

1. Sign in to the app with Clerk
2. Navigate to PIQ Workshop
3. Edit some text
4. Click **Save** button
5. Check console logs:
   - Should see: `📤 Saving essay to database...`
   - Should see: `✅ JWT verified - user ID: user_...`
   - Should see: `✅ Essay created: <uuid>`
   - Should NOT see authentication errors

### 3. Verify in Supabase

Run this query in Supabase SQL Editor:
```sql
SELECT id, user_id, essay_type, draft_current, created_at
FROM essays
WHERE user_id = 'user_YOUR_CLERK_USER_ID'
ORDER BY created_at DESC
LIMIT 5;
```

Replace `user_YOUR_CLERK_USER_ID` with your actual Clerk user ID (found in Clerk dashboard or console logs).

## Troubleshooting

### Error: "Invalid authentication token"

**Cause:** Clerk JWT template not configured or token doesn't have `sub` claim

**Fix:**
1. Verify JWT template exists in Clerk with name `supabase`
2. Check template claims include `"sub": "{{user.id}}"`
3. In console, decode token and verify `sub` exists

### Error: "new row violates row-level security policy"

**Cause:** RLS policy can't extract user ID from JWT, or user IDs don't match

**Fix:**
1. Check RLS policy syntax:
   ```sql
   CREATE POLICY "Clerk: Users can insert own essays" ON essays
       FOR INSERT TO authenticated
       WITH CHECK (user_id = (select auth.jwt() ->> 'sub'));
   ```
2. Verify JWT is being sent in Authorization header (check Network tab)
3. Test JWT verification:
   ```sql
   SELECT auth.jwt() ->> 'sub' as clerk_user_id;
   ```

### Error: "No Clerk token available"

**Cause:** User not signed in or Clerk not initialized

**Fix:**
1. Ensure user is signed in
2. Check Clerk is properly configured in [src/main.tsx](src/main.tsx)
3. Verify `VITE_CLERK_PUBLISHABLE_KEY` is set in `.env`

### Logs show "⚠️ No Supabase token available from Clerk"

**Cause:** JWT template doesn't exist or has wrong name

**Fix:**
1. Template must be named exactly `supabase`
2. Restart dev server after creating template
3. Clear browser cache/cookies and sign in again

## Files Changed

1. ✅ [src/services/auth/getAuthenticatedSupabaseClient.ts](src/services/auth/getAuthenticatedSupabaseClient.ts) - NEW
2. ✅ [src/services/piqWorkshop/piqDatabaseService.ts](src/services/piqWorkshop/piqDatabaseService.ts) - Updated all functions
3. ✅ [src/pages/PIQWorkshop.tsx](src/pages/PIQWorkshop.tsx) - Updated to pass tokens
4. ✅ Build succeeds with 0 TypeScript errors

## Next Steps

1. **Configure Clerk JWT Template** (Required - see above)
2. Deploy to production
3. Test save functionality
4. If errors, check console logs and follow troubleshooting guide

## Production Deployment Checklist

- [ ] Clerk JWT template configured with name `supabase`
- [ ] JWT template includes `"sub": "{{user.id}}"` claim
- [ ] Supabase JWT secret added to Clerk template
- [ ] RLS policies use `auth.jwt() ->> 'sub'` for user verification
- [ ] Migration deployed successfully (all 4 tables exist)
- [ ] Environment variables set correctly
- [ ] Build succeeds: `npm run build`
- [ ] Test in production: Sign in → Edit PIQ → Click Save → Verify in Supabase
