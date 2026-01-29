/**
 * Referrals API Handlers
 *
 * SECURITY HARDENING:
 * - Error messages sanitized for client responses
 * - Input validation on all endpoints
 * - Audit logging for referral operations
 */

import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { logSecurityEvent, sanitizeErrorForClient, ERROR_CODES, isValidClerkUserId } from './security';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[Referrals] Supabase configuration missing');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// ============================================================================
// GET /api/v1/referrals/me
// Returns user's referral code, share link, and stats
// ============================================================================
export const getReferralInfo = async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: 'Service unavailable',
        code: ERROR_CODES.SERVICE_UNAVAILABLE,
      });
    }

    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: ERROR_CODES.AUTH_REQUIRED,
      });
    }

    // Validate user ID format
    if (!isValidClerkUserId(userId)) {
      logSecurityEvent('input_validation_failed', {
        field: 'userId',
        path: req.path,
      });
      return res.status(401).json({
        error: 'Invalid authentication',
        code: ERROR_CODES.AUTH_INVALID,
      });
    }

    // Get or create referral code
    let { data: codeData } = await supabase
      .from('referral_codes')
      .select('code, created_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (!codeData) {
      // Generate new code
      const { data: newCode } = await supabase.rpc('generate_referral_code');

      const { data: insertedCode, error: insertError } = await supabase
        .from('referral_codes')
        .insert({
          user_id: userId,
          code: newCode
        })
        .select('code, created_at')
        .single();

      if (insertError) {
        // Handle race condition - code might have been created by concurrent request
        const { data: existingCode } = await supabase
          .from('referral_codes')
          .select('code, created_at')
          .eq('user_id', userId)
          .maybeSingle();

        codeData = existingCode || null;
      } else {
        codeData = insertedCode;
      }
    }

    if (!codeData) {
      return res.status(500).json({
        error: 'Unable to generate referral code',
        code: ERROR_CODES.INTERNAL_ERROR,
      });
    }

    // Get referral stats
    const { data: referrals, count: totalReferrals } = await supabase
      .from('referrals')
      .select('referee_user_id, signup_bonus_granted_at, purchase_bonus_granted_at', { count: 'exact' })
      .eq('referrer_user_id', userId);

    const signupBonuses = referrals?.filter(r => r.signup_bonus_granted_at).length || 0;
    const purchaseBonuses = referrals?.filter(r => r.purchase_bonus_granted_at).length || 0;

    // Calculate total credits earned from referrals
    const totalCreditsEarned = (signupBonuses * 25) + (purchaseBonuses * 25);

    // Generate share link - use a safe default if origin is missing
    const origin = req.headers.origin || 'https://uplift.app';
    const shareLink = `${origin}/auth?mode=sign-up&ref=${codeData.code}`;

    res.json({
      code: codeData.code,
      shareLink,
      stats: {
        totalReferrals: totalReferrals || 0,
        signupBonuses,
        purchaseBonuses,
        totalCreditsEarned,
      },
      createdAt: codeData.created_at,
    });
  } catch (error) {
    console.error('[Referrals] Error getting referral info:', error);
    const sanitized = sanitizeErrorForClient(error, 'getReferralInfo');
    res.status(500).json({
      error: sanitized.message,
      code: sanitized.code,
    });
  }
};

