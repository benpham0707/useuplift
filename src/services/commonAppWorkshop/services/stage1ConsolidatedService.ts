/**
 * Stage 1 Consolidated Teaching Service
 *
 * **Foundation Teaching with Integrated Analysis**
 *
 * This service combines conceptual teaching AND dimensional analysis in a
 * SINGLE Sonnet call, creating better integration and cohesion while saving cost.
 *
 * **Why Consolidation Improves Quality**:
 * 1. INTEGRATED TEACHING: Claude teaches concepts THEN analyzes using those concepts
 * 2. DIRECT CONNECTION: Student sees how rubric criteria relate to their essay
 * 3. COHESIVE FEEDBACK: Analysis references the concepts just taught
 * 4. BETTER FLOW: Single narrative instead of disjointed pieces
 *
 * **Cost Comparison**:
 * - Separate calls: Conceptual ($0.04) + Dimensional ($0.03) = $0.07
 * - Consolidated: Single call ($0.05)
 * - Savings: $0.02 with BETTER quality
 *
 * **What Stage 1 Accomplishes**:
 * - Student understands what makes a great essay for THIS college
 * - Student knows the rubric and what readers look for
 * - Student has mental models for key concepts (IV, authenticity, etc.)
 * - Student sees EXACTLY where their essay succeeds and struggles
 * - Student gets 3 CRITICAL issues identified with missing elements (PIQ-style depth)
 * - Student is primed with evidence-based teaching for Stage 2
 */

import Anthropic from '@anthropic-ai/sdk';
import { parseClaudeJSON } from '../utils/jsonParser';
import { HaikuDiagnosisService } from './haikuDiagnosisService';
import type {
  InitialAnalysis,
  CitationMapping,
  VoiceFingerprint,
  IssueSymptomDiagnosis,
} from '../types/stage0Types';
import type {
  CollegeResearch,
  CollegeEssayPrompt,
} from '../types/collegeResearch';

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
 * College values teaching
 */
export interface CollegeValuesTeaching {
  core_value: any; // CollegeCoreValue
  how_this_applies: string;
  example_from_dean: any; // CollegeKeyQuote
  student_reflection_prompt: string;
}

/**
 * Rubric dimension education
 */
export interface RubricDimensionTeaching {
  dimension: string; // "Intellectual Vitality", "Authenticity", etc.
  what_it_means: string; // Plain English
  how_to_show_it: string; // Concrete strategies
  example_evidence: string; // Dean quote or rubric text
  socratic_question: string;
}

/**
 * Prompt deep dive
 */
export interface PromptDeepDive {
  prompt_analysis: string;
  hidden_layers: string[];
  common_misinterpretations: string[];
  successful_approaches: string[];
}

/**
 * Conceptual foundation (Part 1 of consolidated call)
 */
export interface ConceptualFoundation {
  college_values_teaching: CollegeValuesTeaching[];
  rubric_education: RubricDimensionTeaching[];
  prompt_deep_dive: PromptDeepDive;
}

/**
 * Critical issue (with PIQ-level depth)
 */
export interface CriticalIssue {
  issue_number: number;
  quote: string;
  location: string;
  problem: string;
  symptom_type: string;
  diagnosis: string; // One sentence
  prescription: string; // How to fix

  // PIQ-STYLE MISSING ELEMENTS
  missing_elements: {
    sensory_details?: string[];
    concrete_objects?: string[];
    micro_moment?: string;
    emotional_truth?: string;
  };

  relevant_concept: string; // Which concept from teaching this relates to
  relevant_evidence: any[]; // College quotes
  socratic_questions: string[];
  college_value_impacted: string; // Which core value this issue undermines
}

/**
 * Dimensional assessment (Part 2 of consolidated call)
 */
export interface DimensionalAssessment {
  dimension: string;
  strength: 'STRONG' | 'ADEQUATE' | 'WEAK';
  current_score: number; // 1-10
  target_score: number;
  gap: number;

  evidence: {
    strengths: string[]; // What's working
    weaknesses: string[]; // What's missing
  };

  // Critical issues for THIS dimension (top 1-2)
  priority_issues: CriticalIssue[];
}

/**
 * Complete Stage 1 output
 */
export interface Stage1ConsolidatedOutput {
  // Part 1: Conceptual Foundation
  conceptual_foundation: ConceptualFoundation;

  // Part 2: Dimensional Assessment
  dimensional_assessment: DimensionalAssessment[];

  // Top 3 critical issues across ALL dimensions
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
    dimensional_baseline: Record<string, number>; // Dimension → score
    concepts_taught: string[]; // For avoiding repetition in Stage 2
  };

  // Cost tracking
  cost: number;
  tokens_used: {
    input: number;
    output: number;
  };
}

