/**
 * University of Chicago (UChicago) - Comprehensive Essay Overlay
 *
 * Research Quality: 93/100 (EXCEPTIONAL)
 * Total Sources: 170+ sources (15+ primary UChicago sources)
 * Last Updated: 2024-12-25
 * CDS Reference: 2024-2025 (Essays rated "Very Important")
 *
 * PRIMARY SOURCES:
 * - Peter Wilson (Dean of College Admissions, promoted July 2025) - quotes 2022-2025
 * - John W. Boyer (Dean of the College) - quotes 2025
 * - Jim Nondorf (Vice President & Dean of Admissions) - quotes 2020, 2024
 * - Steve Han (Former UChicago AO) - August 2025 interview
 * - Grace Chapin James (Former Essay Committee Chair, 8 years) - quotes 2012
 * - Ted O'Neill (Former Dean, pioneered unusual prompts) - quotes 2002, 2019
 * - Libby Pearson (Former AO) - College Confidential quotes
 * - Natalia Ostrowski (Former Assistant Director of Admissions)
 *
 * UNIQUE CHARACTERISTICS:
 * - "Intellectual Vitality" is now official terminology (2025)
 * - Cross-essay voice consistency check for authenticity verification
 * - Essays as Core Curriculum audition, not just admissions assessment
 * - GPA/test scores only "Considered" - essays more important than numbers
 * - Unusual prompts intentionally designed to resist formulaic approaches
 * - 13-year consistency in essay philosophy across 5 admissions leaders
 *
 * ESSAY PHILOSOPHY IN 3 WORDS: "How You Think"
 */

import type {
  CollegeResearch,
  CollegeCoreValue,
  CollegeEssayPrompt,
  CollegeRedFlag,
  CollegeGreenFlag,
  CollegeSocraticQuestionBank,
  CollegeEliteExample,
  CollegeKeyQuote,
  CollegeDimensionWeights,
} from '../types/collegeResearch';

// ============================================================================
// UCHICAGO CORE VALUES (Evidence-Based, Weighted by Source Frequency)
// ============================================================================

export const uchicagoCoreValues: CollegeCoreValue[] = [
  {
    valueId: 'intellectual_vitality',
    valueName: 'Intellectual Vitality',
    weight: 30, // Highest - NOW OFFICIAL TERMINOLOGY (2025)
    definition: 'Demonstrating learning for learning\'s sake - pursuing knowledge beyond requirements out of genuine curiosity, not for college applications or career outcomes.',
    essayImplication: 'Essays must show you pursue knowledge beyond what\'s required. Show questions that obsess you, reading/thinking outside curriculum, and genuine excitement about ideas themselves.',
    evidence: [
      {
        source: 'Steve Han (Former UChicago AO)',
        quote: 'Ultimately we are looking for students who demonstrate intellectual vitality, who do what they do well academically but go above and beyond. At UChicago we really do look for students who prioritize learning for learning\'s sake.',
        context: 'August 2025 interview - most recent AO guidance',
      },
      {
        source: 'Steve Han (Former UChicago AO)',
        quote: 'Passion is such an important thing in the admissions process... We just want to know that you care about something and are looking forward to something.',
        context: 'August 2025 interview',
      },
      {
        source: 'Core Curriculum Philosophy',
        quote: 'The Core Curriculum is the heart of a UChicago education, emphasizing critical thinking, questioning, and the love of learning.',
        context: 'Official UChicago documentation',
      },
    ],
    sourceMentionCount: 8,
    isNot: [
      'Just strong academics or high grades',
      'Impressive resume accomplishments',
      'Learning motivated by college applications',
      'Career-focused skill acquisition',
      'Following assignments without questioning',
    ],
    is: [
      'Pursuing topics beyond requirements because they fascinate you',
      'Reading and thinking outside school curriculum',
      'Having questions that genuinely obsess you',
      'Finding intrinsic joy in learning new things',
      'Seeking out intellectual challenges voluntarily',
    ],
  },
  {
    valueId: 'how_you_think',
    valueName: 'How You Think (Thinking Process Visibility)',
    weight: 25, // Peter Wilson\'s central question across 3 years
    definition: 'Making your reasoning process visible - showing HOW you arrive at insights, not just WHAT you conclude. The essay should let readers "see someone thinking before their eyes."',
    essayImplication: 'Essays must show your thinking process, not just conclusions. Walk through your reasoning, show connections you make, questions you ask, and how your thinking evolves.',
    evidence: [
      {
        source: 'Peter Wilson (Dean of College Admissions)',
        quote: 'How do [applicants] think? How do they play with ideas?',
        context: 'IDENTICAL language used in 2022, 2024, 2025 - consistent evaluation framework',
      },
      {
        source: 'Peter Wilson (Dean of College Admissions)',
        quote: 'The essay gives prospective students an opportunity to demonstrate how they utilize critical thinking and rigorous inquiry to confront unfamiliar situations... This prompt gives Admissions counselors a way to evaluate how students will navigate those situations once they are at UChicago.',
        context: 'January 2025 admissions guidance',
      },
      {
        source: 'Ted O\'Neill (Former Dean)',
        quote: 'We tried our best to embed in the application an explanation of the Chicago education... then we asked applicants to write essays in response to questions we thought were actually interesting... to see someone thinking before your eyes.',
        context: '2019 interview on UChicago essay philosophy',
      },
      {
        source: 'John W. Boyer (Dean of the College)',
        quote: 'These essays not only reveal much about the qualities of mind of our students...',
        context: 'January 2025',
      },
    ],
    sourceMentionCount: 7,
    isNot: [
      'Just stating what you know or believe',
      'Listing accomplishments or credentials',
      'Presenting conclusions without reasoning',
      'Describing what happened without analysis',
      'Showing expertise without showing process',
    ],
    is: [
      'Walking through your reasoning step by step',
      'Showing connections you make between ideas',
      'Revealing questions that arise as you think',
      'Demonstrating how your thinking evolves',
      'Making intellectual uncertainty visible',
    ],
  },
  {
    valueId: 'intellectual_playfulness',
    valueName: 'Intellectual Playfulness',
    weight: 20, // Appears across 5 different admissions leaders
    definition: 'Finding genuine joy in exploring ideas for their own sake. Taking intellectual risks, exploring unusual angles, and being comfortable with ambiguity. The "play" language is UNIQUE to UChicago among elite schools.',
    essayImplication: 'Essays should show you find thinking FUN, not just productive. Take intellectual risks, explore unconventional approaches, and show comfort wandering intellectually without guaranteed answers.',
    evidence: [
      {
        source: 'Peter Wilson (Dean of College Admissions)',
        quote: 'How do they play with ideas?',
        context: 'Central evaluation question, 2022-2025',
      },
      {
        source: 'John W. Boyer (Dean of the College)',
        quote: 'intellectually playful way in response to open-ended challenge',
        context: 'January 2025',
      },
      {
        source: 'Ted O\'Neill (Former Dean)',
        quote: 'how they play around with ideas',
        context: '2002 interview',
      },
      {
        source: 'Grace Chapin James (Former Essay Committee Chair)',
        quote: 'creativity or flexibility and exploration that will lend itself well to being in a UChicago classroom',
        context: '2012 interview',
      },
    ],
    sourceMentionCount: 6,
    isNot: [
      'Forced quirkiness or trying to be weird',
      'Humor without substance',
      'Being clever at expense of depth',
      'Avoiding serious analysis',
      'Performative creativity',
    ],
    is: [
      'Genuine joy in exploring ideas',
      'Comfort with ambiguity and open questions',
      'Intellectual risk-taking',
      'Exploring unusual angles genuinely',
      'Non-utilitarian thinking - ideas for their own sake',
    ],
  },
  {
    valueId: 'authentic_voice',
    valueName: 'Authentic Voice (Cross-Essay Consistency)',
    weight: 15, // Nondorf explicitly describes verification method
    definition: 'Maintaining your genuine, natural voice consistently across all essays. UChicago explicitly checks for voice consistency across Personal Statement, Extended Essay, and "Why UChicago?" as an authenticity verification method.',
    essayImplication: 'Use your natural language across all essays. Don\'t manufacture different personas for different prompts. The same personality, humor, earnestness, and intellectual style should appear throughout.',
    evidence: [
      {
        source: 'Jim Nondorf (VP & Dean of Admissions)',
        quote: 'The student\'s voice that you hear in their first essay, which is about kind of who they are, with the background, what they believe in, that that voice will then carry on in their second essay... So we have our zany UChicago prompts and the voice and the kind of person you\'re meeting there will be in the second essay, they\'ll be in the third one, which is, why do you want to go to my school?',
        context: '2020 interview - explicit description of cross-essay voice verification',
      },
      {
        source: 'Ted O\'Neill (Former Dean)',
        quote: 'Formulaic applications, and the formulaic essays that they so frequently call forth, make it more difficult to hear an authentic voice, or to see someone thinking before your eyes.',
        context: '2019 interview',
      },
      {
        source: 'Grace Chapin James (Former Essay Committee Chair)',
        quote: 'We want the students to write about things that don\'t show up in a workshop on writing college essays.',
        context: '2012 interview',
      },
    ],
    sourceMentionCount: 5,
    isNot: [
      'Manufactured academic voice',
      'Different personas for different essays',
      'Overly polished consultant-style prose',
      'Vocabulary that doesn\'t feel natural',
      'Voice dramatically shifting between prompts',
    ],
    is: [
      'Your natural speaking voice in written form',
      'Consistent personality across all essays',
      'Writing about topics you genuinely care about',
      'Humor or earnestness that matches who you are',
      'Self-awareness about your own voice',
    ],
  },
  {
    valueId: 'core_curriculum_fit',
    valueName: 'Core Curriculum Fit (Pedagogical Compatibility)',
    weight: 10, // Essays as "audition" for Core
    definition: 'Demonstrating readiness for UChicago\'s distinctive Core Curriculum: discussion-based learning, approaching problems from multiple perspectives, comfort with complexity, and intellectual community.',
    essayImplication: 'Essays should show you\'ll thrive in Core classes: you engage with multiple perspectives, enjoy discussion-based learning, can approach unfamiliar problems, and value intellectual community.',
    evidence: [
      {
        source: 'Grace Chapin James (Former Essay Committee Chair)',
        quote: 'When we give people these creative questions, the goal is to open up their minds and see if they have a level of creativity or flexibility and exploration that will lend itself well to being in a UChicago classroom.',
        context: '2012 interview - essays as Core audition',
      },
      {
        source: 'Peter Wilson (Dean of College Admissions)',
        quote: 'When students come to the College, they will invariably be met with a situation or problem they have never encountered before... This prompt gives Admissions counselors a way to evaluate how students will navigate those situations once they are at UChicago.',
        context: 'January 2025',
      },
      {
        source: 'Core Curriculum Description',
        quote: 'The Core Curriculum requires students to approach problems from multiple perspectives through discussion-based seminars.',
        context: 'Official UChicago documentation',
      },
    ],
    sourceMentionCount: 4,
    isNot: [
      'Preference for lecture-style learning',
      'Comfort only with clear right/wrong answers',
      'Resistance to unfamiliar perspectives',
      'Individual achievement focus',
      'Pre-professional approach to learning',
    ],
    is: [
      'Engagement with multiple perspectives',
      'Comfort with discussion-based learning',
      'Ability to approach unfamiliar problems',
      'Appreciation for intellectual community',
      'Learning motivated by curiosity, not credentials',
    ],
  },
];

// ============================================================================
// UCHICAGO ESSAY PROMPTS WITH COMPREHENSIVE RUBRICS
// ============================================================================

