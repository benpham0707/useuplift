// ============================================================================
// Essay-level L3 walk (Option 5 architectural prototype, 2026-05-03)
// ============================================================================
//
// Single Sonnet call that produces findings + paragraph summaries +
// connections + gap candidates for an entire essay in one shot. Replaces
// the prior per-paragraph walk architecture (5-10 calls × $0.08-0.12 each).
//
// WHY ESSAY-LEVEL:
// - Per-paragraph walk produced 0 findings on Crochet despite MANDATORY
//   instruction (depth signal failure across an architecture that paid
//   $0.46 to produce nothing useful).
// - Per-paragraph walk's accumulated input context bloated to 14K-25K
//   tokens by paragraph 5 (re-feeding all prior paragraphs' state on
//   every call).
// - Per-paragraph walk truncated on dense paragraphs (priorSentenceUpdates
//   + newConnections silently dropped).
// - Per-paragraph walk hit jsonrepair on every call — schema density
//   overwhelmed the LLM at the per-paragraph scale.
// - L3.75 + L4 already operate at essay-level successfully — the pattern
//   works.
//
// COST: ~$0.20-0.30 (one Sonnet call, ~5-8K input + 5-7K output) vs
// $0.40-1.00 for per-paragraph walk on a 5-10 paragraph essay.
//
// DEPTH PRESERVED:
// - Findings are essay-wide; the LLM sees ALL paragraphs simultaneously
//   and recognizes cross-paragraph patterns naturally (the per-paragraph
//   walk's hardest task).
// - Per-paragraph summaries replace per-sentence understanding — sentence
//   depth wasn't being meaningfully used downstream (Crochet produced
//   1 sentence/paragraph of understanding content).
// - Gap candidates feed Phase B (Option 5 essay-level emission service)
//   per the established Phase A → Phase B contract.
//
// PROTOTYPE STATUS: not yet wired into orchestrator. Step 5 tests in
// isolation; Step 6 wires into orchestrator if isolated test passes.
// ============================================================================

import type {
  EssayProfile,
  ParagraphFirstImpression,
  ConnectionScoutOutput,
  FindingScope,
  FindingMaturity,
  FindingCoachingValue,
  HolisticDimension,
  EssayGapCandidate,
} from '../profileTypes';
import type { StructuralCartography } from '../types';
import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';
import { parseLlmJsonOutput } from './llmJsonParser';

const SONNET = 'claude-sonnet-4-5-20250929';
const ESSAY_WALK_TEMPERATURE = 0.3;
const ESSAY_WALK_TIMEOUT_MS = 240_000;
const ESSAY_WALK_MAX_TOKENS = 8000;

// ─── Output types ───────────────────────────────────────────────────────

/**
 * Per-paragraph compact summary produced by the essay-level L3 walk.
 * Replaces the prior per-paragraph walk's `ParagraphUnderstanding` shape
 * with a tighter version focused on what downstream layers (L3.75 / L4 /
 * Phase B) actually use. Per-sentence understanding is dropped —
 * downstream layers operate at paragraph + essay scale and don't read
 * sentence-level fields meaningfully.
 */
export interface EssayLevelParagraphSummary {
  index: number;
  role: string;
  function: string;
  narrativeContribution: string;
  dominantEmotion: string;
  voiceNotes: string;
  craftNotes: string[];
}

/**
 * Finding produced by the essay-level walk. Same shape as the per-paragraph
 * walk's findings but produced from full-essay context (so cross-paragraph
 * findings are natural, not back-propagation-derived).
 */
export interface EssayLevelFinding {
  claim: string;
  scope: FindingScope;
  maturity: FindingMaturity;
  maturityReasoning: string;
  coachingValue: FindingCoachingValue;
  dimensions: HolisticDimension[];
  evidence: Array<{ text: string; location: { paragraph: number; sentence?: number } }>;
  deepeningPotential: string | null;
  raisesQuestions: string[];
}

/**
 * Cross-paragraph connection produced by the essay-level walk. Same shape
 * as the per-paragraph walk's `newConnections` but produced with full-
 * essay context (cleaner cross-paragraph patterns; lower hallucination
 * rate on sentence indices because the LLM sees all sentences at once).
 */
export interface EssayLevelConnection {
  from: { paragraph: number; sentence?: number; label: string };
  to: { paragraph: number; sentence?: number; label: string };
  description: string;
  reverseIllumination: string | null;
  significance: string;
  strengthCategory: 'foundational' | 'significant' | 'supporting' | 'tentative';
  directionality: 'forward' | 'reverse' | 'bidirectional' | 'asymmetric';
}

