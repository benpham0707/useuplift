# External Integrations

**Analysis Date:** 2026-02-23

## APIs & External Services

**AI Services:**
- **Anthropic Claude** - Primary AI provider for essay analysis and teaching
  - SDK/Client: `@anthropic-ai/sdk` 0.68.0
  - Auth: `ANTHROPIC_API_KEY` (sk-ant-xxx format)
  - Models used:
    - `claude-sonnet-4-5-20250929` - High-quality teaching and analysis
    - `claude-haiku-4-5-20251001` - Fast diagnosis and classification
  - Implementation: `src/lib/llm/claude.ts`, `src/lib/llm/unified.ts`
  - Features: Prompt caching, structured JSON output, retry logic

- **OpenAI** - Secondary/alternative AI provider
  - SDK/Client: `openai` 4.104.0
  - Auth: Not configured in .env.example (optional)
  - Usage: Limited, found in `src/modules/analytics/portfolio.ts`
  - Status: Present but not primary integration

**Authentication & Identity:**
- **Clerk** - User authentication and identity management
  - Frontend: `@clerk/clerk-react` 5.57.0
  - Backend: `@clerk/backend` 2.29.2
  - Auth:
    - `CLERK_SECRET_KEY` (backend JWT verification)
    - `VITE_CLERK_PUBLISHABLE_KEY` (frontend SDK)
  - Integration: Embedded in `src/main.tsx` (ClerkProvider)
  - Webhook handler: `src/http/webhooks/clerk.ts`
  - Signature verification: Uses `svix` 1.81.0 library
  - User ID format: TEXT (e.g., "user_2q...")

**Payments:**
- **Stripe** - Payment processing and billing
  - SDK/Client:
    - `stripe` 20.0.0 (backend)
    - `@stripe/stripe-js` 8.5.2 (frontend)
  - Auth:
    - `STRIPE_SECRET_KEY` (API access)
    - `STRIPE_WEBHOOK_SECRET` (webhook verification - REQUIRED in production)
  - API version: `2025-11-17.clover`
  - Implementation: `src/lib/stripe.ts`, `src/http/billing.ts`
  - Features:
    - Credit pack checkout sessions
    - Customer portal
    - Webhook event handling
  - Products: Credit packs (no subscriptions)
    - Starter Pack: $80 → 400 credits
    - Full Season Pack: $200 → 1200 credits
    - Custom packs: $13 per 50 credits (50-2000 range)

## Data Storage

**Databases:**
- **Supabase PostgreSQL** - Primary database
  - Connection:
    - Frontend: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
    - Backend: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
  - Client: `@supabase/supabase-js` 2.56.0
  - Client creation: `src/integrations/supabase/client.ts`
  - Project ID: zclaplpkuvxkrdwsgrul
  - Key tables:
    - `profiles` - User data, credits balance
    - `essays` - User essays
    - `essay_analysis_reports` - Analysis results
    - `fraud_flags` - Fraud prevention
    - `credit_transactions` - Billing audit trail
    - `chat_messages` - Workshop chat history
  - Features: Row Level Security (RLS), real-time subscriptions
  - Migrations: `supabase/migrations/` (SQL files)

**File Storage:**
- Local filesystem only (no cloud storage integration detected)

**Caching:**
- Anthropic prompt caching (SDK feature, not separate service)
- No Redis or Memcached integration

## Authentication & Identity

**Auth Provider:**
- Clerk (detailed above)
  - Implementation: JWT-based authentication
  - Frontend: ClerkProvider wrapper in `src/main.tsx`
  - Backend: JWT verification middleware in `src/http/middleware/auth.ts`
  - Security: Uses `verifyToken` from `@clerk/backend`
  - Development bypass: Available via `ALLOW_DEV_AUTH=true` flag

**User ID Format:**
- Clerk user IDs are TEXT strings (not UUIDs)
- Format: "user_" prefix (e.g., "user_2q...")
- Used as foreign key in all database tables

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, Rollbar, etc. detected)

