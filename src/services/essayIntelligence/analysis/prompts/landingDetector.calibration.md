# Landing Detector — D-1.5 Calibration Output

> **Run date:** 2026-04-27T14:40:04.647Z
> **Model:** `claude-sonnet-4-5-20250929`
> **Prompt version:** `v0.5.0-round5`
> **Cases:** 10
> **Passed (status + confidence + signals):** 10/10
> **Total cost:** $0.1230 (cumulative build cap: $0.5110 of $9.00)

Per L5_IMPLEMENTATION_PLAN §D-1.5: 5 known cases run against real Sonnet, outputs compared to implementer expectations. The companion file `landingDetector.RATIONALE.md` documents the prompt revisions; this file documents the empirical validation outcome.

## Summary

| Case | Expected status | Got | Confidence (got / range) | Signals match | Pass |
|---|---|---|---|---|---|
| case-1-clear-addressed | `addressed` | `addressed` | 0.92 / [0.85, 1] | ✓ | ✓ |
| case-2-clear-unaddressed-synonym | `unaddressed` | `unaddressed` | 0.92 / [0.75, 1] | ✓ | ✓ |
| case-3-ambiguous-partial | `partially_addressed` | `partially_addressed` | 0.65 / [0.55, 0.9] | ✓ | ✓ |
| case-4-changed-target | `changed_target` | `changed_target` | 0.95 / [0.75, 1] | ✓ | ✓ |
| case-6-addressed-with-redetection-conflict | `partially_addressed` | `partially_addressed` | 0.72 / [0.5, 0.9] | ✓ | ✓ |
| case-7-rewrite-that-addresses-not-changed-target | `addressed` | `addressed` | 0.92 / [0.75, 1] | ✓ | ✓ |
| case-8-unaddressed-cosmetic-only | `unaddressed` | `unaddressed` | 0.95 / [0.75, 1] | ✓ | ✓ |
| case-9-changed-target-deletion | `changed_target` | `changed_target` | 0.95 / [0.7, 1] | ✓ | ✓ |
| case-10-strong-partial-multifaceted | `partially_addressed` | `partially_addressed` | 0.72 / [0.6, 0.95] | ✓ | ✓ |
| case-5-low-confidence | `partially_addressed` | `partially_addressed` | 0.72 / [0, 0.85] | ✓ | ✓ |

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
  "reasoning": "The edit substantively executes the directive. Old text claimed growth abstractly ('grown into someone new'). New text names the specific cost: relationship shift with mother ('could no longer call...without flinching'), identifies what was lost ('easy version of me'), and acknowledges ambivalence ('did not entirely want her back'). The move asked for concrete losses to make growth credible; the revision delivers exactly that.",
  "signalsUsed": [
    "edit_vs_critique",
    "redetection"
  ]
}
```
**Match:** status ✅ (got `addressed`) · confidence ✅ (0.92) · signalsUsed ✅ (edit_vs_critique, redetection)
**Duration:** 3869ms · **Cumulative cost after this case:** $0.4004 (Δ $0.0124)

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
  "confidence": 0.92,
  "reasoning": "The edit replaced 'deeply meaningful' with 'profoundly significant' — a pure synonym swap that leaves the underlying vacuity intact. The move explicitly asked to replace the abstraction with the specific exchange or moment (what was said, what landed, what shifted). The new text provides no such specificity; it merely substitutes one empty descriptor for another. Signal B confirms the symptom remains flagged.",
  "signalsUsed": [
    "edit_vs_critique",
    "redetection"
  ]
}
```
**Match:** status ✅ (got `unaddressed`) · confidence ✅ (0.92) · signalsUsed ✅ (edit_vs_critique, redetection)
**Duration:** 3277ms · **Cumulative cost after this case:** $0.4126 (Δ $0.0122)

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
  "status": "partially_addressed",
  "confidence": 0.65,
  "reasoning": "The student added 'particularly around choices people make,' showing recognition of the move's directive to anchor to a specific decision. However, the execution is thin—'choices people make' remains abstract and does not name the actual decision the essay examines. The redetection confirms the symptom persists.",
  "signalsUsed": [
    "edit_vs_critique",
    "redetection"
  ]
}
```
**Match:** status ✅ (got `partially_addressed`) · confidence ✅ (0.65) · signalsUsed ✅ (edit_vs_critique, redetection)
**Duration:** 3094ms · **Cumulative cost after this case:** $0.4245 (Δ $0.0119)

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
  "confidence": 0.95,
  "reasoning": "The original chess tournament anecdote (the substance the move critiqued) has been completely removed and replaced with unrelated content about food bank volunteering. The move's premise—resolving a contradiction between P1's 'avoid competitive environments' claim and the chess tournament narrative—no longer has a referent in the text. This is not a rewrite or reframing of the chess content; it is wholesale replacement with different material.",
  "signalsUsed": [
    "edit_vs_critique",
    "redetection",
    "chat_behavior"
  ]
}
```
**Match:** status ✅ (got `changed_target`) · confidence ✅ (0.95) · signalsUsed ✅ (edit_vs_critique, redetection, chat_behavior)
**Duration:** 6782ms · **Cumulative cost after this case:** $0.4372 (Δ $0.0127)

