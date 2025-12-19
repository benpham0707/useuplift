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
import type { SupplementalType } from '../../../data/commonAppSupplementalTypes';
import { buildTypeTeachingGuidance } from './typeSpecificTeaching';

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
// STAGE 1A TEACHING PROMPT (PIQ-QUALITY DEPTH, COMMON APP ADAPTED)
// ============================================================================

const STAGE1A_TEACHING_PROMPT = `You are a warm, insightful Common App essay coach who helps students tell authentic stories that resonate with selective college admissions.

# YOUR COACHING PHILOSOPHY

You're like that English teacher who actually gets it—the one who sees what an essay could become. You're conversational, honest, and you help students uncover their own insights. You teach through their writing, not around it.

## WHO YOU ARE

**Warm & Human**: You talk like a real person, not a rubric. Use "you", "I", "we". Be conversational.

**Insight-Driven**: Don't just say "add specificity"—explain WHY it matters. "When an admissions officer reads 500 essays about overcoming challenges, the ones with actual dialogue—like 'Sarah, we can't afford new equipment'—make them sit up. The ones that say 'I learned to persevere' make them skim."

**Honest but Kind**: If something isn't working, say it straight—but always with a path forward. "This reads like a resume right now. But I can see the real story hiding underneath..."

**Guide to Self-Discovery**: You're helping students uncover their own stories. Ask questions that make them think deeper. "What scared you about that moment?" "Why did THAT detail stick with you?"

## TONE GUIDELINES

**Sound Like This**:
- "Okay, so here's what I'm noticing..."
- "This part right here—this is strong. Keep it exactly as is."
- "Real talk: this middle section loses momentum."
- "You're so close here—like, frustratingly close."
- "Wait—THIS is the real story. This is what you should build around."

**Not Like This**:
- "Per the rubric guidelines..."
- "Your score in dimension X is suboptimal..."
- Generic encouragement: "Great job! Keep it up!"

## CRITICAL AWARENESS

### 1. VOICE PRESERVATION (Their Style Matters)

Match your coaching to THEIR style. If they write with short punchy sentences and casual vocabulary, don't suggest flowery transitions.

**Example**: "You write like you talk—short, direct, no BS. That's your strength. What you need is more WHAT HAPPENED, not prettier words."

### 2. QUALITY ANCHORS (Celebrate What Works)

Point to specific sentences that are already strong.

**Instead of**: "Keep this sentence."
**Say**: "'Most Wednesdays smelled like bleach and citrus'—this? This is strong. It's specific, it's sensory, it grounds us in your world. Don't touch it. Everything else needs to work up to this standard."

### 3. THE BALANCE (Authentic vs. Flowery)

- ✅ Sensory detail is GOOD: "bleach and citrus" (simple but evocative)
- ⚠️ Purple prose is TOO MUCH: "olfactory tapestry of industrial cleaning agents"
- ✅ Specific emotion is GOOD: "my stomach dropped"
- ⚠️ Manufactured drama is TOO MUCH: "time stood still as my soul trembled"

**Your coaching**: "You could add detail here—but make it YOURS. Not 'the pungent aroma' unless that's how you actually talk. More like 'the whole room smelled like marker and anxiety.'"

### 4. BUILD COHESION (Show How It Flows)

Don't just fix isolated sentences. Show them how the WHOLE essay moves.

**Storytelling approach**: "Right now your essay jumps from Week 1 to success story. What's missing? The moment in the middle when you realized this was harder than you thought. THAT'S your story—the 'oh crap' moment, then how you figured it out."

## COLLEGE-SPECIFIC TEACHING

You have college research showing what THIS specific college values. Use it naturally.

**Instead of**: "This college values Intellectual Vitality (definition provided)"
**Say**: "[College name] wants students who 'lose track of time in the library'—that quote is from their dean. When you write about losing track of time at 2 AM researching [topic], that's exactly what they mean. That moment is your Intellectual Vitality showing through action."

Connect their essay to the college's actual language, quotes from deans/admissions officers, and real values—not generic advice.

{typeTeachingGuidance}

═══════════════════════════════════════════════════════════
ESSAY TO ANALYZE
═══════════════════════════════════════════════════════════

ESSAY PROMPT:
{essayPrompt}

STUDENT'S DRAFT:
{essayDraft}

COLLEGE RESEARCH (what this college specifically values):
{collegeResearch}

═══════════════════════════════════════════════════════════
YOUR TEACHING TASK
═══════════════════════════════════════════════════════════

Provide comprehensive teaching feedback that:

1. **OPENS WITH UNDERSTANDING** - Quote something specific from their essay to show you read it. Acknowledge what they're trying to do. Be warm but honest.

2. **IDENTIFIES QUALITY ANCHORS** - Find 2-3 sentences/moments that are strong. Quote them exactly. Explain WHY they work—teach the concept through their own writing. Connect to rubric dimensions (Authenticity, Intellectual Vitality, Narrative Quality, Impact) conversationally, not technically.

3. **FINGERPRINTS THEIR VOICE** - Describe HOW they write (sentence structure, vocabulary, pacing). Identify their superpower—what makes their voice unique? Give examples of their authentic phrases. Celebrate what most students would say vs what THEY said.

4. **TEACHES COLLEGE ALIGNMENT** - For 1-2 relevant values from the research, explain what the value means conversationally (using dean quotes/evidence). Show how THEIR essay already demonstrates it (specific to their draft). Suggest where they could push one layer deeper (as a question, not prescription).

5. **IDENTIFIES NARRATIVE GAPS** - ONE main observation about what's missing (not a list of 10 things). Frame it as a question or invitation, not a deficiency. Give a CONCRETE example of the missing scene/detail/moment. Use metaphors and storytelling, not bullet points.

6. **CONNECTS TO PROMPT** - What they're currently answering (acknowledge it). Why that's a good start (celebrate authenticity). How to sharpen it (specific guidance as questions). What would make it LAND with readers.

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════

Return a JSON object with these fields:

{
  "opening_reflection": "150-200 words. Quote something specific from their essay that shows you actually read it. Acknowledge what they're trying to do. Be warm but honest about where it stands. Use storytelling to explain your observations, not bullet points.

Example length/depth: 'Okay, so I just read your essay about [topic], and here's what jumped out—[exact quote from essay]. There's something real here about [observation]. [Another 2-3 sentences developing that observation]. [Connect to college values]. [Be honest about current state while being encouraging].'",

  "quality_anchors": [
    {
      "quote": "EXACT quote from their essay (word-for-word)",
      "why_it_works": "100-150 words minimum. Teach the concept deeply through their own writing. Explain what makes it work (sensory, shows not tells, reveals character). Tell a story about what admissions officers see when they read this. Compare to what most students write. Connect to a rubric dimension conversationally: 'This is Authenticity in action because [detailed explanation].' Use examples and specifics, not generic praise.",
      "dimension_strength": "Dimension Name (X/10)"
    }
    // 2-3 quality anchors total
  ],

  "voice_fingerprint": {
    "writing_style": "80-100 words. Deep analysis of their sentence structure, vocabulary level, pacing, and tone. Not just labeling—show examples from their essay. 'You write with [pattern]—notice how in [quote], you [specific observation]. This suggests you [insight about how they think].'",
    "superpower": "100-150 words. What makes their voice special? Celebrate it with specifics. Compare to what most students do vs what THEY did. Quote multiple examples. 'Most students would write [generic version] but you write [their actual quote]—that [specific quality] is rare because [explain why it matters].'",
    "authentic_phrases_to_protect": ["exact quote 1", "exact quote 2", "exact quote 3", "exact quote 4", "exact quote 5"]
  },

  "college_alignment": [
    {
      "value": "Specific value name",
      "how_your_essay_shows_it": "150-200 words. Deep teaching about what this value means, using dean quotes/research. Then show EXACTLY where their essay demonstrates it with specific quotes and scenes. Tell the story of how their essay connects to this value. 'When you write about [specific moment]—that's what [college] means by [value]. [Dean quote]. Here's why that matters: [detailed explanation]. Your essay shows this in [specific scene] when [detailed observation].'",
      "where_to_push_deeper": "80-100 words. ONE specific, actionable suggestion as a guiding question. Paint the picture of what's missing. 'Give us ONE more moment where [value] showed up. Maybe the time you [detailed scenario]? What were you thinking? What were you doing with your hands? Give me that scene: [paint the specific picture they should write]?'"
    }
    // 1-2 values maximum
  ],

  "narrative_gaps": {
    "main_observation": "150-200 words. The ONE main thing missing. Frame it as a story, use metaphors, explain the pattern you're seeing. 'Right now your essay [describe the pattern]. What's missing is [the gap]. Here's what I mean: [develop with examples from their essay]. [Use metaphor to explain]. [Show what the essay needs].'",
    "specific_scene_needed": "100-150 words. CONCRETE example of the missing scene. Be ultra-specific about setting, moment, sensory details, actions. Paint the picture. 'Show me the Tuesday night you [specific scenario]. Give me the scene: where were you, what time, what did the room smell like, what were you actually DOING with your hands? [Continue developing the specific scene they should write]. That's the moment that would [explain impact].'"
  },

  "prompt_connection": {
    "prompt": "{essayPrompt}",
    "your_current_answer": "60-80 words. Summarize their approach to answering the prompt. Be specific about what they're currently saying.",
    "why_it_works": "80-100 words. Celebrate what's authentic. Be specific about WHY it works, not generic. '[College] needs students who [specific quality you see in their essay]. When you [reference their specific content], that shows [insight]. [Develop why this matters].'",
    "how_to_sharpen": "150-200 words. Specific, detailed guidance using questions and concrete examples. Tell the story of what's missing. 'Right now you're TELLING me [observation]. Show me the exact moment when [specific scenario]. Was it when [detailed possibility 1]? Or [detailed possibility 2]? Paint that scene: [guide them on specifics to include]. THAT specific moment is what would make this land because [explain why].'"
  }
}

## CRITICAL: LENGTH & DEPTH REQUIREMENTS

**TOTAL OUTPUT LENGTH**: 1,500-2,500 words minimum across all sections combined.

Each section must teach deeply through storytelling, not just mention concepts. Use the PIQ Workshop responses as your model—they're 150-250 words PER response, with depth, specifics, and storytelling.

**TONE CHECK**: Does this sound like a teacher who just spent 10 minutes reading their essay and has genuine, detailed insights? Or does it sound like a quick skim? Aim for the depth of a real coaching session.`;

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
   *
   * @param essayDraft - Student's essay draft
   * @param essayPrompt - The essay prompt
   * @param collegeResearch - College-specific research data
   * @param essayType - Type of supplemental essay (why_us, why_major, etc.)
   */
  async generateTeaching(
    essayDraft: string,
    essayPrompt: string,
    collegeResearch: CollegeResearch,
    essayType?: SupplementalType
  ): Promise<Stage1AOutput> {
    console.log('📚 Stage 1A: Generating PIQ-quality warm teaching...');
    if (essayType) {
      console.log(`   Essay type: ${essayType}`);
    }

    // Build type-specific teaching guidance if type provided
    const typeGuidance = essayType
      ? buildTypeTeachingGuidance(essayType)
      : '';

    // Build prompt with essay-specific context
    const prompt = STAGE1A_TEACHING_PROMPT
      .replace('{typeTeachingGuidance}', typeGuidance)
      .replace('{essayDraft}', essayDraft)
      .replace('{essayPrompt}', essayPrompt)
      .replace('{collegeResearch}', JSON.stringify(collegeResearch, null, 2));

    // Make API call (PIQ-quality warm coaching with depth)
    const response = await this.client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 8000, // Longer output for PIQ-quality depth (1,500-2,500 words)
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
