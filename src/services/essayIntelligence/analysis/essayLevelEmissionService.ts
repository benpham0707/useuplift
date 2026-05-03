// ============================================================================
// Phase B — essay-level emission decision service (Option 5 rebuild)
// ============================================================================
//
// Single Sonnet call that runs AFTER L3 walk + L3.5 analysis + L3.75 holistic
// + L4 northStar complete, BEFORE Phase 5.6 aggregator. Reads:
//
//   - The full essay text
//   - All EssayGapCandidate[] proposals from per-layer analysis (L3 walk
//     proposed candidates while doing sentence-level deep reading; L3.5
//     proposed from evaluative judgment; L3.75 from cross-paragraph
//     synthesis; L4 from architecture-of-meaning)
//   - The FindingStore (replaces D-2.6 service — stuck-finding maturity-
//     refresh logic folded here)
//   - The concept library (cap-relaxation + tag-reuse awareness)
//   - Prior emissions across iterations
//
// Decides 0-3 emissions for the essay, fills in the FULL SpecificsNeedEmission
// shape (framingSeed, expectedDiscovery, conceptTag, conceptComplexity,
// conceptDefinition, conceptExample, etc.) with full essay context.
//
// Why this exists (vs prior round 1.8 architecture):
// - Per-layer emission was costly (each layer filled in 17 fields per
//   emission, multiplied by 10 paragraphs for L3 walk + L3.5 = 20
//   high-output calls).
// - Concept tag fragmentation risk was real (5 separate prompts could pick
//   different tags for the same principle).
// - Cross-layer anti-repetition was a coordination problem.
// - Cap-by-complexity was distributed across layers + a consolidation step.
//
// Option 5 collapses ALL the heavy emission-shape work into ONE Sonnet
// call with full essay context. Recognition stays per-layer (depth
// preserved); decision + delivery happens once with full context (cost +
// quality both win).
//
// Cost target: ~$0.20-0.30 per essay (single Sonnet call, ~3K input system
// prompt cached + ~2K-5K input candidates/library/findings + ~1500 output
// for 0-3 full emissions).
//
// Round 1.8 framework citations preserved structurally:
// - §2.0 working-move silence: per-layer Phase A pre-filters; Phase B
//   re-applies with full context.
// - §2.4 self-sufficiency: Phase B verifies each candidate has a
//   corresponding text-grounded coaching artifact (finding /
//   improvementCandidate / weakness) on the profile before promoting.
// - §2.5 surface-vs-deep: Phase B applies the discovery-OR-coaching-unlock
//   filter; banned trivial phrasings on expectedInsight + expectedDiscovery.
// - §3 banned-phrasings: enforced in Phase B prompt prose.
// - §10 hard cap 3: structurally enforced (one prompt picks at most 3).
// - Per-concept caps + cap-relaxation on demonstrated understanding:
//   Phase B reads concept library state directly.
// - §12 round-0 8-test gate: enforced via Phase B prompt instructions.
// ============================================================================

import type {
  EssayProfile,
  EssayGapCandidate,
  SpecificsNeedEmission,
  ConceptLibraryEntry,
  Finding,
} from '../profileTypes';
import { FindingStore } from '../findings/findingStore';
import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';

const SONNET = 'claude-sonnet-4-5-20250929';
const PHASE_B_TEMPERATURE = 0.3;
const PHASE_B_TIMEOUT_MS = 90_000;
const PHASE_B_MAX_TOKENS = 2500;

/**
 * Result of a Phase B run.
 *
 * `emissions` is the final SpecificsNeedEmission[] (0-3 items) ready for
 * profile.specificsNeedEmissions storage and aggregator consumption.
 */
export interface EssayLevelEmissionResult {
  emissions: SpecificsNeedEmission[];
  cost: number;
  tokenUsage: ClaudeResponse['usage'];
  timingMs: number;
}

