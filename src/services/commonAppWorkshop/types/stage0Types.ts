/**
 * Stage 0: Voice Excavation Types
 *
 * These types support the Voice Excavation system that transforms
 * bland, "essay mode" drafts into compelling narratives with authentic spark.
 *
 * Key Insight: "Spark" is not one thing. It's authentic presence on the page
 * that manifests differently based on the emotional register of the essay.
 *
 * The 6 Emotional Registers:
 * 1. ENERGETIC ENTHUSIASM - Intellectual vitality, passion essays
 * 2. QUIET INTENSITY - Identity, cultural, introspective essays
 * 3. MELANCHOLY/LOSS - Challenge, grief, failure essays
 * 4. DEFIANT/IRREVERENT - Against-the-grain, unconventional essays
 * 5. WONDER/CURIOSITY - Discovery, research, intellectual journey essays
 * 6. WARMTH/CONNECTION - Relationship, community, influence essays
 */

// ============================================================================
// EMOTIONAL REGISTER TYPES
// ============================================================================

/**
 * The 6 emotional registers that determine spark strategy
 */
export type EmotionalRegister =
  | 'energetic_enthusiasm'   // Intellectual vitality, passion, "why this major"
  | 'quiet_intensity'        // Identity, cultural, introspective
  | 'melancholy_loss'        // Challenges, grief, failure
  | 'defiant_irreverent'     // Against-the-grain, unconventional
  | 'wonder_curiosity'       // Discovery, research, intellectual journeys
  | 'warmth_connection';     // Relationships, community, influence

/**
 * Human-readable names for registers
 */
export const REGISTER_NAMES: Record<EmotionalRegister, string> = {
  energetic_enthusiasm: 'Energetic Enthusiasm',
  quiet_intensity: 'Quiet Intensity',
  melancholy_loss: 'Melancholy/Loss',
  defiant_irreverent: 'Defiant/Irreverent',
  wonder_curiosity: 'Wonder/Curiosity',
  warmth_connection: 'Warmth/Connection',
};

/**
 * Register detection result
 */
export interface RegisterDetection {
  primary: EmotionalRegister;
  secondary?: EmotionalRegister;
  confidence: number;                    // 0-100
  reasoning: string;
  avoid?: EmotionalRegister[];           // Registers that would be mismatched
}

/**
 * Register-specific voice characteristics
 */
export interface RegisterVoiceProfile {
  register: EmotionalRegister;

  // Voice qualities to capture
  voiceQualities: string[];

  // Structural choices that match this register
  structuralChoices: string[];

  // Example rhythms (sentence patterns)
  exampleRhythms: string[];

  // Green flags for this register
  greenFlags: string[];

  // Red flags for this register
  redFlags: string[];
}

// ============================================================================
// STAGE 0 INPUT TYPES
// ============================================================================

/**
 * All inputs for voice excavation
 */
export interface VoiceExcavationInput {
  rawDraft: string;                      // Whatever student has written
  voiceSample?: string;                  // Casual "text to friend" sample
  interviewResponses?: InterviewResponse[]; // Answers to excavation questions
  essayPrompt: string;                   // The essay prompt
  collegeId: string;                     // Target college
}

/**
 * A student's response to an excavation question
 */
export interface InterviewResponse {
  questionId: string;
  question: string;
  response: string;
  voiceMarkers: string[];               // Phrases that sound authentic
  emotionalEnergy: 'high' | 'medium' | 'low';  // How engaged they seem
}

// ============================================================================
// SPARK GAP ANALYSIS TYPES
// ============================================================================

/**
 * Spark level classification
 */
export type SparkLevel =
  | 'full_essay_mode'     // 0-30: Entirely performed voice
  | 'mostly_essay'        // 31-50: Some buried authentic moments
  | 'mixed'               // 51-70: Authentic sections mixed with essay mode
  | 'mostly_authentic'    // 71-85: Voice is there, needs slight tuning
  | 'authentic';          // 86-100: Genuine spark throughout

/**
 * Essay mode indicator (something that sounds like "college essay")
 */
