# Crochet Full-Profile Dump — Strict Audit (post-Gap 1)

**Source dump:** `tests/output/full-profile-14-harvard-2028-crochet.md` (279 KB, ~3,000 lines)
**Essay:** Clara — "Crochet" (491 words, Harvard 2028 admit, PrepMaven feature)
**Run:** $1.6909, 19m 39s, layers L1→L4 (no L5/L6)
**First post-Gap-1 dump:** includes the new `SignatureMove` section in §5.8 Craft Assessment + L4 preserve-the-move directive applied
**Auditor's stance:** $500/hr counselor reviewing both student-facing usefulness and engineering quality. Strict. Direct comparison to the prior `full-profile-AUDIT.md` (music-essay run, pre-Gap-1).

---

## TL;DR

The dump now contains a genuinely **counselor-grade single sentence** about who Clara is at the craft level — the Signature Move synthesis ("disproportion-then-inversion architecture: misdirection opener → P1 loads survival stakes → P4 inverts to cultural bridge-building"). That is the new asset Gap 1 was supposed to ship, and it's there.

**Three signals that Gap 1 worked architecturally:**

1. **The Signature Move integrated into L4's Protected Strengths.** Three of the four "Protected Strengths" L4 emitted match Signature Move instances 1–2 (misdirection opening) and 4 (Agnes the elephant), with explicit "Why protect" rationale and the L3.5 score evidence backing them. The L4b preserve-the-move directive (added in this PR) demonstrably steered the coaching map.
2. **The Signature Move surfaced in the Coherence Report as a productive tension** vs `admissionsPositioning.redFlags` (P4 scope inflation): "the architectural pattern is sound; the execution of P4 is weak." The system is reasoning OVER signatureMove as data, not just rendering it.
3. **The validator dropped zero instances.** All four cited-quote instances are verbatim from the essay. The smart-apostrophe + en-dash quote ("Don't get the wrong idea, now – I'm not a taxidermist or anything.") passed normalization end-to-end.

**But the same three delivery problems from the prior audit are still present, plus one new minor:**

