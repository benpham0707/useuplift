/**
 * Academic Course Knowledge Base
 *
 * Comprehensive research-backed data on AP courses, difficulty levels,
 * success strategies, and workload management. This enables our advisor
 * to provide deep, substantive guidance rather than surface-level advice.
 *
 * Sources:
 * - College Board AP Score Distributions (2023-2024)
 * - Educational research on AP outcomes
 * - Admissions officer perspectives
 * - Student success pattern analysis
 */

// ============================================================================
// TYPES
// ============================================================================

export interface APCourseProfile {
  name: string;
  shortName: string;
  // R9: Add 'world_language' and 'interdisciplinary' to match actual course data
  category: 'math' | 'science' | 'english' | 'history' | 'social_science' | 'world_language' | 'interdisciplinary' | 'arts' | 'cs';

  // Difficulty metrics
  difficultyTier: 1 | 2 | 3 | 4 | 5; // 5 = hardest
  perceivedDifficulty: 'very_hard' | 'hard' | 'moderate' | 'accessible';
  weeklyHours: { minimum: number; typical: number; intensive: number };

  // Success data (approximate, based on College Board data)
  passRate: number; // Score 3+
  fiveRate: number; // Score 5
  averageScore: number;

  // What makes this course challenging
  challengeFactors: string[];

  // How students succeed
  successStrategies: string[];

  // Prerequisites
  prerequisites: string[];
  idealPreparation: string;

  // Course relationships
  pairsWellWith: string[];
  avoidTakingWith: string[]; // Workload conflicts
  naturalProgression: string | null; // What comes after

  // College credit and relevance
  typicalCredits: number;
  majorRelevance: Record<string, 'essential' | 'strongly_recommended' | 'helpful' | 'optional'>;

  // Common fears and reality
  commonFears: Array<{
    fear: string;
    reality: string;
    advice: string;
  }>;

  // Who thrives in this course
  idealStudentProfile: string;

  // Warning signs someone isn't ready
  readinessIndicators: {
    ready: string[];
    notReady: string[];
  };
}

export interface CourseWorkloadPairing {
  courses: string[];
  compatibility: 'excellent' | 'good' | 'manageable' | 'challenging' | 'not_recommended';
  reasoning: string;
  tips: string[];
}

export interface GradeAppropriateLoad {
  grade: 9 | 10 | 11 | 12;
  schoolType: 'competitive_magnet' | 'well_resourced' | 'average' | 'under_resourced';
  rigorousCourses: {
    minimum: number;
    typical: number;
    ambitious: number;
    maximum: number;
  };
  notes: string[];
}

// ============================================================================
// AP COURSE PROFILES
// ============================================================================