export interface EssayModeIndicator {
  indicator: string;
  quote: string;
  location: string;
  severity: 'minor' | 'moderate' | 'severe';
  howToFix: string;
}

/**
 * Missing element that creates spark
 */
export interface MissingSparkElement {
  element: 'specificity' | 'stakes' | 'surprise' | 'embodiment' | 'voice_consistency';
  description: string;
  howToExcavate: string;
}

/**
 * A buried authentic moment found in the draft
 */
export interface BuriedSpark {
  quote: string;
  location: string;
  whyAuthentic: string;
  register: EmotionalRegister;         // What register this moment belongs to
  amplificationPotential: 'high' | 'medium' | 'low';
}

/**
 * Section-by-section analysis
 */
export interface SectionAnalysis {
  text: string;
  verdict: 'authentic' | 'essay_mode' | 'mixed';
  registerMatch: boolean;
  explanation: string;
}

/**
 * Register-specific issues found in the draft
 */
export interface RegisterIssues {
  register: EmotionalRegister;
  missingQualities: string[];          // What this register needs that's missing
  wrongTone: string[];                 // Elements that don't match this register
  recommendations: string[];
}

/**
 * Complete spark gap analysis result
 */
export interface SparkGapAnalysis {
  // Overall spark assessment
  sparkScore: number;                   // 0-100
  sparkLevel: SparkLevel;

  // Register detection
  detectedRegister: RegisterDetection;
  registerFit: number;                   // 1-10: how well current voice matches needed register

  // Universal issues (apply to all registers)
  universalIssues: {
    essayModeIndicators: EssayModeIndicator[];
    missingElements: MissingSparkElement[];
  };

  // Register-specific issues
  registerIssues: RegisterIssues;

  // Buried authentic moments found
  buriedSpark: BuriedSpark[];

  // Section-by-section breakdown
  sectionAnalysis: SectionAnalysis[];

  // Recommendations
  recommendation: 'skip_to_stage_1' | 'light_excavation' | 'full_excavation';
  recommendedQuestions: ExcavationQuestion[];
}

// ============================================================================
// EXCAVATION QUESTION TYPES
// ============================================================================

/**
 * Purpose of an excavation question
 */
export type ExcavationPurpose =
  | 'recover_voice'        // Get them out of essay mode
  | 'find_specifics'       // Get concrete moments
  | 'uncover_stakes'       // Find what's at risk
  | 'amplify_spark'        // Expand on authentic moment
  | 'find_quirks'          // Surface unique voice patterns
  | 'access_emotion';      // Access genuine feeling

/**
 * An excavation question designed to surface authentic voice
 */
export interface ExcavationQuestion {
  id: string;
  question: string;
  purpose: ExcavationPurpose;
  targetRegister: EmotionalRegister;
  targetedAt?: string;                  // What buried spark or issue this targets
  potential: 'high' | 'medium' | 'low'; // How likely to produce authentic material
}

// ============================================================================
// VOICE-FIRST DRAFT TYPES
// ============================================================================

/**
 * Source of an authentic phrase
 */
export type VoiceSource =
  | 'voice_sample'     // From their casual "text to friend"
  | 'interview'        // From excavation interview responses
  | 'buried_spark'     // From authentic moment in original draft
  | 'generated';       // Generated but matching their voice patterns

/**
 * An authentic phrase and its source
 */
export interface VoiceSourceMarker {
  phrase: string;
  location: string;
  source: VoiceSource;
  preservedExactly: boolean;           // Did we use their exact words?
}

/**
 * A register marker showing authentic voice for this register
 */
export interface RegisterMarker {
  marker: string;
  location: string;
  whyItWorks: string;
}

/**
 * A deliberate imperfection preserved for authenticity
 */
export interface PreservedImperfection {
  text: string;
  whyKept: string;
  wouldNormallyFix: string;            // What "essay mode" would do
}

/**
 * A risky choice made for authenticity
 */
export interface RiskyChoice {
  choice: string;
  location: string;
  risk: string;                        // What makes this risky
  whyWorthIt: string;                  // Why authenticity wins
}

/**
 * Quality metrics for a voice-first draft
 */
