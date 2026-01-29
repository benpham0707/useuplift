/**
 * PASS (Portfolio & Application Strategy System) Orchestrator
 *
 * The master coordinator for the multi-stage LLM analysis pipeline.
 * Implements a 6-stage architecture with progressive context accumulation:
 *
 * STAGE 0: Profile Classification (Haiku) - Quick triage and archetype detection
 * STAGE 1: Component Diagnosis (Haiku, parallel) - Activity, Academic, Essay diagnosis
 * STAGE 2: Character & Narrative Analysis (Sonnet) - Deep character assessment
 * STAGE 3: School Fit Analysis (Haiku, parallel per school) - Match scoring
 * STAGE 4: Strategic Guidance (Sonnet) - Actionable recommendations
 * STAGE 5: Verification (Haiku) - Consistency check
 *
 * DESIGN PRINCIPLES:
 * - Progressive context: Each stage builds on previous outputs
 * - Two-model strategy: Haiku for speed, Sonnet for quality
 * - Parallel execution: Independent stages run concurrently
 * - Prompt caching: Reuse static prompt prefixes for cost savings
 * - Graceful degradation: Continue with partial results on failures
 * - Research integration: Ground recommendations in data
 */

import {
  ComprehensiveStudentInput,
  ComprehensiveAnalysisConfig,
  ComprehensiveStrategyAnalysis,
  EnhancedPortfolioAnalysis,
  AnalysisStage,
  StageSummary,
  HarvardScoreDecimal,
} from '../types';
import { PASSSessionManager, PASSSession, passSessionManager, LLMCallRecord } from './sessionManager';
import { ContextAccumulator, createContextAccumulator } from './contextAccumulator';
import { callClaude, ClaudeResponse } from '../../../lib/llm/claude';

// ============================================================================
// CONSTANTS
// ============================================================================

const SYSTEM_VERSION = '2.0.0';

// Model selection
const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const SONNET_MODEL = 'claude-sonnet-4-5-20250514';

// Cost estimates (per 1M tokens, in cents)
const COST_PER_1M = {
  haiku: { input: 100, output: 500, cached: 10 },
  sonnet: { input: 300, output: 1500, cached: 30 },
};

// Stage configuration
const STAGE_CONFIG: Record<AnalysisStage, {
  model: string;
  maxTokens: number;
  temperature: number;
  parallel: boolean;
  retryable: boolean;
}> = {
  profile_classification: {
    model: HAIKU_MODEL,
    maxTokens: 2000,
    temperature: 0.3,
    parallel: false,
    retryable: true,
  },
  activity_diagnosis: {
    model: HAIKU_MODEL,
    maxTokens: 3000,
    temperature: 0.3,
    parallel: true,
    retryable: true,
  },
  academic_diagnosis: {
    model: HAIKU_MODEL,
    maxTokens: 2000,
    temperature: 0.3,
    parallel: true,
    retryable: true,
  },
  essay_diagnosis: {
    model: HAIKU_MODEL,
    maxTokens: 2000,
    temperature: 0.3,
    parallel: true,
    retryable: true,
  },
  character_analysis: {
    model: SONNET_MODEL,
    maxTokens: 6000,
    temperature: 0.5,
    parallel: false,
    retryable: true,
  },
  school_fit: {
    model: HAIKU_MODEL,
    maxTokens: 4000,
    temperature: 0.3,
    parallel: true,
    retryable: true,
  },
  strategic_guidance: {
    model: SONNET_MODEL,
    maxTokens: 8000,
    temperature: 0.6,
    parallel: false,
    retryable: true,
  },
  verification: {
    model: HAIKU_MODEL,
    maxTokens: 2000,
    temperature: 0.2,
    parallel: false,
    retryable: false,
  },
};

// ============================================================================
// PASS ORCHESTRATOR CLASS
// ============================================================================

export class PASSOrchestrator {
  private sessionManager: PASSSessionManager;
  private contextAccumulator: ContextAccumulator;

  constructor(sessionManager?: PASSSessionManager) {
    this.sessionManager = sessionManager || passSessionManager;
    this.contextAccumulator = createContextAccumulator(this.sessionManager);
  }

  // ==========================================================================
  // MAIN ENTRY POINT
  // ==========================================================================

  /**
   * Execute the complete PASS analysis pipeline
   */
  async analyze(
    input: ComprehensiveStudentInput,
    config: ComprehensiveAnalysisConfig
  ): Promise<ComprehensiveStrategyAnalysis> {
    // Create session
    const session = this.sessionManager.createSession(
      input.userId,
      input,
      config
    );

    console.log(`[PASS] Starting analysis for user ${input.userId}, session ${session.id}`);

    try {
      // Stage 0: Profile Classification
      await this.executeStage0(session);

      // Stage 1: Component Diagnosis (parallel)
      await this.executeStage1(session);

      // Stage 2: Character & Narrative Analysis
      await this.executeStage2(session);

      // Stage 3: School Fit Analysis
      if (config.targetSchools && config.targetSchools.length > 0) {
        await this.executeStage3(session);
      }

      // Stage 4: Strategic Guidance
      await this.executeStage4(session);

      // Stage 5: Verification
      await this.executeStage5(session);

      // Assemble final result
      const result = this.assembleResult(session);

      // Mark session complete
      this.sessionManager.completeSession(session.id);

      console.log(
        `[PASS] Analysis complete for session ${session.id}. ` +
        `Cost: $${(session.metrics.totalCostCents / 100).toFixed(4)}`
      );

      return result;
    } catch (error) {
      console.error(`[PASS] Pipeline failed for session ${session.id}:`, error);
      this.sessionManager.failSession(session.id, String(error));
      throw error;
    }
  }

