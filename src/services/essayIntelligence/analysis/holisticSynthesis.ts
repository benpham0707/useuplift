/**
 * Holistic Synthesis Service — Layer 3.75
 *
 * Single Sonnet call after L3's walk completes. Reads ALL sentence-level
 * understanding and synthesizes 10 holistic sections in one call.
 *
 * This layer's unique advantage: the walk saw BACKWARD (sequential, paragraph
 * by paragraph). L3.75 sees EVERYTHING simultaneously — every sentence's
 * purpose, every connection, the complete narrative arc.
 *
 * The walk's `holisticEvolution` accumulator is a starting scaffold.
 * L3.75 confirms, deepens, or corrects it from the full picture.
 *
 * Produces the authoritative holistic profile that the Profile Manager's
 * HolisticMutator.applyFullSupersession() writes into the EssayProfile.
 *
 * Spec: docs/plan-sections/02-layer-specs.md (L3.75 section)
 * Types: src/services/essayIntelligence/profileTypes.ts (HolisticSynthesisOutput)
 */

import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';
import { jsonrepair } from 'jsonrepair';
import type {
  HolisticSynthesisOutput,
  VoiceIdentity,
  VoiceMap,
  VoiceMapDimension,
  VoiceMapDimensionWithDomains,
  VoiceMapDimensionWithQualities,
  VoiceShift,
  VoiceObservation,
  CodeSwitchEvent,
  EmotionalTopography,
  MomentEarnednessMap,
  EarnedMoment,
  EarningMechanism,
  ThematicArchitecture,
  NarrativeStrategy,
  CharacterRevelation,
  CraftAssessment,
  CrossDimensionEntanglement,
  AdmissionsPositioning,
  EssayProfile,
  HolisticDimension,
  TonalQuality,
  VoiceDimension,
  EarningMechanismType,
  ThreadStrength,
} from '../profileTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET = 'claude-sonnet-4-5-20250929';
const SYNTHESIS_TEMPERATURE = 0.4;
/** Large output — 10 holistic sections with rich structured data */
const SYNTHESIS_MAX_TOKENS = 12000;
/** 3 minutes for a large single call */
const SYNTHESIS_TIMEOUT_MS = 180_000;

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Input to the holistic synthesis service.
 * Assembled by the orchestrator after L3 walk completes.
 */
export interface HolisticSynthesisInput {
  /** The essay text with paragraph markers [P0], [P1], etc. */
  essayText: string;
  /** Complete profile after L3 walk (all paragraph/sentence understanding populated) */
  profile: EssayProfile;
  /**
   * L3's holistic evolution accumulator — starting scaffold.
   * Only 4 fields: centralThesis, thesisConfidence, voiceSignature, arcMomentum.
   */
  holisticEvolution: {
    centralThesis?: string;
    thesisConfidence?: number;
    voiceSignature?: string;
    arcMomentum?: string;
  };
}

// ============================================================================
// OUTPUT TYPES
// ============================================================================

/**
 * Complete result from L3.75 holistic synthesis.
 * The `synthesis` field maps directly to the profile via HolisticMutator.applyFullSupersession().
 */
export interface HolisticSynthesisResult {
  /** The 10 holistic section outputs — writes directly into profile */
  synthesis: HolisticSynthesisOutput;
  /** Cost of the Sonnet call in USD */
  cost: number;
  /** Token usage breakdown */
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  };
  /** Wall-clock time in milliseconds */
  timingMs: number;
}

// ============================================================================
// SYSTEM PROMPT (BLOCK 1 — CACHEABLE)
// ============================================================================

/**
 * Static system prompt — cached across L3.75 calls for the same or different essays.
 * Contains role definition, output schema, quality standards, and examples.
 */
