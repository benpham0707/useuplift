# FORGE DEBATES: System Intelligence Gaps

> Reality Checker adjudication between Agent A (Direct Path) and Agent B (Rethink Path)
> Date: 2026-03-19

---

## Part 1: Reality Verification

### Codebase Facts Established

**Sidecar structure** (`CoachingSidecar`, line 305):
- 11 fields: `category`, `cognitiveState`, `focusParagraphs`, `dimensionFocus`, `responseIntensity`, `sessionJournalEntry`, `contextAccumulation`, `needsDeepening`, `deepeningReason`, `learningStyleUpdate`, `strategicQuestionUpdate`
- Parsed from `<!--METADATA-->` delimiter in raw Sonnet output
- Has graceful fallback (`defaultSidecar()`) when parse fails
- JSON emitted on a single line after the delimiter

**CognitiveAssessment** (`profileTypes.ts`, line 2044):
- 4 fields: `assessment`, `whatTheyNeed`, `recommendedApproach`, `responseIntensity`
- Currently constructed from sidecar data at line 765 with **hollow values**:
  - `assessment: "Student is ${sidecar.cognitiveState}"` (just echoes the enum)
  - `whatTheyNeed`: binary choice between "Profile understanding needs updating" / "Continue coaching"
  - `recommendedApproach`: 3-way ternary based on category
- **Downstream usage**: feeds `updateSessionMemory()` (line 2914) which creates `SessionEvent.summary` from `cognitiveAssessment.recommendedApproach`. Also stored in `CoachingResult` (line 919) and propagated to `ReanalysisOrchestrator` (line 115).

**CoachingSessionMemory** (`profileTypes.ts`, line 2123):
- 10 fields: `turnCount`, `events`, `topicsDiscussed` (deprecated), `approachesUsed` (deprecated), `studentStances` (deprecated), `sessionArcSummary`, `nextFocus`, `lastResponseIntensity`, `strategicQuestion`, `questionStaleness`
- `sessionArcSummary` exists but is **never updated** in the current code — initialized as `''` and stays empty
- `nextFocus` similarly initialized as `''` and never populated

**Confusion tracker infrastructure** (line 3036):
- `confusionTrackers: Map<string, TopicConfusionTracker>` — instance-level state on the service class
- 4-level escalation: initial_explanation → different_angle → broken_down → ask_what_is_confusing
- `buildEscalationContext()` injects escalation instructions into the user prompt
- Triggers on `cognitiveState === 'confused_about_feedback' || 'confused_about_concept'`
- Resets when student shows `'engaged'` or `'curious_deeper'`

**Prompt 3-block structure** (line 1350-1754):
- **Block 1 (STATIC, cached)**: `staticCoachingPhilosophy` (~2000 tokens) — role identity, banned phrases, dialogue modes, resistance types, craft moves, honesty protocol, phase coaching, craft vocabulary, pedagogical calibration, sidecar instructions. ALL concatenated into the system prompt.
- **Block 2 (STABLE, cached as part of system prompt)**: Profile context, essay text, findings, phase section. Also in system prompt, also cached.
- **Block 3 (DYNAMIC, user prompt)**: Dynamic profile context (conversation insights, declared context), conversation history, student message, edit context, session arc, journal, escalation, patterns, anti-repetition, length directive.

**Key finding about Block 1**: The "STUDENT RESISTANCE -- THREE TYPES" section (line 1508-1518) is already in the static philosophy, always cached. It's ~200 tokens of static guidance. Agent B's mode switch would need to go into the dynamic user prompt (Block 3) since it varies per turn based on detected resistance.

**Portrait evolution**: No existing mechanism. `studentDeclaredContext` is the closest — a prose string accumulating concrete details the student reveals. Updated by sidecar `contextAccumulation` field. But it captures FACTS ("piano teacher Mrs. Chen"), not PERSONHOOD ("this student learns through concrete examples and resists abstract feedback").

