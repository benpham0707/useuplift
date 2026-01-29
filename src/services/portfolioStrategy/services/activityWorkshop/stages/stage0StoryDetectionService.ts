/**
 * Stage 0: Story Detection Service
 *
 * LLM-POWERED STORY TRIAGE (Replaces heuristic-based profiler)
 *
 * PURPOSE:
 * ========
 * Before analyzing WHAT a student does, we must understand WHO they are.
 * This stage uses a quick Haiku call to identify the student's narrative
 * identity, detect story threads across activities, and provide context
 * that enriches all subsequent analysis.
 *
 * WHAT IT REPLACES:
 * ================
 * The old Research-Backed Profiler used hardcoded heuristics like:
 * - `if (roleLower.includes('founder')) leadershipPoints = 3`
 * - Fixed SPIKE_CRITERIA thresholds
 * - Rigid pattern matching without context
 *
 * NEW APPROACH:
 * ============
 * LLM reads ALL activities holistically and identifies:
 * 1. Who this student IS (archetype, story essence)
 * 2. What narrative threads connect their activities
 * 3. What contextual factors affect interpretation
 * 4. Each activity's role in their story
 * 5. Whether a spike is forming and where
 *
 * COST: ~$0.01-0.02 (Haiku, ~1500 input tokens, ~800 output tokens)
 *
 * This context flows to Stage 1 for nuanced, story-aware analysis.
 */

import { callClaude } from '@/lib/llm/claude';
import {
  ActivityWorkshopSessionInput,
  ActivityWorkshopInput,
  StoryContext,
} from '../types';

/**
 * Stage 0: Story Detection Service
 *
 * Identifies the student's narrative before detailed analysis begins
 */
export class Stage0StoryDetectionService {
  private readonly MODEL = 'claude-haiku-4-5-20251001';

  /**
   * Detect the student's story from their activities
   */
  async detectStory(input: ActivityWorkshopSessionInput): Promise<StoryContext> {
    const startTime = Date.now();

    const prompt = this.buildStoryDetectionPrompt(input);
    const systemPrompt = this.getSystemPrompt();

    try {
      const response = await callClaude({
        model: this.MODEL,
        systemPrompt,
        userPrompt: prompt,
        maxTokens: 2000,
        temperature: 0.3, // Some creativity for story detection, but mostly grounded
      });

      // Parse the response
      const storyContext = this.parseStoryResponse(response.content, input);

      // Add metadata
      storyContext.metadata = {
        generatedAt: new Date().toISOString(),
        modelUsed: this.MODEL,
        tokensUsed: {
          input: response.usage?.inputTokens || 0,
          output: response.usage?.outputTokens || 0,
        },
        cost: this.calculateCost(response.usage),
      };

      console.log(`[Stage0] Story detection completed in ${Date.now() - startTime}ms`);
      console.log(`[Stage0] Detected archetype: ${storyContext.narrativeIdentity.archetype}`);
      console.log(`[Stage0] Story essence: ${storyContext.narrativeIdentity.storyEssence}`);

      return storyContext;
    } catch (error) {
      console.error('[Stage0] Story detection failed, using fallback:', error);
      return this.createFallbackStoryContext(input);
    }
  }

