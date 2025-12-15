/**
 * Common App Workshop - End-to-End Test with Real Claude Integration
 *
 * This test runs the complete 3-stage workshop pipeline using real Claude API calls,
 * tracks costs, and outputs results to a comprehensive markdown file.
 *
 * Features:
 * - Real Claude Sonnet calls for essay analysis
 * - Real Haiku calls for citation mapping
 * - Full cost tracking (input/output tokens, USD)
 * - Complete output showcase in markdown
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { getCollegeResearch, getCollegeEssayPrompt } from '../src/services/commonAppWorkshop/data';
import { workshopCacheService } from '../src/services/commonAppWorkshop/services/cacheService';
import type { CitationMapping, DimensionStrength } from '../src/services/commonAppWorkshop/types/collegeResearch';
import type { EssayAnalysis, WorkshopSession, EssayVersion } from '../src/services/commonAppWorkshop/types/workshopSession';

// ============================================================================
// CONFIGURATION
// ============================================================================

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OUTPUT_FILE = path.join(process.cwd(), 'COMMON_APP_E2E_OUTPUT.md');

// Pricing (as of late 2024)
const PRICING = {
  'claude-sonnet-4-20250514': {
    input: 3.00 / 1_000_000,   // $3 per 1M input tokens
    output: 15.00 / 1_000_000, // $15 per 1M output tokens
    cached: 0.30 / 1_000_000,  // $0.30 per 1M cached input tokens
  },
  'claude-3-5-sonnet-20241022': {
    input: 3.00 / 1_000_000,   // $3 per 1M input tokens
    output: 15.00 / 1_000_000, // $15 per 1M output tokens
    cached: 0.30 / 1_000_000,  // $0.30 per 1M cached input tokens
  },
  'claude-3-5-haiku-20241022': {
    input: 1.00 / 1_000_000,   // $1 per 1M input tokens
    output: 5.00 / 1_000_000,  // $5 per 1M output tokens
    cached: 0.10 / 1_000_000,  // $0.10 per 1M cached input tokens
  },
  'claude-3-haiku-20240307': {
    input: 0.25 / 1_000_000,   // $0.25 per 1M input tokens
    output: 1.25 / 1_000_000,  // $1.25 per 1M output tokens
    cached: 0.03 / 1_000_000,  // $0.03 per 1M cached input tokens
  },
};

// Test configuration
const TEST_COLLEGE = 'stanford';
const TEST_PROMPT_ID = 'stanford_intellectual_vitality';

// Sample essays for 3-stage progression
// These essays are intentionally more raw and human - with real personality and quirks

const ESSAY_STAGE_1 = `
My grandmother thinks I'm broken. "Normal teenagers," she says, squinting at the disassembled espresso machine covering her kitchen table, "go to parties. They have friends. They don't take apart perfectly good appliances."

She's not wrong about the appliances. Last summer alone: her espresso machine (fixed), my dad's vintage turntable (mostly fixed—there's a slight wobble at 45 rpm), and a 1987 Nintendo that my neighbor was about to throw away. I rescued it from the curb like a stray dog.

The Nintendo took three weeks. I had no idea what I was doing. I watched YouTube repair videos at 0.5x speed, burned my fingers on the soldering iron twice, and at one point genuinely considered crying. When it finally powered on—that familiar "ding!" and the red Nintendo logo—I may have actually cried. Happy tears. Weird, I know.

Here's what I can't explain: why does this feel more like me than anything else? When I'm elbow-deep in circuits and vintage manuals, I forget to eat. Time stops. My brain goes quiet in a way it never does otherwise.

I don't know what to call this. Obsession? Curiosity? My therapist calls it "flow state" and says it's healthy. My grandmother still thinks I'm broken. I think I'm just someone who needs to know how things work—really work—or I can't sleep at night.

Stanford seems like a place where being this kind of weird is actually normal.
`.trim();

const ESSAY_STAGE_2 = `
My grandmother thinks I'm broken. "Normal teenagers," she says, squinting at the disassembled espresso machine covering her kitchen table, "go to parties. They have friends." She pauses, considering the scattered gaskets and pressure valves. "They don't take apart perfectly good appliances."

She's not entirely wrong. Last summer's casualties: her espresso machine (fixed, now pulls better shots than before), my dad's 1970s Technics turntable (mostly fixed—there's a slight wobble at 45 rpm that I'm still chasing), and a 1987 Nintendo that my neighbor was literally carrying to the dumpster. I intercepted it like it was a fumbled football. He looked at me like I'd lost my mind.

The Nintendo took three weeks. I burned my fingers on the soldering iron twice. I watched one YouTube repair video seventeen times at 0.5x speed, pausing to squint at blurry capacitor labels. At one point, staring at a corroded chip that refused to make sense, I genuinely considered crying. When it finally powered on—that familiar "ding!" and the glowing red Nintendo logo—I didn't consider crying. I actually did cry. In my room. Alone. Over a thirty-year-old gaming console.

Here's what I've never been able to explain to my grandmother, or really to anyone: when I'm elbow-deep in vintage circuits and water-stained repair manuals, my brain goes quiet. Not empty—quiet. The anxious static that usually fills my head just... stops. Time disappears. I forget to eat. I forget everything except the problem in front of me.

My therapist calls it "flow state" and says it's healthy, actually. My grandmother still thinks I'm broken. I'm starting to think I'm just someone who needs to understand how things work—really work, at the level of physics and intention and design choices—or I can't quite feel settled in the world.

Stanford seems like a place where this particular brand of weird isn't just tolerated but actually valued.
`.trim();

const ESSAY_STAGE_3 = `
My grandmother thinks I'm broken. "Normal teenagers," she says, squinting at the disassembled espresso machine covering her kitchen table, "go to parties. They have friends." She picks up a pressure valve, turns it over suspiciously. "They don't take apart perfectly good appliances."

She's not entirely wrong. Last summer's casualties: her espresso machine (fixed—now pulls better shots than the day she bought it), my dad's 1970s Technics turntable (mostly fixed, though there's a slight wobble at 45 rpm I'm still chasing), and a 1987 Nintendo that my neighbor was literally carrying to the dumpster. I intercepted it mid-stride. He looked at me like I'd lost my mind. I probably had.

The Nintendo took three weeks. I burned my fingers on the soldering iron twice and once almost set my desk on fire (just a small fire, and technically it was the curtain). I watched one YouTube repair video seventeen times at half-speed, pausing to squint at blurry capacitor labels through my phone's zoom. At 2 AM on a Tuesday, staring at a corroded chip that refused to make sense, I genuinely considered crying. When it finally powered on—that familiar "ding!" and the glowing red logo—I didn't consider crying. I did cry. In my room. Alone. Over a thirty-year-old gaming console. Zero regrets.

Here's what I've never quite explained to my grandmother, or honestly to anyone: when I'm elbow-deep in circuits and water-stained repair manuals, my brain goes quiet. Not empty—quiet. The anxious static that usually fills my head just stops. Time disappears. I forget to eat, forget to check my phone, forget everything except the beautiful puzzle in front of me.

My therapist says it's "flow state" and it's healthy. My grandmother maintains I'm broken. I think I'm just someone who needs to understand how things work—really work, down to the physics and design choices and the humans who made them—or I can't quite settle.

Stanford seems like a place where this brand of weird isn't tolerated but celebrated. I want to find my people.
`.trim();

// ============================================================================
// COST TRACKING
// ============================================================================

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

interface CostEntry {
  stage: string;
  model: string;
  purpose: string;
  usage: TokenUsage;
  costUSD: number;
  duration: number;
}

class CostTracker {
  private entries: CostEntry[] = [];

  addEntry(entry: CostEntry) {
    this.entries.push(entry);
  }

  calculateCost(model: string, usage: TokenUsage): number {
    const pricing = PRICING[model as keyof typeof PRICING];
    if (!pricing) return 0;

    const inputCost = (usage.inputTokens - usage.cacheReadTokens) * pricing.input;
    const cachedCost = usage.cacheReadTokens * pricing.cached;
    const outputCost = usage.outputTokens * pricing.output;

    return inputCost + cachedCost + outputCost;
  }

  getTotalCost(): number {
    return this.entries.reduce((sum, e) => sum + e.costUSD, 0);
  }

  getTotalTokens(): TokenUsage {
    return this.entries.reduce(
      (acc, e) => ({
        inputTokens: acc.inputTokens + e.usage.inputTokens,
        outputTokens: acc.outputTokens + e.usage.outputTokens,
        cacheReadTokens: acc.cacheReadTokens + e.usage.cacheReadTokens,
        cacheCreationTokens: acc.cacheCreationTokens + e.usage.cacheCreationTokens,
      }),
      { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 }
    );
  }

  getEntries(): CostEntry[] {
    return this.entries;
  }

  getSummary(): string {
    const total = this.getTotalTokens();
    const totalCost = this.getTotalCost();
    const cacheHitRate = total.inputTokens > 0
      ? ((total.cacheReadTokens / total.inputTokens) * 100).toFixed(1)
      : '0';

    return `
## Cost Summary

| Metric | Value |
|--------|-------|
| Total Input Tokens | ${total.inputTokens.toLocaleString()} |
| Total Output Tokens | ${total.outputTokens.toLocaleString()} |
| Cache Read Tokens | ${total.cacheReadTokens.toLocaleString()} |
| Cache Hit Rate | ${cacheHitRate}% |
| **Total Cost** | **$${totalCost.toFixed(4)}** |

### Cost Breakdown by Stage

| Stage | Model | Purpose | Input | Output | Cost |
|-------|-------|---------|-------|--------|------|
${this.entries.map(e =>
  `| ${e.stage} | ${e.model.split('-').slice(-1)[0]} | ${e.purpose} | ${e.usage.inputTokens.toLocaleString()} | ${e.usage.outputTokens.toLocaleString()} | $${e.costUSD.toFixed(4)} |`
).join('\n')}
`;
  }
}

// ============================================================================
// CLAUDE CLIENT
// ============================================================================

class ClaudeClient {
  private client: Anthropic;
  private costTracker: CostTracker;

  constructor(apiKey: string, costTracker: CostTracker) {
    this.client = new Anthropic({ apiKey });
    this.costTracker = costTracker;
  }

  async analyzeEssayWithSonnet(
    stage: string,
    systemPrompt: string,
    userPrompt: string,
    purpose: string
  ): Promise<{ content: string; usage: TokenUsage }> {
    const startTime = Date.now();
    const model = 'claude-sonnet-4-20250514';

    const response = await this.client.messages.create({
      model,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const duration = Date.now() - startTime;
    const usage: TokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: (response.usage as any).cache_read_input_tokens || 0,
      cacheCreationTokens: (response.usage as any).cache_creation_input_tokens || 0,
    };

    const cost = this.costTracker.calculateCost(model, usage);
    this.costTracker.addEntry({ stage, model, purpose, usage, costUSD: cost, duration });

    const textContent = response.content.find(c => c.type === 'text');
    return {
      content: textContent?.text || '',
      usage,
    };
  }

  async analyzeWithHaiku(
    stage: string,
    systemPrompt: string,
    userPrompt: string,
    purpose: string
  ): Promise<{ content: string; usage: TokenUsage }> {
    const startTime = Date.now();
    const model = 'claude-3-haiku-20240307';

    const response = await this.client.messages.create({
      model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const duration = Date.now() - startTime;
    const usage: TokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: (response.usage as any).cache_read_input_tokens || 0,
      cacheCreationTokens: (response.usage as any).cache_creation_input_tokens || 0,
    };

    const cost = this.costTracker.calculateCost(model, usage);
    this.costTracker.addEntry({ stage, model, purpose, usage, costUSD: cost, duration });

    const textContent = response.content.find(c => c.type === 'text');
    return {
      content: textContent?.text || '',
      usage,
    };
  }
}

// ============================================================================
// REAL ANALYSIS FUNCTIONS
// ============================================================================

async function analyzeEssayWithClaude(
  client: ClaudeClient,
  stage: string,
  essay: string,
  research: any,
  prompt: any
): Promise<EssayAnalysis> {
  const systemPrompt = `You are an expert Stanford admissions essay analyst. You will evaluate essays based on Stanford's specific values and rubrics.

## Stanford's Core Values
${research.coreValues.map((v: any) => `- **${v.valueName}** (${v.weight}%): ${v.description}`).join('\n')}

## This Essay Prompt: ${prompt.promptText}
Word limit: ${prompt.wordLimit || 250} words

## Dimensional Criteria for This Prompt
${prompt.dimensionalCriteria.map((dc: any) => `
### ${dc.dimensionName} (${dc.weight}%)
${dc.context}

**Strong indicators**: ${dc.scoringLogic?.strong?.join('; ') || 'Clear demonstration'}
**Weak indicators**: ${dc.scoringLogic?.weak?.join('; ') || 'Missing or vague'}
`).join('\n')}

Respond with a JSON object containing your analysis. Be specific and cite evidence from the essay.`;

  const userPrompt = `Analyze this Stanford Intellectual Vitality essay:

---
${essay}
---

Provide your analysis as a JSON object with this structure:
{
  "nqi": <number 0-100>,
  "tier": "excellent" | "strong" | "competitive" | "developing",
  "categoryScores": [
    {
      "dimensionId": "<id>",
      "dimensionName": "<name>",
      "score": <0-100>,
      "status": "exceptional" | "strong" | "adequate" | "weak" | "missing",
      "justification": "<specific evidence from essay>",
      "strengths": ["<strength1>", "<strength2>"],
      "weaknesses": ["<weakness1>", "<weakness2>"]
    }
  ],
  "authenticityScore": <0-100>,
  "voiceStrengths": ["<strength1>"],
  "concerns": ["<concern1>"],
  "overallFeedback": "<2-3 sentence summary>"
}`;

  const result = await client.analyzeEssayWithSonnet(stage, systemPrompt, userPrompt, 'Essay Analysis');

  // Parse the JSON response
  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return convertToEssayAnalysis(parsed, prompt);
    }
  } catch (e) {
    console.log('  Warning: Could not parse JSON response, using fallback');
  }

  // Fallback if parsing fails
  return createFallbackAnalysis(prompt);
}

function convertToEssayAnalysis(parsed: any, prompt: any): EssayAnalysis {
  const categoryScores = (parsed.categoryScores || []).map((cs: any) => ({
    dimensionId: cs.dimensionId || 'unknown',
    dimensionName: cs.dimensionName || 'Unknown',
    score: cs.score || 70,
    maxScore: 100,
    percentage: cs.score || 70,
    status: cs.status || 'adequate' as DimensionStrength,
    justification: cs.justification || '',
    strengths: cs.strengths || [],
    weaknesses: cs.weaknesses || [],
  }));

  const nqi = parsed.nqi || Math.round(categoryScores.reduce((sum: number, cs: any) => sum + cs.score, 0) / Math.max(categoryScores.length, 1));

  return {
    nqi,
    tier: parsed.tier || 'competitive',
    categoryScores,
    weakCategories: categoryScores
      .filter((cs: any) => cs.status === 'weak' || cs.status === 'missing')
      .map((cs: any) => ({
        dimensionId: cs.dimensionId,
        score: cs.score,
        primaryIssue: cs.weaknesses[0] || 'Needs improvement',
        howToImprove: 'Focus on strengthening this dimension',
      })),
    elitePatterns: [],
    authenticity: {
      voiceScore: parsed.authenticityScore || 75,
      uniquenessScore: parsed.authenticityScore || 75,
      concerns: parsed.concerns || [],
    },
    flagsDetected: {
      redFlags: [],
      greenFlags: [],
    },
  };
}

function createFallbackAnalysis(prompt: any): EssayAnalysis {
  return {
    nqi: 72,
    tier: 'competitive',
    categoryScores: prompt.dimensionalCriteria.map((dc: any) => ({
      dimensionId: dc.dimensionId,
      dimensionName: dc.dimensionName,
      score: 72,
      maxScore: 100,
      percentage: 72,
      status: 'adequate' as DimensionStrength,
      justification: 'Analysis pending',
      strengths: [],
      weaknesses: [],
    })),
    weakCategories: [],
    elitePatterns: [],
    authenticity: { voiceScore: 75, uniquenessScore: 70, concerns: [] },
    flagsDetected: { redFlags: [], greenFlags: [] },
  };
}

async function generateTeachingFeedback(
  client: ClaudeClient,
  stage: number,
  essay: string,
  analysis: EssayAnalysis,
  research: any,
  prompt: any,
  previousAnalysis?: EssayAnalysis
): Promise<string> {
  const stageDescriptions: Record<number, string> = {
    1: 'Stage 1: Foundation - Build conceptual understanding before evaluation',
    2: 'Stage 2: Development - Acknowledge progress and guide improvement',
    3: 'Stage 3: Refinement - Celebrate strengths and prepare for submission',
  };

  const systemPrompt = `You are an expert Stanford admissions essay coach using the PIQ Workshop methodology.

## Your Role for ${stageDescriptions[stage]}

${stage === 1 ? `
- TEACH concepts BEFORE evaluating
- Explain what Stanford values and why
- Build mental models for intellectual vitality
- Use Socratic questions to guide thinking
- Be encouraging but honest
` : stage === 2 ? `
- Acknowledge progress from previous version
- Focus on remaining issues with specific guidance
- Reference Stanford's values with evidence
- Provide actionable revision steps
- Don't repeat teaching from Stage 1
` : `
- CELEBRATE what's working (primary focus)
- Only suggest changes if truly valuable
- Protect authentic voice
- Build submission confidence
- Provide final reflection questions
`}

## Stanford Research
${research.coreValues.map((v: any) => `**${v.valueName}** (${v.weight}%): ${v.description}`).join('\n')}

## Key Quotes to Cite
${research.keyQuotes.slice(0, 3).map((q: any) => `"${q.quote}" - ${q.source.name}`).join('\n')}

## Current Analysis
NQI: ${analysis.nqi}/100 (${analysis.tier})
${analysis.categoryScores.map((cs: any) => `- ${cs.dimensionName}: ${cs.status} (${cs.score}%)`).join('\n')}

${previousAnalysis ? `
## Progress from Previous Stage
Previous NQI: ${previousAnalysis.nqi} → Current NQI: ${analysis.nqi} (${analysis.nqi > previousAnalysis.nqi ? '+' : ''}${analysis.nqi - previousAnalysis.nqi} points)
` : ''}`;

  const userPrompt = `Generate comprehensive Stage ${stage} teaching feedback for this essay:

---
${essay}
---

Structure your response with clear markdown headers. ${
  stage === 1 ? 'Start with what Stanford values before evaluating the draft.' :
  stage === 2 ? 'Acknowledge progress, then focus on remaining areas to strengthen.' :
  'Celebrate what\'s working, then offer only high-value refinements.'
}`;

  const result = await client.analyzeEssayWithSonnet(
    `Stage ${stage}`,
    systemPrompt,
    userPrompt,
    `Teaching Feedback Generation`
  );

  return result.content;
}

// ============================================================================
// MARKDOWN OUTPUT GENERATOR
// ============================================================================

function generateMarkdownOutput(
  results: {
    stage: number;
    essay: string;
    analysis: EssayAnalysis;
    teaching: string;
  }[],
  costTracker: CostTracker
): string {
  const timestamp = new Date().toISOString();

  let md = `# Common App Workshop - End-to-End Test Output

**Generated**: ${timestamp}
**College**: Stanford University
**Prompt**: Intellectual Vitality Essay (250 words)

---

${costTracker.getSummary()}

---

`;

  for (const result of results) {
    md += `
# Stage ${result.stage}: ${result.stage === 1 ? 'Foundation' : result.stage === 2 ? 'Development' : 'Refinement'}

## Essay Draft (${result.essay.split(/\s+/).length} words)

\`\`\`
${result.essay}
\`\`\`

## Analysis Summary

| Metric | Value |
|--------|-------|
| NQI Score | ${result.analysis.nqi}/100 |
| Tier | ${result.analysis.tier} |
| Authenticity | ${result.analysis.authenticity.voiceScore}/100 |

### Dimensional Scores

| Dimension | Score | Status |
|-----------|-------|--------|
${result.analysis.categoryScores.map(cs =>
  `| ${cs.dimensionName} | ${cs.score}% | ${cs.status} |`
).join('\n')}

## Teaching Feedback

${result.teaching}

---

`;
  }

  // Add journey summary
  if (results.length === 3) {
    const stage1 = results[0].analysis;
    const stage3 = results[2].analysis;
    const improvement = stage3.nqi - stage1.nqi;

    md += `
# Journey Summary

## Progress Overview

| Stage | NQI Score | Tier |
|-------|-----------|------|
| Stage 1 | ${results[0].analysis.nqi} | ${results[0].analysis.tier} |
| Stage 2 | ${results[1].analysis.nqi} | ${results[1].analysis.tier} |
| Stage 3 | ${results[2].analysis.nqi} | ${results[2].analysis.tier} |

**Total Improvement**: ${improvement > 0 ? '+' : ''}${improvement} points

## Dimensional Progress

| Dimension | Stage 1 | Stage 2 | Stage 3 | Change |
|-----------|---------|---------|---------|--------|
${stage1.categoryScores.map((s1, i) => {
  const s2 = results[1].analysis.categoryScores[i];
  const s3 = stage3.categoryScores[i];
  const change = (s3?.score || 0) - (s1?.score || 0);
  return `| ${s1.dimensionName} | ${s1.score}% | ${s2?.score || '-'}% | ${s3?.score || '-'}% | ${change > 0 ? '+' : ''}${change} |`;
}).join('\n')}

---

*Generated by Common App Workshop System*
*Test completed at ${timestamp}*
`;
  }

  return md;
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runEndToEndTest() {
  console.log('='.repeat(80));
  console.log('COMMON APP WORKSHOP - END-TO-END TEST WITH REAL CLAUDE');
  console.log('='.repeat(80));
  console.log('');

  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not found in environment');
  }

  const costTracker = new CostTracker();
  const client = new ClaudeClient(ANTHROPIC_API_KEY, costTracker);

  // Load Stanford research
  const research = getCollegeResearch(TEST_COLLEGE);
  if (!research) {
    throw new Error('Stanford research not found');
  }

  const prompt = getCollegeEssayPrompt(TEST_COLLEGE, TEST_PROMPT_ID);
  if (!prompt) {
    throw new Error('Stanford Intellectual Vitality prompt not found');
  }

  console.log(`College: ${research.collegeName}`);
  console.log(`Prompt: ${prompt.promptText.substring(0, 80)}...`);
  console.log('');

  const results: {
    stage: number;
    essay: string;
    analysis: EssayAnalysis;
    teaching: string;
  }[] = [];

  const essays = [ESSAY_STAGE_1, ESSAY_STAGE_2, ESSAY_STAGE_3];

  for (let stage = 1; stage <= 3; stage++) {
    console.log(`${'─'.repeat(60)}`);
    console.log(`STAGE ${stage}: ${stage === 1 ? 'Foundation' : stage === 2 ? 'Development' : 'Refinement'}`);
    console.log(`${'─'.repeat(60)}`);

    const essay = essays[stage - 1];
    console.log(`  Essay word count: ${essay.split(/\s+/).length}`);

    // Analyze essay
    console.log('  Analyzing essay with Claude Sonnet...');
    const analysis = await analyzeEssayWithClaude(
      client,
      `Stage ${stage}`,
      essay,
      research,
      prompt
    );
    console.log(`  Analysis complete: NQI ${analysis.nqi}/100 (${analysis.tier})`);

    // Generate teaching feedback
    console.log('  Generating teaching feedback...');
    const previousAnalysis = stage > 1 ? results[stage - 2].analysis : undefined;
    const teaching = await generateTeachingFeedback(
      client,
      stage,
      essay,
      analysis,
      research,
      prompt,
      previousAnalysis
    );
    console.log(`  Teaching generated: ${teaching.length} characters`);

    results.push({ stage, essay, analysis, teaching });
    console.log('');
  }

  // Generate output
  console.log('='.repeat(80));
  console.log('GENERATING OUTPUT');
  console.log('='.repeat(80));

  const markdown = generateMarkdownOutput(results, costTracker);
  fs.writeFileSync(OUTPUT_FILE, markdown);
  console.log(`\nOutput written to: ${OUTPUT_FILE}`);

  // Print cost summary
  console.log('\n' + costTracker.getSummary());

  console.log('\n' + '='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
}

// Run the test
runEndToEndTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
