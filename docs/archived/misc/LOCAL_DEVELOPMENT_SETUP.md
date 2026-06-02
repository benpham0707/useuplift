# Local Development Setup for Uplift

## Problem
You cannot test authentication locally because the production Clerk instance is configured to only work with production URLs (useuplift.io), not localhost.

## Solution
Set up a separate Clerk development application that allows localhost URLs.

## Setup Instructions

### 1. Create a Development Clerk Application

1. **Go to Clerk Dashboard**: https://dashboard.clerk.com/
2. **Create a new application** (or use existing dev app if you have one):
   - Click "Create application"
   - Name it something like "Uplift Development"
   - Choose your authentication methods (Email, Google, etc.)

### 2. Configure Allowed URLs

In your **development** Clerk application settings:

1. Go to **Paths** in the Clerk dashboard
2. Set these URLs:

   **Home URL**: `http://localhost:5173`

   **Sign-in URL**: `http://localhost:5173/auth?mode=sign-in`

   **Sign-up URL**: `http://localhost:5173/auth?mode=sign-up`

   **After sign-in URL**: `http://localhost:5173/portfolio-scanner`

   **After sign-up URL**: `http://localhost:5173/portfolio-scanner`

3. Go to **Domains** section:
   - Add `localhost:5173` as an allowed domain
   - Keep "Development mode" enabled

### 3. Get Development API Keys

1. In your **development** Clerk app, go to **API Keys**
2. Copy the following keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### 4. Set Up Environment Variables

Create or update `.env.local` file with your **development** keys:

```bash
# Frontend (Vite) - Development Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_DEV_KEY_HERE

# Backend - Development Clerk
CLERK_SECRET_KEY=sk_test_YOUR_DEV_SECRET_KEY_HERE
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_DEV_KEY_HERE

# Supabase (same for dev and prod)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic (for AI features)
ANTHROPIC_API_KEY=your_anthropic_key

# Stripe (use test keys for development)
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Server
PORT=8789

# Development flag
NODE_ENV=development
```

### 5. Configure Supabase JWT Template in Development Clerk

**IMPORTANT**: You need to set up the Supabase JWT template in your **development** Clerk app too:

1. In your **development** Clerk dashboard, go to **JWT Templates**
2. Create a new template named `supabase`
3. Use these claims:
```json
{
  "aud": "authenticated",
  "exp": "{{timestamp}}",
  "iat": "{{timestamp}}",
  "iss": "https://{{domain}}",
  "sub": "{{user.id}}"
}
```
4. Save the template

### 6. Update Supabase RLS Policies (If Needed)

Your Supabase RLS policies should work with both production and development Clerk user IDs since they just check that the JWT `sub` claim matches the `user_id` in the database.

No changes needed unless you want separate development data.

### 7. Run the Application

Start both frontend and backend:

```bash
# In one terminal - Start the backend server
npm run server

# In another terminal - Start the frontend dev server
npm run dev

# Or run both together
npm run dev:full
```

### 8. Test Authentication

1. Open http://localhost:5173
2. Click "Sign In" or "Sign Up"
3. Create a new account (this will be in your development Clerk app)
4. You should be redirected to `/portfolio-scanner` after authentication
5. Test saving features to ensure the JWT token works with Supabase

## Managing Multiple Environments

### Development (.env.local)
- Use `pk_test_` and `sk_test_` Clerk keys
- Localhost URLs
- Development mode enabled in Clerk
- Test Stripe keys

### Production (.env.production)
- Use `pk_live_` and `sk_live_` Clerk keys
- Production domain URLs
- Production mode in Clerk
- Live Stripe keys

### Switching Between Environments

```bash
# For local development
npm run dev

# For production build
npm run build
```

## Troubleshooting

### "Missing Publishable Key" Error
- Make sure `VITE_CLERK_PUBLISHABLE_KEY` is set in `.env.local`
- Restart the dev server after changing env variables

### "Unauthorized" Errors in API Calls
- Verify `CLERK_SECRET_KEY` is set for the backend
- Make sure you're using matching keys (both from dev or both from prod)

### Cannot Sign In Locally
- Check that localhost:5173 is in allowed domains in Clerk
- Verify redirect URLs are set to localhost URLs
- Clear browser cookies/cache and try again

### Supabase Save Not Working
- Ensure JWT template is configured in development Clerk app
- Verify the template is named exactly `supabase`
- Check that user ID format matches between Clerk and Supabase

### CORS Errors
- Backend server must be running on port 8789
- Frontend proxy is configured in vite.config.ts to forward `/api` requests

## Best Practices

1. **Never commit real keys**: Always use `.env.local` (gitignored)
2. **Separate dev/prod data**: Use different Clerk apps for dev and prod
3. **Test payments carefully**: Always use Stripe test mode locally
4. **Keep keys organized**: Label which keys are for which environment

## Quick Checklist

- [ ] Created development Clerk application
- [ ] Configured localhost URLs in Clerk
- [ ] Added localhost to allowed domains
- [ ] Copied development API keys
- [ ] Updated `.env.local` with dev keys
- [ ] Created Supabase JWT template in dev Clerk
- [ ] Restarted dev server
- [ ] Tested sign up/sign in flow
- [ ] Verified data saves to Supabase

## Additional Resources

- [Clerk Development Mode Docs](https://clerk.com/docs/deployments/set-up-development)
- [Clerk + Supabase Integration](https://clerk.com/docs/integrations/databases/supabase)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)