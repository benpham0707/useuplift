# Opus 4.6 Deep Rewrite — Essay Intelligence System

> 3 self-contained prompts for 3 separate Claude Code chats.
> Each chat: Opus 4.6, exclusive file ownership, zero overlap.
>
> **Focus**: Prompting quality, context mapping (right data → right prompt → right output),
> and data flow correctness. No weights, no scoring matrices, no speculative improvements.
> Only things we KNOW will make the system better.

---

## HOW TO USE

1. Open 3 separate Claude Code sessions on the repo (branch: `refactor/scoring-decomposition-step3`)
2. Ensure each is **Opus 4.6**
3. Paste one prompt per chat
4. After all 3 finish, run `npx tsc --noEmit` from the lead session

---

# CHAT 1: Profile — Making Context Flow to the Right Place

## The System

An AI essay coaching platform for college applications. An 8-layer LLM pipeline reads the essay and builds an `EssayProfile` — a multi-resolution semantic map from holistic thesis down to individual word choices. That profile powers coaching conversations, annotations, and scoring.

The profile is the heart. Every layer writes into it. Coaching reads from it. The **Profile Router** decides WHAT profile data to load for each downstream consumer (L3.5 analysis, L5 annotations, L6 coaching). If the router's data is incomplete or the routing is wrong, downstream prompts get the wrong context and produce worse output.

You own the type system, the coordinator, the mutators, and the profile router.

**Read PLAN.md first** — especially lines 100-254 (Profile Structure), 258-407 (Profile Index), 3235-4278 (Profile Manager architecture). PLAN.md is the vision. The implementation should exceed it.

## Your Files (read AND write)

| File | Lines | What It Does |
|------|-------|-------------|
| `src/services/essayIntelligence/profileTypes.ts` | 2035 | Every type in the system |
| `src/services/essayIntelligence/profileManager/essayProfileManager.ts` | 2089 | The coordinator — dispatches mutations, recomputes index |
| `src/services/essayIntelligence/profileManager/profileRouter.ts` | ~1030 | The context router — decides what profile data each consumer gets |
| `src/services/essayIntelligence/profileManager/mutators/sentenceMutator.ts` | 635 | Sentence-level understanding + analysis |
| `src/services/essayIntelligence/profileManager/mutators/paragraphMutator.ts` | 313 | Paragraph understanding + structural roles |
| `src/services/essayIntelligence/profileManager/mutators/holisticMutator.ts` | 526 | 10-section holistic synthesis |
| `src/services/essayIntelligence/profileManager/mutators/connectionMutator.ts` | 534 | Cross-paragraph connections |
| `src/services/essayIntelligence/profileManager/mutators/voiceMapMutator.ts` | 438 | 5-dimension voice map |
| `src/services/essayIntelligence/profileManager/mutators/earnednessMutator.ts` | 511 | Moment earned-ness backward-tracing |
| `src/services/essayIntelligence/profileManager/mutators/northStarMutator.ts` | 239 | North Star dimensions |
| `src/services/essayIntelligence/profileManager/mutators/insightMutator.ts` | 380 | Conversation insights from coaching |

You may READ (not write): analysis files, coaching files, `PLAN.md`.

## What the Audit Found Works

- **L3 walk output trace**: All 5 dispatch steps work correctly. Sentence understandings land in right sentences. Back-propagation REPLACES arrays (supersession model correct). Connections created with proper bidirectional refs. Holistic evolution merges incrementally.
- **L3.75 holistic synthesis**: All 10 sections written. VoiceMap and EarnednessMap correctly routed to dedicated mutators. Full supersession.
- **L3.5 analysis**: Per-sentence effectiveness, strengths, weaknesses, flags land correctly.
- **L4 North Star**: Lands with essay-type scaling validation.
- **Profile Router routing logic**: Smart — uses `l6_coaching_paragraph` when student asks about a specific paragraph (loads full understanding + analysis for that paragraph), `l6_coaching_voice` for voice questions, `l6_coaching_overview` for general questions. The routing DECISIONS are correct.

