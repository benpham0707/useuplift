/**
 * Major-Activity Alignment Matrix
 *
 * Maps extracurricular activities to intended majors for coherence scoring.
 * Used to:
 * 1. Detect "spike" profiles (deep focus in one area)
 * 2. Score narrative coherence
 * 3. Identify red flags (major-activity mismatch)
 * 4. Suggest complementary activities
 *
 * Based on admissions research: A coherent profile with a "spike" outperforms
 * a scattered profile with many Tier 2 activities.
 *
 * Sources:
 * - MIT Admissions blogs on evaluation process
 * - Stanford admissions officer interviews
 * - Harvard Crimson admissions data analyses
 * - Expert counselor publications (Harberson, Montoya, etc.)
 */

// ============================================================================
// MAJOR CATEGORIES
// ============================================================================

export type MajorCategory =
  | 'engineering'
  | 'computer_science'
  | 'natural_sciences'
  | 'pre_med'
  | 'business_economics'
  | 'law_policy'
  | 'humanities'
  | 'social_sciences'
  | 'visual_arts'
  | 'performing_arts'
  | 'architecture'
  | 'journalism_communications'
  | 'education'
  | 'environmental_studies'
  | 'international_relations';

// ============================================================================
// ACTIVITY CATEGORIES FOR ALIGNMENT
// ============================================================================

export type ActivityCategory =
  | 'stem_research'
  | 'stem_competitions'
  | 'entrepreneurship'
  | 'nonprofit_service'
  | 'writing_journalism'
  | 'debate_speech'
  | 'student_government'
  | 'performing_arts_music'
  | 'performing_arts_theater'
  | 'performing_arts_dance'
  | 'visual_arts'
  | 'athletics'
  | 'academic_teams'
  | 'stem_clubs'
  | 'cultural_identity'
  | 'work_experience'
  | 'internships';

// ============================================================================
// ALIGNMENT SCORES
// ============================================================================

/**
 * Alignment score interpretation:
 * 5 = Perfect alignment - This activity directly demonstrates interest/skill in major
 * 4 = Strong alignment - Highly relevant, shows related skills
 * 3 = Moderate alignment - Relevant transferable skills
 * 2 = Weak alignment - Some connection but not obvious
 * 1 = Minimal alignment - Little connection to major
 * 0 = No alignment / Potential mismatch
 */

