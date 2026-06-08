Round 7c (Strategic Intelligence — Archetype Distance + AO Simulation Enhancement) just landed on branch `feat/forge-plan-pipeline-refactor` at `/Users/tuepham/uplift-final-final-18698-62030`.

The implementation session reported done, but Rounds 7a and 7b both taught us that "done" from the implementation agents ≠ 100% — an audit always surfaces real issues. Distance math, prompt bloat, and focused-mode staleness are the predictable soft spots.

Do the same pass for 7c: audit deeply, fix everything that isn't shippable, verify exhaustively. The authoritative spec for 7c is `docs/ROUND_7C_PROMPT.md` — read it in full before auditing so you know what the target was. Don't trust the implementation agent's summary — trust the code and tests.

Do NOT commit at any point. Leave all changes in the working tree. The lead (me) will propose commits at the end.

## Phase 0 — Baseline verification (before any audit)

Run all of these and report exact results. If anything is red, STOP and report before proceeding — the audit premise is broken.

1. `npx tsc --noEmit` — must be clean (0 errors)
2. Every unit test file in `tests/unit/*.test.ts` runs green. Report pass counts per file. Previous session had **31 files passing** (post-7b hardening); confirm each one still passes AND list any new files added by the 7c session.
3. Confirm the new 7c code actually exists and compiles:
   - `src/services/essayIntelligence/archetypes/archetypeLibrary.ts` (curated baselines)
   - `src/services/essayIntelligence/archetypes/archetypeTypes.ts` (or same-file types — either is fine)
   - `src/services/essayIntelligence/archetypes/archetypeDistance.ts` (pure-code distance math)
   - New types in `profileTypes.ts`: `ArchetypeId` union, `ArchetypeBaseline`, `DistanceDimension`, `DimensionDistance`, `ArchetypeDistanceProfile`, `AOArchetypePositioning`
   - `archetypeDistanceProfile?: ArchetypeDistanceProfile | null` on `EssayProfile`
   - `archetypePositioning?: AOArchetypePositioning | null` on the AO first-read output type
   - `setArchetypeDistanceProfile` method on `EssayProfileManager`
   - `aoFirstRead.ts` prompt extensions + output schema growth
   - `analysisOrchestrator.ts` wiring: distance computed AFTER L3.5 aggregation and L3.75 synthesis are applied
   - `strategicIntelligenceSection` in `coaching/promptBlocks.ts`
   - Section wired in `coaching/coachingService.ts` AFTER `analyticalSection` (7b) and BEFORE `===ESSAY PROFILE CONTEXT===`
   - Focused-mode null-clears extended for Round 7c fields in `focusedAnalyzer.ts` (and/or `reanalysisOrchestrator.ts`)
   - New tests: `archetype-library.test.ts`, `archetype-distance.test.ts`, `ao-simulation-enhancement.test.ts`, `strategic-intelligence-integration.test.ts`
   - New fixtures: `tests/fixtures/strategic-intelligence/` (three files — textbook, breakout, non-archetype)

If any of those are missing or broken, the implementation is incomplete — fix that FIRST before auditing for quality.

## Phase 1 — Parallel critical audits

Spawn FOUR audit agents in parallel. Each gets its own focused brief. Give each agent an 800–1200 word output budget. Each agent returns findings with severity flags (HIGH / MEDIUM / LOW) and `file:line` citations. Do NOT let audit agents modify code — research only.

### Audit A — Archetype Library quality + Distance math correctness

Probe specifically:

1. **Library completeness.** Every `ArchetypeId` in the union has a populated entry in `ARCHETYPE_LIBRARY`. Every baseline has all required fields populated with non-placeholder content (no `TODO`, no `""`, no "sample text"). Count items per field — any baseline with fewer than 3 `typicalClaims` / 2 `typicalDevices` / 4 arc beats / 2 `commonFailureModes` / 2 `rareDifferentiators` is a HIGH finding.

2. **Baseline device validity.** Every `typicalDevices` entry across all baselines must be a valid `RhetoricalDeviceType` (cross-check against `rhetoricalDeviceTaxonomy.ts`). Flag any invalid values.

3. **Baseline discrimination.** Are baselines actually distinct? Two archetypes with >80% overlapping `typicalClaims` or identical `typicalEmotionalArc` sequences means the library doesn't discriminate. Sample 5 archetype pairs and check overlap.

4. **`resolveArchetypeId` normalizer behavior.** Test mentally with: `""`, `"unknown garbage"`, `"immigrant essay"`, `"IMMIGRANT_PARENT_SACRIFICE"`, `"resilience"`, `"sports"`, `"coming out"`. Does the normalizer prefer `'other'` over a stretched match (good, per spec) or force-match aggressively (bad)?

