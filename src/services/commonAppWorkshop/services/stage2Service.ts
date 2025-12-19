/**
 * Stage 2 Teaching Service - Development
 *
 * **THE DEEP DIVE STAGE OF THE PIQ WORKSHOP METHODOLOGY**
 *
 * Stage 2 is where we guide students to improve their draft based on
 * the conceptual foundation built in Stage 1. This stage focuses on:
 *
 * 1. DIMENSIONAL FEEDBACK - STRONG/ADEQUATE/WEAK for each dimension
 * 2. ISSUE-BY-ISSUE TEACHING - Deep dive into priority issues with evidence
 * 3. SOCRATIC GUIDANCE - Questions that lead to discovery
 * 4. RED FLAG RESOLUTION - Address identified problems with citations
 * 5. GREEN FLAG AMPLIFICATION - Strengthen what's already working
 *
 * **Stage 2 Philosophy**:
 * - Don't repeat Stage 1 teaching (we track what's been taught)
 * - Build on conceptual foundation to address specific issues
 * - Use evidence (Dean quotes, rubric criteria) for all feedback
 * - Guide discovery through questions, don't just give answers
 * - Acknowledge progress and maintain encouragement
 *
 * **What Stage 2 Accomplishes**:
 * - Student understands exactly what to improve
 * - Each issue is addressed with specific, actionable guidance
 * - Progress from Stage 1 is acknowledged
 * - Student has clear path to revision
 * - Teaching is non-repetitive (builds on previous stage)
 *
 * **Cost Optimization in Stage 2**:
 * - College research still CACHED (80% token savings)
 * - Teaching history prevents repetition
 * - Citation mapping guides to relevant evidence
 * - Cumulative context builds understanding
 */

import type {
  TeachingFeedback,
  TeachingIssue,
  WorkshopSession,
  EssayAnalysis,
  EssayVersion,
} from '../types/workshopSession';
import type {
  CollegeResearch,
  CollegeEssayPrompt,
  CollegeRedFlag,
  CollegeGreenFlag,
  CollegeKeyQuote,
  CitationMapping,
  DimensionStrength,
  TeachingStage,
} from '../types/collegeResearch';
import { getCollegeResearch } from '../data';
import { workshopCacheService } from './cacheService';
import { haikuCitationService } from './citationService';

// ============================================================================
// STAGE 2 TEACHING SERVICE
// ============================================================================

/**
 * Stage 2 Teaching Service
 *
 * Generates comprehensive development teaching for the second stage of
 * essay coaching. This service:
 *
 * 1. Compares current draft to previous version (progress tracking)
 * 2. Provides detailed dimensional feedback
 * 3. Addresses remaining issues with deep teaching
 * 4. Generates targeted Socratic questions
 * 5. Provides evidence-based improvement guidance
 */
