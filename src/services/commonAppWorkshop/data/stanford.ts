/**
 * Stanford University - Comprehensive College Research Data
 *
 * Extracted from STANFORD_COMPREHENSIVE_OVERLAY.md
 * Research Quality: 89/100
 * Total Sources: 43+ primary sources
 *
 * **QUALITY PRINCIPLE**: This is FULL data, never compressed.
 * All Dean quotes, rubrics, and evidence are preserved.
 */

import {
  CollegeResearch,
  CollegeCoreValue,
  CollegeEssayPrompt,
  CollegeRedFlag,
  CollegeGreenFlag,
  CollegeSocraticQuestionBank,
  CollegeEliteExample,
  CollegeKeyQuote,
  CollegeDimensionWeights,
} from '../types';

// ============================================================================
// STANFORD CORE VALUES
// ============================================================================

export const stanfordCoreValues: CollegeCoreValue[] = [
  {
    valueId: 'intellectual_vitality',
    valueName: 'Intellectual Vitality',
    weight: 40, // Highest weight - Dean Shaw's #1 criterion
    definition:
      'Energy and depth of thought for anything you engage in, not just academics. The love of learning for its own sake.',
    essayImplication:
      'Essays must demonstrate self-directed exploration beyond requirements. Focus on the PROCESS of thinking, not outcomes achieved.',
    evidence: [
      {
        source: 'Dean Richard Shaw',
        quote:
          "We use the term 'intellectual vitality.' But it's vitality for anything they engage in... We want to see the energy and depth of thought... We want to hear a 'voice'—that's a critical component.",
        context: 'Stanford Magazine interview on admissions priorities',
      },
      {
        source: 'Dean Richard Shaw',
        quote:
          'Intellectual Vitality is about pursuing learning for its own sake.',
        context: 'Stanford admissions philosophy explanation',
      },
    ],
    sourceMentionCount: 5,
    isNot: [
      'High grades or test scores (that\'s proficiency)',
      'Resume accomplishments (that\'s achievement)',
      'Awards or leadership titles (that\'s recognition)',
      'Class-based learning only',
    ],
    is: [
      'The energy with which you pursue knowledge',
      '"Geeking out" on a topic for its own sake',
      'Self-directed exploration beyond requirements',
      'The PROCESS of thinking, not just outcomes',
      'Questions you can\'t stop thinking about',
    ],
  },
  {
    valueId: 'authentic_voice',
    valueName: 'Authentic Voice',
    weight: 25,
    definition:
      'A genuine, personal voice that sounds like a real student, not a polished consultant product.',
    essayImplication:
      'All essays must sound like real person, not polished consultant work. Especially critical in Roommate essay.',
    evidence: [
      {
        source: 'Dean Richard Shaw',
        quote: "We want to hear a 'voice'—that's a critical component.",
        context: 'Stanford Magazine interview',
      },
    ],
    sourceMentionCount: 4,
    isNot: [
      'Over-polished consultant voice',
      'Formal academic language',
      'Generic statements anyone could make',
      'Press release tone',
    ],
    is: [
      'Natural conversational tone',
      'Specific personal details',
      'Genuine enthusiasm visible in word choice',
      'Real student voice, not performed',
    ],
  },
  {
    valueId: 'character_personal_qualities',
    valueName: 'Character & Personal Qualities',
    weight: 20,
    definition:
      'Who you are as a person - your values, personality, and how you engage with others.',
    essayImplication:
      'Essays are the primary character assessment vehicle. Show who you are through stories and specific details.',
    evidence: [
      {
        source: 'Common Data Set 2023-24 Section C7',
        quote: 'Character/Personal Qualities: Very Important',
        context: 'Stanford CDS official importance ratings',
      },
    ],
    sourceMentionCount: 3,
    isNot: [
      'List of achievements',
      'Leadership titles without context',
      'Generic positive traits',
    ],
    is: [
      'Values demonstrated through action',
      'Genuine personality traits',
      'How you treat others',
      'What you care about and why',
    ],
  },
  {
    valueId: 'distinctive_contribution',
    valueName: 'Distinctive Contribution',
    weight: 15,
    definition:
      'How your specific background and lived experience will add unique value to the Stanford community.',
    essayImplication:
      'Must show clear link: background → perspective → specific Stanford contribution. Name specific Stanford communities.',
    evidence: [
      {
        source: 'Stanford 2024-25 Essay Prompt 3',
        quote:
          'What aspects of your life experiences, interests, values, or upbringing might help you make a distinctive contribution as an undergraduate to Stanford?',
        context: 'New prompt replacing "What matters to you and why"',
      },
    ],
    sourceMentionCount: 3,
    isNot: [
      'Generic "I\'ll bring diverse perspective"',
      'Broad identity labels without specifics',
      'Future promises without past evidence',
    ],
    is: [
      'Specific aspect of background with story',
      'Clear perspective shaped by experience',
      'Named Stanford communities where you\'ll contribute',
      'Past contribution pattern as evidence',
    ],
  },
];

// ============================================================================
// STANFORD ESSAY PROMPTS
// ============================================================================

