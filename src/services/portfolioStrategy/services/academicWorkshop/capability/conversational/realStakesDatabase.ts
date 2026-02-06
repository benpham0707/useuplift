/**
 * Real Stakes Database
 *
 * Contains data about AP scores, course choices, and admissions factors.
 *
 * IMPORTANT: DATA VERIFICATION LEVELS
 * - VERIFIED: Official data from College Board, NACAC, or Common Data Sets
 * - ESTIMATED: Industry consensus or reasonable estimates - CLEARLY MARKED
 *
 * The specific percentages for "X% of admits took Y course" are ESTIMATES
 * because colleges do not publish this data. Use qualitative guidance
 * from academicResearchFoundation.ts for verified data.
 *
 * See academicResearchFoundation.ts for fully verified, cited data.
 */

// Import verified data
import {
  AP_EXAM_STATISTICS,
  VERIFIED_GUIDANCE,
  NACAC_ADMISSIONS_FACTORS,
  getAPStatistics,
} from './academicResearchFoundation';

// ============================================================================
// AP SCORE TIER IMPLICATIONS
// ============================================================================

export interface APScoreTier {
  score: 1 | 2 | 3 | 4 | 5;
  percentOfTestTakers: number;
  collegeCreditPolicy: string;
  admissionsPerception: string;
  realityCheck: string;
  whatItSignals: string;
}

/**
 * What colleges REALLY think about each AP score
 * (Not what College Board marketing says)
 */
export const AP_SCORE_PERCEPTIONS: Record<1 | 2 | 3 | 4 | 5, APScoreTier> = {
  5: {
    score: 5,
    percentOfTestTakers: 15, // varies by exam, this is rough average
    collegeCreditPolicy: 'Credit at virtually all colleges, often 8+ units',
    admissionsPerception: 'Strong confirmation of ability. Expected from top applicants.',
    realityCheck: 'At elite schools, a 5 is the baseline expectation, not exceptional.',
    whatItSignals: 'Mastery of college-level material; can handle advanced coursework'
  },
  4: {
    score: 4,
    percentOfTestTakers: 20,
    collegeCreditPolicy: 'Credit at most colleges, some selective schools require 5',
    admissionsPerception: 'Solid performance. Shows competence without question.',
    realityCheck: 'A 4 in a hard AP (BC, Physics C) is viewed better than a 5 in an easier one.',
    whatItSignals: 'Well-prepared for college work; demonstrated commitment'
  },
  3: {
    score: 3,
    percentOfTestTakers: 25,
    collegeCreditPolicy: 'Credit at many public universities; often rejected at privates',
    admissionsPerception: '"They passed, but..." - raises questions about readiness.',
    realityCheck: 'A 3 says "struggled but survived." Selective colleges notice.',
    whatItSignals: 'May have overreached OR external factors affected performance'
  },
  2: {
    score: 2,
    percentOfTestTakers: 20,
    collegeCreditPolicy: 'No credit anywhere',
    admissionsPerception: 'Concerning. Why did they take it? Poor judgment or poor preparation.',
    realityCheck: 'Better to take Honors and excel than AP and get a 2.',
    whatItSignals: 'Mismatch between ambition and preparation'
  },
  1: {
    score: 1,
    percentOfTestTakers: 20,
    collegeCreditPolicy: 'No credit anywhere',
    admissionsPerception: 'Red flag. Either didn\'t prepare or shouldn\'t have been in the course.',
    realityCheck: 'This hurts more than not taking the AP at all.',
    whatItSignals: 'Serious judgment or preparation issues'
  }
};

/**
 * Get the perception comparison between two scores
 */
export function getScoreComparisonInsight(lowerScore: 3 | 4, higherScore: 4 | 5): string {
  if (lowerScore === 3 && higherScore === 4) {
    return `The jump from 3 to 4 isn't just one point - it's the difference between "passed" and "competent." Colleges view a 3 as "they tried" and a 4 as "they can do this." That perception shift matters more than the number.`;
  }
  if (lowerScore === 3 && higherScore === 5) {
    return `A 3 and a 5 tell completely different stories. A 3 says "I took the class." A 5 says "I mastered the material." For competitive applicants, the difference is between checking a box and building evidence of excellence.`;
  }
  if (lowerScore === 4 && higherScore === 5) {
    return `At most colleges, a 4 and 5 are treated similarly for credit. But at highly selective schools, a 5 is the expectation, and a 4 - especially in your intended area - might raise questions about why you didn't quite get there.`;
  }
  return '';
}

