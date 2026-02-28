/**
 * Academic Expertise Domain
 *
 * Covers: Academic clubs (Math Club, Science Bowl, History Bowl, Debate),
 * honor societies (NHS, Mu Alpha Theta, Science National Honor Society),
 * academic programs (IB, dual enrollment), study groups, peer tutoring,
 * academic competitions (Academic Decathlon, Quiz Bowl, MATHCOUNTS).
 *
 * Key AO insight: Academic activities face a unique credibility problem.
 * Many are passive memberships (NHS requires GPA, not effort). AOs need to
 * see WHAT the student contributed beyond showing up. The bar is: did you
 * teach, compete, create, or build something — or did you just qualify?
 *
 * Critical distinction: GPA-based honors (Honor Roll, AP Scholar, NHS
 * membership alone) are GRADES, not ACTIVITIES. They belong in the academic
 * section, not the activity list — unless the student did something ACTIVE
 * within the organization.
 *
 * The most impactful academic activities involve TEACHING others, which AOs
 * value because it demonstrates both mastery and service orientation.
 *
 * Sources: NACAC admissions surveys, AO blog posts from MIT/Stanford/UChicago,
 * Sara Harberson, IEC best practices, competition organization data.
 */

import type { ExpertiseDomain } from '../types';

export const ACADEMIC_DOMAIN: ExpertiseDomain = {
  domainId: 'academic',
  label: 'Academic Activities',
  overview:
    'Academic clubs, honor societies, competitions, peer tutoring, and academic programs. ' +
    'The central challenge is distinguishing ACTIVE intellectual engagement from PASSIVE ' +
    'credential collection. AOs are deeply skeptical of activities that are really just GPA ' +
    'thresholds repackaged as extracurriculars. The differentiator is always: what did the ' +
    'student DO that goes beyond qualifying?',

  aoExpectations: {
    whatRegisters: [
      'Competition results with context: not just "placed," but event, field size, individual vs team performance',
      'Teaching and mentoring: peer tutoring with measurable student outcomes (grades improved, students served)',
      'Program creation: building something new (tutoring center, study resource, inter-school league) from scratch',
      'Intellectual initiative: independent research, self-directed projects, course creation proposals',
      'Depth over breadth: sustained commitment to one intellectual area rather than membership in 5 honor societies',
      'Cross-school or community impact: academic engagement that reaches beyond the student\'s own school',
    ],
    whatAOsSeeThrough: [
      'NHS membership alone: AOs know this is a GPA threshold, not an activity — what did you DO in NHS?',
      'Club membership lists: "Member of Math Club, Science Club, History Club" without contributions',
      'Honor Roll / Dean\'s List: these are grades, not activities — listing them wastes character space',
      'AP Scholar designation: a testing achievement that belongs in the test score section, not activities',
      'Generic tutoring: "Tutored peers in math" without structure, scale, or outcomes',
      'Competition name-dropping without results: "Participated in Science Olympiad" without events or placement',
    ],
    goldenQuestion:
      'What did this student BUILD, TEACH, or DISCOVER that goes beyond simply being smart enough to qualify?',
    readingTimeContext:
      'AOs spend less time on academic activities they perceive as passive (NHS, Honor Roll). ' +
      'Active academic activities (founded tutoring program, competition results) get more attention. ' +
      'The first few words must signal "this is active, not passive" to earn a careful read.',
    competitiveContext:
      'At selective schools, nearly every applicant has strong academics. Academic ACTIVITIES compete ' +
      'with applicants who won national competitions, published research, or built educational programs. ' +
      'Passive membership in honor societies provides zero differentiation at the top tier.',
  },

  realExpertiseSignals: [
    {
      id: 'ac_competition_results_context',
      pattern: 'competition_results',
      description: 'Specific competition results with event details, field size, and individual performance',
      whyItWorks:
        'Competition results are objective and verifiable. But AOs need context — "3rd place" means ' +
        'nothing without knowing it was out of 500 teams or at the state level. Providing field size, ' +
        'level (regional/state/national), and individual events shows the student is fluent in the ' +
        'competitive landscape, not just name-dropping.',
      examples: [
        'Academic Decathlon state champion — 9,200-point individual score, 1st in math and econ out of 120 competitors',
        'Quiz Bowl: captain of team ranking #3 in state (64-team field), individual 4th at nationals',
        'MATHCOUNTS state finalist, top 4 out of 800+ participants — qualified for national competition',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'champion', 'finalist', 'placed', 'ranked', 'out of', 'field of',
        'qualifier', 'nationals', 'state', 'regional', 'individual score',
      ],
    },
    {
      id: 'ac_tutoring_outcomes',
      pattern: 'teaching_impact',
      description: 'Peer tutoring or teaching with measurable student outcomes',
      whyItWorks:
        'Teaching is the highest form of mastery — you cannot effectively teach what you don\'t deeply ' +
        'understand. AOs value tutoring because it combines intellectual ability with service orientation. ' +
        'Measurable outcomes (grades improved, pass rates increased) prove the teaching was effective.',
      examples: [
        'Founded peer tutoring center serving 30 students weekly; tutees\' average math grade improved 1.2 letter grades',
        'Tutored 15 students in AP Chemistry — 13 scored 4+ on exam (school average: 2.8)',
        'Created study group for struggling Algebra 2 students; group\'s pass rate rose from 60% to 92%',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'tutored', 'taught', 'mentored', 'students served', 'grade improved',
        'pass rate', 'score increase', 'study group', 'weekly sessions',
      ],
    },
    {
      id: 'ac_program_creation',
      pattern: 'program_creation',
      description: 'Building a new academic program, resource, or initiative from scratch',
      whyItWorks:
        'Creating something new is fundamentally harder than joining something existing. AOs recognize ' +
        'that starting a tutoring program, organizing a new competition, or building a study resource ' +
        'requires initiative, organizational skill, and genuine intellectual passion.',
      examples: [
        'Started peer tutoring center — recruited 10 tutors, served 30 students/week, adopted by school permanently',
        'Organized inter-school quiz bowl league connecting 8 schools, 200 students across the district',
        'Developed AP Calculus study guide (120 pages) now used by 3 classes and distributed to incoming students',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'founded', 'started', 'created', 'launched', 'built', 'organized',
        'established', 'developed', 'designed', 'first-ever', 'new program',
      ],
    },
    {
      id: 'ac_subject_mastery_demonstration',
      pattern: 'subject_mastery',
      description: 'Demonstrating deep knowledge through publication, presentation, or original work',
      whyItWorks:
        'Original intellectual work — a published article, a research presentation, a course proposal — ' +
        'proves depth that test scores cannot. AOs value students who push beyond the curriculum because ' +
        'this is exactly what they will do in college.',
      examples: [
        'Published article on applications of number theory in school literary/academic magazine',
        'Presented original research on local watershed chemistry at regional science symposium',
        'Proposed and co-designed new elective course in computational thinking, now offered to 60 students',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'published', 'presented', 'research', 'original', 'authored',
        'paper', 'article', 'symposium', 'conference', 'independent study',
      ],
    },
    {
      id: 'ac_nhs_active_contribution',
      pattern: 'active_honor_society',
      description: 'Specific, active contribution within an honor society beyond membership',
      whyItWorks:
        'NHS membership is a GPA threshold — it is NOT an activity by itself. But active contributions ' +
        'WITHIN NHS (organizing tutoring, leading service projects, creating programs) transform it from ' +
        'a credential into genuine engagement. AOs need to see the action, not just the letters.',
      examples: [
        'NHS chapter VP — organized 200-hour school-wide tutoring initiative, matching 50 tutor-student pairs',
        'Led NHS service project building 3 Little Free Libraries in food-desert neighborhoods',
        'As NHS president, restructured induction process to include mentorship component for new members',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'organized', 'led', 'created', 'restructured', 'within NHS',
        'chapter', 'NHS project', 'service initiative', 'tutoring program',
      ],
    },
    {
      id: 'ac_cross_school_impact',
      pattern: 'cross_school_impact',
      description: 'Academic engagement that reaches beyond the student\'s own school',
      whyItWorks:
        'Impact beyond one\'s own school signals ambition, organizational complexity, and a vision that ' +
        'transcends personal benefit. Organizing inter-school events, creating shared resources, or ' +
        'teaching at other schools are rare and impressive.',
      examples: [
        'Organized inter-school quiz bowl league — 8 schools, 200 students, 6-month season with playoffs',
        'Created open-source AP study resources used by 500+ students across 12 schools in district',
        'Invited to guest-teach math enrichment at 3 elementary schools, reaching 90 students',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'inter-school', 'district-wide', 'multiple schools', 'other schools',
        'open-source', 'shared resource', 'cross-school', 'community-wide',
      ],
    },
    {
      id: 'ac_dual_enrollment_depth',
      pattern: 'dual_enrollment_depth',
      description: 'Dual enrollment or independent study that shows intellectual curiosity beyond the curriculum',
      whyItWorks:
        'Taking college courses while in high school demonstrates initiative, but the context matters. ' +
        'AOs want to know the rigor (what courses, where), what the student GAINED beyond a transcript ' +
        'line, and whether the student applied the knowledge in a meaningful way.',
      examples: [
        'Completed 4 dual-enrollment courses at community college (linear algebra, differential equations) while working 15 hrs/week',
        'Took university-level organic chemistry through dual enrollment; applied knowledge to design independent lab project',
        'Dual enrollment in college philosophy courses inspired student-run ethics discussion series at school, 20 regular attendees',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'dual enrollment', 'college courses', 'university course', 'community college',
        'independent study', 'beyond curriculum', 'advanced coursework',
      ],
    },
    {
      id: 'ac_resource_creation',
      pattern: 'resource_creation',
      description: 'Creating study materials, guides, or tools that help other students',
      whyItWorks:
        'Creating resources requires deep understanding, organizational skill, and generosity. AOs ' +
        'value this because it shows the student uses their knowledge to serve others — a trait that ' +
        'translates directly to college community contribution.',
      examples: [
        'Wrote 120-page AP Calculus study guide — adopted by 3 classes, contributed to 15% score increase',
        'Created YouTube channel with 40 chemistry explanation videos; 5,000+ views, used by students at 4 schools',
        'Built practice problem database with 500 questions for math competition prep; team performance improved 30%',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'impact',
      detectionKeywords: [
        'study guide', 'created resource', 'wrote guide', 'built database',
        'practice problems', 'video tutorials', 'educational resource', 'shared materials',
      ],
    },
    {
      id: 'ac_team_captain_leadership',
      pattern: 'team_captain_leadership',
      description: 'Captain or leader of academic competition team with team development evidence',
      whyItWorks:
        'Captaining an academic team requires both subject expertise and people skills. AOs value ' +
        'evidence of how the student improved team performance — not just that they held the title.',
      examples: [
        'Captain of Science Olympiad team; implemented structured practice schedule, team advanced from regionals to state for first time in 5 years',
        'Quiz Bowl captain: recruited and trained 8 new members, team ranking improved from 15th to 3rd in league',
        'Math Team co-captain; created tiered practice system by skill level, team qualified for nationals for first time',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'impact',
      detectionKeywords: [
        'captain', 'team leader', 'recruited', 'trained', 'team advanced',
        'team ranking', 'team performance', 'practice schedule', 'team improved',
      ],
    },
    {
      id: 'ac_independent_scholarship',
      pattern: 'independent_scholarship',
      description: 'Self-directed intellectual pursuit outside of class requirements',
      whyItWorks:
        'Independent scholarship — reading primary sources, pursuing questions beyond the syllabus, ' +
        'conducting original analysis — is the strongest signal of genuine intellectual curiosity. ' +
        'AOs at selective schools prize this above test scores because it predicts college success.',
      examples: [
        'Self-studied 3 additional math topics (topology, group theory, combinatorics) beyond school curriculum',
        'Read 30+ primary source documents on Civil War economics for independent research paper submitted to school journal',
        'Conducted original statistical analysis of local election patterns; presented findings to AP Government classes',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'self-studied', 'independent research', 'self-directed', 'beyond curriculum',
        'primary sources', 'original analysis', 'independent project', 'self-taught',
      ],
    },
    {
      id: 'ac_competition_progression',
      pattern: 'competition_progression',
      description: 'Multi-year improvement arc in academic competitions',
      whyItWorks:
        'Showing progression (didn\'t place freshman year, regional finalist sophomore year, state ' +
        'qualifier junior year, national competitor senior year) demonstrates persistence and growth. ' +
        'AOs value the arc more than a single result because it shows character.',
      examples: [
        'AMC 10: scored 90 as freshman → 120 as junior → AIME qualifier as senior (top 5% nationally)',
        'Science Olympiad: no medals year 1 → 3 regional golds year 2 → state champion in 2 events year 3',
        'History Bowl: team alternated year 1 → starting player year 2 → team captain year 3, state finalists',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'progressed', 'improved', 'year 1', 'year 2', 'advanced from',
        'qualifier', 'as freshman', 'as senior', 'progression', 'growth',
      ],
    },
    {
      id: 'ac_accessibility_initiative',
      pattern: 'accessibility_initiative',
      description: 'Making academic opportunities accessible to underserved students',
      whyItWorks:
        'Using intellectual ability to create access for others is one of the most valued academic ' +
        'activities. AOs at top schools specifically look for evidence that academic talent is paired ' +
        'with social awareness and service.',
      examples: [
        'Created free SAT prep program for first-gen students — 80 students served, average score increase 120 pts',
        'Translated math competition materials into Spanish for ESL students; 15 new participants joined',
        'Organized "AP for All" info sessions for underclassmen from non-AP-track backgrounds; 25 enrolled in AP courses',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'free', 'underserved', 'first-gen', 'access', 'low-income',
        'ESL', 'accessible', 'for all', 'no cost', 'scholarship',
      ],
    },
  ],

  nameDropTraps: [
    {
      id: 'ac_nhs_member_only',
      pattern: 'NHS member',
      whyStudentsUseIt:
        'NHS feels like a credential — students believe the name carries weight because it requires ' +
        'a GPA threshold and teacher recommendations. They assume AOs will be impressed by the affiliation.',
      whyItFails:
        'AOs know NHS is a GPA threshold. At selective schools, EVERY applicant qualifies for NHS. ' +
        'Listing "NHS member" with no further description is effectively listing your GPA twice — ' +
        'once in grades and once in activities. It wastes an entire activity slot.',
      betterAlternative:
        'Describe what you DID in NHS, not that you\'re a member. If you did nothing beyond attending ' +
        'meetings, consider using this activity slot for something more active.',
      example: {
        nameDrop: 'Member of National Honor Society. Attended meetings and participated in service events.',
        improved: 'Led NHS tutoring initiative: matched 50 tutor-student pairs, tutees\' avg grades improved 1 full letter',
        whatChanged:
          'Removed passive membership claim and generic participation. Replaced with a specific leadership ' +
          'role within NHS, a quantified program (50 pairs), and a measurable outcome (1 letter grade improvement).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 35,
      detectionKeywords: [
        'NHS member', 'National Honor Society member', 'member of NHS',
        'inducted into NHS', 'NHS inductee',
      ],
    },
    {
      id: 'ac_club_member_generic',
      pattern: 'Club member without role or contribution',
      whyStudentsUseIt:
        'Students believe that listing many club memberships demonstrates well-roundedness. They ' +
        'think quantity of affiliations signals breadth of interest.',
      whyItFails:
        'AOs see club membership lists as filler. Without a specific role or contribution, membership ' +
        'suggests passive attendance. Three club memberships with no details are less impressive than ' +
        'one club with deep involvement.',
      betterAlternative:
        'Pick the club where you contributed most. Describe your specific role and what you achieved ' +
        'or built within the club.',
      example: {
        nameDrop: 'Member of Math Club, Science Club, and History Club. Attended weekly meetings.',
        improved: 'Math Club: created competition prep curriculum, coached 12 new members → team advanced to state for first time',
        whatChanged:
          'Reduced from 3 passive memberships to 1 active contribution. Added specific actions (created curriculum, ' +
          'coached members) and a team-level outcome (advanced to state).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 25,
      detectionKeywords: [
        'member of', 'club member', 'attended meetings', 'joined',
        'participated in club', 'active member',
      ],
    },
    {
      id: 'ac_competition_name_only',
      pattern: 'Competition name without results',
      whyStudentsUseIt:
        'Students think competition names (Academic Decathlon, Science Olympiad, Quiz Bowl) sound ' +
        'impressive on their own. They assume AOs will infer strong performance from participation.',
      whyItFails:
        'AOs need results, not participation. "Science Olympiad" tells them you showed up. Without ' +
        'event results, individual scores, or team placement, the competition name is just a label. ' +
        'AOs cannot distinguish between someone who placed nationally and someone who attended.',
      betterAlternative:
        'Always include: specific event(s), placement/score, and competitive context (field size, level).',
      example: {
        nameDrop: 'Participated in Academic Decathlon and competed at regional and state levels',
        improved: 'Academic Decathlon: 1st place interview, 2nd overall individual (state), 9,100 pts out of 10,000',
        whatChanged:
          'Replaced vague "participated" and "competed at levels" with specific events (interview), ' +
          'specific placement (1st, 2nd), specific level (state), and a score (9,100/10,000) that AOs can contextualize.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'participated in', 'competed in', 'member of team',
        'represented school at', 'attended competition',
      ],
    },
    {
      id: 'ac_honor_roll',
      pattern: 'Honor Roll / Dean\'s List',
      whyStudentsUseIt:
        'Students view academic honors as achievements worthy of the activity section. They want to ' +
        'highlight their academic performance as many ways as possible.',
      whyItFails:
        'Honor Roll is a GPA threshold — it is NOT an activity. It provides zero information beyond ' +
        'what\'s already visible in the transcript. Using an activity slot for Honor Roll wastes one ' +
        'of only 10 activity entries on redundant information.',
      betterAlternative:
        'Your GPA already communicates this. Use this activity slot for something that shows what you ' +
        'DID with your knowledge, not just that you have it.',
      example: {
        nameDrop: 'Honor Roll student for all 4 years of high school. Dean\'s List every semester.',
        improved: '[Do not list this as an activity — use the slot for an actual extracurricular]',
        whatChanged:
          'Honor Roll and Dean\'s List are GPA achievements visible in the transcript. Listing them as ' +
          'activities wastes a precious activity slot that could describe genuine engagement.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 60,
      detectionKeywords: [
        'honor roll', 'dean\'s list', 'honors student', 'high honors',
        'principal\'s list', 'academic honors',
      ],
    },
    {
      id: 'ac_ap_scholar',
      pattern: 'AP Scholar',
      whyStudentsUseIt:
        'AP Scholar designations (Scholar, Scholar with Honors, Scholar with Distinction) feel like awards ' +
        'because College Board calls them awards. Students want to list every credential.',
      whyItFails:
        'AP Scholar is a test-score-based designation, not an activity. AOs see AP scores in the testing ' +
        'section. Listing AP Scholar as an activity is like listing your SAT score as an extracurricular.',
      betterAlternative:
        'AP scores belong in the testing section. If AP courses shaped your intellectual development, ' +
        'describe what you DID with the knowledge — research, tutoring, projects.',
      example: {
        nameDrop: 'AP Scholar with Distinction. Scored 5 on 8 AP exams across multiple subjects.',
        improved: '[List AP scores in testing section. Use activity slot for what you BUILT with this knowledge]',
        whatChanged:
          'AP Scholar is a testing achievement, not an extracurricular activity. The activity section should ' +
          'show what the student DID, not what they scored.',
      },
      prevalence: 'common',
      typicalCharWaste: 50,
      detectionKeywords: [
        'AP Scholar', 'AP scores', 'scored 5 on', 'AP exams',
        'AP with Distinction', 'AP with Honors',
      ],
    },
    {
      id: 'ac_generic_tutoring',
      pattern: 'Tutored peers in subject',
      whyStudentsUseIt:
        'Tutoring feels like a natural activity for academically strong students. It combines ' +
        'intellectual ability with helping others, which students know AOs value.',
      whyItFails:
        'Without structure, scale, or outcomes, "tutored peers" is unverifiable and vague. AOs cannot ' +
        'distinguish between a student who casually helped a friend before a test and one who ran a ' +
        'structured program serving 30 students weekly.',
      betterAlternative:
        'Specify the structure (formal program vs informal), scale (how many students, how often), ' +
        'and outcomes (grades improved, exam pass rates, students served).',
      example: {
        nameDrop: 'Tutored peers in math and science after school to help them improve their grades',
        improved: 'Ran weekly AP Calc tutoring (15 students/session); 87% of tutees scored 4+ vs 45% school average',
        whatChanged:
          'Added structure (weekly sessions), scale (15 students), subject specificity (AP Calc), ' +
          'and a measurable outcome with context (87% scored 4+ vs 45% school average).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 12,
      detectionKeywords: [
        'tutored peers', 'helped classmates', 'tutored students',
        'study help', 'helped with homework', 'academic support',
      ],
    },
    {
      id: 'ac_multiple_honor_societies',
      pattern: 'Multiple honor society memberships listed',
      whyStudentsUseIt:
        'Students believe that listing many honor societies (NHS, Mu Alpha Theta, Science NHS, ' +
        'Spanish NHS, etc.) demonstrates both academic breadth and achievement.',
      whyItFails:
        'Multiple honor societies are all GPA-based memberships in different subject wrappers. ' +
        'Listing 4 honor societies takes up 4 of 10 activity slots with what AOs see as the same ' +
        'credential repeated. It signals padding, not depth.',
      betterAlternative:
        'Pick the one honor society where you were most active. Describe your contribution there. ' +
        'Use the other slots for genuinely distinct activities.',
      example: {
        nameDrop: 'Member of NHS, Mu Alpha Theta, Science National Honor Society, and Spanish Honor Society',
        improved: 'Mu Alpha Theta VP: created math mentoring program pairing 20 upperclassmen with struggling freshmen',
        whatChanged:
          'Consolidated 4 passive memberships into 1 active role. Replaced credential-listing with ' +
          'a specific program (math mentoring), scale (20 pairs), and purpose (supporting freshmen).',
      },
      prevalence: 'common',
      typicalCharWaste: 40,
      detectionKeywords: [
        'member of NHS', 'Mu Alpha Theta', 'Science NHS', 'SNHS',
        'honor society member', 'inducted into',
      ],
    },
    {
      id: 'ac_study_group_leader',
      pattern: 'Study group leader',
      whyStudentsUseIt:
        'Students who organize study sessions feel they are demonstrating both academic skill and ' +
        'leadership. Study groups feel organized and purposeful.',
      whyItFails:
        'Informal study groups are common and expected among high-achieving students. Without ' +
        'structure (regular schedule, curriculum, materials) and outcomes (measurable improvement), ' +
        'leading a study group sounds like "studied with friends."',
      betterAlternative:
        'If the study group was truly structured, formalize the description: regular schedule, ' +
        'number of participants, materials created, and measurable outcomes.',
      example: {
        nameDrop: 'Led study group for AP History class to prepare for exams together',
        improved: 'Organized 12-student AP History review series (8 sessions); created 200+ flashcards, group avg score: 4.2',
        whatChanged:
          'Replaced vague "study group" with structured program (review series, 8 sessions), ' +
          'specific materials (200+ flashcards), and measurable outcome (average score 4.2).',
      },
      prevalence: 'common',
      typicalCharWaste: 10,
      detectionKeywords: [
        'study group', 'review sessions', 'exam prep group',
        'studied together', 'group study',
      ],
    },
    {
      id: 'ac_vague_competition_participation',
      pattern: 'Generic competition participation',
      whyStudentsUseIt:
        'Students think academic competition participation signals intellectual engagement. They list ' +
        'competitions they attended without emphasizing individual results.',
      whyItFails:
        'Participation in competitions is expected of academic club members. AOs need placement, ' +
        'score, or event specifics to evaluate the student\'s individual performance. "Competed in ' +
        'Science Olympiad" does not tell AOs whether the student placed 1st or last.',
      betterAlternative:
        'Lead with your best individual result. Include placement, level, and field size.',
      example: {
        nameDrop: 'Participated in Science Olympiad, Quiz Bowl, and Math League competitions',
        improved: 'Science Olympiad: gold in Forensics + silver in Chemistry Lab at state (120 teams); Quiz Bowl: top 10 individual scorer in league',
        whatChanged:
          'Replaced generic "participated" with specific events (Forensics, Chemistry Lab), metals/placement, ' +
          'level (state), field size (120 teams), and individual distinction (top 10 scorer).',
      },
      prevalence: 'common',
      typicalCharWaste: 18,
      detectionKeywords: [
        'participated in competition', 'competed in', 'went to competition',
        'attended tournament', 'took part in',
      ],
    },
    {
      id: 'ac_intellectual_curiosity_claim',
      pattern: 'Self-described intellectual curiosity',
      whyStudentsUseIt:
        'Students are told that colleges value intellectual curiosity, so they explicitly claim to have it. ' +
        'They write about being "passionate about learning" instead of showing it through actions.',
      whyItFails:
        'Self-described character traits are unverifiable and take up characters that could describe ' +
        'evidence. AOs infer intellectual curiosity from what students DO — not what they claim to feel.',
      betterAlternative:
        'Show intellectual curiosity through actions: independent projects, self-directed learning, ' +
        'questions pursued beyond the syllabus.',
      example: {
        nameDrop: 'Intellectually curious student passionate about learning across multiple disciplines',
        improved: 'Self-studied topology and group theory; presented findings on symmetry in nature to math department faculty',
        whatChanged:
          'Replaced self-description with evidence: specific subjects self-studied (topology, group theory), ' +
          'an action taken with the knowledge (presentation), and an audience (math department faculty).',
      },
      prevalence: 'common',
      typicalCharWaste: 28,
      detectionKeywords: [
        'intellectually curious', 'passionate about learning', 'love of learning',
        'eager to learn', 'thirst for knowledge', 'academic passion',
      ],
    },
  ],

  proofOfWorkPatterns: [
    {
      id: 'ac_specific_event_results',
      pattern: 'Naming specific competition events and individual performance within them',
      whyItProves:
        'Only students who actually competed know their specific events, individual scores, and how ' +
        'they performed relative to the field. A student who says "Science Olympiad — gold in Forensics, ' +
        '3rd in Chemistry Lab" was there. One who says "competed in Science Olympiad" might not have placed.',
      examples: [
        'Science Olympiad: gold in Disease Detectives, silver in Anatomy & Physiology, 5th in Experimental Design',
        'Academic Decathlon: 1st in interview (940/1000), 2nd in economics, 3rd overall individual',
        'MATHCOUNTS: Sprint Round 28/30, Target Round 8/8, state finalist',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student knows the structure of the competition intimately. The specificity of events and ' +
        'scores cannot be fabricated without deep familiarity.',
    },
    {
      id: 'ac_materials_created',
      pattern: 'Describing specific educational materials created (guides, problem sets, curricula)',
      whyItProves:
        'Creating educational materials requires deep understanding of the subject and the audience. ' +
        'Citing page counts, problem quantities, or adoption rates proves the student invested real time ' +
        'and thought — not just showed up.',
      examples: [
        '120-page AP Calculus review guide with worked solutions for all major topic areas',
        '500-problem practice database organized by difficulty and topic for math competition prep',
        '40 video tutorials covering all AP Chemistry labs, 5,000+ total views',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student is a creator, not just a consumer of education. The specificity of the materials ' +
        '(page count, problem count, video count) signals real effort.',
    },
    {
      id: 'ac_tutee_outcomes',
      pattern: 'Tracking measurable outcomes for students tutored',
      whyItProves:
        'Only someone who genuinely tutored others would track their outcomes. Reporting that "87% of ' +
        'tutees scored 4+ on the AP exam" requires knowing who was tutored, following their results, ' +
        'and caring enough to measure the impact.',
      examples: [
        'Tutees\' average math grade improved from C+ to B+ over one semester',
        '13 of 15 students I tutored scored 4+ on AP Chemistry exam (school avg: 2.8)',
        'Study group members\' quiz scores improved 22% on average within 6 weeks',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student measures their impact on others. They treat tutoring as a serious commitment, ' +
        'not a casual favor — the kind of person who will contribute to college study communities.',
    },
    {
      id: 'ac_progression_trajectory',
      pattern: 'Showing multi-year improvement in competition or academic depth',
      whyItProves:
        'A progression arc (beginner → intermediate → advanced) across multiple years proves sustained ' +
        'commitment and genuine growth. Resume-padders typically show one year of participation.',
      examples: [
        'AMC 10: scored 78 (freshman) → 102 (sophomore) → 126 (junior) → AIME qualifier (senior)',
        'Quiz Bowl: team alternate (year 1) → starter (year 2) → captain (year 3), team to nationals',
        'Math Club: member → problem writer → team captain → founded inter-school league',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student has genuine long-term intellectual commitment. The progression cannot be faked — ' +
        'it shows real development over years.',
    },
    {
      id: 'ac_organizational_infrastructure',
      pattern: 'Building organizational infrastructure for academic activities',
      whyItProves:
        'Creating schedules, practice plans, recruitment processes, and administrative systems for ' +
        'academic activities requires real organizational skill. Only someone deeply involved would ' +
        'describe these structures.',
      examples: [
        'Designed tiered practice schedule: fundamentals Mon, competition prep Wed, mock tournaments Fri',
        'Created recruitment pipeline: demo days for freshmen, tryout process, mentorship matching',
        'Built shared problem database with difficulty ratings, topic tags, and solution discussion threads',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student understands that excellence requires systems. They built infrastructure that ' +
        'supports not just their own development but their entire team\'s.',
    },
    {
      id: 'ac_teaching_methodology',
      pattern: 'Describing specific teaching or tutoring methods used',
      whyItProves:
        'A student who describes HOW they taught (Socratic questioning, worked examples, ' +
        'error analysis) has thought carefully about pedagogy. Generic "tutored students" lacks ' +
        'this methodological depth.',
      examples: [
        'Used error analysis approach: students corrected their own wrong answers with guided prompts',
        'Developed scaffolded problem sets that built from foundational skills to competition-level difficulty',
        'Created peer review process where tutees taught concepts back to verify understanding',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student doesn\'t just know the subject — they understand how to transfer knowledge. ' +
        'This level of pedagogical thinking is unusual and impressive for a high school student.',
    },
    {
      id: 'ac_intellectual_depth_marker',
      pattern: 'References to specific concepts, theorems, or intellectual frameworks',
      whyItProves:
        'Naming specific intellectual content (not as name-dropping but as proof of depth) shows ' +
        'the student engaged at a level beyond the standard curriculum. "Studied topology" is more ' +
        'specific than "did extra math."',
      examples: [
        'Independent study in graph theory: applied Ramsey theory to analyze social network structures',
        'Explored Bayesian statistics for science fair project on predicting local weather patterns',
        'Research on game theory applications in school resource allocation — presented to econ class',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student has genuine intellectual depth. The specific conceptual references show engagement ' +
        'with college-level ideas — exactly the kind of student who will thrive in a university setting.',
    },
    {
      id: 'ac_community_building',
      pattern: 'Creating academic community beyond individual achievement',
      whyItProves:
        'Building academic communities (tutoring centers, study groups, inter-school leagues) shows ' +
        'the student values collective intellectual growth, not just personal achievement. This is rare ' +
        'and highly valued.',
      examples: [
        'Founded school\'s first math circle — 25 regular attendees exploring recreational mathematics',
        'Created online study community connecting AP students across 8 schools for resource sharing',
        'Organized monthly "academic game nights" — 40 students playing math/logic games; sparked 10 new club members',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student makes others smarter, not just themselves. They build communities around learning — ' +
        'exactly what colleges want on their campuses.',
    },
  ],

  descriptionTransforms: [
    {
      id: 'ac_transform_nhs_passive_to_active',
      transformType: 'passive_to_active',
      before: 'National Honor Society member. Participated in community service events.',
      after: 'Led NHS tutoring initiative: 50 tutor-student pairs, tutees\' grades improved avg 1 letter grade',
      explanation:
        'NHS membership is a GPA credential. The transformation replaces passive membership with ' +
        'active leadership, a specific program, quantified scale, and measurable outcomes.',
      charsBefore: 66,
      charsAfter: 87,
      principle: 'Membership is a credential; contribution is an activity',
    },
    {
      id: 'ac_transform_competition_vague_to_specific',
      transformType: 'generic_to_specific',
      before: 'Competed in Science Olympiad at regional and state competitions',
      after: 'Science Olympiad: gold in Forensics + silver in Chem Lab at state (120 teams), team captain',
      explanation:
        'Removed vague "competed at levels" and replaced with specific events, specific medals, ' +
        'field size context, and role on the team.',
      charsBefore: 58,
      charsAfter: 88,
      principle: 'Results with context, not participation claims',
    },
    {
      id: 'ac_transform_club_member_to_contributor',
      transformType: 'passive_to_active',
      before: 'Active member of Math Club for 3 years. Attended weekly meetings.',
      after: 'Math Club: created competition prep curriculum, coached 12 new members; team advanced to state first time in 5 yrs',
      explanation:
        'Replaced passive membership and attendance with specific contributions (curriculum, coaching) ' +
        'and a team-level outcome (first state qualification in 5 years).',
      charsBefore: 58,
      charsAfter: 103,
      principle: 'What you BUILT in the club matters, not how long you sat in it',
    },
    {
      id: 'ac_transform_tutoring_vague_to_structured',
      transformType: 'generic_to_specific',
      before: 'Tutored classmates in math and science to help them prepare for tests',
      after: 'Ran weekly AP Calc tutoring (15 students/session); 87% scored 4+ vs 45% school avg',
      explanation:
        'Added structure (weekly, specific subject), scale (15 students), and a compelling comparison ' +
        'statistic (87% vs 45%) that demonstrates the tutoring was genuinely effective.',
      charsBefore: 62,
      charsAfter: 78,
      principle: 'Structure + scale + outcomes transform informal help into a program',
    },
    {
      id: 'ac_transform_honor_societies_to_depth',
      transformType: 'name_drop_to_impact',
      before: 'Member of NHS, Mu Alpha Theta, Science NHS, and Spanish Honor Society',
      after: 'Mu Alpha Theta VP: started math mentoring program pairing 20 upperclassmen with struggling freshmen',
      explanation:
        'Consolidated 4 passive memberships into 1 active role with a specific program and scale. ' +
        'One deep contribution outweighs four shallow memberships.',
      charsBefore: 63,
      charsAfter: 89,
      principle: 'Depth in one society beats breadth across four',
    },
    {
      id: 'ac_transform_ap_scholar_to_application',
      transformType: 'name_drop_to_impact',
      before: 'AP Scholar with Distinction. Excelled in AP courses across multiple subjects.',
      after: 'Applied AP Statistics knowledge to analyze school lunch nutrition data; findings led to 3 menu changes',
      explanation:
        'Replaced test-score credential with evidence of applying knowledge to solve a real problem. ' +
        'AOs see AP scores in the testing section — the activity section should show what the student DID.',
      charsBefore: 66,
      charsAfter: 95,
      principle: 'Knowledge applied is an activity; knowledge tested is a score',
    },
    {
      id: 'ac_transform_study_group_to_program',
      transformType: 'generic_to_specific',
      before: 'Led a study group for AP History to prepare for the exam together',
      after: 'Created 8-session AP History review series (12 students); authored 200 flashcards, group avg: 4.2',
      explanation:
        'Transformed informal study group into a structured program with session count, participant ' +
        'number, specific materials created, and a measurable group outcome.',
      charsBefore: 59,
      charsAfter: 91,
      principle: 'Structure and specificity transform casual help into a program',
    },
    {
      id: 'ac_transform_curiosity_claim_to_evidence',
      transformType: 'claim_to_evidence',
      before: 'Passionate about mathematics and always eager to learn new concepts beyond school',
      after: 'Self-studied group theory and topology; presented original research on symmetry patterns to math faculty',
      explanation:
        'Replaced self-described passion with specific evidence: named subjects (group theory, topology), ' +
        'an action (presented research), and an audience (math faculty).',
      charsBefore: 72,
      charsAfter: 95,
      principle: 'Show curiosity through action, not self-description',
    },
    {
      id: 'ac_transform_dual_enrollment_to_application',
      transformType: 'duty_to_achievement',
      before: 'Took dual enrollment college courses at the local community college for advanced credits',
      after: 'Dual-enrolled in university organic chemistry; designed independent lab project on water quality testing',
      explanation:
        'Replaced credit accumulation (a resume item) with intellectual initiative (independent project). ' +
        'AOs want to know what the student did with the advanced access, not just that they had it.',
      charsBefore: 74,
      charsAfter: 96,
      principle: 'Advanced access is an opportunity; what you did with it is the achievement',
    },
    {
      id: 'ac_transform_skill_claim_to_outcome',
      transformType: 'claim_to_evidence',
      before: 'Developed strong analytical and critical thinking skills through academic competitions',
      after: 'Academic Decathlon state champion: 1st in economics, 2nd overall individual out of 120 competitors',
      explanation:
        'Self-reported skill development is unverifiable. Competition results are objective evidence of ' +
        'analytical ability — and they take up fewer characters while communicating more.',
      charsBefore: 72,
      charsAfter: 91,
      principle: 'Results prove skills; self-assessment does not',
    },
    {
      id: 'ac_transform_awards_list_to_narrative',
      transformType: 'generic_to_specific',
      before: 'Won multiple awards in science competitions and academic decathlon events',
      after: 'Science Olympiad: 3 golds at state (Forensics, Anatomy, Chemistry Lab); team finished 2nd out of 120',
      explanation:
        'Replaced vague "multiple awards" with specific events, specific medals, and team context. ' +
        'AOs cannot evaluate "multiple awards" but CAN evaluate "3 golds at state."',
      charsBefore: 65,
      charsAfter: 93,
      principle: 'Specific results are always more powerful than aggregate claims',
    },
  ],

  verbHierarchy: [
    {
      tier: 'power',
      verbs: [
        'founded', 'created', 'designed', 'pioneered', 'authored',
        'discovered', 'published', 'coached', 'mastered', 'built',
      ],
      context:
        'In academic contexts, power verbs signal intellectual creation and initiative. These verbs ' +
        'imply the student produced original work or built something that didn\'t exist before. ' +
        '"Authored" and "published" carry particular weight in academic activities.',
      exampleUsage: 'Authored 120-page AP Calculus study guide adopted by 3 classes',
    },
    {
      tier: 'standard',
      verbs: [
        'competed', 'tutored', 'studied', 'organized', 'led',
        'presented', 'analyzed', 'researched', 'taught', 'coordinated',
      ],
      context:
        'Standard academic verbs describe competent engagement. They are appropriate when paired with ' +
        'specific outcomes. "Competed" needs results; "studied" needs depth; "tutored" needs outcomes.',
      exampleUsage: 'Competed in Science Olympiad state finals, placing 3rd in Forensics',
    },
    {
      tier: 'weak',
      verbs: [
        'participated', 'attended', 'was member of', 'joined', 'took part in',
        'was involved in', 'helped with', 'assisted in', 'contributed to', 'learned about',
      ],
      context:
        'Weak verbs in academic contexts signal passive engagement. "Participated" and "attended" ' +
        'suggest the student showed up but did not contribute. "Was member of" is the weakest possible ' +
        'framing — it describes a status, not an action.',
      exampleUsage: 'Avoid: "Participated in Math Club meetings and attended competitions"',
    },
  ],

  roleExpertise: [
    {
      role: 'Academic Competition Team Captain',
      expectedSignals: [
        'Team organization: practice schedules, event assignments, skill development plans',
        'Recruitment of new members and onboarding',
        'Competition logistics: registration, travel coordination, strategy',
        'Individual competitive results demonstrating personal competence',
      ],
      differentiators: [
        'Team-level achievement: improving team ranking, qualifying for higher competition levels',
        'Training innovation: creating practice curricula, organizing mock competitions',
        'Mentoring: developing less experienced members into strong competitors',
        'Culture building: creating a team environment that attracts and retains members',
        'Cross-school engagement: organizing invitational tournaments or inter-school practice',
      ],
      overclaimingRisks: [
        'Claiming team results as solely personal achievement',
        'Inflating team ranking or misrepresenting competition field size',
        'Describing coaching duties when the team has an actual adult coach',
        'Conflating captain title with the reason for team success',
      ],
      authenticPatterns: [
        'Team growth: "Recruited 8 new members, implemented tiered practice → team advanced to state first time"',
        'Individual + team: "Individual 3rd at state; as captain, created practice system that improved team avg score 25%"',
        'Honest scope: "Co-captain with faculty advisor overseeing strategy and practice"',
      ],
    },
    {
      role: 'Peer Tutor / Tutoring Program Leader',
      expectedSignals: [
        'Subject expertise demonstrated through test scores or course grades',
        'Regular tutoring schedule with consistent students',
        'Basic understanding of how to help others learn',
        'Patience and communication skills with struggling students',
      ],
      differentiators: [
        'Program creation: founding a tutoring center, organized system, or structured initiative',
        'Measurable outcomes: tracking tutee grades, test scores, or pass rates',
        'Material creation: study guides, problem sets, review resources',
        'Scale: serving many students consistently, not just occasional help',
        'Targeting underserved populations: first-gen, ESL, or economically disadvantaged students',
      ],
      overclaimingRisks: [
        'Calling informal homework help a "tutoring program"',
        'Claiming credit for a student\'s improvement that was primarily due to the teacher',
        'Overstating hours or frequency of tutoring sessions',
        'Describing paid tutoring as volunteer service',
      ],
      authenticPatterns: [
        'Structured program: "Weekly sessions, 15 students, tracked outcomes — avg grade improvement 1 letter"',
        'Materials created: "Wrote 50-page study guide used by 3 classes for AP exam prep"',
        'Honest framing: "Volunteered 3 hrs/week tutoring Algebra 2 students; 10 of 12 passed final exam"',
      ],
    },
    {
      role: 'Honor Society Officer',
      expectedSignals: [
        'Organizing service projects or academic events for the chapter',
        'Managing membership: induction, requirements tracking',
        'Coordinating between members and faculty advisor',
        'Basic administrative duties of the specific officer role',
      ],
      differentiators: [
        'Program innovation: creating new initiatives that go beyond the national template',
        'Cross-chapter impact: connecting with other schools\' chapters for joint events',
        'Service leadership: designing impactful community service rather than one-off volunteer hours',
        'Cultural change: making the honor society meaningful rather than a resume line',
      ],
      overclaimingRisks: [
        'Implying the officer role is more substantive than it is (many NHS chapters are largely inactive)',
        'Claiming credit for programs mandated by the national organization',
        'Describing the induction ceremony as a personal achievement',
        'Listing NHS membership as if it demonstrates something beyond GPA',
      ],
      authenticPatterns: [
        'Initiative beyond template: "Created tutoring initiative beyond NHS requirements — 50 pairs matched"',
        'Honest about scope: "Organized 4 service events (200+ volunteer hours) and redesigned member engagement"',
        'Program building: "Revitalized inactive chapter — grew participation from 10% to 80% of members in active service"',
      ],
    },
    {
      role: 'Academic Club Founder',
      expectedSignals: [
        'Identified a gap: why the club didn\'t exist and why it should',
        'Navigated school bureaucracy: advisor, approval, funding',
        'Recruited initial members and built momentum',
        'Sustained the club beyond the initial excitement period',
      ],
      differentiators: [
        'Growth trajectory: starting from zero and building to significant membership',
        'External engagement: competitions, partnerships, community outreach',
        'Institutional adoption: the club becoming a permanent part of school culture',
        'Succession planning: ensuring the club survives the founder\'s graduation',
        'Impact metrics: what the club achieved that wouldn\'t have happened otherwise',
      ],
      overclaimingRisks: [
        'Claiming to have "founded" a club that was revived from a previous version',
        'Inflating membership numbers (counting students who came once vs regular attendees)',
        'Describing a single-semester effort as founding an enduring organization',
        'Taking sole credit when founding required significant help from advisor or co-founders',
      ],
      authenticPatterns: [
        'Full arc: "Founded math circle (0 → 25 members in 2 years), now a permanent school club with faculty support"',
        'Honest founding: "Co-founded with advisor support; recruited initial 8 members, grew to 30 through demo events"',
        'Lasting impact: "Founded quiz bowl team — competed in first season, qualified for regionals by season 3"',
      ],
    },
    {
      role: 'Dual Enrollment / Independent Study Student',
      expectedSignals: [
        'College-level coursework beyond high school curriculum',
        'Time management: balancing college courses with high school demands',
        'Intellectual initiative: seeking out advanced material',
      ],
      differentiators: [
        'Application of knowledge: using college coursework to create something (research, projects, teaching)',
        'Inspiring others: helping classmates access dual enrollment or sharing knowledge gained',
        'Rigor context: taking genuinely challenging courses, not just easy-A community college classes',
        'Bridging knowledge: connecting college-level learning to high school community benefit',
      ],
      overclaimingRisks: [
        'Presenting dual enrollment as more rigorous than it was (some courses are high-school equivalent)',
        'Listing courses taken as if they are activities (course-taking is academic, not extracurricular)',
        'Implying self-direction when the program was required or strongly encouraged by the school',
      ],
      authenticPatterns: [
        'Knowledge application: "Dual-enrolled in university organic chem; designed independent water quality lab project"',
        'Community impact: "Shared dual enrollment experience at info session — 15 classmates enrolled the following semester"',
        'Honest context: "Completed 4 college math courses while working 15 hrs/week — applied to independent research project"',
      ],
    },
  ],

  jargonExceptions: [
    {
      pattern: 'Specific competition event names and scoring systems',
      whyItsTheException:
        'In academic competitions, event names (Forensics, Disease Detectives, Sprint Round) and ' +
        'scoring systems (9,200 out of 10,000 in Academic Decathlon) ARE the achievement. They provide ' +
        'verifiable specificity that AOs can look up. The jargon IS the proof.',
      example:
        'Academic Decathlon: 9,200/10,000 points, 1st in Interview and Economics at state. ' +
        'The specific events and score format are not name-dropping — they are the standard ' +
        'measurement system that validates the achievement.',
    },
    {
      pattern: 'AMC/AIME/USAMO qualification thresholds',
      whyItsTheException:
        'Math competition qualifications (AMC → AIME → USAMO) form a widely recognized progression. ' +
        'Saying "AIME qualifier" communicates top 5% nationally to anyone familiar with math competitions, ' +
        'and AOs at selective schools ARE familiar. The acronym IS the achievement level.',
      example:
        'AIME qualifier with score of 9/15; AMC 12 score of 126. These abbreviations are standard ' +
        'in the math competition world, and AOs at math-heavy schools recognize them immediately.',
    },
    {
      pattern: 'Published work with specific venue names',
      whyItsTheException:
        'Naming the publication venue (school journal, regional science symposium, Scholastic Art & ' +
        'Writing Awards) provides verifiable proof of external validation. The venue name IS evidence ' +
        'that someone outside the student\'s immediate circle evaluated and accepted their work.',
      example:
        'Published in Concord Review (national high school history journal, <5% acceptance rate). ' +
        'The journal name is not name-dropping — it IS the achievement because the acceptance rate ' +
        'demonstrates the quality of the work.',
    },
    {
      pattern: 'Specific mathematical/scientific concepts in research context',
      whyItsTheException:
        'When a student conducted genuine research, naming the specific concept (Bayesian inference, ' +
        'graph theory, Fourier analysis) proves they engaged at a level beyond the curriculum. ' +
        'In research descriptions, the concept name IS evidence of depth.',
      example:
        'Applied Ramsey theory to analyze social network clustering — presented at regional math symposium. ' +
        'The specific theorem name proves the student engaged with advanced mathematics, not just ' +
        '"did math research."',
    },
    {
      pattern: 'Standardized test prep program methodology names',
      whyItsTheException:
        'When a student created a test prep program, citing specific methodology (scaffolded problem sets, ' +
        'spaced repetition, error analysis) demonstrates pedagogical sophistication that distinguishes ' +
        'their program from casual tutoring.',
      example:
        'Designed SAT prep program using spaced repetition and error-pattern analysis; students\' avg score ' +
        'increased 120 points. The methodology names prove the student applied learning science, not ' +
        'just "helped with test prep."',
    },
  ],
};
