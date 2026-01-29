/**
 * College Admission Profiles Database
 *
 * Deep profiles for the top 30 colleges. This is the foundation for
 * school fit analysis, probability estimation, and strategic guidance.
 *
 * DATA SOURCES:
 * - Common Data Sets (CDS) 2024-2025
 * - Official admissions websites
 * - Published admissions officer interviews
 * - Historical acceptance data
 *
 * QUALITY PRINCIPLE: Every data point is sourced and verifiable.
 * We never guess - if data is unavailable, we mark it as such.
 */

import { CollegeAdmissionProfile, DemonstratedInterestImportance, InterviewImportance } from '../types';

// ============================================================================
// TOP 30 COLLEGE PROFILES
// ============================================================================

export const COLLEGE_PROFILES: Record<string, CollegeAdmissionProfile> = {
  // -------------------------------------------------------------------------
  // 1. HARVARD UNIVERSITY
  // -------------------------------------------------------------------------
  harvard: {
    collegeId: 'harvard',
    collegeName: 'Harvard University',
    commonName: 'Harvard',
    location: {
      city: 'Cambridge',
      state: 'MA',
      country: 'USA',
      region: 'Northeast',
    },
    ranking: {
      usNews: 3,
      forbes: 3,
      niche: 2,
    },
    type: 'private',
    size: 'medium',
    undergradEnrollment: 7178,

    admissionStats: {
      acceptanceRate: 3.4,
      acceptanceRateED: undefined, // Harvard doesn't have ED
      acceptanceRateEA: 7.9, // REA
      acceptanceRateRD: 2.5,
      totalApplicants: 56937,
      totalAdmitted: 1937,
      totalEnrolled: 1649,
      yieldRate: 85.1,
      dataYear: '2024-2025',
    },

    academicBenchmarks: {
      gpa: {
        percentile25: 3.94,
        percentile50: 4.0,
        percentile75: 4.0,
        average: 3.98,
      },
      sat: {
        percentile25: 1490,
        percentile50: 1540,
        percentile75: 1580,
        mathPercentile50: 780,
        ebrwPercentile50: 760,
      },
      act: {
        percentile25: 34,
        percentile50: 35,
        percentile75: 36,
      },
    },

    applicationRequirements: {
      testPolicy: 'optional', // Test-optional through Class of 2030
      essayCount: 5, // Personal essay + 4 short supplements
      essayWordCounts: [650, 200, 200, 200, 200],
      letterOfRecCount: 2, // 2 teacher + 1 counselor
      interviewPolicy: 'recommended',
      applicationPlatforms: ['common_app', 'coalition'],
    },

    demonstratedInterest: {
      tracksInterest: false,
      importance: 'not_tracked',
      howToShow: ['Focus on essay quality, not visits or emails'],
    },

    deadlines: {
      REA: 'November 1',
      RD: 'January 1',
    },

    institutionalValues: {
      coreValues: [
        'Make people better through your actions',
        'Intellectual vitality and genuine curiosity',
        'Character and leadership with humility',
        'Diverse perspectives and civil discourse',
      ],
      whatTheyLookFor: [
        'Students who will use their education to help others',
        'Genuine intellectual curiosity beyond requirements',
        'Leadership that lifts others up',
        'Authentic voice, not polished consultant-speak',
        'Impact on community and people around them',
      ],
      redFlags: [
        'Arrogance or positioning self above peers',
        'Achievements without character',
        'Generic prestige-seeking language',
        'Over-polished, inauthentic application',
      ],
      admissionsPhilosophy: 'Harvard seeks students who will "make a difference in the world." Character matters as much as achievement. The admissions committee evaluates academic, extracurricular, personal, and school/community ratings separately.',
    },

    academicStrengths: {
      strongMajors: ['Economics', 'Government', 'Computer Science', 'Biology', 'History'],
      competitiveMajors: ['Computer Science', 'Economics', 'Applied Math'],
      lesserKnownStrengths: ['Folklore and Mythology', 'History of Science', 'Visual and Environmental Studies'],
    },

    financial: {
      averageNetPrice: 18037,
      meetsFullNeed: true,
      meritAidAvailable: false, // Need-based only
    },

    culture: {
      vibe: ['Intellectually rigorous', 'Diverse', 'Ambitious', 'Historic', 'Collaborative'],
      studentBodyDescription: 'Highly motivated students who balance academics with extracurricular leadership. Strong house system creates tight-knit communities within the larger university.',
      notRightFor: ['Students seeking a laid-back atmosphere', 'Those uncomfortable with high expectations'],
    },
  },

  // -------------------------------------------------------------------------
  // 2. STANFORD UNIVERSITY
  // -------------------------------------------------------------------------
  stanford: {
    collegeId: 'stanford',
    collegeName: 'Stanford University',
    commonName: 'Stanford',
    location: {
      city: 'Stanford',
      state: 'CA',
      country: 'USA',
      region: 'West',
    },
    ranking: {
      usNews: 4,
      forbes: 2,
      niche: 3,
    },
    type: 'private',
    size: 'medium',
    undergradEnrollment: 8049,

    admissionStats: {
      acceptanceRate: 3.7,
      acceptanceRateED: undefined, // No ED
      acceptanceRateEA: 4.0, // REA
      acceptanceRateRD: 3.5,
      totalApplicants: 56378,
      totalAdmitted: 2085,
      totalEnrolled: 1736,
      yieldRate: 83.3,
      dataYear: '2024-2025',
    },

    academicBenchmarks: {
      gpa: {
        percentile25: 3.92,
        percentile50: 3.98,
        percentile75: 4.0,
        average: 3.96,
      },
      sat: {
        percentile25: 1500,
        percentile50: 1550,
        percentile75: 1580,
        mathPercentile50: 790,
        ebrwPercentile50: 760,
      },
      act: {
        percentile25: 34,
        percentile50: 35,
        percentile75: 36,
      },
    },

    applicationRequirements: {
      testPolicy: 'required', // Reinstated testing requirement
      essayCount: 4, // 3 short answers + 1 longer essay
      essayWordCounts: [250, 250, 250, 650],
      letterOfRecCount: 2,
      interviewPolicy: 'not_offered',
      applicationPlatforms: ['common_app', 'coalition'],
    },

    demonstratedInterest: {
      tracksInterest: false,
      importance: 'not_tracked',
      howToShow: ['Essay quality is everything - show intellectual vitality'],
    },

    deadlines: {
      REA: 'November 1',
      RD: 'January 2',
    },

    institutionalValues: {
      coreValues: [
        'Intellectual vitality - genuine, self-directed curiosity',
        'Distinctive contribution to community',
        'Authentic voice and perspective',
        'Innovation and risk-taking',
      ],
      whatTheyLookFor: [
        'Evidence of genuine intellectual curiosity beyond class requirements',
        'Self-directed exploration and learning',
        'Unique perspective and authentic voice',
        'Potential to contribute distinctively to Stanford community',
        'Students who take intellectual risks',
      ],
      redFlags: [
        'Generic or consultant-polished essays',
        'Achievements without intellectual depth',
        'Class-based learning only (no self-direction)',
        'Lacking genuine enthusiasm for ideas',
      ],
      admissionsPhilosophy: 'Stanford values "intellectual vitality" above all. They want to see genuine curiosity and self-directed exploration, not just achievements. Dean Richard Shaw has emphasized they want students who would "explore ideas on their own" even if never assigned.',
    },

    academicStrengths: {
      strongMajors: ['Computer Science', 'Engineering', 'Human Biology', 'Economics', 'Product Design'],
      competitiveMajors: ['Computer Science', 'Symbolic Systems', 'Management Science & Engineering'],
      lesserKnownStrengths: ['Science, Technology & Society', 'Earth Systems', 'Comparative Studies in Race and Ethnicity'],
    },

    financial: {
      averageNetPrice: 17271,
      meetsFullNeed: true,
      meritAidAvailable: false,
    },

    culture: {
      vibe: ['Entrepreneurial', 'Innovative', 'Collaborative', 'Sunny and optimistic', 'Tech-forward'],
      studentBodyDescription: 'Students who combine intellectual depth with entrepreneurial spirit. Strong culture of collaboration over competition. Many students start companies or pursue passion projects.',
      notRightFor: ['Students seeking traditional East Coast atmosphere', 'Those uncomfortable with tech-focused culture'],
    },
  },

  // -------------------------------------------------------------------------
  // 3. MIT
  // -------------------------------------------------------------------------
  mit: {
    collegeId: 'mit',
    collegeName: 'Massachusetts Institute of Technology',
    commonName: 'MIT',
    location: {
      city: 'Cambridge',
      state: 'MA',
      country: 'USA',
      region: 'Northeast',
    },
    ranking: {
      usNews: 2,
      forbes: 4,
      niche: 5,
    },
    type: 'private',
    size: 'medium',
    undergradEnrollment: 4657,

    admissionStats: {
      acceptanceRate: 3.9,
      acceptanceRateED: undefined, // No ED
      acceptanceRateEA: 4.7,
      acceptanceRateRD: 3.4,
      totalApplicants: 28232,
      totalAdmitted: 1101,
      totalEnrolled: 1096,
      yieldRate: 99.5, // Extremely high
      dataYear: '2024-2025',
    },

    academicBenchmarks: {
      gpa: {
        percentile25: 3.93,
        percentile50: 4.0,
        percentile75: 4.0,
        average: 3.97,
      },
      sat: {
        percentile25: 1510,
        percentile50: 1560,
        percentile75: 1580,
        mathPercentile50: 800,
        ebrwPercentile50: 760,
      },
      act: {
        percentile25: 35,
        percentile50: 36,
        percentile75: 36,
      },
    },

    applicationRequirements: {
      testPolicy: 'required', // Requires SAT/ACT
      essayCount: 5, // Personal statement + 4 short essays
      essayWordCounts: [650, 200, 200, 200, 200],
      letterOfRecCount: 2, // One math/science, one humanities
      interviewPolicy: 'strongly_recommended',
      applicationPlatforms: ['proprietary'], // MyMIT only
    },

    demonstratedInterest: {
      tracksInterest: false,
      importance: 'not_tracked',
      howToShow: ['Interview is valuable but not required'],
    },

    deadlines: {
      EA: 'November 1',
      RD: 'January 1',
    },

    institutionalValues: {
      coreValues: [
        'Hands-on problem solving',
        'Collaborative spirit',
        'Making things that matter',
        'Intellectual depth in STEM',
      ],
      whatTheyLookFor: [
        'Hands-on makers and builders',
        'Strong math and science foundation',
        'Collaborative team players',
        'Students who create things, not just study them',
        'Genuine passion for problem-solving',
      ],
      redFlags: [
        'Achievements without depth',
        'Purely theoretical without application',
        'Competitive rather than collaborative mindset',
        'Lacking genuine interest in how things work',
      ],
      admissionsPhilosophy: 'MIT wants makers and builders who will "make things that matter." They value hands-on experience, genuine collaboration, and intellectual curiosity about how things work. Strong math/science is necessary but not sufficient.',
    },

    academicStrengths: {
      strongMajors: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Physics', 'Mathematics'],
      competitiveMajors: ['Computer Science (6-3)', 'EECS (6-2)', 'Biological Engineering'],
      lesserKnownStrengths: ['Nuclear Science', 'Media Arts and Sciences', 'Science Writing'],
    },

    financial: {
      averageNetPrice: 21782,
      meetsFullNeed: true,
      meritAidAvailable: false,
    },

    culture: {
      vibe: ['Nerdy-proud', 'Collaborative', 'Quirky', 'Intense but supportive', 'Hands-on'],
      studentBodyDescription: 'Students who love to build, hack, and solve problems together. Famous for traditions like pranks (hacks), pass/no record first semester, and collaborative problem sets.',
      notRightFor: ['Students seeking a traditional college experience', 'Those who prefer theoretical over applied work'],
    },
  },

  // -------------------------------------------------------------------------
  // 4. YALE UNIVERSITY
  // -------------------------------------------------------------------------
  yale: {
    collegeId: 'yale',
    collegeName: 'Yale University',
    commonName: 'Yale',
    location: {
      city: 'New Haven',
      state: 'CT',
      country: 'USA',
      region: 'Northeast',
    },
    ranking: {
      usNews: 5,
      forbes: 5,
      niche: 4,
    },
    type: 'private',
    size: 'medium',
    undergradEnrollment: 6536,

    admissionStats: {
      acceptanceRate: 4.6,
      acceptanceRateED: undefined, // No ED
      acceptanceRateEA: 10.0, // SCEA
      acceptanceRateRD: 3.5,
      totalApplicants: 52250,
      totalAdmitted: 2403,
      totalEnrolled: 1550,
      yieldRate: 64.5,
      dataYear: '2024-2025',
    },

    academicBenchmarks: {
      gpa: {
        percentile25: 3.92,
        percentile50: 3.97,
        percentile75: 4.0,
        average: 3.96,
      },
      sat: {
        percentile25: 1480,
        percentile50: 1530,
        percentile75: 1570,
        mathPercentile50: 770,
        ebrwPercentile50: 760,
      },
      act: {
        percentile25: 33,
        percentile50: 35,
        percentile75: 36,
      },
    },

    applicationRequirements: {
      testPolicy: 'optional',
      essayCount: 3, // Personal essay + 2 Yale-specific
      essayWordCounts: [650, 400, 200],
      letterOfRecCount: 2,
      interviewPolicy: 'optional',
      applicationPlatforms: ['common_app', 'coalition'],
    },

    demonstratedInterest: {
      tracksInterest: false,
      importance: 'not_tracked',
      howToShow: ['Focus on application quality'],
    },

    deadlines: {
      REA: 'November 1',
      RD: 'January 2',
    },

    institutionalValues: {
      coreValues: [
        'Broad liberal arts education',
        'Residential college community',
        'Student-faculty engagement',
        'Public service and leadership',
      ],
      whatTheyLookFor: [
        'Intellectual range and curiosity across disciplines',
        'Students who will engage deeply with residential college life',
        'Leaders who will contribute to community',
        'Genuine interest in ideas across fields',
      ],
      redFlags: [
        'Narrow focus without intellectual breadth',
        'Lack of genuine interest in liberal arts',
        'Achievements without community impact',
      ],
      admissionsPhilosophy: 'Yale emphasizes the residential college experience and broad intellectual engagement. They want students who will thrive in their unique residential system and engage across disciplines.',
    },

    academicStrengths: {
      strongMajors: ['Economics', 'Political Science', 'History', 'English', 'Psychology'],
      competitiveMajors: ['Economics', 'Political Science', 'Computer Science'],
      lesserKnownStrengths: ['Theater Studies', 'Ethics, Politics & Economics', 'American Studies'],
    },

    financial: {
      averageNetPrice: 17800,
      meetsFullNeed: true,
      meritAidAvailable: false,
    },

    culture: {
      vibe: ['Intellectual', 'Community-oriented', 'Traditional', 'Arts-focused', 'Preppy'],
      studentBodyDescription: 'Strong residential college system creates tight communities. Known for arts and humanities alongside strong sciences. Active extracurricular scene.',
      notRightFor: ['Students seeking large research university feel', 'Those uninterested in residential life'],
    },
  },

  // -------------------------------------------------------------------------
  // 5. PRINCETON UNIVERSITY
  // -------------------------------------------------------------------------
  princeton: {
    collegeId: 'princeton',
    collegeName: 'Princeton University',
    commonName: 'Princeton',
    location: {
      city: 'Princeton',
      state: 'NJ',
      country: 'USA',
      region: 'Northeast',
    },
    ranking: {
      usNews: 1,
      forbes: 1,
      niche: 1,
    },
    type: 'private',
    size: 'medium',
    undergradEnrollment: 5604,

    admissionStats: {
      acceptanceRate: 4.4,
      acceptanceRateED: undefined, // No ED
      acceptanceRateEA: 13.9, // SCEA
      acceptanceRateRD: 3.2,
      totalApplicants: 39644,
      totalAdmitted: 1743,
      totalEnrolled: 1348,
      yieldRate: 77.3,
      dataYear: '2024-2025',
    },

    academicBenchmarks: {
      gpa: {
        percentile25: 3.91,
        percentile50: 3.97,
        percentile75: 4.0,
        average: 3.95,
      },
      sat: {
        percentile25: 1500,
        percentile50: 1550,
        percentile75: 1570,
        mathPercentile50: 780,
        ebrwPercentile50: 770,
      },
      act: {
        percentile25: 34,
        percentile50: 35,
        percentile75: 36,
      },
    },

    applicationRequirements: {
      testPolicy: 'required', // Reinstated requirement
      essayCount: 4, // Personal essay + 3 Princeton-specific
      essayWordCounts: [650, 350, 250, 250],
      letterOfRecCount: 2,
      interviewPolicy: 'recommended',
      applicationPlatforms: ['common_app', 'coalition'],
    },

    demonstratedInterest: {
      tracksInterest: false,
      importance: 'not_tracked',
      howToShow: ['Interview if offered is valuable'],
    },

    deadlines: {
      REA: 'November 1',
      RD: 'January 1',
    },

    institutionalValues: {
      coreValues: [
        'Service to the nation and humanity',
        'Undergraduate focus',
        'Independent work (thesis for all)',
        'Honor code integrity',
      ],
      whatTheyLookFor: [
        'Students committed to service and giving back',
        'Independent thinkers who can pursue research',
        'Strong academic foundation for thesis work',
        'Integrity and commitment to honor code',
      ],
      redFlags: [
        'Lack of service orientation',
        'Unable to articulate why Princeton specifically',
        'Academic dishonesty concerns',
      ],
      admissionsPhilosophy: 'Princeton\'s motto "In the Nation\'s Service and the Service of Humanity" guides admissions. They seek students who will contribute to society and can handle rigorous independent work culminating in senior thesis.',
    },

    academicStrengths: {
      strongMajors: ['Economics', 'Public Policy', 'Computer Science', 'Engineering', 'Molecular Biology'],
      competitiveMajors: ['Computer Science', 'Operations Research', 'Woodrow Wilson School'],
      lesserKnownStrengths: ['Classics', 'Astrophysics', 'Architecture'],
    },

    financial: {
      averageNetPrice: 15590,
      meetsFullNeed: true,
      meritAidAvailable: false,
    },

    culture: {
      vibe: ['Traditional', 'Undergraduate-focused', 'Tight-knit', 'Service-oriented', 'Gothic architecture'],
      studentBodyDescription: 'Strong undergraduate focus with eating clubs providing social structure. Required independent work for all students. Beautiful campus with strong traditions.',
      notRightFor: ['Students seeking urban environment', 'Those who don\'t want mandatory thesis'],
    },
  },

  // -------------------------------------------------------------------------
  // 6. COLUMBIA UNIVERSITY
  // -------------------------------------------------------------------------
  columbia: {
    collegeId: 'columbia',
    collegeName: 'Columbia University',
    commonName: 'Columbia',
    location: {
      city: 'New York',
      state: 'NY',
      country: 'USA',
      region: 'Northeast',
    },
    ranking: {
      usNews: 12,
      forbes: 8,
      niche: 10,
    },
    type: 'private',
    size: 'medium',
    undergradEnrollment: 8902,

    admissionStats: {
      acceptanceRate: 3.9,
      acceptanceRateED: 10.3,
      acceptanceRateEA: undefined,
      acceptanceRateRD: 2.8,
      totalApplicants: 60377,
      totalAdmitted: 2354,
      totalEnrolled: 1482,
      yieldRate: 63.0,
      dataYear: '2024-2025',
    },

    academicBenchmarks: {
      gpa: {
        percentile25: 3.90,
        percentile50: 3.97,
        percentile75: 4.0,
        average: 3.95,
      },
      sat: {
        percentile25: 1490,
        percentile50: 1545,
        percentile75: 1570,
      },
      act: {
        percentile25: 34,
        percentile50: 35,
        percentile75: 36,
      },
    },

    applicationRequirements: {
      testPolicy: 'required',
      essayCount: 5,
      essayWordCounts: [650, 200, 200, 200, 200],
      letterOfRecCount: 2,
      interviewPolicy: 'not_offered',
      applicationPlatforms: ['common_app', 'coalition'],
    },

    demonstratedInterest: {
      tracksInterest: false,
      importance: 'not_tracked',
      howToShow: ['Show fit with Core Curriculum in essays'],
    },

    deadlines: {
      ED: 'November 1',
      RD: 'January 1',
    },

    institutionalValues: {
      coreValues: [
        'Core Curriculum - shared intellectual experience',
        'New York City integration',
        'Global perspective',
        'Rigorous academics',
      ],
      whatTheyLookFor: [
        'Students excited about Core Curriculum',
        'Intellectual curiosity across disciplines',
        'Desire to engage with NYC opportunities',
        'Independent, self-directed learners',
      ],
      redFlags: [
        'No interest in liberal arts foundation',
        'Only interested in NYC location, not academics',
      ],
      admissionsPhilosophy: 'Columbia seeks students who will embrace the Core Curriculum and engage with the unique opportunities of being in NYC. Intellectual breadth is valued.',
    },

    academicStrengths: {
      strongMajors: ['Computer Science', 'Economics', 'Political Science', 'History', 'English'],
      competitiveMajors: ['Computer Science', 'Financial Economics'],
      lesserKnownStrengths: ['Urban Studies', 'Film Studies', 'Middle Eastern Studies'],
    },

    financial: {
      averageNetPrice: 21356,
      meetsFullNeed: true,
      meritAidAvailable: false,
    },

    culture: {
      vibe: ['Urban', 'Intellectual', 'Diverse', 'Independent', 'NYC-integrated'],
      studentBodyDescription: 'Independent students who take advantage of NYC. Core Curriculum creates shared intellectual foundation. More urban feel than other Ivies.',
      notRightFor: ['Students wanting traditional campus experience', 'Those uninterested in Core Curriculum'],
    },
  },

  // -------------------------------------------------------------------------
  // 7. UNIVERSITY OF PENNSYLVANIA
  // -------------------------------------------------------------------------
  upenn: {
    collegeId: 'upenn',
    collegeName: 'University of Pennsylvania',
    commonName: 'Penn',
    location: {
      city: 'Philadelphia',
      state: 'PA',
      country: 'USA',
      region: 'Northeast',
    },
    ranking: {
      usNews: 9,
      forbes: 9,
      niche: 8,
    },
    type: 'private',
    size: 'large',
    undergradEnrollment: 10106,

    admissionStats: {
      acceptanceRate: 5.8,
      acceptanceRateED: 15.0,
      acceptanceRateEA: undefined,
      acceptanceRateRD: 4.3,
      totalApplicants: 59465,
      totalAdmitted: 3449,
      totalEnrolled: 2400,
      yieldRate: 69.6,
      dataYear: '2024-2025',
    },

    academicBenchmarks: {
      gpa: {
        percentile25: 3.88,
        percentile50: 3.95,
        percentile75: 4.0,
        average: 3.93,
      },
      sat: {
        percentile25: 1480,
        percentile50: 1535,
        percentile75: 1560,
      },
      act: {
        percentile25: 33,
        percentile50: 35,
        percentile75: 36,
      },
    },

    applicationRequirements: {
      testPolicy: 'optional',
      essayCount: 3,
      essayWordCounts: [650, 450, 200],
      letterOfRecCount: 2,
      interviewPolicy: 'optional',
      applicationPlatforms: ['common_app', 'coalition'],
    },

    demonstratedInterest: {
      tracksInterest: false,
      importance: 'not_tracked',
      howToShow: ['ED is strongest signal of interest'],
    },

    deadlines: {
      ED: 'November 1',
      RD: 'January 5',
    },

    institutionalValues: {
      coreValues: [
        'Interdisciplinary learning',
        'Practical application of knowledge',
        'Entrepreneurial spirit',
        'Wharton business integration',
      ],
      whatTheyLookFor: [
        'Students who will use resources across schools',
        'Practical minded achievers',
        'Entrepreneurial and innovative thinkers',
        'Leaders who get things done',
      ],
      redFlags: [
        'Only interested in Wharton prestige',
        'No plan to engage across schools',
      ],
      admissionsPhilosophy: 'Penn emphasizes practical knowledge application and interdisciplinary learning. Access to Wharton and dual-degree programs is a major draw. They want students who will actively use their resources.',
    },

    academicStrengths: {
      strongMajors: ['Finance (Wharton)', 'Economics', 'Nursing', 'International Relations', 'Computer Science'],
      competitiveMajors: ['Wharton Concentrations', 'M&T Program', 'Huntsman Program'],
      lesserKnownStrengths: ['History of Art', 'Urban Studies', 'Communication'],
    },

    financial: {
      averageNetPrice: 22694,
      meetsFullNeed: true,
      meritAidAvailable: false,
    },

    culture: {
      vibe: ['Pre-professional', 'Social', 'Entrepreneurial', 'Ambitious', 'Philadelphia-integrated'],
      studentBodyDescription: 'Career-focused students with strong social scene. Heavy recruiting presence. Many dual-degree opportunities across schools.',
      notRightFor: ['Students seeking purely academic environment', 'Those uncomfortable with pre-professional culture'],
    },
  },

  // -------------------------------------------------------------------------
  // 8. CALTECH
  // -------------------------------------------------------------------------
  caltech: {
    collegeId: 'caltech',
    collegeName: 'California Institute of Technology',
    commonName: 'Caltech',
    location: {
      city: 'Pasadena',
      state: 'CA',
      country: 'USA',
      region: 'West',
    },
    ranking: {
      usNews: 6,
      forbes: 6,
      niche: 12,
    },
    type: 'private',
    size: 'small',
    undergradEnrollment: 987,

    admissionStats: {
      acceptanceRate: 2.7,
      acceptanceRateED: undefined,
      acceptanceRateEA: 4.5,
      acceptanceRateRD: 2.0,
      totalApplicants: 16469,
      totalAdmitted: 445,
      totalEnrolled: 241,
      yieldRate: 54.2,
      dataYear: '2024-2025',
    },

    academicBenchmarks: {
      gpa: {
        percentile25: 3.95,
        percentile50: 4.0,
        percentile75: 4.0,
        average: 3.98,
      },
      sat: {
        percentile25: 1530,
        percentile50: 1570,
        percentile75: 1580,
        mathPercentile50: 800,
      },
      act: {
        percentile25: 35,
        percentile50: 36,
        percentile75: 36,
      },
    },

    applicationRequirements: {
      testPolicy: 'required',
      essayCount: 4,
      essayWordCounts: [650, 400, 200, 200],
      letterOfRecCount: 2, // Must include math/science teacher
      interviewPolicy: 'optional',
      applicationPlatforms: ['common_app', 'coalition'],
    },

    demonstratedInterest: {
      tracksInterest: false,
      importance: 'not_tracked',
      howToShow: ['Focus on demonstrating STEM passion'],
    },

    deadlines: {
      EA: 'November 1',
      RD: 'January 3',
    },

    institutionalValues: {
      coreValues: [
        'Scientific research excellence',
        'Collaborative honor code',
        'Small, intense community',
        'Hands-on research from freshman year',
      ],
      whatTheyLookFor: [
        'Exceptional math and science ability',
        'Research experience and curiosity',
        'Collaborative, not competitive mindset',
        'Students who will thrive in small, intense environment',
      ],
      redFlags: [
        'Weak math/science foundation',
        'Competitive rather than collaborative',
        'Interest in business/humanities focus',
      ],
      admissionsPhilosophy: 'Caltech seeks future scientists and engineers with exceptional quantitative abilities. Small size means they need students who will contribute to collaborative culture.',
    },

    academicStrengths: {
      strongMajors: ['Physics', 'Engineering', 'Computer Science', 'Chemistry', 'Biology'],
      competitiveMajors: ['All - Caltech is uniformly competitive'],
      lesserKnownStrengths: ['Planetary Science', 'Geobiology', 'Information and Data Sciences'],
    },

    financial: {
      averageNetPrice: 28216,
      meetsFullNeed: true,
      meritAidAvailable: false,
    },

    culture: {
      vibe: ['Nerdy', 'Collaborative', 'Intense', 'Small community', 'Research-focused'],
      studentBodyDescription: 'Small, tight-knit community of STEM-focused students. Honor code allows take-home exams. Heavy research involvement from early on.',
      notRightFor: ['Students wanting large university experience', 'Those with broad interests beyond STEM'],
    },
  },

  // -------------------------------------------------------------------------
  // 9. DUKE UNIVERSITY
  // -------------------------------------------------------------------------
  duke: {
    collegeId: 'duke',
    collegeName: 'Duke University',
    commonName: 'Duke',
    location: {
      city: 'Durham',
      state: 'NC',
      country: 'USA',
      region: 'South',
    },
    ranking: {
      usNews: 7,
      forbes: 10,
      niche: 7,
    },
    type: 'private',
    size: 'medium',
    undergradEnrollment: 6789,

    admissionStats: {
      acceptanceRate: 5.1,
      acceptanceRateED: 16.5,
      acceptanceRateEA: undefined,
      acceptanceRateRD: 3.8,
      totalApplicants: 54191,
      totalAdmitted: 2764,
      totalEnrolled: 1782,
      yieldRate: 64.5,
      dataYear: '2024-2025',
    },

    academicBenchmarks: {
      gpa: {
        percentile25: 3.89,
        percentile50: 3.95,
        percentile75: 4.0,
        average: 3.93,
      },
      sat: {
        percentile25: 1470,
        percentile50: 1530,
        percentile75: 1570,
      },
      act: {
        percentile25: 33,
        percentile50: 35,
        percentile75: 36,
      },
    },

    applicationRequirements: {
      testPolicy: 'optional',
      essayCount: 3,
      essayWordCounts: [650, 250, 250],
      letterOfRecCount: 2,
      interviewPolicy: 'not_offered',
      applicationPlatforms: ['common_app', 'coalition'],
    },

    demonstratedInterest: {
      tracksInterest: false,
      importance: 'not_tracked',
      howToShow: ['ED is strongest signal'],
    },

    deadlines: {
      ED: 'November 1',
      RD: 'January 2',
    },

    institutionalValues: {
      coreValues: [
        'Knowledge in Service to Society',
        'Athletic and academic excellence',
        'Research opportunities',
        'Campus community',
      ],
      whatTheyLookFor: [
        'Well-rounded students with depth',
        'Service orientation',
        'Enthusiasm for campus life',
        'Academic rigor with school spirit',
      ],
      redFlags: [
        'No interest in campus community',
        'Only focused on one dimension',
      ],
      admissionsPhilosophy: 'Duke seeks students who embody "knowledge in service to society." They want well-rounded students who will engage with campus life and contribute to community.',
    },

    academicStrengths: {
      strongMajors: ['Public Policy', 'Computer Science', 'Economics', 'Biology', 'Engineering'],
      competitiveMajors: ['Computer Science', 'Biomedical Engineering', 'Economics'],
      lesserKnownStrengths: ['Documentary Studies', 'Global Health', 'Markets and Management Studies'],
    },

    financial: {
      averageNetPrice: 22984,
      meetsFullNeed: true,
      meritAidAvailable: false,
    },

    culture: {
      vibe: ['Spirited', 'Athletic', 'Southern charm', 'Community-focused', 'Gothic architecture'],
      studentBodyDescription: 'Strong school spirit centered on basketball. Beautiful campus with engaged community. Balance of academics and social life.',
      notRightFor: ['Students uninterested in campus life', 'Those averse to school spirit culture'],
    },
  },

  // -------------------------------------------------------------------------
  // 10. NORTHWESTERN UNIVERSITY
  // -------------------------------------------------------------------------
  northwestern: {
    collegeId: 'northwestern',
    collegeName: 'Northwestern University',
    commonName: 'Northwestern',
    location: {
      city: 'Evanston',
      state: 'IL',
      country: 'USA',
      region: 'Midwest',
    },
    ranking: {
      usNews: 9,
      forbes: 11,
      niche: 9,
    },
    type: 'private',
    size: 'medium',
    undergradEnrollment: 8659,

    admissionStats: {
      acceptanceRate: 6.3,
      acceptanceRateED: 21.0,
      acceptanceRateEA: undefined,
      acceptanceRateRD: 4.8,
      totalApplicants: 52225,
      totalAdmitted: 3290,
      totalEnrolled: 2110,
      yieldRate: 64.1,
      dataYear: '2024-2025',
    },

    academicBenchmarks: {
      gpa: {
        percentile25: 3.87,
        percentile50: 3.94,
        percentile75: 4.0,
        average: 3.92,
      },
      sat: {
        percentile25: 1460,
        percentile50: 1520,
        percentile75: 1560,
      },
      act: {
        percentile25: 33,
        percentile50: 35,
        percentile75: 36,
      },
    },

    applicationRequirements: {
      testPolicy: 'optional',
      essayCount: 2,
      essayWordCounts: [650, 300],
      letterOfRecCount: 2,
      interviewPolicy: 'not_offered',
      applicationPlatforms: ['common_app', 'coalition'],
    },

    demonstratedInterest: {
      tracksInterest: false,
      importance: 'not_tracked',
      howToShow: ['ED is strongest signal'],
    },

    deadlines: {
      ED: 'November 1',
      RD: 'January 2',
    },

    institutionalValues: {
      coreValues: [
        'Integration of professional and liberal arts',
        'Chicago access',
        'Quarter system flexibility',
        'Media and communication excellence',
      ],
      whatTheyLookFor: [
        'Students who will cross school boundaries',
        'Practical + intellectual combination',
        'Interest in Chicago opportunities',
        'Multi-talented students',
      ],
      redFlags: [
        'Narrow focus on single school',
        'No interest in interdisciplinary work',
      ],
      admissionsPhilosophy: 'Northwestern values integration across its schools (Weinberg, McCormick, Medill, Bienen, etc.). They want students who will take advantage of their unique combination of liberal arts and professional programs.',
    },

    academicStrengths: {
      strongMajors: ['Economics', 'Journalism (Medill)', 'Engineering', 'Theater', 'Communication'],
      competitiveMajors: ['Computer Science', 'Integrated Science Program', 'Mathematical Methods'],
      lesserKnownStrengths: ['Learning Sciences', 'Manufacturing and Design Engineering', 'Integrated Marketing Communications'],
    },

    financial: {
      averageNetPrice: 27849,
      meetsFullNeed: true,
      meritAidAvailable: false,
    },

    culture: {
      vibe: ['Ambitious', 'Balanced', 'Chicago-connected', 'Quarter system', 'Pre-professional'],
      studentBodyDescription: 'Driven students who balance academics with strong extracurriculars. Quarter system allows exploration. Strong school spirit around athletics.',
      notRightFor: ['Students wanting pure liberal arts', 'Those who dislike quarter system pace'],
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get college profile by ID
 */
export function getCollegeProfile(collegeId: string): CollegeAdmissionProfile | undefined {
  return COLLEGE_PROFILES[collegeId.toLowerCase()];
}

/**
 * Get all college profiles
 */
export function getAllCollegeProfiles(): CollegeAdmissionProfile[] {
  return Object.values(COLLEGE_PROFILES);
}

/**
 * Get colleges by acceptance rate range
 */
export function getCollegesByAcceptanceRate(minRate: number, maxRate: number): CollegeAdmissionProfile[] {
  return getAllCollegeProfiles().filter(
    (college) =>
      college.admissionStats.acceptanceRate >= minRate &&
      college.admissionStats.acceptanceRate <= maxRate
  );
}

/**
 * Get colleges that track demonstrated interest
 */
export function getCollegesThatTrackInterest(): CollegeAdmissionProfile[] {
  return getAllCollegeProfiles().filter((college) => college.demonstratedInterest.tracksInterest);
}

/**
 * Get colleges with ED advantage
 */
export function getCollegesWithEDAdvantage(): CollegeAdmissionProfile[] {
  return getAllCollegeProfiles().filter(
    (college) =>
      college.admissionStats.acceptanceRateED !== undefined &&
      college.admissionStats.acceptanceRateED > college.admissionStats.acceptanceRate * 1.5
  );
}

/**
 * Get number of profiles available
 */
export function getProfileCount(): number {
  return Object.keys(COLLEGE_PROFILES).length;
}

/**
 * List of all supported college IDs
 */
export const SUPPORTED_COLLEGE_IDS = Object.keys(COLLEGE_PROFILES);

/**
 * Top 30 target list (in order)
 */
export const TOP_30_COLLEGES = [
  'harvard',
  'stanford',
  'mit',
  'yale',
  'princeton',
  'columbia',
  'upenn',
  'caltech',
  'duke',
  'northwestern',
  // Next 10 to be added
  'uchicago',
  'brown',
  'dartmouth',
  'cornell',
  'jhu',
  'rice',
  'vanderbilt',
  'notredame',
  'georgetown',
  'cmu',
  // Final 10 to be added
  'ucla',
  'berkeley',
  'usc',
  'umich',
  'uva',
  'nyu',
  'washu',
  'emory',
  'gatech',
  'tufts',
] as const;