export interface VoiceFirstDraftMetrics {
  sparkScore: number;                  // Should be 70+ now
  registerFit: number;                 // Should be 7+ now
  authenticPhraseCount: number;
  specificMomentCount: number;
  sensoryDetailCount: number;
}

/**
 * A draft generated prioritizing voice over structure
 */
export interface VoiceFirstDraft {
  draft: string;
  wordCount: number;

  // Which register this draft is written in
  register: EmotionalRegister;

  // Voice sources - where authenticity came from
  voiceSources: VoiceSourceMarker[];

  // Register markers - what makes this feel like the right register
  registerMarkers: RegisterMarker[];

  // Deliberate imperfections preserved
  preservedImperfections: PreservedImperfection[];

  // Risky choices made
  riskyChoices: RiskyChoice[];

  // Quality metrics
  metrics: VoiceFirstDraftMetrics;

  // Ready for Stage 1
  stage1Ready: boolean;
}

// ============================================================================
// STAGE 0 OUTPUT TYPES
// ============================================================================

/**
 * Voice context for handoff to Stage 1
 */
export interface VoiceContext {
  authenticPhrases: string[];        // Must preserve these exactly
  voiceQuirks: string[];             // Unique patterns to maintain
  registerMarkers: string[];         // What makes this feel right
  topicsWithEnergy: string[];        // Where their voice is strongest
  topicsToAvoid: string[];           // Where they go flat
}

/**
 * Handoff data from Stage 0 to Stage 1
 */
export interface Stage1Handoff {
  draft: string;
  register: EmotionalRegister;
  voiceContext: VoiceContext;
  preservationWarnings: string[];      // What Stage 1-3 must NOT polish away
}

/**
 * Excavation process data
 */
export interface ExcavationData {
  questionsAsked: ExcavationQuestion[];
  responsesReceived: InterviewResponse[];
  voicePatternsIdentified: string[];
  registerClarity: number;             // Did excavation clarify the register? (1-10)
}

/**
 * Cost tracking for Stage 0
 */
export interface Stage0CostTracking {
  analysisTokens: { input: number; output: number };
  excavationTokens?: { input: number; output: number };
  draftGenerationTokens: { input: number; output: number };
  totalCost: number;
}

/**
 * Complete Stage 0 output
 */
export interface Stage0Output {
  // The analysis
  analysis: SparkGapAnalysis;

  // The excavation (if performed)
  excavation?: ExcavationData;

  // The voice-first draft
  voiceFirstDraft: VoiceFirstDraft;

  // Handoff to Stage 1
  stage1Handoff: Stage1Handoff;

  // Cost tracking
  costTracking: Stage0CostTracking;
}

// ============================================================================
// PROMPT-TO-REGISTER MAPPING
// ============================================================================

/**
 * Maps essay prompt types to recommended registers
 */
export interface PromptRegisterMapping {
  promptPattern: RegExp;                 // Pattern to match
  primaryRegister: EmotionalRegister | null;  // null = match student's natural voice
  secondaryRegister?: EmotionalRegister;
  avoidRegisters?: EmotionalRegister[];
  notes: string;
}

/**
 * Default mappings from prompt types to registers
 */