export const MAJOR_ACTIVITY_ALIGNMENT_MATRIX: Record<MajorCategory, Record<ActivityCategory, number>> = {
  // -------------------------------------------------------------------------
  // ENGINEERING
  // -------------------------------------------------------------------------
  engineering: {
    stem_research: 5,
    stem_competitions: 5, // Math Olympiad, Science Olympiad, Physics Olympiad
    entrepreneurship: 4, // Shows application of technical skills
    nonprofit_service: 2,
    writing_journalism: 2,
    debate_speech: 3, // Communication skills valuable
    student_government: 2,
    performing_arts_music: 3, // Pattern recognition, discipline
    performing_arts_theater: 1,
    performing_arts_dance: 1,
    visual_arts: 3, // Design thinking
    athletics: 2,
    academic_teams: 4, // Science Olympiad, robotics
    stem_clubs: 5,
    cultural_identity: 2,
    work_experience: 3, // Technical work experience
    internships: 5, // Engineering internships
  },

  // -------------------------------------------------------------------------
  // COMPUTER SCIENCE
  // -------------------------------------------------------------------------
  computer_science: {
    stem_research: 5,
    stem_competitions: 5, // USACO, hackathons, CTFs
    entrepreneurship: 5, // Tech startups highly aligned
    nonprofit_service: 2,
    writing_journalism: 2,
    debate_speech: 2,
    student_government: 2,
    performing_arts_music: 3, // Mathematical patterns
    performing_arts_theater: 1,
    performing_arts_dance: 1,
    visual_arts: 3, // UI/UX, game design
    athletics: 2,
    academic_teams: 4,
    stem_clubs: 5,
    cultural_identity: 2,
    work_experience: 3,
    internships: 5, // Tech internships
  },

  // -------------------------------------------------------------------------
  // NATURAL SCIENCES (Biology, Chemistry, Physics)
  // -------------------------------------------------------------------------
  natural_sciences: {
    stem_research: 5,
    stem_competitions: 5, // Science Olympiad, Chemistry Olympiad
    entrepreneurship: 3,
    nonprofit_service: 3, // Environmental, health-related
    writing_journalism: 2,
    debate_speech: 2,
    student_government: 2,
    performing_arts_music: 2,
    performing_arts_theater: 1,
    performing_arts_dance: 1,
    visual_arts: 2,
    athletics: 2,
    academic_teams: 4, // Science Bowl, Science Olympiad
    stem_clubs: 5,
    cultural_identity: 2,
    work_experience: 3,
    internships: 5, // Research internships
  },

  // -------------------------------------------------------------------------
  // PRE-MED / HEALTH SCIENCES
  // -------------------------------------------------------------------------
  pre_med: {
    stem_research: 5, // Biomedical research especially
    stem_competitions: 4, // Science Olympiad, Biology Olympiad
    entrepreneurship: 3, // Health tech shows initiative
    nonprofit_service: 5, // Healthcare volunteering, community health
    writing_journalism: 2,
    debate_speech: 3, // Medical ethics, communication
    student_government: 3, // Leadership
    performing_arts_music: 2,
    performing_arts_theater: 2,
    performing_arts_dance: 2,
    visual_arts: 2,
    athletics: 3, // Discipline, teamwork
    academic_teams: 4,
    stem_clubs: 4, // HOSA, Health Occupations
    cultural_identity: 3, // Cultural health disparities
    work_experience: 4, // Hospital/clinical work
    internships: 5, // Clinical/research internships
  },

  // -------------------------------------------------------------------------
  // BUSINESS / ECONOMICS
  // -------------------------------------------------------------------------
  business_economics: {
    stem_research: 3, // Quantitative skills
    stem_competitions: 4, // Math competitions valued
    entrepreneurship: 5, // Directly aligned
    nonprofit_service: 3,
    writing_journalism: 3,
    debate_speech: 4, // Persuasion, argumentation
    student_government: 4, // Leadership
    performing_arts_music: 2,
    performing_arts_theater: 2,
    performing_arts_dance: 1,
    visual_arts: 2,
    athletics: 3, // Teamwork, competition
    academic_teams: 4, // DECA, FBLA, Econ Challenge
    stem_clubs: 3,
    cultural_identity: 3,
    work_experience: 5, // Any business experience
    internships: 5, // Finance, consulting internships
  },

  // -------------------------------------------------------------------------
  // LAW / POLICY / POLITICAL SCIENCE
  // -------------------------------------------------------------------------
  law_policy: {
    stem_research: 2,
    stem_competitions: 2,
    entrepreneurship: 3,
    nonprofit_service: 4, // Civic engagement
    writing_journalism: 5, // Writing essential
    debate_speech: 5, // Mock Trial, Debate directly aligned
    student_government: 5, // Political experience
    performing_arts_music: 2,
    performing_arts_theater: 3, // Public speaking
    performing_arts_dance: 1,
    visual_arts: 2,
    athletics: 2,
    academic_teams: 4, // Mock Trial, Model UN, Speech & Debate
    stem_clubs: 2,
    cultural_identity: 4, // Social justice
    work_experience: 3,
    internships: 5, // Political, legal internships
  },

  // -------------------------------------------------------------------------
  // HUMANITIES (English, History, Philosophy, Classics)
  // -------------------------------------------------------------------------
  humanities: {
    stem_research: 2,
    stem_competitions: 2,
    entrepreneurship: 2,
    nonprofit_service: 3,
    writing_journalism: 5, // Writing central
    debate_speech: 5, // Argumentation, rhetoric
    student_government: 3,
    performing_arts_music: 4, // Cultural appreciation
    performing_arts_theater: 5, // Literature, performance
    performing_arts_dance: 3,
    visual_arts: 4, // Art history connection
    athletics: 2,
    academic_teams: 4, // Quiz Bowl, Academic Decathlon
    stem_clubs: 1,
    cultural_identity: 5, // Cultural studies
    work_experience: 2,
    internships: 4, // Publishing, museums, archives
  },

  // -------------------------------------------------------------------------
  // SOCIAL SCIENCES (Psychology, Sociology, Anthropology)
  // -------------------------------------------------------------------------
  social_sciences: {
    stem_research: 4, // Social science research
    stem_competitions: 3,
    entrepreneurship: 3,
    nonprofit_service: 5, // Community engagement
    writing_journalism: 4,
    debate_speech: 4,
    student_government: 4,
    performing_arts_music: 3,
    performing_arts_theater: 3,
    performing_arts_dance: 3,
    visual_arts: 3,
    athletics: 3,
    academic_teams: 3,
    stem_clubs: 3, // Psychology club
    cultural_identity: 5, // Identity studies
    work_experience: 4, // Social services
    internships: 5, // Research, social work
  },

  // -------------------------------------------------------------------------
  // VISUAL ARTS (Fine Arts, Graphic Design)
  // -------------------------------------------------------------------------
  visual_arts: {
    stem_research: 1,
    stem_competitions: 1,
    entrepreneurship: 4, // Creative entrepreneurship
    nonprofit_service: 3, // Art for social good
    writing_journalism: 3,
    debate_speech: 2,
    student_government: 2,
    performing_arts_music: 4, // Creative arts synergy
    performing_arts_theater: 4,
    performing_arts_dance: 4,
    visual_arts: 5, // Direct alignment
    athletics: 1,
    academic_teams: 2,
    stem_clubs: 2,
    cultural_identity: 4, // Cultural expression
    work_experience: 3,
    internships: 5, // Art/design internships
  },

  // -------------------------------------------------------------------------
  // PERFORMING ARTS (Music, Theater, Dance)
  // -------------------------------------------------------------------------
  performing_arts: {
    stem_research: 1,
    stem_competitions: 2, // Music competitions have math elements
    entrepreneurship: 3,
    nonprofit_service: 3, // Arts education outreach
    writing_journalism: 3,
    debate_speech: 3, // Performance, public speaking
    student_government: 2,
    performing_arts_music: 5,
    performing_arts_theater: 5,
    performing_arts_dance: 5,
    visual_arts: 4, // Artistic synergy
    athletics: 3, // Dance, physical discipline
    academic_teams: 2,
    stem_clubs: 1,
    cultural_identity: 4, // Cultural performance
    work_experience: 3,
    internships: 5, // Professional arts experience
  },

  // -------------------------------------------------------------------------
  // ARCHITECTURE
  // -------------------------------------------------------------------------
  architecture: {
    stem_research: 3,
    stem_competitions: 4, // Math/physics foundations
    entrepreneurship: 3,
    nonprofit_service: 3, // Community design
    writing_journalism: 2,
    debate_speech: 2,
    student_government: 2,
    performing_arts_music: 3,
    performing_arts_theater: 3, // Spatial understanding
    performing_arts_dance: 2,
    visual_arts: 5, // Drawing, design essential
    athletics: 2,
    academic_teams: 3,
    stem_clubs: 4, // Engineering clubs
    cultural_identity: 3,
    work_experience: 3,
    internships: 5, // Architecture firm experience
  },

  // -------------------------------------------------------------------------
  // JOURNALISM / COMMUNICATIONS
  // -------------------------------------------------------------------------
  journalism_communications: {
    stem_research: 2,
    stem_competitions: 2,
    entrepreneurship: 4, // Media entrepreneurship
    nonprofit_service: 3,
    writing_journalism: 5, // Direct alignment
    debate_speech: 5, // Communication skills
    student_government: 4, // Public affairs
    performing_arts_music: 3,
    performing_arts_theater: 4, // Broadcasting, performance
    performing_arts_dance: 2,
    visual_arts: 4, // Visual communication
    athletics: 2,
    academic_teams: 3,
    stem_clubs: 2,
    cultural_identity: 4, // Diverse perspectives
    work_experience: 4, // Any media work
    internships: 5, // Media internships
  },

  // -------------------------------------------------------------------------
  // EDUCATION
  // -------------------------------------------------------------------------
  education: {
    stem_research: 3, // Education research
    stem_competitions: 3,
    entrepreneurship: 3, // EdTech
    nonprofit_service: 5, // Tutoring, mentoring
    writing_journalism: 4,
    debate_speech: 4, // Communication
    student_government: 4, // Leadership
    performing_arts_music: 4, // Teaching arts
    performing_arts_theater: 4,
    performing_arts_dance: 4,
    visual_arts: 3,
    athletics: 4, // Coaching
    academic_teams: 4,
    stem_clubs: 3,
    cultural_identity: 4, // Multicultural education
    work_experience: 5, // Teaching experience
    internships: 5, // Education internships
  },

  // -------------------------------------------------------------------------
  // ENVIRONMENTAL STUDIES
  // -------------------------------------------------------------------------
  environmental_studies: {
    stem_research: 5, // Environmental research
    stem_competitions: 4, // Science competitions
    entrepreneurship: 4, // Green startups
    nonprofit_service: 5, // Environmental activism
    writing_journalism: 4, // Environmental journalism
    debate_speech: 4, // Environmental policy
    student_government: 4, // Policy advocacy
    performing_arts_music: 2,
    performing_arts_theater: 2,
    performing_arts_dance: 2,
    visual_arts: 3, // Environmental art
    athletics: 3, // Outdoor activities
    academic_teams: 4, // Envirothon, Science Olympiad
    stem_clubs: 5, // Environmental clubs
    cultural_identity: 3,
    work_experience: 4, // Conservation work
    internships: 5, // Environmental org internships
  },

  // -------------------------------------------------------------------------
  // INTERNATIONAL RELATIONS
  // -------------------------------------------------------------------------
  international_relations: {
    stem_research: 2,
    stem_competitions: 2,
    entrepreneurship: 3, // International business
    nonprofit_service: 4, // International service
    writing_journalism: 4, // International journalism
    debate_speech: 5, // Model UN, debate
    student_government: 4, // Leadership
    performing_arts_music: 3, // Cultural exchange
    performing_arts_theater: 3,
    performing_arts_dance: 3,
    visual_arts: 2,
    athletics: 2,
    academic_teams: 5, // Model UN, Model Congress
    stem_clubs: 2,
    cultural_identity: 5, // Cross-cultural experience
    work_experience: 3,
    internships: 5, // Embassy, NGO, intl org internships
  },
};