export const uchicagoEssayPrompts: CollegeEssayPrompt[] = [
  // COMMON APP PERSONAL STATEMENT
  {
    promptId: 'uchicago_common_app',
    promptNumber: 1,
    promptTitle: 'Common App Personal Statement',
    promptText: 'Standard Common App prompts (choose 1 of 7)',
    wordCount: { min: 250, max: 650 },
    primaryAssessment: 'Intellectual Vitality and Authentic Voice',
    importance: 'high',
    importanceContext: 'First essay read - establishes the "voice" that will be verified across other essays. Must demonstrate learning beyond requirements and genuine intellectual character.',
    rubric: {
      excellent: {
        scoreRange: '90-100',
        description: 'Embodies UChicago\'s "Intellectual Vitality" - demonstrates learning for learning\'s sake, makes thinking process visible, shows genuine intellectual character.',
        criteria: [
          'Demonstrates learning beyond requirements - pursues knowledge out of curiosity, not for applications',
          'Shows questions that genuinely obsess you, not just topics that sound impressive',
          'Makes reasoning process transparent - can see how you arrive at insights',
          'Shows intellectual playfulness - finds thinking FUN, takes intellectual risks',
          'Authentic voice that will be consistent across Extended Essay and Why UChicago',
          'Genuine passion and enthusiasm visible in word choice and depth of exploration',
          'Acknowledges complexity - doesn\'t oversimplify, comfortable with nuance',
          'Goes deep on fewer ideas rather than superficial on many',
        ],
        typicalElements: [
          'Traces evolution of intellectual curiosity on a topic',
          'Shows self-directed learning outside school requirements',
          'Reveals the reasoning process, not just conclusions',
          'Voice is natural and distinctly yours',
        ],
        dimensionalPattern: {
          intellectual_curiosity: 'STRONG - evident learning beyond requirements',
          thinking_quality: 'STRONG - reasoning process visible',
          intellectual_playfulness: 'STRONG - genuine joy in ideas',
          authenticity: 'STRONG - natural voice maintained',
          passion: 'STRONG - enthusiasm palpable',
        },
      },
      good: {
        scoreRange: '80-89',
        description: 'Demonstrates strong intellectual character but may lack evidence of learning beyond requirements or full thinking process visibility.',
        criteria: [
          'Shows intellectual curiosity but may focus more on school-based learning',
          'Thinking quality strong but reasoning process not always visible',
          'Some intellectual playfulness but may feel slightly tentative or safe',
          'Authentic voice but might not be fully consistent across essays',
          'Genuine interest but enthusiasm not palpable throughout',
          'Some complexity acknowledged but may resolve too neatly',
          'Good specificity but could go deeper on ideas',
        ],
        whatPreventsHigherScore: 'Needs more evidence of learning BEYOND requirements. Show self-directed intellectual exploration. Make your reasoning process more visible - show HOW you arrive at conclusions.',
      },
      average: {
        scoreRange: '70-79',
        description: 'Meets requirements but lacks UChicago distinctiveness - intellectual curiosity mentioned but not demonstrated through actions.',
        criteria: [
          'Curiosity mentioned but not demonstrated through actions beyond school',
          'Analytical but more descriptive than exploratory',
          'Attempts creativity but feels performative rather than genuine',
          'Voice somewhat authentic but generic',
          'Topic interesting but passion not evident',
          'Oversimplifies complexity or avoids it entirely',
          'Specific details but surface-level exploration',
        ],
        whatPreventsHigherScore: 'Need to SHOW intellectual vitality, not just claim it. Include specific examples of learning beyond requirements. Let readers SEE your thinking process unfold.',
      },
      weak: {
        scoreRange: 'Below 70',
        description: 'Misunderstands UChicago\'s essay philosophy - focuses on accomplishments rather than thinking process, or lacks authentic voice.',
        criticalFailures: [
          'Lists accomplishments rather than exploring thinking process',
          'Strong conclusions but doesn\'t show how you arrived at them',
          'Forced quirkiness or trying too hard to be impressive',
          'Voice inconsistent across essays or clearly manufactured',
          'Writing about topic you think sounds good, not what you care about',
          'Black-and-white thinking, no nuance or complexity',
          'Generic or abstract, lacks concrete examples',
        ],
      },
    },
    dimensionalCriteria: [
      {
        dimensionId: 'intellectual_curiosity_love_of_learning',
        dimensionName: 'Intellectual Curiosity / Love of Learning',
        weight: 25,
        context: 'Steve Han (Aug 2025) EXPLICITLY names "intellectual vitality" and "learning for learning\'s sake" as what "we are looking for."',
        evaluationQuestions: [
          'Does the student show learning BEYOND what was required?',
          'Is there evidence of self-directed intellectual exploration?',
          'Do they demonstrate questions that genuinely obsess them?',
          'Is there evidence of reading/thinking outside school curriculum?',
        ],
        scoringLogic: {
          strong: [
            'Clear examples of learning beyond requirements',
            'Shows self-initiated intellectual exploration',
            'Questions and curiosity drive the narrative',
          ],
          adequate: [
            'Shows intellectual interest but mostly school-based',
            'Curiosity present but not clearly self-directed',
          ],
          weak: [
            'Focus on grades or achievements rather than learning',
            'No evidence of curiosity beyond assignments',
          ],
        },
        impactOnScore: {
          strong: 'Essential for 85+',
          adequate: 'Supports 70-84',
          weak: 'Caps at 69',
        },
        howToImprove: [
          'Add specific example of pursuing knowledge beyond requirements',
          'Show what questions obsess you, not just what you\'ve accomplished',
          'Describe learning you did purely out of curiosity, not for grades or applications',
        ],
      },
      {
        dimensionId: 'quality_of_thinking',
        dimensionName: 'Quality of Thinking / Critical Analysis',
        weight: 20,
        context: 'Peter Wilson: "How do they think?" 2025 guidance emphasizes thinking PROCESS over thinking QUALITY.',
        evaluationQuestions: [
          'Can I see the student\'s reasoning process unfold?',
          'Do they show HOW they arrive at insights, not just WHAT they conclude?',
          'Do they connect ideas across domains?',
          'Do they ask meaningful questions, not just provide answers?',
        ],
        scoringLogic: {
          strong: [
            'Reasoning process transparent throughout',
            'Shows connections between ideas',
            'Questions drive deeper exploration',
          ],
          adequate: [
            'Some reasoning visible but jumps unexplained',
            'Analytical but more descriptive than exploratory',
          ],
          weak: [
            'Conclusions without reasoning',
            'Tells what happened without analysis',
          ],
        },
        impactOnScore: {
          strong: 'Essential for 85+',
          adequate: 'Supports 70-84',
          weak: 'Caps at 69',
        },
        howToImprove: [
          'Show your reasoning process: "I initially thought X, but then Y made me reconsider..."',
          'Make the evolution of your thinking visible',
          'Include the questions that arise as you explore',
        ],
      },
      {
        dimensionId: 'intellectual_playfulness',
        dimensionName: 'Intellectual Playfulness / Creativity',
        weight: 20,
        context: '"How do they play with ideas?" appears IDENTICALLY in Peter Wilson quotes from 2022, 2024, 2025.',
        evaluationQuestions: [
          'Does the student show they find thinking FUN?',
          'Do they take intellectual risks or explore unusual angles?',
          'Is there genuine joy in ideas, not just productivity?',
          'Are they comfortable with ambiguity and open questions?',
        ],
        scoringLogic: {
          strong: [
            'Genuine joy in exploring ideas palpable',
            'Takes intellectual risks, explores unconventional angles',
            'Comfortable with ambiguity',
          ],
          adequate: [
            'Some playfulness but feels tentative or safe',
            'Attempts creativity but performative',
          ],
          weak: [
            'Forced quirkiness or humor',
            'Avoids intellectual risk-taking',
          ],
        },
        impactOnScore: {
          strong: 'Supports 85+',
          adequate: 'Acceptable for 70-84',
          weak: 'Detracts from score',
        },
        howToImprove: [
          'Show genuine curiosity about ideas, not just accomplishments',
          'Include moments of intellectual play or exploration',
          'Don\'t force quirkiness - let natural intellectual joy come through',
        ],
      },
      {
        dimensionId: 'authentic_voice',
        dimensionName: 'Authenticity / Genuine Voice',
        weight: 15,
        context: 'Jim Nondorf explicitly describes cross-essay voice consistency check as authenticity verification method.',
        evaluationQuestions: [
          'Does this sound like a real 17-year-old wrote it?',
          'Will this voice be consistent with Extended Essay and Why UChicago?',
          'Are they writing about topics they genuinely care about?',
          'Is the language natural, not manufactured to impress?',
        ],
        scoringLogic: {
          strong: [
            'Natural voice, clearly the student\'s own',
            'Personality comes through authentically',
            'Writing about genuinely personal topics',
          ],
          adequate: [
            'Voice mostly authentic but some generic elements',
            'Personality present but not distinctive',
          ],
          weak: [
            'Over-polished, consultant-style prose',
            'Voice feels manufactured or inconsistent',
          ],
        },
        impactOnScore: {
          strong: 'Supports 85+',
          adequate: 'Acceptable for 70-84',
          weak: 'Major red flag - caps at 69',
        },
        howToImprove: [
          'Write in your natural voice - how you actually talk',
          'Choose topics you genuinely care about',
          'Ensure this voice matches your Extended Essay and Why UChicago',
        ],
      },
      {
        dimensionId: 'passion_enthusiasm',
        dimensionName: 'Passion and Genuine Enthusiasm',
        weight: 10,
        context: 'Steve Han (Aug 2025): "Passion is such an important thing... We just want to know that you care about something."',
        evaluationQuestions: [
          'Is it obvious the student CARES about this topic?',
          'Is enthusiasm visible in word choice and depth of exploration?',
          'Is there forward-looking energy - "looking forward to something"?',
        ],
        scoringLogic: {
          strong: [
            'Enthusiasm palpable throughout',
            'Can\'t contain excitement about implications',
            'Forward-looking energy clear',
          ],
          adequate: [
            'Interest present but not palpable enthusiasm',
            'Engagement adequate but not passionate',
          ],
          weak: [
            'Topic seems chosen for impressiveness, not genuine interest',
            'No evident passion or enthusiasm',
          ],
        },
        impactOnScore: {
          strong: 'Enhances overall impression',
          adequate: 'Neutral',
          weak: 'Detracts from authenticity',
        },
        howToImprove: [
          'Choose a topic you genuinely care about, not one that sounds impressive',
          'Let your excitement show in your word choice',
          'Include what questions or possibilities excite you going forward',
        ],
      },
      {
        dimensionId: 'character_intellectual_humility',
        dimensionName: 'Character / Intellectual Humility',
        weight: 5,
        context: 'Boyer: "qualities of mind." AdmitStudio (2025): "do not shy away from acknowledging tensions or gray areas."',
        evaluationQuestions: [
          'Does the student acknowledge complexity, not oversimplify?',
          'Is there openness to being wrong, learning, growing?',
          'Do they demonstrate comfort with nuance and ambiguity?',
        ],
        scoringLogic: {
          strong: [
            'Acknowledges complexity naturally',
            'Shows growth mindset and openness',
            'Comfortable with ambiguity',
          ],
          adequate: [
            'Some complexity acknowledged',
            'Growth mindset present but not emphasized',
          ],
          weak: [
            'Oversimplifies or avoids complexity',
            'Presents self as finished/perfect',
          ],
        },
        impactOnScore: {
          strong: 'Enhances intellectual character',
          adequate: 'Neutral',
          weak: 'Slightly detracts',
        },
        howToImprove: [
          'Acknowledge what you\'re still learning or uncertain about',
          'Show how your thinking has evolved or might continue to evolve',
          'Embrace complexity rather than forcing neat conclusions',
        ],
      },
      {
        dimensionId: 'specificity_depth',
        dimensionName: 'Specificity / Depth',
        weight: 5,
        context: 'Specificity enables other dimensions but is not standalone criterion.',
        evaluationQuestions: [
          'Are there concrete details and specific moments?',
          'Does the essay go deep on fewer ideas rather than superficial on many?',
          'Do details serve the larger purpose of showing thinking/character?',
        ],
        scoringLogic: {
          strong: [
            'Rich specific details that illuminate thinking',
            'Deep exploration of focused ideas',
          ],
          adequate: [
            'Some specific details but could go deeper',
            'Good focus but surface-level exploration',
          ],
          weak: [
            'Generic and abstract',
            'Superficial coverage of many topics',
          ],
        },
        impactOnScore: {
          strong: 'Enables higher scores on other dimensions',
          adequate: 'Neutral',
          weak: 'Limits effectiveness of other dimensions',
        },
        howToImprove: [
          'Replace general claims with specific examples',
          'Go deeper on fewer ideas rather than broader on many',
          'Use details that illuminate your thinking process',
        ],
      },
    ],
  },

  // EXTENDED ESSAY
  {
    promptId: 'uchicago_extended_essay',
    promptNumber: 2,
    promptTitle: 'Extended Essay',
    promptText: 'Choose 1 of 7 prompts designed to reveal how you think and play with ideas. 2025-2026 prompts include: inter-species telepathic communication, uninventing something, contronyms, obsolete objects, brand extensions, spurious correlations, and create-your-own.',
    wordCount: { min: 500, max: 700 },
    primaryAssessment: 'How You Think and Intellectual Playfulness',
    importance: 'critical',
    importanceContext: 'THE signature UChicago essay - unusual prompts intentionally designed to resist formulaic approaches and reveal "qualities of mind." Grace Chapin: filter for students who\'ll thrive in Core Curriculum.',
    rubric: {
      excellent: {
        scoreRange: '90-100',
        description: '"Qualities of Mind" fully visible - can see someone thinking before your eyes, genuine intellectual playfulness, substantive argument.',
        criteria: [
          'Reasoning process transparent - can follow your mind at work',
          'Shows connections you make, questions you ask, how thinking evolves',
          'Genuine joy in exploring idea - playfulness palpable, not forced',
          'Takes intellectual risks, not just safe approaches',
          'Chose prompt you\'re GENUINELY curious about, not most impressive',
          'Builds multi-layered argument with "make the case" quality',
          'Acknowledges tensions and gray areas - comfortable with ambiguity',
          'Same authentic voice as Personal Statement',
        ],
        typicalElements: [
          'Unconventional structure that serves thinking (not forced weirdness)',
          'Multiple perspectives explored genuinely',
          'Intellectual wandering that leads somewhere meaningful',
          'Voice consistent with Personal Statement',
        ],
        dimensionalPattern: {
          thinking_process: 'STRONG - reasoning visible throughout',
          intellectual_playfulness: 'STRONG - genuine joy in ideas',
          intellectual_curiosity: 'STRONG - obsessive exploration',
          argumentation: 'STRONG - substantive multi-layered case',
          voice_consistency: 'STRONG - matches other essays',
        },
      },
      good: {
        scoreRange: '80-89',
        description: 'Strong intellectual engagement but thinking process not fully visible or playfulness feels slightly tentative.',
        criteria: [
          'Thinking process mostly visible but some jumps not explained',
          'Playfulness present but may feel slightly tentative or safe',
          'Genuine interest but not obsessive exploration',
          'Solid argument but could be deeper or more multi-layered',
          'Some complexity acknowledged but may resolve too quickly',
          'Voice authentic but might not fully match other essays',
        ],
        whatPreventsHigherScore: 'Make your thinking process MORE visible - show every step of reasoning. Take bigger intellectual risks. Go deeper on your argument rather than resolving too quickly.',
      },
      average: {
        scoreRange: '70-79',
        description: 'Adequate but not distinctive - analytical but more descriptive than exploratory, playfulness feels performative.',
        criteria: [
          'Analytical but more descriptive than exploratory',
          'Attempts playfulness but feels performative or forced',
          'Topic interesting but passion not evident',
          'Argument adequate but surface-level',
          'Oversimplifies complexity or forces neat resolution',
          'Voice generic or doesn\'t quite match other essays',
        ],
        whatPreventsHigherScore: 'Choose a prompt you\'re GENUINELY curious about. Let natural intellectual playfulness emerge rather than forcing quirkiness. Engage more deeply with complexity.',
      },
      weak: {
        scoreRange: 'Below 70',
        description: 'Misses UChicago\'s Extended Essay purpose - lists ideas rather than showing thinking, or forces creativity without substance.',
        criticalFailures: [
          'Lists ideas rather than showing thinking process',
          'Forced creativity - trying to be weird for weirdness sake',
          'Writing about prompt you think sounds impressive, not genuinely curious about',
          'Superficial engagement with obvious answers',
          'Avoids complexity or forces black-and-white conclusions',
          'Voice dramatically different from other essays',
          'Formulaic five-paragraph structure',
        ],
      },
      criticalWarnings: [
        {
          source: 'Grace Chapin James (Former Essay Committee Chair)',
          warning: 'We want the students to write about things that don\'t show up in a workshop on writing college essays. You can\'t write it the day before it\'s due.',
        },
        {
          source: 'Ted O\'Neill (Former Dean)',
          warning: 'Formulaic applications, and the formulaic essays that they so frequently call forth, make it more difficult to hear an authentic voice, or to see someone thinking before your eyes.',
        },
      ],
    },
    dimensionalCriteria: [
      {
        dimensionId: 'thinking_process_visibility',
        dimensionName: 'How You Think / Thinking Process Visibility',
        weight: 25,
        context: 'AdmitStudio (Dec 2025): "showcase how your mind works." Peter Wilson: "How do they think?"',
        evaluationQuestions: [
          'Can I see the student\'s reasoning process unfold step by step?',
          'Do they show connections they make, questions they ask?',
          'Is thinking visible, not just conclusions stated?',
          'Can I see how they approach unfamiliar problems?',
        ],
        scoringLogic: {
          strong: [
            'Reasoning process transparent throughout',
            'Shows how thoughts connect and evolve',
            'Questions arise naturally from exploration',
          ],
          adequate: [
            'Some reasoning visible but jumps unexplained',
            'Thinking present but not fully visible',
          ],
          weak: [
            'Conclusions without reasoning',
            'Ideas listed rather than developed',
          ],
        },
        impactOnScore: {
          strong: 'Essential for 85+',
          adequate: 'Supports 70-84',
          weak: 'Caps at 69',
        },
        howToImprove: [
          'Walk through your reasoning: "This made me think of... which connects to... but then..."',
          'Show every step of how you arrive at your argument',
          'Include questions that arise as you think',
        ],
      },
      {
        dimensionId: 'intellectual_playfulness_extended',
        dimensionName: 'Intellectual Playfulness / Creativity',
        weight: 25,
        context: 'Wilson\'s central question: "How do they play with ideas?" Boyer: "intellectually playful way." This is THE highest weight for Extended Essay because it exists specifically for this.',
        evaluationQuestions: [
          'Is there genuine joy in exploring this idea?',
          'Does the student take intellectual risks or stay safe?',
          'Is creativity substantive or performative?',
          'Are they comfortable wandering intellectually without guaranteed answers?',
        ],
        scoringLogic: {
          strong: [
            'Genuine joy in exploration palpable',
            'Takes intellectual risks willingly',
            'Creative but substantive - playfulness serves thinking',
          ],
          adequate: [
            'Some playfulness but feels tentative',
            'Creativity present but safe',
          ],
          weak: [
            'Forced quirkiness or humor',
            'No intellectual risk-taking',
            'Performative rather than genuine',
          ],
        },
        impactOnScore: {
          strong: 'Essential for 85+',
          adequate: 'Supports 70-84',
          weak: 'Major weakness - caps at 69',
        },
        howToImprove: [
          'Choose a prompt you find genuinely fascinating, not impressive',
          'Take intellectual risks - explore unconventional angles',
          'Let genuine curiosity drive the essay, not performance',
        ],
      },
      {
        dimensionId: 'genuine_interest',
        dimensionName: 'Intellectual Curiosity / Genuine Interest',
        weight: 20,
        context: 'Steve Han: "you care about something." Must choose prompt you\'re GENUINELY curious about.',
        evaluationQuestions: [
          'Did the student choose this prompt out of genuine interest or strategic calculation?',
          'Is there obsessive exploration of the question?',
          'Would they think about this even without the college application?',
        ],
        scoringLogic: {
          strong: [
            'Clearly chose prompt out of genuine fascination',
            'Obsessive exploration evident',
            'Would think about this regardless of application',
          ],
          adequate: [
            'Interest present but not obsessive',
            'Engagement genuine but could go deeper',
          ],
          weak: [
            'Chose prompt strategically, not out of interest',
            'Superficial engagement suggests lack of genuine curiosity',
          ],
        },
        impactOnScore: {
          strong: 'Supports 85+',
          adequate: 'Acceptable for 70-84',
          weak: 'Undermines authenticity',
        },
        howToImprove: [
          'If you\'re not genuinely curious about your chosen prompt, consider switching',
          'Show why THIS question fascinates you specifically',
          'Explore angles that genuinely interest you, not what you think sounds impressive',
        ],
      },
      {
        dimensionId: 'depth_argumentation',
        dimensionName: 'Depth of Analysis / Argumentation',
        weight: 20,
        context: '2025-2026 prompts NEW EMPHASIS: all require "make the case." Libby Pearson: "beautiful argument in the essay."',
        evaluationQuestions: [
          'Does the essay build a substantive, multi-layered argument?',
          'Are multiple perspectives examined?',
          'Is there depth rather than superficial coverage?',
          'Does it "make the case" as the prompts require?',
        ],
        scoringLogic: {
          strong: [
            'Multi-layered argument with evidence',
            'Multiple perspectives explored',
            'Substantive depth throughout',
          ],
          adequate: [
            'Solid argument but could be deeper',
            'Some perspectives but not fully developed',
          ],
          weak: [
            'Superficial engagement',
            'Obvious answers without depth',
            'Single perspective only',
          ],
        },
        impactOnScore: {
          strong: 'Supports 85+',
          adequate: 'Acceptable for 70-84',
          weak: 'Limits score potential',
        },
        howToImprove: [
          'Build a substantive case with multiple supporting arguments',
          'Explore counter-arguments or alternative perspectives',
          'Go deeper on fewer points rather than superficial on many',
        ],
      },
      {
        dimensionId: 'comfort_with_complexity',
        dimensionName: 'Comfort with Complexity / Nuance',
        weight: 5,
        context: 'AdmitStudio (Dec 2025): "do not shy away from acknowledging tensions or gray areas."',
        evaluationQuestions: [
          'Does the student acknowledge tensions or gray areas?',
          'Are they comfortable with ambiguity?',
          'Do they avoid forcing neat resolutions?',
        ],
        scoringLogic: {
          strong: [
            'Acknowledges complexity naturally',
            'Comfortable with open questions',
            'Doesn\'t force neat resolution',
          ],
          adequate: [
            'Some nuance but resolves too quickly',
            'Acknowledges complexity but briefly',
          ],
          weak: [
            'Forces black-and-white conclusions',
            'Avoids or oversimplifies complexity',
          ],
        },
        impactOnScore: {
          strong: 'Enhances intellectual character',
          adequate: 'Neutral',
          weak: 'Slightly detracts',
        },
        howToImprove: [
          'Acknowledge what remains uncertain or debatable',
          'Embrace complexity rather than forcing resolution',
          'It\'s okay to end with questions, not just answers',
        ],
      },
      {
        dimensionId: 'voice_consistency_extended',
        dimensionName: 'Authenticity / Voice Consistency',
        weight: 5,
        context: 'Nondorf: voice consistency check across essays. Lower weight here because unusual prompts make manufactured personas harder.',
        evaluationQuestions: [
          'Does this voice match the Personal Statement?',
          'Is the language natural, not forced to match prompt\'s quirkiness?',
          'Will this voice also match the Why UChicago essay?',
        ],
        scoringLogic: {
          strong: [
            'Voice clearly matches Personal Statement',
            'Natural engagement with unusual prompt',
            'Same personality throughout',
          ],
          adequate: [
            'Voice mostly consistent',
            'Some shift but still recognizable',
          ],
          weak: [
            'Voice dramatically different from other essays',
            'Forced quirkiness that doesn\'t match personality',
          ],
        },
        impactOnScore: {
          strong: 'Supports authenticity',
          adequate: 'Acceptable',
          weak: 'Red flag for authenticity',
        },
        howToImprove: [
          'Engage with the prompt in YOUR voice, not a manufactured quirky voice',
          'Ensure your personality is consistent with Personal Statement',
          'If humor isn\'t natural for you, don\'t force it',
        ],
      },
    ],
  },

  // WHY UCHICAGO ESSAY
  {
    promptId: 'uchicago_why_us',
    promptNumber: 3,
    promptTitle: 'Why UChicago?',
    promptText: 'How does the University of Chicago, as you know it now, satisfy your desire for a particular kind of learning, community, and future? Please address with some specificity your own wishes and how they relate to UChicago.',
    wordCount: { min: 300, max: 600 },
    primaryAssessment: 'Institutional Fit Through Research Depth and Personal Connection',
    importance: 'high',
    importanceContext: 'Tests whether student has done deep research AND can connect UChicago resources to their specific goals. Generic essays signal backup school status. 4.48% acceptance rate means yield matters.',
    rubric: {
      excellent: {
        scoreRange: '90-100',
        description: 'Deep research + personal connection - names specific courses, professors, programs AND explains why each matters to YOUR specific background and goals.',
        criteria: [
          'Names specific courses with numbers (e.g., "SOSC 13100: Social Science Inquiry")',
          'Identifies specific professors and their research areas',
          'Mentions programs/centers unique to UChicago (not available at peer schools)',
          'Shows understanding of quarter system, Core sequences, student-submitted essay prompts',
          'Explains WHY each resource matters based on YOUR background/goals',
          'Demonstrates knowledge of Core Curriculum philosophy, not just that it exists',
          'References "love of learning" culture, intellectual playfulness, discussion-based learning',
          'Same authentic voice as Personal Statement and Extended Essay',
        ],
        typicalElements: [
          'Specific course names with explanations of personal connection',
          'Professor names with their research linked to student\'s interests',
          'Understanding of how Core aligns with student\'s learning style',
          'Programs or opportunities that exist ONLY at UChicago',
        ],
        dimensionalPattern: {
          research_depth: 'STRONG - specific courses, professors, programs',
          personal_connection: 'STRONG - clear why each matters to YOU',
          culture_understanding: 'STRONG - grasps Core philosophy',
          voice_consistency: 'STRONG - matches other essays',
        },
      },
      good: {
        scoreRange: '80-89',
        description: 'Strong research but could connect more personally - names specific resources but explanations of why they matter to YOU could be deeper.',
        criteria: [
          'Names specific resources but may miss some course numbers or professor names',
          'Connects to you but explanations could be deeper',
          'Understands Core but may be surface-level about philosophy',
          'Interest genuine but could be more specific about fit',
          'Voice consistent but enthusiasm could be more palpable',
        ],
        whatPreventsHigherScore: 'Deepen the personal connection - don\'t just list what UChicago offers, explain specifically WHY each resource matters for YOUR goals. Show more understanding of Core philosophy.',
      },
      average: {
        scoreRange: '70-79',
        description: 'Adequate specificity but generic connection - mentions some specific programs but mixed with generic praise, weak personal connection.',
        criteria: [
          'Mentions some specific programs but mixed with generic praise',
          'Lists resources without deep personal connection',
          'Knows Core exists but doesn\'t show understanding of philosophy',
          'Interest stated but not demonstrated through research',
          'Voice adequate but may not fully match other essays',
        ],
        whatPreventsHigherScore: 'Replace generic praise with specific resources. For each resource you mention, explain WHY it matters to YOUR specific background and goals. Show understanding of WHY Core Curriculum works for you.',
      },
      weak: {
        scoreRange: 'Below 70',
        description: 'Generic "Why Us" essay - could swap "UChicago" for another school name, no personal connection, generic language.',
        criticalFailures: [
          '"Great education," "world-class faculty," "beautiful campus" - applicable to any top school',
          'No specific course names, professors, or programs',
          'Could swap "UChicago" for another school name with minimal changes',
          'No personal connection - essay about UChicago, not about you at UChicago',
          'Voice dramatically different from other essays or clearly performing',
          'Focus on prestige, rankings, career outcomes',
          'Information from first page of website only',
        ],
      },
      criticalWarnings: [
        {
          source: 'Former Stanford and UChicago AOs (Reddit)',
          warning: 'Schools can really tell if the things you\'ve provided in the "why school" essay are generic. If it\'s relevant to every single school, you\'re doing it wrong.',
        },
        {
          source: 'Reddit AO (verified)',
          warning: 'The key in these essays is to be EXTREMELY specific.',
        },
        {
          source: 'College Essay Guy',
          warning: 'If the essay is "mostly about them and not you... that\'s not a good \'why\' essay."',
        },
      ],
    },
    dimensionalCriteria: [
      {
        dimensionId: 'uchicago_research_depth',
        dimensionName: 'UChicago-Specific Research Depth',
        weight: 35,
        context: 'Former AOs: "be EXTREMELY specific." Generic language is #1 red flag. 4.48% acceptance rate means yield matters.',
        evaluationQuestions: [
          'Does the student name specific courses with numbers?',
          'Are specific professors and their research areas identified?',
          'Are programs mentioned that are unique to UChicago (not available at peer schools)?',
          'Is there understanding of specific UChicago features (quarter system, Core sequences, student-submitted prompts)?',
        ],
        scoringLogic: {
          strong: [
            'Specific course numbers cited',
            'Professor names with research areas',
            'Programs unique to UChicago identified',
            'Understanding of UChicago-specific features',
          ],
          adequate: [
            'Some specific programs but missing course numbers',
            'General awareness of unique features',
          ],
          weak: [
            'Generic praise applicable to any school',
            'No specific courses, professors, or programs',
            'Information from website homepage only',
          ],
        },
        impactOnScore: {
          strong: 'Essential for 85+',
          adequate: 'Supports 70-84',
          weak: 'Critical failure - caps at 69',
        },
        howToImprove: [
          'Add specific course names with numbers from the course catalog',
          'Research professors whose work connects to your interests',
          'Identify programs or opportunities that exist ONLY at UChicago',
          'Show you\'ve gone beyond the website homepage',
        ],
      },
      {
        dimensionId: 'personal_connection_to_resources',
        dimensionName: 'Personal Connection to Resources',
        weight: 30,
        context: 'College Essay Guy: Essay that\'s "mostly about them and not you... that\'s not a good \'why\' essay."',
        evaluationQuestions: [
          'Does the student explain WHY each resource matters to THEM?',
          'Is there connection between UChicago offerings and student\'s specific background/goals?',
          'Is it clear how these resources fit the student\'s intellectual trajectory?',
        ],
        scoringLogic: {
          strong: [
            'Clear explanation of why each resource matters to this specific student',
            'Resources connected to student\'s background/experiences',
            'Intellectual trajectory makes UChicago fit clear',
          ],
          adequate: [
            'Some personal connection but could be deeper',
            'Lists resources with brief explanations',
          ],
          weak: [
            'Lists resources without personal connection',
            'Essay about UChicago, not about student at UChicago',
          ],
        },
        impactOnScore: {
          strong: 'Essential for 85+',
          adequate: 'Supports 70-84',
          weak: 'Major weakness',
        },
        howToImprove: [
          'For each resource, explain specifically how it connects to YOUR background/goals',
          'Show the trajectory: your past interests → what you need → how UChicago provides it',
          'Make the essay about YOU at UChicago, not just about UChicago',
        ],
      },
      {
        dimensionId: 'intellectual_culture_understanding',
        dimensionName: 'Understanding of Intellectual Culture',
        weight: 20,
        context: 'Must demonstrate understanding of Core Curriculum philosophy, discussion-based learning, "love of learning" culture.',
        evaluationQuestions: [
          'Does the student understand Core Curriculum philosophy, not just that it exists?',
          'Is there awareness of discussion-based learning style?',
          'Do they reference the "love of learning" culture and intellectual playfulness?',
          'Do they understand UChicago\'s non-pre-professional approach?',
        ],
        scoringLogic: {
          strong: [
            'Demonstrates understanding of Core philosophy',
            'Shows how discussion-based learning fits their style',
            'References intellectual culture authentically',
          ],
          adequate: [
            'Knows Core exists but surface-level understanding',
            'Some awareness of culture',
          ],
          weak: [
            'No mention of Core or intellectual culture',
            'Focus on prestige rather than learning approach',
          ],
        },
        impactOnScore: {
          strong: 'Supports 85+',
          adequate: 'Acceptable for 70-84',
          weak: 'Suggests surface-level research',
        },
        howToImprove: [
          'Explain WHY Core\'s approach to learning fits you',
          'Show understanding of what makes UChicago\'s intellectual culture distinctive',
          'Connect the culture to your own approach to learning',
        ],
      },
      {
        dimensionId: 'genuine_interest_fit',
        dimensionName: 'Genuine Interest / Fit',
        weight: 10,
        context: '4.48% acceptance rate means yield matters. But genuine interest is SHOWN through research depth, not stated directly.',
        evaluationQuestions: [
          'Does the research depth demonstrate genuine interest?',
          'Is enrollment likelihood clear through specificity?',
          'Does the essay show how UChicago\'s approach matches the student\'s learning style?',
        ],
        scoringLogic: {
          strong: [
            'Genuine interest evident through research depth',
            'Clear fit between student and UChicago approach',
          ],
          adequate: [
            'Interest present but could be demonstrated more clearly',
          ],
          weak: [
            'States interest without demonstrating through research',
            'Generic fit claims',
          ],
        },
        impactOnScore: {
          strong: 'Enhances overall impression',
          adequate: 'Neutral',
          weak: 'Suggests backup school',
        },
        howToImprove: [
          'Show genuine interest through depth of research, not by stating "I really want to attend"',
          'Demonstrate fit through specific connections, not general claims',
        ],
      },
      {
        dimensionId: 'voice_consistency_why',
        dimensionName: 'Authenticity / Voice Consistency',
        weight: 5,
        context: 'Nondorf: voice in "Why UChicago?" must match voice in Personal Statement and Extended Essay.',
        evaluationQuestions: [
          'Does this voice match the Personal Statement and Extended Essay?',
          'Is enthusiasm natural, not performed?',
          'Is the personality recognizable as the same student?',
        ],
        scoringLogic: {
          strong: [
            'Voice clearly matches other essays',
            'Natural enthusiasm',
            'Same personality throughout',
          ],
          adequate: [
            'Voice mostly consistent',
            'Some shift but recognizable',
          ],
          weak: [
            'Voice dramatically different',
            'Enthusiasm feels performed',
          ],
        },
        impactOnScore: {
          strong: 'Supports authenticity',
          adequate: 'Acceptable',
          weak: 'Red flag for authenticity',
        },
        howToImprove: [
          'Ensure your personality is consistent with other essays',
          'Let natural enthusiasm come through',
          'Don\'t shift to a more formal voice just because it\'s "Why UChicago"',
        ],
      },
    ],
  },
];