// ============================================================================
// PEER COMPARISON DATA BY MAJOR
// ============================================================================

/**
 * IMPORTANT DISCLAIMER ON ADMITTED STUDENT DATA
 *
 * The "percentTaking" values below are ESTIMATES based on industry consensus,
 * NOT official data. Colleges do NOT publish what percentage of admitted
 * students took specific AP courses.
 *
 * What IS verified (from NACAC):
 * - 64% of colleges rate "curriculum rigor" as considerably important
 * - Rigor importance has increased from 51% (2017) to 64% (2023)
 * - Stanford/Harvard rate rigor as "very important" in Common Data Sets
 *
 * Use these estimates for general guidance, but cite NACAC/CDS data
 * for specific claims about what colleges value.
 */
export interface AdmittedStudentProfile {
  major: string;
  collegeTier: 'ivy' | 'top_20' | 'top_50' | 'competitive';
  dataQuality: 'verified' | 'estimated' | 'industry_consensus';
  dataSource: string;
  expectedCourses: Array<{
    course: string;
    expectationLevel: 'essential' | 'strongly_expected' | 'recommended' | 'helpful';
    reasoning: string;
  }>;
  keyStrengthAreas: string[];
  keyInsight: string;
  verifiedFacts: string[]; // Things we CAN cite
}

