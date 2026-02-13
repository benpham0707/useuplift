// @ts-nocheck
/**
 * Profile-Powered Description Generator
 *
 * Generates high-quality 150-character activity descriptions using
 * the rich profile data gathered through conversations.
 *
 * KEY INSIGHT: Most students write weak descriptions because they don't know
 * WHAT to include or HOW to prioritize. With a complete profile, we have all
 * the raw material needed to craft elite-level descriptions.
 *
 * GENERATION APPROACH:
 * 1. Analyze profile to identify strongest elements
 * 2. Select top 3-4 elements that fit description criteria
 * 3. Craft description prioritizing: Role Ownership > Differentiation > Impact > Quantification
 * 4. Generate 3 variations targeting different strengths
 * 5. Include authentic voice from student's own quotes where possible
 *
 * OUTPUT: Multiple description options with rationale for each
 */

import { callClaude } from '@/lib/llm/claude';
import { ActivityProfile } from './types';
import { activityProfileService } from './activityProfileService';

// ============================================================================
// TYPES
// ============================================================================

export interface DescriptionGenerationInput {
  /** Activity profile to generate description from */
  profile: ActivityProfile;
  /** Current description (if any) for comparison */
  currentDescription?: string;
  /** Target character count (default: 150) */
  targetLength?: number;
  /** Emphasis preference */
  emphasis?: 'impact' | 'leadership' | 'innovation' | 'growth' | 'balanced';
  /** Student context */
  studentContext?: {
    intendedMajor?: string;
    targetSchools?: string[];
    applicationTheme?: string;
  };
}

export interface GeneratedDescription {
  /** The generated description text */
  text: string;
  /** Character count */
  charCount: number;
  /** What this description emphasizes */
  emphasis: string;
  /** Why this description works */
  rationale: string;
  /** Elements from profile used */
  profileElementsUsed: string[];
  /** Estimated score improvement over current */
  estimatedScoreImpact: number;
  /** Authentic quote incorporated (if any) */
  authenticQuoteUsed?: string;
}

