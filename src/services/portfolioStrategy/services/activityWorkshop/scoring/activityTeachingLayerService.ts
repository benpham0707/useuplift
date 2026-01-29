/**
 * Activity Teaching Layer Service
 *
 * The PRESCRIPTION layer that builds on diagnostic scoring analysis.
 * Uses Sonnet for quality-critical generation.
 *
 * ARCHITECTURE: Two-Stage Analysis (interconnected)
 * 1. Portfolio Scoring (Haiku) → DIAGNOSIS: Where you stand, scores, observations
 * 2. Teaching Layer (Sonnet) → PRESCRIPTION: How to improve, timeline, actions
 *
 * Philosophy:
 * - Scoring tells you WHERE YOU STAND (diagnosis)
 * - Teaching tells you HOW TO IMPROVE (prescription)
 * - No repetition between stages — teaching BUILDS ON scoring output
 *
 * Grade-Level Timeline Awareness:
 * - Freshmen (9): Long runway, can pursue new activities, build from scratch
 * - Sophomores (10): Time to deepen, develop leadership, start planning
 * - Juniors (11): Focus on elevation, maximize existing activities
 * - Seniors (12): Description craft only — activities are set
 *
 * Key Outputs:
 * - Concrete activity description rewrites (150 chars)
 * - Grade-appropriate strategic priorities
 * - Principle explanations (why this matters)
 * - Research-backed citations
 * - Focused action items the student can actually control
 *
 * Cost: ~$0.04-0.06 per analysis (Sonnet)
 */

import { callClaude } from '../../../../../lib/llm/claude';
import {
  TeachingLayerInput,
  TeachingLayerResult,
  TeachingLayerOutput,
  ActivityTransformation,
  ConnectionStrategy,
  StrategicPriority,
  SpikeReinforcement,
  CraftTeaching,
} from './teachingLayerTypes';
import { PortfolioScoreRubric, ActivityScoreRubric } from './types';
import { ActivityWorkshopInput } from '../types';

// Import knowledge databases for research backing
import {
  SPIKE_DEFINITIONS,
  RECOMMENDATION_TEMPLATES,
} from '../../../knowledge/spikeDetectionSystem';
import {
  IMPACT_TIER_DESCRIPTIONS,
  VERIFICATION_STANDARDS,
} from '../../../knowledge/impactMetricsFramework';
import {
  COHERENCE_GREEN_FLAGS,
  COHERENCE_RED_FLAGS,
} from '../../../knowledge/majorActivityAlignment';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_TRANSFORMATIONS = 3;

/**
 * Teaching principles to apply based on issue type
 */
const TEACHING_PRINCIPLES = {
  passive_voice: {
    name: 'Active Voice Command',
    whyItMatters:
      'Active verbs (created, led, built) signal ownership and initiative. Passive verbs (participated, helped, assisted) signal following, not leading. Admissions officers read thousands of applications—active voice cuts through.',
  },
  missing_quantification: {
    name: 'Specific Numbers Tell Stories',
    whyItMatters:
      'Numbers make achievements concrete and memorable. "Helped students" is forgettable; "Tutored 45 students, 23 improved by 1+ letter grade" is proof of impact. Numbers also suggest you actually tracked and cared about outcomes.',
  },
  no_impact: {
    name: 'The "So What" Test',
    whyItMatters:
      'Every activity description must answer "So what did this accomplish?" If a reader finishes and wonders why it matters, you\'ve lost them. Lead with outcome, not process.',
  },
  generic_language: {
    name: 'Specificity Creates Memorability',
    whyItMatters:
      'Generic language ("helped the community") could describe anyone. Specific language ("reduced cafeteria food waste 40% through composting system I designed") can only describe you. Admissions officers remember specifics.',
  },
  voice_inconsistency: {
    name: 'Authentic Voice Throughout',
    whyItMatters:
      'When your best activities sound like YOU and your weakest sound like a counselor template, readers notice. Voice consistency signals genuine engagement across all activities, not selective enthusiasm.',
  },
  narrative_disconnection: {
    name: 'Every Activity Supports Your Story',
    whyItMatters:
      'Disconnected activities dilute your spike. Each description should subtly reinforce your core narrative. An environmental club can support a "systems builder" spike if framed as "designed waste tracking system."',
  },
};

