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
import { parseClaudeJSON } from '../../../../../../commonAppWorkshop/utils/jsonParser';
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

  const systemPrompt = `You MUST output valid JSON only — no markdown, no headers, no explanation text outside the JSON object.

You are an expert college admissions consultant writing a detailed academic identity analysis for a HIGH SCHOOL STUDENT. Write in second person ("you"). Be specific with data, direct, and encouraging.

CRITICAL RULES:
1. Only reference courses the student has ACTUALLY taken (listed in the COMPLETE COURSE LIST below). Do NOT claim they are "missing" a course they already have.
2. BE DATA-RICH but INTUITIVE. These are high schoolers, so every metric needs context:
   - GPA values, GPA differences, GPA drops: USE FREELY. Students understand "your GPA dropped 0.70 points from Chemistry Honors to AP Chemistry" or "you're 0.14 points from the next tier."
   - School names and tiers: USE FREELY to anchor abstract numbers. Say "this places you in Selective range (Boston University, UT Austin)" alongside GPA numbers.
   - GPA-by-year trajectories (3.60 → 3.58): USE FREELY with context about what changed.
   - AP exam pass rates: USE when contextualizing course difficulty.
   AVOID these specific metrics that don't mean anything to students without heavy explanation:
   - "X% above baseline" or "X% relative strength" — instead compare actual GPA values: "your CS average (3.90) is 0.24 points above your overall 3.66"
   - "X% consistency score" — instead say "your grades are reliably consistent" or describe the pattern
   - "Xth percentile" — instead say "stronger than most students at your level"
   - "rigor level 1.8 → 2.6" — instead say "you went from 2 AP courses to 5 AP courses" or "you took much harder courses"
3. The "strengthTier" and "weaknessTier" in the tier position are ILLUSTRATIVE — they show the spread in the student's profile, NOT predictions. Frame them as "if your entire transcript matched your CS performance" rather than "your CS GPA places you at Harvard."
4. When discussing GPA changes, ALWAYS frame them in terms of COLLEGE TIER IMPACT. Say "this places you in Selective range (Boston U, Ohio State)" alongside the GPA number.

WHAT TO WRITE:
- "narrativeIdentity": A DETAILED 2-3 paragraph portrait that combines academic identity, tier positioning, and what makes their profile unique. THIS IS THE CENTERPIECE — be thorough.
  * Paragraph 1: Their position — Uplift grade, tier, specific schools, GPA, and what makes their profile distinctive (the defining split, convergence, or pattern). Include where they sit WITHIN their tier (near the floor? middle? top?). Compare their strongest vs weakest subject GPAs with actual numbers.
  * Paragraph 2: Their trajectory and what it means for their tier. How has their GPA moved year-over-year? Did they increase rigor? What does the projected GPA mean for their positioning? Are they climbing toward the top of their tier, plateauing, or at risk? How far are they from the next tier — give the actual GPA gap and what it means practically (e.g., "you need mostly A's and A-'s"). For competitive majors, contextualize against typical admitted students at their tier.
  Do NOT preview challenges or recommend specific courses — those sections handle that.
  If ADMITTED STUDENT INSIGHT data is provided, briefly contextualize (1 sentence).
- "notableStrengths": 2-3 NON-OBVIOUS insights about their top strengths. Don't restate "you're good at Math." Explain what their performance SIGNALS — the hidden meaning admissions officers read from the data pattern. Each has: what it is, what it signals (1-2 sentences with specific data), and why it matters for their path — show the hidden MECHANISM (2-3 sentences explaining the WHY behind the connection, not just "this is relevant to CS").
- "notableWeaknesses": 1-2 IDENTITY GAPS — what's missing from their academic profile as admissions officers would perceive it. Frame as gaps in WHO THEY ARE academically (e.g., "missing STEM breadth identity", "incomplete major validation"), NOT as previews of specific grade challenges. Keep each to 1 sentence for the gap and 1 sentence for the consequence. Say "See the Challenges section for the full analysis."
- "tierPosition": Maps their GPA to concrete school tiers. Use the COLLEGE TIER BENCHMARKS and PRE-CALCULATED data provided. Include specific GPA distances and what they mean practically.
- "upliftRating": A HOLISTIC letter grade (A+ through F) considering rigor, major alignment, trends, difficulty sensitivity, school context — not just GPA. The explanation should be DETAILED (3-4 sentences): name the factors that ELEVATE them within their tier, the factors that CONSTRAIN or PREVENT a higher grade, and characterize the overall profile pattern (e.g., "high floor, constrained ceiling" or "strong peak, inconsistent base").

Approximate weighting guidance:
- GPA baseline: 40% (raw numbers matter, but are insufficient alone)
- Course rigor: 25% (a 3.7 in all-AP is fundamentally different from 3.7 in regular)
- Major alignment: 15% (courses relevant to intended major weighted more heavily)
- Trajectory: 10% (improving trend can add half a grade; declining subtracts)
- School context: 10% (under-resourced school with 5 APs vs. elite prep with 30)
A 3.7 all-AP student should be at LEAST a half-grade higher than a 3.7 regular-classes student.

SCOPE BOUNDARIES — do NOT cross these:
- Do NOT analyze specific challenges (Chemistry drop, Physics struggles) — Section 2 does that.
- Do NOT recommend courses or actions — Section 3 does that.
- Do NOT repeat the same data point more than once across all fields.
- When previewing a weakness, do NOT restate data that Section 2 will analyze in depth. Simply name the gap and its consequence. Say "See the Challenges section for the full analysis."
- Do NOT use the same data point (GPA value, grade) in both narrativeIdentity AND notableStrengths/notableWeaknesses. Each field should present DIFFERENT evidence.
- Reference Section 1's tier position and Uplift rating as part of the cohesive picture — do NOT save them for separate treatment. Weave them into the narrative naturally.

Output valid JSON:
{
  "narrativeIdentity": "2-3 detailed paragraphs. Data-rich with GPA values, tier names, school names. Every metric explained in context.",
  "notableStrengths": [
    {
      "subject": "Subject or pattern name",
      "insight": "What this signals — the hidden meaning. 1-2 sentences with specific data.",
      "majorRelevance": "The hidden MECHANISM — what this strength actually signals for their path. NOT 'this is relevant to CS.' Instead: 'Your consistent 3.9+ in CS signals abstract reasoning ability — the skill that separates students who thrive in theoretical CS from those who struggle after sophomore year.' Show the WHY behind the connection. 2-3 sentences."
    }
  ],
  "notableWeaknesses": [
    {
      "area": "Identity gap name (what's MISSING from their academic identity)",
      "gap": "MAX 25 WORDS. What this gap means for how AOs perceive their academic identity.",
      "consequence": "MAX 20 WORDS. How this identity gap affects their positioning. Section 2 covers the details."
    }
  ],
  "tierPosition": {
    "currentTier": "Tier name (e.g. Selective)",
    "tierExamples": ["School 1", "School 2", "School 3", "School 4"],
    "gpaPosition": "Where their GPA sits within this tier — include distance from floor/ceiling. 1-2 sentences.",
    "strengthTier": "ILLUSTRATIVE ONLY — must start with 'If your entire transcript matched your [subject] performance ([GPA]), you would be in [tier] range ([GPA range]) — schools like [examples].' Show the GPA gap between their peak capability and current overall.",
    "weaknessTier": "Same illustrative format — show how their weakest subject pulls their profile down and the GPA gap it creates.",
    "tierGap": "What it takes to reach next tier — specific GPA target, how far away they are, and what that means practically (e.g., 'you need mostly A's and A-'s in your remaining courses'). For competitive majors, note the CS/Engineering-specific threshold if applicable."
  },
  "upliftRating": {
    "grade": "<A+|A|A-|B+|B|B-|C+|C|C-|D+|D|D-|F>",
    "explanation": "DETAILED 3-4 sentences. Name the factors that ELEVATE them (e.g., rigor absorption, capability cluster, consistency). Name the factors that PREVENT a higher grade (e.g., science gap, thin CS depth, position within tier). Characterize the overall profile. End with trajectory outlook."
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

  // Translate raw metrics into student-friendly descriptors
  const consistencyDesc = fingerprint.consistencyScore >= 70 ? 'highly consistent — admissions officers can trust your grades as reliable signals'
    : fingerprint.consistencyScore >= 50 ? 'moderately consistent — your grades are fairly predictable'
    : 'somewhat inconsistent — your grades vary quite a bit between courses';

  const sensitivityDesc = fingerprint.difficultySensitivity === 'low' ? 'You handle harder courses well — your grades stay strong when the difficulty increases'
    : fingerprint.difficultySensitivity === 'moderate' ? 'Your grades dip somewhat in harder courses, which is normal'
    : 'You tend to struggle more when courses get significantly harder';

  const strengthDesc = (strength: number): string => {
    if (strength >= 0.30) return 'significantly stronger than your other subjects';
    if (strength >= 0.15) return 'noticeably stronger than average for you';
    if (strength >= -0.10) return 'right around your typical performance';
    if (strength >= -0.25) return 'somewhat weaker than your other subjects';
    return 'noticeably weaker than your other subjects';
  };

  // Build GPA trajectory in plain language
  const gpaYears = trajectory.historical.gpaByYear;
  let trajectoryDesc = '';
  if (gpaYears.length >= 2) {
    const first = gpaYears[0];
    const last = gpaYears[gpaYears.length - 1];
    const diff = last.gpa - first.gpa;
    const rigorChange = last.rigorLevel - first.rigorLevel;
    if (Math.abs(diff) <= 0.05 && rigorChange > 0.5) {
      trajectoryDesc = `Your GPA barely changed (${first.gpa.toFixed(2)} → ${last.gpa.toFixed(2)}) despite taking much harder courses — this shows you can handle more challenge without your grades suffering.`;
    } else if (diff > 0.10) {
      trajectoryDesc = `Your GPA improved from ${first.gpa.toFixed(2)} to ${last.gpa.toFixed(2)} — an upward trend that admissions officers love to see.`;
    } else if (diff < -0.10) {
      trajectoryDesc = `Your GPA dropped from ${first.gpa.toFixed(2)} to ${last.gpa.toFixed(2)} — understanding why will help you plan your senior year strategically.`;
    } else {
      trajectoryDesc = `Your GPA has held steady around ${last.gpa.toFixed(2)}.`;
    }
  }

  // Build performance envelope summary
  const envelope = quant.performanceEnvelope;
  const envelopeDesc = `Ceiling: ${envelope.ceiling.gpa.toFixed(2)} GPA (${envelope.ceiling.conditions}). Floor: ${envelope.floor.gpa.toFixed(2)} GPA (${envelope.floor.conditions}). Typical range: ${envelope.comfortableRange.low.toFixed(2)}-${envelope.comfortableRange.high.toFixed(2)} (${envelope.comfortableRange.description}). Optimal target: ${envelope.optimalTarget.gpa.toFixed(2)} (${envelope.optimalTarget.reasoning}).`;

  // Build difficulty transition impact
  const transitions = quant.challengeResponse.transitionAnalysis;
  const transitionDesc = transitions.observedTransitions.length > 0
    ? transitions.observedTransitions.map(t =>
        `${t.subject}: ${t.from} (${t.gradeBefore.toFixed(2)}) → ${t.to} (${t.gradeAfter.toFixed(2)}) = ${(t.gradeAfter - t.gradeBefore).toFixed(2)} drop [${t.outcome}]`
      ).join('\n  ')
    : 'No level transitions observed.';

  const userPrompt = `Analyze this student's academic identity:

PROFILE SUMMARY: ${synthesis.profileSummary}
OVERALL GPA: ${overallGPA.toFixed(2)}
GRADE CONSISTENCY: ${consistencyDesc} (raw: ${fingerprint.consistencyScore}/100)
DIFFICULTY HANDLING: ${sensitivityDesc}
TRAJECTORY: ${trajectoryDesc}

PERFORMANCE ENVELOPE (what their grades look like at their best, worst, and typical):
${envelopeDesc}

DIFFICULTY TRANSITIONS (what happens when they move to harder courses — use these GPA drops):
  ${transitionDesc}
  Typical GPA impact when moving up: ${transitions.typicalImpact.toFixed(2)} points
  Adaptation pattern: ${transitions.adaptationSpeed} / ${transitions.recoveryPattern}

GPA BY YEAR (use ONLY these numbers — do NOT invent values):
${gpaYears.map(y => `${y.year}: ${y.gpa.toFixed(2)} GPA (rigor: ${y.rigorLevel.toFixed(1)} AP courses)`).join(' → ')}
${trajectory.projected ? `Projected next year: ${trajectory.projected.nextYearGPA.expected.toFixed(2)} (range: ${trajectory.projected.nextYearGPA.range.low.toFixed(2)}-${trajectory.projected.nextYearGPA.range.high.toFixed(2)}). Ceiling estimate: ${trajectory.projected.ceilingEstimate.toFixed(2)}.` : ''}