  /**
   * Build the prompt for story detection
   */
  private buildStoryDetectionPrompt(input: ActivityWorkshopSessionInput): string {
    const { activities, studentContext } = input;

    // Format activities for the prompt
    const activitiesText = activities
      .map((a, i) => this.formatActivity(a, i + 1))
      .join('\n\n');

    // Format student context if available
    const contextText = studentContext
      ? `
STUDENT CONTEXT:
- Intended Major: ${studentContext.intendedMajor || 'Not specified'}
- Target Schools: ${studentContext.targetSchools?.join(', ') || 'Not specified'}
- Grade Level: ${studentContext.gradeLevel || 'Not specified'}
- First-Generation: ${studentContext.firstGen ? 'Yes' : 'No'}
- Low-Income: ${studentContext.lowIncome ? 'Yes' : 'No'}
- Rural: ${studentContext.rural ? 'Yes' : 'No'}
- International: ${studentContext.internationalStudent ? 'Yes' : 'No'}
`
      : '';

    return `Analyze this student's activities to understand WHO they are.

${contextText}
ACTIVITIES (${activities.length} total):

${activitiesText}

Respond with a JSON object following this exact structure:
{
  "narrativeIdentity": {
    "primaryTheme": "The ONE core theme that unifies this student's activities",
    "secondaryThemes": ["theme2", "theme3"],
    "storyEssence": "One sentence: WHO is this student at their core?",
    "archetype": "one of: innovator, leader, scholar, creative, advocate, builder, competitor, explorer, caretaker, polymath",
    "archetypeConfidence": 0-100
  },
  "narrativeThreads": [
    {
      "thread": "Name of the thread",
      "activityIds": ["id1", "id2"],
      "strength": "strong|emerging|weak",
      "evidence": "Why this thread exists"
    }
  ],
  "contextualFactors": {
    "hasWorkFamilyObligations": true/false,
    "workFamilyContext": "explanation if true",
    "hasResourceConstraints": true/false,
    "constraintsContext": "explanation if true",
    "hasGeographicLimitations": true/false,
    "geographicContext": "explanation if true",
    "firstGenIndicators": true/false,
    "internationalIndicators": true/false
  },
  "activityStoryRoles": [
    {
      "activityId": "activity-id",
      "storyRole": "core_identity|skill_building|impact_vehicle|passion_pursuit|obligation|exploration|filler",
      "centralityScore": 0-100,
      "roleExplanation": "Why this role"
    }
  ],
  "spikeHypothesis": {
    "likelySpike": true/false,
    "spikeArea": "area if true",
    "spikeActivityIds": ["ids that form spike"],
    "maturity": "mature|developing|emerging|absent",
    "evidence": "Why we think this"
  }
}`;
  }

  /**
   * Format a single activity for the prompt
   */
  private formatActivity(activity: ActivityWorkshopInput, index: number): string {
    const hours = activity.hoursPerWeek * activity.weeksPerYear * (activity.yearsInvolved || 1);

    return `ACTIVITY ${index} (ID: ${activity.id}):
Title: ${activity.title}
Organization: ${activity.organization || 'N/A'}
Role: ${activity.role || 'N/A'}
Description: ${activity.description}
Category: ${activity.category}
Time: ${activity.hoursPerWeek}hrs/wk × ${activity.weeksPerYear}wks/yr = ~${hours} total hours
Grades: ${activity.gradeLevels?.join(', ') || 'Not specified'}
Paid: ${activity.isPaid ? 'Yes' : 'No'}
Continuing: ${activity.isContinuing ? 'Yes' : 'No'}
${activity.constraintsContext ? `Constraints: ${activity.constraintsContext}` : ''}
${activity.achievements?.length ? `Achievements: ${activity.achievements.map(a => a.title).join(', ')}` : ''}`;
  }

  /**
   * Get the system prompt for story detection
   */
  private getSystemPrompt(): string {
    return `You are an expert college admissions reader with deep understanding of how activities tell a student's story.

Your task is to read ALL activities holistically and understand WHO this student is - their identity, passions, and narrative arc.

KEY PRINCIPLES:

1. LOOK FOR THE STORY, NOT THE RESUME
   - What connects these activities?
   - What does this portfolio reveal about who they ARE?
   - Is there a clear "through line" or is this scattered?

2. UNDERSTAND CONTEXT
   - Work/family obligations are not weaknesses - they show responsibility
   - Geographic/resource constraints explain missing "typical" activities
   - First-gen students may not know the "game" but show authentic passion

3. ARCHETYPES (pick the best fit):
   - innovator: Creates new things, entrepreneurial, builds solutions
   - leader: Takes charge, organizes others, drives change
   - scholar: Deep intellectual curiosity, research-focused
   - creative: Artistic expression, creative problem-solving
   - advocate: Fighting for causes, community justice
   - builder: Hands-on creation, engineering mindset
   - competitor: Athletic or academic competition focus
   - explorer: Seeks new experiences, diverse interests
   - caretaker: Helping others, service-oriented
   - polymath: Genuine excellence across multiple domains

4. SPIKE DETECTION
   - A spike is NOT just doing many activities in one area
   - A spike shows DEPTH: progression, leadership, recognition
   - Stanford wants "T-shaped" students: depth in one area + breadth
   - Harvard 1-6 scale values authentic passion over manufactured breadth

5. STORY ROLES
   - core_identity: This IS who they are
   - skill_building: Developing competencies
   - impact_vehicle: How they create change
   - passion_pursuit: Following genuine interests
   - obligation: Family/work responsibilities (respect these!)
   - exploration: Trying new things (healthy in 9th-10th grade)
   - filler: Activity that doesn't add to the narrative (be honest)

Output ONLY valid JSON. No explanations outside the JSON structure.`;
  }

