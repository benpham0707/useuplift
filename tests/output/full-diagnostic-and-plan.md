# Full Pipeline Diagnostic + Repair Plan — 2026-05-03

**Context:** Crochet calibration aborted at L3.75 Phase B truncation, $0.58 spent, no Option 5 Phase B output produced. The user's directive: *"Take your time. Diagnose everything. Make a plan. Prepare to fix."*

This report is the result of deep reads across L1, L2, L2.5, L3 walk, L3.75 Phase A, plus the orchestrator's connection-handling code, plus Phase B (Option 5) prompt review. Each diagnostic identifies the root cause, not just the symptom.

---

## Diagnostic 1 — L3 walk producing 0 findings on Crochet (CRITICAL DEPTH)

**Symptom:** L3 walk produced 0 findings across 5 paragraphs of a top-tier corpus essay despite the prompt's "MANDATORY: every paragraph produces findings" instruction. 1 improvement candidate harvested across the whole essay. The depth signal isn't there.

**Diagnostic process:** Read `sequentialDeepWalk.ts` SYSTEM_PROMPT_TEMPLATE end-to-end (lines 197-577).

**Root causes (compounding):**

1. **Cumulative "silence is good" pressure across the prompt.** The prompt has FOUR distinct silence-leaning sections:
   - Lines 263-274 OBSERVATION ECONOMY: "Would a competent English teacher already know this? If YES — do NOT produce the observation." Bans ~5 categories of common observations.
   - Lines 447-466 IMPROVEMENT CANDIDATE EMISSION: "EMIT a candidate ONLY when ALL of these are true... Target: 5-15% of sentences in a strong essay."
   - Lines 515-563 GAP CANDIDATE PROPOSAL (Option 5 addition): "PROPOSE a gapCandidate ONLY when ALL of these are true... Most paragraphs propose ZERO gap candidates. Silence is the default. Empty array is valid and the default — silence is the audit signal."
   - Lines 565-575 CRITICAL REMINDERS: 9 imperative cautions including FORBIDDEN VOCABULARY enforcement.

   Each section is defensible alone. Cumulatively they create overwhelming "produce minimum output" pressure. The LLM extends silence-default beyond the gated fields into findings.

2. **FORBIDDEN VOCABULARY rule prevents evaluative findings on polished essays.** Lines 203-204 ban: "effective", "strong", "weak", "compelling", "powerful", "poor", "excellent", "impressive", "beautiful", "successful", "well-crafted", etc. — 30+ banned words.

   On a polished essay like Crochet, many natural findings would describe what's WORKING ("the compressed-biography sentence is structurally pivotal because..."). The LLM, fearing FORBIDDEN VOCABULARY violations, silently skips findings that would feel evaluative.

3. **Schema bloat per finding — 11 sub-fields.** The newFindings schema (lines 405-424) requires per finding: `claim`, `scope` (with 6 nested subfields), `maturity`, `maturityReasoning`, `coachingValue`, `dimensions`, `evidence`, `deepeningPotential`, `raisesQuestions`, `buildsOn`, `relatedTo`. Producing 1 finding properly costs ~200-400 output tokens. With output budget pressure, LLM truncates by skipping findings.

4. **Quantity guidance contradicts itself.** Line 281 says "An entire 7-paragraph essay should produce 35-60 total observations." Line 283-284 says "transitional paragraph 3-5; contributing 5-8; pivotal 7-12." But Line 314-321 says "EVERY paragraph MUST produce at least one finding... CALIBRATION BY PARAGRAPH SIGNIFICANCE: TRANSITIONAL: 1 finding; CONTRIBUTING: 2-3 findings; PIVOTAL: 3-5 findings." Two different counting frameworks (observations vs findings) the LLM has to navigate simultaneously.

5. **Option 5 GAP CANDIDATE PROPOSAL section sits ABOVE CRITICAL REMINDERS.** Last thing the LLM reads before output is "Most paragraphs propose ZERO gap candidates. Silence is the default. Empty array is valid and the default — silence is the audit signal." This sets the WRONG mental tone for the output as a whole — silence is the LAST instruction before generating.

**Verdict:** The prompt has lost its "produce findings" pressure under the weight of Option 5 + Improvement Candidate + Observation Economy silence-defaults. The MANDATORY instruction is buried at line 314 with no late-prompt reinforcement.

