/**
 * Transformation Examples Database
 *
 * Before/After examples for transforming "telling" into "showing"
 * Extracted from Perplexity Deep Research on Show Don't Tell.
 *
 * KEY CATEGORIES:
 * 1. Growth & Resilience Claims
 * 2. Passion & Interest Claims
 * 3. Character Trait Claims
 * 4. Emotion Label Transformations
 * 5. Experience Impact Claims
 * 6. Short-Form Transformations (150-300 words)
 *
 * USAGE:
 * - Teaching examples for students
 * - Pattern matching for suggestion generation
 * - Quality assessment benchmarks
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TransformationExample {
  /** Unique identifier */
  id: string;

  /** Category of transformation */
  category: TransformationCategory;

  /** The problematic "telling" version */
  before: {
    text: string;
    /** Why this is weak */
    problem: string;
    /** Specific telling indicators */
    tellingIndicators: string[];
  };

  /** The improved "showing" version */
  after: {
    text: string;
    /** Why this is effective */
    strength: string;
    /** Showing techniques used */
    techniquesUsed: CraftMove[];
  };

  /** Which craft moves to teach */
  primaryCraftMove: CraftMove;

  /** Prompt types where this example is most relevant */
  relevantPromptTypes: string[];

  /** Approximate word count of the after example */
  wordCount: number;

  /** Source attribution */
  source: string;
}

export type TransformationCategory =
  | 'growth_resilience'
  | 'passion_interest'
  | 'character_trait'
  | 'emotion_label'
  | 'experience_impact'
  | 'short_form';

export type CraftMove =
  | 'sensory_details'
  | 'specific_names'
  | 'active_verbs'
  | 'statistics_data'
  | 'emotional_physical';

// ============================================================================
// TRANSFORMATION EXAMPLES DATABASE
// ============================================================================

