/**
 * Teaching Example Corpus
 *
 * High-quality human-written weak→strong example pairs that teach students
 * how to fix specific issues in their extracurricular narratives.
 *
 * Design Principles:
 * - Natural, varied, original, authentic
 * - Culturally diverse
 * - Weak: 8-18 words, Strong: 12-40 words
 * - Clear before/after diff
 * - Issue-type specific
 */

export interface TeachingExample {
  id: string;
  issueType: string;                     // Maps to DetectedIssue category pattern
  category: string;                      // Rubric category
  weakExample: string;
  strongExample: string;
  explanation: string;                   // What changed and why
  diffHighlights: string[];              // Key improvements
  applicableCategories: string[];        // Which activity types? (e.g., ['service', 'leadership'])
  culturalContext?: string;              // Optional: cultural background if relevant
}

// ============================================================================
// VOICE & AUTHENTICITY EXAMPLES
// ============================================================================

const voiceExamples: TeachingExample[] = [
  {
    id: 'voice-001-essay-speak',
    issueType: 'voice-essay-speak',
    category: 'Voice Integrity',
    weakExample: 'Through this experience, I learned valuable lessons about teamwork and dedication.',
    strongExample: 'When Sarah caught my coding mistake hours before the client demo, I realized great teams make everyone better.',
    explanation: 'The strong version shows the learning through a specific moment rather than stating it. It removes essay-speak ("through this experience") and generic lessons ("teamwork") and replaces them with concrete details.',
    diffHighlights: [
      'Removed "through this experience" (essay-speak)',
      'Removed generic "learned teamwork"',
      'Added specific moment (Sarah, coding mistake, client demo)',
      'Showed insight through story, not statement'
    ],
    applicableCategories: ['leadership', 'academic', 'work', 'research']
  },

  {
    id: 'voice-002-passive',
    issueType: 'voice-passive',
    category: 'Voice Integrity',
    weakExample: 'The fundraiser was organized by our team and $5,000 was raised for the shelter.',
    strongExample: 'I coordinated 12 volunteers across marketing, logistics, and outreach. We raised $5,020 for the shelter.',
    explanation: 'Active voice puts you at the center of the action and clarifies YOUR specific role. Passive voice ("was organized by") obscures agency and makes you sound distant from your own story.',
    diffHighlights: [
      'Changed passive "was organized" to active "I coordinated"',
      'Clarified specific role (marketing, logistics, outreach)',
      'Added concrete number (12 volunteers)',
      'Kept team outcome but showed individual contribution'
    ],
    applicableCategories: ['leadership', 'service', 'advocacy']
  },

  {
    id: 'voice-003-vocabulary-showing-off',
    issueType: 'voice-vocabulary',
    category: 'Voice Integrity',
    weakExample: 'I encountered a plethora of challenges that required multifaceted solutions.',
    strongExample: 'I faced 8 technical problems in two weeks — each one needed a different approach.',
    explanation: 'Simple, precise language sounds more authentic and confident than fancy vocabulary. "Plethora" and "multifaceted" feel like you\'re trying to impress rather than communicate.',
    diffHighlights: [
      'Replaced "plethora" with specific number (8)',
      'Replaced "multifaceted solutions" with plain "different approach"',
      'Added timeframe (two weeks)',
      'Result: Clearer, more credible, more authentic'
    ],
    applicableCategories: ['research', 'academic', 'work']
  },

  {
    id: 'voice-004-conversational-authentic',
    issueType: 'voice-essay-speak',
    category: 'Voice Integrity',
    weakExample: 'This opportunity afforded me the chance to develop my leadership capabilities.',
    strongExample: 'Turns out, leading 15 freshmen through their first robotics build taught me more than any summer camp could.',
    explanation: 'Conversational openers like "Turns out" signal authenticity and feel less manufactured. The strong version also adds specific details (15 freshmen, robotics build) and shows learning through comparison.',
    diffHighlights: [
      'Removed stiff "afforded me the chance"',
      'Added conversational "Turns out"',
      'Added specific details (15 freshmen, robotics)',
      'Showed learning through comparison (vs summer camp)'
    ],
    applicableCategories: ['leadership', 'academic', 'arts']
  }
];

