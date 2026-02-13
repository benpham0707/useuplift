// @ts-nocheck
/**
 * Portfolio Narrative Service
 *
 * HOLISTIC PORTFOLIO STORY ANALYSIS (Replaces rigid archetype detection)
 *
 * PURPOSE:
 * ========
 * This service provides the "holistic tie" that brings a student's entire
 * portfolio together. Instead of rigidly classifying students into archetypes,
 * it understands how their activities form a coherent narrative where:
 *
 * - Strengths BUILD UPON one another
 * - Activities ELEVATE each other
 * - The whole is GREATER than the sum of parts
 * - A "spike portfolio" emerges naturally
 *
 * KEY INNOVATIONS:
 * ================
 * 1. SONNET-POWERED: Uses Claude Sonnet for deep narrative reasoning
 *    (not Haiku classification - we need real understanding)
 *
 * 2. BEGINNING AND END: Runs twice per session
 *    - INITIAL: Establishes baseline narrative understanding
 *    - FINAL: Shows how improvements transform the story
 *    - Uses caching to track progression
 *
 * 3. NARRATIVE ELEVATION: Shows how activities support each other
 *    - Activity A makes Activity B more impressive
 *    - Combined story > individual activities
 *    - Identifies "narrative multipliers"
 *
 * 4. DYNAMIC: Changes based on user improvements
 *    - Tracks what changed
 *    - Shows narrative impact of improvements
 *    - Celebrates progression
 *
 * PHILOSOPHY:
 * ===========
 * We don't ask "what archetype is this student?" because that's:
 * - Potentially biased (what if they don't fit a box?)
 * - Not useful for teaching (knowing "leader" doesn't help improve)
 * - Rigid when students are fluid
 *
 * Instead, we ask:
 * - How do these activities tell a cohesive story?
 * - What makes this candidate unique and compelling?
 * - How do their strengths amplify each other?
 * - What narrative emerges when we see everything together?
 *
 * COST: ~$0.05-0.08 per analysis (Sonnet)
 */

import { callClaude } from '@/lib/llm/claude';
import { parseClaudeJSON } from '../../../../commonAppWorkshop/utils/jsonParser';
import {
  ActivityWorkshopSessionInput,
  ActivityWorkshopInput,
  PortfolioAnalysis,
  NarrativeElevation,
  NarrativeThread,
  SpikePresentation,
  GapFraming,
  PortfolioNarrative,
  NarrativeProgression,
} from '../types';

// Re-export narrative types for backward compatibility (index.ts imports from here)
export type {
  NarrativeElevation,
  NarrativeThread,
  SpikePresentation,
  GapFraming,
  PortfolioNarrative,
  NarrativeProgression,
};

// ============================================================================
// PORTFOLIO NARRATIVE SERVICE
// ============================================================================

export class PortfolioNarrativeService {
  private readonly MODEL = 'claude-sonnet-4-5-20250929'; // Sonnet 4.5 - latest

  // R1: Cache with timestamps and bounded size to prevent memory leaks
  private static readonly CACHE_MAX_SIZE = 50;
  private static readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
  private narrativeCache: Map<string, { narrative: PortfolioNarrative; timestamp: number }> = new Map();

  /**
   * Analyze portfolio narrative at the BEGINNING of analysis
   * This establishes the baseline understanding before teaching
   */
  async analyzeInitialNarrative(
    input: ActivityWorkshopSessionInput,
    sessionId: string
  ): Promise<PortfolioNarrative> {
    console.log('[PortfolioNarrative] Analyzing initial portfolio narrative...');
    const startTime = Date.now();

    const narrative = await this.analyzeNarrative(input, 'initial');

    // R1: Evict stale entries before caching to prevent unbounded growth
    this.evictStaleCache();
    this.narrativeCache.set(sessionId, { narrative, timestamp: Date.now() });

    console.log(`[PortfolioNarrative] Initial analysis complete in ${Date.now() - startTime}ms`);
    console.log(`[PortfolioNarrative] Story pitch: ${narrative.story.pitch.substring(0, 100)}...`);
    console.log(`[PortfolioNarrative] Coherence: ${narrative.coherence.assessment} (${narrative.coherence.score}/100)`);

    return narrative;
  }

