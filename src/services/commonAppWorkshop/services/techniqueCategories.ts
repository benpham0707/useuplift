// @ts-nocheck
/**
 * Technique Categories
 *
 * Defines the full spectrum of essay-strengthening techniques beyond just storytelling.
 * Each category represents a distinct approach that can be appropriate depending on:
 * - Essay type (why_us vs intellectual vs extracurricular)
 * - Essay element (opening vs body vs reflection)
 * - What's already present vs missing
 *
 * The goal is to enable context-aware recommendations that match the right technique
 * to the right situation, rather than defaulting to storytelling.
 */

import { SupplementalType } from '../types';
import { EssayElement } from './essayElementDetector';

// ============================================================================
// CORE TYPES
// ============================================================================

export type TechniqueCategory =
  | 'storytelling'           // Current system - scenes, dialogue, sensory details
  | 'technical_depth'        // Domain expertise, methodology, process thinking
  | 'evidence_impact'        // Metrics, scale, quantifiable results
  | 'intellectual_character' // How you think, not what you did
  | 'reflection_depth'       // Meaning-making, growth, self-awareness
  | 'voice_authenticity'     // Personality through word choice and perspective
  | 'complexity_showcase'    // Nuance, tensions, unresolved questions
  | 'connection_specificity'; // Concrete links to school/major/future

export type TechniquePriority = 'primary' | 'secondary' | 'optional' | 'avoid';

export interface TechniqueRecommendation {
  category: TechniqueCategory;
  priority: TechniquePriority;
  rationale: string;
  exampleApproaches: string[];
  antiPatterns: string[];  // What NOT to do
  signals: string[];       // What would indicate this technique is working
}

export interface TechniqueTransformation {
  before: string;
  after: string;
  why_it_works: string;
}

export interface TechniqueBundle {
  category: TechniqueCategory;
  name: string;
  description: string;
  whenToUse: string[];
  whenToAvoid: string[];
  corePrinciples: string[];
  examplePhrases: string[];
  antiPatterns: string[];
  integrationTips: string[];  // How to combine with other techniques
  transformations: TechniqueTransformation[];  // Before/after examples for prompts
}

// ============================================================================
// TECHNIQUE BUNDLES
// ============================================================================

