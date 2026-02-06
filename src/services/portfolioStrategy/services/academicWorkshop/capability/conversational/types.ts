/**
 * Conversational Capability Profile Types
 *
 * These types define the structure for capturing qualitative insights about a
 * student's academic experience through conversation. The goal is to understand
 * the CONTEXT behind the grades - effort, circumstances, feelings, and future intent.
 *
 * Philosophy:
 * - Grades tell WHAT happened; conversation tells WHY
 * - Context can dramatically change how we interpret performance
 * - The student's self-perception matters, even when it differs from data
 * - Every insight has a confidence level - we hold uncertain things lightly
 */

import type { SubjectArea } from '../types';

// ============================================================================
// COURSE-LEVEL ANNOTATIONS
// ============================================================================

/**
 * Detailed context for a specific course, gathered through conversation.
 * This is the most granular level of qualitative data.
 */
export interface CourseAnnotation {
  /** Reference to the course being annotated */
  courseId: string;
  courseName: string;
  subject: SubjectArea;
  year: number | string;

  // -------------------------------------------------------------------------
  // EFFORT AND PERFORMANCE CONTEXT
  // -------------------------------------------------------------------------

  /**
   * How hard did they work in this course? (1-5)
   * 1 = Minimal effort, 2 = Below average, 3 = Average, 4 = High effort, 5 = Maximum effort
   */
  effortLevel: number | null;

  /**
   * How difficult was this course FOR THEM? (1-5)
   * This is subjective - an AP course might feel easy for one student, hard for another.
   * 1 = Very easy, 2 = Easy, 3 = Moderate, 4 = Hard, 5 = Very hard
   */
  perceivedDifficulty: number | null;

  /**
   * Does the grade reflect their true ability in this subject?
   * - true: "This grade shows what I can do"
   * - false: "I could have done better/worse than this shows"
   * - null: Unknown or not discussed
   */
  gradeReflectsAbility: boolean | null;

  /**
   * Does the grade reflect the effort they put in?
   * - true: "I got what I deserved based on my effort"
   * - false: "I worked harder/less than this grade suggests"
   * - null: Unknown or not discussed
   */
  gradeReflectsEffort: boolean | null;

  // -------------------------------------------------------------------------
  // EXTERNAL FACTORS
  // -------------------------------------------------------------------------

  /**
   * Quality of instruction. Null if not discussed.
   */
  teacherQuality: TeacherQuality | null;

  /**
   * The learning environment in this class.
   */
  classEnvironment: ClassEnvironment | null;

  /**
   * External circumstances that affected performance in this course.
   */
  externalCircumstances: ExternalCircumstance[];

  // -------------------------------------------------------------------------
  // ENGAGEMENT AND INTEREST
  // -------------------------------------------------------------------------

  /**
   * How much did they enjoy this course? (1-5)
   * 1 = Hated it, 2 = Disliked, 3 = Neutral, 4 = Liked, 5 = Loved it
   */
  enjoymentLevel: number | null;

  /**
   * How engaged were they in the material? (1-5)
   * 1 = Completely disengaged, 2 = Mostly disengaged, 3 = Somewhat engaged,
   * 4 = Mostly engaged, 5 = Fully engaged
   */
  engagementLevel: number | null;

  /**
   * Were they genuinely interested in the subject matter?
   * - true: "I found this genuinely interesting"
   * - false: "I just took it because I had to"
   * - null: Unknown
   */
  intrinsicInterest: boolean | null;

  // -------------------------------------------------------------------------
  // SELF-ASSESSMENT
  // -------------------------------------------------------------------------

  /**
   * How confident do they feel in this subject NOW, after taking this course? (1-5)
   * 1 = Not confident at all, 2 = Low confidence, 3 = Moderate,
   * 4 = Confident, 5 = Very confident
   */
  confidenceAfter: number | null;

  /**
   * Knowing what they know now, would they take this course again?
   */
  wouldTakeAgain: boolean | null;

  /**
   * Do they want to continue in this subject area?
   */
  wantsToContinue: boolean | null;

  // -------------------------------------------------------------------------
  // RAW DATA
  // -------------------------------------------------------------------------

  /**
   * The student's own words about this course (summarized narrative).
   */
  studentNarrative: string;