export const stanfordEssayPrompts: CollegeEssayPrompt[] = [
  {
    promptId: 'stanford_intellectual_vitality',
    promptNumber: 1,
    promptTitle: 'Intellectual Vitality',
    promptText:
      'Reflect on an idea or experience that makes you genuinely excited about learning.',
    wordCount: { min: 100, max: 250 },
    primaryAssessment: 'Pure Intellectual Vitality (love of learning for its own sake)',
    importance: 'critical',
    importanceContext:
      'This essay evaluates Stanford\'s #1 criterion. It is THE primary differentiator for the 69% of applicants with perfect stats who get rejected.',
    rubric: {
      excellent: {
        scoreRange: '90-100',
        description:
          'Outstanding - demonstrates pure intellectual vitality through self-directed exploration and genuine curiosity',
        criteria: [
          'Self-directed intellectual exploration (NOT a class you got an A in)',
          'Shows the PROCESS of thinking (rabbit holes, questions, Wikipedia spirals)',
          'Genuine excitement about learning for its own sake (not for grades/college)',
          'Specific intellectual questions or fascinations articulated',
          'Demonstrates depth of engagement beyond surface-level interest',
          'Voice conveys authentic enthusiasm and energy',
          'Topic reveals something about how your mind works',
          'Shows you can\'t stop thinking about this (obsessive curiosity)',
        ],
        typicalElements: [
          'Opens with specific question or moment of fascination',
          'Describes self-directed exploration (reading, projects, thought experiments)',
          'Shows evolution of thinking or deepening questions',
          'Reveals the "why" behind curiosity (what makes this fascinating to you)',
          'Demonstrates ongoing engagement (not one-time event)',
          'Voice sounds like someone genuinely "geeking out"',
          'May include questions you still don\'t have answers to',
        ],
        dimensionalPattern: {
          intellectual_vitality_energy: 'STRONG - Self-directed, obsessive curiosity evident',
          depth_of_thought: 'STRONG - Shows evolution of thinking, not just interest',
          authentic_enthusiasm: 'STRONG - Voice conveys genuine excitement',
          process_over_outcome: 'STRONG - Focuses on thinking process, not achievements',
        },
      },
      good: {
        scoreRange: '70-89',
        description:
          'Strong intellectual curiosity but may lack full self-direction or depth of process',
        criteria: [
          'Intellectual curiosity evident but may be class-prompted',
          'Some self-directed exploration shown',
          'Genuine interest but may focus more on content than process',
          'Questions or fascinations present but less developed',
          'Authentic voice but may not fully convey "geeking out" energy',
          'Good reflection but may need more depth on thinking process',
        ],
        whatPreventsHigherScore:
          'To reach 90+: (1) ensure exploration is fully self-directed (not class assignment), (2) focus more on PROCESS of thinking (questions, rabbit holes) than content learned, (3) show ongoing obsession (not one-time interest), (4) articulate specific intellectual questions that drive you, (5) convey more energy/excitement in voice',
      },
      average: {
        scoreRange: '50-69',
        description:
          'Adequate but misses Intellectual Vitality core - may confuse achievement with vitality',
        criteria: [
          'Class-based learning (got an A, enjoyed the course) - misses self-directed requirement',
          'More description of content than process of thinking',
          'Limited demonstration of deep questions or ongoing exploration',
          'May confuse accomplishment (research paper, project grade) with intellectual vitality',
          'Voice lacks energy or authentic enthusiasm',
          'Generic intellectual interest anyone could claim',
        ],
        whatPreventsHigherScore:
          'To reach 70+: (1) shift from class-based to self-directed exploration, (2) focus on WHY you\'re fascinated (the questions) not WHAT you learned (the content), (3) show the rabbit hole (how curiosity led you deeper), (4) demonstrate this is ongoing obsession, (5) inject genuine enthusiasm into voice, (6) avoid confusing achievement with vitality',
      },
      weak: {
        scoreRange: 'below 50',
        description: 'Does not demonstrate Intellectual Vitality - critical admissions failure',
        criticalFailures: [
          'Purely class-based (no self-direction)',
          'Resume accomplishments (research paper that won award) instead of thinking process',
          'Extrinsic motivation (learned for college apps, grades) instead of intrinsic',
          'No specific questions or depth of thought',
          'Generic topic with no personal intellectual angle',
          'Lacks authentic voice or enthusiasm',
          'Confuses proficiency (good grades) with vitality (love of learning)',
        ],
      },
    },
    dimensionalCriteria: [
      {
        dimensionId: 'intellectual_vitality_energy',
        dimensionName: 'Intellectual Vitality Energy',
        weight: 40,
        context: 'Dean Shaw\'s #1 criterion - "the energy and depth of thought"',
        evaluationQuestions: [
          'Is exploration self-directed or class-prompted?',
          'Does essay convey ENERGY for the topic?',
          'Is learning intrinsic (for its own sake) or extrinsic (for grades/college)?',
          'Does student show they "can\'t stop thinking about this"?',
          'Is there evidence of going beyond requirements?',
        ],
        scoringLogic: {
          strong: [
            'Fully self-directed exploration (independent reading, projects, thought experiments)',
            'Voice conveys genuine obsessive curiosity',
            'Intrinsic motivation clear (love of learning, not achievement)',
            'Evidence of going deep beyond any requirement',
            'Shows sustained engagement over time',
            'You can feel the energy in the writing',
          ],
          adequate: [
            'Mostly self-directed with some class connection',
            'Genuine interest but less obsessive energy',
            'Mix of intrinsic and extrinsic motivation',
            'Some depth beyond requirements',
          ],
          weak: [
            'Purely class-based (no self-direction)',
            'No energy evident (sounds dutiful, not excited)',
            'Extrinsic motivation (for college, grades, resume)',
            'Stayed within requirements only',
            'One-time event, not sustained curiosity',
          ],
        },
        impactOnScore: {
          strong: 'Essential for 85+ - this IS the essay\'s purpose',
          adequate: 'Supports 70-84',
          weak: 'Caps at 69 or below - misses Stanford\'s #1 criterion',
        },
        howToImprove: [
          'Choose topic you explored independently (not for class)',
          'Show what made you go down the rabbit hole',
          'Describe the questions that won\'t leave you alone',
          'Convey genuine excitement in your voice',
          'Focus on the PROCESS of thinking, not content learned',
        ],
      },
      {
        dimensionId: 'depth_of_thought',
        dimensionName: 'Depth of Thought',
        weight: 30,
        context: 'Dean Shaw: "depth of thought" - not surface-level interest but deep engagement',
        evaluationQuestions: [
          'Does essay show evolution of thinking?',
          'Are specific intellectual questions articulated?',
          'Does student demonstrate deep engagement vs. surface interest?',
          'Is there evidence of complexity (nuance, multiple perspectives, unresolved questions)?',
          'Does essay reveal how the student\'s mind works?',
        ],
        scoringLogic: {
          strong: [
            'Shows evolution of thinking (how questions deepened)',
            'Specific intellectual questions or problems articulated',
            'Demonstrates complexity and nuance',
            'Questions you still don\'t have answers to',
            'Reveals your thinking process clearly',
            'Goes multiple layers deep (not just "climate change is interesting")',
          ],
          adequate: [
            'Some evolution of thinking',
            'Questions present but less specific',
            'Decent depth but could go deeper',
            'Some thinking process shown',
          ],
          weak: [
            'No evolution (static interest)',
            'Vague or no specific questions',
            'Surface-level throughout',
            'Doesn\'t reveal thinking process',
            'Generic intellectual interest',
          ],
        },
        impactOnScore: {
          strong: 'Essential for 85+',
          adequate: 'Supports 70-84',
          weak: 'Caps at 69 - "depth of thought" is Shaw\'s explicit criterion',
        },
        howToImprove: [
          'Articulate 2-3 specific questions that fascinate you',
          'Show how your thinking evolved (what you wondered → what you discovered → new questions)',
          'Go multiple layers deep on one topic vs. breadth',
          'Include questions you haven\'t answered yet',
          'Reveal your thinking process explicitly',
        ],
      },
      {
        dimensionId: 'authentic_enthusiasm',
        dimensionName: 'Authentic Enthusiasm',
        weight: 20,
        context: 'Dean Shaw: "We want to hear a voice" - must sound like real person genuinely excited',
        evaluationQuestions: [
          'Does voice convey genuine excitement?',
          'Can you feel the student\'s enthusiasm?',
          'Does essay sound like real person or polished consultant work?',
          'Is enthusiasm authentic or performative?',
          'Would you want to hear this person talk about their interest?',
        ],
        scoringLogic: {
          strong: [
            'Genuine excitement palpable throughout',
            'Voice sounds like real student "geeking out"',
            'Specific details prove authentic engagement',
            'Would be compelling to hear them discuss this',
            'Enthusiasm natural, not forced',
          ],
          adequate: [
            'Interest evident but less enthusiastic',
            'Voice authentic but more measured',
            'Some excitement but not infectious',
          ],
          weak: [
            'Sounds dutiful or academic (not excited)',
            'Over-polished consultant voice',
            'Performative or fake enthusiasm',
            'Reads like someone told you to sound interested',
          ],
        },
        impactOnScore: {
          strong: 'Necessary for 80+',
          adequate: 'Supports 65-79',
          weak: 'Caps at 64 - Shaw explicitly wants to "hear a voice"',
        },
        howToImprove: [
          'Write like you\'re explaining to a friend why this is fascinating',
          'Include specific moments when you were most excited',
          'Use natural language, not academic tone',
          'Let your genuine personality come through',
        ],
      },
      {
        dimensionId: 'process_over_outcome',
        dimensionName: 'Process Over Outcome',
        weight: 10,
        context: 'IV is about LEARNING PROCESS (thinking, exploring), not OUTCOMES (grades, awards)',
        evaluationQuestions: [
          'Does essay focus on process of learning or outcomes achieved?',
          'Is exploration the story, or is accomplishment the story?',
          'Does student show joy in thinking itself vs. pride in achievements?',
          'Is intellectual journey more prominent than credentials?',
        ],
        scoringLogic: {
          strong: [
            'Focus on process: thinking, questioning, exploring',
            'Journey of curiosity is the narrative',
            'Joy in learning itself evident',
            'Minimal mention of achievements/outcomes',
          ],
          adequate: [
            'Mix of process and outcome',
            'Some focus on learning journey',
            'Achievements mentioned but not dominant',
          ],
          weak: [
            'Outcome-focused (research that won award, paper that got A)',
            'Achievement is the story, not exploration',
            'Confuses accomplishment with intellectual vitality',
          ],
        },
        impactOnScore: {
          strong: 'Enables 85+',
          adequate: 'Supports 70-84',
          weak: 'Major penalty - confusing achievement with vitality is common failure mode',
        },
        howToImprove: [
          'Remove or minimize mentions of awards, grades, recognition',
          'Focus on what you learned and thought, not what you achieved',
          'Show the joy of discovery, not pride of accomplishment',
        ],
      },
    ],
  },
  {
    promptId: 'stanford_roommate',
    promptNumber: 2,
    promptTitle: 'Roommate Note',
    promptText:
      'Write a note to your future roommate that reveals something about you or that will help your roommate—and us—get to know you better.',
    wordCount: { min: 100, max: 250 },
    primaryAssessment: 'Personality, Social Fit, Authenticity ("Vibe Check")',
    importance: 'high',
    importanceContext:
      'This is Stanford\'s unique "Vibe Check" essay. It must feel like a letter to a PEER, not an admissions officer.',
    rubric: {
      excellent: {
        scoreRange: '90-100',
        description:
          'Outstanding - reveals genuine personality with warmth, humor, specific quirks, and authentic voice',
        criteria: [
          'Feels like genuine letter to a peer (not AO)',
          'Reveals specific, memorable personality traits or quirks',
          'Shows self-awareness and humor',
          'Balances sharing about yourself with welcoming roommate',
          'Includes specific preferences, habits, or details that make you real',
          'Voice is warm, friendly, and authentic',
          'Makes reader feel they actually know you',
          'Shows you\'d be pleasant/interesting roommate',
        ],
        typicalElements: [
          'Opens with friendly greeting',
          'Shares 2-3 specific things about daily life (music preferences, snack habits, sleep schedule quirks)',
          'Shows personality through details (not statements like "I\'m friendly")',
          'May include humor or self-deprecating awareness',
          'Addresses roommate directly (uses "you")',
          'Ends warmly with excitement to meet',
          'Avoids resume content entirely',
        ],
        dimensionalPattern: {
          authenticity_voice: 'STRONG - Sounds like real person, not polished essay',
          personality_revealed: 'STRONG - Specific quirks and preferences memorable',
          social_fit_likability: 'STRONG - Would want this person as roommate',
          self_awareness: 'STRONG - Knows own habits/quirks and shares with humor',
        },
      },
      good: {
        scoreRange: '70-89',
        description: 'Strong personality revealed but may be slightly more formal or less specific',
        criteria: [
          'Mostly peer-to-peer tone with occasional formal moments',
          'Personality evident but may be less quirky/specific',
          'Authentic voice with some warmth',
          'Shows you\'d be decent roommate',
          'May mix personality with minor accomplishments',
          'Generally friendly tone',
        ],
        whatPreventsHigherScore:
          'To reach 90+: (1) eliminate any resume content, (2) add more specific quirks/preferences (Spotify, snacks, habits), (3) inject more humor or self-awareness, (4) ensure tone is 100% peer-to-peer (not AO), (5) make personality more memorable through specifics',
      },
      average: {
        scoreRange: '50-69',
        description: 'Adequate but too formal, generic, or achievement-focused for roommate context',
        criteria: [
          'Tone too formal (sounds like admissions essay, not peer letter)',
          'Generic personality description ("I\'m friendly, outgoing, passionate")',
          'Resume content prominent (leadership roles, achievements)',
          'Limited specific personal details',
          'Lacks warmth or humor',
          'Doesn\'t feel like getting to know actual person',
        ],
        whatPreventsHigherScore:
          'To reach 70+: (1) completely change tone to peer-to-peer, (2) remove ALL resume content, (3) add specific daily-life details (not generic traits), (4) show personality through examples not adjectives, (5) inject warmth and humor, (6) write like you\'re actually talking to future roommate',
      },
      weak: {
        scoreRange: 'below 50',
        description: 'Critical failure - misunderstands prompt entirely',
        criticalFailures: [
          'Pure resume rehash (lists awards, leadership positions)',
          'Formal admissions essay tone throughout',
          'No personality revealed (generic traits only)',
          'Focuses on impressing AO instead of connecting with roommate',
          'Rigid schedule focus suggesting inflexibility',
          'Unlikeable or unwelcoming tone',
          'No specific personal details whatsoever',
        ],
      },
    },
    dimensionalCriteria: [
      {
        dimensionId: 'authenticity_voice',
        dimensionName: 'Authenticity & Voice',
        weight: 35,
        context: 'Dean Shaw: "We want to hear a voice" - Roommate essay is PRIMARY voice assessment',
        evaluationQuestions: [
          'Does essay sound like real student or polished consultant?',
          'Is tone peer-to-peer or AO-directed?',
          'Can you hear the student\'s actual voice?',
          'Does writing feel natural and conversational?',
          'Would this person actually write this to their roommate?',
        ],
        scoringLogic: {
          strong: [
            'Sounds completely natural and conversational',
            'Peer-to-peer tone throughout (no formal language)',
            'Voice matches how students actually talk',
            'No consultant polish or pretension',
            'Feels like real note you\'d actually send',
          ],
          adequate: [
            'Generally authentic with occasional formal moments',
            'Mostly peer-to-peer',
            'Voice generally natural',
            'Some consultant influence visible',
          ],
          weak: [
            'Overly formal or polished',
            'Sounds like admissions essay, not peer letter',
            'Consultant-written voice',
            'Pretentious vocabulary',
            'No real person behind the words',
          ],
        },
        impactOnScore: {
          strong: 'Essential for 80+ - authenticity is threshold requirement',
          adequate: 'Supports 65-79',
          weak: 'Caps at 64 or below - inauthentic voice fails Shaw\'s #1 Roommate criterion',
        },
        howToImprove: [
          'Write like you\'re texting a friend',
          'Use contractions, casual language',
          'Eliminate any formal/academic vocabulary',
          'Read aloud - does it sound like you talking?',
          'Remove anything you wouldn\'t actually say to roommate',
        ],
      },
      {
        dimensionId: 'personality_revealed',
        dimensionName: 'Personality Revealed',
        weight: 30,
        context: 'Essay must reveal specific, memorable personality - not generic traits',
        evaluationQuestions: [
          'What specific personality traits or quirks are revealed?',
          'Is personality shown through examples or just stated?',
          'Would reader remember this student after reading?',
          'Are there specific preferences, habits, or details that make you real?',
          'Does essay avoid generic "I\'m friendly/passionate" language?',
        ],
        scoringLogic: {
          strong: [
            '3+ specific personality details (Spotify habits, snack preferences, sleep quirks)',
            'Personality shown through examples (not stated with adjectives)',
            'Memorable and distinctive (reader could describe your personality after)',
            'Specific habits or routines shared',
            'Real human emerges (not generic student)',
          ],
          adequate: [
            '1-2 specific details',
            'Some personality evident',
            'Mix of showing and telling',
            'Somewhat memorable',
          ],
          weak: [
            'Generic personality statements ("I\'m outgoing, friendly, passionate")',
            'No specific details or examples',
            'Could apply to anyone',
            'Adjectives instead of specifics',
            'Forgettable',
          ],
        },
        impactOnScore: {
          strong: 'Essential for 85+',
          adequate: 'Supports 70-84',
          weak: 'Caps at 69 - generic personality fails prompt purpose',
        },
        howToImprove: [
          'Share specific habits (when you drink coffee, what music you listen to while studying)',
          'Mention actual preferences (favorite late-night snack, morning routine quirks)',
          'Show personality through details, not adjectives',
          'Be specific enough that roommate could actually use this info',
        ],
      },
      {
        dimensionId: 'social_fit_likability',
        dimensionName: 'Social Fit & Likability',
        weight: 25,
        context: 'Stanford assessing: Would this person be good roommate? Good community member?',
        evaluationQuestions: [
          'Does student seem likable and pleasant?',
          'Would you want this person as roommate?',
          'Is tone welcoming and friendly?',
          'Does student show awareness of sharing space?',
          'Are there red flags (rigid, demanding, self-absorbed)?',
        ],
        scoringLogic: {
          strong: [
            'Warm and welcoming tone',
            'Shows awareness of sharing space (asks about roommate too)',
            'Friendly and approachable',
            'Balance of self-advocacy and flexibility',
            'Makes you actually want to meet them',
          ],
          adequate: [
            'Generally friendly',
            'Decent likability',
            'No major red flags',
            'Adequate social awareness',
          ],
          weak: [
            'Rigid demands or inflexible schedule emphasis',
            'Self-absorbed (all about me, nothing welcoming roommate)',
            'Unlikeable tone',
            'Red flags about being difficult roommate',
          ],
        },
        impactOnScore: {
          strong: 'Enables 85+',
          adequate: 'Supports 70-84',
          weak: 'Major penalty - unlikeable = character concern',
        },
        howToImprove: [
          'Show you\'re flexible and considerate',
          'Ask about the roommate, show interest in them',
          'Be welcoming, not demanding',
          'Balance sharing about yourself with inviting them to share',
        ],
      },
      {
        dimensionId: 'self_awareness_humor',
        dimensionName: 'Self-Awareness & Humor',
        weight: 10,
        context: 'Best Roommate essays show self-aware humor about own quirks',
        evaluationQuestions: [
          'Does student show awareness of own habits/quirks?',
          'Is there humor or lighthearted self-awareness?',
          'Can student laugh at own idiosyncrasies?',
          'Does essay show maturity in self-knowledge?',
        ],
        scoringLogic: {
          strong: [
            'Self-aware about own quirks/habits',
            'Humor or lighthearted tone',
            'Can acknowledge own idiosyncrasies without defensiveness',
            'Maturity in self-knowledge',
          ],
          adequate: [
            'Some self-awareness',
            'May have light moments',
            'Decent self-knowledge',
          ],
          weak: [
            'No self-awareness',
            'Takes self too seriously',
            'Defensive about habits',
            'No humor',
          ],
        },
        impactOnScore: {
          strong: 'Boosts score by 5-10 points',
          adequate: 'Neutral',
          weak: 'Minor penalty',
        },
        howToImprove: [
          'Acknowledge a quirk with good humor',
          'Show you can laugh at yourself',
          'Be honest about your less-than-perfect habits',
        ],
      },
    ],
  },
  {
    promptId: 'stanford_distinctive_contribution',
    promptNumber: 3,
    promptTitle: 'Distinctive Contribution',
    promptText:
      'What aspects of your life experiences, interests, values, or upbringing might help you make a distinctive contribution as an undergraduate to Stanford?',
    wordCount: { min: 100, max: 250 },
    primaryAssessment: 'Institutional Fit & Actionable Diversity (post-SCOTUS)',
    importance: 'critical',
    importanceContext:
      'This prompt replaced the iconic "What matters to you and why" following the Supreme Court ruling. It explicitly requires connecting your background to Stanford contribution.',
    rubric: {
      excellent: {
        scoreRange: '90-100',
        description:
          'Outstanding - clearly connects specific background to specific Stanford contribution with depth',
        criteria: [
          'Specific aspect of background/lived experience (not broad identity label)',
          'Clear link: background → perspective/values → Stanford contribution',
          'Specific Stanford communities, resources, or needs identified',
          'Shows research (names specific Stanford offerings where you\'ll contribute)',
          'Demonstrates genuine understanding of how you\'ll add value',
          'Authentic voice about your experience',
          'Avoids generic "I\'ll bring diverse perspective" language',
          'Shows pattern of contribution (not just future promise)',
        ],
        typicalElements: [
          'Opens with specific aspect of background',
          'Explains what this experience taught you or perspective it gave you',
          'Names 1-2 specific Stanford communities/resources where you\'ll contribute',
          'Shows HOW your perspective will add value (not just that it will)',
          'May reference past contributions as evidence',
          'Authentic voice about identity/experience',
        ],
        dimensionalPattern: {
          distinctive_background: 'STRONG - Specific, shapes perspective, not generic',
          stanford_research: 'STRONG - 1-2 specific Stanford communities/resources named',
          actionable_contribution: 'STRONG - Tangible contribution articulated',
          authenticity: 'STRONG - Genuine voice about experience',
        },
      },
      good: {
        scoreRange: '70-89',
        description:
          'Strong background-contribution link but may lack specificity or Stanford research depth',
        criteria: [
          'Background clear but may be somewhat broad',
          'Contribution articulated but may lack specificity',
          'Some Stanford research evident but could be deeper',
          'Authentic voice about experience',
          'Shows how experience shaped perspective',
          'Connection to Stanford present but may be generic',
        ],
        whatPreventsHigherScore:
          'To reach 90+: (1) narrow to specific aspect of background (not whole identity), (2) research and name specific Stanford communities/resources, (3) explain HOW your perspective adds value (not just that it does), (4) show pattern of past contribution, (5) avoid generic diversity language',
      },
      average: {
        scoreRange: '50-69',
        description: 'Adequate but lacks specificity, Stanford connection, or clear contribution',
        criteria: [
          'Broad identity description without specific aspect',
          'Vague contribution ("I\'ll bring diverse perspective")',
          'Limited or no Stanford research evident',
          'Generic language about diversity',
          'Weak link between background and contribution',
          'May focus more on hardship than contribution',
        ],
        whatPreventsHigherScore:
          'To reach 70+: (1) choose specific aspect of background with story, (2) research specific Stanford communities where you\'ll contribute, (3) explain tangible contribution (not vague diversity claims), (4) strengthen background → perspective → contribution link, (5) show past contribution pattern',
      },
      weak: {
        scoreRange: 'below 50',
        description: 'Critical failure - no clear background-contribution link or Stanford understanding',
        criticalFailures: [
          'Generic identity statement with no specific experience',
          'No connection to Stanford contributions',
          'Pure hardship narrative with no growth or contribution',
          'No Stanford research whatsoever',
          'Purely abstract/philosophical (old "What Matters" approach won\'t work)',
          'Appropriation or exaggeration of identity',
          'Resume accomplishments instead of character/perspective',
        ],
      },
    },
    dimensionalCriteria: [
      {
        dimensionId: 'distinctive_background',
        dimensionName: 'Distinctive Background',
        weight: 30,
        context:
          'Post-SCOTUS: essays are primary way to understand lived experience, discrimination context, unique perspective',
        evaluationQuestions: [
          'Is background/experience SPECIFIC (not just broad category)?',
          'Does essay show how experience shaped perspective/values?',
          'Is perspective genuinely distinctive (not generic diversity language)?',
          'Does background reveal something not evident elsewhere?',
          'Is identity framed with agency and growth?',
        ],
        scoringLogic: {
          strong: [
            'Specific aspect of background with story/example',
            'Shows how experience shaped perspective, values, worldview',
            'Perspective is genuinely unique to your lived experience',
            'Provides context not visible in activities/transcript',
            'Balance vulnerability + agency (not victim narrative)',
            'Distinctive (not something 500 other applicants will write)',
          ],
          adequate: [
            'Background present but somewhat generic',
            'Some connection to perspective',
            'Perspective somewhat unique',
            'More description than deep exploration',
          ],
          weak: [
            'Generic identity label without specificity',
            'No explanation of how experience shaped you',
            'Perspective not distinctive',
            'Pure hardship without growth/agency',
          ],
        },
        impactOnScore: {
          strong: 'Essential for 85+',
          adequate: 'Supports 70-84',
          weak: 'Caps at 69 - generic background fails prompt purpose',
        },
        howToImprove: [
          'Narrow to ONE specific aspect of your background',
          'Tell a specific story that illustrates your experience',
          'Show how this shaped your perspective and values',
          'Connect to what makes YOUR viewpoint unique',
        ],
      },
      {
        dimensionId: 'stanford_research_fit',
        dimensionName: 'Stanford Research & Fit',
        weight: 30,
        context: 'Prompt explicitly asks about contribution "to Stanford" - must show institutional understanding',
        evaluationQuestions: [
          'Are specific Stanford communities/resources named?',
          'Does student show understanding of Stanford culture/offerings?',
          'Is Stanford connection specific or generic?',
          'Could essay be recycled for another school?',
          'Does student explain WHY these Stanford communities matter?',
        ],
        scoringLogic: {
          strong: [
            '1-2 specific Stanford communities/resources named (cultural centers, DUGs, academic programs, initiatives)',
            'Shows understanding of Stanford\'s specific approach/culture',
            'Could NOT apply to other schools (Stanford-specific)',
            'Explains personal connection to these offerings',
            'Research goes beyond homepage (knows lesser-known programs)',
          ],
          adequate: [
            'Stanford mentioned but somewhat generic',
            '1 specific offering named',
            'Some fit understanding',
            'Could mostly apply to Stanford specifically',
          ],
          weak: [
            'No specific Stanford offerings (critical failure)',
            'Generic university language',
            'Obviously could be recycled for any school',
            'No research evident',
          ],
        },
        impactOnScore: {
          strong: 'Essential for 85+ - prompt requires Stanford connection',
          adequate: 'Supports 70-84',
          weak: 'Caps at 69 - no Stanford specificity fails prompt requirement',
        },
        howToImprove: [
          'Research Stanford cultural centers, DUGs, affinity groups',
          'Name specific academic programs or initiatives relevant to your background',
          'Show understanding of Stanford\'s community approach',
          'Explain why THESE Stanford offerings connect to YOUR background',
        ],
      },
      {
        dimensionId: 'actionable_contribution',
        dimensionName: 'Actionable Contribution',
        weight: 25,
        context: 'Prompt asks how you\'ll "make a distinctive contribution" - must be tangible, not vague',
        evaluationQuestions: [
          'Is contribution specific and actionable?',
          'Does student show HOW they\'ll contribute (not just that they will)?',
          'Is there evidence of past contribution pattern?',
          'Does contribution connect clearly to background?',
          'Avoids generic "diverse perspective" language?',
        ],
        scoringLogic: {
          strong: [
            'Specific tangible contribution articulated',
            'Shows HOW perspective translates to action/value',
            'Past pattern of contribution evident (shows track record)',
            'Clear link: background → perspective → contribution',
            'Avoids vague diversity claims',
            'Contribution benefits specific Stanford community',
          ],
          adequate: [
            'Contribution mentioned but somewhat vague',
            'Some past pattern shown',
            'Contribution implied more than detailed',
          ],
          weak: [
            'Generic "I\'ll bring diverse perspective" (no specifics)',
            'No past contribution pattern',
            'Contribution unclear or absent',
            'Vague claims without tangible action',
          ],
        },
        impactOnScore: {
          strong: 'Essential for 85+',
          adequate: 'Supports 70-84',
          weak: 'Caps at 69 - vague contribution fails prompt',
        },
        howToImprove: [
          'Be specific about WHAT you\'ll contribute (actions, not just presence)',
          'Show past examples of similar contribution',
          'Connect your specific perspective to specific value you\'ll add',
          'Name the Stanford community that will benefit',
        ],
      },
      {
        dimensionId: 'authenticity',
        dimensionName: 'Authenticity',
        weight: 15,
        context: 'Threshold factor - inauthentic identity essays are serious red flags',
        evaluationQuestions: [
          'Does voice sound genuine about experience?',
          'Is vulnerability balanced with agency?',
          'Does identity feel authentic or performative?',
          'Is hardship exploited or reflected upon with growth?',
          'Avoids appropriation or exaggeration?',
        ],
        scoringLogic: {
          strong: [
            'Authentic voice throughout',
            'Balanced vulnerability (not trauma exploitation)',
            'Identity feels genuine',
            'Growth and agency evident',
            'Appropriate tone',
          ],
          adequate: [
            'Generally authentic',
            'Mostly genuine with minor performative moments',
          ],
          weak: [
            'Performative or exaggerated identity',
            'Trauma dumping for sympathy',
            'Appropriation of identity',
            'Over-coached voice',
            'Dishonesty',
          ],
        },
        impactOnScore: {
          strong: 'Enables high scores',
          adequate: 'Neutral',
          weak: 'Automatic rejection risk - authenticity violations are serious',
        },
        howToImprove: [
          'Write in your natural voice about your real experience',
          'Balance challenges with growth and agency',
          'Don\'t exaggerate or perform your identity',
          'Be genuine - admissions officers can detect inauthenticity',
        ],
      },
    ],
  },
];

