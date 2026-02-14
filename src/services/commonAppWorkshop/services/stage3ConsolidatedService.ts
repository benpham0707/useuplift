// @ts-nocheck
/**
 * Stage 3 Consolidated Polish Service
 *
 * **Final Polish + Journey Celebration**
 *
 * This service handles the final stage: celebrating strengths, micro-refinements,
 * authenticity verification, and confidence building.
 *
 * **Architecture**:
 * 1. Haiku quality verification ($0.003)
 * 2. Sonnet consolidated polish (analysis + refinements + celebration) ($0.055)
 * Total: $0.06 per essay
 *
 * **Why Consolidation Works Here**:
 * - Celebration flows from analysis (see strengths → celebrate them)
 * - Micro-refinements informed by journey context
 * - Authenticity check directly references voice baseline
 * - Single coherent narrative for student's final review
 *
 * **Cost Comparison**:
 * - Separate calls: Analysis ($0.02) + Refinements ($0.02) + Celebration ($0.02) = $0.06
 * - Consolidated: Single call ($0.055) + Haiku ($0.003) = $0.058
 * - Savings: $0.002 with BETTER integration
 *
 * **What Stage 3 Accomplishes**:
 * - Student sees their journey (before → after scores)
 * - Student gets celebrated for authentic strengths
 * - Student receives 5-8 micro-refinements (optional polish)
 * - Student has confidence in their essay's quality
 * - Student knows their college value alignment
 * - Student has final submission checklist
 */

import Anthropic from '@anthropic-ai/sdk';
import { parseClaudeJSON } from '../utils/jsonParser';
import { HaikuDiagnosisService } from './haikuDiagnosisService';
import type { VoiceFingerprint } from '../types/stage0Types';
import type { Stage1CombinedOutput } from './handoffService';
import type { Stage2BatchOutput } from './stage2BatchService';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250514';
const SONNET_PRICING = {
  input: 3.0 / 1_000_000,
  output: 15.0 / 1_000_000,
};

// ============================================================================
// TYPES
// ============================================================================

/**
 * Dimension journey (before → after)
 */
export interface DimensionJourney {
  dimension: string;
  initial_score: number;
  stage1_score: number;
  stage2_score: number;
  final_score: number;
  improvement: number;
  key_wins: string[];
}

/**
 * Journey progress summary
 */
export interface JourneyProgress {
  overall_improvement: number; // Average across dimensions
  dimensions: DimensionJourney[];
  biggest_wins: string[];
  transformation_narrative: string; // Story of their journey
}

/**
 * Celebrated strength
 */
export interface CelebratedStrength {
  quote: string;
  location: string;
  what_makes_it_shine: string;
  dimension_strength: string; // Which dimension this exemplifies
  college_alignment: string; // How this aligns with college values
  preserve_this: string; // Why they should keep this
}

/**
 * Celebration of strengths
 */
export interface CelebrationOfStrengths {
  authentic_spark_moments: CelebratedStrength[];
  voice_victories: CelebratedStrength[];
  college_value_alignment: CelebratedStrength[];
  overall_confidence_message: string;
}

/**
 * Micro-refinement (optional polish)
 */
export interface MicroRefinement {
  refinement_number: number;
  location: string;
  current_text: string;
  suggested_text: string;
  rationale: string;
  refinement_type:
    | 'word_choice'
    | 'sentence_rhythm'
    | 'transition'
    | 'clarity'
    | 'concision'
    | 'voice_consistency';
  impact_level: 'subtle' | 'noticeable' | 'significant';
  optional: boolean; // All are optional in Stage 3
}

/**
 * Value alignment report
 */
export interface ValueAlignmentReport {
  college_name: string;
  alignment_score: number; // 1-10
  core_values_demonstrated: Array<{
    value_name: string;
    evidence_in_essay: string;
    alignment_strength: 'exceptional' | 'strong' | 'adequate';
  }>;
  authenticity_rating: number; // 1-10
  reader_impact_prediction: string;
}

/**
 * Authenticity verification
 */
export interface AuthenticityReport {
  voice_preservation_score: number; // 1-10
  authentic_phrases_kept: string[];
  voice_consistency: 'excellent' | 'good' | 'needs_attention';
  spark_maintained: boolean;
  emotional_truth_present: boolean;
  warnings: string[]; // Any authenticity concerns
}

/**
 * Reflection question (final Socratic teaching)
 */
