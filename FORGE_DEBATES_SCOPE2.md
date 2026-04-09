# Forge Debates: Scope 2 — Cross-Layer Improvement Architecture

Forced-choice rationales for each major architectural decision. Each decision was debated between Direct Path (Agent A) and Rethink Path (Agent B); the Reality Checker (this document) picked a resolution grounded in code verification.

---

## Decision 1: Should improvement candidates be a new type distinct from `Finding`?

**Options considered**:
- **Direct**: Introduce `ImprovementCandidate` as a new type parallel to `Finding`
- **Rethink**: Collapse improvements into the existing `Finding` type with a new `source` value; let `ImprovementManifest` become a projection over `FindingStore.getActive()`
- **Hybrid**: Share some infrastructure; keep types distinct

**Chosen**: **direct**

**Rationale**: Findings are DESCRIPTIVE claims about the essay ("P1 opens in summary mode"). Candidates are PRESCRIPTIVE actions the student could take ("replace summary with scene"). Collapsing them loses the distinction that makes candidates useful to L5 — L5 needs prescriptive targets to materialize, not descriptive observations. The rethink path's proposal to overload `Finding.claim` as both observation AND fix prose is what the current code already does implicitly (weakness observations contain fix guidance) and it's exactly what the audit identified as the root cause of the `demonstration: null` disease. Keeping the types distinct forces the prescriptive/descriptive separation into the type system.

---

## Decision 2: Where is improvement candidate emission injected? (Prompt vs. post-hoc inference)

**Options**:
- **Direct**: Each layer's prompt gains a new output field, LLM emits inline
- **Rethink**: L3 prompt stays unchanged (preserves "UNDERSTANDING ONLY" ban); orchestrator infers candidates by joining L3 observations with L3.5 `isProblem` flags after the fact

**Chosen**: **direct**

**Rationale**: The L3 walk system prompt at line 244 ALREADY tells the LLM "each observation should map to a potential IMPROVEMENT — if it doesn't suggest something the student could change, it's not useful." The prompt is already asking for improvement thinking implicitly — the Direct path simply adds a structured slot for what the LLM is already doing. Rethink's post-hoc join by paragraph index + problem flag is strictly less informative than the LLM emitting its own candidate with the fresh context it saw during understanding construction (cross-paragraph connections, back-propagation updates, holistic evolution). The audit's F18 finding is that improvements are generated "far from the evidence that motivated them"; post-hoc inference perpetuates that gap.

---

## Decision 3: How should L3's "UNDERSTANDING ONLY" ban coexist with candidate emission?

**Options**:
- **Direct A**: Lift the ban entirely; allow evaluative language throughout L3 output
- **Direct B**: Scope the ban to `primaryFunction`/`significantChoices`/`tags`; allow evaluative language ONLY in the `improvementCandidate` field
- **Rethink**: Keep ban intact; don't emit candidates from L3 at all

**Chosen**: **refined** (Direct B)

**Rationale**: The ban exists because evaluative contamination pollutes the understanding layer — if L3 starts saying "weak opening," subsequent paragraphs get framed through that judgment and L3.5's scoring gets biased. But the `improvementCandidate` field is SEPARATE from the understanding prose: it sits as its own JSON field, parsed independently, and is clearly marked as "the one prescriptive field in L3" in the prompt. The contamination risk is minimal because the structural separation is explicit. This is cleaner than Direct A (which would infect understanding with evaluative framing) and more valuable than Rethink (which forfeits L3's rich per-sentence context).

---

## Decision 4: Should `ImprovementCandidateStore` be parallel to `FindingStore`, or should it live inside `FindingStore`?

**Options**:
- **Direct**: New file `improvements/improvementCandidateStore.ts`; parallel infrastructure
- **Rethink**: Extend `FindingStore` with candidate tracking; single store, single API

**Chosen**: **direct**

