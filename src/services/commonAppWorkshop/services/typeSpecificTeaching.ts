/**
 * Type-Specific Teaching Prompts
 *
 * Each of the 14 supplemental essay types requires different teaching focus.
 * This module provides type-specific teaching logic that adapts Stage 1A
 * to emphasize the dimensions, pitfalls, and evaluation criteria unique
 * to each essay type.
 *
 * Architecture:
 * - Base teaching prompt from Stage 1A (PIQ-quality warmth & depth)
 * - Type-specific teaching overlay (what to emphasize for THIS type)
 * - College-specific values integration (from college research)
 * - Result: Teaching that's warm + type-aware + college-specific
 */

import type { SupplementalType } from '../../../data/commonAppSupplementalTypes';
import { SUPPLEMENTAL_TYPE_INFO } from '../../../data/commonAppSupplementalTypes';

/**
 * Type-specific teaching focus for each essay type
 */
export interface TypeTeachingFocus {
  // What to emphasize when teaching this type
  primary_dimensions: string[]; // Top 3-4 dimensions to focus on
  common_mistakes: string[]; // Type-specific pitfalls to watch for
  teaching_priority: string; // ONE main thing students miss in this type
  evaluation_lens: string; // How admissions reads this type

  // Teaching guidance
  what_makes_excellent: string; // What separates great from good
  what_students_miss: string; // The insight most students don't see
}

/**
 * Type-specific teaching configurations
 */