  /**
   * Key insights extracted from their narrative.
   */
  keyInsights: string[];

  /**
   * Direct quotes from the conversation.
   */
  directQuotes: string[];

  // -------------------------------------------------------------------------
  // AI ASSESSMENT
  // -------------------------------------------------------------------------

  /**
   * How reliable is this annotation? (0-100)
   * Based on consistency with record, specificity of details, etc.
   */
  reliabilityScore: number;

  /**
   * Flags for attention.
   */
  flags: AnnotationFlag[];

  /**
   * When was this annotation created/last updated?
   */
  createdAt: Date;
  updatedAt: Date;
}

export type TeacherQuality = 'excellent' | 'good' | 'average' | 'poor' | 'terrible';

export type ClassEnvironment =
  | 'supportive' // Collaborative, helpful
  | 'challenging' // Demanding but fair
  | 'competitive' // High-pressure, competitive
  | 'chaotic' // Disorganized, unpredictable
  | 'standard' // Nothing notable
  | 'toxic'; // Negative, hostile

/**
 * An external circumstance that affected performance.
 */
export interface ExternalCircumstance {
  type: CircumstanceType;
  description: string;
  impact: ImpactLevel;
  timeframe?: string;
  resolved?: boolean;
}

export type CircumstanceType =
  | 'health' // Personal health issues
  | 'mental_health' // Anxiety, depression, etc.
  | 'family' // Family issues
  | 'school' // School-level issues (schedule conflicts, etc.)
  | 'teacher' // Teacher-specific issues
  | 'social' // Social challenges
  | 'extracurricular' // Over-commitment to activities
  | 'work' // Job responsibilities
  | 'transition' // Moving, changing schools
  | 'other';

export type ImpactLevel =
  | 'major_negative' // Significantly hurt performance
  | 'minor_negative' // Somewhat hurt performance
  | 'neutral' // No real impact
  | 'minor_positive' // Somewhat helped
  | 'major_positive'; // Significantly helped

/**
 * A flag indicating something notable about this annotation.
 */
export interface AnnotationFlag {
  type: FlagType;
  description: string;
  severity: 'info' | 'warning' | 'concern';
}

export type FlagType =
  | 'inconsistent_with_grade' // Their story doesn't match the grade
  | 'external_attribution' // They blame external factors heavily
  | 'internal_attribution' // They take responsibility
  | 'growth_mindset' // Shows growth mindset
  | 'fixed_mindset' // Shows fixed mindset
  | 'underconfident' // Less confident than grades suggest
  | 'overconfident' // More confident than grades suggest
  | 'disengaged' // Clearly wasn't engaged
  | 'passionate' // Clearly passionate about subject
  | 'needs_follow_up'; // More conversation needed

// ============================================================================
// SUBJECT-LEVEL INSIGHTS
// ============================================================================

/**
 * Aggregated understanding of a student's relationship with a subject area.
 * Built from course annotations and direct subject-level questions.
 */
export interface SubjectInsight {
  subject: SubjectArea;

  // -------------------------------------------------------------------------
  // OVERALL SENTIMENT (continuous 0-100 scales)
  // -------------------------------------------------------------------------

  /**
   * How confident are they in this subject overall? (0-100)
   */
  overallConfidence: number;

  /**
   * How interested are they in this subject? (0-100)
   */
  overallInterest: number;

  /**
   * How much effort do they typically put into this subject? (0-100)
   */
  overallEffort: number;

  /**
   * How difficult do they find this subject? (0-100)
   */
  perceivedDifficulty: number;

  // -------------------------------------------------------------------------
  // PATTERNS
  // -------------------------------------------------------------------------

  /**
   * Correlation between effort and grades in this subject (-1 to +1).
   * +1 = More effort always means better grades
   * 0 = No relationship
   * -1 = More effort correlates with worse grades (unlikely, but possible)
   */
  effortGradeCorrelation: number;

  /**
   * How well do their feelings match their performance? (0-100)
   * 100 = Perfect alignment, 0 = Complete mismatch
   */
  consistencyWithPerformance: number;

  // -------------------------------------------------------------------------
  // SELF-ASSESSMENT
  // -------------------------------------------------------------------------

