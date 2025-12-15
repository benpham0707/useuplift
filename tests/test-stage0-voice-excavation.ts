/**
 * Stage 0: Voice Excavation Test
 *
 * This test demonstrates the Voice Excavation system that transforms
 * bland, "essay mode" drafts into compelling narratives with authentic spark.
 *
 * We'll test with TWO essays:
 * 1. A bland "essay mode" intellectual vitality essay (should need full excavation)
 * 2. An already-authentic essay (should skip to Stage 1)
 *
 * The system detects the appropriate emotional register and applies
 * register-specific strategies to excavate authentic voice.
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
  Stage0Service,
} from '../src/services/commonAppWorkshop/services/stage0Service';
import {
  VoiceExcavationInput,
  InterviewResponse,
  REGISTER_NAMES,
} from '../src/services/commonAppWorkshop/types/stage0Types';

// ============================================================================
// TEST ESSAYS
// ============================================================================

/**
 * Essay 1: BLAND "ESSAY MODE" VERSION
 * This hits the metrics but lacks spark. It sounds like what the writer
 * thinks Stanford wants to hear, not like a real person.
 */
const BLAND_ESSAY = `
Throughout my academic journey, I have developed a strong passion for computer science. My interest began in ninth grade when I took my first programming class. The experience of writing code and seeing it come to life was truly inspiring.

In addition to my coursework, I have pursued various extracurricular activities to deepen my understanding. I joined the Computer Science Club, where I collaborated with peers on projects. I also completed an online certification in Python programming.

Furthermore, I have demonstrated my commitment through a summer internship at a local tech company. This experience taught me valuable lessons about teamwork and problem-solving in a professional environment.

Stanford's renowned computer science program would provide the ideal environment to continue my intellectual journey. I am excited about the opportunity to learn from world-class faculty and contribute to the university's innovative community.

In conclusion, my experiences have prepared me to thrive at Stanford and make meaningful contributions to the field of computer science.
`.trim();

/**
 * Essay 2: AUTHENTIC VERSION (Already Has Spark)
 * This has genuine voice, specific moments, and real personality.
 */
const AUTHENTIC_ESSAY = `
The sharks fight over the newest electrical flying rug! Now that's another must watch. Through my middle school addiction to Shark Tank, I watched countless videos on new business ideas that over the course of time, transversed from my phone to the real world. Each airing episode represented a new possible breakthrough, and everytime I watched, I aspired to be the next one. My ideas for frame changing glasses, adjustable stress balls, and compression trash cans, surely one of them will work right? Never did I stop churning my head for "revolutionary" ideas.

Then came my Economics class in 9th grade where I learned how businesses, regardless of scale, can collectively contribute to the changes seen in the world. My high school experience allowed me to test the waters of entrepreneurship as I started my own clothing brand and club. SAUCED, a brand with a noble mission of putting ink to fabric my own artistic and cultural taste. After two years of curating a hefty clothing line supported by an automated shopify ecommerce website, I created Polytechnic High School's Young Entrepreneur Society (YES) where highschoolers can grow confident in knowing how to manifest their passion and hobbies into real life applications.

My next step started when I screamed "I got the offer!" as showed my mom the internship acceptance email from Pocket Latte. Pocket Latte, a sustainable and ethnic minority empowering chocolate start-up where my professional experience flourished. From insightful conversations with hundreds of customers at sampling events, I learned to dive into the customer mindset to understand the deeper drivers of purchasing behavior. As I continue to dive into the depths of the ocean that is business, I hope to meet the sharks soon.
`.trim();

/**
 * Essay 3: MELANCHOLY/LOSS - Different Register
 * Testing that the system correctly identifies different emotional registers.
 */
const MELANCHOLY_ESSAY_BLAND = `
When I was fifteen, my grandfather passed away. This experience taught me valuable lessons about life and family. I learned to appreciate the time I have with loved ones.

My grandfather was an important figure in my life. He taught me many things and I will always remember him. His death was difficult but it made me stronger.

Through this challenge, I developed resilience and empathy. I now understand the importance of cherishing moments with family. This experience has shaped who I am today and prepared me for future challenges.
`.trim();

// ============================================================================
// SIMULATED INTERVIEW RESPONSES
// ============================================================================

/**
 * For the bland CS essay, these are simulated interview responses
 * that would come from the excavation process.
 */
