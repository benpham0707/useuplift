import { Router } from "express";
import { requireAuth } from "./middleware/auth";
import { completeAssessment } from "@/modules/assessment/complete";
import { completePersonal } from "@/modules/personal/complete";
import * as Exp from "@/modules/experiences/controller";
import * as Billing from "./billing";
import * as Referrals from "./referrals";
import * as DevAuth from "./dev-auth";
import { handleClerkWebhook } from "./webhooks/clerk";
import { computePortfolioStrength, reconcilePortfolioStrength } from "@/modules/analytics/portfolio";
import activityChatRouter from "./activityChatRoutes";

const r = Router();

// Development-only routes (bypasses Clerk authentication)
// SECURITY: Requires BOTH NODE_ENV=development AND ALLOW_DEV_AUTH=true
const isDevModeActive = DevAuth.isDevModeActive();
console.log('🔧 Development routes:', isDevModeActive ? 'ENABLED (ALLOW_DEV_AUTH=true)' : 'DISABLED');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   ALLOW_DEV_AUTH:', process.env.ALLOW_DEV_AUTH || 'not set');

if (isDevModeActive) {
  console.log('✅ Loading development routes (dev auth explicitly enabled)...');
  // Test user management
  r.post("/dev/test-user", DevAuth.createTestUser);
  r.get("/dev/test-users", DevAuth.getTestUsers);

  // Referrals (development bypass)
  r.get("/dev/referrals/me", DevAuth.devAuthBypass, Referrals.getReferralInfo);
  r.post("/dev/referrals/claim", DevAuth.devAuthBypass, Referrals.claimReferral);

  // Billing (development bypass)
  r.post("/dev/billing/checkout", DevAuth.devAuthBypass, Billing.createCheckoutSession);

  console.log('✅ Development routes loaded');
} else {
  console.log('🔒 Development routes NOT loaded (requires NODE_ENV=development AND ALLOW_DEV_AUTH=true)');
}

// Webhooks (no auth required - uses signature verification)
r.post("/webhooks/clerk", handleClerkWebhook);

// Billing API
r.post("/billing/checkout", requireAuth, Billing.createCheckoutSession);
r.post("/billing/webhook", Billing.handleWebhook);
r.post("/billing/verify-session", requireAuth, Billing.verifySession);
r.post("/billing/portal", requireAuth, Billing.createPortalSession);

// Referrals API
r.get("/referrals/me", requireAuth, Referrals.getReferralInfo);
r.post("/referrals/claim", requireAuth, Referrals.claimReferral);

r.post("/assessment/complete", requireAuth, completeAssessment);
r.post("/personal/complete", requireAuth, completePersonal);

// Experiences API
r.post("/experiences", requireAuth, Exp.create);
r.get("/experiences", requireAuth, Exp.list);
r.patch("/experiences/:id", requireAuth, Exp.update);

// Analytics API
r.get("/analytics/portfolio-strength", requireAuth, computePortfolioStrength);
r.post("/analytics/reconcile", requireAuth, reconcilePortfolioStrength);

