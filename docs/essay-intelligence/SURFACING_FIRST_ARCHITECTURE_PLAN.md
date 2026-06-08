# Surfacing-First Architecture — Plan

> **Created 2026-06-05.** Re-architect the essay-intelligence pipeline so it
> *delivers* quality guidance to users, cheaply — instead of generating deep
> internal diagnosis that is re-derived ~7× and mostly never surfaced.
> Companion to [`L5_INPUT_DEPTH_AND_WIRING_PLAN.md`](./L5_INPUT_DEPTH_AND_WIRING_PLAN.md).

---

## The two findings that force this

1. **There is no wired user surface.** The only mounted essay-intelligence
   endpoint (`/essay-coaching/start`) runs the full pipeline, then returns **one
   conversational coaching turn** — none of the structured document. The composer
   `renderAnalysisForStudent` is a **prototype with zero production callers** (only
   the dump test invokes it). Everything we generate reaches the student only if
   the L6 chat happens to mention it.

2. **Cost is dominated by unsurfaced, repetitive diagnosis.** A comprehensive run
   ≈ **$2.88** (7 paragraphs). Per-layer (from calibration logs):

   | Layer | Cost | Surfaced? |
   |---|---|---|
   | L1 descriptive (per-para Haiku) | $0.06 | internal only |
   | L2 structural + L2.5 scout | $0.07 | internal only |
   | **L3 sequential deep walk** (per-sentence Sonnet, context 8K→19K/para) | **$0.62** | **1 field** (`para.understanding.role`) |
   | **L3.75 holistic synthesis** (A+B+Meta+Curation+SigMove +delta) | **$0.45** | ~4 of ~12 sections |
   | L3.5 analysis pass | $0.08 | growth edges / verdicts |
   | **L4 crystallizer** (NorthStar+scores+coachingMap+adversarial) | **$0.57** | priorities + roles + a few |
   | **L5 deep annotation** | **$0.48** | the wired coaching turn |

   The surface consumes the output of perhaps **$0.8–1.2** of this. The rest —
   the per-sentence walk, voiceMap, emotionalTopography, MEM, narrativeStrategy,
   connections, entanglements, North Star trajectory/intentBridge, score tensions,
   emergent patterns, the adversarial pass, `signatureMove` — is **never surfaced**.
   The same insight (e.g. the misdirection opener) is independently re-derived at
   L1 → L2.5 → L3 → L3.75 → L3.5 → L4 → L5. Plus explicit waste in logs
   ("ConnectionMutator rejected 31/89 connections — LLM making up sentence numbers").

**Conclusion:** we are paying premium prices for an internal model of the essay
that the user never sees, then failing to ship even the parts that are good.

---

## Principle: surfacing-first, emit-don't-transform, cut-the-unsurfaced

1. **Define the user surface first** (the contract below). It is the product.
2. **Work backward to the minimum diagnosis** each surface element needs.
3. **Emit user-facing content directly** from the layer that owns it — eliminate
   the diagnose-then-separately-transform two-step wherever the diagnosis already
   *is* the guidance. (The deep `coachingMap.priorities` field is the model: it is
   already counselor-grade prose, no transform needed.)
4. **Do not compute what nothing surfaces.** Every analytical artifact must trace
   to a surface element or a downstream artifact that does. If it can't, cut it or
   make it lazy (computed only when a feature needs it — e.g. coaching deep-dives).
5. **Keep depth only where it earns surface quality.** The reference-grade
   priorities, writer portrait, and growth-edge coaching are worth their cost.
   The redundant re-reads and the unsurfaced analytics are not.

---

## The user surface (contract — what we actually ship)

A `StudentAnalysisDocument`, served by a real endpoint and rendered by a frontend:

1. **Orient** — committee one-liner + AO gut reaction + hook moment + put-down risk + archetype.
2. **Annotated essay** — per paragraph: anchored ✓ strengths and △ growth edges, each carrying the *how* (the reframe shape: observation → why it matters → concrete move).
3. **Revision priorities** — top 3–5 deep mentor blocks (already reference-grade) + "once you do this".
4. **Structural map** — role / what-it-does / weight per paragraph.
5. **Overall assessment** — phase, writer portrait, central idea, distinctiveness, strengths.
6. **(Phase 2) Inline rewrites/reframes** — the dormant L5 growth/preservation/reframe annotations.
7. **(Later) Portfolio view** — cross-essay positioning.

Everything generated must serve one of these. Nothing else is computed by default.

---

## Backward map: minimum diagnosis per surface element

| Surface element | Needs | Cheapest source |
|---|---|---|
| Orient (AO read, one-liner, archetype) | one holistic read of the raw essay | 1 call |
| Annotated essay (✓/△ anchored, with how) | per-paragraph strengths + growth edges w/ spans | the synthesis/crystallize call emits these per paragraph |
| Revision priorities (deep blocks) | structural roles + per-para strong/weak + the transformative insight | the crystallize call (this is `coachingMap.priorities` today) |
| Structural map | per-para role + weight + one-line function | structural pass (cheap) or folded into synthesis |
| Writer portrait / central idea / distinctiveness | one holistic character+theme read | the synthesis call |

