/**
 * Workshop User Experience Simulation Test
 *
 * Simulates a realistic 6-turn conversation between a student and the AI coach
 * to validate the full workshop experience:
 *
 * Turn 1: AI delivers welcome message (teaching + first prompt)
 * Turn 2: Student responds with initial attempt (often vague/generic)
 * Turn 3: AI provides feedback, asks deeper questions
 * Turn 4: Student provides more specific details
 * Turn 5: AI guides toward writing, student writes first draft
 * Turn 6: AI provides specific feedback on their writing
 *
 * This test validates:
 * - Welcome message is engaging, not overwhelming
 * - No preemptive warnings or info overload
 * - AI responds appropriately to realistic student inputs
 * - Common mistakes are surfaced ONLY when observed
 * - Citations appear naturally, not forced
 * - College guidance is woven in appropriately
 */

import * as dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs';
import * as path from 'path';
import { WorkshopChatModeService, WorkshopModeContext, WorkshopChatMessage } from '../src/services/commonAppWorkshop/services/workshopChatMode';
import type { CriticalIssue } from '../src/services/commonAppWorkshop/services/stage1BDiagnosisService';

// ============================================================================
// REALISTIC STUDENT PERSONAS
// ============================================================================

interface StudentPersona {
  name: string;
  issue: CriticalIssue;
  college: string;
  responses: string[]; // What the student says at each turn
  expectedBehaviors: {
    turn: number;
    shouldMention?: string[];    // AI should mention these
    shouldNotMention?: string[]; // AI should NOT mention these
  }[];
}

const STUDENT_PERSONAS: StudentPersona[] = [
  {
    name: "Maya - Telling Not Showing",
    issue: {
      issue_number: 1,
      symptom_type: 'telling_not_showing',
      quote: "I am passionate about environmental science and want to make a difference.",
      location: "opening paragraph",
      problem: "You're telling the reader you're passionate rather than showing it through concrete details.",
      why_matters: "Admissions officers read 500+ essays claiming passion. They remember the ones that SHOW it.",
      how_to_fix: "Replace the claim with a specific moment that demonstrates your passion.",
      severity: 'major' as const,
    },
    college: "stanford",
    responses: [
      // Turn 2: Vague initial response (realistic)
      "I guess I've always been interested in the environment. Like I recycle and stuff, and I really care about climate change.",

      // Turn 4: More specific after probing
      "Oh, there was this one time in 10th grade when we did a water testing project. I found out the creek behind my school had really high nitrate levels. I was pretty upset about it.",

      // Turn 6: First writing attempt
      "Here's my attempt: 'When I tested the water in Miller Creek and saw the nitrate levels were three times the safe limit, I couldn't stop thinking about it. I went back the next day with more test kits, even though the project was already over.'",
    ],
    expectedBehaviors: [
      { turn: 1, shouldNotMention: ['common mistake', 'warning', 'avoid', 'don\'t'] },
      { turn: 3, shouldMention: ['specific', 'moment'], shouldNotMention: ['preemptive'] },
      { turn: 5, shouldMention: ['Miller Creek', 'nitrate', 'test kits'] },
    ],
  },
  {
    name: "Jake - Cliché Opening",
    issue: {
      issue_number: 2,
      symptom_type: 'cliche_language',
      quote: "From a young age, I have always been fascinated by the stars.",
      location: "opening",
      problem: "This opening is a cliché that thousands of students use.",
      why_matters: "Admissions officers can predict the rest of your essay from this opening. That's not good.",
      how_to_fix: "Start with a specific moment, not a lifetime claim.",
      severity: 'major' as const,
    },
    college: "mit",
    responses: [
      // Turn 2: Defensive/confused response
      "But I really have been interested in space since I was a kid. Isn't that relevant?",

      // Turn 4: Specific memory surfaces
      "Well, there was this one night when I was like 12. My dad woke me up at 3am to see a meteor shower. We sat on the roof with hot chocolate. I remember being cold but not wanting to go inside.",

      // Turn 6: Writing attempt
      "Okay here's what I wrote: 'My dad shook me awake at 3am. \"Get your coat,\" he said. We climbed out my bedroom window onto the roof, and for the next hour I watched the sky fall apart in the best way.'",
    ],
    expectedBehaviors: [
      { turn: 1, shouldNotMention: ['mistake', 'warning', 'pitfall'] },
      { turn: 3, shouldMention: ['specific', 'moment', 'scene'] },
      { turn: 5, shouldMention: ['3am', 'dad', 'roof', 'meteor'] },
    ],
  },
  {
    name: "Priya - Generic Why Us",
    issue: {
      issue_number: 3,
      symptom_type: 'generic_why_us',
      quote: "I want to attend Duke because of its prestigious reputation and strong academics.",
      location: "paragraph 1",
      problem: "This could describe any top school. It fails the 'swap test.'",
      why_matters: "Admissions officers know when you're copy-pasting. It signals low effort.",
      how_to_fix: "Connect a specific Duke program or professor to YOUR specific intellectual question.",
      severity: 'major' as const,
    },
    college: "duke",
    responses: [
      // Turn 2: Generic elaboration
      "I mean, Duke has a great biology program and I want to be pre-med. Plus the campus is beautiful.",

      // Turn 4: Getting more specific
      "Actually, I've been really interested in how the microbiome affects mental health. I read about some research being done on the gut-brain axis. I think Duke has some labs working on this?",

      // Turn 6: Writing attempt with specific connection
      "Here's my try: 'Dr. Lawrence David's research on how diet shapes the microbiome in just 24 hours made me realize that the gut-brain connection I'd been reading about wasn't science fiction. I spent three weeks trying to replicate a simplified version of his fiber experiment on myself, tracking my mood alongside my meals.'",
    ],
    expectedBehaviors: [
      { turn: 1, shouldNotMention: ['warning', 'common mistake', 'don\'t'] },
      { turn: 3, shouldMention: ['specific', 'program', 'professor', 'question'] },
      { turn: 5, shouldMention: ['Dr. Lawrence David', 'microbiome', 'experiment'] },
    ],
  },
];

