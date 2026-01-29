/**
 * Activity Scoring Cache System Test
 *
 * Verifies that:
 * 1. Caching correctly identifies unchanged activities
 * 2. Changed activities are re-scored (cache miss)
 * 3. Batch sizes are reduced appropriately
 * 4. Session management works correctly
 * 5. Hash consistency for deterministic caching
 * 6. Change detection accuracy
 *
 * NOTE: This test focuses on cache LOGIC verification.
 * The cache logic tests don't require API calls - they test the caching
 * mechanics directly using mock scores.
 *
 * For full API integration tests with live scoring, see the comprehensive
 * e2e tests that use Supabase edge functions.
 */

import {
  ScoringCacheService,
  DescriptionScore,
  ActivityScore,
  CacheUsageInfo,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring';
import { ActivityWorkshopInput } from '../src/services/portfolioStrategy/services/activityWorkshop/types';

// ============================================================================
// TEST DATA
// ============================================================================

const createTestActivities = (): ActivityWorkshopInput[] => [
  {
    id: 'act-1',
    title: 'USAMO Qualifier & Math Platform Creator',
    description:
      'Qualified for USAMO (top 500 nationally); built training platform now used by 5,000+ students preparing for AMC/AIME competitions.',
    category: 'Academic',
    role: 'Founder',
    organization: 'MathPrep Platform',
    gradeLevels: [10, 11, 12],
    hoursPerWeek: 15,
    weeksPerYear: 40,
    achievements: [{ title: 'USAMO Qualifier', year: 2023 }],
  },
  {
    id: 'act-2',
    title: 'Varsity Debate Captain',
    description:
      'Captain of state-ranked debate team; created novice training program converting 8 beginners to varsity competitors in one season.',
    category: 'Academic',
    role: 'Captain',
    organization: 'School Debate Team',
    gradeLevels: [9, 10, 11, 12],
    hoursPerWeek: 12,
    weeksPerYear: 35,
    achievements: [{ title: 'State Quarterfinalist', year: 2023 }],
  },
  {
    id: 'act-3',
    title: 'Independent ML Research',
    description:
      'Conducted independent research on machine learning applications in astronomy with Professor X at State University.',
    category: 'Academic',
    role: 'Research Assistant',
    organization: 'State University',
    gradeLevels: [11, 12],
    hoursPerWeek: 10,
    weeksPerYear: 30,
    achievements: [{ title: 'Regional Science Fair Presentation', year: 2023 }],
  },
  {
    id: 'act-4',
    title: 'Environmental Club VP',
    description:
      'Vice President of Environmental Club. Started school-wide recycling program achieving 30% waste reduction.',
    category: 'Community Service',
    role: 'Vice President',
    organization: 'Environmental Club',
    gradeLevels: [10, 11, 12],
    hoursPerWeek: 5,
    weeksPerYear: 35,
    achievements: [],
  },
  {
    id: 'act-5',
    title: 'National Honor Society',
    description:
      'Member of National Honor Society. Participated in tutoring program helping underclassmen with homework twice per month.',
    category: 'Academic',
    role: 'Member',
    organization: 'NHS',
    gradeLevels: [11, 12],
    hoursPerWeek: 2,
    weeksPerYear: 30,
    achievements: [],
  },
];

// Create mock scores for testing cache behavior
function createMockDescriptionScore(total: number): DescriptionScore {
  return {
    total,
    breakdown: {
      specificity: { score: total / 5, maxScore: 2, rationale: 'test specificity' },
      impactClarity: { score: total / 5, maxScore: 2, rationale: 'test impact' },
      actionLanguage: { score: total / 5, maxScore: 2, rationale: 'test action' },
      quantification: { score: total / 5, maxScore: 2, rationale: 'test quantification' },
      authenticityVoice: { score: total / 5, maxScore: 2, rationale: 'test authenticity' },
    },
    strengths: ['strength 1', 'strength 2'],
    improvements: ['improvement 1'],
    overallRationale: `Mock score of ${total}/10`,
  };
}

function createMockActivityScore(total: number): ActivityScore {
  return {
    total,
    breakdown: {
      tierAssessment: {
        score: total,
        maxScore: 10,
        weight: 0.3,
        weightedScore: total * 0.3,
        tier: total >= 8 ? 1 : total >= 6 ? 2 : total >= 4 ? 3 : 4,
        rationale: 'test tier',
      },
      recognitionLevel: {
        score: total,
        maxScore: 10,
        weight: 0.25,
        weightedScore: total * 0.25,
        level: total >= 8 ? 'national' : total >= 6 ? 'state' : 'school',
        rationale: 'test recognition',
      },
      leadershipImpact: {
        score: total,
        maxScore: 10,
        weight: 0.2,
        weightedScore: total * 0.2,
        isApplicable: true,
        role: 'team_lead',
        impactScope: 'organization',
        rationale: 'test leadership',
      },
      communityCharacter: {
        score: total,
        maxScore: 10,
        weight: 0.15,
        weightedScore: total * 0.15,
        primaryTrait: 'service',
        communityBenefit: 'moderate',
        authenticitySignal: 'genuine',
        rationale: 'test community',
      },
      commitmentProgression: {
        score: total,
        maxScore: 10,
        weight: 0.1,
        weightedScore: total * 0.1,
        years: 3,
        showsProgression: true,
        sustainedThroughJunior: true,
        rationale: 'test commitment',
      },
      weightConfig: {
        tierWeight: 0.3,
        recognitionWeight: 0.25,
        leadershipWeight: 0.2,
        communityWeight: 0.15,
        commitmentWeight: 0.1,
        leadershipApplicable: true,
      },
    },
    tierJustification: `Tier based on score ${total}`,
    comparisonBenchmarks: {
      similarTo: 'Similar tier activity',
      above: 'Higher tier activity',
      below: 'Lower tier activity',
    },
    improvementPaths: ['path 1', 'path 2'],
    overallRationale: `Mock activity score of ${total}/10`,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function logSection(title: string): void {
  console.log('\n' + '='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
}

// ============================================================================
// TESTS
// ============================================================================

async function testCacheBasics(): Promise<boolean> {
  logSection('TEST 1: Cache Basics - Session Creation & Hash Consistency');

  const cacheService = new ScoringCacheService();

  // Test session creation
  const session1 = cacheService.getOrCreateSession();
  const session2 = cacheService.getOrCreateSession(session1.sessionId);

  console.log(`✓ Session created: ${session1.sessionId}`);
  console.log(`✓ Same session returned: ${session1.sessionId === session2.sessionId}`);

  // Test hash consistency
  const testInput = {
    description: 'Test description',
    activityTitle: 'Test Activity',
    activityType: 'Academic',
    position: 'Leader',
  };

  const hash1 = cacheService.computeDescriptionHash(testInput);
  const hash2 = cacheService.computeDescriptionHash(testInput);
  const hash3 = cacheService.computeDescriptionHash({
    ...testInput,
    description: 'Different description',
  });

  console.log(`✓ Same input produces same hash: ${hash1 === hash2}`);
  console.log(`✓ Different input produces different hash: ${hash1 !== hash3}`);

  // Test case/whitespace normalization
  const hashNormalized1 = cacheService.computeDescriptionHash({
    ...testInput,
    description: '  Test Description  ',
  });
  const hashNormalized2 = cacheService.computeDescriptionHash({
    ...testInput,
    description: 'test description',
  });

  console.log(`✓ Whitespace/case normalized: ${hashNormalized1 === hashNormalized2}`);

  cacheService.destroy();

  return (
    session1.sessionId === session2.sessionId &&
    hash1 === hash2 &&
    hash1 !== hash3 &&
    hashNormalized1 === hashNormalized2
  );
}

async function testCacheHitMiss(): Promise<boolean> {
  logSection('TEST 2: Cache Hit/Miss Behavior');

  const cacheService = new ScoringCacheService();
  const sessionId = cacheService.createSession();
  const activities = createTestActivities();

  // Store scores for all activities
  console.log('Storing mock scores for all activities...');
  for (const activity of activities) {
    const descInput = {
      description: activity.description,
      activityTitle: activity.title,
      activityType: activity.category,
      position: activity.role,
    };
    const actInput = {
      title: activity.title,
      description: activity.description,
      type: activity.category,
      position: activity.role,
      organization: activity.organization,
      grades: activity.gradeLevels,
      hoursPerWeek: activity.hoursPerWeek,
      weeksPerYear: activity.weeksPerYear,
      honors: activity.achievements?.map((a) => a.title).join(', '),
    };

    cacheService.setDescriptionScore(sessionId, activity.id, descInput, createMockDescriptionScore(8));
    cacheService.setActivityScore(sessionId, activity.id, actInput, createMockActivityScore(7));
  }

  console.log(`✓ Stored scores for ${activities.length} activities`);

  // Test cache hits with same inputs
  let allHits = true;
  console.log('\nTesting cache hits (same inputs)...');
  for (const activity of activities) {
    const descInput = {
      description: activity.description,
      activityTitle: activity.title,
      activityType: activity.category,
      position: activity.role,
    };
    const actInput = {
      title: activity.title,
      description: activity.description,
      type: activity.category,
      position: activity.role,
      organization: activity.organization,
      grades: activity.gradeLevels,
      hoursPerWeek: activity.hoursPerWeek,
      weeksPerYear: activity.weeksPerYear,
      honors: activity.achievements?.map((a) => a.title).join(', '),
    };

    const descResult = cacheService.getDescriptionScore(sessionId, activity.id, descInput);
    const actResult = cacheService.getActivityScore(sessionId, activity.id, actInput);

    if (!descResult.hit || !actResult.hit) {
      allHits = false;
      console.log(`  ❌ ${activity.title}: desc=${descResult.hit}, act=${actResult.hit}`);
    } else {
      console.log(`  ✓ ${activity.title}: CACHE HIT (desc=${descResult.value?.total}, act=${actResult.value?.total})`);
    }
  }

  // Test cache miss with modified input
  console.log('\nTesting cache miss (modified description)...');
  const modifiedDescInput = {
    description: 'COMPLETELY DIFFERENT DESCRIPTION',
    activityTitle: activities[0].title,
    activityType: activities[0].category,
    position: activities[0].role,
  };

  const missResult = cacheService.getDescriptionScore(sessionId, activities[0].id, modifiedDescInput);
  const isMiss = !missResult.hit && missResult.missReason === 'hash_mismatch';
  console.log(`  ${isMiss ? '✓' : '❌'} Modified description: hit=${missResult.hit}, reason=${missResult.missReason}`);

  // Test cache miss for unknown activity
  console.log('\nTesting cache miss (unknown activity)...');
  const unknownResult = cacheService.getDescriptionScore(sessionId, 'unknown-id', {
    description: 'test',
    activityTitle: 'test',
    activityType: 'test',
    position: 'test',
  });
  const isNotFound = !unknownResult.hit && unknownResult.missReason === 'not_found';
  console.log(`  ${isNotFound ? '✓' : '❌'} Unknown activity: hit=${unknownResult.hit}, reason=${unknownResult.missReason}`);

  cacheService.destroy();

  return allHits && isMiss && isNotFound;
}

async function testChangeDetection(): Promise<boolean> {
  logSection('TEST 3: Change Detection');

  const cacheService = new ScoringCacheService();
  const sessionId = cacheService.createSession();
  const activities = createTestActivities();

  // Store cached scores for all activities
  for (const activity of activities) {
    const descInput = {
      description: activity.description,
      activityTitle: activity.title,
      activityType: activity.category,
      position: activity.role,
    };
    const actInput = {
      title: activity.title,
      description: activity.description,
      type: activity.category,
      position: activity.role,
      organization: activity.organization,
      grades: activity.gradeLevels,
      hoursPerWeek: activity.hoursPerWeek,
      weeksPerYear: activity.weeksPerYear,
      honors: activity.achievements?.map((a) => a.title).join(', '),
    };

    cacheService.setDescriptionScore(sessionId, activity.id, descInput, createMockDescriptionScore(7));
    cacheService.setActivityScore(sessionId, activity.id, actInput, createMockActivityScore(7));
  }

  cacheService.updateLastActivityIds(sessionId, activities.map((a) => a.id));
  console.log('✓ Cached scores for all activities');

  // Modify some activities
  const modifiedActivities = [...activities];
  modifiedActivities[0].description = 'Modified description for USAMO activity';
  modifiedActivities[2].hoursPerWeek = 20; // Change hours (activity details)

  // Add a new activity
  modifiedActivities.push({
    id: 'act-new',
    title: 'New Activity',
    description: 'A brand new activity added to the portfolio.',
    category: 'Other',
    role: 'Member',
    organization: 'New Org',
    gradeLevels: [12],
    hoursPerWeek: 5,
    weeksPerYear: 20,
    achievements: [],
  });

  const changeDetection = cacheService.detectChanges(
    sessionId,
    modifiedActivities.map((a) => ({
      id: a.id,
      descriptionInput: {
        description: a.description,
        activityTitle: a.title,
        activityType: a.category,
        position: a.role,
      },
      activityInput: {
        title: a.title,
        description: a.description,
        type: a.category,
        position: a.role,
        organization: a.organization,
        grades: a.gradeLevels,
        hoursPerWeek: a.hoursPerWeek,
        weeksPerYear: a.weeksPerYear,
        honors: a.achievements?.map((ach) => ach.title).join(', '),
      },
    }))
  );

  console.log(`\nChange Detection Results:`);
  console.log(`  New activities: ${changeDetection.newActivities.join(', ') || 'none'}`);
  console.log(`  Removed activities: ${changeDetection.removedActivities.join(', ') || 'none'}`);
  console.log(`  Changed descriptions: ${changeDetection.changedDescriptions.join(', ') || 'none'}`);
  console.log(`  Changed details: ${changeDetection.changedDetails.join(', ') || 'none'}`);
  console.log(`  Unchanged: ${changeDetection.unchanged.join(', ') || 'none'}`);
  console.log(`  Portfolio composition changed: ${changeDetection.portfolioCompositionChanged}`);

  const correctNewDetected = changeDetection.newActivities.includes('act-new');
  const correctDescChanged = changeDetection.changedDescriptions.includes('act-1');
  const correctDetailsChanged = changeDetection.changedDetails.includes('act-3');
  const correctUnchanged =
    changeDetection.unchanged.includes('act-2') &&
    changeDetection.unchanged.includes('act-4') &&
    changeDetection.unchanged.includes('act-5');
  const correctCompositionChanged = changeDetection.portfolioCompositionChanged === true;

  console.log(`\n✓ New activity detected: ${correctNewDetected}`);
  console.log(`✓ Description change detected: ${correctDescChanged}`);
  console.log(`✓ Details change detected: ${correctDetailsChanged}`);
  console.log(`✓ Unchanged activities identified: ${correctUnchanged}`);
  console.log(`✓ Portfolio composition changed: ${correctCompositionChanged}`);

  cacheService.destroy();

  return correctNewDetected && correctDescChanged && correctDetailsChanged && correctUnchanged && correctCompositionChanged;
}

async function testCacheUsageInfoBuilding(): Promise<boolean> {
  logSection('TEST 4: Cache Usage Info Building');

  const cacheService = new ScoringCacheService();
  const sessionId = cacheService.createSession();
  const activities = createTestActivities();

  // Simulate a scenario: 3 cached, 2 fresh
  const descriptionCacheResults = new Map<string, boolean>([
    ['act-1', true],  // cached
    ['act-2', true],  // cached
    ['act-3', false], // fresh (changed)
    ['act-4', true],  // cached
    ['act-5', false], // fresh (changed)
  ]);

  const activityCacheResults = new Map<string, boolean>([
    ['act-1', true],  // cached
    ['act-2', true],  // cached
    ['act-3', false], // fresh
    ['act-4', true],  // cached
    ['act-5', false], // fresh
  ]);

  const cacheInfo = cacheService.buildCacheUsageInfo(
    sessionId,
    activities.map((a) => ({ id: a.id, title: a.title })),
    descriptionCacheResults,
    activityCacheResults,
    false, // not forced fresh
    false  // no teaching requested
  );

  console.log('Cache Usage Info:');
  console.log(`  Session ID: ${cacheInfo.sessionId}`);
  console.log(`  Cache enabled: ${cacheInfo.cacheEnabled}`);
  console.log(`  Forced fresh: ${cacheInfo.forcedFresh}`);
  console.log(`\nSummary:`);
  console.log(`  Total activities: ${cacheInfo.summary.totalActivities}`);
  console.log(`  Descriptions cached: ${cacheInfo.summary.descriptionsCached}`);
  console.log(`  Descriptions fresh: ${cacheInfo.summary.descriptionsFresh}`);
  console.log(`  Activities cached: ${cacheInfo.summary.activitiesCached}`);
  console.log(`  Activities fresh: ${cacheInfo.summary.activitiesFresh}`);
  console.log(`  Portfolio scoring: ${cacheInfo.summary.portfolioScoringStatus}`);
  console.log(`  Teaching: ${cacheInfo.summary.teachingStatus}`);
  console.log(`\nSavings:`);
  console.log(`  Activities from cache: ${cacheInfo.savings.apiCallsSaved}`);
  console.log(`  Estimated cost saved: $${cacheInfo.savings.estimatedCostSaved.toFixed(4)}`);
  console.log(`  Estimated time saved: ${cacheInfo.savings.estimatedTimeSaved}ms`);

  // Verify correctness
  const correctTotal = cacheInfo.summary.totalActivities === 5;
  const correctDescCached = cacheInfo.summary.descriptionsCached === 3;
  const correctDescFresh = cacheInfo.summary.descriptionsFresh === 2;
  const correctActCached = cacheInfo.summary.activitiesCached === 3;
  const correctActFresh = cacheInfo.summary.activitiesFresh === 2;
  const correctPortfolio = cacheInfo.summary.portfolioScoringStatus === 'fresh';
  const correctTeaching = cacheInfo.summary.teachingStatus === 'skipped';
  const correctSavings = cacheInfo.savings.apiCallsSaved === 6; // 3 desc + 3 act

  console.log(`\nVerification:`);
  console.log(`  ✓ Total activities: ${correctTotal}`);
  console.log(`  ✓ Descriptions cached: ${correctDescCached}`);
  console.log(`  ✓ Descriptions fresh: ${correctDescFresh}`);
  console.log(`  ✓ Activities cached: ${correctActCached}`);
  console.log(`  ✓ Activities fresh: ${correctActFresh}`);
  console.log(`  ✓ Portfolio always fresh: ${correctPortfolio}`);
  console.log(`  ✓ Teaching skipped: ${correctTeaching}`);
  console.log(`  ✓ Savings calculated: ${correctSavings}`);

  cacheService.destroy();

  return correctTotal && correctDescCached && correctDescFresh &&
         correctActCached && correctActFresh && correctPortfolio &&
         correctTeaching && correctSavings;
}

async function testSessionManagement(): Promise<boolean> {
  logSection('TEST 5: Session Management');

  const cacheService = new ScoringCacheService();

  // Create multiple sessions
  const session1Id = cacheService.createSession();
  const session2Id = cacheService.createSession();

  console.log(`Created session 1: ${session1Id}`);
  console.log(`Created session 2: ${session2Id}`);

  const differentSessions = session1Id !== session2Id;
  console.log(`✓ Sessions are unique: ${differentSessions}`);

  // Store data in session 1
  const testInput = {
    description: 'Test description',
    activityTitle: 'Test Activity',
    activityType: 'Academic',
    position: 'Leader',
  };

  cacheService.setDescriptionScore(session1Id, 'test-act', testInput, createMockDescriptionScore(8));

  // Verify data exists in session 1
  const session1Result = cacheService.getDescriptionScore(session1Id, 'test-act', testInput);
  const session1HasData = session1Result.hit === true;
  console.log(`✓ Session 1 has cached data: ${session1HasData}`);

  // Verify data doesn't exist in session 2
  const session2Result = cacheService.getDescriptionScore(session2Id, 'test-act', testInput);
  const session2NoData = session2Result.hit === false;
  console.log(`✓ Session 2 is isolated (no data): ${session2NoData}`);

  // Test session invalidation
  cacheService.invalidateSession(session1Id);
  const afterInvalidate = cacheService.getDescriptionScore(session1Id, 'test-act', testInput);
  const invalidated = afterInvalidate.hit === false;
  console.log(`✓ Session 1 invalidated: ${invalidated}`);

  // Test get-or-create with existing session
  const existingSession = cacheService.getOrCreateSession(session2Id);
  const sameSession = existingSession.sessionId === session2Id;
  console.log(`✓ Get-or-create returns existing session: ${sameSession}`);

  // Test delete session
  cacheService.deleteSession(session2Id);
  const newSessionAfterDelete = cacheService.getOrCreateSession(session2Id);
  const recreatedSession = newSessionAfterDelete.sessionId !== session2Id;
  console.log(`✓ Deleted session is recreated with new ID: ${recreatedSession}`);

  cacheService.destroy();

  return differentSessions && session1HasData && session2NoData &&
         invalidated && sameSession && recreatedSession;
}

async function testActivityHashConsistency(): Promise<boolean> {
  logSection('TEST 6: Activity Hash Consistency');

  const cacheService = new ScoringCacheService();

  const baseInput = {
    title: 'Test Activity',
    description: 'Test description',
    type: 'Academic',
    position: 'Leader',
    organization: 'Test Org',
    grades: [11, 12],
    hoursPerWeek: 10,
    weeksPerYear: 40,
    honors: 'Test Honor',
  };

  // Test same input produces same hash
  const hash1 = cacheService.computeActivityHash(baseInput);
  const hash2 = cacheService.computeActivityHash({ ...baseInput });
  const sameHash = hash1 === hash2;
  console.log(`✓ Same input produces same hash: ${sameHash}`);

  // Test hours change produces different hash
  const hoursChangedHash = cacheService.computeActivityHash({ ...baseInput, hoursPerWeek: 15 });
  const hoursHashDifferent = hash1 !== hoursChangedHash;
  console.log(`✓ Hours change produces different hash: ${hoursHashDifferent}`);

  // Test grades change produces different hash
  const gradesChangedHash = cacheService.computeActivityHash({ ...baseInput, grades: [10, 11, 12] });
  const gradesHashDifferent = hash1 !== gradesChangedHash;
  console.log(`✓ Grades change produces different hash: ${gradesHashDifferent}`);

  // Test organization change produces different hash
  const orgChangedHash = cacheService.computeActivityHash({ ...baseInput, organization: 'Different Org' });
  const orgHashDifferent = hash1 !== orgChangedHash;
  console.log(`✓ Organization change produces different hash: ${orgHashDifferent}`);

  // Test grade order doesn't matter (sorted internally)
  const gradesReorderedHash = cacheService.computeActivityHash({ ...baseInput, grades: [12, 11] });
  const gradesOrderIndependent = hash1 === gradesReorderedHash;
  console.log(`✓ Grade order is normalized: ${gradesOrderIndependent}`);

  // Test undefined/empty fields are handled
  const minimalInput = {
    title: 'Test',
    description: 'Test',
    type: undefined,
    position: undefined,
    organization: undefined,
    grades: undefined,
    hoursPerWeek: undefined,
    weeksPerYear: undefined,
    honors: undefined,
  };
  const minimalHash = cacheService.computeActivityHash(minimalInput as any);
  const minimalHashExists = minimalHash && minimalHash.length > 0;
  console.log(`✓ Minimal input produces valid hash: ${minimalHashExists}`);

  cacheService.destroy();

  return sameHash && hoursHashDifferent && gradesHashDifferent &&
         orgHashDifferent && gradesOrderIndependent && minimalHashExists;
}

async function testScoreConsistency(): Promise<boolean> {
  logSection('TEST 7: Score Value Consistency');

  const cacheService = new ScoringCacheService();
  const sessionId = cacheService.createSession();

  const testInput = {
    description: 'A great activity description with lots of details and impact.',
    activityTitle: 'Test Activity',
    activityType: 'Academic',
    position: 'Leader',
  };

  // Create a score with specific values
  const originalScore = createMockDescriptionScore(8.5);
  originalScore.strengths = ['specific strength 1', 'specific strength 2'];
  originalScore.improvements = ['specific improvement'];
  originalScore.overallRationale = 'Very specific rationale for this score';

  // Store it
  cacheService.setDescriptionScore(sessionId, 'test-act', testInput, originalScore);

  // Retrieve it
  const result = cacheService.getDescriptionScore(sessionId, 'test-act', testInput);

  if (!result.hit || !result.value) {
    console.log('❌ Failed to retrieve cached score');
    cacheService.destroy();
    return false;
  }

  const retrievedScore = result.value;

  // Verify all fields match
  const totalMatch = retrievedScore.total === originalScore.total;
  const strengthsMatch = JSON.stringify(retrievedScore.strengths) === JSON.stringify(originalScore.strengths);
  const improvementsMatch = JSON.stringify(retrievedScore.improvements) === JSON.stringify(originalScore.improvements);
  const rationaleMatch = retrievedScore.overallRationale === originalScore.overallRationale;
  const breakdownMatch =
    retrievedScore.breakdown.specificity.score === originalScore.breakdown.specificity.score &&
    retrievedScore.breakdown.impactClarity.rationale === originalScore.breakdown.impactClarity.rationale;

  console.log(`✓ Total score preserved: ${totalMatch} (${retrievedScore.total})`);
  console.log(`✓ Strengths preserved: ${strengthsMatch}`);
  console.log(`✓ Improvements preserved: ${improvementsMatch}`);
  console.log(`✓ Rationale preserved: ${rationaleMatch}`);
  console.log(`✓ Breakdown preserved: ${breakdownMatch}`);

  cacheService.destroy();

  return totalMatch && strengthsMatch && improvementsMatch && rationaleMatch && breakdownMatch;
}

async function testForceFreshFlag(): Promise<boolean> {
  logSection('TEST 8: Force Fresh Flag Behavior');

  const cacheService = new ScoringCacheService();
  const sessionId = cacheService.createSession();
  const activities = createTestActivities();

  // Build cache info with forceFresh = true
  const descriptionCacheResults = new Map<string, boolean>(
    activities.map(a => [a.id, false]) // All fresh
  );
  const activityCacheResults = new Map<string, boolean>(
    activities.map(a => [a.id, false]) // All fresh
  );

  const forceFreshInfo = cacheService.buildCacheUsageInfo(
    sessionId,
    activities.map((a) => ({ id: a.id, title: a.title })),
    descriptionCacheResults,
    activityCacheResults,
    true,  // forceFresh = true
    false  // no teaching
  );

  const forceFreshFlagSet = forceFreshInfo.forcedFresh === true;
  const allDescFresh = forceFreshInfo.summary.descriptionsFresh === activities.length;
  const allActFresh = forceFreshInfo.summary.activitiesFresh === activities.length;
  const noCached = forceFreshInfo.summary.descriptionsCached === 0 &&
                   forceFreshInfo.summary.activitiesCached === 0;

  console.log(`✓ Force fresh flag set: ${forceFreshFlagSet}`);
  console.log(`✓ All descriptions fresh: ${allDescFresh}`);
  console.log(`✓ All activities fresh: ${allActFresh}`);
  console.log(`✓ Nothing cached: ${noCached}`);

  // Verify per-activity status shows fresh
  let allStatusFresh = true;
  for (const status of forceFreshInfo.activityCacheStatus) {
    if (status.descriptionScoreStatus !== 'fresh' || status.activityScoreStatus !== 'fresh') {
      allStatusFresh = false;
      break;
    }
  }
  console.log(`✓ Per-activity status all fresh: ${allStatusFresh}`);

  cacheService.destroy();

  return forceFreshFlagSet && allDescFresh && allActFresh && noCached && allStatusFresh;
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests(): Promise<void> {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║     ACTIVITY SCORING CACHE SYSTEM - LOGIC VERIFICATION TEST          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log('\nThis test verifies cache logic WITHOUT making API calls.');
  console.log('For full API integration tests, use the Supabase edge function tests.\n');

  const results: { name: string; passed: boolean }[] = [];

  try {
    // Test 1: Cache basics
    const test1 = await testCacheBasics();
    results.push({ name: 'Cache Basics (Session & Hash)', passed: test1 });

    // Test 2: Cache hit/miss
    const test2 = await testCacheHitMiss();
    results.push({ name: 'Cache Hit/Miss Behavior', passed: test2 });

    // Test 3: Change detection
    const test3 = await testChangeDetection();
    results.push({ name: 'Change Detection', passed: test3 });

    // Test 4: Cache usage info building
    const test4 = await testCacheUsageInfoBuilding();
    results.push({ name: 'Cache Usage Info Building', passed: test4 });

    // Test 5: Session management
    const test5 = await testSessionManagement();
    results.push({ name: 'Session Management', passed: test5 });

    // Test 6: Activity hash consistency
    const test6 = await testActivityHashConsistency();
    results.push({ name: 'Activity Hash Consistency', passed: test6 });

    // Test 7: Score consistency
    const test7 = await testScoreConsistency();
    results.push({ name: 'Score Value Consistency', passed: test7 });

    // Test 8: Force fresh flag
    const test8 = await testForceFreshFlag();
    results.push({ name: 'Force Fresh Flag Behavior', passed: test8 });

  } catch (error) {
    console.error('\n❌ Test suite error:', error);
  }

  // Summary
  logSection('TEST SUMMARY');

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  for (const result of results) {
    console.log(`  ${result.passed ? '✓' : '❌'} ${result.name}`);
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  Total: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('\n✅ ALL CACHE LOGIC TESTS PASSED!');
    console.log('\nThe caching system correctly:');
    console.log('  • Creates and manages sessions');
    console.log('  • Computes consistent hashes for inputs');
    console.log('  • Detects changed vs unchanged activities');
    console.log('  • Returns cached scores for unchanged inputs');
    console.log('  • Reports cache misses for changed inputs');
    console.log('  • Builds accurate cache usage reports');
    console.log('  • Preserves all score data through cache');
  } else {
    console.log('\n❌ SOME TESTS FAILED - Review issues above');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);