// ============================================================================
// SPECIFICITY & EVIDENCE EXAMPLES
// ============================================================================

const specificityExamples: TeachingExample[] = [
  {
    id: 'spec-001-add-metrics',
    issueType: 'specificity-no-numbers',
    category: 'Specificity & Evidence',
    weakExample: 'I volunteered frequently at the food bank.',
    strongExample: 'Every Tuesday, 6-9pm, for 18 months, I organized food distribution for 200+ families at the local food bank.',
    explanation: 'Specific numbers build credibility and help admissions officers gauge the scale of your work. "Frequently" is vague; exact times and impact are memorable.',
    diffHighlights: [
      'Added specific days and times (Tuesday, 6-9pm)',
      'Added duration (18 months)',
      'Added impact (200+ families)',
      'Changed to active verb (organized)'
    ],
    applicableCategories: ['service', 'leadership', 'work']
  },

  {
    id: 'spec-002-quantify-impact',
    issueType: 'specificity-no-numbers',
    category: 'Specificity & Evidence',
    weakExample: 'I tutored many students and helped them improve their grades.',
    strongExample: 'I tutored 7 students in AP Calculus, meeting twice weekly. Five raised their grades from C to B+ or higher.',
    explanation: 'Quantifying both input (7 students, twice weekly) and outcome (five raised grades, specific improvement) proves your work had measurable effects.',
    diffHighlights: [
      'Added student count (7)',
      'Added frequency (twice weekly)',
      'Added specific subject (AP Calculus)',
      'Added measurable outcome (C → B+, five students)'
    ],
    applicableCategories: ['academic', 'service', 'leadership']
  },

  {
    id: 'spec-003-before-after-growth',
    issueType: 'specificity-no-growth',
    category: 'Specificity & Evidence',
    weakExample: 'I improved my debate skills throughout the season.',
    strongExample: 'My first tournament: 1-4 record, nervous wreck. By finals: 4-1 record, cross-examining state champions confidently.',
    explanation: 'Before/after comparisons with concrete metrics show tangible growth. This proves you actually developed skills rather than just participated.',
    diffHighlights: [
      'Added initial state (1-4 record, nervous)',
      'Added final state (4-1 record, confident)',
      'Showed emotional progression (nervous → confident)',
      'Used specific comparison (state champions)'
    ],
    applicableCategories: ['academic', 'leadership', 'athletics']
  },

  {
    id: 'spec-004-time-commitment-depth',
    issueType: 'specificity-missing-metrics',
    category: 'Specificity & Evidence',
    weakExample: 'I dedicated significant time to the robotics team.',
    strongExample: '15 hours per week, 38 weeks per year (570 total hours) — from scouting opponents to mentoring new members.',
    explanation: 'Breaking down time commitment (per week, per year, total) and showing the range of work (scouting to mentoring) demonstrates depth and sustained dedication.',
    diffHighlights: [
      'Replaced vague "significant" with exact hours',
      'Broke down by week, year, and total',
      'Added scope of work (scouting, mentoring)',
      'Shows sustained commitment'
    ],
    applicableCategories: ['academic', 'leadership', 'athletics', 'arts']
  },

  {
    id: 'spec-005-cultural-context-numbers',
    issueType: 'specificity-no-numbers',
    category: 'Specificity & Evidence',
    weakExample: 'I helped organize cultural events for my community.',
    strongExample: 'I coordinated 3 Diwali celebrations, managing vendors, performers, and 400+ attendees across Chennai immigrant families.',
    explanation: 'Specific cultural context + concrete numbers (3 events, 400+ attendees) + role details (vendors, performers) make the contribution clear and credible.',
    diffHighlights: [
      'Added specific cultural event (Diwali)',
      'Added count (3 celebrations, 400+ attendees)',
      'Added role details (vendors, performers)',
      'Added community context (Chennai immigrant families)'
    ],
    applicableCategories: ['service', 'leadership', 'arts'],
    culturalContext: 'South Asian / Indian American'
  }
];