5. **Distance math — weight invariant.** Sum of dimension weights must equal exactly 1.0 (use `===`, not `closeTo`). Assert in test. If the file uses floats that sum to 0.999... flag.

6. **Distance math — scale discrimination.** Read the three fixtures (textbook, breakout, non-archetype OR three in-library fixtures). Do they actually produce the expected aggregate ranges (textbook < 0.3, breakout > 0.6)? Or does everything cluster in 0.3–0.6? Check the actual fixture-produced scores against thresholds.

7. **Distance math — null inputs.** When `claimEarnednessMap` is null (no signal), is claim_distance computed as 0 (identity), skipped, or does the function throw? Same for missing `rhetoricalInventory`, missing voice register. Spec says if essay lacks required inputs, the distance profile is null. Verify.

8. **clichéFlags false positives.** Substring-matching `commonFailureModes` against essay text is a known risk. Find the implementation. Is it guarded by a corroboration check (claim or finding must agree), or is it raw substring match? A sentence like "I didn't want to write a resilience essay" should NOT trip the resilience cliché flag.

9. **differentiatorsPresent match quality.** Same concern — is the match grounded in structural evidence (claim earnedness, rhetorical inventory) or just text similarity?

10. **Aggregate verdict thresholds.** Are the boundaries `< 0.25`, `0.25–0.45`, `0.45–0.7`, `> 0.7` implemented correctly and with explicit constants? Any magic numbers scattered inline?

11. **Determinism.** Given identical inputs, does `computeArchetypeDistance(profile)` produce byte-identical output? Any sort without explicit comparator, any `Math.random`, any `Date.now`?

12. **`strongestBreakoutDimension`** is only non-null when at least one dimension has a significant departure. Edge case: all dimensions at exactly equal distance — deterministic tiebreak?

### Audit B — AO Simulation Enhancement (prompt + parse + output)

Probe specifically:

1. **AO prompt token delta.** Measure the current AO first-read prompt size. Count tokens added by the three new context blocks (claim earnedness, rhetorical craft, archetype context). Target: <500 tokens per block, <15% total increase. Report actuals.

2. **Conditional prompt blocks = cache-break risk.** If the AO prompt includes blocks ONLY when signals are present (e.g., skips claim block when `claimEarnednessMap` is null), the prompt prefix is NOT byte-stable → prompt cache misses on every null-signal call. Read the prompt construction. Is the system prompt stable and per-call input carries the signals, or does the system prompt itself vary? This is a HIGH finding if the cached prefix is variable.

3. **`committeeFraming` grounding.** Spec requires it to reference a specific paragraph (regex `P\d+` or `S\d+`). Is there a post-hoc lint in the parser? Or is this trusted from the LLM?

4. **`standoutMoments` paragraph bounds.** Is there a bounds check against `profile.paragraphs.length`? If LLM emits `paragraph: 99` on a 4-paragraph essay, what happens?

5. **`archetypeRisks.location` validation.** Per spec, must be a paragraph number OR the literal string `"throughout"`. Any other value → drop or normalize? Read the parser.

6. **`readsAs` value domain.** Only four valid values: `archetype_textbook`, `archetype_with_craft`, `archetype_transcended`, `non_archetype`. Is the parser strict? What if LLM emits `archetype_tracking`?

7. **Low-confidence branch.** Spec says: if `matchConfidence === 'low'`, LLM is instructed to emit `readsAs: 'non_archetype'` + generic `archetypeLabel`. Is this enforced at parse time, or trusted prompt-side?

8. **Parse resilience.** Missing `archetypePositioning` entirely → field null, no crash. Malformed structure (e.g., `archetypeRisks` is a string) → drop with warning, don't reject whole AO response. Verify.

9. **AO output schema back-compat.** The new `archetypePositioning?` field is optional. Do existing consumers of the AO output handle absence? Grep for AO-result readers.

