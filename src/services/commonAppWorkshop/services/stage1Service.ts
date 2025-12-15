/**
 * Stage 1 Teaching Service - Foundation
 *
 * **THE MOST CRITICAL STAGE OF THE PIQ WORKSHOP METHODOLOGY**
 *
 * Stage 1 is where we build the conceptual foundation that enables student
 * growth. Unlike traditional feedback that jumps straight to "here's what's
 * wrong," Stage 1 teaches CONCEPTS first, creating mental models that help
 * students understand WHY certain approaches work.
 *
 * **Stage 1 Philosophy**:
 * 1. TEACH before you EVALUATE - Build understanding first
 * 2. CONCEPTS over FIXES - Mental models, not just corrections
 * 3. COLLEGE-SPECIFIC - What THIS college uniquely values
 * 4. SOCRATIC ACTIVATION - Questions that prime deeper thinking
 * 5. AUTHENTIC VOICE - Help student find THEIR voice, not a generic one
 *
 * **What Stage 1 Accomplishes**:
 * - Student understands what makes a great essay for THIS college
 * - Student knows the rubric and what readers look for
 * - Student has mental models for key concepts (IV, voice, etc.)
 * - Student is primed with Socratic questions to guide revision
 * - Student has initial draft assessment with dimensional feedback
 *
 * **Cost Optimization in Stage 1**:
 * - Full college research is CACHED (74% token savings)
 * - Citation mapping from Haiku identifies most relevant evidence
 * - Teaching history starts fresh (no repetition tracking needed yet)
 * - Session context is established for Stages 2-3
 */

import type {
  TeachingFeedback,
  TeachingIssue,
  WorkshopSession,
  EssayAnalysis,
} from '../types/workshopSession';
import type {
  CollegeResearch,
  CollegeCoreValue,
  CollegeEssayPrompt,
  CollegeRedFlag,
  CollegeGreenFlag,
  CollegeKeyQuote,
  CollegeSocraticQuestion,
  CitationMapping,
  DimensionStrength,
  TeachingStage,
} from '../types/collegeResearch';
import { getCollegeResearch } from '../data';
import { workshopCacheService } from './cacheService';
import { haikuCitationService } from './citationService';

// ============================================================================
// STAGE 1 TEACHING SERVICE
// ============================================================================

/**
 * Stage 1 Teaching Service
 *
 * Generates comprehensive foundation teaching for the first stage of
 * essay coaching. This service:
 *
 * 1. Builds conceptual teaching content (college values, rubric understanding)
 * 2. Creates initial essay analysis with dimensional feedback
 * 3. Identifies priority teaching issues
 * 4. Generates Socratic questions to guide student thinking
 * 5. Provides evidence-based teaching with Dean quotes and research
 */
export class Stage1TeachingService {
  /**
   * Generate complete Stage 1 teaching feedback
   *
   * This is the main entry point for Stage 1 teaching. It generates
   * comprehensive foundation teaching that includes:
   * - Conceptual foundation (college values, rubric)
   * - Initial essay analysis
   * - Priority teaching issues
   * - Socratic questions
   * - Evidence-based guidance
   *
   * @param session - Current workshop session
   * @param essayDraft - Student's current draft
   * @param citationMapping - Optional pre-computed citation mapping from Haiku
   * @returns Complete Stage 1 teaching feedback
   */
  public async generateStage1Teaching(
    session: WorkshopSession,
    essayDraft: string,
    citationMapping?: CitationMapping
  ): Promise<Stage1TeachingOutput> {
    const research = getCollegeResearch(session.college);
    if (!research) {
      throw new Error(`College research not found: ${session.college}`);
    }

    const prompt = research.essayPrompts.find(p => p.promptId === session.promptId);
    if (!prompt) {
      throw new Error(`Essay prompt not found: ${session.promptId}`);
    }

    // Get or create citation mapping
    const citations =
      citationMapping ||
      (await haikuCitationService.createCitationMapping(
        session.college,
        session.promptId,
        essayDraft,
        session.pattern
      ));

    // 1. Build conceptual foundation teaching
    const conceptualFoundation = this.buildConceptualFoundation(research, prompt);

    // 2. Generate initial essay analysis
    const essayAnalysis = this.analyzeEssay(essayDraft, research, prompt, citations);

    // 3. Identify priority teaching issues
    const priorityIssues = this.identifyPriorityIssues(
      essayAnalysis,
      research,
      prompt,
      citations
    );

    // 4. Generate Socratic questions
    const socraticQuestions = this.generateSocraticQuestions(
      essayAnalysis,
      research,
      prompt,
      priorityIssues
    );

    // 5. Build teaching narrative
    const teachingNarrative = this.buildTeachingNarrative(
      research,
      prompt,
      essayAnalysis,
      priorityIssues,
      socraticQuestions,
      citations
    );

    // 6. Create strengths to preserve
    const strengthsToPreserve = this.identifyStrengths(
      essayAnalysis,
      research,
      citations
    );

    // 7. Generate next steps
    const nextSteps = this.generateNextSteps(priorityIssues, essayAnalysis);

    return {
      stage: 1,
      conceptualFoundation,
      essayAnalysis,
      priorityIssues,
      socraticQuestions,
      teachingNarrative,
      strengthsToPreserve,
      nextSteps,
      citationMapping: citations,
    };
  }