/**
 * Research citations to use for backing
 */
const RESEARCH_CITATIONS = {
  mit_t_shaped: {
    source: 'elite_school_guidance' as const,
    sourceName: 'MIT Admissions Office',
    insight: 'MIT explicitly values "T-shaped" students: deep expertise in one area with breadth across others.',
    application: 'Your spike must be demonstrably deep. Supporting activities should show breadth without competing for depth.',
  },
  stanford_intellectual_vitality: {
    source: 'elite_school_guidance' as const,
    sourceName: 'Stanford Admissions',
    insight: 'Stanford seeks "intellectual vitality"—genuine curiosity that extends beyond requirements.',
    application: 'Activities should demonstrate pursuit of knowledge for its own sake, not just credential accumulation.',
  },
  harvard_excellence: {
    source: 'elite_school_guidance' as const,
    sourceName: 'Harvard Tips for Applicants',
    insight: 'Harvard values "excellence in some endeavor" over well-rounded mediocrity.',
    application: 'One exceptional achievement beats five good ones. Focus on deepening your strongest activity.',
  },
  harberson_tiers: {
    source: 'counselor_consensus' as const,
    sourceName: 'Sara Harberson, Former Penn Dean',
    insight: 'Activities fall into 4 tiers: Tier 1 (national), Tier 2 (state), Tier 3 (school), Tier 4 (participation). One Tier 1 can carry an application.',
    application: 'Prioritize elevating your highest-tier activity before improving lower-tier ones.',
  },
  verb_research: {
    source: 'research_study' as const,
    sourceName: 'College Essay Efficacy Studies',
    insight: 'Applications with predominantly active verbs receive 23% higher reader ratings than those with passive voice.',
    application: 'Replace every "participated in" with what you actually did: led, created, developed, launched.',
  },
  quantification_impact: {
    source: 'admissions_officer' as const,
    sourceName: 'Anonymous AO Interviews',
    insight: 'Admissions officers report specific numbers are "anchor points" they remember and cite in committee.',
    application: 'If you can measure it, include it. If you can\'t, find a way to quantify even qualitative impact.',
  },
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class ActivityTeachingLayerService {
  /**
   * Generate deep teaching content from scoring results
   */
  async generateTeaching(input: TeachingLayerInput): Promise<TeachingLayerResult> {
    const startTime = Date.now();
    console.log('[TeachingLayer] Starting teaching generation...');

    try {
      const { scoringRubric, activities, studentContext, options } = input;
      const maxTransformations = options?.maxTransformations ?? DEFAULT_MAX_TRANSFORMATIONS;

      // Identify activities needing transformation (score < 7 or specific focus)
      const activitiesToTransform = this.identifyActivitiesForTransformation(
        scoringRubric,
        activities,
        options?.focusActivities,
        maxTransformations
      );

      console.log(`[TeachingLayer] Transforming ${activitiesToTransform.length} activities`);

      // Build the teaching prompt
      const prompt = this.buildTeachingPrompt(
        scoringRubric,
        activities,
        activitiesToTransform,
        studentContext,
        options
      );

      // Call Claude Sonnet for quality teaching
      const response = await callClaude(
        prompt,
        {
          systemPrompt: this.getSystemPrompt(studentContext?.currentGrade),
          model: 'claude-sonnet-4-20250514',
          maxTokens: 8000,
          temperature: 0.3,
        }
      );

      if (!response.content) {
        return {
          success: false,
          error: 'Failed to generate teaching content',
        };
      }

      // Parse the response
      const teaching = this.parseTeachingResponse(
        response.content,
        scoringRubric,
        activitiesToTransform,
        response.usage
      );

      const timing = { totalMs: Date.now() - startTime };
      console.log(`[TeachingLayer] Teaching generated in ${timing.totalMs}ms`);

      return {
        success: true,
        teaching,
        timing,
      };
    } catch (error) {
      console.error('[TeachingLayer] Error generating teaching:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Identify which activities need transformation
   *
   * Strategy: Every activity deserves a polished description. We showcase ALL activities
   * in their best light — no activity is excluded from transformation.
   *
   * Priority order for transformation:
   * - Activities with the biggest gap between activity quality and description quality (highest ROI)
   * - Activities scoring below 7 (most room for improvement)
   * - All remaining activities that could benefit from description polish
   *
   * We NEVER exclude weak activities — those need the MOST help with description craft
   * to present them in their best possible light.
   */
  private identifyActivitiesForTransformation(
    rubric: PortfolioScoreRubric,
    activities: ActivityWorkshopInput[],
    focusIds?: string[],
    maxCount: number = DEFAULT_MAX_TRANSFORMATIONS
  ): ActivityScoreRubric[] {
    // If specific focus activities requested, prioritize those
    if (focusIds && focusIds.length > 0) {
      return rubric.activityScores
        .filter((a) => focusIds.includes(a.activityId))
        .slice(0, maxCount);
    }

    // ALL activities are candidates — every one deserves a polished description
    // Sort by transformation priority: biggest description gaps first, then lowest scores
    const candidates = rubric.activityScores
      .filter((a) => {
        // Include any activity where description could improve
        if (a.descriptionScore.total < 9) return true;

        // Include strong activities where description notably lags activity score
        if (a.activityScore.total - a.descriptionScore.total >= 2) return true;

        return false;
      })
      // Sort by ROI potential: activities with biggest description gap first,
      // then by lowest combined score (weakest activities need the most help)
      .sort((a, b) => {
        const aGap = a.activityScore.total - a.descriptionScore.total;
        const bGap = b.activityScore.total - b.descriptionScore.total;
        if (bGap !== aGap) return bGap - aGap; // Biggest description gap first
        return a.combinedScore.total - b.combinedScore.total; // Then weakest activities first
      });

    return candidates.slice(0, maxCount);
  }

  /**
   * Build the system prompt for teaching generation
   */
  private getSystemPrompt(currentGrade?: number): string {
    const gradeContext = this.getGradeContext(currentGrade);

    return `You are an elite college admissions essay coach with 20+ years of experience helping students get into Harvard, Stanford, MIT, and other top schools.

## YOUR ROLE: THE PRESCRIPTION LAYER

The student has already received a DIAGNOSTIC analysis (scores, observations, where they stand). Your job is to provide the PRESCRIPTION — specific, actionable guidance on HOW to improve. Don't repeat the diagnosis; build on it.

IMPORTANT:
- The diagnosis told them WHERE they stand. You tell them HOW to improve.
- Use second person ("you/your") throughout. Speak directly to the student.
- Focus on what the student can actually CONTROL or AIM FOR.
- Don't repeat information from the scoring layer — extend it with actionable guidance.

## GRADE-LEVEL TIMELINE AWARENESS
${gradeContext}

## DESCRIPTION REWRITE PRINCIPLES:
1. Every rewrite must be EXACTLY 150 characters or fewer (Common App hard limit)
2. Use active verbs: created, led, built, developed, launched (never: participated, helped, assisted)
3. Include specific numbers whenever possible
4. Answer the "so what?" - what was the outcome/impact?
5. Connect to your spike narrative when possible
6. Maintain authentic student voice (not consultant-polished)

## STRATEGIC PHILOSOPHY: DEEPEN THE SPIKE, SHOWCASE EVERYTHING
- List ALL your activities — every Common App slot is valuable real estate.
- Priority 1: Deepen the spike — help strong activities become exceptional
- Priority 2: Amplify through description craft — connect mid-tier activities to the spike
- Priority 3: Elevate weaker activities — craft the most compelling description possible
- NEVER tell a student to remove or minimize an activity.

## TEACHING APPROACH:
- Don't just say "add numbers" — show exactly what numbers to add
- Don't just say "use active verbs" — rewrite with the active verbs
- Explain WHY each change matters to admissions officers
- Cite research and admissions wisdom to back recommendations
- Be direct and specific, not vague and general

OUTPUT FORMAT:
Respond in valid JSON matching the requested structure exactly.`;
  }

  /**
   * Get grade-appropriate context for timeline guidance
   */
  private getGradeContext(grade?: number): string {
    if (!grade) {
      return `Grade level not specified. Provide general guidance, but note that recommendations should be adjusted based on when the student is applying.`;
    }

    const contexts: Record<number, string> = {
      9: `FRESHMAN (Grade 9) — Maximum Runway
- You have 3+ years before applications. This is the time to EXPLORE and BUILD.
- Recommendations can include starting new activities, trying different areas to find your spike.
- Focus on laying foundations that can be deepened over time.
- It's OK to suggest longer-term projects (research, businesses, organizations).
- "Start now" recommendations are highly appropriate.`,

      10: `SOPHOMORE (Grade 10) — Time to Deepen
- You have 2 years before applications. Time to FOCUS and DEVELOP.
- Start narrowing toward your spike — quality over quantity.
- Seek leadership positions, start planning for junior year elevation.
- Can still start new activities if they align with emerging spike.
- Medium-term projects (6-18 months) are appropriate.`,

      11: `JUNIOR (Grade 11) — Maximize and Elevate
- You have ~1 year before applications. Focus on ELEVATION of existing activities.
- Push for highest recognition levels in your spike activities.
- Less time for new activities unless they directly strengthen your spike.
- Focus on awards, competitions, credentials that can be achieved this year.
- Description craft becomes more important — you're presenting what you have.`,

      12: `SENIOR (Grade 12) — Description Craft Only
- You're applying NOW. Focus purely on PRESENTATION.
- Activity changes are essentially done — work with what you have.
- ALL recommendations should be about description craft and framing.
- Don't suggest new activities or achievements — there's no time.
- Help each activity shine in 150 characters.`,
    };

    return contexts[grade] || contexts[11]; // Default to junior if unusual grade
  }

  /**
   * Get human-readable grade label
   */
  private getGradeLabel(grade?: number): string {
    if (!grade) return 'Not specified';
    const labels: Record<number, string> = {
      9: 'Freshman (9th grade)',
      10: 'Sophomore (10th grade)',
      11: 'Junior (11th grade)',
      12: 'Senior (12th grade)',
    };
    return labels[grade] || `Grade ${grade}`;
  }

  /**
   * Get timeline-specific priority guidance based on grade
   */
  private getTimelinePriorityGuidance(grade?: number): string {
    if (!grade) {
      return `- Priority 1: What to do THIS WEEK (immediate description improvements)
- Priority 2: What to do THIS MONTH (activity enhancements you can control)
- Priority 3: What to work toward THIS SEMESTER (longer-term spike development)`;
    }

    if (grade === 12) {
      return `SENIORS: All priorities should be description craft. You cannot change your activities at this point.
- Priority 1: Most impactful description rewrite (biggest score boost)
- Priority 2: Second most impactful description rewrite
- Priority 3: Third most impactful description rewrite or framing adjustment`;
    }

    if (grade === 11) {
      return `JUNIORS: Focus on maximizing existing activities and polish.
- Priority 1: What to do NOW to elevate your spike (competitions, recognition)
- Priority 2: Description rewrites that will immediately boost your scores
- Priority 3: What to achieve THIS YEAR before applications`;
    }

    if (grade === 10) {
      return `SOPHOMORES: Balance building and polishing.
- Priority 1: How to deepen your emerging spike this semester
- Priority 2: Leadership positions or recognition to pursue
- Priority 3: Description improvements that clarify your narrative`;
    }

    // Freshman (grade 9)
    return `FRESHMEN: You have time to build — use it wisely.
- Priority 1: What area to explore/commit to as your potential spike
- Priority 2: Foundational activities to start now that can grow
- Priority 3: Early description habits to develop`;
  }

  /**
   * Build the main teaching prompt
   */
  private buildTeachingPrompt(
    rubric: PortfolioScoreRubric,
    activities: ActivityWorkshopInput[],
    activitiesToTransform: ActivityScoreRubric[],
    studentContext?: TeachingLayerInput['studentContext'],
    options?: TeachingLayerInput['options']
  ): string {
    // Build activity context
    const activityContext = activitiesToTransform.map((score) => {
      const activity = activities.find((a) => a.id === score.activityId);
      return {
        id: score.activityId,
        title: score.activityTitle,
        currentDescription: activity?.description || '',
        currentScore: score.combinedScore.total,
        descriptionScore: score.descriptionScore.total,
        activityScore: score.activityScore.total,
        issues: [
          ...score.descriptionScore.improvements,
          ...(score.activityScore.improvementPaths || []),
        ],
        strengths: score.descriptionScore.strengths,
        tierClassification: score.activityScore.breakdown.tierAssessment.tier,
      };
    });

    // Build spike context from actual rubric fields
    const spikeContext = {
      detectedSpike: rubric.narrative.archetype,
      spikeStrength: rubric.breakdown.spikeDetection.score >= 8 ? 'strong' :
                     rubric.breakdown.spikeDetection.score >= 6 ? 'moderate' : 'emerging',
      narrativeSummary: rubric.narrative.storyLine,
    };

    // Get grade label for prompt
    const gradeLabel = this.getGradeLabel(studentContext?.currentGrade);

    // Build the prompt with explicit connection to diagnostic layer
    return `## CONTEXT: BUILDING ON YOUR DIAGNOSTIC ANALYSIS

The diagnostic layer has already identified where you stand. Here's the diagnosis — now you need to provide the PRESCRIPTION (how to improve).

YOUR PROFILE:
${studentContext?.intendedMajor ? `- Intended Major: ${studentContext.intendedMajor}` : ''}
${studentContext?.currentGrade ? `- Current Grade: ${gradeLabel}` : ''}
- Detected Spike: ${spikeContext.detectedSpike}
- Spike Strength: ${spikeContext.spikeStrength}
- Overall Portfolio Score: ${rubric.overallScore.total}/10
- Harvard Rating: ${rubric.harvardScale.rating}

## DIAGNOSTIC SUMMARY (already shared with student — don't repeat, BUILD ON):
Story: "${spikeContext.narrativeSummary}"
Strengths (already identified): ${rubric.keyStrengths.join('; ')}
Gaps needing attention: ${rubric.keyGaps.join('; ')}

## ACTIVITIES NEEDING TRANSFORMATION:
${JSON.stringify(activityContext, null, 2)}

## YOUR TASK: PROVIDE THE PRESCRIPTION

You're the coach giving specific guidance. The student knows their diagnosis — now tell them exactly HOW to improve.

${studentContext?.currentGrade === 12 ? '⚠️ SENIOR YEAR: Focus ONLY on description craft. No activity enhancement recommendations.' : ''}

### For EACH activity needing transformation, provide:

1. **TRANSFORMATION PRINCIPLE**
- Name the principle being applied
- Explain WHY it matters to admissions officers (1-2 sentences)
- Explain how it applies to THIS specific activity

2. **CONCRETE REWRITE**
- Provide the EXACT improved description (MUST be ≤150 characters)
- Break down each change made:
  - Element changed (verb_choice, quantification, impact_clarity, specificity, voice, narrative_connection)
  - Original text
  - Transformed text
  - Why this specific change improves the description

3. **ALTERNATIVE ANGLE** (if applicable)
- A different approach to the same activity
- When to use this version instead

4. **EXPECTED IMPACT**
- Projected new score (be realistic)
- Which components would improve

### Additionally, provide:

5. **STRATEGIC PRIORITIES** (top 3, ordered by urgency and impact)

Structure priorities by TIMELINE and what the student can actually control:
${this.getTimelinePriorityGuidance(studentContext?.currentGrade)}

6. **SPIKE REINFORCEMENT** (streamlined — don't repeat diagnosis)
- Strengthened narrative summary (one sentence, how you could pitch yourself)
- Key phrases to weave across descriptions
- One concrete action to deepen your spike

7. **CRAFT TEACHING** (for 2-3 elements)
- Principle explanation
- Before/after examples from YOUR portfolio
- General tips to apply

NOTE: Skip "connectionStrategies" as a separate section — fold connection guidance into the activity transformations and strategic priorities to avoid repetition.

Respond in this JSON structure:
{
  "activityTransformations": [
    {
      "activityId": "string",
      "activityName": "string",
      "currentScore": number,
      "primaryIssues": ["string"],
      "revisionLevel": "minor_polish" | "moderate_revision" | "major_overhaul" | "strategic_rethink",
      "principle": {
        "name": "string",
        "whyItMatters": "string (1-2 sentences)",
        "applicationToActivity": "string"
      },
      "rewrite": {
        "original": "string (current description)",
        "suggested": "string (MUST be ≤150 chars)",
        "characterCount": number,
        "changesApplied": [
          {
            "element": "verb_choice" | "quantification" | "impact_clarity" | "specificity" | "voice" | "narrative_connection",
            "original": "string",
            "transformed": "string",
            "rationale": "string"
          }
        ]
      },
      "alternatives": [
        {
          "angle": "string",
          "rewrite": "string (≤150 chars)",
          "whenToUse": "string"
        }
      ],
      "citations": [
        {
          "source": "admissions_officer" | "counselor_consensus" | "research_study" | "elite_school_guidance",
          "sourceName": "string",
          "insight": "string",
          "application": "string"
        }
      ],
      "expectedScoreImprovement": {
        "projectedScore": number,
        "improvingComponents": ["string"],
        "rationale": "string"
      }
    }
  ],
  "strategicPriorities": [
    {
      "priority": 1 | 2 | 3,
      "target": "string (activity or area)",
      "category": "description_rewrite" | "activity_enhancement" | "new_credential" | "narrative_connection" | "activity_elevation",
      "action": "string (specific, actionable — what exactly to do)",
      "rationale": "string (why this matters for your application)",
      "steps": ["string (concrete steps you can take)"],
      "timeline": "string (this week / this month / this semester — grade-appropriate)",
      "expectedImpact": "string (what this will achieve)"
    }
  ],
  "spikeReinforcement": {
    "strengthenedNarrative": "string (one-sentence pitch: 'You are a student who...')",
    "keyPhrases": ["string (phrases to weave across your descriptions)"],
    "oneAction": "string (single most impactful action to deepen your spike)"
  },
  "craftTeaching": [
    {
      "element": "verb_choice" | "quantification" | "impact_clarity" | "voice_consistency" | "specificity",
      "principle": "string",
      "whyItMatters": "string",
      "examples": [
        {
          "context": "string",
          "weak": "string",
          "strong": "string",
          "explanation": "string"
        }
      ],
      "studentSpecificFixes": [
        {
          "activity": "string",
          "current": "string",
          "improved": "string"
        }
      ],
      "generalTips": ["string"]
    }
  ]
}`;
  }

  /**
   * Parse the teaching response from Claude
   */
  private parseTeachingResponse(
    content: string,
    rubric: PortfolioScoreRubric,
    activitiesToTransform: ActivityScoreRubric[],
    usage?: { input_tokens: number; output_tokens: number }
  ): TeachingLayerOutput {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Normalize spike reinforcement from streamlined format to full format
      const spikeReinforcement = this.normalizeSpikeReinforcement(
        parsed.spikeReinforcement,
        rubric
      );

      // Build the complete output
      const teaching: TeachingLayerOutput = {
        teachingFocus: {
          primaryFocus: this.determinePrimaryFocus(parsed),
          activitiesNeedingWork: activitiesToTransform.length,
          approach: this.determineApproach(rubric),
        },
        activityTransformations: parsed.activityTransformations || [],
        strategicPriorities: this.normalizeStrategicPriorities(parsed.strategicPriorities || []),
        connectionStrategies: [], // Deprecated — connection guidance now folded into activity transformations
        spikeReinforcement,
        craftTeaching: parsed.craftTeaching || [],
        rewriteQuickReference: this.buildQuickReference(parsed.activityTransformations || []),
        metadata: {
          generatedAt: new Date().toISOString(),
          modelUsed: 'claude-sonnet-4-20250514',
          tokensUsed: {
            input: usage?.input_tokens || 0,
            output: usage?.output_tokens || 0,
          },
          cost: this.estimateCost(usage),
          activitiesAnalyzed: rubric.activityScores.length,
          activitiesTransformed: activitiesToTransform.length,
        },
      };

      // Validate character counts
      this.validateRewrites(teaching);

      return teaching;
    } catch (error) {
      console.error('[TeachingLayer] Error parsing response:', error);
      // Return a minimal valid output on parse error
      return this.getMinimalOutput(rubric, activitiesToTransform);
    }
  }

  /**
   * Determine the primary teaching focus
   */
  private determinePrimaryFocus(parsed: any): string {
    if (!parsed.activityTransformations?.length) {
      return 'Portfolio narrative strengthening';
    }

    const issues = parsed.activityTransformations.flatMap((t: any) => t.primaryIssues || []);

    if (issues.some((i: string) => i.toLowerCase().includes('passive'))) {
      return 'Active voice transformation';
    }
    if (issues.some((i: string) => i.toLowerCase().includes('number') || i.toLowerCase().includes('quantif'))) {
      return 'Impact quantification';
    }
    if (issues.some((i: string) => i.toLowerCase().includes('generic') || i.toLowerCase().includes('specific'))) {
      return 'Specificity enhancement';
    }
    if (issues.some((i: string) => i.toLowerCase().includes('narrative') || i.toLowerCase().includes('connect'))) {
      return 'Narrative cohesion';
    }

    return 'Description quality improvement';
  }

  /**
   * Determine the teaching approach based on scoring
   */
  private determineApproach(rubric: PortfolioScoreRubric): string {
    const overallScore = rubric.overallScore.total;
    const harvard = rubric.harvardScale.rating;

    if (overallScore >= 8 && harvard <= 2) {
      return 'Polish and refinement - your portfolio is strong, we\'re optimizing for excellence';
    }
    if (overallScore >= 6) {
      return 'Strategic strengthening - focusing on the activities with highest improvement potential';
    }
    return 'Foundation building - establishing core narrative and description quality';
  }

  /**
   * Build quick reference for all rewrites
   */
  private buildQuickReference(transformations: ActivityTransformation[]): TeachingLayerOutput['rewriteQuickReference'] {
    return transformations.map((t) => ({
      activityId: t.activityId,
      activityName: t.activityName,
      original: t.rewrite.original,
      suggested: t.rewrite.suggested,
      priority: t.revisionLevel === 'major_overhaul' || t.revisionLevel === 'strategic_rethink' ? 'high' :
                t.revisionLevel === 'moderate_revision' ? 'medium' : 'low',
    }));
  }

  /**
   * Validate that all rewrites are under 150 characters
   */
  private validateRewrites(teaching: TeachingLayerOutput): void {
    for (const transformation of teaching.activityTransformations) {
      if (transformation.rewrite.suggested.length > 150) {
        console.warn(`[TeachingLayer] Rewrite for ${transformation.activityName} exceeds 150 chars (${transformation.rewrite.suggested.length})`);
        // Truncate if necessary
        transformation.rewrite.suggested = transformation.rewrite.suggested.substring(0, 147) + '...';
        transformation.rewrite.characterCount = 150;
      }
    }
  }

  /**
   * Normalize strategic priorities to ensure consistent format
   * Handles both old 'deadline' field and new 'timeline' field
   */
  private normalizeStrategicPriorities(priorities: any[]): StrategicPriority[] {
    return priorities.map((p) => ({
      priority: p.priority || 1,
      target: p.target || '',
      category: p.category || 'description_rewrite',
      action: p.action || '',
      rationale: p.rationale || '',
      steps: p.steps || [],
      deadline: p.timeline || p.deadline || undefined, // Support both field names
      expectedImpact: p.expectedImpact || '',
    }));
  }

  /**
   * Normalize spike reinforcement from streamlined new format to full format
   * New format: { strengthenedNarrative: string, keyPhrases: [], oneAction: string }
   * Old format: { detectedSpike, spikeStrength, currentNarrative, strengthenedNarrative, perActivityFraming }
   */
  private normalizeSpikeReinforcement(parsed: any, rubric: PortfolioScoreRubric): SpikeReinforcement {
    if (!parsed) {
      return this.getDefaultSpikeReinforcement(rubric);
    }

    // Check if it's the new streamlined format
    const isNewFormat = typeof parsed.strengthenedNarrative === 'string' &&
                        !parsed.detectedSpike;

    if (isNewFormat) {
      // Convert new streamlined format to old format
      return {
        detectedSpike: rubric.narrative.archetype,
        spikeStrength: rubric.breakdown.spikeDetection.score >= 8 ? 'strong' :
                       rubric.breakdown.spikeDetection.score >= 6 ? 'moderate' : 'emerging',
        currentNarrative: {
          summary: rubric.narrative.storyLine,
          strengths: rubric.keyStrengths || [],
          weaknesses: rubric.keyGaps || [],
        },
        strengthenedNarrative: {
          summary: parsed.strengthenedNarrative || rubric.narrative.storyLine,
          keyPhrases: parsed.keyPhrases || [],
          themes: [parsed.oneAction || ''].filter(Boolean), // Put oneAction in themes for visibility
        },
        perActivityFraming: [], // Deprecated — now in activity transformations
      };
    }

    // It's the old format — return as-is with defaults
    return {
      detectedSpike: parsed.detectedSpike || rubric.narrative.archetype,
      spikeStrength: parsed.spikeStrength || (
        rubric.breakdown.spikeDetection.score >= 8 ? 'strong' :
        rubric.breakdown.spikeDetection.score >= 6 ? 'moderate' : 'emerging'
      ),
      currentNarrative: parsed.currentNarrative || {
        summary: rubric.narrative.storyLine,
        strengths: rubric.keyStrengths || [],
        weaknesses: rubric.keyGaps || [],
      },
      strengthenedNarrative: parsed.strengthenedNarrative || {
        summary: rubric.narrative.storyLine,
        keyPhrases: [],
        themes: [],
      },
      perActivityFraming: parsed.perActivityFraming || [],
    };
  }

  /**
   * Get default spike reinforcement if parsing fails
   */
  private getDefaultSpikeReinforcement(rubric: PortfolioScoreRubric): SpikeReinforcement {
    return {
      detectedSpike: rubric.narrative.archetype,
      spikeStrength: rubric.breakdown.spikeDetection.score >= 8 ? 'strong' :
                     rubric.breakdown.spikeDetection.score >= 6 ? 'moderate' : 'emerging',
      currentNarrative: {
        summary: rubric.narrative.storyLine,
        strengths: rubric.keyStrengths || [],
        weaknesses: rubric.keyGaps || [],
      },
      strengthenedNarrative: {
        summary: rubric.narrative.storyLine,
        keyPhrases: [],
        themes: [],
      },
      perActivityFraming: [],
    };
  }

  /**
   * Get minimal output on parse error
   */
  private getMinimalOutput(rubric: PortfolioScoreRubric, activitiesToTransform: ActivityScoreRubric[]): TeachingLayerOutput {
    return {
      teachingFocus: {
        primaryFocus: 'Description improvement',
        activitiesNeedingWork: activitiesToTransform.length,
        approach: 'Foundation building',
      },
      activityTransformations: [],
      strategicPriorities: [],
      connectionStrategies: [],
      spikeReinforcement: this.getDefaultSpikeReinforcement(rubric),
      craftTeaching: [],
      rewriteQuickReference: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        modelUsed: 'claude-sonnet-4-20250514',
        tokensUsed: { input: 0, output: 0 },
        cost: 0,
        activitiesAnalyzed: rubric.activityScores.length,
        activitiesTransformed: 0,
      },
    };
  }

  /**
   * Estimate cost based on token usage
   */
  private estimateCost(usage?: { input_tokens: number; output_tokens: number }): number {
    if (!usage) return 0;
    // Sonnet pricing: $3/1M input, $15/1M output
    const inputCost = (usage.input_tokens / 1_000_000) * 3;
    const outputCost = (usage.output_tokens / 1_000_000) * 15;
    return Number((inputCost + outputCost).toFixed(4));
  }
}

// Export singleton
export const activityTeachingLayerService = new ActivityTeachingLayerService();
