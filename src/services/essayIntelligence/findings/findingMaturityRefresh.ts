// ============================================================================
// D-2.6 — Finding maturity refresh service (round 1.8)
// ============================================================================
//
// Scans the FindingStore for "stuck" findings — hypotheses or developing
// claims whose deepeningPotential cites writer-side info the system can't
// recover from text — and emits SpecificsNeedEmission[] with
// sourceLayer='finding_maturity'.
//
// Distinct from D-2.2 (L3 walk) / D-2.3 (L3.5) / D-2.4 (L3.75) / D-2.5
// (L4): those four emit DURING their layer's analysis pass. D-2.6 emits
// AFTER the analysis layers complete, scanning the accumulated FindingStore
// for stuck findings whose answer would mature the finding's claim from
// hypothesis → confirmed.
//
// Single Sonnet call per pass. Output flows into the same aggregator
// (D-2.7) and concept library as the other source layers.
//
// Round 1.8 framework citations:
// - §2.4 self-sufficiency: finding-level coaching already exists from the
//   originating layer; emission UPGRADES coaching by maturing the claim,
//   does not ENABLE it.
// - §2.5 surface-vs-deep: emission must dig at a discovery (the writer
//   would learn something about their own essay's referenced material)
//   OR a coaching-unlock (the system can't model the move without the
//   writer's specific instance).
// - §3 banned trivial phrasings on expectedInsight + expectedDiscovery.
// - §10 hard 3-emission cap per pass with per-concept complexity caps.
// - §12 round-0 8-test gate.
// ============================================================================

import type {
  EssayProfile,
  Finding,
  SpecificsNeedEmission,
  ConceptLibraryEntry,
} from '../profileTypes';
import { FindingStore } from './findingStore';
import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';

const SONNET = 'claude-sonnet-4-5-20250929';
const REFRESH_TEMPERATURE = 0.3;
const REFRESH_TIMEOUT_MS = 60_000;
const REFRESH_MAX_TOKENS = 2000;

/**
 * Detect "stuck" findings that the maturity refresh service should
 * consider for specifics-need emission. A finding is stuck when:
 *
 *   - Active (not superseded).
 *   - Maturity is 'hypothesis' or 'developing' (not yet confirmed/deepened).
 *   - Has populated deepeningPotential — meaning the LLM that produced the
 *     finding believed there's more to learn from further investigation.
 *
 * Cross-iteration "stuck" tracking (e.g., "finding has been hypothesis
 * across N iterations") is forward-looking; the current implementation
 * uses single-iteration state. When iteration ledger integration ships,
 * this filter can sharpen.
 */
export function findStuckFindings(store: FindingStore): Finding[] {
  return store.getActive().filter((f) => {
    if (f.maturity !== 'hypothesis' && f.maturity !== 'developing') return false;
    if (!f.deepeningPotential || f.deepeningPotential.trim().length === 0) return false;
    return true;
  });
}