const SYSTEM_PROMPT = `You are an essay-intelligence subsystem responsible for the FINAL specifics-need question decision for a college application essay.

Earlier analysis layers (L3 walk, L3.5 analysis, L3.75 holistic synthesis, L4 northStar crystallization) each proposed lightweight gap candidates while doing their own work. Your job: read ALL their candidates + the full essay + the concept library + stuck findings, and decide 0-3 final emissions for this essay. Fill in the full delivery shape for each promoted candidate.

You replace what used to be 5 separate per-layer emission services. The depth of recognition lives in the candidates the layers proposed (each layer noticed gaps in its own cognitive moment); the depth of DELIVERY lives in your decision (you have full essay context to write the framingSeed correctly, choose the right concept tag, and calibrate priority + complexity).

=== HARD CONSTRAINTS ===

- Maximum 3 emissions per essay. Most essays land at 0-2. Empty array is valid and the default — silence is the audit signal.
- Per-concept caps tied to UNRESOLVED instances in the concept library:
    simple   → max 1 unresolved instance per essay
    medium   → max 2 unresolved instances per essay
    complex  → max 3 unresolved instances per essay
  Existing unresolved instances count against the cap. When the user resolves prior instances via iteration, the cap relaxes (the user demonstrated understanding).
- Reuse existing conceptTag from the library when the underlying mechanism matches. Mint a new prose tag only for genuinely distinct principles. Tags are PROSE phrases, NOT snake_case (e.g., "specific over general", NOT "specific_over_general").

=== SIX-CONDITION GATE (apply to each candidate before promoting) ===

Promote a candidate to a full emission ONLY when ALL six conditions hold (uncertainty counts as No on every fork):

1. WORKING-MOVE SILENCE. The move on this anchor is reaching but not landing. If the writer's craft is working as written (a reveal that lands, a metaphor doing its work, a structural choice paying off), do NOT promote. Worked example: Sarika's "Sometimes, I even ran over my friends' toes" lands as written via reveal-through-consequence + meek framing + inferential geometry. The walk's recognition fires, but emission count = ZERO. Silence.

2. THE GAP IS REAL. Text-evidenced. The candidate's triggeringArtifact cites a specific finding / weakness / pattern with concrete text evidence.

3. WRITER-SIDE ONLY. Re-reading won't close the gap; later paragraphs won't close the gap; only the writer can.

4. ANGLE PRESENT. The candidate gives a specific direction (a moment to recover, a sensory anchor, a stakes-context, a person to name).

5. ANSWER UPGRADES — DOESN'T ENABLE. The profile already carries text-grounded coaching for this gap (a finding-with-claim, an improvementCandidate, a growthEdge, a weakness with suggestedChange). The emission upgrades that coaching by giving it writer-specific anchor; it does not enable coaching that wouldn't otherwise run. Constructive-proof rider: if the only specific text-grounded coaching you can write is "ask the writer for the specific thing," your coaching has BECOME the question — that's the enable case, not the upgrade case. Do NOT promote.

6. SURFACE-VS-DEEP. The emission must dig at:
   (a) DISCOVERY — answering surfaces a pattern, inversion, hidden choice, or unowned emotion the writer hasn't seen in their own essay; OR
   (b) COACHING-UNLOCK different in SHAPE — answering lets the system coach in a fundamentally different shape, not just better in detail. "Different shape" = the coaching's mode changes (e.g., now we can model consequence-style reveal on the writer's actual material). "Better in detail" = the coaching gets richer but is fundamentally the same. Only different-in-shape qualifies.

   Banned: "What were you feeling at that moment?" applied generically.

=== FRAMING SEED CALIBRATION (the only student-facing field) ===

framingSeed is what surfaces to the writer in the chat. Discipline:
- MUST embed the writer's actual line as a direct quote.
- PLAIN language. NO analytical jargon ("subject-deferral grammar," "deepeningPotential," "F12"). NO engineering vocabulary.
- NO validation padding ("your description of X is beautiful and full of...").
- NO template with quote slot — framing language must come from THIS essay's specifics, not a portable template.
- Length matches what the gap and angle need. More than three sentences is almost always padding.
- Quote-then-gap-then-angle, no opening filler.
- Where possible, name the writing principle inside the seed when first-teaching this concept — turns the question into teaching.

CORPUS-BAR EXAMPLES:

(dance-watching, "freeing" inversion — concept "honest word over easy word")
"You wrote that watching her dance was 'freeing' — what did being the kid who couldn't move that way actually feel like? Not the sad version, the actual one. Was it longing, or anger, or something quieter that 'freeing' is the inverse of? The honest word under that one is what makes the rest land."

(friendship, abstract relational gap — concept "specific moment over summary")
"You said your friends 'didn't get it.' What did one specific moment look like — was it a face one of them made, a sentence that landed wrong, a conversation that ended too fast? One real moment we can hear and see lands harder than the summary, and it lets us figure out the not-getting-it the way you lived it."

(grandmother, function-not-person — concept "specific over general")
"You wrote that your grandmother was 'kind.' Kind is the word everyone uses for their grandmother. What did she do that no one else's would? One specific thing — a phrase she said, a small ritual, the way she fixed something — and we'd see her instead of hearing about her."

=== BANNED TRIVIAL PHRASINGS ===

expectedInsight — these autopass without filtering, drop emissions that use them:
- "Matures the finding from hypothesis to confirmed."
- "Makes the coaching more concrete."
- "Reduces fabrication risk."
- "Improves the system's understanding."
- "Helps L5 generate better feedback."

Name the SPECIFIC content: WHICH coaching move becomes possible, WHICH finding-claim matures, WHICH fabrication scenario is prevented.

expectedDiscovery — same discipline, drop emissions that use:
- "the writer would discover what they were feeling"
- "the writer would discover their actual emotion"
- "the writer would discover a specific detail"
- "the writer would discover more about themselves"

Name the SPECIFIC discovery: WHICH pattern, WHICH inversion, WHICH unowned emotion.

=== PRIORITY (structural two-question test) ===

Q1: Without the answer, does the originating finding/weakness's claim collapse? YES → critical.
Q2: Without the answer, can downstream coaching still be specific?
    NO → high (coaching cannot be specific without it).
    YES → medium (coaching can be specific; answer would still upgrade it).
"low" reserved for emissions where you're uncertain whether to promote at all (per silence default, prefer not promoting).

=== PRE-OUTPUT SWAP CHECK ===

Before final emit, swap-check each promoted emission:
- Could the emission's expectedDiscovery appear word-for-word on a different essay? If yes, drop or refine.
- Could the conceptTag appear word-for-word on a different essay AND name an underlying mechanism that's actually different? If yes, refine or reuse an existing library tag.
- Could the framingSeed appear word-for-word on a different essay (template with quote slot)? If yes, rewrite with this essay's specific framing language.

=== STUCK-FINDING MATURITY (folded from prior D-2.6) ===

You also see the FindingStore directly. A finding is "stuck" when:
- Active (not superseded).
- Maturity is 'hypothesis' or 'developing'.
- deepeningPotential is populated and cites writer-side info.

If a stuck finding's deepeningPotential genuinely needs a writer answer to mature its claim, treat it as an additional candidate alongside the per-layer proposals. Apply the same six-condition gate. Stuck-finding emissions get sourceLayer="finding_maturity".

=== OUTPUT FORMAT ===

Respond with a single JSON object. Empty array is valid. No markdown, no explanation, no code blocks.

{
  "emissions": [
    {
      "sourceLayer": "l3_walk | l3_5_analysis | l3_75_phase_a | l3_75_phase_b | l4_north_star | finding_maturity",
      "emittingTrigger": "<short sentence — the artifact that surfaced this gap; e.g., 'F12 deepeningPotential cites mother's reaction in P3'>",
      "anchorParagraph": <0-indexed>,
      "anchorSentence": <0-indexed if sentence-scoped, else omit>,
      "question": "<short specific plain-language question>",
      "dimensions": ["narrative" | "emotion" | "voice" | "theme" | "character" | "craft" | "admissions" | "structure", ...],
      "expectedInsight": "<ONE SENTENCE: how the answer UPGRADES coaching — content-specific; banned trivial phrasings above>",
      "expectedDiscovery": "<ONE SENTENCE: what the writer would discover OR null if pure coaching-unlock; banned trivial phrasings above>",
      "conceptTag": "<short prose phrase reusing library tag when mechanism matches; NOT snake_case>",
      "conceptComplexity": "simple | medium | complex",
      "conceptDefinition": "<ONE-SENTENCE universal definition, written GENERICALLY — not this student's essay>",
      "conceptExample": "<ONE corpus-quality EXAMPLE demonstrating the concept, generic — not this student's essay>",
      "priority": "critical | high | medium | low",
      "whyAsked": "<operator-facing recognition; allowed jargon — internal, not student-facing>",
      "expectedAnswerShape": "scalar | short_phrase | specific_memory | list | narrative",
      "consumers": ["l3" | "l3_5" | "l3_75" | "l4" | "l5" | "finding_maturity", ...],
      "populates": ["<free-form tags naming what answer populates downstream>"],
      "framingSeed": "<student-facing seed: PLAIN LANGUAGE, embeds student's actual line as quote>"
    }
  ]
}

Most refresh passes produce 0-2 emissions. Hard maximum 3. Silence is the audit signal — when no candidate passes the six-condition gate, return { "emissions": [] } cleanly.`;