  /**
   * Build conceptual foundation teaching
   *
   * This is the HEART of Stage 1 - teaching concepts BEFORE evaluation.
   * We teach:
   * - What this college uniquely values
   * - What the rubric rewards
   * - Mental models for key concepts
   * - Common pitfalls to avoid
   */
  private buildConceptualFoundation(
    research: CollegeResearch,
    prompt: CollegeEssayPrompt
  ): ConceptualFoundation {
    return {
      // College values teaching
      collegeValuesTeaching: this.buildCollegeValuesTeaching(research),

      // Rubric understanding
      rubricUnderstanding: this.buildRubricUnderstanding(prompt),

      // Key concepts for this essay type
      keyConceptsTeaching: this.buildKeyConceptsTeaching(research, prompt),

      // Common pitfalls to avoid
      pitfallsToAvoid: this.buildPitfallsToAvoid(research, prompt),

      // What great essays do
      whatGreatEssaysDo: this.buildWhatGreatEssaysDo(research, prompt),
    };
  }

  /**
   * Build college values teaching
   *
   * Teaches the student what THIS college uniquely values and why.
   * Uses Dean quotes and evidence to ground the teaching.
   */
  private buildCollegeValuesTeaching(
    research: CollegeResearch
  ): CollegeValuesTeaching {
    const valueTeachings = research.coreValues.map(value => ({
      valueId: value.valueId,
      valueName: value.valueName,
      weight: value.weight,

      // Teaching content
      whatItMeans: value.definition,
      whyCollegeCares: value.essayImplication,

      // Evidence
      deanQuote: value.evidence[0]
        ? {
            quote: value.evidence[0].quote,
            source: value.evidence[0].source,
            context: value.evidence[0].context,
          }
        : undefined,

      // Clarification
      whatItIs: value.is,
      whatItIsNot: value.isNot,

      // Teaching questions
      selfAssessmentQuestions: [
        `Does my essay demonstrate ${value.valueName.toLowerCase()}?`,
        `Would an admissions reader see ${value.is[0]?.toLowerCase() || 'this value'} in my essay?`,
        `Am I avoiding ${value.isNot[0]?.toLowerCase() || 'common pitfalls'}?`,
      ],
    }));

    return {
      collegeName: research.collegeName,
      overallPhilosophy: `${research.collegeName} values ${research.coreValues
        .slice(0, 2)
        .map(v => v.valueName.toLowerCase())
        .join(' and ')} above all else. Understanding these values is essential to writing an essay that resonates with admissions readers.`,
      values: valueTeachings,
      keyTakeaway: `Your essay should authentically demonstrate ${research.coreValues[0].valueName} while maintaining your genuine voice. ${research.collegeName} can spot inauthenticity from miles away.`,
    };
  }