  /**
   * Do THEY think this is a strength?
   */
  selfAssessedStrength: boolean;

  /**
   * Do THEY think this is a challenge area?
   */
  selfAssessedChallenge: boolean;

  /**
   * If their perception differs significantly from the data, describe the mismatch.
   */
  mismatchWithData: string | null;

  // -------------------------------------------------------------------------
  // FUTURE INTENT
  // -------------------------------------------------------------------------

  /**
   * Do they intend to continue taking courses in this subject?
   */
  intendsToContinue: boolean;

  /**
   * How willing are they to take harder courses in this subject? (1-5)
   */
  willingnessToChallenge: number;

  /**
   * Specific future courses they've mentioned wanting to take.
   */
  specificFutureCourses: string[];

  // -------------------------------------------------------------------------
  // KEY STATEMENTS
  // -------------------------------------------------------------------------

  /**
   * Notable quotes about this subject.
   */
  keyStatements: string[];

  /**
   * Summary narrative of their relationship with this subject.
   */
  narrativeSummary: string;
}

// ============================================================================
// LEARNING STYLE AND MOTIVATION
// ============================================================================

/**
 * Indicators of how the student learns best.
 */
export interface LearningStyleIndicators {
  /**
   * Do they prefer structured or unstructured learning?
   */
  structurePreference: 'highly_structured' | 'somewhat_structured' | 'flexible' | 'unstructured';

  /**
   * How do they respond to difficulty?
   */
  difficultyResponse: 'seeks_challenge' | 'accepts_challenge' | 'avoids_challenge' | 'mixed';

  /**
   * How do they learn best?
   */
  learningPreferences: LearningPreference[];

  /**
   * How do they handle failure/setbacks?
   */
  setbackResponse: SetbackResponse;

  /**
   * Evidence from conversation.
   */
  evidence: string[];
}

export type LearningPreference =
  | 'visual'
  | 'auditory'
  | 'reading_writing'
  | 'kinesthetic'
  | 'collaborative'
  | 'independent'
  | 'teacher_dependent'
  | 'self_directed';

export type SetbackResponse =
  | 'resilient' // Bounces back, learns from it
  | 'persistent' // Keeps trying same approach
  | 'adaptive' // Changes approach
  | 'discouraged' // Gets demotivated
  | 'avoidant'; // Avoids similar challenges

/**
 * What motivates this student academically?
 */
export interface MotivationProfile {
  /**
   * Primary motivators (ranked).
   */
  primaryMotivators: Motivator[];

  /**
   * What demotivates them?
   */
  demotivators: string[];

  /**
   * Is their motivation more internal or external?
   */
  motivationOrientation: 'intrinsic' | 'extrinsic' | 'balanced';

  /**
   * How do grades affect their motivation?
   */
  gradeMotivationLink: 'highly_motivated_by_grades' | 'somewhat' | 'grades_dont_motivate' | 'grades_demotivate';

  /**
   * Evidence from conversation.
   */
  evidence: string[];
}

export type Motivator =
  | 'intellectual_curiosity' // Love of learning
  | 'achievement' // Getting good grades/results
  | 'mastery' // Becoming good at something
  | 'recognition' // Being recognized for achievements
  | 'future_goals' // College, career, etc.
  | 'competition' // Being better than others
  | 'approval' // Parent/teacher approval
  | 'interest' // Subject interest
  | 'obligation' // Sense of duty
  | 'fear_of_failure' // Avoiding failure
  | 'social'; // Friends, social aspects

// ============================================================================
// SELF-AWARENESS ASSESSMENT
// ============================================================================

/**
 * How well does this student know themselves academically?
 */
export interface StudentSelfAwareness {
  /**
   * How accurate are their self-assessments of ability? (0-100)
   * 100 = Perfect calibration, 0 = Completely miscalibrated
   */
  selfPerceptionAccuracy: number;

  /**
   * Do they accurately gauge how much effort they put in? (0-100)
   */
  effortPerceptionAccuracy: number;

  /**
   * Do they accurately predict their performance? (0-100)
   */
  performancePredictionAccuracy: number;

  /**
   * Tendency to over/underestimate abilities.
   */
  estimationTendency: 'overestimates' | 'underestimates' | 'accurate' | 'inconsistent';