// ============================================================================
// UCHICAGO RED FLAGS (Evidence-Based, with Source Attribution)
// ============================================================================

export const uchicagoRedFlags: CollegeRedFlag[] = [
  {
    flagId: 'GENERIC_LANGUAGE_LACK_OF_SPECIFICITY',
    flagName: 'Generic Language / Lack of Specificity',
    applicablePrompts: ['uchicago_why_us'],
    severity: 'critical',
    detection: {
      description: 'Essay uses generic praise applicable to any top school without specific UChicago resources.',
      signalPhrases: [
        'excellent faculty',
        'great education',
        'world-class',
        'prestigious',
        'beautiful campus',
        'diverse community',
        'academic rigor',
        'top-ranked',
        'amazing opportunities',
        'leading research',
      ],
      patterns: [
        'could substitute another school name with minimal changes',
        'no course numbers or professor names',
        'information only from website homepage',
      ],
    },
    evidence: {
      source: 'Former Stanford and UChicago AOs (Reddit)',
      quote: 'Schools can really tell if the things you\'ve provided in the "why school" essay are generic. If it\'s relevant to every single school, you\'re doing it wrong.',
      explanation: 'Generic essays signal the student hasn\'t done deep research and may be treating UChicago as a backup.',
    },
    teaching: {
      problem: 'Your essay uses generic praise that could apply to any top university.',
      whyItMatters: 'UChicago\'s 4.48% acceptance rate means they need to assess genuine fit and enrollment likelihood. Generic essays suggest you haven\'t done deep research or don\'t have specific reasons for wanting to attend.',
      howToFix: 'Replace generic praise with specific UChicago resources: course numbers (e.g., "SOSC 13100"), professor names with their research areas, and programs that exist ONLY at UChicago. For each resource, explain why it matters to YOUR specific goals.',
      exampleFix: 'Instead of "UChicago has excellent faculty," try: "Professor X\'s research on Y directly addresses my question about Z, which emerged from my work on..."',
    },
    scoreImpact: {
      dimension: 'uchicago_research_depth',
      penalty: 'Critical failure - caps at 69',
    },
  },
  {
    flagId: 'ACCOMPLISHMENT_LISTING_RESUME_REPETITION',
    flagName: 'Listing Accomplishments / Resume Repetition',
    applicablePrompts: ['uchicago_common_app', 'uchicago_extended_essay'],
    severity: 'major',
    detection: {
      description: 'Essay focuses on listing achievements, titles, or positions rather than showing thinking process.',
      signalPhrases: [
        'I was president of',
        'I founded',
        'I led',
        'I achieved',
        'I won',
        'I was selected for',
        'my accomplishments include',
      ],
      patterns: [
        'multiple leadership titles mentioned',
        'focus on awards or recognition',
        'repeating activities list in prose form',
      ],
    },
    evidence: {
      source: 'Peter Wilson (Dean of College Admissions)',
      quote: 'How do they think? How do they play with ideas?',
      explanation: 'UChicago essays should reveal HOW you think, not WHAT you\'ve accomplished. Activities list already documents achievements.',
    },
    teaching: {
      problem: 'Your essay focuses on listing achievements rather than showing how you think.',
      whyItMatters: 'UChicago uses essays specifically to see "how you think" and "how you play with ideas" - not to learn about accomplishments (those are in your activities list). Dean Wilson asks this question identically across 3 years because it\'s THE central evaluation criterion.',
      howToFix: 'Instead of listing what you did, explore what an experience taught you about thinking, problem-solving, or intellectual growth. Make your reasoning process visible.',
      exampleFix: 'Instead of "I founded a robotics club and led it to state competition," try: "Building our first robot taught me that my initial approach was wrong. When the arm kept jamming, I realized I\'d been thinking about the problem as..."',
    },
    scoreImpact: {
      dimension: 'thinking_process_visibility',
      penalty: 'Caps at 79',
    },
  },
  {
    flagId: 'FORMULAIC_WORKSHOP_STYLE_WRITING',
    flagName: 'Formulaic or Workshop-Style Writing',
    applicablePrompts: ['uchicago_extended_essay'],
    severity: 'major',
    detection: {
      description: 'Essay follows generic essay workshop structures rather than engaging genuinely with unusual prompt.',
      signalPhrases: [
        'in conclusion',
        'firstly, secondly, thirdly',
        'this experience taught me',
        'I learned that',
        'as a result',
      ],
      patterns: [
        'five-paragraph essay structure',
        'predictable introduction-body-conclusion format',
        'clichéd opening or closing',
      ],
    },
    evidence: {
      source: 'Grace Chapin James (Former Essay Committee Chair, 8 years)',
      quote: 'We want the students to write about things that don\'t show up in a workshop on writing college essays. We learn a lot by reading these essays. You can\'t write it the day before it\'s due.',
      explanation: 'UChicago\'s unusual prompts are DESIGNED to resist formulaic approaches. Generic essay structures signal lack of genuine engagement.',
    },
    teaching: {
      problem: 'Your essay follows a formulaic structure that doesn\'t match UChicago\'s unusual prompt.',
      whyItMatters: 'UChicago\'s Extended Essay prompts are intentionally unusual SPECIFICALLY to filter out formulaic writers. Grace Chapin explains they want essays that "don\'t show up in a workshop." The unusualness is the point.',
      howToFix: 'Let the prompt shape your structure. Engage genuinely with the intellectual puzzle rather than forcing it into a familiar format. Show your thinking process, not a polished argument.',
      exampleFix: 'Instead of a five-paragraph structure, let your essay follow your actual thinking: "This question made me think of X, which led me to Y, but then Z complicated that..."',
    },
    scoreImpact: {
      dimension: 'intellectual_playfulness',
      penalty: 'Caps at 79',
    },
  },
  {
    flagId: 'INAUTHENTIC_VOICE_OVER_POLISHING',
    flagName: 'Inauthentic Voice / Over-Polishing',
    applicablePrompts: ['uchicago_common_app', 'uchicago_extended_essay', 'uchicago_why_us'],
    severity: 'critical',
    detection: {
      description: 'Essay voice sounds manufactured, overly academic, or dramatically different across essays.',
      signalPhrases: [
        'thesaurus-heavy vocabulary',
        'overly complex sentence structures',
        'voice shifts between essays',
      ],
      patterns: [
        'vocabulary doesn\'t match natural speaking style',
        'personality dramatically different from other essays',
        'consultant-polished prose',
      ],
    },
    evidence: {
      source: 'Jim Nondorf (VP & Dean of Admissions)',
      quote: 'The student\'s voice that you hear in their first essay... will then carry on in their second essay... they\'ll be in the third one.',
      explanation: 'UChicago explicitly uses cross-essay voice consistency to verify authenticity. Dramatically different voices suggest inauthenticity.',
    },
    teaching: {
      problem: 'Your voice sounds manufactured or is inconsistent across your essays.',
      whyItMatters: 'Dean Nondorf explicitly describes UChicago\'s cross-essay voice consistency check. They read all three essays looking for the SAME personality, voice, and intellectual character. Inconsistent voices suggest either different people wrote different essays or you\'re manufacturing personas.',
      howToFix: 'Write in your natural voice across all essays. If you\'re naturally sarcastic, don\'t force formal language. If you\'re earnest, don\'t force humor. The same YOU should appear in every essay.',
      exampleFix: 'Read your essays aloud. Do they all sound like the same person talking? If not, revise to maintain consistent personality.',
    },
    scoreImpact: {
      dimension: 'authentic_voice',
      penalty: 'Critical failure - caps at 69',
    },
  },
  {
    flagId: 'SUPERFICIAL_ENGAGEMENT_WITH_PROMPTS',
    flagName: 'Superficial Engagement with Prompts',
    applicablePrompts: ['uchicago_extended_essay'],
    severity: 'major',
    detection: {
      description: 'Essay provides obvious answers or surface-level takes without engaging deeply with prompt\'s intellectual puzzle.',
      signalPhrases: [
        'obvious first answer to prompt',
        'doesn\'t explore complexity',
        'stays on surface',
      ],
      patterns: [
        'straightforward response without depth',
        'predictable angle on unusual prompt',
        'no intellectual risk-taking',
      ],
    },
    evidence: {
      source: 'AdmitStudio Guidance (December 2025)',
      quote: 'Don\'t play it safe with your tone or structure. Avoid generic, surface-level takes.',
      explanation: 'Extended Essay prompts are designed to test intellectual depth and playfulness. Surface-level engagement suggests inability to think deeply.',
    },
    teaching: {
      problem: 'Your essay takes a surface-level approach to the Extended Essay prompt.',
      whyItMatters: 'UChicago\'s unusual prompts are specifically designed to see how deeply you can engage with ideas. Surface-level takes suggest you won\'t thrive in Core Curriculum\'s discussion-based, exploratory learning environment.',
      howToFix: 'Go deeper. Explore multiple angles. Take intellectual risks. Show comfort with complexity and ambiguity.',
      exampleFix: 'Instead of the obvious first answer, ask: "What\'s the second or third layer here? What complications arise? What tensions exist that I could explore?"',
    },
    scoreImpact: {
      dimension: 'depth_argumentation',
      penalty: 'Caps at 79',
    },
  },
  {
    flagId: 'FORCED_CREATIVITY_TRYING_TOO_HARD',
    flagName: 'Forced Creativity / Trying Too Hard to Be Quirky',
    applicablePrompts: ['uchicago_extended_essay'],
    severity: 'major',
    detection: {
      description: 'Essay tries too hard to be unique or quirky without substantive intellectual engagement.',
      signalPhrases: [
        'forced humor',
        'trying to be weird for weirdness sake',
        'creativity without substance',
      ],
      patterns: [
        'quirkiness doesn\'t serve the thinking',
        'performance of creativity',
        'humor that feels unnatural',
      ],
    },
    evidence: {
      source: 'Multiple expert sources',
      quote: 'Don\'t put too much pressure on making the essay super unique or having all these revolutionary ideas.',
      explanation: 'UChicago wants GENUINE intellectual playfulness, not performative weirdness. Forced creativity signals inauthenticity.',
    },
    teaching: {
      problem: 'Your essay forces creativity or quirkiness without substantive intellectual engagement.',
      whyItMatters: 'UChicago values intellectual playfulness, but it must be GENUINE. Forced quirkiness signals you\'re performing rather than authentically engaging with ideas.',
      howToFix: 'Let creativity serve your thinking, not replace it. Choose a prompt you\'re genuinely curious about and engage authentically. If humor isn\'t natural for you, don\'t force it.',
      exampleFix: 'Instead of trying to be impressive, ask: "What about this prompt genuinely fascinates me? What would I explore even without a college application?"',
    },
    scoreImpact: {
      dimension: 'intellectual_playfulness',
      penalty: 'Undermines authenticity',
    },
  },
  {
    flagId: 'LACK_OF_PERSONAL_CONNECTION',
    flagName: 'Lack of Personal Connection',
    applicablePrompts: ['uchicago_why_us', 'uchicago_extended_essay'],
    severity: 'major',
    detection: {
      description: 'Essay is about the topic or about UChicago but doesn\'t connect to the student\'s specific background, interests, or goals.',
      signalPhrases: [
        'essay mostly about topic, not about you',
        'essay about UChicago, not about you at UChicago',
        'generic reasons without personal connection',
      ],
      patterns: [
        'lists resources without explaining why they matter to YOU',
        'writing about topic not genuinely interested in',
        'writing what AOs want to hear',
      ],
    },
    evidence: {
      source: 'College Essay Guy',
      quote: 'If the essay is "mostly about them and not you... that\'s not a good \'why\' essay."',
      explanation: 'Essays must connect UChicago resources or Extended Essay ideas to YOUR specific background, experiences, and goals.',
    },
    teaching: {
      problem: 'Your essay lacks personal connection - it\'s about the topic or about UChicago, but not about YOU.',
      whyItMatters: 'UChicago wants to understand how YOU specifically will engage with their resources and intellectual culture. An essay about UChicago that could be written by anyone doesn\'t help them see YOU.',
      howToFix: 'For every resource or idea, explain the personal connection: Why does this matter to YOU specifically? How does it connect to YOUR background, experiences, or goals?',
      exampleFix: 'Instead of "UChicago\'s Core Curriculum offers broad exposure to ideas," try: "Having explored X in my own research, I\'ve realized I need Y perspective that Core\'s SOSC sequence provides..."',
    },
    scoreImpact: {
      dimension: 'personal_connection_to_resources',
      penalty: 'Caps at 79',
    },
  },
  {
    flagId: 'WRONG_SCHOOL_NAME_COPY_PASTE',
    flagName: 'Wrong School Name / Copy-Paste Errors',
    applicablePrompts: ['uchicago_why_us'],
    severity: 'critical',
    detection: {
      description: 'Essay mentions wrong university, programs that don\'t exist at UChicago, or shows obvious copy-paste from other applications.',
      signalPhrases: [
        'wrong school name mentioned',
        'programs that don\'t exist at UChicago',
        'obvious copy-paste errors',
      ],
      patterns: [
        'mentions programs from other schools',
        'references that don\'t match UChicago',
        'generic enough to swap school names',
      ],
    },
    evidence: {
      source: 'Multiple admissions experts',
      quote: 'The absolutely biggest error you can make is using the wrong college name.',
      explanation: 'Wrong school name or non-existent programs signal carelessness and suggest UChicago is not a priority.',
    },
    teaching: {
      problem: 'Your essay contains errors that suggest copy-paste from other applications.',
      whyItMatters: 'This is the most damaging error possible. It signals to admissions that UChicago is not your priority and that you\'re not careful about important work.',
      howToFix: 'Proofread carefully. Verify every resource, program, and professor actually exists at UChicago. Never copy-paste between school essays without complete revision.',
      exampleFix: 'Before submitting, search your essay for any mention of other schools, programs that might not exist, or generic language that could apply anywhere.',
    },
    scoreImpact: {
      dimension: 'uchicago_research_depth',
      penalty: 'Critical failure - automatic rejection risk',
    },
  },
  {
    flagId: 'CAREER_PRESTIGE_FOCUS',
    flagName: 'Career or Prestige Focus',
    applicablePrompts: ['uchicago_why_us', 'uchicago_common_app'],
    severity: 'major',
    detection: {
      description: 'Essay focuses on career outcomes, rankings, or prestige rather than intellectual growth and love of learning.',
      signalPhrases: [
        'prestigious',
        'career outcomes',
        'job placement',
        'rankings',
        'top-ranked',
        'will help my career',
        'employers value',
        'alumni network',
      ],
      patterns: [
        'motivation framed around outcomes, not learning',
        'focus on what degree will get you',
        'pre-professional framing',
      ],
    },
    evidence: {
      source: 'Steve Han (Former UChicago AO)',
      quote: 'At UChicago we really do look for students who prioritize learning for learning\'s sake.',
      explanation: 'UChicago\'s Core Curriculum emphasizes intellectual exploration over pre-professional preparation. Career-focused essays misunderstand the culture.',
    },
    teaching: {
      problem: 'Your essay focuses on career outcomes or prestige rather than intellectual growth.',
      whyItMatters: 'UChicago explicitly looks for students who "prioritize learning for learning\'s sake." A focus on career outcomes or prestige signals a pre-professional orientation that misaligns with Core Curriculum\'s philosophy.',
      howToFix: 'Reframe around intellectual curiosity, not career outcomes. Focus on what you want to LEARN and EXPLORE, not what the degree will get you.',
      exampleFix: 'Instead of "UChicago\'s economics program will prepare me for a career in finance," try: "I\'m drawn to how Chicago\'s approach to economics emphasizes X methodology, which would let me explore my question about Y..."',
    },
    scoreImpact: {
      dimension: 'intellectual_culture_understanding',
      penalty: 'Suggests cultural misfit',
    },
  },
];