// ============================================================================
// SPECIFIC ACTIVITY TO MAJOR MAPPING
// ============================================================================

/**
 * Detailed mapping of specific activities to their most aligned majors
 * Used for more precise coherence scoring
 */
export const SPECIFIC_ACTIVITY_MAJOR_ALIGNMENT = {
  // STEM Competitions
  usamo: ['engineering', 'computer_science', 'natural_sciences', 'business_economics'] as MajorCategory[],
  usaco: ['computer_science', 'engineering'] as MajorCategory[],
  usabo: ['pre_med', 'natural_sciences'] as MajorCategory[],
  usnco: ['natural_sciences', 'pre_med', 'engineering'] as MajorCategory[],
  usapho: ['engineering', 'natural_sciences'] as MajorCategory[],
  science_olympiad: ['engineering', 'natural_sciences', 'pre_med'] as MajorCategory[],
  isef_regeneron: ['natural_sciences', 'engineering', 'computer_science'] as MajorCategory[],
  siemens: ['engineering', 'natural_sciences', 'computer_science'] as MajorCategory[],

  // Debate/Speech
  toc_debate: ['law_policy', 'humanities', 'journalism_communications'] as MajorCategory[],
  nsda_nationals: ['law_policy', 'humanities', 'journalism_communications'] as MajorCategory[],
  mock_trial: ['law_policy', 'humanities'] as MajorCategory[],
  model_un: ['international_relations', 'law_policy', 'social_sciences'] as MajorCategory[],

  // Business/Entrepreneurship
  deca: ['business_economics'] as MajorCategory[],
  fbla: ['business_economics'] as MajorCategory[],
  startup_founded: ['business_economics', 'computer_science', 'engineering'] as MajorCategory[],
  y_combinator: ['business_economics', 'computer_science', 'engineering'] as MajorCategory[],

  // Writing/Journalism
  scholastic_writing: ['humanities', 'journalism_communications'] as MajorCategory[],
  youngarts_writing: ['humanities', 'journalism_communications', 'performing_arts'] as MajorCategory[],
  national_publication: ['journalism_communications', 'humanities'] as MajorCategory[],

  // Visual Arts
  scholastic_art: ['visual_arts', 'architecture'] as MajorCategory[],
  youngarts_visual: ['visual_arts', 'architecture', 'performing_arts'] as MajorCategory[],

  // Performing Arts
  all_state_music: ['performing_arts'] as MajorCategory[],
  national_youth_orchestra: ['performing_arts'] as MajorCategory[],
  youngarts_music: ['performing_arts'] as MajorCategory[],
  national_theater_festival: ['performing_arts', 'humanities'] as MajorCategory[],

  // Service/Nonprofit
  nonprofit_founded: ['social_sciences', 'education', 'pre_med', 'environmental_studies'] as MajorCategory[],
  significant_volunteering: ['pre_med', 'social_sciences', 'education'] as MajorCategory[],

  // Athletics
  varsity_captain: ['business_economics', 'education'] as MajorCategory[], // Leadership transferable
  recruited_athlete: ['education'] as MajorCategory[], // Often paired with any major

  // Student Government
  student_body_president: ['law_policy', 'business_economics', 'social_sciences'] as MajorCategory[],
  boys_girls_state: ['law_policy', 'social_sciences', 'international_relations'] as MajorCategory[],
};

