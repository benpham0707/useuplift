# Unified Execution Handoff — Essay Intelligence Pipeline Optimization

> **PURPOSE.** Self-contained handoff prompt to execute the 8-phase unified optimization plan autonomously, with multi-round review discipline at every step, until the system reaches the $0.85 cold-start / ≤$1.50 lifecycle target with verified $500/hr counselor-grade user-facing output.
>
> **USE.** Paste this entire document into a fresh Claude Code session, OR continue with this directive inline. Either way, the executing agent should treat this as the binding execution contract.
>
> **AUTHORITY.** Tue Pham (project owner). Standing authorization for: spinning up agent swarms (no permission needed), $0 planning/implementation work, code edits within the bundle scopes below, deleting verified-dead code, doc regeneration. NOT authorized: API calls > $0.10 without approval, total testing spend > $5, merging to main, force-pushing.
>
> **STATUS:** `ready-to-execute` pending Tue's confirmation of D1-D6 in §4.

---

## 0. Identity, mission, and quality bar

You are a senior staff engineer + product partner inheriting a fully-audited, multi-session optimization plan. Your job is to execute Phases 0a → 8 of the unified plan with **full quality discipline**: multiple review rounds at every step, multi-agent adversarial verification, no API testing until you have full confidence the implementation is ideal, and a **quality bar of "$500/hr college counselor"** for any user-facing output.

**Mission in one sentence:** drive cold-start cost from $1.69 → $0.85 (~50% recovery) while transforming raw system output into student-grade editorial deliverables that a $500/hr counselor would sign their name to.

**Quality bar specifics:** any user-facing output must:
- Read like a real college counselor wrote it (not a system dump)
- Lead with actionable, prioritized feedback (≤5 priorities, sequenced)
- Cite specific text moments verbatim
- Be appropriate-tier brevity (Tier 1 ≤300 lines, Tier 2 ≤700 lines)
- Use 2nd-person partner voice ("You can write. The taxidermist fake-out grabbed me.")
- NOT clinical/diagnostic language without paired action
- Surface word budget (e.g., "159 unused words; here's where they go")
- Include 1+ worked rewrite for the #1 priority

Reference artifact for quality calibration: the 30-line Crochet Tier-1 sketch in `docs/pipeline-evolution/00-index/UNIFIED_PLAN_HOLD_2026_05_10.md`. If you can't beat it, regenerate.

---

## 1. Verified ground state

```
Repo:            /Users/tuepham/uplift-final-final-18698-62030
Branch:          fix/warm-edit-completedalllayers
HEAD commit:     f181f84  (May 6 21:20 — R1 prompt-side fix shipped)
Main branch:     main
Working tree:    DIRTY — 17 modified, 194 untracked. IGNORE for execution.
                 Only touch files explicitly named in the bundle scopes below.
                 Stash or branch off if you need a clean tree for any phase.
```

All findings, line numbers, file paths, function names cited in this document have been verified at this commit by 4 deepdive audits (prior cut audit + S4 integration-debt + S5 stale-doc + S6 L3.75-retirement integration). Trust them, but re-verify before any destructive action per the no-guessing rule.

---

## 2. Mandatory pre-execution reads (do these BEFORE any code touch)

In this order, end-to-end:

1. **`CLAUDE.md`** (project root) — development standards, including §1a No-Guessing rule.

2. **`/Users/tuepham/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/MEMORY.md`** — project memory index.

3. **`memory/feedback_llm-first-design.md`** — 6 rules for LLM-first design. CRITICAL for prompt work.

4. **`memory/feedback_planning_preferences.md`** — focus on functional capability, not maintenance. Reject error-handling-as-improvement padding.

5. **`memory/feedback_cost_budget.md`** — **$5 hard cap, $1.50 → $0.85 per-essay target, cost only gets cheaper rule.**

6. **`memory/pitfalls_integration_debt.md`** — diagnostic signature: when grep returns "no callers," verify with BOTH static and dynamic import greps before declaring dead. Codebase has integration-debt pattern.

