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
import { parseClaudeJSON } from '../../../../../../commonAppWorkshop/utils/jsonParser';
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
  const systemPrompt = `You MUST output valid JSON only — no markdown, no headers, no explanation text outside the JSON object.

You are writing an executive summary for a HIGH SCHOOL STUDENT's academic report. Write 5 concise bullets they can read INDEPENDENTLY of the full report. Each bullet must be self-contained and written in plain language.

RULES:
1. SYNTHESIZE across sections — do NOT copy phrases from the input.
2. Each bullet: HARD LIMIT 40 words. Punchy over thorough — the full report has details.
3. STUDENT-FRIENDLY: No raw percentages, metrics, or jargon. Use school names to anchor positioning. Write like you're talking to a smart 17-year-old.
4. The "rating" bullet states the Uplift grade and school tier in plain language.
5. The "positioning" bullet names 2-3 example schools and what it takes to level up.
6. The "biggestStrength" bullet names the strength and what it means for their goals.
7. The "biggestRisk" bullet names the risk and what happens if they don't address it.
8. The "topAction" bullet names the #1 action and why it matters most.

Output valid JSON:
{
  "rating": "[grade] — [what this means in plain language, mentioning school tier].",
  "positioning": "[2-3 school examples]. To level up: [specific action, max 12 words].",
  "biggestStrength": "[strength]: [what it means for their goals — max 20 words].",
  "biggestRisk": "[risk]: [what happens if not addressed — max 20 words].",
  "topAction": "#1: [action] — [why it matters — max 15 words]."
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