  /**
   * Analyze portfolio narrative at the END of analysis
   * This shows how the story has improved after teaching
   */
  async analyzeImprovedNarrative(
    input: ActivityWorkshopSessionInput,
    sessionId: string,
    analysis?: PortfolioAnalysis
  ): Promise<PortfolioNarrative | NarrativeProgression> {
    console.log('[PortfolioNarrative] Analyzing improved portfolio narrative...');
    const startTime = Date.now();

    const improved = await this.analyzeNarrative(input, 'post_improvement', analysis);

    // R1: Check if we have a cached initial narrative to compare (extract .narrative from cache entry)
    const initial = this.narrativeCache.get(sessionId)?.narrative;

    if (initial) {
      // Return full progression showing the improvement
      const progression = this.compareNarratives(initial, improved);
      console.log(`[PortfolioNarrative] Progression analysis complete in ${Date.now() - startTime}ms`);
      console.log(`[PortfolioNarrative] Coherence improved: ${initial.coherence.score} → ${improved.coherence.score}`);
      return progression;
    }

    // No initial to compare - just return the improved narrative
    console.log(`[PortfolioNarrative] Improved analysis complete in ${Date.now() - startTime}ms`);
    return improved;
  }

  /**
   * Get cached initial narrative for a session
   */
  // R1: Return .narrative from cache entry
  getCachedNarrative(sessionId: string): PortfolioNarrative | undefined {
    return this.narrativeCache.get(sessionId)?.narrative;
  }