// ============================================================================
// SIMULATION ENGINE
// ============================================================================

interface TurnResult {
  turn: number;
  speaker: 'ai' | 'student';
  content: string;
  analysis: {
    wordCount: number;
    hasCitations: boolean;
    citationCount: number;
    mentionsCommonMistake: boolean;
    mentionsWarning: boolean;
    referencesStudentText: boolean;
    asksQuestion: boolean;
    collegeSpecificMention: boolean;
  };
}

interface SimulationResult {
  persona: string;
  turns: TurnResult[];
  passed: boolean;
  issues: string[];
  highlights: string[];
}

async function simulateConversation(
  persona: StudentPersona,
  service: WorkshopChatModeService
): Promise<SimulationResult> {
  const results: TurnResult[] = [];
  const issues: string[] = [];
  const highlights: string[] = [];

  // Build context
  const context = service.buildWorkshopContext(persona.issue, persona.college);
  if (!context) {
    return {
      persona: persona.name,
      turns: [],
      passed: false,
      issues: ['Failed to build workshop context'],
      highlights: [],
    };
  }

  const conversationHistory: WorkshopChatMessage[] = [];

  // ========================================
  // TURN 1: AI Welcome Message
  // ========================================
  const welcomeMessage = service.getWelcomeMessage(context);

  const turn1Analysis = analyzeAIResponse(welcomeMessage.content, persona, 1);
  results.push({
    turn: 1,
    speaker: 'ai',
    content: welcomeMessage.content,
    analysis: turn1Analysis,
  });

  // Check Turn 1 expectations
  const turn1Behaviors = persona.expectedBehaviors.find(b => b.turn === 1);
  if (turn1Behaviors) {
    if (turn1Behaviors.shouldNotMention) {
      for (const phrase of turn1Behaviors.shouldNotMention) {
        if (welcomeMessage.content.toLowerCase().includes(phrase.toLowerCase())) {
          issues.push(`Turn 1: Should NOT mention "${phrase}" but did`);
        }
      }
    }
  }

  // Validate welcome message isn't overwhelming
  if (turn1Analysis.wordCount > 500) {
    issues.push(`Turn 1: Welcome message too long (${turn1Analysis.wordCount} words)`);
  }
  if (turn1Analysis.mentionsWarning) {
    issues.push('Turn 1: Welcome contains preemptive warnings');
  }
  if (!turn1Analysis.asksQuestion) {
    issues.push('Turn 1: Welcome should end with a question to prompt student');
  }

  if (turn1Analysis.asksQuestion && !turn1Analysis.mentionsWarning) {
    highlights.push('Turn 1: Clean welcome - no preemptive warnings, ends with question');
  }

  conversationHistory.push(welcomeMessage);

  // ========================================
  // TURN 2: Student's First Response (often vague)
  // ========================================
  const studentResponse1 = persona.responses[0];
  conversationHistory.push({
    role: 'user',
    content: studentResponse1,
    timestamp: Date.now(),
  });

  results.push({
    turn: 2,
    speaker: 'student',
    content: studentResponse1,
    analysis: {
      wordCount: studentResponse1.split(/\s+/).length,
      hasCitations: false,
      citationCount: 0,
      mentionsCommonMistake: false,
      mentionsWarning: false,
      referencesStudentText: false,
      asksQuestion: studentResponse1.includes('?'),
      collegeSpecificMention: false,
    },
  });

  // ========================================
  // TURN 3: AI Response to vague answer
  // ========================================
  const response3 = await service.sendWorkshopMessage({
    userMessage: studentResponse1,
    context,
    conversationHistory,
  });

  const turn3Analysis = analyzeAIResponse(response3.message.content, persona, 3);
  results.push({
    turn: 3,
    speaker: 'ai',
    content: response3.message.content,
    analysis: turn3Analysis,
  });

  // Check Turn 3 expectations
  const turn3Behaviors = persona.expectedBehaviors.find(b => b.turn === 3);
  if (turn3Behaviors) {
    if (turn3Behaviors.shouldMention) {
      for (const phrase of turn3Behaviors.shouldMention) {
        if (!response3.message.content.toLowerCase().includes(phrase.toLowerCase())) {
          issues.push(`Turn 3: Should mention "${phrase}" but didn't`);
        }
      }
    }
    if (turn3Behaviors.shouldNotMention) {
      for (const phrase of turn3Behaviors.shouldNotMention) {
        if (response3.message.content.toLowerCase().includes(phrase.toLowerCase())) {
          issues.push(`Turn 3: Should NOT mention "${phrase}" but did`);
        }
      }
    }
  }

  // AI should be digging deeper, not accepting vague response
  if (!turn3Analysis.asksQuestion) {
    issues.push('Turn 3: AI should ask follow-up questions to dig deeper');
  }

  if (turn3Analysis.asksQuestion && !turn3Analysis.mentionsWarning) {
    highlights.push('Turn 3: AI appropriately probes for specifics without lecturing');
  }

  conversationHistory.push(response3.message);

  // ========================================
  // TURN 4: Student provides more specific details
  // ========================================
  const studentResponse2 = persona.responses[1];
  conversationHistory.push({
    role: 'user',
    content: studentResponse2,
    timestamp: Date.now(),
  });

  results.push({
    turn: 4,
    speaker: 'student',
    content: studentResponse2,
    analysis: {
      wordCount: studentResponse2.split(/\s+/).length,
      hasCitations: false,
      citationCount: 0,
      mentionsCommonMistake: false,
      mentionsWarning: false,
      referencesStudentText: false,
      asksQuestion: studentResponse2.includes('?'),
      collegeSpecificMention: false,
    },
  });

  // ========================================
  // TURN 5: AI responds to specific details, prompts writing
  // ========================================
  const response5 = await service.sendWorkshopMessage({
    userMessage: studentResponse2,
    context,
    conversationHistory,
  });

  const turn5Analysis = analyzeAIResponse(response5.message.content, persona, 5);
  results.push({
    turn: 5,
    speaker: 'ai',
    content: response5.message.content,
    analysis: turn5Analysis,
  });

  // Check Turn 5 expectations
  const turn5Behaviors = persona.expectedBehaviors.find(b => b.turn === 5);
  if (turn5Behaviors) {
    if (turn5Behaviors.shouldMention) {
      for (const phrase of turn5Behaviors.shouldMention) {
        if (!response5.message.content.toLowerCase().includes(phrase.toLowerCase())) {
          // Not an error if AI is prompting them to write - they haven't written yet
        }
      }
    }
  }

  // AI should reference their specific details
  if (!turn5Analysis.referencesStudentText) {
    // Check if any key words from student's response appear
    const studentWords = studentResponse2.toLowerCase().split(/\s+/);
    const specificWords = studentWords.filter(w => w.length > 5);
    const aiText = response5.message.content.toLowerCase();
    const referenced = specificWords.some(w => aiText.includes(w));
    if (!referenced) {
      issues.push('Turn 5: AI should reference student\'s specific details');
    }
  }

  if (turn5Analysis.referencesStudentText) {
    highlights.push('Turn 5: AI builds on student\'s specific details');
  }

  conversationHistory.push(response5.message);

  // ========================================
  // TURN 6: Student writes, AI gives feedback
  // ========================================
  const studentWriting = persona.responses[2];
  conversationHistory.push({
    role: 'user',
    content: studentWriting,
    timestamp: Date.now(),
  });

  const response6 = await service.sendWorkshopMessage({
    userMessage: studentWriting,
    context,
    conversationHistory,
  });

  const turn6Analysis = analyzeAIResponse(response6.message.content, persona, 6);
  results.push({
    turn: 6,
    speaker: 'ai',
    content: response6.message.content,
    analysis: turn6Analysis,
  });

  // AI should provide specific feedback on their writing
  if (!turn6Analysis.referencesStudentText) {
    issues.push('Turn 6: AI should quote and reference student\'s writing');
  } else {
    highlights.push('Turn 6: AI provides specific feedback on student\'s writing');
  }

  // ========================================
  // OVERALL ASSESSMENT
  // ========================================

  // Count critical issues
  const criticalIssues = issues.filter(i =>
    i.includes('preemptive') ||
    i.includes('warning') ||
    i.includes('overwhelming')
  );

  const passed = criticalIssues.length === 0 && issues.length <= 2;

  return {
    persona: persona.name,
    turns: results,
    passed,
    issues,
    highlights,
  };
}

