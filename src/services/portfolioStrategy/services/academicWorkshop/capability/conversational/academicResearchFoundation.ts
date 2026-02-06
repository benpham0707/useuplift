/**
 * Academic Research Foundation
 *
 * THE SINGLE SOURCE OF TRUTH for all academic advising data.
 *
 * This file contains ONLY verified, cited data from official sources.
 * Every data point includes:
 * 1. The value
 * 2. The source citation
 * 3. Verification level (official, published, consensus, estimate)
 *
 * NEVER add data without a verifiable source.
 * If exact data doesn't exist, use qualitative statements or mark as 'estimate'.
 *
 * Sources Used:
 * - College Board AP Score Distributions (Official)
 * - NACAC State of College Admission Reports (Official)
 * - Common Data Set (CDS) from individual colleges (Official)
 * - Published research and institutional reports
 */

// ============================================================================
// TYPES FOR VERIFIED DATA
// ============================================================================

/**
 * Verification levels for data points
 */
export type VerificationLevel =
  | 'official'    // Government data, College Board, CDS, NACAC official publications
  | 'published'   // Peer-reviewed research, institutional reports with methodology
  | 'consensus'   // Widely accepted by practitioners but not officially measured
  | 'estimate';   // Our educated estimate based on experience - CLEARLY MARKED

/**
 * Citation for every data point
 */
export interface Citation {
  source: string;           // Organization (e.g., "College Board")
  document: string;         // Specific document (e.g., "2024 AP Score Distributions")
  url?: string;             // Direct URL if available
  accessDate: string;       // When we accessed/verified this data
  verification: VerificationLevel;
  notes?: string;           // Any caveats or clarifications
}

/**
 * A research-backed data point with full citation
 */
export interface VerifiedDataPoint<T> {
  value: T;
  citation: Citation;
}

/**
 * For data that varies or has ranges
 */
export interface VerifiedRange {
  low: number;
  typical: number;
  high: number;
  citation: Citation;
}

// ============================================================================
// OFFICIAL CITATIONS
// ============================================================================

const CITATIONS = {
  collegeBoard2024: {
    source: 'College Board',
    document: '2024 AP Score Distributions by Subject',
    url: 'https://apcentral.collegeboard.org/media/pdf/ap-score-distributions-by-subject-2024.pdf',
    accessDate: '2026-02-01',
    verification: 'official' as VerificationLevel,
    notes: 'Official College Board data from May 2024 exams; 5.7M exams from 3M students',
  },

  nacacFactors2024: {
    source: 'NACAC (National Association for College Admission Counseling)',
    document: 'Factors in College Admission',
    url: 'https://www.nacacnet.org/factors-in-college-admission/',
    accessDate: '2026-02-01',
    verification: 'official' as VerificationLevel,
    notes: 'Survey of college admissions officers on importance of various factors',
  },

  stanfordCDS2024: {
    source: 'Stanford University',
    document: 'Common Data Set 2024-2025',
    url: 'https://irds.stanford.edu/data-findings/cds',
    accessDate: '2026-02-01',
    verification: 'official' as VerificationLevel,
  },

  harvardCDS2024: {
    source: 'Harvard University',
    document: 'Common Data Set 2024-2025',
    url: 'https://oira.harvard.edu/common-data-set/',
    accessDate: '2026-02-01',
    verification: 'official' as VerificationLevel,
  },

  mitAdmissions: {
    source: 'MIT Admissions',
    document: 'On APs (Official MIT Admissions Blog)',
    url: 'https://mitadmissions.org/blogs/entry/on_aps_1/',
    accessDate: '2026-02-01',
    verification: 'official' as VerificationLevel,
    notes: 'MIT does NOT publish specific percentages of admits who took particular APs',
  },

  industryConsensus: {
    source: 'Industry Consensus',
    document: 'Widely accepted admissions counseling practices',
    accessDate: '2026-02-01',
    verification: 'consensus' as VerificationLevel,
    notes: 'Based on practitioner experience; not officially measured',
  },
} as const;

// ============================================================================
// COLLEGE BOARD AP STATISTICS (OFFICIAL - 2024)
// ============================================================================