const SYSTEM_PROMPT = `You are an expert essay holistic synthesizer. You have been given the COMPLETE sentence-level understanding of an essay from a deep sequential walk. Your task is to synthesize 10 holistic sections that capture the essay as a WHOLE.

The sequential walk saw each paragraph in order and built understanding forward. YOUR unique advantage: you see EVERYTHING simultaneously. You can trace connections the walk could not — how a voice shift in paragraph 4 mirrors the emotional arc that started in paragraph 1, how an image in the opening becomes a metaphor by the closing.

=== OUTPUT SCHEMA ===

Return a single JSON object with EXACTLY these 10 top-level keys. Every field must match the schema precisely.

{
  "voiceIdentity": {
    "signature": "<one-paragraph description of the writer's voice — be specific and vivid, not generic>",
    "register": "<primary register: conversational, academic, lyrical, etc.>",
    "distinctivePatterns": ["<pattern 1>", "<pattern 2>", "..."],
    "evolution": "<how voice evolves through the essay — narrative of voice movement>",
    "authenticVsPerformed": [
      {
        "location": [<paragraph>, <sentence>],
        "assessment": "authentic" | "performed",
        "reasoning": "<why this moment reads as genuine or rehearsed>"
      }
    ]
  },

  "voiceMap": {
    "register": {
      "baseline": "<the essay's dominant register>",
      "observations": [
        {
          "location": { "paragraph": <n>, "sentenceRange": [<start>, <end>] },
          "observation": "<what register is doing here>",
          "dimensions": ["register"]
        }
      ]
    },
    "vocabularyFingerprint": {
      "baseline": "<dominant vocabulary character>",
      "observations": [<same structure as register observations, dimensions: ["vocabulary"]>],
      "domains": [
        {
          "domain": "<vocabulary domain name>",
          "exampleWords": ["<word1>", "<word2>"],
          "paragraphs": [<paragraph indices>]
        }
      ]
    },
    "sentenceRhythm": {
      "baseline": "<dominant sentence rhythm/cadence>",
      "observations": [<same structure, dimensions: ["rhythm"]>]
    },
    "perspectiveDistance": {
      "baseline": "<how close the narrator typically stands to events>",
      "observations": [<same structure, dimensions: ["perspective"]>]
    },
    "tonalDisposition": {
      "baseline": "<dominant tonal coloring>",
      "observations": [<same structure, dimensions: ["tonal_disposition"]>],
      "dominantQualities": ["<TonalQuality values: humor, irony, earnestness, irreverence, solemnity, self_awareness, detachment, tenderness, defiance>"]
    },
    "shifts": [
      {
        "location": {
          "paragraph": <n>,
          "sentence": <n or omit>,
          "boundary": "paragraph_boundary" | "mid_paragraph" | "sentence_boundary"
        },
        "dimensions": ["<which VoiceDimension(s) shift: register, vocabulary, rhythm, perspective, tonal_disposition>"],
        "fromDescription": "<what voice was before>",
        "toDescription": "<what voice became>",
        "intentionality": {
          "assessment": "intentional" | "unintentional" | "ambiguous",
          "confidence": <0-1, CRITICAL: below 0.6 means present as question not assertion>,
          "reasoning": "<concrete evidence for this assessment>"
        },
        "servesFunction": "<what the shift achieves, e.g. 'emotional transition', 'thematic pivot'> or null",
        "entanglementRef": "<ID of cross-dimension entanglement if this shift IS a move in another dimension> or null"
      }
    ],
    "codeSwitching": [
      {
        "location": { "paragraph": <n>, "sentence": <n> },
        "language": "<language or register being switched to>",
        "trigger": "<what triggered the switch>",
        "culturalFunction": "<the cultural function the switch serves>",
        "text": "<the code-switched passage>"
      }
    ]
  },

  "emotionalTopography": {
    "arcTrajectory": "<how emotion moves from opening to close — the emotional journey>",
    "peakMoments": [
      {
        "location": [<paragraph>, <sentence>],
        "emotion": "<the emotion>",
        "intensity": "low" | "moderate" | "high" | "peak"
      }
    ],
    "undertones": ["<emotions felt but not stated>"],
    "emotionalProgression": [
      {
        "paragraph": <n>,
        "register": "<emotional register at this paragraph>",
        "shift": "<how emotion changed from previous paragraph>"
      }
    ],
    "showVsTell": [
      {
        "location": [<paragraph>, <sentence>],
        "assessment": "shown" | "told" | "mixed",
        "detail": "<what is shown or told and how>"
      }
    ]
  },

  "momentEarnednessMap": {
    "moments": [
      {
        "location": { "paragraph": <n>, "sentence": <n> },
        "momentType": "emotional" | "intellectual" | "humorous" | "subversive",
        "description": "<what the moment IS>",
        "payload": "<the emotion, idea, or effect the moment carries>",
        "mechanisms": [
          {
            "type": "sensory_grounding" | "emotional_setup" | "stakes_establishment" | "character_revelation" | "thematic_preparation" | "intellectual_scaffolding" | "comedic_subversive_setup",
            "location": { "paragraph": <n>, "sentence": <n or omit>, "sentenceRange": [<start>, <end>] },
            "contribution": "<SPECIFIC description: what this passage does for the moment. Name the exact words, images, or moves.>"
          }
        ],
        "gaps": ["<what is MISSING — specific mechanism types the essay lacks for this moment>"]
      }
    ],
    "structuralObservation": "<essay-level summary of setup-payoff architecture — NOT a score, a structural observation>"
  },

  "thematicArchitecture": {
    "centralThesis": "<the essay's central thesis>",
    "thesisConfidence": <0-1>,
    "thesisEvolution": "<how the thesis emerges and crystallizes through the essay>",
    "threads": [
      {
        "thread": "<thread name>",
        "introducedAt": { "paragraph": <n>, "sentence": <n or omit> },
        "appearances": [{ "paragraph": <n>, "sentence": <n or omit> }],
        "strength": "dominant" | "supporting" | "hinted" | "dropped"
      }
    ],
    "subtext": "<implied but never stated — the essay's hidden argument>",
    "contradictions": ["<productive contradictions/tensions that drive the essay>"]
  },

  "narrativeStrategy": {
    "primaryStrategy": "<the primary narrative approach and WHY it serves this story>",
    "strategyRationale": "<rationale for this strategy — what alternatives were available and why this one works>",
    "pivotPoints": [
      {
        "location": { "paragraph": <n>, "sentence": <n or omit> },
        "description": "<what pivots and why it matters>"
      }
    ],
    "pacingAnalysis": "<how pacing works — acceleration, deceleration, rhythm>",
    "structuralChoices": ["<significant structural choices and their effects>"]
  },

  "characterRevelation": {
    "writerPortrait": "<who is this writer — the person behind the words, not the essay>",
    "valuesRevealed": ["<values SHOWN not told — what does this person care about?>"],
    "growthArc": "<growth arc detected in the essay>",
    "intellectualFingerprint": "<how this person thinks — their cognitive style>",
    "blindSpots": ["<what they might not see about themselves or their essay>"]
  },

  "craftAssessment": {
    "strengthSignatures": [
      {
        "quality": "<name of the craft strength>",
        "evidence": "<specific textual evidence>",
        "paragraphs": [<paragraph indices>]
      }
    ],
    "growthEdges": [
      {
        "quality": "<name of the growth area>",
        "description": "<what it looks like and why it's a growth edge>",
        "paragraphs": [<paragraph indices>]
      }
    ],
    "imageSystem": "<image/metaphor system analysis — coherence, resonance, evolution>",
    "sentencePatterns": "<sentence-level patterns — rhythm, length variation, opening patterns>",
    "wordPatterns": "<word-level patterns — favorite words, register consistency, precision>"
  },

  "admissionsPositioning": {
    "tellabilitySummary": "<30-second AO pitch — what would an admissions officer say about this essay to a colleague?>",
    "distinctivenessFactors": ["<what makes this essay non-interchangeable>"],
    "institutionalFit": "<what kinds of institutions this essay signals fit for>",
    "redFlags": ["<anything that would concern an admissions reader>"],
    "memorability": "<memorability assessment — will this be remembered after reading 50 essays?>",
    "portfolioPosition": "<how this essay positions within a broader portfolio>"
  },

  "entanglements": [
    {
      "id": "<unique ID, e.g. 'ent-1', 'ent-2'>",
      "dimensions": ["<HolisticDimension values: voice, emotion, theme, narrative, character, craft, admissions, structure>"],
      "location": { "paragraph": <n>, "sentence": <n or omit> },
      "description": "<WHAT happens at the INTERSECTION — not 'voice and theme co-occur in P3' but 'P3S4's voice shift from observational to intimate IS the thematic pivot from public value to private meaning'>",
      "crossRefs": ["<which dimension sections should reference this entanglement>"]
    }
  ]
}

=== QUALITY STANDARDS ===

VOICE MAP:
- Map ALL 5 dimensions across the essay with specific locations, not just "formal in intro, informal in middle."
- For each shift, assess intentionality with EVIDENCE. What signals intentionality?
  * Consistent patterns around a specific topic (intentional)
  * Alignment with structural boundaries (intentional)
  * Serves an identifiable purpose in another dimension (intentional)
  * Random fluctuation without structural logic (unintentional)
  * Oscillation between registers without committing (ambiguous)
- Below 0.6 confidence: present as a QUESTION, not assertion. The reasoning should explain what evidence is missing.
- Include stability regions — passages where voice holds steady and what characterizes it there.

EARNED-NESS MAP:
- For EACH significant moment, trace SPECIFIC arrows backward through SPECIFIC mechanism types.
- Name WHICH earlier passage, WHAT mechanism type, and HOW it earns the later moment.
- Example of rigorous earned-ness: "P2S3's sensory grounding ('cracked leather of the shop counter') establishes the physical world; P2S5's stakes_establishment ('everything we owned appraised') makes the economic risk visceral; P3S1's character_revelation ('my grandfather's hands trembled but his voice didn't') shows composure under pressure. Three mechanisms converge on P4S2's emotional peak."
- Gaps are AS IMPORTANT as mechanisms. If a moment claims devastation but no earlier passage established emotional proximity to the object, name that gap.
- structuralObservation should describe the essay's overall setup-payoff architecture quality.

ENTANGLEMENTS:
- Find moments where dimensions INTERSECT — where the voice shift IS the thematic pivot, where the emotional peak IS the character revelation.
- NOT just dimensions that co-occur in the same paragraph.
- Each must have a specific location, specific dimensions, and specific cross-references.
- Include significance level for each.

GENERAL:
- Be specific. Use paragraph and sentence numbers. Quote text where it grounds your observation.
- The walk's holistic evolution is a STARTING POINT. Confirm what's accurate, deepen what's shallow, correct what's wrong.
- All paragraph indices are 0-based.
- All sentence indices are 0-based within their paragraph.`;