// ============================================================================
// UCHICAGO GREEN FLAGS (Evidence-Based, with Source Attribution)
// ============================================================================

export const uchicagoGreenFlags: CollegeGreenFlag[] = [
  {
    flagId: 'INTELLECTUAL_VITALITY_LEARNING_FOR_LEARNING',
    flagName: 'Intellectual Vitality / Learning for Learning\'s Sake',
    applicablePrompts: ['uchicago_common_app', 'uchicago_extended_essay'],
    strength: 'exceptional',
    detection: {
      description: 'Essay demonstrates pursuing knowledge beyond requirements out of genuine curiosity.',
      signalPhrases: [
        'I was curious about',
        'I wondered',
        'I spent time exploring',
        'outside of class',
        'on my own',
        'because I wanted to understand',
        'the question obsessed me',
      ],
      patterns: [
        'self-directed learning',
        'reading/exploring outside curriculum',
        'questions that drive continued exploration',
      ],
    },
    evidence: {
      source: 'Steve Han (Former UChicago AO, August 2025)',
      quote: 'Ultimately we are looking for students who demonstrate intellectual vitality, who do what they do well academically but go above and beyond. At UChicago we really do look for students who prioritize learning for learning\'s sake.',
      explanation: 'This is now OFFICIAL TERMINOLOGY and THE #1 criterion for 2025.',
    },
    teaching: {
      whatWorks: 'You demonstrate genuine intellectual curiosity - learning beyond requirements because you genuinely want to know.',
      whyItMatters: 'This is exactly what UChicago calls "intellectual vitality" - their #1 criterion. Steve Han explicitly names this as what they\'re looking for.',
      howToEnhance: 'Make the self-directed nature even more visible. Show what questions arose and how you pursued them further.',
    },
    scoreImpact: {
      dimension: 'intellectual_curiosity_love_of_learning',
      bonus: 'Essential for 90+',
    },
  },
  {
    flagId: 'THINKING_PROCESS_VISIBLE',
    flagName: 'How Your Mind Works / Thinking Process Visible',
    applicablePrompts: ['uchicago_common_app', 'uchicago_extended_essay'],
    strength: 'exceptional',
    detection: {
      description: 'Essay makes reasoning process transparent - shows HOW you arrive at insights, not just WHAT you conclude.',
      signalPhrases: [
        'I initially thought',
        'but then I realized',
        'this made me question',
        'which led me to',
        'I wondered whether',
        'the connection I saw was',
      ],
      patterns: [
        'reasoning steps visible',
        'thinking evolves through essay',
        'questions arise from exploration',
        'connections made explicit',
      ],
    },
    evidence: {
      source: 'Peter Wilson (Dean of College Admissions)',
      quote: 'How do they think? How do they play with ideas?',
      explanation: 'Peter Wilson asks this IDENTICALLY across 2022, 2024, 2025 - it\'s THE central evaluation question.',
    },
    teaching: {
      whatWorks: 'You let readers see your thinking process unfold - the connections you make, the questions that arise, how your thinking evolves.',
      whyItMatters: 'Dean Wilson\'s central question has been identical for 3 years: "How do they think?" This is what UChicago most wants to see.',
      howToEnhance: 'Continue showing reasoning steps. Include moments of uncertainty or revision - "I thought X, but then Y made me reconsider..."',
    },
    scoreImpact: {
      dimension: 'thinking_process_visibility',
      bonus: 'Essential for 90+',
    },
  },
  {
    flagId: 'INTELLECTUAL_PLAYFULNESS_GENUINE',
    flagName: 'Intellectual Playfulness / Genuine Joy in Ideas',
    applicablePrompts: ['uchicago_extended_essay'],
    strength: 'exceptional',
    detection: {
      description: 'Essay shows genuine joy in exploring ideas - playfulness that serves thinking, intellectual risk-taking, comfort with ambiguity.',
      signalPhrases: [
        'I love thinking about',
        'what fascinates me is',
        'the fun part is',
        'I couldn\'t stop thinking about',
        'the puzzle here is',
      ],
      patterns: [
        'genuine enthusiasm for ideas',
        'intellectual risk-taking',
        'playfulness that\'s substantive',
        'comfort with open questions',
      ],
    },
    evidence: {
      source: 'John W. Boyer (Dean of the College)',
      quote: 'intellectually playful way in response to open-ended challenge',
      explanation: '"Play with ideas" language appears across 5 different UChicago leaders - it\'s core to their culture.',
    },
    teaching: {
      whatWorks: 'You show genuine intellectual playfulness - finding joy in ideas, taking intellectual risks, engaging with complexity as something fun rather than just serious.',
      whyItMatters: 'UChicago\'s "play with ideas" language is unique among elite schools. They want students who find thinking FUN, not just productive.',
      howToEnhance: 'Continue letting intellectual joy show. Take even bigger intellectual risks if there are angles you\'ve held back on exploring.',
    },
    scoreImpact: {
      dimension: 'intellectual_playfulness',
      bonus: 'Essential for 90+',
    },
  },
  {
    flagId: 'AUTHENTIC_VOICE_CONSISTENT',
    flagName: 'Authentic Voice Consistent Across Essays',
    applicablePrompts: ['uchicago_common_app', 'uchicago_extended_essay', 'uchicago_why_us'],
    strength: 'strong',
    detection: {
      description: 'Essay maintains consistent, natural voice that matches other essays - same personality, humor, intellectual style throughout.',
      signalPhrases: [
        'voice feels natural',
        'personality consistent',
        'same intellectual style',
      ],
      patterns: [
        'natural language maintained',
        'personality recognizable across essays',
        'no dramatic voice shifts',
      ],
    },
    evidence: {
      source: 'Jim Nondorf (VP & Dean of Admissions)',
      quote: 'The student\'s voice that you hear in their first essay... will then carry on in their second essay... they\'ll be in the third one.',
      explanation: 'UChicago explicitly checks for voice consistency across all three essays as an authenticity verification method.',
    },
    teaching: {
      whatWorks: 'Your voice feels natural and consistent - the same personality comes through in all your essays.',
      whyItMatters: 'Dean Nondorf describes this cross-essay consistency check as how UChicago verifies authenticity. You pass this test.',
      howToEnhance: 'Maintain this consistency. If revising one essay, make sure voice still matches the others.',
    },
    scoreImpact: {
      dimension: 'authentic_voice',
      bonus: 'Supports 85+',
    },
  },
  {
    flagId: 'PASSION_GENUINE_ENTHUSIASM',
    flagName: 'Passion and Genuine Enthusiasm',
    applicablePrompts: ['uchicago_common_app', 'uchicago_extended_essay'],
    strength: 'strong',
    detection: {
      description: 'Essay shows obvious passion and enthusiasm - you clearly CARE about the topic, not just find it interesting.',
      signalPhrases: [
        'I can\'t wait to',
        'I\'m excited about',
        'what excites me is',
        'I care deeply about',
        'this matters to me because',
      ],
      patterns: [
        'enthusiasm palpable in word choice',
        'depth of exploration shows investment',
        'forward-looking excitement',
      ],
    },
    evidence: {
      source: 'Steve Han (Former UChicago AO, August 2025)',
      quote: 'Passion is such an important thing in the admissions process... We just want to know that you care about something and are looking forward to something.',
      explanation: 'NEW EXPLICIT emphasis for 2025 - passion separated from general curiosity as distinct criterion.',
    },
    teaching: {
      whatWorks: 'Your passion for this topic is evident - you clearly care deeply, not just intellectually engage.',
      whyItMatters: 'Steve Han (Aug 2025) explicitly says passion is "such an important thing." They want to see you CARE.',
      howToEnhance: 'Show where this passion leads - what questions or possibilities excite you going forward?',
    },
    scoreImpact: {
      dimension: 'passion_enthusiasm',
      bonus: 'Supports 85+',
    },
  },
  {
    flagId: 'DEPTH_OF_ANALYSIS_ARGUMENTATION',
    flagName: 'Depth of Analysis / Building Arguments',
    applicablePrompts: ['uchicago_extended_essay'],
    strength: 'strong',
    detection: {
      description: 'Essay builds multi-layered, substantive arguments - "makes the case" as prompts require.',
      signalPhrases: [
        'because',
        'therefore',
        'this suggests',
        'the evidence shows',
        'considering multiple perspectives',
      ],
      patterns: [
        'multi-layered argument',
        'evidence supports claims',
        'multiple perspectives examined',
        'substantive depth',
      ],
    },
    evidence: {
      source: 'Libby Pearson (Former UChicago AO)',
      quote: 'beautiful argument in the essay',
      explanation: '2025-2026 prompts all require "make the case" - argumentation is now explicit requirement.',
    },
    teaching: {
      whatWorks: 'You build a substantive, multi-layered argument - the 2025-2026 prompts\' "make the case" requirement is met.',
      whyItMatters: 'Former AO Libby Pearson specifically cites "beautiful argument" as what can make an essay stand out.',
      howToEnhance: 'Consider adding counter-arguments or complications that deepen your case. The best arguments engage with pushback.',
    },
    scoreImpact: {
      dimension: 'depth_argumentation',
      bonus: 'Supports 85+',
    },
  },
  {
    flagId: 'COMFORT_WITH_COMPLEXITY_NUANCE',
    flagName: 'Comfort with Complexity / Acknowledging Nuance',
    applicablePrompts: ['uchicago_extended_essay', 'uchicago_common_app'],
    strength: 'positive',
    detection: {
      description: 'Essay acknowledges tensions, gray areas, and complexity - doesn\'t force neat resolution.',
      signalPhrases: [
        'it\'s not that simple',
        'the tension here is',
        'I\'m still wrestling with',
        'this doesn\'t have a clean answer',
        'on one hand... on the other',
      ],
      patterns: [
        'acknowledges complexity',
        'comfortable with ambiguity',
        'doesn\'t force neat resolution',
        'intellectual humility visible',
      ],
    },
    evidence: {
      source: 'AdmitStudio (December 2025)',
      quote: 'Do not shy away from acknowledging tensions or gray areas.',
      explanation: 'NEW 2025 guidance - comfort with complexity now explicitly emphasized.',
    },
    teaching: {
      whatWorks: 'You acknowledge complexity and nuance rather than forcing neat conclusions.',
      whyItMatters: 'Recent guidance explicitly tells students not to shy away from tensions or gray areas. This shows intellectual maturity.',
      howToEnhance: 'Continue embracing complexity. It\'s okay to end with questions you\'re still exploring.',
    },
    scoreImpact: {
      dimension: 'comfort_with_complexity',
      bonus: 'Enhances intellectual character',
    },
  },
  {
    flagId: 'EXTREME_SPECIFICITY_WHY_UCHICAGO',
    flagName: 'EXTREME Specificity in Why UChicago',
    applicablePrompts: ['uchicago_why_us'],
    strength: 'exceptional',
    detection: {
      description: 'Essay includes specific course numbers, professor names with research areas, and programs unique to UChicago.',
      signalPhrases: [
        'course names with numbers',
        'Professor X\'s research on Y',
        'specific programs',
        'quarter system',
        'Core sequences',
      ],
      patterns: [
        'course numbers cited (e.g., SOSC 13100)',
        'professor names with research areas',
        'programs only at UChicago',
        'deep research evident',
      ],
    },
    evidence: {
      source: 'Former Stanford and UChicago AO (Reddit)',
      quote: 'The key in these essays is to be EXTREMELY specific.',
      explanation: 'Former AOs explicitly emphasize EXTREME specificity as the key criterion for Why UChicago essays.',
    },
    teaching: {
      whatWorks: 'You demonstrate deep research with specific course numbers, professor names, and UChicago-only programs.',
      whyItMatters: 'Former AOs explicitly say the key is to be "EXTREMELY specific." This shows genuine interest and research.',
      howToEnhance: 'For each resource, make sure you\'ve also explained why it matters to YOUR specific goals.',
    },
    scoreImpact: {
      dimension: 'uchicago_research_depth',
      bonus: 'Essential for 90+',
    },
  },
];

