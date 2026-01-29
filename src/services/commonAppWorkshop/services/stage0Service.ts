/**
 * Stage 0: Voice Excavation Service
 *
 * This service transforms bland, "essay mode" drafts into compelling narratives
 * with authentic spark. It works by:
 *
 * 1. ANALYZING the draft for spark gaps and authentic moments
 * 2. DETECTING the appropriate emotional register for this essay
 * 3. EXCAVATING authentic voice through targeted questions
 * 4. GENERATING a voice-first draft that prioritizes authenticity over structure
 *
 * Key Insight: We're not writing the essay for the student. We're excavating
 * the essay that's already inside them but buried under "college essay" expectations.
 */

import Anthropic from '@anthropic-ai/sdk';
import { parseClaudeJSON } from '../utils/jsonParser';
import type {
  EmotionalRegister,
  SparkGapAnalysis,
  SparkLevel,
  VoiceExcavationInput,
  VoiceFirstDraft,
  Stage0Output,
  ExcavationQuestion,
  InterviewResponse,
  RegisterDetection,
} from '../types/stage0Types';
import {
  REGISTER_PROFILES,
  REGISTER_QUESTION_BANKS,
  PROMPT_REGISTER_MAPPINGS,
} from '../types/stage0Types';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250514';
const SONNET_PRICING = {
  input: 3.0 / 1_000_000,   // $3 per million input tokens
  output: 15.0 / 1_000_000, // $15 per million output tokens
};

// ============================================================================
// SPARK GAP ANALYSIS PROMPT
// ============================================================================

