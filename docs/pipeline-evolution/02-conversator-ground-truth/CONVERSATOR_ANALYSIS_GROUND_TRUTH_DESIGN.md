# Conversator ↔ Analysis Ground-Truth Integration — Design

> **Status:** Plan artifact. No code. Implementation happens in a separate chat after review.
> **Author:** Architect (planning mode)
> **Scope:** How to make the Conversator's lived-experience output the ground-truth substrate that constrains the Essay Intelligence pipeline's generative surfaces (L5 rewrites, L6 coaching, inline edits, workshop teaching) so they stop fabricating.
> **North star (Tue):** *"The conversator works hand in hand with our analysis system so it doesn't fabricate — it has a profile of the student's real experience to reword from, like a ghostwriter who actually knows them."*

---

## 1. Current-state map

**Two sophisticated systems that barely touch.**

### System A — The Conversator (exists, rich output, underused)

- Lives at `src/services/portfolioStrategy/services/activityWorkshop/chat/` (nine files, ~897 LOC in `conversationManager.ts`). An academic variant lives at `.../academicWorkshop/capability/conversational/` producing reliability-scored `CourseAnnotation`.
- Phase machine `opening → ... → complete` (`chat/types.ts:24-32`), bounded by `MAX_TOTAL_TURNS = 20` (`conversationManager.ts:41-42`).
- Structured extraction in `ExtractedInformation` (`chat/types.ts:376`): `extractedFields[]`, `authenticQuotes[]`, `implicitFindings[]`, plus `extractionQuality` (`chat/types.ts:297-305`).
- Persisted as JSONB to `activity_profiles` and `activity_chat_conversations` (`chatPersistenceService.ts:181-198`).

### System B — The Essay Intelligence pipeline (rich, mostly blind to A)

- 8-layer pipeline in `src/services/essayIntelligence/analysis/`: L1 → L2 → L2.5 → L3 (`sequentialDeepWalk.ts`) → L3.75 (`holisticSynthesis.ts`) → L3.5 (`analysisPass.ts`) → L4 (`crystallizer.ts`) → L5 (`deepAnnotationService.ts`) → L6 (`coaching/coachingService.ts`).
- Context injection is centralized in `profileManager/profileRouter.ts` (L3 rule at `:532`, L4 at `:2414`).
- **L5 is the fabrication surface that matters most.** `deepAnnotationService.ts` produces `rewriteExample` (required in ACTION mode, `l5ManifestMerger.ts:6,104`). Claude calls at `:1840,:2278`; system prompt cached (`cacheSystemPrompt: true` at `:1848`).

### Where the two systems touch today (thin, one-directional)

- One field exists: `conversatorEnrichments: string[]` on `ImprovementEntry` (`profileTypes.ts:3198`). Populated by `l5ManifestMerger.ts:151-152` and `analysisOrchestrator.ts` at multiple sites (`:1795, :2050, :2143`) — mostly empty arrays.
- `StudentNarrativeBridge` (`src/services/studentNarrativeBridge.ts`) defines a cross-module payload with `keyMoment`, `authenticQuote`, `originStory`, `whyItMatters` — but conversator's `authenticQuotes[]` is never transformed into it, and the bridge isn't threaded into L5 prompts.
- `StudentVoiceProfile` (`voiceProfile/types.ts:24-73`) is live at L3.75 via `buildPriorVoiceBlock()` (Port A2). Its `AuthenticPhrase` type already has `source: 'chat'` (`voiceProfile/types.ts:78-83`) — never populated.

### The fabrication surfaces

1. **Activity teaching service** (`activityTeachingService.ts:51-100,308`) generates "After" rewrites with concrete numbers; `buildFabricationGuardBlock()` is **not** called. Exemplars in `expertSystemPrompts.ts:251-255` literally model fabricated numbers ("12 events, 500+ participants, $3,200"). This is P0 per `docs/WRITING_SYSTEM_DEEP_RESEARCH_SYNTHESIS.md:21-34`.
2. **L5 deep annotations** (`deepAnnotationService.ts:30`). Guard injected, but it's SELF-AUDIT only (`fabricationGuard.ts:59-69`) — no positive substrate.
3. **L6 coaching** (`coachingService.ts:53,2718,3461`). Same self-audit limitation.
4. **Inline editor** (10 commands in `src/workshop/commands/*.cmd.ts` + `inlineEditor/commandPrompts.ts:172-200`). Bracket convention at prompt level only.

