# D-2.2 RATIONALE — L3 Walk Specifics-Need Emission Prompt

**Status:** RATIFIED 2026-05-01 (round 1.8). Ratified by Tue.
**Spec:** `ROUND_1_8_DRAFT.md` (the canonical prompt).
**Framework:** `PHASE_2_PROMPT_BENCHMARK.md` (round 1.6 framework, ratified 2026-05-01).

---

## What this prompt does

The L3 walk reads the essay sentence by sentence. As it reads, it sometimes notices that the essay is referencing something the writer knows but hasn't put on the page — a moment, a person, a sensory anchor, a stake — that, if specified, would unlock the finding the walk just made AND would be worth the writer's time to think about.

The emission is the structured ask: produce a question for the writer that surfaces a discovery they haven't made about their own essay OR unlocks a coaching move different in shape from what the system can do without their answer.

## Ratification trail

| Round | Status | Notes |
|---|---|---|
| 1 | drafted, self-checked | 4 PASS + 1 ARGUABLE PASS on round-0 gate; 4 open design questions surfaced |
| 1.5 | revised after Tue's directional input on Q1-Q4 | Embedded student line in framingSeed; quality-driven seed length; quality-driven volume; explicit priority; structural anti-repetition |
| 1.6 | revised after 3 deep audits on 1.5 | 3 HIGH (volume, deepening-utility theater, anti-repetition unenforceability) closed inline; 6 MED + 5 LOW closed; 5-condition gate became 6 with §2.0 working-move silence; round-0 gate grew to 6 tests |
| 1.7 | reframed after Tue's brainstorm on purpose / volume / repetition | System-side primary purpose; self-sufficiency principle; surface-vs-deep filter; concept tracker (Mode A/B/C); hard 3-5 cap; new `expectedDiscovery` field; round-0 gate grew to 7 tests |
| 1.8 | revised after 3 deep audits on 1.7 + Tue's 3-question calibration | User-facing primary (collapsed 1.7's system-side reframe); unresolved-gap-tied tracker (replaces Mode A/B/C); concept library on profile; hard 3 cap with complexity caps (simple=1, medium=2, complex=3); 5 new emission fields; round-0 gate at 8 tests |
| 1.8 RATIFIED | 2026-05-01 | All 18 audit findings (1 CRITICAL + 5 HIGH + 6 MED + 6 LOW from round 1.7 audits) closed inline. All Tue calibrations applied. Translation per §11 begins. |

## Round 1.6 framework citations (D-2.7 forward-looking action items)