  /**
   * Areas where their perception differs most from reality.
   */
  blindSpots: BlindSpot[];

  /**
   * How consistent are their narratives across the conversation?
   */
  narrativeConsistency: number;

  /**
   * How well do their explanations align with their actual grades?
   */
  explanationGradeAlignment: number;
}

export interface BlindSpot {
  area: string;
  theyThink: string;
  dataSuggests: string;
  gapSize: 'small' | 'moderate' | 'large';
}

// ============================================================================
// GLOBAL CIRCUMSTANCES
// ============================================================================

/**
 * School-wide or period-wide circumstances that affected performance.
 */
export interface GlobalCircumstance {
  description: string;
  timeframe: string;
  impact: ImpactLevel;
  affectedSubjects: SubjectArea[] | 'all';
  resolved: boolean;
}

// ============================================================================
// CONVERSATION DATA
// ============================================================================

/**
 * A single turn in the conversation.
 */
export interface ConversationTurn {
  id: string;
  timestamp: Date;
  role: 'ai' | 'student';
  message: string;

  /** What topic was this turn about? */
  topic?: ConversationTopic;

  /** What insights were extracted from this turn? */
  extractedInsights?: ExtractedInsight[];

  /** What follow-up questions emerged? */
  generatedFollowUps?: string[];
}

/**
 * A topic to explore in conversation.
 */
export interface ConversationTopic {
  id: string;
  type: TopicType;
  priority: number;

  /** Scope of this topic */
  scope: {
    course?: string;
    subject?: SubjectArea;
    timeframe?: string;
    pattern?: string;
  };

  /** Context for why we're asking */
  context: string;

  /** The main question to ask */
  primaryQuestion: string;

  /** Follow-up questions if needed */
  followUpQuestions: string[];

  /** What we're trying to learn */
  targetInsights: TargetInsight[];

  /** Has this topic been covered? */
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';

  /** If completed, summary of what we learned */
  learningsSummary?: string;
}

export type TopicType =
  | 'grade_anomaly' // Grade that doesn't fit the pattern
  | 'difficulty_transition' // Moving up/down levels
  | 'subject_inconsistency' // Mixed performance within subject
  | 'high_stakes_course' // Important course for their path
  | 'trend_exploration' // Understanding a trend
  | 'subject_overview' // General feelings about a subject
  | 'circumstance_exploration' // Understanding external factors
  | 'future_planning' // Discussing future courses
  | 'follow_up'; // Following up on something mentioned

export type TargetInsight =
  | 'effort_level'
  | 'perceived_difficulty'
  | 'teacher_quality'
  | 'external_factors'
  | 'enjoyment'
  | 'engagement'
  | 'confidence'
  | 'interest'
  | 'future_intent'
  | 'self_assessment'
  | 'transition_experience'
  | 'learning_style'
  | 'motivation';

// ============================================================================
// EXTRACTED INSIGHTS
// ============================================================================

/**
 * A structured insight extracted from a conversation turn.
 */
export interface ExtractedInsight {
  /** What type of insight is this? */
  type: InsightType;

  /** What does this insight apply to? */
  scope: {
    course?: string;
    subject?: SubjectArea;
    timeframe?: string;
    global?: boolean;
  };

  /** The extracted values */
  values: ExtractedValues;

  /** Confidence in this extraction (0-100) */
  extractionConfidence: number;

  /** The quote that supports this insight */
  supportingQuote?: string;

  /** Sentiment of this insight */
  sentiment?: SentimentLevel;

  /** When was this extracted? */
  extractedAt: Date;

  /** How was this insight extracted? */
  extractionMethod?: 'llm' | 'heuristic' | 'minimal';
}

export type InsightType =
  | 'course_specific' // About a specific course
  | 'subject_general' // About a subject area
  | 'circumstantial' // About external circumstances
  | 'motivational' // About what drives them
  | 'self_assessment' // About how they see themselves
  | 'learning_style' // About how they learn
  | 'future_intent'; // About future plans

export interface ExtractedValues {
  // Numeric values (1-5 scale)
  effortLevel?: number;
  perceivedDifficulty?: number;
  enjoymentLevel?: number;
  engagementLevel?: number;
  confidenceLevel?: number;
  willingnessToChallenge?: number;

