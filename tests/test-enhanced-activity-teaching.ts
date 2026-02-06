/**
 * Enhanced Activity Teaching Pipeline Test
 *
 * Demonstrates the full depth of the enhanced teaching system,
 * following the PIQ Workshop pattern with:
 * - THE PROBLEM: Why issues matter
 * - WHY THIS WORKS: Psychology and research
 * - WHAT DETAILS TO PRIORITIZE: Key elements
 * - BEFORE/AFTER EXAMPLES: Concrete transformations
 */

import * as dotenv from 'dotenv';
dotenv.config();  // Must be BEFORE other imports that use API key
import { ActivityDiagnosisService } from '../src/services/portfolioStrategy/services/activityWorkshop/activityDiagnosisService';
import { ActivityAnalysisService } from '../src/services/portfolioStrategy/services/activityWorkshop/activityAnalysisService';
import { EnhancedActivityTeachingService, EnhancedActivityTeaching, EnhancedIssueTeaching } from '../src/services/portfolioStrategy/services/activityWorkshop/enhancedActivityTeachingService';
import { ActivityWorkshopInput, ActivityWorkshopSessionInput, PortfolioAnalysis } from '../src/services/portfolioStrategy/services/activityWorkshop/types';

// ============================================================================
// TEST DATA
// ============================================================================

const testActivities: ActivityWorkshopInput[] = [
  {
    id: 'debate-1',
    title: 'Varsity Debate Team',
    category: 'academic_competition',
    description: 'Helped with debate stuff and won some tournaments.',
    organization: 'School Debate Team',
    role: 'Member',
    hoursPerWeek: 10,
    weeksPerYear: 36,
    yearsInvolved: 3,
    gradeLevels: [10, 11, 12],
    isPaid: false,
    achievements: [],
  },
  {
    id: 'research-1',
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
      { title: 'JSHS State Competition', level: 'state' },
      { title: 'Co-authored paper submitted', level: 'national' },
    ],
  },
  {
    id: 'tutoring-1',
    title: 'Math Tutoring Program Founder',
    category: 'community_service',
    description: 'Started a free tutoring program for underserved middle school students.',
    organization: 'Self-Founded',
    role: 'Founder & Lead Tutor',
    hoursPerWeek: 5,
    weeksPerYear: 40,
    yearsInvolved: 2,
    gradeLevels: [10, 11],
    isPaid: false,
    achievements: [],
  },
];

const studentContext: ActivityWorkshopSessionInput['studentContext'] = {
  intendedMajor: 'Biomedical Engineering',
  targetSchools: ['MIT', 'Stanford', 'Duke'],
  gradeLevel: 12,
};

// ============================================================================
// OUTPUT FORMATTERS
// ============================================================================

function formatDivider(title: string, width: number = 80): void {
  const line = '═'.repeat(width);
  console.log(`\n${line}`);
  console.log(`  ${title}`);
  console.log(`${line}\n`);
}

function formatSubDivider(title: string, width: number = 60): void {
  const line = '─'.repeat(width);
  console.log(`\n${line}`);
  console.log(`  ${title}`);
  console.log(`${line}\n`);
}

function formatIssueTeaching(issue: EnhancedIssueTeaching, index: number): void {
  console.log(`\n┌${'─'.repeat(70)}┐`);
  console.log(`│ ISSUE ${index + 1}: ${issue.issueType.toUpperCase().replace(/_/g, ' ').padEnd(53)}│`);
  console.log(`└${'─'.repeat(70)}┘\n`);

  // THE PROBLEM
  console.log('📌 THE PROBLEM:');
  console.log(`   ┌${'─'.repeat(65)}┐`);
  console.log(`   │ ${issue.theProblem.headline.slice(0, 63).padEnd(63)} │`);
  console.log(`   └${'─'.repeat(65)}┘`);
  console.log(`\n   ${issue.theProblem.explanation}\n`);
  console.log(`   💭 ADMISSIONS IMPACT: ${issue.theProblem.admissionsImpact}\n`);
  console.log(`   🔍 IN YOUR DESCRIPTION: ${issue.theProblem.inYourDescription}\n`);

  // WHY THIS WORKS
  console.log('🧠 WHY THIS WORKS:');
  console.log(`   Psychology: ${issue.whyThisWorks.psychology}\n`);
  console.log(`   Research: ${issue.whyThisWorks.researchInsight}\n`);
  if (issue.whyThisWorks.admissionsQuote) {
    console.log(`   💬 "${issue.whyThisWorks.admissionsQuote}"`);
    console.log(`      — ${issue.whyThisWorks.quoteSource}\n`);
  }

  // WHAT TO DO
  console.log('✅ WHAT TO DO:');
  console.log(`   Principle: ${issue.whatToDo.principle}\n`);
  console.log('   Steps:');
  issue.whatToDo.steps.forEach((step, i) => {
    console.log(`     ${i + 1}. ${step}`);
  });
  console.log('');

  // TRANSFORMATION EXAMPLES
  console.log('📝 TRANSFORMATION EXAMPLES:\n');

  console.log('   YOUR TEXT:');
  console.log(`   ❌ Before: "${issue.transformationExamples.yourText.before}"`);
  console.log(`   ✅ After:  "${issue.transformationExamples.yourText.after}"`);
  console.log(`   📘 Principle: ${issue.transformationExamples.yourText.principle}`);
  console.log(`   💡 Why it works: ${issue.transformationExamples.yourText.whyItWorks}\n`);

  if (issue.transformationExamples.similarExamples.length > 0) {
    console.log('   SIMILAR EXAMPLES:');
    issue.transformationExamples.similarExamples.forEach((ex, i) => {
      console.log(`\n   Example ${i + 1} (${ex.context}):`);
      console.log(`   ❌ Before: "${ex.before}"`);
      console.log(`   ✅ After:  "${ex.after}"`);
      console.log(`   📘 Key change: ${ex.highlightedChange}`);
      console.log(`   💡 Why it works: ${ex.whyItWorks}`);
    });
  }

  console.log(`\n   ⏱️  Difficulty: ${issue.difficulty} | Time to fix: ${issue.timeToFix} | Priority: ${issue.priority}`);
}

