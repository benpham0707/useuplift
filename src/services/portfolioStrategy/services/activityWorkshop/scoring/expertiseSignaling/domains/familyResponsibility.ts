/**
 * Family Responsibility Expertise Domain
 *
 * Covers: Caregiving, family business work, sibling care, household management,
 * translation/interpretation for family, farm work, elder care, disability
 * caregiving, financial management for the family.
 *
 * CRITICAL CONTEXT — THIS DOMAIN IS FUNDAMENTALLY DIFFERENT:
 *
 * Family responsibilities are NOT optional activities. They are obligations born
 * from necessity — economic, cultural, or familial. AOs evaluate these through a
 * COMPLETELY different lens than other activities:
 *
 * - The question is NOT "how impressive is this?" but "what does this reveal
 *   about character, maturity, and resilience?"
 * - First-generation, low-income, and immigrant contexts make these activities
 *   MORE meaningful, not less
 * - The biggest problem is UNDERSELLING — students often don't realize that
 *   these responsibilities are among the most character-revealing parts of
 *   their application
 * - AOs deeply respect students who shoulder family responsibilities because
 *   they demonstrate qualities that cannot be taught: sacrifice, maturity,
 *   reliability, and unconditional commitment
 *
 * The scoring and teaching approach must be SENSITIVE and EMPOWERING. Never
 * make students feel they need to "dress up" family responsibilities to look
 * like traditional extracurriculars. Instead, help them articulate the SCOPE,
 * the SKILLS developed, and the CHARACTER demonstrated.
 *
 * Sources: Sara Harberson, QuestBridge advisor insights, first-gen admissions
 * initiatives (MIT, Stanford, Yale), NACAC guidance on holistic review,
 * published AO perspectives on context activities.
 */

import type { ExpertiseDomain } from '../types';