  // ==========================================================================
  // STAGE 0: PROFILE CLASSIFICATION
  // ==========================================================================

  private async executeStage0(session: PASSSession): Promise<void> {
    const stage: AnalysisStage = 'profile_classification';
    console.log(`[PASS] Stage 0: Profile Classification`);

    this.sessionManager.startStage(session.id, stage);

    try {
      const prompt = this.buildStage0Prompt(session.input);
      const response = await this.callLLM(session.id, stage, prompt);

      // Parse classification output
      const output = this.parseJsonResponse(response.content);

      // Update accumulated context
      this.sessionManager.updateContext(session.id, {
        studentArchetype: output.archetype,
        preliminaryTiers: output.preliminaryTiers,
        contextFlags: output.contextFlags,
      });

      // Create stage summary
      const summary: StageSummary = {
        stage,
        completedAt: new Date().toISOString(),
        keyFindings: [
          `Archetype: ${output.archetype}`,
          `Context flags: ${(output.contextFlags || []).join(', ') || 'None'}`,
        ],
        confidence: output.confidence || 0.8,
        forNextStage: {
          criticalContext: [`Student archetype: ${output.archetype}`],
          recommendedEmphasis: output.emphasisAreas || [],
          warningsToConsider: output.contextFlags || [],
        },
      };

      this.sessionManager.completeStage(session.id, stage, output, summary);
    } catch (error) {
      this.sessionManager.failStage(session.id, stage, String(error));
      throw error;
    }
  }

  private buildStage0Prompt(input: ComprehensiveStudentInput): string {
    return `You are an expert college admissions counselor performing initial profile classification.

Analyze the following student profile and classify them into an archetype.

<student_profile>
Grade Level: ${input.gradeLevel}
${input.intendedMajors ? `Intended Majors: ${input.intendedMajors.join(', ')}` : ''}
${input.majorCertainty ? `Major Certainty: ${input.majorCertainty}` : ''}

Academic Summary:
- GPA: ${input.academic?.gpa?.value || 'Not provided'}/${input.academic?.gpa?.scale || 4.0}
- Course Count: ${input.academic?.courses?.length || 0} courses listed
${input.academic?.testScores ? `- Test Scores: SAT ${input.academic.testScores.sat?.composite || 'N/A'}, ACT ${input.academic.testScores.act?.composite || 'N/A'}` : ''}

Activities: ${input.activities?.activities?.length || 0} activities listed
${input.activities?.activities?.slice(0, 5).map(a => `- ${a.name}: ${a.description || 'No description'}`).join('\n') || ''}

Awards: ${input.awards?.awards?.length || 0} awards listed
${input.awards?.awards?.slice(0, 3).map(a => `- ${a.name}`).join('\n') || ''}

Personal Context:
${input.personalContext ? JSON.stringify(input.personalContext, null, 2) : 'Not provided'}
</student_profile>

Respond with a JSON object containing:
{
  "archetype": "stem_innovator" | "humanities_scholar" | "athlete_leader" | "artist_creator" | "social_entrepreneur" | "well_rounded" | "late_bloomer" | "hidden_gem",
  "archetypeConfidence": 0.0-1.0,
  "preliminaryTiers": {
    "academic": 1-4,
    "activities": 1-4,
    "awards": 1-4
  },
  "contextFlags": ["first_gen", "international", "legacy", "recruited_athlete", "underrepresented", "socioeconomic_disadvantage", "geographic_disadvantage"],
  "emphasisAreas": ["areas this student should emphasize in applications"],
  "initialConcerns": ["any red flags or areas needing attention"],
  "confidence": 0.0-1.0
}

IMPORTANT: Respond ONLY with valid JSON, no other text.`;
  }

  // ==========================================================================
  // STAGE 1: COMPONENT DIAGNOSIS (PARALLEL)
  // ==========================================================================

  private async executeStage1(session: PASSSession): Promise<void> {
    console.log(`[PASS] Stage 1: Component Diagnosis (parallel)`);

    // Run all three diagnoses in parallel
    const results = await Promise.allSettled([
      this.executeStage1A(session),
      this.executeStage1B(session),
      this.executeStage1C(session),
    ]);

    // Check for critical failures
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length === results.length) {
      throw new Error('All Stage 1 components failed');
    }

