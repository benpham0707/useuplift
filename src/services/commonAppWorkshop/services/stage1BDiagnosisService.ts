/**
 * Stage 1B: Deep Diagnosis Service
 *
 * **DIAGNOSIS ONLY - No Teaching**
 *
 * This service provides DEEP essay diagnosis by explicitly referencing
 * the concepts taught in Stage 1A. By separating diagnosis from teaching:
 *
 * 1. **FULL DIAGNOSIS DEPTH**: No token pressure from teaching crowding diagnosis
 * 2. **EXPLICIT CONCEPT APPLICATION**: Diagnosis directly references Stage 1A teaching
 * 3. **PIQ-LEVEL missing_elements**: Full depth for each critical issue
 * 4. **CLEAN SEPARATION**: Teaching complete before diagnosis begins
 *
 * **What Stage 1B Accomplishes**:
 * - Student sees EXACTLY where their essay succeeds and struggles
 * - Every diagnosis explicitly references concepts from Stage 1A
 * - Student gets 2-3 CRITICAL issues with COMPLETE missing_elements
 * - Dimensional assessment with concrete evidence
 * - Holistic context (motifs, arc, thread) for Stage 2 coherence
 *
 * **Cost**: ~$0.05 (6000 tokens for deep diagnosis)
 *
 * **Input**: Stage 1A teaching + essay + voice context
 * **Output**: Complete diagnosis (issues, dimensions, holistic context)
 * **Used By**: Stage 2 (surgical teaching on diagnosed issues)
 */

import Anthropic from '@anthropic-ai/sdk';
import { parseClaudeJSON } from '../utils/jsonParser';
import { HaikuDiagnosisService } from './haikuDiagnosisService';
import type { ConceptualFoundation } from './stage1ATeachingService';
import type {
  InitialAnalysis,
  CitationMapping,
  VoiceFingerprint,
  EmotionalRegister,
} from '../types/stage0Types';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-20250514';
const SONNET_PRICING = {
  input: 3.0 / 1_000_000,
  output: 15.0 / 1_000_000,
};

// ============================================================================
// TYPES
// ============================================================================

/**
 * Critical issue (with PIQ-level depth)
 */
export interface CriticalIssue {
  issue_number: number;
  quote: string;
  location: string;
  problem: string;
  symptom_type: string;
  diagnosis: string;
  prescription: string;

  // PIQ-STYLE MISSING ELEMENTS (MANDATORY)
  missing_elements: {
    sensory_details?: string[];
    concrete_objects?: string[];
    micro_moment?: string;
    emotional_truth?: string;
  };

  relevant_concept: string; // From Stage 1A teaching
  relevant_evidence: any[]; // From college research
  socratic_questions: string[];
  college_value_impacted: string;
}

/**
 * Dimensional assessment
 */
export interface DimensionalAssessment {
  dimension: string;
  strength: 'STRONG' | 'ADEQUATE' | 'WEAK';
  current_score: number;
  target_score: number;
  gap: number;
  evidence: {
    strengths: string[];
    weaknesses: string[];
  };
  priority_issues: CriticalIssue[];
}

/**
 * Stage 1B parsed response from Claude
 */
interface Stage1BParsedResponse {
  dimensional_assessment?: DimensionalAssessment[];
  top_3_critical_issues?: CriticalIssue[];
  holistic_context?: {
    recurring_motifs: string[];
    emotional_arc: string;
    narrative_thread: string;
  };
  dimensional_baseline?: Record<string, number>;
  concepts_taught?: string[];
}

/**
 * Stage 1B output
 */
export interface Stage1BOutput {
  // Analysis using Stage 1A concepts
  dimensional_assessment: DimensionalAssessment[];
  top_3_critical_issues: CriticalIssue[];

  // Handoff to Stage 2
  stage2_handoff: {
    voice_fingerprint: VoiceFingerprint;
    citation_mapping: CitationMapping;
    holistic_context: {
      recurring_motifs: string[];
      emotional_arc: string;
      narrative_thread: string;
    };
    dimensional_baseline: Record<string, number>;
    concepts_taught: string[];
  };

  // Cost tracking
  cost: number;
  tokens_used: {
    haiku_input: number;
    haiku_output: number;
    sonnet_input: number;
    sonnet_output: number;
  };
}

// ============================================================================
// DIAGNOSIS PROMPT (DEPTH WITH EXPLICIT CONCEPT REFERENCE)
// ============================================================================

