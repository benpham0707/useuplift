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

    // FULL teaching output for each activity
    for (const td of result.stage2.teachingDelivered) {
      const activity = testInput.activities.find(a => a.id === td.activityId);
      divider();
      log(`🎓 TEACHING: ${activity?.title || td.activityId} [${td.teachingDepth.toUpperCase()}]`);
      log('');

      const t = td.teaching;

      // Celebration
      if (t.celebration) {
        log('✨ CELEBRATION:');
        log(`   ${t.celebration.headline || ''}`);
        if (t.celebration.strengths) {
          for (const s of t.celebration.strengths) {
            log(`   • ${s}`);
          }
        }
        log('');
      }

      // Tier Explanation
      if (t.tierExplanation) {
        log(`📊 TIER: ${t.tierExplanation.assignedTier}`);
        log(`   ${t.tierExplanation.explanation?.text || ''}`);
        if (t.tierExplanation.whatMakesThisTier?.text) {
          log(`   What makes this tier: ${t.tierExplanation.whatMakesThisTier.text}`);
        }
        if (t.tierExplanation.whatWouldChangeIt?.text) {
          log(`   To improve: ${t.tierExplanation.whatWouldChangeIt.text}`);
        }
        log('');
      }

      // Strength Teaching
      if (t.strengthTeaching && t.strengthTeaching.length > 0) {
        log('💪 STRENGTHS:');
        for (const st of t.strengthTeaching) {
          log(`   ${st.strength}`);
          log(`   Why: ${st.whyItMatters?.text || ''}`);
          log(`   Leverage: ${st.howToLeverage || ''}`);
          log('');
        }
      }

      // Improvement Teaching
      if (t.improvementTeaching && t.improvementTeaching.length > 0) {
        log('🔧 IMPROVEMENTS:');
        for (const imp of t.improvementTeaching) {
          log(`   Issue: ${imp.issue} [${imp.priority || 'medium'}]`);
          log(`   Why: ${imp.whyItMatters?.text || ''}`);
          log(`   Fix: ${imp.howToFix || ''}`);
          if (imp.exampleBefore) log(`   Before: "${imp.exampleBefore}"`);
          if (imp.exampleAfter) log(`   After:  "${imp.exampleAfter}"`);
          log('');
        }
      }

      // Description Optimization
      if (t.descriptionOptimization) {
        log('📝 OPTIMIZED DESCRIPTION:');
        log(`   Original: "${t.descriptionOptimization.originalDescription}"`);
        log(`   Improved: "${t.descriptionOptimization.optimizedDescription}"`);
        log(`   Characters: ${t.descriptionOptimization.characterCount}`);
        if (t.descriptionOptimization.changesExplained) {
          log('   Changes:');
          for (const c of t.descriptionOptimization.changesExplained) {
            log(`   • ${c.change}: ${c.reason}`);
          }
        }
        log('');
      }

      // Narrative Guidance
      if (t.narrativeGuidance) {
        log('📖 NARRATIVE GUIDANCE:');
        log(`   How to talk about this: ${t.narrativeGuidance.howToTalkAboutThis?.text || ''}`);
        log(`   Unique angle: ${t.narrativeGuidance.uniqueAngle || ''}`);
        log(`   Story connection: ${t.narrativeGuidance.connectionToStory || ''}`);
        if (t.narrativeGuidance.interviewTips?.length) {
          log('   Interview tips:');
          for (const tip of t.narrativeGuidance.interviewTips) {
            log(`   • ${tip}`);
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
    // SUMMARY
    // ──────────────────────────────────────────
    divider('SUMMARY');
    log(`Version: ${result.version}`);
    log(`Duration: ${(duration / 1000).toFixed(1)}s`);
    log(`Cost: $${result.totalCost.toFixed(4)}`);
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