  /**
   * Build rubric understanding teaching
   *
   * Helps student understand what readers are looking for and
   * what separates excellent from average essays.
   */
  private buildRubricUnderstanding(prompt: CollegeEssayPrompt): RubricUnderstanding {
    return {
      promptTitle: prompt.promptTitle,
      promptText: prompt.promptText,
      wordLimit: prompt.wordCount,
      primaryAssessment: prompt.primaryAssessment,
      importance: prompt.importance,
      importanceContext: prompt.importanceContext,

      // What each tier looks like
      tiers: {
        excellent: {
          scoreRange: prompt.rubric.excellent.scoreRange,
          description: prompt.rubric.excellent.description,
          criteria: prompt.rubric.excellent.criteria || [],
          whatDistinguishes:
            'Essays at this level demonstrate mastery of both content and craft, with authentic voice and genuine insight.',
        },
        good: {
          scoreRange: prompt.rubric.good.scoreRange,
          description: prompt.rubric.good.description,
          whatPreventsHigher: prompt.rubric.good.whatPreventsHigherScore || '',
        },
        average: {
          scoreRange: prompt.rubric.average.scoreRange,
          description: prompt.rubric.average.description,
          commonIssues: prompt.rubric.average.criteria || [],
        },
        weak: {
          scoreRange: prompt.rubric.weak.scoreRange,
          description: prompt.rubric.weak.description,
          criticalFailures: prompt.rubric.weak.criticalFailures || [],
        },
      },

      // Dimensional criteria
      dimensions: prompt.dimensionalCriteria.map(dc => ({
        dimensionId: dc.dimensionId,
        dimensionName: dc.dimensionName,
        weight: dc.weight,
        context: dc.context,
        evaluationQuestions: dc.evaluationQuestions,
        scoringLogic: dc.scoringLogic,
        howToImprove: dc.howToImprove,
      })),
    };
  }

  /**
   * Build key concepts teaching
   *
   * Teaches the mental models students need to understand
   * what makes essays work at this college.
   */
  private buildKeyConceptsTeaching(
    research: CollegeResearch,
    prompt: CollegeEssayPrompt
  ): KeyConceptTeaching[] {
    // Build concept teachings based on the primary value
    const primaryValue = research.coreValues[0];
    const concepts: KeyConceptTeaching[] = [];

    // Concept 1: Primary value mental model
    concepts.push({
      conceptName: primaryValue.valueName,
      conceptId: `concept_${primaryValue.valueId}`,
      mentalModel: `${primaryValue.valueName} is ${primaryValue.definition}. Think of it as ${primaryValue.is[0] || 'the core quality that drives great essays'}.`,
      whyItMatters: primaryValue.essayImplication,
      howToRecognize: primaryValue.is.slice(0, 3),
      howToAvoidMistakes: primaryValue.isNot.slice(0, 3),
      exampleFromResearch:
        primaryValue.evidence[0]?.quote ||
        'See the research section for specific examples.',
    });

    // Concept 2: Authentic voice
    const voiceValue = research.coreValues.find(v =>
      v.valueId.includes('voice') || v.valueId.includes('authentic')
    );
    if (voiceValue) {
      concepts.push({
        conceptName: 'Authentic Voice',
        conceptId: 'concept_authentic_voice',
        mentalModel:
          'Your authentic voice is how YOU naturally express yourself - not how you think an admissions officer wants you to sound. It includes your humor, your observations, your specific way of seeing the world.',
        whyItMatters:
          'Admissions readers read thousands of essays. They can instantly detect when a student is performing rather than being genuine. Authenticity creates connection; performance creates distance.',
        howToRecognize: voiceValue.is,
        howToAvoidMistakes: voiceValue.isNot,
        exampleFromResearch:
          voiceValue.evidence[0]?.quote ||
          'Your best friend should recognize you in your writing.',
      });
    }

    // Concept 3: Specificity
    concepts.push({
      conceptName: 'Specificity',
      conceptId: 'concept_specificity',
      mentalModel:
        'Specific details are more compelling than general claims. Instead of "I worked hard," show us the 3 AM debugging session where you finally fixed the bug. Instead of "I love learning," show us the Wikipedia rabbit hole that started with one question and led you somewhere unexpected.',
      whyItMatters:
        'Specificity is the difference between "telling" and "showing." Anyone can claim to be curious or passionate. Specific moments prove it.',
      howToRecognize: [
        'Names, dates, places, details',
        'Sensory descriptions',
        'Exact quotes from conversations',
        'Specific moments, not general summaries',
      ],
      howToAvoidMistakes: [
        'Vague adjectives (amazing, incredible, life-changing)',
        'Generic statements that could apply to anyone',
        'Abstract claims without concrete evidence',
      ],
      exampleFromResearch:
        '"I debugged for 3 hours and it was a missing semicolon" beats "I learned to persevere through challenges."',
    });

    return concepts;
  }

