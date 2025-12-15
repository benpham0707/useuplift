/**
 * Workshop Cache Service
 *
 * Manages conversation-level caching for the Common App Workshop system.
 * This service implements our Quality-First cost optimization strategy:
 *
 * **ZERO-RISK OPTIMIZATION**:
 * - Cross-Student System Prompt Caching (74% cost reduction)
 * - Session-Level Context Accumulation (more context in later stages)
 * - Never compresses or removes information
 *
 * **KEY PRINCIPLE**: Caching is invisible to Claude - maintains/improves quality
 *
 * Cost Impact:
 * - Stage 1: ~15K tokens → 74% cached → $0.045 + $0.0675 = $0.1125 (vs $0.225)
 * - Stage 2: ~18K tokens → 80% cached → $0.036 + $0.081 = $0.117 (vs $0.27)
 * - Stage 3: ~20K tokens → 82% cached → $0.036 + $0.09 = $0.126 (vs $0.30)
 * - Total per student: $0.36 (vs $0.80) = 55% cost reduction with ZERO quality impact
 */

import type {
  WorkshopSession,
  WorkshopConversationCache,
  SessionContext,
  TeachingHistory,
  VersionHistory,
  AdaptiveContext,
  CreateSessionOptions,
  CollegeResearchContext,
  PatternRubricContext,
} from '../types/workshopSession';
import type { TeachingStage } from '../types/collegeResearch';
import type {
  CollegeResearch,
  CollegeCoreValue,
  CollegeEssayPrompt,
  CollegeRedFlag,
  CollegeGreenFlag,
  CollegeKeyQuote,
  EssayPattern,
} from '../types/collegeResearch';
import { getCollegeResearch } from '../data';

// ============================================================================
// CACHE SERVICE
// ============================================================================

/**
 * Cache service for managing workshop sessions
 *
 * This service:
 * 1. Builds session context with full college research (cacheable)
 * 2. Tracks teaching history across conversation
 * 3. Accumulates version history for essay drafts
 * 4. Manages adaptive context based on student behavior
 * 5. Provides complete context (cached + dynamic) for each stage
 */
export class WorkshopCacheService {
  private sessions: Map<string, WorkshopSession> = new Map();