export interface DescriptionGenerationResult {
  success: boolean;
  /** Primary recommended description */
  primary?: GeneratedDescription;
  /** Alternative descriptions for different emphases */
  alternatives?: GeneratedDescription[];
  /** Analysis of current description (if provided) */
  currentAnalysis?: {
    score: number;
    strengths: string[];
    weaknesses: string[];
  };
  /** What profile data made this possible */
  profileContribution: string[];
  error?: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

// ============================================================================
// PROMPTS
// ============================================================================

const DESCRIPTION_GENERATION_SYSTEM = `You are an expert college admissions consultant specializing in crafting powerful 150-character activity descriptions.

Your task: Transform rich profile data into compelling, differentiated descriptions that score 8-10 on the standard rubric.

DESCRIPTION RUBRIC (what you're optimizing for):
1. ROLE OWNERSHIP (2.5 points) - Reader knows exactly what THIS student did
2. ACTION PRECISION (2.0 points) - Strong, specific verbs
3. EVIDENCE OF IMPACT (2.0 points) - Clear cause-and-effect
4. STRATEGIC QUANTIFICATION (1.5 points) - Meaningful numbers
5. DIFFERENTIATION SIGNAL (2.0 points) - What 1,000 others didn't do

ELITE DESCRIPTION PATTERNS:
- "Developed [unique methodology/product] for [specific audience]; [measurable outcome]. [External validation]."
- "[Action verb] [scope] to [accomplish goal], resulting in [specific impact]."
- "Founded/Created [initiative] reaching [X people]; [recognition/adoption]."

VERB HIERARCHY (use highest applicable):
- ELITE: designed, engineered, pioneered, negotiated, diagnosed, synthesized, architected
- GOOD: led, managed, directed, trained, analyzed, implemented, launched
- ACCEPTABLE: organized, coordinated, developed, created
- WEAK: worked on, handled, ran, supported (AVOID)
- POOR: participated, involved, assisted, helped, member of (NEVER USE)

AUTHENTIC VOICE: When profile contains student quotes, try to incorporate their natural language while maintaining professional tone.

COMMON PITFALLS TO AVOID:
- Organization-focused ("The club provides...") instead of individual-focused
- Generic language that could describe anyone
- Listing duties instead of accomplishments
- Vague impact ("made a difference", "helped others")
- Numbers without context or significance

OUTPUT FORMAT (JSON):
{
  "primary": {
    "text": "<150 chars max description>",
    "charCount": <number>,
    "emphasis": "<what this emphasizes>",
    "rationale": "<why this works, referencing rubric>",
    "profileElementsUsed": ["<which profile fields>"],
    "estimatedScoreImpact": <0-10 estimated score>,
    "authenticQuoteUsed": "<quote incorporated if any>"
  },
  "alternatives": [
    { same structure, different emphasis },
    { same structure, different emphasis }
  ],
  "currentAnalysis": {
    "score": <1-10>,
    "strengths": ["..."],
    "weaknesses": ["..."]
  },
  "profileContribution": ["<what profile data made these descriptions possible>"]
}`;

function buildGenerationPrompt(input: DescriptionGenerationInput): string {
  const { profile, currentDescription, emphasis, studentContext, targetLength = 150 } = input;
  const completeness = activityProfileService.calculateCompleteness(profile);

  const sections: string[] = [];

  sections.push(`Generate a powerful ${targetLength}-character activity description from this profile data.`);
  sections.push(`\nACTIVITY: ${profile.activityTitle}`);
  sections.push(`PROFILE COMPLETENESS: ${completeness.overall}%`);

  // Add current description for comparison if provided
  if (currentDescription) {
    sections.push(`\nCURRENT DESCRIPTION (${currentDescription.length} chars):`);
    sections.push(`"${currentDescription}"`);
    sections.push(`\nAnalyze the current description and show how the new one improves it.`);
  }

  // Emphasis preference
  if (emphasis && emphasis !== 'balanced') {
    sections.push(`\nEMPHASIS PREFERENCE: ${emphasis}`);
  }

  // Student context
  if (studentContext) {
    sections.push(`\nSTUDENT CONTEXT:`);
    if (studentContext.intendedMajor) {
      sections.push(`- Intended Major: ${studentContext.intendedMajor}`);
    }
    if (studentContext.targetSchools?.length) {
      sections.push(`- Target Schools: ${studentContext.targetSchools.join(', ')}`);
    }
    if (studentContext.applicationTheme) {
      sections.push(`- Application Theme: ${studentContext.applicationTheme}`);
    }
  }

  // Profile data sections
  sections.push(`\n═══════════════════════════════════════════════════════════════`);
  sections.push(`PROFILE DATA (use this to craft the description)`);
  sections.push(`═══════════════════════════════════════════════════════════════`);

  // Facts
  sections.push(`\n## FACTS`);
  if (profile.facts.duration.totalYears > 0) {
    sections.push(`Duration: ${profile.facts.duration.totalYears} years, ${profile.facts.duration.hoursPerWeek} hrs/week (${profile.facts.duration.frequency})`);
  }

  if (profile.facts.scale.peopleDirectlyImpacted > 0) {
    sections.push(`People Impacted: ${profile.facts.scale.peopleDirectlyImpacted}`);
  }
  if (profile.facts.scale.teamSize > 0) {
    sections.push(`Team Size: ${profile.facts.scale.teamSize}`);
  }
  if (profile.facts.scale.resourcesCreated > 0) {
    sections.push(`Resources Created: ${profile.facts.scale.resourcesCreated} (${profile.facts.scale.resourcesDescription || 'various'})`);
  }
  if (profile.facts.scale.budgetManaged > 0) {
    sections.push(`Budget Managed: $${profile.facts.scale.budgetManaged}`);
  }

  // Roles
  if (profile.facts.roles.length > 0) {
    sections.push(`\nRoles:`);
    for (const role of profile.facts.roles) {
      // Handle responsibilities being either string or array
      const responsibilities = Array.isArray(role.responsibilities)
        ? role.responsibilities
        : (typeof role.responsibilities === 'string' ? [role.responsibilities] : []);
      sections.push(`- ${role.role} (${role.startDate || 'ongoing'}): ${responsibilities.join(', ') || 'various responsibilities'}`);
    }
  }

  // Recognition
  if (profile.facts.recognition.length > 0) {
    sections.push(`\nRecognition:`);
    for (const r of profile.facts.recognition) {
      sections.push(`- ${r.name} (${r.level}${r.selectivity ? `, selectivity: ${r.selectivity}` : ''})`);
    }
  }

  // Artifacts
  if (profile.facts.artifacts.length > 0) {
    sections.push(`\nArtifacts/Creations:`);
    for (const a of profile.facts.artifacts) {
      sections.push(`- ${a.name} (${a.type}): ${a.description}${a.impact ? ` → ${a.impact}` : ''}`);
    }
  }

  // Story
  sections.push(`\n## STORY`);
  if (profile.story.origin.howStarted) {
    sections.push(`Origin: ${profile.story.origin.howStarted}`);
  }
  if (profile.story.origin.whyJoined) {
    sections.push(`Why Joined: ${profile.story.origin.whyJoined}`);
  }

  if (profile.story.keyMoments.length > 0) {
    sections.push(`\nKey Moments:`);
    for (const m of profile.story.keyMoments) {
      sections.push(`- [${m.type}] ${m.description}: ${m.whatYouDid}${m.outcome ? ` → ${m.outcome}` : ''}`);
    }
  }

  if (profile.story.evolution.length > 0) {
    sections.push(`\nEvolution:`);
    for (const e of profile.story.evolution) {
      sections.push(`- ${e.phase}: ${e.description}`);
    }
  }

  // Meaning
  sections.push(`\n## MEANING`);
  if (profile.meaning.proudestMoment) {
    sections.push(`Proudest Moment: "${profile.meaning.proudestMoment}"`);
  }
  if (profile.meaning.hardestChallenge) {
    sections.push(`Hardest Challenge: "${profile.meaning.hardestChallenge}"`);
  }
  if (profile.meaning.whyItMatters) {
    sections.push(`Why It Matters: "${profile.meaning.whyItMatters}"`);
  }

  const skills = profile.meaning?.skills || [];
  if (skills.length > 0) {
    sections.push(`\nSkills Developed:`);
    for (const s of skills) {
      sections.push(`- ${s.skill} (${s.proficiencyLevel}): ${s.howDeveloped}`);
    }
  }

  // Impact
  sections.push(`\n## IMPACT`);
  const beneficiaries = profile.impact?.directBeneficiaries || [];
  if (beneficiaries.length > 0) {
    sections.push(`Direct Beneficiaries:`);
    for (const b of beneficiaries) {
      sections.push(`- ${b.who}: ${b.howHelped}${b.measurableOutcome ? ` → ${b.measurableOutcome}` : ''}`);
    }
  }

  if (profile.impact.beforeAfter) {
    sections.push(`\nBefore/After:`);
    sections.push(`- Before: ${profile.impact.beforeAfter.before}`);
    sections.push(`- After: ${profile.impact.beforeAfter.after}`);
    sections.push(`- Student's Role: ${profile.impact.beforeAfter.yourRole}`);
  }

  if (profile.impact.counterfactual) {
    sections.push(`Counterfactual: "${profile.impact.counterfactual}"`);
  }

  if (profile.impact.ongoingLegacy) {
    sections.push(`Ongoing Legacy: "${profile.impact.ongoingLegacy}"`);
  }

  // Connections
  sections.push(`\n## CONNECTIONS`);
  if (profile.connections.spikeRelevance.spikeConnection) {
    sections.push(`Spike Connection: ${profile.connections.spikeRelevance.spikeConnection}`);
  }
  if (profile.connections.majorAlignment.howRelevant) {
    sections.push(`Major Relevance: ${profile.connections.majorAlignment.howRelevant}`);
  }

  const characterTraits = profile.connections?.characterTraits || [];
  if (characterTraits.length > 0) {
    sections.push(`\nCharacter Demonstrated:`);
    for (const t of characterTraits) {
      sections.push(`- ${t.trait}: ${t.howDemonstrated}`);
    }
  }

  // Authentic quotes (IMPORTANT for voice) - these are in the meaning section
  const authenticQuotes = profile.meaning?.authenticQuotes || [];
  if (authenticQuotes.length > 0) {
    sections.push(`\n## AUTHENTIC QUOTES (try to incorporate student's voice)`);
    for (const q of authenticQuotes) {
      sections.push(`- "${q.quote}" [${q.potentialUse}]`);
    }
  }

  sections.push(`\n═══════════════════════════════════════════════════════════════`);
  sections.push(`Generate the primary description and 2 alternatives.`);
  sections.push(`Each must be ≤${targetLength} characters and score 8+ on the rubric.`);
  sections.push(`Use the strongest elements from the profile.`);

  return sections.join('\n');
}

// ============================================================================
// SERVICE
// ============================================================================

export class ProfileDescriptionGenerator {
  /**
   * Generate optimized descriptions from a rich profile
   */
  async generateDescriptions(input: DescriptionGenerationInput): Promise<DescriptionGenerationResult> {
    try {
      const completeness = activityProfileService.calculateCompleteness(input.profile);

      // Warn if profile is too sparse
      if (completeness.overall < 20) {
        console.warn('[ProfileDescriptionGenerator] Profile completeness very low. Generation quality may be limited.');
      }

      const response = await callClaude(
        buildGenerationPrompt(input),
        {
          model: 'claude-sonnet-4-5-20250929', // Sonnet 4.5 for quality generation
          systemPrompt: DESCRIPTION_GENERATION_SYSTEM,
          temperature: 0.7, // Higher for creativity
          maxTokens: 2500,
        }
      );

      if (!response.content) {
        return {
          success: false,
          profileContribution: [],
          error: 'Failed to get response from Claude',
        };
      }

      // Parse response
      const parsed = this.parseGenerationResponse(response.content);
      if (!parsed) {
        return {
          success: false,
          profileContribution: [],
          error: 'Failed to parse generation response',
        };
      }

      return {
        success: true,
        primary: parsed.primary,
        alternatives: parsed.alternatives,
        currentAnalysis: parsed.currentAnalysis,
        profileContribution: parsed.profileContribution || [],
        tokensUsed: response.usage,
      };
    } catch (error) {
      console.error('[ProfileDescriptionGenerator] Generation error:', error);
      return {
        success: false,
        profileContribution: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Quick generation using only key profile elements (faster, less thorough)
   */
  generateQuickDescription(profile: ActivityProfile): string {
    // Build description from strongest elements
    const elements: string[] = [];

    // Get latest/highest role
    if (profile.facts.roles.length > 0) {
      const role = profile.facts.roles[profile.facts.roles.length - 1];
      elements.push(role.role);
    }

    // Add a key action
    if (profile.story.keyMoments.length > 0) {
      const bestMoment = profile.story.keyMoments.find(m =>
        m.type === 'breakthrough' || m.type === 'challenge'
      ) || profile.story.keyMoments[0];
      elements.push(bestMoment.whatYouDid);
    }

    // Add impact
    if (profile.facts.scale.peopleDirectlyImpacted > 0) {
      elements.push(`reaching ${profile.facts.scale.peopleDirectlyImpacted} people`);
    } else if (profile.impact.directBeneficiaries.length > 0) {
      const b = profile.impact.directBeneficiaries[0];
      elements.push(`helping ${b.who}`);
    }

    // Add recognition if notable
    if (profile.facts.recognition.length > 0) {
      const topRecognition = profile.facts.recognition.find(r =>
        r.level === 'national' || r.level === 'state'
      );
      if (topRecognition) {
        elements.push(topRecognition.name);
      }
    }

    // Build basic description
    let description = elements.join('; ');
    if (description.length > 150) {
      description = description.substring(0, 147) + '...';
    }

    return description || `${profile.activityTitle} involvement`;
  }

  /**
   * Assess if profile is ready for description generation
   */
  assessGenerationReadiness(profile: ActivityProfile): {
    isReady: boolean;
    readinessScore: number;
    missingElements: string[];
    recommendations: string[];
  } {
    const completeness = activityProfileService.calculateCompleteness(profile);
    const missingElements: string[] = [];
    const recommendations: string[] = [];

    // Check critical elements for description
    if (!profile.facts.roles.length) {
      missingElements.push('role/position');
      recommendations.push('Share what role or position you held');
    }

    if (!profile.facts.scale.peopleDirectlyImpacted && !profile.impact.directBeneficiaries.length) {
      missingElements.push('impact scope');
      recommendations.push('Describe who benefited from your work');
    }

    if (!profile.story.keyMoments.length) {
      missingElements.push('key moments');
      recommendations.push('Share a memorable achievement or challenge');
    }

    if (!profile.facts.recognition.length && !profile.facts.artifacts.length) {
      missingElements.push('recognition or creations');
      recommendations.push('Mention any awards, or things you created');
    }

    const readinessScore = Math.min(100, (completeness.overall * 1.5));
    const isReady = readinessScore >= 40 && missingElements.length <= 1;

    return {
      isReady,
      readinessScore,
      missingElements,
      recommendations,
    };
  }

  /**
   * Parse the LLM generation response
   */
  private parseGenerationResponse(content: string): {
    primary?: GeneratedDescription;
    alternatives?: GeneratedDescription[];
    currentAnalysis?: { score: number; strengths: string[]; weaknesses: string[] };
    profileContribution?: string[];
  } | null {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();

      const data = JSON.parse(jsonStr);

      // Normalize primary description
      const primary = data.primary ? this.normalizeGeneratedDescription(data.primary) : undefined;

      // Normalize alternatives
      const alternatives = Array.isArray(data.alternatives)
        ? data.alternatives.map((a: unknown) => this.normalizeGeneratedDescription(a as Record<string, unknown>))
        : undefined;

      // Normalize current analysis
      const currentAnalysis = data.currentAnalysis
        ? {
            score: Number(data.currentAnalysis.score) || 0,
            strengths: Array.isArray(data.currentAnalysis.strengths)
              ? data.currentAnalysis.strengths.map(String)
              : [],
            weaknesses: Array.isArray(data.currentAnalysis.weaknesses)
              ? data.currentAnalysis.weaknesses.map(String)
              : [],
          }
        : undefined;

      const profileContribution = Array.isArray(data.profileContribution)
        ? data.profileContribution.map(String)
        : [];

      return {
        primary,
        alternatives,
        currentAnalysis,
        profileContribution,
      };
    } catch (error) {
      console.error('[ProfileDescriptionGenerator] Parse error:', error);
      return null;
    }
  }

  /**
   * Normalize a generated description from LLM output
   */
  private normalizeGeneratedDescription(data: Record<string, unknown>): GeneratedDescription {
    return {
      text: String(data.text || '').substring(0, 150),
      charCount: String(data.text || '').length,
      emphasis: String(data.emphasis || 'balanced'),
      rationale: String(data.rationale || ''),
      profileElementsUsed: Array.isArray(data.profileElementsUsed)
        ? data.profileElementsUsed.map(String)
        : [],
      estimatedScoreImpact: Math.min(10, Math.max(0, Number(data.estimatedScoreImpact) || 0)),
      authenticQuoteUsed: data.authenticQuoteUsed ? String(data.authenticQuoteUsed) : undefined,
    };
  }
}

// Export singleton
export const profileDescriptionGenerator = new ProfileDescriptionGenerator();
