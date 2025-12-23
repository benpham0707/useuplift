/**
 * Issue Detection Patterns
 *
 * 40+ specific patterns to detect common issues in supplemental essays.
 * Each pattern has:
 * - Detection criteria
 * - Severity level
 * - Affected dimensions
 * - Fix suggestions
 *
 * Modeled after PIQ Workshop's pattern-based issue detection.
 */

import type { SupplementalDimension } from './universalSupplementalRubric';
import type { SupplementalType } from '../../../data/commonAppSupplementalTypes';

// ============================================================================
// TYPES
// ============================================================================

export type IssueSeverity = 'critical' | 'major' | 'minor';

export interface IssuePattern {
  id: string;
  name: string;
  description: string;
  severity: IssueSeverity;

  // What types this issue is most relevant to
  relevant_types: SupplementalType[] | 'all';

  // Which dimensions this issue affects
  affected_dimensions: SupplementalDimension[];

  // Scoring impact (negative)
  score_impact: number; // -1 to -5

  // Detection
  detection_phrases: string[];  // Phrases that trigger this issue
  detection_patterns: string[]; // Regex patterns (as strings)
  detection_logic?: string;     // Description of additional detection logic

  // Teaching
  problem_description: string;  // What's wrong
  why_it_matters: string;       // Why admissions cares
  fix_suggestions: string[];    // How to fix it
  example_before?: string;      // Bad example
  example_after?: string;       // Fixed example
}

export interface DetectedIssue {
  pattern_id: string;
  severity: IssueSeverity;
  evidence: string;      // The text that triggered detection
  location?: string;     // Where in the essay (opening, middle, ending)
  fix_priority: number;  // 1-5, higher = fix first
}

// ============================================================================
// CRITICAL ISSUES (Auto-Flag, -3 to -5 points)
// ============================================================================