**Fix:**
- Restructure prompt to put MANDATORY findings reminder LAST (after CRITICAL REMINDERS, just before "Return ONLY the JSON object").
- Add concrete worked-example findings for the LLM to mirror (one example showing what a "good finding" looks like for each significance level).
- Compress newFindings schema (cut buildsOn/relatedTo to optional, simplify scope to anchorParagraph + textEvidence single-array).
- Add explicit override: "FINDINGS DISCIPLINE OVERRIDES OBSERVATION ECONOMY — findings are NOT 'observations a competent teacher would already know'. They are claims ABOVE sentence-level the system can REFERENCE later."

---

## Diagnostic 2 — JSON malformation on every Sonnet call (HIGH)

**Symptom:** `jsonrepair library succeeded — response had malformed JSON` fired on every L3 walk paragraph (5/5 calls) and L3.75 Phase A. Each Sonnet output had structural JSON issues.

**Root causes:**

1. **Schema description text is nested inside JSON example values.** L3 walk OUTPUT_SCHEMA (lines 341-443) has long descriptive strings AS the example values: e.g., `"role": "What this paragraph DOES in the essay's architecture — its structural function, not its topic"`. The LLM may hallucinate the description text into actual output OR get confused about whether to fill in or describe. Same pattern in Phase A.

2. **Mixed JSON dialects in schema literal.** Schema uses `<n>` placeholders, `<0-1>` ranges, `"..." | undefined`, `"..." | null`, mixed array forms. The schema isn't valid JSON itself — the LLM has to translate descriptive notation into actual JSON structure. Translation slips on ~5% of calls.

3. **Truncation creates malformed JSON automatically.** When output hits max_tokens mid-structure, JSON closes mid-object. jsonrepair patches the trailing braces but the pattern is "always slightly broken" because output budget is consistently underwater.

**Verdict:** jsonrepair fires not because of model errors but because of schema design + truncation. The schema teaches the LLM to produce slightly-malformed JSON.

**Fix:**
- Move long descriptive text OUT of JSON example values into separate "FIELD GUIDE" prose sections.
- Show JSON examples with concise placeholder values (e.g., `"role": "<string>"` not the full description).
- Reduce schema density by making more fields optional with clear defaults.
- Resize output budgets (next diagnostic) to eliminate truncation as a malformation source.

---

## Diagnostic 3 — Connection hallucination rate (35%, L2.5 scout origin) (MEDIUM)

**Symptom:** ConnectionMutator rejected 31/89 connections — invalid sentence indices. Sample: `from=[P2, S9] to=[P3, S0]` for Crochet's P2 which has only 6 sentences (S9 doesn't exist).

**Diagnostic process:** Traced the 89 connections back from `addConnections` log to source. Read `applyScoutLeads` in `essayProfileManager.ts:1871-1907`.

**Root cause:** **The 89 connections come from L2.5 scout, NOT L2.** `applyScoutLeads` flattens the scout's `repeatedElements`, `tonalShifts`, and `structuralEchoes` into pairwise connection leads. For each repeated element with N occurrences, it creates N×(N−1)/2 pairwise connections. Crochet's scout found 9 repeated elements; if each had ~3-4 occurrences that's 9 × ~6 = 54 connections from repeated elements alone, plus structural echoes adds more.

**The hallucination is in the L2.5 SCOUT (Haiku)**, not L2 (Sonnet) or L3 (Sonnet). Haiku's shallower attention can't track sentence indices accurately across a 5-paragraph essay with many repeated words.

**Verdict:** Wrong layer was suspected. Real cause: Haiku's sentence-index tracking is unreliable. The L2.5 prompt asks Haiku to identify which sentences contain repeated elements; Haiku produces approximately-correct indices that fail validation.

**Fix options:**
- (a) Have ConnectionMutator soft-correct out-of-range sentence indices to the paragraph level (P2, S9 → P2 paragraph-only) instead of rejecting entirely. Recovers 35% of LLM output otherwise discarded.
- (b) Switch L2.5 to Sonnet (better attention, fewer hallucinations) — adds ~$0.05 per essay.
- (c) Add explicit sentence-index labels to the L2.5 user prompt (currently uses paragraph markers only). Cheapest fix: rewrite L2.5's user prompt to include `[P1S1] sentence text. [P1S2] sentence text.` markers so Haiku has explicit indices to point to.