export const TYPE_TEACHING_FOCUS: Record<SupplementalType, TypeTeachingFocus> = {
  why_us: {
    primary_dimensions: ['specificity', 'research_depth', 'personal_connection', 'fit_demonstration'],
    common_mistakes: [
      'Generic reasons that could work for any college (rankings, weather, location)',
      'List of programs without explaining WHY those programs matter to THEM',
      'Surface research (just website browsing) vs deep investigation',
      'One-sided (what college offers) without showing what student brings'
    ],
    teaching_priority: 'SPECIFICITY + PERSONAL CONNECTION: Name exact programs/professors/courses AND explain why those matter to YOUR specific goals',
    evaluation_lens: 'Admissions officers ask: "Could they swap our college name for another?" If yes, essay fails. They want students who researched deeply and found genuine fit.',
    what_makes_excellent: 'Excellent Why Us essays name 3-5 specific, unique resources (courses, labs, professors, programs) that OTHER colleges don\'t have, and connect each to a personal goal or past experience. They show research depth (professor\'s research, course syllabi, student publications) beyond the website.',
    what_students_miss: 'Most students describe WHAT the college offers. Winners explain WHY those offerings matter to THEIR specific story. It\'s not "I want to take CS229" - it\'s "After building my app and hitting scalability limits, I want to learn distributed systems in CS229 to solve the exact bottleneck I faced."'
  },

  why_major: {
    primary_dimensions: ['intellectual_depth', 'authentic_interest', 'knowledge_demonstration', 'program_fit'],
    common_mistakes: [
      'Generic "I\'ve always loved X" without origin story',
      'Career-focused only ("I want to be a doctor") without intellectual curiosity',
      'Surface knowledge of field (doesn\'t show they\'ve explored beyond classroom)',
      'Doesn\'t connect to THIS college\'s specific program'
    ],
    teaching_priority: 'ORIGIN STORY + INTELLECTUAL DEPTH: Show the moment your interest sparked and how you\'ve explored the field independently',
    evaluation_lens: 'Admissions wants to see genuine intellectual curiosity, not just career ambition. They ask: "Has this student explored the field deeply? Do they know what they\'re getting into?"',
    what_makes_excellent: 'Excellent Why Major essays tell the origin story (the spark moment), show progression of exploration (independent reading, projects, courses), demonstrate field knowledge (specific concepts, challenges, questions), and connect to college\'s unique program strengths.',
    what_students_miss: 'Most students say they love a subject but don\'t show intellectual engagement. Winners describe specific concepts that fascinate them, questions they\'re exploring, or problems they want to solve. It\'s not "I love biology" - it\'s "After reading about CRISPR, I spent months understanding guide RNA design, then tried predicting off-target effects, and realized I want to study the ethical implications of gene editing at [college\'s specific bioethics program]."'
  },

  community: {
    primary_dimensions: ['past_contribution_evidence', 'community_understanding', 'specific_involvement_plan', 'collaborative_mindset'],
    common_mistakes: [
      'Vague promises ("I will contribute") without showing past behavior',
      'List of clubs they want to join without meaningful engagement plan',
      'Doesn\'t show understanding of THIS college\'s specific community values',
      'Self-focused ("what I will gain") vs community-focused ("what I will give")'
    ],
    teaching_priority: 'PAST PREDICTS FUTURE: Use specific past community contributions as evidence for future involvement',
    evaluation_lens: 'Admissions asks: "Based on past behavior, will this student actively contribute, or just consume?" They want givers, not takers.',
    what_makes_excellent: 'Excellent Community essays ground future promises in past behavior. They name 2-3 specific ways they\'ve built/contributed to communities before, show understanding of the college\'s unique community values (through research), and propose specific, realistic involvement that leverages their past experience.',
    what_students_miss: 'Most students promise generic involvement ("I\'ll join clubs and make friends"). Winners connect their specific community-building skills to the college\'s specific needs. It\'s not "I want to join debate team" - it\'s "After starting a debate program at my school that grew from 5 to 50 members by creating mentorship systems, I want to bring that peer teaching model to [college\'s debate team], which I noticed focuses heavily on competition but less on training novices."'
  },

  diversity: {
    primary_dimensions: ['perspective_uniqueness', 'self_awareness', 'community_enrichment', 'vulnerability_balance'],
    common_mistakes: [
      'Surface-level identity statement without depth or reflection',
      'Trauma dumping or oversharing without showing growth/resilience',
      'Focuses on WHAT makes them diverse, not HOW that perspective enriches community',
      'Defensive or apologetic tone instead of confident ownership'
    ],
    teaching_priority: 'PERSPECTIVE → ENRICHMENT: Don\'t just describe your background - explain how your unique perspective enriches others',
    evaluation_lens: 'Admissions asks: "What unique perspective does this student bring? How will they enrich our community\'s discourse and culture?"',
    what_makes_excellent: 'Excellent Diversity essays move from identity/background → unique perspective gained → how that perspective enriches others. They balance vulnerability (honest about challenges) with strength (shows growth, resilience, agency). They demonstrate self-awareness about how their experience shapes their worldview.',
    what_students_miss: 'Most students describe their identity or background but don\'t explain the perspective it gives them. Winners articulate the specific lens through which they see the world and how that lens adds value in community settings. It\'s not "I grew up poor" - it\'s "Growing up translating bills for my parents, I learned to see systems through gaps - what\'s missing, who\'s excluded. In group projects, I naturally ask \'whose voice are we missing?\' That perspective helped our team design more inclusive solutions, and I want to bring that systems-thinking to [college\'s] collaborative culture."'
  },

  intellectual: {
    primary_dimensions: ['self_directed_learning', 'intellectual_depth', 'curiosity_demonstration', 'idea_engagement'],
    common_mistakes: [
      'Describes classroom learning only (homework, tests) vs independent exploration',
      'Surface interest without showing deep engagement with ideas',
      'No evidence of curiosity leading to action (reading, projects, questions)',
      'Treats ideas as static facts vs living questions to explore'
    ],
    teaching_priority: 'SELF-DIRECTED CURIOSITY: Show learning you pursued independently, not assigned by teachers',
    evaluation_lens: 'Admissions asks: "Is this student intellectually curious on their own? Do they love learning for its own sake, or just for grades?"',
    what_makes_excellent: 'Excellent Intellectual essays show curiosity leading to self-directed exploration - the rabbit holes they fell down, questions they couldn\'t stop thinking about, topics they explored independently. They demonstrate engagement with ideas (not just consumption), show evolution of thinking, and often connect ideas across disciplines.',
    what_students_miss: 'Most students describe schoolwork or assigned reading. Winners describe the Tuesday night at 2am when they got lost in a fascinating topic NO ONE ASSIGNED. It\'s not "I did well in physics" - it\'s "After learning about entropy in class, I spent weeks trying to understand why time only moves forward, reading about thermodynamics, watching lectures on arrow of time, arguing with my dad about free will, and realizing the question connects to everything from memory to choice. I still don\'t have the answer, but I can\'t stop thinking about it."'
  },

  extracurricular: {
    primary_dimensions: ['depth_over_breadth', 'personal_growth', 'impact_demonstration', 'character_revelation'],
    common_mistakes: [
      'Describes WHAT the activity is instead of what it means to them',
      'Lists accomplishments/awards without reflection or insight',
      'No personal growth arc - just "I did X and was good at it"',
      'Doesn\'t reveal character, values, or identity'
    ],
    teaching_priority: 'DEPTH + CHARACTER: Go deep into ONE activity and show what it reveals about who you are',
    evaluation_lens: 'Admissions asks: "What does this activity reveal about this student\'s character, values, or identity? How have they grown through it?"',
    what_makes_excellent: 'Excellent Activity essays go deep into one activity (not surface-level many), show personal growth arc (how they changed/learned), demonstrate impact on others, and most importantly, reveal character - what this activity says about who they are, what they value, how they think.',
    what_students_miss: 'Most students describe activities like a resume. Winners use activities as windows into character. It\'s not "I\'m president of debate and we won nationals" - it\'s "In debate, I learned I love the moment right before responding when my opponent thinks they\'ve won - that split second to find the flaw in their logic. That thrill of intellectual combat taught me I thrive on challenges that seem impossible. Now I seek out that feeling everywhere - the hard math problem, the project no one wants to lead, the conversation everyone avoids."'
  },

  challenge: {
    primary_dimensions: ['resilience', 'growth_mindset', 'self_awareness', 'problem_solving'],
    common_mistakes: [
      'Trauma dumping without showing growth or resilience',
      'Victim mentality (what happened TO them) vs agency (what they DID)',
      'Challenge isn\'t actually that challenging (relative to their context)',
      'Focuses on problem, not on response and lessons learned'
    ],
    teaching_priority: 'RESPONSE > PROBLEM: Focus on how you responded, what you learned, and who you became - not just what happened',
    evaluation_lens: 'Admissions asks: "How does this student respond to adversity? Do they have resilience, problem-solving, and growth mindset?"',
    what_makes_excellent: 'Excellent Challenge essays spend 20% on the challenge (context) and 80% on response (what they did, how they thought, what they learned). They show agency, resilience, specific problem-solving actions, vulnerability about struggles, and clear growth/perspective gained.',
    what_students_miss: 'Most students spend the whole essay describing the problem. Winners focus on their response and growth. It\'s not "My parents divorced and it was hard" - it\'s "When my parents divorced, I watched my 6-year-old sister stop talking. I didn\'t know how to help, so I started reading about childhood trauma, learned about play therapy, created games we could play together where she could express feelings. It took months, but she started talking again. I learned that sometimes the most important help isn\'t dramatic - it\'s showing up every day with patience and trying different approaches until something works."'
  },

  leadership: {
    primary_dimensions: ['leadership_philosophy', 'impact_on_others', 'collaborative_approach', 'authenticity'],
    common_mistakes: [
      'Defines leadership as title/position only ("I was president")',
      'Brags about accomplishments without vulnerability or challenges',
      'No specific examples of impact on team/individuals',
      'Shows authoritarian leadership (telling people what to do) vs collaborative'
    ],
    teaching_priority: 'LEADERSHIP = IMPACT ON OTHERS: Show how you helped others grow, not just what you achieved',
    evaluation_lens: 'Admissions asks: "How does this student lead? Are they collaborative? Do they empower others? Can they handle challenges?"',
    what_makes_excellent: 'Excellent Leadership essays define leadership beyond titles (anyone can be president), show specific impact on individuals or team, demonstrate collaborative vs authoritarian style, include vulnerability (challenges faced, mistakes made), and reveal their leadership philosophy through actions.',
    what_students_miss: 'Most students list their title and accomplishments. Winners show leadership through impact on others. It\'s not "As president, I led the team to win states" - it\'s "When I became president, our best debater quit because she felt like no one listened to her. I realized I\'d been so focused on winning that I forgot to make space for everyone\'s ideas. I changed our meetings - instead of me planning everything, I asked each member to lead one session. That debater came back, proposed a new research strategy, and taught us all something. We didn\'t just win states - we built a team where everyone felt heard."'
  },

  creative: {
    primary_dimensions: ['creative_process', 'personal_expression', 'growth_through_creativity', 'unique_perspective'],
    common_mistakes: [
      'Describes the art/skill technically without emotion or meaning',
      'No connection to identity, values, or growth',
      'Focuses on product (what they made) not process (how they think)',
      'Doesn\'t show what creativity means to them'
    ],
    teaching_priority: 'PROCESS + MEANING: Show your creative process and what creativity reveals about who you are',
    evaluation_lens: 'Admissions asks: "What does this student\'s creativity reveal about how they think, see the world, or express themselves?"',
    what_makes_excellent: 'Excellent Creative essays show creative process (not just final product), connect creativity to identity/values, demonstrate growth through creative work, reveal unique perspective on the world, and balance technical skill with emotional meaning.',
    what_students_miss: 'Most students describe WHAT they create. Winners describe HOW they create and WHY it matters. It\'s not "I play piano and performed at Carnegie Hall" - it\'s "When I play piano, I enter a different mental state - my hands know what to do before my brain does. I\'m chasing a feeling I can never quite reach, that perfect moment when the music sounds exactly like what I imagined. Most performances fall short, but that gap between vision and reality is what keeps me coming back. It taught me that perfection isn\'t the point - the pursuit is."'
  },

  values: {
    primary_dimensions: ['value_demonstration', 'origin_story', 'consistency', 'authentic_voice'],
    common_mistakes: [
      'States values without demonstrating them through actions/stories',
      'Generic values everyone claims (honesty, hard work, family)',
      'No origin story (how these values developed)',
      'Preachy tone ("everyone should...") without self-awareness'
    ],
    teaching_priority: 'SHOW, DON\'T TELL: Demonstrate values through specific stories and actions',
    evaluation_lens: 'Admissions asks: "Are these values genuine and demonstrated through behavior? Or just words?"',
    what_makes_excellent: 'Excellent Values essays demonstrate values through specific stories and actions (not stating them), explain how values developed (origin story), show consistency across multiple contexts, maintain self-awareness (acknowledging nuance, not preaching), and use authentic voice.',
    what_students_miss: 'Most students state values without showing them. Winners tell stories that reveal values implicitly. It\'s not "I value helping others" - it\'s "Every Tuesday, I teach English to Mrs. Nguyen, my neighbor who\'s 70 and learning to text her grandkids in Vietnam. Last month, she sent her first emoji - a heart - and cried. I realized that what matters to me isn\'t big dramatic help, it\'s small consistent acts that give someone dignity and connection. That\'s what I want to keep doing."'
  },

  future_goals: {
    primary_dimensions: ['goal_clarity', 'past_to_future_connection', 'impact_orientation', 'value_alignment'],
    common_mistakes: [
      'Vague or unrealistic goals ("I want to change the world")',
      'No connection between past experiences and future goals',
      'Only career-focused (job title) without deeper purpose or impact',
      'Doesn\'t explain WHY these goals matter to them'
    ],
    teaching_priority: 'PAST → FUTURE TRAJECTORY: Connect your past experiences to future goals to show authentic progression',
    evaluation_lens: 'Admissions asks: "Are these goals authentic and grounded in their experiences? Do they have direction and purpose?"',
    what_makes_excellent: 'Excellent Future Goals essays connect past experiences to future goals (showing authentic trajectory), explain WHY these goals matter (beyond career/money), include impact on others/society, show realistic planning and awareness of the path, and align with personal values demonstrated elsewhere.',
    what_students_miss: 'Most students state career goals without grounding them in past experience. Winners show how past experiences naturally led to future direction. It\'s not "I want to be a doctor" - it\'s "After spending two years helping my grandmother manage her medications and translating for her doctors, I saw how language barriers create dangerous gaps in healthcare. I want to become a physician who redesigns hospital systems to better serve immigrant communities - not just treating patients, but fixing the systems that fail them."'
  },

  additional_info: {
    primary_dimensions: ['relevance', 'context_provision', 'responsibility_balance', 'strategic_disclosure'],
    common_mistakes: [
      'Repeats information already in application',
      'Makes excuses for weaknesses without taking ownership',
      'Overshares irrelevant personal details',
      'Misses opportunity to explain important context'
    ],
    teaching_priority: 'STRATEGIC CONTEXT: Only include information that adds important context not found elsewhere',
    evaluation_lens: 'Admissions asks: "Does this information change how we understand this applicant? Does it provide important context?"',
    what_makes_excellent: 'Excellent Additional Info essays are strategic (only include what adds value), provide context without making excuses, balance explanation with ownership/resilience, explain circumstances clearly and concisely, and avoid oversharing or repeating info from elsewhere in application.',
    what_students_miss: 'Most students either overshare irrelevant details OR miss the opportunity to provide important context. Winners use this space strategically for information that meaningfully impacts application understanding. It\'s not "I had a hard time in 10th grade" - it\'s "During 10th grade, I missed 40 days of school due to hospitalization for [condition]. My B in Chemistry that semester doesn\'t reflect my ability (I earned A\'s in Chemistry before and after). During recovery, I taught myself AP Biology online and scored a 5 to prove I could maintain academic rigor despite circumstances."'
  },

  short_answer: {
    primary_dimensions: ['conciseness', 'specificity', 'personality', 'memorability'],
    common_mistakes: [
      'Tries to fit too much into limited space',
      'Generic answers that don\'t show personality',
      'No specificity (vague descriptors)',
      'Misses opportunity to be memorable'
    ],
    teaching_priority: 'ONE THING WELL: Pick one specific, memorable detail rather than trying to cover everything',
    evaluation_lens: 'Admissions asks: "Does this answer show personality? Is it memorable? Do I learn something specific about this student?"',
    what_makes_excellent: 'Excellent Short Answers are ruthlessly concise (every word earns its place), highly specific (names, numbers, details), show personality through voice and content, make strategic choices about what to include/exclude, and are memorable (stick with reader).',
    what_students_miss: 'Most students try to fit too much and end up generic. Winners pick ONE specific thing and make it memorable. For "What do you do for fun?" it\'s not "I enjoy reading, sports, and spending time with friends" - it\'s "I teach my 8-year-old neighbor card tricks. Last week she finally nailed the double lift and has been insufferable about it ever since."'
  },

  optional: {
    primary_dimensions: ['strategic_value', 'new_information', 'quality_bar', 'topic_choice'],
    common_mistakes: [
      'Submits optional essay that\'s weak (hurts more than helps)',
      'Repeats themes/content from main essay',
      'Not strategic about topic (doesn\'t fill a gap in application)',
      'Submits just to submit (feels obligated)'
    ],
    teaching_priority: 'HIGH BAR: Only submit if it adds a significant new dimension at excellent quality',
    evaluation_lens: 'Admissions asks: "Does this essay add value? Does it show a new side of this student? Is it strong enough to help?"',
    what_makes_excellent: 'Excellent Optional essays are strategic (fill a gap in the application), add significant new information or dimension, meet high quality bar (don\'t hurt application), show a different side of student, and are worth the reader\'s time.',
    what_students_miss: 'Most students submit optional essays out of obligation, even when they don\'t add value. Winners are strategic - they only submit if it fills a gap. If your application shows academic strength but no personal vulnerability, use optional for a challenge story. If you\'ve shown leadership but not creativity, use optional for creative side. If nothing\'s missing, skip it.'
  }
};