  // Boolean values
  gradeReflectsAbility?: boolean;
  gradeReflectsEffort?: boolean;
  intrinsicInterest?: boolean;
  wouldTakeAgain?: boolean;
  wantsToContinue?: boolean;
  selfAssessedStrength?: boolean;
  selfAssessedChallenge?: boolean;

  // Categorical values
  teacherQuality?: TeacherQuality;
  classEnvironment?: ClassEnvironment;
  setbackResponse?: SetbackResponse;
  motivationOrientation?: 'intrinsic' | 'extrinsic' | 'balanced';

  // Structured values
  externalFactors?: ExternalCircumstance[];
  motivators?: Motivator[];
  learningPreferences?: LearningPreference[];

  // Free-form
  keyStatements?: string[];
  specificFutureCourses?: string[];
}

export type SentimentLevel =
  | 'very_positive'
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'very_negative';

// ============================================================================
// AGGREGATED QUALITATIVE INSIGHTS
// ============================================================================

/**
 * All qualitative insights gathered through conversation.
 */
export interface QualitativeInsights {
  /** Course-level annotations (keyed by course identifier) */
  courseAnnotations: Map<string, CourseAnnotation>;

  /** Subject-level insights */
  subjectInsights: Map<SubjectArea, SubjectInsight>;

  /** Learning style indicators */
  learningStyleIndicators: LearningStyleIndicators | null;

  /** Motivation profile */
  motivationProfile: MotivationProfile | null;

  /** Self-awareness assessment */
  selfAwarenessAssessment: StudentSelfAwareness | null;

  /** Global circumstances affecting performance */
  globalCircumstances: GlobalCircumstance[];

  /** Full conversation history */
  conversationHistory: ConversationTurn[];

  /** All extracted insights */
  allExtractedInsights: ExtractedInsight[];

  /** Profile completeness metrics */
  completeness: ProfileCompleteness;
}

/**
 * How complete is the qualitative profile?
 */
export interface ProfileCompleteness {
  /** Overall completeness (0-100) */
  overallCompleteness: number;

  /** Completeness by subject */
  subjectCompleteness: Map<SubjectArea, number>;

  /** Topics covered */
  topicsCovered: number;
  topicsTotal: number;

  /** Courses annotated */
  coursesAnnotated: number;
  coursesTotal: number;

  /** What's missing? */
  missingAreas: string[];

  /** What should we ask about next? */
  recommendedNextTopics: string[];
}

// ============================================================================
// SYNTHESIS TYPES
// ============================================================================

/**
 * An adjustment to make based on qualitative data.
 */
export interface QualitativeAdjustment {
  type: AdjustmentType;
  target: string; // What's being adjusted
  direction: 'increase' | 'decrease' | 'flag';
  magnitude: number; // How much to adjust
  reasoning: string;
  confidence: number;
  sourceInsights: string[]; // Which insights support this
}

export type AdjustmentType =
  | 'strength_adjustment' // Adjust how strong they are in a subject
  | 'ceiling_adjustment' // Adjust their estimated ceiling
  | 'floor_adjustment' // Adjust their estimated floor
  | 'risk_adjustment' // Adjust risk tolerance recommendations
  | 'confidence_adjustment' // Adjust our confidence in predictions
  | 'recommendation_adjustment'; // Adjust course recommendations

/**
 * A synthesized insight combining quantitative and qualitative data.
 */
export interface SynthesizedInsight {
  category: 'strength' | 'challenge' | 'opportunity' | 'risk' | 'pattern' | 'mismatch';
  subject?: SubjectArea;

  /** The insight */
  insight: string;

  /** Evidence from quantitative analysis */
  quantitativeEvidence: string;

  /** Evidence from qualitative analysis */
  qualitativeEvidence: string;

  /** Do the sources agree? */
  sourcesAlign: boolean;

  /** Confidence in this insight (0-100) */
  confidence: number;

  /** How does this affect recommendations? */
  recommendationImpact: string;
}

/**
 * Subject strength adjusted for qualitative data.
 */
export interface AdjustedSubjectStrength {
  subject: SubjectArea;

  /** Original from quantitative analysis (-1 to +1) */
  originalRelativeStrength: number;

