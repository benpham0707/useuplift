/**
 * Leadership & Government Expertise Domain
 *
 * Covers: Student government, class officer, school board, club leadership,
 * political campaigns, activism, community organizing.
 *
 * Key AO insight: Leadership is the MOST inflated category on applications.
 * Every applicant claims to "lead." AOs have seen thousands of "Student Body
 * President" entries that say nothing about what actually changed. The bar
 * is therefore HIGHER — students must demonstrate impact, not title.
 *
 * Critical distinction: AOs evaluate leadership through OUTCOMES, not POSITIONS.
 * "President of X" is a starting point, not a differentiator. The question is
 * always: "What is different because this student was in charge?"
 *
 * Sources: Sara Harberson (former Penn admissions dean), MIT Admissions blog,
 * NACAC surveys on activity evaluation, published AO panel transcripts.
 */

import type { ExpertiseDomain } from '../types';

export const LEADERSHIP_GOVERNMENT_DOMAIN: ExpertiseDomain = {
  domainId: 'leadership_government',
  label: 'Leadership & Government',
  overview:
    'Student government, club leadership, political campaigns, and activism. ' +
    'The most saturated activity category — nearly every competitive applicant claims ' +
    'leadership. AOs look past titles to measurable change. The critical question is ' +
    'not "What were you called?" but "What is different because you were there?"',

  aoExpectations: {
    whatRegisters: [
      'Measurable change: policy adopted, system created, problem solved with quantified results',
      'Initiative beyond the role: doing something NO previous holder of this position did',
      'Coalition building: uniting opposing groups, creating buy-in across stakeholders',
      'Systemic improvements: changes that persist after the student leaves',
      'Constituent impact: evidence that other students\' lives actually changed',
      'Scale context: numbers that show the scope of influence (students served, budget managed, participation increased)',
    ],
    whatAOsSeeThrough: [
      'Title-only entries: "Student Body President" with no substance — AOs see this hundreds of times per cycle',
      'Process descriptions: "Led weekly meetings" or "Organized events" — these are duties, not achievements',
      'Vague advocacy: "Represented student interests" without any evidence of what changed',
      'Budget-as-achievement: "Managed $10K budget" — managing money is a responsibility, not an accomplishment',
      'Resolution padding: "Passed 5 resolutions" in student government where resolutions have no enforcement power',
      'Participation inflation: "Organized school dance" when the event happens every year regardless',
    ],
    goldenQuestion:
      'What is concretely, measurably different at this school or in this community because this student held this position?',
    readingTimeContext:
      'AOs spend 8-12 seconds per activity. Leadership entries get LESS benefit of the doubt because ' +
      'AOs have seen thousands of inflated leadership claims. The first 5 words determine whether they read carefully or skim.',
    competitiveContext:
      'At selective schools, 60-80% of applicants claim leadership roles. "Club President" alone ' +
      'provides zero differentiation. Students compete against applicants who founded nonprofits, ' +
      'passed actual legislation through city councils, or built organizations from zero to hundreds of members.',
  },

  realExpertiseSignals: [
    {
      id: 'lg_policy_adoption',
      pattern: 'policy_change',
      description: 'A specific policy the student proposed that was adopted and implemented',
      whyItWorks:
        'Policy change is the hardest outcome in leadership — it requires problem identification, ' +
        'proposal writing, stakeholder buy-in, and implementation. Only someone who actually drove ' +
        'change would describe the specific policy and its measurable effect.',
      examples: [
        'Proposed recycling policy adopted school-wide, diverting 2 tons waste/year from landfill',
        'Authored inclusive dress code revision adopted by school board after 3 public hearings',
        'Created mental health day policy — 89% student body voted yes, adopted by admin for 2025-26',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'policy', 'adopted', 'implemented', 'approved', 'passed', 'school-wide',
        'revised', 'reformed', 'established', 'instituted', 'codified',
      ],
    },
    {
      id: 'lg_constituent_impact',
      pattern: 'constituent_impact',
      description: 'Quantified improvement in the lives of the people the student represented',
      whyItWorks:
        'AOs respect leaders who measure their success by the impact on others, not by their own ' +
        'resume. Citing constituent outcomes shows the student understands that leadership is service.',
      examples: [
        'Created student mental health committee — counseling appointments up 40% within one semester',
        'Launched anonymous reporting system; bullying incidents decreased 35% year-over-year',
        'Started free SAT prep program serving 120 first-gen students, avg score increase 80 pts',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'students served', 'increased', 'decreased', 'improved', 'reduced',
        'participation', 'usage', 'satisfaction', 'attendance', 'enrollment',
      ],
    },
    {
      id: 'lg_budget_innovation',
      pattern: 'budget_innovation',
      description: 'Creative reallocation or generation of funds that enabled new programs',
      whyItWorks:
        'Managing a budget is a duty. Finding money where none existed or redirecting funds to solve ' +
        'a problem shows entrepreneurial thinking. AOs distinguish between stewardship and creation.',
      examples: [
        'Redirected $5K from unused line items to fund 3 new student clubs, all still active 2 years later',
        'Negotiated corporate sponsorship program generating $8K/year — first external funding in school history',
        'Cut event costs 30% through vendor renegotiation, redirected savings to need-based activity fee waivers',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'redirected', 'generated', 'secured funding', 'negotiated', 'fundraised',
        'sponsorship', 'reallocated', 'saved', 'invested', 'grant',
      ],
    },
    {
      id: 'lg_coalition_building',
      pattern: 'coalition_building',
      description: 'Uniting opposing or disparate groups to achieve a shared goal',
      whyItWorks:
        'Coalition building is the highest form of leadership — it requires empathy, negotiation, ' +
        'and compromise. AOs at elite schools specifically look for this because it mirrors the ' +
        'leadership challenges students will face in college and beyond.',
      examples: [
        'United 5 competing clubs to co-host diversity week — 800+ attendees, largest non-athletic school event',
        'Mediated conflict between student gov and admin over phone policy; compromise adopted unanimously',
        'Built bipartisan student coalition that jointly presented to school board, first time in 10 years',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'united', 'coalition', 'mediated', 'compromise', 'bipartisan', 'jointly',
        'collaboration', 'bridged', 'brought together', 'partnered',
      ],
    },
    {
      id: 'lg_systemic_change',
      pattern: 'systemic_change',
      description: 'Structural improvements that persist after the student graduates',
      whyItWorks:
        'Systemic change proves the student built something durable, not just a one-time event. ' +
        'AOs value institution-building because it shows the student thinks beyond personal credit.',
      examples: [
        'Restructured club funding process — 12 new clubs approved vs 3 in previous year, system still in use',
        'Created student government constitution adopted as official governance document by school board',
        'Designed leadership transition handbook now used by all club presidents during officer changeover',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'restructured', 'created system', 'established process', 'handbook',
        'constitution', 'framework', 'institutionalized', 'still in use', 'permanent',
      ],
    },
    {
      id: 'lg_election_metrics',
      pattern: 'election_metrics',
      description: 'Specific election data that demonstrates genuine popular support',
      whyItWorks:
        'Election results are objective validation. Citing turnout increases or vote margins ' +
        'shows the student earned their position through genuine engagement, not an uncontested race.',
      examples: [
        'Won with 68% vote in 4-candidate race; drove highest turnout in 5 years (72% participation)',
        'Re-elected with 81% approval after first term focused on cafeteria menu reform',
        'Ran on transparency platform — introduced public meeting minutes, won 3:1 over incumbent',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'elected', 'vote', 'turnout', 'approval', 'margin', 'campaign',
        'platform', 'contested', 'ran on', 'candidate',
      ],
    },
    {
      id: 'lg_problem_identification',
      pattern: 'problem_identification',
      description: 'Student identified a specific problem before anyone asked them to solve it',
      whyItWorks:
        'Most student leaders execute inherited agendas. Identifying a NEW problem and solving it ' +
        'demonstrates initiative — the trait AOs value most in leadership. It separates creators from caretakers.',
      examples: [
        'Discovered 30% of club budgets went unspent; created reallocation process to fund waitlisted groups',
        'Surveyed 400 students, found 65% felt unrepresented — launched affinity group liaison program',
        'Identified that freshmen had zero voice in student gov; created freshman advisory council with voting rep',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'identified', 'discovered', 'surveyed', 'found that', 'noticed',
        'gap', 'unaddressed', 'overlooked', 'no one had', 'first to',
      ],
    },
    {
      id: 'lg_stakeholder_navigation',
      pattern: 'stakeholder_navigation',
      description: 'Navigating adult decision-makers (admin, school board) to achieve student goals',
      whyItWorks:
        'Working with adults in power demonstrates maturity and political skill. AOs recognize ' +
        'that persuading a school board is fundamentally harder than leading peers — it requires ' +
        'preparation, professionalism, and resilience.',
      examples: [
        'Presented data-backed proposal to school board; 3 of 5 recommendations adopted within 6 months',
        'Met weekly with principal for a semester to negotiate open campus lunch — piloted spring 2025',
        'Collaborated with district superintendent on student safety task force after threat incident',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'school board', 'administration', 'principal', 'superintendent', 'presented to',
        'proposed to', 'negotiated with', 'advocated before', 'testified',
      ],
    },
    {
      id: 'lg_failure_recovery',
      pattern: 'failure_learning',
      description: 'Acknowledging a leadership failure and what was learned or changed',
      whyItWorks:
        'Admitting failure is paradoxically one of the strongest authenticity signals. Most students ' +
        'present a highlight reel. A student who describes what went wrong and how they adapted shows ' +
        'genuine self-awareness — something AOs actively look for.',
      examples: [
        'First proposal rejected by admin; revised with teacher coalition support, passed on second attempt',
        'Event attendance dropped 60% year-over-year; surveyed students, pivoted format, recovered to 120% baseline',
        'Initial diversity initiative criticized as performative; rebuilt with affected student input, relaunched to broad support',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'failed', 'rejected', 'revised', 'pivoted', 'rebuilt', 'learned',
        'second attempt', 'initially', 'setback', 'overcame',
      ],
    },
    {
      id: 'lg_data_driven_decision',
      pattern: 'data_driven_decision',
      description: 'Using surveys, data, or research to inform leadership decisions',
      whyItWorks:
        'Data-driven leadership signals intellectual maturity. Instead of leading by opinion, ' +
        'the student gathered evidence — a skill that translates directly to college-level work ' +
        'and is rare among high school leaders.',
      examples: [
        'Conducted school-wide survey (n=800), used results to prioritize 3 student gov initiatives',
        'Analyzed 5 years of club funding data; identified bias toward established groups, reformed criteria',
        'Tracked attendance at 12 events to determine optimal timing — spring events saw 2x participation',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'survey', 'data', 'analyzed', 'research', 'tracked', 'measured',
        'evidence', 'findings', 'results showed', 'based on',
      ],
    },
    {
      id: 'lg_mentorship_pipeline',
      pattern: 'mentorship_pipeline',
      description: 'Creating structures to develop future leaders, not just leading personally',
      whyItWorks:
        'Building a leadership pipeline shows the student thinks beyond their own tenure. AOs see ' +
        'this as a sign of genuine institutional commitment rather than resume-building.',
      examples: [
        'Created officer training program — 8 of 10 trained members now hold leadership positions',
        'Paired 15 freshmen with senior mentors; 60% ran for student gov positions the following year',
        'Built leadership curriculum for incoming officers, adopted by student activities director permanently',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'impact',
      detectionKeywords: [
        'mentored', 'trained', 'developed', 'pipeline', 'succession',
        'incoming', 'transition', 'program', 'taught', 'next generation',
      ],
    },
    {
      id: 'lg_external_recognition',
      pattern: 'external_recognition',
      description: 'Recognition from entities outside the school for leadership work',
      whyItWorks:
        'External validation (city council commendation, press coverage, invited to speak at other schools) ' +
        'is harder to fabricate and signals impact that transcended the school community.',
      examples: [
        'Invited by city council to present student mental health findings — informed citywide youth policy',
        'Leadership work featured in local newspaper; model adopted by 2 neighboring high schools',
        'Received Governor\'s Volunteer Service Award for 500+ hours of community organizing',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'recognized', 'awarded', 'featured', 'invited', 'presented at',
        'press', 'newspaper', 'commendation', 'honored', 'adopted by',
      ],
    },
  ],

  nameDropTraps: [
    {
      id: 'lg_title_only',
      pattern: 'Student Body President',
      whyStudentsUseIt:
        'Students believe the title itself is impressive and communicates leadership. They think ' +
        'AOs will be wowed by the position name alone.',
      whyItFails:
        'AOs see "Student Body President" hundreds of times per cycle. The title alone ' +
        'provides zero information about what the student actually did. Uncontested elections, ' +
        'figurehead roles, and do-nothing presidents are common — AOs know this.',
      betterAlternative:
        'Lead with the single most impactful outcome of your presidency. The title can go in the ' +
        'position field; the description must answer "what changed?"',
      example: {
        nameDrop: 'Student Body President. Led meetings and represented students at school board.',
        improved: 'Proposed & passed inclusive dress code policy after surveying 800 students; reduced dress code violations 60%',
        whatChanged:
          'Removed the title (it\'s in the position field), eliminated process words (led meetings), ' +
          'replaced with a specific policy outcome and quantified result.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 24,
      detectionKeywords: [
        'student body president', 'class president', 'student council president',
        'SGA president', 'ASB president',
      ],
    },
    {
      id: 'lg_organized_events',
      pattern: 'Organized events',
      whyStudentsUseIt:
        'Event planning feels like real work (and it is), so students assume listing it communicates effort.',
      whyItFails:
        'AOs read "organized events" as a generic duty. Every club officer organizes events. ' +
        'Without specifics — what event, how many people, what was the purpose, what was the outcome — ' +
        'it communicates nothing distinctive.',
      betterAlternative:
        'Name the specific event, its scale, and its outcome. "Organized school-wide mental health fair, ' +
        '400 attendees, partnered with 3 local counseling agencies" tells a story.',
      example: {
        nameDrop: 'Organized events for student council including pep rallies and fundraisers',
        improved: 'Created first-ever mental health fair — 400 attendees, 3 agency partners, led to permanent wellness room',
        whatChanged:
          'Replaced vague "events" with a specific, first-of-its-kind event. Added scale (400 attendees), ' +
          'partnerships (3 agencies), and lasting outcome (wellness room).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 16,
      detectionKeywords: [
        'organized events', 'planned events', 'coordinated events', 'ran events',
        'hosted events', 'put together events',
      ],
    },
    {
      id: 'lg_led_meetings',
      pattern: 'Led meetings',
      whyStudentsUseIt:
        'Running meetings feels like a tangible leadership action. Students equate meeting facilitation with leadership.',
      whyItFails:
        'Leading meetings is process, not outcome. AOs care about what the meetings produced, not ' +
        'that they happened. Every officer leads meetings — this is the minimum job requirement.',
      betterAlternative:
        'Delete "led meetings" entirely and use those characters for the outcome of what was discussed ' +
        'and decided in those meetings.',
      example: {
        nameDrop: 'Led weekly student government meetings to discuss school issues and plan activities',
        improved: 'Identified & solved 12 student-raised issues/year through structured feedback system with admin',
        whatChanged:
          'Removed the process (meetings) and replaced with the measurable output of those meetings ' +
          '(12 issues solved) plus the system that made it work (structured feedback with admin).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 12,
      detectionKeywords: [
        'led meetings', 'ran meetings', 'facilitated meetings', 'chaired meetings',
        'conducted meetings', 'presided over',
      ],
    },
    {
      id: 'lg_represented_students',
      pattern: 'Represented students',
      whyStudentsUseIt:
        'Representation is the stated purpose of student government, so students cite it as their contribution.',
      whyItFails:
        'Representation without evidence is a job description, not an achievement. AOs need to see HOW ' +
        'the student represented others and what CHANGED as a result. "Represented students" is as ' +
        'meaningful as a CEO saying "ran a company."',
      betterAlternative:
        'Show one specific instance where you amplified student voices and it led to a concrete change.',
      example: {
        nameDrop: 'Represented student body at school board meetings and advocated for student interests',
        improved: 'Presented student petition (600 signatures) to school board; secured $15K for updated science lab equipment',
        whatChanged:
          'Replaced abstract "represented" and "advocated" with concrete action (petition with specific ' +
          'number), specific audience (school board), and quantified result ($15K for equipment).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'represented students', 'student voice', 'advocated for students',
        'spoke on behalf of', 'liaison between',
      ],
    },
    {
      id: 'lg_passed_resolutions',
      pattern: 'Passed resolutions',
      whyStudentsUseIt:
        'Resolutions sound legislative and official. Students believe passing resolutions equals passing laws.',
      whyItFails:
        'In most student governments, resolutions are non-binding — they are suggestions, not policy. ' +
        'AOs know this. A resolution that is not implemented is just a document no one reads. The ' +
        'number of resolutions passed is meaningless without implementation evidence.',
      betterAlternative:
        'Focus on what actually changed as a result of the resolution, not the resolution itself. ' +
        'If nothing changed, that tells you the resolution was not an achievement.',
      example: {
        nameDrop: 'Authored and passed 5 resolutions on topics including sustainability and mental health',
        improved: 'Authored sustainability resolution leading to school-wide composting program, diverting 1.5 tons/year',
        whatChanged:
          'Reduced from 5 vague resolutions to 1 specific one with a real-world outcome. Quantity of ' +
          'documents produced is irrelevant — the tangible environmental impact is what AOs remember.',
      },
      prevalence: 'common',
      typicalCharWaste: 18,
      detectionKeywords: [
        'passed resolution', 'authored resolution', 'proposed resolution',
        'drafted resolution', 'resolutions on',
      ],
    },
    {
      id: 'lg_budget_management',
      pattern: 'Managed budget of $X',
      whyStudentsUseIt:
        'Dollar amounts sound impressive and quantified. Students think AOs will be impressed by the size of the budget.',
      whyItFails:
        'Managing an existing budget is a fiduciary duty, not a creative achievement. Every treasurer ' +
        'manages a budget. AOs want to know what you DID with the money — not that you didn\'t lose it.',
      betterAlternative:
        'Show budget innovation: how you grew it, reallocated it creatively, or used it to solve a problem ' +
        'that the budget wasn\'t originally designed to address.',
      example: {
        nameDrop: 'Managed annual student government budget of $12,000 for events and activities',
        improved: 'Grew student gov budget from $8K to $15K via sponsorship program; funded 4 new student-proposed initiatives',
        whatChanged:
          'Replaced passive management with active growth (grew from $8K to $15K), showed the mechanism ' +
          '(sponsorship program — a new creation), and demonstrated the impact (4 new initiatives).',
      },
      prevalence: 'common',
      typicalCharWaste: 15,
      detectionKeywords: [
        'managed budget', 'oversaw budget', 'budget of', 'allocated funds',
        'responsible for budget', 'treasurer',
      ],
    },
    {
      id: 'lg_vague_advocacy',
      pattern: 'Advocacy without outcomes',
      whyStudentsUseIt:
        'Advocacy is emotionally compelling to students — they feel passionate about causes and assume ' +
        'that passion communicates impact.',
      whyItFails:
        'AOs evaluate advocacy by results, not intentions. "Advocated for equity" without evidence of ' +
        'what changed reads as virtue signaling. AOs have seen too many applications where "advocate" ' +
        'means "posted on social media" or "talked about it in meetings."',
      betterAlternative:
        'Name the specific advocacy action, the audience, and the measurable outcome.',
      example: {
        nameDrop: 'Passionate advocate for diversity, equity, and inclusion in school community',
        improved: 'Led equity audit of 40 school clubs; findings adopted by admin, resulting in new funding criteria ensuring access',
        whatChanged:
          'Removed self-description ("passionate advocate") and abstract concepts ("DEI"). Replaced ' +
          'with a specific action (equity audit), scope (40 clubs), and structural outcome (new funding criteria).',
      },
      prevalence: 'common',
      typicalCharWaste: 22,
      detectionKeywords: [
        'advocated for', 'passionate about', 'committed to', 'dedicated to',
        'champion for', 'voice for', 'fight for',
      ],
    },
    {
      id: 'lg_committee_membership',
      pattern: 'Member of committees',
      whyStudentsUseIt:
        'Committee membership sounds official and involved. Students assume more committees = more leadership.',
      whyItFails:
        'Sitting on a committee is passive. AOs want to know what the committee PRODUCED and what ' +
        'YOUR specific contribution was. Committee membership without outcomes is filling a seat.',
      betterAlternative:
        'Name your specific contribution to the committee and the outcome it produced.',
      example: {
        nameDrop: 'Served on homecoming committee, prom committee, and student activities board',
        improved: 'Chaired prom committee: secured pro-bono DJ, cut costs 40%, redirected savings to fund 50 free tickets for students in need',
        whatChanged:
          'Reduced from 3 committee memberships (passive) to 1 with a leadership role (chaired), ' +
          'creative solution (pro-bono DJ), financial outcome (40% savings), and social impact (50 free tickets).',
      },
      prevalence: 'common',
      typicalCharWaste: 14,
      detectionKeywords: [
        'served on', 'member of committee', 'committee member',
        'part of committee', 'joined committee',
      ],
    },
    {
      id: 'lg_raised_awareness',
      pattern: 'Raised awareness',
      whyStudentsUseIt:
        'Awareness campaigns are common student activities, and students genuinely believe spreading ' +
        'information about an issue constitutes impact.',
      whyItFails:
        'AOs are deeply skeptical of "raised awareness" because it is almost impossible to measure ' +
        'and often means the student made posters or gave a presentation. Awareness without behavioral ' +
        'change is noise.',
      betterAlternative:
        'Show the behavioral change that resulted from the awareness effort.',
      example: {
        nameDrop: 'Raised awareness about food insecurity through school-wide campaigns and social media',
        improved: 'Launched food pantry after survey revealed 15% of students skip meals; now serves 40 families weekly',
        whatChanged:
          'Replaced vague "raised awareness" with a concrete response to the problem (food pantry), ' +
          'evidence of the problem (15% skip meals), and ongoing impact (40 families weekly).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 16,
      detectionKeywords: [
        'raised awareness', 'spread awareness', 'awareness campaign',
        'brought attention to', 'educated peers about',
      ],
    },
    {
      id: 'lg_leadership_skills',
      pattern: 'Developed leadership skills',
      whyStudentsUseIt:
        'Students are taught that college applications should show personal growth, so they describe ' +
        'what they learned rather than what they accomplished.',
      whyItFails:
        'Self-reported skill development is unverifiable and takes up characters that should describe ' +
        'impact. AOs infer skills from outcomes — they don\'t need (or trust) students to self-certify ' +
        'that they "developed skills."',
      betterAlternative:
        'Let the outcome speak for itself. If you built something, led something, or changed something, ' +
        'the leadership skill is self-evident.',
      example: {
        nameDrop: 'Developed leadership, communication, and teamwork skills through student government',
        improved: 'Built 12-person cross-grade team that redesigned school event calendar; attendance up 35% across all events',
        whatChanged:
          'Eliminated self-assessed skills. Replaced with evidence of leadership (built team), ' +
          'communication (cross-grade collaboration), and the measurable result (35% attendance increase).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 30,
      detectionKeywords: [
        'developed skills', 'learned leadership', 'gained experience',
        'honed my skills', 'strengthened my',
      ],
    },
  ],

  proofOfWorkPatterns: [
    {
      id: 'lg_before_after_data',
      pattern: 'Before/after metrics showing measurable change during the student\'s tenure',
      whyItProves:
        'Tracking pre- and post-intervention data requires intentionality and genuine engagement. ' +
        'Only a student who actually drove change would know — and cite — the before and after numbers.',
      examples: [
        'Club membership: 15 when I started → 45 at graduation',
        'Event attendance baseline 200 → 500 after format overhaul',
        'Student gov approval rating 30% (surveyed) → 72% after transparency initiative',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student tracks outcomes, not just activities. They think like someone who will ' +
        'be effective in college leadership because they measure impact.',
    },
    {
      id: 'lg_institutional_memory',
      pattern: 'Creating lasting structures, documents, or systems that survive the student\'s departure',
      whyItProves:
        'Building something that outlasts you requires genuine investment in the institution. ' +
        'Resume-padding leaders optimize for their own application, not for the next generation.',
      examples: [
        'Transition binder now used by all incoming officers',
        'Constitution adopted as official governance document',
        'Feedback system still running 2 years after graduation',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student is a builder, not a user. They invested in something bigger than themselves. ' +
        'This is the kind of person who will contribute to campus culture, not just consume it.',
    },
    {
      id: 'lg_stakeholder_complexity',
      pattern: 'Navigating multiple stakeholder groups with competing interests',
      whyItProves:
        'Real leadership always involves conflict. A student who describes navigating competing ' +
        'interests (students vs admin, clubs vs budget committee) has actually led — not just held a title.',
      examples: [
        'Mediated between athletes wanting more funding and arts groups feeling marginalized',
        'Negotiated compromise between admin\'s safety concerns and students\' open campus request',
        'Built consensus among 4 class councils with different budget priorities',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student understands that leadership means trade-offs. They can handle ambiguity and ' +
        'opposing viewpoints — critical skills for college and beyond.',
    },
    {
      id: 'lg_process_creation',
      pattern: 'Designing new processes or systems from scratch rather than inheriting them',
      whyItProves:
        'Creating new processes requires vision, implementation skill, and buy-in. It\'s fundamentally ' +
        'harder than managing existing ones and is a strong indicator of initiative.',
      examples: [
        'Designed transparent club funding application — replaced opaque first-come-first-served system',
        'Created student government office hours for peer concerns — no precedent existed',
        'Built digital feedback platform replacing suggestion box; 10x more submissions',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student doesn\'t just occupy a role — they transform it. They identified a gap ' +
        'and filled it without being asked.',
    },
    {
      id: 'lg_adversity_navigation',
      pattern: 'Overcoming resistance, failure, or institutional pushback to achieve a goal',
      whyItProves:
        'Real change always meets resistance. A student who describes pushback and how they ' +
        'overcame it has actually tried to change something — most student leaders never face ' +
        'resistance because they never push for anything meaningful.',
      examples: [
        'Proposal rejected twice before building teacher coalition that won admin support',
        'Faced criticism from peers for unpopular budget cuts; maintained transparency throughout',
        'Admin initially blocked student newspaper autonomy; presented precedent from 5 schools to reverse decision',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student has the resilience and political skill to drive change in environments ' +
        'that resist it. This is what real leadership looks like.',
    },
    {
      id: 'lg_specific_numbers',
      pattern: 'Citing specific, verifiable numbers rather than vague quantities',
      whyItProves:
        'Specific numbers (12 clubs, 400 students, $5,200, 35% increase) demonstrate that the student ' +
        'was close enough to the work to know the details. Vague numbers ("many students," "significant increase") ' +
        'suggest the student is embellishing or distant from the actual impact.',
      examples: [
        '12 new clubs approved (vs "many new clubs")',
        '400 students attended (vs "hundreds of students")',
        '$5,200 redirected (vs "thousands of dollars")',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'Specific numbers signal honesty. AOs trust "12" more than "many" because someone who actually ' +
        'did the work knows the exact count.',
    },
    {
      id: 'lg_sustained_commitment',
      pattern: 'Multi-year involvement showing deepening responsibility over time',
      whyItProves:
        'Sustained commitment over 2-4 years with increasing scope proves genuine interest, not ' +
        'resume-driven participation. AOs are trained to spot "sophomore sprint" — joining everything ' +
        'in 10th grade to pad the application.',
      examples: [
        'Member freshman year → committee chair sophomore → VP junior → President senior',
        '3-year student government career with expanding scope each year',
        'Started attending meetings in 9th grade, elected by 11th after 2 years of consistent contribution',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student earned their position through sustained investment, not a last-minute grab ' +
        'for a leadership title.',
    },
    {
      id: 'lg_unprompted_initiative',
      pattern: 'Taking action without being asked, assigned, or required by the role',
      whyItProves:
        'Initiative is the hardest quality to fake. When a student describes doing something that was NOT ' +
        'part of their job description, it signals intrinsic motivation and genuine care.',
      examples: [
        'Created student mental health survey on own initiative after classmate\'s crisis',
        'Started food drive after noticing students skipping lunch — no teacher asked me to',
        'Wrote op-ed in school paper about lack of student input in scheduling decisions',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student sees problems and acts. They don\'t wait for permission or assignment. ' +
        'This is exactly the type of student who will make an impact on a college campus.',
    },
  ],

  descriptionTransforms: [
    {
      id: 'lg_transform_title_to_impact',
      transformType: 'name_drop_to_impact',
      before: 'Student Body President leading school government',
      after: 'Passed inclusive dress code policy after 3 hearings; created mental health committee now serving 200+ students',
      explanation:
        'Titles belong in the position field, not the description. Every character in the description must ' +
        'communicate what you DID, not what you were CALLED.',
      charsBefore: 48,
      charsAfter: 99,
      principle: 'Title in position field, impact in description',
    },
    {
      id: 'lg_transform_meetings_to_outcomes',
      transformType: 'duty_to_achievement',
      before: 'Led weekly meetings and organized school events for student body',
      after: 'Redesigned event format based on student survey; attendance increased 45% across 8 annual events',
      explanation:
        'Meetings and organizing are job duties. The transformation replaces the process with the outcome ' +
        'of that process, including the evidence (survey) and the result (45% increase).',
      charsBefore: 60,
      charsAfter: 89,
      principle: 'Outcomes over process',
    },
    {
      id: 'lg_transform_vague_advocacy',
      transformType: 'claim_to_evidence',
      before: 'Passionate advocate for equity and inclusion in our school community',
      after: 'Led equity audit of 40 clubs; findings drove new funding model ensuring access for low-income students',
      explanation:
        'Self-described passion is unverifiable. The transformation replaces the claim with the evidence: ' +
        'a specific action (audit), scope (40 clubs), and structural outcome (new funding model).',
      charsBefore: 64,
      charsAfter: 95,
      principle: 'Show, don\'t tell — evidence over self-description',
    },
    {
      id: 'lg_transform_generic_to_specific',
      transformType: 'generic_to_specific',
      before: 'Worked to improve school spirit and student engagement',
      after: 'Launched Friday community circles in 12 homerooms; student belonging survey scores up 28%',
      explanation:
        'School spirit and engagement are abstract concepts. The transformation grounds them in a specific ' +
        'program (community circles), scale (12 homerooms), and measured outcome (28% increase).',
      charsBefore: 54,
      charsAfter: 88,
      principle: 'Abstract concepts must be grounded in specific, measurable actions',
    },
    {
      id: 'lg_transform_passive_voice',
      transformType: 'passive_to_active',
      before: 'Was involved in creating new programs for underclassmen engagement',
      after: 'Created freshman advisory council with voting student gov rep — first in school history',
      explanation:
        'Passive voice ("was involved in") hides the student\'s actual role. Active voice with a specific ' +
        'outcome shows ownership and gives AOs a clear picture of what the student built.',
      charsBefore: 63,
      charsAfter: 82,
      principle: 'Active voice proves ownership; passive voice hides contribution',
    },
    {
      id: 'lg_transform_list_to_narrative',
      transformType: 'generic_to_specific',
      before: 'Organized pep rallies, fundraisers, dances, and community service projects',
      after: 'Created first-ever community service fair pairing 15 local nonprofits with 300 student volunteers',
      explanation:
        'Lists of activities dilute each item to insignificance. The transformation picks the single most ' +
        'impactful item and gives it the full character budget — creating a memorable narrative.',
      charsBefore: 70,
      charsAfter: 90,
      principle: 'One story told well beats five stories told poorly',
    },
    {
      id: 'lg_transform_budget_stewardship',
      transformType: 'duty_to_achievement',
      before: 'Managed annual student government budget of $10,000',
      after: 'Grew budget from $6K to $14K through corporate sponsorship program; funded 5 new student initiatives',
      explanation:
        'Budget management is a duty. Budget growth through innovation is an achievement. The transformation ' +
        'shows the delta, the mechanism, and the impact of the additional funds.',
      charsBefore: 51,
      charsAfter: 93,
      principle: 'Stewardship is expected; innovation is impressive',
    },
    {
      id: 'lg_transform_skills_to_evidence',
      transformType: 'claim_to_evidence',
      before: 'Developed strong leadership and public speaking skills through my role',
      after: 'Presented student safety proposal to 200-person school board audience; 3 of 4 measures adopted',
      explanation:
        'Self-reported skill development is unverifiable. The transformation provides evidence of leadership ' +
        '(proposal) and public speaking (200-person audience) through a concrete outcome (measures adopted).',
      charsBefore: 64,
      charsAfter: 92,
      principle: 'Let outcomes demonstrate skills — never self-certify',
    },
    {
      id: 'lg_transform_awareness_to_action',
      transformType: 'claim_to_evidence',
      before: 'Raised awareness about food insecurity among students at our school',
      after: 'Launched school food pantry serving 40 families/week after survey found 15% of students skip meals',
      explanation:
        'Awareness is a prerequisite, not an outcome. The transformation shows the full arc: problem discovery ' +
        '(survey), action taken (food pantry), and ongoing impact (40 families/week).',
      charsBefore: 60,
      charsAfter: 91,
      principle: 'Awareness is the beginning, not the achievement',
    },
    {
      id: 'lg_transform_jargon_removal',
      transformType: 'jargon_to_outcome',
      before: 'Implemented Robert\'s Rules of Order to improve parliamentary procedure in meetings',
      after: 'Restructured meeting format — cut session time 40%, increased actionable decisions per meeting 3x',
      explanation:
        'Robert\'s Rules is process jargon. AOs don\'t care about the methodology — they care about ' +
        'whether meetings became more effective. The transformation shows the outcome of better process.',
      charsBefore: 74,
      charsAfter: 91,
      principle: 'Process methodology is jargon — the results of better process are impact',
    },
  ],

  verbHierarchy: [
    {
      tier: 'power',
      verbs: [
        'founded', 'established', 'reformed', 'secured', 'negotiated',
        'restructured', 'launched', 'transformed', 'mobilized', 'championed',
      ],
      context:
        'In leadership contexts, power verbs signal creation and systemic change. These verbs imply ' +
        'the student built something new or fundamentally altered how things work.',
      exampleUsage: 'Founded peer mediation program reducing disciplinary referrals 30%',
    },
    {
      tier: 'standard',
      verbs: [
        'led', 'organized', 'coordinated', 'managed', 'directed',
        'facilitated', 'oversaw', 'chaired', 'planned', 'implemented',
      ],
      context:
        'Standard verbs describe competent execution of leadership duties. They are not weak, but ' +
        'they don\'t signal initiative or creation. Pair them with strong outcomes.',
      exampleUsage: 'Led committee that designed new club funding process',
    },
    {
      tier: 'weak',
      verbs: [
        'helped', 'assisted', 'participated in', 'was involved in', 'contributed to',
        'supported', 'attended', 'served on', 'was part of', 'worked with',
      ],
      context:
        'Weak verbs actively undermine leadership claims. "Helped organize" suggests someone else ' +
        'led. "Participated in" suggests passive attendance. These verbs should be eliminated entirely ' +
        'from leadership descriptions.',
      exampleUsage: 'Avoid: "Helped organize events and participated in planning meetings"',
    },
  ],

  roleExpertise: [
    {
      role: 'Student Body President / Student Government President',
      expectedSignals: [
        'Agenda-setting: specific priorities pursued during tenure',
        'Communication between student body and administration',
        'Event oversight and organizational management',
        'Team leadership: managing officers and committees',
      ],
      differentiators: [
        'Policy change: a specific rule, process, or program that was created or reformed',
        'Crisis leadership: how they handled an unexpected challenge',
        'External engagement: presenting to school board, engaging community partners',
        'Structural innovation: creating new systems or programs from scratch',
        'Legacy building: changes that persist after their tenure ends',
      ],
      overclaimingRisks: [
        'Claiming credit for decisions made by administrators',
        'Inflating the power of student government resolutions (which are usually non-binding)',
        'Describing school-wide changes as personal achievements when they were group efforts',
        'Overstating budget authority when actual spending decisions required admin approval',
      ],
      authenticPatterns: [
        'Specific priorities: "Ran on mental health platform, delivered counseling expansion and wellness room"',
        'Honest scope: "Proposed X, which was adopted by admin with modifications"',
        'Team credit: "Led 8-person executive board that redesigned event programming"',
        'Measurable results: "Student satisfaction up 25% in annual survey during my term"',
      ],
    },
    {
      role: 'Club President / Organization Leader',
      expectedSignals: [
        'Membership management and growth',
        'Event/meeting planning and execution',
        'Goal-setting for the organization',
        'Basic financial oversight (if applicable)',
      ],
      differentiators: [
        'Growing the club significantly (doubling membership, starting new chapters)',
        'Launching external-facing initiatives (competitions, community partnerships, publications)',
        'Founding a new club from scratch with sustained membership',
        'Achieving recognition or results that distinguish the club regionally/nationally',
      ],
      overclaimingRisks: [
        'Claiming to have "founded" a club that already existed',
        'Inflating membership numbers or participation counts',
        'Describing routine meetings as "leadership development sessions"',
        'Taking sole credit for group projects or collaborative achievements',
      ],
      authenticPatterns: [
        'Growth narrative: "Grew debate club from 8 to 35 members over 2 years"',
        'External impact: "Organized first interschool debate tournament, 6 schools participated"',
        'Innovation: "Introduced peer coaching model — 80% of new members improved in competition rankings"',
        'Honest scope: "Managed 20-person club, organized biweekly meetings and 3 annual events"',
      ],
    },
    {
      role: 'Class Officer (Treasurer / Secretary / VP)',
      expectedSignals: [
        'Fulfillment of specific role duties (financial tracking, minutes, event support)',
        'Collaborative work within an officer team',
        'Supporting the president\'s agenda while contributing own ideas',
      ],
      differentiators: [
        'Taking initiative beyond the role: "As treasurer, identified wasteful spending patterns and proposed reallocation"',
        'Process improvement: "Digitized financial records, creating transparency dashboard accessible to all students"',
        'Cross-functional contribution: "Though elected secretary, co-led diversity initiative that president hadn\'t prioritized"',
      ],
      overclaimingRisks: [
        'Describing routine duties as if they were innovations',
        'Inflating the role to sound like the president',
        'Claiming "leadership" when the role was primarily administrative',
      ],
      authenticPatterns: [
        'Initiative within role: "As treasurer, created first-ever public budget report — increased funding request approvals 50%"',
        'Honest scope: "Managed $4K annual budget, introduced line-item tracking that saved $800/year"',
        'Collaborative language: "Worked with president to restructure..."',
      ],
    },
    {
      role: 'Activist / Community Organizer',
      expectedSignals: [
        'Specific cause with specific actions taken',
        'Community engagement with real people affected',
        'Persistent effort over time (not a one-day event)',
        'Understanding of the political/social landscape',
      ],
      differentiators: [
        'Policy impact: advocacy that actually changed a rule, law, or institutional practice',
        'Coalition building: uniting diverse groups behind a shared cause',
        'Sustained organizing: building an organization or movement that persists',
        'Media engagement: op-eds, press coverage, public testimony',
        'Scale beyond school: impact reaching community, city, or state level',
      ],
      overclaimingRisks: [
        'Equating social media activism with real-world organizing',
        'Claiming outcomes caused by many actors as personal achievements',
        'Describing one-time protests or walkouts as "organizing"',
        'Using dramatic language ("fighting for justice") without evidence of impact',
      ],
      authenticPatterns: [
        'Specific and measured: "Organized 200-person rally that preceded city council vote on affordable housing"',
        'Process detail: "Collected 1,500 signatures, presented petition, policy changed within 3 months"',
        'Honest attribution: "Part of coalition that successfully lobbied for..."',
        'Sustained arc: "Organized for 18 months: research → petition → testimony → policy adoption"',
      ],
    },
  ],

  jargonExceptions: [
    {
      pattern: 'Robert\'s Rules of Order as a governance achievement',
      whyItsTheException:
        'If the student INTRODUCED formal parliamentary procedure to a previously chaotic organization ' +
        'and can show the outcome (faster meetings, more decisions), the methodology itself is the innovation.',
      example:
        'Introduced Robert\'s Rules to student senate — meeting length cut 40%, decision rate doubled. ' +
        'Here, the specific methodology IS the contribution because the organization lacked any formal process before.',
    },
    {
      pattern: 'Specific legislation or policy names',
      whyItsTheException:
        'If the student worked on actual legislation (city council ordinance, state bill), naming the ' +
        'specific policy IS the achievement because it\'s verifiable and shows real political engagement.',
      example:
        'Testified for HB-1234 (youth mental health funding); bill passed with $2M allocation. ' +
        'The bill number is verifiable proof of real legislative engagement, not name-dropping.',
    },
    {
      pattern: 'Election-specific metrics and platforms',
      whyItsTheException:
        'In political leadership, election data (vote percentage, turnout, platform specifics) IS the evidence ' +
        'of legitimacy and mandate. These are not vanity metrics but proof of genuine democratic support.',
      example:
        'Won 4-way race with 62% — highest turnout (78%) in school history after campaigning on transparency platform. ' +
        'The election numbers prove the student earned their position through genuine engagement.',
    },
    {
      pattern: 'Named awards or recognitions from external bodies',
      whyItsTheException:
        'External recognition (Governor\'s Award, NASSP Rylander Award, Congressional Award) adds third-party ' +
        'validation that an AO can independently verify. Unlike self-described impact, these are credentialed.',
      example:
        'Received Congressional Award Gold Medal for 400+ hours of community organizing and leadership. ' +
        'The specific award name is meaningful because it represents an externally validated standard.',
    },
  ],
};