7. **`memory/pitfalls.md`** — type system gotchas + the `cumulative_usd` ledger pitfall (column is global-monotonic, NOT per-run; sum rows by timestamp window).

8. **`docs/pipeline-evolution/00-index/UNIFIED_PLAN_HOLD_2026_05_10.md`** — the unified plan this handoff executes. Full inventory + cost ladder + decision points.

9. **`docs/pipeline-evolution/04-pipeline-architecture/L3-75/FIELD_DISPOSITION_TABLE.md`** — parallel session's field disposition spec (Phases 4-7 dependency).

10. **`docs/pipeline-evolution/04-pipeline-architecture/L3-75/ITERATION_SYNTHESIS_2026_05.md`** — parallel session's synthesis (Phases 4-7 dependency).

After all 10 reads, restate in 5 bullets what you've internalized. If you skip this step or restate incorrectly, STOP and re-read.

---

## 3. Hard rules — non-negotiable

### Cost / spending
- **$0 baseline spend.** Planning, design, implementation, code reading, doc writing, agent dispatch — all $0.
- **$5 hard cap on testing across the entire execution.** If you genuinely need to spend, ask Tue first with the specific $ estimate and the question the spend answers.
- **No API call > $0.10 without explicit approval per call.** This includes any `tests/dump-full-profile.ts` run, any calibration script, any prompt iteration that fires LLMs.
- **Phase 6 verification regen (~$1.70) requires Tue's approval AND must follow the bundle-calibration rule** (per `feedback_cost_budget.md`): bundle ALL pending calibration into ONE run.
- **NEVER raise the $0.85 target.** If math doesn't reach it with available levers, flag the architectural gap to Tue with specifics. Don't silently relax.

### Code discipline
- **Per CLAUDE.md §1a — no guessing.** Every claim cites a file:line, grep result, or commit SHA. "Should work" / "probably" / "I think" are banned in commit messages.
- **Per `feedback_llm-first-design.md`** — LLM owns judgment, system tracks. No deterministic formulas for contextual decisions. No closed taxonomies for LLM perception.
- **Per `feedback_planning_preferences.md`** — functional capability only. Reject scope creep into error-handling padding, type validation refactors, "while I'm here" cleanups.
- **Per `pitfalls_integration_debt.md`** — verify static + dynamic import grep before declaring any module dead. Read its purpose comment to determine integration-debt vs genuine dead code.
- **One logical change per commit.** Each commit message names what it does, why, and which phase + decision it implements.
- **No --no-verify, no --no-gpg-sign, no --amend** unless explicitly authorized.
- **Tag pre-deletion commits** before any large delete (Phase 7 retirement especially).

### Review discipline
- **Every phase has 3 review gates** (see §6): design → implementation → adversarial-verification. None can be skipped.
- **Adversarial reviewer is a SEPARATE agent** from the implementer. Use the Agent tool with subagent_type=general-purpose, give it a contrarian framing.
- **Stop-and-ask whenever confidence < full.** Don't push through ambiguity. Tue's words: "We're only getting rid of things and improving parts we know for sure we don't need."
- **Multiple iteration rounds expected at every step.** Each round must produce concrete delta (no theatrical re-reviews).

### Stop conditions (return to Tue immediately)
- Any phase fails its review gate after 3 iteration rounds.
- Any architectural surprise (e.g., parity gate fails on > 3 fields).
- Any unexpected cost regression in measurement.
- Before any API call > $0.10.
- Before any commit that touches > 200 lines outside Phase 0a deletes.
- Before any merge to main.
- If a verified-dead module turns out to have a non-test caller you missed.

---

## 4. The 6 decisions — Tue's encoded preferences (confirm before Phase 0a)

These are the recommendations from the unified plan synthesis. Confirm or override BEFORE starting Phase 0a. If Tue is silent, proceed with these defaults.

