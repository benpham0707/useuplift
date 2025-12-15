/**
 * Stage 1A: Foundation Teaching Service
 *
 * **TEACHING ONLY - No Diagnosis**
 *
 * This service provides DEEP conceptual teaching without trying to also
 * diagnose the essay. By separating teaching from diagnosis, we ensure:
 *
 * 1. **FULL TEACHING DEPTH**: No token pressure from diagnosis crowding teaching
 * 2. **PIQ ARCHITECTURE**: Matches proven PIQ Workshop model (teaching → diagnosis)
 * 3. **CLEAN SEPARATION**: Each service does ONE thing extremely well
 * 4. **BETTER FOCUS**: Claude can go deep on concepts without distraction
 *
 * **What Stage 1A Accomplishes**:
 * - Student deeply understands what THIS college values
 * - Student internalizes rubric dimensions with concrete examples
 * - Student sees what the prompt is REALLY asking
 * - Student gets mental models for key concepts (IV, Authenticity, etc.)
 * - Student is fully educated BEFORE seeing their diagnosis
 *
 * **Cost**: ~$0.04 (4000 tokens for teaching only)
 *
 * **Output**: ConceptualFoundation (teaching concepts)
 * **Used By**: Stage 1B (diagnosis) references these concepts explicitly
 */

import Anthropic from '@anthropic-ai/sdk';
import { parseClaudeJSON } from '../utils/jsonParser';
import type { CollegeResearch } from '../types/collegeResearch';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-20250514';
const SONNET_PRICING = {
  input: 3.0 / 1_000_000,
  output: 15.0 / 1_000_000,
};

// ============================================================================
// TYPES - PIQ WORKSHOP QUALITY (WARM, CONVERSATIONAL COACHING)
// ============================================================================

/**
 * What's working in the essay (celebration before critique)
 */
export interface QualityAnchor {
  quote: string; // Exact quote from student's essay
  why_it_works: string; // Warm explanation with personality
  dimension_strength: string; // e.g., "Authenticity (9/10)"
}

/**
 * Student's unique voice fingerprint
 */
export interface VoiceFingerprint {
  writing_style: string; // Direct, conversational description
  superpower: string; // What makes their voice special
  authentic_phrases_to_protect: string[]; // Specific phrases to keep
}

/**
 * College alignment taught through their essay
 */
export interface CollegeAlignmentTeaching {
  value: string; // e.g., "Intellectual Vitality"
  how_your_essay_shows_it: string; // Specific to THEIR essay, warm tone
  where_to_push_deeper: string; // Guiding question, not prescription
}

/**
 * What's missing (told as story, not checklist)
 */
export interface NarrativeGaps {
  main_observation: string; // Warm, specific observation
  specific_scene_needed: string; // Concrete example of what's missing
}

/**
 * Prompt connection (conversational, not technical)
 */
export interface PromptConnection {
  prompt: string; // The actual prompt
  your_current_answer: string; // What student is currently saying
  why_it_works: string; // Celebration of authenticity
  how_to_sharpen: string; // Warm guidance to strengthen
}

/**
 * Complete conceptual foundation (PIQ Workshop style)
 */
export interface ConceptualFoundation {
  // WARM OPENING (shows we read and understood their essay)
  opening_reflection: string;

  // CELEBRATION (what's working)
  quality_anchors: QualityAnchor[];

  // UNIQUE VOICE IDENTIFICATION (their superpower)
  voice_fingerprint: VoiceFingerprint;

  // COLLEGE VALUES (taught through their essay, not abstract)
  college_alignment: CollegeAlignmentTeaching[];

  // WHAT'S MISSING (told as a story, not a checklist)
  narrative_gaps: NarrativeGaps;

  // PROMPT ALIGNMENT (conversational, not technical)
  prompt_connection: PromptConnection;
}

/**
 * Stage 1A output with metadata
 */
export interface Stage1AOutput {
  conceptual_foundation: ConceptualFoundation;
  cost: number;
  tokens_used: {
    input: number;
    output: number;
  };
}

// ============================================================================
// PIQ WORKSHOP QUALITY TEACHING PROMPT (WARM, CONVERSATIONAL, INSIGHTFUL)
// ============================================================================

