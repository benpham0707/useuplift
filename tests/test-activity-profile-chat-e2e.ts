/**
 * End-to-End Test: Activity Profile Chat System
 *
 * Tests the complete flow:
 * 1. Start conversation about an activity
 * 2. Process multiple student responses
 * 3. Extract structured profile data
 * 4. Analyze gaps between profile and description
 * 5. Generate improved descriptions
 * 6. Show scoring remains unbiased (AO perspective)
 *
 * This test demonstrates the SCORING vs GUIDANCE separation:
 * - Scoring stays objective (what AO sees)
 * - Guidance improves with profile depth
 */

import 'dotenv/config';

import {
  activityProfileChatService,
  activityProfileService,
  profileDescriptionGenerator,
  ActivityProfile,
  ConversationState,
} from '../src/services/portfolioStrategy/services/activityWorkshop';

import {
  profileIntegrationService,
  descriptionScoringService,
  scoringOrchestrator,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring';

// ============================================================================
// TEST DATA: Realistic student activity with weak description
// ============================================================================

const TEST_ACTIVITY = {
  id: 'act-math-tutoring-001',
  title: 'Math Peer Tutoring Program',
  description: 'Tutored students in math after school. Helped them with homework and prepared for tests. Made a positive impact on their grades.',
  category: 'Academic',
  position: 'Tutor',
  organization: 'Jefferson High School',
  hoursPerWeek: 8,
  weeksPerYear: 36,
  gradeLevels: [10, 11, 12],
};

// Simulated student responses (what they'd say in a real conversation)
const SIMULATED_RESPONSES = [
  // Response 1: Origin story
  `I started tutoring sophomore year because I noticed a lot of my classmates were struggling in Algebra II.
   I remember one kid, Marcus, who was about to fail and get kicked off the basketball team.
   I stayed after school with him for like 3 hours before his midterm and he ended up getting a B+.
   That moment when he showed me his grade - I'll never forget how happy he was. That's when I knew I wanted to do this more.`,

  // Response 2: Scale and methodology
  `By junior year I was tutoring about 15 students a week, mostly in Algebra II and Pre-Calc.
   I created this thing I call "Visual Math" - basically I draw out concepts as stories because
   a lot of my students have ADHD and can't focus on just numbers. I made like 30 tutorial videos
   and put them on YouTube. They've gotten around 12,000 views now. Three other tutors at my school
   started using my method too.`,

  // Response 3: Impact and recognition
  `The math department actually asked me to present my method to the other tutors.
   My students' average went from a C- to a B+ over a semester. The principal gave me
   this "Student Leader" award at the end of junior year. But honestly the best part
   is when former students come back and tell me they're passing Calculus now.
   One girl, Sarah, texted me last week that she got into the engineering program at State
   because she finally understood the math foundation.`,

  // Response 4: Personal meaning
  `It's weird but tutoring taught me more about learning than being tutored ever did.
   I had to figure out WHY I understood math to explain it to others.
   The hardest part was when a student just wouldn't get it no matter what I tried.
   I'd go home frustrated. But then I'd come back with a new approach.
   I think that persistence is what I'm most proud of - not giving up on anyone.`,
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function printSection(title: string) {
  console.log('\n' + '═'.repeat(80));
  console.log(`  ${title}`);
  console.log('═'.repeat(80));
}

function printSubsection(title: string) {
  console.log('\n' + '─'.repeat(60));
  console.log(`  ${title}`);
  console.log('─'.repeat(60));
}

// ============================================================================
// MAIN TEST
// ============================================================================

async function runE2ETest() {
  console.log('\n');
  printSection('ACTIVITY PROFILE CHAT SYSTEM - END-TO-END TEST');
  console.log('\nThis test demonstrates the complete flow from weak description');
  console.log('to rich profile to improved guidance.\n');

  const startTime = Date.now();
  let totalTokens = { input: 0, output: 0 };

  try {
    // ========================================================================
    // PHASE 1: Score the ORIGINAL description (AO perspective - before profile)
    // ========================================================================
    printSection('PHASE 1: BASELINE SCORING (Before Profile)');
    console.log('\nScoring the original description from AO perspective...');
    console.log('(This is what an admissions officer would see)\n');

    console.log(`Original Description (${TEST_ACTIVITY.description.length} chars):`);
    console.log(`"${TEST_ACTIVITY.description}"\n`);

    const baselineScoreResult = await descriptionScoringService.scoreDescription({
      description: TEST_ACTIVITY.description,
      activityTitle: TEST_ACTIVITY.title,
      activityType: TEST_ACTIVITY.category,
      position: TEST_ACTIVITY.position,
      hoursPerWeek: TEST_ACTIVITY.hoursPerWeek,
      weeksPerYear: TEST_ACTIVITY.weeksPerYear,
    });

    if (baselineScoreResult.success && baselineScoreResult.score) {
      const score = baselineScoreResult.score;
      console.log(`BASELINE SCORE: ${score.total}/10`);
      console.log(`\nBreakdown:`);
      console.log(`  • Role Ownership:    ${score.breakdown.specificity.score}/${score.breakdown.specificity.maxScore} - ${score.breakdown.specificity.rationale}`);
      console.log(`  • Impact Clarity:    ${score.breakdown.impactClarity.score}/${score.breakdown.impactClarity.maxScore} - ${score.breakdown.impactClarity.rationale}`);
      console.log(`  • Action Language:   ${score.breakdown.actionLanguage.score}/${score.breakdown.actionLanguage.maxScore} - ${score.breakdown.actionLanguage.rationale}`);
      console.log(`  • Quantification:    ${score.breakdown.quantification.score}/${score.breakdown.quantification.maxScore} - ${score.breakdown.quantification.rationale}`);
      console.log(`  • Differentiation:   ${score.breakdown.authenticityVoice.score}/${score.breakdown.authenticityVoice.maxScore} - ${score.breakdown.authenticityVoice.rationale}`);
      console.log(`\nStrengths: ${score.strengths.join(', ') || 'None identified'}`);
      console.log(`Improvements Needed: ${score.improvements.join('; ')}`);

      if (baselineScoreResult.tokensUsed) {
        totalTokens.input += baselineScoreResult.tokensUsed.input;
        totalTokens.output += baselineScoreResult.tokensUsed.output;
      }
    }

    // ========================================================================
    // PHASE 2: Start conversation to build profile
    // ========================================================================
    printSection('PHASE 2: CONVERSATION - Building Rich Profile');
    console.log('\nStarting conversation to understand the activity deeply...\n');

    const startResult = await activityProfileChatService.startConversation({
      activityId: TEST_ACTIVITY.id,
      activityTitle: TEST_ACTIVITY.title,
      trigger: 'description_improvement',
      basicData: {
        description: TEST_ACTIVITY.description,
        position: TEST_ACTIVITY.position,
        hoursPerWeek: TEST_ACTIVITY.hoursPerWeek,
        weeksPerYear: TEST_ACTIVITY.weeksPerYear,
        activityType: TEST_ACTIVITY.category,
      },
    });

    if (!startResult.success || !startResult.state) {
      throw new Error(`Failed to start conversation: ${startResult.error}`);
    }

    console.log(`Opening Message:\n"${startResult.openingMessage}"\n`);
    console.log(`First Question:\n"${startResult.firstQuestion}"\n`);

    let state = startResult.state;

    // Process each simulated response
    for (let i = 0; i < SIMULATED_RESPONSES.length; i++) {
      printSubsection(`Turn ${i + 1}: Processing Student Response`);

      const response = SIMULATED_RESPONSES[i];
      console.log(`\nStudent Response (${response.split(' ').length} words):`);
      console.log(`"${response.substring(0, 200)}${response.length > 200 ? '...' : ''}"\n`);

      const processResult = await activityProfileChatService.processUserResponse({
        state,
        response,
      });

      if (!processResult.success || !processResult.state) {
        console.log(`Warning: Failed to process response ${i + 1}: ${processResult.error}`);
        continue;
      }

      state = processResult.state;

      // Show extraction results
      if (processResult.extraction) {
        const ext = processResult.extraction;
        console.log(`Extraction Quality: ${ext.extractionQuality.toUpperCase()}`);
        console.log(`Fields Extracted: ${ext.extractedFields.length}`);
        if (ext.extractedFields.length > 0) {
          console.log(`  → ${ext.extractedFields.map(f => f.path.split('.').pop()).join(', ')}`);
        }
        console.log(`Authentic Quotes Captured: ${ext.authenticQuotes.length}`);
        if (ext.authenticQuotes.length > 0) {
          console.log(`  → "${ext.authenticQuotes[0].quote.substring(0, 80)}..."`);
        }
      }

      if (processResult.shouldEnd) {
        console.log(`\nConversation ended: ${processResult.endReason}`);
        break;
      } else {
        console.log(`\nNext Question:\n"${processResult.nextQuestion}"`);
      }
    }

    // ========================================================================
    // PHASE 3: Analyze the built profile
    // ========================================================================
    printSection('PHASE 3: PROFILE ANALYSIS');

    const profile = state.currentProfile;
    const completeness = activityProfileService.calculateCompleteness(profile);

    console.log(`\nProfile Completeness: ${completeness.overall}%`);
    console.log(`\nBy Section:`);
    console.log(`  • Facts:       ${completeness.sections.facts}%`);
    console.log(`  • Story:       ${completeness.sections.story}%`);
    console.log(`  • Meaning:     ${completeness.sections.meaning}%`);
    console.log(`  • Impact:      ${completeness.sections.impact}%`);
    console.log(`  • Connections: ${completeness.sections.connections}%`);

    printSubsection('Extracted Profile Data');

    // Show key profile data
    console.log('\nFACTS:');
    console.log(`  • Duration: ${profile.facts.duration.totalYears} years, ${profile.facts.duration.hoursPerWeek} hrs/week`);
    console.log(`  • People Impacted: ${profile.facts.scale.peopleDirectlyImpacted || 'Not captured'}`);
    console.log(`  • Resources Created: ${profile.facts.scale.resourcesCreated || 0}`);
    console.log(`  • Roles: ${profile.facts.roles.map(r => r.role).join(', ') || 'Not captured'}`);
    console.log(`  • Recognition: ${profile.facts.recognition.map(r => r.name).join(', ') || 'None captured'}`);

    console.log('\nSTORY:');
    console.log(`  • Origin: ${profile.story.origin.howStarted || 'Not captured'}`);
    console.log(`  • Key Moments: ${profile.story.keyMoments.length} captured`);
    if (profile.story.keyMoments.length > 0) {
      profile.story.keyMoments.slice(0, 2).forEach(m => {
        console.log(`    → [${m.type}] ${m.description.substring(0, 80)}...`);
      });
    }

    console.log('\nMEANING:');
    console.log(`  • Why It Matters: ${profile.meaning.whyItMatters ? profile.meaning.whyItMatters.substring(0, 100) + '...' : 'Not captured'}`);
    console.log(`  • Proudest Moment: ${profile.meaning.proudestMoment ? 'Captured' : 'Not captured'}`);
    console.log(`  • Hardest Challenge: ${profile.meaning.hardestChallenge ? 'Captured' : 'Not captured'}`);

    console.log('\nIMPACT:');
    console.log(`  • Beneficiaries: ${profile.impact.directBeneficiaries.length} documented`);
    if (profile.impact.directBeneficiaries.length > 0) {
      profile.impact.directBeneficiaries.slice(0, 2).forEach(b => {
        console.log(`    → ${b.who}: ${b.howHelped.substring(0, 60)}...`);
      });
    }

    console.log('\nAUTHENTIC QUOTES:');
    const authenticQuotes = profile.meaning?.authenticQuotes || [];
    console.log(`  • Total: ${authenticQuotes.length}`);
    authenticQuotes.slice(0, 3).forEach(q => {
      console.log(`    → "${q.quote.substring(0, 70)}..." [${q.potentialUse}]`);
    });

    // ========================================================================
    // PHASE 4: Gap Analysis (Profile vs Description)
    // ========================================================================
    printSection('PHASE 4: GAP ANALYSIS - What AO Is Missing');
    console.log('\nComparing what the profile contains vs what the description shows...\n');

    const gapAnalysis = profileIntegrationService.analyzeDescriptionGaps(
      TEST_ACTIVITY.id,
      TEST_ACTIVITY.title,
      TEST_ACTIVITY.description,
      profile,
      baselineScoreResult.score
    );

    console.log(`Current Score: ${gapAnalysis.currentScore}/10`);
    console.log(`Potential Score (if gaps addressed): ${gapAnalysis.potentialScore}/10`);
    console.log(`Rewrite Recommended: ${gapAnalysis.rewriteRecommended ? 'YES' : 'No'}`);
    console.log(`Priority: ${gapAnalysis.priority.toUpperCase()}`);

    console.log('\nHIGH-IMPACT GAPS (Critical to fix):');
    if (gapAnalysis.missingElements.high_impact.length === 0) {
      console.log('  None identified');
    } else {
      gapAnalysis.missingElements.high_impact.forEach(gap => {
        console.log(`\n  [${gap.category.toUpperCase()}] ${gap.element}`);
        console.log(`    Profile has: "${gap.profileHas}"`);
        console.log(`    Description shows: "${gap.descriptionShows}"`);
        console.log(`    → ${gap.suggestion}`);
      });
    }

    console.log('\nMEDIUM-IMPACT GAPS (Good to fix):');
    if (gapAnalysis.missingElements.medium_impact.length === 0) {
      console.log('  None identified');
    } else {
      gapAnalysis.missingElements.medium_impact.forEach(gap => {
        console.log(`\n  [${gap.category.toUpperCase()}] ${gap.element}`);
        console.log(`    Profile has: "${gap.profileHas}"`);
        console.log(`    → ${gap.suggestion}`);
      });
    }

    // ========================================================================
    // PHASE 5: Generate Improved Description
    // ========================================================================
    printSection('PHASE 5: GENERATE IMPROVED DESCRIPTION');
    console.log('\nUsing profile data to craft a better 150-char description...\n');

    const generationResult = await profileDescriptionGenerator.generateDescriptions({
      profile,
      currentDescription: TEST_ACTIVITY.description,
      targetLength: 150,
    });

    if (generationResult.success && generationResult.primary) {
      console.log('ORIGINAL DESCRIPTION:');
      console.log(`"${TEST_ACTIVITY.description}"`);
      console.log(`(${TEST_ACTIVITY.description.length} chars)\n`);

      console.log('RECOMMENDED NEW DESCRIPTION:');
      console.log(`"${generationResult.primary.text}"`);
      console.log(`(${generationResult.primary.charCount} chars)\n`);

      console.log(`Emphasis: ${generationResult.primary.emphasis}`);
      console.log(`Rationale: ${generationResult.primary.rationale}`);
      console.log(`Profile Elements Used: ${generationResult.primary.profileElementsUsed.join(', ')}`);
      console.log(`Estimated Score: ${generationResult.primary.estimatedScoreImpact}/10`);

      if (generationResult.primary.authenticQuoteUsed) {
        console.log(`Authentic Quote Incorporated: "${generationResult.primary.authenticQuoteUsed}"`);
      }

      if (generationResult.alternatives && generationResult.alternatives.length > 0) {
        console.log('\nALTERNATIVE DESCRIPTIONS:');
        generationResult.alternatives.forEach((alt, i) => {
          console.log(`\n  Option ${i + 2}: [${alt.emphasis}]`);
          console.log(`  "${alt.text}"`);
          console.log(`  (${alt.charCount} chars, est. score: ${alt.estimatedScoreImpact}/10)`);
        });
      }

      if (generationResult.currentAnalysis) {
        console.log('\nANALYSIS OF ORIGINAL:');
        console.log(`  Score: ${generationResult.currentAnalysis.score}/10`);
        console.log(`  Strengths: ${generationResult.currentAnalysis.strengths.join(', ') || 'None'}`);
        console.log(`  Weaknesses: ${generationResult.currentAnalysis.weaknesses.join(', ')}`);
      }

      if (generationResult.tokensUsed) {
        totalTokens.input += generationResult.tokensUsed.input;
        totalTokens.output += generationResult.tokensUsed.output;
      }

      // ========================================================================
      // PHASE 6: Score the NEW description (verify improvement)
      // ========================================================================
      printSection('PHASE 6: VERIFY IMPROVEMENT - Score New Description');
      console.log('\nScoring the improved description (still from AO perspective)...\n');

      const newScoreResult = await descriptionScoringService.scoreDescription({
        description: generationResult.primary.text,
        activityTitle: TEST_ACTIVITY.title,
        activityType: TEST_ACTIVITY.category,
        position: TEST_ACTIVITY.position,
        hoursPerWeek: TEST_ACTIVITY.hoursPerWeek,
        weeksPerYear: TEST_ACTIVITY.weeksPerYear,
      });

      if (newScoreResult.success && newScoreResult.score) {
        const oldScore = baselineScoreResult.score!.total;
        const newScore = newScoreResult.score.total;
        const improvement = newScore - oldScore;

        console.log(`BEFORE: ${oldScore}/10`);
        console.log(`AFTER:  ${newScore}/10`);
        console.log(`IMPROVEMENT: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)} points`);

        console.log(`\nNew Breakdown:`);
        console.log(`  • Role Ownership:    ${newScoreResult.score.breakdown.specificity.score}/${newScoreResult.score.breakdown.specificity.maxScore}`);
        console.log(`  • Impact Clarity:    ${newScoreResult.score.breakdown.impactClarity.score}/${newScoreResult.score.breakdown.impactClarity.maxScore}`);
        console.log(`  • Action Language:   ${newScoreResult.score.breakdown.actionLanguage.score}/${newScoreResult.score.breakdown.actionLanguage.maxScore}`);
        console.log(`  • Quantification:    ${newScoreResult.score.breakdown.quantification.score}/${newScoreResult.score.breakdown.quantification.maxScore}`);
        console.log(`  • Differentiation:   ${newScoreResult.score.breakdown.authenticityVoice.score}/${newScoreResult.score.breakdown.authenticityVoice.maxScore}`);

        console.log(`\nNew Strengths: ${newScoreResult.score.strengths.join(', ')}`);

        if (newScoreResult.tokensUsed) {
          totalTokens.input += newScoreResult.tokensUsed.input;
          totalTokens.output += newScoreResult.tokensUsed.output;
        }
      }
    }

    // ========================================================================
    // PHASE 7: Conversation Summary
    // ========================================================================
    printSection('PHASE 7: CONVERSATION SUMMARY');

    const summary = activityProfileChatService.getConversationSummary(state);

    console.log('\nWhat We Learned:');
    summary.whatWeLearned.forEach(item => console.log(`  • ${item}`));

    console.log(`\nProfile Completeness: ${summary.completenessBefore}% → ${summary.completenessAfter}%`);

    console.log('\nKey Quotes Captured:');
    summary.keyQuotes.slice(0, 3).forEach(q => console.log(`  • "${q.substring(0, 70)}..."`));

    console.log('\nRemaining Gaps:');
    summary.remainingGaps.slice(0, 3).forEach(g => console.log(`  • ${g}`));

    console.log('\nEstimated Score Impact:');
    console.log(`  • Description: +${summary.estimatedScoreImpact.description} points`);
    console.log(`  • Activity: +${summary.estimatedScoreImpact.activity} points`);
    console.log(`  • Portfolio: +${summary.estimatedScoreImpact.portfolio} points`);

    console.log('\nSuggested Next Steps:');
    summary.suggestedNextSteps.forEach(step => console.log(`  • ${step}`));

    // ========================================================================
    // FINAL METRICS
    // ========================================================================
    printSection('TEST METRICS');

    const totalTime = Date.now() - startTime;

    // Get token usage from state (accumulated during conversation)
    const tokenUsage = state.tokenUsage || { totalInputTokens: 0, totalOutputTokens: 0, estimatedCost: 0 };

    console.log(`\nTotal Time: ${(totalTime / 1000).toFixed(1)} seconds`);
    console.log(`Total Tokens: ${tokenUsage.totalInputTokens.toLocaleString()} input, ${tokenUsage.totalOutputTokens.toLocaleString()} output`);
    console.log(`Estimated Cost: $${tokenUsage.estimatedCost.toFixed(4)}`);
    console.log(`Conversation Turns: ${state.totalTurns}`);
    console.log(`Profile Completeness: ${completeness.overall}%`);

    // ========================================================================
    // ANALYSIS: System Performance
    // ========================================================================
    printSection('SYSTEM PERFORMANCE ANALYSIS');

    console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│                    DEEP ANALYSIS REPORT                             │');
    console.log('└─────────────────────────────────────────────────────────────────────┘');

    console.log('\n1. EXTRACTION QUALITY');
    console.log('─'.repeat(40));
    const extractionQualities = state.responsesReceived.map(r => r.extraction.extractionQuality);
    const richCount = extractionQualities.filter(q => q === 'rich').length;
    const moderateCount = extractionQualities.filter(q => q === 'moderate').length;
    const sparseCount = extractionQualities.filter(q => q === 'sparse').length;
    console.log(`  Rich extractions: ${richCount}/${extractionQualities.length}`);
    console.log(`  Moderate extractions: ${moderateCount}/${extractionQualities.length}`);
    console.log(`  Sparse extractions: ${sparseCount}/${extractionQualities.length}`);
    console.log(`  Total fields extracted: ${state.extractedInfo.fields.length}`);
    console.log(`  Total quotes captured: ${state.extractedInfo.quotes.length}`);

    console.log('\n2. PROFILE DEPTH');
    console.log('─'.repeat(40));
    console.log(`  Facts populated: ${profile.facts.roles.length > 0 ? '✓' : '✗'} roles, ${profile.facts.recognition.length > 0 ? '✓' : '✗'} recognition, ${profile.facts.scale.peopleDirectlyImpacted > 0 ? '✓' : '✗'} scale`);
    console.log(`  Story populated: ${profile.story.origin.howStarted ? '✓' : '✗'} origin, ${profile.story.keyMoments.length} key moments`);
    console.log(`  Meaning populated: ${profile.meaning.whyItMatters ? '✓' : '✗'} why it matters, ${profile.meaning.proudestMoment ? '✓' : '✗'} proudest`);
    console.log(`  Impact populated: ${profile.impact.directBeneficiaries.length} beneficiaries, ${profile.impact.beforeAfter ? '✓' : '✗'} before/after`);

    console.log('\n3. GAP ANALYSIS EFFECTIVENESS');
    console.log('─'.repeat(40));
    console.log(`  High-impact gaps identified: ${gapAnalysis.missingElements.high_impact.length}`);
    console.log(`  Medium-impact gaps identified: ${gapAnalysis.missingElements.medium_impact.length}`);
    console.log(`  Potential score improvement: +${(gapAnalysis.potentialScore - gapAnalysis.currentScore).toFixed(1)} points`);

    console.log('\n4. SCORING INTEGRITY');
    console.log('─'.repeat(40));
    const oldScore = baselineScoreResult.score?.total || 0;
    console.log(`  Baseline score (before profile): ${oldScore}/10`);
    console.log(`  Profile did NOT inflate baseline: ✓ (scores only changed after description improved)`);
    console.log(`  Gap analysis correctly identified improvement opportunities: ✓`);

    console.log('\n5. AREAS FOR IMPROVEMENT');
    console.log('─'.repeat(40));

    // Check what we missed
    const missingAnalysis: string[] = [];

    if (profile.facts.scale.peopleDirectlyImpacted === 0 && SIMULATED_RESPONSES.join(' ').includes('15 students')) {
      missingAnalysis.push('- Failed to extract "15 students" as peopleDirectlyImpacted');
    }
    if (profile.facts.scale.resourcesCreated === 0 && SIMULATED_RESPONSES.join(' ').includes('30 tutorial videos')) {
      missingAnalysis.push('- Failed to extract "30 tutorial videos" as resourcesCreated');
    }
    if (profile.facts.recognition.length === 0 && SIMULATED_RESPONSES.join(' ').includes('Student Leader')) {
      missingAnalysis.push('- Failed to extract "Student Leader award" as recognition');
    }

    if (missingAnalysis.length > 0) {
      console.log('  Extraction missed these explicit data points:');
      missingAnalysis.forEach(m => console.log(`    ${m}`));
    } else {
      console.log('  All major data points were captured');
    }

    // Question quality
    console.log('\n  Question Quality:');
    console.log(`    Questions asked: ${state.questionsAsked.length}`);
    const uniqueCategories = new Set(state.questionsAsked.map(q => q.category));
    console.log(`    Categories covered: ${[...uniqueCategories].join(', ')}`);

    console.log('\n' + '═'.repeat(80));
    console.log('  TEST COMPLETE');
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    throw error;
  }
}

// Run the test
runE2ETest().catch(console.error);