| # | Decision | Default | Rationale |
|---|---|---|---|
| **D1** | Adopt $0.85 as official v2 cost target | YES | $1.50 was prior; with retirement plan visible, $0.85 is achievable + 62%+ margin at $3 charge. |
| **D2** | Drop Cut C (fold understanding_prose) + S3 R1 (Phase A+B fusion) from Bundle 1 | YES | Both reshape L3.75 internals being deleted in Phase 7. Sunk-cost edits. |
| **D3** | Wire findingPromotion as Phase 0a | YES | $0 marginal cost. Highest leverage in entire plan — unlocks evaluation of ALL flag-gated capabilities. |
| **D4** | Re-enable deep-dive chain or keep commented out | DEFER to Phase 8 | Re-evaluate with populated FindingStore (post-D3). |
| **D5** | Activation sequence for 5 unset flags in Phase 8 | Focus Mode → AI Risk → Corpus Retrieval (master) → Voice Profile | Focus Mode is $0 marginal. Tue flagged it as "core of cost efficiency and depth and quality capabilities." |
| **D6** | Promote this handoff's parent (`UNIFIED_PLAN_HOLD_2026_05_10.md`) to replace `CURRENT_STATE.md` | YES (in Phase 0b) | S5 said regenerate; the plan IS the regeneration. |

---

## 5. Special attention — Focus Mode (per Tue's emphasis)

Tue called out Focus Mode as "huge core of our cost efficiency and depth and quality capabilities." Treat it accordingly:

**What Focus Mode is** (verified at HEAD f181f84):
- `ENABLE_FOCUS_MODE` flag, gated at `src/services/essayIntelligence/analysis/deepAnnotationService.ts:795`
- When enabled, `preCallEnrichment` reranks improvement candidates before L5 deep-annotation
- **Cost: $0 marginal** — pure re-ranking, no new LLM call
- **Quality impact: surgical L5 budget targeting** — directs L5's annotation effort at the highest-ranked improvements rather than uniform sweep

**Why it's off in production:**
- Per S4: only `tests/test-port-g2-focus-mode.ts` ever sets it. No production env-set sites.
- Probable cause: calibration-blocked (Port G2 calibration may be incomplete)

**Phase 8 protocol for Focus Mode (FIRST flag activated):**
1. Read `tests/test-port-g2-focus-mode.ts` end-to-end. Understand calibration intent.
2. Read `preCallEnrichment.ts` and `deepAnnotationService.ts:795` flag site.
3. Determine: is calibration genuinely incomplete, or just-not-flipped?
4. If calibration-incomplete: spec the calibration steps, ask Tue for ≤$1.50 of calibration spend.
5. If just-not-flipped: design A/B activation — measure quality + $ on Crochet fixture before vs after.
6. Once flipped: dump regen + show Tue the output for quality review.
7. Do NOT activate other flags until Focus Mode quality is validated.

**Why this matters strategically:** Focus Mode is the only flag that's $0 marginal but high quality impact. It should be the proof point for the activation methodology. If Focus Mode shows we can flip a flag, measure quality, and ship — Tue gains confidence to proceed with the costlier flags (corpus retrieval especially).

---

## 6. Phase execution protocol — apply to EVERY phase

Each phase below has the same shape:

```
Step 1 — Pre-phase confirmation
  Read the phase's scope from the unified plan
  Confirm dependencies from prior phases are satisfied
  Confirm this is the right phase to execute next given current state
  If not, STOP and report to Tue

Step 2 — Design round (no code)
  Spec the changes: files to touch, line numbers, before/after for ambiguous sites
  Spec the verification: how will you know the phase succeeded?
  Estimate $ impact (must be ≤0 per cost-only-down rule unless justified)
  Estimate quality impact
  Show this design to Tue. Wait for approval.

Step 3 — Adversarial review of design (separate agent)
  Spawn agent: "review this design for: bugs, anti-patterns, integration risks,
                LLM-first violations, scope creep, missed dependencies, regressions"
  Iterate the design until adversarial review returns clean
  If iteration count > 3, STOP and report to Tue

Step 4 — Implementation
  Apply changes per the approved design
  ONE logical change per commit
  Commit message: "phase X — <action> — closes <decision> — verified by <gate>"
  After each commit: npx tsc --noEmit (must be clean)

Step 5 — Adversarial review of implementation (separate agent)
  Spawn agent: "review this diff against the approved design for: deviations,
                bugs, edge cases missed, anti-patterns, regressions"
  Fix any issues
  If iteration count > 3, STOP and report to Tue

Step 6 — Verification gate
  Run: npx tsc --noEmit — must be clean
  Run: relevant vitest suite — must be clean
  For Phase 0a deletes: confirm no broken imports
  For wires: trace the call graph end-to-end (static + dynamic)
  Document the gate result in commit message

Step 7 — Status report to Tue
  What changed, $ impact (estimated, not measured — measurement waits for Phase 6)
  Quality impact (qualitative until Phase 6)
  Any deferred items
  Open questions
```

**For Phase 6 specifically (the verification regen)** — additional protocol:
- Show Tue the cost estimate before running. Get approval per call.
- After the run: present the dump output to Tue for quality review.
- Quality review checklist: does this read like $500/hr counselor? Is it actually helpful? What's missing? Compare to prior dump (Tier 1 / 30-line Crochet sketch).
- DO NOT progress to Phase 7 without Tue's quality sign-off.

---

## 7. Phase-by-phase execution scope

### Phase 0a — Code hygiene + integration-debt fixes (1 week, $0 cost change)

**Scope (in dependency order):**

Sub-phase 0a.1 — Verified safe deletions (~7,250 LOC):
- Delete `src/services/essayIntelligence/versioning/` (817 lines)
  - Remove re-exports at `src/services/essayIntelligence/index.ts:269-281`
- Delete `src/services/essayIntelligence/contextBuilder.ts`, `essayUnderstandingService.ts`, `sentenceAnalyzer.ts`, `wordAnalyzer.ts`, `diffEngine.ts`, `deltaContract.ts` (~3,800 lines)
- Delete legacy `src/services/essayIntelligence/corpus/retrieval.ts`, `moveExcerpts.ts`, `moveDependencies.ts`, `corpusLimits.ts`, `deliberateAbsences.ts`, `contextualValidity.ts`, `readerBiasGuards.ts`, `schoolFitVectors.ts`, `embeddingText.ts` (~2,297 lines)
  - PRESERVE `claudeRetrieval.ts`, `corpusTypes.ts`, `voiceArchetypeCompatibility.ts` (still wired)
- Delete `src/services/essayIntelligence/analysis/effectivenessBands.ts`, `rhetoricalDeviceTaxonomy.ts` (~350 lines)
- Delete `src/services/essayIntelligence/archetypes/archetypeTypes.ts` (138 lines, abandoned Round 7c)
- Drop `voiceAlignment` field from `SentenceCraft` in `profileTypes.ts`
- Drop `codeSwitching` field from `VoiceMap` in `profileTypes.ts`
- Update stale comment at `src/services/essayIntelligence/analysis/essayLevelL3Walk.ts:36` (delete the "PROTOTYPE STATUS: not yet wired" line; it IS wired)

Sub-phase 0a.2 — Integration-debt deletions (verified-dead modules):
- Delete `src/services/essayIntelligence/analysis/findingPromotion.ts` (514 lines, zero callers)
  - **WAIT:** before deleting, do sub-phase 0a.3 first (wire it). If 0a.3 fails design review and we decide NOT to wire it, then delete. Default: WIRE, not delete.
- Delete `src/services/essayIntelligence/findings/findingMaturityRefresh.ts` (318 lines, zero callers) — same WAIT rule.