// ============================================================================
// Extracurricular Analysis Endpoint
// ============================================================================
// IMPORTANT: This endpoint has 3 fallback paths that ALL must return 11 rubric dimensions:
//   1. Quick depth (intentional - saves API credits)
//   2. No API key (emergency fallback)
//   3. API error/timeout (catches auth errors, credit issues, timeouts)
//
// PROPER FIX: Add credits to ANTHROPIC_API_KEY to use sophisticated 19-iteration system.
// Current issue: API key has no credits, so system uses heuristic fallback.
// ============================================================================
r.post("/analyze-entry", async (req, res) => {
  try {
    // Frontend sends: {description, activity, depth, skip_coaching}
    // Backend expects: {entry: ExperienceEntry, options}
    const { description, activity, depth, skip_coaching, entry, options } = req.body || {};

    // Build entry object from frontend format or use legacy format
    const entryObj = entry || {
      id: activity?.id || 'temp-' + Date.now(),
      title: activity?.title || 'Activity',
      category: activity?.category || 'service',
      description_original: description,
      role: activity?.role || 'Participant',
      hours_per_week: activity?.hours_per_week || 0,
      weeks_per_year: activity?.weeks_per_year || 0,
    };

    if (!entryObj.description_original) {
      return res.status(400).json({ message: "Missing description" });
    }

    const analysisOptions = options || {
      depth: depth || 'standard',
      skip_coaching: skip_coaching || false,
    };

    // ============================================================================
    // FALLBACK PATH #1: Quick Depth (Intentional - saves API credits)
    // ============================================================================
    // CRITICAL: This MUST return all 11 rubric dimensions to match the full system.
    // If you modify this, verify all 11 categories are present or frontend will break.
    if ((analysisOptions.depth || 'standard') === 'quick') {
      // STRICT HEURISTIC FALLBACK - matches our brutal scoring philosophy
      const text: string = String(entryObj.description_original || '');
      const wc = text.trim().split(/\s+/).filter(Boolean).length;

      // Apply LENGTH PENALTIES first
      let maxScore = 10;
      if (wc < 25) maxScore = 1;
      else if (wc < 50) maxScore = 2;
      else if (wc < 100) maxScore = 4;

      // STRICT BASE: Resume bullets start at 1-2, not 5-8!
      const hasStory = text.match(/\b(felt|realized|learned|discovered|struggled|wondered)\b/i);
      const hasEmotion = text.match(/\b(nervous|excited|frustrated|proud|afraid|confused)\b/i);
      const hasDialogue = text.includes('"') || text.includes("'");
      const hasReflection = text.match(/\b(I (learned|realized|understood|discovered))\b/i);

      let base = 1.5; // Resume bullet default
      if (hasStory) base += 1;
      if (hasEmotion) base += 1.5;
      if (hasDialogue) base += 1;
      if (hasReflection) base += 1;

      // Cap at maxScore based on length
      base = Math.min(base, maxScore);

      // Calculate heuristic scores for all 11 rubric dimensions
      const hasNumbers = text.match(/\d+/g)?.length || 0;
      const hasLeadership = text.match(/\b(led|founded|created|organized|initiated|coordinated|managed)\b/i);
      const hasCommunity = text.match(/\b(we|team|group|community|others|together|collaborative)\b/i);
      const hasImpact = text.match(/\b(changed|improved|increased|helped|taught|built|achieved)\b/i);
      const hasOwnership = text.match(/\b(I|my)\b/g)?.length || 0;
      const hasStakes = text.match(/\b(challenge|problem|struggled|difficult|failed|overcome)\b/i);

      const report = {
        id: entryObj.id || undefined,
        rubric_version: '1.0.0',
        created_at: new Date().toISOString(),
        narrative_quality_index: Math.round(base * 10),
        reader_impression_label: base >= 7 ? 'solid_needs_polish' : base >= 4 ? 'needs_work' : 'weak',
        categories: [
          {
            name: 'voice_integrity',
            score_0_to_10: +(base).toFixed(1),
            evidence_snippets: [text.slice(0, 80)],
            evaluator_notes: 'Heuristic: Resume-style; needs authentic voice and sensory details.'
          },
          {
            name: 'specificity_evidence',
            score_0_to_10: +(Math.max(1, base - 0.5 + (hasNumbers > 2 ? 1 : 0))).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: hasNumbers > 0 ? 'Heuristic: Has some metrics, but needs more specific evidence.' : 'Heuristic: Needs concrete metrics (who/when/how much).'
          },
          {
            name: 'transformative_impact',
            score_0_to_10: +(Math.max(1, base - 0.5 + (hasImpact ? 1 : 0))).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: hasImpact ? 'Heuristic: Shows some impact, but needs before/after contrast.' : 'Heuristic: Needs clear transformative impact on self or community.'
          },
          {
            name: 'role_clarity_ownership',
            score_0_to_10: +(Math.max(1, base - 0.3 + (hasOwnership > 3 ? 0.5 : 0))).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: 'Heuristic: Needs clearer role definition and personal ownership markers.'
          },
          {
            name: 'narrative_arc_stakes',
            score_0_to_10: +(Math.max(1, base - 1 + (hasStakes ? 1.5 : 0))).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: hasStakes ? 'Heuristic: Has some stakes/challenges, but needs narrative arc.' : 'Heuristic: Needs challenge/stakes and narrative progression.'
          },
          {
            name: 'initiative_leadership',
            score_0_to_10: +(Math.max(1, base - 0.5 + (hasLeadership ? 1 : 0))).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: hasLeadership ? 'Heuristic: Shows some initiative, but needs specific leadership moments.' : 'Heuristic: Needs clear initiative and leadership examples.'
          },
          {
            name: 'community_collaboration',
            score_0_to_10: +(Math.max(1, base - 0.5 + (hasCommunity ? 0.5 : 0))).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: hasCommunity ? 'Heuristic: Mentions collaboration, but needs depth on relationships.' : 'Heuristic: Needs community/collaborative elements.'
          },
          {
            name: 'reflection_meaning',
            score_0_to_10: +(Math.max(0, base - 1 + (hasReflection ? 1 : 0))).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: hasReflection ? 'Heuristic: Has basic reflection, but needs transferable insights.' : 'Heuristic: Needs deeper reflection with transferable insights.'
          },
          {
            name: 'craft_language_quality',
            score_0_to_10: +(Math.max(1, base - 0.5 + (hasDialogue ? 1 : 0) + (wc > 150 ? 0.5 : 0))).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: 'Heuristic: Needs varied sentence structure and vivid language.'
          },
          {
            name: 'fit_trajectory',
            score_0_to_10: +(Math.max(1, base - 0.5)).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: 'Heuristic: Needs connection to academic/career trajectory.'
          },
          {
            name: 'time_investment_consistency',
            score_0_to_10: +(Math.max(1, base - 0.3)).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: 'Heuristic: Needs time commitment details and consistency indicators.'
          },
        ],
        weights: {
          voice_integrity: 0.10,
          specificity_evidence: 0.09,
          transformative_impact: 0.12,
          role_clarity_ownership: 0.08,
          narrative_arc_stakes: 0.10,
          initiative_leadership: 0.10,
          community_collaboration: 0.08,
          reflection_meaning: 0.12,
          craft_language_quality: 0.07,
          fit_trajectory: 0.07,
          time_investment_consistency: 0.07,
        },
        flags: ['heuristic_scoring', 'no_api_key', ...(wc < 100 ? ['too_short'] : []), ...(wc < 50 ? ['critically_short'] : [])],
        suggested_fixes_ranked: ['Add story elements (emotion, dialogue, reflection)', 'Add concrete numbers and outcomes', 'Increase word count to 150-200 words'],
      };

      const authenticity = {
        authenticity_score: +(Math.max(3, Math.min(7, base)).toFixed(1)),
        voice_type: wc < 50 ? 'resume' : (hasStory || hasEmotion ? 'conversational' : 'factual'),
        red_flags: [...(wc < 80 ? ['too_short'] : []), ...(!hasReflection ? ['no_reflection'] : [])],
        green_flags: [...(hasStory ? ['story_elements'] : []), ...(hasEmotion ? ['emotional_depth'] : [])],
      };

      const coaching = {
        overall: {
          narrative_quality_index: report.narrative_quality_index,
          score_tier: report.narrative_quality_index >= 70 ? 'good' : report.narrative_quality_index >= 40 ? 'needs_work' : 'weak',
          total_issues: 3,
          issues_resolved: 0,
          quick_summary: 'Add story elements (emotion, dialogue), concrete metrics, and deeper reflection to improve from resume-style to narrative.',
        },
        categories: [
          {
            category_name: 'Evidence & Specificity',
            category_key: 'specificity_evidence',
            score: report.categories[1].score_0_to_10,
            diagnosis: 'Claims lack concrete numbers and outcome details.',
            issues_count: 1,
            detected_issues: [
              {
                id: 'evidence-1',
                category: 'specificity_evidence',
                severity: 'important',
                title: 'Add a concrete metric',
                from_draft: text.slice(0, Math.min(120, text.length)),
                problem: 'No numbers to ground the claims.',
                why_matters: 'Specific numbers increase credibility and allow scoring against rubric.',
                suggested_fixes: [
                  { fix_text: 'Reached 52 students weekly; 18 consistent attendees (34%).', why_this_works: 'Concrete and plausible metrics anchor outcomes.', apply_type: 'add' },
                ],
                status: 'not_fixed',
                expanded: false,
                currentSuggestionIndex: 0,
              },
            ],
          },
          {
            category_name: 'Reflection & Meaning',
            category_key: 'reflection_meaning',
            score: report.categories[2].score_0_to_10,
            diagnosis: 'The draft reports actions without a brief insight.',
            issues_count: 1,
            detected_issues: [
              {
                id: 'reflection-1',
                category: 'reflection_meaning',
                severity: 'helpful',
                title: 'Add a one-sentence insight',
                from_draft: text.slice(-Math.min(120, text.length)),
                problem: 'No explicit takeaway or transferable learning.',
                why_matters: 'Shows self-awareness and growth; improves reader impression.',
                suggested_fixes: [
                  { fix_text: 'I learned to design for beginners—measuring progress in confidence, not syntax.', why_this_works: 'Links action to meaning succinctly.', apply_type: 'add' },
                ],
                status: 'not_fixed',
                expanded: false,
                currentSuggestionIndex: 0,
              },
            ],
          },
        ],
        top_priorities: [
          { category: 'specificity_evidence', issue_title: 'Add a concrete metric', impact: '+2–3 NQI' },
          { category: 'reflection_meaning', issue_title: 'Add a one-sentence insight', impact: '+1–2 NQI' },
        ],
      };

      return res.json({ success: true, result: { report, authenticity, coaching, performance: { total_ms: 1200 } }, engine: 'heuristic_quick' });
    }

    // ============================================================================
    // FALLBACK PATH #2: No API Key (Emergency fallback)
    // ============================================================================
    // CRITICAL: This MUST return all 11 rubric dimensions to match the full system.
    // If you modify this, verify all 11 categories are present or frontend will break.
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // No key: still return heuristic to avoid breaking UI
      const text: string = String(entryObj.description_original || '');
      const wc = text.trim().split(/\s+/).filter(Boolean).length;
      let maxScore = 10;
      if (wc < 25) maxScore = 1;
      else if (wc < 50) maxScore = 2;
      else if (wc < 100) maxScore = 4;
      const hasStory = text.match(/\b(felt|realized|learned|discovered|struggled|wondered)\b/i);
      const hasEmotion = text.match(/\b(nervous|excited|frustrated|proud|afraid|confused)\b/i);
      const hasDialogue = text.includes('"') || text.includes("'");
      const hasReflection = text.match(/\b(I (learned|realized|understood|discovered))\b/i);
      let base = 1.5;
      if (hasStory) base += 1;
      if (hasEmotion) base += 1.5;
      if (hasDialogue) base += 1;
      if (hasReflection) base += 1;
      base = Math.min(base, maxScore);

      // Calculate heuristic scores for all 11 rubric dimensions
      const hasNumbers = text.match(/\d+/g)?.length || 0;
      const hasLeadership = text.match(/\b(led|founded|created|organized|initiated|coordinated|managed)\b/i);
      const hasCommunity = text.match(/\b(we|team|group|community|others|together|collaborative)\b/i);
      const hasImpact = text.match(/\b(changed|improved|increased|helped|taught|built|achieved)\b/i);
      const hasOwnership = text.match(/\b(I|my)\b/g)?.length || 0;
      const hasStakes = text.match(/\b(challenge|problem|struggled|difficult|failed|overcome)\b/i);

      const report = {
        id: entryObj.id || undefined,
        rubric_version: '1.0.0',
        created_at: new Date().toISOString(),
        narrative_quality_index: Math.round(base * 10),
        reader_impression_label: base >= 7 ? 'solid_needs_polish' : base >= 4 ? 'needs_work' : 'weak',
        categories: [
          {
            name: 'voice_integrity',
            score_0_to_10: +(base).toFixed(1),
            evidence_snippets: [text.slice(0, 80)],
            evaluator_notes: 'Heuristic: Resume-style; needs authentic voice and sensory details.'
          },
          {
            name: 'specificity_evidence',
            score_0_to_10: +(Math.max(1, base - 0.5 + (hasNumbers > 2 ? 1 : 0))).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: hasNumbers > 0 ? 'Heuristic: Has some metrics, but needs more specific evidence.' : 'Heuristic: Needs concrete metrics (who/when/how much).'
          },
          {
            name: 'transformative_impact',
            score_0_to_10: +(Math.max(1, base - 0.5 + (hasImpact ? 1 : 0))).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: hasImpact ? 'Heuristic: Shows some impact, but needs before/after contrast.' : 'Heuristic: Needs clear transformative impact on self or community.'
          },
          {
            name: 'role_clarity_ownership',
            score_0_to_10: +(Math.max(1, base - 0.3 + (hasOwnership > 3 ? 0.5 : 0))).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: 'Heuristic: Needs clearer role definition and personal ownership markers.'
          },
          {
            name: 'narrative_arc_stakes',
            score_0_to_10: +(Math.max(1, base - 1 + (hasStakes ? 1.5 : 0))).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: hasStakes ? 'Heuristic: Has some stakes/challenges, but needs narrative arc.' : 'Heuristic: Needs challenge/stakes and narrative progression.'
          },
          {
            name: 'initiative_leadership',
            score_0_to_10: +(Math.max(1, base - 0.5 + (hasLeadership ? 1 : 0))).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: hasLeadership ? 'Heuristic: Shows some initiative, but needs specific leadership moments.' : 'Heuristic: Needs clear initiative and leadership examples.'
          },
          {
            name: 'community_collaboration',
            score_0_to_10: +(Math.max(1, base - 0.5 + (hasCommunity ? 0.5 : 0))).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: hasCommunity ? 'Heuristic: Mentions collaboration, but needs depth on relationships.' : 'Heuristic: Needs community/collaborative elements.'
          },
          {
            name: 'reflection_meaning',
            score_0_to_10: +(Math.max(0, base - 1 + (hasReflection ? 1 : 0))).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: hasReflection ? 'Heuristic: Has basic reflection, but needs transferable insights.' : 'Heuristic: Needs deeper reflection with transferable insights.'
          },
          {
            name: 'craft_language_quality',
            score_0_to_10: +(Math.max(1, base - 0.5 + (hasDialogue ? 1 : 0) + (wc > 150 ? 0.5 : 0))).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: 'Heuristic: Needs varied sentence structure and vivid language.'
          },
          {
            name: 'fit_trajectory',
            score_0_to_10: +(Math.max(1, base - 0.5)).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: 'Heuristic: Needs connection to academic/career trajectory.'
          },
          {
            name: 'time_investment_consistency',
            score_0_to_10: +(Math.max(1, base - 0.3)).toFixed(1),
            evidence_snippets: [],
            evaluator_notes: 'Heuristic: Needs time commitment details and consistency indicators.'
          },
        ],
        weights: {
          voice_integrity: 0.10,
          specificity_evidence: 0.09,
          transformative_impact: 0.12,
          role_clarity_ownership: 0.08,
          narrative_arc_stakes: 0.10,
          initiative_leadership: 0.10,
          community_collaboration: 0.08,
          reflection_meaning: 0.12,
          craft_language_quality: 0.07,
          fit_trajectory: 0.07,
          time_investment_consistency: 0.07,
        },
        flags: ['heuristic_scoring', 'no_api_key', ...(wc < 100 ? ['too_short'] : []), ...(wc < 50 ? ['critically_short'] : [])],
        suggested_fixes_ranked: ['Add story elements (emotion, dialogue, reflection)', 'Add concrete numbers and outcomes', 'Increase word count to 150-200 words'],
      };
      const authenticity = {
        authenticity_score: +(Math.max(3, Math.min(7, base)).toFixed(1)),
        voice_type: wc < 50 ? 'resume' : (hasStory || hasEmotion ? 'conversational' : 'factual'),
        red_flags: [...(wc < 80 ? ['too_short'] : []), ...(!hasReflection ? ['no_reflection'] : [])],
        green_flags: [...(hasStory ? ['story_elements'] : []), ...(hasEmotion ? ['emotional_depth'] : [])],
      };
      const coaching = {
        overall: {
          narrative_quality_index: report.narrative_quality_index,
          score_tier: report.narrative_quality_index >= 70 ? 'good' : report.narrative_quality_index >= 40 ? 'needs_work' : 'weak',
          total_issues: 3,
          issues_resolved: 0,
          quick_summary: 'Add story elements (emotion, dialogue), concrete metrics, and deeper reflection to improve from resume-style to narrative.',
        },
        categories: [],
        top_priorities: [
          { category: 'specificity_evidence', issue_title: 'Add a concrete metric', impact: '+2–3 NQI' },
          { category: 'reflection_meaning', issue_title: 'Add a one-sentence insight', impact: '+1–2 NQI' },
        ],
      };
      return res.json({ success: true, result: { report, authenticity, coaching, performance: { total_ms: 900 } }, engine: 'heuristic_no_key' });
    }

    // Dynamic import to avoid failing server startup if env is missing
    const { analyzeEntry } = await import("@/core/analysis/engine");
    try {
      const result = await analyzeEntry(entryObj, analysisOptions as any);

      // Map backend result to frontend API response format (with success wrapper)
      return res.json({
        success: true,
        result: {
          report: {
            id: (result as any).report?.id,
            rubric_version: (result as any).report?.rubric_version || '1.0.0',
            created_at: (result as any).report?.created_at || new Date().toISOString(),
            narrative_quality_index: result.report.narrative_quality_index,
            reader_impression_label: result.report.reader_impression_label,
            categories: result.report.categories.map((cat: any) => ({
              name: cat.name,
              score_0_to_10: cat.score_0_to_10,
              evidence_snippets: cat.evidence_snippets,
              evaluator_notes: cat.evaluator_notes,
            })),
            weights: (result as any).report?.weights || {
              voice_integrity: 0.10,
              specificity_evidence: 0.09,
              transformative_impact: 0.12,
              role_clarity_ownership: 0.08,
              narrative_arc_stakes: 0.10,
              initiative_leadership: 0.10,
              community_collaboration: 0.08,
              reflection_meaning: 0.12,
              craft_language_quality: 0.07,
              fit_trajectory: 0.07,
              time_investment_consistency: 0.07,
            },
            flags: result.report.flags,
            suggested_fixes_ranked: result.report.suggested_fixes_ranked,
            analysis_depth: (result as any).report?.analysis_depth || 'standard',
          },
          authenticity: {
            authenticity_score: result.authenticity.authenticity_score,
            voice_type: result.authenticity.voice_type,
            red_flags: result.authenticity.red_flags,
            green_flags: result.authenticity.green_flags,
          },
          coaching: result.coaching,
          performance: {
            total_ms: result.performance.total_ms,
          },
        },
        engine: 'sophisticated_19_iteration_system'
      });
    } catch (llmErr: any) {
      // ============================================================================
      // FALLBACK PATH #3: API Error/Timeout (Catches auth errors, credit issues, timeouts)
      // ============================================================================
      // CRITICAL: This MUST return all 11 rubric dimensions to match the full system.
      // If you modify this, verify all 11 categories are present or frontend will break.
      const msg = String(llmErr?.message || llmErr || '');
      const isApiIssue =
        msg.includes('credit balance') ||
        msg.includes('insufficient') ||
        msg.includes('invalid_request_error') ||
        msg.includes('authentication_error') ||
        msg.includes('invalid x-api-key') ||
        msg.includes('Invalid API key') ||
        msg.includes('Unauthorized') ||
        msg.includes('timed out') ||
        msg.includes('timeout') ||
        msg.includes('Claude API error: 400') ||
        msg.includes('Claude API error: 401') ||
        msg.includes('401');

      if (isApiIssue) {
        // STRICT HEURISTIC FALLBACK on API error - matches our brutal scoring philosophy
        const text: string = String(entryObj.description_original || '');
        const wc = text.trim().split(/\s+/).filter(Boolean).length;

        // Apply LENGTH PENALTIES first
        let maxScore = 10;
        if (wc < 25) maxScore = 1;
        else if (wc < 50) maxScore = 2;
        else if (wc < 100) maxScore = 4;

        // STRICT BASE: Resume bullets start at 1-2, not 5-8!
        const hasStory = text.match(/\b(felt|realized|learned|discovered|struggled|wondered)\b/i);
        const hasEmotion = text.match(/\b(nervous|excited|frustrated|proud|afraid|confused)\b/i);
        const hasDialogue = text.includes('"') || text.includes("'");
        const hasReflection = text.match(/\b(I (learned|realized|understood|discovered))\b/i);

        let base = 1.5; // Resume bullet default
        if (hasStory) base += 1;
        if (hasEmotion) base += 1.5;
        if (hasDialogue) base += 1;
        if (hasReflection) base += 1;

        // Cap at maxScore based on length
        base = Math.min(base, maxScore);

        // Calculate heuristic scores for all 11 rubric dimensions
        const hasNumbers = text.match(/\d+/g)?.length || 0;
        const hasLeadership = text.match(/\b(led|founded|created|organized|initiated|coordinated|managed)\b/i);
        const hasCommunity = text.match(/\b(we|team|group|community|others|together|collaborative)\b/i);
        const hasImpact = text.match(/\b(changed|improved|increased|helped|taught|built|achieved)\b/i);
        const hasOwnership = text.match(/\b(I|my)\b/g)?.length || 0;
        const hasStakes = text.match(/\b(challenge|problem|struggled|difficult|failed|overcome)\b/i);

        const report = {
          id: entryObj.id || undefined,
          rubric_version: '1.0.0',
          created_at: new Date().toISOString(),
          narrative_quality_index: Math.round(base * 10),
          reader_impression_label: base >= 7 ? 'solid_needs_polish' : base >= 4 ? 'needs_work' : 'weak',
          categories: [
            {
              name: 'voice_integrity',
              score_0_to_10: +(base).toFixed(1),
              evidence_snippets: [text.slice(0, 80)],
              evaluator_notes: 'Heuristic: Resume-style; needs authentic voice and sensory details.'
            },
            {
              name: 'specificity_evidence',
              score_0_to_10: +(Math.max(1, base - 0.5 + (hasNumbers > 2 ? 1 : 0))).toFixed(1),
              evidence_snippets: [],
              evaluator_notes: hasNumbers > 0 ? 'Heuristic: Has some metrics, but needs more specific evidence.' : 'Heuristic: Needs concrete metrics (who/when/how much).'
            },
            {
              name: 'transformative_impact',
              score_0_to_10: +(Math.max(1, base - 0.5 + (hasImpact ? 1 : 0))).toFixed(1),
              evidence_snippets: [],
              evaluator_notes: hasImpact ? 'Heuristic: Shows some impact, but needs before/after contrast.' : 'Heuristic: Needs clear transformative impact on self or community.'
            },
            {
              name: 'role_clarity_ownership',
              score_0_to_10: +(Math.max(1, base - 0.3 + (hasOwnership > 3 ? 0.5 : 0))).toFixed(1),
              evidence_snippets: [],
              evaluator_notes: 'Heuristic: Needs clearer role definition and personal ownership markers.'
            },
            {
              name: 'narrative_arc_stakes',
              score_0_to_10: +(Math.max(1, base - 1 + (hasStakes ? 1.5 : 0))).toFixed(1),
              evidence_snippets: [],
              evaluator_notes: hasStakes ? 'Heuristic: Has some stakes/challenges, but needs narrative arc.' : 'Heuristic: Needs challenge/stakes and narrative progression.'
            },
            {
              name: 'initiative_leadership',
              score_0_to_10: +(Math.max(1, base - 0.5 + (hasLeadership ? 1 : 0))).toFixed(1),
              evidence_snippets: [],
              evaluator_notes: hasLeadership ? 'Heuristic: Shows some initiative, but needs specific leadership moments.' : 'Heuristic: Needs clear initiative and leadership examples.'
            },
            {
              name: 'community_collaboration',
              score_0_to_10: +(Math.max(1, base - 0.5 + (hasCommunity ? 0.5 : 0))).toFixed(1),
              evidence_snippets: [],
              evaluator_notes: hasCommunity ? 'Heuristic: Mentions collaboration, but needs depth on relationships.' : 'Heuristic: Needs community/collaborative elements.'
            },
            {
              name: 'reflection_meaning',
              score_0_to_10: +(Math.max(0, base - 1 + (hasReflection ? 1 : 0))).toFixed(1),
              evidence_snippets: [],
              evaluator_notes: hasReflection ? 'Heuristic: Has basic reflection, but needs transferable insights.' : 'Heuristic: Needs deeper reflection with transferable insights.'
            },
            {
              name: 'craft_language_quality',
              score_0_to_10: +(Math.max(1, base - 0.5 + (hasDialogue ? 1 : 0) + (wc > 150 ? 0.5 : 0))).toFixed(1),
              evidence_snippets: [],
              evaluator_notes: 'Heuristic: Needs varied sentence structure and vivid language.'
            },
            {
              name: 'fit_trajectory',
              score_0_to_10: +(Math.max(1, base - 0.5)).toFixed(1),
              evidence_snippets: [],
              evaluator_notes: 'Heuristic: Needs connection to academic/career trajectory.'
            },
            {
              name: 'time_investment_consistency',
              score_0_to_10: +(Math.max(1, base - 0.3)).toFixed(1),
              evidence_snippets: [],
              evaluator_notes: 'Heuristic: Needs time commitment details and consistency indicators.'
            },
          ],
          weights: {
            voice_integrity: 0.10,
            specificity_evidence: 0.09,
            transformative_impact: 0.12,
            role_clarity_ownership: 0.08,
            narrative_arc_stakes: 0.10,
            initiative_leadership: 0.10,
            community_collaboration: 0.08,
            reflection_meaning: 0.12,
            craft_language_quality: 0.07,
            fit_trajectory: 0.07,
            time_investment_consistency: 0.07,
          },
          flags: ['heuristic_scoring', 'api_error', ...(wc < 100 ? ['too_short'] : []), ...(wc < 50 ? ['critically_short'] : [])],
          suggested_fixes_ranked: ['Check API key/credits to use sophisticated analysis', 'Add story elements (emotion, dialogue, reflection)', 'Add concrete numbers and outcomes'],
        };

        const authenticity = {
          authenticity_score: +(Math.max(3, Math.min(7, base)).toFixed(1)),
          voice_type: wc < 50 ? 'resume' : (hasStory || hasEmotion ? 'conversational' : 'factual'),
          red_flags: [...(wc < 80 ? ['too_short'] : []), ...(!hasReflection ? ['no_reflection'] : [])],
          green_flags: [...(hasStory ? ['story_elements'] : []), ...(hasEmotion ? ['emotional_depth'] : [])],
        };

        return res.json({ success: true, result: { report, authenticity, coaching: null, performance: { total_ms: 800 } }, engine: 'heuristic_fallback_credit_error' });
      }

      // Unknown failure: return 500 with diagnostic
      return res.status(500).json({ message: 'Analysis failed', error: msg });
    }
  } catch (err: any) {
    // eslint-disable-next-line no-console
    return res.status(500).json({ message: 'Analysis failed', error: String(err?.message || err) });
  }
});