/**
 * Run the Phase B essay-level emission decision pass.
 *
 * Reads: per-layer gap candidates from profile state + FindingStore +
 * concept library + the full essay text. Calls Sonnet once with full context.
 * Returns 0-3 SpecificsNeedEmission[] ready for storage at
 * profile.specificsNeedEmissions and aggregator consumption.
 *
 * Silence path: when there are zero gap candidates AND no stuck findings
 * with writer-side deepeningPotential, returns empty without an LLM call
 * (saves ~$0.25 per essay where the system has nothing to ask).
 */
export async function runEssayLevelEmissionPass(
  profile: Readonly<EssayProfile>,
  findingStore: FindingStore,
): Promise<EssayLevelEmissionResult> {
  const startTime = Date.now();

  const candidates = collectGapCandidates(profile);
  const stuckFindings = findStuckFindingsForEmission(findingStore);

  // Silence path — nothing to consider, skip the LLM call entirely.
  if (candidates.length === 0 && stuckFindings.length === 0) {
    return {
      emissions: [],
      cost: 0,
      tokenUsage: {
        input_tokens: 0,
        output_tokens: 0,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      },
      timingMs: Date.now() - startTime,
    };
  }

  const userPrompt = buildUserPrompt(
    profile,
    candidates,
    stuckFindings,
    profile.conceptLibrary ?? [],
  );

  const response = await callClaudeWithRetry<Record<string, unknown>>({
    model: SONNET,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    maxTokens: PHASE_B_MAX_TOKENS,
    temperature: PHASE_B_TEMPERATURE,
    timeoutMs: PHASE_B_TIMEOUT_MS,
    useJsonMode: true,
    cacheSystemPrompt: true,
  });

  // STRICT-PASSTHROUGH parse. Aggregator validator (D-2.7) catches
  // malformed entries with structured context.
  const raw = response.content;
  const emissions: SpecificsNeedEmission[] = [];
  if (
    raw &&
    typeof raw === 'object' &&
    Array.isArray((raw as { emissions?: unknown }).emissions)
  ) {
    for (const item of (raw as { emissions: unknown[] }).emissions) {
      if (item && typeof item === 'object') {
        emissions.push(item as unknown as SpecificsNeedEmission);
      }
    }
  }

  // Hard cap enforcement: trim to 3 if the LLM produced more.
  const capped = emissions.slice(0, 3);

  return {
    emissions: capped,
    cost: calculateCost(response.usage, SONNET),
    tokenUsage: response.usage,
    timingMs: Date.now() - startTime,
  };
}

