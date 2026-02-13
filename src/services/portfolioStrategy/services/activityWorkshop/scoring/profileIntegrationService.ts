// @ts-nocheck
/**
 * Profile Integration Service
 *
 * CRITICAL DESIGN PRINCIPLE:
 * ═══════════════════════════════════════════════════════════════════════════════
 * SCORING must reflect the ADMISSIONS OFFICER'S perspective - they only see:
 * - 150-character description
 * - Activity title, position, organization
 * - Hours/weeks/years
 * - Honors field (if filled)
 *
 * PROFILES enhance GUIDANCE and TEACHING - not scores.
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * WHY THIS MATTERS:
 * A student might have an amazing story behind their activity, but if that story
 * isn't reflected in their description, the admissions officer won't know.
 * Our job is to help them GET that story into their description, not to give them
 * inflated scores based on information the AO will never see.
 *
 * PROFILE USES (What profiles ARE for):
 * 1. TEACHING LAYER - Use profile to suggest better descriptions
 * 2. GAP ANALYSIS - Identify what's missing from description vs reality
 * 3. AUTHENTIC VOICE - Pull quotes for rewrite suggestions
 * 4. STRATEGIC GUIDANCE - Know which activities to prioritize
 * 5. DESCRIPTION GENERATION - Create better 150-char descriptions
 *
 * PROFILE NON-USES (What profiles are NOT for):
 * ❌ Inflating description scores
 * ❌ Inflating activity tier assessments
 * ❌ Giving credit for things not visible in application
 */

import { ActivityProfile } from '../profile/types';
import { activityProfileService } from '../profile/activityProfileService';
import {
  TeachingLayerInput,
} from './teachingLayerTypes';
import {
  DescriptionScore,
} from './types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Gap analysis between what the student did (profile) and what AO sees (description)
 */
export interface DescriptionGapAnalysis {
  /** Activity ID */
  activityId: string;
  /** Activity title */
  activityTitle: string;
  /** Current description score (from AO perspective) */
  currentScore: number;
  /** What the description is missing that the profile contains */
  missingElements: {
    /** Elements that would improve the description */
    high_impact: MissingElement[];
    /** Elements that could help */
    medium_impact: MissingElement[];
    /** Nice to have but lower priority */
    low_impact: MissingElement[];
  };
  /** Estimated potential score if gaps were addressed */
  potentialScore: number;
  /** Specific suggestions to close gaps */
  suggestions: string[];
  /** Whether this activity warrants a rewrite */
  rewriteRecommended: boolean;
  /** Priority for attention */
  priority: 'urgent' | 'high' | 'medium' | 'low';
}

export interface MissingElement {
  /** What's missing */
  element: string;
  /** Category of missing element */
  category: 'quantification' | 'impact' | 'role_clarity' | 'differentiation' | 'action_verbs';
  /** What the profile contains */
  profileHas: string;
  /** What the description says (or doesn't) */
  descriptionShows: string;
  /** How to incorporate this */
  suggestion: string;
}

/**
 * Profile context for teaching/guidance only
 */
export interface TeachingProfileContext {
  activityId: string;
  /** Profile completeness affects quality of suggestions */
  completeness: number;
  /** Authentic quotes for rewrite suggestions */
  authenticQuotes: {
    quote: string;
    context: string;
    potentialUse: string;
  }[];
  /** Key moments to potentially highlight */
  keyMoments: {
    type: string;
    description: string;
    outcome?: string;
  }[];
  /** Why it matters to the student */
  whyItMatters?: string;
  /** Proudest moment for emotional anchor */
  proudestMoment?: string;
  /** Challenge overcome for resilience narrative */
  hardestChallenge?: string;
  /** Impact evidence for concrete suggestions */
  impactEvidence: {
    beneficiaries?: string[];
    outcomes?: string[];
    counterfactual?: string;
  };
  /** Metrics available for quantification */
  availableMetrics: {
    peopleImpacted?: number;
    hoursInvested?: number;
    resourcesCreated?: number;
    budgetManaged?: number;
    teamSize?: number;
  };
  /** Recognition to potentially mention */
  recognition: {
    name: string;
    level: string;
    selectivity?: string;
  }[];
}

