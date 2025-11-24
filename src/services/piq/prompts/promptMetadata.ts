/**
 * UC PIQ PROMPT METADATA
 *
 * Official text for all 8 UC Personal Insight Questions (2025-2026 cycle)
 * Source: https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-freshman-student/personal-insight-questions.html
 *
 * Requirements:
 * - Choose 4 out of 8 questions
 * - 350 words maximum per response
 * - All questions receive equal consideration
 */

import type { PIQPromptType } from '../types';

export interface PIQPromptMetadata {
  id: PIQPromptType;
  promptNumber: number;
  shortName: string;
  officialText: string;
  thingsToConsider: string[];

  // Analysis hints
  keyThemes: string[];
  commonPitfalls: string[];

  // Weight configuration ID
  weightProfileId: string;
}

export const UC_PIQ_PROMPTS: PIQPromptMetadata[] = [
  {
    id: 'piq1_leadership',
    promptNumber: 1,
    shortName: 'Leadership & Influence',
    officialText: 'Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time.',
    thingsToConsider: [
      'A leadership role can mean more than just a title. It can mean being a mentor to others, acting as the person in charge of a specific task, or taking the lead role in organizing an event or project.',
      'Think about what you accomplished and what you learned from the experience. What were your responsibilities?',
      'Did you lead a team? How did your experience change your perspective on leading others?',
      'Did you help to resolve an important dispute at your school, church, in your community or an organization?',
      'And your leadership role doesn\'t necessarily have to be limited to school activities. For example, do you help out or take care of your family?'
    ],
    keyThemes: [
      'Initiative and proactive action',
      'Impact on others (influence, mentorship, conflict resolution)',
      'Growth in leadership capabilities',
      'Sustained effort over time',
      'Specific role clarity'
    ],
    commonPitfalls: [
      'Title-dropping without showing actual leadership actions',
      'Vague "we" statements without clear "I" contributions',
      'Generic "I learned the value of teamwork" reflections',
      'No concrete evidence of influence or impact',
      'Focusing only on what the group achieved, not your role'
    ],
    weightProfileId: 'piq1_leadership'
  },

  {
    id: 'piq2_creative',
    promptNumber: 2,
    shortName: 'Creative Expression',
    officialText: 'Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side.',
    thingsToConsider: [
      'What does creativity mean to you?',
      'Do you have a creative skill that is important to you? What have you been able to do with that skill?',
      'If you used creativity to solve a problem, what was your solution? What are the steps you took to solve the problem?',
      'How does your creativity influence your decisions inside or outside the classroom?',
      'Does your creativity relate to your major or a future career?'
    ],
    keyThemes: [
      'Creative process (not just final product)',
      'Iteration and experimentation',
      'How creativity manifests in your life',
      'Problem-solving through creative thinking',
      'Risk-taking and originality'
    ],
    commonPitfalls: [
      'Only showing the result without explaining the creative process',
      'Generic "I\'m creative because I like to draw" statements',
      'No evidence of iteration, failure, or refinement',
      'Vague descriptions of creative work',
      'Missing the "how" - what makes your approach creative?'
    ],
    weightProfileId: 'piq2_creative'
  },

  {
    id: 'piq3_talent',
    promptNumber: 3,
    shortName: 'Talent or Skill',
    officialText: 'What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time?',
    thingsToConsider: [
      'If there\'s a talent or skill that you\'re proud of, this is the time to share it.',
      'You don\'t necessarily have to be recognized or have received awards for your talent (although if you did and you want to talk about it, feel free to do so).',
      'Why is this talent or skill meaningful to you?',
      'Does the talent come naturally or have you worked hard to develop this skill or talent?',
      'Does your talent or skill allow you opportunities in or outside the classroom?',
      'If so, what are they and how do they fit into your schedule?'
    ],
    keyThemes: [
      'Development over time (progression)',
      'Dedication and practice',
      'Concrete demonstrations of skill',
      'Personal significance of the talent',
      'How skill integrates into your life'
    ],
    commonPitfalls: [
      'Claiming greatness without specific evidence',
      'No development arc (just stating "I\'m good at X")',
      'Missing time investment details',
      'Vague about actual demonstrations of the skill',
      'Not explaining WHY this talent matters to you'
    ],
    weightProfileId: 'piq3_talent'
  },

  {
    id: 'piq4_educational',
    promptNumber: 4,
    shortName: 'Educational Opportunity/Barrier',
    officialText: 'Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced.',
    thingsToConsider: [
      'An educational opportunity can be anything that has added value to your educational experience and better prepared you for college.',
      'For example, participation in an honors or academic enrichment program, or enrollment in an academy that\'s geared toward an occupation or a major, or taking advanced courses that interest you — just to name a few.',
      'If you choose to write about educational barriers you\'ve faced, how did you overcome or strive to overcome them?',
      'What personal characteristics or skills did you call on to overcome this challenge?',
      'How did overcoming this barrier help shape who are you today?'
    ],
    keyThemes: [
      'Resourcefulness and initiative',
      'Overcoming obstacles with limited resources',
      'Growth through adversity',
      'Context and circumstances',
      'Impact on academic achievement or trajectory'
    ],
    commonPitfalls: [
      'Victim narrative without showing agency',
      'Vague about the actual barrier or opportunity',
      'No concrete steps taken to overcome the challenge',
      'Missing the "so what" - how did this shape you?',
      'Complaining without demonstrating resilience'
    ],
    weightProfileId: 'piq4_educational'
  },

  {
    id: 'piq5_challenge',
    promptNumber: 5,
    shortName: 'Significant Challenge',
    officialText: 'Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement?',
    thingsToConsider: [
      'A challenge could be personal, or something you have faced in your community or school.',
      'Why was the challenge significant to you?',
      'This is a good opportunity to talk about any obstacles you\'ve faced and what you\'ve learned from the experience.',
      'Did you have support from someone else or did you handle it alone?',
      'If you\'re currently working your way through a challenge, what are you doing now, and does that affect different aspects of your life?',
      'For example, ask yourself, "How has my life changed at home, at my school, with my friends or with my family?"'
    ],
    keyThemes: [
      'Vulnerability and emotional honesty',
      'Context and circumstances (what made it hard)',
      'Concrete steps taken to overcome',
      'Growth and transformation through adversity',
      'Impact on academics (required by prompt)',
      'Resilience demonstrated'
    ],
    commonPitfalls: [
      'Choosing a challenge that isn\'t actually significant',
      'No emotional depth or vulnerability',
      'Vague about steps taken to overcome',
      'Missing the impact on academic achievement',
      'Neat resolution without showing ongoing struggle',
      'Trauma-dumping without demonstrating growth'
    ],
    weightProfileId: 'piq5_challenge'
  },

  {
    id: 'piq6_academic',
    promptNumber: 6,
    shortName: 'Academic Passion',
    officialText: 'Think about an academic subject that inspires you. Describe how you have furthered this interest inside and/or outside of the classroom.',
    thingsToConsider: [
      'Many students have a passion for one specific academic subject area, something that they just can\'t get enough of.',
      'If that applies to you, what have you done to further that interest?',
      'Discuss how your interest in the subject developed and describe any experience you have had inside and outside the classroom — such as volunteer work, internships, employment, summer programs, participation in student organizations and/or clubs — and what you have gained from your involvement.',
      'Has your interest in the subject influenced you in choosing a major and/or future career?',
      'Have you been able to pursue coursework at a higher level in this subject (honors, AP, IB, college or university work)?',
      'Are you inspired to pursue this subject further at UC, and how might you do that?'
    ],
    keyThemes: [
      'Intellectual curiosity and passion',
      'Actions taken to deepen knowledge',
      'Connection to future trajectory',
      'Self-directed learning',
      'Specific examples of engagement'
    ],
    commonPitfalls: [
      'Generic "I love biology because it\'s interesting" statements',
      'Listing activities without showing genuine passion',
      'No intellectual depth or specific insights',
      'Missing connection to future plans',
      'Vague about HOW you\'ve pursued the interest',
      'Surface-level engagement (just took AP class)'
    ],
    weightProfileId: 'piq6_academic'
  },

  {
    id: 'piq7_community',
    promptNumber: 7,
    shortName: 'Community Contribution',
    officialText: 'What have you done to make your school or your community a better place?',
    thingsToConsider: [
      'Think of community as a term that can encompass a group, team or a place — like your high school, hometown or home.',
      'You can define community as you see fit, just make sure you talk about your role in that community.',
      'Was there a problem that you wanted to fix in your community?',
      'Why were you inspired to act? What did you learn from your effort?',
      'How did your actions benefit others, the wider community or both?',
      'Did you work alone or with others to initiate change in your community?'
    ],
    keyThemes: [
      'Initiative and problem-identification',
      'Concrete actions taken',
      'Impact on community (measured outcomes)',
      'Role clarity (what YOU did)',
      'Motivation to serve'
    ],
    commonPitfalls: [
      'Vague "volunteering helped me grow" reflections',
      'No evidence of actual community improvement',
      'Generic service hours without impact',
      'Missing YOUR specific role and contribution',
      'Self-focused narrative (what YOU got from it, not what community gained)',
      'Resume-style list of activities'
    ],
    weightProfileId: 'piq7_community'
  },

  {
    id: 'piq8_open_ended',
    promptNumber: 8,
    shortName: 'Open-Ended Distinction',
    officialText: 'Beyond what has already been shared in your application, what do you believe makes you a strong candidate for admissions to the University of California?',
    thingsToConsider: [
      'This is your opportunity to share something about yourself that you haven\'t had a chance to share elsewhere in your application.',
      'What have you not shared with us that will highlight a skill, talent, challenge or opportunity that you think will help us know you better?',
      'From your point of view, what do you feel makes you an excellent choice for UC?',
      'Don\'t be afraid to brag a little.'
    ],
    keyThemes: [
      'Unique attributes or experiences',
      'Strategic self-positioning',
      'What makes you distinctive',
      'Adding new information (not repeating other PIQs)',
      'Authentic self-advocacy'
    ],
    commonPitfalls: [
      'Repeating what\'s already in other PIQs or application',
      'Generic "I\'m hardworking and passionate" claims',
      'Missing specificity and evidence',
      'Unfocused narrative trying to cover too much',
      'False humility (prompt says "don\'t be afraid to brag")',
      'Not actually answering "why you\'re a strong candidate"'
    ],
    weightProfileId: 'piq8_open_ended'
  }
];