const CS_INTERVIEW_RESPONSES: InterviewResponse[] = [
  {
    questionId: 'q1',
    question: "What's the most embarrassing thing about how much you care about programming?",
    response: "Okay so this is actually really embarrassing but I literally named my first real program 'SkyNet' because I thought I was building AI when really it was just a calculator that could do square roots. I showed my mom and she was like 'that's nice honey' and I genuinely thought I was going to be famous. I was 14. I still have the code somewhere and it's SO BAD but I can't delete it.",
    voiceMarkers: ["literally named", "SO BAD", "can't delete it"],
    emotionalEnergy: 'high',
  },
  {
    questionId: 'q2',
    question: "What's the weirdest rabbit hole you've gone down related to this?",
    response: "I spent three weeks trying to make a program that would predict when my cat was going to knock things off my desk. Like I set up a camera and everything. It didn't work AT ALL but I learned more about computer vision than I did in my actual class. My cat just... doesn't follow patterns. She's chaos incarnate.",
    voiceMarkers: ["AT ALL", "chaos incarnate", "spent three weeks"],
    emotionalEnergy: 'high',
  },
  {
    questionId: 'q3',
    question: "Tell me about a time you got SO excited about coding that you annoyed someone.",
    response: "My roommate at summer camp literally changed bunks because I wouldn't stop talking about this sorting algorithm at 1 AM. Like I understood bubble sort for the first time and I was trying to explain it with his socks and he was like 'I don't care about my socks' but I NEEDED him to understand. We're still friends somehow.",
    voiceMarkers: ["literally changed bunks", "NEEDED him to understand", "somehow"],
    emotionalEnergy: 'high',
  },
];

// ============================================================================
// COST TRACKING
// ============================================================================

interface CostEntry {
  stage: string;
  model: string;
  purpose: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

class CostTracker {
  private entries: CostEntry[] = [];
  private static PRICING = {
    sonnet: { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 },
  };

  addEntry(stage: string, model: string, purpose: string, inputTokens: number, outputTokens: number) {
    const pricing = CostTracker.PRICING.sonnet;
    const cost = (inputTokens * pricing.input) + (outputTokens * pricing.output);
    this.entries.push({ stage, model, purpose, inputTokens, outputTokens, cost });
  }

  getTotalCost(): number {
    return this.entries.reduce((sum, e) => sum + e.cost, 0);
  }

  getEntries(): CostEntry[] {
    return this.entries;
  }

