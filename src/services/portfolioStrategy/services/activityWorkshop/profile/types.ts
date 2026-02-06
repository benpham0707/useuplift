/**
 * Activity Profile Types
 *
 * Comprehensive data structure for capturing rich, detailed information about
 * each extracurricular activity through conversational extraction.
 *
 * PHILOSOPHY: The 150-character description is the tip of the iceberg.
 * The Activity Profile is everything beneath the surface — the full story,
 * context, impact, and meaning that allows us to:
 *
 * 1. Generate better descriptions (we know what to include)
 * 2. Score more accurately (we have verified facts)
 * 3. Teach more specifically (we can reference exact details)
 * 4. Connect to narrative (we understand how activities relate)
 * 5. Prepare for interviews (we know the stories to tell)
 *
 * DESIGN PRINCIPLES:
 * - Incremental: Profiles build over multiple conversations
 * - Authentic: Preserve student's actual words and voice
 * - Connected: Track relationships between activities
 * - Actionable: Every field has a purpose in downstream systems
 */

// ============================================================================
// CORE PROFILE STRUCTURE
// ============================================================================

/**
 * Complete Activity Profile
 *
 * This is the master structure that captures everything we learn about
 * an activity through conversation with the student.
 */
export interface ActivityProfile {
  // === IDENTITY ===
  /** Unique identifier linking to the activity */
  activityId: string;
  /** Activity title for reference */
  activityTitle: string;
  /** Profile version (increments as we learn more) */
  profileVersion: number;
  /** Last time profile was updated */
  lastUpdated: string;
  /** How complete is this profile (0-100) */
  dataCompleteness: number;

  // === THE FACTS (Objective Data) ===
  facts: ActivityFacts;

  // === THE STORY (Narrative Elements) ===
  story: ActivityStory;

  // === THE MEANING (Reflective) ===
  meaning: ActivityMeaning;

  // === THE IMPACT (External Validation) ===
  impact: ActivityImpact;

  // === THE CONNECTIONS (Spike/Narrative) ===
  connections: ActivityConnections;

  // === GENERATED OUTPUTS ===
  generated: GeneratedOutputs;

  // === METADATA ===
  metadata: ProfileMetadata;
}

// ============================================================================
// FACTS SECTION - Objective, Verifiable Data
// ============================================================================

export interface ActivityFacts {
  /**
   * Timeline and duration information
   */
  duration: {
    /** When they started (YYYY-MM or 'freshman_year', etc.) */
    startDate?: string;
    /** When they ended (or 'ongoing') */
    endDate?: string | 'ongoing';
    /** Total years involved */
    totalYears: number;
    /** Average hours per week */
    hoursPerWeek: number;
    /** Weeks per year active */
    weeksPerYear: number;
    /** Calculated total hours */
    totalHoursEstimated: number;
    /** Frequency pattern */
    frequency?: 'daily' | 'several_times_weekly' | 'weekly' | 'biweekly' | 'monthly' | 'seasonal' | 'irregular';
  };

  /**
   * Scale and scope of involvement
   */
  scale: {
    /** People directly helped/taught/led */
    peopleDirectlyImpacted?: number;
    /** Broader reach (viewers, readers, beneficiaries) */
    peopleIndirectlyReached?: number;
    /** Money managed or raised */
    budgetManaged?: number;
    /** Revenue generated (for businesses/entrepreneurship) */
    revenueGenerated?: number;
    /** Physical resources created (guides, videos, etc.) */
    resourcesCreated?: number;
    /** Description of resources */
    resourcesDescription?: string;
    /** Events organized or led */
    eventsOrganized?: number;
    /** Team or group size */
    teamSize?: number;
    /** Geographic scope */
    geographicScope?: 'local' | 'school' | 'district' | 'regional' | 'state' | 'national' | 'international';
  };

  /**
   * Role evolution over time
   */
  roles: ActivityRole[];

  /**
   * Recognition and awards received
   */
  recognition: ActivityRecognition[];

  /**
   * Tangible artifacts created
   */
  artifacts: ActivityArtifact[];

