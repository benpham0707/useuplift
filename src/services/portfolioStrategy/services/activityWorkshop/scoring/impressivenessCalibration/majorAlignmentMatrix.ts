/**
 * Major Alignment Matrix
 *
 * Maps 12 activity domains x 30 major categories to alignment strength.
 * Used to determine how much an activity boosts (or doesn't boost) an
 * applicant's profile relative to their intended major.
 *
 * Data source: admissions officer consensus, CDS reports, institutional priorities.
 * Cost: $0.00 (pure static data)
 */

import type { MajorCategory, MajorAlignmentEntry, AlignmentStrength } from './types';

// ============================================================================
// MAJOR CATEGORIES — 30 categories covering 42 majors
// ============================================================================

export const MAJOR_CATEGORIES: MajorCategory[] = [
  { id: 'computer_science', label: 'Computer Science', aliases: ['cs', 'comp sci', 'computing', 'computer engineering', 'software engineering', 'informatics'] },
  { id: 'electrical_engineering', label: 'Electrical Engineering', aliases: ['ee', 'ece', 'electrical and computer engineering', 'electronics'] },
  { id: 'mechanical_engineering', label: 'Mechanical Engineering', aliases: ['me', 'mech e', 'mech eng', 'mechanical'] },
  { id: 'civil_engineering', label: 'Civil Engineering', aliases: ['ce', 'civil eng', 'structural engineering', 'civil'] },
  { id: 'aerospace_engineering', label: 'Aerospace Engineering', aliases: ['aero', 'astronautical', 'aeronautics', 'aerospace'] },
  { id: 'biomedical_engineering', label: 'Biomedical Engineering', aliases: ['bme', 'biomed', 'bioengineering', 'biomedical'] },
  { id: 'chemical_engineering', label: 'Chemical Engineering', aliases: ['cheme', 'chem e', 'chemical eng'] },
  { id: 'biology', label: 'Biology', aliases: ['bio', 'biological sciences', 'life sciences', 'molecular biology', 'zoology', 'marine biology'] },
  { id: 'chemistry', label: 'Chemistry', aliases: ['chem', 'biochemistry', 'chemical sciences'] },
  { id: 'physics', label: 'Physics', aliases: ['phys', 'applied physics', 'astrophysics', 'biophysics'] },
  { id: 'mathematics', label: 'Mathematics', aliases: ['math', 'maths', 'applied math', 'statistics', 'actuarial science', 'data science'] },
  { id: 'environmental_science', label: 'Environmental Science', aliases: ['env sci', 'environmental studies', 'sustainability', 'ecology', 'earth science', 'geology'] },
  { id: 'psychology', label: 'Psychology', aliases: ['psych', 'behavioral science', 'cognitive science'] },
  { id: 'neuroscience', label: 'Neuroscience', aliases: ['neuro', 'cognitive neuroscience', 'behavioral neuroscience'] },
  { id: 'premed', label: 'Pre-Med/Health Sciences', aliases: ['pre-med', 'pre med', 'premed', 'health sciences', 'public health', 'nursing', 'kinesiology', 'pre-dental', 'pre-vet'] },
  { id: 'business_economics', label: 'Business/Economics', aliases: ['business', 'economics', 'econ', 'management', 'marketing', 'accounting', 'business administration'] },
  { id: 'finance', label: 'Finance', aliases: ['fin', 'financial engineering', 'quantitative finance', 'banking'] },
  { id: 'political_science', label: 'Political Science', aliases: ['poli sci', 'politics', 'government', 'public policy', 'public administration'] },
  { id: 'international_relations', label: 'International Relations', aliases: ['ir', 'intl relations', 'global studies', 'foreign affairs', 'diplomacy', 'international affairs'] },
  { id: 'english_creative_writing', label: 'English/Creative Writing', aliases: ['english', 'creative writing', 'english literature', 'comparative literature', 'rhetoric', 'writing'] },
  { id: 'history', label: 'History', aliases: ['hist', 'art history', 'classical studies', 'medieval studies'] },
  { id: 'philosophy', label: 'Philosophy', aliases: ['phil', 'logic', 'ethics', 'religious studies', 'theology'] },
  { id: 'sociology', label: 'Sociology', aliases: ['soc', 'social sciences', 'social work', 'urban studies'] },
  { id: 'anthropology', label: 'Anthropology', aliases: ['anthro', 'cultural studies', 'archaeology'] },
  { id: 'communications_journalism', label: 'Communications/Journalism', aliases: ['comm', 'communications', 'journalism', 'media studies', 'public relations', 'broadcast journalism'] },
  { id: 'education', label: 'Education', aliases: ['ed', 'teaching', 'educational studies', 'curriculum and instruction'] },
  { id: 'music', label: 'Music', aliases: ['music performance', 'music composition', 'music education', 'music theory', 'musicology'] },
  { id: 'theater_film', label: 'Theater/Film', aliases: ['theater', 'theatre', 'film', 'cinema', 'drama', 'film production', 'screenwriting', 'acting'] },
  { id: 'visual_arts', label: 'Visual Arts', aliases: ['art', 'fine arts', 'studio art', 'graphic design', 'illustration', 'painting', 'sculpture', 'photography'] },
  { id: 'architecture', label: 'Architecture', aliases: ['arch', 'architectural design', 'urban planning', 'landscape architecture'] },
];