// ============================================================================
// Academic History Analysis Endpoint
// ============================================================================
// Comprehensive academic profile evaluation using Section 6 research modules.
// Provides:
//   - GPA analysis with school context calibration
//   - Course rigor assessment
//   - Grade trajectory analysis
//   - Red flag detection (4-tier severity system)
//   - Testing strategy recommendations
//   - Research-backed teaching insights
// ============================================================================
r.post("/analyze-academics", requireAuth, async (req, res) => {
  try {
    const { analyzeAcademicHistory } = await import("@/services/portfolioStrategy/services/academicHistoryAnalyzer");
    const { detectAcademicRedFlags } = await import("@/services/portfolioStrategy/services/academicRedFlagDetector");
    const { getAcademicTeaching } = await import("@/services/portfolioStrategy/services/academicTeachingService");

    const academicInput = req.body;

    if (!academicInput || !academicInput.gpa || !academicInput.courses) {
      return res.status(400).json({
        success: false,
        error: "Missing required academic data. Please provide gpa and courses.",
      });
    }

    // Run comprehensive academic analysis
    const analysis = await analyzeAcademicHistory(academicInput);

    // Run additional red flag detection
    const redFlagReport = detectAcademicRedFlags(academicInput);

    // Get relevant teaching for detected issues
    const teachingInsights: Record<string, any> = {};
    if (redFlagReport.flags_detected.length > 0) {
      for (const flag of redFlagReport.flags_detected.slice(0, 3)) {
        const teaching = getAcademicTeaching(flag.flag_id as any);
        if (teaching) {
          teachingInsights[flag.flag_id] = {
            headline: teaching.why_section.headline,
            explanation: teaching.why_section.explanation,
            admissions_perspective: teaching.why_section.admissions_perspective,
            guidance: teaching.guidance,
          };
        }
      }
    }

    return res.json({
      success: true,
      analysis,
      red_flag_report: redFlagReport,
      teaching_insights: teachingInsights,
      metadata: {
        analyzed_at: new Date().toISOString(),
        research_modules_used: [
          "Section 6.1: Course Level Hierarchy",
          "Section 6.2: AP Course Difficulty Tiers",
          "Section 6.5: School Context Calibration",
          "Section 6.6: Grade Interpretation",
          "Section 6.9: Academic Red Flags",
        ],
      },
    });
  } catch (error: any) {
    console.error("[analyze-academics] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Academic analysis failed",
    });
  }
});