export const TECHNIQUE_BUNDLES: Record<TechniqueCategory, TechniqueBundle> = {
  storytelling: {
    category: 'storytelling',
    name: 'Storytelling & Scene-Setting',
    description: 'Create vivid moments through scenes, dialogue, and sensory details',
    whenToUse: [
      'Opening hooks that need to grab attention',
      'Pivotal moments that changed your perspective',
      'Demonstrating character through action',
      'Challenge essays showing difficulty and response',
      'When emotion and stakes need to be felt, not explained',
    ],
    whenToAvoid: [
      'Why Us essays focused on school fit (need specificity instead)',
      'Evidence sections that need metrics',
      'When you\'ve already told a story - don\'t add another',
      'Intellectual essays where thinking matters more than doing',
      'When word count is tight and evidence is more valuable',
    ],
    corePrinciples: [
      'Show, don\'t tell - let readers draw conclusions from actions',
      'Use specific sensory details, not generic descriptions',
      'Include dialogue that reveals character',
      'Create tension and stakes before resolution',
      'Ground abstract lessons in concrete moments',
    ],
    examplePhrases: [
      '"What do you mean it won\'t compile?" I stared at the screen...',
      'The smell of soldering flux filled the robotics lab as...',
      'My hands shook as I clicked submit...',
      'Three AM. The code still broken. Coffee cold.',
    ],
    antiPatterns: [
      'Starting with "I have always been passionate about..."',
      'Generic descriptions: "it was a beautiful day"',
      'Telling emotion instead of showing: "I felt so happy"',
      'Summarizing events instead of showing a moment',
      'Using story to avoid making concrete claims',
    ],
    integrationTips: [
      'After a vivid moment, bridge to reflection or evidence',
      'Use story to set up evidence: "That night, I saw the data: 40% improvement"',
      'Don\'t let story dominate - it\'s a vehicle, not the destination',
    ],
    transformations: [
      {
        before: 'I learned a lot from being team captain.',
        after: '"You\'re not listening!" My co-captain\'s words stopped me mid-sentence. She was right. I\'d spent ten minutes explaining my strategy without once asking for input.',
        why_it_works: 'Grounds an abstract claim in a specific, vivid moment with dialogue that reveals character through action.',
      },
      {
        before: 'The competition was really stressful.',
        after: 'Three AM. The code still broken. Coffee cold. My teammate asleep on the keyboard. I deleted everything and started over.',
        why_it_works: 'Replaces a told emotion with a shown scene using sensory details and pacing that lets the reader feel the stress.',
      },
    ],
  },

  technical_depth: {
    category: 'technical_depth',
    name: 'Technical Depth & Domain Expertise',
    description: 'Demonstrate intellectual substance through methodology, process, and domain knowledge',
    whenToUse: [
      'Why Major essays showing genuine engagement with the field',
      'Intellectual essays requiring depth of thought',
      'Extracurricular essays about technical pursuits (research, coding, engineering)',
      'When your differentiator is how you think, not just what you did',
      'To establish credibility before making future claims',
    ],
    whenToAvoid: [
      'When jargon would alienate non-expert readers',
      'Challenge essays focused on personal growth',
      'Diversity essays about identity and belonging',
      'When the technical details aren\'t yours (you\'re a participant, not driver)',
    ],
    corePrinciples: [
      'Name specific methodologies, frameworks, or approaches you used',
      'Show intellectual process, not just results',
      'Reveal how you troubleshoot, iterate, or problem-solve',
      'Connect domain knowledge to broader implications',
      'Demonstrate genuine understanding, not surface familiarity',
    ],
    examplePhrases: [
      'I implemented a recursive backtracking algorithm to...',
      'The GC-MS analysis revealed unexpected peaks at...',
      'Using a mixed-methods approach, I combined...',
      'The Hamiltonian suggested a novel conservation law...',
      'I applied Bayesian inference to quantify uncertainty in...',
    ],
    antiPatterns: [
      'Dropping terminology without demonstrating understanding',
      'Claiming expertise in areas you only touched surface-level',
      'Using technical language to obscure lack of substance',
      'All process, no insight - what did you learn from it?',
      'Name-dropping concepts without connecting to your work',
    ],
    integrationTips: [
      'Pair technical depth with reflection on what it taught you',
      'Use specific examples to ground abstract concepts',
      'Show the human side: what excited or frustrated you?',
    ],
    transformations: [
      {
        before: 'I did research on machine learning.',
        after: 'I implemented a convolutional neural network with three hidden layers, experimenting with dropout rates to address overfitting. When accuracy plateaued at 78%, I hypothesized that our feature extraction was losing spatial information.',
        why_it_works: 'Replaces a vague claim with specific methodology and intellectual process, demonstrating genuine domain knowledge.',
      },
      {
        before: 'I\'m interested in economics.',
        after: 'Reading Kahneman\'s work on loss aversion, I began questioning the rational actor model I\'d learned in AP Econ. If people systematically overweight losses, what does that mean for policies designed around utility maximization?',
        why_it_works: 'Shows intellectual engagement through specific references and an unresolved question that reveals genuine curiosity.',
      },
    ],
  },

  evidence_impact: {
    category: 'evidence_impact',
    name: 'Evidence & Impact Metrics',
    description: 'Quantify your contributions with specific, meaningful outcomes',
    whenToUse: [
      'Extracurricular essays claiming impact or leadership',
      'Why Us essays demonstrating what you\'ll contribute',
      'Leadership essays proving scale of responsibility',
      'When claims need credibility boost',
      'To differentiate from similar applicants with similar activities',
    ],
    whenToAvoid: [
      'When numbers would seem like bragging without context',
      'Diversity essays where metrics miss the point',
      'Creative essays where art isn\'t quantifiable',
      'When the numbers aren\'t truly yours',
    ],
    corePrinciples: [
      'Quantify scope: how many people, dollars, hours, events?',
      'Use concrete comparisons: "doubled from X to Y"',
      'Show ripple effects: what changed because of this?',
      'Avoid vanity metrics: focus on meaningful outcomes',
      'Contextualize: "In a school of 2000, this was..."',
    ],
    examplePhrases: [
      'Grew membership from 12 to 47 students in one semester',
      'Raised $3,400 for local food bank through...',
      'Our research was cited by 3 peer-reviewed publications',
      'Mentored 15 freshmen, with 13 continuing in the program',
      'Reduced processing time by 60%, saving 8 hours weekly',
    ],
    antiPatterns: [
      'Numbers without context: "I have 500 volunteer hours"',
      'Vanity metrics that don\'t show impact',
      'Claiming others\' achievements as your own',
      'Precision without accuracy: fake-sounding specificity',
      'Metrics that contradict your narrative (bigger isn\'t always better)',
    ],
    integrationTips: [
      'Use metrics to support story: "That\'s when I saw the data..."',
      'Follow metrics with meaning: "These numbers meant..."',
      'Balance quantitative with qualitative impact',
    ],
    transformations: [
      {
        before: 'Our club made a real difference in the community.',
        after: 'In two years, we grew from 8 members to 43, partnered with 12 local businesses, and raised $4,200 for the food bank—enough to provide 12,600 meals.',
        why_it_works: 'Replaces a vague claim with specific, quantifiable outcomes that create credibility through precision.',
      },
      {
        before: 'I helped many students with tutoring.',
        after: 'I tutored 15 students weekly, with 11 improving by at least one letter grade. Three went from failing to honor roll.',
        why_it_works: 'Quantifies impact with meaningful metrics and shows progression, not just effort.',
      },
    ],
  },

  intellectual_character: {
    category: 'intellectual_character',
    name: 'Intellectual Character & Thinking Style',
    description: 'Reveal how you think, question, and engage with ideas - your intellectual personality',
    whenToUse: [
      'Intellectual curiosity essays (explicitly asking how you think)',
      'Why Major essays showing genuine intellectual engagement',
      'To differentiate from applicants with similar achievements',
      'When your thinking process is more interesting than outcomes',
      'Research-focused essays where methodology matters',
    ],
    whenToAvoid: [
      'When you haven\'t actually done the intellectual work',
      'Action-heavy extracurriculars where doing matters more',
      'When it comes across as showing off intelligence',
    ],
    corePrinciples: [
      'Show your thought process, not just conclusions',
      'Include moments of intellectual struggle or confusion',
      'Reveal what questions drive you (not just answers)',
      'Demonstrate intellectual humility: what you don\'t know',
      'Show how you connect ideas across domains',
    ],
    examplePhrases: [
      'I kept returning to one question: why does...',
      'The contradiction bothered me. How could both be true?',
      'I realized I had been assuming...',
      'This forced me to reconsider...',
      'I\'m still not sure, but I suspect...',
    ],
    antiPatterns: [
      'Performative intelligence: using big words to sound smart',
      'Claiming to "love learning" without showing it',
      'All conclusions, no process: "I discovered that..."',
      'Name-dropping philosophers/theorists you haven\'t engaged with',
      'Pretending certainty when you don\'t have it',
    ],
    integrationTips: [
      'Ground intellectual character in specific examples',
      'Show thinking through dialogue with mentors or texts',
      'Balance curiosity with some provisional conclusions',
    ],
    transformations: [
      {
        before: 'I discovered I love physics.',
        after: 'I keep a notebook of "physics moments"—times when a concept suddenly connected to something unexpected. Last month: realizing that the feeling of being pressed into your seat on a roller coaster and gravity are, fundamentally, indistinguishable. Einstein\'s insight, experienced.',
        why_it_works: 'Shows how the writer engages with ideas through a specific intellectual habit, not just a claimed interest.',
      },
      {
        before: 'The project taught me a lot.',
        after: 'The project forced me to confront a question I\'m still working through: at what point does optimization become over-optimization? We improved efficiency by 40%, but the original system had a certain robustness that the optimized version lost.',
        why_it_works: 'Reveals ongoing intellectual engagement and an unresolved question, showing thinking process rather than just conclusions.',
      },
    ],
  },

  reflection_depth: {
    category: 'reflection_depth',
    name: 'Reflection & Meaning-Making',
    description: 'Go beyond surface lessons to reveal genuine self-awareness and growth',
    whenToUse: [
      'Challenge/growth essays requiring introspection',
      'Any essay needing to explain "so what?"',
      'When the experience alone isn\'t unique - meaning is',
      'To show maturity and self-awareness',
      'When connecting past experience to future goals',
    ],
    whenToAvoid: [
      'When reflection would be redundant (insight already clear)',
      'Why Us essays that need specificity more than reflection',
      'When action/evidence would be more valuable than reflection',
    ],
    corePrinciples: [
      'Go beyond "I learned" to show how understanding changed',
      'Include unexpected or non-obvious realizations',
      'Show ongoing thinking, not just conclusions',
      'Connect personal insight to broader understanding',
      'Be honest about limitations and remaining questions',
    ],
    examplePhrases: [
      'What surprised me wasn\'t the failure itself, but...',
      'I used to think... Now I understand that...',
      'The real lesson wasn\'t [obvious thing]. It was...',
      'I\'m still working through what this means for...',
      'This changed not just what I think, but how I think about...',
    ],
    antiPatterns: [
      'Generic lessons: "I learned the importance of hard work"',
      'Claiming transformation without showing the process',
      'Moral of the story endings',
      'Reflection that could apply to anyone',
      'Over-processing: multiple paragraphs of reflection on minor events',
    ],
    integrationTips: [
      'Reflection is strongest after specific scenes or evidence',
      'One deep insight beats three shallow ones',
      'Show ongoing reflection, not just past tense "I learned"',
    ],
    transformations: [
      {
        before: 'This experience taught me the importance of teamwork.',
        after: 'What surprised me wasn\'t that teamwork mattered—I knew that. It was discovering that my instinct to take control when things got hard was actually the opposite of leadership. Real leadership meant trusting others with pieces I cared about.',
        why_it_works: 'Goes beyond a generic lesson to an unexpected, personal insight that complicates the obvious takeaway.',
      },
      {
        before: 'I learned to never give up.',
        after: 'I used to think persistence meant refusing to quit. Now I understand it differently: persistence is knowing when to quit one approach so you can try another. I "gave up" on my original design three times before finding one that worked.',
        why_it_works: 'Redefines a cliche through specific experience and shows intellectual growth through qualified insight.',
      },
    ],
  },

  voice_authenticity: {
    category: 'voice_authenticity',
    name: 'Voice & Authenticity',
    description: 'Let your personality shine through word choice, perspective, and tone',
    whenToUse: [
      'Opening and closing where first/last impressions matter',
      'Creative essays explicitly inviting unique voice',
      'To differentiate essays that might otherwise be generic',
      'Throughout - voice should permeate, not be added',
      'When your perspective on something common is what\'s unique',
    ],
    whenToAvoid: [
      'Don\'t force quirkiness where substance matters more',
      'Why Us essays shouldn\'t sacrifice clarity for voice',
      'When "being authentic" becomes performative',
    ],
    corePrinciples: [
      'Write like you talk (to a smart adult you respect)',
      'Include asides, qualifications, humor where natural',
      'Have opinions - neutrality kills voice',
      'Use specific word choices that are yours',
      'Don\'t perform authenticity - just be direct',
    ],
    examplePhrases: [
      'Okay, I\'ll admit it: I was terrified.',
      'Here\'s the thing about [topic] that no one mentions...',
      'I know this sounds strange, but...',
      'The honest answer? I don\'t know yet.',
      '(Yes, I actually spent three hours on this.)',
    ],
    antiPatterns: [
      'Trying too hard to be quirky or unique',
      'Performing emotions: "I was absolutely devastated"',
      'Thesaurus-driven vocabulary that\'s not how you talk',
      'False modesty: "I\'m just a regular kid who..."',
      'Over-polished writing that sounds AI-generated',
    ],
    integrationTips: [
      'Voice comes through most in how you present other elements',
      'Humor works best when paired with substance',
      'Read your essay aloud - does it sound like you?',
    ],
    transformations: [
      {
        before: 'I have always been passionate about helping others.',
        after: 'Honestly? I didn\'t start volunteering because I wanted to help people. I started because my mom made me. The wanting-to-help part came later, around hour 30, when I realized I looked forward to Saturdays.',
        why_it_works: 'Replaces performed enthusiasm with an honest, specific admission that sounds like a real person talking.',
      },
      {
        before: 'This experience was very meaningful to me.',
        after: 'Here\'s the weird part: I miss the frustration. I miss staring at code that refuses to compile at 2 AM. I miss the specific kind of tired that comes from actually caring whether something works.',
        why_it_works: 'Says something only this person would say, in the way they would say it—unexpected honesty that reveals authentic voice.',
      },
    ],
  },

  complexity_showcase: {
    category: 'complexity_showcase',
    name: 'Complexity & Nuance',
    description: 'Demonstrate sophisticated thinking by showing tensions, paradoxes, and unresolved questions',
    whenToUse: [
      'Intellectual essays asking for nuanced thinking',
      'Challenge essays where growth isn\'t simple',
      'Values essays exploring competing priorities',
      'When the "right answer" is too obvious',
      'To show maturity beyond your years',
    ],
    whenToAvoid: [
      'Short answers with no room for nuance',
      'When confidence is what\'s needed (some Why Us essays)',
      'When it would come across as indecisive',
      'Action-focused extracurriculars needing clear narrative',
    ],
    corePrinciples: [
      'Hold multiple truths simultaneously',
      'Show tensions without falsely resolving them',
      'Acknowledge limitations of your own perspective',
      'Find the nuance in experiences others oversimplify',
      'Be comfortable with unresolved questions',
    ],
    examplePhrases: [
      'The uncomfortable truth is that both things are true...',
      'I wanted to believe it was simple, but...',
      'This created a tension I still haven\'t resolved:',
      'The more I learned, the less certain I became about...',
      'I don\'t think there\'s a clean answer here, but...',
    ],
    antiPatterns: [
      'False complexity: "On one hand... on the other hand..."',
      'Pretending uncertainty when you do have a view',
      'Complexity for its own sake, not serving insight',
      'Paralyzing nuance that never reaches any conclusion',
      '"Both sides" framing when one side is clearly right',
    ],
    integrationTips: [
      'Complexity works best after establishing clear stakes',
      'Don\'t let nuance undermine your core message',
      'Show that complexity doesn\'t mean inaction',
    ],
    transformations: [
      {
        before: 'Volunteering taught me to appreciate what I have.',
        after: 'I went in expecting to feel grateful for my privileges. Instead, I felt something more complicated: guilt for my relief that I could go home, respect for resilience I\'d never needed to develop, and an uncomfortable awareness that "helping" can be its own kind of taking.',
        why_it_works: 'Resists the easy conclusion and shows the tensions the writer is still processing—maturity through complexity.',
      },
      {
        before: 'Leadership requires putting the team first.',
        after: 'The hardest leadership decision I made wasn\'t about the team—it was about me. I had to admit that my vision for the project, the one I\'d been pushing for months, was wrong. Putting the team first meant letting go of being right.',
        why_it_works: 'Finds the paradox within conventional wisdom and shows it through a specific experience.',
      },
    ],
  },

  connection_specificity: {
    category: 'connection_specificity',
    name: 'Connection & Fit Specificity',
    description: 'Create undeniable links between you and the school/major/future through concrete details',
    whenToUse: [
      'Why Us essays (essential - the core of the essay)',
      'Why Major essays showing field engagement',
      'Future goals essays needing concrete vision',
      'Closing sections linking experience to next chapter',
    ],
    whenToAvoid: [
      'Opening hooks (better to start with you, not them)',
      'Challenge essays focused on personal growth',
      'Diversity essays about identity (connection should be secondary)',
    ],
    corePrinciples: [
      'Name specific professors, courses, labs, programs, clubs',
      'Show research: mention things not on the website front page',
      'Connect your specific interests to their specific offerings',
      'Demonstrate fit goes both ways: what you\'ll contribute',
      'Be specific enough to fail the "swap test"',
    ],
    examplePhrases: [
      'Professor Chen\'s work on [specific topic] directly connects to...',
      'The [specific program name] would allow me to...',
      'Unlike other universities, [school] offers [specific thing]...',
      'I want to bring my experience with [X] to [specific club/lab]...',
      'The [specific course code/name] curriculum includes...',
    ],
    antiPatterns: [
      'Generic: "I love the diverse student body and beautiful campus"',
      'Name-dropping without showing why it matters to you',
      'Focusing only on rankings or prestige',
      'Saying what you\'ll get without what you\'ll contribute',
      'Information anyone could find in 30 seconds on the website',
    ],
    integrationTips: [
      'Connection specificity often pairs with evidence of past interest',
      'Ground school connections in your story: "When I did X, I realized Y at [school] could..."',
      'Show you\'ve thought beyond admission to what you\'d actually do there',
    ],
    transformations: [
      {
        before: 'I want to attend your university because of its strong engineering program.',
        after: 'Professor Martinez\'s work on sustainable concrete alternatives directly connects to my independent research on construction waste. I want to bring my data on local demolition patterns to her lab and explore whether regional material availability affects optimal mix designs.',
        why_it_works: 'Names specific people, programs, and connects them to the writer\'s specific work—passes the "swap test" completely.',
      },
      {
        before: 'I love the collaborative environment at your school.',
        after: 'The d.school\'s requirement to take at least one course outside your major solved a problem I\'ve been wrestling with: how to combine my interest in urban planning with my background in data science. The ME 310 Global Innovation course would let me do exactly that.',
        why_it_works: 'Cites specific programs/courses and explains precisely why they matter to this particular student\'s goals.',
      },
    ],
  },
};