  getSummary(): string {
    const totalInput = this.entries.reduce((sum, e) => sum + e.inputTokens, 0);
    const totalOutput = this.entries.reduce((sum, e) => sum + e.outputTokens, 0);

    let summary = '## Cost Summary\n\n';
    summary += '| Metric | Value |\n';
    summary += '|--------|-------|\n';
    summary += `| Total Input Tokens | ${totalInput.toLocaleString()} |\n`;
    summary += `| Total Output Tokens | ${totalOutput.toLocaleString()} |\n`;
    summary += `| **Total Cost** | **$${this.getTotalCost().toFixed(4)}** |\n\n`;

    summary += '### Cost Breakdown\n\n';
    summary += '| Stage | Purpose | Input | Output | Cost |\n';
    summary += '|-------|---------|-------|--------|------|\n';
    for (const entry of this.entries) {
      summary += `| ${entry.stage} | ${entry.purpose} | ${entry.inputTokens.toLocaleString()} | ${entry.outputTokens.toLocaleString()} | $${entry.cost.toFixed(4)} |\n`;
    }

    return summary;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get register name, handling uppercase from Claude
 */
function getRegisterName(register: string): string {
  const normalized = register.toLowerCase() as keyof typeof REGISTER_NAMES;
  return REGISTER_NAMES[normalized] || register;
}

// ============================================================================
// MARKDOWN OUTPUT GENERATOR
// ============================================================================

function generateMarkdownOutput(
  testName: string,
  essay: string,
  stage0Output: any,
  costTracker: CostTracker
): string {
  let md = `# Voice Excavation Test: ${testName}\n\n`;
  md += `**Generated**: ${new Date().toISOString()}\n\n`;
  md += `---\n\n`;

  // Original Essay
  md += `## Original Essay (${essay.split(/\s+/).length} words)\n\n`;
  md += '```\n';
  md += essay;
  md += '\n```\n\n';

  // Spark Gap Analysis
  md += `## Spark Gap Analysis\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| **Spark Score** | ${stage0Output.analysis.sparkScore}/100 |\n`;
  md += `| **Spark Level** | ${stage0Output.analysis.sparkLevel} |\n`;
  md += `| **Detected Register** | ${getRegisterName(stage0Output.analysis.detectedRegister.primary)} |\n`;
  md += `| **Register Confidence** | ${stage0Output.analysis.detectedRegister.confidence}% |\n`;
  md += `| **Register Fit** | ${stage0Output.analysis.registerFit}/10 |\n`;
  md += `| **Recommendation** | ${stage0Output.analysis.recommendation} |\n\n`;

  // Register Detection
  md += `### Register Detection\n\n`;
  md += `**Primary**: ${getRegisterName(stage0Output.analysis.detectedRegister.primary)}\n\n`;
  md += `**Reasoning**: ${stage0Output.analysis.detectedRegister.reasoning}\n\n`;
  if (stage0Output.analysis.detectedRegister.secondary) {
    md += `**Secondary**: ${getRegisterName(stage0Output.analysis.detectedRegister.secondary)}\n\n`;
  }

  // Essay Mode Issues
  if (stage0Output.analysis.universalIssues.essayModeIndicators.length > 0) {
    md += `### Essay Mode Issues Found\n\n`;
    for (const issue of stage0Output.analysis.universalIssues.essayModeIndicators) {
      md += `**${issue.indicator}** (${issue.severity})\n`;
      md += `> "${issue.quote}"\n\n`;
      md += `*Fix*: ${issue.howToFix}\n\n`;
    }
  }

  // Missing Elements
  if (stage0Output.analysis.universalIssues.missingElements.length > 0) {
    md += `### Missing Spark Elements\n\n`;
    for (const missing of stage0Output.analysis.universalIssues.missingElements) {
      md += `- **${missing.element}**: ${missing.description}\n`;
      md += `  - *Excavate by asking*: ${missing.howToExcavate}\n`;
    }
    md += '\n';
  }

  // Buried Spark
  if (stage0Output.analysis.buriedSpark.length > 0) {
    md += `### Buried Spark Found\n\n`;
    for (const spark of stage0Output.analysis.buriedSpark) {
      md += `**${spark.amplificationPotential} potential**\n`;
      md += `> "${spark.quote}"\n\n`;
      md += `*Why authentic*: ${spark.whyAuthentic}\n\n`;
    }
  }

  // Excavation Questions
  if (stage0Output.excavation?.questionsAsked?.length > 0) {
    md += `### Recommended Excavation Questions\n\n`;
    for (const q of stage0Output.excavation.questionsAsked) {
      md += `${q.id}. **${q.question}**\n`;
      md += `   - Purpose: ${q.purpose}\n`;
      md += `   - Target Register: ${getRegisterName(q.targetRegister)}\n`;
      md += `   - Potential: ${q.potential}\n\n`;
    }
  }

  // Voice-First Draft
  md += `## Voice-First Draft (${stage0Output.voiceFirstDraft.wordCount} words)\n\n`;
  md += '```\n';
  md += stage0Output.voiceFirstDraft.draft;
  md += '\n```\n\n';

  // Draft Metrics
  md += `### Draft Quality Metrics\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Spark Score | ${stage0Output.voiceFirstDraft.metrics.sparkScore}/100 |\n`;
  md += `| Register Fit | ${stage0Output.voiceFirstDraft.metrics.registerFit}/10 |\n`;
  md += `| Authentic Phrases | ${stage0Output.voiceFirstDraft.metrics.authenticPhraseCount} |\n`;
  md += `| Specific Moments | ${stage0Output.voiceFirstDraft.metrics.specificMomentCount} |\n`;
  md += `| Sensory Details | ${stage0Output.voiceFirstDraft.metrics.sensoryDetailCount} |\n`;
  md += `| Stage 1 Ready | ${stage0Output.voiceFirstDraft.stage1Ready ? 'Yes' : 'No'} |\n\n`;

  // Voice Sources
  if (stage0Output.voiceFirstDraft.voiceSources.length > 0) {
    md += `### Voice Sources Used\n\n`;
    for (const source of stage0Output.voiceFirstDraft.voiceSources) {
      md += `- "${source.phrase}" (from ${source.source}${source.preservedExactly ? ', exact' : ''})\n`;
    }
    md += '\n';
  }

  // Preserved Imperfections
  if (stage0Output.voiceFirstDraft.preservedImperfections.length > 0) {
    md += `### Preserved Imperfections\n\n`;
    for (const imp of stage0Output.voiceFirstDraft.preservedImperfections) {
      md += `- "${imp.text}"\n`;
      md += `  - *Kept because*: ${imp.whyKept}\n`;
      md += `  - *Essay mode would*: ${imp.wouldNormallyFix}\n\n`;
    }
  }

  // Risky Choices
  if (stage0Output.voiceFirstDraft.riskyChoices.length > 0) {
    md += `### Risky Choices Made\n\n`;
    for (const risk of stage0Output.voiceFirstDraft.riskyChoices) {
      md += `- "${risk.choice}"\n`;
      md += `  - *Risk*: ${risk.risk}\n`;
      md += `  - *Worth it because*: ${risk.whyWorthIt}\n\n`;
    }
  }

  // Stage 1 Handoff
  md += `## Stage 1 Handoff\n\n`;
  md += `### Voice Context\n\n`;
  md += `**Authentic Phrases to Preserve**:\n`;
  for (const phrase of stage0Output.stage1Handoff.voiceContext.authenticPhrases) {
    md += `- "${phrase}"\n`;
  }
  md += '\n';

  md += `**Voice Quirks**:\n`;
  for (const quirk of stage0Output.stage1Handoff.voiceContext.voiceQuirks) {
    md += `- ${quirk}\n`;
  }
  md += '\n';

  if (stage0Output.stage1Handoff.preservationWarnings.length > 0) {
    md += `### Preservation Warnings (DO NOT POLISH AWAY)\n\n`;
    for (const warning of stage0Output.stage1Handoff.preservationWarnings) {
      md += `- ${warning}\n`;
    }
    md += '\n';
  }

  // Cost Summary
  md += `---\n\n`;
  md += costTracker.getSummary();

  return md;
}

// ============================================================================
// MAIN TEST
// ============================================================================

async function runTest() {
  console.log('================================================================================');
  console.log('STAGE 0: VOICE EXCAVATION TEST');
  console.log('================================================================================\n');

  const service = new Stage0Service();
  const costTracker = new CostTracker();
  let fullOutput = '';

  // ============================================================================
  // TEST 1: Bland Essay → Full Excavation
  // ============================================================================

  console.log('────────────────────────────────────────────────────────────────────────────────');
  console.log('TEST 1: Bland "Essay Mode" CS Essay');
  console.log('────────────────────────────────────────────────────────────────────────────────\n');

  const blandInput: VoiceExcavationInput = {
    rawDraft: BLAND_ESSAY,
    essayPrompt: 'Reflect on an idea or experience that makes you genuinely excited about learning. (Stanford Intellectual Vitality)',
    collegeId: 'stanford',
  };

  console.log('  Running Stage 0 on bland essay...\n');

  const blandResult = await service.runStage0(blandInput, CS_INTERVIEW_RESPONSES, 300);

  costTracker.addEntry(
    'Stage 0',
    'Sonnet',
    'Spark Gap Analysis',
    blandResult.costTracking.analysisTokens.input,
    blandResult.costTracking.analysisTokens.output
  );
  costTracker.addEntry(
    'Stage 0',
    'Sonnet',
    'Voice-First Draft',
    blandResult.costTracking.draftGenerationTokens.input,
    blandResult.costTracking.draftGenerationTokens.output
  );

  // Normalize register (Claude might return uppercase)
  const blandRegister = blandResult.analysis.detectedRegister.primary.toLowerCase() as keyof typeof REGISTER_NAMES;

  console.log(`\n  Results:`);
  console.log(`    Original Spark Score: ${blandResult.analysis.sparkScore}/100 (${blandResult.analysis.sparkLevel})`);
  console.log(`    Detected Register: ${REGISTER_NAMES[blandRegister] || blandResult.analysis.detectedRegister.primary}`);
  console.log(`    Recommendation: ${blandResult.analysis.recommendation}`);
  console.log(`    New Draft Spark Score: ${blandResult.voiceFirstDraft.metrics.sparkScore}/100`);
  console.log(`    Stage 1 Ready: ${blandResult.voiceFirstDraft.stage1Ready}`);

  fullOutput += generateMarkdownOutput('Bland CS Essay → Voice Excavation', BLAND_ESSAY, blandResult, costTracker);
  fullOutput += '\n\n---\n\n';

  // ============================================================================
  // TEST 2: Authentic Essay → Should Skip to Stage 1
  // ============================================================================

  console.log('\n────────────────────────────────────────────────────────────────────────────────');
  console.log('TEST 2: Authentic CMU Essay (Already Has Spark)');
  console.log('────────────────────────────────────────────────────────────────────────────────\n');

  const authenticInput: VoiceExcavationInput = {
    rawDraft: AUTHENTIC_ESSAY,
    essayPrompt: 'Most students choose their intended major or area of study based on a passion or inspiration that\'s developed over time – what passion or inspiration led you to choose this area of study? (CMU)',
    collegeId: 'cmu',
  };

  console.log('  Running Stage 0 on authentic essay...\n');

  const authenticCostTracker = new CostTracker();
  const authenticResult = await service.runStage0(authenticInput, [], 300);

  authenticCostTracker.addEntry(
    'Stage 0',
    'Sonnet',
    'Spark Gap Analysis',
    authenticResult.costTracking.analysisTokens.input,
    authenticResult.costTracking.analysisTokens.output
  );
  authenticCostTracker.addEntry(
    'Stage 0',
    'Sonnet',
    'Voice-First Draft',
    authenticResult.costTracking.draftGenerationTokens.input,
    authenticResult.costTracking.draftGenerationTokens.output
  );

  const authenticRegister = authenticResult.analysis.detectedRegister.primary.toLowerCase() as keyof typeof REGISTER_NAMES;
  console.log(`\n  Results:`);
  console.log(`    Spark Score: ${authenticResult.analysis.sparkScore}/100 (${authenticResult.analysis.sparkLevel})`);
  console.log(`    Detected Register: ${REGISTER_NAMES[authenticRegister] || authenticResult.analysis.detectedRegister.primary}`);
  console.log(`    Recommendation: ${authenticResult.analysis.recommendation}`);

  fullOutput += generateMarkdownOutput('Authentic CMU Essay (Already Has Spark)', AUTHENTIC_ESSAY, authenticResult, authenticCostTracker);
  fullOutput += '\n\n---\n\n';

  // ============================================================================
  // TEST 3: Melancholy Essay → Different Register
  // ============================================================================

  console.log('\n────────────────────────────────────────────────────────────────────────────────');
  console.log('TEST 3: Bland Melancholy/Loss Essay (Different Register)');
  console.log('────────────────────────────────────────────────────────────────────────────────\n');

  const melancholyInput: VoiceExcavationInput = {
    rawDraft: MELANCHOLY_ESSAY_BLAND,
    essayPrompt: 'The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. (Common App #2)',
    collegeId: 'common_app',
  };

  console.log('  Running Stage 0 on melancholy essay...\n');

  const melancholyCostTracker = new CostTracker();
  const melancholyResult = await service.runStage0(melancholyInput, [], 300);

  melancholyCostTracker.addEntry(
    'Stage 0',
    'Sonnet',
    'Spark Gap Analysis',
    melancholyResult.costTracking.analysisTokens.input,
    melancholyResult.costTracking.analysisTokens.output
  );
  melancholyCostTracker.addEntry(
    'Stage 0',
    'Sonnet',
    'Voice-First Draft',
    melancholyResult.costTracking.draftGenerationTokens.input,
    melancholyResult.costTracking.draftGenerationTokens.output
  );

  const melancholyRegister = melancholyResult.analysis.detectedRegister.primary.toLowerCase() as keyof typeof REGISTER_NAMES;
  console.log(`\n  Results:`);
  console.log(`    Spark Score: ${melancholyResult.analysis.sparkScore}/100 (${melancholyResult.analysis.sparkLevel})`);
  console.log(`    Detected Register: ${REGISTER_NAMES[melancholyRegister] || melancholyResult.analysis.detectedRegister.primary}`);
  console.log(`    Recommendation: ${melancholyResult.analysis.recommendation}`);

  fullOutput += generateMarkdownOutput('Bland Melancholy Essay (Different Register)', MELANCHOLY_ESSAY_BLAND, melancholyResult, melancholyCostTracker);

  // ============================================================================
  // SAVE OUTPUT
  // ============================================================================

  const outputPath = path.join(__dirname, '..', 'STAGE_0_TEST_OUTPUT.md');
  fs.writeFileSync(outputPath, fullOutput);
  console.log(`\n\n================================================================================`);
  console.log(`OUTPUT SAVED TO: ${outputPath}`);
  console.log(`================================================================================\n`);

  // Summary
  console.log('SUMMARY:');
  console.log('────────────────────────────────────────────────────────────────────────────────');
  console.log(`Test 1 (Bland CS): ${blandResult.analysis.sparkScore}/100 → ${blandResult.voiceFirstDraft.metrics.sparkScore}/100`);
  console.log(`Test 2 (Authentic CMU): ${authenticResult.analysis.sparkScore}/100 (${authenticResult.analysis.recommendation})`);
  console.log(`Test 3 (Bland Melancholy): ${melancholyResult.analysis.sparkScore}/100 → Register: ${getRegisterName(melancholyResult.analysis.detectedRegister.primary)}`);
}

// Run the test
runTest().catch(console.error);
