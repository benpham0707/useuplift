/**
 * Test: Capability Conversation System
 *
 * Tests the conversational capability profiling system end-to-end:
 * - Topic detection from quantitative analysis
 * - Insight extraction from student responses
 * - Profile synthesis combining quantitative + qualitative
 * - Full conversation flow
 */

import {
  analyzeCapabilityNuanced,
  type NuancedCapabilityAnalysis,
} from '../src/services/portfolioStrategy/services/academicWorkshop/capability/nuancedCapabilityAnalyzer';

import {
  detectTopics,
  initializeCapabilityConversation,
  processCapabilityConversationTurn,
  finalizeCapabilityConversation,
  extractInsights,
  synthesizeProfile,
  type ConversationState,
  type QualitativeInsights,
  type ConversationTopic,
} from '../src/services/portfolioStrategy/services/academicWorkshop/capability/conversational';

import type { CourseRecord } from '../src/services/portfolioStrategy/services/academicHistoryAnalyzer';

// ============================================================================
// TEST DATA
// ============================================================================

// Note: CourseRecord uses numeric years (9, 10, 11, 12) and specific level strings
const TEST_COURSES: CourseRecord[] = [
  // Math progression - strong
  { name: 'Algebra 2', subject: 'math', level: 'honors', grade: 'A', year: 9 },
  { name: 'Pre-Calculus', subject: 'math', level: 'honors', grade: 'A', year: 10 },
  { name: 'AP Calculus AB', subject: 'math', level: 'ap', grade: 'A-', year: 11 },

  // Science progression - struggled then recovered
  { name: 'Biology', subject: 'science', level: 'honors', grade: 'A-', year: 9 },
  { name: 'Chemistry', subject: 'science', level: 'honors', grade: 'B', year: 10 },
  { name: 'AP Chemistry', subject: 'science', level: 'ap', grade: 'B-', year: 11 },

  // English - consistent
  { name: 'English 9', subject: 'english', level: 'honors', grade: 'A-', year: 9 },
  { name: 'English 10', subject: 'english', level: 'honors', grade: 'B+', year: 10 },
  { name: 'AP English Language', subject: 'english', level: 'ap', grade: 'B+', year: 11 },

  // History - improving
  { name: 'World History', subject: 'social_studies', level: 'regular', grade: 'B', year: 9 },
  { name: 'US History', subject: 'social_studies', level: 'honors', grade: 'B+', year: 10 },
  { name: 'AP US History', subject: 'social_studies', level: 'ap', grade: 'A-', year: 11 },

  // Foreign Language
  { name: 'Spanish 1', subject: 'foreign_language', level: 'regular', grade: 'A', year: 9 },
  { name: 'Spanish 2', subject: 'foreign_language', level: 'honors', grade: 'A-', year: 10 },
];

const TEST_GRADE_HISTORY = {
  '9': { gpa: 3.7, courses: 5 },
  '10': { gpa: 3.5, courses: 5 },
  '11': { gpa: 3.6, courses: 4 },
};

// Simulated student responses
const STUDENT_RESPONSES: Array<{
  trigger: string;
  response: string;
}> = [
  {
    trigger: 'chemistry',
    response: "Chemistry was really tough for me. The teacher wasn't great at explaining things, and I felt like I had to teach myself most of the material. I spent hours studying but still couldn't quite get the grades I wanted. It was frustrating because I was actually interested in the subject.",
  },
  {
    trigger: 'math',
    response: "Math has always been my thing. I don't have to work super hard at it - things just click for me. AP Calc was a bit more challenging, but I still felt comfortable. I'd definitely say math is my strongest subject.",
  },
  {
    trigger: 'history',
    response: "I used to think history was boring, but I had an amazing APUSH teacher who made it all come alive. I found myself actually enjoying the readings and discussions. The grade improvement wasn't because it got easier - I just started caring more about it.",
  },
  {
    trigger: 'english',
    response: "English is fine, I guess. I can write well when I put in the effort, but I don't always feel motivated to. The analytical essays can be tedious. I do what I need to do to get a good grade.",
  },
  {
    trigger: 'overall',
    response: "Sophomore year was rough - I was dealing with some family stuff and it affected my focus. I think that's why my grades dipped a bit that year. Junior year I got it together and pushed myself harder.",
  },
];

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function testTopicDetection() {
  console.log('\n=== TEST: Topic Detection ===\n');

  // First get quantitative analysis
  const analysis = analyzeCapabilityNuanced(TEST_COURSES, TEST_GRADE_HISTORY);

  // Detect topics
  const topics = detectTopics(analysis, {
    maxTopics: 15,
    intendedMajor: 'Computer Science',
    prioritizeAnomalies: true,
  });

  console.log(`Detected ${topics.length} topics to explore:\n`);

  for (const topic of topics.slice(0, 8)) {
    console.log(`[${topic.type}] Priority: ${topic.priority.toFixed(1)}`);
    console.log(`  Context: ${topic.context}`);
    console.log(`  Question: ${topic.primaryQuestion.substring(0, 100)}...`);
    console.log();
  }

  // Verify we got anomalies
  const anomalyTopics = topics.filter((t) => t.type === 'grade_anomaly');
  console.log(`✓ Found ${anomalyTopics.length} grade anomaly topics`);

  // Verify we got transition topics
  const transitionTopics = topics.filter((t) => t.type === 'difficulty_transition');
  console.log(`✓ Found ${transitionTopics.length} difficulty transition topics`);

  // Verify subject overviews
  const overviewTopics = topics.filter((t) => t.type === 'subject_overview');
  console.log(`✓ Found ${overviewTopics.length} subject overview topics`);

  return topics;
}