/**
 * Get prompt metadata by PIQ number (1-8)
 */
export function getPIQPromptByNumber(number: number): PIQPromptMetadata | undefined {
  return UC_PIQ_PROMPTS.find(p => p.promptNumber === number);
}

/**
 * Get prompt metadata by type
 */
export function getPIQPrompt(type: PIQPromptType): PIQPromptMetadata {
  const prompt = UC_PIQ_PROMPTS.find(p => p.id === type);
  if (!prompt) {
    throw new Error(`Unknown PIQ prompt type: ${type}`);
  }
  return prompt;
}

/**
 * Get all 8 prompts
 */
export function getAllPIQPrompts(): PIQPromptMetadata[] {
  return UC_PIQ_PROMPTS;
}

/**
 * Detect PIQ type from essay content (heuristic-based)
 * Returns most likely PIQ type based on keyword analysis
 */
export function detectPIQType(essayText: string): PIQPromptType {
  const lower = essayText.toLowerCase();

  // PIQ 1: Leadership indicators
  const leadershipScore = (
    (lower.includes('leader') ? 2 : 0) +
    (lower.includes('team') ? 1 : 0) +
    (lower.includes('president') || lower.includes('captain') ? 2 : 0) +
    (lower.includes('organized') || lower.includes('initiated') ? 1 : 0)
  );

  // PIQ 2: Creative indicators
  const creativeScore = (
    (lower.includes('creative') || lower.includes('create') ? 2 : 0) +
    (lower.includes('art') || lower.includes('design') || lower.includes('music') ? 2 : 0) +
    (lower.includes('innovative') || lower.includes('original') ? 1 : 0)
  );

  // PIQ 3: Talent indicators
  const talentScore = (
    (lower.includes('talent') || lower.includes('skill') ? 3 : 0) +
    (lower.includes('practice') || lower.includes('trained') ? 1 : 0) +
    (lower.includes('developed') || lower.includes('mastered') ? 1 : 0)
  );

  // PIQ 4: Educational barrier/opportunity
  const educationalScore = (
    (lower.includes('barrier') || lower.includes('obstacle') ? 3 : 0) +
    (lower.includes('opportunity') && lower.includes('educational') ? 3 : 0) +
    (lower.includes('overcome') ? 1 : 0)
  );

  // PIQ 5: Challenge indicators
  const challengeScore = (
    (lower.includes('challenge') ? 3 : 0) +
    (lower.includes('difficult') || lower.includes('struggle') ? 2 : 0) +
    (lower.includes('overcome') ? 1 : 0) +
    (lower.includes('academic achievement') || lower.includes('grades') ? 1 : 0)
  );

  // PIQ 6: Academic passion
  const academicScore = (
    (lower.includes('subject') && lower.includes('inspire') ? 3 : 0) +
    (lower.includes('academic') && (lower.includes('passion') || lower.includes('interest')) ? 2 : 0) +
    (lower.includes('research') || lower.includes('internship') ? 1 : 0)
  );

  // PIQ 7: Community contribution
  const communityScore = (
    (lower.includes('community') ? 2 : 0) +
    (lower.includes('better place') ? 3 : 0) +
    (lower.includes('volunteer') || lower.includes('service') ? 1 : 0) +
    (lower.includes('impact') ? 1 : 0)
  );

  // PIQ 8: Open-ended (default if nothing else matches)
  const openScore = 0; // Low priority, only use if nothing else matches

  // Find highest scoring type
  const scores = [
    { type: 'piq1_leadership' as PIQPromptType, score: leadershipScore },
    { type: 'piq2_creative' as PIQPromptType, score: creativeScore },
    { type: 'piq3_talent' as PIQPromptType, score: talentScore },
    { type: 'piq4_educational' as PIQPromptType, score: educationalScore },
    { type: 'piq5_challenge' as PIQPromptType, score: challengeScore },
    { type: 'piq6_academic' as PIQPromptType, score: academicScore },
    { type: 'piq7_community' as PIQPromptType, score: communityScore },
    { type: 'piq8_open_ended' as PIQPromptType, score: openScore }
  ];

  const winner = scores.reduce((max, curr) => curr.score > max.score ? curr : max);

  // If no clear winner (score = 0), default to open-ended
  return winner.score > 0 ? winner.type : 'piq8_open_ended';
}