**The structural gap:** all four surfaces rely on the LLM *noticing* it doesn't know a fact and bracketing it. There is no positive substrate — no "here is what actually happened" — to draw from instead of inventing. The guard prevents the worst outcome; it does not produce vivid prose grounded in real life.

---

## 2. Target-state architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              STUDENT                                         │
└──────────────────────────────────────────────────────────────────────────────┘
       │  writes essay                              │  answers conversator
       ▼                                            ▼
┌─────────────────────────────────┐   ┌──────────────────────────────────────┐
│   Essay Intelligence Pipeline    │   │     Conversator (activity + academic)│
│   L1→L2→L2.5→L3→L3.75→L3.5→L4→L5│   │   ExtractedInformation per session   │
│                                 │   │   {extractedFields, authenticQuotes, │
│                                 │   │    implicitFindings, sourceUtterances}│
└─────────────┬───────────────────┘   └──────────────────┬───────────────────┘
              │                                          │
              │  gap signals                             │ ExtractionResult
              │  ("P3 needs detail on                    │
              │   teacher name; P5 sensory               │
              │   imagery unsupported")                  ▼
              │                       ┌───────────────────────────────────┐
              │                       │ experienceProfileCompiler          │
              │                       │ ─ dedup + normalize                │
              │                       │ ─ sourceTrace each fact to         │
              │                       │   a turn uuid                      │
              │                       │ ─ confidence scoring               │
              │                       └──────────────┬────────────────────┘
              │                                      ▼
              │             ┌─────────────────────────────────────────────┐
              │             │         ExperienceProfile (new)              │
              │             │   /src/services/experienceProfile/           │
              │             │   ─ events[], scenes[], people[], artifacts│
              │             │   ─ statedClaims[] with confidence          │
              │             │   ─ emotionalBeats[] (as-reported)          │
              │             │   ─ quotes[] (verbatim)                     │
              │             │   ─ authoritativeVersion vs claimed         │
              │             │   Persisted: experience_profiles table      │
              │             └──────────────┬──────────────────────────────┘
              │                            │
              │  reverse flow              │  forward injection via
              │  (gap-driven follow-ups)   │  profileRouter
              ▼                            ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  profileRouter.assembleContext (existing, extended)                         │
│  ─ L3: inject "known events" + quotes (as connection priors)                 │
│  ─ L3.75: extend priorVoiceBlock → priorExperienceBlock                      │
│  ─ L3.5: inject "claim support matrix" for authenticity tier eval           │
│  ─ L5: inject "rewrite substrate" — quotes, events, sensory beats           │
│        attached to the target paragraph's understanding IDs                  │
│  ─ L6: inject phase-aware slice for coaching turns                           │
└──────────────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Generative surfaces (L5, L6, inline, activityTeaching)                       │
│   ─ Prompt-level: "Rewrite MUST draw from Experience Substrate below.       │
│      If no substrate covers the detail, use [brackets]."                    │
│   ─ Schema-level: rewriteExample → { text, substrateCitations[] }           │
│   ─ Validation-level: post-parse walk asserting every specific claim        │
│      resolves to a substrate entry OR is bracketed                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

Three principles underlie the shape:

1. **Ground truth is a substrate, not a style guide.** The ExperienceProfile is *material the LLM pulls from*. It does not tell the LLM what to write; it tells the LLM what it is allowed to be vivid about.
2. **The fabrication guard becomes a three-layer defense.** Prompt-level instruction (what exists today) + schema-level citation + validation-level enforcement. The conversator output makes all three layers stronger because the LLM now has an actual positive source to cite.
3. **The flywheel closes via gap emission, not polling.** L5/L6 don't call the conversator. They emit `contextGaps` on `ImprovementEntry` which the coaching layer can surface as targeted follow-up questions. Conversator turns fill gaps; re-analysis picks up the new substrate via focused (not comprehensive) mode.

---

## 3. ExperienceProfile schema

Lives at `src/services/experienceProfile/types.ts`. Keyed per `userId` (and optionally per `essayId` for essay-specific turns). Extends — does not replace — `StudentVoiceProfile` and does not collide with `ProfileIndex` (essay-scoped).

```typescript
export interface ExperienceProfile {
  userId: string;
  version: number;
  createdAt: string;
  updatedAt: string;

  // --- The four substrate arrays ---

  /** Discrete things that happened. Source of "what did you do" detail. */
  events: ExperienceEvent[];

  /** Named scenes: concrete settings with sensory texture. Source of "where/when" detail. */
  scenes: ExperienceScene[];

  /** Named people. Source of dialogue and relational detail. */
  people: ExperiencePerson[];

  /** Objects, artifacts, numbers the student volunteered. Source of quantitative detail. */
  artifacts: ExperienceArtifact[];

  // --- Voice and emotion (sit alongside, feed StudentVoiceProfile) ---

  /** Verbatim student utterances flagged reusable. */
  quotes: ExperienceQuote[];

  /** Emotional states the student described, as they described them (NOT inferred). */
  emotionalBeats: EmotionalBeat[];

  // --- Claim tracking (for authenticity judgment, not gating) ---

  /** Claims the student made that have not been fully grounded yet. */
  statedClaims: StatedClaim[];

  /** Global confidence in the profile (0-1). */
  saturation: { overall: number; byDomain: Record<string, number> };
}

interface ExperienceEvent {
  id: string;                             // 'evt_xxx'
  summary: string;                         // "Hackathon — AI DJ project, second place"
  when: { period: string; confidence: 'verified' | 'stated' | 'inferred' };
  whatIDid: string;                        // actions the student took
  whatIFelt: string;                       // emotional register at the time
  whatIObserved: string;                   // environment/peer notes
  whatISaid: string | null;                // dialogue the student remembers
  confidence: number;                      // 0-1
  sourceTurns: string[];                   // conversator turn UUIDs that seed this
  peopleIds: string[]; sceneIds: string[]; artifactIds: string[];
}

interface ExperienceScene {
  id: string; label: string;
  sensory: { sight?: string; sound?: string; smell?: string; touch?: string; body?: string };
  setting: string;
  sourceTurns: string[];
}

interface ExperiencePerson {
  id: string; name: string; relation: string;
  directQuotes: string[];                  // things they said the student remembers
  traits: string[];
  sourceTurns: string[];
}

interface ExperienceArtifact {
  id: string;
  kind: 'metric' | 'object' | 'credential' | 'date' | 'place';
  rawValue: string;                        // "18 hires"
  precision: 'exact' | 'approximate' | 'claimed';
  sourceTurns: string[];
  sourceUtterance: string;                 // the student's actual words
}

interface StatedClaim {
  id: string;
  claim: string;
  type: 'outcome' | 'impact' | 'quantity' | 'authority' | 'novelty';
  supportLevel: 'substrated' | 'partially_substrated' | 'unsupported';
  grounding: string[];                     // event/artifact IDs that back it
  confidence: number;
}
```

**Why this shape.**

- *Four substrate arrays mirror what LLMs invent.* Fabrication modes are: fake events, fake scenes, fake people, fake numbers. Each substrate array is the positive antidote to one mode.
- *Separation of "I did / I felt / I observed / I said"* maps directly to the rewrite-elaboration modes a stylist invokes: action rewrites, interiority rewrites, setting rewrites, dialogue rewrites.
- *Confidence + sourceTurns* preserve the LLM-first rule that judgment belongs to the model. The model sees the confidence; it decides how to use it. We don't gate via numeric threshold.
- *statedClaims* separates from `events` because claims are the high-risk surface for admissions. "I led 40 volunteers" is a claim; the events that back it are separate; a rewrite must cite the event, not the claim alone.

**Persistence:** a new Supabase table `experience_profiles` with RLS (Clerk user_id TEXT, following pattern from `essay_analysis_reports`). `profile_data JSONB` for the document, separate columns for `user_id`, `version`, `saturation_overall`, `updated_at`. No per-essay scoping in the primary key — essay-specificity is handled by a `relevantEvents` view computed at router time.

---

## 4. Conversator output → ExperienceProfile transform

A new module `src/services/experienceProfile/compiler.ts` ingests conversator `ExtractionResult` (per-turn) and merges into the ExperienceProfile:

1. **Per-turn ingestion.** Subscribe to conversator turn completion (new emit from `conversationManager.processResponse()` at `conversationManager.ts:~processResponse`). Payload: `{conversationId, turnId, extractedFields[], authenticQuotes[], implicitFindings[]}`.
2. **Field classification (Haiku, ~$0.0002/turn).** Classify each `ExtractedField` into event / scene / person / artifact / emotional-beat. Classification prompt is small and benefits from prompt caching.
3. **Entity resolution.** Deduplicate against existing entities by (a) name match, (b) embedding similarity for scenes/events. If ambiguous, append rather than merge — the LLM-first rule says don't pre-commit to a dedup the model might disagree with.
4. **Source tracing.** Every field carries `sourceTurns: string[]` pointing at conversator turn UUIDs. This lets the UI show "this detail came from your conversation on March 5."
5. **Saturation scoring.** Rolling score updated per ingestion; used later by profileRouter to decide how much substrate to inject.

The compiler runs async after each conversator turn. No coupling back to the conversation loop — it can fail silently and be re-run from the persisted conversation state.

---

## 5. Pipeline injection points

Ordered by load-bearingness.

### L5 — Deep Annotation Service (MOST IMPORTANT)

- **File:** `src/services/essayIntelligence/analysis/deepAnnotationService.ts:1840,2278`.
- **What to inject:** the "rewrite substrate" — for each target paragraph, the subset of ExperienceProfile entries (events, quotes, scenes, artifacts) whose sourceTurns or embedding similarity cluster with the paragraph's understanding IDs.
- **How:** extend `profileRouter.assembleContextForL5()` (add sibling to existing rules) to produce a `substrateBlock: string` of shape:
  ```
  EXPERIENCE SUBSTRATE FOR THIS PARAGRAPH
  Events you can cite:
    [evt_abc] Hackathon — AI DJ project, 2nd place. I built the beat-matching layer. I felt terrified the generator would crash during the demo.
  Quotes you can use verbatim:
    [q_001] "I thought, okay, if this breaks I'll just start over from the melody."
  Scenes with sensory detail:
    [sc_02] Demo room: fluorescent ceiling, coffee-stained projector, judges in suits.
  Numbers the student gave:
    [art_11] "second place" (exact). [art_12] "40 hours" (approximate, stated).
  RULE: Elaborations must draw from this substrate. If a substrate entry covers what you'd say, cite it like [evt_abc]. If no entry covers it, use [brackets] — NEVER invent.
  ```
- **Prompt caching:** the substrate block goes in the USER prompt (per-paragraph; varies), NOT the system prompt (which is cached at `:1848`). The system prompt gets a small stable addition: "You will receive an EXPERIENCE SUBSTRATE block. Follow it."

### L6 — Coaching Service

- **File:** `src/services/essayIntelligence/coaching/coachingService.ts:2718,3461`.
- **What to inject:** the phase-aware slice — only substrate for improvement items the current coaching turn is addressing. The `conversatorEnrichments: string[]` field on `ImprovementEntry` (`profileTypes.ts:3198`) already exists and is already merged into coaching context via manifest merger; extend its content from opaque strings to references that the router resolves to the substrate block.
- **Secondary function:** coaching can emit **reverse-direction signals**. When the coaching turn asks "can you tell me more about the demo?", that opens a conversator sub-turn. Implementation: new field `coachingOutput.gapPrompts: GapPrompt[]` surfaced to the UI.

### L3.75 — Holistic Synthesis

- **File:** `src/services/essayIntelligence/analysis/holisticSynthesis.ts:3022`. Port A2 already injects `priorVoiceProfile` via `buildPriorVoiceBlock()` at `:1910,:2154`.
- **What to inject:** a `priorExperienceBlock` alongside the voice block — lists event summaries and key emotional beats as thematic priors. Helps L3.75 judge whether the essay is surfacing the student's real narrative material or flattening it. Cache boundary identical to voice block (user prompt, descriptive).

### L3.5 — Analysis Pass

- **File:** `src/services/essayIntelligence/analysis/analysisPass.ts:2269,2468`.
- **What to inject:** a compact "claim support matrix" — for each `statedClaim` in the ExperienceProfile that matches the paragraph's claims, show whether it is substrated, partially, or unsupported. This feeds authenticity tier judgment directly without telling the analyzer what grade to give.

### L3 — Sequential Deep Walk

- **File:** `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts:655`. Already cached system prompt at `:666`.
- **What to inject:** minimal. Known events as "connection seeds" go in the user prompt via the existing ProfileRouter (`profileRouter.ts:532`). The walk is a descriptive understanding pass — it should not be told what to conclude, only reminded of factual scaffolding the student has already shared.

### L1 — First Impressions

- **File:** `src/services/essayIntelligence/analysis/firstImpressions.ts:543`.
- **Injection:** none. L1 is descriptive-only observation. Per `fabricationGuard.ts:29-37`, analytical layers are out of scope for the guard; the same principle applies to substrate injection.

### Activity Teaching Service (out-of-pipeline but in-scope)

- **File:** `src/services/portfolioStrategy/services/activityWorkshop/activityTeachingService.ts:51-100,308`.
- **Two fixes:** (a) inject `buildFabricationGuardBlock()` at minimum parity with L5; (b) inject the ExperienceProfile substrate for the activity in question (the conversator's output is *native* for this surface — the activity's ExperienceProfile IS the conversator's activity profile).

---

## 6. Rewrite-constraint mechanics (three-layer)

### Layer 1 — Prompt

Every generative prompt appends, in order: (a) substrate block (positive material), (b) existing `buildFabricationGuardBlock()` (negative guardrail). Today only (b) exists. Reading order matters: substrate first frames the task ("write from this"), guard last frames the audit ("check yourself").

### Layer 2 — Schema

Extend the `L5Annotation.rewriteExample` field (currently a string, `l5ManifestMerger.ts:6,25,104`) to a richer object:

```typescript
rewriteExample: {
  text: string;
  substrateCitations: string[];          // evt/scene/person/artifact IDs used
  bracketedPlaceholders: string[];       // e.g., ["[X students]"]
} | null
```

The LLM is required to fill `substrateCitations` with IDs of substrate entries its rewrite drew from. Empty array is legal only if the rewrite is purely structural (no new specifics).

### Layer 3 — Validation

Post-parse, a lightweight validator walks `rewriteExample.text` for unbracketed numbers and unquoted proper nouns. For each, check: is it present in the source paragraph? Is it cited via `substrateCitations`? If neither, flag as `fabricationSuspect` and surface to the coaching layer — not a hard block. (Hard block violates LLM-first Rule 4 — "no discarding paid output.") The flag becomes a coaching signal: "I generated an example with a specific I can't ground; here's a bracketed version instead."

Three-layer means no single failure mode kills the defense. Prompt fails → schema catches. Schema fails → validation flags. Validation flags → coaching degrades gracefully.

---

## 7. Voice integration — relationship to Port A2 and StudentVoiceProfile

`StudentVoiceProfile` (`voiceProfile/types.ts:24`) and `ExperienceProfile` are **parallel, not nested.** Voice profile describes *how* the student writes (register, cadence, signature words). Experience profile describes *what the student has lived.* Both are injected at L3.75 and L5.

- `AuthenticPhrase` in `voiceProfile/types.ts:78` already supports `source: 'chat'` — the compiler populates this on every rich conversator turn. A verbatim student utterance becomes (a) a quote in ExperienceProfile and (b) an authentic phrase in StudentVoiceProfile if it has stylistic signature (decided by the classifier).
- The spoken/written gap (students speak differently than they write) is real. Solution: voice profile is still primarily built from *written* samples (essays, uploads). Conversator utterances contribute only verbatim phrases, not cadence stats. The voice compiler can tag utterances with a `modality: 'spoken' | 'written'` flag and downweight spoken data in the linguistics section.
- Port A2 remains gated as-is. This design does not activate or deactivate it; it adds a parallel experience block that uses the same injection plumbing.

---

## 8. Round-trip flywheel

Not a cron loop — an event-driven flywheel.

1. **Analysis → gap emission.** L5 annotations and L6 coaching attach `contextGaps: GapPrompt[]` (new field) to each `ImprovementEntry`. Example: `{id: 'gap_03', paragraph: 4, reason: 'rewrite requires sensory detail of lab', prompt: 'Can you tell me what the lab smelled or sounded like?'}`.
2. **UI surfacing.** Coaching UI shows gaps as optional follow-ups. Student can dismiss, answer inline, or open a full conversator turn. No modal. No forcing.
3. **Conversator → compiler → ExperienceProfile.** Student response ingested per section 4.
4. **Focused re-analysis (not full).** Using the existing focused analysis mode (memory: `selectAnalysisMode()`), re-run only L5 for affected paragraphs. Cost: ~$0.02-0.10 per round-trip. Ripple via the escalation ladder already documented.
5. **Convergence.** Each round-trip lowers `ImprovementEntry.contextGaps.length`. When zero, the improvement item graduates from bracketed to substrated.

Anti-N+1 guard: the coaching service throttles gap emission to ≤3 gaps per coaching turn (matches Deep Research P2 — feedback overload cap).

---

## 9. Failure modes & integrity posture

| Failure | Posture |
|---|---|
| Student lies to the conversator | Not our problem to fully solve. We track claims at `confidence` and source-trace to the student's own words. The essay they submit is *their* document. Our system never claims verification. |
| Conversator not used; essay analyzed cold | Graceful degradation. If ExperienceProfile is empty, substrate block is empty, and the G1 guard falls back to today's self-audit behavior. No regression. |
| Profile stale (6 months old) | Saturation score decays with `updatedAt` age. Router includes a "last updated N days ago" signal in the substrate block so the LLM can judge freshness. |
| Student says X to conversator, writes Y in essay | The essay is authoritative for *what they wrote*. The substrate is material they are allowed to cite. Divergence is surfaced as a coaching observation (L3.5 claim support matrix flags it). We do not "correct" the essay from the conversator. |
| Conversator is wrong / misextracts | Every substrate entry has `sourceUtterance` verbatim. UI offers an "edit / remove" affordance. Low-confidence entries are visually distinct. |

Integrity posture, in one sentence: *we give the LLM positive substrate so it stops inventing; we never assert the substrate is truth; we surface it to the student so they stay in the loop.*

---

## 10. Interaction with other open work

- **Port A2 / voice profile priors** — parallel, not conflicting. Substrate injection uses the same plumbing pattern (`buildPriorVoiceBlock` → `buildPriorExperienceBlock`). Can ship independently; A2 remains gated.
- **Corpus retrieval (Wave-3a, gated OFF)** — substrate changes *which corpus moves are appropriate*. A shy-voice student with substrate rich in quiet-reflection events should not get bold-opener corpus moves. Future-safe: the corpus retrieval block in `holisticSynthesis.ts` can read from the ExperienceProfile to filter moves by archetype fit.
- **Harvard-10 archetypes** — no archetype registry exists today in essayIntelligence (`elitePatternDetector.ts` is a legacy separate system). If added, ExperienceProfile is the input that classifies the archetype, not the output.
- **Deep Research P1 (learned helplessness)** — substrate makes coaching-mode viable. "Here is what you told me about the demo. Which of these details would best anchor P3?" is a coaching turn only possible with substrate. This design is a prerequisite for the P1 fix.
- **P2 (feedback overload)** — substrate does not increase the feedback load; it increases the *density* of each unit of feedback. Throttle on gap emission (section 8) keeps turn cost bounded.
- **P4 (scoring miscalibration)** — out of scope. Substrate informs authenticity tier judgment (L3.5 claim matrix) but does not change scoring rubrics.

---

## 11. Cost, latency, cache analysis

- **Substrate block size.** A rich profile's full substrate is ~3-8k tokens. Per-paragraph slice via embedding/ID match typically ~300-900 tokens. This is materially smaller than the 1500-token cached L3 system prompt (`sequentialDeepWalk.ts:166`).
- **Cache strategy.** System prompts stay cached (unchanged). Substrate goes in user prompts (varies per paragraph). Acceptable — it matches how ProfileRouter already works for per-paragraph context. No new cache invalidation.
- **Per-L5 call delta.** +300-900 input tokens. At Sonnet pricing, ~$0.001-$0.003 per paragraph. Negligible.
- **Compiler cost.** Haiku classification per conversator turn, ~$0.0002/turn. A full 20-turn conversation compiles for ~$0.004.
- **Focused re-analysis round-trip.** ~$0.02-$0.10 per gap-fill (memory). Matches existing focused mode economics.
- **No conflict with parallel cost work.** iter_1 convergence, Phase B schema cuts, cache prefix stabilization, reread gating — all operate on different axes. Substrate injection piggybacks on existing router and cache boundaries.

---

## 12. Rollout phases

**Phase 1 — Foundation (substrate plumbing, read-only).** Build `src/services/experienceProfile/{types,compiler,store}.ts` + Supabase migration for `experience_profiles`. Wire compiler to conversator turn completion. Ship behind a flag; no pipeline changes yet. *Success:* 10 real students' conversator sessions produce non-empty ExperienceProfile with ≥70% of `authenticQuotes[]` captured; round-trip through persistence is lossless.

**Phase 2 — L5 substrate injection (the P0 fix).** Extend `profileRouter.assembleContextForL5()` with a substrate rule. Extend `rewriteExample` schema to the citation-aware form. Add layer-3 validator that flags (doesn't block) unbracketed, uncited specifics. *Success:* on a 10-essay benchmark, rewriteExamples with unbracketed fabricated specifics drop from baseline to ≤1 per essay (ideal: 0). Coaching latency unchanged.

**Phase 3 — Activity workshop fix (closes the P0 gap explicitly called out in Deep Research).** Inject `buildFabricationGuardBlock()` into `activityTeachingService.ts` *and* feed the ExperienceProfile for the target activity. Replace fabricated exemplar in `expertSystemPrompts.ts:251-255` with bracketed/substrated version. *Success:* zero fabricated specifics in "After" descriptions on the 10-activity benchmark the Deep Research team used.

**Phase 4 — Reverse-direction flywheel.** Emit `contextGaps` from L5/L6. Surface in coaching UI as optional follow-ups. Connect to conversator turn opener. Throttle at 3 gaps/turn. *Success:* ≥30% of emitted gaps answered by students; focused re-analysis reduces `contextGaps` count round-over-round.

**Phase 5 — L3.75 experience block + L3.5 claim matrix.** Lowest urgency, highest leverage for authenticity tier calibration. Parallel to voice block injection. *Success:* authenticity tier correlation with ground-truth support improves measurably on a calibration set.

Flag strategy: per-essay flag for Phase 2 (gradual rollout), per-activity flag for Phase 3, always-on for Phase 1/4/5 once validated.

---

## 13. Open questions for Tue

1. **Does the essay conversator exist as a distinct product, or is the activity-workshop conversator the substrate for all essays?** If the latter, essays that aren't activity-seeded need their own conversator flow. This design assumes "conversator output is one substrate; essays may or may not have one."
2. **Should fabricated specifics in rewriteExamples be a hard block or a soft flag?** Plan says soft (LLM-first Rule 4). Is there appetite to make it hard for the specific case of "application-copyable prose"?
3. **UI policy for gap prompts.** Opt-in per turn, always visible, or chat-native? Product decision, affects section 8 and phase 4.
4. **Saturation threshold for substrate injection.** Below what saturation do we choose to inject *nothing* rather than risk misleading the LLM with thin substrate? Plan defers; a small calibration pass would set this.
5. **Academic conversator output (CourseAnnotation) integration.** Belongs in ExperienceProfile or stays in its own track? Currently out of scope; worth answering before phase 1 ships.

---

## Top-3 architectural risks

1. **Substrate misrouting — the LLM over-cites stale or irrelevant substrate.** If profileRouter ships substrate that isn't semantically adjacent to the target paragraph, rewrites become worse: grounded in the wrong lived experience. Mitigation: start with turn-UUID linking (conservative, high precision) before embedding-similarity linking (higher recall, lower precision). Monitor L5 output for "citation to entity unrelated to paragraph" via the validator from §6; flag rate >5% triggers rollback.

2. **Schema inflation on rewriteExample.** Current shape is a string (`l5ManifestMerger.ts:6`). Making it an object with `substrateCitations[]` cascades into every consumer (manifest merger, coaching assembly, UI). If the cascade is larger than expected, phase 2 slips. Mitigation: ship the richer object type as a **superset** — keep string backward-compat (`rewriteExample: string | { text; ... }`) for one release window; update consumers one at a time; deprecate string form only after all consumers migrate.

3. **Learned helplessness via substrate.** If the substrate is too complete, students stop writing — they let the LLM "ghostwrite" from their profile. This inverts Deep Research P1 into a worse failure mode. Mitigation: substrate injection targets L5 *rewriteExample* (teaching exemplar) and L6 *coaching substrate*, **not** the inline editor's auto-apply path without extra guard. Coaching-mode UX (section 10) must lead with questions ("which detail do you want to anchor here?"), with substrate as a reference, not an auto-fill.