// ============================================================================
// SPIKE DETECTION
// ============================================================================

/**
 * Spike profile detection rules
 *
 * HYPSM prefers students with a clear "spike" over well-rounded students
 * with many Tier 2 activities.
 *
 * A spike is defined as:
 * - Multiple Tier 1 or Tier 2 achievements in a single domain
 * - Clear narrative connection between activities and intended major
 * - Demonstrated passion over time (not senior year resume padding)
 */

export interface SpikeProfile {
  domain: string;
  strength: 'exceptional' | 'strong' | 'moderate' | 'weak';
  activities: string[];
  coherenceScore: number; // 0-100
  narrativePitch: string; // Two-sentence summary
}

export const SPIKE_DOMAINS = {
  stem_researcher: {
    description: 'Deep commitment to scientific research',
    indicators: [
      'Published research paper',
      'ISEF/Regeneron finalist',
      'RSI or equivalent program',
      'Multiple years of research',
    ],
    alignedMajors: ['natural_sciences', 'engineering', 'computer_science', 'pre_med'] as MajorCategory[],
    examplePitch:
      'A budding molecular biologist who published research on CRISPR applications in high school and spent three summers at university labs.',
  },

  tech_builder: {
    description: 'Creates technology products that solve real problems',
    indicators: [
      'App with significant users',
      'Open source contributions',
      'USACO Gold+',
      'Hackathon wins',
      'Tech startup',
    ],
    alignedMajors: ['computer_science', 'engineering', 'business_economics'] as MajorCategory[],
    examplePitch:
      'A self-taught programmer who built an app used by 50,000 students and contributes to open source machine learning projects.',
  },

  entrepreneur: {
    description: 'Builds businesses and creates value',
    indicators: ['Revenue-generating business', 'Raised funding', 'Accelerator acceptance', 'Media coverage'],
    alignedMajors: ['business_economics', 'computer_science', 'engineering'] as MajorCategory[],
    examplePitch:
      'A teenage entrepreneur who built a $100K/year e-commerce business while leading her school\'s investment club to regional championships.',
  },

  writer_communicator: {
    description: 'Exceptional written or oral communication',
    indicators: [
      'Scholastic Gold Key',
      'Published in national outlets',
      'TOC qualifier (debate/speech)',
      'Book published',
    ],
    alignedMajors: ['humanities', 'journalism_communications', 'law_policy'] as MajorCategory[],
    examplePitch:
      'A published poet whose work appeared in The Atlantic, who also founded a literary magazine that publishes student writers from underserved schools.',
  },

  policy_leader: {
    description: 'Deep engagement in civic and political life',
    indicators: [
      'Boys/Girls State delegate',
      'Mock Trial nationals',
      'Model UN awards',
      'Student body president',
      'Political campaign work',
    ],
    alignedMajors: ['law_policy', 'international_relations', 'social_sciences'] as MajorCategory[],
    examplePitch:
      'A future policy maker who interned at the state legislature, qualified for Mock Trial nationals, and led a successful local ballot initiative.',
  },

  artist: {
    description: 'Serious artistic achievement in visual or performing arts',
    indicators: [
      'YoungArts winner',
      'Scholastic Gold Portfolio',
      'Pre-professional training',
      'Gallery shows/professional performances',
    ],
    alignedMajors: ['visual_arts', 'performing_arts', 'architecture'] as MajorCategory[],
    examplePitch:
      'A YoungArts finalist in visual arts whose work was exhibited at a major museum and who runs free art workshops for elementary students.',
  },

  performer: {
    description: 'Elite performance in music, theater, or dance',
    indicators: [
      'All-State (top chair)',
      'National Youth Orchestra',
      'YoungArts',
      'Pre-professional company',
      'Professional credits',
    ],
    alignedMajors: ['performing_arts'] as MajorCategory[],
    examplePitch:
      'A principal dancer with a pre-professional company who was invited to perform at Lincoln Center while maintaining a 4.0 GPA.',
  },

  healthcare_servant: {
    description: 'Deep commitment to healthcare and service',
    indicators: [
      'Significant clinical volunteering',
      'Health-related research',
      'EMT certification',
      'Founded health nonprofit',
    ],
    alignedMajors: ['pre_med', 'social_sciences'] as MajorCategory[],
    examplePitch:
      'An EMT-certified student who volunteered 500+ hours in emergency medicine and researched health disparities in her community.',
  },

  environmental_advocate: {
    description: 'Deep commitment to environmental causes',
    indicators: [
      'Environmental research',
      'Founded environmental organization',
      'Policy advocacy',
      'Significant conservation work',
    ],
    alignedMajors: ['environmental_studies', 'natural_sciences', 'law_policy'] as MajorCategory[],
    examplePitch:
      'An environmental activist who led a successful campaign to ban single-use plastics in her district while researching microplastics in local waterways.',
  },

  athlete_leader: {
    description: 'Elite athletic achievement combined with leadership',
    indicators: [
      'Recruited athlete',
      'State/National level',
      'Team captain',
      'Significant community coaching',
    ],
    alignedMajors: ['education', 'business_economics'] as MajorCategory[],
    examplePitch:
      'A state champion swimmer and team captain who founded a program teaching water safety to underserved communities.',
  },
};

