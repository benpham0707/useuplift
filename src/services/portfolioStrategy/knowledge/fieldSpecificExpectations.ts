/**
 * Field-Specific Expectations Knowledge Base
 *
 * Comprehensive knowledge of what activities, achievements, descriptions, and
 * time commitments are expected/impressive for each major field.
 *
 * This enables nuanced, field-aware analysis that mirrors how specialized
 * admissions counselors evaluate profiles.
 *
 * Sources:
 * - MIT Admissions officer interviews on engineering vs. humanities evaluation
 * - Stanford CS admissions data on what CS applicants typically show
 * - Pre-med advisor consensus on clinical hours and research expectations
 * - Wharton/business school admissions patterns
 * - Arts school portfolio requirements and competition benchmarks
 */

import { MajorCategory } from './majorActivityAlignment';
import { FieldExpectations } from '../types/nuancedProfiling';

// ============================================================================
// COMPUTER SCIENCE EXPECTATIONS
// ============================================================================

export const CS_EXPECTATIONS: FieldExpectations = {
  major: 'computer_science',

  tierExpectations: {
    minimumTier1Count: 1,
    minimumTier2Count: 2,
    expectedActivities: [
      'USACO Silver+ or equivalent competitive programming',
      'Significant personal coding project (app, website, tool)',
      'CS-related club involvement or leadership',
      'Hackathon participation with projects',
    ],
    bonusActivities: [
      'USACO Gold/Platinum',
      'App with real users (1000+)',
      'Open source contributions to major projects',
      'CS research with publication or presentation',
      'Tech internship at recognized company',
      'Created tool used by school/community',
    ],
    warningSignals: [
      'Only AP CS classes with no external projects',
      'Generic bootcamp attendance without portfolio',
      '"CEO of app" with no users or traction',
      'Robotics team with no coding role',
      'Claiming AI/ML experience without technical depth',
    ],
  },

  impactBenchmarks: {
    exceptional: [
      { metric: 'App/website users', threshold: '10,000+' },
      { metric: 'GitHub stars on project', threshold: '1,000+' },
      { metric: 'Open source commits to major project', threshold: '100+' },
      { metric: 'USACO level', threshold: 'Gold or higher' },
      { metric: 'Research publication', threshold: 'Peer-reviewed venue' },
    ],
    strong: [
      { metric: 'App/website users', threshold: '1,000+' },
      { metric: 'GitHub project stars', threshold: '100+' },
      { metric: 'USACO level', threshold: 'Silver' },
      { metric: 'Hackathon placement', threshold: 'Top 3 at recognized event' },
      { metric: 'Teaching reach', threshold: '50+ students taught to code' },
    ],
    baseline: [
      { metric: 'Completed personal projects', threshold: '3+' },
      { metric: 'USACO participation', threshold: 'Bronze' },
      { metric: 'Hackathon participation', threshold: '2+ events' },
      { metric: 'CS club involvement', threshold: 'Active member 2+ years' },
    ],
  },

  descriptionExpectations: {
    keyTerms: [
      'algorithm', 'data structure', 'framework', 'API', 'database',
      'deployed', 'users', 'full-stack', 'backend', 'frontend',
      'machine learning', 'neural network', 'optimization',
      'version control', 'agile', 'sprint', 'testing',
    ],
    actionVerbs: [
      'developed', 'engineered', 'architected', 'deployed', 'scaled',
      'optimized', 'debugged', 'refactored', 'implemented', 'automated',
      'integrated', 'designed', 'built', 'programmed', 'coded',
    ],
    quantificationExamples: [
      'Developed app with 5,000 monthly active users',
      'Reduced load time by 40% through caching optimization',
      'Processed 1M+ data points for research analysis',
      'Trained 30 students in Python fundamentals',
      'Contributed 50+ commits to TensorFlow documentation',
    ],
    avoidTerms: [
      'helped with technology', 'worked on computer stuff',
      'learned coding', 'interested in AI', 'used apps',
      'participated in tech', 'assisted with website',
    ],
  },

  genuineInterestMarkers: {
    earlySignals: [
      'Started coding before high school',
      'Self-taught programming languages',
      'Built projects for personal use or fun',
      'Active in online coding communities',
    ],
    developmentPattern: [
      'Progressed from tutorials to original projects',
      'Learned multiple languages/frameworks',
      'Participated in competitive programming',
      'Started contributing to others\' projects',
    ],
    matureIndicators: [
      'Has portfolio of diverse projects',
      'Can discuss technical decisions and tradeoffs',
      'Projects solve real problems for real users',
      'Mentors other students in coding',
    ],
  },

  commonMistakes: [
    {
      mistake: 'Listing courses as activities',
      whyItHurts: 'AP CS is expected, not distinctive. Shows no initiative beyond classroom.',
      howToFix: 'Focus on what you BUILT, not what you learned. Projects > classes.',
    },
    {
      mistake: 'Vague "app development" claims',
      whyItHurts: 'Raises authenticity concerns without specifics. AOs want to see the product.',
      howToFix: 'Name the app, state user count, describe the problem solved.',
    },
    {
      mistake: '"CEO of tech startup" with no traction',
      whyItHurts: 'Inflated title with no evidence is a major red flag.',
      howToFix: 'Focus on what you built and learned, not corporate titles.',
    },
    {
      mistake: 'Only group/team projects',
      whyItHurts: 'Hard to assess individual contribution. Independent work matters.',
      howToFix: 'Have at least one significant individual project to demonstrate skills.',
    },
    {
      mistake: 'Buzzword-heavy descriptions ("AI", "blockchain", "ML")',
      whyItHurts: 'Without technical depth, suggests surface-level understanding.',
      howToFix: 'Describe the actual implementation, not just the technology name.',
    },
  ],
};

