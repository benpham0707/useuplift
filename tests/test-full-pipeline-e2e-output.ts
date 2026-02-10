/**
 * Full Pipeline E2E Output Test
 *
 * Runs the complete 4-stage pipeline and captures ALL user-facing output.
 * Designed to test expert knowledge integration end-to-end.
 *
 * Uses a realistic first-gen, working student profile to exercise
 * constraint intelligence, school-specific insights, and narrative arc detection.
 */

import dotenv from 'dotenv';
dotenv.config();

import { activityWorkshopService } from '../src/services/portfolioStrategy/services/activityWorkshop';
import { ActivityWorkshopSessionInput } from '../src/services/portfolioStrategy/services/activityWorkshop/types';

// Test student: First-gen, working, rural — exercises expert constraint intelligence
const testInput: ActivityWorkshopSessionInput = {
  activities: [
    {
      id: 'cs-club',
      title: 'Computer Science Club Founder',
      organization: 'Riverside High School',
      role: 'Founder & President',
      description: 'Started the first CS club at my school since we had no STEM clubs. Taught 25 students basic Python and web development. Organized our first hackathon with 3 neighboring schools.',
      category: 'school_activity',
      hoursPerWeek: 8,
      weeksPerYear: 36,
      yearsInvolved: 3,
      gradeLevels: [10, 11, 12],
      achievements: [
        { title: 'Built school\'s first CS curriculum' },
        { title: 'Hackathon attracted 60 participants' },
      ],
    },
    {
      id: 'research',
      title: 'Machine Learning Research',
      organization: 'State University (Remote Collaboration)',
      role: 'Research Assistant',
      description: 'Worked with professor on NLP project analyzing rural healthcare access patterns. Built data pipeline processing 50,000 patient records. Co-authored paper submitted to undergraduate journal.',
      category: 'work',
      hoursPerWeek: 12,
      weeksPerYear: 20,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      isPaid: false,
      achievements: [
        { title: 'Paper submitted to undergraduate research journal' },
      ],
    },
    {
      id: 'grocery',
      title: 'Grocery Store Associate',
      organization: 'Town Market',
      role: 'Stock Clerk / Cashier',
      description: 'Work 20 hours per week to help support family. Promoted to shift lead after 6 months. Train new employees.',
      category: 'work',
      hoursPerWeek: 20,
      weeksPerYear: 52,
      yearsInvolved: 3,
      gradeLevels: [10, 11, 12],
      isPaid: true,
    },
    {
      id: 'tutoring',
      title: 'Math & Science Tutor',
      organization: 'County Library Free Tutoring Program',
      role: 'Lead Tutor',
      description: 'Volunteer tutor for middle school students. Help with math and science homework. About 8 students come regularly.',
      category: 'volunteer',
      hoursPerWeek: 4,
      weeksPerYear: 36,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      achievements: [
        { title: 'Named Volunteer of the Quarter' },
      ],
    },
    {
      id: 'farm',
      title: 'Family Farm Work',
      organization: 'Family',
      role: 'Helper',
      description: 'Help on family farm during growing season. Drive equipment, manage irrigation, keep records of harvest yields.',
      category: 'other',
      hoursPerWeek: 15,
      weeksPerYear: 20,
      yearsInvolved: 4,
      gradeLevels: [9, 10, 11, 12],
    },
  ],
  studentContext: {
    intendedMajor: 'Computer Science',
    targetSchools: ['MIT', 'Georgia Tech', 'UT Austin'],
    gradeLevel: 12,
    firstGen: true,
    lowIncome: true,
    // Expert context fields
    hasWorkObligations: true,
    workHoursPerWeek: 20,
    constraintNotes: 'First-gen, rural community, works 20hrs/week at grocery store to help support family. Nearest AP test center is 45 miles away.',
    geographicContext: 'Rural town, population ~3,000, nearest city 60 miles',
  },
};

function log(msg: string) {
  console.log(msg);
}

