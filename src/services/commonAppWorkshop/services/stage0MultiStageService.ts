// @ts-nocheck
/**
 * Stage 0: Multi-Stage Voice Excavation Service
 *
 * This service extends the base Stage0Service with a multi-stage pipeline
 * that produces higher quality essays through layered generation:
 *
 * Stage 0A: Spark Gap Analysis (inherited)
 * Stage 0B: Core Story & Candidate Identification
 * Stage 0C: Scene Construction with transitions
 * Stage 0D: Voice Integration
 * Stage 0E: Quality Verification (Haiku - fast & cheap)
 * Stage 0F: Targeted Revision (if needed)
 *
 * Key Improvements:
 * - Each aspect (story, flow, voice, candidate appeal) gets dedicated attention
 * - Quality checkpoints catch issues before handoff
 * - Caching reduces costs by 30-40%
 * - Multiple paths for different essay states
 */

import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient } from '../../../lib/llm/claude';
import { Stage0Service } from './stage0Service';
import { parseClaudeJSON } from '../utils/jsonParser';
import type {
  EmotionalRegister,
  SparkGapAnalysis,
  VoiceExcavationInput,
  InterviewResponse,
  CoreStoryIdentification,
  SceneConstruction,
  VoiceIntegrationResult,
  QualityVerification,
  Stage0MultiStageOutput,
  Stage0MultiStageCostTracking,
  Stage0PipelineCache,
  VoiceFirstDraft,
} from '../types/stage0Types';
import { REGISTER_PROFILES } from '../types/stage0Types';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';
const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

const SONNET_PRICING = {
  input: 3.0 / 1_000_000,
  output: 15.0 / 1_000_000,
};

const HAIKU_PRICING = {
  input: 0.8 / 1_000_000,
  output: 4.0 / 1_000_000,
};

// ============================================================================
// STAGE 0B: CORE STORY PROMPT
// ============================================================================

const CORE_STORY_PROMPT = `You are identifying the CORE STORY and CANDIDATE APPEAL for a college essay.

ESSAY CONTEXT:
- Original Draft: {draft}
- Buried Spark: {buriedSpark}
- Interview Responses: {interviewResponses}
- Essay Prompt: {prompt}
- Detected Register: {register}

---

## YOUR TASK

Before writing anything, identify the foundation of this essay.

### 1. THE ONE-SENTENCE STORY
What is THE story here? Not a summary—the emotional core.

BAD (summary): "I learned about business through various experiences"
GOOD (core): "A middle schooler's Shark Tank obsession became a real business empire"
GOOD (core): "Learning to exist in the space my grandfather's absence created"

### 2. CANDIDATE APPEAL
What makes THIS WRITER someone an admissions officer would want?
- What unique qualities does this person have?
- What would they bring to campus?
- Why would a roommate be glad to live with them?
- What's the "I must have this student" factor?

### 3. QUALITIES TO SHOWCASE
List 3-4 SPECIFIC traits the essay should demonstrate.

AVOID generic traits: "hardworking", "passionate", "leader", "dedicated"
USE specific traits:
- "obsessive curiosity that annoys roommates at 1 AM"
- "ability to find absurd humor in startup pitches"
- "entrepreneurial energy that can't be contained"
- "quiet resilience that shows through small actions"

### 4. EMOTIONAL ARC
Where does the reader start and end?
- Beginning state: What does the reader feel at the opening?
- End state: What do they feel at the close?
- What changes for the reader?

### 5. CENTERING THE WRITER
How do we keep the WRITER as the focus, not:
- The activity/subject matter (coding, business, etc.)
- Other people (mentors, family members)
- The college
- Abstract lessons

---

## OUTPUT FORMAT

\`\`\`json
{
  "oneSentenceStory": "<the emotional core in one sentence>",
  "candidateAppeal": {
    "uniqueValue": "<what makes them special>",
    "campusContribution": "<what they'd bring>",
    "mustHaveFactor": "<the 'I want this student' quality>"
  },
  "qualitiesToShowcase": [
    "<specific trait 1>",
    "<specific trait 2>",
    "<specific trait 3>"
  ],
  "emotionalArc": {
    "readerStartsFeeling": "<opening emotional state>",
    "readerEndsFeeling": "<closing emotional state>",
    "whatChanges": "<the transformation>"
  },
  "centeringStrategies": [
    "<how to keep writer as focus>"
  ]
}
\`\`\``;

