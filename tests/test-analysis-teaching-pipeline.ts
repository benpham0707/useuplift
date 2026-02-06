/**
 * Test: Analysis + Teaching Pipeline Output
 *
 * Shows the complete output from:
 * 1. Activity Diagnosis Service (Haiku) - Fast triage
 * 2. Activity Analysis Service (Sonnet) - Deep analysis
 * 3. Activity Teaching Service (Sonnet) - How to improve
 *
 * This demonstrates the depth and detail available for each EC.
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

import { activityDiagnosisService } from '../src/services/portfolioStrategy/services/activityWorkshop/activityDiagnosisService';
import { activityAnalysisService } from '../src/services/portfolioStrategy/services/activityWorkshop/activityAnalysisService';
import { activityTeachingService } from '../src/services/portfolioStrategy/services/activityWorkshop/activityTeachingService';
import { ActivityWorkshopInput, ActivityWorkshopSessionInput } from '../src/services/portfolioStrategy/services/activityWorkshop/types';

// ============================================================================
// API KEY VERIFICATION
// ============================================================================

async function verifyApiKey(): Promise<boolean> {
  const key = process.env.ANTHROPIC_API_KEY;
  console.log('\n=== API KEY VERIFICATION ===');
  console.log('Key present:', !!key);
  console.log('Key length:', key?.length);

  if (!key || key.length < 50) {
    console.error('❌ API key not properly loaded');
    return false;
  }

  try {
    const client = new Anthropic({ apiKey: key });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      messages: [{ role: 'user', content: 'Say OK' }]
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('✅ API verification:', text);
    return true;
  } catch (error: any) {
    console.error('❌ API verification failed:', error.message);
    return false;
  }
}

// ============================================================================
// TEST ACTIVITIES
// ============================================================================

// Just test one activity for faster iteration
const testActivities: ActivityWorkshopInput[] = [
  {
    id: 'activity-2',
    title: 'Research Internship - Cancer Biology',
    category: 'research',
    description: 'Conducted independent research on CRISPR gene editing techniques for targeting colorectal cancer cells. Presented findings at the Junior Science and Humanities Symposium, placing 2nd in the state competition. Co-authored a paper submitted to a peer-reviewed journal.',
    organization: 'Stanford Cancer Center',
    role: 'Research Intern',
    hoursPerWeek: 20,
    weeksPerYear: 12,
    yearsInvolved: 2,
    gradeLevels: [11, 12],
    isPaid: false,
    achievements: [
      { title: 'JSHS State Competition', level: 'state', date: '2024-03' },
      { title: 'Co-authored paper submitted', level: 'national', date: '2024-06' },
    ],
  },
];

const studentContext: ActivityWorkshopSessionInput['studentContext'] = {
  gradeLevel: 12,
  intendedMajor: 'Molecular Biology',
  targetSchools: ['Stanford', 'MIT', 'Harvard'],
  firstGen: false,
  lowIncome: false,
};

// ============================================================================
// OUTPUT FORMATTERS
// ============================================================================

function printSection(title: string) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(80)}`);
}

function printSubSection(title: string) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'─'.repeat(60)}`);
}

function printKeyValue(key: string, value: any, indent = 0) {
  const prefix = '  '.repeat(indent);
  if (typeof value === 'object' && value !== null) {
    console.log(`${prefix}${key}:`);
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === 'object') {
          console.log(`${prefix}  [${i}]:`);
          Object.entries(item).forEach(([k, v]) => {
            console.log(`${prefix}    ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
          });
        } else {
          console.log(`${prefix}  • ${item}`);
        }
      });
    } else {
      Object.entries(value).forEach(([k, v]) => {
        printKeyValue(k, v, indent + 1);
      });
    }
  } else {
    console.log(`${prefix}${key}: ${value}`);
  }
}

// ============================================================================
// MAIN TEST
// ============================================================================

async function main() {
  console.log('\n' + '═'.repeat(80));
  console.log('  ACTIVITY ANALYSIS + TEACHING PIPELINE - FULL OUTPUT DEMO');
  console.log('═'.repeat(80));
  console.log('\nThis test demonstrates the complete output from the analysis engine,');
  console.log('showing the depth and detail available for each extracurricular.\n');

  // Verify API
  const apiWorks = await verifyApiKey();
  if (!apiWorks) {
    console.error('\n❌ Cannot proceed without working API key');
    process.exit(1);
  }

  // Process each activity through the full pipeline
  for (const activity of testActivities) {
    printSection(`ACTIVITY: ${activity.title}`);

    console.log('\n📋 INPUT:');
    console.log(`   Title: ${activity.title}`);
    console.log(`   Category: ${activity.category}`);
    console.log(`   Description: "${activity.description}"`);
    console.log(`   Time: ${activity.hoursPerWeek}h/week × ${activity.weeksPerYear} weeks × ${activity.yearsInvolved} years`);
    console.log(`   Role: ${activity.role}`);
    if (activity.achievements?.length) {
      console.log(`   Achievements: ${activity.achievements.map(a => `${a.title} (${a.level})`).join(', ')}`);
    }

    // ========================================================================
    // STAGE 1: DIAGNOSIS (Haiku - Fast Triage)
    // ========================================================================
    printSubSection('STAGE 1: DIAGNOSIS (Haiku - Fast Triage)');
    console.log('Purpose: Quick tier classification, red/green flag detection\n');

    try {
      const diagnosis = await activityDiagnosisService.diagnoseActivity(activity);

      console.log('TIER CLASSIFICATION:');
      console.log(`   Tier: ${diagnosis.preliminaryTier} (${diagnosis.tierConfidence} confidence)`);
      console.log(`   Category: ${diagnosis.detectedCategory}`);

      console.log('\nRECOGNITION:');
      console.log(`   Level: ${diagnosis.detectedRecognition}`);
      if (diagnosis.recognitionEvidence?.length) {
        console.log(`   Evidence:`);
        diagnosis.recognitionEvidence.forEach(e => console.log(`     • ${e}`));
      }

      console.log('\nLEADERSHIP:');
      console.log(`   Type: ${diagnosis.detectedLeadership}`);
      if (diagnosis.leadershipEvidence?.length) {
        console.log(`   Evidence:`);
        diagnosis.leadershipEvidence.forEach(e => console.log(`     • ${e}`));
      }

      console.log('\nIMPACT:');
      console.log(`   Type: ${diagnosis.detectedImpact}`);
      if (diagnosis.impactEvidence?.length) {
        console.log(`   Evidence:`);
        diagnosis.impactEvidence.forEach(e => console.log(`     • ${e}`));
      }
      if (diagnosis.quantifiableMetrics?.length) {
        console.log(`   Metrics:`);
        diagnosis.quantifiableMetrics.forEach(m => {
          console.log(`     • ${m.metric}: ${m.value} (${m.tier})`);
        });
      }

      if (diagnosis.redFlags?.length) {
        console.log('\n🚩 RED FLAGS:');
        diagnosis.redFlags.forEach(f => {
          console.log(`   [${f.severity.toUpperCase()}] ${f.flag}`);
          console.log(`     Evidence: ${f.evidence}`);
        });
      }

      if (diagnosis.greenFlags?.length) {
        console.log('\n✅ GREEN FLAGS:');
        diagnosis.greenFlags.forEach(f => {
          console.log(`   [${f.strength.toUpperCase()}] ${f.flag}`);
          console.log(`     Evidence: ${f.evidence}`);
        });
      }

      console.log('\nDESCRIPTION QUALITY:');
      console.log(`   Specificity: ${diagnosis.descriptionQuality.specificity}/10`);
      console.log(`   Impact Clarity: ${diagnosis.descriptionQuality.impactClarity}/10`);
      console.log(`   Uniqueness: ${diagnosis.descriptionQuality.uniqueness}/10`);
      if (diagnosis.descriptionQuality.issues?.length) {
        console.log(`   Issues:`);
        diagnosis.descriptionQuality.issues.forEach(i => console.log(`     • ${i}`));
      }

      if (diagnosis.databaseMatches?.length) {
        console.log('\nDATABASE MATCHES:');
        diagnosis.databaseMatches.forEach(m => {
          console.log(`   • ${m.database}: "${m.match}" (Tier ${m.tier}, ${m.relevance}% relevant)`);
        });
      }

    } catch (error: any) {
      console.error(`❌ Diagnosis failed: ${error.message}`);
    }

    // ========================================================================
    // STAGE 2: DEEP ANALYSIS (Sonnet - Comprehensive)
    // ========================================================================
    printSubSection('STAGE 2: DEEP ANALYSIS (Sonnet - Comprehensive)');
    console.log('Purpose: Full classification, narrative potential, school fit\n');

    try {
      const analysis = await activityAnalysisService.analyzeActivity(activity, studentContext);

      console.log('CLASSIFICATION:');
      console.log(`   Tier: ${analysis.classification.tier} (${analysis.classification.tierConfidence} confidence)`);
      console.log(`   Reasoning: ${analysis.classification.tierReasoning}`);
      console.log(`   Category: ${analysis.classification.detectedCategory} (${analysis.classification.categoryConfidence}% confident)`);

      console.log('\nRECOGNITION ANALYSIS:');
      console.log(`   Level: ${analysis.recognition.level}`);
      console.log(`   Authenticity Score: ${analysis.recognition.authenticityScore}/100`);
      if (analysis.recognition.evidence?.length) {
        console.log(`   Evidence:`);
        analysis.recognition.evidence.forEach(e => console.log(`     • ${e}`));
      }
      if (analysis.recognition.authenticityFactors?.length) {
        console.log(`   Authenticity Factors:`);
        analysis.recognition.authenticityFactors.forEach(f => console.log(`     • ${f}`));
      }

      console.log('\nLEADERSHIP ANALYSIS:');
      console.log(`   Type: ${analysis.leadership.type}`);
      console.log(`   Quality: ${analysis.leadership.leadershipQuality}`);
      console.log(`   Impact Scope: ${analysis.leadership.impactScope}`);
      if (analysis.leadership.evidence?.length) {
        console.log(`   Evidence:`);
        analysis.leadership.evidence.forEach(e => console.log(`     • ${e}`));
      }

      console.log('\nIMPACT ANALYSIS:');
      console.log(`   Type: ${analysis.impact.type}`);
      console.log(`   Score: ${analysis.impact.impactScore}/100`);
      console.log(`   Narrative: ${analysis.impact.impactNarrative}`);
      if (analysis.impact.quantifiableMetrics?.length) {
        console.log(`   Quantifiable Metrics:`);
        analysis.impact.quantifiableMetrics.forEach(m => {
          console.log(`     • ${m.metric}: ${m.value} (${m.tier}${m.verified ? ', verified' : ''})`);
        });
      }

      console.log('\nTIME INVESTMENT:');
      console.log(`   Total Hours: ${analysis.timeInvestment.totalHours}`);
      console.log(`   Commitment Level: ${analysis.timeInvestment.commitmentLevel}`);
      if (analysis.timeInvestment.progressionEvidence?.length) {
        console.log(`   Progression Evidence:`);
        analysis.timeInvestment.progressionEvidence.forEach(e => console.log(`     • ${e}`));
      }

      console.log('\nDESCRIPTION QUALITY (0-10 each):');
      console.log(`   Specificity: ${analysis.descriptionQuality.specificity}`);
      console.log(`   Impact Clarity: ${analysis.descriptionQuality.impactClarity}`);
      console.log(`   Uniqueness: ${analysis.descriptionQuality.uniqueness}`);
      console.log(`   Action Verbs: ${analysis.descriptionQuality.actionVerbs}`);
      console.log(`   Quantification: ${analysis.descriptionQuality.quantification}`);
      console.log(`   Overall Score: ${analysis.descriptionQuality.overallScore}/100`);
      if (analysis.descriptionQuality.issues?.length) {
        console.log(`   Issues:`);
        analysis.descriptionQuality.issues.forEach(i => console.log(`     • ${i}`));
      }
      if (analysis.descriptionQuality.strengths?.length) {
        console.log(`   Strengths:`);
        analysis.descriptionQuality.strengths.forEach(s => console.log(`     • ${s}`));
      }

      console.log('\nNARRATIVE POTENTIAL:');
      console.log(`   Storytelling Value: ${analysis.narrativePotential.storytellingValue}`);
      console.log(`   Essay Worthiness: ${analysis.narrativePotential.essayWorthiness}`);
      console.log(`   Emotional Resonance: ${analysis.narrativePotential.emotionalResonance}`);
      console.log(`   Growth Arc: ${analysis.narrativePotential.growthArc}`);
      if (analysis.narrativePotential.uniqueAngles?.length) {
        console.log(`   Unique Story Angles:`);
        analysis.narrativePotential.uniqueAngles.forEach(a => console.log(`     • ${a}`));
      }

      console.log('\nSCHOOL FIT:');
      if (analysis.schoolFit.bestFitSchoolTypes?.length) {
        console.log(`   Best Fit School Types: ${analysis.schoolFit.bestFitSchoolTypes.join(', ')}`);
      }
      if (analysis.schoolFit.alignedValues?.length) {
        console.log(`   Aligned Values: ${analysis.schoolFit.alignedValues.join(', ')}`);
      }
      if (analysis.schoolFit.potentialConcerns?.length) {
        console.log(`   Potential Concerns:`);
        analysis.schoolFit.potentialConcerns.forEach(c => console.log(`     • ${c}`));
      }

      // ======================================================================
      // STAGE 3: TEACHING (Sonnet - How to Improve)
      // ======================================================================
      printSubSection('STAGE 3: TEACHING (Sonnet - How to Improve)');
      console.log('Purpose: Actionable guidance with before/after examples\n');

      // Create a minimal portfolio analysis for teaching
      const minimalPortfolioAnalysis = {
        activities: { [activity.id]: analysis },
        tierDistribution: {
          tier1: analysis.classification.tier === 1 ? 1 : 0,
          tier2: analysis.classification.tier === 2 ? 1 : 0,
          tier3: analysis.classification.tier === 3 ? 1 : 0,
          tier4: analysis.classification.tier === 4 ? 1 : 0,
          portfolioTier: analysis.classification.tier,
          tierRationale: 'Single activity analysis',
        },
        spikeAnalysis: {
          hasSpike: false,
          spikeStrength: 'none' as const,
          spikeActivities: [],
          spikeEvidence: [],
          spikeAuthenticity: 50,
          spikeNarrative: 'N/A',
          spikeDevelopmentStage: 'absent' as const,
        },
        coherenceAnalysis: {
          score: 50,
          assessment: 'moderate' as const,
          primaryTheme: 'N/A',
          secondaryThemes: [],
          thematicConnections: [],
          disconnectedActivities: [],
          narrativeThread: 'N/A',
        },
        depthBreadthProfile: {
          profile: 'balanced' as const,
          depthScore: 50,
          breadthScore: 50,
          optimalBalance: 'N/A',
        },
        hiddenGems: {
          undersoldActivities: [],
          workFamilyContributions: { present: false, activities: [], value: '' },
          constrainedExcellence: { present: false, context: '', activities: [] },
        },
        competitiveAssessment: {
          overallStrength: 'competitive' as const,
          strengthAreas: [],
          weaknessAreas: [],
          differentiators: [],
          commonalities: [],
          competitiveEdge: 'N/A',
        },
        gapsIdentified: [],
        commonAppReadiness: {
          readyForSubmission: false,
          activitiesCount: 1,
          topActivitiesIdentified: [activity.id],
          orderingRecommendation: [activity.id],
          descriptionReadiness: [{ activityId: activity.id, ready: false, issues: [] }],
        },
        analysisConfidence: {
          overallConfidence: 70,
          dataQuality: 70,
          classificationConfidence: 70,
          spikeConfidence: 50,
          factors: [],
        },
      };

      const teaching = await activityTeachingService.teachActivity(
        activity,
        analysis,
        minimalPortfolioAnalysis,
        studentContext
      );

      console.log('TIER EXPLANATION:');
      console.log(`   Assigned Tier: ${teaching.tierExplanation.assignedTier}`);
      console.log(`   Explanation: ${teaching.tierExplanation.explanation.text}`);
      if (teaching.tierExplanation.explanation.citations?.length) {
        console.log(`   Citations: ${teaching.tierExplanation.explanation.citations.map(c => c.source).join(', ')}`);
      }
      console.log(`   What Makes This Tier: ${teaching.tierExplanation.whatMakesThisTier.text}`);
      console.log(`   What Would Change It: ${teaching.tierExplanation.whatWouldChangeIt.text}`);

      if (teaching.tierExplanation.benchmarksUsed?.length) {
        console.log('\nBENCHMARKS USED:');
        teaching.tierExplanation.benchmarksUsed.forEach(b => {
          console.log(`   [Tier ${b.tier}] ${b.benchmark}`);
          console.log(`     Source: ${b.source}`);
          console.log(`     Student Meets: ${b.studentMeets ? '✅ Yes' : '❌ No'}`);
          if (b.gap) console.log(`     Gap: ${b.gap}`);
        });
      }

      if (teaching.strengthTeaching?.length) {
        console.log('\nSTRENGTH TEACHING:');
        teaching.strengthTeaching.forEach((s, i) => {
          console.log(`   ${i + 1}. ${s.strength}`);
          console.log(`      Why It Matters: ${s.whyItMatters.text}`);
          console.log(`      How to Leverage: ${s.howToLeverage}`);
          console.log(`      In Applications: ${s.inApplications}`);
        });
      }

      if (teaching.improvementTeaching?.length) {
        console.log('\nIMPROVEMENT TEACHING:');
        teaching.improvementTeaching.forEach((i, idx) => {
          console.log(`   ${idx + 1}. [${i.priority.toUpperCase()}] ${i.issue}`);
          console.log(`      Why It Matters: ${i.whyItMatters.text}`);
          console.log(`      How to Fix: ${i.howToFix}`);
          console.log(`      Before: "${i.exampleBefore}"`);
          console.log(`      After:  "${i.exampleAfter}"`);
        });
      }

      if (teaching.upgradePathway) {
        console.log('\nUPGRADE PATHWAY:');
        console.log(`   Current Tier: ${teaching.upgradePathway.currentTier} → Target: ${teaching.upgradePathway.targetTier}`);
        console.log(`   Feasibility: ${teaching.upgradePathway.feasibility}`);
        console.log(`   Time Required: ${teaching.upgradePathway.timeRequired}`);

        if (teaching.upgradePathway.steps?.length) {
          console.log('\n   STEPS:');
          teaching.upgradePathway.steps.forEach(s => {
            console.log(`     Step ${s.step}: ${s.action}`);
            console.log(`       Rationale: ${s.rationale.text}`);
            console.log(`       Milestone: ${s.milestone}`);
            console.log(`       Timeframe: ${s.timeframe}`);
            if (s.resources?.length) {
              console.log(`       Resources: ${s.resources.join(', ')}`);
            }
          });
        }

        if (teaching.upgradePathway.successIndicators?.length) {
          console.log('\n   SUCCESS INDICATORS:');
          teaching.upgradePathway.successIndicators.forEach(i => console.log(`     • ${i}`));
        }

        if (teaching.upgradePathway.risks?.length) {
          console.log('\n   RISKS:');
          teaching.upgradePathway.risks.forEach(r => console.log(`     • ${r}`));
        }
      }

      console.log('\nDESCRIPTION OPTIMIZATION:');
      console.log(`   Original (${activity.description.length} chars):`);
      console.log(`     "${activity.description}"`);
      console.log(`   Optimized (${teaching.descriptionOptimization.characterCount} chars):`);
      console.log(`     "${teaching.descriptionOptimization.optimizedDescription}"`);

      if (teaching.descriptionOptimization.changesExplained?.length) {
        console.log('\n   CHANGES MADE:');
        teaching.descriptionOptimization.changesExplained.forEach(c => {
          console.log(`     • ${c.change}`);
          console.log(`       Reason: ${c.reason}`);
        });
      }

      if (teaching.descriptionOptimization.alternativeVersions?.length) {
        console.log('\n   ALTERNATIVE VERSIONS:');
        teaching.descriptionOptimization.alternativeVersions.forEach((v, i) => {
          console.log(`     ${i + 1}. "${v}"`);
        });
      }

      console.log('\nNARRATIVE GUIDANCE:');
      console.log(`   How to Talk About This: ${teaching.narrativeGuidance.howToTalkAboutThis.text}`);
      console.log(`   Unique Angle: ${teaching.narrativeGuidance.uniqueAngle}`);
      console.log(`   Connection to Story: ${teaching.narrativeGuidance.connectionToStory}`);

      if (teaching.narrativeGuidance.interviewTips?.length) {
        console.log('\n   INTERVIEW TIPS:');
        teaching.narrativeGuidance.interviewTips.forEach(t => console.log(`     • ${t}`));
      }

      if (teaching.narrativeGuidance.essayPotential) {
        console.log('\n   ESSAY POTENTIAL:');
        console.log(`     Viable: ${teaching.narrativeGuidance.essayPotential.viable ? '✅ Yes' : '❌ No'}`);
        console.log(`     Angle: ${teaching.narrativeGuidance.essayPotential.angle}`);
        if (teaching.narrativeGuidance.essayPotential.cautionAreas?.length) {
          console.log(`     Caution Areas:`);
          teaching.narrativeGuidance.essayPotential.cautionAreas.forEach(c => console.log(`       • ${c}`));
        }
      }

    } catch (error: any) {
      console.error(`❌ Analysis/Teaching failed: ${error.message}`);
      if (error.stack) {
        console.error(error.stack.split('\n').slice(0, 5).join('\n'));
      }
    }

    console.log('\n');
  }

  // Summary
  printSection('SUMMARY');
  console.log('\nThe analysis engine provides three layers of insight:\n');
  console.log('1. DIAGNOSIS (Haiku, ~$0.01/activity)');
  console.log('   - Fast tier classification with confidence');
  console.log('   - Red/green flag detection');
  console.log('   - Description quality scoring');
  console.log('   - Database matching for known achievements\n');

  console.log('2. DEEP ANALYSIS (Sonnet, ~$0.10/activity)');
  console.log('   - Comprehensive classification with reasoning');
  console.log('   - Recognition authenticity scoring');
  console.log('   - Leadership quality assessment');
  console.log('   - Impact quantification and narrative');
  console.log('   - Time investment progression');
  console.log('   - Narrative potential for essays');
  console.log('   - School fit assessment\n');

  console.log('3. TEACHING (Sonnet, ~$0.10/activity)');
  console.log('   - Cited tier explanations with benchmarks');
  console.log('   - Strength leverage strategies');
  console.log('   - Improvement prescriptions with before/after');
  console.log('   - Upgrade pathways with steps and milestones');
  console.log('   - Description optimization (150-char Common App ready)');
  console.log('   - Narrative guidance for interviews/essays\n');

  console.log('Total cost per activity: ~$0.21');
  console.log('Total cost for 10 activities: ~$2.10');
  console.log('\nThis feeds into the Conversational Advisor for workshopping.\n');
}

main().catch(console.error);