const SPARK_GAP_ANALYSIS_PROMPT = `You are a voice authenticity analyst. Your job is to determine whether this essay draft sounds like a real person or like a "college essay."

ESSAY DRAFT:
{draft}

VOICE SAMPLE (if provided):
{voiceSample}

ESSAY PROMPT:
{prompt}

---

## STEP 1: DETECT EMOTIONAL REGISTER

First, identify which emotional register this essay should use based on the prompt and content:

1. ENERGETIC_ENTHUSIASM: Intellectual vitality, passion, "why this major"
   - Voice: Fast rhythm, tangents, genuine wonder, embarrassing excitement
   - Example: "I have 47 tabs open about medieval siege weapons and honestly? I don't know how I got here."

2. QUIET_INTENSITY: Identity, cultural, introspective
   - Voice: Precision, weight in observations, breath between thoughts, understatement
   - Example: "My grandmother's hands. Flour under the nails, always. Even at the hospital."

3. MELANCHOLY_LOSS: Challenges, grief, failure
   - Voice: Haunting specificity, dry humor, present tense for memories, emotional restraint
   - Example: "The last thing he said was 'don't forget the milk.' I think about this every time I open the refrigerator."

4. DEFIANT_IRREVERENT: Against-the-grain, unconventional
   - Voice: Blunt, short punchy sentences, comfortable with discomfort, edge
   - Example: "Everyone says I should be grateful. I'm not."

5. WONDER_CURIOSITY: Discovery, research, intellectual journeys
   - Voice: Questions leading to questions, visible thinking, admitted confusion
   - Example: "The question that ruined my sleep for three weeks: Why do we have two nostrils?"

6. WARMTH_CONNECTION: Relationships, community, influence
   - Voice: Specific dialogue, physical details, private moments, love through specificity
   - Example: "'You're holding it wrong.' My grandmother said this about everything."

STATE the detected register, confidence (0-100), and explain why.

---

## STEP 2: CHECK UNIVERSAL ESSAY MODE RED FLAGS

Look for these signs of "performed" voice (deduct from spark score):

- Generic transitions ("Furthermore", "In conclusion", "This experience taught me")
- Abstract claims without specific moments or sensory grounding
- Vocabulary that sounds "impressive" not natural to this person
- Perfect structure with clear thesis and conclusion
- Name-drops the college in a calculated way
- Uses the prompt's language back at the prompt
- Every point ties together too neatly
- Missing embodiment (no physical/sensory details)
- No stakes (nothing at risk, nothing to lose)
- Performed vulnerability (placed strategically, not earned)

For each indicator found, quote the text and explain the issue.

---

## STEP 3: CHECK UNIVERSAL AUTHENTIC VOICE GREEN FLAGS

Look for these signs of genuine voice (add to spark score):

- Unexpected word choices that feel specific to this person
- Sentence rhythms that feel human (fragments, long sentences, breath)
- Specific details that seem randomly included because they're REAL
- At least one moment of surprise (unexpected turn, detail, ending)
- Contradictions or complications (real people aren't resolved)
- Sensory grounding (we can see/hear/feel something)
- Something at stake (tension, even if quiet)

For each indicator found, quote the text and explain why it's authentic.

---

## STEP 4: CHECK REGISTER-SPECIFIC ELEMENTS

Based on the detected register, check for register-specific green and red flags:

For ENERGETIC_ENTHUSIASM:
- Green: Naive wonder, run-on energy, embarrassing excitement, absurd specificity
- Red: Forced enthusiasm, claiming passion without evidence, too polished

For QUIET_INTENSITY:
- Green: Precise observations, meaningful white space, restraint, symbolic details
- Red: Over-explaining, too many words, missing the weight of silence

For MELANCHOLY_LOSS:
- Green: Haunting specificity, dry humor, unresolved grief, small carrying objects
- Red: Melodrama, forced silver lining, "I learned from this" resolution

For DEFIANT_IRREVERENT:
- Green: Direct challenge, uncomfortable truths, edge, doubling down
- Red: Trying too hard to be edgy, softening at the end, fake rebellion

For WONDER_CURIOSITY:
- Green: Questions leading to questions, visible thinking, admitted confusion
- Red: Just reporting conclusions, no mess, too certain

For WARMTH_CONNECTION:
- Green: Specific dialogue, physical details, rituals, inside references
- Red: Declaring love instead of showing, generic relationship description

---

## STEP 5: FIND BURIED SPARK

Look for moments in the draft that sound DIFFERENT from the rest—more real, more specific, more like a person. These are excavation gold.

For each buried spark moment:
- Quote the text
- Explain why it's authentic
- Rate amplification potential (high/medium/low)
- Note which register this moment belongs to

---

## STEP 6: OUTPUT

Provide your analysis in this JSON format:

\`\`\`json
{
  "sparkScore": <0-100>,
  "sparkLevel": "<full_essay_mode|mostly_essay|mixed|mostly_authentic|authentic>",
  "detectedRegister": {
    "primary": "<register>",
    "secondary": "<register or null>",
    "confidence": <0-100>,
    "reasoning": "<explanation>",
    "avoid": ["<registers that would be mismatched>"]
  },
  "registerFit": <1-10>,
  "universalIssues": {
    "essayModeIndicators": [
      {
        "indicator": "<type of issue>",
        "quote": "<quoted text>",
        "location": "<paragraph number or description>",
        "severity": "<minor|moderate|severe>",
        "howToFix": "<specific suggestion>"
      }
    ],
    "missingElements": [
      {
        "element": "<specificity|stakes|surprise|embodiment|voice_consistency>",
        "description": "<what's missing>",
        "howToExcavate": "<question to ask>"
      }
    ]
  },
  "registerIssues": {
    "register": "<detected register>",
    "missingQualities": ["<what this register needs>"],
    "wrongTone": ["<elements that don't match>"],
    "recommendations": ["<specific suggestions>"]
  },
  "buriedSpark": [
    {
      "quote": "<the authentic moment>",
      "location": "<where in the essay>",
      "whyAuthentic": "<explanation>",
      "register": "<which register this belongs to>",
      "amplificationPotential": "<high|medium|low>"
    }
  ],
  "sectionAnalysis": [
    {
      "text": "<section text or summary>",
      "verdict": "<authentic|essay_mode|mixed>",
      "registerMatch": <true|false>,
      "explanation": "<why this verdict>"
    }
  ],
  "recommendation": "<skip_to_stage_1|light_excavation|full_excavation>",
  "recommendedQuestions": [
    {
      "id": "<unique id>",
      "question": "<the question to ask>",
      "purpose": "<recover_voice|find_specifics|uncover_stakes|amplify_spark|find_quirks|access_emotion>",
      "targetRegister": "<register>",
      "targetedAt": "<what issue or spark this targets>",
      "potential": "<high|medium|low>"
    }
  ]
}
\`\`\``;