// ============================================================================
// ENGINEERING EXPECTATIONS
// ============================================================================

export const ENGINEERING_EXPECTATIONS: FieldExpectations = {
  major: 'engineering',

  tierExpectations: {
    minimumTier1Count: 1,
    minimumTier2Count: 2,
    expectedActivities: [
      'Robotics team with technical role (FRC, VEX, FTC)',
      'Science Olympiad with engineering events',
      'Physics/Math competition participation',
      'Hands-on building/design projects',
    ],
    bonusActivities: [
      'Science Olympiad state/national medalist',
      'FRC/VEX championship qualifier',
      'Patent or significant invention',
      'Engineering research publication',
      'Engineering internship',
      'Built working prototype solving real problem',
    ],
    warningSignals: [
      'Only math competitions without building anything',
      'Robotics team with purely business/marketing role',
      'No hands-on engineering experience',
      'All theoretical, no practical application',
      'Engineering interest from only senior year',
    ],
  },

  impactBenchmarks: {
    exceptional: [
      { metric: 'Robotics competition', threshold: 'Worlds qualifier or state champion' },
      { metric: 'Science Olympiad', threshold: 'National medal' },
      { metric: 'Invention', threshold: 'Patent filed or working commercial product' },
      { metric: 'Research', threshold: 'Published paper or ISEF finalist' },
    ],
    strong: [
      { metric: 'Robotics competition', threshold: 'Regional winner or state qualifier' },
      { metric: 'Science Olympiad', threshold: 'State top 3 in event' },
      { metric: 'Projects', threshold: 'Functional prototype solving real problem' },
      { metric: 'Internship', threshold: 'Engineering role at real company' },
    ],
    baseline: [
      { metric: 'Robotics participation', threshold: '2+ years with technical role' },
      { metric: 'Building projects', threshold: '3+ completed projects' },
      { metric: 'Math/physics competition', threshold: 'AIME or equivalent' },
    ],
  },

  descriptionExpectations: {
    keyTerms: [
      'designed', 'built', 'prototyped', 'tested', 'iterated',
      'CAD', 'fabrication', 'mechanism', 'circuit', 'sensor',
      'load', 'torque', 'efficiency', 'optimization', 'failure analysis',
      'specifications', 'tolerance', 'manufacturing',
    ],
    actionVerbs: [
      'designed', 'engineered', 'built', 'fabricated', 'tested',
      'prototyped', 'machined', 'assembled', 'calibrated', 'optimized',
      'troubleshot', 'iterated', 'manufactured', 'integrated',
    ],
    quantificationExamples: [
      'Designed drivetrain achieving 15 ft/s robot speed',
      'Built sensor array with 99.5% accuracy in target detection',
      'Reduced mechanism cycle time from 3s to 1.2s through redesign',
      'Led team of 8 in building 120-lb competition robot',
      'Machined 50+ precision parts on CNC lathe',
    ],
    avoidTerms: [
      'helped build things', 'worked on robot',
      'interested in engineering', 'like to fix stuff',
      'participated in building', 'assisted team',
    ],
  },

  genuineInterestMarkers: {
    earlySignals: [
      'Built things from young age (Lego, electronics)',
      'Took apart appliances to understand them',
      'Self-taught CAD or fabrication skills',
      'Science Olympiad from middle school',
    ],
    developmentPattern: [
      'Progressed from simple to complex builds',
      'Learned new fabrication techniques',
      'Took on more technical roles over time',
      'Started designing original projects (not just kits)',
    ],
    matureIndicators: [
      'Can explain engineering tradeoffs',
      'Has portfolio of working projects',
      'Others rely on technical expertise',
      'Mentors younger builders',
    ],
  },

  commonMistakes: [
    {
      mistake: 'Robotics team with no technical contribution',
      whyItHurts: 'Business/outreach roles don\'t demonstrate engineering ability.',
      howToFix: 'Transition to technical role, or highlight technical learning.',
    },
    {
      mistake: 'Only competition participation, no personal projects',
      whyItHurts: 'Team achievements are shared. Individual projects show initiative.',
      howToFix: 'Build personal project demonstrating engineering skills.',
    },
    {
      mistake: 'All math/theory, no hands-on',
      whyItHurts: 'Engineering is applied. Need to show you can build, not just calculate.',
      howToFix: 'Complete at least one physical build project.',
    },
  ],
};

// ============================================================================
// PRE-MED EXPECTATIONS
// ============================================================================

