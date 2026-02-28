/**
 * Community Service & Volunteering Expertise Domain
 *
 * Covers: volunteering, tutoring, nonprofit work, mentoring, community outreach,
 * fundraising, environmental activism, mutual aid, advocacy.
 *
 * Key AO lens: Service activities are the MOST common on applications. AOs have
 * seen thousands of "volunteered at food bank" descriptions. The bar for standing
 * out is high — students must show INITIATIVE, SUSTAINED COMMITMENT, and
 * MEASURABLE IMPACT, not just attendance.
 *
 * Sources: Sara Harberson (former Penn AO), MIT admissions blog, NACAC surveys,
 * Harvard admissions committee published insights, IEC best practices.
 */

import type { ExpertiseDomain } from '../types';

export const COMMUNITY_SERVICE_DOMAIN: ExpertiseDomain = {
  domainId: 'community_service',
  label: 'Community Service & Volunteering',
  overview:
    'Community service is the single most common activity category on college applications. ' +
    'Over 70% of applicants list at least one service activity. This means AOs have extremely ' +
    'calibrated expectations: they instantly distinguish between resume-padding (logging hours ' +
    'for NHS requirements) and authentic commitment (creating something that outlasts you). ' +
    'The winning formula is INITIATIVE + SUSTAINED COMMITMENT + MEASURABLE IMPACT. ' +
    'Attendance is the floor, not the ceiling.',

  aoExpectations: {
    whatRegisters: [
      'Evidence of initiative — did the student CREATE something or just show up?',
      'Sustained commitment over time (2+ years signals authenticity, not obligation)',
      'Quantified impact with meaningful metrics (people served, outcomes changed, systems improved)',
      'Leadership WITHIN service — training others, scaling programs, solving operational problems',
      'Personal connection to the cause — WHY this cause, not just any cause',
      'Systemic thinking — did the student address root causes or just symptoms?',
    ],
    whatAOsSeeThrough: [
      'Hour-counting ("200+ hours of community service") — time spent is not impact achieved',
      'Organization name as credential ("Volunteered at Red Cross") — the org did not rub off on you',
      'Vague impact claims ("made a difference", "gave back to the community") — unmeasurable platitudes',
      'One-time service trips, especially international ("built houses in Guatemala for a week") — often performative',
      'Listing multiple unrelated service activities — signals breadth without depth',
      '"Raised awareness" as the outcome — AOs ask: awareness of WHAT, measured HOW?',
    ],
    goldenQuestion:
      'Would this program or initiative continue to exist if the student stopped showing up tomorrow?',
    readingTimeContext:
      'AOs spend approximately 8-10 seconds on each activity entry. In service activities — ' +
      'the most saturated category — they are actively looking for reasons to move on. ' +
      'Generic descriptions ("volunteered weekly at local food bank") are mentally skipped. ' +
      'The first 5 words determine whether they read the rest.',
    competitiveContext:
      'At selective institutions, 70-80% of applicants list community service. The vast majority ' +
      'describe attendance ("volunteered at...") rather than impact. Students who demonstrate ' +
      'program creation, systemic improvement, or sustained mentoring relationships stand out ' +
      'dramatically because they are the 5-10% who moved beyond participation to leadership.',
  },

  realExpertiseSignals: [
    {
      id: 'cs_program_creation',
      pattern: 'program_creation',
      description:
        'Student founded, designed, or built a new program rather than joining an existing one',
      whyItWorks:
        'Creating something from scratch proves initiative, organizational skills, and authentic ' +
        'passion. AOs know that founding a program is orders of magnitude harder than volunteering ' +
        'for one — it requires identifying a gap, recruiting others, securing resources, and sustaining effort.',
      examples: [
        'Founded free SAT prep program for Title I students; 40 students weekly, avg +120 pt improvement',
        'Created peer mental health check-in system adopted by 3 high schools in district',
        'Designed and launched bilingual homework help hotline serving 200+ families annually',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'founded', 'created', 'launched', 'established', 'designed', 'built',
        'started', 'initiated', 'developed', 'program', 'initiative', 'organization',
      ],
    },
    {
      id: 'cs_systemic_impact',
      pattern: 'systemic_improvement',
      description:
        'Student improved the SYSTEM, not just performed within it — redesigned processes, ' +
        'fixed inefficiencies, created lasting infrastructure',
      whyItWorks:
        'Systemic thinking separates leaders from participants. AOs value students who see ' +
        'broken systems and fix them rather than just working harder within broken systems. ' +
        'This signals the kind of thinking that drives change on a college campus.',
      examples: [
        'Redesigned food pantry distribution system, reducing wait time 45% and waste 30%',
        'Built volunteer scheduling database, eliminating 10 hrs/week of manual coordination',
        'Created intake form system for tutoring program that matched students to tutors by subject + learning style',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'redesigned', 'restructured', 'improved', 'optimized', 'streamlined',
        'system', 'process', 'workflow', 'efficiency', 'reduced', 'eliminated',
      ],
    },
    {
      id: 'cs_sustained_relationship',
      pattern: 'sustained_mentoring',
      description:
        'Long-term mentoring or tutoring relationship with specific individuals, showing ' +
        'sustained commitment and personal investment',
      whyItWorks:
        'Multi-year relationships prove authenticity in a way that hours cannot. AOs know ' +
        'that maintaining a mentoring relationship through challenges requires genuine care, ' +
        'not resume padding. Tracking individual outcomes (mentee achievements) shows investment.',
      examples: [
        '3-year mentor to 4 middle schoolers; 2 now in honors programs, 1 received scholarship',
        'Weekly ESL tutor to same family for 2 years; mother passed citizenship exam',
        'Mentored foster youth through college application process; 3 of 5 mentees enrolled in 4-year colleges',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'mentor', 'mentee', 'tutor', 'tutoring', 'year', 'years', 'weekly',
        'relationship', 'ongoing', 'sustained', 'continued', 'long-term',
      ],
    },
    {
      id: 'cs_scale_with_context',
      pattern: 'quantified_scale',
      description:
        'Specific numbers with meaningful context — not just "many people" but exactly how many, ' +
        'with context that makes the number impressive',
      whyItWorks:
        'Numbers are the fastest way to communicate impact in 150 characters. But raw numbers ' +
        'without context ("served 500 people") are less powerful than contextualized numbers ' +
        '("served 500 families in food desert, only program within 15 miles"). Context makes ' +
        'the scale meaningful.',
      examples: [
        'Organized 200-volunteer creek cleanup; removed 2.1 tons of waste across 8-mile stretch',
        'Coordinated monthly meal service for 120 unhoused individuals at 3 shelter sites',
        'Tutored 35 students weekly in math; grade-level proficiency rose from 40% to 72%',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'students', 'families', 'people', 'volunteers', 'meals', 'hours',
        'weekly', 'monthly', 'annually', 'served', 'reached', 'impacted',
      ],
    },
    {
      id: 'cs_org_recognition',
      pattern: 'external_validation',
      description:
        'Recognition from the organization or community — named awards, expanded roles, ' +
        'or responsibilities that only come from demonstrated excellence',
      whyItWorks:
        'External validation from the organizations students serve is powerful because it is ' +
        'earned, not self-reported. Being selected from a large volunteer pool, receiving a named ' +
        'award, or being given expanded responsibilities shows the organization itself valued ' +
        'the contribution. This is third-party proof.',
      examples: [
        'Named Volunteer of the Year from 300+ volunteers at regional food bank',
        'Invited to join nonprofit board of directors as youth representative (youngest member)',
        'Selected to train all incoming volunteers after first year; created 20-page orientation guide',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'named', 'awarded', 'selected', 'recognized', 'promoted', 'invited',
        'volunteer of the year', 'board', 'representative', 'chosen',
      ],
    },
    {
      id: 'cs_leadership_within_service',
      pattern: 'leadership_development',
      description:
        'Taking on leadership roles within the service organization — training others, ' +
        'managing teams, overseeing operations',
      whyItWorks:
        'Leadership within service demonstrates growth trajectory. AOs see the progression ' +
        'from volunteer to leader as evidence of maturity and organizational skill. Training ' +
        'other volunteers is especially powerful — it shows the student has mastered the work ' +
        'well enough to teach it.',
      examples: [
        'Trained 12 new tutoring volunteers; developed training curriculum and assessment rubric',
        'Promoted to site coordinator after 1 year; managed 25 volunteers across 3 weekly sessions',
        'Led team of 8 peer mentors; designed weekly reflection sessions and mentor support system',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'impact',
      detectionKeywords: [
        'trained', 'managed', 'led', 'coordinated', 'supervised', 'oversaw',
        'team', 'volunteers', 'coordinator', 'leader', 'captain', 'director',
      ],
    },
    {
      id: 'cs_gap_identification',
      pattern: 'need_identification',
      description:
        'Student identified an unmet need in their community and responded to it, rather ' +
        'than joining a pre-existing program',
      whyItWorks:
        'Identifying a gap requires awareness, empathy, and analytical thinking. AOs value ' +
        'students who notice what is missing — not just what is offered. This signals the kind ' +
        'of student who will identify needs on campus and create solutions, not just consume ' +
        'existing programming.',
      examples: [
        'Noticed no translation services at parent-teacher conferences; organized volunteer interpreter corps for 6 languages',
        'Identified food insecurity among classmates; launched discreet school pantry, now serves 45 students',
        'Recognized gap in senior tech literacy; started weekly smartphone/email classes at 2 senior centers',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'noticed', 'identified', 'recognized', 'saw need', 'gap', 'lacked',
        'no existing', 'missing', 'underserved', 'unmet', 'responded',
      ],
    },
    {
      id: 'cs_outcome_tracking',
      pattern: 'measured_outcomes',
      description:
        'Student tracked and can report specific outcomes — not just activities performed, ' +
        'but changes achieved in the people or systems served',
      whyItWorks:
        'Outcome tracking proves seriousness and analytical thinking. Most volunteers can say ' +
        'what they DID but not what CHANGED because of it. Students who track outcomes demonstrate ' +
        'that they care about results, not just effort — exactly the mindset AOs want.',
      examples: [
        'Tracked tutee progress monthly; average math grade improved from C- to B+ over semester',
        'Surveyed food pantry clients quarterly; satisfaction rose from 62% to 89% after workflow changes',
        'Documented mentor program outcomes: 85% of mentees stayed on track for graduation vs 60% school avg',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'tracked', 'measured', 'surveyed', 'data', 'outcomes', 'results',
        'improvement', 'increased', 'decreased', 'rose', 'grew', 'progress',
      ],
    },
    {
      id: 'cs_fundraising_with_strategy',
      pattern: 'strategic_fundraising',
      description:
        'Fundraising with specific strategy, target, and result — not just "helped raise money" ' +
        'but designed the campaign, set the goal, and hit it',
      whyItWorks:
        'Strategic fundraising requires planning, marketing, persuasion, and execution. AOs ' +
        'distinguish between students who held a bake sale and students who designed a multi-channel ' +
        'campaign with a specific target. The strategy matters as much as the amount.',
      examples: [
        'Designed crowdfunding campaign for school garden; raised $4,200 from 180 donors in 3 weeks',
        'Organized charity 5K: recruited 15 sponsors, 320 runners, raised $18K for pediatric cancer research',
        'Created annual benefit concert series; Year 1: $2K, Year 3: $8K, funded 12 scholarships',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'impact',
      detectionKeywords: [
        'raised', 'fundraised', 'campaign', 'donors', 'sponsors', 'revenue',
        'grant', 'funding', 'benefit', 'charity', 'donated', 'contributed',
      ],
    },
    {
      id: 'cs_advocacy_with_result',
      pattern: 'policy_advocacy',
      description:
        'Advocacy that produced tangible policy change or institutional response — not just ' +
        '"raised awareness" but actually moved the needle',
      whyItWorks:
        'Advocacy with results proves persistence and strategic thinking. AOs have read ' +
        'thousands of "raised awareness about X" descriptions and they register as empty. ' +
        'But a student who actually changed a school policy, secured budget allocation, or ' +
        'influenced a local ordinance demonstrates real civic engagement.',
      examples: [
        'Petitioned school board for menstrual product access; policy adopted district-wide, 14 schools',
        'Testified at city council; secured $50K budget for youth mental health services',
        'Led student campaign for composting program; school reduced landfill waste 35% in first year',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'policy', 'petition', 'advocacy', 'testified', 'campaign', 'adopted',
        'passed', 'approved', 'ordinance', 'legislation', 'board', 'council',
      ],
    },
    {
      id: 'cs_replication_expansion',
      pattern: 'program_scaling',
      description:
        'Student expanded their program to additional sites, schools, or communities — evidence ' +
        'that the model works and others want it',
      whyItWorks:
        'Scaling a program is the ultimate proof that it works. When other schools, organizations, ' +
        'or communities adopt a student-created model, it validates the idea beyond the student\'s ' +
        'own effort. This signals entrepreneurial thinking within a service context.',
      examples: [
        'Tutoring program expanded to 3 schools; trained student leaders at each site to run independently',
        'Cleanup model adopted by 4 neighboring towns; created replication toolkit',
        'Peer mentoring program replicated in 2 districts after presenting results to superintendent',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'expanded', 'scaled', 'replicated', 'adopted', 'additional',
        'sites', 'schools', 'districts', 'model', 'toolkit', 'franchise',
      ],
    },
    {
      id: 'cs_personal_stake',
      pattern: 'personal_connection',
      description:
        'Authentic personal connection to the cause — lived experience, family history, ' +
        'or community membership that makes the service deeply personal',
      whyItWorks:
        'Personal stakes prove authenticity in a way nothing else can. A student who tutors ' +
        'immigrants because their own parents struggled with English has a story that cannot be ' +
        'manufactured. AOs value this connection because it predicts sustained commitment beyond ' +
        'the application process.',
      examples: [
        'As first-gen student, created college nav program for immigrant families like mine; guided 25 families',
        'After grandmother\'s Alzheimer\'s diagnosis, launched weekly music therapy visits at 2 memory care facilities',
        'Growing up in food desert, started school garden producing 200 lbs of produce for cafeteria annually',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'personal', 'family', 'community', 'grew up', 'experienced',
        'firsthand', 'inspired by', 'motivated by', 'my own', 'our',
      ],
    },
  ],

  nameDropTraps: [
    {
      id: 'cs_org_name_as_credential',
      pattern: 'Volunteered at [Organization Name]',
      whyStudentsUseIt:
        'Students believe the organization name adds prestige. "Volunteered at Red Cross" ' +
        'sounds more impressive than "volunteered at food bank" in their minds.',
      whyItFails:
        'AOs evaluate the STUDENT, not the organization. "Volunteered at Red Cross" tells ' +
        'AOs nothing about what the student actually did. The organization name consumes ' +
        'precious characters while communicating zero about the applicant\'s contribution.',
      betterAlternative:
        'Replace the organization name with your specific role and impact. The org can be ' +
        'mentioned in the position/organization field — the description should be ALL about you.',
      example: {
        nameDrop: 'Volunteered at Habitat for Humanity building homes for families in need',
        improved: 'Led 15-person framing crew on 6 home builds; trained 40+ first-time volunteers in safe construction',
        whatChanged:
          'Removed organization name (listed separately), replaced generic "building homes" with ' +
          'specific role (crew lead), added scale (6 builds, 40+ trainees), and showed leadership (training others).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 25,
      detectionKeywords: [
        'volunteered at', 'volunteer at', 'with', 'for', 'at the',
        'Red Cross', 'Habitat', 'Salvation Army', 'United Way', 'YMCA',
      ],
    },
    {
      id: 'cs_hour_counting',
      pattern: 'X hours of community service',
      whyStudentsUseIt:
        'Schools and NHS programs track hours, so students assume hours = value. ' +
        'More hours sounds more impressive to them.',
      whyItFails:
        'Hours measure TIME, not IMPACT. AOs know that 500 hours of passive attendance ' +
        'can produce less value than 50 hours of focused, strategic action. Hour-counting ' +
        'also signals obligation (NHS requirement) rather than authentic passion.',
      betterAlternative:
        'Replace hours with outcomes. Instead of telling AOs how long you were there, ' +
        'tell them what CHANGED because you were there.',
      example: {
        nameDrop: 'Completed 250+ hours of community service at local food bank',
        improved: 'Redesigned food sorting workflow, cutting volunteer processing time 40%; serve 300 families weekly',
        whatChanged:
          'Removed hour count entirely, replaced with specific contribution (workflow redesign), ' +
          'quantified the improvement (40% faster), and showed ongoing scale (300 families weekly).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'hours', 'hrs', 'hours of', 'service hours', 'volunteer hours',
        'completed', 'logged', 'accumulated',
      ],
    },
    {
      id: 'cs_vague_helping',
      pattern: '"Helped" or "assisted" without specifics',
      whyStudentsUseIt:
        'Students feel uncomfortable claiming credit and default to the most modest verb. ' +
        '"Helped" feels safe and accurate.',
      whyItFails:
        '"Helped" is the weakest verb in the English language for impact communication. ' +
        'It makes the student invisible — someone else did the real work, and the student ' +
        '"helped." AOs cannot distinguish between meaningful contribution and passive presence.',
      betterAlternative:
        'Replace "helped" with the specific action: what did YOU do? If you sorted donations, ' +
        'say "sorted." If you organized events, say "organized." Own your action.',
      example: {
        nameDrop: 'Helped organize community events and assisted with fundraising activities',
        improved: 'Planned 4 quarterly fundraisers, each drawing 100+ attendees; raised $12K total for youth programs',
        whatChanged:
          'Replaced "helped organize" and "assisted with" with specific owned actions (planned), ' +
          'added frequency (quarterly), scale (100+ attendees), and total impact ($12K for specific cause).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 12,
      detectionKeywords: [
        'helped', 'assisted', 'aided', 'supported', 'contributed to',
        'was part of', 'participated in', 'involved in',
      ],
    },
    {
      id: 'cs_raised_awareness',
      pattern: '"Raised awareness" as the outcome',
      whyStudentsUseIt:
        'When students cannot point to tangible outcomes, "raised awareness" feels like ' +
        'a safe, unchallengeable claim. It sounds impactful without requiring proof.',
      whyItFails:
        'AOs universally flag "raised awareness" as a meaningless outcome. Awareness cannot ' +
        'be measured, verified, or compared. It is the default claim when nothing concrete ' +
        'was achieved. AOs mentally translate it as "I posted on social media."',
      betterAlternative:
        'Replace with the specific action taken and its measurable result. If you held an event, ' +
        'how many people attended? If you created content, who engaged with it? If you advocated, ' +
        'what response did you get?',
      example: {
        nameDrop: 'Raised awareness about mental health issues among teens through social media campaigns',
        improved: 'Created peer support group, 30 weekly members; partnered with counselor to launch school-wide screening program',
        whatChanged:
          'Replaced unmeasurable "raised awareness" with concrete action (peer group creation), ' +
          'specific scale (30 weekly members), and institutional result (school-wide screening program).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 15,
      detectionKeywords: [
        'raised awareness', 'spread awareness', 'awareness', 'educate',
        'inform', 'bring attention', 'shed light', 'highlight',
      ],
    },
    {
      id: 'cs_made_a_difference',
      pattern: '"Made a difference" or "gave back"',
      whyStudentsUseIt:
        'These phrases feel emotionally resonant to students. They capture the feeling of ' +
        'service without requiring specifics.',
      whyItFails:
        'These are cliches that AOs encounter hundreds of times per cycle. They communicate ' +
        'zero specific information. "Made a difference" is unfalsifiable and unverifiable — ' +
        'it is the verbal equivalent of dead air in a 150-character space.',
      betterAlternative:
        'Show the difference, don\'t claim it. Replace the phrase with the specific change: ' +
        'what was the situation before, what is it after, and what did you do to cause the change?',
      example: {
        nameDrop: 'Gave back to my community by making a difference in the lives of underprivileged youth',
        improved: 'Matched 20 at-risk 8th graders with high school mentors; 18 of 20 enrolled in college-prep track',
        whatChanged:
          'Removed both cliches ("gave back" and "made a difference"), replaced generic "underprivileged youth" ' +
          'with specific population (at-risk 8th graders), and showed measurable outcome (18/20 in college-prep).',
      },
      prevalence: 'common',
      typicalCharWaste: 30,
      detectionKeywords: [
        'made a difference', 'gave back', 'giving back', 'make an impact',
        'change lives', 'transform lives', 'help those in need',
      ],
    },
    {
      id: 'cs_service_trip',
      pattern: 'Short-term service trips as primary credential',
      whyStudentsUseIt:
        'International service trips feel transformative to the student. They also cost money, ' +
        'so students feel they should "count." The exotic location feels impressive.',
      whyItFails:
        'AOs, especially at selective institutions, are deeply skeptical of short-term service trips. ' +
        'They often cost thousands of dollars, last a week, and leave no sustained impact. The trip ' +
        'serves the student\'s resume more than the community. AOs call this "voluntourism."',
      betterAlternative:
        'If the trip genuinely changed something, lead with what you built or changed, not where ' +
        'you went. Better yet, describe what you did AFTER the trip — did it inspire ongoing local work?',
      example: {
        nameDrop: 'Traveled to Guatemala to build homes for underprivileged families during spring break',
        improved: 'After Guatemala build trip, launched local affordable housing advocacy group; testified at 3 zoning hearings',
        whatChanged:
          'Shifted from the trip itself (one week, likely paid by parents) to the sustained action ' +
          'it inspired (local advocacy group, specific civic engagement at zoning hearings).',
      },
      prevalence: 'common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'traveled to', 'trip to', 'mission trip', 'service trip',
        'spring break', 'summer trip', 'abroad', 'international',
      ],
    },
    {
      id: 'cs_nhs_membership',
      pattern: 'National Honor Society membership as service',
      whyStudentsUseIt:
        'NHS has a service component, so students count NHS activities as community service. ' +
        'The NHS brand feels prestigious.',
      whyItFails:
        'AOs know NHS service is often mandatory and formulaic. "NHS community service" signals ' +
        'obligation, not passion. It also wastes characters on the organization name rather than ' +
        'the student\'s unique contribution.',
      betterAlternative:
        'If you did genuinely impactful work through NHS, describe the work — not the organization. ' +
        'The work should stand on its own without the NHS label.',
      example: {
        nameDrop: 'Active member of National Honor Society, participating in community service projects',
        improved: 'Organized monthly book drives collecting 2,000+ books; launched free library at 3 community laundromats',
        whatChanged:
          'Removed NHS name (listed in organization field), replaced generic "participating" with ' +
          'specific owned action (organized), added concrete result (2,000 books, 3 free libraries).',
      },
      prevalence: 'common',
      typicalCharWaste: 30,
      detectionKeywords: [
        'NHS', 'National Honor Society', 'honor society', 'member of',
        'active member', 'participate in',
      ],
    },
    {
      id: 'cs_food_bank_generic',
      pattern: 'Generic food bank / soup kitchen descriptions',
      whyStudentsUseIt:
        'Food bank volunteering is extremely common and students describe it at face value: ' +
        '"volunteered at food bank, sorted donations, served meals." It feels accurate.',
      whyItFails:
        'AOs read virtually identical food bank descriptions every cycle. "Sorted donations ' +
        'and served meals" describes the TASK, not the STUDENT. It is interchangeable with ' +
        'any other volunteer who stood in the same spot.',
      betterAlternative:
        'What did YOU bring to this food bank that nobody else would? Did you improve a process, ' +
        'solve a problem, build a relationship, or grow in an unexpected way?',
      example: {
        nameDrop: 'Volunteer at local food bank, sorting donations and distributing food to families in need',
        improved: 'Identified shelf-life tracking gap at food bank; built inventory system reducing spoilage 60%, saving $800/month',
        whatChanged:
          'Replaced generic task description with a specific problem the student uniquely identified and solved, ' +
          'with quantified improvement (60% less spoilage) and financial impact ($800/month).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 15,
      detectionKeywords: [
        'food bank', 'soup kitchen', 'food pantry', 'sorted donations',
        'served meals', 'distributed food', 'food drive',
      ],
    },
    {
      id: 'cs_passion_language',
      pattern: 'Passion language without evidence',
      whyStudentsUseIt:
        'Students want to communicate how much they CARE. They believe emotional intensity ' +
        'compensates for lack of specific achievements.',
      whyItFails:
        'Every applicant is "passionate" — AOs are desensitized to this word and its synonyms. ' +
        'Passion is demonstrated through ACTIONS and COMMITMENT, not declared in a description. ' +
        'Every character spent on passion claims is a character not spent on evidence.',
      betterAlternative:
        'Remove all passion declarations and let the actions speak. Three years of weekly ' +
        'tutoring communicates passion far more effectively than the word "passionate."',
      example: {
        nameDrop: 'Passionate about helping underprivileged youth access educational opportunities',
        improved: 'Tutored 15 low-income students weekly for 3 years; 12 admitted to magnet high school programs',
        whatChanged:
          'Replaced passion claim with evidence of passion: specific scale (15 students), ' +
          'duration (3 years), frequency (weekly), and outcomes (12 admitted to magnet programs).',
      },
      prevalence: 'common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'passionate', 'passion', 'dedicated', 'committed', 'devoted',
        'love helping', 'care deeply', 'believe in',
      ],
    },
    {
      id: 'cs_multiple_orgs_listed',
      pattern: 'Listing multiple organizations to show breadth',
      whyStudentsUseIt:
        'Students think more organizations = more impressive. They want to show they served ' +
        'in many places.',
      whyItFails:
        'AOs prefer depth over breadth in service. Listing 4 organizations in 150 characters ' +
        'leaves no room for impact at ANY of them. It signals someone who bounced between ' +
        'opportunities rather than committing deeply to one cause.',
      betterAlternative:
        'Focus on one organization or cause and go deep. If you must show breadth, use the ' +
        'activities list — each entry should have ONE focused story.',
      example: {
        nameDrop: 'Volunteered at Red Cross, Habitat for Humanity, local food bank, and community garden',
        improved: 'Grew community garden from 4 to 24 plots; 12 refugee families now grow native crops, reducing grocery costs 30%',
        whatChanged:
          'Focused on one activity (community garden), showed growth (4 to 24 plots), specific beneficiaries ' +
          '(12 refugee families), and quantified economic impact (30% grocery cost reduction).',
      },
      prevalence: 'common',
      typicalCharWaste: 40,
      detectionKeywords: [
        'and', 'also', 'as well as', 'in addition', 'various',
        'multiple', 'several organizations', 'different',
      ],
    },
  ],

  proofOfWorkPatterns: [
    {
      id: 'cs_logistics_knowledge',
      pattern: 'Demonstrates understanding of nonprofit operational challenges',
      whyItProves:
        'Only someone who actually ran a service program knows about volunteer scheduling ' +
        'conflicts, donation storage constraints, liability forms, or partner organization ' +
        'politics. Mentioning these operational details is a fingerprint of real involvement.',
      examples: [
        'Solved liability insurance gap that blocked under-18 volunteers; negotiated waiver with school district',
        'Managed 3 conflicting schedules (volunteers, site availability, tutee transportation) weekly',
        'Created food safety compliance checklist after health department inspection feedback',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student actually managed something. They dealt with real-world constraints, not ' +
        'just good intentions. They will bring this operational maturity to student organizations.',
    },
    {
      id: 'cs_relationship_depth',
      pattern: 'References specific individuals and their progress',
      whyItProves:
        'Referencing specific people (by role, not name) and their progress over time shows ' +
        'genuine relational investment. A resume-padder describes tasks; a genuine mentor ' +
        'describes people.',
      examples: [
        'My mentee went from failing math to earning a B+; she now tutors younger students herself',
        'One ESL student I worked with for 2 years just got her first job requiring English fluency',
        'Watched a shy 6th grader become the peer tutor leader by 8th grade through our program',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student is genuinely invested in the people they serve. They tracked individual ' +
        'outcomes because they cared, not because they had to report them.',
    },
    {
      id: 'cs_iteration_learning',
      pattern: 'Describes failures, iterations, and improvements to their service model',
      whyItProves:
        'Only someone who actually ran a program can describe what went wrong and how they ' +
        'fixed it. Failure stories are the strongest proof of authentic engagement because ' +
        'resume-padders only report successes.',
      examples: [
        'First food drive collected 50 items; analyzed low turnout, redesigned promotion strategy → next drive: 400 items',
        'Initial tutoring matching failed (60% no-shows); added student interest surveys → attendance rose to 90%',
        'Year 1 fundraiser lost money on venue; switched to school gym format, doubled net revenue Year 2',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student has genuine operational experience. They failed, learned, and improved — ' +
        'exactly the growth mindset we look for in college students.',
    },
    {
      id: 'cs_sustainability_thinking',
      pattern: 'Built systems or trained successors to ensure continuity',
      whyItProves:
        'Creating documentation, training successors, or building systems that outlast your ' +
        'involvement proves mature, systemic thinking. It shows the student cares about the ' +
        'CAUSE, not just their resume — the program does not need them to survive.',
      examples: [
        'Wrote 30-page operations manual for incoming tutoring coordinators; program entering 4th year without me',
        'Trained 3 junior students as co-leaders to ensure smooth transition after graduation',
        'Created online platform for scheduling that will serve the program for years after I leave',
      ],
      expertiseLevel: 'expert',
      aoInterpretation:
        'This student thinks beyond themselves. Building for succession shows maturity rare in ' +
        'high schoolers. This is someone who will build lasting things on our campus.',
    },
    {
      id: 'cs_community_feedback',
      pattern: 'References feedback or input from the community being served',
      whyItProves:
        'Gathering and responding to feedback from the community shows humility and genuine ' +
        'service orientation. It proves the student listens to the people they serve rather ' +
        'than assuming they know best — a sophisticated understanding of service.',
      examples: [
        'Surveyed tutoring families quarterly; shifted to Saturday sessions after learning weekday transportation was a barrier',
        'Added halal/vegetarian options to meal program after resident feedback; participation increased 25%',
        'Changed mentoring meeting format after mentees requested more college visit trips and fewer classroom sessions',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student practices real service — they listen to the community, adapt their approach, ' +
        'and prioritize the beneficiaries\' needs over their own convenience.',
    },
    {
      id: 'cs_resource_mobilization',
      pattern: 'Mobilized resources beyond personal time — grants, partnerships, donations',
      whyItProves:
        'Securing external resources (grants, donations, partnerships, in-kind support) requires ' +
        'persuasion, planning, and credibility. A student who can convince adults to invest in ' +
        'their vision has demonstrated real leadership capacity.',
      examples: [
        'Secured $3,000 grant from community foundation to fund tutoring supplies and snacks',
        'Partnered with 4 local businesses for monthly supply donations; eliminated out-of-pocket costs',
        'Wrote successful proposal to school board for $5K annual budget line for mentoring program',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student can mobilize resources and build coalitions. They did not just work hard — ' +
        'they leveraged others\' resources to amplify impact. This is executive-level thinking.',
    },
    {
      id: 'cs_cross_cultural_competence',
      pattern: 'Navigated cultural or language barriers in service',
      whyItProves:
        'Working across cultural and linguistic boundaries requires patience, cultural sensitivity, ' +
        'and communication skills that cannot be faked. Specific cultural navigation details ' +
        '(learning phrases in another language, adapting curriculum for different learning styles, ' +
        'respecting cultural norms) prove genuine cross-cultural engagement.',
      examples: [
        'Learned conversational Spanish to communicate directly with tutee parents; reduced interpreter reliance 70%',
        'Adapted tutoring materials for Somali refugee students; incorporated oral storytelling tradition into reading practice',
        'Navigated cultural norms around food preparation to create inclusive meal program serving 8 dietary traditions',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student has real cross-cultural competence built through experience, not coursework. ' +
        'They will bring cultural fluency to our diverse campus community.',
    },
  ],

  descriptionTransforms: [
    {
      id: 'cs_transform_attendance_to_impact',
      transformType: 'generic_to_specific',
      before: 'Volunteered at local food bank every Saturday',
      after: 'Reorganized food bank intake process; cut family wait time from 45 to 15 min, now serving 80 families/week',
      explanation:
        'Attendance ("every Saturday") tells AOs nothing about what you contributed. ' +
        'The transformation replaces when you showed up with what CHANGED because you did.',
      charsBefore: 46,
      charsAfter: 96,
      principle: 'Replace WHEN with WHAT CHANGED',
    },
    {
      id: 'cs_transform_passive_to_active',
      transformType: 'passive_to_active',
      before: 'Was involved in organizing community cleanup events',
      after: 'Led 6 river cleanups, 150+ volunteers total; removed 3,200 lbs of waste, earned city environmental citation',
      explanation:
        '"Was involved in" makes the student invisible. The transformation gives them ' +
        'ownership with specific scale, cumulative result, and external recognition.',
      charsBefore: 51,
      charsAfter: 101,
      principle: 'Own the action — YOU did it, not the group',
    },
    {
      id: 'cs_transform_claim_to_evidence',
      transformType: 'claim_to_evidence',
      before: 'Made a significant impact on the lives of homeless individuals in our community',
      after: 'Built relationships with 12 shelter residents over 2 years; helped 4 secure employment, 3 find permanent housing',
      explanation:
        '"Significant impact" is a claim. The transformation provides the evidence: ' +
        'specific number of people, duration of commitment, and concrete outcomes.',
      charsBefore: 75,
      charsAfter: 110,
      principle: 'Claims cost the same characters as evidence — but evidence proves itself',
    },
    {
      id: 'cs_transform_hours_to_outcomes',
      transformType: 'duty_to_achievement',
      before: 'Completed 300+ volunteer hours tutoring students in math and science',
      after: 'Tutored 25 students in algebra; 22 passed state exam (vs. 60% school avg), 8 advanced to honors',
      explanation:
        'Hours measure your time, not your students\' growth. The transformation replaces ' +
        'input (your hours) with output (their results). AOs care about outcomes.',
      charsBefore: 60,
      charsAfter: 93,
      principle: 'Measure THEIR progress, not YOUR time',
    },
    {
      id: 'cs_transform_awareness_to_action',
      transformType: 'claim_to_evidence',
      before: 'Raised awareness about food insecurity in our school community',
      after: 'Launched discreet school pantry after identifying 45 students skipping meals; now serves 60 students daily',
      explanation:
        '"Raised awareness" is the laziest outcome claim in service descriptions. ' +
        'The transformation shows what DOING SOMETHING about food insecurity looks like — ' +
        'identifying the problem, creating the solution, measuring the reach.',
      charsBefore: 57,
      charsAfter: 99,
      principle: 'Awareness is the beginning; what did you DO with it?',
    },
    {
      id: 'cs_transform_org_to_role',
      transformType: 'name_drop_to_impact',
      before: 'Volunteer at the American Red Cross participating in disaster relief efforts',
      after: 'Coordinated disaster supply distribution for 200+ families during 2 flood events; trained 30 new volunteers',
      explanation:
        'The organization name belongs in the position/org field, not the description. ' +
        'The description should be 100% about what YOU did and what CHANGED.',
      charsBefore: 71,
      charsAfter: 103,
      principle: 'The description is YOUR story, not the organization\'s brand',
    },
    {
      id: 'cs_transform_duty_to_growth',
      transformType: 'duty_to_achievement',
      before: 'Responsible for training new volunteers and managing weekly sessions',
      after: 'Developed volunteer training curriculum from scratch; retention rate doubled to 80% after implementing mentorship pairings',
      explanation:
        '"Responsible for" describes a job duty. The transformation shows what the student ' +
        'CREATED (curriculum) and the RESULT (doubled retention). The growth is the story.',
      charsBefore: 63,
      charsAfter: 111,
      principle: 'Duties are given to you; achievements are created by you',
    },
    {
      id: 'cs_transform_generic_tutoring',
      transformType: 'generic_to_specific',
      before: 'Tutored underprivileged students in various subjects after school',
      after: 'Weekly algebra tutor for 8 immigrant students; created visual worksheets in 3 languages, all 8 passed Regents',
      explanation:
        'Generic tutoring descriptions are interchangeable with thousands of others. ' +
        'The transformation shows HOW the student tutored (visual, multilingual), WHO (specific), ' +
        'and the RESULT (100% pass rate on specific exam).',
      charsBefore: 56,
      charsAfter: 105,
      principle: 'Specificity is the antidote to generic service descriptions',
    },
    {
      id: 'cs_transform_breadth_to_depth',
      transformType: 'generic_to_specific',
      before: 'Involved in various community service activities including food drives, cleanups, and tutoring',
      after: 'Founded after-school reading program at Title I elementary; 35 students improved avg 1.5 grade levels in 1 year',
      explanation:
        'Listing multiple activities communicates breadth but zero depth. AOs value one ' +
        'deep commitment over five shallow ones. The transformation picks the strongest ' +
        'activity and tells its full story.',
      charsBefore: 85,
      charsAfter: 102,
      principle: 'Depth beats breadth — tell one story well rather than five stories poorly',
    },
    {
      id: 'cs_transform_jargon_to_humanity',
      transformType: 'jargon_to_outcome',
      before: 'Implemented evidence-based intervention strategies for at-risk youth populations',
      after: 'Met weekly with 6 struggling freshmen as peer mentor; 5 stayed enrolled, 3 made honor roll by spring',
      explanation:
        'Academic/nonprofit jargon ("evidence-based intervention strategies", "at-risk youth populations") ' +
        'dehumanizes both the student and the people they serve. The transformation uses human language ' +
        'and specific outcomes.',
      charsBefore: 72,
      charsAfter: 97,
      principle: 'Write like a human, not a grant proposal',
    },
  ],

  verbHierarchy: [
    {
      tier: 'power',
      verbs: [
        'founded', 'created', 'launched', 'designed', 'built',
        'secured', 'mobilized', 'expanded', 'transformed', 'pioneered',
      ],
      context:
        'In service contexts, power verbs signal INITIATIVE and OWNERSHIP. AOs respond to verbs ' +
        'that show the student CREATED something rather than participated in something created ' +
        'by others. These verbs position the student as the origin of action.',
      exampleUsage: 'Founded peer tutoring program serving 40 students weekly across 3 subjects',
    },
    {
      tier: 'standard',
      verbs: [
        'organized', 'coordinated', 'managed', 'led', 'trained',
        'developed', 'implemented', 'facilitated', 'mentored', 'recruited',
      ],
      context:
        'Standard verbs in service are solid but common. They show competence and responsibility ' +
        'but do not on their own distinguish the student. "Organized" is fine but needs a strong ' +
        'object and result to be memorable.',
      exampleUsage: 'Coordinated 25 volunteers for weekly meal service at downtown shelter',
    },
    {
      tier: 'weak',
      verbs: [
        'helped', 'assisted', 'participated', 'contributed', 'volunteered',
        'supported', 'attended', 'was involved', 'worked with', 'engaged in',
      ],
      context:
        'Weak verbs make the student invisible. They position the student as a helper rather ' +
        'than a doer. "Helped organize" means someone else organized and you helped — the credit ' +
        'goes to the invisible organizer, not to you. Every weak verb should be replaced.',
      exampleUsage: 'Helped with community events (vs. "Planned 4 community events drawing 400+ attendees")',
    },
  ],

  roleExpertise: [
    {
      role: 'Founder / Program Creator',
      expectedSignals: [
        'Identified a gap or need in the community before creating the program',
        'Built the program from scratch — recruited volunteers, secured resources, designed curriculum',
        'Can articulate the problem-solution fit: why THIS approach for THIS community',
        'Program has specific, measurable impact on specific beneficiaries',
      ],
      differentiators: [
        'Program survived beyond the founder (succession planning)',
        'Program was replicated or adopted by other organizations/schools',
        'Secured external funding (grants, donations, sponsorships)',
        'Received recognition from community organizations or local government',
        'Generated media coverage or academic interest',
      ],
      overclaimingRisks: [
        'Claiming "nonprofit" status for a small informal group',
        'Inflating participant numbers or impact metrics',
        'Taking sole credit for group-created programs',
        'Calling a school club a "community organization"',
      ],
      authenticPatterns: [
        'References specific early challenges ("first month, only 3 students showed up")',
        'Mentions iteration and learning ("redesigned after feedback")',
        'Names specific partner organizations or supporters',
        'Tracks growth over time with specific milestones',
      ],
    },
    {
      role: 'Regular Volunteer / Team Member',
      expectedSignals: [
        'Consistent attendance over a sustained period (1+ years)',
        'Specific tasks performed with competence',
        'Growth from new volunteer to experienced contributor',
        'Positive relationships with beneficiaries or staff',
      ],
      differentiators: [
        'Took initiative beyond assigned tasks without being asked',
        'Identified and solved a problem the organization had not addressed',
        'Was promoted or given expanded responsibilities based on performance',
        'Trained newer volunteers or improved processes',
        'Received specific recognition from organization leadership',
      ],
      overclaimingRisks: [
        'Claiming credit for the organization\'s overall impact',
        'Presenting assigned duties as personal initiatives',
        'Inflating role beyond actual responsibilities',
        'Describing one-time events as regular commitments',
      ],
      authenticPatterns: [
        'References specific regular tasks and how they evolved',
        'Mentions relationships with specific beneficiaries (by role, not name)',
        'Describes growth from new to experienced volunteer',
        'Acknowledges learning from mistakes or challenges',
      ],
    },
    {
      role: 'Tutor / Mentor',
      expectedSignals: [
        'Consistent, scheduled sessions with specific students',
        'Subject-specific knowledge demonstrated through teaching approach',
        'Evidence of student progress or growth over time',
        'Patience and adaptability in teaching methods',
      ],
      differentiators: [
        'Created original teaching materials or curriculum',
        'Tracked and can report specific student outcomes (grades, test scores)',
        'Adapted methods for different learning styles or needs',
        'Mentee achievements that directly resulted from the mentoring relationship',
        'Scaled from 1:1 to organizing a tutoring program',
      ],
      overclaimingRisks: [
        'Taking full credit for a student\'s improvement (many factors contribute)',
        'Claiming expertise in subjects beyond actual competence',
        'Inflating the number of students or duration',
        'Describing homework help as "tutoring program"',
      ],
      authenticPatterns: [
        'References specific teaching strategies and why they worked',
        'Describes specific student breakthroughs or challenges',
        'Mentions adapting approach when something was not working',
        'Tracks individual student progress with specific metrics',
      ],
    },
    {
      role: 'Fundraiser / Event Organizer',
      expectedSignals: [
        'Specific fundraising target and result',
        'Clear strategy for reaching donors or attendees',
        'Logistics management (venue, supplies, volunteers, promotion)',
        'Financial accountability (tracking expenses, reporting results)',
      ],
      differentiators: [
        'Year-over-year growth in fundraising results',
        'Innovative fundraising strategies beyond traditional methods',
        'Secured corporate sponsors or major donors through personal outreach',
        'Managed multi-channel campaigns (in-person, online, social)',
        'Directed funds to specific, trackable outcomes',
      ],
      overclaimingRisks: [
        'Taking full credit for team fundraising efforts',
        'Counting gross revenue without mentioning expenses',
        'Claiming "organized" when another adult planned it',
        'Inflating attendance or donation numbers',
      ],
      authenticPatterns: [
        'Mentions specific fundraising strategies and why they chose them',
        'References logistical challenges and how they were solved',
        'Tracks financial results accurately (net, not just gross)',
        'Describes what the funds were used for and the resulting impact',
      ],
    },
    {
      role: 'Advocate / Activist',
      expectedSignals: [
        'Deep knowledge of the specific issue being advocated for',
        'Strategic approach to advocacy (not just social media posting)',
        'Engagement with decision-makers (school board, local government, organizations)',
        'Understanding of the policy landscape and what change looks like',
      ],
      differentiators: [
        'Achieved actual policy change or institutional response',
        'Testified at public hearings or meetings',
        'Built coalition with other organizations or stakeholders',
        'Engaged media coverage or public discourse beyond social media',
        'Sustained advocacy over years with evolving strategy',
      ],
      overclaimingRisks: [
        'Equating social media activity with advocacy',
        'Claiming credit for policy changes driven by larger movements',
        'Using adult-organized protests as personal leadership examples',
        'Presenting awareness campaigns as concrete outcomes',
      ],
      authenticPatterns: [
        'References specific policy targets and outcomes',
        'Describes strategic decisions (why this approach, why this audience)',
        'Mentions setbacks and how strategy was adjusted',
        'Demonstrates deep understanding of the issue, not just surface-level concern',
      ],
    },
  ],

  jargonExceptions: [
    {
      pattern: 'Named award or recognition from a specific organization',
      whyItsTheException:
        'When a recognized organization bestows a specific named award, the award name IS the ' +
        'achievement. "President\'s Volunteer Service Award — Gold" communicates more than any ' +
        'rephrasing because the award has an established reputation.',
      example: 'Earned President\'s Volunteer Service Award — Gold (500+ hours); one of 12 recipients in county',
    },
    {
      pattern: 'Certified or licensed credential that required significant training',
      whyItsTheException:
        'Certifications like CPR Instructor, Wilderness First Responder, or Crisis Counselor ' +
        'certification represent real training investment and qualify the student for specific work. ' +
        'The credential name proves capability.',
      example: 'Earned Crisis Text Line counselor certification (200-hr training); handled 150+ conversations with at-risk youth',
    },
    {
      pattern: 'Specific program model with established reputation',
      whyItsTheException:
        'Some service program models (AmeriCorps, City Year, specific fellowship names) are ' +
        'known to AOs as highly competitive or rigorous. Naming them communicates selectivity ' +
        'and program quality that would take many characters to explain otherwise.',
      example: 'Selected for Posse Foundation community service fellowship (5% acceptance rate); led team of 10 in neighborhood revitalization',
    },
    {
      pattern: 'Legislation or policy by its official name',
      whyItsTheException:
        'When a student helped pass, advocate for, or implement a specific named policy or ' +
        'ordinance, the policy name IS the result. "Helped pass the Clean Water Resolution" ' +
        'is more concrete than "advocated for environmental policy."',
      example: 'Co-authored and lobbied for School Board Resolution 2024-07 mandating composting in all district cafeterias',
    },
  ],
};