const CRITICAL_ISSUES: IssuePattern[] = [
  {
    id: 'SWAP_TEST_FAIL',
    name: 'College Name Swap Test Failure',
    description: 'Essay contains no college-specific details that couldn\'t apply elsewhere',
    severity: 'critical',
    relevant_types: ['why_us'],
    affected_dimensions: ['fit_demonstration', 'research_depth', 'specificity_evidence'],
    score_impact: -4,

    detection_phrases: [
      'prestigious university',
      'top-ranked program',
      'excellent reputation',
      'world-renowned',
      'best professors',
      'great education',
      'amazing opportunities'
    ],
    detection_patterns: [
      'one of the (best|top|leading)',
      '(prestigious|excellent|great) (school|university|college|program)'
    ],
    detection_logic: 'No specific professor names, course names, or unique program details detected',

    problem_description: 'Your essay could work for almost any selective college. There\'s nothing specific to THIS school.',
    why_it_matters: 'Admissions officers ask: "Could they swap our name for another school?" If yes, the essay fails. They want students who\'ve researched deeply and found genuine, specific fit.',
    fix_suggestions: [
      'Name 3-5 specific resources unique to this college',
      'Reference specific professors and their research',
      'Mention specific courses by name and number',
      'Connect each resource to your personal goals/experience',
      'Include details you couldn\'t find on the main website'
    ],
    example_before: 'I want to attend Stanford because it has a top-ranked computer science program and excellent professors.',
    example_after: 'After reading Professor Fei-Fei Li\'s work on visual recognition, I want to explore her approach to AI ethics in CS229. My experience building an image classifier made me realize I need the mathematical rigor Stanford\'s program provides.'
  },

  {
    id: 'GENERIC_ORIGIN_STORY',
    name: 'Generic "Always Interested" Opening',
    description: 'Uses generic origin story that doesn\'t show specific spark moment',
    severity: 'critical',
    relevant_types: ['why_major', 'intellectual', 'extracurricular'],
    affected_dimensions: ['personal_connection', 'authenticity_voice', 'narrative_clarity'],
    score_impact: -3,

    detection_phrases: [
      'I have always been interested',
      'ever since I was young',
      'for as long as I can remember',
      'I have always loved',
      'I have always been passionate',
      'since childhood',
      'growing up, I always'
    ],
    detection_patterns: [
      '(always|ever since|for as long as).*(interested|loved|passionate|fascinated)',
      'since (I was|childhood|young)'
    ],
    detection_logic: 'Opening contains always/ever since language without specific origin moment',

    problem_description: 'Opening with "I have always been interested" is generic and tells us nothing specific about YOUR journey.',
    why_it_matters: 'Every applicant can claim they\'ve "always" been interested. What makes YOUR interest story unique? Admissions wants the specific moment your curiosity ignited.',
    fix_suggestions: [
      'Identify the specific SPARK moment - when and where',
      'Describe what you were doing when interest first emerged',
      'Show the progression from that moment forward',
      'Use sensory details from that specific time',
      'Make it a scene, not a summary'
    ],
    example_before: 'I have always been fascinated by computer science and technology.',
    example_after: 'The summer I was 14, I spent three days debugging a single function. When it finally worked at 2 AM, printing "Hello World" felt like I\'d unlocked a new language.'
  },

  {
    id: 'ESSAY_SPEAK_HEAVY',
    name: 'Heavy Essay-Speak',
    description: 'Multiple essay-speak phrases that make writing sound templated',
    severity: 'critical',
    relevant_types: 'all',
    affected_dimensions: ['authenticity_voice'],
    score_impact: -3,

    detection_phrases: [
      'this experience taught me',
      'through this, I learned',
      'in conclusion',
      'it is important to note',
      'I realized that',
      'this made me understand',
      'I came to appreciate',
      'this opportunity allowed me to',
      'I was able to develop',
      'through perseverance'
    ],
    detection_patterns: [
      'this (experience|opportunity|challenge) (taught|showed|helped) me',
      'through (this|these|my),? I (learned|realized|understood)',
      'I (came to|began to) (understand|appreciate|realize)'
    ],
    detection_logic: '3+ essay-speak phrases detected',

    problem_description: 'Your essay is full of "essay-speak" - phrases that sound like a template rather than your authentic voice.',
    why_it_matters: 'Admissions officers read thousands of essays. Essay-speak makes you sound like everyone else. Your real voice is more compelling than polished clichés.',
    fix_suggestions: [
      'Delete ALL instances of "this taught me" - show learning through action instead',
      'Remove "in conclusion" and "I realized that"',
      'Replace "through this experience" with specific details',
      'Read your essay aloud - does it sound like you talking?',
      'Show growth through changed behavior, not stated lessons'
    ],
    example_before: 'This experience taught me that hard work pays off. Through perseverance, I learned to never give up.',
    example_after: 'After the third failed prototype, I stayed until 11 PM rebuilding the circuit. When it finally lit up, I understood why my dad spent weekends in his workshop.'
  },

  {
    id: 'VULNERABILITY_DUMP',
    name: 'Trauma Dumping Without Response',
    description: 'Extensive problem description without proportional response/growth',
    severity: 'critical',
    relevant_types: ['challenge', 'diversity'],
    affected_dimensions: ['vulnerability_balance', 'growth_transformation', 'narrative_clarity'],
    score_impact: -4,

    detection_phrases: [],
    detection_patterns: [],
    detection_logic: 'More than 50% of essay describes problem/challenge with less than 30% on response/growth',

    problem_description: 'Your essay spends too much time on what happened TO you and not enough on what you DID about it.',
    why_it_matters: 'Admissions wants to see resilience and agency. Describing trauma without showing your response reads as victim mentality, not growth.',
    fix_suggestions: [
      'Apply the 20/80 rule: 20% on the problem, 80% on your response',
      'Focus on specific actions YOU took',
      'Show multiple attempts/iterations (growth is rarely instant)',
      'End with behavioral change, not stated lessons',
      'Balance vulnerability with strength'
    ],
    example_before: '(5 paragraphs describing difficult circumstances, 1 paragraph saying "I learned to be resilient")',
    example_after: '(1 paragraph establishing context, 4 paragraphs showing specific actions, growth, and ongoing development)'
  },

  {
    id: 'NO_NUMBERS',
    name: 'Missing Quantification',
    description: 'No numbers, metrics, or specific quantities anywhere in essay',
    severity: 'critical',
    relevant_types: ['why_us', 'why_major', 'leadership', 'extracurricular', 'community'],
    affected_dimensions: ['specificity_evidence'],
    score_impact: -3,

    detection_phrases: [],
    detection_patterns: [
      '\\d+',  // Should find at least some numbers
      '(percent|%)',
      '(hours|weeks|months|years)'
    ],
    detection_logic: 'Zero numbers or quantified metrics detected in entire essay',

    problem_description: 'Your essay contains no specific numbers or metrics. Everything feels vague.',
    why_it_matters: 'Numbers prove scale and commitment. "Helped many students" vs "tutored 47 students over 18 months" - which is more credible?',
    fix_suggestions: [
      'Add specific numbers: people impacted, hours invested, items created',
      'Include dates and time periods',
      'Quantify improvements (before/after)',
      'Name specific counts instead of "many" or "several"',
      'Add metrics that demonstrate scale of involvement'
    ],
    example_before: 'I worked with many students to improve their grades significantly.',
    example_after: 'I tutored 23 students over two semesters, with 18 improving their grades by at least one letter.'
  },

  {
    id: 'AI_PATTERNS',
    name: 'AI/ChatGPT Writing Patterns',
    description: 'Essay shows telltale signs of AI-generated content',
    severity: 'critical',
    relevant_types: 'all',
    affected_dimensions: ['authenticity_voice'],
    score_impact: -5,

    detection_phrases: [
      'delve into',
      'it\'s important to note',
      'it should be noted',
      'in today\'s world',
      'in this day and age',
      'plays a crucial role',
      'at its core',
      'serves as a testament',
      'navigating the complexities',
      'multifaceted',
      'paradigm'
    ],
    detection_patterns: [
      'it is (important|crucial|essential) to (note|understand)',
      '(delve|dive) (into|deeper)',
      'serves as a (powerful|compelling|vivid) (testament|reminder|example)',
      'the (ever-changing|dynamic|complex) (landscape|world|realm)'
    ],
    detection_logic: '3+ AI marker phrases detected, or perfect parallel structure throughout',

    problem_description: 'Your essay shows signs of AI-generated content. Admissions officers are trained to spot this.',
    why_it_matters: 'AI-generated essays are automatic rejections at selective schools. Even if not caught, they lack the authentic voice that makes essays compelling.',
    fix_suggestions: [
      'Rewrite entirely in your own voice',
      'Remove ALL flagged phrases',
      'Add personal details only you would know',
      'Include imperfections and personality',
      'Read aloud and revise to sound like you talking'
    ],
    example_before: 'In today\'s ever-changing landscape, it\'s important to note that education plays a crucial role in navigating the complexities of modern society.',
    example_after: 'Last semester, I failed my first physics exam. Instead of cramming harder, I started going to office hours and realized I\'d been memorizing formulas without understanding why they worked.'
  },

  {
    id: 'STATED_NOT_SHOWN',
    name: 'Values/Qualities Stated Not Shown',
    description: 'Claims qualities or values without demonstrating through story',
    severity: 'critical',
    relevant_types: ['values', 'leadership', 'diversity'],
    affected_dimensions: ['personal_connection', 'authenticity_voice', 'specificity_evidence'],
    score_impact: -3,

    detection_phrases: [
      'I am passionate about',
      'I am curious',
      'I am a leader',
      'I value',
      'I believe in',
      'I am dedicated to',
      'I am committed to',
      'I am hardworking',
      'I am creative'
    ],
    detection_patterns: [
      'I am (a |very )?(passionate|curious|creative|dedicated|hardworking|driven)',
      'I (value|believe in|am committed to)'
    ],
    detection_logic: 'Claims about character without supporting narrative/story',

    problem_description: 'You\'re telling us what you are instead of showing us through your actions.',
    why_it_matters: '"I am a leader" is a claim. "I noticed our team was struggling and created a shared document that became our go-to resource" is proof. Show, don\'t tell.',
    fix_suggestions: [
      'Delete every "I am [quality]" statement',
      'Replace with a specific story showing that quality in action',
      'Let readers draw their own conclusions about your character',
      'Use dialogue and specific scenes',
      'Show behavior that DEMONSTRATES the value'
    ],
    example_before: 'I am passionate about helping others and I value community service.',
    example_after: 'Every Tuesday, I teach English to Mrs. Nguyen, my 70-year-old neighbor learning to text her grandkids in Vietnam. Last month, she sent her first emoji and cried.'
  }
];

