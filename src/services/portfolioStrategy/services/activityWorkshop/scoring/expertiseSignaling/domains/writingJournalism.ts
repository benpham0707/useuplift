/**
 * Writing & Journalism — Expertise Signaling Domain
 *
 * Field-specific expertise patterns for writing, journalism, and literary activities.
 * AOs evaluate writing activities differently from other fields: the description
 * IS the portfolio sample. Every word must demonstrate the craft claimed.
 *
 * Key insight: An applicant who claims to be a skilled writer but submits
 * a generic, cliché-filled activity description undermines their own credibility.
 * The description must be the proof.
 *
 * Sources: Columbia Journalism Review, NSPA/CSPA judging criteria, Scholastic
 * Writing Awards rubrics, published AO insights on writing portfolios.
 */

import type { ExpertiseDomain } from '../types';

export const WRITING_JOURNALISM_DOMAIN: ExpertiseDomain = {
  domainId: 'writing_journalism',
  label: 'Writing & Journalism',
  overview: `Writing and journalism activities present a unique paradox in college admissions: the 150-character activity description IS itself a writing sample. AOs reading a student who claims editorial leadership or publication credits will judge the description with a writer's eye. Clumsy phrasing, passive voice, or vague claims from a "writer" are immediate credibility killers.

What separates genuine student journalists and writers from résumé-padders is editorial judgment — the ability to decide what matters, what to cut, and how to frame a story. AOs look for evidence of real editorial decisions: choosing which stories to pursue, managing publication deadlines, developing a distinctive voice, and engaging actual readership.

The most common trap in writing activities is credential-stacking ("Editor-in-Chief of the school newspaper") without any evidence of editorial impact. AOs have read thousands of school newspaper editors. What differentiates is the WHAT and WHY: What stories did you break? What editorial stance did you take? What changed because of your journalism?`,

  aoExpectations: {
    whatRegisters: [
      'Evidence of editorial judgment — choosing stories, angles, framing',
      'Publication in selective or competitive venues beyond school',
      'Quantified readership or measurable audience engagement',
      'Distinctive voice or style visible even in the 150-char description',
      'Investigation or enterprise reporting that required real effort',
      'Awards from recognized writing organizations (Scholastic, NSPA, Quill & Scroll)',
      'Growth from contributor to editorial leadership with clear impact',
    ],
    whatAOsSeeThrough: [
      'Title-only claims ("Editor-in-Chief") with no editorial substance',
      'Word count or article count as achievement metrics',
      'Listing publication names without context of selectivity',
      'Blog or personal website claimed as "published work"',
      'Passive voice in a writer\'s activity description (ironic credibility gap)',
      'Generic journalism clichés ("gave voice to the voiceless")',
      'Social media follower counts as journalism metrics',
    ],
    goldenQuestion: 'What editorial decision did you make that changed what your readers learned or how they understood something?',
    readingTimeContext: 'AOs spend 7-10 seconds per activity but will linger on a well-written description from a student claiming writing skill. A poorly written description from a "journalist" is worse than no writing claim at all — it actively undermines credibility.',
    competitiveContext: 'School newspapers are extremely common. ~15% of applicants at selective schools claim some form of writing activity. Differentiation comes from selectivity of publication venue, evidence of editorial impact, or awards from recognized organizations (Scholastic Gold Key, NSPA Pacemaker).',
  },

  realExpertiseSignals: [
    {
      id: 'wj_editorial_judgment',
      pattern: 'editorial_decision',
      description: 'Evidence of choosing stories, angles, or editorial direction — not just executing assignments',
      whyItWorks: 'Editorial judgment is the core skill of journalism. Choosing WHAT to cover and HOW to frame it demonstrates understanding far beyond "I wrote articles."',
      examples: [
        'Launched investigative series on district budget allocation after noticing $2M discrepancy in public records',
        'Shifted editorial focus from event coverage to student policy impact, increasing readership 40%',
        'Killed a popular column to make space for underreported community stories',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: ['editorial', 'investigated', 'uncovered', 'broke story', 'editorial board', 'editorial decision', 'story selection'],
    },
    {
      id: 'wj_selective_publication',
      pattern: 'publication_selectivity',
      description: 'Publication in venues with genuine editorial selection — acceptance rates, competitive submission',
      whyItWorks: 'External validation from selective venues proves quality in a way self-publishing cannot. AOs know the difference between school newspapers and Teen Ink vs. Scholastic Gold Key.',
      examples: [
        'Published in Polyphony Lit (8% acceptance rate) after 3 revision rounds with editorial board',
        'Selected for Columbia Scholastic Press Association portfolio exhibition',
        'Piece syndicated by local newspaper after winning regional NSPA award',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: ['published in', 'accepted by', 'selected for', 'acceptance rate', 'Polyphony', 'Scholastic', 'NSPA', 'syndicated'],
    },
    {
      id: 'wj_readership_engagement',
      pattern: 'audience_impact',
      description: 'Quantified readership, engagement, or measurable impact on audience',
      whyItWorks: 'Writing without readers is a journal. AOs value evidence that writing reached and affected an actual audience.',
      examples: [
        'Investigation into cafeteria sourcing prompted district review, covered by local news',
        'Op-ed on student mental health policy generated 200+ responses and prompted counselor hiring',
        'Grew online readership from 500 to 3,000 monthly visitors through investigative series',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: ['readership', 'readers', 'subscribers', 'views', 'response', 'engagement', 'prompted', 'coverage'],
    },
    {
      id: 'wj_craft_mastery',
      pattern: 'writing_craft',
      description: 'Evidence of deliberate craft development — revision, mentor feedback, genre exploration',
      whyItWorks: 'Serious writers revise obsessively and study craft. Mentioning revision process or craft study signals genuine dedication vs. casual participation.',
      examples: [
        'Completed 7 drafts of feature piece under mentor guidance before submission',
        'Studied narrative journalism techniques through Nieman Foundation online course',
        'Developed beat reporting system tracking 3 policy areas across school year',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: ['revised', 'drafts', 'mentor', 'craft', 'narrative', 'technique', 'beat', 'reporting'],
    },
    {
      id: 'wj_leadership_impact',
      pattern: 'editorial_leadership',
      description: 'Leading editorial teams with measurable organizational impact',
      whyItWorks: 'Managing a publication combines writing skill with leadership. AOs look for what changed under your leadership, not just the title.',
      examples: [
        'As EIC, restructured editorial workflow reducing publication delays from 2 weeks to 3 days',
        'Recruited and trained 12 new staff writers, establishing mentorship program',
        'Introduced fact-checking protocol that caught 3 corrections before publication',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'impact',
      detectionKeywords: ['editor-in-chief', 'managing editor', 'editorial team', 'recruited', 'trained', 'restructured'],
    },
    {
      id: 'wj_voice_development',
      pattern: 'distinctive_voice',
      description: 'Evidence of developing a recognizable writing voice or perspective',
      whyItWorks: 'Voice is what separates writers from people who write. A distinctive perspective shows artistic development and self-awareness.',
      examples: [
        'Weekly humor column recognized by CSPA for distinctive satirical voice',
        'Developed long-form profile series exploring immigrant experiences in our community',
        'Created "Data Dive" column translating school budget data into student-accessible analysis',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'differentiation',
      detectionKeywords: ['column', 'series', 'voice', 'style', 'perspective', 'profile', 'long-form'],
    },
    {
      id: 'wj_awards_recognition',
      pattern: 'competitive_recognition',
      description: 'Awards from recognized writing organizations with clear selectivity',
      whyItWorks: 'Major writing awards (Scholastic, NSPA, Quill & Scroll) have known selectivity. They provide external validation that a school newspaper title alone cannot.',
      examples: [
        'Scholastic Writing Gold Key in journalism portfolio (top 1% of 100K+ submissions)',
        'NSPA Individual Achievement Award for investigative reporting',
        'Regional Quill & Scroll International Writing Award',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: ['Scholastic', 'Gold Key', 'Silver Key', 'NSPA', 'Quill & Scroll', 'award', 'finalist', 'winner'],
    },
  ],

  nameDropTraps: [
    {
      id: 'wj_title_only',
      pattern: 'Editor-in-Chief',
      whyStudentsUseIt: 'The title sounds impressive and implies leadership. Students assume AOs will be impressed by the title alone.',
      whyItFails: 'AOs have read thousands of school newspaper EICs. The title alone is meaningless without evidence of what you DID as EIC.',
      betterAlternative: 'Replace the title emphasis with editorial impact: what changed, what you created, what your journalism accomplished.',
      example: {
        nameDrop: 'Editor-in-Chief of The Beacon school newspaper',
        improved: 'Led investigative team uncovering $200K budget misallocation; prompted district audit',
        whatChanged: 'Shifted from title → to editorial impact with measurable outcome',
      },
      prevalence: 'very_common',
      typicalCharWaste: 40,
      detectionKeywords: ['editor-in-chief', 'EIC', 'editor of', 'managing editor of'],
    },
    {
      id: 'wj_article_counting',
      pattern: 'article_count',
      whyStudentsUseIt: 'Quantity feels like proof of dedication. "50 articles" sounds productive.',
      whyItFails: 'AOs value quality and impact over volume. 50 generic event recaps < 1 impactful investigation.',
      betterAlternative: 'Highlight your best work\'s impact instead of total output.',
      example: {
        nameDrop: 'Published 47 articles across news, sports, and opinion sections',
        improved: 'Broke story on inequitable AP access that led to 3 new course offerings',
        whatChanged: 'Replaced volume metric with single high-impact outcome',
      },
      prevalence: 'very_common',
      typicalCharWaste: 30,
      detectionKeywords: ['published', 'articles', 'wrote', 'pieces'],
    },
    {
      id: 'wj_blog_as_publication',
      pattern: 'personal_blog',
      whyStudentsUseIt: 'Self-publishing feels like "being published." Students conflate having a platform with having an audience.',
      whyItFails: 'AOs distinguish between selected publication (editorial gatekeeping) and self-publication (no quality filter).',
      betterAlternative: 'If you blog, show readership metrics and external validation. Better: submit to selective publications.',
      example: {
        nameDrop: 'Published author with personal blog on Medium',
        improved: 'Essay selected by Polyphony Lit from 1,200 submissions; 3K+ reads on publication platform',
        whatChanged: 'Replaced self-publishing claim with selective venue + measurable readership',
      },
      prevalence: 'common',
      typicalCharWaste: 35,
      detectionKeywords: ['blog', 'Medium', 'Substack', 'personal website', 'self-published'],
    },
    {
      id: 'wj_follower_journalism',
      pattern: 'social_media_metrics',
      whyStudentsUseIt: 'Social media followers feel like readership. Large numbers seem impressive.',
      whyItFails: 'AOs know social media followers ≠ journalism. Followers can be bought, gamed, or irrelevant to writing quality.',
      betterAlternative: 'Focus on editorial impact, not social metrics.',
      example: {
        nameDrop: 'Grew school newspaper Instagram to 2,000 followers',
        improved: 'Investigation into lunch pricing policy generated 150+ student responses and menu revision',
        whatChanged: 'Replaced vanity metric with journalistic impact',
      },
      prevalence: 'common',
      typicalCharWaste: 35,
      detectionKeywords: ['followers', 'Instagram', 'TikTok', 'social media', 'likes'],
    },
    {
      id: 'wj_word_count_bragging',
      pattern: 'word_count',
      whyStudentsUseIt: 'Long pieces feel like more work. "10,000-word feature" sounds impressive.',
      whyItFails: 'Word count measures length, not quality. AOs value concision — the description itself should prove this.',
      betterAlternative: 'Describe the impact or depth of the piece, not its length.',
      example: {
        nameDrop: 'Wrote 10,000-word investigative feature for the school magazine',
        improved: 'Six-month investigation interviewing 30+ sources revealed systemic grading disparities',
        whatChanged: 'Replaced length metric with scope and methodology',
      },
      prevalence: 'occasional',
      typicalCharWaste: 25,
      detectionKeywords: ['word', 'words', 'pages', 'length'],
    },
    {
      id: 'wj_publication_name_drop',
      pattern: 'venue_name_without_context',
      whyStudentsUseIt: 'Naming the publication feels like proof. Students assume AOs know every school newspaper.',
      whyItFails: 'AOs don\'t know your school newspaper by name. The name adds nothing without selectivity context.',
      betterAlternative: 'If the venue is selective, state the selectivity. If it\'s a school paper, focus on your impact there.',
      example: {
        nameDrop: 'Staff writer for The Crimson Chronicle and The Literary Review',
        improved: 'Developed data journalism beat; analysis of school spending trends cited by school board',
        whatChanged: 'Replaced unknown venue names with demonstrable editorial impact',
      },
      prevalence: 'very_common',
      typicalCharWaste: 40,
      detectionKeywords: ['staff writer for', 'contributor to', 'writer for'],
    },
    {
      id: 'wj_genre_listing',
      pattern: 'genre_enumeration',
      whyStudentsUseIt: 'Listing genres (fiction, poetry, nonfiction) feels like showing range.',
      whyItFails: 'Listing genres without evidence of accomplishment in any is breadth without depth.',
      betterAlternative: 'Show depth in your strongest genre with specific accomplishment.',
      example: {
        nameDrop: 'Write fiction, poetry, nonfiction, and screenplays',
        improved: 'Poetry collection exploring immigration identity selected for regional anthology',
        whatChanged: 'Replaced genre list with specific accomplishment in one genre',
      },
      prevalence: 'common',
      typicalCharWaste: 30,
      detectionKeywords: ['fiction', 'poetry', 'nonfiction', 'screenplays', 'genres'],
    },
    {
      id: 'wj_cliche_language',
      pattern: 'journalism_cliches',
      whyStudentsUseIt: 'Clichés like "gave voice to the voiceless" feel noble and meaningful.',
      whyItFails: 'A writer using clichés in their activity description undermines their own credibility as a writer.',
      betterAlternative: 'Show specific impact in specific, original language.',
      example: {
        nameDrop: 'Gave voice to the voiceless and shed light on important issues',
        improved: 'Profiled 5 undocumented students navigating college access; series prompted school DACA workshop',
        whatChanged: 'Replaced cliché with specific subjects, specific action, specific outcome',
      },
      prevalence: 'common',
      typicalCharWaste: 45,
      detectionKeywords: ['voice to the voiceless', 'shed light', 'power of the pen', 'speak truth to power'],
    },
  ],

  proofOfWorkPatterns: [
    {
      id: 'wj_source_development',
      pattern: 'source_relationships',
      whyItProves: 'Developing sources over time is the hallmark of real journalism. It proves sustained engagement with a beat.',
      examples: [
        'Maintained relationships with 8 school board members across 2-year education beat',
        'Built trust with student athletes to report on concussion protocol gaps',
        'Developed network of student sources across 3 schools for regional coverage',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation: 'This student understands journalism as relationship-building, not just writing.',
    },
    {
      id: 'wj_revision_process',
      pattern: 'editorial_revision',
      whyItProves: 'Serious writers revise extensively. Mentioning drafts, editorial feedback, or revision rounds shows craft discipline.',
      examples: [
        '7 revision rounds with faculty advisor before submitting Scholastic portfolio',
        'Peer editing circle with 4 staff writers reviewing each other\'s drafts weekly',
        'Rewrote lead 12 times to find the right angle for budget investigation',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation: 'This student treats writing as craft, not just assignment completion.',
    },
    {
      id: 'wj_editorial_systems',
      pattern: 'publication_infrastructure',
      whyItProves: 'Building editorial systems (style guides, fact-checking, workflow tools) shows organizational thinking beyond individual writing.',
      examples: [
        'Created AP-style fact-checking protocol adopted by entire editorial team',
        'Designed editorial calendar system tracking 15 reporters across 4 sections',
        'Established correction policy and public accountability standards',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation: 'This student thinks about journalism as an institution, not just personal expression.',
    },
    {
      id: 'wj_real_world_impact',
      pattern: 'policy_change',
      whyItProves: 'When journalism changes policy or behavior, it proves the work mattered beyond the publication.',
      examples: [
        'Investigation led to district transparency policy requiring public budget meetings',
        'Feature on food insecurity among students prompted school pantry program',
        'Coverage of transportation gaps resulted in new late bus route serving 60+ students',
      ],
      expertiseLevel: 'expert',
      aoInterpretation: 'This student\'s journalism had real-world consequences — the highest form of impact.',
    },
    {
      id: 'wj_mentoring_others',
      pattern: 'teaching_craft',
      whyItProves: 'Teaching writing to others demonstrates mastery. You can\'t teach what you don\'t deeply understand.',
      examples: [
        'Trained 8 new reporters in interviewing techniques and AP style',
        'Created writing workshop series for underclassmen, growing staff from 6 to 18',
        'Mentored 3 freshmen through their first published pieces',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation: 'This student can transfer knowledge — a strong signal of genuine understanding.',
    },
  ],

  descriptionTransforms: [
    {
      id: 'wj_transform_title_to_impact',
      transformType: 'generic_to_specific',
      before: 'Editor-in-Chief of school newspaper The Beacon',
      after: 'Led investigative team; budget story prompted first-ever district audit',
      explanation: 'Replaces title-only claim with specific editorial action and measurable outcome.',
      charsBefore: 48,
      charsAfter: 65,
      principle: 'The title means nothing; the editorial decision means everything.',
    },
    {
      id: 'wj_transform_counting_to_impact',
      transformType: 'claim_to_evidence',
      before: 'Published 50+ articles in news, opinion, and features sections',
      after: 'Broke AP funding disparity story; led to 3 new course offerings in underserved campus',
      explanation: 'Replaces volume metric with single high-impact story and measurable change.',
      charsBefore: 56,
      charsAfter: 75,
      principle: 'One story that changed something > 50 stories that didn\'t.',
    },
    {
      id: 'wj_transform_passive_to_active',
      transformType: 'passive_to_active',
      before: 'Was responsible for editing and reviewing articles submitted by staff writers',
      after: 'Redesigned editorial review process, cutting publication cycle from 14 to 3 days',
      explanation: 'Transforms passive duty description into active organizational improvement.',
      charsBefore: 70,
      charsAfter: 72,
      principle: 'Don\'t describe your job. Describe what you changed about the job.',
    },
    {
      id: 'wj_transform_blog_to_selective',
      transformType: 'name_drop_to_impact',
      before: 'Published author with blog covering local politics and education',
      after: 'Policy analysis selected by Polyphony Lit (8% acceptance); cited by school board member',
      explanation: 'Replaces self-publishing claim with selective venue and external validation.',
      charsBefore: 58,
      charsAfter: 77,
      principle: 'External selection proves quality. Self-publishing proves access to the internet.',
    },
    {
      id: 'wj_transform_cliche_to_specific',
      transformType: 'generic_to_specific',
      before: 'Gave voice to the voiceless through powerful storytelling',
      after: 'Profiled 12 first-generation students navigating college apps; series prompted school workshop',
      explanation: 'Replaces journalism cliché with specific subjects, count, and outcome.',
      charsBefore: 55,
      charsAfter: 80,
      principle: 'A writer who uses clichés in their description undermines their own credibility.',
    },
    {
      id: 'wj_transform_genre_to_depth',
      transformType: 'generic_to_specific',
      before: 'Write fiction, poetry, creative nonfiction, and journalism',
      after: 'Poetry exploring immigrant identity; 3 pieces in regional anthology, 1 Scholastic Silver Key',
      explanation: 'Replaces genre breadth with depth in one genre plus external validation.',
      charsBefore: 55,
      charsAfter: 82,
      principle: 'Depth in one genre with validation > breadth across many without.',
    },
    {
      id: 'wj_transform_social_to_journalism',
      transformType: 'name_drop_to_impact',
      before: 'Managed social media accounts growing newspaper Instagram to 2K followers',
      after: 'Investigative series on lunch pricing generated 150+ responses; policy revised within month',
      explanation: 'Replaces social media vanity metrics with journalistic impact.',
      charsBefore: 68,
      charsAfter: 80,
      principle: 'Journalism impact is measured in policy change, not follower count.',
    },
    {
      id: 'wj_transform_duty_to_achievement',
      transformType: 'duty_to_achievement',
      before: 'Responsible for writing weekly news articles and meeting deadlines',
      after: 'Developed education beat tracking 5 policy areas; 3 stories picked up by local media',
      explanation: 'Transforms routine duty into specialized beat journalism with external validation.',
      charsBefore: 62,
      charsAfter: 76,
      principle: 'Beat expertise demonstrates commitment; external pickup validates quality.',
    },
  ],

  verbHierarchy: [
    {
      tier: 'power',
      verbs: [
        'investigated', 'uncovered', 'broke', 'exposed', 'profiled',
        'analyzed', 'synthesized', 'challenged', 'prompted', 'revealed',
        'established', 'launched', 'redesigned', 'transformed', 'mentored',
      ],
      context: 'In journalism, power verbs signal editorial agency and impact. They show the writer as an active force, not a passive recorder.',
      exampleUsage: 'Investigated district spending patterns, uncovering $200K in misallocated funds.',
    },
    {
      tier: 'standard',
      verbs: [
        'wrote', 'edited', 'published', 'reported', 'covered',
        'interviewed', 'researched', 'managed', 'coordinated', 'developed',
        'created', 'produced', 'contributed', 'reviewed', 'drafted',
      ],
      context: 'Standard journalism verbs describe competent work but don\'t signal editorial judgment or impact.',
      exampleUsage: 'Wrote articles for the news section and edited submissions from staff writers.',
    },
    {
      tier: 'weak',
      verbs: [
        'helped', 'assisted', 'participated', 'was involved', 'supported',
        'attended', 'joined', 'served', 'worked', 'handled',
        'was responsible for', 'maintained', 'updated', 'submitted',
      ],
      context: 'Weak verbs signal passive involvement. A "writer" who "helped" or "participated" doesn\'t sound like a writer.',
      exampleUsage: 'Helped with editing articles and participated in editorial meetings.',
    },
  ],

  roleExpertise: [
    {
      role: 'Editor-in-Chief',
      expectedSignals: [
        'Editorial vision and direction-setting',
        'Staff management and mentorship',
        'Publication quality control',
        'Crisis management (controversial stories, corrections)',
      ],
      differentiators: [
        'Launched new sections or investigative initiatives',
        'Measurable improvements in publication quality or readership',
        'External recognition (press association awards)',
        'Policy impact from editorial decisions',
      ],
      overclaimingRisks: [
        'Claiming full credit for team\'s work',
        'Treating the title as the achievement rather than editorial decisions',
        'Overstating readership without metrics',
      ],
      authenticPatterns: [
        'References specific editorial decisions and their outcomes',
        'Mentions training/mentoring staff writers',
        'Cites specific stories that had impact',
      ],
    },
    {
      role: 'Staff Writer / Reporter',
      expectedSignals: [
        'Regular publication cadence',
        'Beat development or specialization',
        'Interview and sourcing skills',
      ],
      differentiators: [
        'Self-directed enterprise reporting (stories no one assigned)',
        'Publication in venues beyond school newspaper',
        'Stories that prompted action or policy change',
      ],
      overclaimingRisks: [
        'Claiming investigation credit for assigned stories',
        'Overstating article impact',
      ],
      authenticPatterns: [
        'References specific beats or story areas',
        'Mentions source development',
        'Cites specific impact of reporting',
      ],
    },
    {
      role: 'Columnist / Opinion Writer',
      expectedSignals: [
        'Consistent publication schedule',
        'Distinctive voice or perspective',
        'Audience engagement (responses, debate)',
      ],
      differentiators: [
        'Column recognized by press association',
        'Columns that sparked school-wide conversation',
        'External syndication or republication',
      ],
      overclaimingRisks: [
        'Conflating opinions with impact',
        'Claiming influence without evidence',
      ],
      authenticPatterns: [
        'References specific columns and their reception',
        'Mentions reader responses or conversation generated',
      ],
    },
    {
      role: 'Literary Magazine Editor',
      expectedSignals: [
        'Curation judgment (selecting submissions)',
        'Layout and design decisions',
        'Managing submission/review process',
      ],
      differentiators: [
        'Increased submission volume through outreach',
        'CSPA or other design/content awards',
        'Introduced new formats or community engagement',
      ],
      overclaimingRisks: [
        'Claiming credit for others\' creative work',
        'Treating curation as creation',
      ],
      authenticPatterns: [
        'References submission numbers and selection process',
        'Mentions design or curation decisions',
      ],
    },
    {
      role: 'Freelance / Independent Writer',
      expectedSignals: [
        'Publication in external venues',
        'Self-directed project development',
        'Genre or subject matter focus',
      ],
      differentiators: [
        'Publication in competitively selected venues',
        'Writing awards (Scholastic, regional competitions)',
        'Established readership or following for substantive work',
      ],
      overclaimingRisks: [
        'Claiming "published" for self-published work',
        'Overstating blog readership',
        'Treating writing hobby as journalism',
      ],
      authenticPatterns: [
        'References specific venues and their selectivity',
        'Mentions revision process or editorial feedback',
      ],
    },
    {
      role: 'Broadcast / Multimedia Journalist',
      expectedSignals: [
        'Production skills (shooting, editing, scripting)',
        'Regular content production',
        'Platform management',
      ],
      differentiators: [
        'Coverage of significant school/community events',
        'Awards from broadcast journalism organizations',
        'Measurable viewership growth',
      ],
      overclaimingRisks: [
        'Conflating technical production with journalism',
        'View counts as quality metrics',
      ],
      authenticPatterns: [
        'References specific stories and their impact',
        'Mentions editorial decisions about coverage',
      ],
    },
  ],

  jargonExceptions: [
    {
      pattern: 'Scholastic Gold Key / Silver Key',
      whyItsTheException: 'Scholastic Awards are the most recognized student writing competition in the US. Naming the specific award level IS the achievement because AOs know the selectivity (Gold Key = top 1% of 100K+ submissions).',
      example: 'Scholastic Gold Key in journalism portfolio — directly communicates elite writing achievement.',
    },
    {
      pattern: 'NSPA Pacemaker / CSPA Crown',
      whyItsTheException: 'NSPA Pacemaker and CSPA Crown Awards are the "Pulitzer of student journalism." These names carry specific meaning for AOs who evaluate extracurriculars.',
      example: 'NSPA Pacemaker Award for The Beacon — signals nationally recognized publication quality.',
    },
    {
      pattern: 'AP Style',
      whyItsTheException: 'AP Style reference signals professional journalism training. It\'s the industry standard, and mentioning it briefly shows the student understands professional norms.',
      example: 'Established AP-style fact-checking protocol — shows professional standards awareness.',
    },
    {
      pattern: 'Investigative / Enterprise reporting',
      whyItsTheException: 'These are specific journalism genres that signal self-directed, in-depth work. AOs understand "investigative" means the student chose to dig into something, not just cover events.',
      example: 'Investigative series on district spending — the genre label communicates the depth of work.',
    },
    {
      pattern: 'Polyphony Lit / Adroit Journal',
      whyItsTheException: 'These teen literary journals are known for competitive acceptance rates. Naming them communicates selectivity that "published in literary magazine" alone does not.',
      example: 'Published in Polyphony Lit (8% acceptance) — the venue name IS the proof of quality.',
    },
  ],
};
