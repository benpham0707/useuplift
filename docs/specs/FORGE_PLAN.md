# FORGE PLAN — Concept Suppression, Surfacing, Cross-Essay Convergence

**What changes:** Give the student a way to say "I've got this concept" (writer-mastery claim) and have the system honor it by a deterministic filter at the student-facing surface — WITHOUT touching the resolution/cap channel (which, verified, would *re-enable* teaching, not suppress it). Build the concept-archive read endpoint as a pure projection over `essay_understanding`. Add a falsifiable, fail-open-to-teaching cited cross-essay retrieval block, dark behind a runnable convergence harness gate.

**Verified reality that reshapes the plan:** There is exactly ONE live emission path (`runEssayLevelEmissionPass` → `applyEssayLevelEmissionsToProfile`, called once at `analysisOrchestrator.ts:1175/1179`). `findingMaturityRefresh.ts` is dormant (zero callers). And — the load-bearing correction — **no student-facing surface reads concept teaching today.** `buildImprovementManifest` (`analysisOrchestrator.ts:2454`) is built from L4 priorities + L3.5 findings + L3/L3.75 growth edges; coaching (`coachingService.ts:4428` `buildImprovementQueueSection`) reads ONLY `improvementManifest`. `specificsNeedEmissions`, `questionQueue`, `conceptLibrary`, and `framingSeed` never reach the student. Suppression therefore has to attach to the surface that *does* ship — see Open Question 1.

---

## Item 1 — Writer-Mastery state on concept instances (SHIP NOW, Stage 1)

**Source: hybrid** (Rethink's `resolution` discriminator + writer-mastery framing; Direct's separate-channel instinct; both corrected by the cap-inversion finding).

### Before
`ConceptLibraryEntry.instances[]` (`profileTypes.ts:6385-6396`) carries `gapResolved: boolean` + `resolvedAtIteration?`. Read at 4 sites:
- `profileTypes.ts:6393` (definition)
- `sequentialDeepWalk.ts:1070` — `const unresolved = entry.instances.filter((i) => !i.gapResolved).length;`
- `essayLevelEmissionService.ts:335` (write `gapResolved: false`), `:430` (same unresolved filter)
- `findingMaturityRefresh.ts:284` (same filter — DORMANT)

`gapResolved=true` means "the detector judged this gap closed in a later iteration," which RELAXES the per-concept cap (`profileTypes.ts:6369-6373`), letting the walk mint **fresh teaching** of that concept.