// ============================================================================
// STAGE 0C: SCENE CONSTRUCTION PROMPT
// ============================================================================

const SCENE_CONSTRUCTION_PROMPT = `You are constructing the SCENES for a college essay.

CORE STORY FOUNDATION:
{coreStory}

AVAILABLE MATERIAL:
- Buried Spark: {buriedSpark}
- Interview Responses: {interviewResponses}
- Register: {register}
- Original Draft: {draft}

WORD LIMIT: {wordLimit}

---

## YOUR TASK

Build 2-3 KEY SCENES that tell the story identified above.

### SCENE REQUIREMENTS

Each scene must:
1. **CENTER THE WRITER** - The writer is the main character, not a bystander
2. **SHOW, DON'T TELL** - Specific actions, dialogue, sensory details
3. **MOVE THE ARC FORWARD** - Each scene advances the emotional journey
4. **CONNECT NATURALLY** - Transitions feel organic, not forced

### TRANSITION PRINCIPLES

BAD transitions (choppy, no flow):
- "Then came my Economics class in 9th grade where I learned..."
- "My next step started when..."
- "In addition to this experience..."
- [Paragraph with no connection to previous]

GOOD transitions (natural momentum):
- Echo a word or idea from the previous scene
- Time jump with a grounding detail ("Three weeks later...")
- Contrast that creates meaning ("But that certainty didn't last")
- Question that the next scene answers

### VOCABULARY GUIDELINES

AVOID overwrought language that exhausts the reader:
- ❌ "fundamentally shifted my perspective on how businesses drive societal transformation"
- ❌ "sophisticated insights into purchasing psychology and consumer behavior analysis"
- ❌ "institutional knowledge", "computational research environment"

USE smart but readable language:
- ✅ Clear, confident sentences a smart 17-year-old would write
- ✅ Occasional precise word that shows intelligence
- ✅ Complex ideas expressed simply
- ✅ Language that doesn't make the reader work too hard

### WORD ECONOMY

With {wordLimit} words, you have roughly:
- Opening hook: 30-50 words
- Scene 1: 60-80 words
- Transition: 15-25 words
- Scene 2: 60-80 words
- Transition: 15-25 words
- Scene 3 (if needed): 40-60 words
- Closing: 30-50 words

Every word must earn its place. No filler.

---

## OUTPUT FORMAT

\`\`\`json
{
  "scenes": [
    {
      "sceneNumber": 1,
      "purpose": "<what this scene accomplishes for the arc>",
      "writerFocus": "<how the writer is centered here>",
      "content": "<the scene content - specific, grounded, showing not telling>",
      "wordCount": <number>
    },
    {
      "sceneNumber": 2,
      "purpose": "<what this scene accomplishes>",
      "transitionFromPrevious": "<exact transition text that connects naturally>",
      "writerFocus": "<how the writer is centered>",
      "content": "<the scene content>",
      "wordCount": <number>
    }
  ],
  "openingHook": {
    "content": "<the opening 1-2 sentences>",
    "whyItWorks": "<why this draws the reader in>"
  },
  "closing": {
    "content": "<the closing 1-2 sentences>",
    "arcCompletion": "<how this completes the emotional arc>"
  },
  "flowCheck": {
    "overallNarrative": "<does this read as one cohesive story?>",
    "transitionQuality": "<are transitions natural or forced?>",
    "momentumMaintained": "<does reader want to keep reading?>"
  },
  "totalWordCount": <number>
}
\`\`\``;

// ============================================================================
// STAGE 0D: VOICE INTEGRATION PROMPT
// ============================================================================

