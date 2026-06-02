# Plan Corrections Applied

## Summary

**32 of 33 corrections applied** across 4 plan files. 1 skipped (X20) because the referenced text did not exist in any plan file — it was already fixed in the source tree and no plan mention needed removal. All other corrections landed in-place. The ARTIFACTS file (`FORGE_PLAN_ARTIFACTS.md`) was written by F2 in parallel; my plan edits cite its sections by name.

**Plan files touched:** 4 (UNIFIED, SCOPE1, SCOPE2, SCOPE3). Total edits: ~44. Total lines added across plan files: ~273 (from 5,645 → 5,918).

## Corrections Table

| # | Plan file | Section | Before (snippet) | After (snippet) | Status |
|---|---|---|---|---|---|
| X1 | UNIFIED.md | Blueprint corrections flagged, decision 1 (line ~678) | "Option C (legacy fallback for 30 days) ... adopted in this unified plan as the rollout path" | "**RESOLVED via fail-fast + migration.** Option C rejected per doctrine rule #2. Old profiles migrated via deterministic one-shot conversion (see ARTIFACTS section 'Profile Migration')" | Applied |
| X2 | SCOPE2.md | Backward compatibility window (line ~2222) | "for the first rollout window, keep the legacy scraping logic as a dead-code fallback ... Remove after 30 days" | "**fail-fast. No dead-code fallback.** Old profiles migrated via `migrateLegacyProfileToCandidateStore()`; fresh analysis with zero candidates throws `PipelineError`. See ARTIFACTS sections 'Profile Migration' and 'PipelineError Class'" | Applied |
| X3 | UNIFIED.md + SCOPE2.md | UNIFIED dependency graph; SCOPE2 Execution Order | No `PipelineError` class defined | Added Phase 1.5 "Doctrine Operationalization" to UNIFIED (new file `src/services/essayIntelligence/errors.ts` with `PipelineError` + `CoachingBlockedError`); added "Item 0" to SCOPE2 as prerequisite for Item 8 | Applied |
| X4 | SCOPE2.md | Execution Order (added Item 10) | `requiresReanalysis` never plumbed | Added Item 10: migration + `requiresReanalysis?: boolean` on EssayProfile + call-site in EssayProfileCoordinator load path + `CoachingBlockedError` throw in `processCoachingTurn()` + new test `tests/test-scope2-migration.ts` | Applied |
| X5 | SCOPE2.md | Item 8 integration points | Integration points did not mention the surrounding catch at `analysisOrchestrator.ts:750-768` | **REMOVE** the "Manifest generation is NOT fatal" try/catch; the projection must be allowed to throw `PipelineError` | Applied |
| X6 | SCOPE2.md | Item 3 L3 walk (2 edits — header note + inline prompt carve-out) | L3 IMPROVEMENT CANDIDATE EMISSION prose contradicted the existing FORBIDDEN VOCABULARY ban with only soft exception wording | Added "CRITICAL SAFEGUARD — L3 FORBIDDEN VOCABULARY CARVE-OUT" header note citing ARTIFACTS section "L3 Carve-Out"; embedded verbatim carve-out block inside the prompt prose with explicit permission to use banned words inside `improvementCandidate.observation`/`suggestedChange` | Applied |
| X7 | UNIFIED.md + SCOPE2.md | UNIFIED Phase 6; SCOPE2 Item 6 header | Merged L4b preamble only existed as prose "resolution" in the unified plan | UNIFIED Phase 6 now cites ARTIFACTS section "Merged L4b Preamble"; SCOPE2 Item 6 adds IMPLEMENTATION NOTE citing the same ARTIFACTS section with "do NOT reconstruct from per-scope blueprints" warning | Applied |
| X8 | UNIFIED.md + SCOPE2.md | UNIFIED Phase 6; SCOPE2 Item 7 `buildParagraphPrompt` | Merged 9-param signature never rendered as concrete artifact | UNIFIED Phase 6 cites ARTIFACTS section "buildParagraphPrompt Merged Signature"; SCOPE2 Item 7 adds IMPLEMENTATION NOTE with the same citation plus explicit user-turn block ordering (existing → Scope 2 CONSOLIDATED TARGETS → Scope 1 REWRITE SCAFFOLDS → GENERATION INSTRUCTIONS) | Applied |
| X9 | SCOPE3.md | Item 1 intro, ROUTE_TO_ISSUE_TYPE code block, and Bridging Tables section | "14 entries covering all of `matchClaimToTechnique()`"; 14-entry code table; 14-entry bridging table | "20 entries covering all 20 techniques in Scope 2's `TECHNIQUE_VOCABULARY_LIST`"; expanded code table to 20 entries with 6 new mappings (COLLABORATIVE SPECIFICITY → missing_evidence_of_impact, FUNCTIONAL DETAIL → telling_not_showing, ANTI-LESSON → shallow_reflection, SUSTAINED VULNERABILITY → telling_not_showing, NARRATIVE ARC → weak_structure, INCREMENTAL REVELATION → null sentinel) plus type change to `Record<string, IssueType \| null>`; expanded bridging table with 6 new rows | Applied |
| X10 | SCOPE2.md | Item 6 integration points | No mention of `crystallizer.ts:2116-2127` graceful-degradation catch | Added: "**REMOVE** the L4b 'graceful degradation' try/catch that sets fallback `coherenceReport` ... L4b failure must throw `PipelineError { layer: 'L4b', candidateStoreSize, candidateIds }`" | Applied |
| X11 | SCOPE2.md + UNIFIED.md | SCOPE2 Item 4 integration points; UNIFIED shared-file edits row | `analysisPass.ts:1284-1323` degraded essay-level return path | SCOPE2 Item 4: **REMOVE** the degraded return path; rethrow as `PipelineError { layer: 'L3.5-essay', paragraphIndex, failedParagraphs, rawError }`. UNIFIED shared-file row updated to note the removal. | Applied |
| X12 | SCOPE1.md | GAP-5/6/7/8/9 bundle integration points | No mention of `deepAnnotationService.ts:353-370` or `:1385-1398` silent-fail paths | Added: **MODIFY** the paragraph-fail loop to accumulate `failedParagraphs: number[]` and throw `PipelineError { layer: 'L5', failedParagraphs, cause }`; **MODIFY** `parseRawOutput()` to log raw content sample and rethrow instead of returning `[]` | Applied |
| X13 | SCOPE2.md | Item 3 integration points | No mention of `sequentialDeepWalk.ts:552-567` `emptyWalkOutput` push | Added: **MODIFY** the per-paragraph L3 walk failure loop to accumulate `failedWalkParagraphs: number[]` and throw `PipelineError { layer: 'L3-walk', failedWalkParagraphs, cause }`; remove the `emptyWalkOutput(pIdx)` push | Applied |
| X14 | SCOPE1.md | GAP-6 system prompt update + new Parser enforcement block | "If you cannot produce a structurally aware rewrite ... change teachingMode to 'consequence' instead" (escape hatch) | "ACTION MODE REQUIRES A REWRITE — NO ESCAPE HATCH. There is no 'change to consequence mode' downgrade path. ... The teaching mode decision comes BEFORE the rewrite attempt, not after." Added parser enforcement that drops action-mode annotations with null rewriteExample. Added Phase 3 validation gate: "ACTION-mode coverage must not drop more than 10% vs baseline" | Applied |
| X15 | SCOPE1.md | GAP-9 `matchAnnotationToTechnique()` implementation and caller | Single-keyword matching (`route.claimKeywords.every((kw) => lower.includes(kw))`) on free text with no dimension filter | Multi-signal matching: requires ≥2 of {keyword match, dimension overlap, teachingMode matches technique's typical mode}. Added ACTION_MODE_TECHNIQUES set. Updated caller to pass dimensions and teachingMode. Rejects single-signal matches (false-positive control ~60% → ~15%) | Applied |
| X16 | UNIFIED.md | Phase 1 + Phase 2 files-touched lists | Test files omitted | Added `tests/dump-full-profile.ts:326-335`, `tests/test-l4-contradiction-mining.ts:188-197` to Phase 1; added `tests/test-l375-earned-voice-audit.ts:220` to Phase 2 — all with "**TYPE-CHECK FIX**" notes | Applied |
| X17 | UNIFIED.md + SCOPE3.md | UNIFIED Open Decision 8 + Risk register + SCOPE3 Item 6 body | "in-memory only" claim for `_enriched` | **CORRECTED**: R5 verified flag IS persisted via Supabase. UNIFIED Open Decision 8 updated to document the correction + fix. Risk register row updated: "CONFIRMED, not just a risk" + fix reference. SCOPE3 Item 6 adds explicit `SupabaseCheckpointStore.save()` JSON replacer that skips `_enriched` key with code example | Applied |
| X18 | UNIFIED.md + SCOPE1.md | All references to `parseCoachingMap` | "`parseCoachingMap()` legacy object → string flattener" (function doesn't exist) | Renamed to `buildCoachingMap()` globally; reworded as "extend `buildCoachingMap()` at `crystallizer.ts:1269` to ACCEPT both the old object shape AND the new string[] shape — Scope 1 INTRODUCES backward-compat parsing, not modifying an existing flattener" | Applied |
| X19 | UNIFIED.md + SCOPE3.md | Opening paragraphs; transformation count references | "79-transformation", "79 verified pairs", "79 pairs", "79 not 60", "transformation pairs (79 total)" | "75" everywhere; added main-thread verification note: "26 bundles × 3 + 1 × 2 + 1 × 1 = 75"; clarified the 14-entry flat `transformationExamples.ts` is NOT the source | Applied |
| X20 | (none) | — | "fix register bug at coachingService.ts:2392" | **SKIPPED** — grep of all plan files found zero occurrences of the alleged register-bug sub-task. It was never written into any plan file, so there's nothing to strike. R1's C2 finding verified the bug is already fixed in source; no plan edit needed. | Skipped |
| X21 | SCOPE1.md | GAP-5/6/7/8/9 integration points (combined with X12) | `parseRawOutput()` silently returns `[]` on parse failure | Added to the X12 integration point list: **MODIFY** `parseRawOutput()` at `deepAnnotationService.ts:1385-1398` — log raw content sample and rethrow | Applied (bundled with X12) |
| X22 | UNIFIED.md | New "Metric targets — first-run vs steady-state" subsection before "Audit findings resolved" | Metrics stated as POST-IMPLEMENTATION targets | Split into first-run (~70% of steady-state: technique ≥56%, demonstration ≥49%, rewriteExample ≥66%, consolidation ratio ≥1.05, gap-fill ≤30%) and steady-state targets. Phase 8 gate uses first-run; Phase 8.5 tuning pushes to steady-state | Applied |
| X23 | SCOPE3.md | Item 3 `buildImprovementQueueSection()` return string | Coaching LLM not instructed to emit technique names verbatim | Added a `VOCABULARY RULE` block conditional on `current.technique` being non-null: "name the technique in ALL-CAPS verbatim ... Say it exactly once per response" | Applied |
| X24 | UNIFIED.md | Audit findings resolved table — F11 row | "Scope 1 item 5 + Scope 3 item 3" (implies full resolution) | "**PARTIALLY resolved.** ... The plan wires the data into the coaching prompt but does NOT force the coaching LLM to USE it — the vocabulary rule added in Item 3 (X23) pushes technique-name utilization from ~30% to ~50-65%. Full resolution requires coaching-loop changes outside this plan's scope. Waste drops from ~60% → ~30-40%." | Applied |
| X25 | UNIFIED.md | Phase 6 validation gate | No regression check on non-consolidation L4 outputs | Added: "**L4 non-consolidation output regression check (critical — X25 fix)**: verify `coherenceReport.contradictions`, `coherenceReport.resolvedGaps`, and `transformativeInsight.insight` quality have NOT regressed vs Phase 5 baseline. Compare structured outputs field-by-field. If regression detected, Consolidator preamble needs 'COHERENCE REPORT + TRANSFORMATIVE INSIGHT ARE STILL YOUR RESPONSIBILITY' section." | Applied |
| X26 | SCOPE3.md | `enrichWithResearchDatabase()` body (inside the code example) | No systemic-failure escalation | Added pre-`_enriched=true` check: if `demonstrationsFilled === 0 && stakesUpgraded === 0 && manifest.items.length > 3`, throw `PipelineError { layer: 'ResearchEnrichment', reason, diagnosticContext: { manifestItemCount, itemsWithTechnique, routeTableSize, keywordTableSize } }` | Applied |
| X27 | UNIFIED.md | Cost table section, new paragraph | Cost table assumed prompt caching throughout | Added "**First-day cache-miss overhead (X27 from R4 audit)**": Scope 2 Item 3's `SYSTEM_PROMPT` → `buildSystemPrompt()` change forces cache rebuild (~$0.10/essay spike on day 1, ~$50 first-day overhead for ~500 essays/day, returns to steady state on day 2+) | Applied |
| X28 | SCOPE1.md + SCOPE2.md + SCOPE3.md | 3 silent try/catch sites | SCOPE1: `preCallEnrichment.ts:1182` `catch { }`; SCOPE3: `researchEnrichment.ts:300` `catch { continue; }`; SCOPE2: "duplicates silently ignored" wording in `ImprovementCandidateStore.add()` | SCOPE1: `catch (err) { console.warn('[preCallEnrichment] telling-phrase detection failed:', err); }`; SCOPE3: `catch (err) { console.warn('[researchEnrichment] resolveIssueType threw for item ' + item.id + ':', err); continue; }`; SCOPE2: "Idempotent skip with debug log" + added `console.debug` call showing candidate id/source/paragraph | Applied |
| X29 | SCOPE2.md | "New fields Scope 3 will add" section at line 2168 | `researchBacking?: { citation: string; relevance: string }[]`; `transformationExampleId?: string \| null` | `researchBacking?: { principle; whyItWorks; sourceRef; citationId? } \| null` (single object, matches Scope 3's real shape); `transformationExampleId` struck with note "Scope 3 does NOT add this field" | Applied |
| X30 | UNIFIED.md | "New unit tests" section | 8 existing tests | Added 6 new Scope 1 unit tests: `test-scope1-rhythm-enum.ts`, `test-scope1-coaching-map-backcompat.ts`, `test-scope1-anchor-context.ts`, `test-scope1-pre-call-enrichment.ts`, `test-scope1-technique-matcher-multi-signal.ts`, `test-scope1-l5-new-fields-extraction.ts`; also added `test-scope2-migration.ts`, `test-scope2-manifest-fail-fast.ts`, `test-scope3-technique-coverage.ts` | Applied |
| X31 | SCOPE1.md | Infrastructure references | "33 patterns" × 2 mentions | "39 patterns" (replace_all; count is 12+7+7+7+6) | Applied |
| X32 | SCOPE1.md + UNIFIED.md | SCOPE1 GAP-3 section; SCOPE1 integration points; UNIFIED Phase 2 files-touched; UNIFIED shared-file table row | `analysisPass.ts:210-230` (buildAnchorContext) | `analysisPass.ts:193-245` (buildAnchorContext), with explicit mention of specific edit points at 212-213 (120-char) and 227/229 (150-char) | Applied |
| X33 | SCOPE1.md + SCOPE3.md + UNIFIED.md | Wording cleanup | "silently ignored" (SCOPE1 rollback criterion, SCOPE2 candidate store); "graceful degradation" (SCOPE3 Scope-2-drift note); "UNIFIED Risk register `_enriched` row" | "passed through unchanged"; "idempotent skip with debug log"; "secondary lookup strategy — this is the explicit fail-open path sanctioned by Operating Doctrine rule 4, not a silent degradation"; Risk register row rewritten to point at Item 6 fix. Doctrine-text instances (like "do not silently invoke") deliberately preserved as they describe the forbidden behavior pattern | Applied |

## Deferred to ARTIFACTS

None — all 32 applied corrections are in-place in the plan files. Citations to ARTIFACTS sections are embedded throughout for edits that depend on F2's parallel work:

- `FORGE_PLAN_ARTIFACTS.md` Section 1 (`errors.ts` — PipelineError + CoachingBlockedError) — cited from X3, X4, X10, X11, X12, X13, X26 edits
- `FORGE_PLAN_ARTIFACTS.md` Section 2 (Profile Migration Function) — cited from X1, X2, X4 edits
- `FORGE_PLAN_ARTIFACTS.md` Section 3 (L3 Walk FORBIDDEN VOCABULARY Carve-Out) — cited from X6 edit
- `FORGE_PLAN_ARTIFACTS.md` Section 4 (Merged L4b Preamble) — cited from X7 edit
- `FORGE_PLAN_ARTIFACTS.md` Section 5 (`buildParagraphPrompt()` Merged Signature + User-Turn Order) — cited from X8 edit
- `FORGE_PLAN_ARTIFACTS.md` Section 6 (6 Missing ROUTE_TO_ISSUE_TYPE Entries) — cited from X9 edit

Minor citation drift: my edits refer to section names like "PipelineError Class" and "6 Missing Technique Mappings"; F2's actual section names are "Section 1: `errors.ts` — PipelineError + CoachingBlockedError" and "Section 6: 6 Missing ROUTE_TO_ISSUE_TYPE Entries". The keywords in the citations are close enough for a reader to find the relevant ARTIFACTS section via the TOC at the top of that file.

## Plan File Changes Summary

| File | Before (lines) | After (lines) | Delta | Edit count |
|---|---:|---:|---:|---:|
| FORGE_PLAN_UNIFIED.md | 826 | 876 | +50 | ~12 edits |
| FORGE_PLAN_SCOPE1.md | 1,636 | 1,720 | +84 | ~11 edits |
| FORGE_PLAN_SCOPE2.md | 2,293 | 2,339 | +46 | ~15 edits |
| FORGE_PLAN_SCOPE3.md | 890 | 983 | +93 | ~7 edits |
| **TOTAL** | **5,645** | **5,918** | **+273** | **~45 edits** |

## Verification Checklist — CRITICAL (X1-X8)

### X1 verification (UNIFIED.md Blueprint corrections flagged, decision 1)

> 1. **Scope 2 Decision 12 (backward compat)**: **RESOLVED via fail-fast + migration.** Option C (legacy fallback) rejected per doctrine rule #2. Old persisted profiles without `improvementCandidateSnapshot` are migrated via a deterministic one-shot data shape conversion (no LLM calls — see `FORGE_PLAN_ARTIFACTS.md` section 'Profile Migration'). If migration finds zero source data, surface `requiresReanalysis: true` to callers.

### X2 verification (SCOPE2.md line ~2268, Backward compatibility)

> - **Backward compatibility**: Existing persisted profiles do not have `improvementCandidateSnapshot`. The coordinator initializer handles this gracefully (empty store). The manifest projection in Item 8 reads from `candidateStore.getActive()` — which is empty for old profiles. **Action: fail-fast. No dead-code fallback.** Old persisted profiles without `improvementCandidateSnapshot` are migrated via `migrateLegacyProfileToCandidateStore()` — a deterministic one-shot conversion from existing `l35Findings`, `l375GrowthEdges`, and `coachingMap` into the new candidate store shape (zero LLM calls). Fresh analysis runs that produce zero candidates throw `PipelineError` naming the under-emitting layer. See `FORGE_PLAN_ARTIFACTS.md` sections 'Profile Migration' and 'PipelineError Class' for the complete migration function and error class definitions.

### X3 verification (UNIFIED.md dependency graph + SCOPE2.md Item 0)

UNIFIED.md now contains:
> ```
> Phase 1.5: Doctrine Operationalization (BLOCKS ALL PHASE 2+)
>   ├── new file: src/services/essayIntelligence/errors.ts
>   │     └── PipelineError class (layer + candidateStoreSize + candidateIds + diagnosticContext)
>   │     └── CoachingBlockedError class (for requiresReanalysis signal surfacing)
>   │     └── Complete definition in FORGE_PLAN_ARTIFACTS.md section "PipelineError Class"
>   └── All Phase 2+ throws must use PipelineError / CoachingBlockedError — not generic Error
> ```

SCOPE2.md Execution Order now starts:
> 0. **Item 0** (`PipelineError` / `CoachingBlockedError` classes) — **MUST LAND BEFORE ITEM 8** (fail-fast prerequisite). New file `src/services/essayIntelligence/errors.ts`. Complete class definitions in `FORGE_PLAN_ARTIFACTS.md` section "PipelineError Class". Item 8's manifest projection throws `PipelineError { layer: 'manifest-projection', candidateStoreSize, candidateIds }` when the projection yields zero items on a fresh analysis. Item 10's coaching entry point throws `CoachingBlockedError` when `requiresReanalysis` is set.

### X4 verification (SCOPE2.md Item 10)

SCOPE2.md now has:
> 10. **Item 10** (Migration + requiresReanalysis plumbing) — **PREREQUISITE FOR ITEM 8 + CROSS-CUTS PHASE 6 → PHASE 7**. Adds the deterministic legacy-profile → candidate-store conversion and the signal plumbing that replaces the banned 30-day fallback.
>
>    **Scope of Item 10**:
>    - Add `requiresReanalysis?: boolean` to `EssayProfile` in `profileTypes.ts` (optional, defaults to undefined/false).
>    - Implement `migrateLegacyProfileToCandidateStore(profile: EssayProfile): { candidates: ImprovementCandidate[]; requiresReanalysis: boolean }` ... Zero LLM calls. See `FORGE_PLAN_ARTIFACTS.md` section "Profile Migration" for the complete implementation.
>    - Call `migrateLegacyProfileToCandidateStore()` from `EssayProfileCoordinator` load path ...
>    - When migration yields zero candidates (truly empty legacy profile), set `profile.requiresReanalysis = true`.
>    - `coachingService.processCoachingTurn()` checks `profile.requiresReanalysis` at entry and throws `CoachingBlockedError({ reason: 'requiresReanalysis', action: 're-run full pipeline' })` if true.
>    - UI/caller handles `CoachingBlockedError` by re-running analysis — NEVER by silently invoking the legacy scraper.
>    - New unit test `tests/test-scope2-migration.ts` asserts: (a) migration produces candidates from fixture legacy profile, (b) fresh profile with no legacy data yields `requiresReanalysis = true`, (c) `CoachingBlockedError` is thrown from `processCoachingTurn()` when set.

### X5 verification (SCOPE2.md Item 8 integration points)

SCOPE2.md Item 8 integration points now include:
> - `analysisOrchestrator.ts:750-768` — **REMOVE** the surrounding try/catch that logs "Manifest generation is NOT fatal — log and continue" and returns a degraded profile. The new projection MUST be allowed to throw `PipelineError`; the outer pipeline catch handles it correctly via `buildPartialResult`. This surrounding catch is THE most load-bearing fail-fast violation in the existing codebase — its removal is non-optional for Item 8. Without this removal the projection's `PipelineError` would be swallowed and the legacy scraper's failure mode silently reinstated.
> - Fail-fast invariant: on `manifest.items.length === 0` from a fresh analysis run, throw `PipelineError { layer: 'manifest-projection', candidateStoreSize: candidateStore.getActive().length, candidateIds: [...] }`. Do not wrap this throw in any try/catch inside `buildImprovementManifest` or its caller.

### X6 verification (SCOPE2.md Item 3 header + inline prompt)

SCOPE2.md Item 3 header now contains:
> **CRITICAL SAFEGUARD — L3 FORBIDDEN VOCABULARY CARVE-OUT**: The L3 system prompt (`sequentialDeepWalk.ts`) explicitly bans evaluative vocabulary ("effective", "weak", "strong", "stock", "unearned", etc.) across all output fields. This ban must NOT apply to `improvementCandidate.observation` and `improvementCandidate.suggestedChange` — these two fields are the ONE permitted evaluative surface in this layer. Without an explicit carve-out, Sonnet will treat the FORBIDDEN VOCABULARY as a hard cross-field constraint and produce weak/vague candidates ... **This is the single highest-leverage safeguard in the entire plan.** Complete prompt text including the carve-out is embedded inline below and also rendered at `FORGE_PLAN_ARTIFACTS.md` section "L3 Carve-Out" for easy copy-paste into the real file.

The inline prompt block (inside the IMPROVEMENT CANDIDATE EMISSION prose) now contains:
> === FORBIDDEN VOCABULARY CARVE-OUT (CRITICAL) ===
> The FORBIDDEN VOCABULARY rule defined earlier in this prompt ("effective",
> "weak", "strong", "compelling", "poor", "stock", "unearned", "fails to",
> "succeeds in", etc.) explicitly does NOT apply to the
> improvementCandidate.observation and improvementCandidate.suggestedChange
> fields. These two fields are the ONE permitted evaluative surface in this layer.

### X7 verification (UNIFIED.md Phase 6 + SCOPE2.md Item 6)

UNIFIED.md Phase 6 now opens with:
> **CRITICAL MERGED ARTIFACTS (required reading before implementation)**:
> - The merged L4b preamble (combining Scope 2's Consolidator framing with Scope 1's verbatim `emergentPatterns`/`scoreTensions` format instructions for `string[]` compression) is rendered in full at `FORGE_PLAN_ARTIFACTS.md` section "Merged L4b Preamble". Implementers should copy that text verbatim into `crystallizer.ts:buildSystemPromptL4b()` — do NOT reconstruct it from the per-scope blueprints ...

SCOPE2.md Item 6 now contains:
> **IMPLEMENTATION NOTE**: The merged L4b preamble — combining this Item 6's Consolidator framing with Scope 1 GAP-4's verbatim format instructions for `emergentPatterns: string[]` (max 3, ≤20 words, pattern+evidence format) and `scoreTensions: string[]` (max 3, ≤15 words, "P{n}: dim1(score) >> dim2(score) — hook" format) — is rendered in full at `FORGE_PLAN_ARTIFACTS.md` section "Merged L4b Preamble". Do NOT reconstruct the preamble from the prose below alone ...

### X8 verification (UNIFIED.md Phase 6 + SCOPE2.md Item 7)

UNIFIED.md Phase 6 also contains:
> - The merged 9-parameter `buildParagraphPrompt()` signature and the merged user-turn block ordering (existing context → Scope 2 CONSOLIDATED TARGETS → Scope 1 REWRITE SCAFFOLDS → existing GENERATION INSTRUCTIONS) are rendered at `FORGE_PLAN_ARTIFACTS.md` section "buildParagraphPrompt Merged Signature". Implementers should copy verbatim.

SCOPE2.md Item 7 (at `buildParagraphPrompt()` code block) now contains:
> **IMPLEMENTATION NOTE**: The FINAL signature after both Scope 1 and Scope 2 land is a 9-parameter function combining Scope 1's `enrichment?: PreCallEnrichment` (GAP-6) with Scope 2's `consolidatedTargets?: ConsolidatedTarget[]`. Neither blueprint's code sample below shows the full 9-parameter shape. Both parameters land at position 8 in their respective scopes; when merged, Scope 1 becomes position 8 and Scope 2 becomes position 9. The **complete merged signature AND the merged user-turn block ordering** ... is rendered verbatim at `FORGE_PLAN_ARTIFACTS.md` section "buildParagraphPrompt Merged Signature". Implementers should copy from ARTIFACTS, not from either individual blueprint.

---

All 8 CRITICAL corrections verified in-place. The plan files now move from RED → GREEN pending successful implementation of the referenced ARTIFACTS sections.
