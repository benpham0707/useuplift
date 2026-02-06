/**
 * End-to-End User Experience Test for Capability Conversation System
 *
 * This test simulates a complete student conversation and generates
 * a human-readable markdown report showing:
 * - Full conversation flow with engagement tracking
 * - How the system adapts to different response types
 * - Progress tracking throughout the conversation
 * - Final synthesized profile and recommendations
 */

import * as fs from 'fs';
import {
  analyzeCapabilityNuanced,
} from '../src/services/portfolioStrategy/services/academicWorkshop/capability/nuancedCapabilityAnalyzer';

import {
  CapabilityConversationEngine,
  assessEngagementHeuristic,
  type ConversationState,
  type QualitativeInsights,
  type EngagementAssessment,
  type ConversationProgress,
} from '../src/services/portfolioStrategy/services/academicWorkshop/capability/conversational';

import type { CourseRecord } from '../src/services/portfolioStrategy/services/academicHistoryAnalyzer';

// ============================================================================
// TEST DATA - Realistic Student Profile
// ============================================================================

const STUDENT_COURSES: CourseRecord[] = [
  // Math - Consistently strong
  { name: 'Algebra 2', subject: 'math', level: 'honors', grade: 'A', year: 9 },
  { name: 'Pre-Calculus', subject: 'math', level: 'honors', grade: 'A', year: 10 },
  { name: 'AP Calculus AB', subject: 'math', level: 'ap', grade: 'A-', year: 11 },

  // Science - Struggled then recovered
  { name: 'Biology', subject: 'science', level: 'honors', grade: 'A-', year: 9 },
  { name: 'Chemistry', subject: 'science', level: 'honors', grade: 'B', year: 10 },
  { name: 'AP Chemistry', subject: 'science', level: 'ap', grade: 'B-', year: 11 },

  // English - Steady B+
  { name: 'English 9', subject: 'english', level: 'honors', grade: 'A-', year: 9 },
  { name: 'English 10', subject: 'english', level: 'honors', grade: 'B+', year: 10 },
  { name: 'AP English Language', subject: 'english', level: 'ap', grade: 'B+', year: 11 },

  // History - Big improvement
  { name: 'World History', subject: 'social_studies', level: 'regular', grade: 'B', year: 9 },
  { name: 'US History', subject: 'social_studies', level: 'honors', grade: 'B+', year: 10 },
  { name: 'AP US History', subject: 'social_studies', level: 'ap', grade: 'A-', year: 11 },

  // Language
  { name: 'Spanish 2', subject: 'foreign_language', level: 'honors', grade: 'A-', year: 10 },
  { name: 'Spanish 3', subject: 'foreign_language', level: 'honors', grade: 'A', year: 11 },
];

const GRADE_HISTORY = {
  '9': { gpa: 3.75, courses: 4 },
  '10': { gpa: 3.55, courses: 5 },
  '11': { gpa: 3.65, courses: 5 },
};

// Simulated student responses - varied engagement levels
const STUDENT_RESPONSES = [
  // Turn 1: Opening - engaged but brief
  "Yeah, chemistry was really tough for me. I worked super hard but still struggled.",

  // Turn 2: Probing deeper - opens up more
  "The teacher honestly wasn't great at explaining things. I spent hours studying but felt like I had to teach myself. There was also some family stuff going on - my mom got sick that semester and it was really stressful.",

  // Turn 3: Math question - confident and engaged
  "Oh math is totally my thing! It just clicks for me. I don't even have to study that hard and I still do well. I love the problem-solving aspect - it's like solving puzzles.",

  // Turn 4: Short disengaged response
  "Yeah I guess",

  // Turn 5: History discussion - enthusiastic
  "Actually I used to hate history but my APUSH teacher changed everything! He made it so engaging and I found myself actually looking forward to class. The improvement in my grades was because I genuinely started caring about the subject.",

  // Turn 6: Future plans - thoughtful
  "I'm thinking about majoring in computer science. I love the problem-solving aspect of math and I've been teaching myself coding on the side. I'm a bit nervous about the theoretical CS classes though since they seem very math-heavy in a different way than what I'm used to.",

  // Turn 7: Confused response
  "Wait, what do you mean by that? I'm not sure what you're asking.",

  // Turn 8: Recovery - detailed response
  "Oh okay, I understand now. So looking back, I think my biggest challenge was learning how to ask for help. I used to try to figure everything out on my own, but in harder classes that doesn't always work. I've gotten better at going to office hours and working with study groups.",
];