// ============================================================================
// REFLECTION & MEANING EXAMPLES
// ============================================================================

const reflectionExamples: TeachingExample[] = [
  {
    id: 'reflect-001-generic-to-specific',
    issueType: 'reflection-generic',
    category: 'Reflection & Meaning',
    weakExample: 'I learned leadership through organizing events.',
    strongExample: 'I used to think leadership meant having all the answers. After three event flops, I learned it\'s about asking the right questions.',
    explanation: 'Generic lessons ("learned leadership") could apply to anyone. The strong version shows a belief shift (before vs after thinking) and proves learning through failure.',
    diffHighlights: [
      'Removed generic "learned leadership"',
      'Added belief shift (having answers → asking questions)',
      'Showed vulnerability (three flops)',
      'Made insight specific and unique'
    ],
    applicableCategories: ['leadership', 'service', 'academic']
  },

  {
    id: 'reflect-002-behavioral-change',
    issueType: 'reflection-superficial',
    category: 'Reflection & Meaning',
    weakExample: 'This taught me patience.',
    strongExample: 'Now when I teach, I count to five before jumping in with the answer. Turns out, silence creates space for thinking.',
    explanation: 'Behavioral changes prove the learning was real and transferable. The strong version shows WHAT you do differently now and WHY it matters.',
    diffHighlights: [
      'Removed vague "taught me patience"',
      'Added specific behavior (count to five)',
      'Added context (when teaching)',
      'Connected to insight (silence creates thinking space)'
    ],
    applicableCategories: ['academic', 'service', 'leadership']
  },

  {
    id: 'reflect-003-surprise-discovery',
    issueType: 'reflection-missing',
    category: 'Reflection & Meaning',
    weakExample: 'I worked on research projects in the lab.',
    strongExample: 'I expected lab work to be linear. Instead, 70% of my time was troubleshooting dead ends. That\'s where the real learning happens.',
    explanation: 'Surprise indicates genuine discovery, not manufactured reflection. Showing the gap between expectation and reality makes your insight credible.',
    diffHighlights: [
      'Added expectation (linear work)',
      'Added reality (70% troubleshooting)',
      'Showed surprise (Instead...)',
      'Articulated insight (real learning in dead ends)'
    ],
    applicableCategories: ['research', 'academic', 'work']
  },

  {
    id: 'reflect-004-transferable-insight',
    issueType: 'reflection-superficial',
    category: 'Reflection & Meaning',
    weakExample: 'I realized communication is important.',
    strongExample: 'Expertise without translation is just sophisticated noise. I learned this watching my co-programmer\'s brilliant code go unused because no one understood it.',
    explanation: 'Universal insights connect your specific experience to broader human truths. The strong version uses a specific example to illustrate a principle that applies beyond the activity.',
    diffHighlights: [
      'Removed generic "communication is important"',
      'Added memorable principle (expertise without translation)',
      'Grounded in specific moment (co-programmer\'s unused code)',
      'Connects technical to human'
    ],
    applicableCategories: ['academic', 'research', 'leadership', 'work']
  },

  {
    id: 'reflect-005-philosophical-depth-grounded',
    issueType: 'reflection-missing',
    category: 'Reflection & Meaning',
    weakExample: 'I studied philosophy and ethics.',
    strongExample: 'Reading Fanon while organizing mutual aid taught me theory without practice is empty, but practice without theory is blind.',
    explanation: 'Connecting intellectual work to lived experience shows maturity. The strong version grounds philosophy (Fanon) in concrete action (mutual aid organizing).',
    diffHighlights: [
      'Named specific thinker (Fanon)',
      'Connected to action (mutual aid organizing)',
      'Articulated synthesis (theory + practice)',
      'Shows intellectual depth grounded in reality'
    ],
    applicableCategories: ['service', 'advocacy', 'academic'],
    culturalContext: 'Postcolonial studies / Social justice activism'
  }
];

