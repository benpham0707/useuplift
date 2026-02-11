/**
 * Challenges Generator — Section 2: Challenges & Admissions Reality
 *
 * Generates the challenges section of the deep academic report.
 * Ported from monolith's generateChallengesAndReality() with prompt improvements:
 * - A1: Stronger AP/GPA conflation guard
 * - A2: Major-relevance filter for challenge prioritization
 * - A7: Stat deduplication rule
 * - D1: Common mistakes from admissions research
 * - D2: Major competitiveness disclaimer in tier context
 */

import { callClaude } from '@/lib/llm/claude';
import { parseClaudeJSON } from '../../../../../../commonAppWorkshop/utils/jsonParser';
import type { EnrichedReportContext } from '../types';
import type { ChallengesAndRealitySection } from '../types';
// R20: Removed dead import of calculateTierPosition
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

export async function generateChallengesAndReality(
  ctx: EnrichedReportContext,
  trackUsage: (usage: { input_tokens?: number; output_tokens?: number } | undefined) => void
): Promise<ChallengesAndRealitySection> {
  const quant = ctx.quantitativeAnalysis;
  const overallGPA = ctx.overallGPA;
  const challenges = quant.synthesis.challenges;
  const tierPosition = ctx.tierPosition;

  // Identify challenge subjects (relative weakness areas)
  const challengeSubjects = Object.entries(quant.subjectPatterns)
    .filter(([_, p]) => p.relativeStrength < -0.05)
    .sort((a, b) => a[1].relativeStrength - b[1].relativeStrength)
    .slice(0, 3);

  const challengePatterns = challenges.slice(0, 3);
  const redFlags = ctx.planningAdvice.redFlags || [];
  const courseRecs = ctx.forChallenges.courseRecommendations || [];
  const relevantStats = ctx.forChallenges.verifiedStats.slice(0, 6);

  // Build tier benchmarks reference
  const tierBenchmarksRef = COLLEGE_TIER_BENCHMARKS
    .map(t => `${t.name}: GPA ${t.gpaRange} (e.g. ${t.examples.slice(0, 3).join(', ')})`)
    .join('\n');

  const systemPrompt = `You MUST output valid JSON only — no markdown, no headers, no explanation text outside the JSON object.

You are a former admissions officer writing about academic challenges for a HIGH SCHOOL STUDENT. Write in second person ("you"). Be honest but approachable — not clinical.

CRITICAL RULES:
1. Only reference courses the student has ACTUALLY taken (listed below).
2. STUDENT-FRIENDLY LANGUAGE: Write for a high schooler, not a data scientist.
   - Use actual GPAs and grades (students understand 3.30, B+, etc.)
   - Use school names to anchor tier discussions ("this keeps you at Boston University level instead of UCLA level")
   - AVOID raw statistical jargon: no "0.70 GPA spread", "38% risk level", "-0.37 typical impact"
   - INSTEAD use plain English: "a full letter grade difference", "there's a real gap between your best and weakest subjects"
3. Do NOT assume the student's thoughts. State the issue and the AO reality directly.
4. When discussing positioning impact, use school names: "this keeps you in the range of schools like Boston University instead of moving up to UCLA's level."
5. Do NOT give root cause analysis or study advice — that happens later.
6. Each statistic from VERIFIED STATISTICS may be cited in AT MOST ONE challenge.

DATA ACCURACY — HARD RULES (violations make the report factually incorrect):
- AP pass rates measure AP EXAM performance (scores 1-5, where 3+ = passing). Class GPA is on a 4.0 scale. These are COMPLETELY UNRELATED metrics.
- NEVER write a sentence that puts an AP exam pass rate and a student's class GPA in the same paragraph or logical chain. Example of what NOT to do: "62% of AP Statistics test-takers score 3+ on the exam, yet you earned a 3.30 in the class." This sentence is MEANINGLESS — a 3.30 class GPA and a score of 3+ on the AP exam are not comparable.
- When citing AP statistics, ONLY use them to characterize course difficulty (e.g., "AP Physics C has a 76% exam pass rate, indicating it's accessible for prepared students") — NOT to evaluate a student's class grade.
- Only cite statistics from the VERIFIED STATISTICS section provided. Do not invent or extrapolate.

SCOPE — this section OWNS these analyses:
- Detailed challenge breakdowns (specific courses, grade drops, patterns)
- AO interpretation of each challenge
- Tier impact of each challenge (with school names)
- The unintended narrative and how to fix it
DO NOT duplicate:
- Overall tier positioning (Section 1 owns that)
- Course recommendations (Section 3 owns that — just briefly point to it)
- General strengths or identity framing (Section 1 owns that)
- Reference Section 1's established identity: "As your identity profile shows, you're a [tier] student with..." — do NOT re-explain their tier, GPA, or consistency score.
- When pointing to the roadmap, be SPECIFIC: "Your Strategic Roadmap addresses this with [action name]" — do NOT say generic things like "Your roadmap recommends continuing at AP level."
- Each challenge should cite data that was NOT already featured in Section 1's narrative or strengths. If Section 1 highlighted the CS/Math convergence, the challenges should focus on the OTHER side of that data.

Focus on 2-3 DISTINCT challenges. PRIORITIZE challenges that matter most for the student's intended major (${ctx.input.intendedMajor || 'Undecided'}). For a CS applicant, focus on STEM readiness, CS progression depth, and math/science foundation — not Social Studies. Only include non-major-relevant challenges if they represent a truly alarming systemic pattern (e.g., failing across multiple areas). Each challenge must cover a genuinely different concern.

Output valid JSON:
{
  "firstGlance": "2-3 sentences: What an AO NOTICES in the first 30 seconds scanning this transcript — focus on what jumps off the page VISUALLY (GPA trend direction, rigor level, grade drops, missing expected courses, unusual course sequence). Be unflinching. Example: 'First thing: a 3.30 overall with only 2 APs by junior year. For a CS applicant to selective schools, this is below the curve.' Do NOT write about character, work ethic, or potential — AOs cannot see those from a transcript.", // Q5: Strengthen firstGlance prompt
  "challenges": [
    {
      "title": "Challenge name (short, distinct from other challenges)",
      "issue": "What the issue is — factual, data-specific. 2-3 sentences.",
      "aoImpact": "How AOs specifically interpret this — what it signals about college readiness. 2-3 sentences.",
      "tierImpact": "How this shifts their school positioning — MUST show FROM→TO movement with specific school names. Example: 'This drops you from the Highly Selective range (UCLA, Georgetown) to mid-Selective range (Boston U, Purdue).' NEVER just say 'This affects your positioning at X level' — always show the directional shift. 1-2 sentences.", // Q6: Add tierImpact FROM→TO requirement
      "roadmapConnection": "Name the SPECIFIC roadmap action: 'See Priority [N]: [title]' or 'The Strategic Roadmap recommends [specific course/action].' Do NOT write generic pointers like 'Your roadmap addresses this.' If you don't know the exact priority number, name the specific action: 'The roadmap recommends AP Physics C: E&M to address this.'",
      "researchBacking": [
        { "claim": "Specific claim", "value": "Data point", "source": "Verified source" }
      ]
    }
  ],
  "unintendedNarrative": "2-3 sentences: The accidental story this transcript tells. Be direct.",
  "narrativeControlStrategy": "2-3 sentences: How to reshape the story. Actionable and specific."
}

CRITICAL: Every challenge MUST have at least 1 entry in the researchBacking array using data from VERIFIED STATISTICS. Do NOT only weave statistics into issue/aoImpact text — you MUST ALSO populate the structured researchBacking array so the frontend can render citations separately.`;

  // Build complete course list for grounding
  const allCoursesList = Object.entries(quant.subjectPatterns)
    .map(([subj, p]) => {
      const courses = p.performanceHistory.courses
        .map(c => `${c.name} (${c.level}): ${c.grade.toFixed(2)}`)
        .join(', ');
      return `${formatSubject(subj)}: ${courses}`;
    }).join('\n');

  const userPrompt = `Analyze challenges and admissions reality for this student:

COLLEGE TIER BENCHMARKS (use these to frame ALL GPA discussions):
${tierBenchmarksRef}

STUDENT'S CURRENT TIER: ${tierPosition.currentTier} (${tierPosition.tierExamples.join(', ')})
${tierPosition.strengthTier ? `STRENGTH TIER: ${tierPosition.strengthTier}` : ''}
${tierPosition.weaknessTier ? `WEAKNESS TIER: ${tierPosition.weaknessTier}` : ''}
${ctx.majorDisclaimer ? `\nMAJOR COMPETITIVENESS: ${ctx.majorDisclaimer}` : ''}

OVERALL GPA: ${overallGPA.toFixed(2)}
SCHOOL TYPE: ${ctx.input.schoolContext.type.replace(/_/g, ' ')}
INTENDED MAJOR: ${ctx.input.intendedMajor || 'Undecided'}

COMPLETE COURSE LIST (courses they have ACTUALLY taken — do NOT claim they are missing any of these):
${allCoursesList}

CHALLENGE SUBJECTS (weaker areas):
${challengeSubjects.map(([subj, p]) => {
  const courses = p.performanceHistory.courses.map(c => `${c.name} (${c.level}): ${c.grade.toFixed(1)}`).join(', ');
  return `- ${formatSubject(subj)}: ${p.performanceHistory.avgGPA.toFixed(2)} avg GPA (weaker than their other subjects), trend: ${p.performanceHistory.trend}
    Courses: ${courses}`;
}).join('\n\n')}

CHALLENGE PATTERNS:
${challengePatterns.map(c => `- ${c.insight}: ${c.evidence} → ${c.implication}`).join('\n')}

RED FLAGS:
${redFlags.map(r => `- [${r.severity}] ${r.description}`).join('\n')}

HOW THEY HANDLE CHALLENGE:
- When they move from Honors to AP, grades typically drop about ${Math.abs(quant.challengeResponse.transitionAnalysis.typicalImpact).toFixed(1)} points
- Their grades are ${quant.performanceFingerprint.consistencyScore >= 70 ? 'reliably consistent' : quant.performanceFingerprint.consistencyScore >= 50 ? 'moderately consistent' : 'somewhat inconsistent'} across courses

TRAJECTORY:
GPA by year: ${quant.progressionTrajectory.historical.gpaByYear.map(y => `${y.year}: ${y.gpa.toFixed(2)}`).join(' → ')}

ROADMAP CONTEXT (when pointing to roadmap actions, align with these recommendations — do NOT recommend different courses than what the roadmap will suggest):
${courseRecs.map(r => `- ${formatSubject(r.subject)}: ${r.recommendedLevel}${r.specificCourse ? ` (${r.specificCourse})` : ''} — ${r.rationale}`).join('\n')}

COLLEGE EXPECTATIONS:
${ctx.assembledResearch.collegeExpectations ? `Tier: ${ctx.assembledResearch.collegeExpectations.tier}, GPA range: ${ctx.assembledResearch.collegeExpectations.gpaRange}, AP range: ${ctx.assembledResearch.collegeExpectations.apCourseRange}` : 'Not specified'}

COMMON MISTAKES FOR ${ctx.input.intendedMajor || 'applicants'} (from admissions research):
${ctx.forChallenges.commonMistakes.length > 0
  ? ctx.forChallenges.commonMistakes.map(m =>
      `- MISTAKE: ${m.mistake}\n  WHY IT HURTS: ${m.whyItHurts}\n  HOW TO FIX: ${m.howToFix}`
    ).join('\n')
  : 'No major-specific common mistakes available.'}

═══════════════════════════════════════════════════════════════
THE FOLLOWING SECTION CONTAINS AP EXAM STATISTICS — COMPLETELY SEPARATE METRICS FROM THE STUDENT'S CLASS GRADES ABOVE.
AP exam scores (1-5) ≠ class GPA (4.0 scale). NEVER compare them in the same sentence.
═══════════════════════════════════════════════════════════════

VERIFIED STATISTICS (cite these, don't invent):
${relevantStats.map(s => `- ${s.claim}: ${s.value} (${s.citation})`).join('\n')}`;

  const response = await callClaude<string>({
    model: MODEL,
    systemPrompt,
    userPrompt,
    maxTokens: MAX_TOKENS_PER_SECTION,
    temperature: 0.3,
  });

  trackUsage(response.usage);
  return parseClaudeJSON<ChallengesAndRealitySection>(response.content, 'challengesAndReality');
}
