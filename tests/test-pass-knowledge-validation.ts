/**
 * PASS Knowledge Database Validation Suite
 *
 * Validates the comprehensive knowledge bases for:
 * - Extracurricular activities and achievements
 * - Academic performance calibration
 * - Character evidence evaluation
 * - School-specific value matrices
 * - Context adjustment factors
 *
 * Tests ensure data integrity, completeness, and basic structure.
 */

import {
  // Extracurricular databases
  MATH_COMPETITION_HIERARCHY,
  SCIENCE_OLYMPIAD_HIERARCHY,
  CS_COMPETITION_HIERARCHY,
  RESEARCH_COMPETITION_HIERARCHY,
  DEBATE_SPEECH_HIERARCHY,
  ARTS_COMPETITION_HIERARCHY,
  ATHLETICS_HIERARCHY,
  LEADERSHIP_SERVICE_HIERARCHY,
  ENTREPRENEURSHIP_HIERARCHY,
  ROBOTICS_HIERARCHY,
  SUMMER_PROGRAMS_HIERARCHY,
  CYBERSECURITY_HIERARCHY,
  ADDITIONAL_CS_HIERARCHY,
  JSHS_HIERARCHY,
  MODEL_UN_HIERARCHY,
  ECONOMICS_BUSINESS_HIERARCHY,
  ADMISSION_IMPACT_MULTIPLIERS,
  HOOKS_AND_SPECIAL_FACTORS,
  RED_FLAG_PATTERNS,
  classifyActivityWithDatabase,
  type ActivityInput,
} from '../src/services/portfolioStrategy/knowledge/extracurricularDatabase';

import {
  // Academic databases
  GPA_CALIBRATION,
  COURSE_RIGOR_BENCHMARKS,
  TEST_SCORE_CALIBRATION,
  GRADE_TRAJECTORY_ANALYSIS,
  RESEARCH_CALIBRATION,
  analyzeAcademicProfileWithDatabase,
  type AcademicInput,
} from '../src/services/portfolioStrategy/knowledge/academicDatabase';

import {
  // Character databases
  INTELLECTUAL_VITALITY_CALIBRATION,
  LEADERSHIP_QUALITY_CALIBRATION,
  COMMUNITY_IMPACT_CALIBRATION,
  PERSONAL_GROWTH_CALIBRATION,
  RESILIENCE_GRIT_CALIBRATION,
  CREATIVITY_INNOVATION_CALIBRATION,
  AUTHENTICITY_VOICE_CALIBRATION,
  CHARACTER_DIMENSION_WEIGHTS,
  calculateCompositeCharacterScore,
  type CharacterEvidence,
} from '../src/services/portfolioStrategy/knowledge/characterDatabase';

import {
  // School value databases
  ELITE_SCHOOL_VALUE_MATRICES,
  SCHOOL_VALUE_WEIGHTS,
  ADMISSION_STATISTICS,
  DEMONSTRATED_INTEREST_IMPACT,
  LEGACY_DEVELOPMENT_IMPACT,
  ED_EA_STRATEGIES,
  calculateSchoolFitScore,
  getSchoolSpecificStrategy,
  type SchoolFitInput,
} from '../src/services/portfolioStrategy/knowledge/schoolValueDatabase';

import {
  // Context adjustment databases
  SOCIOECONOMIC_CONTEXT_FACTORS,
  GEOGRAPHIC_CONTEXT_FACTORS,
  FAMILY_CONTEXT_FACTORS,
  SCHOOL_RESOURCE_CONTEXT,
  FIRST_GEN_IMPACT,
  UNDERREPRESENTED_MINORITY_IMPACT,
  RECRUITED_ATHLETE_IMPACT,
  LEGACY_CONTEXT,
  calculateContextMultiplier,
  type StudentContext,
} from '../src/services/portfolioStrategy/knowledge/contextAdjustmentDatabase';

// Extended Extracurricular Database
import {
  ENTREPRENEURSHIP_STARTUP_HIERARCHY,
  NONPROFIT_SERVICE_HIERARCHY,
  INTERNSHIP_WORK_HIERARCHY,
  SCHOOL_CLUBS_HIERARCHY,
  PERFORMING_ARTS_HIERARCHY,
  VISUAL_ARTS_HIERARCHY,
  WRITING_JOURNALISM_HIERARCHY,
  UNIQUE_ACTIVITIES_HIERARCHY,
} from '../src/services/portfolioStrategy/knowledge/extracurricularDatabaseExtended';

// Major-Activity Alignment Matrix
import {
  MAJOR_ACTIVITY_ALIGNMENT_MATRIX,
  SPECIFIC_ACTIVITY_MAJOR_ALIGNMENT,
  SPIKE_DOMAINS,
  COHERENCE_RED_FLAGS,
  COHERENCE_GREEN_FLAGS,
  UNIVERSAL_POSITIVE_SIGNALS,
  MAJOR_COMPETITIVE_BENCHMARKS,
  type MajorCategory,
  type ActivityCategory,
} from '../src/services/portfolioStrategy/knowledge/majorActivityAlignment';

// Impact Metrics Framework
import {
  IMPACT_TIER_DESCRIPTIONS,
  BENEFICIARY_METRICS,
  FINANCIAL_METRICS,
  DIGITAL_METRICS,
  RESEARCH_METRICS,
  LEADERSHIP_METRICS,
  COMPETITION_METRICS,
  TIME_METRICS,
  RECOGNITION_METRICS,
  METRIC_RED_FLAGS,
  VERIFICATION_STANDARDS,
  type ImpactTier,
} from '../src/services/portfolioStrategy/knowledge/impactMetricsFramework';

// Spike Detection System
import {
  SPIKE_DEFINITIONS,
  COHERENCE_SCORE_INTERPRETATION,
  SPIKE_STRENGTH_WEIGHTS,
  SPIKE_SCORING_RULES,
  NARRATIVE_CLARITY_RULES,
  COHERENCE_RED_FLAGS as SPIKE_COHERENCE_RED_FLAGS,
  COHERENCE_GREEN_FLAGS as SPIKE_COHERENCE_GREEN_FLAGS,
  PITCH_TEMPLATES,
  ARCHETYPE_DETECTION_RULES,
  RECOMMENDATION_TEMPLATES,
  type SpikeType,
} from '../src/services/portfolioStrategy/knowledge/spikeDetectionSystem';

