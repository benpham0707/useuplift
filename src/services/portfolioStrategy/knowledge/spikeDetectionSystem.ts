/**
 * Spike Detection & Profile Coherence System
 *
 * Elite colleges (especially HYPSM) increasingly value "spike" profiles over
 * "well-rounded" profiles. This system:
 *
 * 1. Detects spike patterns in student activities
 * 2. Scores profile coherence (narrative thread)
 * 3. Identifies profile archetypes
 * 4. Generates "two-sentence pitch" summaries
 * 5. Provides strategic recommendations
 *
 * Key insight: A student with a Tier 1 spike + supporting activities
 * beats a student with five Tier 2 achievements in unrelated areas.
 *
 * Sources:
 * - MIT Admissions "T-shaped" student preference
 * - Stanford's emphasis on "intellectual vitality"
 * - Harvard's "Tips for Applicants" on excellence
 * - Counselor consensus on modern admissions trends
 */

import { MajorCategory, ActivityCategory } from './majorActivityAlignment';

// ============================================================================
// SPIKE TYPES
// ============================================================================

/**
 * Core spike archetypes that admissions officers recognize
 * Each represents a distinct "type" of exceptional student
 */

export type SpikeType =
  | 'research_scientist'
  | 'tech_builder'
  | 'entrepreneur'
  | 'writer_intellectual'
  | 'policy_advocate'
  | 'performing_artist'
  | 'visual_artist'
  | 'athlete_leader'
  | 'community_builder'
  | 'healthcare_servant'
  | 'environmental_champion'
  | 'cultural_bridge'
  | 'maker_inventor'
  | 'educator_mentor'
  | 'journalist_communicator';

export interface SpikeDefinition {
  type: SpikeType;
  name: string;
  description: string;
  primaryIndicators: string[];
  secondaryIndicators: string[];
  alignedMajors: MajorCategory[];
  alignedActivities: ActivityCategory[];
  examplePitch: string;
  commonMistakes: string[];
  strengtheningSuggestions: string[];
}

