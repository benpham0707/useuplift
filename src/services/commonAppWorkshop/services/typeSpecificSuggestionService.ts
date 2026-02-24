// @ts-nocheck
/**
 * Type-Specific Suggestion Service
 *
 * **PIQ-Quality Suggestion Generation for Supplementals**
 *
 * This service generates surgical suggestions using:
 * 1. Type-specific rubrics (14 types, each with critical dimensions)
 * 2. College overlay (values, red flags, key quotes)
 * 3. Voice fingerprint (preserve authentic voice)
 * 4. 2-Suggestion Framework (Polished Original + Voice Amplifier)
 *
 * **Key Innovations Over Generic Feedback**:
 * - Suggestions MUST align with type-specific excellence requirements
 * - Suggestions MUST demonstrate college-specific values
 * - Suggestions MUST preserve voice fingerprint
 * - Each issue gets 2 distinct suggestions (safe path + authentic path)
 *
 * **Quality Guarantees**:
 * - No banned terms (tapestry, realm, delve, etc.)
 * - Suggestions different from original (no parroting)
 * - College evidence cited in each suggestion
 * - Voice markers preserved in polished, amplified in voice
 *
 * **Cost Model**:
 * - Uses Sonnet for suggestion generation (~$0.05 per issue)
 * - Batch mode for multiple issues (~$0.08 for 3 issues)
 */

import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient } from '../../../lib/llm/claude';
import { parseClaudeJSON } from '../utils/jsonParser';
import type { SupplementalDimension, QualityTier } from '../rubrics';
import {
  TYPE_WEIGHT_CONFIGS,
  getCriticalDimensions,
  getExcellenceRequirements,
  getTopDimensions
} from '../rubrics/typeWeightMatrices';
import { DIMENSION_DEFINITIONS } from '../rubrics/universalSupplementalRubric';
import type { CollegeResearch, CollegeCoreValue, CollegeKeyQuote } from '../types/collegeResearch';
import type { SupplementalType } from '../../../data/commonAppSupplementalTypes';
import type { VoiceFingerprint } from '../types/stage0Types';
import type { EssayContextPackage } from '../types';
import type { DetectedIssue, DimensionScore } from './typeAwareScoringService';
import type {
  ContextGatheringRequest,
  EnrichedStudentContext,
  ContextGap,
  SuggestionWithContextNeeds
} from '../types/contextGathering';
import { ContextGapDetector, contextGapDetector } from './contextGapDetector';
import {
  SonnetContextLayer,
  sonnetContextLayer,
  type SonnetContextAnalysis,
  type ContextGap as SonnetGap
} from './sonnetContextLayer';
import {
  CollegeOverlayService,
  collegeOverlayService,
  type CollegeContextForPrompt
} from './collegeOverlayService';
import {
  SemanticClicheAnalyzer,
  semanticClicheAnalyzer,
  type SemanticClicheAnalysis
} from './semanticClicheAnalyzer';
import { redFlagMatcher, type RedFlagMatcherOutput } from './redFlagMatcher';
import { greenFlagAmplifier, type GreenFlagAmplifierOutput } from './greenFlagAmplifier';
import { promptRubricInjector, type RubricBandGuidance } from './promptRubricInjector';
import { socraticQuestionMatcher, type SocraticMatcherOutput } from './socraticQuestionMatcher';
import { collegeOverlayEnhancer } from './collegeOverlayEnhancer';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';

const SONNET_PRICING = {
  input: 3.0 / 1_000_000,
  output: 15.0 / 1_000_000,
};

// ============================================================================
// CONTEXT-AWARE PHRASE GUIDANCE (Principles Over Rigid Bans)
// ============================================================================
//
// PHILOSOPHY: These phrases are NOT automatically bad. The issue is whether
// they're EARNED through concrete evidence or PERFORMATIVE without substance.
//
// - "journey" describing literal immigration: ✓ EARNED
// - "journey" as generic growth metaphor: ✗ PERFORMATIVE
// - "I realized" followed by specific insight: ✓ EARNED
// - "I realized" followed by generic lesson: ✗ PERFORMATIVE
//
// The validation should FLAG these for review, not BAN them outright.

/**
 * AI-convergence terms that tend to appear in AI-generated or over-polished essays.
 * These aren't banned - they're flagged for intentionality review.
 * If the student OWNS this language (it's their natural voice), it's fine.
 */
const AI_CONVERGENCE_TERMS = [
  'tapestry', 'realm', 'unwavering', 'testament', 'delve',
  'showcase', 'underscore', 'myriad', 'plethora', 'toolbox',
  'unlocking potential', 'honing my skills', 'invaluable lessons'
];

/**
 * Filler words that weaken writing. Can be cut without loss of meaning.
 * Exception: If part of student's authentic voice/dialogue, may keep.
 */
const FILLER_TERMS = [
  'truly', 'really', 'honestly', 'basically', 'literally',
  'incredible', 'amazing', 'very', 'extremely'
];

/**
 * Superlative claims that need supporting evidence.
 * Not banned - just flag if unsupported by concrete detail.
 */
const CLAIMS_REQUIRING_EVIDENCE = [
  'life-changing', 'transformative experience', 'changed my perspective',
  'opened my eyes', 'forever changed', 'completely different person'
];

/**
 * Performative authenticity patterns - phrases that SIGNAL without DEMONSTRATING.
 *
 * KEY DISTINCTION:
 * - UNSUPPORTED: "I realized I needed to help others" (generic lesson)
 * - SUPPORTED: "I realized the error was in line 47, not my logic" (specific insight)
 *
 * These should be FLAGGED when they appear without concrete follow-through,
 * not BANNED unconditionally. Elite writers can use these phrases effectively.
 */
const PERFORMATIVE_PATTERNS_REQUIRING_EVIDENCE = {
  // Claims about self-motivation - need concrete ACTION showing this
  self_motivation: [
    'not for a class', 'not for school', 'on my own time', 'just because',
    'outside of class', 'in my free time', 'without being asked'
  ],

  // Excitement claims - need concrete BEHAVIOR/DETAIL showing this
  excitement: [
    'blew my mind', 'sparked my passion', 'ignited my interest',
    'awakened something in me', 'I was hooked', 'I fell in love with'
  ],

  // Realization claims - need SPECIFIC INSIGHT afterward, not generic lesson
  realization: [
    'I realized', 'I discovered', 'I learned that', 'it taught me',
    'taught me that', 'showed me that', 'made me understand',
    'I came to understand', 'I began to see', 'it dawned on me'
  ],

  // Vulnerability claims - need SPECIFIC MOMENT/DETAIL, not summary
  vulnerability: [
    'I\'m not afraid to admit', 'I\'ll be honest', 'the truth is',
    'I never told anyone', 'for the first time', 'I finally understood'
  ],

  // Meta-commentary - almost always weak, but CAN work if subverted/specific
  meta_authenticity: [
    'this is who I really am', 'my true self', 'the real me',
    'what makes me unique', 'unlike other students', 'what sets me apart'
  ]
};

// Legacy export for backward compatibility (flattened list for validation)
const BANNED_TERMS = [...AI_CONVERGENCE_TERMS, ...FILLER_TERMS];
const PERFORMATIVE_AUTHENTICITY_PATTERNS = [
  ...PERFORMATIVE_PATTERNS_REQUIRING_EVIDENCE.self_motivation,
  ...PERFORMATIVE_PATTERNS_REQUIRING_EVIDENCE.excitement,
  ...PERFORMATIVE_PATTERNS_REQUIRING_EVIDENCE.realization,
  ...PERFORMATIVE_PATTERNS_REQUIRING_EVIDENCE.vulnerability,
  ...PERFORMATIVE_PATTERNS_REQUIRING_EVIDENCE.meta_authenticity
];

// ============================================================================
// TYPES
// ============================================================================

/**
 * Word count constraints for the specific prompt
 */
export interface WordCountConstraints {
  min: number;
  max: number;
  current: number;
  delta: number; // positive = over, negative = under
  status: 'under' | 'within' | 'over' | 'severely_over';
}

/**
 * Type-specific suggestion constraints
 * Each essay type has different requirements for how suggestions should be formatted
 */
export interface TypeSpecificConstraints {
  max_suggestion_length: number;  // Max words for replacement text
  preserve_requirements: string[];  // What MUST be preserved
  avoid_patterns: string[];  // What to avoid in suggestions
  prioritize: string[];  // What to emphasize
  word_efficiency: 'ruthless' | 'moderate' | 'flexible';  // How aggressive with word cuts
}

/**
 * Type-specific constraint configurations for all 14 types
 */
export const TYPE_SUGGESTION_CONSTRAINTS: Record<SupplementalType, TypeSpecificConstraints> = {
  why_us: {
    max_suggestion_length: 80,
    preserve_requirements: ['specific program names', 'professor names', 'course numbers'],
    avoid_patterns: ['generic college praise', 'could swap name'],
    prioritize: ['research depth', 'mutual fit', 'unique resources'],
    word_efficiency: 'moderate'
  },
  why_major: {
    max_suggestion_length: 90,
    preserve_requirements: ['origin story details', 'field-specific concepts', 'intellectual curiosity'],
    avoid_patterns: ['career-only focus', 'generic passion statements'],
    prioritize: ['intellectual depth', 'field knowledge', 'specific questions'],
    word_efficiency: 'moderate'
  },
  community: {
    max_suggestion_length: 75,
    preserve_requirements: ['past community examples', 'specific orgs named'],
    avoid_patterns: ['vague promises', 'generic involvement'],
    prioritize: ['past predicts future', 'specific contributions', 'community research'],
    word_efficiency: 'moderate'
  },
  diversity: {
    max_suggestion_length: 120,
    preserve_requirements: ['authentic voice', 'specific experiences', 'growth evidence'],
    avoid_patterns: ['victim narrative', 'preachy tone', 'defensive language'],
    prioritize: ['vulnerability balance', 'perspective → contribution', 'resilience'],
    word_efficiency: 'flexible'
  },
  intellectual: {
    max_suggestion_length: 100,
    preserve_requirements: ['specific ideas/concepts', 'self-directed exploration', 'questions'],
    avoid_patterns: ['generic curiosity', 'surface-level engagement'],
    prioritize: ['intellectual depth', 'idea connections', 'thinking evolution'],
    word_efficiency: 'moderate'
  },
  extracurricular: {
    max_suggestion_length: 120,
    preserve_requirements: ['specific activity details', 'impact numbers', 'growth arc'],
    avoid_patterns: ['resume list', 'surface-level many'],
    prioritize: ['depth over breadth', 'character revelation', 'sustained commitment'],
    word_efficiency: 'flexible'
  },
  challenge: {
    max_suggestion_length: 150,
    preserve_requirements: ['response actions', 'growth evidence', 'sensory details'],
    avoid_patterns: ['trauma dump', 'victim language', 'instant resolution'],
    prioritize: ['20/80 rule', 'agency', 'multiple attempts', 'before/after'],
    word_efficiency: 'flexible'
  },
  leadership: {
    max_suggestion_length: 100,
    preserve_requirements: ['specific impact', 'team context', 'vulnerability'],
    avoid_patterns: ['title focus', 'bragging', 'authoritarian style'],
    prioritize: ['actions over titles', 'collaborative approach', 'growth as leader'],
    word_efficiency: 'moderate'
  },
  creative: {
    max_suggestion_length: 90,
    preserve_requirements: ['creative process details', 'unique perspective', 'personality'],
    avoid_patterns: ['generic creativity claims', 'product-only focus'],
    prioritize: ['process over product', 'identity connection', 'authenticity'],
    word_efficiency: 'moderate'
  },
  values: {
    max_suggestion_length: 100,
    preserve_requirements: ['values in action', 'origin story', 'consistency evidence'],
    avoid_patterns: ['stated values without stories', 'preachy statements'],
    prioritize: ['show don\'t tell', 'nuance', 'self-awareness'],
    word_efficiency: 'moderate'
  },
  future_goals: {
    max_suggestion_length: 75,
    preserve_requirements: ['specific goals', 'past-future connection', 'impact on others'],
    avoid_patterns: ['generic ambitions', 'career-only'],
    prioritize: ['clarity', 'achievability', 'values alignment'],
    word_efficiency: 'moderate'
  },
  additional_info: {
    max_suggestion_length: 150,
    preserve_requirements: ['new information', 'context', 'ownership'],
    avoid_patterns: ['excuses', 'redundant content', 'over-explanation'],
    prioritize: ['strategic value', 'conciseness', 'no-excuse context'],
    word_efficiency: 'moderate'
  },
  short_answer: {
    max_suggestion_length: 40,
    preserve_requirements: ['specificity', 'personality', 'every word earns place'],
    avoid_patterns: ['filler words', 'generic statements', 'throat clearing'],
    prioritize: ['punch', 'memorability', 'ruthless concision'],
    word_efficiency: 'ruthless'
  },
  optional: {
    max_suggestion_length: 120,
    preserve_requirements: ['new dimension', 'strategic purpose', 'quality bar'],
    avoid_patterns: ['repeated themes', 'low-value content'],
    prioritize: ['gap filling', 'reader\'s time worth', 'complementary content'],
    word_efficiency: 'moderate'
  }
};

/**
 * Issue context for suggestion generation
 */
export interface IssueContext {
  issue_id: string;
  quote: string;
  location: string;
  diagnosis: {
    problem: string;
    symptom_type: string;
    affected_dimensions: SupplementalDimension[];
    score_impact: number;
  };
  surrounding_context: string;
  relevant_college_values: CollegeCoreValue[];
  relevant_quotes: CollegeKeyQuote[];
}

/**
 * Polished Original suggestion
 */
export interface PolishedOriginalSuggestion {
  type: 'polished_original';
  text: string;
  rationale: string;
  what_changed: string[];
  voice_preservation: string;
  excellence_alignment: string; // How it aligns with type-specific excellence
  college_alignment: string; // How it aligns with college values
  score_impact: {
    dimension: SupplementalDimension;
    before: number;
    after: number;
    increase: number;
  };
  evidence_used: {
    quote: string;
    source: string;
  };
  when_to_use: string;
  safety_level: 'very_safe' | 'safe' | 'moderate_risk';
  validation_warnings?: string[]; // Voice/banned term validation warnings
  overlay_warnings?: string[]; // College-specific red/green flag warnings
}

/**
 * Voice Amplifier suggestion
 */