## What You Must Fix

### FIX 1 — ProfileIndex Is Half-Empty (MOST IMPACTFUL)

`recomputeIndex()` never populates 5 of 10 key ProfileIndex fields. Every downstream consumer reads the ProfileIndex — L5, L6 coaching, the profile router. When these fields are empty, downstream prompts get incomplete context.

**What's empty and why it matters:**

- **`topicTags`**: Always `[]`. The Profile Router uses `searchTags` (populated from `topicTags`) to find relevant paragraphs when a student asks about "my metaphor" or "the diamond image." Without tags, the router falls back to generic routing and the coach gets less targeted context.

- **`sectionTokenCounts`**: Always zeros. The router's `applyTokenBudget()` uses these to decide which sections to keep vs drop when approaching token limits. With zeros, the token budget logic can't make intelligent trim decisions — it either keeps everything or drops sections blindly.

- **`northStarSummary`**: `throughLineSummary`, `structuralRoles`, `maturity` all empty. The coaching service's `buildProfileContextText()` reads `profile.index.northStarSummary` and injects it into EVERY coaching prompt (lines 829-835). When it's empty, the coach gets NO north star context regardless of routing rule. This means coaching responses can't reference the essay's through-line or structural architecture.

- **`activeConcerns`**: Always `[]`. The coaching service reads this (line 843) and surfaces critical concerns to the coach. Without it, the coach doesn't know which paragraphs have serious problems — it can't proactively steer students toward their biggest issues.

- **`improvementPriority`** in paragraph digests: Never computed. The router uses paragraph digests for overview routing. Without priority, the coach can't distinguish "paragraph 2 is fine" from "paragraph 2 urgently needs work."

**What to do**: Implement the population logic in `recomputeIndex()`:

1. **`topicTags`**: Walk all paragraphs and sentences. Collect semantic tags from paragraph understanding (theme tags, topic references), sentence understanding (narrative contribution topics), and holistic synthesis (thematic threads, image systems). Deduplicate. These should be content-descriptive: "diamond", "pawnshop", "self-worth", "father", "transformation" — not structural tags like "opening" or "transition."

2. **`sectionTokenCounts`**: Estimate token counts by serializing each major section (voiceIdentity, emotionalTopography, etc.) and dividing character count by 4. Store per-section. This gives the token budget logic real numbers to work with.

3. **`northStarSummary`**: Read from `profile.northStar` after L4 crystallization. Extract `throughLine.summary` → `throughLineSummary`. Map `structuralRoles` from the North Star. For `maturity`, check which North Star dimensions are populated and meaningful — more populated = higher maturity.

4. **`activeConcerns`**: Walk L3.5 analysis results. For each sentence where `isProblem === true` or analysis flags structural issues, create a concern entry with location, description, and severity. Aggregate at paragraph level too.

5. **`improvementPriority`** in paragraph digests: Use max `priorityForImprovement` across the paragraph's sentences from L3.5 analysis.

### FIX 2 — L6 Paragraph Route Missing Holistic Context

When a student asks about a specific paragraph (e.g., "Why does P2 feel rushed?"), the router correctly uses `l6_coaching_paragraph` which loads the target paragraph's full understanding + analysis + connected sentences. **But it loads NO holistic context** — no voice identity, no thematic architecture, no narrative strategy.

This means the coach can tell the student WHAT's happening in P2 (sentence-level observations, effectiveness scores) but can't connect it to WHY it matters for the essay. It can't say: "P2 rushes past the emotional core you established in P1 — the voice shifts from intimate reflection to list-mode here, which undermines the through-line about discovering self-worth through your father's work."

