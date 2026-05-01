# Phase 2 Prompt Benchmark — Round-1 Draft

**Date:** 2026-05-01
**Branch:** `feat/integrated-pipeline-build`
**HEAD:** `396c56a`
**Status:** Round-1 draft. **Awaiting Tue ratification before any Phase 2 prompt drafting begins.**
**Scope:** This doc ratifies the framing, principle stack, and per-layer extension templates that every Phase 2 prompt (D-2.2, D-2.3, D-2.4, D-2.5, D-2.6) measures against. It is the round-0 quality gate that fires before length/tone/evidence-grounding checks at every prompt revision round.

---

## §0 — How this doc was built

**Foundation reads** (Track A, complete): every Phase 0 + Phase 1 file Phase 2 reads from or extends, at the file:line level. Documented in `PHASE_2_FOUNDATION_GROUND_STATE.md`.

**Edge function prompt extraction** (Track B, complete): the four Supabase edge function prompts that produce decent-but-not-at-our-level output:
- `supabase/functions/workshop-analysis/index.ts` (583 lines, 4 Sonnet calls — voiceFingerprint, experienceFingerprint, 12-dimension rubric, surgical workshop items).
- `supabase/functions/validate-workshop/index.ts` (250 lines, 1 Sonnet validation pass).
- `supabase/functions/teaching-layer/index.ts` (569 lines, 1 Sonnet teaching enhancement).
- `supabase/functions/piq-chat/index.ts` + `systemPrompt.ts` (337 + 286 lines, conversational coaching).

**Spec-drift name correctness applied** (per Tue's 2026-04-30 directive): every production method cited below has been grep-verified against current `src/`. Conceptual names from prior spec docs are flagged where they appear.

**Tue's three load-bearing corrections** (2026-04-30) shape the principle stack:
1. **Span-citation is finding-level, not emission-level.** Findings carry the quoted span. Emissions cite the finding and inherit the anchor. Don't enforce per-emission anchor fields.
2. **Connection is aspiration, not per-suggestion gate.** Strong essays (the Harvard ballerina-mouse exemplar) deepen one through-line across paragraphs. Train the system to recognize and reinforce existing connection architecture; don't mechanically attach a `connectsTo` field to every suggestion.
3. **Trained dispositions, not MUST rules.** The goal is the LLM's thinking and recognition pattern lands close to a $500/hr counselor's — naturally tending toward specificity, connection-awareness, and depth because the prompt teaches that thinking, not because the prompt mandates a checklist.

---

## §1 — The three load-bearing principles

Every Phase 2 prompt extension measures against these three principles. They're three faces of the same counselor disposition: *read the particular thing, recognize what it's becoming, help it become the strongest version of that*.

### §1.1 — Tailored, not generic

The feedback is specific to THIS essay's text and architecture (Tue's §5a from the original handoff prompt).

**Operational rule:** the LLM reads the actual essay's voice, register, narrative architecture, central images, through-line(s), thematic vocabulary domains, and the student's attempted argument — and grounds every emission in those specifics. A future contributor reading the LLM's output should see the student's essay, not a template.

**Anti-pattern:** feedback that could appear word-for-word on a different student's essay. Generic counselor language like "consider adding sensory detail" or "show, don't tell" without grounding in this essay's specific moments.

**Recognition test (round-0 quality gate):** sample 3-5 emissions and ask *"could each of these appear word-for-word on a different student's essay?"* If yes for any → the prompt is failing this principle. Revise.

### §1.2 — Flexible, not formulaic (read on the essay's own terms)

The system reads each essay on the terms of *what THAT essay is reaching for*, not against a fixed essay-type lens.

**Operational rule:** during the L3 walk, the LLM DISCOVERS what kind of essay this is — what purpose it's reaching for, what its central reach is — and every later layer's lens is shaped by that recognition. A quiet contemplative essay about a grandmother's hands isn't trying to be a high-stakes dramatic narrative; judging it by stakes/tension/climax misreads it. The reading is open: what is THIS particular essay reaching for?

**Anti-pattern:** closed-taxonomy "essay-type lens" thinking. "This is a vulnerability essay → apply vulnerability lens" or "this is a leadership essay → apply leadership lens." Rule 3 of `feedback_llm-first-design.md` (no closed taxonomies for LLM perception) bans this directly.