export interface VoiceAmplifierSuggestion {
  type: 'voice_amplifier';
  text: string;
  rationale: string;
  what_changed: string[];
  voice_preservation: string;
  excellence_alignment: string;
  college_alignment: string;
  score_impact: {
    dimension: SupplementalDimension;
    before: number;
    after: number;
    increase: number;
  };
  evidence_used: {
    quote: string;
    source: string;
  };
  when_to_use: string;
  risk_level: 'low' | 'medium' | 'high';
  why_authentic: string;
  spark_moments: string[];
  validation_warnings?: string[]; // Voice/banned term validation warnings
  overlay_warnings?: string[]; // College-specific red/green flag warnings
}

/**
 * Teaching layer for understanding the suggestion
 */
export interface SuggestionTeaching {
  type_specific_principle: string; // Why this matters for THIS type
  college_specific_context: string; // Why this college cares
  excellence_requirement_addressed: string; // Which excellence requirement this helps
  how_to_choose: {
    polished_when: string;
    voice_when: string;
    can_combine: string;
  };
  socratic_prompts: string[];
}

/**
 * Complete suggestion for a single issue
 */
export interface IssueSuggestion {
  issue_id: string;
  issue_quote: string;
  diagnosis_summary: string;
  suggestions: {
    polished_original: PolishedOriginalSuggestion;
    voice_amplifier: VoiceAmplifierSuggestion;
  };
  teaching: SuggestionTeaching;
}

/**
 * Complete batch output
 */
export interface TypeSpecificSuggestionOutput {
  essay_type: SupplementalType;
  type_name: string;
  college_name: string | null;

  issues: IssueSuggestion[];

  overall_strategy: {
    cohesive_approach: string;
    voice_consistency: string;
    priority_order: string;
    implementation_tips: string[];
  };

  // College overlay analysis (institutional knowledge layer)
  overlay_analysis: {
    red_flags_detected: number;
    green_flags_detected: number;
    rubric_band: string | null;
    target_band: string | null;
    socratic_questions_available: number;
  };

  // NEW: Score breakdown (PIQ-style dimensional explanation)
  score_breakdown?: {
    total_score: number;
    quality_tier: string;

    // Why this score (core insights from Stage 1)
    why_this_score: {
      core_strength: string;      // What makes essay work
      core_weakness: string;       // What holds it back
      reader_experience: string;   // How reader feels
    };

    // Dimensional scores with evidence
    dimensional_scores: Array<{
      dimension: string;
      score: number;              // 1-10
      target: number;             // 8 for excellence
      gap: number;                // How much improvement needed
      strength_level: 'STRONG' | 'ADEQUATE' | 'WEAK';
      whats_working: string[];    // Preserve these
      whats_missing: string[];    // Fix these
      how_to_improve: string;     // Specific guidance
    }>;

    // Improvement roadmap
    improvement_potential: {
      current_score: number;
      projected_score: number;         // After fixes
      dimensions_to_prioritize: string[];  // Biggest gaps
      quick_wins: string[];            // Easy improvements
    };
  };

  cost: number;
  tokens_used: {
    input: number;
    output: number;
  };
}

// ============================================================================
// SOCRATIC DEPTH TYPES
// ============================================================================

/**
 * A single depth probe - a question designed to extract unique insight
 */
export interface DepthProbe {
  probe_type: 'limitation' | 'contradiction' | 'application' | 'synthesis' | 'personal_stake';
  question: string;
  why_this_matters: string;
  what_genuine_answer_looks_like: string;
  red_flags_in_answer: string[]; // Signs the student is still being performative
  example_weak_answer: string;
  example_strong_answer: string;
}

/**
 * Socratic depth output for a single issue
 * Instead of giving polished prose, gives questions that extract authentic insight
 */
export interface SocraticDepthOutput {
  issue_id: string;
  issue_quote: string;
  diagnosis: {
    what_is_missing: string;
    why_current_version_feels_performative: string;
    what_genuine_depth_would_look_like: string;
  };
  depth_probes: DepthProbe[];
  synthesis_guidance: {
    how_to_combine_answers: string;
    what_to_avoid: string[];
    signs_you_have_genuine_insight: string[];
  };
}

/**
 * Complete Socratic depth batch output
 */
export interface SocraticDepthBatchOutput {
  essay_type: SupplementalType;
  type_name: string;
  college_name: string | null;

  issues: SocraticDepthOutput[];

  meta_guidance: {
    overall_depth_gap: string;
    common_thread: string;
    how_issues_connect: string;
  };

  cost: number;
  tokens_used: {
    input: number;
    output: number;
  };
}

// ============================================================================
// SUGGESTION PROMPT
// ============================================================================

const TYPE_SPECIFIC_SUGGESTION_PROMPT = `You are generating PIQ-quality surgical suggestions for a supplemental essay.

CRITICAL REQUIREMENTS:
1. All suggestions must align with TYPE-SPECIFIC excellence requirements
2. All suggestions must demonstrate COLLEGE-SPECIFIC values (if provided)
3. All suggestions must PRESERVE the student's authentic voice
4. NO BANNED TERMS: {bannedTerms}
5. Generate 2 DISTINCT suggestions per issue:
   - POLISHED ORIGINAL: Safe, incremental improvement
   - VOICE AMPLIFIER: Authentic, risky alternative that amplifies personality
6. WORD COUNT CONSTRAINTS: {wordCountGuidance}
7. SUGGESTION LENGTH: Max {maxSuggestionLength} words per replacement

═══════════════════════════════════════════════════════════
⛔ PERFORMATIVE AUTHENTICITY - ABSOLUTE BAN ⛔
═══════════════════════════════════════════════════════════

NEVER use these phrases - they SIGNAL passion without DEMONSTRATING it:

BANNED (claiming "I did it for fun"):
✗ "not for a class" → ✓ just describe the action without qualifying
✗ "on my own time" → ✓ show what you did, not when
✗ "just because" → ✓ let the action speak for itself

BANNED (claiming excitement):
✗ "blew my mind" → ✓ describe the specific insight
✗ "I was hooked" → ✓ show what you did next
✗ "sparked my passion" → ✓ show the work, not the feeling

BANNED (claiming realization):
✗ "I realized" → ✓ state the insight directly
✗ "I discovered" → ✓ state what you found
✗ "it taught me" / "taught me that" → ✓ show the knowledge in action
✗ "showed me" / "showed me that" → ✓ demonstrate the insight through action
✗ "made me understand" → ✓ state the understanding directly

The pattern: Don't TELL readers you're passionate. SHOW the specific work, insight, or action that only a passionate person would do.

EXAMPLE TRANSFORMATIONS:
✗ "My grandmother's struggles taught me that AI needs to be more accessible"
✓ "My grandmother gave up on her smartphone after a week. The buttons were too small, the menus too deep. Her AI assistant couldn't understand her accent."

✗ "I discovered Dr. Li's research on ImageNet"
✓ "Dr. Li's ImageNet paper changed how I debugged my grandmother's navigation app"

═══════════════════════════════════════════════════════════
WRITING QUALITY REQUIREMENTS
═══════════════════════════════════════════════════════════

Every suggestion must be MEMORABLE, not just correct:

1. CONCRETE beats ABSTRACT
   ✗ "accuracy dropped to 23%" → ✓ "couldn't tell her walker from a dining chair"

2. PERSON beats CONCEPT
   ✗ "accessibility applications" → ✓ "people like my grandmother"

3. IMPLY emotion through ACTION
   ✗ "I was devastated" → ✓ "I sat in my car for twenty minutes"

4. SHORTER beats LONGER - same length or shorter than original

5. ONE unforgettable image per suggestion

═══════════════════════════════════════════════════════════
⚠️ ELITE WRITING CRAFT - PRINCIPLES, NOT PATTERNS ⚠️
═══════════════════════════════════════════════════════════

Great writing breaks rules intentionally. These are PRINCIPLES to guide thinking, NOT rigid patterns to enforce.

THE CORE PRINCIPLE: INTENTIONALITY
Every craft choice should feel DELIBERATE, not DEFAULT. A great essay could:
- Start chronologically OR in medias res - if the choice serves the story
- Use formal diction OR slang - if it matches the authentic voice
- Follow a clear arc OR fragment into moments - if the structure amplifies meaning
- Use common words OR rare ones - if they're the RIGHT words

What matters: Does the reader feel the writer CHOSE this, or fell into it?

═══════════════════════════════════════════════════════════
WHAT DISTINGUISHES ELITE WRITING (High-Level Markers)
═══════════════════════════════════════════════════════════

1. VOICE SIGNATURE
   The writing sounds like ONE specific person, not "good writing."
   - Consistent idiosyncrasies (sentence rhythm, word preferences, humor style)
   - The student's actual vocabulary, not upgraded thesaurus words
   - Personality bleeding through even in "serious" moments

2. EARNED SPECIFICITY
   Details feel DISCOVERED, not manufactured for effect.
   - References that reveal genuine knowledge (not Wikipedia-level)
   - Technical language used naturally (not defined for the reader)
   - Connections that surprise but make sense upon reflection

3. STRUCTURAL CONFIDENCE
   The organization feels inevitable for THIS story.
   - No formula visible - the structure serves the content
   - Pacing that breathes (knows when to linger, when to jump)
   - An ending that lands because it was earned, not because it wraps up

4. TONAL INTELLIGENCE
   The emotional register is controlled and intentional.
   - Knows when understatement hits harder than drama
   - Mixes registers deliberately (casual insight, formal humor)
   - Lets moments breathe without explaining their significance

5. THE MEMORABLE ELEMENT
   After 500 essays, an admissions officer remembers THIS one because of:
   - An image too specific to be generic
   - A phrase that captures something precisely
   - A connection that reframes familiar territory
   - A moment of genuine surprise or recognition

═══════════════════════════════════════════════════════════
AVOID THE "AI SOUND" (But Don't Over-Correct)
═══════════════════════════════════════════════════════════

AI writing tends to CONVERGE on:
- Safe, balanced, comprehensive coverage
- Polished surfaces without rough edges
- Growth narratives with neat resolutions
- Vocabulary that sounds "writerly" rather than personal

The FIX is NOT to ban words or force quirks. It's to ensure:
- The suggestion sounds like THIS student could have written it
- There are specific details/references that couldn't be generated without context
- The voice has texture and personality, not just correctness
- Something feels slightly unexpected or unpolished in a human way

IMPORTANT: A formally written, grammatically perfect essay can still feel authentic
if the formality IS the student's actual voice. Don't force casualness.
Similarly, clichés used IRONICALLY or SUBVERTED can be powerful. Context matters.

═══════════════════════════════════════════════════════════
ESSAY CONTEXT
═══════════════════════════════════════════════════════════

ESSAY TYPE: {essayType}
TYPE NAME: {typeName}

WORD COUNT STATUS:
- Current: {currentWordCount} words
- Limit: {wordMin}-{wordMax} words
- Status: {wordCountStatus}
{wordCountAction}

TYPE-SPECIFIC CONSTRAINTS FOR SUGGESTIONS:
- PRESERVE these elements: {preserveRequirements}
- AVOID these patterns: {avoidPatterns}
- PRIORITIZE these qualities: {prioritizeQualities}
- Word efficiency level: {wordEfficiency}

CRITICAL DIMENSIONS FOR THIS TYPE:
{criticalDimensions}

EXCELLENCE REQUIREMENTS FOR THIS TYPE:
{excellenceRequirements}

TOP 3 DIMENSIONS BY WEIGHT:
{topDimensions}

{scoreReasoningSection}

{dimensionalSection}

{rubricGuidanceSection}

═══════════════════════════════════════════════════════════
COLLEGE CONTEXT
═══════════════════════════════════════════════════════════

{collegeContext}

{redFlagSection}

{greenFlagSection}

═══════════════════════════════════════════════════════════
CLICHÉ ANALYSIS (CRITICAL - AVOID THESE IN SUGGESTIONS)
═══════════════════════════════════════════════════════════

{clicheAnalysis}

{holisticSection}

{wordCountSection}

{socraticSection}

═══════════════════════════════════════════════════════════
VOICE FINGERPRINT (MUST PRESERVE)
═══════════════════════════════════════════════════════════

{voiceFingerprint}

═══════════════════════════════════════════════════════════
FULL ESSAY DRAFT
═══════════════════════════════════════════════════════════

{essayDraft}

═══════════════════════════════════════════════════════════
ISSUES TO ADDRESS (generate 2 suggestions each)
═══════════════════════════════════════════════════════════

{issuesFormatted}

═══════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════

For EACH issue, provide:

### POLISHED ORIGINAL
- text: Refined version (exact replacement text)
- rationale: Why this works (cite type requirements AND college values)
- what_changed: List of specific improvements
- voice_preservation: How we kept authenticity
- excellence_alignment: Which type-specific excellence requirement this addresses
- college_alignment: Which college value this demonstrates
- score_impact: { dimension, before, after, increase }
- evidence_used: { quote, source }
- when_to_use: Student guidance
- safety_level: very_safe | safe | moderate_risk

### VOICE AMPLIFIER
- text: Authentic alternative (exact replacement text)
- rationale: Why this feels more genuine
- what_changed: List of specific improvements
- voice_preservation: How we amplified authenticity
- excellence_alignment: Which type-specific excellence requirement this addresses
- college_alignment: Which college value this demonstrates
- score_impact: { dimension, before, after, increase }
- evidence_used: { quote, source }
- when_to_use: Student guidance
- risk_level: low | medium | high
- why_authentic: What makes this real
- spark_moments: Phrases where personality shines

### CRAFT INTENTIONALITY (both suggestions)
- why_this_approach: Why this craft choice serves THIS student's story (not default/safe)
- voice_authenticity: How the writing sounds like THIS specific person
- what_reader_remembers: The element that will stick after 500 essays
- earned_specificity: Details/references that feel discovered, not manufactured
- stylistic_risk_taken: Where we deviated from "safe" writing and why it works

### TEACHING
- type_specific_principle: Why this matters for THIS essay type
- college_specific_context: Why THIS college cares about this
- excellence_requirement_addressed: Which requirement this helps meet
- how_to_choose: { polished_when, voice_when, can_combine }
- socratic_prompts: 2-3 questions to deepen thinking
- craft_lesson: What elite writing principle is demonstrated here

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════

{
  "issues": [
    {
      "issue_id": "...",
      "issue_quote": "...",
      "diagnosis_summary": "...",
      "suggestions": {
        "polished_original": { ... },
        "voice_amplifier": { ... }
      },
      "teaching": { ... }
    }
  ],
  "overall_strategy": {
    "cohesive_approach": "How all suggestions work together",
    "voice_consistency": "How we maintained unified voice",
    "priority_order": "Which issue to tackle first and why",
    "implementation_tips": ["tip 1", "tip 2", "tip 3"],
    "craft_intentionality": {
      "voice_through_line": "What makes all suggestions sound like the SAME specific person",
      "structural_logic": "Why these structures serve this story (not formula-following)",
      "what_makes_it_memorable": "The element(s) that distinguish this from 500 similar essays",
      "risks_taken": "Where we chose interesting over safe, and why it works"
    }
  }
}`;

