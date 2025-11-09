/**
 * Hybrid System Test: Narrative Angles + Iterative Improvement
 *
 * This test combines Session 18's narrative angle generation (content optimization)
 * with Session 15's iterative improvement system (technique optimization) to achieve
 * consistent 73-80/100 scores.
 *
 * Expected outcome: The combination of unique narrative angles with sophisticated
 * iterative refinement should break through the 70/100 ceiling consistently.
 */

import { generateWithIterativeImprovement } from '../src/core/generation/iterativeImprovement';
import type { GenerationProfile } from '../src/core/generation/essayGenerator';

async function main() {
  console.log('='.repeat(80));
  console.log('HYBRID SYSTEM TEST: NARRATIVE ANGLES + ITERATIVE IMPROVEMENT');
  console.log('='.repeat(80));
  console.log();
  console.log('📊 HYPOTHESIS:');
  console.log('   Angle Generation (content) + Iterative Improvement (technique) = 73-80/100');
  console.log();
  console.log('🎯 TARGET: 73-80/100 combined score');
  console.log('📈 BASELINE:');
  console.log('   - Session 15 (iterative only): ~70/100');
  console.log('   - Session 18 (angle only, 3 iter): 73/100');
  console.log('   - Integration test (angle, 3 iter): 55/100');
  console.log();
  console.log('💡 EXPECTATION: Hybrid approach should consistently hit 73-80/100');
  console.log();
  console.log('='.repeat(80));
  console.log();

  // Test profile (same robotics activity from Session 18)
  const testProfile: GenerationProfile = {
    studentVoice: 'conversational',
    riskTolerance: 'high',
    academicStrength: 'strong',
    activityType: 'academic',
    role: 'Robotics Team Lead',
    duration: 'Sep 2022 - Present',
    hoursPerWeek: 15,
    achievements: [
      'Built vision system for autonomous robot',
      'Robot qualified for regionals (top 5)',
    ],
    challenges: [
      'Robot failed completely 3 days before competition',
      'Team members worked in silos (mechanical, electrical, programming)',
    ],
    relationships: ['Dad (engineer, mentor)', 'Sarah (teammate, initially distant)'],
    impact: [
      'Created 23-page collaborative debugging guide',
      'Transformed team culture from territorial to collaborative',
      '5 new programmers learned methodology',
      '18 other teams adopted our approach at regionals',
    ],
    targetTier: 1,
    literaryTechniques: ['extendedMetaphor'],
    avoidClichés: true,
    generateAngle: true, // KEY: Enable automatic angle generation (Session 18)
  };

  console.log('📋 TEST CONFIGURATION:');
  console.log(`   Activity: ${testProfile.role}`);
  console.log(`   Voice: ${testProfile.studentVoice}`);
  console.log(`   Risk Tolerance: ${testProfile.riskTolerance}`);
  console.log(`   Auto-Generate Angle: ${testProfile.generateAngle ? 'YES' : 'NO'}`);
  console.log(`   Max Iterations: 10`);
  console.log(`   Target Score: 73/100`);
  console.log();

  console.log('─'.repeat(80));
  console.log('STARTING HYBRID GENERATION...');
  console.log('─'.repeat(80));
  console.log();

  try {
    const startTime = Date.now();

    // Run the hybrid system: angles + iterative improvement
    const result = await generateWithIterativeImprovement(
      testProfile,
      10, // Max iterations
      73  // Target score
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log();
    console.log('='.repeat(80));
    console.log('📊 FINAL RESULTS');
    console.log('='.repeat(80));
    console.log();

    console.log(`⏱️  Generation Time: ${duration}s`);
    console.log(`🔄 Iterations Used: ${result.iterationHistory.length}/${10}`);
    console.log();

    console.log(`🎯 COMBINED SCORE: ${result.combinedScore}/100`);
    console.log(`  • Authenticity: ${result.authenticityScore.toFixed(1)}/10`);
    console.log(`  • Elite Patterns: ${result.elitePatternsScore}/100`);
    console.log(`  • Literary: ${result.literarySophisticationScore}/100`);
    console.log();

    if (result.narrativeAngle) {
      console.log(`🎨 NARRATIVE ANGLE USED:`);
      console.log(`   Title: "${result.narrativeAngle.title}"`);
      console.log(`   Originality: ${result.narrativeAngle.originality}/10`);
      console.log(`   Risk Level: ${result.narrativeAngle.riskLevel}`);
      console.log(`   Hook: "${result.narrativeAngle.hook}"`);
      console.log();
    }

    console.log(`📈 SCORE PROGRESSION:`);
    result.iterationHistory.forEach((iter, idx) => {
      const change = idx > 0 ? iter.combinedScore - result.iterationHistory[idx - 1].combinedScore : 0;
      const changeStr = change > 0 ? `+${change}` : change < 0 ? `${change}` : '0';
      console.log(`   Iteration ${idx + 1}: ${iter.combinedScore}/100 ${idx > 0 ? `(${changeStr})` : ''}`);
    });
    console.log();

    console.log(`📝 GENERATED ESSAY (${result.essay.length} chars):`);
    console.log('─'.repeat(80));
    console.log(result.essay);
    console.log('─'.repeat(80));
    console.log();

    // Validation
    console.log('✅ VALIDATION:');
    console.log();

    const hitTarget = result.combinedScore >= 73;
    const highAuth = result.authenticityScore >= 7.0;
    const hasAngle = !!result.narrativeAngle;
    const moderateRisk = result.narrativeAngle?.riskLevel === 'moderate';
    const improvedFromBaseline = result.combinedScore > 70; // Better than Session 15 baseline

    console.log(`   ${hitTarget ? '✓' : '✗'} Hit 73/100 target: ${result.combinedScore}/100`);
    console.log(`   ${highAuth ? '✓' : '✗'} Authenticity ≥ 7.0: ${result.authenticityScore.toFixed(1)}/10`);
    console.log(`   ${hasAngle ? '✓' : '✗'} Narrative angle used: ${hasAngle ? 'YES' : 'NO'}`);
    console.log(`   ${moderateRisk ? '✓' : '✗'} Moderate risk angle: ${result.narrativeAngle?.riskLevel || 'N/A'}`);
    console.log(`   ${improvedFromBaseline ? '✓' : '✗'} Better than baseline: ${result.combinedScore > 70 ? 'YES' : 'NO'}`);
    console.log();

    if (hitTarget && highAuth && hasAngle) {
      console.log('🎉 SUCCESS! Hybrid system achieved target performance.');
      console.log(`   Angle generation + iterative improvement = ${result.combinedScore}/100`);
      console.log(`   This validates the hypothesis that content (angles) + technique (iteration) breaks the ceiling.`);
    } else if (improvedFromBaseline) {
      console.log('✅ PARTIAL SUCCESS - System improved over baseline.');
      if (!hitTarget) console.log(`   → Score ${result.combinedScore}/100 is close to target (73/100)`);
      if (!highAuth) console.log(`   → Authenticity could be higher (${result.authenticityScore.toFixed(1)}/10)`);
      if (!hasAngle) console.log(`   → Angle generation not working`);
    } else {
      console.log('⚠️  NEEDS IMPROVEMENT - Did not reach target.');
      if (!hitTarget) console.log(`   → Score below target: ${result.combinedScore}/100 vs 73/100`);
      if (!highAuth) console.log(`   → Authenticity too low: ${result.authenticityScore.toFixed(1)}/10`);
      if (!hasAngle) console.log(`   → Angle generation failed`);
    }
    console.log();

    console.log('='.repeat(80));
    console.log('📊 ANALYSIS');
    console.log('='.repeat(80));
    console.log();

    const avgScore = result.iterationHistory.reduce((sum, r) => sum + r.combinedScore, 0) / result.iterationHistory.length;
    const maxScore = Math.max(...result.iterationHistory.map(r => r.combinedScore));
    const minScore = Math.min(...result.iterationHistory.map(r => r.combinedScore));

    console.log(`Average Score: ${avgScore.toFixed(1)}/100`);
    console.log(`Score Range: ${minScore}-${maxScore}/100 (${maxScore - minScore} point spread)`);
    console.log(`Improvement: ${result.combinedScore - result.iterationHistory[0].combinedScore} points (first → final)`);
    console.log();

    if (result.narrativeAngle) {
      console.log('🎨 ANGLE EFFECTIVENESS:');
      console.log(`   The "${result.narrativeAngle.title}" angle was used throughout`);
      console.log(`   ${result.narrativeAngle.originality}/10 originality (${result.narrativeAngle.riskLevel} risk)`);
      console.log(`   Final authenticity: ${result.authenticityScore.toFixed(1)}/10 (Session 18 winner: 9.3/10)`);
      console.log();
    }

    console.log('🔬 KEY INSIGHTS:');
    if (result.combinedScore >= 73) {
      console.log(`   • Hybrid approach successfully broke through 70/100 ceiling`);
      console.log(`   • Angle provided unique content perspective`);
      console.log(`   • Iteration refined execution of elite patterns`);
      console.log(`   • Target of 73-80/100 is achievable with this system`);
    } else if (result.combinedScore >= 70) {
      console.log(`   • System matched Session 15 baseline (~70/100)`);
      console.log(`   • Angle may need better selection or implementation`);
      console.log(`   • Iteration system working as expected`);
      console.log(`   • Fine-tuning needed to consistently hit 73-80/100`);
    } else {
      console.log(`   • Score below expectations (${result.combinedScore}/100)`);
      console.log(`   • May need to adjust angle selection criteria`);
      console.log(`   • Or increase iteration focus on elite patterns`);
      console.log(`   • System needs refinement`);
    }
    console.log();

    console.log('='.repeat(80));
    console.log('TEST COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

main();