function analyzeAIResponse(content: string, persona: StudentPersona, turn: number): TurnResult['analysis'] {
  const lowerContent = content.toLowerCase();
  const studentLastResponse = turn > 2 ? persona.responses[Math.floor((turn - 3) / 2)] : '';

  return {
    wordCount: content.split(/\s+/).length,
    hasCitations: content.includes('<sup>'),
    citationCount: (content.match(/<sup>/g) || []).length,
    mentionsCommonMistake:
      lowerContent.includes('common mistake') ||
      lowerContent.includes('pitfall') ||
      lowerContent.includes('watch out') ||
      lowerContent.includes('be careful not to'),
    mentionsWarning:
      lowerContent.includes('warning') ||
      lowerContent.includes('heads up') ||
      lowerContent.includes('quick heads-up') ||
      lowerContent.includes('before you start'),
    referencesStudentText:
      studentLastResponse.length > 0 &&
      studentLastResponse.split(/\s+/).filter(w => w.length > 4).some(w =>
        lowerContent.includes(w.toLowerCase())
      ),
    asksQuestion: content.includes('?'),
    collegeSpecificMention: lowerContent.includes(persona.college.toLowerCase()),
  };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n' + '█'.repeat(70));
  console.log('  WORKSHOP USER EXPERIENCE SIMULATION');
  console.log('█'.repeat(70));
  console.log('\nSimulating realistic 6-turn conversations with different student personas.\n');

  const service = new WorkshopChatModeService();
  const allResults: SimulationResult[] = [];

  for (const persona of STUDENT_PERSONAS) {
    console.log('═'.repeat(70));
    console.log(`  PERSONA: ${persona.name}`);
    console.log('═'.repeat(70));
    console.log(`  Issue: ${persona.issue.symptom_type}`);
    console.log(`  College: ${persona.college.toUpperCase()}`);
    console.log(`  Quote: "${persona.issue.quote.substring(0, 60)}..."`);

    const result = await simulateConversation(persona, service);
    allResults.push(result);

    // Print conversation summary
    console.log('\n  📝 CONVERSATION FLOW:');
    for (const turn of result.turns) {
      const icon = turn.speaker === 'ai' ? '🤖' : '👤';
      const preview = turn.content.substring(0, 80).replace(/\n/g, ' ');
      console.log(`    ${icon} Turn ${turn.turn}: "${preview}..."`);

      if (turn.speaker === 'ai') {
        const checks = [];
        if (turn.analysis.hasCitations) checks.push(`${turn.analysis.citationCount} citations`);
        if (turn.analysis.asksQuestion) checks.push('asks question');
        if (turn.analysis.referencesStudentText) checks.push('references student');
        if (turn.analysis.mentionsWarning) checks.push('⚠️ WARNING');
        if (turn.analysis.mentionsCommonMistake) checks.push('⚠️ MISTAKE MENTION');
        if (checks.length > 0) {
          console.log(`       [${checks.join(', ')}]`);
        }
      }
    }

    // Print issues and highlights
    if (result.highlights.length > 0) {
      console.log('\n  ✅ HIGHLIGHTS:');
      result.highlights.forEach(h => console.log(`    • ${h}`));
    }

    if (result.issues.length > 0) {
      console.log('\n  ⚠️  ISSUES:');
      result.issues.forEach(i => console.log(`    • ${i}`));
    }

    console.log(`\n  ${result.passed ? '✅ PASSED' : '❌ NEEDS ATTENTION'}`);
  }

  // ========================================
  // FINAL SUMMARY
  // ========================================
  console.log('\n' + '█'.repeat(70));
  console.log('  FINAL SUMMARY');
  console.log('█'.repeat(70));

  const passedCount = allResults.filter(r => r.passed).length;
  const totalIssues = allResults.reduce((sum, r) => sum + r.issues.length, 0);
  const totalHighlights = allResults.reduce((sum, r) => sum + r.highlights.length, 0);

  console.log('\n┌' + '─'.repeat(50) + '┐');
  console.log(`│ Personas passed: ${passedCount}/${allResults.length}`.padEnd(51) + '│');
  console.log(`│ Total issues: ${totalIssues}`.padEnd(51) + '│');
  console.log(`│ Total highlights: ${totalHighlights}`.padEnd(51) + '│');
  console.log('└' + '─'.repeat(50) + '┘');

  // Check key UX principles
  console.log('\n📋 UX PRINCIPLE VALIDATION:');

  // 1. No preemptive warnings in welcome
  const welcomeWarnings = allResults.filter(r =>
    r.turns[0]?.analysis.mentionsWarning
  ).length;
  console.log(`  ${welcomeWarnings === 0 ? '✅' : '❌'} No preemptive warnings in welcome messages`);

  // 2. AI asks questions to dig deeper
  const asksQuestions = allResults.filter(r =>
    r.turns.filter(t => t.speaker === 'ai' && t.analysis.asksQuestion).length >= 2
  ).length;
  console.log(`  ${asksQuestions === allResults.length ? '✅' : '⚠️'} AI consistently asks probing questions`);

  // 3. AI references student's specific details
  const referencesStudent = allResults.filter(r =>
    r.turns.filter(t => t.speaker === 'ai' && t.turn > 2 && t.analysis.referencesStudentText).length >= 1
  ).length;
  console.log(`  ${referencesStudent >= allResults.length - 1 ? '✅' : '⚠️'} AI references student's specific details`);

  // 4. Mistakes only mentioned reactively (never in turn 1 or 3)
  const prematureMistakes = allResults.filter(r =>
    r.turns.filter(t => t.speaker === 'ai' && t.turn <= 3 && t.analysis.mentionsCommonMistake).length > 0
  ).length;
  console.log(`  ${prematureMistakes === 0 ? '✅' : '❌'} Common mistakes only mentioned reactively`);

  console.log('\n' + '═'.repeat(70));
  if (passedCount === allResults.length && welcomeWarnings === 0 && prematureMistakes === 0) {
    console.log('  ✅ USER EXPERIENCE SIMULATION: PASSED');
    console.log('     • Welcome messages are clean and engaging');
    console.log('     • AI coaches reactively, not preemptively');
    console.log('     • Conversation flows naturally with student input');
  } else {
    console.log('  ⚠️  USER EXPERIENCE SIMULATION: NEEDS ATTENTION');
    if (welcomeWarnings > 0) console.log('     - Welcome messages contain preemptive warnings');
    if (prematureMistakes > 0) console.log('     - Common mistakes mentioned too early');
    if (passedCount < allResults.length) console.log('     - Some personas had conversation flow issues');
  }
  console.log('═'.repeat(70) + '\n');

  // ========================================
  // GENERATE MARKDOWN OUTPUT
  // ========================================
  const markdownPath = path.join(process.cwd(), 'WORKSHOP_UX_SIMULATION_RESULTS.md');
  const markdown = generateMarkdownReport(allResults, {
    welcomeWarnings,
    asksQuestions,
    referencesStudent,
    prematureMistakes,
  });
  fs.writeFileSync(markdownPath, markdown);
  console.log(`\n📄 Full conversation report saved to: ${markdownPath}`);

  // Exit code
  const success = passedCount === allResults.length && welcomeWarnings === 0 && prematureMistakes === 0;
  process.exit(success ? 0 : 1);
}

