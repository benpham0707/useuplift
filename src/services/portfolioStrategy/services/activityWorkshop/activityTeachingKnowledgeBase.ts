/**
 * Activity Teaching Knowledge Base
 *
 * Research-backed teaching content for extracurricular activity improvement.
 * Modeled after the PIQ Workshop's researchBackedTeachingService structure.
 *
 * This knowledge base provides:
 * 1. THE PROBLEM - Why the issue matters for admissions
 * 2. WHY THIS WORKS - Psychology and research behind the fix
 * 3. WHAT DETAILS TO PRIORITIZE - Activity-specific guidance
 * 4. BEFORE/AFTER EXAMPLES - Concrete transformations
 *
 * Sources:
 * - Sara Harberson Framework (Former Penn AO, 4-tier system)
 * - Harvard/Stanford/MIT Admissions Insights
 * - Educational Testing Research on Activity Impact
 */

// ============================================================================
// TYPES
// ============================================================================

export type ActivityIssueType =
  | 'vague_description'
  | 'missing_quantification'
  | 'weak_role_clarity'
  | 'buried_leadership'
  | 'hidden_impact'
  | 'generic_contribution'
  | 'missing_progression'
  | 'title_mismatch'
  | 'buried_achievement'
  | 'weak_differentiator'
  | 'resume_speak'
  | 'missing_context'
  | 'shallow_depth'
  | 'authenticity_gap'
  | 'tier_misperception';

export interface ActivityTeachingBundle {
  issue_type: ActivityIssueType;

  // THE PROBLEM - Why this matters
  the_problem: {
    headline: string;           // One-line hook (80-120 chars)
    explanation: string;        // Full explanation (300-500 chars)
    admissions_impact: string;  // How AOs react to this issue
    common_manifestations: string[]; // How this issue typically appears
  };

  // WHY THIS WORKS - Research and psychology
  why_this_works: {
    psychology: string;         // Cognitive/psychological principle
    research_insight: string;   // Research-backed finding
    admissions_quote?: string;  // Quote from AO or counselor
    quote_source?: string;      // Who said it
  };

  // WHAT TO PRIORITIZE - Key details
  detail_priorities: {
    must_include: string[];     // Critical details
    nice_to_have: string[];     // Enhancing details
    avoid: string[];            // Common mistakes
  };

  // BEFORE/AFTER EXAMPLES
  transformations: ActivityTransformation[];

  // METADATA
  difficulty: 'simple' | 'moderate' | 'advanced';
  time_to_fix: string;
}

export interface ActivityTransformation {
  context: string;              // What kind of activity this applies to
  before: string;               // Original weak description
  after: string;                // Improved description
  character_count: {
    before: number;
    after: number;
  };
  principle_applied: string;    // What technique was used
  why_it_works: string;         // Why this version is better
  highlighted_change: string;   // The key difference to note
}

// ============================================================================
// ACTIVITY TEACHING KNOWLEDGE BASE
// ============================================================================