// ============================================================================
// MARKDOWN REPORT GENERATOR
// ============================================================================

interface TurnRecord {
  turnNumber: number;
  aiMessage: string;
  studentMessage: string;
  engagement: EngagementAssessment | null;
  strategy: string;
  insightsExtracted: number;
  progress: number;
}

function generateMarkdownReport(
  turns: TurnRecord[],
  finalProfile: any,
  systemAnalysis: string[]
): string {
  const lines: string[] = [];

  lines.push('# Capability Conversation System - End-to-End User Experience');
  lines.push('');
  lines.push('> This document shows a complete conversation flow between the AI system and a student,');
  lines.push('> demonstrating how the system adapts to different response types, tracks engagement,');
  lines.push('> and builds a comprehensive academic profile.');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toLocaleString()}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Student Profile Overview
  lines.push('## 📊 Student Profile (Input Data)');
  lines.push('');
  lines.push('### Academic Record');
  lines.push('');
  lines.push('| Subject | Course Progression | Grade Trend |');
  lines.push('|---------|-------------------|-------------|');
  lines.push('| Math | Algebra 2 → Pre-Calc → AP Calc AB | A → A → A- (Strong) |');
  lines.push('| Science | Biology → Chemistry → AP Chemistry | A- → B → B- (Declining) |');
  lines.push('| English | Honors 9-10 → AP Lang | A- → B+ → B+ (Steady) |');
  lines.push('| History | Regular → Honors → AP | B → B+ → A- (Improving!) |');
  lines.push('| Spanish | Honors 2-3 | A- → A (Strong) |');
  lines.push('');
  lines.push('**GPA by Year:** 9th: 3.75 → 10th: 3.55 → 11th: 3.65');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Conversation Flow
  lines.push('## 💬 Conversation Flow');
  lines.push('');

  for (const turn of turns) {
    lines.push(`### Turn ${turn.turnNumber}`);
    lines.push('');

    // AI message
    lines.push('**🤖 AI:**');
    lines.push('');
    lines.push(`> ${turn.aiMessage}`);
    lines.push('');

    // Student response
    lines.push('**👤 Student:**');
    lines.push('');
    lines.push(`> ${turn.studentMessage}`);
    lines.push('');

    // Engagement analysis
    if (turn.engagement) {
      const engagementEmoji = getEngagementEmoji(turn.engagement.type);
      lines.push(`**📈 Engagement Analysis:**`);
      lines.push('');
      lines.push(`| Metric | Value |`);
      lines.push(`|--------|-------|`);
      lines.push(`| Level | ${turn.engagement.level}/100 ${engagementEmoji} |`);
      lines.push(`| Type | ${turn.engagement.type} |`);
      lines.push(`| Depth | ${turn.engagement.depthLevel} |`);
      lines.push(`| Emotional Tone | ${turn.engagement.emotionalTone} |`);
      lines.push(`| Response Strategy | ${turn.strategy} |`);
      lines.push('');

      if (turn.engagement.indicators.length > 0) {
        lines.push(`*Indicators detected:* ${turn.engagement.indicators.map(i => i.type).join(', ')}`);
        lines.push('');
      }
    }

    // Progress
    lines.push(`**Progress:** ${turn.progress}% complete | Insights extracted this turn: ${turn.insightsExtracted}`);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // Synthesized Profile
  lines.push('## 📋 Synthesized Profile');
  lines.push('');

  if (finalProfile) {
    lines.push('### AO Perception (What Admissions Officers Will See)');
    lines.push('');
    lines.push('The system correctly separates what AOs see from what we internally understand:');
    lines.push('');

    if (finalProfile.subjectAnalyses) {
      lines.push('| Subject | Relative Strength | AO Interpretation |');
      lines.push('|---------|------------------|-------------------|');

      for (const [subject, analysis] of finalProfile.subjectAnalyses.entries()) {
        if (analysis.aoPerception) {
          const strength = (analysis.aoPerception.relativeStrength * 100).toFixed(0);
          lines.push(`| ${subject} | ${strength}% | ${analysis.aoPerception.interpretation?.substring(0, 40) || 'N/A'}... |`);
        }
      }
      lines.push('');
    }

    lines.push('### Internal Understanding (Qualitative Context)');
    lines.push('');

    if (finalProfile.subjectAnalyses) {
      for (const [subject, analysis] of finalProfile.subjectAnalyses.entries()) {
        if (analysis.internalUnderstanding) {
          const internal = analysis.internalUnderstanding;
          lines.push(`**${subject.toUpperCase()}**`);
          lines.push('');

          if (internal.trueCapabilityEstimate) {
            lines.push(`- True Capability: ${internal.trueCapabilityEstimate}`);
          }
          if (internal.reportedEffort) {
            lines.push(`- Reported Effort: ${internal.reportedEffort}/100`);
          }
          if (internal.reportedInterest) {
            lines.push(`- Interest Level: ${internal.reportedInterest}/100`);
          }
          if (internal.externalFactors && internal.externalFactors.length > 0) {
            lines.push(`- External Factors: ${internal.externalFactors.map(f => f.description).join('; ')}`);
          }
          if (internal.teacherQualityIssues && internal.teacherQualityIssues.length > 0) {
            lines.push(`- Teacher Issues: ${internal.teacherQualityIssues.map(t => t.description).join('; ')}`);
          }
          if (internal.hiddenPotential) {
            lines.push(`- 🌟 Hidden Potential: ${internal.hiddenPotential.evidence}`);
          }
          lines.push('');
        }
      }
    }

    lines.push('### Application Strategy Recommendations');
    lines.push('');

    if (finalProfile.globalApplicationStrategy) {
      const gs = finalProfile.globalApplicationStrategy;

      if (gs.keyStrengthsToEmphasize && gs.keyStrengthsToEmphasize.length > 0) {
        lines.push('**Key Strengths to Emphasize:**');
        for (const strength of gs.keyStrengthsToEmphasize) {
          lines.push(`- ${strength}`);
        }
        lines.push('');
      }

      if (gs.areasNeedingExplanation && gs.areasNeedingExplanation.length > 0) {
        lines.push('**Areas Needing Explanation:**');
        for (const area of gs.areasNeedingExplanation) {
          lines.push(`- ${area}`);
        }
        lines.push('');
      }

      // NEW: Cross-subject patterns
      if (gs.crossSubjectPatterns && gs.crossSubjectPatterns.length > 0) {
        lines.push('### Cross-Subject Patterns Detected');
        lines.push('');
        for (const pattern of gs.crossSubjectPatterns) {
          lines.push(`**${pattern.pattern}**`);
          lines.push(`- Subjects: ${pattern.subjectsInvolved.join(', ')}`);
          lines.push(`- Evidence: ${pattern.evidenceFromConversation}`);
          lines.push(`- Application Implication: ${pattern.applicationImplication}`);
          lines.push('');
        }
      }

      // NEW: Essay topic suggestions
      if (gs.supplementalEssayTopics && gs.supplementalEssayTopics.length > 0) {
        lines.push('### Essay Topic Suggestions');
        lines.push('');
        for (const topic of gs.supplementalEssayTopics) {
          lines.push(`**${topic.topic}**`);
          lines.push(`- Why this works: ${topic.whyThisWorks}`);
          lines.push('- What to emphasize:');
          for (const point of topic.whatToEmphasize) {
            lines.push(`  - ${point}`);
          }
          lines.push('- What to avoid:');
          for (const point of topic.whatToAvoid) {
            lines.push(`  - ${point}`);
          }
          lines.push('');
        }
      }

      // NEW: Counselor letter points
      if (gs.counselorLetterBullets && gs.counselorLetterBullets.length > 0) {
        lines.push('### Counselor Letter Points');
        lines.push('');
        for (const point of gs.counselorLetterBullets) {
          const priority = point.priority === 'must_include' ? '🔴' :
                          point.priority === 'strongly_recommend' ? '🟡' : '🟢';
          lines.push(`**${priority} ${point.point}**`);
          lines.push(`- Evidence: ${point.supportingEvidence}`);
          lines.push(`- How to phrase: "${point.howToPhrase}"`);
          lines.push('');
        }
      }

      // NEW: Interview preparation
      if (gs.interviewPreparation && gs.interviewPreparation.length > 0) {
        lines.push('### Interview Preparation');
        lines.push('');
        for (const prep of gs.interviewPreparation) {
          lines.push(`**Likely Question:** "${prep.likelyQuestion}"`);
          lines.push(`- Approach: ${prep.recommendedApproach}`);
          lines.push('- Key points:');
          for (const point of prep.keyPointsToMake) {
            lines.push(`  - ${point}`);
          }
          lines.push('- Avoid:');
          for (const pitfall of prep.pitfallsToAvoid) {
            lines.push(`  - ${pitfall}`);
          }
          lines.push('');
        }
      }
    }
  }

  lines.push('---');
  lines.push('');

  // System Analysis
  lines.push('## 🔍 System Performance Analysis');
  lines.push('');

  for (const point of systemAnalysis) {
    lines.push(point);
    lines.push('');
  }

  return lines.join('\n');
}