export const PREMED_EXPECTATIONS: FieldExpectations = {
  major: 'pre_med',

  tierExpectations: {
    minimumTier1Count: 0, // Research publication or founded significant health org
    minimumTier2Count: 2,
    expectedActivities: [
      'Clinical volunteering/experience (100+ hours)',
      'Non-clinical volunteering showing service commitment',
      'Science research experience',
      'Science competition or academic achievement',
    ],
    bonusActivities: [
      'Published biomedical research',
      'EMT/CNA certification',
      'Founded sustainable health initiative',
      'USABO medalist',
      'Significant shadowing with reflection (50+ hours)',
      'Health policy advocacy',
    ],
    warningSignals: [
      'Only shadowing without service',
      'Senior year clinical volunteering only',
      'No actual patient interaction',
      'High hours but no impact or reflection',
      'Health nonprofit with no concrete impact',
    ],
  },

  impactBenchmarks: {
    exceptional: [
      { metric: 'Clinical hours', threshold: '500+ with documented patient interaction' },
      { metric: 'Research', threshold: 'First/second author publication' },
      { metric: 'Health initiative', threshold: 'Served 1000+ people directly' },
      { metric: 'EMT runs', threshold: '100+ emergency responses' },
    ],
    strong: [
      { metric: 'Clinical hours', threshold: '250+ with meaningful role' },
      { metric: 'Research', threshold: 'Poster presentation or co-author' },
      { metric: 'Health initiative', threshold: 'Served 200+ people' },
      { metric: 'Shadowing hours', threshold: '50+ across multiple specialties' },
    ],
    baseline: [
      { metric: 'Clinical volunteering', threshold: '100+ hours' },
      { metric: 'Non-clinical service', threshold: '50+ hours' },
      { metric: 'Shadowing', threshold: '20+ hours' },
      { metric: 'Science competition', threshold: 'State-level participation' },
    ],
  },

  descriptionExpectations: {
    keyTerms: [
      'patient care', 'clinical', 'diagnosis', 'treatment',
      'vital signs', 'chart', 'physician', 'nurse', 'rounds',
      'underserved', 'health disparities', 'public health',
      'empathy', 'bedside manner', 'communication',
    ],
    actionVerbs: [
      'assisted', 'comforted', 'transported', 'monitored', 'documented',
      'advocated', 'communicated', 'coordinated', 'supported', 'observed',
      'trained', 'researched', 'analyzed', 'implemented',
    ],
    quantificationExamples: [
      'Provided direct support to 200+ patients in ER over 300 hours',
      'Researched cancer biomarkers in Dr. X\'s lab, contributing to Nature publication',
      'Organized health fair serving 500 community members with free screenings',
      'Completed 75 EMT runs, responding to cardiac, trauma, and medical emergencies',
      'Mentored 15 students interested in healthcare careers',
    ],
    avoidTerms: [
      'want to help people', 'always wanted to be a doctor',
      'followed doctors around', 'watched surgeries',
      'interested in medicine', 'love science',
    ],
  },

  genuineInterestMarkers: {
    earlySignals: [
      'Interest in biology/health from early age',
      'Personal experience with healthcare (family illness, etc.)',
      'Started volunteering before junior year',
      'Genuine curiosity about how body works',
    ],
    developmentPattern: [
      'Progressed from observation to participation',
      'Sought increasing patient interaction',
      'Researched specific health issues deeply',
      'Connected service to larger health equity issues',
    ],
    matureIndicators: [
      'Can articulate specific aspects of medicine drawn to',
      'Has reflected meaningfully on patient interactions',
      'Understands healthcare challenges beyond individual care',
      'Sustained commitment even through difficult experiences',
    ],
  },

  commonMistakes: [
    {
      mistake: 'Only shadowing, no service',
      whyItHurts: 'Shadowing is passive observation. Need to show service commitment.',
      howToFix: 'Add clinical volunteering with actual patient interaction.',
    },
    {
      mistake: 'Senior year health nonprofit',
      whyItHurts: 'Classic resume padding signal. No time to show real impact.',
      howToFix: 'Focus on deepening existing activities rather than new ones.',
    },
    {
      mistake: 'Generic "helped patients" description',
      whyItHurts: 'Doesn\'t show what you actually learned or contributed.',
      howToFix: 'Describe specific interactions, what you learned, how you grew.',
    },
    {
      mistake: 'High hours without reflection',
      whyItHurts: 'Hours alone don\'t show why you want medicine.',
      howToFix: 'Connect experiences to understanding of healthcare and self.',
    },
  ],
};

// ============================================================================
// BUSINESS/ECONOMICS EXPECTATIONS
// ============================================================================

export const BUSINESS_EXPECTATIONS: FieldExpectations = {
  major: 'business_economics',

  tierExpectations: {
    minimumTier1Count: 1,
    minimumTier2Count: 2,
    expectedActivities: [
      'DECA/FBLA/BPA involvement with advancement',
      'Business/entrepreneurship club leadership',
      'Investment club or economics team',
      'Work experience demonstrating business skills',
    ],
    bonusActivities: [
      'Revenue-generating business (real P&L)',
      'DECA/FBLA nationals',
      'Finance internship',
      'Raised external funding',
      'Published economic research',
      'Investment returns documented',
    ],
    warningSignals: [
      'DECA participation without advancement',
      '"CEO" of idea-stage company',
      'Investment club without actual investing',
      'Business interest only from senior year',
    ],
  },

  impactBenchmarks: {
    exceptional: [
      { metric: 'Business revenue', threshold: '$50,000+ generated' },
      { metric: 'Funding raised', threshold: 'External investment received' },
      { metric: 'DECA/FBLA', threshold: 'Nationals top 10' },
      { metric: 'Internship', threshold: 'Finance/consulting at recognized firm' },
    ],
    strong: [
      { metric: 'Business revenue', threshold: '$5,000+ generated' },
      { metric: 'DECA/FBLA', threshold: 'State champion or nationals qualifier' },
      { metric: 'Investment club', threshold: 'Managed real portfolio' },
      { metric: 'Employees/freelancers', threshold: 'Managed others' },
    ],
    baseline: [
      { metric: 'DECA/FBLA', threshold: 'Regional advancement' },
      { metric: 'Business activity', threshold: 'Launched with customers' },
      { metric: 'Work experience', threshold: 'Customer-facing role' },
    ],
  },

  descriptionExpectations: {
    keyTerms: [
      'revenue', 'profit', 'margin', 'ROI', 'customer acquisition',
      'market research', 'competitive analysis', 'financial modeling',
      'pitch', 'investor', 'scale', 'growth', 'KPIs',
      'supply chain', 'operations', 'marketing', 'sales',
    ],
    actionVerbs: [
      'launched', 'scaled', 'negotiated', 'pitched', 'managed',
      'analyzed', 'forecasted', 'marketed', 'sold', 'invested',
      'partnered', 'grew', 'optimized', 'strategized',
    ],
    quantificationExamples: [
      'Grew e-commerce business from $0 to $30K annual revenue',
      'Managed $5K investment portfolio achieving 15% returns',
      'Negotiated 3 wholesale partnerships reducing costs 25%',
      'Advanced to DECA nationals, top 15 in Business Finance',
      'Recruited and managed team of 5 student marketers',
    ],
    avoidTerms: [
      'interested in business', 'want to make money',
      'run a company someday', 'like economics',
      'participated in business club', 'learned about finance',
    ],
  },

  genuineInterestMarkers: {
    earlySignals: [
      'Started selling/trading from young age',
      'Interest in how businesses work',
      'Read business news/books voluntarily',
      'Asked about family finances/business',
    ],
    developmentPattern: [
      'Progressed from ideas to execution',
      'Learned from failures and pivoted',
      'Took on increasing P&L responsibility',
      'Started thinking about scale and systems',
    ],
    matureIndicators: [
      'Can discuss business model and unit economics',
      'Has generated real revenue or managed real money',
      'Others trust with financial responsibility',
      'Thinks strategically about opportunities',
    ],
  },

  commonMistakes: [
    {
      mistake: 'Inflated title without substance',
      whyItHurts: '"CEO" or "Founder" without traction is a red flag.',
      howToFix: 'Focus on what you actually built and achieved, not titles.',
    },
    {
      mistake: 'DECA participation without advancement',
      whyItHurts: 'Participation alone is Tier 4. Shows you tried but didn\'t excel.',
      howToFix: 'Advance to regionals/states or highlight other business achievements.',
    },
    {
      mistake: 'Investment club with no real investing',
      whyItHurts: 'Simulated trading doesn\'t demonstrate actual skill.',
      howToFix: 'Document real investments, even if small amounts.',
    },
  ],
};