// Academic Teaching Lookup Endpoint (for individual issue explanations)
r.get("/academic-teaching/:issueType", async (req, res) => {
  try {
    const { formatAcademicTeaching, getAcademicTeaching } = await import(
      "@/services/portfolioStrategy/services/academicTeachingService"
    );

    const { issueType } = req.params;
    const teaching = getAcademicTeaching(issueType as any);

    if (!teaching) {
      return res.status(404).json({
        success: false,
        error: `No teaching available for issue type: ${issueType}`,
      });
    }

    return res.json({
      success: true,
      issue_type: issueType,
      teaching,
      formatted: formatAcademicTeaching(issueType as any),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// Voice Profile API
// ============================================================================
r.get("/api/voice-profile", requireAuth, async (req, res) => {
  try {
    const { voiceProfileService } = await import("@/services/voiceProfile");
    const profile = await voiceProfileService.load(req.auth.userId);
    res.json({ success: true, data: profile });
  } catch (error: any) {
    console.error('[voice-profile] GET error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to load voice profile' });
  }
});

r.put("/api/voice-profile", requireAuth, async (req, res) => {
  try {
    const { voiceProfileService } = await import("@/services/voiceProfile");
    const { text, source } = req.body;
    if (!text || !source) {
      return res.status(400).json({ success: false, error: 'Missing required fields: text, source' });
    }
    const existing = await voiceProfileService.load(req.auth.userId);
    const profile = existing
      ? await voiceProfileService.enrichProfile(req.auth.userId, text, source)
      : await voiceProfileService.buildFromSample(req.auth.userId, text, source);
    await voiceProfileService.save(profile);
    res.json({ success: true, data: profile });
  } catch (error: any) {
    console.error('[voice-profile] PUT error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to build voice profile' });
  }
});

// ============================================================================
// Inline Edit API
// ============================================================================
r.post("/api/inline-edit", requireAuth, async (req, res) => {
  try {
    const { inlineEditorService } = await import("@/services/inlineEditor");
    const { sessionId, ragContext, ...rest } = req.body;
    const result = await inlineEditorService.applyCommand({
      ...rest,
      ...(sessionId ? { sessionId } : {}),
      ...(ragContext ? { ragContext } : {}),
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[inline-edit] error:', error);
    res.status(500).json({ success: false, error: error.message || 'Inline edit failed' });
  }
});

r.post("/api/inline-edit/suggest", requireAuth, async (req, res) => {
  try {
    const { inlineEditorService } = await import("@/services/inlineEditor");
    const { selectedText, fullDocument, essayType } = req.body;
    if (!selectedText || !fullDocument) {
      return res.status(400).json({ success: false, error: 'Missing required fields: selectedText, fullDocument' });
    }
    const suggestions = await inlineEditorService.suggestCommands(selectedText, fullDocument, essayType);
    res.json({ success: true, data: suggestions });
  } catch (error: any) {
    console.error('[inline-edit/suggest] error:', error);
    res.status(500).json({ success: false, error: error.message || 'Suggest commands failed' });
  }
});

// ============================================================================
// Authenticity Check API
// ============================================================================
r.post("/api/authenticity-check", requireAuth, async (req, res) => {
  try {
    const { aiRiskScorer } = await import("@/services/authenticity");
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Missing required field: text' });
    }
    const assessment = aiRiskScorer.assessRisk(text);
    res.json({ success: true, data: assessment });
  } catch (error: any) {
    console.error('[authenticity-check] error:', error);
    res.status(500).json({ success: false, error: error.message || 'Authenticity check failed' });
  }
});

// Activity Chat Routes
r.use(activityChatRouter);

// ============================================================================
// Story Mining API
// ============================================================================
r.post("/api/story-mining/mine", requireAuth, async (req, res) => {
  try {
    const { storyMiningService } = await import("@/services/storyMining");
    const { activities, targetPrompts } = req.body;
    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing required field: activities (non-empty array)' });
    }
    const result = await storyMiningService.mineStories({
      userId: req.auth.userId,
      activities,
      targetPrompts,
    });
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Story mining failed';
    console.error('[story-mining/mine] error:', error);
    res.status(500).json({ success: false, error: message });
  }
});

r.post("/api/story-mining/deepen", requireAuth, async (req, res) => {
  try {
    const { storyMiningService } = await import("@/services/storyMining");
    const { seedId, seed } = req.body;
    if (!seedId || !seed) {
      return res.status(400).json({ success: false, error: 'Missing required fields: seedId, seed' });
    }
    const result = await storyMiningService.deepenSeed(seedId, seed);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Seed deepening failed';
    console.error('[story-mining/deepen] error:', error);
    res.status(500).json({ success: false, error: message });
  }
});

r.post("/api/story-mining/rank", requireAuth, async (req, res) => {
  try {
    const { storyMiningService } = await import("@/services/storyMining");
    const { seeds, promptText } = req.body;
    if (!seeds || !Array.isArray(seeds) || seeds.length === 0 || !promptText) {
      return res.status(400).json({ success: false, error: 'Missing required fields: seeds (non-empty array), promptText' });
    }
    const result = await storyMiningService.rankForPrompt(seeds, promptText);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Seed ranking failed';
    console.error('[story-mining/rank] error:', error);
    res.status(500).json({ success: false, error: message });
  }
});

// ============================================================================
// RAG Debug API
// ============================================================================
r.get("/api/rag/stats", requireAuth, async (_req, res) => {
  try {
    const { supabaseAdmin } = await import("@/supabase/admin");
    const [fragmentsResult, transformationsResult] = await Promise.all([
      supabaseAdmin.from('rag_essay_fragments').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('rag_transformations').select('id', { count: 'exact', head: true }),
    ]);
    res.json({
      success: true,
      data: {
        fragmentCount: fragmentsResult.count ?? 0,
        transformationCount: transformationsResult.count ?? 0,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'RAG stats failed';
    console.error('[rag/stats] error:', error);
    res.status(500).json({ success: false, error: message });
  }
});

r.post("/api/rag/search", requireAuth, async (req, res) => {
  try {
    const { ragService } = await import("@/services/rag");
    const { query, options } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Missing required field: query' });
    }
    const results = await ragService.retrieveExamples(query, options || {});
    res.json({ success: true, data: results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'RAG search failed';
    console.error('[rag/search] error:', error);
    res.status(500).json({ success: false, error: message });
  }
});

// ============================================================================
// Writing Analytics API
// ============================================================================

// Track analytics events (suggestion shown/accepted/rejected, edits, score changes)
r.post("/api/analytics/track", requireAuth, async (req, res) => {
  try {
    const { writingAnalyticsService } = await import("@/services/analytics");
    const { sessionId, eventType, eventData } = req.body;
    if (!sessionId || !eventType) {
      return res.status(400).json({ success: false, error: 'Missing required fields: sessionId, eventType' });
    }

    const userId = req.auth.userId;

    switch (eventType) {
      case 'suggestion_shown':
        await writingAnalyticsService.trackSuggestionShown(userId, sessionId, eventData || {});
        break;
      case 'suggestion_accepted':
        await writingAnalyticsService.trackSuggestionAccepted(userId, sessionId, eventData?.suggestionId, eventData?.workshop);
        break;
      case 'suggestion_rejected':
        await writingAnalyticsService.trackSuggestionRejected(userId, sessionId, eventData?.suggestionId, eventData?.workshop);
        break;
      case 'inline_edit':
        await writingAnalyticsService.trackInlineEdit(userId, sessionId, eventData || {});
        break;
      case 'score_change':
        await writingAnalyticsService.trackScoreChange(userId, sessionId, eventData || {});
        break;
      case 'command_used':
        await writingAnalyticsService.trackCommandUsed(userId, sessionId, eventData?.command, eventData);
        break;
      default:
        return res.status(400).json({ success: false, error: `Unknown event type: ${eventType}` });
    }

    res.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Analytics tracking failed';
    console.error('[analytics/track] error:', error);
    res.status(500).json({ success: false, error: message });
  }
});

// Get suggestion acceptance rate
r.get("/api/analytics/acceptance-rate", requireAuth, async (req, res) => {
  try {
    const { writingAnalyticsService } = await import("@/services/analytics");
    const workshop = req.query.workshop as string | undefined;
    const result = await writingAnalyticsService.getAcceptanceRate(workshop);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get acceptance rate';
    console.error('[analytics/acceptance-rate] error:', error);
    res.status(500).json({ success: false, error: message });
  }
});

// Get most-used inline editing commands
r.get("/api/analytics/commands", requireAuth, async (req, res) => {
  try {
    const { writingAnalyticsService } = await import("@/services/analytics");
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await writingAnalyticsService.getMostUsedCommands(undefined, limit);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get command usage';
    console.error('[analytics/commands] error:', error);
    res.status(500).json({ success: false, error: message });
  }
});

// Get average score improvement
r.get("/api/analytics/score-improvement", requireAuth, async (req, res) => {
  try {
    const { writingAnalyticsService } = await import("@/services/analytics");
    const workshop = req.query.workshop as string | undefined;
    const result = await writingAnalyticsService.getAverageScoreImprovement(workshop);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get score improvement';
    console.error('[analytics/score-improvement] error:', error);
    res.status(500).json({ success: false, error: message });
  }
});

// Get user analytics summary
r.get("/api/analytics/summary", requireAuth, async (req, res) => {
  try {
    const { writingAnalyticsService } = await import("@/services/analytics");
    const result = await writingAnalyticsService.getUserSummary(req.auth.userId);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get analytics summary';
    console.error('[analytics/summary] error:', error);
    res.status(500).json({ success: false, error: message });
  }
});

// Compare two essay versions
r.post("/api/analytics/compare-versions", requireAuth, async (req, res) => {
  try {
    const { versionComparisonService } = await import("@/services/analytics");
    const { oldVersion, newVersion, edits } = req.body;
    if (!oldVersion || !newVersion) {
      return res.status(400).json({ success: false, error: 'Missing required fields: oldVersion, newVersion' });
    }
    const comparison = versionComparisonService.compareVersions(oldVersion, newVersion, edits);
    const summary = versionComparisonService.summarize(comparison);
    res.json({ success: true, data: { ...comparison, summary } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Version comparison failed';
    console.error('[analytics/compare-versions] error:', error);
    res.status(500).json({ success: false, error: message });
  }
});

// Simple health check for dev tooling and frontends
r.get('/health', (_req, res) => {
  const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.length > 10);
  return res.json({
    ok: true,
    service: 'analysis-api',
    time: new Date().toISOString(),
    anthropic_key_present: hasAnthropicKey
  });
});

export default r;