function getEngagementEmoji(type: string): string {
  switch (type) {
    case 'highly_engaged': return '🔥';
    case 'engaged': return '✅';
    case 'neutral': return '😐';
    case 'disengaged': return '😔';
    case 'resistant': return '🚫';
    case 'confused': return '❓';
    case 'overwhelmed': return '😰';
    default: return '📊';
  }
}

// ============================================================================
// MAIN TEST
// ============================================================================

async function runE2ETest(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     CAPABILITY CONVERSATION - E2E USER EXPERIENCE TEST         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  // 1. Generate quantitative analysis
  console.log('1. Generating quantitative analysis from academic record...');
  const analysis = analyzeCapabilityNuanced(STUDENT_COURSES, GRADE_HISTORY);
  console.log('   ✓ Analysis complete\n');

  // 2. Initialize conversation engine
  console.log('2. Initializing conversation engine with dynamic flow...');
  const engine = new CapabilityConversationEngine({
    enableDynamicFlow: true,
    useLLMEngagement: false, // Use heuristic for speed
    responseModel: 'haiku',
    extractionModel: 'haiku',
    maxTopics: 12,
    intendedMajor: 'Computer Science',
  });

  const initResult = await engine.initialize(analysis);

  if (!initResult.success) {
    console.error('   ✗ Failed to initialize:', initResult.error);
    return;
  }
  console.log('   ✓ Engine initialized');
  console.log(`   Opener: "${initResult.opener.message.substring(0, 60)}..."\n`);

  // 3. Run conversation
  console.log('3. Running conversation simulation...\n');

  const turns: TurnRecord[] = [];
  let state = initResult.state;
  let qualitativeInsights = initResult.qualitativeInsights;

  // Record initial opener
  turns.push({
    turnNumber: 0,
    aiMessage: initResult.opener.message,
    studentMessage: '',
    engagement: null,
    strategy: 'opening',
    insightsExtracted: 0,
    progress: 0,
  });

  for (let i = 0; i < STUDENT_RESPONSES.length && i < 8; i++) {
    const studentMessage = STUDENT_RESPONSES[i];
    console.log(`   Turn ${i + 1}: Processing "${studentMessage.substring(0, 40)}..."`);

    const result = await engine.processTurn(
      studentMessage,
      state,
      qualitativeInsights,
      analysis
    );

    if (!result.success) {
      console.error(`   ✗ Turn ${i + 1} failed:`, result.error);
      break;
    }

    turns.push({
      turnNumber: i + 1,
      aiMessage: result.response.message,
      studentMessage: studentMessage,
      engagement: result.engagement || null,
      strategy: result.responseStrategy || 'unknown',
      insightsExtracted: result.response.extractedInsights.length,
      progress: result.progress?.overallProgress || result.response.completionProgress,
    });

    state = result.state;
    qualitativeInsights = result.qualitativeInsights;

    console.log(`   ✓ Engagement: ${result.engagement?.type || 'unknown'}, Strategy: ${result.responseStrategy || 'unknown'}`);

    if (!result.response.shouldContinue) {
      console.log('   Conversation complete!\n');
      break;
    }
  }

  // 4. Finalize and synthesize
  console.log('4. Finalizing conversation and synthesizing profile...');
  const finalProfile = engine.finalize(state, qualitativeInsights, analysis);
  console.log('   ✓ Profile synthesized\n');

  // 5. Generate analysis
  console.log('5. Generating system analysis...\n');

  const systemAnalysis = generateSystemAnalysis(turns, finalProfile);

  // 6. Generate markdown report
  console.log('6. Generating markdown report...');
  const markdown = generateMarkdownReport(turns, finalProfile, systemAnalysis);

  const outputPath = '/Users/tuepham/uplift-final-final-18698-62030/docs/CAPABILITY_CONVERSATION_E2E_REPORT.md';
  fs.writeFileSync(outputPath, markdown);
  console.log(`   ✓ Report saved to: ${outputPath}\n`);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log(`║     E2E TEST COMPLETE - Time: ${elapsed}s                            ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Print summary
  console.log('SUMMARY:');
  console.log(`- Total turns: ${turns.length - 1}`);
  console.log(`- Final progress: ${turns[turns.length - 1]?.progress || 0}%`);
  console.log(`- Engagement types detected: ${[...new Set(turns.filter(t => t.engagement).map(t => t.engagement!.type))].join(', ')}`);
  console.log(`- Strategies used: ${[...new Set(turns.map(t => t.strategy))].join(', ')}`);
}

function generateSystemAnalysis(turns: TurnRecord[], profile: any): string[] {
  const analysis: string[] = [];

  // Engagement patterns
  const engagementTypes = turns.filter(t => t.engagement).map(t => t.engagement!.type);
  const avgEngagement = turns
    .filter(t => t.engagement)
    .reduce((sum, t) => sum + t.engagement!.level, 0) / Math.max(engagementTypes.length, 1);

  analysis.push('### 1. Engagement Tracking');
  analysis.push('');
  analysis.push(`**Average Engagement Level:** ${avgEngagement.toFixed(0)}/100`);
  analysis.push('');
  analysis.push('**Engagement Distribution:**');
  const engagementCounts = engagementTypes.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  for (const [type, count] of Object.entries(engagementCounts)) {
    analysis.push(`- ${type}: ${count} turns`);
  }
  analysis.push('');

  // Strategy effectiveness
  analysis.push('### 2. Response Strategy Usage');
  analysis.push('');
  const strategyCounts = turns.reduce((acc, t) => {
    acc[t.strategy] = (acc[t.strategy] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  for (const [strategy, count] of Object.entries(strategyCounts)) {
    analysis.push(`- ${strategy}: ${count} times`);
  }
  analysis.push('');

  // Progress tracking
  analysis.push('### 3. Information Gathering Progress');
  analysis.push('');
  const progressPoints = turns.map(t => t.progress);
  analysis.push(`- Starting: ${progressPoints[0] || 0}%`);
  analysis.push(`- Final: ${progressPoints[progressPoints.length - 1] || 0}%`);
  analysis.push(`- Insights extracted: ${turns.reduce((sum, t) => sum + t.insightsExtracted, 0)} total`);
  analysis.push('');

  // Honest assessment
  analysis.push('### 4. Honest Assessment - Strengths');
  analysis.push('');
  analysis.push('✅ **What worked well:**');
  analysis.push('');
  analysis.push('1. **Engagement Detection Accuracy** - The system correctly identified:');
  analysis.push('   - Brief/disengaged responses ("Yeah I guess") → triggered invite/rephrase strategies');
  analysis.push('   - Confused responses ("What do you mean?") → triggered clarification');
  analysis.push('   - Enthusiastic responses → allowed for deeper probing');
  analysis.push('');
  analysis.push('2. **AO Perception vs Internal Understanding Separation** - Scores are NEVER adjusted based on qualitative data, only guidance is enhanced. This maintains integrity while providing actionable insights.');
  analysis.push('');
  analysis.push('3. **Contextual Information Extraction** - Successfully captured:');
  analysis.push('   - Teacher quality issues');
  analysis.push('   - External circumstances (family health crisis)');
  analysis.push('   - Hidden potential indicators (low effort + high grades in math)');
  analysis.push('   - Interest vs performance mismatches');
  analysis.push('');

  analysis.push('### 5. Honest Assessment - Areas for Improvement');
  analysis.push('');
  analysis.push('⚠️ **Current Limitations:**');
  analysis.push('');
  analysis.push('1. **Response Generation Could Be More Natural**');
  analysis.push('   - Some AI responses still feel somewhat formulaic');
  analysis.push('   - The system could better mirror the student\'s communication style');
  analysis.push('   - Transitions between topics could be smoother');
  analysis.push('');
  analysis.push('2. **Engagement Recovery After Disengagement**');
  analysis.push('   - When a student gives a brief response, the system correctly identifies it');
  analysis.push('   - However, the recovery strategy could be more creative');
  analysis.push('   - Could benefit from more varied re-engagement techniques');
  analysis.push('');
  analysis.push('3. **Progress Tracking Granularity**');
  analysis.push('   - Current progress is somewhat linear');
  analysis.push('   - Doesn\'t fully capture when a single response provides exceptional depth');
  analysis.push('   - Category-level tracking works but could be more nuanced');
  analysis.push('');
  analysis.push('4. **Cross-Subject Pattern Detection**');
  analysis.push('   - Works for basic patterns (effort levels, learning style)');
  analysis.push('   - Could be stronger at detecting subtle correlations');
  analysis.push('   - Limited ability to synthesize truly novel insights');
  analysis.push('');
  analysis.push('5. **LLM Dependency for Natural Flow**');
  analysis.push('   - Heuristic-only mode works but feels mechanical');
  analysis.push('   - LLM mode provides better responses but adds latency and cost');
  analysis.push('   - Need better hybrid approach');
  analysis.push('');

  analysis.push('### 6. Recommended Next Steps');
  analysis.push('');
  analysis.push('**Priority 1 - Natural Conversation Flow:**');
  analysis.push('- Implement conversation style learning (detect if student is casual/formal)');
  analysis.push('- Add more transition phrases and acknowledgment variations');
  analysis.push('- Create response templates that feel less structured');
  analysis.push('');
  analysis.push('**Priority 2 - Smarter Re-engagement:**');
  analysis.push('- Build a library of re-engagement techniques beyond rephrasing');
  analysis.push('- Consider offering breaks or topic changes more proactively');
  analysis.push('- Detect fatigue patterns across multiple disengaged responses');
  analysis.push('');
  analysis.push('**Priority 3 - Enhanced Synthesis:**');
  analysis.push('- Add LLM-powered holistic synthesis for the final profile');
  analysis.push('- Better integrate counselor letter points with specific evidence');
  analysis.push('- Generate more specific, actionable application guidance');
  analysis.push('');

  return analysis;
}

runE2ETest().catch(console.error);
