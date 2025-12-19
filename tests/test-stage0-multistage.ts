/**
 * Stage 0 Multi-Stage Pipeline Test
 *
 * Tests the new multi-stage voice excavation pipeline that produces
 * higher quality essays through layered generation:
 *
 * Stage 0A: Spark Gap Analysis
 * Stage 0B: Core Story & Candidate Identification
 * Stage 0C: Scene Construction with transitions
 * Stage 0D: Voice Integration
 * Stage 0E: Quality Verification (Haiku)
 * Stage 0F: Targeted Revision (if needed)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { Stage0MultiStageService } from '../src/services/commonAppWorkshop/services/stage0MultiStageService';
import type {
  VoiceExcavationInput,
  InterviewResponse,
} from '../src/services/commonAppWorkshop/types/stage0Types';
import { REGISTER_NAMES } from '../src/services/commonAppWorkshop/types/stage0Types';

// ============================================================================
// TEST ESSAYS
// ============================================================================

// Test 1: The CMU Essay - should preserve flow, not make it worse
const CMU_ESSAY = `The sharks fight over the newest electrical flying rug! Now that's another must watch. Through my middle school addiction to Shark Tank, I watched countless videos on new business ideas that over the course of time, transversed from my phone to the real world. Each airing episode represented a new possible breakthrough, and everytime I watched, I aspired to be the next one. My ideas for frame changing glasses, adjustable stress balls, and compression trash cans, surely one of them will work right? Never did I stop churning my head for "revolutionary" ideas.

Then came my Economics class in 9th grade where I learned how businesses, regardless of scale, can collectively contribute to the changes seen in the world. My high school experience allowed me to test the waters of entrepreneurship as I started my own clothing brand and club. SAUCED, a brand with a noble mission of putting ink to fabric my own artistic and cultural taste. After two years of curating a hefty clothing line supported by an automated shopify ecommerce website, I created Polytechnic High School's Young Entrepreneur Society (YES) where highschoolers can grow confident in knowing how to manifest their passion and hobbies into real life applications.

My next step started when I screamed "I got the offer!" as showed my mom the internship acceptance email from Pocket Latte. Pocket Latte, a sustainable and ethnic minority empowering chocolate start-up where my professional experience flourished. From insightful conversations with hundreds of customers at sampling events, I learned to dive into the customer mindset to understand the deeper drivers of purchasing behavior. As I continue to dive into the depths of the ocean that is business, I hope to meet the sharks soon.`;

const CMU_PROMPT = `Please write a response to the following in 300 words or fewer: What do you hope to explore with your major?`;

// Test 2: Bland grandfather essay - needs to center the WRITER
const GRANDFATHER_ESSAY = `When I was fifteen, my grandfather passed away. This experience taught me valuable lessons about life and family. I learned to appreciate the time I have with loved ones.

My grandfather was an important figure in my life. He taught me many things and I will always remember him. His death was difficult but it made me stronger.

Through this challenge, I developed resilience and empathy. I now understand the importance of cherishing moments with family. This experience has shaped who I am today and prepared me for future challenges.`;

const GRANDFATHER_PROMPT = `The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?`;

// Simulated interview responses for grandfather essay
const GRANDFATHER_INTERVIEW: InterviewResponse[] = [
  {
    questionId: '1',
    question: "What's a small, random detail you can't stop remembering?",
    response: "His reading glasses. He always left them on the kitchen table, slightly crooked. They're still there. Nobody moves them. I do my homework around them now.",
    voiceMarkers: ['slightly crooked', 'Nobody moves them', 'I do my homework around them'],
    emotionalEnergy: 'high',
  },
  {
    questionId: '2',
    question: "What happened right BEFORE the hard part?",
    response: "I was studying for a calculus test. It was a Tuesday, I remember because the test was Wednesday. I kept getting phone calls from relatives and trying to do derivatives at the same time. It felt ridiculous.",
    voiceMarkers: ['It was a Tuesday', 'felt ridiculous'],
    emotionalEnergy: 'medium',
  },
  {
    questionId: '3',
    question: "What's something you still carry with you?",
    response: "He was the family historian. He knew everyone's stories. When he died, suddenly nobody could remember my great-aunt's husband's name or when we stopped doing Christmas dinner. All those stories just... gone.",
    voiceMarkers: ['family historian', 'All those stories just... gone'],
    emotionalEnergy: 'high',
  },
];

// ============================================================================
// COST TRACKER
// ============================================================================

class CostTracker {
  private entries: {
    stage: string;
    model: string;
    purpose: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }[] = [];

  addEntry(
    stage: string,
    model: string,
    purpose: string,
    inputTokens: number,
    outputTokens: number
  ): void {
    const pricing = model === 'Haiku'
      ? { input: 0.8 / 1_000_000, output: 4.0 / 1_000_000 }
      : { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 };

    const cost = (inputTokens * pricing.input) + (outputTokens * pricing.output);

    this.entries.push({
      stage,
      model,
      purpose,
      inputTokens,
      outputTokens,
      cost,
    });
  }

  getTotalCost(): number {
    return this.entries.reduce((sum, e) => sum + e.cost, 0);
  }

  getSummary(): string {
    let summary = '\n| Stage | Model | Purpose | Input | Output | Cost |\n';
    summary += '|-------|-------|---------|-------|--------|------|\n';

    for (const entry of this.entries) {
      summary += `| ${entry.stage} | ${entry.model} | ${entry.purpose} | ${entry.inputTokens.toLocaleString()} | ${entry.outputTokens.toLocaleString()} | $${entry.cost.toFixed(4)} |\n`;
    }

    summary += `\n**Total Cost: $${this.getTotalCost().toFixed(4)}**\n`;
    return summary;
  }
}

// ============================================================================
// MARKDOWN GENERATOR
// ============================================================================

function generateMarkdownOutput(
  testName: string,
  essay: string,
  output: any,
  costTracker: CostTracker
): string {
  let md = `# ${testName}\n\n`;
  md += `**Generated**: ${new Date().toISOString()}\n\n`;
  md += '---\n\n';

  // Original Essay
  md += `## Original Essay (${essay.split(/\s+/).length} words)\n\n`;
  md += '```\n';
  md += essay;
  md += '\n```\n\n';

  // Core Story Identification
  md += `## Core Story Identification (Stage 0B)\n\n`;
  md += `**One-Sentence Story**: ${output.coreStory.oneSentenceStory}\n\n`;
  md += `**Candidate Appeal**:\n`;
  md += `- Unique Value: ${output.coreStory.candidateAppeal.uniqueValue}\n`;
  md += `- Campus Contribution: ${output.coreStory.candidateAppeal.campusContribution}\n`;
  md += `- Must-Have Factor: ${output.coreStory.candidateAppeal.mustHaveFactor}\n\n`;
  md += `**Qualities to Showcase**:\n`;
  for (const quality of output.coreStory.qualitiesToShowcase) {
    md += `- ${quality}\n`;
  }
  md += '\n';
  md += `**Emotional Arc**:\n`;
  md += `- Reader Starts: ${output.coreStory.emotionalArc.readerStartsFeeling}\n`;
  md += `- Reader Ends: ${output.coreStory.emotionalArc.readerEndsFeeling}\n`;
  md += `- What Changes: ${output.coreStory.emotionalArc.whatChanges}\n\n`;

  // Scene Construction
  md += `## Scene Construction (Stage 0C)\n\n`;
  md += `**Opening Hook**: "${output.sceneStructure.openingHook.content}"\n`;
  md += `- Why it works: ${output.sceneStructure.openingHook.whyItWorks}\n\n`;

  for (const scene of output.sceneStructure.scenes) {
    md += `### Scene ${scene.sceneNumber}\n`;
    md += `**Purpose**: ${scene.purpose}\n\n`;
    md += `**Writer Focus**: ${scene.writerFocus}\n\n`;
    if (scene.transitionFromPrevious) {
      md += `**Transition**: ${scene.transitionFromPrevious}\n\n`;
    }
    md += `**Content** (${scene.wordCount} words):\n`;
    md += `> ${scene.content}\n\n`;
  }

  md += `**Closing**: "${output.sceneStructure.closing.content}"\n`;
  md += `- Arc Completion: ${output.sceneStructure.closing.arcCompletion}\n\n`;

  md += `**Flow Check**:\n`;
  md += `- Overall Narrative: ${output.sceneStructure.flowCheck.overallNarrative}\n`;
  md += `- Transition Quality: ${output.sceneStructure.flowCheck.transitionQuality}\n`;
  md += `- Momentum: ${output.sceneStructure.flowCheck.momentumMaintained}\n\n`;

  // Voice Integration
  md += `## Final Draft with Voice (Stage 0D)\n\n`;
  md += `**Word Count**: ${output.voiceIntegration.wordCount}\n\n`;
  md += '```\n';
  md += output.voiceIntegration.draft;
  md += '\n```\n\n';

  md += `### Spark Moments\n\n`;
  for (const spark of output.voiceIntegration.sparkMoments) {
    md += `- **${spark.type}**: "${spark.text}"\n`;
    md += `  - Source: ${spark.source}\n`;
    md += `  - Flow Preserved: ${spark.flowPreserved}\n\n`;
  }

  if (output.voiceIntegration.vocabularyChoices.length > 0) {
    md += `### Vocabulary Choices\n\n`;
    for (const choice of output.voiceIntegration.vocabularyChoices) {
      md += `- **Used**: "${choice.phrase}"\n`;
      md += `  - **Avoided**: "${choice.avoided}"\n`;
      md += `  - **Why**: ${choice.why}\n\n`;
    }
  }

  md += `### Flow Check\n`;
  md += `- Transitions Intact: ${output.voiceIntegration.flowCheck.transitionsIntact}\n`;
  md += `- Reads as One Voice: ${output.voiceIntegration.flowCheck.readsAsOneVoice}\n`;
  md += `- Momentum Maintained: ${output.voiceIntegration.flowCheck.momentumMaintained}\n\n`;

  // Quality Verification
  md += `## Quality Verification (Stage 0E - Haiku)\n\n`;
  md += `| Metric | Score |\n`;
  md += `|--------|-------|\n`;
  md += `| Candidate Centering | ${output.qualityVerification.scores.candidateCentering}/5 |\n`;
  md += `| Narrative Flow | ${output.qualityVerification.scores.narrativeFlow}/5 |\n`;
  md += `| Vocabulary | ${output.qualityVerification.scores.vocabularyAppropriateness}/5 |\n`;
  md += `| Spark Quality | ${output.qualityVerification.scores.sparkQuality}/5 |\n`;
  md += `| Readability | ${output.qualityVerification.scores.overallReadability}/5 |\n`;
  md += `| **Overall** | **${output.qualityVerification.overallScore.toFixed(1)}/5** |\n\n`;
  md += `**Passes Quality**: ${output.qualityVerification.passesQuality ? 'Yes ✓' : 'No ✗'}\n\n`;

  if (output.qualityVerification.issues.length > 0) {
    md += `### Issues Found\n\n`;
    for (const issue of output.qualityVerification.issues) {
      md += `- **${issue.category}**: ${issue.problem}\n`;
      md += `  - Location: ${issue.location}\n`;
      md += `  - Fix: ${issue.suggestedFix}\n\n`;
    }
  }

  // Pipeline Metadata
  md += `## Pipeline Metadata\n\n`;
  md += `- **Path**: ${output.pipelinePath}\n`;
  md += `- **Stages Run**: ${output.stagesRun.join(' → ')}\n\n`;

  // Cost Summary
  md += `## Cost Summary\n`;
  md += costTracker.getSummary();

  return md;
}

// ============================================================================
// MAIN TEST
// ============================================================================

async function runTest(): Promise<void> {
  console.log('\n================================================================================');
  console.log('STAGE 0 MULTI-STAGE PIPELINE TEST');
  console.log('================================================================================\n');

  const service = new Stage0MultiStageService();
  let fullOutput = '';

  // ============================================================================
  // TEST 1: CMU Essay - Should preserve flow
  // ============================================================================
  console.log('TEST 1: CMU Essay (Preserve Flow)\n');
  console.log('─'.repeat(80));

  const cmuInput: VoiceExcavationInput = {
    rawDraft: CMU_ESSAY,
    essayPrompt: CMU_PROMPT,
    collegeId: 'cmu',
  };

  const cmuCostTracker = new CostTracker();

  const cmuResult = await service.runMultiStagePipeline(cmuInput, [], 300);

  // Track costs
  if (cmuResult.costTracking.analysisTokens) {
    cmuCostTracker.addEntry('0A', 'Sonnet', 'Spark Analysis',
      cmuResult.costTracking.analysisTokens.input,
      cmuResult.costTracking.analysisTokens.output);
  }
  if (cmuResult.costTracking.coreStoryTokens) {
    cmuCostTracker.addEntry('0B', 'Sonnet', 'Core Story',
      cmuResult.costTracking.coreStoryTokens.input,
      cmuResult.costTracking.coreStoryTokens.output);
  }
  if (cmuResult.costTracking.sceneConstructionTokens) {
    cmuCostTracker.addEntry('0C', 'Sonnet', 'Scene Construction',
      cmuResult.costTracking.sceneConstructionTokens.input,
      cmuResult.costTracking.sceneConstructionTokens.output);
  }
  if (cmuResult.costTracking.voiceIntegrationTokens) {
    cmuCostTracker.addEntry('0D', 'Sonnet', 'Voice Integration',
      cmuResult.costTracking.voiceIntegrationTokens.input,
      cmuResult.costTracking.voiceIntegrationTokens.output);
  }
  if (cmuResult.costTracking.qualityVerificationTokens) {
    cmuCostTracker.addEntry('0E', 'Haiku', 'Quality Verification',
      cmuResult.costTracking.qualityVerificationTokens.input,
      cmuResult.costTracking.qualityVerificationTokens.output);
  }
  if (cmuResult.costTracking.revisionTokens) {
    cmuCostTracker.addEntry('0F', 'Sonnet', 'Targeted Revision',
      cmuResult.costTracking.revisionTokens.input,
      cmuResult.costTracking.revisionTokens.output);
  }

  console.log(`\n  Quality Score: ${cmuResult.qualityVerification.overallScore.toFixed(1)}/5`);
  console.log(`  Passes Quality: ${cmuResult.qualityVerification.passesQuality}`);
  console.log(`  Total Cost: $${cmuCostTracker.getTotalCost().toFixed(4)}`);

  fullOutput += generateMarkdownOutput('CMU Essay - Multi-Stage Pipeline', CMU_ESSAY, cmuResult, cmuCostTracker);
  fullOutput += '\n\n---\n\n';

  // ============================================================================
  // TEST 2: Grandfather Essay - Center the Writer
  // ============================================================================
  console.log('\n\nTEST 2: Grandfather Essay (Center the Writer)\n');
  console.log('─'.repeat(80));

  const grandfatherInput: VoiceExcavationInput = {
    rawDraft: GRANDFATHER_ESSAY,
    essayPrompt: GRANDFATHER_PROMPT,
    collegeId: 'common_app',
  };

  const grandfatherCostTracker = new CostTracker();

  const grandfatherResult = await service.runMultiStagePipeline(
    grandfatherInput,
    GRANDFATHER_INTERVIEW,
    300
  );

  // Track costs
  if (grandfatherResult.costTracking.analysisTokens) {
    grandfatherCostTracker.addEntry('0A', 'Sonnet', 'Spark Analysis',
      grandfatherResult.costTracking.analysisTokens.input,
      grandfatherResult.costTracking.analysisTokens.output);
  }
  if (grandfatherResult.costTracking.coreStoryTokens) {
    grandfatherCostTracker.addEntry('0B', 'Sonnet', 'Core Story',
      grandfatherResult.costTracking.coreStoryTokens.input,
      grandfatherResult.costTracking.coreStoryTokens.output);
  }
  if (grandfatherResult.costTracking.sceneConstructionTokens) {
    grandfatherCostTracker.addEntry('0C', 'Sonnet', 'Scene Construction',
      grandfatherResult.costTracking.sceneConstructionTokens.input,
      grandfatherResult.costTracking.sceneConstructionTokens.output);
  }
  if (grandfatherResult.costTracking.voiceIntegrationTokens) {
    grandfatherCostTracker.addEntry('0D', 'Sonnet', 'Voice Integration',
      grandfatherResult.costTracking.voiceIntegrationTokens.input,
      grandfatherResult.costTracking.voiceIntegrationTokens.output);
  }
  if (grandfatherResult.costTracking.qualityVerificationTokens) {
    grandfatherCostTracker.addEntry('0E', 'Haiku', 'Quality Verification',
      grandfatherResult.costTracking.qualityVerificationTokens.input,
      grandfatherResult.costTracking.qualityVerificationTokens.output);
  }
  if (grandfatherResult.costTracking.revisionTokens) {
    grandfatherCostTracker.addEntry('0F', 'Sonnet', 'Targeted Revision',
      grandfatherResult.costTracking.revisionTokens.input,
      grandfatherResult.costTracking.revisionTokens.output);
  }

  console.log(`\n  Quality Score: ${grandfatherResult.qualityVerification.overallScore.toFixed(1)}/5`);
  console.log(`  Passes Quality: ${grandfatherResult.qualityVerification.passesQuality}`);
  console.log(`  Total Cost: $${grandfatherCostTracker.getTotalCost().toFixed(4)}`);

  fullOutput += generateMarkdownOutput('Grandfather Essay - Multi-Stage Pipeline', GRANDFATHER_ESSAY, grandfatherResult, grandfatherCostTracker);

  // ============================================================================
  // SAVE OUTPUT
  // ============================================================================
  const outputPath = path.join(__dirname, '..', 'STAGE_0_MULTISTAGE_TEST_OUTPUT.md');
  fs.writeFileSync(outputPath, fullOutput);

  console.log('\n\n================================================================================');
  console.log(`OUTPUT SAVED TO: ${outputPath}`);
  console.log('================================================================================\n');

  // Summary
  console.log('SUMMARY:');
  console.log('─'.repeat(80));
  console.log(`Test 1 (CMU): Quality ${cmuResult.qualityVerification.overallScore.toFixed(1)}/5, Cost $${cmuCostTracker.getTotalCost().toFixed(4)}`);
  console.log(`Test 2 (Grandfather): Quality ${grandfatherResult.qualityVerification.overallScore.toFixed(1)}/5, Cost $${grandfatherCostTracker.getTotalCost().toFixed(4)}`);
  console.log(`Total Cost: $${(cmuCostTracker.getTotalCost() + grandfatherCostTracker.getTotalCost()).toFixed(4)}`);
}

// Run the test
runTest().catch(console.error);
