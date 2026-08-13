/**
 * Production stays in public launch mode until the product is ready.
 *
 * Authentication remains available in local development. Re-enabling it in
 * production requires an explicit build-time opt-in so a missing environment
 * variable fails closed instead of accidentally reopening the application.
 */
export const isPublicLaunchMode =
  import.meta.env.PROD && import.meta.env.VITE_ENABLE_PRODUCTION_AUTH !== 'true';