/**
 * Profile-enhanced teaching input
 */
export interface ProfileEnhancedTeachingInput extends TeachingLayerInput {
  /** Profile context for each activity (for guidance, NOT scoring) */
  profileContext?: {
    profiles: TeachingProfileContext[];
  };
}

// ============================================================================
// SERVICE
// ============================================================================

export class ProfileIntegrationService {
  /**
   * Analyze gaps between what student did (profile) and what AO sees (description)
   *
   * This is the core function - it identifies WHERE the description falls short
   * of representing the student's actual experience, so we can guide them to fix it.
   */
  analyzeDescriptionGaps(
    activityId: string,
    activityTitle: string,
    description: string,
    profile: ActivityProfile,
    currentScore?: DescriptionScore
  ): DescriptionGapAnalysis {
    const missingElements: DescriptionGapAnalysis['missingElements'] = {
      high_impact: [],
      medium_impact: [],
      low_impact: [],
    };

    const descLower = description.toLowerCase();
    const suggestions: string[] = [];

    // ========================================================================
    // Check for QUANTIFICATION gaps
    // ========================================================================

    // People impacted
    if (profile.facts.scale.peopleDirectlyImpacted > 0) {
      const hasNumber = /\d+/.test(description);
      if (!hasNumber) {
        missingElements.high_impact.push({
          element: 'Impact quantification',
          category: 'quantification',
          profileHas: `Reached ${profile.facts.scale.peopleDirectlyImpacted} people`,
          descriptionShows: 'No numbers mentioned',
          suggestion: `Add "${profile.facts.scale.peopleDirectlyImpacted}" to show scale`,
        });
      }
    }

    // Resources created
    if (profile.facts.scale.resourcesCreated > 0) {
      const resourceKeywords = ['created', 'built', 'developed', 'made', 'produced'];
      const mentionsResources = resourceKeywords.some(k => descLower.includes(k));
      if (!mentionsResources) {
        missingElements.medium_impact.push({
          element: 'Tangible output',
          category: 'quantification',
          profileHas: `Created ${profile.facts.scale.resourcesCreated} ${profile.facts.scale.resourcesDescription || 'resources'}`,
          descriptionShows: 'No tangible output mentioned',
          suggestion: `Mention the ${profile.facts.scale.resourcesCreated} ${profile.facts.scale.resourcesDescription || 'items'} you created`,
        });
      }
    }

    // Budget managed
    if (profile.facts.scale.budgetManaged > 0 && !description.includes('$')) {
      missingElements.medium_impact.push({
        element: 'Budget responsibility',
        category: 'quantification',
        profileHas: `Managed $${profile.facts.scale.budgetManaged.toLocaleString()} budget`,
        descriptionShows: 'No financial responsibility mentioned',
        suggestion: `Include "$${profile.facts.scale.budgetManaged.toLocaleString()}" to show responsibility scope`,
      });
    }

    // ========================================================================
    // Check for IMPACT gaps
    // ========================================================================

    if (profile.impact.directBeneficiaries.length > 0) {
      const impactKeywords = ['helped', 'improved', 'increased', 'reduced', 'enabled', 'supported'];
      const showsImpact = impactKeywords.some(k => descLower.includes(k));
      if (!showsImpact) {
        const firstBeneficiary = profile.impact.directBeneficiaries[0];
        missingElements.high_impact.push({
          element: 'Beneficiary impact',
          category: 'impact',
          profileHas: `Helped ${firstBeneficiary.who}: ${firstBeneficiary.howHelped}`,
          descriptionShows: 'No clear beneficiary or impact',
          suggestion: `Show WHO you helped and HOW: "${firstBeneficiary.measurableOutcome || firstBeneficiary.howHelped}"`,
        });
      }
    }

    // Before/after transformation
    if (profile.impact.beforeAfter && !descLower.includes('→') && !descLower.includes('to')) {
      missingElements.medium_impact.push({
        element: 'Transformation evidence',
        category: 'impact',
        profileHas: `Changed "${profile.impact.beforeAfter.before}" → "${profile.impact.beforeAfter.after}"`,
        descriptionShows: 'No before/after or transformation shown',
        suggestion: `Show the change: "from X to Y" or use → to show transformation`,
      });
    }

    // ========================================================================
    // Check for ROLE CLARITY gaps
    // ========================================================================

    if (profile.facts.roles.length > 0) {
      const latestRole = profile.facts.roles[profile.facts.roles.length - 1];
      const roleWords = latestRole.role.toLowerCase().split(' ');

      // Handle responsibilities being either string or array
      const responsibilities = Array.isArray(latestRole.responsibilities)
        ? latestRole.responsibilities
        : (typeof latestRole.responsibilities === 'string' ? [latestRole.responsibilities] : []);

      const hasRoleClarity = roleWords.some(w => descLower.includes(w)) ||
        responsibilities.some(r => descLower.includes(r.toLowerCase().split(' ')[0]));

      if (!hasRoleClarity) {
        missingElements.high_impact.push({
          element: 'Role ownership',
          category: 'role_clarity',
          profileHas: `${latestRole.role}: ${responsibilities.slice(0, 2).join(', ')}`,
          descriptionShows: 'Unclear individual contribution',
          suggestion: `Make YOUR specific role unmistakable - what did YOU do that others didn't?`,
        });
      }
    }

    // ========================================================================
    // Check for DIFFERENTIATION gaps
    // ========================================================================

    // Recognition not mentioned
    if (profile.facts.recognition.length > 0) {
      const hasRecognition = profile.facts.recognition.some(r =>
        descLower.includes(r.name.toLowerCase().split(' ')[0])
      );
      if (!hasRecognition) {
        const topRecognition = profile.facts.recognition.find(r =>
          r.level === 'national' || r.level === 'state'
        ) || profile.facts.recognition[0];

        missingElements.high_impact.push({
          element: 'External validation',
          category: 'differentiation',
          profileHas: `${topRecognition.name} (${topRecognition.level})`,
          descriptionShows: 'No recognition or awards mentioned',
          suggestion: `Include "${topRecognition.name}" - external validation differentiates you`,
        });
      }
    }

    // Unique methodology or innovation
    const hasInnovation = profile.story.keyMoments.some(m =>
      m.type === 'breakthrough' || m.type === 'innovation'
    );
    if (hasInnovation) {
      const innovationKeywords = ['developed', 'created', 'designed', 'pioneered', 'invented', 'built'];
      const showsInnovation = innovationKeywords.some(k => descLower.includes(k));
      if (!showsInnovation) {
        const innovationMoment = profile.story.keyMoments.find(m =>
          m.type === 'breakthrough' || m.type === 'innovation'
        );
        missingElements.medium_impact.push({
          element: 'Innovation/unique contribution',
          category: 'differentiation',
          profileHas: innovationMoment?.description || 'Created something unique',
          descriptionShows: 'No unique contribution highlighted',
          suggestion: `Show what YOU created or innovated that others didn't`,
        });
      }
    }

    // ========================================================================
    // Check for ACTION VERB gaps
    // ========================================================================

    const weakVerbs = ['helped', 'assisted', 'participated', 'worked', 'involved', 'member'];
    const usesWeakVerbs = weakVerbs.some(v => descLower.includes(v));
    const strongVerbs = ['led', 'designed', 'engineered', 'developed', 'created', 'launched', 'pioneered'];
    const usesStrongVerbs = strongVerbs.some(v => descLower.includes(v));

    if (usesWeakVerbs && !usesStrongVerbs) {
      missingElements.medium_impact.push({
        element: 'Action verb strength',
        category: 'action_verbs',
        profileHas: 'Strong actions evident from key moments and role',
        descriptionShows: `Uses weak verbs: ${weakVerbs.filter(v => descLower.includes(v)).join(', ')}`,
        suggestion: `Replace weak verbs with: ${strongVerbs.slice(0, 3).join(', ')}`,
      });
    }

    // ========================================================================
    // Calculate potential and priority
    // ========================================================================

    const currentScoreValue = currentScore?.total || 5;
    const highImpactCount = missingElements.high_impact.length;
    const mediumImpactCount = missingElements.medium_impact.length;

    // Estimate potential improvement
    const potentialGain = Math.min(4, (highImpactCount * 1.5) + (mediumImpactCount * 0.5));
    const potentialScore = Math.min(10, currentScoreValue + potentialGain);

    // Determine priority
    let priority: DescriptionGapAnalysis['priority'] = 'low';
    if (highImpactCount >= 2 || (highImpactCount >= 1 && currentScoreValue < 5)) {
      priority = 'urgent';
    } else if (highImpactCount >= 1 || mediumImpactCount >= 2) {
      priority = 'high';
    } else if (mediumImpactCount >= 1) {
      priority = 'medium';
    }

    // Build suggestions
    for (const element of missingElements.high_impact) {
      suggestions.push(element.suggestion);
    }
    for (const element of missingElements.medium_impact.slice(0, 2)) {
      suggestions.push(element.suggestion);
    }

    return {
      activityId,
      activityTitle,
      currentScore: currentScoreValue,
      missingElements,
      potentialScore,
      suggestions,
      rewriteRecommended: priority === 'urgent' || priority === 'high',
      priority,
    };
  }