**Logs:**
- Console-based logging only
- Security event logging: `src/http/security/index.ts` (logSecurityEvent function)
- Structured logging: Not implemented

**Analytics:**
- No third-party analytics (Google Analytics, Mixpanel, etc.) detected
- Custom portfolio analytics: `src/modules/analytics/portfolio.ts`

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured in codebase
- Vite build output: `dist/` (frontend)
- Express server: Node.js runtime (backend)

**CI Pipeline:**
- None detected (no .github/workflows/, .gitlab-ci.yml, etc.)

**Deployment Scripts:**
- `scripts/deploy-phase-20.sh` - Custom deployment script
- `scripts/deploy-workshop-function.sh` - Supabase function deployment
- `scripts/setup-local-dev.sh` - Local environment setup

## Environment Configuration

**Required env vars (Production):**
```bash
# Authentication
CLERK_SECRET_KEY=sk_test_xxxx
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxx

# Database
SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxx
VITE_SUPABASE_ANON_KEY=eyJxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx

# AI
ANTHROPIC_API_KEY=sk-ant-xxxx

# Payments
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx  # CRITICAL for production

# Server
PORT=8789
NODE_ENV=production
CORS_ALLOWED_ORIGINS=https://yourapp.com
```

**Optional env vars:**
```bash
# Stripe price IDs (for specific products)
STRIPE_SUBSCRIPTION_PRICE_ID=price_xxxx
STRIPE_ADDON_50_PRICE_ID=price_xxxx
STRIPE_ADDON_100_PRICE_ID=price_xxxx

# Development bypass
ALLOW_DEV_AUTH=true  # NEVER set in production
```

**Secrets location:**
- `.env` file (gitignored)
- `.env.example` provides template
- `.env.local` and `.env.local.example` also present

## Webhooks & Callbacks

**Incoming:**
- `/api/webhooks/clerk` - Clerk user lifecycle events
  - Signature verification: Svix library
  - Events: `user.created`, `user.deleted`
  - Handler: `src/http/webhooks/clerk.ts`

- `/api/billing/webhook` - Stripe payment events
  - Signature verification: Stripe SDK
  - Events: `checkout.session.completed`, payment events
  - Handler: `src/http/billing.ts` (handleWebhook)
  - Security: STRIPE_WEBHOOK_SECRET required in production

**Outgoing:**
- None detected (no webhooks sent to external services)

## Supabase Edge Functions

**Deployed Functions:**
Located in `supabase/functions/`, deployed to Supabase Edge Runtime (Deno):

- `analyze-portfolio` - Portfolio strength computation
- `workshop-analysis` - Essay workshop analysis
- `narrative-overview` - Narrative essay analysis
- `strategic-constraints` - Strategic guidance
- `teaching-layer` - Teaching feedback generation
- `piq-chat` - PIQ workshop chat interface
- `suggestion-rationales` - Suggestion explanations
- `validate-suggestions` - Suggestion validation
- `validate-workshop` - Workshop validation
- `check-fraud-risk` - Fraud detection
- `notify-new-signin` - New user notifications
- `submit-bug-report` - Bug reporting
- `track-user-session` - Session tracking

**Configuration:**
- `supabase/config.toml` - JWT verification disabled for all functions
- Runtime: Deno (TypeScript)
- Deployment: Via `scripts/deploy-workshop-function.sh`

## API Architecture

**Frontend → Backend Flow:**
1. Vite dev server (port 5173) proxies `/api` → Express (port 8789)
2. Express routes: `src/http/routes.ts`
3. Middleware: `src/http/middleware/auth.ts` (Clerk JWT verification)
4. Services: `src/services/` (business logic)
5. Database: Supabase client with RLS

**CORS Configuration:**
- Development: Permissive (allows localhost origins)
- Production: Strict whitelist via `CORS_ALLOWED_ORIGINS`
- Implementation: `src/http/server.ts` with origin validation

**Security:**
- JWT verification on all protected routes
- Webhook signature verification
- CORS origin whitelisting
- RLS policies in database
- No hardcoded secrets (all from environment)

---

*Integration audit: 2026-02-23*
