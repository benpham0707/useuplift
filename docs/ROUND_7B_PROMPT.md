# Round 7b — Analytical Layer Deepening

> Use this prompt at the start of a new Claude Code session to launch Round 7b. Matches the structure of the Round 7a spec (Historical Intelligence Foundation). Self-contained — agents don't need prior session context beyond what's in this file.

---

The Uplift Essay Intelligence pipeline lives on branch `feat/forge-plan-pipeline-refactor` with Round 7a (Historical Intelligence Foundation) landed. Round 7a delivered: versioned profile snapshot infrastructure, revision intelligence (addressed/persistent/regression/pattern/velocity detection), voice evolution tracking (marker diff, register trend, vividness, over-revision detection with intentional-shift precedence), and coaching prompt integration — all with zero new LLM calls.

Round 7b is the second of three rounds in Round 7 — Additive Capabilities. The full plan:
- 7a (landed): Historical Intelligence Foundation
- 7b (this round): Analytical Layer Deepening — Per-Claim Earnedness + Rhetorical Device Recognition
- 7c (parallel with 7b): Strategic Intelligence — Archetype Distance + AO Simulation Enhancement

Round 7 capabilities are additive, not gated. 7b is independent of 7a; it has no history dependency. Both 7b capabilities surface when there's real signal in the current essay and stay silent otherwise.

## What Round 7b Delivers

Two new analytical capabilities that deepen the profile's understanding and analysis layers:

1. **Per-Claim Earnedness** — Every meaningful CLAIM the essay makes (meaning assertions, self-characterizations, character claims about others, transformation claims, importance claims) is evaluated against the evidence the essay has actually shown. Each claim is tagged earned / partially_earned / unearned with reasoning grounded in specific text. The coach can then ask precisely which claims need support, rather than vaguely "add more detail."

2. **Rhetorical Device Recognition** — Craft-level devices (metaphor, anaphora, juxtaposition, callback, volta, understatement, fragmented rhythm, polysyndeton, etc.) are detected per instance with location, quote, effect, and deliberateness signal. L3.75 holistic synthesis produces an inventory: dominant devices, diversity score, voice-signature devices, underused possibilities. The coach can credit deliberate moves and name underused possibilities.

Both capabilities extend EXISTING LLM calls (L3, L3.5, L3.75) with richer structured output. Zero new LLM calls.

## The Core Principle

**Specificity over coverage.** Both capabilities are USELESS if they emit generic observations. The value comes from claim-level precision ("P3's 'I learned resilience' is unearned — the paragraph describes the event but doesn't show the internal reckoning") and device-level specificity ("the anaphora at P2 sentences 3–5 creates accelerating rhythm that you then undercut with the fragment at sentence 6"). The prompts must FORCE concrete grounding. When a claim is ambiguous or a device is trivial, the system must stay silent — better to miss a signal than emit noise.

## Architecture Principles (non-negotiable)

1. **No new LLM calls.** Both capabilities extend existing prompts (L3 walk, L3.5 analysis, L3.75 synthesis) with additional structured output fields. No extra API round-trips.
2. **Additive schema.** New profile fields (`claimEarnednessMap`, `rhetoricalInventory`) sit alongside existing fields. Existing consumers see no change.
3. **Evidence grounding mandatory.** Every claim earnedness judgment cites specific sentences. Every rhetorical device instance cites exact text. No abstract judgments.
4. **Universal coach preserved.** New prompt section consumes these signals when genuinely relevant to the turn. Never force-surface.
5. **Graceful null path.** If L3/L3.5/L3.75 fail to emit the new fields (parse error, old profile, etc.), the system handles absence cleanly and the coach section stays silent.
6. **Closed taxonomy with escape hatch.** The device taxonomy ships as a curated closed list; the LLM may add devices NOT in the list via an `other` bucket with free-text `deviceName` when the closed list doesn't fit.

## The Dependency Graph