  /**
   * Specific skills used or developed
   */
  technicalSkills?: string[];
}

export interface ActivityRole {
  /** Role title/position */
  role: string;
  /** When they started this role */
  startDate: string;
  /** When this role ended (if applicable) */
  endDate?: string;
  /** Key responsibilities in this role */
  responsibilities: string[];
  /** How they got this role (elected, appointed, promoted, founded) */
  howObtained?: 'elected' | 'appointed' | 'promoted' | 'founded' | 'earned' | 'volunteered';
}

export interface ActivityRecognition {
  /** Type of recognition */
  type: 'award' | 'selection' | 'publication' | 'media_feature' | 'certification' | 'scholarship' | 'competition_placement';
  /** Name of the recognition */
  name: string;
  /** Level of recognition */
  level: 'international' | 'national' | 'state' | 'regional' | 'district' | 'local' | 'school';
  /** Selectivity context (e.g., "120 selected from 8,000 auditionees") */
  selectivity?: string;
  /** Date received */
  date?: string;
  /** Placement if applicable (1st, 2nd, semifinalist, etc.) */
  placement?: string;
  /** Issuing organization */
  issuedBy?: string;
}

export interface ActivityArtifact {
  /** Type of artifact */
  type: 'code' | 'publication' | 'resource' | 'curriculum' | 'event' | 'organization' | 'product' | 'app' | 'video' | 'website' | 'research' | 'art' | 'other';
  /** Name of the artifact */
  name: string;
  /** Description of what it is */
  description: string;
  /** Does it still exist/is it still being used? */
  stillExists: boolean;
  /** URL if applicable */
  url?: string;
  /** Impact or reach of this artifact */
  impact?: string;
  /** Date created */
  dateCreated?: string;
}

// ============================================================================
// STORY SECTION - Narrative Elements
// ============================================================================

export interface ActivityStory {
  /**
   * Origin story - how it all began
   */
  origin: {
    /** How they first got involved */
    howStarted: string;
    /** Why they joined/started */
    whyJoined: string;
    /** Initial motivation or interest */
    initialMotivation: string;
    /** Who introduced them or inspired them */
    catalyst?: string;
  };

  /**
   * Key moments in the journey
   */
  keyMoments: KeyMoment[];

  /**
   * How their involvement evolved over time
   */
  evolution: EvolutionPhase[];

  /**
   * Important relationships formed
   */
  relationships: ActivityRelationship[];

  /**
   * How and why it ended (if applicable)
   */
  ending?: {
    /** Why they stopped or transitioned out */
    whyEnded: string;
    /** What they left behind (systems, successors, etc.) */
    whatLeftBehind: string;
    /** Any ongoing connection */
    ongoingConnection?: string;
  };
}

export interface KeyMoment {
  /** Type of moment */
  type: 'breakthrough' | 'challenge' | 'turning_point' | 'proud_moment' | 'failure_learned_from' | 'unexpected_success' | 'difficult_decision';
  /** Brief description */
  description: string;
  /** What happened in detail */
  whatHappened: string;
  /** What the student specifically did */
  whatYouDid: string;
  /** The outcome or result */
  outcome: string;
  /** What they learned (if applicable) */
  whatYouLearned?: string;
  /** When this happened */
  when?: string;
  /** Why this moment matters */
  significance?: string;
}

export interface EvolutionPhase {
  /** Phase name/description */
  phase: string;
  /** What this phase involved */
  description: string;
  /** What changed from previous phase */
  whatChanged: string;
  /** Approximate timeframe */
  timeframe?: string;
}

export interface ActivityRelationship {
  /** Type of relationship */
  type: 'mentor' | 'peer' | 'mentee' | 'collaborator' | 'coach' | 'advisor' | 'partner';
  /** Description of the person/relationship */
  description: string;
  /** How this relationship impacted the student */
  impact: string;
  /** What they learned from this person */
  whatLearned?: string;
}

// ============================================================================
// MEANING SECTION - Reflective Elements
// ============================================================================