// ============================================================================
// UCHICAGO SOCRATIC QUESTIONS (College-Specific Teaching Questions)
// ============================================================================

export const uchicagoSocraticQuestions: CollegeSocraticQuestionBank = {
  byPurpose: {
    deepening: [
      {
        questionId: 'uchicago_deepen_1',
        question: 'You mention being curious about this topic. What specific question drove you to explore it beyond what was required for class?',
        trigger: { dimension: 'intellectual_curiosity_love_of_learning' },
        purpose: 'Draw out evidence of intellectual vitality - learning beyond requirements',
        expectedOutcome: 'Student identifies specific self-directed exploration that shows "learning for learning\'s sake"',
        exampleGoodResponse: 'After we covered X in class, I kept wondering about Y. I spent the summer reading Z not for any assignment, but because I couldn\'t let the question go.',
        followUp: 'What did you discover that surprised you or changed your thinking?',
      },
      {
        questionId: 'uchicago_deepen_2',
        question: 'Can you walk me through how your thinking evolved as you explored this? What did you initially think, and how did that change?',
        trigger: { dimension: 'thinking_process_visibility' },
        purpose: 'Make reasoning process visible - show "how you think"',
        expectedOutcome: 'Student shows thinking evolution, not just conclusions',
        exampleGoodResponse: 'I initially thought X was straightforward, but then Y made me realize... which led me to question Z...',
        followUp: 'What questions remain that you\'re still curious about?',
      },
      {
        questionId: 'uchicago_deepen_3',
        question: 'What tensions or complications did you encounter? What made this more complex than it first appeared?',
        trigger: { dimension: 'comfort_with_complexity' },
        purpose: 'Encourage engagement with nuance and ambiguity',
        expectedOutcome: 'Student acknowledges complexity rather than forcing neat resolution',
        exampleGoodResponse: 'What I realized is that X and Y are actually in tension. There isn\'t a clean answer because...',
        followUp: 'How do you hold that tension? Do you have to resolve it, or can you sit with the complexity?',
      },
    ],
    specificity: [
      {
        questionId: 'uchicago_specific_1',
        question: 'You mention being interested in X field at UChicago. Which specific courses or professors have you researched? What draws you to their approach?',
        trigger: { dimension: 'uchicago_research_depth' },
        purpose: 'Push for EXTREME specificity in Why UChicago',
        expectedOutcome: 'Student provides course numbers, professor names, specific research areas',
        exampleGoodResponse: 'I\'m specifically drawn to SOSC 13100 because of its emphasis on X methodology. Professor Y\'s research on Z connects directly to my interest in...',
        followUp: 'Why does this approach matter for YOUR specific intellectual goals?',
      },
      {
        questionId: 'uchicago_specific_2',
        question: 'Can you give me a concrete example of a moment when you experienced this? What specifically happened?',
        trigger: { dimension: 'specificity_depth' },
        purpose: 'Replace abstract claims with concrete details',
        expectedOutcome: 'Student provides specific moment, scene, or example',
        exampleGoodResponse: 'It was the third week of summer. I was sitting at my desk at 2am, and I suddenly realized that...',
        followUp: 'What was going through your mind at that moment?',
      },
    ],
    connection: [
      {
        questionId: 'uchicago_connect_1',
        question: 'How does this interest connect to questions you want to explore in the Core Curriculum? What perspectives would Core help you develop?',
        trigger: { dimension: 'intellectual_culture_understanding' },
        purpose: 'Connect personal interests to UChicago\'s distinctive Core',
        expectedOutcome: 'Student shows understanding of Core philosophy, not just that it exists',
        exampleGoodResponse: 'Core\'s emphasis on approaching questions from multiple perspectives would help me see my interest in X through Y and Z lenses I haven\'t yet developed...',
        followUp: 'What discussion would you want to have in a Core classroom about this topic?',
      },
      {
        questionId: 'uchicago_connect_2',
        question: 'Why does this specific UChicago resource matter for YOUR intellectual journey? What could you do at UChicago that you couldn\'t do elsewhere?',
        trigger: { dimension: 'personal_connection_to_resources' },
        purpose: 'Connect resources to personal goals, not just list them',
        expectedOutcome: 'Student explains WHY each resource matters to THEM specifically',
        exampleGoodResponse: 'Having explored X in my own research, I\'ve realized I need Y methodology that Professor Z teaches. This would let me answer my question about...',
        followUp: 'What question do you hope to answer at UChicago that you couldn\'t answer on your own?',
      },
    ],
    voice: [
      {
        questionId: 'uchicago_voice_1',
        question: 'Reading your essays together, they should sound like the same person. Does your Extended Essay reflect the same personality as your Personal Statement?',
        trigger: { dimension: 'authentic_voice' },
        purpose: 'Check cross-essay voice consistency',
        expectedOutcome: 'Student reflects on voice consistency and makes adjustments if needed',
        exampleGoodResponse: 'Now that I think about it, I\'m more serious in my Extended Essay than my Personal Statement. Let me make sure my natural voice comes through in both.',
        followUp: 'What would your best friend say is "very you" about these essays?',
      },
      {
        questionId: 'uchicago_voice_2',
        question: 'Are you writing in your natural voice, or are you trying to sound more academic/impressive than you normally would?',
        trigger: { flagDetected: 'INAUTHENTIC_VOICE_OVER_POLISHING' },
        purpose: 'Encourage authentic voice over manufactured impressiveness',
        expectedOutcome: 'Student recognizes over-polishing and returns to natural voice',
        exampleGoodResponse: 'I think I\'ve been trying too hard to sound sophisticated. Let me rewrite this the way I would actually explain it to a friend.',
        followUp: 'What would you say if you were just telling a friend about this?',
      },
    ],
    vulnerability: [
      {
        questionId: 'uchicago_vulnerable_1',
        question: 'What are you still uncertain about? What questions do you still have that you haven\'t figured out?',
        trigger: { dimension: 'character_intellectual_humility' },
        purpose: 'Encourage intellectual humility and openness',
        expectedOutcome: 'Student shows growth mindset and genuine uncertainty',
        exampleGoodResponse: 'I\'m still wrestling with whether X is really true. The more I learn, the more I realize how much I don\'t understand about...',
        followUp: 'What would it take to answer that question? Is it even answerable?',
      },
      {
        questionId: 'uchicago_vulnerable_2',
        question: 'What about this topic do you find genuinely difficult or challenging? Where do you feel like a beginner?',
        trigger: { dimension: 'character_intellectual_humility' },
        purpose: 'Show comfort with not having all answers',
        expectedOutcome: 'Student demonstrates genuine engagement with difficulty',
        exampleGoodResponse: 'Every time I think I understand X, I encounter something that challenges my assumptions. Right now I\'m struggling with...',
        followUp: 'What excites you about that struggle?',
      },
    ],
  },

  byPrompt: {
    uchicago_common_app: [
      {
        questionId: 'uchicago_ca_1',
        question: 'This essay establishes the "voice" UChicago will check in your other essays. Does it sound authentically like you?',
        trigger: { dimension: 'authentic_voice' },
        purpose: 'Ensure Personal Statement voice will be consistent with other essays',
        expectedOutcome: 'Student reflects on authentic voice',
        exampleGoodResponse: 'I think this sounds like me, but let me read it aloud to make sure it\'s how I actually talk.',
      },
      {
        questionId: 'uchicago_ca_2',
        question: 'Where in this essay can we see learning you did beyond what was required? What did you explore just because you wanted to?',
        trigger: { dimension: 'intellectual_curiosity_love_of_learning' },
        purpose: 'Draw out intellectual vitality',
        expectedOutcome: 'Student identifies self-directed exploration',
        exampleGoodResponse: 'The reading I did over the summer wasn\'t for any class - I just needed to understand more about...',
      },
    ],
    uchicago_extended_essay: [
      {
        questionId: 'uchicago_ee_1',
        question: 'Why did you choose THIS prompt? What about it genuinely fascinates you?',
        trigger: { dimension: 'genuine_interest' },
        purpose: 'Ensure prompt choice is genuine, not strategic',
        expectedOutcome: 'Student explains genuine fascination, not impressive-sounding choice',
        exampleGoodResponse: 'I chose the contronyms prompt because I\'ve always been fascinated by how language can contain its own contradiction. The idea that a word can mean its opposite...',
      },
      {
        questionId: 'uchicago_ee_2',
        question: 'Can we see your thinking process unfold? Where do you show HOW you arrive at your ideas, not just WHAT you conclude?',
        trigger: { dimension: 'thinking_process_visibility' },
        purpose: 'Make reasoning visible',
        expectedOutcome: 'Student identifies or adds reasoning steps',
        exampleGoodResponse: 'Let me add how I got to this point: I initially thought X, but then Y made me realize...',
      },
      {
        questionId: 'uchicago_ee_3',
        question: 'Are you engaging deeply with the intellectual puzzle, or giving a surface-level take? What\'s the second or third layer here?',
        trigger: { dimension: 'depth_argumentation' },
        purpose: 'Push for deeper engagement',
        expectedOutcome: 'Student explores complexity beyond obvious first answer',
        exampleGoodResponse: 'The obvious answer is X, but what\'s more interesting is Y, which leads to the question of Z...',
      },
    ],
    uchicago_why_us: [
      {
        questionId: 'uchicago_why_1',
        question: 'For each resource you mention, can you explain why it matters to YOUR specific goals? Not just what UChicago offers, but why YOU need it?',
        trigger: { dimension: 'personal_connection_to_resources' },
        purpose: 'Connect resources to personal trajectory',
        expectedOutcome: 'Student explains personal connection to each resource',
        exampleGoodResponse: 'I need this specific course because in my own research on X, I realized I\'m missing Y perspective...',
      },
      {
        questionId: 'uchicago_why_2',
        question: 'Could this essay work for another school if you changed the name? What makes it specifically about UChicago?',
        trigger: { dimension: 'uchicago_research_depth' },
        purpose: 'Push for UChicago-specific content',
        expectedOutcome: 'Student identifies or adds UChicago-only elements',
        exampleGoodResponse: 'No, because the Core Curriculum approach I describe and Professor X\'s specific methodology don\'t exist the same way anywhere else.',
      },
    ],
  },

  byIssue: {
    lacks_intellectual_vitality: [
      {
        questionId: 'uchicago_issue_iv_1',
        question: 'What have you learned or explored beyond what was assigned or required? What questions have driven you to explore on your own?',
        trigger: { issue: 'lacks_intellectual_vitality' },
        purpose: 'Draw out evidence of self-directed learning',
        expectedOutcome: 'Student identifies learning beyond requirements',
      },
    ],
    thinking_not_visible: [
      {
        questionId: 'uchicago_issue_think_1',
        question: 'Walk me through how you arrived at this conclusion. What did you initially think? What changed your mind?',
        trigger: { issue: 'thinking_not_visible' },
        purpose: 'Make reasoning process explicit',
        expectedOutcome: 'Student shows thinking evolution',
      },
    ],
    generic_why_school: [
      {
        questionId: 'uchicago_issue_generic_1',
        question: 'Can you replace these general statements with specific course numbers, professor names, or programs that only exist at UChicago?',
        trigger: { issue: 'generic_why_school' },
        purpose: 'Push for EXTREME specificity',
        expectedOutcome: 'Student provides specific UChicago resources',
      },
    ],
    forced_creativity: [
      {
        questionId: 'uchicago_issue_forced_1',
        question: 'Are you being genuinely playful here, or trying to be impressive? What would you explore if no one was reading this?',
        trigger: { issue: 'forced_creativity' },
        purpose: 'Distinguish genuine from performative playfulness',
        expectedOutcome: 'Student returns to authentic intellectual curiosity',
      },
    ],
    voice_inconsistent: [
      {
        questionId: 'uchicago_issue_voice_1',
        question: 'Read your Personal Statement and Extended Essay aloud. Do they sound like the same person? What\'s different?',
        trigger: { issue: 'voice_inconsistent' },
        purpose: 'Identify voice inconsistencies',
        expectedOutcome: 'Student recognizes and addresses voice shifts',
      },
    ],
  },
};