/**
 * Get type-specific teaching focus
 */
export function getTypeTeachingFocus(type: SupplementalType): TypeTeachingFocus {
  return TYPE_TEACHING_FOCUS[type];
}

/**
 * Build type-specific teaching guidance for Stage 1A prompt
 * This gets injected into Stage 1A's teaching prompt to make it type-aware
 */
export function buildTypeTeachingGuidance(type: SupplementalType): string {
  const typeInfo = SUPPLEMENTAL_TYPE_INFO[type];
  const focus = TYPE_TEACHING_FOCUS[type];

  return `
# TYPE-SPECIFIC TEACHING FOCUS: ${typeInfo.name}

You are teaching a student who is writing a **${typeInfo.name}** essay.

## What This Essay Type Is About
${typeInfo.description}

## Common Word Range
${typeInfo.typical_word_range.min}-${typeInfo.typical_word_range.max} words

## Primary Dimensions to Focus On
When teaching this type, emphasize these dimensions:
${focus.primary_dimensions.map(d => `- ${d}`).join('\n')}

## Common Mistakes Students Make in This Type
Watch for and address these type-specific pitfalls:
${focus.common_mistakes.map(m => `- ${m}`).join('\n')}

## Teaching Priority for This Type
**${focus.teaching_priority}**

## How Admissions Officers Read This Type
${focus.evaluation_lens}

## What Makes This Type Excellent (vs Good)
${focus.what_makes_excellent}

## The Key Insight Most Students Miss
${focus.what_students_miss}

## Type-Specific Evaluation Criteria
When analyzing their essay, pay special attention to:
${typeInfo.evaluation_criteria.map(c => `- ${c}`).join('\n')}

---

**IMPORTANT**: Your teaching should naturally integrate these type-specific insights. Don't mechanically check off dimensions - weave them into your warm, conversational coaching. Use the "what students miss" insight to show them the deeper approach to this type.
`;
}