export interface ActivityMeaning {
  /**
   * Skills developed through this activity
   */
  skills: DevelopedSkill[];

  /**
   * Values demonstrated or reinforced
   */
  values: DemonstratedValue[];

  /**
   * Areas of personal growth
   */
  personalGrowth: GrowthArea[];

  /**
   * Single proudest moment or achievement
   */
  proudestMoment: string;

  /**
   * Hardest challenge faced
   */
  hardestChallenge: string;

  /**
   * Why this activity matters to them
   */
  whyItMatters: string;

  /**
   * How this shaped their interests or goals
   */
  howItShapedThem?: string;

  /**
   * What they would do differently
   */
  whatWouldDoDifferently?: string;

  /**
   * Authentic quotes from the student - preserve their voice
   * These are exact phrases the student used in conversation
   */
  authenticQuotes: AuthenticQuote[];
}

export interface DevelopedSkill {
  /** Skill name */
  skill: string;
  /** How this skill was developed */
  howDeveloped: string;
  /** Current proficiency level */
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  /** Specific example demonstrating the skill */
  example?: string;
}

export interface DemonstratedValue {
  /** Value/trait name */
  value: string;
  /** How it was demonstrated */
  howDemonstrated: string;
  /** Specific example */
  example?: string;
}

export interface GrowthArea {
  /** Area of growth */
  area: string;
  /** What they were like before */
  before: string;
  /** What they're like after */
  after: string;
  /** What caused the change */
  catalyst?: string;
}

export interface AuthenticQuote {
  /** The exact quote from the student */
  quote: string;
  /** Context of when they said this */
  context: string;
  /** Where this quote could be useful */
  potentialUse: 'description' | 'essay' | 'interview' | 'general';
}

// ============================================================================
// IMPACT SECTION - External Validation
// ============================================================================

export interface ActivityImpact {
  /**
   * People directly helped or affected
   */
  directBeneficiaries: Beneficiary[];

  /**
   * Before/after comparison showing change
   */
  beforeAfter?: {
    /** State before student's involvement */
    before: string;
    /** State after student's involvement */
    after: string;
    /** Student's specific role in the change */
    yourRole: string;
  };

  /**
   * What wouldn't have happened without the student
   */
  counterfactual?: string;

  /**
   * Quotes or feedback from others
   */
  testimonials: Testimonial[];

  /**
   * Lasting effects that continue after student's involvement
   */
  ongoingLegacy?: string;

  /**
   * External adoption of student's work/ideas
   */
  externalAdoption?: {
    /** Who adopted it */
    adoptedBy: string;
    /** What was adopted */
    whatAdopted: string;
    /** Scale of adoption */
    scale: string;
  };
}

export interface Beneficiary {
  /** Who was helped */
  who: string;
  /** How they were helped */
  howHelped: string;
  /** Measurable outcome if available */
  measurableOutcome?: string;
  /** Number of people (if countable) */
  count?: number;
}

export interface Testimonial {
  /** Who said it */
  from: string;
  /** Their relationship to the student */
  relationship: string;
  /** The quote/feedback */
  quote: string;
  /** When they said it */
  when?: string;
}

// ============================================================================
// CONNECTIONS SECTION - Spike & Narrative Integration
// ============================================================================

export interface ActivityConnections {
  /**
   * How this activity relates to the student's spike
   */
  spikeRelevance: {
    /** Does this connect to the spike? */
    connectsToSpike: boolean;
    /** How it connects (if applicable) */
    spikeConnection?: string;
    /** Strength of connection */
    strength: 'core' | 'supporting' | 'tangential' | 'unrelated';
    /** What aspect of the spike it supports */
    spikeAspect?: string;
  };

  /**
   * Alignment with intended major
   */
  majorAlignment: {
    /** Is this relevant to their major? */
    relevantToMajor: boolean;
    /** How it's relevant */
    howRelevant?: string;
    /** Skills demonstrated that relate to major */
    skillsDemonstrated?: string[];
  };

  /**
   * Character traits this activity demonstrates
   */
  characterTraits: CharacterTraitDemonstration[];