```
Per-Claim Earnedness          Rhetorical Device Recognition
        │                              │
   ┌────┴────┐                     ┌───┴─────┐
   L3 walk   L3.5 analysis         L3.5      L3.75 synthesis
   (flag     (evaluate             (detect   (inventory +
   claim     earnedness            per-      patterns)
   candi-    per claim)            instance)
   dates)
        │                              │
        └──────────────┬───────────────┘
                       │
                  Coach prompt integration
                  (analyticalDeepeningSection)
                       │
                       └──► Verification
```

Phase 1 (Per-Claim Earnedness) and Phase 2 (Rhetorical Device Recognition) are independent — can be built in parallel. Phase 3 (coach integration) waits for both. Phase 4 (verification) waits for integration.

## The Four Phases

### Phase 1 — Per-Claim Earnedness

Split across L3 walk (candidate emission) and L3.5 analysis (evaluation). The L3 walk identifies CANDIDATES without judgment. The L3.5 pass evaluates each candidate's earnedness against the full walk understanding.

**Files:**
- Update: `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` — extend L3 walk output schema with `claimCandidates` per paragraph; prompt edit to identify them without judging
- Update: `src/services/essayIntelligence/analysis/analysisPass.ts` — extend L3.5 analysis output schema with `claimEarnedness` evaluations; prompt edit to evaluate candidates
- Update: `src/services/essayIntelligence/profileTypes.ts` — add `ClaimCandidate`, `ClaimEarnednessAssessment`, `ClaimEarnednessMap` types; add `claimEarnednessMap?: ClaimEarnednessMap | null` to `EssayProfile`
- NEW: `tests/unit/claim-earnedness.test.ts`

**Schema:**

```ts
export interface ClaimCandidate {
  id: string;                             // unique across essay, e.g., "C1", "C2"
  paragraph: number;
  sentenceIndex: number;
  text: string;                           // the exact claim sentence or phrase
  claimType:
    | 'meaning'
    | 'self_characterization'
    | 'other_characterization'
    | 'transformation'
    | 'importance'
    | 'causal'
    | 'other';
  surfaceReasoning: string;               // why L3 flagged this as a claim worth evaluating
}

export interface ClaimEarnednessAssessment {
  claimId: string;                        // matches ClaimCandidate.id
  claimText: string;                      // echo for audit trail
  earnedness: 'earned' | 'partially_earned' | 'unearned';
  supportingEvidence: Array<{
    paragraph: number;
    sentenceIndex: number;
    text: string;                         // evidence sentence
    strength: 'strong' | 'moderate' | 'weak';
  }>;
  missingEvidence: string;                // prose describing what scene/detail would make the claim earned (empty when 'earned')
  reasoning: string;                      // LLM reasoning for the judgment
  overlapWithOtherSignals: string[];      // finding IDs this overlaps with (e.g., findings already flagged as tell-mode)
}

export interface ClaimEarnednessMap {
  assessments: ClaimEarnednessAssessment[];
  summary: {
    earnedCount: number;
    partiallyEarnedCount: number;
    unearnedCount: number;
    earnednessRate: number;               // earnedCount / total
    mostUnderearnedParagraphs: number[];  // paragraphs with >50% unearned claims, sorted desc by unearned ratio
  };
}
```

**L3 walk prompt extension:**

Add a new section to the walk prompt directing the model to emit `claimCandidates` per paragraph. The instruction:

> When you reach sentences that MAKE A CLAIM (assert meaning, characterize self/others, declare transformation, assign importance), flag them as claim candidates. You are NOT judging whether the claim is earned — you are identifying what downstream analysis should evaluate. Surface the EXACT sentence, your paragraph and sentence indices, and one short sentence on WHY this is a claim (e.g., "asserts self-transformation without adjacent scene").
>
> Do NOT flag:
> - Descriptive sentences that merely report action or scene
> - Dialogue unless it's the narrator's own meaning-making
> - Transitions, questions, or structural connectives
>
> Threshold: only flag claims that a careful reader would want the essay to EARN. Skip trivial assertions.

**L3.5 prompt extension:**

Receives `claimCandidates[]` from L3 walk output. For each, evaluates earnedness:

> For each claim candidate you received from the walk, evaluate whether the essay has EARNED the claim. A claim is EARNED when the essay shows a scene or concrete detail that would lead a reader to agree with the claim WITHOUT being told. A claim is PARTIALLY_EARNED when evidence exists but is thin, compressed, or told rather than shown. A claim is UNEARNED when the essay asserts the claim without showing supporting scene.
>
> For each claim:
> - State the earnedness
> - Cite specific supporting evidence from the essay (paragraph + sentence index + exact text) and rate its strength
> - For partial/unearned: describe in prose what SPECIFIC scene or detail would make the claim earned (not "add more detail" — name the moment: "you need the sentence where your grandmother's hands trembled")
> - Note overlap with existing findings (e.g., this claim is also flagged as tell-mode at sentence-level)

**Quality controls for L3.5:**
- Evidence must be cited by (paragraph, sentence). Free-form evidence without citation → reject and re-prompt.
- "Missing evidence" for unearned must be specific ("the sentence where X happens" not "more emotional depth").
- If a claim candidate overlaps with an existing tell-mode finding, note it in `overlapWithOtherSignals` — don't double-count in the coach summary.

**Tests:**
- Fixture: an essay with 3 claims (1 clearly earned, 1 partially, 1 unearned)
- Assert all 3 surface in `claimEarnednessMap.assessments`
- Assert `earnednessRate === 1/3`
- Assert the unearned claim has non-empty `missingEvidence`
- Assert the earned claim has `supportingEvidence.length >= 1` with at least one `strong` strength
- Assert `mostUnderearnedParagraphs` is computed correctly
- Null-path: if L3 returns no `claimCandidates`, L3.5 returns empty assessments; `claimEarnednessMap` is `null` not bogus-empty

### Phase 2 — Rhetorical Device Recognition

Split across L3.5 analysis (per-instance detection) and L3.75 holistic synthesis (inventory + patterns).

**Files:**
- Update: `src/services/essayIntelligence/analysis/analysisPass.ts` — extend L3.5 output schema with `rhetoricalDeviceInstances`; prompt edit
- Update: `src/services/essayIntelligence/analysis/holisticSynthesis.ts` — extend L3.75 output schema with `rhetoricalInventory`; prompt edit to synthesize patterns
- Update: `src/services/essayIntelligence/profileTypes.ts` — add `RhetoricalDeviceInstance`, `RhetoricalInventory`, `RhetoricalDeviceType` enum; add `rhetoricalInventory?: RhetoricalInventory | null` to `EssayProfile`
- NEW: `src/services/essayIntelligence/analysis/rhetoricalDeviceTaxonomy.ts` — the curated taxonomy + helpers
- NEW: `tests/unit/rhetorical-devices.test.ts`

**Schema:**

```ts
export type RhetoricalDeviceType =
  // Structural
  | 'callback' | 'circular_frame' | 'juxtaposition' | 'parallel_structure'
  | 'fragmented_rhythm' | 'in_medias_res' | 'flashback' | 'delayed_reveal'
  // Sentence-level
  | 'anaphora' | 'epistrophe' | 'zeugma' | 'asyndeton' | 'polysyndeton' | 'chiasmus'
  // Tropic
  | 'metaphor' | 'extended_metaphor' | 'simile' | 'hyperbole' | 'litotes'
  | 'metonymy' | 'personification' | 'synecdoche'
  // Tonal
  | 'irony' | 'understatement' | 'self_effacement' | 'volta'
  // Escape hatch
  | 'other';

export interface RhetoricalDeviceInstance {
  id: string;                             // e.g., "RD1"
  deviceType: RhetoricalDeviceType;
  deviceName?: string;                    // free-text when deviceType === 'other' OR when refining a type
  location: {
    paragraph: number;
    sentences: number[];                  // one or more sentence indices
  };
  quote: string;                          // exact text demonstrating the device
  effect: string;                         // 1-2 sentences on what this accomplishes in THIS essay (not abstract definition)
  deliberateness: 'deliberate' | 'emerging' | 'accidental';
  voiceSignatureFit: 'signature' | 'consistent' | 'borrowed' | 'unclear';
  overlapWithVoiceMarker: boolean;        // true if this device is also tagged as a voiceIdentity voiceMarker
}

export interface RhetoricalInventory {
  instances: RhetoricalDeviceInstance[];
  dominantDevices: Array<{
    deviceType: RhetoricalDeviceType;
    count: number;
    deliberateUsageRatio: number;         // deliberate / total for this type
  }>;
  diversityScore: number;                 // 0-1, shannon entropy over device types, normalized
  voiceSignatureDevices: RhetoricalDeviceType[];  // devices the essay uses distinctively AS its voice
  underusedPossibilities: Array<{
    deviceType: RhetoricalDeviceType;
    reasoning: string;                    // why this device would serve THIS essay (not generic advice)
  }>;
  overReliance: Array<{
    deviceType: RhetoricalDeviceType;
    count: number;
    reasoning: string;                    // when the frequency becomes a tic rather than a signature
  }>;
  craftMaturityNarrative: string;         // 3-5 sentence prose synthesis of the student's craft maturity
}
```