// ============================================================================
// VOICE-FIRST DRAFT GENERATION PROMPT
// ============================================================================

const VOICE_FIRST_DRAFT_PROMPT = `You are generating a POLISHED, WELL-CRAFTED essay that contains STRATEGIC MOMENTS of authentic voice.

CRITICAL UNDERSTANDING:
- This is NOT a casual text message or conversation with a friend
- This IS a sophisticated college essay that demonstrates intellectual capability
- Spark = 2-4 strategic moments where genuine personality shines through
- The REST should be impressive, well-structured writing that showcases intelligence

DETECTED REGISTER: {register}

REGISTER PROFILE:
{registerProfile}

INTERVIEW RESPONSES:
{interviewResponses}

VOICE SAMPLE:
{voiceSample}

BURIED SPARK FROM ORIGINAL:
{buriedSpark}

ORIGINAL DRAFT (for reference):
{originalDraft}

ESSAY PROMPT:
{prompt}

WORD LIMIT: {wordLimit}

---

## THE SPARK-AS-ACCENT PRINCIPLE

Think of spark like seasoning, not the main dish:
- 85-90% of the essay = polished, sophisticated, demonstrates competence
- 10-15% = strategic moments of authentic voice that surprise and delight

GOOD EXAMPLE (CMU essay):
- "The sharks fight over the newest electrical flying rug!" (ONE absurd specific)
- "SAUCED" (ONE weird brand name)
- "I screamed 'I got the offer!'" (ONE unfiltered moment)
- The rest = well-structured narrative showing business acumen

BAD EXAMPLE:
- "Okay so I literally..." (wastes words on filler)
- "honestly?" every other sentence (exhausting)
- Entire essay sounds like texting (unprofessional)

---

## WHAT MAKES A QUALITY ESSAY (Maintain These)

1. **Strong Vocabulary**: Use sophisticated words appropriately (keep "transversed" if it fits)
2. **Efficient Word Use**: Every word earns its place - no filler
3. **Clear Structure**: Logical flow that demonstrates organized thinking
4. **Intellectual Depth**: Show you can think and articulate complex ideas
5. **Professional Tone**: This is a formal application, not a chat
6. **Impressive Content**: Demonstrate achievements, growth, capability

---

## WHERE TO ADD SPARK (2-4 Strategic Moments)

1. **ONE unexpected opening or hook** - A specific detail that draws the reader in
2. **ONE moment of genuine specificity** - A detail so particular it must be real
3. **ONE flash of authentic voice** - Where personality briefly shines through
4. **ONE ending that stays with the reader** - Not a neat bow, but memorable

AVOID adding spark through:
- Filler words ("like", "literally", "honestly", "okay so")
- Rhetorical questions that waste space
- Overly casual tone throughout
- Self-deprecation that undermines credibility
- Run-on conversational sentences

ADD spark through:
- A single unexpected specific detail
- One perfectly chosen unusual word
- A brief moment of genuine emotion (earned, not performed)
- An ending that opens rather than closes

---

## REGISTER-SPECIFIC GUIDANCE

{registerInstructions}

Remember: The register affects the TYPE of spark moments, not the overall quality level.
- Energetic Enthusiasm: Spark through ONE absurd specific, ONE moment of uncontainable excitement
- Melancholy/Loss: Spark through ONE haunting detail, ONE unresolved moment
- Etc.

---

## OUTPUT FORMAT

Generate the draft, then provide annotations in this format:

DRAFT:
<the full essay draft - polished, sophisticated, with strategic spark moments>

---

ANNOTATIONS:
\`\`\`json
{
  "wordCount": <number>,
  "sparkMoments": [
    {
      "text": "<the spark moment>",
      "location": "<where in draft>",
      "type": "<unexpected_specific|genuine_emotion|authentic_detail|memorable_ending>",
      "source": "<interview|buried_spark|generated>",
      "whyItWorks": "<how this adds authenticity without sacrificing quality>"
    }
  ],
  "sophisticationElements": [
    {
      "element": "<vocabulary choice, structure, etc>",
      "location": "<where>",
      "whyImpressive": "<what this demonstrates about the writer>"
    }
  ],
  "qualityMetrics": {
    "vocabularySophistication": <1-10>,
    "structureClarity": <1-10>,
    "intellectualDepth": <1-10>,
    "wordEfficiency": <1-10>,
    "sparkBalance": <1-10 - where 5 is ideal, 1 is no spark, 10 is too casual>
  },
  "metrics": {
    "sparkScore": <estimated 0-100>,
    "registerFit": <1-10>,
    "authenticPhraseCount": <number>,
    "specificMomentCount": <number>,
    "sensoryDetailCount": <number>
  },
  "stage1Ready": <true|false>
}
\`\`\``;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get spark level from score
 */