export const ADMITTED_STUDENT_PROFILES: AdmittedStudentProfile[] = [
  // Computer Science
  {
    major: 'Computer Science',
    collegeTier: 'top_20',
    dataQuality: 'industry_consensus',
    dataSource: 'Based on admissions counselor experience and publicly available college expectations; specific percentages are estimates',
    expectedCourses: [
      {
        course: 'AP Calculus BC',
        expectationLevel: 'essential',
        reasoning: 'BC covers Calc I + II content; most CS programs require calculus. BC has 81% pass rate (College Board 2024) and earns more credit than AB.',
      },
      {
        course: 'AP Computer Science A',
        expectationLevel: 'strongly_expected',
        reasoning: 'Formal CS coursework validates interest. 68% pass rate (College Board 2024). Shows structured learning alongside personal projects.',
      },
      {
        course: 'AP Physics C: Mechanics',
        expectationLevel: 'recommended',
        reasoning: 'Physics C uses calculus (73% pass rate) vs Physics 1 (46% pass rate). Shows quantitative depth.',
      },
    ],
    keyStrengthAreas: [
      'Personal programming projects demonstrating initiative',
      'Participation in coding competitions (USACO, hackathons)',
      'Strong performance in math and science courses',
    ],
    keyInsight: 'NACAC research shows 64% of colleges rate curriculum rigor as "considerably important." For CS, this means taking the most rigorous math and science available—typically BC over AB, Physics C over Physics 1.',
    verifiedFacts: [
      'AP Calculus BC: 81% pass rate, 45% score 5 (College Board 2024)',
      'AP Computer Science A: 68% pass rate (College Board 2024)',
      'AP Physics C Mechanics: 73% pass rate vs Physics 1: 46% (College Board 2024)',
      'NACAC: 64% of colleges rate curriculum rigor as considerably important',
      'Stanford/Harvard rate rigor as "very important" (Common Data Set)',
    ],
  },

  // Engineering
  {
    major: 'Engineering',
    collegeTier: 'top_20',
    dataQuality: 'industry_consensus',
    dataSource: 'Based on engineering program prerequisites and counselor experience',
    expectedCourses: [
      {
        course: 'AP Calculus BC',
        expectationLevel: 'essential',
        reasoning: 'Engineering programs are calculus-intensive from day one. BC provides stronger preparation than AB.',
      },
      {
        course: 'AP Physics C: Mechanics',
        expectationLevel: 'essential',
        reasoning: 'Physics C is calculus-based—the same approach used in college engineering physics. Physics 1 is algebra-based.',
      },
      {
        course: 'AP Chemistry',
        expectationLevel: 'recommended',
        reasoning: 'Required for chemical, materials, and bioengineering tracks. Demonstrates broad science capability.',
      },
    ],
    keyStrengthAreas: [
      'Hands-on engineering projects (robotics, design competitions)',
      'Strong math and physics performance',
      'Research or internship experience',
    ],
    keyInsight: 'Engineering is fundamentally applied math and physics. Physics C (not Physics 1) signals serious preparation—the calculus-based approach matches what engineering programs teach.',
    verifiedFacts: [
      'AP Physics C Mechanics: 73% pass rate (College Board 2024)',
      'AP Physics 1: 46% pass rate (College Board 2024)',
      'Physics C uses calculus, which often makes problems more straightforward for prepared students',
      'NACAC: Curriculum rigor increasingly important in admissions',
    ],
  },

  // Pre-Med/Biology
  {
    major: 'Biology/Pre-Med',
    collegeTier: 'top_20',
    dataQuality: 'industry_consensus',
    dataSource: 'Based on medical school prerequisites and pre-med advising practices',
    expectedCourses: [
      {
        course: 'AP Biology',
        expectationLevel: 'essential',
        reasoning: 'Foundational course for biology/pre-med track. 64% pass rate (College Board 2024).',
      },
      {
        course: 'AP Chemistry',
        expectationLevel: 'essential',
        reasoning: 'Medical schools require chemistry. Taking both Bio and Chem shows commitment. 56% pass rate.',
      },
      {
        course: 'AP Calculus (AB or BC)',
        expectationLevel: 'recommended',
        reasoning: 'Many medical schools require calculus. Shows quantitative capability.',
      },
    ],
    keyStrengthAreas: [
      'Clinical experience (volunteering, shadowing)',
      'Research experience (lab work)',
      'Leadership in health-related organizations',
    ],
    keyInsight: 'Science APs are the baseline—most serious pre-med students take Bio AND Chem. What differentiates is clinical exposure and research that show you understand what medicine involves.',
    verifiedFacts: [
      'AP Biology: 64% pass rate (College Board 2024)',
      'AP Chemistry: 56% pass rate (College Board 2024)',
      'Medical schools require biology, chemistry, and often calculus',
    ],
  },

  // Business/Economics
  {
    major: 'Business/Economics',
    collegeTier: 'top_20',
    dataQuality: 'industry_consensus',
    dataSource: 'Based on business school preferences and economics program requirements',
    expectedCourses: [
      {
        course: 'AP Calculus (preferably BC)',
        expectationLevel: 'strongly_expected',
        reasoning: 'Economics and finance are increasingly quantitative. Calculus is required for most econ majors.',
      },
      {
        course: 'AP Statistics',
        expectationLevel: 'recommended',
        reasoning: 'Data-driven decision making is central to modern business. 64% pass rate.',
      },
      {
        course: 'AP Macroeconomics/Microeconomics',
        expectationLevel: 'recommended',
        reasoning: 'Demonstrates specific interest in economics. Shows you know what the field involves.',
      },
    ],
    keyStrengthAreas: [
      'Entrepreneurial projects or ventures',
      'Business competitions (DECA, FBLA)',
      'Leadership experience',
      'Quantitative skills',
    ],
    keyInsight: 'Top business programs want quantitative capability. The combination of calculus + statistics shows you can handle data-driven analysis. Pure humanities without math is a limitation.',
    verifiedFacts: [
      'AP Statistics: 64% pass rate (College Board 2024)',
      'AP Calculus BC: 81% pass rate (College Board 2024)',
      'Economics programs typically require calculus',
      'NACAC: Curriculum rigor rated considerably important by 64% of colleges',
    ],
  },
];

/**
 * Get admitted student profile for a given major
 */
export function getAdmittedProfile(major: string): AdmittedStudentProfile | undefined {
  const majorLower = major.toLowerCase();

  return ADMITTED_STUDENT_PROFILES.find(profile => {
    const profileMajorLower = profile.major.toLowerCase();
    return (
      majorLower.includes(profileMajorLower.split('/')[0]) ||
      profileMajorLower.includes(majorLower)
    );
  });
}