**L3.5 prompt extension:**

> As you analyze each paragraph, detect rhetorical devices in play. Use the curated taxonomy (provided). For each detected instance:
> - Name the device type (use `other` only when the taxonomy genuinely doesn't fit; add `deviceName` for clarity)
> - Cite the exact quote
> - Describe the effect IN THIS ESSAY — not "anaphora creates rhythm" but "the anaphora at P2 creates accelerating urgency that you then undercut with the fragment at sentence 6"
> - Judge deliberateness: `deliberate` when the student clearly knows they're doing it (usage is polished, voice-consistent); `emerging` when the student is reaching for it but not yet wielding it precisely; `accidental` when the device happened without intent
> - Judge voice-signature fit: `signature` when this device feels like THIS student's voice; `consistent` when it fits but isn't distinctive; `borrowed` when the device reads as imitation of another style; `unclear` when judgment is premature
> - Mark `overlapWithVoiceMarker: true` if the device is also captured as a `voiceMarker` in voiceIdentity — this is context, not a correction
>
> Threshold: skip trivial instances. Every metaphor is not worth logging. Log devices that DO something in the essay — create effect, reveal voice, or fail to land.

**L3.75 prompt extension:**

Receives L3.5's `rhetoricalDeviceInstances[]`. Synthesizes the inventory:

> Given the detected device instances across the essay, synthesize the rhetorical inventory:
> - `dominantDevices`: the 3-5 most-used types by count, plus their deliberate usage ratio
> - `diversityScore`: how varied is the craft toolkit (high = varied, low = one-note)
> - `voiceSignatureDevices`: device types that feel like this student's voice specifically — not just frequent, but FITTING. A student using metaphor 10x indifferently is not a metaphor signature.
> - `underusedPossibilities`: devices NOT in the inventory that would serve THIS essay given its voice and subject. Reason per device — name the paragraph where it would help and what it would do.
> - `overReliance`: devices used so frequently they become tics rather than signatures. Reason per instance.
> - `craftMaturityNarrative`: 3-5 sentence prose synthesis — where is this student's craft today, and where could it go?
>
> Be specific about THIS essay. No generic "add more metaphor" advice. If anaphora would help at P4, say why P4 specifically.

**Quality controls for L3.75:**
- `underusedPossibilities` and `overReliance` must cite paragraphs. No abstract recommendations.
- `craftMaturityNarrative` cannot exceed 5 sentences (hard cap in post-processing).
- `voiceSignatureDevices` must be a subset of instance types actually used — cannot fabricate.

**Taxonomy file (`rhetoricalDeviceTaxonomy.ts`):**

Exports:
- `RHETORICAL_DEVICE_TAXONOMY: Record<RhetoricalDeviceType, { displayName: string; category: 'structural' | 'sentence_level' | 'tropic' | 'tonal'; oneLineDescription: string }>`
- Helper: `normalizeDeviceType(raw: string): RhetoricalDeviceType` — maps common variant names to canonical types; returns `'other'` when no match
- Helper: `isValidInstance(instance: RhetoricalDeviceInstance): boolean` — validates that quote, location, effect are all populated and non-trivial

**Tests:**
- Fixture: essay with a clear metaphor, anaphora, volta, and one `other` device
- Assert all 4 instances surface in `rhetoricalInventory.instances`
- Assert `dominantDevices` counts match instance counts
- Assert `diversityScore > 0.5` for 4 varied devices
- Assert `voiceSignatureDevices` is a subset of detected types
- Assert `underusedPossibilities` cites specific paragraphs
- Assert the `other` device has `deviceName` populated
- Null-path: essay with no detected devices → `rhetoricalInventory` is `null`
- Taxonomy normalization: "antithesis" → `other` with `deviceName: 'antithesis'` (or `juxtaposition` if that's the closest match — `normalizeDeviceType` decides)

### Phase 3 — Coaching Prompt Integration

**Files:**
- Update: `src/services/essayIntelligence/coaching/promptBlocks.ts` — add `analyticalDeepeningSection`
- Update: `src/services/essayIntelligence/coaching/coachingService.ts` — wire the section into the cached system prompt, after `historicalIntelligenceSection` and before `profileContext`

**New prompt section:**

```ts
export function analyticalDeepeningSection(
  claimMap: ClaimEarnednessMap | null,
  inventory: RhetoricalInventory | null,
): string;
```

Returns `''` when both inputs are null or empty. Otherwise:

```
=== ANALYTICAL DEEPENING — CLAIMS & CRAFT ===

Claim earnedness:
${claimMap.assessments present, unearned/partial first}
- UNEARNED: P${paragraph}S${sentence}: "${claimText}"
  Missing: ${missingEvidence}
- PARTIAL: P${p}S${s}: "${claimText}"
  Has: ${strongest evidence}. Needs: ${missingEvidence}
- EARNED: count summary ("${N} claims are fully earned by the scene work")

Rhetorical inventory:
${inventory.craftMaturityNarrative}

Signature devices you're wielding: ${voiceSignatureDevices joined}
Under-reached possibilities: ${top 2 underusedPossibilities.reasoning — paragraph-specific}
Over-relied: ${if any overReliance, list type + count}

Use these when genuinely relevant. When a student asks about P3 and you see an unearned claim in P3, surface it. When you see a signature device the student may not realize they're using, name it — credit before suggesting changes. When the student isn't asking about craft, don't force the inventory in.
```

**Ordering constraint:** this section goes AFTER `historicalIntelligenceSection` and BEFORE `profileContextSection`. This is the spec position — claim/craft signals are more immediate than history but more general than the profile summary.

**Top-K filtering inside the section builder:**
- At most 5 unearned/partial claims (prioritize unearned first, then most-underearned paragraphs)
- At most 3 signature devices
- At most 2 under-reached possibilities (the ones with the clearest paragraph-specific reasoning)
- Full `craftMaturityNarrative` always included (capped at 5 sentences upstream)

### Phase 4 — Verification

**Files:**
- NEW: `tests/unit/analytical-deepening-integration.test.ts`
- NEW: `tests/fixtures/analytical-deepening/` — three fixture profiles with known claim and device ground truths

**Fixtures:**

1. **Well-earned essay** — all claims earned, varied devices, no over-reliance. Coach section should credit the earnedness, name signature devices, suggest one under-reached possibility.
2. **Unearned-heavy essay** — majority of claims unearned, thin device toolkit. Coach section should lead with missing evidence per claim, name the narrow device palette.
3. **Over-reliance essay** — claims earned but one device dominates (e.g., metaphor x8). Coach section should credit earnedness, flag the over-reliance without shaming.

**Integration assertions:**

1. Each fixture produces the expected `claimEarnednessMap` and `rhetoricalInventory`.
2. `analyticalDeepeningSection(null, null) === ''` (no bloat when signals are null).
3. When both signals present, the section includes UNEARNED claims first, EARNED count last.
4. Section text contains exact paragraph citations (not vague "somewhere in the essay").
5. Rounds 2–7a architectural guarantees intact — all prior tests still pass.

## Hard Verification

- `npx tsc --noEmit` passes cleanly.
- Every existing unit test still passes. List regressions.
- New tests pass: `claim-earnedness.test.ts`, `rhetorical-devices.test.ts`, `analytical-deepening-integration.test.ts`.
- Every L3/L3.5/L3.75 output schema change handles absence (old profiles without new fields).
- Cost delta per L3/L3.5/L3.75 call: measure tokens added. Report expected % increase. Target: **<15% per layer.**

## Specific Risks to Stress-Test

1. **Claim detection false positives.** L3 flags too many sentences as claims → L3.5 gets overwhelmed and produces shallow judgments. Mitigation: the threshold language in the L3 prompt. Test: a narrative-heavy essay with few claims should produce <10 candidates.

2. **Earnedness drift.** L3.5 grades claims generously because it's reading favorably. Mitigation: explicit "a reader who disagreed would require" framing. Test: the unearned-heavy fixture should produce `earnednessRate < 0.4`.

3. **Device over-detection.** L3.5 finds "metaphor" in every figurative phrase. Mitigation: the threshold in the prompt ("log devices that DO something"). Test: a 5-paragraph essay should produce 5-15 instances, not 40+.

4. **Taxonomy misuse.** LLM picks a close-but-wrong taxonomy type instead of `other`. Mitigation: `normalizeDeviceType` normalizer + spot-check in tests. Test: a clear antithesis is labeled correctly (not defaulted to `parallel_structure`).

5. **Voice-signature inflation.** L3.75 calls every frequent device a "signature" even when it's just a tic. Mitigation: prompt requires "fitting" not just "frequent"; `overReliance` is the counter-signal. Test: the over-reliance fixture should populate `overReliance` for the dominant device and NOT include it in `voiceSignatureDevices`.

6. **Coach section bloat.** With many claims and many devices, the section can grow large. Mitigation: top-K filtering in the section builder. Test: a fixture with 20 claims and 30 devices produces a section under 400 tokens.

## Execution Model

**Two agents in parallel:**

- **Agent A — Per-Claim Earnedness**: Owns Phase 1 end-to-end. Prompt edits to L3 walk and L3.5 analysis, schema additions, tests.
- **Agent B — Rhetorical Device Recognition**: Owns Phase 2 end-to-end. Prompt edits to L3.5 analysis and L3.75 synthesis, taxonomy, schema additions, tests.

Both agents touch `analysisPass.ts` (L3.5). Coordinate: Agent A lands its L3.5 changes first. Agent B reads Agent A's applied changes before editing the same file; additions should be in clearly separable prompt sections so merge is clean.

**Then, after both land:**

- **Agent C — Integration + Verification**: Phase 3 coach integration, Phase 4 fixtures + integration test. Runs after A and B are both done. Validates cross-capability behavior.

**Why parallel:** Per-claim earnedness and rhetorical devices are independent capabilities. Serial would double wall time with no benefit. The only shared surface is the L3.5 prompt, which has clearly separable sections.

## Output Per Agent

```
## Summary
- Files changed (file:line ranges)
- Schema additions (quote type definitions verbatim)
- Prompt extensions (paste the new prompt section added to L3/L3.5/L3.75)
- Guards in place (enumerate each false-positive mitigation)
- tsc pass/fail
- Existing tests still pass: Y/N (list regressions)
- New tests added: file names + pass counts
- Token delta per layer (expected % increase)
- One-sentence headline
```

## Success Criteria for Round 7b Overall

- Per-claim earnedness evaluates every flagged claim with cited evidence
- Rhetorical device detection produces device instances with specific effects
- L3.75 synthesizes an inventory with paragraph-cited under-reached possibilities
- Coach section surfaces unearned claims and signature devices when genuinely relevant
- Session-one behavior unchanged from Round 7a (no additional bloat when signals are null)
- Rounds 2–7a architectural guarantees intact
- Zero new LLM calls — all additions extend existing call schemas
- Cost delta per layer under 15%

## No Commits Unless Explicitly Asked

Per CLAUDE.md. Leave all changes in working tree. The lead will propose commits at end of round.

---

## Appendix: What Round 7c Will Build

For context only — Round 7b doesn't implement any of it:

- **Round 7c (Archetype Distance, AO Simulation Enhancement)**: creates archetype baseline library + distance computation + AO simulation refinement using the accumulated claim/craft signals from 7b. Depends on 7b for claim data but is otherwise independent of 7a.