function getSparkLevel(score: number): SparkLevel {
  if (score <= 30) return 'full_essay_mode';
  if (score <= 50) return 'mostly_essay';
  if (score <= 70) return 'mixed';
  if (score <= 85) return 'mostly_authentic';
  return 'authentic';
}

/**
 * Detect register from prompt
 */
function detectRegisterFromPrompt(prompt: string): EmotionalRegister | null {
  for (const mapping of PROMPT_REGISTER_MAPPINGS) {
    if (mapping.promptPattern.test(prompt)) {
      return mapping.primaryRegister;
    }
  }
  return null;
}

/**
 * Get register-specific instructions for draft generation
 */
function getRegisterInstructions(register: EmotionalRegister): string {
  // Normalize register to lowercase (Claude might return uppercase)
  const normalizedRegister = register.toLowerCase() as EmotionalRegister;
  const profile = REGISTER_PROFILES[normalizedRegister];

  if (!profile) {
    console.warn(`Unknown register: ${register}, defaulting to energetic_enthusiasm`);
    return getRegisterInstructions('energetic_enthusiasm');
  }

  const registerLabel = normalizedRegister;

  return `
### For ${normalizedRegister.replace(/_/g, ' ').toUpperCase()}:

REMEMBER: Maintain sophisticated writing. Add 2-4 spark moments that match this register.

**Spark opportunities for this register:**
${profile.greenFlags.map(f => `- ${f}`).join('\n')}

**What to avoid (undermine quality):**
${profile.redFlags.map(f => `- ${f}`).join('\n')}

**Example of spark in polished writing:**
${profile.exampleRhythms[0] || 'Use register-appropriate moments of authenticity'}

The spark moments should feel EARNED within otherwise impressive writing, not forced.
`;
}