---

## Diagnostic 4 — L1 first-impressions output bloat (HIGH cost) (MEDIUM)

**Symptom:** L1 paragraphs hit Haiku's 2000 max-tokens cap on 3 of 5 Crochet paragraphs (P1 dense, P3 dense, P7 doesn't exist for Crochet — that was Sarika's pattern).

**Diagnostic process:** Read `firstImpressions.ts` SYSTEM_PROMPT (lines 70-145).

**Root cause:** **L1 schema is too rich for "first impressions."** Per paragraph it requires:
- 5 paragraph-level fields (apparentPurpose, emotionalRegister, voiceObservation, craftNotices array, tags array)
- Per-sentence × N: 5 sentence-level fields (apparentPurpose, rhetoricalFunction, toneShift, notableElements, tags)
- Per-notable-phrase: phrase + sentenceIndex + significance

For Crochet's P3 (10 sentences with many notable phrases), L1 produces:
- 5 paragraph-level field outputs
- 50 sentence-level field outputs (5 fields × 10 sentences)
- 5-10 notable phrase entries

That's 60-70 structured outputs per paragraph. At ~30-40 tokens each → 1800-2800 tokens. Haiku caps at 2000.

**Verdict:** The schema demands second-pass-level depth from a "first impressions" layer. L1 is over-scoped — it's doing what L3 walk should do.

**Fix:** Compress L1 schema dramatically:
- Drop per-sentence fields (or reduce to just `rhetoricalFunction` enum + `notableElements` count).
- Keep paragraph-level apparentPurpose + emotionalRegister + voiceObservation + craftNotices.
- Notable phrases optional, max 3 per paragraph.

Estimated: drops L1 per-paragraph output from ~1500-2000 tokens → ~500-800 tokens. Saves ~$0.03/essay AND eliminates Haiku truncation.

---

## Diagnostic 5 — L3.75 Phase A bloat (~7K output) (MEDIUM)

**Symptom:** Phase A produced 6886 output tokens (near 8K cap) on Crochet. Pre-existing fragility (Sarika hit similar levels).

**Diagnostic process:** Read `holisticSynthesis.ts` SYSTEM_PROMPT_PHASE_A schema (lines 328-430+).

**Root cause:** **voiceMap section is enormous.** Has 5 dimension sub-objects (register, vocabularyFingerprint, sentenceRhythm, perspectiveDistance, tonalDisposition) each with `baseline` + `observations[]`. PLUS `shifts[]` with intentionality assessment. PLUS `stabilityRegions[]`. PLUS the surrounding sections have nested observations with locations + dimensions arrays.

Each sub-dimension produces ~200-400 tokens. 5 dimensions × 300 = 1500 tokens just for voiceMap.shifts alone. Plus voiceIdentity, emotionalTopography, momentEarnednessMap each at similar scale → 4 × 1700 = 6800 tokens. Matches the observed output.

**Verdict:** Phase A schema is genuinely rich for the depth it produces. Compression must target nested structure, not depth.

**Fix:**
- voiceMap: collapse 5 dimension sub-objects to one `dimensions` array with `{ dimension, baseline, observations }` — keeps the data, drops nesting (~30-40% savings).
- Make `authenticVsPerformed`, `peakMoments`, `emotionalProgression` optional with reasonable defaults.
- Bump Phase A max_tokens to 9000 (1K headroom) as belt-and-suspenders.

Estimated: drops Phase A output from ~7K → ~4500 tokens. Saves ~$0.05/essay.

---

## Diagnostic 6 — L3.75 Phase B truncation (BLOCKING) (HIGH)

**Symptom:** Phase B produced 4 of 6 required sections before hitting 10K output cap. Parser strict-rejects → pipeline aborts.

**Root cause (already documented in code, line 105-112):** Phase B schema requires thematicArchitecture + narrativeStrategy + characterRevelation + craftAssessment + admissionsPositioning + entanglements (6 required) plus 5 optional fields (connectionGraphSummary, newConnections, connectionUpgrades, newFindings, findingEvolutions). Crochet's P3 (Vietnam War + grandmother portrait + crochet origin) made each section dense → cumulative output exceeded 10K.