// ============================================================================
// CONTEXT BUILDERS
// ============================================================================

/**
 * Build the serialized understanding context from the profile.
 * This is BLOCK 2 content — essay-specific, cacheable across L3.75 + L3.5.
 */
function buildUnderstandingContext(profile: EssayProfile): string {
  const sections: string[] = [];

  // ── Essay text with markers ──
  // (provided separately in the input, but we build the paragraph understanding here)

  // ── Paragraph and sentence understanding ──
  sections.push('=== PARAGRAPH-BY-PARAGRAPH UNDERSTANDING ===\n');
  for (const para of profile.paragraphs) {
    sections.push(`[P${para.index}] "${truncate(para.text, 120)}"`);
    if (para.understanding) {
      sections.push(`  Role: ${para.understanding.role}`);
      sections.push(`  Function: ${para.understanding.function}`);
      sections.push(`  Narrative contribution: ${para.understanding.narrativeContribution}`);
      sections.push(`  Emotional register: ${para.understanding.emotionalRegister.dominantEmotion} (depth: ${para.understanding.emotionalRegister.depth}, show/tell: ${para.understanding.emotionalRegister.showVsTell})`);
      sections.push(`  Craft: rhythm=${para.understanding.craftProfile.rhythmPattern}, imagery=${para.understanding.craftProfile.imageUsage}, voice=${para.understanding.craftProfile.voiceConsistency}`);
    }

    // Sentence-level understanding
    for (const sent of para.sentences) {
      if (sent.understanding) {
        const funcs = sent.understanding.observedFunctions.map(f => f.observation).join('; ');
        const intents = sent.understanding.inferredIntents.map(i => i.observation).join('; ');
        const narrative = sent.understanding.narrativeContributions.map(n => n.observation).join('; ');
        const craft = sent.understanding.craft;
        sections.push(`  [P${para.index}S${sent.index}] "${truncate(sent.text, 80)}"`);
        sections.push(`    Functions: ${funcs || 'not yet analyzed'}`);
        if (intents) sections.push(`    Intents: ${intents}`);
        if (narrative) sections.push(`    Narrative: ${narrative}`);
        if (craft.notableWords.length > 0) {
          sections.push(`    Notable words: ${craft.notableWords.map(w => `"${w.word}" (${w.significance})`).join(', ')}`);
        }
        if (sent.understanding.rhetoricalFunctions.length > 0) {
          sections.push(`    Rhetorical: ${sent.understanding.rhetoricalFunctions.join(', ')}`);
        }
      }
    }
    sections.push('');
  }

  // ── Connection graph ──
  if (profile.connections.all.length > 0) {
    sections.push('=== CONNECTION GRAPH ===\n');
    for (const conn of profile.connections.all) {
      sections.push(`  [P${conn.from[0]}S${conn.from[1]}] → [P${conn.to[0]}S${conn.to[1]}] (${conn.type}): ${conn.description} [confidence: ${conn.confidence}]`);
    }

    if (profile.connections.imageRecurrences.length > 0) {
      sections.push('\nImage Recurrences:');
      for (const img of profile.connections.imageRecurrences) {
        sections.push(`  "${img.image}" appears at: ${img.locations.map(l => `P${l[0]}S${l[1]}`).join(', ')}`);
      }
    }

    if (profile.connections.narrativeArcMap.length > 0) {
      sections.push('\nNarrative Arc Map:');
      for (const arc of profile.connections.narrativeArcMap) {
        sections.push(`  ${arc.role} at P${arc.location[0]}S${arc.location[1]}`);
      }
    }
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Build the holistic evolution scaffold — BLOCK 3 content (not cached).
 * This includes the walk's incremental observations as a starting point.
 */
function buildEvolutionScaffold(
  evolution: HolisticSynthesisInput['holisticEvolution'],
): string {
  const parts: string[] = [];
  parts.push('=== WALK HOLISTIC EVOLUTION (starting scaffold — confirm, deepen, or correct) ===\n');

  if (evolution.centralThesis) {
    parts.push(`Central thesis (walk's reading): ${evolution.centralThesis}`);
  }
  if (evolution.thesisConfidence !== undefined) {
    parts.push(`Thesis confidence: ${evolution.thesisConfidence}`);
  }
  if (evolution.voiceSignature) {
    parts.push(`Voice signature (walk's reading): ${evolution.voiceSignature}`);
  }
  if (evolution.arcMomentum) {
    parts.push(`Arc momentum: ${evolution.arcMomentum}`);
  }

  if (!evolution.centralThesis && !evolution.voiceSignature && !evolution.arcMomentum) {
    parts.push('No incremental holistic observations from the walk. Synthesize from scratch.');
  }

  parts.push('\nSynthesize the complete holistic profile from the ground up. The walk\'s incremental observations above are a starting point — confirm what\'s accurate, deepen what\'s shallow, correct what\'s wrong using the full understanding.\n');
  parts.push('Return ONLY valid JSON matching the schema above. No markdown, no explanation, no preamble.');

  return parts.join('\n');
}

/**
 * Truncate text to a max length for context building.
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

// ============================================================================
// JSON PARSING & VALIDATION
// ============================================================================

/**
 * Parse the LLM response into HolisticSynthesisOutput.
 * Uses a robust fallback chain: direct parse → jsonrepair → error.
 */
function parseResponse(raw: unknown): HolisticSynthesisOutput {
  // If callClaudeWithRetry with useJsonMode already parsed it, raw is an object
  if (typeof raw === 'object' && raw !== null) {
    return validateAndCoerce(raw as Record<string, unknown>);
  }

  // If raw is a string (shouldn't happen with useJsonMode, but defensive)
  if (typeof raw === 'string') {
    let parsed: unknown;

    // Try direct parse
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try jsonrepair
      try {
        const repaired = jsonrepair(raw);
        parsed = JSON.parse(repaired);
        console.warn('[HolisticSynthesis] jsonrepair succeeded — response had malformed JSON');
      } catch {
        throw new Error('[HolisticSynthesis] Failed to parse JSON response after repair attempt');
      }
    }

    return validateAndCoerce(parsed as Record<string, unknown>);
  }

  throw new Error(`[HolisticSynthesis] Unexpected response type: ${typeof raw}`);
}

/**
 * Validate the parsed output has the required sections and coerce types
 * where the LLM may have minor deviations from the schema.
 *
 * Does NOT silently default to fake data — if a section is completely missing,
 * we throw. But we DO coerce minor issues like missing optional fields.
 */
function validateAndCoerce(raw: Record<string, unknown>): HolisticSynthesisOutput {
  const requiredSections = [
    'voiceIdentity', 'voiceMap', 'emotionalTopography',
    'momentEarnednessMap', 'thematicArchitecture', 'narrativeStrategy',
    'characterRevelation', 'craftAssessment', 'admissionsPositioning',
    'entanglements',
  ] as const;

  const missing = requiredSections.filter(s => !(s in raw));
  if (missing.length > 0) {
    throw new Error(
      `[HolisticSynthesis] Missing required sections: ${missing.join(', ')}. ` +
      `Received keys: ${Object.keys(raw).join(', ')}`
    );
  }

  // Coerce each section
  const voiceIdentity = coerceVoiceIdentity(raw.voiceIdentity as Record<string, unknown>);
  const voiceMap = coerceVoiceMap(raw.voiceMap as Record<string, unknown>);
  const emotionalTopography = coerceEmotionalTopography(raw.emotionalTopography as Record<string, unknown>);
  const momentEarnednessMap = coerceEarnednessMap(raw.momentEarnednessMap as Record<string, unknown>);
  const thematicArchitecture = coerceThematicArchitecture(raw.thematicArchitecture as Record<string, unknown>);
  const narrativeStrategy = coerceNarrativeStrategy(raw.narrativeStrategy as Record<string, unknown>);
  const characterRevelation = coerceCharacterRevelation(raw.characterRevelation as Record<string, unknown>);
  const craftAssessment = coerceCraftAssessment(raw.craftAssessment as Record<string, unknown>);
  const admissionsPositioning = coerceAdmissionsPositioning(raw.admissionsPositioning as Record<string, unknown>);
  const entanglements = coerceEntanglements(raw.entanglements as unknown[]);

  return {
    voiceIdentity,
    voiceMap,
    emotionalTopography,
    momentEarnednessMap,
    thematicArchitecture,
    narrativeStrategy,
    characterRevelation,
    craftAssessment,
    admissionsPositioning,
    entanglements,
  };
}

// ── Section coercion helpers ──

function coerceVoiceIdentity(raw: Record<string, unknown>): VoiceIdentity {
  return {
    signature: String(raw.signature ?? ''),
    register: String(raw.register ?? ''),
    distinctivePatterns: ensureStringArray(raw.distinctivePatterns),
    evolution: String(raw.evolution ?? ''),
    authenticVsPerformed: ensureArray(raw.authenticVsPerformed).map((item: Record<string, unknown>) => ({
      location: ensureTuple(item.location) as [number, number],
      assessment: (item.assessment === 'performed' ? 'performed' : 'authentic') as 'authentic' | 'performed',
      reasoning: String(item.reasoning ?? ''),
    })),
  };
}

function coerceVoiceMap(raw: Record<string, unknown>): VoiceMap {
  return {
    register: coerceVoiceMapDimension(raw.register as Record<string, unknown>),
    vocabularyFingerprint: coerceVoiceMapDimensionWithDomains(raw.vocabularyFingerprint as Record<string, unknown>),
    sentenceRhythm: coerceVoiceMapDimension(raw.sentenceRhythm as Record<string, unknown>),
    perspectiveDistance: coerceVoiceMapDimension(raw.perspectiveDistance as Record<string, unknown>),
    tonalDisposition: coerceVoiceMapDimensionWithQualities(raw.tonalDisposition as Record<string, unknown>),
    shifts: ensureArray(raw.shifts).map(coerceVoiceShift),
    codeSwitching: ensureArray(raw.codeSwitching).map(coerceCodeSwitchEvent),
  };
}

function coerceVoiceMapDimension(raw: Record<string, unknown> | undefined): VoiceMapDimension {
  if (!raw) return { baseline: '', observations: [] };
  return {
    baseline: String(raw.baseline ?? ''),
    observations: ensureArray(raw.observations).map(coerceVoiceObservation),
  };
}

function coerceVoiceMapDimensionWithDomains(raw: Record<string, unknown> | undefined): VoiceMapDimensionWithDomains {
  const base = coerceVoiceMapDimension(raw);
  return {
    ...base,
    domains: ensureArray(raw?.domains).map((d: Record<string, unknown>) => ({
      domain: String(d.domain ?? ''),
      exampleWords: ensureStringArray(d.exampleWords),
      paragraphs: ensureNumberArray(d.paragraphs),
    })),
  };
}

function coerceVoiceMapDimensionWithQualities(raw: Record<string, unknown> | undefined): VoiceMapDimensionWithQualities {
  const base = coerceVoiceMapDimension(raw);
  const validQualities: TonalQuality[] = [
    'humor', 'irony', 'earnestness', 'irreverence', 'solemnity',
    'self_awareness', 'detachment', 'tenderness', 'defiance',
  ];
  const rawQualities = ensureStringArray(raw?.dominantQualities);
  return {
    ...base,
    dominantQualities: rawQualities.filter(q => validQualities.includes(q as TonalQuality)) as TonalQuality[],
  };
}

function coerceVoiceObservation(item: Record<string, unknown>): VoiceObservation {
  const loc = item.location as Record<string, unknown> | undefined;
  const validDimensions: VoiceDimension[] = ['register', 'vocabulary', 'rhythm', 'perspective', 'tonal_disposition'];
  const rawDims = ensureStringArray(item.dimensions);
  return {
    location: {
      paragraph: Number(loc?.paragraph ?? 0),
      ...(loc?.sentenceRange ? { sentenceRange: ensureTuple(loc.sentenceRange) as [number, number] } : {}),
    },
    observation: String(item.observation ?? ''),
    dimensions: rawDims.filter(d => validDimensions.includes(d as VoiceDimension)) as VoiceDimension[],
  };
}

function coerceVoiceShift(item: Record<string, unknown>): VoiceShift {
  const loc = item.location as Record<string, unknown> | undefined;
  const intentionality = item.intentionality as Record<string, unknown> | undefined;
  const validDimensions: VoiceDimension[] = ['register', 'vocabulary', 'rhythm', 'perspective', 'tonal_disposition'];
  const rawDims = ensureStringArray(item.dimensions);
  const validBoundaries = ['paragraph_boundary', 'mid_paragraph', 'sentence_boundary'] as const;
  const rawBoundary = String(loc?.boundary ?? 'paragraph_boundary');
  const boundary = validBoundaries.includes(rawBoundary as typeof validBoundaries[number])
    ? rawBoundary as typeof validBoundaries[number]
    : 'paragraph_boundary' as const;

  const validAssessments = ['intentional', 'unintentional', 'ambiguous'] as const;
  const rawAssessment = String(intentionality?.assessment ?? 'ambiguous');
  const assessment = validAssessments.includes(rawAssessment as typeof validAssessments[number])
    ? rawAssessment as typeof validAssessments[number]
    : 'ambiguous' as const;

  const result: VoiceShift = {
    location: {
      paragraph: Number(loc?.paragraph ?? 0),
      ...(loc?.sentence !== undefined && loc?.sentence !== null ? { sentence: Number(loc.sentence) } : {}),
      boundary,
    },
    dimensions: rawDims.filter(d => validDimensions.includes(d as VoiceDimension)) as VoiceDimension[],
    fromDescription: String(item.fromDescription ?? ''),
    toDescription: String(item.toDescription ?? ''),
    intentionality: {
      assessment,
      confidence: clampNumber(Number(intentionality?.confidence ?? 0.5), 0, 1),
      reasoning: String(intentionality?.reasoning ?? ''),
    },
  };

  if (item.servesFunction && item.servesFunction !== 'null') {
    result.servesFunction = String(item.servesFunction);
  }
  if (item.entanglementRef && item.entanglementRef !== 'null') {
    result.entanglementRef = String(item.entanglementRef);
  }

  return result;
}

function coerceCodeSwitchEvent(item: Record<string, unknown>): CodeSwitchEvent {
  const loc = item.location as Record<string, unknown> | undefined;
  return {
    location: {
      paragraph: Number(loc?.paragraph ?? 0),
      sentence: Number(loc?.sentence ?? 0),
    },
    language: String(item.language ?? ''),
    trigger: String(item.trigger ?? ''),
    culturalFunction: String(item.culturalFunction ?? ''),
    text: String(item.text ?? ''),
  };
}

function coerceEmotionalTopography(raw: Record<string, unknown>): EmotionalTopography {
  const validIntensities = ['low', 'moderate', 'high', 'peak'] as const;
  const validShowTell = ['shown', 'told', 'mixed'] as const;

  return {
    arcTrajectory: String(raw.arcTrajectory ?? ''),
    peakMoments: ensureArray(raw.peakMoments).map((item: Record<string, unknown>) => {
      const rawIntensity = String(item.intensity ?? 'moderate');
      return {
        location: ensureTuple(item.location) as [number, number],
        emotion: String(item.emotion ?? ''),
        intensity: (validIntensities.includes(rawIntensity as typeof validIntensities[number])
          ? rawIntensity
          : 'moderate') as typeof validIntensities[number],
      };
    }),
    undertones: ensureStringArray(raw.undertones),
    emotionalProgression: ensureArray(raw.emotionalProgression).map((item: Record<string, unknown>) => ({
      paragraph: Number(item.paragraph ?? 0),
      register: String(item.register ?? ''),
      shift: String(item.shift ?? ''),
    })),
    showVsTell: ensureArray(raw.showVsTell).map((item: Record<string, unknown>) => {
      const rawAssessment = String(item.assessment ?? 'mixed');
      return {
        location: ensureTuple(item.location) as [number, number],
        assessment: (validShowTell.includes(rawAssessment as typeof validShowTell[number])
          ? rawAssessment
          : 'mixed') as typeof validShowTell[number],
        detail: String(item.detail ?? ''),
      };
    }),
  };
}

function coerceEarnednessMap(raw: Record<string, unknown>): MomentEarnednessMap {
  return {
    moments: ensureArray(raw.moments).map(coerceEarnedMoment),
    structuralObservation: String(raw.structuralObservation ?? ''),
  };
}

function coerceEarnedMoment(item: Record<string, unknown>): EarnedMoment {
  const loc = item.location as Record<string, unknown> | undefined;
  const validTypes = ['emotional', 'intellectual', 'humorous', 'subversive'] as const;
  const rawType = String(item.momentType ?? 'emotional');

  return {
    location: {
      paragraph: Number(loc?.paragraph ?? 0),
      sentence: Number(loc?.sentence ?? 0),
    },
    momentType: (validTypes.includes(rawType as typeof validTypes[number])
      ? rawType
      : 'emotional') as typeof validTypes[number],
    description: String(item.description ?? ''),
    payload: String(item.payload ?? ''),
    mechanisms: ensureArray(item.mechanisms).map(coerceEarningMechanism),
    gaps: ensureStringArray(item.gaps),
  };
}

function coerceEarningMechanism(item: Record<string, unknown>): EarningMechanism {
  const validMechanisms: EarningMechanismType[] = [
    'sensory_grounding', 'emotional_setup', 'stakes_establishment',
    'character_revelation', 'thematic_preparation',
    'intellectual_scaffolding', 'comedic_subversive_setup',
  ];
  const rawType = String(item.type ?? 'emotional_setup');
  const loc = item.location as Record<string, unknown> | undefined;

  const result: EarningMechanism = {
    type: (validMechanisms.includes(rawType as EarningMechanismType)
      ? rawType
      : 'emotional_setup') as EarningMechanismType,
    location: {
      paragraph: Number(loc?.paragraph ?? 0),
      ...(loc?.sentence !== undefined && loc?.sentence !== null ? { sentence: Number(loc.sentence) } : {}),
      ...(loc?.sentenceRange ? { sentenceRange: ensureTuple(loc.sentenceRange) as [number, number] } : {}),
    },
    contribution: String(item.contribution ?? ''),
  };

  if (item.connectionRef) {
    result.connectionRef = String(item.connectionRef);
  }

  return result;
}

function coerceThematicArchitecture(raw: Record<string, unknown>): ThematicArchitecture {
  const validStrengths: ThreadStrength[] = ['dominant', 'supporting', 'hinted', 'dropped'];

  return {
    centralThesis: String(raw.centralThesis ?? ''),
    thesisConfidence: clampNumber(Number(raw.thesisConfidence ?? 0.5), 0, 1),
    thesisEvolution: String(raw.thesisEvolution ?? ''),
    threads: ensureArray(raw.threads).map((item: Record<string, unknown>) => {
      const introAt = item.introducedAt as Record<string, unknown> | undefined;
      const rawStrength = String(item.strength ?? 'supporting');
      return {
        thread: String(item.thread ?? ''),
        introducedAt: {
          paragraph: Number(introAt?.paragraph ?? 0),
          ...(introAt?.sentence !== undefined && introAt?.sentence !== null ? { sentence: Number(introAt.sentence) } : {}),
        },
        appearances: ensureArray(item.appearances).map((a: Record<string, unknown>) => ({
          paragraph: Number(a.paragraph ?? 0),
          ...(a.sentence !== undefined && a.sentence !== null ? { sentence: Number(a.sentence) } : {}),
        })),
        strength: (validStrengths.includes(rawStrength as ThreadStrength)
          ? rawStrength
          : 'supporting') as ThreadStrength,
      };
    }),
    subtext: String(raw.subtext ?? ''),
    contradictions: ensureStringArray(raw.contradictions),
  };
}

function coerceNarrativeStrategy(raw: Record<string, unknown>): NarrativeStrategy {
  return {
    primaryStrategy: String(raw.primaryStrategy ?? ''),
    strategyRationale: String(raw.strategyRationale ?? raw.whyThisStructure ?? ''),
    pivotPoints: ensureArray(raw.pivotPoints).map((item: Record<string, unknown>) => {
      const loc = item.location as Record<string, unknown> | undefined;
      return {
        location: {
          paragraph: Number(loc?.paragraph ?? 0),
          ...(loc?.sentence !== undefined && loc?.sentence !== null ? { sentence: Number(loc.sentence) } : {}),
        },
        description: String(item.description ?? ''),
      };
    }),
    pacingAnalysis: String(raw.pacingAnalysis ?? ''),
    structuralChoices: ensureStringArray(raw.structuralChoices),
  };
}

function coerceCharacterRevelation(raw: Record<string, unknown>): CharacterRevelation {
  return {
    writerPortrait: String(raw.writerPortrait ?? raw.whoIsThisWriter ?? ''),
    valuesRevealed: ensureStringArray(raw.valuesRevealed),
    growthArc: String(raw.growthArc ?? ''),
    intellectualFingerprint: String(raw.intellectualFingerprint ?? ''),
    blindSpots: ensureStringArray(raw.blindSpots),
  };
}

function coerceCraftAssessment(raw: Record<string, unknown>): CraftAssessment {
  return {
    strengthSignatures: ensureArray(raw.strengthSignatures).map((item: Record<string, unknown>) => ({
      quality: String(item.quality ?? ''),
      evidence: String(item.evidence ?? ''),
      paragraphs: ensureNumberArray(item.paragraphs),
    })),
    growthEdges: ensureArray(raw.growthEdges).map((item: Record<string, unknown>) => ({
      quality: String(item.quality ?? ''),
      description: String(item.description ?? ''),
      paragraphs: ensureNumberArray(item.paragraphs),
    })),
    imageSystem: String(raw.imageSystem ?? ''),
    sentencePatterns: String(raw.sentencePatterns ?? ''),
    wordPatterns: String(raw.wordPatterns ?? ''),
  };
}

function coerceAdmissionsPositioning(raw: Record<string, unknown>): AdmissionsPositioning {
  return {
    tellabilitySummary: String(raw.tellabilitySummary ?? ''),
    distinctivenessFactors: ensureStringArray(raw.distinctivenessFactors),
    institutionalFit: String(raw.institutionalFit ?? ''),
    redFlags: ensureStringArray(raw.redFlags),
    memorability: String(raw.memorability ?? raw.memorabilityAssessment ?? ''),
    portfolioPosition: String(raw.portfolioPosition ?? raw.aoTakeaway ?? ''),
  };
}

function coerceEntanglements(raw: unknown[]): CrossDimensionEntanglement[] {
  if (!Array.isArray(raw)) return [];

  const validDimensions: HolisticDimension[] = [
    'voice', 'emotion', 'theme', 'narrative', 'character', 'craft', 'admissions', 'structure',
  ];

  return raw.map((item: Record<string, unknown>, idx: number) => {
    const loc = item.location as Record<string, unknown> | undefined;
    const rawDims = ensureStringArray(item.dimensions);
    const rawCrossRefs = ensureStringArray(item.crossRefs);

    return {
      id: String(item.id ?? `ent-${idx + 1}`),
      dimensions: rawDims.filter(d => validDimensions.includes(d as HolisticDimension)) as HolisticDimension[],
      location: {
        paragraph: Number(loc?.paragraph ?? 0),
        ...(loc?.sentence !== undefined && loc?.sentence !== null ? { sentence: Number(loc.sentence) } : {}),
      },
      description: String(item.description ?? ''),
      crossRefs: rawCrossRefs.filter(d => validDimensions.includes(d as HolisticDimension)) as HolisticDimension[],
    };
  });
}

// ── Utility helpers ──

function ensureArray(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value as Array<Record<string, unknown>>;
  return [];
}

function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(v => String(v ?? ''));
}

function ensureNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map(v => Number(v ?? 0));
}

function ensureTuple(value: unknown): [number, number] {
  if (Array.isArray(value) && value.length >= 2) {
    return [Number(value[0] ?? 0), Number(value[1] ?? 0)];
  }
  return [0, 0];
}

function clampNumber(value: number, min: number, max: number): number {
  if (isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// HOLISTIC SYNTHESIS SERVICE
// ============================================================================

export class HolisticSynthesisService {
  /**
   * Synthesize all 10 holistic sections from the complete L3 understanding.
   *
   * Single Sonnet call. Uses prompt caching on the system prompt for savings
   * when multiple essays are processed sequentially.
   *
   * @param input - Essay text, complete profile after L3 walk, holistic evolution scaffold
   * @returns The 10 holistic sections + cost/timing metadata
   * @throws Error if Sonnet call fails or response cannot be parsed
   */
  async synthesize(input: HolisticSynthesisInput): Promise<HolisticSynthesisResult> {
    const startTime = Date.now();

    // Build the user prompt from essay context + understanding + scaffold
    const understandingContext = buildUnderstandingContext(input.profile);
    const evolutionScaffold = buildEvolutionScaffold(input.holisticEvolution);

    // Combine into user prompt: Block 2 (essay-specific) + Block 3 (call-specific)
    const userPrompt = [
      '=== FULL ESSAY TEXT ===\n',
      input.essayText,
      '\n\n',
      understandingContext,
      '\n',
      evolutionScaffold,
    ].join('');

    console.log(
      `[HolisticSynthesis] Starting synthesis — ` +
      `${input.profile.paragraphs.length} paragraphs, ` +
      `${input.profile.connections.all.length} connections, ` +
      `~${Math.round(userPrompt.length / 4)} estimated input tokens`
    );

    // Make the Sonnet call
    const response: ClaudeResponse<unknown> = await callClaudeWithRetry<unknown>(
      {
        model: SONNET,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        maxTokens: SYNTHESIS_MAX_TOKENS,
        temperature: SYNTHESIS_TEMPERATURE,
        timeoutMs: SYNTHESIS_TIMEOUT_MS,
        useJsonMode: true,
        cacheSystemPrompt: true,
      },
      {},
      3, // maxRetries
    );

    // Parse and validate the response
    const synthesis = parseResponse(response.content);

    // Calculate cost
    const cost = calculateCost(response.usage, SONNET);

    const timingMs = Date.now() - startTime;

    console.log(
      `[HolisticSynthesis] Complete — ` +
      `${response.usage.output_tokens} output tokens, ` +
      `$${cost.toFixed(4)} cost, ` +
      `${timingMs}ms, ` +
      `stopReason: ${response.stopReason}, ` +
      `moments: ${synthesis.momentEarnednessMap.moments.length}, ` +
      `shifts: ${synthesis.voiceMap.shifts.length}, ` +
      `entanglements: ${synthesis.entanglements.length}`
    );

    // Warn if output was truncated (stop_reason === 'max_tokens')
    if (response.stopReason === 'max_tokens') {
      console.warn(
        '[HolisticSynthesis] WARNING: Output was truncated by maxTokens limit. ' +
        'Some holistic sections may be incomplete. Consider increasing SYNTHESIS_MAX_TOKENS.'
      );
    }

    return {
      synthesis,
      cost,
      tokenUsage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
      },
      timingMs,
    };
  }
}

/** Singleton instance */
export const holisticSynthesisService = new HolisticSynthesisService();