// ============================================================================
// SOCRATIC DEPTH PROMPT
// ============================================================================

const SOCRATIC_DEPTH_PROMPT = `You are an expert college admissions counselor who specializes in extracting GENUINE insight from students.

Your job is NOT to write polished prose for the student. Instead, you generate PROBING QUESTIONS that help students discover their own unique, authentic insight.

═══════════════════════════════════════════════════════════
THE PROBLEM WITH MOST ESSAY ADVICE
═══════════════════════════════════════════════════════════

Most essay suggestions produce "performative authenticity" - writing that SIGNALS passion without DEMONSTRATING it.

Examples of PERFORMATIVE authenticity (BAD):
- "Not for a class—just because her methodology blew my mind"
- "I spent three hours reading..." (claiming dedication)
- "I couldn't stop thinking about..." (claiming obsession)
- "It opened my eyes to..." (claiming enlightenment)

These phrases TELL readers the student is passionate. They don't SHOW unique insight that could only come from genuine engagement.

Examples of GENUINE authenticity (GOOD):
- Identifying a LIMITATION in the research they admire
- Finding a CONTRADICTION between two ideas they've explored
- Describing their OWN FAILED ATTEMPT to solve a problem
- Articulating a QUESTION they're still wrestling with
- Showing how their SPECIFIC BACKGROUND gives them a unique angle

The difference: genuine authenticity reveals HOW the student THINKS, not just what they claim to feel.

═══════════════════════════════════════════════════════════
CRITICAL: MEMORABLE vs. MERELY ACCURATE
═══════════════════════════════════════════════════════════

Strong answers must be MEMORABLE, not just technically correct.

BAD (accurate but forgettable):
"ImageNet's training data skewed toward objects in well-lit, uncluttered environments. When I tested existing models in my grandmother's dimly-lit hallway with family photos and furniture, accuracy dropped to 23%."

GOOD (memorable and efficient):
"The model couldn't tell my grandmother's walker from a dining chair. After three weeks of failed fixes, I understood why Dr. Li's 'democratized' AI hadn't reached people like her."

The difference:
1. CONCRETE IMAGE (walker vs. chair) beats abstract category (accuracy percentage)
2. TIME IMPLIES STRUGGLE (three weeks) without claiming passion
3. EMOTIONAL ANCHOR (people like her) beats technical jargon (deployment gap)
4. HALF THE WORDS - efficiency matters

RULES FOR EXAMPLE ANSWERS:
- Strong answers must be ≤30 words (same length or shorter than weak)
- Use ONE specific image that sticks in the reader's mind
- Connect to a person, not a concept
- Let the detail imply the emotion - don't state it

═══════════════════════════════════════════════════════════
ELITE WRITING IN EXAMPLE ANSWERS
═══════════════════════════════════════════════════════════

Example answers should feel like REAL student writing, not AI-polished prose.

THE GOAL: Examples should sound like they came from a specific human being.
This doesn't mean they must be informal or quirky - it means they feel INHABITED.

What makes writing feel HUMAN (principles, not rules):
- SPECIFICITY that feels discovered, not manufactured
- VOICE that has texture and personality
- RHYTHM that varies naturally (not mechanically)
- DETAILS that couldn't exist without lived experience

A strong example could be:
- Formally written if that's the student's natural register
- Use common vocabulary if that's authentic
- Follow a clear structure if it serves the content
- Even use a "cliché" phrase if it's subverted or earned

The test: Could THIS student plausibly have written this? Does it feel CHOSEN?

═══════════════════════════════════════════════════════════
PERFORMATIVE PATTERNS TO AVOID
═══════════════════════════════════════════════════════════

NEVER suggest writing that includes these performative patterns:
{performativePatterns}

═══════════════════════════════════════════════════════════
DEPTH PROBE TYPES
═══════════════════════════════════════════════════════════

Generate questions of these types to extract genuine insight:

1. LIMITATION PROBE
   - What weakness or blind spot have you identified in the research/work you admire?
   - Where does the methodology fall short?
   - What can't this approach explain?

2. CONTRADICTION PROBE
   - What two ideas in this field seem to conflict?
   - Where do experts disagree, and why does it matter to you?
   - What's the tension you're trying to resolve?

3. APPLICATION PROBE
   - How have you tried to apply this idea yourself?
   - What happened when you tested this in your own context?
   - Where did you get stuck, and what did that teach you?

4. SYNTHESIS PROBE
   - What connection have you made that others haven't?
   - How does your background let you see this differently?
   - What would you add to the existing conversation?

5. PERSONAL STAKE PROBE
   - Why does this matter to YOU specifically, not just abstractly?
   - What would you lose if this problem stayed unsolved?
   - Who in your life is affected by this?

═══════════════════════════════════════════════════════════
ESSAY CONTEXT
═══════════════════════════════════════════════════════════

ESSAY TYPE: {essayType}
TYPE NAME: {typeName}

CRITICAL DIMENSIONS:
{criticalDimensions}

EXCELLENCE REQUIREMENTS:
{excellenceRequirements}

═══════════════════════════════════════════════════════════
COLLEGE CONTEXT
═══════════════════════════════════════════════════════════

{collegeContext}

═══════════════════════════════════════════════════════════
FULL ESSAY DRAFT
═══════════════════════════════════════════════════════════

{essayDraft}

═══════════════════════════════════════════════════════════
ISSUES TO PROBE
═══════════════════════════════════════════════════════════

{issuesFormatted}

═══════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════

For EACH issue, generate 3-4 depth probes that will help the student discover their genuine insight.

Each probe must include:
- probe_type: limitation | contradiction | application | synthesis | personal_stake
- question: The actual question to ask the student (concise, direct)
- why_this_matters: Why this question leads to genuine insight (1 sentence)
- what_genuine_answer_looks_like: Characteristics of an authentic response (1 sentence)
- red_flags_in_answer: Signs the student is still being performative (2-3 bullet points)
- example_weak_answer: Performative response (≤25 words)
- example_strong_answer: Memorable, efficient insight (≤30 words, uses concrete image, connects to person)

CRITICAL FOR EXAMPLE_STRONG_ANSWER:
- Must be ≤30 words - same or shorter than weak answer
- Must contain ONE concrete, visual detail (walker vs. chair, not "accuracy dropped")
- Must connect to a person or relationship (grandmother, neighbor, teammate)
- Must imply emotion through detail, never state it
- Must be something a reader would remember after 100 essays

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════

{
  "issues": [
    {
      "issue_id": "...",
      "issue_quote": "...",
      "diagnosis": {
        "what_is_missing": "What genuine insight is absent",
        "why_current_version_feels_performative": "Why it reads as fake passion",
        "what_genuine_depth_would_look_like": "What authentic engagement looks like"
      },
      "depth_probes": [
        {
          "probe_type": "limitation",
          "question": "...",
          "why_this_matters": "...",
          "what_genuine_answer_looks_like": "...",
          "red_flags_in_answer": ["...", "..."],
          "example_weak_answer": "...",
          "example_strong_answer": "..."
        }
      ],
      "synthesis_guidance": {
        "how_to_combine_answers": "How to weave probe answers into essay",
        "what_to_avoid": ["performative patterns to avoid"],
        "signs_you_have_genuine_insight": ["indicators of real depth"]
      }
    }
  ],
  "meta_guidance": {
    "overall_depth_gap": "What's fundamentally missing from the essay",
    "common_thread": "Theme connecting the issues",
    "how_issues_connect": "How addressing one helps the others"
  }
}`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format college context for prompt - COMPREHENSIVE VERSION
 *
 * Uses the CollegeOverlayService to provide:
 * - College personality (tone, formality, risk tolerance)
 * - Prompt-specific guidance
 * - Value demonstration requirements
 * - College-specific clichés to avoid
 * - Elite craft markers
 * - Citation opportunities
 */
function formatCollegeContext(
  college?: CollegeResearch,
  essayType?: SupplementalType,
  promptId?: string
): string {
  if (!college) {
    return 'No specific college provided. Generate universal quality suggestions.';
  }

  // Get comprehensive context from the overlay service
  const context = collegeOverlayService.getCollegeContextForPrompt(
    college,
    essayType || 'why_us',
    promptId
  );

  // Format the comprehensive context for prompt injection
  return collegeOverlayService.formatCollegeContextForPrompt(context);
}

/**
 * Format cliché analysis for prompt injection
 *
 * This injects the semantic cliché analysis into the suggestion prompt
 * so that generated suggestions actively avoid detected clichés.
 */
function formatClicheAnalysis(analysis: SemanticClicheAnalysis): string {
  const sections: string[] = [];

  // Overall risk assessment
  sections.push(`CLICHÉ RISK: ${analysis.overall_cliche_risk.toUpperCase()} (${analysis.cliche_risk_score}/100)`);

  // Topic-level assessment
  if (analysis.topic_assessment.topic) {
    sections.push(`\nTOPIC ASSESSMENT:`);
    sections.push(`  Topic: ${analysis.topic_assessment.topic}`);
    sections.push(`  Framing: ${analysis.topic_assessment.framing_assessment}`);
    if (analysis.topic_assessment.is_cliche_framing) {
      sections.push(`  ⚠️ CLICHÉ FRAMING DETECTED - suggestions must take a FRESH angle`);
      sections.push(`  Opportunity: ${analysis.topic_assessment.freshness_opportunity}`);
    }
    if (analysis.topic_assessment.unique_angle_detected) {
      sections.push(`  ✓ Unique angle to PRESERVE: ${analysis.topic_assessment.unique_angle_detected}`);
    }
  }

  // Narrative arc warning
  if (analysis.narrative_arc.predictability_score >= 6) {
    sections.push(`\nNARRATIVE ARC WARNING:`);
    sections.push(`  Detected arc: ${analysis.narrative_arc.detected_arc}`);
    sections.push(`  Predictability: ${analysis.narrative_arc.predictability_score}/10`);
    sections.push(`  SUGGESTIONS MUST: ${analysis.narrative_arc.suggested_subversion}`);
  }

  // Language clichés to avoid
  if (analysis.language_cliches.length > 0) {
    sections.push(`\nLANGUAGE CLICHÉS - DO NOT USE IN SUGGESTIONS:`);
    for (const c of analysis.language_cliches.slice(0, 8)) {
      sections.push(`  ✗ "${c.phrase}" [${c.type}]`);
      sections.push(`    Instead: ${c.alternative_approach}`);
    }
  }

  // Telling-not-showing violations
  if (analysis.telling_not_showing.length > 0) {
    sections.push(`\nTELLING-NOT-SHOWING - TRANSFORM IN SUGGESTIONS:`);
    for (const t of analysis.telling_not_showing.slice(0, 5)) {
      sections.push(`  ✗ "${t.phrase}"`);
      sections.push(`    Claiming: ${t.claimed_quality}`);
      sections.push(`    Show it: ${t.how_to_show_instead}`);
    }
  }

  // Elements to preserve
  if (analysis.strongest_unique_element) {
    sections.push(`\nMUST PRESERVE (strongest unique element):`);
    sections.push(`  ✓ ${analysis.strongest_unique_element}`);
  }

  if (analysis.elements_to_preserve.length > 0) {
    sections.push(`\nOTHER ELEMENTS TO PRESERVE:`);
    for (const e of analysis.elements_to_preserve.slice(0, 3)) {
      sections.push(`  ✓ ${e}`);
    }
  }

  // Coaching priority
  sections.push(`\nPRIORITY FOR SUGGESTIONS:`);
  sections.push(`  ${analysis.coaching_priority.issue}`);
  sections.push(`  Approach: ${analysis.coaching_priority.coaching_approach}`);

  return sections.join('\n');
}

/**
 * Format voice fingerprint for prompt
 */
function formatVoiceFingerprint(voice?: VoiceFingerprint): string {
  if (!voice) {
    return 'No voice fingerprint provided. Infer voice from essay.';
  }

  return `
DOMINANT REGISTER: ${voice.dominant_register}
VOICE QUALITIES: ${voice.voice_qualities?.join(', ') || 'Not specified'}
VOCABULARY LEVEL: ${voice.vocabulary_level || 'Not specified'}
AUTHENTIC PHRASES (MUST preserve in polished, amplify in voice):
${voice.authentic_phrases?.map(p => `- "${p}"`).join('\n') || '- No specific phrases identified'}
EMOTIONAL RANGE: ${voice.emotional_range || 'Not specified'}
SENTENCE RHYTHM: ${voice.sentence_rhythm || 'Not specified'}
`;
}

/**
 * Format issues for prompt
 */
function formatIssues(issues: IssueContext[]): string {
  return issues.map((issue, idx) => `
───────────────────────────────────────────────────────────
ISSUE ${idx + 1}: ${issue.diagnosis.problem}
───────────────────────────────────────────────────────────

ISSUE ID: ${issue.issue_id}
TARGET QUOTE: "${issue.quote}"
LOCATION: ${issue.location}

DIAGNOSIS:
- Problem: ${issue.diagnosis.problem}
- Symptom Type: ${issue.diagnosis.symptom_type}
- Affected Dimensions: ${issue.diagnosis.affected_dimensions.join(', ')}
- Score Impact: ${issue.diagnosis.score_impact}

SURROUNDING CONTEXT:
${issue.surrounding_context}

RELEVANT COLLEGE VALUES:
${issue.relevant_college_values.map(v => `- ${v.value_name}: ${v.what_demonstrates_it}`).join('\n') || '- None specified'}

RELEVANT QUOTES TO CITE:
${issue.relevant_quotes.map(q => `- "${q.quote}" (${q.source})`).join('\n') || '- None specified'}
`).join('\n\n');
}