// ============================================================================
// MAJOR ISSUES (-2 to -3 points)
// ============================================================================

const MAJOR_ISSUES: IssuePattern[] = [
  {
    id: 'ONE_SIDED_FIT',
    name: 'One-Sided Fit Demonstration',
    description: 'Only discusses what college offers OR what student brings, not both',
    severity: 'major',
    relevant_types: ['why_us', 'community'],
    affected_dimensions: ['fit_demonstration'],
    score_impact: -2,

    detection_phrases: [
      // Receiving language without giving
      'I want to learn',
      'I want to study',
      'I want to take',
      'I hope to benefit',
      'I can get',
      'will help me',
      'will teach me',
      'offer me'
    ],
    detection_patterns: [
      // Heavy receiving focus
      'I (want|hope|would like) to (learn|study|take|explore)',
      '(program|school|university) (will|can|would) (help|teach|give|provide) me',
      'I (will|can|could) (gain|get|receive|learn) from'
    ],
    detection_logic: 'Essay only discusses receiving (what college offers) without giving (what student contributes), or vice versa',

    problem_description: 'Your essay is one-sided - you talk about what you\'ll GET from the college, but not what you\'ll GIVE.',
    why_it_matters: 'Colleges want students who will contribute, not just consume. The best Why Us essays show mutual value.',
    fix_suggestions: [
      'Add what you will contribute to campus',
      'Connect your past involvement to future contributions',
      'Show how your background enriches their community',
      'Balance "I want to learn X" with "I will bring Y"'
    ]
  },

  {
    id: 'VAGUE_DIVERSITY',
    name: 'Vague Diversity Discussion',
    description: 'Generic claims about diversity without specific experiences or examples',
    severity: 'major',
    relevant_types: ['diversity'],
    affected_dimensions: ['personal_connection', 'specificity_evidence', 'authenticity_voice'],
    score_impact: -3,

    detection_phrases: [
      'diverse background',
      'add diversity',
      'contribute to diversity',
      'bring diversity',
      'my diverse perspective',
      'my unique perspective',
      'different perspective',
      'people of all backgrounds',
      'everyone is welcome',
      'embrace differences'
    ],
    detection_patterns: [
      '(add|bring|contribute) (to )?(the )?(diversity|diverse)',
      '(my |a )(diverse|unique|different) (background|perspective|experiences?)',
      '(embrace|celebrate|appreciate) (our )?(differences|diversity)'
    ],
    detection_logic: 'Essay uses generic diversity language without specific personal experiences',

    problem_description: 'Your essay talks about diversity in generic terms without showing YOUR specific experience.',
    why_it_matters: 'Every applicant can claim they value diversity. Admissions wants to see your SPECIFIC story - what experiences shaped your perspective and how you will SPECIFICALLY contribute.',
    fix_suggestions: [
      'Share a specific moment that shaped your perspective',
      'Describe a concrete experience navigating difference',
      'Show how your specific background creates specific value',
      'Replace "I am diverse" with "Here is my story"',
      'Use sensory details and dialogue from real experiences'
    ],
    example_before: 'As an Asian-American, I have a diverse background that will help me contribute to campus diversity.',
    example_after: 'When my grandmother called me "banana" for my American accent, I felt caught between worlds. Now I translate - not just words, but worlds - mediating between my parents and teachers, my grandparents and doctors.'
  },

  {
    id: 'CAREER_ONLY',
    name: 'Career-Only Without Intellectual Curiosity',
    description: 'Only discusses career outcomes without genuine intellectual interest',
    severity: 'major',
    relevant_types: ['why_major'],
    affected_dimensions: ['reflection_insight', 'authenticity_voice'],
    score_impact: -2,

    detection_phrases: [
      'I want to be a',
      'career in',
      'job market',
      'high-paying',
      'job prospects',
      'lucrative career'
    ],
    detection_patterns: [
      'I want to (be|become) a (doctor|lawyer|engineer|scientist)',
      '(job|career) (market|prospects|opportunities)',
      '(high-paying|lucrative|well-paying) (job|career|field)'
    ],
    detection_logic: 'Heavy career focus without intellectual curiosity or questions about the field',

    problem_description: 'Your essay focuses only on career outcomes without showing genuine intellectual curiosity about the field.',
    why_it_matters: 'Admissions wants to see students who love learning, not just students chasing career paths. Show intellectual engagement, not just job ambition.',
    fix_suggestions: [
      'Add specific questions or concepts that fascinate you about the field',
      'Describe intellectual exploration you\'ve done independently',
      'Show curiosity about IDEAS, not just outcomes',
      'Connect intellectual interest to career goals'
    ],
    example_before: 'I want to major in computer science because it offers excellent job prospects and high salaries.',
    example_after: 'I want to major in CS because I can\'t stop thinking about how machine learning models make decisions. After reading about neural network interpretability, I spent two weeks trying to visualize what my simple classifier was actually "seeing."'
  },

  {
    id: 'VAGUE_COMMUNITY',
    name: 'Vague Community Promises',
    description: 'Vague promises about future involvement without past evidence',
    severity: 'major',
    relevant_types: ['community'],
    affected_dimensions: ['specificity_evidence', 'personal_connection'],
    score_impact: -2,

    detection_phrases: [
      'I will contribute',
      'I want to join',
      'I hope to participate',
      'I plan to get involved',
      'I would love to'
    ],
    detection_patterns: [
      'I (will|want to|hope to|plan to) (contribute|join|participate|get involved)',
      'I would (love|like) to'
    ],
    detection_logic: 'Future promises without past behavior evidence',

    problem_description: 'You\'re making vague promises about future involvement without showing past evidence that you\'ll follow through.',
    why_it_matters: 'Past behavior predicts future behavior. Admissions has seen thousands of students promise involvement and then disappear. Show them you\'ve ALREADY been a community builder.',
    fix_suggestions: [
      'Ground future promises in past behavior',
      'For every "I will," add "because I have"',
      'Show specific past community contributions',
      'Name specific organizations you\'ve researched'
    ],
    example_before: 'I want to join many clubs and contribute to the campus community.',
    example_after: 'After building our school\'s first tutoring network (47 students matched with tutors), I want to bring that peer-support model to Penn\'s First-Generation Student Association, which I noticed focuses on resources but less on peer mentorship.'
  },

  {
    id: 'TRAUMA_WITHOUT_AGENCY',
    name: 'Challenge Without Agency',
    description: 'Victim narrative without showing personal agency or action',
    severity: 'major',
    relevant_types: ['challenge', 'diversity'],
    affected_dimensions: ['growth_transformation', 'vulnerability_balance'],
    score_impact: -2,

    detection_phrases: [],
    detection_patterns: [
      'happened to me',
      'I was forced to',
      'I had no choice',
      'there was nothing I could do'
    ],
    detection_logic: 'Passive voice dominant in challenge sections, no "I decided/I did/I chose" statements',

    problem_description: 'Your essay focuses on what happened TO you without showing what you DID about it.',
    why_it_matters: 'Resilience requires agency. Admissions wants to see how you responded, not just what you endured.',
    fix_suggestions: [
      'Focus on your choices and actions',
      'Use active voice: "I decided," "I chose," "I created"',
      'Show specific steps you took to address the challenge',
      'Highlight moments where you had control'
    ]
  },

  {
    id: 'GENERIC_LESSONS',
    name: 'Generic Clichéd Lessons',
    description: 'Essay concludes with generic, clichéd takeaways',
    severity: 'major',
    relevant_types: 'all',
    affected_dimensions: ['reflection_insight', 'authenticity_voice'],
    score_impact: -2,

    detection_phrases: [
      'hard work pays off',
      'never give up',
      'teamwork makes the dream work',
      'believe in yourself',
      'everything happens for a reason',
      'failure is the best teacher',
      'step outside my comfort zone',
      'think outside the box',
      'at the end of the day'
    ],
    detection_patterns: [
      '(hard work|perseverance|determination) (pays off|is key|matters)',
      'never give up',
      '(believe in|trust) (yourself|myself)',
      'step outside (my|your|one\'s) comfort zone'
    ],
    detection_logic: 'Essay contains clichéd wisdom or generic lessons',

    problem_description: 'Your essay ends with generic wisdom that could appear in any essay.',
    why_it_matters: 'Clichéd lessons are forgettable. Your unique insight - the one only YOU could have - is what makes an essay memorable.',
    fix_suggestions: [
      'Delete all clichéd phrases',
      'Ask: What did I learn that ONLY I could learn from THIS experience?',
      'Be specific about your insight - make it yours',
      'Show the insight through changed behavior, not stated wisdom'
    ],
    example_before: 'This experience taught me that hard work pays off and to never give up.',
    example_after: 'I learned that I work best at 2 AM with headphones on, and that asking for help isn\'t failure - it\'s how I finally understood recursion after three weeks of confusion.'
  },

  {
    id: 'REPEATED_THEMES',
    name: 'Repeated Application Themes',
    description: 'Essay repeats themes already covered in other parts of application',
    severity: 'major',
    relevant_types: ['optional', 'additional_info'],
    affected_dimensions: ['strategic_coherence'],
    score_impact: -2,

    detection_phrases: [],
    detection_patterns: [],
    detection_logic: 'Content significantly overlaps with main essay or other supplementals',

    problem_description: 'This essay repeats themes you\'ve already covered elsewhere in your application.',
    why_it_matters: 'Every essay should show a NEW dimension of you. Repeating themes wastes valuable space to demonstrate range.',
    fix_suggestions: [
      'List what each essay covers - look for gaps',
      'Use this essay to show a completely different side',
      'Think: What would surprise someone who read my other essays?',
      'Consider skipping optional essays if you can\'t add something new'
    ]
  },

  {
    id: 'DEFENSIVE_OR_APOLOGETIC',
    name: 'Defensive or Apologetic Tone',
    description: 'Essay adopts a defensive, apologetic, or self-deprecating tone',
    severity: 'major',
    relevant_types: ['diversity', 'challenge', 'additional_info'],
    affected_dimensions: ['authenticity_voice', 'vulnerability_balance', 'personal_connection'],
    score_impact: -3,

    detection_phrases: [
      'I\'m sorry that',
      'I apologize for',
      'unfortunately I',
      'I had to',
      'I was forced to',
      'despite my background',
      'even though I\'m',
      'although I\'m not',
      'I know it\'s not much',
      'it\'s not a big deal',
      'I don\'t mean to complain',
      'I hope you understand'
    ],
    detection_patterns: [
      'I (apologize|am sorry|regret) (for|that)',
      '(unfortunately|sadly|regrettably),? I',
      '(despite|in spite of) (my|being)',
      'I (had|was forced|was made) to',
      'I know (it\'?s?|this is) not (much|impressive|special)'
    ],
    detection_logic: 'Essay uses language that apologizes for circumstances or minimizes achievements',

    problem_description: 'Your essay sounds apologetic or defensive. You\'re minimizing your experiences instead of owning them.',
    why_it_matters: 'Apologetic tone signals you don\'t believe in yourself. Admissions wants to see pride in who you are, not shame about your circumstances.',
    fix_suggestions: [
      'Replace "I had to" with "I chose to" or "I learned to"',
      'Delete phrases that minimize your experiences',
      'Reframe challenges as sources of strength, not excuses',
      'Own your story with confidence - your perspective is valuable',
      'Replace apologies with statements of growth and agency'
    ],
    example_before: 'I\'m sorry that my family couldn\'t afford extracurriculars. Unfortunately, I had to work instead of joining clubs.',
    example_after: 'Working 20 hours weekly at my uncle\'s restaurant taught me customer service, inventory management, and how to calm angry customers - skills no club could have provided.'
  },

  {
    id: 'BRAGGING_WITHOUT_VULNERABILITY',
    name: 'Bragging Without Vulnerability',
    description: 'Essay focuses on achievements without any genuine vulnerability or struggle',
    severity: 'major',
    relevant_types: ['leadership', 'extracurricular', 'challenge'],
    affected_dimensions: ['vulnerability_balance', 'authenticity_voice', 'growth_transformation'],
    score_impact: -3,

    detection_phrases: [
      'I excelled at',
      'I was the best',
      'I always succeeded',
      'naturally talented',
      'everyone looked to me',
      'I never failed',
      'I easily achieved',
      'people admired me',
      'recognized for my excellence',
      'stood out from others'
    ],
    detection_patterns: [
      'I (excelled|dominated|outperformed|surpassed)',
      'I (am|was) (the best|exceptional|outstanding|superior)',
      '(everyone|people) (looked to|admired|respected) me',
      'I (never|rarely) (failed|struggled|doubted)',
      '(naturally|effortlessly|easily) (talented|skilled|capable)'
    ],
    detection_logic: 'Essay lists achievements without acknowledging any struggles, doubts, or failures',

    problem_description: 'Your essay reads like a highlight reel without any genuine struggle or vulnerability.',
    why_it_matters: 'Admissions officers see thousands of accomplished students. What makes you memorable is how you handle difficulty, not just success.',
    fix_suggestions: [
      'Add at least one genuine moment of struggle or doubt',
      'Share a failure and what you learned from it',
      'Discuss a time when you questioned yourself',
      'Show growth: who were you BEFORE you developed this strength?',
      'Include a moment when you needed help from others'
    ],
    example_before: 'As captain, I led our debate team to state finals. I was recognized for my exceptional speaking skills and everyone looked to me for guidance.',
    example_after: 'The first debate I ever lost, I cried in the bathroom for twenty minutes. My partner found me and said, "Good. Now you\'ll work harder." She was right. Two years later, I led us to state finals - but I never forgot that losing is what taught me to prepare.'
  },

  {
    id: 'UNREALISTIC_GOALS',
    name: 'Unrealistic or Grandiose Goals',
    description: 'Essay makes unrealistic claims about changing the world or solving major problems',
    severity: 'major',
    relevant_types: ['future_goals', 'why_major', 'community'],
    affected_dimensions: ['strategic_coherence', 'authenticity_voice', 'reflection_insight'],
    score_impact: -2,

    detection_phrases: [
      'change the world',
      'solve world hunger',
      'cure cancer',
      'end poverty',
      'revolutionize the industry',
      'transform society',
      'make the world a better place',
      'impact millions',
      'save the planet',
      'eradicate disease'
    ],
    detection_patterns: [
      '(change|save|transform|revolutionize) the (world|planet|industry)',
      '(solve|end|cure|eradicate) (world hunger|poverty|cancer|disease)',
      'impact (millions|billions|countless)',
      'make the world (a better place|better)'
    ],
    detection_logic: 'Essay makes grandiose claims without concrete, actionable steps',

    problem_description: 'Your goals sound grandiose rather than genuine. "Change the world" is a red flag for admissions.',
    why_it_matters: 'Admissions officers have read thousands of essays promising to "change the world." They prefer specific, achievable goals that show you understand how change actually happens.',
    fix_suggestions: [
      'Replace "change the world" with a specific, achievable impact',
      'Focus on one community, one problem, one solution',
      'Show you understand the complexity of the issue',
      'Connect your goal to something you\'ve already started doing',
      'Be specific: Who will you help? How? With what resources?'
    ],
    example_before: 'I want to major in biology so I can cure cancer and change the world.',
    example_after: 'After watching my grandmother\'s chemotherapy side effects, I became interested in targeted drug delivery. I want to research how nanoparticles can reduce off-target effects in cancer treatment.'
  },

  {
    id: 'JUST_DESCRIBING',
    name: 'Just Describing Without Reflection',
    description: 'Essay describes events chronologically without reflection or insight',
    severity: 'major',
    relevant_types: ['challenge', 'extracurricular', 'leadership'],
    affected_dimensions: ['reflection_insight', 'growth_transformation', 'personal_connection'],
    score_impact: -2,

    detection_phrases: [
      'and then',
      'after that',
      'the next day',
      'first we',
      'then we',
      'finally we',
      'we started by',
      'we ended with'
    ],
    detection_patterns: [
      '(and then|after that|next we|then we|finally we)',
      '(first|second|third|finally),? (we|I) (did|went|started)',
      'the next (day|week|month),? (we|I)'
    ],
    detection_logic: 'Essay reads like a chronological list of events without pausing for reflection',

    problem_description: 'Your essay reads like a timeline of events without any reflection on meaning or growth.',
    why_it_matters: 'Admissions wants to understand how you THINK, not just what you DID. Description without reflection misses the point.',
    fix_suggestions: [
      'After describing an event, add: "What this taught me was..."',
      'Replace some "and then" transitions with "I realized" or "This made me question"',
      'Cut half the events and double the reflection',
      'Ask: What would someone who wasn\'t there NOT understand about this?',
      'Focus on one key moment and go deep, not wide'
    ],
    example_before: 'First we fundraised, then we planned the event, then we organized volunteers, and finally we held the event.',
    example_after: 'When only three volunteers showed up for an event we\'d planned for months, I learned that enthusiasm doesn\'t equal commitment. That night, I redesigned our volunteer training to build real ownership.'
  },

  {
    id: 'MAKING_EXCUSES',
    name: 'Making Excuses for Performance',
    description: 'Essay frames weaknesses as excuses rather than areas for growth',
    severity: 'major',
    relevant_types: ['additional_info', 'challenge'],
    affected_dimensions: ['growth_transformation', 'authenticity_voice', 'vulnerability_balance'],
    score_impact: -2,

    detection_phrases: [
      'wasn\'t my fault',
      'I couldn\'t because',
      'the teacher was',
      'if only',
      'they didn\'t let me',
      'I would have but',
      'circumstances prevented',
      'I wasn\'t given the chance'
    ],
    detection_patterns: [
      '(wasn\'t|isn\'t|won\'t) my fault',
      'if only (I|the|my)',
      '(they|the teacher|my parents) (didn\'t|wouldn\'t) (let|allow)',
      'I (couldn\'t|wouldn\'t|didn\'t) because (my|the|they)'
    ],
    detection_logic: 'Essay places blame externally rather than showing ownership',

    problem_description: 'Your essay sounds like you\'re making excuses rather than taking ownership.',
    why_it_matters: 'Admissions wants students who take responsibility. External blame suggests you won\'t grow from challenges.',
    fix_suggestions: [
      'Replace "I couldn\'t because X" with "I chose to prioritize Y"',
      'Focus on what you learned, not why it wasn\'t your fault',
      'Show what you would do differently now',
      'Own your choices, even difficult ones',
      'Reframe obstacles as context, not excuses'
    ],
    example_before: 'My grades dropped junior year because my teacher didn\'t explain things well and I wasn\'t given extra help.',
    example_after: 'My grades dropped junior year because I didn\'t ask for help when I needed it. I\'ve since learned to advocate for myself - I now visit office hours regularly.'
  },

  {
    id: 'PASSIVE_PARTICIPATION',
    name: 'Passive Participation Description',
    description: 'Essay describes being part of something without showing individual contribution',
    severity: 'major',
    relevant_types: ['extracurricular', 'leadership', 'community'],
    affected_dimensions: ['specificity_evidence', 'personal_connection', 'growth_transformation'],
    score_impact: -2,

    detection_phrases: [
      'I was part of',
      'I was a member of',
      'I participated in',
      'we accomplished',
      'our team achieved',
      'together we',
      'as a group we'
    ],
    detection_patterns: [
      'I (was|am) (a |part of |member of )(the |our |a )?',
      'I participated in',
      '(we|our team|the group|together we) (accomplished|achieved|won|succeeded)'
    ],
    detection_logic: 'Essay uses collective language without showing individual initiative or contribution',

    problem_description: 'Your essay describes group achievements without clarifying YOUR specific role and contribution.',
    why_it_matters: 'Admissions is evaluating YOU, not your team. They need to understand what YOU specifically did.',
    fix_suggestions: [
      'Replace "we accomplished" with "I proposed/built/led/designed..."',
      'Specify your unique role: "While others did X, I focused on Y"',
      'Show a decision YOU made that affected the outcome',
      'Describe a moment when YOU took initiative',
      'Use "I" more than "we" when describing actions'
    ],
    example_before: 'I was part of our school\'s robotics team. We won the state championship and accomplished amazing things together.',
    example_after: 'On our robotics team, I redesigned the gripper mechanism after our first prototype kept dropping objects. My solution—adding a pressure sensor—became standard for the whole team.'
  },

  {
    id: 'RESUME_LISTING',
    name: 'Resume-Style Achievement Listing',
    description: 'Essay lists achievements without narrative connection or meaning',
    severity: 'major',
    relevant_types: ['extracurricular', 'leadership', 'additional_info'],
    affected_dimensions: ['narrative_clarity', 'authenticity_voice', 'reflection_insight'],
    score_impact: -2,

    detection_phrases: [
      'I also',
      'in addition',
      'additionally',
      'furthermore',
      'moreover',
      'not only... but also',
      'I have also',
      'I am also'
    ],
    detection_patterns: [
      '(I also|In addition|Additionally|Furthermore|Moreover),? (I )?(am|have|was|serve)',
      'Not only.{10,50}but also',
      '(President|Captain|Founder|Member) of.{5,30}(President|Captain|Founder|Member) of'
    ],
    detection_logic: 'Essay reads like a resume with multiple disconnected achievements',

    problem_description: 'Your essay reads like a list of achievements from your resume, not a story.',
    why_it_matters: 'Admissions already has your resume. Essays should reveal something deeper—your thinking, values, or growth.',
    fix_suggestions: [
      'Choose ONE achievement and go deep',
      'Remove all "I also" and "Additionally" transitions',
      'Ask: What would someone learn about me from this story?',
      'Focus on the journey, not the destination',
      'Show the WHY behind one thing rather than the WHAT of many'
    ],
    example_before: 'I am President of NHS. I also captain the debate team. Additionally, I founded the coding club and serve as class treasurer.',
    example_after: 'Founding the coding club wasn\'t about my resume. It started when I noticed freshmen struggling alone with the same problems I\'d solved years ago. I wanted to build what I wished I\'d had.'
  }
];