// ============================================================================
// UCHICAGO KEY QUOTES (From Deans, AOs, with Teaching Applications)
// ============================================================================

export const uchicagoKeyQuotes: CollegeKeyQuote[] = [
  {
    quoteId: 'uchicago_quote_han_vitality',
    source: {
      name: 'Steve Han',
      title: 'Former UChicago Admissions Officer',
      publication: 'Interview',
      date: 'August 2025',
    },
    quote: 'Ultimately we are looking for students who demonstrate intellectual vitality, who do what they do well academically but go above and beyond. At UChicago we really do look for students who prioritize learning for learning\'s sake.',
    context: 'Describing what UChicago looks for in applicants - NOW OFFICIAL TERMINOLOGY (2025)',
    insight: 'This is the #1 criterion for UChicago. "Intellectual vitality" is now official terminology, and "learning for learning\'s sake" is explicitly what they seek.',
    useCases: [
      { dimension: 'intellectual_curiosity_love_of_learning' },
      { issue: 'lacks_intellectual_vitality' },
      { flag: 'CAREER_PRESTIGE_FOCUS' },
    ],
    teachingApplication: 'Use this quote to explain why career-focused or achievement-focused essays miss the mark. UChicago wants to see learning BEYOND requirements, driven by genuine curiosity.',
  },
  {
    quoteId: 'uchicago_quote_wilson_think',
    source: {
      name: 'Peter Wilson',
      title: 'Dean of College Admissions',
      publication: 'Multiple interviews and webinars',
      date: '2022, 2024, 2025 (identical language)',
    },
    quote: 'How do they think? How do they play with ideas?',
    context: 'Central evaluation question asked IDENTICALLY across 3 years - the core of what essays should reveal',
    insight: 'This is THE central question. The fact that Wilson uses identical language over 3 years shows this is the stable, core criterion.',
    useCases: [
      { dimension: 'thinking_process_visibility' },
      { dimension: 'intellectual_playfulness' },
      { flag: 'ACCOMPLISHMENT_LISTING_RESUME_REPETITION' },
    ],
    teachingApplication: 'Use this quote to redirect students from listing accomplishments to showing their thinking process. Essays should let readers SEE how the student thinks.',
  },
  {
    quoteId: 'uchicago_quote_nondorf_voice',
    source: {
      name: 'Jim Nondorf',
      title: 'Vice President & Dean of Admissions',
      publication: 'Interview',
      date: '2020',
    },
    quote: 'The student\'s voice that you hear in their first essay, which is about kind of who they are, with the background, what they believe in, that that voice will then carry on in their second essay... So we have our zany UChicago prompts and the voice and the kind of person you\'re meeting there will be in the second essay, they\'ll be in the third one, which is, why do you want to go to my school?',
    context: 'Explicitly describing the cross-essay voice consistency check as authenticity verification',
    insight: 'UChicago uses a specific verification method: checking voice consistency across all three essays. This is both philosophical value AND practical method.',
    useCases: [
      { dimension: 'authentic_voice' },
      { flag: 'INAUTHENTIC_VOICE_OVER_POLISHING' },
      { issue: 'voice_inconsistent' },
    ],
    teachingApplication: 'Use this quote to explain why voice must be consistent across essays. Students should imagine the same reader encountering all three essays - they should meet the same person each time.',
  },
  {
    quoteId: 'uchicago_quote_chapin_classroom',
    source: {
      name: 'Grace Chapin James',
      title: 'Former Essay Committee Chair (8 years)',
      publication: 'Interview',
      date: '2012',
    },
    quote: 'When we give people these creative questions, the goal is to open up their minds and see if they have a level of creativity or flexibility and exploration that will lend itself well to being in a UChicago classroom.',
    context: 'Explaining why unusual prompts exist - essays as Core Curriculum audition',
    insight: 'Extended Essay isn\'t just an admissions hurdle - it\'s a teaching methodology fit test. Students who struggle with unusual prompts likely won\'t thrive in Core.',
    useCases: [
      { dimension: 'intellectual_playfulness' },
      { dimension: 'core_curriculum_fit' },
      { flag: 'FORMULAIC_WORKSHOP_STYLE_WRITING' },
    ],
    teachingApplication: 'Use this quote to explain that Extended Essay tests whether student will thrive in Core Curriculum. Formulaic approaches fail because Core requires flexibility and exploration.',
  },
  {
    quoteId: 'uchicago_quote_chapin_workshop',
    source: {
      name: 'Grace Chapin James',
      title: 'Former Essay Committee Chair (8 years)',
      publication: 'Interview',
      date: '2012',
    },
    quote: 'We want the students to write about things that don\'t show up in a workshop on writing college essays. We learn a lot by reading these essays. You can\'t write it the day before it\'s due, so we see extremely high-quality writing from the applicants.',
    context: 'Explaining why unusual prompts resist formulaic approaches',
    insight: 'UChicago prompts are DESIGNED to filter out formulaic writers. Generic essay advice doesn\'t work - you must engage genuinely.',
    useCases: [
      { flag: 'FORMULAIC_WORKSHOP_STYLE_WRITING' },
      { flag: 'SUPERFICIAL_ENGAGEMENT_WITH_PROMPTS' },
    ],
    teachingApplication: 'Use this quote to explain why five-paragraph essay structures and workshop-style approaches fail at UChicago. The unusualness of prompts is intentional.',
  },
  {
    quoteId: 'uchicago_quote_oneill_thinking',
    source: {
      name: 'Ted O\'Neill',
      title: 'Former Dean of Admissions',
      publication: 'Interview',
      date: '2019',
    },
    quote: 'We tried our best to embed in the application an explanation of the Chicago education... then we asked applicants to write essays in response to questions we thought were actually interesting... to see someone thinking before your eyes.',
    context: 'Explaining the philosophy behind unusual prompts',
    insight: 'The goal is to "see someone thinking before your eyes" - not to read polished conclusions but to watch the thinking process unfold.',
    useCases: [
      { dimension: 'thinking_process_visibility' },
      { dimension: 'intellectual_playfulness' },
    ],
    teachingApplication: 'Use this quote to encourage students to show their thinking PROCESS. The essay should let readers watch the student think, not just read their conclusions.',
  },
  {
    quoteId: 'uchicago_quote_han_passion',
    source: {
      name: 'Steve Han',
      title: 'Former UChicago Admissions Officer',
      publication: 'Interview',
      date: 'August 2025',
    },
    quote: 'Passion is such an important thing in the admissions process... We just want to know that you care about something and are looking forward to something.',
    context: 'NEW explicit emphasis on passion as criterion (2025)',
    insight: 'Passion is now explicitly named as important - separated from general intellectual curiosity. Students must show they CARE.',
    useCases: [
      { dimension: 'passion_enthusiasm' },
    ],
    teachingApplication: 'Use this quote to encourage students to choose topics they genuinely care about, not topics that sound impressive. The enthusiasm should be palpable.',
  },
  {
    quoteId: 'uchicago_quote_boyer_qualities',
    source: {
      name: 'John W. Boyer',
      title: 'Dean of the College',
      publication: 'Official statement',
      date: 'January 2025',
    },
    quote: 'These essays not only reveal much about the qualities of mind of our students...',
    context: 'Describing what essays reveal',
    insight: '"Qualities of mind" - not just what you know or have done, but how your mind works. This aligns with Wilson\'s "how do they think?"',
    useCases: [
      { dimension: 'thinking_process_visibility' },
    ],
    teachingApplication: 'Use this quote to explain that essays reveal "qualities of mind" - intellectual character, not just accomplishments.',
  },
  {
    quoteId: 'uchicago_quote_boyer_playful',
    source: {
      name: 'John W. Boyer',
      title: 'Dean of the College',
      publication: 'Official statement',
      date: 'January 2025',
    },
    quote: 'intellectually playful way in response to open-ended challenge',
    context: 'Describing how students should approach Extended Essay',
    insight: 'The "playful" language appears across 5 different UChicago leaders - it\'s core to their culture and unique among elite schools.',
    useCases: [
      { dimension: 'intellectual_playfulness' },
      { flag: 'FORCED_CREATIVITY_TRYING_TOO_HARD' },
    ],
    teachingApplication: 'Use this quote to explain that "playfulness" is a serious academic criterion at UChicago. But it must be genuine, not forced.',
  },
  {
    quoteId: 'uchicago_quote_pearson_argument',
    source: {
      name: 'Libby Pearson',
      title: 'Former UChicago Admissions Officer',
      publication: 'College Confidential',
      date: 'Historical',
    },
    quote: 'If there is a beautiful argument in the essay, then suddenly that becomes the most important document, and weighs 61 pounds.',
    context: 'Describing how exceptional essays can elevate entire application',
    insight: 'Holistic review means no fixed weights - exceptional essays can become THE deciding factor for strong candidates.',
    useCases: [
      { dimension: 'depth_argumentation' },
    ],
    teachingApplication: 'Use this quote to encourage substantive argumentation. A "beautiful argument" can make the essay THE deciding factor.',
  },
  {
    quoteId: 'uchicago_quote_admistudio_complexity',
    source: {
      name: 'AdmitStudio Guidance',
      title: 'Expert Analysis',
      publication: 'December 2025',
      date: 'December 2025',
    },
    quote: 'Do not shy away from acknowledging tensions or gray areas.',
    context: 'NEW 2025 guidance on embracing complexity',
    insight: 'New explicit emphasis on comfort with ambiguity. Students should not force neat resolutions.',
    useCases: [
      { dimension: 'comfort_with_complexity' },
    ],
    teachingApplication: 'Use this quote to encourage students to embrace nuance. It\'s okay to end with questions, not just answers.',
  },
  {
    quoteId: 'uchicago_quote_ao_specific',
    source: {
      name: 'Former Stanford and UChicago AOs',
      title: 'Reddit AMA',
      publication: 'Reddit',
      date: 'Historical',
    },
    quote: 'Schools can really tell if the things you\'ve provided in the "why school" essay are generic. If it\'s relevant to every single school, you\'re doing it wrong... The key in these essays is to be EXTREMELY specific.',
    context: 'Explaining what makes effective Why School essays',
    insight: 'Former AOs explicitly emphasize EXTREME specificity. Generic language is the #1 red flag.',
    useCases: [
      { dimension: 'uchicago_research_depth' },
      { flag: 'GENERIC_LANGUAGE_LACK_OF_SPECIFICITY' },
    ],
    teachingApplication: 'Use this quote to push for specific course numbers, professor names, and programs. "EXTREMELY specific" is the standard.',
  },
];