export interface APExamStatistics {
  examName: string;
  passRate: VerifiedDataPoint<number>;      // Score 3+
  fiveRate: VerifiedDataPoint<number>;      // Score 5
  meanScore: VerifiedDataPoint<number>;
  totalTestTakers?: VerifiedDataPoint<number>;
}

/**
 * Official College Board AP Statistics - 2024
 * Source: https://apcentral.collegeboard.org/media/pdf/ap-score-distributions-by-subject-2024.pdf
 */
export const AP_EXAM_STATISTICS: Record<string, APExamStatistics> = {
  'AP Calculus BC': {
    examName: 'AP Calculus BC',
    passRate: {
      value: 0.809,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.477,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.92,
      citation: CITATIONS.collegeBoard2024,
    },
    totalTestTakers: {
      value: 148191,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP Calculus AB': {
    examName: 'AP Calculus AB',
    passRate: {
      value: 0.644,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.214,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.22,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP Computer Science A': {
    examName: 'AP Computer Science A',
    passRate: {
      value: 0.672,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.256,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.18,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP Statistics': {
    examName: 'AP Statistics',
    passRate: {
      value: 0.618,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.175,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 2.96,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP Physics C: Mechanics': {
    examName: 'AP Physics C: Mechanics',
    passRate: {
      value: 0.763,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.285,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.49,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP Physics 1': {
    examName: 'AP Physics 1',
    passRate: {
      value: 0.473,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.102,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 2.59,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP Biology': {
    examName: 'AP Biology',
    passRate: {
      value: 0.683,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.168,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.15,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP Chemistry': {
    examName: 'AP Chemistry',
    passRate: {
      value: 0.756,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.179,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.31,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  // ========== ENGLISH COURSES ==========
  'AP English Literature': {
    examName: 'AP English Literature and Composition',
    passRate: {
      value: 0.724,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.137,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.16,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP English Language': {
    examName: 'AP English Language and Composition',
    passRate: {
      value: 0.546,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.098,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 2.79,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  // ========== HISTORY COURSES ==========
  'AP US History': {
    examName: 'AP United States History',
    passRate: {
      value: 0.722,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.128,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.22,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP World History': {
    examName: 'AP World History: Modern',
    passRate: {
      value: 0.637,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.119,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.11,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP European History': {
    examName: 'AP European History',
    passRate: {
      value: 0.716,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.131,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.23,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  // ========== ECONOMICS COURSES ==========
  'AP Microeconomics': {
    examName: 'AP Microeconomics',
    passRate: {
      value: 0.676,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.229,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.24,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP Macroeconomics': {
    examName: 'AP Macroeconomics',
    passRate: {
      value: 0.651,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.207,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.13,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  // ========== GOVERNMENT/POLITICS COURSES ==========
  'AP US Government': {
    examName: 'AP United States Government and Politics',
    passRate: {
      value: 0.730,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.243,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.38,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP Comparative Government': {
    examName: 'AP Comparative Government and Politics',
    passRate: {
      value: 0.730,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.160,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.18,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  // ========== SOCIAL SCIENCES ==========
  'AP Psychology': {
    examName: 'AP Psychology',
    passRate: {
      value: 0.617,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.192,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 2.97,
      citation: CITATIONS.collegeBoard2024,
    },
    totalTestTakers: {
      value: 320164,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  // ========== ARTS COURSES ==========
  'AP Art History': {
    examName: 'AP Art History',
    passRate: {
      value: 0.627,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.139,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 2.99,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP Music Theory': {
    examName: 'AP Music Theory',
    passRate: {
      value: 0.602,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.190,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.01,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  // ========== ENVIRONMENTAL SCIENCE ==========
  'AP Environmental Science': {
    examName: 'AP Environmental Science',
    passRate: {
      value: 0.541,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.092,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 2.80,
      citation: CITATIONS.collegeBoard2024,
    },
    totalTestTakers: {
      value: 236579,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  // ========== COMPUTER SCIENCE ==========
  'AP Computer Science Principles': {
    examName: 'AP Computer Science Principles',
    passRate: {
      value: 0.640,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.109,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 2.90,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  // ========== MATH ==========
  'AP Precalculus': {
    examName: 'AP Precalculus',
    passRate: {
      value: 0.757,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.259,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.42,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  // ========== PHYSICS ==========
  'AP Physics 2': {
    examName: 'AP Physics 2: Algebra-Based',
    passRate: {
      value: 0.705,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.191,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.20,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP Physics C: E&M': {
    examName: 'AP Physics C: Electricity and Magnetism',
    passRate: {
      value: 0.716,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.352,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.53,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  // ========== SOCIAL STUDIES ==========
  'AP Human Geography': {
    examName: 'AP Human Geography',
    passRate: {
      value: 0.562,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.179,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 2.83,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP African American Studies': {
    examName: 'AP African American Studies',
    passRate: {
      value: 0.726,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.142,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.22,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  // ========== AP CAPSTONE ==========
  'AP Research': {
    examName: 'AP Research',
    passRate: {
      value: 0.861,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.126,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.35,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP Seminar': {
    examName: 'AP Seminar',
    passRate: {
      value: 0.857,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.094,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.20,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  // ========== STUDIO ART & DESIGN ==========
  'AP 2D Art and Design': {
    examName: 'AP 2-D Art and Design',
    passRate: {
      value: 0.828,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.112,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.31,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP 3D Art and Design': {
    examName: 'AP 3-D Art and Design',
    passRate: {
      value: 0.719,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.062,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.04,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP Drawing': {
    examName: 'AP Drawing',
    passRate: {
      value: 0.838,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.151,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.42,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  // ========== WORLD LANGUAGES ==========
  'AP Spanish Language': {
    examName: 'AP Spanish Language and Culture',
    passRate: {
      value: 0.830,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.212,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.54,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP Spanish Literature': {
    examName: 'AP Spanish Literature and Culture',
    passRate: {
      value: 0.670,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.102,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.00,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP French Language': {
    examName: 'AP French Language and Culture',
    passRate: {
      value: 0.723,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.145,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.20,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP German Language': {
    examName: 'AP German Language and Culture',
    passRate: {
      value: 0.698,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.261,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.32,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP Italian Language': {
    examName: 'AP Italian Language and Culture',
    passRate: {
      value: 0.724,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.226,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.30,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP Japanese Language': {
    examName: 'AP Japanese Language and Culture',
    passRate: {
      value: 0.762,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.491,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 3.68,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP Chinese Language': {
    examName: 'AP Chinese Language and Culture',
    passRate: {
      value: 0.886,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.533,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 4.08,
      citation: CITATIONS.collegeBoard2024,
    },
  },

  'AP Latin': {
    examName: 'AP Latin',
    passRate: {
      value: 0.565,
      citation: CITATIONS.collegeBoard2024,
    },
    fiveRate: {
      value: 0.119,
      citation: CITATIONS.collegeBoard2024,
    },
    meanScore: {
      value: 2.76,
      citation: CITATIONS.collegeBoard2024,
    },
  },
};

// ============================================================================
// NACAC ADMISSIONS FACTOR RESEARCH (OFFICIAL)
// ============================================================================

export type ImportanceLevel = 'considerable' | 'moderate' | 'limited' | 'none';

export interface AdmissionsFactorData {
  factor: string;
  percentConsiderable: VerifiedDataPoint<number>;
  percentModerate?: VerifiedDataPoint<number>;
  trend?: string;
  notes?: string;
}

/**
 * NACAC Research on What Colleges Value
 * Source: https://www.nacacnet.org/factors-in-college-admission/
 *
 * This is OFFICIAL survey data from admissions officers.
 */
export const NACAC_ADMISSIONS_FACTORS: AdmissionsFactorData[] = [
  {
    factor: 'Grades in College Prep Courses',
    percentConsiderable: {
      value: 0.768,
      citation: CITATIONS.nacacFactors2024,
    },
    notes: 'Highest rated factor across all college types',
  },
  {
    factor: 'Total High School Grades/GPA',
    percentConsiderable: {
      value: 0.741,
      citation: CITATIONS.nacacFactors2024,
    },
  },
  {
    factor: 'Strength/Rigor of Curriculum',
    percentConsiderable: {
      value: 0.638,
      citation: CITATIONS.nacacFactors2024,
    },
    trend: 'Increasing: 51% (2017) → 64% (2023)',
    notes: 'Private colleges weight this more heavily',
  },
  {
    factor: 'Standardized Test Scores',
    percentConsiderable: {
      value: 0.05,
      citation: CITATIONS.nacacFactors2024,
    },
    trend: 'Dramatic decline from ~50% pre-COVID to 5% in 2024',
    notes: 'Reflects widespread test-optional policies',
  },
  {
    factor: 'Character/Personal Qualities',
    percentConsiderable: {
      value: 0.70, // Combined "considerably" + "moderately" important
      citation: CITATIONS.nacacFactors2024,
    },
    notes: 'Selective colleges rate this higher than less selective',
  },
];

// ============================================================================
// COMMON DATA SET (CDS) - COLLEGE-SPECIFIC DATA
// ============================================================================

export type CDSImportanceRating =
  | 'very_important'
  | 'important'
  | 'considered'
  | 'not_considered';

export interface CollegeCDSData {
  collegeName: string;
  factors: Record<string, VerifiedDataPoint<CDSImportanceRating>>;
  acceptanceRate?: VerifiedDataPoint<number>;
  avgGPA?: VerifiedDataPoint<number>;
  notes?: string;
}

/**
 * Common Data Set information from specific colleges
 * CDS is the OFFICIAL source for how colleges rate admissions factors
 */
export const COLLEGE_CDS_DATA: Record<string, CollegeCDSData> = {
  stanford: {
    collegeName: 'Stanford University',
    factors: {
      rigorOfCurriculum: {
        value: 'very_important',
        citation: CITATIONS.stanfordCDS2024,
      },
      gpa: {
        value: 'very_important',
        citation: CITATIONS.stanfordCDS2024,
      },
      essays: {
        value: 'very_important',
        citation: CITATIONS.stanfordCDS2024,
      },
      recommendations: {
        value: 'very_important',
        citation: CITATIONS.stanfordCDS2024,
      },
      extracurriculars: {
        value: 'very_important',
        citation: CITATIONS.stanfordCDS2024,
      },
      talentAbility: {
        value: 'very_important',
        citation: CITATIONS.stanfordCDS2024,
      },
      characterPersonalQualities: {
        value: 'very_important',
        citation: CITATIONS.stanfordCDS2024,
      },
    },
    notes: 'Stanford rates nearly all qualitative factors as "very important"',
  },

  harvard: {
    collegeName: 'Harvard University',
    factors: {
      rigorOfCurriculum: {
        value: 'very_important',
        citation: CITATIONS.harvardCDS2024,
      },
      gpa: {
        value: 'very_important',
        citation: CITATIONS.harvardCDS2024,
      },
    },
    acceptanceRate: {
      value: 0.0365,
      citation: CITATIONS.harvardCDS2024,
    },
    avgGPA: {
      value: 4.21,
      citation: CITATIONS.harvardCDS2024,
    },
    notes: 'Weighted GPA average',
  },
};

// ============================================================================
// WHAT WE DON'T KNOW (HONEST ACKNOWLEDGMENT)
// ============================================================================

/**
 * IMPORTANT: Statistics we CANNOT verify
 *
 * Many college counseling sources cite statistics like:
 * - "94% of CS admits took AP Calculus BC"
 * - "87% of CS admits took AP Computer Science A"
 * - "78% had GitHub projects"
 *
 * These CANNOT be verified because:
 * 1. Colleges don't publish AP course data for admitted students
 * 2. MIT explicitly states they don't publish this information
 * 3. No official source tracks this across "top-20" schools
 *
 * Instead of fabricating statistics, we use:
 * 1. NACAC data on what colleges VALUE (rigor importance)
 * 2. CDS data on how specific colleges rate factors
 * 3. Qualitative statements about expectations
 */
export const UNVERIFIABLE_CLAIMS = {
  disclaimer:
    'The following types of statistics CANNOT be verified and should NOT be cited as facts',
  examples: [
    'Percentage of admitted students who took specific AP courses',
    'Percentage of admits with GitHub profiles',
    'Specific percentages for "top-20" or "Ivy" admits',
  ],
  whatToUseInstead: [
    'NACAC research on importance of curriculum rigor (64% rate as "considerable")',
    'CDS data showing specific colleges rate rigor as "very important"',
    'Qualitative statements: "Selective colleges generally expect..."',
    'College Board official AP pass rates to assess course difficulty',
  ],
};

// ============================================================================
// VERIFIED GUIDANCE STATEMENTS
// ============================================================================

/**
 * Statements we CAN make based on verified research
 */
export const VERIFIED_GUIDANCE = {
  curriculumRigor: {
    statement:
      'Curriculum rigor is increasingly important in college admissions. NACAC surveys show 64% of colleges now rate it as "considerably important," up from 51% in 2017.',
    citation: CITATIONS.nacacFactors2024,
    implication:
      'Taking the most rigorous courses available (like BC over AB) sends a clear signal.',
  },

  selectiveCollegesRigor: {
    statement:
      'Selective colleges like Stanford and Harvard officially rate "rigor of secondary school record" as "very important" in their Common Data Sets.',
    citation: CITATIONS.stanfordCDS2024,
    implication:
      'For competitive applicants, challenging yourself with harder courses matters.',
  },

  bcVsAb: {
    statement:
      'AP Calculus BC has a higher pass rate (80.9%) than AB (64.4%) because students who take BC are generally better prepared. BC covers more material (equivalent to Calc I + II vs. just Calc I) and typically earns more college credit.',
    citation: CITATIONS.collegeBoard2024,
    implication:
      'For STEM-bound students with strong math backgrounds, BC is the stronger choice academically and for admissions signaling.',
  },

  physicsCVsPhysics1: {
    statement:
      'AP Physics C: Mechanics has a 76.3% pass rate vs. Physics 1\'s 47.3%. Physics C uses calculus and covers material more deeply, while Physics 1 is algebra-based and broader.',
    citation: CITATIONS.collegeBoard2024,
    implication:
      'For students who have taken calculus, Physics C is often easier AND more impressive to colleges.',
  },

  testOptional: {
    statement:
      'Only 5% of colleges now rate standardized tests as "considerably important" for admissions, down from ~50% pre-COVID.',
    citation: CITATIONS.nacacFactors2024,
    implication:
      'While test scores still matter at some schools, course rigor and grades have become relatively more important.',
  },

  // ========== ENGLISH & HUMANITIES GUIDANCE ==========
  englishComparison: {
    statement:
      'AP English Literature has a higher pass rate (72.4%) than AP English Language (54.6%). Literature focuses on deep textual analysis and literary criticism, while Language emphasizes rhetorical analysis and persuasive writing.',
    citation: CITATIONS.collegeBoard2024,
    implication:
      'For students interested in humanities, literature, or law, both courses demonstrate different valuable skills. Many strong students take both.',
  },

  historyComparison: {
    statement:
      'AP US History (72.2% pass rate) and AP European History (71.6%) are close in difficulty, while AP World History has a 63.7% pass rate. World History students are typically younger (sophomores) and cover more content in less depth.',
    citation: CITATIONS.collegeBoard2024,
    implication:
      'History courses show analytical and writing ability. For humanities or social science majors, a strong history AP signals college readiness.',
  },

  // ========== ECONOMICS GUIDANCE ==========
  economicsRecommendation: {
    statement:
      'AP Microeconomics (67.6% pass rate, 22.9% earn 5s) and AP Macroeconomics (65.1% pass rate, 20.7% earn 5s) are both achievable for students with strong math backgrounds. Micro is often considered more intuitive for first-time economics students.',
    citation: CITATIONS.collegeBoard2024,
    implication:
      'For business or economics majors, taking both demonstrates commitment to the field. Macro provides context for global issues while Micro builds analytical decision-making skills.',
  },

  // ========== PSYCHOLOGY GUIDANCE ==========
  psychologyRecommendation: {
    statement:
      'AP Psychology has a 61.7% pass rate with over 320,000 test takers annually - one of the most popular AP exams. The 19.2% rate of 5s suggests strong performers can excel.',
    citation: CITATIONS.collegeBoard2024,
    implication:
      'For psychology, neuroscience, or pre-med students, AP Psychology provides foundational knowledge. Pair it with AP Biology for a stronger science profile.',
  },

  // ========== ARTS GUIDANCE ==========
  artsRecommendation: {
    statement:
      'AP Art History (62.7% pass rate) and AP Music Theory (60.2% pass rate) demonstrate serious engagement with the arts beyond portfolio or performance work. These theoretical courses show academic rigor in an arts context.',
    citation: CITATIONS.collegeBoard2024,
    implication:
      'For performing/visual arts applicants, these courses balance creative work with scholarly depth. Conservatories and art schools value both practical skill and theoretical understanding.',
  },

  // ========== ENVIRONMENTAL SCIENCE GUIDANCE ==========
  environmentalScienceRecommendation: {
    statement:
      'AP Environmental Science has a 54.1% pass rate and only 9.2% earn 5s - making it one of the harder APs by score distribution. The content spans biology, chemistry, and earth science.',
    citation: CITATIONS.collegeBoard2024,
    implication:
      'For environmental science or sustainability majors, this course demonstrates interdisciplinary thinking. However, for competitive science programs, AP Biology or Chemistry may be weighted more heavily.',
  },

  // ========== COMPUTER SCIENCE GUIDANCE ==========
  csComparison: {
    statement:
      'AP Computer Science A (67.2% pass rate, 25.6% earn 5s) is significantly more rigorous than AP Computer Science Principles (64.0% pass rate, 10.9% earn 5s). CSA teaches Java programming with OOP concepts, while CSP is a broader survey of computing concepts with a create task.',
    citation: CITATIONS.collegeBoard2024,
    implication:
      'For CS majors, CSA is the stronger signal. CSP is appropriate for students exploring CS interest or as a complement, but won\'t satisfy most college CS prerequisites.',
  },

  // ========== PHYSICS PATHWAY GUIDANCE ==========
  physicsPathway: {
    statement:
      'AP Physics has four courses with very different profiles: Physics 1 (47.3% pass rate), Physics 2 (70.5%), Physics C: Mechanics (76.3%), Physics C: E&M (71.6%). Physics 1 has the lowest pass rate of any AP course. Physics C: E&M has the highest five-rate at 35.2%.',
    citation: CITATIONS.collegeBoard2024,
    implication:
      'The typical engineering pathway is Physics C: Mechanics → Physics C: E&M. Pre-med students often take Physics 1 → Physics 2. Physics C courses require calculus but are more manageable for mathematically strong students.',
  },

  // ========== WORLD LANGUAGE GUIDANCE ==========
  worldLanguageRecommendation: {
    statement:
      'AP Chinese (88.6% pass rate, 53.3% earn 5s) and AP Japanese (76.2% pass rate, 49.1% earn 5s) have high pass rates heavily influenced by heritage speakers. AP Latin has the lowest language pass rate at 56.5%. AP Spanish Language (83.0% pass rate) is the most commonly taken language AP.',
    citation: CITATIONS.collegeBoard2024,
    implication:
      'Language AP scores should be interpreted in context - heritage speaker populations significantly skew Chinese and Japanese results. For non-heritage speakers, achieving a 4 or 5 in these courses is especially impressive. Latin demonstrates classical education commitment valued by humanities programs.',
  },

  // ========== AP CAPSTONE GUIDANCE ==========
  capstoneRecommendation: {
    statement:
      'AP Seminar (85.7% pass rate) and AP Research (86.1% pass rate) are part of the AP Capstone Diploma program. Both have high pass rates but very low 5-rates (9.4% and 12.6% respectively), reflecting portfolio/presentation-based assessment rather than traditional exams.',
    citation: CITATIONS.collegeBoard2024,
    implication:
      'The AP Capstone Diploma (Seminar + Research + 4 other APs) demonstrates college-level research and communication skills. Especially valuable for students applying to research universities or honors programs.',
  },

  // ========== PRECALCULUS GUIDANCE ==========
  precalculusRecommendation: {
    statement:
      'AP Precalculus is a new course (first exam 2024) with a 75.7% pass rate and 25.9% earning 5s. It bridges the gap between Algebra 2 and Calculus, covering polynomial, exponential, logarithmic, and trigonometric functions.',
    citation: CITATIONS.collegeBoard2024,
    implication:
      'For students not ready for AP Calculus, AP Precalculus provides AP rigor while building the foundation for calculus. It\'s a strong option for juniors planning to take AP Calculus senior year.',
  },

  // ========== HUMAN GEOGRAPHY GUIDANCE ==========
  humanGeographyRecommendation: {
    statement:
      'AP Human Geography has a 56.2% pass rate with 17.9% earning 5s. It is often the first AP course students take (commonly in 9th or 10th grade) and covers population, culture, political organization, agriculture, and urbanization.',
    citation: CITATIONS.collegeBoard2024,
    implication:
      'As a first AP experience, Human Geography builds skills for later AP social studies courses. Strong performance signals readiness for AP World History, AP US History, and AP Government.',
  },

  // ========== STUDIO ART GUIDANCE ==========
  studioArtRecommendation: {
    statement:
      'AP Drawing (83.8% pass rate, 15.1% earn 5s) has the highest pass rate among studio art courses. AP 2D Art and Design (82.8% pass rate) and AP 3D Art and Design (71.9% pass rate, only 6.2% earn 5s) are portfolio-based with no traditional exam.',
    citation: CITATIONS.collegeBoard2024,
    implication:
      'Studio art APs are scored by portfolio review, making them ideal for students building art school applications. The sustained investigation component demonstrates ability to develop ideas over time - a key skill art schools seek.',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get AP exam statistics with citation
 */
export function getAPStatistics(examName: string): APExamStatistics | undefined {
  return AP_EXAM_STATISTICS[examName];
}

/**
 * Get a verified guidance statement
 */
export function getVerifiedGuidance(
  topic: keyof typeof VERIFIED_GUIDANCE
): (typeof VERIFIED_GUIDANCE)[typeof topic] {
  return VERIFIED_GUIDANCE[topic];
}

/**
 * Format a citation for display
 */
export function formatCitation(citation: Citation): string {
  return `Source: ${citation.source}, "${citation.document}"${citation.url ? ` (${citation.url})` : ''} [${citation.verification}]`;
}

/**
 * Get NACAC factor data
 */
export function getNACACFactor(factorName: string): AdmissionsFactorData | undefined {
  return NACAC_ADMISSIONS_FACTORS.find(
    (f) => f.factor.toLowerCase().includes(factorName.toLowerCase())
  );
}

/**
 * Get college CDS data
 */
export function getCollegeCDS(collegeName: string): CollegeCDSData | undefined {
  const key = collegeName.toLowerCase();
  return COLLEGE_CDS_DATA[key];
}

/**
 * Compare two AP exams with verified data
 */
export function compareAPExams(
  exam1Name: string,
  exam2Name: string
): {
  exam1: APExamStatistics | undefined;
  exam2: APExamStatistics | undefined;
  comparison: string;
} {
  const exam1 = AP_EXAM_STATISTICS[exam1Name];
  const exam2 = AP_EXAM_STATISTICS[exam2Name];

  if (!exam1 || !exam2) {
    return {
      exam1,
      exam2,
      comparison: 'Unable to compare - missing data for one or both exams.',
    };
  }

  const passRateDiff = Math.abs(exam1.passRate.value - exam2.passRate.value);
  const higherPassRate =
    exam1.passRate.value > exam2.passRate.value ? exam1.examName : exam2.examName;

  return {
    exam1,
    exam2,
    comparison: `${higherPassRate} has a higher pass rate (${Math.round(Math.max(exam1.passRate.value, exam2.passRate.value) * 100)}% vs ${Math.round(Math.min(exam1.passRate.value, exam2.passRate.value) * 100)}%). Pass rate difference: ${Math.round(passRateDiff * 100)} percentage points.`,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// Note: AP_EXAM_STATISTICS, NACAC_ADMISSIONS_FACTORS, COLLEGE_CDS_DATA,
// and VERIFIED_GUIDANCE are already exported inline with their declarations.
// Only export CITATIONS here since it's not exported inline.
export { CITATIONS };
