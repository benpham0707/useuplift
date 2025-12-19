/**
 * Writing Principles Framework
 *
 * This file defines the UNDERLYING PRINCIPLES of excellent supplemental writing,
 * not surface patterns. Good writing can take infinite forms - what matters is
 * whether it achieves certain effects on the reader (admissions officer).
 *
 * The goal is to help Claude understand WHY something works, not just WHAT to look for.
 */

import type { SupplementalType } from '../../../data/commonAppSupplementalTypes';

// ============================================================================
// CORE WRITING PRINCIPLES (Universal across all essay types)
// ============================================================================

/**
 * These are the fundamental principles that make ANY writing effective.
 * Good writing can achieve these in countless ways - there's no formula.
 */
export interface WritingPrinciple {
  id: string;
  name: string;

  // The deep WHY - what this principle achieves for the reader
  reader_effect: string;

  // Multiple valid ways to achieve this (not exhaustive, just illustrative)
  valid_approaches: string[];

  // What to look for - but contextually, not as hard patterns
  positive_signals: string[];

  // What undermines this principle - but in context
  undermining_signals: string[];

  // Common misconceptions about this principle
  misconceptions: string[];
}

export const CORE_WRITING_PRINCIPLES: WritingPrinciple[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // PRINCIPLE 1: SPECIFICITY CREATES TRUST
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'specificity_creates_trust',
    name: 'Specificity Creates Trust',

    reader_effect: `When a writer uses specific details, the reader's brain shifts from
"evaluating" to "experiencing." Specificity signals: "This person was actually there.
This actually happened. I can trust what they're telling me." Vague language triggers
skepticism: "Are they making this up? Exaggerating? Hiding something?"`,

    valid_approaches: [
      'Numbers and metrics ("47 students", "3:47 AM")',
      'Sensory details that only someone present would notice ("the hum of the fluorescent lights")',
      'Proper nouns (names, places, specific organizations)',
      'Precise emotional language ("not sad - hollow, like someone had scooped out my insides")',
      'Dialogue that sounds like actual speech',
      'Micro-moments that unfold in real time',
      'Technical or field-specific vocabulary used naturally',
      'Before/after contrasts with concrete markers',
      'Objects or artifacts that anchor abstract ideas'
    ],

    positive_signals: [
      'Reader can visualize the scene',
      'Details feel earned, not inserted',
      'Abstractions are grounded in concrete examples',
      'The writer clearly remembers this experience',
      'Uniqueness - details that couldn\'t appear in another essay'
    ],

    undermining_signals: [
      'Vague quantity words ("many", "various", "significant", "lots of")',
      'Abstract claims without grounding ("I grew as a person")',
      'Details that feel generic or could be anyone\'s',
      'Hedging language ("sort of", "kind of", "I think maybe")',
      'Summary statements that skip over the interesting parts'
    ],

    misconceptions: [
      'WRONG: Specificity means adding numbers everywhere',
      'WRONG: Every paragraph needs statistics',
      'WRONG: Name-dropping professors = specificity',
      'RIGHT: Specificity means making the reader BELIEVE you, whatever form that takes'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRINCIPLE 2: VOICE REVEALS CHARACTER
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'voice_reveals_character',
    name: 'Voice Reveals Character',

    reader_effect: `Admissions officers read thousands of essays. They're not just evaluating
content - they're trying to hear the PERSON. Voice is the quality that makes a reader feel
like they're sitting across from you, not reading a document. It's what makes them think,
"I want to meet this person" vs. "This is well-written but I have no sense of who they are."`,

    valid_approaches: [
      'Sentence rhythm that mirrors how the writer thinks',
      'Word choices that feel personal, not thesaurus-driven',
      'Humor, wit, or irony used naturally',
      'Vulnerability without performance',
      'Opinions stated directly, not hedged',
      'Unexpected observations or connections',
      'Self-awareness about limitations or contradictions',
      'Personality quirks that come through naturally',
      'The courage to be strange or unconventional'
    ],

    positive_signals: [
      'Sentences that could only have been written by this person',
      'Emotional responses feel genuine, not performed',
      'Writer takes risks (humor, honesty, unconventional structure)',
      'Self-deprecation or self-awareness without false modesty',
      'The reader can imagine having a conversation with this person'
    ],

    undermining_signals: [
      '"Essay speak" - phrases that only exist in applications',
      'Vocabulary that feels borrowed or affected',
      'Emotional claims without emotional evidence',
      'Trying too hard to sound impressive/intellectual',
      'Every sentence polished to corporate smoothness',
      'Avoiding anything that might be "risky"'
    ],

    misconceptions: [
      'WRONG: Voice means being casual or using slang',
      'WRONG: Formal writing lacks voice',
      'WRONG: Voice means adding exclamation points or emojis',
      'RIGHT: Voice is the quality that makes YOU irreplaceable in your own essay'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRINCIPLE 3: SHOW ACTION, NOT JUST REFLECTION
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'show_action_not_reflection',
    name: 'Show Action, Not Just Reflection',

    reader_effect: `Colleges want students who DO things, not just think about things.
When an essay shows action - specific choices, attempts, failures, adjustments - the
reader sees evidence of agency. "This person makes things happen." When an essay only
reflects ("I learned that..."), the reader wonders: "Did anything actually change?
Or did they just have a thought?"`,

    valid_approaches: [
      'Scenes that unfold in real time with decisions and consequences',
      'Failed attempts that lead to adjusted approaches',
      'Specific actions taken, not just lessons learned',
      'Before/after behavioral changes (not just mindset changes)',
      'Choices that had stakes and trade-offs',
      'Initiative shown without being told what to do',
      'Problems solved through iteration, not epiphany',
      'Evidence that lessons learned actually changed behavior'
    ],

    positive_signals: [
      'Reader can see what the writer DID, not just what they thought',
      'Multiple attempts or iterations visible',
      'Consequences of actions are shown',
      'Agency language ("I decided", "I chose", "I started") vs. passive',
      'Changes are demonstrated through behavior, not stated'
    ],

    undermining_signals: [
      'Reflection without action ("This experience taught me...")',
      'Lessons learned but no evidence of behavioral change',
      'Passive voice hiding agency ("It was realized that...")',
      'Epiphany without follow-through',
      'Summary of feelings without specific triggering events'
    ],

    misconceptions: [
      'WRONG: Action means listing activities or accomplishments',
      'WRONG: Reflection is bad',
      'WRONG: Every essay needs a dramatic plot',
      'RIGHT: The best essays show action AND reflection, with the reflection earned through action'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRINCIPLE 4: TENSION CREATES ENGAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'tension_creates_engagement',
    name: 'Tension Creates Engagement',

    reader_effect: `Human brains are wired to pay attention to unresolved tension. When
an essay establishes something at stake - a problem, a question, a conflict, a risk -
the reader leans forward. When everything is smooth and resolved from the start, the
reader's attention wanders. Tension doesn't mean drama - it means something that
matters is unresolved.`,

    valid_approaches: [
      'Questions that don\'t have easy answers',
      'Internal conflicts or contradictions',
      'External challenges that genuinely threatened something',
      'Moments of uncertainty or doubt',
      'Stakes established early and maintained',
      'Competing values or desires',
      'The gap between expectation and reality',
      'Vulnerability that creates emotional risk'
    ],

    positive_signals: [
      'Reader wants to know what happens next',
      'Something meaningful is at stake',
      'Essay doesn\'t resolve too quickly or too neatly',
      'Complexity is embraced, not avoided',
      'The writer grapples with difficulty, not just reports it'
    ],

    undermining_signals: [
      'Everything works out perfectly and immediately',
      'No sense of stakes or risk',
      'Problems resolved too easily or quickly',
      'Lessons learned without struggle',
      'Summary that tells outcomes before building tension'
    ],

    misconceptions: [
      'WRONG: Tension means trauma or dramatic events',
      'WRONG: Every essay needs a villain or conflict',
      'WRONG: Happy essays can\'t have tension',
      'RIGHT: Tension is anything unresolved that makes the reader care about resolution'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRINCIPLE 5: INSIGHT REVEALS DEPTH
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'insight_reveals_depth',
    name: 'Insight Reveals Depth',

    reader_effect: `Admissions officers want students who THINK - who notice things
others miss, who make unexpected connections, who question assumptions. Insight is
the moment when a reader thinks, "I've never thought about it that way." It's not
about having the right answer; it's about demonstrating a mind that engages deeply
with experience.`,

    valid_approaches: [
      'Unexpected connections between disparate things',
      'Observations that reveal careful attention',
      'Questions that reframe obvious situations',
      'Recognition of complexity or paradox',
      'Self-awareness about one\'s own biases or blind spots',
      'Challenging conventional wisdom thoughtfully',
      'Finding significance in small moments',
      'Articulating what others feel but haven\'t named'
    ],

    positive_signals: [
      'Reader pauses to think or reconsider',
      'Insights feel earned through experience, not borrowed',
      'Writer notices what others might miss',
      'Complexity is embraced, not simplified',
      'Self-awareness without self-obsession'
    ],

    undermining_signals: [
      'Clichéd lessons ("hard work pays off", "be yourself")',
      'Insights that feel borrowed from motivational posters',
      'Oversimplification of complex situations',
      'Conclusions that don\'t follow from the evidence',
      'Wisdom claimed without evidence of deep thought'
    ],

    misconceptions: [
      'WRONG: Insight means having unique or original ideas',
      'WRONG: Every essay needs a "lesson learned"',
      'WRONG: Insight requires intellectual vocabulary',
      'RIGHT: Insight is showing that you notice, think, and care about understanding'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRINCIPLE 6: STRUCTURE SERVES MEANING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'structure_serves_meaning',
    name: 'Structure Serves Meaning',

    reader_effect: `The way an essay is organized isn't arbitrary - it shapes how the
reader experiences the content. Good structure guides the reader through the essay's
logic or emotion in a way that feels inevitable. The best structures are often
invisible - the reader doesn't notice them because they're so perfectly matched
to the content.`,

    valid_approaches: [
      'Chronological - when time sequence matters',
      'In medias res - starting in the middle of action',
      'Thematic - organizing around ideas, not time',
      'Circular - ending where you started, transformed',
      'Fragmented - when disconnection IS the meaning',
      'Question and exploration - for intellectual essays',
      'Contrast - juxtaposing before/after, here/there',
      'Unconventional - when the form itself conveys meaning'
    ],

    positive_signals: [
      'Structure feels matched to content',
      'Transitions feel natural, not forced',
      'Reader never feels lost',
      'The ending feels earned, not arbitrary',
      'Information is revealed in the right order'
    ],

    undermining_signals: [
      'Five-paragraph essay structure where it doesn\'t fit',
      'Transitions that feel mechanical ("Furthermore...")',
      'Information revealed too early, killing tension',
      'Ending that doesn\'t connect to the rest',
      'Structure borrowed from another essay'
    ],

    misconceptions: [
      'WRONG: Every essay needs introduction, body, conclusion',
      'WRONG: Unconventional structure is risky',
      'WRONG: Structure means following a template',
      'RIGHT: Structure is a tool - use whatever serves your specific essay\'s needs'
    ]
  }
];

// ============================================================================
// TYPE-SPECIFIC WRITING PRINCIPLES
// ============================================================================

/**
 * Each essay type has specific goals - what the admissions officer is trying
 * to learn. These principles help Claude understand the PURPOSE of each type,
 * not just features to count.
 */
export interface TypeSpecificPrinciple {
  type: SupplementalType;

  // What is the admissions officer actually trying to learn?
  reader_question: string;

  // What makes an essay succeed at answering that question?
  success_principles: string[];

  // What are valid, diverse approaches to excellence?
  excellence_paths: string[];

  // What are common pitfalls specific to this type?
  type_pitfalls: string[];

  // What should the reader feel after reading an excellent essay?
  excellent_reader_experience: string;
}

export const TYPE_SPECIFIC_PRINCIPLES: Record<SupplementalType, TypeSpecificPrinciple> = {

  // ═══════════════════════════════════════════════════════════════════════════
  // WHY US
  // ═══════════════════════════════════════════════════════════════════════════
  why_us: {
    type: 'why_us',

    reader_question: `"Does this student actually know what we offer and why it matters
to THEM specifically? Will they thrive here in ways they couldn't elsewhere? Are they
genuinely excited about US, or are we interchangeable with other schools?"`,

    success_principles: [
      'MUTUAL FIT: The essay demonstrates both what the student wants FROM the college AND what they\'ll contribute TO it',
      'RESEARCH DEPTH: The student knows things about the college that require genuine investigation, not just website browsing',
      'PERSONAL CONNECTION: Every resource mentioned connects to something specific about THIS student\'s goals or experiences',
      'SPECIFICITY: Resources named are specific and unique to this college, not generic ("great professors", "diverse community")',
      'SWAP TEST: You could NOT replace the college name with another school\'s name without the essay falling apart'
    ],

    excellence_paths: [
      'Deep dive on 2-3 resources with genuine intellectual connection',
      'Personal story that leads naturally to why this specific college matters',
      'Conversation or interaction with current students/faculty that reveals genuine fit',
      'Research demonstrated through understanding, not just name-dropping',
      'Vision for specific contribution to specific campus communities',
      'Niche resources that only this college offers, matched to niche interests',
      'Academic path traced through specific courses/professors/programs'
    ],

    type_pitfalls: [
      'Generic praise that could apply anywhere ("prestigious", "diverse", "excellent faculty")',
      'Name-dropping resources without explaining why they matter to YOU',
      'One-sided: only what you\'ll GET, not what you\'ll GIVE',
      'Website regurgitation without personal connection',
      'Trying to mention too many things superficially vs. fewer things deeply',
      'Performative enthusiasm without evidence'
    ],

    excellent_reader_experience: `"This student has done their homework and genuinely
understands what we offer. I can see exactly how they\'d plug into our community.
They\'re not just flattering us - they have a specific vision for their time here
that I believe would actually happen."`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WHY MAJOR
  // ═══════════════════════════════════════════════════════════════════════════
  why_major: {
    type: 'why_major',

    reader_question: `"Does this student understand what this field actually IS?
Is their interest intellectual and sustained, or superficial and career-focused?
Do they have the curiosity and preparation to succeed in this discipline?"`,

    success_principles: [
      'INTELLECTUAL FOUNDATION: Shows genuine understanding of the field, not just career applications',
      'ORIGIN WITH DEPTH: The origin story isn\'t just "I always liked X" but shows a specific spark moment',
      'FIELD KNOWLEDGE: Uses field-specific concepts accurately and naturally',
      'CURIOSITY OVER CAREER: Driven by questions and ideas, not just job prospects',
      'PREPARATION EVIDENCE: Has already begun engaging with the field in meaningful ways'
    ],

    excellence_paths: [
      'Specific intellectual question or problem that drives curiosity',
      'Evolution of interest from initial spark to deepening understanding',
      'Self-directed exploration beyond school requirements',
      'Connection between personal experience and field\'s big questions',
      'Understanding of subfields or debates within the discipline',
      'Specific thinkers, texts, or ideas that shaped understanding'
    ],

    type_pitfalls: [
      'Career-only motivation ("I want to be a doctor because...")',
      'Generic origin ("I\'ve always been interested in science")',
      'Surface-level understanding of the field',
      'No evidence of self-directed exploration',
      'Inability to name specific questions or problems in the field'
    ],

    excellent_reader_experience: `"This student gets it. They understand what this
field is actually about, not just what jobs it leads to. Their curiosity is genuine
and their preparation is evident. They\'d be a great fit for our department."`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMUNITY
  // ═══════════════════════════════════════════════════════════════════════════
  community: {
    type: 'community',

    reader_question: `"What communities does this student belong to, and how do they
show up in those communities? Will they contribute to our campus community in
meaningful ways? Do they understand what community actually means?"`,

    success_principles: [
      'PAST PREDICTS FUTURE: Specific past community involvement makes future contributions credible',
      'COMMUNITY DEFINITION: Demonstrates thoughtful understanding of what "community" means to them',
      'CONTRIBUTION OVER MEMBERSHIP: Focus on what they DO in communities, not just belonging',
      'IMPACT EVIDENCE: Shows tangible difference made, not just participation',
      'AUTHENTIC CONNECTION: Genuine care for community members, not resume-building'
    ],

    excellence_paths: [
      'Deep involvement in a non-obvious community',
      'Role as bridge between communities',
      'Initiative that strengthened or created community',
      'Personal transformation through community involvement',
      'Understanding of community dynamics and how change happens',
      'Specific relationships or impact stories'
    ],

    type_pitfalls: [
      'Listing communities without depth',
      'Vague promises about future contribution',
      'Community = just extracurricular activities',
      'No evidence of actual impact or contribution',
      'Generic "I want to help people" without specifics'
    ],

    excellent_reader_experience: `"I can see how this student engages with communities.
They don\'t just join things - they make things better. I believe they\'d contribute
meaningfully to our campus community."`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DIVERSITY
  // ═══════════════════════════════════════════════════════════════════════════
  diversity: {
    type: 'diversity',

    reader_question: `"What unique perspective does this student bring? How has their
background shaped how they see the world? Will they contribute to the diversity of
thought and experience on our campus?"`,

    success_principles: [
      'PERSPECTIVE OVER IDENTITY: Focus on how background shaped THINKING, not just listing identities',
      'VULNERABILITY BALANCED: Shares struggles without being defined by them',
      'GROWTH SHOWN: Demonstrates how perspective evolved, not just what it is',
      'CONTRIBUTION FOCUS: Shows what they\'ll ADD to conversations, not just what they\'ve experienced',
      'NUANCE: Avoids both victim narrative and "overcoming" triumphalism'
    ],

    excellence_paths: [
      'Specific moments when perspective differed from surroundings',
      'Evolution from challenge to understanding to contribution',
      'Bridge-building between different communities or perspectives',
      'Unexpected insight that only this background could provide',
      'Specific ways their perspective has already enriched discussions',
      'Honest engagement with complexity of identity'
    ],

    type_pitfalls: [
      'Identity list without perspective depth',
      'Trauma dump without growth or agency',
      'Preachiness about why diversity matters',
      'Defensive tone about identity',
      'Clichéd "straddling two worlds" narrative without specifics',
      'Focusing on what makes them different without what they\'d contribute'
    ],

    excellent_reader_experience: `"I understand how this person sees the world
differently because of their experiences. They\'re not just diverse on paper -
they\'d genuinely add perspectives to our community that we don\'t currently have."`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INTELLECTUAL CURIOSITY
  // ═══════════════════════════════════════════════════════════════════════════
  intellectual: {
    type: 'intellectual',

    reader_question: `"Is this student genuinely intellectually curious? Do they think
deeply about ideas? Will they engage meaningfully in academic discourse and contribute
to our intellectual community?"`,

    success_principles: [
      'GENUINE CURIOSITY: Interest comes through clearly - this person LOVES thinking about this',
      'SELF-DIRECTION: Learning happened without being assigned or required',
      'DEPTH OVER BREADTH: Deep engagement with specific ideas, not surface-level many',
      'THINKING PROCESS: Shows HOW they think, not just WHAT they concluded',
      'QUESTIONS OVER ANSWERS: Comfortable with uncertainty and ongoing inquiry'
    ],

    excellence_paths: [
      'Obsessive deep-dive into a specific question or topic',
      'Unexpected connections between disparate fields',
      'Self-taught skills or knowledge pursued for pure curiosity',
      'Evolution of thinking through reading, discussion, or experimentation',
      'Intellectual community created or joined',
      'Questions that reveal sophisticated understanding'
    ],

    type_pitfalls: [
      'Generic "I\'m curious about everything"',
      'Focus on achievement rather than learning',
      'No evidence of self-directed exploration',
      'Ideas presented without showing thinking process',
      'Intellectual vocabulary used to sound smart, not communicate'
    ],

    excellent_reader_experience: `"This is a genuine thinker. I can see them staying
up late arguing about ideas in the dorm, challenging professors in class, pursuing
questions no one assigned. They\'d energize our intellectual community."`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTRACURRICULAR
  // ═══════════════════════════════════════════════════════════════════════════
  extracurricular: {
    type: 'extracurricular',

    reader_question: `"What does this activity reveal about who this person IS?
What have they learned or become through this engagement? Is this depth or
just resume-padding?"`,

    success_principles: [
      'DEPTH REVEALS CHARACTER: Activity illuminates personality, values, or growth',
      'COMMITMENT EVIDENCE: Sustained engagement, not just participation',
      'TRANSFORMATION SHOWN: How the student changed through the activity',
      'SPECIFICITY OF EXPERIENCE: Unique aspects of THEIR involvement, not the activity in general',
      'BEYOND RESUME: What they\'d do even if it didn\'t "count"'
    ],

    excellence_paths: [
      'Evolution of role and responsibility over time',
      'Challenges faced and overcome within the activity',
      'Unexpected lessons or growth that came from engagement',
      'Relationships formed through the activity',
      'Initiative or innovation within the activity',
      'How the activity connects to broader values or identity'
    ],

    type_pitfalls: [
      'Resume-style listing of accomplishments',
      'Activity description without personal insight',
      'Many activities mentioned superficially',
      'No evidence of genuine passion or commitment',
      'Focusing on impressiveness rather than meaning'
    ],

    excellent_reader_experience: `"Now I understand something important about who
this person is. This isn\'t just something they did - it\'s part of who they are.
I can see their character through this involvement."`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHALLENGE
  // ═══════════════════════════════════════════════════════════════════════════
  challenge: {
    type: 'challenge',

    reader_question: `"How does this student handle adversity? Do they have resilience
and agency? What did they DO in response to challenge, not just how did they feel?"`,

    success_principles: [
      '20/80 BALANCE: ~20% on the challenge, ~80% on response and growth',
      'AGENCY SHOWN: Focus on what they DID, not what happened TO them',
      'MULTIPLE ATTEMPTS: Growth through iteration, not instant epiphany',
      'BEHAVIORAL CHANGE: Evidence that lessons learned actually changed behavior',
      'ONGOING GROWTH: Not a neat resolution but continuing development'
    ],

    excellence_paths: [
      'Challenge revealed through action, not just description',
      'Failed attempts that led to adjusted approaches',
      'Specific decisions with specific consequences',
      'Support sought and utilized effectively',
      'Challenge transformed into strength or motivation',
      'Vulnerability balanced with demonstrated resilience'
    ],

    type_pitfalls: [
      'Trauma dump - too much on the challenge, not enough on response',
      'Victim narrative - things happening TO them without agency',
      'Instant resolution - problem solved immediately without struggle',
      'Generic lessons - "I learned to be resilient"',
      'Challenge described but no evidence of changed behavior'
    ],

    excellent_reader_experience: `"This student has been tested and has demonstrated
real resilience. I see specific actions they took, specific growth they achieved.
I\'m confident they can handle the challenges of college."`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEADERSHIP
  // ═══════════════════════════════════════════════════════════════════════════
  leadership: {
    type: 'leadership',

    reader_question: `"Does this student understand what real leadership is? Have they
actually influenced others and created change? Will they be a leader on our campus?"`,

    success_principles: [
      'ACTIONS OVER TITLES: What they DID matters more than what they were called',
      'TEAM IMPACT: Evidence of influence on others, not just personal achievement',
      'VULNERABILITY: Willingness to show mistakes and learning as a leader',
      'COLLABORATIVE STYLE: Leadership that empowers others, not dominates them',
      'MEASURABLE IMPACT: Specific, credible changes they created'
    ],

    excellence_paths: [
      'Leadership emerged from need, not assigned',
      'Mistakes made and learned from as a leader',
      'Team or community transformed through leadership',
      'Leadership style evolved through experience',
      'Specific individuals impacted, named if appropriate',
      'Initiative that others joined or continued'
    ],

    type_pitfalls: [
      'Title-focused: "As president, I..."',
      'Solo achievement disguised as leadership',
      'Authoritarian style presented positively',
      'No evidence of impact on others',
      'Generic leadership clichés ("I learned to delegate")'
    ],

    excellent_reader_experience: `"This person understands leadership. They don\'t
just hold positions - they actually influence people and create change. I can see
them leading on our campus in ways that make things better."`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATIVE
  // ═══════════════════════════════════════════════════════════════════════════
  creative: {
    type: 'creative',

    reader_question: `"What is this student\'s creative process like? What does
creativity mean to them? Will they bring creative energy to our community?"`,

    success_principles: [
      'PROCESS OVER PRODUCT: How they create matters more than what they created',
      'IDENTITY CONNECTION: Creativity tied to who they are, not just what they do',
      'UNIQUE PERSPECTIVE: Their creative voice is distinctly theirs',
      'ITERATION SHOWN: Creative work evolved through refinement',
      'RISK-TAKING: Willingness to try things that might not work'
    ],

    excellence_paths: [
      'Creative process described with specific detail',
      'Evolution of creative work over time',
      'Intersection of creativity with other interests',
      'Creative community built or joined',
      'Failure or criticism that improved creative work',
      'Creative work that reveals personality or values'
    ],

    type_pitfalls: [
      'Product-only focus without process',
      'Generic claims of creativity without evidence',
      'Creativity as resume item, not identity',
      'No sense of personal creative voice',
      'Creativity described but not demonstrated in the essay itself'
    ],

    excellent_reader_experience: `"I can see this person\'s creative mind at work.
They don\'t just make things - they think creatively, take risks, and have a
distinctive voice. They\'d bring creative energy to our campus."`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VALUES
  // ═══════════════════════════════════════════════════════════════════════════
  values: {
    type: 'values',

    reader_question: `"What does this student actually care about? Are their values
genuine and tested? Will their values align with and contribute to our community?"`,

    success_principles: [
      'VALUES IN ACTION: Values demonstrated through behavior, not just stated',
      'ORIGIN STORY: Where these values came from, how they developed',
      'TESTED VALUES: Evidence of values maintained under pressure',
      'NUANCE: Awareness of value tensions or complexities',
      'CONSISTENCY: Values visible across different contexts'
    ],

    excellence_paths: [
      'Specific moment when values were tested',
      'Value evolution through experience',
      'Conflict between values and how it was navigated',
      'Values that led to unpopular decisions',
      'How values guide daily behavior, not just big moments',
      'Values transmitted to or influenced others'
    ],

    type_pitfalls: [
      'Values stated without evidence',
      'Generic values everyone claims ("I value integrity")',
      'No evidence of values being tested',
      'Preachiness about values',
      'Values that seem adopted for the application'
    ],

    excellent_reader_experience: `"I understand what matters to this person and WHY.
These aren\'t claimed values - they\'re lived values. I can see how these values
would guide their behavior on our campus."`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FUTURE GOALS
  // ═══════════════════════════════════════════════════════════════════════════
  future_goals: {
    type: 'future_goals',

    reader_question: `"Does this student have direction and purpose? Are their goals
realistic and connected to their experiences? Will they use college purposefully?"`,

    success_principles: [
      'GROUNDED VISION: Goals connected to specific experiences and evidence',
      'REALISTIC SCOPE: Ambitious but not fantasy',
      'IMPACT FOCUS: Goals about contribution, not just personal achievement',
      'FLEXIBILITY: Openness to how goals might evolve',
      'COLLEGE CONNECTION: Clear link between goals and what college offers'
    ],

    excellence_paths: [
      'Goals emerged from specific experiences',
      'Evolution of goals over time',
      'Specific steps already taken toward goals',
      'Understanding of what achieving goals requires',
      'Goals that serve others, not just self',
      'College as specific step in larger journey'
    ],

    type_pitfalls: [
      'Generic ambitions ("I want to change the world")',
      'Goals disconnected from experience',
      'Career-only focus without broader purpose',
      'Unrealistic or undeveloped goals',
      'No connection to college\'s specific offerings'
    ],

    excellent_reader_experience: `"This student knows where they\'re going and has
a realistic plan to get there. Their goals make sense given their experiences,
and I can see how college fits into their journey."`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL INFO
  // ═══════════════════════════════════════════════════════════════════════════
  additional_info: {
    type: 'additional_info',

    reader_question: `"Is there something important I\'m missing about this applicant?
Does this add genuine value, or is it just filling space?"`,

    success_principles: [
      'STRATEGIC VALUE: Adds something the application lacks',
      'CONTEXT WITHOUT EXCUSES: Explains circumstances without blaming them',
      'CONCISE: Says what needs to be said, no more',
      'NEW INFORMATION: Doesn\'t repeat what\'s elsewhere in application',
      'APPROPRIATE TONE: Neither apologetic nor defensive'
    ],

    excellence_paths: [
      'Context that transforms understanding of other application elements',
      'Circumstances explained with dignity and agency',
      'Brief explanation of anomalies (grades, gaps, etc.)',
      'Additional achievement or experience that doesn\'t fit elsewhere',
      'Family or personal circumstances that affected opportunities'
    ],

    type_pitfalls: [
      'Excuses disguised as context',
      'Repeating information from other essays',
      'Using space when there\'s nothing valuable to add',
      'Over-explaining or defensive tone',
      'Adding weak content that hurts rather than helps'
    ],

    excellent_reader_experience: `"I\'m glad they told me this - it changes how
I understand their application. This is genuinely useful context that helps me
see the full picture."`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SHORT ANSWER
  // ═══════════════════════════════════════════════════════════════════════════
  short_answer: {
    type: 'short_answer',

    reader_question: `"Can this student be concise? Do they have personality that
comes through even in a tiny space? Can every word earn its place?"`,

    success_principles: [
      'RUTHLESS CONCISION: Every word must earn its place',
      'IMMEDIATE IMPACT: No throat-clearing or warm-up',
      'PERSONALITY DENSITY: Maximum voice in minimum space',
      'SPECIFICITY: Precise details, not vague gestures',
      'MEMORABLE: Reader remembers this among hundreds'
    ],

    excellence_paths: [
      'Punchy opening that grabs immediately',
      'Unexpected detail or angle',
      'Humor or wit used efficiently',
      'Specificity over breadth',
      'Strong ending that resonates',
      'Format itself conveys meaning (single sentence, list, etc.)'
    ],

    type_pitfalls: [
      'Throat-clearing ("I would say that...")',
      'Filler words ("really", "very", "basically")',
      'Generic responses that could be anyone\'s',
      'Trying to say too much in too little space',
      'No personality - just information'
    ],

    excellent_reader_experience: `"Perfect. This is exactly what I wanted -
personality, specificity, and not a wasted word. I\'ll remember this answer."`
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIONAL
  // ═══════════════════════════════════════════════════════════════════════════
  optional: {
    type: 'optional',

    reader_question: `"Was this worth including? Does it add something valuable
that I wouldn\'t otherwise see? Or did they just fill space?"`,

    success_principles: [
      'ADDITIVE VALUE: Shows something genuinely new',
      'QUALITY BAR: As good as required essays',
      'STRATEGIC FIT: Fills an actual gap in the application',
      'WORTH THE SPACE: Reader glad they read it',
      'NOT REPEATED: Doesn\'t duplicate other essay content'
    ],

    excellence_paths: [
      'New dimension of personality or experience',
      'Topic that didn\'t fit other prompts but is important',
      'Creative use of the open format',
      'Something memorable that distinguishes the application',
      'Demonstrates range beyond other essays'
    ],

    type_pitfalls: [
      'Filling space because it\'s available',
      'Weaker quality than required essays',
      'Repeating themes from other essays',
      'Topic that should have been in a different essay',
      'Using it as a "second chance" on another prompt'
    ],

    excellent_reader_experience: `"I\'m glad they included this. It shows me
something important that I wouldn\'t have seen otherwise. This was definitely
worth reading."`
  }
};

// ============================================================================
// NEGATIVE INDICATORS: PERFORMATIVE WRITING
// ============================================================================

/**
 * These are patterns that indicate the student is PERFORMING rather than
 * communicating genuinely. They suggest the student is trying to "sound good"
 * or "say what they think admissions wants to hear."
 */
export interface PerformativeIndicator {
  id: string;
  name: string;
  description: string;

  // What this signals to admissions
  reader_perception: string;

  // How to recognize it (contextual, not just phrase-matching)
  recognition_cues: string[];

  // Why students do this (helps with teaching)
  underlying_cause: string;

  // What to do instead
  antidote: string;
}

export const PERFORMATIVE_INDICATORS: PerformativeIndicator[] = [
  {
    id: 'trying_to_impress',
    name: 'Trying to Impress Rather Than Connect',
    description: 'Essay feels like a performance for an audience rather than genuine communication.',

    reader_perception: `"This student is performing. They\'re not telling me who they are -
they\'re showing me who they think I want to see. I don\'t trust this voice."`,

    recognition_cues: [
      'Vocabulary feels borrowed or forced (thesaurus syndrome)',
      'Accomplishments emphasized over learning or growth',
      'Everything presented in best possible light with no complexity',
      'Emotions described but don\'t feel authentic',
      'Structure and content feel formulaic or template-driven',
      'Essay could have been written by many different students',
      'No vulnerability, mistakes, or genuine uncertainty'
    ],

    underlying_cause: 'Fear that being genuine won\'t be "impressive enough"',

    antidote: 'Write as if talking to a smart friend, not performing for a judge. Trust that authenticity IS impressive.'
  },

  {
    id: 'saying_what_they_want_to_hear',
    name: 'Saying What They Think Admissions Wants',
    description: 'Content chosen based on perceived expectations rather than genuine experience.',

    reader_perception: `"This feels calculated. They\'re not telling me what matters to THEM -
they\'re telling me what they think matters to ME. But I read thousands of these -
I can spot the difference."`,

    recognition_cues: [
      'Topics chosen for impressiveness rather than meaning',
      'Values expressed match college\'s stated values too perfectly',
      'No genuine stakes or risk in what\'s shared',
      'Future goals align suspiciously perfectly with what college offers',
      'Diversity mentioned strategically rather than authentically',
      'Challenges seem chosen for redemption arc potential',
      'Everything resolves neatly into "growth"'
    ],

    underlying_cause: 'Treating application as a game to be won rather than a communication',

    antidote: 'Write what\'s true, not what\'s strategic. Admissions officers value authenticity over alignment.'
  },

  {
    id: 'emotional_manipulation',
    name: 'Emotional Manipulation',
    description: 'Using emotion as a tool to create sympathy rather than understanding.',

    reader_perception: `"This feels manipulative. They\'re trying to make me feel something
so I\'ll admit them, rather than helping me understand who they are. This makes me
trust them less, not more."`,

    recognition_cues: [
      'Trauma or hardship emphasized for sympathy',
      'Emotional language exceeds what the content supports',
      'Reader feels pushed to feel a certain way',
      'Vulnerability used strategically rather than authentically',
      'Sad stories without agency or growth shown',
      'Emotional appeals without substantive content'
    ],

    underlying_cause: 'Belief that making admissions feel bad = getting admitted',

    antidote: 'Trust that showing genuine experience (including difficulty) is enough. Don\'t push for emotional response.'
  },

  {
    id: 'showing_off',
    name: 'Showing Off / Bragging',
    description: 'Essay designed to showcase accomplishments rather than reveal character.',

    reader_perception: `"This is a resume, not an essay. They\'re listing impressive things
but I have no sense of who they actually are. I can read their accomplishments in the
activities section - the essay should show me something different."`,

    recognition_cues: [
      'Accomplishments mentioned without personal insight',
      'Numbers and awards emphasized',
      'Little vulnerability or self-awareness',
      'Essay reads like LinkedIn profile',
      'Impact quantified but not explored',
      'Others mentioned only to highlight student\'s role'
    ],

    underlying_cause: 'Confusing "impressive application" with "impressive person"',

    antidote: 'The essay\'s job is to reveal character, not prove accomplishment. Activities list proves; essay reveals.'
  },

  {
    id: 'false_modesty',
    name: 'False Modesty / Humble Brag',
    description: 'Pretending to be humble while actually drawing attention to accomplishments.',

    reader_perception: `"This isn\'t modesty - it\'s strategy. They\'re pretending to be
humble while making sure I notice how impressive they are. Real modesty doesn\'t
announce itself."`,

    recognition_cues: [
      '"I was surprised when I won..." (you\'re telling me you won)',
      '"I\'m no expert, but..." (you\'re about to show expertise)',
      'Accomplishments mentioned in context of "learning"',
      'Self-deprecation that doesn\'t ring true',
      'Modesty about things most people would be proud of',
      'Awards or recognition mentioned while claiming they don\'t matter'
    ],

    underlying_cause: 'Wanting credit for both the accomplishment AND for being modest about it',

    antidote: 'Either own your accomplishments honestly or genuinely focus on something else. Don\'t try to have it both ways.'
  },

  {
    id: 'virtue_signaling',
    name: 'Virtue Signaling',
    description: 'Claiming values or caring about issues to look good rather than genuine engagement.',

    reader_perception: `"They\'re telling me they care about X, but where\'s the evidence?
This feels like checking a box. Real commitment shows in action, not claims."`,

    recognition_cues: [
      'Strong claims about values without supporting evidence',
      'Social issues mentioned without personal connection or action',
      'Caring about "making a difference" with no specific plan',
      'Identity or values seem adopted for the application',
      'Buzzwords without substance',
      'Global problems mentioned without personal stake'
    ],

    underlying_cause: 'Belief that claiming good values = being a good person',

    antidote: 'Don\'t claim values - show them through action. If you can\'t point to specific evidence, don\'t claim it.'
  },

  {
    id: 'overpolished',
    name: 'Over-Polished / Too Perfect',
    description: 'Essay feels so refined that the personality has been edited out.',

    reader_perception: `"This is well-written but I have no sense of the person.
Every rough edge has been smoothed away. I want to see a person, not a product."`,

    recognition_cues: [
      'No risks taken - everything safe and polished',
      'Sentences feel too perfect, too balanced',
      'No personality quirks or unexpected moments',
      'Could be about anyone - nothing distinctively personal',
      'Structure feels very intentional, almost mechanical',
      'Transitions are smooth but essay feels bloodless'
    ],

    underlying_cause: 'Over-editing, often driven by too many advisors or too much revision',

    antidote: 'Good writing has personality, which often means imperfection. Don\'t edit out your voice.'
  }
];

// ============================================================================
// EXCELLENCE RECOGNITION (Many Valid Paths)
// ============================================================================

/**
 * Excellence can look MANY different ways. These are examples of different
 * paths to excellence for each essay type, to help Claude recognize that
 * good writing doesn't follow a single formula.
 */
export interface ExcellencePath {
  name: string;
  description: string;
  example_characteristics: string[];
}

export const EXCELLENCE_IS_DIVERSE: string = `
CRITICAL PRINCIPLE FOR ASSESSMENT:

Excellence in supplemental essays does NOT follow a single formula. Two excellent
essays of the same type might look completely different. What they share is EFFECT
on the reader, not surface features.

AN EXCELLENT ESSAY MIGHT:
- Be conventional in structure but exceptional in insight
- Be unconventional in structure and succeed BECAUSE of it
- Have no numbers but be deeply specific through other means
- Have minimal story but profound reflection
- Be funny and succeed through voice and personality
- Be serious and succeed through depth and sincerity
- Be short and succeed through precision
- Be long and succeed through richness

DO NOT penalize essays for:
- Unconventional structure (if it works)
- Absence of specific "features" (if the essay succeeds differently)
- Unusual approaches (if they achieve the purpose)
- Not following templates (templates are training wheels)

DO recognize essays that:
- Create the right EFFECT on the reader
- Achieve the PURPOSE of the essay type
- Demonstrate the PRINCIPLES of good writing
- Make the reader want to meet this person
- Feel like they could only have been written by this person

THE QUESTION IS NOT: "Does this essay have features X, Y, Z?"
THE QUESTION IS: "Does this essay work? Does it achieve what it needs to achieve?"
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getCorePrinciple(id: string): WritingPrinciple | undefined {
  return CORE_WRITING_PRINCIPLES.find(p => p.id === id);
}

export function getTypePrinciples(type: SupplementalType): TypeSpecificPrinciple {
  return TYPE_SPECIFIC_PRINCIPLES[type];
}

export function getPerformativeIndicator(id: string): PerformativeIndicator | undefined {
  return PERFORMATIVE_INDICATORS.find(p => p.id === id);
}

export function getAllPerformativeIndicators(): PerformativeIndicator[] {
  return PERFORMATIVE_INDICATORS;
}