// ============================================================================
// HUMANITIES EXPECTATIONS
// ============================================================================

export const HUMANITIES_EXPECTATIONS: FieldExpectations = {
  major: 'humanities',

  tierExpectations: {
    minimumTier1Count: 1,
    minimumTier2Count: 1,
    expectedActivities: [
      'Sustained writing practice (school paper, personal blog, etc.)',
      'Reading beyond curriculum',
      'Discussion/debate about ideas',
      'Cultural or historical engagement',
    ],
    bonusActivities: [
      'Scholastic Writing Gold Key or higher',
      'Published in recognized literary outlets',
      'Founded literary magazine or humanities initiative',
      'Won national writing competition',
      'Significant research in humanities',
      'YoungArts recognition',
    ],
    warningSignals: [
      'Only school newspaper without growth',
      'Generic "book club" participation',
      'No original work produced',
      'All consumption, no creation',
    ],
  },

  impactBenchmarks: {
    exceptional: [
      { metric: 'Writing recognition', threshold: 'Scholastic Gold or national publication' },
      { metric: 'Original work', threshold: 'Published book or substantial portfolio' },
      { metric: 'Platform created', threshold: 'Magazine/blog with significant readership' },
    ],
    strong: [
      { metric: 'Writing recognition', threshold: 'Scholastic Silver/Gold Key' },
      { metric: 'Publication', threshold: 'Published in literary journal' },
      { metric: 'Leadership', threshold: 'Editor of school publication' },
    ],
    baseline: [
      { metric: 'Writing practice', threshold: 'Regular contributor to publication' },
      { metric: 'Reading', threshold: 'Demonstrates wide reading beyond class' },
      { metric: 'Intellectual engagement', threshold: 'Participates in discussions/debates' },
    ],
  },

  descriptionExpectations: {
    keyTerms: [
      'narrative', 'analysis', 'interpretation', 'argument', 'thesis',
      'research', 'primary sources', 'literary', 'historical', 'philosophical',
      'edited', 'published', 'submitted', 'revised',
    ],
    actionVerbs: [
      'wrote', 'edited', 'published', 'researched', 'analyzed',
      'argued', 'interpreted', 'curated', 'presented', 'critiqued',
      'founded', 'led', 'mentored', 'organized',
    ],
    quantificationExamples: [
      'Published 12 articles in school paper, 3 picked up by local news',
      'Founded literary magazine publishing 40 student writers annually',
      'Won Scholastic Gold Key for short story, Silver for poetry',
      'Researched 200+ primary sources for history thesis on civil rights',
      'Led weekly philosophy discussion group with 15 regular attendees',
    ],
    avoidTerms: [
      'love reading', 'like to write', 'interested in history',
      'participated in English class', 'enjoy literature',
    ],
  },

  genuineInterestMarkers: {
    earlySignals: [
      'Voracious reader from childhood',
      'Wrote stories/poems voluntarily',
      'Asked deep questions about history/society',
      'Kept journal or blog',
    ],
    developmentPattern: [
      'Reading became more sophisticated over time',
      'Writing improved and found voice',
      'Started pursuing publication or recognition',
      'Connected reading to understanding of world',
    ],
    matureIndicators: [
      'Has substantial body of original work',
      'Can discuss literary/historical ideas substantively',
      'Others seek out writing or analysis',
      'Has independent research or reading project',
    ],
  },

  commonMistakes: [
    {
      mistake: 'Listing reading as an activity',
      whyItHurts: 'Reading is expected for humanities. What have you DONE with it?',
      howToFix: 'Focus on writing, analysis, or projects inspired by reading.',
    },
    {
      mistake: 'School newspaper without distinction',
      whyItHurts: 'Basic participation is common. Need to show growth or achievement.',
      howToFix: 'Become editor, win awards, or highlight exceptional articles.',
    },
    {
      mistake: 'No original creative work',
      whyItHurts: 'Humanities values creation, not just consumption.',
      howToFix: 'Develop portfolio of original writing or research.',
    },
  ],
};

