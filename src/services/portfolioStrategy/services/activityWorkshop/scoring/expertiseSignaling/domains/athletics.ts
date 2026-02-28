/**
 * Expertise Signaling Library — Athletics
 *
 * Covers: Individual sports (track & field, swimming, tennis, golf, wrestling,
 * cross-country, gymnastics, fencing, martial arts), team sports (basketball,
 * soccer/football, lacrosse, volleyball, baseball/softball, field hockey, ice hockey,
 * rowing), club/travel sports, and recreational/fitness activities.
 *
 * Key insight for this domain: Athletics is the MOST common extracurricular
 * category in college applications — over 7.5 million US high school students
 * participate in sports. "Varsity," "captain," and stat lines are the most
 * overused signals. AOs have seen every version of "varsity 3-sport athlete"
 * and "team captain" imaginable. The strongest athletic descriptions show
 * LEADERSHIP IMPACT (what changed because of you?), SELECTION CONTEXT
 * (how competitive was the pool?), and GROWTH NARRATIVE (what obstacle did
 * you overcome?) rather than stats without context.
 *
 * Critical context: Unless a student is being recruited for athletics, AOs
 * evaluate sports as character evidence — what does this activity reveal about
 * the person? Work ethic, resilience, leadership, teamwork, and community
 * impact matter far more than raw performance numbers.
 *
 * Sources: NFHS participation surveys, NCAA eligibility data, Sara Harberson
 * insights, MIT/Stanford/Yale admissions blogs, NACAC surveys on activity
 * evaluation, published AO preferences on athletic descriptions.
 */

import type { ExpertiseDomain } from '../types';

