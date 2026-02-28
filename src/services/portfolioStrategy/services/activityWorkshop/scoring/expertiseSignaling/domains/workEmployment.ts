/**
 * Work & Employment Expertise Domain
 *
 * Covers: part-time jobs, full-time work, internships, family business, seasonal
 * employment, gig work, food service, retail, childcare, manual labor.
 *
 * Key AO lens: Work activities are evaluated FUNDAMENTALLY DIFFERENTLY from
 * extracurriculars. AOs — especially at selective institutions — deeply respect
 * students who work, particularly when economic necessity drives the employment.
 * For first-gen and low-income students, work hours are not a deficit — they are
 * evidence of maturity, responsibility, and resilience. The key question is NOT
 * "what was your job?" but "what did you bring to this job that another person
 * in the same role would not?"
 *
 * CRITICAL CONTEXT: AOs adjust their lens for work activities. A student who
 * worked 20 hrs/week at a grocery store while maintaining a 3.8 GPA is more
 * impressive in context than a student who did 5 extracurriculars without
 * financial constraints. The description should help AOs see the STUDENT, not
 * just the JOB.
 *
 * Sources: Sara Harberson (former Penn AO), MIT admissions blog ("We value work
 * experience"), Stanford admissions guidance, NACAC surveys on holistic review,
 * published AO insights on socioeconomic context in admissions.
 */

import type { ExpertiseDomain } from '../types';