// ============================================================================
// MINOR ISSUES (-1 to -2 points)
// ============================================================================

const MINOR_ISSUES: IssuePattern[] = [
  {
    id: 'WEAK_OPENING',
    name: 'Weak Generic Opening',
    description: 'Opens with generic, low-stakes language',
    severity: 'minor',
    relevant_types: 'all',
    affected_dimensions: ['narrative_clarity', 'impact_memorability'],
    score_impact: -1,

    detection_phrases: [
      'As president of',
      'As a member of',
      'In my junior year',
      'Throughout my high school career',
      'Growing up',
      'When I was young'
    ],
    detection_patterns: [
      '^As (a |the )?(president|member|captain|leader)',
      '^(Throughout|During) (my|the)',
      '^In my (freshman|sophomore|junior|senior) year',
      '^Growing up'
    ],
    detection_logic: 'First sentence matches generic opening pattern',

    problem_description: 'Your opening is generic and doesn\'t hook the reader.',
    why_it_matters: 'Admissions officers read your first line first. A generic opener signals a generic essay.',
    fix_suggestions: [
      'Start with action, dialogue, or a specific moment',
      'Open with sensory details that ground the reader',
      'Begin in medias res (in the middle of action)',
      'Ask yourself: Would this first line make someone want to keep reading?'
    ],
    example_before: 'As president of the debate club, I have learned many valuable lessons about leadership.',
    example_after: '"That\'s not an argument, that\'s a Wikipedia summary." My debate partner\'s words stung, but she was right.'
  },

  {
    id: 'NO_DIALOGUE',
    name: 'Missing Dialogue',
    description: 'Narrative essay with no quoted speech',
    severity: 'minor',
    relevant_types: ['challenge', 'extracurricular', 'leadership', 'diversity'],
    affected_dimensions: ['narrative_clarity', 'authenticity_voice'],
    score_impact: -1,

    detection_phrases: [],
    detection_patterns: [
      '"[^"]+"',  // Should find quoted dialogue
      '"'
    ],
    detection_logic: 'Essay is narrative-driven but contains no quoted dialogue',

    problem_description: 'Your story has no dialogue. Adding even one line of quoted speech brings scenes to life.',
    why_it_matters: 'Dialogue is one of the most powerful tools for making scenes vivid. It makes abstract moments concrete.',
    fix_suggestions: [
      'Add 1-2 lines of dialogue at key moments',
      'Use dialogue to reveal character or tension',
      'Include what someone said that changed your perspective',
      'Don\'t overdo it - 1-2 lines is often enough'
    ]
  },

  {
    id: 'WEAK_VERBS',
    name: 'Weak Generic Verbs',
    description: 'Overuse of generic verbs like "was," "did," "got"',
    severity: 'minor',
    relevant_types: 'all',
    affected_dimensions: ['authenticity_voice'],
    score_impact: -1,

    detection_phrases: [],
    detection_patterns: [
      '\\b(was|were|got|did|had|made)\\b'
    ],
    detection_logic: 'High frequency of generic verbs (>20% of verbs)',

    problem_description: 'Your essay relies on weak, generic verbs.',
    why_it_matters: 'Strong verbs add energy and specificity. "I ran" is clearer than "I did running."',
    fix_suggestions: [
      'Replace "was" with active verbs where possible',
      'Use precise verbs: "sprinted" instead of "ran fast"',
      'Ctrl+F for "was," "were," "got," "did" and revise',
      'Aim for 80%+ active voice'
    ]
  },

  {
    id: 'ADJECTIVE_STACKING',
    name: 'Adjective Stacking',
    description: 'Multiple adjectives where one would do',
    severity: 'minor',
    relevant_types: 'all',
    affected_dimensions: ['authenticity_voice'],
    score_impact: -1,

    detection_phrases: [
      'amazing, incredible',
      'great, wonderful',
      'truly amazing',
      'absolutely incredible',
      'very unique'
    ],
    detection_patterns: [
      '(amazing|incredible|wonderful|fantastic|great),? (and )?(amazing|incredible|wonderful|fantastic|great)',
      '(truly|absolutely|very|really) (amazing|incredible|unique|special)'
    ],
    detection_logic: 'Multiple adjectives used together or intensifier + adjective combinations',

    problem_description: 'You\'re stacking adjectives. One precise word is better than three vague ones.',
    why_it_matters: 'Adjective stacking signals weak writing and wastes precious word count.',
    fix_suggestions: [
      'Delete all but one adjective',
      'Choose the most specific, precise word',
      'Remove intensifiers (very, truly, absolutely)',
      'Let your story create the emotion, not your adjectives'
    ],
    example_before: 'It was a truly amazing, incredible, life-changing experience.',
    example_after: 'It changed how I saw failure.'
  },

  {
    id: 'THROAT_CLEARING',
    name: 'Throat-Clearing Phrases',
    description: 'Unnecessary setup phrases before main content',
    severity: 'minor',
    relevant_types: 'all',
    affected_dimensions: ['authenticity_voice', 'narrative_clarity'],
    score_impact: -1,

    detection_phrases: [
      'I would like to',
      'I want to tell you about',
      'This essay will discuss',
      'In this essay',
      'I am going to talk about',
      'The purpose of this essay is'
    ],
    detection_patterns: [
      'I would like to (talk about|discuss|tell)',
      'This essay will (discuss|explore|examine)',
      'In this essay,? I will'
    ],
    detection_logic: 'Essay contains meta-commentary about what it will discuss',

    problem_description: 'You\'re spending words talking ABOUT what you\'re going to say instead of just saying it.',
    why_it_matters: 'Every word counts. "I would like to tell you about my experience" is 8 words you could use to actually tell the experience.',
    fix_suggestions: [
      'Delete all "This essay will discuss" type phrases',
      'Start with the actual content',
      'Jump straight into the story or point',
      'Trust that the reader knows what an essay is'
    ],
    example_before: 'I would like to tell you about an experience that changed my perspective on leadership.',
    example_after: 'The team meeting was silent. Everyone stared at their shoes. I realized I\'d been talking for ten minutes without asking a single question.'
  },

  {
    id: 'WORD_COUNT_PADDING',
    name: 'Word Count Padding',
    description: 'Unnecessary phrases that add length without content',
    severity: 'minor',
    relevant_types: 'all',
    affected_dimensions: ['authenticity_voice', 'narrative_clarity'],
    score_impact: -1,

    detection_phrases: [
      'in order to',
      'due to the fact that',
      'for the purpose of',
      'in the event that',
      'at this point in time',
      'the fact that',
      'in my opinion',
      'I personally think'
    ],
    detection_patterns: [
      'in order to',
      'due to the fact that',
      'for the purpose of',
      'at this point in time'
    ],
    detection_logic: 'Essay contains wordy phrases that could be simplified',

    problem_description: 'Your essay contains wordy phrases that could be simplified.',
    why_it_matters: 'These phrases add length without adding meaning. In word-limited essays, every word must earn its place.',
    fix_suggestions: [
      '"In order to" → "to"',
      '"Due to the fact that" → "because"',
      '"At this point in time" → "now"',
      'Read each sentence: Can any words be cut without losing meaning?'
    ]
  }
];