export class Stage2TeachingService {
  /**
   * Generate complete Stage 2 teaching feedback
   *
   * This is the main entry point for Stage 2 teaching. It generates
   * comprehensive development teaching that:
   * - Acknowledges progress from Stage 1
   * - Provides detailed dimensional feedback
   * - Addresses remaining issues with deep teaching
   * - Guides through targeted Socratic questions
   * - Builds on what was taught in Stage 1
   *
   * @param session - Current workshop session
   * @param currentDraft - Student's revised draft
   * @param previousVersion - Previous version from Stage 1
   * @param citationMapping - Updated citation mapping for current draft
   * @returns Complete Stage 2 teaching feedback
   */
  public async generateStage2Teaching(
    session: WorkshopSession,
    currentDraft: string,
    previousVersion: EssayVersion,
    citationMapping?: CitationMapping
  ): Promise<Stage2TeachingOutput> {
    const research = getCollegeResearch(session.college);
    if (!research) {
      throw new Error(`College research not found: ${session.college}`);
    }

    const prompt = research.essayPrompts.find(p => p.promptId === session.promptId);
    if (!prompt) {
      throw new Error(`Essay prompt not found: ${session.promptId}`);
    }

    // Get or create citation mapping for current draft
    const citations =
      citationMapping ||
      (await haikuCitationService.createCitationMapping(
        session.college,
        session.promptId,
        currentDraft,
        session.pattern
      ));

    // 1. Analyze current draft
    const currentAnalysis = this.analyzeCurrentDraft(
      currentDraft,
      research,
      prompt,
      citations
    );

    // 2. Calculate progress from Stage 1
    const progressAssessment = this.assessProgress(
      previousVersion.analysis,
      currentAnalysis,
      session.cache.teachingHistory
    );

    // 3. Identify issues to address (excluding resolved ones)
    const issuesToAddress = this.identifyIssuesToAddress(
      currentAnalysis,
      research,
      prompt,
      citations,
      session.cache.teachingHistory
    );

    // 4. Generate deep teaching for each priority issue
    const issueTeaching = this.generateIssueTeaching(
      issuesToAddress,
      research,
      prompt,
      citations,
      session.cache.teachingHistory
    );

    // 5. Generate dimensional feedback
    const dimensionalFeedback = this.generateDimensionalFeedback(
      currentAnalysis,
      previousVersion.analysis,
      prompt,
      research
    );

    // 6. Generate targeted Socratic questions
    const socraticQuestions = this.generateTargetedSocraticQuestions(
      issuesToAddress,
      currentAnalysis,
      research,
      session.cache.teachingHistory
    );

    // 7. Build teaching narrative
    const teachingNarrative = this.buildStage2Narrative(
      research,
      prompt,
      currentAnalysis,
      progressAssessment,
      dimensionalFeedback,
      issueTeaching,
      socraticQuestions
    );

    // 8. Identify strengths and what to preserve
    const strengthsToPreserve = this.identifyStrengthsToPreserve(
      currentAnalysis,
      citations,
      research
    );

    // 9. Generate revision roadmap
    const revisionRoadmap = this.generateRevisionRoadmap(
      issuesToAddress,
      currentAnalysis,
      progressAssessment
    );

    return {
      stage: 2,
      currentAnalysis,
      progressAssessment,
      dimensionalFeedback,
      issueTeaching,
      socraticQuestions,
      teachingNarrative,
      strengthsToPreserve,
      revisionRoadmap,
      citationMapping: citations,
    };
  }

