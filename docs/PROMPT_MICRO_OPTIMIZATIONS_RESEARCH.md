# Prompt-Level Micro-Optimizations for Maximizing Understanding Depth

> **Research Chat 5 Deliverable** — Concrete recommendations backed by web research, academic papers, and empirical findings across 40+ sources. Grounded in our actual codebase (`sequentialDeepWalk.ts`, `analysisPass.ts`, `holisticSynthesis.ts`, `crystallizer.ts`, `deepAnnotationService.ts`).

---

## Executive Summary: The Single Highest-Impact Optimization

**Hybrid prose-then-JSON output for L3 walk calls.**

Current state: L3 asks Sonnet to produce a complex JSON object directly. This forces the model into "slot-filling mode" — generating content to populate fields rather than thinking deeply about meaning. Research consistently shows that unconstrained prose reasoning before structured extraction produces deeper analytical output.

**Estimated impact: 30-50% improvement in observation depth** (from structural to architectural level), with a moderate implementation cost (two-phase output or prose preamble field).

---

## 1. Output Format & Quality: JSON vs Prose vs Hybrid

### Research Findings

**JSON constrains analytical depth.** When models generate structured JSON directly, they enter "item generation mode" — producing discrete entries to fill schema fields rather than developing interconnected reasoning. This is especially damaging for literary analysis where insights emerge from connections between observations.