### After
Add a **separate** mastery channel that does NOT feed the cap filter. Keep `gapResolved` exactly as-is (it is the detector's resolution signal; cap relaxation is intended for it).

```typescript
// profileTypes.ts — extend the instances[] element (additive, append-only)
instances: Array<{
  paragraph: number;
  sentence?: number;
  iteration: number;
  /** Detector-judged resolution. RELAXES the cap (re-enables fresh teaching).
   *  UNCHANGED. Do NOT overload this for student suppression. */
  gapResolved: boolean;
  resolvedAtIteration?: number;

  // ── NEW (Item 1) — writer-asserted mastery, SEPARATE channel ──
  /** Student said "I've got this." Does NOT touch the cap. Honored only by the
   *  surfacing filter (Item 2). Null/absent = no claim. */
  writerMastery?: {
    /** 'claimed' = student asserts mastery; 'reapplied' = student reverted the claim. */
    state: 'claimed' | 'reapplied';
    /** Iteration at which the claim was recorded. */
    iteration: number;
    /** The student phrase that triggered the claim (audit/trace). */
    claimText?: string;
    /** ISO timestamp. */
    at: string;
  };
}>;
```

Add the concept-level rollup helper (used by the filter and the route):

```typescript
// profileTypes.ts or a small concept helper module
/** A concept is writer-suppressed iff at least one instance carries an active
 *  'claimed' mastery (no later 'reapplied' on the same instance). Concept-level
 *  because the student suppresses a CONCEPT ("I've got show-don't-tell"), not a
 *  single paragraph instance. */
export function isConceptWriterSuppressed(entry: ConceptLibraryEntry): boolean {
  return entry.instances.some((i) => i.writerMastery?.state === 'claimed');
}
```

**Why a new field, not flipping `gapResolved`:** VERIFIED at `profileTypes.ts:6369-6373` + `essayLevelEmissionService.ts:97` + the unresolved filter at `sequentialDeepWalk.ts:1070`/`essayLevelEmissionService.ts:430`: marking an instance resolved makes `!i.gapResolved` false, which *lowers* the unresolved count, which *relaxes* the cap, which lets the LLM mint MORE teaching of that concept. Rethink's "flip resolution → cap relaxes → LLM stops minting" is exactly backwards (see Rejected Approaches). Suppression must live on a channel the cap never reads.

**Why concept-level (not Direct's per-instance `userSuppressed` on all instances):** the student's mental unit is the concept. Marking one instance is enough to suppress the concept at the surface; we still record WHICH turn/phrase on the specific instance for the trace.

### Integration points
- `profileTypes.ts:6385-6396` — add `writerMastery` to the instance shape; add `isConceptWriterSuppressed`.
- No change to `sequentialDeepWalk.ts:1070`, `essayLevelEmissionService.ts:430`, or `findingMaturityRefresh.ts:284` — they keep reading `!i.gapResolved`. The cap stays untouched by design.
- `gapResolved` blast radius is fully enumerated above (4 sites); we add a field, we do not retype, so zero migration risk on existing readers. Old profiles deserialize with `writerMastery` absent → treated as no claim.

**Cost:** $0 (type + pure helper).

---

## Item 2 — Surfacing-filter that honors writer-mastery (SHIP NOW, Stage 1)

**Source: refined** (Direct's deterministic-filter instinct, retargeted to the surface that actually ships per the verification).

### Before
Concept teaching is plumbed into the profile (`profile.conceptLibrary`, `profile.specificsNeedEmissions`, `questionQueue`) but **never surfaces to the student** — `buildImprovementManifest` (`analysisOrchestrator.ts:2454`) never reads any of those; it reads `coachingMap.priorities`, `findingStore.getActiveSortedByCoachingValue()`, and growth edges. So a "suppress this concept" filter has nothing to filter today.

### After
Two parts, gated on resolving Open Question 1 (which surface ships):

**2a. Suppression-aware filter (deterministic, always correct regardless of surface):**

```typescript
// concept surfacing filter — pure, deterministic, no LLM
export interface ConceptSurfaceDecision {
  surfaceable: ConceptLibraryEntry[];   // student-visible
  suppressedContext: ConceptLibraryEntry[]; // LLM sees as CONTEXT, never surfaced
}
export function partitionConceptsForSurface(
  library: ConceptLibraryEntry[],
): ConceptSurfaceDecision {
  const surfaceable: ConceptLibraryEntry[] = [];
  const suppressedContext: ConceptLibraryEntry[] = [];
  for (const entry of library) {
    (isConceptWriterSuppressed(entry) ? suppressedContext : surfaceable).push(entry);
  }
  return { surfaceable, suppressedContext };
}
```

Suppressed concepts are NOT deleted and NOT hidden from the LLM — they move to a `[WRITER SAYS THEY'VE GOT THIS — context only, do not re-teach]` block so the model retains awareness but never re-surfaces. Two distinct boundaries (Direct's insight): the *cap* boundary (analysis, untouched) and the *surface* boundary (this filter).

**2b. Wire concept teaching to the manifest surface (the actual gap):** add a Source to `buildImprovementManifest` that maps unsuppressed `conceptLibrary` entries / `specificsNeedEmissions` into `ImprovementEntry` items, then apply `partitionConceptsForSurface` so suppressed concepts never produce manifest items. The mirror `[SUPPRESSED]` label appears at the manifest-build site (single surface) — NOT mirrored across the 3 analysis render sites Direct proposed (those are cap/analysis context, the wrong layer to filter; mirroring there risks suppressing analysis the LLM needs).

```typescript
// analysisOrchestrator.ts buildImprovementManifest — NEW source after growth edges
const lib = profile.conceptLibrary ?? [];
if (lib.length > 0) {
  const { surfaceable } = partitionConceptsForSurface(lib);
  sources.push('concept_library');
  for (const entry of surfaceable) {
    // most recent unsuppressed instance → manifest item
    const inst = entry.instances[entry.instances.length - 1];
    items.push({
      id: `IMP_${priority}`,
      paragraph: inst?.paragraph ?? -1,
      observation: entry.definition,
      action: `Concept to internalize: "${entry.tag}"`,
      stakes: entry.example,
      technique: null, demonstration: null, wordEconomyCut: null,
      source: 'concept_library', sourceRef: entry.tag,
      priority: priority++, impact: 'significant',
      conversatorEnrichments: [],
    });
  }
}
```

### Integration points
- New filter module under `src/services/essayIntelligence/coaching/` (or `analysis/`); pure, unit-testable.
- `analysisOrchestrator.ts:2454` `buildImprovementManifest` — add the concept source + filter call (2b).
- `ImprovementEntry.source` union (`profileTypes.ts`) — add `'concept_library'`.

**Cost:** $0 (deterministic).

---

## Item 3 — Writer-mastery claim/reapply route (SHIP NOW, Stage 1)

**Source: hybrid** (Rethink's HTTP-409-loud + `availableTags` + single-write-path co-location; Direct's exact-string flip + no-silent-no-op proof; Rethink's optional Conversator-rides classification deferred — see Open Question 2).

### Before
No endpoint lets a student assert mastery. No mutator exists.

### After
One route, two actions, co-located conceptually with the single write path. Load → mutate → save via the existing `SupabaseCheckpointStore` (verified API: `new SupabaseCheckpointStore(userId).load(essayId)` / `.save(profile, { essayId, ... })`).

```typescript
// essayCoachingRoutes.ts — new route
// POST /essay-coaching/concept-mastery
// body: { essayId: string, conceptTag: string, action: 'claim' | 'reapply', claimText?: string }
essayCoachingRouter.post('/essay-coaching/concept-mastery', requireAuth, async (req, res) => {
  const userId = (req as any).auth.userId;
  const { essayId, conceptTag, action, claimText } = req.body ?? {};
  if (!essayId || !conceptTag || (action !== 'claim' && action !== 'reapply')) {
    return res.status(400).json({ success: false, error: 'invalid_input',
      code: 'invalid_input' });
  }
  const { SupabaseCheckpointStore } = await import('@/services/essayIntelligence/profileManager/supabaseCheckpointStore');
  const store = new SupabaseCheckpointStore(userId);
  const profile = await store.load(essayId);
  if (!profile) return res.status(404).json({ success: false, error: 'essay profile not found', code: 'not_found' });

  const result = applyWriterMasteryClaim(profile, conceptTag, action, claimText);
  if (!result.matched) {
    // no-silent-no-op proof: loud 409 + availableTags so the caller can correct
    return res.status(409).json({ success: false, code: 'concept_tag_no_match',
      error: `No concept tag "${conceptTag}" in this essay's library`,
      availableTags: result.availableTags });
  }
  await store.save(profile, { essayId, /* metadata mirrors /respond save site */ });
  return res.json({ success: true, conceptTag, action, instancesAffected: result.instancesAffected });
});
```

```typescript
// mutator — co-located with the single write path (essayLevelEmissionService.ts)
export function applyWriterMasteryClaim(
  profile: EssayProfile, conceptTag: string,
  action: 'claim' | 'reapply', claimText?: string,
): { matched: boolean; instancesAffected: number; availableTags: string[] } {
  const lib = profile.conceptLibrary ?? [];
  const entry = lib.find((e) => e.tag === conceptTag); // EXACT string match (deterministic)
  if (!entry) return { matched: false, instancesAffected: 0, availableTags: lib.map((e) => e.tag) };
  const iteration = profile.index?.iterationLedger?.currentIteration ?? 1;
  const at = new Date().toISOString();
  let affected = 0;
  for (const inst of entry.instances) {
    if (action === 'claim') { inst.writerMastery = { state: 'claimed', iteration, claimText, at }; affected++; }
    else if (inst.writerMastery) { inst.writerMastery = { state: 'reapplied', iteration, at }; affected++; }
  }
  return { matched: true, instancesAffected: affected, availableTags: lib.map((e) => e.tag) };
}
```

**Why exact-string flip (not LLM fuzzy match at the route):** the flip must be deterministic and auditable. Fuzzy student-phrase→tag matching (Rethink) is a UX nicety that belongs in the Conversator turn that produces `conceptTag`, NOT in the persistence mutator — keep the mutator a pure exact-match flip.

### Integration points
- `essayCoachingRoutes.ts` — new route (mirrors the load/save pattern at `:397-455`).
- `essayLevelEmissionService.ts` — export `applyWriterMasteryClaim` next to `applyEssayLevelEmissionsToProfile` (single-write-path co-location).

**Cost:** $0 (no LLM in the route; optional classification is Open Question 2).

---

## Item 4 — Concept-archive read endpoint (SHIP NOW, Stage 1)

**Source: refined** (both converged on read-time projection; reuse the verified `buildStudentDigest` query shape).

### Before
No way to list a student's concept library across essays. Direct proposed a union query; Rethink proposed read-time projection. Both equivalent here — no new table.

### After
Pure read-time projection over `essay_understanding`, reusing the exact query `buildStudentDigest` already runs (`essayCoachingRoutes.ts:250-254`): `.select('essay_id, essay_type, profile_cache').eq('user_id', userId).not('profile_cache','is',null)`. Group concepts by **exact tag** (no substring merging — Direct's "discard substring matching" correction). Sub-50ms for <50 essays; revisit a materialized table only if a student exceeds that.

```typescript
// GET /essay-coaching/concept-archive
interface ArchivedConcept {
  tag: string;
  complexity: 'simple' | 'medium' | 'complex';
  definition: string;
  example: string;
  essays: Array<{ essayId: string; essayType: string;
    instanceCount: number; suppressed: boolean }>;
}
export async function projectConceptArchive(userId: string): Promise<ArchivedConcept[]> {
  const { data } = await supabaseAdmin.from('essay_understanding')
    .select('essay_id, essay_type, profile_cache')
    .eq('user_id', userId).not('profile_cache', 'is', null);
  const byTag = new Map<string, ArchivedConcept>();
  for (const row of data ?? []) {
    const lib = (row.profile_cache as any)?.conceptLibrary as ConceptLibraryEntry[] | undefined;
    for (const entry of lib ?? []) {
      let agg = byTag.get(entry.tag);
      if (!agg) { agg = { tag: entry.tag, complexity: entry.complexity,
        definition: entry.definition, example: entry.example, essays: [] }; byTag.set(entry.tag, agg); }
      agg.essays.push({ essayId: row.essay_id, essayType: row.essay_type ?? 'unknown',
        instanceCount: entry.instances.length, suppressed: isConceptWriterSuppressed(entry) });
    }
  }
  return [...byTag.values()];
}
```
Reapply/suppress from the archive goes through the Item 3 route (per essayId+tag).

### Integration points
- `essayCoachingRoutes.ts` — new GET route + `projectConceptArchive` helper (reuses `supabaseAdmin`).

**Cost:** $0 (DB read).

---

## Item 5 — Cited cross-essay retrieval block (GATED — Stage 3, dark until Item 6 passes)

**Source: rethink** (cited-retrieval reframe is superior: falsifiable, fail-open-to-teaching, dissolves tag-clustering). Verified the "dissolves GAP-4" claim holds — see below.

### Before
No cross-essay signal in the emission pass. Direct proposed env-flagged tag-clustering reuse (GAP-4) + a separate collapse harness (GAP-5). Rethink reframed both as one cited-retrieval mechanism.

### After
Append a CITED-RETRIEVAL block to the **user** prompt of `runEssayLevelEmissionPass` (verified: prompt is system+user split — `SYSTEM_PROMPT` cached + `buildUserPrompt(...)` at `essayLevelEmissionService.ts:252-268`; the block goes inside `buildUserPrompt`, after the concept-library section). The LLM is asked, per candidate it would promote:

> "Has this student been taught THIS EXACT mechanism in a prior essay? If yes, cite `{ essayId, tag, sameMechanismBecause }`. If you cannot cite a real prior essay+tag, leave `priorTeaching` null."

New nullable field on `SpecificsNeedEmission`:
```typescript
/** Stage-3 cited cross-essay retrieval. Null = no prior teaching cited. */
priorTeaching?: { essayId: string; tag: string; sameMechanismBecause: string } | null;
```

**Deterministic validation, fail-open-to-teaching:** after the pass, for each emission with `priorTeaching != null`, verify the cited `essayId`+`tag` actually exist in the student's corpus (reuse `projectConceptArchive`). If VALID → record `writerMastery`-adjacent provenance is NOT used here; instead set the instance's detector resolution context is left untouched, and the emission is **collapsed** (not surfaced as new teaching, logged as cross-essay-converged). If the citation is INVALID (hallucinated essayId/tag) → **fail OPEN: teach anyway** (a bad citation can never silently suppress).

**Why GAP-4 dissolves (verified):** Direct's GAP-4 needed tag *strings* to converge across essays so a reuse-check could fire. Cited retrieval asks the LLM to name the prior essay+tag explicitly and justify same-mechanism in prose — tags never need to be string-identical, so the clustering/convergence-of-tag-strings problem disappears. Confirmed against `essayLevelEmissionService.ts` reuse policy (`:98`): tag reuse is already prose-phrase + mechanism-match within an essay; extending it to cross-essay via citation is the same shape, no new string-normalization layer.

### Integration points
- `essayLevelEmissionService.ts` `buildUserPrompt` — append the block (GATED: only injected once Item 6 passes; until then the block string is simply not added — no env flag to misconfigure, per Rethink).
- `SpecificsNeedEmission` (`profileTypes.ts:6213`) — add `priorTeaching?`.
- Post-pass validator in `runEssayLevelEmissionPass` — deterministic corpus check via `projectConceptArchive`.

**Cost:** +$0.0012–0.0036/essay (one extra prompt block + nullable output field; matches both designs' estimate).

---

## Item 6 — Cross-essay retrieval convergence harness (the gate; built with Item 5, run before Item 5 ships)

**Source: hybrid** (Rethink's cited-validity metric + no-flag gate; Direct's concrete fixture format, cost math, stability metric, pass-bar enforcement, $5-cap abort).

### Implementation
`tests/essay-intelligence/test-cross-essay-retrieval-gate.ts`. Replays ONLY the emission pass in isolation — VERIFIED feasible: `runEssayLevelEmissionPass(profile, findingStore)` is directly importable; a FindingStore stub is `FindingStore.deserialize({ findings: [], nextId: 1 })` (verified static factory at `findingStore.ts:441`). Fixtures are full `EssayProfile` JSONs (the corpus already exists at `tests/output/full-profile-*.json`).

- **Corpus:** ~15 fixture profiles × 3 runs = 45 Sonnet calls ≈ **$1.55** (under the $5 hard cap). Abort + report if running cost crosses $5.
- **Gold:** `tests/fixtures/cross-essay-gold.json` — human-labeled cross-essay candidate PAIRS with `sameMechanism: true|false` and the true prior `{essayId, tag}`.
- **Metrics & pass-bars (enforced; FAIL → Item 5 stays dark, ship Items 1-4 only):**
  - citation-validity ≥ 0.99 (cited essayId+tag exist in corpus — deterministic check)
  - precision ≥ 0.95 (validated-collapses that gold agrees are same-mechanism / all collapses)
  - recall ≥ 0.80 (collapses caught / gold same-mechanism pairs)
  - stability ≥ 0.90 (mean pairwise Jaccard of the 3 runs' collapse sets)
- **Gate mechanism:** the cross-essay prompt block in `buildUserPrompt` stays un-injected until this harness passes all four bars (no env flag — the code path is dark, per Rethink). Flipping it on is a one-line code change reviewed against the harness report.

**Cost:** ≈$1.55 per gate run (gated, not per-essay production cost).

---

## Execution Order

1. **Item 1** (type + helper). *Verify:* `npx tsc --noEmit` clean; `isConceptWriterSuppressed` unit test (claimed → true, reapplied-only → false, empty → false). Confirm `sequentialDeepWalk.ts:1070` / `essayLevelEmissionService.ts:430` filters still read `!i.gapResolved` (grep, unchanged).
2. **Item 3** (mutator + route) — depends on Item 1. *Verify:* unit test `applyWriterMasteryClaim` exact-match flip + 409 `availableTags` on no-match + reapply path. Route returns 404 (no profile) / 409 (no tag) / 200 (matched).
3. **Item 2** (filter + manifest wiring) — depends on Item 1. *Verify:* `partitionConceptsForSurface` partitions correctly; suppressed concept produces ZERO manifest items but appears in the `[WRITER SAYS THEY'VE GOT THIS]` context block; unsuppressed concept produces a manifest item. RESOLVE Open Question 1 before this lands.
4. **Item 4** (archive endpoint) — depends on Item 1. *Verify:* `projectConceptArchive` groups by exact tag across ≥2 fixture essays; `suppressed` flag reflects Item 1 state.
5. **Item 6** (harness) — built before Item 5 is wired. *Verify:* harness runs against fixtures, reports all 4 metrics, aborts on $5 cap.
6. **Item 5** (cross-essay block) — GATED. *Verify:* only inject the prompt block after Item 6 reports PASS on all bars; deterministic validator fails-open on hallucinated citations (unit test: invalid essayId → emission still surfaces).

Items 1-4 SHIP NOW. Items 5-6 are Stage 3: Item 6 always runs; Item 5's prompt block is dark until Item 6 passes.

## Cost Summary

| Item | When | Cost |
|------|------|------|
| 1 Writer-mastery type/helper | Ship now | $0 |
| 2 Surfacing filter + manifest wiring | Ship now | $0 |
| 3 Mastery claim/reapply route | Ship now | $0 |
| 4 Concept-archive endpoint | Ship now | $0 |
| 5 Cited cross-essay block | Gated (Stage 3) | +$0.0012–0.0036 / essay |
| 6 Convergence harness | Gate run | ≈$1.55 / run (one-off, under $5 cap) |

Production per-essay delta once Stage 3 ships: +≤$0.0036. Well under the ≤$1.50/essay target.

## Existing Infrastructure Leveraged

- **Single write path:** `applyEssayLevelEmissionsToProfile` (`essayLevelEmissionService.ts:305`) — mastery mutator co-located here.
- **Persistence:** `SupabaseCheckpointStore.load/save` (`supabaseCheckpointStore.ts:47/112`), `onConflict: 'essay_id,user_id'`.
- **Archive query:** reuse `buildStudentDigest`'s `essay_understanding` union (`essayCoachingRoutes.ts:250-254`).
- **Harness stub:** `FindingStore.deserialize` (`findingStore.ts:441`); fixture corpus `tests/output/full-profile-*.json`.
- **Prompt split:** cached `SYSTEM_PROMPT` + `buildUserPrompt` (`essayLevelEmissionService.ts:252-268`) — cross-essay block goes in the user prompt.
- **Cap/resolution channel:** UNTOUCHED by design (`profileTypes.ts:6369-6373`, walk filter `sequentialDeepWalk.ts:1070`).

## Open Questions (with resolution plan)

1. **Which surface ships the concept teaching?** VERIFIED: today NOTHING surfaces concepts — `buildImprovementManifest` reads L4 priorities/findings/growth edges, never `conceptLibrary`/`questionQueue`/`specificsNeedEmissions`; coaching reads only `improvementManifest`. The honest framing: Item 2 has two halves — (2a) the suppression filter is correct independent of surface; (2b) plumbing concepts INTO the manifest is the surface decision. **Resolve during Item 2 impl:** confirm with Tue whether concepts surface via the manifest (Item 2b as written, lowest-risk since coaching already reads it) OR via activating a questionQueue→chat path (larger build). Default to the manifest path; do NOT pretend the questionQueue surface exists. If the manifest path is chosen, Item 2b ships; if questionQueue is chosen, Item 2b becomes "activate questionQueue read in coachingService" and is scoped as a dependency.
2. **Does mastery classification ride the Conversator turn (Rethink's $0 `masteryClaim` field) or require an explicit UI action?** Resolve during Item 3 impl: the route accepts an explicit `conceptTag` either way. If the Conversator detects "I've got show-don't-tell" and resolves it to a tag, it calls the route — that classification is a separate Conversator-prompt change, deferrable. Ship the explicit route first.
3. **Concept-level vs instance-level suppression granularity** — shipping concept-level (`isConceptWriterSuppressed` = any claimed instance). If real usage shows students wanting per-paragraph suppression, the field already records per-instance state to support it later.

## Rejected Approaches

- **Rethink's cap-based suppression honoring ("flip resolution → cap relaxes → LLM stops minting") — REJECTED as backwards.** VERIFICATION THAT KILLED IT: `profileTypes.ts:6369-6373` documents and `essayLevelEmissionService.ts:97` + the unresolved filter at `sequentialDeepWalk.ts:1070` / `essayLevelEmissionService.ts:430` implement: `unresolved = instances.filter(i => !i.gapResolved).length`; the cap fires when `unresolved >= cap[complexity]`. Marking instances resolved DECREASES `unresolved`, RELAXES the cap, and RE-ENABLES fresh teaching of that concept. So routing suppression through resolution would cause MORE teaching of the concept the student wanted silenced — the exact opposite of intent. Suppression lives on the separate `writerMastery` channel (Item 1) that the cap never reads.
- **Direct's mirror-`SUPPRESSED_LABEL` at all 3 analysis render sites (`sequentialDeepWalk.ts:1069-1076`, `essayLevelEmissionService.ts:429-436`, `findingMaturityRefresh.ts:283-290`) — REJECTED.** Those are cap/analysis-context sites; filtering there would hide concepts from the analysis LLM (which needs full awareness) and one of them (`findingMaturityRefresh`) is dormant. Suppression belongs only at the student-facing surface (Item 2).
- **Direct's env flag `CROSS_ESSAY_CONVERGENCE_ENABLED` — REJECTED** in favor of Rethink's no-flag dark-code gate: a flag is a misconfiguration surface; leaving the prompt block un-injected until the harness passes is unambiguous.
- **`findingMaturityRefresh` "parallel emitter re-emission bug" (Direct + diagnostic) — MOOT.** VERIFIED dormant: `refreshFindingMaturity` has zero callers in `src/` (only a comment at `specificsNeedAggregatorIntegration.ts:141`). Not a Stage-1 work item. GUARD: if it is ever wired in future, it must inherit the same surface-level suppression treatment (it currently reads `!i.gapResolved` at `:284`, same cap channel — it must NOT be made to read `writerMastery`).
- **New `concept_archive` table (Direct's table-vs-query decision) — REJECTED** in favor of read-time projection: <50 essays, sub-50ms, zero sync-bug surface.