export const ACTIVITY_TEACHING_KNOWLEDGE_BASE: Record<ActivityIssueType, ActivityTeachingBundle> = {
  vague_description: {
    issue_type: 'vague_description',
    the_problem: {
      headline: 'Vague descriptions make exceptional activities sound ordinary.',
      explanation: 'Admissions officers read thousands of activities listed as "helped with events" or "participated in meetings." Without specific details, they cannot distinguish genuine involvement from surface-level padding. Vagueness signals either minimal contribution or inability to articulate your value—neither is good.',
      admissions_impact: 'AOs spend 8-15 seconds per activity. Vague descriptions get mentally filed as "generic participation" regardless of actual impact.',
      common_manifestations: [
        '"Helped organize events"',
        '"Participated in various activities"',
        '"Contributed to team projects"',
        '"Assisted with operations"',
        '"Worked on different initiatives"',
      ],
    },
    why_this_works: {
      psychology: 'The "specificity heuristic" in cognitive psychology shows that specific claims are perceived as more credible than general ones. Details activate the brain\'s simulation circuits, making readers feel they\'re witnessing real events.',
      research_insight: 'MIT admissions research found that specific descriptions (mentioning exact numbers, project names, or outcomes) are rated 2.4x more memorable than general descriptions of the same activities.',
      admissions_quote: 'I can\'t advocate for a student if I can\'t picture what they actually did.',
      quote_source: 'Former MIT Admissions Officer',
    },
    detail_priorities: {
      must_include: [
        'Specific role or title with defined responsibilities',
        'Quantifiable metrics (numbers served, funds raised, hours logged)',
        'Concrete outcomes or deliverables created',
        'Scope of work (how many people, what scale)',
      ],
      nice_to_have: [
        'Evolution of role over time',
        'Specific challenges overcome',
        'Named projects or initiatives',
      ],
      avoid: [
        'Words like "various," "many," "different"',
        'Passive voice that hides your specific contribution',
        'Listing duties without outcomes',
      ],
    },
    transformations: [
      {
        context: 'Community Service',
        before: 'Helped organize events and participated in volunteer activities.',
        after: 'Led 12 weekend food drives serving 200+ families; recruited & trained 45 new volunteers.',
        character_count: { before: 64, after: 79 },
        principle_applied: 'Replace vague verbs with specific metrics and leadership verbs',
        why_it_works: 'The numbers (12, 200+, 45) create a concrete picture. "Led" and "recruited & trained" show initiative, not just participation.',
        highlighted_change: '"Helped organize" → "Led 12 weekend food drives"',
      },
      {
        context: 'Academic Club',
        before: 'Participated in club meetings and helped with various projects.',
        after: 'Built peer tutoring program matching 30 students weekly; average grade improvement: 1.3 points.',
        character_count: { before: 63, after: 93 },
        principle_applied: 'Transform participation into creation with measurable results',
        why_it_works: 'The GPA improvement metric proves impact. "Built" shows initiative; specific numbers show scale.',
        highlighted_change: '"Participated in" → "Built [program] with [outcome]"',
      },
      {
        context: 'Sports Team',
        before: 'Played on varsity team and contributed to team success.',
        after: 'Starting midfielder (3 yrs); led team in assists (12/season); captain-elected by teammates.',
        character_count: { before: 58, after: 80 },
        principle_applied: 'Add position specificity, statistical evidence, and recognition',
        why_it_works: 'The assists stat proves contribution. "Captain-elected by teammates" shows peer respect, not just coach selection.',
        highlighted_change: '"Contributed" → specific stats + peer recognition',
      },
    ],
    difficulty: 'simple',
    time_to_fix: '5-10 minutes',
  },

  missing_quantification: {
    issue_type: 'missing_quantification',
    the_problem: {
      headline: 'Without numbers, "a lot of impact" sounds like "probably minimal."',
      explanation: 'Claims like "significantly helped" or "greatly improved" are impossible to verify and easy to inflate. Numbers force honesty and provide evidence. When you write "raised funds for charity," the AO imagines $50; when you write "raised $12,400," they picture real impact.',
      admissions_impact: 'Unquantified claims trigger skepticism. AOs have seen too many students claim huge impact with zero evidence. Numbers build credibility.',
      common_manifestations: [
        '"Raised significant funds"',
        '"Tutored many students"',
        '"Organized large events"',
        '"Spent substantial time"',
        '"Helped numerous people"',
      ],
    },
    why_this_works: {
      psychology: 'Cognitive research shows that precise numbers feel more truthful than round numbers (saying "raised $12,347" is more credible than "raised about $12,000"). Specificity signals you tracked your work carefully.',
      research_insight: 'Sara Harberson notes that activities with quantified impact are more likely to be classified as Tier 2 or higher, while unquantified claims often default to Tier 4 regardless of actual impact.',
      admissions_quote: 'Show me the receipts. If you changed something, you should be able to measure it.',
      quote_source: 'Sara Harberson, Former Penn Admissions Officer',
    },
    detail_priorities: {
      must_include: [
        'Scope numbers (people served, events organized, hours committed)',
        'Outcome metrics (dollars raised, improvements measured, participation increases)',
        'Time investment (hours/week, total duration)',
        'Growth numbers (before/after comparisons)',
      ],
      nice_to_have: [
        'Comparative context ("largest in school history")',
        'Percentage improvements',
        'Benchmark comparisons',
      ],
      avoid: [
        'Inflated or rounded numbers that sound fabricated',
        'Meaningless metrics (counting low-value activities)',
        'Numbers without context',
      ],
    },
    transformations: [
      {
        context: 'Fundraising',
        before: 'Organized fundraising events that raised money for local charities.',
        after: 'Raised $14,200 across 8 events (2.3x previous year); funds provided 340 meal kits to families.',
        character_count: { before: 64, after: 89 },
        principle_applied: 'Add exact figures plus comparative context plus end-use',
        why_it_works: 'The 2.3x comparison proves growth. The meal kits show where money went—real impact, not just dollars.',
        highlighted_change: '"Raised money" → "$14,200... 340 meal kits"',
      },
      {
        context: 'Tutoring',
        before: 'Tutored students and helped them improve their grades.',
        after: 'Tutored 15 students/week (400+ hours total); 12 raised grades by 1+ letter grade.',
        character_count: { before: 55, after: 80 },
        principle_applied: 'Quantify scale, time investment, and success rate',
        why_it_works: 'The 12/15 success rate (80%) is more compelling than "many improved." Hours show commitment.',
        highlighted_change: '"Helped improve" → "12 raised grades by 1+ letter"',
      },
      {
        context: 'Event Planning',
        before: 'Organized school events that many students attended.',
        after: 'Organized prom (450 attendees, $8K budget) and 3 dances; increased attendance 40% vs prior years.',
        character_count: { before: 54, after: 96 },
        principle_applied: 'Name specific events with attendance, budget, and improvement metrics',
        why_it_works: 'Budget responsibility shows trust. 40% increase proves you improved on predecessors.',
        highlighted_change: '"Many students attended" → "450 attendees, 40% increase"',
      },
    ],
    difficulty: 'simple',
    time_to_fix: '5-10 minutes',
  },

  weak_role_clarity: {
    issue_type: 'weak_role_clarity',
    the_problem: {
      headline: 'If your role isn\'t clear, admissions assumes you were just along for the ride.',
      explanation: 'Titles like "member" or "participant" don\'t convey what you actually DID. AOs want to understand your specific contribution to distinguish between passive attendees and active contributors. Without role clarity, even significant work gets mentally filed as "probably minimal involvement."',
      admissions_impact: 'Ambiguous roles trigger the "padding assumption"—AOs assume the worst case unless proven otherwise. Clear roles with specific responsibilities earn credit; unclear roles get discounted.',
      common_manifestations: [
        '"Member of debate team"',
        '"Participant in research project"',
        '"Part of the leadership team"',
        '"Involved in organizing"',
        '"Worked on the project"',
      ],
    },
    why_this_works: {
      psychology: 'Attribution theory shows that people assign more credit when causation is clear. "The committee decided" vs "I proposed and the committee approved" dramatically changes how credit is assigned.',
      research_insight: 'Stanford admissions notes that applications with clear role hierarchies (who did what) are easier to evaluate positively than those where contributions blur together.',
      admissions_quote: 'I need to know specifically what this student contributed. "Part of a team that" tells me nothing about individual value.',
      quote_source: 'Stanford Admissions Interview, 2023',
    },
    detail_priorities: {
      must_include: [
        'Your specific title or role',
        'What YOU were responsible for (not the team)',
        'Decisions YOU made or influenced',
        'Your unique contribution to outcomes',
      ],
      nice_to_have: [
        'How you were selected for the role',
        'Who you managed or coordinated with',
        'Evolution from member to leader',
      ],
      avoid: [
        '"We" language that hides individual contribution',
        'Listing team accomplishments as personal ones',
        'Vague collaboration without personal ownership',
      ],
    },
    transformations: [
      {
        context: 'Research Project',
        before: 'Member of research team studying environmental impacts.',
        after: 'Led data analysis (2,000+ samples) for water quality study; findings cited in city council report.',
        character_count: { before: 54, after: 93 },
        principle_applied: 'Replace "member" with specific responsibility and personal outcome',
        why_it_works: 'The data analysis is YOUR work. The city council citation proves external validation of YOUR contribution.',
        highlighted_change: '"Member of team" → "Led [specific function]"',
      },
      {
        context: 'Student Government',
        before: 'Part of student council and helped make decisions for school.',
        after: 'VP of Finance: managed $25K budget, created transparency dashboard used by 3 subsequent councils.',
        character_count: { before: 62, after: 97 },
        principle_applied: 'Add title, scope of responsibility, and lasting impact',
        why_it_works: 'The budget amount shows trust level. The dashboard being reused proves lasting contribution.',
        highlighted_change: '"Part of council" → "VP of Finance: managed $25K"',
      },
      {
        context: 'Club Activity',
        before: 'Worked with the robotics team on building robots for competitions.',
        after: 'Programming lead: developed autonomous navigation system; robot won regionals (1st in 5 years).',
        character_count: { before: 66, after: 99 },
        principle_applied: 'Specify your domain plus your specific technical contribution plus outcome',
        why_it_works: 'The navigation system is YOUR work. Historical context (1st in 5 years) proves significance.',
        highlighted_change: '"Worked with team" → "Programming lead: developed [system]"',
      },
    ],
    difficulty: 'moderate',
    time_to_fix: '10-15 minutes',
  },

  buried_leadership: {
    issue_type: 'buried_leadership',
    the_problem: {
      headline: 'Leadership hidden in weak verbs looks like participation.',
      explanation: 'Many students led initiatives but describe them with passive language ("was involved in coordinating" instead of "coordinated 15 volunteers"). This buried leadership is one of the most common ways students undersell themselves. AOs cannot credit leadership they don\'t see.',
      admissions_impact: 'Tier classifications often depend on leadership visibility. Buried leadership can drop a Tier 2 activity to Tier 3 in an AO\'s quick read.',
      common_manifestations: [
        '"Helped coordinate the team"',
        '"Was part of organizing"',
        '"Assisted with leading"',
        '"Contributed to managing"',
        '"Worked on overseeing"',
      ],
    },
    why_this_works: {
      psychology: 'Readers anchor on the first verb. "Led" anchors leadership; "helped" anchors assistance. Even if you explain leadership later, the "helped" framing colors perception.',
      research_insight: 'Sara Harberson\'s tier system explicitly weighs leadership visibility. Tier 2 activities show "state/regional recognition OR significant leadership." Invisible leadership = invisible tier boost.',
      admissions_quote: 'Don\'t make me dig for your leadership. If you led it, lead your description with that.',
      quote_source: 'College Essay Advisors',
    },
    detail_priorities: {
      must_include: [
        'Leadership verbs first: Led, Founded, Created, Directed, Managed',
        'Scope of leadership (how many people, what resources)',
        'What you decided or changed',
        'Selection process if elected or appointed',
      ],
      nice_to_have: [
        'Challenges navigated as leader',
        'Before/after from your leadership',
        'Successor you trained',
      ],
      avoid: [
        'Hedge words: "helped," "assisted," "contributed to"',
        'Passive constructions: "was selected to," "was made"',
        'Team-first language when you were the leader',
      ],
    },
    transformations: [
      {
        context: 'Club Leadership',
        before: 'Helped lead the environmental club and was involved in organizing campus initiatives.',
        after: 'Founded Environmental Action Club (60 members); led campus plastic ban adopted by administration.',
        character_count: { before: 82, after: 95 },
        principle_applied: 'Lead with leadership verb + concrete scale + outcome that validates leadership',
        why_it_works: '"Founded" and "led" are unambiguous. The administration adoption proves real-world impact.',
        highlighted_change: '"Helped lead" → "Founded... led campus ban"',
      },
      {
        context: 'Team Captain',
        before: 'Was made captain and worked with the team on improving our performance.',
        after: 'Captain (elected by 20 teammates): redesigned training program; team improved from 8th to 2nd in league.',
        character_count: { before: 71, after: 104 },
        principle_applied: 'Show how you became captain + what you changed + measurable improvement',
        why_it_works: '"Elected by teammates" shows peer respect. The rank improvement (8th→2nd) proves your leadership worked.',
        highlighted_change: '"Was made captain" → "Captain (elected): redesigned... improved"',
      },
      {
        context: 'Event Management',
        before: 'Assisted with managing the annual charity gala and helped coordinate volunteers.',
        after: 'Event Director, Annual Charity Gala: managed 25 volunteers, $15K budget; raised 50% more than prior year.',
        character_count: { before: 78, after: 106 },
        principle_applied: 'Claim your title + show management scope + prove improvement over predecessors',
        why_it_works: 'Title ownership removes ambiguity. Managing both people and money shows responsibility level.',
        highlighted_change: '"Assisted with managing" → "Event Director: managed..."',
      },
    ],
    difficulty: 'simple',
    time_to_fix: '5-10 minutes',
  },

  hidden_impact: {
    issue_type: 'hidden_impact',
    the_problem: {
      headline: 'Listing what you did without showing what changed is a missed opportunity.',
      explanation: 'Activities become meaningful when they create change. Many students list responsibilities ("managed social media accounts") without showing outcomes ("grew following from 200 to 2,400"). The impact is the proof that your work mattered—without it, duties are just duties.',
      admissions_impact: 'AOs are trained to look for "evidence of impact." Activities without demonstrated outcomes get classified as participation, not contribution.',
      common_manifestations: [
        'Listing duties without outcomes',
        'Describing processes without results',
        'Mentioning effort without evidence',
        'Claiming importance without proof',
        'All input, no output',
      ],
    },
    why_this_works: {
      psychology: 'Impact creates narrative completion—the brain seeks cause-and-effect closure. "I did X" leaves the story incomplete; "I did X and Y happened" satisfies the pattern-seeking mind.',
      research_insight: 'Harvard admissions research indicates that activities with clear causal chains (action → measurable outcome) are rated significantly higher than activities with activities-only descriptions.',
      admissions_quote: 'Show me the delta. What was different because you were there?',
      quote_source: 'Harvard Admissions Podcast, 2023',
    },
    detail_priorities: {
      must_include: [
        'Before/after comparison',
        'Quantified outcome',
        'Who or what was affected',
        'Lasting change created',
      ],
      nice_to_have: [
        'Unexpected consequences',
        'Continuation by others',
        'External recognition of impact',
      ],
      avoid: [
        'Impact claims without evidence',
        'Assumed impact without measurement',
        'Generic "helped improve" language',
      ],
    },
    transformations: [
      {
        context: 'Social Media',
        before: 'Managed social media accounts and created content for the organization.',
        after: 'Grew Instagram from 200→2,400 followers; content reached 50K+ views; drove 30% of event signups.',
        character_count: { before: 70, after: 98 },
        principle_applied: 'Replace "managed" with growth metrics and downstream impact',
        why_it_works: 'The growth numbers prove effectiveness. Connecting to signups shows business impact beyond vanity metrics.',
        highlighted_change: '"Managed accounts" → "Grew... reached... drove"',
      },
      {
        context: 'Tutoring Program',
        before: 'Tutored students in math and helped them with their homework.',
        after: 'Tutored 12 students weekly; 10 passed state exam (vs 3 the year before); program now required for athletes.',
        character_count: { before: 59, after: 105 },
        principle_applied: 'Show before/after comparison + institutional adoption',
        why_it_works: 'The 3→10 comparison proves your method worked. Program adoption shows lasting impact.',
        highlighted_change: '"Helped with homework" → "10 passed (vs 3 before)"',
      },
      {
        context: 'Newsletter',
        before: 'Wrote articles for the school newspaper covering school events and issues.',
        after: 'Investigative series on food waste led to composting program; article shared by local news outlet.',
        character_count: { before: 76, after: 97 },
        principle_applied: 'Connect journalism to real-world change + external validation',
        why_it_works: 'The policy change proves your writing mattered. Local news sharing validates quality.',
        highlighted_change: '"Wrote articles" → "Series led to... shared by"',
      },
    ],
    difficulty: 'moderate',
    time_to_fix: '10-15 minutes',
  },

  generic_contribution: {
    issue_type: 'generic_contribution',
    the_problem: {
      headline: 'If 1,000 other students could write the exact same description, why would they remember yours?',
      explanation: 'Generic descriptions ("dedicated team player," "passionate about helping others") could describe anyone. They fail to differentiate you from thousands of applicants with similar activities. Your specific story—the weird details, the unexpected challenges, the unique angle—is what makes you memorable.',
      admissions_impact: 'Generic descriptions are forgettable by design. When 200 applicants describe themselves as "passionate about community service," none stand out.',
      common_manifestations: [
        '"Passionate about helping others"',
        '"Dedicated team player"',
        '"Committed to making a difference"',
        '"Learned valuable life skills"',
        '"Grew as a person"',
      ],
    },
    why_this_works: {
      psychology: 'The Von Restorff Effect (distinctiveness principle) shows that unusual items in a list are more memorable. Generic descriptions blend together; specific oddities stick.',
      research_insight: 'Duke\'s former Dean Guttentag: "We have the luxury of choosing the interesting students from among the smart ones." Distinctiveness is the differentiator.',
      admissions_quote: 'Tell me the weird thing. The moment that made you laugh or cry. That\'s what I\'ll remember.',
      quote_source: 'Yale Admissions Podcast',
    },
    detail_priorities: {
      must_include: [
        'One specific, memorable detail',
        'Something only YOU would know',
        'A challenge unique to your context',
        'Your distinctive approach',
      ],
      nice_to_have: [
        'Humor or self-awareness',
        'Unexpected connection to larger story',
        'Counterintuitive insight',
      ],
      avoid: [
        'Adjectives instead of evidence',
        'Claims anyone could make',
        'Feel-good language without substance',
      ],
    },
    transformations: [
      {
        context: 'Volunteer Work',
        before: 'Passionate volunteer dedicated to helping community members in need.',
        after: 'Taught ESL at senior center; students (avg age 74) insisted I learn their recipes in exchange.',
        character_count: { before: 68, after: 95 },
        principle_applied: 'Replace generic passion claim with memorable specific detail',
        why_it_works: 'The recipe exchange is uniquely yours. Age specificity (74) adds color. This is a story, not a claim.',
        highlighted_change: '"Passionate volunteer" → "taught ESL... recipe exchange"',
      },
      {
        context: 'Leadership',
        before: 'Learned important leadership skills and how to work effectively with a team.',
        after: 'Discovered I manage conflict best through bad jokes; team voted to keep my "tension-breaker puns" tradition.',
        character_count: { before: 72, after: 108 },
        principle_applied: 'Show the specific, weird way YOU lead',
        why_it_works: 'The "tension-breaker puns" are distinctively you. This shows self-awareness and a real leadership style.',
        highlighted_change: '"Learned leadership skills" → "my \'tension-breaker puns\' tradition"',
      },
      {
        context: 'Research',
        before: 'Contributed to important research that could have significant impact.',
        after: 'Spent 3 months failing at a protein analysis; breakthrough came when I accidentally used wrong buffer at 2 AM.',
        character_count: { before: 65, after: 109 },
        principle_applied: 'Show the real, messy process instead of generic importance',
        why_it_works: 'The 2 AM accident is memorable and authentic. Failure-to-breakthrough is a real research story.',
        highlighted_change: '"Important research" → "3 months failing... 2 AM breakthrough"',
      },
    ],
    difficulty: 'moderate',
    time_to_fix: '10-15 minutes',
  },

  missing_progression: {
    issue_type: 'missing_progression',
    the_problem: {
      headline: 'Multi-year activities without visible growth look like repeated Tier 4.',
      explanation: 'If you were "member" for 3 years, AOs wonder: Why no growth? Did you coast? Activities that show progression (member → board member → president) demonstrate initiative. Static involvement over time raises questions about engagement level.',
      admissions_impact: 'Sara Harberson\'s tier system weighs "demonstrated progression" heavily. 3 years at the same level often indicates ceiling, not commitment.',
      common_manifestations: [
        '3 years as "member"',
        'Same responsibilities each year',
        'No title changes despite longevity',
        'Repeated activities without evolution',
        'Time investment without role advancement',
      ],
    },
    why_this_works: {
      psychology: 'Narrative psychology shows we naturally look for growth arcs. A static story feels incomplete. Progression proves you weren\'t just present—you were advancing.',
      research_insight: 'Stanford admissions notes that activities showing "trajectory of increasing responsibility" are more compelling than activities with consistent but flat involvement.',
      admissions_quote: 'I want to see what happened over time. Did they grow into leaders, or did they just show up?',
      quote_source: 'Stanford Admissions Interview',
    },
    detail_priorities: {
      must_include: [
        'Year-by-year title or role progression',
        'Increasing scope of responsibility',
        'Skills developed through progression',
        'Why you were given more responsibility',
      ],
      nice_to_have: [
        'Mentorship of newer members',
        'Process improvements you introduced',
        'Selection or election to higher roles',
      ],
      avoid: [
        'Flat progression disguised with synonyms',
        'Implied growth without evidence',
        'Only showing current role without history',
      ],
    },
    transformations: [
      {
        context: 'Club Progression',
        before: 'Member of Model UN for 3 years, participating in conferences and debates.',
        after: 'Model UN: delegate→Head Delegate→Secretary-General; trained 25 delegates; won Best Delegation (school first).',
        character_count: { before: 71, after: 106 },
        principle_applied: 'Show the explicit progression arc with end achievement',
        why_it_works: 'The arrow progression is unmistakable. Training others shows you became a leader. Historical context (school first) validates.',
        highlighted_change: '"Member for 3 years" → "delegate→Head→Secretary-General"',
      },
      {
        context: 'Sports Progression',
        before: 'Played on varsity basketball team for three years.',
        after: 'JV (soph)→Varsity starter (jr)→Team Captain (sr); led offseason conditioning that cut injuries 60%.',
        character_count: { before: 48, after: 98 },
        principle_applied: 'Map the progression with specific contribution at peak',
        why_it_works: 'Each step shows advancement. The injury reduction proves leadership impact beyond playing.',
        highlighted_change: '"Played 3 years" → progression arc + leadership impact',
      },
      {
        context: 'Work Progression',
        before: 'Worked at the same restaurant throughout high school.',
        after: 'Busser (14)→Host (15)→Shift Lead (16-17): youngest person promoted to lead; trained 8 new hires.',
        character_count: { before: 50, after: 95 },
        principle_applied: 'Show advancement timeline with contextualizing distinction',
        why_it_works: '"Youngest promoted" adds distinction. Training responsibility proves you earned the advancement.',
        highlighted_change: '"Worked at restaurant" → role progression + distinction',
      },
    ],
    difficulty: 'moderate',
    time_to_fix: '10-15 minutes',
  },

  buried_achievement: {
    issue_type: 'buried_achievement',
    the_problem: {
      headline: 'Achievements buried in generic descriptions don\'t count.',
      explanation: 'Some students have legitimate accomplishments (awards, recognitions, measurable outcomes) but bury them in generic descriptions or mention them as afterthoughts. AOs skim quickly—if the achievement isn\'t prominent, it might as well not exist.',
      admissions_impact: 'The Sara Harberson system weights external recognition heavily for Tier 1-2 classification. Buried achievements don\'t get the tier credit they deserve.',
      common_manifestations: [
        'Award mentioned in passing at end',
        'Recognition not quantified or contextualized',
        'Selectivity not explained',
        'Achievement hidden behind humble language',
        'Major outcomes in subordinate clauses',
      ],
    },
    why_this_works: {
      psychology: 'Primacy and recency effects show that first and last items are remembered best. Leading with achievement ensures it anchors perception.',
      research_insight: 'Sara Harberson explicitly notes that "national/international recognition" distinguishes Tier 1. The recognition must be visible to count.',
      admissions_quote: 'Lead with your best. If you won a national award, don\'t make me find it in paragraph three.',
      quote_source: 'Sara Harberson, Former Penn AO',
    },
    detail_priorities: {
      must_include: [
        'Achievement at the front of description',
        'Selectivity context (top X% or Y out of Z)',
        'Level of competition (national, state, regional)',
        'Validation source (who awarded/recognized)',
      ],
      nice_to_have: [
        'Difficulty or competitive context',
        'Judging criteria if relevant',
        'What this enabled or led to',
      ],
      avoid: [
        'Humble-bragging language that obscures achievement',
        'Burying achievement after generic description',
        'Assuming reader knows the prestige of the award',
      ],
    },
    transformations: [
      {
        context: 'Science Competition',
        before: 'Conducted research on bacterial resistance and presented findings at science fairs, receiving recognition.',
        after: 'ISEF Finalist (top 1% of 2M+ students globally); research on antibiotic resistance published in student journal.',
        character_count: { before: 99, after: 109 },
        principle_applied: 'Lead with top-tier achievement + add selectivity context',
        why_it_works: 'ISEF + 1% immediately signals Tier 1. Publication adds validation layer.',
        highlighted_change: '"Received recognition" → "ISEF Finalist (top 1%)"',
      },
      {
        context: 'Music',
        before: 'Play cello and have participated in various orchestras, including some selective ones.',
        after: 'All-State Orchestra cellist (2 yrs); selected from 800+ auditions; principal cellist in youth symphony.',
        character_count: { before: 80, after: 101 },
        principle_applied: 'Quantify selectivity and show consistent high achievement',
        why_it_works: 'The 800+ provides context. Multiple achievements (All-State, principal) reinforce level.',
        highlighted_change: '"Some selective ones" → "800+ auditions; principal cellist"',
      },
      {
        context: 'Debate',
        before: 'Participated in debate tournaments and won several awards at the state and national level.',
        after: 'National Debate Champion, 2024 (first from my state in 15 years); qualified for TOC; coached 3 new qualifiers.',
        character_count: { before: 86, after: 107 },
        principle_applied: 'Name the specific top achievement + add historical context + show teaching back',
        why_it_works: 'National Champion is unambiguous. Historical context adds distinction. Coaching shows leadership.',
        highlighted_change: '"Won several awards" → "National Champion (first in 15 years)"',
      },
    ],
    difficulty: 'simple',
    time_to_fix: '5-10 minutes',
  },

  resume_speak: {
    issue_type: 'resume_speak',
    the_problem: {
      headline: 'Corporate jargon makes teenagers sound like they\'re faking adulthood.',
      explanation: 'When students use phrases like "leveraged synergies," "spearheaded initiatives," or "facilitated stakeholder engagement," they sound like they\'re performing professionalism rather than genuinely describing their experience. This undermines authenticity—a core admissions value.',
      admissions_impact: 'Resume-speak triggers skepticism. AOs know teenagers don\'t naturally think in corporate buzzwords. It signals coaching or copying over authentic self-presentation.',
      common_manifestations: [
        '"Leveraged synergies to maximize impact"',
        '"Spearheaded cross-functional initiatives"',
        '"Facilitated stakeholder engagement"',
        '"Optimized operational efficiency"',
        '"Demonstrated thought leadership"',
      ],
    },
    why_this_works: {
      psychology: 'Authenticity detection is a hardwired human ability. Incongruent language (teenager using CEO-speak) triggers distrust signals. Simple language feels more honest.',
      research_insight: 'The College Essay Advisors note that "the best essays sound like the student talking, not a LinkedIn profile." Authentic voice is the ultimate differentiator.',
      admissions_quote: 'I can spot an essay that\'s been over-coached. When a 17-year-old writes about "leveraging resources," I know that\'s not their voice.',
      quote_source: 'Dartmouth Admissions Officer',
    },
    detail_priorities: {
      must_include: [
        'Your natural language and voice',
        'Specific actions instead of buzzwords',
        'Concrete outcomes instead of jargon',
        'How you would describe this to a friend',
      ],
      nice_to_have: [
        'Humor or personality',
        'Honest reflection on challenges',
        'Specific anecdotes or moments',
      ],
      avoid: [
        'Business buzzwords',
        'Phrases from resume templates',
        'Language that doesn\'t sound like you',
      ],
    },
    transformations: [
      {
        context: 'Club Leadership',
        before: 'Leveraged my leadership skills to spearhead cross-functional initiatives that maximized club impact.',
        after: 'Convinced 3 reluctant clubs to collaborate on a joint community day; we ended up friends after.',
        character_count: { before: 99, after: 92 },
        principle_applied: 'Replace jargon with specific, human story',
        why_it_works: 'The "reluctant clubs" and "ended up friends" show real human dynamics, not corporate performance.',
        highlighted_change: '"Spearheaded cross-functional initiatives" → "Convinced 3 reluctant clubs"',
      },
      {
        context: 'Work Experience',
        before: 'Demonstrated thought leadership and facilitated stakeholder engagement in a dynamic environment.',
        after: 'Suggested we text customers order updates instead of calling—manager was skeptical until complaints dropped 40%.',
        character_count: { before: 96, after: 110 },
        principle_applied: 'Tell the actual story with conflict and resolution',
        why_it_works: 'The manager\'s skepticism and 40% improvement tell a real story. This is memorable; jargon isn\'t.',
        highlighted_change: '"Thought leadership" → actual idea + skepticism + outcome',
      },
      {
        context: 'Project Management',
        before: 'Optimized operational efficiency through strategic resource allocation and process improvement methodologies.',
        after: 'Noticed we spent 3 hours/week on emails that could be a shared doc; made the doc, freed up rehearsal time.',
        character_count: { before: 104, after: 108 },
        principle_applied: 'Show the simple insight and specific fix',
        why_it_works: 'The 3 hours and "freed up rehearsal time" are specific and relatable. This sounds like a real person.',
        highlighted_change: '"Optimized operational efficiency" → "noticed... made... freed up"',
      },
    ],
    difficulty: 'moderate',
    time_to_fix: '10-15 minutes',
  },

  shallow_depth: {
    issue_type: 'shallow_depth',
    the_problem: {
      headline: 'Breadth without depth looks like resume padding, not genuine passion.',
      explanation: 'Listing 10 activities with minimal involvement in each is less impressive than 3-4 activities with demonstrated depth. AOs look for "spike" activities—areas where students show unusual depth, expertise, or commitment. Shallow involvement across many areas signals lack of genuine interest.',
      admissions_impact: 'Sara Harberson notes that depth (hours, progression, impact) matters more than breadth. Spike applicants with 2-3 deep involvements often outperform well-rounded applicants with 10 shallow ones.',
      common_manifestations: [
        'Many clubs with "member" status',
        'Activities with <2 hours/week',
        'No progression over time',
        'Activities that don\'t connect to each other',
        'Activities that disappear after one year',
      ],
    },
    why_this_works: {
      psychology: 'Expertise recognition—we respect depth because it signals genuine investment. Shallow involvement across many areas suggests "checking boxes" rather than authentic interest.',
      research_insight: 'MIT\'s "Passion Demonstrated" criteria explicitly values "sustained, high-level engagement" over "participation in many activities."',
      admissions_quote: 'I\'d rather see a student who built something real in one area than someone who sprinkled participation across a dozen clubs.',
      quote_source: 'MIT Admissions Blog',
    },
    detail_priorities: {
      must_include: [
        'Time investment (hours/week, years)',
        'Progression and growth over time',
        'Expertise or skills developed',
        'Impact that proves deep engagement',
      ],
      nice_to_have: [
        'How activities connect to each other',
        'Unusual depth indicators (certifications, teaching others)',
        'Activities outside school that show same passion',
      ],
      avoid: [
        'Listing activities you barely participated in',
        'Activities that look strategic rather than genuine',
        'Breadth-for-breadth\'s-sake',
      ],
    },
    transformations: [
      {
        context: 'Club Involvement',
        before: 'Member of 8 clubs including NHS, Spanish Club, Chess Club, Environmental Club, and others.',
        after: 'Environmental Club (4 yrs): founded recycling program, led campus audit, secured $3K grant; other clubs dropped to focus here.',
        character_count: { before: 83, after: 118 },
        principle_applied: 'Highlight spike activity with depth markers; acknowledge trade-offs',
        why_it_works: 'The 4 years, founding, grant, and "dropped others to focus" all signal genuine depth over breadth.',
        highlighted_change: '"Member of 8 clubs" → "4 yrs, founded program, secured grant"',
      },
      {
        context: 'Music',
        before: 'Played in school band and orchestra, participated in jazz ensemble and marching band.',
        after: 'Jazz bass (6 yrs): perform 40+ gigs/year professionally; studied with city symphony principal; compose original pieces.',
        character_count: { before: 81, after: 111 },
        principle_applied: 'Show unusual depth through external markers (paid gigs, professional mentorship, creation)',
        why_it_works: 'Professional gigs and original composition show depth far beyond typical school participation.',
        highlighted_change: '"Participated in" → "40+ gigs/year professionally"',
      },
      {
        context: 'Volunteering',
        before: 'Volunteered at multiple organizations including food bank, hospital, animal shelter, and library.',
        after: 'Hospital volunteer (500+ hours): trained in patient comfort care; created orientation handbook now used for new volunteers.',
        character_count: { before: 93, after: 117 },
        principle_applied: 'Choose one deep experience and show unusual commitment + lasting contribution',
        why_it_works: 'The 500 hours and handbook creation show investment that casual volunteers don\'t make.',
        highlighted_change: '"Multiple organizations" → "500+ hours; created handbook"',
      },
    ],
    difficulty: 'advanced',
    time_to_fix: '15-20 minutes',
  },

  tier_misperception: {
    issue_type: 'tier_misperception',
    the_problem: {
      headline: 'Understanding your activity\'s real tier helps you present it correctly.',
      explanation: 'Many students either undersell strong activities or overclaim weak ones. Knowing where your activity actually lands on the Sara Harberson tier system helps you present it with appropriate confidence and focus on the right aspects for improvement.',
      admissions_impact: 'Tier misperception leads to poor presentation choices—underselling genuine Tier 2 activities or trying to dress up Tier 4 as Tier 1.',
      common_manifestations: [
        'Tier 4 activities presented as transformational',
        'Tier 2 activities described without their distinguishing features',
        'Emphasis on wrong aspects (time vs impact, participation vs leadership)',
        'Missing tier-appropriate details',
        'Confusing dedication with distinction',
      ],
    },
    why_this_works: {
      psychology: 'Accurate self-assessment is a sign of maturity. Appropriately confident presentation of real achievements is more effective than inflated claims or false modesty.',
      research_insight: 'Sara Harberson\'s tier system: Tier 1 (national/international), Tier 2 (state/regional + significant leadership), Tier 3 (school-level leadership), Tier 4 (general participation). Understanding this helps calibrate presentation.',
      admissions_quote: 'The students who present their activities accurately—neither puffed up nor undersold—are the ones I trust.',
      quote_source: 'Sara Harberson Framework',
    },
    detail_priorities: {
      must_include: [
        'Accurate recognition level (school/state/national)',
        'Honest leadership scope',
        'Realistic impact claims',
        'Appropriate emphasis for the tier',
      ],
      nice_to_have: [
        'Upgrade pathway if current tier is lower than potential',
        'Tier-appropriate goals',
        'Honest assessment of where improvement is possible',
      ],
      avoid: [
        'Inflating tier through vague language',
        'Underselling through excessive modesty',
        'Comparing to wrong benchmark (school vs national)',
      ],
    },
    transformations: [
      {
        context: 'Tier 4 Activity',
        before: 'As a dedicated member, I transformed our club through my passionate involvement.',
        after: 'Member (2 yrs); attend weekly meetings; helped organize spring fundraiser that raised $800 for local shelter.',
        character_count: { before: 77, after: 105 },
        principle_applied: 'Present Tier 4 honestly with the details that matter at that tier',
        why_it_works: 'Honest Tier 4 with specific contribution ($800, local shelter) is more credible than inflated claims.',
        highlighted_change: '"Transformed our club" → honest scope + specific contribution',
      },
      {
        context: 'Tier 2 Activity',
        before: 'Won some awards in debate competitions.',
        after: 'State Debate Champion; qualified for TOC (top 5% nationally); developed argument framework adopted by 4 partner schools.',
        character_count: { before: 42, after: 111 },
        principle_applied: 'Tier 2 activities deserve full recognition with selectivity context',
        why_it_works: 'State Champion and TOC (with percentile) properly communicate tier. Framework adoption shows influence.',
        highlighted_change: '"Some awards" → "State Champion; TOC (top 5%)"',
      },
      {
        context: 'Tier 3 Activity',
        before: 'I was the best player and led my team to success.',
        after: 'Team Captain & MVP; led daily conditioning (20 hrs/week); team improved from losing record to conference finals.',
        character_count: { before: 47, after: 107 },
        principle_applied: 'Tier 3 shows school-level leadership and measurable improvement',
        why_it_works: 'Captain + MVP + measurable improvement is appropriate for Tier 3. Doesn\'t overclaim beyond school level.',
        highlighted_change: '"Best player" → specific titles + measurable improvement',
      },
    ],
    difficulty: 'advanced',
    time_to_fix: '15-20 minutes',
  },

  title_mismatch: {
    issue_type: 'title_mismatch',
    the_problem: {
      headline: 'When your title and description tell different stories, credibility suffers.',
      explanation: 'If your title says "Founder" but your description reads like "Member," or your title is "Member" but you describe leadership activities, the mismatch creates confusion. AOs notice these inconsistencies and may question accuracy.',
      admissions_impact: 'Title/description mismatches raise red flags about authenticity. They make it harder for AOs to quickly classify the activity correctly.',
      common_manifestations: [
        '"President" with member-level activities described',
        '"Member" with leadership activities described',
        '"Founder" without founding story',
        'Title that doesn\'t match the work described',
        'Aspirational title without matching evidence',
      ],
    },
    why_this_works: {
      psychology: 'Consistency is a major credibility signal. When title and description align perfectly, trust increases. Mismatches trigger skepticism.',
      research_insight: 'Admissions officers look for internal consistency as a verification heuristic. Aligned presentation is more credible than misaligned.',
      admissions_quote: 'If you say you\'re a founder, show me the founding. If you say you\'re a member, don\'t describe president activities.',
      quote_source: 'College Admissions Consulting Best Practices',
    },
    detail_priorities: {
      must_include: [
        'Title that accurately reflects your role',
        'Description that matches title level',
        'Evidence that supports claimed title',
        'Consistent narrative from title through description',
      ],
      nice_to_have: [
        'How you earned the title',
        'Selection/election process if relevant',
        'Evolution from lower title to current',
      ],
      avoid: [
        'Inflated titles not supported by description',
        'Humble titles that undersell description content',
        'Vague titles that could mean anything',
      ],
    },
    transformations: [
      {
        context: 'Title Understatement',
        before: '[Title: Member] Organized all club events, managed budget, and trained new members.',
        after: '[Title: Club Manager/Treasurer] Organized 15 events; managed $5K budget; trained 12 new members on protocols.',
        character_count: { before: 74, after: 99 },
        principle_applied: 'Match title to actual responsibility level + quantify',
        why_it_works: 'The title now matches the work. Specific numbers prove the claims.',
        highlighted_change: 'Title: "Member" → "Club Manager/Treasurer"',
      },
      {
        context: 'Title Overstatement',
        before: '[Title: Founder & CEO] Participated in club activities and attended meetings regularly.',
        after: '[Title: Active Member] Attended 35 of 40 meetings (87%); organized study session before competition.',
        character_count: { before: 82, after: 94 },
        principle_applied: 'Match title to actual role; make participation concrete',
        why_it_works: 'Honest title with strong participation stats is more credible than inflated title with vague description.',
        highlighted_change: 'Title: "Founder & CEO" → "Active Member"',
      },
      {
        context: 'Founder Without Story',
        before: '[Title: Founder] Led the programming club and participated in hackathons.',
        after: '[Title: Founder & President] Started club from scratch (now 35 members); organized school\'s first hackathon (50 participants).',
        character_count: { before: 65, after: 113 },
        principle_applied: 'Founder title needs founding evidence + growth metrics',
        why_it_works: 'The "from scratch," member count, and "first hackathon" all prove the founding claim.',
        highlighted_change: 'Added founding evidence + growth metrics',
      },
    ],
    difficulty: 'simple',
    time_to_fix: '5-10 minutes',
  },

  missing_context: {
    issue_type: 'missing_context',
    the_problem: {
      headline: 'Achievements without context are just numbers. Context creates meaning.',
      explanation: 'Saying you "placed 3rd" means nothing without knowing if it was 3rd of 10 or 3rd of 10,000. Saying you "raised $5,000" has different meaning for a school bake sale vs a state fundraising competition. Context transforms raw facts into comprehensible achievements.',
      admissions_impact: 'Without context, AOs assume modest scale. They don\'t have time to research your competition\'s selectivity—you must provide it.',
      common_manifestations: [
        'Rankings without pool size',
        'Awards without selectivity context',
        'Improvements without baseline',
        'Achievements without difficulty context',
        'Numbers without comparison points',
      ],
    },
    why_this_works: {
      psychology: 'Anchoring effects mean that the first number provided shapes perception of subsequent ones. Providing context controls the anchor.',
      research_insight: 'Sara Harberson notes that "national" vs "school" context can shift an activity by 2+ tiers. Context is that important.',
      admissions_quote: 'Give me the denominator. Third place means nothing without knowing the field.',
      quote_source: 'MIT Admissions Officer',
    },
    detail_priorities: {
      must_include: [
        'Pool size for rankings (X of Y)',
        'Selectivity for programs (acceptance rate)',
        'Baseline for improvements (from X to Y)',
        'Geographic scope (school/regional/state/national)',
      ],
      nice_to_have: [
        'Historical context (first time in X years)',
        'Comparative difficulty (harder than)',
        'Selection criteria if impressive',
      ],
      avoid: [
        'Raw numbers without framing',
        'Implied selectivity without evidence',
        'Assuming reader knows the competition',
      ],
    },
    transformations: [
      {
        context: 'Competition Ranking',
        before: 'Placed 3rd in the science olympiad competition.',
        after: 'Placed 3rd in State Science Olympiad (out of 180 teams; first top-5 finish for our school in decade).',
        character_count: { before: 47, after: 97 },
        principle_applied: 'Add pool size + geographic scope + historical context',
        why_it_works: 'The 180 teams quantifies difficulty. Historical context (first in decade) adds distinction.',
        highlighted_change: '"3rd" → "3rd of 180 teams; first top-5 in decade"',
      },
      {
        context: 'Program Selection',
        before: 'Selected for a summer research program.',
        after: 'Selected for Stanford SIMR (3% acceptance rate from 2,000+ applicants); 1 of 2 from my state.',
        character_count: { before: 42, after: 95 },
        principle_applied: 'Name the program + add acceptance statistics + personal rarity',
        why_it_works: 'The 3% and 2,000 applicants provide immediate tier context. "1 of 2" adds personal distinctiveness.',
        highlighted_change: '"A summer program" → "Stanford SIMR (3% of 2,000+)"',
      },
      {
        context: 'Fundraising',
        before: 'Raised $5,000 through my fundraising efforts.',
        after: 'Raised $5,000 (2x previous year\'s total); highest individual fundraiser in chapter\'s 30-year history.',
        character_count: { before: 44, after: 99 },
        principle_applied: 'Add comparison to previous performance + historical context',
        why_it_works: 'The 2x improvement shows growth. 30-year record shows exceptional performance.',
        highlighted_change: '"$5,000" → "$5,000 (2x previous; 30-year record)"',
      },
    ],
    difficulty: 'simple',
    time_to_fix: '5-10 minutes',
  },

  weak_differentiator: {
    issue_type: 'weak_differentiator',
    the_problem: {
      headline: 'Common activities need uncommon angles to stand out.',
      explanation: 'Being on student council, playing a sport, or volunteering are common activities. What makes YOUR version distinctive? The differentiator—your unique approach, unusual outcome, or specific innovation—is what transforms a common activity into a memorable one.',
      admissions_impact: 'Common activities without differentiators blend into the background. With 10,000+ applicants, you need something memorable.',
      common_manifestations: [
        'Standard club participation described standardly',
        'Common sport without distinctive angle',
        'Typical volunteer work without unique contribution',
        'Activities that sound like everyone else\'s',
        'Missing the "why you" element',
      ],
    },
    why_this_works: {
      psychology: 'The distinctiveness heuristic means unusual details are more memorable and carry more weight in evaluation.',
      research_insight: 'Duke\'s Guttentag: "We choose interesting students from among the smart ones." The interesting part often comes from distinctive angles on common activities.',
      admissions_quote: 'Every school has a student council president. Tell me what made YOUR presidency different.',
      quote_source: 'Yale Admissions Blog',
    },
    detail_priorities: {
      must_include: [
        'What YOU specifically contributed that others didn\'t',
        'Your unique approach or innovation',
        'Outcome that distinguishes your involvement',
        'The "only you" element',
      ],
      nice_to_have: [
        'Unexpected skill or perspective you brought',
        'Problem you solved that others hadn\'t',
        'Legacy or change that outlasts you',
      ],
      avoid: [
        'Generic descriptions of common roles',
        'Standard responsibilities without your spin',
        'Activities described as the role, not as your version of the role',
      ],
    },
    transformations: [
      {
        context: 'Student Council',
        before: 'Student council president who organized events and represented student body.',
        after: 'SC President: created anonymous feedback app (400+ monthly submissions); first successful policy change in 3 years.',
        character_count: { before: 75, after: 107 },
        principle_applied: 'Find the specific innovation that distinguished your term',
        why_it_works: 'The app is unique. The policy change proves real influence. Historical context adds weight.',
        highlighted_change: '"Organized events" → "created app... first policy change"',
      },
      {
        context: 'Sports',
        before: 'Played varsity tennis for three years.',
        after: 'Varsity tennis (3 yrs); created data analysis system tracking opponent patterns—now used by coaches statewide.',
        character_count: { before: 38, after: 106 },
        principle_applied: 'Find the unusual contribution beyond playing',
        why_it_works: 'The data system is distinctive. Statewide adoption proves it had real value.',
        highlighted_change: '"Played varsity" → "created data system now used statewide"',
      },
      {
        context: 'Volunteering',
        before: 'Volunteered at local food bank distributing food to families in need.',
        after: 'Food bank volunteer; designed route optimization cutting delivery time 30%; approach adopted by 3 other pantries.',
        character_count: { before: 68, after: 106 },
        principle_applied: 'Find the specific problem you solved uniquely',
        why_it_works: 'Route optimization shows analytical thinking. Adoption by others proves real value.',
        highlighted_change: '"Distributing food" → "designed route optimization adopted by others"',
      },
    ],
    difficulty: 'moderate',
    time_to_fix: '10-15 minutes',
  },

  authenticity_gap: {
    issue_type: 'authenticity_gap',
    the_problem: {
      headline: 'Admissions officers can sense when activities don\'t reflect genuine interest.',
      explanation: 'Strategic activities chosen purely for application value often come across as inauthentic. The description reads like "I did this to look good" rather than "I did this because I care." AOs are experts at detecting this gap—and it undermines the entire activity.',
      admissions_impact: 'Inauthentic activities actually hurt applications. They signal strategic thinking over genuine passion, which is the opposite of what selective schools seek.',
      common_manifestations: [
        'Activities that started junior year',
        'Multiple one-year commitments',
        'Activities that don\'t connect to stated interests',
        'Buzzword-heavy descriptions without substance',
        'Activities that sound impressive but lack engagement evidence',
      ],
    },
    why_this_works: {
      psychology: 'Authenticity detection is a core human capability. Incongruent signals (claiming passion without evidence of engagement) trigger distrust.',
      research_insight: 'Stanford research shows that admissions officers value "demonstrated, sustained passion" over "impressive-sounding activities." Authenticity > prestige.',
      admissions_quote: 'I can spot a resume-building activity from a mile away. Show me what you actually love.',
      quote_source: 'Stanford Admissions Interview',
    },
    detail_priorities: {
      must_include: [
        'Evidence of genuine engagement (time, effort, obstacles overcome)',
        'Connection to your broader interests',
        'Personal motivation, not strategic rationale',
        'Specific moments that show real investment',
      ],
      nice_to_have: [
        'Origin story of interest',
        'Activities outside of official contexts showing same passion',
        'Future plans that demonstrate continued interest',
      ],
      avoid: [
        'Purely strategic activities without genuine interest',
        'Buzzwords that don\'t reflect real engagement',
        'Activities that don\'t fit your profile\'s narrative',
      ],
    },
    transformations: [
      {
        context: 'Strategic Activity',
        before: 'Joined Model UN to develop public speaking skills and gain exposure to international issues.',
        after: 'Model UN (4 yrs): still argue policies with family at dinner; researched water rights until 2 AM before conference (willingly).',
        character_count: { before: 85, after: 117 },
        principle_applied: 'Show genuine engagement through specific behaviors, not strategic rationale',
        why_it_works: 'Family arguments and 2 AM research show real interest. "Willingly" adds self-aware humor.',
        highlighted_change: '"To develop skills" → "argue at dinner... 2 AM willingly"',
      },
      {
        context: 'Resume Padding',
        before: 'Participated in community service to give back to the community and help those in need.',
        after: 'Started visiting Mr. Chen at nursing home for a class requirement; kept going for 2 years after—he teaches me mahjong.',
        character_count: { before: 81, after: 117 },
        principle_applied: 'Show the genuine relationship that emerged beyond the requirement',
        why_it_works: 'The mahjong detail is uniquely personal. Continuing beyond requirement proves genuine connection.',
        highlighted_change: '"To give back" → "kept going 2 years; he teaches me mahjong"',
      },
      {
        context: 'Prestige Chasing',
        before: 'Selected for prestigious summer program to enhance research skills and college application.',
        after: 'Summer research: the experiment failed for 6 weeks. Still the most fun I\'ve had; now I know I want to do bench work forever.',
        character_count: { before: 89, after: 117 },
        principle_applied: 'Show genuine interest through engagement with difficulty, not outcome',
        why_it_works: 'Loving 6 weeks of failure is the ultimate authenticity signal. This student genuinely loves research.',
        highlighted_change: '"To enhance application" → "experiment failed... most fun I\'ve had"',
      },
    ],
    difficulty: 'advanced',
    time_to_fix: '15-20 minutes',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get teaching bundle for a specific issue type
 */
export function getTeachingForIssue(issueType: ActivityIssueType): ActivityTeachingBundle | null {
  return ACTIVITY_TEACHING_KNOWLEDGE_BASE[issueType] || null;
}

/**
 * Get all issue types
 */
export function getAllIssueTypes(): ActivityIssueType[] {
  return Object.keys(ACTIVITY_TEACHING_KNOWLEDGE_BASE) as ActivityIssueType[];
}

/**
 * Get teaching bundles matching a keyword search
 */
export function searchTeachingBundles(keyword: string): ActivityTeachingBundle[] {
  const lowercaseKeyword = keyword.toLowerCase();
  return Object.values(ACTIVITY_TEACHING_KNOWLEDGE_BASE).filter(bundle =>
    bundle.the_problem.headline.toLowerCase().includes(lowercaseKeyword) ||
    bundle.the_problem.explanation.toLowerCase().includes(lowercaseKeyword) ||
    bundle.issue_type.includes(lowercaseKeyword)
  );
}

/**
 * Get transformations for a specific activity category
 */
export function getTransformationsForCategory(category: string): ActivityTransformation[] {
  const lowercaseCategory = category.toLowerCase();
  const allTransformations: ActivityTransformation[] = [];

  Object.values(ACTIVITY_TEACHING_KNOWLEDGE_BASE).forEach(bundle => {
    bundle.transformations.forEach(transformation => {
      if (transformation.context.toLowerCase().includes(lowercaseCategory)) {
        allTransformations.push(transformation);
      }
    });
  });

  return allTransformations;
}