// ============================================================================
// PERFORMING ARTS EXPECTATIONS
// ============================================================================

export const PERFORMING_ARTS_EXPECTATIONS: FieldExpectations = {
  major: 'performing_arts',

  tierExpectations: {
    minimumTier1Count: 1,
    minimumTier2Count: 1,
    expectedActivities: [
      'Private instruction in primary instrument/discipline',
      'Ensemble or company participation',
      'Regular performance experience',
      'Competition or audition-based achievements',
    ],
    bonusActivities: [
      'All-State (top selection, not just participant)',
      'YoungArts finalist',
      'National Youth Orchestra or equivalent',
      'Pre-professional company member',
      'Professional performance credits',
      'Soloist with orchestra',
    ],
    warningSignals: [
      'Only school performances',
      'All-County without progression to higher levels',
      'No audition-based achievements',
      'Stopped private instruction',
      'Senior year sudden arts focus',
    ],
  },

  impactBenchmarks: {
    exceptional: [
      { metric: 'Recognition', threshold: 'YoungArts, national competition winner' },
      { metric: 'Level', threshold: 'National Youth Orchestra/professional company' },
      { metric: 'Performance', threshold: 'Professional credits or major venue' },
    ],
    strong: [
      { metric: 'All-State', threshold: 'Top 10 in section' },
      { metric: 'Competition', threshold: 'Regional winner or national participant' },
      { metric: 'Performance', threshold: 'Lead roles or significant solos' },
    ],
    baseline: [
      { metric: 'Training', threshold: 'Consistent private instruction 3+ years' },
      { metric: 'Ensemble', threshold: 'Honor ensemble or auditioned group' },
      { metric: 'Performance', threshold: 'Regular public performances' },
    ],
  },

  descriptionExpectations: {
    keyTerms: [
      'audition', 'repertoire', 'technique', 'ensemble', 'soloist',
      'masterclass', 'conservatory', 'competition', 'performance',
      'interpretation', 'phrasing', 'expression',
    ],
    actionVerbs: [
      'performed', 'auditioned', 'rehearsed', 'competed', 'premiered',
      'toured', 'collaborated', 'directed', 'choreographed', 'arranged',
      'led', 'soloed', 'conducted',
    ],
    quantificationExamples: [
      'Performed as soloist with 75-piece orchestra at Carnegie Hall',
      'Selected through blind audition to top 15 at All-State (of 500 auditions)',
      'Choreographed 3 original works performed to 800+ audience members',
      'Completed 500+ hours of private violin instruction over 8 years',
      'Led section of 12 musicians in state-touring youth symphony',
    ],
    avoidTerms: [
      'love music', 'play in band', 'enjoy performing',
      'take lessons', 'participate in concerts',
    ],
  },

  genuineInterestMarkers: {
    earlySignals: [
      'Started instrument/discipline young (before age 10)',
      'Consistently practiced without parent forcing',
      'Sought out additional instruction or opportunities',
      'Performed voluntarily at events',
    ],
    developmentPattern: [
      'Progressed to more advanced repertoire/roles',
      'Sought more competitive ensembles',
      'Started competing or auditioning seriously',
      'Developed artistic identity and preferences',
    ],
    matureIndicators: [
      'Has clear artistic vision and goals',
      'Can discuss technique and interpretation substantively',
      'Recognized by professional/semi-professional community',
      'Balances rigorous training with academics',
    ],
  },

  commonMistakes: [
    {
      mistake: 'Only school ensembles',
      whyItHurts: 'School band/choir is expected. Need to show pursuit beyond minimum.',
      howToFix: 'Join youth symphony, audition for All-County/All-State, compete.',
    },
    {
      mistake: 'All-County presented as major achievement',
      whyItHurts: 'All-County is baseline for serious musicians. Need All-State or higher.',
      howToFix: 'Progress to All-State or highlight specific achievements within All-County.',
    },
    {
      mistake: 'No evidence of practice/training regimen',
      whyItHurts: 'Arts schools want to see dedication to craft.',
      howToFix: 'Mention practice hours, years of instruction, repertoire mastered.',
    },
  ],
};

// ============================================================================
// LAW/POLICY EXPECTATIONS
// ============================================================================