  /** Adjustments from qualitative data */
  confidenceAdjustment: number;
  effortAdjustment: number;
  interestAdjustment: number;
  circumstanceAdjustment: number;

  /** Final adjusted strength */
  adjustedRelativeStrength: number;

  /** Explanation of the adjustment */
  adjustmentReasoning: string;

  /** Confidence in the adjusted value */
  adjustmentConfidence: number;
}

// ============================================================================
// CONVERSATION STATE
// ============================================================================

/**
 * Current state of the capability conversation.
 */
export interface ConversationState {
  /** Conversation ID */
  conversationId: string;

  /** Current phase of conversation */
  phase: ConversationPhase;

  /** Topics queue (prioritized) */
  pendingTopics: ConversationTopic[];

  /** Currently active topic */
  currentTopic: ConversationTopic | null;

  /** Completed topics */
  completedTopics: ConversationTopic[];

  /** Turn count */
  turnCount: number;

  /** Last activity */
  lastActivityAt: Date;

  /** Is the conversation complete? */
  isComplete: boolean;

  /** Completion progress (0-100) */
  completionProgress: number;

  // =========================================================================
  // PERSISTENCE FIELDS (survive across turns)
  // =========================================================================

  /**
   * Track used acknowledgments to avoid repetition across turns.
   * Persisted in state so we don't repeat "That's awesome!" five times.
   */
  usedAcknowledgments?: Set<string>;

  /**
   * Track questions we've asked (normalized keys) for deduplication.
   * Prevents asking the same core question twice in different phrasings.
   */
  askedQuestionKeys?: Set<string>;

  /**
   * Personal disclosures that need to be remembered and referenced.
   * These are important moments (family issues, health, achievements) that
   * should influence later responses and show we were listening.
   */
  personalDisclosures?: PersonalDisclosure[];

  /**
   * Subjects we've already discussed in depth - prevents over-asking about same subject.
   */
  discussedSubjects?: Set<SubjectArea>;
}

/**
 * A personal disclosure made by the student that should be tracked and referenced.
 * These are significant moments that deserve acknowledgment and can inform later questions.
 */
export interface PersonalDisclosure {
  /** The actual content they shared (summarized or quoted) */
  content: string;

  /** Category of disclosure for appropriate response handling */
  type: 'family' | 'health' | 'external_challenge' | 'personal_struggle' | 'achievement';

  /** When in the conversation this was shared */
  turnNumber: number;

  /** Have we acknowledged this disclosure yet? */
  acknowledged: boolean;

  /** Optional: subject area this relates to (if applicable) */
  relatedSubject?: SubjectArea;

  /** Optional: deeper context extracted from their statement */
  context?: string;

  /** How significant is this disclosure? Affects referencing priority */
  significance: 'high' | 'medium' | 'low';
}

export type ConversationPhase =
  | 'introduction' // Initial greeting, explaining the process
  | 'discovery' // First pass through their history
  | 'deep_dive' // Exploring specific topics in depth
  | 'cross_reference' // Connecting patterns across subjects
  | 'synthesis' // Summarizing what we've learned
  | 'completion'; // Wrapping up

// ============================================================================
// CONVERSATION ENGINE TYPES
// ============================================================================

/**
 * The opening of a conversation.
 */
export interface ConversationOpener {
  message: string;
  suggestedTopics: string[];
  initialTopicQueue: ConversationTopic[];
}

/**
 * A response from the conversation engine.
 */
export interface ConversationResponse {
  /** The message to show the user */
  message: string;

  /** Type of response */
  type: ResponseType;

  /** Insights extracted from their previous message */
  extractedInsights: ExtractedInsight[];

  /** Profile updates to apply */
  profileUpdates: QualitativeAdjustment[];

  /** Next topic to explore (if any) */
  nextTopic?: ConversationTopic;

  /** Should the conversation continue? */
  shouldContinue: boolean;

  /** How complete is the profile now? */
  completionProgress: number;

  /** Suggested quick responses for the user */
  suggestedResponses?: string[];
}