export const WORK_EMPLOYMENT_DOMAIN: ExpertiseDomain = {
  domainId: 'work_employment',
  label: 'Work & Employment',
  overview:
    'Work activities occupy a unique space in college applications. Unlike extracurriculars, ' +
    'work is often driven by economic necessity rather than choice — and AOs respect this deeply. ' +
    'The challenge is that most work descriptions default to job duties ("cashier at Target") ' +
    'rather than personal contribution. AOs read work activities through a different lens: they ' +
    'are looking for GROWTH within constraints, INITIATIVE beyond the job description, and ' +
    'TRANSFER of skills. A student who was "just a barista" but improved store efficiency, ' +
    'trained new hires, or applied academic skills to the workplace tells a more compelling ' +
    'story than the job title suggests. For first-gen and low-income students, work activities ' +
    'can be among the most powerful items on the entire application.',

  aoExpectations: {
    whatRegisters: [
      'Growth trajectory within the role — promotion, expanded responsibilities, recognition by employer',
      'Initiative beyond the job description — identifying problems and solving them without being asked',
      'Skills transfer — applying academic or analytical skills to improve workplace outcomes',
      'Economic context signaling — work hours that reflect genuine family contribution, not just pocket money',
      'Interpersonal maturity — managing difficult customers, training peers, mediating conflicts',
      'Quantified improvements — not just performing duties, but making the job BETTER for everyone',
    ],
    whatAOsSeeThrough: [
      'Job title as the entire description — "Cashier at Target" is a role, not an achievement',
      '"Responsible for" language — this describes a duty, not an accomplishment',
      'Company prestige as credential — working at Google vs. a local shop matters less than what YOU did',
      'Hours per week as impact metric — time spent is not value created',
      '"Fast-paced environment" and other resume cliches — AOs have read these thousands of times',
      'Generic "customer service" claims — every job involves customer interaction; what was YOURS like?',
    ],
    goldenQuestion:
      'What did this student bring to this job that another person in the same role would not have?',
    readingTimeContext:
      'AOs spend 8-10 seconds per activity, but CONTEXTUAL reading of work activities is different. ' +
      'If AOs see financial need signals (20+ hrs/week, family business, multiple jobs), they ' +
      'read MORE carefully and evaluate MORE generously. The first sentence should help AOs ' +
      'understand the context (economic necessity vs. resume building) so they can calibrate ' +
      'their expectations appropriately.',
    competitiveContext:
      'At selective institutions, approximately 30% of applicants list significant work experience. ' +
      'Among first-gen and low-income applicants, this rises to 70%+. Most work descriptions are ' +
      'dutiful but generic ("worked as cashier, handled transactions, stocked shelves"). Students ' +
      'who show GROWTH, INITIATIVE, or SKILLS TRANSFER within their work stand out dramatically ' +
      'because they demonstrate the same qualities AOs seek in extracurriculars — leadership, ' +
      'problem-solving, and impact — but in a more constrained and arguably more impressive context.',
  },

  realExpertiseSignals: [
    {
      id: 'we_promotion_timeline',
      pattern: 'promotion_trajectory',
      description:
        'Earned promotion or expanded responsibilities within a clear timeline, demonstrating ' +
        'that the employer recognized exceptional performance',
      whyItWorks:
        'Promotion is employer-validated evidence of excellence. When a manager promotes a ' +
        'high school student to shift lead, they are saying "this person outperforms adults in ' +
        'the same role." The timeline matters — fast promotion is more impressive than gradual. ' +
        'AOs interpret promotions as third-party validation of quality.',
      examples: [
        'Promoted to shift lead within 6 months, youngest in store history; supervised 8-person team',
        'Started as busser, promoted to server, then front-of-house trainer in 14 months',
        'Advanced from cashier to department lead; given key-holder responsibilities after 8 months (typically 2 years)',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'promoted', 'promotion', 'advanced', 'elevated', 'moved up',
        'shift lead', 'manager', 'supervisor', 'key holder', 'trainer',
      ],
    },
    {
      id: 'we_quantified_improvement',
      pattern: 'process_improvement',
      description:
        'Made a measurable improvement to a workplace process, system, or outcome — evidence ' +
        'of initiative and analytical thinking applied to a job',
      whyItWorks:
        'Process improvement signals that the student did not just DO the job but THOUGHT about it. ' +
        'A cashier who reduced checkout time, a server who improved table turnover, or a stock clerk ' +
        'who reorganized inventory demonstrates the kind of analytical thinking AOs associate with ' +
        'academic potential. Numbers make the improvement undeniable.',
      examples: [
        'Reduced closing time 25% by reorganizing cleanup workflow; adopted store-wide by manager',
        'Identified $2K/month inventory shrinkage; implemented new tracking system, loss dropped 70%',
        'Created prep schedule that cut food waste 30% and saved kitchen $400/week on ingredients',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'reduced', 'improved', 'increased', 'saved', 'efficiency',
        'streamlined', 'reorganized', 'optimized', 'cut', 'eliminated',
      ],
    },
    {
      id: 'we_problem_solving',
      pattern: 'identified_and_solved',
      description:
        'Identified a workplace problem and solved it without being asked — going beyond ' +
        'the job description to improve things proactively',
      whyItWorks:
        'Initiative is the single most valued quality in work activities because it cannot be ' +
        'assigned. A manager assigns duties; the student CHOSE to solve a problem. This signals ' +
        'the same entrepreneurial, improvement-oriented mindset that AOs look for in all activities.',
      examples: [
        'Noticed scheduling conflicts caused 3-4 no-shows weekly; proposed swap system, absences dropped 80%',
        'Discovered expired products on shelves during routine shift; created daily check process adopted by all shifts',
        'Built simple spreadsheet to track supply ordering; prevented 6 stockouts in first month',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'noticed', 'identified', 'discovered', 'proposed', 'created',
        'built', 'initiated', 'suggested', 'developed', 'problem',
      ],
    },
    {
      id: 'we_leadership_in_context',
      pattern: 'team_leadership',
      description:
        'Led or supervised others in a work context — managing peers, training new hires, ' +
        'coordinating shifts, or handling escalations',
      whyItWorks:
        'Leadership in a work context is different from club leadership because it involves ' +
        'real stakes: money, customers, and coworkers who may be older and more experienced. ' +
        'A 16-year-old supervising a team of 8 during peak hours has more leadership pressure ' +
        'than most club presidents. AOs recognize this context.',
      examples: [
        'Supervised 8-person team during peak hours; responsible for shift performance and customer satisfaction',
        'Trained all new employees (12 in past year); created step-by-step training checklist adopted by management',
        'Managed floor during manager absences; resolved customer escalations, handled cash reconciliation',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'impact',
      detectionKeywords: [
        'supervised', 'managed', 'trained', 'led', 'team',
        'shift', 'employees', 'new hires', 'staff', 'crew',
      ],
    },
    {
      id: 'we_skills_transfer',
      pattern: 'academic_skills_applied',
      description:
        'Applied academic or analytical skills to the workplace — using math, data analysis, ' +
        'writing, or problem-solving skills to improve work outcomes',
      whyItWorks:
        'Skills transfer proves intellectual engagement in a non-academic context. It shows AOs ' +
        'that the student does not compartmentalize learning — they bring their analytical mind ' +
        'everywhere. A student who uses statistics to optimize scheduling or creates a database ' +
        'for inventory demonstrates the kind of applied intelligence AOs value.',
      examples: [
        'Applied statistics from AP class to analyze sales data; identified peak hours and recommended staffing changes that cut wait times 20%',
        'Used Excel skills to build inventory tracking system; reduced manual counting from 4 hrs to 30 min weekly',
        'Applied Spanish from school to serve growing Latino customer base; bilingual service increased tips 25% for team',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'applied', 'used', 'skills', 'data', 'analysis', 'system',
        'database', 'spreadsheet', 'calculated', 'bilingual', 'translated',
      ],
    },
    {
      id: 'we_economic_context',
      pattern: 'financial_contribution',
      description:
        'Signals that work is driven by economic necessity — family contribution, saving for ' +
        'college, supporting household expenses',
      whyItWorks:
        'Economic context is the most powerful frame for work activities at selective institutions. ' +
        'AOs understand that a student working 20+ hours per week to help pay rent is demonstrating ' +
        'maturity and responsibility that privileged students never face. This context reframes ' +
        'EVERYTHING — lower extracurricular involvement is understood, and work quality becomes ' +
        'even more impressive. This is not a sympathy play; it is evidence of character.',
      examples: [
        'Work 25 hrs/week to contribute to family income; saved $4K toward college while maintaining 3.9 GPA',
        'Primary English speaker in family; handle all business correspondence for parents\' restaurant',
        'Work funds my school supplies, transportation, and activity fees; budgeted and saved $2K for SAT prep',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'family', 'contribute', 'support', 'income', 'save', 'saved',
        'college', 'expenses', 'bills', 'necessity', 'need', 'budget',
      ],
    },
    {
      id: 'we_customer_excellence',
      pattern: 'exceptional_service',
      description:
        'Demonstrated exceptional customer interaction skills that resulted in measurable ' +
        'recognition — not generic "customer service" but specific excellence',
      whyItWorks:
        'Every job involves customer interaction, so "provided excellent customer service" is noise. ' +
        'But specific evidence of customer excellence — recognition, metrics, customer relationships — ' +
        'proves interpersonal skills that are genuinely differentiating. AOs value emotional intelligence.',
      examples: [
        'Named Employee of the Month 3 times (from staff of 25); received 15+ written customer commendations',
        'Built regular clientele at coffee shop; 40+ customers request me by name, store survey scores up 12% on my shifts',
        'Resolved 50+ customer complaints without manager escalation; developed de-escalation techniques adopted by team',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'customer', 'client', 'satisfaction', 'feedback', 'commendation',
        'employee of the month', 'recognition', 'complaint', 'resolution',
      ],
    },
    {
      id: 'we_initiative_beyond_role',
      pattern: 'above_and_beyond',
      description:
        'Took on responsibilities or projects that were clearly beyond the job description — ' +
        'evidence of initiative that the employer did not ask for but valued',
      whyItWorks:
        'Going beyond the job description is the work equivalent of founding a club. It proves ' +
        'the student is self-motivated and sees opportunity where others see routine. AOs look for ' +
        'this pattern because it predicts campus leadership — students who create value beyond ' +
        'what is expected of them.',
      examples: [
        'Proposed and implemented customer feedback system using QR codes; response rate of 200+ reviews/month',
        'Volunteered to redesign store display layout; sales in featured section increased 18% over 3 months',
        'Created social media content for small business owner (not in job description); Instagram followers grew from 200 to 1,500',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'proposed', 'volunteered', 'initiated', 'created', 'beyond',
        'additional', 'extra', 'own initiative', 'suggested', 'introduced',
      ],
    },
    {
      id: 'we_family_business',
      pattern: 'family_business_contribution',
      description:
        'Substantial contribution to a family business — not just "helping out" but taking ' +
        'real operational responsibility and contributing to the business\'s success',
      whyItWorks:
        'Family business involvement is uniquely rich for first-gen and immigrant families. ' +
        'It often involves cultural navigation (translating, bridging customer cultures), ' +
        'real financial responsibility, and maturity beyond years. AOs value this context because ' +
        'it demonstrates character, family commitment, and real-world skills simultaneously.',
      examples: [
        'Manage evening operations of family restaurant; handle payroll for 6 employees, vendor orders, and daily accounting',
        'Serve as primary English-speaking representative for parents\' business; negotiated lease renewal saving $300/month',
        'Grew family dry-cleaning pickup service to 50 regular clients by creating online booking system',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'family business', 'family restaurant', 'family store', 'parents\'',
        'family-owned', 'family\'s', 'family operation', 'translate',
      ],
    },
    {
      id: 'we_consistency_resilience',
      pattern: 'sustained_commitment',
      description:
        'Long-term employment with consistent performance — especially when combined with ' +
        'academic excellence, demonstrating exceptional time management',
      whyItWorks:
        'Working consistently for 2+ years at the same job while maintaining strong grades ' +
        'demonstrates time management, reliability, and maturity. AOs at selective schools have ' +
        'specifically cited long-term employment as one of the most underrated activity signals — ' +
        'it proves the student can manage competing demands and honor commitments.',
      examples: [
        'Employed at same restaurant for 3 years, 20 hrs/week through school year; maintained 3.9 GPA and 4 AP courses',
        'Never missed a shift in 2 years of employment; recognized for 100% reliability by district manager',
        'Worked every summer and school break for 4 years; total earnings contributed $8K to family expenses',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'years', 'year', 'consistent', 'reliable', 'never missed',
        'throughout', 'maintained', 'balanced', 'while', 'during',
      ],
    },
    {
      id: 'we_cross_training',
      pattern: 'multi_role_competence',
      description:
        'Learned and performed multiple roles within the same workplace, showing adaptability ' +
        'and becoming a go-to employee',
      whyItWorks:
        'Cross-training shows adaptability, learning agility, and value to the employer. A student ' +
        'who can work register, kitchen, and floor demonstrates versatility and reliability. Employers ' +
        'cross-train their BEST employees — the fact of cross-training itself is recognition.',
      examples: [
        'Cross-trained in 4 departments (register, floor, stock, returns); serve as fill-in for any absent employee',
        'Only employee certified in all 3 stations; regularly requested for complex orders and training shifts',
        'Learned barista, food prep, and inventory roles; became the only closer trusted to manage alone',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'cross-trained', 'multiple roles', 'departments', 'stations',
        'versatile', 'flexible', 'all positions', 'certified', 'trusted',
      ],
    },
    {
      id: 'we_revenue_impact',
      pattern: 'business_contribution',
      description:
        'Made a measurable contribution to the business\'s bottom line — increased sales, ' +
        'reduced costs, improved efficiency in ways that directly affected revenue',
      whyItWorks:
        'Connecting your work to business outcomes demonstrates business acumen and quantitative ' +
        'thinking. It transforms a job description into a contribution story. AOs value this because ' +
        'it shows the student understands how their work creates value — a critical skill for college ' +
        'and career.',
      examples: [
        'Upselling initiative increased average transaction value 15%; recognized as top salesperson for 3 consecutive months',
        'Identified supplier offering 20% lower cost for same quality; saved store $1,200/month on packaging',
        'Managed store social media; increased foot traffic 30% during promotional campaigns, driving $5K additional monthly revenue',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'sales', 'revenue', 'savings', 'cost', 'profit', 'efficiency',
        'increased', 'decreased', 'generated', 'contributed', 'earned',
      ],
    },
  ],

  nameDropTraps: [
    {
      id: 'we_job_title_only',
      pattern: 'Job title as the entire identity',
      whyStudentsUseIt:
        'Students think the job title communicates everything. "Cashier at Target" feels like ' +
        'a complete description because the reader can imagine what a cashier does.',
      whyItFails:
        'AOs already know what a cashier does — they do not need 150 characters to learn the job ' +
        'description. What they DO NOT know is what made THIS cashier different from every other ' +
        'cashier. The job title belongs in the position field; the description should be 100% about ' +
        'what the student uniquely contributed.',
      betterAlternative:
        'Use the description space for what you DID differently, not what the job IS. Every character ' +
        'spent restating the job description is a character not spent on your unique contribution.',
      example: {
        nameDrop: 'Cashier at Target, responsible for handling transactions and assisting customers',
        improved: 'Promoted to team lead in 5 months; trained 8 new hires, reduced checkout errors 35% by creating quick-reference guide',
        whatChanged:
          'Removed job title (listed in position field) and generic duties (transactions, assisting customers). ' +
          'Replaced with growth story (promoted in 5 months), leadership (trained 8), and initiative (created guide, 35% fewer errors).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 35,
      detectionKeywords: [
        'cashier', 'barista', 'server', 'waiter', 'waitress', 'clerk',
        'associate', 'crew member', 'team member', 'employee',
      ],
    },
    {
      id: 'we_responsible_for',
      pattern: '"Responsible for" + duty list',
      whyStudentsUseIt:
        'Students copy resume language from job descriptions or career websites. "Responsible for" ' +
        'feels professional and mature.',
      whyItFails:
        '"Responsible for" introduces a DUTY — something the employer assigned. AOs want to know what ' +
        'the student ACHIEVED, not what they were TOLD to do. A list of responsibilities is a job ' +
        'description, not an accomplishment. It is interchangeable with anyone else in that role.',
      betterAlternative:
        'Replace every "responsible for" with a result. "Responsible for training employees" → ' +
        '"Trained 12 new employees; created training manual that reduced onboarding time 40%." ' +
        'The result transforms a duty into an achievement.',
      example: {
        nameDrop: 'Responsible for managing inventory, customer service, and training new employees',
        improved: 'Revamped inventory system, cutting stock errors 50%; trained 12 employees using manual I created, onboarding time halved',
        whatChanged:
          'Replaced three generic duties with two specific achievements — each with a quantified result. ' +
          'The student is now the person who IMPROVED things, not just the person who did what was expected.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 15,
      detectionKeywords: [
        'responsible for', 'duties included', 'tasked with', 'in charge of',
        'my role was', 'job included', 'handled', 'managed',
      ],
    },
    {
      id: 'we_company_prestige',
      pattern: 'Company name as credential',
      whyStudentsUseIt:
        'Students believe that working at a prestigious company (Google, a hospital, a law firm) ' +
        'transfers that prestige to them. The company name sounds impressive.',
      whyItFails:
        'AOs evaluate the STUDENT, not the employer. "Intern at Google" tells AOs that Google ' +
        'selected the student (mildly impressive), but not what the student actually DID or LEARNED. ' +
        'The company name is already in the organization field — repeating it in the description ' +
        'wastes characters.',
      betterAlternative:
        'Describe what you DID at the company, not where you worked. The company name provides context ' +
        'in the organization field; the description provides evidence of YOUR contribution.',
      example: {
        nameDrop: 'Summer intern at prestigious law firm Smith & Associates LLP',
        improved: 'Analyzed 40 case files for patterns; research summary adopted by 2 attorneys for ongoing litigation strategy',
        whatChanged:
          'Removed company name and "prestigious" label (subjective). Replaced with specific work (40 case files), ' +
          'skill demonstrated (pattern analysis), and real impact (adopted by attorneys for strategy).',
      },
      prevalence: 'common',
      typicalCharWaste: 25,
      detectionKeywords: [
        'prestigious', 'well-known', 'leading', 'top', 'major',
        'Fortune 500', 'renowned', 'established', 'at',
      ],
    },
    {
      id: 'we_hours_as_impact',
      pattern: 'Hours per week as impact metric',
      whyStudentsUseIt:
        'Students believe more hours = more impressive. Working 25 hours per week sounds like ' +
        'a significant commitment, and it is — but hours alone do not tell the story.',
      whyItFails:
        'Hours communicate TIME, not VALUE. AOs value hours only in the context of time management ' +
        '(working 25 hrs + maintaining good grades = impressive), not as a standalone achievement. ' +
        'The hours themselves do not distinguish this student from any other employee who worked ' +
        'the same schedule.',
      betterAlternative:
        'Hours can be mentioned in the hours/week field. Use the description for what you accomplished ' +
        'DURING those hours. If hours provide important context (economic necessity), include them ' +
        'briefly alongside achievements.',
      example: {
        nameDrop: 'Worked 25 hours per week at grocery store throughout the school year',
        improved: 'Worked 25 hrs/week to support family; still earned promotion to department lead, managed 6-person team',
        whatChanged:
          'Kept hours BUT added economic context (support family) and achievements (promotion, team management). ' +
          'The hours now contextualize the achievement instead of replacing it.',
      },
      prevalence: 'common',
      typicalCharWaste: 10,
      detectionKeywords: [
        'hours per week', 'hrs/week', 'hours a week', 'weekly hours',
        'per week', 'hour', 'schedule',
      ],
    },
    {
      id: 'we_generic_customer_service',
      pattern: '"Provided excellent customer service"',
      whyStudentsUseIt:
        'Customer service sounds professional and covers a lot of ground. Students use it as ' +
        'a catch-all for interpersonal work.',
      whyItFails:
        'Every service job involves customer interaction. "Provided excellent customer service" ' +
        'is indistinguishable from any other employee in any other service job. AOs cannot evaluate ' +
        'this claim because there is no evidence — it is an opinion, not a fact.',
      betterAlternative:
        'Replace the generic claim with specific evidence: customer recognition, satisfaction metrics, ' +
        'complaint resolution, repeat customers, or specific interactions that demonstrate skill.',
      example: {
        nameDrop: 'Provided excellent customer service in a fast-paced retail environment',
        improved: 'Resolved 50+ customer complaints without escalation; created returns guide that reduced processing time 30%',
        whatChanged:
          'Replaced vague "excellent customer service" with specific evidence (50+ resolutions) and initiative ' +
          '(created returns guide with measurable result). Also eliminated "fast-paced" cliche.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'customer service', 'excellent service', 'quality service',
        'friendly', 'welcoming', 'helpful', 'assisted customers',
      ],
    },
    {
      id: 'we_fast_paced_environment',
      pattern: '"Fast-paced environment" and similar cliches',
      whyStudentsUseIt:
        'Students borrow language from job postings and LinkedIn. "Fast-paced" and "dynamic" ' +
        'feel like they communicate intensity and challenge.',
      whyItFails:
        'Every job posting says "fast-paced environment." It is the most generic descriptor in ' +
        'employment language. AOs gain zero information from it. It is filler that consumes ' +
        'characters without communicating anything specific about the student.',
      betterAlternative:
        'Replace the adjective with evidence. Instead of saying the environment was "fast-paced," ' +
        'show what you did under pressure: "processed 200 transactions per shift," "served 150 ' +
        'customers during lunch rush."',
      example: {
        nameDrop: 'Thrived in fast-paced restaurant environment serving hundreds of customers daily',
        improved: 'Served 150+ customers per shift; highest tip earner 8 of 12 months, personally requested by 30+ regular diners',
        whatChanged:
          'Replaced "fast-paced environment" (cliche) with specific performance evidence (150+ per shift, ' +
          'highest tips, regular customer requests). The evidence proves the environment was demanding ' +
          'far better than the adjective ever could.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'fast-paced', 'fast paced', 'dynamic', 'high-volume', 'busy',
        'hectic', 'demanding', 'intense', 'challenging environment',
      ],
    },
    {
      id: 'we_trained_employees_generic',
      pattern: '"Trained new employees" without details',
      whyStudentsUseIt:
        'Training others sounds like leadership. Students mention it to signal that they were ' +
        'trusted and experienced enough to teach.',
      whyItFails:
        'Training new employees is a common workplace responsibility, not a unique achievement. ' +
        'AOs need to know HOW you trained (created materials? shadowing? hands-on?), HOW MANY, ' +
        'and WHAT RESULTED. Without these details, training is just another duty.',
      betterAlternative:
        'Quantify the training: how many, what methods, what outcomes. "Trained 12 new employees ' +
        'using checklist I created; new hire error rate dropped 40% in first month."',
      example: {
        nameDrop: 'Trained new employees on store procedures and customer interaction',
        improved: 'Created 15-page training guide; onboarded 14 new hires last year, avg time-to-proficiency dropped from 3 weeks to 10 days',
        whatChanged:
          'Replaced generic "trained on procedures" with specific initiative (created training guide), ' +
          'scale (14 new hires), and measurable improvement (onboarding time reduced by half).',
      },
      prevalence: 'common',
      typicalCharWaste: 15,
      detectionKeywords: [
        'trained', 'training', 'onboarded', 'showed', 'taught',
        'new employees', 'new hires', 'new team members', 'orientation',
      ],
    },
    {
      id: 'we_team_player',
      pattern: '"Team player" and collaboration cliches',
      whyStudentsUseIt:
        'Students believe "team player" signals that they are cooperative and easy to work with. ' +
        'It feels like an important soft skill to communicate.',
      whyItFails:
        'Every employee is expected to be a "team player." Claiming it is like claiming you arrive ' +
        'on time — it is the minimum expectation, not an achievement. AOs cannot distinguish this ' +
        'from any other applicant who wrote the same phrase.',
      betterAlternative:
        'Show teamwork through specific actions and results. Coordinating with others, covering shifts, ' +
        'resolving team conflicts, or achieving team goals are all better than claiming the label.',
      example: {
        nameDrop: 'Strong team player who collaborated well with coworkers in a busy environment',
        improved: 'Covered 40+ shifts for coworkers; organized team scheduling app that reduced conflicts 60%',
        whatChanged:
          'Replaced self-assessment ("strong team player") with evidence of teamwork (covered shifts, ' +
          'created scheduling solution) and quantified result (60% fewer conflicts).',
      },
      prevalence: 'common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'team player', 'collaborated', 'cooperation', 'teamwork',
        'worked well with', 'alongside', 'team-oriented',
      ],
    },
    {
      id: 'we_multiple_duties_listed',
      pattern: 'Listing all job duties in a comma-separated list',
      whyStudentsUseIt:
        'Students want to show the breadth of their responsibilities. More duties = more impressive ' +
        'in their minds.',
      whyItFails:
        'A list of duties tells AOs what the JOB is, not what the STUDENT is. "Stocked shelves, ' +
        'operated register, helped customers, cleaned store" describes every retail employee ever. ' +
        'It wastes the entire 150-character description on generic information.',
      betterAlternative:
        'Pick ONE duty and show how you excelled at it, improved it, or grew through it. ' +
        'Depth on one duty is infinitely more powerful than breadth across five.',
      example: {
        nameDrop: 'Stocked shelves, operated register, cleaned store, assisted customers, managed returns',
        improved: 'Reorganized stockroom layout by sales velocity; restocking time cut 40%, manager adopted system across 3 store locations',
        whatChanged:
          'Replaced five generic duties with one specific achievement. The student chose the duty where they had the most ' +
          'impact (stocking) and showed how they improved it with measurable results and adoption by management.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 50,
      detectionKeywords: [
        'stocked', 'operated', 'cleaned', 'assisted', 'handled',
        'processed', 'maintained', 'performed', 'completed', 'various duties',
      ],
    },
    {
      id: 'we_internship_as_observation',
      pattern: 'Internship described as observation rather than contribution',
      whyStudentsUseIt:
        'Many student internships are observational — shadowing professionals, attending meetings, ' +
        'learning processes. Students describe what they SAW rather than what they DID.',
      whyItFails:
        'AOs evaluate contribution, not attendance. "Shadowed doctors" and "observed surgeries" ' +
        'describe being a spectator. While the access may be impressive, the description should ' +
        'focus on what the student CONTRIBUTED or LEARNED that they applied.',
      betterAlternative:
        'Focus on what you DID during the internship, not what you SAW. Even small contributions — ' +
        'data entry, patient intake, research assistance — are more meaningful than observation.',
      example: {
        nameDrop: 'Interned at local hospital, shadowing doctors and observing patient care procedures',
        improved: 'Organized 3 years of patient satisfaction data into dashboard; findings led to new waiting room protocol reducing complaints 25%',
        whatChanged:
          'Replaced passive observation (shadowing, observing) with active contribution (organized data, ' +
          'created dashboard) and real impact (new protocol, 25% fewer complaints). The student is now a ' +
          'contributor, not a spectator.',
      },
      prevalence: 'common',
      typicalCharWaste: 15,
      detectionKeywords: [
        'shadowed', 'observed', 'watched', 'learned about', 'exposed to',
        'gained exposure', 'saw', 'attended', 'sat in on',
      ],
    },
  ],

  proofOfWorkPatterns: [
    {
      id: 'we_employer_trust_markers',
      pattern: 'Given responsibilities that indicate employer trust beyond the norm for the role',
      whyItProves:
        'Employers do not give key-holder access, closing duties, or cash handling responsibility to ' +
        'employees they do not deeply trust. When a high school student is trusted to close the store ' +
        'alone, manage the register, or handle deposits, it proves exceptional reliability and maturity.',
      examples: [
        'Only high school employee trusted with key-holder access; responsible for opening/closing 3 days/week',
        'Given sole responsibility for nightly cash reconciliation ($3-5K per shift)',
        'Manager left me in charge during 2-week vacation; no incidents, sales up 8% over period',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student earned exceptional trust from adults in a professional context. The employer ' +
        'chose to give this teenager responsibilities normally reserved for adults — that is a powerful ' +
        'endorsement of maturity.',
    },
    {
      id: 'we_workplace_problem_specifics',
      pattern: 'References specific workplace problems with operational details',
      whyItProves:
        'Knowing the operational details of a workplace — which products have the highest shrinkage, ' +
        'what causes the most customer complaints, why the schedule always has gaps — proves genuine ' +
        'engagement with the job. These are details you only learn by caring about the work.',
      examples: [
        'Noticed dairy section had 15% higher waste than other departments; proposed and implemented rotation system',
        'Discovered that Tuesday closings took 30 min longer than other nights; identified cause (incomplete prep list) and fixed it',
        'Tracked that 60% of customer complaints were about wait time at deli counter; proposed number system, complaints dropped 40%',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student pays attention to the job at a systemic level. They do not just perform tasks — ' +
        'they analyze operations and identify improvement opportunities. This is exactly the thinking ' +
        'we want to see in college students.',
    },
    {
      id: 'we_difficult_situation_handling',
      pattern: 'Describes handling difficult customers, emergencies, or workplace crises',
      whyItProves:
        'Handling difficult situations — angry customers, understaffed shifts, equipment failures, ' +
        'medical emergencies — proves composure under pressure. These stories are too specific and ' +
        'emotionally complex to fabricate. They reveal character.',
      examples: [
        'De-escalated situation when customer became aggressive during return dispute; maintained calm, resolved without manager',
        'Managed restaurant floor alone when 3 servers called out during Saturday dinner rush; served 80+ customers',
        'Handled medical emergency when customer collapsed; called 911, performed CPR (certified), stayed until paramedics arrived',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student has genuine composure and maturity. Handling real workplace crises reveals ' +
        'character in a way that school activities rarely can. This is a student who will be steady ' +
        'under pressure in any context.',
    },
    {
      id: 'we_financial_awareness',
      pattern: 'Demonstrates understanding of business finances from the employee perspective',
      whyItProves:
        'An employee who understands how their work connects to business outcomes — labor cost ratios, ' +
        'food cost percentages, sales targets, inventory turnover — has engaged with the business at ' +
        'a deeper level than task execution. This financial awareness proves intellectual engagement.',
      examples: [
        'Learned that labor should be under 30% of revenue; adjusted my side-work efficiency to contribute to that target',
        'Tracked my department\'s daily sales against monthly targets; proposed end-cap display changes that exceeded goal by 12%',
        'Understood food cost targets; adjusted portion sizes based on manager training, kitchen waste dropped 20%',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student understands business from the inside. They connected their daily work to ' +
        'the company\'s financial health — the kind of analytical thinking that will serve them in ' +
        'college economics, business courses, or any analytical discipline.',
    },
    {
      id: 'we_mentoring_new_colleagues',
      pattern: 'Became the go-to person newer employees sought out for help',
      whyItProves:
        'Being the person that others turn to for help is organic leadership — it is not assigned ' +
        'by management but earned through competence and approachability. This informal authority ' +
        'is the purest form of workplace respect.',
      examples: [
        'New hires consistently assigned to shadow me for first week; manager said I produced the most competent trainees',
        'Became the go-to for register overrides and complex transactions; colleagues preferred asking me over manager',
        'Created unofficial "cheat sheet" for complicated drink recipes; entire staff (15 people) now uses it daily',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student earns the trust and respect of coworkers through competence, not title. ' +
        'This organic leadership is more authentic than elected positions because it cannot be ' +
        'campaigned for — it is simply earned.',
    },
    {
      id: 'we_time_management_evidence',
      pattern: 'Demonstrates managing work alongside rigorous academics or family responsibilities',
      whyItProves:
        'The combination of significant work hours with academic achievement or family responsibility ' +
        'proves time management, prioritization, and resilience. This is not a claim — it is a ' +
        'demonstrable fact that AOs can verify across the application.',
      examples: [
        '25 hrs/week during school year + 4 AP courses + varsity tennis; created daily schedule blocks to manage all three',
        'Work every weekend and 3 evenings; wake at 5am to complete homework before school, maintained 3.85 GPA',
        'Took on extra shifts during family financial hardship while preparing for SATs; scored 1480 while working 30 hrs/week',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student manages competing demands at a level most adults struggle with. The combination ' +
        'of work, academics, and personal responsibilities tells us they will handle college workload — ' +
        'and they have already proven it.',
    },
    {
      id: 'we_seasonal_progression',
      pattern: 'Shows year-over-year or season-over-season growth in the same role',
      whyItProves:
        'Returning to the same seasonal job multiple years and showing progression each time proves ' +
        'sustained commitment and continuous improvement. Employers invite back their best employees, ' +
        'so each return is implicit validation.',
      examples: [
        'Lifeguard: Year 1 pool guard → Year 2 beach patrol → Year 3 head guard supervising 6 guards',
        'Camp counselor 3 summers: Year 1 assistant → Year 2 cabin lead (10 campers) → Year 3 program designer for 60 campers',
        'Retail holiday temp: invited back 3 years running; Year 3 managed holiday section with $50K inventory',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student shows sustained growth in a role — evidence of continuous improvement and ' +
        'employer recognition. Being invited back year after year is a vote of confidence.',
    },
    {
      id: 'we_customer_relationships',
      pattern: 'Built genuine relationships with regular customers or clients',
      whyItProves:
        'Building real relationships with customers goes beyond job duties. It demonstrates empathy, ' +
        'consistency, and genuine care for people. Regular customers who ask for you by name are a ' +
        'powerful form of third-party validation.',
      examples: [
        'Built relationships with 40+ regular coffee customers; remember their orders and life updates; they request my shifts',
        'Elderly customer wrote letter to manager crediting me with being the "highlight of her week" for 2 years of friendly checkout conversations',
        'Regular clients at hair salon specifically book with me; personal client list grew from 0 to 25 in first year',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student builds genuine human connections through their work. The ability to maintain ' +
        'relationships and make people feel valued shows emotional intelligence and character.',
    },
  ],

  descriptionTransforms: [
    {
      id: 'we_transform_title_to_growth',
      transformType: 'generic_to_specific',
      before: 'Cashier at grocery store, handling transactions and bagging groceries',
      after: 'Promoted to head cashier in 8 months; trained 10 new hires, reduced register shortages 60% by creating end-of-shift checklist',
      explanation:
        'The job title and duties are already in the position/organization fields. The description ' +
        'should tell the GROWTH story: how fast you were promoted, what you created, what improved.',
      charsBefore: 62,
      charsAfter: 113,
      principle: 'The position field holds the title; the description holds the story',
    },
    {
      id: 'we_transform_duties_to_achievement',
      transformType: 'duty_to_achievement',
      before: 'Responsible for taking orders, serving food, and cleaning tables',
      after: 'Highest tip-earner 9 of 12 months; proposed table-side ordering system that cut wait time 20%, adopted by management',
      explanation:
        'Duty lists describe the job. Achievement statements describe the person. Every "responsible for" ' +
        'should be replaced with what RESULTED from that responsibility.',
      charsBefore: 60,
      charsAfter: 109,
      principle: 'Responsibilities are given; achievements are earned',
    },
    {
      id: 'we_transform_company_to_contribution',
      transformType: 'name_drop_to_impact',
      before: 'Summer intern at Johnson & Johnson working in the marketing department',
      after: 'Analyzed 3 years of social media engagement data; presentation to VP led to revised content strategy for 2 product lines',
      explanation:
        'The company name goes in the organization field. The description should show what the student ' +
        'contributed that a less impressive intern would not have — specific work, specific audience, specific impact.',
      charsBefore: 67,
      charsAfter: 114,
      principle: 'Prestige is the organization\'s; contribution is yours',
    },
    {
      id: 'we_transform_hours_to_context',
      transformType: 'generic_to_specific',
      before: 'Worked 20 hours per week at local restaurant throughout junior and senior year',
      after: '20 hrs/week to support family; promoted to closing manager, youngest employee trusted with nightly deposits ($4K avg)',
      explanation:
        'Hours alone are time, not impact. Hours WITH context (economic necessity) AND achievement ' +
        '(promotion, trust) create a powerful narrative of maturity and excellence under constraint.',
      charsBefore: 69,
      charsAfter: 107,
      principle: 'Hours are context, not content — pair them with achievement',
    },
    {
      id: 'we_transform_passive_to_ownership',
      transformType: 'passive_to_active',
      before: 'Was given the opportunity to help train new team members at the store',
      after: 'Developed 3-day onboarding program; trained 15 new hires, cutting avg time-to-independent-shift from 2 weeks to 5 days',
      explanation:
        '"Was given the opportunity" hands credit to whoever gave it. The transformation puts the ' +
        'student as the driver: they DEVELOPED, they TRAINED, and they achieved a measurable result.',
      charsBefore: 64,
      charsAfter: 114,
      principle: 'You are the subject of every sentence, not the object',
    },
    {
      id: 'we_transform_cliche_to_evidence',
      transformType: 'claim_to_evidence',
      before: 'Provided excellent customer service in a fast-paced retail environment',
      after: 'Named Employee of Quarter twice; resolved 50+ customer complaints independently, proposed returns policy update adopted chain-wide',
      explanation:
        'Two cliches ("excellent customer service" + "fast-paced environment") consume the entire ' +
        'description with zero evidence. The transformation provides three proof points: recognition, ' +
        'independence, and initiative with broad adoption.',
      charsBefore: 62,
      charsAfter: 120,
      principle: 'Delete every cliche and replace with one specific fact',
    },
    {
      id: 'we_transform_family_business_generic',
      transformType: 'generic_to_specific',
      before: 'Help out at family restaurant after school and on weekends',
      after: 'Run evening operations for family restaurant: manage 4 servers, handle vendor orders ($2K/week), maintain books',
      explanation:
        '"Help out" minimizes real responsibility. Many family business workers run substantial operations. ' +
        'The transformation shows the actual scope: management, procurement, and financial responsibility.',
      charsBefore: 55,
      charsAfter: 105,
      principle: 'Family business work is REAL work — describe it with the same rigor as any job',
    },
    {
      id: 'we_transform_internship_passive',
      transformType: 'passive_to_active',
      before: 'Shadowed attorneys and observed court proceedings during summer internship',
      after: 'Drafted case summaries for 25 client files; research on zoning precedents cited in 2 briefs filed with county court',
      explanation:
        'Shadowing and observing are passive. The transformation shows contribution: specific work products ' +
        '(case summaries, research), specific volume (25 files), and real-world impact (cited in filed briefs).',
      charsBefore: 67,
      charsAfter: 107,
      principle: 'Observers learn; contributors impact — show your contribution',
    },
    {
      id: 'we_transform_multiple_jobs',
      transformType: 'generic_to_specific',
      before: 'Worked at pizza shop, tutored younger students, and did yard work for neighbors',
      after: 'Balanced 3 jobs (30 hrs/week total) to fund SAT prep + college apps; earned $5K while maintaining 3.8 GPA',
      explanation:
        'Listing multiple jobs individually wastes characters on three incomplete stories. The transformation ' +
        'creates ONE powerful narrative: economic necessity, time management, and achievement under constraint.',
      charsBefore: 69,
      charsAfter: 98,
      principle: 'Multiple jobs tell one story: resilience under economic pressure',
    },
    {
      id: 'we_transform_gig_to_business',
      transformType: 'generic_to_specific',
      before: 'Did various odd jobs and freelance work in my community',
      after: 'Built lawn care client base of 25 households; $8K annual revenue, hired 2 classmates for peak season, 95% client retention',
      explanation:
        '"Various odd jobs" sounds unfocused. The transformation shows ONE focused effort with business metrics: ' +
        'client base (25), revenue ($8K), team building (hired 2), and loyalty (95% retention).',
      charsBefore: 53,
      charsAfter: 111,
      principle: 'Gig work with metrics IS a business — own it',
    },
  ],

  verbHierarchy: [
    {
      tier: 'power',
      verbs: [
        'promoted', 'earned', 'improved', 'created', 'redesigned',
        'resolved', 'saved', 'generated', 'proposed', 'implemented',
      ],
      context:
        'In work contexts, power verbs demonstrate GROWTH and INITIATIVE — doing more than the job ' +
        'required. AOs respond to verbs that show the student transformed their role rather than ' +
        'merely filling it. These verbs position the student as someone who makes things better.',
      exampleUsage: 'Earned promotion to shift lead within 6 months; implemented new closing procedure saving 30 min nightly',
    },
    {
      tier: 'standard',
      verbs: [
        'managed', 'trained', 'supervised', 'organized', 'coordinated',
        'processed', 'maintained', 'operated', 'served', 'completed',
      ],
      context:
        'Standard verbs in work contexts describe competent job performance. They communicate ' +
        'reliability but not distinction. "Managed" and "trained" are fine as supporting verbs ' +
        'but should be accompanied by specifics and results to be memorable.',
      exampleUsage: 'Managed register and trained 5 new employees on POS system and store procedures',
    },
    {
      tier: 'weak',
      verbs: [
        'worked', 'helped', 'assisted', 'handled', 'did',
        'was responsible for', 'participated in', 'was involved in', 'supported', 'contributed',
      ],
      context:
        'Weak verbs in work descriptions make the student invisible or interchangeable. "Worked at" ' +
        'could describe anyone. "Helped with" gives credit to whoever was actually in charge. ' +
        '"Was responsible for" introduces a duty, not an achievement. Replace every weak verb with ' +
        'the specific action and its result.',
      exampleUsage: 'Worked at restaurant (vs. "Served 100+ customers per shift; highest satisfaction scores 6 months running")',
    },
  ],

  roleExpertise: [
    {
      role: 'Retail / Food Service Employee',
      expectedSignals: [
        'Consistent attendance and reliability over 6+ months',
        'Customer interaction skills demonstrated through specific examples',
        'Ability to handle multiple tasks under time pressure',
        'Basic teamwork and communication with coworkers',
      ],
      differentiators: [
        'Promotion or expanded responsibilities beyond initial role',
        'Created systems or processes that improved operations',
        'Employee recognition (Employee of the Month, commendations)',
        'Training responsibility for new hires',
        'Specific metrics showing personal performance (sales, satisfaction, efficiency)',
      ],
      overclaimingRisks: [
        'Describing standard duties as personal achievements',
        'Claiming management responsibilities without actual supervisory authority',
        'Inflating customer numbers or satisfaction metrics',
        'Presenting team achievements as individual accomplishments',
      ],
      authenticPatterns: [
        'References specific shifts, schedules, or seasons and how they differed',
        'Mentions specific coworker relationships (learned from senior colleague, mentored newer hire)',
        'Describes real challenges (difficult customer, understaffed shift, equipment failure)',
        'Knows operational details (closing procedures, inventory cycles, rush patterns)',
      ],
    },
    {
      role: 'Intern',
      expectedSignals: [
        'Specific project or task with identifiable deliverables',
        'Learning demonstrated through application, not just observation',
        'Professional communication in a workplace setting',
        'Adaptation to workplace culture and expectations',
      ],
      differentiators: [
        'Work product used by the organization after internship ended',
        'Offered return invitation or extended internship',
        'Took on project beyond assigned scope',
        'Received specific positive feedback from supervisor (quotable)',
        'Internship led to genuine career clarity or direction change',
      ],
      overclaimingRisks: [
        'Describing observation as contribution ("shadowed" is not "performed")',
        'Inflating role scope beyond actual responsibilities',
        'Claiming impact from the organization\'s work rather than personal contribution',
        'Presenting a family-arranged internship as competitively secured',
      ],
      authenticPatterns: [
        'References specific deliverables with detail level that suggests real work',
        'Describes something they did NOT know before and how they learned it',
        'Mentions feedback received and how they adjusted their approach',
        'Acknowledges the gap between their skill level and professional standards',
      ],
    },
    {
      role: 'Family Business Worker',
      expectedSignals: [
        'Clear description of actual responsibilities (not just "helping")',
        'Understanding of the business operations at a level beyond customer-facing',
        'Sustained involvement over significant time period',
        'Cultural or linguistic bridging for immigrant family businesses',
      ],
      differentiators: [
        'Modernized or improved business operations (digital systems, social media, efficiency)',
        'Took on adult-level responsibilities (bookkeeping, vendor management, hiring)',
        'Navigated cultural dynamics (serving as translator, bridging generational business approaches)',
        'Grew the business measurably (new revenue streams, customer base expansion)',
        'Balanced business demands with academic excellence',
      ],
      overclaimingRisks: [
        'Claiming ownership-level authority in a parent-owned business',
        'Overstating the business\'s scale or revenue',
        'Presenting routine family contributions as extraordinary',
        'Using "CEO" or "Manager" title for family help',
      ],
      authenticPatterns: [
        'References specific family dynamics with cultural awareness',
        'Describes tension between business demands and personal goals (empathetically)',
        'Knows operational details that only daily involvement would reveal',
        'Mentions the emotional weight of family responsibility alongside the practical',
      ],
    },
    {
      role: 'Freelancer / Gig Worker',
      expectedSignals: [
        'Specific client base or service offerings',
        'Revenue or volume metrics demonstrating sustained demand',
        'Self-management skills (scheduling, pricing, quality control)',
        'Client acquisition beyond family and friends',
      ],
      differentiators: [
        'Built reputation through quality work and referrals',
        'Raised prices over time as skills improved',
        'Managed multiple concurrent clients professionally',
        'Created a system or brand beyond ad-hoc individual jobs',
        'Demonstrated genuine expertise in the service offered',
      ],
      overclaimingRisks: [
        'Calling occasional babysitting or lawn mowing a "business"',
        'Inflating client numbers or revenue',
        'Presenting one-time projects as ongoing client relationships',
        'Claiming professional-level expertise for casual skill sets',
      ],
      authenticPatterns: [
        'References specific clients and projects with distinguishing details',
        'Describes pricing evolution and business learning curve',
        'Mentions the challenges of self-employment (unreliable scheduling, payment collection)',
        'Shows growth from first gig to current operation with specific milestones',
      ],
    },
  ],

  jargonExceptions: [
    {
      pattern: 'Specific industry certification that required significant training or testing',
      whyItsTheException:
        'Certifications like ServSafe, OSHA 10-Hour, Lifeguard Certification, EMT-B, or ' +
        'phlebotomy certification represent genuine training investments that qualify the student ' +
        'for specific, often safety-critical work. The certification name communicates capability ' +
        'that would take many characters to explain.',
      example: 'Earned EMT-B certification (180 hrs training); responded to 50+ emergency calls as volunteer EMT while working 20 hrs/week at pharmacy',
    },
    {
      pattern: 'Employer-specific recognition program with competitive selection',
      whyItsTheException:
        'When a large employer (Starbucks, Target, Chick-fil-A) has a named recognition program ' +
        'with competitive selection, the program name contextualizes the achievement. "Starbucks ' +
        'Partner of the Quarter" communicates more than "recognized by employer" because it ' +
        'implies a formal process and large comparison pool.',
      example: 'Selected as Chick-fil-A Team Member of the Year from 40 employees; chosen for new restaurant opening training team',
    },
    {
      pattern: 'Specific POS or business system that contextualizes technical skill',
      whyItsTheException:
        'While technology names are usually traps, specific business systems (Square, Shopify, ' +
        'QuickBooks, Toast POS) can contextualize the sophistication of the work when paired with ' +
        'what the student DID with the system. "Managed QuickBooks for family business" signals ' +
        'bookkeeping competence more efficiently than describing every financial task.',
      example: 'Migrated family restaurant from paper to Toast POS; trained 8 staff, reduced order errors 45%, enabled data-driven menu decisions',
    },
    {
      pattern: 'Named scholarship or award funded by the employer',
      whyItsTheException:
        'Some employers fund education scholarships for their employees (McDonald\'s Archways, ' +
        'Starbucks College Achievement Plan, Chick-fil-A Remarkable Futures). These named programs ' +
        'communicate that the employer invested in the student — a powerful form of validation ' +
        'that is efficiently communicated by program name.',
      example: 'One of 3 employees selected for McDonald\'s HACER National Scholarship ($100K); recognized for academic excellence and community leadership',
    },
    {
      pattern: 'Industry-specific metric that proves performance',
      whyItsTheException:
        'Some industries have standard performance metrics (food cost percentage, labor cost ratio, ' +
        'NPS score, table turn time) that efficiently communicate achievement. When a student uses ' +
        'these metrics correctly, it proves they understand the business at a professional level. ' +
        'The metric IS the proof of depth.',
      example: 'Maintained food cost at 28% vs 32% restaurant avg; proposed menu engineering changes that improved per-plate margin 15%',
    },
  ],
};