---

### case-6-addressed-with-redetection-conflict

**Description:** addressed substance + redetection false positive → Q4 conflict rule should downgrade to partially_addressed.

**Rationale:** The edit fully executes the directive (concrete loss named). But the upstream re-detection mistakenly still flags the symptom (false positive — possibly redetector sees lingering "abstract" word). Q4 conflict rule: working hypothesis `addressed` + Signal B says still flagged → downgrade to `partially_addressed`. Tests the conflict resolution branch directly.

**Expected:** status=`partially_addressed`, confidence ∈ [0.5, 0.9], must list `edit_vs_critique`, `redetection`.

**Input — prior taught move:**
```text
Move id: M-1-2-A-6
Location: P2, S0
Teaching mode: awareness
Content: "I learned a lot" tells the reader you grew without showing what shifted. Replace with the specific lesson — what you now believe that you didn't before, what assumption broke.
```
**Input — edit (significance: significant):**
```text
Old: I learned a lot from that summer at the hospice.
New: I left the hospice no longer believing that comfort meant solving — sometimes it meant standing still while someone else's hands shook against mine and not naming it.
```
**Signal B (re-detection):** symptomFlagged=true; Re-detector flags lingering abstraction in "comfort meant solving"; the edit may not have fully landed.


**Output:**
```json
{
  "status": "partially_addressed",
  "confidence": 0.72,
  "reasoning": "The student replaced the vacuous 'I learned a lot' with a specific belief shift ('no longer believing that comfort meant solving'). This directly engages the directive to name what changed. However, the redetector flags 'comfort meant solving' as still abstract, indicating the execution is incomplete — the student gestured toward the lesson but didn't fully ground it in concrete terms.",
  "signalsUsed": [
    "edit_vs_critique",
    "redetection"
  ]
}
```
**Match:** status ✅ (got `partially_addressed`) · confidence ✅ (0.72) · signalsUsed ✅ (edit_vs_critique, redetection)
**Duration:** 3892ms · **Cumulative cost after this case:** $0.4494 (Δ $0.0122)

---

### case-7-rewrite-that-addresses-not-changed-target

**Description:** Substance reframed to resolve critique → addressed, NOT changed_target.

**Rationale:** The chess-club anecdote contradiction case again, but THIS time the student rewrites the chess paragraph to acknowledge competition was about camaraderie, not winning. The substance (chess anecdote) is still present; the contradiction is resolved by reframing. Per the prompt: changed_target requires substance to be GONE, not rewritten. This must be addressed.

**Expected:** status=`addressed`, confidence ∈ [0.75, 1], must list `edit_vs_critique`, `redetection`.