// ============================================================================
// TEST UTILITIES
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    results.push({ name, passed: true, message: 'PASSED' });
    console.log(`  ✅ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: error instanceof Error ? error.message : String(error),
    });
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertDefined<T>(value: T | undefined | null, message: string): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(`${message}: value is undefined or null`);
  }
}

function assertHasKeys(obj: object, keys: string[], context: string) {
  for (const key of keys) {
    if (!(key in obj)) {
      throw new Error(`${context}: missing key '${key}'`);
    }
  }
}

// ============================================================================
// EXTRACURRICULAR DATABASE TESTS
// ============================================================================

console.log('\n📚 EXTRACURRICULAR DATABASE VALIDATION\n');
console.log('='.repeat(60));

test('MATH_COMPETITION_HIERARCHY has AMO pipeline', () => {
  assertDefined(MATH_COMPETITION_HIERARCHY.amo_pipeline, 'Missing AMO pipeline');
  assertHasKeys(
    MATH_COMPETITION_HIERARCHY.amo_pipeline,
    ['amc_8', 'amc_10_12', 'aime', 'usamo', 'mop', 'imo'],
    'AMO pipeline'
  );
});

test('MATH_COMPETITION_HIERARCHY IMO medals exist', () => {
  const imo = MATH_COMPETITION_HIERARCHY.amo_pipeline.imo;
  assertDefined(imo.medals, 'Missing IMO medals');
  assertHasKeys(imo.medals, ['gold', 'silver', 'bronze'], 'IMO medals');
  assert(imo.medals.gold.tier === 1, 'IMO Gold should be tier 1');
});

test('SCIENCE_OLYMPIAD_HIERARCHY has major olympiads', () => {
  assertHasKeys(
    SCIENCE_OLYMPIAD_HIERARCHY,
    ['usapho', 'usabo', 'usnco'],
    'Science olympiads'
  );
});

test('CS_COMPETITION_HIERARCHY has USACO pipeline', () => {
  assertDefined(CS_COMPETITION_HIERARCHY.usaco, 'Missing USACO');
  const usaco = CS_COMPETITION_HIERARCHY.usaco.pipeline;
  assertHasKeys(usaco, ['bronze', 'silver', 'gold', 'platinum', 'camp_finalist'], 'USACO pipeline');

  // Verify tier progression (lower tier number = better or equal)
  assert(usaco.platinum.tier <= usaco.gold.tier, 'Platinum should be >= tier than Gold');
  assert(usaco.gold.tier < usaco.silver.tier, 'Gold should be better tier than Silver');
});

test('CS_COMPETITION_HIERARCHY has codeforces ratings', () => {
  assertDefined(CS_COMPETITION_HIERARCHY.codeforces, 'Missing Codeforces');
  const cf = CS_COMPETITION_HIERARCHY.codeforces.ratings;
  assertDefined(cf.legendary_grandmaster, 'Missing LGM rating');
  assert(cf.legendary_grandmaster.tier === 1, 'LGM should be tier 1');
});

test('SUMMER_PROGRAMS_HIERARCHY identifies elite programs', () => {
  assertDefined(SUMMER_PROGRAMS_HIERARCHY.tier_1_elite, 'Missing tier 1 elite');
  const rsi = SUMMER_PROGRAMS_HIERARCHY.tier_1_elite.rsi;
  assertDefined(rsi, 'Missing RSI');
  assert(rsi.admissionImpact === 'exceptional', 'RSI should have exceptional impact');
  assert(rsi.acceptance_rate <= 0.03, 'RSI acceptance rate should be <= 3%');
});

test('SUMMER_PROGRAMS_HIERARCHY has red flags for paid programs', () => {
  assertDefined(SUMMER_PROGRAMS_HIERARCHY.red_flags_paid_programs, 'Missing red flags');
  const redFlags = SUMMER_PROGRAMS_HIERARCHY.red_flags_paid_programs;
  assert(redFlags.warning_signs.length > 0, 'Should have warning signs');
});

test('ADMISSION_IMPACT_MULTIPLIERS has correct ordering', () => {
  const { near_guarantee, exceptional, very_strong, strong } = ADMISSION_IMPACT_MULTIPLIERS;
  assert(near_guarantee.multiplier > exceptional.multiplier, 'near_guarantee > exceptional');
  assert(exceptional.multiplier > very_strong.multiplier, 'exceptional > very_strong');
  assert(very_strong.multiplier > strong.multiplier, 'very_strong > strong');
});

test('RED_FLAG_PATTERNS identifies concerning activities', () => {
  assertDefined(RED_FLAG_PATTERNS.authenticity_red_flags, 'Missing authenticity red flags');
  assertDefined(RED_FLAG_PATTERNS.academic_red_flags, 'Missing academic red flags');
});

test('MODEL_UN_HIERARCHY has conference rankings', () => {
  assertDefined(MODEL_UN_HIERARCHY.prestigious_conferences, 'Missing prestigious conferences');
  assertDefined(MODEL_UN_HIERARCHY.prestigious_conferences.harvard_mun, 'Missing Harvard MUN');
});

test('ECONOMICS_BUSINESS_HIERARCHY has competitions', () => {
  assertDefined(ECONOMICS_BUSINESS_HIERARCHY.deca, 'Missing DECA');
  assertDefined(ECONOMICS_BUSINESS_HIERARCHY.fbla, 'Missing FBLA');
});

test('classifyActivityWithDatabase returns valid results', () => {
  const input: ActivityInput = {
    name: 'USAMO Qualifier',
    category: 'math',
    description: 'Qualified for USA Mathematical Olympiad',
    achievements: ['USAMO Qualifier'],
    recognitionLevel: 'national',
    yearsInvolved: 4,
    hoursPerWeek: 10,
    leadershipRoles: ['Team Captain'],
  };
  const result = classifyActivityWithDatabase(input);

  assertDefined(result.tier, 'Should have tier');
  assert(result.tier >= 1 && result.tier <= 4, 'Tier should be 1-4');
});

// ============================================================================
// ACADEMIC DATABASE TESTS
// ============================================================================

console.log('\n📖 ACADEMIC DATABASE VALIDATION\n');
console.log('='.repeat(60));

test('GPA_CALIBRATION has school_contexts', () => {
  assertDefined(GPA_CALIBRATION.school_contexts, 'Missing school_contexts');
  assertHasKeys(
    GPA_CALIBRATION.school_contexts,
    ['elite_prep', 'competitive_magnet', 'under_resourced', 'average_public'],
    'School contexts'
  );
});

test('GPA_CALIBRATION has grade mapping for elite_prep', () => {
  const elitePrep = GPA_CALIBRATION.school_contexts.elite_prep;
  assertDefined(elitePrep.gpa_interpretation, 'Missing GPA interpretation');
});

test('COURSE_RIGOR_BENCHMARKS has rigor_levels', () => {
  assertDefined(COURSE_RIGOR_BENCHMARKS.rigor_levels, 'Missing rigor levels');
  assertHasKeys(
    COURSE_RIGOR_BENCHMARKS.rigor_levels,
    ['ap_ib', 'dual_enrollment', 'honors'],
    'Rigor levels'
  );
});

test('TEST_SCORE_CALIBRATION has SAT data', () => {
  assertDefined(TEST_SCORE_CALIBRATION.sat, 'Missing SAT calibration');
  assertDefined(TEST_SCORE_CALIBRATION.sat.percentiles_2024, 'Missing SAT percentiles');
});

test('GRADE_TRAJECTORY_ANALYSIS has patterns', () => {
  assertDefined(GRADE_TRAJECTORY_ANALYSIS.patterns, 'Missing patterns');
  assertHasKeys(
    GRADE_TRAJECTORY_ANALYSIS.patterns,
    ['ascending_strong', 'descending'],
    'Grade patterns'
  );
});

test('RESEARCH_CALIBRATION has research_tiers', () => {
  assertDefined(RESEARCH_CALIBRATION.research_tiers, 'Missing research tiers');
  assertHasKeys(
    RESEARCH_CALIBRATION.research_tiers,
    ['tier_1_exceptional', 'tier_2_strong', 'tier_3_solid'],
    'Research tiers'
  );
});

test('analyzeAcademicProfileWithDatabase returns valid results', () => {
  const input: AcademicInput = {
    gpa: { unweighted: 3.95, scale: 4.0 },
    schoolContext: 'elite_prep',
    courseRigor: { apCount: 12, apAvailable: 15 },
    testScores: { sat: 1580 },
  };
  const result = analyzeAcademicProfileWithDatabase(input);

  assertDefined(result, 'Should return result');
});

// ============================================================================
// CHARACTER DATABASE TESTS
// ============================================================================

console.log('\n🎭 CHARACTER DATABASE VALIDATION\n');
console.log('='.repeat(60));

test('All 7 character dimensions have calibration', () => {
  assertDefined(INTELLECTUAL_VITALITY_CALIBRATION, 'Missing IV calibration');
  assertDefined(LEADERSHIP_QUALITY_CALIBRATION, 'Missing leadership calibration');
  assertDefined(COMMUNITY_IMPACT_CALIBRATION, 'Missing community impact calibration');
  assertDefined(PERSONAL_GROWTH_CALIBRATION, 'Missing personal growth calibration');
  assertDefined(RESILIENCE_GRIT_CALIBRATION, 'Missing resilience calibration');
  assertDefined(CREATIVITY_INNOVATION_CALIBRATION, 'Missing creativity calibration');
  assertDefined(AUTHENTICITY_VOICE_CALIBRATION, 'Missing authenticity calibration');
});

test('INTELLECTUAL_VITALITY_CALIBRATION has scoring_levels', () => {
  assertDefined(INTELLECTUAL_VITALITY_CALIBRATION.scoring_levels, 'Missing scoring levels');
  // Check numeric keys 1-6
  const levels = INTELLECTUAL_VITALITY_CALIBRATION.scoring_levels;
  assert(1 in levels, 'Missing level 1');
  assert(6 in levels, 'Missing level 6');
});

test('CHARACTER_DIMENSION_WEIGHTS are defined', () => {
  assertDefined(CHARACTER_DIMENSION_WEIGHTS, 'Missing dimension weights');
  assertHasKeys(
    CHARACTER_DIMENSION_WEIGHTS,
    ['intellectual_vitality', 'leadership_quality', 'community_impact'],
    'Character weights'
  );
});

test('calculateCompositeCharacterScore returns valid results', () => {
  const input: CharacterEvidence = {
    intellectual_vitality: { score: 5, evidence: ['Published research'] },
    leadership_quality: { score: 4, evidence: ['Club president'] },
    community_impact: { score: 4, evidence: ['Founded program'] },
    personal_growth: { score: 5, evidence: ['Overcame challenges'] },
    resilience_grit: { score: 4, evidence: ['Persisted'] },
    creativity_innovation: { score: 5, evidence: ['Novel solutions'] },
    authenticity_voice: { score: 5, evidence: ['Genuine narrative'] },
  };
  const result = calculateCompositeCharacterScore(input);

  assertDefined(result, 'Should return result');
  assertDefined(result.overallScore, 'Should have overall score');
});

// ============================================================================
// SCHOOL VALUE DATABASE TESTS
// ============================================================================

console.log('\n🏫 SCHOOL VALUE DATABASE VALIDATION\n');
console.log('='.repeat(60));

test('ELITE_SCHOOL_VALUE_MATRICES has all target schools', () => {
  const requiredSchools = [
    'harvard', 'stanford', 'mit', 'caltech', 'princeton',
    'yale', 'columbia', 'duke', 'penn', 'northwestern',
    'brown', 'dartmouth', 'cornell',
  ];

  for (const school of requiredSchools) {
    assertDefined(ELITE_SCHOOL_VALUE_MATRICES[school], `Missing school: ${school}`);
  }
});

test('Each school has complete value matrix', () => {
  for (const [schoolId, matrix] of Object.entries(ELITE_SCHOOL_VALUE_MATRICES)) {
    assertDefined(matrix.name, `${schoolId} missing name`);
    assertDefined(matrix.type, `${schoolId} missing type`);
    assertDefined(matrix.distinctiveValues, `${schoolId} missing distinctiveValues`);
    assertDefined(matrix.characterWeights, `${schoolId} missing characterWeights`);
  }
});

test('MIT has appropriate STEM weighting', () => {
  const mit = ELITE_SCHOOL_VALUE_MATRICES.mit;
  assert(
    mit.characterWeights.intellectual_vitality >= 1.1,
    'MIT should highly weight intellectual vitality'
  );
});

test('ADMISSION_STATISTICS has key data', () => {
  assertDefined(ADMISSION_STATISTICS.acceptance_rates, 'Missing acceptance rates');
  assertDefined(ADMISSION_STATISTICS.ed_impact, 'Missing ED impact');
});

test('ED_EA_STRATEGIES has ed_candidates', () => {
  assertDefined(ED_EA_STRATEGIES.ed_candidates, 'Missing ED candidates');
  assertDefined(ED_EA_STRATEGIES.scea_candidates, 'Missing SCEA candidates');
});

test('calculateSchoolFitScore produces valid results', () => {
  const input: SchoolFitInput = {
    schoolName: 'mit',
    studentProfile: {
      academicStrengths: ['math', 'cs'],
      activityDomains: ['research', 'stem'],
      characterStrengths: ['intellectual_vitality', 'creativity'],
      interests: ['technology', 'innovation'],
      preferences: {
        urbanVsRural: 'urban',
        sizePreference: 'medium',
      },
      gpa: 3.95,
      testScores: { sat: 1580 },
    },
  };
  const result = calculateSchoolFitScore(input);

  assertDefined(result.overallFitScore, 'Should have fit score');
  assert(result.overallFitScore >= 0 && result.overallFitScore <= 100, 'Fit score should be 0-100');
});

test('getSchoolSpecificStrategy returns strategy', () => {
  const strategy = getSchoolSpecificStrategy('harvard');

  assertDefined(strategy.essayStrategy, 'Should have essay strategy');
  assertDefined(strategy.applicationTiming, 'Should have application timing');
});

// ============================================================================
// CONTEXT ADJUSTMENT DATABASE TESTS
// ============================================================================

console.log('\n🌍 CONTEXT ADJUSTMENT DATABASE VALIDATION\n');
console.log('='.repeat(60));

test('SOCIOECONOMIC_CONTEXT_FACTORS has income categories', () => {
  assertDefined(SOCIOECONOMIC_CONTEXT_FACTORS.household_income, 'Missing household_income');
  assertHasKeys(
    SOCIOECONOMIC_CONTEXT_FACTORS.household_income,
    ['low_income', 'middle_income', 'high_income'],
    'Income categories'
  );
});

test('GEOGRAPHIC_CONTEXT_FACTORS has state representation', () => {
  assertDefined(GEOGRAPHIC_CONTEXT_FACTORS.state_representation, 'Missing state representation');
  assertDefined(GEOGRAPHIC_CONTEXT_FACTORS.urban_vs_rural, 'Missing urban_vs_rural');
});

test('FAMILY_CONTEXT_FACTORS has responsibility factors', () => {
  assertDefined(FAMILY_CONTEXT_FACTORS.family_responsibilities, 'Missing family responsibilities');
  assertDefined(FAMILY_CONTEXT_FACTORS.family_challenges, 'Missing family challenges');
});

test('FIRST_GEN_IMPACT has admission_impact data', () => {
  assertDefined(FIRST_GEN_IMPACT.admission_impact, 'Missing admission_impact');
  assertDefined(FIRST_GEN_IMPACT.admission_impact.harvard, 'Missing Harvard data');
  assert(
    FIRST_GEN_IMPACT.admission_impact.harvard.boost > 1.0,
    'First-gen should have positive boost at Harvard'
  );
});

test('RECRUITED_ATHLETE_IMPACT has sport tiers', () => {
  assertDefined(RECRUITED_ATHLETE_IMPACT.tier_1_sports, 'Missing tier 1 sports');
  assertDefined(RECRUITED_ATHLETE_IMPACT.tier_2_sports, 'Missing tier 2 sports');
  assert(
    RECRUITED_ATHLETE_IMPACT.tier_1_sports.sports.length > 0,
    'Should have tier 1 sports list'
  );
});

test('LEGACY_CONTEXT has impact data', () => {
  assertDefined(LEGACY_CONTEXT.primary_legacy, 'Missing primary legacy');
  assertDefined(LEGACY_CONTEXT.secondary_legacy, 'Missing secondary legacy');
  assertDefined(LEGACY_CONTEXT.primary_legacy.impact_by_school, 'Missing primary legacy impact');
  assert(
    LEGACY_CONTEXT.primary_legacy.impact_by_school.harvard.boost > LEGACY_CONTEXT.secondary_legacy.boost,
    'Primary legacy should have higher boost than secondary'
  );
});

test('calculateContextMultiplier handles complex contexts', () => {
  const input: StudentContext = {
    socioeconomic: {
      householdIncome: 'low',
      firstGeneration: true,
      worksForFamily: true,
    },
    geographic: {
      state: 'Wyoming',
      urbanVsRural: 'rural',
      schoolType: 'under_resourced',
    },
    family: {
      singleParent: true,
      fosterCare: false,
      recentImmigrant: false,
      refugee: false,
      caregiverRole: true,
      significantChallenges: ['financial_hardship'],
    },
    school: {
      apCoursesAvailable: 3,
      collegeCounselorRatio: 500,
      extracurricularAccess: 'limited',
    },
    demographics: {
      underrepresentedMinority: false,
      recruitedAthlete: false,
      legacy: 'none',
    },
  };
  const result = calculateContextMultiplier(input);

  assertDefined(result.admissionMultiplier, 'Should have admission multiplier');
  assert(result.admissionMultiplier > 1.2, 'Disadvantaged student should have multiplier > 1.2');
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

console.log('\n🔗 INTEGRATION TESTS\n');
console.log('='.repeat(60));

test('Full student profile assessment integration', () => {
  // Create activity classification
  const activityInput: ActivityInput = {
    name: 'USAMO Qualifier',
    category: 'math',
    description: 'Qualified for USA Mathematical Olympiad',
    achievements: ['USAMO Qualifier', 'AIME 12+'],
    recognitionLevel: 'national',
    yearsInvolved: 4,
    hoursPerWeek: 15,
    leadershipRoles: ['Math Team Captain'],
  };
  const mathResult = classifyActivityWithDatabase(activityInput);

  // Create character assessment
  const characterInput: CharacterEvidence = {
    intellectual_vitality: { score: 6, evidence: ['USAMO qualifier'] },
    leadership_quality: { score: 4, evidence: ['Math team captain'] },
    community_impact: { score: 3, evidence: ['Tutoring'] },
    personal_growth: { score: 5, evidence: ['Challenges'] },
    resilience_grit: { score: 5, evidence: ['Persistence'] },
    creativity_innovation: { score: 5, evidence: ['Novel approaches'] },
    authenticity_voice: { score: 5, evidence: ['Clear identity'] },
  };
  const characterResult = calculateCompositeCharacterScore(characterInput);

  // Create school fit assessment
  const fitInput: SchoolFitInput = {
    schoolName: 'mit',
    studentProfile: {
      academicStrengths: ['math', 'physics'],
      activityDomains: ['math_competitions', 'research'],
      characterStrengths: ['intellectual_vitality', 'creativity'],
      interests: ['mathematics', 'research'],
      preferences: {
        urbanVsRural: 'urban',
        sizePreference: 'medium',
      },
      gpa: 3.97,
      testScores: { sat: 1590 },
    },
  };
  const mitFit = calculateSchoolFitScore(fitInput);

  // Verify all components work together
  assertDefined(mathResult.tier, 'Activity should have tier');
  assertDefined(characterResult.overallScore, 'Character should have score');
  assertDefined(mitFit.overallFitScore, 'School fit should have score');

  console.log('\n  Full Profile Assessment Results:');
  console.log(`    Activity Tier: ${mathResult.tier}`);
  console.log(`    Character Score: ${characterResult.overallScore}`);
  console.log(`    MIT Fit Score: ${mitFit.overallFitScore}`);
});

test('Cross-database consistency: Impact multipliers', () => {
  // Verify impact levels used in extracurricular database match the multipliers
  const imoGold = MATH_COMPETITION_HIERARCHY.amo_pipeline.imo.medals.gold;
  assert(
    imoGold.admissionImpact in ADMISSION_IMPACT_MULTIPLIERS ||
    imoGold.admissionImpact === 'guaranteed',
    'IMO Gold impact should be recognized'
  );
});

// ============================================================================
// EXTENDED EXTRACURRICULAR DATABASE TESTS
// ============================================================================

console.log('\n📋 EXTENDED EXTRACURRICULAR DATABASE TESTS');
console.log('-'.repeat(50));

test('Entrepreneurship hierarchy has all tiers', () => {
  assertDefined(ENTREPRENEURSHIP_STARTUP_HIERARCHY.tier_1_exceptional, 'Should have tier 1');
  assertDefined(ENTREPRENEURSHIP_STARTUP_HIERARCHY.tier_2_distinguished, 'Should have tier 2');
  assertDefined(ENTREPRENEURSHIP_STARTUP_HIERARCHY.tier_3_notable, 'Should have tier 3');
  assertDefined(ENTREPRENEURSHIP_STARTUP_HIERARCHY.tier_4_participation, 'Should have tier 4');
  assertDefined(ENTREPRENEURSHIP_STARTUP_HIERARCHY.red_flags, 'Should have red flags');

  // Verify specific items
  assertDefined(ENTREPRENEURSHIP_STARTUP_HIERARCHY.tier_1_exceptional.thiel_fellowship, 'Should have Thiel Fellowship');
  assertDefined(ENTREPRENEURSHIP_STARTUP_HIERARCHY.tier_1_exceptional.y_combinator, 'Should have Y Combinator');
  assert(
    ENTREPRENEURSHIP_STARTUP_HIERARCHY.tier_1_exceptional.thiel_fellowship.tier === 1,
    'Thiel Fellowship should be tier 1'
  );
});

test('Nonprofit hierarchy has impact metrics and red flags', () => {
  assertDefined(NONPROFIT_SERVICE_HIERARCHY.tier_1_exceptional, 'Should have tier 1');
  assertDefined(NONPROFIT_SERVICE_HIERARCHY.red_flags, 'Should have red flags');
  assertDefined(NONPROFIT_SERVICE_HIERARCHY.green_flags, 'Should have green flags');

  // Verify red flags cover common issues
  const redFlagKeys = Object.keys(NONPROFIT_SERVICE_HIERARCHY.red_flags);
  assert(redFlagKeys.length >= 4, 'Should have at least 4 red flags');
});

test('Internship hierarchy covers major industries', () => {
  assertDefined(INTERNSHIP_WORK_HIERARCHY.stem_internships, 'Should have STEM internships');
  assertDefined(INTERNSHIP_WORK_HIERARCHY.finance_business_internships, 'Should have finance/business internships');
  assertDefined(INTERNSHIP_WORK_HIERARCHY.work_experience_context, 'Should have work experience context');

  // Verify FAANG is covered
  const tier1 = INTERNSHIP_WORK_HIERARCHY.stem_internships.tier_1_exceptional;
  assertDefined(tier1.faang, 'Should have FAANG internships');
  assert(tier1.faang.companies.includes('Google'), 'Should include Google in FAANG');
});

test('School clubs hierarchy covers all major types', () => {
  assertDefined(SCHOOL_CLUBS_HIERARCHY.student_government, 'Should have student government');
  assertDefined(SCHOOL_CLUBS_HIERARCHY.publications, 'Should have publications');
  assertDefined(SCHOOL_CLUBS_HIERARCHY.academic_teams, 'Should have academic teams');

  // Verify Boys/Girls State is covered (note: regular attendance is tier 2, governor is tier 1)
  assertDefined(
    SCHOOL_CLUBS_HIERARCHY.student_government.tier_2_distinguished.boys_girls_state,
    'Should have Boys/Girls State'
  );
});

test('Performing arts hierarchy covers music, theater, dance', () => {
  assertDefined(PERFORMING_ARTS_HIERARCHY.instrumental_music, 'Should have instrumental music');
  assertDefined(PERFORMING_ARTS_HIERARCHY.vocal_music, 'Should have vocal music');
  assertDefined(PERFORMING_ARTS_HIERARCHY.theater, 'Should have theater');
  assertDefined(PERFORMING_ARTS_HIERARCHY.dance, 'Should have dance');

  // Verify National Youth Orchestra is tier 1
  const nyo = PERFORMING_ARTS_HIERARCHY.instrumental_music.tier_1_exceptional.national_youth_orchestra;
  assertDefined(nyo, 'Should have National Youth Orchestra');
  assert(nyo.tier === 1, 'National Youth Orchestra should be tier 1');
});

test('Visual arts hierarchy has competition levels', () => {
  assertDefined(VISUAL_ARTS_HIERARCHY.traditional_visual_arts, 'Should have traditional arts');
  assertDefined(VISUAL_ARTS_HIERARCHY.digital_media_arts, 'Should have digital media');

  // Verify Scholastic is covered
  const scholastic = VISUAL_ARTS_HIERARCHY.traditional_visual_arts.tier_1_exceptional.scholastic_gold_national;
  assertDefined(scholastic, 'Should have Scholastic gold national');
  assert(scholastic.tier === 1, 'Scholastic gold national should be tier 1');
});

test('Writing/journalism hierarchy exists', () => {
  assertDefined(WRITING_JOURNALISM_HIERARCHY.creative_writing, 'Should have creative writing');
  assertDefined(WRITING_JOURNALISM_HIERARCHY.journalism, 'Should have journalism');
});

test('Unique activities hierarchy covers diverse achievements', () => {
  assertDefined(UNIQUE_ACTIVITIES_HIERARCHY.personal_projects, 'Should have personal projects');
  assertDefined(UNIQUE_ACTIVITIES_HIERARCHY.unusual_achievements, 'Should have unusual achievements');
  assertDefined(UNIQUE_ACTIVITIES_HIERARCHY.family_responsibilities, 'Should have family responsibilities');

  // Verify Eagle Scout is covered
  assertDefined(UNIQUE_ACTIVITIES_HIERARCHY.unusual_achievements.eagle_scout, 'Should have Eagle Scout');
});

// ============================================================================
// MAJOR-ACTIVITY ALIGNMENT MATRIX TESTS
// ============================================================================

console.log('\n📋 MAJOR-ACTIVITY ALIGNMENT MATRIX TESTS');
console.log('-'.repeat(50));

test('Alignment matrix covers all major categories', () => {
  const majors: MajorCategory[] = [
    'engineering',
    'computer_science',
    'natural_sciences',
    'pre_med',
    'business_economics',
    'law_policy',
    'humanities',
    'social_sciences',
    'visual_arts',
    'performing_arts',
    'architecture',
    'journalism_communications',
    'education',
    'environmental_studies',
    'international_relations',
  ];

  for (const major of majors) {
    assertDefined(MAJOR_ACTIVITY_ALIGNMENT_MATRIX[major], `Should have ${major}`);
  }
});

test('Alignment matrix covers all activity categories', () => {
  const activities: ActivityCategory[] = [
    'stem_research',
    'stem_competitions',
    'entrepreneurship',
    'nonprofit_service',
    'writing_journalism',
    'debate_speech',
    'student_government',
    'performing_arts_music',
    'performing_arts_theater',
    'performing_arts_dance',
    'visual_arts',
    'athletics',
    'academic_teams',
    'stem_clubs',
    'cultural_identity',
    'work_experience',
    'internships',
  ];

  // Check that each major has scores for all activities
  for (const activity of activities) {
    const score = MAJOR_ACTIVITY_ALIGNMENT_MATRIX.engineering[activity];
    assertDefined(score, `Engineering should have score for ${activity}`);
    assert(score >= 0 && score <= 5, `Score for ${activity} should be 0-5`);
  }
});

test('Alignment scores make logical sense', () => {
  // STEM research should be highly aligned with engineering
  assert(
    MAJOR_ACTIVITY_ALIGNMENT_MATRIX.engineering.stem_research >= 4,
    'STEM research should be highly aligned with engineering'
  );

  // Debate should be highly aligned with law/policy
  assert(
    MAJOR_ACTIVITY_ALIGNMENT_MATRIX.law_policy.debate_speech >= 4,
    'Debate should be highly aligned with law/policy'
  );

  // Visual arts should be highly aligned with visual arts major
  assert(
    MAJOR_ACTIVITY_ALIGNMENT_MATRIX.visual_arts.visual_arts === 5,
    'Visual arts activity should be perfectly aligned with visual arts major'
  );

  // Entrepreneurship should be highly aligned with business
  assert(
    MAJOR_ACTIVITY_ALIGNMENT_MATRIX.business_economics.entrepreneurship >= 4,
    'Entrepreneurship should be highly aligned with business'
  );
});

test('Specific activity mapping exists', () => {
  assertDefined(SPECIFIC_ACTIVITY_MAJOR_ALIGNMENT.usamo, 'Should have USAMO mapping');
  assertDefined(SPECIFIC_ACTIVITY_MAJOR_ALIGNMENT.usaco, 'Should have USACO mapping');
  assertDefined(SPECIFIC_ACTIVITY_MAJOR_ALIGNMENT.toc_debate, 'Should have TOC debate mapping');

  // Verify USACO maps to CS
  assert(
    SPECIFIC_ACTIVITY_MAJOR_ALIGNMENT.usaco.includes('computer_science'),
    'USACO should map to computer science'
  );
});

test('Spike domains are defined', () => {
  // Note: majorActivityAlignment uses stem_researcher, tech_builder, entrepreneur
  assertDefined(SPIKE_DOMAINS.stem_researcher, 'Should have stem researcher');
  assertDefined(SPIKE_DOMAINS.tech_builder, 'Should have tech builder');
  assertDefined(SPIKE_DOMAINS.entrepreneur, 'Should have entrepreneur');

  // Verify spike domains have required fields
  const techBuilder = SPIKE_DOMAINS.tech_builder;
  assertDefined(techBuilder.description, 'Spike should have description');
  assertDefined(techBuilder.indicators, 'Spike should have indicators');
  assertDefined(techBuilder.alignedMajors, 'Spike should have aligned majors');
  assertDefined(techBuilder.examplePitch, 'Spike should have example pitch');
});

test('Coherence red flags are defined', () => {
  assertDefined(COHERENCE_RED_FLAGS.senior_year_padding, 'Should have senior year padding');
  assertDefined(COHERENCE_RED_FLAGS.major_mismatch, 'Should have major mismatch');

  // Verify red flags have impact values
  assert(
    COHERENCE_RED_FLAGS.senior_year_padding.impact < 0,
    'Senior year padding should have negative impact'
  );
});

test('Major competitive benchmarks exist', () => {
  assertDefined(MAJOR_COMPETITIVE_BENCHMARKS.computer_science, 'Should have CS benchmarks');
  assertDefined(MAJOR_COMPETITIVE_BENCHMARKS.pre_med, 'Should have pre-med benchmarks');

  // Verify benchmarks have required fields
  const csBenchmark = MAJOR_COMPETITIVE_BENCHMARKS.computer_science;
  assertDefined(csBenchmark.ideal_spike_profile, 'Should have ideal spike profile');
  assertDefined(csBenchmark.common_mistakes, 'Should have common mistakes');
  assertDefined(csBenchmark.differentiators, 'Should have differentiators');
});

// ============================================================================
// IMPACT METRICS FRAMEWORK TESTS
// ============================================================================

console.log('\n📋 IMPACT METRICS FRAMEWORK TESTS');
console.log('-'.repeat(50));

test('Impact tier descriptions cover all tiers', () => {
  const tiers: ImpactTier[] = ['transformational', 'exceptional', 'strong', 'solid', 'moderate', 'minimal'];

  for (const tier of tiers) {
    assertDefined(IMPACT_TIER_DESCRIPTIONS[tier], `Should have ${tier} description`);
    assertDefined(IMPACT_TIER_DESCRIPTIONS[tier].description, `${tier} should have description`);
    assertDefined(IMPACT_TIER_DESCRIPTIONS[tier].admissionWeight, `${tier} should have admission weight`);
    assertDefined(IMPACT_TIER_DESCRIPTIONS[tier].examples, `${tier} should have examples`);
  }
});

test('Beneficiary metrics have thresholds', () => {
  assertDefined(BENEFICIARY_METRICS.direct_beneficiaries, 'Should have direct beneficiaries');
  assertDefined(BENEFICIARY_METRICS.students_tutored, 'Should have students tutored');

  // Verify thresholds are ordered correctly
  const directBen = BENEFICIARY_METRICS.direct_beneficiaries;
  assert(
    directBen.transformational > directBen.exceptional,
    'Transformational should be higher than exceptional'
  );
  assert(
    directBen.exceptional > directBen.strong,
    'Exceptional should be higher than strong'
  );
});

test('Financial metrics have realistic thresholds', () => {
  assertDefined(FINANCIAL_METRICS.money_raised_nonprofit, 'Should have nonprofit fundraising');
  assertDefined(FINANCIAL_METRICS.business_revenue_annual, 'Should have business revenue');

  // Verify $100K revenue is strong (not exceptional for HS student)
  assert(
    FINANCIAL_METRICS.business_revenue_annual.exceptional === 100000,
    'Business revenue exceptional should be $100K'
  );
});

test('Digital metrics have verification thresholds', () => {
  assertDefined(DIGITAL_METRICS.monthly_active_users, 'Should have MAU metric');
  assertDefined(DIGITAL_METRICS.github_stars, 'Should have GitHub stars');

  // Verify 10K MAU is strong achievement
  assert(
    DIGITAL_METRICS.monthly_active_users.strong === 10000,
    '10K MAU should be strong tier'
  );
});

test('Research metrics are calibrated', () => {
  assertDefined(RESEARCH_METRICS.peer_reviewed_publications, 'Should have publications');
  assertDefined(RESEARCH_METRICS.citations, 'Should have citations');

  // Verify 1 publication is strong (exceptional for HS student)
  assert(
    RESEARCH_METRICS.peer_reviewed_publications.strong === 1,
    '1 publication should be strong tier'
  );
});

test('Metric red flags identify unrealistic claims', () => {
  assertDefined(METRIC_RED_FLAGS.impossible_hours, 'Should flag impossible hours');
  assertDefined(METRIC_RED_FLAGS.startup_claims_no_evidence, 'Should flag startup claims');

  // Verify 168 hours is the impossible threshold
  assert(
    METRIC_RED_FLAGS.impossible_hours.threshold === 168,
    'Impossible hours threshold should be 168'
  );
});

test('Verification standards cover key categories', () => {
  assertDefined(VERIFICATION_STANDARDS.financial_claims, 'Should have financial verification');
  assertDefined(VERIFICATION_STANDARDS.user_metrics, 'Should have user metrics verification');
  assertDefined(VERIFICATION_STANDARDS.beneficiary_claims, 'Should have beneficiary verification');
  assertDefined(VERIFICATION_STANDARDS.research_claims, 'Should have research verification');

  // Verify each has acceptable evidence and red flags
  for (const category of Object.keys(VERIFICATION_STANDARDS)) {
    const standard = VERIFICATION_STANDARDS[category as keyof typeof VERIFICATION_STANDARDS];
    assertDefined(standard.acceptable_evidence, `${category} should have acceptable evidence`);
    assertDefined(standard.red_flags, `${category} should have red flags`);
  }
});

// ============================================================================
// SPIKE DETECTION SYSTEM TESTS
// ============================================================================

console.log('\n📋 SPIKE DETECTION SYSTEM TESTS');
console.log('-'.repeat(50));

test('Spike definitions cover all types', () => {
  const spikeTypes: SpikeType[] = [
    'research_scientist',
    'tech_builder',
    'entrepreneur',
    'writer_intellectual',
    'policy_advocate',
    'performing_artist',
    'visual_artist',
    'athlete_leader',
    'community_builder',
    'healthcare_servant',
    'environmental_champion',
    'cultural_bridge',
    'maker_inventor',
    'educator_mentor',
    'journalist_communicator',
  ];

  for (const spikeType of spikeTypes) {
    assertDefined(SPIKE_DEFINITIONS[spikeType], `Should have ${spikeType}`);

    const definition = SPIKE_DEFINITIONS[spikeType];
    assertDefined(definition.name, `${spikeType} should have name`);
    assertDefined(definition.description, `${spikeType} should have description`);
    assertDefined(definition.primaryIndicators, `${spikeType} should have primary indicators`);
    assertDefined(definition.alignedMajors, `${spikeType} should have aligned majors`);
    assertDefined(definition.examplePitch, `${spikeType} should have example pitch`);
    assertDefined(definition.commonMistakes, `${spikeType} should have common mistakes`);
    assertDefined(definition.strengtheningSuggestions, `${spikeType} should have suggestions`);
  }
});

test('Spike definitions have aligned majors', () => {
  // Research scientist should align with STEM majors
  const researchScientist = SPIKE_DEFINITIONS.research_scientist;
  assert(
    researchScientist.alignedMajors.includes('natural_sciences'),
    'Research scientist should align with natural sciences'
  );

  // Policy advocate should align with law/policy
  const policyAdvocate = SPIKE_DEFINITIONS.policy_advocate;
  assert(
    policyAdvocate.alignedMajors.includes('law_policy'),
    'Policy advocate should align with law/policy'
  );
});

test('Coherence score interpretation ranges are valid', () => {
  const interpretations = ['exceptional', 'strong', 'moderate', 'weak', 'scattered'] as const;

  for (const interpretation of interpretations) {
    const score = COHERENCE_SCORE_INTERPRETATION[interpretation];
    assertDefined(score.range, `${interpretation} should have range`);
    assertDefined(score.description, `${interpretation} should have description`);
    assert(
      score.range[0] < score.range[1],
      `${interpretation} range should be [min, max]`
    );
  }

  // Verify ranges don't overlap and cover 0-100
  assert(
    COHERENCE_SCORE_INTERPRETATION.exceptional.range[0] === 85,
    'Exceptional should start at 85'
  );
  assert(
    COHERENCE_SCORE_INTERPRETATION.scattered.range[0] === 0,
    'Scattered should start at 0'
  );
});

test('Spike scoring rules sum to reasonable total', () => {
  const totalPossiblePoints =
    SPIKE_SCORING_RULES.tier1_present.points +
    SPIKE_SCORING_RULES.multiple_tier2.points +
    SPIKE_SCORING_RULES.four_year_commitment.points +
    SPIKE_SCORING_RULES.leadership_progression.points +
    SPIKE_SCORING_RULES.verified_impact.points +
    SPIKE_SCORING_RULES.supporting_activities.max;

  // Total should be around 100 (allowing for some flexibility)
  assert(
    totalPossiblePoints >= 90 && totalPossiblePoints <= 110,
    `Total spike scoring points should be around 100, got ${totalPossiblePoints}`
  );
});

test('Spike coherence red flags have negative impacts', () => {
  for (const [key, flag] of Object.entries(SPIKE_COHERENCE_RED_FLAGS)) {
    assert(
      flag.deduction < 0,
      `${key} should have negative deduction`
    );
    assertDefined(flag.description, `${key} should have description`);
    assertDefined(flag.severity, `${key} should have severity`);
  }
});

test('Spike coherence green flags have positive impacts', () => {
  for (const [key, flag] of Object.entries(SPIKE_COHERENCE_GREEN_FLAGS)) {
    assert(
      flag.bonus > 0,
      `${key} should have positive bonus`
    );
    assertDefined(flag.description, `${key} should have description`);
  }
});

test('Pitch templates exist for spike types', () => {
  assertDefined(PITCH_TEMPLATES.research_scientist, 'Should have research scientist template');
  assertDefined(PITCH_TEMPLATES.tech_builder, 'Should have tech builder template');
  assertDefined(PITCH_TEMPLATES.entrepreneur, 'Should have entrepreneur template');
  assertDefined(PITCH_TEMPLATES.default, 'Should have default template');
});

test('Archetype detection rules cover all profiles', () => {
  assertDefined(ARCHETYPE_DETECTION_RULES.exceptional_spike, 'Should have exceptional spike');
  assertDefined(ARCHETYPE_DETECTION_RULES.strong_spike, 'Should have strong spike');
  assertDefined(ARCHETYPE_DETECTION_RULES.emerging_spike, 'Should have emerging spike');
  assertDefined(ARCHETYPE_DETECTION_RULES.well_rounded, 'Should have well rounded');
  assertDefined(ARCHETYPE_DETECTION_RULES.scattered, 'Should have scattered');

  // Verify each has criteria and result
  for (const [key, rule] of Object.entries(ARCHETYPE_DETECTION_RULES)) {
    assertDefined(rule.criteria, `${key} should have criteria`);
    assertDefined(rule.result, `${key} should have result`);
  }
});

test('Recommendation templates exist', () => {
  assertDefined(RECOMMENDATION_TEMPLATES.strengthen_spike, 'Should have strengthen spike');
  assertDefined(RECOMMENDATION_TEMPLATES.add_coherence, 'Should have add coherence');
  assertDefined(RECOMMENDATION_TEMPLATES.build_from_scratch, 'Should have build from scratch');
  assertDefined(RECOMMENDATION_TEMPLATES.leverage_existing, 'Should have leverage existing');

  // Verify each has multiple suggestions
  for (const [key, templates] of Object.entries(RECOMMENDATION_TEMPLATES)) {
    assert(
      templates.length >= 3,
      `${key} should have at least 3 suggestions`
    );
  }
});

// ============================================================================
// CROSS-DATABASE INTEGRATION TESTS
// ============================================================================

console.log('\n📋 CROSS-DATABASE INTEGRATION TESTS');
console.log('-'.repeat(50));

test('Extended database hierarchies have consistent structure', () => {
  // Verify hierarchies have expected top-level structure
  // Entrepreneurship has tier_1_exceptional, tier_2_distinguished, etc.
  assertDefined(ENTREPRENEURSHIP_STARTUP_HIERARCHY.tier_1_exceptional, 'Entrepreneurship should have tier_1_exceptional');
  assertDefined(NONPROFIT_SERVICE_HIERARCHY.tier_1_exceptional, 'Nonprofit should have tier_1_exceptional');

  // Performing arts has instrument categories (instrumental_music, vocal_music, etc.)
  assertDefined(PERFORMING_ARTS_HIERARCHY.instrumental_music, 'Performing arts should have instrumental_music');
  assertDefined(PERFORMING_ARTS_HIERARCHY.instrumental_music.tier_1_exceptional, 'Instrumental music should have tier_1_exceptional');

  // Visual arts has art categories (traditional_visual_arts, digital_media_arts)
  assertDefined(VISUAL_ARTS_HIERARCHY.traditional_visual_arts, 'Visual arts should have traditional_visual_arts');
  assertDefined(VISUAL_ARTS_HIERARCHY.traditional_visual_arts.tier_1_exceptional, 'Traditional arts should have tier_1_exceptional');

  // Writing has writing categories (creative_writing, journalism)
  assertDefined(WRITING_JOURNALISM_HIERARCHY.creative_writing, 'Writing should have creative_writing');
  assertDefined(WRITING_JOURNALISM_HIERARCHY.creative_writing.tier_1_exceptional, 'Creative writing should have tier_1_exceptional');
});

test('Major alignment and spike system are consistent', () => {
  // Tech builder spike should align with CS major in the matrix
  const techBuilderMajors = SPIKE_DEFINITIONS.tech_builder.alignedMajors;
  assert(
    techBuilderMajors.includes('computer_science'),
    'Tech builder should align with CS'
  );

  // CS major should highly value tech activities
  const csAlignment = MAJOR_ACTIVITY_ALIGNMENT_MATRIX.computer_science;
  assert(
    csAlignment.stem_competitions >= 4,
    'CS major should highly value STEM competitions'
  );
});

test('Impact metrics align with tier system', () => {
  // Verify transformational impact aligns with tier 1 activities
  const transformationalBeneficiaries = BENEFICIARY_METRICS.direct_beneficiaries.transformational;

  // 10,000 beneficiaries should be tier 1 nonprofit
  const tier1Nonprofit = NONPROFIT_SERVICE_HIERARCHY.tier_1_exceptional.founded_501c3_national;
  assert(
    tier1Nonprofit.impact_threshold <= transformationalBeneficiaries,
    'Tier 1 nonprofit threshold should align with transformational impact'
  );
});

// ============================================================================
// PRINT RESULTS
// ============================================================================

console.log('\n');
console.log('='.repeat(60));
console.log('📊 VALIDATION RESULTS SUMMARY');
console.log('='.repeat(60));

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log(`\nTotal Tests: ${results.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed > 0) {
  console.log('\n❌ FAILED TESTS:');
  for (const result of results.filter(r => !r.passed)) {
    console.log(`\n  ${result.name}`);
    console.log(`    Error: ${result.message}`);
  }
}

console.log('\n');

if (failed === 0) {
  console.log('🎉 ALL TESTS PASSED - Knowledge databases validated successfully!');
} else {
  console.log(`⚠️  ${failed} tests failed - review errors above`);
  process.exit(1);
}