export const PROMPT_REGISTER_MAPPINGS: PromptRegisterMapping[] = [
  {
    promptPattern: /intellectual vitality|curiosity|passion|excited about learning/i,
    primaryRegister: 'energetic_enthusiasm',
    secondaryRegister: 'wonder_curiosity',
    avoidRegisters: ['melancholy_loss'],
    notes: 'Stanford IV, MIT passion essays'
  },
  {
    promptPattern: /why this major|area of study|academic interest/i,
    primaryRegister: 'energetic_enthusiasm',
    secondaryRegister: 'wonder_curiosity',
    notes: 'Major-specific essays, CMU, etc.'
  },
  {
    promptPattern: /challenge|obstacle|failure|difficult|setback/i,
    primaryRegister: 'melancholy_loss',
    secondaryRegister: 'defiant_irreverent',
    avoidRegisters: ['energetic_enthusiasm'],
    notes: 'Common App #2, failure essays'
  },
  {
    promptPattern: /identity|background|who you are|shaped you/i,
    primaryRegister: 'quiet_intensity',
    secondaryRegister: 'warmth_connection',
    notes: 'Common App #1, identity prompts'
  },
  {
    promptPattern: /person|influenced|mentor|community|belong/i,
    primaryRegister: 'warmth_connection',
    secondaryRegister: 'quiet_intensity',
    notes: 'Relationship and community essays'
  },
  {
    promptPattern: /belief|question|challenge.*(idea|belief)/i,
    primaryRegister: 'defiant_irreverent',
    secondaryRegister: 'wonder_curiosity',
    notes: 'Common App #3, belief challenge essays'
  },
  {
    promptPattern: /research|discovery|problem|solve|investigate/i,
    primaryRegister: 'wonder_curiosity',
    secondaryRegister: 'energetic_enthusiasm',
    notes: 'Research essays, MIT, Caltech'
  },
  {
    promptPattern: /why.*school|why.*college|why.*university|fit/i,
    primaryRegister: 'wonder_curiosity',
    secondaryRegister: 'energetic_enthusiasm',
    avoidRegisters: ['melancholy_loss'],
    notes: 'Why School essays'
  },
  {
    promptPattern: /diversity|perspective|contribution|unique/i,
    primaryRegister: 'quiet_intensity',
    secondaryRegister: 'defiant_irreverent',
    notes: 'Diversity and perspective essays'
  },
  {
    promptPattern: /creative|quirky|unconventional|surprise/i,
    primaryRegister: null,          // Match the student's natural voice
    notes: 'UChicago, open-ended creative prompts'
  }
];

// ============================================================================
// REGISTER VOICE PROFILES
// ============================================================================

/**
 * Complete voice profiles for each register
 */