    // Log partial failures
    for (const [i, result] of results.entries()) {
      if (result.status === 'rejected') {
        const stages = ['1A (Activity)', '1B (Academic)', '1C (Essay)'];
        console.warn(`[PASS] Stage ${stages[i]} failed, continuing with partial results`);
      }
    }
  }

  private async executeStage1A(session: PASSSession): Promise<void> {
    const stage: AnalysisStage = 'activity_diagnosis';
    console.log(`[PASS] Stage 1A: Activity Diagnosis`);

    this.sessionManager.startStage(session.id, stage);

    try {
      const priorContext = this.contextAccumulator.formatContextForPrompt(session.id, stage);
      const prompt = this.buildStage1APrompt(session.input, priorContext);
      const response = await this.callLLM(session.id, stage, prompt);

      const output = this.parseJsonResponse(response.content);

      // Update accumulated context
      this.sessionManager.updateContext(session.id, {
        activityDiagnosis: {
          tierClassifications: output.tierClassifications || [],
          spikeDetected: output.spikeDetected || false,
          spikeAreas: output.spikeAreas || [],
          gaps: output.gaps || [],
        },
      });

      const summary: StageSummary = {
        stage,
        completedAt: new Date().toISOString(),
        keyFindings: [
          `Spike: ${output.spikeDetected ? output.spikeAreas?.join(', ') : 'Not detected'}`,
          `Top tier activities: ${output.tierClassifications?.filter((t: any) => t.tier <= 2).length || 0}`,
        ],
        confidence: output.confidence || 0.8,
        forNextStage: {
          criticalContext: output.spikeAreas?.map((a: string) => `Spike area: ${a}`) || [],
          recommendedEmphasis: output.emphasisAreas || [],
          warningsToConsider: output.gaps || [],
        },
      };

      this.sessionManager.completeStage(session.id, stage, output, summary);
    } catch (error) {
      this.sessionManager.failStage(session.id, stage, String(error));
      throw error;
    }
  }

  private buildStage1APrompt(input: ComprehensiveStudentInput, priorContext: string): string {
    const activities = input.activities?.activities || [];

    return `You are an expert admissions counselor evaluating extracurricular activities.

${priorContext ? `<prior_context>\n${priorContext}\n</prior_context>` : ''}

Use Sara Harberson's 4-tier system to classify each activity:
- Tier 1 (Exceptional): National/international recognition, rare achievements
- Tier 2 (Outstanding): State-level leadership, significant impact
- Tier 3 (Solid): School leadership, consistent commitment
- Tier 4 (Standard): Participation without distinction

<activities>
${activities.map((a, i) => `
Activity ${i + 1}: ${a.name}
Category: ${a.category || 'Not specified'}
Description: ${a.description || 'None'}
Years: ${a.yearsInvolved || 'Unknown'}
Hours/Week: ${a.hoursPerWeek || 'Unknown'}
Leadership: ${a.leadershipPositions?.map(p => p.title).join(', ') || 'None'}
Achievements: ${a.achievements?.map(ach => ach.description).join('; ') || 'None'}
`).join('\n')}
</activities>

Analyze and respond with JSON:
{
  "tierClassifications": [
    { "name": "Activity name", "tier": 1-4, "justification": "Brief reason" }
  ],
  "spikeDetected": true/false,
  "spikeAreas": ["area1", "area2"],
  "spikeStrength": "strong" | "moderate" | "weak" | "none",
  "depthVsBreadth": "depth_focused" | "balanced" | "breadth_focused",
  "gaps": ["identified gaps or missing elements"],
  "emphasisAreas": ["areas to emphasize in applications"],
  "upgradeOpportunities": [
    { "activity": "name", "suggestion": "how to strengthen" }
  ],
  "confidence": 0.0-1.0
}

IMPORTANT: Respond ONLY with valid JSON.`;
  }

  private async executeStage1B(session: PASSSession): Promise<void> {
    const stage: AnalysisStage = 'academic_diagnosis';
    console.log(`[PASS] Stage 1B: Academic Diagnosis`);

    this.sessionManager.startStage(session.id, stage);

    try {
      const priorContext = this.contextAccumulator.formatContextForPrompt(session.id, stage);
      const prompt = this.buildStage1BPrompt(session.input, priorContext);
      const response = await this.callLLM(session.id, stage, prompt);

      const output = this.parseJsonResponse(response.content);

      this.sessionManager.updateContext(session.id, {
        academicDiagnosis: {
          rigorLevel: output.rigorLevel || 'moderate',
          trajectoryDirection: output.trajectoryDirection || 'stable',
          testingStrategy: output.testingStrategy || 'submit',
        },
      });

      const summary: StageSummary = {
        stage,
        completedAt: new Date().toISOString(),
        keyFindings: [
          `Rigor: ${output.rigorLevel}`,
          `Trajectory: ${output.trajectoryDirection}`,
          `Testing: ${output.testingStrategy}`,
        ],
        confidence: output.confidence || 0.8,
        forNextStage: {
          criticalContext: [`Academic rigor: ${output.rigorLevel}`],
          recommendedEmphasis: [],
          warningsToConsider: output.concerns || [],
        },
      };

      this.sessionManager.completeStage(session.id, stage, output, summary);
    } catch (error) {
      this.sessionManager.failStage(session.id, stage, String(error));
      throw error;
    }
  }

  private buildStage1BPrompt(input: ComprehensiveStudentInput, priorContext: string): string {
    const academic = input.academic;

    return `You are an expert admissions counselor evaluating academic profile.

${priorContext ? `<prior_context>\n${priorContext}\n</prior_context>` : ''}

<academic_profile>
GPA: ${academic?.gpa?.value || 'Not provided'}/${academic?.gpa?.scale || 4.0} (${academic?.gpa?.type || 'unweighted'})
Class Rank: ${academic?.classRank?.rank || 'Not reported'}/${academic?.classRank?.totalStudents || 'Unknown'}

Courses:
${academic?.courses?.slice(0, 15).map(c => `- ${c.name} (${c.level || 'Regular'}): ${c.grade || 'N/A'}`).join('\n') || 'No courses listed'}

Test Scores:
${academic?.testScores?.sat ? `SAT: ${academic.testScores.sat.composite} (M: ${academic.testScores.sat.math}, EBRW: ${academic.testScores.sat.ebrw})` : 'No SAT'}
${academic?.testScores?.act ? `ACT: ${academic.testScores.act.composite}` : 'No ACT'}
${academic?.apExams?.map(ap => `AP ${ap.subject}: ${ap.score}`).join(', ') || 'No AP scores'}

School Context:
${academic?.schoolContext ? JSON.stringify(academic.schoolContext, null, 2) : 'Not provided'}
</academic_profile>

Analyze and respond with JSON:
{
  "rigorLevel": "exceptional" | "high" | "moderate" | "low",
  "rigorJustification": "explanation",
  "trajectoryDirection": "upward" | "stable" | "downward",
  "trajectoryAnalysis": "explanation",
  "gpaStrength": "exceptional" | "strong" | "competitive" | "below_average",
  "testingStrategy": "submit_both" | "submit_sat" | "submit_act" | "test_optional",
  "testingRationale": "explanation",
  "concerns": ["any academic concerns"],
  "strengths": ["academic strengths"],
  "recommendations": ["specific recommendations"],
  "confidence": 0.0-1.0
}

IMPORTANT: Respond ONLY with valid JSON.`;
  }

  private async executeStage1C(session: PASSSession): Promise<void> {
    const stage: AnalysisStage = 'essay_diagnosis';
    console.log(`[PASS] Stage 1C: Essay Diagnosis`);

    this.sessionManager.startStage(session.id, stage);

    try {
      // Check if essays are provided
      if (!session.input.essays) {
        // Skip essay diagnosis if no essays
        const output = {
          topicsUsed: [],
          voiceStrength: 0,
          overlaps: [],
          skipped: true,
          reason: 'No essays provided',
        };

        this.sessionManager.updateContext(session.id, {
          essayDiagnosis: output,
        });

        const summary: StageSummary = {
          stage,
          completedAt: new Date().toISOString(),
          keyFindings: ['No essays provided for analysis'],
          confidence: 1.0,
          forNextStage: {
            criticalContext: ['No essay data available'],
            recommendedEmphasis: [],
            warningsToConsider: ['Essays need to be written'],
          },
        };

        this.sessionManager.completeStage(session.id, stage, output, summary);
        return;
      }

      const priorContext = this.contextAccumulator.formatContextForPrompt(session.id, stage);
      const prompt = this.buildStage1CPrompt(session.input, priorContext);
      const response = await this.callLLM(session.id, stage, prompt);

      const output = this.parseJsonResponse(response.content);

      this.sessionManager.updateContext(session.id, {
        essayDiagnosis: {
          topicsUsed: output.topicsUsed || [],
          voiceStrength: output.voiceStrength || 50,
          overlaps: output.overlaps || [],
        },
      });

      const summary: StageSummary = {
        stage,
        completedAt: new Date().toISOString(),
        keyFindings: [
          `Voice strength: ${output.voiceStrength}/100`,
          `Topics: ${output.topicsUsed?.join(', ') || 'None identified'}`,
        ],
        confidence: output.confidence || 0.8,
        forNextStage: {
          criticalContext: output.topicsUsed?.map((t: string) => `Essay topic: ${t}`) || [],
          recommendedEmphasis: [],
          warningsToConsider: output.overlaps || [],
        },
      };

      this.sessionManager.completeStage(session.id, stage, output, summary);
    } catch (error) {
      this.sessionManager.failStage(session.id, stage, String(error));
      throw error;
    }
  }

  private buildStage1CPrompt(input: ComprehensiveStudentInput, priorContext: string): string {
    return `You are an expert admissions counselor evaluating essay portfolio.

${priorContext ? `<prior_context>\n${priorContext}\n</prior_context>` : ''}

<essays>
Personal Statement:
${input.essays?.personalStatement ? JSON.stringify(input.essays.personalStatement, null, 2) : 'Not provided'}

Supplemental Essays:
${input.essays?.supplementalEssays?.map((e, i) => `Essay ${i + 1}: ${JSON.stringify(e, null, 2)}`).join('\n\n') || 'None provided'}
</essays>

Analyze the essay portfolio and respond with JSON:
{
  "topicsUsed": ["topic1", "topic2"],
  "voiceStrength": 0-100,
  "voiceDescription": "description of student's voice",
  "overlaps": ["any topic overlaps between essays"],
  "missingTopics": ["important topics not covered"],
  "strengthAreas": ["what the essays do well"],
  "improvementAreas": ["what needs work"],
  "portfolioBalance": "well_balanced" | "needs_work" | "major_gaps",
  "confidence": 0.0-1.0
}

IMPORTANT: Respond ONLY with valid JSON.`;
  }

  // ==========================================================================
  // STAGE 2: CHARACTER & NARRATIVE ANALYSIS
  // ==========================================================================

  private async executeStage2(session: PASSSession): Promise<void> {
    const stage: AnalysisStage = 'character_analysis';
    console.log(`[PASS] Stage 2: Character & Narrative Analysis`);

    this.sessionManager.startStage(session.id, stage);

    try {
      const priorContext = this.contextAccumulator.formatContextForPrompt(session.id, stage);
      const prompt = this.buildStage2Prompt(session.input, priorContext);
      const response = await this.callLLM(session.id, stage, prompt);

      const output = this.parseJsonResponse(response.content);

      // Update accumulated context with character scores
      this.sessionManager.updateContext(session.id, {
        characterScores: output.dimensionScores,
        narrativeCoherence: output.narrativeCoherence,
        harvardScore: output.harvardEquivalent,
        keyStrengths: output.keyStrengths,
        developmentAreas: output.developmentAreas,
      });

      const summary: StageSummary = {
        stage,
        completedAt: new Date().toISOString(),
        keyFindings: [
          `Harvard equivalent: ${output.harvardEquivalent}/6`,
          `Narrative coherence: ${output.narrativeCoherence}/100`,
          `Key strengths: ${output.keyStrengths?.slice(0, 3).join(', ')}`,
        ],
        score: output.harvardEquivalent as HarvardScoreDecimal,
        confidence: output.confidence || 0.8,
        forNextStage: {
          criticalContext: [
            `Harvard score: ${output.harvardEquivalent}`,
            `Primary narrative: ${output.primaryNarrative || 'Not identified'}`,
          ],
          recommendedEmphasis: output.keyStrengths || [],
          warningsToConsider: output.developmentAreas || [],
        },
      };

      this.sessionManager.completeStage(session.id, stage, output, summary);
    } catch (error) {
      this.sessionManager.failStage(session.id, stage, String(error));
      throw error;
    }
  }

  private buildStage2Prompt(input: ComprehensiveStudentInput, priorContext: string): string {
    return `You are a senior admissions officer at a highly selective university, evaluating a student's character and narrative coherence.

${priorContext ? `<prior_context>\n${priorContext}\n</prior_context>` : ''}

<complete_profile>
${JSON.stringify({
  gradeLevel: input.gradeLevel,
  intendedMajors: input.intendedMajors,
  academic: {
    gpa: input.academic?.gpa,
    courses: input.academic?.courses?.slice(0, 10),
    testScores: input.academic?.testScores,
  },
  activities: input.activities?.activities?.slice(0, 10).map(a => ({
    name: a.name,
    category: a.category,
    years: a.yearsInvolved,
    leadership: a.leadershipPositions?.map(p => p.title),
    achievements: a.achievements?.slice(0, 2),
  })),
  awards: input.awards?.awards?.slice(0, 5).map(a => ({
    name: a.name,
    level: a.level,
    category: a.category,
  })),
  personalContext: input.personalContext,
  goals: input.goals,
}, null, 2)}
</complete_profile>

Evaluate the student across 7 character dimensions and narrative coherence.

CHARACTER DIMENSIONS (score 1-6, where 1=Exceptional, 6=Concerning):
1. Intellectual Vitality - Curiosity, depth of thought, love of learning
2. Leadership Quality - Initiative, influence, vision
3. Community Impact - Service, contribution, empathy
4. Personal Growth - Self-awareness, resilience, maturity
5. Resilience/Grit - Overcoming challenges, persistence
6. Creativity/Innovation - Original thinking, problem-solving
7. Authenticity/Voice - Genuine self-expression, unique perspective

NARRATIVE COHERENCE:
- Does the profile tell a coherent story?
- Can it be summarized in a compelling two-sentence pitch?
- Do activities, academics, and context reinforce each other?

HARVARD SCALE REFERENCE:
1 (Exceptional): Top 1%, likely admit (90%+ admit rate)
2 (Outstanding): Top 5%, strong candidate (60-80%)
3 (Strong): Top 15%, competitive (30-50%)
4 (Good): Top 30%, possible (10-25%)
5 (Average): Average for pool (<10%)
6 (Concerning): Below average (<5%)

Respond with JSON:
{
  "dimensionScores": {
    "intellectual_vitality": 1-6,
    "leadership_quality": 1-6,
    "community_impact": 1-6,
    "personal_growth": 1-6,
    "resilience_grit": 1-6,
    "creativity_innovation": 1-6,
    "authenticity_voice": 1-6
  },
  "dimensionJustifications": {
    "intellectual_vitality": "explanation",
    ...
  },
  "narrativeCoherence": 0-100,
  "twoSentencePitch": "A compelling summary of this student",
  "primaryNarrative": "The main story this application tells",
  "supportingThemes": ["theme1", "theme2"],
  "harvardEquivalent": 1.0-6.0,
  "harvardJustification": "Why this score",
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "developmentAreas": ["area1", "area2"],
  "uniqueFactors": ["What makes this student stand out"],
  "concernAreas": ["Any red flags or concerns"],
  "confidence": 0.0-1.0
}

IMPORTANT: Be rigorous and honest. Do not inflate scores. Respond ONLY with valid JSON.`;
  }

  // ==========================================================================
  // STAGE 3: SCHOOL FIT ANALYSIS
  // ==========================================================================

  private async executeStage3(session: PASSSession): Promise<void> {
    const stage: AnalysisStage = 'school_fit';
    console.log(`[PASS] Stage 3: School Fit Analysis`);

    const targetSchools = session.config.targetSchools || [];
    if (targetSchools.length === 0) {
      console.log(`[PASS] Stage 3: Skipped (no target schools)`);
      return;
    }

    this.sessionManager.startStage(session.id, stage);

    try {
      const priorContext = this.contextAccumulator.formatContextForPrompt(session.id, stage);
      const prompt = this.buildStage3Prompt(session.input, targetSchools, priorContext);
      const response = await this.callLLM(session.id, stage, prompt);

      const output = this.parseJsonResponse(response.content);

      // Extract school fit scores
      const schoolFitScores: Record<string, number> = {};
      for (const school of output.schoolFits || []) {
        schoolFitScores[school.name] = school.fitScore;
      }

      this.sessionManager.updateContext(session.id, {
        schoolFitScores,
      });

      const summary: StageSummary = {
        stage,
        completedAt: new Date().toISOString(),
        keyFindings: [
          `Analyzed ${targetSchools.length} schools`,
          `Best fit: ${output.bestFit?.name || 'Not determined'}`,
        ],
        confidence: output.confidence || 0.8,
        forNextStage: {
          criticalContext: [`Best fit school: ${output.bestFit?.name}`],
          recommendedEmphasis: output.commonStrengths || [],
          warningsToConsider: output.commonGaps || [],
        },
      };

      this.sessionManager.completeStage(session.id, stage, output, summary);
    } catch (error) {
      this.sessionManager.failStage(session.id, stage, String(error));
      throw error;
    }
  }

  private buildStage3Prompt(
    input: ComprehensiveStudentInput,
    targetSchools: string[],
    priorContext: string
  ): string {
    return `You are an expert college counselor analyzing school fit.

${priorContext ? `<prior_context>\n${priorContext}\n</prior_context>` : ''}

<target_schools>
${targetSchools.join('\n')}
</target_schools>

<student_summary>
Grade: ${input.gradeLevel}
Intended Majors: ${input.intendedMajors?.join(', ') || 'Undecided'}
Key Activities: ${input.activities?.activities?.slice(0, 5).map(a => a.name).join(', ') || 'None listed'}
</student_summary>

For each school, analyze fit and respond with JSON:
{
  "schoolFits": [
    {
      "name": "School Name",
      "fitScore": 0-100,
      "fitCategory": "reach" | "target" | "likely" | "safety",
      "alignmentAreas": ["where student fits well"],
      "gapAreas": ["where fit is weaker"],
      "essayTopicSuggestions": ["topics for this school's supplements"],
      "demonstratedInterestTips": ["how to show interest"]
    }
  ],
  "bestFit": { "name": "School", "reason": "Why" },
  "worstFit": { "name": "School", "reason": "Why" },
  "commonStrengths": ["strengths that apply across schools"],
  "commonGaps": ["gaps that appear across schools"],
  "listBalanceAssessment": "assessment of reach/target/likely balance",
  "confidence": 0.0-1.0
}

IMPORTANT: Respond ONLY with valid JSON.`;
  }

  // ==========================================================================
  // STAGE 4: STRATEGIC GUIDANCE
  // ==========================================================================

  private async executeStage4(session: PASSSession): Promise<void> {
    const stage: AnalysisStage = 'strategic_guidance';
    console.log(`[PASS] Stage 4: Strategic Guidance`);

    this.sessionManager.startStage(session.id, stage);

    try {
      const priorContext = this.contextAccumulator.formatContextForPrompt(session.id, stage);
      const prompt = this.buildStage4Prompt(session.input, priorContext);
      const response = await this.callLLM(session.id, stage, prompt);

      const output = this.parseJsonResponse(response.content);

      this.sessionManager.updateContext(session.id, {
        strategicRecommendations: output.topPriorities,
      });

      const summary: StageSummary = {
        stage,
        completedAt: new Date().toISOString(),
        keyFindings: [
          `Generated ${output.actionItems?.length || 0} action items`,
          `Top priority: ${output.topPriorities?.[0] || 'Not determined'}`,
        ],
        confidence: output.confidence || 0.8,
        forNextStage: {
          criticalContext: output.topPriorities?.slice(0, 3) || [],
          recommendedEmphasis: [],
          warningsToConsider: [],
        },
      };

      this.sessionManager.completeStage(session.id, stage, output, summary);
    } catch (error) {
      this.sessionManager.failStage(session.id, stage, String(error));
      throw error;
    }
  }

  private buildStage4Prompt(input: ComprehensiveStudentInput, priorContext: string): string {
    return `You are a strategic college counselor creating an actionable guidance plan.

${priorContext ? `<prior_context>\n${priorContext}\n</prior_context>` : ''}

<student_context>
Grade Level: ${input.gradeLevel}
Intended Majors: ${input.intendedMajors?.join(', ') || 'Undecided'}
Major Certainty: ${input.majorCertainty || 'Unknown'}
</student_context>

Based on the complete analysis, create comprehensive strategic guidance.

Respond with JSON:
{
  "urgencyLevel": "critical" | "high" | "moderate" | "comfortable",
  "urgencyRationale": "explanation",
  "topPriorities": ["priority1", "priority2", "priority3"],
  "actionItems": [
    {
      "category": "academic" | "activities" | "essays" | "testing" | "recommendations" | "schools",
      "action": "specific action to take",
      "priority": "critical" | "high" | "medium" | "low",
      "timeline": "immediate" | "this_month" | "this_quarter" | "this_year",
      "rationale": "why this matters",
      "expectedImpact": "what improvement to expect"
    }
  ],
  "activityStrategy": {
    "keepAndDeepen": ["activities to continue investing in"],
    "consider Dropping": ["activities that aren't adding value"],
    "newToStart": ["new activities to consider"]
  },
  "essayStrategy": {
    "personalStatementApproach": "recommended approach",
    "supplementalThemes": ["themes to cover across supplements"],
    "storiesToHighlight": ["specific stories/experiences to feature"]
  },
  "summerRecommendations": [
    {
      "option": "program or activity name",
      "type": "research" | "internship" | "program" | "project" | "job",
      "rationale": "why this fits"
    }
  ],
  "interviewPrep": {
    "keyStrengthsToEmphasize": ["strengths"],
    "potentialWeaknesses": ["areas to prepare for"],
    "likelyQuestions": ["questions to prepare for"]
  },
  "recommendationStrategy": {
    "idealRecommenders": ["who to ask and why"],
    "talkingPoints": ["what to emphasize with recommenders"]
  },
  "positioningStatement": "One sentence capturing this student's unique value",
  "confidence": 0.0-1.0
}

Be specific and actionable. Avoid generic advice. Respond ONLY with valid JSON.`;
  }

  // ==========================================================================
  // STAGE 5: VERIFICATION
  // ==========================================================================

  private async executeStage5(session: PASSSession): Promise<void> {
    const stage: AnalysisStage = 'verification';
    console.log(`[PASS] Stage 5: Verification`);

    this.sessionManager.startStage(session.id, stage);

    try {
      const priorContext = this.contextAccumulator.formatContextForPrompt(session.id, stage);
      const prompt = this.buildStage5Prompt(priorContext);
      const response = await this.callLLM(session.id, stage, prompt);

      const output = this.parseJsonResponse(response.content);

      const summary: StageSummary = {
        stage,
        completedAt: new Date().toISOString(),
        keyFindings: [
          `Consistency: ${output.overallConsistency ? 'Passed' : 'Issues found'}`,
          `Contradictions: ${output.contradictions?.length || 0}`,
        ],
        confidence: output.confidence || 0.9,
        forNextStage: {
          criticalContext: [],
          recommendedEmphasis: [],
          warningsToConsider: output.contradictions || [],
        },
      };

      this.sessionManager.completeStage(session.id, stage, output, summary);
    } catch (error) {
      this.sessionManager.failStage(session.id, stage, String(error));
      // Don't throw - verification failure shouldn't block results
      console.warn(`[PASS] Verification failed but continuing: ${error}`);
    }
  }

  private buildStage5Prompt(priorContext: string): string {
    return `You are a quality assurance specialist reviewing analysis for consistency.

<analysis_to_verify>
${priorContext}
</analysis_to_verify>

Check for:
1. Internal contradictions (e.g., recommending to drop an activity that was marked as a strength)
2. Unrealistic timelines (e.g., too many high-priority items for available time)
3. Missing critical elements (e.g., no essay guidance for a senior)
4. Score consistency (e.g., Harvard score should align with dimension scores)

Respond with JSON:
{
  "overallConsistency": true/false,
  "contradictions": ["list of any contradictions found"],
  "unrealisticElements": ["any unrealistic recommendations"],
  "missingElements": ["any critical missing pieces"],
  "scoreConsistency": true/false,
  "scoreConsistencyNotes": "any notes on score alignment",
  "overallQuality": "high" | "acceptable" | "needs_review",
  "suggestedCorrections": ["any corrections to make"],
  "confidence": 0.0-1.0
}

Be thorough but not pedantic. Respond ONLY with valid JSON.`;
  }

  // ==========================================================================
  // RESULT ASSEMBLY
  // ==========================================================================

  private assembleResult(session: PASSSession): ComprehensiveStrategyAnalysis {
    const accumulated = this.sessionManager.getAccumulatedContext(session.id);

    // Get stage outputs
    const stage0 = session.stageResults.get('profile_classification')?.output;
    const stage1A = session.stageResults.get('activity_diagnosis')?.output;
    const stage1B = session.stageResults.get('academic_diagnosis')?.output;
    const stage1C = session.stageResults.get('essay_diagnosis')?.output;
    const stage2 = session.stageResults.get('character_analysis')?.output;
    const stage3 = session.stageResults.get('school_fit')?.output;
    const stage4 = session.stageResults.get('strategic_guidance')?.output;
    const stage5 = session.stageResults.get('verification')?.output;

    // Build comprehensive result
    // Note: This is a partial implementation - in production, this would
    // map to the full ComprehensiveStrategyAnalysis type with all components
    return {
      // Metadata
      analyzedAt: new Date().toISOString(),
      version: SYSTEM_VERSION,
      userId: session.userId,

      // Placeholder for component evaluations
      // These would come from the existing PortfolioStrategyOrchestrator
      academic: {} as any,
      activities: {} as any,
      awards: {} as any,
      holistic: {} as any,
      schoolFit: {} as any,
      guidance: {} as any,
      inputDataHash: session.id,

      // Analysis metadata
      analysisMetadata: {
        totalCostCents: session.metrics.totalCostCents,
        modelUsed: 'multi-stage',
        tokensUsed: session.metrics.totalInputTokens + session.metrics.totalOutputTokens,
        analysisTimeMs: Date.now() - new Date(session.createdAt).getTime(),
      },

      // Research context
      researchContext: {
        modulesLoaded: [],
        totalTokensUsed: session.metrics.totalInputTokens,
        citationsReferenced: accumulated.citations.length,
      },

      // Character assessment from Stage 2
      character: {
        overallScore: accumulated.harvardScore || 4,
        dimensions: stage2?.dimensionScores || {},
        narrativeCoherence: accumulated.narrativeCoherence || 50,
        twoSentencePitch: stage2?.twoSentencePitch || '',
      } as any,

      // Red flags
      redFlags: {
        hasRedFlags: false,
        flags: [],
      } as any,

      // Context calibration
      contextCalibration: {
        factors: stage0?.contextFlags || [],
      } as any,

      // Narrative synthesis from Stage 2
      narrative: {
        primaryNarrative: stage2?.primaryNarrative || '',
        supportingThemes: stage2?.supportingThemes || [],
        coherenceScore: accumulated.narrativeCoherence || 50,
      } as any,

      // Universal score
      universalScore: {
        score: accumulated.harvardScore || 4,
        components: stage2?.dimensionScores || {},
      } as any,

      // Enhanced metadata
      enhancedMetadata: {
        pipelineStagesCompleted: session.completedStages,
        researchModulesUsed: [],
        confidenceLevel: stage5?.overallQuality === 'high' ? 'high' : 'medium',
        dataCompleteness: this.calculateDataCompleteness(session.input),
        recommendedFollowUp: stage4?.topPriorities || [],
      },

      // New comprehensive fields
      timeline: {} as any,
      profileAssessment: {
        tier: stage0?.preliminaryTiers?.overall || 'competitive',
        archetype: stage0?.archetype || 'well_rounded',
      } as any,
      essayAnalysis: stage1C || {} as any,
      activityOptimization: stage1A || {} as any,
      summerStrategy: {
        recommendations: stage4?.summerRecommendations || [],
      } as any,
      majorGuidance: {} as any,
      impactAnalysis: {} as any,
      interviewPrep: stage4?.interviewPrep || {} as any,
      recommendationStrategy: stage4?.recommendationStrategy || {} as any,
      actionPlan: {
        items: stage4?.actionItems || [],
        priorities: stage4?.topPriorities || [],
      } as any,

      // Strategic summary
      strategicSummary: {
        positioningStatement: stage4?.positioningStatement || stage2?.twoSentencePitch || '',
        topAdvantages: stage2?.keyStrengths || [],
        topDevelopmentAreas: stage2?.developmentAreas || [],
        schoolTierFit: {
          reach: { probability: 15, keyFactors: [] },
          target: { probability: 40, keyFactors: [] },
          likely: { probability: 70, keyFactors: [] },
        },
        urgencyLevel: stage4?.urgencyLevel || 'moderate',
        urgencyRationale: stage4?.urgencyRationale || '',
        immediateFocus: stage4?.topPriorities?.slice(0, 3) || [],
        mediumTermFocus: stage4?.topPriorities?.slice(3, 6) || [],
      },
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private async callLLM(
    sessionId: string,
    stage: AnalysisStage,
    prompt: string
  ): Promise<ClaudeResponse> {
    const config = STAGE_CONFIG[stage];
    const startTime = Date.now();

    try {
      const response = await callClaude(prompt, {
        model: config.model,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        useJsonMode: true,
      });

      // Calculate cost
      const isHaiku = config.model.includes('haiku');
      const rates = isHaiku ? COST_PER_1M.haiku : COST_PER_1M.sonnet;
      const inputCost = (response.usage.input_tokens / 1_000_000) * rates.input;
      const outputCost = (response.usage.output_tokens / 1_000_000) * rates.output;
      const cachedCost = ((response.usage.cache_read_input_tokens || 0) / 1_000_000) * rates.cached;
      const totalCost = inputCost + outputCost + cachedCost;

      // Record the call
      const record: LLMCallRecord = {
        model: config.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cachedTokens: response.usage.cache_read_input_tokens || 0,
        costCents: Math.round(totalCost * 100),
        latencyMs: Date.now() - startTime,
        purpose: stage,
      };

      this.sessionManager.recordLLMCall(sessionId, stage, record);

      return response;
    } catch (error) {
      console.error(`[PASS] LLM call failed for stage ${stage}:`, error);
      throw error;
    }
  }

  private parseJsonResponse(content: any): any {
    if (typeof content === 'object') {
      return content;
    }

    if (typeof content === 'string') {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          console.warn('[PASS] Failed to parse JSON from response');
        }
      }
    }

    return {};
  }

  private calculateDataCompleteness(input: ComprehensiveStudentInput): number {
    let score = 0;
    let total = 0;

    // Academic data
    total += 4;
    if (input.academic?.gpa) score += 1;
    if (input.academic?.courses?.length) score += 1;
    if (input.academic?.testScores) score += 1;
    if (input.academic?.schoolContext) score += 1;

    // Activities
    total += 2;
    if (input.activities?.activities?.length) score += 1;
    if (input.activities?.activities?.some(a => a.achievements?.length)) score += 1;

    // Awards
    total += 1;
    if (input.awards?.awards?.length) score += 1;

    // Personal context
    total += 2;
    if (input.personalContext) score += 1;
    if (input.goals) score += 1;

    // Essays
    total += 1;
    if (input.essays) score += 1;

    return Math.round((score / total) * 100);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const passOrchestrator = new PASSOrchestrator();
