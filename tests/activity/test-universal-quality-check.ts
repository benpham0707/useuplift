/**
 * Universal Quality Check Test
 *
 * Verifies that all response patterns maintain consistent high quality.
 * Pattern-specific tweaks should be subtle enhancements, not completely different approaches.
 *
 * QUALITY CRITERIA (must pass for ALL patterns):
 * 1. References something specific the student said (exact quoting)
 * 2. Feels conversational, not interrogating
 * 3. Teaching is concise (one-liner max, not lecture)
 * 4. Question is clear and easy to understand
 * 5. Tone is warm and encouraging
 * 6. No generic filler phrases ("I appreciate you sharing", etc.)
 */

import '../utils/loadEnv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { dynamicConversationEngine } from '../../src/services/portfolioStrategy/services/activityWorkshop/chat/dynamicConversationEngine';
import { conversationModeService } from '../../src/services/portfolioStrategy/services/activityWorkshop/chat/conversationModeService';
import { createEmptyProfile } from '../../src/services/portfolioStrategy/services/activityWorkshop/profile/types';
import { ExtractionResult } from '../../src/services/portfolioStrategy/services/activityWorkshop/chat/types';

// ============================================================================
// TEST SCENARIOS - Realistic student responses across different patterns
// ============================================================================

interface TestScenario {
  name: string;
  pattern: 'humble' | 'reluctant' | 'terse' | 'engaged' | 'tangential';
  activityType: string;
  conversationHistory: Array<{
    question: string;
    response: string;
    extractionQuality: 'rich' | 'moderate' | 'sparse' | 'empty';
  }>;
  nextBaseQuestion: string;
  targetField: string;
  /** Optional: student's existing description being workshopped */
  currentDescription?: string;
  /** Optional: target platform (affects char limit) */
  targetPlatform?: 'common_app' | 'uc' | 'coalition';
  /** Optional: pre-computed analysis insights ("I've already studied your file") */
  analysisInsights?: {
    tier: 1 | 2 | 3 | 4;
    tierConfidence: 'high' | 'medium' | 'low';
    strengths: string[];
    gaps: string[];
    descriptionIssues: string[];
    improvementPriorities: string[];
  };
}