**Resistance handling today**:
- Static philosophy block has the 3-type framework (line 1508-1518)
- `estimateResponseIntensity()` maps resistance patterns to `'brief'` (line 440-447)
- Sidecar `category === 'resistance'` → `recommendedApproach: 'Listen first — ask what they are protecting'`
- Resistance insights stored with `essay_durable` durability
- Student stances recorded in deprecated `studentStances` array
- NO escalation ladder for resistance (only confusion has one)
- NO tracking of repeated resistance to the SAME suggestion

---

### Verification: Agent A's Proposals

**GAP 1 — portraitEvolution sidecar field**:
- FEASIBLE. Adding 1 field to the 11-field sidecar brings it to 12. The sidecar instruction prompt would grow by ~100 tokens. Parse validation would need a new entry. The `contextAccumulation` field already does something similar (concrete details) — `portraitEvolution` would capture the meta-level ("who this person IS").
- CONCERN: Sonnet already has to emit 11 JSON fields alongside the coaching response. Each additional field consumes output tokens and adds parse failure risk. However, Sonnet reliably handles 11 fields today, and one more nullable string is low risk.
- VERDICT: Sound.

**GAP 2 — 3 prose fields on sidecar**:
- PARTIALLY FEASIBLE. Adding `cognitiveAssessmentProse`, `whatTheyNeed`, `recommendedApproachProse` would bring the sidecar to 15 fields (with GAP 1). The current hollow CognitiveAssessment IS a real problem — `SessionEvent.summary` at line 2933 reads: `"Continue current approach — student engaged"` for nearly every turn. The events log is nearly useless for session arc reasoning.
- CONCERN: 15 sidecar fields is pushing it. Each field adds ~20-40 output tokens plus instruction tokens. The sidecar instruction block would grow from ~200 to ~400 tokens.
- CONCERN: These 3 fields duplicate what the OLD Stage 1.5 Haiku call (`runStage1_5CognitiveAssessment`, line 2645) used to do. That method is still in the codebase but appears to no longer be called in the main pipeline. The sidecar approach is the right successor, but 3 separate free-prose fields is heavy.
- VERDICT: The problem is real. The solution is overweight. A single `innerVoice` field (2-3 sentences combining assessment + what-they-need + approach) would capture 90% of the value at 1/3 the token cost.

**GAP 3 — TopicResistanceTracker cloning confusion infra**:
- FEASIBLE. The confusion tracker pattern (Map<string, Tracker>, update on sidecar state, build escalation context, inject into user prompt) is clean and well-tested. Cloning it for resistance is straightforward.
- CONCERN: What is the "topic" key for resistance? For confusion, it's the dimension focus (e.g., "voice", "structure"). For resistance, the key should be the SUGGESTION being rejected, not the topic area. "Student is resistant about voice" is too vague — "Student rejected the suggestion to change the opening from summary to scene" is what matters.
- CONCERN: The 4-level escalation (noted → reframe → name_pattern → honor_and_wait) is reasonable for resistance, but the approach labels need to be different from confusion's. Agent A's escalation levels map well to real coaching behavior.
- VERDICT: Sound direction. Needs a richer key strategy than confusion's dimension-based keys.

**GAP 4 — Periodic Haiku synthesis every 5 turns**:
- FEASIBLE. The infrastructure already supports periodic tasks (quality signals are computed periodically). The cost ($0.0004/5 turns) is trivial.
- CONCERN: `sessionArcSummary` already exists on `CoachingSessionMemory` but is never populated. This synthesis could populate it. However, the synthesis output structure (`StudentContextSynthesis` with `keyRelationships`, `behavioralPatterns`, `coreTension`, `statedIntent`) introduces a new type that would need to be stored somewhere.
- CONCERN: Where does this synthesis get injected? Currently `sessionArcSummary` is used at line 1710 in the session arc section. The synthesis could replace the empty string there.
- VERDICT: Sound. Should populate the existing `sessionArcSummary` field rather than creating a separate storage mechanism.

**GAP 5 — Piggyback on GAP 4 for cross-layer patterns**:
- FEASIBLE if GAP 4 is adopted. Adding red flags + blind spots to the synthesis input is essentially free.
- CONCERN: What "cross-layer patterns" are available? The profile has `characterRevelation.blindSpots` and `admissionsPositioning.redFlags` (if populated). These are essay-text-derived, not conversation-derived. The synthesis would need to compare essay-text blind spots with conversation behavior.
- VERDICT: Sound but the value depends on profile completeness.