// ============================================================================
// COHERENCE SCORING
// ============================================================================

/**
 * Calculate coherence score for a student profile
 *
 * High coherence = Clear narrative thread connecting activities to major
 * Low coherence = Scattered activities without clear direction
 *
 * HYPSM values coherence highly - they want to see "who you are" not "what you did"
 */

export interface CoherenceAnalysis {
  overallScore: number; // 0-100
  spikeDetected: boolean;
  spikeDomain?: string;
  narrativeStrength: 'exceptional' | 'strong' | 'moderate' | 'weak' | 'scattered';
  alignmentScore: number; // How well activities align with intended major
  timelineConsistency: number; // Sustained interest over years
  depthVsBreadth: 'deep_spike' | 'balanced' | 'too_scattered';
  recommendations: string[];
  twoSentencePitch?: string;
}

/**
 * Red flags that reduce coherence score
 */
export const COHERENCE_RED_FLAGS = {
  senior_year_padding: {
    description: 'Multiple activities started in senior year',
    impact: -15,
    notes: 'Shows resume building rather than genuine interest',
  },
  major_mismatch: {
    description: 'Activities don\'t align with stated major',
    impact: -20,
    notes: 'Engineering major with only humanities activities',
  },
  no_progression: {
    description: 'No growth or deepening over time',
    impact: -10,
    notes: 'Same level of involvement 9th-12th grade',
  },
  contradictory_narrative: {
    description: 'Activities tell conflicting stories',
    impact: -15,
    notes: 'Says passionate about X but activities show Y',
  },
  breadth_without_depth: {
    description: 'Many activities but no Tier 1 or 2 achievements',
    impact: -10,
    notes: 'Classic "resume padding" profile',
  },
  inflated_hours: {
    description: 'Hours claimed exceed reasonable possibility',
    impact: -20,
    notes: 'More than 168 hours/week claimed',
  },
};