// ============================================================================
// ALIGNMENT MATRIX — Only non-unrelated entries (unrelated is the default)
// ============================================================================

export const ALIGNMENT_MATRIX: MajorAlignmentEntry[] = [
  // ── stem_research ──────────────────────────────────────────────────────
  { domainId: 'stem_research', majorCategory: 'computer_science', alignment: 'strong', rationale: 'Research methodology transfers; CS research (ML, systems, HCI) is directly relevant', boostFactor: 0.6, strongSubActivities: ['machine learning research', 'HCI studies', 'algorithm research', 'computational biology'] },
  { domainId: 'stem_research', majorCategory: 'electrical_engineering', alignment: 'strong', rationale: 'Lab research in circuits, signal processing, or embedded systems directly applies', boostFactor: 0.6, strongSubActivities: ['circuits research', 'signal processing', 'semiconductor research'] },
  { domainId: 'stem_research', majorCategory: 'mechanical_engineering', alignment: 'moderate', rationale: 'Research skills transfer; materials/fluids research is directly relevant', boostFactor: 0.35, strongSubActivities: ['materials science research', 'fluid dynamics research'] },
  { domainId: 'stem_research', majorCategory: 'civil_engineering', alignment: 'moderate', rationale: 'Structural or environmental engineering research shows relevant aptitude', boostFactor: 0.3, strongSubActivities: ['structural analysis', 'environmental engineering'] },
  { domainId: 'stem_research', majorCategory: 'aerospace_engineering', alignment: 'strong', rationale: 'Physics/propulsion research directly supports aerospace; NASA programs signal commitment', boostFactor: 0.6, strongSubActivities: ['propulsion research', 'aerodynamics', 'NASA internship'] },
  { domainId: 'stem_research', majorCategory: 'biomedical_engineering', alignment: 'strong', rationale: 'Interdisciplinary bio/engineering research is core to BME identity', boostFactor: 0.7, strongSubActivities: ['biomedical device research', 'tissue engineering', 'biosensors'] },
  { domainId: 'stem_research', majorCategory: 'chemical_engineering', alignment: 'strong', rationale: 'Chemistry/materials lab research directly relevant to ChemE fundamentals', boostFactor: 0.6, strongSubActivities: ['catalysis research', 'polymer science', 'reaction engineering'] },
  { domainId: 'stem_research', majorCategory: 'biology', alignment: 'critical', rationale: 'Research IS biology at the college level; published work is the gold standard for bio applicants', boostFactor: 0.9, strongSubActivities: ['lab research', 'field ecology', 'genomics', 'published paper', 'science fair'] },
  { domainId: 'stem_research', majorCategory: 'chemistry', alignment: 'critical', rationale: 'Lab research demonstrates the hands-on experimental skills chemistry demands', boostFactor: 0.9, strongSubActivities: ['synthesis research', 'analytical chemistry', 'published paper'] },
  { domainId: 'stem_research', majorCategory: 'physics', alignment: 'critical', rationale: 'Physics research (especially theoretical or experimental) is the strongest possible signal', boostFactor: 0.9, strongSubActivities: ['particle physics', 'astrophysics research', 'quantum mechanics', 'published paper'] },
  { domainId: 'stem_research', majorCategory: 'mathematics', alignment: 'strong', rationale: 'Math research is rare in HS but signals extraordinary aptitude', boostFactor: 0.7, strongSubActivities: ['number theory', 'combinatorics', 'published proof'] },
  { domainId: 'stem_research', majorCategory: 'environmental_science', alignment: 'strong', rationale: 'Environmental field research or climate studies directly align', boostFactor: 0.6, strongSubActivities: ['field ecology', 'water quality analysis', 'climate data research'] },
  { domainId: 'stem_research', majorCategory: 'neuroscience', alignment: 'critical', rationale: 'Neuroscience is fundamentally a research discipline; lab work is the entry point', boostFactor: 0.85, strongSubActivities: ['neural imaging', 'behavioral experiments', 'cognitive studies'] },
  { domainId: 'stem_research', majorCategory: 'premed', alignment: 'strong', rationale: 'Clinical or biomedical research demonstrates scientific rigor valued in med school', boostFactor: 0.5, strongSubActivities: ['clinical research', 'public health study', 'epidemiology'] },
  { domainId: 'stem_research', majorCategory: 'psychology', alignment: 'moderate', rationale: 'Psychology research (behavioral studies, surveys) shows methodological aptitude', boostFactor: 0.4, strongSubActivities: ['behavioral research', 'survey design', 'cognitive experiments'] },

  // ── stem_competition ───────────────────────────────────────────────────
  { domainId: 'stem_competition', majorCategory: 'computer_science', alignment: 'strong', rationale: 'USACO, hackathons, CTFs directly test CS problem-solving under pressure', boostFactor: 0.7, strongSubActivities: ['USACO', 'hackathon', 'CTF', 'competitive programming'] },
  { domainId: 'stem_competition', majorCategory: 'mathematics', alignment: 'critical', rationale: 'AMC/AIME/USAMO is THE signal for math aptitude; nothing else comes close', boostFactor: 0.9, strongSubActivities: ['AMC', 'AIME', 'USAMO', 'MATHCOUNTS', 'Putnam'] },
  { domainId: 'stem_competition', majorCategory: 'physics', alignment: 'critical', rationale: 'Physics Olympiad (USAPhO, IPhO) directly validates physics mastery', boostFactor: 0.9, strongSubActivities: ['USAPhO', 'IPhO', 'Science Olympiad'] },
  { domainId: 'stem_competition', majorCategory: 'chemistry', alignment: 'strong', rationale: 'Chemistry Olympiad and Science Olympiad chemistry events show deep content mastery', boostFactor: 0.7, strongSubActivities: ['USNCO', 'Science Olympiad', 'IChO'] },
  { domainId: 'stem_competition', majorCategory: 'biology', alignment: 'strong', rationale: 'USABO and Science Olympiad biology events demonstrate advanced bio knowledge', boostFactor: 0.7, strongSubActivities: ['USABO', 'Science Olympiad', 'IBO'] },
  { domainId: 'stem_competition', majorCategory: 'electrical_engineering', alignment: 'moderate', rationale: 'Robotics and electronics competitions show relevant engineering skills', boostFactor: 0.4, strongSubActivities: ['robotics competition', 'Science Olympiad'] },
  { domainId: 'stem_competition', majorCategory: 'mechanical_engineering', alignment: 'moderate', rationale: 'Robotics, bridge-building, and engineering design competitions show ME aptitude', boostFactor: 0.4, strongSubActivities: ['FIRST Robotics', 'engineering design competitions'] },
  { domainId: 'stem_competition', majorCategory: 'aerospace_engineering', alignment: 'moderate', rationale: 'Rocketry and physics competitions show relevant analytical skills', boostFactor: 0.35, strongSubActivities: ['Team America Rocketry', 'physics competition'] },
  { domainId: 'stem_competition', majorCategory: 'finance', alignment: 'moderate', rationale: 'Math competition success shows quantitative aptitude valued in quant finance', boostFactor: 0.35, strongSubActivities: ['math competition', 'economics competition'] },

  // ── coding_engineering ─────────────────────────────────────────────────
  { domainId: 'coding_engineering', majorCategory: 'computer_science', alignment: 'critical', rationale: 'Building real software is the most direct demonstration of CS aptitude', boostFactor: 0.9, strongSubActivities: ['deployed app', 'open source contribution', 'full-stack project', 'systems programming'] },
  { domainId: 'coding_engineering', majorCategory: 'electrical_engineering', alignment: 'strong', rationale: 'Embedded systems, hardware projects, and IoT development bridge CS and EE', boostFactor: 0.6, strongSubActivities: ['embedded systems', 'Arduino/Raspberry Pi', 'IoT', 'FPGA programming'] },
  { domainId: 'coding_engineering', majorCategory: 'mechanical_engineering', alignment: 'moderate', rationale: 'CAD, robotics software, and automation show relevant engineering computation', boostFactor: 0.35, strongSubActivities: ['CAD projects', 'robotics programming', '3D printing'] },
  { domainId: 'coding_engineering', majorCategory: 'aerospace_engineering', alignment: 'moderate', rationale: 'Flight simulation, drone programming show applied aerospace computing', boostFactor: 0.35, strongSubActivities: ['drone programming', 'flight simulation', 'satellite software'] },
  { domainId: 'coding_engineering', majorCategory: 'biomedical_engineering', alignment: 'moderate', rationale: 'Health tech apps, bioinformatics tools show interdisciplinary BME aptitude', boostFactor: 0.35, strongSubActivities: ['health tech app', 'bioinformatics', 'medical device software'] },
  { domainId: 'coding_engineering', majorCategory: 'mathematics', alignment: 'moderate', rationale: 'Computational math, algorithm implementation show applied math skills', boostFactor: 0.3, strongSubActivities: ['algorithm implementation', 'data visualization', 'computational modeling'] },
  { domainId: 'coding_engineering', majorCategory: 'finance', alignment: 'moderate', rationale: 'Fintech projects, trading bots show quant finance aptitude', boostFactor: 0.35, strongSubActivities: ['trading algorithm', 'fintech app', 'financial modeling'] },
  { domainId: 'coding_engineering', majorCategory: 'architecture', alignment: 'complementary', rationale: 'Computational design and parametric modeling are growing in architecture', boostFactor: 0.15, strongSubActivities: ['parametric design', 'computational architecture'] },

  // ── debate_speech ──────────────────────────────────────────────────────
  { domainId: 'debate_speech', majorCategory: 'political_science', alignment: 'critical', rationale: 'Policy debate IS applied political science; argumentation and evidence are core skills', boostFactor: 0.8, strongSubActivities: ['policy debate', 'Model UN', 'congressional debate'] },
  { domainId: 'debate_speech', majorCategory: 'international_relations', alignment: 'strong', rationale: 'Model UN and international extemp directly engage IR topics and diplomacy', boostFactor: 0.6, strongSubActivities: ['Model UN', 'international extemporaneous', 'world affairs forum'] },
  { domainId: 'debate_speech', majorCategory: 'english_creative_writing', alignment: 'strong', rationale: 'Oratory, original oratory, and dramatic interp demonstrate language mastery', boostFactor: 0.5, strongSubActivities: ['original oratory', 'dramatic interpretation', 'poetry'] },
  { domainId: 'debate_speech', majorCategory: 'philosophy', alignment: 'strong', rationale: 'Lincoln-Douglas debate is explicitly about philosophical frameworks and ethics', boostFactor: 0.6, strongSubActivities: ['Lincoln-Douglas debate', 'ethics bowl'] },
  { domainId: 'debate_speech', majorCategory: 'communications_journalism', alignment: 'strong', rationale: 'Public speaking, persuasion, and media analysis are core comm skills', boostFactor: 0.55, strongSubActivities: ['public forum debate', 'extemporaneous speaking', 'broadcasting'] },
  { domainId: 'debate_speech', majorCategory: 'history', alignment: 'moderate', rationale: 'Evidence-based argumentation and historical analysis are shared skills', boostFactor: 0.3, strongSubActivities: ['National History Bee', 'historical analysis'] },
  { domainId: 'debate_speech', majorCategory: 'sociology', alignment: 'moderate', rationale: 'Social policy debate topics require sociological analysis', boostFactor: 0.3, strongSubActivities: ['policy debate on social issues'] },
  { domainId: 'debate_speech', majorCategory: 'business_economics', alignment: 'moderate', rationale: 'Persuasion, presentation, and economic policy debate show business communication', boostFactor: 0.3, strongSubActivities: ['DECA', 'economics debate', 'business presentations'] },
  { domainId: 'debate_speech', majorCategory: 'premed', alignment: 'complementary', rationale: 'Communication skills valued in medicine but not a core differentiator', boostFactor: 0.1, strongSubActivities: ['bioethics debate'] },

  // ── performing_arts ────────────────────────────────────────────────────
  { domainId: 'performing_arts', majorCategory: 'music', alignment: 'critical', rationale: 'Performance, composition, and ensemble leadership ARE the major', boostFactor: 0.9, strongSubActivities: ['solo recital', 'composition', 'all-state ensemble', 'concerto competition'] },
  { domainId: 'performing_arts', majorCategory: 'theater_film', alignment: 'critical', rationale: 'Acting, directing, and production directly demonstrate theater aptitude', boostFactor: 0.9, strongSubActivities: ['lead role', 'directing', 'film production', 'playwriting'] },
  { domainId: 'performing_arts', majorCategory: 'communications_journalism', alignment: 'moderate', rationale: 'Performance skills transfer to broadcasting and media presentation', boostFactor: 0.3, strongSubActivities: ['broadcasting', 'media production', 'podcast'] },
  { domainId: 'performing_arts', majorCategory: 'english_creative_writing', alignment: 'moderate', rationale: 'Dramatic writing, performance poetry, and storytelling overlap', boostFactor: 0.3, strongSubActivities: ['playwriting', 'spoken word', 'creative performance'] },
  { domainId: 'performing_arts', majorCategory: 'education', alignment: 'complementary', rationale: 'Performance and presentation skills valued in teaching but not a core signal', boostFactor: 0.15, strongSubActivities: ['teaching artist', 'community performance'] },

  // ── athletics ──────────────────────────────────────────────────────────
  { domainId: 'athletics', majorCategory: 'premed', alignment: 'complementary', rationale: 'Athletic discipline and body awareness complement health sciences', boostFactor: 0.1, strongSubActivities: ['sports medicine interest', 'athletic training'] },
  { domainId: 'athletics', majorCategory: 'business_economics', alignment: 'complementary', rationale: 'Team sports show teamwork and leadership valued in business', boostFactor: 0.1, strongSubActivities: ['team captain', 'sports management'] },
  { domainId: 'athletics', majorCategory: 'psychology', alignment: 'complementary', rationale: 'Sport psychology and team dynamics provide experiential learning', boostFactor: 0.1, strongSubActivities: ['sport psychology interest', 'coaching'] },
  { domainId: 'athletics', majorCategory: 'communications_journalism', alignment: 'complementary', rationale: 'Sports journalism and broadcasting are established career paths', boostFactor: 0.1, strongSubActivities: ['sports broadcasting', 'sports journalism'] },
  { domainId: 'athletics', majorCategory: 'education', alignment: 'complementary', rationale: 'Coaching and physical education are direct career applications', boostFactor: 0.15, strongSubActivities: ['coaching', 'youth sports instruction'] },

  // ── community_service ──────────────────────────────────────────────────
  { domainId: 'community_service', majorCategory: 'premed', alignment: 'strong', rationale: 'Clinical volunteering and health equity work are expected for strong med school apps', boostFactor: 0.5, strongSubActivities: ['hospital volunteering', 'health clinic', 'public health initiative', 'health equity'] },
  { domainId: 'community_service', majorCategory: 'education', alignment: 'strong', rationale: 'Tutoring, mentoring, and educational nonprofits directly demonstrate teaching commitment', boostFactor: 0.6, strongSubActivities: ['tutoring program', 'mentoring', 'educational nonprofit', 'literacy initiative'] },
  { domainId: 'community_service', majorCategory: 'sociology', alignment: 'strong', rationale: 'Community organizing and social justice work are applied sociology', boostFactor: 0.5, strongSubActivities: ['community organizing', 'social justice initiative', 'advocacy'] },
  { domainId: 'community_service', majorCategory: 'political_science', alignment: 'moderate', rationale: 'Civic engagement and policy advocacy show applied political interest', boostFactor: 0.35, strongSubActivities: ['voter registration', 'policy advocacy', 'civic engagement'] },
  { domainId: 'community_service', majorCategory: 'psychology', alignment: 'moderate', rationale: 'Crisis counseling, peer support, and mental health advocacy show psych application', boostFactor: 0.3, strongSubActivities: ['crisis hotline', 'peer counseling', 'mental health advocacy'] },
  { domainId: 'community_service', majorCategory: 'environmental_science', alignment: 'moderate', rationale: 'Environmental cleanup and conservation volunteering show applied env commitment', boostFactor: 0.35, strongSubActivities: ['conservation', 'beach cleanup', 'environmental advocacy', 'habitat restoration'] },
  { domainId: 'community_service', majorCategory: 'anthropology', alignment: 'moderate', rationale: 'Cross-cultural service and community ethnography demonstrate anthropological lens', boostFactor: 0.3, strongSubActivities: ['cross-cultural service', 'immigrant services', 'cultural preservation'] },
  { domainId: 'community_service', majorCategory: 'international_relations', alignment: 'moderate', rationale: 'International service and development work show global engagement', boostFactor: 0.3, strongSubActivities: ['international service trip', 'refugee assistance', 'global health'] },

  // ── entrepreneurship ───────────────────────────────────────────────────
  { domainId: 'entrepreneurship', majorCategory: 'business_economics', alignment: 'critical', rationale: 'Starting and running a real business is the strongest possible business school signal', boostFactor: 0.85, strongSubActivities: ['revenue-generating business', 'market validation', 'investor pitch'] },
  { domainId: 'entrepreneurship', majorCategory: 'finance', alignment: 'strong', rationale: 'Financial management, fundraising, and unit economics show finance aptitude', boostFactor: 0.5, strongSubActivities: ['financial modeling', 'fundraising', 'revenue management'] },
  { domainId: 'entrepreneurship', majorCategory: 'computer_science', alignment: 'moderate', rationale: 'Tech startups demonstrate applied CS but CS programs want pure technical depth', boostFactor: 0.35, strongSubActivities: ['tech startup', 'SaaS product', 'app development'] },
  { domainId: 'entrepreneurship', majorCategory: 'communications_journalism', alignment: 'moderate', rationale: 'Marketing, brand building, and content creation show communication skills', boostFactor: 0.3, strongSubActivities: ['social media business', 'content creation', 'marketing'] },
  { domainId: 'entrepreneurship', majorCategory: 'visual_arts', alignment: 'complementary', rationale: 'Creative business (Etsy, design freelancing) shows applied artistic skill', boostFactor: 0.15, strongSubActivities: ['design business', 'art sales', 'creative freelancing'] },

  // ── work_employment ────────────────────────────────────────────────────
  { domainId: 'work_employment', majorCategory: 'business_economics', alignment: 'moderate', rationale: 'Real-world employment, especially with management, shows business understanding', boostFactor: 0.35, strongSubActivities: ['management role', 'business operations', 'sales performance'] },
  { domainId: 'work_employment', majorCategory: 'finance', alignment: 'moderate', rationale: 'Financial services work or P&L responsibility demonstrates finance aptitude', boostFactor: 0.3, strongSubActivities: ['financial services job', 'accounting work', 'budget management'] },
  { domainId: 'work_employment', majorCategory: 'computer_science', alignment: 'moderate', rationale: 'Software engineering internships or IT roles show professional CS skills', boostFactor: 0.4, strongSubActivities: ['software engineering internship', 'IT role', 'tech company job'] },
  { domainId: 'work_employment', majorCategory: 'premed', alignment: 'complementary', rationale: 'Healthcare employment (CNA, medical assistant) provides clinical exposure', boostFactor: 0.2, strongSubActivities: ['CNA', 'medical assistant', 'pharmacy tech', 'hospital job'] },
  { domainId: 'work_employment', majorCategory: 'education', alignment: 'moderate', rationale: 'Teaching, tutoring, or childcare employment shows education commitment', boostFactor: 0.35, strongSubActivities: ['teaching assistant', 'tutoring company', 'childcare'] },
  { domainId: 'work_employment', majorCategory: 'communications_journalism', alignment: 'moderate', rationale: 'Media, PR, or marketing employment shows professional comm skills', boostFactor: 0.3, strongSubActivities: ['media internship', 'PR firm', 'marketing role'] },
  { domainId: 'work_employment', majorCategory: 'architecture', alignment: 'moderate', rationale: 'Architecture firm internship or construction experience shows field commitment', boostFactor: 0.35, strongSubActivities: ['architecture internship', 'construction management'] },

  // ── leadership_government ──────────────────────────────────────────────
  { domainId: 'leadership_government', majorCategory: 'political_science', alignment: 'critical', rationale: 'Student government and political campaigns are applied political science', boostFactor: 0.8, strongSubActivities: ['student body president', 'political campaign', 'youth in government'] },
  { domainId: 'leadership_government', majorCategory: 'international_relations', alignment: 'strong', rationale: 'International student organizations and diplomatic simulations apply IR concepts', boostFactor: 0.5, strongSubActivities: ['international student org', 'diplomatic simulation'] },
  { domainId: 'leadership_government', majorCategory: 'business_economics', alignment: 'moderate', rationale: 'Organizational leadership demonstrates management and operational skills', boostFactor: 0.35, strongSubActivities: ['club president', 'organizational leadership'] },
  { domainId: 'leadership_government', majorCategory: 'communications_journalism', alignment: 'moderate', rationale: 'Public-facing leadership roles develop communication and media skills', boostFactor: 0.3, strongSubActivities: ['spokesperson role', 'school media'] },
  { domainId: 'leadership_government', majorCategory: 'education', alignment: 'moderate', rationale: 'Mentorship and student-led educational initiatives show teaching aptitude', boostFactor: 0.3, strongSubActivities: ['peer mentoring program', 'student-led workshops'] },
  { domainId: 'leadership_government', majorCategory: 'sociology', alignment: 'moderate', rationale: 'Community governance and social advocacy demonstrate sociological engagement', boostFactor: 0.3, strongSubActivities: ['community board', 'social advocacy', 'diversity committee'] },

  // ── medical_health ─────────────────────────────────────────────────────
  { domainId: 'medical_health', majorCategory: 'premed', alignment: 'critical', rationale: 'Clinical shadowing, EMT certification, and health research are THE pre-med signals', boostFactor: 0.9, strongSubActivities: ['EMT certification', 'clinical shadowing', 'hospital research', 'patient care'] },
  { domainId: 'medical_health', majorCategory: 'neuroscience', alignment: 'strong', rationale: 'Clinical neurology exposure and brain research bridge medicine and neuroscience', boostFactor: 0.6, strongSubActivities: ['neurology shadowing', 'brain injury research'] },
  { domainId: 'medical_health', majorCategory: 'biology', alignment: 'strong', rationale: 'Medical research and clinical biology demonstrate applied life science skills', boostFactor: 0.5, strongSubActivities: ['biomedical research', 'clinical lab work'] },
  { domainId: 'medical_health', majorCategory: 'biomedical_engineering', alignment: 'strong', rationale: 'Medical device work and clinical engineering bridge healthcare and engineering', boostFactor: 0.6, strongSubActivities: ['medical device project', 'clinical engineering'] },
  { domainId: 'medical_health', majorCategory: 'chemistry', alignment: 'moderate', rationale: 'Pharmaceutical or clinical chemistry work shows applied chem in healthcare', boostFactor: 0.3, strongSubActivities: ['pharmacy work', 'clinical chemistry'] },
  { domainId: 'medical_health', majorCategory: 'psychology', alignment: 'moderate', rationale: 'Mental health work, crisis counseling show clinical psychology interest', boostFactor: 0.35, strongSubActivities: ['crisis counseling', 'mental health clinic', 'behavioral health'] },
  { domainId: 'medical_health', majorCategory: 'education', alignment: 'complementary', rationale: 'Health education and wellness programs combine health and teaching', boostFactor: 0.15, strongSubActivities: ['health education', 'CPR instruction'] },

  // ── arts_creative ──────────────────────────────────────────────────────
  { domainId: 'arts_creative', majorCategory: 'visual_arts', alignment: 'critical', rationale: 'Portfolio work, exhibitions, and awards ARE the application for art programs', boostFactor: 0.9, strongSubActivities: ['portfolio', 'exhibition', 'art award', 'commissioned work'] },
  { domainId: 'arts_creative', majorCategory: 'architecture', alignment: 'strong', rationale: 'Design thinking, spatial reasoning, and portfolio work are core architecture skills', boostFactor: 0.6, strongSubActivities: ['architectural drawing', 'design portfolio', 'spatial design'] },
  { domainId: 'arts_creative', majorCategory: 'theater_film', alignment: 'strong', rationale: 'Set design, costume design, and visual storytelling bridge fine arts and theater', boostFactor: 0.5, strongSubActivities: ['set design', 'costume design', 'visual storytelling'] },
  { domainId: 'arts_creative', majorCategory: 'english_creative_writing', alignment: 'moderate', rationale: 'Illustration, graphic novels, and visual narrative combine art and writing', boostFactor: 0.3, strongSubActivities: ['graphic novel', 'illustrated book', 'visual narrative'] },
  { domainId: 'arts_creative', majorCategory: 'communications_journalism', alignment: 'moderate', rationale: 'Graphic design and media art demonstrate visual communication skills', boostFactor: 0.3, strongSubActivities: ['graphic design', 'publication design', 'infographics'] },
];

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/** Index of major categories by lowercase alias for O(1) resolution */
const MAJOR_INDEX: Map<string, string> = new Map();
for (const cat of MAJOR_CATEGORIES) {
  MAJOR_INDEX.set(cat.id.toLowerCase(), cat.id);
  MAJOR_INDEX.set(cat.label.toLowerCase(), cat.id);
  for (const alias of cat.aliases) {
    MAJOR_INDEX.set(alias.toLowerCase(), cat.id);
  }
}