const scenarios: TestScenario[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 1: ENGAGED STUDENT - Shares freely, detailed responses
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Engaged Student - Robotics',
    pattern: 'engaged',
    activityType: 'Robotics Club',
    conversationHistory: [
      {
        question: "Tell me about your involvement in the robotics club.",
        response: "I've been in robotics since sophomore year and became the programming lead this year. I built the autonomous navigation system using computer vision - our robot can now identify game pieces 40% faster than last year. I also trained 4 new members on Python and helped them debug their first programs. We made it to state championships!",
        extractionQuality: 'rich',
      },
    ],
    nextBaseQuestion: "What was the most challenging technical problem you solved?",
    targetField: 'meaning.hardestChallenge',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 2: HUMBLE STUDENT - Downplays achievements
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Humble Student - Tutoring',
    pattern: 'humble',
    activityType: 'Peer Tutoring Program',
    conversationHistory: [
      {
        question: "Tell me about your role in the tutoring program.",
        response: "I just helped some kids with their math homework. It's really not that impressive - anyone could do it. The other tutors were way better than me. My students did improve their grades from C- to B+ but that was mostly their own effort, I just explained things.",
        extractionQuality: 'moderate',
      },
    ],
    nextBaseQuestion: "How many students did you work with regularly?",
    targetField: 'facts.scale.peopleDirectlyImpacted',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 3: RELUCTANT STUDENT - Uncomfortable sharing
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Reluctant Student - Volunteer Work',
    pattern: 'reluctant',
    activityType: 'Hospital Volunteer',
    conversationHistory: [
      {
        question: "What made you want to volunteer at the hospital?",
        response: "I don't know, my mom made me do it at first. It's whatever. I guess I helped out sometimes. Nothing special really.",
        extractionQuality: 'sparse',
      },
    ],
    nextBaseQuestion: "What did a typical day look like for you there?",
    targetField: 'facts.methodology',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 4: TERSE STUDENT - Short, minimal answers
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Terse Student - Newspaper',
    pattern: 'terse',
    activityType: 'School Newspaper',
    conversationHistory: [
      {
        question: "How did you get involved with the school newspaper?",
        response: "Joined freshman year.",
        extractionQuality: 'sparse',
      },
      {
        question: "What drew you to journalism?",
        response: "I like writing.",
        extractionQuality: 'sparse',
      },
    ],
    nextBaseQuestion: "What kinds of articles have you written?",
    targetField: 'facts.scale.resourcesCreated',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 5: TANGENTIAL STUDENT - Goes off-topic
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Tangential Student - Debate',
    pattern: 'tangential',
    activityType: 'Debate Team',
    conversationHistory: [
      {
        question: "Tell me about your experience on the debate team.",
        response: "Oh debate is so interesting! Did you know the first organized debate society was in London? I read about it last summer. My friend Jake is really into philosophy and we always argue about stuff. Speaking of which, I had this amazing conversation about free will the other day. Oh right, debate team - yeah I joined last year.",
        extractionQuality: 'sparse',
      },
    ],
    nextBaseQuestion: "What was your biggest accomplishment on the team?",
    targetField: 'impact.achievements',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 6: ENGAGED WITH NUMBERS - Strong quantitative details
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Engaged Student with Numbers - Club President',
    pattern: 'engaged',
    activityType: 'Environmental Club',
    conversationHistory: [
      {
        question: "Tell me about leading the environmental club.",
        response: "I became president junior year and grew membership from 12 to 45 students. We organized 6 campus cleanups, planted 200 trees, and reduced cafeteria waste by 30%. I also secured $2,000 in grants from local businesses to fund our initiatives. This year we're partnering with the city for a bigger recycling program.",
        extractionQuality: 'rich',
      },
    ],
    nextBaseQuestion: "What was the hardest part about leading these initiatives?",
    targetField: 'meaning.hardestChallenge',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 7: HUMBLE WITH BEFORE/AFTER - Has impact but undersells
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Humble Student with Impact - Music',
    pattern: 'humble',
    activityType: 'Orchestra',
    conversationHistory: [
      {
        question: "Tell me about your role in the orchestra.",
        response: "I'm just the concertmaster but it's really not a big deal. I mean, I helped the violin section go from playing kind of rough to winning our regional competition, but honestly the conductor did all the real work. I just practiced a lot and helped the younger kids with their technique sometimes.",
        extractionQuality: 'moderate',
      },
    ],
    nextBaseQuestion: "How did you help the younger students specifically?",
    targetField: 'impact.beforeAfter',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 8: WORKSHOPPING VAGUE DESCRIPTION - Has existing description to improve
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Workshopping Vague Description - Science Club',
    pattern: 'engaged',
    activityType: 'Science Club',
    currentDescription: 'Helped with many science projects and contributed to team success.',
    targetPlatform: 'common_app',
    conversationHistory: [
      {
        question: "Your description says 'helped with many science projects' — can you give me a specific example?",
        response: "Oh yeah, so I led the water quality testing project where we analyzed samples from 12 local streams. We presented our findings to the city council and they actually used our data to improve the filtration system.",
        extractionQuality: 'rich',
      },
    ],
    nextBaseQuestion: "How many students were on your team for that project?",
    targetField: 'facts.scale.peopleDirectlyImpacted',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 9: WORKSHOPPING FOR UC - Longer format (350 chars)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Workshopping UC Description - Community Service',
    pattern: 'engaged',
    activityType: 'Community Garden',
    currentDescription: 'Worked at the community garden helping with various tasks and teaching people about sustainable gardening practices.',
    targetPlatform: 'uc',
    conversationHistory: [
      {
        question: "Your description mentions 'teaching people about sustainable gardening' — how many people did you teach?",
        response: "We run workshops every Saturday and I've taught maybe 150 families over the past two years. I created a curriculum for composting and rainwater harvesting that other volunteers now use too.",
        extractionQuality: 'rich',
      },
    ],
    nextBaseQuestion: "What impact have you seen from families implementing what you taught?",
    targetField: 'impact.beforeAfter',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 10: HUMBLE STUDENT WITH VAGUE DESCRIPTION - Undersells in both
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Humble Student Workshopping - Tutoring',
    pattern: 'humble',
    activityType: 'Math Tutoring',
    currentDescription: 'Helped some students with math homework after school.',
    targetPlatform: 'common_app',
    conversationHistory: [
      {
        question: "Your description says 'helped some students' — roughly how many students was that?",
        response: "Oh I don't know, maybe like 15 kids? But it was really nothing special, they just needed help with algebra and I'm okay at math I guess.",
        extractionQuality: 'moderate',
      },
    ],
    nextBaseQuestion: "How often did you meet with them?",
    targetField: 'facts.timeInvestment.hoursPerWeek',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 11: WITH ANALYSIS INSIGHTS - "I've already studied your file"
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Analysis-Informed Workshopping - Research Project',
    pattern: 'engaged',
    activityType: 'Independent Research',
    currentDescription: 'Conducted research on microplastics in local waterways.',
    targetPlatform: 'common_app',
    analysisInsights: {
      tier: 2,
      tierConfidence: 'medium',
      strengths: [
        'Independent research shows initiative',
        'Environmental topic with real-world relevance',
      ],
      gaps: [
        'No mention of outcomes or findings',
        'Missing: how many samples, what methodology',
        'Unknown: any external recognition or publication',
      ],
      descriptionIssues: [
        '"Conducted research" is passive — what did YOU do?',
        'No numbers or scale mentioned',
        'No impact or outcome stated',
      ],
      improvementPriorities: [
        'Add specific methodology and scale (sample count, time)',
        'Include findings or conclusions',
        'Mention any external validation (presentation, publication, award)',
      ],
    },
    conversationHistory: [
      {
        question: "You mentioned researching microplastics — can you tell me more about your methodology?",
        response: "I collected water samples from 8 different sites over 6 months. Used a filtration method I adapted from a published paper. Found that microplastic concentration was 3x higher downstream from the water treatment plant.",
        extractionQuality: 'rich',
      },
    ],
    nextBaseQuestion: "What did you do with these findings?",
    targetField: 'impact.outcomes',
  },
];