/**
 * Get specific AP course expectation for a major
 * Returns qualitative guidance since colleges don't publish admit course percentages
 */
export function getAPExpectationForMajor(major: string, courseName: string): {
  expectationLevel: 'essential' | 'strongly_expected' | 'recommended' | 'helpful';
  insight: string;
  verifiedData?: string;
} | undefined {
  const profile = getAdmittedProfile(major);
  if (!profile) return undefined;

  const courseData = profile.expectedCourses.find(c =>
    c.course.toLowerCase().includes(courseName.toLowerCase())
  );

  if (!courseData) return undefined;

  // Get verified AP stats if available
  const apStats = getAPStatistics(courseName);
  const verifiedData = apStats
    ? `${apStats.passRate.value}% pass rate, ${apStats.score5Rate.value}% score 5 (${apStats.passRate.citation.source} ${apStats.passRate.citation.document})`
    : undefined;

  // Generate qualitative insight based on expectation level
  let insight = '';
  switch (courseData.expectationLevel) {
    case 'essential':
      insight = `${courseName} is considered essential for ${major} applicants at competitive schools. ${courseData.reasoning}`;
      break;
    case 'strongly_expected':
      insight = `${courseName} is strongly expected for ${major} applicants. ${courseData.reasoning}`;
      break;
    case 'recommended':
      insight = `${courseName} is recommended for ${major} applicants. ${courseData.reasoning}`;
      break;
    case 'helpful':
      insight = `${courseName} is helpful but not required for ${major} applicants. ${courseData.reasoning}`;
      break;
  }

  return {
    expectationLevel: courseData.expectationLevel,
    insight,
    verifiedData,
  };
}

// ============================================================================
// COURSE CHOICE CONSEQUENCES
// ============================================================================

export interface CourseChoiceConsequence {
  choice: string;
  alternative: string;
  shortTermImpact: string;
  longTermImpact: string;
  admissionsPerception: string;
  dataPoint?: string;
}

/**
 * COURSE_CHOICE_CONSEQUENCES
 *
 * Data points are either:
 * - VERIFIED: Official College Board statistics with citations
 * - QUALITATIVE: Based on published college expectations (CDS, NACAC)
 *
 * We do NOT include fabricated percentages like "89% of MIT admits took X"
 * because this data is not published by colleges.
 */
export const COURSE_CHOICE_CONSEQUENCES: CourseChoiceConsequence[] = [
  {
    choice: 'AP Calculus AB',
    alternative: 'AP Calculus BC',
    shortTermImpact: 'AB is more manageable workload. BC covers additional topics (series, parametric equations).',
    longTermImpact: 'BC covers Calc I + II content. Strong BC scores often earn Calc III placement, saving a semester.',
    admissionsPerception: 'For STEM majors, selective colleges expect the most rigorous math available. AB when BC is offered signals less ambition.',
    dataPoint: 'VERIFIED: BC has 81% pass rate vs AB\'s 61% (College Board 2024). The higher rate reflects self-selection - prepared students find BC manageable.'
  },
  {
    choice: 'AP Physics 1',
    alternative: 'AP Physics C: Mechanics',
    shortTermImpact: 'Physics 1 is algebra-based and broader; C is calculus-based and deeper.',
    longTermImpact: 'Physics C aligns with college engineering physics. Physics 1 content is typically repeated in college.',
    admissionsPerception: 'For engineering applicants, Physics C signals serious preparation. Physics 1 is viewed as the non-STEM option.',
    dataPoint: 'VERIFIED: Physics C Mechanics has 73% pass rate vs Physics 1\'s 46% (College Board 2024). Calculus often makes physics problems more straightforward.'
  },
  {
    choice: 'Honors course',
    alternative: 'AP course',
    shortTermImpact: 'Honors is less risky to GPA. AP requires more time investment.',
    longTermImpact: 'AP gives college credit opportunity and signals college readiness.',
    admissionsPerception: 'NACAC research: 64% of colleges rate curriculum rigor as "considerably important" (2023). Admissions officers recalculate GPA with AP weighting.',
    dataPoint: 'VERIFIED: Stanford and Harvard both rate "rigor of secondary school record" as "very important" in Common Data Sets.'
  },
  {
    choice: 'Skip challenging course',
    alternative: 'Take challenging course with risk',
    shortTermImpact: 'Safer GPA, less stress in the short term.',
    longTermImpact: 'Missing prerequisites may require catch-up in college. Weaker preparation for college-level work.',
    admissionsPerception: 'NOT taking available rigor raises questions. Colleges look for "most demanding program available."',
    dataPoint: 'VERIFIED: Per NACAC, rigor importance increased from 51% (2017) to 64% (2023). Colleges increasingly value challenge-seeking.'
  }
];