// ============================================================================
// CONSOLIDATED TEACHING PROMPT
// ============================================================================

const STAGE1_CONSOLIDATED_PROMPT = `You are providing comprehensive Stage 1 foundation teaching for a college admissions essay.

═══════════════════════════════════════════════════════════
⚠️  CRITICAL: JSON STRUCTURE REQUIREMENTS (READ THIS FIRST)
═══════════════════════════════════════════════════════════

Your response MUST include these exact fields in valid JSON format:

1. **top_3_critical_issues** - Array of EXACTLY 2-3 critical issues
2. **missing_elements** - MANDATORY for EVERY issue in the format below

**EXAMPLE ISSUE WITH COMPLETE STRUCTURE:**

{
  "issue_number": 1,
  "quote": "I have always been passionate about learning",
  "location": "Opening paragraph, first sentence",
  "problem": "Generic claim lacks grounding in specific experience",
  "symptom_type": "abstract_language",
  "diagnosis": "Student tells readers about passion without showing a moment where passion is visible",
  "prescription": "Replace with concrete scene showing curiosity in action",

  "missing_elements": {
    "sensory_details": [
      "What does the learning environment look like? (dusty library shelves, whiteboard equations, lab equipment)",
      "What sounds accompany this passion? (rustling pages, pencil scratching, equipment humming)",
      "What physical sensations? (cold metal microscope, paper texture, chalk dust on fingers)"
    ],
    "concrete_objects": [
      "Specific book titles or authors",
      "Exact class name with teacher's name (e.g., 'Mrs. Chen's AP Bio')",
      "Numbers: '47 failed attempts' not 'many attempts'"
    ],
    "micro_moment": "The exact moment when 'passion' became visible - like staying up until 3 AM to finish one more chapter, or forgetting lunch because an equation wouldn't solve",
    "emotional_truth": "What emotion drives this? Show frustration (threw pen), exhilaration (couldn't stop grinning), confusion (stared at ceiling for 20 minutes)"
  },

  "relevant_concept": "Intellectual Vitality requires showing curiosity through action, not claiming it",
  "relevant_evidence": [
    {
      "text": "We want students who lose track of time in the library",
      "source": "Stanford Admission Dean",
      "why_relevant": "This quote captures how IV must be demonstrated through behavior"
    }
  ],
  "socratic_questions": [
    "When was the last time you got so absorbed you forgot to eat?",
    "What specific question kept you up at night?"
  ],
  "college_value_impacted": "Intellectual Vitality"
}

**QUALITY STANDARDS FOR missing_elements:**

For SENSORY DETAILS (2-5 specific suggestions):
✓ "the smell of dusty library books mixed with old coffee"
✗ "sensory details about library"
✓ "cold metal of the microscope against my cheek"
✗ "lab equipment"

For CONCRETE OBJECTS (3-7 specific items):
✓ Numbers: "47 attempts" not "many attempts"
✓ Proper nouns: "Mrs. Chen's AP Bio" not "biology class"
✓ Specific items: "Arduino board with blinking red LED" not "electronics"
✗ Generic categories

For MICRO-MOMENT (single scene):
✓ "The moment I saw the first LED blink at 2:47 AM"
✗ "When I finally understood"
✓ Must include WHERE and WHEN

For EMOTIONAL TRUTH (name + show):
✓ "Frustration: threw the pen, stared at ceiling, let out a long sigh"
✗ "I felt frustrated"
✓ Must suggest HOW to show through physical action

**THIS FIELD IS ABSOLUTELY MANDATORY FOR EVERY ISSUE.**
If you cannot identify missing elements, you haven't diagnosed deeply enough.

═══════════════════════════════════════════════════════════
TWO-PART RESPONSE STRUCTURE
═══════════════════════════════════════════════════════════

- PART 1: Teach concepts (college values, rubric, prompt analysis)
- PART 2: Analyze essay using the concepts you just taught

═══════════════════════════════════════════════════════════
COLLEGE RESEARCH (this will be CACHED)
═══════════════════════════════════════════════════════════

{collegeResearch}

═══════════════════════════════════════════════════════════
ESSAY CONTEXT
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

CITATION MAPPING (pre-selected relevant evidence):
{citationMapping}

VOICE FINGERPRINT:
{voiceFingerprint}

═══════════════════════════════════════════════════════════
PART 1: CONCEPTUAL FOUNDATION
═══════════════════════════════════════════════════════════

Your job: TEACH these concepts BEFORE evaluating the essay.

### 1. COLLEGE VALUES TEACHING

For each relevant core value (from citation mapping):
- What it means for THIS college specifically
- How it applies to this essay prompt
- Dean quote as evidence
- Reflection prompt for student ("Consider: ...")

Be specific to THIS college. Not generic "intellectual vitality" but what
Stanford/MIT/UChicago/etc. specifically values.

### 2. RUBRIC EDUCATION

For each dimension (Intellectual Vitality, Authenticity, Narrative Quality, Impact):
- Plain English explanation (not jargon)
- Concrete strategies to demonstrate it
- Example evidence (Dean quote or rubric text)
- Socratic question to deepen thinking

Example:
"Intellectual Vitality isn't about listing achievements. It's about showing
genuine curiosity and love of learning. Stanford wants to see the moment
you got lost in an idea and forgot to eat lunch."

### 3. PROMPT DEEP DIVE

- What the prompt is REALLY asking (beyond surface)
- Hidden layers/subtext
- Common misinterpretations students make
- Successful approaches for this specific prompt

Be insightful. Go beyond the obvious.

═══════════════════════════════════════════════════════════
PART 2: DIMENSIONAL ANALYSIS (using concepts you just taught)
═══════════════════════════════════════════════════════════

Now analyze the essay using the conceptual framework you established.

For EACH dimension (IV, Authenticity, Narrative Quality, Impact):

### 1. STRENGTH ASSESSMENT
- Reference the concept you taught above
- STRONG/ADEQUATE/WEAK (be honest)
- Current score (1-10)
- Target score for this college
- Gap

### 2. EVIDENCE
- What's working (cite the concept)
- What's missing (cite the concept)

### 3. TOP 1-2 CRITICAL ISSUES FOR THIS DIMENSION

For each issue, provide PIQ-LEVEL DEPTH:

**Quote**: Exact text from essay
**Location**: Where in essay
**Problem**: What's wrong (be specific)
**Symptom Type**: abstract_language | passive_agency | telling_not_showing | etc.
**Diagnosis**: One sentence precise diagnosis
**Prescription**: How to fix

**MISSING ELEMENTS** (like PIQ's SymptomDiagnoser):
- Sensory Details: What sights/sounds/textures are missing?
- Concrete Objects: What numbers/names/specifics would ground this?
- Micro-Moment: What single scene would anchor this abstraction?
- Emotional Truth: What feeling is told but not shown?

**Relevant Concept**: Which concept from Part 1 does this relate to?
**Relevant Evidence**: Which Dean quotes/college values apply?
**Socratic Questions**: 2-3 questions to deepen student thinking
**College Value Impacted**: Which core value does this issue undermine?

═══════════════════════════════════════════════════════════
SELECT TOP 3 CRITICAL ISSUES (across all dimensions)
═══════════════════════════════════════════════════════════

After analyzing all dimensions, select the TOP 3 CRITICAL issues:

Criteria:
- Severity: Must be critical (not moderate/minor)
- Score Impact: Must increase score by +3 or more
- College Alignment: Must directly address core college value
- Fixability: Must be actionable

Rank by: (severity × score_impact × college_alignment)

These 3 issues will be addressed in Stage 2 with surgical teaching.

═══════════════════════════════════════════════════════════
HOLISTIC CONTEXT (for Stage 2)
═══════════════════════════════════════════════════════════

Identify:
- Recurring Motifs: 3-5 motifs that appear throughout essay
- Emotional Arc: How emotion develops from start to finish
- Narrative Thread: The through-line connecting all sections

This context will help Stage 2 maintain cohesion across fixes.

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════

{
  "conceptual_foundation": {
    "college_values_teaching": [
      {
        "core_value": {...},
        "how_this_applies": "...",
        "example_from_dean": {...},
        "student_reflection_prompt": "..."
      }
    ],
    "rubric_education": [
      {
        "dimension": "Intellectual Vitality",
        "what_it_means": "...",
        "how_to_show_it": "...",
        "example_evidence": "...",
        "socratic_question": "..."
      }
    ],
    "prompt_deep_dive": {
      "prompt_analysis": "...",
      "hidden_layers": [...],
      "common_misinterpretations": [...],
      "successful_approaches": [...]
    }
  },
  "dimensional_assessment": [
    {
      "dimension": "Intellectual Vitality",
      "strength": "WEAK",
      "current_score": 4,
      "target_score": 8,
      "gap": 4,
      "evidence": {
        "strengths": [...],
        "weaknesses": [...]
      },
      "priority_issues": [
        {
          "issue_number": 1,
          "quote": "...",
          "location": "...",
          "problem": "...",
          "symptom_type": "...",
          "diagnosis": "...",
          "prescription": "...",
          "missing_elements": {
            "sensory_details": [...],
            "concrete_objects": [...],
            "micro_moment": "...",
            "emotional_truth": "..."
          },
          "relevant_concept": "...",
          "relevant_evidence": [...],
          "socratic_questions": [...],
          "college_value_impacted": "..."
        }
      ]
    }
  ],
  "top_3_critical_issues": [...]
  "holistic_context": {
    "recurring_motifs": [...],
    "emotional_arc": "...",
    "narrative_thread": "..."
  },
  "dimensional_baseline": {
    "intellectual_vitality": 4,
    "authenticity": 6,
    "narrative_quality": 5,
    "impact": 4
  },
  "concepts_taught": ["Intellectual Vitality definition", "Authenticity criteria", ...]
}`;

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class Stage1ConsolidatedService {
  private client: Anthropic;
  private haikuService: HaikuDiagnosisService;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
    this.haikuService = new HaikuDiagnosisService(apiKey);
  }

  /**
   * Generate complete Stage 1 teaching (consolidated)
   *
   * This runs in 3 steps:
   * 1. Haiku pre-analysis (initial, citation, voice) - $0.005
   * 2. Sonnet consolidated teaching - $0.045
   * Total: ~$0.05
   */
  async generateStage1Teaching(
    essayDraft: string,
    essayPrompt: string,
    collegeResearch: CollegeResearch,
    voiceContext: {
      register: string;
      sparkScore: number;
      voiceQualities: string[];
      authenticPhrases: string[];
    }
  ): Promise<Stage1ConsolidatedOutput> {
    console.log('📚 Stage 1: Running consolidated foundation teaching...');

    // Step 1: Haiku pre-analysis (fast & cheap)
    console.log('  1/2: Running Haiku pre-analysis...');

    const { analysis: initialAnalysis } = await this.haikuService.analyzeInitial(
      essayDraft,
      voiceContext
    );

    const { mapping: citationMapping } = await this.haikuService.mapCitations(
      essayDraft,
      collegeResearch,
      true // Use cache
    );

    const { fingerprint: voiceFingerprint } = await this.haikuService.fingerprintVoice(
      essayDraft,
      voiceContext
    );

    // Step 2: Sonnet consolidated teaching
    console.log('  2/2: Running Sonnet consolidated teaching...');

    const prompt = STAGE1_CONSOLIDATED_PROMPT
      .replace('{collegeResearch}', JSON.stringify(collegeResearch, null, 2))
      .replace('{essayPrompt}', essayPrompt)
      .replace('{essayDraft}', essayDraft)
      .replace('{register}', voiceContext.register)
      .replace('{sparkScore}', voiceContext.sparkScore.toString())
      .replace('{voiceQualities}', voiceContext.voiceQualities.join(', '))
      .replace('{authenticPhrases}', voiceContext.authenticPhrases.join('; '))
      .replace('{initialAnalysis}', JSON.stringify(initialAnalysis, null, 2))
      .replace('{citationMapping}', JSON.stringify(citationMapping, null, 2))
      .replace('{voiceFingerprint}', JSON.stringify(voiceFingerprint, null, 2));

    const response = await this.client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 8000, // Increased for full structured output with examples
      temperature: 0.4, // Balanced for teaching + analysis
      messages: [{ role: 'user', content: prompt }],
      // Note: In production, college research would be cached here
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Sonnet');
    }

    const parsed = parseClaudeJSON(content.text, 'Stage1ConsolidatedOutput');

    // Calculate cost
    const cost =
      response.usage.input_tokens * SONNET_PRICING.input +
      response.usage.output_tokens * SONNET_PRICING.output;

    console.log(`✓ Stage 1 complete`);
    console.log(`  Top 3 issues identified with PIQ-level depth`);
    console.log(`  Cost: $${cost.toFixed(3)}`);

    return {
      conceptual_foundation: parsed.conceptual_foundation,
      dimensional_assessment: parsed.dimensional_assessment,
      top_3_critical_issues: parsed.top_3_critical_issues,
      stage2_handoff: {
        voice_fingerprint: voiceFingerprint,
        citation_mapping: citationMapping,
        holistic_context: parsed.holistic_context,
        dimensional_baseline: parsed.dimensional_baseline,
        concepts_taught: parsed.concepts_taught,
      },
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

export {
  CollegeValuesTeaching,
  RubricDimensionTeaching,
  PromptDeepDive,
  ConceptualFoundation,
  CriticalIssue,
  DimensionalAssessment,
  Stage1ConsolidatedOutput,
};
