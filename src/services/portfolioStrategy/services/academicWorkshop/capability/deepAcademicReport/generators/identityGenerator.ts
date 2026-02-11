/**
 * Identity Generator — Section 1: Academic Identity
 *
 * Generates the academic identity section of the deep academic report.
 * Ported from monolith's generateAcademicIdentity() with prompt improvements:
 * - A3: Weakness brevity constraints
 * - A5: Metric explanation requirements
 * - A6: Speculative claims disclaimer
 * - H1: Full ProfileInsights with interpretation + implication
 * - D1: Genuine interest markers from major research
 * - D2: Major competitiveness disclaimer
 */

import { callClaude } from '@/lib/llm/claude';
import { parseClaudeJSON } from '../../../../../commonAppWorkshop/utils/jsonParser';
import type { EnrichedReportContext } from '../types';
import type { AcademicIdentitySection } from '../types';
import { UPLIFT_SCALE_DATABASE } from '../types';
import {
  COLLEGE_TIER_BENCHMARKS,
  formatSubject,
} from '../context/tierCalibration';

// ============================================================================
// CONSTANTS
// ============================================================================

const MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS_PER_SECTION = 4096;

// ============================================================================
// GENERATOR
// ============================================================================

export async function generateAcademicIdentity(
  ctx: EnrichedReportContext,
  trackUsage: (usage: { input_tokens?: number; output_tokens?: number } | undefined) => void
): Promise<AcademicIdentitySection> {
  const quant = ctx.quantitativeAnalysis;
  const overallGPA = ctx.overallGPA;
  const synthesis = ctx.forIdentity.synthesis;
  const trajectory = quant.progressionTrajectory;
  const fingerprint = quant.performanceFingerprint;
  const tierPosition = ctx.tierPosition;

  const systemPrompt = `You are an expert college admissions consultant writing a concise academic identity analysis. Write in second person ("you"). Be specific with data and natural in voice.

CRITICAL RULES:
1. Only reference courses the student has ACTUALLY taken (listed in the COMPLETE COURSE LIST below). Do NOT claim they are "missing" a course they already have.
2. Every sentence must contain specific data, a concrete insight, or an actionable observation. Cut anything that doesn't teach the student something they can't see from their transcript alone.
3. When discussing GPA changes, ALWAYS frame them in terms of COLLEGE TIER IMPACT using the benchmarks provided. Say "this places you in Selective range (Boston U, Ohio State)" instead of just "3.66 GPA."
4. When using metrics like "consistency score," "strength signal," or "percentile," ALWAYS explain what the number measures and provide a benchmark. Example: "Your 73% consistency score (above the 60% threshold for 'predictable performer') means..." Do NOT drop raw numbers without context.
5. The "strengthTier" and "weaknessTier" in the tier position are ILLUSTRATIVE to show the spread in your profile — NOT predictions. Frame them as "if your entire transcript matched your CS performance" rather than "your CS GPA places you at Harvard."

WHAT TO WRITE:
- "narrativeIdentity": A tight 1-2 paragraph portrait of who they are academically. Paragraph 1: their position (tier, GPA, major alignment) and what makes their profile distinctive. Paragraph 2: Their trajectory and what it means WITHIN their current tier. Are they climbing toward the top of their tier, plateauing in the middle, or at risk of dropping? A 0.10 GPA improvement within a tier is significant even if it doesn't cross a boundary — frame it positively. Conversely, a 0.02 decline that crosses a boundary does NOT mean their world is ending. // Q4: Fix Trajectory Framing Weave in the trajectory insight naturally; do NOT save it for a separate field. Do NOT preview challenges or roadmap recommendations here — those sections handle that.
- "notableStrengths": 2-3 NON-OBVIOUS insights about their top strengths. Don't restate "you're good at Math." Explain what their performance SIGNALS — the hidden meaning admissions officers read from the data pattern. Each has: what it is, what it signals (1-2 sentences), and why it matters for their path (1 sentence).
- "notableWeaknesses": 1-2 brief gap previews. The Challenges section covers these in depth, so keep each to 1 sentence for the gap and 1 sentence for the consequence. Do NOT analyze root causes or recommend fixes here.
- "tierPosition": Maps their GPA to concrete school tiers. Use the COLLEGE TIER BENCHMARKS and PRE-CALCULATED data provided.
- "upliftRating": A HOLISTIC letter grade (A+ through F) considering rigor, major alignment, trends, difficulty sensitivity, school context — not just GPA. The explanation should capture what defines THIS student's profile (their trajectory, their defining academic pattern) and what it means for school fit. 3-4 sentences.

Approximate weighting guidance: // Q2: Add Uplift Grade Weighting Rubric
- GPA baseline: 40% (raw numbers matter, but are insufficient alone)
- Course rigor: 25% (a 3.7 in all-AP is fundamentally different from 3.7 in regular)
- Major alignment: 15% (courses relevant to intended major weighted more heavily)
- Trajectory: 10% (improving trend can add half a grade; declining subtracts)
- School context: 10% (under-resourced school with 5 APs available vs. elite prep with 30)
A 3.7 all-AP student should be at LEAST a half-grade higher than a 3.7 regular-classes student.

SCOPE BOUNDARIES — do NOT cross these:
- Do NOT analyze specific challenges (Chemistry drop, Physics struggles) — Section 2 does that.
- Do NOT recommend courses or actions — Section 3 does that.
- Do NOT repeat the same data point more than once across all fields.

Output valid JSON:
{
  "narrativeIdentity": "1-2 tight paragraphs. No challenge deep-dives. No course recommendations.",
  "notableStrengths": [
    {
      "subject": "Subject or pattern name",
      "insight": "What this signals — the hidden meaning. 1-2 sentences.",
      "majorRelevance": "The hidden MECHANISM — what this strength actually signals for their path. NOT 'this is relevant to CS.' Instead: 'Your consistent 3.9+ in proof-based math signals abstract reasoning ability — the skill that separates students who thrive in theoretical CS from those who struggle after sophomore year.' Show the WHY behind the connection." // Q3: Fix Notable Strengths majorRelevance
    }
  ],
  "notableWeaknesses": [
    {
      "area": "Subject or pattern name",
      "gap": "MAX 25 WORDS. The gap with tier context. Do NOT mention specific schools or courses — Section 2 covers those.",
      "consequence": "MAX 20 WORDS. Why it matters for their path. Do NOT mention specific schools or courses."
    }
  ],
  "tierPosition": {
    "currentTier": "e.g. Selective (Top 30-80)",
    "tierExamples": ["School 1", "School 2", "School 3"],
    "gpaPosition": "Where their GPA sits in this tier — 1 sentence",
    "strengthTier": "ILLUSTRATIVE ONLY — must be prefixed with 'If your entire transcript matched your [subject] performance, you would be in [tier].' NEVER write '[subject] GPA places you at [school]' — that is factually misleading. A single-subject GPA does not determine admissions.", // Q1: Strengthen tier illustration disclaimer
    "weaknessTier": "Same rule — illustrative spread indicator, not a prediction.", // Q1: Strengthen tier illustration disclaimer
    "tierGap": "What it takes to reach next tier — specific GPA target and what that means practically"
  },
  "upliftRating": {
    "grade": "<A+|A|A-|B+|B|B-|C+|C|C-|D+|D|D-|F>",
    "explanation": "What this grade means for THIS student: their defining pattern, trajectory meaning, and school fit. 3-4 sentences."
  }
}`;

  // Build Uplift Scale reference for the LLM
  const upliftScaleRef = UPLIFT_SCALE_DATABASE
    .filter(d => ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'].includes(d.grade))
    .map(d => `${d.grade} (${d.label}): ${d.description}`)
    .join('\n');

  // Build tier benchmarks reference
  const tierBenchmarksRef = COLLEGE_TIER_BENCHMARKS
    .map(t => `${t.name}: GPA ${t.gpaRange} (e.g. ${t.examples.slice(0, 3).join(', ')})`)
    .join('\n');

  const userPrompt = `Analyze this student's academic identity:

PROFILE SUMMARY: ${synthesis.profileSummary}
OVERALL GPA: ${overallGPA.toFixed(2)}
PERFORMANCE PERCENTILE: ${fingerprint.performancePercentile}th
SWEET SPOT: ${fingerprint.sweetSpot.level} level, ${fingerprint.sweetSpot.expectedGPA.toFixed(2)} expected GPA
CONSISTENCY: ${fingerprint.consistencyScore}%
DIFFICULTY SENSITIVITY: ${fingerprint.difficultySensitivity}
TRAJECTORY: ${trajectory.historical.overallTrend} (strength: ${trajectory.historical.trendStrength}%)

COLLEGE TIER BENCHMARKS (use these to frame ALL GPA discussions — say "this moves you from X tier to Y tier" instead of just stating GPA numbers):
${tierBenchmarksRef}

PRE-CALCULATED TIER POSITION:
- Current: ${tierPosition.currentTier} (${tierPosition.tierExamples.join(', ')})
- GPA Position: ${tierPosition.gpaPosition}
${tierPosition.strengthTier ? `- Strength Tier: ${tierPosition.strengthTier}` : ''}
${tierPosition.weaknessTier ? `- Weakness Tier: ${tierPosition.weaknessTier}` : ''}
- To Next Tier: ${tierPosition.tierGap}
${ctx.majorDisclaimer ? `\nMAJOR COMPETITIVENESS: ${ctx.majorDisclaimer}` : ''}

COMPLETE COURSE LIST (every course they have actually taken — do NOT claim they are missing any of these):
${Object.entries(quant.subjectPatterns)
  .sort((a, b) => b[1].relativeStrength - a[1].relativeStrength)
  .map(([subj, p]) => {
    const courses = p.performanceHistory.courses
      .map(c => `${c.name} (${c.level}): ${c.grade.toFixed(2)}`)
      .join(', ');
    return `${formatSubject(subj)} [${p.performanceHistory.avgGPA.toFixed(2)} avg, ${p.relativeStrength > 0 ? '+' : ''}${Math.round(p.relativeStrength * 100)}% relative, trend: ${p.performanceHistory.trend}]:
  ${courses}`;
  }).join('\n')}

CHALLENGE PATTERNS FROM SYNTHESIS:
${synthesis.challenges.map(c => `- ${c.insight}: ${c.evidence} → ${c.implication}`).join('\n')}

STRENGTH PATTERNS FROM SYNTHESIS:
${synthesis.strengths.map(s => `- ${s.insight}: ${s.evidence} → ${s.implication}`).join('\n')}

KEY INSIGHTS FROM ANALYSIS:
${ctx.forIdentity.profileInsightsFull.map(i =>
  `- ${i.observation}\n  Interpretation: ${i.interpretation}\n  Implication: ${i.strategicImplication}`
).join('\n')}

GENUINE INTEREST MARKERS FOR ${ctx.input.intendedMajor || 'their field'}:
${ctx.forIdentity.genuineInterestMarkers.length > 0
  ? ctx.forIdentity.genuineInterestMarkers.map(m => `- ${m}`).join('\n')
  : 'No major-specific markers available.'}

INTENDED MAJOR: ${ctx.input.intendedMajor || 'Undecided'}
GRADE: ${ctx.input.currentGrade}
SCHOOL TYPE: ${ctx.input.schoolContext.type.replace(/_/g, ' ')}
PERFORMANCE ENVELOPE: Floor ${quant.performanceEnvelope.floor.gpa.toFixed(2)}, Ceiling ${quant.performanceEnvelope.ceiling.gpa.toFixed(2)}, Typical ${quant.performanceEnvelope.comfortableRange.typicalGPA.toFixed(2)}
DIFFICULTY IMPACT: Typical ${quant.challengeResponse.transitionAnalysis.typicalImpact.toFixed(2)} GPA drop when increasing level

UPLIFT SCALE REFERENCE (assign holistically, considering ALL factors — rigor, major alignment, trends, sensitivity — not just GPA):
${upliftScaleRef}`;

  const response = await callClaude<string>({
    model: MODEL,
    systemPrompt,
    userPrompt,
    maxTokens: MAX_TOKENS_PER_SECTION,
    temperature: 0.3,
  });

  trackUsage(response.usage);
  return parseClaudeJSON<AcademicIdentitySection>(response.content, 'academicIdentity');
}