  /**
   * Build teaching context from profile
   *
   * This provides the raw material for GUIDANCE - authentic quotes,
   * key moments, impact evidence - that can be used to help the student
   * write a BETTER description (not inflate their current score).
   */
  buildTeachingContext(profile: ActivityProfile): TeachingProfileContext {
    return {
      activityId: profile.activityId,
      completeness: profile.dataCompleteness,
      authenticQuotes: profile.generated.authenticQuotes.map(q => ({
        quote: q.quote,
        context: q.context,
        potentialUse: q.potentialUse,
      })),
      keyMoments: profile.story.keyMoments.map(m => ({
        type: m.type,
        description: m.description,
        outcome: m.outcome,
      })),
      whyItMatters: profile.meaning.whyItMatters || undefined,
      proudestMoment: profile.meaning.proudestMoment || undefined,
      hardestChallenge: profile.meaning.hardestChallenge || undefined,
      impactEvidence: {
        beneficiaries: profile.impact.directBeneficiaries.map(b => b.who),
        outcomes: profile.impact.directBeneficiaries
          .filter(b => b.measurableOutcome)
          .map(b => b.measurableOutcome!),
        counterfactual: profile.impact.counterfactual || undefined,
      },
      availableMetrics: {
        peopleImpacted: profile.facts.scale.peopleDirectlyImpacted || undefined,
        hoursInvested: profile.facts.duration.totalYears > 0
          ? profile.facts.duration.hoursPerWeek * 40 * profile.facts.duration.totalYears
          : undefined,
        resourcesCreated: profile.facts.scale.resourcesCreated || undefined,
        budgetManaged: profile.facts.scale.budgetManaged || undefined,
        teamSize: profile.facts.scale.teamSize || undefined,
      },
      recognition: profile.facts.recognition.map(r => ({
        name: r.name,
        level: r.level,
        selectivity: r.selectivity,
      })),
    };
  }

