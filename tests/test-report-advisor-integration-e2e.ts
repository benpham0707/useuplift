/**
 * Report → Conversational Advisor Integration E2E Test
 *
 * Demonstrates the full pipeline:
 * 1. Generate a deep academic report (or use cache)
 * 2. Feed report into the conversational advisor engine
 * 3. Show report topics appearing in the topic queue
 * 4. Run a few conversation turns with report-grounded coaching
 * 5. Show roadmap adjustments detected from student responses
 * 6. Output everything as a readable .md file
 *
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-report-advisor-integration-e2e.ts
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { generateDeepAcademicReport, getOrGenerateDeepAcademicReport } from '../src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReport';
import type { DeepAcademicReportInput, DeepAcademicReport } from '../src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReportTypes';
import { UPLIFT_SCALE_DATABASE } from '../src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReportTypes';
import type { NuancedCapabilityAnalysis } from '../src/services/portfolioStrategy/services/academicWorkshop/capability/nuancedCapabilityAnalyzer';

import {
  CapabilityConversationEngine,
  type ConversationEngineOptions,
  type InitializeResult,
  type ProcessTurnResult,
} from '../src/services/portfolioStrategy/services/academicWorkshop/capability/conversational/capabilityConversationEngine';

import { generateReportTopics } from '../src/services/portfolioStrategy/services/academicWorkshop/capability/conversational/topicDetector';
import { deepAcademicReportCache } from '../src/services/portfolioStrategy/utils/caching';

// ============================================================================
// MOCK DATA (same CS student profile from generate-deep-report-output.ts)
// ============================================================================

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

// Simulated student responses for the conversation
const studentMessages = [
  "Yeah, I definitely struggled more in AP Chemistry than I expected. The labs were fine but the theory was really hard. I think part of it was that my teacher wasn't great at explaining things, and I was trying to self-study a lot.",
  "I'm really interested in AP Computer Science Principles for next year. I loved AP CSA and I think it would help me feel even more prepared for college CS. But I'm a little worried about taking too many APs at once.",
  "I've been thinking about that actually. I might drop AP US History because I don't really need it for CS, and focus more on math and science. Would that be a good idea?",
];

// ============================================================================
// MAIN TEST
// ============================================================================

async function main() {
  const md: string[] = [];
  const startTime = Date.now();

  md.push('# Deep Report → Conversational Advisor Integration E2E');
  md.push('');
  md.push('> End-to-end demonstration of the integrated system: deep academic report feeding into');
  md.push('> the conversational advisor for context-rich, grounded coaching.');
  md.push('');
  md.push('---');
  md.push('');

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 1: Generate Deep Academic Report (with caching)
  // ──────────────────────────────────────────────────────────────────────────
  md.push('## Phase 1: Deep Academic Report Generation');
  md.push('');
  md.push('**Student Profile:** 11th Grade, Intended Major: Computer Science');
  md.push('**School:** Well-resourced suburban public (15 APs available)');
  md.push('');

  console.error('Phase 1: Generating deep academic report...');

  const reportInput: DeepAcademicReportInput = {
    quantitativeAnalysis: mockAnalysis,
    intendedMajor: 'Computer Science',
    currentGrade: 11,
    schoolContext: { type: 'well_resourced_suburban', apCoursesAvailable: 15 },
  };

  // First call — should be a cache miss
  const reportStartTime = Date.now();
  const report = await getOrGenerateDeepAcademicReport(reportInput);
  const reportTime = Date.now() - reportStartTime;

  // Second call — should be a cache hit
  const cacheStartTime = Date.now();
  const cachedReport = await getOrGenerateDeepAcademicReport(reportInput);
  const cacheTime = Date.now() - cacheStartTime;

  const cacheStats = deepAcademicReportCache.getStats();

  md.push('### Report Generation');
  md.push('');
  md.push(`| Metric | Value |`);
  md.push(`|--------|-------|`);
  md.push(`| First call (cache miss) | ${(reportTime / 1000).toFixed(1)}s |`);
  md.push(`| Second call (cache hit) | ${cacheTime}ms |`);
  md.push(`| Speedup | ${(reportTime / Math.max(cacheTime, 1)).toFixed(0)}x |`);
  md.push(`| Cache stats | Hits: ${cacheStats.hits}, Misses: ${cacheStats.misses}, Size: ${cacheStats.size} |`);
  md.push(`| Report cost | $${report.metadata.estimatedCost.toFixed(4)} |`);
  md.push(`| Tokens | ${report.metadata.tokenUsage.input} in, ${report.metadata.tokenUsage.output} out |`);
  md.push('');

  // Show bottom line summary
  md.push('### Report Bottom Line');
  md.push('');
  md.push(`- **${report.bottomLine.rating}**`);
  md.push(`- **Position:** ${report.bottomLine.positioning}`);
  md.push(`- **Strength:** ${report.bottomLine.biggestStrength}`);
  md.push(`- **Risk:** ${report.bottomLine.biggestRisk}`);
  md.push(`- **Action:** ${report.bottomLine.topAction}`);
  md.push('');

  // Show key sections used by conversation
  md.push('### Key Report Sections (fed to advisor)');
  md.push('');

  md.push('**Challenges (become conversation topics):**');
  md.push('');
  for (const c of report.challengesAndReality.challenges) {
    md.push(`- **${c.title}** — ${c.issue.split('.').slice(0, 2).join('.')}.`);
  }
  md.push('');

  md.push('**Roadmap Priorities (become conversation topics):**');
  md.push('');
  for (const p of report.strategicRoadmap.priorities) {
    md.push(`- **P${p.priority}: ${p.title}** [${p.impact}] — ${p.description.split('.')[0]}.`);
  }
  md.push('');

  md.push('**Course Strategy (used for grounded coaching):**');
  md.push('');
  md.push('| Course | Rationale | Risk |');
  md.push('|--------|-----------|------|');
  for (const c of report.strategicRoadmap.courseStrategy.recommended) {
    md.push(`| ${c.course} | ${c.rationale.split('.')[0]} | ${c.risk} |`);
  }
  md.push('');

  const ma = report.strategicRoadmap.majorAlignment;
  md.push(`**Major Alignment:** ${ma.score}/100 — ${ma.assessment.split('.')[0]}.`);
  if (ma.missingPieces.length > 0) {
    md.push(`**Gaps:** ${ma.missingPieces.join(', ')}`);
  }
  md.push('');
  md.push('---');
  md.push('');

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 2: Report → Topic Generation
  // ──────────────────────────────────────────────────────────────────────────
  md.push('## Phase 2: Report-Derived Conversation Topics');
  md.push('');
  md.push('> The system converts report challenges, roadmap priorities, and alignment gaps');
  md.push('> into conversation topics that the advisor can explore with the student.');
  md.push('');

  console.error('Phase 2: Generating report topics...');

  let topicCounter = 0;
  const reportTopics = generateReportTopics(report, () => `topic_report_${++topicCounter}`);

  md.push(`**Topics generated from report:** ${reportTopics.length}`);
  md.push('');
  md.push('| # | Type | Priority | Source | Question (preview) |');
  md.push('|---|------|----------|--------|-------------------|');
  for (let i = 0; i < reportTopics.length; i++) {
    const t = reportTopics[i];
    const question = t.primaryQuestion.length > 80
      ? t.primaryQuestion.substring(0, 80) + '...'
      : t.primaryQuestion;
    md.push(`| ${i + 1} | \`${t.type}\` | ${t.priority.toFixed(1)} | ${t.context.split(':')[0]} | ${question} |`);
  }
  md.push('');
  md.push('---');
  md.push('');

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 3: Conversation with Report Context
  // ──────────────────────────────────────────────────────────────────────────
  md.push('## Phase 3: Conversation with Report-Grounded Coaching');
  md.push('');
  md.push('> The conversational advisor now has the deep academic report as context.');
  md.push('> Each response is grounded in the report\'s data, tier position, and recommendations.');
  md.push('');

  console.error('Phase 3: Running conversation with report context...');

  const engineOptions: ConversationEngineOptions = {
    intendedMajor: 'Computer Science',
    maxTopics: 15,
    enableDynamicFlow: true,
    useLLMEngagement: false, // Heuristic for speed
    detectCrossSubjectPatterns: true,
    deepAcademicReport: report,
  };

  const engine = new CapabilityConversationEngine(engineOptions);
  const initResult: InitializeResult = await engine.initialize(mockAnalysis);

  if (!initResult.success) {
    md.push('**ERROR:** Conversation engine failed to initialize.');
    md.push(`Error: ${initResult.error}`);
    writeOutput(md);
    return;
  }

  // Show the topic queue (should include both detected and report topics)
  const allTopics = [
    ...(initResult.state.currentTopic ? [initResult.state.currentTopic] : []),
    ...initResult.state.pendingTopics,
  ];
  const reportTopicCount = allTopics.filter(t => t.id.startsWith('topic_report_')).length;
  const detectedTopicCount = allTopics.length - reportTopicCount;

  md.push('### Topic Queue After Initialization');
  md.push('');
  md.push(`**Total topics:** ${allTopics.length} (${detectedTopicCount} detected + ${reportTopicCount} from report)`);
  md.push('');
  md.push('| # | ID | Type | Priority | Source |');
  md.push('|---|-----|------|----------|--------|');
  for (let i = 0; i < Math.min(allTopics.length, 12); i++) {
    const t = allTopics[i];
    const source = t.id.startsWith('topic_report_') ? 'Deep Report' :
                   t.id.startsWith('topic_pattern_') ? 'Cross-Subject Pattern' :
                   'Quantitative Analysis';
    const marker = i === 0 ? ' (current)' : '';
    md.push(`| ${i + 1} | \`${t.id}\`${marker} | \`${t.type}\` | ${t.priority.toFixed(1)} | ${source} |`);
  }
  if (allTopics.length > 12) {
    md.push(`| ... | ... | ... | ... | +${allTopics.length - 12} more |`);
  }
  md.push('');

  // Show the AI opener
  md.push('### Conversation');
  md.push('');
  md.push(`**AI (opener):** ${initResult.opener.message}`);
  md.push('');

  // Run conversation turns
  let currentState = initResult.state;
  let currentInsights = initResult.qualitativeInsights;
  let turnResults: ProcessTurnResult[] = [];

  for (let i = 0; i < studentMessages.length; i++) {
    const studentMsg = studentMessages[i];
    console.error(`  Turn ${i + 1}: Processing student message...`);

    md.push(`---`);
    md.push('');
    md.push(`**Student (turn ${i + 1}):** ${studentMsg}`);
    md.push('');

    const turnResult = await engine.processTurn(
      studentMsg,
      currentState,
      currentInsights,
      mockAnalysis
    );

    turnResults.push(turnResult);

    if (!turnResult.success) {
      md.push(`**ERROR:** Turn failed — ${turnResult.error}`);
      md.push('');
      continue;
    }

    // Show the AI response
    md.push(`**AI (response):** ${turnResult.response.message}`);
    md.push('');

    // Show what topic was active
    if (turnResult.state.currentTopic) {
      const topic = turnResult.state.currentTopic;
      const isReportTopic = topic.id.startsWith('topic_report_');
      md.push(`> *Active topic:* \`${topic.type}\` — ${topic.context.substring(0, 80)}${topic.context.length > 80 ? '...' : ''} ${isReportTopic ? '(from report)' : ''}`);
      md.push('');
    }

    // Show insights extracted this turn
    if (turnResult.state.completedTopics.length > currentState.completedTopics.length) {
      const newlyCompleted = turnResult.state.completedTopics.filter(
        t => !currentState.completedTopics.includes(t)
      );
      if (newlyCompleted.length > 0) {
        md.push(`> *Topics completed this turn:* ${newlyCompleted.map(t => `\`${t.id}\``).join(', ')}`);
        md.push('');
      }
    }

    // Show engagement assessment
    if (turnResult.engagement) {
      md.push(`> *Engagement:* ${turnResult.engagement.level} (${turnResult.engagement.confidence}% confidence)`);
      md.push('');
    }

    currentState = turnResult.state;
    currentInsights = turnResult.qualitativeInsights;
  }

  md.push('---');
  md.push('');

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 4: Roadmap Adjustments
  // ──────────────────────────────────────────────────────────────────────────
  md.push('## Phase 4: Roadmap Adjustments Detected');
  md.push('');
  md.push('> The system tracks when students express opinions about recommended courses');
  md.push('> or priorities, accumulating adjustments for potential roadmap updates.');
  md.push('');

  const adjustments = currentState.roadmapAdjustments || [];
  if (adjustments.length > 0) {
    md.push(`**${adjustments.length} adjustment(s) detected:**`);
    md.push('');
    md.push('| # | Type | Sentiment | Description | Turn |');
    md.push('|---|------|-----------|-------------|------|');
    for (let i = 0; i < adjustments.length; i++) {
      const adj = adjustments[i];
      const sentimentEmoji = adj.studentSentiment === 'positive' ? '+' :
                             adj.studentSentiment === 'negative' ? '-' : '?';
      md.push(`| ${i + 1} | \`${adj.type}\` | ${sentimentEmoji} ${adj.studentSentiment} | ${adj.description} | ${adj.turnNumber} |`);
    }
    md.push('');
  } else {
    md.push('*No roadmap adjustments detected in this conversation.*');
    md.push('(This can happen if student messages don\'t directly reference recommended courses/priorities.)');
    md.push('');
  }

  md.push('---');
  md.push('');

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 5: Conversation Progress & Summary
  // ──────────────────────────────────────────────────────────────────────────
  md.push('## Phase 5: Conversation Progress');
  md.push('');

  md.push(`**Turns completed:** ${currentState.turnCount}`);
  md.push(`**Phase:** ${currentState.phase}`);
  md.push(`**Completion:** ${currentState.completionProgress}%`);
  md.push(`**Topics explored:** ${currentState.completedTopics.length} completed, ${currentState.pendingTopics.length} pending`);
  md.push('');

  // Show conversation history summary
  const convHistory = currentInsights.conversationHistory;
  md.push(`**Conversation history:** ${convHistory.length} turns (${convHistory.filter(t => t.role === 'student').length} student, ${convHistory.filter(t => t.role === 'ai').length} AI)`);
  md.push('');

  // ──────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────────────────────────────────
  const totalTime = Date.now() - startTime;

  md.push('---');
  md.push('');
  md.push('## Summary');
  md.push('');
  md.push('| Metric | Value |');
  md.push('|--------|-------|');
  md.push(`| Total duration | ${(totalTime / 1000).toFixed(1)}s |`);
  md.push(`| Report generation | ${(reportTime / 1000).toFixed(1)}s ($${report.metadata.estimatedCost.toFixed(4)}) |`);
  md.push(`| Cache hit time | ${cacheTime}ms |`);
  md.push(`| Conversation turns | ${studentMessages.length} |`);
  md.push(`| Report topics generated | ${reportTopics.length} |`);
  md.push(`| Total topics in queue | ${allTopics.length} |`);
  md.push(`| Roadmap adjustments | ${adjustments.length} |`);
  md.push('');

  md.push('### Integration Verification');
  md.push('');
  const checks = [
    { name: 'Cache wrapper works (miss → hit)', pass: cacheStats.hits >= 1 && cacheStats.misses >= 1 },
    { name: 'Report topics generated', pass: reportTopics.length > 0 },
    { name: 'Report topics mixed into queue', pass: reportTopicCount > 0 },
    { name: 'Conversation initialized with report', pass: initResult.success },
    { name: 'All turns processed successfully', pass: turnResults.every(r => r.success) },
    { name: 'AI responses are non-empty', pass: turnResults.every(r => r.response.message.length > 20) },
    { name: 'Conversation state tracks adjustments', pass: Array.isArray(currentState.roadmapAdjustments) },
  ];
  for (const check of checks) {
    md.push(`- [${check.pass ? 'x' : ' '}] ${check.name}`);
  }
  md.push('');
  md.push(`**Overall:** ${checks.filter(c => c.pass).length}/${checks.length} checks passed`);
  md.push('');

  md.push('---');
  md.push('');
  md.push('*Generated by test-report-advisor-integration-e2e.ts*');
  md.push(`*${new Date().toISOString()}*`);

  writeOutput(md);
}

function writeOutput(md: string[]) {
  const content = md.join('\n');

  // Write to file
  const outPath = path.join(__dirname, '..', 'docs', 'REPORT_ADVISOR_INTEGRATION_E2E.md');
  fs.writeFileSync(outPath, content, 'utf8');
  console.error(`\nOutput written to: ${outPath}`);

  // Also print to stdout
  console.log(content);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