// ============================================================================
// ESSAY TYPE → TECHNIQUE PRIORITIES
// ============================================================================

/**
 * Default technique priorities by essay type
 * This is the starting point - actual recommendations adjust based on what's present/missing
 */
export const TECHNIQUE_PRIORITIES_BY_TYPE: Record<SupplementalType, {
  primary: TechniqueCategory[];
  secondary: TechniqueCategory[];
  optional: TechniqueCategory[];
  avoid: TechniqueCategory[];
}> = {
  why_us: {
    primary: ['connection_specificity', 'evidence_impact'],
    secondary: ['voice_authenticity', 'intellectual_character'],
    optional: ['storytelling'],
    avoid: ['complexity_showcase'],  // Be confident about fit
  },

  why_major: {
    primary: ['intellectual_character', 'technical_depth'],
    secondary: ['connection_specificity', 'reflection_depth'],
    optional: ['storytelling', 'evidence_impact'],
    avoid: [],
  },

  intellectual: {
    primary: ['intellectual_character', 'complexity_showcase'],
    secondary: ['technical_depth', 'reflection_depth'],
    optional: ['voice_authenticity'],
    avoid: ['evidence_impact'],  // This isn't about achievements
  },

  extracurricular: {
    primary: ['evidence_impact', 'technical_depth'],
    secondary: ['storytelling', 'reflection_depth'],
    optional: ['voice_authenticity'],
    avoid: [],
  },

  challenge: {
    primary: ['storytelling', 'reflection_depth'],
    secondary: ['complexity_showcase', 'voice_authenticity'],
    optional: ['intellectual_character'],
    avoid: ['evidence_impact'],  // Growth matters more than metrics
  },

  diversity: {
    primary: ['voice_authenticity', 'reflection_depth'],
    secondary: ['storytelling', 'complexity_showcase'],
    optional: ['connection_specificity'],
    avoid: ['evidence_impact'],  // Identity isn't quantifiable
  },

  community: {
    primary: ['storytelling', 'reflection_depth'],
    secondary: ['evidence_impact', 'voice_authenticity'],
    optional: ['complexity_showcase'],
    avoid: [],
  },

  leadership: {
    primary: ['evidence_impact', 'storytelling'],
    secondary: ['reflection_depth', 'technical_depth'],
    optional: ['voice_authenticity'],
    avoid: [],
  },

  creative: {
    primary: ['voice_authenticity', 'storytelling'],
    secondary: ['complexity_showcase', 'intellectual_character'],
    optional: ['reflection_depth'],
    avoid: ['evidence_impact', 'connection_specificity'],
  },

  values: {
    primary: ['reflection_depth', 'complexity_showcase'],
    secondary: ['voice_authenticity', 'storytelling'],
    optional: ['intellectual_character'],
    avoid: ['evidence_impact'],
  },

  future_goals: {
    primary: ['connection_specificity', 'evidence_impact'],
    secondary: ['intellectual_character', 'reflection_depth'],
    optional: ['storytelling'],
    avoid: ['complexity_showcase'],  // Be clear about goals
  },

  additional_info: {
    primary: ['evidence_impact', 'connection_specificity'],
    secondary: ['voice_authenticity'],
    optional: ['storytelling', 'reflection_depth'],
    avoid: ['complexity_showcase'],
  },

  short_answer: {
    primary: ['evidence_impact', 'voice_authenticity'],
    secondary: ['connection_specificity'],
    optional: [],
    avoid: ['storytelling', 'complexity_showcase'],  // No room
  },

  optional: {
    primary: ['voice_authenticity', 'reflection_depth'],
    secondary: ['storytelling', 'intellectual_character'],
    optional: ['complexity_showcase'],
    avoid: [],
  },
};

