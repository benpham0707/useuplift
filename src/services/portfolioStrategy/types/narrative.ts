/**
 * Narrative Synthesis Types
 *
 * Comprehensive type definitions for the Narrative Synthesis stage that
 * creates cohesive application narratives. This includes the "two-sentence
 * pitch" test that validates narrative coherence.
 *
 * Key Concepts:
 * - Every strong application tells a coherent story
 * - The narrative should pass the "two-sentence pitch" test
 * - All components should reinforce the central theme
 * - The narrative should be memorable and differentiating
 *
 * Two-Sentence Pitch Test:
 * "In two sentences, describe who this applicant is and why they belong at [School]."
 * If you can't do this compellingly, the application lacks coherence.
 */

import { HarvardScore, HarvardScoreDecimal } from './scoring';
import { CharacterDimension } from './character';
import { ApplicationArchetype } from './synthesis';

// ============================================================================
// NARRATIVE CORE TYPES
// ============================================================================

/**
 * Narrative strength classification
 */
export type NarrativeStrength =
  | 'exceptional'     // Unforgettable, compelling story that differentiates
  | 'strong'          // Clear narrative thread with good coherence
  | 'adequate'        // Some coherence but not memorable
  | 'weak'            // Disconnected or generic
  | 'absent';         // No discernible narrative

/**
 * Narrative coherence level
 */
export type NarrativeCoherence =
  | 'seamless'        // All elements reinforce the central theme
  | 'strong'          // Most elements connect well
  | 'moderate'        // Some connections, some disconnects
  | 'weak'            // Few meaningful connections
  | 'fragmented';     // No coherent thread

// ============================================================================
// TWO-SENTENCE PITCH
// ============================================================================

/**
 * The two-sentence pitch - core narrative distillation
 */
export interface TwoSentencePitch {
  // The actual pitch
  pitch: {
    sentence1: string; // Who they are (identity + primary strength)
    sentence2: string; // Why they belong (fit + contribution)
    combined: string;  // Full two-sentence pitch
  };

  // Pitch quality assessment
  quality: {
    score: HarvardScoreDecimal;
    isCompelling: boolean;
    isMemorable: boolean;
    isSpecific: boolean; // Avoids generic statements
    isDifferentiating: boolean; // Sets them apart from others
  };

  // Pitch components
  components: {
    identity: string;        // Who they fundamentally are
    primaryStrength: string; // Their biggest differentiator
    uniqueAngle: string;     // What makes them different
    valueAdd: string;        // What they'll contribute
    fitReason: string;       // Why this school specifically
  };

  // Validation
  validation: {
    passesTest: boolean;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };

  // School-specific variations
  schoolVariations: Record<string, {
    schoolId: string;
    schoolName: string;
    customizedPitch: string;
    fitEmphasis: string;
  }>;
}

// ============================================================================
// NARRATIVE THREAD
// ============================================================================

/**
 * The central narrative thread that runs through the application
 */
export interface NarrativeThread {
  // Core theme
  coreTheme: {
    theme: string;
    oneWordSummary: string;
    shortDescription: string;
    fullDescription: string;
  };

  // Theme evidence across application
  themeEvidence: {
    inAcademics: string[];
    inActivities: string[];
    inAwards: string[];
    inEssays: string[];
    inRecommendations: string[];
  };

  // Supporting themes
  supportingThemes: {
    theme: string;
    connectionToCore: string;
    evidence: string[];
  }[];

  // Theme consistency
  consistency: {
    score: number; // 0-100
    strongConnections: string[];
    weakConnections: string[];
    disconnects: string[];
    recommendations: string[];
  };
}

// ============================================================================
// APPLICATION STORY
// ============================================================================

/**
 * The complete application story structure
 */
export interface ApplicationStory {
  // Story arc
  storyArc: {
    beginning: {
      context: string;        // Where they started
      challenges: string;     // What they faced
      catalyst: string;       // What sparked their journey
    };
    middle: {
      journey: string;        // How they developed
      keyMoments: string[];   // Pivotal experiences
      growth: string;         // How they changed
    };
    end: {
      current: string;        // Where they are now
      aspiration: string;     // Where they're headed
      contribution: string;   // What they'll give back
    };
  };

  // Character development
  characterDevelopment: {
    startingPoint: string;
    challenges: string[];
    transformations: string[];
    currentState: string;
    trajectory: string;
  };

  // Story quality
  storyQuality: {
    hasConflict: boolean;
    hasGrowth: boolean;
    hasResolution: boolean;
    isAuthentic: boolean;
    isCompelling: boolean;
    assessment: string;
  };
}

// ============================================================================
// NARRATIVE ELEMENTS
// ============================================================================

/**
 * Key narrative elements to weave through application
 */
export interface NarrativeElements {
  // Identity markers
  identityMarkers: {
    primaryIdentity: string;
    supportingIdentities: string[];
    uniqueCombination: string;
    culturalElements: string[];
  };

  // Intellectual identity
  intellectualIdentity: {
    primaryInterest: string;
    intellectualJourney: string;
    uniquePerspective: string;
    futureQuestions: string[];
  };

  // Values and beliefs
  valuesBeliefs: {
    coreValues: string[];
    demonstratedBeliefs: string[];
    valueEvolution: string;
    valueApplication: string;
  };

  // Signature experiences
  signatureExperiences: {
    experience: string;
    impact: string;
    narrativeRole: string;
    uniqueAspect: string;
  }[];

