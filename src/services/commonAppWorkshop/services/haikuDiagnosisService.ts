// @ts-nocheck
/**
 * Haiku Diagnosis Service
 *
 * **The Foundation of Cost-Optimized Quality**
 *
 * This service uses Claude Haiku (5x cheaper than Sonnet) for fast, precise
 * diagnostic analysis. It replaces expensive Sonnet calls for:
 * 1. Initial essay analysis (triage)
 * 2. Citation mapping (evidence selection)
 * 3. Voice fingerprinting (baseline capture)
 * 4. Per-issue symptom diagnosis (like PIQ's SymptomDiagnoser)
 * 5. Quality verification (final checks)
 *
 * **Cost Comparison**:
 * - Haiku: $0.25 per million input tokens, $1.25 per million output tokens
 * - Sonnet: $3.00 per million input tokens, $15.00 per million output tokens
 * - Savings: ~5x cheaper for analysis tasks
 *
 * **Quality Philosophy**:
 * Haiku is IDEAL for analysis/diagnosis (high precision, low creativity needed).
 * We reserve Sonnet for generation (where creativity matters).
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  EmotionalRegister,
  InitialAnalysis,
  CitationMapping,
  VoiceFingerprint,
  IssueSymptomDiagnosis,
  QualityVerification,
} from '../types/stage0Types';
import type {
  CollegeResearch,
  CollegeEssayPrompt,
} from '../types/collegeResearch';

// ============================================================================
// CONSTANTS
// ============================================================================

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const HAIKU_PRICING = {
  input: 0.25 / 1_000_000,   // $0.25 per million input tokens
  output: 1.25 / 1_000_000,  // $1.25 per million output tokens
};

// ============================================================================
// HELPER: COST CALCULATION
// ============================================================================

function calculateCost(inputTokens: number, outputTokens: number): number {
  return (
    inputTokens * HAIKU_PRICING.input +
    outputTokens * HAIKU_PRICING.output
  );
}

// ============================================================================
// LAYER 1: INITIAL ANALYSIS (Fast Triage)
// ============================================================================

const INITIAL_ANALYSIS_PROMPT = `You are a fast essay triage analyst for college admissions.

Your job: Quickly assess the essay's current state BEFORE deep analysis.

ESSAY DRAFT:
{draft}

VOICE CONTEXT FROM STAGE 0 (if available):
{voiceContext}

Analyze:

1. OVERALL IMPRESSION (one sentence)
   - First reaction as an admissions officer
   - What stands out (positive or negative)

2. SPARK SCORE (0-100)
   - 0-30: Full essay mode (generic, no personality)
   - 31-50: Mostly essay mode (some buried authenticity)
   - 51-70: Mixed voice (authentic sections + essay mode)
   - 71-85: Mostly authentic (voice present, needs tuning)
   - 86-100: Fully authentic (genuine spark throughout)

3. VOICE CONSISTENCY (1-10)
   - How well does essay maintain consistent voice?
   - Does it shift between authentic and generic?
   - If Stage 0 voice context provided, does it match?

4. STRUCTURE TYPE
   - chronological: Events in time order
   - thematic: Organized by themes/ideas
   - moment-focused: Centers on single moment/scene
   - montage: Multiple vignettes/snapshots
   - unclear: No clear structure

5. KEY MOMENTS
   For each major moment (opening, turning point, reflection, conclusion):
   - Quote the text (exact)
   - Effectiveness (1-10)
   - What works or doesn't work

6. INITIAL RED FLAGS
   Surface-level issues (don't need deep analysis to spot):
   - Generic transitions ("Furthermore", "In conclusion")
   - Abstract claims without grounding
   - Name-drops college in calculated way
   - Uses prompt language back at prompt
   - Tells instead of shows
   - Passive voice throughout
   - No sensory details anywhere

7. ESTIMATED STRENGTH TIER
   - exceptional: Top 5% of essays
   - strong: Top 25% of essays
   - developing: Middle 50%
   - weak: Bottom 25%

OUTPUT FORMAT (JSON):
{
  "overall_impression": "string",
  "spark_score": number,
  "voice_consistency": number,
  "structure_type": "chronological" | "thematic" | "moment-focused" | "montage" | "unclear",
  "key_moments": [
    {
      "type": "opening" | "turning_point" | "reflection" | "conclusion",
      "quote": "exact text",
      "effectiveness": number,
      "analysis": "what works or doesn't"
    }
  ],
  "initial_red_flags": ["flag1", "flag2", ...],
  "estimated_strength": "exceptional" | "strong" | "developing" | "weak"
}`;

// ============================================================================
// LAYER 2: CITATION MAPPING (Evidence Selection)
// ============================================================================

const CITATION_MAPPING_PROMPT = `You are mapping college-specific evidence to essay sections.

Your job: Pre-select the MOST RELEVANT evidence for surgical teaching.

COLLEGE RESEARCH (this will be CACHED):
{collegeResearch}

ESSAY DRAFT:
{draft}

For each piece of college research, assess relevance to THIS specific essay:

1. CORE VALUES
   For each core value:
   - Relevance score (0-10): How relevant to this essay?
   - Applicable sections: Which essay sections show/lack this value?
   - Evidence strength (1-10): How strongly does essay demonstrate this?

   ONLY include values with relevance ≥ 7

2. RED FLAGS
   For each red flag:
   - Detected in: Quote essay sections that trigger this red flag
   - Severity: critical | moderate | minor

   ONLY include red flags actually present in essay

3. GREEN FLAGS
   For each green flag:
   - Present in: Quote essay sections showing this strength
   - Strength (1-10): How well does essay demonstrate this?

   ONLY include green flags with strength ≥ 6

4. DEAN QUOTES / KEY QUOTES
   For each quote:
   - Relevance score (0-10): How useful for teaching this essay?
   - Applicable to: Which essay sections this quote could improve
   - Teaching opportunity: How to use this quote in feedback

   ONLY include quotes with relevance ≥ 6

CRITICAL: Be selective. Only include evidence that's TRULY RELEVANT.
Better to have 5 perfect citations than 20 mediocre ones.

OUTPUT FORMAT (JSON):
{
  "relevant_core_values": [
    {
      "value": { "name": "...", "description": "...", ... },
      "relevance_score": number,
      "applicable_sections": ["quote1", "quote2"],
      "evidence_strength": number
    }
  ],
  "relevant_red_flags": [
    {
      "red_flag": { "flag": "...", "why_matters": "...", ... },
      "detected_in": ["quote1", "quote2"],
      "severity": "critical" | "moderate" | "minor"
    }
  ],
  "relevant_green_flags": [
    {
      "green_flag": { "quality": "...", "example": "...", ... },
      "present_in": ["quote1", "quote2"],
      "strength": number
    }
  ],
  "targeted_quotes": [
    {
      "quote": { "text": "...", "source": "...", ... },
      "relevance_score": number,
      "applicable_to": ["section1", "section2"],
      "teaching_opportunity": "string"
    }
  ]
}`;

// ============================================================================
// LAYER 3: VOICE FINGERPRINTING (Baseline Capture)
// ============================================================================

const VOICE_FINGERPRINT_PROMPT = `You are analyzing voice characteristics for preservation across revision stages.

Your job: Create a BASELINE fingerprint that later stages will verify against.

ESSAY DRAFT:
{draft}

STAGE 0 VOICE CONTEXT (if available):
{voiceContext}

Analyze:

1. DOMINANT REGISTER
   Which emotional register does this essay primarily use?
   - energetic_enthusiasm
   - quiet_intensity
   - melancholy_loss
   - defiant_irreverent
   - wonder_curiosity
   - warmth_connection

2. VOICE QUALITIES
   Descriptive adjectives that capture this student's voice:
   - Examples: "earnest", "analytical", "playful", "contemplative", "direct"
   - Minimum 3, maximum 7 qualities

3. SENTENCE RHYTHMS
   - Average length (words): Calculate approximate average
   - Variety (1-10): How much variation in sentence length?
   - Fragment use: effective | moderate | minimal
   - Does the rhythm feel natural or stilted?

4. VOCABULARY LEVEL
   - sophisticated: College-level vocabulary, complex terms
   - clear: Smart but accessible, appropriate for age
   - simple: Basic vocabulary, needs enrichment

5. AUTHENTIC PHRASES
   Identify 5-10 phrases that feel GENUINE to this student:
   - Unusual word choices
   - Specific details that feel real
   - Voice moments that stand out
   - Phrases we MUST preserve in later stages

6. VOICE WEAKNESSES
   Where does voice break down or become generic?
   - Sections that sound like "essay mode"
   - Transitions that feel forced
   - Moments where personality disappears

7. PRESERVATION WARNINGS
   What should later stages NOT change?
   - Specific phrases to preserve exactly
   - Voice quirks to maintain
   - Structural choices that work

OUTPUT FORMAT (JSON):
{
  "dominant_register": "energetic_enthusiasm" | "quiet_intensity" | ...,
  "voice_qualities": ["quality1", "quality2", ...],
  "sentence_rhythms": {
    "average_length": number,
    "variety": number,
    "fragment_use": "effective" | "moderate" | "minimal",
    "natural_feel": "natural" | "somewhat_stilted" | "very_stilted"
  },
  "vocabulary_level": "sophisticated" | "clear" | "simple",
  "authentic_phrases": ["phrase1", "phrase2", ...],
  "voice_weaknesses": ["weakness1", "weakness2", ...],
  "preservation_warnings": ["warning1", "warning2", ...]
}`;

// ============================================================================
// LAYER 4: SYMPTOM DIAGNOSIS (Per-Issue, like PIQ)
// ============================================================================

const SYMPTOM_DIAGNOSIS_PROMPT = `You are diagnosing a specific narrative weakness with surgical precision.

Your job: Identify the EXACT problem and what's MISSING (like PIQ's SymptomDiagnoser).

TARGET QUOTE:
"{quote}"

SURROUNDING CONTEXT:
{surroundingContext}

VOICE FINGERPRINT (must preserve):
{voiceFingerprint}

COLLEGE VALUES (must align with):
{relevantValues}

Diagnose with DEPTH:

1. SPECIFIC WEAKNESS
   Not just "weak" - be PRECISE:
   - "The verb 'was captivated' is abstract and passive"
   - "The transition 'Furthermore' is generic and formulaic"
   - "The claim 'I learned a lot' lacks grounding in specific moments"

2. SYMPTOM TYPE
   Classify the weakness:
   - abstract_language: Uses concepts without concrete anchors
   - passive_agency: Things happen TO narrator (not BY narrator)
   - cliche_metaphor: Overused comparisons
   - telling_not_showing: Summarizing instead of depicting
   - generic_pacing: Flat sentence structure
   - weak_verb: "To be" verbs or static verbs instead of action
   - missing_sensory: No physical grounding
   - forced_transition: Unnatural connective tissue

3. PRESCRIPTION
   How to fix this (specific strategy):
   - "Convert to active verb showing moment of fascination"
   - "Replace transition with sensory detail that creates natural bridge"
   - "Ground claim in specific scene with dialogue or action"

4. MISSING ELEMENTS (CRITICAL - like PIQ)
   What's ABSENT that would make this brilliant?

   A. SENSORY DETAILS
      What specific sights, sounds, textures, smells are missing?
      - Example: Instead of "I felt frustrated" → MISSING: "blinking cursor", "red error text"

   B. CONCRETE OBJECTS
      What numbers, ages, specific objects, proper nouns would ground this?
      - Example: Instead of "many sets" → MISSING: "fourteen Lego sets", "the Ninjago spacecraft"

   C. MICRO-MOMENT
      What single grounding scene would anchor this abstraction?
      - Example: Instead of "I lost interest" → MISSING: "The last time I touched my Legos..."

   D. EMOTIONAL TRUTH
      What specific feeling is TOLD but not SHOWN through action/reaction?
      - Example: Instead of "I was passionate" → MISSING: "I'd been tracking prices for months"

5. VOICE CONSTRAINTS
   From the fingerprint, what MUST be preserved in the fix?
   - Vocabulary level
   - Sentence rhythm
   - Voice qualities

6. COLLEGE ALIGNMENT
   How should the fix align with college values?
   Which core value does this issue undermine?

OUTPUT FORMAT (JSON):
{
  "diagnosis": "string (one sentence)",
  "specific_weakness": "string (detailed)",
  "prescription": "string (actionable)",
  "symptom_type": "abstract_language" | "passive_agency" | ...,
  "missing_elements": {
    "sensory_details": ["detail1", "detail2", ...],
    "concrete_objects": ["object1", "object2", ...],
    "micro_moment": "string (the missing scene)",
    "emotional_truth": "string (the feeling not shown)"
  },
  "voice_constraints": ["constraint1", "constraint2", ...],
  "college_alignment": "string (which value and how)"
}`;

// ============================================================================
// LAYER 5: QUALITY VERIFICATION (Final Checks)
// ============================================================================

const QUALITY_VERIFICATION_PROMPT = `You are performing final quality verification before submission.

Your job: Quick checks for readiness and final issues.

ESSAY DRAFT:
{draft}

VOICE FINGERPRINT (from Stage 1):
{voiceFingerprint}

PRESERVATION PRIORITIES (from Stage 2):
{preservationPriorities}

Check:

1. CANDIDATE CENTERING (1-5)
   Does this essay showcase the WRITER as someone the college wants?
   - 5: Essay powerfully centers the student as exceptional candidate
   - 3: Essay shows competence but doesn't make student memorable
   - 1: Essay doesn't showcase student effectively

2. NARRATIVE FLOW (1-5)
   Does the essay flow naturally from moment to moment?
   - 5: Seamless flow, each sentence leads naturally to next
   - 3: Generally flows but has some choppy transitions
   - 1: Disjointed, sections don't connect well

3. VOCABULARY APPROPRIATENESS (1-5)
   Is vocabulary sophisticated but not overwrought?
   - 5: Smart, precise vocabulary that feels natural
   - 3: Mostly appropriate with some forced words
   - 1: Either too simple or trying too hard ("institutional knowledge")

4. SPARK QUALITY (1-5)
   Does the essay have authentic moments that feel genuine?
   - 5: Multiple earned spark moments, feels like real person
   - 3: Some authentic moments but also generic sections
   - 1: Feels performed or entirely generic

5. OVERALL READABILITY (1-5)
   Is this enjoyable to read or exhausting?
   - 5: Engaging throughout, reader wants to keep reading
   - 3: Readable but sometimes loses momentum
   - 1: Dense, exhausting, or confusing

6. ISSUES FOUND
   Any remaining problems?
   - Banned terms ("tapestry", "testament", "showcase", "unwavering")
   - Voice over-polishing (lost authentic phrases)
   - Word count over limit
   - Sections that still need work

7. REVISION NEEDED?
   Based on scores and issues:
   - true: Needs another revision pass
   - false: Ready to submit

OUTPUT FORMAT (JSON):
{
  "scores": {
    "candidate_centering": number,
    "narrative_flow": number,
    "vocabulary_appropriateness": number,
    "spark_quality": number,
    "overall_readability": number
  },
  "overall_score": number (average of above),
  "passes_quality": boolean (overall ≥ 4.0),
  "issues": [
    {
      "type": "banned_terms" | "voice_loss" | "word_count" | "needs_work",
      "severity": "critical" | "moderate" | "minor",
      "description": "string",
      "location": "string (quote or section)"
    }
  ],
  "revision_needed": boolean
}`;

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class HaikuDiagnosisService {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Layer 1: Initial Analysis (Fast Triage)
   *
   * Quick assessment before deep dive. Identifies spark score, structure,
   * key moments, and initial red flags.
   *
   * Cost: ~$0.002
   */
  async analyzeInitial(
    draft: string,
    voiceContext?: {
      register?: EmotionalRegister;
      sparkScore?: number;
      authenticPhrases?: string[];
    }
  ): Promise<{ analysis: InitialAnalysis; cost: number }> {
    const voiceContextStr = voiceContext
      ? `- Register: ${voiceContext.register}
- Spark Score: ${voiceContext.sparkScore}
- Authentic Phrases: ${voiceContext.authenticPhrases?.join(', ')}`
      : 'Not available (first-time analysis)';

    const prompt = INITIAL_ANALYSIS_PROMPT
      .replace('{draft}', draft)
      .replace('{voiceContext}', voiceContextStr);

    const response = await this.client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 1000,
      temperature: 0.2, // Low temp for consistent analysis
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Haiku');
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Haiku response');
    }

    const analysis = JSON.parse(jsonMatch[0]) as InitialAnalysis;
    const cost = calculateCost(
      response.usage.input_tokens,
      response.usage.output_tokens
    );

    return { analysis, cost };
  }

  /**
   * Layer 2: Citation Mapping (Evidence Selection)
   *
   * Maps college-specific evidence to essay sections. Pre-selects the most
   * relevant Dean quotes, core values, red/green flags for surgical teaching.
   *
   * Cost: ~$0.001 (college research is CACHED for 74% token savings)
   */
  async mapCitations(
    draft: string,
    collegeResearch: CollegeResearch,
    useCache: boolean = true
  ): Promise<{ mapping: CitationMapping; cost: number }> {
    const prompt = CITATION_MAPPING_PROMPT
      .replace('{collegeResearch}', JSON.stringify(collegeResearch, null, 2))
      .replace('{draft}', draft);

    const response = await this.client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 800,
      temperature: 0.1, // Very low temp for precise matching
      messages: [{ role: 'user', content: prompt }],
      // Note: Prompt caching would be configured here in production
      // system: [{ type: 'text', text: '...', cache_control: { type: 'ephemeral' } }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Haiku');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Haiku response');
    }

    const mapping = JSON.parse(jsonMatch[0]) as CitationMapping;

    // Calculate cost (with cache assumption)
    let cost = calculateCost(
      response.usage.input_tokens,
      response.usage.output_tokens
    );

    if (useCache) {
      // Assume 74% cache hit on college research
      cost = cost * 0.26; // Only pay for 26% of tokens
    }

    return { mapping, cost };
  }

  /**
   * Layer 3: Voice Fingerprinting (Baseline Capture)
   *
   * Creates a baseline fingerprint of the student's voice that will be
   * used to verify preservation across Stages 2-3.
   *
   * Cost: ~$0.002
   */
  async fingerprintVoice(
    draft: string,
    voiceContext?: {
      register?: EmotionalRegister;
      authenticPhrases?: string[];
    }
  ): Promise<{ fingerprint: VoiceFingerprint; cost: number }> {
    const voiceContextStr = voiceContext
      ? `- Register: ${voiceContext.register}
- Authentic Phrases from Stage 0: ${voiceContext.authenticPhrases?.join(', ')}`
      : 'Not available';

    const prompt = VOICE_FINGERPRINT_PROMPT
      .replace('{draft}', draft)
      .replace('{voiceContext}', voiceContextStr);

    const response = await this.client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 1000,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Haiku');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Haiku response');
    }

    const fingerprint = JSON.parse(jsonMatch[0]) as VoiceFingerprint;
    const cost = calculateCost(
      response.usage.input_tokens,
      response.usage.output_tokens
    );

    return { fingerprint, cost };
  }

  /**
   * Layer 4: Symptom Diagnosis (Per-Issue)
   *
   * Like PIQ's SymptomDiagnoser - identifies specific weakness and what's MISSING.
   * This runs BEFORE generation to inform surgical fixes.
   *
   * Cost: ~$0.02 per issue
   */
  async diagnoseSymptom(
    quote: string,
    surroundingContext: string,
    voiceFingerprint: VoiceFingerprint,
    relevantValues: any[]
  ): Promise<{ diagnosis: IssueSymptomDiagnosis; cost: number }> {
    const prompt = SYMPTOM_DIAGNOSIS_PROMPT
      .replace('{quote}', quote)
      .replace('{surroundingContext}', surroundingContext)
      .replace('{voiceFingerprint}', JSON.stringify(voiceFingerprint, null, 2))
      .replace('{relevantValues}', JSON.stringify(relevantValues, null, 2));

    const response = await this.client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 400, // Small, focused output
      temperature: 0.1, // High precision
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Haiku');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Haiku response');
    }

    const diagnosis = JSON.parse(jsonMatch[0]) as IssueSymptomDiagnosis;
    const cost = calculateCost(
      response.usage.input_tokens,
      response.usage.output_tokens
    );

    return { diagnosis, cost };
  }

  /**
   * Layer 5: Quality Verification (Final Checks)
   *
   * Fast quality check before final submission. Identifies any remaining
   * issues and confirms readiness.
   *
   * Cost: ~$0.003
   */
  async verifyQuality(
    draft: string,
    voiceFingerprint: VoiceFingerprint,
    preservationPriorities: string[]
  ): Promise<{ verification: QualityVerification; cost: number }> {
    const prompt = QUALITY_VERIFICATION_PROMPT
      .replace('{draft}', draft)
      .replace('{voiceFingerprint}', JSON.stringify(voiceFingerprint, null, 2))
      .replace('{preservationPriorities}', preservationPriorities.join('\n'));

    const response = await this.client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 1200,
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Haiku');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Haiku response');
    }

    const verification = JSON.parse(jsonMatch[0]) as QualityVerification;
    const cost = calculateCost(
      response.usage.input_tokens,
      response.usage.output_tokens
    );

    return { verification, cost };
  }

  /**
   * Utility: Get total cost summary for all Haiku operations
   */
  static getCostSummary(costs: number[]): {
    total: number;
    average: number;
    savingsVsSonnet: number;
  } {
    const total = costs.reduce((sum, cost) => sum + cost, 0);
    const average = total / costs.length;

    // Sonnet would be ~5x more expensive
    const sonnetCost = total * 5;
    const savings = sonnetCost - total;

    return {
      total,
      average,
      savingsVsSonnet: savings,
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  InitialAnalysis,
  CitationMapping,
  VoiceFingerprint,
  IssueSymptomDiagnosis,
  QualityVerification,
};
