# Workshop Render Spec — Phase-Adaptive Output Contract

> **Status:** Editorial pass complete (locked 2026-05-28). This is the canonical
> contract between backend emissions and the AnnotationV2 workshop surfaces.
> Inputs the renderer build, the backend reframe work, and the gated cuts.
>
> **Companion docs:** [`UX_CONTRACT_2026_05_12.md`](./UX_CONTRACT_2026_05_12.md)
> (visual spine + §4.4 rewrite-generator fields), [`BACKEND_HANDOFF_2026_05_21.md`](./BACKEND_HANDOFF_2026_05_21.md)
> (phaseTransitionLine + per-sentence effectiveness asks).

---

## 1. The five locked principles

1. **Action mandate.** Every student-facing surface must drive revision, improvement, or change. Nothing exists as a summary of "what's done is done."
2. **Reframe, don't cut depth.** Descriptive observations become: *observation (the depth) → diagnostic (where it works / where it falters) → revision direction (tied to a specific Priority N).* Cut only after the reframe genuinely fails.
3. **Tight prose.** 60–100 words per reframe block. First-read consumable.
4. **Rationale leads; numbers contextualize.** Tailored essay-specific rationale leads. Numbers appear only when paragraph-anchored alongside verdict + priority — never as a context-free list.
5. **Internal ≠ rendered.** Fields downstream layers consume stay emitted but don't reach the student unless they pass principle 1.
6. **The cut bar (raised 2026-05-28).** A field is cut from EMISSION only if it has (a) no downstream consumer AND (b) no thinking-scaffolding value — i.e., its presence in the output schema doesn't improve the quality of co-generated fields in the same LLM call. (b) is only verifiable by A/B, never by static analysis. **Render cuts are always safe** (emission preserved → generation unaffected); **emission cuts require the A/B.** Default to render-only cuts; reserve emission cuts for fields that pass both (a) and (b).

---

## 2. The phase-adaptive zoom model

The decision is **not** binary cut/keep. It's: *at which phase does this surface, and what is the focus window for that phase?*

Each phase has three windows:
- **MASTERED** (quiet confirmation): lower-phase concerns the student has handled — surfaced as a one-line reassurance ("your structure is sound"), not re-taught.
- **CURRENT FOCUS** (prominent): the phase-appropriate work, front and center.
- **DEFERRED** (teased): higher-phase concerns — named as "what's next" so the student sees the path, without overwhelming them now.

The same essay analyzed at different phases shows a **different portfolio.** Lower-phase concerns FADE as the student progresses; current-phase concerns SHARPEN; higher-phase concerns are TEASED. This is a zoom, not an accumulation.

```
                    MASTERED          CURRENT FOCUS         DEFERRED
                  (quiet confirm)      (prominent)          (teased)
FOUNDATION    │ —                  │ Structural clarity  │ "next: earning      │
              │                    │ Does it land?       │  your claims"       │
              │                    │ Core voice presence │                     │
ARCHITECTURE  │ "structure sound"  │ Arc + earnedness    │ "next: voice +      │
(Crochet)     │                    │ Paragraph execution │  sentence craft"    │
              │                    │ Show vs tell        │                     │
CRAFT         │ "arc holds"        │ Voice (shifts,range)│ "next: precision +  │
              │                    │ Emotional grounding │  economy"           │
              │                    │ Image system        │                     │
              │                    │ Score tensions      │                     │
              │                    │ Sentence rewrites   │                     │
POLISH        │ "voice is yours"   │ Sentence relations  │ "next: what makes   │
              │                    │ Word economy        │  it singular"       │
              │                    │ Per-para register   │                     │
              │                    │ Subtext refinement  │                     │
DISTINCTION   │ "past the rubric"  │ Productive          │ —                   │
              │                    │  contradictions     │                     │
              │                    │ Singular voice      │                     │
```

---

## 3. Generation-gating policy

Phase-gating applies to **generation**, not just surfacing — weak essays get a cheaper, focused analysis; deep analysis runs only where it pays off.