Observation: **every surface element is downstream of (a) a holistic understanding
read and (b) a crystallize-to-guidance step.** The per-sentence walk, voiceMap,
MEM, connections, etc. are *not* on any surface element's critical path.

---

## Proposed lean pipeline

Replace the 7-pass chain with **3–4 calls**, each emitting surface-ready content:

1. **Understand (1 call, Sonnet, whole essay, bounded context).** A paragraph-level
   structural + understanding read — roles, what each paragraph does, the central
   thesis, voice signature, the writer behind it. Replaces L1+L2+L2.5+**L3 walk**
   (the big cut) with a single bounded-context pass. No per-sentence accumulation
   to 19K tokens; no per-sentence emission the surface never reads.
2. **Diagnose + crystallize to guidance (1 call, Sonnet).** Emits the *user-facing
   artifacts directly*: per-paragraph ✓ strengths and △ growth edges (anchored,
   with the how), the 3–5 deep priorities, protected strengths, structural map,
   writer portrait, distinctiveness, central idea, archetype/AO read. This is the
   merge of L3.75 + L3.5 + L4 into one emit-the-surface step.
3. **(Phase 2) Generate rewrites/reframes (1 call, the dormant L5).** Multi-draft
   growth + preservation + reframe annotations for the annotated essay.
4. **Coach (L6, on demand).** Unchanged — the conversational turn.

Deep-dive analytics (voiceMap, MEM, emotional topography, connections, etc.) become
**lazy**: computed only if a specific feature (e.g. a coaching deep-dive, a voice
report) requests them — never on the default analyze path.

**Cost target:** ~$2.88 → **~$0.80–1.20** for the default analyze path, while the
*surfaced* artifacts stay at reference-review quality (verified, not assumed).

---

## Cut / merge / keep

| Disposition | Items | Why |
|---|---|---|
| **CUT from default path** (make lazy/on-demand) | per-sentence L3 walk depth, voiceMap (5 dims), emotionalTopography, momentEarnednessMap, narrativeStrategy detail, connections, entanglements, North Star trajectory/intentBridge/throughLine, score tensions, emergent patterns, adversarial pass | Not on any surface element's critical path; ~$1.6–2.0 of spend |
| **MERGE** | L3.75 + L3.5 + L4 → one "crystallize-to-surface" call; L1+L2+L2.5+L3 → one "understand" call | Removes re-reads of the same essay + prior outputs |
| **KEEP + emit directly** | coachingMap.priorities, protectedStrengths, growth edges (with how), writer portrait, central idea, distinctiveness, structural roles, archetype/AO read, phase | These ARE the surface; already reference-grade for priorities/portrait |
| **KEEP behind a flag (legacy)** | the full deep pipeline | Until E2E proves lean ≥ legacy on surface quality |

---

## Wiring (independent of the lean rebuild — can ship first)

1. Add an endpoint that returns the `StudentAnalysisDocument` (call
   `renderAnalysisForStudent` on the profile and return it, alongside/instead of the
   bare coaching turn in `/essay-coaching/start`).
2. Wire the dormant L5 (`generateEssayLevelRewrites`) into the annotated essay.
3. Frontend renders the document.

This delivers user-facing value on the *current* pipeline immediately; the lean
rebuild then drops cost underneath the same surface.

---

## Migration & validation (no degraded fallbacks, no guessing)

1. Build the lean path behind `SURFACING_FIRST` flag; keep legacy live.
2. E2E on the calibration set (crochet + #02 + 1–2 more): render the student
   document from BOTH paths; diff surfaced artifacts against the reference reviews
   (`tests/calibration/top-tier-reference/reviews/*`). Lean must be **≥ legacy on
   surface quality** at **< cost**.
3. Gate: only cut legacy once the lean path passes the quality bar AND the cost
   target. $5 hard cap per validation run; ask before any run > $5.

---

## Open decisions (need Tue's call)

1. **How aggressive on the L3 walk?** Full cut to paragraph-level understanding
   (max savings, some risk to per-sentence-grounded annotations) vs. a bounded
   per-sentence pass (less savings, safer). Recommend: paragraph-level first,
   measure annotation quality vs. reference, restore granularity only if it drops.
2. **Lazy analytics** — agree voiceMap / MEM / emotional topography / connections
   become on-demand (not default)? Anything in that list you consider must-keep?
3. **Ship order** — wire the current renderer to an endpoint *first* (value now,
   still ~$2.88), or build the lean path first (cheaper, but no surface until done)?
   Recommend: wire first (small, unblocks real output), lean rebuild second.