// ============================================================================
// POST /api/v1/referrals/claim
// Claims a referral code for the current user
// ============================================================================
export const claimReferral = async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: 'Service unavailable',
        code: ERROR_CODES.SERVICE_UNAVAILABLE,
      });
    }

    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: ERROR_CODES.AUTH_REQUIRED,
      });
    }

    // Validate user ID format
    if (!isValidClerkUserId(userId)) {
      logSecurityEvent('input_validation_failed', {
        field: 'userId',
        path: req.path,
      });
      return res.status(401).json({
        error: 'Invalid authentication',
        code: ERROR_CODES.AUTH_INVALID,
      });
    }

    const { code } = req.body;

    // Input validation
    if (!code || typeof code !== 'string') {
      logSecurityEvent('input_validation_failed', {
        field: 'code',
        path: req.path,
      });
      return res.status(400).json({
        error: 'Referral code is required',
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    // Validate code format (alphanumeric, reasonable length)
    if (code.length > 20 || !/^[A-Za-z0-9]+$/.test(code)) {
      logSecurityEvent('input_validation_failed', {
        field: 'code',
        reason: 'invalid_format',
        path: req.path,
      });
      return res.status(400).json({
        error: 'Invalid referral code format',
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    // Normalize code (uppercase, trim)
    const normalizedCode = code.trim().toUpperCase();

    // Check if user already claimed a referral
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('referrer_user_id, claimed_at')
      .eq('referee_user_id', userId)
      .maybeSingle();

    if (existingReferral) {
      return res.status(400).json({
        error: 'You have already claimed a referral code',
        code: ERROR_CODES.VALIDATION_ERROR,
        alreadyClaimed: true
      });
    }

    // Look up the referral code
    const { data: referralCode } = await supabase
      .from('referral_codes')
      .select('user_id, code')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (!referralCode) {
      return res.status(404).json({
        error: 'Invalid referral code',
        code: ERROR_CODES.NOT_FOUND,
      });
    }

    // Ensure user is not referring themselves
    if (referralCode.user_id === userId) {
      logSecurityEvent('suspicious_activity', {
        type: 'self_referral_attempt',
        userId,
      });
      return res.status(400).json({
        error: 'You cannot use your own referral code',
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const referrerId = referralCode.user_id;
    const now = new Date().toISOString();

    // Create referral relationship (idempotent)
    const { data: referralData, error: referralError } = await supabase
      .from('referrals')
      .insert({
        referee_user_id: userId,
        referrer_user_id: referrerId,
        referral_code: normalizedCode,
        claimed_at: now,
        signup_bonus_granted_at: now, // Mark as granted immediately
      })
      .select()
      .single();

    if (referralError) {
      // Check if it's a duplicate (race condition)
      if (referralError.code === '23505') { // Unique violation
        return res.status(400).json({
          error: 'Referral already claimed',
          code: ERROR_CODES.VALIDATION_ERROR,
          alreadyClaimed: true
        });
      }
      throw referralError;
    }

    // Update referee profile
    await supabase
      .from('profiles')
      .update({
        referred_by: referrerId,
        referral_discount_active: true,
      })
      .eq('user_id', userId);

    // Grant referee +10 credits (bonus)
    const { data: refereeProfile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (refereeProfile) {
      const newRefereeBalance = (refereeProfile.credits || 0) + 10;
      await supabase
        .from('profiles')
        .update({ credits: newRefereeBalance })
        .eq('user_id', userId);

      // Log referee bonus transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: 10,
          type: 'bonus',
          description: 'Referral signup bonus (+10 credits)',
        });
    }

    // Grant referrer +25 credits (signup bonus)
    const { data: referrerProfile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('user_id', referrerId)
      .single();

    if (referrerProfile) {
      const newReferrerBalance = (referrerProfile.credits || 0) + 25;
      await supabase
        .from('profiles')
        .update({ credits: newReferrerBalance })
        .eq('user_id', referrerId);

      // Log referrer signup bonus transaction
      // SECURITY: Don't include full user ID in description
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: referrerId,
          amount: 25,
          type: 'bonus',
          description: 'Referral signup bonus (+25 credits)',
        });
    }

    // Log successful referral
    logSecurityEvent('credit_deduction', {
      action: 'referral_claimed',
      refereeId: userId,
      referralCode: normalizedCode,
    });

    res.json({
      success: true,
      message: 'Referral claimed successfully! You received +10 credits and 10% off all credit packs.',
      creditsReceived: 10,
      discountActive: true,
    });
  } catch (error) {
    console.error('[Referrals] Error claiming referral:', error);
    const sanitized = sanitizeErrorForClient(error, 'claimReferral');
    res.status(500).json({
      error: sanitized.message,
      code: sanitized.code,
    });
  }
};