  /**
   * Clear cached narrative for a session
   */
  clearCachedNarrative(sessionId: string): void {
    this.narrativeCache.delete(sessionId);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * R1: Evict stale cache entries to prevent unbounded memory growth.
   * Removes entries older than CACHE_TTL_MS, then evicts oldest if still over CACHE_MAX_SIZE.
   */
  private evictStaleCache(): void {
    const now = Date.now();

    // Remove entries older than TTL
    for (const [key, entry] of this.narrativeCache) {
      if (now - entry.timestamp > PortfolioNarrativeService.CACHE_TTL_MS) {
        this.narrativeCache.delete(key);
      }
    }

    // If still over limit, evict oldest entries
    if (this.narrativeCache.size >= PortfolioNarrativeService.CACHE_MAX_SIZE) {
      const entries = [...this.narrativeCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, this.narrativeCache.size - PortfolioNarrativeService.CACHE_MAX_SIZE + 1);
      for (const [key] of toRemove) {
        this.narrativeCache.delete(key);
      }
    }
  }

  /**
   * Core narrative analysis method
   */
  private async analyzeNarrative(
    input: ActivityWorkshopSessionInput,
    analysisType: 'initial' | 'post_improvement',
    analysis?: PortfolioAnalysis
  ): Promise<PortfolioNarrative> {
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.buildPrompt(input, analysisType, analysis);

    try {
      const response = await callClaude({
        model: this.MODEL,
        systemPrompt,
        userPrompt,
        maxTokens: 4000,
        temperature: 0.4, // Balanced: creative insight but grounded reasoning
      });

      const narrative = this.parseResponse(response.content, analysisType);

      // Add metadata
      narrative.metadata = {
        generatedAt: new Date().toISOString(),
        modelUsed: this.MODEL,
        tokensUsed: {
          input: response.usage?.input_tokens || 0,
          output: response.usage?.output_tokens || 0,
        },
        cost: this.calculateCost(response.usage),
        analysisType,
      };

      return narrative;
    } catch (error) {
      console.error('[PortfolioNarrative] Analysis failed:', error);
      return this.createFallbackNarrative(input, analysisType);
    }
  }

  /**
   * Get the system prompt for holistic narrative analysis
   */
  private getSystemPrompt(): string {
    return `You are a master college admissions strategist with 25+ years of experience at elite institutions.
You have read thousands of applications and understand what makes a portfolio MEMORABLE.

YOUR TASK: Holistic Portfolio Narrative Analysis

You're NOT classifying students into boxes. You're understanding how their activities
tell a COHESIVE STORY where the whole is greater than the sum of its parts.

## KEY PRINCIPLES

### 1. NARRATIVE ELEVATION
Activities don't exist in isolation. Look for how they ELEVATE each other:
- Research experience makes leadership more impressive (they're leading with expertise)
- Community service makes competition success more meaningful (they give back)
- Work experience makes academic achievement more remarkable (they overcame obstacles)

### 2. THE SPIKE PORTFOLIO
Stanford wants "T-shaped" students. Look for:
- PRIMARY SPIKE: One area of exceptional depth and distinction
- SUPPORTING ACTIVITIES: How other activities COMPLEMENT the spike
- COMPLEMENTARY BREADTH: Evidence of intellectual range without diluting the spike

### 3. NARRATIVE THREADS
Find the THEMES that run through seemingly disparate activities:
- A student with robotics + tutoring + volunteer coaching → LOVES TEACHING THROUGH TECHNOLOGY
- A student with debate + newspaper + student government → AMPLIFYING VOICES
- Look for the HIDDEN CONNECTIONS admissions officers would notice

### 4. WHAT MAKES MEMORABLE
From your experience reading thousands of apps:
- Coherence is MORE IMPORTANT than raw tier levels
- Authentic passion beats manufactured breadth
- Growth arcs are compelling (they DEVELOPED over time)
- Unique combinations create distinctiveness

### 5. NO RIGID ARCHETYPES
DON'T put students in boxes like "the leader" or "the scholar."
DO understand their unique story, even if it doesn't fit a category.
The most memorable applicants often defy easy categorization.

## CONTEXT AWARENESS
Consider:
- Work/family obligations show responsibility, not weakness
- Geographic constraints explain opportunity gaps
- First-gen students may have less "packaged" activities but more authenticity
- International students bring unique perspectives

## OUTPUT FORMAT
Provide a comprehensive JSON analysis following the exact schema requested.
Focus on INSIGHT and NARRATIVE, not just classification.`;
  }

  /**
   * Build the analysis prompt
   */
  private buildPrompt(
    input: ActivityWorkshopSessionInput,
    analysisType: 'initial' | 'post_improvement',
    analysis?: PortfolioAnalysis
  ): string {
    const { activities, studentContext } = input;

    // Format activities with more detail
    const activitiesText = activities
      .map((a, i) => this.formatActivity(a, i + 1))
      .join('\n\n');

    // Add analysis context if available (for post-improvement)
    let analysisContext = '';
    if (analysis && analysisType === 'post_improvement') {
      analysisContext = `

## ANALYSIS CONTEXT (from Stage 1)
Tier Distribution: ${JSON.stringify(analysis.tierDistribution)}
Spike Detected: ${analysis.spikeAnalysis.hasSpike ? analysis.spikeAnalysis.spikeArea : 'None identified'}
Coherence Score: ${analysis.coherenceAnalysis.score}/100 (${analysis.coherenceAnalysis.assessment})
Primary Theme: ${analysis.coherenceAnalysis.primaryTheme}
`;
    }

    const contextText = studentContext
      ? `
## STUDENT CONTEXT
- Intended Major: ${studentContext.intendedMajor || 'Not specified'}
- Target Schools: ${studentContext.targetSchools?.join(', ') || 'Not specified'}
- Grade Level: ${studentContext.gradeLevel || 'Not specified'}
- First-Generation: ${studentContext.firstGen ? 'Yes' : 'No'}
- Low-Income: ${studentContext.lowIncome ? 'Yes' : 'No'}
- Rural: ${studentContext.rural ? 'Yes' : 'No'}
- International: ${studentContext.internationalStudent ? 'Yes' : 'No'}
`
      : '';

    return `Analyze this student's portfolio to understand their HOLISTIC NARRATIVE.

This is a${analysisType === 'post_improvement' ? 'n improved/updated' : 'n initial'} analysis.

${contextText}
${analysisContext}

## ACTIVITIES (${activities.length} total)

${activitiesText}

## YOUR ANALYSIS

Provide a JSON object with this exact structure:
{
  "story": {
    "pitch": "2-3 sentence compelling pitch for this candidate that admissions would remember",
    "uniqueAngle": "What makes this student's combination unique",
    "whyItMatters": "The 'so what' - why should colleges care about this person",
    "emergentTraits": ["trait1", "trait2", "trait3"]
  },
  "threads": [
    {
      "name": "Thread name",
      "activityIds": ["id1", "id2"],
      "manifestation": "How this thread appears across activities",
      "admissionsValue": "Why admissions officers would value this thread",
      "synergy": "How these activities together tell this story better than individually"
    }
  ],
  "elevations": [
    {
      "elevatedActivityId": "activity being made more impressive",
      "elevatingActivityId": "activity providing the boost",
      "mechanism": "How the elevation works",
      "combinedImpression": "What admissions sees when viewing both together",
      "strength": "transformative|strong|moderate|subtle"
    }
  ],
  "spike": {
    "primarySpike": {
      "area": "The area of exceptional depth",
      "activities": ["activity ids"],
      "depth": "Evidence of depth/progression",
      "distinctiveness": "What makes this spike stand out"
    },
    "supportingElements": [
      {
        "activityId": "id",
        "howItSupports": "How this activity supports the spike",
        "elevationEffect": "The combined impression"
      }
    ],
    "complementaryBreadth": [
      {
        "area": "Area showing range",
        "activities": ["ids"],
        "whyItMatters": "Why this breadth is valuable"
      }
    ]
  },
  "gaps": [
    {
      "gap": "What's missing",
      "existingMitigation": "How current activities partially address this",
      "positiveFraming": "How to frame this gap positively",
      "addressableThroughDescription": true/false
    }
  ],
  "coherence": {
    "score": 0-100,
    "assessment": "exceptional|strong|moderate|developing|scattered",
    "unifyingElement": "What ties everything together",
    "outliers": [
      {
        "activityId": "id",
        "howToIntegrate": "How to make this fit the narrative"
      }
    ]
  },
  "positioning": {
    "strengths": ["strength1", "strength2"],
    "differentiators": ["What makes them different from similar applicants"],
    "memorableElement": "What admissions will remember about this student",
    "schoolFit": ["Types of schools this portfolio fits well"]
  }
}

REMEMBER:
- Look for ELEVATION: how activities make each other more impressive
- Find HIDDEN CONNECTIONS that create narrative threads
- Identify the SPIKE even if not obvious
- Frame GAPS positively - what CAN they emphasize?
- Focus on what makes this student MEMORABLE

ANTI-ARCHETYPE RULE (for the story pitch):
- WRONG: "Sarah is a natural leader and community builder."
- RIGHT: "Sarah built a tutoring program from 3 students to 47 by converting her family's restaurant storage room into a study space — leadership born from necessity, not ambition."
- The pitch must include at least ONE specific detail that could only be true of THIS student.
- NEVER use archetype labels (leader, innovator, scholar) as the pitch — use them as underlying structure only.`;
  }

  /**
   * Format a single activity for the prompt
   */
  private formatActivity(activity: ActivityWorkshopInput, index: number): string {
    const hours = activity.hoursPerWeek * activity.weeksPerYear * (activity.yearsInvolved || 1);

    return `### ACTIVITY ${index} (ID: ${activity.id})
**Title:** ${activity.title}
**Organization:** ${activity.organization || 'Independent'}
**Role:** ${activity.role || 'Participant'}
**Description:** ${activity.description}
**Category:** ${activity.category}
**Time Investment:** ${activity.hoursPerWeek}hrs/wk × ${activity.weeksPerYear}wks/yr × ${activity.yearsInvolved || 1}yrs = ~${hours} total hours
**Grades Active:** ${activity.gradeLevels?.join(', ') || 'Not specified'}
**Paid Work:** ${activity.isPaid ? 'Yes' : 'No'}
**Continuing:** ${activity.isContinuing ? 'Yes' : 'No'}
${activity.constraintsContext ? `**Context/Constraints:** ${activity.constraintsContext}` : ''}
${activity.achievements?.length ? `**Notable Achievements:** ${activity.achievements.map(a => a.title).join(', ')}` : ''}`;
  }

  /**
   * Parse the LLM response using robust JSON parser with jsonrepair
   *
   * Uses parseClaudeJSON from common app workshop — handles:
   * - Unescaped quotes/newlines in strings
   * - Truncated JSON
   * - Trailing commas
   * - Code block extraction
   * - jsonrepair library as ultimate fallback
   */
  private parseResponse(
    response: string,
    analysisType: 'initial' | 'post_improvement'
  ): PortfolioNarrative {
    try {
      // Use the battle-tested robust parser (same one Stage 2 uses successfully)
      const parsed = parseClaudeJSON<Record<string, unknown>>(response, 'PortfolioNarrative');

      console.log('[PortfolioNarrative] JSON parsed successfully');

      // Null-safe field mapping — handle any missing or malformed fields gracefully
      const story = parsed.story as Record<string, unknown> | undefined;
      const spike = parsed.spike as Record<string, unknown> | undefined;
      const coherence = parsed.coherence as Record<string, unknown> | undefined;
      const positioning = parsed.positioning as Record<string, unknown> | undefined;

      return {
        story: {
          pitch: (story?.pitch as string) || 'Student with diverse experiences',
          uniqueAngle: (story?.uniqueAngle as string) || 'Unique perspective',
          whyItMatters: (story?.whyItMatters as string) || 'Brings valuable experiences',
          emergentTraits: (story?.emergentTraits as string[]) || [],
        },
        threads: (parsed.threads as PortfolioNarrative['threads']) || [],
        elevations: (parsed.elevations as PortfolioNarrative['elevations']) || [],
        spike: {
          primarySpike: (spike?.primarySpike as PortfolioNarrative['spike']['primarySpike']) || {
            area: 'Varied interests',
            activities: [],
            depth: 'Developing',
            distinctiveness: 'Authentic engagement',
          },
          supportingElements: (spike?.supportingElements as string[]) || [],
          complementaryBreadth: (spike?.complementaryBreadth as string[]) || [],
        },
        gaps: (parsed.gaps as PortfolioNarrative['gaps']) || [],
        coherence: {
          score: (coherence?.score as number) || 50,
          assessment: (coherence?.assessment as string) || 'moderate',
          unifyingElement: (coherence?.unifyingElement as string) || 'Personal growth',
          outliers: (coherence?.outliers as string[]) || [],
        },
        positioning: {
          strengths: (positioning?.strengths as string[]) || [],
          differentiators: (positioning?.differentiators as string[]) || [],
          memorableElement: (positioning?.memorableElement as string) || 'Authentic engagement',
          schoolFit: (positioning?.schoolFit as PortfolioNarrative['positioning']['schoolFit']) || [],
        },
        metadata: {
          generatedAt: '',
          modelUsed: '',
          tokensUsed: { input: 0, output: 0 },
          cost: 0,
          analysisType,
        },
      };
    } catch (error) {
      console.error('[PortfolioNarrative] Failed to parse response:', error);
      console.error('[PortfolioNarrative] Raw response:', response.substring(0, 500));
      throw error;
    }
  }

  /**
   * Compare initial and improved narratives
   */
  private compareNarratives(
    initial: PortfolioNarrative,
    improved: PortfolioNarrative
  ): NarrativeProgression {
    // Find new threads
    const initialThreadNames = new Set(initial.threads.map(t => t.name));
    const newThreads = improved.threads
      .filter(t => !initialThreadNames.has(t.name))
      .map(t => t.name);

    // Find strengthened elevations
    const strengthenedElevations = improved.elevations
      .filter(e => e.strength === 'transformative' || e.strength === 'strong')
      .map(e => `${e.elevatingActivityId} → ${e.elevatedActivityId}`);

    // Calculate coherence improvement
    const coherenceImprovement = improved.coherence.score - initial.coherence.score;

    // Find new differentiators
    const initialDifferentiators = new Set(initial.positioning.differentiators);
    const newDifferentiators = improved.positioning.differentiators
      .filter(d => !initialDifferentiators.has(d));

    // Generate transformation summary
    const transformationSummary = this.generateTransformationSummary(
      initial,
      improved,
      coherenceImprovement
    );

    // Generate celebration
    const celebration = this.generateCelebration(
      initial,
      improved,
      coherenceImprovement,
      newThreads.length
    );

    return {
      initial,
      improved,
      changes: {
        newThreads,
        strengthenedElevations,
        coherenceImprovement,
        newDifferentiators,
        transformationSummary,
      },
      celebration,
    };
  }

  /**
   * Generate a summary of narrative transformation
   */
  private generateTransformationSummary(
    initial: PortfolioNarrative,
    improved: PortfolioNarrative,
    coherenceImprovement: number
  ): string {
    const parts: string[] = [];

    if (coherenceImprovement > 0) {
      if (coherenceImprovement >= 20) {
        parts.push(`Your portfolio narrative has become significantly more cohesive (+${coherenceImprovement} points)`);
      } else if (coherenceImprovement >= 10) {
        parts.push(`Your narrative coherence has improved notably (+${coherenceImprovement} points)`);
      } else {
        parts.push(`Your narrative has become more unified (+${coherenceImprovement} points)`);
      }
    }

    if (improved.spike.primarySpike.depth !== initial.spike.primarySpike.depth) {
      parts.push(`Your spike in ${improved.spike.primarySpike.area} now shows clearer depth`);
    }

    if (improved.elevations.length > initial.elevations.length) {
      parts.push('More of your activities now elevate and support each other');
    }

    if (parts.length === 0) {
      return 'Your portfolio maintains its narrative strength with refined presentation.';
    }

    return parts.join('. ') + '.';
  }

  /**
   * R2-8: Generate a PERSONALIZED celebration message for progress
   * References specific improvements rather than using canned templates.
   */
  private generateCelebration(
    initial: PortfolioNarrative,
    improved: PortfolioNarrative,
    coherenceImprovement: number,
    newThreadCount: number
  ): string {
    const specificImprovements: string[] = [];

    // Detect spike emergence/improvement
    if (improved.spike.primarySpike.area !== initial.spike.primarySpike.area ||
        improved.spike.primarySpike.depth !== initial.spike.primarySpike.depth) {
      specificImprovements.push(
        `Your spike in ${improved.spike.primarySpike.area} is now more defined — ${improved.spike.primarySpike.distinctiveness}`
      );
    }

    // Detect new narrative threads
    if (newThreadCount > 0) {
      const initialThreadNames = new Set(initial.threads.map(t => t.name));
      const newThreadNames = improved.threads
        .filter(t => !initialThreadNames.has(t.name))
        .slice(0, 2)
        .map(t => `"${t.name}"`);
      if (newThreadNames.length > 0) {
        specificImprovements.push(
          `New narrative thread${newThreadNames.length > 1 ? 's' : ''} emerged: ${newThreadNames.join(' and ')}`
        );
      }
    }

    // Detect new elevations
    const newElevationCount = improved.elevations.length - initial.elevations.length;
    if (newElevationCount > 0) {
      const strongElevation = improved.elevations.find(e => e.strength === 'transformative' || e.strength === 'strong');
      if (strongElevation) {
        specificImprovements.push(
          `Your activities now elevate each other — ${strongElevation.mechanism}`
        );
      }
    }

    // Detect coherence improvement
    if (coherenceImprovement >= 10) {
      specificImprovements.push(
        `Coherence jumped from ${initial.coherence.score} to ${improved.coherence.score} — your story reads as a unified narrative now`
      );
    }

    // Build personalized message
    if (specificImprovements.length >= 2) {
      return `Remarkable progress: ${specificImprovements.join('. ')}. Admissions officers will see not just what you've done, but WHO YOU ARE.`;
    }

    if (specificImprovements.length === 1) {
      return `Real progress: ${specificImprovements[0]}. Your portfolio's narrative is becoming clearer and more compelling.`;
    }

    // Fallback: still personalized with actual data
    return `Your portfolio's story around "${improved.spike.primarySpike.area}" is strengthening. The coherence at ${improved.coherence.score}/100 gives you a solid foundation to build on.`;
  }

  /**
   * Create fallback narrative when LLM fails
   */
  private createFallbackNarrative(
    input: ActivityWorkshopSessionInput,
    analysisType: 'initial' | 'post_improvement'
  ): PortfolioNarrative {
    console.log('[PortfolioNarrative] Creating fallback narrative');

    const activities = input.activities;

    // Basic analysis
    const hasLeadership = activities.some(
      a => a.role?.toLowerCase().includes('president') ||
        a.role?.toLowerCase().includes('captain') ||
        a.role?.toLowerCase().includes('founder')
    );

    const hasResearch = activities.some(
      a => a.description.toLowerCase().includes('research') ||
        a.title.toLowerCase().includes('research')
    );

    const hasService = activities.some(
      a => a.category === 'volunteer' ||
        a.description.toLowerCase().includes('community')
    );

    // Determine basic themes
    const themes: string[] = [];
    if (hasLeadership) themes.push('leadership');
    if (hasResearch) themes.push('intellectual curiosity');
    if (hasService) themes.push('community impact');
    if (themes.length === 0) themes.push('exploration');

    return {
      story: {
        pitch: `A student with ${themes.join(' and ')} exploring their passions through diverse activities.`,
        uniqueAngle: 'Authentic engagement across multiple domains',
        whyItMatters: 'Demonstrates genuine curiosity and commitment to growth',
        emergentTraits: themes,
      },
      threads: [],
      elevations: [],
      spike: {
        primarySpike: {
          area: themes[0] || 'Varied interests',
          activities: [],
          depth: 'Developing',
          distinctiveness: 'Personal authenticity',
        },
        supportingElements: [],
        complementaryBreadth: [],
      },
      gaps: [],
      coherence: {
        score: 40,
        assessment: 'developing',
        unifyingElement: 'Personal growth and exploration',
        outliers: [],
      },
      positioning: {
        strengths: themes,
        differentiators: ['Authentic engagement'],
        memorableElement: 'Genuine curiosity across domains',
        schoolFit: ['Liberal arts colleges', 'Research universities'],
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        modelUsed: 'fallback',
        tokensUsed: { input: 0, output: 0 },
        cost: 0,
        analysisType,
      },
    };
  }

  /**
   * Calculate cost from token usage
   */
  private calculateCost(usage: { input_tokens?: number; output_tokens?: number } | undefined): number {
    if (!usage) return 0;
    // Sonnet pricing: $3/M input, $15/M output
    const inputCost = ((usage.input_tokens || 0) / 1_000_000) * 3;
    const outputCost = ((usage.output_tokens || 0) / 1_000_000) * 15;
    return inputCost + outputCost;
  }
}

// Export singleton
export const portfolioNarrativeService = new PortfolioNarrativeService();