function formatEnhancedTeaching(teaching: EnhancedActivityTeaching, activity: ActivityWorkshopInput): void {
  formatDivider(`ACTIVITY: ${activity.title}`);

  // Input Summary
  console.log('📋 INPUT:');
  console.log(`   Title: ${activity.title}`);
  console.log(`   Category: ${activity.category}`);
  console.log(`   Description: "${activity.description.slice(0, 100)}${activity.description.length > 100 ? '...' : ''}"`);
  console.log(`   Time: ${activity.hoursPerWeek}h/week × ${activity.weeksPerYear} weeks × ${activity.yearsInvolved} years`);
  console.log(`   Role: ${activity.role}`);
  if (activity.achievements && activity.achievements.length > 0) {
    console.log(`   Achievements: ${activity.achievements.map(a => `${a.title} (${a.level})`).join(', ')}`);
  }

  // Tier Explanation
  formatSubDivider('TIER CLASSIFICATION');
  console.log(`🏆 TIER ${teaching.tierExplanation.assignedTier}`);
  console.log(`\n   📌 ${teaching.tierExplanation.headline}\n`);
  console.log(`   ${teaching.tierExplanation.fullExplanation.text}\n`);
  console.log(`   📖 WHAT THIS TIER MEANS:`);
  console.log(`   ${teaching.tierExplanation.whatThisTierMeans}\n`);
  console.log(`   📈 TO REACH A HIGHER TIER:`);
  console.log(`   ${teaching.tierExplanation.whatHigherTierLooksLike}\n`);

  if (teaching.tierExplanation.saraHarbersonCriteria.length > 0) {
    console.log('   📊 SARA HARBERSON CRITERIA:');
    teaching.tierExplanation.saraHarbersonCriteria.forEach(c => {
      const status = c.studentMeets ? '✅' : '❌';
      console.log(`   ${status} ${c.criterion}`);
      console.log(`      ${c.evidence}`);
    });
  }

  // Detail Priorities
  formatSubDivider('WHAT DETAILS TO PRIORITIZE');
  console.log(`🎯 ${teaching.detailPriorities.whatAdmissionersLookFor}\n`);

  if (teaching.detailPriorities.criticalDetails.length > 0) {
    console.log('   🔴 CRITICAL DETAILS (Must Include):');
    teaching.detailPriorities.criticalDetails.forEach(d => {
      console.log(`   • ${d.detail}`);
      console.log(`     Why: ${d.whyItMatters}`);
      console.log(`     Example: ${d.example}`);
    });
    console.log('');
  }

  if (teaching.detailPriorities.valuableDetails.length > 0) {
    console.log('   🟡 VALUABLE DETAILS (Nice to Have):');
    teaching.detailPriorities.valuableDetails.forEach(d => {
      console.log(`   • ${d.detail}`);
    });
    console.log('');
  }

  if (teaching.detailPriorities.avoidThese.length > 0) {
    console.log('   🚫 AVOID THESE:');
    teaching.detailPriorities.avoidThese.forEach(a => {
      console.log(`   • ${a}`);
    });
  }

  // Issue Teaching (PIQ-style)
  formatSubDivider('ISSUE-SPECIFIC TEACHING');
  teaching.issueTeaching.forEach((issue, i) => {
    formatIssueTeaching(issue, i);
  });

  // Description Transformation
  formatSubDivider('DESCRIPTION TRANSFORMATION');
  console.log('📝 ORIGINAL:');
  console.log(`   "${teaching.descriptionTransformation.original}"\n`);

  if (teaching.descriptionTransformation.problems.length > 0) {
    console.log('❌ PROBLEMS IDENTIFIED:');
    teaching.descriptionTransformation.problems.forEach(p => {
      console.log(`   • ${p.issue} (${p.location})`);
      console.log(`     Impact: ${p.impact}`);
    });
    console.log('');
  }

  console.log('✅ OPTIMIZED VERSION:');
  console.log(`   "${teaching.descriptionTransformation.optimized.version}"`);
  console.log(`   [${teaching.descriptionTransformation.optimized.characterCount} characters]\n`);

  if (teaching.descriptionTransformation.optimized.changesExplained.length > 0) {
    console.log('📘 CHANGES EXPLAINED:');
    teaching.descriptionTransformation.optimized.changesExplained.forEach(c => {
      console.log(`   • ${c.change}`);
      console.log(`     Principle: ${c.principle}`);
      console.log(`     Why better: ${c.whyBetter}`);
    });
    console.log('');
  }

  if (teaching.descriptionTransformation.alternatives.length > 0) {
    console.log('📋 ALTERNATIVE VERSIONS:');
    teaching.descriptionTransformation.alternatives.forEach((alt, i) => {
      console.log(`\n   Version ${i + 2} (${alt.emphasis}):`);
      console.log(`   "${alt.version}"`);
      console.log(`   [${alt.characterCount} characters]`);
    });
  }

  // Narrative Guidance
  formatSubDivider('NARRATIVE & PRESENTATION GUIDANCE');
  console.log('🎤 HOW TO TALK ABOUT THIS:');
  console.log(`   ${teaching.narrativeGuidance.howToTalkAboutThis.text}\n`);

  console.log('✨ UNIQUE ANGLE:');
  console.log(`   ${teaching.narrativeGuidance.uniqueAngle.angle}`);
  console.log(`   Why it stands out: ${teaching.narrativeGuidance.uniqueAngle.whyThisStandsOut}\n`);

  console.log('🔗 CONNECTION TO STORY:');
  console.log(`   ${teaching.narrativeGuidance.connectionToStory}\n`);

  console.log('🎙️ INTERVIEW GUIDANCE:');
  console.log('   Likely questions:');
  teaching.narrativeGuidance.interviewGuidance.likelyQuestions.forEach(q => {
    console.log(`   • ${q}`);
  });
  console.log('\n   Response framework:');
  console.log(`   Opening: ${teaching.narrativeGuidance.interviewGuidance.responseFramework.opening}`);
  console.log('   Middle points:');
  teaching.narrativeGuidance.interviewGuidance.responseFramework.middlePoints.forEach(p => {
    console.log(`   • ${p}`);
  });
  console.log(`   Closing: ${teaching.narrativeGuidance.interviewGuidance.responseFramework.closing}\n`);

  console.log('   Pitfalls to avoid:');
  teaching.narrativeGuidance.interviewGuidance.pitfallsToAvoid.forEach(p => {
    console.log(`   ⚠️ ${p}`);
  });

  console.log('\n📝 ESSAY POTENTIAL:');
  const essayStatus = teaching.narrativeGuidance.essayPotential.recommended ? '✅ RECOMMENDED' : '⚠️ CONSIDER CAREFULLY';
  console.log(`   ${essayStatus} (Strength: ${teaching.narrativeGuidance.essayPotential.strength})`);
  console.log(`   Angle: ${teaching.narrativeGuidance.essayPotential.angle}`);
  console.log(`   Why: ${teaching.narrativeGuidance.essayPotential.whyThisWorks}`);
  if (teaching.narrativeGuidance.essayPotential.cautionAreas.length > 0) {
    console.log('   Caution areas:');
    teaching.narrativeGuidance.essayPotential.cautionAreas.forEach(c => {
      console.log(`   ⚠️ ${c}`);
    });
  }

  // Upgrade Pathway
  if (teaching.upgradePathway) {
    formatSubDivider('UPGRADE PATHWAY');
    console.log(`📈 From Tier ${teaching.upgradePathway.currentTier} → Tier ${teaching.upgradePathway.targetTier}`);
    console.log(`   Feasibility: ${teaching.upgradePathway.feasibility}`);
    console.log(`   Time required: ${teaching.upgradePathway.timeRequired}\n`);

    console.log('   STEPS:');
    teaching.upgradePathway.steps.forEach(s => {
      console.log(`\n   Step ${s.step}: ${s.action}`);
      console.log(`   • Rationale: ${s.rationale}`);
      console.log(`   • Milestone: ${s.milestone}`);
      console.log(`   • Timeframe: ${s.timeframe}`);
      if (s.resources && s.resources.length > 0) {
        console.log(`   • Resources: ${s.resources.join(', ')}`);
      }
    });

    console.log('\n   SUCCESS INDICATORS:');
    teaching.upgradePathway.successIndicators.forEach(i => {
      console.log(`   ✅ ${i}`);
    });

    console.log('\n   RISKS:');
    teaching.upgradePathway.risks.forEach(r => {
      console.log(`   ⚠️ ${r}`);
    });
  }

  console.log('\n');
}

