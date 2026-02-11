/**
 * Generate and print the full Deep Academic Report in markdown format.
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/generate-deep-report-output.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { generateDeepAcademicReport } from '../src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReport';
import type { DeepAcademicReportInput } from '../src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReportTypes';
import type { NuancedCapabilityAnalysis } from '../src/services/portfolioStrategy/services/academicWorkshop/capability/nuancedCapabilityAnalyzer';

// Same mock as the test
function makeSubjectPattern(
  avgGPA: number,
  trend: 'improving' | 'stable' | 'declining',
  strength: number,
  courses: Array<{ name: string; grade: number; level: string; year: number }>
) {
  return {
    performanceHistory: {
      avgGPA, trend,
      bestGrade: Math.max(...courses.map(c => c.grade)),
      worstGrade: Math.min(...courses.map(c => c.grade)),
      courses: courses.map(c => ({ name: c.name, level: c.level, grade: c.grade, year: c.year })),
    },
    byDifficulty: {
      ap_ib: { avgGPA, courses: courses.filter(c => c.level === 'ap').map(c => c.name) },
      honors: { avgGPA: avgGPA + 0.2, courses: courses.filter(c => c.level === 'honors').map(c => c.name) },
      regular: { avgGPA: avgGPA + 0.4, courses: [] },
    },
    relativeStrength: strength,
    strengthAssessment: strength > 0.1 ? 'relative strength' : strength < -0.1 ? 'relative challenge' : 'average',
    recommendedLevel: 'ap_ib' as const,
    levelReasoning: 'Based on demonstrated performance',
    projectedOutcome: { expectedGrade: avgGPA >= 3.7 ? 'A-' : avgGPA >= 3.3 ? 'B+' : 'B', confidence: 0.75, reasoning: 'Historical performance' },
  };
}

const mockAnalysis = {
  performanceFingerprint: {
    expectedGPAByLevel: {
      ap_ib: { expectedGPA: 3.52, range: { low: 3.0, high: 4.0 }, confidence: 0.82, sampleSize: 6, trend: 'stable' },
      honors: { expectedGPA: 3.77, range: { low: 3.5, high: 4.0 }, confidence: 0.88, sampleSize: 4, trend: 'stable' },
      regular: null,
    },
    sweetSpot: { level: 'ap_ib', expectedGPA: 3.52, confidence: 0.82, reasoning: 'Demonstrated B+/A- at AP level' },
    consistencyScore: 73, difficultySensitivity: 'moderate', difficultySensitivityDetail: 'Grades drop ~0.25 points when moving up',
    performancePercentile: 78,
  },
  subjectPatterns: {
    math: makeSubjectPattern(3.77, 'stable', 0.35, [
      { name: 'AP Calculus BC', grade: 3.7, level: 'ap', year: 2024 },
      { name: 'AP Statistics', grade: 3.3, level: 'ap', year: 2024 },
      { name: 'Precalculus Honors', grade: 3.9, level: 'honors', year: 2023 },
    ]),
    science: makeSubjectPattern(3.43, 'stable', 0.05, [
      { name: 'AP Physics C: Mechanics', grade: 3.3, level: 'ap', year: 2024 },
      { name: 'AP Chemistry', grade: 3.0, level: 'ap', year: 2023 },
      { name: 'Chemistry Honors', grade: 3.7, level: 'honors', year: 2023 },
    ]),
    english: makeSubjectPattern(3.70, 'stable', 0.15, [
      { name: 'AP English Language', grade: 3.7, level: 'ap', year: 2024 },
      { name: 'English 10 Honors', grade: 3.9, level: 'honors', year: 2023 },
    ]),
    social_studies: makeSubjectPattern(3.50, 'stable', -0.10, [
      { name: 'AP US History', grade: 3.3, level: 'ap', year: 2024 },
      { name: 'World History Honors', grade: 3.7, level: 'honors', year: 2023 },
    ]),
    computer_science: makeSubjectPattern(3.90, 'stable', 0.40, [
      { name: 'AP Computer Science A', grade: 4.0, level: 'ap', year: 2024 },
    ]),
  },
  challengeResponse: {
    transitionAnalysis: {
      observedTransitions: [
        { subject: 'Math', from: 'Honors', to: 'AP', gradeBefore: 3.9, gradeAfter: 3.5, year: '2024', outcome: 'adapted' },
        { subject: 'Science', from: 'Honors', to: 'AP', gradeBefore: 3.7, gradeAfter: 3.15, year: '2024', outcome: 'adapted' },
        { subject: 'English', from: 'Honors', to: 'AP', gradeBefore: 3.9, gradeAfter: 3.7, year: '2024', outcome: 'thrived' },
      ],
      typicalImpact: -0.37, adaptationSpeed: 'gradual', recoveryPattern: 'partial_recovery',
    },
    challengeRiskProfile: {
      riskLevel: 38,
      riskFactors: ['Moderate grade drops when moving up difficulty'],
      protectiveFactors: ['Strong math/CS foundation', 'Improving trajectory', 'Thrives in English at AP level'],
      recommendation: 'Can take on additional challenge in strength areas',
    },
    successConditions: ['Increase difficulty in Math, CS, English'],
    warningIndicators: ['Grade dropping below B in any AP'],
  },
  progressionTrajectory: {
    historical: {
      gpaByYear: [{ year: 'Sophomore', gpa: 3.60, rigorLevel: 1.8 }, { year: 'Junior', gpa: 3.58, rigorLevel: 2.6 }],
      overallTrend: 'stable', trendStrength: 65,
      inflectionPoints: [{ year: 'Junior', event: 'Rigor jumped from 1.8 to 2.6', impact: 'positive', description: 'Maintained GPA while nearly doubling rigor' }],
    },
    projected: { nextYearGPA: { expected: 3.65, range: { low: 3.45, high: 3.80 } }, ceilingEstimate: 3.90, trajectory: 'upward', confidence: 0.75 },
    trajectoryLevers: [{ lever: 'Add AP in strength area', impact: 'positive', magnitude: 'moderate', description: 'CS or Math AP would boost GPA' }],
  },
  performanceEnvelope: {
    ceiling: { gpa: 3.90, conditions: 'AP course in strongest subject (CS)', isRepeatable: true, howToReach: 'Take courses aligned with strengths' },
    floor: { gpa: 3.00, conditions: 'Challenging AP in non-strength subject', warningSignsThatPrecedeIt: ['Low interest'], howToAvoid: 'Avoid stacking weak subjects' },
    comfortableRange: { low: 3.30, high: 3.70, typicalGPA: 3.55, description: 'B+ to A-' },
    optimalTarget: { gpa: 3.65, reasoning: 'Based on sweet spot', tradeoffs: 'Maintaining AP rigor may mean B+ in some courses' },
  },
  synthesis: {
    profileSummary: 'Your optimal difficulty level is AP/IB courses, where you can expect B+/A- grades. Your performance has been improving over time.',
    strengths: [
      { insight: 'Strong in Computer Science', evidence: 'A in AP CSA, your highest AP grade', implication: 'Push yourself here' },
      { insight: 'Strong in Mathematics', evidence: '3.77 average, 35% above overall', implication: 'Continue at AP level' },
      { insight: 'Consistent performance', evidence: '73% consistency score', implication: 'You can predict outcomes' },
      { insight: 'Thrives under increased challenge in English', evidence: 'AP English Language with only 0.2 GPA drop', implication: 'AP English Lit is strong candidate' },
    ],
    challenges: [
      { insight: 'Moderate difficulty sensitivity in Science', evidence: '0.55 GPA drop from Chem Honors to AP Chem', implication: 'Be strategic about AP Science' },
      { insight: 'Past difficulty with Science level transitions', evidence: 'Struggled in Chemistry level transition', implication: 'Don\'t add AP Bio' },
    ],
    coreInsight: 'Balance challenge with success — sweet spot is AP/IB courses (B+/A-).',
    uniquePattern: 'Ability to maintain GPA while dramatically increasing rigor, strength in CS and Math.',
  },
} as unknown as NuancedCapabilityAnalysis;

async function main() {
  console.error('Generating deep academic report...');

  const input: DeepAcademicReportInput = {
    quantitativeAnalysis: mockAnalysis,
    intendedMajor: 'Computer Science',
    currentGrade: 11,
    schoolContext: { type: 'well_resourced_suburban', apCoursesAvailable: 15 },
  };

  const report = await generateDeepAcademicReport(input);

  // Print as markdown to stdout
  const md: string[] = [];

  md.push('# Deep Academic Analysis Report');
  md.push('');
  md.push('> **Student:** Sarah Chen, 11th Grade');
  md.push('> **School:** Well-resourced suburban public (15 APs available)');
  md.push('> **Intended Major:** Computer Science');
  md.push('');
  md.push('---');
  md.push('');

  // Bottom Line Summary
  md.push('## The Bottom Line');
  md.push('');
  md.push(`- **${report.bottomLine.rating}**`);
  md.push(`- **Position:** ${report.bottomLine.positioning}`);
  md.push(`- **Biggest Strength:** ${report.bottomLine.biggestStrength}`);
  md.push(`- **Biggest Risk:** ${report.bottomLine.biggestRisk}`);
  md.push(`- **${report.bottomLine.topAction}**`);
  md.push('');
  md.push('---');
  md.push('');

  // Section 1: Your Academic Profile (unified — grade + tier + identity + strengths + weaknesses)
  const tp = report.academicIdentity.tierPosition;
  const grade = report.academicIdentity.upliftRating.grade;

  md.push(`## Your Academic Profile`);
  md.push('');
  md.push(`**Your Uplift Grade: ${grade}** — ${tp.currentTier} Schools`);
  md.push(`> Schools like ${tp.tierExamples.slice(0, 4).join(', ')}`);
  md.push('');

  // Unified narrative (now includes tier and rating context woven in)
  md.push(report.academicIdentity.narrativeIdentity);
  md.push('');

  // Notable Strengths
  if (report.academicIdentity.notableStrengths.length > 0) {
    md.push('### What Makes Your Profile Stand Out');
    md.push('');
    for (const ns of report.academicIdentity.notableStrengths) {
      md.push(`**${ns.subject}:** ${ns.insight}`);
      md.push(`*${ns.majorRelevance}*`);
      md.push('');
    }
  }

  // Notable Weaknesses
  if (report.academicIdentity.notableWeaknesses.length > 0) {
    md.push('### Where You Need to Grow');
    md.push('');
    for (const nw of report.academicIdentity.notableWeaknesses) {
      md.push(`**${nw.area}:** ${nw.gap}`);
      md.push(`*${nw.consequence}*`);
      md.push('');
    }
  }

  // Your College Tier Position (detailed tier analysis)
  md.push('### Your College Tier Position');
  md.push('');
  md.push(`**Current Tier: ${tp.currentTier}** — ${tp.tierExamples.join(', ')}`);
  md.push('');
  md.push(tp.gpaPosition);
  md.push('');
  if (tp.strengthTier) {
    md.push(`**Your Peak:** ${tp.strengthTier}`);
    md.push('');
  }
  if (tp.weaknessTier) {
    md.push(`**Your Floor:** ${tp.weaknessTier}`);
    md.push('');
  }
  md.push(`**Path to the Next Level:** ${tp.tierGap}`);
  md.push('');

  // Uplift Rating (detailed holistic assessment)
  md.push('### Your Uplift Rating');
  md.push('');
  md.push(`**Grade: ${grade}**`);
  md.push('');
  md.push(report.academicIdentity.upliftRating.explanation);
  md.push('');
  md.push('---');
  md.push('');

  // Section 2: Challenges & Admissions Reality (merged)
  md.push('## Section 2: Challenges & Admissions Reality');
  md.push('');
  md.push('### What Admissions Officers See First');
  md.push('');
  md.push(report.challengesAndReality.firstGlance);
  md.push('');
  for (const c of report.challengesAndReality.challenges) {
    md.push(`### ${c.title}`);
    md.push('');
    md.push(c.issue);
    md.push('');
    md.push(`**AO Impact:** ${c.aoImpact}`);
    md.push('');
    md.push(`**Tier Impact:** ${c.tierImpact}`);
    md.push('');
    md.push(`**Roadmap:** ${c.roadmapConnection}`);
    md.push('');
    if (c.researchBacking.length > 0) {
      md.push('**Research Backing:**');
      for (const r of c.researchBacking) {
        md.push(`- ${r.claim}: ${r.value} (${r.source})`);
      }
      md.push('');
    }
    md.push('---');
    md.push('');
  }

  md.push('### The Unintended Narrative');
  md.push('');
  md.push(report.challengesAndReality.unintendedNarrative);
  md.push('');
  md.push('### Taking Control of the Narrative');
  md.push('');
  md.push(report.challengesAndReality.narrativeControlStrategy);
  md.push('');
  md.push('---');
  md.push('');

  // Section 3: Strategic Roadmap
  md.push('## Section 3: Strategic Roadmap');
  md.push('');
  md.push('### Top Priorities');
  md.push('');
  for (const p of report.strategicRoadmap.priorities) {
    md.push(`**Priority ${p.priority}: ${p.title}** [${p.impact}]`);
    md.push('');
    md.push(p.description);
    md.push('');
    md.push('Action items:');
    for (const a of p.actionItems) {
      md.push(`- ${a}`);
    }
    md.push('');
  }

  md.push('### Course Strategy');
  md.push('');
  md.push(report.strategicRoadmap.courseStrategy.rationale);
  md.push('');
  md.push('**Recommended:**');
  md.push('');
  md.push('| Course | Rationale | Risk | Expected Outcome |');
  md.push('|--------|-----------|------|-----------------|');
  for (const c of report.strategicRoadmap.courseStrategy.recommended) {
    md.push(`| ${c.course} | ${c.rationale} | ${c.risk} | ${c.expectedOutcome} |`);
  }
  md.push('');

  if (report.strategicRoadmap.courseStrategy.avoid.length > 0) {
    md.push('**Avoid:**');
    md.push('');
    for (const a of report.strategicRoadmap.courseStrategy.avoid) {
      md.push(`- **${a.course}**: ${a.reason}`);
    }
    md.push('');
  }

  md.push(`### Major Alignment: ${report.strategicRoadmap.majorAlignment.score}/100`);
  md.push('');
  md.push(report.strategicRoadmap.majorAlignment.assessment);
  md.push('');
  if (report.strategicRoadmap.majorAlignment.missingPieces.length > 0) {
    md.push('**Missing:** ' + report.strategicRoadmap.majorAlignment.missingPieces.join(', '));
    md.push('');
  }
  if (report.strategicRoadmap.majorAlignment.strengthsToLeverage.length > 0) {
    md.push('**Strengths to leverage:** ' + report.strategicRoadmap.majorAlignment.strengthsToLeverage.join(', '));
    md.push('');
  }

  md.push('### Trajectory Optimization');
  md.push('');
  md.push(report.strategicRoadmap.trajectoryOptimization);
  md.push('');
  md.push('---');
  md.push('');

  // Section 4: Research Context
  md.push('## Section 4: Research Context');
  md.push('');
  md.push('### AP Course Statistics (Verified)');
  md.push('');
  md.push('| Course | Pass Rate | Five Rate | Your Grade | Source |');
  md.push('|--------|-----------|-----------|------------|--------|');
  for (const s of report.researchContext.apStatistics) {
    md.push(`| ${s.course} | ${s.passRate} | ${s.fiveRate} | ${s.studentGrade || '—'} | ${s.citation} |`);
  }
  md.push('');
  // Add student context notes
  const coursesWithContext = report.researchContext.apStatistics.filter(s => s.studentContext);
  if (coursesWithContext.length > 0) {
    for (const s of coursesWithContext) {
      md.push(`> **${s.course}:** ${s.studentContext}`);
    }
    md.push('');
  }

  if (report.researchContext.majorRequirements) {
    const mr = report.researchContext.majorRequirements;
    md.push(`### Major Requirements: ${mr.major}`);
    md.push('');
    md.push(`**Minimum:** ${mr.minimumCourses.join(', ')}`);
    md.push('');
    md.push(`**Competitive:** ${mr.competitiveCourses.join(', ')}`);
    md.push('');
    md.push(`**Beyond Courses:** ${mr.beyondCourses.join(', ')}`);
    md.push('');
  }

  md.push('### Admissions Factors');
  md.push('');
  md.push('| Factor | Importance | Source |');
  md.push('|--------|------------|--------|');
  for (const f of report.researchContext.admissionsFactors) {
    md.push(`| ${f.factor} | ${f.importance} | ${f.citation} |`);
  }
  md.push('');

  md.push('---');
  md.push('');
  md.push(`*Generated by DeepAcademicReportService (Claude Sonnet 4.5)*`);
  md.push(`*Cost: $${report.metadata.estimatedCost.toFixed(4)} | Time: ${(report.metadata.generationTimeMs / 1000).toFixed(1)}s | Tokens: ${report.metadata.tokenUsage.input} in, ${report.metadata.tokenUsage.output} out*`);
  md.push(`*All statistics from College Board 2024, NACAC 2023, and institutional Common Data Sets.*`);

  // Write to stdout
  console.log(md.join('\n'));
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
