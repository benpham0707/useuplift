/**
 * STEM Competitions Expertise Domain
 *
 * Covers math olympiads (AMC/AIME/USAMO), CS competitions (USACO),
 * physics competitions (USAPhO), biology olympiads (USABO), Science
 * Olympiad, science fairs (ISEF/Regeneron), chemistry olympiads, and
 * hackathons.
 *
 * Key insight: STEM competitions have the most transparent hierarchy
 * of any activity category. AOs at selective schools know exactly what
 * AIME qualification means vs. AMC participation. Vague competition
 * descriptions are immediately suspicious — why would you hide your
 * score if it was good?
 *
 * Sources: MIT admissions blog (competition context), Art of Problem
 * Solving community norms, USACO division statistics, Science Olympiad
 * invitational guides, ISEF finalist profiles, NACAC survey on
 * competition weighting.
 */

import type { ExpertiseDomain } from '../types';

export const STEM_COMPETITIONS_DOMAIN: ExpertiseDomain = {
  domainId: 'stem_competitions',
  label: 'STEM Competitions',
  overview:
    'Math olympiads, CS competitions, physics/bio/chem olympiads, Science Olympiad, ' +
    'science fairs, and hackathons. Competitions are unique because they have explicit, ' +
    'verifiable achievement tiers. AOs know the hierarchy. Vagueness is always suspicious — ' +
    'students who performed well always share their results. Students who did not perform well ' +
    'hide behind participation language.',

  aoExpectations: {
    whatRegisters: [
      'Specific results with national/international context: "AIME score 12" is meaningful; "qualified for AIME" is less so but still strong',
      'Progressive achievement over time: "Bronze to Platinum in 18 months" shows dedication and growth trajectory',
      'Teaching and mentoring as a result of achievement: training teammates shows mastery AND leadership',
      'Problem-solving approach descriptions: HOW you think about hard problems reveals more than which contests you entered',
      'Creating or organizing competitions: founding a math circle or organizing a hackathon demonstrates initiative beyond personal achievement',
    ],
    whatAOsSeeThrough: [
      'Competition names without results — "participated in AMC" signals a low score (millions take the AMC)',
      'Listing many competitions without excelling in any — breadth without depth reads as resume padding',
      'Hackathon participation without describing what was built or what problem was solved',
      '"Competitive programmer" without a rating, division, or specific achievement',
      'Science Olympiad participation without specifying events or individual contributions',
      'Inflating team achievements as personal ones in team-based competitions',
    ],
    goldenQuestion:
      'Where does this student fall in the national talent distribution for their field, ' +
      'and what does their competition trajectory tell me about their intellectual drive?',
    readingTimeContext:
      'AOs process competition results in 3-5 seconds because the hierarchy is well-known. ' +
      'USAMO qualifier, Regeneron finalist, USACO Platinum — these are instant signals. ' +
      'But "participated in Science Olympiad" requires the AO to guess at the level, ' +
      'which they will assume is low. If you earned it, SHOW it.',
    competitiveContext:
      'At MIT/Caltech, 50%+ of applicants have serious competition experience. ' +
      'At Ivies, ~20-30% do. The differentiator is not that you competed — it is ' +
      'HOW WELL you performed and WHAT YOU DID with that ability (teaching, creating, ' +
      'applying it to real problems). A USAMO qualifier who also mentors underrepresented ' +
      'students is far more compelling than a USAMO qualifier who only competed.',
  },

  realExpertiseSignals: [
    {
      id: 'sc_specific_results',
      pattern: 'quantified_achievement',
      description:
        'Student provides specific competition results with percentile or rank context, ' +
        'not just participation or qualification.',
      whyItWorks:
        'Competitions have publicly known hierarchies. "AIME score 12" is instantly ' +
        'meaningful to an AO who reads 100+ apps with AMC/AIME results. It communicates ' +
        'more in 3 words than a paragraph of vague claims. Students who earned strong ' +
        'results always share them — omission implies weakness.',
      examples: [
        'AIME score 12, top 500 nationally; USAMO qualifier (scored 14/42)',
        'USACO Platinum division — solved 2/3 problems at December contest',
        'USAPhO semifinalist, top 400 nationally — invited to training camp selection test',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'score', 'rank', 'top', 'nationally', 'percentile', 'qualifier',
        'semifinalist', 'finalist', 'division', 'placed', 'medal',
        'gold', 'silver', 'bronze', 'cutoff',
      ],
    },
    {
      id: 'sc_progressive_achievement',
      pattern: 'growth_trajectory',
      description:
        'Student describes progression through competition levels over time, showing ' +
        'sustained effort and improvement rather than a single snapshot.',
      whyItWorks:
        'Progression tells a story of dedication. "Bronze to Platinum in 18 months" ' +
        'communicates hours of practice, self-directed learning, and perseverance. ' +
        'AOs value the trajectory more than the endpoint — a student who grew from ' +
        'nothing to strong is often more impressive than one who was always talented.',
      examples: [
        'USACO progression: Bronze (9th grade) → Silver → Gold → Platinum (11th grade)',
        'AMC 8 DHR → AMC 10 qualified AIME → USAMO qualifier over 3 years',
        'Science Olympiad: 0 medals freshman year → 5 event medals + team captain by senior year',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'progressed', 'advanced', 'improved', 'grew', 'promoted',
        'from', 'to', 'over', 'months', 'years', 'journey',
        'bronze', 'silver', 'gold', 'platinum',
      ],
    },
    {
      id: 'sc_teaching_from_mastery',
      pattern: 'expertise_sharing',
      description:
        'Student leverages competition knowledge to teach, mentor, or create resources ' +
        'for other students — demonstrating mastery through teaching.',
      whyItWorks:
        'Teaching competition material is the strongest proof of mastery. ' +
        'You cannot explain Olympiad-level number theory or advanced algorithms ' +
        'without deep understanding. AOs read this as mastery + character + leadership — ' +
        'triple signal from one activity.',
      examples: [
        'Founded math circle for underserved middle schoolers — 4 students qualified for state MathCounts from my program',
        'Wrote 50+ original competition problems used in our school\'s practice sets',
        'Trained 15 Science Olympiad teammates; team advanced to state for first time in 8 years',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'taught', 'trained', 'mentored', 'coached', 'founded',
        'created problems', 'wrote problems', 'led practice', 'tutored',
        'math circle', 'club', 'team', 'prepared',
      ],
    },
    {
      id: 'sc_problem_approach',
      pattern: 'problem_solving_insight',
      description:
        'Student describes their approach to solving hard problems — specific strategies, ' +
        'techniques, or insights that reveal how they think.',
      whyItWorks:
        'Competition math/CS/physics is not just about getting the right answer — it is ' +
        'about HOW you think. A student who can articulate their problem-solving methodology ' +
        '("I approach geometry problems by looking for invariants") demonstrates metacognition ' +
        'that AOs associate with research potential.',
      examples: [
        'Developed systematic approach to combinatorics problems using generating functions — increased solve rate 40%',
        'Specialized in graph theory algorithms; created visualization tool that helped me solve 3 USACO Platinum problems',
        'Focused on proof-based problems after USAMO; shifted from computation to creative reasoning',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'approach', 'strategy', 'technique', 'method', 'insight',
        'systematic', 'specialized', 'focused on', 'developed',
        'solved', 'proof', 'algorithm', 'invariant',
      ],
    },
    {
      id: 'sc_creating_competitions',
      pattern: 'competition_creation',
      description:
        'Student creates, organizes, or directs competitions, hackathons, or math ' +
        'circles rather than just competing.',
      whyItWorks:
        'Creating a competition requires understanding the field deeply enough to write ' +
        'problems, logistical ability to organize events, and initiative that goes beyond ' +
        'self-interest. AOs see this as the evolution from consumer to producer, which ' +
        'mirrors what colleges want students to become.',
      examples: [
        'Founded regional math tournament — 200+ participants from 30 schools in Year 2',
        'Organized school\'s first hackathon; 12 teams, 3 industry judges, winning project deployed to local nonprofit',
        'Created online competitive programming contest series — 500+ unique participants from 15 countries',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'founded', 'organized', 'created', 'directed', 'launched',
        'tournament', 'competition', 'hackathon', 'olympiad', 'contest',
        'participants', 'teams', 'schools',
      ],
    },
    {
      id: 'sc_event_specialization',
      pattern: 'deep_event_expertise',
      description:
        'In team competitions (Science Olympiad, robotics), student shows deep expertise ' +
        'in specific events rather than vague team participation.',
      whyItWorks:
        'Science Olympiad has 23 events spanning build, test, and inquiry categories. ' +
        'A student who names their 3 events and describes specific preparation shows genuine ' +
        'involvement. "Science Olympiad member" could mean showing up to one meeting. ' +
        '"Built experimental flyer that placed 2nd at states" proves deep engagement.',
      examples: [
        'Specialized in 3 build events: Helicopter, Mousetrap Vehicle, Wright Stuff — all 3 medaled at states',
        'Captain of astronomy event team — wrote 200-page study guide used by 5 schools',
        'Designed and built compound machine for Science Olympiad; scored 298/300 at invitational',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'event', 'events', 'build', 'test', 'trial', 'device',
        'machine', 'designed', 'built', 'study guide', 'captain',
        'helicopter', 'forensics', 'anatomy', 'astronomy',
      ],
    },
    {
      id: 'sc_original_problems',
      pattern: 'problem_authorship',
      description:
        'Student has written original competition problems, contributed to problem sets, ' +
        'or created training materials.',
      whyItWorks:
        'Writing good competition problems is significantly harder than solving them. ' +
        'It requires understanding the field deeply enough to construct problems with ' +
        'elegant solutions, appropriate difficulty, and pedagogical value. AOs who recognize ' +
        'this know it signals mastery beyond just being fast at solving.',
      examples: [
        'Authored 30+ original problems for school math team — 5 selected for state practice exam',
        'Problem setter for online math competition; problems solved by 2,000+ students',
        'Created USACO-style training problems organized by technique — 100+ problems across all divisions',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'wrote problems', 'authored', 'created problems', 'problem setter',
        'problem writer', 'original problems', 'designed problems',
        'contributed problems', 'practice exam',
      ],
    },
    {
      id: 'sc_cross_application',
      pattern: 'competition_to_real_world',
      description:
        'Student applies competition skills to real-world problems, research, or projects — ' +
        'showing that competition knowledge transfers beyond the contest hall.',
      whyItWorks:
        'AOs sometimes worry that competition students are "only good at contests." ' +
        'A student who uses their mathematical modeling skills for a research project, or their ' +
        'algorithms knowledge to build something useful, addresses this concern head-on and ' +
        'demonstrates intellectual maturity.',
      examples: [
        'Applied competition graph theory to optimize school bus routes — saved district $12K/year in fuel',
        'Used olympiad combinatorics to prove new bound in faculty member\'s open problem',
        'Competition algorithm skills enabled me to build real-time wildfire spread model for county emergency services',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'applied', 'used', 'enabled', 'transferred', 'real-world',
        'research', 'project', 'built', 'solved', 'practical',
        'community', 'optimize', 'model',
      ],
    },
    {
      id: 'sc_national_international',
      pattern: 'elite_tier_recognition',
      description:
        'Student achieved at the national or international level in a well-known competition — ' +
        'USAMO, IMO, IOI, ISEF, Regeneron STS, national Science Olympiad.',
      whyItWorks:
        'National and international recognition is unambiguous. These achievements are ' +
        'instantly legible to every AO and represent the top fraction of a percent of ' +
        'students. Simply naming the achievement is sufficient — "USAMO qualifier" or ' +
        '"ISEF finalist" needs no elaboration.',
      examples: [
        'USAMO qualifier — one of ~250 students nationally',
        'International Physics Olympiad — Bronze medal representing USA',
        'Regeneron ISEF Grand Award — 1st place, Environmental Engineering category',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'USAMO', 'IMO', 'IOI', 'ISEF', 'Regeneron', 'STS',
        'national', 'international', 'olympiad', 'team USA',
        'representing', 'qualifier', 'finalist', 'grand award',
      ],
    },
    {
      id: 'sc_self_study_discipline',
      pattern: 'independent_preparation',
      description:
        'Student describes self-directed preparation — studying beyond school curriculum, ' +
        'using specific resources, maintaining a consistent practice schedule.',
      whyItWorks:
        'Competition preparation is almost entirely self-directed for most students. ' +
        'Schools rarely teach olympiad-level math or USACO algorithms. A student who describes ' +
        'studying "Introduction to Algorithms" independently or "solving 500 USACO problems ' +
        'over 2 years" demonstrates the kind of self-motivated learning that predicts college success.',
      examples: [
        'Self-studied competition math from AoPS Volume 2 through Putnam-level texts over 3 years',
        'Solved 500+ USACO problems across all divisions — tracked progress in spreadsheet with technique tags',
        'Completed MIT OCW 6.006 and 6.046 independently to prepare for USACO Platinum',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'self-studied', 'independently', 'self-taught', 'practiced',
        'prepared', 'solved', 'completed', 'worked through',
        'hours', 'problems', 'daily', 'weekly',
      ],
    },
    {
      id: 'sc_team_leadership',
      pattern: 'team_competition_leadership',
      description:
        'In team competitions, student demonstrates leadership through training, ' +
        'strategy, and organizational contributions beyond personal performance.',
      whyItWorks:
        'Team competition leadership combines domain expertise with interpersonal skills. ' +
        'A Science Olympiad captain who trains teammates, assigns events strategically, ' +
        'and builds team culture demonstrates a skillset that pure individual competitors lack. ' +
        'AOs value this combination highly.',
      examples: [
        'Captain: redesigned training schedule, assigned events by strength, team jumped from 15th to 3rd at regionals',
        'Led weekly practice sessions for 20-person math team; created differentiated problem sets by skill level',
        'As robotics team lead, managed 8-person build team through 6-week sprint to competition deadline',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'impact',
      detectionKeywords: [
        'captain', 'led', 'managed', 'organized', 'training',
        'schedule', 'practice', 'team', 'assigned', 'strategy',
      ],
    },
    {
      id: 'sc_science_fair_methodology',
      pattern: 'fair_project_depth',
      description:
        'For science fairs, student describes the research methodology, iteration, ' +
        'and findings of their project rather than just the placement.',
      whyItWorks:
        'Science fairs occupy a unique space — they are competitions but they are also ' +
        'research. The strongest descriptions treat the project as real science: hypothesis, ' +
        'methodology, findings, and implications. Placement is important, but the quality of ' +
        'the science is what AOs care about for predicting college research success.',
      examples: [
        'Tested 4 biodegradable plastics under 3 marine conditions over 6 months; results showed pH-dependent degradation rates — ISEF finalist',
        'Developed low-cost water quality sensor using Arduino; validated against lab instruments (r=0.96) — 1st at state fair',
        'Year-long soil remediation study with 200+ samples; identified bacterial consortium that breaks down microplastics — Regeneron STS Scholar',
      ],
      signalStrength: 'strong',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'tested', 'developed', 'studied', 'hypothesis', 'findings',
        'results', 'validated', 'fair', 'project', 'experiment',
        'data', 'samples', 'methodology',
      ],
    },
  ],

  nameDropTraps: [
    {
      id: 'sc_amc_alone',
      pattern: 'AMC/AIME without score or context',
      whyStudentsUseIt:
        'Students believe "took the AMC" or "qualified for AIME" sounds impressive. ' +
        'Parents and counselors treat AIME qualification as a major achievement.',
      whyItFails:
        'Over 300,000 students take the AMC annually. "Participated in AMC" communicates ' +
        'almost nothing — it is like saying "took the SAT." Even "qualified for AIME" ' +
        'without a score leaves AOs guessing. At top schools, AOs know AIME scores well: ' +
        'a 7 is good, a 12 is exceptional, a 15 is world-class. Omitting the score implies ' +
        'it was low.',
      betterAlternative:
        'Always include the score AND national context. If the score is not ' +
        'noteworthy, focus on what you DID with your math ability (teaching, research, ' +
        'real-world application) rather than the competition itself.',
      example: {
        nameDrop: 'Qualified for AIME and participated in AMC competitions throughout high school',
        improved: 'AIME score 11 (top 1% nationally); used competition math to develop scheduling algorithm for school',
        whatChanged:
          'Added specific score (11), national context (top 1%), and real-world application ' +
          '(scheduling algorithm). Now the AO knows exactly where this student stands AND ' +
          'that they apply their skills beyond competitions.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 15,
      detectionKeywords: [
        'AMC', 'AIME', 'participated in AMC', 'took AMC', 'qualified for',
        'math competition', 'math olympiad',
      ],
    },
    {
      id: 'sc_usaco_no_division',
      pattern: 'USACO without division specification',
      whyStudentsUseIt:
        'Students assume "USACO" alone sounds impressive because it is a well-known ' +
        'CS competition. They may not realize how stratified the divisions are.',
      whyItFails:
        'USACO has 4 divisions: Bronze (entry-level, ~15,000 students), Silver (~4,000), ' +
        'Gold (~1,500), and Platinum (~500). Saying "USACO participant" without division ' +
        'implies Bronze, which is not competitive at selective schools. The division IS ' +
        'the achievement — omitting it is like saying "I play sports" without mentioning ' +
        'varsity vs. JV.',
      betterAlternative:
        'Always name the division. If Bronze, focus on progression or what you learned/applied. ' +
        'If Gold or Platinum, the division name alone carries significant weight.',
      example: {
        nameDrop: 'Active USACO competitor and competitive programmer',
        improved: 'USACO Gold division; designed graph algorithm that solved 3 open problems in school CS curriculum',
        whatChanged:
          'Added division (Gold), removed vague "active competitor" and "competitive programmer," ' +
          'added specific intellectual contribution (graph algorithm solving open problems). ' +
          'The division provides instant context; the application shows depth.',
      },
      prevalence: 'common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'USACO', 'competitive programming', 'coding competition',
        'programming contest', 'CP', 'competitive coder',
      ],
    },
    {
      id: 'sc_science_olympiad_vague',
      pattern: 'Science Olympiad without event or role specifics',
      whyStudentsUseIt:
        'Science Olympiad sounds impressive and scientific. Students list it as a ' +
        'club membership without specifying their actual involvement.',
      whyItFails:
        'Science Olympiad teams have 15 members across 23 events. "Science Olympiad member" ' +
        'could mean anything from building a complex machine to standing in a hallway during ' +
        'a test event. Without specific events, role, and results, AOs assume minimal involvement. ' +
        'Team-level results without individual contribution are also weak.',
      betterAlternative:
        'Name your specific events, describe what you built or studied, and give individual ' +
        'results. "Science Olympiad member" becomes "Built Helicopter device that placed 2nd ' +
        'at state; trained 3 new members on aerodynamics principles."',
      example: {
        nameDrop: 'Science Olympiad team member for 3 years; team qualified for state competition',
        improved: 'Built 3 devices (Helicopter, Wright Stuff, Vehicle); all medaled at state — also wrote team study guide for Astronomy',
        whatChanged:
          'Replaced generic "team member" with specific events (3 build events + Astronomy), ' +
          'individual results (all medaled), and additional contribution (study guide). ' +
          'AO can now see this student\'s actual role and depth.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 25,
      detectionKeywords: [
        'Science Olympiad', 'SciOly', 'member', 'team', 'participated',
        'events', 'state', 'regionals', 'invitational',
      ],
    },
    {
      id: 'sc_hackathon_attended',
      pattern: 'Hackathon participation without project or result',
      whyStudentsUseIt:
        'Hackathons sound exciting and tech-forward. Students list attendance at ' +
        'multiple hackathons as evidence of technical engagement.',
      whyItFails:
        'Attending a hackathon is trivial — most are free and open to anyone. "Participated ' +
        'in 5 hackathons" tells AOs nothing. Did you sleep through them? Did you build ' +
        'something used by real people? AOs cannot tell. Multiple hackathons without results ' +
        'actually reads as a pattern of shallow engagement.',
      betterAlternative:
        'Describe ONE hackathon well: what you built, what problem it solved, and any ' +
        'recognition or impact. One deep hackathon experience beats five shallow ones.',
      example: {
        nameDrop: 'Participated in 6 hackathons including HackMIT and TreeHacks',
        improved: 'Won HackMIT: built real-time ASL translator using computer vision — now used by 2 Deaf advocacy orgs',
        whatChanged:
          'Replaced quantity (6 hackathons) with quality (won one, built something with ' +
          'real users). Named what was built (ASL translator), the technology approach ' +
          '(computer vision), and impact (2 organizations using it).',
      },
      prevalence: 'common',
      typicalCharWaste: 30,
      detectionKeywords: [
        'hackathon', 'hack', 'participated in', 'attended',
        'HackMIT', 'TreeHacks', 'PennApps', 'HackGT',
      ],
    },
    {
      id: 'sc_competition_list',
      pattern: 'Listing multiple competition names without results',
      whyStudentsUseIt:
        'Students believe quantity of competitions entered demonstrates breadth of ' +
        'talent. They are trying to show they are "competitive" across multiple areas.',
      whyItFails:
        'A list of competitions without results is a list of things the student did NOT ' +
        'excel at — because if they had excelled, they would lead with the result. AOs ' +
        'read "AMC, MATHCOUNTS, Science Olympiad, Physics competition" as "entered many ' +
        'things, succeeded at none." One strong result beats five participation mentions.',
      betterAlternative:
        'Lead with your BEST result. If you have multiple strong results, use a progression ' +
        'format. If you have no strong results, describe what you LEARNED or CREATED instead.',
      example: {
        nameDrop: 'Competed in AMC, MATHCOUNTS, Science Bowl, Physics competition, and Chemistry Olympiad',
        improved: 'MATHCOUNTS state champion (8th grade); transitioned to AMC/AIME — score 9 as sophomore, training for USAMO',
        whatChanged:
          'Replaced a list of 5 competitions (no results) with a progression narrative ' +
          'showing a strong result (state champion), growth (transitioned to harder competition), ' +
          'current level (AIME 9), and ambition (training for USAMO).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 40,
      detectionKeywords: [
        'competed in', 'participated in', 'and', 'various competitions',
        'multiple competitions', 'several', 'numerous',
      ],
    },
    {
      id: 'sc_competitive_programmer',
      pattern: '"Competitive programmer" as identity label',
      whyStudentsUseIt:
        'The label "competitive programmer" sounds like a identity — it implies being part ' +
        'of an elite community. Students use it as shorthand for "I am good at CS."',
      whyItFails:
        'The label is subjective and unverifiable. Anyone can call themselves a competitive ' +
        'programmer. Without a Codeforces rating, USACO division, or contest result, it is ' +
        'an empty identity claim. AOs immediately look for evidence to support the label ' +
        'and find none.',
      betterAlternative:
        'Replace the label with evidence: a rating, a division, a specific result, or a ' +
        'specific problem you solved. Let the evidence speak for itself.',
      example: {
        nameDrop: 'Competitive programmer with experience in algorithms and data structures',
        improved: 'Codeforces rating 2100 (Expert); solved 1,200+ problems across DP, graphs, and number theory',
        whatChanged:
          'Replaced vague identity label with specific, verifiable metrics: Codeforces ' +
          'rating (2100, which AOs can look up), problem count (1,200+), and specific ' +
          'topic areas. This is proof, not claim.',
      },
      prevalence: 'common',
      typicalCharWaste: 35,
      detectionKeywords: [
        'competitive programmer', 'competitive coder', 'experienced in',
        'algorithms', 'data structures', 'problem solver',
      ],
    },
    {
      id: 'sc_team_result_only',
      pattern: 'Team result without individual contribution',
      whyStudentsUseIt:
        'Students want to claim the team\'s success. "Team won 1st place" sounds better ' +
        'than "I was on a team that won 1st place." They blur the line between team and ' +
        'individual achievement.',
      whyItFails:
        'AOs are admitting individuals, not teams. "Team placed 3rd at states" says nothing ' +
        'about the student\'s contribution. Were they the star performer or the person who ' +
        'carried the water bottles? Without individual contribution, team results are discounted.',
      betterAlternative:
        'Name the team result, then immediately specify YOUR role. "Team placed 3rd at ' +
        'states; I scored in top 5 individually in Chemistry and trained 4 new members."',
      example: {
        nameDrop: 'Member of Science Bowl team that qualified for national competition',
        improved: 'Science Bowl: answered 60% of team\'s biology questions; personally scored winning buzzer in regional finals',
        whatChanged:
          'Added individual contribution (60% of biology questions) and a specific memorable ' +
          'moment (winning buzzer at regionals). AO can now see this student\'s role ' +
          'on the team and their personal performance level.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 15,
      detectionKeywords: [
        'team', 'member of', 'our team', 'team placed', 'team won',
        'team qualified', 'we', 'our',
      ],
    },
    {
      id: 'sc_math_competition_generic',
      pattern: '"Math competitions" without specificity',
      whyStudentsUseIt:
        'Students who participate in multiple math activities use the generic phrase ' +
        'to capture all of them at once.',
      whyItFails:
        '"Participates in math competitions" is content-free. There are hundreds of math ' +
        'competitions at vastly different levels. This phrase groups AMC with school-level ' +
        'events, making it impossible for AOs to assess the student\'s level.',
      betterAlternative:
        'Name the highest-level competition and your result. Stack from strongest to ' +
        'least strong if you have multiple. Be specific and let the level speak.',
      example: {
        nameDrop: 'Active participant in math competitions and math team activities',
        improved: 'USAMO qualifier; AMC 10 perfect score; MATHCOUNTS national semifinalist — founded school\'s first math circle',
        whatChanged:
          'Replaced vague "math competitions" with a clear hierarchy of specific achievements ' +
          'at increasing levels, plus an initiative (founded math circle) that shows the ' +
          'student creates, not just competes.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'math competitions', 'math team', 'math club', 'math activities',
        'mathematical', 'active participant',
      ],
    },
    {
      id: 'sc_robotics_vague',
      pattern: 'Robotics team membership without specific role',
      whyStudentsUseIt:
        'Robotics sounds impressive and technical. Students list FRC/FTC/VEX membership ' +
        'assuming the team name carries weight.',
      whyItFails:
        'FRC teams have 20-60+ members. Many members attend meetings without contributing ' +
        'meaningfully. "Robotics team member" could mean lead programmer, lead builder, ' +
        'drive team, or the person who swept the floor. AOs need to know the specific role ' +
        'and contribution.',
      betterAlternative:
        'Name your specific subsystem or role, what you built/coded/designed, and the result. ' +
        '"Designed and fabricated the intake mechanism that scored 90% of our points at competition."',
      example: {
        nameDrop: 'Member of FIRST Robotics team for 3 years; team competed at regional level',
        improved: 'Lead programmer, FRC Team 254: wrote autonomous navigation code — robot scored 45 points/match avg, 2nd at Worlds',
        whatChanged:
          'Replaced "member for 3 years" with specific role (lead programmer), specific ' +
          'contribution (autonomous navigation), quantified result (45 points/match), and ' +
          'competition achievement (2nd at Worlds). Now AO sees a leader, not a spectator.',
      },
      prevalence: 'common',
      typicalCharWaste: 25,
      detectionKeywords: [
        'robotics', 'FRC', 'FTC', 'VEX', 'FIRST', 'robot',
        'team member', 'member of', 'competed',
      ],
    },
    {
      id: 'sc_olympiad_training',
      pattern: '"Trained for" / "Preparing for" an olympiad',
      whyStudentsUseIt:
        'Students who have not yet achieved results want to signal ambition. ' +
        '"Training for USAMO" sounds like a goal worth listing.',
      whyItFails:
        'Training is process, not achievement. Anyone can claim to be "training for USAMO." ' +
        'Without results, this reads as aspiration masquerading as accomplishment. AOs evaluate ' +
        'what you HAVE done, not what you plan to do.',
      betterAlternative:
        'Focus on what you have ALREADY achieved on the path. "Training for USAMO" becomes ' +
        '"AIME score 10, studying combinatorics and number theory for USAMO attempt." ' +
        'Or describe what you created along the way: problems written, students mentored.',
      example: {
        nameDrop: 'Currently training for USAMO and preparing for international math olympiad',
        improved: 'AIME score 10 (soph); self-studying combinatorics + NT — wrote 40 original olympiad problems for school team',
        whatChanged:
          'Replaced aspirational "training for" with concrete current achievement (AIME 10), ' +
          'specific study areas (combinatorics, number theory), and productive output ' +
          '(40 original problems). Shows the journey AND the contribution.',
      },
      prevalence: 'common',
      typicalCharWaste: 25,
      detectionKeywords: [
        'training for', 'preparing for', 'studying for', 'working towards',
        'aspiring', 'hoping to', 'aiming for', 'planning to',
      ],
    },
    {
      id: 'sc_award_inflation',
      pattern: 'Inflating local/school awards to sound prestigious',
      whyStudentsUseIt:
        'Students want every award to sound as impressive as possible. "School math award" ' +
        'becomes "Mathematics Excellence Award." The instinct is to make everything sound ' +
        'bigger than it is.',
      whyItFails:
        'AOs are experts at calibrating awards. They have read thousands of applications and ' +
        'can distinguish a national award from a school one by context. Inflation does not ' +
        'fool anyone — it just erodes trust. If the AO senses inflation on one activity, ' +
        'they discount everything.',
      betterAlternative:
        'Be precise about the level: school, district, regional, state, national, ' +
        'international. Pair small awards with specific actions that add substance.',
      example: {
        nameDrop: 'Recipient of prestigious Mathematics Excellence Award for outstanding achievement',
        improved: 'Top scorer on school math team 3 consecutive years; mentored 8 teammates who improved AMC scores by avg 30 points',
        whatChanged:
          'Replaced inflated award language with verifiable facts (top scorer, 3 years) ' +
          'and meaningful contribution (mentored 8 teammates with measurable improvement). ' +
          'This is more impressive because it is believable and specific.',
      },
      prevalence: 'common',
      typicalCharWaste: 30,
      detectionKeywords: [
        'prestigious', 'excellence', 'outstanding', 'award', 'honored',
        'recognized', 'recipient', 'distinction', 'achievement award',
      ],
    },
  ],

  proofOfWorkPatterns: [
    {
      id: 'sc_pow_training_regimen',
      pattern:
        'Student describes a specific, sustained practice routine — daily problem sets, ' +
        'weekly mock contests, systematic topic coverage.',
      whyItProves:
        'Competition preparation at high levels requires hundreds of hours of deliberate ' +
        'practice. A student who describes "solving 10 problems daily from AoPS Intermediate ' +
        'Counting" for 6 months has put in work that cannot be faked. The specificity of the ' +
        'routine proves the commitment.',
      examples: [
        'Solved 10 USACO problems daily for 14 months; tracked weakness areas in spreadsheet — promoted 3 divisions',
        'Weekly timed practice: 2 full AMC mocks + 1 AIME mock every Sunday for 2 years',
        'Systematic study: completed AoPS volumes 1 and 2, then Putnam and Beyond — annotated every chapter',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student has the discipline and self-direction to sustain deliberate practice ' +
        'over months. This is exactly the kind of student who thrives in a rigorous college environment.',
    },
    {
      id: 'sc_pow_build_documentation',
      pattern:
        'In build competitions (Science Olympiad, robotics), student describes iterative ' +
        'design process with specific testing and revision cycles.',
      whyItProves:
        'Building a competitive device requires engineering methodology: design, prototype, ' +
        'test, revise. A student who describes "tested 7 propeller designs in wind tunnel, ' +
        'final design achieved 23-second flight time" has clearly gone through a real ' +
        'engineering process. This cannot be fabricated from a distance.',
      examples: [
        'Tested 7 wing configurations in improvised wind tunnel; final helicopter flew 23 seconds (2nd at state)',
        'Iterated through 4 drivetrain designs for robot; final version increased scoring speed 3x over initial',
        'Built 12 mousetrap vehicle prototypes over 3 months; optimized string pull ratio for 9.2m distance',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student understands the engineering design cycle — not from a textbook, but from ' +
        'actually building things that had to work. They approach problems systematically.',
    },
    {
      id: 'sc_pow_community_building',
      pattern:
        'Student created a lasting resource, community, or institution around their ' +
        'competition interest — math circles, online problem sets, study groups.',
      whyItProves:
        'Creating resources for others requires mastery of the material AND initiative to share it. ' +
        'A student who founded a math circle for 30 middle schoolers has demonstrated expertise, ' +
        'leadership, and impact. The effort is verifiable and impossible to fabricate.',
      examples: [
        'Founded math circle: 30 students, weekly meetings for 2 years; 4 students qualified for MATHCOUNTS state',
        'Created YouTube channel with 80+ competition math tutorials — 15K subscribers, 500K total views',
        'Organized inter-school math league: 8 schools, monthly contests, end-of-year awards ceremony',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student is not just talented — they are a community builder. They used their ability ' +
        'to create something that did not exist before and that serves others. This is the kind of ' +
        'student who will contribute to campus life.',
    },
    {
      id: 'sc_pow_specific_problem',
      pattern:
        'Student references a specific memorable problem they solved, the approach ' +
        'they used, and why it was significant.',
      whyItProves:
        'Every competition student has that one problem that changed how they think. ' +
        'Being able to reference it — "the P5 on 2024 AIME II that required connecting ' +
        'combinatorics to number theory" — proves deep engagement. Students who list competitions ' +
        'but cannot reference specific problems were not deeply engaged.',
      examples: [
        'Solved AIME 2024 #13 using novel generating function approach — posted solution to AoPS, 50+ upvotes',
        'My USACO solution for the December Platinum problem used centroid decomposition — editorial featured similar approach',
        'Cracked the hardest Science Olympiad experimental design problem using unexpected pH indicator',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student engages with problems intellectually, not just transactionally. ' +
        'They remember specific moments of insight, which reveals genuine love for the subject.',
    },
    {
      id: 'sc_pow_failure_response',
      pattern:
        'Student describes a competition failure or disappointment and how they responded — ' +
        'what they learned, how they adjusted, what they did differently.',
      whyItProves:
        'Competition students who only report wins are telling half the story. Every competitor ' +
        'loses far more often than they win. Describing a specific failure and the response to it ' +
        'demonstrates resilience and emotional maturity. It also proves the student actually competed ' +
        'seriously enough to be disappointed.',
      examples: [
        'Missed AIME cutoff by 1.5 points sophomore year; spent summer doing 500+ practice problems, qualified junior year with score 8',
        'Placed 15th at state Science Olympiad in my best event; analyzed what competitors did differently, redesigned device',
        'Failed to advance past USACO Silver for 6 months; identified weak areas (DP on trees), focused practice, promoted to Gold',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student can handle setbacks productively. They do not just compete — they reflect, ' +
        'analyze, and improve. This response to failure is a strong predictor of college resilience.',
    },
    {
      id: 'sc_pow_cross_domain',
      pattern:
        'Student connects competition skills to another domain — using olympiad math in ' +
        'research, competition algorithms in a real product, etc.',
      whyItProves:
        'Transfer is the highest level of learning. A student who can take competition skills ' +
        'and apply them to research, products, or community service has moved beyond the contest ' +
        'hall. This shows the intellectual ability is genuine and flexible, not just test-taking skill.',
      examples: [
        'Used competition probability theory to model disease spread for county health department',
        'Applied USACO graph algorithms to optimize school lunch line flow — reduced wait time 35%',
        'Competition physics prepared me to model satellite orbits in university astrophysics project',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student does not just solve artificial problems — they see mathematics/CS/science ' +
        'as tools for understanding the real world. This is the intellectual orientation colleges want.',
    },
    {
      id: 'sc_pow_resource_creation',
      pattern:
        'Student created original competition preparation resources — problem sets, ' +
        'video tutorials, handouts, software tools.',
      whyItProves:
        'Creating resources requires deeper understanding than consuming them. A student who ' +
        'wrote 50 original competition problems understands problem design, difficulty calibration, ' +
        'and pedagogical progression. This is a graduate-student-level skill applied at the HS level.',
      examples: [
        'Wrote 100-page study guide for Science Olympiad Astronomy — used by 12 teams at state competition',
        'Created online problem archive with 200+ categorized problems and solutions — 3,000 unique visitors/month',
        'Developed spaced-repetition flashcard system for competition math formulas — shared with 50+ students',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student is not just a competitor — they are an educator and creator. They took their ' +
        'knowledge and made it accessible to others. This is the kind of initiative that builds communities.',
    },
  ],

  descriptionTransforms: [
    {
      id: 'sc_dt_list_to_peak',
      transformType: 'generic_to_specific',
      before: 'Competed in AMC, AIME, Science Bowl, and Science Olympiad over 4 years',
      after: 'AIME score 11 (top 1%); Science Bowl regional champion; Science Olympiad — 4 state medals in build events',
      explanation:
        'A list of competitions without results is a list of things the student did NOT excel at. ' +
        'The revised version leads with the strongest result (AIME 11), adds specific achievements ' +
        'in each competition, and specifies the TYPE of Science Olympiad events.',
      charsBefore: 64,
      charsAfter: 101,
      principle: 'Competition lists without results signal absence of achievement.',
    },
    {
      id: 'sc_dt_participation_to_result',
      transformType: 'claim_to_evidence',
      before: 'Active and dedicated member of school math team for four years',
      after: 'School math team: top scorer 3 years, led team to 1st state finish in school history, mentored 12 new members',
      explanation:
        '"Active and dedicated" are self-assessed adjectives that carry no information. ' +
        'The revised version provides verifiable facts: top scorer (performance), team result ' +
        '(impact), and mentoring (leadership). Let the evidence prove the dedication.',
      charsBefore: 57,
      charsAfter: 101,
      principle: 'Replace adjectives about yourself with facts about your work.',
    },
    {
      id: 'sc_dt_vague_hackathon',
      transformType: 'generic_to_specific',
      before: 'Participated in multiple hackathons and built innovative tech projects',
      after: 'Won PennApps: built app matching surplus restaurant food to shelters — 400 meals redirected in pilot month',
      explanation:
        '"Multiple hackathons" and "innovative projects" are vague. The revised version ' +
        'names one hackathon (PennApps), describes the product (food matching app), and ' +
        'quantifies impact (400 meals). One concrete example beats five vague claims.',
      charsBefore: 63,
      charsAfter: 101,
      principle: 'One specific, impactful example beats many vague ones.',
    },
    {
      id: 'sc_dt_passive_team_to_leader',
      transformType: 'passive_to_active',
      before: 'Was on the Science Olympiad team and helped prepare for competitions',
      after: 'Captain: redesigned event assignments by strength analysis — team jumped from 12th to 3rd at regionals',
      explanation:
        '"Was on the team" and "helped prepare" are passive. The revised version leads with ' +
        'the leadership role (Captain), describes a specific strategic decision (strength analysis), ' +
        'and quantifies the impact (12th to 3rd). Same activity, completely different signal.',
      charsBefore: 63,
      charsAfter: 95,
      principle: 'Describe what you CHANGED, not what you ATTENDED.',
    },
    {
      id: 'sc_dt_label_to_evidence',
      transformType: 'claim_to_evidence',
      before: 'Talented competitive programmer with strong problem-solving skills',
      after: 'USACO Platinum; Codeforces Expert (2100); solved 1,500+ algorithmic problems across 7 topic categories',
      explanation:
        '"Talented" and "strong skills" are claims. USACO Platinum, Codeforces 2100, and 1,500+ problems ' +
        'are evidence. The revised version gives three layers of proof that the AO can verify ' +
        'and contextualize. The evidence is the argument.',
      charsBefore: 61,
      charsAfter: 100,
      principle: 'Never claim talent. Demonstrate it through specific, verifiable evidence.',
    },
    {
      id: 'sc_dt_duty_to_impact',
      transformType: 'duty_to_achievement',
      before: 'Responsible for training new members and organizing weekly practice sessions',
      after: 'Trained 15 new members; 8 qualified for AIME within 2 years — created differentiated problem sets by skill level',
      explanation:
        '"Responsible for training" is a duty. "Trained 15 new members; 8 qualified for AIME" ' +
        'shows the RESULT of that training. Adding "differentiated problem sets" reveals ' +
        'pedagogical sophistication. The duty becomes an achievement with measurable impact.',
      charsBefore: 73,
      charsAfter: 106,
      principle: 'Transform duties into outcomes. What RESULTED from your responsibility?',
    },
    {
      id: 'sc_dt_process_to_creation',
      transformType: 'name_drop_to_impact',
      before: 'Studied advanced mathematics including number theory and combinatorics for competitions',
      after: 'Self-studied through AoPS and Putnam-level texts; wrote 50 original problems now used by 3 school math teams',
      explanation:
        'Listing subjects studied is like listing classes taken. The revised version shows the ' +
        'same self-study but adds a CREATION (50 original problems) with IMPACT (used by 3 teams). ' +
        'Studying is consumption; writing problems is production.',
      charsBefore: 79,
      charsAfter: 104,
      principle: 'Consumption (studying) is less impressive than production (creating).',
    },
    {
      id: 'sc_dt_time_to_trajectory',
      transformType: 'generic_to_specific',
      before: 'Spent 3 years in competitive math, improving skills and competing at higher levels',
      after: 'AMC 90 (9th) → AIME qual (10th) → AIME 10 (11th) — 1,800+ practice problems solved with technique tracking',
      explanation:
        '"Improving skills" is assumed and uninformative. The revised version shows the ' +
        'exact trajectory with specific scores, creating a concrete narrative of growth. ' +
        'Adding the practice volume (1,800+ problems) demonstrates the work behind the results.',
      charsBefore: 76,
      charsAfter: 105,
      principle: 'Show the trajectory with specific data points, not vague "improvement."',
    },
    {
      id: 'sc_dt_fair_generic_to_specific',
      transformType: 'jargon_to_outcome',
      before: 'Conducted scientific research project and presented at regional science fair',
      after: 'Year-long soil study: discovered pesticide-resistant bacteria in 5/8 farm sites — 1st place regional, ISEF qualifier',
      explanation:
        '"Scientific research project" and "presented at fair" are fully generic. The revised ' +
        'version describes the actual research (soil study), specific finding (pesticide-resistant ' +
        'bacteria), scope (5/8 farm sites), and result chain (1st place, ISEF qualifier). ' +
        'Science fairs ARE research — describe them that way.',
      charsBefore: 72,
      charsAfter: 107,
      principle: 'Science fair projects ARE research. Describe the science, not "the project."',
    },
    {
      id: 'sc_dt_robotics_role',
      transformType: 'passive_to_active',
      before: 'Member of FRC robotics team; worked on programming and building the robot',
      after: 'Lead programmer: wrote autonomous scoring routine using computer vision — robot averaged 42 pts/match, 3rd at regional',
      explanation:
        '"Member" and "worked on" are passive. The revised version specifies the role (lead programmer), ' +
        'the specific contribution (autonomous scoring with CV), and quantified results (42 pts/match, ' +
        '3rd at regional). On a 40-person team, this carves out the individual.',
      charsBefore: 71,
      charsAfter: 115,
      principle: 'On large teams, surgically define YOUR contribution.',
    },
  ],

  verbHierarchy: [
    {
      tier: 'power',
      verbs: [
        'Qualified', 'Placed', 'Won', 'Founded', 'Created',
        'Designed', 'Solved', 'Proved', 'Trained', 'Built',
      ],
      context:
        'Power verbs in competitions signal achievement, creation, or mastery. ' +
        '"Qualified" and "Placed" immediately communicate a result. "Founded" and "Created" ' +
        'signal initiative beyond competing. "Solved" and "Proved" signal intellectual depth. ' +
        'These verbs put the student in the driver\'s seat of the narrative.',
      exampleUsage:
        'Qualified for USAMO; founded school\'s first competitive math program — 25 active members',
    },
    {
      tier: 'standard',
      verbs: [
        'Competed', 'Scored', 'Advanced', 'Improved', 'Practiced',
        'Studied', 'Prepared', 'Organized', 'Led', 'Mentored',
      ],
      context:
        'Standard verbs describe effort and participation. They are fine as supporting verbs ' +
        'but weak as leading verbs. "Competed in AMC" is less informative than "Scored 130 on AMC." ' +
        '"Led practice sessions" needs a result to be compelling. Pair with specific outcomes.',
      exampleUsage:
        'Competed in 12 invitationals; scored in top 10 at 8 — advanced to MATHCOUNTS state round',
    },
    {
      tier: 'weak',
      verbs: [
        'Participated', 'Attended', 'Joined', 'Was member of', 'Tried',
        'Experienced', 'Engaged in', 'Involved in', 'Entered', 'Took',
      ],
      context:
        'Weak verbs signal passive presence without achievement. In the competition context, ' +
        'these verbs specifically imply the student did not perform well enough to report results. ' +
        '"Participated in AMC" is read by AOs as "took the AMC but scored low." ' +
        'If the student had a good score, they would lead with it.',
      exampleUsage:
        'Avoid: "Participated in various math competitions" — leads AO to assume no results worth mentioning',
    },
  ],

  roleExpertise: [
    {
      role: 'Individual Competitor (Math/CS/Physics Olympiad)',
      expectedSignals: [
        'Specific competition results with national context',
        'Description of preparation methodology and commitment level',
        'Progressive improvement over time',
        'Specific topic areas of strength or specialization',
      ],
      differentiators: [
        'National or international level achievement (USAMO, IMO, IOI, IPhO)',
        'Created problems, resources, or training materials for others',
        'Applied competition knowledge to research or real-world problems',
        'Founded or significantly grew a math/CS program at school or in community',
        'Mentored other students to verifiable improvements',
      ],
      overclaimingRisks: [
        'Implying higher achievement level by omitting specific scores',
        'Listing competition names without results (signals low performance)',
        'Claiming "national level" when the qualification round is the achievement',
        'Using "we" for individual competition results to inflate scope',
      ],
      authenticPatterns: [
        'Leads with specific score or rank',
        'Describes progression across multiple years',
        'References specific topics, problems, or approaches',
        'Mentions teaching or community building alongside personal results',
      ],
    },
    {
      role: 'Team Captain / Leader (Science Olympiad, Science Bowl, Robotics)',
      expectedSignals: [
        'Team-level results with the student\'s specific leadership contribution',
        'Training or mentoring activities with measurable outcomes',
        'Strategic decisions that improved team performance',
        'Administrative/organizational work that enabled the team to function',
      ],
      differentiators: [
        'Measurable team improvement attributable to the captain\'s strategies',
        'Created training programs or resources that outlasted the captain\'s tenure',
        'Rebuilt a struggling team or founded a new program',
        'Individual event expertise PLUS leadership (depth + breadth)',
      ],
      overclaimingRisks: [
        'Taking credit for team results without specifying personal contribution',
        'Claiming to have "led" a team as captain when the coach made all decisions',
        'Overstating influence on teammates\' individual performance',
      ],
      authenticPatterns: [
        'Distinguishes between team results and personal role clearly',
        'Describes specific leadership decisions and their outcomes',
        'References mentoring with quantified results ("8 members improved by...")',
        'Acknowledges team contributions while clarifying own role',
      ],
    },
    {
      role: 'Science Fair Researcher',
      expectedSignals: [
        'Research question articulated with clarity',
        'Methodology described with enough specificity to evaluate rigor',
        'Results reported with quantification',
        'Fair placement at appropriate level (school, regional, state, national)',
      ],
      differentiators: [
        'ISEF or Regeneron STS finalist/scholar recognition',
        'Research that continued beyond the fair — published or applied',
        'Novel methodology or finding that surprised mentors',
        'Project addresses a real-world problem with measurable potential impact',
      ],
      overclaimingRisks: [
        'Inflating local fair placement as major scientific achievement',
        'Describing mentor-designed project as independent work',
        'Claiming results that are scientifically implausible for HS resources',
        'Using "groundbreaking" or "revolutionary" for incremental findings',
      ],
      authenticPatterns: [
        'Describes the project as science (hypothesis, method, result), not as a fair entry',
        'Specific about scale, duration, and iteration',
        'Honest about fair level (regional vs. state vs. national)',
        'Connects project to genuine interest or prior experience in the topic',
      ],
    },
    {
      role: 'Hackathon Competitor / Builder',
      expectedSignals: [
        'Specific project description with problem and solution clearly stated',
        'Technical contribution within the team specified',
        'Project outcome or impact beyond the hackathon',
        'Award or recognition if applicable',
      ],
      differentiators: [
        'Project continued beyond the hackathon and achieved real users/impact',
        'Won at a major hackathon (HackMIT, TreeHacks, PennApps, etc.)',
        'Built something that was adopted by an organization or community',
        'Demonstrated unique technical approach (not just tutorials assembled)',
      ],
      overclaimingRisks: [
        'Listing hackathon attendance as achievement (attendance is trivial)',
        'Describing tutorial-following as "built from scratch"',
        'Claiming "AI-powered" or "ML-driven" for simple if-else logic',
        'Overstating team project as individual achievement',
      ],
      authenticPatterns: [
        'Describes the problem solved, not just the technology used',
        'Quantifies impact (users, meals served, time saved)',
        'Specifies personal technical contribution in team context',
        'Mentions iteration, user feedback, or continued development',
      ],
    },
  ],

  jargonExceptions: [
    {
      pattern: 'USAMO/IMO/IOI/IPhO qualifier or medalist',
      whyItsTheException:
        'These are the pinnacle of high school competition in their respective fields. ' +
        'Naming them IS the achievement — every AO in the country knows what USAMO qualifier ' +
        'means. These acronyms compress enormous information into a few characters and are the ' +
        'most efficient possible description.',
      example:
        'USAMO qualifier — scored 28/42; founded school math olympiad program (25 members)',
    },
    {
      pattern: 'ISEF Grand Award / Regeneron STS Finalist',
      whyItsTheException:
        'The most prestigious pre-college science competitions. A single mention of "ISEF ' +
        'Grand Award" communicates more about research caliber than any description could. ' +
        'These are universally understood by admissions committees.',
      example:
        'ISEF Grand Award, 1st in Microbiology — discovered novel antibiotic compound in soil bacteria',
    },
    {
      pattern: 'Codeforces/USACO division when it signals elite level',
      whyItsTheException:
        'In CS competitions, the rating or division IS the credential. "Codeforces Grandmaster" ' +
        'or "USACO Platinum" are compact, verifiable signals of elite ability. These are the ' +
        'CS equivalent of "USAMO qualifier" — AOs at tech-focused schools understand them.',
      example:
        'USACO Platinum; Codeforces International Master (2300) — applied algorithms to optimize city bus routes',
    },
    {
      pattern: 'Specific well-known competition (Putnam, MATHCOUNTS National)',
      whyItsTheException:
        'Some competition names carry their own context. "Putnam Fellow" or "MATHCOUNTS ' +
        'National Champion" are achievements where the name is inseparable from the prestige. ' +
        'Removing the name would lose essential information.',
      example:
        'MATHCOUNTS National: placed 12th individually — youngest qualifier in state history',
    },
    {
      pattern: 'AoPS/Art of Problem Solving when describing resource creation',
      whyItsTheException:
        'When a student CONTRIBUTES to AoPS (moderating, writing problems, creating resources) ' +
        'rather than just using it, naming AoPS signals engagement with the most prestigious ' +
        'math community for pre-college students. The platform name contextualizes the contribution.',
      example:
        'AoPS community contributor: wrote 200+ solutions and 30 original problems; 4.8-star average rating from peers',
    },
  ],
};
