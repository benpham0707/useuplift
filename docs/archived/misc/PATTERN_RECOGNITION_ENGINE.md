# Pattern Recognition Engine
## Automatic Pattern Classification System for College Supplemental Essays

**Purpose**: Automatically identify which pattern(s) a supplemental essay prompt belongs to, enabling the system to apply the correct rubric and college overlay for evaluation.

**Data Source**: Based on 157 verified prompts from supplementals.md, validated against PATTERN_VALIDATION_MATRIX.md

---

## Table of Contents

1. [Core Architecture](#core-architecture)
2. [Pattern Definitions with Signal Words](#pattern-definitions)
3. [Classification Algorithm](#classification-algorithm)
4. [Hybrid Pattern Detection](#hybrid-patterns)
5. [Confidence Scoring](#confidence-scoring)
6. [Edge Case Handling](#edge-cases)
7. [Implementation Guide](#implementation)

---

<a name="core-architecture"></a>
## 1. Core Architecture

### System Overview

```typescript
interface PatternRecognitionEngine {
  input: {
    prompt: string,              // The essay prompt text
    wordCount: number,           // Required word count
    schoolName: string,          // Which college (for context)
    promptContext?: string       // Additional context if available
  },

  output: {
    primaryPattern: PatternType,              // Main pattern classification
    confidence: number,                        // 0-100 confidence score
    secondaryPatterns?: PatternType[],        // If hybrid prompt
    hybridType?: "sequential" | "integrated", // How patterns combine
    signalWordsFound: string[],               // Which keywords triggered classification
    recommendedRubric: string,                // Which rubric to use
    recommendedOverlay: string,               // Which college overlay to apply
    warningsOrFlags?: string[]                // Any special considerations
  },

  processing: {
    stage1_keywordDetection: "Scan for signal words and phrases",
    stage2_structuralAnalysis: "Analyze prompt structure and clauses",
    stage3_contextualReasoning: "Consider college-specific context",
    stage4_confidenceScoring: "Calculate classification confidence",
    stage5_rubricMapping: "Map to appropriate evaluation framework"
  }
}
```

### Processing Pipeline

```typescript
const classificationPipeline = {
  // STAGE 1: Quick Keyword Detection (Haiku - fast, cheap)
  stage1_keywordScan: {
    model: "claude-haiku",
    cost: "$0.005 per classification",
    purpose: "Rapidly identify pattern candidates based on signal words",
    output: "List of potential patterns with initial confidence scores"
  },

  // STAGE 2: Structural Analysis (Haiku - fast, cheap)
  stage2_structuralAnalysis: {
    model: "claude-haiku",
    cost: "$0.005 per classification",
    purpose: "Analyze prompt structure, clauses, and question types",
    output: "Refined pattern classification with structural evidence"
  },

  // STAGE 3: Contextual Reasoning (Sonnet - only if ambiguous)
  stage3_contextualReasoning: {
    model: "claude-sonnet",
    cost: "$0.02 per classification",
    trigger: "Only when confidence < 85% after Stage 2",
    purpose: "Deep semantic understanding for edge cases",
    output: "Final classification with high confidence"
  },

  // TOTAL COST: $0.01 per classification (90% of cases)
  //             $0.03 per classification (10% ambiguous cases)
  avgCost: "$0.011 per classification"
};
```

---

<a name="pattern-definitions"></a>
## 2. Pattern Definitions with Signal Words

### Pattern 1: Why This School?

**Core Question**: "Why do you want to attend [This College]?"

```typescript
const pattern1_whyThisSchool = {
  patternId: "why_this_school",
  frequency: "30/30 schools (100%)",

  primarySignalWords: [
    // Direct questions
    "why [college name]",
    "why do you want to attend",
    "what attracts you to",
    "why are you applying",
    "what is it about [college]",
    "why is [college] a good match",
    "what draws you to",

    // Interest/appeal language
    "what appeals to you",
    "what interests you about",
    "why [college] is a good fit",
    "impression of [college]",

    // Exploration language
    "how will you explore",
    "how would you take advantage of",
    "how do you hope to use your [college] education",

    // Academic offering language
    "academic interests at [college]",
    "what academic areas",
    "programs offered at [college]",
    "why this field of study at [college]"
  ],

  secondarySignals: [
    // Context clues
    "community at [college]",
    "resources at [college]",
    "opportunities at [college]",
    "[college]'s curriculum",
    "[college]'s approach",

    // Fit language
    "good match",
    "suit your interests",
    "align with your goals"
  ],

  structuralPatterns: [
    "Prompt explicitly names the college",
    "Asks about specific programs or offerings at the college",
    "Inquires about fit between student and institution",
    "Requests explanation of interest in college",
    "Short word count (100-250 words typical)"
  ],

  realExamples: [
    "What is it about Yale that has led you to apply? (125 words)",
    "Why Duke? (250 words)",
    "How do you hope to use your Harvard education in the future? (150 words)",
    "What field of study appeals to you the most right now? Tell us more about why this field of study at MIT appeals to you. (100-200 words)",
    "Academic interests at Stanford (250 words)"
  ],

  confusionRisks: {
    vsWhyMajor: "If prompt asks ONLY about academic field without mentioning college-specific resources → Pattern 2 (Why Major)",
    vsIntellectualVitality: "If prompt asks what's meaningful to you without college context → Pattern 7",
    hybrid: "Often combined with Why Major - look for both college name AND academic interests"
  }
};
```

### Pattern 2: Why Major / Academic Interest

**Core Question**: "Why do you want to study [Field/Major]?"

```typescript
const pattern2_whyMajor = {
  patternId: "why_major_academic_interest",
  frequency: "29/30 schools (96.7%)",

  primarySignalWords: [
    // Direct major questions
    "why this major",
    "academic interests",
    "field of study",
    "what do you plan to study",
    "intended major",
    "areas of study",
    "academic pursuits",
    "intellectual interests",

    // Curiosity/exploration
    "what piques your curiosity",
    "what academic areas",
    "academic passions",
    "what you want to learn",

    // Specific degree language
    "why engineering",
    "why liberal arts",
    "why [specific major]"
  ],

  secondarySignals: [
    "curriculum",
    "courses you're excited about",
    "professors",
    "research interests",
    "academic goals",
    "scholarly interests"
  ],

  structuralPatterns: [
    "Asks about academic field or major",
    "May or may not mention college name",
    "Often paired with 'Why This School' in same prompt",
    "Word count varies (50-500 words)",
    "May ask about intellectual journey or development"
  ],

  realExamples: [
    "What academic areas most pique your curiosity, and how do the programs offered at Princeton suit your particular interests? (250 words)",
    "Please describe why you are interested in studying engineering at Princeton. (250 words)",
    "The flexible structure of The College of Arts and Sciences' curriculum is designed to inspire exploration... What are you curious about? (150-200 words)",
    "Academic Interests Essay - Explain your academic interests (200 words) - Yale"
  ],

  confusionRisks: {
    vsWhySchool: "If prompt mentions BOTH major AND college-specific programs → Hybrid Pattern 1+2",
    vsIntellectualVitality: "If asking 'what's meaningful' without academic focus → Pattern 7",
    standalone: "If ONLY asks about major without college context → Pure Pattern 2"
  }
};
```

### Pattern 3: Disagreement / Dialogue / Diverse Perspectives

**Core Question**: "Describe an experience with disagreement, dialogue, or engaging with different perspectives."

```typescript
const pattern3_disagreementDialogue = {
  patternId: "disagreement_dialogue",
  frequency: "7/30 schools (23.3%)",

  primarySignalWords: [
    // Disagreement language
    "disagreed",
    "disagreement",
    "opposing view",
    "different perspective",
    "viewpoint different from yours",
    "challenged your beliefs",

    // Dialogue language
    "discussed an issue",
    "conversation",
    "engaged with",
    "communicated",

    // Perspective language
    "diverse viewpoints",
    "range of perspectives",
    "beliefs or values"
  ],

  secondarySignals: [
    "meaningful conversation",
    "important to you",
    "learn from",
    "changed your thinking",
    "broadened your perspective",
    "understanding"
  ],

  structuralPatterns: [
    "Past-tense: 'Reflect on a time...' or 'Describe a time...'",
    "Asks about specific experience or event",
    "Usually 100-400 words",
    "Focuses on interpersonal interaction",
    "Often asks 'what did you learn' or 'why meaningful'"
  ],

  realExamples: [
    "Describe a time when you strongly disagreed with someone about an idea or issue. How did you communicate or engage with this person? What did you learn from this experience? (100-150 words) - Harvard",
    "Reflect on a time you discussed an issue important to you with someone holding an opposing view. Why did you find the experience meaningful? (400 words) - Yale",
    "We believe there is benefit in sharing and sometimes questioning our beliefs or values. (250 words) - Duke (Option 3)"
  ],

  exactDuplicateSet: {
    schools: ["Harvard", "Yale", "Emory", "Duke", "NYU", "WashU", "Dartmouth"],
    count: 7,
    reusability: "⭐⭐⭐⭐⭐ (5/5) - Nearly identical prompts",
    note: "Students can write ONE essay and adapt minimally for all 7 schools"
  },

  confusionRisks: {
    vsCommunity: "If asking about community membership without disagreement → Pattern 4",
    vsChallenge: "If about overcoming difficulty without dialogue component → Pattern 5",
    clear: "Usually very clear - unique 'disagreement' language is distinctive"
  }
};
```

### Pattern 4: Community / Background / Identity

**Core Question**: "How has your community, background, or identity shaped you?"

```typescript
const pattern4_communityBackground = {
  patternId: "community_background_identity",
  frequency: "9/30 schools (30%)",

  primarySignalWords: [
    // Community language
    "community",
    "membership in a community",
    "community to which you feel connected",
    "sense of belonging",

    // Background language
    "background",
    "where you come from",
    "context",
    "identity",

    // Shaping/impact language
    "shaped who you are",
    "shaped you",
    "influenced you",
    "contributed to",
    "made you who you are"
  ],

  secondarySignals: [
    "experiences",
    "perspective",
    "upbringing",
    "environment",
    "culture",
    "heritage",
    "family",
    "neighborhood"
  ],

  structuralPatterns: [
    "Past-tense: asking about experiences that shaped student",
    "May ask how these experiences will contribute to college",
    "Word count varies widely (150-500 words)",
    "Often asks about diversity or unique perspective"
  ],

  realExamples: [
    "How will the life experiences that shape who you are today enable you to contribute to Harvard? (100-150 words)",
    "Reflect on your membership in a community to which you feel connected. Why is this community meaningful to you? (400 words) - Yale Option 2",
    "What aspects of your background have most shaped how you see yourself engaging in Northwestern's community? (300 words)",
    "How will you explore community at Penn? (150-200 words)"
  ],

  confusionRisks: {
    vsDisagreement: "If about dialogue/disagreement rather than belonging → Pattern 3",
    vsActivity: "If focused on specific activity rather than community → Pattern 6",
    vsFutureContribution: "May blend past (community shaped you) with future (how you'll contribute)"
  }
};
```

### Pattern 5: Challenge / Adversity / Growth

**Core Question**: "Describe a challenge you faced and how you overcame it."

```typescript
const pattern5_challengeAdversity = {
  patternId: "challenge_adversity_growth",
  frequency: "7/30 schools (23.3%)",

  primarySignalWords: [
    // Challenge language
    "challenge",
    "difficult situation",
    "obstacle",
    "setback",
    "adversity",
    "hardship",

    // Unexpected/management language
    "didn't expect",
    "unexpected",
    "how did you manage",
    "overcome",

    // Growth language
    "what did you learn",
    "how did you grow",
    "resilience"
  ],

  secondarySignals: [
    "difficult",
    "problem",
    "struggle",
    "failure",
    "perseverance",
    "adapt",
    "respond"
  ],

  structuralPatterns: [
    "Past-tense narrative structure",
    "Asks about specific event or situation",
    "Usually includes 'what did you learn' component",
    "100-200 words typical",
    "Focuses on problem-solving or growth"
  ],

  realExamples: [
    "How did you manage a situation or challenge that you didn't expect? What did you learn from it? (100-200 words) - MIT",
    "Describe a time when you experienced a setback or failure. How did you respond? (250 words) - Various schools",
    "Tell us about a challenge you faced and how you overcame it. (200 words) - Various schools"
  ],

  confusionRisks: {
    vsDisagreement: "If challenge is interpersonal dialogue → Pattern 3",
    vsActivity: "If describing activity without challenge focus → Pattern 6",
    clear: "Usually clear - 'challenge,' 'obstacle,' 'setback' are distinctive"
  }
};
```

### Pattern 6: Meaningful Activity / Extracurricular

**Core Question**: "Tell us about an activity, experience, or interest that's important to you."

```typescript
const pattern6_meaningfulActivity = {
  patternId: "meaningful_activity",
  frequency: "8/30 schools (26.7%)",

  primarySignalWords: [
    // Activity language
    "extracurricular activity",
    "activity",
    "activities",
    "experience",
    "employment",

    // Elaboration language
    "elaborate on",
    "describe",
    "tell us about",
    "briefly describe",

    // Importance language
    "important to you",
    "meaningful to you",
    "significant",
    "shaped who you are"
  ],

  secondarySignals: [
    "passion",
    "commitment",
    "involvement",
    "leadership",
    "responsibility",
    "impact"
  ],

  structuralPatterns: [
    "Asks student to select ONE activity to highlight",
    "Usually brief (40-150 words)",
    "May be part of activities list",
    "Focuses on depth over breadth"
  ],

  realExamples: [
    "Briefly describe any of your extracurricular activities, employment experience, travel, or family responsibilities that have shaped who you are. (100-150 words) - Harvard",
    "Briefly elaborate on one of your extracurricular activities, a job you hold, or responsibilities you have for your family. (50 words) - Stanford",
    "Please list up to four activities... (40 words per activity) - MIT"
  ],

  confusionRisks: {
    vsChallenge: "If activity involved challenge, may overlap with Pattern 5",
    vsCommunity: "If activity is community-based, may overlap with Pattern 4",
    clear: "Usually clear - 'activity' or 'extracurricular' is distinctive"
  }
};
```

### Pattern 7: What Brings You Joy / Intellectual Vitality

**Core Question**: "What excites you, brings you joy, or is meaningful to you?"

```typescript
const pattern7_joyVitality = {
  patternId: "joy_intellectual_vitality",
  frequency: "5/30 schools (16.7%)",

  primarySignalWords: [
    // Joy language
    "brings you joy",
    "what brings you joy",
    "for the pleasure of it",
    "simply because",

    // Meaningful language
    "meaningful to you",
    "important to you",
    "matters to you",

    // Interest language
    "inspires you",
    "excites you",
    "passionate about",

    // Intellectual vitality
    "intellectual vitality",
    "curiosity",
    "love of learning"
  ],

  secondarySignals: [
    "outside of school",
    "for fun",
    "in your free time",
    "personal interest",
    "hobby"
  ],

  structuralPatterns: [
    "Present-tense or ongoing interest",
    "Not necessarily academic",
    "Often very short (50-100 words)",
    "Focuses on intrinsic motivation",
    "May be light-hearted or serious"
  ],

  realExamples: [
    "What brings you joy? (50 words) - Princeton",
    "We know you lead a busy life, full of activities, many of which are required of you. Tell us about something you do simply for the pleasure of it. (100-200 words) - MIT",
    "Tell us about something that is meaningful to you and why. (100-250 words) - Stanford",
    "Top three things your roommates might like to know about you. (100-150 words) - Harvard"
  ],

  confusionRisks: {
    vsActivity: "If asks about specific activity → Pattern 6; if about joy/interest in general → Pattern 7",
    vsWhyMajor: "If joy is specifically academic/major-related → may be Pattern 2",
    tone: "Pattern 7 is more personal, less formal than other patterns"
  }
};
```

### Pattern 8: Future Goals / Aspirations

**Core Question**: "What are your future goals or how will you use your education?"

```typescript
const pattern8_futureGoals = {
  patternId: "future_goals_aspirations",
  frequency: "6/30 schools (20%)",

  primarySignalWords: [
    // Future language
    "future goals",
    "future aspirations",
    "how do you hope to use",
    "what you hope to accomplish",
    "career goals",

    // Impact language
    "how will you contribute",
    "impact you want to make",
    "change you want to create",

    // Vision language
    "envision yourself",
    "see yourself",
    "plan to"
  ],

  secondarySignals: [
    "after graduation",
    "long-term",
    "vision",
    "ambitions",
    "dreams"
  ],

  structuralPatterns: [
    "Future-tense language",
    "May be combined with Why School or Why Major",
    "100-250 words typical",
    "Asks about post-college plans or impact"
  ],

  realExamples: [
    "How do you hope to use your Harvard education in the future? (100-150 words)",
    "How do you envision yourself contributing to the field of nursing? (150-200 words) - Penn Nursing",
    "What do you hope to accomplish? (Various schools)"
  ],

  confusionRisks: {
    vsWhySchool: "Often COMBINED with Why School - hybrid pattern",
    vsWhyMajor: "May overlap when asking about academic and career goals",
    hybrid: "Frequently part of larger prompt, not standalone"
  }
};
```

### Pattern 9: Creativity / Imagination / Intellectual Curiosity

**Core Question**: "Demonstrate your creativity, imagination, or intellectual curiosity."

```typescript
const pattern9_creativityIntellect = {
  patternId: "creativity_imagination_intellect",
  frequency: "7/30 schools (23.3%)",

  primarySignalWords: [
    // Creative language
    "creativity",
    "creative",
    "imagination",
    "innovative",
    "original",

    // Intellectual language
    "intellect",
    "intellectual curiosity",
    "curiosity",
    "ideas",
    "thinking",

    // Hypothetical language
    "if you could",
    "design",
    "create",
    "invent",
    "dream up"
  ],

  secondarySignals: [
    "unique",
    "novel",
    "explore",
    "question",
    "wonder"
  ],

  structuralPatterns: [
    "Often hypothetical or open-ended",
    "May ask student to create/design something",
    "Can be playful or serious",
    "Word counts vary widely (50-250 words)"
  ],

  realExamples: [
    "Tell us about an experience in the past year or two that reflects your imagination, creativity, or intellect. (250 words) - Duke Option 2",
    "If you could teach any college course, write a book, or create an original piece of art of any kind, what would it be? (35 words) - Yale",
    "If you could dream up an undergraduate class, research project, or creative effort... what would it be? (200 words) - Northwestern Option 2"
  ],

  confusionRisks: {
    vsActivity: "If about past creative activity → Pattern 6; if hypothetical → Pattern 9",
    vsJoy: "If asking what brings joy through creative work → may overlap Pattern 7",
    openEnded: "Very open-ended - can be hard to classify without full context"
  }
};
```

### Pattern 10: Short Answer Compilation

**Core Question**: Various quick-hit questions (50 words or less each)

```typescript
const pattern10_shortAnswers = {
  patternId: "short_answer_compilation",
  frequency: "15/30 schools (50%)",

  primarySignalWords: [
    // Lists
    "list five things",
    "list three things",
    "top three",

    // Quick questions
    "what inspires you",
    "what do you do for fun",
    "favorite",

    // Very short word counts
    "50 words",
    "35 words",
    "200 characters"
  ],

  structuralPatterns: [
    "Multiple short questions in series",
    "Very brief word counts (35-50 words each)",
    "Often 3-5 questions total",
    "Can cover diverse topics",
    "Designed to show personality quickly"
  ],

  realExamples: [
    "What is a new skill you would like to learn in college? (50 words) - Princeton",
    "What brings you joy? (50 words) - Princeton",
    "What is one thing you love about where you come from? (50 words) - Princeton",
    "List five things that are important to you. (50 words) - Stanford",
    "How did you spend your last two summers? (50 words) - Stanford"
  ],

  note: "These are typically evaluated as a SET, not individually. Look for personality, authenticity, and coherence across answers."
};
```

### Pattern 11: Contribution to College

**Core Question**: "How will you contribute to our college community?"

```typescript
const pattern11_contributionToCollege = {
  patternId: "contribution_to_college",
  frequency: "12/30 schools (40%)",

  primarySignalWords: [
    // Contribution language
    "how will you contribute",
    "what will you bring",
    "how will you enrich",
    "potential contributions",
    "how will you engage",

    // Community language
    "our community",
    "the community",
    "campus",

    // Perspective/diversity language
    "your perspective",
    "your background",
    "your experiences"
  ],

  secondarySignals: [
    "add to",
    "enhance",
    "participate",
    "involve yourself",
    "leadership"
  ],

  structuralPatterns: [
    "Future-tense (what you WILL do)",
    "Often combined with community/background questions",
    "150-300 words typical",
    "Focuses on student agency and initiative"
  ],

  realExamples: [
    "How will the life experiences that shape who you are today enable you to contribute to Harvard? (100-150 words)",
    "How will you explore community at Penn? (150-200 words)",
    "What aspects of your background have most shaped how you see yourself engaging in Northwestern's community? (300 words)"
  ],

  confusionRisks: {
    vsCommunity: "Often COMBINED with Pattern 4 (community/background)",
    vsWhySchool: "Similar to Why School but emphasis on GIVING not GETTING",
    hybrid: "Frequently appears as second part of two-part prompt"
  }
};
```

### Pattern 12: Diversity / Unique Perspective

**Core Question**: "What unique perspective or background will you bring?"

```typescript
const pattern12_diversityPerspective = {
  patternId: "diversity_unique_perspective",
  frequency: "10/30 schools (33.3%)",

  primarySignalWords: [
    // Diversity language
    "diversity",
    "diverse",
    "different",
    "unique",
    "distinct",

    // Perspective language
    "perspective",
    "viewpoint",
    "background",
    "experience",

    // Understanding language
    "help us understand you",
    "anything else we should know",
    "what makes you unique"
  ],

  secondarySignals: [
    "identity",
    "culture",
    "heritage",
    "upbringing",
    "story"
  ],

  structuralPatterns: [
    "Often optional essay",
    "May be very open-ended",
    "150-650 words (varies widely)",
    "Gives student freedom to share anything"
  ],

  realExamples: [
    "We believe a wide range of viewpoints and experiences is essential... Please share anything that might help us better understand you. (250 words) - Duke Option 1",
    "What is something about you that is not included anywhere else in your application? (35 words) - Yale"
  ],

  confusionRisks: {
    vsCommunity: "Very similar to Pattern 4 - may be indistinguishable",
    vsAdditionalInfo: "May function as 'additional information' space",
    openEnded: "Extremely open - students have wide latitude"
  }
};
```

### Pattern 13: Specific School Tradition / Unique Prompt

**Core Question**: School-specific unique questions (like UChicago's quirky prompts)

```typescript
const pattern13_schoolSpecificUnique = {
  patternId: "school_specific_unique",
  frequency: "5/30 schools (16.7%)",

  examples: [
    {
      school: "UChicago",
      prompt: "Extended essay with quirky, creative prompts that change yearly",
      note: "Famous for unusual, thought-provoking prompts"
    },
    {
      school: "Stanford",
      prompt: "Write a note to your future roommate (100-250 words)",
      note: "Unique to Stanford - shows personality"
    },
    {
      school: "Northwestern",
      prompt: "What would you paint on The Rock, and why? (200 words)",
      note: "References specific Northwestern tradition"
    },
    {
      school: "Penn",
      prompt: "Write a short thank-you note to someone (150-200 words)",
      note: "Unique prompt structure"
    }
  ],

  signalWords: [
    "School-specific traditions",
    "Unique prompt structures",
    "Creative or unusual framing",
    "Hypothetical scenarios",
    "School mascots or symbols"
  ],

  classificationStrategy: "These require manual review and custom rubrics. Flag for special handling."
};
```

### Pattern 14: Why Not [Activity/Path]

**Core Question**: "Why didn't you pursue [X], or how did you choose [Y] over [Z]?"

```typescript
const pattern14_choiceExplanation = {
  patternId: "choice_path_explanation",
  frequency: "3/30 schools (10%)",

  primarySignalWords: [
    // Choice language
    "why not",
    "instead of",
    "chose",
    "decided",
    "path",

    // Alternative language
    "other than",
    "different from",
    "unconventional",
    "unexpected"
  ],

  realExamples: [
    "While some reach their goals following well-trodden paths, others blaze their own trails achieving the unexpected. In what ways have you done something different than what was expected in your educational journey? (100-200 words) - MIT"
  ],

  note: "Rare pattern. Asks students to explain unconventional choices or paths."
};
```

---

<a name="classification-algorithm"></a>
## 3. Classification Algorithm

### Decision Tree for Pattern Recognition

```typescript
interface ClassificationDecisionTree {
  // STEP 1: Check for explicit college name mention
  step1_collegeNameCheck: {
    question: "Does the prompt explicitly name the college?",
    ifYes: {
      followUp: "Does it ask WHY you want to attend or WHAT you'll study there?",
      ifWhy: "Likely Pattern 1 (Why This School)",
      ifWhat: "Likely Pattern 2 (Why Major) OR hybrid Pattern 1+2"
    },
    ifNo: "Proceed to Step 2"
  },

  // STEP 2: Check for temporal framing
  step2_temporalFraming: {
    question: "What tense/timeframe does the prompt use?",
    past: {
      trigger: "Describe a time..., Reflect on..., Tell us about an experience...",
      followUp: "What was the experience about?",
      answers: {
        disagreement: "Pattern 3 (Disagreement/Dialogue)",
        challenge: "Pattern 5 (Challenge/Adversity)",
        activity: "Pattern 6 (Meaningful Activity)",
        community: "Pattern 4 (Community/Background)"
      }
    },
    future: {
      trigger: "How will you..., What do you hope..., How do you envision...",
      followUp: "What aspect of the future?",
      answers: {
        contribution: "Pattern 11 (Contribution to College)",
        goals: "Pattern 8 (Future Goals)",
        education_use: "Pattern 1 (Why School) + Pattern 8 (Future Goals) hybrid"
      }
    },
    present: {
      trigger: "What brings you joy..., What interests you..., What is meaningful...",
      classification: "Pattern 7 (Joy/Intellectual Vitality)"
    }
  },

  // STEP 3: Check for distinctive keywords
  step3_keywordMatch: {
    question: "Does the prompt contain distinctive signal words?",
    checkKeywords: [
      { keyword: "disagree/disagreement/opposing view", pattern: 3 },
      { keyword: "community/membership/belonging", pattern: 4 },
      { keyword: "challenge/obstacle/setback/adversity", pattern: 5 },
      { keyword: "activity/extracurricular", pattern: 6 },
      { keyword: "joy/pleasure/meaningful", pattern: 7 },
      { keyword: "creativity/imagination/intellect", pattern: 9 },
      { keyword: "contribute/enrich/bring to", pattern: 11 },
      { keyword: "diversity/perspective/unique", pattern: 12 }
    ],
    ifMultipleMatches: "Likely hybrid prompt - flag both patterns"
  },

  // STEP 4: Check word count
  step4_wordCountAnalysis: {
    question: "What is the required word count?",
    veryShort: {
      range: "35-50 words",
      likelyPattern: "Pattern 10 (Short Answers)",
      note: "Multiple short questions often grouped together"
    },
    short: {
      range: "100-150 words",
      note: "Could be any pattern - word count alone not determinative"
    },
    medium: {
      range: "200-300 words",
      note: "Standard essay length - most patterns fall here"
    },
    long: {
      range: "400-650 words",
      likelyPatterns: ["Pattern 3", "Pattern 4", "Pattern 13"],
      note: "Longer essays often Community, Disagreement, or Unique prompts"
    }
  },

  // STEP 5: Check for hybrid structure
  step5_hybridDetection: {
    question: "Does the prompt ask multiple questions or have multiple parts?",
    checkStructure: {
      multipleQuestions: "Count distinct questions using '?' or sentence boundaries",
      clauseAnalysis: "Look for 'and' or 'also' connecting different asks",
      exampleHybrid: "'What will you study at Stanford AND how will you contribute?' → Pattern 2 + Pattern 11"
    },
    ifHybrid: {
      classification: "Flag as hybrid with both pattern IDs",
      evaluation: "Apply BOTH rubrics and integrate scores"
    }
  }
};
```

### Algorithm Pseudocode

```typescript
function classifyPattern(prompt: string, college: string, wordCount: number): PatternClassification {
  // Initialize
  let candidates: PatternCandidate[] = [];
  let confidence: number = 0;

  // STAGE 1: Keyword Scanning
  for (const pattern of allPatterns) {
    const primaryMatches = countMatches(prompt, pattern.primarySignalWords);
    const secondaryMatches = countMatches(prompt, pattern.secondarySignals);

    if (primaryMatches > 0 || secondaryMatches > 1) {
      candidates.push({
        patternId: pattern.id,
        score: (primaryMatches * 10) + (secondaryMatches * 3),
        evidence: getMatchedKeywords(prompt, pattern)
      });
    }
  }

  // STAGE 2: Structural Analysis
  const structure = analyzeStructure(prompt);

  // Check for college name (high signal for Pattern 1)
  if (prompt.toLowerCase().includes(college.toLowerCase())) {
    boostScore(candidates, "why_this_school", +20);
  }

  // Check temporal framing
  if (structure.tense === "past" && structure.hasNarrative) {
    boostScore(candidates, ["disagreement_dialogue", "challenge_adversity", "meaningful_activity"], +10);
  }

  if (structure.tense === "future") {
    boostScore(candidates, ["contribution_to_college", "future_goals"], +10);
  }

  // Check word count patterns
  if (wordCount <= 50) {
    boostScore(candidates, "short_answer_compilation", +15);
  }

  // STAGE 3: Contextual Reasoning (only if needed)
  if (getTopScore(candidates) < 85) {
    // Use Sonnet for deep analysis
    const contextualAnalysis = await deepAnalyze(prompt, candidates, college);
    candidates = contextualAnalysis.refinedCandidates;
  }

  // STAGE 4: Determine if hybrid
  const isHybrid = detectHybrid(prompt, candidates);

  if (isHybrid) {
    return {
      primaryPattern: candidates[0].patternId,
      secondaryPatterns: candidates.slice(1, 3).map(c => c.patternId),
      hybridType: analyzeHybridType(prompt),
      confidence: calculateConfidence(candidates),
      signalWordsFound: getAllMatchedKeywords(candidates)
    };
  } else {
    return {
      primaryPattern: candidates[0].patternId,
      confidence: candidates[0].score,
      signalWordsFound: candidates[0].evidence
    };
  }
}
```

---

<a name="hybrid-patterns"></a>
## 4. Hybrid Pattern Detection

### Types of Hybrid Prompts

```typescript
interface HybridPromptTypes {
  // TYPE 1: Sequential Hybrid (Answer Part A, then Part B)
  sequential: {
    definition: "Prompt has distinct parts that should be addressed separately",
    structure: "Part 1: [Question A]. Part 2: [Question B].",
    example: {
      prompt: "What academic areas most pique your curiosity (Part 1), and how do the programs offered at Princeton suit your particular interests (Part 2)?",
      patterns: ["Pattern 2: Why Major", "Pattern 1: Why School"],
      approach: "Answer both parts, but treat as distinct sections"
    },
    evaluation: "Apply both rubrics, integrate scores with weighted average"
  },

  // TYPE 2: Integrated Hybrid (Answer A and B together)
  integrated: {
    definition: "Prompt asks about multiple things that should be woven together",
    structure: "How will [A] enable you to [B]?",
    example: {
      prompt: "How will the life experiences that shape who you are today enable you to contribute to Harvard?",
      patterns: ["Pattern 4: Community/Background", "Pattern 11: Contribution"],
      approach: "Weave both together - show how A leads to B"
    },
    evaluation: "Apply both rubrics, but expect integrated response (not sequential)"
  },

  // TYPE 3: Nested Hybrid (Primary prompt with sub-questions)
  nested: {
    definition: "Main question with follow-up clarifications",
    structure: "Main question? [Clarification 1]. [Clarification 2].",
    example: {
      prompt: "Why Duke? (If there is something specific that attracts you to our academic offerings... feel free to include that too.)",
      patterns: ["Pattern 1: Why School (primary)", "Pattern 2: Why Major (optional nested)"],
      approach: "Answer primary question, optionally include nested elements"
    },
    evaluation: "Primary pattern is dominant, nested pattern is supplementary"
  }
};
```

### Hybrid Detection Algorithm

```typescript
function detectHybrid(prompt: string, candidates: PatternCandidate[]): HybridAnalysis {
  // Check if multiple high-scoring candidates
  const topCandidates = candidates.filter(c => c.score > 50);

  if (topCandidates.length < 2) {
    return { isHybrid: false };
  }

  // Analyze prompt structure
  const sentences = splitIntoSentences(prompt);
  const questions = countQuestions(prompt); // How many '?' marks

  // SEQUENTIAL HYBRID DETECTION
  if (questions > 1 || prompt.includes("Part 1") || prompt.includes("Part 2")) {
    return {
      isHybrid: true,
      hybridType: "sequential",
      patterns: topCandidates.slice(0, 2).map(c => c.patternId),
      guidance: "Address each part separately in essay"
    };
  }

  // INTEGRATED HYBRID DETECTION
  if (prompt.includes("enable you to") || prompt.includes("how will") || prompt.includes("and how")) {
    return {
      isHybrid: true,
      hybridType: "integrated",
      patterns: topCandidates.slice(0, 2).map(c => c.patternId),
      guidance: "Weave both elements together in essay"
    };
  }

  // NESTED HYBRID DETECTION
  if (prompt.includes("(") || prompt.includes("if applicable") || prompt.includes("feel free")) {
    return {
      isHybrid: true,
      hybridType: "nested",
      primaryPattern: candidates[0].patternId,
      secondaryPattern: candidates[1].patternId,
      guidance: "Focus on primary question, optionally include secondary element"
    };
  }

  // If multiple high scores but no clear hybrid structure, flag for manual review
  return {
    isHybrid: "uncertain",
    requiresManualReview: true,
    candidates: topCandidates
  };
}
```

### Real-World Hybrid Examples

```typescript
const hybridExamples = [
  {
    school: "Princeton",
    prompt: "What academic areas most pique your curiosity, and how do the programs offered at Princeton suit your particular interests?",
    classification: {
      hybridType: "sequential",
      pattern1: "why_major_academic_interest",
      pattern2: "why_this_school",
      splitRecommendation: "First 125 words on academic interests, last 125 words on Princeton programs"
    }
  },

  {
    school: "Harvard",
    prompt: "How will the life experiences that shape who you are today enable you to contribute to Harvard?",
    classification: {
      hybridType: "integrated",
      pattern1: "community_background_identity",
      pattern2: "contribution_to_college",
      approach: "Show how background LEADS TO contribution (cause → effect)"
    }
  },

  {
    school: "Duke",
    prompt: "What is your impression of Duke as a university and community, and why do you believe it is a good match for your goals, values, and interests? If there is something specific that attracts you to our academic offerings in Trinity College of Arts and Sciences or the Pratt School of Engineering, or to our co-curricular opportunities, feel free to include that too.",
    classification: {
      hybridType: "nested",
      primaryPattern: "why_this_school",
      secondaryPattern: "why_major_academic_interest (optional)",
      approach: "Focus on Why Duke, optionally mention specific academic programs"
    }
  },

  {
    school: "Northwestern",
    prompt: "What aspects of your background (your identity, your school setting, your community, your household, etc.) have most shaped how you see yourself engaging in Northwestern's community, be it academically, extracurricularly, culturally, politically, socially, or otherwise?",
    classification: {
      hybridType: "integrated",
      pattern1: "community_background_identity",
      pattern2: "contribution_to_college",
      approach: "Connect background to future Northwestern engagement"
    }
  }
];
```

---

<a name="confidence-scoring"></a>
## 5. Confidence Scoring

### Confidence Score Calculation

```typescript
interface ConfidenceScoring {
  // Confidence = How certain are we of the classification?

  scoring: {
    highConfidence: {
      range: "85-100",
      criteria: [
        "Multiple primary signal words matched (3+)",
        "Structural patterns clearly align",
        "Top candidate scores 30+ points higher than second candidate",
        "Pattern appears in verified examples from supplementals.md"
      ],
      action: "Proceed with classification, no manual review needed"
    },

    mediumConfidence: {
      range: "60-84",
      criteria: [
        "1-2 primary signal words matched",
        "Structural patterns partially align",
        "Top candidate scores 15-29 points higher than second",
        "May be hybrid prompt"
      ],
      action: "Flag for review if consequences are high, otherwise proceed"
    },

    lowConfidence: {
      range: "0-59",
      criteria: [
        "No clear primary signal words",
        "Structural patterns ambiguous",
        "Multiple candidates within 10 points of each other",
        "Unusual or creative prompt structure"
      ],
      action: "REQUIRE manual review before proceeding"
    }
  },

  calculationFormula: `
    baseConfidence = topCandidateScore;

    // Boost confidence if clear winner
    if (topScore - secondScore > 30) {
      baseConfidence += 15;
    }

    // Boost confidence if multiple signal words
    if (primaryKeywordsMatched >= 3) {
      baseConfidence += 10;
    }

    // Reduce confidence if structural ambiguity
    if (structuralSignals.conflicting > 0) {
      baseConfidence -= 10;
    }

    // Reduce confidence if novel prompt
    if (!seenInTrainingData) {
      baseConfidence -= 20;
    }

    finalConfidence = clamp(baseConfidence, 0, 100);
  `
};
```

### Confidence Flags and Warnings

```typescript
interface ConfidenceFlags {
  // Automatic flags based on confidence and context

  highConfidenceWarnings: {
    "overconfidence_bias": "Even high confidence can be wrong - validate against examples",
    "context_missing": "Some prompts need college-specific context for accurate classification"
  },

  lowConfidenceActions: {
    "manual_review_required": {
      trigger: "Confidence < 60",
      action: "Send to human reviewer before proceeding",
      fallback: "If no reviewer available, classify as 'Pattern 13: School-Specific Unique'"
    },

    "request_more_context": {
      trigger: "Confidence < 70 AND context_available === false",
      action: "Ask user to provide full prompt or college-specific information",
      example: "Is this prompt asking about academic interests at [College], or in general?"
    },

    "use_sonnet_for_deep_analysis": {
      trigger: "Confidence < 85 AND stakes === 'high'",
      action: "Invoke Sonnet (Stage 3) for contextual reasoning",
      cost: "+$0.02 per classification",
      benefit: "Typically increases confidence by 15-25 points"
    }
  },

  specialCases: {
    "uchicago_always_pattern_13": {
      rule: "If college === 'UChicago' AND prompt.includes('extended essay'), classify as Pattern 13 regardless of content",
      reason: "UChicago essays are always unique and creative"
    },

    "stanford_roommate_always_unique": {
      rule: "If prompt.includes('roommate'), classify as Pattern 13 (Stanford-specific)",
      reason: "Roommate essay is Stanford's signature prompt"
    },

    "very_short_likely_pattern_10": {
      rule: "If wordCount <= 50 AND multiple_questions, likely Pattern 10",
      confidence_boost: "+20 points to Pattern 10 score"
    }
  }
};
```

---

<a name="edge-cases"></a>
## 6. Edge Case Handling

### Common Edge Cases and Solutions

```typescript
const edgeCaseHandling = {
  // EDGE CASE 1: Ambiguous "Why School" vs "Why Major"
  edgeCase1: {
    problem: "Prompt asks about academic interests but doesn't explicitly mention college name",
    example: "What do you want to study and why?",
    solution: {
      check1: "Does prompt appear on college-specific application?",
      ifYes: "Likely hybrid Pattern 1+2 (Why School/Why Major)",
      ifNo: "Pure Pattern 2 (Why Major)",

      reasoning: "If on college's application, they want to know why at THEIR school, even if not stated explicitly"
    }
  },

  // EDGE CASE 2: "Contribution" that sounds like "Community"
  edgeCase2: {
    problem: "Prompt asks about background AND contribution in one question",
    example: "How will your background enable you to contribute?",
    solution: {
      classification: "Hybrid Pattern 4 + Pattern 11",
      approach: "Integrated hybrid - past shapes future contribution",
      rubrics: "Apply both, weight Pattern 4 (40%) + Pattern 11 (60%)",
      reasoning: "Background is setup, contribution is focus"
    }
  },

  // EDGE CASE 3: Multiple unrelated short questions
  edgeCase3: {
    problem: "3-5 unrelated questions, 50 words each",
    example: "1) What brings you joy? 2) Favorite book? 3) What would you change about your school?",
    solution: {
      classification: "Pattern 10 (Short Answer Compilation)",
      evaluation: "Evaluate as a SET, not individually",
      rubric: "Use Pattern 10 rubric focusing on coherence, personality, and authenticity across all answers"
    }
  },

  // EDGE CASE 4: Creative/Unusual prompts (UChicago-style)
  edgeCase4: {
    problem: "Prompt is highly creative, doesn't fit standard patterns",
    example: "If you could create a new ice cream flavor inspired by your life, what would it be and why?",
    solution: {
      classification: "Pattern 13 (School-Specific Unique)",
      approach: "Flag for manual rubric creation",
      fallbackRubric: "Use Pattern 9 (Creativity/Intellect) as closest match",
      confidence: "Always mark as < 70 confidence"
    }
  },

  // EDGE CASE 5: Optional vs Required
  edgeCase5: {
    problem: "Prompt says 'optional' - does this change classification?",
    solution: {
      classification: "No change - classify based on content, not optionality",
      note: "Optionality affects strategy (whether to write it), not evaluation (how to write it)",
      caveat: "Optional essays sometimes allow more freedom, may increase Pattern 12 (Diversity) or Pattern 13 (Unique) likelihood"
    }
  },

  // EDGE CASE 6: "Tell us anything else" catchall
  edgeCase6: {
    problem: "Open-ended 'anything else' or 'additional information' space",
    example: "Is there anything else you'd like us to know?",
    solution: {
      classification: "Pattern 12 (Diversity/Unique Perspective) OR additional info (not graded)",
      decision: "If part of required supplementals → Pattern 12; If truly optional additional info → Different rubric",
      approach: "Classify based on context and college expectations"
    }
  },

  // EDGE CASE 7: Prompt evolution across years
  edgeCase7: {
    problem: "Prompt is similar to known pattern but with new wording",
    example: "Known Pattern 3 (Disagreement) but college rephrased it",
    solution: {
      approach: "Prioritize semantic meaning over exact keyword matching",
      validation: "Check against examples from multiple years in supplementals.md",
      confidence: "If novel wording, reduce confidence by 10 points",
      action: "Add to training examples for future classification"
    }
  }
};
```

### Fallback Classification Strategy

```typescript
const fallbackStrategy = {
  // When confidence is too low, use this decision tree

  step1: "Can you identify ANY primary signal words from ANY pattern?",
  ifYes: "Use that pattern with lowered confidence",
  ifNo: "Proceed to step 2",

  step2: "What is the temporal framing (past, present, future)?",
  answers: {
    past: "Default to Pattern 6 (Meaningful Activity) as most general past-tense pattern",
    present: "Default to Pattern 7 (Joy/Vitality) as most general present-tense pattern",
    future: "Default to Pattern 11 (Contribution) as most general future-tense pattern"
  },

  step3: "If still unclear, check word count",
  veryShort: "Default to Pattern 10 (Short Answers)",
  mediumLong: "Default to Pattern 13 (School-Specific Unique) and flag for manual review",

  step4: "As absolute last resort",
  action: "Classify as Pattern 13 (School-Specific Unique)",
  reasoning: "Pattern 13 is the 'catch-all' for unusual prompts",
  requireManualReview: true
};
```

---

<a name="implementation"></a>
## 7. Implementation Guide

### Integration with Evaluation System

```typescript
interface SystemIntegration {
  // How Pattern Recognition Engine connects to overall system

  workflow: {
    step1: "Student submits essay prompt + their essay draft",

    step2: {
      action: "Pattern Recognition Engine classifies prompt",
      output: {
        primaryPattern: "e.g., 'why_this_school'",
        confidence: 92,
        hybridInfo: null
      }
    },

    step3: {
      action: "System retrieves appropriate rubric from UNIVERSAL_PATTERN_RUBRICS.md",
      lookup: "Load Pattern 1 (Why This School) universal rubric"
    },

    step4: {
      action: "System retrieves college overlay from COLLEGE_OVERLAY_DATABASE.md",
      lookup: "Load Harvard Why This School overlay",
      result: "Adjusted weights, college-specific red/green flags"
    },

    step5: {
      action: "System applies multi-stage analysis (from SYSTEM_ARCHITECTURE.md)",
      stages: {
        stage1: "Haiku identifies pattern adherence",
        stage2: "Haiku checks structure",
        stage3: "Sonnet performs deep content evaluation using universal rubric + college overlay",
        stage4: "Sonnet generates teaching feedback"
      }
    },

    step6: {
      action: "Return comprehensive feedback to student",
      includes: [
        "Pattern classification (so student understands essay type)",
        "Score breakdown by dimension",
        "College-specific flags triggered",
        "Socratic questions for improvement",
        "Elite examples for reference"
      ]
    }
  }
};
```

### Error Handling and Validation

```typescript
interface ErrorHandling {
  // Robust error handling for classification failures

  scenario1_lowConfidence: {
    trigger: "Confidence < 60",
    actions: [
      "Log classification details for manual review",
      "Flag essay in system as 'requires human verification'",
      "Proceed with best-guess classification BUT include disclaimer",
      "Use most conservative rubric (fewer deductions for pattern mismatch)"
    ]
  },

  scenario2_conflictingSignals: {
    trigger: "Multiple patterns score within 5 points of each other",
    actions: [
      "Classify as hybrid if makes semantic sense",
      "Otherwise, default to most common pattern (Pattern 1 or 2)",
      "Flag for review",
      "Include note in feedback: 'Your prompt may fit multiple patterns'"
    ]
  },

  scenario3_novelPrompt: {
    trigger: "Prompt doesn't match any known examples",
    actions: [
      "Classify as Pattern 13 (School-Specific Unique)",
      "Require manual rubric creation",
      "Use Pattern 9 (Creativity) as temporary fallback",
      "Add to database for future training"
    ]
  },

  scenario4_technicalFailure: {
    trigger: "API failure, timeout, or system error",
    actions: [
      "Retry classification up to 3 times",
      "If persistent failure, alert system admin",
      "Provide user with error message and manual classification option",
      "Log error for debugging"
    ]
  },

  validation: {
    postClassification: [
      "Verify pattern exists in UNIVERSAL_PATTERN_RUBRICS.md",
      "Verify college overlay exists in COLLEGE_OVERLAY_DATABASE.md (if applicable)",
      "Check that confidence score is rational (0-100)",
      "Ensure output format matches expected schema"
    ]
  }
};
```

### Testing and Accuracy Measurement

```typescript
const testingFramework = {
  // Validate classification accuracy against known examples

  testDataset: {
    source: "All 157 prompts from supplementals.md with manual pattern labels",
    size: 157,
    distribution: [
      "Pattern 1: 30 examples",
      "Pattern 2: 29 examples",
      "Pattern 3: 7 examples",
      "Pattern 4: 9 examples",
      "Pattern 5: 7 examples",
      "Pattern 6: 8 examples",
      "Pattern 7: 5 examples",
      "Pattern 8: 6 examples",
      "Pattern 9: 7 examples",
      "Pattern 10: 15 examples",
      "Pattern 11: 12 examples",
      "Pattern 12: 10 examples",
      "Pattern 13: 5 examples",
      "Pattern 14: 3 examples",
      "Hybrid: 4 examples"
    ]
  },

  accuracyTargets: {
    overall: "95% accuracy on test dataset",
    highFrequency: "98% accuracy on Patterns 1, 2, 4 (most common)",
    lowFrequency: "85% accuracy on rare patterns (13, 14)",
    hybridDetection: "90% accuracy on hybrid classification",
    confidence: "90% of high-confidence classifications (>85) are correct"
  },

  testingProcedure: {
    step1: "Run all 157 prompts through Pattern Recognition Engine",
    step2: "Compare output to manual labels (ground truth)",
    step3: "Calculate accuracy, precision, recall for each pattern",
    step4: "Identify misclassifications and analyze causes",
    step5: "Refine signal words and algorithms based on errors",
    step6: "Re-test until accuracy targets met"
  },

  continuousImprovement: {
    feedback_loop: "When manual reviews correct a classification, update training data",
    version_control: "Track algorithm changes and accuracy over time",
    annual_update: "Review and update patterns based on new application cycle prompts"
  }
};
```

### API Interface

```typescript
interface PatternRecognitionAPI {
  // Clean API for integration with main system

  endpoint: "/api/classify-pattern",

  request: {
    method: "POST",
    body: {
      prompt: string,              // Required: The essay prompt
      college: string,             // Required: School name
      wordCount: number,           // Required: Required word count
      context?: string,            // Optional: Additional context
      forceDeepAnalysis?: boolean  // Optional: Skip Haiku, go straight to Sonnet
    }
  },

  response: {
    success: {
      status: 200,
      body: {
        primaryPattern: PatternType,
        confidence: number,
        secondaryPatterns?: PatternType[],
        hybridType?: "sequential" | "integrated" | "nested",
        signalWordsFound: string[],
        recommendedRubric: string,
        recommendedOverlay: string,
        warnings?: string[],
        processingCost: number,
        processingTime: number
      }
    },

    error: {
      status: 400 | 500,
      body: {
        error: string,
        message: string,
        fallbackPattern?: PatternType,
        requiresManualReview: boolean
      }
    }
  },

  exampleUsage: `
    const result = await fetch('/api/classify-pattern', {
      method: 'POST',
      body: JSON.stringify({
        prompt: "What is it about Yale that has led you to apply?",
        college: "Yale",
        wordCount: 125
      })
    });

    // Response:
    {
      primaryPattern: "why_this_school",
      confidence: 98,
      signalWordsFound: ["what is it about", "Yale", "led you to apply"],
      recommendedRubric: "Pattern_1_Why_This_School_Universal",
      recommendedOverlay: "Yale_Why_This_School_Overlay",
      processingCost: 0.01,
      processingTime: 1.2
    }
  `
};
```

---

## Summary: Pattern Recognition Engine

### Key Capabilities

1. **Automatic Pattern Classification**: Identifies which of 14 patterns a prompt belongs to
2. **Hybrid Detection**: Recognizes when prompts combine multiple patterns
3. **Confidence Scoring**: Provides reliability score for classification
4. **College Context**: Considers college-specific traditions and prompt styles
5. **Cost-Effective**: Uses Haiku for most classifications ($0.01), Sonnet only when needed ($0.03)
6. **Robust Error Handling**: Graceful degradation when confidence is low
7. **Continuous Learning**: Improves accuracy over time with feedback

### Integration Points

- **Input**: Essay prompt + college name + word count
- **Output**: Pattern classification + recommended rubric + recommended college overlay
- **Downstream**: Feeds into evaluation system (SYSTEM_ARCHITECTURE.md)
- **Accuracy**: Target 95% overall, 98% on common patterns

### Cost Structure

- **90% of classifications**: $0.01 (Haiku only, high confidence)
- **10% of classifications**: $0.03 (Haiku + Sonnet for ambiguous cases)
- **Average cost**: $0.011 per classification
- **Total system cost**: $0.011 (classification) + $0.27 (evaluation) = **$0.28 per essay**

---

**Next Steps**: This pattern recognition engine integrates with the existing architecture documents to create a complete end-to-end Common App workshop system. The engine ensures that every essay is evaluated using the correct rubric and college-specific overlay, maximizing evaluation accuracy and teaching effectiveness.