export interface ReflectionQuestion {
  question: string;
  purpose: string; // Why this question matters
  guidance: string; // How to think about it
}

/**
 * Submission checklist item
 */
export interface SubmissionChecklistItem {
  item: string;
  completed: boolean;
  guidance: string;
}

/**
 * Confidence assessment
 */
export interface ConfidenceAssessment {
  overall_readiness: 'ready_to_submit' | 'nearly_ready' | 'needs_more_work';
  confidence_score: number; // 1-10
  strengths_summary: string;
  remaining_opportunities: string[];
  final_message: string;
}

/**
 * Complete Stage 3 output
 */
export interface Stage3ConsolidatedOutput {
  // Journey celebration
  journey_progress: JourneyProgress;
  celebration: CelebrationOfStrengths;

  // Optional polish
  micro_refinements: MicroRefinement[];

  // Final analysis
  value_alignment: ValueAlignmentReport;
  authenticity_report: AuthenticityReport;

  // Student guidance
  reflection_questions: ReflectionQuestion[];
  submission_checklist: SubmissionChecklistItem[];
  confidence_assessment: ConfidenceAssessment;

  // Final essay analysis
  final_dimensional_scores: Record<string, number>;
  ready_for_submission: boolean;

  // Cost tracking
  cost: number;
  tokens_used: {
    haiku: number;
    sonnet_input: number;
    sonnet_output: number;
  };
}

// ============================================================================
// CONSOLIDATED PROMPT
// ============================================================================