// ============================================================================
// ALL PATTERNS
// ============================================================================

export const ALL_ISSUE_PATTERNS: IssuePattern[] = [
  ...CRITICAL_ISSUES,
  ...MAJOR_ISSUES,
  ...MINOR_ISSUES
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all issue patterns
 */
export function getAllIssuePatterns(): IssuePattern[] {
  return ALL_ISSUE_PATTERNS;
}

/**
 * Get patterns relevant to a specific essay type
 */
export function getPatternsByType(type: SupplementalType): IssuePattern[] {
  return ALL_ISSUE_PATTERNS.filter(pattern =>
    pattern.relevant_types === 'all' ||
    pattern.relevant_types.includes(type)
  );
}

/**
 * Get patterns by severity
 */
export function getPatternsBySeverity(severity: IssueSeverity): IssuePattern[] {
  return ALL_ISSUE_PATTERNS.filter(pattern => pattern.severity === severity);
}

/**
 * Get pattern by ID
 */
export function getPatternById(id: string): IssuePattern | undefined {
  return ALL_ISSUE_PATTERNS.find(pattern => pattern.id === id);
}

/**
 * Patterns that should match when something is ABSENT (inverted logic)
 */
const ABSENCE_PATTERNS = ['NO_NUMBERS', 'NO_DIALOGUE'];

/**
 * Check if text has any numbers/metrics
 */
function hasNumbers(text: string): boolean {
  // Check for digits, percentages, time periods
  return /\d+/.test(text) ||
    /\b(percent|hours|weeks|months|years|students|people|members)\b/i.test(text);
}

/**
 * Check if text has dialogue (quoted speech)
 */
function hasDialogue(text: string): boolean {
  // Check for quoted text
  return /"[^"]+"|'[^']+'/.test(text);
}