export const REGISTER_PROFILES: Record<EmotionalRegister, RegisterVoiceProfile> = {
  energetic_enthusiasm: {
    register: 'energetic_enthusiasm',
    voiceQualities: [
      'Fast rhythm, sentences that run into each other',
      'Incomplete thoughts, tangents, parenthetical asides',
      'Genuine wonder without ironic distance',
      'Embarrassing levels of excitement',
      'The feeling of someone who can\'t contain themselves'
    ],
    structuralChoices: [
      'Start in the middle of action or thought',
      'Let one idea tumble into the next',
      'Include at least one "I know this is weird but..."',
      'End with energy, not reflection'
    ],
    exampleRhythms: [
      '"And then—okay this is the part where it gets actually insane—I realized the whole thing was upside down."',
      '"I have 47 tabs open about medieval siege weapons and honestly? I don\'t know how I got here."'
    ],
    greenFlags: [
      'Naive wonder', 'Run-on energy', 'Embarrassing excitement', 'Absurd specificity'
    ],
    redFlags: [
      'Forced enthusiasm', 'Claiming passion without evidence', 'Too polished'
    ]
  },

  quiet_intensity: {
    register: 'quiet_intensity',
    voiceQualities: [
      'Precision over speed',
      'Weight in small observations',
      'Breath between thoughts (use paragraph breaks)',
      'Understatement that makes moments larger',
      'The feeling of someone choosing each word carefully'
    ],
    structuralChoices: [
      'Shorter paragraphs, more white space',
      'One image that carries symbolic weight',
      'Restraint—leave things unsaid',
      'End with a question or incompleteness'
    ],
    exampleRhythms: [
      '"My grandmother\'s hands. Flour under the nails, always. Even at the hospital."',
      '"Some things you don\'t talk about. This is one of them. But."'
    ],
    greenFlags: [
      'Precise observations', 'Meaningful white space', 'Restraint', 'Symbolic details'
    ],
    redFlags: [
      'Over-explaining', 'Too many words', 'Missing the weight of silence'
    ]
  },

  melancholy_loss: {
    register: 'melancholy_loss',
    voiceQualities: [
      'Haunting specificity (the small detail that breaks your heart)',
      'Dry humor as defense mechanism',
      'Present tense for memories (makes them alive)',
      'Emotional restraint—breaks hit harder',
      'The feeling of carrying something heavy'
    ],
    structuralChoices: [
      'Unexpected pivot from grief to something mundane',
      'Focus on the moment BEFORE the loss',
      'Include what you still carry (object, phrase, habit)',
      'DO NOT resolve. Grief doesn\'t tie up neatly.'
    ],
    exampleRhythms: [
      '"The last thing he said was \'don\'t forget the milk.\' I think about this every time I open the refrigerator."',
      '"She would have hated this essay. She hated everything I wrote. I\'m writing it anyway."'
    ],
    greenFlags: [
      'Haunting specificity', 'Dry humor', 'Unresolved grief', 'Small carrying objects'
    ],
    redFlags: [
      'Melodrama', 'Forced silver lining', '"I learned from this" resolution'
    ]
  },

  defiant_irreverent: {
    register: 'defiant_irreverent',
    voiceQualities: [
      'Blunt, direct address',
      'Short sentences that land like punches',
      'Comfortable with discomfort',
      'Edge without performing edge',
      'The feeling of someone who won\'t back down'
    ],
    structuralChoices: [
      'Start with a challenge or uncomfortable truth',
      'Use "you" address when appropriate',
      'Don\'t soften at the end—double down',
      'Let some anger or frustration show'
    ],
    exampleRhythms: [
      '"Everyone said I\'d regret it. They were wrong. I\'d do it again."',
      '"Everyone says I should be grateful. I\'m not."'
    ],
    greenFlags: [
      'Direct challenge', 'Uncomfortable truths', 'Edge', 'Doubling down'
    ],
    redFlags: [
      'Trying too hard to be edgy', 'Softening at the end', 'Fake rebellion'
    ]
  },

  wonder_curiosity: {
    register: 'wonder_curiosity',
    voiceQualities: [
      'Questions that lead to more questions',
      'Visible thinking process (not just conclusions)',
      'Comfortable admitting confusion',
      'Tangents that reveal how the mind works',
      'The feeling of someone genuinely puzzled'
    ],
    structuralChoices: [
      'Show the mess of thinking, not just the answer',
      'Include at least one "I still don\'t understand..."',
      'Let curiosity pull the narrative forward',
      'End with an open question, not a resolution'
    ],
    exampleRhythms: [
      '"The question that ruined my sleep for three weeks: Why do we have two nostrils?"',
      '"Here\'s what doesn\'t make sense to me. If the cells regenerate every seven years, then technically I\'m not the same person who started this project. So who\'s finishing it?"'
    ],
    greenFlags: [
      'Questions leading to questions', 'Visible thinking', 'Admitted confusion'
    ],
    redFlags: [
      'Just reporting conclusions', 'No mess', 'Too certain'
    ]
  },

  warmth_connection: {
    register: 'warmth_connection',
    voiceQualities: [
      'Specific dialogue in their actual voice',
      'Physical details of the person (hands, laugh, stance)',
      'Private moments and inside references',
      'Love shown through specificity, not declaration',
      'The feeling of intimacy with the reader'
    ],
    structuralChoices: [
      'Ground in specific scenes with this person',
      'Include at least one thing they actually said',
      'Show a small ritual or repeated moment',
      'End with presence, not lesson'
    ],
    exampleRhythms: [
      '"\'You\'re doing it wrong.\' She said this about everything—the dishes, the folding, my whole approach to problems. Now I catch myself saying it too."',
      '"\'You\'re holding it wrong.\' My grandmother said this about everything - the broom, the knife, my entire life."'
    ],
    greenFlags: [
      'Specific dialogue', 'Physical details of person', 'Rituals', 'Inside references'
    ],
    redFlags: [
      'Declaring love instead of showing it', 'Generic relationship description'
    ]
  }
};

// ============================================================================
// REGISTER-SPECIFIC QUESTION BANKS
// ============================================================================

/**
 * Pre-written excavation questions for each register
 */