/**
 * Generate type-aware college alignment teaching
 * Connects college values to type-specific dimensions
 */
export function buildTypeCollegeAlignment(
  type: SupplementalType,
  collegeName: string
): string {
  const typeInfo = SUPPLEMENTAL_TYPE_INFO[type];

  return `
When teaching college alignment for this **${typeInfo.name}** essay:

1. **Connect college values to type dimensions**: Show how ${collegeName}'s values manifest in this specific essay type
2. **Use type-specific evaluation criteria**: Reference the criteria admissions uses for ${typeInfo.name} essays
3. **Emphasize fit**: For this type, "fit" means demonstrating the type's key qualities (${typeInfo.rubric_dimensions.slice(0, 3).join(', ')}) in ways that align with ${collegeName}'s values

Example connection: If ${collegeName} values "Intellectual Vitality" and this is a ${typeInfo.name} essay, show how Intellectual Vitality manifests in this specific type (not generically).
`;
}

/**
 * Type-specific dimension weights
 * Different essay types emphasize different dimensions
 */
export const TYPE_DIMENSION_WEIGHTS: Record<SupplementalType, Record<string, number>> = {
  why_us: {
    specificity: 10,
    research_depth: 10,
    personal_connection: 9,
    fit_demonstration: 9,
    genuine_interest: 8,
    authenticity: 7,
    narrative_quality: 5,
    insight_depth: 6
  },

  why_major: {
    intellectual_depth: 10,
    authentic_interest: 9,
    knowledge_demonstration: 9,
    curiosity: 8,
    program_fit: 8,
    narrative_quality: 6,
    insight_depth: 7
  },

  community: {
    past_contribution_evidence: 10,
    community_understanding: 9,
    collaborative_mindset: 9,
    value_alignment: 8,
    authenticity: 8,
    specificity: 7,
    impact: 8
  },

  diversity: {
    perspective_uniqueness: 10,
    self_awareness: 9,
    community_enrichment: 9,
    vulnerability_balance: 8,
    growth_mindset: 8,
    authenticity: 9,
    narrative_quality: 7,
    insight_depth: 8
  },

  intellectual: {
    self_directed_learning: 10,
    intellectual_depth: 10,
    curiosity_demonstration: 9,
    idea_engagement: 9,
    critical_thinking: 8,
    authenticity: 7,
    narrative_quality: 6
  },

  extracurricular: {
    depth_over_breadth: 10,
    personal_growth: 9,
    impact_demonstration: 9,
    authentic_passion: 9,
    character_revelation: 10,
    narrative_quality: 8,
    insight_depth: 8
  },

  challenge: {
    resilience: 10,
    growth_mindset: 10,
    self_awareness: 9,
    problem_solving: 8,
    perspective_gained: 9,
    authenticity: 9,
    narrative_quality: 8,
    vulnerability_balance: 8
  },

  leadership: {
    leadership_philosophy: 9,
    impact_on_others: 10,
    collaborative_approach: 9,
    authenticity: 9,
    problem_solving: 7,
    growth_mindset: 8,
    narrative_quality: 7
  },

  creative: {
    creative_process: 10,
    personal_expression: 9,
    growth_through_creativity: 8,
    unique_perspective: 9,
    authenticity: 9,
    narrative_quality: 8,
    insight_depth: 7
  },

  values: {
    value_demonstration: 10,
    origin_story: 9,
    consistency: 8,
    self_awareness: 9,
    authentic_voice: 10,
    narrative_quality: 7,
    insight_depth: 8
  },

  future_goals: {
    goal_clarity: 9,
    past_to_future_connection: 10,
    impact_orientation: 8,
    value_alignment: 9,
    realistic_planning: 7,
    authenticity: 8,
    narrative_quality: 6
  },

  additional_info: {
    relevance: 10,
    context_provision: 10,
    responsibility_balance: 9,
    strategic_disclosure: 9,
    conciseness: 8,
    authenticity: 7
  },

  short_answer: {
    conciseness: 10,
    specificity: 10,
    personality: 9,
    memorability: 9,
    strategic_focus: 8,
    authenticity: 8
  },

  optional: {
    strategic_value: 10,
    new_information: 10,
    quality_bar: 10,
    topic_choice: 9,
    risk_taking: 7,
    authenticity: 8,
    narrative_quality: 7
  }
};

/**
 * Get dimension weights for essay type
 */
export function getTypeDimensionWeights(type: SupplementalType): Record<string, number> {
  return TYPE_DIMENSION_WEIGHTS[type];
}