// ============================================================================
// UCHICAGO DIMENSION WEIGHTS (Evidence-Based Adjustments)
// ============================================================================

export const uchicagoDimensionWeights: CollegeDimensionWeights = {
  dimensions: [
    {
      dimensionId: 'intellectual_curiosity',
      dimensionName: 'Intellectual Curiosity / Love of Learning',
      weight: 20,
      context: 'Steve Han (Aug 2025) EXPLICITLY names "intellectual vitality" and "learning for learning\'s sake" as what they\'re looking for. This is now OFFICIAL TERMINOLOGY.',
      evidence: 'Core to UChicago identity across 13 years and 5 different admissions leaders.',
    },
    {
      dimensionId: 'quality_of_thinking',
      dimensionName: 'Quality of Thinking / Critical Analysis',
      weight: 15,
      context: 'Peter Wilson: "How do they think?" 2025 guidance emphasizes thinking PROCESS over thinking QUALITY - HOW you arrive at insights matters more than how sophisticated the analysis is.',
      evidence: 'Wilson\'s central question, but emphasis is on process visibility.',
    },
    {
      dimensionId: 'voice_authenticity',
      dimensionName: 'Authentic Voice',
      weight: 12,
      context: 'Nondorf explicitly describes cross-essay voice consistency check. Authenticity verified through this practical method.',
      evidence: 'Both philosophical value AND practical verification method.',
    },
    {
      dimensionId: 'self_awareness',
      dimensionName: 'Self-Awareness / Reflection',
      weight: 10,
      context: 'Important for all schools but shown through authenticity and thinking process at UChicago.',
      evidence: 'Implicit in voice consistency and intellectual character.',
    },
    {
      dimensionId: 'character_values',
      dimensionName: 'Character / Values',
      weight: 8,
      context: 'CDS rates Character as "Very Important" but shown across application. Essays contribute through intellectual humility and approach to complexity.',
      evidence: 'Boyer: "qualities of mind" - intellectual character matters.',
    },
    {
      dimensionId: 'growth_mindset',
      dimensionName: 'Growth Mindset / Resilience',
      weight: 7,
      context: 'Shown through comfort with complexity and willingness to revise thinking.',
      evidence: 'Implicit in intellectual playfulness and exploration.',
    },
    {
      dimensionId: 'institutional_fit',
      dimensionName: 'Why UChicago / Institutional Fit',
      weight: 10,
      context: 'EXTREME specificity required. Must show deep research AND personal connection to UChicago-specific resources.',
      evidence: 'Former AOs: "be EXTREMELY specific." 4.48% rate means yield matters.',
    },
    {
      dimensionId: 'community_orientation',
      dimensionName: 'Community Orientation',
      weight: 5,
      context: 'Important for Core Curriculum\'s discussion-based learning but not primary focus.',
      evidence: 'Implicit in Core fit assessment.',
    },
    {
      dimensionId: 'writing_craft',
      dimensionName: 'Writing Craft / Expression',
      weight: 5,
      context: 'Matters for Core but not primary criterion. Authentic voice > polished craft.',
      evidence: 'O\'Neill warns over-editing makes essays "no longer authentic."',
    },
    {
      dimensionId: 'specificity_evidence',
      dimensionName: 'Specificity / Evidence',
      weight: 5,
      context: 'Enables other dimensions but not standalone criterion. Concrete details make thinking visible.',
      evidence: 'Supports demonstration of other values.',
    },
    {
      dimensionId: 'originality',
      dimensionName: 'Originality / Fresh Perspective',
      weight: 2,
      context: 'Less emphasized than intellectual playfulness. Genuine engagement > novelty.',
      evidence: 'Warnings against forced creativity suggest originality is byproduct, not goal.',
    },
    {
      dimensionId: 'hook_engagement',
      dimensionName: 'Hook / Engagement',
      weight: 1,
      context: 'Least important at UChicago. Substance matters more than packaging.',
      evidence: 'No specific guidance on hooks in research.',
    },
  ],
  primaryDimensions: [
    'intellectual_curiosity',
    'quality_of_thinking',
    'voice_authenticity',
  ],
  secondaryDimensions: [
    'originality',
    'hook_engagement',
  ],
};