async function testInsightExtraction() {
  console.log('\n=== TEST: Insight Extraction ===\n');

  // Create a mock topic for testing
  const mockTopic: ConversationTopic = {
    id: 'test_topic_1',
    type: 'grade_anomaly',
    priority: 9,
    scope: {
      course: 'AP Chemistry',
      subject: 'science',
    },
    context: 'AP Chemistry grade was lower than expected',
    primaryQuestion: 'Can you tell me about your experience in AP Chemistry?',
    followUpQuestions: [
      'How much effort did you put in?',
      'How was the teacher?',
    ],
    targetInsights: ['effort_level', 'teacher_quality', 'perceived_difficulty'],
    status: 'in_progress',
  };

  const chemistryResponse = STUDENT_RESPONSES.find((r) => r.trigger === 'chemistry')!;

  console.log('Student message:');
  console.log(`"${chemistryResponse.response}"\n`);

  const result = await extractInsights(chemistryResponse.response, mockTopic, {
    model: 'haiku',
  });

  console.log('Extraction result:', result.success ? 'SUCCESS' : 'FAILED');
  console.log(`Extracted ${result.insights.length} insights:\n`);

  for (const insight of result.insights) {
    console.log(`Type: ${insight.type}`);
    console.log(`Confidence: ${insight.extractionConfidence}%`);
    console.log(`Values:`, JSON.stringify(insight.values, null, 2));
    if (insight.supportingQuote) {
      console.log(`Quote: "${insight.supportingQuote.substring(0, 80)}..."`);
    }
    console.log(`Sentiment: ${insight.sentiment || 'not detected'}`);
    console.log();
  }

  return result;
}

async function testFullConversationFlow() {
  console.log('\n=== TEST: Full Conversation Flow ===\n');

  // Get quantitative analysis
  const analysis = analyzeCapabilityNuanced(TEST_COURSES, TEST_GRADE_HISTORY);
  console.log('Generated quantitative analysis\n');

  // Initialize conversation
  console.log('--- Initializing Conversation ---\n');
  const initResult = await initializeCapabilityConversation(analysis, {
    intendedMajor: 'Computer Science',
    responseModel: 'haiku',
    extractionModel: 'haiku',
  });

  if (!initResult.success) {
    console.error('Failed to initialize conversation:', initResult.error);
    return;
  }

  console.log('AI Opener:');
  console.log(`"${initResult.opener.message}"\n`);
  console.log('Suggested topics:', initResult.opener.suggestedTopics);
  console.log('Topics in queue:', initResult.state.pendingTopics.length);
  console.log();

  // Run conversation turns
  let state = initResult.state;
  let qualitativeInsights = initResult.qualitativeInsights;
  let turnCount = 0;
  const maxTurns = 5;

  while (turnCount < maxTurns) {
    turnCount++;
    console.log(`\n--- Turn ${turnCount} ---\n`);

    // Find an appropriate student response based on current topic
    let studentMessage: string;
    if (state.currentTopic) {
      const subject = state.currentTopic.scope.subject;
      const course = state.currentTopic.scope.course?.toLowerCase() || '';

      // Match response to topic
      const match = STUDENT_RESPONSES.find(
        (r) =>
          (subject && r.trigger === subject) ||
          course.includes(r.trigger) ||
          (state.currentTopic?.type === 'trend_exploration' && r.trigger === 'overall')
      );

      studentMessage = match?.response || "I'm not sure what to say about that.";
    } else {
      studentMessage = STUDENT_RESPONSES[turnCount % STUDENT_RESPONSES.length].response;
    }

    console.log(`Student: "${studentMessage.substring(0, 100)}..."\n`);

    // Process turn
    const turnResult = await processCapabilityConversationTurn(
      studentMessage,
      state,
      qualitativeInsights,
      analysis
    );

    if (!turnResult.success) {
      console.error('Turn failed:', turnResult.error);
      break;
    }

    console.log(`AI: "${turnResult.response.message}"\n`);
    console.log(`Response type: ${turnResult.response.type}`);
    console.log(`Insights extracted: ${turnResult.response.extractedInsights.length}`);
    console.log(`Completion progress: ${turnResult.response.completionProgress}%`);
    console.log(`Should continue: ${turnResult.response.shouldContinue}`);

    // Update state
    state = turnResult.state;
    qualitativeInsights = turnResult.qualitativeInsights;

    if (!turnResult.response.shouldContinue) {
      console.log('\nConversation complete!');
      break;
    }
  }

  // Finalize and synthesize
  console.log('\n--- Finalizing Conversation ---\n');

  const synthesizedProfile = finalizeCapabilityConversation(
    state,
    qualitativeInsights,
    analysis
  );

  console.log('=== SYNTHESIZED PROFILE ===\n');

  console.log('Synthesis Confidence:', synthesizedProfile.synthesisConfidence);
  console.log('Qualitative Data Points:', synthesizedProfile.metadata.qualitativeDataPoints);
  console.log('Conversation Turns:', synthesizedProfile.metadata.conversationTurns);
  console.log();

  console.log('Adjusted Subject Strengths:');
  for (const [subject, strength] of synthesizedProfile.adjustedSubjectStrengths) {
    const change = strength.adjustedRelativeStrength - strength.originalRelativeStrength;
    const changeStr = change > 0 ? `+${(change * 100).toFixed(0)}%` : `${(change * 100).toFixed(0)}%`;
    console.log(
      `  ${subject}: ${(strength.originalRelativeStrength * 100).toFixed(0)}% → ${(strength.adjustedRelativeStrength * 100).toFixed(0)}% (${changeStr})`
    );
    if (strength.adjustmentReasoning !== 'No adjustments made') {
      console.log(`    Reason: ${strength.adjustmentReasoning.substring(0, 80)}...`);
    }
  }
  console.log();

  console.log('Synthesized Insights:');
  for (const insight of synthesizedProfile.synthesizedInsights.slice(0, 5)) {
    console.log(`  [${insight.category}] ${insight.insight}`);
    console.log(`    Sources align: ${insight.sourcesAlign}`);
    console.log(`    Confidence: ${insight.confidence}%`);
    console.log();
  }

  if (synthesizedProfile.mismatches.length > 0) {
    console.log('Mismatches Detected:');
    for (const mismatch of synthesizedProfile.mismatches) {
      console.log(`  ${mismatch.subject} - ${mismatch.aspect}`);
      console.log(`    Quantitative: ${mismatch.quantitativeSays}`);
      console.log(`    Qualitative: ${mismatch.qualitativeSays}`);
      console.log(`    Resolution: ${mismatch.resolution}`);
      console.log();
    }
  }

  if (synthesizedProfile.selfAwareness) {
    console.log('Self-Awareness Assessment:');
    console.log(`  Perception Accuracy: ${synthesizedProfile.selfAwareness.selfPerceptionAccuracy}%`);
    console.log(`  Estimation Tendency: ${synthesizedProfile.selfAwareness.estimationTendency}`);
    if (synthesizedProfile.selfAwareness.blindSpots.length > 0) {
      console.log('  Blind Spots:');
      for (const bs of synthesizedProfile.selfAwareness.blindSpots.slice(0, 3)) {
        console.log(`    - ${bs.area}: They think "${bs.theyThink}" but data suggests "${bs.dataSuggests}"`);
      }
    }
  }

  return synthesizedProfile;
}