export const LAW_POLICY_EXPECTATIONS: FieldExpectations = {
  major: 'law_policy',

  tierExpectations: {
    minimumTier1Count: 1,
    minimumTier2Count: 2,
    expectedActivities: [
      'Debate or speech competition (with advancement)',
      'Mock Trial or Model UN',
      'Student government involvement',
      'Civic engagement or political activity',
    ],
    bonusActivities: [
      'TOC qualifier (debate/speech)',
      'Mock Trial nationals',
      'Boys/Girls State delegate',
      'Political campaign work with responsibility',
      'Policy passed or significantly influenced',
      'Legal internship',
    ],
    warningSignals: [
      'Debate team member without competitive success',
      'Model UN without awards',
      'Student government without impact',
      'Senior year political awakening',
    ],
  },

  impactBenchmarks: {
    exceptional: [
      { metric: 'Debate/speech', threshold: 'TOC champion or national finalist' },
      { metric: 'Policy impact', threshold: 'Passed legislation or major policy change' },
      { metric: 'Political role', threshold: 'Significant campaign responsibility' },
    ],
    strong: [
      { metric: 'Debate/speech', threshold: 'TOC qualifier or state champion' },
      { metric: 'Mock Trial', threshold: 'State finalist or nationals' },
      { metric: 'Civic impact', threshold: 'Led successful advocacy campaign' },
    ],
    baseline: [
      { metric: 'Debate/speech', threshold: 'Regional success' },
      { metric: 'Model UN', threshold: 'Multiple awards' },
      { metric: 'Student government', threshold: 'Officer position with projects' },
    ],
  },

  descriptionExpectations: {
    keyTerms: [
      'argument', 'case', 'evidence', 'cross-examination', 'resolution',
      'policy', 'legislation', 'advocacy', 'constituent', 'coalition',
      'stakeholder', 'testimony', 'amendment', 'ballot',
    ],
    actionVerbs: [
      'argued', 'advocated', 'lobbied', 'testified', 'organized',
      'campaigned', 'negotiated', 'drafted', 'represented', 'debated',
      'led', 'mobilized', 'researched', 'presented',
    ],
    quantificationExamples: [
      'Qualified for Tournament of Champions after winning 3 invitational tournaments',
      'Led campaign collecting 2,000 signatures, resulting in new recycling policy',
      'Represented district at state Mock Trial, advancing to semifinals',
      'Organized voter registration drive signing up 500 new young voters',
      'Researched and drafted model legislation adopted by 3 states',
    ],
    avoidTerms: [
      'interested in politics', 'want to be a lawyer',
      'participated in debate', 'member of Model UN',
      'like to argue', 'follow current events',
    ],
  },

  genuineInterestMarkers: {
    earlySignals: [
      'Followed news/politics from young age',
      'Asked questions about fairness and rules',
      'Naturally argued positions',
      'Interest in how systems work',
    ],
    developmentPattern: [
      'Progressed from casual interest to formal activity',
      'Developed specific policy interests',
      'Sought increasing responsibility',
      'Connected activities to broader issues',
    ],
    matureIndicators: [
      'Can discuss policy nuances substantively',
      'Has track record of civic impact',
      'Understands multiple perspectives',
      'Others turn to for policy/political knowledge',
    ],
  },

  commonMistakes: [
    {
      mistake: 'Debate without competitive success',
      whyItHurts: 'Participation without achievement doesn\'t distinguish.',
      howToFix: 'Focus on specific wins, or highlight what you learned/contributed.',
    },
    {
      mistake: 'Model UN participation only',
      whyItHurts: 'Model UN is common. Need awards or leadership.',
      howToFix: 'Win awards, become Secretary-General, or start Model UN program.',
    },
    {
      mistake: 'Student government without concrete impact',
      whyItHurts: 'Title without action is resume padding.',
      howToFix: 'Highlight specific policies, events, or changes you drove.',
    },
  ],
};

// ============================================================================
// KNOWLEDGE BASE CONSOLIDATION
// ============================================================================

/**
 * Complete field expectations knowledge base
 */
