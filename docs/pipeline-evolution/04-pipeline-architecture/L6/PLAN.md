# L6 — Coaching Update Against New Profile Shape

> Light update — NOT a redesign. L6's coaching architecture stays; it adapts to the new profile shape after upstream layers land.
>
> **Status**: `draft` — minimal scope.
> **Owner**: Cost chat through PR6.
> **Last updated**: 2026-04-26.

## What changes

L6 reads a wide swath of profile fields (per `coachingService.ts:2807–3000`, `:4016–4018`). Post-integration most reads are unchanged; the migrations and cuts touch ~4 read sites.

| Read site | Change |
|---|---|
| `coachingService.ts:2807` | `archetypeContext.poolDensity` → `archetypeContext.differentiator` (Decision A and pivot) |
| `coachingService.ts:4016` | `characterRevelation.blindSpots` → `admissionsPositioning.redFlags` (blindSpots cut) |
| Wherever it reads `revealedQualities` | → `valuesRevealed` (merged) |
| Wherever it reads `intellectualFingerprint` | → drop or read from `writerPortrait` (merged) |

## What stays the same

- Phase-aware coaching architecture.
- Haiku-classifies-then-Sonnet-responds pattern.
- Coaching vectors per dimension (voice, theme, narrative, character, craft).
- All non-cut field reads.

## What it gains downstream from other PRs

- Reads `pairedImprovement` from L4b ImprovementManifest entries (no change to L6 — already consumed; just from a new emitter).
- May read `contradictionFlags[]` from L3.5 to surface inconsistencies in coaching ("the system noticed Voice and Meaning disagree on P5 — does that match your intent?").
- Reads finalized profile after L5 carry-forward stabilizes (no impact on L6 prompt; L6 reads final profile state).

## Verification plan

Single-fixture (fixture 05). Success gates:
- L6 runs end-to-end without errors on cut field reads.
- Coaching output quality preserved (qualitative review).

## Sequencing

PR6 — last in the integration sequence. Lands after L5 redesign verifies. One small PR; minimal risk.

## Cross-references

- Master plan: [`../MASTER_INTEGRATION_PLAN.md`](../MASTER_INTEGRATION_PLAN.md)
- Upstream: [`../L4/PLAN.md`](../L4/PLAN.md), [`../L5/L5_REDESIGN_INDEX.md`](../L5/L5_REDESIGN_INDEX.md)
- Conversator integration: [`../../02-conversator-ground-truth/CONVERSATOR_ANALYSIS_GROUND_TRUTH_DESIGN.md`](../../02-conversator-ground-truth/CONVERSATOR_ANALYSIS_GROUND_TRUTH_DESIGN.md) (L6 is a primary integration point)