export const SPIKE_DEFINITIONS: Record<SpikeType, SpikeDefinition> = {
  research_scientist: {
    type: 'research_scientist',
    name: 'Research Scientist',
    description: 'Deep commitment to scientific discovery and rigorous inquiry',
    primaryIndicators: [
      'Published peer-reviewed research',
      'ISEF/Regeneron/Siemens finalist',
      'RSI or equivalent program',
      'Multi-year research project',
      'Patent or significant discovery',
    ],
    secondaryIndicators: [
      'Science Olympiad national qualifier',
      'AP Research with original work',
      'Research poster at conference',
      'Lab internship with substantive role',
      'Science fair state winner',
    ],
    alignedMajors: ['natural_sciences', 'engineering', 'computer_science', 'pre_med'],
    alignedActivities: ['stem_research', 'stem_competitions', 'academic_teams'],
    examplePitch:
      'A budding molecular biologist who discovered a novel protein interaction during three summers at Stanford Med, publishing two papers and presenting at SfN.',
    commonMistakes: [
      'Listing research without explaining contribution',
      'Generic lab volunteering without learning',
      'Name-dropping lab without substance',
    ],
    strengtheningSuggestions: [
      'Pursue publication, even in student journals',
      'Present at local/regional conferences',
      'Connect research to real-world application',
      'Mentor younger students in research',
    ],
  },

  tech_builder: {
    type: 'tech_builder',
    name: 'Tech Builder',
    description: 'Creates technology that solves real problems for real users',
    primaryIndicators: [
      'App/product with 10,000+ users',
      'Open source with significant stars/contributors',
      'USACO Gold or higher',
      'Tech startup with traction',
      'Hackathon wins at major events',
    ],
    secondaryIndicators: [
      'Personal projects with GitHub portfolio',
      'Technical blog with readership',
      'Freelance development with clients',
      'Robotics significant contribution',
      'CTF/security competition success',
    ],
    alignedMajors: ['computer_science', 'engineering'],
    alignedActivities: ['stem_competitions', 'entrepreneurship', 'stem_clubs'],
    examplePitch:
      'A self-taught programmer who built an accessibility tool used by 50,000 visually impaired users and contributes to TensorFlow.',
    commonMistakes: [
      'Tutorial projects listed as achievements',
      'Claiming expertise without portfolio',
      'App with zero real users',
    ],
    strengtheningSuggestions: [
      'Build something people actually use',
      'Contribute to established open source',
      'Solve a problem you personally experienced',
      'Document your work publicly',
    ],
  },

  entrepreneur: {
    type: 'entrepreneur',
    name: 'Entrepreneur',
    description: 'Creates value through business and initiative',
    primaryIndicators: [
      'Business with $50K+ revenue',
      'Raised funding from non-family sources',
      'Accepted to recognized accelerator',
      'Significant media coverage',
      'Company acquired or major partnership',
    ],
    secondaryIndicators: [
      'Profitable small business',
      'Won pitch competition',
      'DECA/FBLA nationals',
      'Consistent freelance income',
      'Local business recognition',
    ],
    alignedMajors: ['business_economics', 'computer_science', 'engineering'],
    alignedActivities: ['entrepreneurship', 'stem_clubs', 'academic_teams'],
    examplePitch:
      'A teenage entrepreneur who built a $200K/year sustainable fashion marketplace while leading DECA to nationals and mentoring student founders.',
    commonMistakes: [
      '"CEO" with no revenue or users',
      'Family-funded "business"',
      'Idea stage claimed as company',
    ],
    strengtheningSuggestions: [
      'Focus on traction, not titles',
      'Get real customers paying real money',
      'Document your entrepreneurial journey',
      'Mentor other young entrepreneurs',
    ],
  },

  writer_intellectual: {
    type: 'writer_intellectual',
    name: 'Writer/Intellectual',
    description: 'Exceptional written expression and intellectual depth',
    primaryIndicators: [
      'Scholastic Gold Key or national recognition',
      'Published in major outlets',
      'YoungArts writing finalist',
      'Book published',
      'Literary magazine founder with reach',
    ],
    secondaryIndicators: [
      'Regional writing awards',
      'School newspaper editor-in-chief',
      'Significant creative portfolio',
      'Won essay competitions',
      'Active blog with readership',
    ],
    alignedMajors: ['humanities', 'journalism_communications', 'social_sciences'],
    alignedActivities: ['writing_journalism', 'debate_speech', 'cultural_identity'],
    examplePitch:
      'A Scholastic Gold Key winner whose essays on immigrant identity were published in Teen Vogue, who founded a literary magazine amplifying underrepresented voices.',
    commonMistakes: [
      'Generic school newspaper participation',
      'Writing hobby without external validation',
      'No original voice or perspective',
    ],
    strengtheningSuggestions: [
      'Submit to external competitions and publications',
      'Develop a distinctive voice/theme',
      'Connect writing to broader impact',
      'Build a public portfolio',
    ],
  },

  policy_advocate: {
    type: 'policy_advocate',
    name: 'Policy Advocate',
    description: 'Engages deeply in civic life and creates political change',
    primaryIndicators: [
      'TOC qualifier in debate',
      'Mock Trial nationals',
      'Boys/Girls State delegate',
      'Policy actually changed through advocacy',
      'Worked on major political campaign',
    ],
    secondaryIndicators: [
      'Model UN Best Delegate awards',
      'Student body president',
      'Testified before government body',
      'Political internship with responsibility',
      'Founded civic engagement initiative',
    ],
    alignedMajors: ['law_policy', 'international_relations', 'social_sciences'],
    alignedActivities: ['debate_speech', 'student_government', 'academic_teams'],
    examplePitch:
      'A TOC semifinalist who interned for a US Senator and led a youth coalition that successfully lobbied for mental health funding in her state budget.',
    commonMistakes: [
      'Debate participation without competitive success',
      'Generic "interested in politics"',
      'Advocacy without measurable outcomes',
    ],
    strengtheningSuggestions: [
      'Pursue competitive success in debate/MUN',
      'Work on actual campaigns or in offices',
      'Advocate for specific policy changes',
      'Build coalition beyond school',
    ],
  },

  performing_artist: {
    type: 'performing_artist',
    name: 'Performing Artist',
    description: 'Elite achievement in music, theater, or dance',
    primaryIndicators: [
      'National Youth Orchestra or equivalent',
      'YoungArts finalist',
      'Pre-professional company member',
      'Professional credits/performances',
      'All-State top selection',
    ],
    secondaryIndicators: [
      'All-State participant',
      'Regional/district honors',
      'Lead roles in productions',
      'Private instruction for years',
      'Teaching/coaching others',
    ],
    alignedMajors: ['performing_arts'],
    alignedActivities: ['performing_arts_music', 'performing_arts_theater', 'performing_arts_dance'],
    examplePitch:
      'A principal dancer with American Ballet Theatre II who choreographed an original work premiered at Lincoln Center while maintaining academic excellence.',
    commonMistakes: [
      'Only school performances listed',
      'Years of lessons without achievement',
      'No audition-based selections',
    ],
    strengtheningSuggestions: [
      'Pursue competitive auditions',
      'Apply to pre-professional programs',
      'Create/choreograph original work',
      'Teach or mentor younger students',
    ],
  },

  visual_artist: {
    type: 'visual_artist',
    name: 'Visual Artist',
    description: 'Serious artistic achievement and distinctive vision',
    primaryIndicators: [
      'Scholastic Gold Key Portfolio',
      'YoungArts finalist',
      'Gallery exhibition',
      'Pre-college art program (RISD, MICA)',
      'Significant commission work',
    ],
    secondaryIndicators: [
      'Regional art awards',
      'Art AP portfolio highest score',
      'Local gallery showing',
      'School murals or public art',
      'Design work for organizations',
    ],
    alignedMajors: ['visual_arts', 'architecture'],
    alignedActivities: ['visual_arts'],
    examplePitch:
      'A Scholastic Gold Portfolio recipient whose mixed-media installation on climate grief was exhibited at the Museum of Contemporary Art and now teaches art to refugees.',
    commonMistakes: [
      'Only school art classes',
      'No external validation of work',
      'Generic portfolio without theme',
    ],
    strengtheningSuggestions: [
      'Submit to Scholastic and other competitions',
      'Apply to pre-college programs',
      'Develop a cohesive portfolio theme',
      'Seek exhibition opportunities',
    ],
  },

  athlete_leader: {
    type: 'athlete_leader',
    name: 'Athlete Leader',
    description: 'Elite athletic achievement with leadership dimension',
    primaryIndicators: [
      'Division I recruited athlete',
      'National/International competition',
      'Team captain of championship team',
      'All-American or equivalent',
      'Olympic development pathway',
    ],
    secondaryIndicators: [
      'All-State selection',
      'Team captain',
      'Breaking school records',
      'Club team at high level',
      'Coaching/mentoring younger athletes',
    ],
    alignedMajors: ['education', 'business_economics'],
    alignedActivities: ['athletics'],
    examplePitch:
      'A nationally-ranked swimmer and team captain who founded a program teaching water safety in underserved communities, saving an estimated 12 lives.',
    commonMistakes: [
      'Varsity participation without distinction',
      'Athletic achievement without leadership',
      'No connection to broader impact',
    ],
    strengtheningSuggestions: [
      'Pursue highest level of competition available',
      'Take on captain/leadership roles',
      'Connect athletics to community service',
      'Coach or mentor younger athletes',
    ],
  },

  community_builder: {
    type: 'community_builder',
    name: 'Community Builder',
    description: 'Creates organizations and infrastructure that serve others',
    primaryIndicators: [
      'Founded nonprofit with 1,000+ beneficiaries',
      'Raised $50K+ for causes',
      'Organization scaled to multiple locations',
      'Partnership with major institutions',
      'Measurable community transformation',
    ],
    secondaryIndicators: [
      'Founded sustainable school club',
      'Led significant service project',
      'Organized major community event',
      'Volunteer leadership role',
      'Service trip leadership',
    ],
    alignedMajors: ['social_sciences', 'education', 'pre_med', 'law_policy'],
    alignedActivities: ['nonprofit_service', 'student_government'],
    examplePitch:
      'The founder of a tutoring network that has served 2,500 first-gen students across 15 schools, with 85% college acceptance rates for participants.',
    commonMistakes: [
      'Senior year nonprofit without impact',
      'Service hours without depth',
      'Organization exists only on paper',
    ],
    strengtheningSuggestions: [
      'Build something sustainable beyond you',
      'Track and measure your impact',
      'Partner with established organizations',
      'Develop leadership succession',
    ],
  },

  healthcare_servant: {
    type: 'healthcare_servant',
    name: 'Healthcare Servant',
    description: 'Deep commitment to healthcare and healing',
    primaryIndicators: [
      'EMT/CNA certification with active service',
      'Significant clinical research',
      'Founded health-focused nonprofit',
      '500+ clinical volunteer hours',
      'Published health research',
    ],
    secondaryIndicators: [
      'Hospital volunteering (substantial)',
      'Health-related research experience',
      'HOSA leadership',
      'Health education outreach',
      'Shadowing with reflection',
    ],
    alignedMajors: ['pre_med', 'natural_sciences'],
    alignedActivities: ['nonprofit_service', 'stem_research', 'work_experience'],
    examplePitch:
      'An EMT who has responded to 200+ emergencies while researching health disparities in her community and founding a teen mental health support hotline.',
    commonMistakes: [
      'Generic hospital volunteering only',
      'Shadowing without deeper engagement',
      'Pre-med checklist without authenticity',
    ],
    strengtheningSuggestions: [
      'Get certified (EMT, CNA, etc.)',
      'Pursue research in health field',
      'Address health issues in your community',
      'Reflect deeply on patient interactions',
    ],
  },

  environmental_champion: {
    type: 'environmental_champion',
    name: 'Environmental Champion',
    description: 'Deep commitment to environmental causes',
    primaryIndicators: [
      'Environmental research publication',
      'Policy change through advocacy',
      'Founded significant environmental org',
      'Major media coverage of activism',
      'Partnership with environmental groups',
    ],
    secondaryIndicators: [
      'Environmental club leadership',
      'Envirothon success',
      'Conservation volunteer work',
      'School sustainability initiatives',
      'Climate strike organizing',
    ],
    alignedMajors: ['environmental_studies', 'natural_sciences', 'law_policy'],
    alignedActivities: ['nonprofit_service', 'stem_research', 'stem_clubs'],
    examplePitch:
      'An environmental researcher whose study of microplastics led to a county ban on single-use plastics, while she built a network of 500 youth climate activists.',
    commonMistakes: [
      'Generic environmental club member',
      'Activism without tangible outcomes',
      'Passion without scientific grounding',
    ],
    strengtheningSuggestions: [
      'Combine science with advocacy',
      'Pursue measurable policy changes',
      'Build coalitions beyond school',
      'Document environmental impact',
    ],
  },

  cultural_bridge: {
    type: 'cultural_bridge',
    name: 'Cultural Bridge',
    description: 'Connects cultures and promotes understanding',
    primaryIndicators: [
      'Founded cross-cultural organization',
      'Published work on cultural issues',
      'International exchange leadership',
      'Translation/interpretation impact',
      'Cultural preservation project',
    ],
    secondaryIndicators: [
      'Cultural club leadership',
      'Heritage language school teaching',
      'Cultural event organizing',
      'Immigrant support volunteering',
      'Cross-cultural dialogue facilitation',
    ],
    alignedMajors: ['international_relations', 'humanities', 'social_sciences'],
    alignedActivities: ['cultural_identity', 'nonprofit_service', 'writing_journalism'],
    examplePitch:
      'A first-generation American who founded a program pairing refugee families with bilingual mentors, serving 200 families while publishing essays on diaspora identity.',
    commonMistakes: [
      'Generic cultural club participation',
      'Heritage without active engagement',
      'No bridge-building dimension',
    ],
    strengtheningSuggestions: [
      'Create programs that connect cultures',
      'Document and preserve cultural knowledge',
      'Build bridges beyond your community',
      'Write/speak about cultural experiences',
    ],
  },

  maker_inventor: {
    type: 'maker_inventor',
    name: 'Maker/Inventor',
    description: 'Creates physical things that solve problems',
    primaryIndicators: [
      'Patent granted or pending',
      'Significant invention with users',
      'Robotics national level',
      'Engineering competition success',
      'Product in actual production',
    ],
    secondaryIndicators: [
      'Makerspace regular with portfolio',
      'Robotics team technical lead',
      'Science fair engineering project',
      'Arduino/electronics projects',
      'CAD/fabrication skills demonstrated',
    ],
    alignedMajors: ['engineering', 'architecture', 'computer_science'],
    alignedActivities: ['stem_competitions', 'stem_clubs', 'entrepreneurship'],
    examplePitch:
      'An inventor who patented a low-cost water filtration device now deployed in 3 developing countries, while leading her robotics team to world championships.',
    commonMistakes: [
      'Robotics team member without technical role',
      'Projects without real-world application',
      'Ideas without prototypes',
    ],
    strengtheningSuggestions: [
      'Build things that solve real problems',
      'Document your making process',
      'Pursue patents or production',
      'Connect making to community needs',
    ],
  },

  educator_mentor: {
    type: 'educator_mentor',
    name: 'Educator/Mentor',
    description: 'Transforms others through teaching and mentorship',
    primaryIndicators: [
      'Founded tutoring program with tracked outcomes',
      'Curriculum adopted by schools',
      'YouTube/online education with significant reach',
      'Teacher certification or equivalent',
      'Published educational materials',
    ],
    secondaryIndicators: [
      'Long-term tutoring relationships',
      'Peer tutoring leadership',
      'Teaching assistant roles',
      'Coaching younger students',
      'Created educational content',
    ],
    alignedMajors: ['education', 'social_sciences'],
    alignedActivities: ['nonprofit_service', 'academic_teams'],
    examplePitch:
      'A self-made educator whose free math YouTube channel reached 100,000 students while she founded a peer tutoring program that improved pass rates by 40%.',
    commonMistakes: [
      'Generic tutoring without tracking',
      'Teaching without student improvement',
      'No evidence of educational impact',
    ],
    strengtheningSuggestions: [
      'Track student outcomes rigorously',
      'Develop systematic approach',
      'Scale beyond one-on-one tutoring',
      'Create reusable educational content',
    ],
  },

  journalist_communicator: {
    type: 'journalist_communicator',
    name: 'Journalist/Communicator',
    description: 'Informs and shapes public discourse',
    primaryIndicators: [
      'Published in national outlets',
      'Won journalism competitions',
      'Significant podcast/media following',
      'Investigated story with impact',
      'Journalism internship at major outlet',
    ],
    secondaryIndicators: [
      'School newspaper editor',
      'Local publication bylines',
      'School broadcast leadership',
      'Photography published',
      'Documentary created',
    ],
    alignedMajors: ['journalism_communications', 'humanities', 'law_policy'],
    alignedActivities: ['writing_journalism', 'debate_speech', 'visual_arts'],
    examplePitch:
      'A student journalist whose investigation into school funding disparities was published in the Washington Post and influenced state policy discussions.',
    commonMistakes: [
      'School newspaper without growth',
      'No external publication attempts',
      'Generic reporting without impact',
    ],
    strengtheningSuggestions: [
      'Pitch to external publications',
      'Investigate stories that matter',
      'Build multimedia skills',
      'Create content with reach',
    ],
  },
};