// ============================================================================
// ELEMENT → TECHNIQUE PREFERENCES
// ============================================================================

/**
 * Which techniques work best for each essay element
 */
export const TECHNIQUE_PREFERENCES_BY_ELEMENT: Record<EssayElement, {
  preferred: TechniqueCategory[];
  acceptable: TechniqueCategory[];
  discouraged: TechniqueCategory[];
}> = {
  opening_hook: {
    preferred: ['storytelling', 'voice_authenticity', 'intellectual_character'],
    acceptable: ['complexity_showcase'],
    discouraged: ['evidence_impact', 'connection_specificity', 'technical_depth'],
  },

  context_setup: {
    preferred: ['storytelling', 'technical_depth'],
    acceptable: ['evidence_impact', 'voice_authenticity'],
    discouraged: ['reflection_depth', 'complexity_showcase'],
  },

  action_body: {
    preferred: ['storytelling', 'technical_depth', 'evidence_impact'],
    acceptable: ['intellectual_character'],
    discouraged: ['reflection_depth'],  // Save reflection for later
  },

  evidence_section: {
    preferred: ['evidence_impact', 'technical_depth'],
    acceptable: ['connection_specificity'],
    discouraged: ['storytelling', 'reflection_depth', 'complexity_showcase'],
  },

  reflection_moment: {
    preferred: ['reflection_depth', 'intellectual_character'],
    acceptable: ['complexity_showcase', 'voice_authenticity'],
    discouraged: ['evidence_impact', 'technical_depth', 'storytelling'],
  },

  insight_revelation: {
    preferred: ['complexity_showcase', 'intellectual_character', 'reflection_depth'],
    acceptable: ['voice_authenticity'],
    discouraged: ['storytelling', 'evidence_impact'],
  },

  connection_bridge: {
    preferred: ['connection_specificity', 'evidence_impact'],
    acceptable: ['intellectual_character', 'reflection_depth'],
    discouraged: ['storytelling', 'complexity_showcase'],
  },

  closing_synthesis: {
    preferred: ['voice_authenticity', 'reflection_depth'],
    acceptable: ['connection_specificity', 'storytelling'],
    discouraged: ['evidence_impact', 'technical_depth'],
  },

  transition: {
    preferred: ['voice_authenticity'],
    acceptable: ['reflection_depth'],
    discouraged: ['evidence_impact', 'technical_depth', 'storytelling'],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the recommended technique for a given context
 */
export function getRecommendedTechnique(
  essayType: SupplementalType,
  element: EssayElement,
  existingTechniques: TechniqueCategory[]
): TechniqueRecommendation {
  const typePriorities = TECHNIQUE_PRIORITIES_BY_TYPE[essayType];
  const elementPrefs = TECHNIQUE_PREFERENCES_BY_ELEMENT[element];

  // Find the best technique that:
  // 1. Is preferred for this element
  // 2. Is primary/secondary for this essay type
  // 3. Isn't already overused

  const existingCounts = new Map<TechniqueCategory, number>();
  existingTechniques.forEach(t => {
    existingCounts.set(t, (existingCounts.get(t) || 0) + 1);
  });

  // Score each technique
  const candidates: Array<{ technique: TechniqueCategory; score: number }> = [];

  const allTechniques: TechniqueCategory[] = [
    'storytelling', 'technical_depth', 'evidence_impact', 'intellectual_character',
    'reflection_depth', 'voice_authenticity', 'complexity_showcase', 'connection_specificity'
  ];

  for (const technique of allTechniques) {
    let score = 0;

    // Element preference (high weight)
    if (elementPrefs.preferred.includes(technique)) score += 3;
    else if (elementPrefs.acceptable.includes(technique)) score += 1;
    else if (elementPrefs.discouraged.includes(technique)) score -= 2;

    // Essay type priority (high weight)
    if (typePriorities.primary.includes(technique)) score += 3;
    else if (typePriorities.secondary.includes(technique)) score += 2;
    else if (typePriorities.optional.includes(technique)) score += 0;
    else if (typePriorities.avoid.includes(technique)) score -= 3;

    // Existing usage penalty (moderate weight)
    const usageCount = existingCounts.get(technique) || 0;
    if (usageCount >= 2) score -= 2;  // Heavily used
    else if (usageCount === 1) score -= 0.5;  // Used once is fine
    else score += 1;  // Not used yet - fresh

    candidates.push({ technique, score });
  }

  // Sort by score and get the best
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const bundle = TECHNIQUE_BUNDLES[best.technique];

  // Determine priority based on score
  let priority: TechniquePriority = 'primary';
  if (best.score < 2) priority = 'secondary';
  if (best.score < 0) priority = 'optional';
  if (typePriorities.avoid.includes(best.technique)) priority = 'avoid';

  return {
    category: best.technique,
    priority,
    rationale: generateRationale(best.technique, essayType, element, existingTechniques),
    exampleApproaches: bundle.examplePhrases.slice(0, 3),
    antiPatterns: bundle.antiPatterns.slice(0, 3),
    signals: bundle.corePrinciples.slice(0, 3),
  };
}

/**
 * Generate a human-readable rationale for the recommendation
 */
function generateRationale(
  technique: TechniqueCategory,
  essayType: SupplementalType,
  element: EssayElement,
  existingTechniques: TechniqueCategory[]
): string {
  const bundle = TECHNIQUE_BUNDLES[technique];
  const storytellingCount = existingTechniques.filter(t => t === 'storytelling').length;

  const typeLabel = essayType.replace(/_/g, ' ');
  const elementLabel = element.replace(/_/g, ' ');

  // If storytelling is overused, acknowledge that
  if (storytellingCount >= 2 && technique !== 'storytelling') {
    return `This ${typeLabel} essay already has strong storytelling. For the ${elementLabel}, ${bundle.name.toLowerCase()} would add balance and strengthen the essay's ${
      technique === 'evidence_impact' ? 'credibility' :
      technique === 'reflection_depth' ? 'depth' :
      technique === 'intellectual_character' ? 'intellectual dimension' :
      technique === 'connection_specificity' ? 'fit demonstration' :
      'effectiveness'
    }.`;
  }

  // If this technique is primary for the essay type
  const typePriorities = TECHNIQUE_PRIORITIES_BY_TYPE[essayType];
  if (typePriorities.primary.includes(technique)) {
    return `${bundle.name} is essential for ${typeLabel} essays. The ${elementLabel} section is a great place to demonstrate this through ${bundle.whenToUse[0].toLowerCase()}.`;
  }

  // If this technique is preferred for the element
  const elementPrefs = TECHNIQUE_PREFERENCES_BY_ELEMENT[element];
  if (elementPrefs.preferred.includes(technique)) {
    return `The ${elementLabel} of your essay would benefit from ${bundle.name.toLowerCase()}. This element works best when it ${bundle.corePrinciples[0].toLowerCase()}.`;
  }

  // Generic rationale
  return `${bundle.name} would strengthen this section by ${bundle.corePrinciples[0].toLowerCase()}.`;
}

/**
 * Check if storytelling is overused in the current context
 */
export function isStorytellingOverused(
  existingTechniques: TechniqueCategory[],
  essayType: SupplementalType
): boolean {
  const storytellingCount = existingTechniques.filter(t => t === 'storytelling').length;
  const total = existingTechniques.length;

  // More than 60% storytelling is overuse for most essays
  if (total > 0 && storytellingCount / total > 0.6) return true;

  // For essay types where storytelling isn't primary, lower threshold
  const typePriorities = TECHNIQUE_PRIORITIES_BY_TYPE[essayType];
  if (!typePriorities.primary.includes('storytelling') && storytellingCount >= 2) {
    return true;
  }

  return false;
}

/**
 * Get all techniques that are missing from the essay
 */
export function getMissingTechniques(
  existingTechniques: TechniqueCategory[],
  essayType: SupplementalType
): TechniqueCategory[] {
  const typePriorities = TECHNIQUE_PRIORITIES_BY_TYPE[essayType];
  const existing = new Set(existingTechniques);

  const missing: TechniqueCategory[] = [];

  // Check primary techniques
  for (const technique of typePriorities.primary) {
    if (!existing.has(technique)) {
      missing.push(technique);
    }
  }

  // Check secondary techniques
  for (const technique of typePriorities.secondary) {
    if (!existing.has(technique)) {
      missing.push(technique);
    }
  }

  return missing;
}

// Export singleton for convenience
export const techniqueCategories = {
  bundles: TECHNIQUE_BUNDLES,
  prioritiesByType: TECHNIQUE_PRIORITIES_BY_TYPE,
  preferencesByElement: TECHNIQUE_PREFERENCES_BY_ELEMENT,
  getRecommended: getRecommendedTechnique,
  isStorytellingOverused,
  getMissingTechniques,
};