COLLEGE TIER BENCHMARKS (use school names to frame GPA discussions):
${tierBenchmarksRef}

PRE-CALCULATED TIER POSITION (copy these values into the tierPosition field):
- Current: ${tierPosition.currentTier} (${tierPosition.tierExamples.join(', ')})
- GPA Position: ${tierPosition.gpaPosition}
${tierPosition.strengthTier ? `- Strength Illustration: ${tierPosition.strengthTier}` : ''}
${tierPosition.weaknessTier ? `- Weakness Illustration: ${tierPosition.weaknessTier}` : ''}
- Path to Next Level: ${tierPosition.tierGap}
${ctx.majorDisclaimer ? `\nMAJOR COMPETITIVENESS NOTE: ${ctx.majorDisclaimer}` : ''}

COMPLETE COURSE LIST (every course they have taken — do NOT claim they are missing any):
${Object.entries(quant.subjectPatterns)
  .sort((a, b) => b[1].relativeStrength - a[1].relativeStrength)
  .map(([subj, p]) => {
    const delta = p.performanceHistory.avgGPA - overallGPA;
    const deltaStr = delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
    const courses = p.performanceHistory.courses
      .map(c => `${c.name} (${c.level}): ${c.grade.toFixed(2)}`)
      .join(', ');
    return `${formatSubject(subj)} [${p.performanceHistory.avgGPA.toFixed(2)} avg (${deltaStr} vs overall ${overallGPA.toFixed(2)}), ${strengthDesc(p.relativeStrength)}, best: ${p.performanceHistory.bestGrade.toFixed(2)}, worst: ${p.performanceHistory.worstGrade.toFixed(2)}, trend: ${p.performanceHistory.trend}]:
  ${courses}`;
  }).join('\n')}

