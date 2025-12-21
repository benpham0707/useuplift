import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration for referrals');
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// ============================================================================
// GET /api/v1/referrals/me
// Returns user's referral code, share link, and stats
// ============================================================================
export const getReferralInfo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
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
      return res.status(500).json({ error: 'Failed to get referral code' });
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

    // Generate share link
    const shareLink = `${req.headers.origin || 'https://uplift.app'}/auth?mode=sign-up&ref=${codeData.code}`;

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
  } catch (error: any) {
    console.error('Error getting referral info:', error);
    res.status(500).json({ error: error.message || 'Failed to get referral info' });
  }
};

// ============================================================================
// POST /api/v1/referrals/claim
// Claims a referral code for the current user
// ============================================================================
export const claimReferral = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Referral code is required' });
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
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    // Ensure user is not referring themselves
    if (referralCode.user_id === userId) {
      return res.status(400).json({ error: 'You cannot use your own referral code' });
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
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: referrerId,
          amount: 25,
          type: 'bonus',
          description: `Referral bonus: ${userId.slice(0, 8)}... signed up (+25 credits)`,
        });
    }

    res.json({
      success: true,
      message: 'Referral claimed successfully! You received +10 credits and 10% off all credit packs.',
      creditsReceived: 10,
      discountActive: true,
    });
  } catch (error: any) {
    console.error('Error claiming referral:', error);
    res.status(500).json({ error: error.message || 'Failed to claim referral' });
  }
};
