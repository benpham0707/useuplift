import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Make Stripe optional for development - only required if billing features are used
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_dev';

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover', // Use the latest API version
    })
  : null as any; // Null when no key is provided - billing endpoints will fail but analysis will work

// Constants for Price IDs - these should be replaced with actual Price IDs from your Stripe Dashboard
// or you can create them programmatically if they don't exist.
// For this implementation, we'll use lookup_keys or creating prices on the fly if needed, 
// but ideally you should set these in .env or a config file.

export const SUBSCRIPTION_PRICE_ID = process.env.STRIPE_SUBSCRIPTION_PRICE_ID; 
export const ADDON_50_CREDITS_PRICE_ID = process.env.STRIPE_ADDON_50_PRICE_ID;
export const ADDON_100_CREDITS_PRICE_ID = process.env.STRIPE_ADDON_100_PRICE_ID;