const STAGE3_CONSOLIDATED_PROMPT = `You are providing final polish and celebration for a college admissions essay.

This is a THREE-PART response:
- PART 1: Journey Celebration (analyze improvement)
- PART 2: Micro-Refinements (optional polish)
- PART 3: Final Assessment (confidence + checklist)

═══════════════════════════════════════════════════════════
CONTEXT FROM STAGES 0-2
═══════════════════════════════════════════════════════════

COLLEGE NAME:
{collegeName}

FINAL ESSAY DRAFT:
{finalDraft}

VOICE FINGERPRINT (from Stage 0):
{voiceFingerprint}

STAGE 1 DIMENSIONAL SCORES:
{stage1Scores}

STAGE 2 DIMENSIONAL SCORES (after fixes):
{stage2Scores}

CONCEPTS TAUGHT (Stages 1-2):
{conceptsTaught}

POLISH PRIORITIES (from Stage 2):
{polishPriorities}

QUALITY VERIFICATION (Haiku):
{qualityVerification}

═══════════════════════════════════════════════════════════
PART 1: JOURNEY CELEBRATION
═══════════════════════════════════════════════════════════

### 1. JOURNEY PROGRESS

For each dimension (IV, Authenticity, Narrative Quality, Impact):
- Initial score (Stage 0/1)
- Final score (after Stage 2 fixes)
- Improvement (+X points)
- Key wins (2-3 specific improvements)

Create a TRANSFORMATION NARRATIVE:
- Tell the story of their journey
- Highlight biggest breakthroughs
- Make them feel proud of their work

### 2. CELEBRATION OF STRENGTHS

Identify 6-9 moments to CELEBRATE:

A. AUTHENTIC SPARK MOMENTS (2-3)
   - Quote the exact text
   - What makes it shine
   - Why it's memorable
   - How it shows their personality

B. VOICE VICTORIES (2-3)
   - Quote authentic phrases
   - Why this is their unique voice
   - Dimension this strengthens
   - Preserve this at all costs

C. COLLEGE VALUE ALIGNMENT (2-3)
   - Quote text showing alignment
   - Which core value this demonstrates
   - Evidence from college research
   - Why admissions will notice this

For each celebration:
- Be specific (quote exact text)
- Be genuine (no generic praise)
- Connect to concepts they learned
- Make them confident in their work

═══════════════════════════════════════════════════════════
PART 2: MICRO-REFINEMENTS
═══════════════════════════════════════════════════════════

Identify 5-8 OPTIONAL micro-refinements:

These are NOT critical fixes. The essay is already strong.
These are subtle polish opportunities IF the student wants them.

For each refinement:

**Location**: Where in essay
**Current Text**: Exact quote
**Suggested Text**: Your refinement
**Rationale**: Why this is slightly better
**Refinement Type**: word_choice | sentence_rhythm | transition | clarity | concision | voice_consistency
**Impact Level**: subtle | noticeable | significant
**Optional**: true (all are optional)

Examples:
- Word choice: "really interested" → "captivated"
- Sentence rhythm: Breaking up long sentence for variety
- Transition: Adding bridge between paragraphs
- Clarity: Removing ambiguous pronoun
- Concision: "in order to" → "to"
- Voice consistency: Adjusting one phrase to match register

RULES:
- Must preserve voice (check against fingerprint)
- Must be subtle (no rewrites)
- Must be truly optional (essay works without them)
- Must not introduce banned terms (tapestry, realm, etc.)
- Must maintain authenticity

═══════════════════════════════════════════════════════════
PART 3: FINAL ASSESSMENT
═══════════════════════════════════════════════════════════

### 1. VALUE ALIGNMENT REPORT

College: {collegeName}
Alignment Score: X/10

For each core value demonstrated:
- Value name
- Evidence in essay (quote)
- Alignment strength (exceptional/strong/adequate)

Authenticity Rating: X/10
Reader Impact Prediction: What will admissions officers remember?

### 2. AUTHENTICITY REPORT

Voice Preservation Score: X/10
- How well did we preserve their authentic voice?

Authentic Phrases Kept: [List 5-8 phrases that are uniquely theirs]

Voice Consistency: excellent | good | needs_attention
Spark Maintained: true/false
Emotional Truth Present: true/false

Warnings: [Any authenticity concerns? Empty if none]

### 3. REFLECTION QUESTIONS

Provide 3-5 final Socratic questions:
- Help them reflect on their journey
- Deepen their understanding of concepts
- Prepare them for interviews (same topics)
- Build metacognitive awareness

For each:
- Question
- Purpose (why this matters)
- Guidance (how to think about it)

### 4. SUBMISSION CHECKLIST

Provide 8-10 checklist items:
- Word count (X/650 words)
- All suggestions reviewed
- Voice feels authentic
- No banned clichés
- Spell check completed
- Read aloud test
- Peer feedback gathered
- Final review with fresh eyes
- [Custom items based on essay]

For each:
- Item
- Completed: false (student will check)
- Guidance: How to verify

### 5. CONFIDENCE ASSESSMENT

Overall Readiness: ready_to_submit | nearly_ready | needs_more_work

Confidence Score: X/10

Strengths Summary: (3-4 sentences about what makes this essay strong)

Remaining Opportunities: [Any optional improvements? Empty if ready]

Final Message: (Personalized encouragement based on their journey)

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════

{
  "journey_progress": {
    "overall_improvement": X,
    "dimensions": [
      {
        "dimension": "Intellectual Vitality",
        "initial_score": 4,
        "stage1_score": 4,
        "stage2_score": 7,
        "final_score": 7,
        "improvement": 3,
        "key_wins": ["...", "..."]
      }
    ],
    "biggest_wins": ["...", "...", "..."],
    "transformation_narrative": "..."
  },
  "celebration": {
    "authentic_spark_moments": [
      {
        "quote": "...",
        "location": "...",
        "what_makes_it_shine": "...",
        "dimension_strength": "...",
        "college_alignment": "...",
        "preserve_this": "..."
      }
    ],
    "voice_victories": [...],
    "college_value_alignment": [...],
    "overall_confidence_message": "..."
  },
  "micro_refinements": [
    {
      "refinement_number": 1,
      "location": "...",
      "current_text": "...",
      "suggested_text": "...",
      "rationale": "...",
      "refinement_type": "word_choice",
      "impact_level": "subtle",
      "optional": true
    }
  ],
  "value_alignment": {
    "college_name": "{collegeName}",
    "alignment_score": X,
    "core_values_demonstrated": [...],
    "authenticity_rating": X,
    "reader_impact_prediction": "..."
  },
  "authenticity_report": {
    "voice_preservation_score": X,
    "authentic_phrases_kept": [...],
    "voice_consistency": "excellent",
    "spark_maintained": true,
    "emotional_truth_present": true,
    "warnings": []
  },
  "reflection_questions": [
    {
      "question": "...",
      "purpose": "...",
      "guidance": "..."
    }
  ],
  "submission_checklist": [
    {
      "item": "Word count (X/650)",
      "completed": false,
      "guidance": "..."
    }
  ],
  "confidence_assessment": {
    "overall_readiness": "ready_to_submit",
    "confidence_score": X,
    "strengths_summary": "...",
    "remaining_opportunities": [],
    "final_message": "..."
  },
  "final_dimensional_scores": {
    "intellectual_vitality": X,
    "authenticity": X,
    "narrative_quality": X,
    "impact": X
  },
  "ready_for_submission": true
}`;

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class Stage3ConsolidatedService {
  private client: Anthropic;
  private haikuService: HaikuDiagnosisService;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
    this.haikuService = new HaikuDiagnosisService(apiKey);
  }

  /**
   * Generate complete Stage 3 polish (consolidated)
   *
   * This runs in 2 steps:
   * 1. Haiku quality verification ($0.003)
   * 2. Sonnet consolidated polish ($0.055)
   * Total: ~$0.06
   */
  async generateStage3Polish(
    finalDraft: string,
    collegeName: string,
    stage1Output: Stage1CombinedOutput,
    stage2Output: Stage2BatchOutput
  ): Promise<Stage3ConsolidatedOutput> {
    console.log('✨ Stage 3: Running final polish and celebration...');

    const { stage2_handoff } = stage1Output;
    const { stage3_handoff } = stage2Output;

    // Step 1: Haiku quality verification
    console.log('  1/2: Running Haiku quality verification...');
    const { verification: qualityVerification } =
      await this.haikuService.verifyQuality(
        finalDraft,
        stage3_handoff.voice_fingerprint,
        ['authentic_phrases', 'sentence_rhythms', 'voice_qualities']
      );

    // Step 2: Sonnet consolidated polish
    console.log('  2/2: Running Sonnet consolidated polish...');

    const prompt = STAGE3_CONSOLIDATED_PROMPT.replace('{collegeName}', collegeName)
      .replace('{finalDraft}', finalDraft)
      .replace(
        '{voiceFingerprint}',
        JSON.stringify(stage3_handoff.voice_fingerprint, null, 2)
      )
      .replace(
        '{stage1Scores}',
        JSON.stringify(stage2_handoff.dimensional_baseline, null, 2)
      )
      .replace(
        '{stage2Scores}',
        JSON.stringify(stage3_handoff.dimensional_scores, null, 2)
      )
      .replace(
        '{conceptsTaught}',
        JSON.stringify(stage3_handoff.concepts_reinforced, null, 2)
      )
      .replace(
        '{polishPriorities}',
        JSON.stringify(stage3_handoff.final_polish_priorities, null, 2)
      )
      .replace('{qualityVerification}', JSON.stringify(qualityVerification, null, 2));

    const response = await this.client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 4000,
      temperature: 0.4, // Balanced for celebration + analysis
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Sonnet');
    }

    const parsed = parseClaudeJSON(content.text, 'Stage3ConsolidatedOutput');

    // Calculate cost
    const cost =
      response.usage.input_tokens * SONNET_PRICING.input +
      response.usage.output_tokens * SONNET_PRICING.output;

    console.log(`✓ Stage 3 complete`);
    console.log(`  Journey improvement: +${parsed.journey_progress.overall_improvement} average`);
    console.log(`  Micro-refinements identified: ${parsed.micro_refinements.length}`);
    console.log(`  Readiness: ${parsed.confidence_assessment.overall_readiness}`);
    console.log(`  Cost: $${cost.toFixed(3)}`);

    return {
      journey_progress: parsed.journey_progress,
      celebration: parsed.celebration,
      micro_refinements: parsed.micro_refinements,
      value_alignment: parsed.value_alignment,
      authenticity_report: parsed.authenticity_report,
      reflection_questions: parsed.reflection_questions,
      submission_checklist: parsed.submission_checklist,
      confidence_assessment: parsed.confidence_assessment,
      final_dimensional_scores: parsed.final_dimensional_scores,
      ready_for_submission: parsed.ready_for_submission,
      cost,
      tokens_used: {
        haiku: 0, // Haiku doesn't expose token counts easily
        sonnet_input: response.usage.input_tokens,
        sonnet_output: response.usage.output_tokens,
      },
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  DimensionJourney,
  JourneyProgress,
  CelebratedStrength,
  CelebrationOfStrengths,
  MicroRefinement,
  ValueAlignmentReport,
  AuthenticityReport,
  ReflectionQuestion,
  SubmissionChecklistItem,
  ConfidenceAssessment,
  Stage3ConsolidatedOutput,
};