That response requires: P2 analysis (has it) + voice identity (DOESN'T have it) + thematic architecture (DOESN'T have it) + North Star through-line (DOESN'T have it, because northStarSummary is empty).

**What to do**: In `assembleL6CoachingParagraph()`, add compact holistic context alongside the paragraph detail:

```typescript
// After the target paragraph section, add compact holistic context
// so the coach can connect paragraph-level observations to essay-level patterns

// Voice identity (compact — signature + distinctive patterns, not full shifts array)
sections.push({
  name: 'voiceContext',
  content: {
    signature: profile.voiceIdentity.signature,
    register: profile.voiceMap.register,
    distinctivePatterns: profile.voiceIdentity.distinctivePatterns,
  },
  tokenEstimate: estimateTokens(profile.voiceIdentity.signature) + 50,
  priority: 'high',
});

// Thematic architecture (compact — thesis + threads, not full evidence arrays)
sections.push({
  name: 'thematicContext',
  content: {
    centralThesis: profile.thematicArchitecture.centralThesis,
    thesisConfidence: profile.thematicArchitecture.thesisConfidence,
    threads: profile.thematicArchitecture.threads.map(t => ({
      theme: t.theme, strength: t.strength,
    })),
  },
  tokenEstimate: estimateTokens(profile.thematicArchitecture.centralThesis) + 80,
  priority: 'high',
});

// North Star through-line (compact)
if (profile.northStar.throughLineMap) {
  sections.push({
    name: 'throughLineContext',
    content: {
      centralElement: profile.northStar.throughLineMap.centralElement,
      transformation: profile.northStar.throughLineMap.transformation,
    },
    tokenEstimate: 80,
    priority: 'high',
  });
}
```

Keep these compact — just enough for the coach to connect observations to the bigger picture. The full detail is in the overview route for general questions.

### FIX 3 — `aoTakeaway` From L3.5 Silently Dropped

L3.5's analysis produces `holisticAnalysisEvolution.aoTakeaway` — the admissions-officer takeaway. This is one of the most valuable coaching data points ("What will an AO think when they read this essay?"). It's computed by Sonnet and then... thrown away. The coordinator never routes it to any profile field.

**What to do**: Route it to `admissionsPositioning.aoTakeaway` (add the field if it doesn't exist in `profileTypes.ts`). Then ensure the coaching context assembly includes it — the `assembleL6CoachingOverview` already loads `admissionsPositioning`, so once the data is there, coaching will see it automatically.

### FIX 4 — Module-Level `connectionIdCounter`

`connectionMutator.ts` line 32: `let connectionIdCounter = 0` is module-scoped. In a server with concurrent sessions, IDs collide across different essays' profiles. Move the counter into the class instance. Use `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${this.counter++}` for uniqueness.

## Quality Gate

Run `npx tsc --noEmit` — zero errors. Then trace this scenario: A 5-paragraph essay completes all 8 layers. Now a student asks "Why does my opening feel generic?" — Does the coach get the North Star through-line to explain WHY generic is a problem for THIS essay? Does it get the voice identity to suggest what authentic voice sounds like? Does it get the specific P1 analysis showing which sentences are weak? All three pieces of context must be available.

---

# CHAT 2: Analysis Pipeline — Prompt Quality and Context Completeness

## The System

An 8-layer LLM pipeline that reads college application essays:

```
L1 (Haiku) — First impressions: split sentences, surface features
L2 (Sonnet) — Structural cartography: paragraph roles, transitions
L2.5 (Haiku) — Connection scout: cross-paragraph links
L3 (Sonnet x N) — Sequential deep walk: THE CORE — paragraph-by-paragraph understanding
L3.75 (Sonnet x 1) — Holistic synthesis: simultaneous view, 10 rich sections
L3.5 (Sonnet x N parallel) — Analysis pass: the FIRST evaluative layer
L4 (Sonnet) — Crystallization: North Star + score matrix + coherence
L5 (Sonnet x N parallel) — Phase-aware feedback annotations
```

**Core separation**: L1-L3.75 = Understanding (WHAT IS). L3.5 = Analysis (HOW WELL). L5 = Feedback (WHAT TO DO). Separate API calls prevent contamination.

Your job is the PROMPTS — what each layer asks the LLM, what context it provides, and whether the output is complete. Every prompt is a conversation with Sonnet/Haiku. The quality of that conversation determines the quality of the entire system's understanding.

**Read PLAN.md** — especially lines 2466-2515 (L1), 2584-2638 (L3), 2642-2780 (L3.75), 1733-1801 (L3.5), 2784-2932 (L4), 2936-3012 (L5).

## Your Files (read AND write)

| File | Lines | Layer |
|------|-------|-------|
| `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` | 749 | Pipeline coordinator |
| `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` | 1365 | L3 |
| `src/services/essayIntelligence/analysis/runningUnderstandingManager.ts` | 474 | L3 support |
| `src/services/essayIntelligence/analysis/holisticSynthesis.ts` | 1088 | L3.75 |
| `src/services/essayIntelligence/analysis/analysisPass.ts` | 1043 | L3.5 |
| `src/services/essayIntelligence/analysis/crystallizer.ts` | 951 | L4 |
| `src/services/essayIntelligence/analysis/deepAnnotationService.ts` | 1222 | L5 |

You may READ (not write): `profileTypes.ts`, `essayProfileManager.ts`, `profileRouter.ts`, `PLAN.md`.

## What the Audit Found Works

These prompts are strong — don't rewrite them from scratch:

- **L3 prompt: 9/10** — Three-level depth framing (surface→structural→architectural) with the pawnshop example is excellent. Anti-contamination enforced. Evidence grounding forced. Novelty mechanism ("What does THIS paragraph reveal that wasn't already understood?") works.
- **L3.75 prompt: 8/10** — Voice map, earned-ness tracing, entanglements well-specified. Anti-contamination section comprehensive.
- **L3.5 prompt: 9/10** — Anti-inflation calibration outstanding ("If scores cluster 75-90 you have FAILED"). Reasoning-first scoring. Evidence requirements strong.
- **L4 prompt: 9/10** — North Star BAD/GOOD examples force essay-specific output.
- **L3.5 context assembly: EXCELLENT** — Gets complete holistic synthesis, all per-paragraph understanding, cross-paragraph connections, moment earnedness. No gaps.
- **Data flow: WORKS** at every layer boundary.

## What You Must Fix

### FIX 1 — L3 Token Budget Will Truncate Dense Paragraphs (CRITICAL)

`WALK_MAX_TOKENS = 4096`. For a paragraph with 8-10 sentences:
- `paragraphUnderstanding`: ~200-300 tokens
- Per-sentence understanding (8 sentences × ~300 tokens): ~2400 tokens
- `holisticEvolution` + `priorSentenceUpdates` + `newConnections`: ~300-800 tokens
- JSON overhead: ~200-400 tokens
- **Total: 3100-3900 tokens** for a normal paragraph. Dense 10+ sentence paragraphs **will exceed 4096** and truncate.

Truncation is catastrophic: JSON is cut mid-object, `jsonrepair` may produce a partial valid object, silently losing back-propagation and connection data (which come at the END of the output).

**What to do**:
1. Increase base `WALK_MAX_TOKENS` to 6144
2. Add dynamic scaling: `const maxTokens = Math.max(6144, sentenceCount * 500)` capped at 8192
3. In `parseWalkOutput`, after parsing: if `priorSentenceUpdates` or `newConnections` are missing from the parsed result, log a warning that truncation likely occurred (these fields come last in the JSON and are the first to be lost)

### FIX 2 — ImprovementPhase Must Reach L5 Before It Runs

L3.5's `computeImprovementPhase()` computes the phase from analysis results (Foundation/Architecture/Craft/Polish/Distinction). L5 reads `profile.index.improvementPhase` to determine annotation granularity — Foundation gets essay-level feedback, Polish gets sentence-level craft suggestions.

If the computed phase doesn't reach the profile before L5 starts, a polished essay gets Foundation-phase annotations ("Consider strengthening your thesis" instead of "The word 'ethereal' in S3 undercuts the grounded physicality you've built").

**What to do**:
1. Trace the orchestrator. After L3.5 completes, verify `coordinator.updateImprovementPhase(l35Result.improvementPhase)` is called BEFORE L5 starts.
2. If this call is missing, add it. The coordinator has `updateImprovementPhase()` — it just needs to be called at the right time in the orchestrator sequence.

### FIX 3 — L3 Index Confusion Between Prompt Labels and JSON Schema

The L3 system prompt uses 0-based indices in JSON schema (`"index": 0`) but the user prompt labels sentences as `S1, S2, S3` (1-based) and paragraphs as `P1, P2` (1-based). This cognitive split can cause off-by-one errors in back-propagation references — the model reads "P1S2" but needs to output `{"paragraph": 0, "sentence": 1}`.

**What to do**: Standardize the prompt so the model doesn't have to translate. Add an explicit, prominent instruction in the L3 system prompt:

```
INDEX CONVENTION: The essay is labeled with 1-based indices (P1, S1) for readability,
but ALL JSON output uses 0-based indices. P1 → paragraphIndex: 0. S1 → sentenceIndex: 0.
Always subtract 1 when writing JSON indices.
```

Place this NEAR the JSON schema examples so the model sees it alongside the output format.

### FIX 4 — L3.75 Field Names That Push Toward Evaluation

`craftAssessment.strengthSignatures` and `craftAssessment.growthEdges` — the words "strength" and "growth edges" push Sonnet toward evaluative language despite anti-contamination constraints. The LLM reads field names and infers their purpose. L3.75 is an UNDERSTANDING layer, not an analysis layer.

**What to do**: Rename in the L3.75 prompt output schema only:
- `strengthSignatures` → `craftSignatures` (what techniques are present — descriptive, not evaluative)
- `growthEdges` → `craftPatterns` (what patterns exist — observational, not prescriptive)

Add a mapping comment in the parser so the renamed prompt fields map to the existing profile field names. The anti-contamination instructions already describe the correct framing — the field names should match that framing.

### FIX 5 — Observation Labels for L3.5 Cross-Referencing

PLAN.md specifies observation labels ([U1], [U2]) for L3.5 to reference L3 understanding observations. Without labels, L3.5 either re-derives understanding (wasting tokens, risking different conclusions) or produces vague references ("The grounding function identified earlier...").

With labels, L3.5 can write: "Effectiveness: 82. [U1] achieves its grounding function well, but [U3]'s through-line setup is undermined by the abrupt clause break."

**What to do**: In the profile context builder for L3.5 (the function that serializes understanding into the prompt), label each understanding observation sequentially:

```
P0S0 Understanding:
  [U1] Observed: Grounds reader in pawnshop scene (conf: 0.9)
  [U2] Inferred: Establishes physical-world entry point (conf: 0.8)
  [U3] Narrative: Opens the diamond-as-value through-line (conf: 0.85)
```

Then add to the L3.5 system prompt: "Reference understanding observations by label (e.g., [U1]) rather than re-describing them. Your analysis should BUILD ON understanding, not re-derive it."

## Quality Gate

Run `npx tsc --noEmit` — zero errors. Then: imagine a dense 10-sentence paragraph in a college essay about working at a pawnshop. Will L3 produce complete understanding for all 10 sentences without truncation? Will the back-propagation and connections (which come LAST in the JSON) survive? Will L3.5 reference the understanding precisely and add analysis on top — not re-derive what L3 already found?

---

# CHAT 3: Coaching — Evidence-Grounded, Evolving Conversations

## The System

After the first analysis builds the profile, the REAL intelligence emerges when the student starts working. Edit → classify → re-analyze → coach. The system should feel like a human expert who KNOWS this essay deeply and coaches from that knowledge.

When a student asks "What if I meant it as irony?", the coaching service captures that insight, precisely updates the profile (not blunt replacement), and responds with phase-aware, evidence-grounded coaching that references specific sentences in their essay.

When a student keeps returning to their opening paragraph for the 4th time, the coach should notice and go DEEPER — not repeat the same surface observation.

The coaching experience is the student-facing product. Everything else (understanding, analysis, profile) exists to make coaching better.

**Read PLAN.md** — especially lines 3016-3183 (L6 Coaching stages), 1236-1410 (Conversation Insights 8 categories with mechanical behaviors), 6708-6858 (Progressive Precision / Improvement Phases).

## Your Files (read AND write)

| File | Lines | What It Does |
|------|-------|-------------|
| `src/services/essayIntelligence/coaching/coachingService.ts` | 1571 | L6: 4-stage pipeline — classify → context → coach → deepen |
| `src/services/essayIntelligence/analysis/editUnderstandingService.ts` | 1387 | Classifies edits: significance, type, scope |
| `src/services/essayIntelligence/analysis/focusedAnalyzer.ts` | 1567 | Surgical re-analysis on affected areas |
| `src/services/essayIntelligence/analysis/reanalysisOrchestrator.ts` | 871 | Decides focused vs comprehensive, lifecycle |
| `src/services/essayIntelligence/versionTracker.ts` | 873 | Edit tracking, staleness accumulation |
| `src/services/essayIntelligence/index.ts` | 95 | Barrel exports |

You may READ (not write): `profileTypes.ts`, `essayProfileManager.ts`, `profileRouter.ts`, `analysisOrchestrator.ts`, `PLAN.md`.

## What the Audit Found Works

- **Edit → Re-analysis flow**: Works end-to-end. Classification → staleness → mode selection → focused/comprehensive → delta application.
- **Focused Analyzer escalation**: All 4 levels function. Pre-mutation snapshots for rollback implemented. Delta application works.
- **Stage 3 Coaching prompt: 8.5/10** — REQUIRED elements + BANNED phrases + honesty protocol + phase-aware zoom. Will produce real coaching, not chatbot.
- **Phase-Aware Zoom: 9/10** — Hard constraints per phase. Foundation explicitly blocks word-level craft advice.
- **Version Tracker: 9/10** — Staleness accumulation, reversion detection, calibrated thresholds all correct.
- **Routing logic: CORRECT** — Uses `l6_coaching_paragraph` for paragraph questions, `l6_coaching_voice` for voice questions, `l6_coaching_overview` for general questions. The routing DECISIONS are right.

## What You Must Fix

### FIX 1 — Pattern Detection Is Inert (BIGGEST COACHING GAP)

The coaching service detects 3 patterns across the conversation (repeated focus, structural resistance, premature polish) and stores them via `coordinator.addPatternInsight()`. But the Stage 3 prompt builder **never reads them back**.

This means the coach will NEVER say: "I notice you keep returning to the opening — let's go deeper this time" or "You've asked about voice three times but haven't edited the paragraph where the voice actually shifts."

The data is collected. It just never reaches the prompt.

**What to do**:
1. In Stage 3 prompt construction, read `profile.patternInsights` (or wherever the coordinator stores patterns)
2. If patterns exist, add a section to the user prompt:
```
=== COACHING PATTERNS (observed across this conversation) ===
- Student has asked about their opening 4 times. Go deeper — don't repeat surface observations.
- Student agrees with feedback but has not edited P3 despite 3 turns discussing it. Gently probe why.
```
3. Add to the system prompt: "Use detected patterns to evolve your coaching. If the student keeps returning to a topic, go DEEPER each time — reference specific sentences you didn't mention before, explore a different dimension, or connect to something discussed since. If they're avoiding a paragraph that needs work, name it directly but supportively."

### FIX 2 — Reinterpretation Supersession Wastes Sonnet's Precision

When a student says "I meant that as irony," Stage 4 runs a Sonnet call that precisely identifies which observations are superseded vs confirmed:
- `supersededObservations: ["U2", "U5"]` (these were wrong given the new reading)
- `confirmedObservations: ["U1", "U3"]` (these still hold)

But the coordinator then calls `sentenceMutator.updateInferredIntents()` which replaces ALL inferred intents for the scope — throwing away U1 and U3 (which Stage 4 just confirmed!) along with U2 and U5.

The precision that Sonnet computed is wasted. The profile loses confirmed understanding.

**What to do**:
1. In the reanalysis orchestrator's Stage 4 handling (around line 368), after Stage 4 returns its verdict:
2. Read the current inferred intents for the affected sentences
3. Build a NEW intents array that: KEEPS all confirmed observations, REMOVES only superseded ones, ADDS the student's reinterpretation as a new observation
4. Pass this precise replacement array to the coordinator instead of the blunt scope replacement

The observation labels from Stage 4 are the key — they identify WHICH specific observations to keep vs remove.

### FIX 3 — Stage 1 Classifier Boundary Cases

Stage 1 (Haiku) classifies student messages into categories that determine the Stage 4 behavior. The categories have VERY different mechanical consequences:

- `reinterpretation` → Sonnet evaluation call (expensive, precise)
- `correction` → Direct profile update (no LLM call)
- `resistance` → Probe behavior (no profile update)

A reinterpretation misclassified as resistance skips the Sonnet evaluation entirely — the student's new reading never gets evaluated.

**What to do**: Add disambiguation guidance to the Stage 1 Haiku prompt:

```
=== DISAMBIGUATION FOR BOUNDARY CASES ===

correction vs resistance vs reinterpretation:
- "You misread that sentence — it's about X, not Y" → CORRECTION (the analysis made a factual error)
- "I know you think it's weak, but I WANT to keep it" → RESISTANCE (rejecting a suggestion)
- "Actually, I meant that paragraph to be ironic" → REINTERPRETATION (offering an alternative reading)

The test: Does the student say the ANALYSIS IS WRONG (correction)? Does the student REJECT A SUGGESTION (resistance)? Does the student offer AN ALTERNATIVE READING of their own text (reinterpretation)?

preference vs confirmation:
- "I like short sentences" → PREFERENCE (about style in general)
- "Yeah, I intentionally made it short there" → CONFIRMATION (about a specific observation we made)
```

### FIX 4 — Stage 3 Response Length Has No Phase Guidance

The Stage 3 prompt has no instruction about response length. Foundation-phase responses about thesis and arc should be 2-3 focused paragraphs. Polish-phase responses about a specific word choice should be 4-5 tight sentences. Without guidance, the model produces consistently long responses regardless of phase.

**What to do**: Add phase-specific length guidance to the Stage 3 system prompt:

```
RESPONSE LENGTH by phase:
- Foundation: 2-3 paragraphs. Big-picture observations, not exhaustive.
- Architecture: 2-3 paragraphs focused on the structural issue.
- Craft: 1-2 paragraphs with specific sentence-level alternatives.
- Polish: 4-6 sentences. Precise. One word change can be one sentence.
- Distinction: 1-2 paragraphs. The observation itself should be distinctive.

Shorter is almost always better. A 200-word response that quotes 2 specific lines
from the student's essay beats a 500-word essay about the student's essay.
```

### FIX 5 — No Anti-Repetition Between Coaching Turns

If a student asks about their opening, gets a response, then asks about the opening again 2 turns later, there's no mechanism to ensure the second response adds depth rather than rephrasing the first.

**What to do**: Add to the Stage 3 system prompt:

```
CONVERSATION EVOLUTION:
If the student returns to a topic previously discussed:
1. Check what you said last time about this topic (it's in the conversation history)
2. Do NOT rephrase your previous response
3. Go DEEPER: reference specific sentences you didn't cover before, explore a different
   dimension of the same topic, or connect it to something discussed in between
4. If there's genuinely nothing new to add, say so honestly: "I think we've covered the
   main aspects of your opening. The key move now is implementing the changes we discussed.
   Want to work through a revision together?"
```

## Quality Gate

Run `npx tsc --noEmit` — zero errors. Then: imagine a student who submits an essay, gets coaching, rewrites P3, asks "What if the diamond represents my self-worth?", gets a response that quotes their text and connects to their through-line, then asks about the opening for the 3rd time. Does the system feel like it KNOWS this essay? Does the coach go deeper each turn? Does the reinterpretation precision come through (keeping confirmed observations, removing only superseded ones)? Does the pattern detection surface that the student keeps avoiding P4?