// ============================================================================
// PROFILE COHERENCE SCORING
// ============================================================================

export interface CoherenceScore {
  overall: number; // 0-100
  components: {
    spikeStrength: number; // How strong is the primary spike
    narrativeClarity: number; // How clear is the story
    activityAlignment: number; // Do activities support each other
    majorFit: number; // Do activities align with intended major
    timeConsistency: number; // Sustained over time
    depthScore: number; // Depth vs breadth
  };
  interpretation: 'exceptional' | 'strong' | 'moderate' | 'weak' | 'scattered';
  twoSentencePitch: string;
  recommendations: string[];
}

export const COHERENCE_SCORE_INTERPRETATION = {
  exceptional: {
    range: [85, 100],
    description: 'Clear spike with deeply aligned supporting activities',
    narrative: 'Admission officers immediately understand who this student is',
    example: 'Research scientist with publications, Science Olympiad medals, founded science outreach org',
  },
  strong: {
    range: [70, 84],
    description: 'Visible spike with mostly aligned activities',
    narrative: 'Clear direction with minor diversions',
    example: 'Aspiring doctor with clinical experience, biology research, some unrelated activities',
  },
  moderate: {
    range: [50, 69],
    description: 'Emerging spike but diluted by unrelated activities',
    narrative: 'Direction visible but needs sharpening',
    example: 'Interest in tech but equal time in debate, music, and volunteering',
  },
  weak: {
    range: [30, 49],
    description: 'No clear spike, activities seem unconnected',
    narrative: 'Hard to summarize what this student is "about"',
    example: 'Mix of clubs, sports, volunteering with no clear thread',
  },
  scattered: {
    range: [0, 29],
    description: 'Activities appear random, possible resume padding',
    narrative: 'Admissions officer would struggle to write a summary',
    example: 'Many activities in senior year, no progression, no depth',
  },
};