// ============================================================================
// STANFORD RED FLAGS
// ============================================================================

export const stanfordRedFlags: CollegeRedFlag[] = [
  {
    flagId: 'NO_INTELLECTUAL_VITALITY',
    flagName: 'No Intellectual Vitality',
    applicablePrompts: ['stanford_intellectual_vitality'],
    severity: 'critical',
    detection: {
      description:
        'Essay 1 shows no self-directed exploration - purely class-based or achievement-focused',
      signalPhrases: [
        'In my AP class',
        'My teacher taught me',
        'I got an A in',
        'For my research project',
        'My paper won',
        'I was assigned to',
      ],
      patterns: [
        'teacher|professor|class|course.*taught|learned',
        'assigned|required|homework|project for',
        'won|award|recognition|grade',
      ],
    },
    evidence: {
      source: 'Dean Richard Shaw',
      quote:
        'Intellectual Vitality is about the energy and depth of thought. Essays are the only way to demonstrate this - transcripts show proficiency, not vitality.',
      explanation:
        'Stanford explicitly distinguishes between academic proficiency (grades, achievements) and intellectual vitality (self-directed curiosity). Class-based learning fails to demonstrate self-direction.',
    },
    teaching: {
      problem:
        'Your essay describes learning that happened in a class or for an assignment. This shows academic proficiency, not intellectual vitality.',
      whyItMatters:
        'Dean Shaw says Stanford\'s #1 criterion is "intellectual vitality" - the energy with which you pursue learning for its OWN sake. Class-based learning doesn\'t demonstrate self-direction.',
      howToFix:
        'Rewrite to focus on something you explored INDEPENDENTLY - outside of any class, assignment, or requirement. Show the rabbit hole: what question grabbed you? What did you do to explore it on your own?',
      exampleFix:
        'Instead of: "In AP Biology, I learned about CRISPR..." → "At 2am, I couldn\'t stop reading about CRISPR. One Wikipedia article led to another, then to actual papers. I started annotating them in my notes app..."',
    },
    scoreImpact: {
      dimension: 'intellectual_vitality_energy',
      penalty: 'Caps at 69 or below - misses Stanford\'s #1 criterion',
    },
  },
  {
    flagId: 'RESUME_REHASH_ROOMMATE',
    flagName: 'Resume Rehash in Roommate Essay',
    applicablePrompts: ['stanford_roommate'],
    severity: 'critical',
    detection: {
      description: 'Roommate essay lists achievements, leadership roles, or academic accomplishments',
      signalPhrases: [
        'As president of',
        'I founded',
        'My research',
        'I led',
        'achievement',
        'award',
        'recognition',
        'GPA',
        'valedictorian',
      ],
      patterns: [
        'president|leader|founder|captain',
        'research|paper|publication',
        'award|won|recognition|honor',
      ],
    },
    evidence: {
      source: 'Multiple expert sources (Crimson Education, InGenius Prep)',
      quote: 'The worst mistake in the Roommate essay is treating it like another resume opportunity.',
      explanation:
        'The Roommate essay tests personality and likability, not accomplishments. Resume content signals misunderstanding of the prompt.',
    },
    teaching: {
      problem:
        'Your Roommate essay includes achievements and accomplishments. This prompt is about personality, not resume.',
      whyItMatters:
        'Stanford uses this essay to see if you\'d be a good roommate - likable, genuine, interesting as a PERSON. Your accomplishments are already in your activities list.',
      howToFix:
        'Remove ALL mentions of leadership, awards, research, or achievements. Replace with specific personality details: What music do you play while studying? What\'s your late-night snack? What quirky habit would your roommate notice?',
      exampleFix:
        'Instead of: "As debate team captain, I lead with..." → "Fair warning: I talk to my plants. Yes, all seven of them. Greg the fern gets the most attention..."',
    },
    scoreImpact: {
      dimension: 'personality_revealed',
      penalty: '-25 points - fundamental misunderstanding of prompt',
    },
  },
  {
    flagId: 'NO_STANFORD_SPECIFICS',
    flagName: 'No Stanford Specifics in Contribution Essay',
    applicablePrompts: ['stanford_distinctive_contribution'],
    severity: 'critical',
    detection: {
      description:
        'Distinctive Contribution essay has no specific Stanford communities/resources named',
      signalPhrases: [
        'at your university',
        'in college',
        'diverse perspective',
        'unique viewpoint',
        'bring diversity',
      ],
      patterns: [
        'university|college|school.*general',
        'diverse|diversity.*perspective.*vague',
      ],
    },
    evidence: {
      source: 'Stanford 2024-25 Essay Prompt 3',
      quote:
        'What aspects of your life experiences... might help you make a distinctive contribution as an undergraduate to Stanford?',
      explanation:
        'The prompt explicitly asks about contribution "to Stanford" - generic university language fails to meet this requirement.',
    },
    teaching: {
      problem:
        'Your essay doesn\'t name any specific Stanford communities, programs, or resources where you\'ll contribute.',
      whyItMatters:
        'The prompt explicitly asks about contribution "to Stanford." Generic university language suggests you haven\'t researched Stanford specifically.',
      howToFix:
        'Research and name 1-2 specific Stanford offerings: cultural centers, DUGs (Dorm-Based Groups), academic programs, student organizations. Explain how YOUR background connects to THESE Stanford communities.',
      exampleFix:
        'Instead of: "I\'ll bring diverse perspective to campus..." → "At Stanford\'s Asian American Activities Center (A3C), I hope to build on my experience organizing intergenerational storytelling events..."',
    },
    scoreImpact: {
      dimension: 'stanford_research_fit',
      penalty: 'Caps at 69 or below - fails prompt requirement',
    },
  },
  {
    flagId: 'CLIMATE_CHANGE_CHALLENGE',
    flagName: 'Climate Change for Significant Challenge',
    applicablePrompts: ['stanford_significant_challenge'],
    severity: 'major',
    detection: {
      description: 'Choosing "climate change" or "race relations" for Significant Challenge prompt',
      signalPhrases: [
        'climate change',
        'global warming',
        'race relations',
        'racial inequality',
        'racism',
        'systemic racism',
      ],
      patterns: ['climate.*change', 'global.*warming', 'racial.*inequality'],
    },
    evidence: {
      source: 'Ivy Coach Analysis',
      quote:
        "Don't choose climate change. Don't choose race relations. Stanford receives too many such responses.",
      explanation:
        'These topics are the most common choices, making your response generic rather than distinctive.',
    },
    teaching: {
      problem:
        'You chose one of the most common topics (climate change or race relations) for the Significant Challenge prompt.',
      whyItMatters:
        'Stanford receives thousands of essays on these exact topics. Your response won\'t stand out and suggests you took the easy path rather than thinking deeply.',
      howToFix:
        'Choose a more specific, nuanced challenge that reveals YOUR particular perspective or interests. What challenge have YOU thought deeply about that most people haven\'t?',
      exampleFix:
        'Instead of: "Climate change is the greatest challenge..." → "The death of local journalism: as community papers close, neighbors don\'t know what their city council decided last night..."',
    },
    scoreImpact: {
      dimension: 'depth_of_thought',
      penalty: '-15 points - generic, unoriginal choice',
    },
  },
  {
    flagId: 'CLASS_BASED_IV',
    flagName: 'Class-Based Intellectual Vitality',
    applicablePrompts: ['stanford_intellectual_vitality'],
    severity: 'major',
    detection: {
      description:
        'IV essay about class you took or project that got good grade (no self-direction)',
      signalPhrases: [
        'In class',
        'My teacher',
        'The assignment',
        'For my project',
        'Required reading',
        'Curriculum',
      ],
      patterns: ['class|course|assignment|project|curriculum'],
    },
    evidence: {
      source: 'Dean Richard Shaw',
      quote: 'Intellectual Vitality is about energy for learning, not achievement.',
      explanation:
        'Learning prompted by class requirements doesn\'t demonstrate self-directed curiosity.',
    },
    teaching: {
      problem:
        'Your essay focuses on learning that happened because of a class or assignment, not self-directed exploration.',
      whyItMatters:
        'Stanford\'s Intellectual Vitality criterion requires self-direction. Class-based learning shows you can follow curriculum, not that you have independent curiosity.',
      howToFix:
        'Even if a class sparked your interest, focus on what you did INDEPENDENTLY afterward. What did you explore outside of any requirement?',
    },
    scoreImpact: {
      dimension: 'intellectual_vitality_energy',
      penalty: '-12 points - misses self-direction requirement',
    },
  },
  {
    flagId: 'FORMAL_ROOMMATE_TONE',
    flagName: 'Formal Tone in Roommate Essay',
    applicablePrompts: ['stanford_roommate'],
    severity: 'major',
    detection: {
      description: 'Roommate essay sounds like admissions essay, not peer letter',
      signalPhrases: [
        'I am passionate about',
        'I believe that',
        'My experience has taught me',
        'Throughout my life',
        'I have always been',
        'henceforth',
        'furthermore',
        'moreover',
      ],
      patterns: [
        'passionate about|dedicated to|committed to',
        'throughout my|have always|since childhood',
      ],
    },
    evidence: {
      source: 'Dean Richard Shaw',
      quote: "We want to hear a 'voice'—that's a critical component.",
      explanation:
        'Formal, essay-like tone in the Roommate essay signals inauthenticity and consultant over-polishing.',
    },
    teaching: {
      problem:
        'Your Roommate essay sounds like a formal admissions essay, not a note to a peer.',
      whyItMatters:
        'Stanford uses this essay to assess your authentic voice and personality. Formal language suggests you\'re performing for admissions officers, not being genuine.',
      howToFix:
        'Rewrite as if you\'re actually texting your future roommate. Use contractions, casual language, humor. Remove anything you wouldn\'t actually say to a peer.',
    },
    scoreImpact: {
      dimension: 'authenticity_voice',
      penalty: '-10 points - fails authenticity test',
    },
  },
  {
    flagId: 'GENERIC_DIVERSITY_LANGUAGE',
    flagName: 'Generic Diversity Language',
    applicablePrompts: ['stanford_distinctive_contribution'],
    severity: 'major',
    detection: {
      description:
        'Distinctive Contribution uses vague "I\'ll bring diverse perspective" without specifics',
      signalPhrases: [
        'diverse perspective',
        'unique viewpoint',
        'different background',
        'bring diversity',
        'represent my community',
      ],
      patterns: ['diverse.*perspective|unique.*viewpoint|bring.*diversity'],
    },
    evidence: {
      source: 'Post-SCOTUS analysis',
      quote: 'Generic diversity claims don\'t meet the new standard for contribution essays.',
      explanation:
        'After the Supreme Court ruling, vague diversity language is insufficient. Specific background → specific contribution is required.',
    },
    teaching: {
      problem:
        'You use generic diversity language ("I\'ll bring a diverse perspective") without specifics.',
      whyItMatters:
        'Post-SCOTUS, essays must show SPECIFIC contribution, not vague diversity claims. "Diverse perspective" is meaningless without explaining what that perspective IS and how it helps.',
      howToFix:
        'Replace vague claims with specifics: What specific aspect of your background? What specific perspective does it give you? What specific contribution will that enable at Stanford?',
    },
    scoreImpact: {
      dimension: 'actionable_contribution',
      penalty: '-12 points - vague, unsubstantiated claims',
    },
  },
  {
    flagId: 'ACHIEVEMENT_CONFUSED_WITH_VITALITY',
    flagName: 'Achievement Confused with Vitality',
    applicablePrompts: ['stanford_intellectual_vitality'],
    severity: 'major',
    detection: {
      description:
        'IV essay focuses on outcomes (awards, grades) instead of process (thinking, questions)',
      signalPhrases: [
        'won first place',
        'published',
        'recognition',
        'award',
        'succeeded',
        'accomplished',
        'achieved',
      ],
      patterns: ['won|award|recognition|published|accomplished|achieved'],
    },
    evidence: {
      source: 'Dean Richard Shaw',
      quote: 'Intellectual Vitality is about "energy and depth of thought", not accomplishment.',
      explanation:
        'Focusing on outcomes (what you achieved) rather than process (how you think) misses the point of the IV essay.',
    },
    teaching: {
      problem:
        'Your essay emphasizes what you achieved or accomplished, not how you think or explore.',
      whyItMatters:
        'Dean Shaw defines IV as "energy and depth of thought." Achievements show proficiency; the IV essay should show the PROCESS of your curiosity.',
      howToFix:
        'Remove mentions of awards, grades, or recognition. Focus on: What questions drive you? What rabbit holes have you gone down? What are you still wondering about?',
    },
    scoreImpact: {
      dimension: 'process_over_outcome',
      penalty: '-8 points - confuses achievement with vitality',
    },
  },
  {
    flagId: 'RECYCLED_ESSAY',
    flagName: 'Recycled Essay (Not Stanford-Specific)',
    applicablePrompts: ['stanford_distinctive_contribution'],
    severity: 'major',
    detection: {
      description: 'Essays (especially Contribution) could clearly apply to any school',
      signalPhrases: [
        'your university',
        'this institution',
        'at college',
        'in higher education',
      ],
      patterns: ['your university|this institution|at college|in higher education'],
    },
    evidence: {
      source: 'Admissions logic',
      quote: 'Generic fit shows insufficient research.',
      explanation:
        'If your essay could work for any top university without changes, it doesn\'t demonstrate genuine Stanford interest.',
    },
    teaching: {
      problem:
        'Your essay could apply to almost any university - there\'s nothing Stanford-specific.',
      whyItMatters:
        'Generic essays suggest you didn\'t research Stanford specifically or don\'t have genuine interest. Admissions officers can tell when essays are recycled.',
      howToFix:
        'Add Stanford-specific content that could NOT be used for any other school. Name specific programs, communities, or aspects of Stanford culture.',
    },
    scoreImpact: {
      dimension: 'stanford_research_fit',
      penalty: '-8 points - lacks genuine Stanford fit',
    },
  },
];