// ============================================================================
// NARRATIVE ARC & STAKES EXAMPLES
// ============================================================================

const narrativeExamples: TeachingExample[] = [
  {
    id: 'narrative-001-add-stakes',
    issueType: 'narrative-no-stakes',
    category: 'Narrative Arc & Stakes',
    weakExample: 'I organized a fundraiser that succeeded.',
    strongExample: 'Three days before our fundraiser, the venue cancelled. I cold-called 12 businesses that night. We raised $5,020 — $20 over our goal.',
    explanation: 'Stories without obstacles don\'t engage readers. The strong version creates tension (venue cancelled, 3 days left), shows your response (cold-called 12), and delivers a satisfying outcome.',
    diffHighlights: [
      'Added obstacle (venue cancelled, 3 days left)',
      'Showed initiative under pressure (cold-called 12)',
      'Added specific outcome ($5,020, $20 over goal)',
      'Created narrative arc (problem → action → resolution)'
    ],
    applicableCategories: ['leadership', 'service', 'advocacy']
  },

  {
    id: 'narrative-002-turning-point',
    issueType: 'narrative-no-turning',
    category: 'Narrative Arc & Stakes',
    weakExample: 'I learned to code and built several projects.',
    strongExample: 'After three failed prototypes, I stopped forcing my original design and asked users what THEY needed. My fourth attempt launched in two weeks.',
    explanation: 'Turning points make abstract growth concrete. The strong version shows when your approach changed (after 3 failures), what triggered it (asking users), and the result (faster success).',
    diffHighlights: [
      'Added initial failure (three prototypes)',
      'Showed turning point (stopped forcing, asked users)',
      'Added result (fourth attempt in two weeks)',
      'Made growth visible and specific'
    ],
    applicableCategories: ['academic', 'research', 'work']
  },

  {
    id: 'narrative-003-vulnerability',
    issueType: 'narrative-no-stakes',
    category: 'Narrative Arc & Stakes',
    weakExample: 'I performed in several theater productions.',
    strongExample: 'My first performance: hands shaking, voice cracked on the opening line. By my sixth show, I owned the stage. Fear doesn\'t vanish; you just get better at working through it.',
    explanation: 'Vulnerability makes you relatable and shows authentic growth. The strong version admits initial fear (hands shaking, voice cracked) and shows progression (owned the stage by sixth show).',
    diffHighlights: [
      'Added vulnerability (hands shaking, voice cracked)',
      'Showed progression (first → sixth show)',
      'Added reflection (fear doesn\'t vanish)',
      'Made growth emotional and physical, not just conceptual'
    ],
    applicableCategories: ['arts', 'leadership', 'athletics']
  },

  {
    id: 'narrative-004-tension-resolution',
    issueType: 'narrative-no-stakes',
    category: 'Narrative Arc & Stakes',
    weakExample: 'I managed the school newspaper and published weekly issues.',
    strongExample: 'Two hours before print deadline, our lead story fell through. I interviewed three sources, wrote 800 words, and hit send at 11:58pm. We published on time.',
    explanation: 'Tension creates engagement. The strong version sets up a ticking clock (two hours, deadline), shows decisive action under pressure (interviewed, wrote, hit send), and delivers resolution (on time).',
    diffHighlights: [
      'Added tension (lead story fell through, deadline looming)',
      'Added time pressure (two hours, 11:58pm)',
      'Showed specific actions under pressure',
      'Created satisfying resolution (published on time)'
    ],
    applicableCategories: ['leadership', 'academic', 'work']
  }
];

// ============================================================================
// INITIATIVE & LEADERSHIP EXAMPLES
// ============================================================================