const STAGE1A_TEACHING_PROMPT = `You are a warm, insightful college admissions coach. Your teaching style matches the PIQ Workshop standard: conversational, empathetic, and deeply understanding.

⚠️  CRITICAL VOICE REQUIREMENT:
- Use "you", "I", "we" naturally (conversational)
- Quote EXACT sentences from the student's essay to show you read it
- Celebrate what's working BEFORE teaching what's missing
- Sound like a real teacher having a conversation, not a rubric
- Use warmth: "Okay, so...", "Real talk:", "This? *Chef's kiss.*"
- Avoid technical jargon - speak like a human

═══════════════════════════════════════════════════════════
STUDENT'S ESSAY DRAFT
═══════════════════════════════════════════════════════════

{essayDraft}

═══════════════════════════════════════════════════════════
ESSAY PROMPT
═══════════════════════════════════════════════════════════

{essayPrompt}

═══════════════════════════════════════════════════════════
COLLEGE RESEARCH (what this college values)
═══════════════════════════════════════════════════════════

{collegeResearch}

═══════════════════════════════════════════════════════════
YOUR TEACHING MISSION (PIQ WORKSHOP QUALITY)
═══════════════════════════════════════════════════════════

## STEP 1: Read Their Essay & Show Understanding

Start by READING their essay carefully. Then craft a warm opening that:
- References something specific from THEIR essay (quote their best line!)
- Shows genuine understanding of what they're trying to do
- Celebrates their attempt with warmth and encouragement
- Makes them feel SEEN and understood

Example tone:
"Okay, so I just read through your essay about [their topic], and here's what jumped out at me—[quote their best sentence]. This is the kind of opening that makes admissions officers lean in. Keep this exactly as is."

## STEP 2: Identify Quality Anchors (What's Working)

Find 2-3 moments in their essay that are STRONG. For each:
- Quote the exact text (word-for-word from their essay!)
- Explain WHY it works (specific, warm, teaching them the concept through their own work)
- Connect to a dimension (Authenticity, IV, etc.) but conversationally
- Tell them to protect it ("Don't touch this.", "Keep exactly as is.")

Example:
"'Most Wednesdays smelled like bleach and citrus'—this drops us right into your world with zero fluff. Sensory, specific, immediately engaging. This is Authenticity in action (9/10). Don't touch this."

## STEP 3: Identify Their Unique Voice (Their Superpower)

Describe HOW they write:
- What's their natural style? (direct? poetic? analytical? conversational?)
- What makes their voice special? (specificity? metaphors? humor? precision?)
- Give examples of THEIR authentic phrases (exact quotes!)
- Celebrate what most students would say vs what THEY said

Example:
"You write exactly like you think—direct, no BS, with perfect specific details. Most students would write 'I improved the process' but you show us the math: 47→22 questions, 18→9 minutes. That specificity is your superpower. Protect it."

## STEP 4: Teach College Values Through THEIR Essay

For 2-3 relevant college values (from research):
- Name the value (e.g., "Intellectual Vitality")
- Explain what it means conversationally (not textbook definition!)
- Show how THEIR ESSAY demonstrates it (specific to their draft!)
- Suggest where they could push ONE layer deeper (as a question, not prescription)

Example:
"Stanford values Intellectual Vitality—which means showing you get lost in ideas for fun, not just for grades. When you write about losing track of time at 2 AM researching snow crystal formation—that's IV. Stanford wants students who 'lose track of time in the library,' and your essay shows that moment. Want to add ONE more moment where curiosity took over? Maybe the time you..."

## STEP 5: What's Missing (As a Story, Not a List)

Observe what's MISSING from their narrative (don't list 10 things!):
- One MAIN observation about what would make this land harder
- Frame it as a question or invitation, not a deficiency
- Give a CONCRETE example of the missing scene/detail/moment
- Make them curious to explore, not defensive

Example:
"Right now you're watching your grandfather carry buckets, but what were YOU doing? Were you following? Trying to help? Standing frozen? That's the missing piece. Show me the Tuesday night you were drowning in AP Bio, and instead of panicking, you thought of your grandfather and did... what exactly?"

## STEP 6: Connect to Prompt (Conversationally)

Help them see what the prompt is REALLY asking:
- What they're currently answering (acknowledge it!)
- Why that's a good start (celebrate authenticity)
- How to sharpen it (specific guidance as questions)
- What would make it LAND with admissions readers

Example:
"Right now you're TELLING me it matters. Show me the moment you realized it mattered. Was it at 2:47 AM when the LED blinked? THAT'S the moment that shows why it matters."

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════

{
  "opening_reflection": "Okay, so I just read your essay about [their topic], and here's what jumped out at me—[quote their best sentence]. This is exactly the kind of [quality] that makes readers lean in. [Warm observation about their attempt]",

  "quality_anchors": [
    {
      "quote": "[EXACT quote from their essay - word for word!]",
      "why_it_works": "[Warm, specific explanation of WHY this works. Teach the concept through their own writing. Use conversational tone: 'This drops us right into...', 'You're showing not telling...', etc.]",
      "dimension_strength": "Authenticity (9/10)" // or "Intellectual Vitality (8/10)", etc.
    }
  ],

  "voice_fingerprint": {
    "writing_style": "Direct, no BS, with perfect specific details and numbers",
    "superpower": "You write exactly like you think—most students would write 'I improved the process' but you show us the math: 47→22 questions. That specificity is rare and valuable.",
    "authentic_phrases_to_protect": ["exact quotes from essay", "that show their voice", "3-5 phrases"]
  },

  "college_alignment": [
    {
      "value": "Intellectual Vitality",
      "how_your_essay_shows_it": "When you write about losing track of time at 2 AM researching [topic]—that's IV. [College name] wants students who 'lose track of time in the library,' and your essay shows that exact moment in [specific scene from their essay].",
      "where_to_push_deeper": "Give us ONE more moment where curiosity took over. Maybe the time you... [specific suggestion based on their draft]"
    }
  ],

  "narrative_gaps": {
    "main_observation": "Right now you're watching [person/thing] but I want to see YOU in this story. What were you doing? What were you thinking? [Warm, specific observation about what's missing]",
    "specific_scene_needed": "Show me the [specific day/moment] when [concrete example based on their topic]. Give me the sensory details—the smell, the cold, the exact time. What were you DOING in that moment?"
  },

  "prompt_connection": {
    "prompt": "{essayPrompt}",
    "your_current_answer": "[What they're currently saying about the prompt]",
    "why_it_works": "This is authentic—you clearly care about this. [Celebrate what's real]",
    "how_to_sharpen": "Right now you're TELLING me it matters. Show me the exact moment you realized it mattered. Was it [specific moment from their draft]? THAT'S the moment that would make this land."
  }
}

**TONE CHECK**: Read your output. Does it sound like a warm teacher who just read their essay? Or does it sound like a rubric? If it's the latter, REWRITE with more warmth, personality, and specific references to THEIR words.`;

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class Stage1ATeachingService {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Generate deep conceptual foundation teaching
   *
   * This provides PURE TEACHING without diagnosis pressure.
   * Stage 1B will use these concepts for analysis.
   */
  async generateTeaching(
    essayDraft: string,
    essayPrompt: string,
    collegeResearch: CollegeResearch
  ): Promise<Stage1AOutput> {
    console.log('📚 Stage 1A: Generating PIQ-quality warm teaching...');

    // Build prompt with essay-specific context
    const prompt = STAGE1A_TEACHING_PROMPT
      .replace('{essayDraft}', essayDraft)
      .replace('{essayPrompt}', essayPrompt)
      .replace('{collegeResearch}', JSON.stringify(collegeResearch, null, 2));

    // Make API call (PIQ-quality warm coaching)
    const response = await this.client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 4000, // Warm conversational teaching
      temperature: 0.7, // More creative for warm, conversational tone
      messages: [{ role: 'user', content: prompt }],
      // Note: In production, college research would be cached here
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Sonnet');
    }

    // Parse response
    const conceptual_foundation = parseClaudeJSON<ConceptualFoundation>(
      content.text,
      'ConceptualFoundation'
    );

    // Calculate cost
    const cost =
      response.usage.input_tokens * SONNET_PRICING.input +
      response.usage.output_tokens * SONNET_PRICING.output;

    console.log(`✓ Stage 1A complete (PIQ-quality warm coaching)`);
    console.log(`  Quality anchors: ${conceptual_foundation.quality_anchors.length}`);
    console.log(`  College alignment: ${conceptual_foundation.college_alignment.length} values`);
    console.log(`  Voice identified: ${conceptual_foundation.voice_fingerprint.writing_style}`);
    console.log(`  Cost: $${cost.toFixed(3)}`);

    return {
      conceptual_foundation,
      cost,
      tokens_used: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  QualityAnchor,
  VoiceFingerprint,
  CollegeAlignmentTeaching,
  NarrativeGaps,
  PromptConnection,
  ConceptualFoundation,
  Stage1AOutput,
};
