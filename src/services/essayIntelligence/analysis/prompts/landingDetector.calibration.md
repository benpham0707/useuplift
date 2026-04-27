# Landing Detector — D-1.5 Calibration Output

> **Run date:** 2026-04-27T12:15:07.167Z
> **Model:** `claude-sonnet-4-5-20250929`
> **Prompt version:** `v0.3.0-round3`
> **Cases:** 5
> **Passed (status + confidence + signals):** 3/5
> **Total cost:** $0.0432 (cumulative build cap: $0.0868 of $9.00)

Per L5_IMPLEMENTATION_PLAN §D-1.5: 5 known cases run against real Sonnet, outputs compared to implementer expectations. The companion file `landingDetector.RATIONALE.md` documents the prompt revisions; this file documents the empirical validation outcome.

## Summary

| Case | Expected status | Got | Confidence (got / range) | Signals match | Pass |
|---|---|---|---|---|---|
| case-1-clear-addressed | `addressed` | `addressed` | 0.92 / [0.85, 1] | ✓ | ✓ |
| case-2-clear-unaddressed-synonym | `unaddressed` | `unaddressed` | 0.88 / [0.75, 1] | ✓ | ✓ |
| case-3-ambiguous-partial | `partially_addressed` | `unaddressed` | 0.88 / [0.55, 0.9] | ✓ | ✗ |
| case-4-changed-target | `changed_target` | `changed_target` | 0.92 / [0.75, 1] | ✓ | ✓ |
| case-5-low-confidence | `partially_addressed` | `unaddressed` | 0.88 / [0, 0.85] | ✓ | ✗ |

## Per-case detail

### case-1-clear-addressed

**Description:** Clear `addressed` — substantive engagement with directive.

**Rationale:** The move asked the student to name what their growth cost. The edit replaces an abstract claim ("I had grown into someone new") with concrete tradeoffs (no longer calling mother on Sundays without flinching; the easy self gone). This is exactly what the directive asked for; addressed should be unambiguous.

**Expected:** status=`addressed`, confidence ∈ [0.85, 1], must list `edit_vs_critique`, `redetection`.

**Input — prior taught move:**
```text
Move id: M-1-2-A-1
Location: P2, S4
Teaching mode: awareness
Content: The paragraph claims growth but never names what was traded for it. Show what the growth cost — what was given up, what relationship shifted, what version of yourself is gone. Concrete losses make growth credible.
```
**Input — edit (significance: significant):**
```text
Old: By the end of that summer, I had grown into someone new.
New: By the end of that summer, I could no longer call my mother on Sundays without flinching first — the easy version of me was gone, and I did not entirely want her back.
```
**Signal B (re-detection):** symptomFlagged=false; Concrete cost named (relationship shift); growth is now embodied.


**Output:**
```json
{
  "status": "addressed",
  "confidence": 0.92,
  "reasoning": "The edit executes the directive fully. Old text claimed growth abstractly ('grown into someone new'). New text names the specific cost: relationship with mother now requires emotional preparation ('flinching first'), and identifies what was lost ('the easy version of me'). The move asked for concrete losses to make growth credible; the revision provides exactly that — a shifted relationship and a named version of self that's gone.",
  "signalsUsed": [
    "edit_vs_critique",
    "redetection"
  ]
}
```
**Match:** status ✅ (got `addressed`) · confidence ✅ (0.92) · signalsUsed ✅ (edit_vs_critique, redetection)
**Duration:** 5152ms · **Cumulative cost after this case:** $0.0523 (Δ $0.0087)

---

### case-2-clear-unaddressed-synonym

**Description:** Clear `unaddressed` — synonym swap leaves vacuity intact.

**Rationale:** The move flagged "deeply meaningful" as doing no work and asked for the actual meaning. The student swapped synonyms ("profoundly significant") — same hollow claim, different words. Critique was about vacuity, not word choice; the directive was not executed. Anchor Case 2 from the prompt.