**§2.4 + §3 Test 3 — silence is the audit signal.**
Per the D-2.7 audit's forward-looking action item, this prompt's RATIONALE must cite §2.4 + §3 Test 3. Round 1.8 honors this structurally:
- §2.0 working-move silence rule fires before any other condition.
- §2's six-condition gate produces silence by default; emission requires confident-Yes on all six.
- §10's "0-3 emissions per essay" with explicit "0 real gaps → 0 emit" rescues the cap from forced-quota interpretation.
- §8's per-concept complexity caps (simple=1, medium=2, complex=3 unresolved instances) further suppress emission when user demonstrates understanding via iteration.
- Test 7 (worth-the-writer's-time) and Test 8 (`expectedDiscovery` + `conceptTag` swap) close the surface-level emission and theatrical-discovery gaps.

**§2.5 + §3 Test 4 — `framingSeed` plain-language discipline.**
Per the D-2.7 audit's forward-looking action item, this prompt's RATIONALE must cite §2.5 + §3 Test 4. Round 1.8 honors this structurally:
- §4 splits recognition fields (`whyAsked`, `expectedDiscovery`, `expectedInsight`, `conceptTag`, `conceptDefinition`, `conceptExample`) from the single delivery field (`framingSeed`).
- §5 enforces plain-language discipline on `framingSeed` with corpus-bar examples and explicit anti-patterns (jargon leak, validation padding, template with quote slot).
- The `conceptDefinition` and `conceptExample` fields, which DO carry teaching content, are stored in the user-accessible concept library — not surfaced inline in `framingSeed`. The library handles cross-essay-run repetition; the seed stays plain and student-facing.
- Test 4 (high-school-readable `framingSeed` without lookup) is enforced in the round-0 gate.

## Tue's calibration trail

**Round 1.5 directional calibration (Q1-Q4):**
- Q1: `emittingTrigger` (claim text) + `framingSeed` (embedded student line) cover frontend showcase + chat anchor without a third field.
- Q2: Quality-driven seed length, no padding, no repetition — moves the discipline from prompt-level length cap to anti-repetition discipline.
- Q3: Quality-driven volume, no quota — closes Round 1's writer-dominant-only filter as too restrictive.
- Q4: Explicit priority per emission, deepening-utility test on every emission.

**Round 1.7 brainstorm calibration (5 directional changes):**
- 1: System-side primary purpose, student-facing surface secondary (LATER REVERSED in round 1.8 calibration).
- 2: Pragmatic improvement scope.
- 3: Self-sufficiency principle — system must work without answers; emission upgrades, not enables.
- 4: 3-5 per essay total, competitive selection (TIGHTENED to hard 3 in round 1.8).
- 5: Concept tracker for anti-repetition of teaching framing (LATER REPLACED by concept library in round 1.8).

**Round 1.8 final calibration (Q1-Q3, ratified):**
- Q1: User-facing primary (reverses 1.7's system-side reframe). Single-tier emission shape. Every emission must justify itself by user benefit.
- Q2: Don't repeat lessons once user demonstrates understanding. Unresolved-gap-tied tracker — when user iterates and resolves the original gaps, the cap relaxes for new instances of the same concept.
- Q3: Hard cap 3 per essay, complexity-driven per-concept caps (simple=1, medium=2, complex=3 unresolved instances). User-accessible concept library on demand.

## Architectural commitments (carried into translation per §11)

1. **`SpecificsNeedEmission` extends with 5 new fields:** `expectedDiscovery: string | null`, `conceptTag: string` (prose, free-form), `conceptComplexity: 'simple' | 'medium' | 'complex'`, `conceptDefinition: string`, `conceptExample: string`.
2. **`EssayProfile` gets `conceptLibrary: ConceptLibraryEntry[]`** as a sibling of `questionQueue` — append-only across walk passes, user-accessible on demand for definitions + examples.
3. **`UnderstandingWalkOutput`** gets `specificsNeedEmissions?: SpecificsNeedEmission[]` top-level optional (round 1.6 commitment retained).
4. **Coordinator migration:** `EssayProfileCoordinator.fromCheckpoint` defaults `conceptLibrary: []` for legacy profiles (mirrors `improvementCandidateSnapshot` migration pattern).
5. **`buildUserPrompt` extension:** new `walkContext: { priorEmissions: SpecificsNeedEmission[]; conceptLibrary: ConceptLibraryEntry[] }` parameter. Two new context blocks (PRIOR EMISSIONS, CONCEPT LIBRARY) inject alongside the existing HOLISTIC EVOLUTION SO FAR block.
6. **Gap-resolution detection:** new walk-time helper that judges whether prior unresolved gaps still exist in the current iterated draft. Updates `conceptLibrary[].instances[].gapResolved` accordingly. Runs before the per-paragraph loop so the walk sees current resolved/unresolved state.
7. **Post-walk consolidation step:** new step in `sequentialDeepWalk.ts` after per-paragraph loop completes, before return. Groups candidates by `conceptTag`, applies complexity caps, ranks by priority+order, trims to 3 per essay total.
8. **Aggregator validator extension:** D-2.7's `validateEmission` extends to validate the 5 new fields per their type definitions.
9. **Strict-passthrough parser:** `parseSpecificsNeedEmissions` does NOT defensively coerce — malformed emissions pass through to the aggregator's throw, producing the audit signal per the no-fallback charter.

## What this prompt does NOT do

- **Does NOT enumerate the 38 corpus craft moves into the prompt.** The corpus is a smart RAG source; per Option C ratified earlier, the corpus-as-RAG retrieval layer ships when a prompt's quality demonstrably depends on it. Round 1.8 calibrates against the corpus offline (round-0 quality gate); runtime retrieval is deferred to a future deliverable.
- **Does NOT mint emissions whose downstream coaching cannot run without the answer.** Self-sufficiency principle (§2.4) means the walk must already produce a corresponding text-grounded coaching artifact (`growthEdge`, `improvementCandidate`, finding-with-claim) for each emission. The emission upgrades coaching; it does not enable it.
- **Does NOT use Mode A/B/C tiered framing modes.** Every emission fires in full coaching mode. The don't-overwhelm-the-user logic is structural via §8's complexity caps + the user-accessible library, not via prompt-level mode selection.
- **Does NOT carry prior emissions forward as the only anti-repetition mechanism.** The walk receives `priorEmissions[]` for cross-paragraph anti-repetition, AND the concept library tracks taught concepts across walk passes with unresolved-gap-tied semantics.

## Forward-looking notes

1. **Calibration runs.** Once §11 translation lands, run the prompt against the 14-essay calibration corpus to verify the depth bar — Mode B/C transitions deleted in round 1.8 mean the corpus calibration tests now focus on (a) the 3-cap holding, (b) cap-by-complexity firing correctly, (c) gap-resolution detection accuracy, (d) `framingSeed` quality at corpus depth, (e) `expectedDiscovery` content-specificity.
2. **Library UI surface (out of scope for D-2.2).** The user-accessible concept library is referenced in the spec but the surface (where the user looks up concepts) is downstream UX work. D-2.2 produces the library data; the dig flow / chat UI builds the lookup surface.
3. **Gap-resolution detection is judgment-based.** The walk decides whether a gap still exists. Future deliverables may add evidence checks (e.g., explicit text-evidence comparison between draft N and draft N+1) for higher confidence.
4. **Cross-pass concept persistence is append-only.** Library entries are never deleted, only their instances' `gapResolved` flag flips. Future deliverables may add concept retirement (concept becomes irrelevant, mark as archived) if needed.
5. **D-2.6 plug-in (`finding_maturity` source layer) is unblocked.** D-2.2's emission shape is the canonical structure; D-2.6's emissions will conform to the same `SpecificsNeedEmission` interface (extended with 5 new fields) and feed into the same aggregator + concept library pipeline.

---

**Ratified by Tue: 2026-05-01.**
**Next step:** §11 translation work order execution.

---

## §11 translation closure (5 commits + post-close audit)

| Commit | Phase | Tests |
|---|---|---|
| `5b497ec` | §11.1-4 type extensions + RATIONALE.md | 631 → 631 |
| `84cc0ab` | §11.5+13 validator + fixture migration | 631 → 638 (+7 validator) |
| `b34d3f9` | §11.6-8+10-11 walk prompt + parser + write-back + walkContext | 638 → 638 |
| `8205f0d` | §11.9+12 gap-resolution + post-walk consolidation | 638 → 638 |
| `c3263be` | §11.14 consolidation tests + private-method JSDoc | 638 → 652 (+14 consolidation) |
| close commit | Three-agent audit closures (2 LOWs inline) | 652 → 652 |

**Test count:** 638 (D-2.12 close) → **652** (+14 consolidation tests across 5 groups).

**Per-edit cycle discovery:** `npx tsc --noEmit` (bare default with project references in `tsconfig.json`) silently no-ops on broken files. Real errors surface only with `npx tsc -p tsconfig.app.json --noEmit`. Documented in commit `c3263be` body. Forward-looking deliverable: flip pre-commit hook / CLAUDE.md quick-reference to use the explicit app-config flag, OR add a CI gate that runs the app-config explicitly. Not in D-2.2's scope; surfaced for follow-up.

## Three-agent audit verdicts (post-implementation, before close)

**Contract auditor — GREEN-TO-CLOSE.**
All 10 mechanisms verified line-by-line against round 1.8 §2/§3/§8/§10/§11: six-condition gate, schema literal correctness, validator alignment for 5 new fields, strict-passthrough parser, write-back wiring, 6-step consolidation, walkContext threading, cap relaxation, profile migration, no-fallback charter chain. No findings.

**Code quality auditor — GREEN-TO-CLOSE with 3 forward-looking NIT/LOWs.**
12/12 checklist items pass. Forward-looking items (calibration-stage work, not blocking):
- Test coverage gap: end-to-end strict-passthrough test (LLM produces malformed → parser passes → aggregator throws). Behavior implicitly covered.
- Test coverage gap: steady-state cross-pass library persistence test (prior unresolved survives + new emission appends).
- OUTPUT_SCHEMA description text could leak under stress; calibration runs (RATIONALE forward-looking note 1) will surface drift.
- Naming nit: `survivingPerConcept` could read better as `perConceptSurvivors`. Not worth a rename.
- Audit-gap meta-finding: `npx tsc --noEmit` default-config no-op behavior (already flagged above).

**Round 1.6+1.8 conformance auditor — ROUND-1.6+1.8-CLEAN with 2 LOW findings (closed inline).**
Both LOWs closed in close commit:
1. **Pre-output swap-check block** — added 4-line block instructing the LLM to swap-check `expectedDiscovery` and `conceptTag` against another essay before emit; drop or refine if either is word-for-word portable. Closes Test 1/2/8 explicit-gate finding.
2. **Library "user-accessible on demand" framing** — added one paragraph in the concept-library section naming that the library is user-accessible by design (writers can look up definition + example for any concept taught in this essay), so the system can stay terse without re-teaching. Closes Tue calibration #3 framing-gap finding.

## Net verdict on D-2.2

**Implementation feature-complete. All 18 audit findings (1 CRITICAL + 5 HIGH + 6 MED + 6 LOW from round 1.7 audits → resolved in round 1.8 spec) honored in shipped code. Two LOW findings from post-implementation conformance audit closed inline. Three forward-looking items tracked for calibration-stage work.**

**Status:** D-2.2 CLOSED 2026-05-01. Ready for §11.15 calibration runs against the 14-essay corpus, which is the next deliverable to surface (a) Mode-A vs Mode-B/C transitions in the consolidation step under realistic prompt outputs, (b) `framingSeed` quality at corpus depth, (c) `expectedDiscovery` content-specificity drift detection, (d) gap-resolution detector accuracy on iterated drafts (the deterministic anchor-existence proxy may need an LLM-judgment replacement if false-positive rate proves high), (e) per-concept complexity cap calibration (whether simple/medium/complex thresholds match real coaching density on top-tier essays).