**Architectural carrier:** the L3 walk's reading-strategy discovery already exists at `src/services/essayIntelligence/analysis/holisticSynthesis.ts:741` (PHASE_META prompt). The benchmark elevates this to load-bearing: every later layer's prompt MUST reference the discovered reading strategy by name when emitting analysis or feedback. This makes the whole pipeline's output coherent to ONE student's essay rather than a pre-determined rubric.

**Recognition test:** *"could each emission appear on an essay reaching for a fundamentally different purpose?"* If yes → the prompt is applying a generic lens, not reading on this essay's own terms. Revise.

### §1.3 — Best-of-its-kind, not best-by-rubric

Every suggestion points toward the strongest version of what THIS essay is reaching for, not toward a template of what a "good essay" looks like in the abstract.

**Operational rule:** the system's improvement suggestions are oriented toward THIS essay's purpose-on-its-own-terms. A defiant-irreverent essay and a quiet-introspective essay get fundamentally different specific suggestions because their purposes differ — but both get the same QUALITY of thinking from the system: deep, particular, oriented toward the strongest version of what THIS essay is becoming.

**Anti-pattern:** rubric-driven suggestions that rank dimensions on a fixed scale. If the system observes "stakes are low" in a quiet contemplative essay and recommends "raise the stakes," that's rubric-thinking — it's pointing toward a generic strong essay, not toward THIS essay's strongest version. The strongest version of a quiet contemplative essay deepens the restraint, not adds tension.

**Best-of-its-kind judgment is LLM judgment** (Rule 1 of `feedback_llm-first-design.md`). The system doesn't carry a database of "best vulnerability essay shapes" or "best identity essay shapes" to pattern-match into. The walk reads the essay, recognizes what it's reaching for, and articulates what the strongest version of THAT reach would look like.

**Recognition test:** *"if this suggestion landed perfectly, would the result be the strongest version of THIS essay, or a closer approximation of a generic strong essay?"* If the latter → the prompt is applying a rubric template, not best-of-its-kind judgment. Revise.

---

## §2 — The round-0 quality gate (two-test swap pattern)

At every prompt revision round (round 1, round 2, round 3+), this gate fires BEFORE any other quality check (length, tone, evidence-grounding, anti-fluff, anti-repetition):

1. **Sample 3-5 emissions** from the round's output (or from the prompt's worked examples on round 1).
2. **Test 1 — Tailored swap:** could each emission appear word-for-word on a *different student's essay*? If yes for any → revise.
3. **Test 2 — Purpose swap:** could each emission appear on an essay *reaching for a fundamentally different purpose*? If yes for any → revise.
4. **Only after both swap tests pass** → check length, tone, evidence-grounding, anti-fluff, anti-repetition, connection-aspiration recognition.

If a prompt fails the swap tests, the prompt's *thinking pattern* is broken (it's grading from a rubric, not reading a particular essay). Fix the disposition, not by adding required fields. Per Tue's three corrections: trained dispositions, not MUST rules.

The swap tests run on **finding-level emissions** (where the span anchor lives), not on every downstream suggestion derived from a finding. A suggestion derived from a tailored finding inherits the anchor; the suggestion itself can be locally focused without re-citing the span.

---

## §3 — Principles to imitate from the edge function prompts

The four edge function prompts are one-shot prompts that gesture at the three principles without nailing them. They produce decent-but-not-at-our-level output. The recognition: their *framing moves* are partially-correct partial-instances of what we want; their *structures* are constrained by being one-shot calls. Imitate the framing; don't import the structures.

### §3.1 — From `piq-chat/systemPrompt.ts` (the closest of the four to counselor tier)

**Strongest moves to imitate:**

1. **Counselor identity established viscerally** (lines 12-16): *"You are a warm, insightful UC PIQ essay coach who genuinely cares about helping students tell their authentic stories. You're like that English teacher who actually gets it — the one who makes you excited to revise because they see what your essay could become."* Not a role description; a CHARACTER. The LLM internalizes the disposition by inhabiting the character.

2. **Sound-Like / Not-Like-This voice training by demonstration** (lines 32-50): real example phrases the LLM should produce vs banned phrases. *"Sound Like This: 'Okay, so here's what I'm noticing...' / 'This part? Chef's kiss. Keep it exactly as is.' / 'Real talk: this ending is a little flat.'" "Not Like This: 'Per the rubric guidelines...' / 'Your score in dimension X is suboptimal...'"* The LLM learns tone by seeing it, not by being told about it.