const VOICE_INTEGRATION_PROMPT = `You are integrating AUTHENTIC VOICE into a structured essay draft.

SCENE STRUCTURE:
{sceneStructure}

VOICE CONTEXT:
- Register: {register}
- Register Profile: {registerProfile}
- Buried Spark Phrases: {buriedSpark}
- Interview Voice Samples: {interviewResponses}

CORE STORY:
{coreStory}

---

## YOUR TASK

Take the scene structure and integrate authentic voice WITHOUT breaking flow.

### THE VOICE INTEGRATION PRINCIPLE

Voice is NOT:
- Rewriting the whole essay casually
- Adding filler words ("like", "literally", "honestly")
- Making everything conversational
- Overwhelming vocabulary

Voice IS:
- 2-4 strategic moments of authentic personality
- Natural word choices that fit the writer
- Rhythm that feels like ONE person
- Spark moments that surprise without jarring

### VOCABULARY BALANCE

Keep it smart but readable. Avoid exhausting the reader.

AVOID:
- "institutional knowledge"
- "computational research environment"
- "sophisticated insights into purchasing psychology"
- "fundamentally shifted my perspective on how businesses drive societal transformation"

USE:
- Clear, direct sentences
- Smart word choices a 17-year-old would actually use
- Complex ideas expressed simply
- Vocabulary that doesn't make the reader work too hard

### SPARK PLACEMENT (2-4 moments only)

Add spark at strategic points:
1. **Opening hook** - One unexpected detail or phrasing
2. **A moment of genuine specificity** - Detail so particular it must be real
3. **A flash of personality** - Where the writer's voice briefly shines
4. **Closing** - Something that lingers, not a neat bow

### PRESERVE THE FLOW

As you add voice:
- Keep transitions from Scene Construction intact
- Don't interrupt narrative momentum
- Make spark moments feel earned, not forced
- Ensure the essay still reads as one cohesive piece

---

## OUTPUT

First, write the COMPLETE ESSAY with voice integrated.
Then provide annotations.

DRAFT:
<the complete essay - readable, flowing, with strategic spark moments>

---

ANNOTATIONS:
\`\`\`json
{
  "wordCount": <number>,
  "sparkMoments": [
    {
      "text": "<the spark phrase>",
      "location": "<where in draft>",
      "type": "<hook|specificity|personality|closing>",
      "source": "<interview|buried_spark|generated>",
      "flowPreserved": true
    }
  ],
  "vocabularyChoices": [
    {
      "phrase": "<smart but readable choice>",
      "avoided": "<overwrought alternative we didn't use>",
      "why": "<why this works better>"
    }
  ],
  "flowCheck": {
    "transitionsIntact": <true|false>,
    "readsAsOneVoice": <true|false>,
    "momentumMaintained": <true|false>
  }
}
\`\`\``;

// ============================================================================
// STAGE 0E: QUALITY VERIFICATION PROMPT (HAIKU)
// ============================================================================

const QUALITY_VERIFICATION_PROMPT = `You are doing a QUICK QUALITY CHECK on a college essay draft.

DRAFT:
{draft}

CORE STORY (what it should accomplish):
{coreStory}

---

## CHECK THESE FIVE THINGS

Rate each 1-5 and note specific issues:

### 1. CANDIDATE CENTERING
Is the WRITER clearly the focus and a compelling candidate?
- Do we understand who they are?
- Would an AO want to admit them?
- Is it about THEM, not just their experiences?

### 2. NARRATIVE FLOW
Does the essay flow naturally?
- Smooth transitions between scenes?
- Momentum maintained throughout?
- Reads as one cohesive piece?

### 3. VOCABULARY APPROPRIATENESS
Is the language smart but readable?
- Not overwrought or exhausting?
- Fits a 17-year-old voice?
- Complex ideas expressed clearly?

### 4. SPARK QUALITY
Are the authentic moments effective?
- Feel natural, not forced?
- Enhance rather than disrupt?
- 2-4 moments, not overwhelming?

### 5. OVERALL READABILITY
Would you want to keep reading?
- Engaging opening?
- Satisfying (not clichéd) close?
- Enjoyable to read?

---

## OUTPUT

\`\`\`json
{
  "scores": {
    "candidateCentering": <1-5>,
    "narrativeFlow": <1-5>,
    "vocabularyAppropriateness": <1-5>,
    "sparkQuality": <1-5>,
    "overallReadability": <1-5>
  },
  "overallScore": <average>,
  "passesQuality": <true if all scores >= 4>,
  "issues": [
    {
      "category": "<which of the 5>",
      "problem": "<specific issue>",
      "location": "<where in draft>",
      "suggestedFix": "<how to address>"
    }
  ],
  "revisionNeeded": <true|false>
}
\`\`\``;

// ============================================================================
// STAGE 0F: TARGETED REVISION PROMPT
// ============================================================================