  /**
   * Connections to other activities in their portfolio
   */
  relatedActivities: RelatedActivity[];

  /**
   * Role this activity plays in the overall narrative
   */
  narrativeRole: 'headline' | 'supporting' | 'depth' | 'breadth' | 'character' | 'unexpected';

  /**
   * Themes this activity supports
   */
  themes?: string[];
}

export interface CharacterTraitDemonstration {
  /** Trait name */
  trait: 'leadership' | 'innovation' | 'resilience' | 'curiosity' | 'empathy' | 'discipline' | 'creativity' | 'integrity' | 'collaboration' | 'initiative' | 'perseverance';
  /** How it's demonstrated */
  howDemonstrated: string;
  /** Specific evidence */
  evidence?: string;
}

export interface RelatedActivity {
  /** ID of the related activity */
  activityId: string;
  /** Name of the related activity */
  activityName: string;
  /** How they're connected */
  connection: string;
  /** Type of connection */
  connectionType: 'skill_transfer' | 'thematic' | 'sequential' | 'complementary' | 'contrast';
}

// ============================================================================
// GENERATED OUTPUTS
// ============================================================================

export interface GeneratedOutputs {
  /**
   * Multiple description options at different lengths/emphases
   */
  descriptions: GeneratedDescription[];

  /**
   * Potential essay angles derived from this activity
   */
  essayAngles: EssayAngle[];

  /**
   * Interview preparation points
   */
  interviewPoints: InterviewPoint[];
}

export interface GeneratedDescription {
  /** Target character length */
  length: 150 | 100 | 50;
  /** The generated description */
  text: string;
  /** What this version emphasizes */
  emphasis: 'impact' | 'innovation' | 'leadership' | 'dedication' | 'growth' | 'spike_connection' | 'balanced';
  /** Which profile fields this draws from */
  sourcedFrom: string[];
  /** When this was generated */
  generatedAt: string;
  /** Estimated score this description would receive */
  estimatedScore?: number;
}

export interface EssayAngle {
  /** The angle/approach */
  angle: string;
  /** Essay prompts this could work for */
  potentialPrompts: string[];
  /** Key details to include */
  keyDetails: string[];
  /** Key moments that support this angle */
  keyMoments: string[];
  /** Why this angle is compelling */
  whyCompelling: string;
}

export interface InterviewPoint {
  /** Likely question to be asked */
  likelyQuestion: string;
  /** Suggested response structure */
  suggestedResponse: string;
  /** Key details to mention */
  keyDetailsToMention: string[];
  /** Follow-up questions to anticipate */
  anticipatedFollowUps?: string[];
}

// ============================================================================
// METADATA
// ============================================================================

export interface ProfileMetadata {
  /**
   * History of conversations that built this profile
   */
  conversationHistory: ConversationRecord[];

  /**
   * Confidence scores for each section
   */
  confidenceScores: {
    facts: number;
    story: number;
    meaning: number;
    impact: number;
    connections: number;
  };

  /**
   * Known gaps in the profile
   */
  gapsIdentified: string[];

  /**
   * Suggested follow-up questions
   */
  suggestedFollowUps: string[];

  /**
   * Priority level for further development
   */
  developmentPriority: 'high' | 'medium' | 'low';

  /**
   * Estimated score improvement if profile is fully developed
   */
  potentialScoreImpact: {
    description: number;
    activity: number;
    portfolio: number;
  };
}

export interface ConversationRecord {
  /** When the conversation occurred */
  timestamp: string;
  /** Questions asked in this session */
  questionsAsked: string[];
  /** New information extracted */
  newInfoExtracted: string[];
  /** Fields updated */
  fieldsUpdated: string[];
  /** Completeness before this conversation */
  completenessBefore: number;
  /** Completeness after this conversation */
  completenessAfter: number;
}

// ============================================================================
// PROFILE COMPLETENESS
// ============================================================================

/**
 * Detailed completeness assessment for a profile
 */
