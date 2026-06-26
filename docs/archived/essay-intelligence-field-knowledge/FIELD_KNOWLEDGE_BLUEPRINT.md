> ⚠️ ARCHIVED/SUPERSEDED (2026-06-21). Historical. Current: docs/knowledge-base/INTEGRATION_BLUEPRINT.md (architecture), README.md (KB schema/ops), essays/_MAP.md (build state).

# FIELD-KNOWLEDGE BLUEPRINT — Dimension-Targeted Retrieval for the Essay-Intelligence Annotator

> The annotator currently runs blind (all corpus flags default OFF, master-flag bug makes
> per-layer rollout a no-op) and, even with flags on, retrieves moves *similar to what the
> paragraph already does* under a *hard voice-lock* — it structurally cannot surface a missing
> craft move or read a dimension. This blueprint turns the lights on correctly, makes retrieval
> **dimension-targeted** (query the rubric dimension the paragraph is weak in, judged at rank
> time — no tagging table), grows the catalog with **advisor knowledge chunked from docs/research
> at build time** (no authoring sprint), and routes the **student-facing manifest** through the
> same retrieval call (killing the 14-route keyword table and the always-null `demonstration`).

Net cost: **~+$0.04/essay** runtime when fully on; **$0 one-time** for the critical path (build-time
chunker, no LLM). Optional later distillation pass is the only thing that spends one-time tokens.

---

## Items

Items are written in dependency order. Each is independently shippable behind the per-layer flags.

---

### Item 1 — GAP-3: Fix the master-flag gate so per-layer rollout works, then turn L3.5 + L5 on

**Before.** `retrieveAnchorMoves` (`corpusRetrievalBlocks.ts:265`), `retrieveParagraphAntiPatterns`
(`:313`), `retrievePhaseArchetypes` (`:359`) all bail on the **master** flag as the first body
statement: `if (!isCorpusRetrievalEnabled()) return [];`. L5 checks `isCorpusRetrievalEnabledForL5()`
at `deepAnnotationService.ts:960`, then calls `retrieveAnchorMoves` at `:966` — which bails on the
master flag regardless. So per-layer flags are no-ops for the two stage-tagged functions; production
sets nothing → pure generic LLM knowledge. (Verified: exactly **2** functions carry a `stageTag`
param — `retrieveAnchorMoves` `:263`, `retrievePhaseArchetypes` `:357`; `retrieveParagraphAntiPatterns`
has **no** stageTag and is intrinsically L3.5/`'paragraph'` — correctly master-gated, **no change**.)

**After.** A net-new stage→resolver dispatch; the two stage-tagged functions consult it. Production
`.env` enables L3.5 + L5 first (telemetry-gated incremental rollout).

**Implementation.**

```typescript
// corpusRetrievalBlocks.ts — net-new, near the per-layer resolvers (:195-212)
type RetrievalStage = CorpusRetrievalAttempt['stage']; // 'anchor'|'paragraph'|'phase'|'feedback'|...
function isRetrievalEnabledForStage(stage: RetrievalStage): boolean {
  switch (stage) {
    case 'phase':   return isCorpusRetrievalEnabledForL3();   // walk + crystallizer phase archetypes
    case 'feedback':return isCorpusRetrievalEnabledForL5();   // L5 anchor/dimension moves
    // 'anchor' & 'paragraph' are L3.5-intrinsic → master flag
    case 'anchor':
    case 'paragraph':
    default:        return isCorpusRetrievalEnabled();
  }
}
```

Swap the gate in the two stage-tagged functions only:

```typescript
// retrieveAnchorMoves :265  and  retrievePhaseArchetypes :359
- if (!isCorpusRetrievalEnabled()) return [];
+ if (!isRetrievalEnabledForStage(stageTag)) return [];
```