  /**
   * Analyze current draft
   *
   * Full analysis of the current draft, including dimensional scoring,
   * red/green flag detection, and authenticity assessment.
   */
  private analyzeCurrentDraft(
    currentDraft: string,
    research: CollegeResearch,
    prompt: CollegeEssayPrompt,
    citations: CitationMapping
  ): EssayAnalysis {
    const wordCount = currentDraft.split(/\s+/).length;

    // Create dimensional scores
    const categoryScores = prompt.dimensionalCriteria.map(dc => {
      // Placeholder scoring - real implementation uses Claude
      const score = 72; // Would be calculated based on actual analysis

      return {
        dimensionId: dc.dimensionId,
        dimensionName: dc.dimensionName,
        score,
        maxScore: 100,
        percentage: score,
        status: this.getStatusFromScore(score),
        justification: `Analysis of ${dc.dimensionName}`,
        strengths: [] as string[],
        weaknesses: [] as string[],
      };
    });

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
          primaryIssue: 'Needs improvement',
          howToImprove: 'Focus on...',
        })),
      elitePatterns: [],
      authenticity: {
        voiceScore: 75,
        uniquenessScore: 70,
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
   * Assess progress from Stage 1
   *
   * Compares current analysis to previous version to identify:
   * - NQI improvement
   * - Dimensions that improved
   * - Issues that were resolved
   * - Issues that persist
   */
  private assessProgress(
    previousAnalysis: EssayAnalysis,
    currentAnalysis: EssayAnalysis,
    teachingHistory: any
  ): ProgressAssessment {
    const nqiChange = currentAnalysis.nqi - previousAnalysis.nqi;

    // Find dimensions that improved
    const dimensionsImproved: DimensionImprovement[] = [];
    const dimensionsDeclined: DimensionImprovement[] = [];
    const dimensionsUnchanged: string[] = [];

    currentAnalysis.categoryScores.forEach(current => {
      const previous = previousAnalysis.categoryScores.find(
        p => p.dimensionId === current.dimensionId
      );

      if (previous) {
        const change = current.score - previous.score;
        if (change >= 5) {
          dimensionsImproved.push({
            dimensionId: current.dimensionId,
            dimensionName: current.dimensionName,
            previousScore: previous.score,
            currentScore: current.score,
            change,
            previousStatus: previous.status,
            currentStatus: current.status,
          });
        } else if (change <= -5) {
          dimensionsDeclined.push({
            dimensionId: current.dimensionId,
            dimensionName: current.dimensionName,
            previousScore: previous.score,
            currentScore: current.score,
            change,
            previousStatus: previous.status,
            currentStatus: current.status,
          });
        } else {
          dimensionsUnchanged.push(current.dimensionId);
        }
      }
    });

    // Check which issues from teaching history were resolved
    const issuesResolved: string[] = [];
    const issuesPersisting: string[] = [];

    teachingHistory.issuesAddressed.forEach((issue: any) => {
      // Check if the issue still appears in current analysis
      const stillPresent = currentAnalysis.weakCategories.some(
        wc => wc.dimensionId === issue.issueName.split('_')[0]
      );

      if (stillPresent) {
        issuesPersisting.push(issue.issueId);
      } else {
        issuesResolved.push(issue.issueId);
      }
    });

    return {
      nqiChange,
      previousNqi: previousAnalysis.nqi,
      currentNqi: currentAnalysis.nqi,
      previousTier: previousAnalysis.tier,
      currentTier: currentAnalysis.tier,
      tierChanged: previousAnalysis.tier !== currentAnalysis.tier,
      dimensionsImproved,
      dimensionsDeclined,
      dimensionsUnchanged,
      issuesResolved,
      issuesPersisting,
      overallProgress: nqiChange > 0 ? 'improved' : nqiChange < 0 ? 'declined' : 'stable',
      encouragementMessage: this.generateEncouragementMessage(
        nqiChange,
        dimensionsImproved.length,
        issuesResolved.length
      ),
    };
  }

  /**
   * Generate encouragement message based on progress
   */
  private generateEncouragementMessage(
    nqiChange: number,
    dimensionsImproved: number,
    issuesResolved: number
  ): string {
    if (nqiChange >= 10) {
      return `Excellent progress! Your essay has improved significantly. Let's build on this momentum.`;
    } else if (nqiChange >= 5) {
      return `Good progress! You've strengthened ${dimensionsImproved} dimension${dimensionsImproved !== 1 ? 's' : ''}. Keep going.`;
    } else if (nqiChange >= 0) {
      return `You've made some improvements, but there's still work to do. Let's focus on the key areas.`;
    } else {
      return `Some changes may have unintentionally weakened parts of your essay. Let's identify what happened and get back on track.`;
    }
  }

  /**
   * Identify issues to address in Stage 2
   *
   * Filters out issues that were already resolved and prioritizes
   * remaining issues based on severity and impact.
   */
  private identifyIssuesToAddress(
    analysis: EssayAnalysis,
    research: CollegeResearch,
    prompt: CollegeEssayPrompt,
    citations: CitationMapping,
    teachingHistory: any
  ): TeachingIssue[] {
    const issues: TeachingIssue[] = [];

    // Get IDs of already-addressed issues
    const addressedIssueIds = teachingHistory.issuesAddressed.map(
      (i: any) => i.issueId
    );

    // Add issues from weak/missing dimensions
    analysis.weakCategories.forEach((weak, idx) => {
      const issueId = `issue_s2_${weak.dimensionId}_${idx}`;

      // Skip if already addressed and resolved
      if (addressedIssueIds.includes(issueId)) {
        // Check if it's persisting (not resolved)
        const addressed = teachingHistory.issuesAddressed.find(
          (i: any) => i.issueId === issueId
        );
        if (addressed?.wasResolved) {
          return; // Skip resolved issues
        }
      }

      const dimension = prompt.dimensionalCriteria.find(
        dc => dc.dimensionId === weak.dimensionId
      );

      if (dimension) {
        issues.push({
          issueId,
          severity: idx === 0 ? 'critical' : 'major',
          quote: '',
          problem: weak.primaryIssue,
          whyItMatters: dimension.context,
          dimension: weak.dimensionId,
          collegeContext: {
            relevantValue: research.coreValues[0]?.valueId,
            relevantQuote: this.findRelevantQuote(weak.dimensionId, research),
          },
          teaching: {
            principle: dimension.howToImprove[0] || 'Focus on this dimension',
            explanation: `This dimension is weighted at ${dimension.weight}% for this essay.`,
            socraticQuestion: dimension.evaluationQuestions[0],
          },
          suggestions: [],
          status: 'pending',
          stageIdentified: 2,
        });
      }
    });

    // Add issues from triggered red flags
    citations.triggeredRedFlags.forEach((rf, idx) => {
      const issueId = `issue_s2_redflag_${rf.flagId}_${idx}`;

      if (addressedIssueIds.includes(issueId)) {
        return; // Skip if already addressed
      }

      const redFlag = research.redFlags.find(f => f.flagId === rf.flagId);
      if (redFlag) {
        issues.push({
          issueId,
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
          stageIdentified: 2,
        });
      }
    });

    // Sort by severity and limit
    return issues
      .sort((a, b) => {
        const severityOrder = { critical: 0, major: 1, minor: 2, optimization: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
      .slice(0, 5);
  }

  /**
   * Find relevant quote for a dimension
   */
  private findRelevantQuote(
    dimensionId: string,
    research: CollegeResearch
  ): CollegeKeyQuote | undefined {
    return research.keyQuotes.find(q =>
      q.useCases.some(uc => uc.dimension === dimensionId)
    );
  }

  /**
   * Generate deep teaching for each priority issue
   *
   * This is the heart of Stage 2 - detailed, evidence-based teaching
   * for each issue that needs to be addressed.
   */
  private generateIssueTeaching(
    issues: TeachingIssue[],
    research: CollegeResearch,
    prompt: CollegeEssayPrompt,
    citations: CitationMapping,
    teachingHistory: any
  ): IssueTeachingBlock[] {
    return issues.map((issue, idx) => {
      // Find the most relevant quote to cite
      const relevantQuote = issue.collegeContext.relevantQuote || this.findRelevantQuote(issue.dimension, research);

      // Find relevant example if available
      const relevantExample = research.eliteExamples.find(
        ex => ex.tags?.includes(issue.dimension) || ex.promptId === prompt.promptId
      );

      // Check if this principle was taught before
      const principleWasTaught = teachingHistory.principlesTaught.includes(
        issue.teaching.principle
      );

      return {
        issueId: issue.issueId,
        priority: idx + 1,
        severity: issue.severity,

        // The issue
        problemStatement: {
          summary: issue.problem,
          evidence: issue.quote || 'Identified in analysis',
          dimension: issue.dimension,
          impactOnScore: `This ${issue.severity} issue affects your ${issue.dimension} score.`,
        },

        // The teaching
        teaching: {
          // If principle was taught before, reference it instead of re-teaching
          principleTeaching: principleWasTaught
            ? `Remember the principle from Stage 1: ${issue.teaching.principle}`
            : issue.teaching.principle,

          explanation: issue.teaching.explanation,

          // College-specific evidence
          collegeEvidence: relevantQuote
            ? {
                quote: relevantQuote.quote,
                source: `${relevantQuote.source.name} (${relevantQuote.source.title})`,
                insight: relevantQuote.insight,
              }
            : undefined,

          // Example from elite database
          eliteExample: relevantExample
            ? {
                exampleId: relevantExample.exampleId,
                technique: relevantExample.teachableTechniques[0]?.technique || 'Technique from this example',
                whatWorks: relevantExample.teachableTechniques[0]?.howItWorks || 'What works in this example',
                excerptToLearnFrom: relevantExample.teachableTechniques[0]?.whereInExample || '',
              }
            : undefined,
        },

        // Socratic question to guide discovery
        socraticQuestion: {
          question: issue.teaching.socraticQuestion || `How might you strengthen the ${issue.dimension} in your essay?`,
          purpose: `Guide discovery about ${issue.dimension}`,
          followUpPrompt: 'What specific changes would address this?',
        },

        // Actionable suggestions
        suggestions: this.generateSuggestionsForIssue(issue, research, prompt),
      };
    });
  }

  /**
   * Generate specific suggestions for an issue
   */
  private generateSuggestionsForIssue(
    issue: TeachingIssue,
    research: CollegeResearch,
    prompt: CollegeEssayPrompt
  ): IssueSuggestion[] {
    const dimension = prompt.dimensionalCriteria.find(
      dc => dc.dimensionId === issue.dimension
    );

    if (!dimension) {
      return [];
    }

    return [
      {
        type: 'specific_action',
        suggestion: dimension.howToImprove[0] || 'Focus on improving this dimension',
        rationale: `This addresses the ${issue.severity} ${issue.dimension} issue.`,
        exampleApproach: dimension.scoringLogic.strong[0] || 'Strong essays do this...',
      },
      {
        type: 'question_to_ask_yourself',
        suggestion: dimension.evaluationQuestions[0] || `Does my essay demonstrate ${issue.dimension}?`,
        rationale: 'Use this question to self-evaluate your revision.',
      },
    ];
  }

  /**
   * Generate dimensional feedback
   *
   * Provides detailed feedback for each dimension with comparison
   * to previous version.
   */
  private generateDimensionalFeedback(
    currentAnalysis: EssayAnalysis,
    previousAnalysis: EssayAnalysis,
    prompt: CollegeEssayPrompt,
    research: CollegeResearch
  ): DimensionalFeedback[] {
    return currentAnalysis.categoryScores.map(current => {
      const previous = previousAnalysis.categoryScores.find(
        p => p.dimensionId === current.dimensionId
      );

      const dimension = prompt.dimensionalCriteria.find(
        dc => dc.dimensionId === current.dimensionId
      );

      const change = previous ? current.score - previous.score : 0;

      return {
        dimensionId: current.dimensionId,
        dimensionName: current.dimensionName,
        weight: dimension?.weight || 0,

        // Scores
        currentScore: current.score,
        previousScore: previous?.score || current.score,
        change,
        status: current.status,
        previousStatus: previous?.status,

        // Feedback
        feedback: this.generateDimensionFeedback(current, change, dimension),

        // What would make it stronger
        toImprove: dimension?.howToImprove || [],

        // Evaluation questions for self-assessment
        selfCheckQuestions: dimension?.evaluationQuestions || [],
      };
    });
  }

  /**
   * Generate feedback text for a dimension
   */
  private generateDimensionFeedback(
    score: any,
    change: number,
    dimension: any
  ): string {
    const statusText =
      score.status === 'strong' || score.status === 'exceptional'
        ? 'This is a strength.'
        : score.status === 'adequate'
        ? 'This is adequate but could be stronger.'
        : 'This needs work.';

    const changeText =
      change > 5
        ? ` (Improved from last version!)`
        : change < -5
        ? ` (This declined from last version - let's address this.)`
        : '';

    return `${statusText}${changeText}`;
  }

  /**
   * Generate targeted Socratic questions for Stage 2
   *
   * These questions build on Stage 1 and focus on the specific
   * issues identified in the current draft.
   */
  private generateTargetedSocraticQuestions(
    issues: TeachingIssue[],
    analysis: EssayAnalysis,
    research: CollegeResearch,
    teachingHistory: any
  ): Stage2SocraticQuestion[] {
    const questions: Stage2SocraticQuestion[] = [];

    // Don't repeat questions that were already asked
    const askedQuestions = teachingHistory.questionsAsked || [];

    // Question about progress awareness
    questions.push({
      questionId: 'sq2_progress_awareness',
      question: 'What changes did you make based on Stage 1 feedback? What was your thinking behind those changes?',
      purpose: 'Understand student\'s revision process and reasoning',
      targetsDimension: 'overall',
      isFollowUp: false,
    });

    // Questions based on remaining issues
    issues.slice(0, 2).forEach((issue, idx) => {
      const questionId = `sq2_issue_${issue.issueId}`;
      if (!askedQuestions.includes(questionId)) {
        questions.push({
          questionId,
          question: issue.teaching.socraticQuestion || `What would make your ${issue.dimension} stronger in this essay?`,
          purpose: `Guide improvement on ${issue.dimension}`,
          targetsDimension: issue.dimension,
          isFollowUp: false,
        });
      }
    });

    // Question about authenticity if score is low
    if (analysis.authenticity.voiceScore < 75) {
      questions.push({
        questionId: 'sq2_voice_authenticity',
        question: 'Are there any sentences in your essay where you\'re saying what you think admissions wants to hear rather than what you actually think?',
        purpose: 'Surface inauthenticity for revision',
        targetsDimension: 'authentic_voice',
        isFollowUp: false,
      });
    }

    // Deep-dive question for primary value
    const primaryValue = research.coreValues[0];
    questions.push({
      questionId: 'sq2_primary_value_deep',
      question: `If ${research.collegeName} could only see ONE moment in your essay that demonstrates ${primaryValue.valueName.toLowerCase()}, which would it be? Is that moment vivid and specific enough?`,
      purpose: `Strengthen demonstration of ${primaryValue.valueName}`,
      targetsDimension: primaryValue.valueId,
      isFollowUp: false,
    });

    return questions;
  }

  /**
   * Build Stage 2 teaching narrative
   *
   * Creates the complete teaching output that combines progress
   * acknowledgment with focused improvement guidance.
   */
  private buildStage2Narrative(
    research: CollegeResearch,
    prompt: CollegeEssayPrompt,
    analysis: EssayAnalysis,
    progress: ProgressAssessment,
    dimensionalFeedback: DimensionalFeedback[],
    issueTeaching: IssueTeachingBlock[],
    socraticQuestions: Stage2SocraticQuestion[]
  ): string {
    const narrative: string[] = [];

    // Opening - acknowledge progress
    narrative.push(`# Stage 2: Development\n`);
    narrative.push(`## Progress Check\n`);
    narrative.push(`${progress.encouragementMessage}\n\n`);

    // Score update
    narrative.push(`**Current Score**: ${analysis.nqi}/100 (${analysis.tier})`);
    if (progress.nqiChange !== 0) {
      const direction = progress.nqiChange > 0 ? '↑' : '↓';
      narrative.push(` ${direction} ${Math.abs(progress.nqiChange)} points from Stage 1\n\n`);
    } else {
      narrative.push(`\n\n`);
    }

    // Dimensions that improved
    if (progress.dimensionsImproved.length > 0) {
      narrative.push(`### Dimensions That Improved\n`);
      progress.dimensionsImproved.forEach(dim => {
        narrative.push(`- ✅ **${dim.dimensionName}**: ${dim.previousStatus} → ${dim.currentStatus} (+${dim.change} points)\n`);
      });
      narrative.push(`\n`);
    }

    // Dimensions that need work
    const needsWork = dimensionalFeedback.filter(
      df => df.status === 'weak' || df.status === 'missing'
    );
    if (needsWork.length > 0) {
      narrative.push(`### Dimensions Still Needing Work\n`);
      needsWork.forEach(dim => {
        narrative.push(`- ⚠️ **${dim.dimensionName}** (${dim.status}): ${dim.feedback}\n`);
      });
      narrative.push(`\n`);
    }

    // Deep teaching for priority issues
    narrative.push(`---\n\n`);
    narrative.push(`## Priority Areas to Address\n\n`);

    issueTeaching.forEach((teaching, idx) => {
      narrative.push(`### ${idx + 1}. ${teaching.problemStatement.dimension}\n\n`);

      // Problem
      narrative.push(`**The Issue**: ${teaching.problemStatement.summary}\n\n`);

      // Teaching
      narrative.push(`**The Principle**: ${teaching.teaching.principleTeaching}\n\n`);

      // College evidence if available
      if (teaching.teaching.collegeEvidence) {
        narrative.push(`> "${teaching.teaching.collegeEvidence.quote}"\n`);
        narrative.push(`> — ${teaching.teaching.collegeEvidence.source}\n\n`);
      }

      // Elite example if available
      if (teaching.teaching.eliteExample) {
        narrative.push(`**Learn from Elite Example**:\n`);
        narrative.push(`*Technique*: ${teaching.teaching.eliteExample.technique}\n`);
        narrative.push(`*What Works*: ${teaching.teaching.eliteExample.whatWorks}\n\n`);
      }

      // Socratic question
      narrative.push(`**Question to Consider**: ${teaching.socraticQuestion.question}\n\n`);

      // Suggestions
      if (teaching.suggestions.length > 0) {
        narrative.push(`**Specific Actions**:\n`);
        teaching.suggestions.forEach(sug => {
          narrative.push(`- ${sug.suggestion}\n`);
        });
        narrative.push(`\n`);
      }
    });

    // Additional Socratic questions
    narrative.push(`---\n\n`);
    narrative.push(`## Questions for Your Revision\n\n`);
    socraticQuestions.forEach((sq, idx) => {
      narrative.push(`${idx + 1}. ${sq.question}\n\n`);
    });

    // Closing
    narrative.push(`---\n\n`);
    narrative.push(`**Next Steps**: Focus on the top 2-3 issues above. Don't try to fix everything at once. In Stage 3, we'll do a final polish.\n`);

    return narrative.join('');
  }

  /**
   * Identify strengths to preserve
   */
  private identifyStrengthsToPreserve(
    analysis: EssayAnalysis,
    citations: CitationMapping,
    research: CollegeResearch
  ): Stage2Strength[] {
    const strengths: Stage2Strength[] = [];

    // Add from strong dimensions
    analysis.categoryScores
      .filter(cs => cs.status === 'strong' || cs.status === 'exceptional')
      .forEach(cs => {
        strengths.push({
          strengthId: `s2_strength_${cs.dimensionId}`,
          dimension: cs.dimensionName,
          status: cs.status,
          evidence: cs.justification,
          preservationAdvice: 'Keep this element strong. Don\'t over-edit.',
          warningAboutOverEditing: 'Heavy editing here could weaken what\'s already working.',
        });
      });

    // Add from green flags
    citations.greenFlagOpportunities.forEach(gf => {
      const greenFlag = research.greenFlags.find(f => f.flagId === gf.flagId);
      if (greenFlag) {
        strengths.push({
          strengthId: `s2_strength_${gf.flagId}`,
          dimension: greenFlag.flagName,
          status: 'strong',
          evidence: gf.opportunity,
          preservationAdvice: greenFlag.teaching.howToEnhance,
        });
      }
    });

    return strengths;
  }

  /**
   * Generate revision roadmap
   *
   * Clear, prioritized steps for the student to take.
   */
  private generateRevisionRoadmap(
    issues: TeachingIssue[],
    analysis: EssayAnalysis,
    progress: ProgressAssessment
  ): RevisionStep[] {
    const steps: RevisionStep[] = [];

    // If there was regression, address that first
    if (progress.dimensionsDeclined.length > 0) {
      steps.push({
        priority: 1,
        action: `Review changes that may have weakened: ${progress.dimensionsDeclined.map(d => d.dimensionName).join(', ')}`,
        rationale: 'Address regression before moving forward',
        estimatedImpact: 'Recover lost points',
        timeGuidance: 'Review first, before other revisions',
      });
    }

    // Add steps for priority issues
    issues.slice(0, 3).forEach((issue, idx) => {
      steps.push({
        priority: steps.length + 1,
        action: `Strengthen ${issue.dimension}: ${issue.teaching.principle}`,
        rationale: `This is a ${issue.severity} issue affecting your score.`,
        estimatedImpact: `Could improve ${issue.dimension} from ${analysis.categoryScores.find(c => c.dimensionId === issue.dimension)?.status || 'weak'} to stronger`,
        timeGuidance: 'Spend focused time on this specific dimension',
      });
    });

    // Voice/authenticity check
    if (analysis.authenticity.voiceScore < 80) {
      steps.push({
        priority: steps.length + 1,
        action: 'Read essay aloud and mark any phrases that don\'t sound like you',
        rationale: 'Authentic voice is foundational to strong essays',
        estimatedImpact: 'More genuine, engaging essay',
        timeGuidance: '15-20 minutes',
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
// STAGE 2 OUTPUT TYPES
// ============================================================================

/**
 * Complete Stage 2 teaching output
 */
export interface Stage2TeachingOutput {
  stage: 2;
  currentAnalysis: EssayAnalysis;
  progressAssessment: ProgressAssessment;
  dimensionalFeedback: DimensionalFeedback[];
  issueTeaching: IssueTeachingBlock[];
  socraticQuestions: Stage2SocraticQuestion[];
  teachingNarrative: string;
  strengthsToPreserve: Stage2Strength[];
  revisionRoadmap: RevisionStep[];
  citationMapping: CitationMapping;
}

/**
 * Progress assessment from Stage 1 to Stage 2
 */
export interface ProgressAssessment {
  nqiChange: number;
  previousNqi: number;
  currentNqi: number;
  previousTier: string;
  currentTier: string;
  tierChanged: boolean;
  dimensionsImproved: DimensionImprovement[];
  dimensionsDeclined: DimensionImprovement[];
  dimensionsUnchanged: string[];
  issuesResolved: string[];
  issuesPersisting: string[];
  overallProgress: 'improved' | 'declined' | 'stable';
  encouragementMessage: string;
}

/**
 * Dimension improvement tracking
 */
export interface DimensionImprovement {
  dimensionId: string;
  dimensionName: string;
  previousScore: number;
  currentScore: number;
  change: number;
  previousStatus: DimensionStrength;
  currentStatus: DimensionStrength;
}

/**
 * Dimensional feedback for Stage 2
 */
export interface DimensionalFeedback {
  dimensionId: string;
  dimensionName: string;
  weight: number;
  currentScore: number;
  previousScore: number;
  change: number;
  status: DimensionStrength;
  previousStatus?: DimensionStrength;
  feedback: string;
  toImprove: string[];
  selfCheckQuestions: string[];
}

/**
 * Issue teaching block
 */
export interface IssueTeachingBlock {
  issueId: string;
  priority: number;
  severity: 'critical' | 'major' | 'minor' | 'optimization';
  problemStatement: {
    summary: string;
    evidence: string;
    dimension: string;
    impactOnScore: string;
  };
  teaching: {
    principleTeaching: string;
    explanation: string;
    collegeEvidence?: {
      quote: string;
      source: string;
      insight: string;
    };
    eliteExample?: {
      exampleId: string;
      technique: string;
      whatWorks: string;
      excerptToLearnFrom: string;
    };
  };
  socraticQuestion: {
    question: string;
    purpose: string;
    followUpPrompt: string;
  };
  suggestions: IssueSuggestion[];
}

/**
 * Issue suggestion
 */
export interface IssueSuggestion {
  type: 'specific_action' | 'question_to_ask_yourself' | 'example_to_consider';
  suggestion: string;
  rationale: string;
  exampleApproach?: string;
}

/**
 * Stage 2 Socratic question
 */
export interface Stage2SocraticQuestion {
  questionId: string;
  question: string;
  purpose: string;
  targetsDimension: string;
  isFollowUp: boolean;
}

/**
 * Stage 2 strength to preserve
 */
export interface Stage2Strength {
  strengthId: string;
  dimension: string;
  status: DimensionStrength;
  evidence: string;
  preservationAdvice: string;
  warningAboutOverEditing?: string;
}

/**
 * Revision step
 */
export interface RevisionStep {
  priority: number;
  action: string;
  rationale: string;
  estimatedImpact: string;
  timeGuidance?: string;
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const stage2TeachingService = new Stage2TeachingService();