export interface ProfileCompleteness {
  /** Overall completeness (0-100) */
  overall: number;

  /** Section-by-section completeness */
  sections: {
    facts: number;
    story: number;
    meaning: number;
    impact: number;
    connections: number;
  };

  /** Priority fields for this activity type */
  priorityFields: PriorityField[];

  /** Estimated impact of completing the profile */
  potentialScoreImpact: {
    description: number;
    activity: number;
    portfolio: number;
  };

  /** Recommended next questions to ask */
  recommendedQuestions: string[];
}

export interface PriorityField {
  /** Field path (e.g., "facts.scale.peopleDirectlyImpacted") */
  field: string;
  /** Human-readable name */
  displayName: string;
  /** Why this field matters */
  importance: 'critical' | 'high' | 'medium' | 'low';
  /** Is it currently filled? */
  currentlyFilled: boolean;
  /** Estimated impact if filled */
  impactIfFilled: string;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new empty activity profile
 */
export function createEmptyProfile(activityId: string, activityTitle: string): ActivityProfile {
  return {
    activityId,
    activityTitle,
    profileVersion: 1,
    lastUpdated: new Date().toISOString(),
    dataCompleteness: 0,

    facts: {
      duration: {
        totalYears: 0,
        hoursPerWeek: 0,
        weeksPerYear: 0,
        totalHoursEstimated: 0,
      },
      scale: {},
      roles: [],
      recognition: [],
      artifacts: [],
    },

    story: {
      origin: {
        howStarted: '',
        whyJoined: '',
        initialMotivation: '',
      },
      keyMoments: [],
      evolution: [],
      relationships: [],
    },

    meaning: {
      skills: [],
      values: [],
      personalGrowth: [],
      proudestMoment: '',
      hardestChallenge: '',
      whyItMatters: '',
      authenticQuotes: [],
    },

    impact: {
      directBeneficiaries: [],
      testimonials: [],
    },

    connections: {
      spikeRelevance: {
        connectsToSpike: false,
        strength: 'unrelated',
      },
      majorAlignment: {
        relevantToMajor: false,
      },
      characterTraits: [],
      relatedActivities: [],
      narrativeRole: 'supporting',
    },

    generated: {
      descriptions: [],
      essayAngles: [],
      interviewPoints: [],
    },

    metadata: {
      conversationHistory: [],
      confidenceScores: {
        facts: 0,
        story: 0,
        meaning: 0,
        impact: 0,
        connections: 0,
      },
      gapsIdentified: [],
      suggestedFollowUps: [],
      developmentPriority: 'medium',
      potentialScoreImpact: {
        description: 0,
        activity: 0,
        portfolio: 0,
      },
    },
  };
}

/**
 * Create a profile pre-populated with basic activity data
 */
export function createProfileFromBasicData(
  activityId: string,
  activityTitle: string,
  basicData: {
    description?: string;
    position?: string;
    hoursPerWeek?: number;
    weeksPerYear?: number;
    yearsInvolved?: number;
    activityType?: string;
  }
): ActivityProfile {
  const profile = createEmptyProfile(activityId, activityTitle);

  // Populate what we know
  if (basicData.hoursPerWeek) {
    profile.facts.duration.hoursPerWeek = basicData.hoursPerWeek;
  }
  if (basicData.weeksPerYear) {
    profile.facts.duration.weeksPerYear = basicData.weeksPerYear;
  }
  if (basicData.yearsInvolved) {
    profile.facts.duration.totalYears = basicData.yearsInvolved;
  }
  if (basicData.hoursPerWeek && basicData.weeksPerYear && basicData.yearsInvolved) {
    profile.facts.duration.totalHoursEstimated =
      basicData.hoursPerWeek * basicData.weeksPerYear * basicData.yearsInvolved;
  }

  if (basicData.position) {
    profile.facts.roles.push({
      role: basicData.position,
      startDate: 'unknown',
      responsibilities: [],
    });
  }

  // Calculate initial completeness (very low since we just have basics)
  profile.dataCompleteness = 5; // 5% for having basic data

  return profile;
}