/**
 * Green flags that boost coherence score
 */
export const COHERENCE_GREEN_FLAGS = {
  clear_spike: {
    description: 'Obvious area of deep expertise',
    impact: +20,
    notes: 'Multiple high achievements in related activities',
  },
  multi_year_commitment: {
    description: 'Same activities pursued across multiple years',
    impact: +10,
    notes: 'Shows genuine interest, not resume padding',
  },
  activities_inform_each_other: {
    description: 'Activities create synergies',
    impact: +10,
    notes: 'Research + nonprofit + publication in same field',
  },
  leadership_progression: {
    description: 'Grew from participant to leader over time',
    impact: +10,
    notes: 'Natural progression shows commitment',
  },
  unique_niche: {
    description: 'Carved out distinctive position',
    impact: +15,
    notes: 'Not the usual pre-med checklist',
  },
  authentic_origin_story: {
    description: 'Clear personal reason for interests',
    impact: +10,
    notes: 'Activities connected to personal experience',
  },
};

// ============================================================================
// CROSS-DISCIPLINARY SIGNALS
// ============================================================================

/**
 * Some activities signal positively across many majors
 * These show general excellence rather than specific alignment
 */

export const UNIVERSAL_POSITIVE_SIGNALS = {
  leadership: {
    indicators: ['President of significant org', 'Founded sustainable organization', 'Team captain of winning team'],
    universalValue: true,
    notes: 'Leadership valued regardless of major',
  },

  intellectual_curiosity: {
    indicators: ['Self-directed learning', 'Reading outside curriculum', 'Asking deep questions'],
    universalValue: true,
    notes: 'All selective colleges value curiosity',
  },

  resilience: {
    indicators: ['Overcame significant obstacle', 'Persisted through failure', 'Maintained despite circumstances'],
    universalValue: true,
    notes: 'Grit predicts college success',
  },

  impact: {
    indicators: ['Measurable community benefit', 'Changed policy/practice', 'Helped specific individuals'],
    universalValue: true,
    notes: 'Impact matters more than hours',
  },

  communication: {
    indicators: ['Public speaking', 'Published writing', 'Teaching/mentoring others'],
    universalValue: true,
    notes: 'Communication skills valued everywhere',
  },
};

