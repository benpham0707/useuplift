# Change Log — All Workstreams

> Chronological log of every code change landed from any workstream. Reverse-chronological.
> Format: one entry per commit. Keep it short — detail lives in the PR/commit message.

**Last updated**: 2026-04-25

---

## Format

```
## YYYY-MM-DD — Workstream — Brief title

- Commit: <sha>
- Phase: <phase id>
- Files touched: <list>
- Summary: <1-2 sentences>
- Verification: <result or "pending">
- Notes: <optional>
```

---

## Entries

### 2026-04-26 — 04 Pipeline Architecture (NEW) — Master integration workspace consolidates L1→L6 plans

- Commit: (planning-only)
- Phase: Workspace restructure + master integration plan creation
- Files touched (workspace):
  - **Created** `04-pipeline-architecture/` directory with `L3/`, `L3-75/`, `L3-5/`, `L4/`, `L5/`, `L6/`, `cross-cutting/` subdirectories.
  - **Created** `04-pipeline-architecture/README.md` (entry point + directory map).
  - **Created** `04-pipeline-architecture/MASTER_INTEGRATION_PLAN.md` (horizontal master view: target pipeline shape, per-layer status, sequencing PR1–PR6, dependency graph, cross-layer commitments, open questions).
  - **Created** layer-PLAN scaffolds: `L3/PLAN.md`, `L3-5/PLAN.md`, `L4/PLAN.md`, `L6/PLAN.md`. (L5 already had 8 governing docs; L3.75 already had its retirement plan.)
  - **Moved** `docs/L5_*.md` (8 files: REDESIGN_INDEX, EXPERIENCE_TARGET, ITERATION_LOOP_DESIGN, E2E_INTEGRITY_AUDIT, CONSUMPTION_AUDIT, FEEDBACK_REDESIGN, IMPLEMENTATION_PLAN, BUILD_HANDOFF_PROMPT) → `04-pipeline-architecture/L5/`.
  - **Moved** `docs/CONVERSATOR_ANALYSIS_GROUND_TRUTH_DESIGN.md` → `02-conversator-ground-truth/`.
  - **Moved** `docs/INTELLIGENT_RAG_ARCHITECTURE_DESIGN.md` → `03-intelligent-rag/`.
  - **Moved** `docs/ESSAY_NORTH_STAR_DESIGN.md` → `04-pipeline-architecture/L4/`.
  - **Moved** `docs/RE_ANALYSIS_LIFECYCLE_DESIGN.md` + `docs/PIPELINE_ARCHITECTURE_AUDIT.md` → `04-pipeline-architecture/cross-cutting/`.
  - **Moved** `01-cost-recovery/ARCHITECTURE/{L3_ABSORBS_L3_75,L3_75_REDESIGN__SUPERSEDED,README}.md` → `04-pipeline-architecture/L3-75/`. Deleted now-empty `01-cost-recovery/ARCHITECTURE/` directory.
  - **Updated** `00-index/CURRENT_STATE.md` — added workstream 04 row in top-line table, full Workstream 04 section with layer-plan links + sequencing summary, noted relocation of Architecture track.
- Summary: User asked where the integrated L1→L6 master plan lives. Answer was: nowhere consolidated. Found 14+ scattered docs (8 L5 redesign docs, returned 02 + 03 designs, NorthStar concept, pipeline architecture audit, re-analysis lifecycle) plus the L3.75 retirement plan under cost-recovery/ARCHITECTURE/. Created `04-pipeline-architecture/` as the horizontal master home; consolidated all scattered docs in; wrote `MASTER_INTEGRATION_PLAN.md` (the horizontal view: target pipeline shape, PR1–PR6 sequencing, dependency graph); scaffolded per-layer PLAN.md for L3/L3.5/L4/L6 (L5 and L3.75 already had authoritative plans). Cost-recovery workstream now scoped tightly to its single-PR changeset; multi-PR multi-month architecture work has its own peer workstream.
- Verification: pending — planning only.
- Notes: This restructure was prompted by the cohesion audit (2026-04-26) which identified the L3 redesign as untracked (biggest cohesion gap). Workstream 04 closes that gap by giving L3 a tracked PLAN.md and binding constraints from the L3.75 retirement plan. Per-layer plans link bidirectionally to upstream/downstream and to cross-workstream integrations (02 + 03 designs).

