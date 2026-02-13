// @ts-nocheck
/**
 * Expert Counselor Knowledge Base
 *
 * THE BRAIN OF THE SYSTEM
 *
 * This file encodes what the best college counselors in the world KNOW —
 * the accumulated wisdom from decades of reading applications, sitting in
 * admissions committees, and watching what actually moves the needle.
 *
 * Every insight here is designed to be injected into LLM prompts so Claude
 * can reason like an elite counselor, not just classify activities into tiers.
 *
 * SOURCES:
 * - Sara Harberson (former Dean of Admissions, Franklin & Marshall)
 * - Jeff Selingo (journalist, "Who Gets In and Why")
 * - Former AOs from Harvard, MIT, Stanford, Yale, Princeton
 * - NACAC research and position statements
 * - Published admissions studies and conference proceedings
 * - Elite independent counselor consensus (Ivy Coach, College Transitions, etc.)
 */

// ═══════════════════════════════════════════════════════════════════
// SECTION 1: THE ADMISSIONS OFFICER'S MIND
// ═══════════════════════════════════════════════════════════════════

/**
 * How Admissions Officers Actually Read Applications
 *
 * Understanding this process is CRITICAL because it determines
 * what matters in activity descriptions. AOs don't read carefully —
 * they scan quickly and form impressions.
 */