  /**
   * Enhance teaching input with profile context
   *
   * The teaching layer uses this to provide better guidance, NOT to change scores.
   */
  enhanceTeachingInput(
    baseInput: TeachingLayerInput,
    profiles: Map<string, ActivityProfile>
  ): ProfileEnhancedTeachingInput {
    const profileContexts: TeachingProfileContext[] = [];

    for (const [activityId, profile] of profiles.entries()) {
      profileContexts.push(this.buildTeachingContext(profile));
    }

    return {
      ...baseInput,
      profileContext: {
        profiles: profileContexts,
      },
    };
  }

  /**
   * Assess profile readiness for description improvement
   *
   * Higher completeness = better guidance we can provide.
   * But this does NOT affect the score of the current description.
   */
  assessGuidanceReadiness(profile: ActivityProfile): {
    readyForGuidance: boolean;
    guidanceQuality: 'excellent' | 'good' | 'limited' | 'minimal';
    missingForBetterGuidance: string[];
    canGenerateRewrite: boolean;
  } {
    const completeness = activityProfileService.calculateCompleteness(profile);
    const missing: string[] = [];

    // Check what we need for good guidance
    if (!profile.facts.roles.length) {
      missing.push('specific role and responsibilities');
    }
    if (!profile.facts.scale.peopleDirectlyImpacted && !profile.impact.directBeneficiaries.length) {
      missing.push('impact scope or beneficiaries');
    }
    if (!profile.story.keyMoments.length) {
      missing.push('key moments or achievements');
    }
    if (!profile.generated.authenticQuotes.length) {
      missing.push('authentic quotes in your voice');
    }

    let guidanceQuality: 'excellent' | 'good' | 'limited' | 'minimal';
    if (completeness.overall >= 70) {
      guidanceQuality = 'excellent';
    } else if (completeness.overall >= 50) {
      guidanceQuality = 'good';
    } else if (completeness.overall >= 25) {
      guidanceQuality = 'limited';
    } else {
      guidanceQuality = 'minimal';
    }

    return {
      readyForGuidance: completeness.overall >= 25,
      guidanceQuality,
      missingForBetterGuidance: missing,
      canGenerateRewrite: completeness.overall >= 40 && profile.facts.roles.length > 0,
    };
  }