/**
 * Get consequence comparison for a specific choice
 */
export function getCourseChoiceConsequence(choice: string): CourseChoiceConsequence | undefined {
  const choiceLower = choice.toLowerCase();
  return COURSE_CHOICE_CONSEQUENCES.find(c =>
    c.choice.toLowerCase().includes(choiceLower) ||
    choiceLower.includes(c.choice.toLowerCase())
  );
}

// ============================================================================
// REAL STAKES STATEMENTS
// ============================================================================

/**
 * Generate a real stakes statement for a given situation
 * Uses verified data from NACAC, College Board, and Common Data Sets
 * Avoids fabricated statistics
 */
export function generateRealStakesStatement(
  situation: 'playing_safe' | 'low_effort' | 'wrong_courses' | 'score_concern' | 'major_mismatch',
  context: { major?: string; subject?: string; gpa?: number; effort?: number }
): string {
  switch (situation) {
    case 'playing_safe':
      return `NACAC research shows 64% of colleges rate curriculum rigor as "considerably important" - up from 51% in 2017. The trend is clear: selective colleges increasingly want to see you take on challenge. Your ${context.gpa?.toFixed(2) || 'strong'} GPA suggests you can handle more. The question is whether your transcript reflects that capability.`;

    case 'low_effort':
      return `When you're getting ${context.gpa?.toFixed(2) || 'high'} grades on ${context.effort || 25}% effort, that's diagnostic. Your current courses aren't calibrated to your ability. You're not building the persistence, time management, or productive struggle skills you'll need when college material challenges you for the first time.`;

    case 'wrong_courses': {
      const profile = context.major ? getAdmittedProfile(context.major) : undefined;
      if (profile) {
        const essentialCourse = profile.expectedCourses.find(c => c.expectationLevel === 'essential');
        if (essentialCourse) {
          return `For ${context.major} applicants at competitive schools, ${essentialCourse.course} is considered essential preparation. ${essentialCourse.reasoning} If your school offers it and you don't take it, that gap will be visible on your transcript.`;
        }
      }
      return `Your course selection doesn't align with what competitive colleges expect for your intended major. NACAC data shows rigor matters more each year - taking available challenging courses signals serious intent.`;
    }

    case 'score_concern': {
      const tier3 = AP_SCORE_PERCEPTIONS[3];
      const tier4 = AP_SCORE_PERCEPTIONS[4];
      return `A 3 means "${tier3.admissionsPerception}" A 4 means "${tier4.admissionsPerception}" That's the difference you're weighing - not just a number, but how admissions officers read your preparation. Many selective colleges only grant credit for 4s and 5s.`;
    }

    case 'major_mismatch':
      return `Your transcript tells one story, your intended major tells another. Stanford and Harvard both rate "rigor of secondary school record" as "very important" in their Common Data Sets. Admissions officers will notice if your stated interest isn't backed by challenging coursework in that area.`;

    default:
      return '';
  }
}

// ============================================================================
// INDEXED QUICK-ACCESS
// ============================================================================

export interface QuickFact {
  category: 'ap_score' | 'peer_data' | 'consequence' | 'expectation';
  tags: string[];
  fact: string;
  source?: string;
}

/**
 * Indexed facts for quick retrieval during conversation
 *
 * IMPORTANT: Only include facts that are:
 * - VERIFIED: Official data from College Board, NACAC, Common Data Sets
 * - CONSENSUS: Industry-standard practices explicitly stated by colleges
 *
 * Do NOT include fabricated statistics about "X% of admits took Y course"
 */