export const ATHLETICS_DOMAIN: ExpertiseDomain = {
  domainId: 'athletics',
  label: 'Athletics & Sports',
  overview:
    'Athletics is the most common extracurricular — over 7.5 million US high school students ' +
    'participate. This makes it the hardest category in which to stand out. AOs have calibrated ' +
    'expectations finely: "varsity" and "captain" appear in tens of thousands of applications. ' +
    'Unless a student is a recruited athlete, AOs evaluate sports as CHARACTER EVIDENCE, not ' +
    'athletic achievement. They ask: What does this activity reveal about who this person is? ' +
    'Leadership impact, personal growth through adversity, community contribution, and ' +
    'sustained commitment matter far more than statistics without context.',

  aoExpectations: {
    whatRegisters: [
      'Leadership that produced measurable team outcomes (improved record, culture change, player development)',
      'Selection context showing genuine competitiveness (recruitment interest, selective tryouts, all-conference)',
      'Personal growth narrative — overcoming injury, adversity, or initial failure with specific results',
      'Community impact extending beyond the team (youth clinics, equipment drives, inclusive programs)',
      'Sustained multi-year commitment showing growth arc, not just participation',
      'Statistical context that non-experts can understand (league-leading, conference record, school record)',
    ],
    whatAOsSeeThrough: [
      '"Varsity athlete" without any context about team competitiveness or individual distinction',
      'Raw statistics without league or conference context (".350 batting average" — out of how competitive a league?)',
      '"Captain" presented as the headline achievement without evidence of what leadership produced',
      'Pay-to-play travel/club teams presented as elite selection when they are primarily fee-based',
      'Listing multiple sports to signal "well-rounded" when none show depth',
      'Generic claims about teamwork, discipline, and time management that every athlete could make',
    ],
    goldenQuestion:
      'Beyond the sport itself, what does this student\'s athletic experience reveal about their ' +
      'character, leadership ability, and potential contribution to our campus community?',
    readingTimeContext:
      'AOs spend ~10 seconds per activity. Athletic descriptions that open with "Varsity" ' +
      'or "Captain" immediately blend in with thousands of identical entries. Leading with ' +
      'a specific impact, growth moment, or distinctive contribution captures attention ' +
      'in those critical first seconds.',
    competitiveContext:
      'Over 7.5 million students play high school sports (NFHS). Roughly 6-7% play at any ' +
      'college level, and under 2% receive any athletic scholarship. All-State recognition ' +
      'represents roughly the top 1-2%. AOs know these numbers and calibrate accordingly — ' +
      'varsity participation alone provides essentially zero differentiation.',
  },

  realExpertiseSignals: [
    {
      id: 'ath_leadership_impact',
      pattern: 'measurable_leadership_outcome',
      description: 'Leadership that produced specific, measurable team improvement',
      whyItWorks:
        'This is the single most powerful signal in athletic descriptions. AOs see "captain" ' +
        'constantly, but "captain who transformed the team from 3-9 to 10-2" is rare. ' +
        'Connecting leadership to outcomes proves the title was meaningful, not honorary.',
      examples: [
        'Captain: redesigned practice structure → team improved from 5-7 to 12-1 record',
        'As captain, initiated film study sessions; team\'s scoring efficiency increased 35%',
        'Led cultural change: team went from 40% practice attendance to 95% under my leadership',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'captain', 'redesigned', 'improved', 'transformed', 'led',
        'implemented', 'initiated', 'team record', 'culture', 'program',
      ],
    },
    {
      id: 'ath_selection_specificity',
      pattern: 'competitive_selection_context',
      description: 'Showing how competitive the selection or recognition process was',
      whyItWorks:
        'Selection context differentiates genuine distinction from participation. ' +
        '"All-Conference" is vague; "All-Conference in a 14-team league" is specific. ' +
        '"Walk-on" is vague; "1 of 3 walk-ons selected from 60 tryouts" is impressive.',
      examples: [
        'Recruited by 4 D1 programs; committed to [University] on athletic scholarship',
        'All-Conference in 16-team league; 1 of 2 sophomores selected in program history',
        '1 of 4 walk-ons selected from 80 candidates at competitive club team tryout',
      ],
      signalStrength: 'strong',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'recruited', 'scholarship', 'all-conference', 'all-league', 'all-state',
        'all-american', 'selected', '1 of', 'tryout', 'walk-on', 'commit',
      ],
    },
    {
      id: 'ath_adversity_growth',
      pattern: 'overcoming_setback',
      description: 'Recovery from injury, failure, or adversity with a specific outcome',
      whyItWorks:
        'Adversity narratives are powerful because they reveal character — resilience, ' +
        'determination, and the ability to handle setback. AOs know that how someone ' +
        'handles failure predicts how they\'ll handle college challenges. The key is ' +
        'SPECIFICITY: name the setback and the measurable comeback.',
      examples: [
        'Returned from ACL tear to start all 20 games in senior season; earned All-Conference',
        'Cut as sophomore; trained independently for 6 months; made varsity as junior, became starter',
        'Overcame stress fracture; adapted training approach; set school record in recovery season',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'returned', 'recovered', 'overcame', 'injury', 'ACL', 'concussion',
        'cut', 'setback', 'comeback', 'rehabilitation', 'stress fracture',
      ],
    },
    {
      id: 'ath_stats_with_context',
      pattern: 'contextualized_statistics',
      description: 'Performance statistics placed within league, conference, or school context',
      whyItWorks:
        'Raw stats mean nothing to AOs who don\'t follow high school sports. ' +
        '".350 batting average" communicates nothing. "League-leading .380 average ' +
        'in 12-team conference" tells the reader this was the best performance in a ' +
        'competitive field. Context transforms numbers into narrative.',
      examples: [
        'Conference-leading scorer, 24 PPG in 14-team league; led team to conference title',
        'Broke school record (est. 1998) in 200m; 3rd fastest in state history',
        'Top goalkeeper in conference: 0.82 goals-against average, 12 shutouts in 18 games',
      ],
      signalStrength: 'strong',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'league-leading', 'conference', 'record', 'school record', 'state',
        'average', 'PPG', 'per game', 'career', 'shutout', 'all-time',
      ],
    },
    {
      id: 'ath_community_extension',
      pattern: 'sport_as_community_service',
      description: 'Using athletic skills to serve the community beyond the team',
      whyItWorks:
        'When a student uses their sport to serve others — youth clinics, adaptive sports ' +
        'programs, equipment drives, community coaching — it shows the sport shaped their ' +
        'values, not just their skills. This is the character evidence AOs want to see.',
      examples: [
        'Organized weekly basketball clinics for 60+ elementary students over 2 summers',
        'Founded adaptive swimming program for children with disabilities; 15 participants',
        'Collected and donated 200+ pieces of equipment to underserved youth leagues',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'clinic', 'youth', 'community', 'donated', 'founded', 'adaptive',
        'volunteer', 'coached', 'elementary', 'underserved', 'equipment',
      ],
    },
    {
      id: 'ath_player_development',
      pattern: 'developing_teammates',
      description: 'Helping teammates improve with specific, measurable outcomes',
      whyItWorks:
        'Teaching and developing other athletes demonstrates mastery, leadership, and ' +
        'selflessness. "Stayed after practice with 3 JV players who then earned varsity ' +
        'spots" shows the kind of generous leadership AOs value. It proves the student ' +
        'elevates others, not just themselves.',
      examples: [
        'Mentored 4 JV players in off-season; all 4 earned varsity starting positions',
        'Ran optional skill sessions for underclassmen; participants\' scoring improved 40%',
        'Partnered with freshmen during summer conditioning; team\'s preseason fitness test pass rate rose from 60% to 90%',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'mentored', 'coached', 'trained', 'taught', 'developed', 'worked with',
        'underclassmen', 'JV', 'freshmen', 'sessions', 'skill work',
      ],
    },
    {
      id: 'ath_multi_year_growth',
      pattern: 'documented_progression',
      description: 'Clear growth arc from entry level to peak achievement over time',
      whyItWorks:
        'A growth arc — from freshman walk-on to senior captain, or from JV to All-State — ' +
        'is a compelling narrative in itself. AOs read it as evidence that the student will ' +
        'continue growing in college. The trajectory matters as much as the endpoint.',
      examples: [
        'Walked on as freshman; earned starting position sophomore year; captain and All-Conference by senior year',
        'Progressed from 8th-place conference finisher to 2-time conference champion over 3 seasons',
        'Improved 100m time from 12.8s to 11.2s over 4 years through self-designed training program',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'freshman', 'sophomore', 'junior', 'senior', 'progressed', 'improved',
        'walked on', 'grew', 'advanced', 'earned', 'trajectory',
      ],
    },
    {
      id: 'ath_team_culture_contribution',
      pattern: 'culture_and_program_building',
      description: 'Creating or transforming team culture, traditions, or systems',
      whyItWorks:
        'Building something that outlasts your tenure — a training program, a team ' +
        'tradition, a mentorship system — shows leadership maturity. AOs recognize that ' +
        'institutional impact is harder and more meaningful than individual achievement.',
      examples: [
        'Created team mentorship program pairing varsity and JV players; adopted permanently by coaches',
        'Initiated community service requirement for team; 500+ volunteer hours in first year',
        'Designed strength and conditioning program still used by team 2 years later',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'created', 'established', 'initiated', 'designed', 'program',
        'tradition', 'culture', 'system', 'adopted', 'permanent',
      ],
    },
    {
      id: 'ath_dual_sport_excellence',
      pattern: 'multi_sport_competitive_distinction',
      description: 'Achieving high-level distinction in multiple sports',
      whyItWorks:
        'Multi-sport athletes who achieve real distinction (All-Conference in 2+ sports, ' +
        'varsity letters in 3 sports) demonstrate athletic versatility, time management, ' +
        'and raw ability that single-sport specialists don\'t. But this only works when ' +
        'the level of achievement in each sport is genuinely competitive.',
      examples: [
        'All-Conference in soccer and track; only student-athlete to earn both in 2024',
        '3-sport varsity athlete: football captain, basketball starter, track school record holder',
        'Lettered in 3 sports while maintaining 4.0 GPA; league MVP in tennis',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'multi-sport', 'two-sport', 'three-sport', 'dual sport', '3-sport',
        'multiple sports', 'varsity letters', 'lettered in',
      ],
    },
    {
      id: 'ath_school_record',
      pattern: 'historical_achievement',
      description: 'Setting or breaking school, conference, or state records',
      whyItWorks:
        'Records are the ultimate context provider — they compare the student against ' +
        'every athlete who has ever competed at that school or in that conference. A record ' +
        'that stood for 20 years communicates more than any single-season statistic.',
      examples: [
        'Broke school\'s 22-year-old record in 800m (1:55.3); 2nd fastest in state this season',
        'Set single-season scoring record (312 points); surpassed record held since 2008',
        'All-time career assists leader with 186, breaking previous record by 40%',
      ],
      signalStrength: 'strong',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'record', 'school record', 'all-time', 'broke', 'surpassed',
        'fastest', 'most', 'career', 'single-season', 'history',
      ],
    },
    {
      id: 'ath_coaching_certification',
      pattern: 'formalized_coaching_role',
      description: 'Coaching younger athletes in an organized, sustained capacity',
      whyItWorks:
        'Moving from athlete to coach — even informally — demonstrates knowledge depth, ' +
        'patience, and communication skills. When the coached athletes achieve measurable ' +
        'success, it validates the student\'s mastery of the sport at an instructional level.',
      examples: [
        'Volunteer assistant coach for middle school team; team improved from 2-8 to 7-3',
        'Certified as youth referee; officiated 40+ games across 3 recreational leagues',
        'Led summer training camp for 30 incoming freshmen; 85% made varsity or JV',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'impact',
      detectionKeywords: [
        'coach', 'assistant coach', 'referee', 'officiated', 'training camp',
        'youth', 'middle school', 'little league', 'certified',
      ],
    },
    {
      id: 'ath_recruitment_interest',
      pattern: 'collegiate_level_validation',
      description: 'Evidence of college-level athletic interest or commitment',
      whyItWorks:
        'College recruitment is the ultimate external validation of athletic ability. ' +
        'Even if a student doesn\'t ultimately play in college, being recruited — receiving ' +
        'official visits, being placed on interest lists, being scouted — proves a level ' +
        'of ability that is objectively rare.',
      examples: [
        'Recruited by 6 D1 programs; official visits to 3; committed to [University]',
        'Selected for showcase event attended by 40 college scouts',
        'Received interest from 12 D3 programs; chose to focus on academics at selective university',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'recruited', 'recruitment', 'D1', 'D2', 'D3', 'NAIA', 'committed',
        'scholarship', 'official visit', 'scout', 'showcase', 'commit',
      ],
    },
    {
      id: 'ath_time_management_evidence',
      pattern: 'athletic_academic_balance',
      description: 'Demonstrating the balance of athletics with academic or other commitments',
      whyItWorks:
        'When combined with specific academic achievements, athletic commitment becomes ' +
        'evidence of time management and prioritization. "Maintained 4.0 while starting ' +
        'all 22 games" is more impressive than either fact alone because it shows the ' +
        'student can handle competing demands — a core college skill.',
      examples: [
        'Varsity starter all 4 years while maintaining top 5% class rank',
        'Balanced 20+ hrs/week of training with 8 AP courses; All-Conference and National Merit',
        'Captain + team MVP while holding part-time job and volunteering 5 hrs/week',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'maintained', 'while', 'balanced', 'GPA', 'class rank', 'honor roll',
        'AP courses', 'academic', 'time management',
      ],
    },
  ],

  nameDropTraps: [
    {
      id: 'ath_varsity_without_context',
      pattern: 'Varsity athlete / Varsity letterman',
      whyStudentsUseIt:
        'Students believe "varsity" signals elite status and immediately communicates ' +
        'athletic competitiveness.',
      whyItFails:
        'At a school of 100 students, making varsity might mean being one of 12 who ' +
        'tried out. At a school of 3,000, it might mean surviving a cut from 80 to 15. ' +
        'AOs see "varsity" in nearly every application with sports. Without team ' +
        'competitiveness context, school size, or individual distinction, "varsity" ' +
        'communicates only participation.',
      betterAlternative:
        'Skip "varsity" as a headline and lead with your specific distinction: ' +
        'All-Conference, starter, top scorer, school record. The fact that you\'re ' +
        'varsity is implied by any meaningful athletic achievement.',
      example: {
        nameDrop: 'Varsity basketball player for three years. Contributed to team success.',
        improved: 'Starting guard 3 yrs; 18 PPG in 14-team conference; led team to first district title in 12 yrs',
        whatChanged:
          'Removed "varsity" as the lead and replaced with specific role (starting guard), ' +
          'contextualized statistics (18 PPG, 14-team conference), and historic team achievement.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 15,
      detectionKeywords: [
        'varsity', 'varsity athlete', 'varsity player', 'letterman',
        'letter winner', 'varsity letter',
      ],
    },
    {
      id: 'ath_captain_alone',
      pattern: 'Team captain / Co-captain',
      whyStudentsUseIt:
        'Captain is seen as the ultimate leadership credential in high school athletics. ' +
        'Students assume the title alone communicates leadership ability.',
      whyItFails:
        'AOs read "captain" tens of thousands of times per cycle. Many captains are elected ' +
        'by popularity, not merit. Many do nothing differently than non-captains. Without ' +
        'evidence of what the captaincy PRODUCED, the title communicates nothing more than ' +
        '"teammates liked me."',
      betterAlternative:
        'Use "Captain:" as a one-word prefix, then immediately describe the outcome. ' +
        '"Captain: improved team record from 5-7 to 11-1" transforms the title from ' +
        'a credential into evidence of impact.',
      example: {
        nameDrop: 'Captain of the varsity soccer team. Led the team with dedication and hard work.',
        improved: 'Captain: restructured training → team improved 4-8 to 10-2; 3 players earned All-Conference',
        whatChanged:
          'Kept the title as a prefix but immediately followed with three measurable outcomes: ' +
          'training improvement, record turnaround, and individual player development under leadership.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 10,
      detectionKeywords: [
        'captain', 'co-captain', 'team captain', 'elected captain',
        'named captain', 'senior captain',
      ],
    },
    {
      id: 'ath_stats_without_context',
      pattern: '.350 batting average / 15 goals / 200 rushing yards per game',
      whyStudentsUseIt:
        'Students assume raw statistics communicate athletic excellence because they ' +
        'understand sport-specific benchmarks.',
      whyItFails:
        'AOs are not scouts. ".350 batting average" means nothing without knowing the ' +
        'league quality, number of at-bats, or how it compares to the conference. ' +
        '15 goals in a 6-game season is different from 15 goals in a 20-game season. ' +
        'Every stat needs a denominator — league size, conference ranking, school record — ' +
        'to communicate meaning to a non-expert reader.',
      betterAlternative:
        'Frame every statistic relative to something: league ranking, conference standing, ' +
        'school history, or team context. "League-leading .380 average" or "broke school\'s ' +
        '15-year scoring record" provides the context that raw numbers lack.',
      example: {
        nameDrop: 'Scored 22 goals and 15 assists during the season',
        improved: 'Led 16-team conference in scoring (22 goals); broke school single-season record (est. 2011)',
        whatChanged:
          'Added conference context (16 teams), ranking (led), and historical context ' +
          '(broke school record). The same stats now communicate dominance, not just activity.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 0,
      detectionKeywords: [
        'goals', 'assists', 'points', 'average', 'batting', 'ERA',
        'rushing', 'passing', 'rebounds', 'scored', 'statistics', 'stats',
      ],
    },
    {
      id: 'ath_travel_club_prestige',
      pattern: 'Travel team / Club team / AAU team',
      whyStudentsUseIt:
        'Students believe that playing on a travel or club team signals higher-level ' +
        'competition beyond school sports.',
      whyItFails:
        'Most travel and club teams are pay-to-play — they select based on ability to ' +
        'pay the $2,000-5,000 fee, not athletic merit. AOs know this. Listing "travel team" ' +
        'without specifying the level, selection process, or competitive results can signal ' +
        'privilege rather than talent. There is a massive difference between a nationally ' +
        'ranked ECNL club and a local pay-to-play travel team.',
      betterAlternative:
        'Only mention club/travel if the LEVEL or RESULTS are the achievement. ' +
        '"ECNL club team, nationally ranked top 20" is meaningful. ' +
        '"Played on travel team" is not.',
      example: {
        nameDrop: 'Played on competitive travel soccer team during club season',
        improved: 'ECNL club team (nationally ranked top 25); started all 30 games; recruited by 4 D1 programs',
        whatChanged:
          'Added the specific league (ECNL, which is selective), national ranking, ' +
          'playing time evidence, and recruitment as external validation of the level.',
      },
      prevalence: 'common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'travel team', 'club team', 'AAU', 'select team', 'elite team',
        'competitive team', 'club season', 'travel ball',
      ],
    },
    {
      id: 'ath_state_qualifier_vague',
      pattern: 'State qualifier / Made it to states',
      whyStudentsUseIt:
        'Students assume that qualifying for a state-level competition is universally ' +
        'impressive and self-explanatory.',
      whyItFails:
        'State qualification thresholds vary enormously by sport and state. In some states ' +
        'and events, 50% of participants qualify for states. In others, it\'s the top 2%. ' +
        'Without specifying the sport, event, and how competitive the qualification path was, ' +
        '"state qualifier" is vague and potentially misleading.',
      betterAlternative:
        'Add context: what place or time qualified, how many competed at the qualifying meet, ' +
        'and what you achieved at states. "State qualifier" is the minimum; "placed 4th at states ' +
        'out of 120 competitors" tells the real story.',
      example: {
        nameDrop: 'Qualified for the state championship in track and field',
        improved: '4th at state championship in 400m (top 0.5% of state competitors); school record holder',
        whatChanged:
          'Added specific event (400m), placement (4th), selectivity percentage, ' +
          'and school record to contextualize the state-level achievement.',
      },
      prevalence: 'common',
      typicalCharWaste: 10,
      detectionKeywords: [
        'state qualifier', 'qualified for states', 'made states',
        'state championship', 'state tournament', 'sectionals',
      ],
    },
    {
      id: 'ath_sport_jargon',
      pattern: 'Sport-specific jargon (4-3-3 formation, Cover 2, double-double, etc.)',
      whyStudentsUseIt:
        'Students use technical terms to show insider knowledge and signal that they ' +
        'take the sport seriously at an advanced level.',
      whyItFails:
        'AOs are not coaches or scouts. Terms like "4-3-3 formation," "Cover 2 defense," ' +
        '"hat trick," or "double-double" require sport-specific knowledge to interpret. ' +
        'Characters spent on jargon are characters not spent on universally ' +
        'understandable impact language.',
      betterAlternative:
        'Translate jargon into outcomes. "Implemented defensive system that reduced ' +
        'opponent scoring by 30%" communicates more than "installed a Cover 2 defense."',
      example: {
        nameDrop: 'Ran a 4-3-3 formation and executed high-press tactics in midfield',
        improved: 'Implemented new team strategy; opponent scoring dropped 35%; went undefeated in conference',
        whatChanged:
          'Removed formation jargon. Replaced with the measurable OUTCOME of the strategy: ' +
          'reduced opponent scoring and an undefeated conference record.',
      },
      prevalence: 'common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'formation', 'defense', 'offense', 'press', 'zone', 'man-to-man',
        'hat trick', 'double-double', 'triple-double', 'play action',
        'Cover 2', 'zone read',
      ],
    },
    {
      id: 'ath_generic_teamwork_claim',
      pattern: 'Learned teamwork / Developed discipline / Built time management skills',
      whyStudentsUseIt:
        'Students want to articulate the personal growth sports gave them, which is ' +
        'legitimate — but the description is the wrong place for abstract claims.',
      whyItFails:
        'Every single athlete in every application could claim to have "learned teamwork" ' +
        'and "developed discipline." These are unfalsifiable, unquantifiable claims that ' +
        'waste 25-40 characters. AOs assume these benefits exist for all athletes. ' +
        'The description should show EVIDENCE of these traits through specific actions.',
      betterAlternative:
        'Show the trait through its results. "Organized 6am summer conditioning for 20 teammates" ' +
        'demonstrates discipline better than claiming "developed discipline through sports."',
      example: {
        nameDrop: 'Learned teamwork, discipline, and time management through varsity athletics',
        improved: 'Balanced 20-hr/wk training with 7 APs (4.0 GPA); organized team study sessions',
        whatChanged:
          'Replaced abstract trait claims with concrete evidence: specific time commitment, ' +
          'academic performance, and a proactive action that SHOWS the traits rather than naming them.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 35,
      detectionKeywords: [
        'teamwork', 'discipline', 'time management', 'hard work', 'dedication',
        'learned', 'developed', 'work ethic', 'perseverance', 'built character',
      ],
    },
    {
      id: 'ath_multi_sport_listing',
      pattern: 'Played football, basketball, and track',
      whyStudentsUseIt:
        'Students believe that listing multiple sports communicates versatility, ' +
        'time management, and well-roundedness.',
      whyItFails:
        'Each sport listed without context takes 15-20 characters. Three sports ' +
        'listed generically waste 45-60 characters saying only "I was busy." ' +
        'AOs would rather see one sport with depth than three with no distinction in any. ' +
        'Multi-sport status is only impressive if there\'s real achievement in each.',
      betterAlternative:
        'If multi-sport is the story, lead with the most impressive achievement in each ' +
        'sport, not the sport names. "All-Conference in 2 sports; only athlete to ' +
        'earn both in 2024" is powerful.',
      example: {
        nameDrop: 'Three-sport athlete: played football, basketball, and ran track',
        improved: 'All-Conference in football and track; only 3-sport athlete in school to earn 2 all-conference nods',
        whatChanged:
          'Replaced generic sport listing with specific achievement level in each and ' +
          'a distinctiveness claim (only student to earn dual all-conference selection).',
      },
      prevalence: 'common',
      typicalCharWaste: 30,
      detectionKeywords: [
        'three-sport', 'two-sport', 'multi-sport', 'played football',
        'played basketball', 'ran track', 'also played',
      ],
    },
    {
      id: 'ath_years_of_participation',
      pattern: '4-year varsity player / Played since freshman year',
      whyStudentsUseIt:
        'Students assume longevity automatically communicates dedication.',
      whyItFails:
        'Duration is captured in the Common App activities section\'s grade-level checkboxes. ' +
        'Restating it wastes characters. A 4-year player who was never a starter is less ' +
        'impressive than a 2-year player who earned All-State. Let the checkboxes ' +
        'handle duration and use the description for what you ACHIEVED.',
      betterAlternative:
        'Remove duration claims and replace with the best achievement from those years. ' +
        'If the growth arc IS the story, show it with start-to-end metrics.',
      example: {
        nameDrop: '4-year varsity swimmer. Dedicated member of the team since freshman year.',
        improved: 'Varsity 4 yrs: dropped 100m free from 58s to 49s; school record; state finalist',
        whatChanged:
          'Kept the 4-year fact but paired it with a growth metric (58s to 49s), ' +
          'a school record, and a competitive achievement. The duration now supports a narrative.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 25,
      detectionKeywords: [
        '4-year', 'since freshman', 'since 9th grade', 'all four years',
        'dedicated member', 'throughout high school',
      ],
    },
    {
      id: 'ath_award_name_without_context',
      pattern: 'MVP / Most Improved / Coach\'s Award',
      whyStudentsUseIt:
        'Students view team awards as important validations of their contribution.',
      whyItFails:
        'Team-level awards (MVP, Most Improved, Coach\'s Award) are given at every school. ' +
        'Without context about the team\'s competitiveness, these awards communicate ' +
        'internal recognition from a sample of 15-30 athletes. Conference, regional, or ' +
        'state-level awards carry far more weight. If using a team award, pair it with ' +
        'what earned it.',
      betterAlternative:
        'Team-level awards are worth one clause, not a headline. "Team MVP" should be ' +
        'followed by the specific achievement that earned it: "Team MVP after leading ' +
        'team in scoring with 24 PPG in 14-team conference."',
      example: {
        nameDrop: 'Received MVP award and Coach\'s Award for dedication to the team',
        improved: 'Team MVP: led conference in assists (8.2/game); Coach\'s Award for organizing summer training',
        whatChanged:
          'Kept the awards but added the specific statistical achievement and concrete action ' +
          'that earned them. Now the awards are evidence, not the whole story.',
      },
      prevalence: 'common',
      typicalCharWaste: 10,
      detectionKeywords: [
        'MVP', 'Most Improved', 'Coach\'s Award', 'Sportsmanship',
        'team award', 'received award', 'honored with',
      ],
    },
    {
      id: 'ath_practice_hours',
      pattern: 'Practiced 20 hours per week / Daily 6 AM practices',
      whyStudentsUseIt:
        'Students want to convey the intensity and commitment of their training schedule.',
      whyItFails:
        'Every serious athlete practices intensively. Listing practice hours is like ' +
        'a student saying they studied for exams. It describes the universal input, ' +
        'not the distinctive output. AOs don\'t need to know your schedule — they need ' +
        'to know what the schedule produced.',
      betterAlternative:
        'Only mention training intensity if you can tie it to a result: ' +
        '"200 hrs of off-season training → improved 400m time by 3 seconds → state qualifier." ' +
        'Input + output = credible commitment.',
      example: {
        nameDrop: 'Practiced 25 hours per week during season with daily 6 AM conditioning',
        improved: 'Year-round training: improved mile from 5:20 to 4:38; qualified for state championship',
        whatChanged:
          'Replaced the practice schedule with the measurable improvement it produced ' +
          'and the competitive milestone it enabled.',
      },
      prevalence: 'common',
      typicalCharWaste: 25,
      detectionKeywords: [
        'practiced', 'hours per week', '6 AM', 'daily', 'conditioning',
        'training hours', 'practices', 'workouts',
      ],
    },
  ],

  proofOfWorkPatterns: [
    {
      id: 'ath_pow_measurable_improvement',
      pattern: 'Quantified personal performance improvement over time',
      whyItProves:
        'Time-based personal records and improvement metrics are the hardest data to ' +
        'fabricate in athletics. "Improved 100m from 12.8s to 11.2s" is verifiable against ' +
        'meet results and shows dedicated training. The improvement magnitude and the ' +
        'final level together prove both commitment and ability.',
      examples: [
        'Dropped 100m free from 1:02 to 0:52 over 4 seasons',
        'Improved mile time from 5:45 freshman year to 4:32 senior year',
        'Went from shooting 65% free throws to 89% through self-designed practice regimen',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student is systematically working to improve — the kind of growth mindset ' +
        'that translates directly to academic and professional success.',
    },
    {
      id: 'ath_pow_training_design',
      pattern: 'Designing or modifying training approaches with rationale',
      whyItProves:
        'Only an athlete who deeply understands their sport and their own weaknesses ' +
        'can design a targeted training approach. "Added plyometric training to address ' +
        'vertical jump deficit" reveals analytical thinking applied to performance.',
      examples: [
        'Designed supplemental speed program targeting hamstring mechanics; cut 0.3s from 40-yard dash',
        'Researched periodization training; implemented for team with coach approval; peak performance improved at key meets',
        'Created sport-specific yoga routine addressing shoulder mobility; reduced injury rate during throwing season',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student approaches their sport analytically — they problem-solve their own ' +
        'development rather than just following coach instructions.',
    },
    {
      id: 'ath_pow_game_analysis',
      pattern: 'Studying film or opponents and adapting strategy',
      whyItProves:
        'Film study and opponent analysis show that the athlete engages with ' +
        'the sport intellectually, not just physically. This level of preparation ' +
        'reveals the depth of commitment that separates serious athletes from casual participants.',
      examples: [
        'Analyzed film of 8 upcoming opponents; created scouting reports adopted by coaching staff',
        'Studied own game film to identify tendency patterns; changed approach and raised batting average 60 points',
        'Built spreadsheet tracking opponent tendencies; team won 80% of games with scouting reports vs. 50% without',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student thinks about their sport beyond the physical — they apply analytical ' +
        'skills that will translate to academic research and problem-solving.',
    },
    {
      id: 'ath_pow_injury_management',
      pattern: 'Managing and recovering from specific injury with documented return',
      whyItProves:
        'Injury recovery narratives that include specific rehabilitation steps, timeline, ' +
        'and post-recovery performance prove resilience in the most concrete way possible. ' +
        'Only someone who went through it can describe the process authentically.',
      examples: [
        'Tore ACL in sophomore season; completed 9-month rehab; started all 20 games junior year',
        'Fractured wrist in October; adapted to off-hand shooting; returned to full strength by playoffs',
        'Managed chronic shin splints through modified training; still competed in 12 meets senior season',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student handles adversity with maturity and determination — the kind of ' +
        'resilience that predicts success through college challenges.',
    },
    {
      id: 'ath_pow_team_turnaround',
      pattern: 'Contributing to a specific team-level turnaround or milestone',
      whyItProves:
        'When a team achieves something historic (first championship in 20 years, first ' +
        'winning season in a decade) and the student can articulate their specific contribution ' +
        'to that turnaround, it proves meaningful impact beyond individual stats.',
      examples: [
        'Helped transform team from 2-10 to 10-2 by initiating off-season conditioning program',
        'Part of first team in school history to win conference championship; led team in assists',
        'Organized team-building and accountability system; undefeated at home for first time in 15 years',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student was part of — and contributed to — something larger than themselves. ' +
        'They understand how individual effort creates collective outcomes.',
    },
    {
      id: 'ath_pow_recruiting_process',
      pattern: 'Navigating the college athletic recruiting process',
      whyItProves:
        'Students who describe the recruiting process authentically — attending showcases, ' +
        'communicating with coaches, making official visits — reveal genuine high-level ' +
        'athletic ability. The recruiting process itself is external validation.',
      examples: [
        'Attended 5 college showcases; received interest from 12 D3 programs; committed to [University]',
        'Created highlight reel; contacted 30 college coaches; received 6 official visit offers',
        'Participated in national prospect camp; selected for all-star game scouted by 20+ college programs',
      ],
      expertiseLevel: 'expert',
      aoInterpretation:
        'This student\'s athletic ability has been validated by college-level ' +
        'programs — the most objective external standard available.',
    },
    {
      id: 'ath_pow_community_building',
      pattern: 'Using athletic platform for community impact',
      whyItProves:
        'Athletes who extend their sport into community service — youth clinics, adaptive ' +
        'programs, fundraising, equipment drives — demonstrate that sport has shaped their ' +
        'values beyond personal achievement. This cannot be faked because it requires ' +
        'sustained, organized effort with no competitive benefit.',
      examples: [
        'Founded youth basketball league serving 80 kids from underserved neighborhoods',
        'Organized annual equipment drive collecting 500+ items for Title I school sports programs',
        'Launched adaptive swimming program for children with physical disabilities; trained 3 volunteer coaches',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student uses their athletic skills and platform to create opportunity ' +
        'for others — the definition of community leadership.',
    },
    {
      id: 'ath_pow_official_recognition',
      pattern: 'Earning recognition from official bodies outside the school',
      whyItProves:
        'External recognition (All-Conference, All-State, scholar-athlete awards from ' +
        'state associations, national honors) provides independent validation that is ' +
        'harder to fabricate than school-level awards. These are comparative judgments ' +
        'made by people outside the student\'s immediate community.',
      examples: [
        'First-team All-Conference (14-team league) as sophomore — youngest selection in 8 years',
        'State Association Scholar-Athlete Award: top academic performer among all-state athletes',
        'National Soccer Coaches Association Academic All-American',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'External bodies — coaches, league officials, state associations — have evaluated ' +
        'this student and found them exceptional. This is independent, credentialed validation.',
    },
  ],

  descriptionTransforms: [
    {
      id: 'ath_transform_varsity_to_impact',
      transformType: 'generic_to_specific',
      before: 'Varsity basketball player. Contributed to team success.',
      after: 'Starting guard 3 yrs: 18 PPG in 14-team league; led team to first district title in 12 yrs',
      explanation:
        'Removed generic "varsity player" label and "contributed to team success." ' +
        'Added specific position, scoring context, league size, and historic achievement.',
      charsBefore: 51,
      charsAfter: 78,
      principle: 'Specificity is signal — generic labels and vague claims are noise',
    },
    {
      id: 'ath_transform_captain_to_outcomes',
      transformType: 'duty_to_achievement',
      before: 'Captain of the soccer team. Led practices and motivated teammates.',
      after: 'Captain: restructured training → record improved 4-8 to 10-2; 3 players earned All-Conference',
      explanation:
        'Kept "Captain" as a one-word prefix and replaced duty descriptions with ' +
        'three measurable leadership outcomes: training change, record improvement, ' +
        'and individual player development.',
      charsBefore: 57,
      charsAfter: 80,
      principle: 'Leadership titles need outcomes — what did your captaincy produce?',
    },
    {
      id: 'ath_transform_stats_to_context',
      transformType: 'claim_to_evidence',
      before: 'Scored 22 goals and had 15 assists this season',
      after: 'Led 16-team conference in scoring (22G/15A); broke 13-year-old school record',
      explanation:
        'Same stats, but now framed within conference context (16 teams, conference-leading) ' +
        'and historical context (school record). The stats mean something now.',
      charsBefore: 49,
      charsAfter: 70,
      principle: 'Context transforms numbers into narrative — always add the denominator',
    },
    {
      id: 'ath_transform_travel_team',
      transformType: 'name_drop_to_impact',
      before: 'Played on competitive club travel team during off-season',
      after: 'ECNL club (nationally ranked top 30); started all 28 games; recruited by 4 D1 programs',
      explanation:
        'Replaced generic "club travel team" with specific league (ECNL), national ranking, ' +
        'playing time evidence, and recruitment as external validation.',
      charsBefore: 51,
      charsAfter: 76,
      principle: 'Name the league level, not just "travel team" — specificity proves selectivity',
    },
    {
      id: 'ath_transform_teamwork_claim',
      transformType: 'claim_to_evidence',
      before: 'Learned valuable lessons about teamwork and discipline through athletics',
      after: 'Organized 6am summer conditioning for 20 teammates; all returned in top shape for season',
      explanation:
        'Replaced abstract trait claims with a concrete action that DEMONSTRATES ' +
        'teamwork and discipline more powerfully than claiming them.',
      charsBefore: 61,
      charsAfter: 79,
      principle: 'Show character traits through actions, not declarations',
    },
    {
      id: 'ath_transform_injury_narrative',
      transformType: 'passive_to_active',
      before: 'Suffered a knee injury but came back to play senior year',
      after: 'Returned from ACL tear: 9-month rehab → started all 22 games → earned All-Conference',
      explanation:
        'Transformed passive injury mention into an active recovery narrative with ' +
        'specific timeline, playing time evidence, and post-recovery distinction.',
      charsBefore: 52,
      charsAfter: 75,
      principle: 'Adversity narratives need specifics: the injury, the work, and the result',
    },
    {
      id: 'ath_transform_practice_hours',
      transformType: 'generic_to_specific',
      before: 'Practiced 25 hours per week with daily morning training sessions',
      after: 'Year-round training: dropped 400m from 56s to 49s; state qualifier; school record',
      explanation:
        'Replaced practice schedule (input) with performance improvement (output). ' +
        'The dedication is now proved by results, not claimed through hours.',
      charsBefore: 57,
      charsAfter: 72,
      principle: 'Results prove dedication better than schedules — show the output, not the input',
    },
    {
      id: 'ath_transform_multi_sport',
      transformType: 'name_drop_to_impact',
      before: 'Three-sport athlete: football, basketball, and track and field',
      after: 'All-Conference in football and track; only 3-sport athlete to earn dual all-conference honors',
      explanation:
        'Replaced sport listing with specific achievement level in each and ' +
        'a uniqueness claim that contextualizes the multi-sport accomplishment.',
      charsBefore: 54,
      charsAfter: 80,
      principle: 'Multi-sport is impressive only when each sport has real achievement — name the honors, not the sports',
    },
    {
      id: 'ath_transform_community_generic',
      transformType: 'passive_to_active',
      before: 'Volunteered at youth sports events in the community',
      after: 'Founded youth basketball clinic: 60 kids weekly over 2 summers; donated 200 pieces of equipment',
      explanation:
        'Replaced vague volunteering with a specific, founded initiative with ' +
        'participation numbers, duration, and tangible resource contribution.',
      charsBefore: 50,
      charsAfter: 82,
      principle: 'Community impact needs specifics: what you built, who you served, and how many',
    },
    {
      id: 'ath_transform_award_listing',
      transformType: 'claim_to_evidence',
      before: 'Received MVP award and All-League honors during senior season',
      after: 'MVP + All-League: led conference in assists (8.4/game) while organizing team community service',
      explanation:
        'Kept the awards but added the specific achievement that earned them and ' +
        'a leadership dimension (community service) that provides character evidence.',
      charsBefore: 55,
      charsAfter: 81,
      principle: 'Awards are evidence OF something — show what you did to earn them',
    },
    {
      id: 'ath_transform_jargon_to_result',
      transformType: 'jargon_to_outcome',
      before: 'Played center midfielder in a 4-3-3 system with high-press tactics',
      after: 'Starting midfielder: team led conference in possession; went 11-1 in league play',
      explanation:
        'Removed tactical jargon (4-3-3, high-press) that only soccer experts understand. ' +
        'Replaced with team-level results that communicate success universally.',
      charsBefore: 58,
      charsAfter: 73,
      principle: 'AOs are not coaches — translate tactics into outcomes they can evaluate',
    },
  ],

  verbHierarchy: [
    {
      tier: 'power',
      verbs: [
        'earned', 'led', 'founded', 'transformed', 'broke',
        'recruited', 'captained', 'organized', 'designed', 'qualified',
      ],
      context:
        'In athletics, power verbs signal EARNED distinction, leadership that produced change, ' +
        'and competitive advancement. "Earned" implies selection or merit. "Led" implies direction ' +
        'with results. "Broke" implies record-setting. "Founded" and "organized" show initiative ' +
        'beyond the sport itself. "Recruited" implies external institutional validation.',
      exampleUsage:
        'Earned All-Conference; led team to first championship in 12 years; broke school record; founded youth clinic',
    },
    {
      tier: 'standard',
      verbs: [
        'competed', 'scored', 'started', 'played', 'trained',
        'ran', 'swam', 'threw', 'defended', 'assisted',
      ],
      context:
        'Standard athletic verbs describe the activity itself — they are accurate but ' +
        'not differentiating. "Competed" and "played" describe what every athlete does. ' +
        '"Scored" and "assisted" are specific but need statistical context to communicate ' +
        'anything meaningful. Use these as supporting language, not as headlines.',
      exampleUsage:
        'Competed in 22 matches during the season and scored 15 goals',
    },
    {
      tier: 'weak',
      verbs: [
        'participated', 'was a member of', 'joined', 'attended',
        'was on the team', 'tried out for', 'worked hard at',
        'dedicated myself to', 'was involved in', 'contributed to',
      ],
      context:
        'Weak athletic verbs communicate attendance or effort claims rather than achievement. ' +
        '"Participated in" and "was a member of" confirm only that the student was present. ' +
        '"Worked hard at" and "dedicated myself to" are self-assessed effort claims that ' +
        'every athlete makes. These verbs waste characters on zero-signal information.',
      exampleUsage:
        'Participated in varsity football and was a member of the track team',
    },
  ],

  roleExpertise: [
    {
      role: 'Team Captain / Co-Captain',
      expectedSignals: [
        'Specific team outcomes during captaincy (record improvement, milestones reached)',
        'Player development — helping teammates improve with measurable results',
        'Off-field leadership: organizing off-season training, team bonding, community service',
        'Communication between coaching staff and players',
      ],
      differentiators: [
        'Team turnaround directly attributable to captain\'s initiatives (new training programs, culture changes)',
        'Multiple teammates earning individual recognition under the captain\'s leadership',
        'Founding sustainable programs that outlast the captain\'s tenure (mentorship systems, conditioning programs)',
        'Managing team through adversity (losing streaks, player conflicts, coaching changes)',
        'Earning captain role through merit despite being a non-obvious choice',
      ],
      overclaimingRisks: [
        'Claiming team success entirely as a personal leadership achievement',
        'Overstating the captain\'s role in coaching decisions made by the adult coach',
        'Presenting captain selection as a competitive achievement when it was rotation-based',
        'Describing duties (leading warm-ups, coin tosses) as leadership impact',
      ],
      authenticPatterns: [
        'Captain: initiated off-season training → team improved from 3-9 to 10-2; 4 players earned All-Conference',
        'Co-Captain: organized weekly film study; team\'s win rate in close games improved from 20% to 75%',
        'Captain: created mentorship program pairing varsity with JV; 8 JV players made varsity next season',
      ],
    },
    {
      role: 'Varsity Starter (non-captain)',
      expectedSignals: [
        'Performance statistics with league or conference context',
        'Growth trajectory from JV or bench to starter',
        'Individual recognition (All-Conference, team awards)',
        'Contribution to team success (specific plays, games, or moments)',
      ],
      differentiators: [
        'Conference or state-level individual honors',
        'School or conference records',
        'College recruitment interest',
        'Statistical dominance in specific categories',
        'Versatility — contributing in multiple positions or roles',
      ],
      overclaimingRisks: [
        'Inflating statistics or removing context that would diminish them',
        'Claiming All-Conference when it was honorable mention or team-selected',
        'Overstating school-level achievements as if they were regional or state-level',
        'Presenting travel/club team stats as equivalent to high school varsity',
      ],
      authenticPatterns: [
        'Starting midfielder 3 yrs: led conference in assists (8.2/game); team won conference 2 of 3 yrs',
        'Improved 100m from 12.8 to 11.2 over 4 seasons; All-Conference junior and senior year',
        'Starting catcher; threw out 68% of base stealers (conference best); helped team to state quarterfinals',
      ],
    },
    {
      role: 'Individual Sport Competitor (Track, Swimming, Tennis, etc.)',
      expectedSignals: [
        'Personal records or times with improvement trajectory',
        'Placement at meets or tournaments with field context',
        'Qualification for higher-level competition (regionals, states, nationals)',
        'School or conference records held',
      ],
      differentiators: [
        'State-level placement with ranking context',
        'National-level qualification or ranking',
        'Sustained improvement across multiple seasons showing training discipline',
        'Coaching or mentoring younger athletes in the sport',
        'Breaking long-standing records',
      ],
      overclaimingRisks: [
        'Presenting inflated times/distances not supported by meet results',
        'Overstating the competitiveness of small meets or invitationals',
        'Claiming "state qualifier" when the qualification threshold is not selective',
        'Listing personal bests without competitive context',
      ],
      authenticPatterns: [
        'State finalist in 400m (4th of 48); school record holder; improved from 56s to 49s over 4 years',
        '#1 singles tennis: 42-8 career record; conference champion 2 years; state quarterfinals',
        'All-State swimmer in 200 IM; dropped from 2:15 to 1:58; recruited by 3 D3 programs',
      ],
    },
    {
      role: 'Recreational/Fitness Athlete',
      expectedSignals: [
        'Sustained commitment and personal goals achieved',
        'Discipline and structure in training approach',
        'Personal milestones (marathon completion, specific weight/fitness goals)',
        'Community involvement through the activity',
      ],
      differentiators: [
        'Organizing community fitness events or groups',
        'Teaching or coaching others in the activity',
        'Significant personal transformation with measurable results',
        'Connecting the activity to broader service or community impact',
        'Completing notably challenging events (ultramarathon, triathlon, etc.)',
      ],
      overclaimingRisks: [
        'Presenting casual exercise as competitive athletics',
        'Inflating fitness achievements to sound more impressive than they are',
        'Claiming expertise without any competitive or external validation',
        'Using athletic language for what is essentially a hobby',
      ],
      authenticPatterns: [
        'Trained for and completed first marathon (3:42) while raising $5K for cancer research',
        'Founded running club (25 members); organized weekly 5K community runs for 2 years',
        'Self-taught rock climbing; led 12 youth climbing trips for Boys & Girls Club',
      ],
    },
    {
      role: 'Youth Coach / Sports Volunteer',
      expectedSignals: [
        'Number of youth athletes coached or mentored',
        'Duration and consistency of coaching commitment',
        'Specific coaching activities (drills, game management, skill instruction)',
        'Program they coached within (recreation league, school team, community program)',
      ],
      differentiators: [
        'Youth athletes achieving competitive success under the student\'s coaching',
        'Creating or growing a youth program from scratch',
        'Earning coaching certifications or referee credentials',
        'Serving underserved communities through sports access',
        'Innovative coaching approaches with measurable player improvement',
      ],
      overclaimingRisks: [
        'Claiming "head coach" when actually assisting an adult coach',
        'Overstating the competitiveness of recreational youth leagues',
        'Presenting one-time volunteer events as sustained coaching commitments',
        'Claiming player development outcomes that were primarily due to other coaches',
      ],
      authenticPatterns: [
        'Volunteer coach, middle school basketball: team improved from 2-8 to 7-3 under 2-year tenure',
        'Certified youth referee; officiated 40+ games across 3 recreational leagues over 2 seasons',
        'Founded summer soccer camp for 50 elementary students; raised $2K in sponsorships to make it free',
      ],
    },
  ],

  jargonExceptions: [
    {
      pattern: 'All-Conference / All-State / All-American',
      whyItsTheException:
        'These are universally recognized designations in high school athletics that AOs ' +
        'immediately understand. They represent increasing tiers of competitive distinction ' +
        '(conference → state → national) and communicate achievement level more efficiently ' +
        'than any alternative phrasing. Naming them IS communicating the distinction.',
      example: 'First-team All-Conference (14 teams) as sophomore; 2x All-State; All-American nominee',
    },
    {
      pattern: 'D1/D2/D3/NAIA recruitment or commitment',
      whyItsTheException:
        'NCAA division classifications (D1, D2, D3) and NAIA are universally understood ' +
        'by AOs as indicators of athletic level. "Recruited by D1 programs" communicates ' +
        'elite-level ability instantly. These are not jargon but standard institutional ' +
        'classifications that AOs use daily in their own admissions work.',
      example: 'Recruited by 6 D1 programs; committed to [University] on full athletic scholarship',
    },
    {
      pattern: 'Specific recognized tournament/championship names (state championship, nationals, etc.)',
      whyItsTheException:
        'Official championship designations (state championship, national qualifier, conference ' +
        'finals) are self-explanatory competitive milestones. Unlike team-internal jargon, ' +
        'these terms describe universally understood competitive tiers that AOs can immediately ' +
        'evaluate without sport-specific knowledge.',
      example: 'State championship finalist; 3x conference champion; national qualifier in individual event',
    },
    {
      pattern: 'Specific national-level club league names (ECNL, MLS NEXT, Elite Hockey)',
      whyItsTheException:
        'Top-tier club leagues like ECNL (soccer), MLS NEXT, and similar national-level ' +
        'organizations have known selectivity and competitive standards that AOs at sports-aware ' +
        'institutions recognize. Naming the specific league distinguishes genuinely selective ' +
        'programs from generic "travel teams." The league name IS the proof of selectivity.',
      example: 'ECNL club (nationally ranked top 20); started all 30 games; identified by US Soccer Development Academy',
    },
    {
      pattern: 'PR (Personal Record) with specific times/distances in individual sports',
      whyItsTheException:
        'In individual sports like track, swimming, and cross-country, times and distances ' +
        'ARE the achievement. "4:32 mile" or "11.2 100m" communicates ability level precisely ' +
        'and is often more meaningful than placement (which depends on the field). AOs evaluating ' +
        'recruited athletes and coaches receiving supplemental materials understand these metrics.',
      example: 'PR of 4:28 in 1600m (school record); 11.1 100m; state qualifier in both events',
    },
  ],
};
