/**
 * Bottom Line Generator — Executive Summary
 *
 * NEW: Haiku-powered synthesis that generates concise executive summary bullets.
 * Instead of extracting verbatim text from sections (which caused R1/R2 repetition),
 * this calls Haiku to write independent, self-contained bullets.
 *
 * Falls back to deterministic extraction if Haiku call fails.
 */

import { callClaude } from '@/lib/llm/claude';
import { parseClaudeJSON } from '../../../../../commonAppWorkshop/utils/jsonParser';
import type {
  BottomLineSummary,
  AcademicIdentitySection,
  ChallengesAndRealitySection,
  StrategicRoadmapSection,
} from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

// ============================================================================
// GENERATOR
// ============================================================================

export async function generateBottomLine(
  identity: AcademicIdentitySection,
  challenges: ChallengesAndRealitySection,
  roadmap: StrategicRoadmapSection,
  trackUsage: (usage: { input_tokens?: number; output_tokens?: number } | undefined) => void
): Promise<BottomLineSummary> {
  const systemPrompt = `You are writing an executive summary for a student's academic report. Write 5 concise bullets that a student can read INDEPENDENTLY of the full report. Each bullet must be self-contained.

RULES:
1. SYNTHESIZE across sections — do NOT copy phrases or sentences from the input.
2. Each bullet: MAX 50 words. Be punchy and specific.
3. The "rating" bullet states the grade and one sentence of what it means.
4. The "positioning" bullet names the tier and 2-3 example schools, plus what it takes to move up.
5. The "biggestStrength" bullet names the strength and what it signals in 1 sentence.
6. The "biggestRisk" bullet names the risk and its consequence in 1 sentence.
7. The "topAction" bullet names the #1 action and why it's #1.

Output valid JSON:
{
  "rating": "Uplift Rating: [grade] — [label]. Names the corresponding tier and states the ONE thing that would change the grade. Example: 'B+ (Very Good) — Selective tier. Moving to A- requires stronger AP STEM performance, where you currently average 3.2.' NEVER just restate the grade description.", // Q12: Make rating bullet actionable
  "positioning": "[tier] ([2-3 schools]). [what it takes to reach next tier — max 15 words].",
  "biggestStrength": "[strength]: [what it signals — max 20 words].",
  "biggestRisk": "[risk]: [consequence — max 20 words].",
  "topAction": "#1: [action] — [why — max 15 words]."
}`;

  const userPrompt = `Synthesize this academic report into 5 executive summary bullets:

UPLIFT RATING: ${identity.upliftRating.grade} — ${identity.upliftRating.explanation}

TIER: ${identity.tierPosition.currentTier}
TIER EXAMPLES: ${identity.tierPosition.tierExamples.join(', ')}
TIER GAP: ${identity.tierPosition.tierGap}

TOP STRENGTH: ${identity.notableStrengths[0]?.subject || 'None'} — ${identity.notableStrengths[0]?.insight || 'N/A'}

TOP CHALLENGE: ${challenges.challenges[0]?.title || 'None'} — ${challenges.challenges[0]?.tierImpact || 'N/A'}

TOP PRIORITY: ${roadmap.priorities[0]?.title || 'None'} — ${roadmap.priorities[0]?.description || 'N/A'}`;

  try {
    const response = await callClaude<string>({
      model: HAIKU_MODEL,
      systemPrompt,
      userPrompt,
      maxTokens: 512,
      temperature: 0.2,
    });

    trackUsage(response.usage);
    return parseClaudeJSON<BottomLineSummary>(response.content, 'bottomLine');
  } catch (error) {
    console.error('[BottomLineGenerator] Haiku call failed, using extraction fallback:', error);
    // Fallback to deterministic extraction (same as old buildBottomLine)
    return buildBottomLineFallback(identity, challenges, roadmap);
  }
}

// ============================================================================
// FALLBACK (deterministic extraction — no LLM)
// ============================================================================

function buildBottomLineFallback(
  identity: AcademicIdentitySection,
  challenges: ChallengesAndRealitySection,
  roadmap: StrategicRoadmapSection,
): BottomLineSummary {
  return {
    rating: `Uplift Rating: ${identity.upliftRating.grade}`,
    positioning: `${identity.tierPosition.currentTier} (${identity.tierPosition.tierExamples.slice(0, 3).join(', ')}).`,
    biggestStrength: identity.notableStrengths.length > 0
      ? `${identity.notableStrengths[0].subject}: ${identity.notableStrengths[0].insight.slice(0, 100)}`
      : 'No standout strength identified.',
    biggestRisk: challenges.challenges.length > 0
      ? `${challenges.challenges[0].title}: ${challenges.challenges[0].tierImpact.slice(0, 100)}`
      : 'No critical risks identified.',
    topAction: roadmap.priorities.length > 0
      ? `#1: ${roadmap.priorities[0].title}`
      : 'Continue current trajectory.',
  };
}