**Rationale**: The lifecycle states are different (`candidate → consolidated → finalized` vs. `hypothesis → developing → confirmed → deepened → superseded`). Both stores share the append-only pattern and supersession, but the state machines don't map cleanly. Shoehorning candidates into `FindingMaturity` would either (a) add confusing new enum values that mean nothing for findings, or (b) require runtime discriminators to distinguish candidate-state from finding-state. Two focused stores with 130 + 472 lines is cleaner than one 600-line store with overloaded semantics. Both stores implement the same serialization pattern, so persistence is uniform.

---

## Decision 5: L4's new role — consolidator vs. promoter vs. router?

**Options**:
- **Direct**: L4 consolidates candidates (merges duplicates, picks techniques, writes architecturalReason)
- **Rethink**: L4 promotes findings (reads `FindingStore.getActiveSortedByCoachingValue()`, assigns architectural rank + findingRef backlinks)
- **Hybrid**: L4 consolidates candidates AND routes findings as secondary

**Chosen**: **direct**

**Rationale**: Rethink's "promoter" role works if improvements ARE findings (Decision 1). Since they aren't, L4 needs to consume candidates, not findings, for the coaching strategy. The `consolidatedFrom: string[]` lineage is essential: without it, cross-layer deduplication is lost and candidates from different layers about the same issue appear as separate priorities. The `architecturalReason` field is L4's unique value add — it's the one piece of information that requires the full profile view, and it cannot be derived from individual candidates alone. Direct's approach captures this correctly.

---

## Decision 6: L4 semantic dedup — LLM-driven or deterministic scope-overlap?

**Options**:
- **Direct**: L4's consolidation prompt handles semantic dedup (LLM merges candidates that target the same root issue)
- **Rethink**: Deterministic scope-overlap check at harvest time (same paragraph + same sentences → supersede)
- **Hybrid**: Scope-overlap as primary; L4 as safety net for semantic dedup

**Chosen**: **hybrid**

**Rationale**: Rethink is right that deterministic dedup is cheaper and gives cleaner lineage. But scope-overlap alone misses cross-dimensional duplicates: L3 might flag "cliched opening" (voice dimension) and L3.75 might flag "abstract language in early paragraphs" (craft dimension) as the same issue in the same paragraph — deterministic check can't tell they're the same problem. The chosen hybrid: let deterministic scope-overlap run at harvest time (candidates in the same scope with same/weaker coachingValue are marked superseded immediately), THEN let L4's LLM consolidation merge the remaining semantic duplicates that survived. Two-stage dedup — cheap first, expensive second. The blueprint implements Direct's approach primarily; the scope-overlap pre-pass is an OPEN DECISION for an early follow-up PR.

---

## Decision 7: L5's new role — expander, materializer, or validator?

**Options**:
- **Direct**: L5 expands (takes candidates, writes student-facing packaging with required rewriteExample)
- **Rethink**: L5 materializes (given a list of finding IDs, write teaching narrative + rewriteExample + stakes for each)
- **Hybrid**: L5 materializes consolidated priorities + opportunistically annotates anything else it sees

**Chosen**: **hybrid**