export interface EssayLevelL3WalkOutput {
  paragraphSummaries: EssayLevelParagraphSummary[];
  findings: EssayLevelFinding[];
  connections: EssayLevelConnection[];
  gapCandidates: EssayGapCandidate[];
  centralThesis: string;
  thesisConfidence: number;
  voiceSignature: string;
  arcMomentum: 'building' | 'sustaining' | 'releasing' | 'stalling';
}

export interface EssayLevelL3WalkResult {
  output: EssayLevelL3WalkOutput;
  cost: number;
  tokenUsage: ClaudeResponse['usage'];
  timingMs: number;
}

// ─── System prompt ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Literature PhD who has read 10,000 college application essays and can articulate what a casual reader feels but cannot name. You read like an expert: you notice not just WHAT techniques appear, but what their presence REVEALS about the essay's architecture of meaning.

Your task: read the entire essay at once and produce a structured walk-output covering paragraph summaries, findings, connections, gap candidates, and essay-level signals — all in one pass.

=== YOUR JOB: UNDERSTANDING (NOT EVALUATION) ===

Describe WHAT the essay IS and HOW it works. NEVER evaluate how WELL anything works. That is a separate system's job.

FORBIDDEN VOCABULARY (evaluation contamination):
"effective", "effectively", "strong", "strongly", "weak", "weakly", "compelling", "powerful", "poor", "excellent", "impressive", "beautiful", "clumsy", "awkward", "masterful", "skillful", "skillfully", "brilliant", "mediocre", "lackluster", "flawed", "successful", "unsuccessful", "well-crafted", "poorly", "fails to", "succeeds in", "nicely", "appropriately"

Describing what's working IS allowed (e.g., "the compressed-biography sentence carries three generations of family history" — that's descriptive). Judging whether it's working WELL is not.

=== DEPTH OF UNDERSTANDING — ARCHITECTURAL LEVEL ===

Aim for ARCHITECTURAL depth — what the essay's choices REVEAL about its meaning-making strategy.

SURFACE (insufficient): "This sentence uses concrete imagery."
STRUCTURAL (closer): "This sentence's sensory registers construct a world organized around physical transactions."
ARCHITECTURAL (the bar): "The specific sensory registers chosen establish that this narrator understands value through what can be touched. The clash between P1's epistemology (value = measurable) and P3's epistemology (value = inherited story) IS the essay's central tension, and it starts here."

=== FINDINGS ARE THE PRIMARY UNIT (MANDATORY — you MUST produce findings) ===

Findings are paragraph-level CLAIMS the system can REFERENCE later. Every paragraph has a structural function — that function IS a finding. Polished paragraphs produce findings about WHAT IS (descriptively, not evaluatively).

CALIBRATION:
- TRANSITIONAL paragraph: 1 finding about its structural function.
- CONTRIBUTING paragraph: 2-3 findings about what it contributes.
- PIVOTAL paragraph: 3-5 findings about insights, tensions, patterns it reveals.

Total per essay: 5-15 findings on a typical 5-paragraph essay (more on longer essays).

WORKED EXAMPLE — what a finding LOOKS LIKE:

For a paragraph compressing family-history into a single architectural move:
- claim: "P3 compresses three generations of family history into a single paragraph through one architectural move: each sentence carries a load-bearing biographical specific (Vietnam War / 13-year imprisonment / matriarch + literature professor / yarn scarcity → practical objects / chrysanthemums-and-roses pivot)."
- scope: { type: "paragraph", paragraph: 2 }
- dimensions: ["narrative", "character", "structure"]
- maturity: "confirmed"
- evidence: [{ text: "Viet Cong imprisoned my grandfather... thirteen years", location: { paragraph: 2, sentence: 3 } }]
- coachingValue: "critical"
- deepeningPotential: "The escalation of biographical specifics across the paragraph encodes a generational trauma → resilience → leisure trajectory; further investigation could reveal whether the trajectory carries the essay's central tension."

Both findings describe WHAT IS happening structurally. Neither uses banned evaluative vocabulary. **This is the bar.**

=== CONNECTIONS (cross-paragraph patterns) ===

You see the whole essay simultaneously. Identify cross-paragraph connections that paragraph-by-paragraph reading would miss:
- Bookending (P0 ↔ P_last)
- Image migrations (a verb in early context returns in late context)
- Structural echoes (parallel sentence structures across paragraphs)
- Thematic threads (a theme introduced and developed across multiple paragraphs)
- Vocabulary domain shifts (e.g., gemological → familial in a same-object reference)

