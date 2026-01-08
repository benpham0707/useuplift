/**
 * Brown University - Comprehensive Essay Overlay
 *
 * Research Quality: 91/100 (EXCELLENT - Dean Powell Quotes, Open Curriculum Focus)
 * Total Sources: 90+ sources (21+ primary Brown sources)
 * Last Updated: 2024-12-27
 * CDS Reference: 2023-2024 (Essays rated "Very Important", Character rated "Very Important")
 *
 * PRIMARY SOURCES:
 * - Logan Powell (Dean of Admission) - Brown Daily Herald, BPR Interview, Official Statements
 * - Brown Common Data Set 2023-2024
 * - Brown Admission FAQ & Official Website
 * - Brown Pre-College Essay Tips
 * - CollegeTransitions - Brown Supplemental Essay Prompts
 * - Crimson Education - Brown Supplemental Essays
 * - InGenius Prep - Brown Supplemental Essays
 * - AdmissionSight - Brown Essays Analysis
 *
 * UNIQUE CHARACTERISTICS:
 * - Essays rated "Very Important" alongside GPA, rigor, character, recommendations
 * - Seven supplemental components: Open Curriculum, Background, Joy, 3 Words, EC, Teach, Why Brown
 * - "Demonstrated Interest" explicitly "Not Considered" - essays test research depth, not visits
 * - Open Curriculum is central value - essays must show self-directed learner
 * - Post-affirmative action: identity essays carry context for lived experience legally
 * - Brown is unusually essay-heavy among Ivies (3 full essays + 4 short answers)
 *
 * ESSAY PHILOSOPHY IN 3 WORDS: "Self-Directed Voice"
 *
 * KEY DISTINCTION FROM OTHER SCHOOLS:
 * - Harvard: Character-based impact ("make people better" through kindness)
 * - Stanford: Distinctive contribution (unique perspective from life experiences)
 * - UChicago: Intellectual impact (making people think better)
 * - MIT: Collaborative problem-solving (building things with others)
 * - USC: Authentic thinking voice (genuine reflection + analytical depth)
 * - Northwestern: Connected intellectual vision (linking past to future engagement)
 * - NYU: Bridge-building self-awareness (connecting diverse people/ideas)
 * - CMU: Intellectual maker curiosity (how you think + hands-on exploration)
 * - Brown: SELF-DIRECTED VOICE (authentic voice + Open Curriculum fit + identity reflection)
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
// BROWN CORE VALUES (Evidence-Based, Weighted by Source Frequency)
// ============================================================================

export const brownCoreValues: CollegeCoreValue[] = [
  {
    valueId: 'authentic_voice',
    valueName: 'Authentic Voice & Self-Authorship',
    weight: 25, // Brown's highest emphasis - Dean Powell's central message
    definition:
      'Brown wants to hear the student in their own voice, as clearly as they can possibly convey it. Over-coached, committee-voice essays are red flags. The writing should sound unmistakably student-authored.',
    essayImplication:
      'Write in your natural voice with your humor, cadence, and quirks. Don\'t ask "what do they want to read?" - ask "what do I think I want to say?" Over-polished, generic Ivy-speak is a negative signal even if technically well-written.',
    evidence: [
      {
        source: 'Logan Powell (Dean of Admission)',
        quote:
          'There are a lot of people in the college application process who want to weigh in with ideas and editorialize in a way that may change the tone of an essay to what they think we want to hear. But what we want is to hear the student in their own voice, as clearly as they can possibly convey it. Don\'t overthink it. Don\'t ask yourself, "what do we want to read?" Ask yourself, "what do I think I want to say?"',
        context: 'Brown Daily Herald - "The Supplement" (Oct 2021)',
      },
      {
        source: 'Brown Pre-College Essay Tips',
        quote:
          'Authenticity is key. Write in your natural voice… Don\'t force a tone that doesn\'t feel true to you. Remember, your essay is a reflection of who you are.',
        context: 'Brown Pre-College official guidance',
      },
      {
        source: 'Brown Pre-College Essay Tips',
        quote:
          'While their feedback is valuable, ensure that your unique voice shines through. Admissions officers want to hear from you, not someone else.',
        context: 'On proofreading and external input',
      },
    ],
    sourceMentionCount: 7,
    isNot: [
      'Polished 35-year-old consultant voice',
      'Generic Ivy-speak that could be anyone',
      'What you think Brown wants to hear',
      'Over-edited to blandness or pretension',
    ],
    is: [
      'Your natural humor, cadence, and quirks',
      'Self-concept in your own words',
      'How YOU think about yourself and the world',
      'Unmistakably student-authored writing',
    ],
  },
  {
    valueId: 'character_values',
    valueName: 'Character, Values & Personal Qualities',
    weight: 20, // CDS rates character as "Very Important"
    definition:
      'Brown explicitly rates Character/Personal Qualities as "Very Important" alongside essays. Essays are the primary vehicle to demonstrate values, integrity, empathy, humility, and growth mindset through stories, not assertions.',
    essayImplication:
      'Use stories that reveal how you treat people, what you stand for, and how you respond to challenge. Show values through ethical choices and reflections, not declarations. Your tone itself signals character.',
    evidence: [
      {
        source: 'Brown Common Data Set 2023-2024',
        quote:
          'Brown is one of the few schools that ranks both Talent/Ability and Character/Personal Qualities as "Very Important."',
        context: 'CDS Section C7 - Admission Factors',
      },
      {
        source: 'Logan Powell (Dean of Admission)',
        quote:
          'Essays remain at the heart of an application.',
        context: 'Brown Daily Herald on essay centrality',
      },
      {
        source: 'The Koppelman Group',
        quote:
          'Not only do they call the application essay "very important," but it is also a time to showcase your Personal Qualities/Characteristics.',
        context: 'How to Get into Brown University (Jan 2024)',
      },
    ],
    sourceMentionCount: 6,
    isNot: [
      'Listing traits without evidence',
      'Claiming virtues you cannot demonstrate',
      'Generic statements about being kind or hardworking',
      'Persona that conflicts with rest of application',
    ],
    is: [
      'Stories revealing ethical choices',
      'Reflection on how experiences shaped values',
      'Evidence of empathy and integrity',
      'Growth mindset shown through response to challenge',
    ],
  },
  {
    valueId: 'intellectual_curiosity',
    valueName: 'Intellectual Curiosity & Self-Direction',
    weight: 18, // Open Curriculum is Brown's signature
    definition:
      'Brown\'s Open Curriculum demands students who thrive with intellectual freedom and can design their own coherent academic path. Essays must demonstrate curiosity, independence, and how you will use the curriculum\'s flexibility.',
    essayImplication:
      'Show how you chase questions, design your own learning, and would thrive without rigid requirements. Reference specific Brown academic elements (courses, institutes, DUGs) that enable your path. Demonstrate self-direction, not just following requirements.',
    evidence: [
      {
        source: 'AdmissionSight - Brown Essays',
        quote:
          'Brown wants to see proof of your intellectual curiosity and how Brown\'s unique academic environment can help you with your pursuit of them.',
        context: 'Open Curriculum essay analysis',
      },
      {
        source: 'CollegeVine',
        quote:
          'Tell us about any academic interests that excite you, and how you might use the Open Curriculum to pursue them while also embracing topics with which you are unfamiliar.',
        context: 'Open Curriculum supplement guidance',
      },
      {
        source: 'Admissionado',
        quote:
          'Open Curriculum essay allows you to discuss your academic interests and how Brown\'s flexibility will support your pursuits.',
        context: 'Mastering the Brown Application Essay',
      },
    ],
    sourceMentionCount: 5,
    isNot: [
      'Needing rigid requirements to stay focused',
      'Generic "I love learning" statements',
      'Academic interests that could apply to any school',
      'Surface-level name-dropping of Brown programs',
    ],
    is: [
      'Cross-disciplinary exploration',
      'Questions you actively pursue',
      'Concrete Brown elements that enable your path',
      'Comfort with academic freedom',
    ],
  },
  {
    valueId: 'identity_perspective',
    valueName: 'Identity, Lived Experience & Perspective',
    weight: 15, // Post-affirmative action emphasis
    definition:
      'Brown uses essays to access lived experience (discrimination, hardship, inspiration) that cannot be read off the transcript. The background prompt explicitly asks how your upbringing shaped you and what contributions you bring.',
    essayImplication:
      'Reflect on where you come from, how it shaped you, and how that will shape Brown. Focus on 1-2 moments of inspiration or challenge. Connect to specific contributions you will make at Brown because of this background.',
    evidence: [
      {
        source: 'Logan Powell (Dean of Admission)',
        quote:
          'Any new questions would serve to offer applicants opportunities to share more information about their identity "to try to get a better sense of the lived experiences of discrimination or overcoming hardship that our students may face."',
        context: 'FAIR summary - Brown meeting on identity essays (Mar 2023)',
      },
      {
        source: 'Logan Powell (Dean of Admission)',
        quote:
          'The new supplemental essay is designed to allow students to reflect on moments of inspiration or challenge in their lives and how those moments shaped who they are. Each applicant has a unique set of experiences they can contribute to the Brown community, and we want to learn more about them.',
        context: 'Brown Daily Herald (July 2023) on new background essay',
      },
      {
        source: 'InGenius Prep',
        quote:
          'Brown University wants to see how you reflect on who you are now and who you aspire to be at Brown.',
        context: 'Writing the Brown Supplemental Essays',
      },
    ],
    sourceMentionCount: 5,
    isNot: [
      'Surface-level identity labels',
      'Trauma dumping without reflection',
      'Background that has no connection to contribution',
      'Generic diversity statements',
    ],
    is: [
      'Reflection on formative moments',
      'How background shaped your perspective',
      'Specific contributions to Brown community',
      'Growth from challenge or inspiration',
    ],
  },
  {
    valueId: 'community_contribution',
    valueName: 'Community Orientation & Collaboration',
    weight: 12, // Contribution language central to prompts
    definition:
      'Brown values students who build, serve, and change communities. Essays must show past impact and be concrete about how you will contribute at Brown - student groups, dialogue spaces, mentoring, perspectives in class.',
    essayImplication:
      'Tell stories of building, serving, or changing communities. Be specific about how you will contribute on College Hill. Connect your past community work to future Brown involvement.',
    evidence: [
      {
        source: 'Logan Powell (Dean of Admission)',
        quote:
          'Each applicant has a unique set of experiences they can contribute to the Brown community, and we want to learn more about them.',
        context: 'Brown Daily Herald on background essay',
      },
      {
        source: 'CollegeVine',
        quote:
          'Brown also values community… and creativity.',
        context: 'How to Get Into Brown',
      },
      {
        source: 'InGenius Prep',
        quote:
          'Brown University wants to see how you reflect on who you are now and who you aspire to be at Brown… specific contributions this might allow you to make.',
        context: 'Background essay analysis',
      },
    ],
    sourceMentionCount: 5,
    isNot: [
      'Solo achievements without community impact',
      'Generic statements about wanting to help',
      'Activities without evidence of contribution',
      'Future plans disconnected from past',
    ],
    is: [
      'Stories of building or changing communities',
      'Specific future contributions at Brown',
      'Evidence of impact on others',
      'Connection between past and future engagement',
    ],
  },
  {
    valueId: 'joy_resilience',
    valueName: 'Joy, Well-Being & Resilience',
    weight: 10, // Entire core prompt dedicated to this
    definition:
      'Brown dedicates an entire essay prompt to what brings you joy. Dean Powell emphasizes this is about how students find meaning in a "complicated and difficult world." It reveals sources of intrinsic motivation and resilience.',
    essayImplication:
      'Show what genuinely brings you joy (can be small, weird, or mundane). Explain why it matters and what it reveals about your values. Optionally connect to how this joy would surface at Brown and benefit community.',
    evidence: [
      {
        source: 'Logan Powell (Dean of Admission)',
        quote:
          'I would call the third essay "joy." In a really complicated and difficult world where there is a lot of anxiety and turmoil, there are still those things students do that bring them joy. We think it\'s important for them to take a moment and think about what those things are.',
        context: 'Brown Daily Herald on joy essay',
      },
      {
        source: 'Crimson Education',
        quote:
          'Brown\'s three key essay prompts are designed to give admissions officers deeper insights into… your inner resilience (such as how you find joy).',
        context: 'Brown Supplemental Essays Guide',
      },
      {
        source: 'AdmissionSight',
        quote:
          'The joy prompt reveals sources of intrinsic motivation and well-being – what sustains you emotionally and intellectually.',
        context: 'Brown joy essay analysis',
      },
    ],
    sourceMentionCount: 4,
    isNot: [
      'Resume achievements disguised as joy',
      'What you think sounds impressive',
      'Activities without emotional connection',
      'Generic happiness statements',
    ],
    is: [
      'Genuine sources of delight and meaning',
      'How you sustain yourself amid difficulty',
      'Gratitude and appreciation for the everyday',
      'Resilience shown through finding joy',
    ],
  },
];

// ============================================================================
// BROWN ESSAY PROMPTS (Current 2024-2025 Cycle)
// ============================================================================

export const brownEssayPrompts: CollegeEssayPrompt[] = [
  {
    promptId: 'open_curriculum',
    promptText:
      'Brown\'s Open Curriculum allows students to explore broadly while also diving deeply into their academic pursuits. Tell us about any academic interests that excite you, and how you might pursue them at Brown. (200-250 words)',
    wordLimit: 250,
    requiredOrOptional: 'required',
    essayPattern: 'intellectual_curiosity',
    whatItReveals: [
      'Intellectual curiosity and independence',
      'Understanding of Open Curriculum and academic planning',
      'Fit with Brown\'s cross-disciplinary ethos',
      'Self-direction and comfort with freedom',
    ],
    rubricCriteria: [
      {
        criterion: 'Specific Academic Interests',
        weight: 30,
        excellent:
          'Names 1-2 specific fields with genuine fascination, shows how interest developed over time, asks questions within the field',
        adequate:
          'Mentions academic interests but lacks specificity or development story',
        weak:
          'Generic "I love learning" or broad field mentions without depth',
      },
      {
        criterion: 'Open Curriculum Understanding',
        weight: 25,
        excellent:
          'Demonstrates understanding of how freedom enables their specific path, mentions concrete Brown elements (courses, institutes, DUGs)',
        adequate:
          'References Open Curriculum but without specific application to their interests',
        weak:
          'Generic praise of flexibility that could apply to any school',
      },
      {
        criterion: 'Cross-Disciplinary Thinking',
        weight: 25,
        excellent:
          'Shows natural tendency to connect ideas across fields, explains why Brown\'s breadth + depth model fits their learning style',
        adequate:
          'Mentions interest in multiple areas but without explaining connections',
        weak:
          'Single-track focus that doesn\'t leverage Open Curriculum',
      },
      {
        criterion: 'Self-Direction Evidence',
        weight: 20,
        excellent:
          'Demonstrates comfort designing own path, shows initiative beyond requirements, explains how they\'d use freedom productively',
        adequate:
          'Some evidence of self-direction but relies on external structure',
        weak:
          'No evidence of thriving with freedom, seems to need requirements',
      },
    ],
    promptSpecificRedFlags: [
      'Generic statements that could apply to any college',
      'Name-dropping Brown programs without genuine connection',
      'Saying "Open Curriculum" without demonstrating understanding',
      'Academic interests that seem forced or calculated',
    ],
    promptSpecificGreenFlags: [
      'Specific Brown courses, institutes, or DUGs that enable their path',
      'Questions they\'re actively pursuing within their field',
      'Natural cross-disciplinary connections',
      'Evidence of self-directed exploration beyond classroom',
    ],
  },
  {
    promptId: 'background_identity',
    promptText:
      'Students entering Brown often find that making their home on College Hill naturally invites reflection on where they came from. Share how an aspect of your growing up has inspired or challenged you, and what unique contributions this might allow you to make to the Brown community. (200-250 words)',
    wordLimit: 250,
    requiredOrOptional: 'required',
    essayPattern: 'diversity_perspective',
    whatItReveals: [
      'Identity and lived experience',
      'Growth from challenge or inspiration',
      'Ability to connect personal story to community impact',
      'Reflection and self-awareness',
    ],
    rubricCriteria: [
      {
        criterion: 'Focused Aspect of Background',
        weight: 25,
        excellent:
          'Chooses one specific aspect of upbringing (family practice, local context, school environment, etc.) and explores it deeply',
        adequate:
          'Mentions background but tries to cover too much ground',
        weak:
          'Generic background description without specific focus',
      },
      {
        criterion: 'Inspiration or Challenge',
        weight: 25,
        excellent:
          'Clearly shows how aspect inspired or challenged them, includes 1-2 specific moments that demonstrate transformation',
        adequate:
          'Mentions challenge or inspiration but without specific moments',
        weak:
          'Lists circumstances without showing impact on self',
      },
      {
        criterion: 'Reflection and Growth',
        weight: 25,
        excellent:
          'Demonstrates deep self-awareness, explains how they\'ve changed, shows growth mindset',
        adequate:
          'Some reflection but surface-level insights',
        weak:
          'Narrates experience without interpretation',
      },
      {
        criterion: 'Specific Contribution to Brown',
        weight: 25,
        excellent:
          'Names specific ways they\'ll contribute (student groups, dialogue spaces, mentoring, perspectives in class)',
        adequate:
          'Vague sense of contribution without specifics',
        weak:
          'No connection between background and future contribution',
      },
    ],
    promptSpecificRedFlags: [
      'Trauma dumping without reflection or growth',
      'Background that has no connection to contribution',
      'Generic diversity statements',
      'Surface-level identity labels without meaning',
    ],
    promptSpecificGreenFlags: [
      'Specific moments of transformation',
      'Clear connection between past and future contribution',
      'Self-awareness about how background shaped perspective',
      'Named Brown communities where they\'ll contribute',
    ],
  },
  {
    promptId: 'joy',
    promptText:
      'Brown students care deeply about their work and the world around them. Tell us about something that brings you joy. (200-250 words)',
    wordLimit: 250,
    requiredOrOptional: 'required',
    essayPattern: 'meaningful_activity',
    whatItReveals: [
      'Sources of intrinsic motivation and well-being',
      'Capacity for gratitude and meaning in everyday',
      'Resilience and perspective',
      'What sustains the student emotionally and intellectually',
    ],
    rubricCriteria: [
      {
        criterion: 'Genuine Joy',
        weight: 30,
        excellent:
          'Describes something that clearly brings authentic delight, can be small, weird, or mundane - feels real not calculated',
        adequate:
          'Joy source seems genuine but lacks vivid detail',
        weak:
          'Describes resume achievement as "joy" or sounds calculated',
      },
      {
        criterion: 'Why It Matters',
        weight: 25,
        excellent:
          'Explains the deeper meaning - what this joy reveals about their values and way of being',
        adequate:
          'Some explanation but doesn\'t reach deeper meaning',
        weak:
          'Just describes the joy without reflection',
      },
      {
        criterion: 'Specificity and Vividness',
        weight: 25,
        excellent:
          'Uses sensory details and specific moments to make the joy come alive for reader',
        adequate:
          'Some specific details but could be more vivid',
        weak:
          'Generic description that could be anyone',
      },
      {
        criterion: 'Resilience Subtext',
        weight: 20,
        excellent:
          'Subtly shows how this joy sustains them through difficulty, connects to perspective amid challenges',
        adequate:
          'Some sense of joy as meaningful but no resilience element',
        weak:
          'Joy seems disconnected from broader life context',
      },
    ],
    promptSpecificRedFlags: [
      'Resume achievements disguised as joy',
      'What you think sounds impressive',
      'Generic happiness statements',
      'Joy that seems calculated to impress',
    ],
    promptSpecificGreenFlags: [
      'Authentic delight that reveals character',
      'Something small or unexpected',
      'Connection to how they treat others or approach life',
      'Subtle tie-in to how joy surfaces at Brown',
    ],
  },
  {
    promptId: 'three_words',
    promptText: 'What three words best describe you?',
    wordLimit: 3,
    requiredOrOptional: 'required',
    essayPattern: 'short_answer',
    whatItReveals: [
      'Self-concept in high resolution',
      'Nuance and creativity of word choice',
      'Ability to synthesize identity',
      'Alignment with rest of application',
    ],
    rubricCriteria: [
      {
        criterion: 'Specificity Over Generic',
        weight: 40,
        excellent:
          'Words are specific and non-generic (e.g., "inquisitive, empathetic, catalyst" vs "smart, hardworking, kind")',
        adequate:
          'Mix of specific and generic words',
        weak:
          'All generic words that could describe anyone',
      },
      {
        criterion: 'Application Alignment',
        weight: 35,
        excellent:
          'Each word aligns with visible pattern in activities, essays, and overall narrative',
        adequate:
          'Some alignment but not all words supported',
        weak:
          'Words contradict or have no evidence in application',
      },
      {
        criterion: 'Creativity and Memorability',
        weight: 25,
        excellent:
          'Word choices are memorable and reveal something distinctive',
        adequate:
          'Competent but forgettable',
        weak:
          'Cliché choices that blur together',
      },
    ],
    promptSpecificRedFlags: [
      'Generic words like "hardworking, smart, kind"',
      'Words that contradict rest of application',
      'Trying too hard to be quirky',
    ],
    promptSpecificGreenFlags: [
      'Specific words that reveal distinctive self-concept',
      'Each word supported by application evidence',
      'Memorable and authentic',
    ],
  },
  {
    promptId: 'meaningful_ec',
    promptText:
      'What is your most meaningful extracurricular commitment, and what would you like us to know about it? (100 words)',
    wordLimit: 100,
    requiredOrOptional: 'required',
    essayPattern: 'meaningful_activity',
    whatItReveals: [
      'Depth and meaning of involvement',
      'What activity reveals about character and values',
      'Impact and growth, not just title',
    ],
    rubricCriteria: [
      {
        criterion: 'Meaning Over Title',
        weight: 40,
        excellent:
          'Focuses on what the activity means to them and what they\'ve learned, not on titles or achievements',
        adequate:
          'Some meaning but too much focus on accomplishments',
        weak:
          'Just restates activities list with titles',
      },
      {
        criterion: 'Specific Moment or Impact',
        weight: 35,
        excellent:
          'Includes a specific moment that crystallizes the meaning or shows impact',
        adequate:
          'General description without specific moments',
        weak:
          'No evidence of personal connection or impact',
      },
      {
        criterion: 'Values Revealed',
        weight: 25,
        excellent:
          'Clearly shows what values or growth came from the activity',
        adequate:
          'Some hint of values but not clearly articulated',
        weak:
          'No connection to personal growth or values',
      },
    ],
    promptSpecificRedFlags: [
      'Restating activities list',
      'Focus on titles and positions',
      'Generic "leadership" or "teamwork" claims',
    ],
    promptSpecificGreenFlags: [
      'Specific moment of growth or impact',
      'Clear values revealed',
      'Authentic emotional connection',
    ],
  },
  {
    promptId: 'teach_class',
    promptText:
      'If you could teach a class on any one thing, whether academic or otherwise, what would it be? (100 words)',
    wordLimit: 100,
    requiredOrOptional: 'required',
    essayPattern: 'intellectual_curiosity',
    whatItReveals: [
      'Passion and creativity',
      'Ability to intellectualize what you love',
      'How you would share knowledge with peers',
      'Communication and community mindset',
    ],
    rubricCriteria: [
      {
        criterion: 'Authentic Passion',
        weight: 35,
        excellent:
          'Topic is genuinely them, not what sounds impressive; easy to imagine them teaching with enthusiasm',
        adequate:
          'Topic seems genuine but lacks energy',
        weak:
          'Topic seems calculated to impress',
      },
      {
        criterion: 'Teaching Approach',
        weight: 35,
        excellent:
          'Briefly describes how they\'d teach and what students would gain; shows ability to share knowledge thoughtfully',
        adequate:
          'Mentions the topic but doesn\'t show teaching approach',
        weak:
          'No sense of how they\'d actually teach this',
      },
      {
        criterion: 'Creativity',
        weight: 30,
        excellent:
          'Topic is unexpected or approach is creative; memorable choice',
        adequate:
          'Reasonable topic but not particularly memorable',
        weak:
          'Obvious or cliché choice',
      },
    ],
    promptSpecificRedFlags: [
      'Topic chosen to sound impressive',
      'No teaching approach evident',
      'Generic or obvious choice',
    ],
    promptSpecificGreenFlags: [
      'Unexpected or personal topic',
      'Clear sense of how they\'d engage students',
      'Community-building mindset evident',
    ],
  },
  {
    promptId: 'why_brown_sentence',
    promptText: 'In one sentence, Why Brown? (50 words)',
    wordLimit: 50,
    requiredOrOptional: 'required',
    essayPattern: 'why_this_school',
    whatItReveals: [
      'Precision and prioritization',
      'Depth of research and fit',
      'Synthesis of academic, personal, and ethos fit',
      'What ONE thing matters most about Brown to you',
    ],
    rubricCriteria: [
      {
        criterion: 'Brown-Specific Features',
        weight: 40,
        excellent:
          'Names 1-2 Brown-only features that could not be copy-pasted to another school; shows genuine research',
        adequate:
          'References Brown but features could apply to similar schools',
        weak:
          'Generic praise that could be any Ivy',
      },
      {
        criterion: 'Personal Connection',
        weight: 35,
        excellent:
          'Clear link between Brown features and who they are / who they\'re becoming',
        adequate:
          'Some connection but not clearly articulated',
        weak:
          'No personal connection, just facts about Brown',
      },
      {
        criterion: 'Precision and Synthesis',
        weight: 25,
        excellent:
          'Efficient use of limited words to convey deep fit in one clear sentence',
        adequate:
          'Gets the point across but inefficiently',
        weak:
          'Rambling or fails to answer the question',
      },
    ],
    promptSpecificRedFlags: [
      'Generic Ivy praise',
      'Features that could apply to any "open curriculum" school',
      'No personal connection',
      'Copy-paste feel',
    ],
    promptSpecificGreenFlags: [
      'Specific Brown institute, program, or aspect of culture',
      'Clear connection to personal trajectory',
      'Efficient and memorable',
    ],
  },
];

// ============================================================================
// BROWN RED FLAGS (Evidence-Based)
// ============================================================================

export const brownRedFlags: CollegeRedFlag[] = [
  {
    flagId: 'OVER_COACHED_VOICE',
    flagName: 'Over-Coached, Adult-Sounding Essay',
    severity: 'critical',
    description:
      'Essay sounds like a polished 35-year-old consultant, not a high-schooler. Powell explicitly warns against people who "change the tone of an essay to what they think we want to hear."',
    triggerExamples: [
      '"Through my multifaceted experiences, I have synthesized a holistic approach..."',
      'Perfect grammar but no personality or voice',
      'Every sentence sounds like a college counselor edited it',
      'Vocabulary and phrasing beyond typical high school level',
    ],
    evidence: {
      source: 'Logan Powell (Dean of Admission)',
      quote:
        'There are a lot of people in the college application process who want to weigh in with ideas and editorialize in a way that may change the tone of an essay to what they think we want to hear. But what we want is to hear the student in their own voice.',
      context: 'Brown Daily Herald interview',
    },
    applicablePrompts: ['all'],
    remediation:
      'Rewrite using your actual voice. Read it aloud - does it sound like you? Have friends verify it sounds like you talking.',
  },
  {
    flagId: 'RESUME_DUMP',
    flagName: 'Resume-Dump and Accomplishments List',
    severity: 'major',
    description:
      'Using essays to re-list roles, awards, and statistics. Brown Pre-College explicitly separates essays from activities list: "concentrate on one or two key aspects of yourself."',
    triggerExamples: [
      'Listing multiple activities without depth on any',
      'Mentioning awards, positions, and numbers',
      'Essay reads like expanded activities section',
      '"As president of X, captain of Y, and founder of Z..."',
    ],
    evidence: {
      source: 'Brown Pre-College Essay Tips',
      quote:
        'Instead of trying to share your entire life story in 650 words, concentrate on one or two key aspects of yourself that you want to convey. Remember, the activities section… will showcase your accomplishments and interests.',
      context: 'Official Brown essay guidance',
    },
    applicablePrompts: ['all'],
    remediation:
      'Focus on ONE experience and go deep. What did you learn? How did it change you? The activities list shows what you did; essays show who you are.',
  },
  {
    flagId: 'GENERIC_WHY_BROWN',
    flagName: 'Generic "Why Brown" / Open Curriculum Language',
    severity: 'major',
    description:
      'Vague statements about Brown that could apply to any school. Multiple sources warn against praise that "could apply to any school."',
    triggerExamples: [
      '"Brown\'s prestigious reputation and collaborative environment..."',
      '"I love the Open Curriculum because it offers flexibility"',
      'No specific courses, programs, or aspects of Brown culture',
      'Could replace "Brown" with any Ivy name',
    ],
    evidence: {
      source: 'Ivy Coach / Multiple Brown guides',
      quote:
        'If one can cut and paste the sentence and replace the specific with another university, delete it, and start anew!',
      context: 'Brown essay writing guidance',
    },
    applicablePrompts: ['open_curriculum', 'why_brown_sentence'],
    remediation:
      'Research specific Brown elements: courses, professors, institutes, student groups, traditions. Only include what you genuinely care about and couldn\'t find elsewhere.',
  },
  {
    flagId: 'EXCESSIVE_PROFANITY',
    flagName: 'Excessive Profanity or Shock Value',
    severity: 'critical',
    description:
      'Gratuitous profanity or edgy content that overshoots authenticity into poor judgment. Brown AO explicitly rejected strong applicant for excessive F-bombs.',
    triggerExamples: [
      'Multiple uses of strong profanity',
      'Shock value content for its own sake',
      'Edgy topics without purpose',
      'Profanity that doesn\'t serve the story',
    ],
    evidence: {
      source: 'Aralia Education',
      quote:
        'A Brown University admissions officer once shared that he rejected a strong applicant because the essay contained excessive use of "F-bombs."',
      context: 'Common College Application Essay Mistakes',
    },
    applicablePrompts: ['all'],
    remediation:
      'Authenticity doesn\'t require profanity. Strong writing can convey voice and personality without risking judgment questions.',
  },
  {
    flagId: 'IGNORING_PROMPT',
    flagName: 'Ignoring the Prompt or Missing Parts',
    severity: 'major',
    description:
      'Essays that wander, miss key parts, or don\'t answer what was asked. Read as weak thinking and poor reading skills.',
    triggerExamples: [
      'Joy essay that never shows what joy reveals about you',
      'Background essay without connection to contribution',
      'Open Curriculum essay without Brown-specific elements',
      'Not answering all parts of multi-part questions',
    ],
    evidence: {
      source: 'Selective Admissions',
      quote:
        'Take the time to deconstruct each prompt. Does it ask for a specific experience? A reflection on your worldview?… Make sure your response directly and thoroughly addresses every part of the question.',
      context: 'Brown University Supplemental Essay Prompts',
    },
    applicablePrompts: ['all'],
    remediation:
      'Highlight key words in each prompt. Make sure your essay addresses EACH part. Background essay asks for challenge AND contribution - you need both.',
  },
  {
    flagId: 'POOR_MECHANICS',
    flagName: 'Poor Mechanics / Careless Errors',
    severity: 'major',
    description:
      'Sloppy writing undercuts the quality of thought Brown expects from applicants to an open-curriculum, writing-intensive environment.',
    triggerExamples: [
      'Typos and grammatical errors',
      'Awkward sentences',
      'Wrong school name or copy-paste errors',
      'Inconsistent tense or voice',
    ],
    evidence: {
      source: 'Brown Pre-College Essay Tips',
      quote:
        'Proofreading is essential… Read it aloud… This technique helps you catch errors and identify awkward sentences.',
      context: 'Official Brown essay guidance',
    },
    applicablePrompts: ['all'],
    remediation:
      'Read aloud to catch errors. Have multiple people proofread. Triple-check school names and specific references.',
  },
  {
    flagId: 'FILE_INCONSISTENCY',
    flagName: 'Essays Don\'t Mesh with Application',
    severity: 'major',
    description:
      'Sudden claims or persona that conflicts with activities, recommendations, or other parts of application. Signals embellishment or coaching.',
    triggerExamples: [
      'Claimed passion with no related activities',
      'Personality in essay contradicts teacher recommendations',
      'PLME applicant claims lifelong medicine passion with no health activities',
      'Values stated that aren\'t demonstrated elsewhere',
    ],
    evidence: {
      source: 'InGenius Prep',
      quote:
        'Your motivations and actions described in the essay should be consistent with your extracurricular activities, personal experiences, and letters of recommendation… If it doesn\'t mesh with other parts of your application, you are unlikely to make the cut.',
      context: 'PLME essay guidance',
    },
    applicablePrompts: ['all'],
    remediation:
      'Ensure essay claims are supported by activities list and will be corroborated by recommenders. Don\'t invent a persona.',
  },
  {
    flagId: 'LISTING_ACADEMICS',
    flagName: 'Writing About Grades, Scores, or Course Rigor',
    severity: 'minor',
    description:
      'Essays about how many APs you took or your GPA. Already fully captured by transcript - wastes narrative space.',
    triggerExamples: [
      'Mentioning specific grades or test scores',
      'Describing course load or AP count',
      'Academic achievements as essay focus',
      '"I challenged myself with 8 AP courses..."',
    ],
    evidence: {
      source: 'Brown Admission FAQ',
      quote:
        'The most important consideration in the admission process is your high school performance and preparedness… Every component of the application conveys important information.',
      context: 'Brown official - academics already captured',
    },
    applicablePrompts: ['all'],
    remediation:
      'Transcript shows academics. Essays show who you ARE. Focus on experiences, values, and growth - not grades.',
  },
];

// ============================================================================
// BROWN GREEN FLAGS (Evidence-Based)
// ============================================================================

export const brownGreenFlags: CollegeGreenFlag[] = [
  {
    flagId: 'AUTHENTIC_STUDENT_VOICE',
    flagName: 'Unmistakably Student-Authored Voice',
    strength: 'major',
    description:
      'Writing that sounds like a real high school student with their own humor, cadence, and personality. Not over-polished into blandness.',
    examples: [
      'Natural sentence rhythms and word choices',
      'Appropriate humor or quirks that feel genuine',
      'Voice consistent with a teenager, not a consultant',
      'Imperfect but authentic expression',
    ],
    evidence: {
      source: 'Logan Powell (Dean of Admission)',
      quote:
        'What we want is to hear the student in their own voice, as clearly as they can possibly convey it.',
      context: 'Brown Daily Herald interview',
    },
    applicablePrompts: ['all'],
  },
  {
    flagId: 'SELF_DIRECTED_LEARNING',
    flagName: 'Evidence of Self-Directed Learning',
    strength: 'major',
    description:
      'Shows pursuit of interests beyond requirements, comfort designing own path, initiative without external structure.',
    examples: [
      'Independent research or projects beyond class',
      'Questions actively pursued within field',
      'Cross-disciplinary connections made on own',
      'Comfort with academic freedom evident',
    ],
    evidence: {
      source: 'AdmissionSight',
      quote:
        'Brown wants to see proof of your intellectual curiosity and how Brown\'s unique academic environment can help you with your pursuit of them.',
      context: 'Open Curriculum essay analysis',
    },
    applicablePrompts: ['open_curriculum', 'teach_class'],
  },
  {
    flagId: 'SPECIFIC_BROWN_ELEMENTS',
    flagName: 'Specific Brown Courses, Institutes, or DUGs',
    strength: 'major',
    description:
      'References concrete Brown elements that show genuine research and couldn\'t be copy-pasted to another school.',
    examples: [
      'Named courses or professors',
      'Specific institutes or research centers',
      'DUGs (Departmental Undergraduate Groups) relevant to interests',
      'Student organizations or traditions specific to Brown',
    ],
    evidence: {
      source: 'Multiple Brown-specific guides',
      quote:
        'Show that you have researched Brown by mentioning specific programs, opportunities, or aspects of its culture that align with your goals.',
      context: 'Brown essay guidance consensus',
    },
    applicablePrompts: ['open_curriculum', 'why_brown_sentence', 'background_identity'],
  },
  {
    flagId: 'REFLECTION_DEPTH',
    flagName: 'Deep Reflection and Self-Knowledge',
    strength: 'major',
    description:
      'Interprets experiences rather than just narrating them. Shows self-awareness, growth mindset, and capacity for introspection.',
    examples: [
      'Explains how experience changed perspective',
      'Shows growth from challenge or inspiration',
      'Demonstrates understanding of own motivations',
      'Connects past to future self',
    ],
    evidence: {
      source: 'Logan Powell (Dean of Admission)',
      quote:
        'The essay is designed to allow students to reflect on moments of inspiration or challenge in their lives and how those moments shaped who they are.',
      context: 'Brown Daily Herald on background essay',
    },
    applicablePrompts: ['background_identity', 'joy', 'meaningful_ec'],
  },
  {
    flagId: 'SPECIFIC_CONTRIBUTION',
    flagName: 'Named Future Contributions at Brown',
    strength: 'moderate',
    description:
      'Specific about how they will contribute on College Hill - student groups, dialogue spaces, mentoring, perspectives in class.',
    examples: [
      'Named student organizations they\'d join or start',
      'Specific ways they\'d contribute in Brown classes',
      'Mentoring or community-building plans',
      'Dialogue or perspective they\'d bring to campus',
    ],
    evidence: {
      source: 'Logan Powell (Dean of Admission)',
      quote:
        'Each applicant has a unique set of experiences they can contribute to the Brown community, and we want to learn more about them.',
      context: 'Background essay design',
    },
    applicablePrompts: ['background_identity', 'why_brown_sentence'],
  },
  {
    flagId: 'GENUINE_JOY',
    flagName: 'Authentic, Non-Resume Joy',
    strength: 'moderate',
    description:
      'Joy source is genuinely delightful, can be small or mundane, not an achievement disguised as joy.',
    examples: [
      'Small, unexpected source of joy',
      'Something that reveals character',
      'Genuine emotional connection evident',
      'Not a resume achievement repackaged',
    ],
    evidence: {
      source: 'Logan Powell (Dean of Admission)',
      quote:
        'In a really complicated and difficult world where there is a lot of anxiety and turmoil, there are still those things students do that bring them joy.',
      context: 'Brown Daily Herald on joy essay',
    },
    applicablePrompts: ['joy'],
  },
  {
    flagId: 'CROSS_DISCIPLINARY',
    flagName: 'Natural Cross-Disciplinary Thinking',
    strength: 'moderate',
    description:
      'Shows natural tendency to connect ideas across fields, demonstrating why Brown\'s Open Curriculum fits their learning style.',
    examples: [
      'Connects art and science, or humanities and technology',
      'Sees patterns across different fields',
      'Multiple interests that inform each other',
      'Explains why depth + breadth matters to them',
    ],
    evidence: {
      source: 'CollegeVine',
      quote:
        'How you might use the Open Curriculum to pursue them while also embracing topics with which you are unfamiliar.',
      context: 'Open Curriculum essay guidance',
    },
    applicablePrompts: ['open_curriculum'],
  },
];

// ============================================================================
// BROWN SOCRATIC QUESTIONS
// ============================================================================

export const brownSocraticQuestions: CollegeSocraticQuestionBank = {
  byDimension: {
    authentic_voice: [
      'Read this sentence aloud - does it sound like how you actually talk?',
      'Would your best friend recognize this as your voice?',
      'Are you writing what you think Brown wants to hear, or what YOU want to say?',
      'Where in this essay is your personality most visible?',
      'If you removed your name, would someone know this was written by you?',
    ],
    character_values: [
      'What does this experience reveal about what you stand for?',
      'How would someone who disagrees with you describe this situation?',
      'What choice did you make here, and what does that choice reveal?',
      'Where do your values show up in your actions, not just your words?',
      'What would you do differently if you faced this situation again?',
    ],
    intellectual_curiosity: [
      'What questions are you still trying to answer in this field?',
      'How did this interest develop over time - what sparked it?',
      'What have you explored beyond classroom requirements?',
      'How do your different interests connect to each other?',
      'What would you study at Brown that you couldn\'t study anywhere else?',
    ],
    identity_perspective: [
      'What specific aspect of your background shaped this perspective?',
      'How did this experience change how you see the world?',
      'What would you want Brown students to understand about where you come from?',
      'How will this background shape what you contribute at Brown?',
      'What moment crystallized this aspect of your identity?',
    ],
    community_contribution: [
      'What specific communities at Brown would you contribute to?',
      'How have you built or changed communities before?',
      'What perspective or skill will you bring that Brown needs?',
      'How do you plan to give back, not just take from Brown?',
      'What student group or initiative would you start or join?',
    ],
    joy_resilience: [
      'Why does this bring you genuine joy, not just satisfaction?',
      'How does this joy sustain you through difficult times?',
      'What does your choice of joy reveal about your values?',
      'How might you share this joy with others at Brown?',
      'What would be missing from your life without this?',
    ],
  },
  byPrompt: {
    open_curriculum: [
      'Why do you need the Open Curriculum specifically - what would you lose with requirements?',
      'What specific Brown courses or programs would you take advantage of?',
      'How do your academic interests connect across disciplines?',
      'What would your self-designed path at Brown look like?',
      'What questions are driving your academic exploration?',
    ],
    background_identity: [
      'What one aspect of your upbringing had the most impact on who you are?',
      'How did this inspire or challenge you - can you point to a specific moment?',
      'What will you contribute to Brown BECAUSE of this background?',
      'How did you grow or change through this experience?',
      'What do you want Brown to understand about where you came from?',
    ],
    joy: [
      'Does this joy sound authentic or like something chosen to impress?',
      'Why THIS specific source of joy - what makes it meaningful?',
      'What does your joy reveal about your values?',
      'How does this joy connect to who you are at your core?',
      'How might this joy show up in your life at Brown?',
    ],
    three_words: [
      'Are these words specific enough to distinguish you from others?',
      'Is each word supported by evidence in your application?',
      'Do these words capture the most important things about you?',
      'Would someone who knows you well agree with these choices?',
      'Are any of these words generic enough to apply to anyone?',
    ],
    meaningful_ec: [
      'What makes this activity MEANINGFUL, not just impressive?',
      'What did you learn or how did you grow through this?',
      'Can you point to a specific moment that captures the meaning?',
      'What values does this activity reveal?',
      'How did this shape who you\'re becoming?',
    ],
    teach_class: [
      'Is this topic genuinely YOU, or what you think sounds impressive?',
      'How would you actually teach this - what would students gain?',
      'Why are you the right person to teach this?',
      'What makes your approach to this topic unique?',
      'Would you be excited to teach this class?',
    ],
    why_brown_sentence: [
      'Is this specific enough that it couldn\'t apply to another school?',
      'What Brown feature matters most to YOU - not generically?',
      'How does this connect to who you are and who you\'re becoming?',
      'If you could only keep one reason, what would it be?',
      'Would Brown admissions read this and say "yes, they get us"?',
    ],
  },
};

// ============================================================================
// BROWN ELITE EXAMPLES (Anonymized Patterns)
// ============================================================================

export const brownEliteExamples: CollegeEliteExample[] = [
  {
    exampleId: 'authentic_voice_exemplar',
    promptType: 'Common App Personal Statement',
    pattern: 'Authentic Student Voice',
    anonymizedDescription:
      'Student wrote about learning to cook with their grandmother, using vivid sensory details and their own humor. Voice was unmistakably teenage - imperfect but real. Included self-deprecating joke about burning rice that felt genuine.',
    whatMakesItEffective: [
      'Voice sounds like actual high schooler, not polished consultant',
      'Sensory details ground the reader in specific moments',
      'Humor reveals personality without trying too hard',
      'Reflection on meaning emerges naturally from story',
    ],
    dimensionsShown: ['authentic_voice', 'character_values', 'identity_perspective'],
  },
  {
    exampleId: 'open_curriculum_exemplar',
    promptType: 'open_curriculum',
    pattern: 'Self-Directed Cross-Disciplinary Path',
    anonymizedDescription:
      'Student connected interest in cognitive science and music composition, citing specific Brown courses in both departments. Explained how the Open Curriculum uniquely allows combining these in ways structured programs don\'t. Named specific lab and ensemble they\'d join.',
    whatMakesItEffective: [
      'Genuine cross-disciplinary connection, not forced',
      'Specific Brown courses and programs named',
      'Clear understanding of why Open Curriculum enables their path',
      'Evidence of prior self-directed exploration in both areas',
    ],
    dimensionsShown: ['intellectual_curiosity', 'institutional_fit'],
  },
  {
    exampleId: 'background_exemplar',
    promptType: 'background_identity',
    pattern: 'Focused Challenge to Contribution Arc',
    anonymizedDescription:
      'Student focused on one aspect of immigrant experience - translating for parents at doctors\' offices. Showed both challenge (responsibility, confusion) and inspiration (sparked interest in health equity). Connected to specific Brown groups focused on healthcare access.',
    whatMakesItEffective: [
      'Narrow focus on one specific aspect, not whole life story',
      'Both challenge AND inspiration clear',
      'Specific contribution at Brown named',
      'Reflection on how experience shaped values',
    ],
    dimensionsShown: ['identity_perspective', 'community_contribution', 'character_values'],
  },
  {
    exampleId: 'joy_exemplar',
    promptType: 'joy',
    pattern: 'Small Authentic Joy with Meaning',
    anonymizedDescription:
      'Student wrote about the joy of organizing their desk supplies - seemingly mundane but revealed their love of order and making sense of chaos. Connected to how they find calm during stressful times. Not a resume achievement.',
    whatMakesItEffective: [
      'Unexpected, small source of joy that\'s genuinely them',
      'Not a disguised accomplishment',
      'Revealed character and coping mechanism',
      'Self-aware about why this matters',
    ],
    dimensionsShown: ['joy_resilience', 'authentic_voice'],
  },
  {
    exampleId: 'why_brown_sentence_exemplar',
    promptType: 'why_brown_sentence',
    pattern: 'Specific + Personal Connection',
    anonymizedDescription:
      'One sentence connecting their interest in public health to Brown\'s Health and Human Biology concentration AND the student-led clinic. Made clear why this combination only exists at Brown and how it fits their trajectory.',
    whatMakesItEffective: [
      'Two Brown-specific elements that couldn\'t be copy-pasted',
      'Clear personal connection to both',
      'Efficient use of limited words',
      'Shows research depth',
    ],
    dimensionsShown: ['institutional_fit', 'intellectual_curiosity'],
  },
];

// ============================================================================
// BROWN KEY QUOTES (For Teaching and Justification)
// ============================================================================

export const brownKeyQuotes: CollegeKeyQuote[] = [
  {
    quoteId: 'powell_voice',
    speaker: 'Logan Powell',
    role: 'Dean of Admission',
    quote:
      'There are a lot of people in the college application process who want to weigh in with ideas and editorialize in a way that may change the tone of an essay to what they think we want to hear. But what we want is to hear the student in their own voice, as clearly as they can possibly convey it. Don\'t overthink it. Don\'t ask yourself, "what do we want to read?" Ask yourself, "what do I think I want to say?"',
    source: 'Brown Daily Herald - "The Supplement" (Oct 2021)',
    useCases: [
      { dimension: 'authentic_voice', context: 'Core teaching on voice' },
      { flag: 'OVER_COACHED_VOICE', context: 'Evidence for red flag' },
    ],
  },
  {
    quoteId: 'powell_essays_heart',
    speaker: 'Logan Powell',
    role: 'Dean of Admission',
    quote: 'Essays remain at the heart of an application.',
    source: 'Brown Daily Herald',
    useCases: [
      { dimension: 'character_values', context: 'Essay importance' },
    ],
  },
  {
    quoteId: 'powell_background_essay',
    speaker: 'Logan Powell',
    role: 'Associate Provost for Enrollment & Dean of Admission',
    quote:
      'The new supplemental essay is designed to allow students to reflect on moments of inspiration or challenge in their lives and how those moments shaped who they are. Each applicant has a unique set of experiences they can contribute to the Brown community, and we want to learn more about them.',
    source: 'Brown Daily Herald (July 2023)',
    useCases: [
      { dimension: 'identity_perspective', context: 'Background essay purpose' },
      { dimension: 'community_contribution', context: 'Contribution focus' },
    ],
  },
  {
    quoteId: 'powell_joy',
    speaker: 'Logan Powell',
    role: 'Dean of Admission',
    quote:
      'I would call the third essay "joy." In a really complicated and difficult world where there is a lot of anxiety and turmoil, there are still those things students do that bring them joy. We think it\'s important for them to take a moment and think about what those things are.',
    source: 'Brown Daily Herald',
    useCases: [
      { dimension: 'joy_resilience', context: 'Joy essay purpose' },
    ],
  },
  {
    quoteId: 'powell_lived_experience',
    speaker: 'Logan Powell',
    role: 'Associate Provost for Enrollment',
    quote:
      'Any new questions would serve to offer applicants opportunities to share more information about their identity "to try to get a better sense of the lived experiences of discrimination or overcoming hardship that our students may face."',
    source: 'FAIR summary - Brown meeting on identity essays (Mar 2023)',
    useCases: [
      { dimension: 'identity_perspective', context: 'Post-affirmative action context' },
    ],
  },
  {
    quoteId: 'brown_precollege_voice',
    speaker: 'Brown Pre-College',
    role: 'Official Program',
    quote:
      'Authenticity is key. Write in your natural voice… Don\'t force a tone that doesn\'t feel true to you. Remember, your essay is a reflection of who you are.',
    source: 'Brown Pre-College Essay Tips',
    useCases: [
      { dimension: 'authentic_voice', context: 'Official voice guidance' },
    ],
  },
  {
    quoteId: 'brown_precollege_focus',
    speaker: 'Brown Pre-College',
    role: 'Official Program',
    quote:
      'Instead of trying to share your entire life story in 650 words, concentrate on one or two key aspects of yourself that you want to convey. Remember, the activities section… will showcase your accomplishments and interests.',
    source: 'Brown Pre-College Essay Tips',
    useCases: [
      { flag: 'RESUME_DUMP', context: 'Evidence for red flag' },
    ],
  },
  {
    quoteId: 'aralia_profanity',
    speaker: 'Aralia Education',
    role: 'Consulting Firm (AO Anecdote)',
    quote:
      'A Brown University admissions officer once shared that he rejected a strong applicant because the essay contained excessive use of "F-bombs."',
    source: 'Common College Application Essay Mistakes',
    useCases: [
      { flag: 'EXCESSIVE_PROFANITY', context: 'Evidence for red flag' },
    ],
  },
  {
    quoteId: 'ivy_coach_copy_paste',
    speaker: 'Ivy Coach',
    role: 'Consulting Firm',
    quote:
      'If one can cut and paste the sentence and replace the specific with another university, delete it, and start anew!',
    source: 'Brown University Essay Prompts guidance',
    useCases: [
      { flag: 'GENERIC_WHY_BROWN', context: 'Evidence for red flag' },
    ],
  },
  {
    quoteId: 'ingenius_consistency',
    speaker: 'InGenius Prep',
    role: 'Consulting Firm',
    quote:
      'Your motivations and actions described in the essay should be consistent with your extracurricular activities, personal experiences, and letters of recommendation… If it doesn\'t mesh with other parts of your application, you are unlikely to make the cut.',
    source: 'PLME essay guidance',
    useCases: [
      { flag: 'FILE_INCONSISTENCY', context: 'Evidence for red flag' },
    ],
  },
  {
    quoteId: 'collegetransitions_tiebreaker',
    speaker: 'College Transitions',
    role: 'Research Organization',
    quote:
      'There are a whopping seven factors that Brown considers to be "very important"… The essays undoubtedly play a significant role… They can help the committee decide whom to admit when choosing between similarly credentialed (GPA, test scores, etc.) applicants.',
    source: 'Brown Supplemental Essay Prompts analysis',
    useCases: [
      { dimension: 'character_values', context: 'Essay weight in decisions' },
    ],
  },
  {
    quoteId: 'admissionsight_curiosity',
    speaker: 'AdmissionSight',
    role: 'Consulting Firm',
    quote:
      'Brown wants to see proof of your intellectual curiosity and how Brown\'s unique academic environment can help you with your pursuit of them.',
    source: 'Brown Supplemental Essays analysis',
    useCases: [
      { dimension: 'intellectual_curiosity', context: 'Open Curriculum essay' },
    ],
  },
];

// ============================================================================
// BROWN DIMENSION WEIGHTS (Essay-Specific, Evidence-Based)
// ============================================================================

export const brownDimensionWeights: CollegeDimensionWeights = {
  authentic_voice: {
    weight: 25,
    rationale:
      'Dean Powell\'s central message: "What we want is to hear the student in their own voice, as clearly as they can possibly convey it." Over-coached essays are explicitly warned against. This is Brown\'s #1 essay priority.',
    sourcesSupporting: 7,
  },
  character_values: {
    weight: 20,
    rationale:
      'CDS rates Character/Personal Qualities as "Very Important." Powell says essays are "at the heart of an application." Essays are primary vehicle for demonstrating values.',
    sourcesSupporting: 6,
  },
  intellectual_curiosity: {
    weight: 18,
    rationale:
      'Open Curriculum is Brown\'s signature value. Multiple sources emphasize curiosity, independence, and self-direction. Entire essay prompt dedicated to this.',
    sourcesSupporting: 5,
  },
  identity_perspective: {
    weight: 15,
    rationale:
      'New background prompt explicitly designed to surface lived experience. Post-SCOTUS, essays carry context for discrimination/hardship legally. Powell emphasizes this purpose.',
    sourcesSupporting: 5,
  },
  community_contribution: {
    weight: 12,
    rationale:
      'Contribution language central to background prompt. Brown mission emphasizes community. Multiple guides stress specific future contributions.',
    sourcesSupporting: 5,
  },
  joy_resilience: {
    weight: 10,
    rationale:
      'Entire essay prompt dedicated to joy. Powell explicitly frames this as important for understanding how students cope with "complicated and difficult world."',
    sourcesSupporting: 4,
  },
};

// ============================================================================
// BROWN RESEARCH EXPORT
// ============================================================================

export const brownResearch: CollegeResearch = {
  collegeId: 'brown',
  collegeName: 'Brown University',
  researchQuality: 91,
  lastUpdated: '2024-12-27',
  cdsYear: '2023-2024',

  // Essay philosophy
  essayPhilosophy: {
    inThreeWords: 'Self-Directed Voice',
    coreMessage:
      'Brown wants to hear the student in their own voice. Essays are "at the heart of an application" and reveal authentic voice, self-direction with the Open Curriculum, identity and lived experience, and capacity for joy and community contribution.',
    keyDistinction:
      'Unlike schools that emphasize polished achievement narratives, Brown explicitly warns against over-coaching. The Open Curriculum demands evidence of self-direction and intellectual curiosity. Post-affirmative action, identity essays carry legal context for lived experience.',
  },

  // All data
  coreValues: brownCoreValues,
  essayPrompts: brownEssayPrompts,
  redFlags: brownRedFlags,
  greenFlags: brownGreenFlags,
  socraticQuestions: brownSocraticQuestions,
  eliteExamples: brownEliteExamples,
  keyQuotes: brownKeyQuotes,
  dimensionWeights: brownDimensionWeights,

  // Metadata
  metadata: {
    primarySources: [
      'Logan Powell (Dean of Admission) - Brown Daily Herald, BPR Interview',
      'Brown Common Data Set 2023-2024',
      'Brown Admission FAQ & Official Website',
      'Brown Pre-College Essay Tips',
    ],
    secondarySources: [
      'CollegeTransitions - Brown Supplemental Essay Prompts',
      'CollegeVine - How to Get Into Brown',
      'Crimson Education - Brown Supplemental Essays',
      'InGenius Prep - Writing the Brown Supplemental Essays',
      'AdmissionSight - Brown Essays Analysis',
      'Admissionado - Mastering the Brown Application Essay',
      'The Koppelman Group - How to Get into Brown University',
      'Ivy Coach - Brown University Essay Prompts',
      'FAIR - Brown identity essays post-SCOTUS',
      'Aralia Education - Common Essay Mistakes (F-bomb anecdote)',
    ],
    totalSourcesConsulted: 90,
    uniqueAOQuotes: 5,
    essayPromptsAnalyzed: 7,
  },
};