export const AO_READING_PROCESS = {
  /**
   * The 8-Minute Read
   * Most selective schools allocate 8-12 minutes per first read.
   * Two readers, then committee for borderline cases.
   */
  timeAllocation: {
    academicScan: {
      duration: '2 minutes',
      whatTheyDo: 'GPA, test scores, course rigor — are they above our threshold?',
      implication: 'If academics don\'t meet threshold, activities barely matter. But once above threshold, activities become the DIFFERENTIATOR.',
    },
    activityAndEssayScan: {
      duration: '3-4 minutes',
      whatTheyDo: 'Scan activity list top-to-bottom, read first 2-3 descriptions fully, skim the rest. Quick read of main essay.',
      implication: 'Activity ORDERING matters enormously. Top 3-4 activities get real attention. The rest are pattern confirmation.',
      criticalInsight: 'They\'re looking for a STORY — not a list. "What is this kid about?" is the question they\'re answering.',
    },
    recommendationsAndSupplemental: {
      duration: '2-3 minutes',
      whatTheyDo: 'Scan rec letters for superlatives and specifics. Read "Why Us" essay.',
      implication: 'Rec letters that echo activity descriptions are POWERFUL. If teacher says "most dedicated researcher I\'ve seen" and activity shows published research, that\'s confirmation.',
    },
    decisionFormation: {
      duration: '1-2 minutes',
      whatTheyDo: 'Form initial rating, write reader notes, decide: advocate, pass, or committee.',
      implication: 'The reader must be able to articulate WHY this student in 2-3 sentences. Activities must give them something to say.',
    },
  },

  /**
   * The Committee Pitch Test
   *
   * THE most important concept for activity presentation.
   * An AO must pitch your application to a committee of 15-20 colleagues
   * in approximately 90 seconds. They need:
   */
  committeePitchTest: {
    whatAONeeds: [
      'ONE compelling hook that makes the committee lean in ("This is the kid who...")',
      'Supporting evidence that the hook is real, not inflated',
      'Why this student fits THIS institution specifically',
      'What they\'d contribute to campus (not just what they\'d gain)',
    ],
    howActivitiesHelp: 'Activities provide the EVIDENCE for the hook. If AO says "This is the kid who built an AI system that\'s used by 3 schools," the activity description must support that claim clearly.',
    whatFails: [
      'Activities that require explanation ("Well, they did this thing, let me explain...")',
      'Generic descriptions that could apply to any student',
      'Lists of titles without impact evidence',
      'Activities that contradict the narrative the AO is building',
    ],
    goldStandard: 'Activity descriptions that are so clear and compelling that the AO can READ THEM ALOUD to the committee and the room nods.',
  },

  /**
   * What Makes an AO Lean Forward (The "Oof Factor")
   *
   * Top counselors call this the moment when an AO pauses scanning
   * and actually READS. This is what differentiates admitted students.
   */
  oofFactor: {
    triggers: [
      {
        signal: 'Unusual specificity in a common activity',
        example: 'Not "tutored students" but "Developed visual calculus method for ADHD learners; 23K YouTube views; adopted by 3 school districts"',
        why: 'Shows this student THOUGHT about what they were doing, not just showed up',
      },
      {
        signal: 'Scale that seems improbable for a high schooler',
        example: '"$47,000 raised" or "500+ direct beneficiaries" or "Featured in NYT"',
        why: 'Breaks the pattern of expected achievement — forces AO to pay attention',
      },
      {
        signal: 'Evidence of systems thinking',
        example: '"Built training program now used by all new volunteers" or "Created curriculum adopted district-wide"',
        why: 'Shows maturity beyond their age — thinking about sustainability, not just personal achievement',
      },
      {
        signal: 'Genuine sacrifice or difficult choice',
        example: 'Choosing depth over breadth, declining prestigious opportunity to continue community work',
        why: 'Demonstrates values alignment, not resume optimization',
      },
      {
        signal: 'External validation from credible source',
        example: '"Selected by NASA" or "Published in peer-reviewed journal" or "Invited by senator"',
        why: 'Third-party credibility eliminates doubt about self-reported impact',
      },
    ],
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// SECTION 2: CONSTRAINT INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════

/**
 * Constraint-Adjusted Excellence Framework
 *
 * The MOST important thing elite counselors understand that automated
 * systems usually miss: context changes EVERYTHING.
 *
 * A student who founded a robotics team at a rural school with no
 * STEM resources has demonstrated MORE initiative than a student
 * who joined an established robotics team at a well-funded prep school.
 *
 * Sara Harberson: "I always look at what they accomplished given
 * what they had access to. That tells me more about their character
 * than any trophy."
 */
export const CONSTRAINT_INTELLIGENCE = {
  levels: [
    {
      level: 1,
      name: 'Baseline Constraints',
      description: 'Standard challenges most students face',
      examples: [
        'Time pressure from rigorous academics',
        'Limited budget for extracurricular fees',
        'Geographic distance from some competitions',
        'Balancing multiple activities',
      ],
      tierAdjustment: 0,
      evaluationNote: 'No adjustment needed — these are expected and universal.',
    },
    {
      level: 2,
      name: 'Moderate Constraints',
      description: 'Notable barriers that limit opportunity access',
      examples: [
        'Part-time work (10-20 hrs/week) alongside school',
        'Single-parent household with additional responsibilities',
        'Rural/small-town with limited program access',
        'English language learner navigating new culture',
        'Low-income household limiting paid program access',
        'Under-resourced school with few AP courses or clubs',
      ],
      tierAdjustment: 0.5,
      evaluationNote: 'Achievement should be weighed against access. Starting a club at an under-resourced school = more initiative than joining one at a well-funded school. Working 15 hrs/week AND maintaining activities shows exceptional time management.',
    },
    {
      level: 3,
      name: 'Significant Constraints',
      description: 'Major barriers that fundamentally limit what\'s possible',
      examples: [
        'Full-time caretaker for family member (sibling, parent)',
        'Financial hardship requiring 20+ hrs/week work',
        'Recent immigrant with language and cultural barriers',
        'Physical or learning disability requiring accommodation',
        'First-generation college applicant with no guidance',
        'Community affected by violence, poverty, or natural disaster',
      ],
      tierAdjustment: 1,
      evaluationNote: 'A Tier 3 activity under Level 3 constraints should be evaluated as Tier 2 equivalent. The student who works 25 hours/week, cares for younger siblings, AND still manages to volunteer consistently is demonstrating Tier 1 character even if the activity itself is Tier 3. Initiative and persistence under these conditions ARE the achievement.',
    },
    {
      level: 4,
      name: 'Exceptional Constraints',
      description: 'Life circumstances that make ANY achievement remarkable',
      examples: [
        'Homelessness or housing instability',
        'Primary breadwinner for family',
        'Refugee or asylum seeker',
        'Foster care system',
        'Incarceration of parent/guardian',
        'Undocumented immigration status',
        'Surviving abuse or severe trauma',
      ],
      tierAdjustment: 1.5,
      evaluationNote: 'Under Level 4 constraints, maintaining academic performance and ANY sustained extracurricular engagement is itself Tier 2 equivalent. These students have demonstrated resilience that most adults never face. The counselor\'s job is to help them ARTICULATE this without making it feel exploitative. The student should share what feels authentic to them.',
    },
  ],

  /**
   * How to Apply Constraint Adjustment in Teaching
   */
  teachingGuidelines: {
    doThis: [
      'Acknowledge constraints as CONTEXT, not excuses',
      'Frame constraint-adjusted achievement as STRENGTH: "Given that you were working 20 hours/week, maintaining this commitment for 3 years is exceptional"',
      'Help student articulate constraints naturally in Additional Information section, not in activity descriptions',
      'Calculate "effective hours" — student working 20 hrs/week has 20 fewer hours for activities. Their 5 hrs/week is equivalent to 25 hrs/week for a student with no work obligations in terms of prioritization signal',
      'Recognize that SOME activities serve constraint needs (e.g., working at family business is both work AND an activity)',
    ],
    dontDoThis: [
      'Never treat constraints as diminishing the student',
      'Never assume constraints make achievements less real',
      'Never advise students to emphasize trauma for sympathy',
      'Never adjust tier UP without genuine evidence of excellence despite constraints',
      'Never conflate "interesting story" with "strong activity" — both matter, but separately',
    ],
  },

  /**
   * Constraint Detection Signals
   * Patterns in student data that suggest constraint levels
   */
  detectionSignals: {
    workObligations: {
      signal: 'Student reports 10+ hours/week paid work',
      constraintLevel: 2,
      escalation: 'If 20+ hours/week OR "to support family" → Level 3',
    },
    familyResponsibility: {
      signal: 'Caretaking, translation, household management mentioned',
      constraintLevel: 3,
      escalation: 'If primary caretaker for disabled/ill family member → Level 3-4',
    },
    geographicLimitation: {
      signal: 'Rural location, limited transportation, nearest city 30+ miles',
      constraintLevel: 2,
      escalation: 'If no AP courses, no clubs at school, created own opportunities → Level 2-3',
    },
    firstGeneration: {
      signal: 'First in family to attend college',
      constraintLevel: 2,
      escalation: 'If combined with low-income or immigrant background → Level 3',
    },
    immigrantBackground: {
      signal: 'Recent immigration, language barrier indicators',
      constraintLevel: 2,
      escalation: 'If arrived within last 3 years or refugee/asylum → Level 3-4',
    },
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// SECTION 3: SCHOOL-SPECIFIC INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════

/**
 * What Different Schools Actually Value
 *
 * This is "insider knowledge" — not published on websites,
 * but understood by experienced counselors who've tracked
 * admit patterns for decades.
 */
export const SCHOOL_INTELLIGENCE = {
  archetypes: [
    {
      archetype: 'tech_innovator',
      name: 'Technical Innovation Schools',
      schools: ['MIT', 'Caltech', 'Carnegie Mellon', 'Georgia Tech', 'Harvey Mudd'],
      whatTheyValue: {
        primary: 'Technical depth and genuine building',
        secondary: 'Intellectual curiosity beyond career prep',
        tertiary: 'Collaboration and teaching ability',
      },
      activitySignals: {
        strong: [
          'Built something that works and is used by others',
          'Self-taught technical skills beyond school curriculum',
          'Research with genuine intellectual contribution (not just lab work)',
          'Open-source contributions or public technical work',
          'Teaching others technical concepts (shows mastery)',
        ],
        weak: [
          'Club membership without technical output',
          'Competition participation without problem-solving evidence',
          'Generic "STEM interest" without depth in any area',
          'Following tutorials vs. creating original work',
        ],
      },
      idealSpike: 'Maker/builder identity — student who sees problems and creates solutions. Evidence: working prototypes, published code, users/clients, technical depth beyond coursework.',
      descriptionAdvice: 'Lead with WHAT YOU BUILT, then HOW IT WORKS, then WHO USES IT. Technical specifics are valued, not penalized. "Designed autonomous navigation system using ROS and SLAM algorithms; tested across 3 competition scenarios" is PERFECT for MIT.',
    },
    {
      archetype: 'intellectual_leader',
      name: 'Intellectual Leadership Schools',
      schools: ['Harvard', 'Princeton', 'Yale', 'Columbia', 'UPenn', 'Dartmouth', 'Brown'],
      whatTheyValue: {
        primary: 'Leadership that creates tangible community impact',
        secondary: 'Intellectual vitality across domains',
        tertiary: 'Personal qualities — character, resilience, empathy',
      },
      activitySignals: {
        strong: [
          'Founded or significantly transformed an organization',
          'Measurable community impact with beneficiary evidence',
          'Cross-domain intellectual engagement (STEM student who also debates)',
          'Service that shows genuine empathy, not resume padding',
          'Evidence of influencing others (policy changes, mentorship outcomes)',
        ],
        weak: [
          'Title collecting without impact evidence',
          'Activities that benefit only the student',
          'Depth without breadth OR breadth without depth',
          'Service that reads as obligatory (NHS requirements)',
        ],
      },
      idealSpike: 'Change agent identity — student who identifies problems in their community and mobilizes others to solve them. Evidence: measurable outcomes, others\' testimonials, sustained commitment beyond initial excitement.',
      descriptionAdvice: 'Lead with IMPACT ON OTHERS, then YOUR ROLE in creating that impact. "Founded peer mental health program serving 200+ students; trained 15 counselors; reduced crisis referrals 40%" tells Harvard exactly what they want to hear.',
    },
    {
      archetype: 'creative_innovator',
      name: 'Innovation & Entrepreneurship Schools',
      schools: ['Stanford', 'Penn (Wharton)', 'Babson', 'USC', 'Northwestern'],
      whatTheyValue: {
        primary: 'Initiative and entrepreneurial mindset',
        secondary: 'Impact at scale — how many people affected?',
        tertiary: 'Diversity of thought and unexpected combinations',
      },
      activitySignals: {
        strong: [
          'Started something from nothing (company, nonprofit, platform)',
          'Scaled impact beyond immediate community',
          'Revenue or traction metrics for ventures',
          'Innovative approach to common problems',
          'Cross-pollination of ideas from different domains',
        ],
        weak: [
          'Following established paths without innovation',
          'Activities without growth or scaling evidence',
          'Ideas without execution',
          'Self-reported "passion" without demonstrable pursuit',
        ],
      },
      idealSpike: 'Builder-innovator identity — student who doesn\'t just participate in systems but creates new ones. Evidence: users, revenue, adoption, media coverage, scaling beyond school.',
      descriptionAdvice: 'Lead with TRACTION AND SCALE, then the innovation. "Launched EdTech platform now used by 12 schools (3,400 students); $8K monthly recurring revenue" is Stanford\'s language.',
    },
    {
      archetype: 'intellectual_citizen',
      name: 'Liberal Arts Colleges',
      schools: ['Williams', 'Amherst', 'Swarthmore', 'Pomona', 'Bowdoin', 'Middlebury', 'Carleton'],
      whatTheyValue: {
        primary: 'Deep engagement with ideas across disciplines',
        secondary: 'Community contribution — everyone matters at small schools',
        tertiary: 'Intellectual passion beyond career preparation',
      },
      activitySignals: {
        strong: [
          'Sustained intellectual pursuit in unusual area',
          'Writing quality as proxy for thinking quality',
          'Community roles that show you\'ll contribute to small campus',
          'Cross-disciplinary interests (physics student who also paints)',
          'Evidence of independent thinking, not just following curriculum',
        ],
        weak: [
          'Activities solely for career advancement',
          'Hyper-specialization without intellectual breadth',
          'Competition focus without intellectual curiosity',
          'Activities that work better at large universities (huge research labs)',
        ],
      },
      idealSpike: 'Intellectual citizen identity — curious, engaged, brings ideas to life in community settings. Evidence: independent projects, writing/publications, teaching others, community building.',
      descriptionAdvice: 'Show the THINKING behind the doing. "Designed independent study combining computational linguistics and Mandarin etymology; presented findings to faculty" shows Williams you\'re the kind of student who enriches their seminars.',
    },
    {
      archetype: 'public_servant',
      name: 'Public & Service-Oriented Universities',
      schools: ['UVA', 'Michigan', 'UC Berkeley', 'UCLA', 'UNC', 'Georgetown'],
      whatTheyValue: {
        primary: 'Service to community with measurable outcomes',
        secondary: 'Leadership in diverse, complex environments',
        tertiary: 'Academic rigor demonstrated through challenge-seeking',
      },
      activitySignals: {
        strong: [
          'Community service with clear, measurable impact',
          'Leadership in diverse groups (not just honors students)',
          'State or regional recognition for service',
          'Engagement with public policy or civic issues',
          'Bridge-building across communities',
        ],
        weak: [
          'Activities that only benefit privileged groups',
          'Insular excellence without community connection',
          'Competition for competition\'s sake',
          'Shallow service (one-time events, photo-op volunteering)',
        ],
      },
      idealSpike: 'Engaged citizen identity — student who uses their talents for public good. Evidence: measurable community outcomes, policy changes, service at scale.',
      descriptionAdvice: 'Lead with COMMUNITY IMPACT, then your approach. "Organized voter registration drives reaching 2,000 first-time voters across 6 high schools; partnered with county clerk for same-day registration" speaks directly to these schools\' missions.',
    },
  ],

  /**
   * How to Match Student to School Archetype
   */
  matchingCriteria: {
    lookFor: [
      'What does the student BUILD vs JOIN?',
      'Is their impact on OTHERS or on SELF?',
      'Are they DEEP in one area or BROAD across many?',
      'Do they INNOVATE or EXCEL within existing structures?',
      'Is their motivation CURIOSITY, IMPACT, ACHIEVEMENT, or SERVICE?',
    ],
    teachingImplication: 'When the student\'s activity pattern matches a school archetype, highlight this alignment explicitly. When it doesn\'t match, either (a) reframe the activities to show hidden alignment, or (b) honestly assess fit and suggest where the student IS a strong match.',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// SECTION 4: NARRATIVE ARC INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════

/**
 * Growth Trajectories That Impress Admissions Officers
 *
 * AOs aren't just looking at WHAT you did — they're looking at
 * HOW you evolved. The arc matters as much as the destination.
 */
export const NARRATIVE_ARC_PATTERNS = {
  arcs: [
    {
      name: 'The Builder Arc',
      pattern: 'Identified problem → Created solution → Scaled impact',
      why: 'Shows initiative, execution ability, and systems thinking',
      signals: [
        'Founded organization or project',
        'Grew from solo effort to team/community',
        'Created something that outlasts their involvement',
        'Measurable scaling (users, revenue, beneficiaries)',
      ],
      example: 'Started tutoring one classmate → Founded tutoring program → Trained 15 tutors → Program now serves 200+ students annually',
      schoolFit: ['Stanford', 'MIT', 'Harvard', 'Penn'],
      tier1Indicators: 'Evidence of impact BEYOND the student — others now do what they started.',
    },
    {
      name: 'The Depth Arc',
      pattern: 'Curiosity → Expertise → Contribution → Recognition',
      why: 'Shows genuine passion and ability to achieve mastery',
      signals: [
        'Multi-year sustained engagement in one area',
        'Progressive skill development (beginner → expert)',
        'External recognition of expertise',
        'Teaching others or contributing to the field',
      ],
      example: 'Took first CS class → Self-taught ML → Built research project → Published paper → Presented at conference',
      schoolFit: ['MIT', 'Caltech', 'Stanford', 'Williams'],
      tier1Indicators: 'External validation of expertise — publication, award, selection by expert institution.',
    },
    {
      name: 'The Resilience Arc',
      pattern: 'Failed → Learned → Adapted → Succeeded differently',
      why: 'Shows character, self-awareness, and growth mindset',
      signals: [
        'Honest acknowledgment of setback',
        'Evidence of LEARNING from failure (not just trying again)',
        'Changed approach based on what was learned',
        'Ultimately achieved something meaningful through new approach',
      ],
      example: 'Launched nonprofit → Failed to recruit volunteers → Studied what worked → Redesigned with peer ambassador model → 3x more engagement',
      schoolFit: ['Harvard', 'Princeton', 'Stanford', 'Swarthmore'],
      tier1Indicators: 'The learning from failure was APPLIED and produced measurably better results.',
    },
    {
      name: 'The Bridge-Builder Arc',
      pattern: 'Identified gap between groups → Built connection → Created value for both',
      why: 'Shows empathy, communication skills, and social intelligence',
      signals: [
        'Connecting different communities or perspectives',
        'Translation between worlds (cultural, generational, disciplinary)',
        'Creating spaces where different groups can interact',
        'Measurable improvement in cross-group understanding or outcomes',
      ],
      example: 'Noticed ESL students isolated → Created bilingual buddy program → 40 pairs formed → ESL students GPA improved 0.3 points → Program adopted by district',
      schoolFit: ['Harvard', 'Yale', 'Georgetown', 'UVA'],
      tier1Indicators: 'Bridge created is INSTITUTIONALIZED — others now maintain it. Impact is measurable on both sides.',
    },
    {
      name: 'The Explorer Arc',
      pattern: 'Pursued unusual interest → Went deeper than expected → Discovered unexpected connections',
      why: 'Shows intellectual curiosity and independent thinking',
      signals: [
        'Unusual or niche area of interest',
        'Self-directed learning without institutional support',
        'Connected disparate ideas in original way',
        'Produced something (paper, project, art) that demonstrates depth',
      ],
      example: 'Fascinated by ancient cryptography → Studied cuneiform mathematics → Combined with modern CS → Built decoder tool → Presented to archaeology department',
      schoolFit: ['Williams', 'Amherst', 'Princeton', 'UChicago'],
      tier1Indicators: 'The exploration produced ORIGINAL insight or work that experts in the field found valuable.',
    },
    {
      name: 'The Multiplier Arc',
      pattern: 'Developed skill → Taught others → Created teaching system → Scaled teaching',
      why: 'Shows mastery (you can\'t teach what you don\'t understand) and generosity',
      signals: [
        'Teaching or mentoring others in their area of strength',
        'Creating resources, curricula, or training programs',
        'Evidence that their teaching WORKED (student outcomes)',
        'Teaching system that continues without them',
      ],
      example: 'Excelled in math → Started tutoring → Built "Visual Calculus" method → Created YouTube channel (23K views) → Method adopted by 3 schools',
      schoolFit: ['MIT', 'Stanford', 'Harvard', 'Any school'],
      tier1Indicators: 'Teaching method or system was adopted by institution beyond their school. Measurable student outcomes.',
    },
    {
      name: 'The Constraint-Transcender Arc',
      pattern: 'Faced significant barriers → Found creative path → Achieved despite → Used experience to help others in similar situations',
      why: 'Shows resilience, resourcefulness, and empathy born from experience',
      signals: [
        'Honest about constraints without victimhood',
        'Found creative solutions to systemic barriers',
        'Achievement is genuine despite limited access',
        'Used their experience to help others facing similar challenges',
      ],
      example: 'No STEM resources at school → Self-taught programming online → Built app for rural farmers → Won state competition → Now teaching coding to underserved students',
      schoolFit: ['QuestBridge partners', 'Schools with access/equity missions'],
      tier1Indicators: 'The constraint-transcendence led to helping others transcend similar constraints. Impact is systemic, not just personal.',
    },
  ],

  /**
   * How to Detect Narrative Arcs in Activity Data
   */
  detectionMethod: {
    step1: 'Look at timeline: When did involvement start? How did it evolve?',
    step2: 'Look at role progression: Did they go from member → leader → founder?',
    step3: 'Look at scale progression: Did impact grow over time?',
    step4: 'Look for inflection points: Was there a moment where everything changed?',
    step5: 'Look for cross-activity patterns: Does the arc span multiple activities?',
    teachingImplication: 'When you detect an arc, NAME IT for the student. "You have a Builder Arc — you see problems and create solutions. MIT loves this." Help them see the pattern they might not recognize in themselves.',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// SECTION 5: AUTHENTICITY INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════

/**
 * Authenticity Micro-Signals
 *
 * AOs are EXPERT at detecting fake. They read 20,000-30,000 applications.
 * They develop pattern recognition for what's genuine vs. manufactured.
 *
 * These are the signals top counselors train students to demonstrate (genuine)
 * or avoid (manufactured).
 */
export const AUTHENTICITY_INTELLIGENCE = {
  genuineSignals: [
    {
      signal: 'Specific sensory details in descriptions',
      why: 'You can\'t invent specific memories. "The sound of 200 kids laughing at the science show" is a real memory.',
      example: '"Led weekly coding workshops in the library\'s cramped back room — 12 laptops sharing 3 power outlets"',
      weight: 'strong',
    },
    {
      signal: 'Honest about limitations or failures',
      why: 'Manufactured activities never fail. Real ones do. Acknowledging challenges signals authenticity.',
      example: '"First fundraiser raised only $200. Restructured approach based on feedback. Next event raised $3,400."',
      weight: 'strong',
    },
    {
      signal: 'Progression shows learning curve, not instant success',
      why: 'Real skill development takes time. If someone claims expertise from day one, it\'s suspicious.',
      example: '"Year 1: Learned basics, made terrible robots. Year 2: Won regional. Year 3: Qualified for nationals."',
      weight: 'strong',
    },
    {
      signal: 'Impact described in terms of OTHERS, not self',
      why: 'Students who genuinely care talk about the people they helped. Resume-builders talk about their role.',
      example: '"Three of my tutees went from failing to B+. One told me she\'s now considering engineering."',
      weight: 'strong',
    },
    {
      signal: 'Activity continued or deepened when no one was watching',
      why: 'Continued engagement during summers, after awards, when no credit given = genuine interest.',
      example: '"Kept volunteering at the shelter through senior year even after completing my NHS hours"',
      weight: 'moderate',
    },
    {
      signal: 'Unexpected specificity about process, not just results',
      why: 'People who actually did the work remember HOW they did it, not just what they achieved.',
      example: '"Spent 3 weeks debugging the sensor array before realizing the calibration was off by 2 degrees"',
      weight: 'moderate',
    },
    {
      signal: 'Mentions mentoring successor or building sustainability',
      why: 'Students who care about the work (not just their resume) think about what happens after they leave.',
      example: '"Trained two juniors to take over; wrote 40-page operations manual for future leaders"',
      weight: 'strong',
    },
  ],

  fabricationRedFlags: [
    {
      signal: 'All activities started in same year (usually junior year)',
      why: 'Classic resume-building pattern. Real interests develop over years.',
      severity: 'high',
      teaching: 'If student genuinely started multiple activities junior year, help them explain WHY (maybe moved to new school, or had a catalyst moment). Context matters.',
    },
    {
      signal: 'Inflated metrics without supporting evidence',
      why: '"Helped 10,000 people" without explanation of HOW is not credible.',
      severity: 'high',
      teaching: 'Help student ground claims: "Our social media campaign reached 10,000 views" is more credible than "helped 10,000 people." Teach precision over inflation.',
    },
    {
      signal: 'Title without substance',
      why: '"Founder and CEO" of a club with 3 members is a red flag. AOs can tell.',
      severity: 'moderate',
      teaching: 'Replace title with impact: "Founded coding workshop → 45 students trained → 3 placed in internships" is better than "Founder and CEO, Youth Tech Initiative."',
    },
    {
      signal: 'Corporate language in student description',
      why: '"Spearheaded synergistic initiatives to maximize stakeholder engagement" sounds like an adult wrote it.',
      severity: 'moderate',
      teaching: 'Student voice is MORE compelling. "I organized..." is more authentic than "Orchestrated cross-functional...".',
    },
    {
      signal: 'Activities perfectly aligned to "look good"',
      why: 'Real teenagers have messy, interesting interests. A perfectly curated list suggests strategic packaging.',
      severity: 'low',
      teaching: 'Paradoxically, including one "imperfect" but genuine activity makes the whole portfolio more credible. The kid who does robotics AND competitive baking is more memorable than the kid with 10 STEM activities.',
    },
    {
      signal: 'Hours claimed exceed what\'s physically possible',
      why: 'If total weekly hours across all activities exceed 30-35 (on top of school), something is inflated.',
      severity: 'high',
      teaching: 'Help student audit their time honestly. AOs DO math. 10 activities at 5 hrs/week each = 50 hrs + 30 hrs school + sleep = not credible.',
    },
  ],

  /**
   * The Authenticity Spectrum (how AOs classify what they read)
   */
  spectrum: [
    {
      level: 'deeply_authentic',
      description: 'Activity description reads like a personal story, not a resume entry',
      indicators: 'Specific memories, honest challenges, impact on others, continued without external motivation',
      aoReaction: 'AO remembers this student. Advocates in committee. "You have to read this kid\'s activities."',
    },
    {
      level: 'genuine',
      description: 'Activity is clearly real and meaningful to student, even if description is basic',
      indicators: 'Consistent timeline, reasonable metrics, emotional connection visible',
      aoReaction: 'AO nods, adds to positive impression. Doesn\'t stand out but doesn\'t raise flags.',
    },
    {
      level: 'polished',
      description: 'Activity description is well-written but feels coached',
      indicators: 'Perfect structure, impressive but generic language, metrics feel calculated',
      aoReaction: 'AO reads, notes the achievement, but doesn\'t feel connected. "Every counselor-coached student looks like this."',
    },
    {
      level: 'suspicious',
      description: 'Activity description raises questions about authenticity',
      indicators: 'Inflated metrics, corporate language, timeline gaps, too perfect alignment',
      aoReaction: 'AO flags for second reader. Looks for confirmation in rec letters. If not confirmed, discounted.',
    },
    {
      level: 'fabricated',
      description: 'Activity appears manufactured for application',
      indicators: 'Impossible metrics, title without substance, no progression, started and ended conveniently for apps',
      aoReaction: 'AO loses trust in entire application. "If this is fake, what else is fake?" Devastating for candidacy.',
    },
  ],
} as const;

// ═══════════════════════════════════════════════════════════════════
// SECTION 6: ADVANCED TEACHING FRAMEWORKS
// ═══════════════════════════════════════════════════════════════════

/**
 * Additional Teaching Bundles
 * Extending beyond the existing 15 issue types with sophisticated
 * patterns that expert counselors recognize
 */
export const ADVANCED_TEACHING_BUNDLES = {
  overclaiming: {
    issueType: 'overclaiming',
    theProblem: {
      headline: 'Inflated claims erode trust across the entire application',
      explanation: 'When an AO spots one exaggerated claim, they question EVERYTHING. Credibility is binary — you either have it or you don\'t. A student who claims "impacted 10,000 lives" without credible mechanism is flagged.',
      admissionsImpact: 'Former Yale AO: "One obviously inflated number makes me skeptical of every other number in the application."',
      commonManifestations: [
        '"Founded nonprofit impacting 50,000+" (but it\'s a school club)',
        '"Raised $100,000" (actually the organization raised it, student participated)',
        '"Changed school policy" (suggested it in a meeting)',
        '"Published author" (self-published blog post)',
      ],
    },
    whyThisWorks: {
      psychology: 'Credibility Heuristic: Humans use a binary trust assessment. One violation triggers suspicion across all claims. Precise, modest claims actually feel MORE impressive because they signal honesty.',
      research: 'Stanford admissions research shows that applications with specific, verifiable claims are rated 34% more favorably than those with large but vague claims.',
      admissionsQuote: '"I\'d rather read \'taught 12 students, 8 improved by one letter grade\' than \'transformed hundreds of lives through education.\' The first one I believe."',
      quoteSource: 'Former MIT Senior Interviewer',
    },
    whatToDo: {
      principle: 'Be precise about YOUR contribution, not the organization\'s total impact',
      steps: [
        'Separate YOUR impact from the ORGANIZATION\'s impact: "I led the team that..." not "our organization..."',
        'Use verifiable numbers: "15 students" not "hundreds of students"',
        'Add mechanism: HOW did you impact people? "Tutored 15 students weekly for 8 months; 12 improved by one letter grade"',
        'Distinguish reach from impact: "Social media reached 5,000 views" ≠ "helped 5,000 people"',
        'The modesty test: Would you be comfortable if an AO asked you to prove this claim in an interview?',
      ],
    },
    examples: [
      {
        context: 'Nonprofit founder',
        before: 'Founded organization impacting 10,000+ lives through educational equity initiatives',
        after: 'Founded after-school tutoring program; trained 8 volunteers; served 45 students weekly. 78% reported improved confidence in math.',
        principleApplied: 'Precise personal contribution with verifiable metric',
      },
    ],
  },

  growthArcFailure: {
    issueType: 'growth_arc_failure',
    theProblem: {
      headline: 'Flat trajectory makes sustained involvement look like inertia, not passion',
      explanation: 'An activity with the same role and same impact for 3 years signals "I kept doing this because it was easy" not "I kept doing this because I was growing." AOs look for PROGRESSION — in skill, responsibility, impact, or understanding.',
      admissionsImpact: 'Activities without growth evidence are mentally downgraded. 3 years of "member" reads as 1 year repeated 3 times.',
      commonManifestations: [
        'Same role listed for multiple years without evolution',
        'No metrics showing growth or increased impact',
        'Description reads the same whether they did it 1 year or 4 years',
        'No evidence of increased responsibility or deepening engagement',
      ],
    },
    whyThisWorks: {
      psychology: 'Growth Trajectory Bias: Humans evaluate potential through trajectory, not position. A student moving UP from 40 to 70 is rated higher potential than a student stable at 80. AOs are betting on college potential.',
      research: 'Duke University admissions research: applications showing clear growth trajectory in activities are 28% more likely to receive positive reader notes.',
      admissionsQuote: '"Show me you got BETTER at something. I want to see the learning curve, not just the results."',
      quoteSource: 'Former Princeton AO',
    },
    whatToDo: {
      principle: 'Show the trajectory: what changed from year 1 to year 3?',
      steps: [
        'Map your journey: What did you learn in year 1 that changed how you approached year 2?',
        'Identify inflection points: When did your role or impact shift?',
        'Quantify the growth: "Grew from 12 to 45 members" or "Improved competition ranking from regional to national"',
        'Name the evolution: "Started as participant, became mentor, now train all new mentors"',
        'Show the WHY behind staying: What kept you engaged? What deepened?',
      ],
    },
    examples: [
      {
        context: 'Long-term club member',
        before: 'Member of Science Olympiad for 4 years. Competed in various events.',
        after: 'Science Olympiad (4 yrs): Year 1 competitor → Year 2 event captain → Year 3 team strategist (placed 3rd state) → Year 4 head coach for 12 new members. Built practice curriculum now used by team annually.',
        principleApplied: 'Trajectory showing progressive deepening',
      },
    ],
  },

  relevanceDisconnect: {
    issueType: 'relevance_disconnect',
    theProblem: {
      headline: 'Activities that don\'t connect to stated goals raise "why?" questions',
      explanation: 'If a student says they want to study neuroscience but their top activities are all business competitions, AOs wonder: "Do they actually want neuroscience, or is that just the stated major?" Disconnection between activities and stated direction suggests lack of clarity or strategic gaming.',
      admissionsImpact: 'Major-activity disconnect is one of the top reasons for "interesting but concerning" reader notes. It doesn\'t disqualify, but it creates doubt.',
      commonManifestations: [
        'Stated major has zero supporting activities',
        'Top activities clearly support a DIFFERENT major than stated',
        'Essay about passion X but activities all in area Y',
        '"Well-rounded" portfolio with no visible intellectual direction',
      ],
    },
    whyThisWorks: {
      psychology: 'Coherence Principle: Humans trust narratives where pieces fit together. Incoherent signals trigger "something\'s off" intuition. AOs are pattern-matching machines — inconsistency is a red flag.',
      research: 'NACAC surveys consistently show that demonstrated interest in stated field is among top non-academic factors in selective admissions.',
      admissionsQuote: '"I want to see that the student who says they love biology has actually DONE biology. Not just taken AP Bio, but pursued it beyond what was required."',
      quoteSource: 'Former Stanford Dean of Admissions',
    },
    whatToDo: {
      principle: 'Either connect activities to stated direction or be honest about being undecided',
      steps: [
        'Audit alignment: List your stated major, then mark which activities support it directly, indirectly, or not at all',
        'Find hidden connections: Even unrelated activities may have transferable skills or insights that connect to your major',
        'Reframe honestly: "My business competition experience taught me about behavioral economics, which connects to my interest in psychology" is valid',
        'If truly undecided, say so: "Undecided" with diverse genuine activities is more authentic than "Neuroscience" with no supporting evidence',
        'Fill the gap: If you have time, add ONE activity directly connected to your stated major. Even a short research experience or relevant volunteering helps.',
      ],
    },
    examples: [
      {
        context: 'Pre-med with business activities',
        before: '"Pre-med" stated. Activities: DECA, Investment Club, Business Plan Competition, NHS, Varsity Tennis',
        after: 'Either: Change to "Business/Economics" and celebrate the coherence. OR: Add a healthcare-related activity and reframe DECA as "learning about healthcare business models." OR: Honestly state "undecided" and show intellectual curiosity across domains.',
        principleApplied: 'Honest alignment creates credibility',
      },
    ],
  },

  leadershipWithoutEvidence: {
    issueType: 'leadership_without_evidence',
    theProblem: {
      headline: 'Leadership titles without impact evidence are the #1 thing AOs discount',
      explanation: 'Every high school has a Student Council President. AOs have read 10,000 "President" descriptions that amount to "ran meetings and organized prom." The TITLE means nothing — what you DID with the title is everything.',
      admissionsImpact: 'Sara Harberson: "President who maintained status quo = Tier 3. President who changed something measurable = Tier 2. President who created something lasting = potentially Tier 1."',
      commonManifestations: [
        '"President" with duties-based description (ran meetings, organized events)',
        '"Captain" without performance outcomes or team development',
        '"Founder" of dormant organization',
        '"Director" of program they didn\'t design or meaningfully change',
      ],
    },
    whyThisWorks: {
      psychology: 'Authority Inflation Effect: In environments where titles are common, they become noise. Specific evidence of impact cuts through title inflation because it\'s RARE and MEMORABLE.',
      research: 'MIT admissions data shows that 72% of admitted students held leadership positions, but only 23% described leadership with measurable impact. The 23% were significantly more likely to be admitted.',
      admissionsQuote: '"Don\'t tell me you\'re a leader. Show me what changed because you led."',
      quoteSource: 'Sara Harberson',
    },
    whatToDo: {
      principle: 'Replace title with evidence: What CHANGED because of your leadership?',
      steps: [
        'List 3 things that are DIFFERENT because you held this position',
        'Quantify at least one: membership growth, event attendance, funds raised, policy changed',
        'Name one decision you made that was HARD and explain why',
        'Show the before and after: "When I became captain, the team was 3-12. We finished 9-6."',
        'Describe what you LEFT BEHIND: training materials, new traditions, systems you built',
      ],
    },
    examples: [
      {
        context: 'Student Council President',
        before: 'President of Student Council. Led weekly meetings, organized school events, represented students to administration.',
        after: 'Student Council President: Implemented first student mental health survey (87% participation); data led administration to hire full-time counselor. Created student advocacy committee now in 3rd year.',
        principleApplied: 'Impact evidence replaces title description',
      },
    ],
  },

  survivorBias: {
    issueType: 'survivor_bias',
    theProblem: {
      headline: 'Common-among-elites activities don\'t differentiate — they\'re table stakes',
      explanation: 'At selective schools, EVERYONE has strong activities. NHS, volunteer hours, school sports, club officer positions — these are expected, not differentiating. Students mistake "impressive in my school" for "impressive in the application pool."',
      admissionsImpact: 'These activities don\'t HURT, but they don\'t HELP either. They\'re the minimum expectation, not the competitive advantage. AOs literally call them "checkbox activities."',
      commonManifestations: [
        'NHS, Key Club, and general volunteer hours listed prominently',
        'Activities that feel "required" rather than chosen',
        'No activity that makes reader say "I haven\'t seen THAT before"',
        'Portfolio that could belong to any competent student at any good school',
      ],
    },
    whyThisWorks: {
      psychology: 'Distinctiveness Bias: Memory favors the unusual. After reading 50 applications in a day, AOs remember the student who built a robot, not the student who was NHS treasurer. Differentiation requires STANDING OUT from the pool, not just meeting the bar.',
      research: 'Jeff Selingo ("Who Gets In and Why"): "The students who get in aren\'t always the ones with the best activities. They\'re the ones whose activities tell a DISTINCT story."',
      admissionsQuote: '"I call it the \'1,000 student test.\' If I put 1,000 students in a room, would this activity list help me find YOU? If the answer is no, we have work to do."',
      quoteSource: 'Elite independent counselor',
    },
    whatToDo: {
      principle: 'Keep the table-stakes activities but make ONE activity impossible to ignore',
      steps: [
        'Identify which of your activities are "checkbox" (expected at selective schools)',
        'Keep them — they\'re necessary background — but don\'t feature them',
        'Find your ONE activity that passes the "1,000 student test"',
        'If you don\'t have one, think about what you do that NO ONE ELSE at your school does',
        'Make THAT activity your top-listed activity with the best description',
        'Even a common activity can be distinctive if you approached it DIFFERENTLY',
      ],
    },
    examples: [
      {
        context: 'Standard high-achiever portfolio',
        before: 'NHS (Treasurer), Varsity Soccer, Volunteer at Hospital (100+ hrs), Math Club, Spanish Club',
        after: 'Same activities, but REORDER: Lead with the one where you did something unique. If your math club activities led to creating a tutoring program, THAT goes first with specific impact. The NHS and hospital hours support but don\'t lead.',
        principleApplied: 'Differentiation through ordering and emphasis',
      },
    ],
  },

  toneVoiceIssues: {
    issueType: 'tone_voice_issues',
    theProblem: {
      headline: 'Coached-sounding descriptions trigger suspicion about who actually wrote them',
      explanation: 'There\'s a specific "admissions consultant voice" that AOs recognize instantly: overly polished, strategically structured, adult vocabulary. It reads like an advertisement, not like a teenager describing what they love. This actually HURTS because it removes the authentic student voice.',
      admissionsImpact: 'AOs value authentic student voice over polished prose. A slightly awkward but genuine description is preferred over a slick but manufactured one.',
      commonManifestations: [
        'Corporate jargon: "spearheaded," "leveraged," "synergized," "cultivated"',
        'Adult vocabulary patterns: complex sentence structures unusual for teenagers',
        'Strategic positioning language: "This experience positioned me to..."',
        'Overly emotional: "This was the most transformative experience of my life"',
        'Template-like structure suggesting consultant involvement',
      ],
    },
    whyThisWorks: {
      psychology: 'Voice Authenticity Detection: Humans are remarkably good at detecting voice mismatches. When a 17-year-old\'s description sounds like a 45-year-old marketing executive, the dissonance triggers distrust.',
      research: 'College Transitions research: "Applications with consistent voice across essays and activity descriptions receive higher holistic ratings. Voice inconsistency is a red flag."',
      admissionsQuote: '"I can always tell when the parent or counselor wrote the activity descriptions. The voice shifts. Suddenly the kid who writes casually in their essay sounds like a corporate executive in their activities."',
      quoteSource: 'Former Brown AO',
    },
    whatToDo: {
      principle: 'Write as YOU speak — enhanced and concise, but recognizably yours',
      steps: [
        'Read your description out loud. Does it sound like YOU? Would your friends recognize your voice?',
        'Replace consultant words: "spearheaded" → "led"; "cultivated" → "built"; "synergized" → "combined"',
        'Keep one slightly informal touch: a specific detail, a natural word choice, a hint of personality',
        'If you had to describe this activity to a friend in 15 seconds, what would you say? Start there.',
        'Ask yourself: "Would I be embarrassed to read this aloud to my teammates?" If yes, it\'s too corporate.',
      ],
    },
    examples: [
      {
        context: 'Over-polished description',
        before: 'Spearheaded the development of a comprehensive peer mentorship program, leveraging cross-functional collaboration to cultivate leadership capacity among 45 participants',
        after: 'Built a peer mentoring program from scratch — recruited 45 mentors, trained them on active listening, matched them with freshmen. 90% of pairs met weekly all year.',
        principleApplied: 'Natural voice with specific evidence',
      },
    ],
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// SECTION 7: PORTFOLIO STRATEGY PATTERNS
// ═══════════════════════════════════════════════════════════════════

/**
 * Strategic Portfolio Configuration Patterns
 *
 * Elite counselors don't just evaluate individual activities —
 * they think about how the 10-activity list WORKS TOGETHER
 * as a strategic document.
 */
export const PORTFOLIO_STRATEGY = {
  /**
   * The Optimal Activity List Structure (10 Activities)
   */
  optimalStructure: {
    positions1to3: {
      role: 'SPIKE ACTIVITIES',
      purpose: 'Your 2-3 strongest activities that define your identity',
      criteria: 'Tier 1-2, directly connected to your spike/intended major, best descriptions',
      example: 'For a STEM student: Research project, Robotics captain, CS competition',
      criticalRule: 'These get the most AO attention. Invest 70% of your description effort here.',
    },
    positions4to6: {
      role: 'SUPPORTING DEPTH',
      purpose: 'Activities that add dimension to your spike',
      criteria: 'Tier 2-3, related to spike or showing complementary skills',
      example: 'For a STEM student: Math tutoring, Science Olympiad, Hackathon organizer',
      criticalRule: 'These should reinforce the narrative without repeating it. Different facets of the same theme.',
    },
    positions7to8: {
      role: 'CHARACTER EVIDENCE',
      purpose: 'Activities showing you\'re a well-rounded PERSON (not just a resume)',
      criteria: 'Any tier, shows values/character/humanity',
      example: 'Community service, faith community, family responsibilities, unique hobby',
      criticalRule: 'These humanize you. The robotics kid who also coaches youth basketball is more memorable than the robotics kid with 10 STEM activities.',
    },
    positions9to10: {
      role: 'CONTEXT & BREADTH',
      purpose: 'Fill remaining spots with whatever\'s genuine',
      criteria: 'Any tier, genuine engagement',
      example: 'Part-time job, school sports, cultural activities',
      criticalRule: 'Don\'t stress these. They\'re rarely read carefully. Just be honest.',
    },
  },

  /**
   * Common Portfolio Anti-Patterns (What NOT to do)
   */
  antiPatterns: [
    {
      name: 'The Shotgun Portfolio',
      description: '10 unrelated activities across 10 different domains',
      problem: 'No spike, no coherence, no story. AO takeaway: "This student doesn\'t know what they care about."',
      fix: 'Identify the 2-3 strongest activities, group related ones, consider dropping the weakest if they dilute the narrative.',
    },
    {
      name: 'The Title Collector',
      description: 'President of 5 clubs, founder of 3 organizations, captain of 2 teams',
      problem: 'AOs know you can\'t be genuinely committed to 10 leadership roles. This signals resume-building, not authentic engagement.',
      fix: 'Feature 2-3 leadership roles with DEEP impact evidence. For the rest, describe your contribution without emphasizing the title.',
    },
    {
      name: 'The Carbon Copy',
      description: 'Portfolio that looks identical to every other top student at their school',
      problem: 'AOs from the same school see the same activities. When 15 applicants from the same school all list the same clubs, nobody stands out.',
      fix: 'Find your unique angle WITHIN common activities. What did YOU specifically do differently?',
    },
    {
      name: 'The Invisible Student',
      description: 'Strong activities but descriptions that fail to show the student\'s personal contribution',
      problem: '"We organized..." "The team achieved..." "Our club..." — where is the STUDENT?',
      fix: 'Rewrite every description to start with "I" and show YOUR specific contribution, decision, or creation.',
    },
    {
      name: 'The Resume Spike',
      description: 'Activities clearly assembled to create an artificial spike',
      problem: 'All STEM activities started in same year. Or student has no history before junior year. AOs recognize manufactured spikes.',
      fix: 'Be honest about timeline. If spike is recent, acknowledge it: "Discovered passion for X in junior year" and show genuine depth in the time available.',
    },
  ],

  /**
   * The "Remove to Improve" Principle
   *
   * Sometimes the best activity strategy is SUBTRACTION.
   * Elite counselors know that removing weak activities
   * can strengthen the overall portfolio.
   */
  removeToImprove: {
    principle: 'A portfolio of 7 strong activities is better than 10 activities where 3 are filler',
    whenToRemove: [
      'Activity description is weak AND you can\'t improve it (no real contribution to describe)',
      'Activity directly contradicts your narrative (business competitions for a pre-med student, unless you can explain the connection)',
      'Activity is obviously resume padding (one-time event listed as activity)',
      'You have 3+ activities in the same category without differentiation',
    ],
    whenToKeep: [
      'Even if weak, it fills a gap in your portfolio (only character-showing activity)',
      'It demonstrates constraint context (paid work, family responsibility)',
      'It shows a genuine interest even if not "impressive"',
      'Removing it would leave fewer than 6-7 activities total',
    ],
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// SECTION 8: CHARACTER TRAIT FRAMEWORK
// ═══════════════════════════════════════════════════════════════════

/**
 * The Character Traits Admissions Officers Seek
 *
 * Harvard's admissions lawsuit revealed they rate applicants on
 * "personal qualities." Understanding what these are and how
 * activities demonstrate them is essential.
 */
export const CHARACTER_FRAMEWORK = {
  traits: [
    {
      trait: 'Initiative',
      whatAOsLookFor: 'Evidence of STARTING things, not just joining them',
      activitySignals: ['Founded organization', 'Created program', 'Identified and solved problem independently', 'Expanded beyond what was asked'],
      descriptionLanguage: 'Verbs: founded, created, launched, designed, initiated, proposed',
      antiSignals: 'Only joined existing programs. Never modified or improved anything.',
    },
    {
      trait: 'Resilience',
      whatAOsLookFor: 'How they responded to setbacks, not just whether they succeeded',
      activitySignals: ['Overcame specific challenge', 'Failed and tried again differently', 'Sustained commitment through difficult period', 'Adapted to changing circumstances'],
      descriptionLanguage: 'Show the arc: challenge → response → result. Not just the result.',
      antiSignals: 'Only successes listed. No evidence of ever facing difficulty.',
    },
    {
      trait: 'Intellectual Curiosity',
      whatAOsLookFor: 'Pursuit of knowledge beyond what\'s required or expected',
      activitySignals: ['Self-directed research or learning', 'Cross-domain connections', 'Questions that led to projects', 'Reading/learning beyond curriculum'],
      descriptionLanguage: '"Curious about X, I explored..." "After learning Y, I wondered..."',
      antiSignals: 'All learning was assigned. No evidence of independent intellectual pursuit.',
    },
    {
      trait: 'Empathy',
      whatAOsLookFor: 'Genuine care for others demonstrated through ACTION, not words',
      activitySignals: ['Service designed around recipient needs', 'Mentoring with measurable impact', 'Bridge-building between communities', 'Sustained helping behavior beyond requirements'],
      descriptionLanguage: 'Focus on WHO was helped and HOW their situation changed.',
      antiSignals: 'Service described in terms of self-benefit. "Gave me perspective" rather than "helped them achieve."',
    },
    {
      trait: 'Leadership',
      whatAOsLookFor: 'Influence that created measurable change, not positional authority',
      activitySignals: ['Measurable change in organization/community', 'Others followed by choice', 'Built systems or traditions that persist', 'Developed other leaders'],
      descriptionLanguage: 'Results-first: "Under my leadership, X changed to Y" with specific metrics.',
      antiSignals: 'Leadership = title only. No evidence of impact or others following.',
    },
    {
      trait: 'Integrity',
      whatAOsLookFor: 'Consistency between stated values and actions',
      activitySignals: ['Chose harder right over easier wrong', 'Maintained commitment when inconvenient', 'Honest about limitations or failures', 'Consistent behavior across contexts'],
      descriptionLanguage: 'Subtle: shown through choices, not claimed directly.',
      antiSignals: 'Inflated metrics, inconsistent timeline, title doesn\'t match description.',
    },
    {
      trait: 'Contribution',
      whatAOsLookFor: 'Will this student make our campus better?',
      activitySignals: ['Created value for community', 'Skills/perspectives they\'d bring to campus', 'History of enriching groups they join', 'Multiplier effect on others'],
      descriptionLanguage: 'Show what YOU added to the group, not just what the group is.',
      antiSignals: 'Activities are self-focused. No evidence of making groups better.',
    },
  ],

  /**
   * How to Map Activities to Character Traits
   */
  mappingMethod: {
    step1: 'For each activity, identify the PRIMARY character trait demonstrated',
    step2: 'Check for trait gaps: If no activity demonstrates resilience, consider reframing one that does',
    step3: 'Avoid redundancy: If 5 activities show "leadership," reframe some to show other traits',
    step4: 'Ensure top 3 activities demonstrate DIFFERENT primary traits for maximum dimensionality',
    teaching: 'Help students see which traits their activities demonstrate, and where gaps exist. "Your activities show strong initiative and leadership, but where\'s the empathy evidence?"',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// SECTION 9: IMPACT VERIFICATION STANDARDS
// ═══════════════════════════════════════════════════════════════════

/**
 * How to Evaluate Whether Impact Claims Are Credible
 *
 * Not all numbers are created equal. "Helped 500 people" is
 * different depending on the mechanism.
 */
export const IMPACT_VERIFICATION = {
  credibilityTiers: [
    {
      tier: 'verified_external',
      description: 'Impact confirmed by external source',
      examples: ['Published in peer-reviewed journal', 'Award from recognized body', 'Media coverage', 'Letter from organization leader'],
      credibilityScore: 10,
      aoTrust: 'Full trust — externally validated',
    },
    {
      tier: 'quantified_specific',
      description: 'Specific numbers with clear mechanism',
      examples: ['15 students improved grades by average 0.8 GPA points', 'Raised $4,200 through 6 bake sales', 'App downloaded 1,247 times'],
      credibilityScore: 8,
      aoTrust: 'High trust — specific enough to be believable',
    },
    {
      tier: 'quantified_broad',
      description: 'Numbers present but mechanism unclear',
      examples: ['Helped 200+ students', 'Impacted the community', 'Reached thousands through social media'],
      credibilityScore: 5,
      aoTrust: 'Moderate trust — numbers could be inflated',
    },
    {
      tier: 'qualitative_specific',
      description: 'No numbers but specific outcomes described',
      examples: ['Students reported feeling more confident', 'Program adopted by school', 'Coach said team dynamics improved'],
      credibilityScore: 6,
      aoTrust: 'Moderate trust — specific but not verifiable',
    },
    {
      tier: 'qualitative_vague',
      description: 'Generic impact claims',
      examples: ['Made a difference', 'Helped others', 'Contributed to success'],
      credibilityScore: 2,
      aoTrust: 'Low trust — could describe literally anything',
    },
  ],

  /**
   * The "Could You Prove It?" Test
   */
  proofTest: {
    question: 'If an AO asked you to provide evidence for every claim in your description, could you?',
    goldStandard: 'Every number has a source. Every claim has evidence. You could provide a 1-page appendix if asked.',
    acceptable: 'Most claims are verifiable. A few are reasonable estimates you could explain.',
    risky: 'Several claims would be difficult to prove. Some numbers are rounded up significantly.',
    dangerous: 'Claims are aspirational, not actual. Numbers are inflated. "Impact" is assumed, not measured.',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// SECTION 10: EXPERT ASSEMBLY FUNCTION
// ═══════════════════════════════════════════════════════════════════

export interface ExpertKnowledgeContext {
  aoReadingProcess: typeof AO_READING_PROCESS;
  constraintLevel: (typeof CONSTRAINT_INTELLIGENCE.levels)[number] | null;
  schoolArchetypes: (typeof SCHOOL_INTELLIGENCE.archetypes)[number][];
  narrativeArc: (typeof NARRATIVE_ARC_PATTERNS.arcs)[number] | null;
  authenticityAssessment: {
    genuineSignals: string[];
    redFlags: string[];
    overallLevel: string;
  };
  advancedIssues: (typeof ADVANCED_TEACHING_BUNDLES)[keyof typeof ADVANCED_TEACHING_BUNDLES][];
  portfolioStrategy: typeof PORTFOLIO_STRATEGY;
  characterTraits: {
    demonstrated: string[];
    missing: string[];
  };
  impactCredibility: string;
}

/**
 * Assemble expert knowledge context for a student's portfolio
 *
 * This is the main entry point for integrating expert knowledge
 * into the analysis and teaching pipeline.
 */
export function assembleExpertContext(params: {
  activities: Array<{
    id: string;
    title: string;
    description: string;
    role?: string;
    hoursPerWeek: number;
    weeksPerYear: number;
    yearsInvolved: number;
    gradeLevels?: string[];
  }>;
  studentContext?: {
    intendedMajor?: string;
    targetSchools?: string[];
    isFirstGen?: boolean;
    hasWorkObligations?: boolean;
    workHoursPerWeek?: number;
    constraintNotes?: string;
    geographicContext?: string;
  };
  analysisResults?: Record<string, {
    tier: number;
    greenFlags: string[];
    redFlags: string[];
    issues: string[];
  }>;
}): ExpertKnowledgeContext {
  const { activities, studentContext, analysisResults } = params;

  // 1. Detect constraint level
  const constraintLevel = detectConstraintLevel(studentContext);

  // 2. Match school archetypes
  const schoolArchetypes = matchSchoolArchetypes(studentContext?.targetSchools);

  // 3. Detect narrative arc
  const narrativeArc = detectNarrativeArc(activities);

  // 4. Assess authenticity
  const authenticityAssessment = assessAuthenticity(activities, analysisResults);

  // 5. Detect advanced issues
  const advancedIssues = detectAdvancedIssues(activities, analysisResults, studentContext);

  // 6. Map character traits
  const characterTraits = mapCharacterTraits(activities, analysisResults);

  // 7. Assess impact credibility
  const impactCredibility = assessImpactCredibility(activities);

  return {
    aoReadingProcess: AO_READING_PROCESS,
    constraintLevel,
    schoolArchetypes,
    narrativeArc,
    authenticityAssessment,
    advancedIssues,
    portfolioStrategy: PORTFOLIO_STRATEGY,
    characterTraits,
    impactCredibility,
  };
}

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

function detectConstraintLevel(
  studentContext?: ExpertKnowledgeContext['constraintLevel'] extends null ? never : {
    isFirstGen?: boolean;
    hasWorkObligations?: boolean;
    workHoursPerWeek?: number;
    constraintNotes?: string;
    geographicContext?: string;
  }
): (typeof CONSTRAINT_INTELLIGENCE.levels)[number] | null {
  if (!studentContext) return null;

  let maxLevel = 0;

  if (studentContext.hasWorkObligations) {
    if ((studentContext.workHoursPerWeek || 0) >= 20) maxLevel = Math.max(maxLevel, 3);
    else if ((studentContext.workHoursPerWeek || 0) >= 10) maxLevel = Math.max(maxLevel, 2);
  }

  if (studentContext.isFirstGen) maxLevel = Math.max(maxLevel, 2);

  if (studentContext.geographicContext?.toLowerCase().includes('rural')) {
    maxLevel = Math.max(maxLevel, 2);
  }

  // Check constraint notes for higher-level signals
  const notes = (studentContext.constraintNotes || '').toLowerCase();
  if (notes.includes('caretaker') || notes.includes('caregiver') || notes.includes('family responsibility')) {
    maxLevel = Math.max(maxLevel, 3);
  }
  if (notes.includes('homeless') || notes.includes('foster') || notes.includes('refugee') || notes.includes('primary breadwinner')) {
    maxLevel = Math.max(maxLevel, 4);
  }

  if (maxLevel === 0) return null;
  return CONSTRAINT_INTELLIGENCE.levels[maxLevel - 1];
}

function matchSchoolArchetypes(
  targetSchools?: string[]
): (typeof SCHOOL_INTELLIGENCE.archetypes)[number][] {
  if (!targetSchools || targetSchools.length === 0) return [];

  const matched: (typeof SCHOOL_INTELLIGENCE.archetypes)[number][] = [];
  const normalizedTargets = targetSchools.map(s => s.toLowerCase());

  for (const archetype of SCHOOL_INTELLIGENCE.archetypes) {
    const hasMatch = archetype.schools.some(school =>
      normalizedTargets.some(target =>
        target.includes(school.toLowerCase()) || school.toLowerCase().includes(target)
      )
    );
    if (hasMatch) matched.push(archetype);
  }

  // If no specific matches, return the two most common archetypes as defaults
  if (matched.length === 0) {
    return [
      SCHOOL_INTELLIGENCE.archetypes[0], // tech_innovator
      SCHOOL_INTELLIGENCE.archetypes[1], // intellectual_leader
    ];
  }

  return matched;
}

function detectNarrativeArc(
  activities: Array<{
    yearsInvolved: number;
    role?: string;
    description: string;
  }>
): (typeof NARRATIVE_ARC_PATTERNS.arcs)[number] | null {
  if (!activities || activities.length === 0) return null;

  const desc = activities.map(a => (a.description || '').toLowerCase()).join(' ');
  const roles = activities.map(a => (a.role || '').toLowerCase());

  // Builder Arc: founded/created + scaling evidence
  if (roles.some(r => r.includes('founder') || r.includes('creator')) &&
      (desc.includes('grew') || desc.includes('scaled') || desc.includes('expanded'))) {
    return NARRATIVE_ARC_PATTERNS.arcs[0]; // Builder
  }

  // Depth Arc: multi-year + progressive skill
  const longTermActivities = activities.filter(a => a.yearsInvolved >= 3);
  if (longTermActivities.length >= 2 &&
      (desc.includes('advanced') || desc.includes('mastered') || desc.includes('published') || desc.includes('competed'))) {
    return NARRATIVE_ARC_PATTERNS.arcs[1]; // Depth
  }

  // Multiplier Arc: teaching/mentoring evidence
  if (desc.includes('taught') || desc.includes('mentor') || desc.includes('trained') || desc.includes('tutored')) {
    if (desc.includes('student') || desc.includes('learner') || desc.includes('participant')) {
      return NARRATIVE_ARC_PATTERNS.arcs[5]; // Multiplier
    }
  }

  // Bridge-Builder Arc: connecting groups
  if (desc.includes('community') && (desc.includes('connect') || desc.includes('bridge') || desc.includes('bilingual'))) {
    return NARRATIVE_ARC_PATTERNS.arcs[3]; // Bridge-Builder
  }

  // Resilience Arc: failure/setback language
  if (desc.includes('failed') || desc.includes('setback') || desc.includes('rebuilt') || desc.includes('overcame')) {
    return NARRATIVE_ARC_PATTERNS.arcs[2]; // Resilience
  }

  return null;
}

function assessAuthenticity(
  activities: Array<{
    description: string;
    hoursPerWeek: number;
    gradeLevels?: string[];
  }>,
  analysisResults?: Record<string, { greenFlags: string[]; redFlags: string[] }>
): ExpertKnowledgeContext['authenticityAssessment'] {
  if (!activities || activities.length === 0) {
    return { genuineSignals: [], redFlags: [], overallLevel: 'genuine' };
  }

  const genuineSignals: string[] = [];
  const redFlags: string[] = [];

  // Check total hours credibility
  const totalWeeklyHours = activities.reduce((sum, a) => sum + (a.hoursPerWeek || 0), 0);
  if (totalWeeklyHours > 40) {
    redFlags.push(`Total claimed hours (${totalWeeklyHours}/week) exceed credible threshold for high schooler`);
  }

  // Check for sudden activity spike
  const gradeLevelsFlat = activities.flatMap(a => a.gradeLevels || []);
  const seniorOnly = gradeLevelsFlat.filter(g => g === '12').length;
  const total = gradeLevelsFlat.length;
  if (total > 0 && seniorOnly / total > 0.5) {
    redFlags.push('Majority of activities started senior year — possible resume padding');
  }

  // Check for specific details (genuine signal)
  for (const activity of activities) {
    const desc = activity.description || '';
    if (/\d+/.test(desc)) genuineSignals.push('Contains specific numbers');
    if (desc.includes('→') || (desc.includes('to ') && /\d/.test(desc))) {
      genuineSignals.push('Contains before/after progression');
    }
  }

  // Pull from analysis results
  if (analysisResults) {
    for (const [, analysis] of Object.entries(analysisResults)) {
      if (analysis?.greenFlags) genuineSignals.push(...analysis.greenFlags.slice(0, 2));
      if (analysis?.redFlags) redFlags.push(...analysis.redFlags.slice(0, 2));
    }
  }

  // Determine overall level
  let overallLevel = 'genuine';
  if (redFlags.length >= 3) overallLevel = 'suspicious';
  else if (redFlags.length >= 1) overallLevel = 'polished';
  if (genuineSignals.length >= 5 && redFlags.length === 0) overallLevel = 'deeply_authentic';

  return { genuineSignals, redFlags, overallLevel };
}

function detectAdvancedIssues(
  activities: Array<{
    id: string;
    title: string;
    description: string;
    role?: string;
  }>,
  analysisResults?: Record<string, { tier: number; issues: string[] }>,
  studentContext?: { intendedMajor?: string }
): (typeof ADVANCED_TEACHING_BUNDLES)[keyof typeof ADVANCED_TEACHING_BUNDLES][] {
  if (!activities || activities.length === 0) return [];

  const detected: (typeof ADVANCED_TEACHING_BUNDLES)[keyof typeof ADVANCED_TEACHING_BUNDLES][] = [];

  for (const activity of activities) {
    const desc = (activity.description || '').toLowerCase();
    const analysis = analysisResults?.[activity.id];

    // Overclaiming detection
    if (desc.match(/\d{4,}/) && !desc.includes('year') && !desc.includes('hour')) {
      // Large numbers without clear mechanism
      detected.push(ADVANCED_TEACHING_BUNDLES.overclaiming);
    }

    // Leadership without evidence
    const leadershipTitles = ['president', 'captain', 'founder', 'director', 'chair'];
    const hasTitle = leadershipTitles.some(t => (activity.role || '').toLowerCase().includes(t));
    if (hasTitle && (!desc.includes('led') && !desc.includes('created') && !desc.includes('built') &&
        !desc.includes('grew') && !desc.includes('improved'))) {
      detected.push(ADVANCED_TEACHING_BUNDLES.leadershipWithoutEvidence);
    }

    // Growth arc failure - long involvement without progression language
    if (desc.length < 100 && !desc.includes('grew') && !desc.includes('advanced') &&
        !desc.includes('promoted') && !desc.includes('year')) {
      if (analysis && analysis.tier >= 3) {
        detected.push(ADVANCED_TEACHING_BUNDLES.growthArcFailure);
      }
    }

    // Tone/voice issues
    const corporateWords = ['spearheaded', 'synergized', 'leveraged', 'cultivated', 'orchestrated', 'stakeholder'];
    if (corporateWords.some(w => desc.includes(w))) {
      detected.push(ADVANCED_TEACHING_BUNDLES.toneVoiceIssues);
    }
  }

  // Portfolio-level: Relevance disconnect
  if (studentContext?.intendedMajor) {
    const majorLower = studentContext.intendedMajor.toLowerCase();
    const activityTexts = activities.map(a => `${a.title} ${a.description}`.toLowerCase());
    const majorMentions = activityTexts.filter(t =>
      t.includes(majorLower) || t.includes(majorLower.split(' ')[0])
    ).length;
    if (majorMentions === 0 && activities.length >= 5) {
      detected.push(ADVANCED_TEACHING_BUNDLES.relevanceDisconnect);
    }
  }

  // Survivor bias - check if portfolio is all "checkbox" activities
  const commonActivities = ['nhs', 'national honor', 'volunteer', 'varsity', 'key club', 'student council'];
  const checkboxCount = activities.filter(a =>
    commonActivities.some(ca => a.title.toLowerCase().includes(ca))
  ).length;
  if (checkboxCount >= activities.length * 0.6) {
    detected.push(ADVANCED_TEACHING_BUNDLES.survivorBias);
  }

  // Deduplicate by issue type
  const seen = new Set<string>();
  return detected.filter(issue => {
    if (seen.has(issue.issueType)) return false;
    seen.add(issue.issueType);
    return true;
  });
}

function mapCharacterTraits(
  activities: Array<{ description: string; role?: string }>,
  analysisResults?: Record<string, { greenFlags: string[] }>
): ExpertKnowledgeContext['characterTraits'] {
  if (!activities || activities.length === 0) {
    return { demonstrated: [], missing: CHARACTER_FRAMEWORK.traits.map(t => t.trait) };
  }

  const demonstrated: Set<string> = new Set();
  const allTraits = CHARACTER_FRAMEWORK.traits.map(t => t.trait);

  for (const activity of activities) {
    const desc = (activity.description || '').toLowerCase();
    const role = (activity.role || '').toLowerCase();

    if (role.includes('founder') || role.includes('creator') || desc.includes('created') || desc.includes('launched') || desc.includes('initiated')) {
      demonstrated.add('Initiative');
    }
    if (desc.includes('failed') || desc.includes('challenge') || desc.includes('overcame') || desc.includes('despite')) {
      demonstrated.add('Resilience');
    }
    if (desc.includes('research') || desc.includes('explored') || desc.includes('curious') || desc.includes('independent study')) {
      demonstrated.add('Intellectual Curiosity');
    }
    if (desc.includes('mentor') || desc.includes('volunteer') || desc.includes('served') || desc.includes('helped') || desc.includes('community')) {
      demonstrated.add('Empathy');
    }
    if (role.includes('president') || role.includes('captain') || role.includes('leader') || desc.includes('led') || desc.includes('managed')) {
      demonstrated.add('Leadership');
    }
    if (desc.includes('commit') || desc.includes('consistent') || desc.includes('maintained') || desc.includes('years')) {
      demonstrated.add('Integrity');
    }
    if (desc.includes('impact') || desc.includes('improve') || desc.includes('benefi') || desc.includes('contribute')) {
      demonstrated.add('Contribution');
    }
  }

  const missing = allTraits.filter(t => !demonstrated.has(t));

  return {
    demonstrated: Array.from(demonstrated),
    missing,
  };
}

function assessImpactCredibility(
  activities: Array<{ description: string }>
): string {
  if (!activities || activities.length === 0) return 'needs_improvement';

  let totalScore = 0;
  let count = 0;

  for (const activity of activities) {
    const desc = activity.description || '';
    let score = 0;

    // Quantified specific (numbers with mechanism)
    if (/\d+/.test(desc) && (desc.includes('student') || desc.includes('member') || desc.includes('participant'))) {
      score = 8;
    }
    // Quantified broad (numbers without clear mechanism)
    else if (/\d+/.test(desc)) {
      score = 5;
    }
    // Qualitative specific
    else if (desc.includes('adopted') || desc.includes('recognized') || desc.includes('awarded')) {
      score = 6;
    }
    // Qualitative vague
    else {
      score = 2;
    }

    totalScore += score;
    count++;
  }

  const avgScore = count > 0 ? totalScore / count : 0;

  if (avgScore >= 7) return 'high_credibility';
  if (avgScore >= 5) return 'moderate_credibility';
  if (avgScore >= 3) return 'low_credibility';
  return 'needs_improvement';
}

/**
 * Format expert knowledge for injection into LLM prompts
 *
 * Creates a structured text block that can be inserted into
 * any teaching or analysis prompt to provide expert-level context.
 */
export function formatExpertKnowledgeForPrompt(context: ExpertKnowledgeContext): string {
  const sections: string[] = [];

  // AO Reading Process
  sections.push(`## HOW ADMISSIONS OFFICERS READ APPLICATIONS

${context.aoReadingProcess.committeePitchTest.whatAONeeds.map(need => `- ${need}`).join('\n')}

CRITICAL INSIGHT: The AO must pitch this student to a committee in 90 seconds. Every activity description must give them ammunition for that pitch.

THE "OOF FACTOR" — What makes AOs lean forward:
${context.aoReadingProcess.oofFactor.triggers.slice(0, 3).map(t => `- ${t.signal}: "${t.example}"`).join('\n')}`);

  // Constraint Context
  if (context.constraintLevel) {
    sections.push(`## CONSTRAINT CONTEXT (Level ${context.constraintLevel.level}: ${context.constraintLevel.name})

${context.constraintLevel.description}

EVALUATION ADJUSTMENT: ${context.constraintLevel.evaluationNote}

Tier adjustment: +${context.constraintLevel.tierAdjustment} tier equivalence for constraint-adjusted achievement.
This means: A Tier 3 activity under these constraints demonstrates Tier ${Math.max(1, 3 - context.constraintLevel.tierAdjustment)} CHARACTER and INITIATIVE.`);
  }

  // School-Specific Intelligence
  if (context.schoolArchetypes.length > 0) {
    const schoolSection = context.schoolArchetypes.map(arch => `
### ${arch.name} (${arch.schools.slice(0, 3).join(', ')}+)
Values: ${arch.whatTheyValue.primary}
Ideal Spike: ${arch.idealSpike}
Description Advice: ${arch.descriptionAdvice}
STRONG signals: ${arch.activitySignals.strong.slice(0, 3).join('; ')}
WEAK signals: ${arch.activitySignals.weak.slice(0, 2).join('; ')}`).join('\n');

    sections.push(`## SCHOOL-SPECIFIC INTELLIGENCE\n${schoolSection}`);
  }

  // Narrative Arc
  if (context.narrativeArc) {
    sections.push(`## DETECTED NARRATIVE ARC: ${context.narrativeArc.name}

Pattern: ${context.narrativeArc.pattern}
Why AOs Value This: ${context.narrativeArc.why}
School Fit: ${context.narrativeArc.schoolFit.join(', ')}
Tier 1 Indicator: ${context.narrativeArc.tier1Indicators}

TEACHING: Name this arc for the student and help them see the pattern. "${context.narrativeArc.example}"`);
  }

  // Authenticity
  sections.push(`## AUTHENTICITY ASSESSMENT: ${context.authenticityAssessment.overallLevel.toUpperCase()}

Genuine Signals: ${context.authenticityAssessment.genuineSignals.slice(0, 5).join('; ') || 'None detected'}
Red Flags: ${context.authenticityAssessment.redFlags.slice(0, 3).join('; ') || 'None detected'}`);

  // Character Traits
  sections.push(`## CHARACTER TRAIT MAP

Demonstrated: ${context.characterTraits.demonstrated.join(', ') || 'Need more data'}
Missing: ${context.characterTraits.missing.join(', ') || 'All covered'}

${context.characterTraits.missing.length > 0 ? `TEACHING OPPORTUNITY: This student's portfolio doesn't demonstrate ${context.characterTraits.missing.join(' or ')}. Consider reframing existing activities or identifying hidden evidence of these traits.` : 'STRENGTH: This portfolio demonstrates a well-rounded character profile.'}`);

  // Advanced Issues
  if (context.advancedIssues.length > 0) {
    const issueSection = context.advancedIssues.map(issue =>
      `- **${issue.theProblem.headline}**: ${issue.whyThisWorks.admissionsQuote} (${issue.whyThisWorks.quoteSource})`
    ).join('\n');

    sections.push(`## ADVANCED ISSUES DETECTED\n${issueSection}`);
  }

  // Impact Credibility
  sections.push(`## IMPACT CREDIBILITY: ${context.impactCredibility.replace(/_/g, ' ').toUpperCase()}

${context.impactCredibility === 'high_credibility'
    ? 'This portfolio has strong, specific, verifiable impact claims. AOs will trust these numbers.'
    : context.impactCredibility === 'moderate_credibility'
    ? 'Some claims are well-supported, others need strengthening. Help student add specificity and mechanism to vague claims.'
    : 'Impact claims are mostly vague or unsubstantiated. Priority teaching: help student quantify and ground every claim.'}`);

  return sections.join('\n\n');
}
