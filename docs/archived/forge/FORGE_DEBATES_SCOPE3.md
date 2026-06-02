# FORGE Debates: Scope 3 — Research Database Integration

Forced-choice rationales for every major design decision in `FORGE_PLAN_SCOPE3.md`. Each entry: the decision, the finalists, the verdict, and the 2-3 sentence rationale.

---

## Decision 1: Where does enrichment run?

**Options**: (A) Inside `buildImprovementManifest()` at analysis time — would need async-ification; (B) Late-bound at coaching session init inside `processCoachingTurn()` — idempotent via flag.

**Verdict**: **direct (Option B)** — late binding at coaching time.

**Rationale**: `collegeId` is not on `PipelineInput` and threading it would couple the analysis layer to supplement-only semantics. `processCoachingTurn()` already receives `collegeId` at parameter position 14 (verified at `coachingService.ts:835`) and already mutates the manifest in place via `conversatorEnrichments.push()` (verified at line 1233). Option A would change interfaces across 5+ call sites for zero functional benefit.

---

## Decision 2: How is enrichment idempotency enforced?

**Options**: (A) Check via presence of enriched fields (e.g., "if item.demonstration exists, skip"); (B) Single boolean `_enriched` flag on the manifest; (C) External session-memory flag.

**Verdict**: **direct (Option B)** — boolean flag on the manifest.

**Rationale**: Option A fails because individual items may legitimately have no mapping and stay null on every call — repeated calls would waste time re-scanning. Option C couples the enrichment to `CoachingSessionMemory`, adding an extra parameter for no benefit. Option B is one boolean on the struct that already exists in scope.

---

## Decision 3: Should enrichment mutate in place or return a new manifest?

**Options**: (A) Mutate in place; (B) Return a new deep-copied manifest.

**Verdict**: **direct (Option A)** — mutate in place.

**Rationale**: The existing codebase already mutates `profile.improvementManifest.items[i].conversatorEnrichments` in place at `coachingService.ts:1233`. Deep-copying a 10-item manifest for style consistency alone is wasteful. In-place mutation matches established patterns and the single caller is clear about ownership.

---

## Decision 4: What's the primary keying mechanism — technique names or observation keywords?

**Options**: (A) Only `technique` (ROUTE_TO_ISSUE_TYPE); (B) Only observation keyword scan; (C) Hybrid with technique-first and keyword-fallback.

**Verdict**: **refined (Option C)** — hybrid, technique-first with keyword fallback.

**Rationale**: L4 priorities in `buildImprovementManifest()` set `technique: null` (verified at `analysisOrchestrator.ts:1452`) — a technique-only approach misses them entirely. L3.5/L3.75/L3 items DO route through `matchClaimToTechnique()` and carry a named technique that maps cleanly to `IssueType`. The hybrid captures both: precise route-based mapping when available, keyword fallback when not.

---

## Decision 5: Does the `demonstration` field get stored, or just injected into prompts?

**Options**: (A) Store the formatted before/after on `item.demonstration` (direct path); (B) Don't store — inject into prompt as "quality anchor" (rethink path).

**Verdict**: **direct (Option A)** — store on the manifest.

**Rationale**: The rethink path is right that the stored transformation may not match the specific essay perfectly, but `buildImprovementQueueSection()` already renders `current.demonstration` at line 4143 and would get NOTHING for pre-existing items without this storage. Storing is additive — the LLM can still generate student-specific demonstrations AND see the research-backed anchor. The "mismatch risk" is solved by prompt framing, not by abandoning the field.

---

## Decision 6: Should `stakes` be upgraded at build time or at coaching time?

**Options**: (A) Upgrade stakes at manifest build time inside `analysisOrchestrator.ts` (rethink path); (B) Upgrade stakes during enrichment at coaching time (direct path).

**Verdict**: **direct (Option B)** — upgrade at coaching time.

**Rationale**: The rethink path argues stakes are "analysis output, not session context," but that's false for the `collegeNote`-backed case (which is session-context by definition). Having two separate upgrade paths (build-time for stakes, coaching-time for collegeNote) violates single-responsibility more than the direct path's single unified enrichment pass does. One call site, one consistent behavior.

---

## Decision 7: How is the Stanford/stanford case-sensitivity bug in `getCollegeInsight()` handled?

**Options**: (A) Fix the bug upstream in `researchBackedTeachingService.ts`; (B) Normalize case variants at the call site in `researchEnrichment.ts`.

