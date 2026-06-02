# FORGE DEBATES: Writing Craft — Reality Check & Forced Choices

> Reality Checker assessment grounded in codebase verification.
> Date: 2026-03-19

---

## Part 1: Reality Verification

### Source Material Examined

1. **coachingService.ts** (full Stage 3 prompt construction, lines 1351-1754)
2. **piq/teachingExamples.ts** (507 lines, ~20 before/after pairs with rich metadata)
3. **tests/output/conversator-v2-e2e-audit.txt** (10-turn coaching session, piano-essay)
4. **Finding injection** via `buildFindingCoachingContext()` (lines 3170-3297)
5. **Craft vocabulary** via `getCraftVocabularyForPhase()` (lines 77-114)
6. **Pedagogical calibration rules** (lines 122-155)
7. **Session memory / escalation / anti-repetition infrastructure**

---

### Question 1: Is Agent B right that the LLM already knows HOW to demonstrate?

**VERDICT: Partially right, but incomplete.**

The evidence is mixed. The Stage 3 system prompt already contains an explicit "CONCRETE DEMONSTRATION" mode (lines 1417-1466) with:
- A clear definition: "when the student needs to SEE the possibility"
- Instructions to use student details, not fabricated ones
- A good example vs. bad example pair
- 8 named craft moves (inventory opening, sensory timestamp, etc.)
- A prohibition against fabricated details

So yes, the LLM has been TOLD how to demonstrate. But the audit shows it consistently chooses NOT to demonstrate despite ample opportunity. Across 10 turns:
- Turn 2: "Before I show you what a scene-based opening could look like, I need to know..."
- Turn 3: "But I need your details before I can show you what that looks like."
- Turn 4: "Need specific Chopin-jazz discovery moment to demonstrate what 'in the room' voice sounds like."
- Turns 6-9: Blocks all coaching until student answers questions.
- Turn 10: Forced choice ultimatum, no demonstration.

**Zero demonstrations in 10 turns.** The LLM has the instruction but never fires it. Agent B is right that the LLM KNOWS how — but the catch-22 diagnosis is only one of the causes. The coach also over-prioritizes information collection, which is a separate prompt-level problem.

### Question 2: Would Agent A's static exemplars improve coaching, or be ignored?

**VERDICT: Mixed — useful but not in the way Agent A thinks.**

The PIQ teaching examples are well-structured (507 lines, ~20 pairs with issueType, dimension, weak/strong, explanation, diffHighlights, principle). They are designed for a DIFFERENT context: PIQ workshops where the coach generates feedback ABOUT the student's essay, then shows a before/after as illustration.

In the Conversator, the coach is in DIALOGUE — the student hasn't asked "show me how to fix a weak hook." They've asked "what do you think of my essay" and "is the opening specific enough?" Injecting a generic before/after about a robotics club president when THIS student is writing about piano and hackathons would feel disconnected. Agent B's "WebMD article mid-surgery" analogy has merit here.

**However**, Agent A's exemplars could serve a different purpose: not as content to SHOW the student, but as format calibration for the LLM. The LLM sees the craft move names but has no concrete anchoring for what "summary to scene" looks like in practice. A few compact examples (not 30) in the system prompt could calibrate the LLM's internal model of what a good demonstration looks like.

**The question is: does Sonnet need format examples to produce good demonstrations?** Given that the current prompt already has one good/bad coaching comparison (lines 1428-1446) and the LLM still never demonstrates, the answer is probably NO — the format isn't the bottleneck. The decision to demonstrate is.

### Question 3: Is the "prerequisite catch-22" the real root cause?

**VERDICT: It is A root cause, but not THE root cause. There are three distinct problems.**

The audit reveals three separate failure modes:

**Problem A: The Catch-22 (Agent B's diagnosis)**
Turns 2-4 show the pattern clearly: "I need your details before I can show you" -> student gives partial details -> "I need MORE details before I can show you." The coach COULD have demonstrated with available material at Turn 3 (hackathon context was rich enough for a sample scene) but instead deferred. This is real.

**Problem B: Over-collection / gatekeeper mode**
Turns 6-9 show a different problem: the coach becomes a GATEKEEPER, refusing all coaching until three prerequisites are met (revised P1, Mrs. Chen decision, hackathon details). This is not a catch-22 — the coach has enough information to demonstrate ANY of the three architectural options (A/B/C from Turn 10). It could write a sample Mrs. Chen opening, a sample hackathon opening, and a sample parallel-philosophy opening, showing the student what each feels like. Instead it demands the student decide FIRST.

**Problem C: No finding-to-technique routing**
The findings are injected as `[F1] [emerging/high] P1 [voice] The opening operates in summary mode...` but there is NO mapping from that finding to a specific coaching technique. The LLM sees the finding and has to improvise what to DO about it every turn. Both agents identify this, though they frame it differently.

### Question 4: Would Agent A's phase toolkits actually change LLM behavior?

**VERDICT: Marginal improvement at best. The existing guidance is already quite specific.**

The current prompt has:
- 5 phase-specific blocks (foundation/architecture/craft/polish/distinction) at lines 1566-1575
- Phase-gated craft vocabulary (9 technique names at craft, 7 at polish)
- Pedagogical calibration rules for confused/foundation/architecture/resistance/breakthrough states
- 5 coaching mode examples (instruction, dialogue, productive confusion, concrete demonstration)
- 8 craft move definitions

Agent A proposes replacing "15-line phase coaching" with "50-line per-phase toolkits" adding MIRROR/FORCED CHOICE/IDENTITY PROBE/SCENE HUNT for foundation and CRAFT MOVE NAMING/SIDE-BY-SIDE/WEIGHT TEST/VOICE COMPARISON for craft.

But the current prompt already covers most of these:
- "MIRROR" = the existing DIALOGUE mode example (read two sentences back to back)
- "FORCED CHOICE" = Turn 10 already does this (A/B/C) with NO toolkit — the LLM invented it
- "IDENTITY PROBE" = the existing "What do you want admissions officers to understand about you?"
- "SCENE HUNT" = the existing detail collection instructions (lines 1469-1495)

The toolkit names are new labels for behaviors the prompt already describes. Adding them would increase system prompt tokens without proportional behavior change. The LLM already KNOWS these moves — it uses several of them in the audit (mirror in T4, forced choice in T10).

### Question 5: Is Agent B's technique router different enough from Agent A's issue pathways to matter?

**VERDICT: They are functionally equivalent with different data models.**

Agent A: 30 IssuePathway entries mapping `issueType -> technique -> coachingDirective -> probeQuestion -> exemplarIds`. Injected alongside findings.

Agent B: 15-20 TechniqueRouter entries mapping `diagnosis -> technique -> teaching directive`. Injected per-turn based on findings.

The core idea is identical: given a finding, tell the LLM what coaching technique to use. Agent A adds exemplar references and probe questions. Agent B keeps it minimal and relies on the LLM to generate personalized material.

The key difference: Agent A's pathways include a pointer to static before/after examples. Agent B explicitly rejects static examples. The routing logic itself is the same.

---

## Part 2: Forced-Choice Synthesis

### GAP 1: Exemplar Registry — RETHINK (B), with one element from A

**Reject** Agent A's 30-exemplar registry. The Conversator prompt already has one good/bad pair and 8 craft move definitions. The LLM's failure is not "I don't know what a good demonstration looks like" — it's "I've decided I need more information before demonstrating."

**Keep from A**: The ISSUE-TYPE TAXONOMY (12 types: summary-not-scene, manufactured-vulnerability, defensive-retreat, etc.) is genuinely useful. Not as labels for a registry, but as vocabulary for the technique router (see GAP 3).

### GAP 2: Demonstration Engine — HYBRID (primarily B's framing, A's trigger mechanism)

**Agent B wins the framing**: "Demonstration as exploration" is the correct mental model. The coach should write competing samples WHILE collecting context, not after. This breaks the catch-22.

**Agent A wins the trigger mechanism**: `shouldTriggerDemonstration()` checking `contextAccumulation > 100 chars + (same topic 3+ turns OR consecutive resistance 2+ turns)` is a concrete, implementable heuristic. Agent B's framing is conceptually correct but has no trigger — it's a prompt section, not a decision function.

**Synthesis**: A prompt-level directive (Agent B's "DEMONSTRATION AS EXPLORATION" mode) that ACTIVATES based on Agent A's trigger conditions. When triggered, inject a hard directive: "You have enough material. DEMONSTRATE NOW. Write 2-3 sentence samples using the student's own details to show them what the options feel like. Do NOT ask for more information."

### GAP 3: Issue Pathways / Technique Router — REFINED (neither design as-is)

Both designs are too heavy. 30 IssuePathway entries at ~50 tokens each = 1500 tokens of static content in the system prompt that will be irrelevant most turns (only 1-2 findings are in focus per turn).

**Refined approach**: A lightweight routing FUNCTION (not a static registry) that, given the turn's focus findings, emits a 1-2 line coaching directive. This is code, not prompt content.

```
Finding claim contains "summary" + "scene" -> "TECHNIQUE: summary-to-scene. Show the student what their own material looks like as a scene. Name the craft move."
Finding claim contains "vulnerability" + "retreat" -> "TECHNIQUE: sustained vulnerability. Quote where they pulled back. Ask what they're protecting."
```

~15 mappings, stored in code, with only the MATCHED directive injected into the prompt (~50-100 tokens per turn, not 1500 static tokens).

### GAP 4: Phase Toolkits — REJECT (neither)

The existing phase guidance is already specific and covers the same ground. The audit shows the LLM uses these moves (mirror in T4, forced choice in T10) without being told their toolkit names. Adding named toolkits would increase prompt size without changing behavior.

If phase guidance needs improvement, it should be in the form of finding-matched directives (GAP 3), not generic per-phase toolkit labels.

### GAP 5: Deflection Escalation — DIRECT (A), already partially implemented

The codebase ALREADY HAS confusion escalation (W6.2, `confusionTrackers`, `buildEscalationContext`). Agent A's deflection counter/ladder is the same pattern for a different signal (deflection vs. confusion).

The audit shows this is needed: turns 6-9 are the coach manually escalating. By turn 8 it says "I've asked you three times." By turn 10 it forces A/B/C. The LLM figured this out organically through the session journal. The question is whether to formalize it.

**Verdict**: Light formalization. The session journal + strategic question staleness already signal deflection. A small addition to the `estimateResponseIntensity` or `buildEscalationContext` that detects "student asked about X without providing Y for N turns" and injects a prompt escalation would help. Not a full separate counter system — leverage what exists.

---

## Summary of Forced Choices

| Gap | Choice | Rationale |
|-----|--------|-----------|
| GAP 1 (Exemplar Registry) | **RETHINK (B)** | LLM knows format; static examples disconnected from student material |
| GAP 2 (Demonstration) | **HYBRID (B framing + A trigger)** | "Demo as exploration" + concrete trigger conditions |
| GAP 3 (Issue Routing) | **REFINED** | Lightweight code-side router, not static prompt bloat |
| GAP 4 (Phase Toolkits) | **REJECT** | Existing guidance is sufficient; LLM already uses these moves |
| GAP 5 (Deflection Escalation) | **DIRECT (A)** | Extends existing W6.2 pattern; partially working already |