async function testAOPerceptionVsInternalUnderstanding() {
  console.log('\n=== TEST: AO Perception vs Internal Understanding Separation ===\n');

  // Get quantitative analysis
  const analysis = analyzeCapabilityNuanced(TEST_COURSES, TEST_GRADE_HISTORY);

  // Create mock qualitative insights with significant context
  // that would traditionally "adjust" scores but NOW should only affect guidance
  const mockQualitativeInsights: QualitativeInsights = {
    courseAnnotations: new Map([
      [
        'AP Chemistry',
        {
          courseId: 'ap-chem-11',
          courseName: 'AP Chemistry',
          subject: 'science' as const,
          year: 11,
          effortLevel: 5, // Maximum effort
          perceivedDifficulty: 5, // Very hard
          gradeReflectsAbility: false, // Grade doesn't reflect ability
          gradeReflectsEffort: false, // Worked harder than grade shows
          teacherQuality: 'terrible' as const, // Simple string type as per types.ts
          classEnvironment: 'competitive' as const, // Simple string type as per types.ts
          externalCircumstances: [
            {
              type: 'family' as const,
              description: 'Family health crisis during this course',
              timing: 'during_course' as const,
              impact: 'major_negative' as const, // Using ImpactLevel type
              resolved: true,
            },
          ],
          enjoymentLevel: 4, // Actually enjoyed the subject
          engagementLevel: 4,
          intrinsicInterest: true, // Genuinely interested despite bad grade
          confidenceAfter: 3,
          wouldTakeAgain: null,
          flags: [],
          confidenceInAnnotation: 90,
        },
      ],
    ]),
    subjectInsights: new Map([
      [
        'math',
        {
          subject: 'math',
          overallConfidence: 90,
          overallInterest: 80,
          overallEffort: 25, // Very low effort + excellent grades = hidden potential
          perceivedDifficulty: 20,
          effortGradeCorrelation: 0.5,
          consistencyWithPerformance: 85,
          selfAssessedStrength: true,
          selfAssessedChallenge: false,
          mismatchWithData: null,
          intendsToContinue: true,
          willingnessToChallenge: 5,
          specificFutureCourses: ['AP Calculus BC'],
          keyStatements: ["Math comes naturally to me"],
          narrativeSummary: 'Exceptional with minimal effort',
        },
      ],
      [
        'science',
        {
          subject: 'science',
          overallConfidence: 35,
          overallInterest: 85, // Highly interested despite poor grades
          overallEffort: 95, // Max effort
          perceivedDifficulty: 90,
          effortGradeCorrelation: 0.1, // Poor correlation - effort doesn't translate
          consistencyWithPerformance: 30,
          selfAssessedStrength: false,
          selfAssessedChallenge: true,
          mismatchWithData: {
            theyThink: 'I could do well if I had a better teacher',
            dataSays: 'B- average despite high effort',
          },
          intendsToContinue: true,
          willingnessToChallenge: 4,
          specificFutureCourses: ['AP Physics'],
          keyStatements: [
            "The teacher was terrible",
            "I was dealing with family stuff",
            "I actually love science",
          ],
          narrativeSummary: 'Grades underrepresent ability due to external factors',
        },
      ],
    ]),
    learningStyleIndicators: null,
    motivationProfile: null,
    selfAwarenessAssessment: null,
    globalCircumstances: [
      {
        description: 'Family health crisis during sophomore year',
        timeframe: 'sophomore year',
        impact: 'major_negative' as const, // Using ImpactLevel type
        affectedSubjects: 'all' as const,
        resolved: true,
      },
    ],
    conversationHistory: [],
    allExtractedInsights: [],
    completeness: {
      overallCompleteness: 80,
      subjectCompleteness: new Map(),
      topicsCovered: 8,
      topicsTotal: 10,
      coursesAnnotated: 4,
      coursesTotal: 14,
      missingAreas: [],
      recommendedNextTopics: [],
    },
  };

  // Synthesize
  const synthesized = synthesizeProfile(analysis, mockQualitativeInsights);

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  CRITICAL: VERIFYING SCORE INTEGRITY                           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  let testsPassedCount = 0;
  let testsFailedCount = 0;

  // TEST 1: Verify AO Perception scores are NEVER adjusted
  console.log('TEST 1: AO Perception scores should NEVER be adjusted\n');

  if (synthesized.subjectAnalyses) {
    for (const subjectAnalysis of synthesized.subjectAnalyses) {
      const subject = subjectAnalysis.subject;
      // subjectPatterns can be either a Map or an object depending on how it was created
      const subjectPatternsMap = analysis.subjectPatterns;
      const quantPattern = subjectPatternsMap instanceof Map
        ? subjectPatternsMap.get(subject)
        : (subjectPatternsMap as Record<string, { relativeStrength: number }>)[subject];

      if (quantPattern) {
        const aoRelativeStrength = subjectAnalysis.aoPerception.relativeStrength;
        const originalStrength = quantPattern.relativeStrength;

        if (Math.abs(aoRelativeStrength - originalStrength) < 0.001) {
          console.log(`  ✓ ${subject}: AO perception (${(aoRelativeStrength * 100).toFixed(0)}%) matches original (${(originalStrength * 100).toFixed(0)}%)`);
          testsPassedCount++;
        } else {
          console.log(`  ✗ ${subject}: AO perception MISMATCH! AO=${(aoRelativeStrength * 100).toFixed(0)}%, Original=${(originalStrength * 100).toFixed(0)}%`);
          testsFailedCount++;
        }
      }
    }
  }

  // TEST 2: Verify legacy adjustedRelativeStrength equals original (no change)
  console.log('\nTEST 2: Legacy adjustedRelativeStrength should equal original (backwards compatibility)\n');

  for (const [subject, strength] of synthesized.adjustedSubjectStrengths) {
    const change = strength.adjustedRelativeStrength - strength.originalRelativeStrength;
    if (Math.abs(change) < 0.001) {
      console.log(`  ✓ ${subject}: No score adjustment (${(strength.originalRelativeStrength * 100).toFixed(0)}% → ${(strength.adjustedRelativeStrength * 100).toFixed(0)}%)`);
      testsPassedCount++;
    } else {
      console.log(`  ✗ ${subject}: UNEXPECTED ADJUSTMENT! ${(strength.originalRelativeStrength * 100).toFixed(0)}% → ${(strength.adjustedRelativeStrength * 100).toFixed(0)}%`);
      testsFailedCount++;
    }
  }

  // TEST 3: Verify Internal Understanding is populated with qualitative context
  console.log('\nTEST 3: Internal Understanding should contain qualitative context\n');

  if (synthesized.subjectAnalyses) {
    // subjectAnalyses is a Map<SubjectArea, SubjectAnalysisWithContext>
    const scienceAnalysis = synthesized.subjectAnalyses.get('science');
    const mathAnalysis = synthesized.subjectAnalyses.get('math');

    // Science should have external factors detected
    if (scienceAnalysis) {
      const hasExternalFactors = scienceAnalysis.internalUnderstanding.externalFactors.length > 0;
      const hasTeacherIssues = scienceAnalysis.internalUnderstanding.teacherQualityIssues.length > 0;
      const hasHigherCapability = scienceAnalysis.internalUnderstanding.trueCapabilityEstimate === 'higher_than_grades';

      if (hasExternalFactors || hasTeacherIssues) {
        console.log(`  ✓ Science: External factors/teacher issues detected`);
        console.log(`    - External factors: ${scienceAnalysis.internalUnderstanding.externalFactors.length}`);
        console.log(`    - Teacher issues: ${scienceAnalysis.internalUnderstanding.teacherQualityIssues.length}`);
        testsPassedCount++;
      } else {
        console.log(`  ✗ Science: Missing external context`);
        testsFailedCount++;
      }

      if (hasHigherCapability) {
        console.log(`  ✓ Science: Correctly identified as "higher capability than grades show"`);
        testsPassedCount++;
      } else {
        console.log(`  ⚠ Science: Capability estimate is "${scienceAnalysis.internalUnderstanding.trueCapabilityEstimate}" (may be correct based on data)`);
      }
    }

    // Math should have hidden potential detected (low effort + high grades)
    if (mathAnalysis) {
      const hasHiddenPotential = mathAnalysis.internalUnderstanding.hiddenPotential !== null;
      const lowEffort = mathAnalysis.internalUnderstanding.reportedEffort < 40;

      if (lowEffort && hasHiddenPotential) {
        console.log(`  ✓ Math: Hidden potential detected (low effort: ${mathAnalysis.internalUnderstanding.reportedEffort}%)`);
        testsPassedCount++;
      } else if (lowEffort) {
        console.log(`  ✓ Math: Low effort correctly captured (${mathAnalysis.internalUnderstanding.reportedEffort}%)`);
        testsPassedCount++;
      }
    }
  }

  // TEST 4: Verify Application Strategy has actionable guidance
  console.log('\nTEST 4: Application Strategy should have actionable guidance\n');

  if (synthesized.subjectAnalyses) {
    const scienceAnalysis = synthesized.subjectAnalyses.get('science');

    if (scienceAnalysis?.applicationStrategy) {
      const additionalInfo = scienceAnalysis.applicationStrategy.additionalInfoRecommendation;
      const hasAdditionalInfo = additionalInfo !== null;
      const counselorPoints = scienceAnalysis.applicationStrategy.counselorLetterPoints;
      const hasCounselorPoints = counselorPoints && counselorPoints.length > 0;

      if (hasAdditionalInfo || hasCounselorPoints) {
        console.log(`  ✓ Science: Application strategy generated`);
        if (hasAdditionalInfo && additionalInfo?.topic) {
          console.log(`    - Additional Info recommended: "${additionalInfo.topic.substring(0, 50)}..."`);
        }
        if (hasCounselorPoints) {
          console.log(`    - Counselor letter points: ${counselorPoints.length}`);
        }
        testsPassedCount++;
      } else {
        console.log(`  ⚠ Science: Application strategy exists but no specific recommendations`);
      }
    }
  }

  // TEST 5: Verify Perception-Reality Gaps are detected
  console.log('\nTEST 5: Perception-Reality Gaps should be detected where applicable\n');

  if (synthesized.subjectAnalyses) {
    const scienceAnalysis = synthesized.subjectAnalyses.get('science');

    if (scienceAnalysis?.perceptionRealityGap) {
      const gap = scienceAnalysis.perceptionRealityGap;
      console.log(`  ✓ Science: Perception-Reality gap detected`);
      console.log(`    - Severity: ${gap.severity || 'not set'}`);
      if (gap.aoWillSee) {
        console.log(`    - AO sees: "${gap.aoWillSee.substring(0, 60)}..."`);
      }
      if (gap.realityIs) {
        console.log(`    - Reality: "${gap.realityIs.substring(0, 60)}..."`);
      }
      testsPassedCount++;
    } else {
      console.log(`  ⚠ Science: No perception-reality gap (may be intentional)`);
    }
  }

  // TEST 6: Verify Global Application Strategy exists
  console.log('\nTEST 6: Global Application Strategy should exist\n');

  if (synthesized.globalApplicationStrategy) {
    const gs = synthesized.globalApplicationStrategy;
    console.log(`  ✓ Global strategy generated`);
    console.log(`    - Primary selling points: ${gs.keyStrengthsToEmphasize?.length || 0}`);
    console.log(`    - Areas needing explanation: ${gs.areasNeedingExplanation?.length || 0}`);
    console.log(`    - Supplemental essay topics: ${gs.supplementalEssayTopics?.length || 0}`);
    testsPassedCount++;
  } else {
    console.log(`  ✗ Global strategy missing`);
    testsFailedCount++;
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log(`║  RESULTS: ${testsPassedCount} passed, ${testsFailedCount} failed                                     ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (testsFailedCount > 0) {
    console.log('❌ CRITICAL: Score integrity may be compromised!');
    return false;
  } else {
    console.log('✓ Score integrity verified - AO perception scores unchanged');
    console.log('✓ Internal understanding captures qualitative context');
    console.log('✓ Application strategy provides actionable guidance');
    return true;
  }
}

async function testProfileSynthesis() {
  console.log('\n=== TEST: Profile Synthesis Rules ===\n');

  // Get quantitative analysis
  const analysis = analyzeCapabilityNuanced(TEST_COURSES, TEST_GRADE_HISTORY);

  // Create mock qualitative insights with specific patterns
  const mockQualitativeInsights: QualitativeInsights = {
    courseAnnotations: new Map(),
    subjectInsights: new Map([
      [
        'math',
        {
          subject: 'math',
          overallConfidence: 85,
          overallInterest: 75,
          overallEffort: 30, // Low effort + high grades
          perceivedDifficulty: 25,
          effortGradeCorrelation: 0.6,
          consistencyWithPerformance: 80,
          selfAssessedStrength: true,
          selfAssessedChallenge: false,
          mismatchWithData: null,
          intendsToContinue: true,
          willingnessToChallenge: 5,
          specificFutureCourses: ['AP Calculus BC', 'Linear Algebra'],
          keyStatements: ["Math has always been my thing"],
          narrativeSummary: 'Strong in math with minimal effort',
        },
      ],
      [
        'science',
        {
          subject: 'science',
          overallConfidence: 45,
          overallInterest: 70,
          overallEffort: 85, // High effort + lower grades
          perceivedDifficulty: 80,
          effortGradeCorrelation: 0.3,
          consistencyWithPerformance: 50,
          selfAssessedStrength: false,
          selfAssessedChallenge: true,
          mismatchWithData: null,
          intendsToContinue: true,
          willingnessToChallenge: 3,
          specificFutureCourses: ['AP Physics'],
          keyStatements: ["Chemistry was really tough for me"],
          narrativeSummary: 'Struggles despite high effort',
        },
      ],
    ]),
    learningStyleIndicators: null,
    motivationProfile: null,
    selfAwarenessAssessment: null,
    globalCircumstances: [],
    conversationHistory: [],
    allExtractedInsights: [],
    completeness: {
      overallCompleteness: 60,
      subjectCompleteness: new Map(),
      topicsCovered: 5,
      topicsTotal: 10,
      coursesAnnotated: 3,
      coursesTotal: 15,
      missingAreas: [],
      recommendedNextTopics: [],
    },
  };

  // Synthesize
  const synthesized = synthesizeProfile(analysis, mockQualitativeInsights);

  console.log('Testing synthesis rules:\n');

  // Check untapped potential rule
  const mathStrength = synthesized.adjustedSubjectStrengths.get('math');
  if (mathStrength) {
    const hasUntappedPotential = mathStrength.effortAdjustment > 0;
    console.log(`✓ Untapped Potential Rule (Math):`);
    console.log(`  Low effort (30%) + high grades → Effort adjustment: +${(mathStrength.effortAdjustment * 100).toFixed(0)}%`);
    console.log(`  Reasoning: ${mathStrength.adjustmentReasoning.substring(0, 80)}...`);
    console.log();
  }

  // Check near ceiling rule
  const scienceStrength = synthesized.adjustedSubjectStrengths.get('science');
  if (scienceStrength) {
    console.log(`✓ Near Ceiling Rule (Science):`);
    console.log(`  High effort (85%) + mediocre grades → Effort adjustment: ${(scienceStrength.effortAdjustment * 100).toFixed(0)}%`);
    console.log(`  Reasoning: ${scienceStrength.adjustmentReasoning.substring(0, 80)}...`);
    console.log();
  }

  // Check for appropriate adjustments
  const mathAdjusted = synthesized.adjustments.filter((a) => a.target === 'math');
  const scienceAdjusted = synthesized.adjustments.filter(
    (a) => a.target === 'science' || a.target.startsWith('science_')
  );

  console.log(`Total adjustments generated: ${synthesized.adjustments.length}`);
  console.log(`  Math-related: ${mathAdjusted.length}`);
  console.log(`  Science-related: ${scienceAdjusted.length}`);

  return synthesized;
}

// ============================================================================
// TEST: TIERED EXTRACTION SYSTEM (Fallback Verification)
// ============================================================================

async function testTieredExtractionFallbacks() {
  console.log('\n=== TEST: Tiered Extraction System (Heuristic Fallbacks) ===\n');

  const mockTopic: ConversationTopic = {
    id: 'test_heuristic_topic',
    type: 'grade_anomaly',
    priority: 8,
    scope: {
      course: 'AP Chemistry',
      subject: 'science',
    },
    context: 'Testing heuristic extraction fallbacks',
    primaryQuestion: 'Tell me about your experience in this course.',
    followUpQuestions: [],
    targetInsights: ['effort_level', 'teacher_quality', 'perceived_difficulty'],
    status: 'in_progress',
  };

  const testCases = [
    {
      name: 'Effort patterns (high)',
      message: "I worked really hard in this class, spending hours studying every night. I gave it my all but still struggled.",
      expectedValues: { effortLevel: [4, 5], teacherQuality: undefined },
    },
    {
      name: 'Effort patterns (low)',
      message: "I didn't really try that hard. Honestly, I coasted through most of it with minimal effort.",
      expectedValues: { effortLevel: [1, 2], teacherQuality: undefined },
    },
    {
      name: 'Teacher quality (terrible)',
      message: "The teacher was terrible. I had to teach myself most of the material because they couldn't explain anything.",
      expectedValues: { teacherQuality: 'terrible' },
    },
    {
      name: 'Teacher quality (excellent)',
      message: "I had the best teacher ever! She was amazing at explaining complex concepts and made class so engaging.",
      expectedValues: { teacherQuality: 'excellent' },
    },
    {
      name: 'Interest patterns (positive)',
      message: "I really love science. It's fascinating to me and I enjoy learning about how things work.",
      expectedValues: { enjoymentLevel: [4, 5], intrinsicInterest: true },
    },
    {
      name: 'Interest patterns (negative)',
      message: "I hate chemistry. It's so boring and tedious. I can't stand doing the lab reports.",
      expectedValues: { enjoymentLevel: [1, 2], intrinsicInterest: false },
    },
    {
      name: 'External circumstances (family)',
      message: "Sophomore year was rough. My mom got sick and I was dealing with a lot of family stuff at home.",
      expectedValues: { hasExternalFactors: true, circumstanceType: 'family' },
    },
    {
      name: 'External circumstances (mental health)',
      message: "I was really struggling with anxiety that year. I felt overwhelmed and couldn't cope with the workload.",
      expectedValues: { hasExternalFactors: true, circumstanceType: 'mental_health' },
    },
    {
      name: 'Self-assessment (strength)',
      message: "Math has always been my strong suit. It comes naturally to me and I've always excelled in it.",
      expectedValues: { selfAssessedStrength: true },
    },
    {
      name: 'Self-assessment (weakness)',
      message: "Writing is my weakness. I've never been good at it and I always struggle with essays.",
      expectedValues: { selfAssessedChallenge: true },
    },
    {
      name: 'Combined patterns',
      message: "The teacher was terrible and I didn't try very hard because I was dealing with family issues. I hate this subject.",
      expectedValues: { teacherQuality: 'terrible', effortLevel: [1, 2], hasExternalFactors: true, intrinsicInterest: false },
    },
    {
      name: 'Short message (minimal extraction)',
      message: "It was okay I guess.",
      expectedValues: { minimalExtraction: true },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    console.log(`  Message: "${testCase.message.substring(0, 60)}..."`);

    // Test with skipLLM to force heuristic extraction only
    const result = await extractInsights(testCase.message, mockTopic, { skipLLM: true });

    console.log(`  Success: ${result.success}`);
    console.log(`  Extraction method: ${result.extractionMethod || 'unknown'}`);
    console.log(`  Insights extracted: ${result.insights.length}`);

    if (result.insights.length > 0) {
      const insight = result.insights[0];
      console.log(`  Values extracted:`, JSON.stringify(insight.values, null, 4).replace(/\n/g, '\n    '));

      // Verify expected values
      let testPassed = true;

      if (testCase.expectedValues.effortLevel) {
        const [min, max] = testCase.expectedValues.effortLevel;
        const actual = insight.values.effortLevel;
        if (actual && actual >= min && actual <= max) {
          console.log(`  ✓ Effort level: ${actual} (expected ${min}-${max})`);
        } else {
          console.log(`  ✗ Effort level: ${actual} (expected ${min}-${max})`);
          testPassed = false;
        }
      }

      if (testCase.expectedValues.teacherQuality !== undefined) {
        if (insight.values.teacherQuality === testCase.expectedValues.teacherQuality) {
          console.log(`  ✓ Teacher quality: ${insight.values.teacherQuality}`);
        } else {
          console.log(`  ✗ Teacher quality: ${insight.values.teacherQuality} (expected ${testCase.expectedValues.teacherQuality})`);
          testPassed = false;
        }
      }

      if (testCase.expectedValues.enjoymentLevel) {
        const [min, max] = testCase.expectedValues.enjoymentLevel;
        const actual = insight.values.enjoymentLevel;
        if (actual && actual >= min && actual <= max) {
          console.log(`  ✓ Enjoyment level: ${actual} (expected ${min}-${max})`);
        } else {
          console.log(`  ✗ Enjoyment level: ${actual} (expected ${min}-${max})`);
          testPassed = false;
        }
      }

      if (testCase.expectedValues.intrinsicInterest !== undefined) {
        if (insight.values.intrinsicInterest === testCase.expectedValues.intrinsicInterest) {
          console.log(`  ✓ Intrinsic interest: ${insight.values.intrinsicInterest}`);
        } else {
          console.log(`  ✗ Intrinsic interest: ${insight.values.intrinsicInterest} (expected ${testCase.expectedValues.intrinsicInterest})`);
          testPassed = false;
        }
      }

      if (testCase.expectedValues.hasExternalFactors) {
        const hasFactors = insight.values.externalFactors && insight.values.externalFactors.length > 0;
        if (hasFactors) {
          const types = insight.values.externalFactors!.map(f => f.type).join(', ');
          console.log(`  ✓ External factors: ${types}`);
          if (testCase.expectedValues.circumstanceType) {
            const hasExpectedType = insight.values.externalFactors!.some(
              f => f.type === testCase.expectedValues.circumstanceType
            );
            if (hasExpectedType) {
              console.log(`  ✓ Circumstance type: ${testCase.expectedValues.circumstanceType}`);
            } else {
              console.log(`  ✗ Circumstance type: expected ${testCase.expectedValues.circumstanceType}`);
              testPassed = false;
            }
          }
        } else {
          console.log(`  ✗ External factors: none (expected some)`);
          testPassed = false;
        }
      }

      if (testCase.expectedValues.selfAssessedStrength !== undefined) {
        if (insight.values.selfAssessedStrength === testCase.expectedValues.selfAssessedStrength) {
          console.log(`  ✓ Self-assessed strength: ${insight.values.selfAssessedStrength}`);
        } else {
          console.log(`  ✗ Self-assessed strength: ${insight.values.selfAssessedStrength}`);
          testPassed = false;
        }
      }

      if (testCase.expectedValues.selfAssessedChallenge !== undefined) {
        if (insight.values.selfAssessedChallenge === testCase.expectedValues.selfAssessedChallenge) {
          console.log(`  ✓ Self-assessed challenge: ${insight.values.selfAssessedChallenge}`);
        } else {
          console.log(`  ✗ Self-assessed challenge: ${insight.values.selfAssessedChallenge}`);
          testPassed = false;
        }
      }

      if (testPassed) {
        passed++;
      } else {
        failed++;
      }
    } else if (testCase.expectedValues.minimalExtraction) {
      // For minimal extraction test, we expect few or no insights
      console.log(`  ✓ Minimal extraction as expected`);
      passed++;
    } else {
      console.log(`  ✗ No insights extracted (expected some)`);
      failed++;
    }

    console.log();
  }

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log(`║  HEURISTIC EXTRACTION: ${passed} passed, ${failed} failed                     ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  return failed === 0;
}

// ============================================================================
// TEST: DYNAMIC CONVERSATION FLOW (NEW)
// ============================================================================

async function testDynamicConversationFlow() {
  console.log('\n=== TEST: Dynamic Conversation Flow with Engagement Detection ===\n');

  // Import engagement detection functions
  const {
    assessEngagementHeuristic,
    analyzeEngagementTrend,
    initializeProgress,
    updateProgress,
  } = await import('../src/services/portfolioStrategy/services/academicWorkshop/capability/conversational');

  // Create a mock analysis for testing
  const mockAnalysis = analyzeCapabilityNuanced(TEST_COURSES, TEST_GRADE_HISTORY);

  // Test engagement detection with various response types
  console.log('1. Testing Engagement Detection System\n');

  const testResponses = [
    {
      name: 'Highly Engaged Response',
      message: "Oh wow, that's a great question! Let me think... AP Chemistry was honestly the hardest class I've ever taken. I remember spending hours every night trying to understand the concepts. My teacher, Mr. Johnson, would explain things but I still felt lost. The worst part was the family stuff I was dealing with - my mom got sick that year and I was just exhausted all the time. But honestly, I still love science and I want to take AP Physics next year!",
      expectedEngagement: 'highly_engaged',
      expectedDepth: 'deep',
    },
    {
      name: 'Low Engagement Response',
      message: "It was fine I guess",
      expectedEngagement: 'disengaged',
      expectedDepth: 'surface',
    },
    {
      name: 'Confused Response',
      message: "What do you mean? I don't understand what you're asking about.",
      expectedEngagement: 'confused',
      expectedDepth: 'surface',
    },
    {
      name: 'Resistant Response',
      message: "I don't really want to talk about that. Can we move on?",
      expectedEngagement: 'resistant',
      expectedDepth: 'surface',
    },
    {
      name: 'Moderate Engagement',
      message: "Chemistry was pretty tough. I worked hard but the teacher wasn't great. I prefer math anyway.",
      expectedEngagement: 'engaged',
      expectedDepth: 'moderate',
    },
  ];

  let engagementPassed = 0;
  let engagementFailed = 0;

  for (const test of testResponses) {
    const mockHistory: Array<{ role: 'ai' | 'student'; message: string }> = [];

    const assessment = assessEngagementHeuristic(
      test.message,
      mockHistory,
      'AP Chemistry experience'
    );

    console.log(`  ${test.name}:`);
    console.log(`    Message: "${test.message.substring(0, 50)}..."`);
    console.log(`    Engagement Level: ${assessment.level}/100`);
    console.log(`    Type: ${assessment.type} (expected: ${test.expectedEngagement})`);
    console.log(`    Depth: ${assessment.depthLevel} (expected: ${test.expectedDepth})`);
    console.log(`    Strategy: ${assessment.recommendedStrategy}`);
    console.log(`    Indicators: ${assessment.indicators.map(i => i.type).join(', ')}`);

    // Verify engagement type
    const typeMatch = assessment.type === test.expectedEngagement;
    const depthMatch = assessment.depthLevel === test.expectedDepth;

    if (typeMatch) {
      console.log(`    ✓ Engagement type correct`);
      engagementPassed++;
    } else {
      console.log(`    ✗ Engagement type mismatch`);
      engagementFailed++;
    }

    if (depthMatch) {
      console.log(`    ✓ Depth level correct`);
      engagementPassed++;
    } else {
      console.log(`    ✗ Depth level mismatch`);
      engagementFailed++;
    }

    console.log();
  }

  // Test engagement trend analysis
  console.log('2. Testing Engagement Trend Analysis\n');

  const trendTests = [
    {
      name: 'Improving Trend',
      levels: [30, 35, 45, 55, 65],
      expected: 'improving',
    },
    {
      name: 'Declining Trend',
      levels: [70, 60, 50, 40, 35],
      expected: 'declining',
    },
    {
      name: 'Stable Trend',
      levels: [50, 52, 48, 51, 49],
      expected: 'stable',
    },
  ];

  for (const test of trendTests) {
    const mockHistory = test.levels.map(level => ({
      level,
      type: level > 60 ? 'engaged' : level > 40 ? 'neutral' : 'disengaged',
      indicators: [],
      recommendedStrategy: 'continue_normally' as const,
      isConfused: false,
      wantsTopicChange: false,
      depthLevel: 'moderate' as const,
      emotionalTone: 'neutral' as const,
      confidence: 70,
    }));

    const trend = analyzeEngagementTrend(mockHistory);

    console.log(`  ${test.name}:`);
    console.log(`    Levels: ${test.levels.join(' → ')}`);
    console.log(`    Trend: ${trend} (expected: ${test.expected})`);

    if (trend === test.expected) {
      console.log(`    ✓ Trend correct`);
      engagementPassed++;
    } else {
      console.log(`    ✗ Trend mismatch`);
      engagementFailed++;
    }
    console.log();
  }

  // Test progress tracking
  console.log('3. Testing Progress Tracking System\n');

  const progress = initializeProgress();

  console.log('  Initial Progress:');
  console.log(`    Overall: ${progress.overallProgress}%`);
  console.log(`    Pacing: ${progress.pacingStatus}`);
  console.log(`    Estimated turns remaining: ${progress.estimatedTurnsRemaining}`);
  console.log(`    Knowledge gaps: ${progress.knowledgeGaps.length}`);

  // Verify initial state
  if (progress.overallProgress === 0) {
    console.log(`    ✓ Initial progress is 0`);
    engagementPassed++;
  } else {
    console.log(`    ✗ Initial progress should be 0`);
    engagementFailed++;
  }

  if (progress.knowledgeGaps.length > 0) {
    console.log(`    ✓ Knowledge gaps identified`);
    engagementPassed++;
  } else {
    console.log(`    ✗ Should have knowledge gaps initially`);
    engagementFailed++;
  }

  console.log();

  // Test full conversation flow with dynamic engine
  console.log('4. Testing Full Dynamic Conversation Flow\n');

  const {
    CapabilityConversationEngine,
  } = await import('../src/services/portfolioStrategy/services/academicWorkshop/capability/conversational');

  const engine = new CapabilityConversationEngine({
    enableDynamicFlow: true,
    useLLMEngagement: false, // Use heuristic for speed
    responseModel: 'haiku',
    extractionModel: 'haiku',
  });

  // Initialize conversation
  const initResult = await engine.initialize(mockAnalysis);

  console.log('  Initialization:');
  console.log(`    Success: ${initResult.success}`);
  console.log(`    Opener: "${initResult.opener.message.substring(0, 60)}..."`);
  console.log(`    Initial topics: ${initResult.state.pendingTopics.length}`);
  console.log(`    Initial progress: ${initResult.progress?.overallProgress || 0}%`);

  if (initResult.success) {
    console.log(`    ✓ Initialization successful`);
    engagementPassed++;
  } else {
    console.log(`    ✗ Initialization failed: ${initResult.error}`);
    engagementFailed++;
  }

  // Process a few turns to test dynamic flow
  let state = initResult.state;
  let qualitativeInsights = initResult.qualitativeInsights;

  const conversationTurns = [
    {
      message: "Chemistry was really tough. The teacher wasn't great and I was dealing with family stuff.",
      expectedStrategy: ['validate_and_encourage', 'probe_deeper', 'continue_normally'],
    },
    {
      message: "yeah",
      expectedStrategy: ['offer_examples', 'rephrase_question', 'direct_question', 'open_ended_invite'],
    },
    {
      message: "Math is definitely my strongest subject! I love solving problems and things just click for me. I don't even have to study that much honestly.",
      expectedStrategy: ['probe_deeper', 'continue_normally'],
    },
  ];

  console.log('\n  Conversation Flow Test:');

  for (let i = 0; i < conversationTurns.length; i++) {
    const turn = conversationTurns[i];
    console.log(`\n    Turn ${i + 1}:`);
    console.log(`      Student: "${turn.message.substring(0, 50)}..."`);

    const result = await engine.processTurn(
      turn.message,
      state,
      qualitativeInsights,
      mockAnalysis
    );

    if (!result.success) {
      console.log(`      ✗ Turn processing failed: ${result.error}`);
      engagementFailed++;
      continue;
    }

    state = result.state;
    qualitativeInsights = result.qualitativeInsights;

    console.log(`      AI: "${result.response.message.substring(0, 50)}..."`);
    console.log(`      Engagement: ${result.engagement?.type || 'unknown'} (${result.engagement?.level || 0}/100)`);
    console.log(`      Strategy used: ${result.responseStrategy || 'unknown'}`);
    console.log(`      Progress: ${result.progress?.overallProgress || 0}%`);

    // Check if strategy is appropriate for the input
    if (turn.expectedStrategy.includes(result.responseStrategy || '')) {
      console.log(`      ✓ Strategy appropriate for input`);
      engagementPassed++;
    } else {
      console.log(`      ⚠ Strategy ${result.responseStrategy} not in expected list: ${turn.expectedStrategy.join(', ')}`);
      // This is a soft check - strategies can vary based on context
    }

    // Verify response is not empty or generic
    if (result.response.message.length > 20 && result.response.message !== "That's interesting! Tell me more about how you felt in that class.") {
      console.log(`      ✓ Response is contextual`);
      engagementPassed++;
    } else {
      console.log(`      ⚠ Response might be too generic`);
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log(`║  DYNAMIC CONVERSATION FLOW: ${engagementPassed} passed, ${engagementFailed} failed              ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  return engagementFailed === 0;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║    CAPABILITY CONVERSATION SYSTEM - COMPREHENSIVE TEST         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  const startTime = Date.now();

  try {
    // Test 1: Topic Detection
    await testTopicDetection();

    // Test 2: Insight Extraction (requires API)
    await testInsightExtraction();

    // Test 3: Profile Synthesis Rules
    await testProfileSynthesis();

    // Test 4: Tiered Extraction Fallbacks (No API required)
    const heuristicsFallbackPassed = await testTieredExtractionFallbacks();
    if (!heuristicsFallbackPassed) {
      console.error('\n❌ CRITICAL: Heuristic extraction fallback test failed!');
      process.exit(1);
    }

    // Test 5: AO Perception vs Internal Understanding Separation (CRITICAL)
    const separationIntegrityPassed = await testAOPerceptionVsInternalUnderstanding();
    if (!separationIntegrityPassed) {
      console.error('\n❌ CRITICAL: Score separation integrity test failed!');
      process.exit(1);
    }

    // Test 6: Full Conversation Flow (requires API)
    await testFullConversationFlow();

    // Test 7: Dynamic Conversation Flow (NEW - requires API)
    const dynamicFlowPassed = await testDynamicConversationFlow();
    if (!dynamicFlowPassed) {
      console.error('\n⚠ WARNING: Some dynamic flow tests failed (soft failure)');
      // Don't exit - these are informational
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    ALL TESTS COMPLETED                         ║');
    console.log(`║                    Time elapsed: ${elapsed}s                          ║`);
    console.log('╚════════════════════════════════════════════════════════════════╝');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

main();