**Verdict**: **refined (Option B)** — normalize at call site.

**Rationale**: The upstream file has `@ts-nocheck` and serves Common App Workshop consumers that may depend on the capitalized keys. Touching it risks destabilizing workshop code. The `normalizeCollegeIdsForLookup()` helper in `researchEnrichment.ts` tries all three variants (lower, capitalized, upper) in sequence — takes <0.01ms and is safely contained.

---

## Decision 8: Do we add a new `improvements/` directory or reuse `analysis/`?

**Options**: (A) New directory `src/services/essayIntelligence/improvements/`; (B) Place new file in existing `analysis/`.

**Verdict**: **refined (Option B)** — nest under `analysis/`.

**Rationale**: `improvements/` doesn't exist yet (verified). Creating a subdirectory for a single 275-line file is premature. `analysis/` already holds `analysisOrchestrator.ts` (which BUILDS the manifest this file enriches), `growthEngine.ts`, `crystallizer.ts`, etc. Co-locating enrichment with manifest construction clarifies the dependency chain.

---

## Decision 9: How is GAP-2 (empty elite examples) handled?

**Options**: (A) Declare it unfixable by engineering and skip it (direct path GAP-2); (B) Wire the existing content via `getCollegeCoachingOverlay()` AND acknowledge the remaining content gap (refined); (C) Try to synthesize elite examples from red flags (rethink path — wrong, the field it relies on doesn't exist).

**Verdict**: **hybrid** — refined from both source paths.

**Rationale**: Both source blueprints asserted all 13 college `eliteExamples` arrays are empty. **This is wrong** — grep verification shows 10 of 13 colleges (Brown, Dartmouth, UChicago, Northwestern, Penn, USC, Caltech, CMU, Cornell, NYU) have populated elite examples with `pattern`, `anonymizedDescription`, and `whatMakesItEffective` bullets. Items 4 and 5 in the plan wire the populated 10 through `getCollegeCoachingOverlay()` AND add TODO markers to the empty 3 (Harvard, MIT, Stanford). Neither source blueprint caught this — this is the most important correction in Scope 3.

---

## Decision 10: Should provenance be a structured field (`researchBacking`) or implicit in stakes text?

**Options**: (A) Structured field with `principle`, `whyItWorks`, `sourceRef`, `citationId` (direct path); (B) Implicit — embed in stakes text, no field (rethink path GAP-7).

**Verdict**: **refined (Option A with rethink's insight)** — structured field AND stakes text.

**Rationale**: The rethink path correctly notes that students experience provenance through text like "MIT admissions officers report..." — the trust signal is in the content, not a badge. But `researchBacking` is also needed for programmatic provenance (debug logs, future UI badges, audit tooling). The two are complementary, not alternatives. The plan does both: populate `stakes` with embedded research text AND populate the structured `researchBacking` field.

---

## Decision 11: How does the enrichment function handle Scope 2 type drift?

**Options**: (A) Hard-coded field access (breaks on rename); (B) Structural property reads with `in` checks and `as { field?: X }` casts (survives rename); (C) Runtime validation via Zod.

**Verdict**: **refined (Option B)** — structural reads, no runtime schema.

**Rationale**: Scope 2 MAY rename `ImprovementEntry` to `ImprovementCandidate` or restructure `technique` to an object. Structural property reads with narrow type casts survive these changes with single-line adapter updates. Zod would be over-engineering for a 275-line internal function with one caller. Hard-coded access is fragile.

---

## Decision 12: Where does the cost of enrichment live?

**Options**: (A) Per-coaching-turn; (B) Once per session; (C) Once per manifest rebuild.

**Verdict**: **direct (Option C≈B for sessions that don't re-analyze)** — once per manifest rebuild, which in practice means once per coaching session.

**Rationale**: The `_enriched` flag lives on the manifest, so when a re-analysis pass rebuilds the manifest the flag resets and enrichment runs fresh. This is correct behavior: if the analysis layer has new findings, the enrichment should re-evaluate them. Within a session without re-analysis, it runs exactly once.

---

## Decision 13: Does the fallback keyword table use single-keyword matches or require multiple hits?

**Options**: (A) Single keyword match wins; (B) Multi-hit scoring (rethink path's teachingContentRouter-style); (C) Ordered most-specific-first with single match.

**Verdict**: **refined (Option C)** — ordered single-match.

**Rationale**: Multi-hit scoring adds complexity for marginal gain on a 23-entry table. Ordered most-specific-first achieves the same precision goal: "summary mode" matches before "summary", "performative vulnerability" matches before "vulnerability". Single-match is simpler to reason about and the first-match-wins rule is easy to debug via reordering.

---

## Decision 14: Rendering — where does `collegeNote` and `researchBacking.principle` get injected into the prompt?

**Options**: (A) In `buildImprovementQueueSection()` alongside `demonstration`; (B) In a new dedicated section; (C) Inside `buildFindingCoachingContext()`.

**Verdict**: **direct (Option A)** — extend the existing queue section.

**Rationale**: `buildImprovementQueueSection()` already renders the current improvement's `demonstration`, `stakes`, and `technique` — `collegeNote` and `principle` are the same class of content (per-improvement teaching context). Adding a new section would duplicate the iteration logic and confuse the coaching LLM about which section is authoritative. `buildFindingCoachingContext()` operates on findings, not manifest items — wrong layer.

---

## Decision 15: Is the `sourceIndexer` exposed as a public API to Essay Intelligence?

**Options**: (A) Expose `getSourceIndexer()` directly; (B) Access only via `researchBackedTeachingService` methods.

**Verdict**: **rethink (Option B)** — go through the service only.

**Rationale**: The `sourceIndexer` is an internal implementation detail of `researchBackedTeachingService` (singleton instantiated privately at line 992). Exposing it would bypass the service's curation layer (issue-type filtering, source-relevance ranking, college filtering). The service methods `getTransformations`, `getWhyThisMatters`, `getCollegeSpecificGuidance` already expose exactly what's needed at the right abstraction.

---

## Summary of Source Attributions

| Item | Source |
|---|---|
| Item 1: Research Database Bridge | **refined** (direct architecture + rethink robustness + 4 diagnostic corrections) |
| Item 2: Coaching Session Hook | **direct** |
| Item 3: Rendering the Enrichment | **direct** |
| Item 4: Elite Example Pattern Injection | **hybrid** (neither blueprint caught the 10/13 populated reality) |
| Item 5: Content Gap Acknowledgement | **refined** (not present in either source blueprint) |
| Item 6: Type Extensions | **refined** (direct's additions + citationId) |

---

## Corrections Made to Both Source Blueprints

Both the direct path and the rethink path contain factual errors that would have propagated into implementation without verification. Scope 3's blueprint corrects them:

1. **Transformation count**: Diagnostic said "20 issue types × 3 transformations = 60". **Actual**: 26 issue-type bundles, 79 before/after pairs (verified via `grep principle_applied:`). Not 60.

2. **`getCollegeInsight` case-sensitivity**: Neither blueprint noticed that the hardcoded map at `researchBackedTeachingService.ts:2063` uses capitalized keys (`Stanford`, `MIT`, `Harvard`) while the rest of the codebase uses lowercase. The plan's `normalizeCollegeIdsForLookup()` helper handles this.

3. **`CollegeRedFlag.teaching.exampleTransformation`**: The rethink path claimed this field exists and proposed to extract before/after pairs from it. **It does not exist**. The actual field is `teaching.exampleFix: string` — a single string, not a pair. The plan doesn't use it.

4. **Elite examples emptiness**: Both blueprints asserted all 13 college `eliteExamples` arrays are empty. **Wrong**: 10 of 13 are populated (Brown: 5, Dartmouth: 4, UChicago, Northwestern, Penn, USC, Caltech, CMU, Cornell: 4, NYU). Only Harvard, MIT, and Stanford are empty. Item 4 surfaces the populated content; Item 5 documents the remaining gap.

5. **College count**: Both blueprints said "14 college files". **Actual**: 13 (`COLLEGE_LOADERS` at `collegeOverlay.ts:22-36` has 13 entries).

6. **File location**: Direct path suggested `src/services/essayIntelligence/improvements/researchEnrichment.ts`. The `improvements/` directory does NOT exist (verified via `ls`). The plan places the file under the existing `analysis/` directory instead.

7. **Line numbers**: Both blueprints cited line numbers that were approximately but not exactly correct. The plan re-verified every line number against the current code: `processCoachingTurn` at 821, `buildImprovementQueueSection` at 4113, `buildImprovementManifest` at 1426, `matchClaimToTechnique` at 1639, `routeFindingToEnrichedTechnique` at 4513.