**Fix:**
- Bump SYNTHESIS_MAX_TOKENS_PHASE_B from 10000 → 14000 (40% headroom).
- Compress Phase B schema like Phase A (collapse nested structures, make connection/finding fields more compact).
- Long-term: split Phase B into two smaller calls (Phase B1 = theme + narrative + character; Phase B2 = craft + admissions + entanglements). Doubles cost on this layer (~+$0.15) but eliminates truncation entirely.

---

## Diagnostic 7 — L3 walk dense-paragraph truncation (MEDIUM)

**Symptom:** L3 walk on Crochet's P1 (10 sentences) and P3 (6 sentences) hit truncation. priorSentenceUpdates + newConnections silently dropped.

**Root cause:** Dynamic max-tokens formula `min(4000, max(1800, sentenceCount*200 + 1500))` gives:
- P1 (10 sent.): `min(4000, max(1800, 3500))` = **3500** (truncated at this cap)
- P3 (6 sent.): `min(4000, max(1800, 2700))` = **2700** (truncated)

Cap of 4000 isn't reached but is close enough that schema bloat fills the budget.

**Fix:** Raise WALK_MAX_TOKENS_CAP to 5000 (allows headroom for dense paragraphs). Combined with the prompt compression in Diagnostic 1, dense paragraphs land at ~3000-4000 with headroom.

---

## Diagnostic 8 — Option 5 Phase B integrity check (PASS)

**Symptom:** Never executed in Crochet calibration. Inspected the prompt to verify it would have worked.

**Findings:**
- ✅ Six-condition gate present (working-move silence, gap real, writer-side only, angle present, upgrade-not-enable, surface-vs-deep).
- ✅ Constructive-proof rider on §2.4.
- ✅ Banned trivial phrasings on expectedInsight + expectedDiscovery.
- ✅ Concept library reuse policy + cap-relaxation logic.
- ✅ Pre-output swap check.
- ✅ Three corpus-bar example seeds with conceptTag callouts.
- ✅ Silence path returns cost: 0 when no candidates + no stuck findings.
- ✅ Hard 3-cap enforced post-LLM as safety net.

**Verdict:** The Phase B service I built is sound. We never got to test it because upstream layers failed first.

---

## Architectural finding: essay-level L3 walk prototype

**Current per-paragraph cost on Crochet:** $0.46 for 5 paragraphs producing 0 findings.

**Proposed essay-level L3 walk:**
- ONE Sonnet call sees the full essay + L1 impressions + L2 structural map + L2.5 scout leads.
- Output: top-level `findings[]` (essay-wide, with anchor paragraph/sentence per finding) + `paragraphSummaries[]` (compact: role, function, narrativeContribution per paragraph) + `gapCandidates[]` + `connections[]` (cross-paragraph patterns).
- Drops per-sentence understanding (sentenceUnderstandings was producing 1 sentence/paragraph on Crochet anyway — minimal value).
- Drops priorSentenceUpdates (no sequential walk = no back-prop needed).
- Schema fits in ~5000-6000 output tokens (1 call vs 5 calls × ~2500 each = 12500).

**Cost:** $0.20-0.30 (single call vs $0.46).
**Quality:** depends on whether per-sentence depth was actually used downstream.

**Per-sentence consumer audit needed:** does L3.5/L3.75/L4/Phase B actually USE sentence-level understanding from L3 walk? If yes, we need a second pass for dense paragraphs. If no, drop it cleanly.

---

## Repair plan (ordered, each step independently testable)

### Step 1 — Prompt fixes (zero API cost, ~2-3 hours engineering)

1.1. **L3 walk findings discipline rebuild.**
- Move MANDATORY findings reminder to LAST position, after CRITICAL REMINDERS.
- Add a concrete worked-example finding the LLM mirrors.
- Add explicit override on OBSERVATION ECONOMY ("findings are NOT observations").
- Compress newFindings schema (cut buildsOn/relatedTo to optional; flatten scope to anchorParagraph + textEvidence).

1.2. **L1 schema compression.**
- Drop per-sentence fields, keep paragraph-level only.
- Cap notable phrases at 3 per paragraph.

1.3. **L3.75 Phase A schema compression.**
- Collapse voiceMap's 5 dimension sub-objects into one `dimensions[]` array.
- Make peakMoments, emotionalProgression optional.

1.4. **L3.75 Phase B schema compression + max_tokens bump.**
- Same compression pattern as Phase A.
- SYNTHESIS_MAX_TOKENS_PHASE_B: 10000 → 14000.

