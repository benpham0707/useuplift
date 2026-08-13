# Production development mode

## Problem

Uplift is publicly deployed before the product is ready for applicants. The
landing page currently advertises early access, exposes sign-in and sign-up,
and links directly into product routes.

## Approach

- Put production builds into a public launch mode by default. In this mode,
  only the landing page, Privacy Policy, and Terms of Service are routed; all
  auth and product URLs redirect home before Clerk is loaded.
- Keep authentication available in local development so product work can
  continue. A deliberate `VITE_ENABLE_PRODUCTION_AUTH=true` build-time flag can
  restore production auth when the product is ready.
- Remove the landing navbar and all remaining landing-page product/auth links.
- Replace the announcement copy and calls to action with a consistent
  development notice for the 2026/2027 college application cycle.

## Files

- `src/App.tsx`
- `src/main.tsx`
- `src/PublicLaunchApp.tsx`
- `src/config/launchMode.ts`
- `.env.example`
- `src/pages/Index.tsx`
- `src/pages/Privacy.tsx`
- `src/pages/Terms.tsx`
- `src/components/AnnouncementBar.tsx`
- `src/components/HeroSection.tsx`
- `src/components/landing/PIQShowcase.tsx`
- `src/components/Footer.tsx`

## Risks

- A production-only route branch can diverge from development behavior. Build
  verification must therefore cover both default production and development
  modes.
- Landing links must not retain hidden paths into the gated application.

## Verification

- Run TypeScript type checking and a production build.
- Serve the production build and verify `/`, `/auth`, and a protected route.
- Confirm the landing page has no navbar, logo, sign-in/sign-up controls, or
  active product CTA.
- Run a development-mode build to confirm the full authenticated route tree
  still compiles.
