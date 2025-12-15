# Brown University - Complete Overlay (Draft for Integration)

This draft will be integrated into COLLEGE_OVERLAY_DATABASE.md at line 4706.

---

### College Overlay #11: Brown University

```typescript
const brownApplicationOverlay = {
  collegeId: "brown",
  pattern: "why_this_school", // Primary pattern, but Brown is essay-heavy with 7 total prompts
  promptLocation: "supplementals.md:various",

  // Brown has 7 essay/short answer prompts (essay-heavy among Ivies)
  essayStructure: {
    commonApp: "650 words - Personal statement",
    brownSupplements: {
      openCurriculum: "200-250 words - Academic interests essay",
      background: "200-250 words - Identity/lived experience essay",
      joy: "200-250 words - What brings you joy",
      threeWords: "3 words - Self-description",
      meaningfulEC: "100 words - Most meaningful extracurricular",
      teachClass: "100 words - If you could teach a class",
      whyBrownSentence: "50 words - In one sentence, why Brown?"
    }
  },

  // CRITICAL CONTEXT from essay-focused research:
  // - CDS rates essays as "Very Important" (one of few schools to do so)
  // - Essays rated same level as GPA, rigor, scores, talent, character
  // - Dean Logan Powell: essays are "at the heart of an application"
  // - Essays reveal: authentic voice, identity, values, joy, intellectual curiosity, community fit
  // - Post-affirmative action: essays carry identity/lived experience assessment

  brownCoreValues: {
    "Open Curriculum": 100,                         // THE defining Brown feature
    "Authentic Intellectual Engagement": 95,        // Dean Quinlan framework
    "Student Voice and Authenticity": 95,           // Powell: "hear the student in their own voice"
    "Identity and Lived Experience": 90,            // Post-SCOTUS emphasis
    "Community Contribution": 90,                   // "Each applicant has unique experiences to contribute"
    "Joy and Well-Being": 85,                       // Entire essay dedicated to this
    "Creativity": 85,                               // "Brown values creativity"
    "Character and Personal Qualities": 100,        // CDS "Very Important"
    "Intellectual Curiosity and Independence": 95,  // Open Curriculum requires self-direction
    "Service and Civic Engagement": 80              // Public service tradition
  },

  // Essay-specific dimensional weights (varies by prompt)
  dimensionWeightsByPrompt: {
    openCurriculum: {
      character_values: 25,                         // CDS "Very Important"
      intellectual_curiosity_independence: 20,      // OC requires self-direction
      identity_lived_experience: 15,                // Woven throughout
      community_orientation: 15,                    // Collaboration emphasis
      joy_well_being: 10,                          // Positive outlook
      institutional_fit_openCurriculum: 10,        // OC understanding + Brown specifics
      writing_quality_voice: 5                      // Threshold factor
    },
    background: {
      identity_lived_experience: 35,                // Primary focus
      character_values: 25,                         // How experiences shaped you
      community_contribution: 20,                   // "What unique contributions"
      growth_reflection: 15,                        // "How moments shaped who you are"
      authenticity: 5                               // Genuine vs. performative
    },
    joy: {
      joy_well_being: 40,                          // Entire prompt focus
      character_values: 30,                         // What joy reveals about values
      authenticity: 20,                             // Genuine vs. what they want
      depth_reflection: 10                          // What joy reveals (not just description)
    }
  },

  specificExpectations: {
    must_mention: [
      "Open Curriculum (absolutely non-negotiable)",
      "At least 2 specific Brown courses/programs/professors",
      "Demonstrate understanding that OC requires self-direction"
    ],
    strongly_recommended: [
      "Shopping period mention (unique Brown feature)",
      "How you'll use OC to explore breadth AND depth",
      "Specific contributions you'll make to Brown community",
      "Authentic voice (not consultant-written)"
    ],
    avoid_at_all_costs: [
      "NO OPEN CURRICULUM MENTION (automatic major penalty)",
      "Prestige language ('top-ranked Ivy')",
      "Career-only focus without intellectual curiosity",
      "Generic 'flexibility' praise without explaining how you'll use OC",
      "Over-polished consultant voice (Powell warns against this)",
      "Laundry list of accomplishments (activities list covers this)",
      "Excessive profanity or shock value (Brown AO rejected strong applicant for F-bombs)"
    ]
  },

  brownSpecificRedFlags: [
    {
      flag: "NO_OPEN_CURRICULUM_MENTION",
      penalty: -30,
      severity: "critical",
      explanation: "Open Curriculum is Brown's defining feature. Not mentioning it shows zero research and poor fit understanding.",
      source: "Brown research: OC mentioned in 13/15 sources as non-negotiable"
    },
    {
      flag: "CAREER_ONLY_NO_CURIOSITY",
      penalty: -20,
      severity: "critical",
      explanation: "Brown values intellectual curiosity for its own sake, not just career preparation. Essays must show genuine interest in learning and ideas.",
      source: "Dean Powell + CollegeVine: intellectual curiosity emphasized 12/15 sources"
    },
    {
      flag: "OVER_POLISHED_CONSULTANT_VOICE",
      penalty: -18,
      severity: "high",
      explanation: "Powell explicitly warns: 'what we want is to hear the student in their own voice' - over-edited essays are red flag",
      source: "Brown Daily Herald interview with Dean Powell (2021)"
    },
    {
      flag: "GENERIC_IVY_LANGUAGE",
      penalty: -15,
      severity: "high",
      explanation: "Essay must be Brown-specific, not applicable to other Ivies. Generic praise shows lack of genuine research.",
      examples: ["'Prestigious education'", "'World-class faculty'", "'Elite institution'"]
    },
    {
      flag: "ACCOMPLISHMENT_LIST_NO_REFLECTION",
      penalty: -14,
      severity: "high",
      explanation: "Activities list shows accomplishments. Essays must show reflection, character, values - not résumé recap.",
      source: "Brown Pre-College: 'concentrate on one or two key aspects... activities section will showcase accomplishments'"
    },
    {
      flag: "EXCESSIVE_PROFANITY",
      penalty: -25,
      severity: "critical",
      explanation: "Brown AO explicitly rejected strong applicant for excessive 'F-bombs' in essay. Authenticity ≠ poor judgment.",
      source: "Aralia Education: Brown AO anecdote"
    },
    {
      flag: "MISUNDERSTANDS_OPEN_CURRICULUM",
      penalty: -12,
      severity: "high",
      explanation: "Treating OC as 'easy' or 'avoid hard classes' shows fundamental misunderstanding. OC requires self-direction and intellectual maturity.",
      examples: ["'I can take whatever I want'", "'No boring requirements'", "'More free time'"]
    },
    {
      flag: "NO_SPECIFIC_BROWN_OFFERINGS",
      penalty: -13,
      severity: "high",
      explanation: "Must name specific courses, professors, or programs. Generic 'great departments' shows insufficient research.",
      requirement: "Name at least 2 specific offerings"
    }
  ],

  brownSpecificGreenFlags: [
    {
      flag: "OPEN_CURRICULUM_DEEP_UNDERSTANDING",
      boost: +20,
      explanation: "Shows understanding of OC beyond 'no requirements' - explains how you'll use freedom to explore broadly while diving deep",
      examples: [
        "Explains HOW you'll use OC flexibility",
        "Mentions shopping period",
        "Shows you understand OC requires self-direction",
        "Balance of depth (concentration) + breadth (exploration)"
      ]
    },
    {
      flag: "AUTHENTIC_STUDENT_VOICE",
      boost: +15,
      explanation: "Voice sounds genuinely like curious high schooler, not consultant. Powell's #1 criterion.",
      source: "Powell: 'what we want is to hear the student in their own voice, as clearly as they can possibly convey it'"
    },
    {
      flag: "INTELLECTUAL_CURIOSITY_EVIDENT",
      boost: +18,
      explanation: "Shows genuine curiosity about ideas, questions, learning for its own sake - not just career prep",
      examples: [
        "Specific questions you're curious about",
        "Books/topics you've explored independently",
        "Interdisciplinary connections you want to make"
      ]
    },
    {
      flag: "IDENTITY_CONTRIBUTION_CONNECTED",
      boost: +16,
      explanation: "Background/identity essay clearly connects lived experience to specific Brown contributions",
      source: "Powell: 'Each applicant has a unique set of experiences they can contribute to the Brown community'"
    },
    {
      flag: "JOY_REVEALS_CHARACTER",
      boost: +12,
      explanation: "Joy essay goes beyond describing what brings joy to revealing what it says about your character and values",
      source: "Powell: 'those things students do that bring them joy... it's important for them to think about what those things are'"
    },
    {
      flag: "SPECIFIC_BROWN_RESEARCH",
      boost: +14,
      explanation: "Names 3+ specific Brown offerings (courses, professors, programs) with personal connection showing deep research",
      examples: [
        "Specific course names/numbers",
        "Professor names with understanding of their work",
        "Lesser-known programs (not just famous ones)"
      ]
    },
    {
      flag: "DEPTH_OF_REFLECTION",
      boost: +13,
      explanation: "Essay shows self-awareness, introspection, and growth mindset through thoughtful reflection on experiences",
      source: "Brown research: 'depth of reflection' mentioned 10/15 sources as key criterion"
    }
  ]
};
```