export const QUICK_FACTS: QuickFact[] = [
  // AP Score facts - VERIFIED from College Board 2024
  {
    category: 'ap_score',
    tags: ['3', 'perception'],
    fact: 'A score of 3 is "qualified" per College Board, but many selective colleges only grant credit for 4 or 5.',
    source: 'College Board credit policies'
  },
  {
    category: 'ap_score',
    tags: ['4', '5', 'credit'],
    fact: 'At selective colleges, only 4s and 5s typically receive credit. A 3 shows you took the course but may not earn placement.',
    source: 'College credit policies (Stanford, MIT, Ivy League)'
  },
  {
    category: 'ap_score',
    tags: ['physics', 'comparison'],
    fact: 'AP Physics C: Mechanics has a 73% pass rate vs Physics 1\'s 46% (College Board 2024). The calculus-based approach is often more straightforward for prepared students.',
    source: 'College Board 2024 AP Exam Score Distributions'
  },
  {
    category: 'ap_score',
    tags: ['bc', 'ab', 'calculus'],
    fact: 'AP Calculus BC has an 81% pass rate and 45% score 5; AB has 61% pass rate (College Board 2024). BC\'s higher rates reflect self-selection of prepared students.',
    source: 'College Board 2024 AP Exam Score Distributions'
  },

  // Admissions factors - VERIFIED from NACAC
  {
    category: 'peer_data',
    tags: ['rigor', 'importance', 'nacac'],
    fact: '64% of colleges rate curriculum rigor as "considerably important" in admissions, up from 51% in 2017 (NACAC 2023).',
    source: 'NACAC State of College Admission 2023'
  },
  {
    category: 'peer_data',
    tags: ['grades', 'prep', 'nacac'],
    fact: '76.8% of colleges rate grades in college prep courses as "considerably important" - the highest-rated factor (NACAC 2023).',
    source: 'NACAC State of College Admission 2023'
  },
  {
    category: 'peer_data',
    tags: ['test', 'optional', 'nacac'],
    fact: 'Only 5% of colleges now rate standardized test scores as "considerably important," down from ~50% pre-COVID (NACAC 2023).',
    source: 'NACAC State of College Admission 2023'
  },

  // Consequence facts - VERIFIED from Common Data Sets
  {
    category: 'consequence',
    tags: ['skip', 'rigor', 'cds'],
    fact: 'Stanford and Harvard both rate "rigor of secondary school record" as "very important" - the highest rating in Common Data Sets.',
    source: 'Stanford CDS 2023-24, Harvard CDS 2023-24'
  },
  {
    category: 'consequence',
    tags: ['selective', 'rigor'],
    fact: 'Selective colleges consistently state they value "most demanding program available" - not taking rigor when available raises questions.',
    source: 'Common Data Set Section C7 (multiple institutions)'
  },

  // Expectation facts - CONSENSUS
  {
    category: 'expectation',
    tags: ['junior', 'weight'],
    fact: 'Junior year is typically the most recent complete academic year colleges see during early review. Strong junior performance carries significant weight.',
    source: 'Common admissions practice'
  },
  {
    category: 'expectation',
    tags: ['trajectory', 'improve'],
    fact: 'An upward grade trajectory demonstrates growth and increased capability. Colleges often view improvement positively.',
    source: 'Admissions consensus'
  },
  {
    category: 'expectation',
    tags: ['weighted', 'gpa'],
    fact: 'Most admissions offices recalculate GPAs using their own weighting systems. Taking AP/IB coursework typically improves weighted calculations.',
    source: 'College admissions practices'
  }
];

/**
 * Search for relevant facts by tags
 */
export function findRelevantFacts(tags: string[], maxResults: number = 3): QuickFact[] {
  const scored = QUICK_FACTS.map(fact => {
    const matchCount = tags.filter(tag =>
      fact.tags.some(factTag => factTag.toLowerCase().includes(tag.toLowerCase()))
    ).length;
    return { fact, score: matchCount };
  });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(item => item.fact);
}