- **Always runs** (establishes profile + phase + priorities): L1, L2, L2.5, L3, L3.5, L4, essay-level rewrites (`generateEssayLevelRewrites`), phase assessment.
- **Gated by phase** (the deepest layers): L3.75 per-paragraph register elaboration, sentence-to-sentence relationships, productive-contradiction depth, per-paragraph L5 fan-out (sentence rewrites).
- **Dependency guard:** L4 + the rewrite generator consume core L3.75 sections (voice identity, MEM, character revelation, craft assessment). Those always generate. Only the DEEPEST sub-analyses gate.

---

## 4. Per-phase portfolio matrix

| Surface | Foundation | Architecture | Craft | Polish | Distinction |
|---|---|---|---|---|---|
| AO Gut Reaction / committee / put-down | ✅ | ✅ | ✅ | ✅ | ✅ |
| Coaching priorities + rewrites | ✅ (1-2) | ✅ (3) | ✅ (3-4) | ✅ focused | ✅ surgical |
| Protected strengths | ✅ | ✅ | ✅ | ✅ | ✅ |
| Transformative insight | ✅ | ✅ | ✅ | ✅ | ✅ |
| Writer portrait + signature move | ✅ | ✅ | ✅ | ✅ | ✅ |
| Phase pill + nextPhaseLook | ✅ | ✅ | ✅ | ✅ | ✅ |
| Structural roles + through-line | tease | ✅ prominent | mastered-quiet | quiet | quiet |
| Earnedness / show-vs-tell | tease | ✅ prominent | ✅ | mastered | mastered |
| Per-sentence effectiveness (6-tier) | — | ✅ | ✅ | ✅ | ✅ |
| Voice patterns/markers/weaknesses | basic | basic | ✅ prominent | ✅ | ✅ |
| Voice shifts + range + evolution (reframed) | — | tease | ✅ prominent | ✅ | ✅ |
| Emotional arc + authenticity (reframed) | — | basic | ✅ prominent | ✅ | ✅ |
| Image system + narrative pacing (reframed) | — | tease | ✅ prominent | ✅ | ✅ |
| **Score tensions** (reborn, "claims outrun grounding") | — | — | ✅ Craft+ | ✅ | ✅ |
| Per-paragraph sentence rewrites (action-mode only) | — | — | ✅ | ✅ | ✅ |
| **Voice Map per-para register** (reborn) | — | — | tease | ✅ Polish+ | ✅ |
| **Sentence-to-sentence relations** (reborn, as action) | — | — | — | ✅ Polish+ | ✅ |
| Word economy / editorial cuts | — | — | — | ✅ Polish+ | ✅ |
| **Productive contradictions** ("what your essay knows about itself") | — | — | — | tease | ✅ Distinction |

---

## 5. Final disposition (all items)

### 🟢 Keep + surface (action-driving as-is)
AO Gut Reaction · Committee One-Liner · Put-Down Risk · Phase Pill · Archetype+Differentiator · Signature Move · Writer Portrait · Coaching Priorities (with "AO flags as" subtitle — red flags folded in) · Protected Strengths (+ weakeningAntiPattern) · Transformative Insight · Emergent Patterns · Draft Variants + Voice Notes + Anti-Pattern · Effectiveness Score · Per-Sentence Effectiveness · Cross-Paragraph Patterns · Structural Roles · Portfolio Position · Distinctiveness Factors

### 🟡 Reframe (observation → diagnostic → revision direction)
Through-line (phase-grouped journey + transformation) · Paragraph Verdict (+ earnedness signal folded in) · 5-Dim Scores (numbers + rationale + priority, paragraph-anchored) · Voice Identity (signature + evolution) · Voice Range (NEW) · Emotional Topography · Thematic (thesis + subtext + threads) · Productive Contradictions · Narrative Strategy (pivots + turning point + pacing-as-tool) · Character (portrait + blindSpots + values "lean into") · Craft (imageSystem + sentence/word patterns) · Tellability (meta-reframe "how your essay reads from outside") · Institutional Fit (2-3) · AO Takeaway (1 sentence)