// ============================================================================
// SPIKE DETECTION ALGORITHM INPUTS
// ============================================================================

export interface ActivityInput {
  name: string;
  category: ActivityCategory;
  tier: 1 | 2 | 3 | 4;
  yearsInvolved: number;
  hoursPerWeek: number;
  weeksPerYear: number;
  leadership: boolean;
  awards: string[];
  impactMetrics: Record<string, number>;
}

export interface StudentProfileInput {
  intendedMajor: MajorCategory;
  activities: ActivityInput[];
  context: {
    firstGen: boolean;
    lowIncome: boolean;
    rural: boolean;
    underrepresentedInField: boolean;
  };
}

// ============================================================================
// SPIKE STRENGTH CALCULATION
// ============================================================================

export const SPIKE_STRENGTH_WEIGHTS = {
  tier1Achievement: 40, // Having a Tier 1 achievement
  tier2Achievement: 20, // Having multiple Tier 2 achievements
  yearsOfCommitment: 15, // Multi-year involvement
  leadershipProgression: 10, // Growing from member to leader
  impactEvidence: 15, // Documented impact
};

/**
 * Scoring rules for spike strength
 */
export const SPIKE_SCORING_RULES = {
  tier1_present: {
    points: 40,
    description: 'Has at least one Tier 1 achievement in spike domain',
  },
  multiple_tier2: {
    points: 20,
    threshold: 2,
    description: 'Has 2+ Tier 2 achievements in spike domain',
  },
  four_year_commitment: {
    points: 15,
    description: 'Primary spike activity pursued all 4 years',
  },
  three_year_commitment: {
    points: 10,
    description: 'Primary spike activity pursued 3 years',
  },
  leadership_progression: {
    points: 10,
    description: 'Grew from participant to leader in spike domain',
  },
  verified_impact: {
    points: 15,
    description: 'Has verifiable impact metrics',
  },
  supporting_activities: {
    points: 10,
    per_activity: 3,
    max: 10,
    description: 'Has supporting activities that reinforce spike',
  },
};