// ============================================================================
// STANFORD GREEN FLAGS
// ============================================================================

export const stanfordGreenFlags: CollegeGreenFlag[] = [
  {
    flagId: 'SELF_DIRECTED_RABBIT_HOLE',
    flagName: 'Self-Directed Intellectual Rabbit Hole',
    applicablePrompts: ['stanford_intellectual_vitality'],
    strength: 'exceptional',
    detection: {
      description: 'IV essay shows genuine self-directed deep dive into topic for its own sake',
      signalPhrases: [
        'couldn\'t stop',
        'Wikipedia spiral',
        'at 2am',
        'on my own',
        'without anyone asking',
        'just because',
        'for no reason other than',
      ],
      patterns: ['couldn\'t stop|kept reading|on my own|self-taught'],
    },
    evidence: {
      source: 'Dean Richard Shaw',
      quote: 'We want to see the energy and depth of thought for anything they engage in.',
      explanation:
        'Self-directed exploration is the purest demonstration of intellectual vitality.',
    },
    teaching: {
      whatWorks:
        'You show genuine self-directed exploration - going down rabbit holes without any external requirement.',
      whyItMatters:
        'This is EXACTLY what Dean Shaw means by "intellectual vitality" - curiosity that drives you without external motivation.',
      howToEnhance:
        'Keep this energy! You could add even more specific questions you\'re still wondering about, or show how this connects to your next exploration.',
    },
    scoreImpact: {
      dimension: 'intellectual_vitality_energy',
      bonus: '+10 points - pure IV demonstration',
    },
  },
  {
    flagId: 'SPECIFIC_STANFORD_RESEARCH',
    flagName: 'Specific Stanford Research',
    applicablePrompts: ['stanford_distinctive_contribution'],
    strength: 'exceptional',
    detection: {
      description:
        'Contribution essay names 2+ specific Stanford communities/resources with understanding',
      signalPhrases: [
        'A3C',
        'El Centro',
        'BGSC',
        'CAPS',
        'd.school',
        'DUG',
        'SIG',
        'Structured Liberal Education',
      ],
      patterns: ['A3C|El Centro|BGSC|DUG|SIG|d\\.school'],
    },
    evidence: {
      source: 'Stanford admissions',
      quote: 'We want students who have genuinely researched our community.',
      explanation:
        'Naming specific Stanford programs shows genuine research and interest.',
    },
    teaching: {
      whatWorks:
        'You\'ve researched specific Stanford communities and can name them precisely.',
      whyItMatters:
        'This demonstrates genuine interest in Stanford specifically, not just any elite university.',
      howToEnhance:
        'Consider adding HOW you discovered these programs and why they resonate with your specific background.',
    },
    scoreImpact: {
      dimension: 'stanford_research_fit',
      bonus: '+8 points - genuine research evident',
    },
  },
  {
    flagId: 'AUTHENTIC_PEER_VOICE_ROOMMATE',
    flagName: 'Authentic Peer Voice in Roommate Essay',
    applicablePrompts: ['stanford_roommate'],
    strength: 'exceptional',
    detection: {
      description: 'Roommate essay feels completely natural - like actual note to peer',
      signalPhrases: [
        'Hey!',
        'So basically',
        'honestly',
        'fair warning',
        'you should know',
        'I\'m the type who',
        'don\'t worry though',
      ],
      patterns: ['hey|so basically|honestly|fair warning|you should know'],
    },
    evidence: {
      source: 'Dean Richard Shaw',
      quote: "We want to hear a 'voice'—that's a critical component.",
      explanation:
        'Authentic peer voice in Roommate essay shows genuine personality.',
    },
    teaching: {
      whatWorks:
        'Your essay sounds like a real note to a roommate - natural, warm, and genuine.',
      whyItMatters:
        'This is exactly what Stanford wants to see: your authentic personality without the formal admissions essay filter.',
      howToEnhance:
        'Great voice! Make sure you also include specific quirks or habits that make you memorable.',
    },
    scoreImpact: {
      dimension: 'authenticity_voice',
      bonus: '+8 points - authentic voice demonstrated',
    },
  },
  {
    flagId: 'QUESTIONS_WITHOUT_ANSWERS',
    flagName: 'Intellectual Questions Without Answers',
    applicablePrompts: ['stanford_intellectual_vitality'],
    strength: 'strong',
    detection: {
      description: 'IV essay includes intellectual questions you haven\'t solved yet',
      signalPhrases: [
        'I still wonder',
        'I don\'t know yet',
        'I haven\'t figured out',
        'The question that haunts me',
        'What I can\'t resolve',
      ],
      patterns: ['still wonder|don\'t know|haven\'t figured|question.*haunts'],
    },
    evidence: {
      source: 'Dean Richard Shaw',
      quote:
        'We are looking for students who are "prepared but not complete," remaining open-minded.',
      explanation:
        'Unresolved questions show intellectual humility and ongoing curiosity.',
    },
    teaching: {
      whatWorks:
        'You include questions you haven\'t answered yet - showing ongoing intellectual engagement.',
      whyItMatters:
        'Dean Shaw says Stanford wants students who are "prepared but not complete." Your unanswered questions show intellectual humility and continued curiosity.',
      howToEnhance:
        'This is great! Make sure you also show the thinking process that led to these questions.',
    },
    scoreImpact: {
      dimension: 'depth_of_thought',
      bonus: '+6 points - shows intellectual humility and ongoing curiosity',
    },
  },
  {
    flagId: 'PAST_CONTRIBUTION_PATTERN',
    flagName: 'Past Contribution Pattern',
    applicablePrompts: ['stanford_distinctive_contribution'],
    strength: 'strong',
    detection: {
      description: 'Contribution essay shows track record of similar contribution in past',
      signalPhrases: [
        'I\'ve already',
        'In my community',
        'I started',
        'I created',
        'For the past',
        'Over the years',
      ],
      patterns: ['I\'ve already|I started|I created|for the past|over.*years'],
    },
    evidence: {
      source: 'Post-SCOTUS best practices',
      quote: 'Past contribution is better than future promise.',
      explanation:
        'Showing you\'ve already contributed in similar ways proves you can deliver, not just promise.',
    },
    teaching: {
      whatWorks:
        'You show a pattern of contribution in the past, not just future promises.',
      whyItMatters:
        'Past behavior is the best predictor of future behavior. Showing you\'ve already contributed proves you can deliver.',
      howToEnhance:
        'Great! Connect your past contributions more explicitly to what you\'ll do at Stanford.',
    },
    scoreImpact: {
      dimension: 'actionable_contribution',
      bonus: '+6 points - evidence over promises',
    },
  },
  {
    flagId: 'SPECIFIC_QUIRKS_ROOMMATE',
    flagName: 'Specific Quirks in Roommate Essay',
    applicablePrompts: ['stanford_roommate'],
    strength: 'strong',
    detection: {
      description:
        'Roommate essay includes 3+ specific habits/preferences that make you memorable',
      signalPhrases: [
        'Spotify',
        'playlist',
        'midnight snack',
        '2am',
        'every morning',
        'weird habit',
        'guilty pleasure',
      ],
      patterns: ['spotify|playlist|midnight|every morning|weird habit|guilty pleasure'],
    },
    evidence: {
      source: 'Expert analysis',
      quote:
        'Best Roommate essays reveal personality through specific, memorable details.',
      explanation:
        'Specific quirks make you real and memorable, not generic.',
    },
    teaching: {
      whatWorks:
        'You include specific quirks and habits that make you memorable as a person.',
      whyItMatters:
        'Specific details show genuine personality. Generic traits ("I\'m friendly") are forgettable.',
      howToEnhance:
        'Great specificity! Make sure these details paint a consistent picture of who you are.',
    },
    scoreImpact: {
      dimension: 'personality_revealed',
      bonus: '+5 points - memorable personality details',
    },
  },
  {
    flagId: 'ENERGETIC_VOICE_IV',
    flagName: 'Energetic Voice in IV Essay',
    applicablePrompts: ['stanford_intellectual_vitality'],
    strength: 'strong',
    detection: {
      description:
        'IV essay voice conveys infectious enthusiasm - you can feel the excitement',
      signalPhrases: [
        'I love',
        'I can\'t stop',
        'fascinating',
        'blew my mind',
        'I was hooked',
        'I had to know',
      ],
      patterns: ['I love|can\'t stop|fascinating|blew my mind|I was hooked|had to know'],
    },
    evidence: {
      source: 'Dean Richard Shaw',
      quote: 'We want to see the energy...',
      explanation: '"Energy" is half of Shaw\'s IV definition.',
    },
    teaching: {
      whatWorks:
        'Your voice conveys genuine enthusiasm - readers can feel your excitement.',
      whyItMatters:
        'Dean Shaw explicitly mentions "energy" as part of intellectual vitality. Your enthusiasm is contagious.',
      howToEnhance:
        'Great energy! Make sure you also show depth of thought alongside the enthusiasm.',
    },
    scoreImpact: {
      dimension: 'authentic_enthusiasm',
      bonus: '+5 points - energy is half of IV',
    },
  },
];

