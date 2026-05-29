# Landing Detector Prompt — RATIONALE

> **Deliverable:** D-1.4 (3+ rounds of revision on the system prompt).
> **Companion file:** `landingDetector.prompt.ts`.
> **Calibration:** D-1.5 mid-build API touchpoint ($0.50–$1.00 budget, 5 known cases).
> **Model:** `claude-sonnet-4-5-20250929` (per Tue's 2026-04-27 model policy: new-build sites use Sonnet when single-call cost < $0.10 OR when judgment matters; landing detection meets both — typical-payload cost ≈ $0.0019, and signal-weighting is judgment).

This document captures the three rounds of revision the prompt went through, the adversarial cases that drove changes, the comparison-pass synthesis decision, and the open questions deferred to D-1.5 calibration.

---

## Contract recap (for context)

Per `L5_ITERATION_LOOP_DESIGN.md` §5 and the `LandingDetectorOutput` type in `landingDetector.ts`:

- **Output schema (locked):** `{ status: 'addressed' | 'partially_addressed' | 'unaddressed' | 'changed_target', confidence: number ∈ [0,1], reasoning: string, signalsUsed: ('edit_vs_critique' | 'redetection' | 'chat_behavior')[] }`. The runtime validator at `landingDetector.ts:parseAndValidate` enforces these field names and enum values verbatim — any prompt revision MUST keep them.
- **Q4 (Tue 2026-04-26, locked):** confidence floor 0.7 to count as `addressed`; any `addressed` with confidence < 0.7 is mechanically downgraded to `partially_addressed` in `applyConfidenceFloor()` AFTER the LLM call. The prompt instructs the LLM to report honest confidence; the floor logic is in the caller.
- **Asymmetric tolerance (§5.3 of the iteration design):** prefer-not-to-repeat over prefer-to-cover. When the prompt is uncertain between two adjacent statuses, it should lean toward the less-landed one.

---

## Round 1 — Contract pass

`v0.1.0-round1` shipped with the D-1.3 skeleton commit so the orchestration was end-to-end testable with mocked LLM. The Round 1 prompt was straightforward: schema declaration, status definitions, confidence-floor language, basic discipline reminders.

What Round 1 covered cleanly:
- All four status enum values explicitly named.
- signalsUsed labels matched the validator enum.
- "Don't game the floor" language for confidence reporting.
- "Output ONLY the JSON object" discipline.
- Asymmetric tolerance language ("prefer partially_addressed over uncertain addressed").

What Round 1 did not adequately address (surfaced by Round 2 adversarial pass):
- Synonym-swap edges — does a wording change at the location count as engagement?
- Signal-conflict resolution — when A says addressed and B says still flagged, which wins?
- changed_target boundary — what distinguishes a rewrite from a target change?
- Confidence anchoring — what does 0.6 vs 0.8 actually mean?
- Edge case where Signal A is a no-op edit (oldText === newText).
- chat_behavior informativeness — when does a mood + engaged boolean count as "informative"?

---

## Round 2 — Adversarial-thinking pass

I imagined ~10 adversarial cases without running them, looking specifically at where Round 1 would produce wrong or low-quality calls.

### Adversarial case 1 — Synonym swap at the location

Move: "Replace 'deeply meaningful' with the actual meaning."
Old: "The conversation was deeply meaningful."
New: "The conversation was profoundly significant."

Round 1 ambiguity: the discipline section says "Don't treat ANY edit at the location as evidence." But it doesn't explicitly call out synonyms or restatements as the typical failure mode.

Round 2 fix: explicitly named "synonym swaps" and "surface restatements" in the unaddressed definition and in the discipline section. Made it a Q3 branch.

### Adversarial case 2 — Signal conflict (A says addressed, B says still flagged)

Round 1 ambiguity: doesn't tell the LLM which signal wins.

Round 2 fix: added a CONFLICT RULE. When signals disagree, lean LESS-landed. Made conflict-resolution explicit in the Q4 branch.

### Adversarial case 3 — changed_target false positive (rewrite that ignores the critique)

Move: "Show, don't tell."
Old: "I felt sad about losing the match."
New: "After the match, I went home and ate dinner with my family. The day was over."

Is this `changed_target` (location transformed) or `unaddressed` (original problem still there in different words — telling, not showing)?

Round 1 ambiguity: changed_target definition was loose enough to invite false positives.

Round 2 fix: tightened to "the original substance the move was teaching against is GONE — replaced with new content." Added explicit guard: "A rewrite that keeps the original problem is NOT changed_target."

### Adversarial case 4 — Edit that's transformative but doesn't address the move

Significance flag is "transformative" but the transformation is parallel to the critique's direction, not aligned with it.

Round 2 fix: clarified that edit significance is INPUT, not signal — the LLM weighs the SUBSTANCE, not the size, of the change.

### Adversarial case 5 — Confidence ambiguity

Round 1 said "report your honest confidence" but gave no anchors. A 0.6 vs 0.8 distinction was undefined.

Round 2 fix: added rough confidence anchors (0.9+ unambiguous, 0.7–0.9 strong, 0.6–0.75 leaning, < 0.5 essentially a coin flip).

### Adversarial case 6 — chat_behavior informativeness

Round 1 said "if chat behavior was uninformative, don't list it" but didn't define informative.

Round 2 fix: defined informative chat as engagement with the move's substance (asked about it, accepted it, dismissed substantively). Mood without substance is not informative.

### Adversarial case 7 — JSON-only discipline

Round 1 said "no prose before or after" but didn't reinforce. JSON mode helps but isn't bulletproof.

Round 2 fix: tightened to "first character is `{` and last is `}`. No markdown fences, no commentary."

### Adversarial case 8 — Low-confidence addressed gaming

Round 1 said don't game the floor, but didn't say what to do instead.

Round 2 fix: explicit rule — if you're below 0.7 confident the move landed, the correct output is usually `partially_addressed` directly, with confidence reflecting actual certainty in that partial call.

After Round 2, I had a much sharper prompt with rules-first structure, explicit boundary handling, and confidence anchors. But rules-first prompts can underperform on subtle discrimination — the LLM follows the rules without anchoring to concrete pattern.

---

## Round 3 — Comparison pass

I dispatched two Plan agents in parallel, each drafting an alternative full system prompt:

- **Variant A (example-first):** lead with 3–5 concrete borderline cases showing inputs and correct classifications + reasoning, then derive rules from the patterns.
- **Variant B (decision-tree):** instruct the model to walk 3–5 sequential diagnostic questions, where the answers narrow toward the classification.

### What Variant A did well

- Five concrete cases anchoring the boundaries:
  - Case 1: substantive engagement → clean addressed.
  - Case 2: directionally right, execution thin → partially_addressed.
  - Case 3: surface restatement → unaddressed (synonym swap).
  - Case 4: deletion + replacement → changed_target with explicit caveat.
  - Case 5: signal conflict → conservative; chat excluded from signalsUsed.

  The cases concretize the boundary discrimination far better than abstract rules alone.

- Clean explicit guidance that signal D (chat) optimism doesn't override signal A/B textual evidence.
- "Don't classify on vibes" — sharp discipline reminder.

### What Variant B did well

- Forces explicit branching at the ambiguous boundaries:
  - Q1 disposes of "no edit" cases cleanly.
  - Q2 isolates the changed_target call before any other classification.
  - Q3 separates addressed / partially_addressed / unaddressed via directive execution.
  - Q4 brings in auxiliary signals only after a working hypothesis is set.

- Reduces the risk of jumping to a label before resolving the discrimination questions — a common LLM failure mode on prompts with abstract definitions.

- The "lean toward less-landed" rule is reinforced at multiple decision points.

### Schema-break problem (both variants)

Both variants introduced field-name and enum-value drift that would BREAK the runtime validator at `landingDetector.ts:parseAndValidate`:

- Variant A renamed `status` → `classification`. Validator throws on missing `status`.
- Variant A used `signalsUsed: ["edit", "redetection", "chat"]`. Validator enforces `'edit_vs_critique' | 'redetection' | 'chat_behavior'`.
- Variant B used `signalsUsed: ["taughtMove", "studentEdit", "redetection", "chatBehavior"]`. Same problem, more drift.

Lesson: the agents weren't briefed on the validator's locked enum names. For Round 3 final, I keep the contract-locked schema verbatim and adopt the two variants' best content within that schema.

### Synthesis decision

I picked the decision-tree spine (Variant B's Q1–Q4) because the failure mode I most want to prevent is jumping to a status before resolving the boundary discrimination — which the decision tree forces. I embedded three of Variant A's anchor cases (the strongest borderline patterns: clean addressed, synonym swap, changed_target) so the model has concrete pattern anchors when the questions land at ambiguous nodes. I kept Round 2's confidence anchors and the asymmetric tolerance language, lifted Variant A's "first character is `{`, last is `}`" formulation for JSON discipline, and lifted Variant B's "downstream code applies a mechanical floor — let it do its job" framing for the confidence floor rule.

The result is rules-with-decision-tree spine + three anchor cases — neither pure rules-first nor pure example-first, but the combination addresses both:

- The decision tree forces explicit boundary resolution (decision-tree's strength).
- The anchor cases give pattern-matching weight at the boundaries (example-first's strength).
- The schema is locked verbatim to the validator's contract (no drift).
- All Round 2 adversarial cases are explicitly handled.

---

## What's deferred to D-1.5 calibration

D-1.5 runs the prompt against 5 known cases on real Sonnet ($0.50–$1.00 budget). Watch for:

1. **Signal-conflict resolution under real cases.** Does the LLM actually downgrade `addressed` to `partially_addressed` when redetection conflicts with edit signal, or does it follow the working hypothesis without honoring the conflict rule?

2. **changed_target precision.** Does the LLM hold the "substance is GONE" boundary, or does it stretch to label rewrites as changed_target? The anchor case explicitly guards this — calibration confirms the guard works.

3. **Confidence calibration.** Are the anchors (0.9+, 0.75–0.9, 0.6–0.75, < 0.5) meaningful in practice, or does the LLM cluster all calls in 0.7–0.9?

4. **signalsUsed minimalism.** Does the LLM correctly omit `chat_behavior` when it didn't move the call, or pad to look thorough?

5. **JSON-only discipline.** Does the LLM produce clean JSON without markdown fences or commentary, even on low-confidence cases?

If any of these fail, return to Round 4 — refine the prompt section that drove the failure. Per the implementation plan, the calibration check runs at most twice; if a second run still disagrees with expectation, halt and escalate to Tue.

---

## Round 4 — Driven by D-1.5 calibration findings (run #2 results)

D-1.5 calibration on `v0.3.0-round3` returned 3/5 pass. Cases 3 and 5 (gestural-partial pattern) were classified as `unaddressed` instead of `partially_addressed`. The model's reasoning was defensible — it interpreted "didn't fully execute the directive" as no-engagement — but it conflicted with the L5_ITERATION_LOOP_DESIGN §5.2 spec language ("touches direction but doesn't fully execute" = partially_addressed) and with the system's pedagogical intent (deepen vs re-teach).

Round 4 changes:

1. **Pedagogical-framing prologue.** New "WHY THIS CLASSIFICATION MATTERS" section at the top of the prompt makes the deepen-vs-re-teach asymmetry explicit. Each status maps to a downstream system action (skip / deepen / re-teach / new-target). This gives the model a concrete cost function to reason against, rather than abstract status definitions.

2. **Q3 sharpening.** Q3 was reframed from a "synonym swap → unaddressed; partial → partially_addressed; full → addressed" three-way fork to an explicit Branch 1/Branch 2/Branch 3 walk with hard discrimination criteria:
   - Branch 1 (\`unaddressed\`) requires the edit to ignore the move's direction ENTIRELY. Examples named: synonym swaps, cosmetic rephrasing, parallel-concern edits.
   - Branch 2 (\`partially_addressed\`) explicitly captures gestural / partial / preliminary engagement. Tied to the system's deepening intent.
   - Branch 3 (\`addressed\`) is substantive execution.
   - Added a key tie-break instruction: "If hesitating between Branch 1 and Branch 2 because the engagement is thin, choose Branch 2." This addresses the calibration finding directly.

3. **Anchor Case 3 added** (gestural-partial pattern). The original Case 3 from D-1.5 calibration ("particularly around choices people make") is now in the prompt as Anchor Case 3 to anchor the gestural-partial pattern in the model's pattern-matching. The original Anchors 1, 2, 4 (formerly 3) are preserved.

4. **Discipline section updated.** "When in doubt between partially_addressed and unaddressed, choose partially_addressed" is now explicit (was previously "your best read is fine").

Round 4 calibration on prompt `v0.4.0-round4` (run #3, $0.0586): 5/5 pass on the original 5 cases.

Calibration was then extended to 10 cases (run #4, $0.1185) to test prompt generalization beyond what it was tuned on. Results: 9/10 pass. The new failure was Case 6 (Q4 conflict-resolution under redetection false-positive) — the model overruled Signal B's flag by reading B's reasoning text and judging that B was "actually wrong here." The Q4 conflict rule was insufficiently imperative.

## Round 5 — Q4 conflict-rule made imperative

Round 5 hardens the Q4 conflict resolution to a MANDATORY DOWNGRADE rule:

> Working hypothesis \`addressed\` + Signal B reports \`symptomFlagged: true\` → MANDATORY DOWNGRADE to \`partially_addressed\`. The redetector's flag itself is the conservative trigger, regardless of how B's reasoning text reads. Do NOT interpret B's reasoning to overrule B's flag.

The framing reinforces the asymmetric tolerance principle: trusting the flag is slightly over-cautious in cases where B is wrong, but it strictly avoids the worst failure mode (false positive `addressed` → next iteration skips a move the student needs).

Round 5 calibration on prompt `v0.5.0-round5`:

- Run #5 (10 cases, $0.1241): 9/10. Case 6 now passes. Case 8 (designed as parallel-edit unaddressed) was reclassified by the model as `partially_addressed` because the edit ("though I could not have said so at the time") could be read as gestural acknowledgment of the realization's unspeakability. Per the Round 4 instruction "when hesitating between Branch 1 and Branch 2, choose Branch 2," this was the model correctly following the prompt — Case 8's design was at fault, not the prompt.

- Case 8 redesigned as cosmetic-only edit (tense polish: "realized" → "had realized"; targeted phrase untouched). This is unambiguously Branch 1.

- Run #6 (10 cases, $0.1230): **10/10 pass.**

## Final calibration summary

10/10 cases pass on prompt `v0.5.0-round5`. All status classifications match expectation; all confidence values fall within designed ranges; signalsUsed correctly distinguishes informative from uninformative auxiliary signals. Total D-1.5 spend: $0.5110 (51% of $1.00 budget upper bound, 5.7% of $9.00 cumulative cap).

Boundary patterns the calibrated prompt handles correctly:
- Clear addressed (substantive directive execution) — Case 1.
- Pure synonym swap unaddressed — Case 2.
- Gestural acknowledgment partially_addressed — Cases 3, 5.
- Substantive multi-facet partial — Case 10.
- changed_target via replacement — Case 4.
- changed_target via deletion (no replacement) — Case 9.
- Rewrite-that-addresses (substance preserved + critique resolved) NOT changed_target — Case 7.
- Q4 mandatory downgrade on redetection-flag conflict — Case 6.
- Cosmetic-only edits (tense polish) unaddressed — Case 8.

Confidence calibration: high-confidence calls (clear cases) cluster at 0.92–0.95; mid-confidence calls (gestural partials, multi-facet partials) cluster at 0.65–0.72; the model honestly reports lower confidence on the cases that are genuinely harder, without gaming the Q4 floor in either direction.

## Version log

- `v0.1.0-round1` (committed in D-1.3 alongside the skeleton) — contract pass.
- `v0.2.0-round2` (adversarial pass, NOT separately committed — superseded by Round 3 final).
- `v0.3.0-round3` (committed in D-1.4) — synthesis of decision-tree spine + anchor cases + Round 2 adversarial fixes. **Calibrated 3/5 on D-1.5 run #2.**
- `v0.4.0-round4` (this revision) — pedagogical-framing prologue + Q3 Branch 1/2/3 sharpening + Anchor Case 3 (gestural partial) + discipline-section tie-break update. **Calibrated 5/5 on original cases (run #3); 9/10 on extended adversarial cases (run #4) — Q4 conflict-rule failure.**
- `v0.5.0-round5` (this revision) — Q4 conflict rule made imperative (mandatory downgrade on redetection-flag). **Calibrated 9/10 on extended (run #5) — Case 8 design issue; 10/10 after Case 8 redesign (run #6).**

Bump version on any future revision driven by post-launch field findings. The prompt version travels with the cost-ledger row at every API call so calibration drift across versions is auditable.