// ============================================================================
// QUALITY CRITERIA - Universal standards for ALL patterns
// ============================================================================

interface QualityCheck {
  name: string;
  check: (response: string, teachingMoment?: string, scenario?: TestScenario) => boolean;
  description: string;
}

const UNIVERSAL_QUALITY_CRITERIA: QualityCheck[] = [
  {
    name: 'References Student\'s Words',
    description: 'Response quotes or references something specific the student said',
    check: (response, _, scenario) => {
      if (!scenario) return false;
      const lastResponse = scenario.conversationHistory[scenario.conversationHistory.length - 1].response;
      const keywords = lastResponse.toLowerCase().match(/\b\w{4,}\b/g) || [];
      // Check if any significant word from their response appears in our response
      return keywords.some(word =>
        !['that', 'this', 'what', 'when', 'where', 'which', 'there', 'their', 'just', 'like', 'really'].includes(word) &&
        response.toLowerCase().includes(word)
      );
    },
  },
  {
    name: 'Conversational Tone',
    description: 'Feels like natural conversation, not an interview or form',
    check: (response) => {
      // Should NOT have formal/robotic phrases
      const formalPhrases = [
        'i appreciate you sharing',
        'thank you for your response',
        'please elaborate on',
        'could you please provide',
        'i would like to know',
      ];
      const hasFormal = formalPhrases.some(phrase => response.toLowerCase().includes(phrase));

      // Should have conversational elements
      const conversationalElements = [
        'you mentioned',
        'you said',
        'i hear',
        'sounds like',
        'that\'s',
        'what',
        'how',
        'when',
        'can you',
        'walk me',
        'tell me',
      ];
      const hasConversational = conversationalElements.some(el => response.toLowerCase().includes(el));

      return !hasFormal && hasConversational;
    },
  },
  {
    name: 'Concise Teaching',
    description: 'Teaching moment (if any) is under 35 chars, no dashes',
    check: (_, teachingMoment) => {
      if (!teachingMoment) return true; // No teaching is fine
      // Teaching should be under 35 characters, no dashes or semicolons, one phrase
      const hasDash = teachingMoment.includes('—') || teachingMoment.includes(' - ') || teachingMoment.includes(';');
      const hasMidPeriod = (teachingMoment.match(/\./g) || []).length > 1; // Multiple periods = multiple sentences
      return teachingMoment.length <= 35 && !hasDash && !hasMidPeriod;
    },
  },
  {
    name: 'Clear Question',
    description: 'Contains a clear, answerable question',
    check: (response) => {
      // Must end with a question or contain a clear question
      const hasQuestion = response.includes('?');
      const hasQuestionWords = ['what', 'how', 'when', 'where', 'why', 'can you', 'could you', 'walk me', 'tell me'].some(
        word => response.toLowerCase().includes(word)
      );
      return hasQuestion && hasQuestionWords;
    },
  },
  {
    name: 'Warm Tone',
    description: 'Feels encouraging, not cold or transactional',
    check: (response) => {
      // Should NOT be too short/curt (under 30 chars is probably too abrupt)
      if (response.length < 30) return false;

      // Should NOT have harsh/cold phrases
      const coldPhrases = ['you need to', 'you should', 'you must', 'you have to', 'incorrect', 'wrong'];
      const hasCold = coldPhrases.some(phrase => response.toLowerCase().includes(phrase));

      return !hasCold;
    },
  },
  {
    name: 'No Generic Filler',
    description: 'Avoids empty validation phrases at start of response',
    check: (response) => {
      const genericFillers = [
        'that\'s great',
        'that\'s wonderful',
        'that\'s amazing',
        'this is fantastic',
        'this is great',
        'this is wonderful',
        'is fantastic',
        'is huge',
        'is impressive',
        'i really appreciate',
        'i appreciate you',
        'thanks for sharing',
        'thank you for sharing',
        'thanks for telling',
        'great job',
        'well done',
        'fantastic',
        'excellent work',
        'i love that',
        'how exciting',
        'that\'s impressive',
        'that\'s really interesting',
      ];
      const lowerResponse = response.toLowerCase();
      // Check if response STARTS with filler (most egregious)
      const startsWithFiller = genericFillers.some(filler =>
        lowerResponse.startsWith(filler) || lowerResponse.startsWith(filler.replace(/^(that's|this is) /, ''))
      );
      // Also check if filler appears anywhere
      const containsFiller = genericFillers.some(filler => lowerResponse.includes(filler));
      return !startsWithFiller && !containsFiller;
    },
  },
];

// ============================================================================
// TEST EXECUTION
// ============================================================================

interface ScenarioResult {
  scenario: TestScenario;
  generatedResponse: string;
  teachingMoment?: string;
  qualityAnchor?: string;
  quotedPhrases?: string[];
  tone: string;
  reasoning: string;
  qualityChecks: Array<{ name: string; passed: boolean; description: string }>;
  overallPass: boolean;
  /** Description workshopping fields */
  descriptionFocus?: string;
  descriptionSuggestion?: {
    improvedText: string;
    changes: string;
    charCount: number;
  };
}

async function runScenario(scenario: TestScenario): Promise<ScenarioResult> {
  const profile = createEmptyProfile('test', scenario.activityType);

  // Build dynamics
  let dynamics = conversationModeService.createInitialDynamics();

  for (let i = 0; i < scenario.conversationHistory.length; i++) {
    const turn = scenario.conversationHistory[i];
    dynamics = conversationModeService.updateDynamics(
      dynamics,
      turn.extractionQuality,
      turn.extractionQuality === 'rich' ? 5 : turn.extractionQuality === 'moderate' ? 2 : 0,
      turn.response,
      profile,
      i + 1
    );
  }

  // Create mock extraction for history
  const conversationHistory = scenario.conversationHistory.map(turn => ({
    question: turn.question,
    response: turn.response,
    extraction: {
      extractedFields: [],
      authenticQuotes: [],
      needsClarification: [],
      implicitFindings: [],
      extractionQuality: turn.extractionQuality,
      suggestedFollowUps: [],
    } as ExtractionResult,
  }));

  // Generate dynamic question
  const result = await dynamicConversationEngine.generateDynamicQuestion({
    baseQuestion: scenario.nextBaseQuestion,
    targetField: scenario.targetField,
    activityTitle: scenario.activityType,
    dynamics,
    conversationHistory,
    profile,
    extractedHighlights: [],
    turnNumber: scenario.conversationHistory.length + 1,
    currentDescription: scenario.currentDescription,
    targetPlatform: scenario.targetPlatform,
    analysisInsights: scenario.analysisInsights,
  });

  // Run quality checks
  const qualityChecks = UNIVERSAL_QUALITY_CRITERIA.map(criteria => ({
    name: criteria.name,
    description: criteria.description,
    passed: criteria.check(result.question, result.teachingMoment, scenario),
  }));

  const overallPass = qualityChecks.every(check => check.passed);

  return {
    scenario,
    generatedResponse: result.question,
    teachingMoment: result.teachingMoment,
    qualityAnchor: result.qualityAnchor,
    quotedPhrases: result.quotedPhrases,
    tone: result.tone,
    reasoning: result.reasoning,
    qualityChecks,
    overallPass,
    descriptionFocus: result.descriptionFocus,
    descriptionSuggestion: result.descriptionSuggestion,
  };
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateMarkdownReport(results: ScenarioResult[]): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const passedCount = results.filter(r => r.overallPass).length;
  const totalCount = results.length;

  let md = `# Dynamic Conversation Engine - Quality Check Report

**Generated:** ${timestamp}
**Overall Pass Rate:** ${passedCount}/${totalCount} scenarios (${Math.round(passedCount/totalCount*100)}%)

---

## Executive Summary

This report verifies that the Dynamic Conversation Engine maintains **universal high quality** across all student response patterns. Pattern-specific adaptations are **subtle tweaks**, not completely different approaches.

### Universal Quality Criteria (Applied to ALL Patterns)

| Criteria | Description |
|----------|-------------|
| References Student's Words | Response quotes or references something specific the student said |
| Conversational Tone | Feels like natural conversation, not an interview |
| Concise Teaching | Teaching moment (if any) is one sentence max |
| Clear Question | Contains a clear, answerable question |
| Warm Tone | Feels encouraging, not cold or transactional |
| No Generic Filler | Avoids empty validation phrases |

---

## Pattern-by-Pattern Results

`;

  // Group by pattern
  const byPattern: Record<string, ScenarioResult[]> = {};
  for (const result of results) {
    const pattern = result.scenario.pattern;
    if (!byPattern[pattern]) byPattern[pattern] = [];
    byPattern[pattern].push(result);
  }

  for (const [pattern, patternResults] of Object.entries(byPattern)) {
    const patternPassed = patternResults.filter(r => r.overallPass).length;
    const patternEmoji = patternPassed === patternResults.length ? '✅' : '⚠️';

    md += `### ${patternEmoji} ${pattern.toUpperCase()} Students (${patternPassed}/${patternResults.length} passed)

`;

    for (const result of patternResults) {
      const emoji = result.overallPass ? '✅' : '❌';

      md += `#### ${emoji} ${result.scenario.name}

**Activity:** ${result.scenario.activityType}

**Student Said:**
> "${result.scenario.conversationHistory[result.scenario.conversationHistory.length - 1].response}"

**Base Question:** "${result.scenario.nextBaseQuestion}"

---

**🎯 Generated Response:**

> ${result.generatedResponse}

`;

      if (result.teachingMoment) {
        md += `**💡 Teaching Moment:** "${result.teachingMoment}"

`;
      }

      if (result.quotedPhrases && result.quotedPhrases.length > 0) {
        md += `**📝 Phrases Quoted:** ${result.quotedPhrases.map(p => `"${p}"`).join(', ')}

`;
      }

      // Show description workshopping info if present
      if (result.scenario.currentDescription) {
        md += `**📋 Current Description (${result.scenario.targetPlatform || 'common_app'}):**
> "${result.scenario.currentDescription}"

`;
        if (result.descriptionFocus) {
          md += `**🎯 Part Being Workshopped:** "${result.descriptionFocus}"

`;
        }

        if (result.descriptionSuggestion) {
          md += `**✨ Suggested Improvement (${result.descriptionSuggestion.charCount} chars):**
> ${result.descriptionSuggestion.improvedText}

**Changes:** ${result.descriptionSuggestion.changes}

`;
        }
      }

      md += `**Tone:** ${result.tone} | **Reasoning:** ${result.reasoning}

`;

      // Quality checks table
      md += `**Quality Checks:**

| Criteria | Result |
|----------|--------|
`;
      for (const check of result.qualityChecks) {
        const checkEmoji = check.passed ? '✅' : '❌';
        md += `| ${check.name} | ${checkEmoji} |\n`;
      }

      md += `
---

`;
    }
  }

  // Summary section
  md += `## Quality Consistency Analysis

### What Makes This Approach Universal

1. **Structure is Fixed (UX Consistency)**
   - Every response follows: Acknowledgment → Quality Anchor → Teaching → Question
   - Users always know what to expect

2. **Content is Tailored (Personalization)**
   - Exact phrases quoted from their responses
   - Voice matching (casual/formal)
   - Pattern-appropriate emotional tone

3. **Pattern Tweaks are Subtle**
   - HUMBLE: Reframe with discovery questions (not lectures)
   - RELUCTANT: Create safety, ask about what they DID
   - TERSE: Give concrete examples to make answering easier
   - ENGAGED: Keep momentum, don't slow down with validation
   - TANGENTIAL: Acknowledge briefly, redirect

### Quality Metrics Summary

`;

  // Calculate per-criteria pass rates
  const criteriaStats: Record<string, { passed: number; total: number }> = {};
  for (const result of results) {
    for (const check of result.qualityChecks) {
      if (!criteriaStats[check.name]) {
        criteriaStats[check.name] = { passed: 0, total: 0 };
      }
      criteriaStats[check.name].total++;
      if (check.passed) criteriaStats[check.name].passed++;
    }
  }

  md += `| Quality Criteria | Pass Rate |
|------------------|-----------|
`;
  for (const [name, stats] of Object.entries(criteriaStats)) {
    const rate = Math.round(stats.passed / stats.total * 100);
    const emoji = rate === 100 ? '✅' : rate >= 80 ? '🟡' : '❌';
    md += `| ${name} | ${emoji} ${rate}% (${stats.passed}/${stats.total}) |\n`;
  }

  md += `
---

*Report generated by test-universal-quality-check.ts*
`;

  return md;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('  UNIVERSAL QUALITY CHECK - Dynamic Conversation Engine');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  const results: ScenarioResult[] = [];

  for (const scenario of scenarios) {
    console.log(`Testing: ${scenario.name} (${scenario.pattern})...`);
    try {
      const result = await runScenario(scenario);
      results.push(result);

      const passCount = result.qualityChecks.filter(c => c.passed).length;
      const emoji = result.overallPass ? '✅' : '❌';
      console.log(`  ${emoji} ${passCount}/${result.qualityChecks.length} quality checks passed`);
    } catch (error) {
      console.error(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate report
  console.log('\nGenerating quality report...');
  const report = generateMarkdownReport(results);

  const reportPath = path.join(__dirname, '..', '..', 'docs', 'CONVERSATION_QUALITY_REPORT.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\n✅ Report saved to: docs/CONVERSATION_QUALITY_REPORT.md`);

  // Summary
  const passedCount = results.filter(r => r.overallPass).length;
  console.log(`\n═══════════════════════════════════════════════════════════════════════════════`);
  console.log(`  SUMMARY: ${passedCount}/${results.length} scenarios passed all quality checks`);
  console.log(`═══════════════════════════════════════════════════════════════════════════════\n`);

  process.exit(passedCount === results.length ? 0 : 1);
}

main().catch(console.error);