// ============================================================================
// NARRATIVE CLARITY SCORING
// ============================================================================

export const NARRATIVE_CLARITY_RULES = {
  single_sentence_summary: {
    points: 25,
    description: 'Can be summarized in one clear sentence',
    test: 'If you can\'t describe in one sentence, narrative is unclear',
  },
  activities_reinforce: {
    points: 25,
    description: 'Each activity strengthens the overall narrative',
  },
  no_contradictions: {
    points: 25,
    description: 'No activities that contradict the stated direction',
  },
  authentic_origin: {
    points: 15,
    description: 'Clear reason WHY this student cares about their spike',
  },
  future_vision: {
    points: 10,
    description: 'Activities connect to future goals',
  },
};

// ============================================================================
// RED FLAGS FOR COHERENCE
// ============================================================================

export const COHERENCE_RED_FLAGS = {
  senior_year_spike: {
    deduction: -20,
    description: 'Spike activities all started in senior year',
    severity: 'high',
  },
  contradictory_majors: {
    deduction: -15,
    description: 'Activities suggest different majors than stated',
    severity: 'moderate',
  },
  no_progression: {
    deduction: -10,
    description: 'Same level of involvement across all years',
    severity: 'moderate',
  },
  quantity_over_quality: {
    deduction: -15,
    description: '10+ activities with no Tier 1 or 2',
    severity: 'moderate',
  },
  hours_impossible: {
    deduction: -25,
    description: 'Claimed hours exceed hours in a week',
    severity: 'critical',
  },
  resume_padding_pattern: {
    deduction: -20,
    description: 'Many short-term involvements with titles',
    severity: 'high',
  },
  all_school_based: {
    deduction: -5,
    description: 'No activities extend beyond school',
    severity: 'low',
  },
};