  /**
   * Determine if a conversation would help improve the description
   *
   * Triggers conversation when there's a gap between profile depth and description quality.
   */
  shouldTriggerConversation(
    profile: ActivityProfile,
    descriptionScore: number,
    context?: {
      isSpike?: boolean;
      portfolioRole?: 'highlight' | 'support' | 'filler';
    }
  ): {
    shouldTrigger: boolean;
    reason?: string;
    priority: 'high' | 'medium' | 'low';
    goal: string;
  } {
    const completeness = activityProfileService.calculateCompleteness(profile);

    // Scenario 1: Low description score + low profile = need to gather info to improve
    if (descriptionScore < 5 && completeness.overall < 30) {
      return {
        shouldTrigger: true,
        reason: 'We need more information about this activity to help you write a better description',
        priority: context?.isSpike ? 'high' : 'medium',
        goal: 'Gather key details to enable better description guidance',
      };
    }

    // Scenario 2: Low description score + decent profile = can improve using existing profile
    if (descriptionScore < 6 && completeness.overall >= 40) {
      return {
        shouldTrigger: false, // Don't need conversation, have enough to generate better description
        priority: 'low',
        goal: 'Generate improved description from existing profile',
      };
    }

    // Scenario 3: Spike/highlight with incomplete profile
    if ((context?.isSpike || context?.portfolioRole === 'highlight') && completeness.overall < 50) {
      return {
        shouldTrigger: true,
        reason: 'This is a key activity - let\'s make sure we capture everything to present it best',
        priority: 'high',
        goal: 'Build comprehensive profile for strategic positioning',
      };
    }

    // Scenario 4: Time investment suggests depth we haven't captured
    const totalHours = profile.facts.duration.hoursPerWeek * 40 * profile.facts.duration.totalYears;
    if (totalHours > 300 && completeness.overall < 40) {
      return {
        shouldTrigger: true,
        reason: `You've invested ${totalHours}+ hours - there's likely more to share that would strengthen your description`,
        priority: 'medium',
        goal: 'Capture depth of involvement for richer description',
      };
    }

    return {
      shouldTrigger: false,
      priority: 'low',
      goal: 'Profile adequate for current needs',
    };
  }
}

// Export singleton
export const profileIntegrationService = new ProfileIntegrationService();