/**
 * Append Phase B emissions onto the profile + concept library. Mirrors
 * the per-layer library-append patterns from the prior round 1.8
 * architecture, consolidated here as the single library-update path.
 *
 * Caller (orchestrator) invokes this after `runEssayLevelEmissionPass`
 * returns, before the Phase 5.6 aggregator runs.
 */
export function applyEssayLevelEmissionsToProfile(
  profile: EssayProfile,
  emissions: SpecificsNeedEmission[],
): void {
  // Single emission storage location (Option 5 contract).
  profile.specificsNeedEmissions = emissions;

  if (emissions.length === 0) return;

  // Concept library append: existing tag → append instance; new tag →
  // create entry from the emission's definition + example.
  if (!profile.conceptLibrary) profile.conceptLibrary = [];
  const currentIteration =
    profile.index?.iterationLedger?.currentIteration ?? 1;
  for (const emission of emissions) {
    let entry = profile.conceptLibrary.find((e) => e.tag === emission.conceptTag);
    if (!entry) {
      entry = {
        tag: emission.conceptTag,
        complexity: emission.conceptComplexity,
        definition: emission.conceptDefinition,
        example: emission.conceptExample,
        instances: [],
      };
      profile.conceptLibrary.push(entry);
    }
    entry.instances.push({
      paragraph: emission.anchorParagraph,
      sentence: emission.anchorSentence,
      iteration: currentIteration,
      gapResolved: false,
    });
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────

function collectGapCandidates(profile: Readonly<EssayProfile>): EssayGapCandidate[] {
  const out: EssayGapCandidate[] = [];
  for (const para of profile.paragraphs ?? []) {
    if (para.understanding) {
      const understanding = para.understanding as { gapCandidates?: EssayGapCandidate[] };
      if (Array.isArray(understanding.gapCandidates)) {
        out.push(...understanding.gapCandidates);
      }
    }
    if (para.analysis) {
      const analysis = para.analysis as { gapCandidates?: EssayGapCandidate[] };
      if (Array.isArray(analysis.gapCandidates)) {
        out.push(...analysis.gapCandidates);
      }
    }
  }
  if (profile.essayUnderstanding) {
    const eu = profile.essayUnderstanding as { gapCandidates?: EssayGapCandidate[] };
    if (Array.isArray(eu.gapCandidates)) out.push(...eu.gapCandidates);
  }
  if (profile.northStar) {
    const ns = profile.northStar as { gapCandidates?: EssayGapCandidate[] };
    if (Array.isArray(ns.gapCandidates)) out.push(...ns.gapCandidates);
  }
  return out;
}

function findStuckFindingsForEmission(store: FindingStore): Finding[] {
  return store.getActive().filter((f) => {
    if (f.maturity !== 'hypothesis' && f.maturity !== 'developing') return false;
    if (!f.deepeningPotential || f.deepeningPotential.trim().length === 0) return false;
    return true;
  });
}

function buildUserPrompt(
  profile: Readonly<EssayProfile>,
  candidates: EssayGapCandidate[],
  stuckFindings: Finding[],
  library: ConceptLibraryEntry[],
): string {
  const sections: string[] = [];

  sections.push('=== ESSAY TEXT ===');
  for (const para of profile.paragraphs) {
    sections.push(`\n[P${para.index}]`);
    for (const sentence of para.sentences) {
      sections.push(`  [P${para.index}S${sentence.index}] ${sentence.text}`);
    }
  }

  if (candidates.length > 0) {
    sections.push('\n=== GAP CANDIDATES (per-layer recognition proposals) ===');
    candidates.forEach((c, i) => {
      sections.push(
        `\n[${i + 1}] sourceLayer=${c.sourceLayer}, P${c.anchorParagraph + 1}` +
          (typeof c.anchorSentence === 'number' ? `S${c.anchorSentence + 1}` : ''),
      );
      sections.push(`  triggeringArtifact: ${c.triggeringArtifact}`);
      sections.push(`  briefRecognition: ${c.briefRecognition}`);
    });
  } else {
    sections.push('\n=== GAP CANDIDATES ===\n(none — per-layer analysis surfaced no candidates)');
  }

  if (stuckFindings.length > 0) {
    sections.push('\n=== STUCK FINDINGS (folded D-2.6 maturity-refresh) ===');
    stuckFindings.forEach((f, i) => {
      sections.push(`\n[${i + 1}] ${f.id} — maturity=${f.maturity}, source=${f.source}`);
      sections.push(`  Claim: ${f.claim}`);
      sections.push(`  Scope: P${f.scope.paragraph ?? 0}${f.scope.sentences ? ` S[${f.scope.sentences.join(',')}]` : ''}`);
      sections.push(`  Coaching value: ${f.coachingValue}, dimensions: ${f.dimensions.join(', ')}`);
      sections.push(`  Deepening potential: ${f.deepeningPotential}`);
      if (f.raisesQuestions.length > 0) {
        sections.push(`  Raises questions: ${f.raisesQuestions.join(' | ')}`);
      }
    });
  }

  if (library.length > 0) {
    sections.push('\n=== CONCEPT LIBRARY (concepts already taught in this essay) ===');
    sections.push(
      'Per-concept caps (unresolved instances): simple = 1, medium = 2, complex = 3.',
    );
    sections.push(
      'Reuse an existing tag if the underlying principle matches; otherwise mint a new prose tag.',
    );
    library.forEach((entry) => {
      const unresolved = entry.instances.filter((i) => !i.gapResolved).length;
      const total = entry.instances.length;
      sections.push(
        `- "${entry.tag}" [${entry.complexity}]: ${unresolved} unresolved / ${total} total instances`,
      );
      sections.push(`     definition: ${entry.definition}`);
    });
  }

  sections.push('\n=== INSTRUCTIONS ===');
  sections.push(
    `Read the essay above + ${candidates.length} gap candidate(s) + ${stuckFindings.length} stuck finding(s) + ${library.length} library entries. Apply the six-condition gate to each candidate (and each stuck finding). Promote 0-3 to full emissions per the OUTPUT FORMAT. Empty array is valid — silence is the audit signal when no candidate passes the gate.`,
  );

  return sections.join('\n');
}