export const FIELD_EXPECTATIONS: Record<MajorCategory, FieldExpectations> = {
  computer_science: CS_EXPECTATIONS,
  engineering: ENGINEERING_EXPECTATIONS,
  pre_med: PREMED_EXPECTATIONS,
  business_economics: BUSINESS_EXPECTATIONS,
  humanities: HUMANITIES_EXPECTATIONS,
  performing_arts: PERFORMING_ARTS_EXPECTATIONS,
  law_policy: LAW_POLICY_EXPECTATIONS,

  // Simplified entries for other majors (can be expanded)
  natural_sciences: {
    ...PREMED_EXPECTATIONS,
    major: 'natural_sciences',
    tierExpectations: {
      ...PREMED_EXPECTATIONS.tierExpectations,
      expectedActivities: [
        'Science Olympiad participation',
        'Research experience in lab',
        'Science fair participation',
        'STEM competitions (Chemistry, Physics, Biology)',
      ],
    },
  },

  visual_arts: {
    ...PERFORMING_ARTS_EXPECTATIONS,
    major: 'visual_arts',
    descriptionExpectations: {
      keyTerms: [
        'portfolio', 'medium', 'composition', 'technique', 'exhibition',
        'commission', 'critique', 'gallery', 'installation', 'series',
      ],
      actionVerbs: [
        'created', 'exhibited', 'curated', 'commissioned', 'designed',
        'illustrated', 'painted', 'sculpted', 'photographed', 'directed',
      ],
      quantificationExamples: [
        'Exhibition of 15 original oil paintings at city gallery',
        'Scholastic Gold Portfolio with 8 pieces',
        'Commissioned for 5 murals totaling 500 sq ft',
        'Photography published in 3 national magazines',
      ],
      avoidTerms: [
        'like to draw', 'creative person', 'took art class',
        'enjoy making art',
      ],
    },
  },

  social_sciences: {
    ...HUMANITIES_EXPECTATIONS,
    major: 'social_sciences',
    tierExpectations: {
      ...HUMANITIES_EXPECTATIONS.tierExpectations,
      expectedActivities: [
        'Community service with direct impact',
        'Social science research',
        'Cultural organization involvement',
        'Psychology/sociology club',
      ],
    },
  },

  architecture: {
    ...ENGINEERING_EXPECTATIONS,
    major: 'architecture',
    descriptionExpectations: {
      keyTerms: [
        'design', 'sketch', 'model', 'CAD', 'rendering',
        'spatial', 'sustainable', 'structure', 'urban', 'concept',
      ],
      actionVerbs: [
        'designed', 'modeled', 'sketched', 'rendered', 'drafted',
        'constructed', 'planned', 'visualized', 'prototyped',
      ],
      quantificationExamples: [
        'Designed 10 architectural concepts with full 3D renderings',
        'Won regional architecture competition against 50 entries',
        'Interned at architecture firm, contributed to 3 project proposals',
      ],
      avoidTerms: [
        'like buildings', 'interested in design', 'drew houses',
      ],
    },
  },

  journalism_communications: {
    ...HUMANITIES_EXPECTATIONS,
    major: 'journalism_communications',
    tierExpectations: {
      minimumTier1Count: 1,
      minimumTier2Count: 1,
      expectedActivities: [
        'School newspaper/broadcast involvement',
        'Writing for external publications',
        'Podcast, blog, or YouTube channel',
        'Debate or public speaking',
      ],
      bonusActivities: [
        'Published in major outlet (local news, national magazine)',
        'Broadcast journalism award',
        'Founded media platform with audience',
        'Scholastic journalism award',
      ],
      warningSignals: [
        'Only school newspaper basic participation',
        'No external publication or audience',
        'Media consumption without creation',
      ],
    },
  },

  education: {
    major: 'education',
    tierExpectations: {
      minimumTier1Count: 0,
      minimumTier2Count: 2,
      expectedActivities: [
        'Tutoring with significant hours',
        'Teaching assistant or mentoring role',
        'Youth program leadership',
        'Educational content creation',
      ],
      bonusActivities: [
        'Founded tutoring program with scale',
        'Curriculum developed and used by others',
        'Education research or policy work',
        'Teaching certification or training',
      ],
      warningSignals: [
        'Minimal tutoring hours',
        'No sustained teaching relationship',
        'Teaching interest only from senior year',
      ],
    },
    impactBenchmarks: {
      exceptional: [
        { metric: 'Students taught', threshold: '100+ with documented outcomes' },
        { metric: 'Program reach', threshold: 'Curriculum used by multiple schools' },
      ],
      strong: [
        { metric: 'Students taught', threshold: '50+ consistently' },
        { metric: 'Program created', threshold: 'Sustainable tutoring/mentoring program' },
      ],
      baseline: [
        { metric: 'Tutoring hours', threshold: '100+ hours' },
        { metric: 'Consistency', threshold: 'Same students over semester+' },
      ],
    },
    descriptionExpectations: {
      keyTerms: [
        'curriculum', 'pedagogy', 'learning outcomes', 'differentiated instruction',
        'assessment', 'scaffolding', 'engagement', 'comprehension',
      ],
      actionVerbs: [
        'taught', 'tutored', 'mentored', 'developed', 'assessed',
        'adapted', 'explained', 'guided', 'trained', 'facilitated',
      ],
      quantificationExamples: [
        'Tutored 30 students in algebra, average improvement of 1.5 letter grades',
        'Developed geometry curriculum used by 5 tutors serving 75 students',
        'Mentored 8 freshmen through successful transition to high school',
      ],
      avoidTerms: [
        'helped with homework', 'tutored sometimes',
        'like working with kids', 'want to teach',
      ],
    },
    genuineInterestMarkers: {
      earlySignals: [
        'Naturally explained concepts to peers',
        'Helped younger siblings/neighbors with schoolwork',
        'Interest in how people learn',
      ],
      developmentPattern: [
        'Sought formal tutoring opportunities',
        'Developed teaching techniques',
        'Took on increasing responsibility',
      ],
      matureIndicators: [
        'Students specifically request this tutor',
        'Documented student improvement',
        'Thinks about pedagogy, not just content',
      ],
    },
    commonMistakes: [
      {
        mistake: 'NHS tutoring only',
        whyItHurts: 'Minimum requirement for NHS. Need to show genuine commitment.',
        howToFix: 'Exceed requirements significantly or start own tutoring initiative.',
      },
    ],
  },

  environmental_studies: {
    ...PREMED_EXPECTATIONS,
    major: 'environmental_studies',
    tierExpectations: {
      minimumTier1Count: 0,
      minimumTier2Count: 2,
      expectedActivities: [
        'Environmental club or organization',
        'Environmental research or monitoring',
        'Sustainability advocacy',
        'Conservation volunteering',
      ],
      bonusActivities: [
        'Published environmental research',
        'Passed environmental policy',
        'Founded sustainable initiative with measurable impact',
        'Envirothon state/national placement',
      ],
      warningSignals: [
        'Generic beach cleanup participation',
        'Environmental interest only from senior year',
        'All advocacy, no science',
      ],
    },
    descriptionExpectations: {
      keyTerms: [
        'sustainability', 'conservation', 'biodiversity', 'emissions',
        'habitat', 'ecosystem', 'climate', 'renewable', 'waste reduction',
      ],
      actionVerbs: [
        'researched', 'advocated', 'monitored', 'reduced', 'conserved',
        'organized', 'measured', 'implemented', 'analyzed',
      ],
      quantificationExamples: [
        'Led campaign reducing school energy use by 20%, saving $15,000 annually',
        'Monitored water quality at 12 sites weekly for 2 years, presenting findings to city council',
        'Organized tree planting of 500 native species in local park',
      ],
      avoidTerms: [
        'care about environment', 'love nature',
        'participated in cleanup', 'like being outdoors',
      ],
    },
    genuineInterestMarkers: {
      earlySignals: [
        'Childhood interest in nature/animals',
        'Noticed environmental issues independently',
        'Made personal sustainability changes',
      ],
      developmentPattern: [
        'Moved from awareness to action',
        'Developed scientific understanding',
        'Connected local to global issues',
      ],
      matureIndicators: [
        'Can discuss environmental science substantively',
        'Has measurable environmental impact',
        'Balances advocacy with evidence-based approach',
      ],
    },
    commonMistakes: [
      {
        mistake: 'Beach cleanup as primary activity',
        whyItHurts: 'Low-impact, generic environmental participation.',
        howToFix: 'Pursue research, policy advocacy, or start initiative with measurable impact.',
      },
    ],
  },

  international_relations: {
    ...LAW_POLICY_EXPECTATIONS,
    major: 'international_relations',
    tierExpectations: {
      minimumTier1Count: 1,
      minimumTier2Count: 1,
      expectedActivities: [
        'Model UN with awards',
        'International exchange or immersion',
        'Language proficiency demonstrated',
        'Cross-cultural engagement',
      ],
      bonusActivities: [
        'Secretary-General of Model UN',
        'Study abroad or exchange program',
        'International internship or research',
        'Founded cross-cultural initiative',
      ],
      warningSignals: [
        'Model UN without distinction',
        'Only domestic activities',
        'No language beyond classroom requirement',
      ],
    },
    descriptionExpectations: {
      keyTerms: [
        'diplomacy', 'negotiation', 'resolution', 'bilateral', 'multilateral',
        'delegation', 'cultural exchange', 'global', 'policy', 'treaty',
      ],
      actionVerbs: [
        'negotiated', 'represented', 'collaborated', 'facilitated', 'bridged',
        'advocated', 'mediated', 'organized', 'led',
      ],
      quantificationExamples: [
        'Won Best Delegate at 5 Model UN conferences representing 8 different countries',
        'Organized exchange bringing 15 students from partner school in Japan',
        'Founded cross-cultural discussion forum with 200+ members from 15 countries',
      ],
      avoidTerms: [
        'interested in other cultures', 'want to travel',
        'participated in Model UN', 'learning Spanish',
      ],
    },
    genuineInterestMarkers: {
      earlySignals: [
        'Curiosity about other countries/cultures from young age',
        'Voluntary language learning',
        'Following international news',
      ],
      developmentPattern: [
        'Sought cross-cultural experiences',
        'Developed language proficiency',
        'Engaged with international issues formally',
      ],
      matureIndicators: [
        'Can discuss international issues with nuance',
        'Has meaningful cross-cultural relationships',
        'Understands multiple perspectives on global issues',
      ],
    },
    commonMistakes: [
      {
        mistake: 'Model UN without awards or leadership',
        whyItHurts: 'Participation alone is common. Need to show excellence.',
        howToFix: 'Win Best Delegate awards, become Secretary-General, or start Model UN.',
      },
    ],
  },
};

