# Technology Stack

**Analysis Date:** 2026-02-23

## Languages

**Primary:**
- TypeScript 5.8.3 - All application code (strict mode disabled)
- JavaScript (ES2020) - Configuration files

**Secondary:**
- SQL - Database migrations in `supabase/migrations/`
- Bash - Deployment and setup scripts in `scripts/`

## Runtime

**Environment:**
- Node.js 24.8.0 (server-side)
- Browser ES2020+ (client-side)

**Package Manager:**
- npm (package-lock.json present)
- Lockfile: Present and committed

**Module System:**
- ESNext modules (`"type": "module"` in package.json)
- tsx for Node.js TypeScript execution

## Frameworks

**Core:**
- React 18.3.1 - UI framework
- Vite 5.4.19 - Build tool and dev server
- Express 5.1.0 - Backend API server (port 8789)

**Frontend:**
- React Router DOM 6.30.1 - Client-side routing
- TanStack React Query 5.83.0 - Server state management
- shadcn/ui + Radix UI - Component library (20+ primitives)
- Tailwind CSS 3.4.17 - Utility-first styling
- GSAP 3.13.0 - Advanced animations
- Motion 12.23.22 - React animations
- Recharts 2.15.4 - Data visualization

**Testing:**
- tsx 4.19.2 - Test runner for TypeScript
- No formal test framework installed (uses manual tsx execution)

**Build/Dev:**
- Vite 5.4.19 - Dev server (port 5173) with HMR
- @vitejs/plugin-react-swc 3.11.0 - Fast refresh
- PostCSS 8.5.6 - CSS processing
- Autoprefixer 10.4.21 - CSS vendor prefixes

**Linting:**
- ESLint 9.32.0 - Code linting
- typescript-eslint 8.38.0 - TypeScript rules
- eslint-plugin-react-hooks 5.2.0 - React hooks rules
- Prettier not configured (no .prettierrc)

## Key Dependencies

**Critical:**
- `@anthropic-ai/sdk` 0.68.0 - Claude AI API client (primary AI provider)
- `@clerk/clerk-react` 5.57.0 - Authentication SDK (frontend)
- `@clerk/backend` 2.29.2 - Authentication SDK (backend)
- `@supabase/supabase-js` 2.56.0 - PostgreSQL database client
- `stripe` 20.0.0 - Payment processing (backend)
- `@stripe/stripe-js` 8.5.2 - Payment processing (frontend)

**Infrastructure:**
- `zod` 3.25.76 - Runtime type validation
- `react-hook-form` 7.61.1 - Form state management
- `@hookform/resolvers` 3.10.0 - Zod + react-hook-form integration
- `cors` 2.8.5 - CORS middleware for Express
- `dotenv` 16.6.1 - Environment variable loading
- `jsonrepair` 3.13.2 - JSON parsing resilience
- `jwt-decode` 4.0.0 - JWT token parsing
- `uuid` 13.0.0 - UUID generation
- `date-fns` 3.6.0 - Date manipulation

**Webhooks:**
- `svix` 1.81.0 - Clerk webhook signature verification

**UI Components:**
- `lucide-react` 0.462.0 - Icon library
- `cmdk` 1.1.1 - Command palette
- `sonner` 1.7.4 - Toast notifications
- `vaul` 0.9.9 - Drawer component
- `embla-carousel-react` 8.6.0 - Carousel component
- `input-otp` 1.4.2 - OTP input component
- `next-themes` 0.3.0 - Theme management

**Styling:**
- `class-variance-authority` 0.7.1 - Component variants
- `tailwind-merge` 2.6.0 - Tailwind class merging
- `tailwindcss-animate` 1.0.7 - Animation utilities
- `@tailwindcss/typography` 0.5.16 - Prose styling

**Development:**
- `lovable-tagger` 1.9.9 - Component tagging in dev mode
- `npm-run-all` 4.1.5 - Parallel script execution

**Legacy/Alternative:**
- `openai` 4.104.0 - OpenAI SDK (present but Anthropic is primary)

## Configuration

**Environment:**
- `.env` file required (gitignored)
- `.env.example` template provided
- Critical variables:
  - `ANTHROPIC_API_KEY` - Claude API access (required)
  - `CLERK_SECRET_KEY` / `VITE_CLERK_PUBLISHABLE_KEY` - Authentication
  - `SUPABASE_URL` / `VITE_SUPABASE_URL` - Database connection
  - `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` - Database client key
  - `SUPABASE_SERVICE_ROLE_KEY` - Backend privileged access
  - `STRIPE_SECRET_KEY` - Payment processing
  - `STRIPE_WEBHOOK_SECRET` - Webhook verification (required in production)
  - `PORT` - Server port (default 8789)
  - `NODE_ENV` - Environment mode
  - `CORS_ALLOWED_ORIGINS` - Production CORS whitelist

**Build:**
- `vite.config.ts` - Vite configuration with SWC, proxy to backend
- `tsconfig.json` - Base TypeScript config (references app + node configs)
- `tsconfig.app.json` - Application TypeScript config (strict: false)
- `tailwind.config.ts` - Tailwind theme and plugins
- `eslint.config.js` - ESLint flat config
- `postcss.config.js` - PostCSS plugins

**TypeScript:**
- Strict mode: Disabled (noImplicitAny: false, strictNullChecks: false)
- Path alias: `@/*` maps to `./src/*`
- Target: ES2020
- Module resolution: bundler

## Platform Requirements

**Development:**
- Node.js 24.x or compatible
- npm (version unspecified, uses package-lock.json v2+)
- Supabase CLI (for database migrations)
- Environment variables configured in `.env`

**Production:**
- Node.js server for Express backend (port 8789)
- Static hosting for Vite-built frontend
- Supabase PostgreSQL database
- Clerk authentication service
- Stripe payment processing
- Anthropic Claude API access

**Scripts:**
- `npm run dev` - Start Vite dev server (frontend only, port 5173)
- `npm run server` - Start Express API server (backend only, port 8789)
- `npm run dev:full` - Start both frontend and backend in parallel
- `npm run build` - Production build
- `npm run lint` - Run ESLint

---

*Stack analysis: 2026-02-23*