export type ResponseType =
  | 'acknowledgment' // Acknowledging what they said
  | 'follow_up' // Asking a follow-up question
  | 'transition' // Moving to a new topic
  | 'clarification' // Asking for clarification
  | 'summary' // Summarizing what we've learned
  | 'encouragement' // Encouraging them to share more
  | 'completion'; // Wrapping up the conversation

// ============================================================================
// ENGAGEMENT AND CONVERSATION DYNAMICS
// ============================================================================

/**
 * Assessment of student engagement in the conversation.
 * Used to dynamically adapt conversation flow.
 */
export interface EngagementAssessment {
  /** Overall engagement level (0-100) */
  level: number;

  /** Type of engagement */
  type: EngagementType;

  /** Specific indicators detected */
  indicators: EngagementIndicator[];

  /** Recommended response strategy */
  recommendedStrategy: ResponseStrategy;

  /** Is the student confused or stuck? */
  isConfused: boolean;

  /** Does the student want to change topic? */
  wantsTopicChange: boolean;

  /** Is the student sharing deeply or superficially? */
  depthLevel: 'surface' | 'moderate' | 'deep';

  /** Emotional tone detected */
  emotionalTone: EmotionalTone;

  /** Confidence in this assessment (0-100) */
  confidence: number;
}

export type EngagementType =
  | 'highly_engaged' // Sharing detailed, thoughtful responses
  | 'engaged' // Participating well
  | 'neutral' // Going through the motions
  | 'disengaged' // Minimal effort responses
  | 'resistant' // Actively avoiding engagement
  | 'overwhelmed' // Showing signs of being overwhelmed
  | 'confused'; // Doesn't understand what's being asked

export interface EngagementIndicator {
  type: EngagementIndicatorType;
  strength: 'weak' | 'moderate' | 'strong';
  evidence: string;
}

export type EngagementIndicatorType =
  | 'response_length' // Short vs detailed responses
  | 'response_specificity' // Vague vs specific details
  | 'emotional_expression' // Flat vs emotionally rich
  | 'question_asking' // Student asking questions back
  | 'topic_elaboration' // Going beyond what was asked
  | 'self_reflection' // Shows thoughtful self-reflection
  | 'deflection' // Avoiding the question
  | 'one_word_answers' // Minimal engagement
  | 'confusion_signals' // "I don't know", "what do you mean"
  | 'enthusiasm_signals' // Exclamation, positive language
  | 'resistance_signals' // "I don't want to talk about", "that's private"
  | 'fatigue_signals'; // Getting shorter over time, "let's move on"

export type ResponseStrategy =
  | 'continue_normally' // Proceed with planned flow
  | 'probe_deeper' // Ask more detailed follow-up
  | 'rephrase_question' // Try asking differently
  | 'share_observation' // Share what we notice to prompt reflection
  | 'validate_and_encourage' // Acknowledge and encourage more sharing
  | 'offer_examples' // Give examples to help them understand
  | 'change_topic' // Move to a different topic
  | 'take_a_break' // Acknowledge fatigue, offer lighter question
  | 'summarize_progress' // Show what we've learned, validate participation
  | 'direct_question' // Be more direct about what we need
  | 'open_ended_invite' // Give them space to share what they want
  | 'offer_topic_choices'; // NEW: Give student agency to choose direction (for potential disengagement)

export type EmotionalTone =
  | 'positive' // Enthusiastic, happy, proud
  | 'neutral' // No strong emotion
  | 'negative' // Frustrated, upset, anxious
  | 'mixed' // Mixed emotions
  | 'guarded'; // Holding back emotionally

/**
 * Conversation progress tracking with granular state.
 */
export interface ConversationProgress {
  /** Overall progress (0-100) */
  overallProgress: number;

  /** Progress by category */
  categoryProgress: Map<ProgressCategory, CategoryProgress>;

  /** Information quality assessment */
  informationQuality: InformationQualityMetrics;

  /** Key gaps in our understanding */
  knowledgeGaps: KnowledgeGap[];

  /** What we've learned so far (summary) */
  currentUnderstanding: string[];

  /** Next priorities for the conversation */
  nextPriorities: ConversationPriority[];

  /** Estimated turns remaining */
  estimatedTurnsRemaining: number;

  /** Adaptive pacing status */
  pacingStatus: PacingStatus;
}