**Input — prior taught move:**
```text
Move id: M-1-2-A-7
Location: P2, S0
Teaching mode: connection
Content: The chess-club anecdote contradicts the claim in P1 that you avoid competitive environments. Either reframe the chess paragraph in non-competitive terms, or adjust the P1 framing.
```
**Input — edit (significance: significant):**
```text
Old: I trained for months for the regional chess tournament. When I won, I knew I belonged in that crowd — the smart kids, the ones who took ranking seriously.
New: I spent months at the chess club not because I cared about the tournament — I never made it past the first round — but because the long Saturday afternoons of analysis with Marcus and Priya were the only place I could think out loud without performing.
```
**Signal B (re-detection):** symptomFlagged=false; Chess substance preserved; competition framing reframed to camaraderie + thinking-aloud. Contradiction with P1 resolved.


**Output:**
```json
{
  "status": "addressed",
  "confidence": 0.92,
  "reasoning": "The student substantively executed the directive. The original text framed chess as competitive achievement ('won,' 'belonged,' 'ranking seriously'). The new text explicitly reframes chess in non-competitive terms ('not because I cared about the tournament,' 'never made it past the first round') and repositions the activity around intellectual camaraderie ('think out loud without performing'). This directly resolves the contradiction with P1's claim about avoiding competitive environments.",
  "signalsUsed": [
    "edit_vs_critique",
    "redetection"
  ]
}
```
**Match:** status ✅ (got `addressed`) · confidence ✅ (0.92) · signalsUsed ✅ (edit_vs_critique, redetection)
**Duration:** 3685ms · **Cumulative cost after this case:** $0.4620 (Δ $0.0126)

---

### case-8-unaddressed-cosmetic-only

**Description:** Cosmetic-only edit at location (tense polish) → true Branch 1 unaddressed.

**Rationale:** Move asks for the specific realization to be named. Student edits the location but ONLY changes tense ("realized" → "had realized") — zero engagement with the directive. The targeted vague phrase ("something important") is untouched. This is true Branch 1: the edit shows no recognition of the move's direction at all. Tests that the model distinguishes pure-cosmetic edits from gestural engagement.

**Expected:** status=`unaddressed`, confidence ∈ [0.75, 1], must list `edit_vs_critique`, `redetection`.

**Input — prior taught move:**
```text
Move id: M-1-1-A-8
Location: P1, S2
Teaching mode: action
Content: "I realized something important" tells without showing. Replace with the specific realization — what you now know, what shifted in your understanding, named concretely.
```
**Input — edit (significance: minor):**
```text
Old: After three weeks, I realized something important.
New: After three weeks, I had realized something important.
```
**Signal B (re-detection):** symptomFlagged=true; Tense polish only ("realized" → "had realized"). The vague phrase the move targeted is unchanged; the realization is still unnamed.


**Output:**
```json
{
  "status": "unaddressed",
  "confidence": 0.95,
  "reasoning": "The edit changed only verb tense ('realized' → 'had realized'), leaving the vague phrase 'something important' completely intact. The move's directive was to replace the tell with the specific realization; the student did not engage that directive at all. Signal B confirms the symptom unchanged.",
  "signalsUsed": [
    "edit_vs_critique",
    "redetection"
  ]
}
```
**Match:** status ✅ (got `unaddressed`) · confidence ✅ (0.95) · signalsUsed ✅ (edit_vs_critique, redetection)
**Duration:** 3473ms · **Cumulative cost after this case:** $0.4738 (Δ $0.0118)

---

### case-9-changed-target-deletion

**Description:** Move's target paragraph entirely deleted (no replacement, surrounding text stitched) → changed_target.

**Rationale:** The student didn't replace the offending paragraph with new content; they just deleted it and stitched the surrounding paragraphs together. The move's target is GONE — no longer in the essay. This is changed_target by deletion, distinct from changed_target by replacement. Tests that the prompt handles pure deletion cleanly.

**Expected:** status=`changed_target`, confidence ∈ [0.7, 1], must list `edit_vs_critique`, `redetection`.

**Input — prior taught move:**
```text
Move id: M-1-3-A-9
Location: P3, S0
Teaching mode: connection
Content: This grief paragraph is doing too much work for the essay's through-line. Either let it earn its weight by connecting to the central argument, or trim it back significantly.
```
**Input — edit (significance: transformative):**
```text
Old: When my grandmother passed, I felt the floor disappear beneath me. I did not eat for three days. I sat in her kitchen and held the green ceramic bowl she had used for everything — soup, dough, holding the keys when she came home.
New: 
```
**Signal B (re-detection):** symptomFlagged=false; Paragraph deleted entirely; the original target is no longer in the essay.