const initiativeExamples: TeachingExample[] = [
  {
    id: 'initiative-001-clarify-role',
    issueType: 'initiative-too-much-we',
    category: 'Initiative & Leadership',
    weakExample: 'We organized a fundraiser that raised $5,000.',
    strongExample: 'When our venue cancelled, I cold-called 12 businesses and secured a new space. We raised $5,020.',
    explanation: 'Clear role delineation shows your unique contributions. The strong version specifies what YOU did (cold-called, secured space) while keeping the team outcome (we raised).',
    diffHighlights: [
      'Clarified what "I" did vs "we" did',
      'Added specific action (cold-called 12 businesses)',
      'Added stakes (venue cancelled)',
      'Balanced individual contribution with team outcome'
    ],
    applicableCategories: ['leadership', 'service', 'advocacy']
  },

  {
    id: 'initiative-002-passive-to-active',
    issueType: 'initiative-passive',
    category: 'Initiative & Leadership',
    weakExample: 'I helped coordinate the volunteer schedule.',
    strongExample: 'I designed the volunteer schedule system, cutting coordination time from 3 hours to 20 minutes per week.',
    explanation: 'Words like "helped" make you sound like a helper, not a leader or owner. The strong version shows initiative (designed a system) and measurable impact (3 hours → 20 minutes).',
    diffHighlights: [
      'Replaced passive "helped coordinate" with active "designed"',
      'Added innovation (created a system)',
      'Added measurable impact (time savings)',
      'Shows ownership and problem-solving'
    ],
    applicableCategories: ['leadership', 'work', 'service']
  },

  {
    id: 'initiative-003-counterfactual-thinking',
    issueType: 'initiative-passive',
    category: 'Initiative & Leadership',
    weakExample: 'I participated in the robotics team.',
    strongExample: 'Without my vision system fix, our robot would still be missing targets. I debugged 47 edge cases in 72 hours before regionals.',
    explanation: 'Counterfactual thinking reveals your unique impact. "What would NOT have happened without you?" makes your contribution crystal clear.',
    diffHighlights: [
      'Removed passive "participated"',
      'Added counterfactual (robot would be missing targets)',
      'Added specific contribution (vision system fix)',
      'Added metrics (47 edge cases, 72 hours)'
    ],
    applicableCategories: ['academic', 'research', 'leadership']
  },

  {
    id: 'initiative-004-create-vs-maintain',
    issueType: 'initiative-passive',
    category: 'Initiative & Leadership',
    weakExample: 'I was a member of the environmental club.',
    strongExample: 'I noticed our recycling program wasn\'t working. I redesigned bin placement and signage. Contamination dropped from 40% to 8%.',
    explanation: 'Creating something new (redesigned system) is more impressive than maintaining something existing (was a member). The strong version shows problem identification, initiative, and measurable improvement.',
    diffHighlights: [
      'Replaced passive "was a member" with active "noticed, redesigned"',
      'Showed problem identification (program not working)',
      'Added specific action (bin placement, signage)',
      'Added measurable outcome (40% → 8% contamination)'
    ],
    applicableCategories: ['service', 'leadership', 'advocacy']
  }
];

// ============================================================================
// COLLABORATION EXAMPLES
// ============================================================================

const collaborationExamples: TeachingExample[] = [
  {
    id: 'collab-001-name-people',
    issueType: 'collaboration-no-credit',
    category: 'Community & Collaboration',
    weakExample: 'I completed the research project successfully.',
    strongExample: 'Dr. Kim taught me to debug without panicking. Marcus rallied the team when I froze during our failed first demo.',
    explanation: 'Acknowledging others shows humility and teamwork. Specific names make your story more credible and show you value relationships.',
    diffHighlights: [
      'Added specific people (Dr. Kim, Marcus)',
      'Showed what each taught or contributed',
      'Added vulnerability (I froze)',
      'Balanced individual + team dynamics'
    ],
    applicableCategories: ['research', 'academic', 'leadership']
  },

  {
    id: 'collab-002-relationship-evolution',
    issueType: 'collaboration-no-credit',
    category: 'Community & Collaboration',
    weakExample: 'I worked with other students on the project.',
    strongExample: 'Sarah wouldn\'t make eye contact when I asked about specs. By week three, she was asking vision questions instead of assuming we\'d fail.',
    explanation: 'Showing relationship evolution (before → after) with specific details makes community transformation visible and credible.',
    diffHighlights: [
      'Added specific person (Sarah)',
      'Showed before state (wouldn\'t make eye contact)',
      'Showed after state (asking questions, engaged)',
      'Made relationship change concrete'
    ],
    applicableCategories: ['academic', 'research', 'leadership', 'work']
  },

  {
    id: 'collab-003-culture-shift',
    issueType: 'collaboration-no-credit',
    category: 'Community & Collaboration',
    weakExample: 'I improved team collaboration.',
    strongExample: 'Before: 12 programmers working in silos, guarding their code. After: 5 new members confidently debugging together, teaching each other shortcuts.',
    explanation: 'Community transformation needs before/after contrast with evidence. The strong version shows the cultural shift (silos → collaboration) and quantifies it (5 new members, confident debugging).',
    diffHighlights: [
      'Added before state (silos, guarding code)',
      'Added after state (debugging together, teaching)',
      'Added metrics (12 programmers, 5 new members)',
      'Showed cultural change, not just individual growth'
    ],
    applicableCategories: ['leadership', 'academic', 'work']
  }
];