`retrieveParagraphAntiPatterns:313` is **untouched** (no stageTag; master-gated is correct).
`createTelemetry().featureFlagEnabled` (`:122`) stays master-keyed (it's a run-level descriptor).

**Config.** `.env` (production): `ENABLE_CORPUS_RETRIEVAL_L35=true`, `ENABLE_CORPUS_RETRIEVAL_L5=true`.
Master flag `ENABLE_CORPUS_RETRIEVAL` is read by `'anchor'`/`'paragraph'` (L3.5) — set the L35 knob,
which the master resolver reads. Leave L3/L4/L6 off until telemetry validates L3.5+L5.

**Integration points.** `corpusRetrievalBlocks.ts:195-212` (add dispatch), `:265`, `:359` (swap).
`.env`. No call-site signature changes (stageTag already passed).

**Cost.** +~$0.03/essay (~6 Haiku ranking calls @ ~$0.005). $0 one-time.

**Source.** hybrid (Direct + Rethink identical here; both correct that only 2 functions need the swap).
Rationale: both designs converged; verification confirmed `retrieveParagraphAntiPatterns` must stay
master-gated and the dispatch is net-new.

---

### Item 2 — GAP-1 + GAP-2 + GAP-9: DimensionTarget emitted once at L3.5; one dimension-targeted retrieval, three consumers

This is the keystone. **Verified to hold:** `analyzeSingleParagraph` (`analysisPass.ts:2473`) already
makes a per-paragraph Sonnet call returning `AnalysisPassOutput` (a JSON schema extended many times —
Port B1/B3, Phase 0 D-0.16), persisted to `ParagraphProfile.analysis` at
`essayProfileManager.ts:2333-2342`. Adding one output field + one persisted field is the established
pattern. **No 190×12 tagging table; no holistic→rubric bridge.**

**Before.** Retrieval ranks moves "most relevant to THIS PARAGRAPH" (`retrieveMovesBySignal:276`) and
hard-filters by voice register (`:284-289`). It reinforces what the essay does and cannot surface a
missing move. No dimension input anywhere. The 5 highest-weight rubric dims (reflection_meaning_making,
intellectual_vitality_curiosity, context_constraints_disclosure, school_program_fit,
ethical_awareness_humility) are unrepresentable.

**After.** L3.5 names the **one weakest rubric dimension** for each paragraph as a *craft goal* (free
text). The retrieval query is that goal; Haiku judges per call whether each move's mechanism builds the
target dimension (mechanism is already in the catalog line, `claudeRetrieval.ts:98`). Voice becomes a
soft rank-penalty, not a hard filter. "What's missing" is trivial to retrieve by describing the goal.

**Implementation.**

*2a — DimensionTarget type + L3.5 emission (no new call).*

```typescript
// profileTypes.ts — NEW type. Import the canonical 12-enum, do NOT redefine.
import type { RubricDimensionName } from '../../core/essay/types/essay'; // :129-142 (net-new dep)

export interface DimensionTarget {
  /** The ONE rubric dimension this paragraph is weakest in. 12-value closed enum —
   *  appropriate as a closed taxonomy because it IS the scoring rubric, not a perception axis. */
  dimension: RubricDimensionName;
  /** The retrieval query: phrase as a craft GOAL, not a complaint.
   *  e.g. "move from narrating the event to earning a specific insight about why it changed her".
   *  Free-text — the LLM-first escape hatch; this is what actually drives ranking quality. */
  intent: string;
  /** 'blocking' = weak enough to gate the paragraph's effectiveness; 'elevating' = already
   *  fine, this would make it exceptional. L5/manifest prioritize 'blocking'. */
  severity: 'blocking' | 'elevating';
}
```

Add to `AnalysisPassOutput` (`profileTypes.ts:4274`, alongside the other optional Port fields) and to
the persisted `ParagraphAnalysis` (`:863`):

```typescript
// AnalysisPassOutput (optional during rollout)
dimensionTarget?: DimensionTarget | null;
// ParagraphAnalysis
dimensionTarget?: DimensionTarget | null;
```

Persist at the existing mapping site (`essayProfileManager.ts:2336-2341`):

```typescript
this.paragraphMutator.applyParagraphAnalysis(this.profile, result.paragraphIndex, {
  effectiveness: result.paragraphEffectiveness,
  verdict: result.paragraphVerdict,
  strengthSignatures: result.holisticAnalysisEvolution?.strengthSignatures ?? [],
  growthEdges: result.holisticAnalysisEvolution?.growthEdges ?? [],
  dimensionTarget: result.dimensionTarget ?? null,   // ← ADD
});
```

L3.5 prompt SPEC addition (`buildParagraphPrompt` in `analysisPass.ts`; output ~+40 tokens/para):

```
After scoring, identify the SINGLE rubric dimension this paragraph is weakest in (the one whose
improvement would most raise the paragraph). Choose from EXACTLY these 12:
opening_power_scene_entry, narrative_arc_stakes_turn, character_interiority_vulnerability,
show_dont_tell_craft, reflection_meaning_making, intellectual_vitality_curiosity,
originality_specificity_voice, structure_pacing_coherence, word_economy_craft,
context_constraints_disclosure, school_program_fit, ethical_awareness_humility.
Phrase the fix as a craft GOAL for this specific paragraph, not a generic complaint.
"dimensionTarget": {
  "dimension": "reflection_meaning_making",
  "intent": "move from narrating the lab failure to earning one specific, non-obvious insight about what it changed in how she works",
  "severity": "blocking"
}
If the paragraph has no weak dimension worth targeting, return "dimensionTarget": null.
```

*2b — dimension-targeted retrieval + soft voice rank.*

```typescript
// claudeRetrieval.ts — sibling of retrieveMovesBySignal, reuses runRanking (cache still hits)
export async function retrieveMovesForDimension(
  target: DimensionTarget,
  filters: ClaudeRetrievalFilters = {},
  k = 6,
): Promise<ClaudeRetrievalResult<CraftMove>[]> {
  const validIds = new Set(moveById.keys());
  const query = `TARGET DIMENSION: ${target.dimension}\nCRAFT GOAL: ${target.intent}`;
  const rows = await runRanking(query,
    `Rank CRAFT MOVES whose MECHANISM would most help build the TARGET DIMENSION toward the ` +
    `CRAFT GOAL. Judge by what the mechanism ACCOMPLISHES, not topical similarity to the goal text. ` +
    `A move belongs even if the student is not currently attempting it — you are surfacing what is ` +
    `MISSING. If fewer than ${k} genuinely build this dimension, return fewer.`,
    validIds);
  const ranked = applyVoiceSoftRank(rows, filters); // penalize, don't exclude
  return ranked.slice(0, k).map((r) => hydrate(moveById.get(r.id)!, r)); // same hydrate as :293-305
}

// soft voice rank — replaces the hard {voiceRegisters} filter for the dimension path ONLY
const VOICE_MISMATCH_PENALTY = 0.15;
function applyVoiceSoftRank(rows: RankingRow[], filters: ClaudeRetrievalFilters): RankingRow[] {
  if (!filters.voiceRegisters?.length) return rows;
  const pref = new Set(filters.voiceRegisters);
  return rows
    .map((r) => {
      const m = moveById.get(r.id);
      const clash = m && !m.compatibleRegisters.some((reg) => pref.has(reg));
      return clash ? { ...r, relevance: Math.max(0, r.relevance - VOICE_MISMATCH_PENALTY) } : r;
    })
    .sort((a, b) => b.relevance - a.relevance);
}
```

`retrieveMovesBySignal` keeps its hard voice filter (L3.5 anchor similarity-mode is unchanged —
backward compatible). The 0.4 relevance floor in `parseRanking:204` still drops irrelevant moves
(degrades to *no block*, never a *bad block*). Voice was never a safety rail for moves (forbidden
cells exist only for **archetypes**, `getForbiddenArchetypesForVoice:151`) — relaxing it is safe.

*2c — wrapper in corpusRetrievalBlocks (telemetry + degrade-to-[] + stage gate).*

```typescript
export async function retrieveDimensionMoves(
  target: DimensionTarget, profile: EssayProfile,
  telemetry: CorpusRetrievalTelemetry, stageTag: RetrievalStage = 'feedback',
): Promise<CraftMove[]> {
  if (!isRetrievalEnabledForStage(stageTag)) return [];           // Item 1 dispatch
  const voice = resolveVoiceRegister(profile);                     // :238 existing
  return withCorpusTimeout(                                        // mirrors retrieveAnchorMoves shell
    retrieveMovesForDimension(target, { voiceRegisters: [voice] }, ANCHOR_MOVE_COUNT)
      .then((rs) => { recordTelemetry(telemetry, stageTag, rs.length); return rs.map(r => r.entity); }),
    [], telemetry, stageTag);
}
```

*2d — rewire L5 to read the target per-paragraph (GAP-9 dissolves).* Replace the single essay-level
`retrieveAnchorMoves(essayText, …)` (`deepAnnotationService.ts:966`, injected once into shared context
at `:970`) with per-paragraph retrieval inside the existing batch loop (`:981-1004`), injecting into
the existing `paraRelevantContext` hook (`:986-989`, passed to `annotateParagraph` at `:1001`):

```typescript
// inside batch.map((para) => …), :986 region
let paraCorpusBlock = '';
if (para.analysis?.dimensionTarget?.severity === 'blocking') {
  const moves = await retrieveDimensionMoves(para.analysis.dimensionTarget, profile, l5CorpusTel, 'feedback');
  paraCorpusBlock = buildTeachingMovesBlock(moves);   // Item 5 — teaching-framed, [MOVE-#] labels
  injectedByPara.set(para.index, moves.length);
}
const paraRelevantContext = (paraRelevance ? buildParagraphContext(...) : '') + paraCorpusBlock;
```

Run `detectFabricatedReferences` **per paragraph** with `injectedByPara.get(para.index)` (the current
essay-wide scan at `:1235` is replaced/augmented — this *strengthens* the rail: L5 has no per-para
check today).

**Integration points.** `profileTypes.ts` (DimensionTarget type, +1 field on AnalysisPassOutput :4274,
+1 on ParagraphAnalysis :863; net-new import from `core/essay/types/essay`). `analysisPass.ts`
`buildParagraphPrompt` (prompt) + `validateAndTransform` (pass field through). `essayProfileManager.ts:2341`
(persist). `claudeRetrieval.ts` (retrieveMovesForDimension, applyVoiceSoftRank). `corpusRetrievalBlocks.ts`
(retrieveDimensionMoves). `deepAnnotationService.ts:960-1004` (per-para rewire) + `:1235` (per-para attribution).

**Cost.** L3.5 +~$0.003/essay (output tokens, no new call). L5 ~3 of 5 paras blocking × $0.005 ≈ $0.015,
replacing one ~$0.005 essay-level call → net +$0.013/essay. $0 one-time.

**Source.** rethink (keystone verified to hold) + refined. Rationale: Rethink's "weak-dimension-name-as-query,
target computed once at L3.5, three consumers" is verified-correct and LLM-first-aligned. Refinement: the
12-enum requires a net-new `core/essay/types` import into essayIntelligence (Rethink omitted this); the
direct L3.5 emission is confirmed cleaner than the existing lossy `DIMENSION_TO_RUBRIC_AFFINITY` string
bridge (`teachingContentRouter.ts:258`), so we do NOT route through findings' `HolisticDimension[]`.

---

### Item 3 — GAP-6 + GAP-7: Grow the catalog with advisor knowledge — build-time chunk, not authoring

**Before.** `docs/research/` (116 files, 2.6 MB of AO-cited counselor knowledge) feeds nothing
retrievable. The 5 unrepresented rubric dims have zero moves. `src/workshop/` registries (5 strategies
+ 10 patterns with beforeAfter) reach only `/api/v1/annotate`, never essayIntelligence.

**After.** A build-time chunker splits the 4 highest-yield docs on `### ` headings into a `ReviewPassage`
band added to the same cached Haiku catalog. `retrieveMovesForDimension` ranks passages alongside moves —
Haiku judges dimension-fit from passage text + the query's TARGET DIMENSION (no per-passage tagging). For
the 5 empty dims, "AO principle + citation" >> today's nothing. Registry strategies/patterns fold into the
same passage band (content copied at build time, source-tagged; pipelines NOT merged).

**Implementation.**

```typescript
// scripts/buildReviewPassages.ts — build-time, $0, NO LLM. Output committed:
//   corpus/reviewPassages.generated.ts
const INPUT_DOCS = [
  'docs/research/synthesis/CHARACTER_ASSESSMENT_FOUNDATION.md',   // 106 ### sections
  'docs/research/synthesis/HOLISTIC_REVIEW_FOUNDATION.md',        // 112
  'docs/research/counseling-system/SECTION_7.8_ESSAY_STRATEGY.md',// 44
  'docs/research/synthesis/RED_FLAGS_FOUNDATION.md',              // 60  (verified to exist)
];
// for each doc: split on /^###\s+/m → {heading, body}
//   skip if body wordcount < 25
//   TABLE GUARD (verified necessary — ~27/106 CHARACTER sections are table-led):
//     strip leading markdown-table lines; if remaining prose < 25 words, skip the section
//   passage = { id:`rp-${slug}`, title: heading, source: docBasename, text: truncate(prose, 600) }
```

```typescript
// profileTypes.ts (or corpusTypes.ts) — reuses existing 'review-passage' EmbeddingEntityType (corpusTypes.ts:462)
export interface ReviewPassage { id: string; title: string; source: string; text: string; }
```

```typescript
// claudeRetrieval.ts — 4th catalog band, mirrors getMovesCatalog (:93)
let _passagesCatalog: string | null = null;
function getReviewPassagesCatalog(): string {
  if (_passagesCatalog) return _passagesCatalog;
  _passagesCatalog = REVIEW_PASSAGES.map(p => `[${p.id}] ${p.title} | ${p.source}\n  ${truncate(p.text,160)}`).join('\n');
  return _passagesCatalog;
}
```

Wire into BOTH places (verified: independently maintained — adding to only one breaks the hash):
- `buildSystemPrompt():228` — add a `{{PASSAGES}}` slot under a new preamble band
  `ADVISOR KNOWLEDGE (apply the principle, don't quote verbatim):` and `.replace('{{PASSAGES}}', getReviewPassagesCatalog())`.
- `getCatalogContentHash():139-143` — add `getReviewPassagesCatalog()` to the combined array.

`retrieveMovesForDimension`: widen `validIds` to include passage ids; instruction → "rank CRAFT MOVES
and ADVISOR-KNOWLEDGE passages whose mechanism/principle would build the TARGET DIMENSION." Passages
hydrate to `[PRIN-n]` labels in the teaching block.

*GAP-7 — extend the same chunker:*

```typescript
// in buildReviewPassages.ts, after docs:
for (const s of STRATEGY_REGISTRY)  // src/workshop/strategies — imported by the BUILD SCRIPT only, not EI runtime
  push({ id:`rp-strat-${s.id}`, title:s.name, source:'workshop/strategies',
         text:`${s.teaching.explanation} ${s.teaching.howToUse} ${s.examples?.[0] ?? ''}` });
for (const p of PATTERN_REGISTRY) if (p.beforeAfter)
  push({ id:`rp-pat-${p.id}`, title:p.name, source:'workshop/patterns',
         text:`${p.teaching} BEFORE: ${p.beforeAfter.before} AFTER: ${p.beforeAfter.after}` });
// signals NOT imported (dead code + closed-formula, LLM-first conflict)
```

**Critical LLM-first guard.** The chunker assigns **no** rubric dimensions to passages — dimension-fit
is judged at rank time by Haiku. This is what keeps GAP-6 from becoming the taxonomy project.

**Integration points.** `scripts/buildReviewPassages.ts` (net-new). `corpus/reviewPassages.generated.ts`
(committed output, ~210-240 clean passages + ~15 registry). `claudeRetrieval.ts` (`getReviewPassagesCatalog`,
`buildSystemPrompt:228`, `getCatalogContentHash:139`, `retrieveMovesForDimension` validIds + instruction +
hydration). `ReviewPassage` type.

**Cost.** Build-time **$0** (no LLM). Larger cached catalog: first call per cache-TTL ~+$0.02 cache write,
then ~$0.005/call. Net per-essay ~$0. Passages never enter L3.75 Phase B (17000 cap) — they live only in
the retrieval system prompt; only ≤k retrieved entries flow downstream.

**Source.** rethink + refined. Rationale: chunk-as-passage gets ~80% of the breadth for ~5% of the effort
of ENCODE-as-authoring (the most expensive item in either source plan). Refinement: verification found
~27/106 sections are table-led, so the naive "split + skip <25 words + truncate 600" produces ~60-90 ugly
table-fragment passages — the **table-strip guard is mandatory** (Rethink's chunker omitted it).

---

### Item 4 — GAP-4: Route the student-facing manifest through dimension-targeted retrieval

**Before.** `buildImprovementManifest` (`analysisOrchestrator.ts:2454`, **sync**, one live call at
`:1432` inside async `analyzeEssay`) resolves `technique` via `matchClaimToTechnique` — a **14-route**
hardcoded keyword table (`:2877-2890`, e.g. `['telling','showing']→SHOW THROUGH SPECIFIC ACTION`).
`demonstration` is **hardcoded null** at every assembly site (`:2493/:2528/:2559/:2587/:2697`). For
`claim="the reflection stays abstract"` no keyword matches → `technique:null`, `demonstration:null`.
The 190-move corpus + new passages never reach the student. This is the smoking gun for generic output,
separate from the flag bug. (Violates LLM-first: closed taxonomy for a contextual decision.)

**After.** A single async post-pass enriches manifest items by routing each through the **same**
`retrieveDimensionMoves` call — reading the paragraph's L3.5 `dimensionTarget` (Item 2). Real move →
`technique` = displayName, `demonstration` = `sourceEssays[0].excerpt` (verified real field,
`corpusTypes.ts:170`). `matchClaimToTechnique` kept as dead fallback until E2E proves the corpus path ≥
keyword path (migration rule).

**Implementation.**

```typescript
// analysisOrchestrator.ts — make buildImprovementManifest async (caller :1432 already async → just await)
private async enrichManifestWithCorpus(
  items: ImprovementEntry[], profile: EssayProfile, telemetry: CorpusRetrievalTelemetry,
): Promise<void> {
  if (!isCorpusRetrievalEnabledForL5()) return;            // same gate as L5
  const MAX_ENRICHED = 8;
  const seen = new Set<string>();
  for (const item of items.slice(0, MAX_ENRICHED)) {
    if (item.technique && item.demonstration) continue;     // already resolved
    const target = resolveTarget(item, profile);            // see below — NO keyword table
    const dk = `${target.dimension}|${target.intent.slice(0,60)}`;
    if (seen.has(dk)) continue; seen.add(dk);
    const moves = await retrieveDimensionMoves(target, profile, telemetry, 'feedback');
    if (!moves.length) continue;                            // degrade: keep "Address: …" (no fake fallback)
    const m = moves[0], src = m.sourceEssays?.[0];
    item.technique     ??= m.displayName;
    item.demonstration ??= src ? `${src.excerpt} — ${src.essayId} P${src.paragraph}` : null;
    item.action          = `Apply ${m.displayName}: ${truncate(m.mechanism, 140)}`;
  }
}

// resolveTarget: prefer the persisted L3.5 target; for essay-level items (paragraph === -1)
// synthesize from the observation text. intent alone is a sufficient query — dimension is advisory,
// not a filter → NO keyword table anywhere.
function resolveTarget(item: ImprovementEntry, profile: EssayProfile): DimensionTarget {
  const para = item.paragraph >= 0 ? profile.paragraphs[item.paragraph] : undefined;
  return para?.analysis?.dimensionTarget
      ?? { dimension: 'show_dont_tell_craft', intent: item.observation, severity: 'blocking' };
}
```

Call it just before `return manifest` in `buildImprovementManifest`. **Do not delete**
`matchClaimToTechnique` yet (legacy-as-dead-code migration rule; delete after E2E validates corpus ≥ keyword).

**detectFabricatedReferences does NOT apply here** (verified: manifest entries carry no `[MOVE-n]`
labels — `demonstration` is a verbatim admitted-essay excerpt). The anti-copy rail is the provenance
tag (`— essayId Pn`) + "reference" framing already on the excerpt.

**Integration points.** `analysisOrchestrator.ts`: `buildImprovementManifest:2454` → async; call site
`:1432` → add `await`; `enrichManifestWithCorpus` + `resolveTarget` net-new; `matchClaimToTechnique:2874`
deprecated (kept). Depends on Item 2 (dimensionTarget) + Item 1 (gate).

**Cost.** +~$0.04/essay worst case (~8 entries; ~5 typical after dedup). $0 one-time.

**Source.** rethink (manifest routing = the same retrieval call) + refined with verified line numbers
(14 routes not 17; null sites 2493/2528/2559/2587/2697; sync→async with one async caller).

---

### Item 5 — GAP-9 support: teaching-framed move block (replaces calibration framing)

**Before.** `buildCorpusMovesBlock` (`corpusRetrievalBlocks.ts:431`) frames moves as scoring-calibration
text ("score confidently 75+"). Injected into L5 it teaches nothing.

**After.** A `buildTeachingMovesBlock` modeled on the descriptive `buildDescriptiveArchetypesBlock`
(`:527`): move name + mechanism + `sourceEssays[0].excerpt` + reason, `[MOVE-#]` labels, instruction
"Teach the student to ADD this missing move; cite [MOVE-#]; never invent labels." No score/calibrate
language. Used by L5 (Item 2d) and available to the manifest.

**Implementation.**

```typescript
function buildTeachingMovesBlock(moves: CraftMove[]): string {
  if (!moves.length) return '';
  const lines = moves.map((m, i) => {
    const ex = m.sourceEssays?.[0]?.excerpt;
    return `[MOVE-${i+1}] ${m.displayName}\n  Mechanism: ${m.mechanism}` + (ex ? `\n  Seen: "${ex}"` : '');
  });
  return `CRAFT MOVES TO TEACH (add what's missing; cite [MOVE-#]; do not invent labels):\n${lines.join('\n')}`;
}
```

**Integration points.** `corpusRetrievalBlocks.ts` (net-new, near `:527`). Consumed in
`deepAnnotationService.ts` (Item 2d).

**Cost.** $0 (formatting only).

**Source.** direct (teaching-framed block, descriptive template). Rationale: `buildCorpusMovesBlock`'s
calibration framing is wrong for coaching; the descriptive block is the right template.

---

### Item 6 — Generalize detectFabricatedReferences for future label kinds (small, do with Item 3)

**Before.** Regex `/\[(MOVE|AP)-(\d+)\]/g` (`corpusRetrievalBlocks.ts:567`) matches only MOVE/AP. If a
`[PRIN-n]` (advisor-passage) label is ever emitted downstream, it is **invisible** to all 7 fabrication
sites — a model could cite `[PRIN-99]` and it would never be flagged (silent attribution hole, NOT a
false positive). Verified.

**After.** Generalize to capture any kind + validate against a per-kind injected-count map. Unknown
kind ⇒ fabricated. Passages are ranked but we keep them under `[MOVE-#]` labels in the teaching block
for now (Item 5 uses MOVE only), so this is a **forward-safety** change with no behavior change today.

**Implementation.**

```typescript
const labelRe = /\[([A-Z]+)-(\d+)\]/g;
export function detectFabricatedReferences(text: string, injected: Record<string, number>) {
  const referenced: string[] = []; const fabricated: string[] = [];
  for (const m of text.matchAll(labelRe)) {
    const [, kind, n] = m; const idx = Number(n); const label = m[0];
    const max = injected[kind];
    if (max === undefined || idx < 1 || idx > max) fabricated.push(label); else referenced.push(label);
  }
  return { referenced, fabricated };
}
// 7 call sites: detectFabricatedReferences(blob, { MOVE: moveCount, AP: apCount })
```

**Integration points.** `corpusRetrievalBlocks.ts:560-579`; update the 7 call sites to pass a count map
(mechanical). 

**Cost.** $0.

**Source.** refined. Rationale: verification found `[PRIN-n]` is a silent hole, not a false positive —
the safer fix is a per-kind map so any future label is automatically covered.

---

### Item 7 — GAP-5: Residual move authoring (DEFERRED, telemetry-gated)

**Before/After.** After Items 2-3 ship, run a batch and read corpus telemetry: which rubric dims still
under-retrieve (passages cover principle, but a move with mechanism+excerpt teaches the rewrite better)?
For the 2-3 highest-weight dims still thin, hand-author ≤10 true `CraftMove`s **harvested from the 14
corpus essays where the move demonstrably occurs** (real `sourceEssays` excerpt — no fabricated
provenance). Authoring before telemetry = guessing.

**Cost.** $0 LLM (human time). Deferred.

**Source.** rethink. Rationale: GAP-6 passages substantially resolve GAP-5; authoring should be
telemetry-driven, not front-loaded. (Direct front-loaded a Sonnet authoring pass — rejected as guessing.)

---

## Execution Order

1. **Item 1 (GAP-3 flag fix).** Ship first; nothing else surfaces output without it.
   *Verify:* run an essay with `ENABLE_CORPUS_RETRIEVAL_L35=true`; telemetry shows `injections>0` at L3.5;
   set L5 and confirm L5 attempts appear.
2. **Item 2 (GAP-1/2/9 DimensionTarget + dim retrieval).** Depends on 1.
   *Verify:* a reflection-weak paragraph's `analysis.dimensionTarget.dimension==='reflection_meaning_making'`;
   `retrieveMovesForDimension` returns moves whose `reason` cites mechanism (not topical similarity); a
   cross-register move appears penalized-but-present (soft rank), no hard voice exclusion.
3. **Item 5 (teaching block).** Depends on 2 (L5 consumes it). Tiny.
   *Verify:* L5 injects `[MOVE-#]`-labeled teaching text per blocking paragraph, no calibration language.
4. **Item 3 (GAP-6/7 passage band).** Parallel with 2; the rank-widening (3c) depends on 2b.
   *Verify:* `getCatalogContentHash` changes; a reflection query returns ≥1 `rp-*` passage; catalog token
   count ~31K (one cached prompt); no Phase B token change.
5. **Item 6 (detectFab generalize).** Bundle with 3 (forward-safety before any non-MOVE label ships).
   *Verify:* existing MOVE/AP attribution tests still pass; a synthetic `[PRIN-99]` is flagged fabricated.
6. **Item 4 (GAP-4 manifest routing).** Depends on 2 (target) + 1 (gate); benefits from 3.
   *Verify:* manifest item for "reflection stays abstract" now carries `technique` + a real
   `demonstration` excerpt with provenance; `matchClaimToTechnique` no longer the sole source.
7. **Item 7 (GAP-5 residual moves).** Deferred; telemetry-gated after 2-4 run on real essays.
   *Verify:* telemetry identifies still-thin dims before any authoring.

Critical path: **1 → 2 → 4**. Items 3/5/6 feed the catalog/quality in parallel. Item 7 last.

---

## Cost Summary

| Item | Per-essay delta (fully on) | One-time |
|------|----------------------------|----------|
| 1 — flag fix + enable L3.5/L5 | +~$0.03 (~6 Haiku calls) | $0 |
| 2 — DimensionTarget + dim retrieval | +~$0.013 (L3.5 +$0.003 out-tok; L5 +$0.015 − $0.005 replaced) | $0 |
| 3 — passage band (build-time chunk) | ~$0 (cache write ~+$0.02 first call/TTL) | $0 |
| 4 — manifest routing | +~$0.04 worst (~5 typical) | $0 |
| 5 — teaching block | $0 | $0 |
| 6 — detectFab generalize | $0 | $0 |
| 7 — residual moves (deferred) | $0 | $0 (human time) |
| **Total** | **~+$0.04/essay typical (~+$0.08 worst)** | **$0** |

Comfortably under the ≤$1.50/essay target and the $5/run cap. The earlier source-plan one-time spend
($1.50-3.05 for Sonnet distillation/authoring) is **eliminated** — chunk-as-passage replaces it. The only
optional future one-time spend is a Sonnet distillation pass (Open Question O-3), not required to ship.

---

## Existing Infrastructure Leveraged

- **Claude-native ranking** (`claudeRetrieval.ts:236 runRanking`) — cached Haiku catalog, JSON mode,
  hallucinated-id drop (`parseRanking:187`), 0.4 relevance floor (`:204`). Reused unchanged by the new
  dimension path → cache still hits.
- **L3.5 per-paragraph Sonnet call** (`analysisPass.ts:2473 analyzeSingleParagraph`) + extensible
  `AnalysisPassOutput` schema (`profileTypes.ts:4274`, Port B1/B3 precedent) + persistence site
  (`essayProfileManager.ts:2333`). The DimensionTarget rides this — no new layer, no new call.
- **Per-layer flag resolvers** (`corpusRetrievalBlocks.ts:195-212`) + `resolveLayerFlag` fallback.
- **`'review-passage'` EmbeddingEntityType** (`corpusTypes.ts:462`) — designed-for, reused.
- **`SourceEssayCitation.excerpt`** (`corpusTypes.ts:170`) — real verbatim demonstration text.
- **`buildDescriptiveArchetypesBlock:527`** — template for the teaching block.
- **L5 `paraRelevantContext` per-paragraph hook** (`deepAnnotationService.ts:986`) — injection point.
- **Voice forbidden-cell rail** (`getForbiddenArchetypesForVoice:151`) — left intact (archetypes only).
- **Telemetry** (`CorpusRetrievalTelemetry:110`) — the batch-run verification surface for every Verify step.

---

## Open Questions

- **O-1 (GAP-8 RAG).** RAG (`src/services/rag/`, pgvector, empty in prod, needs OPENAI_API_KEY) stays
  OFF the critical path — the Claude-native catalog closes GAP-2/4/6 without it. RAG is the right home for
  **real before/after PAIRS at scale** (diversity + anti-copy, `ragService.ts:370-441`); wire as a SECOND
  demonstration source behind `retrieveDimensionMoves` (corpus excerpt first, RAG pair second) only once
  GAP-10 lands real pairs and a seed exists. Keep EI→RAG imports at 0 now.
- **O-2 (GAP-10 ingestion).** Real-essay / real-pair ingestion is a parallel content-acquisition track,
  not a code item. The chunker + catalog scale to it. Resolve **rights before ingesting**.
- **O-3 (distillation vs chunk-as-passage).** Item 3 chunks passages as-is ($0). A later Sonnet
  distillation pass (~$1.50-2.00 one-time) could convert the cleanest passages into structured
  `AdvisorPrinciple` entries (principle + detectionSignal + diagnosticTest) for sharper retrieval. Decide
  AFTER telemetry shows whether raw passages retrieve well enough. Ship chunk-first.
- **O-4 (Crimson rights).** The source plans' premise that "10 of 14 essays came from a Crimson-sponsored
  source" is **unverifiable** — no Crimson source in `corpus/external/sources.json`. Treat that
  provenance/rights premise as unconfirmed; does not block Items 1-6 (those use already-attested
  `sourceEssays` excerpts only).
- **O-5 (table-strip tuning).** The chunker's table-strip guard threshold (~27/106 CHARACTER sections are
  table-led) needs an eyeball pass on the generated output — only resolvable by running the build script
  and reading `reviewPassages.generated.ts`.
- **O-6 (intent quality).** Retrieval quality depends on L3.5's free-text `intent`. Mitigated by Sonnet
  full-context + the 0.4 floor (degrades to no-block, not bad-block). Watch telemetry for paras with a
  blocking target but zero retrieved moves — signals weak intent phrasing, tune the L3.5 prompt.
- **O-7 (L3.5 picks ONE dimension/para).** L3.5 surfaces only the single weakest dim. Deferred dims are
  reachable via L6 coaching ("what about my structure?"). If telemetry shows students systematically need
  a second target, revisit (would add output tokens, not a new call).

---

## Rejected Approaches

- **Direct's static `rubricDimensions: RubricDimensionName[]` cross-tag on all 190 moves via a one-time
  LLM backfill (~$0.40).** Rejected. Verification confirmed Haiku already reads each move's `mechanism`
  in the catalog line (`claudeRetrieval.ts:98`) on every call, and the rank-time judgment with the
  dimension named in the query is both LLM-first-correct (no closed taxonomy for a perception task) and
  free. A static 190-tag table also drifts and adds a maintenance surface for zero retrieval benefit.
  **Hybrid adopted:** rank-time judgment is primary; the rubric dimension name is in the query (Item 2);
  no tagging project. (Coverage-reporting value of Direct's idea is preserved via telemetry, Item 7.)
- **Direct's GAP-6 Sonnet-distilled structured `AdvisorPrinciple` entries (~$1.50-2.00 one-time).**
  Rejected for the **first ship**. Verification confirmed the 4 docs are clean `### `-sectioned markdown
  (106/112/44/60 headings, RED_FLAGS_FOUNDATION exists) → a $0 build-time chunker gets ~80% of the breadth
  immediately. Distillation deferred to Open Question O-3 (do it later if telemetry shows raw passages
  retrieve poorly). The chunker's **table-strip guard** is the one place Rethink's plan was naive
  (~27/106 sections are table-led) — added to Item 3.
- **Routing manifest `weakDimensions` through findings' `HolisticDimension[]` + a holistic→rubric bridge
  (Direct's `inferRubricDimsFromObservation`).** Rejected. Verification found findings carry the 8-value
  `HolisticDimension[]` and the only existing bridge (`teachingContentRouter.ts:258
  DIMENSION_TO_RUBRIC_AFFINITY`) is a lossy string-keyed best-effort map that emits values outside the
  12-enum. L3.5 emitting the canonical `RubricDimensionName` directly (Item 2) is strictly cleaner.
- **Deleting `matchClaimToTechnique` immediately.** Rejected per the migration rule — kept as dead
  fallback until E2E proves the corpus path ≥ keyword path.
- **Wiring the 15 registry signal compute-fns (FIELD_KNOWLEDGE_INTEGRATION_PLAN Phase 4).** Rejected:
  verified dead code (only `autoImport` runs) and a closed deterministic formula (LLM-first conflict).
  Only strategy/pattern *content* is brought over (Item 3 GAP-7), as passages.
- **RAG on the critical path.** Rejected: empty in prod, needs a second provider (OPENAI_API_KEY), and
  the Claude-native catalog closes the critical path without it (Open Question O-1).
- **`isCorpusRetrievalEnabled()` (master) staying as the L5/phase gate.** Rejected — the verified bug.
  Swapped to `isRetrievalEnabledForStage` for the 2 stage-tagged functions; `retrieveParagraphAntiPatterns`
  correctly stays master-gated (verified: no stageTag).