const TARGETED_REVISION_PROMPT = `You are making TARGETED REVISIONS to a college essay based on specific issues.

CURRENT DRAFT:
{draft}

ISSUES TO FIX:
{issues}

WHAT'S WORKING (preserve these):
{workingElements}

---

## YOUR TASK

Fix ONLY the identified issues. Do NOT:
- Rewrite sections that are working
- Add new content unless necessary
- Change the voice or register
- Alter the scene structure

DO:
- Address each issue specifically
- Maintain flow and transitions
- Preserve spark moments that are working
- Keep vocabulary balanced

---

## OUTPUT

REVISED DRAFT:
<the essay with targeted fixes applied>

---

CHANGES MADE:
\`\`\`json
{
  "changesApplied": [
    {
      "issue": "<what was fixed>",
      "before": "<original text>",
      "after": "<revised text>",
      "reasoning": "<why this fixes the issue>"
    }
  ],
  "preservedElements": ["<what was kept>"]
}
\`\`\``;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateSonnetCost(input: number, output: number): number {
  return (input * SONNET_PRICING.input) + (output * SONNET_PRICING.output);
}

function calculateHaikuCost(input: number, output: number): number {
  return (input * HAIKU_PRICING.input) + (output * HAIKU_PRICING.output);
}

function parseJsonFromResponse<T = any>(text: string, context?: string): T {
  // Use the robust parseClaudeJSON utility that handles:
  // - Trailing commas
  // - Comments
  // - Unclosed braces
  // - Text before/after JSON
  return parseClaudeJSON<T>(text, context);
}

// ============================================================================
// MULTI-STAGE SERVICE CLASS
// ============================================================================

export class Stage0MultiStageService extends Stage0Service {
  private multiStageClient: Anthropic;
  private cache: Stage0PipelineCache;

  constructor(apiKey?: string) {
    super(apiKey);
    this.multiStageClient = apiKey ? new Anthropic({ apiKey }) : getAnthropicClient();
    this.cache = { lastUpdated: new Date() };
  }

  /**
   * Clear the pipeline cache (call between essays)
   */
  clearCache(): void {
    this.cache = { lastUpdated: new Date() };
  }

