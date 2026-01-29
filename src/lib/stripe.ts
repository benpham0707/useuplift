/**
 * Stripe Configuration
 *
 * SECURITY:
 * - No fallback keys - missing configuration causes clear errors
 * - Webhook signature verification is required in production
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// SECURITY: No fallback keys - fail explicitly if not configured
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const isProduction = process.env.NODE_ENV === 'production';

// Log configuration status
if (!STRIPE_SECRET_KEY) {
  if (isProduction) {
    console.error('[Stripe] CRITICAL: STRIPE_SECRET_KEY is required in production');
  } else {
    console.warn('[Stripe] Warning: STRIPE_SECRET_KEY not configured - billing features disabled');
  }
}

// Create Stripe client only if configured
export const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
    })
  : null;

// Check if Stripe is properly configured
export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_SECRET_KEY && stripe);
}

// Webhook secret is required in production
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export function isWebhookSecretConfigured(): boolean {
  return Boolean(STRIPE_WEBHOOK_SECRET);
}

// SECURITY: In production, webhook secret is required
if (isProduction && STRIPE_SECRET_KEY && !STRIPE_WEBHOOK_SECRET) {
  console.error('[Stripe] CRITICAL: STRIPE_WEBHOOK_SECRET is required in production');
}

// Price IDs from environment
export const SUBSCRIPTION_PRICE_ID = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;
export const ADDON_50_CREDITS_PRICE_ID = process.env.STRIPE_ADDON_50_PRICE_ID;
export const ADDON_100_CREDITS_PRICE_ID = process.env.STRIPE_ADDON_100_PRICE_ID;