export const REGISTER_QUESTION_BANKS: Record<EmotionalRegister, string[]> = {
  energetic_enthusiasm: [
    "What's the most embarrassing thing about how much you care about this?",
    "If you had to explain this to someone who thinks it's stupid, what would you say?",
    "What's the weirdest rabbit hole you've gone down related to this?",
    "Tell me about a time you got SO excited about this that you annoyed someone.",
    "What would your best friend say about your obsession with this?",
    "Finish this: 'I know it's nerdy but...'",
    "What's something about this that makes you laugh?",
    "What did you cut from your draft because it felt TOO enthusiastic?"
  ],

  quiet_intensity: [
    "If you could only show me one image that captures this, what would I see?",
    "What's the smallest detail that carries the most weight for you?",
    "What do you notice that other people miss?",
    "Describe a moment of complete stillness related to this.",
    "What's something you've never said out loud about this?",
    "What would be lost if you tried to explain this to someone who doesn't get it?",
    "What's a texture, smell, or sound connected to this?",
    "What do you keep coming back to, even when you try to move on?"
  ],

  melancholy_loss: [
    "What's a small, random detail you can't stop remembering?",
    "What's something mundane that now reminds you of this?",
    "What would you want to say to someone who says 'it's for the best'?",
    "What's something funny or absurd about this situation? (Grief is weird.)",
    "What's something you still haven't figured out how to feel?",
    "What's something you still carry with you—a phrase, an object, a habit?",
    "What's the thing people always say that doesn't help at all?",
    "What happened right BEFORE the hard part? What were you thinking about?"
  ],

  defiant_irreverent: [
    "What's the thing everyone assumes about you that's wrong?",
    "What's something you refuse to apologize for?",
    "What's the most uncomfortable truth you've realized?",
    "What would you say if you knew no one would judge you?",
    "What's the part of this that makes people uncomfortable?",
    "Who told you to be different and how did you respond?",
    "What's the thing you're NOT going to change, no matter what?",
    "What's the honest version of this that you thought you couldn't write?"
  ],

  wonder_curiosity: [
    "What's a question that keeps you up at night?",
    "Walk me through how your brain works when you're figuring something out.",
    "What's something that seemed simple until you looked closer?",
    "What's a tangent you went down that seemed unrelated but actually mattered?",
    "What's something you still don't understand and it bothers you?",
    "What's the messiest part of how you think about this?",
    "When did you first realize this was more complicated than you thought?",
    "What question would you ask if you could ask anyone anything about this?"
  ],

  warmth_connection: [
    "Tell me exactly what they would say about this—their actual words, in their voice.",
    "What's a weird little ritual or habit between you?",
    "What's something they do that used to annoy you but now you'd miss?",
    "What's an inside joke or private reference only you would understand?",
    "Describe their hands, or their laugh, or how they stand.",
    "What's something they taught you that they didn't mean to teach you?",
    "What's a small moment that was actually a big moment?",
    "What would they say if they read your essay?"
  ]
};

// ============================================================================
// MULTI-STAGE PIPELINE TYPES (NEW)
// ============================================================================

/**
 * Stage 0B: Core Story & Candidate Identification
 * Identifies WHAT story we're telling and WHY the writer should be admitted
 */
export interface CoreStoryIdentification {
  // The emotional core in one sentence
  oneSentenceStory: string;

  // What makes this candidate compelling
  candidateAppeal: {
    uniqueValue: string;           // What makes them special
    campusContribution: string;    // What they'd bring
    mustHaveFactor: string;        // The "I want this student" quality
  };

  // Specific traits to showcase (NOT generic like "hardworking")
  qualitiesToShowcase: string[];

  // The emotional arc for the reader
  emotionalArc: {
    readerStartsFeeling: string;   // Opening emotional state
    readerEndsFeeling: string;     // Closing emotional state
    whatChanges: string;           // The transformation
  };

  // How to keep writer as focus
  centeringStrategies: string[];
}

/**
 * A scene/moment in the essay
 */
export interface EssayScene {
  sceneNumber: number;
  purpose: string;                 // What this scene accomplishes
  writerFocus: string;             // How the writer is centered
  content: string;                 // The scene content
  wordCount: number;
  transitionFromPrevious?: string; // Natural connection from previous scene
}

/**
 * Stage 0C: Scene Construction
 * Builds the actual scenes with natural flow
 */
export interface SceneConstruction {
  scenes: EssayScene[];

  openingHook: {
    content: string;
    whyItWorks: string;
  };