// ============================================================================
// GREEN FLAGS FOR COHERENCE
// ============================================================================

export const COHERENCE_GREEN_FLAGS = {
  clear_spike: {
    bonus: 20,
    description: 'Obvious area of deep expertise',
  },
  multi_year_progression: {
    bonus: 15,
    description: 'Clear growth over multiple years',
  },
  activities_synergize: {
    bonus: 15,
    description: 'Activities build on each other',
  },
  external_validation: {
    bonus: 10,
    description: 'Achievements recognized outside school',
  },
  unique_niche: {
    bonus: 15,
    description: 'Carved out distinctive position',
  },
  impact_documented: {
    bonus: 10,
    description: 'Can prove impact with evidence',
  },
  leadership_earned: {
    bonus: 10,
    description: 'Leadership came from demonstrated excellence',
  },
};

// ============================================================================
// TWO-SENTENCE PITCH TEMPLATES
// ============================================================================

export const PITCH_TEMPLATES = {
  research_scientist:
    'A [adjective] [field] researcher who [major achievement] while [secondary activity]. Their work on [topic] has [impact/recognition].',

  tech_builder:
    'A self-driven builder who created [product] used by [number] [users/people] while [secondary achievement]. They combine technical skill with [complementary quality].',

  entrepreneur:
    'A teenage entrepreneur who [business achievement] while [secondary activity]. Their venture has [revenue/users/impact] and demonstrates [quality].',

  community_builder:
    'The founder of [organization] that has [impact metric] while [secondary activity]. Their leadership has [outcome/recognition].',

  writer_intellectual:
    'A [adjective] writer whose work on [theme] has been [publication/recognition] while [secondary activity]. Their voice [distinctive quality].',

  policy_advocate:
    'A [adjective] advocate who [policy/civic achievement] while [secondary activity]. Their work on [issue] has [impact/recognition].',

  performing_artist:
    'A [instrument/discipline] [performer level] who [major achievement] while [secondary activity]. Their artistry combines [quality] with [complementary element].',

  visual_artist:
    'A [medium] artist whose [work description] has been [exhibition/recognition] while [secondary activity]. Their work explores [theme/vision].',

  athlete_leader:
    'A [sport] [achievement level] and team leader who [athletic achievement] while [secondary activity]. Their leadership extends to [community impact].',

  healthcare_servant:
    'A future healthcare provider who has [clinical experience] while [research/community work]. Their commitment to medicine shows through [specific example].',

  environmental_champion:
    'An environmental advocate who [major achievement] while [secondary activity]. Their work on [issue] has led to [impact/outcome].',

  default:
    'A [adjective] student who has [primary achievement] while [secondary activity]. Their [quality] is demonstrated through [evidence].',
};

