/**
 * Medical & Health Expertise Domain
 *
 * Covers clinical volunteering, EMT/first responder certification,
 * clinical research, public health initiatives, health education,
 * shadowing, hospital programs, CNA work, and health-related
 * community service.
 *
 * Key insight: Medical/health activities are the MOST inflated category
 * in college applications. Every pre-med lists "hospital volunteering."
 * The differentiator is DEPTH — did the student observe medicine,
 * participate in it, or advance it? AOs at T20 schools instantly
 * distinguish between "filed papers in a hospital" and "conducted
 * IRB-approved clinical research."
 *
 * Sources: Sara Harberson on medical activity inflation, NACAC 2024
 * survey data, published AO insights from Harvard/Stanford/JHU admissions
 * blogs, AAMC pre-med advising resources, medical school admissions
 * committee published criteria.
 */

import type { ExpertiseDomain } from '../types';

export const MEDICAL_HEALTH_DOMAIN: ExpertiseDomain = {
  domainId: 'medical_health',
  label: 'Medical & Health',
  overview:
    'Medical and health activities are the most common extracurricular listed by pre-med applicants — ' +
    'and therefore the category where differentiation is hardest. AOs at selective schools see hundreds ' +
    'of "volunteered at a hospital" descriptions per cycle. The progression that matters is: observer → ' +
    'participant → contributor → leader → innovator. Hospital volunteering (even 500 hours) is baseline. ' +
    'What separates tiers is the NATURE of involvement: delivering magazines vs. conducting clinical ' +
    'research, shadowing a doctor vs. earning EMT certification and responding to emergencies.',

  aoExpectations: {
    whatRegisters: [
      'Progression from passive observation to active medical participation — shadowing is a start, not an achievement',
      'Clinical credentials earned (EMT, CNA, CPR instructor) that prove real medical training, not just proximity to medicine',
      'Direct patient interaction with specific responsibilities — not just "helped patients" but what exactly you did and how many',
      'Quantified health outcomes from student-led initiatives — screening rates, patients served, conditions detected',
      'IRB-approved clinical research involvement, especially with named study design and specific contribution',
      'Duration and consistency of commitment — returning to the same clinical setting across multiple years signals genuine calling',
    ],
    whatAOsSeeThrough: [
      'Hour-padding at hospital gift shops or front desks — being IN a hospital is not doing medicine',
      'Vague "gained exposure to the medical field" or "learned about healthcare" — consumption, not contribution',
      'Shadowing described as if the student participated in patient care — watching is not doing',
      'Inflated titles like "clinical research intern" for basic data entry or filing work',
      '"Passionate about medicine" without any evidence of what that passion produced',
    ],
    goldenQuestion:
      'Did this student observe medicine, participate in medicine, or advance medicine?',
    readingTimeContext:
      'AOs spend 8-12 seconds per activity. Medical descriptions that open with "Volunteered at ' +
      'XYZ Hospital" lose 3-4 seconds to the most common opening in pre-med applications. Lead ' +
      'with your specific clinical contribution or credential, not the setting.',
    competitiveContext:
      'At selective institutions, 40-50% of pre-med applicants list hospital volunteering or ' +
      'shadowing. EMT certification is present in ~15-25% at T30 schools. Clinical research ' +
      'with IRB involvement appears in ~5-10% at T20 schools. The bar for medical activities ' +
      'to differentiate is extremely high because of sheer volume.',
  },

  realExpertiseSignals: [
    {
      id: 'mh_clinical_credential',
      pattern: 'clinical_credential_earned',
      description:
        'Student references a specific clinical credential earned — EMT certification, CNA ' +
        'license, phlebotomy certification, CPR instructor status — that required training, ' +
        'examination, and ongoing competency.',
      whyItWorks:
        'Clinical credentials are objective, verifiable proof of medical competence. EMT certification ' +
        'requires 150+ hours of training plus a national exam. A student who earned it and actively ' +
        'responds to emergencies has demonstrated commitment that shadowing never can. Credentials ' +
        'answer the AO\'s question: "Can this student actually DO medicine, or just watch it?"',
      examples: [
        'Earned EMT-B certification; responded to 80+ emergency calls over 14 months on volunteer squad',
        'Completed CNA training and worked 200 patient-contact hours in skilled nursing facility',
        'CPR/BLS instructor — certified 120 community members across 8 training sessions',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'emt', 'emt-b', 'emt-a', 'nremt', 'cna', 'certified nursing assistant',
        'phlebotomy', 'cpr instructor', 'bls instructor', 'certification',
        'licensed', 'credentialed', 'national registry',
      ],
    },
    {
      id: 'mh_patient_care_specifics',
      pattern: 'patient_care_detail',
      description:
        'Student describes specific patient care responsibilities — not just "helped patients" ' +
        'but the exact clinical tasks performed and the volume/frequency of patient interaction.',
      whyItWorks:
        'Specificity about patient care signals real clinical exposure. "Took vitals on 15 patients ' +
        'per shift" is fundamentally different from "assisted nursing staff." AOs can tell who ' +
        'actually touched patients and who filed charts. Volume and specificity are unfakeable.',
      examples: [
        'Monitored vitals for 12-15 patients per 8-hour shift in post-surgical recovery unit',
        'Assisted with wound care, patient repositioning, and meal assistance for 6 residents daily',
        'Performed intake assessments for 200+ patients in free clinic over 18 months',
      ],
      signalStrength: 'strong',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'vitals', 'patient care', 'bedside', 'wound care', 'patient contact hours',
        'patients per', 'shift', 'intake', 'triage', 'assessment', 'clinical hours',
        'patient-facing', 'direct care',
      ],
    },
    {
      id: 'mh_irb_research',
      pattern: 'clinical_research_involvement',
      description:
        'Student references IRB-approved clinical research with specific study design, ' +
        'data collection role, or patient recruitment responsibilities.',
      whyItWorks:
        'IRB involvement is the clearest signal of genuine clinical research. It means an ' +
        'institutional ethics board reviewed the student\'s participation with human subjects. ' +
        'Students who reference IRB protocol numbers, HIPAA training, or specific study designs ' +
        '(retrospective, prospective, cohort) are speaking from real experience.',
      examples: [
        'Recruited 45 participants for IRB-approved study on sleep and adolescent cognition',
        'Collected and de-identified patient data for retrospective cohort study on readmission rates',
        'Assisted with informed consent process for Phase II clinical trial — consented 30 patients',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'irb', 'institutional review board', 'hipaa', 'clinical research',
        'clinical trial', 'patient recruitment', 'informed consent', 'protocol',
        'retrospective', 'prospective', 'cohort study', 'chart review',
        'human subjects', 'ethics approval',
      ],
    },
    {
      id: 'mh_health_outcome_measurement',
      pattern: 'measurable_health_impact',
      description:
        'Student quantifies health outcomes from their initiative — screening rates, ' +
        'conditions detected, patients served, behavioral change metrics.',
      whyItWorks:
        'Measurable health outcomes transform "I did a health project" into "I measurably ' +
        'improved community health." AOs value evidence over claims. A student who can say ' +
        '"our screening program detected 12 undiagnosed cases of hypertension" has evidence ' +
        'that their work mattered.',
      examples: [
        'Free screening program detected 12 undiagnosed hypertension cases in underserved community',
        'Mental health awareness campaign reached 2,000 students; referrals to counseling increased 35%',
        'Health literacy workshops for 400 seniors improved medication adherence by 28% (surveyed 3 months post)',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'detected', 'diagnosed', 'screened', 'patients served', 'referrals',
        'health outcomes', 'reduced', 'improved', 'prevented', 'increased',
        'screening rate', 'adherence', 'survey', 'follow-up',
      ],
    },
    {
      id: 'mh_emergency_response',
      pattern: 'emergency_response_experience',
      description:
        'Student describes responding to actual medical emergencies — not training exercises ' +
        'but real calls, real patients, real decision-making under pressure.',
      whyItWorks:
        'Emergency response is the ultimate proof-of-work in medical activities. A student who ' +
        'has responded to cardiac arrests, trauma calls, or overdoses has been tested in ways that ' +
        'no amount of volunteering can replicate. The specificity of emergency narratives is ' +
        'virtually impossible to fabricate.',
      examples: [
        'Responded to 80+ EMS calls including cardiac arrests, MVAs, and psychiatric emergencies',
        'Provided first response at school athletic events — managed 3 suspected concussions and 1 fracture',
        'Night shift EMT on volunteer squad — averaged 4 calls per shift over 12-month period',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'responded to', 'emergency', 'call', 'cardiac arrest', 'trauma',
        'ambulance', 'first responder', 'ems', 'dispatch', 'scene',
        'stabilized', 'transported', 'triage',
      ],
    },
    {
      id: 'mh_clinical_observation_depth',
      pattern: 'observational_learning_articulation',
      description:
        'Student articulates specific medical knowledge gained through clinical observation — ' +
        'not just that they shadowed, but WHAT they learned about medicine as a practice.',
      whyItWorks:
        'Most shadowing descriptions say "gained insight into medicine." A student who writes ' +
        '"observed how the attending communicated terminal diagnoses to 3 families — changed my ' +
        'understanding of medicine as emotional labor" demonstrates genuine reflection. The ' +
        'specificity of the observation proves presence and engagement.',
      examples: [
        'Observed 15 surgeries across 3 specialties; noted how surgical teams managed unexpected complications in real-time',
        'Shadowed ER physician for 100 hours — documented patterns in how diagnostic reasoning changed under time pressure',
        'Observed that attending spent 40% of time on documentation, not patients — inspired my health informatics project',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'observed', 'shadowed', 'witnessed', 'noticed', 'documented',
        'learned that', 'realized', 'understood', 'surgical', 'rounds',
        'attending', 'resident', 'diagnosis', 'clinical setting',
      ],
    },
    {
      id: 'mh_public_health_systems',
      pattern: 'systems_level_health_thinking',
      description:
        'Student demonstrates understanding of health at the population or systems level — ' +
        'not just individual patient care but community health, epidemiology, or health policy.',
      whyItWorks:
        'Systems-level thinking in health distinguishes future physician-leaders from future ' +
        'individual practitioners. A student who understands that health disparities, insurance ' +
        'coverage, and social determinants affect outcomes is thinking beyond the bedside. AOs ' +
        'at research universities especially value this signal.',
      examples: [
        'Mapped health resource deserts in county — identified 3 zip codes with no primary care within 20 miles',
        'Analyzed emergency department utilization data to identify patterns of preventable visits',
        'Advocated for school-based health center after surveying 400 students on healthcare access barriers',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'public health', 'health disparity', 'social determinants', 'epidemiology',
        'population health', 'health policy', 'access', 'utilization',
        'prevention', 'community health', 'health equity', 'underserved',
      ],
    },
  ],

  nameDropTraps: [
    {
      id: 'mh_hospital_name',
      pattern: 'Hospital / clinic name-drop',
      whyStudentsUseIt:
        'Students believe the prestige of the hospital transfers to them. "Volunteered at ' +
        'Mayo Clinic" sounds more impressive than "volunteered at community hospital." Parents ' +
        'and counselors reinforce this by prioritizing placement at name-brand institutions.',
      whyItFails:
        'The hospital name belongs in the Organization field, not the description. AOs know that ' +
        'hospital volunteering at a famous institution is often LESS meaningful than at a community ' +
        'clinic — prestigious hospitals have more volunteer layers and less direct patient access. ' +
        'Every character spent on the hospital name is a character not spent on what you DID.',
      betterAlternative:
        'Put the hospital in the Organization field. Use the description for your specific ' +
        'clinical contribution and its impact on patients.',
      example: {
        nameDrop:
          'Volunteered at Massachusetts General Hospital in the Emergency Department for 200 hours',
        improved:
          'Assisted ER triage for 200+ patients; flagged critical vitals that accelerated care for 8 acute cases',
        whatChanged:
          'Removed hospital name (already in Organization field). Added specific role (triage), ' +
          'patient volume (200+), and meaningful contribution (flagged critical vitals). AO now ' +
          'sees clinical competence, not just a prestigious address.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 30,
      detectionKeywords: [
        'hospital', 'medical center', 'clinic', 'health system',
        'children\'s hospital', 'memorial', 'general hospital', 'university hospital',
      ],
    },
    {
      id: 'mh_shadowing_hours',
      pattern: '"Shadowed Dr. X for Y hours"',
      whyStudentsUseIt:
        'Students believe high hour counts demonstrate commitment. "300 hours of shadowing" ' +
        'sounds dedicated. The doctor\'s name adds a reference-check impression.',
      whyItFails:
        'Shadowing is passive by definition — the student watched, they did not do. AOs evaluate ' +
        'what was PRODUCED, not how long someone watched. 300 hours of watching a doctor work is ' +
        'less impressive than 50 hours of direct patient care. The doctor\'s name is irrelevant ' +
        'unless they are an Olympic team physician or similar.',
      betterAlternative:
        'Replace hour counts with what you OBSERVED or LEARNED that changed your understanding. ' +
        'Or better: describe what the shadowing inspired you to DO.',
      example: {
        nameDrop:
          'Shadowed Dr. Smith in cardiology department for 150 hours over 2 semesters at local hospital',
        improved:
          'Observed 40+ cardiac catheterizations; insight into complications led me to design patient education pamphlet used by dept',
        whatChanged:
          'Replaced passive hours count with specific procedure observed, quantity, and an ' +
          'active outcome (patient education material adopted by department). Transforms ' +
          'observation into contribution.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 25,
      detectionKeywords: [
        'shadowed', 'shadowing', 'observed dr', 'followed dr',
        'hours of shadowing', 'watched', 'observation hours',
      ],
    },
    {
      id: 'mh_passionate_about_medicine',
      pattern: '"Passionate about medicine/healthcare"',
      whyStudentsUseIt:
        'Students believe stating their passion signals commitment. Counselors sometimes advise ' +
        'including motivation statements. It feels natural to explain WHY you volunteer.',
      whyItFails:
        'Every pre-med applicant is "passionate about medicine." This phrase consumes 25+ characters ' +
        'and communicates zero information. AOs want EVIDENCE of passion (specific actions, outcomes, ' +
        'sacrifices) not DECLARATIONS of passion. Stating it actually weakens the application by ' +
        'wasting space that could demonstrate it.',
      betterAlternative:
        'Delete the passion statement entirely. Use those characters for a specific action, ' +
        'outcome, or moment that SHOWS passion without stating it.',
      example: {
        nameDrop:
          'Passionate about medicine, volunteered at hospital to gain clinical experience and help patients in need',
        improved:
          'Completed 400 patient-contact hours in oncology ward; created comfort kit program now provided to all new patients',
        whatChanged:
          'Removed empty passion declaration and vague motivation. Added specific unit (oncology), ' +
          'quantified hours, and a tangible initiative (comfort kits) with lasting impact. The ' +
          'passion is obvious from the actions.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 30,
      detectionKeywords: [
        'passionate about', 'passion for medicine', 'love for healthcare',
        'dedicated to helping', 'aspire to become a doctor', 'dream of medicine',
        'called to serve',
      ],
    },
    {
      id: 'mh_gained_exposure',
      pattern: '"Gained exposure to" / "Learned about healthcare"',
      whyStudentsUseIt:
        'Students describe their experience in terms of personal learning because that is ' +
        'genuinely what happened. They went to a hospital and learned things. It feels honest.',
      whyItFails:
        'A description is about your CONTRIBUTION, not your education. "Gained exposure to ' +
        'the medical field" tells AOs nothing about what you did or achieved. Every volunteer ' +
        '"gained exposure." It is noise that crowds out substance.',
      betterAlternative:
        'Replace learning statements with action statements. Instead of what you learned, ' +
        'describe what you DID and what RESULTED.',
      example: {
        nameDrop:
          'Gained valuable exposure to emergency medicine and learned about patient triage and care protocols',
        improved:
          'Assisted ER nurses with intake for 500+ patients over 18 months; created Spanish-language triage guide adopted by department',
        whatChanged:
          'Replaced "gained exposure" and "learned about" with specific actions (assisted intake), ' +
          'scale (500+ patients), duration (18 months), and a tangible contribution (Spanish triage guide). ' +
          'The learning is implicit in the doing.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 35,
      detectionKeywords: [
        'gained exposure', 'learned about', 'exposure to', 'experienced',
        'broadened understanding', 'gained insight', 'learned the importance',
      ],
    },
    {
      id: 'mh_medical_terminology_list',
      pattern: 'Medical terminology name-drops',
      whyStudentsUseIt:
        'Students list medical terms (EKG, CBC, intubation, catheterization) to sound ' +
        'knowledgeable. It feels like proof they were in a real medical environment.',
      whyItFails:
        'Medical terminology impresses non-medical readers (parents, peers) but not AOs. ' +
        'AOs know that being NEAR an EKG machine is different from interpreting one. Listing ' +
        'procedures observed is not the same as performing them. The terms waste characters ' +
        'and can actually suggest the student was more observer than participant.',
      betterAlternative:
        'Instead of naming procedures you saw, describe your specific role in patient care ' +
        'and its outcomes. Let the medical context emerge from your actions.',
      example: {
        nameDrop:
          'Observed procedures including EKGs, blood draws, catheterizations, and intubations in the ICU',
        improved:
          'Tracked 30 ICU patients\' daily vitals and recovery metrics; identified data pattern that prompted attending to adjust 2 care plans',
        whatChanged:
          'Replaced passive observation list with active tracking role, specific patient count, and ' +
          'a meaningful contribution (data pattern that changed care). Shows the student contributed, ' +
          'not just watched.',
      },
      prevalence: 'common',
      typicalCharWaste: 40,
      detectionKeywords: [
        'ekg', 'ecg', 'cbc', 'intubation', 'catheterization',
        'procedures including', 'observed procedures', 'witnessed surgeries',
        'medical procedures', 'clinical procedures',
      ],
    },
  ],

  proofOfWorkPatterns: [
    {
      id: 'mh_pow_patient_trust',
      pattern:
        'Student describes earning patient trust or building rapport — specific moments ' +
        'where patients shared, cooperated, or thanked them in ways that signal genuine ' +
        'therapeutic relationship.',
      whyItProves:
        'Patient trust is earned through sustained, compassionate interaction. A student who ' +
        'describes a specific patient interaction with emotional nuance has been present at the ' +
        'bedside. This cannot be fabricated from a brochure description of the volunteer program.',
      examples: [
        'Elderly patient with dementia recognized me by name after 6 months of weekly visits — only volunteer she remembered',
        'Built rapport with non-English-speaking families; became the go-to translator for the oncology floor',
        'Patient requested me specifically for daily walks during 3-week recovery — wrote thank-you letter to volunteer coordinator',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student formed real human connections in a clinical setting. They understand that ' +
        'medicine is about people, not just procedures. This is the emotional intelligence ' +
        'component of medical readiness.',
    },
    {
      id: 'mh_pow_clinical_workflow',
      pattern:
        'Student describes understanding the workflow of a clinical setting — shift handoffs, ' +
        'charting, rounds, interdisciplinary communication patterns.',
      whyItProves:
        'Clinical workflows are invisible to casual observers. A student who mentions shift ' +
        'handoffs, nursing rounds, or SBAR communication has internalized how healthcare actually ' +
        'operates. This knowledge comes only from sustained, embedded clinical experience.',
      examples: [
        'Learned to read nursing flowsheets to anticipate patient needs before rounds',
        'Participated in shift handoff reports; compiled overnight patient status summaries for incoming team',
        'Observed that communication gaps during shift changes correlated with medication errors — proposed checklist solution',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student understands healthcare as a SYSTEM, not just individual encounters. ' +
        'They have been embedded enough to see the operational side of medicine.',
    },
    {
      id: 'mh_pow_emotional_difficulty',
      pattern:
        'Student describes the emotional difficulty of clinical work — patient suffering, ' +
        'death, family grief — and how they processed it.',
      whyItProves:
        'The emotional toll of clinical work is something only those who have truly experienced ' +
        'it can describe authentically. A student who writes about watching a patient decline, or ' +
        'supporting a family after a death, is sharing genuine experience that resume padding ' +
        'never captures.',
      examples: [
        'First patient I regularly visited passed away in month 4 — joined hospital grief support group for volunteers',
        'Learned to maintain composure during pediatric ER cases while genuinely connecting with frightened children',
        'Hardest moment: translating a terminal diagnosis for a non-English-speaking family; changed how I think about healthcare access',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student has confronted the hardest parts of medicine and shown resilience. ' +
        'Medical schools look for exactly this — evidence that a student can handle the ' +
        'emotional demands of patient care.',
    },
    {
      id: 'mh_pow_system_improvement',
      pattern:
        'Student identified a problem in a clinical setting and implemented a solution — ' +
        'workflow improvement, patient education material, process change.',
      whyItProves:
        'Identifying and fixing clinical problems requires deep enough involvement to see ' +
        'what is broken AND enough credibility to propose changes. A student who created ' +
        'a new patient education pamphlet or improved a volunteer workflow has moved beyond ' +
        'following instructions to improving the system.',
      examples: [
        'Noticed patients frequently missed follow-up appointments; created automated reminder system that reduced no-shows by 22%',
        'Designed bilingual discharge instruction sheets after observing readmission patterns among non-English-speaking patients',
        'Proposed reorganization of supply closet that reduced average restocking time from 45 min to 20 min per shift',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student thinks like a physician-leader — not just delivering care but improving ' +
        'how care is delivered. Systems thinking at this age is exceptional.',
    },
    {
      id: 'mh_pow_certification_details',
      pattern:
        'Student describes the process of earning a medical credential — training hours, ' +
        'clinical rotations, examination, practical skills testing.',
      whyItProves:
        'The details of medical certification processes are known only to those who completed ' +
        'them. A student who can describe NREMT practical stations, clinical ride-along hours, ' +
        'or CNA skills check-offs has verifiably gone through the training.',
      examples: [
        'Completed 168-hour EMT course including 24 hours of clinical rotations in ER and on ambulance',
        'Passed NREMT cognitive and psychomotor exams on first attempt — 5th in class of 28',
        'CNA certification required 75 clinical hours; I completed 120 to gain additional experience in memory care unit',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student has verifiable credentials with specific training details. They invested ' +
        'significant time in formal medical education beyond what was required.',
    },
  ],

  descriptionTransforms: [
    {
      id: 'mh_dt_hours_to_impact',
      transformType: 'generic_to_specific',
      before: 'Volunteered at hospital for 300 hours in various departments helping patients and staff',
      after: 'Assisted patient intake in ER for 300 hrs; created triage waiting-room guide that reduced patient anxiety complaints 40%',
      explanation:
        '"300 hours in various departments" tells AOs you logged time but not what you did. ' +
        'Specifying the department (ER), the role (intake), and a tangible contribution (triage guide ' +
        'with measured impact) transforms generic volunteering into clinical contribution.',
      charsBefore: 82,
      charsAfter: 107,
      principle: 'Hours are inputs; outcomes are outputs. AOs value outputs.',
    },
    {
      id: 'mh_dt_shadow_to_action',
      transformType: 'passive_to_active',
      before: 'Shadowed physicians in cardiology and orthopedic surgery departments to learn about medical specialties',
      after: 'Observed 40 cardiac catheterizations; created patient education video on stent recovery now used in pre-op briefings',
      explanation:
        'Shadowing is inherently passive. Transform it by describing what the observation ' +
        'PRODUCED: a specific insight, a project, or a contribution that came from watching ' +
        'closely and thinking critically about what you saw.',
      charsBefore: 92,
      charsAfter: 107,
      principle: 'Transform passive observation into active contribution. What did watching teach you to BUILD?',
    },
    {
      id: 'mh_dt_passion_to_evidence',
      transformType: 'claim_to_evidence',
      before: 'Passionate about healthcare, dedicated to serving underserved communities through medical volunteering',
      after: 'Founded free monthly blood pressure clinic in underserved neighborhood; screened 600+ residents, detected 18 undiagnosed cases',
      explanation:
        '"Passionate about healthcare" is a claim. "Founded free clinic, screened 600+, detected 18 ' +
        'undiagnosed cases" is evidence. AOs will conclude you are passionate from the evidence — ' +
        'you never need to state it.',
      charsBefore: 91,
      charsAfter: 113,
      principle: 'Never declare passion. Show evidence and let the reader draw the conclusion.',
    },
    {
      id: 'mh_dt_name_to_contribution',
      transformType: 'name_drop_to_impact',
      before: 'Research assistant at Johns Hopkins Hospital studying cardiac disease in the Department of Cardiology',
      after: 'Analyzed 2,000 echocardiograms in cardiac outcomes study; findings on valve calcification included in team publication',
      explanation:
        'The institution name belongs in the Organization field. Use the description for ' +
        'specific work (2,000 echocardiograms), the study focus (valve calcification), and ' +
        'output (included in publication). The reader now sees science, not an address.',
      charsBefore: 95,
      charsAfter: 109,
      principle: 'Organization field has the name. Description has the work.',
    },
    {
      id: 'mh_dt_duty_to_achievement',
      transformType: 'duty_to_achievement',
      before: 'Responsible for taking vitals, assisting nurses, and maintaining patient rooms in rehabilitation unit',
      after: 'Tracked recovery metrics for 50 rehab patients over 6 months; mobility data I compiled helped PT team adjust 12 care plans',
      explanation:
        '"Responsible for" lists duties that every volunteer performs. The improved version ' +
        'keeps the same honest scope but adds scale (50 patients, 6 months), ' +
        'specificity (mobility data), and impact (12 care plans adjusted).',
      charsBefore: 95,
      charsAfter: 112,
      principle: 'Describe what you ACHIEVED through your duties, not the duties themselves.',
    },
  ],

  verbHierarchy: [
    {
      tier: 'power',
      verbs: [
        'Diagnosed', 'Stabilized', 'Detected', 'Founded', 'Established',
        'Screened', 'Advocated', 'Responded', 'Intervened', 'Certified',
      ],
      context:
        'Power verbs in medical/health signal active clinical participation and initiative. ' +
        '"Stabilized" implies emergency competence. "Detected" implies diagnostic contribution. ' +
        '"Founded" implies creating health infrastructure. These verbs position the student as ' +
        'a participant in medicine, not an observer.',
      exampleUsage:
        'Stabilized 3 cardiac arrest patients as EMT before hospital arrival; all survived to discharge',
    },
    {
      tier: 'standard',
      verbs: [
        'Assisted', 'Monitored', 'Collected', 'Documented', 'Administered',
        'Educated', 'Coordinated', 'Organized', 'Tracked', 'Completed',
      ],
      context:
        'Standard verbs describe solid clinical contribution but need specific objects and ' +
        'scale to differentiate. "Monitored" needs "15 patients per shift." "Collected" needs ' +
        '"500 blood samples." Without specifics, these verbs are generic.',
      exampleUsage:
        'Monitored post-operative vitals for 15 patients per shift; flagged 4 abnormal readings that triggered intervention',
    },
    {
      tier: 'weak',
      verbs: [
        'Shadowed', 'Observed', 'Watched', 'Learned', 'Gained',
        'Experienced', 'Explored', 'Helped', 'Supported', 'Participated',
      ],
      context:
        'Weak verbs in medical/health signal passive involvement. "Shadowed" is the weakest ' +
        'verb in this domain — it literally means watching someone else work. "Gained exposure" ' +
        'and "learned about" describe personal education, not clinical contribution. These ' +
        'verbs should be replaced with what the student actually DID.',
      exampleUsage:
        'Avoid: "Shadowed surgeon and observed 20 operations" — replace with what the observation produced',
    },
  ],

  roleExpertise: [
    {
      role: 'EMT / First Responder',
      expectedSignals: [
        'Describes certification process and training hours completed',
        'Quantifies emergency calls responded to with call types',
        'References shift schedules and time commitment',
        'Describes specific emergency scenarios handled',
      ],
      differentiators: [
        'High call volume with specific scenario types (cardiac, trauma, pediatric)',
        'Leadership within the squad (training officer, shift lead)',
        'Continued service over multiple years, not just initial certification period',
        'Quality improvement contribution (protocol revision, training development)',
      ],
      overclaimingRisks: [
        'Claiming to have "saved lives" when standard protocols were followed',
        'Describing certification as if it were equivalent to paramedic-level training',
        'Inflating call volume or severity of emergencies encountered',
        'Claiming independent medical decision-making beyond EMT scope of practice',
      ],
      authenticPatterns: [
        'Specific call volume with honest description of most common call types',
        'Describes both routine calls and significant emergencies',
        'References the emotional challenge of emergency response honestly',
        'Mentions continuing education or skill maintenance requirements',
      ],
    },
    {
      role: 'Clinical Research Participant',
      expectedSignals: [
        'Describes specific study design and their role within it',
        'References IRB process, HIPAA training, or institutional oversight',
        'Quantifies data collected, patients consented, or records reviewed',
        'Names the research question or clinical area being studied',
      ],
      differentiators: [
        'Contributed to study design, not just data collection',
        'Co-authored or contributed to a publication or presentation',
        'Made an observation that influenced the study direction',
        'Earned increasing responsibility over time (data collector to analyst)',
      ],
      overclaimingRisks: [
        'Claiming "clinical research" when actually doing data entry or filing',
        'Describing the PI\'s study as "my research" without specifying personal contribution',
        'Listing medical terminology from the study without understanding the science',
        'Claiming co-authorship when listed in acknowledgments',
      ],
      authenticPatterns: [
        'Describes own specific contribution within the larger study',
        'Can articulate the research question and why it matters',
        'Mentions practical challenges (recruitment, IRB timeline, data quality)',
        'Distinguishes between what the study found and what they personally did',
      ],
    },
    {
      role: 'Hospital Volunteer',
      expectedSignals: [
        'Specifies department and role with concrete tasks',
        'Quantifies patient interactions and hour commitment',
        'Describes what they contributed beyond basic presence',
        'Shows growth from initial role to increased responsibility',
      ],
      differentiators: [
        'Created something lasting (program, resource, system improvement)',
        'Earned additional clinical access or responsibilities over time',
        'Requested by specific departments or patients for their contribution',
        'Trained or mentored new volunteers',
      ],
      overclaimingRisks: [
        'Describing gift shop or front desk work as "clinical experience"',
        'Claiming patient care responsibilities that volunteers do not have',
        'Counting all hours in the building as "clinical hours"',
        'Describing routine tasks as innovative or transformative',
      ],
      authenticPatterns: [
        'Honest about the nature of volunteer work (transport, comfort, companionship)',
        'Specific about tasks: "delivered meals to 20 patients per shift" not "helped patients"',
        'Describes what they learned about healthcare systems, not just "medicine"',
        'Growth narrative: started with basic tasks, earned more responsibility over time',
      ],
    },
    {
      role: 'Health Initiative Founder/Leader',
      expectedSignals: [
        'Describes the health problem identified and why it needed addressing',
        'Quantifies people served, events organized, and outcomes achieved',
        'Explains organizational structure and team management',
        'References external validation (partnerships, media, adoption)',
      ],
      differentiators: [
        'Measurable health outcomes (cases detected, behaviors changed, access improved)',
        'Sustained operation beyond initial launch (operating 6+ months)',
        'Institutional adoption or replication by other organizations',
        'Partnership with healthcare providers or public health agencies',
      ],
      overclaimingRisks: [
        'Claiming to have "founded a clinic" when it was a one-time event',
        'Attributing community health improvements solely to own initiative',
        'Describing a school club as a "health organization" without external impact',
        'Inflating reach numbers (people "reached" vs. people actually served)',
      ],
      authenticPatterns: [
        'Specific, verifiable metrics (screened X patients, distributed Y kits)',
        'Describes both successes and challenges in building the initiative',
        'Credits partners and collaborators honestly',
        'Distinguishes between people reached and people whose health outcomes changed',
      ],
    },
  ],

  jargonExceptions: [
    {
      pattern: 'EMT-B / NREMT certification',
      whyItsTheException:
        'EMT certification IS the achievement. Naming the specific certification level (EMT-B, ' +
        'EMT-A, Paramedic) and certifying body (NREMT) communicates a verifiable credential that ' +
        'AOs can look up. The certification itself demonstrates 150+ hours of training, clinical ' +
        'rotations, and passing a national exam. Omitting it would actually lose information.',
      example:
        'Earned NREMT-certified EMT-B; responded to 80+ emergency calls including 12 cardiac events',
    },
    {
      pattern: 'IRB approval / IRB protocol',
      whyItsTheException:
        'IRB approval IS the signal. It means an institutional ethics board reviewed and approved ' +
        'the student\'s involvement with human subjects research. This is rare for high school ' +
        'students and immediately signals legitimate clinical research. Dropping "IRB" would lose ' +
        'the single strongest marker of research legitimacy.',
      example:
        'IRB-approved study on adolescent sleep patterns; recruited 45 participants, analyzed survey + actigraphy data',
    },
    {
      pattern: 'HIPAA training / HIPAA compliance',
      whyItsTheException:
        'HIPAA training completion means the student was trusted with real patient data. This ' +
        'is not a name-drop — it is proof of institutional trust and genuine clinical research ' +
        'involvement. Without HIPAA training, a student could not access protected health ' +
        'information, so naming it establishes the level of access the student had.',
      example:
        'Completed HIPAA training; independently managed de-identification of 3,000 patient records for outcomes study',
    },
    {
      pattern: 'Specific study design names (retrospective, prospective, RCT)',
      whyItsTheException:
        'Study design terminology (retrospective cohort, prospective study, randomized controlled trial) ' +
        'signals that the student understands research methodology at a level beyond "helped with research." ' +
        'The design type IS information because it tells AOs the rigor and complexity of the study. ' +
        'A prospective RCT is qualitatively different from a chart review.',
      example:
        'Recruited patients for prospective cohort study tracking post-surgical outcomes over 12 months',
    },
  ],
};