**Expected:** status=`unaddressed`, confidence ∈ [0.75, 1], must list `edit_vs_critique`.

**Input — prior taught move:**
```text
Move id: M-1-3-A-2
Location: P3, S1
Teaching mode: consequence
Content: The phrase "deeply meaningful" is doing no work. The reader cannot tell what the conversation actually was. Replace the abstraction with the specific exchange or moment that carried the meaning — what was said, what landed, what shifted.
```
**Input — edit (significance: minor):**
```text
Old: The conversation was deeply meaningful.
New: The conversation was profoundly significant.
```
**Signal B (re-detection):** symptomFlagged=true; Same vacuous claim with synonyms; meaning is still not shown.


**Output:**
```json
{
  "status": "unaddressed",
  "confidence": 0.88,
  "reasoning": "The student replaced 'deeply meaningful' with 'profoundly significant' — a synonym swap that preserves the exact abstraction the move critiqued. The directive was to replace the vacuous phrase with specific content (what was said, what landed), not to find a different vacuous phrase. The underlying issue remains intact.",
  "signalsUsed": [
    "edit_vs_critique",
    "redetection"
  ]
}
```
**Match:** status ✅ (got `unaddressed`) · confidence ✅ (0.88) · signalsUsed ✅ (edit_vs_critique, redetection)
**Duration:** 7730ms · **Cumulative cost after this case:** $0.0605 (Δ $0.0082)

---

### case-3-ambiguous-partial

**Description:** Ambiguous — directionally right, execution thin → partially_addressed.

**Rationale:** The move asked the student to anchor the thesis to the specific decision the essay argues about. The edit acknowledges "choices" but stays abstract ("choices people make"). Direction is right (toward specificity); execution is incomplete (no specific decision named). Should be partially_addressed; redetection still flags lower-severity vagueness.

**Expected:** status=`partially_addressed`, confidence ∈ [0.55, 0.9], must list `edit_vs_critique`.

**Input — prior taught move:**
```text
Move id: M-1-0-A-3
Location: P0, S0
Teaching mode: action
Content: The thesis is abstract. "Complexities of modern identity" could open any essay. Anchor it to the specific decision your essay argues about — the choice you actually examine, the moment you actually defend or interrogate.
```
**Input — edit (significance: minor):**
```text
Old: This essay will explore the complexities of modern identity.
New: This essay will explore the complexities of modern identity, particularly around choices people make.
```
**Signal B (re-detection):** symptomFlagged=true; Slightly more specific but "choices people make" is still abstract; no specific decision named.


**Output:**
```json
{
  "status": "unaddressed",
  "confidence": 0.88,
  "reasoning": "The edit appends 'particularly around choices people make' but does not anchor to a specific decision. The move asked for the actual choice examined; the new text remains abstract—'choices people make' could still open any identity essay. This is a surface addition that restates the problem rather than executing the directive to name the specific decision.",
  "signalsUsed": [
    "edit_vs_critique",
    "redetection"
  ]
}
```
**Match:** status ❌ (got `unaddressed`) · confidence ✅ (0.88) · signalsUsed ✅ (edit_vs_critique, redetection)
**Duration:** 4040ms · **Cumulative cost after this case:** $0.0688 (Δ $0.0083)

---

### case-4-changed-target

**Description:** changed_target — original substance gone, not rewritten.

**Rationale:** The move flagged a contradiction between a chess-club anecdote (P3) and a claim in P1 that the student avoids competition. The edit deletes the chess paragraph entirely and replaces it with an unrelated food-bank passage. The original substance the move targeted is GONE — the chess anecdote no longer exists to be reconciled with the P1 claim. This is changed_target, NOT addressed (the contradiction was not resolved; it was removed by deletion). Anchor Case 3 from the prompt.

**Expected:** status=`changed_target`, confidence ∈ [0.75, 1], must list `edit_vs_critique`.