// ============================================================================
// PROFILE ARCHETYPE DETECTION
// ============================================================================

export interface ProfileArchetype {
  primary: SpikeType | 'well_rounded' | 'scattered';
  secondary?: SpikeType;
  strength: 'exceptional' | 'strong' | 'moderate' | 'weak';
  fit: 'excellent' | 'good' | 'moderate' | 'poor';
}

export const ARCHETYPE_DETECTION_RULES = {
  exceptional_spike: {
    criteria: 'Tier 1 achievement + 3+ years + aligned supporting activities',
    result: 'Strong spike profile, highly competitive for selective schools',
  },
  strong_spike: {
    criteria: 'Multiple Tier 2 + 3+ years + some aligned supporting',
    result: 'Clear spike, competitive for selective schools',
  },
  emerging_spike: {
    criteria: 'Tier 2-3 achievements + 2+ years + developing focus',
    result: 'Spike forming, needs strengthening for selective schools',
  },
  well_rounded: {
    criteria: 'Multiple Tier 3 across different areas, no clear spike',
    result: 'Traditional profile, less competitive at spike-focused schools',
  },
  scattered: {
    criteria: 'Many activities, no depth, no clear direction',
    result: 'Needs significant focus to be competitive',
  },
};

// ============================================================================
// STRATEGIC RECOMMENDATIONS
// ============================================================================