// ============================================================================
// STANFORD KEY QUOTES
// ============================================================================

export const stanfordKeyQuotes: CollegeKeyQuote[] = [
  {
    quoteId: 'shaw_intellectual_vitality_definition',
    source: {
      name: 'Dean Richard Shaw',
      title: 'Dean of Admission and Financial Aid',
      publication: 'Stanford Magazine',
    },
    quote:
      "We use the term 'intellectual vitality.' But it's vitality for anything they engage in... We want to see the energy and depth of thought... We want to hear a 'voice'—that's a critical component.",
    context: 'Interview on Stanford admissions priorities and what they look for in applicants',
    insight:
      'This is Stanford\'s #1 criterion. IV is about ENERGY for learning, not just achievement. Essays are the only place to demonstrate this - transcripts show proficiency, not vitality.',
    useCases: [
      { dimension: 'intellectual_vitality_energy' },
      { issue: 'class_based_learning' },
      { flag: 'NO_INTELLECTUAL_VITALITY' },
    ],
    teachingApplication:
      'Cite this quote when explaining why class-based learning doesn\'t meet Stanford\'s standard, or when encouraging students to show the "energy" of their curiosity.',
  },
  {
    quoteId: 'shaw_prepared_not_complete',
    source: {
      name: 'Dean Richard Shaw',
      title: 'Dean of Admission and Financial Aid',
    },
    quote:
      'The mistake is to think that we\'re looking for a specific profile... We are looking for students who are "prepared but not complete," remaining open-minded.',
    context: 'Explaining the ideal Stanford applicant mindset',
    insight:
      'Stanford doesn\'t want polished professionals. They want students with intellectual hunger, questions without answers, and room to grow.',
    useCases: [
      { dimension: 'depth_of_thought' },
      { flag: 'QUESTIONS_WITHOUT_ANSWERS' },
    ],
    teachingApplication:
      'Use this quote when encouraging students to show vulnerability, unanswered questions, and intellectual humility rather than presenting as a "finished product."',
  },
  {
    quoteId: 'shaw_voice_critical',
    source: {
      name: 'Dean Richard Shaw',
      title: 'Dean of Admission and Financial Aid',
    },
    quote: "We want to hear a 'voice'—that's a critical component.",
    context: 'Discussing what makes essays effective',
    insight:
      'Voice is not optional - it\'s "critical." Essays that sound consultant-polished or generic fail this requirement.',
    useCases: [
      { dimension: 'authenticity_voice' },
      { flag: 'FORMAL_ROOMMATE_TONE' },
      { issue: 'consultant_voice' },
    ],
    teachingApplication:
      'Cite when explaining why formal or over-polished language hurts the essay, especially for the Roommate prompt.',
  },
  {
    quoteId: 'ivy_coach_climate_warning',
    source: {
      name: 'Ivy Coach',
      title: 'Admissions Consulting Analysis',
    },
    quote:
      "Don't choose climate change. Don't choose race relations. Stanford receives too many such responses.",
    context: 'Analysis of the Significant Challenge short answer prompt',
    insight:
      'The most common topics are the worst choices. Stanford wants to see distinctive thinking, not the same answer 1000 other applicants gave.',
    useCases: [
      { flag: 'CLIMATE_CHANGE_CHALLENGE' },
      { dimension: 'depth_of_thought' },
    ],
    teachingApplication:
      'Use when guiding students away from generic challenge topics toward more specific, nuanced choices.',
  },
  {
    quoteId: 'cds_character_importance',
    source: {
      name: 'Common Data Set 2023-24',
      title: 'Section C7',
    },
    quote: 'Character/Personal Qualities: Very Important',
    context: 'Stanford\'s official importance ratings for admissions factors',
    insight:
      'Character is weighted equally to GPA, test scores, and rigor. Essays are the primary vehicle for character assessment.',
    useCases: [
      { dimension: 'social_fit_likability' },
      { dimension: 'self_awareness_humor' },
    ],
    teachingApplication:
      'Cite when explaining why the Roommate essay matters - it\'s Stanford\'s primary character assessment tool.',
  },
];