export type ProgressCategory =
  | 'effort_understanding' // Do we understand their effort patterns?
  | 'interest_mapping' // Do we understand their interests?
  | 'challenge_identification' // Do we understand their challenges?
  | 'circumstance_context' // Do we understand external factors?
  | 'self_awareness_calibration' // Do we understand their self-perception?
  | 'future_intentions' // Do we understand their goals?
  | 'learning_style'; // Do we understand how they learn?

export interface CategoryProgress {
  category: ProgressCategory;
  progress: number; // 0-100
  subjectsCovered: SubjectArea[];
  keyInsightsGained: string[];
  gapsRemaining: string[];
  confidenceLevel: number;
}

export interface InformationQualityMetrics {
  /** How specific are the insights we've gathered? */
  specificityScore: number;

  /** How consistent is the student's narrative? */
  consistencyScore: number;

  /** How much corroboration across topics? */
  corroborationScore: number;

  /** How confident are we in what we've learned? */
  overallConfidence: number;

  /** Areas where information seems unreliable */
  unreliableAreas: string[];
}

export interface KnowledgeGap {
  area: string;
  importance: 'critical' | 'important' | 'nice_to_have';
  suggestedApproach: string;
  relatedTopics: string[];
}

export interface ConversationPriority {
  topic: string;
  reason: string;
  urgency: 'high' | 'medium' | 'low';
  approach: string;
}

export type PacingStatus =
  | 'on_track' // Progressing well
  | 'ahead' // Getting lots of info quickly
  | 'behind' // Not getting enough info
  | 'stalled' // Stuck on a topic
  | 'wrapping_up'; // Near completion

/**
 * Dynamic conversation flow control.
 */
export interface ConversationFlowState {
  /** Current engagement assessment */
  engagement: EngagementAssessment;

  /** Progress tracking */
  progress: ConversationProgress;

  /** Recent pattern of engagement (last 5 turns) */
  engagementTrend: 'improving' | 'stable' | 'declining';

  /** Consecutive low-engagement turns */
  lowEngagementStreak: number;

  /** Topics that got good engagement */
  highEngagementTopics: string[];

  /** Topics that got poor engagement */
  lowEngagementTopics: string[];

  /** Adaptive strategies that have worked */
  successfulStrategies: ResponseStrategy[];

  /** Should we change our approach? */
  needsAdaptation: boolean;

  /** Recommended adaptation */
  adaptationRecommendation?: AdaptationRecommendation;
}

export interface AdaptationRecommendation {
  type: AdaptationType;
  reason: string;
  specificAction: string;
  expectedOutcome: string;
}

export type AdaptationType =
  | 'change_topic_type' // Switch from grades to interests, etc.
  | 'change_question_style' // More open/closed questions
  | 'change_depth' // Deeper or more surface-level
  | 'change_pace' // Faster or slower
  | 'provide_break' // Offer a mental break
  | 'validate_progress' // Show appreciation for sharing
  | 'reframe_conversation'; // Reframe what we're trying to do

/**
 * Enhanced conversation state with flow tracking.
 */
export interface EnhancedConversationState extends ConversationState {
  /** Dynamic flow state */
  flowState: ConversationFlowState;

  /** Engagement history (last N assessments) */
  engagementHistory: EngagementAssessment[];

  /** Successful rephrasing attempts for reference */
  rephraseSuccesses: Array<{
    originalQuestion: string;
    rephrasedQuestion: string;
    engagementImprovement: number;
  }>;

  /** Topics the student seems to enjoy discussing */
  preferredTopicTypes: TopicType[];

  /** Response style preferences detected */
  studentPreferences: StudentConversationPreferences;
}

export interface StudentConversationPreferences {
  /** Prefers specific or open-ended questions */
  questionStyle: 'specific' | 'open_ended' | 'mixed';

  /** Prefers short or longer exchanges per topic */
  exchangeLength: 'brief' | 'moderate' | 'extended';

  /** Comfort with personal/emotional topics */
  emotionalComfort: 'comfortable' | 'neutral' | 'guarded';

  /** Likes examples or prefers direct questions */
  examplePreference: 'likes_examples' | 'prefers_direct';

  /** How much validation/acknowledgment they need */
  validationNeed: 'high' | 'moderate' | 'low';
}