### 🔵 Keep internal only (downstream consumers OR thinking-scaffolding; never rendered)
Voice Map vocab domains · Moment Earnedness Map (full) · Character growthArc + intellectualFingerprint · Cross-Dimension Entanglements · Through-line full 9-stop list · Score-tension numbers · Connection graph · Profile index compact · Layer cost breakdown · Iteration ledger · Findings + candidate store
**Reclassified here after the careful cuts audit (2026-05-28):**
- **`distinctivenessSignature` (L4)** — load-bearing: feeds L3.5 context + L5 prompt + North Star maturity. NOT redundant with AdmissionsPositioning (architecture vs admissions layer). Was empty on Crochet only because entanglements were starved (see §10). Render: use AdmissionsPositioning.distinctivenessFactors.
- **`growthEdges` (L3.75)** — load-bearing: `extractL375Candidates` harvests `pairedImprovement` → L4 priorities. It FEEDS the Coaching Map, doesn't duplicate it. Render cut only.
- **`memorability`** — feeds router compressed summary + carry-forward context. Render cut only (Signature Move + Distinctiveness Factors are the surfaced versions).

### 🔴 Cuts (the careful audit reduced 8 → render-only + ONE gated emission cut)

> **The cut bar (raised 2026-05-28):** a field is cut only if it has (a) no downstream consumer AND (b) no thinking-scaffolding value (its presence in the output schema doesn't improve the quality of co-generated fields). (b) can only be verified by A/B, not static analysis. RENDER cuts are always safe (emission preserved → generation unaffected). EMISSION cuts require the A/B.

**Safe render-only cuts (emission preserved, zero generation risk):**
- distinctivenessSignature · growthEdges · memorability (see 🔵 above — student render cut, emission kept)
- **Trajectory speculative paths** — filtered from render; mechanism kept for genuinely-distinct paths
- **Per-Paragraph Earnedness Density visual** — folded into verdict reframe
- **Per-paragraph L5 awareness-mode annotations** — render only action-mode (sentence rewrites)
- **Sentence-to-sentence as pure analysis** — not surfaced; reborn as Polish+ ACTION only

**Gated emission cut (pending A/B):**
- **Narrative `structuralChoices`** — genuinely terminal (only a test dump reads it) AND actionable content already in priorities + protected strengths. BUT may be thinking-scaffolding for the co-generated narrativeStrategy / pivotPoints / craftAssessment. **HOLD: A/B (generate L3.75 with vs. without structuralChoices in the schema, compare co-generated field quality) before cutting emission.** If quality holds, cut. If it degrades, keep internal.

### ♻️ Reborn at higher phase (NOT cuts)
- **Score Tensions** → Craft+ (reframed "where claims outrun grounding")
- **Voice Map per-paragraph register** → Polish+
- **Sentence-to-sentence relationships** → Polish+ (as action: "tighten this sentence-pair")

### ➕ New additions
- **`nextPhaseLook`** on phaseAssessment — "what reaching the next phase looks like for YOUR essay," tied to priorities (~$0 cost)
- **Voice Range** — derived from VoiceIdentity + VoiceMap (~$0 cost)

---

## 6. The reframe pattern (backend prompt requirement)

Every 🟡 descriptive field must emit in this structure:

```
{OBSERVATION — the depth, what we see in the essay (preserves teaching)}
{DIAGNOSTIC — where this signal works, where it falters}
→ {REVISION DIRECTION — explicit, tied to "Priority N" when one exists}
```

Target 60–100 words. Numbers don't lead. Example (Voice Identity, Crochet):

> Your strongest voice is P0–P1's conversational-with-asides register — playful intimacy that earns reader trust. The shift to formal documentation in P2 is intentional and works (it grounds the stakes). The closing's lyrical abstraction is the unintentional drift: when you reach for the AO frame in P5, you lose the writer. **→ Revise P5 to use the P0–P1 register (Priority 2). Replace the patchwork-quilt abstraction with a specific object, like Agnes.**

### 6.1 The three-beat priority anatomy (Coaching Map priorities — surface #1)

Discovered while rewriting the L4 `coachingMap.priorities` generating prompt (2026-05-29; **revised 2026-05-31** per product direction — see "no-recycle" below). The generic reframe pattern above is necessary but NOT sufficient for the action layer — a priority must GENERATE new direction, not just diagnose. The `priority` string (the only student-facing field on a priority; `architecturalReason`/`unlocksNext` are internal, consumed by L5) emits in **three beats, in order**:

1. **Stakes / the issue itself** — open here, never on a generic action headline. Quote the student's words. ("Your biggest claim is a word, not a moment. 'I learned to channel the magic' — but never the afternoon it obeyed.") NOT "Bridge the temporal leap between P2 and P3."
2. **Diagnose once, then stop** — one line; never restated in fresh words (the old triple-statement headline≈architecturalReason≈target.description was the dominant failure).
3. **Open a door (GENERATE) — the heart, the reason they paid** — invent a NEW, concrete, direct direction (a scene, an argument, an image the essay could hold) the student has *not* written yet, vivid enough to see and open enough to make their own. Beats 1–2 are setup; the door does the work.

**No-recycle + inspire (added 2026-05-31, product direction).** The earlier draft of this anatomy had a 4th beat — *"point at their own model"* ("you did this in P2 — do it here"). **Cut.** Recycling the student's existing strengths back at them is NOT what they pay for; they pay for new, direct generation. Rule: do not make "point back at your strongest paragraph / signature move" the structure of the output — the student's own best writing is not the deliverable, new direction is. A strength may appear *rarely* as a one-clause touchstone, never as the focus or a required move. And the priority must **inspire**: the test is whether the student finishes reading and wants to open their draft. A priority that reads like a correction or a recap has failed.

**Reveal character, not just craft (added 2026-05-31, product direction — the depth rule).** The generated door is NEVER vivid detail for its own sake, and *"show don't tell / add sensory detail"* is the commoditized advice this system is explicitly better than. Every direction must carry its **meaning**: name what writing the moment would *reveal about the student* — the trait, the habit of mind, the value — that marks them as a genuine, distinctive candidate on a level the rest of the essay only claims. The imagery earns the revelation; the revelation is the point. (Crochet door isn't "write the pretty afternoon" — it's "write the afternoon because it's where a reader watches you *become someone who stays inside a difficulty until it becomes yours* — the same thing your grandmother did with a war.") Applies to both `PRIORITIES_DIRECTIVE` and `L5_GENERATIVE_DOOR_DIRECTIVE`.

**Mode-matching guard (non-negotiable):** the door in beat 3 is sensory ONLY when the essay is sensory. Crochet → physical craft detail; debate → logical structure + stakes; research → the unshown decision/failed result. Do NOT default to imagery.

**Internal-vs-rendered split:** `architecturalReason` and `unlocksNext` are NOT shown to the student — they feed the L5 rewrite engine. The prompt forbids restating the `priority`'s content in them (this is what kills the triple-statement) and holds them COMPACT (architecturalReason ≤40w, unlocksNext ≤30w; terse scaffolding, not prose). System jargon ("structural role," etc.) is allowed there because it's internal; it is BANNED from the `priority` string.

**Length — the action layer is an exception to principle 3's 60–100w.** The generative door needs room, so the `priority` field runs **~110–150w**. Discipline comes from "one issue, one diagnosis line, one door — no padding, no recap," not a tight word cap.

**Shared-call budget (regression found & fixed 2026-05-30):** priorities, the full coachingMap, AND the full coherenceReport are co-generated in ONE Mode C call. The richer (correct) priorities zero-sum against the coherenceReport, which is emitted LAST — at the old 6000-token / 180s ceiling the report truncated (resolutions dropped, jsonrepair-salvaged). Fix: `L4B_MAX_OUTPUT_TOKENS` 6000→7500 and `L4B_TIMEOUT_MS` 180s→240s (the call generated to the cap at 162s, so both had to rise together) + compacting the internal fields. **Lesson for future surface rewrites: when you enrich a field co-generated in a shared LLM call, check the call's output-token headroom and what's emitted after it — richer prose upstream silently truncates downstream fields.**

Implementation: shared `PRIORITIES_DIRECTIVE` constant in `crystallizer.ts`, spliced into all three L4 system prompts (unified Mode C = live default, legacy split L4b, composite).

### 6.2 The generative door — anti-fabrication vs. rule 6 (L5 rewrites, surface #2)

Discovered rewriting the L5 rewrite prompts (2026-05-30). Rule 6 (GENERATE — hand the student a vivid door, not homework off a diagnosis) appears to collide with the system's anti-fabrication guard (don't put invented facts in the student's mouth). The current prompts only knew two modes — **ghostwrite a flat voice-matched sentence**, or **ask a bare question** — and the `specify` rewrite angle even forbids invention ("concrete detail FROM ELSEWHERE IN THE ESSAY"). Neither opens a door.

**The resolution (now a locked rule):** they coexist by **framing**. Vivid possibility is offered as **invitation**, never asserted as the student's fact:
- The paste-able rewrite `text` stays factually true to what the student wrote — no invented facts to paste verbatim (anti-fabrication holds).
- The **door** (in the teaching `content`, and in "scene"/"insight" intensity drafts) renders vivid possibility introduced by invitation — "picture the afternoon it worked: maybe the yarn-over pulls clean… *you'd know the real detail*." The specifics illustrate the KIND of thing; they're explicitly the student's to confirm or swap.
- Test: door imagery enters via "picture…/maybe…/what does it feel like when…", never as a fact the student must have meant.

Plus: **domain-craft vocabulary** mandate (use the essay's own world — gauge/yarn-over for crochet, dropped-disad/flow for debate), **mode-matching** (sensory only for sensory essays), **generate-new-don't-recycle + inspire** (per the 2026-05-31 product direction in §6.1 — the door invents fresh material the student hasn't written; it does NOT recap their strengths, and it must leave them wanting to write), and the **8 voice rules** applied to all student-facing strings. `voicePreservationNotes` is student-facing (UX §4.4) → must name the student's own moves in their words ("keeps your 'Don't get the wrong idea' aside"), NOT styleProfile field names, and is capped ≤40w.

Implementation: shared `L5_GENERATIVE_DOOR_DIRECTIVE` (`analysis/l5RewriteDirectives.ts`), spliced into BOTH L5 prompts — `deepAnnotationService.buildSystemPrompt` (live per-paragraph path) and `rewriteGeneration.buildRewriteSystemPrompt` (essay-level path). **Verified live** on the essay-level path ($0.18 crochet run): doors open as invitation, domain vocab present, notes mentor-voiced.

Two adjacent fixes found during verification (both committed): (1) `REWRITE_TIMEOUT_MS` 90s→300s + `REWRITE_MAX_TOKENS` 6000→13000 — the path had never run live so its budget was never validated; the richer directive needs the headroom (same shared-call truncation pitfall as §6.1). (2) `assembleRewriteInputs` gap ids were non-unique when two priorities shared `consolidatedFrom[0]` → one priority's rewrites silently dropped; now suffixed with the priority index.

### 6.3 Transformative insight = perception reframe, not the top fix (surface #3)

The old instruction ("the insight that would unlock the MOST improvement") pulled `transformativeInsight` into duplicating Priority 1 — on the crochet run the insight and Priority 1 carried the same diagnosis AND the same generative question. Locked rule (`TRANSFORMATIVE_INSIGHT_DIRECTIVE`, crystallizer.ts): the insight is the **deepest UNDERSTANDING / perception reframe** — what the essay is *really about* beneath its surface subject — with a **mandatory strip test**: if it's the #1 priority reworded, it's wrong. Priorities own the FIX; this owns the SEEING. When they coincide, the insight names the WHY-beneath, the priority names the fix — never the same sentence in both. Plus anti-jargon voice rules. **Verified live** ($1.20 run): "Your essay isn't about learning to crochet. It's about… inherit[ing] a survival tool and choos[ing] to transform it into a gift" — zero jargon, distinct from Priority 1.

### 6.4 Protected strengths = no internal machinery, name the weakening trap (surface #4)

The unguarded prompt produced `whyProtect` strings that name-dropped the system's own layers to the student ("the entanglements map (ent-2) notes…", "the scoreMatrix gives P1 voice score 92", "structural DNA," "architectural recursion"). Locked rule (`PROTECTED_STRENGTHS_DIRECTIVE`, crystallizer.ts): **HARD BAN** in student-facing strings on internal layer names (North Star, score matrix, admissions positioning, distinctiveness signature, entanglements/ent-N, through-line, MEM), raw dimension scores, and analyst jargon. Make protection **actionable**: name why the move works in human terms + the **concrete weakening trap** (the specific plausible "improvement" that would gut it), not the vague "any revision that dampens this." **Verified live**: banned-jargon check came back empty; "If you smooth that aside into a normal transition because it feels too casual, you lose the wink."

**General lesson for the remaining surfaces:** the biggest single failure mode across L4 surfaces is the prompt letting the model cite the system's OWN internal layers (North Star/scoreMatrix/entanglements/MEM) and raw scores as authority in student-facing prose. Every student-facing L4/L3.75 surface needs the same explicit internal-machinery ban.

### 6.5 AO First Read — CUT (was 🟢 keep+surface; ungrounded simulation, 2026-05-30)

`aoFirstRead` (gutReaction / putDownRisk / committeeOneLiner / distinctivenessSignal / hookMoment) was a simulated admissions-officer "gut reaction." **Removed entirely.** Reason: it ran context-free on raw essay text (parallel with L1), with **no access to archetype, pool density, or any selectivity calibration** — so it *performed* the emotion of a tired AO ("4:15pm, 29th essay") while **inventing the judgment** from nothing. Output was plausible-sounding but ungrounded ("real stakes," "this kid has something to say," low put-down-risk on a *common* archetype) — a strip-test failure (theater, not insight), and worse, it **poisoned downstream consumers** (the L6 coach injected `"AO PERSPECTIVE: ${gutReaction}"`, the exec brief, and an auto-finding all consumed the fake signal). A convincing-but-fabricated read misleads the student with false confidence. The **grounded** competitive signal — L3.75 `admissionsPositioning` (archetype, poolDensity, differentiator, AO takeaway), which *does* have pool context — stays and carries the load. Removal was full: deleted `aoFirstRead.ts`, the profile field, the generator, and every consumer block (orchestrator/exec-brief/coach/presentation), verified `tsc`-clean + 0 residual refs + tests green. **§5 disposition update:** "AO Gut Reaction · Committee One-Liner · Put-Down Risk" move from 🟢 keep+surface to 🔴 cut.

**Lesson (applies to remaining surfaces #7-9):** beware surfaces that *sound* right but are ungrounded — a confident voice can mask invented substance. Ask of each: is this judgment *derived* from real signal the layer actually has, or *assumed*? The AO read failed because it had nothing to be representative against.

### 6.2 The universal writing-quality bar (every student-facing surface)

Locked 2026-05-29 from the temporal-leap progression. This is the bar every student-facing surface writes against — not just priorities. The 4-beat priority anatomy (§6.1) is a specialization of this for the action layer.

**Three meta-principles (load-bearing):**

1. **Strip test (unique insight).** A surface earns its place only if its insight is unavailable by reading the priorities, strengths, or other surfaces. Test: strip any "→ Priority N" line. Is there still a unique insight left? If no, it's a reorganization, not a surface — cut it.
2. **Human mentor voice.** Write like a sharp, warm writing mentor talking to a 17-year-old — not a system emitting labeled data. No all-caps section headers ("YOUR VOCABULARY FINGERPRINT"). No internal jargon ("earnedness map," "civic-abstract domain," "structural roles"). Quote the student's actual words. Point at their own strongest moment as the model for fixing their weakest.
3. **Action mandate.** Every surface drives revision, improvement, or change. Never a summary of "what the essay does." If what's done is done and the observation leads nowhere, cut it.

**Eight writing rules (all non-negotiable):**

1. **No filler transitions.** Open on the insight. Kill "There's a habit worth catching," "Here's the thing," "It's worth noting."
2. **State a concept once, then deepen.** Never restate it in fresh words for emphasis — that reads as padding and bores on repeat.
3. **Concrete beats general.** The student's specific line/moment, not the principle behind it ("the hook finally obeyed," not "show don't tell").
4. **No obvious conclusions.** Delete "once you see it you'll catch it," "this will make your essay stronger." The student knows.
5. **Every sentence advances.** New information or new depth, or the sentence is cut.
6. **Generate, don't just diagnose.** Hand the student a concrete, sensory, expandable DIRECTION that stimulates their imagination — a door to walk through, not homework off a diagnosis. Showing what the fix could hold is half the job; the other half is making them want to write it.
7. **Show craft / domain expertise.** Use the real vocabulary of the essay's world (crochet mechanics, music theory, lab technique, debate structure — whatever it is). Generic guidance reads as a system; expert guidance reads as a mentor who actually gets it.
8. **Contextualize every move.** No cold jumps. A contrast names what it refers to before leaning on it.

**Mode-matching guard:** Rule 6 (generative guidance) and Rule 7 (domain expertise) must match the essay's actual mode. Sensory/imagery is appropriate when the essay is sensory; a debate essay's door is logical structure + stakes, a research essay's door is the unshown decision or failed result. **Do not default to imagery.** Same guard as §6.1's mode-matching note, lifted to apply universally.

**The worked-example progression (study the failures):**

The temporal-leap insight on the Crochet essay, taken through four drafts:

*1. System jargon, terse, hollow (the original failure mode):*
> "WHERE YOUR ESSAY'S CLAIMS REST (full earnedness map). P4S2 'channeled the magic' — under-earned: no scene shows the turning point → Priority 1. The pattern: you assert outcomes without staging the moment they happen."

*Why it fails:* all-caps system header. Internal jargon ("earnedness map"). Number-and-arrow report shape. The "→ Priority 1" repackages a priority. Strip the priority line and almost nothing remains.

*2. Mentor voice but repetitive + filler + diagnosis-only:*
> "There's a habit running through your essay worth catching: at your biggest moments, you hand us the outcome but skip the moment it happened... The fix is never 'explain more.' It's 'show the one moment.' Your strongest paragraphs show; your weakest ones announce... Once you see this pattern in yourself, you'll catch it every time you reach for a tidy ending."

*Why it fails:* dead opener. Show-vs-tell restated four times in different words. Useless obvious closer.

*3. Tight but diagnosis-only:*
> "You skip the moment things turn. 'I learned to channel the magic of the crochet hook' — but never the afternoon it finally obeyed. So this isn't four moments to patch. It's one habit — and you've already broken it once."

*Why it fails:* no generative guidance. The student is told to "show the moment" with no direction. Still half a job.

*4. The bar (diagnosis compressed; generative direction with domain expertise; contextualized):*
> "You skip the moment things turn. 'I learned to channel the magic of the crochet hook' — but never the afternoon it finally obeyed.
>
> So show that afternoon. What does channeling the magic actually feel like? The yarn-over that used to snag pulls through clean; you stop counting stitches because your fingers already know the gauge; the chrysanthemum petal that always curled finally lies flat. That instant — when the hook stops being something you fight and becomes an extension of what you imagine, your hands moving in and out of the loops without you telling them to — *that's* the magic. Right now it's a word. Make it the moment your hands started knowing.
>
> You've done this once already: the scene where the hook fights you and the stitches unravel is the most alive writing in the essay, because you let us watch it happen. Do that for the turn that matters most."

*Why it lands:* diagnosis is one line. Generative guidance with real crochet mechanics (yarn-over, gauge, the loop, petals curling) opens a door without writing the sentence for the student. "You've done this once already" contextualizes the contrast before naming the struggle scene. Every sentence advances.

**Tight prose ≠ hollow.** The 60–100 word target from §6 (and the 110–150w priority exception in §6.1) is about cutting repetition, not stripping meaning. A surface should be exactly as long as it needs to genuinely help — every sentence earning its place — and no longer. Draft 3 above is too short because it does only half the job; Draft 4 is longer but justified.

**Reference register:** the chat-panel mock messages (`src/components/chat/ChatPanel.tsx`'s "garden metaphor / 6am weeding" turn) are the voice baseline. The labeled-section dumps from the original Crochet output are the anti-pattern.

---

## 7. Backend work implied

| Work | Scope | Risk |
|---|---|---|
| Reframe prompts (L3.75 + L4 emit observation→diagnostic→revision structure tied to priority refs) | Largest change | Needs verification |
| `nextPhaseLook` field on phaseAssessment | Fold into existing call | Low |
| Voice Range derivation | Pure derivation, $0 | Low |
| Phase-gating generation of deepest layers | Orchestrator logic | Medium (dependency guard) |
| Cuts: distinctivenessSignature, growthEdges, structuralChoices, memorability | Prompt edits | Needs re-verification per careful-cuts mandate |
| Per-paragraph L5: gate to action-mode only | `deepAnnotationService` filter | Low |
| Trajectory filter: drop paths overlapping priorities | Assembler logic | Low |
| Renderer: implement layout; omit empty sections; numbers only paragraph-anchored | New render layer | Medium |

## 8. Cost impact (rough)
- Reframe changes: ~neutral (same observations, restructured)
- Genuine cuts: ~$0.10–0.15 saved
- New fields: ~$0 (fold into existing calls)
- Per-paragraph action-only: ~$0.10–0.15 saved
- Generation-gating weak essays: variable savings (Foundation/Architecture essays skip the deepest layers)
- **Net: pipeline trends cheaper while output gets more actionable AND phase-appropriate**

## 9. Tally (corrected after careful cuts audit 2026-05-28)
🟢 Keep+surface: 18 · 🟡 Reframe: 14 · 🔵 Internal: 14 (+3 reclassified from cut) · 🔴 Render-only cuts: 6 · ⚠️ Gated emission cut (pending A/B): 1 (structuralChoices) · ♻️ Reborn higher-phase: 3 · ➕ New: 2

## 10. Careful cuts audit findings (2026-05-28)

The "8 genuine cuts" from the editorial pass did not survive consumer + thinking-scaffolding review. Each of the 4 audited cuts:

1. **distinctivenessSignature** — REVERSED. Load-bearing North Star dimension; feeds L3.5 (analysisContextBuilder:178), L5 (deepAnnotationService:2124, unguarded — would crash on cut), and North Star maturity (essayProfileManager:3544). Not redundant with AdmissionsPositioning. → 🔵 internal + render via distinctivenessFactors.
2. **growthEdges** — REVERSED. `extractL375Candidates` (analysisOrchestrator:1946) harvests `pairedImprovement` → L4 priorities. It FEEDS the Coaching Map. → 🔵 internal + cut render.
3. **structuralChoices** — terminal (only `tests/dump-full-profile.ts:625` reads it) + actionable content already in priorities/strengths. But may be thinking-scaffolding → ⚠️ A/B before emission cut.
4. **memorability** — feeds router compressed summary (profileRouter:2941) + carry-forward (holisticSynthesis:3548). → 🔵 internal + cut render.

**The error pattern:** the editorial "X is covered by Y → cut X" reasoning was often backwards — X FEEDS Y (growthEdges→priorities, distinctivenessSignature→L5 context). The careful pass caught this.

**Entanglement starvation (root cause of distinctivenessSignature emptiness):** entanglements is the LAST of 6 Phase B sections (holisticSynthesis), and the prompt (line 539) instructs the LLM to skimp it under output-budget pressure. Crochet emitted `entanglements: []` not because it had none but because it ran last. Fix: dedicated micro-call (mirror signatureMove pattern, Promise.allSettled). This starves distinctivenessSignature, which synthesizes from entanglements. (Task #53.)

**Reverse audit (🔵 internal items — do any deserve to surface?) — resolved 2026-05-29:**

Of the three candidates auditioned for promotion to phase-gated surfaces, only one survives the strip test (§6.2 meta-principle 1):

- **Character `growthArc` → CUT (failed strip test).** The proposed surface ("incompetent inheritor → skilled practitioner → cultural bridge-builder; third stage is asserted not earned → Priority 2") reorganized the MEM gaps + Priority 2 under an "arc of self" heading. Strip the priority line and the unique insight is the same as MEM. Stays 🔵 internal (rewrite generator uses `intellectualFingerprint`).
- **Voice Map `vocabularyDomains` → CUT (failed strip test).** The proposed surface ("you write from four word-worlds; civic-abstract is borrowed → Priority 2") reorganized Voice Range + the voice signature reframe under a "vocabulary fingerprint" heading — a fourth angle on the same P5 drift already named in three other surfaces. Stays 🔵 internal (rewrite generator StyleProfile input).
- **MEM cross-gap meta-pattern → SURFACE at Craft+ (passes strip test).** The per-moment list fails (repackages priorities), but the meta-pattern — *"you assert outcomes without staging the moment they happen"* — is unique across-priorities content no individual priority contains. Surface this ONLY, in the §6.2 writing register; cut the per-moment list. Belongs in the Profile tab as a Craft+ insight, not Distinction-only (the pattern is true and useful at any phase where it holds).
- **Cross-Dimension Entanglements → SURFACE at Polish/Distinction.** Confirmed contingent on the micro-call fix (Task #53) actually populating them. Entanglements ("voice-shift at P2S4 IS the thematic pivot") are dimension-intersection insights unavailable in any other surface — strong strip-test pass.

The audit recovered ONE genuine surface promotion (MEM meta-pattern) + ONE contingent promotion (entanglements after the micro-call fix). It correctly rejected two reorganizations dressed as new surfaces. **The strip test is the unlock — without it, "more surfaces" becomes "more places that re-say the priorities."**