/** Index alignment matrix by "domainId::majorCategory" for O(1) lookup */
const ALIGNMENT_INDEX: Map<string, MajorAlignmentEntry> = new Map();
for (const entry of ALIGNMENT_MATRIX) {
  ALIGNMENT_INDEX.set(`${entry.domainId}::${entry.majorCategory}`, entry);
}

/** Default entry for unrelated domain-major combinations */
const DEFAULT_UNRELATED: Omit<MajorAlignmentEntry, 'domainId' | 'majorCategory'> = {
  alignment: 'unrelated' as AlignmentStrength,
  rationale: 'No meaningful connection between this activity domain and intended major',
  boostFactor: 0,
  strongSubActivities: [],
};

/**
 * Resolve free-text major string to a category ID.
 * Returns null if no match found.
 */
export function resolveMajor(freeTextMajor: string): string | null {
  const normalized = freeTextMajor.trim().toLowerCase();

  // 1. Exact match from index (safe — includes IDs, labels, and all aliases)
  const direct = MAJOR_INDEX.get(normalized);
  if (direct) return direct;

  // 2. Label substring matching (labels are long enough to be safe)
  for (const cat of MAJOR_CATEGORIES) {
    if (normalized.includes(cat.label.toLowerCase())) return cat.id;
  }

  // 3. Alias matching with word boundaries + minimum length guard
  for (const cat of MAJOR_CATEGORIES) {
    for (const alias of cat.aliases) {
      // Skip aliases shorter than 4 characters to avoid false substring matches
      // (e.g., "me", "ee", "ce", "ed", "ir", "soc", "fin", "bio", "art")
      if (alias.length < 4) continue;
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(normalized)) return cat.id;
    }
  }

  return null;
}

/**
 * Get alignment entry for a domain-major combination.
 * Returns a default 'unrelated' entry if no specific mapping exists.
 */
export function getAlignment(domainId: string, majorCategory: string): MajorAlignmentEntry {
  const entry = ALIGNMENT_INDEX.get(`${domainId}::${majorCategory}`);
  if (entry) return entry;

  return {
    domainId,
    majorCategory,
    ...DEFAULT_UNRELATED,
  };
}

/**
 * Resolve a free-text major and get alignment.
 * Returns null if the major can't be resolved.
 */
export function getAlignmentForMajor(
  domainId: string,
  freeTextMajor: string
): MajorAlignmentEntry | null {
  const majorId = resolveMajor(freeTextMajor);
  if (!majorId) return null;
  return getAlignment(domainId, majorId);
}