/**
 * Check if text has contribution/giving language (for ONE_SIDED_FIT)
 */
function hasContributionLanguage(text: string): boolean {
  const lowerText = text.toLowerCase();
  const contributionPhrases = [
    'i will contribute',
    'i\'d contribute',
    'i would contribute',
    'i will bring',
    'i\'d bring',
    'i can bring',
    'i can offer',
    'i will share',
    'contribute to',
    'my experience with',
    'my background in',
    'i founded',
    'i created',
    'i built',
    'i developed',
    'sharing my',
    'bring my'
  ];

  return contributionPhrases.some(phrase => lowerText.includes(phrase));
}

/**
 * Patterns that require balanced detection (check for presence AND absence of something)
 */
const BALANCED_PATTERNS = ['ONE_SIDED_FIT'];

/**
 * Check text for phrase-based detection
 * Returns list of pattern IDs that match
 *
 * @param text - The essay text to analyze
 * @param essayType - Optional essay type for type-aware detection
 */
export function detectPhrasePatterns(text: string, essayType?: SupplementalType): string[] {
  const lowerText = text.toLowerCase();
  const matchedPatterns: string[] = [];

  // Essay types where NO_NUMBERS is NOT expected (narrative/reflective types)
  const typesWhereNumbersOptional: SupplementalType[] = [
    'intellectual', 'values', 'diversity', 'creative', 'challenge'
  ];

  // Essay types where NO_DIALOGUE is NOT expected (analytical types)
  const typesWhereDialogueOptional: SupplementalType[] = [
    'why_us', 'why_major', 'values', 'future_goals', 'intellectual'
  ];

  for (const pattern of ALL_ISSUE_PATTERNS) {
    let matched = false;

    // Handle inverted/absence patterns specially with type awareness
    if (ABSENCE_PATTERNS.includes(pattern.id)) {
      if (pattern.id === 'NO_NUMBERS' && !hasNumbers(text)) {
        // Skip NO_NUMBERS detection for types where numbers aren't expected
        if (essayType && typesWhereNumbersOptional.includes(essayType)) {
          continue; // Don't flag - numbers not expected for this type
        }
        matched = true;
      } else if (pattern.id === 'NO_DIALOGUE' && !hasDialogue(text)) {
        // Skip NO_DIALOGUE detection for analytical essay types
        if (essayType && typesWhereDialogueOptional.includes(essayType)) {
          continue; // Don't flag - dialogue not expected for this type
        }
        matched = true;
      }
    } else if (BALANCED_PATTERNS.includes(pattern.id)) {
      // Handle balanced patterns that need both presence AND absence checks
      if (pattern.id === 'ONE_SIDED_FIT') {
        // Check if essay has receiving language
        let hasReceivingLanguage = false;
        for (const phrase of pattern.detection_phrases) {
          if (lowerText.includes(phrase.toLowerCase())) {
            hasReceivingLanguage = true;
            break;
          }
        }
        // Only flag if there's receiving language WITHOUT contribution language
        if (hasReceivingLanguage && !hasContributionLanguage(text)) {
          matched = true;
        }
      }
    } else {
      // Check if pattern is relevant to this essay type
      if (essayType && pattern.relevant_types !== 'all') {
        if (!pattern.relevant_types.includes(essayType)) {
          continue; // Pattern not relevant for this essay type
        }
      }

      // Check detection phrases
      for (const phrase of pattern.detection_phrases) {
        if (lowerText.includes(phrase.toLowerCase())) {
          matched = true;
          break;
        }
      }

      // Check regex patterns
      if (!matched) {
        for (const regexStr of pattern.detection_patterns) {
          try {
            const regex = new RegExp(regexStr, 'gi');
            if (regex.test(text)) {
              matched = true;
              break;
            }
          } catch {
            // Invalid regex, skip
          }
        }
      }
    }

    if (matched) {
      matchedPatterns.push(pattern.id);
    }
  }

  return matchedPatterns;
}

/**
 * Get fix suggestions for a pattern
 */
export function getFixSuggestions(patternId: string): string[] {
  const pattern = getPatternById(patternId);
  return pattern?.fix_suggestions || [];
}

/**
 * Calculate total score impact from multiple issues
 */
export function calculateIssueImpact(patternIds: string[]): number {
  let totalImpact = 0;

  for (const id of patternIds) {
    const pattern = getPatternById(id);
    if (pattern) {
      totalImpact += pattern.score_impact;
    }
  }

  return totalImpact;
}
