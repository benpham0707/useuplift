/**
 * Deep Academic Report Service
 *
 * Orchestrates existing analysis services and adds LLM-powered narrative depth
 * to produce a 5-section report with teaching-quality analysis.
 *
 * Architecture:
 * 1. Assembles all context from existing services (zero LLM, ~5ms):
 *    - extractProfileInsights() → deep qualitative insights
 *    - assembleResearchForStudent() → verified research data
 *    - generateAcademicPlanningAdvice() → course/workload/major advice
 *
 * 2. Generates 5 report sections (4 LLM calls + 1 template):
 *    - Academic Identity + Notable Strengths (LLM)
 *    - Challenge Analysis (LLM) — concise, roadmap-aligned
 *    - Admissions Officer Lens (LLM)
 *    - Strategic Roadmap (LLM)
 *    - Research Context (template only)
 *
 * 3. Falls back gracefully to template-only output when LLM unavailable
 *
 * Note: Root cause diagnosis and "why you struggled" analysis is NOT here —
 * that feeds into the conversational advisor for deeper profiling through dialogue.
 *
 * MODEL: Sonnet for all LLM calls (quality matters for teaching)
 * PATTERN: Follows stage2ConditionalTeachingService.ts
 */

import { callClaude, type ClaudeResponse } from '@/lib/llm/claude';
import { parseClaudeJSON } from '../../../../commonAppWorkshop/utils/jsonParser';

import type {
  NuancedCapabilityAnalysis,
  SubjectPattern,
  PerformanceEnvelope,
  CapabilitySynthesis,
} from './nuancedCapabilityAnalyzer';

import {
  extractProfileInsights,
  type ProfileInsight,
  type StudentProfile,
} from './conversational/insightDrivenAdvisor';

import {
  assembleResearchForStudent,
  type StudentContext,
  type AssembledResearch,
} from './conversational/unifiedResearchAssemblyService';

import {
  generateAcademicPlanningAdvice,
  type AcademicPlanningInput,
  type AcademicPlanningAdvice,
} from './conversational/academicPlanningAdvisor';

import {
  resolveStudentInterest,
  getTargetedContext,
} from './conversational/majorResolutionService';

import type {
  DeepAcademicReport,
  DeepAcademicReportInput,
  AssembledReportContext,
  AcademicIdentitySection,
  NotableStrength,
  NotableWeakness,
  CollegeTierPosition,
  UpliftRating,
  UpliftGrade,
  ChallengesAndRealitySection,
  ChallengeWithAOContext,
  StrategicRoadmapSection,
  ResearchContextSection,
  ReportMetadata,
  ResearchCitation,
  StrategicPriority,
  CourseStrategyItem,
  CourseAvoidItem,
} from './deepAcademicReportTypes';

import { UPLIFT_SCALE_DATABASE } from './deepAcademicReportTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS_PER_SECTION = 4096;

/**
 * Extract an array from a parsed JSON result that may be:
 * - A bare array: [...]
 * - An object wrapping an array: { "items": [...] } or { "strengths": [...] } etc.
 */
function extractArray<T>(parsed: unknown): T[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    // Find the first array property in the object
    for (const value of Object.values(parsed as Record<string, unknown>)) {
      if (Array.isArray(value)) return value;
    }
  }
  return [];
}

// ============================================================================
// HELPER: Calculate Overall GPA from Subject Patterns
// ============================================================================

function calculateOverallGPA(analysis: NuancedCapabilityAnalysis): number {
  const patterns = Object.values(analysis.subjectPatterns);
  if (patterns.length === 0) return 3.5;
  const total = patterns.reduce((sum, p) => sum + p.performanceHistory.avgGPA, 0);
  return total / patterns.length;
}

// ============================================================================
// HELPER: Format Subject Name
// ============================================================================

