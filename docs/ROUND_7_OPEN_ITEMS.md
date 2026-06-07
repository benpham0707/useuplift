# Round 7 — Open Items (Post-PR #17)

**Status as of 2026-04-17.** PR #17 (`round7-hardening-p0`) closed findings 1–6 from `ROUND_7_COMPREHENSIVE_AUDIT.md`. Two P2 findings remain open and are in scope for the Authenticity Integration round.

---

## P2-7 — Signals are inventory, not capability

**Source:** `ROUND_7_COMPREHENSIVE_AUDIT.md` finding #7.

**Problem.** The 7a/7b/7c signal machinery (`revisionHistory`, `revisionIntelligence`, `voiceEvolution`, `claimEarnednessMap`, `rhetoricalInventory`, `archetypeDistanceProfile`, `aoFirstRead.archetypePositioning`) lands in the coach's cached system prompt only. No code path:
- gates coaching behavior on signal state
- routes a turn to a different handler when a signal fires
- demands follow-up when a signal is unresolved

Impact on a given coaching turn is determined by "did Sonnet happen to read and act on this section," which is non-deterministic.

**Same failure-mode as V1 authenticity.** V1's `authenticVsPerformed` field is "defensive not assertive" — present in the profile, un-acted-on by any downstream code. Fixing #7 and fixing the authenticity integration are the **same shape of fix**: convert passive signals into active lenses that force action at specific pipeline hops.

**Exit criteria.**
1. Each of the 7 signals has at least one of: (a) a gate that changes pipeline routing, (b) a prompt hop that must consume it and produce a finding referencing it, or (c) a coach-turn handler that fires when the signal crosses a threshold.
2. Test coverage: mocked LLM produces an output that ignores a signal → test fails.

**Scope note.** Fix in the Authenticity Integration round, not as a standalone item — the architecture overlaps materially.

---

## P2-8 — Prompt overload under full enrichment

**Source:** `ROUND_7_COMPREHENSIVE_AUDIT.md` finding #8.

**Problem.** Under full enrichment, the coach's cached system prompt injects `historicalSection` (7a) + `analyticalSection` (7b) + `strategicSection` (7c) = **600–1100 tokens of verdict-laden content before the essay text**. Sonnet reads verdicts first, then evidence — the opposite of how an AO actually reads.

Round 8 (personalized revision planning) will add another verdict block. Authenticity integration will want to add more. Without a fix, each round makes this worse.

**Constraint for Authenticity Integration.** The `AuthenticitySignalPack` must be injected as **compact hints**, not as a new verdict block:
- `aiRiskScorer` — inject top-5 flagged passages only, not all 7 signal scores as prose.
- `voiceProfile` — use `getPromptSummary()` at ~500 tokens, not the full profile.
- `clicheHits` / performative indicators — inject only those triggered on this essay, as bullet hints, not the full taxonomy.
- `ExperienceFingerprint` / `portfolioVoiceConsistency` — inject only when materially informative, not on every call.

**Exit criteria.**
1. Token budget per enrichment block documented and enforced.
2. Verdict-before-evidence inversion corrected: essay text appears before verdict-laden context, OR verdict context is reframed as "pre-observations to second-opinion" rather than conclusions.
3. Total cached-prompt length under full enrichment bounded (target: ≤ current 7c baseline + 400 tokens for authenticity context, not +1000+).

**Scope note.** Prerequisite for both Round 8 and Authenticity Integration. Do not merge either round without a concrete token-budget plan.

---

## Fix ownership

Both items fold into the **Authenticity Integration round** (Stages 1–4 planning in flight; see conversation context). The stages already account for #7 (woven lenses replace passive signals) and #8 (compact-hint injection). No separate round needed.
