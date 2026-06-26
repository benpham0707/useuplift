# KB → Generation Integration — Debates & Resolution

> Supporting/historical: the forge debate record behind INTEGRATION_BLUEPRINT.md (authoritative). Some cost/vocab figures here are superseded by the BLUEPRINT's 2026-06-21 corrections.

Compressed record of the two designs, the code-verification that arbitrated them, and the synthesis.
Authoritative blueprint: `INTEGRATION_BLUEPRINT.md`.

## The two designs

**Direct** — additive band: a separate `getKbCatalog`/`{{KB}}`/`kbById`/`retrieveKbBySignal` with a
compact thin-RECOGNIZE band and rich-GENERATE hydrate (Option-1), `[KB-#]` label class with a
`detectFabricatedReferences` regex extension. Recognition→ranking query. Plethora per-paragraph in L3.5.
Full LLM judge for the eval. Per-item demonstration generation in the manifest.

**Rethink** — compile KB *into* the corpus at build time (one store, one retriever, one hash);
recognition emits a deterministic *filter key* not a ranking query; the brief owns plethora
(whole-essay); eval is deterministic-first with a residual judge; manifest reuses computed fuel.
Keystone bet: synthetic `kb-` ids never reach the model because injection re-maps to ordinal `[MOVE-#]`.

## Verification findings (code reads arbitrated the fork)

| id | finding | effect on plan |
|----|---------|----------------|
| V-1 | `buildCorpusMovesBlock`:445 injects ordinal `[MOVE-${i+1}]` (id never printed); `detectFabricatedReferences`:573 validates index RANGE not id string. | **Rethink's keystone TRUE** → compile needs no `[KB-#]` extension; the band's only real edge (id-isolation) is already free. |
| V-2 | KB `dimensionTags` = 12-rubric `RubricDimensionName` (`reflection_meaning_making`…); native `MoveDimension` = disjoint 8-craft axis. Only `voice`/`specificity` overlap. | **Rethink's `.filter(dimensions.includes())` BREAKS** cross-vocabulary → DIM_MAP made load-bearing + build-asserted on both sides. |
| V-3 | Brief `buildUserPrompt`:159-189 reads full essay text + coherenceResolutions + top-5 L5. | **absent-but-available belongs at the brief**, not per-para → kills Direct's GAP-3 plethora. |
| V-4 | Brief default OFF (:75); 0 `presentation/` refs. | Enable + greenfield renderer is a prerequisite. |
| V-5 | `:265`/`:313` hard-check master flag, bypassing per-layer resolvers :195-212. | STAGE_RESOLVER fix (both designs converge). |
| V-6 | `CraftMove.dimensions` EXISTS (:156) but not printed (:98); `surfaceVsExpert` genuinely absent. | Print dimensions + add `surfaceVsExpert` (Direct's correction right; diagnostic wrong). |
| V-7 | Heterogeneous KB: restraint rich, ai-in-essays thin; `workedExample.usage`="DO NOT SURFACE/MIMIC". | `?? null` degradation, no branch; workedExample dropped from runtime artifacts. |
| V-8 | `demonstration:null` hardcoded ×5; `matchClaimToTechnique`:2874 keyword table; manifest sync, one async caller. | GAP-10 re-route is real. |
| V-9 | `analyzeSingleParagraph`:2473 accepts `corpusContext?`:2482 → injected :1312. | GAP-3 extends, no new call. |
| V-10 | No `kb-` id collision; validator checks counts only (:427). | Compile safe; optional `dependsOn` won't break validator. |

## Synthesis decisions (per gap)

| gap | choice | rationale |
|-----|--------|-----------|
| **9 (the fork)** | **HYBRID** — Rethink's compile-into-corpus + Direct's provenance/`status`/`source` discipline | V-1 proves the band buys no id-isolation the seam doesn't already give; compile is strictly less infra AND enables head-to-head ranking. But provenance (verified KB vs unsourced corpus) is real → keep `status`/`source`/`kbSourceId` off the printed catalog line and enforce trust via a **verified-first stable sort at selection**, not at ranking-prompt time. |
| 1 | absorbed into 9 | the compile IS the connection |
| 5 | absorbed into 9 | 8→18 + surfaceVsExpert in the same build pass; rethink's ~$0.50 re-tag |
| 2 | converged | STAGE_RESOLVER map, identical in both |
| 3 | **rethink scope-cut** + direct field shape | per-para emits present/weak/botched only (V-3); cheaper (+$0.002 not +$0.025) |
| 4 | **rethink filter-primary, hardened** | deterministic filter + residual tiebreaker is cheaper than 234-id rank + guarantees suppression — but DIM_MAP rigor added (V-2) or it silently returns nothing |
| 6 | **rethink brief-owns-plethora** + direct renderer/dependsOn | only whole-essay layer (V-3); greenfield renderer + sequencing slot |
| 7 | converged | constraints at generation; deterministic gate folded into eval (Item 8) |
| 8 | **rethink Stage-split** + direct gold-wiring | deterministic-first carries ~70% signal free, cuts 30-50% judge calls |
| 10 | **rethink reuse-fuel** | removes Direct's +$0.10/essay hot-spot; demonstration from `fuel.transfer` for ~$0 |

## Key insights — how the GAP-9 fork resolved

1. **The band was solving a problem the code already solved.** Its headline justification — keep synthetic
   `kb-` ids away from the student-facing model — is moot: injection re-maps everything to ordinal
   `[MOVE-#]` and the fabrication detector counts an index range, not an id (V-1). With isolation free,
   the band's cost (second store/retriever/hash/regex) buys nothing, and it *forfeits* head-to-head
   cross-domain ranking (a verified KB move can't out-rank a thin corpus move when they're in separate
   ranking calls). Compile wins.
2. **But "one ranked list" must not erase provenance.** The 44 KB entries are VERIFIED/dated/sourced;
   the 190 corpus moves are unsourced as field claims. Direct's instinct was right. The resolution is
   surgical: the ranking *prompt* stays provenance-blind (so craft relevance, not an unauditable "verified"
   label, drives the match — Rethink's win), while a **verified-first stable sort at selection** (Item 4)
   makes a VERIFIED KB move win ties over an unsourced native move. Trust is enforced at ordering, not ranking.
3. **The real fragility was never the store — it was the vocabulary join (V-2).** Rethink's elegant
   `.filter(dimensions.includes(gap.dimension))` silently returns zero candidates because KB tags
   (12-rubric) and native moves (8-craft) are disjoint sets. The fix isn't architectural — it's making
   DIM_MAP a build-asserted normalizer applied to *both* the corpus side (compile) and the diagnostic's
   emit vocabulary (L3.5), so the filter key actually matches. This is the single most likely silent
   failure in the whole plan and the finding that most changed the design.
4. **Plethora's home was decided by sight, not preference.** A per-paragraph call structurally cannot
   judge that the *essay* never uses restraint anywhere (V-3); the brief reads the whole essay. So
   absent-but-available moves to the brief — correctness, not just the 10× cost argument.

## Net

Less infra than the band (one store), guaranteed surface-suppression (filter, not prompt), ~$0.03-0.05/essay
delta, ~$0.50-$2 one-time, ~$1.5/eval-run. Critical path: flag fix → eval → compile → diagnostics → selection,
with measurement before any altitude work is enabled.