// ============================================================================
// STANFORD DIMENSION WEIGHTS
// ============================================================================

export const stanfordDimensionWeights: CollegeDimensionWeights = {
  dimensions: [
    {
      dimensionId: 'intellectual_vitality',
      dimensionName: 'Intellectual Vitality',
      weight: 20,
      context: 'Dean Shaw\'s #1 criterion - essays are the only way to demonstrate IV',
      evidence: 'Shaw: "Intellectual vitality... the energy and depth of thought"',
    },
    {
      dimensionId: 'authenticity_voice',
      dimensionName: 'Authenticity & Voice',
      weight: 15,
      context: '"We want to hear a voice" - authentic voice is threshold requirement',
      evidence: 'Shaw explicitly emphasizes voice as "critical component"',
    },
    {
      dimensionId: 'depth_of_thought',
      dimensionName: 'Depth of Thought',
      weight: 12,
      context: 'Shaw\'s "depth of thought" - goes beyond surface-level interest',
    },
    {
      dimensionId: 'specificity',
      dimensionName: 'Specificity',
      weight: 10,
      context: 'Specific details prove authentic engagement',
    },
    {
      dimensionId: 'stanford_fit',
      dimensionName: 'Stanford Fit',
      weight: 10,
      context: 'Required for Contribution essay - must name specific Stanford offerings',
    },
    {
      dimensionId: 'personality_revealed',
      dimensionName: 'Personality Revealed',
      weight: 8,
      context: 'Critical for Roommate essay - specific quirks, not generic traits',
    },
    {
      dimensionId: 'growth_reflection',
      dimensionName: 'Growth & Reflection',
      weight: 6,
      context: '"Prepared but not complete" - show intellectual humility',
    },
    {
      dimensionId: 'contribution_impact',
      dimensionName: 'Contribution & Impact',
      weight: 6,
      context: 'Post-SCOTUS requirement - actionable contribution, not vague claims',
    },
    {
      dimensionId: 'opening_hook',
      dimensionName: 'Opening Hook',
      weight: 4,
      context: 'Captures attention in word-limited essays',
    },
    {
      dimensionId: 'narrative_arc',
      dimensionName: 'Narrative Arc',
      weight: 3,
      context: 'Less critical for short Stanford essays',
    },
    {
      dimensionId: 'conclusion',
      dimensionName: 'Conclusion',
      weight: 3,
      context: 'Less weight in 100-250 word format',
    },
    {
      dimensionId: 'grammar_style',
      dimensionName: 'Grammar & Style',
      weight: 3,
      context: 'Baseline competency expected',
    },
  ],
  primaryDimensions: ['intellectual_vitality', 'authenticity_voice', 'depth_of_thought'],
  secondaryDimensions: ['narrative_arc', 'conclusion', 'grammar_style'],
};