export const TRANSFORMATION_EXAMPLES: TransformationExample[] = [
  // ============================================================================
  // CATEGORY 1: GROWTH & RESILIENCE
  // ============================================================================
  {
    id: 'growth_resilience_1',
    category: 'growth_resilience',
    before: {
      text: "This experience taught me resilience. I faced many challenges but persevered. I learned that hard work pays off and that I can overcome obstacles through determination.",
      problem: 'Uses abstract claims without any concrete evidence. Could be written by anyone about any experience.',
      tellingIndicators: ['taught me resilience', 'faced challenges', 'persevered', 'learned that', 'hard work pays off', 'overcome obstacles'],
    },
    after: {
      text: "At two o'clock in the morning, Sam shook my tent awake. I climbed out of my sleeping bag, searched for my headlamp beneath my belongings, and began the ascent of Mount St. Helens. My knee throbbed with each step up the volcano's flank. Six hours later, standing at the crater's edge, wind burning my cheeks, I realized uncomfortable things have good outcomes all the time.",
      strength: 'Specific time (2 AM), named person (Sam), named place (Mount St. Helens), physical sensations (knee throbbed, wind burning), concrete action sequence. The lesson emerges organically.',
      techniquesUsed: ['specific_names', 'sensory_details', 'active_verbs', 'emotional_physical'],
    },
    primaryCraftMove: 'sensory_details',
    relevantPromptTypes: ['personal_statement', 'challenge_setback', 'personal_growth'],
    wordCount: 85,
    source: 'Adventure Treks / Perplexity Research',
  },

  {
    id: 'growth_resilience_2',
    category: 'growth_resilience',
    before: {
      text: "I became more independent after my father left. I had to grow up fast and take on adult responsibilities.",
      problem: 'Vague summary without showing what "independence" or "responsibilities" actually looked like.',
      tellingIndicators: ['became more independent', 'grow up fast', 'adult responsibilities'],
    },
    after: {
      text: "I learned how to fix a bike, how to swim, and even how to talk to girls. I fixed shoes with strips of duct tape, and found a job to help pay bills. I worked twice as hard in school. I helped clean my church, joined the choir, tutored my younger sister.",
      strength: 'Specific actions (fix a bike, swim, duct tape, pay bills) demonstrate independence without stating it. Each detail proves the claim.',
      techniquesUsed: ['active_verbs', 'specific_names', 'statistics_data'],
    },
    primaryCraftMove: 'active_verbs',
    relevantPromptTypes: ['personal_statement', 'challenge_setback', 'background_identity'],
    wordCount: 60,
    source: 'College Essay Guy',
  },

  // ============================================================================
  // CATEGORY 2: PASSION & INTEREST
  // ============================================================================
  {
    id: 'passion_interest_1',
    category: 'passion_interest',
    before: {
      text: "I am deeply passionate about molecular biology and want to immerse myself in my passion for biology and explore the infinitely rich possibilities.",
      problem: 'Claims passion without evidence. Generic phrasing could apply to anyone in any field.',
      tellingIndicators: ['deeply passionate', 'immerse myself', 'infinitely rich possibilities'],
    },
    after: {
      text: "I scoured articles about liposomes, polymeric micelles, dendrimers, targeting ligands—all conquering cancer in some exotic way. After several rejections, I received an invitation to work alongside Dr. Sangeeta Ray at Johns Hopkins. We explored The Inner Harbor at night, attended a concert one weekend. Making others interested in science—whether in a presentation or casual conversation—became more exciting to me than the research itself.",
      strength: 'Specific technical terms (liposomes, dendrimers) prove real knowledge. Named researcher (Dr. Ray), named institution (Johns Hopkins), specific setting (Inner Harbor). The shift from research to teaching reveals authentic growth.',
      techniquesUsed: ['specific_names', 'active_verbs', 'sensory_details'],
    },
    primaryCraftMove: 'specific_names',
    relevantPromptTypes: ['why_this_major', 'intellectual_curiosity', 'personal_statement'],
    wordCount: 80,
    source: 'Prepory / Successful Essay Analysis',
  },

  {
    id: 'passion_interest_2',
    category: 'passion_interest',
    before: {
      text: "I hope to learn from professors about their research and academic journeys.",
      problem: 'Generic statement that could appear in any "Why This College" essay. No specificity.',
      tellingIndicators: ['hope to learn', 'professors', 'academic journeys'],
    },
    after: {
      text: "Through Dean's Scholars seminars, I'd learn from Professor Hawkins about the Milky Way's structure and Professor Dominguez about how hormone regulation relates to addiction. I'd love to ask Professor Esbaugh what surprised him most from his fish physiology research.",
      strength: 'Three named professors with specific research areas. Shows real research into the school. Question format demonstrates genuine curiosity.',
      techniquesUsed: ['specific_names', 'active_verbs'],
    },
    primaryCraftMove: 'specific_names',
    relevantPromptTypes: ['why_this_college', 'why_this_major', 'intellectual_curiosity'],
    wordCount: 50,
    source: 'College Essay Guy',
  },

  // ============================================================================
  // CATEGORY 3: CHARACTER TRAITS
  // ============================================================================
  {
    id: 'character_trait_1',
    category: 'character_trait',
    before: {
      text: "I harness salient people skills to connect deeply with others.",
      problem: 'Abstract self-description with no evidence. "People skills" is vague and unverifiable.',
      tellingIndicators: ['harness', 'salient people skills', 'connect deeply'],
    },
    after: {
      text: "I engage with customers at my Target register who chat with me about their beloved, rambunctious grandkids. I've asked questions that lead to stories about pranks and family trips. My customers remember me because I always remember them.",
      strength: 'Specific workplace (Target register), specific details (grandkids, pranks, family trips), concrete evidence of being remembered. Shows connection through action, not claim.',
      techniquesUsed: ['specific_names', 'active_verbs', 'sensory_details'],
    },
    primaryCraftMove: 'active_verbs',
    relevantPromptTypes: ['personal_statement', 'activity_elaboration', 'community_contribution'],
    wordCount: 50,
    source: 'College Essay Guy',
  },

  {
    id: 'character_trait_2',
    category: 'character_trait',
    before: {
      text: "I am a curious person who loves to learn new things.",
      problem: 'Self-declared trait with no supporting evidence. Too generic to be memorable.',
      tellingIndicators: ['I am a curious person', 'loves to learn'],
    },
    after: {
      text: "I checked the quail eggs daily, face centimeters from the glass, talking to them and waiting for any signs of movement. When the first crack appeared, I watched for three hours straight, forgetting my homework entirely.",
      strength: 'Specific action (checking eggs), physical detail (face centimeters away), time detail (three hours), implied trait (curiosity, dedication) without stating it.',
      techniquesUsed: ['sensory_details', 'active_verbs', 'statistics_data'],
    },
    primaryCraftMove: 'sensory_details',
    relevantPromptTypes: ['personal_statement', 'intellectual_curiosity', 'meaningful_activity'],
    wordCount: 45,
    source: 'College Essay Guy',
  },

  // ============================================================================
  // CATEGORY 4: EMOTION LABELS
  // ============================================================================
  {
    id: 'emotion_label_1',
    category: 'emotion_label',
    before: {
      text: "I was nervous about the meeting with the athletic director.",
      problem: 'Names the emotion instead of showing physical/behavioral manifestations.',
      tellingIndicators: ['I was nervous'],
    },
    after: {
      text: "My heart raced in my chest as I went to meet with the athletic director. Would Coach kick me off the team for going behind his back? Would he take away playing time? Would he make fun of me too?",
      strength: 'Physical sensation (heart raced), internal questions reveal stakes and anxiety. The emotion is felt, not told.',
      techniquesUsed: ['emotional_physical', 'active_verbs'],
    },
    primaryCraftMove: 'emotional_physical',
    relevantPromptTypes: ['personal_statement', 'challenge_setback', 'personal_growth'],
    wordCount: 45,
    source: 'College Essay Guy',
  },

  {
    id: 'emotion_label_2',
    category: 'emotion_label',
    before: {
      text: "I was nervous.",
      problem: 'Bare emotion label with no context or physical manifestation.',
      tellingIndicators: ['I was nervous'],
    },
    after: {
      text: "My hands left damp prints on the podium, and I could taste the copper tang of adrenaline.",
      strength: 'Two sensory details (damp hands, copper taste) create visceral experience of nervousness without naming it.',
      techniquesUsed: ['sensory_details', 'emotional_physical'],
    },
    primaryCraftMove: 'sensory_details',
    relevantPromptTypes: ['personal_statement', 'challenge_setback'],
    wordCount: 18,
    source: 'Creative Writing Master Class',
  },

  {
    id: 'emotion_label_3',
    category: 'emotion_label',
    before: {
      text: "I struggled to make friends when I transferred schools.",
      problem: 'Tells about struggle without showing the experience.',
      tellingIndicators: ['I struggled', 'make friends'],
    },
    after: {
      text: "I scanned the bustling school cafeteria, feeling more and more forlorn with each unfamiliar face. I found an empty table and ate my lunch alone.",
      strength: 'Specific setting (cafeteria), action sequence (scanned, found table, ate alone), emotion through physical detail (forlorn with each face).',
      techniquesUsed: ['sensory_details', 'active_verbs', 'emotional_physical'],
    },
    primaryCraftMove: 'sensory_details',
    relevantPromptTypes: ['personal_statement', 'challenge_setback', 'background_identity'],
    wordCount: 30,
    source: 'CollegeVine',
  },

  // ============================================================================
  // CATEGORY 5: EXPERIENCE IMPACT
  // ============================================================================
  {
    id: 'experience_impact_1',
    category: 'experience_impact',
    before: {
      text: "My summer volunteering changed my perspective on healthcare inequality and made me want to pursue public health.",
      problem: 'Summarizes impact without showing the experiences that created it.',
      tellingIndicators: ['changed my perspective', 'made me want to pursue'],
    },
    after: {
      text: "Mr. Vu held up the wrinkled paper, his eyes in silent protest. The tattered bill requested $13,800 for a three-day hospital stay. 'Why call the ambulance? Just leave me alone!' he muttered. Because he couldn't understand English, Mr. Vu hadn't applied for health insurance. Mrs. Wong suffered from a worsening stomachache, neglected in the county hospital for over two hours, unable to flag down a passing nurse. After these encounters, I participated in a medical interpretation training program and was licensed as a Mandarin health interpreter in November.",
      strength: 'Named individuals (Mr. Vu, Mrs. Wong), specific amounts ($13,800, three-day stay, two hours), direct dialogue, concrete action taken (licensed interpreter). Impact shown through specific human stories.',
      techniquesUsed: ['specific_names', 'statistics_data', 'active_verbs', 'sensory_details'],
    },
    primaryCraftMove: 'specific_names',
    relevantPromptTypes: ['personal_statement', 'community_contribution', 'meaningful_activity'],
    wordCount: 110,
    source: 'MIT Admissions Blog',
  },

  {
    id: 'experience_impact_2',
    category: 'experience_impact',
    before: {
      text: "Designer items are expensive.",
      problem: 'Generic observation with no specificity or personal connection.',
      tellingIndicators: ['expensive'],
    },
    after: {
      text: "$630. That is how much a single pair of Hermès' Oran Sandals cost—$830 if you want studs.",
      strength: 'Specific brand (Hermès Oran Sandals), exact prices ($630, $830), detail (studs). One data point implies larger understanding.',
      techniquesUsed: ['statistics_data', 'specific_names'],
    },
    primaryCraftMove: 'statistics_data',
    relevantPromptTypes: ['personal_statement', 'background_identity'],
    wordCount: 22,
    source: 'College Essay Guy',
  },

  // ============================================================================
  // CATEGORY 6: SHORT-FORM TRANSFORMATIONS (For 150-300 word essays)
  // ============================================================================
  {
    id: 'short_form_1',
    category: 'short_form',
    before: {
      text: "I developed discipline and healthy habits through self-improvement.",
      problem: 'Vague abstraction with no evidence of what "discipline" or "healthy habits" actually look like.',
      tellingIndicators: ['developed discipline', 'healthy habits', 'self-improvement'],
    },
    after: {
      text: "I rose at 5 AM, ran two miles through head-rattling migraines, then perfected my breakfast: eggs over easy, Greek yogurt with honey, almond butter toast. In ninth grade I subsisted on PopTarts. Now I've roped my brother into this routine.",
      strength: 'Specific time (5 AM), physical detail (head-rattling migraines), specific foods (eggs over easy, Greek yogurt with honey, PopTarts), before/after contrast, extension to others (brother). Growth shown through behavior change.',
      techniquesUsed: ['statistics_data', 'sensory_details', 'specific_names', 'active_verbs'],
    },
    primaryCraftMove: 'sensory_details',
    relevantPromptTypes: ['short_answer', 'activity_elaboration', 'personal_growth'],
    wordCount: 50,
    source: 'College Essay Guy',
  },

  {
    id: 'short_form_2',
    category: 'short_form',
    before: {
      text: "I am passionate about engineering and enjoy tinkering with technology.",
      problem: 'Claims passion without any evidence. Generic.',
      tellingIndicators: ['passionate about', 'enjoy tinkering'],
    },
    after: {
      text: "Tinkering with Arduino boards in my garage. Reading about liposomes and polymeric micelles. Watching MIT OpenCourseWare lectures at 1.5x speed. Explaining Bernoulli's principle to my skeptical uncle at Thanksgiving.",
      strength: 'Specific technology (Arduino), specific topics (liposomes, polymeric micelles), specific platform (MIT OCW), specific setting (Thanksgiving with uncle). Shows passion through varied, specific actions.',
      techniquesUsed: ['specific_names', 'active_verbs'],
    },
    primaryCraftMove: 'specific_names',
    relevantPromptTypes: ['short_answer', 'why_this_major', 'intellectual_curiosity'],
    wordCount: 32,
    source: 'Stanford Essay Analysis',
  },

  {
    id: 'short_form_3',
    category: 'short_form',
    before: {
      text: "I am detail-oriented and dedicated to my work.",
      problem: 'Self-declared trait with no evidence.',
      tellingIndicators: ['detail-oriented', 'dedicated'],
    },
    after: {
      text: "I checked the water levels twice daily, watched for movement through the glass, talked to the eggs while monitoring temperature.",
      strength: 'Pattern of repeated actions (twice daily, watched, talked, monitored) implies traits without stating them.',
      techniquesUsed: ['active_verbs', 'statistics_data'],
    },
    primaryCraftMove: 'active_verbs',
    relevantPromptTypes: ['short_answer', 'activity_elaboration'],
    wordCount: 22,
    source: 'College Essay Guy',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all transformation examples
 */
export function getAllTransformationExamples(): TransformationExample[] {
  return TRANSFORMATION_EXAMPLES;
}

/**
 * Get examples by category
 */
export function getExamplesByCategory(category: TransformationCategory): TransformationExample[] {
  return TRANSFORMATION_EXAMPLES.filter(ex => ex.category === category);
}

/**
 * Get examples by primary craft move
 */
export function getExamplesByCraftMove(craftMove: CraftMove): TransformationExample[] {
  return TRANSFORMATION_EXAMPLES.filter(ex => ex.primaryCraftMove === craftMove);
}

/**
 * Get examples for a prompt type
 */
export function getExamplesForPromptType(promptType: string): TransformationExample[] {
  return TRANSFORMATION_EXAMPLES.filter(ex =>
    ex.relevantPromptTypes.includes(promptType)
  );
}

/**
 * Get examples within a word count range
 */
export function getExamplesByWordCount(maxWords: number): TransformationExample[] {
  return TRANSFORMATION_EXAMPLES.filter(ex => ex.wordCount <= maxWords);
}

/**
 * Get a random example for teaching
 */
export function getRandomExample(category?: TransformationCategory): TransformationExample {
  const pool = category
    ? getExamplesByCategory(category)
    : TRANSFORMATION_EXAMPLES;

  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Find example matching a telling phrase
 */
export function findExampleMatchingPhrase(phrase: string): TransformationExample | undefined {
  const lowerPhrase = phrase.toLowerCase();

  return TRANSFORMATION_EXAMPLES.find(ex =>
    ex.before.tellingIndicators.some(indicator =>
      lowerPhrase.includes(indicator.toLowerCase())
    )
  );
}

/**
 * Get transformation statistics
 */
export function getTransformationStats(): {
  total: number;
  byCategory: Record<TransformationCategory, number>;
  byCraftMove: Record<CraftMove, number>;
  averageWordCount: number;
} {
  const byCategory: Record<TransformationCategory, number> = {
    growth_resilience: 0,
    passion_interest: 0,
    character_trait: 0,
    emotion_label: 0,
    experience_impact: 0,
    short_form: 0,
  };

  const byCraftMove: Record<CraftMove, number> = {
    sensory_details: 0,
    specific_names: 0,
    active_verbs: 0,
    statistics_data: 0,
    emotional_physical: 0,
  };

  let totalWords = 0;

  for (const example of TRANSFORMATION_EXAMPLES) {
    byCategory[example.category]++;
    byCraftMove[example.primaryCraftMove]++;
    totalWords += example.wordCount;
  }

  return {
    total: TRANSFORMATION_EXAMPLES.length,
    byCategory,
    byCraftMove,
    averageWordCount: Math.round(totalWords / TRANSFORMATION_EXAMPLES.length),
  };
}

// ============================================================================
// TELLING PHRASE PATTERNS (For cliché detection integration)
// ============================================================================

/**
 * All telling indicators extracted from examples
 * Can be used to enhance cliché detection
 */
export const TELLING_PHRASE_PATTERNS = {
  // Growth claims
  growth_claims: [
    'taught me resilience',
    'faced challenges',
    'persevered',
    'learned that',
    'hard work pays off',
    'overcome obstacles',
    'became more independent',
    'grow up fast',
    'adult responsibilities',
    'developed discipline',
    'healthy habits',
    'self-improvement',
  ],

  // Passion claims
  passion_claims: [
    'deeply passionate',
    'immerse myself',
    'infinitely rich possibilities',
    'hope to learn',
    'academic journeys',
    'passionate about',
    'enjoy tinkering',
  ],

  // Character trait claims
  character_claims: [
    'harness',
    'salient people skills',
    'connect deeply',
    'I am a curious person',
    'loves to learn',
    'detail-oriented',
    'dedicated',
  ],

  // Emotion labels (instead of showing)
  emotion_labels: [
    'I was nervous',
    'I struggled',
    'make friends',
    'I was scared',
    'I was excited',
    'I felt happy',
    'I was sad',
  ],

  // Impact claims
  impact_claims: [
    'changed my perspective',
    'made me want to pursue',
    'expensive',
    'taught me',
    'I realized',
    'I learned',
  ],
};

/**
 * Get all telling phrases as flat array
 */
export function getAllTellingPhrases(): string[] {
  return Object.values(TELLING_PHRASE_PATTERNS).flat();
}