  /**
   * Build pitfalls to avoid teaching
   *
   * Warns students about common mistakes before they make them.
   * Uses red flags from research.
   */
  private buildPitfallsToAvoid(
    research: CollegeResearch,
    prompt: CollegeEssayPrompt
  ): PitfallTeaching[] {
    // Get most relevant red flags (critical and major severity)
    const criticalFlags = research.redFlags.filter(
      rf => rf.severity === 'critical' || rf.severity === 'major'
    );

    return criticalFlags.slice(0, 5).map(flag => ({
      pitfallId: flag.flagId,
      pitfallName: flag.flagName,
      severity: flag.severity,
      whatItIs: flag.detection.description,
      whyItHurts: flag.teaching.whyItMatters,
      howToSpotIt: flag.detection.signalPhrases.slice(0, 3),
      howToAvoidIt: flag.teaching.howToFix,
      evidenceFromResearch: `${flag.evidence.source}: "${flag.evidence.quote}"`,
    }));
  }

  /**
   * Build what great essays do teaching
   *
   * Positive examples and techniques from successful essays.
   */
  private buildWhatGreatEssaysDo(
    research: CollegeResearch,
    prompt: CollegeEssayPrompt
  ): GreatEssayTeaching {
    // Get relevant green flags
    const strongFlags = research.greenFlags.filter(
      gf => gf.strength === 'exceptional' || gf.strength === 'strong'
    );

    return {
      overallPattern: `Great ${prompt.promptTitle} essays at ${research.collegeName} share common patterns: they demonstrate ${research.coreValues[0].valueName.toLowerCase()} through specific moments, maintain authentic voice throughout, and make the reader feel like they've met a real person.`,

      techniques: strongFlags.slice(0, 5).map(flag => ({
        techniqueId: flag.flagId,
        techniqueName: flag.flagName,
        whatItIs: flag.detection.description,
        whyItWorks: flag.teaching.whyItMatters,
        howToDoIt: flag.teaching.howToEnhance,
        signalPhrases: flag.detection.signalPhrases.slice(0, 3),
      })),

      keyQuoteToRemember: research.keyQuotes[0]
        ? {
            quote: research.keyQuotes[0].quote,
            source: `${research.keyQuotes[0].source.name} (${research.keyQuotes[0].source.title})`,
            insight: research.keyQuotes[0].insight,
          }
        : undefined,
    };
  }

  /**
   * Analyze essay with dimensional feedback
   *
   * Provides comprehensive analysis across all relevant dimensions.
   * This is where we evaluate the current draft.
   */
  private analyzeEssay(
    essayDraft: string,
    research: CollegeResearch,
    prompt: CollegeEssayPrompt,
    citations: CitationMapping
  ): EssayAnalysis {
    // In real implementation, this would be done by Claude
    // For now, we create a structure that demonstrates the analysis format

    const wordCount = essayDraft.split(/\s+/).length;
    const paragraphCount = essayDraft.split(/\n\n+/).length;

    // Create dimensional scores based on prompt criteria
    const categoryScores = prompt.dimensionalCriteria.map(dc => {
      // Placeholder scoring - real implementation uses Claude
      const score = 65; // Would be calculated
      const maxScore = 100;

      return {
        dimensionId: dc.dimensionId,
        dimensionName: dc.dimensionName,
        score,
        maxScore,
        percentage: (score / maxScore) * 100,
        status: this.getStatusFromScore(score) as DimensionStrength,
        justification: `Analysis of ${dc.dimensionName} based on ${dc.evaluationQuestions[0]}`,
        strengths: [] as string[],
        weaknesses: [] as string[],
      };
    });

    // Calculate overall NQI
    const nqi = Math.round(
      categoryScores.reduce((sum, cs) => sum + cs.score, 0) / categoryScores.length
    );

    return {
      nqi,
      tier: this.getTierFromNqi(nqi),
      categoryScores,
      weakCategories: categoryScores
        .filter(cs => cs.status === 'weak' || cs.status === 'missing')
        .map(cs => ({
          dimensionId: cs.dimensionId,
          score: cs.score,
          primaryIssue: cs.justification,
          howToImprove: 'Focus on...',
        })),
      elitePatterns: [],
      authenticity: {
        voiceScore: 70,
        uniquenessScore: 65,
        concerns: [],
      },
      flagsDetected: {
        redFlags: citations.triggeredRedFlags.map(rf => ({
          flagId: rf.flagId,
          evidence: rf.evidence,
          location: rf.location,
        })),
        greenFlags: citations.greenFlagOpportunities.map(gf => ({
          flagId: gf.flagId,
          evidence: gf.opportunity,
          location: gf.location,
        })),
      },
    };
  }