/**
 * Calculate cost from token usage
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * SONNET_PRICING.input) + (outputTokens * SONNET_PRICING.output);
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class Stage0Service {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Analyze a draft for spark gaps and authentic moments
   */
  async analyzeSparkGap(
    input: VoiceExcavationInput
  ): Promise<{ analysis: SparkGapAnalysis; tokens: { input: number; output: number } }> {
    const prompt = SPARK_GAP_ANALYSIS_PROMPT
      .replace('{draft}', input.rawDraft)
      .replace('{voiceSample}', input.voiceSample || 'Not provided')
      .replace('{prompt}', input.essayPrompt);

    const response = await this.client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse the JSON from the response
    const analysis = parseClaudeJSON<SparkGapAnalysis>(content.text, 'SparkGapAnalysis');

    return {
      analysis,
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  }

  /**
   * Generate excavation questions based on analysis
   */
  generateExcavationQuestions(
    analysis: SparkGapAnalysis,
    count: number = 6
  ): ExcavationQuestion[] {
    const questions: ExcavationQuestion[] = [];
    // Normalize register to lowercase
    const rawRegister = analysis.detectedRegister.primary;
    const register = rawRegister.toLowerCase() as EmotionalRegister;

    // Use recommended questions from analysis
    if (analysis.recommendedQuestions && analysis.recommendedQuestions.length > 0) {
      questions.push(...analysis.recommendedQuestions.slice(0, count));
    }

    // Supplement with register-specific questions if needed
    if (questions.length < count) {
      const bankQuestions = REGISTER_QUESTION_BANKS[register] || [];
      const needed = count - questions.length;

      for (let i = 0; i < Math.min(needed, bankQuestions.length); i++) {
        questions.push({
          id: `bank_${register}_${i}`,
          question: bankQuestions[i],
          purpose: 'recover_voice',
          targetRegister: register,
          potential: 'medium',
        });
      }
    }

    return questions;
  }

  /**
   * Generate a voice-first draft based on excavation results
   */
  async generateVoiceFirstDraft(
    input: VoiceExcavationInput,
    analysis: SparkGapAnalysis,
    interviewResponses: InterviewResponse[],
    wordLimit: number = 300
  ): Promise<{ draft: VoiceFirstDraft; tokens: { input: number; output: number } }> {
    // Normalize register to lowercase (Claude might return uppercase)
    const rawRegister = analysis.detectedRegister.primary;
    const register = rawRegister.toLowerCase() as EmotionalRegister;
    const profile = REGISTER_PROFILES[register];

    // Format interview responses
    const formattedResponses = interviewResponses
      .map(r => `Q: ${r.question}\nA: ${r.response}`)
      .join('\n\n');

    // Format buried spark
    const formattedBuriedSpark = analysis.buriedSpark
      .map(s => `"${s.quote}" - ${s.whyAuthentic}`)
      .join('\n');

    const prompt = VOICE_FIRST_DRAFT_PROMPT
      .replace('{register}', register)
      .replace('{registerProfile}', JSON.stringify(profile, null, 2))
      .replace('{interviewResponses}', formattedResponses || 'None provided')
      .replace('{voiceSample}', input.voiceSample || 'Not provided')
      .replace('{buriedSpark}', formattedBuriedSpark || 'None found')
      .replace('{originalDraft}', input.rawDraft)
      .replace('{prompt}', input.essayPrompt)
      .replace('{wordLimit}', wordLimit.toString())
      .replace('{registerInstructions}', getRegisterInstructions(register));

    const response = await this.client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse draft and annotations
    const text = content.text;
    const draftMatch = text.match(/DRAFT:\s*([\s\S]*?)(?=---\s*ANNOTATIONS:|$)/);
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);

    if (!draftMatch) {
      throw new Error('Could not parse draft from Claude response');
    }

    const draftText = draftMatch[1].trim();
    const annotations = jsonMatch ? JSON.parse(jsonMatch[1]) : {};

    const voiceFirstDraft: VoiceFirstDraft = {
      draft: draftText,
      wordCount: annotations.wordCount || draftText.split(/\s+/).length,
      register,
      voiceSources: annotations.voiceSources || [],
      registerMarkers: annotations.registerMarkers || [],
      preservedImperfections: annotations.preservedImperfections || [],
      riskyChoices: annotations.riskyChoices || [],
      metrics: annotations.metrics || {
        sparkScore: 75,
        registerFit: 7,
        authenticPhraseCount: 0,
        specificMomentCount: 0,
        sensoryDetailCount: 0,
      },
      stage1Ready: annotations.stage1Ready ?? true,
    };

    return {
      draft: voiceFirstDraft,
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  }

  /**
   * Run the complete Stage 0 pipeline
   */
  async runStage0(
    input: VoiceExcavationInput,
    interviewResponses?: InterviewResponse[],
    wordLimit: number = 300
  ): Promise<Stage0Output> {
    // Step 1: Analyze spark gap
    console.log('  Analyzing spark gap...');
    const { analysis, tokens: analysisTokens } = await this.analyzeSparkGap(input);
    console.log(`  Spark Score: ${analysis.sparkScore}/100 (${analysis.sparkLevel})`);
    console.log(`  Detected Register: ${analysis.detectedRegister.primary}`);

    // Step 2: Check if we need excavation
    const needsExcavation = analysis.recommendation !== 'skip_to_stage_1';
    let excavationData = undefined;
    let excavationTokens = { input: 0, output: 0 };

    if (needsExcavation && !interviewResponses) {
      // Generate questions (in a real system, these would be asked to the user)
      console.log('  Generating excavation questions...');
      const questions = this.generateExcavationQuestions(analysis);
      console.log(`  Generated ${questions.length} excavation questions`);

      excavationData = {
        questionsAsked: questions,
        responsesReceived: [],
        voicePatternsIdentified: [],
        registerClarity: 5,
      };
    } else if (interviewResponses && interviewResponses.length > 0) {
      excavationData = {
        questionsAsked: [],
        responsesReceived: interviewResponses,
        voicePatternsIdentified: interviewResponses.flatMap(r => r.voiceMarkers),
        registerClarity: 8,
      };
    }

    // Step 3: Generate voice-first draft
    console.log('  Generating voice-first draft...');
    const { draft: voiceFirstDraft, tokens: draftTokens } = await this.generateVoiceFirstDraft(
      input,
      analysis,
      interviewResponses || [],
      wordLimit
    );
    console.log(`  Draft generated: ${voiceFirstDraft.wordCount} words, Spark Score: ${voiceFirstDraft.metrics.sparkScore}`);

    // Step 4: Prepare Stage 1 handoff
    const stage1Handoff = {
      draft: voiceFirstDraft.draft,
      register: voiceFirstDraft.register,
      voiceContext: {
        authenticPhrases: voiceFirstDraft.voiceSources
          .filter(v => v.preservedExactly)
          .map(v => v.phrase),
        voiceQuirks: voiceFirstDraft.registerMarkers.map(m => m.marker),
        registerMarkers: voiceFirstDraft.registerMarkers.map(m => m.marker),
        topicsWithEnergy: analysis.buriedSpark
          .filter(s => s.amplificationPotential === 'high')
          .map(s => s.quote),
        topicsToAvoid: analysis.universalIssues.essayModeIndicators
          .filter(i => i.severity === 'severe')
          .map(i => i.indicator),
      },
      preservationWarnings: [
        ...voiceFirstDraft.preservedImperfections.map(p => `Preserve: "${p.text}" - ${p.whyKept}`),
        ...voiceFirstDraft.riskyChoices.map(r => `Keep risk: "${r.choice}" - ${r.whyWorthIt}`),
      ],
    };

    // Calculate total cost
    const totalCost = calculateCost(
      analysisTokens.input + excavationTokens.input + draftTokens.input,
      analysisTokens.output + excavationTokens.output + draftTokens.output
    );

    return {
      analysis,
      excavation: excavationData,
      voiceFirstDraft,
      stage1Handoff,
      costTracking: {
        analysisTokens,
        excavationTokens: excavationTokens.input > 0 ? excavationTokens : undefined,
        draftGenerationTokens: draftTokens,
        totalCost,
      },
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { EmotionalRegister, SparkGapAnalysis, VoiceFirstDraft, Stage0Output };