**Input — prior taught move:**
```text
Move id: M-1-2-A-4
Location: P2, S0
Teaching mode: connection
Content: The chess-club anecdote in this paragraph contradicts the claim in P1 that you avoid competitive environments. Either the P1 framing needs adjustment, or the chess paragraph needs to be reframed in non-competitive terms (e.g., the camaraderie or strategy rather than the winning).
```
**Input — edit (significance: transformative):**
```text
Old: I trained for months for the regional chess tournament. When I won, I knew I belonged in that crowd — the smart kids, the ones who took ranking seriously.
New: I spent that semester volunteering at the Saturday food bank, learning the rhythm of stacking canned goods until my hands knew the shape of the boxes without thinking.
```
**Signal B (re-detection):** symptomFlagged=false; No competition framing remains; the original contradiction has no referent.

**Signal C (chat):** engaged=true, mood=neutral; "I cut the chess part — it didn't fit with what I wanted to say."


**Output:**
```json
{
  "status": "changed_target",
  "confidence": 0.92,
  "reasoning": "The original chess tournament anecdote—the substance the move critiqued for contradicting the P1 anti-competition claim—has been completely removed and replaced with unrelated content about food bank volunteering. The move's premise (resolving a contradiction between P1 and the chess paragraph) no longer has a referent in the text. This is not a rewrite that addresses the contradiction; it is deletion of the contradictory material.",
  "signalsUsed": [
    "edit_vs_critique",
    "redetection",
    "chat_behavior"
  ]
}
```
**Match:** status ✅ (got `changed_target`) · confidence ✅ (0.92) · signalsUsed ✅ (edit_vs_critique, redetection, chat_behavior)
**Duration:** 5884ms · **Cumulative cost after this case:** $0.0779 (Δ $0.0091)

---

### case-5-low-confidence

**Description:** Low-confidence — gestural addition; partially_addressed at <0.7 confidence.

**Rationale:** The move asked the student to push past summary to a claim they could not have made on page 1. The student left the summary intact ("perseverance, empathy, leadership") and tacked on a vague reflection ("maybe that's why I keep coming back to them"). This is gestural — direction is correct but the claim is vague. Expected: partially_addressed at confidence < 0.7. Even if the model returns addressed, the Q4 floor downgrades it; calibration verifies the model reports honest sub-0.7 confidence rather than gaming over the floor.

**Expected:** status=`partially_addressed`, confidence ∈ [0, 0.85], must list `edit_vs_critique`.

**Input — prior taught move:**
```text
Move id: M-1-5-A-5
Location: P5, S0
Teaching mode: action
Content: The conclusion restates the intro. "Perseverance, empathy, leadership" is a list the reader could derive from page 1. Push past summary to a claim about these qualities you could not have made on page 1 — what they cost, what they reveal that you did not see at the start, what you no longer believe.
```
**Input — edit (significance: minor):**
```text
Old: These three lessons — perseverance, empathy, leadership — taught me who I am.
New: These three lessons — perseverance, empathy, leadership — taught me who I am. And maybe that's why I keep coming back to them.
```
**Signal B (re-detection):** symptomFlagged=true; Summary still dominant; the added sentence is gestural reflection without a new claim.


**Output:**
```json
{
  "status": "unaddressed",
  "confidence": 0.88,
  "reasoning": "The student added a single sentence ('And maybe that's why I keep coming back to them') but did not execute the directive to push past summary to a claim about cost, revelation, or changed belief. The original list 'perseverance, empathy, leadership' remains unchanged, and the new sentence is a gestural reflection that does not advance beyond what could be derived from page 1. The move's critique was about the conclusion restating the intro; the edit leaves that structure intact.",
  "signalsUsed": [
    "edit_vs_critique",
    "redetection"
  ]
}
```
**Match:** status ❌ (got `unaddressed`) · confidence ❌ (0.88) · signalsUsed ✅ (edit_vs_critique, redetection)
**Duration:** 4600ms · **Cumulative cost after this case:** $0.0868 (Δ $0.0089)

---