/**
 * Get field expectations for a major
 */
export function getFieldExpectations(major: MajorCategory): FieldExpectations {
  return FIELD_EXPECTATIONS[major] || FIELD_EXPECTATIONS.humanities; // Default to humanities
}

/**
 * Map free-text major to category
 */
export function normalizeMajor(majorText: string): MajorCategory {
  const text = majorText.toLowerCase().trim();

  // Business - check first to avoid 'economics' being caught by 'cs' check
  if (text.includes('business') || text.includes('economics') || text.includes('finance') ||
      text.includes('accounting') || text.includes('marketing') || text.includes('management')) {
    return 'business_economics';
  }

  // Computer Science - use word boundaries to avoid false matches like 'economics' containing 'cs'
  if (text.includes('computer') || text === 'cs' || text.includes(' cs ') ||
      text.includes(' cs') || text.startsWith('cs ') || text.includes('software') ||
      text.includes('programming') || text.includes('data science')) {
    return 'computer_science';
  }

  // Engineering
  if (text.includes('engineer') || text.includes('mechanical') || text.includes('electrical') ||
      text.includes('aerospace') || text.includes('biomedical eng') || text.includes('civil eng')) {
    return 'engineering';
  }

  // Pre-Med
  if (text.includes('pre-med') || text.includes('premed') || text.includes('medicine') ||
      text.includes('doctor') || text.includes('physician') || text.includes('nursing') ||
      text.includes('health science')) {
    return 'pre_med';
  }

  // Natural Sciences
  if (text.includes('biology') || text.includes('chemistry') || text.includes('physics') ||
      text.includes('biochem') || text.includes('neuroscience') || text.includes('science')) {
    return 'natural_sciences';
  }

  // Law/Policy
  if (text.includes('law') || text.includes('legal') || text.includes('policy') ||
      text.includes('political science') || text.includes('politics') || text.includes('government')) {
    return 'law_policy';
  }

  // Humanities
  if (text.includes('english') || text.includes('history') || text.includes('philosophy') ||
      text.includes('literature') || text.includes('classics') || text.includes('humanities')) {
    return 'humanities';
  }

  // Social Sciences
  if (text.includes('psychology') || text.includes('sociology') || text.includes('anthropology') ||
      text.includes('social') || text.includes('economics')) {
    return 'social_sciences';
  }

  // Visual Arts
  if (text.includes('art') || text.includes('design') || text.includes('graphic') ||
      text.includes('film') || text.includes('photography') || text.includes('visual')) {
    return 'visual_arts';
  }

  // Performing Arts
  if (text.includes('music') || text.includes('theater') || text.includes('theatre') ||
      text.includes('dance') || text.includes('perform')) {
    return 'performing_arts';
  }

  // Architecture
  if (text.includes('architecture') || text.includes('urban planning')) {
    return 'architecture';
  }

  // Journalism
  if (text.includes('journalism') || text.includes('communications') || text.includes('media') ||
      text.includes('broadcast') || text.includes('public relations')) {
    return 'journalism_communications';
  }

  // Education
  if (text.includes('education') || text.includes('teaching') || text.includes('pedagogy')) {
    return 'education';
  }

  // Environmental
  if (text.includes('environmental') || text.includes('sustainability') || text.includes('ecology') ||
      text.includes('climate')) {
    return 'environmental_studies';
  }

  // International Relations
  if (text.includes('international') || text.includes('global') || text.includes('foreign') ||
      text.includes('diplomacy')) {
    return 'international_relations';
  }

  // Default
  return 'humanities';
}

export const fieldSpecificExpectations = {
  FIELD_EXPECTATIONS,
  getFieldExpectations,
  normalizeMajor,
};