Key evidence:
- **[Tam et al., EMNLP 2024] "Let Me Speak Freely?"** ([arxiv: 2408.02442](https://arxiv.org/abs/2408.02442)): **10-15% performance degradation on reasoning tasks when locked into JSON-mode** vs free-form generation. Stricter constraints produce greater degradation. Classification tasks less affected — the damage is specifically to *reasoning-heavy* tasks like ours.
- **[ACL 2025] "Does Forcing Structured Output Degrade LLM Creativity?"**: **Average 17% creativity degradation**, up to **26% in severe cases**. Decomposes into "creative constraint" effect (cognitive load of simultaneous creation + formatting harms ideation). Validated "generate-then-structure" as the solution.
- **[CRANE, ICML 2025]** ([arxiv: 2502.09061](https://arxiv.org/abs/2502.09061)): By **alternating between unconstrained generation (reasoning) and constrained generation (structure)**, accuracy improves up to 10 percentage points. Key insight: the model needs **unconstrained "reasoning space"** between structural elements.
- **[RANLP 2025] "The Hidden Cost of Structure"**: Constrained decoding distorts the model's probability distribution — when high-probability tokens are masked, remaining tokens are renormalized, producing outputs that are syntactically correct but semantically less natural.
- **JSON field ordering matters** (Dylan Castillo, 2024, p < 0.01): Putting `answer` before `reasoning` causes premature commitment. Our schema has `paragraphUnderstanding` before `sentenceUnderstandings`, and `holisticEvolution`/`priorSentenceUpdates` LAST — meaning back-propagation insights come after the model has already committed to all observations.
- **Anthropic's "think" tool**: Anthropic Engineering explicitly designed a tool giving the model a reasoning scratchpad before structured output. In benchmarks, achieved **54% relative improvement** over baseline. Extended thinking is NOT compatible with structured outputs (constrained decoding) — an implicit acknowledgment that formatting and reasoning are in tension.

**The hybrid approach is optimal**: Generate prose understanding first (the actual analytical thinking), then extract structured data from it.

### Recommendations for Our Pipeline

| Layer | Current | Recommended | Rationale |
|-------|---------|-------------|-----------|
| **L3 Walk** | Direct JSON | **Hybrid: prose understanding → JSON extraction** | Walk is the depth-critical layer. Prose-first will produce architectural observations |
| **L3.5 Analysis** | Direct JSON | Keep JSON (with sentenceRanking preamble) | Already has "rank before score" — the ranking IS the prose-first step |
| **L3.75 Holistic** | Direct JSON | **Add prose synthesis preamble field** | Simultaneous vision benefits from unrestricted synthesis first |
| **L4 Crystallizer** | Direct JSON | Keep JSON | Synthesis of existing understanding, not new analysis |
| **L5 Annotations** | Direct JSON | Keep JSON | Feedback generation, not deep analysis |

### Implementation Options for L3

**Option A: Two-phase within one call (recommended)**
Add a `"reasoning"` field as the FIRST field in the JSON schema:
```json
{
  "reasoning": "Free-form prose: What does this paragraph reveal about the essay's architecture of meaning? Think through connections, surprises, and what the accumulated understanding now looks like with this paragraph added...",
  "paragraphUnderstanding": { ... },
  "sentenceUnderstandings": [ ... ]
}
```
The model will write the prose first (because it's the first field), then populate the structured fields informed by that reasoning. This is essentially chain-of-thought embedded in the output.

**Option B: Two separate calls**
1. Sonnet generates free prose understanding (~500-800 tokens)
2. Same Sonnet call (or Haiku) extracts structured JSON from the prose

Pros: Cleanest separation. Cons: Double the cost, double the latency. Not recommended for sequential walk.

**Option C: Extended thinking (see Section 7)**
Enable extended thinking with budget_tokens. The model reasons internally before producing JSON. No output schema change needed. But: extended thinking is not compatible with temperature settings, and thinking tokens are billed as output tokens.

**Verdict: Option A** — lowest friction, no cost increase, immediate depth improvement. The `reasoning` field acts as a cognitive forcing function.

---

## 2. Temperature Tuning Across Stages

### Research Findings

**Temperature and analytical depth have a weak, non-linear relationship.**

Key evidence:
- **[arxiv: 2405.00492] "Is Temperature the Creativity Parameter of LLMs?"**: Temperature is *weakly* correlated with novelty and *moderately* correlated with incoherence. No relationship with cohesion or typicality. Higher temperature ≠ deeper analysis.
- **The 0-0.3 range is a plateau**: Both 0 and 0.3 operate in the "deterministic zone." The practical difference between them is negligible for analytical tasks. The softmax distribution is already sharp enough that the top tokens dominate.
- **For literary analysis specifically**: No research shows higher temperature improving depth. Temperature affects *diversity* of token selection, not *quality* of reasoning. A temperature of 0.5 might produce more *unusual* word choices but not more *insightful* observations.
- **Extended thinking requires temperature=1**: When using extended thinking, temperature and top_k cannot be set (API constraint). top_p can be 0.95-1.0.

### Temperature Recommendations Per Stage

| Stage | Current | Recommended | Rationale |
|-------|---------|-------------|-----------|
| **L1 First Impressions** (Haiku) | — | 0.2 | Quick descriptive — low creativity needed |
| **L2 Structural Map** (Sonnet) | — | 0.3 | Structure analysis — consistency matters |
| **L2.5 Scout** (Haiku) | — | 0.4 | Connection detection benefits slightly from diversity |
| **L3 Walk** (Sonnet) | 0.3 | **0.3 → keep OR 0.5 for Option C** | 0.3 is fine for direct JSON. If using extended thinking, temperature becomes moot (forced to 1) |
| **L3.75 Holistic** (Sonnet) | 0.4 | **0.4 → keep** | Already slightly elevated. Good balance for synthesis |
| **L3.5 Analysis** (Sonnet) | 0.3 | **0.2** | Scoring calibration needs maximum consistency. Lower is better for reproducible scores |
| **L4 Crystallizer** (Sonnet) | 0.3 | **0.3 → keep** | Interpretive synthesis — moderate consistency |
| **L5 Annotations** (Sonnet) | — | 0.3 | Feedback generation — consistent quality |
| **L6 Coaching** (varies) | — | 0.5 (Sonnet) / 0.3 (Haiku) | Conversational responses benefit from warmth |

**Key insight**: Temperature tuning is a **low-impact optimization** for our pipeline. The variance between 0.2 and 0.5 is dwarfed by prompt quality, context ordering, and output format effects. Don't spend engineering time micro-tuning temperature — spend it on the prompt structure.

**One exception**: Drop L3.5 Analysis from 0.3 to 0.2. Score consistency is the one place where temperature reduction has a clear, measurable benefit (less variance in repeated scoring runs).

---

## 3. Context Ordering Effects

### Research Findings

**The "Lost in the Middle" phenomenon is real and well-documented.**

Key evidence:
- **[Liu et al., 2023, TACL 2024] "Lost in the Middle"** ([arxiv: 2307.03172](https://arxiv.org/abs/2307.03172)): LLMs follow a **U-shaped attention curve** — highest when info is at beginning or end, lowest in the middle. GPT-3.5 dropped **>20%** when relevant info was in the middle vs beginning/end. Performance with middle-positioned info was **worse than having no documents at all** (closed-book 56.1%). Robust across GPT, Claude, Llama, T5.
- **[Guo & Vosoughi, 2024]** ([arxiv: 2406.15981](https://arxiv.org/abs/2406.15981)): Primacy effect appeared in **73/104 test instances**, consistent across models. For analytical tasks (our use case), primacy dominates over recency.
- **Attention sinks** ([MIT/HanLab, ICLR 2025]): ~80% of attention concentrates on beginning-of-sequence tokens due to architectural properties. Early tokens get disproportionate attention regardless of content.
- **Anthropic's own testing**: "Queries at the end can improve response quality by **up to 30%**, especially with complex, multi-document inputs." And: "Put long documents near the top of your prompt, above your query, instructions, and examples."
- **Decoder-only architecture** ([arxiv: 2504.09402](https://arxiv.org/abs/2504.09402)): Claude processes text unidirectionally — each token only attends to previous tokens. Questions AFTER text is optimal because the model has "read" the full text when it encounters the question.
- **Re-reading (Re2)** ([arxiv: 2309.06275](https://arxiv.org/abs/2309.06275)): Re-reading the question/focus improves reasoning by increasing question-related token proportion. Supports adding a FOCUS SUMMARY at recency position.

### Current L3 Walk Ordering (lines 616-753)

```
1. RE-ANALYSIS CONTEXT (if re-analysis)     ← PRIMACY position
2. FULL ESSAY TEXT                           ← Early, good for "reading" the essay
3. ACCUMULATED UNDERSTANDING                 ← MIDDLE — lost-in-the-middle risk!
4. HOLISTIC EVOLUTION                        ← Middle
5. TARGET PARAGRAPH + SENTENCES              ← Pre-recency
6. L1 IMPRESSIONS                            ← Pre-recency
7. L2 STRUCTURAL ROLE                        ← Pre-recency
8. SCOUT LEADS                               ← Pre-recency
9. INVESTIGATION QUESTIONS                   ← RECENCY position — good
10. "Produce the JSON understanding"         ← Final instruction
```

### Recommended Ordering

```
1. INVESTIGATION QUESTIONS (question-first)  ← PRIMACY: "Here's what to look for"
2. FULL ESSAY TEXT                           ← Read the essay with purpose
3. TARGET PARAGRAPH + SENTENCES              ← Focus area (still near essay)
4. L1 IMPRESSIONS + L2 STRUCTURAL ROLE       ← Lightweight scaffolding
5. SCOUT LEADS                               ← Investigation prompts
6. ACCUMULATED UNDERSTANDING                 ← RECENCY: most critical context
7. HOLISTIC EVOLUTION                        ← Recency: thesis/voice/arc
8. RE-ANALYSIS CONTEXT (if re-analysis)      ← Recency: what changed
9. "Produce the JSON understanding"          ← Final instruction
```

**Key changes:**
1. **Move investigation questions to the TOP** (question-first reading). The model "reads" the essay with purpose — knowing what to look for before it sees the text.
2. **Move accumulated understanding to near the END** (recency). This is the most critical context — what we've already learned. It should be the freshest context when the model starts generating.
3. **Keep essay text early** but AFTER the investigation questions. The model reads with a "lens."

**Caveat — caching implications**: The current ordering puts essay text (Block 2) first for cache_control reasons. Reordering may reduce cache hits if the essay text moves. The investigation questions change per paragraph, so they can't be cached. **Compromise**: Keep the current Block 2 (essay + accumulated understanding) as-is for caching, but add a short "FOCUS" section at the very end (recency position) that re-states the key investigation questions and accumulated thesis. This gets recency benefits without breaking caching.

### Recommended Compromise (cache-safe)

```
[CACHED BLOCK 2: essay text + accumulated understanding]  ← Cache-friendly
[BLOCK 3: target paragraph + L1 + L2 + scout leads]      ← Per-paragraph
[NEW: FOCUS SUMMARY]                                       ← RECENCY position
  "BEFORE GENERATING: Review these key questions:
   1. What does P{N} reveal that wasn't already understood?
   2. Emerging thesis: {thesis} (confidence: {conf})
   3. Voice signature: {voice}
   4. Look for: {scout lead summaries}"
"Produce the JSON understanding."                          ← Final instruction
```

This adds ~100-150 tokens per call but puts critical guidance in the recency position.

---

## 4. Few-Shot Examples for Understanding Levels

### Research Findings

**Contrastive examples are highly effective. 3-5 examples is optimal. More can hurt.**

Key evidence:
- **Anthropic's official guidance**: "Include 3–5 diverse, relevant examples. Wrap in `<example>` tags. More examples = better performance, especially for complex tasks."
- **[arxiv: 2509.13196] "The Few-Shot Dilemma: Over-Prompting LLMs"**: Adding excessive examples can *degrade* performance. Diminishing returns beyond 4-5 examples, with actual degradation beyond that for some models. The optimal turning point depends on model long-context comprehension and example relevance.
- **[Chia et al., arxiv: 2311.09277] Contrastive Chain-of-Thought**: Providing both valid and invalid reasoning demonstrations reduces reasoning mistakes. Gains of **+10 to +16 points** on benchmarks over standard CoT. Invalid examples tell the model *what to avoid*.
- **[RULERS, arxiv: 2601.08654] Evidence-anchored rubrics**: Locked rubrics with evidence requirements eliminate **central tendency bias** — the tendency to hedge toward the middle of any scale. If you show all 5 levels, the model gravitates toward L3. Show only the target level with brief boundary descriptions.
- **[Stahl et al., arxiv: 2404.15845] Essay scoring**: "One-shot learning outperforms few-shot learning, but the effect is rather small." Even 1-2 well-chosen examples may suffice for scoring tasks.
- **Anchoring bias in LLMs** (Springer 2025): "Common-sense mitigation techniques like Chain-of-Thought, telling the model to 'ignore' the hint, or encouraging reflection are largely **ineffective**." Structural diversity and meta-instructions are the only reliable defenses.
- **[Cognitive Forcing, arxiv: 2506.12115]**: Requiring the model to articulate what makes the current input unique BEFORE analysis improves performance by up to **66.7%** on complex problems.
- **"Guardrail-to-Handcuff" transition** [arxiv: 2510.22251]: For advanced models like Sonnet, excessive constraints designed to prevent errors can induce "hyper-literalism" — the model follows the letter of examples rather than their spirit.

### Current State in L3 Walk Prompt

The system prompt includes 3 contrastive pairs (SURFACE → STRUCTURAL → ARCHITECTURAL), plus 3 upgrade examples (STRUCTURAL → ARCHITECTURAL). Total: ~6 example pairs. This is at the upper boundary of the optimal range.

### Recommendations

1. **Keep the 3-level depth examples (SURFACE/STRUCTURAL/ARCHITECTURAL)** — these are the most valuable. The contrastive progression teaches the quality dimension.

2. **Reduce upgrade examples from 3 to 2** — the third example ("Uses simile to reframe...") adds diminishing value and risks anchoring. Remove the weakest one.

3. **DO NOT add examples from the same essay being analyzed** — this would anchor the model to specific observations. Examples should be from *different* essays to teach the *pattern* not the *content*.

4. **Add one ANTI-example** — show an observation that LOOKS architectural but isn't:
   ```
   PSEUDO-ARCHITECTURAL (common trap — sounds deep but is actually structural wearing a costume):
     "The constraint-possibility paradox reveals the essay's relationship between creativity
     and limitation, demonstrating how the writer constructs meaning through juxtaposition."
   WHY THIS FAILS: It uses architectural vocabulary ("reveals", "constructs meaning") but
     doesn't actually say WHAT is revealed or WHAT meaning is constructed. Strip away the
     impressive vocabulary and it says "this technique does something meaningful." THAT'S NOT
     ENOUGH — name the specific meaning.
   ```

5. **Consider dynamic example selection for later paragraphs** — P1 benefits from "opening paragraph" examples. P5 benefits from "closing paragraph" examples. This is a V2 optimization, not urgent.

### Evidence Grounding: The Absence Problem

Research confirms our concern: **LLMs struggle with absence evidence** ([AbsenceBench, arxiv: 2506.11440]).

Key findings:
- LLMs find it harder to identify omissions than insertions
- Explicitly marking omissions improves performance by ~35%
- Models are overconfident about what's in the text, underperforming on what's NOT in it

**Recommendation**: Add an explicit "absence check" prompt section:
```
=== ABSENCE CHECK ===
What is this paragraph NOT doing that a reader might expect at this point?
What emotions are implied but not stated? What connections are NOT made?
When noting absences, frame as: "Notable absence: [what's missing] — evidence: [what IS present that makes the absence meaningful]"
```

This gives the model permission and a framework for absence-evidence, which our current "every observation must cite specific text" requirement implicitly discourages.

---

## 5. Preventing Common Failure Modes

### Observation Regression (L1-2 depth despite L4-5 instructions)

**Root cause**: The model defaults to its training distribution, which is dominated by surface-level literary commentary. Our detailed instructions fight against this gravitational pull.

**Effective techniques**:
1. **Self-check forcing function** (already in prompt — "After writing each observation, re-read it"). Research confirms this works — it's a form of in-context self-critique.
2. **The "reasoning" preamble field** (Section 1, Option A) — forces deep thinking before structured output.
3. **Negative examples** (Section 4, anti-example) — shows what regression looks like so the model can self-detect.
4. **Question-first reading** (Section 3) — primes the model for depth before it reads the text.

### Evaluation Contamination

**Root cause**: The model's training includes massive amounts of literary criticism that evaluates quality. "Effectively" and "strong" are deeply embedded in the model's literary analysis register. RLHF training compounds this — LLMs offer emotional validation in **76% of cases** (vs. 22% for humans) and exhibit sycophantic agreement in **58.19% of cases** across major models ([SycEval, arxiv: 2502.08177]).

**Effective techniques**:
1. **Positive instructions over vocabulary bans** (THE PINK ELEPHANT PROBLEM): Research ([arxiv: 2503.22395](https://arxiv.org/abs/2503.22395)) shows "Do not do X" is **much less effective** than "Do Y instead." LLMs struggle with negation due to architectural characteristics. Our current FORBIDDEN VOCABULARY section should be restructured:
   - BAD: "Do NOT use words like 'effectively', 'demonstrates', 'employs'"
   - BETTER: "Describe exactly what the text does. Use the pattern: '[quoted text] does X because Y.' Never characterize quality — only describe mechanism."
2. **Structural separation** (already designed — L3 understand, L3.5 evaluate). This is the strongest defense. Contamination is a per-call problem, not a pipeline problem.
3. **Role separation**: "You are an OBSERVER. Observers describe mechanisms. Critics evaluate quality. You are NOT a critic." Framing the role explicitly helps more than just listing banned words.
4. **Output validation** (see Section 9) — catch contamination programmatically and flag it.

### Repetition Across Sequential Calls

**Root cause**: The accumulated understanding contains the same observations the model is being asked to produce. The model's path of least resistance is to rephrase what it's already seen. Research shows all top LLMs exhibit **39% lower performance in multi-turn conversations** vs. single-turn ([arxiv: 2505.06120](https://arxiv.org/abs/2505.06120)) — once they take a wrong turn, they do not recover. Our sequential walk is inherently multi-turn in spirit (even if technically separate calls).

**Effective techniques**:
1. **Novelty-driven prompting** (already in prompt — "What does THIS paragraph reveal that wasn't already understood?"). This is the strongest technique.
2. **Recursive summarization over raw history**: Research shows naive full-context passing causes lost-in-the-middle degradation, but **recursive summarization** (iteratively producing new memory from old memory + new context) is the most effective approach. Our accumulated understanding with observation IDs ([U1], [U2]) is close to this ideal.
3. **Supersession model** (already designed — arrays REPLACED). This is the architectural defense.
4. **Add a "novelty threshold"**: "If this paragraph reveals fewer than 2 genuinely new architectural insights, that's fine — say so rather than padding with structural-level restatements."
5. **Prompt repetition**: Repeating the core instruction ("Describe mechanism, not quality. Quote text.") at both the START and END of the user prompt improves non-reasoning performance — won **47 out of 70 tests with 0 losses** ([arxiv: 2512.14982](https://arxiv.org/abs/2512.14982)). Zero cost, zero latency impact.

### Generic Prose / Template Language

**Root cause**: "This essay explores themes of X through the lens of Y" is the most common literary analysis sentence in the training data. The model gravitates to it.

**Most effective technique**: **Specificity forcing function** — require the model to name specific text. Our evidence grounding requirement does this, but could be stronger:

Current: "Every observation MUST cite specific text"
Stronger: "Every observation MUST quote at least 3 specific words from the essay. If your observation could apply to a different essay without changing the quoted words, it's too generic — rewrite it."

This "portability test" is the most effective anti-generic defense. An observation that's true of any essay is, by definition, not about THIS essay.

---

## 6. Structured Output Modes

### Research Findings

**Tool-use (function calling) constrains analytical depth the most. JSON mode constrains moderately. Free text is unconstrained.**

Key evidence:
- **Tool-use/function calling**: The model generates arguments for a function schema. This is the most constraining mode — the model is optimizing for schema compliance, not analytical depth. Not recommended for literary analysis.
- **JSON mode** (`useJsonMode: true`): The model generates JSON-formatted text. Less constraining than tool-use but still shapes output. The model can still "think" within string values.
- **Free text → extract**: Unconstrained reasoning followed by structured extraction. Highest quality but double the cost.

### Current State

Our pipeline uses `useJsonMode: true` with explicit JSON schemas in the prompt. This is a reasonable middle ground.

### Recommendation

**Keep JSON mode but add the `reasoning` preamble field** (Section 1, Option A). This gives us the best of both worlds:
- JSON mode ensures parseable output (no markdown wrapper, no preamble text)
- The `reasoning` field gives the model unconstrained analytical space
- The structured fields are populated *after* the reasoning, informed by it

**Do NOT switch to tool-use** for L3/L3.75. Tool-use is designed for "extract specific data points from text" — not for "generate deep analytical insights about text."

---

## 7. Extended Thinking / Thinking Tokens

### Research Findings

**Extended thinking significantly improves complex reasoning — 15+ point improvement on GPQA Diamond (68% → 84.8%).**

Key details:
- **Constraint**: Extended thinking is NOT compatible with temperature or top_k. top_p must be 0.95-1.0. No response pre-filling.
- **Pricing**: Thinking tokens are billed as **output tokens** (same rate). They count toward context window and rate limits.
- **Budget**: Minimum 1,024 tokens. Recommended 4,000-16,000 for complex tasks. Models may not use the full budget.
- **Claude Opus 4.6**: `budget_tokens` deprecated — use `type: "adaptive"` instead.
- **Claude Sonnet 4.5** (our model): `budget_tokens` still supported.

### Cost-Benefit Analysis for Our Pipeline

| Layer | Current Output Tokens | Thinking Budget | Added Cost | Depth Benefit |
|-------|----------------------|-----------------|------------|---------------|
| **L3 Walk (P1)** | ~3000-4000 | 8,000 | ~$0.024/call | **HIGH** — P1 sets the depth ceiling |
| **L3 Walk (P2-PN)** | ~1500-3000 | 4,000 | ~$0.012/call | **MODERATE** — novelty-driven, less thinking needed |
| **L3.75 Holistic** | ~8000-12000 | 16,000 | ~$0.048/call | **HIGH** — simultaneous vision benefits from deep reasoning |
| **L3.5 Analysis** | ~2000-3000 | 4,000 | ~$0.012/call | **LOW** — scoring is judgment, not exploration |
| **L4 Crystallizer** | ~6000-8000 | 8,000 | ~$0.024/call | **MODERATE** — North Star synthesis |

**Total added cost per essay** (7 paragraphs): ~$0.15-0.25
**Current total cost per essay**: ~$0.50-0.75
**Percentage increase**: ~20-35%

### Recommendation

**Phase 1: Enable extended thinking for L3 P1 only** — the opening paragraph sets the depth ceiling for the entire walk. If P1's understanding is architectural, subsequent paragraphs follow. If P1 is structural, the walk stays structural.

- Set `budget_tokens: 8192` for P1
- Set `budget_tokens: 4096` for P2-PN
- Remove temperature parameter (incompatible)
- Monitor: compare observation depth (Level 1-5) with and without thinking

**Phase 2: Enable for L3.75 Holistic** — this layer benefits most from "seeing everything simultaneously" and extended reasoning about connections.

**Phase 3: Skip for L3.5/L4/L5** — these layers do judgment/synthesis/feedback, not deep exploration. Extended thinking is overkill.

**Can extended thinking replace multi-pass analysis?** Partially. One deep-thinking L3 pass might produce understanding that currently requires L3 + back-propagation. But the sequential walk's progressive refinement (P3 updates P1) is a fundamentally different mechanism than longer single-pass thinking. **Keep the multi-pass architecture**, just add thinking to the most critical calls.

---

## 8. Evidence Grounding Techniques

### Research Findings

**Evidence requirements improve analytical quality significantly, but have a documented blind spot for absence-evidence.**

Key evidence:
- **RULERS framework** [arxiv: 2601.08654]: "Locked rubrics and evidence-anchored scoring" — requiring verbatim text grounding eliminates central tendency bias and produces more discriminating evaluations. The "compiler-executor" protocol (extract evidence, then reason about it) outperforms direct reasoning.
- **AbsenceBench** [arxiv: 2506.11440]: LLMs struggle to identify what's *missing* from text. Performance on absence detection is much lower than presence detection, even at medium context lengths.
- **Overconfidence beyond evidence** [arxiv: 2509.25498]: Models add "confident analysis unsupported by sources" and "transform attributed opinions into declarative statements." Evidence requirements are the primary defense against this.

### Current State

Our prompt requires: "Every observation MUST cite specific text — quote the actual words. This is a cognitive forcing function."

### Recommendations

1. **Strengthen the evidence requirement** with the "portability test":
   ```
   PORTABILITY TEST: After writing an observation, ask: "Could this observation apply to
   a DIFFERENT essay without changing the quoted evidence?" If yes, the observation is
   generic — rewrite to be specific to THIS essay's architecture.
   ```

2. **Add explicit absence-evidence framework** (see Section 4):
   - Permission: "You MAY observe meaningful absences"
   - Format: "Notable absence: [what's missing] — evidence: [what IS present that makes the absence meaningful]"
   - This addresses the limitation where strict evidence requirements prevent observing what ISN'T there

3. **For L3.5 Analysis**: The RULERS-inspired approach of "extract evidence first, then score" is exactly what our sentenceRanking field does. **Keep this pattern.** It's academically validated as the strongest approach to scoring calibration.

4. **Confidence scores should track evidence density**:
   - 3+ quoted words → confidence 0.8-0.95
   - 1-2 quoted words → confidence 0.6-0.8
   - No quoted words (absence observation) → confidence 0.4-0.6
   - Add this guidance to the prompt to make confidence scores meaningful

---

## 9. Anti-Pattern Detection (Programmatic Quality Checks)

### Heuristic Quality Signals (No LLM Needed)

These regex/string checks can run on every L3 output in <1ms:

#### Surface-Level Vocabulary Detector
```typescript
const SURFACE_VOCABULARY = [
  // Technique-identification (Level 1)
  /\buses\b/i, /\bemploys\b/i, /\butilizes\b/i, /\bdemonstrates\b/i,
  /\bshowcases\b/i, /\bhighlights\b/i, /\billustrates\b/i,
  // Generic analytical (Level 1-2)
  /\bexplores\s+themes?\b/i, /\bthrough\s+the\s+lens\b/i,
  /\bin\s+the\s+context\s+of\b/i, /\bserves\s+to\b/i,
  /\bacts\s+as\b/i, /\bfunctions\s+as\b/i,
  // Template prose
  /\bThis\s+(?:essay|paragraph|sentence)\s+(?:explores|examines|delves)\b/i,
  /\b(?:effectively|skillfully|masterfully)\b/i,  // evaluation contamination
];

function surfaceVocabularyScore(text: string): number {
  const matches = SURFACE_VOCABULARY.filter(re => re.test(text)).length;
  const wordCount = text.split(/\s+/).length;
  return matches / (wordCount / 100); // matches per 100 words
  // Score > 3: likely Level 1-2. Score < 1: likely Level 3+.
}
```

#### Evidence Density Checker
```typescript
function evidenceDensity(observations: Array<{observation: string; evidence: string}>): number {
  if (observations.length === 0) return 0;

  let groundedCount = 0;
  for (const obs of observations) {
    // Evidence must contain actual quoted words (not just reference to paragraph/sentence)
    const hasQuotedText = /["'][\w\s]{3,}["']/.test(obs.evidence)
      || /["'][\w\s]{3,}["']/.test(obs.observation);
    const hasSpecificRef = /P\d+S\d+/.test(obs.evidence) || /P\d+S\d+/.test(obs.observation);
    if (hasQuotedText || hasSpecificRef) groundedCount++;
  }

  return groundedCount / observations.length;
  // Score < 0.5: likely low quality. Score > 0.8: well-grounded.
}
```

#### Novelty Checker (Cross-Paragraph Repetition)
```typescript
function noveltyScore(
  currentObservations: string[],
  priorObservations: string[]
): number {
  if (currentObservations.length === 0) return 0;

  let novelCount = 0;
  for (const obs of currentObservations) {
    // Check if this observation's key phrases already appear in prior observations
    const keyPhrases = extractKeyPhrases(obs); // 3-grams excluding stop words
    const isNovel = !priorObservations.some(prior =>
      keyPhrases.some(phrase => prior.toLowerCase().includes(phrase.toLowerCase()))
    );
    if (isNovel) novelCount++;
  }

  return novelCount / currentObservations.length;
  // Score < 0.3 for P3+: likely repetition problem
}

function extractKeyPhrases(text: string): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 3);
  const phrases: string[] = [];
  for (let i = 0; i < words.length - 2; i++) {
    phrases.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
  }
  return phrases;
}
```

#### Observation Length & Specificity
```typescript
function observationQualityMetrics(observation: string): {
  wordCount: number;
  hasArchitecturalLanguage: boolean;
  hasEssaySpecificDetail: boolean;
  qualityEstimate: 'surface' | 'structural' | 'architectural';
} {
  const wordCount = observation.split(/\s+/).length;

  // Architectural observations typically 30+ words (they explain WHY, not just WHAT)
  // Surface observations are typically 8-15 words

  const architecturalPatterns = [
    /\breveals?\b.*\b(?:about|how|that)\b/i,  // "reveals [something] about [deeper meaning]"
    /\bIS\s+the\s+essay's\b/i,                 // "IS the essay's [argument/claim/definition]"
    /\bwhen\b.*\b(?:arrives?|appears?|shifts?)\b/i, // temporal reasoning across paragraphs
    /\bepistemo/i,                              // epistemological reasoning
    /\bmeaning-making\b/i,
  ];

  const hasArchitecturalLanguage = architecturalPatterns.some(re => re.test(observation));
  const hasEssaySpecificDetail = /["'][\w\s]{5,}["']/.test(observation); // Quoted text

  let qualityEstimate: 'surface' | 'structural' | 'architectural' = 'surface';
  if (wordCount > 20 && hasEssaySpecificDetail) qualityEstimate = 'structural';
  if (wordCount > 35 && hasArchitecturalLanguage && hasEssaySpecificDetail) qualityEstimate = 'architectural';

  return { wordCount, hasArchitecturalLanguage, hasEssaySpecificDetail, qualityEstimate };
}
```

### Composite Quality Score

```typescript
interface ParagraphQualityReport {
  surfaceVocabScore: number;     // < 1 good, > 3 bad
  evidenceDensity: number;        // > 0.8 good, < 0.5 bad
  noveltyScore: number;           // > 0.5 good for P2+, < 0.3 bad
  avgObservationWords: number;    // > 25 good, < 12 bad
  architecturalRatio: number;     // > 0.5 good, < 0.2 bad
  overallQuality: 'pass' | 'warn' | 'fail';
  failReasons: string[];
}

function assessParagraphQuality(/* ... */): ParagraphQualityReport {
  // ... compute individual metrics ...

  const failReasons: string[] = [];
  if (surfaceVocabScore > 3) failReasons.push('High surface vocabulary density');
  if (evidenceDensity < 0.5) failReasons.push('Low evidence grounding');
  if (paragraphIndex > 0 && noveltyScore < 0.3) failReasons.push('High repetition with prior paragraphs');
  if (avgObservationWords < 12) failReasons.push('Observations too short for architectural depth');
  if (architecturalRatio < 0.2) failReasons.push('No architectural-level observations detected');

  return {
    // ...metrics...
    overallQuality: failReasons.length >= 2 ? 'fail' : failReasons.length === 1 ? 'warn' : 'pass',
    failReasons,
  };
}
```

### Automatic Re-Analysis

**Should low-quality output trigger automatic retry?** Yes, but carefully.

Research from the **PRoMPTed paper** ([arxiv: 2310.02107](https://arxiv.org/html/2310.02107v3)) shows that **rewriting the prompt for the specific instance is more effective than iteratively refining output based on feedback**. Output refinement fixes local issues but cannot introduce new reasoning paths.

**Recommended retry strategy (escalating)**:

1. **Only retry on 'fail'** (2+ quality signals triggered), not on 'warn'
2. **Retry 1 — Feedback-based re-prompt**: "Your previous analysis scored poorly: {specific failures}. Re-analyze. Quote specific text. Describe mechanisms, not quality."
3. **Retry 2 — Different prompt structure**: Switch framing entirely: "You are a reader encountering this paragraph for the first time. What surprises you? What confuses you? Compare what this paragraph does to what a generic version would do."
4. **Retry 3 — Decompose**: Break the paragraph into sub-tasks (one call per 2-3 sentences). Prompt chaining improves accuracy over monolithic prompts.
5. **Maximum 2 retries per paragraph** — diminishing returns beyond that
6. **Use a slightly different temperature** (0.4 instead of 0.3) on retry — nudges the model off the same token path
7. **Log quality scores** for monitoring — this data reveals which essays/paragraph types consistently produce low quality

---

## 10. Prompt Length vs Quality

### Research Findings

**There is a sweet spot. Too short = insufficient guidance. Too long = instruction-following degradation.**

Key evidence:
- **[Context Rot, Chroma Research 2025]**: Performance degrades at **EVERY context length increment**, not just near the limit. A 1M token context window still exhibits degradation at 50K tokens. Adding semantically similar but irrelevant content (distractors) causes *additional* degradation beyond what length alone explains. **LLM reasoning degrades at just 3,000 tokens of input** — much shorter than technical maximums.
- **[IFScale benchmark]** ([arxiv: 2507.11538](https://arxiv.org/html/2507.11538v1)): Three degradation patterns by model type: (1) **threshold decay** — near-perfect until a cliff (reasoning models), (2) **linear decay** — steady degradation per constraint (**Claude Sonnet 4**), (3) **exponential decay** — rapid collapse (GPT-4o, Llama). Even the best model achieved only **50.71% accuracy** on strict multi-constraint following.
- **[arxiv: 2512.14754]**: "Performance does not consistently improve with larger model sizes" for instruction following.
- **[arxiv: 2510.22251] "Guardrail-to-Handcuff"**: Advanced models (like Sonnet) can be over-constrained by excessive rules. Sophisticated constrained prompting **substantially benefits mid-tier models** (97% vs 93%) but becomes **actively detrimental on advanced models** (94% vs 96.36%). The constraints that prevent common-sense errors in weaker models induce **hyper-literalism** in stronger models.
- **Anthropic's guidance**: Use XML tags to structure, break complex tasks into subtasks, explain WHY something matters.

### Current State

Our L3 system prompt is ~1500 tokens. It contains:
- Role definition (~100 tokens)
- Understanding-only constraint + vocabulary ban (~200 tokens)
- 3-level depth examples (~400 tokens)
- Self-check forcing function (~150 tokens)
- 3 upgrade examples (~300 tokens)
- Evidence grounding (~100 tokens)
- Novelty-driven growth (~100 tokens)
- Back-propagation instructions + examples (~200 tokens)
- Connection investigation + examples (~150 tokens)
- Index convention (~50 tokens)
- Output schema (~500 tokens)
- Critical reminders (~100 tokens)

Total: ~2350 tokens (larger than estimated — worth measuring precisely)

### Recommendations

1. **The prompt is at the upper boundary of the effective range.** At ~2350 tokens of system instructions + a complex JSON schema, the model is processing a LOT of constraints. The IFScale research suggests this is near the degradation zone.

2. **Prioritize by impact** — not all sections carry equal weight:
   - **HIGH IMPACT** (keep/strengthen): Depth examples, self-check, evidence grounding, output schema
   - **MEDIUM IMPACT** (keep but tighten): Back-propagation, connection investigation, novelty-driven growth
   - **LOW IMPACT** (candidates for reduction): Vocabulary ban (partially redundant with role framing), upgrade examples (reduce from 3 to 2), critical reminders (partially redundant with self-check)

3. **Reduce redundancy**: The "Critical Reminders" section at the bottom restates points from earlier sections. Remove it — the model already has this information.

4. **Move vocabulary ban into the role** instead of a separate section:
   ```
   Current: "You describe WHAT the essay IS..." + separate "FORBIDDEN VOCABULARY" section
   Better: "You are a Literature PhD... You NEVER evaluate quality — words like
   'effective', 'strong', 'compelling' belong to the Analysis layer, not here."
   ```
   This saves ~100 tokens and is more natural.

5. **Target: ~1800 tokens** for the system prompt (from ~2350). Cuts ~23% while keeping all high-impact sections.

### The Ideal Prompt Structure

Research consistently supports this ordering within the system prompt:
```
1. ROLE (who you are — 1-2 sentences)
2. TASK (what to do — 1 sentence)
3. CONSTRAINTS (what NOT to do — short list)
4. DEPTH EXAMPLES (what good looks like — 2-3 contrastive examples)
5. SELF-CHECK (how to verify your own output — the forcing function)
6. OUTPUT FORMAT (schema — reference, not instruction)
```

---

## Priority-Ordered Implementation Plan

### Phase 1: Immediate (1-2 hours, highest impact)

1. **Add `reasoning` preamble field to L3 walk JSON schema** (Section 1, Option A)
   - Add as FIRST field in the output schema
   - Update prompt: "Start with your reasoning — think through what this paragraph reveals before populating the structured fields"
   - Expected impact: 30-50% improvement in observation depth

2. **Add FOCUS SUMMARY at recency position** (Section 3, cache-safe compromise)
   - ~100 tokens per call, put investigation questions + thesis at the END
   - Expected impact: 10-20% improvement in relevance

3. **Add the "portability test"** to evidence grounding (Section 8)
   - One sentence addition to the prompt
   - Expected impact: Reduces generic observations by ~30%

4. **Repeat core instruction at end of user prompt** (Section 5, prompt repetition)
   - Add "Remember: describe mechanism, not quality. Quote specific text." at the end of `buildUserPrompt()`
   - Zero cost, zero latency — won 47/70 tests with 0 losses
   - Expected impact: 5-10% improvement in instruction following

5. **Restructure vocabulary ban as positive instruction** (Section 5, Pink Elephant)
   - Replace "FORBIDDEN VOCABULARY" list with positive framing: "Use the pattern: '[quoted text] does X because Y'"
   - Expected impact: Better compliance than negation-based bans

### Phase 2: Quick wins (2-4 hours)

4. **Implement programmatic quality detection** (Section 9)
   - `surfaceVocabularyScore()`, `evidenceDensity()`, `observationQualityMetrics()`
   - Log quality scores for every paragraph — build monitoring baseline
   - Expected impact: Visibility into quality issues, data for further optimization

5. **Reduce L3.5 temperature from 0.3 to 0.2** (Section 2)
   - One constant change
   - Expected impact: More consistent scoring across runs

6. **Trim system prompt from ~2350 to ~1800 tokens** (Section 10)
   - Remove Critical Reminders section (redundant)
   - Reduce upgrade examples from 3 to 2
   - Fold vocabulary ban into role definition
   - Expected impact: Better instruction following, less "hyper-literalism"

### Phase 3: Medium-term (4-8 hours)

7. **Enable extended thinking for L3 P1** (Section 7)
   - Requires updating `callClaude` to support `thinking` parameter
   - Set `budget_tokens: 8192` for P1, `4096` for P2+
   - Remove temperature for thinking-enabled calls
   - Expected impact: Significant depth improvement for opening paragraph, ~$0.05/essay added cost

8. **Add absence-evidence framework** (Section 4/8)
   - New prompt section with permission and format for absence observations
   - Expected impact: Captures insights that strict evidence requirements currently block

9. **Add anti-example** (Section 4) — pseudo-architectural observation with explanation of why it fails
   - Expected impact: Reduces "sounds deep but isn't" observations

### Phase 4: V2 considerations (defer)

10. **Dynamic few-shot examples** per paragraph position
11. **Two-phase output** (separate prose + JSON calls)
12. **Quality-triggered automatic re-analysis** with modified prompts

---

## Key Research Sources

### Academic Papers
- Liu et al., "Lost in the Middle: How Language Models Use Long Contexts" (2023) [arxiv: 2307.03172]
- "Is Temperature the Creativity Parameter of LLMs?" [arxiv: 2405.00492]
- "The Few-Shot Dilemma: Over-Prompting Large Language Models" [arxiv: 2509.13196]
- "RULERS: Locked Rubrics and Evidence-Anchored Scoring" [arxiv: 2601.08654]
- "AbsenceBench: Language Models Can't Tell What's Missing" [arxiv: 2506.11440]
- "HOW MANY INSTRUCTIONS CAN LLMS FOLLOW AT ONCE?" (IFScale) [arxiv: 2507.11538]
- "Not Wrong, But Untrue: LLM Overconfidence in Document-Based Queries" [arxiv: 2509.25498]
- "Revisiting the Reliability of Language Models in Instruction-Following" [arxiv: 2512.14754]
- "Prompt Inversion: Guardrail-to-Handcuff Transition" [arxiv: 2510.22251]
- "Negation: A Pink Elephant in the LLMs' Room" [arxiv: 2503.22395]
- "SycEval: Evaluating LLM Sycophancy" [arxiv: 2502.08177]
- "LLMs Get Lost In Multi-Turn Conversation" [arxiv: 2505.06120]
- "Prompt Repetition Improves Non-Reasoning LLMs" [arxiv: 2512.14982]
- "PRoMPTed: Instances Need More Care" [arxiv: 2310.02107]
- "CRANE: Interleaving Constrained and Unconstrained Generation" (ICML 2025) [arxiv: 2502.09061]
- "CRITIC: LLMs Can Self-Correct with Tool-Interactive Critiquing" [arxiv: 2305.11738]
- "SpecRA: Monitor Degenerative Repetition using Randomized FFT" (OpenReview)

### Platform Documentation
- Anthropic: "Building with extended thinking" (platform.claude.com)
- Anthropic: "Use examples (multishot prompting)" (docs.anthropic.com)
- Anthropic: "Prompting best practices" (platform.claude.com)
- Anthropic: "Extended thinking tips" (platform.claude.com)

### Industry Research
- Chroma Research: "Context Rot: How Increasing Input Tokens Impacts LLM Performance" (2025)
- Vellum: "LLM Temperature: How It Works and When You Should Use It"
- IBM: "What is LLM Temperature?"
- PromptHub: "The Few Shot Prompting Guide"
- 16x Engineer: "The Pink Elephant Problem: Why 'Don't Do That' Fails with LLMs"