### Verification: Agent B's Proposals

**Problem A — StudentTheory type (unified GAPs 1+4+5)**:
- CONCEPTUALLY SUPERIOR. A unified type (`personhood`, `protectedValues[]`, `blindSpotHypotheses[]`, `tensions[]`, `essayRelationship`) captures the real coaching need: who is this person and what do they care about? The targeted fixes (portrait evolution + synthesis + cross-layer) reach the same destination in 3 separate mechanisms.
- CONCERN: "Every 3 turns" is more expensive than "every 5 turns" but still trivial (~$0.0008/3 turns).
- CONCERN: "Injected into Stage 3 user prompt replacing flat context dump" — the "flat context dump" is the dynamic profile context (`buildDynamicProfileContext()`, line 1843). This contains conversation insights and student-declared context. Replacing it entirely with the StudentTheory would LOSE the raw insight data. Should be additive, not replacement.
- CONCERN: "On re-analysis, theory feeds back into L3.75" — this requires the theory to survive the coaching session boundary and be stored on the EssayProfile. Currently nothing on CoachingSessionMemory feeds back to the analysis pipeline. This is a significant architectural boundary to cross.
- VERDICT: Better model of the problem. The "replace flat context" and "feed back to L3.75" proposals need scoping down. The theory should be an ADDITION to the dynamic context, not a replacement. The L3.75 feedback is a Phase 2 feature.

**Problem B — Resistance Mode Switch**:
- ARCHITECTURALLY RISKY. "Literally REPLACE the phase coaching section of the prompt" — the phase coaching section is in Block 1 (static, cached). The section at lines 1566-1575 is embedded in `staticCoachingPhilosophy` which is the system prompt. You cannot conditionally replace part of the cached system prompt without breaking the cache.
- ALTERNATIVE: The resistance protocol would need to go into the dynamic user prompt (Block 3), which is where the escalation context already goes. This makes it functionally equivalent to Agent A's approach (inject escalation instructions into the user prompt) but with stronger behavioral framing.
- CONCERN: "Exit when student engages for 2 consecutive turns" requires tracking consecutive engagement turns during resistance episodes. This is state management on top of the tracker — feasible but adds complexity.
- CONCERN: `ResistanceState` on `CoachingSessionMemory` — adding a field to session memory is fine, but the "mode switch" framing overpromises. It's really "inject a resistance-specific instruction block into the user prompt when resistance is detected."
- VERDICT: The core idea (stronger behavioral instructions during resistance) is right. The "mode switch that replaces cached prompt sections" framing is wrong. Should be implemented as an escalation injection into Block 3, like confusion already does.