// ============================================================================
// STANFORD SOCRATIC QUESTIONS
// ============================================================================

export const stanfordSocraticQuestions: CollegeSocraticQuestionBank = {
  byPurpose: {
    deepening: [
      {
        questionId: 'sq_iv_deepen_1',
        question:
          'What question about this topic has been keeping you up at night? What\'s the thing you still haven\'t figured out?',
        trigger: { dimension: 'depth_of_thought' },
        purpose: 'Surface unanswered questions to show intellectual humility',
        expectedOutcome:
          'Student articulates specific questions they\'re still wrestling with',
        exampleGoodResponse:
          'I still can\'t reconcile how we can encode "fairness" when different cultures define it differently...',
      },
      {
        questionId: 'sq_iv_deepen_2',
        question:
          'When you started exploring this, what did you think you knew? How has your thinking evolved since then?',
        trigger: { dimension: 'depth_of_thought' },
        purpose: 'Show evolution of thinking, not static interest',
        expectedOutcome: 'Student describes how their understanding deepened over time',
      },
      {
        questionId: 'sq_iv_deepen_3',
        question:
          'Take me down the rabbit hole. What was the first thing that grabbed your attention, and where did it lead you?',
        trigger: { flagDetected: 'CLASS_BASED_IV' },
        purpose: 'Elicit self-directed exploration narrative',
        expectedOutcome: 'Student describes independent exploration journey',
      },
    ],
    specificity: [
      {
        questionId: 'sq_roommate_specific_1',
        question:
          'What\'s something your current friends would say is "so you" - a specific habit or quirk they\'d immediately recognize?',
        trigger: { dimension: 'personality_revealed' },
        purpose: 'Elicit specific personality details for Roommate essay',
        expectedOutcome: 'Student identifies memorable, specific personal traits',
      },
      {
        questionId: 'sq_roommate_specific_2',
        question:
          'If your roommate walked in at 11pm on a random Tuesday, what would they most likely find you doing?',
        trigger: { dimension: 'personality_revealed' },
        purpose: 'Ground personality in specific, observable behavior',
        expectedOutcome: 'Concrete daily-life detail that reveals personality',
      },
    ],
    connection: [
      {
        questionId: 'sq_contribution_connect_1',
        question:
          'What specific Stanford community, program, or resource did you discover that made you think "this is where I belong"?',
        trigger: { flagDetected: 'NO_STANFORD_SPECIFICS' },
        purpose: 'Prompt Stanford-specific research',
        expectedOutcome: 'Student names specific Stanford offerings',
      },
      {
        questionId: 'sq_contribution_connect_2',
        question:
          'When you think about your background meeting Stanford\'s community, what gap do you see that you could help fill?',
        trigger: { dimension: 'actionable_contribution' },
        purpose: 'Clarify specific contribution',
        expectedOutcome: 'Student articulates tangible contribution',
      },
    ],
    voice: [
      {
        questionId: 'sq_voice_1',
        question:
          'If you were explaining this to your best friend over coffee, how would you actually say it? No formal language - just you.',
        trigger: { flagDetected: 'FORMAL_ROOMMATE_TONE' },
        purpose: 'Unlock authentic voice',
        expectedOutcome: 'More natural, conversational language',
      },
      {
        questionId: 'sq_voice_2',
        question:
          'Read your essay out loud. Does it sound like you talking, or like someone you wouldn\'t recognize?',
        trigger: { dimension: 'authenticity_voice' },
        purpose: 'Self-assessment of voice authenticity',
        expectedOutcome: 'Student identifies where voice feels forced',
      },
    ],
    vulnerability: [
      {
        questionId: 'sq_vulnerability_1',
        question:
          'What\'s something about this experience or interest that you wouldn\'t normally share in an admissions essay?',
        trigger: { dimension: 'authenticity_voice' },
        purpose: 'Encourage appropriate vulnerability',
        expectedOutcome: 'Deeper, more genuine reflection',
      },
      {
        questionId: 'sq_vulnerability_2',
        question:
          'Where in this story did you feel most uncertain, confused, or even a little scared? That might be the most interesting part.',
        trigger: { dimension: 'growth_reflection' },
        purpose: 'Surface moments of genuine challenge',
        expectedOutcome: 'More honest, vulnerable narrative',
      },
    ],
  },
  byPrompt: {
    stanford_intellectual_vitality: [
      {
        questionId: 'sq_iv_prompt_1',
        question:
          'Forget what sounds impressive. What topic could you talk about for an hour without getting bored?',
        trigger: { issue: 'topic_selection' },
        purpose: 'Help identify genuine intellectual passion',
        expectedOutcome: 'Topic with authentic enthusiasm',
      },
      {
        questionId: 'sq_iv_prompt_2',
        question:
          'When did you last go down a rabbit hole - reading, watching, learning - without anyone asking you to?',
        trigger: { flagDetected: 'CLASS_BASED_IV' },
        purpose: 'Identify self-directed exploration',
        expectedOutcome: 'Example of independent curiosity',
      },
    ],
    stanford_roommate: [
      {
        questionId: 'sq_roommate_prompt_1',
        question:
          'What would be the first thing you\'d want your roommate to know about living with you - good or bad?',
        trigger: { issue: 'topic_selection' },
        purpose: 'Elicit honest, practical roommate information',
        expectedOutcome: 'Genuine personal detail',
      },
    ],
    stanford_distinctive_contribution: [
      {
        questionId: 'sq_contribution_prompt_1',
        question:
          'What have you already done in your community that you want to continue at Stanford? What would you build on?',
        trigger: { issue: 'vague_contribution' },
        purpose: 'Ground contribution in past action',
        expectedOutcome: 'Evidence of past contribution pattern',
      },
    ],
  },
  byIssue: {
    lacks_self_direction: [
      {
        questionId: 'sq_issue_direction_1',
        question:
          'Even if a class sparked this interest, what did you do ON YOUR OWN afterward? Weekend projects? Extra reading? Experiments?',
        trigger: { flagDetected: 'CLASS_BASED_IV' },
        purpose: 'Find self-directed elements even in class-sparked interest',
        expectedOutcome: 'Examples of independent exploration',
      },
    ],
    too_formal: [
      {
        questionId: 'sq_issue_formal_1',
        question:
          'Pretend you\'re texting this to your actual roommate from high school. How would you say it?',
        trigger: { flagDetected: 'FORMAL_ROOMMATE_TONE' },
        purpose: 'Unlock casual, authentic voice',
        expectedOutcome: 'More natural language',
      },
    ],
    generic_diversity: [
      {
        questionId: 'sq_issue_diversity_1',
        question:
          'What\'s ONE specific experience from your background that changed how you see something? Tell me that story.',
        trigger: { flagDetected: 'GENERIC_DIVERSITY_LANGUAGE' },
        purpose: 'Replace generic claims with specific story',
        expectedOutcome: 'Concrete narrative grounding abstract claims',
      },
    ],
  },
};

// ============================================================================
// STANFORD ELITE EXAMPLES (Placeholder - to be populated with actual examples)
// ============================================================================

export const stanfordEliteExamples: CollegeEliteExample[] = [
  // Note: These would be populated with actual elite essay examples
  // with full text, annotations, and teachable techniques
];

// ============================================================================
// COMPLETE STANFORD RESEARCH EXPORT
// ============================================================================

export const stanfordResearch: CollegeResearch = {
  collegeId: 'stanford',
  collegeName: 'Stanford University',
  researchQuality: {
    score: 89,
    totalSources: 43,
    lastUpdated: '2024-11-15',
    keyInstitutionalSources: [
      'Common Data Set 2023-24 (CDS Section C7)',
      'Dean Richard Shaw (Dean of Admission and Financial Aid)',
      'Stanford Magazine',
      'Stanford Daily',
    ],
  },
  coreValues: stanfordCoreValues,
  essayPrompts: stanfordEssayPrompts,
  redFlags: stanfordRedFlags,
  greenFlags: stanfordGreenFlags,
  socraticQuestions: stanfordSocraticQuestions,
  eliteExamples: stanfordEliteExamples,
  keyQuotes: stanfordKeyQuotes,
  dimensionWeights: stanfordDimensionWeights,
};