function formatSubject(subject: string): string {
  return subject
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ============================================================================
// HELPER: Map GPA to College Tier
// ============================================================================

interface TierInfo {
  name: string;
  examples: string[];
  gpaRange: string;
  median: number;
}

const COLLEGE_TIER_BENCHMARKS: TierInfo[] = [
  { name: 'Ivy/Elite (Top 5-10)', examples: ['Harvard', 'Stanford', 'MIT', 'Princeton', 'Yale'], gpaRange: '3.85-4.0', median: 3.95 },
  { name: 'Highly Selective (Top 10-30)', examples: ['Northwestern', 'UCLA', 'Georgetown', 'Carnegie Mellon', 'UC Berkeley'], gpaRange: '3.70-3.89', median: 3.85 },
  { name: 'Selective (Top 30-80)', examples: ['Boston University', 'Ohio State', 'UT Austin', 'Purdue', 'UMass Amherst'], gpaRange: '3.40-3.69', median: 3.65 },
  { name: 'Competitive', examples: ['Most state universities', 'Regional private colleges'], gpaRange: '3.00-3.39', median: 3.4 },
  { name: 'Accessible', examples: ['Community colleges', 'Open admission institutions'], gpaRange: '2.00-2.99', median: 2.8 },
];

function getTierForGPA(gpa: number): TierInfo {
  if (gpa >= 3.85) return COLLEGE_TIER_BENCHMARKS[0];
  if (gpa >= 3.70) return COLLEGE_TIER_BENCHMARKS[1];
  if (gpa >= 3.40) return COLLEGE_TIER_BENCHMARKS[2];
  if (gpa >= 3.00) return COLLEGE_TIER_BENCHMARKS[3];
  return COLLEGE_TIER_BENCHMARKS[4];
}

function calculateTierPosition(analysis: NuancedCapabilityAnalysis): CollegeTierPosition {
  const overallGPA = calculateOverallGPA(analysis);
  const currentTierInfo = getTierForGPA(overallGPA);

  // Find strongest and weakest subject GPAs
  const subjectGPAs = Object.entries(analysis.subjectPatterns)
    .map(([subj, p]) => ({ subject: formatSubject(subj), gpa: p.performanceHistory.avgGPA }))
    .sort((a, b) => b.gpa - a.gpa);

  const strongest = subjectGPAs[0];
  const weakest = subjectGPAs[subjectGPAs.length - 1];

  const strengthTierInfo = strongest ? getTierForGPA(strongest.gpa) : undefined;
  const weaknessTierInfo = weakest ? getTierForGPA(weakest.gpa) : undefined;

  // Calculate what GPA they'd need for the next tier up
  const currentTierIndex = COLLEGE_TIER_BENCHMARKS.indexOf(currentTierInfo);
  const nextTierUp = currentTierIndex > 0 ? COLLEGE_TIER_BENCHMARKS[currentTierIndex - 1] : null;

  return {
    currentTier: currentTierInfo.name,
    tierExamples: currentTierInfo.examples,
    gpaPosition: `Your ${overallGPA.toFixed(2)} GPA places you in ${currentTierInfo.name} range (${currentTierInfo.gpaRange})`,
    strengthTier: strongest && strengthTierInfo && strengthTierInfo !== currentTierInfo
      ? `Your ${strongest.subject} GPA (${strongest.gpa.toFixed(2)}) would place you in ${strengthTierInfo.name} range (${strengthTierInfo.examples.slice(0, 3).join(', ')})`
      : undefined,
    weaknessTier: weakest && weaknessTierInfo && weaknessTierInfo !== currentTierInfo
      ? `Your ${weakest.subject} GPA (${weakest.gpa.toFixed(2)}) pulls you toward ${weaknessTierInfo.name} range`
      : undefined,
    tierGap: nextTierUp
      ? `To reach ${nextTierUp.name}, you need ${parseFloat(nextTierUp.gpaRange.split('-')[0]).toFixed(2)}+ overall GPA (currently ${(parseFloat(nextTierUp.gpaRange.split('-')[0]) - overallGPA).toFixed(2)} points away)`
      : `You are in the top tier — maintain or improve your current performance`,
  };
}

// ============================================================================
// DEEP ACADEMIC REPORT SERVICE
// ============================================================================

export class DeepAcademicReportService {
  private _accumulatedCost = 0;
  private _accumulatedTokens = { input: 0, output: 0 };

  private trackUsage(usage: { input_tokens?: number; output_tokens?: number } | undefined): void {
    if (!usage) return;
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    this._accumulatedTokens.input += inputTokens;
    this._accumulatedTokens.output += outputTokens;
    // Sonnet pricing: $3/M input, $15/M output
    this._accumulatedCost += (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;
  }

  // ==========================================================================
  // MAIN ENTRY POINT
  // ==========================================================================

  async generateReport(input: DeepAcademicReportInput): Promise<DeepAcademicReport> {
    const startTime = Date.now();
    this._accumulatedCost = 0;
    this._accumulatedTokens = { input: 0, output: 0 };

    // Step 1: Assemble all context from existing services (no LLM, ~5ms)
    const context = this.assembleContext(input);

    // Step 2: Generate sections
    // Research Context is template-only, always works
    const researchContext = this.generateResearchContext(context);

    const sectionSources: Record<string, 'llm' | 'template'> = {
      researchContext: 'template',
    };

    let academicIdentity: AcademicIdentitySection;
    let challengesAndReality: ChallengesAndRealitySection;
    let strategicRoadmap: StrategicRoadmapSection;
    let usedFallback = false;

    try {
      // Parallel batch: Identity + Challenges&Reality + Roadmap (all independent)
      const [identityResult, challengesResult, roadmapResult] = await Promise.all([
        this.generateAcademicIdentity(context),
        this.generateChallengesAndReality(context),
        this.generateStrategicRoadmap(context),
      ]);

      academicIdentity = identityResult;
      challengesAndReality = challengesResult;
      strategicRoadmap = roadmapResult;

      sectionSources.academicIdentity = 'llm';
      sectionSources.challengesAndReality = 'llm';
      sectionSources.strategicRoadmap = 'llm';

    } catch (error) {
      console.error('[DeepAcademicReportService] LLM failed, using template fallback:', error);
      usedFallback = true;

      const fallback = this.generateTemplateFallback(context);
      academicIdentity = fallback.academicIdentity;
      challengesAndReality = fallback.challengesAndReality;
      strategicRoadmap = fallback.strategicRoadmap;

      sectionSources.academicIdentity = 'template';
      sectionSources.challengesAndReality = 'template';
      sectionSources.strategicRoadmap = 'template';
    }

    const metadata: ReportMetadata = {
      generationTimeMs: Date.now() - startTime,
      estimatedCost: this._accumulatedCost,
      tokenUsage: { ...this._accumulatedTokens },
      sectionSources,
      usedFallback,
    };

    return {
      academicIdentity,
      challengesAndReality,
      strategicRoadmap,
      researchContext,
      metadata,
    };
  }

  // ==========================================================================
  // STEP 1: ASSEMBLE CONTEXT (no LLM, ~5ms)
  // ==========================================================================

  private assembleContext(input: DeepAcademicReportInput): AssembledReportContext {
    // 1. Profile insights from insightDrivenAdvisor
    const studentProfile: StudentProfile = {
      quantitativeAnalysis: input.quantitativeAnalysis,
      intendedMajor: input.intendedMajor,
      currentGrade: input.currentGrade,
      schoolContext: {
        type: input.schoolContext.type,
      },
    };
    const profileInsights = extractProfileInsights(studentProfile);

    // 2. Assembled research from unifiedResearchAssemblyService
    const studentContext: StudentContext = {
      quantitativeAnalysis: input.quantitativeAnalysis,
      intendedMajor: input.intendedMajor,
      currentGrade: input.currentGrade,
      schoolContext: input.schoolContext.apCoursesAvailable
        ? { type: input.schoolContext.type, apCoursesAvailable: input.schoolContext.apCoursesAvailable }
        : { type: input.schoolContext.type },
    };
    const assembledResearch = assembleResearchForStudent(studentContext);

    // 3. Planning advice from academicPlanningAdvisor
    const planningInput: AcademicPlanningInput = {
      quantitativeAnalysis: input.quantitativeAnalysis,
      intendedMajor: input.intendedMajor,
      currentGrade: input.currentGrade,
      schoolContext: {
        type: input.schoolContext.type,
        apCoursesAvailable: [],
        honorsCoursesAvailable: [],
        dualEnrollmentAvailable: false,
      },
    };
    const planningAdvice = generateAcademicPlanningAdvice(planningInput);

    return {
      quantitativeAnalysis: input.quantitativeAnalysis,
      profileInsights,
      assembledResearch,
      planningAdvice,
      input,
    };
  }

  // ==========================================================================
  // SECTION 1: ACADEMIC IDENTITY (LLM)
  // ==========================================================================

  private async generateAcademicIdentity(ctx: AssembledReportContext): Promise<AcademicIdentitySection> {
    const quant = ctx.quantitativeAnalysis;
    const overallGPA = calculateOverallGPA(quant);
    const synthesis = quant.synthesis;
    const trajectory = quant.progressionTrajectory;
    const fingerprint = quant.performanceFingerprint;

    const systemPrompt = `You are an expert college admissions consultant writing a deep academic identity analysis. Write in second person ("you"). Be specific with data and natural in voice.

CRITICAL RULES:
1. Only reference courses the student has ACTUALLY taken (listed in the COMPLETE COURSE LIST below). Do NOT claim they are "missing" a course they already have.
2. NO rhetorical questions. NO vague observations like "the question is whether..." or "it remains to be seen." Every sentence must contain specific data, a concrete insight, or an actionable observation.
3. When discussing GPA changes, ALWAYS frame them in terms of COLLEGE TIER IMPACT using the benchmarks provided. Don't just say "0.70 GPA drop" — say "this drops you from Highly Selective to Selective range."

The "notableStrengths" should highlight NON-OBVIOUS insights about their top 2-3 strengths. Don't restate "you're good at Math." Explain what their performance SIGNALS and how it connects to their path. 1-2 sentences each.

The "notableWeaknesses" should preview key gaps — concise and honest. The Challenges section covers these in depth, so stay brief. Tone calibration:
- Strong students: gently point out opportunities.
- Struggling students: direct and honest reality check.

The "tierPosition" maps their GPA to concrete school tiers. Use the COLLEGE TIER BENCHMARKS provided. Show where their strengths could take them vs where weaknesses drag them. Use SCHOOL NAMES for impact.

The "upliftRating" is a HOLISTIC letter grade (A+ through F) considering rigor, major alignment, trends, difficulty sensitivity, school context. The explanation must reference specific factors.

SCOPE: This section is IDENTITY. The Challenges section handles detailed breakdowns. The Roadmap handles course recommendations. Don't overlap.

Output valid JSON:
{
  "narrativeIdentity": "2-3 paragraphs: who they are academically. Use tier benchmarks when discussing GPA impact. NO rhetorical questions.",
  "notableStrengths": [
    {
      "subject": "Subject or pattern name",
      "insight": "Non-obvious insight. 1-2 sentences.",
      "majorRelevance": "Connection to major/path. 1 sentence."
    }
  ],
  "notableWeaknesses": [
    {
      "area": "Subject or pattern name",
      "gap": "The gap with tier impact. 1-2 sentences.",
      "consequence": "Why it matters for their path. 1 sentence."
    }
  ],
  "tierPosition": {
    "currentTier": "e.g. Selective (Top 30-80)",
    "tierExamples": ["School 1", "School 2", "School 3"],
    "gpaPosition": "Where their GPA sits in this tier",
    "strengthTier": "Where their best subject GPA would place them (if different tier) or null",
    "weaknessTier": "Where their worst subject GPA drags them (if different tier) or null",
    "tierGap": "What it takes to reach next tier — specific GPA target"
  },
  "upliftRating": {
    "grade": "<A+|A|A-|B+|B|B-|C+|C|C-|D+|D|D-|F>",
    "explanation": "What this grade means for THIS student with tier context. 2-3 sentences."
  },
  "trajectoryMeaning": "2-3 sentences: What their trajectory means in TIER terms — are they moving up or down between tiers?",
  "definingPattern": "1-2 sentences: The single most important pattern."
}`;

    // Build Uplift Scale reference for the LLM
    const upliftScaleRef = UPLIFT_SCALE_DATABASE
      .filter(d => ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'].includes(d.grade))
      .map(d => `${d.grade} (${d.label}): ${d.description}`)
      .join('\n');

    // Pre-calculate tier position for the LLM
    const tierPosition = calculateTierPosition(quant);

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
${ctx.profileInsights.map(i => `- ${i.observation}`).join('\n')}

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

    this.trackUsage(response.usage);
    return parseClaudeJSON<AcademicIdentitySection>(response.content, 'academicIdentity');
  }

  // ==========================================================================
  // SECTION 2: CHALLENGES & ADMISSIONS REALITY (merged — single LLM call)
  // ==========================================================================

  private async generateChallengesAndReality(ctx: AssembledReportContext): Promise<ChallengesAndRealitySection> {
    const quant = ctx.quantitativeAnalysis;
    const overallGPA = calculateOverallGPA(quant);
    const challenges = quant.synthesis.challenges;
    const research = ctx.assembledResearch;

    // Identify challenge subjects
    const challengeSubjects = Object.entries(quant.subjectPatterns)
      .filter(([_, p]) => p.relativeStrength < -0.05)
      .sort((a, b) => a[1].relativeStrength - b[1].relativeStrength)
      .slice(0, 3);

    const challengePatterns = challenges.slice(0, 3);
    const redFlags = ctx.planningAdvice.redFlags || [];
    const courseRecs = ctx.planningAdvice.courseRecommendations || [];
    const relevantStats = research.verifiedStatistics.slice(0, 6);

    // Build tier benchmarks reference
    const tierBenchmarksRef = COLLEGE_TIER_BENCHMARKS
      .map(t => `${t.name}: GPA ${t.gpaRange} (e.g. ${t.examples.slice(0, 3).join(', ')})`)
      .join('\n');

    // Pre-calculate tier position
    const tierPosition = calculateTierPosition(quant);

    const systemPrompt = `You are a former admissions officer writing about academic challenges — what they are, how AOs interpret them, and how they affect a student's college positioning.

CRITICAL RULES:
1. Only reference courses the student has ACTUALLY taken (listed below). Do NOT claim they are missing a course they already have.
2. NO rhetorical questions. NO filler like "the question is whether..." or "it remains to be seen." Every sentence must contain data, a concrete insight, or an actionable observation.
3. NO "What You Think" or "You probably think" framing — do NOT assume the student's thoughts. Just state the issue and the AO reality directly.
4. When discussing GPA impact, ALWAYS use COLLEGE TIER BENCHMARKS: say "this pulls you from Highly Selective (UCLA) to Selective (Boston U) range" instead of just "0.70 GPA drop."
5. Do NOT give root cause analysis or study advice — that happens in conversation later.

Focus on 2-3 DISTINCT challenges. Each should cover a different concern.

SCOPE: This section covers challenges + AO perspective. The Academic Identity already previewed weaknesses briefly. The Roadmap has detailed course recommendations — just point to it.

Output valid JSON:
{
  "firstGlance": "2-3 sentences: What an AO notices in the first 30 seconds. Be candid and specific. Use tier language.",
  "challenges": [
    {
      "title": "Challenge name (short, distinct)",
      "issue": "What the issue is — factual, specific. 2-3 sentences. Use tier benchmarks for context.",
      "aoImpact": "How AOs specifically interpret this. 2-3 sentences. What does it signal about college readiness?",
      "tierImpact": "How this shifts their school positioning — use school names. 1-2 sentences.",
      "roadmapConnection": "Brief pointer to roadmap action. 1-2 sentences.",
      "researchBacking": [
        { "claim": "Specific claim", "value": "Data point", "source": "Verified source" }
      ]
    }
  ],
  "unintendedNarrative": "2-3 sentences: The accidental story this transcript tells. Be direct.",
  "narrativeControlStrategy": "2-3 sentences: How to reshape the story. Actionable, specific."
}`;

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

OVERALL GPA: ${overallGPA.toFixed(2)}
SCHOOL TYPE: ${ctx.input.schoolContext.type.replace(/_/g, ' ')}
INTENDED MAJOR: ${ctx.input.intendedMajor || 'Undecided'}

COMPLETE COURSE LIST (courses they have ACTUALLY taken — do NOT claim they are missing any of these):
${allCoursesList}

CHALLENGE SUBJECTS (relative weakness areas):
${challengeSubjects.map(([subj, p]) => {
  const courses = p.performanceHistory.courses.map(c => `${c.name} (${c.level}): ${c.grade.toFixed(1)}`).join(', ');
  return `- ${formatSubject(subj)}: ${p.performanceHistory.avgGPA.toFixed(2)} avg GPA, ${Math.round(p.relativeStrength * 100)}% relative, trend: ${p.performanceHistory.trend}
    Courses: ${courses}`;
}).join('\n\n')}

CHALLENGE PATTERNS:
${challengePatterns.map(c => `- ${c.insight}: ${c.evidence} → ${c.implication}`).join('\n')}

RED FLAGS:
${redFlags.map(r => `- [${r.severity}] ${r.description}`).join('\n')}

CHALLENGE RESPONSE DATA:
- Typical difficulty impact: ${quant.challengeResponse.transitionAnalysis.typicalImpact.toFixed(2)} GPA drop
- Risk level: ${quant.challengeResponse.challengeRiskProfile.riskLevel}/100

TRAJECTORY: ${quant.progressionTrajectory.historical.overallTrend}
GPA TREND: ${quant.progressionTrajectory.historical.gpaByYear.map(y => `${y.year}: ${y.gpa.toFixed(2)} (rigor: ${y.rigorLevel.toFixed(1)})`).join(' → ')}

RIGOR CONTEXT:
- Sweet spot: ${quant.performanceFingerprint.sweetSpot.level}
- Difficulty sensitivity: ${quant.performanceFingerprint.difficultySensitivity}
- Consistency: ${quant.performanceFingerprint.consistencyScore}%

ROADMAP CONTEXT (briefly connect challenges to these actions):
${courseRecs.map(r => `- ${formatSubject(r.subject)}: ${r.recommendedLevel}${r.specificCourse ? ` (${r.specificCourse})` : ''} — ${r.rationale}`).join('\n')}

COLLEGE EXPECTATIONS:
${research.collegeExpectations ? `Tier: ${research.collegeExpectations.tier}, GPA range: ${research.collegeExpectations.gpaRange}, AP range: ${research.collegeExpectations.apCourseRange}` : 'Not specified'}

VERIFIED STATISTICS (cite these, don't invent):
${relevantStats.map(s => `- ${s.claim}: ${s.value} (${s.citation})`).join('\n')}`;

    const response = await callClaude<string>({
      model: MODEL,
      systemPrompt,
      userPrompt,
      maxTokens: MAX_TOKENS_PER_SECTION,
      temperature: 0.3,
    });

    this.trackUsage(response.usage);
    return parseClaudeJSON<ChallengesAndRealitySection>(response.content, 'challengesAndReality');
  }

  // ==========================================================================
  // SECTION 5: STRATEGIC ROADMAP (LLM)
  // ==========================================================================

  private async generateStrategicRoadmap(ctx: AssembledReportContext): Promise<StrategicRoadmapSection> {
    const planning = ctx.planningAdvice;
    const quant = ctx.quantitativeAnalysis;
    const research = ctx.assembledResearch;

    const systemPrompt = `You are an expert academic advisor writing a strategic roadmap for a student's remaining high school career. Prioritize ruthlessly — give them the 3 most impactful actions, not a laundry list.

CRITICAL: Only reference courses the student has ACTUALLY taken (listed in the COMPLETE COURSE LIST below). Do NOT claim they are missing a course they already have. Do NOT say "You're taking X now" unless that course actually appears in the list. Read the course list carefully before writing.

SCOPE: This is the ACTION section — specific courses, priorities, and strategy. Other sections already cover identity, challenges, and AO perceptions. Don't repeat those analyses — focus on WHAT TO DO.

Output valid JSON:
{
  "priorities": [
    {
      "priority": 1,
      "title": "Short title",
      "description": "2-3 sentences explaining WHY this is the top priority and what changes if they do/don't act.",
      "impact": "critical" | "high" | "moderate",
      "actionItems": ["Specific action 1", "Specific action 2"]
    }
  ],
  "courseStrategy": {
    "recommended": [
      {
        "course": "Specific course name",
        "rationale": "Why this course specifically, tied to their profile.",
        "risk": "low" | "medium" | "high",
        "expectedOutcome": "What grade/benefit they can realistically expect."
      }
    ],
    "avoid": [
      { "course": "Course to avoid", "reason": "Why, based on their data." }
    ],
    "rationale": "1-2 sentences on the overall course strategy philosophy for this student."
  },
  "majorAlignment": {
    "score": <0-100>,
    "assessment": "2-3 sentences on how well their current profile aligns with their intended major.",
    "missingPieces": ["What's missing for their major"],
    "strengthsToLeverage": ["What they already have going for them"]
  },
  "trajectoryOptimization": "2-3 sentences: How to optimize their GPA trajectory from here. What would make the biggest difference?"
}

Include exactly 3 priorities, 3-5 recommended courses, and 1-2 courses to avoid.`;

    const courseRecs = planning.courseRecommendations || [];
    const opportunities = planning.opportunities || [];
    const workload = planning.workloadAdvice;

    // Build complete course list for grounding
    const allCoursesList = Object.entries(quant.subjectPatterns)
      .map(([subj, p]) => {
        const courses = p.performanceHistory.courses
          .map(c => `${c.name} (${c.level}): ${c.grade.toFixed(2)}`)
          .join(', ');
        return `${formatSubject(subj)}: ${courses}`;
      }).join('\n');

    const userPrompt = `Create a strategic roadmap for this student:

COMPLETE COURSE LIST (courses they have ACTUALLY taken — do NOT claim they are missing any of these, and do NOT say they are "currently taking" a course unless it appears here):
${allCoursesList}

CURRENT TRAJECTORY: ${planning.trajectoryAssessment?.pattern || 'unknown'}
AO INTERPRETATION: ${planning.trajectoryAssessment?.aoInterpretation || 'N/A'}
TRAJECTORY RECOMMENDATION: ${planning.trajectoryAssessment?.recommendation || 'N/A'}

COURSE RECOMMENDATIONS FROM ANALYSIS:
${courseRecs.map(r => `- ${formatSubject(r.subject)}: ${r.recommendedLevel}${r.specificCourse ? ` (${r.specificCourse})` : ''} — ${r.rationale} [Risk: ${r.riskLevel}]`).join('\n')}

WORKLOAD ADVICE:
- Recommended rigorous courses: ${workload?.recommendedRigorousCourses || 'N/A'}
- Maximum: ${workload?.maxRigorousCourses || 'N/A'}
- Current vs recommended: ${workload?.currentVsRecommended || 'N/A'}
- Balance: ${workload?.balanceAdvice || 'N/A'}

MAJOR ALIGNMENT:
- Major: ${planning.majorAlignment?.major || ctx.input.intendedMajor || 'Undecided'}
- Alignment score: ${planning.majorAlignment?.alignmentScore || 'N/A'}
- Missing courses: ${planning.majorAlignment?.missingCourses?.join(', ') || 'None'}
- Red flags: ${planning.majorAlignment?.redFlagsForMajor?.join('; ') || 'None'}

OPPORTUNITIES:
${opportunities.map(o => `- [${o.type}] ${o.description}: ${o.action} → ${o.benefit}`).join('\n')}

RED FLAGS:
${(planning.redFlags || []).map(r => `- [${r.severity}] ${r.description}: ${r.howToAddress}`).join('\n')}

PERFORMANCE ENVELOPE:
- Current typical: ${quant.performanceEnvelope.comfortableRange.typicalGPA.toFixed(2)}
- Ceiling: ${quant.performanceEnvelope.ceiling.gpa.toFixed(2)}
- Optimal target: ${quant.performanceEnvelope.optimalTarget.gpa.toFixed(2)}

GRADE: ${ctx.input.currentGrade}
SCHOOL TYPE: ${ctx.input.schoolContext.type.replace(/_/g, ' ')}

VERIFIED STATISTICS (cite these):
${research.verifiedStatistics.slice(0, 6).map(s => `- ${s.claim}: ${s.value} (${s.citation})`).join('\n')}`;

    const response = await callClaude<string>({
      model: MODEL,
      systemPrompt,
      userPrompt,
      maxTokens: MAX_TOKENS_PER_SECTION,
      temperature: 0.3,
      // useJsonMode off: parseClaudeJSON handles robust JSON extraction
    });

    this.trackUsage(response.usage);
    return parseClaudeJSON<StrategicRoadmapSection>(response.content, 'strategicRoadmap');
  }

  // ==========================================================================
  // SECTION 6: RESEARCH CONTEXT (Template Only, $0)
  // ==========================================================================

  private generateResearchContext(ctx: AssembledReportContext): ResearchContextSection {
    const research = ctx.assembledResearch;

    // AP Statistics for relevant courses
    const apStatistics = research.relevantAPCourses.map(c => ({
      course: c.course.name,
      passRate: c.verifiedStatistics?.passRate || `${Math.round(c.course.passRate * 100)}%`,
      fiveRate: c.verifiedStatistics?.score5Rate || `${Math.round(c.course.fiveRate * 100)}%`,
      citation: c.verifiedStatistics?.citation || 'College Board 2024',
    }));

    // College tier expectations
    const collegeTierExpectations = [
      { tier: 'Ivy/Elite (<10% admit)', gpaRange: '3.85-4.0 UW', rigorExpectation: 'Maximum available rigor expected' },
      { tier: 'Highly Selective (10-25%)', gpaRange: '3.7-3.9 UW', rigorExpectation: 'Strong rigor, most available APs' },
      { tier: 'Selective (25-40%)', gpaRange: '3.5-3.7 UW', rigorExpectation: 'Good rigor, several APs in strengths' },
      { tier: 'Competitive (40-60%)', gpaRange: '3.3-3.5 UW', rigorExpectation: 'Some AP/Honors coursework' },
    ];

    // Major requirements from resolution service
    let majorRequirements: ResearchContextSection['majorRequirements'] | undefined;
    if (ctx.input.intendedMajor) {
      const resolved = resolveStudentInterest(ctx.input.intendedMajor);
      if (resolved) {
        majorRequirements = {
          major: resolved.matched.major,
          minimumCourses: resolved.mergedRequirements.minimum,
          competitiveCourses: resolved.mergedRequirements.competitive,
          beyondCourses: resolved.mergedBeyondCourses,
        };
      }
    }

    // NACAC factors
    const admissionsFactors = [
      { factor: 'Rigor of secondary school record', importance: 'Very Important (64% of colleges)', citation: 'NACAC 2023' },
      { factor: 'Academic GPA', importance: 'Very Important (77% of colleges)', citation: 'NACAC 2023' },
      { factor: 'Grades in college prep courses', importance: 'Very Important (69% of colleges)', citation: 'NACAC 2023' },
      { factor: 'Standardized test scores', importance: 'Moderately Important (varies by school)', citation: 'NACAC 2023' },
    ];

    return {
      apStatistics,
      collegeTierExpectations,
      majorRequirements,
      admissionsFactors,
    };
  }

  // ==========================================================================
  // TEMPLATE FALLBACK (when LLM unavailable)
  // ==========================================================================

  private generateTemplateFallback(ctx: AssembledReportContext): Omit<DeepAcademicReport, 'researchContext' | 'metadata'> {
    const quant = ctx.quantitativeAnalysis;
    const overallGPA = calculateOverallGPA(quant);
    const synthesis = quant.synthesis;
    const planning = ctx.planningAdvice;

    // Section 1: Academic Identity with notable strengths, weaknesses, and tier position
    const strengthSubjects = Object.entries(quant.subjectPatterns)
      .filter(([_, p]) => p.relativeStrength > 0.05)
      .sort((a, b) => b[1].relativeStrength - a[1].relativeStrength)
      .slice(0, 3);

    const weaknessSubjects = Object.entries(quant.subjectPatterns)
      .filter(([_, p]) => p.relativeStrength < -0.05)
      .sort((a, b) => a[1].relativeStrength - b[1].relativeStrength)
      .slice(0, 2);

    // Determine Uplift grade from GPA + rigor heuristic
    const rigorBonus = quant.performanceFingerprint.sweetSpot.level === 'ap_ib' ? 0.15 : 0;
    const trendBonus = quant.progressionTrajectory.historical.overallTrend === 'improving' ? 0.05 : quant.progressionTrajectory.historical.overallTrend === 'declining' ? -0.1 : 0;
    const adjustedScore = overallGPA + rigorBonus + trendBonus;
    const fallbackGrade: UpliftGrade = adjustedScore >= 3.9 ? 'A' : adjustedScore >= 3.75 ? 'A-' : adjustedScore >= 3.6 ? 'B+' : adjustedScore >= 3.4 ? 'B' : adjustedScore >= 3.2 ? 'B-' : adjustedScore >= 3.0 ? 'C+' : 'C';
    const gradeDescriptor = UPLIFT_SCALE_DATABASE.find(d => d.grade === fallbackGrade);

    // Calculate tier position
    const tierPosition = calculateTierPosition(quant);

    const academicIdentity: AcademicIdentitySection = {
      narrativeIdentity: `${synthesis.profileSummary}\n\n${synthesis.coreInsight} ${synthesis.uniquePattern}`,
      notableStrengths: strengthSubjects.map(([subj, p]) => ({
        subject: formatSubject(subj),
        insight: `Your ${p.performanceHistory.avgGPA.toFixed(2)} average with +${Math.round(p.relativeStrength * 100)}% relative strength signals genuine aptitude beyond what most students demonstrate at this level.`,
        majorRelevance: ctx.input.intendedMajor
          ? `This connects directly to your interest in ${ctx.input.intendedMajor}.`
          : 'This strength opens doors across multiple fields.',
      })),
      notableWeaknesses: weaknessSubjects.map(([subj, p]) => ({
        area: formatSubject(subj),
        gap: `Your ${p.performanceHistory.avgGPA.toFixed(2)} average is ${Math.abs(Math.round(p.relativeStrength * 100))}% below your overall performance, indicating this is a relative challenge area.`,
        consequence: ctx.input.intendedMajor
          ? `If ${formatSubject(subj).toLowerCase()} is relevant to ${ctx.input.intendedMajor}, this gap could weaken your application.`
          : 'Admissions officers may notice this relative weakness in your transcript.',
      })),
      tierPosition,
      upliftRating: {
        grade: fallbackGrade,
        explanation: gradeDescriptor
          ? `${gradeDescriptor.description} ${gradeDescriptor.schoolFit}`
          : `Your ${overallGPA.toFixed(2)} GPA with ${quant.performanceFingerprint.difficultySensitivity} difficulty sensitivity places you in this range.`,
      },
      trajectoryMeaning: `Your ${quant.progressionTrajectory.historical.overallTrend} trajectory ${
        quant.progressionTrajectory.historical.overallTrend === 'improving' || quant.progressionTrajectory.historical.overallTrend === 'accelerating'
          ? 'is a positive signal that admissions officers value highly.'
          : quant.progressionTrajectory.historical.overallTrend === 'declining'
            ? 'is a concern that needs to be addressed with a visible recovery.'
            : 'shows stability — which is good, but could be strengthened by adding rigor.'
      }`,
      definingPattern: synthesis.uniquePattern,
    };

    // Section 2: Challenges & Admissions Reality (merged)
    const challengesAndReality: ChallengesAndRealitySection = {
      firstGlance: `An admissions officer would first notice your ${overallGPA.toFixed(2)} GPA (${tierPosition.currentTier} range) and ${quant.progressionTrajectory.historical.overallTrend} trajectory.`,
      challenges: synthesis.challenges.slice(0, 3).map(c => ({
        title: c.insight,
        issue: c.evidence,
        aoImpact: c.implication,
        tierImpact: `This affects your positioning within the ${tierPosition.currentTier} range.`,
        roadmapConnection: 'See the Strategic Roadmap for specific course recommendations.',
        researchBacking: [],
      })),
      unintendedNarrative: `Your current course selections and grade patterns tell a story of ${
        quant.progressionTrajectory.historical.overallTrend === 'improving' ? 'growth and increasing engagement' : 'steady performance'
      }.`,
      narrativeControlStrategy: 'Align senior year course choices with your intended major and address identified gaps to reshape this narrative.',
    };

    // Section 3: Strategic Roadmap from planning advice
    const strategicRoadmap: StrategicRoadmapSection = {
      priorities: [
        {
          priority: 1,
          title: planning.trajectoryAssessment?.recommendation || 'Strengthen Course Rigor',
          description: planning.trajectoryAssessment?.aoInterpretation || 'Increase rigor strategically.',
          impact: 'critical' as const,
          actionItems: planning.trajectoryAssessment?.actionItems || ['Review course options for next semester'],
        },
        ...(planning.opportunities || []).slice(0, 2).map((o, i) => ({
          priority: i + 2 as 2 | 3,
          title: o.description.slice(0, 50),
          description: `${o.action} — ${o.benefit}`,
          impact: 'high' as const,
          actionItems: [o.action],
        })),
      ].slice(0, 3) as StrategicPriority[],
      courseStrategy: {
        recommended: (planning.courseRecommendations || []).slice(0, 5).map(r => ({
          course: r.specificCourse || `AP ${formatSubject(r.subject)}`,
          rationale: r.rationale,
          risk: r.riskLevel as 'low' | 'medium' | 'high',
          expectedOutcome: r.evidenceBasis,
        })),
        avoid: (planning.redFlags || [])
          .filter(r => r.subject)
          .slice(0, 2)
          .map(r => ({
            course: `AP ${formatSubject(r.subject || '')}`,
            reason: r.howToAddress,
          })),
        rationale: planning.workloadAdvice?.balanceAdvice || 'Balance rigor with success in your strongest areas.',
      },
      majorAlignment: {
        score: planning.majorAlignment?.alignmentScore || 0,
        assessment: planning.majorAlignment?.recommendations?.join('. ') || 'No major-specific assessment available.',
        missingPieces: planning.majorAlignment?.missingCourses || [],
        strengthsToLeverage: planning.majorAlignment?.requiredCourses?.filter((_, i) => i < 3) || [],
      },
      trajectoryOptimization: planning.trajectoryAssessment?.recommendation || 'Maintain current rigor while showing improvement in challenge areas.',
    };

    return {
      academicIdentity,
      challengesAndReality,
      strategicRoadmap,
    };
  }
}

// ============================================================================
// SINGLETON & CONVENIENCE
// ============================================================================

export const deepAcademicReportService = new DeepAcademicReportService();

export async function generateDeepAcademicReport(
  input: DeepAcademicReportInput
): Promise<DeepAcademicReport> {
  return deepAcademicReportService.generateReport(input);
}