---

### 2026-04-26 — 01 Cost (Changeset track) — Tue resolves D1/D2/D3, supersedes D4 with D5 integration gate

- Commit: (planning-only)
- Phase: Changeset track decision resolution + verification scope correction
- Files touched (workspace):
  - **Updated** `01-cost-recovery/DECISIONS.md` — D1 (poolDensity = keep), D2 (revealedQualities = keep both), D3 (MAX_TOKENS = raise to 12000) all RESOLVED. D4 SUPERSEDED. D5 added and APPROVED — integration gate before verification.
  - **Updated** `01-cost-recovery/PLAN.md` — status `draft` → `awaiting-integration`. Verification plan revised from 3-fixture ($10–12) to 1-fixture (≤$2.00, fixture 05 default). Pre-execution integration gate added with 9 check items. Phase status table moved from `draft` → `approved`.
  - **Created** `00-index/INTEGRATION_MAP.md` — audit of how changeset / Architecture-track / 02 / 03 compose; per-phase verdict on whether each Phase A–E item survives the L3.75 retirement.
  - **Updated** `00-index/CURRENT_STATE.md` — top-line workstream status, decisions resolved, integration map link.
- Summary: Tue clarified single-fixture verification is the project standard (we never read through all 8). Three substantive decisions resolved (all matched recommendations). The 4th decision was reframed: changeset is now finalized but execution held until 02 + 03 designs return AND integration is reconfirmed AND Architecture-track relationship to Phases A–E is re-audited. Integration map's per-phase audit identifies B3 (schema rename) as throw-away pivot-deletes-it work; recommend defer.
- Verification: pending — execution gated on D5.
- Notes: cost target on the single fixture is ≤$2.00. The bridge-vs-permanent split: A2/A3/B1/B2/C1/C2/C3/C4 are bridges (deleted at pivot), A1/D1/D2/E1/E2/E3 are permanent. Combined cost recovery still hits ≤$2.00/essay across changeset + pivot.

---

### 2026-04-25 — 01 Cost (Architecture track) — Tue resolves both open decisions; pivot status `draft` → `planned`

- Commit: (planning-only)
- Phase: Architecture track decision resolution
- Files touched (workspace):
  - **Updated** `01-cost-recovery/ARCHITECTURE/L3_ABSORBS_L3_75.md` — status `draft` → `planned`; both open decisions resolved with Tue's reasoning logged. blindSpots cut from cuts-list, lens-ownership, and Pass-3 sections (it was never in Pass 3; explicit cut added to consumer-migration list).
  - **Updated** `00-index/CURRENT_STATE.md` — Architecture-track status now `planned`; resolved decisions documented.
  - **Updated** `shared/HANDOFFS.md` — H7 status upgraded from `open` to `ack required`; both chats must now design around lens-direct injection (no longer optional). blindSpots cut flagged for migration if either design references it.
  - **Updated** `shared/CONTRACTS.md` — changelog entry for both resolutions.
- Summary: Tue resolved both open architectural decisions. **Decision A (blindSpots ownership)**: CUT entirely — redFlags is the single canonical home for AO-noticed writer gaps; 50% overlap was redundancy, not coverage. **Decision B (pivot approval)**: APPROVED in principle — pivot direction locked; 02/03 must design around lens-direct injection; implementation execution still gated on hard preconditions. Plan moves from `draft` to `planned`.
- Verification: pending — planning only.
- Notes: blindSpots being cut entirely (rather than migrated to L3.5) is a quality-and-simplicity win — no new L3.5 responsibility, no cross-lens synthesis pressure on Pass 3, no lens-prompt scope creep on Meaning. redFlags + required `fix` field becomes the lone canonical "what the writer doesn't see" surface. Cleanest possible resolution.

---

### 2026-04-25 — 01 Cost (Architecture track) — Lock 14 HIGH-confidence decisions; surface 2 open