export interface SpikeRecommendations {
  immediate: string[]; // What to do now
  shortTerm: string[]; // Next 3-6 months
  longTerm: string[]; // Next 1-2 years
  toStop: string[]; // Activities to deprioritize
  toDeepen: string[]; // Activities to invest more in
  toAdd: string[]; // Complementary activities to consider
}

export const RECOMMENDATION_TEMPLATES = {
  strengthen_spike: [
    'Pursue [specific competition/achievement] in your spike area',
    'Seek external validation through [competition/publication/exhibition]',
    'Connect with mentors in [field] for deeper involvement',
    'Document and share your work more publicly',
  ],
  add_coherence: [
    'Consider dropping [unrelated activity] to focus on spike',
    'Find ways to connect [activity] to your main narrative',
    'Add [complementary activity] that reinforces your spike',
    'Seek leadership in activities aligned with your spike',
  ],
  build_from_scratch: [
    'Identify your genuine passion - what would you do without grades?',
    'Start with one activity and go deep rather than wide',
    'Seek competitive validation in your chosen area',
    'Build over time - don\'t try to create a spike in senior year',
  ],
  leverage_existing: [
    'Your [activity] can become a spike with [specific steps]',
    'Combine [activity A] and [activity B] into coherent narrative',
    'Seek higher-level achievement in [current activity]',
    'Add [specific activity] to strengthen your profile',
  ],
};

// ============================================================================
// EXPORT
// ============================================================================

export const spikeDetectionSystem = {
  SPIKE_DEFINITIONS,
  COHERENCE_SCORE_INTERPRETATION,
  SPIKE_STRENGTH_WEIGHTS,
  SPIKE_SCORING_RULES,
  NARRATIVE_CLARITY_RULES,
  COHERENCE_RED_FLAGS,
  COHERENCE_GREEN_FLAGS,
  PITCH_TEMPLATES,
  ARCHETYPE_DETECTION_RULES,
  RECOMMENDATION_TEMPLATES,
};
