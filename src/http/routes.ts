import { Router } from "express";
import { requireAuth } from "./middleware/auth";
import { completeAssessment } from "@/modules/assessment/complete";
import { completePersonal } from "@/modules/personal/complete";
import * as Exp from "@/modules/experiences/controller";
import { computePortfolioStrength, reconcilePortfolioStrength } from "@/modules/analytics/portfolio";

const r = Router();
r.post("/assessment/complete", requireAuth, completeAssessment);
r.post("/personal/complete", requireAuth, completePersonal);

// Experiences API
r.post("/experiences", requireAuth, Exp.create);
r.get("/experiences", requireAuth, Exp.list);
r.patch("/experiences/:id", requireAuth, Exp.update);

// Analytics API
r.get("/analytics/portfolio-strength", requireAuth, computePortfolioStrength);
r.post("/analytics/reconcile", requireAuth, reconcilePortfolioStrength);

// Extracurricular analysis (dev/prototype endpoint - no auth for now)
// Support both /analyze-entry (frontend) and /analyze/extracurricular (legacy)
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

    // Early env check for Anthropic keys to provide a clearer error than module load failure
    // Prioritize ANTHROPIC_API_KEY (has credits) over CLAUDE_CODE_KEY (no credits)
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_CODE_KEY;
    if (!apiKey) {
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

      return res.json({ success: true, result: { report, authenticity, coaching, performance: { total_ms: 1200 } }, engine: 'heuristic_fallback' });
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
      const msg = String(llmErr?.message || llmErr || '');
      const isApiIssue =
        msg.includes('credit balance') ||
        msg.includes('insufficient') ||
        msg.includes('invalid_request_error') ||
        msg.includes('authentication_error') ||
        msg.includes('invalid x-api-key') ||
        msg.includes('Claude API error: 400') ||
        msg.includes('Claude API error: 401');

      if (isApiIssue) {
        // STRICT HEURISTIC FALLBACK on credit error - matches our brutal scoring philosophy
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

        const report = {
          id: entryObj.id || undefined,
          rubric_version: '1.0.0',
          created_at: new Date().toISOString(),
          narrative_quality_index: Math.round(base * 10),
          reader_impression_label: base >= 7 ? 'solid_needs_polish' : base >= 4 ? 'needs_work' : 'weak',
          categories: [
            { name: 'voice_integrity', score_0_to_10: +(base).toFixed(1), evidence_snippets: [text.slice(0, 80)], evaluator_notes: 'Heuristic: Resume-style; needs authentic voice and sensory details.' },
            { name: 'specificity_evidence', score_0_to_10: +(Math.max(1, base - 0.5)).toFixed(1), evidence_snippets: [], evaluator_notes: 'Heuristic: Needs concrete metrics (who/when/how much).' },
            { name: 'reflection_meaning', score_0_to_10: +(Math.max(0, base - 1)).toFixed(1), evidence_snippets: [], evaluator_notes: 'Heuristic: Needs deeper reflection with transferable insights.' },
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
          flags: ['heuristic_scoring', 'credit_error', ...(wc < 100 ? ['too_short'] : []), ...(wc < 50 ? ['critically_short'] : [])],
          suggested_fixes_ranked: ['Add API credits to use sophisticated analysis', 'Add story elements (emotion, dialogue, reflection)', 'Add concrete numbers and outcomes'],
        };

        const authenticity = {
          authenticity_score: +(Math.max(3, Math.min(7, base)).toFixed(1)),
          voice_type: wc < 50 ? 'resume' : (hasStory || hasEmotion ? 'conversational' : 'factual'),
          red_flags: [...(wc < 80 ? ['too_short'] : []), ...(!hasReflection ? ['no_reflection'] : [])],
          green_flags: [...(hasStory ? ['story_elements'] : []), ...(hasEmotion ? ['emotional_depth'] : [])],
        };

        return res.json({ success: true, result: { report, authenticity, coaching: null, performance: { total_ms: 800 } }, engine: 'heuristic_fallback_credit_error' });
      }

      // Unknown failure: return 500
      return res.status(500).json({ message: 'Analysis failed', error: msg });
    }
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('Extracurricular analysis failed:', err?.message || err);
    return res.status(500).json({ message: 'Analysis failed', error: String(err?.message || err) });
  }
});

// Simple health check for dev tooling and frontends
r.get('/health', (_req, res) => {
  return res.json({ ok: true, service: 'analysis-api', time: new Date().toISOString() });
});

export default r;


