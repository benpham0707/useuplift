/**
 * Deep Academic Report Service
 *
 * Orchestrates existing analysis services and adds LLM-powered narrative depth
 * to produce a 6-section report with PIQ-workshop-level teaching quality.
 *
 * Architecture:
 * 1. Assembles all context from existing services (zero LLM, ~5ms):
 *    - extractProfileInsights() → deep qualitative insights
 *    - assembleResearchForStudent() → verified research data
 *    - generateAcademicPlanningAdvice() → course/workload/major advice
 *
 * 2. Generates 6 report sections (5 LLM calls + 1 template, ~$0.07):
 *    - Academic Identity (LLM)
 *    - Strength Deep Dives (LLM)
 *    - Challenge Deep Dives (LLM)
 *    - Admissions Officer Lens (LLM)
 *    - Strategic Roadmap (LLM)
 *    - Research Context (template only)
 *
 * 3. Falls back gracefully to template-only output when LLM unavailable
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
  StrengthDeepDive,
  ChallengeDeepDive,
  AdmissionsOfficerLensSection,
  StrategicRoadmapSection,
  ResearchContextSection,
  ReportMetadata,
  ResearchCitation,
  BlindSpot,
  StrategicPriority,
  CourseStrategyItem,
  CourseAvoidItem,
} from './deepAcademicReportTypes';

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
    // Section 6 (Research Context) is template-only, always works
    const researchContext = this.generateResearchContext(context);

    const sectionSources: Record<string, 'llm' | 'template'> = {
      researchContext: 'template',
    };

    let academicIdentity: AcademicIdentitySection;
    let strengthDeepDives: StrengthDeepDive[];
    let challengeDeepDives: ChallengeDeepDive[];
    let admissionsOfficerLens: AdmissionsOfficerLensSection;
    let strategicRoadmap: StrategicRoadmapSection;
    let usedFallback = false;

    try {
      // Parallel batch 1: Identity + Strengths + Challenges (independent)
      const [identityResult, strengthsResult, challengesResult] = await Promise.all([
        this.generateAcademicIdentity(context),
        this.generateStrengthDeepDives(context),
        this.generateChallengeDeepDives(context),
      ]);

      academicIdentity = identityResult;
      strengthDeepDives = strengthsResult;
      challengeDeepDives = challengesResult;

      sectionSources.academicIdentity = 'llm';
      sectionSources.strengthDeepDives = 'llm';
      sectionSources.challengeDeepDives = 'llm';

      // Parallel batch 2: AO Lens + Roadmap (can reference earlier sections conceptually
      // but don't need their output — they read the same assembled context)
      const [aoLensResult, roadmapResult] = await Promise.all([
        this.generateAOLens(context),
        this.generateStrategicRoadmap(context),
      ]);

      admissionsOfficerLens = aoLensResult;
      strategicRoadmap = roadmapResult;

      sectionSources.admissionsOfficerLens = 'llm';
      sectionSources.strategicRoadmap = 'llm';

    } catch (error) {
      console.error('[DeepAcademicReportService] LLM failed, using template fallback:', error);
      usedFallback = true;

      const fallback = this.generateTemplateFallback(context);
      academicIdentity = fallback.academicIdentity;
      strengthDeepDives = fallback.strengthDeepDives;
      challengeDeepDives = fallback.challengeDeepDives;
      admissionsOfficerLens = fallback.admissionsOfficerLens;
      strategicRoadmap = fallback.strategicRoadmap;

      sectionSources.academicIdentity = 'template';
      sectionSources.strengthDeepDives = 'template';
      sectionSources.challengeDeepDives = 'template';
      sectionSources.admissionsOfficerLens = 'template';
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
      strengthDeepDives,
      challengeDeepDives,
      admissionsOfficerLens,
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

    const systemPrompt = `You are an expert college admissions consultant writing a deep academic identity analysis for a student. Your output must be teaching-quality — explain WHY things matter, not just WHAT they are. Write in second person ("you"). Be specific with data but natural in voice. Never be generic.

Output valid JSON matching this structure exactly:
{
  "narrativeIdentity": "2-3 paragraphs: who they are academically. Not a summary of grades — a narrative about their academic character, patterns, and potential. What drives them? Where do they thrive? What's their academic story?",
  "harvardScaleRating": {
    "rating": <1-6 number>,
    "label": "<rating label>",
    "explanation": "What this rating means specifically for this student. Not a generic definition — what it means for THEIR profile.",
    "biggestLever": "The single most impactful thing they could do to move up."
  },
  "aoFirstImpression": "What an admissions officer sees in the first 30 seconds of reading this transcript. Be honest — what's the gut reaction?",
  "trajectoryMeaning": "What their GPA trajectory means in admissions context. Is it a story of growth, resilience, plateau, or something else?",
  "definingPattern": "The single most important pattern in their academic record that defines their candidacy."
}`;

    const userPrompt = `Analyze this student's academic identity:

PROFILE SUMMARY: ${synthesis.profileSummary}
OVERALL GPA: ${overallGPA.toFixed(2)}
PERFORMANCE PERCENTILE: ${fingerprint.performancePercentile}th
SWEET SPOT: ${fingerprint.sweetSpot.level} level, ${fingerprint.sweetSpot.expectedGPA.toFixed(2)} expected GPA
CONSISTENCY: ${fingerprint.consistencyScore}%
DIFFICULTY SENSITIVITY: ${fingerprint.difficultySensitivity}
TRAJECTORY: ${trajectory.historical.overallTrend} (strength: ${trajectory.historical.trendStrength}%)

SUBJECT STRENGTHS:
${Object.entries(quant.subjectPatterns)
  .sort((a, b) => b[1].relativeStrength - a[1].relativeStrength)
  .map(([subj, p]) => `- ${formatSubject(subj)}: ${p.performanceHistory.avgGPA.toFixed(2)} avg, ${p.relativeStrength > 0 ? '+' : ''}${Math.round(p.relativeStrength * 100)}% relative, trend: ${p.performanceHistory.trend}`)
  .join('\n')}

KEY INSIGHTS FROM ANALYSIS:
${ctx.profileInsights.map(i => `- ${i.observation}`).join('\n')}

INTENDED MAJOR: ${ctx.input.intendedMajor || 'Undecided'}
GRADE: ${ctx.input.currentGrade}
SCHOOL TYPE: ${ctx.input.schoolContext.type.replace(/_/g, ' ')}
PERFORMANCE ENVELOPE: Floor ${quant.performanceEnvelope.floor.gpa.toFixed(2)}, Ceiling ${quant.performanceEnvelope.ceiling.gpa.toFixed(2)}, Typical ${quant.performanceEnvelope.comfortableRange.typicalGPA.toFixed(2)}

HARVARD SCALE REFERENCE:
1 = Summa potential (top 1%), 2 = Magna potential (top 5%), 3 = Cum Laude potential (top 15%), 4 = Strong academic (top 30%), 5 = Adequate preparation, 6 = Below expectations`;

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
  // SECTION 2: STRENGTH DEEP DIVES (LLM)
  // ==========================================================================

  private async generateStrengthDeepDives(ctx: AssembledReportContext): Promise<StrengthDeepDive[]> {
    const quant = ctx.quantitativeAnalysis;
    const strengths = quant.synthesis.strengths;
    const research = ctx.assembledResearch;

    // Identify top strength subjects (relative strength > 0)
    const strengthSubjects = Object.entries(quant.subjectPatterns)
      .filter(([_, p]) => p.relativeStrength > 0.05)
      .sort((a, b) => b[1].relativeStrength - a[1].relativeStrength)
      .slice(0, 4);

    // Also include non-subject strengths from synthesis (like consistency, trajectory)
    const synthesisStrengths = strengths
      .filter(s => !strengthSubjects.some(([subj]) => s.insight.toLowerCase().includes(subj.replace(/_/g, ' '))))
      .slice(0, 2);

    const relevantStats = research.verifiedStatistics.slice(0, 8);

    const systemPrompt = `You are an expert admissions consultant writing deep-dive analysis of a student's academic strengths. Each strength gets PIQ-workshop-level depth.

For each strength, provide teaching that explains:
1. WHY this matters (not just that it exists)
2. What the student CANNOT see about their own strength
3. SPECIFIC actions to leverage it

Output valid JSON as an object wrapping an array:
{
  "items": [
    {
      "title": "Subject or pattern name",
      "hook": "Attention-grabbing opening observation. Make them think 'I never realized that.' 1-2 sentences.",
      "whyItMatters": {
        "forAdmissionsOfficers": "What AOs see when they read this strength. Be specific about how it affects their evaluation.",
        "forYourMajor": "How this strength connects to their intended major or future academic path.",
        "forYourNarrative": "How this strength shapes the story their application tells."
      },
      "blindSpotInsight": "The thing they absolutely cannot see from reading their own transcript. This is the expert insight — what a $500/hr consultant would tell them.",
      "actionableGuidance": {
        "leverageStrategy": "How to maximize this strength's impact on their application.",
        "courseRecommendation": "Specific course(s) to take to build on this strength, with rationale.",
        "narrativeAngle": "How to weave this strength into their application narrative."
      },
      "researchBacking": [
        { "claim": "Specific claim", "value": "Data point", "source": "Verified source" }
      ]
    }
  ]
}`;

    const userPrompt = `Analyze these academic strengths in depth:

SUBJECT STRENGTHS:
${strengthSubjects.map(([subj, p]) => {
  const courses = p.performanceHistory.courses.map(c => `${c.name} (${c.level}): ${c.grade.toFixed(1)}`).join(', ');
  return `- ${formatSubject(subj)}: ${p.performanceHistory.avgGPA.toFixed(2)} avg GPA, +${Math.round(p.relativeStrength * 100)}% relative strength, trend: ${p.performanceHistory.trend}
    Courses: ${courses}
    Recommended level: ${p.recommendedLevel} (${p.levelReasoning})
    Projected: ${p.projectedOutcome.expectedGrade} (${Math.round(p.projectedOutcome.confidence * 100)}% confidence)`;
}).join('\n\n')}

OTHER PATTERN STRENGTHS:
${synthesisStrengths.map(s => `- ${s.insight}: ${s.evidence} → ${s.implication}`).join('\n')}

PROFILE INSIGHTS (for blind spot material):
${ctx.profileInsights.map(i => `- Observation: ${i.observation}\n  Interpretation: ${i.interpretation}\n  Strategic: ${i.strategicImplication}`).join('\n\n')}

INTENDED MAJOR: ${ctx.input.intendedMajor || 'Undecided'}

VERIFIED STATISTICS (cite these, don't invent):
${relevantStats.map(s => `- ${s.claim}: ${s.value} (${s.citation})`).join('\n')}

MAJOR ALIGNMENT: ${ctx.planningAdvice.majorAlignment?.major || 'Not specified'}, alignment score: ${ctx.planningAdvice.majorAlignment?.alignmentScore || 'N/A'}`;

    const response = await callClaude<string>({
      model: MODEL,
      systemPrompt,
      userPrompt,
      maxTokens: MAX_TOKENS_PER_SECTION,
      temperature: 0.3,
      // useJsonMode off: parseClaudeJSON handles robust JSON extraction
    });

    this.trackUsage(response.usage);
    const parsed = parseClaudeJSON<unknown>(response.content, 'strengthDeepDives');
    return extractArray<StrengthDeepDive>(parsed);
  }

  // ==========================================================================
  // SECTION 3: CHALLENGE DEEP DIVES (LLM)
  // ==========================================================================

  private async generateChallengeDeepDives(ctx: AssembledReportContext): Promise<ChallengeDeepDive[]> {
    const quant = ctx.quantitativeAnalysis;
    const challenges = quant.synthesis.challenges;
    const research = ctx.assembledResearch;

    // Identify challenge subjects (relative strength < 0)
    const challengeSubjects = Object.entries(quant.subjectPatterns)
      .filter(([_, p]) => p.relativeStrength < -0.05)
      .sort((a, b) => a[1].relativeStrength - b[1].relativeStrength)
      .slice(0, 3);

    // Include challenge patterns from synthesis
    const challengePatterns = challenges.slice(0, 3);

    // Red flags from planning advice
    const redFlags = ctx.planningAdvice.redFlags || [];

    const relevantStats = research.verifiedStatistics.slice(0, 8);

    const systemPrompt = `You are an expert admissions consultant writing deep-dive analysis of a student's academic challenges. Your job is to TEACH, not alarm. Reframe challenges constructively while being honest.

For each challenge, provide diagnostic teaching:
1. What it actually means (often less scary than the student thinks)
2. What admissions officers see vs what's really happening
3. SPECIFIC step-by-step plan to address it

Output valid JSON as an object wrapping an array:
{
  "items": [
    {
      "title": "Challenge name",
      "hook": "Reframing observation that changes how they think about this challenge. 1-2 sentences.",
      "whyItMatters": {
        "whatAOsSee": "Exactly what admissions officers see when they encounter this in the transcript.",
        "whatItActuallyMeans": "The honest diagnosis — is this truly a problem, or is it being blown out of proportion?",
        "consequenceOfIgnoring": "What happens if they do nothing about this. Be specific."
      },
      "teaching": {
        "rootCauseDiagnosis": "Why this challenge exists. Not 'you got a B' but WHY the B happened and what it tells us.",
        "stepByStepFix": ["Step 1...", "Step 2...", "Step 3..."],
        "timeframe": "How long the fix takes and when results will show.",
        "beforeAfterExample": "Concrete before/after: what their profile looks like now vs what it could look like after implementing the fix."
      },
      "researchBacking": [
        { "claim": "Specific claim", "value": "Data point", "source": "Verified source" }
      ]
    }
  ]
}`;

    const userPrompt = `Analyze these academic challenges in depth:

CHALLENGE SUBJECTS:
${challengeSubjects.map(([subj, p]) => {
  const courses = p.performanceHistory.courses.map(c => `${c.name} (${c.level}): ${c.grade.toFixed(1)}`).join(', ');
  return `- ${formatSubject(subj)}: ${p.performanceHistory.avgGPA.toFixed(2)} avg GPA, ${Math.round(p.relativeStrength * 100)}% relative (below average), trend: ${p.performanceHistory.trend}
    Courses: ${courses}`;
}).join('\n\n')}

CHALLENGE PATTERNS FROM ANALYSIS:
${challengePatterns.map(c => `- ${c.insight}: ${c.evidence} → ${c.implication}`).join('\n')}

RED FLAGS:
${redFlags.map(r => `- [${r.severity}] ${r.description} — How to address: ${r.howToAddress}`).join('\n')}

CHALLENGE RESPONSE DATA:
- Typical impact when stepping up difficulty: ${quant.challengeResponse.transitionAnalysis.typicalImpact.toFixed(2)} GPA points
- Adaptation speed: ${quant.challengeResponse.transitionAnalysis.adaptationSpeed}
- Recovery pattern: ${quant.challengeResponse.transitionAnalysis.recoveryPattern}
- Risk level: ${quant.challengeResponse.challengeRiskProfile.riskLevel}/100
- Risk factors: ${quant.challengeResponse.challengeRiskProfile.riskFactors.join('; ')}
- Protective factors: ${quant.challengeResponse.challengeRiskProfile.protectiveFactors.join('; ')}

PERFORMANCE ENVELOPE:
- Floor: ${quant.performanceEnvelope.floor.gpa.toFixed(2)} (${quant.performanceEnvelope.floor.conditions})
- How to avoid floor: ${quant.performanceEnvelope.floor.howToAvoid}

INTENDED MAJOR: ${ctx.input.intendedMajor || 'Undecided'}
GRADE: ${ctx.input.currentGrade}

VERIFIED STATISTICS (cite these, don't invent):
${relevantStats.map(s => `- ${s.claim}: ${s.value} (${s.citation})`).join('\n')}`;

    const response = await callClaude<string>({
      model: MODEL,
      systemPrompt,
      userPrompt,
      maxTokens: MAX_TOKENS_PER_SECTION,
      temperature: 0.3,
      // useJsonMode off: parseClaudeJSON handles robust JSON extraction
    });

    this.trackUsage(response.usage);
    const parsed = parseClaudeJSON<unknown>(response.content, 'challengeDeepDives');
    return extractArray<ChallengeDeepDive>(parsed);
  }

  // ==========================================================================
  // SECTION 4: ADMISSIONS OFFICER LENS (LLM)
  // ==========================================================================

  private async generateAOLens(ctx: AssembledReportContext): Promise<AdmissionsOfficerLensSection> {
    const quant = ctx.quantitativeAnalysis;
    const overallGPA = calculateOverallGPA(quant);
    const research = ctx.assembledResearch;

    const systemPrompt = `You are a former admissions officer at a top-20 university writing an honest assessment of a student's transcript. Your job is to show the student things they CANNOT see themselves — the gap between their perception and the admissions reality.

Output valid JSON:
{
  "firstGlance": "3-4 sentences: What catches your eye in the first 30 seconds of reading this transcript. Be candid — what's the gut reaction? What questions immediately form?",
  "blindSpots": [
    {
      "studentPerception": "What the student probably thinks about this aspect of their profile.",
      "aoReality": "What admissions officers actually think when they see it.",
      "howToFix": "Specific action to align perception with reality."
    }
  ],
  "unintendedNarrative": "2-3 sentences: The accidental story this transcript tells. Course choices, grade patterns, and rigor levels combine to tell a story the student may not intend. What story is their transcript accidentally telling?",
  "narrativeControlStrategy": "2-3 sentences: How to take control of the narrative. What changes in senior year scheduling, essay framing, or additional context would reshape the story?"
}

Include 2-4 blind spots. Focus on things that genuinely surprise students.`;

    const userPrompt = `Assess this transcript through an admissions officer's eyes:

OVERALL GPA: ${overallGPA.toFixed(2)}
WEIGHTED ESTIMATE: ~${(overallGPA + 0.3).toFixed(2)}
SCHOOL TYPE: ${ctx.input.schoolContext.type.replace(/_/g, ' ')}

SUBJECT PERFORMANCE (what you see on the transcript):
${Object.entries(quant.subjectPatterns)
  .map(([subj, p]) => {
    const courses = p.performanceHistory.courses
      .map(c => `${c.name}: ${c.grade >= 3.7 ? 'A-/A' : c.grade >= 3.3 ? 'B+' : c.grade >= 3.0 ? 'B' : 'B-/C+'}`)
      .join(', ');
    return `${formatSubject(subj)}: ${courses}`;
  }).join('\n')}

TRAJECTORY: ${quant.progressionTrajectory.historical.overallTrend}
GPA TREND: ${quant.progressionTrajectory.historical.gpaByYear.map(y => `${y.year}: ${y.gpa.toFixed(2)} (rigor: ${y.rigorLevel.toFixed(1)})`).join(' → ')}

INTENDED MAJOR: ${ctx.input.intendedMajor || 'Undecided'}
GRADE: ${ctx.input.currentGrade}

RIGOR CONTEXT:
- Sweet spot: ${quant.performanceFingerprint.sweetSpot.level}
- Difficulty sensitivity: ${quant.performanceFingerprint.difficultySensitivity}
- Consistency: ${quant.performanceFingerprint.consistencyScore}%

COLLEGE EXPECTATIONS:
${research.collegeExpectations ? `Tier: ${research.collegeExpectations.tier}, GPA range: ${research.collegeExpectations.gpaRange}, AP range: ${research.collegeExpectations.apCourseRange}` : 'Not specified'}

STRENGTHS FROM ANALYSIS: ${quant.synthesis.strengths.map(s => s.insight).join('; ')}
CHALLENGES FROM ANALYSIS: ${quant.synthesis.challenges.map(s => s.insight).join('; ')}`;

    const response = await callClaude<string>({
      model: MODEL,
      systemPrompt,
      userPrompt,
      maxTokens: MAX_TOKENS_PER_SECTION,
      temperature: 0.3,
      // useJsonMode off: parseClaudeJSON handles robust JSON extraction
    });

    this.trackUsage(response.usage);
    return parseClaudeJSON<AdmissionsOfficerLensSection>(response.content, 'aoLens');
  }

  // ==========================================================================
  // SECTION 5: STRATEGIC ROADMAP (LLM)
  // ==========================================================================

  private async generateStrategicRoadmap(ctx: AssembledReportContext): Promise<StrategicRoadmapSection> {
    const planning = ctx.planningAdvice;
    const quant = ctx.quantitativeAnalysis;
    const research = ctx.assembledResearch;

    const systemPrompt = `You are an expert academic advisor writing a strategic roadmap for a student's remaining high school career. Prioritize ruthlessly — give them the 3 most impactful actions, not a laundry list.

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

    const userPrompt = `Create a strategic roadmap for this student:

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

    // Section 1: Academic Identity from templates
    const academicIdentity: AcademicIdentitySection = {
      narrativeIdentity: `${synthesis.profileSummary}\n\n${synthesis.coreInsight} ${synthesis.uniquePattern}`,
      harvardScaleRating: {
        rating: overallGPA >= 3.85 ? 2 : overallGPA >= 3.6 ? 3 : overallGPA >= 3.3 ? 4 : 5,
        label: overallGPA >= 3.85 ? 'Magna Potential' : overallGPA >= 3.6 ? 'Cum Laude Potential' : overallGPA >= 3.3 ? 'Strong Academic' : 'Adequate Preparation',
        explanation: `Your ${overallGPA.toFixed(2)} GPA with ${quant.performanceFingerprint.difficultySensitivity} difficulty sensitivity places you in this range.`,
        biggestLever: planning.trajectoryAssessment?.recommendation || 'Increase course rigor in your strongest subjects.',
      },
      aoFirstImpression: `A ${overallGPA.toFixed(2)} GPA student with a ${quant.progressionTrajectory.historical.overallTrend} trajectory and ${quant.performanceFingerprint.consistencyScore}% consistency.`,
      trajectoryMeaning: `Your ${quant.progressionTrajectory.historical.overallTrend} trajectory ${
        quant.progressionTrajectory.historical.overallTrend === 'improving' || quant.progressionTrajectory.historical.overallTrend === 'accelerating'
          ? 'is a positive signal that admissions officers value highly.'
          : quant.progressionTrajectory.historical.overallTrend === 'declining'
            ? 'is a concern that needs to be addressed with a visible recovery.'
            : 'shows stability — which is good, but could be strengthened by adding rigor.'
      }`,
      definingPattern: synthesis.uniquePattern,
    };

    // Section 2: Strength Deep Dives from ProfileInsights
    const strengthDeepDives: StrengthDeepDive[] = synthesis.strengths.map(s => ({
      title: s.insight,
      hook: s.evidence,
      whyItMatters: {
        forAdmissionsOfficers: s.implication,
        forYourMajor: ctx.input.intendedMajor ? `This connects to your interest in ${ctx.input.intendedMajor}.` : 'This strength opens doors across multiple fields.',
        forYourNarrative: 'This pattern can become a central thread in your application narrative.',
      },
      blindSpotInsight: ctx.profileInsights.find(pi =>
        pi.observation.toLowerCase().includes(s.insight.toLowerCase().split(' ')[0])
      )?.interpretation || 'An admissions consultant would note this as a distinguishing factor.',
      actionableGuidance: {
        leverageStrategy: s.implication,
        courseRecommendation: 'Continue at AP level in this area to validate this strength with coursework evidence.',
        narrativeAngle: 'Feature this strength in your application essays and activity descriptions.',
      },
      researchBacking: [],
    }));

    // Section 3: Challenge Deep Dives from ProfileInsights
    const challengeDeepDives: ChallengeDeepDive[] = synthesis.challenges.map(c => ({
      title: c.insight,
      hook: `This is less of a weakness and more of an opportunity — here's why.`,
      whyItMatters: {
        whatAOsSee: c.evidence,
        whatItActuallyMeans: c.implication,
        consequenceOfIgnoring: 'If unaddressed, this pattern may raise questions in your application.',
      },
      teaching: {
        rootCauseDiagnosis: ctx.profileInsights.find(pi =>
          pi.observation.toLowerCase().includes(c.insight.toLowerCase().split(' ')[0])
        )?.interpretation || 'This likely stems from a mismatch between course demands and your preparation.',
        stepByStepFix: [c.implication],
        timeframe: 'This can be addressed over the next semester with focused effort.',
        beforeAfterExample: `Current: ${c.evidence}. After: With targeted action, this could become a non-issue.`,
      },
      researchBacking: [],
    }));

    // Section 4: AO Lens from templates
    const admissionsOfficerLens: AdmissionsOfficerLensSection = {
      firstGlance: `An admissions officer would first notice your ${overallGPA.toFixed(2)} GPA and ${quant.progressionTrajectory.historical.overallTrend} trajectory. Your course rigor and subject balance would be evaluated next.`,
      blindSpots: [{
        studentPerception: 'My grades tell the full story of my academic ability.',
        aoReality: 'Grades are context-dependent. AOs evaluate rigor, trajectory, and school context alongside raw GPA.',
        howToFix: 'Ensure your course selection demonstrates appropriate challenge in your areas of strength.',
      }],
      unintendedNarrative: `Your current course selections and grade patterns tell a story of ${
        quant.progressionTrajectory.historical.overallTrend === 'improving' ? 'growth and increasing engagement' : 'steady performance'
      }. Make sure this aligns with the narrative you want to present.`,
      narrativeControlStrategy: 'Take control of your academic narrative by aligning senior year course choices with your intended major and addressing any identified gaps.',
    };

    // Section 5: Strategic Roadmap from planning advice
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
      strengthDeepDives,
      challengeDeepDives,
      admissionsOfficerLens,
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