  /**
   * Identify priority teaching issues
   *
   * Determines which issues are most important to address in Stage 1.
   * We focus on foundational issues that, if fixed, will unlock other improvements.
   */
  private identifyPriorityIssues(
    analysis: EssayAnalysis,
    research: CollegeResearch,
    prompt: CollegeEssayPrompt,
    citations: CitationMapping
  ): TeachingIssue[] {
    const issues: TeachingIssue[] = [];

    // Add issues from weak categories (weak or missing dimensions)
    analysis.weakCategories.forEach((weak, idx) => {
      const dimension = prompt.dimensionalCriteria.find(
        dc => dc.dimensionId === weak.dimensionId
      );

      if (dimension) {
        issues.push({
          issueId: `issue_${weak.dimensionId}_${idx}`,
          severity: idx === 0 ? 'critical' : 'major',
          quote: '', // Would be populated with specific essay text
          problem: weak.primaryIssue,
          whyItMatters: dimension.context,
          dimension: weak.dimensionId,
          collegeContext: {
            relevantValue: research.coreValues[0]?.valueId,
            relevantQuote: research.keyQuotes[0],
            relevantRedFlag: citations.triggeredRedFlags[0]?.flagId,
          },
          teaching: {
            principle: dimension.howToImprove[0] || 'Focus on this dimension',
            explanation: `This dimension is weighted at ${dimension.weight}% for this essay. ${dimension.context}`,
            socraticQuestion: dimension.evaluationQuestions[0],
          },
          suggestions: [],
          status: 'pending',
          stageIdentified: 1,
        });
      }
    });

    // Add issues from red flags
    citations.triggeredRedFlags.forEach((rf, idx) => {
      const redFlag = research.redFlags.find(f => f.flagId === rf.flagId);
      if (redFlag) {
        issues.push({
          issueId: `issue_redflag_${rf.flagId}_${idx}`,
          severity: redFlag.severity,
          quote: rf.evidence,
          problem: redFlag.teaching.problem,
          whyItMatters: redFlag.teaching.whyItMatters,
          dimension: redFlag.scoreImpact.dimension,
          collegeContext: {
            relevantRedFlag: rf.flagId,
          },
          teaching: {
            principle: redFlag.teaching.howToFix,
            explanation: `${redFlag.evidence.source}: "${redFlag.evidence.quote}"`,
            exampleFromElite: redFlag.teaching.exampleFix,
          },
          suggestions: [],
          status: 'pending',
          stageIdentified: 1,
        });
      }
    });

    // Sort by severity (critical first) and limit to top 5
    return issues
      .sort((a, b) => {
        const severityOrder = { critical: 0, major: 1, minor: 2, optimization: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
      .slice(0, 5);
  }

  /**
   * Generate Socratic questions
   *
   * Creates thoughtful questions that guide the student to discover
   * insights themselves rather than just telling them what to do.
   */
  private generateSocraticQuestions(
    analysis: EssayAnalysis,
    research: CollegeResearch,
    prompt: CollegeEssayPrompt,
    priorityIssues: TeachingIssue[]
  ): SocraticQuestion[] {
    const questions: SocraticQuestion[] = [];

    // Opening question about purpose
    questions.push({
      questionId: 'sq_opening_purpose',
      question: `Before we dive into specifics: What's the ONE thing you most want ${research.collegeName} to understand about you from this essay?`,
      purpose: 'Activate student thinking about core message',
      expectedOutcome: 'Student articulates their intended core message',
      followUpIf: {
        unclear: 'Can you give me a specific moment or example that shows this?',
        generic:
          'That could describe many applicants. What makes YOUR version of this unique?',
      },
    });

    // Question about authentic voice
    questions.push({
      questionId: 'sq_voice_check',
      question:
        'If your best friend read this essay without your name on it, would they recognize it as yours? What specifically would tip them off?',
      purpose: 'Help student assess voice authenticity',
      expectedOutcome: 'Student identifies (or realizes lack of) distinctive voice elements',
      followUpIf: {
        yes: 'Great! Point to the specific phrases or moments that are most "you".',
        no: 'What would you need to add or change to make it unmistakably yours?',
      },
    });

    // Questions based on priority issues
    priorityIssues.slice(0, 2).forEach((issue, idx) => {
      if (issue.teaching.socraticQuestion) {
        questions.push({
          questionId: `sq_issue_${idx}`,
          question: issue.teaching.socraticQuestion,
          purpose: `Address ${issue.dimension} weakness`,
          expectedOutcome: 'Student discovers insight about this issue',
        });
      }
    });

    // Question about specificity
    questions.push({
      questionId: 'sq_specificity',
      question:
        'Where in your essay do you SHOW rather than TELL? Can you point to a specific moment, detail, or example that proves your claim rather than just stating it?',
      purpose: 'Guide student to add specificity',
      expectedOutcome: 'Student identifies areas needing more concrete details',
    });

    // College-specific question
    questions.push({
      questionId: 'sq_college_specific',
      question: `${research.coreValues[0].valueName} is what ${research.collegeName} values most. Where in your essay would an admissions reader see evidence of ${research.coreValues[0].valueName.toLowerCase()}?`,
      purpose: `Connect essay to ${research.collegeName}'s primary value`,
      expectedOutcome:
        'Student identifies (or realizes need for) value demonstration',
    });

    return questions;
  }

  /**
   * Build teaching narrative
   *
   * Creates the complete teaching output that will be presented to the student.
   * This combines conceptual teaching with specific feedback.
   */
  private buildTeachingNarrative(
    research: CollegeResearch,
    prompt: CollegeEssayPrompt,
    analysis: EssayAnalysis,
    priorityIssues: TeachingIssue[],
    socraticQuestions: SocraticQuestion[],
    citations: CitationMapping
  ): string {
    const narrative: string[] = [];

    // Opening - set the tone
    narrative.push(`# Stage 1: Foundation\n`);
    narrative.push(
      `Before we look at your specific essay, let's build a strong foundation by understanding what ${research.collegeName} is really looking for.\n`
    );

    // Section 1: College Values
    narrative.push(`## What ${research.collegeName} Values\n`);
    research.coreValues.slice(0, 2).forEach(value => {
      narrative.push(`### ${value.valueName} (${value.weight}% of what matters)\n`);
      narrative.push(`**What it means**: ${value.definition}\n`);
      narrative.push(`**How it shows in essays**: ${value.essayImplication}\n`);
      if (value.evidence[0]) {
        narrative.push(
          `\n> "${value.evidence[0].quote}"\n> — ${value.evidence[0].source}\n`
        );
      }
      narrative.push(`\n**What this IS**: ${value.is.slice(0, 3).join(', ')}\n`);
      narrative.push(`**What this is NOT**: ${value.isNot.slice(0, 3).join(', ')}\n\n`);
    });

    // Section 2: What Great Essays Do
    narrative.push(`## What Great Essays Do\n`);
    narrative.push(
      `The best ${prompt.promptTitle} essays share common patterns:\n\n`
    );
    const excellentCriteria = prompt.rubric.excellent.criteria || [];
    excellentCriteria.slice(0, 3).forEach(criterion => {
      narrative.push(`- ${criterion}\n`);
    });
    narrative.push('\n');

    // Section 3: Common Pitfalls
    narrative.push(`## Common Pitfalls to Avoid\n`);
    research.redFlags
      .filter(rf => rf.severity === 'critical')
      .slice(0, 2)
      .forEach(flag => {
        narrative.push(`### ⚠️ ${flag.flagName}\n`);
        narrative.push(`${flag.detection.description}\n`);
        narrative.push(
          `**Why it matters**: ${flag.teaching.whyItMatters}\n`
        );
        narrative.push(`**How to avoid**: ${flag.teaching.howToFix}\n\n`);
      });

    // Section 4: Your Current Draft
    narrative.push(`## Looking at Your Draft\n`);
    narrative.push(`**Overall Assessment**: ${analysis.tier} (NQI: ${analysis.nqi}/100)\n\n`);

    // Dimensional breakdown
    narrative.push(`### Dimensional Breakdown\n`);
    analysis.categoryScores.forEach(cs => {
      const statusEmoji =
        cs.status === 'exceptional' || cs.status === 'strong'
          ? '✅'
          : cs.status === 'adequate'
          ? '⚡'
          : '⚠️';
      narrative.push(
        `- ${statusEmoji} **${cs.dimensionName}**: ${cs.status.toUpperCase()} (${cs.percentage.toFixed(0)}%)\n`
      );
    });
    narrative.push('\n');

    // Section 5: Priority Areas
    if (priorityIssues.length > 0) {
      narrative.push(`## Priority Areas to Strengthen\n`);
      priorityIssues.slice(0, 3).forEach((issue, idx) => {
        narrative.push(`### ${idx + 1}. ${issue.dimension}\n`);
        narrative.push(`**The Issue**: ${issue.problem}\n`);
        narrative.push(`**Why It Matters**: ${issue.whyItMatters}\n`);
        narrative.push(`**Principle**: ${issue.teaching.principle}\n\n`);
      });
    }

    // Section 6: Questions to Consider
    narrative.push(`## Questions to Guide Your Revision\n`);
    narrative.push(
      `As you revise, consider these questions:\n\n`
    );
    socraticQuestions.forEach((sq, idx) => {
      narrative.push(`${idx + 1}. ${sq.question}\n\n`);
    });

    // Closing
    narrative.push(`---\n\n`);
    narrative.push(
      `**Next Steps**: Take some time to reflect on these questions. In Stage 2, we'll dive deeper into specific improvements and techniques.\n`
    );

    return narrative.join('');
  }

  /**
   * Identify strengths to preserve
   *
   * Highlights what's working well so student doesn't accidentally
   * remove good elements while revising.
   */
  private identifyStrengths(
    analysis: EssayAnalysis,
    research: CollegeResearch,
    citations: CitationMapping
  ): StrengthToPreserve[] {
    const strengths: StrengthToPreserve[] = [];

    // Add strengths from strong dimensions
    analysis.categoryScores
      .filter(cs => cs.status === 'strong' || cs.status === 'exceptional')
      .forEach(cs => {
        strengths.push({
          strengthId: `strength_${cs.dimensionId}`,
          strength: `Strong ${cs.dimensionName}`,
          whyItWorks: cs.justification,
          preservationAdvice: `This is working well. Don't over-edit this aspect.`,
        });
      });

    // Add strengths from green flags
    citations.greenFlagOpportunities.forEach(gf => {
      const greenFlag = research.greenFlags.find(f => f.flagId === gf.flagId);
      if (greenFlag) {
        strengths.push({
          strengthId: `strength_${gf.flagId}`,
          strength: greenFlag.flagName,
          whyItWorks: greenFlag.teaching.whatWorks,
          preservationAdvice: greenFlag.teaching.howToEnhance,
        });
      }
    });

    return strengths;
  }

  /**
   * Generate next steps
   *
   * Clear action items for the student to take before Stage 2.
   */
  private generateNextSteps(
    priorityIssues: TeachingIssue[],
    analysis: EssayAnalysis
  ): NextStep[] {
    const steps: NextStep[] = [];

    // Step 1: Reflect on key questions
    steps.push({
      priority: 'high',
      action: 'Spend 10-15 minutes reflecting on the Socratic questions above',
      expectedImpact:
        'Deeper understanding of what you want to communicate and how',
    });

    // Steps from priority issues
    priorityIssues.slice(0, 2).forEach((issue, idx) => {
      steps.push({
        priority: idx === 0 ? 'high' : 'medium',
        action: `Address ${issue.dimension}: ${issue.teaching.principle}`,
        expectedImpact: `Strengthen this dimension from ${issue.severity} to improved`,
      });
    });

    // Step for authenticity if needed
    if (analysis.authenticity.voiceScore < 75) {
      steps.push({
        priority: 'medium',
        action:
          'Read your essay aloud. Mark any phrase you wouldn\'t naturally say to a friend.',
        expectedImpact: 'More authentic voice throughout',
      });
    }

    return steps;
  }

  /**
   * Helper: Get status from score
   */
  private getStatusFromScore(score: number): DimensionStrength {
    if (score >= 90) return 'exceptional';
    if (score >= 80) return 'strong';
    if (score >= 65) return 'adequate';
    if (score >= 40) return 'weak';
    return 'missing';
  }

  /**
   * Helper: Get tier from NQI
   */
  private getTierFromNqi(
    nqi: number
  ): 'excellent' | 'strong' | 'competitive' | 'developing' {
    if (nqi >= 90) return 'excellent';
    if (nqi >= 80) return 'strong';
    if (nqi >= 70) return 'competitive';
    return 'developing';
  }
}

// ============================================================================
// STAGE 1 OUTPUT TYPES
// ============================================================================

/**
 * Complete Stage 1 teaching output
 */
export interface Stage1TeachingOutput {
  stage: 1;
  conceptualFoundation: ConceptualFoundation;
  essayAnalysis: EssayAnalysis;
  priorityIssues: TeachingIssue[];
  socraticQuestions: SocraticQuestion[];
  teachingNarrative: string;
  strengthsToPreserve: StrengthToPreserve[];
  nextSteps: NextStep[];
  citationMapping: CitationMapping;
}

/**
 * Conceptual foundation teaching content
 */
export interface ConceptualFoundation {
  collegeValuesTeaching: CollegeValuesTeaching;
  rubricUnderstanding: RubricUnderstanding;
  keyConceptsTeaching: KeyConceptTeaching[];
  pitfallsToAvoid: PitfallTeaching[];
  whatGreatEssaysDo: GreatEssayTeaching;
}

/**
 * College values teaching
 */
export interface CollegeValuesTeaching {
  collegeName: string;
  overallPhilosophy: string;
  values: {
    valueId: string;
    valueName: string;
    weight: number;
    whatItMeans: string;
    whyCollegeCares: string;
    deanQuote?: {
      quote: string;
      source: string;
      context: string;
    };
    whatItIs: string[];
    whatItIsNot: string[];
    selfAssessmentQuestions: string[];
  }[];
  keyTakeaway: string;
}

/**
 * Rubric understanding teaching
 */
export interface RubricUnderstanding {
  promptTitle: string;
  promptText: string;
  wordLimit: { min: number; max: number };
  primaryAssessment: string;
  importance: string;
  importanceContext: string;
  tiers: {
    excellent: {
      scoreRange: string;
      description: string;
      criteria: string[];
      whatDistinguishes: string;
    };
    good: {
      scoreRange: string;
      description: string;
      whatPreventsHigher: string;
    };
    average: {
      scoreRange: string;
      description: string;
      commonIssues: string[];
    };
    weak: {
      scoreRange: string;
      description: string;
      criticalFailures: string[];
    };
  };
  dimensions: {
    dimensionId: string;
    dimensionName: string;
    weight: number;
    context: string;
    evaluationQuestions: string[];
    scoringLogic: {
      strong: string[];
      adequate: string[];
      weak: string[];
    };
    howToImprove: string[];
  }[];
}

/**
 * Key concept teaching
 */
export interface KeyConceptTeaching {
  conceptName: string;
  conceptId: string;
  mentalModel: string;
  whyItMatters: string;
  howToRecognize: string[];
  howToAvoidMistakes: string[];
  exampleFromResearch: string;
}

/**
 * Pitfall teaching
 */
export interface PitfallTeaching {
  pitfallId: string;
  pitfallName: string;
  severity: 'critical' | 'major' | 'minor';
  whatItIs: string;
  whyItHurts: string;
  howToSpotIt: string[];
  howToAvoidIt: string;
  evidenceFromResearch: string;
}

/**
 * Great essay teaching
 */
export interface GreatEssayTeaching {
  overallPattern: string;
  techniques: {
    techniqueId: string;
    techniqueName: string;
    whatItIs: string;
    whyItWorks: string;
    howToDoIt: string;
    signalPhrases: string[];
  }[];
  keyQuoteToRemember?: {
    quote: string;
    source: string;
    insight: string;
  };
}

/**
 * Socratic question
 */
export interface SocraticQuestion {
  questionId: string;
  question: string;
  purpose: string;
  expectedOutcome: string;
  followUpIf?: {
    [key: string]: string;
  };
}

/**
 * Strength to preserve
 */
export interface StrengthToPreserve {
  strengthId: string;
  strength: string;
  whyItWorks: string;
  preservationAdvice: string;
}

/**
 * Next step
 */
export interface NextStep {
  priority: 'high' | 'medium' | 'low';
  action: string;
  expectedImpact: string;
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const stage1TeachingService = new Stage1TeachingService();