// ============================================================================
// MAJOR-SPECIFIC ACTIVITY BENCHMARKS
// ============================================================================

/**
 * What does a competitive applicant look like for each major?
 * These are not requirements, but benchmarks for "spike" profiles
 */

export const MAJOR_COMPETITIVE_BENCHMARKS = {
  computer_science: {
    ideal_spike_profile: [
      'USACO Gold or higher',
      'Significant personal project with users',
      'Tech internship at known company',
      'Research or open source contributions',
    ],
    common_mistakes: [
      'Only taking AP CS without building anything',
      'Generic "coding bootcamp" attendance',
      'Claiming "CEO of app" with no users',
    ],
    differentiators: [
      'Contributing to real open source projects',
      'Building tools others actually use',
      'Research publication in CS/AI',
    ],
  },

  engineering: {
    ideal_spike_profile: [
      'Science Olympiad state/national',
      'Robotics team leadership',
      'Engineering internship',
      'Patent or significant invention',
    ],
    common_mistakes: [
      'Only math competitions without building',
      'Robotics team member with no technical role',
      'No hands-on engineering experience',
    ],
    differentiators: [
      'Invented something that solves real problem',
      'Engineering research publication',
      'Significant robotics achievements',
    ],
  },

  pre_med: {
    ideal_spike_profile: [
      'Significant clinical experience (500+ hours)',
      'Biomedical research with publication',
      'Health-related nonprofit impact',
      'USABO/Science Olympiad achievement',
    ],
    common_mistakes: [
      'Only hospital volunteering without reflection',
      'Senior year pre-med nonprofit',
      'No actual patient interaction',
    ],
    differentiators: [
      'EMT/medical certification',
      'Published health research',
      'Founded sustainable health initiative',
    ],
  },

  business_economics: {
    ideal_spike_profile: [
      'Real business with revenue',
      'DECA/FBLA nationals',
      'Finance internship',
      'Investment club leadership with results',
    ],
    common_mistakes: [
      'DECA participation without advancement',
      '"CEO" of idea with no traction',
      'Investment club member without contribution',
    ],
    differentiators: [
      'Raised real funding',
      'P&L responsibility',
      'Economic research publication',
    ],
  },

  humanities: {
    ideal_spike_profile: [
      'Scholastic Gold Key or equivalent',
      'Published in recognized outlets',
      'Significant research project',
      'Founded literary/humanities initiative',
    ],
    common_mistakes: [
      'Only school newspaper without growth',
      'Generic book club participation',
      'No original work produced',
    ],
    differentiators: [
      'Published book or significant portfolio',
      'Won national writing competition',
      'Created humanities platform with reach',
    ],
  },

  law_policy: {
    ideal_spike_profile: [
      'TOC qualifier or Mock Trial nationals',
      'Boys/Girls State delegate',
      'Political internship with responsibility',
      'Policy advocacy with results',
    ],
    common_mistakes: [
      'Debate team member without competitive success',
      'Model UN without awards',
      'Generic "interested in politics"',
    ],
    differentiators: [
      'Passed actual legislation/policy',
      'Worked on major campaign',
      'Founded civic engagement initiative',
    ],
  },

  visual_arts: {
    ideal_spike_profile: [
      'YoungArts or Scholastic Gold Portfolio',
      'Gallery exhibition',
      'Pre-college art program acceptance',
      'Significant commission work',
    ],
    common_mistakes: [
      'Only school art classes',
      'Generic portfolio without theme',
      'No outside validation',
    ],
    differentiators: [
      'Museum exhibition',
      'Professional commission',
      'Founded art education initiative',
    ],
  },

  performing_arts: {
    ideal_spike_profile: [
      'All-State top selection',
      'YoungArts finalist',
      'Pre-professional company member',
      'Professional performance credits',
    ],
    common_mistakes: [
      'Only school performances',
      'All-County without progression',
      'No audition-based achievements',
    ],
    differentiators: [
      'National Youth Orchestra/equivalent',
      'Professional credits',
      'Founded arts access program',
    ],
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export const majorActivityAlignment = {
  MAJOR_ACTIVITY_ALIGNMENT_MATRIX,
  SPECIFIC_ACTIVITY_MAJOR_ALIGNMENT,
  SPIKE_DOMAINS,
  COHERENCE_RED_FLAGS,
  COHERENCE_GREEN_FLAGS,
  UNIVERSAL_POSITIVE_SIGNALS,
  MAJOR_COMPETITIVE_BENCHMARKS,
};