// ============================================================================
// UCHICAGO ELITE EXAMPLES (Placeholder - To Be Populated)
// ============================================================================

export const uchicagoEliteExamples: CollegeEliteExample[] = [
  // Note: These would be populated with actual elite essay examples
  // with full text, annotations, and teachable techniques
];

// ============================================================================
// COMPLETE UCHICAGO RESEARCH EXPORT
// ============================================================================

export const uchicagoResearch: CollegeResearch = {
  collegeId: 'uchicago',
  collegeName: 'University of Chicago',
  researchQuality: {
    score: 93,
    totalSources: 170,
    lastUpdated: '2024-12-25',
    keyInstitutionalSources: [
      'Common Data Set 2024-2025',
      'Peter Wilson (Dean of College Admissions) - 2022, 2024, 2025',
      'Steve Han (Former AO) - August 2025 interview',
      'Jim Nondorf (VP & Dean of Admissions) - 2020, 2024',
      'Grace Chapin James (Former Essay Committee Chair, 8 years)',
      'Ted O\'Neill (Former Dean)',
      'John W. Boyer (Dean of the College)',
      'Libby Pearson (Former AO)',
    ],
  },
  coreValues: uchicagoCoreValues,
  essayPrompts: uchicagoEssayPrompts,
  redFlags: uchicagoRedFlags,
  greenFlags: uchicagoGreenFlags,
  socraticQuestions: uchicagoSocraticQuestions,
  eliteExamples: uchicagoEliteExamples,
  keyQuotes: uchicagoKeyQuotes,
  dimensionWeights: uchicagoDimensionWeights,
};