3. **"Use Their Language"** (line 50): *"If they say 'Why is my score trash?' don't respond with 'Your NQI of 58 indicates...' Say 'Your score is low because right now this reads like a resume, not a story.'"* Tonal mirroring instructed explicitly.

4. **"CRITICAL AWARENESS — Not Rules to Avoid, But Things to Notice"** (line 52): explicit framing of soft guidance. Rule 5 of `feedback_llm-first-design.md` (soft guidance over hard blocklists) operationalized.

5. **Specific-quote-then-celebrate-specifically** (line 64-65): *"Instead of: 'Keep this sentence.' Say: 'Okay, "Most Wednesdays smelled like bleach and citrus" — this? This is good. It's specific, it's sensory, it grounds us in your world.'"* The pattern: quote the student's actual words, name what's working specifically, ground the praise in a craft principle.

6. **Self-discovery questions** (lines 26, 113): *"What scared you about that moment?" "Why did THAT detail stick with you?" "What were you ACTUALLY thinking in that moment? Not what you thought you should think — what was REALLY going through your head?"* Socratic counseling, not lecture.

7. **VOICE PRESERVATION as #1 in the avoid-list** (line 218): the system serves the student's voice, doesn't impose ours.

### §3.2 — From `workshop-analysis/index.ts`

**Strongest move to imitate:**

**The Authenticity Test at generation time** (lines 374-376): *"Could only THIS person have written this? If yes → unique voice. If anyone could have written it → too generic, needs more of THEIR emotional truth."* This is the swap-test built into the prompt itself (round-0 quality gate at GENERATION TIME, not just at review time). Phase 2 prompts should embed this as a self-check the LLM applies as it produces each emission.

**Concrete contrast pairs** (lines 402-408): *"Good: 'I traced the circuit three times before realizing I'd swapped the resistor values. The LED stayed dark. My lab partner had already left.' Bad: 'I noticed the circuit wasn't working. I realized I needed to be more detail-oriented.'"* Side-by-side good/bad examples teach by demonstration what specificity feels like at the actual sentence level.

### §3.3 — From `teaching-layer/index.ts`

**Strongest moves to imitate:**

1. **HOOK + DEPTH layered structure** (lines 94-98): *"Every response has TWO LAYERS: 1. HOOK (short, attention-grabbing preview that draws them in). 2. DEPTH (full explanation with detail, examples, and strategic context). The hook makes them want to click 'View More.' The depth delivers transformative teaching."* Solves the "high-school students only read engaging content" problem structurally. Phase 2 emissions should follow this pattern: a one-sentence hook the student wants to engage with + a deeper explanation underneath.

2. **VALIDATE BEFORE CORRECTING** (line 312): explicit instruction to acknowledge what they did right before naming the gap. Counselor disposition encoded.

3. **Reader-psychology grounding** (lines 137-138): *"UC readers process 50+ PIQs per hour in November-December. First 30 seconds? They decide: 'invest mode' (lean in, connect) or 'scanning mode' (skim for competence)."* Concrete admissions reader behavior in the prompt grounds suggestions in reality, not abstract craft.

### §3.4 — Cross-cutting: existing L3 walk prompt at `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts:186`

The L3 walk's existing prompt (the `SYSTEM_PROMPT_TEMPLATE`) is **already strong** and Phase 2 inherits its discipline rather than rewriting it. Specifically:

- **"Literature PhD who has read 10,000 college application essays"** identity (line 186) — counselor-tier reader.
- **Understanding-only contract** with FORBIDDEN VOCABULARY rule (line 192) banning evaluative words. The carve-out at `improvementCandidate` is the ONE permitted prescriptive surface (lines 448-465). Phase 2 prompt extensions for L3 walk MUST preserve this Understanding-only framing.
- **SURFACE → STRUCTURAL → ARCHITECTURAL** depth ladder (lines 197-234) with concrete upgrade examples and patterns to push past.
- **Evidence grounding as cognitive forcing function** (lines 236-243): "Every observation MUST cite specific text — quote the actual words." Findings already inherit this; per Tue's correction §1.1, Phase 2 emissions don't repeat the citation — they reference the finding which carries it.
- **Novelty-driven growth** (lines 245-250): P5 produces focused output. Anti-repetition by construction.
- **Observation Economy test** (lines 252-256): "Would a competent English teacher already know this? If YES — do NOT produce." The "earn its spot" rule.