CHALLENGE PATTERNS:
${synthesis.challenges.map(c => `- ${c.insight}: ${c.evidence} → ${c.implication}`).join('\n')}

STRENGTH PATTERNS:
${synthesis.strengths.map(s => `- ${s.insight}: ${s.evidence} → ${s.implication}`).join('\n')}

KEY INSIGHTS:
${ctx.forIdentity.profileInsightsFull.map(i =>
  `- ${i.observation}\n  Interpretation: ${i.interpretation}\n  Implication: ${i.strategicImplication}`
).join('\n')}

RISK PROFILE: Risk level ${quant.challengeResponse.challengeRiskProfile.riskLevel}/100
- Risk factors: ${quant.challengeResponse.challengeRiskProfile.riskFactors.join('; ')}
- Protective factors: ${quant.challengeResponse.challengeRiskProfile.protectiveFactors.join('; ')}

${ctx.forIdentity.calibratedRating !== undefined ? `CALIBRATED RATING: ${ctx.forIdentity.calibratedRating}/10` : ''}
${ctx.forIdentity.rigorAssessment ? `RIGOR: Level "${ctx.forIdentity.rigorAssessment.level}", using ${(ctx.forIdentity.rigorAssessment.maximization * 100).toFixed(0)}% of available rigor${ctx.forIdentity.rigorAssessment.missingCriticalCourses.length > 0 ? `. Missing key courses: ${ctx.forIdentity.rigorAssessment.missingCriticalCourses.join(', ')}` : ''}` : ''}
${ctx.forIdentity.admittedProfileKeyInsight ? `ADMITTED STUDENT CONTEXT: ${ctx.forIdentity.admittedProfileKeyInsight}` : ''}

GENUINE INTEREST MARKERS FOR ${ctx.input.intendedMajor || 'their field'}:
${ctx.forIdentity.genuineInterestMarkers.length > 0
  ? ctx.forIdentity.genuineInterestMarkers.map(m => `- ${m}`).join('\n')
  : 'No major-specific markers available.'}

INTENDED MAJOR: ${ctx.input.intendedMajor || 'Undecided'}
GRADE LEVEL: ${ctx.input.currentGrade}
SCHOOL TYPE: ${ctx.input.schoolContext.type.replace(/_/g, ' ')}

UPLIFT SCALE REFERENCE (assign holistically — rigor, major alignment, trends, not just GPA):
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