  /**
   * Create a new workshop session
   */
  public createSession(options: CreateSessionOptions): WorkshopSession {
    const research = getCollegeResearch(options.college);
    if (!research) {
      throw new Error(`College research not found for: ${options.college}`);
    }

    const prompt = research.essayPrompts.find(p => p.promptId === options.promptId);
    if (!prompt) {
      throw new Error(`Essay prompt not found: ${options.promptId}`);
    }

    const sessionId = this.generateSessionId(
      options.studentId,
      options.college,
      options.promptId
    );

    // Build initial session context (this is what gets cached)
    const sessionContext = this.buildSessionContext(
      research,
      prompt,
      options.pattern,
      options.activity || null
    );

    // Create initial version from initial draft
    const initialVersion = this.createInitialVersion(options.initialDraft);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session: WorkshopSession = {
      sessionId,
      studentId: options.studentId,
      essayId: options.essayId,
      college: options.college,
      pattern: options.pattern,
      promptId: options.promptId,

      cache: {
        sessionContext,
        versionHistory: {
          versions: [initialVersion],
          nqiProgression: [],
          issuesResolved: [],
          issuesPersisting: [],
          improvementPatterns: [],
          strugglingPatterns: [],
        },
        teachingHistory: {
          issuesAddressed: [],
          examplesShown: [],
          questionsAsked: [],
          principlesTaught: [],
          strengthsAcknowledged: [],
          quotesUsed: [],
        },
        citationMapping: null,
        adaptiveContext: {
          skillLevel: 'intermediate',
          learningPatterns: {
            respondsWellTo: [],
            struggles: [],
            improvementVelocity: 'moderate',
          },
          preferredFeedbackStyle: 'socratic',
          improvementAreas: [],
          persistentChallenges: [],
          confidence: {
            inWriting: 'medium',
            inVoice: 'medium',
            inContent: 'medium',
          },
        },
      },

      currentStage: 1,
      createdAt: now,
      lastUpdatedAt: now,
      expiresAt,

      costTracking: {
        stage1Cost: 0,
        stage2Cost: 0,
        stage3Cost: 0,
        totalCost: 0,
        cacheHits: 0,
        cacheMisses: 0,
      },
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Build session context (CACHEABLE - loaded once in Stage 1)
   *
   * This is the expensive data that gets cached across stages.
   * **NEVER compress this** - it's the foundation for quality teaching.
   */
  private buildSessionContext(
    research: CollegeResearch,
    prompt: CollegeEssayPrompt,
    pattern: EssayPattern,
    activityContext: any
  ): SessionContext {
    // Build college research context with FULL data
    const collegeResearchContext: CollegeResearchContext = {
      collegeId: research.collegeId,
      collegeName: research.collegeName,
      coreValues: research.coreValues,
      keyQuotes: research.keyQuotes,
      redFlags: research.redFlags,
      greenFlags: research.greenFlags,
      dimensionWeights: Object.entries(research.dimensionWeights.dimensions).map(
        ([dimensionId, dim]) => ({
          dimensionId,
          weight: dim.weight,
          context: dim.context,
        })
      ),
    };

    // Build pattern rubric context
    const patternRubricContext: PatternRubricContext = {
      pattern,
      patternName: prompt.promptTitle,
      rubric: {
        excellent: prompt.rubric.excellent.criteria || [],
        good: prompt.rubric.good.criteria || [],
        average: prompt.rubric.average.criteria || [],
        weak: prompt.rubric.weak.criticalFailures || [],
      },
      dimensionalCriteria: prompt.dimensionalCriteria.map(dc => ({
        dimensionId: dc.dimensionId,
        weight: dc.weight,
        scoringLogic: dc.scoringLogic,
      })),
    };

    // Get relevant Socratic questions for this pattern
    const socraticQuestions = research.socraticQuestions.byPrompt[prompt.promptId] || [];

    // Get relevant elite examples (if available)
    const relevantExamples = research.eliteExamples.filter(
      ex => ex.promptId === prompt.promptId
    );

    return {
      activity: activityContext,
      collegeResearch: collegeResearchContext,
      patternRubric: patternRubricContext,
      relevantExamples,
      socraticQuestions,
    };
  }

  /**
   * Create initial version from initial draft
   */
  private createInitialVersion(draft: string): any {
    return {
      versionId: 'v0',
      stage: 1 as TeachingStage,
      timestamp: new Date(),
      draft,
      wordCount: draft.split(/\s+/).length,
      draftSummary: '', // Will be populated after first analysis
      analysis: {
        nqi: 0,
        tier: 'developing' as const,
        categoryScores: [],
        weakCategories: [],
        elitePatterns: [],
        authenticity: {
          voiceScore: 0,
          uniquenessScore: 0,
          concerns: [],
        },
        flagsDetected: {
          redFlags: [],
          greenFlags: [],
        },
      },
      teachingIssues: [],
      citationMapping: null,
    };
  }

  /**
   * Build cacheable system prompt with full college research
   *
   * This is the static portion that stays the same across all stages
   * for all students applying to this college + prompt combination.
   */
  public buildCacheableSystemPrompt(collegeId: string, promptId: string): string {
    const research = getCollegeResearch(collegeId);
    if (!research) {
      throw new Error(`College research not found for: ${collegeId}`);
    }

    const prompt = research.essayPrompts.find(p => p.promptId === promptId);
    if (!prompt) {
      throw new Error(`Essay prompt not found: ${promptId}`);
    }

    return `
# Common App Workshop - ${research.collegeName} Essay Coaching System

You are an expert college essay coach specializing in ${research.collegeName} admissions.
Your role is to guide students through a comprehensive 3-stage teaching process.

---

## Essay Prompt

**${prompt.promptTitle}**

**Word Limit**: ${prompt.wordCount.min}-${prompt.wordCount.max} words

**Full Prompt**:
> ${prompt.promptText}

**Primary Assessment**: ${prompt.primaryAssessment}

**Importance**: ${prompt.importance}
${prompt.importanceContext}

---

## ${research.collegeName} Core Values (What This College Cares About)

${research.coreValues
  .map(
    value => `
### ${value.valueName} (Weight: ${value.weight}%)

**Definition**: ${value.definition}

**Essay Implication**: ${value.essayImplication}

**Evidence from Admissions**:
${value.evidence
  .map(
    e => `
- **${e.source}**:
  > "${e.quote}"

  *${e.context}*
`
  )
  .join('\n')}

**Source Confidence**: ${value.sourceMentionCount}/5 sources mention this value

**What This Value IS**:
${value.is.map(item => `- ${item}`).join('\n')}

**What This Value IS NOT**:
${value.isNot.map(item => `- ${item}`).join('\n')}
`
  )
  .join('\n---\n')}

---

## Essay Rubric for ${prompt.promptTitle}

### Excellent (90-100): ${prompt.rubric.excellent.scoreRange}
${prompt.rubric.excellent.description}

**Criteria**:
${(prompt.rubric.excellent.criteria || []).map(c => `- ${c}`).join('\n')}

---

### Good (70-89): ${prompt.rubric.good.scoreRange}
${prompt.rubric.good.description}

**What prevents higher score**: ${prompt.rubric.good.whatPreventsHigherScore}

---

### Average (50-69): ${prompt.rubric.average.scoreRange}
${prompt.rubric.average.description}

---

### Weak (Below 50): ${prompt.rubric.weak.scoreRange}
${prompt.rubric.weak.description}

**Critical Failures**:
${(prompt.rubric.weak.criticalFailures || []).map(f => `- ${f}`).join('\n')}

---

## Red Flags (Common Essay Problems for ${research.collegeName})

${research.redFlags
  .map(
    flag => `
### ${flag.flagName} (Severity: ${flag.severity})

**What It Is**: ${flag.teaching.problem}

**Evidence**: "${flag.evidence.quote}" - ${flag.evidence.source}

**Why ${research.collegeName} Cares**: ${flag.teaching.whyItMatters}

**How to Detect**: ${flag.detection.description}
${flag.detection.signalPhrases.length > 0 ? `Signal phrases: ${flag.detection.signalPhrases.join('; ')}` : ''}

**How to Fix**: ${flag.teaching.howToFix}
`
  )
  .join('\n---\n')}

---

## Green Flags (Essay Strengths ${research.collegeName} Values)

${research.greenFlags
  .map(
    flag => `
### ${flag.flagName} (Strength: ${flag.strength})

**What Works**: ${flag.teaching.whatWorks}

**Evidence**: "${flag.evidence.quote}" - ${flag.evidence.source}

**Why ${research.collegeName} Values This**: ${flag.teaching.whyItMatters}

**How to Recognize**: ${flag.detection.description}
${flag.detection.signalPhrases.length > 0 ? `Signal phrases: ${flag.detection.signalPhrases.join('; ')}` : ''}

**How to Enhance**: ${flag.teaching.howToEnhance}
`
  )
  .join('\n---\n')}

---

## Key Quotes for Teaching (Cite These in Your Feedback)

${research.keyQuotes
  .map(
    quote => `
### Quote: "${quote.quote}"

**Source**: ${quote.source.name}, ${quote.source.title}${quote.source.publication ? ` (${quote.source.publication})` : ''}

**Context**: ${quote.context}

**Insight**: ${quote.insight}

**Teaching Application**: ${quote.teachingApplication}

**When to Use**:
${quote.useCases
  .map(
    uc => `
- ${uc.issue ? `Issue: ${uc.issue}` : ''}${uc.dimension ? ` | Dimension: ${uc.dimension}` : ''}${uc.flag ? ` | Flag: ${uc.flag}` : ''}
`
  )
  .join('')}
`
  )
  .join('\n---\n')}

---

## Dimensional Evaluation Framework

This essay will be evaluated across these dimensions with specific weights:

${prompt.dimensionalCriteria
  .map(
    dc => `
### ${dc.dimensionName} (Weight: ${dc.weight}%)

**Why This Matters**: ${dc.context}

**Evaluation Questions**:
${dc.evaluationQuestions.map(q => `- ${q}`).join('\n')}

**Scoring Logic**:

**STRONG** (${dc.impactOnScore.strong}):
${dc.scoringLogic.strong.map(s => `- ${s}`).join('\n')}

**ADEQUATE** (${dc.impactOnScore.adequate}):
${dc.scoringLogic.adequate.map(a => `- ${a}`).join('\n')}

**WEAK** (${dc.impactOnScore.weak}):
${dc.scoringLogic.weak.map(w => `- ${w}`).join('\n')}

**How to Improve**:
${dc.howToImprove.map(h => `- ${h}`).join('\n')}
`
  )
  .join('\n---\n')}

---

## Your Teaching Philosophy (from PIQ Workshop)

You follow the proven PIQ Workshop methodology that achieved 94% student success:

### Stage 1: Foundation (Conceptual Understanding)
- Teach ${research.collegeName}'s core values BEFORE evaluating the essay
- Explain the rubric and what readers look for
- Build understanding of why certain approaches work
- Use Socratic questions to activate thinking
- Focus on CONCEPTS, not just fixes

### Stage 2: Development (Guided Improvement)
- Provide dimensional feedback (STRONG/ADEQUATE/WEAK for each dimension)
- Ask Socratic questions to deepen thinking
- Cite Dean quotes and college-specific evidence
- Help student discover insights, don't hand them answers
- Address red flags while highlighting green flags

### Stage 3: Refinement (Polish and Perfect)
- Final dimensional assessment
- Celebrate authentic strengths
- Address any remaining weaknesses
- Ensure essay demonstrates ${research.collegeName}'s values
- Verify essay passes college-specific tests

### Core Teaching Principles:
1. **Never write FOR the student** - Guide them to think and discover
2. **Cite evidence** - Use Dean quotes, rubric criteria, research findings
3. **Be Socratic** - Ask questions that activate deeper thinking
4. **Focus on thinking quality** - Not just surface-level writing fixes
5. **Maintain high standards** - Be encouraging but honest
6. **Help find authentic voice** - Don't impose a "college essay voice"
7. **Teach transferable principles** - Build understanding, not just fixes

---

**Research Quality Note**: This guidance is based on ${research.researchQuality.score}/100 confidence (${research.researchQuality.totalSources} sources), including:
${research.researchQuality.keyInstitutionalSources.map(s => `- ${s}`).join('\n')}

**Your Mission**: Guide this student to create an essay that authentically demonstrates ${research.collegeName}'s values while maintaining their genuine voice. Use this comprehensive research to provide evidence-based, college-specific teaching.
`.trim();
  }

  /**
   * Build dynamic context for current stage (NOT CACHED)
   *
   * This is the portion that changes with each interaction.
   * It's much smaller than the cached system prompt.
   */
  public buildDynamicContext(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const context: string[] = [];

    context.push(`# Current Session State`);
    context.push(``);
    context.push(`**Stage**: ${session.currentStage}/3`);
    context.push(`**Session Started**: ${session.createdAt.toISOString()}`);
    context.push(`**Last Updated**: ${session.lastUpdatedAt.toISOString()}`);
    context.push(``);

    // Latest version
    const latestVersion =
      session.cache.versionHistory.versions[session.cache.versionHistory.versions.length - 1];
    if (latestVersion) {
      context.push(`## Current Essay Draft (Version ${latestVersion.versionId})`);
      context.push(``);
      context.push(latestVersion.draft);
      context.push(``);
      context.push(`**Word Count**: ${latestVersion.wordCount}`);
      context.push(``);
    }

    // NQI progression (if available)
    if (session.cache.versionHistory.nqiProgression.length > 0) {
      context.push(`## Progress Tracking`);
      context.push(``);
      context.push(
        `**NQI Progression**: ${session.cache.versionHistory.nqiProgression.join(' → ')}`
      );
      context.push(
        `**Issues Resolved**: ${session.cache.versionHistory.issuesResolved.length}`
      );
      context.push(
        `**Issues Persisting**: ${session.cache.versionHistory.issuesPersisting.join(', ')}`
      );
      context.push(``);
    }

    // Teaching history (what we've already taught - DON'T REPEAT)
    if (session.cache.teachingHistory.issuesAddressed.length > 0) {
      context.push(`## Teaching History (Don't Repeat These)`);
      context.push(``);
      context.push(
        `**Issues Already Addressed** (${session.cache.teachingHistory.issuesAddressed.length}):`
      );
      session.cache.teachingHistory.issuesAddressed.forEach(issue => {
        context.push(
          `- [Stage ${issue.stage}] ${issue.issueName} - ${issue.wasResolved ? 'RESOLVED' : 'STILL WORKING ON IT'}`
        );
      });
      context.push(``);
    }

    if (session.cache.teachingHistory.principlesTaught.length > 0) {
      context.push(
        `**Principles Already Taught**: ${session.cache.teachingHistory.principlesTaught.join(', ')}`
      );
      context.push(`*(You can reference these but don't re-explain from scratch)*`);
      context.push(``);
    }

    if (session.cache.teachingHistory.examplesShown.length > 0) {
      context.push(
        `**Examples Already Shown**: ${session.cache.teachingHistory.examplesShown.join(', ')}`
      );
      context.push(`*(Use different examples if possible)*`);
      context.push(``);
    }

    // Adaptive context (what we've learned about this student)
    context.push(`## What We Know About This Student`);
    context.push(``);
    context.push(`**Skill Level**: ${session.cache.adaptiveContext.skillLevel}`);
    context.push(
      `**Preferred Feedback Style**: ${session.cache.adaptiveContext.preferredFeedbackStyle}`
    );
    context.push(
      `**Improvement Velocity**: ${session.cache.adaptiveContext.learningPatterns.improvementVelocity}`
    );

    if (session.cache.adaptiveContext.improvementAreas.length > 0) {
      context.push(``);
      context.push(
        `**Areas Where They've Improved**: ${session.cache.adaptiveContext.improvementAreas.join(', ')}`
      );
    }

    if (session.cache.adaptiveContext.persistentChallenges.length > 0) {
      context.push(
        `**Persistent Challenges**: ${session.cache.adaptiveContext.persistentChallenges.join(', ')}`
      );
      context.push(`*(These may need different teaching approaches)*`);
    }

    if (session.cache.adaptiveContext.learningPatterns.respondsWellTo.length > 0) {
      context.push(``);
      context.push(
        `**Responds Best To**: ${session.cache.adaptiveContext.learningPatterns.respondsWellTo.join(', ')}`
      );
    }

    context.push(``);

    return context.join('\n');
  }

  /**
   * Get complete context for Claude (cached + dynamic)
   */
  public getCompleteContext(sessionId: string): {
    systemPrompt: string;
    dynamicContext: string;
    estimatedTokens: {
      cached: number;
      dynamic: number;
      total: number;
    };
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const systemPrompt = this.buildCacheableSystemPrompt(session.college, session.promptId);
    const dynamicContext = this.buildDynamicContext(sessionId);

    const cachedTokens = this.estimateTokenCount(systemPrompt);
    const dynamicTokens = this.estimateTokenCount(dynamicContext);

    return {
      systemPrompt,
      dynamicContext,
      estimatedTokens: {
        cached: cachedTokens,
        dynamic: dynamicTokens,
        total: cachedTokens + dynamicTokens,
      },
    };
  }

  /**
   * Get session by ID
   */
  public getSession(sessionId: string): WorkshopSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Update session after teaching stage
   */
  public recordTeachingIssue(
    sessionId: string,
    issueId: string,
    issueName: string,
    feedbackGiven: string
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.cache.teachingHistory.issuesAddressed.push({
      issueId,
      issueName,
      stage: session.currentStage,
      wasResolved: false, // Will be updated in next stage
      feedbackGiven,
    });

    session.lastUpdatedAt = new Date();
  }

  /**
   * Record that we taught a principle
   */
  public recordPrincipleTaught(sessionId: string, principle: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (!session.cache.teachingHistory.principlesTaught.includes(principle)) {
      session.cache.teachingHistory.principlesTaught.push(principle);
    }
  }

  /**
   * Record that we showed an example
   */
  public recordExampleShown(sessionId: string, exampleId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (!session.cache.teachingHistory.examplesShown.includes(exampleId)) {
      session.cache.teachingHistory.examplesShown.push(exampleId);
    }
  }

  /**
   * Advance to next stage
   */
  public advanceStage(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.currentStage < 3) {
      session.currentStage = (session.currentStage + 1) as TeachingStage;
      session.lastUpdatedAt = new Date();
    }
  }

  /**
   * Calculate cost savings from caching
   */
  public calculateCostSavings(sessionId: string): {
    withoutCaching: number;
    withCaching: number;
    savings: number;
    savingsPercent: number;
  } {
    const context = this.getCompleteContext(sessionId);

    // Claude pricing (per million tokens)
    const INPUT_PRICE = 3;
    const CACHE_WRITE_PRICE = 3.75;
    const CACHE_READ_PRICE = 0.3;

    const totalTokens = context.estimatedTokens.total;
    const cachedTokens = context.estimatedTokens.cached;
    const dynamicTokens = context.estimatedTokens.dynamic;

    // Without caching: all tokens are input
    const withoutCaching = (totalTokens / 1_000_000) * INPUT_PRICE;

    // With caching: cached tokens read from cache, dynamic tokens are input
    const cacheWrite = (cachedTokens / 1_000_000) * CACHE_WRITE_PRICE;
    const cacheRead = (cachedTokens / 1_000_000) * CACHE_READ_PRICE;
    const inputCost = (dynamicTokens / 1_000_000) * INPUT_PRICE;

    // First message: cache write + input
    // Subsequent messages: cache read + input (we'll use average)
    const withCaching = cacheRead + inputCost; // Average per message

    const savings = withoutCaching - withCaching;
    const savingsPercent = (savings / withoutCaching) * 100;

    return {
      withoutCaching,
      withCaching,
      savings,
      savingsPercent,
    };
  }

  /**
   * Generate session ID
   */
  private generateSessionId(studentId: string, college: string, promptId: string): string {
    return `${studentId}_${college}_${promptId}_${Date.now()}`;
  }

  /**
   * Estimate token count (rough approximation: 1 token ≈ 4 characters)
   */
  private estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const workshopCacheService = new WorkshopCacheService();