const STAGE1B_DIAGNOSIS_PROMPT = `You are analyzing an essay using the conceptual foundation you just taught.

⚠️  CRITICAL: Your ONLY job is to DIAGNOSE the essay using concepts from Stage 1A.

This is PURE DIAGNOSIS - teaching is already complete from Stage 1A.

═══════════════════════════════════════════════════════════
⚠️  CRITICAL: JSON STRUCTURE REQUIREMENTS
═══════════════════════════════════════════════════════════

**EVERY issue MUST include complete missing_elements**. Example:

{
  "issue_number": 1,
  "quote": "I have always been passionate about learning",
  "problem": "Generic claim lacks grounding in specific experience",
  "missing_elements": {
    "sensory_details": [
      "What does the learning environment look like? (dusty library shelves, equations on whiteboard)",
      "What sounds? (rustling pages, pencil scratching)",
      "Physical sensations? (cold metal microscope, chalk dust on fingers)"
    ],
    "concrete_objects": [
      "Specific book titles",
      "Class name + teacher: 'Mrs. Chen's AP Bio'",
      "Numbers: '47 attempts' not 'many'"
    ],
    "micro_moment": "The exact moment passion became visible - staying up until 3 AM to finish one chapter, forgetting lunch because an equation wouldn't solve",
    "emotional_truth": "Show frustration (threw pen), exhilaration (couldn't stop grinning), confusion (stared at ceiling 20 minutes)"
  }
}

**QUALITY STANDARDS**:
- Sensory details: SPECIFIC not generic ("smell of dusty books" NOT "sensory details")
- Concrete objects: Numbers, proper nouns, specific items
- Micro-moment: Single scene with WHERE and WHEN
- Emotional truth: Name emotion + HOW to show through action

═══════════════════════════════════════════════════════════
STAGE 1A TEACHING (PIQ-quality warm coaching)
═══════════════════════════════════════════════════════════

Stage 1A provided warm, conversational coaching that:
- Identified quality anchors (what's working in the essay)
- Identified student's unique voice fingerprint
- Taught college values through THEIR specific essay
- Observed narrative gaps
- Connected to the prompt

Reference this teaching explicitly in your diagnosis:
- When identifying issues, connect to Stage 1A's college_alignment teaching
- When suggesting what's missing, build on Stage 1A's narrative_gaps observation
- When explaining concepts, reference Stage 1A's voice_fingerprint insights

STAGE 1A OUTPUT:
{conceptualFoundation}

═══════════════════════════════════════════════════════════
ESSAY TO DIAGNOSE
═══════════════════════════════════════════════════════════

ESSAY PROMPT:
{essayPrompt}

ESSAY DRAFT:
{essayDraft}

VOICE CONTEXT FROM STAGE 0:
- Register: {register}
- Spark Score: {sparkScore}
- Voice Qualities: {voiceQualities}
- Authentic Phrases: {authenticPhrases}

INITIAL ANALYSIS:
{initialAnalysis}

CITATION MAPPING:
{citationMapping}

VOICE FINGERPRINT:
{voiceFingerprint}

═══════════════════════════════════════════════════════════
YOUR DIAGNOSIS MISSION
═══════════════════════════════════════════════════════════

Analyze the essay using the concepts from Stage 1A.

For EACH dimension (IV, Authenticity, Narrative Quality, Impact):

### 1. STRENGTH ASSESSMENT
- Reference the concept taught in Stage 1A
- Be honest: STRONG/ADEQUATE/WEAK
- Current score (1-10)
- Target score for this college
- Gap

### 2. EVIDENCE
- What's working (cite Stage 1A concept)
- What's missing (cite Stage 1A concept)

### 3. TOP 1-2 CRITICAL ISSUES FOR THIS DIMENSION

For each issue, provide PIQ-LEVEL DEPTH:

**Quote**: Exact text from essay
**Location**: Where in essay
**Problem**: What's wrong (be specific)
**Symptom Type**: abstract_language | passive_agency | telling_not_showing | etc.
**Diagnosis**: One sentence precise diagnosis
**Prescription**: How to fix

**MISSING ELEMENTS** (MANDATORY - cite Stage 1A rubric teaching):
- Sensory Details: What sights/sounds/textures are missing? (2-5 specific)
- Concrete Objects: What numbers/names/specifics would ground this? (3-7 specific)
- Micro-Moment: What single scene would anchor this abstraction?
- Emotional Truth: What feeling is told but not shown?

**Relevant Concept**: Which concept from Stage 1A does this relate to?
**Relevant Evidence**: Which Dean quotes/college values apply?
**Socratic Questions**: 2-3 questions (can reference Stage 1A reflection prompts)
**College Value Impacted**: Which core value does this issue undermine?

═══════════════════════════════════════════════════════════
SELECT TOP 2-3 CRITICAL ISSUES (across all dimensions)
═══════════════════════════════════════════════════════════

After analyzing all dimensions, select the TOP 2-3 CRITICAL issues:

Criteria:
- Severity: Must be critical (not moderate/minor)
- Score Impact: Must increase score by +3 or more
- College Alignment: Must directly address core college value
- Fixability: Must be actionable

Rank by: (severity × score_impact × college_alignment)

These issues will be addressed in Stage 2 with surgical teaching.

═══════════════════════════════════════════════════════════
HOLISTIC CONTEXT (for Stage 2)
═══════════════════════════════════════════════════════════

Identify:
- Recurring Motifs: 3-5 motifs that appear throughout essay
- Emotional Arc: How emotion develops from start to finish
- Narrative Thread: The through-line connecting all sections

This context helps Stage 2 maintain cohesion across fixes.

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════

⚠️  ABSOLUTELY CRITICAL: EVERY ISSUE **MUST** HAVE COMPLETE "missing_elements" FIELD ⚠️

Without missing_elements, the diagnosis is incomplete and Stage 2 cannot function.

{
  "dimensional_assessment": [
    {
      "dimension": "Intellectual Vitality",
      "strength": "WEAK",
      "current_score": 4,
      "target_score": 8,
      "gap": 4,
      "evidence": {
        "strengths": ["Mentions curiosity about snow"],
        "weaknesses": ["Tells rather than shows", "Missing the 'lost track of time' moment from rubric"]
      },
      "priority_issues": [
        {
          "issue_number": 1,
          "quote": "I am passionate about science",
          "location": "Opening paragraph",
          "problem": "Generic claim without grounding scene",
          "symptom_type": "abstract_language",
          "diagnosis": "Student TELLS passion without SHOWING the moment it became visible",
          "prescription": "Replace with specific scene showing curiosity in action",

          // ⚠️ MANDATORY - missing_elements MUST be complete for EVERY issue ⚠️
          "missing_elements": {
            "sensory_details": ["smell of dusty library books", "cold metal microscope on cheek", "sound of pages turning at 2 AM"],
            "concrete_objects": ["Mrs. Chen's AP Bio textbook", "47 failed attempts", "Arduino board with blinking red LED"],
            "micro_moment": "The moment at 2:47 AM when the first LED blinked and I forgot I had school in 4 hours",
            "emotional_truth": "Exhilaration: couldn't stop grinning, paced around room, texted friend at 3 AM"
          },

          "relevant_concept": "Stage 1A taught that IV must be visible through behavior, not claims",
          "relevant_evidence": [...],
          "socratic_questions": [...],
          "college_value_impacted": "Intellectual Vitality"
        }
      ]
    }
  ],
  "top_3_critical_issues": [
    // ⚠️ Each of these 2-3 issues MUST have complete missing_elements too! ⚠️
    ...
  ],
  "holistic_context": {
    "recurring_motifs": ["curiosity", "unexpected questions", "losing track of time"],
    "emotional_arc": "Starts neutral, builds to excitement, ends with reflection",
    "narrative_thread": "Discovering that 'useless' questions reveal character"
  },
  "dimensional_baseline": {
    "intellectual_vitality": 4,
    "authenticity": 6,
    "narrative_quality": 5,
    "impact": 4
  },
  "concepts_taught": ["Intellectual Vitality requires behavior", "Authenticity = voice + vulnerability", ...]
}
`;

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class Stage1BDiagnosisService {
  private client: Anthropic;
  private haikuService: HaikuDiagnosisService;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
    this.haikuService = new HaikuDiagnosisService(apiKey);
  }

  /**
   * Generate deep diagnosis using Stage 1A teaching
   *
   * This provides PURE DIAGNOSIS that explicitly references Stage 1A concepts.
   */
  async generateDiagnosis(
    essayDraft: string,
    essayPrompt: string,
    conceptualFoundation: ConceptualFoundation,
    voiceContext: {
      register?: string;
      sparkScore?: number;
      voiceQualities?: string[];
      authenticPhrases?: string[];
    },
    initialAnalysis: InitialAnalysis,
    collegeResearch?: any // College research for citation mapping
  ): Promise<Stage1BOutput> {
    console.log('🔬 Stage 1B: Generating deep diagnosis...');

    // Step 1: Run Haiku pre-analysis
    console.log('  1/2: Running Haiku pre-analysis...');
    const haikuResult = await this.haikuService.analyzeInitial(
      essayDraft,
      {
        register: voiceContext.register as EmotionalRegister,
        sparkScore: voiceContext.sparkScore,
        authenticPhrases: voiceContext.authenticPhrases,
      }
    );

    // Step 1.5: Create citation mapping and voice fingerprint using Haiku
    console.log('  1.5/3: Creating citation mapping and voice fingerprint...');

    // Map citations if we have college research
    const citationResult = collegeResearch
      ? await this.haikuService.mapCitations(
          essayDraft,
          collegeResearch.relevant_core_values || []
        )
      : {
          mapping: {
            relevant_core_values: [],
            relevant_red_flags: [],
            relevant_green_flags: [],
            targeted_quotes: []
          },
          cost: 0
        };

    // Fingerprint voice
    const fingerprintResult = await this.haikuService.fingerprintVoice(
      essayDraft,
      {
        register: voiceContext.register as EmotionalRegister,
        authenticPhrases: voiceContext.authenticPhrases,
      }
    );

    const totalHaikuCost = haikuResult.cost + citationResult.cost + fingerprintResult.cost;

    // Step 2: Run Sonnet diagnosis using Stage 1A concepts
    console.log('  2/3: Running Sonnet deep diagnosis...');

    const prompt = STAGE1B_DIAGNOSIS_PROMPT
      .replace('{conceptualFoundation}', JSON.stringify(conceptualFoundation, null, 2))
      .replace('{essayPrompt}', essayPrompt)
      .replace('{essayDraft}', essayDraft)
      .replace('{register}', voiceContext.register || 'unknown')
      .replace('{sparkScore}', (voiceContext.sparkScore || 50).toString())
      .replace('{voiceQualities}', (voiceContext.voiceQualities || []).join(', '))
      .replace('{authenticPhrases}', (voiceContext.authenticPhrases || []).join('; '))
      .replace('{initialAnalysis}', JSON.stringify(initialAnalysis, null, 2))
      .replace('{citationMapping}', JSON.stringify(citationResult.mapping, null, 2))
      .replace('{voiceFingerprint}', JSON.stringify(fingerprintResult.fingerprint, null, 2));

    const response = await this.client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 6000, // Diagnosis only, no teaching
      temperature: 0.4, // Balanced analysis
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Sonnet');
    }

    // Parse response
    const parsed = parseClaudeJSON<Stage1BParsedResponse>(content.text, 'Stage1BDiagnosisOutput');

    // Calculate cost
    const sonnetCost =
      response.usage.input_tokens * SONNET_PRICING.input +
      response.usage.output_tokens * SONNET_PRICING.output;
    const totalCost = totalHaikuCost + sonnetCost;

    console.log(`✓ Stage 1B complete`);
    console.log(`  Top ${parsed.top_3_critical_issues?.length || 0} issues identified with PIQ-level depth`);
    console.log(`  Cost: $${totalCost.toFixed(3)}`);

    return {
      dimensional_assessment: parsed.dimensional_assessment || [],
      top_3_critical_issues: parsed.top_3_critical_issues || [],
      stage2_handoff: {
        voice_fingerprint: fingerprintResult.fingerprint,
        citation_mapping: citationResult.mapping,
        holistic_context: parsed.holistic_context || {
          recurring_motifs: [],
          emotional_arc: '',
          narrative_thread: '',
        },
        dimensional_baseline: parsed.dimensional_baseline || {},
        concepts_taught: parsed.concepts_taught || [],
      },
      cost: totalCost,
      tokens_used: {
        haiku_input: response.usage.input_tokens,
        haiku_output: response.usage.output_tokens,
        sonnet_input: response.usage.input_tokens,
        sonnet_output: response.usage.output_tokens,
      },
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  CriticalIssue,
  DimensionalAssessment,
  Stage1BOutput,
};