10. **AO first-read lifecycle.** When does AO first-read run in the orchestrator? Is `archetypeDistanceProfile` already populated before the AO call (so it can be injected into the AO prompt)? Or does AO run BEFORE distance is computed (ordering trap analogous to Round 7b's C-H1)?

11. **Prompt injection efficiency.** The archetype context block presumably embeds baseline fields (e.g., `aoTypicalReaction`, top `commonFailureModes`). Is the full baseline injected, or only relevant summary? Full-baseline injection bloats prompts unnecessarily.

12. **Claim / craft block omission logic.** Spec has the three blocks conditional on signal presence. Confirm either (a) blocks ALWAYS present with "no signal" placeholder text (cache-stable), or (b) blocks conditionally included (cache-unstable — must flag).

### Audit C — Coach integration + cost + cache stability

Probe specifically:

1. **Section placement in `coachingService.ts`.** Verify order: `historicalSection` → `analyticalSection` (7b) → `strategicSection` (7c) → `===ESSAY PROFILE CONTEXT===`. Read the 15 surrounding lines. Quote them.

2. **`strategicIntelligenceSection(null, null)` returns `''`.** Verify by reading the function's early return. Confirm both `null` AND `undefined` AND empty-but-present cases all produce `''`.

3. **Degenerate non-archetype case.** Spec says: when `matchedArchetype === 'other'` AND `readsAs === 'non_archetype'`, section should be empty (nothing strategic to say beyond analyticalDeepeningSection). Is this implemented? Test with a fixture.

4. **Cache stability for null path.** When ALL three of Round 7b + 7c signals are null (fresh profile), the coach system prompt must be byte-identical to the post-Round 7a prompt. Verify by reading the composition path — any whitespace, separators, or empty-block markers added unconditionally?

5. **Top-K filtering.** Spec: `standoutMoments` cap 3, `archetypeRisks` cap 3 (critical first, then notable, then minor). Read the section builder. Test with fixtures of 10+ items.

6. **`archetypeLabel` resolution.** When rendering, does the section use `ARCHETYPE_LIBRARY[id].displayName` or the enum slug? If slug, flag HIGH.

7. **Forbidden phrases conflict.** Read `coaching/forbiddenPatterns.ts`. Does the strategic section introduce any forbidden phrasings ("you need to", "once you give me", etc.)?

8. **AO prompt cache stability.** The AO first-read prompt is cached. Do the three new enrichment blocks sit in the CACHED prefix (byte-stable) or the per-call input (OK to vary)? A variable system prompt = cache miss every call.

9. **Coach system prompt cache stability.** Same concern at the coach layer. Is `strategicIntelligenceSection` called once and its output embedded in the cached prompt, or does it recompute per turn?

10. **Token delta — coach prompt.** Measure the strategic section's typical size across the three fixtures. Report tokens per fixture. Target: <400 tokens in the typical case.

11. **Output parsing resilience.** If the AO LLM returns malformed `archetypePositioning` (extra fields, wrong types), does the coach section builder crash, or does it read defensively?

12. **Legacy profile handling.** An old profile (pre-7c) loaded from Supabase has no `archetypeDistanceProfile`, no `aoFirstRead.archetypePositioning`. Does any consumer do `profile.archetypeDistanceProfile.matchedArchetype` without null-check? Grep.

### Audit D — Lifecycle + focused mode + persistence

Probe specifically:

1. **Focused re-analysis null-clear — NEW 7c fields.** Round 7b's hardening pass added signal-clears in `focusedAnalyzer.ts` (~line 1625) for `setClaimEarnednessMap(null)` and `setRhetoricalInventory(null)`. Does 7c extend this block to also null `archetypeDistanceProfile`? Grep for `setArchetypeDistanceProfile(null)` in focusedAnalyzer.ts. If missing, HIGH finding (stale archetype signal after any surgical edit).

2. **AO first-read focused behavior.** Does focused re-analysis re-run AO first-read? If not, the `archetypePositioning` field goes stale alongside the distance profile. Should be nulled in focused mode.

3. **Persistence round-trip.** `supabaseCheckpointStore.ts` serializes via `JSON.parse(JSON.stringify(profile))` with a replacer that only strips `_enriched`/`_enrichmentError`. Flat JSONB blob. Confirm the new fields round-trip cleanly. Should be transparent, but grep for any explicit field whitelist.

4. **`reanalysisOrchestrator.ts` paths.** Multiple reanalysis modes (comprehensive, focused, delta). Each should either (a) recompute archetype distance, or (b) null it. No mode should leave stale signals.

5. **Orchestrator call order.** Distance computation must happen AFTER L3.5 aggregation (`setClaimEarnednessMap`, `setRhetoricalInventory`) AND AFTER L3.75 synthesis (`applyHolisticSynthesis`). Read `analysisOrchestrator.ts` around the L3.5 post-aggregation block. Is distance computed after both inputs are live on the profile?

6. **AO call order.** Where does `aoFirstRead` run? BEFORE or AFTER archetype distance is computed? Spec requires archetype context to be injectable into the AO prompt, so distance must be available first. Verify.

7. **Integration test fixture assertions.** Read `tests/unit/strategic-intelligence-integration.test.ts`. Are assertions meaningful (exact string match, regex bounds) or weak (`toBeTruthy`, `toContain('STRATEGIC')`)?

8. **Fixture realism.** Read the three fixtures. Do the textbook, breakout, and non-archetype cases actually exercise different code paths? Or do they trivially mock the ArchetypeDistanceProfile output?

9. **Section ordering within block.** `archetypeLabel` + verdict on first two lines. Breakout moments before risks. Critical risks before notable. Verify with a test.

10. **Claim-distance dependency.** If `claimEarnednessMap` is null, does `computeArchetypeDistance` still produce a partial profile (other dimensions only), or does it null the whole profile? What's the correct behavior?

11. **Distance computation performance.** Is the per-dimension distance math O(n) or does it accidentally become O(n²) (e.g., nested loops over baselines × claims)?

12. **Focused-mode signal-clear test.** Does `tests/unit/focused-round7b-signal-clear.test.ts` get extended for Round 7c fields, or is there a new `focused-round7c-signal-clear.test.ts`? Either is fine — verify one exists.

## Phase 2 — Synthesize findings with severity

Collect findings from all four audits. Categorize:

- **HIGH**: real bugs, incorrect algorithm, data corruption, schema mismatch, prompt producing garbage, cache-break, missing null-clear. Must fix.
- **MEDIUM**: signal quality issues, detection over/under reach, generic output that should be specific, missing bounds/validation at system boundaries. Should fix or document.
- **LOW**: cosmetic, code smells, potential future concerns, dead schema fields. Defer with inline comment.

Present as a table. Include `file:line` references for every claim. Before moving to Phase 3, tell the user the summary and what you're about to fix. Don't ask permission — we already agreed on "100% confidence, leave no room for error." Report the plan and go.

## Phase 3 — Hardening pass

Spawn ONE focused fix agent. Give it the full table of HIGH and MEDIUM findings. Instruct it to:

- Fix every HIGH finding with code + test
- Fix every MEDIUM finding unless the fix would require schema migration or new LLM calls (in which case, add a prominent `TODO` comment referencing the specific concern and defer)
- Document every LOW finding with an inline comment at the relevant site

Constraints on the fix agent (non-negotiable):

- **Zero new LLM calls**
- **Additive schema only** — no breaking changes to existing fields
- **Every new test must pass deterministically** (no reliance on a live LLM call unless that's an established pattern in the existing test suite)
- **`npx tsc --noEmit` clean** after all fixes
- **Prompt cache stability preserved** — AO first-read prompt + coach system prompt must remain byte-stable for identical inputs. Do not introduce per-call conditional blocks in cached prefix.
- **Distance math must remain deterministic** — no floats that lose precision, no non-stable sorts, no sources of entropy

## Phase 4 — Final verification

After the fix agent returns, run the full verification bar yourself (don't trust the agent's claims):

1. `npx tsc --noEmit` — clean
2. Every unit test file in `tests/unit/*.test.ts` — list pass count per file. Compare against Phase 0 baseline. Call out any regressions OR new tests added.
3. Re-read the four Round 7c test files end-to-end to confirm they still exercise the intended behaviors (an agent could have weakened assertions to get them to pass). Pay special attention to the distance-discrimination assertions — textbook fixture must still score < 0.3, breakout fixture must still score > 0.6.
4. Run any fix-agent-added tests explicitly.
5. Spot-check two HIGH fixes by reading the actual code diff — does the fix match the reported intent?
6. Confirm focused-mode null-clear covers ALL Round 7c fields (distance profile, AO positioning).
7. Confirm the AO first-read prompt's cached prefix is byte-stable across null/non-null signal combinations (concat the prompt for three synthetic inputs and compare prefixes).
8. Confirm no new `any` types were introduced without justification.
9. Confirm zero new LLM calls were introduced (grep for new `anthropic.messages.create` or equivalent creation sites — should be unchanged from 7b baseline).
10. Confirm the archetype library has no placeholder/TODO content (grep library file for `TODO`, `FIXME`, `PLACEHOLDER`).

## Phase 5 — Status report

Give me a single structured report:

### GREEN (confidence to ship)
- Per-file test pass counts
- Architectural guarantees confirmed (zero new LLM calls, additive schema, cache stability, null-clear parity, distance determinism, etc.)

### YELLOW (deferred with intent)
- Each LOW finding, where it's documented in code, and why it's deferred (e.g., "baseline library could use 3 more archetypes; 20 shipped meets current coverage needs")

### RED (blockers — if any)
- Should be empty if we hit 100%. If something is genuinely unfixable in this pass, name it and why.

### Recommendation
- Are we ready to close Round 7? If yes, brief one-line headline. If no, what's the remaining work?

Keep the final report under 500 words. The goal is the same bar we held for 7a and 7b: nothing left on the desk before moving on.