---

#### Brown University - Hybrid Qualitative Scoring Architecture

**Note**: Brown has 7 prompts. Below are comprehensive rubrics for the 3 main essays (200-250w each). Short answers (3 words, 100w, 50w) have simplified criteria.

---

##### Brown Open Curriculum Essay - Overall Scoring Rubric (200-250 words)

**Prompt**: "Brown's Open Curriculum allows students to explore broadly while also diving deeply into their academic pursuits. Tell us about any academic interests that excite you, and how you might pursue them at Brown."

```typescript
brownOpenCurriculumScoringRubric = {

  "90-100_Excellent": {
    description: "Outstanding - demonstrates exceptional intellectual curiosity, OC understanding, and specific Brown research",
    overallCriteria: [
      "Shows genuine intellectual curiosity through specific questions/fascinations (not career goals alone)",
      "Demonstrates deep understanding of Open Curriculum - explains HOW you'll use freedom",
      "Names 3+ specific Brown offerings with personal connection",
      "Shows interdisciplinary thinking or balance of depth + breadth",
      "Authentic voice - sounds like curious student",
      "Articulates why OC specifically enables your intellectual path"
    ],
    typicalCharacteristics: [
      "Opens with specific intellectual interest/question",
      "Explains how interest developed through personal exploration",
      "Names specific Brown courses/professors with understanding",
      "Mentions how OC flexibility allows unique combinations",
      "Shows maturity - understands OC requires self-direction",
      "Balance: depth in concentration + breadth through exploration"
    ],
    dimensionalPattern: {
      intellectual_curiosity_independence: "STRONG",
      character_values: "STRONG",
      institutional_fit_openCurriculum: "STRONG",
      authenticity: "STRONG"
    }
  },

  "70-89_Good": {
    description: "Strong essay with solid intellectual interests but minor gaps in OC understanding or specificity",
    overallCriteria: [
      "Shows intellectual interest but may be more career-focused",
      "Mentions OC but may not fully explain how you'll use it",
      "Names 2 specific Brown offerings",
      "Some interdisciplinary thinking",
      "Voice genuine but not deeply personal",
      "Demonstrates Brown interest but could be more OC-specific"
    ],
    whatPreventsHigherScore: "To reach 90+: (1) show curiosity beyond career, (2) deeper OC understanding, (3) add 1-2 more Brown specifics, (4) explain why OC matters to YOUR learning style"
  },

  "50-69_Average": {
    description: "Adequate but unremarkable - lacks intellectual depth or OC understanding",
    overallCriteria: [
      "Primarily career-focused without curiosity",
      "Generic OC language without understanding",
      "Vague program mentions",
      "Limited interdisciplinary thinking",
      "Voice feels performative",
      "Could apply to other open curriculum schools"
    ],
    whatPreventsHigherScore: "To reach 70+: (1) shift to intellectual curiosity, (2) research Brown specifics, (3) explain HOW you'll use OC, (4) show OC requires self-direction"
  },

  "below_50_Weak": {
    description: "Does not meet Brown's expectations",
    criticalFailures: [
      "No Open Curriculum mention",
      "No specific Brown offerings",
      "Career/prestige-only focus",
      "Generic Ivy language"
    ]
  }
}
```

Due to Brown's complexity (7 essays), I'm creating a comprehensive but focused overview. The full integration with all dimensional criteria, background essay rubric, joy essay rubric, and verification sources would be ~800+ lines.

**Should I**:
A) Complete full Brown integration now (~800 lines covering all 7 prompts in detail)?
B) Do Brown in phases (Open Curriculum essay first, then others)?
C) Move to Carnegie Mellon next and batch Brown completion?

What's your preference for maintaining momentum while ensuring thoroughness?