// ============================================================================
// COMPOSITE INDEX
// ============================================================================

export const TEACHING_EXAMPLES: TeachingExample[] = [
  ...voiceExamples,
  ...specificityExamples,
  ...reflectionExamples,
  ...narrativeExamples,
  ...initiativeExamples,
  ...collaborationExamples
];

// ============================================================================
// LOOKUP & RETRIEVAL
// ============================================================================

/**
 * Get examples that match a specific issue type
 */
export function getExamplesForIssue(issueType: string): TeachingExample[] {
  return TEACHING_EXAMPLES.filter(ex => ex.issueType === issueType);
}

/**
 * Get examples that match a category (Voice, Specificity, etc.)
 */
export function getExamplesForCategory(category: string): TeachingExample[] {
  return TEACHING_EXAMPLES.filter(ex => ex.category === category);
}

/**
 * Get examples applicable to a specific activity type
 */
export function getExamplesForActivityType(activityType: string): TeachingExample[] {
  return TEACHING_EXAMPLES.filter(ex =>
    ex.applicableCategories.includes(activityType)
  );
}

/**
 * Get best example for an issue (prioritizes exact match, falls back to category)
 */
export function getBestExampleForIssue(issueId: string, category: string, activityType?: string): TeachingExample | null {
  // Try exact issue type match first
  const exactMatches = getExamplesForIssue(issueId);
  if (exactMatches.length > 0) {
    // If activity type provided, prefer matching examples
    if (activityType) {
      const activityMatch = exactMatches.find(ex =>
        ex.applicableCategories.includes(activityType)
      );
      if (activityMatch) return activityMatch;
    }
    return exactMatches[0];
  }

  // Fall back to category match
  const categoryMatches = getExamplesForCategory(category);
  if (categoryMatches.length > 0) {
    if (activityType) {
      const activityMatch = categoryMatches.find(ex =>
        ex.applicableCategories.includes(activityType)
      );
      if (activityMatch) return activityMatch;
    }
    return categoryMatches[0];
  }

  return null;
}

/**
 * Get random example from corpus (for testing/demo purposes)
 */
export function getRandomExample(): TeachingExample {
  return TEACHING_EXAMPLES[Math.floor(Math.random() * TEACHING_EXAMPLES.length)];
}

// ============================================================================
// STATISTICS & COVERAGE
// ============================================================================

export function getCorpusStats() {
  const byCategory: Record<string, number> = {};
  const byActivityType: Record<string, number> = {};

  TEACHING_EXAMPLES.forEach(ex => {
    byCategory[ex.category] = (byCategory[ex.category] || 0) + 1;
    ex.applicableCategories.forEach(type => {
      byActivityType[type] = (byActivityType[type] || 0) + 1;
    });
  });

  return {
    totalExamples: TEACHING_EXAMPLES.length,
    byCategory,
    byActivityType,
    culturallyDiverseCount: TEACHING_EXAMPLES.filter(ex => ex.culturalContext).length
  };
}