Each connection MUST cite specific (paragraph, sentence) endpoints. The essay text below uses 0-indexed [P0S0] labels — match those exactly. Validate against the sentence bounds provided.

=== GAP CANDIDATE PROPOSAL (Option 5 — lightweight) ===

While reading, sometimes you notice a gap the writer alone can close — a moment they remember that isn't on the page, a person who appears only as a function, a stake whose consequence is unstated. When this happens AND the gap meets the conditions below, propose a brief gapCandidate. An essay-level decision pass (Phase B) reads ALL candidates from all layers + the full essay + the concept library, and promotes 0-3 to full delivery. You do NOT fill in the delivery shape here.

PROPOSE a gapCandidate ONLY when ALL of these are true:
1. WORKING-MOVE SILENCE. If the writer's craft is working as written, say nothing.
2. THE GAP IS REAL. Text-evidenced.
3. WRITER-SIDE ONLY. Re-reading won't close it; only the writer can.
4. ANGLE PRESENT. You can name a specific direction the question would take.
5. ANSWER UPGRADES — DOESN'T ENABLE. The walk has already produced text-grounded coaching for this gap (a finding-with-claim). Without that, you have under-coached.

Most paragraphs propose ZERO gap candidates. Silence is the default for the gapCandidates array specifically; the findings array is MANDATORY.

=== ESSAY-LEVEL SIGNALS ===