export const AP_COURSES: Record<string, APCourseProfile> = {
  // -------------------------------------------------------------------------
  // MATHEMATICS
  // -------------------------------------------------------------------------
  'AP Calculus AB': {
    name: 'AP Calculus AB',
    shortName: 'Calc AB',
    category: 'math',
    difficultyTier: 3,
    perceivedDifficulty: 'hard',
    weeklyHours: { minimum: 5, typical: 7, intensive: 10 },
    passRate: 0.644,
    fiveRate: 0.214,
    averageScore: 3.22,
    challengeFactors: [
      'Conceptual leap from procedural math to calculus thinking',
      'Cumulative - missing early concepts compounds quickly',
      'Requires strong algebra and trigonometry foundation',
      'Free response questions demand clear mathematical communication',
    ],
    successStrategies: [
      'Master pre-calculus thoroughly before starting',
      'Do every assigned problem, not just the required ones',
      'Form study groups for problem-solving sessions',
      'Use visualization tools to understand concepts geometrically',
      'Practice free response questions with full explanations',
    ],
    prerequisites: ['Pre-Calculus', 'Algebra 2'],
    idealPreparation: 'A in Pre-Calculus with strong understanding of functions, trigonometry, and limits introduction',
    pairsWellWith: ['AP Physics 1', 'AP Statistics', 'AP Computer Science A'],
    avoidTakingWith: ['AP Physics C (both)', 'Multiple other STEM APs'], // Calc-heavy overload
    naturalProgression: 'AP Calculus BC or Multivariable Calculus',
    typicalCredits: 4,
    majorRelevance: {
      'Computer Science': 'essential',
      'Engineering': 'essential',
      'Physics': 'essential',
      'Mathematics': 'essential',
      'Economics': 'strongly_recommended',
      'Pre-Med': 'strongly_recommended',
      'Business': 'helpful',
      'Biology': 'helpful',
    },
    commonFears: [
      {
        fear: "I've heard calculus is where smart students fail",
        reality:
          '64% of students pass nationally. At well-prepared schools, it\'s higher. Most failures come from inadequate pre-calc preparation, not inability.',
        advice:
          "If you got an A in Pre-Calc with genuine understanding (not just memorization), you're well-positioned. The students who struggle usually have gaps in algebra or trig.",
      },
      {
        fear: "What if I tank my GPA?",
        reality:
          "Most schools weight AP courses, so a B in AP Calc often equals an A in regular math for GPA. Plus, colleges see the rigor. A B in AP Calc is viewed more favorably than an A in regular math.",
        advice:
          "The GPA 'risk' is lower than you think, and the signal of taking rigorous courses is valuable.",
      },
    ],
    idealStudentProfile:
      'Strong algebraic foundation, enjoys problem-solving, can handle abstraction, willing to practice consistently',
    readinessIndicators: {
      ready: [
        'A or strong B+ in Pre-Calculus',
        'Understands functions deeply, not just procedurally',
        'Can do algebra manipulations fluently',
        'Comfortable with trigonometric identities',
      ],
      notReady: [
        'Struggled in Pre-Calculus or Algebra 2',
        'Relies heavily on calculator for basic operations',
        'Memorizes procedures without understanding why',
        'Gets confused by word problems',
      ],
    },
  },

  'AP Calculus BC': {
    name: 'AP Calculus BC',
    shortName: 'Calc BC',
    category: 'math',
    difficultyTier: 4,
    perceivedDifficulty: 'hard',
    weeklyHours: { minimum: 6, typical: 8, intensive: 12 },
    passRate: 0.809, // Higher due to self-selection
    fiveRate: 0.477,
    averageScore: 3.92,
    challengeFactors: [
      'Faster pace than AB - covers AB content plus additional topics',
      'Sequences and series require new thinking patterns',
      'Parametric and polar equations add complexity',
      'Higher expectations on free response',
    ],
    successStrategies: [
      'If taking BC directly, ensure very strong pre-calc foundation',
      'Don\'t skip steps - BC rewards thorough understanding',
      'Series convergence tests require memorization AND understanding',
      'Practice with released exams extensively',
      'Form study partnerships for problem sets',
    ],
    prerequisites: ['Pre-Calculus', 'Strong algebra and trig'],
    idealPreparation: 'A in Pre-Calculus with natural mathematical intuition, or A in Calc AB',
    pairsWellWith: ['AP Physics C', 'AP Computer Science A', 'AP Statistics'],
    avoidTakingWith: ['AP Physics C (both) + other heavy STEM in same year'],
    naturalProgression: 'Multivariable Calculus, Linear Algebra, Differential Equations',
    typicalCredits: 8, // Often gets credit for both Calc 1 and 2
    majorRelevance: {
      'Computer Science': 'essential',
      'Engineering': 'essential',
      'Physics': 'essential',
      'Mathematics': 'essential',
      'Economics': 'strongly_recommended',
    },
    commonFears: [
      {
        fear: "BC is for 'math geniuses' only",
        reality:
          "The 80.9% pass rate shows it's quite achievable - but the population is self-selected. If you're considering it, you're probably the type who can handle it.",
        advice:
          "The question isn't capability - it's whether you want the deeper understanding BC provides. For STEM majors, BC is strongly preferred over AB.",
      },
      {
        fear: "I should take AB first to be safe",
        reality:
          "If you have strong pre-calc skills and are going into STEM, going directly to BC is often better. Many BC students skip AB entirely.",
        advice:
          "The AB-first path makes sense if you're uncertain. But if you got an A in Pre-Calc with genuine understanding, BC is likely the right choice for a STEM-bound student.",
      },
    ],
    idealStudentProfile:
      'Natural mathematical intuition, enjoys challenging problems, plans STEM major, can handle faster pace',
    readinessIndicators: {
      ready: [
        'A in Pre-Calculus with conceptual understanding',
        'Finds math problems engaging, not just tolerable',
        'Self-motivated to work through difficult problems',
        'Strong time management skills',
      ],
      notReady: [
        'B or lower in Pre-Calculus',
        'Prefers step-by-step procedures over understanding',
        'Gets frustrated when problems are hard',
        'Already overloaded with other commitments',
      ],
    },
  },

  'AP Statistics': {
    name: 'AP Statistics',
    shortName: 'Stats',
    category: 'math',
    difficultyTier: 2,
    perceivedDifficulty: 'moderate',
    weeklyHours: { minimum: 4, typical: 5, intensive: 7 },
    passRate: 0.618,
    fiveRate: 0.175,
    averageScore: 2.96,
    challengeFactors: [
      'Different type of mathematical thinking than algebra/calculus',
      'Heavy emphasis on interpretation and communication',
      'Free response requires written explanations',
      'Probability concepts can be counterintuitive',
    ],
    successStrategies: [
      'Focus on understanding concepts, not just calculations',
      'Practice explaining your reasoning in complete sentences',
      'Use real-world examples to ground abstract concepts',
      'Calculator proficiency is essential for efficiency',
      'Study inference procedures systematically',
    ],
    prerequisites: ['Algebra 2'],
    idealPreparation: 'Algebra 2 with comfort in basic probability concepts',
    pairsWellWith: ['AP Psychology', 'AP Environmental Science', 'AP Economics', 'Any social science AP'],
    avoidTakingWith: [], // Generally compatible with most loads
    naturalProgression: 'College-level statistics courses',
    typicalCredits: 3,
    majorRelevance: {
      'Psychology': 'essential',
      'Economics': 'strongly_recommended',
      'Biology': 'strongly_recommended',
      'Pre-Med': 'helpful',
      'Business': 'strongly_recommended',
      'Political Science': 'helpful',
      'Computer Science': 'helpful',
    },
    commonFears: [
      {
        fear: "I'm not good at math, so I'll fail Stats",
        reality:
          "AP Stats is fundamentally different from calculus-track math. Many students who struggle with calculus excel at statistics because it's more conceptual and applied.",
        advice:
          "If you think in terms of patterns, real-world applications, and 'what does this mean?' rather than 'how do I compute this?', Stats might suit you well.",
      },
    ],
    idealStudentProfile:
      'Curious about data, comfortable with interpretation over computation, good written communication',
    readinessIndicators: {
      ready: [
        'Comfortable with Algebra 2 concepts',
        'Good at interpreting graphs and data',
        'Can explain reasoning in writing',
        'Interested in how data informs decisions',
      ],
      notReady: [
        'Struggles with basic algebra',
        'Uncomfortable with word problems',
        'Dislikes writing explanations',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // SCIENCES
  // -------------------------------------------------------------------------
  'AP Physics 1': {
    name: 'AP Physics 1',
    shortName: 'Physics 1',
    category: 'science',
    difficultyTier: 5, // One of the hardest by pass rate
    perceivedDifficulty: 'very_hard',
    weeklyHours: { minimum: 6, typical: 8, intensive: 12 },
    passRate: 0.473, // Notably low
    fiveRate: 0.102,
    averageScore: 2.59,
    challengeFactors: [
      'Requires strong conceptual understanding, not just formulas',
      'Problems require multi-step reasoning and synthesis',
      'Algebra-based but conceptually demanding',
      'Lab component requires understanding of experimental design',
      'Multiple choice questions are designed to catch misconceptions',
    ],
    successStrategies: [
      'Focus on WHY things happen, not just what happens',
      'Draw diagrams and free-body diagrams for every problem',
      'Practice explaining concepts verbally',
      'Work through problems without looking at solutions first',
      'Address misconceptions early - they compound',
      'Use simulations to visualize concepts',
    ],
    prerequisites: ['Algebra 2', 'Geometry'],
    idealPreparation: 'Strong algebra skills, ideally concurrent or completed pre-calculus',
    pairsWellWith: ['AP Calculus AB', 'AP Computer Science Principles'],
    avoidTakingWith: ['AP Chemistry', 'Multiple other science APs'], // Science overload
    naturalProgression: 'AP Physics 2 or AP Physics C',
    typicalCredits: 4,
    majorRelevance: {
      'Engineering': 'essential',
      'Physics': 'essential',
      'Pre-Med': 'strongly_recommended',
      'Computer Science': 'helpful',
      'Architecture': 'strongly_recommended',
    },
    commonFears: [
      {
        fear: "Physics has the lowest pass rate - I'll definitely fail",
        reality:
          "The low pass rate reflects that many underprepared students take it. Students with strong math foundations and conceptual thinking do much better than the average suggests.",
        advice:
          "Physics 1 is hard because it requires UNDERSTANDING, not memorization. If you think deeply about problems and enjoy figuring out 'why', you're better prepared than most.",
      },
      {
        fear: "I need to be a math genius",
        reality:
          "Physics 1 is algebra-based. The math is accessible - the challenge is applying it to physical situations.",
        advice:
          "The bottleneck isn't math skill, it's conceptual reasoning. Students who ask 'why does this happen?' tend to succeed.",
      },
    ],
    idealStudentProfile:
      'Curious about how things work, comfortable with algebra, enjoys puzzling through problems, willing to struggle productively',
    readinessIndicators: {
      ready: [
        'Strong performance in Algebra 2',
        'Enjoys understanding how things work',
        'Comfortable with multi-step problems',
        'Can tolerate confusion and work through it',
      ],
      notReady: [
        'Struggles with algebra',
        'Prefers memorizing over understanding',
        'Gets frustrated when problems aren\'t straightforward',
        'Already overloaded with other challenging courses',
      ],
    },
  },

  'AP Physics C: Mechanics': {
    name: 'AP Physics C: Mechanics',
    shortName: 'Physics C Mech',
    category: 'science',
    difficultyTier: 4,
    perceivedDifficulty: 'hard',
    weeklyHours: { minimum: 6, typical: 8, intensive: 10 },
    passRate: 0.763, // Higher due to self-selection
    fiveRate: 0.285,
    averageScore: 3.49,
    challengeFactors: [
      'Calculus-based - requires concurrent or prior calculus',
      'Faster pace than Physics 1',
      'More mathematical rigor in problem-solving',
      'Requires strong integration of physics and calculus concepts',
    ],
    successStrategies: [
      'Take concurrently with or after Calculus AB/BC',
      'Focus on setting up integrals and derivatives in physics contexts',
      'Practice deriving formulas, not just using them',
      'Work through MIT OpenCourseWare problems',
    ],
    prerequisites: ['Calculus (concurrent OK)', 'Prior physics recommended'],
    idealPreparation: 'Calculus AB/BC concurrent or completed, ideally with Physics 1 background',
    pairsWellWith: ['AP Calculus BC', 'AP Physics C: E&M'],
    avoidTakingWith: ['Too many other STEM APs without strong foundation'],
    naturalProgression: 'College physics (mechanics section covered)',
    typicalCredits: 4,
    majorRelevance: {
      'Engineering': 'essential',
      'Physics': 'essential',
      'Computer Science': 'strongly_recommended',
    },
    commonFears: [
      {
        fear: "C is way harder than 1",
        reality:
          "The pass rate is actually higher (76.3% vs 47.3%) because C uses calculus, which makes many problems MORE straightforward to solve. The population is also more self-selected.",
        advice:
          "If you're comfortable with calculus, Physics C is often easier than Physics 1 because the math provides cleaner solutions to problems.",
      },
    ],
    idealStudentProfile:
      'Strong calculus student, enjoys mathematical problem-solving, engineering or physics aspirations',
    readinessIndicators: {
      ready: [
        'Concurrent enrollment in Calculus or already completed it',
        'Strong performance in previous math courses',
        'Comfortable with derivatives and integrals',
        'Genuine interest in physics/engineering',
      ],
      notReady: [
        'Not taking calculus',
        'Struggled with pre-calculus',
        'Taking too many other rigorous courses',
      ],
    },
  },

  'AP Chemistry': {
    name: 'AP Chemistry',
    shortName: 'Chem',
    category: 'science',
    difficultyTier: 4,
    perceivedDifficulty: 'hard',
    weeklyHours: { minimum: 6, typical: 8, intensive: 11 },
    passRate: 0.756,
    fiveRate: 0.179,
    averageScore: 3.31,
    challengeFactors: [
      'Combines conceptual understanding with heavy calculation',
      'Requires strong math skills for stoichiometry and equilibrium',
      'Large amount of content to master',
      'Lab component requires procedural knowledge',
      'Abstract concepts (electron orbitals, equilibrium) are hard to visualize',
    ],
    successStrategies: [
      'Master stoichiometry and dimensional analysis early',
      'Practice problems daily - chemistry is a skill',
      'Use molecular visualization tools',
      'Connect concepts to real-world applications',
      'Form study groups for problem-solving',
      'Don\'t fall behind - content is cumulative',
    ],
    prerequisites: ['Chemistry', 'Algebra 2'],
    idealPreparation: 'A in regular chemistry, strong algebra skills, comfort with scientific notation',
    pairsWellWith: ['AP Biology', 'AP Calculus AB'],
    avoidTakingWith: ['AP Physics 1 and another heavy science'], // Science overload
    naturalProgression: 'College chemistry courses',
    typicalCredits: 4,
    majorRelevance: {
      'Pre-Med': 'essential',
      'Biology': 'strongly_recommended',
      'Chemistry': 'essential',
      'Engineering (Chemical)': 'essential',
      'Pharmacy': 'essential',
    },
    commonFears: [
      {
        fear: "There's too much memorization",
        reality:
          "AP Chemistry has shifted toward understanding and application. Yes, you need to know periodic trends and some formulas, but the exam rewards UNDERSTANDING, not rote memorization.",
        advice:
          "Focus on understanding WHY things happen chemically. The patterns become intuitive when you understand the underlying principles.",
      },
      {
        fear: "The math is too hard",
        reality:
          "The math is actually just algebra and stoichiometry - nothing beyond Algebra 2. The challenge is applying it in chemistry contexts.",
        advice:
          "If you're comfortable with Algebra 2 and systematic problem-solving, the math won't be the obstacle.",
      },
    ],
    idealStudentProfile:
      'Systematic thinker, comfortable with math, enjoys understanding how matter behaves, willing to do daily practice',
    readinessIndicators: {
      ready: [
        'A or strong B+ in regular chemistry',
        'Comfortable with algebra and dimensional analysis',
        'Can handle multi-step calculations',
        'Interested in the "why" behind chemical reactions',
      ],
      notReady: [
        'Struggled in regular chemistry',
        'Weak algebra skills',
        'Dislikes systematic problem-solving',
        'Already taking multiple challenging science courses',
      ],
    },
  },

  'AP Biology': {
    name: 'AP Biology',
    shortName: 'Bio',
    category: 'science',
    difficultyTier: 3,
    perceivedDifficulty: 'hard',
    weeklyHours: { minimum: 5, typical: 7, intensive: 10 },
    passRate: 0.683,
    fiveRate: 0.168,
    averageScore: 3.15,
    challengeFactors: [
      'Massive amount of content to master',
      'Requires both memorization AND conceptual understanding',
      'Lab analysis and experimental design questions',
      'Free response requires detailed written explanations',
      'Connects molecular, cellular, organismal, and ecosystem levels',
    ],
    successStrategies: [
      'Read the textbook actively - take notes, ask questions',
      'Create concept maps connecting topics',
      'Practice data analysis and experimental design',
      'Review regularly - don\'t cram',
      'Use spaced repetition for memorization',
      'Connect concepts across units (evolution ties everything together)',
    ],
    prerequisites: ['Biology', 'Chemistry recommended'],
    idealPreparation: 'A in biology, basic chemistry understanding, strong reading skills',
    pairsWellWith: ['AP Chemistry', 'AP Environmental Science', 'AP Psychology'],
    avoidTakingWith: ['Too many content-heavy courses (APUSH + APBio + APChem)'],
    naturalProgression: 'College biology courses, pre-med track',
    typicalCredits: 4,
    majorRelevance: {
      'Pre-Med': 'essential',
      'Biology': 'essential',
      'Neuroscience': 'essential',
      'Psychology': 'strongly_recommended',
      'Environmental Science': 'strongly_recommended',
    },
    commonFears: [
      {
        fear: "It's all memorization",
        reality:
          "AP Biology has shifted heavily toward conceptual understanding and data analysis. You need to know the facts, but the exam tests whether you can APPLY them.",
        advice:
          "Focus on understanding processes and connections rather than memorizing isolated facts. The facts become easier to remember when you understand the bigger picture.",
      },
    ],
    idealStudentProfile:
      'Curious about living systems, good at reading and synthesizing information, willing to study consistently',
    readinessIndicators: {
      ready: [
        'A in regular biology',
        'Good reading comprehension',
        'Comfortable with scientific terminology',
        'Can commit to regular study time',
      ],
      notReady: [
        'Struggled in regular biology',
        'Dislikes reading dense material',
        'Prefers hands-on over reading-based learning exclusively',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // ENGLISH
  // -------------------------------------------------------------------------
  'AP English Language': {
    name: 'AP English Language and Composition',
    shortName: 'Lang',
    category: 'english',
    difficultyTier: 3,
    perceivedDifficulty: 'moderate',
    weeklyHours: { minimum: 4, typical: 6, intensive: 8 },
    passRate: 0.546,
    fiveRate: 0.098,
    averageScore: 2.79,
    challengeFactors: [
      'Requires analyzing rhetoric and argument, not just content',
      'Timed essay writing under pressure',
      'Synthesis essay requires integrating multiple sources',
      'Must identify and explain rhetorical strategies',
      'Reading comprehension of complex nonfiction',
    ],
    successStrategies: [
      'Read widely - editorials, essays, speeches',
      'Practice identifying rhetorical strategies (ethos, pathos, logos)',
      'Write timed essays regularly',
      'Get feedback on your writing and revise',
      'Annotate readings for rhetorical moves',
      'Build vocabulary for discussing rhetoric',
    ],
    prerequisites: ['English 10 or equivalent'],
    idealPreparation: 'Strong writer, comfortable with analytical reading, enjoys nonfiction',
    pairsWellWith: ['AP US History', 'AP Government', 'Any humanities AP'],
    avoidTakingWith: ['AP English Literature in same year'], // Too much overlap
    naturalProgression: 'AP English Literature or college composition',
    typicalCredits: 3,
    majorRelevance: {
      'English': 'essential',
      'Communications': 'essential',
      'Political Science': 'strongly_recommended',
      'Pre-Law': 'essential',
      'Journalism': 'essential',
    },
    commonFears: [
      {
        fear: "I'm not a good writer",
        reality:
          "AP Lang is less about natural writing talent and more about learning the skills of rhetorical analysis. These are teachable skills.",
        advice:
          "If you're willing to practice timed writing and learn the vocabulary of rhetoric, you can improve dramatically over the year.",
      },
    ],
    idealStudentProfile:
      'Enjoys analyzing how language works, comfortable with nonfiction, willing to write regularly',
    readinessIndicators: {
      ready: [
        'Enjoys reading and analyzing texts',
        'Can write coherent essays',
        'Interested in how arguments are constructed',
        'Comfortable with timed writing',
      ],
      notReady: [
        'Struggles with reading comprehension',
        'Dislikes writing',
        'Prefers creative writing over analytical',
      ],
    },
  },

  'AP English Literature': {
    name: 'AP English Literature and Composition',
    shortName: 'Lit',
    category: 'english',
    difficultyTier: 3,
    perceivedDifficulty: 'hard',
    weeklyHours: { minimum: 5, typical: 6, intensive: 9 },
    passRate: 0.724,
    fiveRate: 0.137,
    averageScore: 3.16,
    challengeFactors: [
      'Requires deep literary analysis, not just plot summary',
      'Poetry analysis is challenging for many students',
      'Free response essay on a work of your choice requires preparation',
      'Reading load can be heavy depending on teacher',
      'Subjective nature of literary interpretation',
    ],
    successStrategies: [
      'Read assigned works carefully, not SparkNotes',
      'Practice close reading and annotation',
      'Develop a repertoire of works for the open essay',
      'Study literary devices and how to identify them',
      'Practice writing under time pressure',
      'Connect themes across different works',
    ],
    prerequisites: ['AP English Language or strong English background'],
    idealPreparation: 'AP Lang or strong honors English, genuine interest in literature',
    pairsWellWith: ['AP History courses', 'AP Art History'],
    avoidTakingWith: ['AP English Language in same year'],
    naturalProgression: 'College English courses',
    typicalCredits: 3,
    majorRelevance: {
      'English': 'essential',
      'Creative Writing': 'essential',
      'Humanities': 'strongly_recommended',
      'Theater': 'helpful',
    },
    commonFears: [
      {
        fear: "Poetry makes no sense to me",
        reality:
          "Poetry analysis is a skill that can be learned. Most students struggle at first but improve significantly with practice and guidance.",
        advice:
          "Poetry becomes more accessible when you learn the vocabulary and techniques for analyzing it. The challenge is normal - push through it.",
      },
    ],
    idealStudentProfile:
      'Loves reading, enjoys digging into meaning, comfortable with ambiguity, strong writer',
    readinessIndicators: {
      ready: [
        'Genuinely enjoys reading literature',
        'Can analyze texts beyond surface level',
        'Strong foundational writing skills',
        'Comfortable with open-ended interpretation',
      ],
      notReady: [
        'Doesn\'t enjoy reading for pleasure',
        'Prefers concrete over abstract analysis',
        'Struggles with current English coursework',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // HISTORY & SOCIAL SCIENCE
  // -------------------------------------------------------------------------
  'AP US History': {
    name: 'AP United States History',
    shortName: 'APUSH',
    category: 'history',
    difficultyTier: 4,
    perceivedDifficulty: 'hard',
    weeklyHours: { minimum: 5, typical: 7, intensive: 10 },
    passRate: 0.722,
    fiveRate: 0.128,
    averageScore: 3.22,
    challengeFactors: [
      'Enormous amount of content to cover',
      'Requires understanding themes, not just facts',
      'Document-based question (DBQ) requires specific skills',
      'Multiple-choice questions test causation and comparison',
      'Reading load is substantial',
    ],
    successStrategies: [
      'Read assigned materials - there are no shortcuts',
      'Focus on themes and patterns, not just memorizing dates',
      'Practice DBQ and LEQ essays with feedback',
      'Create timelines connecting events across periods',
      'Use primary sources to understand perspectives',
      'Form study groups for discussing interpretations',
    ],
    prerequisites: ['World History or equivalent'],
    idealPreparation: 'Strong reading skills, interest in history, good writing ability',
    pairsWellWith: ['AP English Language', 'AP Government'],
    avoidTakingWith: ['AP World History and AP Euro in same year'], // History overload
    naturalProgression: 'College history courses',
    typicalCredits: 3,
    majorRelevance: {
      'History': 'essential',
      'Political Science': 'strongly_recommended',
      'Pre-Law': 'strongly_recommended',
      'Journalism': 'helpful',
    },
    commonFears: [
      {
        fear: "There's too much to memorize",
        reality:
          "APUSH has shifted toward analysis over memorization. You need to know the content, but the exam rewards understanding CAUSES and EFFECTS, not trivia.",
        advice:
          "Focus on the 'why' behind events. When you understand causation, the facts become easier to remember and apply.",
      },
      {
        fear: "The reading is overwhelming",
        reality:
          "The reading load is real - typically 3-5 hours per week just for reading. But it's manageable if you stay consistent.",
        advice:
          "Don't fall behind. Read actively with a purpose, and you'll retain more than you think.",
      },
    ],
    idealStudentProfile:
      'Curious about the past, enjoys reading, can write analytical essays, willing to commit time',
    readinessIndicators: {
      ready: [
        'Strong reading comprehension',
        'Genuine interest in history',
        'Can write coherent essays',
        'Good time management',
      ],
      notReady: [
        'Dislikes reading',
        'History feels like memorizing dates',
        'Already has heavy course load',
      ],
    },
  },

  'AP Psychology': {
    name: 'AP Psychology',
    shortName: 'Psych',
    category: 'social_science',
    difficultyTier: 2,
    perceivedDifficulty: 'accessible',
    weeklyHours: { minimum: 3, typical: 4, intensive: 6 },
    passRate: 0.617,
    fiveRate: 0.192,
    averageScore: 2.97,
    challengeFactors: [
      'Large amount of terminology to learn',
      'Free response requires application of concepts',
      'Research methods section requires careful study',
      'Must distinguish similar concepts (e.g., different types of conditioning)',
    ],
    successStrategies: [
      'Create flashcards for key terms and theorists',
      'Relate concepts to real-world examples',
      'Understand experimental design and statistics',
      'Practice free response with clear definitions and examples',
      'Connect concepts across units',
    ],
    prerequisites: ['None formally, but maturity helps'],
    idealPreparation: 'Curiosity about human behavior, decent reading skills',
    pairsWellWith: ['AP Biology', 'AP Statistics', 'AP Sociology'],
    avoidTakingWith: [], // Generally compatible with any load
    naturalProgression: 'College psychology courses',
    typicalCredits: 3,
    majorRelevance: {
      'Psychology': 'essential',
      'Neuroscience': 'strongly_recommended',
      'Pre-Med': 'helpful',
      'Education': 'helpful',
      'Business': 'helpful',
    },
    commonFears: [
      {
        fear: "Is it really easier or is that a myth?",
        reality:
          "AP Psych has a higher pass rate and is generally considered more accessible. But 'easier' doesn't mean 'no effort' - you still need to learn substantial content.",
        advice:
          "If you're interested in psychology, this is a great AP to start with. Just don't treat it as a blow-off class.",
      },
    ],
    idealStudentProfile:
      'Curious about why people behave as they do, willing to learn vocabulary, interested in research',
    readinessIndicators: {
      ready: [
        'Curious about human behavior',
        'Can handle memorizing terminology',
        'Interested in applying concepts',
      ],
      notReady: [
        'Zero interest in psychology',
        'Struggles with vocabulary-heavy content',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // COMPUTER SCIENCE
  // -------------------------------------------------------------------------
  // -------------------------------------------------------------------------
  // ECONOMICS
  // -------------------------------------------------------------------------
  'AP Microeconomics': {
    name: 'AP Microeconomics',
    shortName: 'Micro',
    category: 'social_science',
    difficultyTier: 2,
    perceivedDifficulty: 'moderate',
    weeklyHours: { minimum: 3, typical: 5, intensive: 7 },
    passRate: 0.676,
    fiveRate: 0.229,
    averageScore: 3.24,
    challengeFactors: [
      'Requires understanding graphs and their interpretations',
      'Supply and demand analysis must become intuitive',
      'Elasticity calculations require careful attention',
      'Market structure comparisons can be confusing',
    ],
    successStrategies: [
      'Master supply and demand graphs thoroughly',
      'Practice drawing and labeling graphs from memory',
      'Understand the "why" behind each economic principle',
      'Connect concepts to real-world market examples',
      'Practice free response with proper economic terminology',
    ],
    prerequisites: ['Algebra 1'],
    idealPreparation: 'Basic algebra skills, interest in how markets work',
    pairsWellWith: ['AP Macroeconomics', 'AP Statistics', 'AP US Government'],
    avoidTakingWith: [],
    naturalProgression: 'AP Macroeconomics, College Economics',
    typicalCredits: 3,
    majorRelevance: {
      'Economics': 'essential',
      'Business': 'essential',
      'Political Science': 'helpful',
      'Pre-Law': 'helpful',
    },
    commonFears: [
      {
        fear: "I'm not good at math",
        reality:
          "Microeconomics requires only basic algebra. The challenge is conceptual understanding and graph interpretation, not complex calculations.",
        advice:
          "If you can read a graph and do basic algebra, you can handle Micro. Focus on understanding the logic behind economic principles.",
      },
    ],
    idealStudentProfile:
      'Curious about how businesses and consumers make decisions, comfortable with graphs, interested in real-world applications',
    readinessIndicators: {
      ready: [
        'Comfortable with basic algebra',
        'Can interpret graphs',
        'Interested in business or economics',
        'Enjoys analyzing decision-making',
      ],
      notReady: [
        'Struggles with basic algebra',
        'Uncomfortable with graph interpretation',
      ],
    },
  },

  'AP Macroeconomics': {
    name: 'AP Macroeconomics',
    shortName: 'Macro',
    category: 'social_science',
    difficultyTier: 2,
    perceivedDifficulty: 'moderate',
    weeklyHours: { minimum: 3, typical: 5, intensive: 7 },
    passRate: 0.651,
    fiveRate: 0.207,
    averageScore: 3.13,
    challengeFactors: [
      'Multiple economic models to master (AD-AS, Phillips Curve, etc.)',
      'Fiscal and monetary policy interactions can be confusing',
      'International trade concepts add complexity',
      'Free response requires clear policy analysis',
    ],
    successStrategies: [
      'Master the AD-AS model completely',
      'Understand how fiscal and monetary policy shift curves',
      'Practice tracing through economic scenarios step by step',
      'Connect concepts to current economic news',
      'Learn the differences between short-run and long-run effects',
    ],
    prerequisites: ['Algebra 1', 'AP Microeconomics helpful but not required'],
    idealPreparation: 'Basic algebra, interest in national/global economics',
    pairsWellWith: ['AP Microeconomics', 'AP US Government', 'AP US History'],
    avoidTakingWith: [],
    naturalProgression: 'College Economics courses',
    typicalCredits: 3,
    majorRelevance: {
      'Economics': 'essential',
      'Business': 'essential',
      'Political Science': 'strongly_recommended',
      'International Relations': 'strongly_recommended',
    },
    commonFears: [
      {
        fear: "Macro is more confusing than Micro",
        reality:
          "Different students find different aspects challenging. Macro deals with bigger-picture concepts which some find more intuitive, others more abstract.",
        advice:
          "If you're interested in how the economy works at a national level, Macro may actually be more engaging. Many students take both.",
      },
    ],
    idealStudentProfile:
      'Interested in how governments manage economies, follows economic news, comfortable with multiple interacting systems',
    readinessIndicators: {
      ready: [
        'Interested in national/global economics',
        'Can handle multiple interacting concepts',
        'Follows economic news',
        'Comfortable with cause-and-effect reasoning',
      ],
      notReady: [
        'No interest in economics or policy',
        'Struggles with abstract system thinking',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // GOVERNMENT
  // -------------------------------------------------------------------------
  'AP US Government': {
    name: 'AP United States Government and Politics',
    shortName: 'Gov',
    category: 'social_science',
    difficultyTier: 2,
    perceivedDifficulty: 'moderate',
    weeklyHours: { minimum: 4, typical: 5, intensive: 7 },
    passRate: 0.730,
    fiveRate: 0.243,
    averageScore: 3.38,
    challengeFactors: [
      'Must know foundational documents (Constitution, Federalist Papers)',
      'Supreme Court cases require memorization and understanding',
      'Free response questions require applying concepts to scenarios',
      'Current events knowledge enhances understanding',
    ],
    successStrategies: [
      'Know the key Supreme Court cases and their significance',
      'Understand the structure and powers of each branch',
      'Practice applying constitutional principles to scenarios',
      'Follow current political news to see concepts in action',
      'Master the required foundational documents',
    ],
    prerequisites: ['None, though US History background helps'],
    idealPreparation: 'Interest in politics, basic knowledge of US government structure',
    pairsWellWith: ['AP US History', 'AP English Language', 'AP Comparative Government'],
    avoidTakingWith: [],
    naturalProgression: 'AP Comparative Government, College Political Science',
    typicalCredits: 3,
    majorRelevance: {
      'Political Science': 'essential',
      'Pre-Law': 'essential',
      'Public Policy': 'essential',
      'Journalism': 'strongly_recommended',
      'History': 'helpful',
    },
    commonFears: [
      {
        fear: "I need to know everything about politics",
        reality:
          "The course focuses on how government works structurally, not partisan politics. You don't need prior political knowledge.",
        advice:
          "The course teaches you how government functions. Being interested in politics helps engagement, but isn't a prerequisite.",
      },
    ],
    idealStudentProfile:
      'Interested in how government works, enjoys debate and discussion, follows current events',
    readinessIndicators: {
      ready: [
        'Curious about how government works',
        'Enjoys discussing political/social issues',
        'Can memorize key facts and cases',
        'Good reading comprehension',
      ],
      notReady: [
        'Zero interest in politics or government',
        'Dislikes memorization',
      ],
    },
  },

  'AP Comparative Government': {
    name: 'AP Comparative Government and Politics',
    shortName: 'Comp Gov',
    category: 'social_science',
    difficultyTier: 2,
    perceivedDifficulty: 'moderate',
    weeklyHours: { minimum: 4, typical: 5, intensive: 7 },
    passRate: 0.730,
    fiveRate: 0.160,
    averageScore: 3.18,
    challengeFactors: [
      'Must learn details about 6 different countries',
      'Comparing political systems requires organized thinking',
      'Less commonly taught - fewer resources available',
      'Requires understanding different cultural contexts',
    ],
    successStrategies: [
      'Create comparison charts for the 6 countries',
      'Understand the key themes that run across all countries',
      'Study countries systematically, not randomly',
      'Use current events to reinforce country-specific knowledge',
      'Practice comparative essays that draw connections',
    ],
    prerequisites: ['AP US Government helpful but not required'],
    idealPreparation: 'Interest in international affairs, organized study habits',
    pairsWellWith: ['AP US Government', 'AP World History', 'AP Human Geography'],
    avoidTakingWith: [],
    naturalProgression: 'College International Relations, Political Science',
    typicalCredits: 3,
    majorRelevance: {
      'International Relations': 'essential',
      'Political Science': 'strongly_recommended',
      'Global Studies': 'essential',
      'Public Policy': 'helpful',
    },
    commonFears: [
      {
        fear: "I don't know anything about other countries",
        reality:
          "The course teaches you everything you need to know about the 6 countries studied. Prior knowledge isn't expected.",
        advice:
          "If you're curious about how other governments work, this course provides a structured introduction. The smaller class sizes often mean better discussions.",
      },
    ],
    idealStudentProfile:
      'Interested in world affairs, organized learner, enjoys comparing systems, globally curious',
    readinessIndicators: {
      ready: [
        'Interested in international affairs',
        'Can organize information across multiple topics',
        'Curious about other political systems',
        'Good at comparative analysis',
      ],
      notReady: [
        'Only interested in US politics',
        'Struggles with organizing multiple topics',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // ADDITIONAL HISTORY
  // -------------------------------------------------------------------------
  'AP World History': {
    name: 'AP World History: Modern',
    shortName: 'World',
    category: 'history',
    difficultyTier: 3,
    perceivedDifficulty: 'hard',
    weeklyHours: { minimum: 5, typical: 7, intensive: 9 },
    passRate: 0.637,
    fiveRate: 0.119,
    averageScore: 3.11,
    challengeFactors: [
      'Covers 1200 CE to present - vast scope',
      'Must understand connections across regions and time',
      'Often taken by sophomores with less essay experience',
      'Requires balancing breadth with depth',
      'DBQ and LEQ require specific historical thinking skills',
    ],
    successStrategies: [
      'Focus on themes and patterns, not isolated facts',
      'Create timelines connecting events across regions',
      'Practice DBQ analysis with primary sources',
      'Understand causation and comparison frameworks',
      'Study the AP themes: humans and environment, cultural developments, governance, etc.',
    ],
    prerequisites: ['None formally'],
    idealPreparation: 'Strong reading skills, curiosity about global history',
    pairsWellWith: ['AP Human Geography', 'AP English Language'],
    avoidTakingWith: ['AP European History in same year'],
    naturalProgression: 'AP US History, AP European History, College history',
    typicalCredits: 3,
    majorRelevance: {
      'History': 'strongly_recommended',
      'International Relations': 'strongly_recommended',
      'Anthropology': 'helpful',
      'Global Studies': 'essential',
    },
    commonFears: [
      {
        fear: "There's too much content to memorize",
        reality:
          "AP World has shifted toward understanding patterns and making connections. You need to know content, but the exam rewards analysis over memorization.",
        advice:
          "Focus on the big themes that appear across time and place. When you understand WHY things happened, the facts become easier to remember.",
      },
    ],
    idealStudentProfile:
      'Curious about different cultures, enjoys seeing patterns, can handle broad scope with less depth',
    readinessIndicators: {
      ready: [
        'Strong reading comprehension',
        'Enjoys learning about different cultures',
        'Can see patterns and connections',
        'Developing essay writing skills',
      ],
      notReady: [
        'Prefers deep dive into single topics',
        'Struggles with reading comprehension',
        'New to analytical writing',
      ],
    },
  },

  'AP European History': {
    name: 'AP European History',
    shortName: 'Euro',
    category: 'history',
    difficultyTier: 4,
    perceivedDifficulty: 'hard',
    weeklyHours: { minimum: 5, typical: 7, intensive: 10 },
    passRate: 0.716,
    fiveRate: 0.131,
    averageScore: 3.23,
    challengeFactors: [
      'Dense content from 1450 to present',
      'Requires understanding complex political and philosophical movements',
      'Smaller, more self-selected student population',
      'Heavy reading load with primary sources',
      'Must analyze art, literature, and cultural developments',
    ],
    successStrategies: [
      'Create chronological frameworks for major periods',
      'Understand the "isms": nationalism, liberalism, socialism, etc.',
      'Connect political, economic, social, and cultural developments',
      'Practice with primary sources regularly',
      'Study artistic and intellectual movements in context',
    ],
    prerequisites: ['Prior history coursework recommended'],
    idealPreparation: 'Strong interest in European culture and history, excellent reading skills',
    pairsWellWith: ['AP Art History', 'AP English Literature'],
    avoidTakingWith: ['AP World History in same year'],
    naturalProgression: 'College European history, Art History',
    typicalCredits: 3,
    majorRelevance: {
      'History': 'essential',
      'Art History': 'strongly_recommended',
      'Philosophy': 'helpful',
      'International Relations': 'helpful',
    },
    commonFears: [
      {
        fear: "I don't know anything about European history",
        reality:
          "The course starts from the beginning of the modern period. Prior knowledge helps but isn't required.",
        advice:
          "If you're genuinely interested in European culture, history, and ideas, this course provides deep engagement. The higher pass rate reflects a motivated student population.",
      },
    ],
    idealStudentProfile:
      'Deep interest in European history and culture, strong reader, enjoys intellectual history',
    readinessIndicators: {
      ready: [
        'Strong interest in European history/culture',
        'Excellent reading comprehension',
        'Enjoys analyzing ideas and movements',
        'Can handle dense content',
      ],
      notReady: [
        'No particular interest in Europe',
        'Struggles with analytical reading',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // ARTS
  // -------------------------------------------------------------------------
  'AP Art History': {
    name: 'AP Art History',
    shortName: 'Art Hist',
    category: 'arts',
    difficultyTier: 3,
    perceivedDifficulty: 'moderate',
    weeklyHours: { minimum: 4, typical: 6, intensive: 8 },
    passRate: 0.627,
    fiveRate: 0.139,
    averageScore: 2.99,
    challengeFactors: [
      '250 required images to identify and analyze',
      'Must understand art in cultural/historical context',
      'Visual analysis skills require practice',
      'Covers global art traditions, not just Western',
      'Essay questions require specific evidence',
    ],
    successStrategies: [
      'Create flashcards for all 250 required images',
      'Practice visual analysis vocabulary',
      'Connect works to their historical/cultural contexts',
      'Study art movements and their characteristics',
      'Practice comparing works across cultures and time',
    ],
    prerequisites: ['None, though history background helps'],
    idealPreparation: 'Interest in art and visual culture, good memory for visual details',
    pairsWellWith: ['AP European History', 'AP World History', 'AP English Literature'],
    avoidTakingWith: [],
    naturalProgression: 'College art history, Museum studies',
    typicalCredits: 3,
    majorRelevance: {
      'Art History': 'essential',
      'Fine Arts': 'strongly_recommended',
      'Architecture': 'helpful',
      'Museum Studies': 'essential',
      'Humanities': 'helpful',
    },
    commonFears: [
      {
        fear: "I can't draw - will I fail?",
        reality:
          "AP Art History is about analysis and history, not creating art. You never need to draw or create anything artistic.",
        advice:
          "This course is for people who love looking at and thinking about art. Studio skills are completely separate from what's tested.",
      },
    ],
    idealStudentProfile:
      'Loves visual art, curious about cultural context, good visual memory, enjoys analysis',
    readinessIndicators: {
      ready: [
        'Interested in art and visual culture',
        'Good memory for visual details',
        'Enjoys learning about history and culture',
        'Can write analytical essays',
      ],
      notReady: [
        'No interest in art or visual culture',
        'Struggles with visual memory',
      ],
    },
  },

  'AP Music Theory': {
    name: 'AP Music Theory',
    shortName: 'Music',
    category: 'arts',
    difficultyTier: 3,
    perceivedDifficulty: 'moderate',
    weeklyHours: { minimum: 4, typical: 6, intensive: 8 },
    passRate: 0.602,
    fiveRate: 0.190,
    averageScore: 3.01,
    challengeFactors: [
      'Requires prior music reading ability',
      'Aural skills (sight-singing, dictation) are challenging',
      'Part-writing has strict rules to follow',
      'Must analyze musical scores and harmonic progressions',
      'Less commonly taught - may need to self-study portions',
    ],
    successStrategies: [
      'Practice sight-singing and ear training daily',
      'Master the rules of voice leading and part writing',
      'Analyze scores regularly to internalize patterns',
      'Use apps and software for ear training practice',
      'Study chord progressions and their functions',
    ],
    prerequisites: ['Music reading ability', '2+ years of music instruction'],
    idealPreparation: 'Ability to read music, play an instrument or sing, understand basic theory',
    pairsWellWith: ['AP Art History', 'Private music lessons'],
    avoidTakingWith: [],
    naturalProgression: 'College music theory, Music major',
    typicalCredits: 3,
    majorRelevance: {
      'Music': 'essential',
      'Music Education': 'essential',
      'Music Production': 'strongly_recommended',
      'Performing Arts': 'helpful',
    },
    commonFears: [
      {
        fear: "The ear training will be impossible",
        reality:
          "Ear training is a skill that improves with practice. Most students struggle initially but improve significantly over the year.",
        advice:
          "Start practicing ear training early and often. Apps like EarMaster or teoria.com can help. Daily practice beats cramming.",
      },
    ],
    idealStudentProfile:
      'Active musician with theory background, willing to practice ear training, interested in how music works',
    readinessIndicators: {
      ready: [
        'Can read music notation',
        'Play an instrument or sing at intermediate+ level',
        'Understand basic theory (scales, chords)',
        'Willing to practice ear training',
      ],
      notReady: [
        'Cannot read music',
        'No instrumental/vocal experience',
        'Never studied music theory',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // ENVIRONMENTAL SCIENCE
  // -------------------------------------------------------------------------
  'AP Environmental Science': {
    name: 'AP Environmental Science',
    shortName: 'APES',
    category: 'science',
    difficultyTier: 2,
    perceivedDifficulty: 'moderate',
    weeklyHours: { minimum: 4, typical: 5, intensive: 7 },
    passRate: 0.541,
    fiveRate: 0.092,
    averageScore: 2.80,
    challengeFactors: [
      'Interdisciplinary - biology, chemistry, earth science',
      'Large amount of content across many domains',
      'Free response requires data analysis and calculations',
      'Must understand policy implications alongside science',
      'Low rate of 5s indicates challenging scoring',
    ],
    successStrategies: [
      'Connect topics to real environmental issues',
      'Master unit conversions and basic calculations',
      'Understand feedback loops and system interactions',
      'Practice data analysis and experimental design',
      'Study the policy and economic dimensions alongside science',
    ],
    prerequisites: ['Biology recommended', 'Basic chemistry helpful'],
    idealPreparation: 'Interest in environment, some biology background, comfortable with interdisciplinary content',
    pairsWellWith: ['AP Biology', 'AP Statistics', 'AP Human Geography'],
    avoidTakingWith: [],
    naturalProgression: 'College environmental science, Ecology courses',
    typicalCredits: 4,
    majorRelevance: {
      'Environmental Science': 'essential',
      'Biology': 'helpful',
      'Public Policy': 'helpful',
      'Sustainability': 'essential',
    },
    commonFears: [
      {
        fear: "It's an easy science AP",
        reality:
          "The 54.1% pass rate and 9.2% rate of 5s suggest it's harder than often assumed. The breadth of content and interdisciplinary nature challenge many students.",
        advice:
          "Don't underestimate APES. It requires consistent effort across many topics. If you're genuinely interested in environmental issues, the content is engaging.",
      },
    ],
    idealStudentProfile:
      'Passionate about environmental issues, comfortable with interdisciplinary science, good at connecting concepts',
    readinessIndicators: {
      ready: [
        'Interested in environmental issues',
        'Basic biology background',
        'Comfortable with math calculations',
        'Can handle broad content coverage',
      ],
      notReady: [
        'No interest in environment',
        'Struggles with interdisciplinary content',
        'Weak math skills',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // COMPUTER SCIENCE
  // -------------------------------------------------------------------------
  'AP Computer Science A': {
    name: 'AP Computer Science A',
    shortName: 'CS A',
    category: 'cs',
    difficultyTier: 3,
    perceivedDifficulty: 'moderate',
    weeklyHours: { minimum: 5, typical: 7, intensive: 10 },
    passRate: 0.672,
    fiveRate: 0.256,
    averageScore: 3.18,
    challengeFactors: [
      'Requires logical/algorithmic thinking',
      'Object-oriented programming concepts are abstract',
      'Debugging and tracing code on paper',
      'Recursive thinking is challenging for many',
      'Array and ArrayList manipulation',
    ],
    successStrategies: [
      'Code regularly - practice is essential',
      'Trace through code by hand to understand execution',
      'Master the fundamentals before moving to advanced topics',
      'Practice writing code on paper for the exam',
      'Use debugging systematically',
      'Build projects outside class to reinforce learning',
    ],
    prerequisites: ['Algebra 2', 'Some prior programming helpful but not required'],
    idealPreparation: 'Strong logical thinking, ideally some coding experience, good problem-solving skills',
    pairsWellWith: ['AP Calculus', 'AP Statistics', 'AP Physics C'],
    avoidTakingWith: [],
    naturalProgression: 'College CS courses, data structures',
    typicalCredits: 3,
    majorRelevance: {
      'Computer Science': 'essential',
      'Engineering': 'strongly_recommended',
      'Data Science': 'essential',
      'Mathematics': 'helpful',
    },
    commonFears: [
      {
        fear: "I've never coded before - I'll be lost",
        reality:
          "Many students take AP CS A as their first programming course. The class starts from basics. Prior experience helps but isn't required.",
        advice:
          "If you enjoy problem-solving and logic puzzles, you can succeed without prior coding experience. Just commit to practicing regularly.",
      },
      {
        fear: "It's too technical for me",
        reality:
          "AP CS A is more about logical thinking than technical complexity. If you can break problems into steps, you have the core skill.",
        advice:
          "Think of programming as problem-solving with a specific tool. The 'technical' parts become natural with practice.",
      },
    ],
    idealStudentProfile:
      'Logical thinker, enjoys puzzles, patient with debugging, interested in technology',
    readinessIndicators: {
      ready: [
        'Enjoys logic puzzles and problem-solving',
        'Comfortable with algebra',
        'Patient and persistent',
        'Interested in how software works',
      ],
      notReady: [
        'Gets frustrated quickly when things don\'t work',
        'Dislikes systematic/step-by-step thinking',
        'Struggles with abstract concepts',
      ],
    },
  },

  'AP Computer Science Principles': {
    name: 'AP Computer Science Principles',
    shortName: 'CSP',
    category: 'cs',
    difficultyTier: 1,
    perceivedDifficulty: 'accessible',
    weeklyHours: { minimum: 3, typical: 5, intensive: 7 },
    passRate: 0.640,
    fiveRate: 0.109,
    averageScore: 2.90,
    challengeFactors: [
      'Create Performance Task requires sustained independent project work',
      'Covers breadth of computing topics rather than deep programming',
      'Internet and cybersecurity concepts can be abstract',
      'Data analysis requires interpreting computational artifacts',
      'Low rate of 5s (10.9%) despite accessible content',
    ],
    successStrategies: [
      'Start the Create Performance Task early - it counts for 30% of your score',
      'Understand the big ideas: Creative Development, Data, Algorithms, Internet, Impact',
      'Practice with pseudocode - the exam uses its own pseudocode format',
      'Connect computing concepts to real-world applications',
      'Build projects that demonstrate your understanding',
    ],
    prerequisites: ['None - designed as a first computing course'],
    idealPreparation: 'Curiosity about technology, basic computer literacy',
    pairsWellWith: ['AP Computer Science A', 'AP Statistics'],
    avoidTakingWith: [],
    naturalProgression: 'AP Computer Science A, College introductory CS',
    typicalCredits: 3,
    majorRelevance: {
      'Computer Science': 'helpful',
      'Data Science': 'helpful',
      'Digital Media': 'helpful',
      'Any Major': 'helpful',
    },
    commonFears: [
      {
        fear: "I'm not a 'tech person'",
        reality:
          "CSP is designed for students with NO prior computing experience. It's about understanding computing's role in the world, not becoming a programmer.",
        advice:
          "If you use a smartphone, you already interact with computing daily. This course helps you understand the systems you already use.",
      },
    ],
    idealStudentProfile:
      'Curious about technology, wants to understand computing without deep programming, exploring CS interest',
    readinessIndicators: {
      ready: [
        'Basic computer literacy',
        'Curious about how technology works',
        'Willing to learn some coding basics',
        'Interested in how data is used',
      ],
      notReady: [
        'Zero interest in technology',
        'Expects a purely coding-focused course',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // PRECALCULUS
  // -------------------------------------------------------------------------
  'AP Precalculus': {
    name: 'AP Precalculus',
    shortName: 'PreCalc',
    category: 'math',
    difficultyTier: 2,
    perceivedDifficulty: 'moderate',
    weeklyHours: { minimum: 4, typical: 6, intensive: 8 },
    passRate: 0.757,
    fiveRate: 0.259,
    averageScore: 3.42,
    challengeFactors: [
      'New AP course (first exam 2024) - fewer established resources',
      'Trigonometric functions require strong unit circle mastery',
      'Exponential and logarithmic modeling is conceptually demanding',
      'Polynomial behavior analysis requires graphical thinking',
      'Must connect algebraic and graphical representations fluently',
    ],
    successStrategies: [
      'Master the unit circle completely - it underpins all trig work',
      'Practice function transformations until they become intuitive',
      'Use graphing technology to build visual intuition',
      'Connect every algebraic technique to its graphical meaning',
      'Build strong algebra skills - they carry through to calculus',
    ],
    prerequisites: ['Algebra 2'],
    idealPreparation: 'Solid Algebra 2 performance, comfortable with functions and graphing',
    pairsWellWith: ['AP Statistics', 'AP Physics 1'],
    avoidTakingWith: ['AP Calculus AB in same year'],
    naturalProgression: 'AP Calculus AB or BC',
    typicalCredits: 3,
    majorRelevance: {
      'STEM fields': 'essential',
      'Engineering': 'essential',
      'Business': 'helpful',
      'Economics': 'helpful',
    },
    commonFears: [
      {
        fear: "I struggled with Algebra 2 - can I handle this?",
        reality:
          "AP Precalculus builds directly on Algebra 2. The 75.7% pass rate is encouraging, but if you struggled with Algebra 2, address those gaps first.",
        advice:
          "If your Algebra 2 grade was a B or better with genuine understanding, you're ready. If it was lower, consider reviewing key concepts over the summer.",
      },
    ],
    idealStudentProfile:
      'Solid algebra student building toward calculus, comfortable with functions and graphs',
    readinessIndicators: {
      ready: [
        'B+ or better in Algebra 2',
        'Comfortable with functions and graphs',
        'Can work with fractions and rational expressions',
        'Developing mathematical reasoning',
      ],
      notReady: [
        'Struggles with basic algebra',
        'Uncomfortable with graphing',
        'Hasn\'t completed Algebra 2',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // ADDITIONAL PHYSICS
  // -------------------------------------------------------------------------
  'AP Physics 2': {
    name: 'AP Physics 2: Algebra-Based',
    shortName: 'Physics 2',
    category: 'science',
    difficultyTier: 3,
    perceivedDifficulty: 'hard',
    weeklyHours: { minimum: 5, typical: 7, intensive: 10 },
    passRate: 0.705,
    fiveRate: 0.191,
    averageScore: 3.20,
    challengeFactors: [
      'Abstract topics: thermodynamics, optics, electricity, magnetism, modern physics',
      'Requires strong conceptual reasoning about invisible phenomena',
      'Lab-based questions test experimental design skills',
      'Fewer students take it - less peer support available',
      'Builds on Physics 1 knowledge',
    ],
    successStrategies: [
      'Develop strong visual models for electric and magnetic fields',
      'Master circuit analysis systematically',
      'Connect thermodynamics to everyday phenomena',
      'Practice wave optics and interference pattern analysis',
      'Review Physics 1 concepts as needed - they remain relevant',
    ],
    prerequisites: ['AP Physics 1', 'Algebra 2'],
    idealPreparation: 'Solid performance in AP Physics 1, strong conceptual thinking',
    pairsWellWith: ['AP Chemistry', 'AP Calculus'],
    avoidTakingWith: ['AP Physics C: E&M in same year'],
    naturalProgression: 'College physics, Pre-med physics sequence',
    typicalCredits: 4,
    majorRelevance: {
      'Pre-Med': 'strongly_recommended',
      'Biology': 'helpful',
      'Environmental Science': 'helpful',
      'Architecture': 'helpful',
    },
    commonFears: [
      {
        fear: "Physics 1 was really hard - Physics 2 must be worse",
        reality:
          "The pass rate is actually much higher (70.5% vs 47.3%) because the self-selected population is better prepared. Many students find specific Physics 2 topics (like optics) more intuitive than mechanics.",
        advice:
          "If you passed Physics 1 with a B or better, you've already developed the conceptual thinking needed. Physics 2 topics are different, not necessarily harder.",
      },
    ],
    idealStudentProfile:
      'Completed Physics 1, interested in understanding how the physical world works at a deeper level, pre-med or science-oriented',
    readinessIndicators: {
      ready: [
        'B+ or better in AP Physics 1',
        'Comfortable with conceptual reasoning',
        'Can visualize abstract physical systems',
        'Interested in thermodynamics, electricity, or optics',
      ],
      notReady: [
        'Struggled with Physics 1',
        'Uncomfortable with abstract reasoning',
        'Only taking it because it\'s "required"',
      ],
    },
  },

  'AP Physics C: E&M': {
    name: 'AP Physics C: Electricity and Magnetism',
    shortName: 'Physics C E&M',
    category: 'science',
    difficultyTier: 5,
    perceivedDifficulty: 'very_hard',
    weeklyHours: { minimum: 6, typical: 9, intensive: 12 },
    passRate: 0.716,
    fiveRate: 0.352,
    averageScore: 3.53,
    challengeFactors: [
      'Requires multivariable calculus concepts (surface integrals, flux)',
      'Electromagnetic fields are inherently abstract and 3D',
      'Gauss\'s Law and Ampere\'s Law require sophisticated mathematical reasoning',
      'Circuit analysis with capacitors and inductors adds complexity',
      'Maxwell\'s equations synthesize everything at a high level',
    ],
    successStrategies: [
      'Take concurrently with or after Calculus BC',
      'Develop strong 3D spatial reasoning for field concepts',
      'Master Gauss\'s Law problem-solving technique thoroughly',
      'Practice circuit analysis systematically',
      'Use the right-hand rule until it becomes automatic',
    ],
    prerequisites: ['AP Physics C: Mechanics', 'AP Calculus BC (concurrent OK)'],
    idealPreparation: 'Strong performance in Physics C: Mechanics, calculus proficiency, excellent mathematical reasoning',
    pairsWellWith: ['AP Calculus BC', 'AP Physics C: Mechanics'],
    avoidTakingWith: ['AP Physics 2 (redundant at this level)'],
    naturalProgression: 'College E&M, Quantum Mechanics, Engineering courses',
    typicalCredits: 4,
    majorRelevance: {
      'Electrical Engineering': 'essential',
      'Physics': 'essential',
      'Engineering': 'strongly_recommended',
      'Computer Engineering': 'essential',
    },
    commonFears: [
      {
        fear: "E&M is the hardest AP course",
        reality:
          "It's conceptually challenging, but the 35.2% rate of 5s is one of the highest among all AP courses - the self-selected population succeeds at high rates. The math actually makes the physics more clear, not harder.",
        advice:
          "If you excelled in Physics C: Mechanics and are comfortable with calculus, E&M is very manageable. The math provides tools that make electromagnetic concepts more concrete.",
      },
    ],
    idealStudentProfile:
      'Strong physics and calculus student, future engineer or physicist, comfortable with abstract mathematical reasoning',
    readinessIndicators: {
      ready: [
        'A/A- in Physics C: Mechanics',
        'Proficient with calculus (AB minimum, BC preferred)',
        'Strong 3D spatial reasoning',
        'Comfortable with abstract mathematical physics',
      ],
      notReady: [
        'Hasn\'t taken Physics C: Mechanics',
        'Struggles with calculus',
        'Uncomfortable with abstract reasoning',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // ADDITIONAL SOCIAL STUDIES
  // -------------------------------------------------------------------------
  'AP Human Geography': {
    name: 'AP Human Geography',
    shortName: 'HuGeo',
    category: 'social_science',
    difficultyTier: 1,
    perceivedDifficulty: 'accessible',
    weeklyHours: { minimum: 3, typical: 4, intensive: 6 },
    passRate: 0.562,
    fiveRate: 0.179,
    averageScore: 2.83,
    challengeFactors: [
      'Often taken by 9th/10th graders with limited AP experience',
      'Wide range of topics: population, culture, agriculture, cities, politics',
      'Free response requires geographical analysis skills',
      'Models and theories must be applied to real-world scenarios',
      'Map interpretation and spatial analysis',
    ],
    successStrategies: [
      'Learn to read and analyze maps, charts, and data',
      'Master the key models (demographic transition, urban models, etc.)',
      'Connect concepts to current events and your own community',
      'Practice free response with geographic vocabulary',
      'Create visual study aids - geography is inherently spatial',
    ],
    prerequisites: ['None - commonly a first AP course'],
    idealPreparation: 'Curiosity about the world, basic map reading skills',
    pairsWellWith: ['AP World History', 'AP Environmental Science'],
    avoidTakingWith: [],
    naturalProgression: 'AP World History, AP US History, AP Environmental Science',
    typicalCredits: 3,
    majorRelevance: {
      'Geography': 'essential',
      'Urban Planning': 'strongly_recommended',
      'Environmental Science': 'helpful',
      'International Relations': 'helpful',
      'Sociology': 'helpful',
    },
    commonFears: [
      {
        fear: "I'm only a freshman/sophomore - can I handle AP?",
        reality:
          "AP Human Geography is specifically designed as an entry-level AP. The content is engaging and relevant to everyday life. It's an excellent first AP experience.",
        advice:
          "This course builds skills you'll use in every future AP social studies class. The 56.2% pass rate reflects the younger student population, not extreme difficulty.",
      },
    ],
    idealStudentProfile:
      'Curious about cultures and places, interested in how humans interact with their environment, ready for first AP experience',
    readinessIndicators: {
      ready: [
        'Curious about different cultures and places',
        'Can read maps and basic data displays',
        'Willing to engage with writing assignments',
        'Interested in world issues',
      ],
      notReady: [
        'Completely uninterested in geography or social studies',
        'Not ready for AP-level reading and writing',
      ],
    },
  },

  'AP African American Studies': {
    name: 'AP African American Studies',
    shortName: 'AAS',
    category: 'social_science',
    difficultyTier: 2,
    perceivedDifficulty: 'moderate',
    weeklyHours: { minimum: 4, typical: 5, intensive: 7 },
    passRate: 0.726,
    fiveRate: 0.142,
    averageScore: 3.22,
    challengeFactors: [
      'Interdisciplinary approach spans history, literature, arts, and social science',
      'Requires engagement with primary sources across multiple disciplines',
      'Must analyze perspectives from different academic fields',
      'Performance task requires original research and argumentation',
      'New course with fewer established study resources',
    ],
    successStrategies: [
      'Engage deeply with primary sources - literature, speeches, art',
      'Build connections across the four units chronologically',
      'Practice interdisciplinary analysis - blend historical and literary perspectives',
      'Start the performance task research early',
      'Connect course content to contemporary issues and movements',
    ],
    prerequisites: ['None, though prior history or English coursework helps'],
    idealPreparation: 'Interest in American history and culture, strong reading and analytical skills',
    pairsWellWith: ['AP US History', 'AP English Literature', 'AP US Government'],
    avoidTakingWith: [],
    naturalProgression: 'College African American Studies, American Studies, History',
    typicalCredits: 3,
    majorRelevance: {
      'African American Studies': 'essential',
      'History': 'strongly_recommended',
      'Sociology': 'strongly_recommended',
      'Political Science': 'helpful',
      'English': 'helpful',
    },
    commonFears: [
      {
        fear: "It's a brand new AP - is it worth taking?",
        reality:
          "The 72.6% pass rate in its first full year is strong, showing the curriculum is well-designed. Colleges recognize and value the interdisciplinary rigor.",
        advice:
          "New doesn't mean untested. The College Board developed this over years with leading scholars. It demonstrates intellectual curiosity and interdisciplinary thinking.",
      },
    ],
    idealStudentProfile:
      'Interested in American history and culture, comfortable with interdisciplinary analysis, strong reader and writer',
    readinessIndicators: {
      ready: [
        'Interested in African American history and culture',
        'Strong reading comprehension',
        'Can analyze texts from multiple perspectives',
        'Comfortable with analytical writing',
      ],
      notReady: [
        'Not interested in historical or cultural analysis',
        'Struggles with reading comprehension',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // AP CAPSTONE
  // -------------------------------------------------------------------------
  'AP Seminar': {
    name: 'AP Seminar',
    shortName: 'Seminar',
    category: 'interdisciplinary',
    difficultyTier: 3,
    perceivedDifficulty: 'moderate',
    weeklyHours: { minimum: 4, typical: 6, intensive: 8 },
    passRate: 0.857,
    fiveRate: 0.094,
    averageScore: 3.20,
    challengeFactors: [
      'Performance-based assessment (team project and individual presentation)',
      'Requires original research and source evaluation skills',
      'Team collaboration and oral presentation components',
      'Must synthesize multiple perspectives on complex issues',
      'Low rate of 5s (9.4%) despite high pass rate - excellence is hard to achieve',
    ],
    successStrategies: [
      'Develop strong research skills early - learn to find and evaluate sources',
      'Practice oral presentation and argumentation',
      'Build effective team collaboration habits',
      'Master the QUEST framework (Question, Understand, Evaluate, Synthesize, Transform)',
      'Start preparing for the Individual Research Report well in advance',
    ],
    prerequisites: ['None, though strong English skills help'],
    idealPreparation: 'Strong reading, writing, and critical thinking skills; comfort with public speaking',
    pairsWellWith: ['AP Research (year 2 of Capstone)', 'Any other AP courses'],
    avoidTakingWith: [],
    naturalProgression: 'AP Research, College research and writing courses',
    typicalCredits: 3,
    majorRelevance: {
      'Any Major': 'helpful',
      'Pre-Law': 'strongly_recommended',
      'Communications': 'strongly_recommended',
      'Public Policy': 'helpful',
    },
    commonFears: [
      {
        fear: "I hate group projects",
        reality:
          "The team component teaches real-world collaboration skills that colleges and employers value. You'll also have substantial individual work.",
        advice:
          "The skills you build in collaborative research and presentation are exactly what college seminars and professional work require. Lean into it.",
      },
    ],
    idealStudentProfile:
      'Strong communicator, curious about multiple topics, comfortable with research and public speaking',
    readinessIndicators: {
      ready: [
        'Strong reading and writing skills',
        'Comfortable with research and citations',
        'Willing to present in front of others',
        'Can work effectively in teams',
      ],
      notReady: [
        'Avoids writing at all costs',
        'Extremely uncomfortable with public speaking',
        'Unable to collaborate with peers',
      ],
    },
  },

  'AP Research': {
    name: 'AP Research',
    shortName: 'Research',
    category: 'interdisciplinary',
    difficultyTier: 4,
    perceivedDifficulty: 'hard',
    weeklyHours: { minimum: 5, typical: 8, intensive: 12 },
    passRate: 0.861,
    fiveRate: 0.126,
    averageScore: 3.35,
    challengeFactors: [
      'Year-long independent research project (4000-5000 word academic paper)',
      'Must identify a genuine gap in existing research',
      'Requires rigorous methodology (qualitative or quantitative)',
      'Oral defense of research before a panel',
      'Self-directed with minimal structured curriculum',
      'Must navigate IRB-like ethical review for human subjects research',
    ],
    successStrategies: [
      'Choose a topic you genuinely care about - you\'ll spend a full year on it',
      'Find a faculty advisor or mentor in your research area',
      'Develop your research question carefully before diving in',
      'Build a literature review first to understand what already exists',
      'Plan your methodology early and stick to your timeline',
      'Practice your oral defense multiple times',
    ],
    prerequisites: ['AP Seminar'],
    idealPreparation: 'Completed AP Seminar, identified research interest, strong independent work ethic',
    pairsWellWith: ['Any AP course related to your research topic'],
    avoidTakingWith: [],
    naturalProgression: 'College honors thesis, Research opportunities',
    typicalCredits: 3,
    majorRelevance: {
      'Any Research-Intensive Major': 'strongly_recommended',
      'Sciences': 'strongly_recommended',
      'Social Sciences': 'strongly_recommended',
      'Humanities': 'helpful',
    },
    commonFears: [
      {
        fear: "I don't know how to do real research",
        reality:
          "That's exactly what the course teaches. AP Seminar provides the foundation, and your AP Research teacher guides you through the process.",
        advice:
          "The 86.1% pass rate shows that students who complete Seminar are well-prepared. Your teacher and any external mentors will support you throughout.",
      },
    ],
    idealStudentProfile:
      'Self-motivated, intellectually curious, interested in original inquiry, strong writer, completed AP Seminar',
    readinessIndicators: {
      ready: [
        'Successfully completed AP Seminar',
        'Has a research interest or question',
        'Strong self-discipline and time management',
        'Comfortable with independent work',
      ],
      notReady: [
        'Hasn\'t completed AP Seminar',
        'Struggles with self-directed work',
        'No interest in research methodology',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // STUDIO ART & DESIGN
  // -------------------------------------------------------------------------
  'AP 2D Art and Design': {
    name: 'AP 2-D Art and Design',
    shortName: '2D Art',
    category: 'arts',
    difficultyTier: 3,
    perceivedDifficulty: 'moderate',
    weeklyHours: { minimum: 5, typical: 8, intensive: 12 },
    passRate: 0.828,
    fiveRate: 0.112,
    averageScore: 3.31,
    challengeFactors: [
      'Portfolio-based - no traditional exam (scored 1-6 on portfolio quality)',
      'Sustained Investigation requires 15 works exploring a single inquiry',
      'Must demonstrate mastery of 2D design principles',
      'Selected Works section requires 5 of your best pieces with written justification',
      'Time management across a year-long project is critical',
    ],
    successStrategies: [
      'Develop your Sustained Investigation theme early in the year',
      'Document your process thoroughly - development matters as much as final product',
      'Seek feedback regularly from your teacher and peers',
      'Experiment with multiple 2D media (photography, graphic design, painting, printmaking)',
      'Write clear artist statements connecting your work to your inquiry',
    ],
    prerequisites: ['At least one art course recommended'],
    idealPreparation: 'Experience with 2D art media, developing artistic voice, interest in design principles',
    pairsWellWith: ['AP Art History', 'AP Drawing'],
    avoidTakingWith: [],
    naturalProgression: 'College studio art, Design programs',
    typicalCredits: 3,
    majorRelevance: {
      'Graphic Design': 'essential',
      'Fine Arts': 'essential',
      'Photography': 'strongly_recommended',
      'Architecture': 'helpful',
      'Film': 'helpful',
    },
    commonFears: [
      {
        fear: "My art isn't good enough for AP",
        reality:
          "The 82.8% pass rate shows that committed students succeed. The portfolio evaluates growth and investigation, not just technical perfection.",
        advice:
          "AP Art is about demonstrating artistic thinking and growth. A strong Sustained Investigation with clear development often scores better than technically perfect but disconnected pieces.",
      },
    ],
    idealStudentProfile:
      'Creative with 2D media, interested in design and visual communication, self-motivated, willing to develop a sustained body of work',
    readinessIndicators: {
      ready: [
        'Experience with at least one 2D medium',
        'Willing to create a sustained body of work',
        'Can articulate ideas about art and design',
        'Self-motivated and can work independently',
      ],
      notReady: [
        'No experience with 2D art',
        'Unwilling to invest significant studio time',
      ],
    },
  },

  'AP 3D Art and Design': {
    name: 'AP 3-D Art and Design',
    shortName: '3D Art',
    category: 'arts',
    difficultyTier: 3,
    perceivedDifficulty: 'hard',
    weeklyHours: { minimum: 5, typical: 8, intensive: 12 },
    passRate: 0.719,
    fiveRate: 0.062,
    averageScore: 3.04,
    challengeFactors: [
      'Only 6.2% earn 5s - the lowest five-rate among all AP courses',
      'Requires access to specialized materials and equipment',
      'Photography documentation of 3D work is a skill in itself',
      'Sustained Investigation in three dimensions is logistically demanding',
      'Fewer students take it - less peer collaboration available',
    ],
    successStrategies: [
      'Master photography of 3D work - documentation quality affects scoring',
      'Experiment broadly with materials (ceramics, sculpture, jewelry, fiber)',
      'Develop your Sustained Investigation theme with 3D-specific considerations',
      'Plan for drying, firing, and curing times in your schedule',
      'Photograph work from multiple angles with clean backgrounds',
    ],
    prerequisites: ['Previous sculpture, ceramics, or 3D design coursework recommended'],
    idealPreparation: 'Experience with 3D media, spatial thinking, patience with materials',
    pairsWellWith: ['AP Art History', 'AP 2D Art and Design'],
    avoidTakingWith: [],
    naturalProgression: 'College sculpture, Ceramics, Industrial design',
    typicalCredits: 3,
    majorRelevance: {
      'Sculpture': 'essential',
      'Ceramics': 'essential',
      'Industrial Design': 'strongly_recommended',
      'Architecture': 'helpful',
      'Fine Arts': 'essential',
    },
    commonFears: [
      {
        fear: "The 6.2% five-rate is terrifying",
        reality:
          "The low five-rate reflects the challenge of achieving excellence in 3D work, not widespread failure. The 71.9% pass rate shows most students do well.",
        advice:
          "Focus on artistic growth and clear investigation, not chasing a 5. A strong portfolio with genuine artistic development serves you well regardless of the score.",
      },
    ],
    idealStudentProfile:
      'Experienced with 3D materials, spatial thinker, patient with process, strong documentation skills',
    readinessIndicators: {
      ready: [
        'Experience with 3D art media',
        'Access to studio space and materials',
        'Comfortable with messy, hands-on processes',
        'Can photograph work effectively',
      ],
      notReady: [
        'No 3D art experience',
        'No access to studio facilities',
        'Impatient with slow processes',
      ],
    },
  },

  'AP Drawing': {
    name: 'AP Drawing',
    shortName: 'Drawing',
    category: 'arts',
    difficultyTier: 3,
    perceivedDifficulty: 'moderate',
    weeklyHours: { minimum: 5, typical: 8, intensive: 12 },
    passRate: 0.838,
    fiveRate: 0.151,
    averageScore: 3.42,
    challengeFactors: [
      'Portfolio requires demonstrating mark-making as a primary means of expression',
      'Sustained Investigation demands conceptual depth, not just technical skill',
      'Must show range within drawing media (pencil, pen, charcoal, pastel, etc.)',
      'Observational drawing skills are essential',
      'Selected Works must demonstrate highest quality with artist statements',
    ],
    successStrategies: [
      'Draw every day - even 15-minute sketches build skill and consistency',
      'Develop observational drawing first - it\'s the foundation of all drawing',
      'Build a sketchbook habit to explore ideas and document growth',
      'Experiment with multiple drawing media throughout the year',
      'Connect your Sustained Investigation to a genuine interest or question',
    ],
    prerequisites: ['At least one art course, drawing experience recommended'],
    idealPreparation: 'Drawing experience, developing eye for detail, interest in visual expression through mark-making',
    pairsWellWith: ['AP Art History', 'AP 2D Art and Design'],
    avoidTakingWith: [],
    naturalProgression: 'College drawing, Illustration, Fine arts',
    typicalCredits: 3,
    majorRelevance: {
      'Fine Arts': 'essential',
      'Illustration': 'essential',
      'Animation': 'strongly_recommended',
      'Architecture': 'helpful',
      'Art Education': 'essential',
    },
    commonFears: [
      {
        fear: "I can only draw in one style",
        reality:
          "The portfolio doesn't require multiple styles - it requires depth within your chosen approach. The 83.8% pass rate shows that focused, consistent work succeeds.",
        advice:
          "The Sustained Investigation rewards depth over breadth. Find a compelling question to explore through drawing and let your work evolve naturally.",
      },
    ],
    idealStudentProfile:
      'Active drawer, interested in visual storytelling through mark-making, self-motivated, willing to draw consistently',
    readinessIndicators: {
      ready: [
        'Regular drawing practice',
        'Observational drawing skills',
        'Willing to experiment with different drawing media',
        'Can articulate ideas about art',
      ],
      notReady: [
        'Rarely draws',
        'Only copies from references or tutorials',
        'No interest in sustained creative work',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // WORLD LANGUAGES
  // -------------------------------------------------------------------------
  'AP Spanish Language': {
    name: 'AP Spanish Language and Culture',
    shortName: 'Spanish Lang',
    category: 'world_language',
    difficultyTier: 3,
    perceivedDifficulty: 'hard',
    weeklyHours: { minimum: 4, typical: 6, intensive: 9 },
    passRate: 0.830,
    fiveRate: 0.212,
    averageScore: 3.54,
    challengeFactors: [
      'All four skills tested: reading, writing, listening, speaking',
      'Interpersonal speaking task requires real-time conversation',
      'Presentational writing requires formal essay in Spanish',
      'Cultural knowledge across Spanish-speaking world required',
      'Audio sources test listening comprehension at native speed',
    ],
    successStrategies: [
      'Immerse yourself: Spanish media, podcasts, music daily',
      'Practice speaking regularly with native speakers or conversation partners',
      'Read Spanish-language news and literature beyond class materials',
      'Study the cultural practices, perspectives, and products of multiple countries',
      'Practice the presentational speaking format (2-minute presentations)',
    ],
    prerequisites: ['3-4 years of Spanish coursework (through Spanish 4/Pre-AP)'],
    idealPreparation: 'Strong Spanish foundation, exposure to authentic materials, willingness to speak',
    pairsWellWith: ['AP English Language', 'AP US History', 'AP World History'],
    avoidTakingWith: ['AP Spanish Literature in same year (heavy combined load)'],
    naturalProgression: 'AP Spanish Literature, College Spanish',
    typicalCredits: 3,
    majorRelevance: {
      'Spanish': 'essential',
      'International Relations': 'strongly_recommended',
      'Education': 'helpful',
      'Business': 'helpful',
      'Public Health': 'helpful',
    },
    commonFears: [
      {
        fear: "I'll be competing against native speakers",
        reality:
          "While some heritage speakers do take the exam, the scoring rubrics assess command of the language at a level achievable by dedicated non-native learners. The 83.0% pass rate includes all students.",
        advice:
          "Focus on your own growth. Many non-heritage speakers earn 4s and 5s through consistent practice. Daily immersion in Spanish media makes a big difference.",
      },
    ],
    idealStudentProfile:
      'Dedicated language learner, willing to practice speaking, interested in Spanish-speaking cultures',
    readinessIndicators: {
      ready: [
        'B+ or better in previous Spanish courses',
        'Can hold basic conversations in Spanish',
        'Willing to practice speaking regularly',
        'Interested in Spanish-speaking cultures',
      ],
      notReady: [
        'Below B in current Spanish course',
        'Avoids speaking practice',
        'Only completed 2 years of Spanish',
      ],
    },
  },

  'AP Spanish Literature': {
    name: 'AP Spanish Literature and Culture',
    shortName: 'Spanish Lit',
    category: 'world_language',
    difficultyTier: 4,
    perceivedDifficulty: 'very_hard',
    weeklyHours: { minimum: 5, typical: 7, intensive: 10 },
    passRate: 0.670,
    fiveRate: 0.102,
    averageScore: 3.00,
    challengeFactors: [
      'Must read and analyze literary works entirely in Spanish',
      'Required reading list includes complex classical and modern texts',
      'Literary analysis in a second language is doubly challenging',
      'Must understand literary movements and historical contexts',
      'Essays must demonstrate sophisticated literary vocabulary in Spanish',
    ],
    successStrategies: [
      'Read the required texts multiple times with annotations',
      'Build literary analysis vocabulary in Spanish',
      'Study each work in its historical and cultural context',
      'Practice writing analytical essays in Spanish with literary terminology',
      'Create thematic connections across the required reading list',
    ],
    prerequisites: ['AP Spanish Language or equivalent proficiency', '4+ years of Spanish'],
    idealPreparation: 'Near-fluent Spanish reading ability, enjoyment of literature, strong analytical writing in Spanish',
    pairsWellWith: ['AP English Literature', 'AP World History'],
    avoidTakingWith: [],
    naturalProgression: 'College Spanish literature, Latin American studies',
    typicalCredits: 3,
    majorRelevance: {
      'Spanish': 'essential',
      'Comparative Literature': 'strongly_recommended',
      'Latin American Studies': 'essential',
      'Humanities': 'helpful',
    },
    commonFears: [
      {
        fear: "I can speak Spanish but literary analysis is another level",
        reality:
          "The 67.0% pass rate reflects genuine difficulty. Literary analysis in a second language requires both strong language skills AND analytical ability.",
        advice:
          "If you love reading and have strong Spanish skills, this course combines two passions. Start reading the required texts over the summer if possible.",
      },
    ],
    idealStudentProfile:
      'Near-fluent in Spanish, loves literature, comfortable with analytical writing in Spanish, enjoys cultural study',
    readinessIndicators: {
      ready: [
        'A in AP Spanish Language or equivalent',
        'Enjoys reading literature',
        'Can write analytical essays in Spanish',
        'Interested in Latin American and Spanish cultures',
      ],
      notReady: [
        'Struggles with Spanish reading comprehension',
        'Doesn\'t enjoy literary analysis',
        'Hasn\'t taken AP Spanish Language',
      ],
    },
  },

  'AP French Language': {
    name: 'AP French Language and Culture',
    shortName: 'French',
    category: 'world_language',
    difficultyTier: 3,
    perceivedDifficulty: 'hard',
    weeklyHours: { minimum: 4, typical: 6, intensive: 9 },
    passRate: 0.723,
    fiveRate: 0.145,
    averageScore: 3.20,
    challengeFactors: [
      'French pronunciation and listening comprehension at native speed',
      'Grammar complexity (subjunctive, conditional, literary tenses)',
      'Cultural knowledge across Francophone world (France, Quebec, Africa, Caribbean)',
      'Interpersonal speaking requires real-time conversation',
      'Presentational writing demands formal register',
    ],
    successStrategies: [
      'Immerse yourself in French media: films, podcasts, news (France24, RFI)',
      'Practice speaking with native speakers or language exchange partners',
      'Master the subjunctive - it appears frequently in formal writing',
      'Study Francophone cultures beyond France',
      'Read French-language articles and literature regularly',
    ],
    prerequisites: ['3-4 years of French coursework'],
    idealPreparation: 'Solid French foundation, exposure to authentic French media, comfort with speaking',
    pairsWellWith: ['AP European History', 'AP Art History', 'AP World History'],
    avoidTakingWith: [],
    naturalProgression: 'College French, Study abroad',
    typicalCredits: 3,
    majorRelevance: {
      'French': 'essential',
      'International Relations': 'strongly_recommended',
      'Diplomacy': 'strongly_recommended',
      'Art History': 'helpful',
    },
    commonFears: [
      {
        fear: "French grammar is too complicated",
        reality:
          "The 72.3% pass rate shows most dedicated students succeed. French grammar is systematic - once you learn the patterns, they apply consistently.",
        advice:
          "Focus on the most commonly tested structures. Daily exposure to French (even 15 minutes of a podcast) builds intuitive grammar understanding.",
      },
    ],
    idealStudentProfile:
      'Committed language learner, interested in Francophone cultures, willing to practice speaking regularly',
    readinessIndicators: {
      ready: [
        'B+ or better in French 3/4',
        'Can understand spoken French at moderate speed',
        'Willing to engage with French media regularly',
        'Interested in French-speaking cultures',
      ],
      notReady: [
        'Below B in current French course',
        'No exposure to spoken French outside class',
        'Only completed 2 years of French',
      ],
    },
  },

  'AP Chinese Language': {
    name: 'AP Chinese Language and Culture',
    shortName: 'Chinese',
    category: 'world_language',
    difficultyTier: 4,
    perceivedDifficulty: 'very_hard',
    weeklyHours: { minimum: 5, typical: 8, intensive: 12 },
    passRate: 0.886,
    fiveRate: 0.533,
    averageScore: 4.08,
    challengeFactors: [
      'Character reading and writing (no alphabet-based shortcuts)',
      'Tonal pronunciation system requires ear training',
      'Cultural knowledge of Chinese-speaking regions',
      'Computer-based typing in Chinese characters',
      'Exam is entirely in Chinese including instructions',
    ],
    successStrategies: [
      'Practice character writing/recognition daily - consistency is key',
      'Use spaced repetition apps (Anki, Skritter) for character retention',
      'Listen to Chinese media regularly for tonal familiarity',
      'Practice typing in Chinese using pinyin input',
      'Study cultural practices and perspectives of Chinese-speaking communities',
    ],
    prerequisites: ['4+ years of Chinese or heritage speaker background'],
    idealPreparation: 'Strong foundation in reading, writing, speaking, and listening; cultural familiarity',
    pairsWellWith: ['AP World History', 'AP Art History'],
    avoidTakingWith: [],
    naturalProgression: 'College Chinese, Study abroad in China/Taiwan',
    typicalCredits: 3,
    majorRelevance: {
      'Chinese': 'essential',
      'East Asian Studies': 'essential',
      'International Business': 'strongly_recommended',
      'International Relations': 'strongly_recommended',
    },
    commonFears: [
      {
        fear: "The stats are misleading because of heritage speakers",
        reality:
          "The 88.6% pass rate and 53.3% five-rate are significantly influenced by heritage speakers. For non-heritage speakers, this is one of the most challenging APs.",
        advice:
          "Non-heritage speakers who earn 3s or 4s have achieved something truly impressive. Don't compare yourself to heritage speakers - your language journey is different and valued.",
      },
    ],
    idealStudentProfile:
      'Dedicated Chinese language learner or heritage speaker deepening formal skills, interested in Chinese culture',
    readinessIndicators: {
      ready: [
        'Can read 500+ characters',
        'Can hold basic conversations in Chinese',
        'Familiar with Chinese typing (pinyin input)',
        'Committed to daily practice',
      ],
      notReady: [
        'Fewer than 3 years of study (non-heritage)',
        'Can\'t read basic characters',
        'No exposure to spoken Chinese',
      ],
    },
  },

  'AP Japanese Language': {
    name: 'AP Japanese Language and Culture',
    shortName: 'Japanese',
    category: 'world_language',
    difficultyTier: 4,
    perceivedDifficulty: 'very_hard',
    weeklyHours: { minimum: 5, typical: 8, intensive: 12 },
    passRate: 0.762,
    fiveRate: 0.491,
    averageScore: 3.68,
    challengeFactors: [
      'Three writing systems (hiragana, katakana, kanji) to master',
      'Keigo (formal/polite language) adds complexity layers',
      'Cultural expectations are integral to language use',
      'Computer-based exam requires Japanese typing proficiency',
      'Listening comprehension of natural-speed Japanese',
    ],
    successStrategies: [
      'Master hiragana and katakana completely first',
      'Build kanji knowledge systematically (aim for 300+ for the exam)',
      'Practice keigo (formal speech) for presentational tasks',
      'Watch Japanese media with and without subtitles',
      'Practice typing in Japanese regularly',
    ],
    prerequisites: ['4+ years of Japanese or heritage speaker background'],
    idealPreparation: 'Solid foundation in all three writing systems, conversational ability, cultural knowledge',
    pairsWellWith: ['AP World History', 'AP Art History'],
    avoidTakingWith: [],
    naturalProgression: 'College Japanese, Study abroad in Japan',
    typicalCredits: 3,
    majorRelevance: {
      'Japanese': 'essential',
      'East Asian Studies': 'essential',
      'International Business': 'strongly_recommended',
      'International Relations': 'helpful',
    },
    commonFears: [
      {
        fear: "I learned Japanese from anime - is that enough?",
        reality:
          "Anime exposure helps with listening comprehension and motivation, but AP Japanese requires formal language skills, kanji reading, and cultural knowledge that casual exposure doesn't build.",
        advice:
          "Your enthusiasm is great! Channel it into formal study. Take structured courses, learn kanji systematically, and practice formal registers alongside casual speech.",
      },
    ],
    idealStudentProfile:
      'Dedicated Japanese learner or heritage speaker, interested in Japanese culture, committed to mastering writing systems',
    readinessIndicators: {
      ready: [
        'Can read hiragana and katakana fluently',
        'Know 200+ kanji',
        'Can hold basic conversations',
        'Familiar with Japanese typing',
      ],
      notReady: [
        'Can\'t read hiragana/katakana',
        'Fewer than 3 years of study (non-heritage)',
        'Only exposure is through media',
      ],
    },
  },

  'AP German Language': {
    name: 'AP German Language and Culture',
    shortName: 'German',
    category: 'world_language',
    difficultyTier: 3,
    perceivedDifficulty: 'hard',
    weeklyHours: { minimum: 4, typical: 6, intensive: 9 },
    passRate: 0.698,
    fiveRate: 0.261,
    averageScore: 3.32,
    challengeFactors: [
      'Four grammatical cases with article declensions',
      'Complex sentence structure (verb-second and verb-final rules)',
      'Cultural knowledge across German-speaking countries (Germany, Austria, Switzerland)',
      'Listening comprehension at natural speed',
      'Formal vs. informal register distinctions (Sie/du)',
    ],
    successStrategies: [
      'Master the case system thoroughly - it underpins all German grammar',
      'Practice sentence structure patterns until they feel natural',
      'Engage with German media: Deutsche Welle offers free learning resources',
      'Study German-speaking cultures beyond Germany',
      'Practice speaking regularly - pronunciation is relatively straightforward',
    ],
    prerequisites: ['3-4 years of German coursework'],
    idealPreparation: 'Strong German foundation, comfort with grammar complexity, cultural interest',
    pairsWellWith: ['AP European History', 'AP Music Theory'],
    avoidTakingWith: [],
    naturalProgression: 'College German, Study abroad',
    typicalCredits: 3,
    majorRelevance: {
      'German': 'essential',
      'European Studies': 'strongly_recommended',
      'Philosophy': 'helpful',
      'Music': 'helpful',
      'Engineering': 'helpful',
    },
    commonFears: [
      {
        fear: "German grammar is impossible with all the cases",
        reality:
          "The 69.8% pass rate with a strong 26.1% five-rate shows the self-selected population succeeds well. German grammar is logical and rule-based - once you learn the patterns, they stick.",
        advice:
          "German has fewer irregularities than English. The case system takes practice, but it becomes intuitive. Focus on patterns and tables early.",
      },
    ],
    idealStudentProfile:
      'Grammar-minded learner, interested in German-speaking cultures, patient with systematic language study',
    readinessIndicators: {
      ready: [
        'B+ or better in German 3/4',
        'Comfortable with grammatical case system',
        'Can understand spoken German at moderate speed',
        'Interested in German-speaking cultures',
      ],
      notReady: [
        'Below B in current German course',
        'Struggles with grammatical concepts',
        'Only completed 2 years of German',
      ],
    },
  },

  'AP Italian Language': {
    name: 'AP Italian Language and Culture',
    shortName: 'Italian',
    category: 'world_language',
    difficultyTier: 3,
    perceivedDifficulty: 'hard',
    weeklyHours: { minimum: 4, typical: 6, intensive: 9 },
    passRate: 0.724,
    fiveRate: 0.226,
    averageScore: 3.30,
    challengeFactors: [
      'Smaller course community - fewer study resources available',
      'Subjunctive mood is heavily tested and complex',
      'Cultural knowledge of Italian regions and traditions',
      'Listening comprehension includes regional variations',
      'Less commonly taught - may have weaker school support',
    ],
    successStrategies: [
      'Supplement class materials with Italian media (RAI, Italian podcasts)',
      'Master the subjunctive mood - it\'s more important in Italian than other Romance languages',
      'Study Italian culture beyond food and tourism',
      'Practice speaking with native speakers through language exchanges',
      'Read Italian news and short stories to build reading fluency',
    ],
    prerequisites: ['3-4 years of Italian coursework or heritage background'],
    idealPreparation: 'Strong Italian foundation, cultural interest, willingness to seek supplemental resources',
    pairsWellWith: ['AP European History', 'AP Art History', 'AP Music Theory'],
    avoidTakingWith: [],
    naturalProgression: 'College Italian, Study abroad in Italy',
    typicalCredits: 3,
    majorRelevance: {
      'Italian': 'essential',
      'Art History': 'strongly_recommended',
      'Music': 'helpful',
      'Classics': 'helpful',
      'European Studies': 'helpful',
    },
    commonFears: [
      {
        fear: "There aren't many resources for AP Italian",
        reality:
          "It's a smaller program, but the 72.4% pass rate shows students succeed. The College Board provides a full course description and practice materials.",
        advice:
          "Supplement with authentic Italian media and language exchange partners. The smaller community often means more personalized instruction.",
      },
    ],
    idealStudentProfile:
      'Dedicated Italian learner, interested in Italian culture, self-motivated to seek additional resources',
    readinessIndicators: {
      ready: [
        'B+ or better in Italian 3/4',
        'Can hold basic conversations',
        'Interested in Italian culture and history',
        'Comfortable being self-directed',
      ],
      notReady: [
        'Below B in current Italian course',
        'Only completed 2 years of Italian',
      ],
    },
  },

  'AP Latin': {
    name: 'AP Latin',
    shortName: 'Latin',
    category: 'world_language',
    difficultyTier: 4,
    perceivedDifficulty: 'hard',
    weeklyHours: { minimum: 5, typical: 7, intensive: 10 },
    passRate: 0.565,
    fiveRate: 0.119,
    averageScore: 2.76,
    challengeFactors: [
      'Reading original Latin texts by Caesar and Vergil',
      'No speaking/listening component - purely reading and analysis',
      'Complex syntax requires careful parsing',
      'Must translate and analyze simultaneously',
      'Scanning Vergil\'s dactylic hexameter for the poetry section',
    ],
    successStrategies: [
      'Read and re-read the required passages until they become familiar',
      'Master Latin grammar and syntax systematically',
      'Practice scanning Vergil\'s meter until it becomes natural',
      'Build vocabulary specific to Caesar and Vergil\'s texts',
      'Practice translation under timed conditions',
      'Study the historical and literary contexts of both works',
    ],
    prerequisites: ['3-4 years of Latin coursework', 'Strong grammar foundation'],
    idealPreparation: 'Solid Latin grammar, experience with original texts, analytical mindset',
    pairsWellWith: ['AP European History', 'AP English Literature', 'AP Art History'],
    avoidTakingWith: [],
    naturalProgression: 'College Classics, Latin, Ancient History',
    typicalCredits: 3,
    majorRelevance: {
      'Classics': 'essential',
      'Pre-Med': 'helpful',
      'Pre-Law': 'helpful',
      'Philosophy': 'helpful',
      'History': 'strongly_recommended',
    },
    commonFears: [
      {
        fear: "Latin is a dead language - why bother?",
        reality:
          "AP Latin demonstrates analytical rigor that colleges respect. Medical and legal professions use Latin terminology extensively. The close-reading skills transfer to any field.",
        advice:
          "The 56.5% pass rate reflects genuine difficulty. Scoring well signals exceptional analytical ability. Latin students consistently outperform on SATs and in college.",
      },
    ],
    idealStudentProfile:
      'Enjoys puzzle-like language analysis, interested in ancient civilizations, patient with complex grammar, strong reader',
    readinessIndicators: {
      ready: [
        'B+ or better in Latin 3/4',
        'Enjoy parsing complex sentences',
        'Interested in Roman history and literature',
        'Strong analytical reading skills',
      ],
      notReady: [
        'Struggles with Latin grammar',
        'No interest in ancient texts',
        'Finds translation work tedious',
      ],
    },
  },
};

// ============================================================================
// COURSE PAIRING GUIDANCE
// ============================================================================

export const COURSE_PAIRINGS: CourseWorkloadPairing[] = [
  {
    courses: ['AP Calculus BC', 'AP Physics C: Mechanics'],
    compatibility: 'excellent',
    reasoning:
      'These courses complement each other perfectly. The calculus you learn applies directly to physics problems, and physics gives meaning to abstract calculus concepts.',
    tips: [
      'Take these concurrently for maximum synergy',
      'Physics C actually becomes easier when you know calculus',
      'Practice applying derivatives and integrals in physics contexts',
    ],
  },
  {
    courses: ['AP US History', 'AP English Language'],
    compatibility: 'excellent',
    reasoning:
      'Both courses develop analytical writing skills. Historical analysis improves your rhetorical analysis, and rhetorical skills help you write better DBQs.',
    tips: [
      'Cross-pollinate skills between courses',
      'Historical speeches are great practice for Lang',
      'The writing workload overlaps more than you\'d think',
    ],
  },
  {
    courses: ['AP Chemistry', 'AP Physics 1'],
    compatibility: 'challenging',
    reasoning:
      'Both are demanding science courses with heavy workloads. Together, they create a significant time commitment.',
    tips: [
      'Only do this if science is your strength',
      'Consider taking them in different years instead',
      'If you must, be prepared for 15+ hours/week of science study',
    ],
  },
  {
    courses: ['AP US History', 'AP World History', 'AP European History'],
    compatibility: 'not_recommended',
    reasoning:
      'Taking multiple history APs simultaneously creates content overload. The reading and essay requirements will conflict.',
    tips: [
      'Spread these across multiple years',
      'Each is valuable on its own',
      'Taking all three over your HS career looks great - just not at once',
    ],
  },
  {
    courses: ['AP Calculus AB', 'AP Statistics'],
    compatibility: 'good',
    reasoning:
      'These cover different mathematical thinking styles. Stats is more conceptual/applied while Calc is more procedural/abstract. They don\'t compete for the same brain space.',
    tips: [
      'Good combination for students interested in data science',
      'The workloads are manageable together',
      'Stats provides relief from pure calculation',
    ],
  },
  {
    courses: ['AP Biology', 'AP Chemistry'],
    compatibility: 'good',
    reasoning:
      'Chemistry fundamentals support biological understanding. Many college pre-med students take these together.',
    tips: [
      'Chem knowledge helps with biochemistry units in Bio',
      'Heavy workload but complementary content',
      'Common combo for pre-med aspirants',
    ],
  },
];

// ============================================================================
// GRADE-APPROPRIATE COURSE LOADS
// ============================================================================

export const APPROPRIATE_LOADS: GradeAppropriateLoad[] = [
  {
    grade: 9,
    schoolType: 'competitive_magnet',
    rigorousCourses: { minimum: 0, typical: 1, ambitious: 2, maximum: 3 },
    notes: [
      'Freshman year is about adjusting to high school',
      'One AP (often Human Geo or CS Principles) is common',
      'Focus on building strong foundations',
      'Colleges understand limited APs freshman year',
    ],
  },
  {
    grade: 9,
    schoolType: 'well_resourced',
    rigorousCourses: { minimum: 0, typical: 1, ambitious: 2, maximum: 2 },
    notes: [
      'Many schools don\'t offer APs to freshmen',
      'Honors courses in core subjects are appropriate',
      'Focus on GPA and developing study habits',
    ],
  },
  {
    grade: 10,
    schoolType: 'competitive_magnet',
    rigorousCourses: { minimum: 1, typical: 2, ambitious: 4, maximum: 5 },
    notes: [
      'Sophomore year begins serious course selection',
      'World History and/or a science AP common',
      'Begin building trajectory toward intended major',
    ],
  },
  {
    grade: 10,
    schoolType: 'well_resourced',
    rigorousCourses: { minimum: 1, typical: 2, ambitious: 3, maximum: 4 },
    notes: [
      'Typically 1-2 APs available sophomore year',
      'Many take AP World History or AP Human Geography',
      'Balance with extracurricular development',
    ],
  },
  {
    grade: 11,
    schoolType: 'competitive_magnet',
    rigorousCourses: { minimum: 3, typical: 5, ambitious: 7, maximum: 8 },
    notes: [
      'Junior year is peak AP enrollment',
      'Colleges look closely at junior year rigor',
      'Balance is still important - don\'t burn out',
      'Quality of performance matters more than quantity',
    ],
  },
  {
    grade: 11,
    schoolType: 'well_resourced',
    rigorousCourses: { minimum: 2, typical: 3, ambitious: 5, maximum: 6 },
    notes: [
      'Most students peak in APs junior year',
      'APUSH and AP Lang are common anchors',
      'Add STEM APs based on intended major',
      'Leave room for standardized test prep',
    ],
  },
  {
    grade: 12,
    schoolType: 'competitive_magnet',
    rigorousCourses: { minimum: 3, typical: 5, ambitious: 6, maximum: 7 },
    notes: [
      'Maintain rigor but prioritize applications',
      'First semester grades matter for admissions',
      'Senioritis is real - plan realistically',
      'Continue courses aligned with intended major',
    ],
  },
  {
    grade: 12,
    schoolType: 'well_resourced',
    rigorousCourses: { minimum: 2, typical: 4, ambitious: 5, maximum: 6 },
    notes: [
      'Don\'t drop rigor significantly from junior year',
      'Colleges notice if you coast senior year',
      'First semester matters; second semester keep passing',
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get course profile by name (flexible matching)
 */
export function getAPCourse(name: string): APCourseProfile | undefined {
  // Try exact match first
  if (AP_COURSES[name]) return AP_COURSES[name];

  // Try partial match
  const normalized = name.toLowerCase();
  for (const [key, profile] of Object.entries(AP_COURSES)) {
    if (key.toLowerCase().includes(normalized) || profile.shortName.toLowerCase().includes(normalized)) {
      return profile;
    }
  }
  return undefined;
}

/**
 * Get courses by category
 */
export function getAPCoursesByCategory(category: APCourseProfile['category']): APCourseProfile[] {
  return Object.values(AP_COURSES).filter((c) => c.category === category);
}

/**
 * Get courses relevant to a major
 */
export function getCoursesForMajor(major: string): Array<{ course: APCourseProfile; relevance: string }> {
  const results: Array<{ course: APCourseProfile; relevance: string }> = [];
  for (const course of Object.values(AP_COURSES)) {
    const relevance = course.majorRelevance[major];
    if (relevance) {
      results.push({ course, relevance });
    }
  }
  // Sort by relevance
  const order = { essential: 0, strongly_recommended: 1, helpful: 2, optional: 3 };
  results.sort((a, b) => order[a.relevance as keyof typeof order] - order[b.relevance as keyof typeof order]);
  return results;
}

/**
 * Get appropriate load guidance
 */
export function getLoadGuidance(grade: 9 | 10 | 11 | 12, schoolType: string): GradeAppropriateLoad | undefined {
  // Normalize school type
  let normalizedType: GradeAppropriateLoad['schoolType'] = 'average';
  if (schoolType.includes('magnet') || schoolType.includes('competitive')) {
    normalizedType = 'competitive_magnet';
  } else if (schoolType.includes('well') || schoolType.includes('resourced') || schoolType.includes('suburban')) {
    normalizedType = 'well_resourced';
  } else if (schoolType.includes('under')) {
    normalizedType = 'under_resourced';
  }

  return APPROPRIATE_LOADS.find((l) => l.grade === grade && l.schoolType === normalizedType);
}

/**
 * Get pairing compatibility between courses
 */
export function getPairingInfo(course1: string, course2: string): CourseWorkloadPairing | undefined {
  const c1 = course1.toLowerCase();
  const c2 = course2.toLowerCase();

  return COURSE_PAIRINGS.find((p) => {
    const pc = p.courses.map((c) => c.toLowerCase());
    return (pc.includes(c1) || pc.some((x) => x.includes(c1))) && (pc.includes(c2) || pc.some((x) => x.includes(c2)));
  });
}

/**
 * Get difficulty tier description
 */
export function getDifficultyDescription(tier: 1 | 2 | 3 | 4 | 5): string {
  const descriptions = {
    1: 'Accessible - good entry point to AP coursework',
    2: 'Moderate - manageable with consistent effort',
    3: 'Challenging - requires significant time investment',
    4: 'Demanding - among the more difficult APs',
    5: 'Very demanding - requires strong preparation and commitment',
  };
  return descriptions[tier];
}

/**
 * Format pass rate as percentage
 */
export function formatPassRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/**
 * Get courses sorted by difficulty
 */
export function getCoursesByDifficulty(ascending: boolean = true): APCourseProfile[] {
  const courses = Object.values(AP_COURSES);
  courses.sort((a, b) => {
    const diff = a.difficultyTier - b.difficultyTier;
    return ascending ? diff : -diff;
  });
  return courses;
}
