import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is missing from .env');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover', // Use the latest API version
});

// Constants for Price IDs - these should be replaced with actual Price IDs from your Stripe Dashboard
// or you can create them programmatically if they don't exist.
// For this implementation, we'll use lookup_keys or creating prices on the fly if needed, 
// but ideally you should set these in .env or a config file.

export const SUBSCRIPTION_PRICE_ID = process.env.STRIPE_SUBSCRIPTION_PRICE_ID; 
export const ADDON_50_CREDITS_PRICE_ID = process.env.STRIPE_ADDON_50_PRICE_ID;
export const ADDON_100_CREDITS_PRICE_ID = process.env.STRIPE_ADDON_100_PRICE_ID;