**GAP 2 dismissal**:
- PARTIALLY CORRECT. Agent B says "CognitiveAssessment is a routing artifact, not a coaching quality lever." This is half right. The CognitiveAssessment does NOT affect the Stage 3 prompt (it's built AFTER the response, from the sidecar). So it cannot improve the coaching response quality. However, it DOES affect:
  1. `SessionEvent.summary` — which gets injected into future turns' session arc context
  2. `CoachingResult.cognitiveAssessment` — returned to the orchestrator
  3. Backward-compat `approachesUsed` — which tracks coaching approaches
- The hollow construction means the session event log is nearly useless. A turn that required "Direct instruction — they're stuck and need concrete technique" gets logged as "Continue current approach — student engaged."
- VERDICT: Agent B is wrong to dismiss this. It's not cosmetic — it degrades the session arc context that future turns read. But Agent A's 3-field solution is overweight. A single prose field is sufficient.

---

## Part 2: Forced-Choice Synthesis

### Decision 1: GAPs 1+4+5 (Portrait + Synthesis + Cross-Layer)

**Choice: HYBRID — Agent B's model + Agent A's implementation pragmatism**

Agent B's `StudentTheory` is the right abstraction. The student's personhood, protected values, tensions, and essay relationship ARE what the coach needs to remember across turns. Agent A's 3 separate mechanisms (portraitEvolution + synthesis + crossLayerPatterns) would reach a similar place but with more seams and less coherence.

However, Agent B's implementation proposals need scoping:
- The theory should SUPPLEMENT the dynamic context, not replace it
- L3.75 feedback is Phase 2 — don't cross the analysis pipeline boundary now
- Every 5 turns is sufficient (not 3) — the coach's per-turn observations via the sidecar provide inter-synthesis continuity

**Implementation**:
1. New `StudentTheory` type (Agent B's fields)
2. Periodic Haiku synthesis every 5 turns (Agent A's cadence)
3. Stored on `CoachingSessionMemory` (new field)
4. Injected into Block 3 user prompt as an ADDITIONAL section (not replacing `buildDynamicProfileContext`)
5. Single new sidecar field `portraitUpdate` (nullable string) for Sonnet to capture inter-synthesis portrait observations (Agent A's core idea, but unified into the theory model)

### Decision 2: GAP 3 (Resistance Tracking)

**Choice: HYBRID — Agent A's infrastructure + Agent B's behavioral intensity**

Agent A's approach (clone confusion tracker, inject escalation into Block 3) is architecturally sound and proven. Agent B's mode switch is architecturally broken (cannot replace cached Block 1 content). But Agent B's behavioral framing is more powerful:

- Level 1 (noted): Record the resistance. No special injection.
- Level 2 (reframe): "The student rejected [specific suggestion]. Ask what they're protecting before offering alternatives."
- Level 3 (name_pattern): "The student has resisted [N] suggestions about [topic]. This is a pattern. Name it gently: 'I notice you're protective of [aspect] — that might be exactly the thing that makes your essay yours.'"
- Level 4 (honor_and_wait): "The student has deeply held views about [topic]. Honor their ownership. Do NOT suggest changes to this area unless they ask. Your job: help them strengthen what they're protecting."

The key improvement over Agent A: the escalation levels don't just change APPROACH, they change BEHAVIORAL POSTURE. Level 4 is genuinely different from Level 1 — it's not "try harder," it's "stop trying."

**Implementation**:
1. `TopicResistanceTracker` interface parallel to `TopicConfusionTracker`
2. `resistanceTrackers: Map<string, TopicResistanceTracker>` on the service class
3. Key strategy: `${dimensionFocus}:${focusParagraph}` (e.g., "voice:P1") — richer than confusion's dimension-only key
4. `buildResistanceEscalationContext()` with Agent B's behavioral intensity
5. Update trigger: sidecar `category === 'resistance'` or `cognitiveState === 'resistant_to_specific' || 'resistant_to_general'`

### Decision 3: GAP 2 (CognitiveAssessment Quality)

**Choice: REFINED — Single sidecar field, not 3**

Agent B is wrong to dismiss this. Agent A correctly identifies the problem (hollow construction at line 765). But Agent A's 3-field solution is too heavy for the sidecar.

**Implementation**:
1. Single new sidecar field: `innerVoice` (nullable string, 2-3 sentences)
2. Instruction: "Your inner assessment of this student's state — what you see that you wouldn't say out loud. Be honest: are they performing understanding? Ready for a breakthrough? Avoiding the real issue? 2-3 sentences."
3. Replace the hollow CognitiveAssessment construction with the `innerVoice` content
4. This flows into `SessionEvent.summary` and the session arc context for future turns

---

## Part 3: Summary of Decisions

| Gap | Agent A | Agent B | Decision | Rationale |
|-----|---------|---------|----------|-----------|
| 1+4+5 | 3 separate mechanisms | Unified StudentTheory | HYBRID: B's model + A's pragmatism | Theory is the right abstraction; A's cadence + incremental approach avoids over-engineering |
| 3 | Clone confusion tracker | Mode switch on cached prompt | HYBRID: A's infra + B's behavioral intensity | A's architecture is sound; B's behavioral framing is more powerful; B's prompt replacement is broken |
| 2 | 3 sidecar fields | Dismiss as cosmetic | REFINED: Single `innerVoice` field | B is wrong to dismiss; A is overweight; 1 field captures 90% of value |
