# L3.5 — Analysis Pass Extension

> Extension of `analysisPass.ts` to absorb responsibilities migrated from L3.75 retirement. NOT a full redesign — L3.5's core scoring architecture stays.
>
> **Status**: `draft`.
> **Owner**: Cost chat through PR3.
> **Last updated**: 2026-04-26.

## What changes

L3.5 already does per-paragraph evaluative analysis (effectiveness, strengths, weaknesses, isStrength, isProblem, priorityForImprovement). Under the integrated iteration, it gains two responsibilities and one upstream-change adaptation.

### New responsibility 1 — `contradictionFlags[]`

Cross-lens contradiction detection migrated from L3.75 Meta call.

**Schema addition to `AnalysisPassOutput`**:
```typescript
contradictionFlags: Array<{
  lens1: 'voice' | 'meaning' | 'story' | 'admissions';
  lens2: 'voice' | 'meaning' | 'story' | 'admissions';
  location: ParagraphLocation;
  claim: string;
  evidence: string;
}>;
```

**Prompt directive**: "emit a flag ONLY when ≥2 lenses make claims at the same location that cannot both be true. Do not flag complementary observations or different perspectives. Examples that qualify: Voice says P5 is intentional, Meaning says P5 is unearned. Examples that do NOT qualify: Voice says P5 is reflective, Story says P5 is structural — those are complementary."

**Telemetry**: track flag emission rate. Calibration target 5–30%. Outside that range = prompt re-tune.

### New responsibility 2 — Essay-level `strengthSignatures[]`

Migrated from L3.75 `craftAssessment.strengthSignatures[]` (where it lived under-disciplined, ballooning to 21 entries on fixture 05).

**Schema addition to `AnalysisPassOutput`** (or to a new `essayLevelAnalysis` field on the profile):
```typescript
essayStrengthSignatures: Array<{
  quality: string;
  evidence: string;     // text from essay
  paragraphs: number[]; // where it surfaces
}>; // cap 5–8, distinct patterns only
```

**Prompt directive**: "emit 5–8 essay-level strength signatures. Each must name a DISTINCT craft technique with NEW evidence not used by a prior signature in this output. If two would cite overlapping text, emit the stronger only."

**Telemetry**: track signature count distribution. Range outside 4–10 = prompt re-tune.

### Upstream-change adaptation — read lens outputs directly

Today L3.5 reads `profile.voiceIdentity`, `profile.thematicArchitecture`, etc. — fields populated by L3.75. Post-pivot those fields are populated by lens emissions; the read paths are identical except:

- `thesisConfidence` removed → drop the read at `analysisPass.ts:942`
- `craftAssessment.sentencePatterns` (numeric) renamed to `sentenceRhythmProse` (now a Voice-lens emission) → update read at `:957`
- `arcMomentum` removed
- `intellectualFingerprint` removed (merged into `writerPortrait`)
- `revealedQualities` removed (merged into `valuesRevealed`)
- `blindSpots` cut → migrate any read to `redFlags`

### RAG integration

Per `03-intelligent-rag/INTELLIGENT_RAG_ARCHITECTURE_DESIGN.md`, L3.5 already filled with `craftMoves` (190) per-paragraph and `antiArchetypes` similarity-gated. Two `should-fill` items pending RAG flag flips:

- Move-excerpt few-shot (53 excerpts) for top-band score calibration.
- Calibration corpus (14 essays) as worked few-shot.

These land when 03 RAG flips per-layer flags post-PR2.

## Discipline directives

L3.5 is JUDGMENT — opposite of L3's descriptive discipline. It owns:
- Effectiveness scores (numeric or banded).
- Strengths and weaknesses (with verdict language).
- Priority assignments.
- Cross-lens contradiction detection.

It does NOT own:
- Description of what voice/theme/narrative IS (L3 lenses).
- Strategic framing or what-to-protect (L4 NorthStar).
- Improvement prioritization across the essay (L4b Manifest).
- Writer-facing translation (L5).

## Verification plan

Single-fixture (fixture 05). Success gates:
- L3.5 output reads identically to today on existing fields.
- New `contradictionFlags[]` emitted, rate within 5–30% bound on fixture mix.
- New `essayStrengthSignatures[]` emitted with 5–8 entries.
- No reads of cut fields (`thesisConfidence`, `arcMomentum`, `intellectualFingerprint`, `revealedQualities`, `blindSpots`).

## Sequencing

PR3 — lands after PR2 (L3 redesign + L3.75 retirement) verifies. L3.5 prompts can be drafted in parallel with PR2 implementation but cannot ship until lens emissions are stable.

## Cross-references

- Master plan: [`../MASTER_INTEGRATION_PLAN.md`](../MASTER_INTEGRATION_PLAN.md)
- Upstream: [`../L3/PLAN.md`](../L3/PLAN.md), [`../L3-75/L3_ABSORBS_L3_75.md`](../L3-75/L3_ABSORBS_L3_75.md)
- Downstream: [`../L4/PLAN.md`](../L4/PLAN.md), [`../L5/L5_REDESIGN_INDEX.md`](../L5/L5_REDESIGN_INDEX.md)
- RAG integration: [`../../03-intelligent-rag/INTELLIGENT_RAG_ARCHITECTURE_DESIGN.md`](../../03-intelligent-rag/INTELLIGENT_RAG_ARCHITECTURE_DESIGN.md)