  closing: {
    content: string;
    arcCompletion: string;         // How this completes the emotional arc
  };

  flowCheck: {
    overallNarrative: string;      // Does it read as one cohesive story?
    transitionQuality: string;     // Are transitions natural or forced?
    momentumMaintained: string;    // Does reader want to keep reading?
  };

  totalWordCount: number;
}

/**
 * A spark moment in the draft
 */
export interface SparkMoment {
  text: string;
  location: string;
  type: 'hook' | 'specificity' | 'personality' | 'closing';
  source: 'interview' | 'buried_spark' | 'generated';
  flowPreserved: boolean;          // Does it fit naturally?
}

/**
 * A vocabulary choice that balances smart and readable
 */
export interface VocabularyChoice {
  phrase: string;
  avoided: string;                 // Overwrought alternative we didn't use
  why: string;                     // Why this works better
}

/**
 * Stage 0D: Voice Integration
 * Layers authentic voice onto the scene structure
 */
export interface VoiceIntegrationResult {
  draft: string;
  wordCount: number;

  sparkMoments: SparkMoment[];
  vocabularyChoices: VocabularyChoice[];

  flowCheck: {
    transitionsIntact: boolean;
    readsAsOneVoice: boolean;
    momentumMaintained: boolean;
  };
}

/**
 * Quality issue found during verification
 */
export interface QualityIssue {
  category: 'candidateCentering' | 'narrativeFlow' | 'vocabularyAppropriateness' | 'sparkQuality' | 'overallReadability';
  problem: string;
  location: string;
  suggestedFix: string;
}

/**
 * Stage 0E: Quality Verification (Haiku - fast & cheap)
 * Quick check for critical issues before handoff
 */
export interface QualityVerification {
  scores: {
    candidateCentering: number;    // 1-5: Is writer clearly the focus?
    narrativeFlow: number;         // 1-5: Does essay flow naturally?
    vocabularyAppropriateness: number; // 1-5: Smart but readable?
    sparkQuality: number;          // 1-5: Authentic moments effective?
    overallReadability: number;    // 1-5: Would you want to keep reading?
  };
  overallScore: number;            // Average of all scores
  passesQuality: boolean;          // True if all scores >= 4
  issues: QualityIssue[];
  revisionNeeded: boolean;
}

/**
 * Multi-stage pipeline cache
 */
export interface Stage0PipelineCache {
  // Per-essay (cleared between essays)
  sparkGapAnalysis?: SparkGapAnalysis;
  coreStory?: CoreStoryIdentification;
  sceneStructure?: SceneConstruction;
  voiceIntegratedDraft?: VoiceIntegrationResult;
  qualityVerification?: QualityVerification;

  // Timestamps for cache invalidation
  lastUpdated: Date;
}

/**
 * Extended cost tracking for multi-stage pipeline
 */
export interface Stage0MultiStageCostTracking extends Stage0CostTracking {
  coreStoryTokens?: { input: number; output: number };
  sceneConstructionTokens?: { input: number; output: number };
  voiceIntegrationTokens?: { input: number; output: number };
  qualityVerificationTokens?: { input: number; output: number };
  revisionTokens?: { input: number; output: number };
}

/**
 * Extended Stage 0 output for multi-stage pipeline
 */
export interface Stage0MultiStageOutput extends Stage0Output {
  // Additional multi-stage data
  coreStory: CoreStoryIdentification;
  sceneStructure: SceneConstruction;
  voiceIntegration: VoiceIntegrationResult;
  qualityVerification: QualityVerification;

  // Extended cost tracking
  costTracking: Stage0MultiStageCostTracking;

  // Pipeline metadata
  pipelinePath: 'full' | 'fast' | 'minimal';  // Which path was taken
  stagesRun: string[];                        // Which stages were executed
}

// ============================================================================
// HAIKU DIAGNOSIS SERVICE TYPES (New - Cost-Optimized Analysis)
// ============================================================================

/**
 * Initial Analysis - Fast triage before deep dive
 * Cost: ~$0.002 (Haiku)
 */