Sub-phase 0a.3 — Integration-debt wires (HIGHEST LEVERAGE):
- **Wire `findingPromotion.ts`** at orchestrator after L3.5 phase completes (around `analysisOrchestrator.ts:1264` area where specificsNeedAggregator currently fires).
  - Read the module's public API: `promoteAnalysisFindings(L35Result, FindingStore): FindingPromotionResult`
  - Identify the exact insertion point in orchestrator (after L3.5 result is available, before downstream consumers)
  - Synchronous, blocking (per Tue's D2 confirmation that quality > 50ms latency)
  - Coordinate with FindingStore semantics
  - Add 1-2 unit tests proving promotion populates store
  - Verify L4 prompts can now cite F-N references (this is Phase 5/8 follow-up; Phase 0a just wires the population)
- **Wire `findingMaturityRefresh.ts`** AFTER findingPromotion is verified working
  - Insertion point: after FindingStore is populated (post-findingPromotion call site)
  - Per `IMPLEMENTATION_STATUS_MATRIX.md:50`, this is Phase 2 D-2.6 only-planned wire
  - 1 unit test

Sub-phase 0a.4 — Production lint promotion:
- Promote `src/services/essayIntelligence/profileManager/dumpLint.ts` to production check at L4→render boundary
- Decide: hard-fail or warn-only? Default WARN-ONLY for first round (so we don't block essays on lint regressions).

**Phase 0a verification gate:**
- `npx tsc --noEmit` clean
- `npx vitest run` — full suite passes (current 663 pass + 5 skip baseline)
- grep verifies all deleted files have zero remaining imports
- findingPromotion + findingMaturityRefresh have at least one production caller AND at least one new unit test
- Total LOC deleted ≥ 7,000 (actual count in commit message)

**Phase 0a stop-conditions:**
- Any deletion would break a non-test consumer
- findingPromotion wire fails design review after 3 iterations
- TS errors after any commit

### Phase 0b — Doc regeneration (1-2 days, $0)

**Scope:**
- Promote `docs/pipeline-evolution/00-index/UNIFIED_PLAN_HOLD_2026_05_10.md` to replace `CURRENT_STATE.md`. Keep HOLD doc as historical reference at `00-index/UNIFIED_PLAN_HOLD_2026_05_10.md`; new `CURRENT_STATE.md` is its current-status descendant.
- Update `docs/pipeline-evolution/04-pipeline-architecture/cross-cutting/IMPLEMENTATION_STATUS_MATRIX.md` with corrected counts (22 functional / 8 partial / 1 only-typed / 5 only-planned per S5).
- Mark `docs/pipeline-evolution/04-pipeline-architecture/L3/PLAN.md` as `superseded` with pointer to Option 5 essay-level walk.
- Mark `docs/pipeline-evolution/01-cost-recovery/PLAN.md` as `dissolved-into-04`.
- Mark `docs/pipeline-evolution/02-conversator-ground-truth/PLAN.md` as `superseded by L5 doc-set`.
- Mark `docs/pipeline-evolution/03-intelligent-rag/PLAN.md` as `superseded by L5 doc-set`.
- Update `docs/pipeline-evolution/04-pipeline-architecture/L5/L5_REDESIGN_INDEX.md` priorAnnotations row (wire is live at `analysisOrchestrator.ts:1299-1300`).

**Phase 0b verification gate:**
- All cross-references in updated docs link to existing files
- All cited line numbers match current code
- Markdown lints clean

### Phase 1 — Bridge cost cuts (1 week)

**Scope (DROP Cut C and S3 R1 per D2):**
- Cut A — drop `reread_P3` sub-call from L3.75 (orchestrator + holisticSynthesis)
- Cut B — drop L4-haiku coherence routing pass (contradictionConsumer)
- Cut D — L1 output cap (firstImpressions prompt + schema trim)
- Cut E — connection scout cap to ≤15 emissions (scoutPass + render filter)
- Cut F — L2 per-sentence machine_label tag trim (structuralCartographer)
- Cut G — L3.5 strength_signatures + growth_edges field-stuffing trim (analysisPass)
  - **Audit-first**: cross-reference against locked decisions #5/#6 in FIELD_DISPOSITION_TABLE — Cut G might delete fields about to be re-added by retirement
- Render-side R1-R9 (~1,300 lines off dump):
  - Suppress §13 Profile Index from markdown (keep in JSON sidecar)
  - Suppress §14 Profile Metadata
  - Render §7.1 Connections: graph_summary + foundational/significant only (≤10)
  - Suppress 0.5-confidence schema stubs in §8 paragraph blocks
  - Collapse §1 cost table behind debug flag
  - etc. (full list in unified plan)
- Phase A1 cost-ledger split (telemetry foundation): split `claude.ts` cost log into `fresh_input`, `cache_read`, `cache_create`, `output` columns

**Phase 1 verification gate:**
- `npx tsc --noEmit` clean
- `npx vitest run tests/unit/dump-lint.test.ts` clean (R1-R4 ratchets)
- `npx vitest run` full suite clean
- No new prompt strings exceed prior char counts (cost-neutrality check)

**No dump regen yet** — bundling per cost-budget rule.

### Phase 2 — Assembler convergence (1 week, $0 cost)

**Scope:**
- Wire `src/services/essayIntelligence/presentation/renderAnalysisForStudent.ts` to production render path (currently exported but no production caller — only stale comment at `analysisOrchestrator.ts:440`)
- Specify the shared assembler/composition contract for Phase 4 merger:
  - Input: typed `EssayProfile`
  - Output: `StudentAnalysisDocument` (already typed in `presentation/types.ts`)
  - Deterministic transformation (no LLM)
  - Must compose with future Sonnet voice-overlay (Phase 8)

**Phase 2 verification gate:**
- `renderAnalysisForStudent` invoked at least once in production code path
- Existing dump output preserved (rendering changes only the path, not the output)
- Type check clean

### Phase 3 — L4 collapse (1 week, parallel with Phase 4)

**Scope (S3 R2):**
- Collapse `crystallizer.ts` 3 Sonnet sub-calls (NorthStar / ScoreMatrix / L4b) into 1 composite call
- Single composite system prompt with 3 reasoning sections
- Composite output schema: `{ northStar: {...}, scoreMatrix: {...}, coachingMap: {...}, coherenceReport: {...} }`
- Preserve calibration chain (NorthStar reasoning → ScoreMatrix calibrated to it → L4b consolidating both) — INSIDE one call rather than ACROSS three
- Adversarial Haiku pass remains separate

**Phase 3 verification gate:**
- New L4 prompt < 80% of combined old prompts (compression target)
- Schema parsing handles all 4 output sections with no jsonrepair fallback in unit tests
- DRY-RUN ONLY at this phase — no API call until Phase 6

### Phase 4 — Composition layer + parity gate (1 week, $0)

**Scope (per FIELD_DISPOSITION_TABLE.md spec):**
- Build `src/services/essayIntelligence/composition/compositionLayer.ts` (16 pure functions, calibration block by EssayType)
- **MERGE with `presentation/renderAnalysisForStudent.ts` infrastructure** — don't build twice. The renderAnalysisForStudent function is already 80% of the composition layer.
- Run snapshot parity gate against persisted Crochet + Three Days JSON dumps:
  - Files: `tests/output/full-profile-14-harvard-2028-crochet.md` (and any Three Days equivalent on disk)
  - Diff composition layer outputs against existing L3.75 outputs
  - Accept "equivalent or richer"
  - Reclassify "worse" fields back to LENS/RESIDUE in disposition table

**Phase 4 verification gate:**
- 16 pure functions implemented per spec
- Each function has ≥3 unit tests
- Parity gate passes for Crochet AND Three Days (or fields reclassified)
- ZERO API spend confirmed

### Phase 5 — Lens + residue prompts (~2 weeks, depends on 02+03 inputs)

**Scope:**
- L3 lens prompts (Voice / Story / Meaning / Admissions) — extends `L3/PLAN.md` (now superseded by Option 5; need fresh design)
- Residue call prompt (4 fields per disposition table)
- L3.5 schema additions (contradictionFlags + essayStrengthSignatures emissions)
- L4b ImprovementManifest extension (pairedImprovement)
- F1 fix: `profileRouter.ts:783, 809` — demote `holisticFull` from `priority: 'always'`

**Phase 5 verification gate:**
- All prompts pass dry-run JSON schema validation against synthetic inputs
- ZERO API spend
- Multiple iteration rounds on each prompt (target: 3+ adversarial reviews per prompt)

### Phase 6 — Single bundled verification regen (~$1.70 spend, 1 day) — REQUIRES TUE'S APPROVAL

**Scope:**
- ONE Crochet dump regen: `npx tsx tests/dump-full-profile.ts --essay 14-harvard-2028-crochet.txt`
- Validates: all Phase 0a + 1 + 2 + 3 + 4 + 5 changes in a single pass
- Expected cost: ~$1.20 (post-Phase 3 estimate)
- Per cost-budget memory: bundle all calibration into ONE run

**MANDATORY before this phase:**
1. Show Tue the cost estimate. Get explicit approval.
2. Confirm Phases 0a-5 all passed verification gates.
3. Confirm `tsc --noEmit` clean + full vitest suite clean.

**MANDATORY after this phase:**
1. Present dump output to Tue for **quality review**.
2. Tue's review checklist:
   - Does this read like a $500/hr counselor wrote it?
   - Is the Tier 1 deliverable actually helpful and useful?
   - What's missing vs the prior dump?
   - Quality regressions vs improvements?
   - Compare to the 30-line Crochet Tier-1 sketch in UNIFIED_PLAN_HOLD
3. DO NOT progress to Phase 7 without Tue's explicit quality sign-off.

**Phase 6 verification gate:**
- Cost actual ≤ $1.50 (under target with margin)
- All R1-R4 dump lints pass
- Snapshot parity gate (Phase 4) results validated against actual run
- Tue quality sign-off received

### Phase 7 — L3.75 retirement PR (1 week, MEDIUM-HIGH risk)

**Scope:**
- Wire `compositionLayer` into runtime
- Wire lens emissions
- Wire residue call
- Wire L3.5 + L4b extensions
- **Delete `src/services/essayIntelligence/analysis/holisticSynthesis.ts` (3,573 lines — verified, NOT 2,500 as docs claim)**
- Delete `runningUnderstandingManager.ts` (Phase E2 deletion target, ~474 lines)
- Migrate ~6 consumer reads per `L3_ABSORBS_L3_75.md` "Schema fields to delete" section
- Tag pre-deletion commit for rollback: `git tag pre-l375-retirement`

**Phase 7 verification gate:**
- `npx tsc --noEmit` clean after every commit
- `npx vitest run` full suite clean
- Snapshot parity gate (Phase 4) re-validates after retirement
- Cold-start cost ≤ $0.95 (target $0.85, allow $0.10 margin)
- Tue quality sign-off on Tier 1 deliverable post-retirement

### Phase 8 — Activation phase (per-flag micro-cycles)

**Scope (in D5 sequence):**

8.1 — Focus Mode activation (FIRST — Tue's priority):
  - Read `tests/test-port-g2-focus-mode.ts` to understand calibration intent
  - Read `preCallEnrichment.ts` + `deepAnnotationService.ts:795`
  - Determine calibration status (incomplete vs just-not-flipped)
  - If calibration-incomplete: spec calibration steps, ask Tue for ≤$1.50 calibration spend
  - If just-not-flipped: A/B activation plan
  - Flip flag (production env or default code change)
  - Dump regen (≤$0.50 budget, asks for approval)
  - Tue quality review
  - Sign-off before progressing

8.2 — AI Risk Signal activation:
  - Per orchestrator `:3157`: "elevated false-positive" — calibration-blocked
  - Read calibration history; design calibration improvements
  - Ask Tue for calibration budget if needed (≤$1.00)

8.3 — Corpus Retrieval (master + per-layer):
  - LARGEST dormant capability — connects pipeline to research corpus
  - Per S4: 8 of 11 corpus types still unwired
  - Phased per-layer activation (L3 first → L3.75 → L4 → L5 → L6)
  - Each layer flip: dump regen + Tue quality review

8.4 — Voice Profile Import:
  - Cross-essay voice continuity for same student
  - Requires student session data; coordinate with Conversator (Phase 3)

8.5 — Deep-dive chain re-enable decision:
  - Now that FindingStore is populated (since Phase 0a), re-evaluate the cost-cut rationale
  - If quality justifies +$0.05-$0.15: uncomment `analysisOrchestrator.ts:1906-1912`
  - If not: keep commented out

**Phase 8 verification gate per activation:**
- Cost delta measured (actual, not estimated)
- Quality delta reviewed by Tue
- No regression in cumulative ≤$1.50 lifecycle target
- Sign-off before next activation

---

## 8. Multi-agent swarm protocols

You have standing authorization to spin up agent swarms (up to 8 teammates) for any phase. Use them when:

- **Cross-layer code review**: spawn 4 agents reading L1, L2/L2.5, L3, L4 in parallel for any change touching prompt schemas
- **Adversarial design review**: spawn 1 agent with contrarian framing ("find what's wrong with this design")
- **Independent verification**: spawn 1 agent to re-verify an integration-debt finding before deletion
- **Prompt iteration**: spawn 3 agents to draft Round 1, Round 2, Round 3 of a prompt; pick best per L3.75 round-1.6 calibration discipline (see `docs/pipeline-evolution/04-pipeline-architecture/L5/prompts/D-2.2/ROUND_1_6_DRAFT.md` for the pattern)

Per `feedback_planning_preferences.md` — use `/forge-plan` for adversarial multi-agent planning on any non-trivial design.

**Swarm rules:**
- Each agent gets a tight scope and a $0 spend rule
- Each agent's deliverable is a markdown report
- Cross-reference findings before acting (if agents disagree, investigate WHY)
- Don't let agents make production changes — they propose, you implement after review

---

## 9. Status reporting cadence

After each completed sub-phase:
- One-paragraph status summary to Tue
- $ impact (estimated until Phase 6, measured after)
- Quality impact (qualitative)
- Lines changed (if applicable)
- Open questions
- Next sub-phase preview

Per `feedback_planning_preferences.md` discipline — keep reports tight. No theatrical narration.

---

## 10. Final deliverables

When all 8 phases complete with Tue's sign-offs:
1. Cold-start cost ≤ $0.85 verified by ledger
2. Lifecycle cost (1 cold-start + 3 focused) ≤ $1.20 verified
3. Tier 1 user-facing deliverable matches $500/hr counselor quality bar (Tue's call)
4. Codebase ~10,000 lines lighter (deletes + retirements)
5. All planning docs current to actual code state
6. All flag-gated capabilities evaluated (kept on or kept off with reason)
7. PR (or branch) ready to merge to `main`
8. CHANGELOG / commit history tells the story

---

## 11. Begin checklist

Before starting Phase 0a:

- [ ] Read all 10 mandatory pre-execution docs (§2)
- [ ] Confirm D1-D6 with Tue or proceed with defaults (§4)
- [ ] Verify HEAD is f181f84 — if not, sync and re-baseline
- [ ] Verify `npx tsc --noEmit` clean on current state
- [ ] Verify `npx vitest run` shows 663 pass + 5 skip baseline
- [ ] Acknowledge the Focus Mode special attention (§5)
- [ ] Acknowledge the $5 / $0.10 cost discipline (§3)
- [ ] Acknowledge the 3-gate review protocol (§6)
- [ ] State your understanding back to Tue in 5 bullets
- [ ] WAIT for Tue's go-ahead

After all checked, begin Phase 0a sub-phase 0a.1.

---

> **End of execution handoff. This document is binding for the duration of execution. Update only if Tue overrides a default or amends a phase.**