/**
 * Basic suggestion shape for validation
 */
interface ValidatableSuggestion {
  text?: string;
  rationale?: string;
}

/**
 * Context-aware validation that distinguishes between:
 * - EARNED usage: phrase followed by concrete evidence/specifics
 * - PERFORMATIVE usage: phrase standing alone or followed by generic claims
 *
 * PHILOSOPHY: We don't ban phrases - we flag unsupported claims.
 */
function validateSuggestion(
  suggestion: ValidatableSuggestion | undefined | null,
  originalQuote: string,
  voice?: VoiceFingerprint
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (!suggestion || !suggestion.text || !suggestion.rationale) {
    return { valid: false, warnings: ['Missing text or rationale'] };
  }

  if (suggestion.text === originalQuote) {
    return { valid: false, warnings: ['Suggestion identical to original'] };
  }

  const text = suggestion.text;
  const lowerText = text.toLowerCase();

  // ═══════════════════════════════════════════════════════════════════════════
  // FILLER TERMS - These can almost always be cut without loss
  // But if they're in dialogue or match student's voice, allow them
  // ═══════════════════════════════════════════════════════════════════════════
  for (const term of FILLER_TERMS) {
    if (lowerText.includes(term.toLowerCase())) {
      // Check if it's in dialogue (between quotes)
      const inDialogue = /"[^"]*\b${term}\b[^"]*"/i.test(text);
      // Check if it matches student's authentic voice
      const inAuthenticVoice = voice?.authentic_phrases?.some(p =>
        p.toLowerCase().includes(term.toLowerCase())
      );

      if (!inDialogue && !inAuthenticVoice) {
        warnings.push(`Filler word "${term}" could be cut for stronger prose`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AI CONVERGENCE TERMS - Flag only if not earned through context
  // These are fine if: specific to student's field, used technically, or ironic
  // ═══════════════════════════════════════════════════════════════════════════
  for (const term of AI_CONVERGENCE_TERMS) {
    if (lowerText.includes(term.toLowerCase())) {
      // Check if it's followed by specifics (numbers, names, technical details)
      const hasSpecifics = /\d+|Dr\.|Prof\.|[A-Z][a-z]+\s+[A-Z]/i.test(text);
      // Check if it's student's authentic vocabulary
      const isAuthentic = voice?.vocabulary_register === 'formal' ||
        voice?.authentic_phrases?.some(p => p.toLowerCase().includes(term.toLowerCase()));

      if (!hasSpecifics && !isAuthentic) {
        warnings.push(`"${term}" may sound AI-generated - ensure it's earned through specifics`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFORMATIVE PATTERNS - Only flag if UNSUPPORTED by evidence
  // "I realized X" is fine if X is specific. It's weak if X is generic.
  // ═══════════════════════════════════════════════════════════════════════════
  const realizationPatterns = PERFORMATIVE_PATTERNS_REQUIRING_EVIDENCE.realization;
  for (const pattern of realizationPatterns) {
    const patternLower = pattern.toLowerCase();
    const index = lowerText.indexOf(patternLower);
    if (index !== -1) {
      // Get what comes AFTER the pattern (next 100 chars)
      const afterPattern = text.slice(index + pattern.length, index + pattern.length + 100);

      // Check if followed by SPECIFIC evidence (numbers, names, technical terms, quotes)
      const hasSpecificEvidence =
        /\d+/.test(afterPattern) ||  // Numbers
        /[A-Z][a-z]+/.test(afterPattern) ||  // Proper nouns
        /"[^"]+"/i.test(afterPattern) ||  // Quotes
        /\b(because|when|after|the)\s+\w+\s+\w+\s+\w+/.test(afterPattern);  // Concrete clause

      // Check if followed by GENERIC claims
      const hasGenericFollow = /\b(important|valuable|meaningful|life|growth|better|stronger|person)\b/i.test(afterPattern);

      if (!hasSpecificEvidence && hasGenericFollow) {
        warnings.push(`"${pattern}" needs concrete follow-through, not generic insight`);
      }
    }
  }

  // Check excitement patterns with same logic
  for (const pattern of PERFORMATIVE_PATTERNS_REQUIRING_EVIDENCE.excitement) {
    if (lowerText.includes(pattern.toLowerCase())) {
      // Excitement claims need to be followed by ACTION, not more claims
      const index = lowerText.indexOf(pattern.toLowerCase());
      const afterPattern = text.slice(index + pattern.length, index + pattern.length + 80);

      const hasAction = /\b(built|created|spent|stayed|worked|wrote|read|coded|made|started)\b/i.test(afterPattern);

      if (!hasAction) {
        warnings.push(`"${pattern}" should show resulting ACTION, not just claim excitement`);
      }
    }
  }

  // Meta-authenticity patterns are almost always weak
  for (const pattern of PERFORMATIVE_PATTERNS_REQUIRING_EVIDENCE.meta_authenticity) {
    if (lowerText.includes(pattern.toLowerCase())) {
      warnings.push(`"${pattern}" is meta-commentary - show authenticity through specifics instead`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VOICE PRESERVATION - Don't over-edit authentic elements
  // ═══════════════════════════════════════════════════════════════════════════
  if (suggestion.type === 'polished_original' && voice?.authentic_phrases) {
    const preserved = voice.authentic_phrases.filter(p =>
      suggestion.text.toLowerCase().includes(p.toLowerCase())
    );
    if (preserved.length < voice.authentic_phrases.length * 0.4) {
      warnings.push('May over-edit authentic voice');
    }
  }

  // Warnings don't make suggestion invalid - they inform the student
  return { valid: true, warnings };
}

/**
 * Calculate cost from token usage
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  return inputTokens * SONNET_PRICING.input + outputTokens * SONNET_PRICING.output;
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class TypeSpecificSuggestionService {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = apiKey ? new Anthropic({ apiKey }) : getAnthropicClient();
  }

  /**
   * Generate type-specific suggestions for multiple issues (batch mode)
   *
   * This is the main entry point for PIQ-quality suggestion generation.
   * It uses a single API call for all issues (cost efficient + coherent strategy).
   */
  async generateSuggestions(
    essayDraft: string,
    essayType: SupplementalType,
    issues: IssueContext[],
    options: {
      college?: CollegeResearch;
      promptId?: string; // College-specific prompt identifier (e.g., "stanford_intellectual_vitality")
      voice?: VoiceFingerprint;
      wordLimits?: { min: number; max: number };  // College-specific word limits override
      essayContext?: EssayContextPackage;  // NEW: Essay context from Stage 1 (motifs, dimensions, score reasoning)
    } = {}
  ): Promise<TypeSpecificSuggestionOutput> {
    const { college, promptId, voice, wordLimits, essayContext } = options;

    if (issues.length === 0 || issues.length > 5) {
      throw new Error('Batch suggestion supports 1-5 issues (optimal: 3)');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ARCHITECTURAL FIX: TWO-STAGE GENERATION (Universal → College Enhancement)
    // ═══════════════════════════════════════════════════════════════════════════
    //
    // PROBLEM (Before): When college provided, all college context was injected into
    //                   the generation prompt, causing Claude to REGENERATE suggestions
    //                   rather than build on universal quality.
    //
    // SOLUTION (Now):
    //   Stage 2A: Generate universal suggestions (NO college context in prompt)
    //   Stage 2B: Enhance with college overlay (PRESERVE text, ADD annotations)
    //
    // QUALITY GUARANTEE: 100% preservation of Stage 2A suggestion text
    //
    // ═══════════════════════════════════════════════════════════════════════════

    if (college) {
      console.log(`[TypeSpecificSuggestionService] Two-stage generation for ${college.collegeName}`);
      console.log(`[TypeSpecificSuggestionService] Stage 2A: Generating universal suggestions...`);

      // STAGE 2A: Generate universal suggestions (no college context)
      const universalOutput = await this.generateSuggestions(
        essayDraft,
        essayType,
        issues,
        {
          // NO college, NO promptId - pure universal suggestions
          voice,
          wordLimits,
          essayContext,
        }
      );

      console.log(`[TypeSpecificSuggestionService] Stage 2B: Enhancing with ${college.collegeName} overlay...`);

      // Log what we're enhancing
      console.log(`[TypeSpecificSuggestionService] Universal suggestion to preserve:`);
      console.log(`  Polished: "${universalOutput.issues[0]?.suggestions?.polished_original?.text?.substring(0, 80)}..."`);
      console.log(`  Voice: "${universalOutput.issues[0]?.suggestions?.voice_amplifier?.text?.substring(0, 80)}..."`);

      // STAGE 2B: Enhance each suggestion with college-specific context
      const enhancedIssues = await Promise.all(
        universalOutput.issues.map(async (issue) => {
          // Extract weak dimensions from diagnosis
          const weakDimensions = issue.diagnosis_summary
            ? [issue.diagnosis_summary] // Use diagnosis as proxy
            : [];

          // Enhance polished suggestion
          let enhancedPolished = issue.suggestions.polished_original;
          if (enhancedPolished) {
            try {
              const enhancement = await collegeOverlayEnhancer.enhance({
                universal_suggestion: enhancedPolished,
                college,
                promptId,
                issue_diagnosis: issue.diagnosis_summary,
                weak_dimensions: weakDimensions,
              });

              // Validate preservation
              const validation = collegeOverlayEnhancer.validatePreservation(
                enhancedPolished,
                enhancement,
                college
              );

              if (!validation.preserved) {
                console.error(
                  `[TypeSpecificSuggestionService] ⛔ PRESERVATION FAILURE for issue ${issue.issue_id}:`,
                  validation.issues
                );
                console.error(`  Original text: "${enhancedPolished.text.substring(0, 80)}..."`);
                console.error(`  Enhanced text: "${enhancement.text.substring(0, 80)}..."`);
                // Don't use broken enhancement - return universal
              } else {
                console.log(`[TypeSpecificSuggestionService] ✅ Enhancement preserved text for ${issue.issue_id}`);
                console.log(`  Text: "${enhancement.text.substring(0, 80)}..."`);
                // Merge enhancement into suggestion
                enhancedPolished = {
                  ...enhancedPolished,
                  text: enhancement.text, // Should be identical (validated)
                  rationale: enhancement.rationale, // Enhanced with college context
                  overlay_warnings: enhancement.overlay_warnings,
                  // Add new fields for college-specific data
                  green_flag_highlights: enhancement.green_flag_highlights,
                  rubric_band_note: enhancement.rubric_band_note,
                  socratic_questions: enhancement.socratic_questions,
                } as any; // TypeScript will complain about new fields - that's OK
              }
            } catch (error) {
              console.error(
                `[TypeSpecificSuggestionService] Enhancement failed for issue ${issue.issue_id}:`,
                error
              );
              // Graceful degradation - use universal suggestion
            }
          }

          // Enhance voice amplifier
          let enhancedVoice = issue.suggestions.voice_amplifier;
          if (enhancedVoice) {
            try {
              const enhancement = await collegeOverlayEnhancer.enhance({
                universal_suggestion: enhancedVoice,
                college,
                promptId,
                issue_diagnosis: issue.diagnosis_summary,
                weak_dimensions: weakDimensions,
              });

              const validation = collegeOverlayEnhancer.validatePreservation(
                enhancedVoice,
                enhancement,
                college
              );

              if (!validation.preserved) {
                console.error(
                  `[TypeSpecificSuggestionService] ⛔ PRESERVATION FAILURE for voice amplifier ${issue.issue_id}:`,
                  validation.issues
                );
              } else {
                enhancedVoice = {
                  ...enhancedVoice,
                  text: enhancement.text,
                  rationale: enhancement.rationale,
                  overlay_warnings: enhancement.overlay_warnings,
                  green_flag_highlights: enhancement.green_flag_highlights,
                  rubric_band_note: enhancement.rubric_band_note,
                  socratic_questions: enhancement.socratic_questions,
                } as any;
              }
            } catch (error) {
              console.error(
                `[TypeSpecificSuggestionService] Enhancement failed for voice amplifier ${issue.issue_id}:`,
                error
              );
            }
          }

          return {
            ...issue,
            suggestions: {
              polished_original: enhancedPolished,
              voice_amplifier: enhancedVoice,
            },
          };
        })
      );

      // Calculate overlay metadata
      const totalRedFlags = enhancedIssues.reduce((sum, issue) => {
        return sum +
          (issue.suggestions.polished_original?.overlay_warnings?.length || 0) +
          (issue.suggestions.voice_amplifier?.overlay_warnings?.length || 0);
      }, 0);

      const totalGreenFlags = enhancedIssues.reduce((sum, issue) => {
        return sum +
          ((issue.suggestions.polished_original as any)?.green_flag_highlights?.length || 0) +
          ((issue.suggestions.voice_amplifier as any)?.green_flag_highlights?.length || 0);
      }, 0);

      const totalSocraticQuestions = enhancedIssues.reduce((sum, issue) => {
        return sum +
          ((issue.suggestions.polished_original as any)?.socratic_questions?.length || 0) +
          ((issue.suggestions.voice_amplifier as any)?.socratic_questions?.length || 0);
      }, 0);

      console.log(`[TypeSpecificSuggestionService] Enhancement complete:`);
      console.log(`  - Red flags detected: ${totalRedFlags}`);
      console.log(`  - Green flags highlighted: ${totalGreenFlags}`);
      console.log(`  - Socratic questions matched: ${totalSocraticQuestions}`);

      // Extract rubric band from first enhancement with rubric_band_note
      let rubricBand: string | null = null;
      let targetBand: string | null = null;

      for (const issue of enhancedIssues) {
        const polishedNote = (issue.suggestions.polished_original as any)?.rubric_band_note;
        if (polishedNote && typeof polishedNote === 'string') {
          // Parse "Current: Good | Target: Excellent\n..." format
          const currentMatch = polishedNote.match(/Current:\s*([^|]+)/);
          const targetMatch = polishedNote.match(/Target:\s*([^\n]+)/);
          if (currentMatch) {
            rubricBand = currentMatch[1].trim();
          }
          if (targetMatch) {
            targetBand = targetMatch[1].trim();
          }
          break; // Only need first one
        }
        // Also check voice amplifier
        const voiceNote = (issue.suggestions.voice_amplifier as any)?.rubric_band_note;
        if (voiceNote && typeof voiceNote === 'string') {
          const currentMatch = voiceNote.match(/Current:\s*([^|]+)/);
          const targetMatch = voiceNote.match(/Target:\s*([^\n]+)/);
          if (currentMatch) {
            rubricBand = currentMatch[1].trim();
          }
          if (targetMatch) {
            targetBand = targetMatch[1].trim();
          }
          break;
        }
      }

      // Return enhanced output
      return {
        ...universalOutput,
        college_name: college.collegeName,
        issues: enhancedIssues,
        overlay_analysis: {
          red_flags_detected: totalRedFlags,
          green_flags_detected: totalGreenFlags,
          rubric_band: rubricBand, // Extracted from first enhancement
          target_band: targetBand, // Extracted from first enhancement
          socratic_questions_available: totalSocraticQuestions,
        },
      };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NO COLLEGE: Generate universal suggestions only
    // ═══════════════════════════════════════════════════════════════════════════

    const config = TYPE_WEIGHT_CONFIGS[essayType];
    const constraints = TYPE_SUGGESTION_CONSTRAINTS[essayType];

    // Calculate word count status
    const wordCount = essayDraft.split(/\s+/).length;
    const effectiveWordLimits = wordLimits || config.word_range;
    const wordDelta = wordCount - effectiveWordLimits.max;
    const wordStatus = this.getWordCountStatus(wordCount, effectiveWordLimits);
    const wordCountAction = this.getWordCountAction(wordStatus, wordDelta, constraints.word_efficiency);
    const wordCountGuidance = this.getWordCountGuidance(wordStatus, constraints.word_efficiency);

    // Run cliché analysis in parallel (cheap, ~$0.003-0.005)
    // This detects topic-level, arc-level, and language-level clichés
    const clicheAnalysis = await semanticClicheAnalyzer.analyze(essayDraft, {
      college_id: college?.id,
      essay_type: essayType,
    });

    // Format cliché analysis for prompt injection
    const clicheAnalysisFormatted = formatClicheAnalysis(clicheAnalysis);

    // ───────────────────────────────────────────────────────────────────────
    // COLLEGE OVERLAY LAYER: Red/Green Flags, Rubric, Socratic Questions
    // ───────────────────────────────────────────────────────────────────────
    // These services pattern-match against college-specific overlays to provide
    // institutional knowledge that goes beyond generic type requirements.
    // Only runs when college context is provided.
    let redFlagOutput: RedFlagMatcherOutput | null = null;
    let greenFlagOutput: GreenFlagAmplifierOutput | null = null;
    let rubricGuidance: RubricBandGuidance | null = null;
    let socraticOutput: SocraticMatcherOutput | null = null;

    if (college) {
      const collegeId = college.collegeId?.toLowerCase() || college.collegeName.toLowerCase();

      try {
        // Detect college-specific red flags (critical issues with Dean quote teaching)
        redFlagOutput = redFlagMatcher.matchFlags({
          essayText: essayDraft,
          collegeId: collegeId,
          promptId: promptId, // Filter to prompt-specific red flags
        });

        // Detect college-valued strengths (preservation directives)
        greenFlagOutput = greenFlagAmplifier.matchFlags({
          essayText: essayDraft,
          collegeId: collegeId,
          promptId: promptId, // Filter to prompt-specific green flags
        });

        // Get rubric band guidance (only if college has prompt-specific rubrics)
        // Estimate score from detected issues as rough heuristic
        const estimatedScore = this.estimateScoreFromIssues(issues);
        rubricGuidance = promptRubricInjector.getRubricGuidance({
          collegeId: collegeId,
          promptId: promptId || 'default', // Use actual promptId for rubric mapping
          estimatedScore: estimatedScore,
        });

        // Match Socratic questions for detected issues
        const detectedIssueIds = issues.map(i => i.diagnosis.symptom_type);
        const weakDimensions = Array.from(
          new Set(issues.flatMap(i => i.diagnosis.affected_dimensions))
        ).slice(0, 3);

        socraticOutput = socraticQuestionMatcher.matchQuestions({
          collegeId: collegeId,
          promptId: promptId, // Filter to prompt-specific questions
          detectedIssues: detectedIssueIds,
          weakDimensions: weakDimensions,
        });
      } catch (error) {
        // Graceful degradation - log error but continue without overlay layer
        console.error('[TypeSpecificSuggestionService] Overlay layer failed:', error);
      }
    }

    // Build formatted overlay sections (only include if data available)
    const redFlagSection = redFlagOutput && redFlagOutput.matches.length > 0
      ? redFlagOutput.formattedForPrompt
      : '';

    const greenFlagSection = greenFlagOutput && greenFlagOutput.matches.length > 0
      ? greenFlagOutput.formattedForPrompt
      : '';

    // Only include rubric guidance if it provides college-specific value
    // (not just generic type requirements)
    const rubricGuidanceSection = rubricGuidance && rubricGuidance.whatPreventsHigherScore
      ? rubricGuidance.formattedForPrompt
      : '';

    // Only include Socratic questions when relevant (issues detected + questions available)
    const socraticSection = socraticOutput && socraticOutput.totalQuestions > 0
      ? socraticOutput.formattedForPrompt
      : '';

    // NEW: Build essay context sections from Stage 1 analysis
    const contextSections = this.buildEssayContextSections(essayContext);

    // Build prompt with all constraints
    const prompt = TYPE_SPECIFIC_SUGGESTION_PROMPT
      .replace('{bannedTerms}', BANNED_TERMS.join(', '))
      .replace('{essayType}', essayType)
      .replace('{typeName}', config.name)
      .replace('{currentWordCount}', String(wordCount))
      .replace('{wordMin}', String(effectiveWordLimits.min))
      .replace('{wordMax}', String(effectiveWordLimits.max))
      .replace('{wordCountStatus}', wordStatus)
      .replace('{wordCountAction}', wordCountAction)
      .replace('{wordCountGuidance}', wordCountGuidance)
      .replace('{maxSuggestionLength}', String(constraints.max_suggestion_length))
      .replace('{preserveRequirements}', constraints.preserve_requirements.join(', '))
      .replace('{avoidPatterns}', constraints.avoid_patterns.join(', '))
      .replace('{prioritizeQualities}', constraints.prioritize.join(', '))
      .replace('{wordEfficiency}', constraints.word_efficiency.toUpperCase())
      .replace('{criticalDimensions}', getCriticalDimensions(essayType).map(d => {
        const def = DIMENSION_DEFINITIONS[d];
        return `- ${def.name}: ${def.what_it_measures}`;
      }).join('\n'))
      .replace('{excellenceRequirements}', getExcellenceRequirements(essayType).map((r, i) => `${i + 1}. ${r}`).join('\n'))
      .replace('{topDimensions}', getTopDimensions(essayType, 3).map(d => {
        const weight = config.weights[d];
        const def = DIMENSION_DEFINITIONS[d];
        return `- ${def.name} (${weight}%): ${def.what_it_measures}`;
      }).join('\n'))
      .replace('{scoreReasoningSection}', contextSections.scoreReasoningSection) // NEW: Why current score (EARLY)
      .replace('{dimensionalSection}', contextSections.dimensionalSection) // NEW: What's working/missing per dimension
      .replace('{rubricGuidanceSection}', rubricGuidanceSection)
      .replace('{collegeContext}', formatCollegeContext(college, essayType))
      .replace('{redFlagSection}', redFlagSection)
      .replace('{greenFlagSection}', greenFlagSection)
      .replace('{clicheAnalysis}', clicheAnalysisFormatted)
      .replace('{holisticSection}', contextSections.holisticSection) // NEW: Motifs/arc/thread to preserve
      .replace('{wordCountSection}', contextSections.wordCountSection) // NEW: Strategic word count guidance
      .replace('{socraticSection}', socraticSection)
      .replace('{voiceFingerprint}', formatVoiceFingerprint(voice))
      .replace('{essayDraft}', essayDraft)
      .replace('{issuesFormatted}', formatIssues(issues));

    // Make API call
    const response = await this.client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 8000, // Room for multiple issues with full teaching
      temperature: 0.7, // Creative but not random
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse response
    const parsed = parseClaudeJSON(content.text, 'TypeSpecificSuggestionOutput');

    // Validate and filter suggestions
    const validatedIssues: IssueSuggestion[] = [];

    for (const issue of parsed.issues || []) {
      const originalIssue = issues.find(i => i.issue_id === issue.issue_id);
      const originalQuote = originalIssue?.quote || '';

      // Validate polished
      const polishedValidation = validateSuggestion(
        issue.suggestions?.polished_original,
        originalQuote,
        voice
      );

      // Validate voice
      const voiceValidation = validateSuggestion(
        issue.suggestions?.voice_amplifier,
        originalQuote,
        voice
      );

      // Add warnings to suggestions
      if (issue.suggestions?.polished_original) {
        issue.suggestions.polished_original.validation_warnings = polishedValidation.warnings;
      }
      if (issue.suggestions?.voice_amplifier) {
        issue.suggestions.voice_amplifier.validation_warnings = voiceValidation.warnings;
      }

      // ─────────────────────────────────────────────────────────────────
      // OVERLAY VALIDATION: Check against red/green flags
      // ─────────────────────────────────────────────────────────────────
      if (redFlagOutput || greenFlagOutput) {
        // Validate polished suggestion
        if (issue.suggestions?.polished_original) {
          const overlayValidation = this.validateAgainstOverlay(
            issue.suggestions.polished_original.text,
            redFlagOutput,
            greenFlagOutput,
            college
          );

          if (overlayValidation.warnings.length > 0) {
            issue.suggestions.polished_original.overlay_warnings = overlayValidation.warnings;
          }
        }

        // Validate voice suggestion
        if (issue.suggestions?.voice_amplifier) {
          const overlayValidation = this.validateAgainstOverlay(
            issue.suggestions.voice_amplifier.text,
            redFlagOutput,
            greenFlagOutput,
            college
          );

          if (overlayValidation.warnings.length > 0) {
            issue.suggestions.voice_amplifier.overlay_warnings = overlayValidation.warnings;
          }
        }
      }

      validatedIssues.push(issue);
    }

    // Calculate cost
    const cost = calculateCost(
      response.usage.input_tokens,
      response.usage.output_tokens
    );

    // NEW: Build score breakdown (PIQ-style) from essay context
    let scoreBreakdown: TypeSpecificSuggestionOutput['score_breakdown'];

    if (essayContext?.score_reasoning && essayContext?.dimensional_context) {
      const sr = essayContext.score_reasoning;
      const dims = essayContext.dimensional_context;

      // Format dimensional scores for UI
      const dimensionalScores = dims.map(dim => {
        // Generate "how to improve" guidance based on gap size
        let howToImprove = '';

        if (dim.gap >= 3) {
          howToImprove = `Critical gap (${dim.gap} points): ${dim.evidence.weaknesses[0] || 'Address weaknesses listed above'}`;
        } else if (dim.gap >= 1) {
          howToImprove = `Moderate gap (${dim.gap} points): Polish and deepen existing strengths`;
        } else {
          howToImprove = `Strong performance: Maintain current approach`;
        }

        return {
          dimension: dim.dimension,
          score: dim.current_score,
          target: dim.target_score,
          gap: dim.gap,
          strength_level: dim.strength_level,
          whats_working: dim.evidence.strengths,
          whats_missing: dim.evidence.weaknesses,
          how_to_improve: howToImprove
        };
      });

      // Identify dimensions to prioritize (biggest gaps first)
      const dimensionsToPrioritize = dims
        .filter(d => d.gap >= 2)
        .sort((a, b) => b.gap - a.gap)
        .slice(0, 3)
        .map(d => d.dimension);

      // Identify quick wins (small gaps with high ROI)
      const quickWins = dims
        .filter(d => d.gap >= 1 && d.gap < 3 && d.current_score >= 5)
        .map(d => `${d.dimension}: ${d.evidence.weaknesses[0] || 'Strengthen this dimension'}`)
        .slice(0, 3);

      // Estimate projected score after fixes (conservative 60% gap closure)
      const totalGap = dims.reduce((sum, d) => sum + d.gap, 0);
      const averageGapFilled = Math.min(totalGap * 0.6, 20); // Cap at 20 point improvement
      const projectedScore = Math.min(sr.total_score + averageGapFilled, 95);

      scoreBreakdown = {
        total_score: sr.total_score,
        quality_tier: sr.quality_tier,

        why_this_score: {
          core_strength: sr.core_strength,
          core_weakness: sr.core_weakness,
          reader_experience: sr.reader_experience
        },

        dimensional_scores: dimensionalScores,

        improvement_potential: {
          current_score: sr.total_score,
          projected_score: projectedScore,
          dimensions_to_prioritize: dimensionsToPrioritize,
          quick_wins: quickWins
        }
      };
    }

    return {
      essay_type: essayType,
      type_name: config.name,
      college_name: college?.collegeName || null,

      issues: validatedIssues,

      overall_strategy: parsed.overall_strategy || {
        cohesive_approach: 'Address issues in priority order',
        voice_consistency: 'Maintain authentic voice throughout',
        priority_order: 'Focus on critical dimensions first',
        implementation_tips: ['Apply suggestions gradually', 'Re-read for flow', 'Preserve voice markers']
      },

      // Overlay analysis metadata
      overlay_analysis: {
        red_flags_detected: redFlagOutput?.matches.length || 0,
        green_flags_detected: greenFlagOutput?.matches.length || 0,
        rubric_band: rubricGuidance?.currentBand.name || null,
        target_band: rubricGuidance?.targetBand.name || null,
        socratic_questions_available: socraticOutput?.totalQuestions || 0,
      },

      // NEW: Score breakdown (PIQ-style)
      score_breakdown: scoreBreakdown,

      cost,
      tokens_used: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens
      }
    };
  }

  /**
   * Get word count status based on current count and limits
   */
  /**
   * Estimate overall score from detected issues
   *
   * This is a rough heuristic until we have actual dimension scores.
   * Each issue reduces the base score based on severity.
   */
  private estimateScoreFromIssues(issues: IssueContext[]): number {
    const baseScore = 75; // Assume average starting point

    // Each issue reduces score based on impact
    const penalty = issues.reduce((sum, issue) => {
      return sum + Math.abs(issue.diagnosis.score_impact);
    }, 0);

    const estimatedScore = Math.max(30, baseScore - penalty);
    return Math.round(estimatedScore);
  }

  /**
   * Validate suggestion text against overlay red/green flags
   *
   * Returns warnings in teaching format (like PIQ workshop explanations)
   */
  private validateAgainstOverlay(
    suggestionText: string,
    redFlags: RedFlagMatcherOutput | null,
    greenFlags: GreenFlagAmplifierOutput | null,
    college?: CollegeResearch
  ): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (!college) {
      return { valid: true, warnings: [] };
    }

    const collegeId = college.collegeId?.toLowerCase() || college.collegeName.toLowerCase();

    // Check if suggestion introduces new red flags
    if (redFlags) {
      try {
        const newRedFlags = redFlagMatcher.matchFlags({
          essayText: suggestionText,
          collegeId: collegeId,
        });

        if (newRedFlags.matches.length > 0) {
          const flag = newRedFlags.matches[0];
          warnings.push(
            `⚠️ RED FLAG DETECTED: "${flag.flagName}" (${flag.severity})\n` +
            `Why this matters: ${flag.teaching.whyItMatters}\n` +
            `How to fix: ${flag.teaching.howToFix}`
          );
        }
      } catch (error) {
        // Graceful degradation - log but don't fail
        console.error('[Overlay Validation] Red flag check failed:', error);
      }
    }

    // Check if suggestion removes green flags
    if (greenFlags && greenFlags.matches.length > 0) {
      try {
        for (const greenFlag of greenFlags.matches.slice(0, 3)) {
          const stillPresent = suggestionText.toLowerCase().includes(
            greenFlag.matchedPhrase.substring(0, 40).toLowerCase()
          );

          if (!stillPresent) {
            warnings.push(
              `⚠️ GREEN FLAG REMOVED: "${greenFlag.flagName}"\n` +
              `Why preserve: ${greenFlag.teaching.whyItMatters}\n` +
              `Original strength: "${greenFlag.matchedPhrase.substring(0, 60)}..."`
            );
          }
        }
      } catch (error) {
        // Graceful degradation
        console.error('[Overlay Validation] Green flag check failed:', error);
      }
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Get word count status
   */
  private getWordCountStatus(
    wordCount: number,
    limits: { min: number; max: number }
  ): 'under' | 'within' | 'over' | 'severely_over' {
    if (wordCount < limits.min) return 'under';
    if (wordCount <= limits.max) return 'within';
    if (wordCount <= limits.max * 1.15) return 'over';
    return 'severely_over';
  }

  /**
   * Get actionable word count guidance for the prompt
   */
  private getWordCountAction(
    status: string,
    delta: number,
    efficiency: 'ruthless' | 'moderate' | 'flexible'
  ): string {
    if (status === 'within') {
      return '✓ Word count is within limits. Focus on quality improvements.';
    }
    if (status === 'under') {
      return `⚠ Essay is ${Math.abs(delta)} words UNDER minimum. Suggestions should ADD content, not trim.`;
    }
    if (status === 'over') {
      const action = efficiency === 'ruthless'
        ? `CRITICAL: Essay is ${delta} words OVER. Every suggestion MUST be shorter than original. Cut aggressively.`
        : `Essay is ${delta} words over. Prefer suggestions that tighten language while preserving meaning.`;
      return `⚠ ${action}`;
    }
    // severely_over
    return `🚨 SEVERELY OVER by ${delta} words. Suggestions MUST cut words. Prioritize condensation over other improvements.`;
  }

  /**
   * Get word count guidance for overall approach
   */
  private getWordCountGuidance(
    status: string,
    efficiency: 'ruthless' | 'moderate' | 'flexible'
  ): string {
    const baseGuidance: Record<string, string> = {
      under: 'Suggestions should expand and add depth without padding',
      within: 'Balance quality improvements with word efficiency',
      over: 'Suggestions should be more concise than originals',
      severely_over: 'PRIORITIZE word reduction in every suggestion'
    };

    const efficiencyMod: Record<string, string> = {
      ruthless: '. Apply maximum word efficiency - every word must earn its place',
      moderate: '. Balance content quality with reasonable word efficiency',
      flexible: '. Prioritize content quality; word count is secondary'
    };

    return baseGuidance[status] + efficiencyMod[efficiency];
  }

  /**
   * Generate suggestions for a single issue (smaller, more focused)
   */
  async generateSingleIssueSuggestion(
    essayDraft: string,
    essayType: SupplementalType,
    issue: IssueContext,
    options: {
      college?: CollegeResearch;
      voice?: VoiceFingerprint;
    } = {}
  ): Promise<IssueSuggestion> {
    const result = await this.generateSuggestions(
      essayDraft,
      essayType,
      [issue],
      options
    );

    return result.issues[0];
  }

  /**
   * Create issue context from scoring output
   */
  static createIssueContext(
    detectedIssue: DetectedIssue,
    essayDraft: string,
    college?: CollegeResearch
  ): IssueContext {
    // Find surrounding context
    const quoteIndex = essayDraft.indexOf(detectedIssue.location);
    const start = Math.max(0, quoteIndex - 300);
    const end = Math.min(essayDraft.length, quoteIndex + detectedIssue.location.length + 300);
    const surroundingContext = quoteIndex >= 0
      ? essayDraft.substring(start, end)
      : essayDraft.substring(0, 600);

    // Find relevant college values
    const relevantValues: CollegeCoreValue[] = [];
    if (college?.coreValues) {
      for (const dim of detectedIssue.affected_dimensions) {
        const matchingValue = college.coreValues.find((v: CollegeCoreValue) =>
          v.valueName.toLowerCase().includes(dim.toLowerCase()) ||
          dim.toLowerCase().includes(v.valueName.toLowerCase())
        );
        if (matchingValue) {
          relevantValues.push(matchingValue);
        }
      }
    }

    // Find relevant quotes
    const relevantQuotes: CollegeKeyQuote[] = [];
    if (college?.keyQuotes) {
      for (const dim of detectedIssue.affected_dimensions) {
        const matchingQuote = college.keyQuotes.find((q: CollegeKeyQuote) =>
          q.useCases?.some(uc => uc.dimension?.toLowerCase().includes(dim.toLowerCase()))
        );
        if (matchingQuote) {
          relevantQuotes.push(matchingQuote);
        }
      }
    }

    return {
      issue_id: detectedIssue.pattern_id,
      quote: detectedIssue.location,
      location: 'In essay draft',
      diagnosis: {
        problem: detectedIssue.problem_description,
        symptom_type: detectedIssue.pattern_name,
        affected_dimensions: detectedIssue.affected_dimensions,
        score_impact: detectedIssue.score_impact
      },
      surrounding_context: surroundingContext,
      relevant_college_values: relevantValues,
      relevant_quotes: relevantQuotes.slice(0, 2)
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOCRATIC DEPTH MODE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate Socratic depth probes instead of polished prose
   *
   * Use this mode when:
   * - The essay lacks genuine insight (just performative enthusiasm)
   * - The student needs to discover their own unique angle
   * - You want to extract authentic thinking, not give them words to copy
   *
   * This mode generates questions that help students find their own depth,
   * rather than giving them polished prose that still sounds like essay-speak.
   */
  async generateSocraticDepth(
    essayDraft: string,
    essayType: SupplementalType,
    issues: IssueContext[],
    options: {
      college?: CollegeResearch;
    } = {}
  ): Promise<SocraticDepthBatchOutput> {
    const { college } = options;

    if (issues.length === 0 || issues.length > 5) {
      throw new Error('Socratic depth supports 1-5 issues (optimal: 2-3)');
    }

    const config = TYPE_WEIGHT_CONFIGS[essayType];

    // Build prompt with Socratic depth focus
    const prompt = SOCRATIC_DEPTH_PROMPT
      .replace('{performativePatterns}', PERFORMATIVE_AUTHENTICITY_PATTERNS.join(', '))
      .replace('{essayType}', essayType)
      .replace('{typeName}', config.name)
      .replace('{criticalDimensions}', getCriticalDimensions(essayType).map(d => {
        const def = DIMENSION_DEFINITIONS[d];
        return `- ${def.name}: ${def.what_it_measures}`;
      }).join('\n'))
      .replace('{excellenceRequirements}', getExcellenceRequirements(essayType).map((r, i) => `${i + 1}. ${r}`).join('\n'))
      .replace('{collegeContext}', formatCollegeContext(college, essayType))
      .replace('{essayDraft}', essayDraft)
      .replace('{issuesFormatted}', formatIssues(issues));

    // Make API call
    const response = await this.client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 6000,
      temperature: 0.6, // Slightly lower for more focused probes
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse response
    const parsed = parseClaudeJSON(content.text, 'SocraticDepthBatchOutput');

    // Calculate cost
    const cost = calculateCost(
      response.usage.input_tokens,
      response.usage.output_tokens
    );

    return {
      essay_type: essayType,
      type_name: config.name,
      college_name: college?.collegeName || null,

      issues: parsed.issues || [],

      meta_guidance: parsed.meta_guidance || {
        overall_depth_gap: 'Essay lacks genuine insight',
        common_thread: 'Student shows interest but not unique thinking',
        how_issues_connect: 'Addressing depth in one area will help others'
      },

      cost,
      tokens_used: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT-AWARE SUGGESTION GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Analyze issues and determine if we need more context before generating suggestions
   *
   * This is the entry point for the context-gathering system. It:
   * 1. Detects context gaps in the essay
   * 2. Determines if those gaps are critical enough to block suggestion generation
   * 3. Returns either a context gathering request OR proceeds with suggestions
   *
   * @param essayDraft The essay text
   * @param essayType The type of essay
   * @param issues The detected issues
   * @param options Generation options
   * @returns Either suggestions or a context gathering request
   */
  async analyzeContextNeeds(
    essayDraft: string,
    essayType: SupplementalType,
    issues: IssueContext[],
    options: {
      college?: CollegeResearch;
      voice?: VoiceFingerprint;
    } = {}
  ): Promise<SuggestionWithContextNeeds> {
    // 1. Detect context gaps
    const gaps = contextGapDetector.detectGaps(essayDraft, essayType, issues);

    // 2. Determine if we should gather context
    const contextDecision = contextGapDetector.shouldGatherContext(gaps, essayType);

    // 3. If blocking gaps, return a gathering request
    if (contextDecision.severity === 'blocking' && issues.length > 0) {
      const gatheringRequest = contextGapDetector.createGatheringRequest(
        issues[0],
        gaps
      );

      return {
        can_proceed: false,
        context_needs: {
          severity: 'blocking',
          gathering_request: gatheringRequest,
          message_to_user: this.createUserMessage(gaps, 'blocking')
        }
      };
    }

    // 4. If would_improve gaps, we can proceed but note what we're missing
    if (contextDecision.severity === 'would_improve' && issues.length > 0) {
      // Generate suggestions with current context
      const suggestions = await this.generateSuggestions(
        essayDraft,
        essayType,
        issues,
        options
      );

      // Create a gathering request for optional follow-up
      const gatheringRequest = contextGapDetector.createGatheringRequest(
        issues[0],
        gaps
      );

      return {
        can_proceed: true,
        suggestions: {
          polished_original: suggestions.issues[0]?.suggestions.polished_original,
          voice_amplifier: suggestions.issues[0]?.suggestions.voice_amplifier
        },
        context_needs: {
          severity: 'would_improve',
          gathering_request: gatheringRequest,
          message_to_user: this.createUserMessage(gaps, 'would_improve')
        },
        invented_elements: this.identifyInventedElements(gaps)
      };
    }

    // 5. No significant gaps - proceed normally
    const suggestions = await this.generateSuggestions(
      essayDraft,
      essayType,
      issues,
      options
    );

    return {
      can_proceed: true,
      suggestions: {
        polished_original: suggestions.issues[0]?.suggestions.polished_original,
        voice_amplifier: suggestions.issues[0]?.suggestions.voice_amplifier
      }
    };
  }

  /**
   * Generate suggestions WITH enriched student context
   *
   * Use this after the chat interface has gathered context from the student.
   * The enriched context provides real details to weave into suggestions
   * instead of having to invent them.
   *
   * @param essayDraft The essay text
   * @param essayType The type of essay
   * @param issues The detected issues
   * @param enrichedContext Context gathered from the student
   * @param options Generation options
   * @returns Suggestions that use the student's real details
   */
  async generateContextAwareSuggestions(
    essayDraft: string,
    essayType: SupplementalType,
    issues: IssueContext[],
    enrichedContext: EnrichedStudentContext,
    options: {
      college?: CollegeResearch;
      voice?: VoiceFingerprint;
    } = {}
  ): Promise<TypeSpecificSuggestionOutput> {
    const { college, voice } = options;

    if (issues.length === 0 || issues.length > 5) {
      throw new Error('Context-aware suggestion supports 1-5 issues (optimal: 3)');
    }

    const config = TYPE_WEIGHT_CONFIGS[essayType];
    const constraints = TYPE_SUGGESTION_CONSTRAINTS[essayType];

    // Build enriched context section for the prompt
    const contextSection = this.formatEnrichedContext(enrichedContext);

    // Calculate word count status
    const wordCount = essayDraft.split(/\s+/).length;
    const effectiveWordLimits = config.word_range;
    const wordDelta = wordCount - effectiveWordLimits.max;
    const wordStatus = this.getWordCountStatus(wordCount, effectiveWordLimits);
    const wordCountAction = this.getWordCountAction(wordStatus, wordDelta, constraints.word_efficiency);
    const wordCountGuidance = this.getWordCountGuidance(wordStatus, constraints.word_efficiency);

    // Build prompt with context + all constraints
    const prompt = this.buildContextAwarePrompt(
      essayDraft,
      essayType,
      config,
      constraints,
      issues,
      contextSection,
      {
        college,
        voice,
        wordCount,
        wordStatus,
        wordCountAction,
        wordCountGuidance
      }
    );

    // Make API call
    const response = await this.client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 8000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse response
    const parsed = parseClaudeJSON(content.text, 'TypeSpecificSuggestionOutput');

    // Validate and filter suggestions
    const validatedIssues: IssueSuggestion[] = [];

    for (const issue of parsed.issues || []) {
      const originalIssue = issues.find(i => i.issue_id === issue.issue_id);
      const originalQuote = originalIssue?.quote || '';

      const polishedValidation = validateSuggestion(
        issue.suggestions?.polished_original,
        originalQuote,
        voice
      );

      const voiceValidation = validateSuggestion(
        issue.suggestions?.voice_amplifier,
        originalQuote,
        voice
      );

      if (issue.suggestions?.polished_original) {
        issue.suggestions.polished_original.validation_warnings = polishedValidation.warnings;
        // Mark that this used enriched context
        issue.suggestions.polished_original.used_student_context = true;
      }
      if (issue.suggestions?.voice_amplifier) {
        issue.suggestions.voice_amplifier.validation_warnings = voiceValidation.warnings;
        issue.suggestions.voice_amplifier.used_student_context = true;
      }

      validatedIssues.push(issue);
    }

    // Calculate cost
    const cost = calculateCost(
      response.usage.input_tokens,
      response.usage.output_tokens
    );

    return {
      essay_type: essayType,
      type_name: config.name,
      college_name: college?.collegeName || null,

      issues: validatedIssues,

      overall_strategy: parsed.overall_strategy || {
        cohesive_approach: 'Address issues using your provided context',
        voice_consistency: 'Maintain authentic voice throughout',
        priority_order: 'Focus on critical dimensions first',
        implementation_tips: ['These suggestions use YOUR specific details', 'Adjust phrasing to match your voice']
      },

      cost,
      tokens_used: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens
      }
    };
  }

  /**
   * Build essay context sections for prompt injection
   *
   * Formats Stage 1 insights (holistic context, dimensional scores, score reasoning)
   * into prompt sections that guide Stage 2 suggestions.
   *
   * Only includes sections where we have data (conditional injection).
   *
   * @param essayContext - Essay context package from Stage 1
   * @returns Formatted sections for prompt template
   */
  private buildEssayContextSections(essayContext?: EssayContextPackage): {
    holisticSection: string;
    dimensionalSection: string;
    scoreReasoningSection: string;
    wordCountSection: string;
  } {
    let holisticSection = '';
    let dimensionalSection = '';
    let scoreReasoningSection = '';
    let wordCountSection = '';

    // HOLISTIC CONTEXT SECTION
    if (essayContext?.holistic_context) {
      const hc = essayContext.holistic_context;

      holisticSection = `
# ESSAY HOLISTIC CONTEXT (Maintain Coherence)

**Recurring Motifs**: ${hc.recurring_motifs.length > 0 ? hc.recurring_motifs.join(', ') : 'None identified'}
→ Suggestions MUST reinforce these themes, not introduce new unrelated ones
→ If adding examples, connect them to existing motifs

**Emotional Arc**: ${hc.emotional_arc}
${hc.arc_predictability ? `→ Arc predictability: ${hc.arc_predictability}/10` : ''}
${hc.arc_suggested_subversion ? `→ To improve: ${hc.arc_suggested_subversion}` : ''}

**Narrative Thread**: ${hc.narrative_thread}
→ Maintain this throughline while addressing issues
→ Don't break continuity with disconnected suggestions
`;
    }

    // DIMENSIONAL BREAKDOWN SECTION
    if (essayContext?.dimensional_context && essayContext.dimensional_context.length > 0) {
      const dimensions = essayContext.dimensional_context;

      dimensionalSection = `
# DIMENSIONAL SCORE BREAKDOWN (Current State)

This shows what's working and what needs fixing in each dimension.
Suggestions must PRESERVE strengths and ADDRESS weaknesses.

`;

      for (const dim of dimensions.slice(0, 6)) { // Top 6 dimensions
        dimensionalSection += `
**${dim.dimension.toUpperCase().replace(/_/g, ' ')}**: ${dim.current_score}/10 (${dim.strength_level})
Target: ${dim.target_score}/10 | Gap: ${dim.gap} points

`;

        if (dim.evidence.strengths.length > 0) {
          dimensionalSection += `✅ What's Working (PRESERVE):\n`;
          dim.evidence.strengths.slice(0, 2).forEach(s => {
            dimensionalSection += `   - ${s}\n`;
          });
        }

        if (dim.evidence.weaknesses.length > 0) {
          dimensionalSection += `❌ What's Missing (FIX):\n`;
          dim.evidence.weaknesses.slice(0, 2).forEach(w => {
            dimensionalSection += `   - ${w}\n`;
          });
        }

        dimensionalSection += '\n';
      }
    }

    // SCORE REASONING SECTION
    if (essayContext?.score_reasoning) {
      const sr = essayContext.score_reasoning;

      scoreReasoningSection = `
# SCORE EXPLANATION (Why ${sr.total_score}/100 - ${sr.quality_tier})

**Core Strength**: ${sr.core_strength}
→ Suggestions MUST preserve this - it's what makes the essay work

**Core Weakness**: ${sr.core_weakness}
→ Suggestions MUST address this - it's the primary issue holding score down

**Reader Experience**: ${sr.reader_experience}
→ Suggestions must improve this feeling

**How Each Principle Performed**:
`;

      for (const principle of sr.principle_scores.slice(0, 5)) {
        scoreReasoningSection += `
- **${principle.principle_name}**: ${principle.score}/10
  How achieved: ${principle.how_achieved}
  Reader effect: ${principle.reader_effect}
`;
      }

      if (sr.type_assessment) {
        scoreReasoningSection += `
**Type-Specific Assessment**:
- Reader question answered? ${sr.type_assessment.reader_question_answered ? 'Yes' : 'No'}
- Answer quality: ${sr.type_assessment.answer_quality}/10
- Success principles met: ${sr.type_assessment.success_principles_met.join(', ') || 'None'}
- Pitfalls present: ${sr.type_assessment.pitfalls_present.join(', ') || 'None'}
`;
      }
    }

    // WORD COUNT CONTEXT SECTION
    if (essayContext?.word_count_status) {
      const wc = essayContext.word_count_status;

      wordCountSection = `
# WORD COUNT CONTEXT

Current: ${wc.word_count} words | Limit: ${wc.limit} | Delta: ${wc.delta > 0 ? '+' : ''}${wc.delta}
Status: ${wc.status.toUpperCase()} (${wc.severity} severity)

**Guidance**: ${wc.guidance}

${wc.status === 'over' ?
  `→ Suggestions should REPLACE generic/weak phrases with stronger specific ones (same or fewer words)
→ Do NOT suggest adding more content - essay is already over limit` :
  wc.status === 'under' ?
  `→ Suggestions can ADD depth and specificity
→ Essay has room to expand` :
  `→ Suggestions should maintain current length
→ Replace weak content with strong content (word-neutral)`}
`;
    }

    return {
      holisticSection,
      dimensionalSection,
      scoreReasoningSection,
      wordCountSection
    };
  }

  /**
   * Format enriched student context for the prompt
   */
  private formatEnrichedContext(context: EnrichedStudentContext): string {
    const sections: string[] = [];

    if (context.specific_moments.length > 0) {
      sections.push(`
SPECIFIC MOMENTS FROM STUDENT:
${context.specific_moments.map((m, i) => `${i + 1}. ${m.description}
   Sensory details: ${m.sensory_details.join(', ')}
   Emotional context: ${m.emotional_context}`).join('\n')}`);
    }

    if (context.authentic_insights.length > 0) {
      sections.push(`
AUTHENTIC INSIGHTS (in student's own words):
${context.authentic_insights.map((ins, i) => `${i + 1}. "${ins.insight}"
   What prompted it: ${ins.what_prompted_it}`).join('\n')}`);
    }

    if (context.struggles_and_failures.length > 0) {
      sections.push(`
STRUGGLES AND FAILURES (valuable material):
${context.struggles_and_failures.map((s, i) => `${i + 1}. What happened: ${s.what_happened}
   What they learned: ${s.what_they_learned}`).join('\n')}`);
    }

    if (context.unique_perspectives.length > 0) {
      sections.push(`
UNIQUE PERSPECTIVES:
${context.unique_perspectives.map((p, i) => `${i + 1}. Angle: ${p.angle}
   Why they see it this way: ${p.why_they_see_it_this_way}`).join('\n')}`);
    }

    if (context.key_people.length > 0) {
      sections.push(`
KEY PEOPLE (with memorable details):
${context.key_people.map((p, i) => `${i + 1}. ${p.description}
   Relationship: ${p.relationship_dynamic}
   Details: ${p.memorable_details.join(', ')}`).join('\n')}`);
    }

    if (context.quotable_phrases.length > 0) {
      sections.push(`
QUOTABLE PHRASES (can be woven in):
${context.quotable_phrases.map((q, i) => `${i + 1}. "${q.phrase}" (context: ${q.context})`).join('\n')}`);
    }

    return sections.length > 0 ? `
═══════════════════════════════════════════════════════════
STUDENT CONTEXT (USE THIS - DON'T INVENT)
═══════════════════════════════════════════════════════════

The following details come directly from the student. Use these
INSTEAD of inventing details. Your suggestions should weave in
this real context.

${sections.join('\n')}

CRITICAL: Your suggestions MUST incorporate these specific details.
Do not invent new details when the student has provided real ones.
` : '';
  }

  /**
   * Build the context-aware prompt
   */
  private buildContextAwarePrompt(
    essayDraft: string,
    essayType: SupplementalType,
    config: typeof TYPE_WEIGHT_CONFIGS[SupplementalType],
    constraints: TypeSpecificConstraints,
    issues: IssueContext[],
    contextSection: string,
    wordInfo: {
      college?: CollegeResearch;
      voice?: VoiceFingerprint;
      wordCount: number;
      wordStatus: string;
      wordCountAction: string;
      wordCountGuidance: string;
    }
  ): string {
    // Use the same base prompt but inject the context section
    return TYPE_SPECIFIC_SUGGESTION_PROMPT
      .replace('{bannedTerms}', BANNED_TERMS.join(', '))
      .replace('{essayType}', essayType)
      .replace('{typeName}', config.name)
      .replace('{currentWordCount}', String(wordInfo.wordCount))
      .replace('{wordMin}', String(config.word_range.min))
      .replace('{wordMax}', String(config.word_range.max))
      .replace('{wordCountStatus}', wordInfo.wordStatus)
      .replace('{wordCountAction}', wordInfo.wordCountAction)
      .replace('{wordCountGuidance}', wordInfo.wordCountGuidance)
      .replace('{maxSuggestionLength}', String(constraints.max_suggestion_length))
      .replace('{preserveRequirements}', constraints.preserve_requirements.join(', '))
      .replace('{avoidPatterns}', constraints.avoid_patterns.join(', '))
      .replace('{prioritizeQualities}', constraints.prioritize.join(', '))
      .replace('{wordEfficiency}', constraints.word_efficiency.toUpperCase())
      .replace('{criticalDimensions}', getCriticalDimensions(essayType).map(d => {
        const def = DIMENSION_DEFINITIONS[d];
        return `- ${def.name}: ${def.what_it_measures}`;
      }).join('\n'))
      .replace('{excellenceRequirements}', getExcellenceRequirements(essayType).map((r, i) => `${i + 1}. ${r}`).join('\n'))
      .replace('{topDimensions}', getTopDimensions(essayType, 3).map(d => {
        const weight = config.weights[d];
        const def = DIMENSION_DEFINITIONS[d];
        return `- ${def.name} (${weight}%): ${def.what_it_measures}`;
      }).join('\n'))
      .replace('{collegeContext}', formatCollegeContext(wordInfo.college, essayType))
      .replace('{voiceFingerprint}', formatVoiceFingerprint(wordInfo.voice))
      .replace('{essayDraft}', contextSection + '\n\nESSAY:\n' + essayDraft)
      .replace('{issuesFormatted}', formatIssues(issues));
  }

  /**
   * Create a user-friendly message explaining why we need more context
   */
  private createUserMessage(gaps: ContextGap[], severity: 'blocking' | 'would_improve'): string {
    const topGaps = gaps.slice(0, 2);

    if (severity === 'blocking') {
      return `To give you the best suggestions, I need to understand your experience better. ` +
        `Right now, your essay has some places where you're claiming something without showing it. ` +
        `Let me ask you a few quick questions so I can help you write something that's genuinely yours—not generic advice.`;
    }

    return `I have some suggestions for you, but they might be even better if you can tell me more about ` +
      `${topGaps.map(g => g.diagnosis.what_is_missing.toLowerCase()).join(' and ')}. ` +
      `Want to answer a few quick questions?`;
  }

  /**
   * Identify what elements we might have to invent without more context
   */
  private identifyInventedElements(gaps: ContextGap[]): { element: string; why_invented: string; would_be_better_if: string }[] {
    return gaps.slice(0, 3).map(gap => ({
      element: gap.diagnosis.what_is_missing,
      why_invented: `Essay currently lacks ${gap.gap_type.replace(/_/g, ' ')}`,
      would_be_better_if: gap.diagnosis.what_would_fix_it
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SONNET-ENHANCED CONTEXT ANALYSIS (Higher Accuracy Layer)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Enhanced context analysis using Sonnet for accurate gap detection
   *
   * This method uses the SonnetContextLayer for high-accuracy gap detection,
   * then generates suggestions that are aware of what's missing.
   *
   * USE THIS WHEN:
   * - You want the most accurate gap detection (~95% accuracy)
   * - Quality matters more than cost (~$0.015 extra per essay)
   * - You're generating suggestions for important essays
   *
   * FLOW:
   * 1. Sonnet analyzes essay for context gaps (cached, ~15s first call)
   * 2. If gaps found with high priority → return gathering request
   * 3. Otherwise → generate suggestions with gap awareness
   *
   * @param essayDraft The essay text
   * @param essayType The type of essay
   * @param issues The detected issues
   * @param options Generation options including useSonnetLayer flag
   */
  async analyzeContextNeedsEnhanced(
    essayDraft: string,
    essayType: SupplementalType,
    issues: IssueContext[],
    options: {
      college?: CollegeResearch;
      voice?: VoiceFingerprint;
      useSonnetLayer?: boolean; // Enable Sonnet layer (default: true)
      sonnetLayerOptions?: {
        max_gaps?: number;
        min_priority?: number;
        bypass_cache?: boolean;
      };
    } = {}
  ): Promise<SuggestionWithContextNeeds & {
    sonnet_analysis?: SonnetContextAnalysis;
    context_quality_score?: number;
  }> {
    const { useSonnetLayer = true, sonnetLayerOptions = {} } = options;

    // ───────────────────────────────────────────────────────────────────────
    // STEP 1: Run Sonnet Context Analysis (if enabled)
    // ───────────────────────────────────────────────────────────────────────
    let sonnetAnalysis: SonnetContextAnalysis | undefined;

    if (useSonnetLayer) {
      try {
        sonnetAnalysis = await sonnetContextLayer.analyzeContextGaps(
          essayDraft,
          essayType,
          {
            enabled: true,
            max_gaps: sonnetLayerOptions.max_gaps ?? 5,
            min_priority: sonnetLayerOptions.min_priority ?? 5, // Only high-priority gaps
            bypass_cache: sonnetLayerOptions.bypass_cache ?? false
          }
        );
      } catch (error) {
        console.error('[TypeSpecificSuggestionService] Sonnet layer failed, falling back to heuristics:', error);
        // Fall back to basic analysis
        return this.analyzeContextNeeds(essayDraft, essayType, issues, options);
      }
    }

    // ───────────────────────────────────────────────────────────────────────
    // STEP 2: Determine if we need to gather context
    // ───────────────────────────────────────────────────────────────────────
    // Only block suggestion generation if essay is truly insufficient.
    //
    // Sonnet is strict - even good essays score 40-60. So we use:
    // - Score < 30: Very weak essay, definitely needs context gathering
    // - Score 30-40: Weak essay, only block if multiple P10 gaps
    // - Score > 40: Allow through, offer context gathering as optional
    //
    // This prevents blocking essays that already have some good details
    // while still catching generic templates that need help.
    const score = sonnetAnalysis?.context_quality_score ?? 100;
    const criticalGapCount = sonnetAnalysis?.gaps.filter(g => g.priority === 10).length ?? 0;

    const scoreIsVeryLow = score < 30;
    const scoreIsWeakWithMultipleCritical = score < 40 && criticalGapCount >= 2;

    const shouldGatherContext = sonnetAnalysis &&
      sonnetAnalysis.would_benefit_from_context &&
      sonnetAnalysis.gaps.length > 0 &&
      (scoreIsVeryLow || scoreIsWeakWithMultipleCritical);

    if (shouldGatherContext && sonnetAnalysis) {
      // Convert Sonnet gaps to gathering request
      const gatheringRequest = this.convertSonnetGapsToGatheringRequest(
        sonnetAnalysis.gaps,
        issues[0]
      );

      return {
        can_proceed: false,
        context_needs: {
          severity: 'blocking',
          gathering_request: gatheringRequest,
          message_to_user: this.createSonnetBasedUserMessage(sonnetAnalysis)
        },
        sonnet_analysis: sonnetAnalysis,
        context_quality_score: sonnetAnalysis.context_quality_score
      };
    }

    // ───────────────────────────────────────────────────────────────────────
    // STEP 3: Generate suggestions (with gap awareness)
    // ───────────────────────────────────────────────────────────────────────
    const suggestions = await this.generateSuggestionsWithGapAwareness(
      essayDraft,
      essayType,
      issues,
      sonnetAnalysis,
      options
    );

    // If there are moderate gaps, include them as optional follow-up
    if (sonnetAnalysis && sonnetAnalysis.gaps.length > 0) {
      const gatheringRequest = this.convertSonnetGapsToGatheringRequest(
        sonnetAnalysis.gaps,
        issues[0]
      );

      return {
        can_proceed: true,
        suggestions: {
          polished_original: suggestions.issues[0]?.suggestions.polished_original,
          voice_amplifier: suggestions.issues[0]?.suggestions.voice_amplifier
        },
        context_needs: {
          severity: 'would_improve',
          gathering_request: gatheringRequest,
          message_to_user: this.createSonnetBasedUserMessage(sonnetAnalysis, 'optional')
        },
        sonnet_analysis: sonnetAnalysis,
        context_quality_score: sonnetAnalysis.context_quality_score,
        invented_elements: this.identifyInventedElementsFromSonnet(sonnetAnalysis.gaps)
      };
    }

    // Essay has good context - proceed normally
    return {
      can_proceed: true,
      suggestions: {
        polished_original: suggestions.issues[0]?.suggestions.polished_original,
        voice_amplifier: suggestions.issues[0]?.suggestions.voice_amplifier
      },
      sonnet_analysis: sonnetAnalysis,
      context_quality_score: sonnetAnalysis?.context_quality_score ?? 100
    };
  }

  /**
   * Generate suggestions with awareness of what context is missing
   *
   * This injects Sonnet's gap analysis into the prompt so the AI knows:
   * - What details are missing (and shouldn't be invented)
   * - Where the essay needs more concrete information
   * - What questions remain unanswered
   * - WHAT TO DO INSTEAD of inventing details
   */
  private async generateSuggestionsWithGapAwareness(
    essayDraft: string,
    essayType: SupplementalType,
    issues: IssueContext[],
    sonnetAnalysis: SonnetContextAnalysis | undefined,
    options: {
      college?: CollegeResearch;
      voice?: VoiceFingerprint;
    } = {}
  ): Promise<TypeSpecificSuggestionOutput> {
    // If we have Sonnet analysis, add gap awareness to the prompt
    if (sonnetAnalysis && sonnetAnalysis.gaps.length > 0) {
      // Build optimized gap awareness injection
      const gapAwarenessBlock = this.buildOptimizedGapAwareness(sonnetAnalysis);

      // Inject gap awareness into the issues
      const enhancedIssues = issues.map(issue => ({
        ...issue,
        surrounding_context: issue.surrounding_context + gapAwarenessBlock
      }));

      return this.generateSuggestions(essayDraft, essayType, enhancedIssues, options);
    }

    // No gaps - generate normally
    return this.generateSuggestions(essayDraft, essayType, issues, options);
  }

  /**
   * Build optimized gap awareness block for injection into suggestion prompt
   *
   * KEY OPTIMIZATIONS:
   * 1. Prioritizes gaps by impact (P10 first)
   * 2. Provides ACTIONABLE alternatives for each gap type
   * 3. Uses Sonnet's workaround_suggestion when available
   * 4. Includes STRENGTHS to preserve and amplify
   * 5. Keeps injection concise to avoid prompt bloat
   */
  private buildOptimizedGapAwareness(analysis: SonnetContextAnalysis): string {
    // Sort gaps by priority (highest first)
    const sortedGaps = [...analysis.gaps].sort((a, b) => b.priority - a.priority);

    // Take top 3 most critical gaps
    const criticalGaps = sortedGaps.slice(0, 3);

    // Map gap types to actionable instructions (fallback when no workaround_suggestion)
    const gapToAction: Record<string, { avoid: string; instead: string }> = {
      'missing_concrete_detail': {
        avoid: 'inventing specific scenes, times, or places',
        instead: 'use structural improvements (pacing, word choice) or prompt student to add their own detail'
      },
      'missing_emotional_depth': {
        avoid: 'adding emotional language the student didn\'t write',
        instead: 'create space for emotion by removing performative phrases, let silence speak'
      },
      'missing_specific_example': {
        avoid: 'fabricating examples or scenarios',
        instead: 'use placeholders like [YOUR SPECIFIC EXAMPLE] or restructure to highlight what IS present'
      },
      'missing_research': {
        avoid: 'inventing professor names, program details, or statistics',
        instead: 'use [SPECIFIC PROGRAM/PROFESSOR] placeholders or focus on the student\'s genuine interest'
      },
      'missing_reflection': {
        avoid: 'putting insights into the student\'s mouth',
        instead: 'pose Socratic questions in the teaching section, or create structural space for reflection'
      },
      'missing_stakes': {
        avoid: 'fabricating consequences or emotional weight',
        instead: 'use "What was at risk?" framing or highlight existing stakes more effectively'
      },
      'missing_resolution': {
        avoid: 'inventing outcomes or lessons learned',
        instead: 'end with an open question or pivot to what the experience means NOW'
      }
    };

    // Build the injection block
    const lines: string[] = [
      '',
      '═══════════════════════════════════════════════════════════',
      '⚠️ CONTEXT AWARENESS - WHAT TO PRESERVE & WHAT TO AVOID',
      '═══════════════════════════════════════════════════════════',
      '',
      `Quality Score: ${analysis.context_quality_score}/100`,
      `Assessment: ${analysis.quality_summary}`,
      ''
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 1: STRENGTHS TO PRESERVE (if any)
    // ─────────────────────────────────────────────────────────────────────────
    if (analysis.strengths && analysis.strengths.length > 0) {
      lines.push('✨ STRENGTHS TO PRESERVE & AMPLIFY:');
      lines.push('');
      analysis.strengths.slice(0, 3).forEach((strength, i) => {
        lines.push(`${i + 1}. ${strength.strength_type.replace(/_/g, ' ').toUpperCase()}`);
        lines.push(`   Evidence: "${strength.evidence_text.substring(0, 80)}${strength.evidence_text.length > 80 ? '...' : ''}"`);
        lines.push(`   Why it works: ${strength.why_effective}`);
        lines.push(`   💡 Amplify: ${strength.amplification_hint}`);
        lines.push('');
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 2: GAPS WITH WORKAROUNDS
    // ─────────────────────────────────────────────────────────────────────────
    if (criticalGaps.length > 0) {
      lines.push('🚧 CONTEXT GAPS - WHAT YOU CAN DO:');
      lines.push('');

      criticalGaps.forEach((gap, i) => {
        // Use Sonnet's workaround if available, otherwise use default
        const hasWorkaround = gap.workaround_suggestion && gap.workaround_suggestion.length > 0;
        const defaultAction = gapToAction[gap.gap_type] || {
          avoid: 'inventing details not in the essay',
          instead: 'work with what\'s present'
        };

        lines.push(`GAP ${i + 1} [Priority ${gap.priority}/10]: ${gap.gap_type.replace(/_/g, ' ').toUpperCase()}`);
        lines.push(`   Location: "${gap.trigger_text.substring(0, 50)}${gap.trigger_text.length > 50 ? '...' : ''}"`);
        lines.push(`   ❌ DO NOT: ${defaultAction.avoid}`);

        if (hasWorkaround) {
          // Use Sonnet's specific workaround
          lines.push(`   ✓ WORKAROUND: ${gap.workaround_suggestion}`);
        } else {
          // Use default fallback
          lines.push(`   ✓ INSTEAD: ${defaultAction.instead}`);
        }
        lines.push('');
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 3: SUMMARY INSTRUCTIONS
    // ─────────────────────────────────────────────────────────────────────────
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('GENERATION RULES:');
    lines.push('');
    lines.push('1. BUILD ON STRENGTHS: Your suggestions should amplify what\'s working');
    lines.push('2. WORK AROUND GAPS: Use the workarounds above, not invented content');
    lines.push('3. USE [BRACKETS]: For content only the student can provide, use [YOUR SPECIFIC...]');
    lines.push('4. PRIORITIZE STRUCTURE: When content is thin, improve flow/pacing/clarity');
    lines.push('5. SOCRATIC TEACHING: Surface gaps as questions in the teaching section');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Convert Sonnet gaps to a context gathering request
   */
  private convertSonnetGapsToGatheringRequest(
    gaps: SonnetGap[],
    primaryIssue?: IssueContext
  ): ContextGatheringRequest {
    // Take top 3 gaps and convert to questions
    const topGaps = gaps.slice(0, 3);

    return {
      issue_id: primaryIssue?.issue_id || 'context_gaps',
      issue_quote: primaryIssue?.quote || '',
      why_we_need_context: 'To give you suggestions that use YOUR specific details instead of generic examples',
      questions: topGaps.map((gap, i) => ({
        question_id: `sonnet_q${i + 1}`,
        question_text: gap.suggested_question,
        question_type: this.mapGapTypeToQuestionType(gap.gap_type),
        why_this_helps: gap.impact_explanation,
        example_weak_answer: 'A vague or generic response',
        example_strong_answer: 'A specific, detailed response with concrete examples'
      })),
      max_questions: Math.min(3, topGaps.length),
      estimated_time: '2-3 minutes',
      what_we_can_do_without: 'Generate suggestions, but they may use generic examples instead of your real experiences'
    };
  }

  /**
   * Map Sonnet gap types to question types
   */
  private mapGapTypeToQuestionType(gapType: string): 'specific_moment' | 'sensory_detail' | 'emotional_reaction' | 'insight' | 'failed_attempt' | 'person_detail' {
    const mapping: Record<string, 'specific_moment' | 'sensory_detail' | 'emotional_reaction' | 'insight' | 'failed_attempt' | 'person_detail'> = {
      'missing_concrete_detail': 'specific_moment',
      'missing_emotional_depth': 'emotional_reaction',
      'missing_specific_example': 'specific_moment',
      'missing_research': 'insight',
      'missing_reflection': 'insight',
      'missing_stakes': 'emotional_reaction',
      'missing_resolution': 'specific_moment'
    };
    return mapping[gapType] || 'specific_moment';
  }

  /**
   * Create user message based on Sonnet analysis
   */
  private createSonnetBasedUserMessage(
    analysis: SonnetContextAnalysis,
    mode: 'required' | 'optional' = 'required'
  ): string {
    const topGap = analysis.gaps[0];

    if (mode === 'required') {
      return `Your essay scores ${analysis.context_quality_score}/100 on context quality. ` +
        `I noticed it ${topGap ? `needs more ${topGap.gap_type.replace(/_/g, ' ')}` : 'could use more specific details'}. ` +
        `Let me ask you a few quick questions so I can give you suggestions that use YOUR real experiences, ` +
        `not generic examples.`;
    }

    return `I have suggestions for you! They're based on what I can see in your essay, ` +
      `but they could be even better if you tell me more about ${topGap?.gap_type.replace(/_/g, ' ') || 'your specific experience'}. ` +
      `Want to answer a few quick questions?`;
  }

  /**
   * Identify invented elements from Sonnet gaps
   */
  private identifyInventedElementsFromSonnet(gaps: SonnetGap[]): {
    element: string;
    why_invented: string;
    would_be_better_if: string;
  }[] {
    return gaps.slice(0, 3).map(gap => ({
      element: gap.gap_type.replace(/_/g, ' '),
      why_invented: gap.impact_explanation,
      would_be_better_if: `Student answers: "${gap.suggested_question}"`
    }));
  }
}

// ============================================================================
// EXPORTS
// All types, interfaces, and constants are exported at their definitions above.
// TypeSpecificSuggestionService is the main class export.
// TYPE_SUGGESTION_CONSTRAINTS contains all 14 type-specific constraint configs.
// PERFORMATIVE_AUTHENTICITY_PATTERNS contains patterns to avoid in suggestions.
// ============================================================================