  /**
   * Parse the LLM response into a StoryContext
   */
  private parseStoryResponse(
    response: string,
    input: ActivityWorkshopSessionInput
  ): StoryContext {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response;
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr);

      // Validate and fill in missing fields
      return {
        narrativeIdentity: {
          primaryTheme: parsed.narrativeIdentity?.primaryTheme || 'Not identified',
          secondaryThemes: parsed.narrativeIdentity?.secondaryThemes || [],
          storyEssence: parsed.narrativeIdentity?.storyEssence || 'Student story pending analysis',
          archetype: this.validateArchetype(parsed.narrativeIdentity?.archetype),
          archetypeConfidence: parsed.narrativeIdentity?.archetypeConfidence || 50,
        },
        narrativeThreads: parsed.narrativeThreads || [],
        contextualFactors: {
          hasWorkFamilyObligations: parsed.contextualFactors?.hasWorkFamilyObligations || false,
          workFamilyContext: parsed.contextualFactors?.workFamilyContext,
          hasResourceConstraints: parsed.contextualFactors?.hasResourceConstraints || false,
          constraintsContext: parsed.contextualFactors?.constraintsContext,
          hasGeographicLimitations: parsed.contextualFactors?.hasGeographicLimitations || false,
          geographicContext: parsed.contextualFactors?.geographicContext,
          firstGenIndicators: parsed.contextualFactors?.firstGenIndicators || input.studentContext?.firstGen || false,
          internationalIndicators: parsed.contextualFactors?.internationalIndicators || input.studentContext?.internationalStudent || false,
        },
        activityStoryRoles: this.validateActivityRoles(parsed.activityStoryRoles, input.activities),
        spikeHypothesis: {
          likelySpike: parsed.spikeHypothesis?.likelySpike || false,
          spikeArea: parsed.spikeHypothesis?.spikeArea,
          spikeActivityIds: parsed.spikeHypothesis?.spikeActivityIds || [],
          maturity: this.validateMaturity(parsed.spikeHypothesis?.maturity),
          evidence: parsed.spikeHypothesis?.evidence || '',
        },
        metadata: {
          generatedAt: '',
          modelUsed: '',
          tokensUsed: { input: 0, output: 0 },
          cost: 0,
        },
      };
    } catch (error) {
      console.error('[Stage0] Failed to parse story response:', error);
      console.error('[Stage0] Raw response:', response.substring(0, 500));
      return this.createFallbackStoryContext(input);
    }
  }

  /**
   * Validate archetype value
   */
  private validateArchetype(
    archetype: string | undefined
  ): StoryContext['narrativeIdentity']['archetype'] {
    const validArchetypes = [
      'innovator', 'leader', 'scholar', 'creative', 'advocate',
      'builder', 'competitor', 'explorer', 'caretaker', 'polymath'
    ] as const;

    if (archetype && validArchetypes.includes(archetype as typeof validArchetypes[number])) {
      return archetype as typeof validArchetypes[number];
    }
    return 'explorer'; // Default to explorer if unknown
  }

  /**
   * Validate maturity value
   */
  private validateMaturity(
    maturity: string | undefined
  ): StoryContext['spikeHypothesis']['maturity'] {
    const validMaturities = ['mature', 'developing', 'emerging', 'absent'] as const;
    if (maturity && validMaturities.includes(maturity as typeof validMaturities[number])) {
      return maturity as typeof validMaturities[number];
    }
    return 'absent';
  }

  /**
   * Validate and fill activity roles
   */
  private validateActivityRoles(
    roles: Array<{
      activityId: string;
      storyRole: string;
      centralityScore: number;
      roleExplanation: string;
    }> | undefined,
    activities: ActivityWorkshopInput[]
  ): StoryContext['activityStoryRoles'] {
    const validRoles = [
      'core_identity', 'skill_building', 'impact_vehicle',
      'passion_pursuit', 'obligation', 'exploration', 'filler'
    ] as const;

    // Create a map of existing roles
    const roleMap = new Map(
      (roles || []).map(r => [r.activityId, r])
    );

    // Ensure all activities have roles
    return activities.map(activity => {
      const existing = roleMap.get(activity.id);
      if (existing) {
        return {
          activityId: activity.id,
          storyRole: validRoles.includes(existing.storyRole as typeof validRoles[number])
            ? existing.storyRole as typeof validRoles[number]
            : 'exploration',
          centralityScore: existing.centralityScore || 50,
          roleExplanation: existing.roleExplanation || 'Role pending analysis',
        };
      }

      // Default for missing activities
      return {
        activityId: activity.id,
        storyRole: 'exploration' as const,
        centralityScore: 50,
        roleExplanation: 'Role not analyzed',
      };
    });
  }

  /**
   * Create a fallback story context when LLM fails
   */
  private createFallbackStoryContext(input: ActivityWorkshopSessionInput): StoryContext {
    console.log('[Stage0] Creating fallback story context');

    // Basic heuristic-based fallback
    const activities = input.activities;

    // Detect basic patterns
    const hasLeadership = activities.some(a =>
      a.role?.toLowerCase().includes('president') ||
      a.role?.toLowerCase().includes('captain') ||
      a.role?.toLowerCase().includes('founder')
    );

    const hasResearch = activities.some(a =>
      a.description.toLowerCase().includes('research') ||
      a.title.toLowerCase().includes('research')
    );

    const hasService = activities.some(a =>
      a.category === 'volunteer' ||
      a.description.toLowerCase().includes('community')
    );

    // Determine archetype from patterns
    let archetype: StoryContext['narrativeIdentity']['archetype'] = 'explorer';
    if (hasLeadership) archetype = 'leader';
    else if (hasResearch) archetype = 'scholar';
    else if (hasService) archetype = 'caretaker';

    return {
      narrativeIdentity: {
        primaryTheme: 'Diverse interests',
        secondaryThemes: [],
        storyEssence: 'A student with varied activities across different domains',
        archetype,
        archetypeConfidence: 30, // Low confidence for fallback
      },
      narrativeThreads: [],
      contextualFactors: {
        hasWorkFamilyObligations: activities.some(a => a.isPaid || a.category === 'work'),
        hasResourceConstraints: input.studentContext?.lowIncome || false,
        hasGeographicLimitations: input.studentContext?.rural || false,
        firstGenIndicators: input.studentContext?.firstGen || false,
        internationalIndicators: input.studentContext?.internationalStudent || false,
      },
      activityStoryRoles: activities.map(a => ({
        activityId: a.id,
        storyRole: 'exploration' as const,
        centralityScore: 50,
        roleExplanation: 'Fallback classification - requires LLM analysis',
      })),
      spikeHypothesis: {
        likelySpike: false,
        maturity: 'absent',
        spikeActivityIds: [],
        evidence: 'Fallback mode - spike detection requires LLM analysis',
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        modelUsed: 'fallback',
        tokensUsed: { input: 0, output: 0 },
        cost: 0,
      },
    };
  }

  /**
   * Calculate cost from token usage
   */
  private calculateCost(usage: { inputTokens?: number; outputTokens?: number } | undefined): number {
    if (!usage) return 0;
    // Haiku pricing: $0.25/M input, $1.25/M output
    const inputCost = ((usage.inputTokens || 0) / 1_000_000) * 0.25;
    const outputCost = ((usage.outputTokens || 0) / 1_000_000) * 1.25;
    return inputCost + outputCost;
  }
}

// Export singleton
export const stage0StoryDetectionService = new Stage0StoryDetectionService();