export interface InitialAnalysis {
  overall_impression: string;
  spark_score: number;                      // 0-100
  voice_consistency: number;                // 1-10
  structure_type: 'chronological' | 'thematic' | 'moment-focused' | 'montage' | 'unclear';
  key_moments: Array<{
    type: 'opening' | 'turning_point' | 'reflection' | 'conclusion';
    quote: string;
    effectiveness: number;                  // 1-10
    analysis: string;
  }>;
  initial_red_flags: string[];
  estimated_strength: 'exceptional' | 'strong' | 'developing' | 'weak';
}

/**
 * Citation Mapping - Pre-selected evidence for surgical teaching
 * Cost: ~$0.001 (Haiku with caching)
 */
export interface CitationMapping {
  relevant_core_values: Array<{
    value: any;                             // CollegeCoreValue
    relevance_score: number;                // 0-10
    applicable_sections: string[];          // Essay quotes
    evidence_strength: number;              // 1-10
  }>;
  relevant_red_flags: Array<{
    red_flag: any;                          // CollegeRedFlag
    detected_in: string[];                  // Essay quotes
    severity: 'critical' | 'moderate' | 'minor';
  }>;
  relevant_green_flags: Array<{
    green_flag: any;                        // CollegeGreenFlag
    present_in: string[];                   // Essay quotes
    strength: number;                       // 1-10
  }>;
  targeted_quotes: Array<{
    quote: any;                             // CollegeKeyQuote
    relevance_score: number;                // 0-10
    applicable_to: string[];                // Essay sections
    teaching_opportunity: string;
  }>;
}

/**
 * Voice Fingerprint - Baseline for preservation across stages
 * Cost: ~$0.002 (Haiku)
 */
export interface VoiceFingerprint {
  dominant_register: EmotionalRegister;
  voice_qualities: string[];                // ["earnest", "analytical", ...]
  sentence_rhythms: {
    average_length: number;
    variety: number;                        // 1-10
    fragment_use: 'effective' | 'moderate' | 'minimal';
    natural_feel: 'natural' | 'somewhat_stilted' | 'very_stilted';
  };
  vocabulary_level: 'sophisticated' | 'clear' | 'simple';
  authentic_phrases: string[];              // Must preserve these
  voice_weaknesses: string[];               // Where voice breaks down
  preservation_warnings: string[];          // What NOT to change
}

/**
 * Issue Symptom Diagnosis - Like PIQ's SymptomDiagnoser
 * Cost: ~$0.02 per issue (Haiku)
 */
export interface IssueSymptomDiagnosis {
  diagnosis: string;                        // One sentence
  specific_weakness: string;                // Detailed explanation
  prescription: string;                     // How to fix
  symptom_type:
    | 'abstract_language'
    | 'passive_agency'
    | 'cliche_metaphor'
    | 'telling_not_showing'
    | 'generic_pacing'
    | 'weak_verb'
    | 'missing_sensory'
    | 'forced_transition';

  // THE CRITICAL PIECE (like PIQ) - What's MISSING
  missing_elements: {
    sensory_details?: string[];             // "blinking cursor", "red error text"
    concrete_objects?: string[];            // "14 Lego sets", "Ninjago spacecraft"
    micro_moment?: string;                  // "The last time I touched my Legos..."
    emotional_truth?: string;               // "I'd been tracking prices for months"
  };

  voice_constraints: string[];              // From fingerprint
  college_alignment: string;                // Which value and how
}

/**
 * Quality Verification - Final checks before submission
 * Cost: ~$0.003 (Haiku)
 */
export interface QualityVerification {
  scores: {
    candidate_centering: number;            // 1-5
    narrative_flow: number;                 // 1-5
    vocabulary_appropriateness: number;     // 1-5
    spark_quality: number;                  // 1-5
    overall_readability: number;            // 1-5
  };
  overall_score: number;                    // Average of above
  passes_quality: boolean;                  // overall ≥ 4.0
  issues: Array<{
    type: 'banned_terms' | 'voice_loss' | 'word_count' | 'needs_work';
    severity: 'critical' | 'moderate' | 'minor';
    description: string;
    location: string;
  }>;
  revision_needed: boolean;
}