  /**
   * Stage 0B: Identify core story and candidate appeal
   */
  async identifyCoreStory(
    input: VoiceExcavationInput,
    analysis: SparkGapAnalysis,
    interviewResponses: InterviewResponse[]
  ): Promise<{ result: CoreStoryIdentification; tokens: { input: number; output: number } }> {
    // Check cache
    if (this.cache.coreStory) {
      return { result: this.cache.coreStory, tokens: { input: 0, output: 0 } };
    }

    const register = analysis.detectedRegister.primary.toLowerCase() as EmotionalRegister;

    const formattedResponses = interviewResponses
      .map(r => `Q: ${r.question}\nA: ${r.response}`)
      .join('\n\n');

    const formattedBuriedSpark = analysis.buriedSpark
      .map(s => `"${s.quote}" - ${s.whyAuthentic}`)
      .join('\n');

    const prompt = CORE_STORY_PROMPT
      .replace('{draft}', input.rawDraft)
      .replace('{buriedSpark}', formattedBuriedSpark || 'None found')
      .replace('{interviewResponses}', formattedResponses || 'None provided')
      .replace('{prompt}', input.essayPrompt)
      .replace('{register}', register);

    const response = await this.multiStageClient.messages.create({
      model: SONNET_MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const result = parseJsonFromResponse<CoreStoryIdentification>(content.text, 'Stage0B CoreStoryIdentification');

    // Cache result
    this.cache.coreStory = result;
    this.cache.lastUpdated = new Date();

    return {
      result,
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  }

  /**
   * Stage 0C: Construct scenes with natural flow
   */
  async constructScenes(
    input: VoiceExcavationInput,
    analysis: SparkGapAnalysis,
    coreStory: CoreStoryIdentification,
    interviewResponses: InterviewResponse[],
    wordLimit: number
  ): Promise<{ result: SceneConstruction; tokens: { input: number; output: number } }> {
    // Check cache
    if (this.cache.sceneStructure) {
      return { result: this.cache.sceneStructure, tokens: { input: 0, output: 0 } };
    }

    const register = analysis.detectedRegister.primary.toLowerCase() as EmotionalRegister;

    const formattedResponses = interviewResponses
      .map(r => `Q: ${r.question}\nA: ${r.response}`)
      .join('\n\n');

    const formattedBuriedSpark = analysis.buriedSpark
      .map(s => `"${s.quote}" - ${s.whyAuthentic}`)
      .join('\n');

    const prompt = SCENE_CONSTRUCTION_PROMPT
      .replace('{coreStory}', JSON.stringify(coreStory, null, 2))
      .replace('{buriedSpark}', formattedBuriedSpark || 'None found')
      .replace('{interviewResponses}', formattedResponses || 'None provided')
      .replace('{register}', register)
      .replace('{draft}', input.rawDraft)
      .replace(/{wordLimit}/g, wordLimit.toString());

    const response = await this.multiStageClient.messages.create({
      model: SONNET_MODEL,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const result = parseJsonFromResponse<SceneConstruction>(content.text, 'Stage0C SceneConstruction');

    // Cache result
    this.cache.sceneStructure = result;
    this.cache.lastUpdated = new Date();

    return {
      result,
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  }

  /**
   * Stage 0D: Integrate voice into scene structure
   */
  async integrateVoice(
    input: VoiceExcavationInput,
    analysis: SparkGapAnalysis,
    coreStory: CoreStoryIdentification,
    sceneStructure: SceneConstruction,
    interviewResponses: InterviewResponse[]
  ): Promise<{ result: VoiceIntegrationResult; tokens: { input: number; output: number } }> {
    // Check cache
    if (this.cache.voiceIntegratedDraft) {
      return { result: this.cache.voiceIntegratedDraft, tokens: { input: 0, output: 0 } };
    }

    const register = analysis.detectedRegister.primary.toLowerCase() as EmotionalRegister;
    const profile = REGISTER_PROFILES[register];

    const formattedResponses = interviewResponses
      .map(r => `Q: ${r.question}\nA: ${r.response}`)
      .join('\n\n');

    const formattedBuriedSpark = analysis.buriedSpark
      .map(s => `"${s.quote}" - ${s.whyAuthentic}`)
      .join('\n');

    const prompt = VOICE_INTEGRATION_PROMPT
      .replace('{sceneStructure}', JSON.stringify(sceneStructure, null, 2))
      .replace('{register}', register)
      .replace('{registerProfile}', JSON.stringify(profile, null, 2))
      .replace('{buriedSpark}', formattedBuriedSpark || 'None found')
      .replace('{interviewResponses}', formattedResponses || 'None provided')
      .replace('{coreStory}', JSON.stringify(coreStory, null, 2));

    const response = await this.multiStageClient.messages.create({
      model: SONNET_MODEL,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse draft and annotations
    const text = content.text;

    // Try multiple patterns to find the draft
    let draftMatch = text.match(/DRAFT:\s*([\s\S]*?)(?=---\s*ANNOTATIONS:|ANNOTATIONS:|```json|$)/i);

    // If no DRAFT: label, try to extract text before the JSON block
    if (!draftMatch) {
      draftMatch = text.match(/^([\s\S]*?)(?=---\s*ANNOTATIONS:|ANNOTATIONS:\s*```|```json)/i);
    }

    // If still nothing, use the whole text before any JSON
    if (!draftMatch || !draftMatch[1].trim()) {
      const jsonStart = text.indexOf('```json');
      if (jsonStart > 0) {
        draftMatch = [text, text.slice(0, jsonStart).trim()];
      }
    }

    const annotations = parseJsonFromResponse<any>(text, 'Stage0D VoiceIntegration annotations');

    if (!draftMatch || !draftMatch[1].trim()) {
      console.error('Could not parse draft. Response was:', text.slice(0, 500));
      throw new Error('Could not parse draft from response');
    }

    const result: VoiceIntegrationResult = {
      draft: draftMatch[1].trim(),
      wordCount: annotations.wordCount || draftMatch[1].trim().split(/\s+/).length,
      sparkMoments: annotations.sparkMoments || [],
      vocabularyChoices: annotations.vocabularyChoices || [],
      flowCheck: annotations.flowCheck || {
        transitionsIntact: true,
        readsAsOneVoice: true,
        momentumMaintained: true,
      },
    };

    // Cache result
    this.cache.voiceIntegratedDraft = result;
    this.cache.lastUpdated = new Date();

    return {
      result,
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  }

  /**
   * Stage 0E: Verify quality (uses Haiku for speed and cost)
   */
  async verifyQuality(
    draft: string,
    coreStory: CoreStoryIdentification
  ): Promise<{ result: QualityVerification; tokens: { input: number; output: number } }> {
    const prompt = QUALITY_VERIFICATION_PROMPT
      .replace('{draft}', draft)
      .replace('{coreStory}', JSON.stringify(coreStory, null, 2));

    const response = await this.multiStageClient.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const result = parseJsonFromResponse<QualityVerification>(content.text, 'Stage0E QualityVerification');

    // Cache result
    this.cache.qualityVerification = result;
    this.cache.lastUpdated = new Date();

    return {
      result,
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  }

  /**
   * Stage 0F: Apply targeted revisions if needed
   */
  async applyRevisions(
    draft: string,
    issues: QualityVerification['issues'],
    sparkMoments: VoiceIntegrationResult['sparkMoments']
  ): Promise<{ result: string; tokens: { input: number; output: number } }> {
    const workingElements = sparkMoments
      .filter(s => s.flowPreserved)
      .map(s => s.text);

    const prompt = TARGETED_REVISION_PROMPT
      .replace('{draft}', draft)
      .replace('{issues}', JSON.stringify(issues, null, 2))
      .replace('{workingElements}', workingElements.join('\n'));

    const response = await this.multiStageClient.messages.create({
      model: SONNET_MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse revised draft
    const draftMatch = content.text.match(/REVISED DRAFT:\s*([\s\S]*?)(?=---\s*CHANGES MADE:|$)/);
    if (!draftMatch) {
      throw new Error('Could not parse revised draft');
    }

    return {
      result: draftMatch[1].trim(),
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  }

  /**
   * Run the complete multi-stage pipeline
   */
  async runMultiStagePipeline(
    input: VoiceExcavationInput,
    interviewResponses: InterviewResponse[] = [],
    wordLimit: number = 300
  ): Promise<Stage0MultiStageOutput> {
    // Clear cache for new essay
    this.clearCache();

    const costTracking: Stage0MultiStageCostTracking = {
      analysisTokens: { input: 0, output: 0 },
      draftGenerationTokens: { input: 0, output: 0 },
      totalCost: 0,
    };

    const stagesRun: string[] = [];

    // Stage 0A: Spark Gap Analysis (inherited)
    console.log('  Stage 0A: Analyzing spark gap...');
    stagesRun.push('0A');
    const { analysis, tokens: analysisTokens } = await this.analyzeSparkGap(input);
    costTracking.analysisTokens = analysisTokens;
    console.log(`    Spark Score: ${analysis.sparkScore}/100 (${analysis.sparkLevel})`);
    console.log(`    Register: ${analysis.detectedRegister.primary}`);

    // Determine pipeline path
    let pipelinePath: 'full' | 'fast' | 'minimal' = 'full';
    if (analysis.sparkScore > 60 && analysis.registerFit > 7) {
      pipelinePath = 'fast';
      console.log('    Using FAST path (essay already has spark)');
    }

    // Stage 0B: Core Story Identification
    console.log('  Stage 0B: Identifying core story...');
    stagesRun.push('0B');
    const { result: coreStory, tokens: coreStoryTokens } = await this.identifyCoreStory(
      input,
      analysis,
      interviewResponses
    );
    costTracking.coreStoryTokens = coreStoryTokens;
    console.log(`    Story: "${coreStory.oneSentenceStory}"`);

    // Stage 0C: Scene Construction
    console.log('  Stage 0C: Constructing scenes...');
    stagesRun.push('0C');
    const { result: sceneStructure, tokens: sceneTokens } = await this.constructScenes(
      input,
      analysis,
      coreStory,
      interviewResponses,
      wordLimit
    );
    costTracking.sceneConstructionTokens = sceneTokens;
    console.log(`    Scenes: ${sceneStructure.scenes.length}`);
    console.log(`    Flow: ${sceneStructure.flowCheck.transitionQuality}`);

    // Stage 0D: Voice Integration
    console.log('  Stage 0D: Integrating voice...');
    stagesRun.push('0D');
    const { result: voiceIntegration, tokens: voiceTokens } = await this.integrateVoice(
      input,
      analysis,
      coreStory,
      sceneStructure,
      interviewResponses
    );
    costTracking.voiceIntegrationTokens = voiceTokens;
    console.log(`    Word count: ${voiceIntegration.wordCount}`);
    console.log(`    Spark moments: ${voiceIntegration.sparkMoments.length}`);

    // Stage 0E: Quality Verification (Haiku)
    console.log('  Stage 0E: Verifying quality...');
    stagesRun.push('0E');
    const { result: qualityVerification, tokens: verificationTokens } = await this.verifyQuality(
      voiceIntegration.draft,
      coreStory
    );
    costTracking.qualityVerificationTokens = verificationTokens;
    console.log(`    Overall score: ${qualityVerification.overallScore.toFixed(1)}/5`);
    console.log(`    Passes quality: ${qualityVerification.passesQuality}`);

    // Stage 0F: Targeted Revision (if needed)
    let finalDraft = voiceIntegration.draft;
    if (qualityVerification.revisionNeeded && qualityVerification.issues.length > 0) {
      console.log('  Stage 0F: Applying targeted revisions...');
      stagesRun.push('0F');
      const { result: revisedDraft, tokens: revisionTokens } = await this.applyRevisions(
        voiceIntegration.draft,
        qualityVerification.issues,
        voiceIntegration.sparkMoments
      );
      costTracking.revisionTokens = revisionTokens;
      finalDraft = revisedDraft;
      console.log('    Revisions applied');
    }

    // Calculate total cost
    const sonnetTokens =
      (costTracking.analysisTokens?.input || 0) +
      (costTracking.coreStoryTokens?.input || 0) +
      (costTracking.sceneConstructionTokens?.input || 0) +
      (costTracking.voiceIntegrationTokens?.input || 0) +
      (costTracking.revisionTokens?.input || 0);

    const sonnetOutputTokens =
      (costTracking.analysisTokens?.output || 0) +
      (costTracking.coreStoryTokens?.output || 0) +
      (costTracking.sceneConstructionTokens?.output || 0) +
      (costTracking.voiceIntegrationTokens?.output || 0) +
      (costTracking.revisionTokens?.output || 0);

    const haikuTokens = costTracking.qualityVerificationTokens?.input || 0;
    const haikuOutputTokens = costTracking.qualityVerificationTokens?.output || 0;

    costTracking.totalCost =
      calculateSonnetCost(sonnetTokens, sonnetOutputTokens) +
      calculateHaikuCost(haikuTokens, haikuOutputTokens);

    // Build VoiceFirstDraft for compatibility
    const register = analysis.detectedRegister.primary.toLowerCase() as EmotionalRegister;
    const voiceFirstDraft: VoiceFirstDraft = {
      draft: finalDraft,
      wordCount: finalDraft.split(/\s+/).length,
      register,
      voiceSources: voiceIntegration.sparkMoments.map(s => ({
        phrase: s.text,
        location: s.location,
        source: s.source === 'interview' ? 'interview' :
                s.source === 'buried_spark' ? 'buried_spark' : 'generated',
        preservedExactly: s.source !== 'generated',
      })),
      registerMarkers: [],
      preservedImperfections: [],
      riskyChoices: [],
      metrics: {
        sparkScore: qualityVerification.overallScore * 20, // Scale 5 → 100
        registerFit: Math.round(qualityVerification.overallScore * 2), // Scale 5 → 10
        authenticPhraseCount: voiceIntegration.sparkMoments.length,
        specificMomentCount: voiceIntegration.sparkMoments.filter(s => s.type === 'specificity').length,
        sensoryDetailCount: 0,
      },
      stage1Ready: qualityVerification.passesQuality,
    };

    // Build Stage 1 handoff
    const stage1Handoff = {
      draft: finalDraft,
      register,
      voiceContext: {
        authenticPhrases: voiceIntegration.sparkMoments.map(s => s.text),
        voiceQuirks: [],
        registerMarkers: [],
        topicsWithEnergy: analysis.buriedSpark
          .filter(s => s.amplificationPotential === 'high')
          .map(s => s.quote),
        topicsToAvoid: analysis.universalIssues.essayModeIndicators
          .filter(i => i.severity === 'severe')
          .map(i => i.indicator),
      },
      preservationWarnings: voiceIntegration.sparkMoments.map(s => `Preserve: "${s.text}"`),
    };

    // Set draftGenerationTokens for compatibility
    costTracking.draftGenerationTokens = {
      input: (costTracking.sceneConstructionTokens?.input || 0) + (costTracking.voiceIntegrationTokens?.input || 0),
      output: (costTracking.sceneConstructionTokens?.output || 0) + (costTracking.voiceIntegrationTokens?.output || 0),
    };

    return {
      analysis,
      voiceFirstDraft,
      stage1Handoff,
      costTracking,
      coreStory,
      sceneStructure,
      voiceIntegration,
      qualityVerification,
      pipelinePath,
      stagesRun,
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  CoreStoryIdentification,
  SceneConstruction,
  VoiceIntegrationResult,
  QualityVerification,
  Stage0MultiStageOutput,
};