// ============================================================================
// MAIN TEST
// ============================================================================

async function main() {
  console.log(`
${'═'.repeat(80)}
  ENHANCED ACTIVITY TEACHING PIPELINE - FULL OUTPUT DEMO
${'═'.repeat(80)}

This test demonstrates the enhanced teaching system following the PIQ Workshop
pattern with deep, research-backed feedback.

THE PROBLEM → WHY THIS WORKS → WHAT TO DO → EXAMPLES

`);

  // Verify API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ Missing ANTHROPIC_API_KEY environment variable');
    process.exit(1);
  }
  console.log('=== API KEY VERIFICATION ===');
  console.log(`Key present: ${!!apiKey}`);
  console.log(`Key length: ${apiKey.length}`);
  console.log('✅ API verification: OK\n');

  // Initialize services
  const diagnosisService = new ActivityDiagnosisService();
  const analysisService = new ActivityAnalysisService();
  const enhancedTeachingService = new EnhancedActivityTeachingService();

  // Create minimal portfolio analysis for context
  const portfolioAnalysis: PortfolioAnalysis = {
    activities: {},
    tierDistribution: { tier1: 0, tier2: 1, tier3: 1, tier4: 1 },
    spikeAnalysis: {
      hasSpike: false,
      spikeType: null,
      spikeStrength: null,
      spikeActivities: [],
      spikeNarrative: 'Developing spike in research/STEM',
    },
    coherenceAnalysis: {
      score: 65,
      assessment: 'moderate',
      connectedThemes: ['STEM', 'Leadership'],
      disconnectedActivities: [],
      strengtheningSuggestions: [],
    },
    competitiveAssessment: {
      overallTier: 'competitive',
      harvardScale: 3,
      strengthAreas: ['Research'],
      weaknessAreas: ['Description quality'],
      standoutPotential: 'medium',
    },
    gapsIdentified: [],
    hiddenGems: [],
    commonAppReadiness: {
      score: 70,
      issues: [],
      orderingRecommendation: testActivities.map(a => a.id),
    },
  };

  // Process each activity
  for (const activity of testActivities) {
    try {
      // Step 1: Diagnosis
      console.log(`\n🔄 Processing: ${activity.title}`);
      console.log('   Stage 1: Diagnosis (Haiku)...');
      const diagnosis = await diagnosisService.diagnoseActivity(activity, 'Not specified');

      // Step 2: Analysis
      console.log('   Stage 2: Deep Analysis (Sonnet)...');
      const analysis = await analysisService.analyzeActivity(
        activity,
        diagnosis,
        portfolioAnalysis,
        studentContext
      );
      portfolioAnalysis.activities[activity.id] = analysis;

      // Step 3: Enhanced Teaching
      console.log('   Stage 3: Enhanced Teaching (Sonnet)...');
      const teaching = await enhancedTeachingService.teachActivity(
        activity,
        analysis,
        portfolioAnalysis,
        studentContext
      );

      // Display full teaching output
      formatEnhancedTeaching(teaching, activity);

    } catch (error: any) {
      console.error(`❌ Error processing ${activity.title}:`, error.message);
    }
  }

  console.log(`
${'═'.repeat(80)}
  END OF ENHANCED TEACHING DEMO
${'═'.repeat(80)}

This demonstrates the enhanced teaching output with:
✅ THE PROBLEM - Why each issue matters for admissions
✅ WHY THIS WORKS - Psychology and research behind fixes
✅ WHAT DETAILS TO PRIORITIZE - Critical vs nice-to-have details
✅ MULTIPLE BEFORE/AFTER EXAMPLES - Concrete transformations
✅ NARRATIVE GUIDANCE - How to talk about activities
✅ INTERVIEW PREPARATION - Likely questions and frameworks
✅ ESSAY POTENTIAL - Whether to use for essays

The teaching is personalized to each activity while drawing from the
research-backed knowledge base.
`);
}

main().catch(console.error);