- Commit: (planning-only)
- Phase: Architecture track decision consolidation
- Files touched (workspace):
  - **Updated** `01-cost-recovery/ARCHITECTURE/L3_ABSORBS_L3_75.md` — replaced 5-item "open decisions" list with 14 LOCKED decisions (HIGH-confidence settled, no Tue input needed) + 2 OPEN decisions (genuine Tue-input-required ambiguity)
  - **Updated** `00-index/CURRENT_STATE.md` — Architecture-track status now names the 2 open decisions explicitly
- Summary: deep-dive audit (2026-04-25) categorized every architectural decision by confidence. The 14 HIGH-confidence items are now LOCKED in the plan as decided (Pass 3 framing, Sweep minimalism, lens-direct findings, follow-up PR sequencing, contradictionFlags in L3.5, strengthSignatures migration, pairedImprovement migration, UnderstandingProse deletion, craftAssessment aggregation, Voice-lens-stays-single, all-cuts-in-pivot-PR, anti-drift discipline, telemetry course-correction protocol, rollback strategy). The 2 OPEN decisions are blindSpots ownership (recommendation: L3.5) and pivot approval-in-principle.
- Verification: pending — planning only.
- Notes: All MEDIUM-confidence items folded into LOCKED (with empirical-calibration notes) since the audit found them structurally correct even if calibration-dependent. Only items with genuine option-space (no clear correct answer) remain open.

---

### 2026-04-24 — 01 Cost (Architecture track) — Workspace consolidation: L3.75 retirement plan

- Commit: (planning-only, no code change)
- Phase: Architecture track creation
- Files touched (workspace, not source):
  - **Created** `docs/pipeline-evolution/01-cost-recovery/ARCHITECTURE/` directory
  - **Moved** `docs/analysis/L3_75_REDESIGN.md` → `docs/pipeline-evolution/01-cost-recovery/ARCHITECTURE/L3_75_REDESIGN__SUPERSEDED.md` (with SUPERSEDED header prepended)
  - **Created** `docs/pipeline-evolution/01-cost-recovery/ARCHITECTURE/L3_ABSORBS_L3_75.md` (authoritative architectural plan)
  - **Created** `docs/pipeline-evolution/01-cost-recovery/ARCHITECTURE/README.md`
  - **Updated** `00-index/CURRENT_STATE.md` — added Architecture track row + section
  - **Updated** `shared/CONTRACTS.md` — added "L3.75 layer existence" retirement contract (v1 → v2)
  - **Updated** `shared/HANDOFFS.md` — added H7 alerting 02 + 03 of pivot
  - **Updated** `01-cost-recovery/PLAN.md` — links to Architecture track
- Summary: yesterday's `L3_75_REDESIGN.md` (drafted in `docs/analysis/`) consolidated into the shared workspace as superseded, replaced by `L3_ABSORBS_L3_75.md` which proposes killing L3.75 entirely. Plan absorbs ~90% of L3.75 work into L3 lens emissions, ~10% into a single bounded "L3 Pass 3" cross-dimension synthesis call. Cross-lens contradiction detection migrates to L3.5; `strengthSignatures` to L3.5; `pairedImprovement` to L4b.
- Verification: pending — architectural plan only; no code change. Hard preconditions before execution: changeset lands, L3 redesign lands, 02 + 03 design docs return, Tue approves.
- Notes: Net cost impact projected at -$0.62–0.85/essay vs current, on top of changeset savings. ~3K lines deletable when pivot ships.

---

---

## Pre-workspace history (for reference only)

These landed before this coordination workspace existed. Not logged in detail; referenced by the regression-diagnosis audit.

- **2026-04-17 to 2026-04-21**: Harvard-10 integration ports (A1, A2, A3, B1, B3, F1, F2, G3, Phase 3C) landed. Associated with $1.47 → $3.60 cost regression — partially attributable to ports, partially to iter_1 convergence regression (0f404e7) and reread-always-fires (34f587b8).
- **2026-04-09 — `34f587b8`**: convergence check moved to AFTER rereads. Intentional for findings capture, but created the "rereads always fire" side effect.
- **2026-03-19 — `0f404e7`**: L3.75 convergence prompt tightened ("WRONG advice" bar) but simultaneously added "complex essays 1–2 iterations max" normalizer. This is the iter_1 rate regression.

These are archaeological notes. Future changes MUST be logged in the Entries section above.
