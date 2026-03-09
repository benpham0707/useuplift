/**
 * Expertise Signaling Library — Debate, Speech & Forensics
 *
 * Covers: Policy Debate (CX), Lincoln-Douglas (LD), Public Forum (PF),
 * Congressional Debate, Speech/Individual Events (IE), Model UN, Mock Trial.
 *
 * Key insight for this domain: Debate/speech activities are uniquely
 * quantifiable — win records, tournament placements, speaker points,
 * and qualification thresholds are all verifiable. AOs know this and
 * expect specifics. Vague debate descriptions are an immediate credibility
 * red flag because the data ALWAYS exists.
 *
 * Sources: NSDA membership data, TOC bid structure, NDCA rankings,
 * AO published preferences (MIT, Stanford, Georgetown admissions blogs),
 * Sara Harberson insights, forensics coaching communities.
 */

import type { ExpertiseDomain } from '../types';

export const DEBATE_SPEECH_DOMAIN: ExpertiseDomain = {
  domainId: 'debate_speech',
  label: 'Debate, Speech & Forensics',
  overview:
    'Forensics activities are among the most quantifiable extracurriculars — ' +
    'win records, speaker awards, tournament placements, and qualification ladders ' +
    'provide concrete proof of depth. AOs value critical thinking, persuasion, ' +
    'research rigor, and intellectual range. They see through vague claims instantly ' +
    'because specific data always exists in this domain. The strongest descriptions ' +
    'show competitive results, teaching/mentorship, and the intellectual substance ' +
    'behind the competition.',

  aoExpectations: {
    whatRegisters: [
      'Specific competitive results with context (placement out of field size)',
      'Sustained commitment shown through career records and multi-year growth arcs',
      'Teaching or coaching component that multiplies the student\'s impact beyond themselves',
      'Intellectual depth — developing original arguments, not just running prewritten briefs',
      'Leadership within the team that produced measurable outcomes (more qualifiers, team growth)',
      'Qualification to prestigious elimination rounds (TOC, NSDA Nationals, state finals)',
    ],
    whatAOsSeeThrough: [
      'Listing the debate format without results ("I do Policy Debate")',
      'Name-dropping prestigious tournaments without clarifying attend vs. compete vs. win',
      'Describing the resolution topic as if AOs care about the content of the debate',
      'Claiming "captain" without showing what captaincy produced',
      'Padding with debate jargon (spreading, K, T, RVI) that communicates nothing to non-debaters',
    ],
    goldenQuestion:
      'Did this student demonstrate exceptional critical thinking and the ability to ' +
      'engage complex issues — or did they just show up to tournaments?',
    readingTimeContext:
      'AOs spend ~10 seconds on each activity. Debate descriptions that open with format ' +
      'names or resolution topics waste the first 3 seconds on information that adds no value. ' +
      'Lead with the result or the scale of impact.',
    competitiveContext:
      'Over 150,000 students compete in NSDA-sanctioned events nationally. Merely participating ' +
      'is not distinctive. State qualifiers represent roughly the top 15-20%, and national ' +
      'qualifiers the top 2-3%. TOC qualifiers are the top ~0.5%. AOs calibrate accordingly.',
  },

  realExpertiseSignals: [
    {
      id: 'ds_tournament_results_with_context',
      pattern: 'tournament_result_context',
      description: 'Placement stated with field size and tournament prestige level',
      whyItWorks:
        'Contextualizes the achievement — "semifinalist" means nothing without knowing ' +
        'how many competitors there were. A quarterfinal at a 200-team tournament outweighs ' +
        'a final at a 16-team local.',
      examples: [
        'Quarterfinalist at Glenbrooks (top 8 of 180 teams)',
        'Octofinalist at Harvard, largest tournament in the country (256 entries)',
        'Won 3 of 5 bid tournaments, qualifying to TOC in junior year',
      ],
      signalStrength: 'strong',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'quarterfinalist', 'semifinalist', 'finalist', 'octofinalist', 'top',
        'out of', 'field of', 'entries', 'teams', 'bid', 'TOC', 'qualifier',
      ],
    },
    {
      id: 'ds_career_record',
      pattern: 'quantified_win_record',
      description: 'Career win-loss record across a meaningful sample of rounds',
      whyItWorks:
        'A career record is the hardest metric to fake and the easiest for AOs to ' +
        'calibrate. It shows sustained performance, not a single lucky break. 70%+ ' +
        'win rate across 30+ tournaments signals genuine skill.',
      examples: [
        '72-15 career record across 28 tournaments',
        '84% win rate in prelim rounds over 3 varsity seasons',
        'Undefeated in 14 consecutive preliminary rounds leading into states',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'record', 'win', 'loss', 'career', 'rounds', 'win rate', 'undefeated',
        'prelim', 'preliminary',
      ],
    },
    {
      id: 'ds_coaching_multiplier',
      pattern: 'teaching_coaching_impact',
      description: 'Teaching or coaching younger debaters with quantified results',
      whyItWorks:
        'Moving from competitor to teacher is a maturity signal that AOs value heavily. ' +
        'It shows leadership, knowledge depth (you must truly understand to teach), ' +
        'and community investment. Quantified student outcomes make it concrete.',
      examples: [
        'Coached 8 novice debaters; 5 qualified for state tournament',
        'Created training curriculum adopted by 3 other schools in our league',
        'Mentored JV team from 0 wins to league champions in one season',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'coached', 'mentored', 'trained', 'taught', 'novice', 'curriculum',
        'adopted', 'JV', 'junior varsity', 'mentorship',
      ],
    },
    {
      id: 'ds_original_argument',
      pattern: 'intellectual_ownership',
      description: 'Developing original cases or arguments that others adopted',
      whyItWorks:
        'Writing your own case — rather than running a coach-written brief — demonstrates ' +
        'intellectual ownership and research depth. When other teams adopt your argument, ' +
        'it validates the quality. This separates thinkers from performers.',
      examples: [
        'Wrote affirmative case on water privatization adopted by 12 teams nationally',
        'Developed original kritik framework cited in 3 published debate handbooks',
        'Authored 400-page evidence compilation on healthcare policy used by team for 2 seasons',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'wrote', 'authored', 'developed', 'original', 'case', 'argument',
        'adopted', 'cited', 'framework', 'evidence', 'compiled',
      ],
    },
    {
      id: 'ds_speaker_awards',
      pattern: 'individual_recognition',
      description: 'Speaker points or individual awards at tournaments',
      whyItWorks:
        'Speaker awards distinguish individual excellence from team success. ' +
        'Top speaker at a major tournament requires both argumentation skill ' +
        'and communication quality — exactly the combination AOs look for.',
      examples: [
        'Top speaker at 4 tournaments, averaging 29.2/30 speaker points',
        '2nd overall speaker at NSDA Nationals in Original Oratory',
        'Named Outstanding Attorney at 3 mock trial invitational tournaments',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'speaker', 'speaker points', 'top speaker', 'outstanding', 'best',
        'orator', 'attorney', 'advocate', 'witness',
      ],
    },
    {
      id: 'ds_qualification_ladder',
      pattern: 'progressive_qualification',
      description: 'Advancement through competitive qualification tiers',
      whyItWorks:
        'Qualification ladders (local > district > state > national > TOC) are ' +
        'universally understood hierarchies. Reaching each successive level is ' +
        'exponentially harder. AOs immediately understand the achievement level.',
      examples: [
        'Qualified to NSDA Nationals 3 consecutive years, reaching elimination rounds twice',
        'Earned 5 TOC bids across LD and PF, qualifying as a junior',
        'Advanced from novice to state champion in 18 months',
      ],
      signalStrength: 'strong',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'qualified', 'nationals', 'state', 'district', 'TOC', 'bid',
        'elimination', 'advancement', 'consecutive',
      ],
    },
    {
      id: 'ds_research_depth',
      pattern: 'research_rigor',
      description: 'Evidence of deep, sustained research beyond surface-level prep',
      whyItWorks:
        'Policy debate requires hundreds of hours of research. Showing the scale of ' +
        'research work — pages compiled, sources analyzed, policy areas mastered — ' +
        'demonstrates intellectual seriousness that transcends the activity itself.',
      examples: [
        'Compiled 500+ pages of evidence on renewable energy policy for season-long case',
        'Researched 40+ academic journals on criminal justice reform for affirmative case',
        'Built evidence database used by 15-member team, updated weekly for 2 seasons',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'research', 'evidence', 'sources', 'compiled', 'database', 'journals',
        'policy', 'analysis', 'pages', 'academic',
      ],
    },
    {
      id: 'ds_adaptation_growth',
      pattern: 'strategic_adaptation',
      description: 'Adapting strategy based on feedback or competitive analysis',
      whyItWorks:
        'Describes a learning arc, not just a result. Showing that you analyzed losses, ' +
        'incorporated judge feedback, or restructured your approach proves metacognition ' +
        '— the ability to learn from failure that AOs prize.',
      examples: [
        'Restructured case strategy after 0-4 start; finished season 18-6',
        'Analyzed judge paradigms to adapt argumentation style, improving win rate 30%',
        'Shifted from speed-focused delivery to persuasion-first after judge feedback',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'adapted', 'restructured', 'improved', 'feedback', 'shifted',
        'analyzed', 'strategy', 'approach', 'paradigm',
      ],
    },
    {
      id: 'ds_team_building',
      pattern: 'program_development',
      description: 'Building or growing a debate program, not just competing in one',
      whyItWorks:
        'Growing a program from 4 to 20 members, or founding a team where none existed, ' +
        'shows entrepreneurial initiative and community impact that far exceeds individual ' +
        'competitive success.',
      examples: [
        'Founded school\'s first debate team; grew from 4 to 22 members in 2 years',
        'Recruited 15 new members and secured $3,000 in funding for tournament fees',
        'Organized school\'s first invitational tournament, hosting 16 teams from 8 schools',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'founded', 'grew', 'recruited', 'organized', 'program', 'funding',
        'members', 'invitational', 'hosted', 'established',
      ],
    },
    {
      id: 'ds_community_impact',
      pattern: 'beyond_competition',
      description: 'Using debate skills for community benefit beyond the competitive circuit',
      whyItWorks:
        'Applying forensics skills outside competition — teaching public speaking at ' +
        'community centers, running workshops for underserved schools, or using research ' +
        'skills for civic engagement — shows that the activity shaped the person, not just the resume.',
      examples: [
        'Led public speaking workshops at 3 Title I middle schools, reaching 120 students',
        'Used policy research skills to testify at city council hearing on transit equity',
        'Organized inter-school debate exhibition on local ballot measures for 200 community members',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'workshop', 'community', 'taught', 'schools', 'civic', 'testified',
        'public speaking', 'underserved', 'outreach',
      ],
    },
    {
      id: 'ds_best_delegate',
      pattern: 'model_un_distinction',
      description: 'Model UN awards with committee and conference context',
      whyItWorks:
        'Best Delegate at a competitive conference (HMUN, YMUN, BMUN) with committee ' +
        'specified is meaningful. It shows diplomatic skill, research depth on a specific ' +
        'country/topic, and the ability to build consensus — not just attendance.',
      examples: [
        'Best Delegate, DISEC committee at Harvard Model UN (180 delegates)',
        'Won Outstanding Delegate at 5 conferences representing complex crisis committees',
        'Head Delegate coordinating 12-member team to Best Large Delegation at YMUN',
      ],
      signalStrength: 'strong',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'Best Delegate', 'Outstanding Delegate', 'committee', 'HMUN', 'YMUN',
        'BMUN', 'crisis', 'delegation', 'Head Delegate',
      ],
    },
    {
      id: 'ds_mock_trial_role',
      pattern: 'mock_trial_specificity',
      description: 'Mock trial role with performance context and case outcomes',
      whyItWorks:
        'Mock trial roles (attorney, witness) have distinct skill profiles. Specifying ' +
        'the role, performance quality (Outstanding Attorney awards), and team outcomes ' +
        'shows both individual excellence and collaborative achievement.',
      examples: [
        'Lead attorney; team advanced to state semifinals, top 4 of 120 teams',
        'Named Outstanding Witness at regional and state competitions',
        'Prepared 3 witnesses and delivered closing arguments in championship round',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'attorney', 'witness', 'mock trial', 'objection', 'closing argument',
        'opening statement', 'cross-examination', 'direct examination',
      ],
    },
  ],

  nameDropTraps: [
    {
      id: 'ds_format_name_only',
      pattern: 'Policy Debate / Lincoln-Douglas / Public Forum',
      whyStudentsUseIt:
        'Students think the format name itself communicates sophistication. ' +
        '"Policy debate" sounds more impressive than just "debate."',
      whyItFails:
        'AOs know the formats already. The format name adds zero information — ' +
        'what matters is what you DID within that format. Spending 15 characters ' +
        'on "Policy Debate" is 10% of your description wasted on a label.',
      betterAlternative:
        'Skip the format name entirely or abbreviate (PF, LD, CX) and use ' +
        'the saved characters for results and impact.',
      example: {
        nameDrop: 'Policy debate team member. Participated in tournaments across the state.',
        improved: 'Varsity debater: 62-18 record, TOC qualifier, coached 6 novices to states',
        whatChanged:
          'Removed the format label and generic "participated." Replaced with ' +
          'quantified record, top-tier qualification, and multiplier impact.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 15,
      detectionKeywords: [
        'policy debate', 'lincoln-douglas', 'public forum', 'congressional debate',
        'LD debate', 'PF debate', 'CX debate',
      ],
    },
    {
      id: 'ds_resolution_text',
      pattern: 'Resolved: [full resolution text]',
      whyStudentsUseIt:
        'Students are proud of engaging with complex topics and want to show ' +
        'the intellectual substance of their arguments.',
      whyItFails:
        'Resolutions change every 2 months. AOs don\'t care about the specific ' +
        'topic — they care about what YOU did with it. Quoting the resolution ' +
        'wastes 40-80 characters on content that communicates nothing about ' +
        'the applicant\'s ability.',
      betterAlternative:
        'Reference the topic area briefly (2-3 words max) only if your research ' +
        'depth on it is the achievement. Otherwise, skip it entirely.',
      example: {
        nameDrop: 'Debated "Resolved: The US should substantially reduce its military presence in one or more countries"',
        improved: 'Researched US foreign policy for 3 months; built case adopted by 8 teams nationally',
        whatChanged:
          'Removed the 90-character resolution quote. Showed the research depth ' +
          'and the adoption of the case as validation of quality.',
      },
      prevalence: 'common',
      typicalCharWaste: 60,
      detectionKeywords: [
        'resolved', 'resolution', 'topic area', 'this year\'s topic',
      ],
    },
    {
      id: 'ds_prestigious_tournament_attendance',
      pattern: 'Competed at Harvard/Yale/Berkeley tournament',
      whyStudentsUseIt:
        'The university name carries prestige by association. Students believe ' +
        'that attending a tournament hosted by Harvard signals their own caliber.',
      whyItFails:
        'Most major university-hosted tournaments accept any team that registers. ' +
        'Attending is a function of geography and budget, not skill. AOs know that ' +
        '"competed at Harvard" could mean "went 1-5 at Harvard." The result matters, ' +
        'not the venue.',
      betterAlternative:
        'Name the tournament only if you have a meaningful result there. ' +
        '"Octofinalist at Harvard (top 16 of 256)" is excellent. ' +
        '"Competed at Harvard" is empty.',
      example: {
        nameDrop: 'Competed at prestigious Harvard, Yale, and Berkeley debate tournaments',
        improved: 'Octofinalist at Harvard (256 teams), semifinalist at Berkeley (128 teams)',
        whatChanged:
          'Removed "competed at" framing and "prestigious" (let the results speak). ' +
          'Added specific placements and field sizes that quantify the achievement.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'competed at', 'attended', 'prestigious', 'Harvard tournament',
        'Yale tournament', 'Berkeley tournament', 'invitational',
      ],
    },
    {
      id: 'ds_brief_writing',
      pattern: 'Wrote briefs / Did research / Cut cards',
      whyStudentsUseIt:
        'Students want to show their behind-the-scenes intellectual work, ' +
        'not just their competition results.',
      whyItFails:
        'Every debater writes briefs and cuts cards. It\'s the baseline activity ' +
        'of debate preparation. Describing it is like a basketball player saying ' +
        '"attended practice." It\'s process, not achievement.',
      betterAlternative:
        'Only mention research if the SCALE or ADOPTION is the achievement. ' +
        '"Compiled 400-page evidence set used by 15-member team" transforms ' +
        'process into impact.',
      example: {
        nameDrop: 'Wrote briefs and conducted extensive research on foreign policy topics',
        improved: 'Built 400-page evidence database on foreign policy; team used it to reach state finals',
        whatChanged:
          'Quantified the research scale and connected it to a competitive outcome. ' +
          'The research became a means to an end, not the end itself.',
      },
      prevalence: 'common',
      typicalCharWaste: 25,
      detectionKeywords: [
        'briefs', 'cut cards', 'research', 'extensive research', 'evidence files',
        'prep', 'prepared cases',
      ],
    },
    {
      id: 'ds_cross_examination',
      pattern: 'Performed cross-examinations / Gave rebuttals',
      whyStudentsUseIt:
        'Students think describing debate mechanics shows they understand ' +
        'the activity at a deep level.',
      whyItFails:
        'Cross-examination and rebuttals are FORMAT REQUIREMENTS — every debater ' +
        'does them. It\'s like a soccer player saying "kicked the ball." ' +
        'Describing mandatory activities wastes characters on zero-signal information.',
      betterAlternative:
        'Only reference specific debate skills if you have a RESULT attached. ' +
        '"CX strategy led to 85% win rate in elimination rounds" ties skill to outcome.',
      example: {
        nameDrop: 'Delivered opening statements, performed cross-examinations, and gave closing arguments',
        improved: 'Lead attorney; team placed top 4 at state mock trial championship',
        whatChanged:
          'Removed the list of mandatory activities everyone performs. ' +
          'Replaced with role, team result, and competitive context.',
      },
      prevalence: 'common',
      typicalCharWaste: 40,
      detectionKeywords: [
        'cross-examination', 'rebuttal', 'opening statement', 'closing argument',
        'constructive', 'summary speech',
      ],
    },
    {
      id: 'ds_model_un_attendance',
      pattern: 'Model UN delegate / Attended MUN conferences',
      whyStudentsUseIt:
        'Students believe that participating in Model UN at all signals ' +
        'global awareness and diplomatic skill.',
      whyItFails:
        'Model UN is one of the most common extracurriculars — hundreds of ' +
        'thousands of students participate. "Delegate" is the default role; ' +
        'everyone is a delegate. Without a committee, conference name, or award, ' +
        'AOs see pure attendance padding.',
      betterAlternative:
        'Specify the conference, committee, country, and result. ' +
        '"Best Delegate, DISEC at HMUN representing France" is specific and impressive. ' +
        '"Model UN delegate" is not.',
      example: {
        nameDrop: 'Model UN delegate at multiple conferences. Represented various countries in committees.',
        improved: 'Best Delegate at 4 conferences; Head Delegate leading 12-member team to Best Large Delegation',
        whatChanged:
          'Removed generic attendance language. Added specific awards, leadership role, ' +
          'and team-level achievement.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 30,
      detectionKeywords: [
        'model un', 'MUN', 'delegate', 'represented', 'committee',
        'various countries', 'conferences',
      ],
    },
    {
      id: 'ds_captain_without_proof',
      pattern: 'Debate team captain / President of speech team',
      whyStudentsUseIt:
        'Leadership titles are perceived as universally impressive. ' +
        'Students believe the title alone communicates capability.',
      whyItFails:
        'AOs see "captain" thousands of times. The title is meaningless without ' +
        'evidence of what the captaincy PRODUCED. A captain who grew the team from ' +
        '8 to 25 members is impressive. A captain who ran the same program identically ' +
        'is not.',
      betterAlternative:
        'Follow every title with its outcome. "Captain" should be one word in a ' +
        'sentence about what your leadership achieved, not the headline.',
      example: {
        nameDrop: 'Captain of the debate team. Led weekly practices and organized tournament logistics.',
        improved: 'Captain: grew team 8→25 members, 5 first-time state qualifiers, secured $4K funding',
        whatChanged:
          'Kept the title but immediately followed with three quantified outcomes. ' +
          'Removed generic duty descriptions ("led practices") that every captain does.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 15,
      detectionKeywords: [
        'captain', 'president', 'leader', 'led practices', 'organized',
        'managed', 'team leader',
      ],
    },
    {
      id: 'ds_debate_jargon',
      pattern: 'Spread / K / T / RVI / Disad / Counterplan',
      whyStudentsUseIt:
        'Debate jargon creates in-group identity. Students assume that using ' +
        'technical terms signals expertise to AOs.',
      whyItFails:
        'AOs are not debate coaches. Terms like "spreading," "kritik," ' +
        '"topicality," and "RVI" are meaningless to 95% of readers. ' +
        'Every character spent on jargon is a character not spent on ' +
        'universally understandable impact language.',
      betterAlternative:
        'Translate jargon into outcomes. "Developed philosophical framework" ' +
        'instead of "ran a kritik." "Increased speech speed 50%" instead of "learned to spread."',
      example: {
        nameDrop: 'Ran kritiks and topicality arguments. Known for spreading in CX rounds.',
        improved: 'Developed original philosophical framework; won 78% of rounds using argument innovation',
        whatChanged:
          'Translated insider jargon into universally understandable language. ' +
          'The win rate validates the strategy without requiring debate knowledge to understand.',
      },
      prevalence: 'common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'spread', 'spreading', 'kritik', 'topicality', 'RVI', 'disad',
        'counterplan', 'permutation', 'framework', 'flow', 'flowing',
      ],
    },
    {
      id: 'ds_generic_skills_claim',
      pattern: 'Improved critical thinking / communication / public speaking skills',
      whyStudentsUseIt:
        'Students want to articulate the personal growth debate gave them, ' +
        'which is a legitimate goal — but the description is not the place for it.',
      whyItFails:
        'Every debate description could claim "improved critical thinking." ' +
        'It\'s unfalsifiable, unquantifiable, and wastes 30+ characters on something ' +
        'AOs already assume debate provides. The description should show EVIDENCE ' +
        'of these skills through results, not claim them directly.',
      betterAlternative:
        'Show the skill through its results. "Persuaded 3 judges to flip their ballot" ' +
        'demonstrates persuasion better than claiming "improved persuasion skills."',
      example: {
        nameDrop: 'Developed critical thinking, public speaking, and research skills through debate',
        improved: '62-18 record; adapted arguments across 4 debate formats; trained 10 new members',
        whatChanged:
          'Replaced abstract skill claims with concrete evidence of those skills: ' +
          'win record (competence), format versatility (adaptability), training others (mastery).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 35,
      detectionKeywords: [
        'critical thinking', 'public speaking', 'communication skills',
        'research skills', 'improved my', 'developed skills', 'learned to',
      ],
    },
    {
      id: 'ds_participation_years',
      pattern: '4-year member / Participated since freshman year',
      whyStudentsUseIt:
        'Students assume longevity automatically communicates dedication and depth.',
      whyItFails:
        'Duration is already captured in the Common App activities section\'s year ' +
        'checkboxes. Restating it in the description wastes 20-30 characters on ' +
        'information AOs can see elsewhere. A 4-year member who achieved nothing ' +
        'noteworthy is less impressive than a 2-year member who reached nationals.',
      betterAlternative:
        'Let the year checkboxes handle duration. Use the description for what you ' +
        'achieved, not how long you were there.',
      example: {
        nameDrop: '4-year member of the debate team. Participated in local and regional tournaments.',
        improved: 'State semifinalist (top 4 of 180); coached novice squad to 3 tournament wins',
        whatChanged:
          'Removed redundant duration info and generic participation language. ' +
          'Replaced with the best competitive result and a teaching impact.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 25,
      detectionKeywords: [
        '4-year', 'since freshman', 'since 9th grade', 'participated',
        'member since', 'all four years',
      ],
    },
  ],

  proofOfWorkPatterns: [
    {
      id: 'ds_pow_competitive_record',
      pattern: 'Specific win-loss record or win percentage across a meaningful sample',
      whyItProves:
        'Competitive records are tracked by tournament tabulation software and publicly ' +
        'available on debate wikis. Students cannot fabricate a record without risk of ' +
        'verification. A 70%+ win rate across 20+ tournaments proves sustained excellence.',
      examples: [
        '72-15 career record in Policy Debate',
        '85% win rate in preliminary rounds across 3 seasons',
        'Won 8 of 12 tournaments entered in senior year',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student is genuinely skilled, not just a participant. The sample size ' +
        'eliminates luck as an explanation.',
    },
    {
      id: 'ds_pow_progressive_qualification',
      pattern: 'Clear progression through competitive tiers over time',
      whyItProves:
        'Qualification ladders (novice → JV → varsity → state → national → TOC) ' +
        'require multiple independent successes. Each level is exponentially harder, ' +
        'and the progression proves sustained commitment and growth.',
      examples: [
        'Novice to varsity in 6 months, state qualifier by sophomore year, TOC junior year',
        'Qualified for nationals 3 consecutive years, reaching octofinals, quarters, then semis',
        'Advanced from alternate to starter to captain over 3 years',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student shows a genuine growth trajectory — they got better over time, ' +
        'which suggests they\'ll continue to grow in college.',
    },
    {
      id: 'ds_pow_specific_strategy_detail',
      pattern: 'Describing a strategic decision and its measurable outcome',
      whyItProves:
        'Only someone who actually competed can describe specific strategic pivots. ' +
        'A student who says "switched from speed-focused delivery to persuasion-centered ' +
        'approach" reveals intimate knowledge of competitive debate dynamics.',
      examples: [
        'Shifted to narrative-style rebuttals, improving elimination round win rate from 40% to 75%',
        'Developed a counterplan-heavy negative strategy that outperformed traditional approaches',
        'Adapted case to local judge pool preferences, winning 90% of home tournaments',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student thinks strategically about their performance and adapts deliberately — ' +
        'a metacognitive skill that transfers directly to academic work.',
    },
    {
      id: 'ds_pow_judge_feedback_integration',
      pattern: 'Referencing specific judge feedback and how it shaped improvement',
      whyItProves:
        'Judge feedback is unique to each competitor. Referencing it shows the student ' +
        'doesn\'t just compete but actively learns from evaluation — a growth mindset ' +
        'in action.',
      examples: [
        'Incorporated ballot feedback from 50+ judges to refine delivery style',
        'Identified pattern of losing to aggressive CX; developed counter-strategy',
        'Judge comments cited clarity improvement as key factor in elimination round advances',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student is coachable and self-reflective — traits that predict ' +
        'college classroom success.',
    },
    {
      id: 'ds_pow_team_contribution',
      pattern: 'Specific contribution to team success beyond personal competition',
      whyItProves:
        'Moving beyond individual results to team impact shows the maturity that ' +
        'distinguishes a leader from a competitor. Organizing practice, creating resources, ' +
        'or recruiting members demonstrates program-level thinking.',
      examples: [
        'Created weekly drill regimen; team\'s average speaker points rose from 26.5 to 28.1',
        'Organized practice schedule coordinating 20 debaters across 4 event types',
        'Wrote orientation handbook for new members, reducing first-tournament dropout rate by 60%',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student contributes to the group, not just themselves — a signal of the ' +
        'kind of community member who will enrich a college campus.',
    },
    {
      id: 'ds_pow_argument_adoption',
      pattern: 'Original arguments or cases adopted by others outside the team',
      whyItProves:
        'When other teams or schools adopt your argument, it\'s independent validation ' +
        'of intellectual quality. This is the debate equivalent of peer review — ' +
        'your ideas were tested in the marketplace and won.',
      examples: [
        'Wrote affirmative case adopted by 12 teams across 3 circuits',
        'Developed disability justice framework now used in 2 state curricula',
        'Created evidence-sharing system used by 8 schools in regional league',
      ],
      expertiseLevel: 'expert',
      aoInterpretation:
        'This student produces ideas that others find valuable enough to use — ' +
        'the hallmark of an original thinker.',
    },
    {
      id: 'ds_pow_community_building',
      pattern: 'Creating debate access or opportunities for underserved communities',
      whyItProves:
        'Founding programs, fundraising for tournament fees, or teaching debate to ' +
        'students without access requires sustained effort with no personal competitive ' +
        'benefit. It shows values-driven action.',
      examples: [
        'Founded debate program at Title I school, coaching 15 students to their first tournament',
        'Raised $5,000 to cover tournament travel for low-income team members',
        'Organized free Saturday debate clinics for middle schoolers from underserved schools',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student uses their skills to create opportunity for others — ' +
        'exactly the kind of community impact elite colleges seek.',
    },
    {
      id: 'ds_pow_sustained_commitment',
      pattern: 'Evidence of year-round engagement beyond seasonal competition',
      whyItProves:
        'Students who attend debate camp, organize summer workshops, or continue ' +
        'research between seasons demonstrate passion that extends beyond the ' +
        'school-year obligation.',
      examples: [
        'Attended NDF debate camp, worked as lab leader the following summer',
        'Organized summer research sessions, producing 200 pages of evidence before season',
        'Volunteered as tournament tabulation staff at 6 off-season tournaments',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student\'s commitment extends beyond the school year — ' +
        'it\'s a genuine passion, not a resume line.',
    },
  ],

  descriptionTransforms: [
    {
      id: 'ds_transform_format_to_results',
      transformType: 'name_drop_to_impact',
      before: 'Lincoln-Douglas debate team member at school',
      after: 'LD debater: 58-12 record, state semifinalist, 3 TOC bids',
      explanation:
        'Removed the generic format name and "team member" label. ' +
        'Replaced with abbreviated format + three escalating achievements ' +
        'that each independently prove skill.',
      charsBefore: 47,
      charsAfter: 53,
      principle: 'Results over labels — let your record speak',
    },
    {
      id: 'ds_transform_attendance_to_placement',
      transformType: 'generic_to_specific',
      before: 'Attended multiple debate tournaments throughout the year',
      after: 'Competed at 22 tournaments; reached elimination rounds at 15',
      explanation:
        'Replaced vague "multiple" with exact count and converted ' +
        '"attended" (passive) into a success rate (reached elims at 68% of tournaments).',
      charsBefore: 52,
      charsAfter: 55,
      principle: 'Quantify everything — vague words waste characters',
    },
    {
      id: 'ds_transform_captain_to_impact',
      transformType: 'duty_to_achievement',
      before: 'Captain of debate team. Organized meetings and practices.',
      after: 'Captain: grew team 8→24, 6 new state qualifiers, raised $5K for travel',
      explanation:
        'Kept the title but immediately showed what it produced. ' +
        'Removed generic duties (meetings, practices) that every captain does. ' +
        'Added three quantified leadership outcomes.',
      charsBefore: 54,
      charsAfter: 60,
      principle: 'Titles need outcomes — what did your leadership produce?',
    },
    {
      id: 'ds_transform_jargon_to_outcome',
      transformType: 'jargon_to_outcome',
      before: 'Ran kritiks and topicality arguments in CX debate rounds',
      after: 'Developed original philosophical arguments; won 78% of elimination rounds',
      explanation:
        'Translated debate-insider jargon into universally understandable ' +
        'language. Added a win percentage that validates the strategy ' +
        'without requiring debate knowledge.',
      charsBefore: 54,
      charsAfter: 66,
      principle: 'Write for the reader, not the community — AOs are not debaters',
    },
    {
      id: 'ds_transform_skills_to_evidence',
      transformType: 'claim_to_evidence',
      before: 'Improved public speaking and critical thinking through debate',
      after: 'Top speaker at 4 tournaments; arguments adopted by 10+ teams nationally',
      explanation:
        'Replaced abstract skill claims with concrete evidence of those skills. ' +
        'Speaker awards prove public speaking; adoption proves critical thinking.',
      charsBefore: 55,
      charsAfter: 63,
      principle: 'Show, don\'t tell — evidence beats claims every time',
    },
    {
      id: 'ds_transform_research_to_scale',
      transformType: 'generic_to_specific',
      before: 'Conducted extensive research on policy topics for debate rounds',
      after: 'Compiled 500-page evidence file on healthcare policy; used by 15-member team',
      explanation:
        'Made "extensive research" concrete with page count, topic specificity, ' +
        'and the fact that the team relied on the work. Scale + adoption = credibility.',
      charsBefore: 57,
      charsAfter: 67,
      principle: 'Quantify the invisible — research hours become page counts and user counts',
    },
    {
      id: 'ds_transform_passive_participation',
      transformType: 'passive_to_active',
      before: 'Participated in Model UN conferences as a delegate',
      after: 'Best Delegate at 4 MUN conferences; led 12-member delegation to top team award',
      explanation:
        'Replaced passive "participated as" with active achievements. ' +
        'Added individual awards, conference count, leadership role, and team outcome.',
      charsBefore: 49,
      charsAfter: 68,
      principle: 'Active voice + outcomes — never just "participated in"',
    },
    {
      id: 'ds_transform_resolution_to_depth',
      transformType: 'name_drop_to_impact',
      before: 'Debated the resolution on US nuclear weapons policy at national tournaments',
      after: 'Researched nuclear policy for 3 months; case ran by 8 teams at nationals',
      explanation:
        'Removed the resolution quote, which communicates nothing about the student. ' +
        'Showed research investment and case adoption as proof of quality.',
      charsBefore: 65,
      charsAfter: 62,
      principle: 'Your research matters more than the resolution — show depth, not the topic',
    },
    {
      id: 'ds_transform_mock_trial_duties',
      transformType: 'duty_to_achievement',
      before: 'Mock trial team member. Played attorney role. Prepared witnesses.',
      after: 'Lead attorney: team reached state semis (top 4/120); named Outstanding Attorney',
      explanation:
        'Removed generic role description. Added competitive result with context ' +
        'and individual recognition award.',
      charsBefore: 61,
      charsAfter: 70,
      principle: 'Your role is a word, not a sentence — spend characters on what you won',
    },
    {
      id: 'ds_transform_mentorship_generic',
      transformType: 'generic_to_specific',
      before: 'Helped newer members learn debate skills and prepare for tournaments',
      after: 'Mentored 8 novices; 5 qualified for states, 2 reached elimination rounds',
      explanation:
        'Replaced vague "helped newer members" with specific count, qualification rate, ' +
        'and outcomes. The 5/8 qualification rate proves teaching quality.',
      charsBefore: 60,
      charsAfter: 65,
      principle: 'Mentorship needs metrics — how many, and what did they achieve?',
    },
  ],

  verbHierarchy: [
    {
      tier: 'power',
      verbs: [
        'qualified', 'advanced', 'earned', 'founded', 'authored',
        'coached', 'pioneered', 'secured', 'championed', 'eliminated',
      ],
      context:
        'In debate/forensics, power verbs convey competitive advancement, intellectual ' +
        'creation, and leadership impact. "Qualified" and "advanced" map directly to the ' +
        'tournament elimination structure. "Founded" and "authored" signal initiative. ' +
        '"Coached" implies mastery deep enough to transfer knowledge.',
      exampleUsage: 'Qualified to TOC; authored case adopted by 12 teams; coached 8 novices to states',
    },
    {
      tier: 'standard',
      verbs: [
        'competed', 'represented', 'researched', 'debated', 'argued',
        'presented', 'organized', 'analyzed', 'prepared', 'coordinated',
      ],
      context:
        'Standard verbs are accurate but undifferentiated. "Competed" describes ' +
        'what every debater does. "Researched" and "prepared" are baseline activities. ' +
        'These verbs are fine as supporting language but should not be the primary action.',
      exampleUsage: 'Competed in 22 tournaments and researched healthcare policy extensively',
    },
    {
      tier: 'weak',
      verbs: [
        'participated', 'attended', 'joined', 'was involved in', 'helped',
        'contributed', 'assisted', 'engaged in', 'took part in', 'was a member of',
      ],
      context:
        'Weak verbs communicate attendance rather than achievement. ' +
        '"Participated in" and "attended" are the lowest-signal verbs in the forensics domain ' +
        'because they confirm presence without indicating any competitive success, growth, ' +
        'or contribution. Every character spent on these verbs is wasted.',
      exampleUsage: 'Participated in debate tournaments and was a member of the speech team',
    },
  ],

  roleExpertise: [
    {
      role: 'Varsity Captain / Team President',
      expectedSignals: [
        'Program growth or maintenance metrics (member count trends)',
        'Tournament organization or logistics management',
        'Mentorship of younger team members',
        'Coordination of practice schedule and team strategy',
      ],
      differentiators: [
        'Program-level outcomes: more state qualifiers, higher team win rate',
        'Fundraising or resource acquisition for the team',
        'Curriculum or training program development',
        'Building partnerships with other schools or community organizations',
        'Founding new programs or reviving defunct ones',
      ],
      overclaimingRisks: [
        'Claiming credit for the team\'s competitive success if the captain is not a top competitor',
        'Overstating administrative tasks as "leadership impact"',
        'Taking credit for coaching decisions made by the adult advisor',
      ],
      authenticPatterns: [
        'Captain: grew team from N to M members in X years',
        'Captain: X new members qualified for states under my mentorship',
        'President: secured $X in funding; organized first-ever invitational',
      ],
    },
    {
      role: 'Varsity Competitor (non-captain)',
      expectedSignals: [
        'Tournament results with context (placement / field size)',
        'Win-loss record or win percentage',
        'Qualification to higher-level competitions',
        'Growth trajectory (novice → varsity timeline)',
      ],
      differentiators: [
        'Nationally competitive results (TOC qualification, NSDA Nationals elim rounds)',
        'Original case or argument development',
        'Cross-format versatility (competing in multiple events successfully)',
        'Speaker awards and individual recognition',
      ],
      overclaimingRisks: [
        'Claiming team achievements as individual ones',
        'Inflating tournament prestige ("prestigious local tournament")',
        'Overstating role in partner events (PF is a team event)',
      ],
      authenticPatterns: [
        '58-12 career record; state semifinalist; 3 TOC bids',
        'Qualified to nationals in LD and PF; top speaker at 4 tournaments',
        'Advanced from novice to varsity in 6 months; now mentoring JV debaters',
      ],
    },
    {
      role: 'Head Delegate (Model UN)',
      expectedSignals: [
        'Delegation coordination (number of delegates managed)',
        'Conference awards — delegation-level and individual',
        'Pre-conference preparation and strategy coordination',
        'Country/committee research and position paper quality',
      ],
      differentiators: [
        'Best Large Delegation awards at major conferences',
        'Consistent award-winning across multiple conferences',
        'Training program for new delegates that produces award winners',
        'Organizing school-hosted Model UN conference',
      ],
      overclaimingRisks: [
        'Claiming Head Delegate when actually just a senior member',
        'Listing conferences attended without results',
        'Overstating delegation size or conference competitiveness',
      ],
      authenticPatterns: [
        'Head Delegate: led 12-member team to Best Large Delegation at HMUN',
        'Coordinated preparation for 8 conferences; team won 15 individual awards',
        'Organized school-hosted conference for 150 delegates from 20 schools',
      ],
    },
    {
      role: 'Speech / Individual Events Competitor',
      expectedSignals: [
        'Event type and competitive level (state, national)',
        'Placement at tournaments with field context',
        'Piece selection rationale (for interp events) or topic significance (for platform events)',
        'Growth across the season or multi-year trajectory',
      ],
      differentiators: [
        'NSDA Nationals finalist or semifinalist',
        'State champion in one or more events',
        'Original oratory or extemp on uniquely researched topics',
        'Coaching other speakers to competitive success',
        'Community performances outside competition context',
      ],
      overclaimingRisks: [
        'Claiming "finalist" at small local tournaments as a major achievement',
        'Listing piece names in interpretation events (wastes characters)',
        'Conflating speech competition with general "public speaking"',
      ],
      authenticPatterns: [
        'State champion in Original Oratory; NSDA Nationals semifinalist',
        '2nd at states in Dramatic Interp; coached 3 novices to regionals',
        'Extemporaneous speaking: won 6 of 10 tournaments; developed rapid-research method',
      ],
    },
    {
      role: 'Novice / JV Competitor',
      expectedSignals: [
        'Rapid improvement trajectory',
        'Commitment despite limited initial success',
        'Learning from more experienced teammates',
        'First competitive achievements (first win, first elimination round)',
      ],
      differentiators: [
        'Accelerated advancement to varsity level',
        'Winning novice-division tournaments or awards',
        'Beginning to mentor even newer members',
        'Contributing to team despite limited individual results',
      ],
      overclaimingRisks: [
        'Inflating novice/JV results to sound varsity-level',
        'Claiming more experience than they have',
        'Overstating the competitiveness of novice divisions',
      ],
      authenticPatterns: [
        'Began as novice; advanced to varsity in one season with 12-4 record',
        'Won 3 novice tournaments; now helping train incoming freshmen',
        'Started debate with no experience; qualified for districts within 8 months',
      ],
    },
  ],

  jargonExceptions: [
    {
      pattern: 'TOC (Tournament of Champions) qualification',
      whyItsTheException:
        'The TOC is the most prestigious national debate tournament, requiring ' +
        'accumulation of "bids" from specific elite tournaments. Naming it IS the ' +
        'achievement — there is no simpler way to communicate this level of ' +
        'competitive success. AOs who read debate descriptions know what TOC means.',
      example: 'Earned 4 TOC bids; qualified as a junior (top ~0.5% nationally)',
    },
    {
      pattern: 'NSDA Nationals qualification or placement',
      whyItsTheException:
        'NSDA Nationals is the largest national speech and debate tournament, ' +
        'universally recognized in admissions. Qualifying requires winning at ' +
        'district level. Naming it precisely communicates achievement level.',
      example: 'NSDA Nationals: advanced to octofinals in LD (top 32 of 400+ entries)',
    },
    {
      pattern: 'Best Delegate / Outstanding Delegate (Model UN)',
      whyItsTheException:
        'These are standardized award names in Model UN that AOs recognize. ' +
        'Unlike debate jargon (kritik, spreading), these terms are self-explanatory ' +
        'and directly communicate achievement level. The specific award name IS ' +
        'the accomplishment.',
      example: 'Best Delegate at HMUN DISEC committee (180 delegates)',
    },
    {
      pattern: 'State/National qualifier in specific event category',
      whyItsTheException:
        'Event categories (Original Oratory, Extemporaneous Speaking, Dramatic ' +
        'Interpretation) are official NSDA designations. Naming the specific event ' +
        'clarifies what skill was demonstrated and at what competitive level. ' +
        'This is precision, not jargon.',
      example: 'State champion, Original Oratory; NSDA Nationals semifinalist in Extemp',
    },
  ],
};