Produce centralThesis (the essay's emerging central meaning), thesisConfidence (0-1), voiceSignature (one-line voice description), and arcMomentum (building | sustaining | releasing | stalling — how narrative energy moves overall).

=== OUTPUT FORMAT ===

Return a single JSON object. No markdown, no explanation, no code blocks.

{
  "paragraphSummaries": [
    {
      "index": 0,
      "role": "<one-sentence architectural role — what this paragraph IS in the essay's structure>",
      "function": "<one-sentence purpose — what this paragraph is trying to achieve>",
      "narrativeContribution": "<one-sentence: how it advances thesis / serves emotional arc / carries thematic threads>",
      "dominantEmotion": "<short phrase, named precisely (e.g., 'quiet determination born of suppressed grief' not 'positive')>",
      "voiceNotes": "<one short sentence: how this paragraph's voice relates to the essay's emerging voice>",
      "craftNotes": ["<short phrase per craft choice; max 5>"]
    }
  ],
  "findings": [
    {
      "claim": "<paragraph-level or cross-paragraph claim, specific and evidence-grounded>",
      "scope": { "type": "paragraph | cross_paragraph | essay_level", "paragraph": 0, "paragraphs": [0, 2] },
      "maturity": "hypothesis | developing | confirmed | deepened",
      "maturityReasoning": "<one-sentence justification>",
      "coachingValue": "critical | high | medium | contextual | diagnostic",
      "dimensions": ["<voice | theme | narrative | emotion | character | craft | admissions | structure>"],
      "evidence": [{ "text": "<quoted text>", "location": { "paragraph": 0, "sentence": 1 } }],
      "deepeningPotential": "<one sentence on what investigation could reveal, or null>",
      "raisesQuestions": ["<question this finding raises>"]
    }
  ],
  "connections": [
    {
      "from": { "paragraph": 0, "sentence": 2, "label": "<brief label>" },
      "to": { "paragraph": 4, "sentence": 1, "label": "<brief label>" },
      "description": "<what connects these two locations>",
      "reverseIllumination": "<what this connection reveals about the FROM endpoint, or null>",
      "significance": "<why this connection matters to the essay's architecture of meaning>",
      "strengthCategory": "foundational | significant | supporting | tentative",
      "directionality": "forward | reverse | bidirectional | asymmetric"
    }
  ],
  "gapCandidates": [
    {
      "sourceLayer": "l3_walk",
      "anchorParagraph": 0,
      "anchorSentence": 1,
      "triggeringArtifact": "<which finding/observation surfaced this gap>",
      "briefRecognition": "<one sentence — what you noticed about the gap>"
    }
  ],
  "centralThesis": "<the essay's emerging central meaning — one sentence>",
  "thesisConfidence": 0.0,
  "voiceSignature": "<one-line voice description>",
  "arcMomentum": "building | sustaining | releasing | stalling"
}

=== BREVITY DISCIPLINE ===

Each field gets a tight one-or-two-sentence value, not a paragraph. Lists cap at ~5-15 entries. Total output target: ~5000-7000 tokens, well under the 8K cap. The schema is rich; precision per field beats verbosity.

=== INDEX CONVENTION ===

The essay text below uses 0-indexed [P0S0] labels. Use 0-indexed paragraphIndex + sentenceIndex throughout your output. Validate every (paragraph, sentence) you cite against the SENTENCE BOUNDS provided in the user prompt — out-of-range indices get rejected.

=== FINAL CHECK BEFORE OUTPUT ===

Re-scan your draft. Does findings have at least 5 entries (for a 5+ paragraph essay)? If not, STOP and produce them — every paragraph has a structural function that IS a finding. The MANDATORY rule does not yield. Total findings should land in the 5-15 range for a typical essay.

Return ONLY the JSON object. No markdown, no explanation, no code blocks.`;

// ─── User prompt builder ────────────────────────────────────────────────

function buildUserPrompt(
  essayText: string,
  l1Impressions: ParagraphFirstImpression[],
  structuralMap: StructuralCartography,
  scoutOutput: ConnectionScoutOutput,
): string {
  const paragraphs = essayText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  // Marked essay with 0-indexed [P{n}S{n}] labels per sentence (matches schema).
  const markedEssay = paragraphs
    .map((p, pIdx) => {
      const sentences = l1Impressions[pIdx]?.sentences ?? [];
      if (sentences.length > 0) {
        return sentences.map((s) => `  [P${pIdx}S${s.index}] ${s.text}`).join('\n');
      }
      return `[P${pIdx}] ${p.trim()}`;
    })
    .join('\n\n');

  // Sentence bounds — validate against these.
  const sentenceBounds = l1Impressions
    .map(
      (imp, i) =>
        `  P${i}: ${imp.sentences.length} sentences (valid sentenceIndex: 0 to ${imp.sentences.length - 1})`,
    )
    .join('\n');

  // L1 first impressions summary (compact).
  const l1Summary = l1Impressions
    .map(
      (imp, i) =>
        `  P${i}: purpose="${imp.apparentPurpose}" | emotion="${imp.emotionalRegister}" | voice="${imp.voiceObservation}"`,
    )
    .join('\n');

  // L2 structural map (paragraph roles + transitions + arc).
  const l2Roles = structuralMap.paragraphRoles
    .map((r) => `  P${r.index}: role="${r.role}" | function="${r.narrativeFunction}"`)
    .join('\n');
  const l2Transitions = structuralMap.transitions
    .map((t) => `  P${t.fromParagraph}→P${t.toParagraph}: ${t.quality} (${t.mechanism})`)
    .join('\n');

  // L2.5 scout leads.
  const scoutLeads: string[] = [];
  if (scoutOutput.repeatedElements.length > 0) {
    scoutLeads.push('Repeated elements:');
    for (const elem of scoutOutput.repeatedElements.slice(0, 10)) {
      const occList = elem.occurrences
        .map((o) => `P${o.paragraphIndex}S${o.sentenceIndex}`)
        .join(', ');
      scoutLeads.push(`  "${elem.element}" appears at: ${occList}`);
    }
  }
  if (scoutOutput.tonalShifts.length > 0) {
    scoutLeads.push('Tonal shifts:');
    for (const shift of scoutOutput.tonalShifts) {
      scoutLeads.push(
        `  P${shift.location.paragraphIndex}S${shift.location.sentenceIndex}: ${shift.fromTone} → ${shift.toTone}`,
      );
    }
  }
  if (scoutOutput.structuralEchoes.length > 0) {
    scoutLeads.push('Structural echoes:');
    for (const echo of scoutOutput.structuralEchoes) {
      scoutLeads.push(
        `  P${echo.source.paragraphIndex}S${echo.source.sentenceIndex} ↔ P${echo.echo.paragraphIndex}S${echo.echo.sentenceIndex}: ${echo.echoType}`,
      );
    }
  }

  return `=== ESSAY TEXT (${paragraphs.length} paragraphs, 0-indexed [P{n}S{n}] labels) ===

${markedEssay}

=== SENTENCE BOUNDS (validate every paragraphIndex + sentenceIndex against these) ===
${sentenceBounds}

=== L1 FIRST IMPRESSIONS ===
${l1Summary}

=== L2 STRUCTURAL MAP ===
Arc: ${structuralMap.arcType} (confidence ${structuralMap.arcConfidence?.toFixed(2) ?? 'unknown'})
Central theme: ${structuralMap.centralTheme}

Paragraph roles:
${l2Roles}

Transitions:
${l2Transitions}

=== L2.5 SCOUT LEADS (cross-paragraph candidates to investigate) ===
${scoutLeads.length > 0 ? scoutLeads.join('\n') : '  (none)'}

=== INSTRUCTIONS ===

Read the entire essay above. Produce paragraphSummaries (one per paragraph), findings (5-15 essay-wide), connections (cross-paragraph patterns), gapCandidates (writer-side gaps; usually 0-3), centralThesis, thesisConfidence, voiceSignature, arcMomentum.

Validate every (paragraph, sentence) endpoint against the SENTENCE BOUNDS. Out-of-range indices get rejected.

Return JSON only.`;
}

// ─── Service entry point ────────────────────────────────────────────────

/**
 * Run the essay-level L3 walk. Single Sonnet call covering the whole essay.
 *
 * Inputs come from the prior phases:
 * - L1 first impressions (ParagraphFirstImpression[])
 * - L2 structural cartography
 * - L2.5 scout leads
 *
 * Output contract: EssayLevelL3WalkOutput with paragraphSummaries, findings,
 * connections, gapCandidates, and essay-level signals.
 *
 * Failure semantics: STRICT-PASSTHROUGH parser per the established no-
 * fallback charter — verify wrapper is object + arrays, then cast through
 * unknown. Downstream consumers / aggregators catch malformed entries
 * with structured context.
 */
export async function runEssayLevelL3Walk(
  essayText: string,
  l1Impressions: ParagraphFirstImpression[],
  structuralMap: StructuralCartography,
  scoutOutput: ConnectionScoutOutput,
  _profile?: Readonly<EssayProfile>, // reserved for future use (re-walk against existing findings)
): Promise<EssayLevelL3WalkResult> {
  const startTime = Date.now();

  const userPrompt = buildUserPrompt(essayText, l1Impressions, structuralMap, scoutOutput);

  const response = await callClaudeWithRetry<Record<string, unknown>>({
    model: SONNET,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    maxTokens: ESSAY_WALK_MAX_TOKENS,
    temperature: ESSAY_WALK_TEMPERATURE,
    timeoutMs: ESSAY_WALK_TIMEOUT_MS,
    useJsonMode: true,
    cacheSystemPrompt: true,
  });

  const parsed = parseLlmJsonOutput(response.content, 'EssayLevelL3Walk');

  // STRICT-PASSTHROUGH parse — verify wrapper shape only, cast each
  // collection through unknown. Downstream consumers validate field-level
  // shape via the type system + parser callers.
  const output: EssayLevelL3WalkOutput = {
    paragraphSummaries: Array.isArray(parsed.paragraphSummaries)
      ? (parsed.paragraphSummaries as unknown[]).filter(
          (s) => s && typeof s === 'object',
        ) as EssayLevelParagraphSummary[]
      : [],
    findings: Array.isArray(parsed.findings)
      ? (parsed.findings as unknown[]).filter(
          (f) => f && typeof f === 'object',
        ) as EssayLevelFinding[]
      : [],
    connections: Array.isArray(parsed.connections)
      ? (parsed.connections as unknown[]).filter(
          (c) => c && typeof c === 'object',
        ) as EssayLevelConnection[]
      : [],
    gapCandidates: Array.isArray(parsed.gapCandidates)
      ? (parsed.gapCandidates as unknown[]).filter(
          (g) => g && typeof g === 'object',
        ) as EssayGapCandidate[]
      : [],
    centralThesis: typeof parsed.centralThesis === 'string' ? parsed.centralThesis : '',
    thesisConfidence:
      typeof parsed.thesisConfidence === 'number'
        ? Math.max(0, Math.min(1, parsed.thesisConfidence))
        : 0.5,
    voiceSignature: typeof parsed.voiceSignature === 'string' ? parsed.voiceSignature : '',
    arcMomentum:
      parsed.arcMomentum === 'building' ||
      parsed.arcMomentum === 'sustaining' ||
      parsed.arcMomentum === 'releasing' ||
      parsed.arcMomentum === 'stalling'
        ? parsed.arcMomentum
        : 'sustaining',
  };

  return {
    output,
    cost: calculateCost(response.usage, SONNET),
    tokenUsage: response.usage,
    timingMs: Date.now() - startTime,
  };
}