export const FAMILY_RESPONSIBILITY_DOMAIN: ExpertiseDomain = {
  domainId: 'family_responsibility',
  label: 'Family Responsibility',
  overview:
    'Caregiving, family business, sibling care, household management, translation, farm work, ' +
    'and elder care. These activities are CONTEXT activities — they explain the student\'s ' +
    'circumstances and make every other achievement on the application more impressive. AOs ' +
    'evaluate these through the lens of CHARACTER, MATURITY, and RESILIENCE, not conventional ' +
    'impact metrics. The biggest challenge is helping students articulate what they do without ' +
    'underselling or over-dramatizing.',

  aoExpectations: {
    whatRegisters: [
      'Scope of responsibility: hours per week, number of dependents, duration in years — this IS the impact',
      'Skills developed through necessity: financial management, medical navigation, language brokering, logistics',
      'Sacrifice acknowledged honestly: what the student gave up or managed alongside family duties',
      'Maturity indicators: navigating adult systems (insurance, legal, medical) while still a teenager',
      'Cultural context: responsibilities rooted in family values, immigration experience, or economic necessity',
      'Bridge to other activities: how family responsibilities developed skills applied elsewhere',
    ],
    whatAOsSeeThrough: [
      'Minimizing language: "helped around the house" when the student was the primary household manager',
      'Over-dramatizing: turning family duties into a pity narrative — AOs respect dignity over drama',
      'Missing context: listing hours without explaining what those hours replaced (studying, socializing, sleep)',
      'Generic framing: "Babysit siblings" when the student was the primary childcare provider 25 hrs/week',
      'Comparing to traditional activities: trying to make caregiving sound like an extracurricular club',
    ],
    goldenQuestion:
      'What does this responsibility reveal about this student\'s character, and how does it reframe ' +
      'every other part of the application?',
    readingTimeContext:
      'AOs spend MORE time on family responsibility activities than on typical extracurriculars when ' +
      'the description signals genuine hardship and resilience. These entries often become the emotional ' +
      'anchor of the application. But generic entries ("help at home") are skimmed in seconds.',
    competitiveContext:
      'Family responsibilities are NOT compared to other extracurriculars. They are CONTEXT that makes ' +
      'the rest of the application legible. A 3.8 GPA with 25 hours/week of caregiving is fundamentally ' +
      'different from a 3.8 GPA with 25 hours/week of optional enrichment. AOs know this and actively ' +
      'look for these context clues, especially at schools committed to equity and access.',
  },

  realExpertiseSignals: [
    {
      id: 'fr_scope_quantification',
      pattern: 'scope_quantification',
      description: 'Specific hours, dependents, and duration that convey the true scale of responsibility',
      whyItWorks:
        'Hours per week is the single most powerful metric in family responsibility descriptions. ' +
        '"25 hours/week for 3 years" immediately tells AOs this is not casual helping — this is a ' +
        'second job. The specificity also signals honesty, because students who fabricate tend to ' +
        'use vague language.',
      examples: [
        'Primary caregiver for 3 younger siblings (ages 4, 7, 10), 25 hrs/week for 4 years',
        'Managed all household operations including meals, cleaning, and scheduling for family of 6',
        'Full-time summer care for elderly grandparent with dementia — 40 hrs/week, 3 consecutive summers',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'hrs/week', 'hours per week', 'daily', 'primary caregiver',
        'full-time', 'family of', 'younger siblings', 'every day',
      ],
    },
    {
      id: 'fr_system_navigation',
      pattern: 'system_navigation',
      description: 'Navigating adult systems (medical, legal, insurance, educational) on behalf of family',
      whyItWorks:
        'Navigating complex systems designed for adults — while still a teenager — demonstrates ' +
        'exceptional maturity. AOs recognize that coordinating medical appointments, filing insurance ' +
        'claims, or handling school enrollment for siblings requires skills most adults struggle with.',
      examples: [
        'Coordinated medical appointments, navigated insurance paperwork for non-English-speaking grandparent',
        'Managed family\'s housing assistance application after parent job loss — approved within 2 months',
        'Handled IEP meetings and special education paperwork for younger sibling with learning disability',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'insurance', 'medical appointments', 'legal', 'paperwork', 'applications',
        'navigated', 'coordinated', 'managed', 'filed', 'enrollment', 'IEP',
      ],
    },
    {
      id: 'fr_language_brokering',
      pattern: 'language_brokering',
      description: 'Serving as interpreter/translator for family in consequential situations',
      whyItWorks:
        'Language brokering is one of the most impactful family responsibilities because the STAKES ' +
        'are enormous. Interpreting for a parent at a doctor\'s office, a legal proceeding, or a ' +
        'parent-teacher conference means the student is the sole communication bridge in high-stakes ' +
        'situations. AOs deeply respect this responsibility.',
      examples: [
        'Sole English interpreter for family in all school, medical, and legal settings since age 12',
        'Translated mortgage documents and negotiated with bank on parents\' behalf during refinancing',
        'Interpreted for parents at 4 years of IEP meetings for younger brother with autism',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'interpreter', 'translated', 'translation', 'bilingual', 'non-English',
        'language broker', 'on behalf of', 'parents\' behalf', 'sole English',
      ],
    },
    {
      id: 'fr_economic_necessity_context',
      pattern: 'economic_necessity',
      description: 'Economic context that explains WHY the responsibility exists',
      whyItWorks:
        'Economic context transforms family responsibilities from "helping out" to "essential family ' +
        'function." When AOs understand that the student managed the family restaurant because a parent ' +
        'was ill, or provided childcare because the family couldn\'t afford daycare, the activity gains ' +
        'enormous weight.',
      examples: [
        'Managed family restaurant finances during parent\'s 6-month illness — kept business operational',
        'Provided after-school childcare for 3 siblings because family couldn\'t afford daycare ($1,200/mo savings)',
        'Worked family farm 20 hrs/week during harvest season — income covers family health insurance',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'couldn\'t afford', 'during illness', 'single parent', 'income',
        'family business', 'financial necessity', 'to support', 'to help pay',
      ],
    },
    {
      id: 'fr_sacrifice_acknowledged',
      pattern: 'sacrifice_context',
      description: 'Honest acknowledgment of what the student sacrificed or managed alongside duties',
      whyItWorks:
        'AOs are trained in holistic review — they need to understand what the student gave up to ' +
        'shoulder these responsibilities. "Maintained 3.8 GPA while providing 25 hrs/week of childcare" ' +
        'is profoundly more impressive than either fact alone. The juxtaposition IS the achievement.',
      examples: [
        'Maintained 3.8 GPA while managing family farm operations, 1,200 hrs/year',
        'Balanced 20 hrs/week of elder care with 4 AP courses and varsity track',
        'Missed 0 school days despite serving as primary household manager after parent deployment',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'maintained GPA', 'while', 'balanced', 'alongside', 'despite',
        'in addition to', 'while also', 'at the same time', 'still managed',
      ],
    },
    {
      id: 'fr_skill_transfer',
      pattern: 'skill_transfer',
      description: 'Skills developed through family responsibility applied to other contexts',
      whyItWorks:
        'When a student connects family responsibilities to other activities or achievements, it shows ' +
        'self-awareness and integration. "Applied budgeting skills from family business to school club ' +
        'treasury" demonstrates that family work developed transferable abilities.',
      examples: [
        'Applied budgeting skills from family business to school club treasury — saved $800/year',
        'Medical scheduling skills from elder care led me to organize school health fair, 300 attendees',
        'Translation experience inspired founding of ESL tutoring program for immigrant families, 20 served',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'applied', 'transferred', 'skills from', 'led me to', 'inspired',
        'because of', 'experience with', 'learned from', 'developed through',
      ],
    },
    {
      id: 'fr_cultural_context',
      pattern: 'cultural_context',
      description: 'Cultural or immigration context that frames the responsibility as meaningful',
      whyItWorks:
        'Cultural context helps AOs understand that family responsibilities are not burdens the student ' +
        'resents but values the student embodies. In many cultures, family care is the highest form of ' +
        'duty. AOs respect students who frame these responsibilities with cultural pride rather than ' +
        'complaint.',
      examples: [
        'As eldest daughter in Vietnamese family, managed household while parents worked 12-hour shifts',
        'Upheld family tradition of multigenerational care — primary companion for grandfather with Parkinson\'s',
        'Cultural expectation as oldest son: bridge between immigrant parents and American institutions',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'cultural', 'tradition', 'eldest', 'immigrant', 'first-generation',
        'family values', 'multigenerational', 'heritage', 'as oldest',
      ],
    },
    {
      id: 'fr_financial_management',
      pattern: 'financial_management',
      description: 'Managing family finances, bills, or business accounting',
      whyItWorks:
        'Financial management for a family demonstrates a level of trust and competence that most ' +
        'teenagers never experience. AOs recognize that handling rent payments, bill negotiations, ' +
        'or business bookkeeping requires mathematical skill, responsibility, and maturity.',
      examples: [
        'Managed family budget of $3,500/month including rent, utilities, and groceries after parent disability',
        'Handled all bookkeeping for family landscaping business — invoicing, taxes, and payroll for 3 workers',
        'Negotiated medical bills and payment plans for family, reducing total owed by $4,000 through appeals',
      ],
      signalStrength: 'strong',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'budget', 'bills', 'finances', 'bookkeeping', 'taxes', 'invoicing',
        'payments', 'financial', 'rent', 'accounting', 'payroll',
      ],
    },
    {
      id: 'fr_medical_caregiving',
      pattern: 'medical_caregiving',
      description: 'Providing medical or disability-related care for a family member',
      whyItWorks:
        'Medical caregiving requires learning specialized skills (medication management, mobility ' +
        'assistance, symptom monitoring) that most adults find challenging. A teenager who provides ' +
        'this care demonstrates extraordinary empathy, reliability, and resilience.',
      examples: [
        'Administered daily medication schedule and monitored blood sugar for diabetic parent, 3 years',
        'Provided mobility assistance and personal care for grandmother after hip surgery, 6 months',
        'Learned wound care and physical therapy exercises to help parent recover from workplace injury',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'medication', 'medical care', 'disability', 'chronic illness', 'surgery',
        'therapy', 'health condition', 'caregiver', 'assisted with', 'monitored',
      ],
    },
    {
      id: 'fr_sibling_development',
      pattern: 'sibling_development',
      description: 'Active role in younger siblings\' education, development, or emotional well-being',
      whyItWorks:
        'When childcare goes beyond babysitting into active developmental support — helping with ' +
        'homework, attending school events, making educational decisions — it demonstrates that the ' +
        'student is functioning as a co-parent. AOs recognize this as one of the most demanding ' +
        'responsibilities a teenager can have.',
      examples: [
        'Tutored 3 younger siblings nightly, attended parent-teacher conferences, managed school enrollment',
        'Taught younger brother to read using phonics program — he entered kindergarten reading at 2nd grade level',
        'Provided emotional support and stability for siblings during parents\' divorce — maintained routines and normalcy',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'impact',
      detectionKeywords: [
        'siblings', 'younger brother', 'younger sister', 'homework help',
        'school events', 'tutored siblings', 'childcare', 'raised',
      ],
    },
    {
      id: 'fr_household_operations',
      pattern: 'household_operations',
      description: 'Running household operations at a level beyond typical chores',
      whyItWorks:
        'Managing a household — cooking, cleaning, shopping, scheduling, maintenance — for a family ' +
        'of 4+ is a legitimate management role. When framed with scope and context, it communicates ' +
        'organizational ability, reliability, and selflessness.',
      examples: [
        'Managed all household operations for family of 5: meals, groceries, cleaning, scheduling, bills',
        'Cooked dinner for family of 6 every night for 3 years while parent worked evening shifts',
        'Organized household of 7 including chore schedules, meal planning, and grocery shopping on $400/month budget',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'household', 'cooking', 'meals', 'groceries', 'cleaning',
        'chores', 'family of', 'managed home', 'ran household',
      ],
    },
    {
      id: 'fr_crisis_response',
      pattern: 'crisis_response',
      description: 'Stepping up during a family crisis (illness, job loss, deployment, divorce)',
      whyItWorks:
        'How a student responds to family crisis is among the most character-revealing information ' +
        'on an application. AOs look for evidence of resilience, adaptability, and emotional maturity. ' +
        'A student who stepped up during crisis demonstrates exactly the kind of person who will ' +
        'handle college challenges with grace.',
      examples: [
        'Took over family responsibilities when parent was hospitalized for 3 months — maintained household and siblings\' routines',
        'Became primary income earner at 16 after parent job loss — worked 30 hrs/week while maintaining B+ average',
        'Managed household logistics during parent\'s military deployment — 8 months as oldest child in family of 4',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'crisis', 'hospitalized', 'illness', 'job loss', 'deployment',
        'divorce', 'stepped up', 'took over', 'emergency', 'suddenly',
      ],
    },
    {
      id: 'fr_farm_business_operations',
      pattern: 'farm_business_operations',
      description: 'Operating or substantially contributing to a family farm or business',
      whyItWorks:
        'Family business work — especially farming — combines physical labor, business management, ' +
        'and economic pressure in a way that develops extraordinary work ethic. AOs recognize that ' +
        'a student who works 20+ hours/week on a family farm has less time for "resume-building" ' +
        'activities, making their academic achievements more impressive.',
      examples: [
        'Operated family farm equipment and managed 40-acre crop rotation plan, 20 hrs/week during school year',
        'Ran front-of-house at family restaurant every weekend — scheduling, customer service, inventory for 50-seat venue',
        'Managed family dry cleaning business during parent\'s recovery — handled customers, inventory, and 2 employees',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'family farm', 'family business', 'family restaurant', 'family store',
        'harvest', 'crops', 'livestock', 'operations', 'inventory', 'employees',
      ],
    },
  ],

  nameDropTraps: [
    {
      id: 'fr_help_around_house',
      pattern: 'Help around the house',
      whyStudentsUseIt:
        'Students minimize their responsibilities because they don\'t realize AOs value family work. ' +
        'They default to casual language because they\'ve been socialized to view household work as ' +
        'unimpressive compared to "real" extracurriculars.',
      whyItFails:
        '"Help around the house" is the single most common undersell in activity descriptions. It ' +
        'could mean anything from "occasionally washing dishes" to "managing a household of 6 as the ' +
        'primary responsible adult." AOs cannot tell the difference, so they default to the lesser ' +
        'interpretation. This language costs the student their most powerful character evidence.',
      betterAlternative:
        'Be specific about what you do, how often, and for how many people. Frame it as the genuine ' +
        'management role it is. You are not "helping" — you are managing, providing, or maintaining.',
      example: {
        nameDrop: 'Help around the house with chores and cooking after school',
        improved: 'Managed household for family of 5: daily meals, grocery shopping ($400/mo budget), and siblings\' school logistics',
        whatChanged:
          'Replaced minimizing "help around the house" with accurate scope (family of 5), specific duties ' +
          '(daily meals, groceries, sibling logistics), and a quantified constraint ($400/mo budget). This ' +
          'reveals genuine household management, not casual chore participation.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 8,
      detectionKeywords: [
        'help around', 'help at home', 'help out', 'chores',
        'around the house', 'household chores',
      ],
    },
    {
      id: 'fr_babysit_siblings',
      pattern: 'Babysit siblings',
      whyStudentsUseIt:
        'Students use "babysit" because it\'s the common word for watching children. They don\'t ' +
        'realize that "babysit" implies occasional, casual supervision — when their reality may be ' +
        'primary childcare for 20+ hours per week.',
      whyItFails:
        '"Babysit" dramatically undersells what may be a primary caregiving role. There is a massive ' +
        'difference between babysitting (occasional, recreational, often paid) and serving as the ' +
        'primary caregiver responsible for children\'s safety, meals, homework, and emotional ' +
        'well-being every day. AOs cannot infer the difference from the word "babysit."',
      betterAlternative:
        'Use "primary caregiver" or "responsible for" instead of "babysit." Specify the number of ' +
        'children, hours per week, and the context (why you\'re providing this care).',
      example: {
        nameDrop: 'Babysit younger siblings after school while parents are at work',
        improved: 'Primary caregiver for 3 siblings (ages 4-10), 25 hrs/week: homework help, meals, bedtime routines while parents work evenings',
        whatChanged:
          'Replaced casual "babysit" with "primary caregiver" (accurate framing). Added specifics: ' +
          'number of siblings (3), ages, hours (25/week), duties (homework, meals, bedtime), and context ' +
          '(parents work evenings). This paints a completely different picture.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 5,
      detectionKeywords: [
        'babysit', 'watch siblings', 'look after siblings',
        'take care of siblings', 'watch my brothers',
      ],
    },
    {
      id: 'fr_family_business_vague',
      pattern: 'Work in family business',
      whyStudentsUseIt:
        'Students assume AOs understand what "family business" means. They don\'t realize that without ' +
        'specifics, AOs cannot distinguish between occasionally helping at a counter and managing ' +
        'operations, finances, and employees.',
      whyItFails:
        '"Work in family business" is too vague to communicate the scope, skills, or impact of the ' +
        'student\'s contribution. AOs need to know WHAT business, WHAT the student did, and the SCALE ' +
        'of responsibility. Otherwise, it reads as "occasionally helps parents at their store."',
      betterAlternative:
        'Name the business type, describe your specific responsibilities, and quantify the scope ' +
        '(customers served, revenue handled, employees managed, hours per week).',
      example: {
        nameDrop: 'Work at family business on weekends and during summers to help out',
        improved: 'Managed family restaurant operations on weekends: scheduling for 8 staff, inventory ($2K/week), and customer service for 200+ weekly diners',
        whatChanged:
          'Replaced vague "family business" with specific business (restaurant), specific duties ' +
          '(scheduling, inventory, customer service), and quantified scope (8 staff, $2K/week inventory, ' +
          '200+ diners). This transforms "helping out" into a genuine management role.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 10,
      detectionKeywords: [
        'family business', 'parents\' business', 'family store',
        'help at the shop', 'work at family',
      ],
    },
    {
      id: 'fr_translate_for_parents',
      pattern: 'Translate for parents',
      whyStudentsUseIt:
        'Students view translation as a simple, unremarkable skill. They don\'t realize that serving ' +
        'as the family\'s sole English communicator in high-stakes situations is profoundly meaningful ' +
        'to AOs who understand the immigrant experience.',
      whyItFails:
        '"Translate for parents" without context minimizes what may be one of the most character- ' +
        'revealing responsibilities on the application. AOs need to know the STAKES (medical? legal? ' +
        'financial?), the FREQUENCY (daily? weekly?), and the SCOPE (all communication or just casual?).',
      betterAlternative:
        'Describe the highest-stakes situations where you served as interpreter. Name the settings ' +
        '(medical, legal, financial, educational) and the frequency. This communicates both the skill ' +
        'and the trust your family places in you.',
      example: {
        nameDrop: 'Translate for parents since they don\'t speak much English',
        improved: 'Sole family interpreter in all medical, legal, and school settings since age 11 — navigated insurance claims, IEP meetings, and lease negotiations',
        whatChanged:
          'Replaced casual "translate" with "sole family interpreter" (accurate scope). Added specific ' +
          'high-stakes settings (medical, legal, school), a timeline (since age 11), and concrete examples ' +
          '(insurance claims, IEP meetings, lease negotiations). This reveals enormous maturity and trust.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 6,
      detectionKeywords: [
        'translate for', 'interpret for', 'help parents with English',
        'language barrier', 'parents don\'t speak',
      ],
    },
    {
      id: 'fr_hours_without_context',
      pattern: 'Hours listed without context',
      whyStudentsUseIt:
        'Students list hours because the Common App asks for them. They assume the number itself ' +
        'communicates the commitment.',
      whyItFails:
        'Hours without context are meaningless. 20 hours/week of what? Under what circumstances? ' +
        'What does the student give up to spend those hours? AOs need to understand what the hours ' +
        'REPRESENT — what tasks, what stakes, what trade-offs.',
      betterAlternative:
        'Always pair hours with specific responsibilities and, when relevant, what the student ' +
        'sacrifices or manages alongside those hours.',
      example: {
        nameDrop: 'Spend about 20 hours per week helping my family with various tasks',
        improved: 'Provide 20 hrs/week of elder care (meals, medication, companionship) for grandparent with Alzheimer\'s while maintaining 4 AP courses',
        whatChanged:
          'Replaced vague "various tasks" with specific care duties (meals, medication, companionship), ' +
          'the condition (Alzheimer\'s), and the academic context (4 AP courses) that makes the commitment ' +
          'remarkable.',
      },
      prevalence: 'common',
      typicalCharWaste: 15,
      detectionKeywords: [
        'hours per week', 'about 20 hours', 'various tasks',
        'helping my family', 'different things',
      ],
    },
    {
      id: 'fr_pity_narrative',
      pattern: 'Over-dramatized hardship narrative',
      whyStudentsUseIt:
        'Students hear that colleges want "compelling stories" and believe that emphasizing hardship ' +
        'will generate sympathy. Counselors sometimes encourage dramatic framing.',
      whyItFails:
        'AOs are experienced readers who distinguish between genuine acknowledgment of difficulty and ' +
        'performative suffering. Overly dramatic language ("struggled," "endured," "overcame impossible ' +
        'odds") can feel manipulative. AOs respect DIGNITY — factual, specific, and matter-of-fact ' +
        'descriptions of what the student does are far more powerful than emotional pleas.',
      betterAlternative:
        'State the facts clearly and specifically. Let the reader draw their own conclusions about ' +
        'the difficulty. The facts themselves are powerful — dramatic adjectives add nothing.',
      example: {
        nameDrop: 'Despite struggling with the enormous burden of caring for my sick mother, I persevered through hardship',
        improved: 'Primary caregiver for mother during cancer treatment: managed medications, drove to 40+ appointments, maintained 3.9 GPA',
        whatChanged:
          'Removed emotional language ("struggled," "enormous burden," "persevered through hardship") and ' +
          'replaced with dignified, specific facts: role (primary caregiver), context (cancer treatment), ' +
          'duties (medications, appointments), and academic achievement (3.9 GPA). The facts speak louder.',
      },
      prevalence: 'common',
      typicalCharWaste: 25,
      detectionKeywords: [
        'struggled', 'burden', 'hardship', 'endured', 'overcame',
        'despite all odds', 'persevered', 'suffered',
      ],
    },
    {
      id: 'fr_just_chores',
      pattern: 'Listing only basic chores',
      whyStudentsUseIt:
        'Students list chores (dishes, laundry, vacuuming) because they don\'t know what else to say. ' +
        'They don\'t realize that the VOLUME and CONTEXT of these chores may represent a genuine ' +
        'management role.',
      whyItFails:
        'Individual chores sound mundane. "Do dishes and laundry" communicates nothing distinctive. ' +
        'AOs need to see the TOTAL picture — who else is in the household, why the student bears ' +
        'this responsibility, and what it means for their time and development.',
      betterAlternative:
        'Frame chores as household management. Specify the family size, the total scope, the time ' +
        'commitment, and why you bear this responsibility.',
      example: {
        nameDrop: 'Do laundry, dishes, and cooking for the family most days after school',
        improved: 'Run household operations for family of 6 (15 hrs/week): all meals, laundry, cleaning while single parent works two jobs',
        whatChanged:
          'Elevated individual chores into a household management frame. Added family size (6), ' +
          'hours (15/week), and the critical context (single parent, two jobs) that explains why.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 12,
      detectionKeywords: [
        'dishes', 'laundry', 'vacuuming', 'cleaning', 'cooking',
        'chores', 'housework', 'tidying',
      ],
    },
    {
      id: 'fr_comparison_to_extracurriculars',
      pattern: 'Framing family duties as extracurricular activities',
      whyStudentsUseIt:
        'Students try to make family responsibilities sound like traditional extracurriculars because ' +
        'they believe that\'s what AOs want to see. They use language like "leadership" or "teamwork" ' +
        'to dress up caregiving.',
      whyItFails:
        'Family responsibilities don\'t need to be dressed up as something else. They are their own ' +
        'category, evaluated on their own terms. Framing caregiving as "leadership development" or ' +
        '"team management" sounds tone-deaf and misses what AOs actually value: the character ' +
        'revealed by genuine obligation.',
      betterAlternative:
        'Describe the responsibility honestly, in its own terms. The power of family responsibility ' +
        'is in its authenticity — trying to make it sound like a club undermines that power.',
      example: {
        nameDrop: 'Led a team of family members in managing household operations, developing leadership and project management skills',
        improved: 'Ran household for family of 5 after parent injury: meals, finances ($3K/mo budget), siblings\' school needs, 20 hrs/week',
        whatChanged:
          'Removed corporate jargon ("led a team," "project management skills") and replaced with ' +
          'honest description: what was managed (meals, finances, sibling needs), why (parent injury), ' +
          'and the specific scope ($3K budget, 20 hrs/week). Authenticity beats professionalization.',
      },
      prevalence: 'occasional',
      typicalCharWaste: 20,
      detectionKeywords: [
        'leadership skills through family', 'team of family members',
        'project management at home', 'managed a team of siblings',
      ],
    },
    {
      id: 'fr_generic_caregiving',
      pattern: 'Care for family member (generic)',
      whyStudentsUseIt:
        'Students describe caregiving in the most generic terms possible, either because they feel it\'s ' +
        'private or because they don\'t realize the specific details are what make it meaningful.',
      whyItFails:
        '"Take care of family member" does not tell AOs the type of care, the medical context, the ' +
        'frequency, or the skills involved. It could mean visiting a grandparent weekly or providing ' +
        'round-the-clock medical care. The vagueness robs the student of their most powerful evidence.',
      betterAlternative:
        'Be specific about the type of care (medical, emotional, daily living), the family member\'s ' +
        'condition, and the skills you developed. You don\'t need to share private medical details — ' +
        'but the TYPE of care matters enormously.',
      example: {
        nameDrop: 'Take care of my grandmother who is not doing well health-wise',
        improved: 'Primary caregiver for grandmother with Parkinson\'s: daily medication mgmt, mobility assistance, 15 hrs/week for 2 years',
        whatChanged:
          'Replaced vague "not doing well" with specific condition (Parkinson\'s). Added specific duties ' +
          '(medication management, mobility assistance), quantified time (15 hrs/week), and duration (2 years).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 10,
      detectionKeywords: [
        'take care of', 'care for', 'look after', 'not doing well',
        'health problems', 'sick family member',
      ],
    },
    {
      id: 'fr_minimizing_language',
      pattern: 'Minimizing language (just, only, a little)',
      whyStudentsUseIt:
        'Students use minimizing language because they genuinely don\'t believe their family ' +
        'responsibilities are "impressive enough" for a college application. This is especially ' +
        'common among first-generation students who lack counselor guidance.',
      whyItFails:
        'Minimizing language ("I just help out," "it\'s not that much," "I only do a few things") ' +
        'actively instructs the AO to discount the activity. If the student says it\'s not a big deal, ' +
        'the AO will believe them — even if the reality is impressive.',
      betterAlternative:
        'Remove ALL minimizing language. State facts without qualification. Let the scope speak for itself.',
      example: {
        nameDrop: 'I just help out with some things at home since my mom works a lot',
        improved: 'Manage household and 2 younger siblings 20 hrs/week while mother works double shifts as single parent',
        whatChanged:
          'Removed all minimizing language ("just," "some things," "a lot"). Replaced with specific, ' +
          'dignified facts: role (manage household + siblings), time (20 hrs/week), context (single parent, ' +
          'double shifts). No apology, no minimizing — just the truth.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 15,
      detectionKeywords: [
        'just help', 'only do', 'not much', 'a little', 'some things',
        'it\'s not that', 'I guess', 'sort of',
      ],
    },
  ],

  proofOfWorkPatterns: [
    {
      id: 'fr_specific_daily_routine',
      pattern: 'Describing a specific daily routine that reveals the rhythm of responsibility',
      whyItProves:
        'Only someone who actually performs these duties daily can describe the routine with precision. ' +
        '"Wake at 5:30, prepare siblings\' lunches, walk youngest to bus, start dinner prep before ' +
        'homework" cannot be fabricated — it\'s the language of lived experience.',
      examples: [
        'Daily: wake 5:30 → prepare lunches → walk siblings to bus → after school: homework help, dinner, bedtime routine',
        'Every evening: pick up grandmother from dialysis, prepare dinner, manage her medications, study after 9pm',
        'Weekday schedule: school → family restaurant (4-8pm) → homework → siblings\' bedtime routines',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'The specificity of the daily routine is unmistakable. This student lives this schedule. ' +
        'No one who hasn\'t done it could describe it with this precision.',
    },
    {
      id: 'fr_navigated_specific_systems',
      pattern: 'Naming specific systems or processes navigated on behalf of family',
      whyItProves:
        'References to specific systems (Medicaid application, IEP process, Section 8 paperwork, ' +
        'insurance appeals) demonstrate that the student has actually interfaced with these bureaucracies. ' +
        'These are not things teenagers typically encounter — their presence signals genuine adult-level ' +
        'responsibility.',
      examples: [
        'Filed Medicaid renewal paperwork and appealed denied claim — successfully reinstated coverage',
        'Navigated IEP process for younger sibling: attended 6 meetings, advocated for additional support hours',
        'Completed Section 8 housing assistance application — gathered 15 required documents over 3 weeks',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student navigates systems that many adults find overwhelming. The specific bureaucratic ' +
        'references prove real engagement — these details cannot be invented without experience.',
    },
    {
      id: 'fr_financial_specifics',
      pattern: 'Citing specific financial figures or constraints managed',
      whyItProves:
        'Specific financial numbers ($400/month grocery budget, $3,500/month household expenses, ' +
        '$4,000 in medical bills negotiated down) signal that the student is genuinely involved in ' +
        'family financial management. Vague references to "money" or "bills" don\'t carry the same weight.',
      examples: [
        'Managed $400/month grocery budget for family of 6 — meal planned to minimize waste',
        'Negotiated $4,000 in medical bills down to $2,400 through payment plans and charity care applications',
        'Tracked all household expenses in spreadsheet — identified $200/month in unnecessary costs',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'The financial specificity proves genuine involvement. This student handles real money with ' +
        'real consequences — a level of responsibility that builds exceptional life skills.',
    },
    {
      id: 'fr_medical_knowledge',
      pattern: 'Demonstrating medical or caregiving knowledge acquired through necessity',
      whyItProves:
        'When a student describes specific medical procedures, medication management, or caregiving ' +
        'techniques, they reveal knowledge that can only come from hands-on experience. This is the ' +
        'most authentic proof-of-work because it\'s impossible to fake without living it.',
      examples: [
        'Learned to manage insulin injections, carb counting, and blood glucose monitoring for diabetic parent',
        'Trained in transfer techniques for wheelchair-bound grandmother — prevented falls during 2-year care period',
        'Tracked medication interactions and side effects, reporting changes to doctor at monthly appointments',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student has acquired medical knowledge through necessity. The specificity of the caregiving ' +
        'details signals genuine experience — and the maturity to handle life-and-death responsibility.',
    },
    {
      id: 'fr_multi_role_management',
      pattern: 'Managing multiple simultaneous family roles',
      whyItProves:
        'When a student describes handling childcare AND household management AND translation AND ' +
        'academic responsibilities simultaneously, the sheer complexity of the juggling act proves ' +
        'genuine experience. No one invents this level of multitasking.',
      examples: [
        'Simultaneously: primary childcare (3 siblings) + household manager + family interpreter + maintaining 3.8 GPA',
        'Balanced: elder care (15 hrs/week) + family business bookkeeping (5 hrs) + 4 AP courses + track practice',
        'Triple role: cook/cleaner for family of 5 + tutor for younger siblings + parents\' medical interpreter',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'The simultaneous management of multiple demanding roles is the strongest proof of exceptional ' +
        'time management, maturity, and resilience. This student does more before school than most do all day.',
    },
    {
      id: 'fr_emotional_labor_specifics',
      pattern: 'Specific evidence of emotional caregiving and family stability maintenance',
      whyItProves:
        'Emotional labor — maintaining siblings\' routines during a parent\'s illness, providing ' +
        'stability during family crisis, managing younger children\'s fears — is the invisible but ' +
        'profound dimension of family responsibility. Students who describe it reveal deep self-awareness.',
      examples: [
        'Maintained normalcy for siblings during parent\'s hospitalization: kept routines, attended school events, shielded them from worry',
        'Served as emotional anchor during parents\' divorce — created weekly sibling dinner tradition for stability',
        'Helped younger sister process grandmother\'s death while managing own grief — read together nightly for comfort',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student understands that family caregiving includes emotional labor. The specificity of ' +
        'their emotional support strategies shows maturity far beyond their years.',
    },
    {
      id: 'fr_long_term_commitment',
      pattern: 'Multi-year sustained responsibility without choice or break',
      whyItProves:
        'Unlike optional activities that students can quit, family responsibilities are permanent. ' +
        'Describing a 3+ year commitment to caregiving or household management proves endurance and ' +
        'reliability in a way that seasonal activities cannot.',
      examples: [
        'Primary sibling caregiver for 4 years (since age 13) — responsibility continues through senior year',
        'Family interpreter since age 10 — now 7 years of medical, legal, and educational translation',
        'Managed family finances continuously since parent became disabled 3 years ago — no breaks, no days off',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This is not a semester-long commitment or a summer project. This student has shouldered ' +
        'adult responsibilities for years. The sustained nature proves genuine obligation and character.',
    },
    {
      id: 'fr_creative_problem_solving',
      pattern: 'Creative solutions to resource constraints in family caregiving',
      whyItProves:
        'Resourcefulness under constraint — stretching a grocery budget, finding free medical resources, ' +
        'creating DIY solutions — signals both intelligence and genuine necessity. These are problems only ' +
        'someone living them would describe.',
      examples: [
        'Stretched $350/month food budget using meal planning app and bulk cooking — no meals missed in 2 years',
        'Found free physical therapy videos online when family couldn\'t afford PT for parent\'s recovery',
        'Organized carpool with neighbors when family had one car — ensured siblings never missed school',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student solves real problems with limited resources. The creative constraint-navigation ' +
        'signals both intelligence and genuine lived experience with economic hardship.',
    },
  ],

  descriptionTransforms: [
    {
      id: 'fr_transform_help_to_manage',
      transformType: 'passive_to_active',
      before: 'Help around the house with chores and babysitting',
      after: 'Manage household + 3 siblings (25 hrs/wk): meals, homework, bedtime while parents work evenings',
      explanation:
        'Transformed minimizing "help" into active "manage." Added scope (3 siblings, 25 hrs/week), ' +
        'specific duties (meals, homework, bedtime), and context (parents work evenings).',
      charsBefore: 48,
      charsAfter: 89,
      principle: 'You are not helping — you are managing. Use accurate, dignified language.',
    },
    {
      id: 'fr_transform_babysit_to_caregiver',
      transformType: 'generic_to_specific',
      before: 'Babysit my younger siblings after school',
      after: 'Primary caregiver for 3 siblings (ages 4-10), 25 hrs/wk: meals, homework help, activities, bedtime',
      explanation:
        'Replaced casual "babysit" with accurate "primary caregiver." Added specifics: number of ' +
        'siblings, ages, hours, and the full range of caregiving duties.',
      charsBefore: 41,
      charsAfter: 93,
      principle: 'If you are the primary caregiver, call yourself that — "babysit" undersells by 90%',
    },
    {
      id: 'fr_transform_translate_to_broker',
      transformType: 'generic_to_specific',
      before: 'Help translate for my parents because they don\'t speak English well',
      after: 'Sole family interpreter since age 11: medical (40+ appts), legal (lease, insurance), school (IEP, conferences)',
      explanation:
        'Replaced casual "help translate" with "sole family interpreter" and added high-stakes ' +
        'settings with specific counts. This reveals the weight of the responsibility.',
      charsBefore: 60,
      charsAfter: 101,
      principle: 'The stakes of translation matter — name the highest-stakes situations',
    },
    {
      id: 'fr_transform_family_business_vague',
      transformType: 'generic_to_specific',
      before: 'Work in family business on weekends',
      after: 'Run family restaurant weekends: manage 8 staff schedules, handle $2K/wk inventory, serve 200+ diners',
      explanation:
        'Replaced vague "family business" with specific business type, specific management duties, ' +
        'and quantified scope.',
      charsBefore: 37,
      charsAfter: 97,
      principle: 'Name the business, name your role, quantify the scope',
    },
    {
      id: 'fr_transform_chores_to_operations',
      transformType: 'duty_to_achievement',
      before: 'Do laundry, cook dinner, and clean the house for my family',
      after: 'Operate household for family of 6 as single-parent home: daily cooking, weekly budgeting ($400/mo groceries), all logistics',
      explanation:
        'Elevated individual chores into household operations framing. Added family size, family structure ' +
        '(single-parent), and financial specifics that reveal the true scope.',
      charsBefore: 54,
      charsAfter: 109,
      principle: 'Individual chores are duties; household operations reveal character',
    },
    {
      id: 'fr_transform_pity_to_dignity',
      transformType: 'claim_to_evidence',
      before: 'Struggled through the hardship of caring for my sick mother while keeping up with school',
      after: 'Primary caregiver during mother\'s cancer treatment: managed meds, drove to 40+ appointments, maintained 3.9 GPA',
      explanation:
        'Removed emotional dramatization and replaced with dignified, specific facts. The GPA ' +
        'alongside caregiving duties speaks louder than any adjective.',
      charsBefore: 76,
      charsAfter: 100,
      principle: 'Dignity over drama — specific facts are more powerful than emotional adjectives',
    },
    {
      id: 'fr_transform_minimizing_to_accurate',
      transformType: 'passive_to_active',
      before: 'I just help out at home since my mom works a lot and we don\'t have much',
      after: 'Run household + raise 2 siblings (20 hrs/wk) while single mother works double shifts; maintained B+ avg',
      explanation:
        'Removed all minimizing language ("just," "help out," "don\'t have much"). Replaced with ' +
        'accurate, specific description of a genuine management role with academic context.',
      charsBefore: 63,
      charsAfter: 97,
      principle: 'Remove every minimizing word. State facts without apology.',
    },
    {
      id: 'fr_transform_generic_care_to_specific',
      transformType: 'generic_to_specific',
      before: 'Take care of my grandmother who has health problems',
      after: 'Caregiver for grandmother with Alzheimer\'s: daily medication, meal prep, companionship, safety monitoring, 15 hrs/wk',
      explanation:
        'Replaced vague "health problems" with specific condition. Added the range of care duties ' +
        'and the weekly time commitment.',
      charsBefore: 51,
      charsAfter: 104,
      principle: 'Specific conditions and specific duties transform generic "care" into powerful evidence',
    },
    {
      id: 'fr_transform_hours_to_context',
      transformType: 'claim_to_evidence',
      before: 'Spend 20 hours a week helping my family with various responsibilities',
      after: 'Provide 20 hrs/wk elder care (meals, meds, appointments) for grandparent with Parkinson\'s alongside 4 AP courses',
      explanation:
        'Replaced vague "various responsibilities" with specific care type (elder care), specific duties ' +
        '(meals, meds, appointments), specific condition (Parkinson\'s), and academic context (4 AP courses).',
      charsBefore: 60,
      charsAfter: 103,
      principle: 'Hours need context: what kind of care, for whom, and what else are you managing?',
    },
    {
      id: 'fr_transform_farm_to_operations',
      transformType: 'duty_to_achievement',
      before: 'Help on the family farm with whatever needs to be done',
      after: 'Operate 40-acre family farm: crop planning, equipment maintenance, harvest operations — 20 hrs/wk during school, 40 in summer',
      explanation:
        'Replaced vague "help with whatever" with specific operational responsibilities, farm scale, ' +
        'and seasonal time commitment that reveals this is a genuine business operation.',
      charsBefore: 51,
      charsAfter: 108,
      principle: 'A family farm is a business — describe it with the specificity it deserves',
    },
    {
      id: 'fr_transform_skill_bridge',
      transformType: 'jargon_to_outcome',
      before: 'Family responsibilities taught me time management and responsibility',
      after: 'Household budgeting skills → managed school club treasury ($3K), saved $800/yr; caregiving patience → peer mentor for 8 freshmen',
      explanation:
        'Replaced self-reported skill claims with specific evidence of skill transfer. Shows how family ' +
        'responsibilities directly developed abilities applied in other contexts.',
      charsBefore: 57,
      charsAfter: 112,
      principle: 'Don\'t claim skills — show where you applied them',
    },
    {
      id: 'fr_transform_crisis_narrative',
      transformType: 'claim_to_evidence',
      before: 'When my dad got sick, I had to step up and take on a lot of responsibility at home',
      after: 'Assumed household lead during father\'s 6-mo hospitalization: coordinated siblings\' school, managed bills, maintained family routines',
      explanation:
        'Replaced vague "step up" and "a lot of responsibility" with specific, dignified description of ' +
        'what was actually managed during the crisis period.',
      charsBefore: 74,
      charsAfter: 113,
      principle: 'Name the crisis briefly, then focus on what you DID — actions over emotions',
    },
  ],

  verbHierarchy: [
    {
      tier: 'power',
      verbs: [
        'managed', 'coordinated', 'navigated', 'sustained', 'maintained',
        'operated', 'provided', 'ensured', 'administered', 'shouldered',
      ],
      context:
        'In family responsibility contexts, power verbs signal OWNERSHIP and CAPABILITY. Unlike ' +
        'leadership activities where "founded" and "launched" dominate, family responsibility power ' +
        'verbs emphasize sustained, reliable management of essential functions. "Managed" and ' +
        '"maintained" are power-tier here because consistency IS the achievement.',
      exampleUsage: 'Managed household operations for family of 6 while maintaining 3.8 GPA',
    },
    {
      tier: 'standard',
      verbs: [
        'cared for', 'supported', 'handled', 'prepared', 'transported',
        'monitored', 'organized', 'scheduled', 'cooked', 'cleaned',
      ],
      context:
        'Standard verbs describe specific caregiving actions. They are appropriate and honest — ' +
        'they name the actual work. "Cooked" and "cleaned" are not weak in this context because ' +
        'the SCALE and CONSISTENCY is what makes them impressive.',
      exampleUsage: 'Prepared daily meals and organized schedules for 3 younger siblings',
    },
    {
      tier: 'weak',
      verbs: [
        'helped', 'assisted', 'tried to', 'sort of', 'kind of',
        'did some', 'pitched in', 'chipped in', 'lent a hand', 'did my part',
      ],
      context:
        'Weak verbs in family responsibility contexts are almost always MINIMIZING language. ' +
        '"Helped" implies someone else was in charge. "Tried to" implies failure. "Pitched in" ' +
        'implies occasional contribution. If the student IS the primary person responsible, these ' +
        'verbs lie about the reality. They must be replaced with accurate language.',
      exampleUsage: 'Avoid: "Helped out around the house and tried to take care of my siblings"',
    },
  ],

  roleExpertise: [
    {
      role: 'Primary Sibling Caregiver',
      expectedSignals: [
        'Daily supervision of younger siblings during parent absence',
        'Basic needs: meals, transportation, homework supervision',
        'Consistent schedule: this is a regular commitment, not occasional babysitting',
        'Awareness of siblings\' needs: school events, health, emotional well-being',
      ],
      differentiators: [
        'Developmental investment: actively tutoring siblings, not just supervising',
        'System creation: organized routines, chore charts, homework schedules',
        'Medical/educational advocacy: attending parent-teacher conferences, managing health appointments',
        'Emotional caregiving: providing stability during family stress or transition',
        'Sibling outcomes: evidence that younger siblings thrived under the student\'s care',
      ],
      overclaimingRisks: [
        'Claiming to have "raised" siblings when a parent was present and involved',
        'Inflating hours or responsibilities beyond what\'s accurate',
        'Describing normal sibling interaction as caregiving',
        'Using dramatic language that doesn\'t match the actual situation',
      ],
      authenticPatterns: [
        'Honest scope: "Primary after-school caregiver for siblings ages 5 and 8, 4-8pm daily (20 hrs/wk)"',
        'Specific duties: "Homework help, dinner prep, bath and bedtime routines for 2 younger siblings"',
        'Context included: "While single mother works evening nursing shifts"',
        'Impact evidence: "Younger sister\'s reading level improved 2 grades with daily practice together"',
      ],
    },
    {
      role: 'Family Language Broker / Interpreter',
      expectedSignals: [
        'Bilingual/multilingual communication facilitation',
        'Regular translation in everyday family contexts',
        'Document translation (bills, school notices, official mail)',
        'In-person interpretation at parent-teacher meetings or similar',
      ],
      differentiators: [
        'High-stakes interpretation: medical appointments, legal proceedings, financial negotiations',
        'System navigation: filling out government forms, insurance claims, housing applications',
        'Advocacy: not just translating words but explaining cultural context in both directions',
        'Impact: specific outcomes from interpretation (insurance approved, medication corrected, lease negotiated)',
        'Duration and trust: years of being the family\'s sole communication bridge',
      ],
      overclaimingRisks: [
        'Inflating the stakes of casual translation (ordering food vs. medical consent)',
        'Claiming to have "navigated" systems they only minimally interacted with',
        'Overstating language proficiency in either language',
      ],
      authenticPatterns: [
        'Specific settings: "Interpreter at all medical appointments (40+), school conferences, and lease negotiations"',
        'Stakes acknowledged: "Translated physician\'s cancer diagnosis and treatment options for grandmother"',
        'Duration: "Family\'s sole English communicator since age 11 — now 6 years"',
        'Impact: "Caught medication error during hospital visit by questioning pharmacist\'s instructions"',
      ],
    },
    {
      role: 'Elder / Disability Caregiver',
      expectedSignals: [
        'Regular care schedule: specific hours per week',
        'Type of care: personal care, medical management, companionship, transportation',
        'Understanding of the family member\'s condition',
        'Coordination with other caregivers or medical professionals',
      ],
      differentiators: [
        'Medical skill: medication management, wound care, therapy exercises, vital sign monitoring',
        'System navigation: insurance, Medicare/Medicaid, specialist referrals, home health services',
        'Emotional sophistication: managing a degenerative condition, end-of-life care, dementia communication',
        'Training: certifications or training obtained to provide better care (CPR, CNA skills)',
        'Sustained commitment: years of caregiving without respite',
      ],
      overclaimingRisks: [
        'Describing occasional visits as caregiving',
        'Claiming medical skills not actually performed',
        'Using condition names for emotional impact without genuine caregiving involvement',
      ],
      authenticPatterns: [
        'Specific condition: "Caregiver for grandmother with Parkinson\'s — medication scheduling, mobility assistance, fall prevention"',
        'Time commitment: "15 hrs/week for 2 years, including daily after-school and weekend mornings"',
        'Medical specifics: "Learned insulin injection technique, carb counting, and blood glucose tracking for diabetic father"',
        'Emotional depth: "Developed communication strategies for grandfather with progressive aphasia — picture boards, yes/no system"',
      ],
    },
    {
      role: 'Family Business Worker',
      expectedSignals: [
        'Regular work schedule alongside school',
        'Specific duties within the business (not just "helped")',
        'Understanding of the business operations',
        'Economic context: why the student works in the family business',
      ],
      differentiators: [
        'Business management: financial tracking, inventory, staffing, customer relations',
        'Operational improvement: introducing systems, improving efficiency, solving problems',
        'Crisis management: stepping up during parent illness, economic downturn, or staffing shortages',
        'Scale context: revenue, employees managed, customers served',
        'Skill transfer: applying business skills to school or other contexts',
      ],
      overclaimingRisks: [
        'Calling occasional help "running the business"',
        'Inflating decision-making authority (parents likely make major decisions)',
        'Claiming revenue or growth as personal achievement when it\'s the business\'s',
      ],
      authenticPatterns: [
        'Specific business: "Family dry cleaning business — front desk, customer service, alterations tracking for 50+ daily customers"',
        'Honest scope: "Weekend shifts (16 hrs) at family restaurant: order management, inventory, closing procedures"',
        'Crisis response: "Managed full operations during mother\'s 3-month recovery — scheduling, vendors, payroll for 4 employees"',
        'Skill specifics: "Learned QuickBooks for family bookkeeping — created monthly P&L reports, identified $200/mo cost savings"',
      ],
    },
    {
      role: 'Household Manager',
      expectedSignals: [
        'Daily responsibility for household operations',
        'Meal planning and preparation for the family',
        'Cleaning and maintenance on a regular schedule',
        'Grocery shopping and budget management',
      ],
      differentiators: [
        'Budget management: specific monthly budget, cost-saving strategies, financial tracking',
        'Multi-person household: managing operations for 4+ family members',
        'Logistics coordination: transportation, schedules, appointments for family members',
        'Maintenance and repairs: handling home maintenance issues normally managed by adults',
        'Context: WHY the student manages the household (single parent, parental disability, work schedules)',
      ],
      overclaimingRisks: [
        'Describing normal teen chores as household management',
        'Inflating the scope when the student does one or two regular chores',
        'Claiming to manage finances when parents make financial decisions',
      ],
      authenticPatterns: [
        'Specific scope: "Daily operations for family of 5: cooking, cleaning, laundry, groceries, sibling logistics — 15 hrs/wk"',
        'Financial specifics: "Manage $400/month grocery budget, meal plan to minimize waste — family of 6, no meals missed in 2 years"',
        'Context: "Household manager since parent deployment — 8 months as oldest child in family of 4"',
        'Multi-role: "Cook, cleaner, tutor, and scheduler for family of 5 while single parent works double shifts"',
      ],
    },
  ],

  jargonExceptions: [
    {
      pattern: 'Specific medical condition names in caregiving context',
      whyItsTheException:
        'Naming the specific condition (Parkinson\'s, Alzheimer\'s, Type 1 diabetes, ALS) is NOT ' +
        'name-dropping — it communicates the TYPE and SEVERITY of care required. "Alzheimer\'s" ' +
        'instantly tells AOs the student is managing cognitive decline, safety risks, and emotional ' +
        'complexity. The condition name IS the evidence of care complexity.',
      example:
        'Primary caregiver for grandmother with Alzheimer\'s: daily medication management, safety ' +
        'monitoring, and cognitive stimulation activities, 15 hrs/week. The disease name is essential ' +
        'because it defines the entire nature and difficulty of the caregiving.',
    },
    {
      pattern: 'Government program names in system navigation context',
      whyItsTheException:
        'Names of government programs (Medicaid, Section 8, SNAP, WIC, SSI) are not jargon — they ' +
        'are PROOF that the student navigated complex bureaucratic systems. Saying "filed Medicaid ' +
        'renewal" is more credible than "helped with government paperwork" because it names the ' +
        'specific system navigated.',
      example:
        'Managed family\'s Medicaid renewal, SNAP recertification, and Section 8 annual review — ' +
        'all completed on time, no lapses in coverage. The program names prove the student engaged ' +
        'with real government systems, not vague "paperwork."',
    },
    {
      pattern: 'IEP / 504 Plan references in educational advocacy context',
      whyItsTheException:
        'IEP (Individualized Education Program) and 504 Plan are specific educational frameworks that ' +
        'AOs understand. Naming them proves the student engaged in formal special education processes ' +
        'on behalf of a sibling — a level of advocacy that "helped with my brother\'s school stuff" ' +
        'completely fails to communicate.',
      example:
        'Attended and advocated in 4 years of IEP meetings for younger brother with autism — secured ' +
        'additional speech therapy hours and aide support. "IEP" is not jargon in this context; ' +
        'it\'s the specific process that proves the student engaged in formal educational advocacy.',
    },
    {
      pattern: 'Specific financial terminology in family budget management',
      whyItsTheException:
        'Terms like "P&L report," "accounts receivable," or "QuickBooks" in family business context ' +
        'demonstrate that the student learned real business skills, not just "helped with money." ' +
        'The specific tools and terminology prove the sophistication of their financial contribution.',
      example:
        'Created monthly P&L reports for family restaurant using QuickBooks; identified seasonal ' +
        'cost patterns that saved $200/month. The financial terminology proves real accounting skill, ' +
        'not just "helped with the family business finances."',
    },
    {
      pattern: 'CPR/First Aid/CNA certification in caregiving context',
      whyItsTheException:
        'Certifications obtained for caregiving purposes (CPR, First Aid, CNA training) are achievements ' +
        'that demonstrate the student invested in QUALITY of care. They took the initiative to learn ' +
        'proper techniques rather than just doing their best.',
      example:
        'Obtained CPR and First Aid certification to provide safer care for grandparent with heart condition. ' +
        'The certification is not name-dropping — it\'s evidence of initiative and commitment to ' +
        'providing the best possible care.',
    },
  ],
};