**Rationale**: Direct's "expander" framing is accurate but less sharp than Rethink's "materializer." The key insight from Rethink is that the 30-50% null `rewriteExample` rate comes from L5 being asked to simultaneously (a) discover what to annotate, (b) teach why, and (c) write rewrites. Separating discovery from materialization fixes the cognitive overload: consolidated targets arrive pre-discovered, so L5 just materializes them. The opportunistic discovery escape hatch (Rethink's contribution) preserves the case where L5 sees something L4 missed — which is valuable because L5 has the full essay text in front of it for the first time in the pipeline. The blueprint's L5 prompt implements this as "MATERIALIZATION MODE" for consolidated targets + preserved discovery mode for additional annotations.

---

## Decision 8: `ImprovementManifest` — inline accumulator or projection over a store?

**Options**:
- **Direct**: Inline accumulator updated after each layer (`coordinator.addImprovementCandidates`, `coordinator.consolidateImprovementCandidates`, etc.)
- **Rethink**: Projection — `buildImprovementManifest()` becomes a pure query over the `FindingStore`/candidate store
- **Hybrid**: Accumulate candidates in the store; manifest is a final projection

**Chosen**: **hybrid**

**Rationale**: Both designers effectively agreed once their terminology is normalized. Direct's "inline accumulator" is the `ImprovementCandidateStore`; Rethink's "projection" is what the new `buildImprovementManifest()` does. The blueprint implements both: candidates accumulate in the store as layers complete (inline), and the manifest function at Phase 7 is a pure projection. This is strictly better than the current 207-line scraper that both designers correctly identified as the worst offender.

---

## Decision 9: Where does L5's rewriteExample get routed to the manifest?

**Options**:
- **Direct**: L5 annotations become new manifest entries with `source: 'l5_annotation'`
- **Rethink**: L5 annotations backfill the `demonstration` field on existing manifest entries via finding-ID linking
- **Hybrid**: Backfill existing entries via `consolidatedTargetIndex` backlink; leave L5 annotations otherwise ephemeral

**Chosen**: **hybrid**

**Rationale**: Direct's approach creates duplication — an L4 priority and an L5 annotation about the same paragraph would become two manifest entries for the same issue. Rethink's approach is correct but requires L5 annotations to track a finding ID. The hybrid uses `consolidatedTargetIndex` (the L4 priority's position in `coachingMap.priorities`) as the backlink, which is more direct than finding ID routing and matches the actual data flow (L4 priority → L5 annotation → manifest demonstration). L5 annotations stay ephemeral (honoring the "never stored in profile" contract) — they're just queried once during manifest build to populate the `demonstration` field.

---

## Decision 10: `matchClaimToTechnique()` keyword regex — delete or keep as fallback?

**Options**:
- **Direct**: Delete entirely; technique selection is now always LLM-emitted
- **Rethink**: Keep as a fallback when candidates have `technique: null`
- **Refined**: Delete; rely on L4 to assign techniques to candidates that had null

**Chosen**: **direct**

**Rationale**: The keyword regex is the single worst LLM-first design violation in Scope 2. It duplicates 14 entries from the 20-entry `TECHNIQUE_ROUTES` in `coachingService.ts`, and will drift out of sync. Every LLM that emits a candidate now sees the TECHNIQUE_VOCABULARY_PROMPT_BLOCK and is asked to pick from the list. If L3/L3.5/L3.75 legitimately can't name a technique (returns null), then L4's consolidation has two chances to assign one: (a) inherit from any other consolidated candidate that did, or (b) the LLM picks one during consolidation. Keeping a regex fallback signals distrust of the LLM's judgment, which is exactly the pattern CLAUDE.md Rule 1 rejects.

---

## Decision 11: `TECHNIQUE_VOCABULARY_LIST` source of truth

**Options**:
- **Option A**: Define independently in `techniqueVocabulary.ts`, assert parity with `TECHNIQUE_ROUTES` via unit test
- **Option B**: Import from `coachingService.TECHNIQUE_ROUTES` directly (reverse dependency from analysis → coaching)

**Chosen**: **Option A (duplicate + test)** — OPEN DECISION flagged for reviewer

**Rationale**: The analysis layer should not depend on the coaching layer at runtime — the current architecture is strictly analysis → coaching. Creating a reverse dependency would entangle the layers. The trade-off is drift risk: if someone adds a new technique to `TECHNIQUE_ROUTES`, the vocabulary list must also be updated. Mitigation is a unit test (`tests/test-scope2-technique-vocab-sync.ts`) that fails fast on drift. Flagged as OPEN DECISION because the reviewer may prefer the reverse-dependency hygiene over the layer boundary.

---

## Decision 12: Backward compatibility for existing persisted profiles

**Options**:
- **Option A**: All new fields optional (`?`), store initializes empty for old profiles, re-analysis populates everything
- **Option B**: Schema migration — re-run pipeline on all existing profiles to populate the candidate store
- **Option C**: Hybrid — optional fields + a legacy fallback in `buildImprovementManifest` that preserves today's scraping logic when the candidate store is empty

**Chosen**: **Option C (refined)**

**Rationale**: Option A is correct for the type system (all new fields are `?`), but old profiles would hit `buildImprovementManifest()` with an empty candidate store and produce a near-empty manifest (only AO red flags). That's a UX regression during the rollout window. Option C keeps the old scraper as a fallback code path for 30 days, flagged as deprecated, removed after all active profiles are re-analyzed. Flagged in Rejected Approaches / Open Decisions.

---

## Decision 13: Cost envelope — is +$0.03/essay acceptable?

**Options**:
- **Option A**: Accept +$0.03/essay for the architectural improvement
- **Option B**: Constrain to +$0.005/essay by making candidate emission opt-in only for sentences with effectiveness < 50
- **Option C**: Trim output token budgets to force concise candidates

**Chosen**: **Option A**

**Rationale**: The blueprint's total cost delta is +$0.0295/essay worst case (~1.2% of current $2.41 pipeline cost). CLAUDE.md explicitly says "quality over cost for AI calls." The audit's F18 finding is THE product gap. Spending 1% more on the expensive call to fix the fundamental "describes when it should prescribe" problem is a net win. Option B would under-sample candidates and miss edge cases where a sentence scores 55 but still has a valuable improvement opportunity — losing LLM-first judgment. Option C would constrain creativity.

---

## Decision 14: Should the orchestrator pass candidates to L3.75 (for L3.75 to consume L3 candidates)?

**Options**:
- **Direct**: No — L3.75 runs in parallel with / before L3.5 and doesn't need L3's candidates (it has its own holistic-level view)
- **Alternative**: Yes — L3.75 could consolidate L3 candidates as a preliminary pass, feeding refined candidates to L3.5 and L4

**Chosen**: **direct**

**Rationale**: L3.75 is holistic synthesis; its candidate emissions are PAIRED with growth edges (structural/architectural patterns). Giving L3.75 access to L3's per-sentence candidates would either (a) duplicate their signal in L3.75's output (creating the same layer-separation problem the audit identified at L4) or (b) require L3.75 to do preliminary consolidation work that duplicates L4's job. Cleaner separation: L3 → per-sentence candidates. L3.75 → pattern candidates. L3.5 → per-sentence candidates grounded in scores. L4 → consolidates ALL of them together with architectural reasoning. Each layer emits at its natural granularity.

---

## Decision 15: What happens to candidates that L4 fails to emit a priority for?

**Options**:
- **Option A**: All unreferenced candidates are marked superseded (dropped from manifest)
- **Option B**: Top-N unreferenced candidates by `coachingValue` become "residual" manifest entries (surfaced in addition to L4 priorities)
- **Option C**: Feed them back through L4 in a second consolidation pass

**Chosen**: **Option B**

**Rationale**: Option A loses valuable signal — L4 might drop a candidate because it's focused on the top 5 architectural priorities, but that candidate could still be a legitimate improvement the student should see. Option C adds a second LLM call, which violates the "no new LLM calls" constraint. Option B (Item 8 Source 3 in the blueprint) surfaces the top 3 active candidates with `coachingValue` of 'critical' or 'high' as residual manifest entries, capped to keep the manifest under 10 items. This is a safety net for legitimate improvements L4 chose not to consolidate, without giving up the 10-item cap that keeps the student focused.

---

## Summary: The Architectural Shift in One Sentence

Improvement candidates are emitted inline by each analysis layer as prescriptive companions to their observations, accumulated through the pipeline in an `ImprovementCandidateStore`, consolidated (not regenerated) by L4 into a coaching strategy with full lineage, materialized by L5 into student-facing rewrites with required `rewriteExample`, and projected at Phase 7 into the `ImprovementManifest` — replacing the current 207-line retroactive scraper with a ~110-line query that finally populates `technique` and `demonstration` fields from LLM judgment instead of regex keywords.