---

## §4 — One-shot tendencies to NOT carry over

The edge function prompts are constrained by being one-shot. Their structures co-locate Understanding + Analysis + Feedback into a single call because they have to. Our interconnected pipeline explicitly separates these layers (per `PHASE_2_FOUNDATION_GROUND_STATE.md` §4). Carrying over their structural choices would re-import the antipatterns the L5 design explicitly removed.

### §4.1 — Closed taxonomies for LLM perception

**Antipattern:** `workshop-analysis/index.ts:207-225`'s `experienceFingerprint` shape — six fixed dimensions (`unusualCircumstance | unexpectedEmotion | contraryInsight | specificSensoryAnchor | uniqueRelationship | culturalSpecificity`) with required JSON shape. The LLM can only express uniqueness in those six shapes; "ironic juxtaposition" or "structural inversion" or "vocabulary domain collision" can't be expressed.

**Why it's banned:** Rule 3 of `feedback_llm-first-design.md` (no closed taxonomies for LLM perception). The taxonomy becomes a ceiling on system intelligence.

**What to do instead:** the LLM describes uniqueness freely in prose. The system uses 3-4 functional routing tags (e.g., `appliesToParagraph`, `crossParagraph`, `affectsScoring`) for downstream routing — not perception.

### §4.2 — Banned-phrase regex / blocklists

**Antipattern:** `teaching-layer/index.ts`'s "Don't use AI-sounding words ('tapestry', 'testament', 'delve', 'showcase', 'underscore')" — a closed banned-word list. `validate-workshop/index.ts:55-67`'s "Red flags: 'journey', 'passion', 'grew as a person', lists of 3 adjectives."

**Why it's banned:** Rule 4 of `feedback_llm-first-design.md` (no whack-a-mole pattern matching). The LLM will always produce novel phrasings that dodge the regex.

**What to do instead:** the prompt teaches the *thinking* — "would this language make an AO read this as a 'smart kid generic essay' instead of a 'compelling human story'?" — and lets the LLM apply that thinking to whatever specific phrasing this essay uses.

### §4.3 — Character-count minimums

**Antipattern:** `teaching-layer/index.ts:226-241` — `problem.hook: 80-120 chars`, `description: 400-600 chars`, etc. Hard char ranges per field force padding when the natural output is shorter.

**Why it's banned:** violates the "every word earns its spot" rule operationalized by Tue's "anti-fluff, concise-by-default" directive. A 50-word teaching moment that lands precisely is stronger than a 400-word teaching moment padded to fit a minimum.

**What to do instead:** name the *quality bar* in the prompt ("the hook should make a high-school student want to read further"), not the length budget. Length serves content.

### §4.4 — Single-call output mega-shapes

**Antipattern:** `workshop-analysis/index.ts` does voiceFingerprint + experienceFingerprint + 12-dimension rubric + surgical workshop items in one call. The output shape co-locates Understanding ("what's there") + Analysis ("how well") + Feedback ("what to do").

**Why our pipeline separates these:** Phase 1 explicitly separated Understanding (L3) from Analysis (L3.5) from Feedback (L5) so that:
- L3 stays evaluation-free (the FORBIDDEN VOCABULARY rule at `sequentialDeepWalk.ts:192`).
- L3.5 judges with full Understanding context.
- L5 prescribes with both Understanding and Analysis context.

Co-locating these in a single call (the one-shot pattern) means the LLM's judgment contaminates the description, the description contaminates the prescription, and the layered context that makes our pipeline good is lost.

**What to do instead:** every Phase 2 prompt extension preserves the layer's existing scope. L3 walk emits findings + specifics-need within Understanding-only framing. L3.5 emits analysis + specifics-need within evaluative framing. They DON'T blend.

### §4.5 — Closed-enum scoring/magnitude classifications

**Antipattern:** `teaching-layer/index.ts:71`'s `changeMagnitude: 'surgical' | 'moderate' | 'structural'` enum. `workshop-analysis/index.ts`'s `severity: 'critical' | 'high' | 'medium' | 'low'` field on workshop items.

**Why partially banned:** routing/bookkeeping closed enums (e.g., `coachingValue: 'critical' | 'high' | 'medium' | 'contextual' | 'diagnostic'` at `findingStore.ts`) ARE acceptable per Rule 6 (system bookkeeping). What's banned is *closed enums on contextual judgments* the LLM should describe freely.