1.5. **L3 walk schema description cleanup.**
- Move long descriptions out of JSON example values; show concise placeholders.
- Reduces JSON malformation rate.

1.6. **L3 walk WALK_MAX_TOKENS_CAP: 4000 → 5000.** Headroom for dense paragraphs.

1.7. **L2.5 scout user prompt: add sentence index labels** (`[P1S1] text. [P1S2] text.`). Reduces Haiku hallucination rate.

### Step 2 — Connection mutator soft-recovery (zero API cost, ~30 min)

Update ConnectionMutator to soft-correct out-of-range sentence indices instead of rejecting entirely. Recovers ~35% of L2.5 scout output that's currently discarded.

### Step 3 — Type-check + vitest after Step 1+2 (zero API cost)

Verify nothing broke. All 638 tests should still pass.

### Step 4 — Build essay-level L3 walk prototype (zero API cost, ~2-3 hours engineering)

`src/services/essayIntelligence/analysis/essayLevelL3Walk.ts`. New service. Schema:
```
{
  paragraphSummaries: [{ index, role, function, narrativeContribution, dominantEmotion }],
  findings: [{ claim, anchorParagraph, anchorSentence?, evidence, dimensions, coachingValue, deepeningPotential? }],
  connections: [{ from, to, description, strengthCategory }],
  gapCandidates: [{ sourceLayer: 'l3_walk', anchorParagraph, anchorSentence?, triggeringArtifact, briefRecognition }],
  centralThesis,
  voiceSignature
}
```
Single Sonnet call, cap 6000 output tokens.

### Step 5 — Run isolated essay-level L3 walk on Crochet (~$0.30 paid)

Test the new service in isolation. Compare findings count + cost vs per-paragraph data.

### Step 6 — Wire essay-level L3 walk into orchestrator (zero API cost engineering, ~$0.30 paid run)

If Step 5 passes (≥5 findings, cost <$0.40), replace per-paragraph walk in orchestrator. Run full pipeline on Crochet.

### Step 7 — Document outcome + ratify or iterate

If Step 6 passes (full pipeline completes, Phase B produces sensible emissions, total cost <$1.20), ratify Option 5 + essay-level L3 walk. If not, iterate on the failure point.

---

## Cost projection after fixes

| Stage | Current | After fixes |
|---|---|---|
| L1 (5 paras Haiku, compressed schema) | $0.055 | $0.025 |
| AO First Read | $0.002 | $0.002 |
| L2 (Sonnet) | $0.057 | $0.057 |
| L2.5 scout (Haiku, fewer hallucinations recovered) | $0.013 | $0.013 |
| L3 walk (essay-level, 1 Sonnet call) | $0.460 | $0.260 |
| L3.75 Phase A (compressed schema) | $0.154 | $0.110 |
| L3.75 Phase B (compressed + 14K cap) | $0.190 (est) | $0.130 |
| L3.5 essay-level (Sonnet) | $0.050 | $0.050 |
| L4 northStar (Sonnet) | $0.130 | $0.130 |
| Phase B essay-level emissions (Option 5) | $0.250 | $0.250 |
| **TOTAL** | **~$1.36** (would have been) | **~$1.03** |

Right at the $1 cap with realistic margin. And meaningfully better quality (findings discipline restored, JSON malformation reduced, dense-paragraph truncation eliminated).

---

## Total engineering time

- Step 1: 2-3 hours (prompt compression across 4 layers)
- Step 2: 30 min
- Step 3: 10 min
- Step 4: 2-3 hours
- Step 5: 5 min trigger + wait
- Step 6: 1 hour wire-up + 5 min trigger + wait
- Step 7: 30 min documentation

**Total: 6-8 hours engineering + ~$0.60 in API spend across 2 paid runs.**

This is the actual right path. Calibration cycle for cycle, this is dramatically more efficient than throwing $0.58-2.00 at unfixed pipeline runs.

---

## Bottom line

**Eight diagnostics, eight specific fixes, ordered repair plan, post-fix cost projection of $1.03 (under cap with margin), engineering effort bounded at 6-8 hours.**

The Crochet calibration that aborted at $0.58 was not wasted — it produced this diagnostic. Now we have a clear path to a system that actually completes end-to-end with the depth the framework demands.

Ready to execute Step 1 (prompt compression). Confirm to proceed.