1. **Paragraph-numbering double-indexing pervades the document.** P1 means "first paragraph" in the Score Matrix, Coaching Map, and Protected Strengths — but means "second paragraph" in the connection labels, voice map, and SignatureMove `oneSentenceName` prose. **Still a shipping-blocker.** New addition: SignatureMove's `oneSentenceName` says "(P0)" / "(P1)" / "(P4)" while the dump's evidence table for the same SignatureMove uses one-indexed (P1 / P1 / P2 / P2 / "P1,5"). One section, two conventions.
2. **Roughly 50–55% of the dump is system-internal scaffolding** — 59 connections, 130 lines of profile-index compact, per-sentence schema stubs that are never populated. The student deliverable is still buried.
3. **The student's actual takeaway (the AO Gut Reaction + Through-line + Signature Move + Coaching Map's Transformative Insight) sits at depth-3 under headings the student will never click into.**
4. **NEW (minor): Strength Signatures now duplicates the Signature Move evidence.** `strengthSignatures[0]` is "Misdirection opening" with the same evidence as SignatureMove instances 1–2; `strengthSignatures[4]` is "Specific naming" pointing at Agnes (= SignatureMove instance 4). The Signature Move is the *singular synthesis* of those signatures — but the dump renders both, side by side, near-verbatim. (This is the consolidation question the plan deliberately deferred — ship as parallel for now, but it's now visible as a real duplication signal.)

The verdict the system reaches about Crochet (sophisticated three-stage architecture, P3 mastery elision is the highest-leverage edit, P4 abandons earned specificity, grandfather's imprisonment is "stated peak, not felt peak") is **correct and worth saying**. It's just said 8–11 times across 3,000 lines and labels half the paragraphs three different ways en route.

---

## Section 1 — Bugs / regressions in the new dump

### 1.1 Paragraph-numbering double-indexing (CRITICAL — unchanged from prior audit)

Every section uses one of two indexing schemes for the same paragraphs. Crochet has 5 paragraphs.

| Scheme | Used in (Crochet dump) | Calls the actual first paragraph |
|---|---|---|
| **1-indexed** (P1–P5) | Score Matrix table; Per-Paragraph Profiles section; Coaching Map → Priorities + Protected Strengths + Patterns + Tensions; SignatureMove dump table; Findings (F1 — P1) | P1 |
| **0-indexed** (P0–P4) | Through-Line Map → Journey (P1S3 / P2S2…); Connection labels (`From label: P0S0` while ID says `P1S1`); Voice Map shifts; Pivot points; Coherence Report prose; **Signature Move oneSentenceName ("(P0)" / "(P1)" / "(P4)")** | P0 |

Concrete failures pulled from the new dump:

- **Coaching Map → Priority 1**: `Bridge the temporal leap … between P2's cyclical failure and P3's claimed mastery`. **Target field**: `P3,4`. **Architectural reason**: `P2 serves as the 'embodied struggle anchor'`. **Three labels for the same paragraph in three fields of one bullet.**
- **Signature Move → oneSentenceName**: *"misdirection opener (P0) sets up a trivial-seeming subject (crochet) that P1 loads with survival-scale stakes…"* → table row 1 below it says `P1S1` for the same paragraph. Even within one Signature Move, prose and table disagree.
- **Connection conn_mot6qxhv_0001**: ID `P2S2 -> P3S1`, From label `P1S1`, To label `P2S0`. Same paragraph pair named two different ways inside one record.
- **Findings**: `Finding F1 [confirmed/high] — P1` (1-indexed) but evidence cites `P0S0–S2` text (0-indexed prose).

**Fix priority:** P0. Same recommendation as prior audit — pick **1-indexed** end-to-end (matches `Paragraph 1` student mental model), then rewrite all derived prose. Add a lint check that fails if any user-facing string contains `P0` or any paragraph index higher than `len(paragraphs)`.

### 1.2 SignatureMove indexing inconsistency (NEW — Gap 1 specific, cosmetic)

The Crochet `SignatureMove.oneSentenceName` uses 0-indexed paragraphs (P0/P1/P4) in the prose, while the dump renderer's evidence table renders 1-indexed (P1/P1/P2/P2/"P1,5"). Fix is a one-line prompt clarification (specify display convention in the EVIDENCE GROUNDING section), but applying the fix requires re-running calibration to verify the LLM follows the new instruction. **Deferred** — see Section 6 D6.

### 1.3 Strength Signatures contains 6 of the 12 entries that read like internal verdicts copied wholesale (CARRIED OVER)

Same defect as prior audit. Examples in this dump:
- `**The grandmother's dual legacy (F2)—practical wartime survival craft transforming into aesthetic flower-making—creates genuine thematic tension that the essay will explore through the narrator's choices.** (P2): This paragraph carries enormous historical weight (F5)…` — that's a verdict, rendered as a strength.
- Same pattern repeats for every paragraph. The `quality` field of `strengthSignatures` is being stuffed with full per-paragraph verdicts because L3.5 → L4 has no separate "qualities" channel.

### 1.4 Coherence Report has 11 contradictions; only ~3 are "system disagreements"

The coherence pass identified 11 contradictions for Crochet (vs 5 for the music essay). Of the 11:
- **2 BLOCKING**: P1 effectiveness=65 vs structural role "load-bearing"; P3 effectiveness=65 vs role "supporting" — these are not contradictions, they're the same fact (architecturally important + executionally weak) re-routed through a "system_disagreement" lens.
- **6 NOTABLE / productive_tension**: most of these are also "facts about the essay" the system found from multiple angles, not real contradictions.
- **1 BLOCKING genuine**: `peakMoments[P1S4 grandfather imprisonment] vs showVsTell[P1S4 'told']` — this IS a real essay flaw.
- **2 depth_signals**: useful nuance, not contradictions.

**Recommendation:** the coherence pass over-fires on `system_disagreement` for any cross-section observation that frames the same fact two ways. Re-route the productive_tension and depth_signal cases away from the "BLOCKING" bucket — currently 2 of 11 are flagged BLOCKING, which is enough to trigger delta_synthesis (cost: $0.130 this run). If the bucket were calibrated, delta-synthesis wouldn't fire for productive tensions.

### 1.5 Token-accounting now clean — H-2 fix verified

The prior audit flagged a `L3.75` aggregate row that double-counted (`0 in / 0 out / $0.50 / 15min`). In the new dump, the cost breakdown shows:

```
L3.75_iter_0   $0.4894
understanding_prose_iter_0  $0.0322
reread_P3      $0.1245
```

No aggregate `L3.75` row. **Confirmed: the H-2 fix in this PR works as intended.** Per-iteration rows are now authoritative.

---

## Section 2 — The three buckets (system-internal / user-facing profile / user-facing improvements)

### 2.1 System-internal scaffolding (KEEP for engineering, HIDE from student UI)

| Block | Lines | What it's for | Student value |
|---|---|---|---|
| §1 Pipeline Overview cost/timing | ~20 | Telemetry | Zero |
| §1 Layer Cost Breakdown | ~20 | Cost tracking | Zero |
| §1 Improvement Phase + dimension-phases | ~12 | Phase router | Zero |
| §3 Connection refs (`conn_mot6qxhv_0001…`) on every section | scattered, ~50 lines | Cross-linking | Zero |
| §3 Entanglement refs (`(none)` for Crochet) | 1 | Internal cross-layer joins | Zero |
| §4 Score Matrix verdicts (verbatim copy of paragraph-level analysis) | ~20 | Already in §8 | Zero (dupe) |
| §7.1 All 59 connections (each is 13 lines, ~770 lines total) | 770 | Connection graph | Near-zero (see §3.1) |
| §7.2 Entanglements (none for Crochet) | 5 | Internal | Zero |
| §8 Per-sentence `Connection refs: …`, `Finding refs: …`, `Tags: [machine_label, …]` | ~250 lines aggregate | Wiring | Zero |
| §8 Per-sentence `Inferred Intents: (none)` / `Narrative Contributions: (none)` / `Rhetorical functions: (none)` | ~75 entries × 3 lines = ~225 | Schema stubs | Zero — never populated |
| §11 Coherence Report `Routing category: system_disagreement / depth_signal / productive_tension` | 11 | Layer routing | Low — engineer-only |
| §13 Profile Index Compact (entire section) | ~135 | Cache/digest for next run | Zero — duplicates everything else |
| §14 Profile Metadata | 25 | Persistence headers | Zero |

**Estimated system-only volume: ~1,400 of ~3,000 lines = ~47%.** This should never reach the student.

### 2.2 User-facing PROFILE — "who you are, what your essay is doing"

Walk-through order a counselor would use, mapped to dump sections:

1. **The honest first-read** (§2 AO First Read → "Gut Reaction").
   *"Okay, this grabbed me immediately. The opening is playful and disarming — I actually smiled at the taxidermist fake-out. And then she doesn't waste time: grandmother, Vietnam, POW camp, refugee story, but filtered through CROCHET, not as heavy-handed trauma narrative… By paragraph 3 I'm genuinely curious about this kid."*
   **Ship verbatim. This is the punchiest 3 sentences in the file.**

2. **What is THIS writer's craft fingerprint** (§5.8 → **Signature Move** — NEW from Gap 1).
   *"Disproportion-then-inversion architecture: misdirection opener (P0) sets up a trivial-seeming subject (crochet) that P1 loads with survival-scale stakes (thirteen-year imprisonment, wartime scarcity), then P4 inverts the disproportion by revealing the trivial subject as the mechanism of cultural bridge-building."*
   **This is the single most counselor-grade sentence in the whole dump. The whole point of the Gap 1 work was to produce this, and it produced it.** Ship at the top of the user view, right under AO Gut Reaction.

3. **What your essay is arguing** (§3 North Star → Through-line summary + Journey).
   *"crochet as inheritance medium — Crochet transforms from survival tool (grandmother's wartime necessity) to burden (narrator's incompetent struggle) to chosen practice (gift-giving as cultural bridge-building)."*
   The Journey table (P1S3 → P5S1) is genuinely good — it shows the idea moving across the essay.

4. **The portrait it paints of you** (§5.7 Character Revelation → "Writer Portrait" prose + values + blind spots).
   This is good content but rendered with extreme verbosity. Compress.

5. **What an admissions officer will actually take away** (§6 AO takeaway). One paragraph, honest. *"This student can write — the misdirection opening, the magical metaphor system, and the temporal compression demonstrate craft control… The closing's scope inflation (East-West bridge, America's patchwork quilt) signals either ambitious self-concept or inability to end without abstraction — the rest of the application would clarify which."* Ship.

6. **Red flags they'll spot** (§6 Red Flags). All 5 are real. The "scope inflation" callout is the right call.

**Total user-facing PROFILE content needed: ~180–200 lines.** Currently buried inside ~1,500 lines of repeated analysis.

### 2.3 User-facing IMPROVEMENTS + RATIONALE

The dump has *five overlapping places* where improvements appear (same as prior audit):

| Location | Items | Notes |
|---|---|---|
| §3 Trajectory → Plausible paths | 5 | High-quality alt-direction framing with `Requires:` preconditions. |
| §4 Prioritized Improvements | 3 | Per-paragraph, transformative/significant/incremental tags. Highly redundant with Coaching Map. |
| §4 Coaching Map → Priorities | 3 | Same content as Prioritized Improvements but with `Architectural reason` + `Unlocks next` framing. |
| §4 Coaching Map → Transformative Insight | 1 paragraph | **Best framing in the file. Ship verbatim.** *"This isn't just skill transmission; it's trauma processing across generations. The narrator inherits not the grandmother's necessity but her capacity to transform necessity into choice."* |
| §4 Coaching Map → Protected Strengths | 4 | **NEW: 3 of 4 are direct from SignatureMove instances** (preserve-the-move directive working). |

**Deduplicated improvement set** — the actual coachable items:

1. **Bridge the P2→P3 temporal leap** with one sustained scene showing the breakthrough moment. **Top priority.** ([transformative])
2. **Ground P4's metaphorical synthesis in a specific crocheted object** (Agnes-level detail, color/recipient/purpose) instead of generic civic vocabulary. ([significant])
3. **Add one named gift recipient beyond the calculus teacher** — show, don't assert, the gift-giving pattern. ([incremental])
4. **Process the grandfather's imprisonment** with one moment of emotional grounding (peakMoments aspirational vs. showVsTell actual gap).
5. *(deferred)* Extend the magical metaphor through P4 OR transition more smoothly to textile metaphors — the wizard frame breaks down at P3S5.

That's it. **Five recommendations** stretched across ~600 lines of L4 output. The first three are the core; #4 is genuine; #5 is plausible-but-speculative.

**Protected Strengths** (don't break these while improving):
- ✅ Misdirection opening (P0S0–S2) — directly from SignatureMove
- ✅ Cyclical failure structure in P2 — the essay's only sustained scene, highest-scoring paragraph
- ✅ Migration metaphor (P3S3) — the essay's thematic pinnacle
- ✅ Agnes the elephant (P3S4) — directly from SignatureMove

The Gap 1 preserve-the-move directive demonstrably surfaced two of these (Misdirection opening, Agnes) verbatim from SignatureMove instances. **This is the architecture working as designed.**

---

## Section 3 — Wasted output (what to cut)

### 3.1 The 59-connection dump (~770 lines, ~26% of the file)

Same dynamic as the prior audit. Crochet has 59 connections for a 491-word essay = ~one connection per 8 words. Of the 59:
- 50+ are `Strength: tentative`, `Discovered by: scout`, `Routing tags: <empty>`, `Reverse illumination: (not available)`.
- The genuinely useful connections (the magical metaphor system across P1–P3, the migration metaphor → grandmother's displacement echo, the textile metaphor unification at P4) are 5–8 of the 59.
- Same `Description` and `Significance` text duplicates across 4–5 connections (e.g., the magical-language pattern's identical block appears in conn_0002 / 0003 / 0004 / 0005 / 0006 verbatim).

**Cut yield: ~660 lines.** Same recommendation as prior audit — drop everything below `strength: foundational/significant/supporting` from any output the student or downstream layers see.

### 3.2 The Profile Index Compact section (§13, ~135 lines)

Cache digest for next run; not a student artifact. Move to `.json` cache. **Cut yield: 135 lines.**

### 3.3 Per-sentence schema stubs (§8, ~225 lines aggregate)

Same as prior audit. For each of 26 sentences, the dump emits four never-populated fields: `Inferred Intents: (none)`, `Narrative Contributions: (none)`, `Rhetorical functions: (none)`, plus the `Paragraph contribution`/`Primary function` duplicate.

**Cut yield: ~225 lines.**

### 3.4 Duplicated rationale prose (~250 lines aggregate)

Per-paragraph verdicts appear in: Score Matrix → Verdict; Prioritized Improvements → Why; Coaching Map → Architectural reason; §8 Paragraph N → Verdict; §8 Strength signatures (verbatim quoted as evidence for both strengths AND growth edges of the same paragraph). 5–6 places per verdict.

**Cut yield: ~200 lines.**

### 3.5 NEW from Gap 1 — Signature Move and Strength Signatures rendered side-by-side

The Signature Move section (`### Signature Move` callout) and the Strength Signatures bullet list both render in §5.8 Craft Assessment. Three of Strength Signatures' 12 entries describe the SAME observations the Signature Move just synthesized:
- `Misdirection opening (P1)` ↔ SignatureMove instances 1–2
- `Specific naming (P4)` ↔ SignatureMove instance 4 (Agnes)
- `Architectural sophistication through three-stage compression…` ↔ entire SignatureMove `oneSentenceName`

The plan deliberately kept these as parallel parallel-vs-singular lenses (per §"Why this design (lock-in)" in the plan). For the user-facing view, **render Signature Move first; then drop the strengthSignatures entries that duplicate it; render the rest** (the magical-metaphor-system, voice-code-switching, generational-vocabulary-progression entries — those are genuine separate strengths the synthesis doesn't capture). Engineering-side keep both.

**Cut yield (user-facing only): ~3 of 12 strengthSignature entries = ~30 lines.**

### 3.6 What the trim looks like for Crochet

| | Before | After |
|---|---|---|
| Total lines | ~3,000 | ~1,150 |
| User-facing markdown | mixed throughout | top ~250 lines |
| Signature Move at top of student view | ❌ buried in §5.8 | ✅ second only to AO Gut Reaction |
| System scaffolding | mixed throughout | sidecar `.json` |
| Time-to-useful-insight (student perspective) | minutes | seconds |

---

## Section 4 — Repetition audit

The single observation **"P0's misdirection opening creates voice distinctiveness through playful conspiracy"** appears verbatim or near-verbatim in:

1. §2 AO First Read → Gut Reaction
2. §3 North Star → Structural Roles Map → P1
3. §4 Score Matrix → P1 Verdict
4. §4 Coaching Map → Protected Strengths #1
5. §5.1 Voice Identity → Signature
6. §5.6 Narrative Strategy
7. §5.8 Craft Assessment → Strength Signatures #1
8. **§5.8 Craft Assessment → Signature Move (NEW)**
9. §8 Paragraph 1 → Analysis → Verdict
10. §8 Paragraph 1 → Strength signatures bullet
11. §13 Active Concerns → P1

**11 places.** Adding the Signature Move section makes the count one higher than the prior audit (which counted 9 places for the equivalent "users smile" observation in the music essay).

The same observation pattern holds for the Agnes detail (8 places), the temporal leap (7 places), the migration metaphor (6 places), the closing scope inflation (9 places).

**Architectural fix (same as prior audit):** insights live in `Findings` (§9) and other sections cite by ID. Currently §9 Findings has **15 entries** for Crochet (better than the music essay's 2!) which suggests the system is moving in the right direction, but the cross-referencing isn't yet wired — sections still re-emit verbatim prose instead of `[ref: F5]`.

**Specific to Gap 1**: the SignatureMove call's input includes the full Phase A + Phase B synthesis. SignatureMove explicitly synthesizes observations the strengthSignatures already enumerate. So the duplication isn't a bug — it's the deliberate "synthesis lens vs cataloging lens" architecture from the plan. The user-facing view should pick ONE.

---

## Section 5 — Quality / accuracy / reliability assessment

### 5.1 What is genuinely sharp

Real $500/hr counselor observations the system found:

1. **The disproportion-then-inversion architectural read (NEW from Gap 1).** The Signature Move identified the essay's load-bearing architectural pattern in one sentence — disproportion at the open, survival-stakes load in P1, inversion at P4. **A real architectural diagnostic.**
2. **The grandmother's intentional reversal as trauma processing across generations** (Coaching Map → Transformative Insight). *"It's not about learning to crochet, it's about inheriting the grandmother's pattern of making meaning from displacement."* This is the framing the human review (PrepMaven feature commentary) underlines as the essay's distinctive achievement.
3. **The temporal-leap diagnosis** (P2's cyclical failure → P3's claimed mastery, with the breakthrough elided). Specific, actionable, mechanism-naming.
4. **The "stated peak vs felt peak" classification of the grandfather's imprisonment** (Coherence Report). This is the kind of read that distinguishes mature counselor feedback from generic advice.
5. **The migration metaphor as transformation of refugee displacement** (Through-line P3S3 → P4S4). The system noticed not just the metaphor but its function (turning trauma into chosen practice).
6. **The voice code-switch flag** (P0 playful → P1 formal historical → P3 playful again → P4 abstract civic). Multi-paragraph register-tracking that's hard to do without sustained attention.
7. **The Agnes-as-named-character-anchor read.** Identified as both Strength Signature and SignatureMove instance — the system correctly identified the single most memorable detail.
8. **The Gut Reaction in AO First Read.** Voice-y, true, ships as-is.

### 5.2 What is filler, performed, or wrong (specific to this dump)

1. **Per-sentence "Significant word choices" overreach** — same as prior audit. 26 sentences each get word-by-word reads; a real counselor would do it for ~5.
2. **Confidence: 1 on every Observed Function** — meaningless decoration.
3. **The Score Matrix's voice scores ranging 42–92 across 5 paragraphs feel calibrated for spread** rather than for genuine semantic anchoring. P5 voice=42 vs P3 voice=86 is a 44-point gap; it's plausible the closing IS less voice-y than the middle, but I can't tell what 42 means vs 50 vs 60.
4. **The Trajectory → Plausible paths "Requires:" preconditions** continue to be unfalsifiable platitudes. *"Requires: One paragraph or extended sentence showing the breakthrough moment."* — that's the recommendation, not a precondition.
5. **The Coherence Report's 11 contradictions, of which 3 BLOCKING:** — only 1 of the 3 BLOCKING (the peakMoments vs showVsTell on P1S4) is a genuine BLOCKING essay flaw. The other 2 (P1 effectiveness=65 vs structural=load_bearing; P3 effectiveness=65 vs structural=supporting) are not contradictions — they're the same fact (architectural importance ≠ executional quality). Mis-routing them BLOCKING triggered the $0.130 delta-synthesis run that wasn't actually needed.
6. **The Question Queue's 7 questions are genuinely pretty good** — Q4 ("Does the migration metaphor's brilliance redeem the elided learning process?") is the kind of question I'd actually ask. But none would change a coaching recommendation; they're discussion prompts, not action items. Acceptable as a conversator hook, but they shouldn't appear in the student profile dump as if they were diagnostics.

### 5.3 Reliability concerns

- **Numbering bug (§1.1)** — same as prior audit. Now also affects the new Signature Move section's `oneSentenceName`. **Most serious reliability issue.** A student reading "misdirection opener (P0)" will look at paragraph 0 in their essay (which in their head is the first paragraph) and see... actually that works for them, because students think 0-indexed. But the dump's table directly below says P1 for the same paragraph. Internal inconsistency the student will notice and lose trust in.
- **Findings count for Crochet: 15** (vs 2 for the music essay) — this is the right direction. Insights are starting to live as canonical entries. Once cross-section prose actually references them by ID, the repetition problem solves itself.
- **Signature Move latency: 25s** — the call took 25 seconds wall-clock. It runs parallel with CURATION (per the Promise.allSettled architecture in this PR), so it doesn't add wall-clock latency to the iteration; CURATION dominates the iter time anyway.
- **No L5 or L6 ran.** Same as prior audit — the dump as-is is incomplete by design.

---

## Section 6 — Directional decisions for you (Tue)

Carrying forward the prior audit's six decisions, with Gap 1 status updates and one new decision:

### D1. Pick one paragraph-numbering convention end-to-end. **(Required, blocking — UNCHANGED.)**

Recommendation: **1-indexed, P1 = first paragraph** end-to-end (matches `Paragraph 1` headers, matches student mental model). Add a CI check that fails the run if any user-facing string contains `P0` or any paragraph index higher than `len(paragraphs)`.

**Status update:** Gap 1's SignatureMove inherits this same problem in its `oneSentenceName` prose. The fix needs to apply uniformly.

### D2. Stop serializing the connection graph into the final profile. **(UNCHANGED.)**

Crochet has 59 connections, ~770 lines. Same recommendation: working memory only; sidecar JSON if downstream layers need it. **Saves ~660 lines per dump.**

### D3. Centralize insights in `Findings` and reference by ID elsewhere. **(IN PROGRESS.)**

Crochet has 15 findings (vs the music essay's 2). The Findings store IS materializing as a canonical insight registry. The next step — cross-section prose linking by ID instead of re-quoting — is unbuilt. Once that's wired, repetition collapses by ~250 lines per dump.

### D4. Ship a tiered output, not a 280KB dump. **(UNCHANGED.)**

Three tiers, three artifacts:
- **Student tier (`profile.md`, ~250 lines):**
  - AO Gut Reaction
  - **Signature Move (NEW Gap 1 — top of student view)**
  - Through-line summary + Journey
  - Distinctiveness Signature + AO Takeaway + Red Flags
  - Coaching Map → Transformative Insight (verbatim)
  - 3–5 prioritized improvements (one-sentence rationales)
  - Protected Strengths
- **Counselor tier (`profile-extended.md`, ~600 lines):** above + per-paragraph verdicts + Coaching Map full + Trajectory paths + Question Queue + Findings.
- **System tier (`profile-debug.json`):** everything else — connections, layer costs, staleness, profile index, metadata.

The current single-artifact dump is trying to serve all three audiences and serves none.

### D5. Decide whether per-sentence analysis (§8) is the product or the substrate. **(UNCHANGED.)**

Same as prior audit. Either generate on demand or generate always but render only top 3–5 sentences in any final view.

### D6. (NEW) Tighten the SignatureMove prompt to enforce 1-indexed display in `oneSentenceName`. **(Low risk, requires recalibration.)**

Surgical fix: add to the EVIDENCE GROUNDING section of `SYSTEM_PROMPT_SIGNATURE_MOVE`:

> *"Display convention: in `oneSentenceName`, `whyItIsTheirs`, and `readerEffect`, refer to paragraphs 1-indexed (the first paragraph is 'P1', not 'P0'). Instance fields (`location.paragraph`, `paragraph`, `paragraphs[]`) remain zero-indexed for the data layer."*

Cost to verify: re-running Crochet ~$1.70. Defer until D1 is tackled holistically — fixing only signatureMove leaves the inconsistency in place everywhere else.

### D7. (NEW) Decide whether to render strengthSignatures+signatureMove side-by-side or only signatureMove in the student view.

The plan deliberately ships them as parallel lenses (synthesis vs cataloging). For the **student** tier, my recommendation is: **render Signature Move only, with the magical-metaphor and voice-code-switching strength signatures appended as supporting craft observations.** Drop the 2–3 strengthSignatures entries that the SignatureMove already synthesizes. The plan's lock-in argument applies to the engineering side (don't collapse the data model); for the user side, deduplication is correct.

---

## Appendix — What Gap 1 specifically delivered (verification)

| Plan deliverable | Status in this dump |
|---|---|
| `craftAssessment.signatureMove` field populated when essay has a defining move | ✅ Populated. 4-instance `disproportion-then-inversion architecture` SignatureMove. |
| Validator drops to null on quote drift | ✅ Zero drops on Crochet (all 4 cited quotes verbatim). Tested independently in 11 vitest unit tests. |
| L4b preserve-the-move directive applied to coaching | ✅ 3 of 4 Protected Strengths are direct from SignatureMove instances (Misdirection opening, Cyclical failure, Agnes). The directive demonstrably steered L4b output. |
| Dump renderer surfaces Signature Move callout | ✅ §5.8 Craft Assessment now begins with a `### Signature Move` block, evidence table, before strength signatures. |
| H-2 cost-row fix (no aggregate L3.75 double-count) | ✅ Verified: per-iteration rows only, no aggregate row. |
| SignatureMove runs parallel with CURATION via `Promise.allSettled` | ✅ Verified in pipeline log: `Iteration 0 — Phase A+B complete, $0.3464` then META → parallel(Curation, SigMove). |
| signatureMove participates in Coherence Report | ✅ NOTABLE entry: `craftAssessment.signatureMove vs admissionsPositioning.redFlags`, classified `productive_tension`, `canCoexist: true`. The system reasons over the new field as data, not just renders it. |

**Cost summary:** 1 × Crochet end-to-end at **$1.6909, 19m 39s**. Within Tue's "ideally $1.50, max $2" target. SignatureMove micro-call itself: **$0.0837** (~5% of total) — exactly the $0.05–$0.10 plan estimate.

**Calibration verdict (carrying from `docs/QUALITY_GAP1_CALIBRATION.md`):** 8/8 structural pass criteria PASS on first try; Signature Move output qualitatively matches the human counselor review's "compressed-heritage architecture" framing with a novel three-part compound (disproportion → stakes-load → inversion) that goes beyond the prompt's worked example.