**The line:** if the enum drives downstream system routing or display, it's bookkeeping (acceptable). If the enum captures the LLM's judgment of contextual quality, it's perception (banned — describe freely).

For Phase 2 specifics-need emissions: `expectedAnswerShape: 'scalar' | 'short_phrase' | 'specific_memory' | 'list' | 'narrative'` is bookkeeping (drives Conversator answer-extractor routing). Acceptable. `consumers: Array<'l3' | 'l3_5' | 'l3_75' | 'l4' | 'l5' | 'finding_maturity'>` is bookkeeping. Acceptable.

### §4.6 — Mandatory predictive numeric outputs

**Antipattern:** `teaching-layer/index.ts:77`'s `estimatedImpact: { nqiGain: number, dimensionsAffected: string[] }` — demands the LLM produce a numeric NQI prediction.

**Why it's banned:** the LLM doesn't actually know the gain. Producing a number suggests certainty the system doesn't have. This is "deterministic-formula-dressed-as-LLM-judgment."

**What to do instead:** the LLM describes the expected effect in prose. If the system needs a sortable signal, derive it from the LLM's qualitative output via a separate Haiku classifier or a deterministic rule.

---

## §5 — Per-layer extension templates (the principles distributed)

Each Phase 2 prompt extension lives in a specific layer with a specific existing scope. The principles deepen when distributed across layers — different from the one-shot version where they'd all be jammed into a single call.

### §5.1 — L3 walk extension (D-2.2) — `sequentialDeepWalk.ts`

**Where it lives:** the `SYSTEM_PROMPT_TEMPLATE` at line 186. ~500 lines. Single coherent prompt.

**What D-2.2 adds:** ~30-50 lines naming the specifics-need contract. Output schema gains `specificsNeedEmissions: SpecificsNeedEmission[]` either at top level or per-finding (decided at round-1 draft).