  // Voice characteristics
  voiceCharacteristics: {
    tone: string[];
    style: string[];
    distinctiveFeatures: string[];
  };
}

// ============================================================================
// NARRATIVE SYNTHESIS OUTPUT
// ============================================================================

/**
 * Complete narrative synthesis output
 */
export interface NarrativeSynthesis {
  // Metadata
  synthesizedAt: string;
  version: string;

  // Overall narrative assessment
  overallAssessment: {
    narrativeScore: HarvardScoreDecimal;
    narrativeStrength: NarrativeStrength;
    coherenceLevel: NarrativeCoherence;
    memorabilityScore: number; // 0-100
    differentiationScore: number; // 0-100
  };

  // Two-sentence pitch
  twoSentencePitch: TwoSentencePitch;

  // Narrative thread
  narrativeThread: NarrativeThread;

  // Application story
  applicationStory: ApplicationStory;

  // Narrative elements
  narrativeElements: NarrativeElements;

  // Archetype analysis
  archetypeAnalysis: {
    primaryArchetype: ApplicationArchetype;
    archetypeStrength: number;
    archetypeEvidence: string[];
    secondaryArchetype?: ApplicationArchetype;
    archetypeFit: string;
  };

  // Component coherence matrix
  coherenceMatrix: {
    academicsToActivities: number;
    activitiesToAwards: number;
    awardsToEssays: number;
    essaysToContext: number;
    overallCoherence: number;
    coherenceNarrative: string;
  };

  // Narrative gaps and opportunities
  gapsAndOpportunities: {
    narrativeGaps: {
      gap: string;
      severity: 'critical' | 'significant' | 'minor';
      howToAddress: string;
    }[];
    untoldStories: {
      story: string;
      narrativeValue: string;
      whereToTell: string;
    }[];
    strengthsToAmplify: {
      strength: string;
      currentVisibility: string;
      amplificationStrategy: string;
    }[];
  };

  // School-specific narrative fit
  schoolNarrativeFit: Record<string, {
    schoolId: string;
    narrativeFitScore: number;
    whatResonates: string[];
    whatMightConcern: string[];
    recommendedEmphasis: string;
    customizedAngle: string;
  }>;

  // Essay strategy
  essayStrategy: {
    personalStatementDirection: {
      recommendedFocus: string;
      storyToTell: string;
      uniqueAngle: string;
      avoidsGeneric: string[];
    };
    supplementalEssayApproach: {
      overallStrategy: string;
      consistentThemes: string[];
      variationStrategy: string;
    };
    topicRecommendations: {
      highPotential: string[];
      risky: string[];
      overused: string[];
    };
  };

  // Recommendation letter alignment
  recommendationAlignment: {
    idealThemesFromRecommenders: string[];
    whoShouldEmphasize: Record<string, string[]>;
    narrativeGapsRecommendersCanFill: string[];
  };

  // Narrative execution guidance
  executionGuidance: {
    voiceGuidance: string[];
    toneGuidance: string[];
    detailsToInclude: string[];
    detailsToAvoid: string[];
    showDontTell: string[];
  };

  // Summary and recommendations
  summary: {
    narrativeInOneParagraph: string;
    biggestStrength: string;
    biggestOpportunity: string;
    criticalNextSteps: string[];
  };
}

// ============================================================================
// NARRATIVE VALIDATION
// ============================================================================

/**
 * Narrative validation result
 */
export interface NarrativeValidation {
  // Overall validation
  isValid: boolean;
  validationScore: number;

  // Individual tests
  tests: {
    twoSentencePitchTest: {
      passed: boolean;
      score: number;
      feedback: string;
    };
    coherenceTest: {
      passed: boolean;
      score: number;
      disconnects: string[];
    };
    memorabilityTest: {
      passed: boolean;
      score: number;
      whatStandsOut: string;
      whatsForgettable: string;
    };
    authenticityTest: {
      passed: boolean;
      score: number;
      authenticElements: string[];
      genericElements: string[];
    };
    differentiationTest: {
      passed: boolean;
      score: number;
      uniqueAspects: string[];
      commonAspects: string[];
    };
  };

  // Recommendations
  recommendations: string[];
}

// ============================================================================
// NARRATIVE CONSTANTS
// ============================================================================

/**
 * Narrative strength score thresholds
 */
export const NARRATIVE_STRENGTH_THRESHOLDS = {
  exceptional: 85,
  strong: 70,
  adequate: 55,
  weak: 40,
  absent: 0,
};

/**
 * Narrative coherence score thresholds
 */
export const NARRATIVE_COHERENCE_THRESHOLDS = {
  seamless: 90,
  strong: 75,
  moderate: 60,
  weak: 45,
  fragmented: 0,
};

/**
 * Narrative quality indicators
 */
export const NARRATIVE_QUALITY_INDICATORS = {
  positive: [
    'Clear central theme',
    'Authentic voice',
    'Specific details',
    'Emotional resonance',
    'Logical progression',
    'Memorable moments',
    'Unique perspective',
    'Growth demonstrated',
    'Future vision clear',
    'School fit evident',
  ],
  negative: [
    'Generic statements',
    'Disconnected elements',
    'Unclear focus',
    'Multiple competing themes',
    'Missing growth arc',
    'Forgettable content',
    'Overused topics',
    'Inauthentic voice',
    'No school-specific fit',
    'Privileged tone-deaf',
  ],
};