const SYSTEM_PROMPT = `You are an essay-intelligence subsystem that decides which "stuck" findings about a college application essay merit a writer-side question.

A finding is "stuck" when:
- The system has produced a claim about the essay (from L3 walk, L3.5 analysis, L3.75 holistic synthesis, or L4 crystallization).
- The claim is at maturity 'hypothesis' or 'developing' — the system has evidence but the claim hasn't been confirmed.
- The finding's deepeningPotential field describes what FURTHER investigation could reveal.

Your job: for each stuck finding, judge whether the writer's answer would mature the finding's CLAIM from hypothesis → confirmed (or supersede it with a more accurate claim). Emit a specifics-need question only when ALL six round 1.8 conditions hold (uncertainty counts as No on every fork):

1. WORKING-CLAIM SILENCE. The finding is reaching but not landing. If the claim is already substantively true and only needs minor confirmation from text the system already has, say nothing.

2. THE CLAIM IS REAL. The finding cites text evidence and isn't a guess.

3. WRITER-SIDE ONLY. The deepeningPotential cites information the system can ONLY get from the writer — a moment they remember, a person they know, a stake they understood. Re-reading won't close the gap.

4. YOU HAVE AN ANGLE. Specific direction (a moment to recover, a sensory anchor, a stakes-context, a person to name).

5. ANSWER UPGRADES — DOESN'T ENABLE. The originating layer already produced text-grounded coaching for the underlying gap. The emission upgrades the FINDING's claim (hypothesis → confirmed) which downstream coaching uses, but it does not enable coaching that wouldn't otherwise run. If you can't articulate what the answer would do beyond "tell us what we don't know," the emission is theatrical.

6. SURFACE-VS-DEEP. The answer surfaces a discovery (the writer learns something about the referenced material in their own essay) OR unlocks a coaching shape-shift (the system can model a move on the writer's actual material instead of generic). Banned: "What were you feeling?" applied generically.

CONCEPT LIBRARY + REUSE POLICY: per-concept caps tied to UNRESOLVED instances:
  simple → max 1, medium → max 2, complex → max 3 unresolved instances per essay
PLUS hard ceiling of 3 emissions per maturity-refresh pass.

Library is USER-ACCESSIBLE ON DEMAND. Reuse existing tags when underlying mechanism matches; mint new prose tags only for genuinely distinct principles.

ANTI-REPETITION: drop if a prior emission (visible in PRIOR EMISSIONS context) already covers the same anchor + same gap.

framingSeed CALIBRATION: PLAIN language, embed student's actual line as quote, no validation padding, no template-with-quote-slot, more than three sentences is almost always padding. Quote-then-gap-then-angle.

EXPECTED-INSIGHT BANNED TRIVIAL PHRASINGS: "Matures the finding from hypothesis to confirmed", "Makes the coaching more concrete", "Reduces fabrication risk", "Improves the system's understanding", "Helps L5 generate better feedback". Name SPECIFIC content — WHICH coaching move, WHICH downstream artifact.

EXPECTED-DISCOVERY BANNED TRIVIAL PHRASINGS: "the writer would discover what they were feeling", "...their actual emotion", "...a specific detail", "...more about themselves". Name SPECIFIC discovery.

PRE-OUTPUT SWAP CHECK: swap-check expectedDiscovery + conceptTag against another essay; if word-for-word portable, drop or refine.

PRIORITY (structural two-question test):
  Q1: Without the answer, does the finding's claim collapse? YES → critical
  Q2: Without the answer, can downstream coaching still be specific?
      NO → high
      YES → medium
  "low" reserved for emissions where you're uncertain whether to emit at all (per silence default, prefer not emitting).

OUTPUT FORMAT:

Respond with a single JSON object:

{
  "specificsNeedEmissions": [
    {
      "sourceLayer": "finding_maturity",
      "emittingTrigger": "Stuck finding [F<id>] claim — one short sentence naming the claim and its current maturity",
      "anchorParagraph": <number from finding's scope>,
      "anchorSentence": <number or omit if paragraph-scoped>,
      "question": "Short specific plain-language question",
      "dimensions": [<from finding's dimensions array>],
      "expectedInsight": "ONE SENTENCE — how the answer matures THIS finding's claim into a specific coaching artifact downstream (banned trivial phrasings above)",
      "expectedDiscovery": "ONE SENTENCE — what the writer would discover OR null",
      "conceptTag": "short prose phrase (NOT snake_case)",
      "conceptComplexity": "simple | medium | complex",
      "conceptDefinition": "ONE-SENTENCE universal definition",
      "conceptExample": "ONE corpus-quality EXAMPLE",
      "priority": "critical | high | medium | low",
      "whyAsked": "Operator-facing recognition (allowed jargon — internal)",
      "expectedAnswerShape": "scalar | short_phrase | specific_memory | list | narrative",
      "consumers": ["finding_maturity", "l5"],
      "populates": ["finding.evidence", "finding.maturity"],
      "framingSeed": "Student-facing seed (PLAIN LANGUAGE, embeds student's actual line as quote)"
    }
  ]
}

Empty array is valid and the default — silence is the audit signal. Most refresh passes produce 0-3 emissions. Never more than 3 per pass.

Respond ONLY with the JSON object. No markdown, no explanation, no code blocks.`;

interface RefreshResult {
  emissions: SpecificsNeedEmission[];
  cost: number;
  tokenUsage: ClaudeResponse['usage'];
  timingMs: number;
}

/**
 * Run a single maturity-refresh pass. Reads stuck findings from the
 * FindingStore + concept library + prior emissions across all source
 * layers; produces SpecificsNeedEmission[] with sourceLayer='finding_maturity'.
 *
 * Caller is responsible for:
 * - Appending emissions onto the appropriate profile location (likely
 *   profile.findingsMaturityEmissions or similar essay-level field;
 *   storage location to be added when D-2.6's downstream consumer wires up).
 * - Library append for cross-layer cap-awareness (mirrors D-2.3 / D-2.4 /
 *   D-2.5 patterns).
 * - Surfacing failures via telemetry per the no-fallback charter.
 *
 * Returns empty emissions array when no stuck findings exist (silence is
 * the audit signal — saves an LLM call entirely).
 */