**Trained disposition (NOT a rule):** when a finding's `deepeningPotential` cannot be advanced by re-reading the text alone, AND the student's lived experience would resolve it, the finding emits a specifics-need entry. The emission flows from the finding (which carries the span citation per Tue's §1.1 correction); the emission itself names what to ask and what answer shape would resolve it.

**Anti-pattern explicitly forbidden:** "every finding with deepeningPotential != null MUST emit." That re-introduces the closed-taxonomy / formulaic-emission antipattern. The emission is a *judgment* the LLM makes ("I cannot advance this from text alone, but the student would know"), not a *consequence* of a checkbox.

**Three principles applied at this layer:**
- **Tailored:** the finding's quoted span anchors the emission to THIS essay's text.
- **Flexible:** the L3 walk's reading-strategy discovery (held in `holisticEvolution`) shapes which findings reach the deepeningPotential threshold for THIS essay's purpose.
- **Best-of-its-kind:** the emission asks for the answer that would help THIS essay reach its strongest version, not for a generic "tell me more about your background" question.

**Production-name verified (per name-correctness discipline):** the production method is `walkEssay` on `SequentialDeepWalkService` at `sequentialDeepWalk.ts:534`. The prompt is at `SYSTEM_PROMPT_TEMPLATE` (line 186, returned by `buildSystemPrompt()` at line 180).

### §5.2 — L3.5 analysis extension (D-2.3) — `analysisPass.ts`

**Where it lives:** multiple system prompts (anchor-paragraph + parallel-paragraph + essay-level mode). The L3.5 layer is the FIRST evaluative layer (per `analysisPass.ts:5`).

**What D-2.3 adds:** prompt extension naming the specifics-need contract on `sentenceAnalyses[]` where `confidence === 'low'` AND `sensitivityNote` references student-side anchors. Output schema gains `specificsNeedEmissions: SpecificsNeedEmission[]` per paragraph analysis.

**Trained disposition:** when a sentence's effectiveness depends on a lived-experience anchor not in the text, the analysis emits a specifics-need entry. The emission flows from the sentence's confidence shape (which carries the reasoning + sensitivityNote); the emission asks for the anchor that would resolve the confidence ambiguity.

**Anti-pattern explicitly forbidden:** "every low-confidence sentence MUST emit." Many low-confidence sentences resolve from re-reading or from broader Understanding context; only the ones that *truly* need student input emit.

**Three principles applied at this layer:**
- **Tailored:** the sentence's evidence reference anchors the emission to THIS sentence in THIS essay.
- **Flexible:** L3.5 reads the essay through the reading-strategy lens L3 discovered. A sentence's confidence is judged against THIS essay's purpose, not a generic effectiveness rubric.
- **Best-of-its-kind:** the emission asks for the lived-experience anchor that would let THIS essay reach its strongest version of what THIS sentence is reaching for.

### §5.3 — L3.75 holistic extension (D-2.4) — `holisticSynthesis.ts`

**Where it lives:** four system prompts.
- `SYSTEM_PROMPT_PHASE_A` at line 328 (voiceIdentity + voiceMap + emotionalTopography + momentEarnednessMap + entanglements).
- `SYSTEM_PROMPT_PHASE_B` at line 524 (thematicArchitecture + narrativeStrategy + characterRevelation + craftAssessment + admissionsPositioning).
- `SYSTEM_PROMPT_META` at line 741 (walk validation + reading strategy + convergence).
- `SYSTEM_PROMPT_CURATION` at line 810 (question queue curation).

**What D-2.4 adds:** prompt extensions across PHASE_A and PHASE_B for emissions from four contributors:
- `momentEarnednessMap.gaps[]` (PHASE_A) — moments that aren't earned; gaps name what's missing.
- `voiceIdentity.authenticVsPerformed[]` flagged "performed" (PHASE_A) — voice flagged but evidence is thin.
- `admissionsPositioning.redFlags[]` (PHASE_B) — red flag identified but severity depends on context the essay doesn't show.
- L4's `intentBridge.alignments[]` mismatches (cross-references L4; emission lives at L4 layer per §5.4).

**Distribution decision (round-1 draft default):** emissions emit per phase. Phase A's extension covers voice/earned-ness emissions. Phase B's extension covers admissions/redFlags emissions. The CURATION phase is unchanged (it merges into the queue at iteration-cycle synthesis).

**Length-budget caution:** PHASE_A is currently 8K max-tokens; PHASE_B is 10K. Output schema additions MUST NOT push token usage past these limits. Emissions go in a separate top-level `specificsNeedEmissions[]` array, kept short (1-2 sentences each per emission).

**Three principles applied at this layer:**
- **Tailored:** the gap/redFlag references the specific moment in THIS essay where the system can't ground its judgment.
- **Flexible:** the L3.75 META phase's reading-strategy is the architectural carrier — every PHASE_A and PHASE_B emission references the discovered reading strategy by name when articulating WHY this gap matters.
- **Best-of-its-kind:** the emission names what would resolve the gap *for this essay's particular purpose*, not for a generic strong-essay template.

### §5.4 — L4 northStar extension (D-2.5) — `crystallizer.ts`

**Where it lives:** `buildSystemPromptL4aNorthStar` at line 360. "You are the Crystallizer — a literary-architectural analyst."

**What D-2.5 adds:** prompt extension naming the specifics-need contract on `confidence === 'hypothesis'` for key fields (`throughLineMap.transformation`, `distinctivenessSignature.articulation`, `intentBridge.alignments`). Emissions ask for the student confirmation that would lock the hypothesis from 'hypothesis' to 'emerging' or 'full'.

**Trained disposition:** when a northStar field is 'hypothesis' confidence AND student input would resolve the ambiguity (vs needing more text or another iteration), the emission asks for that input.

**Anti-pattern explicitly forbidden:** "every 'hypothesis' field MUST emit." Some hypotheses resolve through re-reading (re-walk on iteration N+1); some resolve through carry-forward (the hypothesis matures across iterations). The emission asks for student input only when student input is the *honest* resolution path.

**Three principles applied at this layer:**
- **Tailored:** the northStar references the through-line, structural roles, or distinctiveness signature SPECIFIC to this essay's architecture.
- **Flexible:** active dimensions vary by essay type (`supplement | piq | personal_statement` — closed enum here is appropriate per Rule 6 system bookkeeping). The L4 prompt already scales correctly. Emissions follow the same scaling — `intentBridge` emissions only fire on `personal_statement` essays.
- **Best-of-its-kind:** the emission asks for the confirmation that would help THIS essay reach its strongest version of its discovered through-line.

### §5.5 — FindingStore stuck-hypothesis extension (D-2.6) — NEW SERVICE

**Critical scope expansion** (from `PHASE_2_FOUNDATION_GROUND_STATE.md` §3): there is NO existing finding-maturity-refresh service in the codebase. The spec said "extend the existing maturity-refresh Haiku call's prompt" but the existing call doesn't exist. **D-2.6 must build a new service.** Surfaced for Tue's ratification before the service lands.

**Recommended shape:** new file `src/services/essayIntelligence/findings/findingMaturityRefresh.ts`. Per-finding Haiku call against findings whose `maturity === 'hypothesis'` AND `iterationsAlive ≥ 2` (computed from `lineage[]` timestamp + `IterationLedger.iterations[]` chronology). Asks: *"can this hypothesis advance from re-reading the text alone, or does it need student input? If the latter, what would you ask?"*

**Trained disposition:** a finding stuck at hypothesis maturity for 2+ iterations is the system's signal that text-alone re-reading isn't advancing it. Either student input would (→ emit specifics-need) OR the finding is genuinely speculative and should mature toward `superseded` (→ no emit; FindingStore handles via existing maturity lifecycle).

**Three principles applied at this layer:**
- **Tailored:** the finding's evidence anchors the emission to THIS essay's specific text-evidence chain.
- **Flexible:** the finding's reasoning describes what THIS essay's purpose makes the finding load-bearing for; the emission asks the question that would resolve THIS specific stuck hypothesis.
- **Best-of-its-kind:** the emission asks what would help THIS essay's particular kind of reach.

**Cost target:** ~$0.005/finding × ~3-5 stuck findings per iteration = ~$0.015-$0.025/iteration.

**Production-name verified:** the new service file is `src/services/essayIntelligence/findings/findingMaturityRefresh.ts`. The existing FindingStore at `src/services/essayIntelligence/findings/findingStore.ts` is pure infrastructure (Rule 6) and doesn't change; the new service reads `findingStore.getActive()` and emits to the aggregator.

---

## §6 — The prompt revision protocol (per-prompt Tue ratification)

Per Tue's directive: every Phase 2 prompt revision round gets Tue's ratification at every round (rounds 1, 2, 3+). Don't close a prompt at "passes typecheck" — close at "Tue ratifies the output quality."

### §6.1 — Round flow

1. **Round 0 (this doc):** benchmark ratified before any prompt drafting begins.
2. **Round 1:** agent drafts the prompt against the benchmark. Round-1 quality gate: swap-tests applied to 3-5 imagined emissions. Round-1 draft surfaced to Tue with worked examples.
3. **Round 2:** Tue reviews round-1 draft, critiques output quality (real or simulated). Agent iterates.
4. **Round 3+:** until Tue ratifies the output quality.

### §6.2 — Per-round artifacts

Per the standing operational charter (`L5_IMPLEMENTATION_PLAN.md` §9.4):
- The prompt itself (committed as `prompts/<name>.prompt.ts` or inline in the calling service).
- `<name>.RATIONALE.md` — what the prompt is trying to do, what alternatives were considered, why this version won, what failure modes it's designed against.
- `<name>.fixtures.md` — canonical input examples + accepted outputs (mock outputs derived from existing on-disk fixtures or, post-mid-build-API-touchpoint, real outputs archived).

### §6.3 — Mid-build API touchpoint (D-2.9)

After all five Phase 2 prompts (D-2.2, D-2.3, D-2.4, D-2.5, D-2.6) ratify through round 3+, the D-2.9 sanity check runs ONE essay against the chain. Cost budget: $0.50–$1.00. Pre-spend Tue ratification: name the fixture, expected token count, expected cost, await Tue's "proceed?" before the API call fires. Per `feedback_cost_budget.md`: no tangent runs without separate approval.

If a layer is silent when it should emit (e.g., L3.75's gaps[] are populated but no emission appears), the prompt extension is wrong → return to that prompt's round 4. Hard cap at 2 D-2.9 runs. If second run still silent, halt and escalate.

---

## §7 — What Phase 2 prompts MUST NOT do

Distilling the principles + corrections + LLM-first rules into a forbid-list (these are structural constraints, NOT closed-taxonomy filters on output content):

1. **Don't enforce per-emission span anchor fields.** Findings carry the span. Emissions cite the finding (or finding ID); the anchor is inherited.
2. **Don't enforce per-suggestion `connectsTo` fields.** Connection is aspiration, not gate. Train the LLM to recognize and reinforce connection architecture; let it emit cross-paragraph links when the architecture supports them and skip them when it doesn't.
3. **Don't mandate "MUST emit on condition X" rules.** Train the disposition; let the LLM judge whether emission serves the student.
4. **Don't introduce closed taxonomies on LLM perception.** Routing/bookkeeping closed enums are fine. Closed enums on contextual judgments are banned.
5. **Don't ship banned-phrase regex / blocklists.** Teach the thinking; let the LLM apply it.
6. **Don't enforce character-count minimums or maximums.** Length serves content; quality bar > word count.
7. **Don't co-locate Understanding + Analysis + Feedback in a single layer's prompt.** Each layer preserves its existing scope.
8. **Don't demand mandatory predictive numeric outputs.** The LLM doesn't know the gain. Describe in prose; derive sortable signals deterministically downstream if needed.
9. **Don't re-enforce evaluative vocabulary in Understanding layers (L3 walk).** The FORBIDDEN VOCABULARY rule at `sequentialDeepWalk.ts:192` stays load-bearing. The `improvementCandidate` carve-out is the ONE permitted prescriptive surface; new emissions don't add a second carve-out.
10. **Don't mask LLM silence with centrist defaults.** No `?? 'medium'`, `?? 'high'`, `?? 'general'` patterns that pretend the LLM judged when it didn't. If the LLM doesn't emit, the absence is the audit signal.

---

## §8 — Open scope expansions awaiting Tue ratification

| # | Item | Detail |
|---|---|---|
| 1 | D-2.6 builds a new service | The existing maturity-refresh call doesn't exist; D-2.6 builds `findingMaturityRefresh.ts`. Estimated effort: 6-8h vs spec's 4-5h. Already surfaced in `PHASE_2_FOUNDATION_GROUND_STATE.md` §3. **Awaiting Tue's ratification.** |
| 2 | This benchmark itself | Round-1 draft. Awaiting Tue's review of: (a) the three principles operationalization, (b) the principles-to-imitate cataloguing, (c) the antipatterns-to-not-carry-over framing, (d) the per-layer extension templates, (e) the round-0 swap-test gate. |

---

## §9 — Surface to Tue (round-1 draft ready)

This document is round-1. Per Tue's per-prompt-revision discipline, the next step is Tue review.

**Specific questions for Tue's round-1 review:**

1. **Three-principle stack** (§1): does the operational rule for each principle match your intent? The recognition tests (round-0 swap-tests) are the working operationalization — would you adjust their phrasing or add a fourth test?

2. **Round-0 swap-test gate** (§2): does running the swap tests *before* length/tone/evidence checks at every revision round match your intended discipline? Or would you rather see the gate at a different point in the round flow?

3. **Principles-to-imitate** (§3): the cataloguing draws verbatim from edge function prompts with file:line citations. Are there moves you'd add or de-emphasize? In particular — the HOOK + DEPTH structure from `teaching-layer` is a structural pattern more than a framing move; is it the right pattern to import wholesale to Phase 2 emissions, or should Phase 2 emissions stay terse-by-default with the depth living on follow-up dig questions?

4. **One-shot tendencies to NOT carry over** (§4): are there other antipatterns in the edge prompts you've noticed that I missed? The catalogue runs six categories (closed taxonomies, banned-phrase regex, character minimums, single-call mega-shapes, closed-enum scoring, mandatory predictive outputs). Anything else?

5. **Per-layer extension templates** (§5): does the disposition framing (trained disposition, NOT a MUST rule) read correctly for each layer? Specifically — the L3.75 distribution decision (emissions per phase) — is splitting across PHASE_A and PHASE_B the right call, or should they consolidate into PHASE_META?

6. **D-2.6 scope expansion** (§8 #1): ratify *yes, build the new service as part of D-2.6* OR redirect (fold into D-2.7 aggregator, defer to Phase 3, different architectural shape).

7. **The benchmark itself**: does this round-1 draft give you enough to ratify, OR are there sections that need more depth before round 2?

**Prompt drafting begins ONLY after Tue ratifies this benchmark.** Per the per-prompt-Tue-review directive, no Phase 2 prompt draft (D-2.2 through D-2.6) lands in code until Tue has signed off on the framing this doc establishes.

---

> **End of round-1 draft.** Awaiting Tue ratification.