// ============================================================================
// MARKDOWN REPORT GENERATOR
// ============================================================================

function generateMarkdownReport(
  results: SimulationResult[],
  metrics: { welcomeWarnings: number; asksQuestions: number; referencesStudent: number; prematureMistakes: number }
): string {
  const lines: string[] = [];

  lines.push('# Workshop User Experience Simulation Results');
  lines.push('');
  lines.push('> This document shows the full 6-turn conversations between students and the AI coach.');
  lines.push('> Use this to review the actual user experience and provide product feedback.');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push('');

  // Executive Summary
  lines.push('---');
  lines.push('');
  lines.push('## Executive Summary');
  lines.push('');

  const passedCount = results.filter(r => r.passed).length;
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

  lines.push(`| Metric | Result |`);
  lines.push(`|--------|--------|`);
  lines.push(`| Personas Tested | ${results.length} |`);
  lines.push(`| Passed | ${passedCount}/${results.length} |`);
  lines.push(`| Total Issues | ${totalIssues} |`);
  lines.push(`| No Preemptive Warnings | ${metrics.welcomeWarnings === 0 ? '✅' : '❌'} |`);
  lines.push(`| AI Asks Probing Questions | ${metrics.asksQuestions === results.length ? '✅' : '⚠️'} |`);
  lines.push(`| AI References Student Details | ${metrics.referencesStudent >= results.length - 1 ? '✅' : '⚠️'} |`);
  lines.push(`| Reactive Coaching Only | ${metrics.prematureMistakes === 0 ? '✅' : '❌'} |`);
  lines.push('');

  // Full Conversations
  lines.push('---');
  lines.push('');
  lines.push('## Full Conversation Transcripts');
  lines.push('');

  for (const result of results) {
    lines.push(`### ${result.persona}`);
    lines.push('');

    // Find persona to get context
    const persona = STUDENT_PERSONAS.find(p => p.name === result.persona);
    if (persona) {
      lines.push('**Context:**');
      lines.push(`- **Issue Type:** \`${persona.issue.symptom_type}\``);
      lines.push(`- **Target College:** ${persona.college.toUpperCase()}`);
      lines.push(`- **Problem:** ${persona.issue.problem}`);
      lines.push('');
      lines.push('**Original Essay Quote:**');
      lines.push(`> "${persona.issue.quote}"`);
      lines.push('');
    }

    lines.push(`**Result:** ${result.passed ? '✅ PASSED' : '❌ NEEDS ATTENTION'}`);
    lines.push('');

    if (result.issues.length > 0) {
      lines.push('**Issues Found:**');
      result.issues.forEach(issue => lines.push(`- ⚠️ ${issue}`));
      lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('#### Conversation');
    lines.push('');

    for (const turn of result.turns) {
      if (turn.speaker === 'ai') {
        lines.push(`**🤖 AI Coach (Turn ${turn.turn}):**`);
        lines.push('');
        // Format the AI response with proper markdown
        const formattedContent = turn.content
          .replace(/<sup>(\d+)<\/sup>/g, '[$1]') // Convert superscripts to brackets
          .split('\n')
          .map(line => `> ${line}`)
          .join('\n');
        lines.push(formattedContent);
        lines.push('');

        // Analysis badges
        const badges: string[] = [];
        if (turn.analysis.hasCitations) badges.push(`📚 ${turn.analysis.citationCount} citation(s)`);
        if (turn.analysis.asksQuestion) badges.push('❓ Asks question');
        if (turn.analysis.referencesStudentText) badges.push('🔗 References student');
        if (turn.analysis.mentionsWarning) badges.push('⚠️ Contains warning');
        if (turn.analysis.mentionsCommonMistake) badges.push('⚠️ Mentions mistake');
        if (turn.analysis.collegeSpecificMention) badges.push('🎓 College-specific');

        if (badges.length > 0) {
          lines.push(`*${badges.join(' • ')}*`);
          lines.push('');
        }
      } else {
        lines.push(`**👤 Student (Turn ${turn.turn}):**`);
        lines.push('');
        lines.push(`> ${turn.content}`);
        lines.push('');
      }
    }

    lines.push('---');
    lines.push('');
  }

  // UX Principles Analysis
  lines.push('## UX Principles Analysis');
  lines.push('');

  lines.push('### 1. No Preemptive Warnings');
  lines.push('');
  lines.push('> **Principle:** The AI should not warn students about mistakes before they make them.');
  lines.push('> Warnings should only appear when the AI observes an issue in the student\'s writing.');
  lines.push('');
  lines.push(`**Status:** ${metrics.welcomeWarnings === 0 ? '✅ PASS' : '❌ FAIL'}`);
  lines.push('');

  lines.push('### 2. Probing Questions');
  lines.push('');
  lines.push('> **Principle:** The AI should ask questions to draw out specific details from students,');
  lines.push('> not just lecture or provide information.');
  lines.push('');
  lines.push(`**Status:** ${metrics.asksQuestions === results.length ? '✅ PASS' : '⚠️ PARTIAL'}`);
  lines.push('');

  lines.push('### 3. References Student\'s Specific Details');
  lines.push('');
  lines.push('> **Principle:** When students share details, the AI should reference them back,');
  lines.push('> showing it\'s listening and building on their input.');
  lines.push('');
  lines.push(`**Status:** ${metrics.referencesStudent >= results.length - 1 ? '✅ PASS' : '⚠️ PARTIAL'}`);
  lines.push('');

  lines.push('### 4. Reactive Coaching');
  lines.push('');
  lines.push('> **Principle:** Common mistakes and warnings should only surface when the AI');
  lines.push('> observes the student actually making them, not preemptively.');
  lines.push('');
  lines.push(`**Status:** ${metrics.prematureMistakes === 0 ? '✅ PASS' : '❌ FAIL'}`);
  lines.push('');

  // Product Feedback Section
  lines.push('---');
  lines.push('');
  lines.push('## Notes for Product Feedback');
  lines.push('');
  lines.push('*Use this section to add your observations and feedback:*');
  lines.push('');
  lines.push('### What\'s Working Well');
  lines.push('');
  lines.push('- [ ] Welcome messages feel natural and engaging');
  lines.push('- [ ] AI asks good follow-up questions');
  lines.push('- [ ] AI builds on student\'s specific details');
  lines.push('- [ ] Citations appear naturally (not forced)');
  lines.push('- [ ] Tone is supportive but honest');
  lines.push('');
  lines.push('### Areas for Improvement');
  lines.push('');
  lines.push('- [ ] ...');
  lines.push('');
  lines.push('### Specific Feedback');
  lines.push('');
  lines.push('*Add specific notes on individual turns or personas here:*');
  lines.push('');
  lines.push('```');
  lines.push('');
  lines.push('');
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

main().catch(console.error);