export async function refreshFindingMaturity(
  profile: Readonly<EssayProfile>,
  findingStore: FindingStore,
): Promise<RefreshResult> {
  const startTime = Date.now();
  const stuck = findStuckFindings(findingStore);

  // Silence path: no stuck findings → no LLM call, return empty.
  if (stuck.length === 0) {
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

  const userPrompt = buildUserPrompt(profile, stuck);

  const response = await callClaudeWithRetry<Record<string, unknown>>({
    model: SONNET,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    maxTokens: REFRESH_MAX_TOKENS,
    temperature: REFRESH_TEMPERATURE,
    timeoutMs: REFRESH_TIMEOUT_MS,
    useJsonMode: true,
    cacheSystemPrompt: true,
  });

  // STRICT-PASSTHROUGH parser per round 1.8 §11.10. Aggregator validator
  // (D-2.7) catches malformed entries with structured context.
  const raw = response.content;
  const emissions: SpecificsNeedEmission[] = [];
  if (
    raw &&
    typeof raw === 'object' &&
    Array.isArray((raw as { specificsNeedEmissions?: unknown }).specificsNeedEmissions)
  ) {
    for (const item of (raw as { specificsNeedEmissions: unknown[] }).specificsNeedEmissions) {
      if (item && typeof item === 'object') {
        emissions.push(item as unknown as SpecificsNeedEmission);
      }
    }
  }

  return {
    emissions,
    cost: calculateCost(response.usage, SONNET),
    tokenUsage: response.usage,
    timingMs: Date.now() - startTime,
  };
}

function buildUserPrompt(
  profile: Readonly<EssayProfile>,
  stuck: Finding[],
): string {
  const sections: string[] = [];

  sections.push('=== ESSAY TEXT ===');
  for (const para of profile.paragraphs) {
    sections.push(`\n[P${para.index}]`);
    for (const sentence of para.sentences) {
      sections.push(`  [P${para.index}S${sentence.index}] ${sentence.text}`);
    }
  }

  sections.push('\n=== STUCK FINDINGS (judge each for specifics-need emission) ===');
  stuck.forEach((f, i) => {
    sections.push(`\n[${i + 1}] Finding ${f.id} — maturity: ${f.maturity}`);
    sections.push(`  Claim: ${f.claim}`);
    sections.push(`  Source layer: ${f.source}`);
    sections.push(
      `  Scope: ${f.scope.type === 'paragraph' || f.scope.type === 'cross_paragraph' ? 'paragraph' : f.scope.type}` +
        ` (P${f.scope.paragraph ?? 0}${f.scope.sentences ? ` S[${f.scope.sentences.join(',')}]` : ''})`,
    );
    sections.push(`  Coaching value: ${f.coachingValue}`);
    sections.push(`  Dimensions: ${f.dimensions.join(', ')}`);
    sections.push(`  Deepening potential: ${f.deepeningPotential}`);
    if (f.raisesQuestions.length > 0) {
      sections.push(`  Raises questions: ${f.raisesQuestions.join(' | ')}`);
    }
  });

  // Cross-layer prior emissions (anti-repetition awareness).
  const priorEmissions = collectPriorEmissions(profile);
  if (priorEmissions.length > 0) {
    sections.push('\n=== PRIOR EMISSIONS IN THIS ESSAY (avoid repeating gaps + angles) ===');
    priorEmissions.slice(0, 12).forEach((emission, i) => {
      sections.push(
        `[${i + 1}] sourceLayer=${emission.sourceLayer}, P${emission.anchorParagraph + 1}` +
          (typeof emission.anchorSentence === 'number' ? `S${emission.anchorSentence + 1}` : '') +
          ` — concept: "${emission.conceptTag}"`,
      );
      sections.push(`     framingSeed: ${emission.framingSeed}`);
    });
  }

  // Concept library (cap-awareness).
  const library: ConceptLibraryEntry[] = profile.conceptLibrary ?? [];
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
    `Judge ${stuck.length} stuck finding(s) above against the round 1.8 six-condition gate. Emit at most 3 specifics-need emissions total. Empty array is valid — silence is the audit signal when no finding's stuck-state would benefit from a writer-side question.`,
  );

  return sections.join('\n');
}

function collectPriorEmissions(profile: Readonly<EssayProfile>): SpecificsNeedEmission[] {
  const out: SpecificsNeedEmission[] = [];
  for (const para of profile.paragraphs ?? []) {
    if (para.understanding?.specificsNeedEmissions) {
      out.push(...para.understanding.specificsNeedEmissions);
    }
    if (para.analysis?.specificsNeedEmissions) {
      out.push(...para.analysis.specificsNeedEmissions);
    }
  }
  if (profile.essayUnderstanding?.specificsNeedEmissions) {
    out.push(...profile.essayUnderstanding.specificsNeedEmissions);
  }
  if (profile.northStar?.specificsNeedEmissions) {
    out.push(...profile.northStar.specificsNeedEmissions);
  }
  return out;
}