function divider(title?: string) {
  if (title) {
    log(`\n${'═'.repeat(80)}`);
    log(`  ${title}`);
    log('═'.repeat(80));
  } else {
    log('─'.repeat(80));
  }
}

async function runTest() {
  divider('FULL PIPELINE E2E TEST — Expert Knowledge Integration');
  log(`Student: First-gen, rural, working 20hrs/week`);
  log(`Activities: ${testInput.activities.length}`);
  log(`Target Schools: ${testInput.studentContext?.targetSchools?.join(', ')}`);
  log(`Intended Major: ${testInput.studentContext?.intendedMajor}`);
  log('');

  const startTime = Date.now();

  try {
    const result = await activityWorkshopService.runPipeline(testInput);
    const duration = Date.now() - startTime;

    // ──────────────────────────────────────────
    // STAGE 0: Story Detection
    // ──────────────────────────────────────────
    divider('STAGE 0: STORY DETECTION');
    log(`Archetype: ${result.stage0.narrativeIdentity.archetype}`);
    log(`Story Essence: ${result.stage0.narrativeIdentity.storyEssence}`);
    log(`Theme: ${result.stage0.narrativeIdentity.centralTheme || 'N/A'}`);
    log(`Strengths: ${result.stage0.narrativeIdentity.coreStrengths?.join(', ') || 'N/A'}`);
    log(`Context Signals: ${result.stage0.contextSignals?.length || 0}`);
    if (result.stage0.contextSignals) {
      for (const signal of result.stage0.contextSignals) {
        log(`  - [${signal.type}] ${signal.signal} (weight: ${signal.weight})`);
      }
    }

    // ──────────────────────────────────────────
    // STAGE 1: Analysis
    // ──────────────────────────────────────────
    divider('STAGE 1: CONTEXT-AWARE ANALYSIS');
    log(`Tier Distribution: T1=${result.stage1.tierDistribution.tier1}, T2=${result.stage1.tierDistribution.tier2}, T3=${result.stage1.tierDistribution.tier3}, T4=${result.stage1.tierDistribution.tier4}`);
    log(`Spike: ${result.stage1.spikeAnalysis.hasSpike ? result.stage1.spikeAnalysis.spikeArea : 'None detected'}`);
    log(`Coherence: ${result.stage1.coherenceAnalysis.score}/100`);
    log('');

    for (const [activityId, analysis] of Object.entries(result.stage1.activities)) {
      const activity = testInput.activities.find(a => a.id === activityId);
      log(`📋 ${activity?.title || activityId}`);
      log(`   Tier: ${analysis.classification.tier} — ${analysis.classification.tierName || ''}`);
      log(`   Category: ${analysis.classification.detectedCategory}`);
      log(`   Issues: ${analysis.descriptionQuality.issues.join(', ') || 'None'}`);
      log(`   Strengths: ${analysis.descriptionQuality.strengths.join(', ') || 'None'}`);
      log(`   Green Flags: ${analysis.greenFlags.map((f: any) => f.flag).join(', ') || 'None'}`);
      log(`   Red Flags: ${analysis.redFlags.map((f: any) => f.flag).join(', ') || 'None'}`);
      log('');
    }

    log('Teaching Candidates:');
    log(`  Deep: ${result.stage1.teachingCandidates.deepTeachingIds.join(', ')}`);
    log(`  Medium: ${result.stage1.teachingCandidates.mediumTeachingIds.join(', ')}`);
    log(`  Quick: ${result.stage1.teachingCandidates.quickEncouragementIds.join(', ')}`);
    log(`  Skip: ${result.stage1.teachingCandidates.skipTeachingIds.join(', ')}`);

    // ──────────────────────────────────────────
    // STAGE 2: Teaching — FULL OUTPUT
    // ──────────────────────────────────────────
    divider('STAGE 2: EXPERT-POWERED TEACHING (FULL OUTPUT)');
    log(`Activities Taught: ${result.stage2.teachingDelivered.length}`);
    log(`Quick Encouragements: ${result.stage2.quickEncouragements.length}`);
    log(`Skipped: ${result.stage2.skippedActivities.length}`);
    log('');

    // FULL teaching output for each activity — unified with scoring data
    // Build lookup maps for per-activity scoring and transformations
    const activityScoresMap = new Map<string, any>();
    const transformationsMap = new Map<string, any>();
    if (result.scoring) {
      for (const actScore of result.scoring.activityScores) {
        // Map by activityId and title for flexible matching
        if (actScore.activityId) activityScoresMap.set(actScore.activityId, actScore);
        if (actScore.activityTitle) activityScoresMap.set(actScore.activityTitle, actScore);
      }
      if (result.scoring.scoringTeaching) {
        for (const t of result.scoring.scoringTeaching.activityTransformations) {
          if (t.activityId) transformationsMap.set(t.activityId, t);
          if (t.activityName) transformationsMap.set(t.activityName, t);
        }
      }
    }

    for (const td of result.stage2.teachingDelivered) {
      const activity = testInput.activities.find(a => a.id === td.activityId);
      const activityTitle = activity?.title || td.activityId;
      divider();
      log(`TEACHING: ${activityTitle} [${td.teachingDepth.toUpperCase()}]`);

      // ── SCORE CARD (integrated from scoring system) ──
      const actScore = activityScoresMap.get(td.activityId) || activityScoresMap.get(activityTitle);
      if (actScore) {
        log(`  Score: ${actScore.combinedScore.total.toFixed(1)}/10 (Activity: ${actScore.activityScore.total.toFixed(1)}, Description: ${actScore.descriptionScore.total.toFixed(1)})`);
        log(`  ${actScore.summary.oneLiner}`);
        log('');
      }

      const t = td.teaching;

      // Celebration
      if (t.celebration) {
        log('  CELEBRATION:');
        log(`  ${t.celebration.headline || ''}`);
        if (t.celebration.strengths) {
          for (const s of t.celebration.strengths) {
            log(`  + ${s}`);
          }
        }
        log('');
      }

      // Tier Explanation
      if (t.tierExplanation) {
        log(`  TIER: ${t.tierExplanation.assignedTier}`);
        log(`  ${t.tierExplanation.explanation?.text || ''}`);
        if (t.tierExplanation.whatMakesThisTier?.text) {
          log(`  What makes this tier: ${t.tierExplanation.whatMakesThisTier.text}`);
        }
        if (t.tierExplanation.whatWouldChangeIt?.text) {
          log(`  To improve: ${t.tierExplanation.whatWouldChangeIt.text}`);
        }
        log('');
      }

      // Strength Teaching
      if (t.strengthTeaching && t.strengthTeaching.length > 0) {
        log('  STRENGTHS:');
        for (const st of t.strengthTeaching) {
          log(`  ${st.strength}`);
          log(`    Why: ${st.whyItMatters?.text || ''}`);
          log(`    Leverage: ${st.howToLeverage || ''}`);
          log('');
        }
      }

      // Improvement Teaching
      if (t.improvementTeaching && t.improvementTeaching.length > 0) {
        log('  IMPROVEMENTS:');
        for (const imp of t.improvementTeaching) {
          log(`  Issue: ${imp.issue} [${imp.priority || 'medium'}]`);
          log(`    Why: ${imp.whyItMatters?.text || ''}`);
          log(`    Fix: ${imp.howToFix || ''}`);
          if (imp.exampleBefore) log(`    Before: "${imp.exampleBefore}"`);
          if (imp.exampleAfter) log(`    After:  "${imp.exampleAfter}"`);
          log('');
        }
      }

      // Description Optimization + Scoring Breakdown (merged)
      if (t.descriptionOptimization) {
        log('  DESCRIPTION:');
        log(`  Original (${t.descriptionOptimization.originalDescription?.length || 0} chars): "${t.descriptionOptimization.originalDescription}"`);
        log(`  Improved (${t.descriptionOptimization.characterCount} chars): "${t.descriptionOptimization.optimizedDescription}"`);
        if (t.descriptionOptimization.changesExplained) {
          for (const c of t.descriptionOptimization.changesExplained) {
            log(`    - ${c.change}: ${c.reason}`);
          }
        }
        log('');
      }

      // Per-activity scoring breakdown (integrated here instead of standalone section)
      if (actScore) {
        log('  DESCRIPTION SCORING (5-dimension breakdown):');
        const db = actScore.descriptionScore.breakdown;
        log(`    Role Ownership:      ${db.specificity.score}/${db.specificity.maxScore} — ${db.specificity.rationale}`);
        log(`    Evidence of Impact:   ${db.impactClarity.score}/${db.impactClarity.maxScore} — ${db.impactClarity.rationale}`);
        log(`    Action Precision:     ${db.actionLanguage.score}/${db.actionLanguage.maxScore} — ${db.actionLanguage.rationale}`);
        log(`    Quantification:       ${db.quantification.score}/${db.quantification.maxScore} — ${db.quantification.rationale}`);
        log(`    Differentiation:      ${db.authenticityVoice.score}/${db.authenticityVoice.maxScore} — ${db.authenticityVoice.rationale}`);
        log('');

        log('  ACTIVITY SCORING (5-component breakdown):');
        const ab = actScore.activityScore.breakdown;
        log(`    Tier Assessment:     ${ab.tierAssessment.score}/10 (${(ab.tierAssessment.weight * 100).toFixed(0)}%) T${ab.tierAssessment.tier} — ${ab.tierAssessment.rationale}`);
        log(`    Recognition:         ${ab.recognitionLevel.score}/10 (${(ab.recognitionLevel.weight * 100).toFixed(0)}%) [${ab.recognitionLevel.level}] — ${ab.recognitionLevel.rationale}`);
        log(`    Leadership/Impact:   ${ab.leadershipImpact.score}/10 (${(ab.leadershipImpact.weight * 100).toFixed(0)}%) [${ab.leadershipImpact.role}/${ab.leadershipImpact.impactScope}] — ${ab.leadershipImpact.rationale}`);
        log(`    Community/Character: ${ab.communityCharacter.score}/10 (${(ab.communityCharacter.weight * 100).toFixed(0)}%) [${ab.communityCharacter.primaryTrait}/${ab.communityCharacter.authenticitySignal}] — ${ab.communityCharacter.rationale}`);
        log(`    Commitment:          ${ab.commitmentProgression.score}/10 (${(ab.commitmentProgression.weight * 100).toFixed(0)}%) ${ab.commitmentProgression.years}yr ${ab.commitmentProgression.showsProgression ? '↗' : '→'} — ${ab.commitmentProgression.rationale}`);
        log('');
      }

      // Scoring transformation for this activity (integrated here instead of standalone section)
      const transformation = transformationsMap.get(td.activityId) || transformationsMap.get(activityTitle);
      if (transformation) {
        log('  EXPERT REWRITE:');
        log(`  Principle: ${transformation.principle.name}`);
        log(`    Why: ${transformation.principle.whyItMatters}`);
        log(`    Application: ${transformation.principle.applicationToActivity}`);
        log(`  Before: "${transformation.rewrite.original}"`);
        log(`  After:  "${transformation.rewrite.suggested}" (${transformation.rewrite.characterCount} chars)`);
        for (const change of transformation.rewrite.changesApplied) {
          log(`    [${change.element}] "${change.original}" -> "${change.transformed}"`);
          log(`      ${change.rationale}`);
        }
        if (transformation.alternatives?.length) {
          log('  Alternatives:');
          for (const alt of transformation.alternatives) {
            log(`    ${alt.angle}: "${alt.rewrite}"`);
            log(`      When: ${alt.whenToUse}`);
          }
        }
        if (transformation.citations?.length > 0) {
          log('  Research:');
          for (const c of transformation.citations) {
            log(`    [${c.source}] ${c.sourceName}: "${c.insight}"`);
          }
        }
        log(`  Expected: ${transformation.currentScore}/10 -> ${transformation.expectedScoreImprovement.projectedScore}/10`);
        log('');
      }

      // Narrative Guidance
      if (t.narrativeGuidance) {
        log('  NARRATIVE GUIDANCE:');
        log(`  How to talk about this: ${t.narrativeGuidance.howToTalkAboutThis?.text || ''}`);
        log(`  Unique angle: ${t.narrativeGuidance.uniqueAngle || ''}`);
        log(`  Story connection: ${t.narrativeGuidance.connectionToStory || ''}`);
        if (t.narrativeGuidance.interviewTips?.length) {
          log('  Interview tips:');
          for (const tip of t.narrativeGuidance.interviewTips) {
            log(`    - ${tip}`);
          }
        }
        log('');
      }
    }

    // Quick encouragements
    if (result.stage2.quickEncouragements.length > 0) {
      log('\n💬 QUICK ENCOURAGEMENTS:');
      for (const enc of result.stage2.quickEncouragements) {
        log(`  ${enc.activityId}: ${enc.message || JSON.stringify(enc)}`);
      }
      log('');
    }

    // Portfolio-level teaching
    if (result.stage2.portfolioTeaching) {
      log('PORTFOLIO-LEVEL TEACHING:');
      const pt = result.stage2.portfolioTeaching;
      if (pt.narrativeTeaching) {
        log(`  Current State: ${pt.narrativeTeaching.currentState}`);
        log(`  Recommendation: ${pt.narrativeTeaching.recommendation}`);
        log(`  Two-Sentence Pitch: ${pt.narrativeTeaching.twoSentencePitch}`);
      }
      if (pt.coherenceTeaching) {
        log(`  Coherence Score: ${pt.coherenceTeaching.currentScore}/100`);
        if (pt.coherenceTeaching.improvements?.length) {
          log('  Improvements:');
          for (const imp of pt.coherenceTeaching.improvements) {
            log(`    - ${imp}`);
          }
        }
      }
      if (pt.strategicDirection) {
        log(`  Strategic Direction: ${pt.strategicDirection}`);
      }
      log('');
    }

    // ──────────────────────────────────────────
    // STAGE 3: Synthesis
    // ──────────────────────────────────────────
    divider('STAGE 3: PORTFOLIO SYNTHESIS');
    log(`Harvard Scale: ${result.stage3.finalAssessment.harvardScale}/6`);
    log(`Overall Strength: ${result.stage3.finalAssessment.overallStrength}`);
    log(`Confidence: ${result.stage3.finalAssessment.confidence}%`);
    log('');

    if (result.stage3.orderedActivities) {
      log('Ordered Activity List:');
      for (let i = 0; i < result.stage3.orderedActivities.length; i++) {
        const oa = result.stage3.orderedActivities[i];
        log(`  ${i + 1}. ${oa.title || oa.activityId} — ${oa.reason || ''}`);
        if (oa.optimizedDescription) {
          log(`     "${oa.optimizedDescription}"`);
        }
      }
      log('');
    }

    if (result.stage3.actionPlan) {
      log('Action Plan:');
      const ap = result.stage3.actionPlan;
      const formatItem = (item: unknown): string => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>;
          const action = obj.action || obj.action_item || obj.task || 'Action';
          const impact = obj.impact || obj.reason || '';
          const deadline = obj.deadline || '';
          return `${action}${impact ? ` → ${impact}` : ''}${deadline ? ` (by ${deadline})` : ''}`;
        }
        return String(item);
      };
      if (ap.immediate?.length) {
        log('  Immediate:');
        for (const a of ap.immediate) log(`    • ${formatItem(a)}`);
      }
      if (ap.shortTerm?.length) {
        log('  Short-term:');
        for (const a of ap.shortTerm) log(`    • ${formatItem(a)}`);
      }
      if (ap.longTerm?.length) {
        log('  Long-term:');
        for (const a of ap.longTerm) log(`    • ${formatItem(a)}`);
      }
      log('');
    }

    // ──────────────────────────────────────────
    // FINAL NARRATIVE
    // ──────────────────────────────────────────
    if (result.finalNarrative) {
      divider('PORTFOLIO NARRATIVE');
      log(`Story Pitch: ${result.finalNarrative.story.pitch}`);
      log(`Coherence: ${result.finalNarrative.coherence.assessment} (${result.finalNarrative.coherence.score}/100)`);
      if (result.finalNarrative.spike) {
        log(`Spike: ${result.finalNarrative.spike.primarySpike.area || 'None'} — ${result.finalNarrative.spike.primarySpike.evidence || ''}`);
      }
      if (result.finalNarrative.threads?.length > 0) {
        log('\nNarrative Threads:');
        for (const thread of result.finalNarrative.threads) {
          log(`  ${thread.name}: ${thread.activityIds.join(', ')}`);
          log(`     Synergy: ${thread.synergy}`);
        }
      }
      if (result.finalNarrative.elevations?.length > 0) {
        log('\nActivity Elevations:');
        for (const elev of result.finalNarrative.elevations) {
          log(`  ${elev.elevatingActivityId} → ${elev.elevatedActivityId} [${elev.strength}]`);
          log(`  ${elev.mechanism}`);
        }
      }
    }

    // ──────────────────────────────────────────
    // PORTFOLIO SCORING OVERVIEW (v4.3)
    // Per-activity scoring is integrated into Stage 2 teaching above
    // ──────────────────────────────────────────
    if (result.scoring) {
      divider('PORTFOLIO SCORING OVERVIEW');
      const rubric = result.scoring.portfolioRubric;
      log(`Portfolio Score: ${rubric.overallScore.total}/10 (confidence: ${rubric.overallScore.confidence})`);
      log(`Harvard Scale: ${rubric.harvardScale.rating}/6 — ${rubric.harvardScale.description}`);
      log(`Harvard Rationale: ${rubric.harvardScale.rationale}`);
      log('');
      log('Portfolio Breakdown:');
      log(`  Tier Distribution:     ${rubric.breakdown.tierDistribution.score}/10 — ${rubric.breakdown.tierDistribution.rationale}`);
      log(`  Spike Detection:       ${rubric.breakdown.spikeDetection.score}/10 — ${rubric.breakdown.spikeDetection.rationale}`);
      log(`  Coherence:             ${rubric.breakdown.coherence.score}/10 — ${rubric.breakdown.coherence.rationale}`);
      log(`  Major Alignment:       ${rubric.breakdown.majorAlignment.score}/10 — ${rubric.breakdown.majorAlignment.rationale}`);
      log(`  Presentation Quality:  ${rubric.breakdown.presentationQuality.score}/10 — ${rubric.breakdown.presentationQuality.rationale}`);
      log('');
      log('Key Strengths:');
      for (const s of rubric.keyStrengths) log(`  + ${s}`);
      log('Key Gaps:');
      for (const g of rubric.keyGaps) log(`  - ${g}`);
      log('');
      log('Prioritized Recommendations:');
      for (const r of rubric.prioritizedRecommendations) {
        log(`  [P${r.priority}] ${r.recommendation} (impact: ${r.impact}, effort: ${r.effort})`);
      }
      log('');

      // Portfolio-level scoring teaching (craft teaching, strategic priorities, connection strategies)
      if (result.scoring.scoringTeaching) {
        const st = result.scoring.scoringTeaching;

        if (st.strategicPriorities.length > 0) {
          log('Strategic Priorities:');
          for (const p of st.strategicPriorities) {
            log(`  [P${p.priority}] ${p.target} (${p.category}): ${p.action}`);
            log(`    Why: ${p.rationale}`);
            log(`    Impact: ${p.expectedImpact}`);
          }
          log('');
        }

        if (st.craftTeaching.length > 0) {
          log('Description Writing Craft:');
          for (const ct of st.craftTeaching) {
            log(`  ${ct.element}: ${ct.principle}`);
            log(`    Why: ${ct.whyItMatters}`);
            for (const ex of ct.examples) {
              log(`    Example (${ex.context}):`);
              log(`      Weak: "${ex.weak}"`);
              log(`      Strong: "${ex.strong}"`);
              log(`      ${ex.explanation}`);
            }
          }
          log('');
        }
      }
    } else {
      divider('SCORING');
      log('Scoring data not available (scoring orchestrator may have failed)');
      log('');
    }

    // ──────────────────────────────────────────
    // RECOMMENDED DESCRIPTIONS — Final copy-pasteable view
    // ──────────────────────────────────────────
    divider('RECOMMENDED DESCRIPTIONS (Ready to Submit)');
    log('Your optimized activity descriptions, in recommended order:');
    log('');

    // Use Stage 3 ordering if available, otherwise follow teaching order
    const orderedIds: string[] = result.stage3.orderedActivities
      ? result.stage3.orderedActivities.map((oa: any) => oa.activityId)
      : testInput.activities.map(a => a.id);

    for (let i = 0; i < orderedIds.length; i++) {
      const actId = orderedIds[i];
      const activity = testInput.activities.find(a => a.id === actId);
      if (!activity) continue;

      // Find the best description: scoring rewrite > Stage 2 optimized > original
      const td = result.stage2.teachingDelivered.find((t: any) => t.activityId === actId);
      const stage2Desc = td?.teaching?.descriptionOptimization?.optimizedDescription;
      const scoringRewrite = transformationsMap.get(actId)?.rewrite?.suggested
        || transformationsMap.get(activity.title)?.rewrite?.suggested;
      const originalDesc = activity.description;

      // Pick the best available description within char limit
      const charLimit = 150; // Common App default
      let bestDesc = originalDesc;
      let source = 'original';

      if (stage2Desc && stage2Desc.length <= charLimit) {
        bestDesc = stage2Desc;
        source = 'optimized';
      }
      if (scoringRewrite && scoringRewrite.length <= charLimit) {
        bestDesc = scoringRewrite;
        source = 'expert rewrite';
      }

      // Get score if available
      const actScore = activityScoresMap.get(actId) || activityScoresMap.get(activity.title);
      const scoreText = actScore ? ` [${actScore.combinedScore.total.toFixed(1)}/10]` : '';

      log(`  ${i + 1}. ${activity.title}${scoreText}`);
      log(`     "${bestDesc}"`);
      log(`     (${bestDesc.length} chars, ${source})`);
      log('');
    }

    // ──────────────────────────────────────────
    // SUMMARY
    // ──────────────────────────────────────────
    divider('SUMMARY');
    log(`Version: ${result.version}`);
    log(`Duration: ${(duration / 1000).toFixed(1)}s`);
    log(`Cost: $${result.totalCost.toFixed(4)}`);
    if (result.scoring) {
      log(`Portfolio Score: ${result.scoring.portfolioRubric.overallScore.total}/10`);
      log(`Harvard Scale: ${result.scoring.portfolioRubric.harvardScale.rating}/6`);
    }
    log('');

  } catch (error) {
    log('');
    divider('PIPELINE ERROR');
    log(`Error: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      log(error.stack.split('\n').slice(0, 10).join('\n'));
    }
  }
}

runTest()
  .then(() => {
    log('\nTest complete.');
    process.exit(0);
  })
  .catch((err) => {
    log(`Fatal error: ${err}`);
    process.exit(1);
  });