**Output:**
```json
{
  "status": "changed_target",
  "confidence": 0.95,
  "reasoning": "The entire grief paragraph has been deleted. The original substance the move critiqued—the grandmother's passing and the ceramic bowl anecdote—is no longer present in the essay. The move's premise (whether this grief material connects to the central argument) has been removed rather than resolved.",
  "signalsUsed": [
    "edit_vs_critique",
    "redetection"
  ]
}
```
**Match:** status ✅ (got `changed_target`) · confidence ✅ (0.95) · signalsUsed ✅ (edit_vs_critique, redetection)
**Duration:** 6356ms · **Cumulative cost after this case:** $0.4857 (Δ $0.0119)

---

### case-10-strong-partial-multifaceted

**Description:** Multi-facet directive: student executes one facet, leaves the other → partially_addressed.

**Rationale:** Move asked for two things: (1) cut a tangent and (2) reconnect to the central image. Student cut the tangent successfully but didn't reconnect to the central image. Half the directive executed. This is partially_addressed at higher confidence (0.75ish) than the gestural cases — the executed facet is real, not gestural. Tests that the model can read multi-facet directives.

**Expected:** status=`partially_addressed`, confidence ∈ [0.6, 0.95], must list `edit_vs_critique`, `redetection`.

**Input — prior taught move:**
```text
Move id: M-1-4-A-10
Location: P4, S0
Teaching mode: action
Content: Two things in this paragraph: (1) the digression about your father's coworker is pulling focus from the central pawnshop image — cut it. (2) After cutting, reconnect the closing sentence to the pawnshop frame so the reader feels the through-line.
```
**Input — edit (significance: significant):**
```text
Old: My father's coworker, Marco, who had once played in a small jazz band in Naples and still kept a battered trumpet in his car, used to say the same thing — that you can tell a person's whole life from their hands. Standing behind the counter at the pawnshop, I saw what Marco meant.
New: Standing behind the counter at the pawnshop, I saw what he meant — that you can tell a person's whole life from their hands.
```
**Signal B (re-detection):** symptomFlagged=true; Tangent successfully cut. But the closing sentence references "what he meant" without naming Marco or reconnecting explicitly to the pawnshop image; the through-line is weaker than the move asked for.


**Output:**
```json
{
  "status": "partially_addressed",
  "confidence": 0.72,
  "reasoning": "The student executed part (1) cleanly — the Marco digression is cut. Part (2) asked to reconnect the closing sentence to the pawnshop frame; the student kept 'what he meant' but removed the explicit referent (Marco), weakening rather than strengthening the through-line. The edit shows clear engagement with the directive (digression removed, sentence restructured) but incomplete execution of the reconnection task.",
  "signalsUsed": [
    "edit_vs_critique",
    "redetection"
  ]
}
```
**Match:** status ✅ (got `partially_addressed`) · confidence ✅ (0.72) · signalsUsed ✅ (edit_vs_critique, redetection)
**Duration:** 4675ms · **Cumulative cost after this case:** $0.4983 (Δ $0.0126)

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
  "status": "partially_addressed",
  "confidence": 0.72,
  "reasoning": "The student added 'And maybe that's why I keep coming back to them,' which shows recognition of the directive to move past summary toward reflection. However, the addition remains gestural—it acknowledges the lessons' ongoing significance without executing the directive to claim what they cost, what they revealed that wasn't visible at the start, or what beliefs changed. The core list 'perseverance, empathy, leadership' remains unchanged, and the new sentence doesn't deliver the substantive claim the move requested.",
  "signalsUsed": [
    "edit_vs_critique",
    "redetection"
  ]
}
```
**Match:** status ✅ (got `partially_addressed`) · confidence ✅ (0.72) · signalsUsed ✅ (edit_vs_critique, redetection)
**Duration:** 4343ms · **Cumulative cost after this case:** $0.5110 (Δ $0.0127)

---
