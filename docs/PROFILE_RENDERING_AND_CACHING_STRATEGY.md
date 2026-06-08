# Profile Rendering & Prompt Caching Strategy

> Design document for the Essay Intelligence System's **Profile Router rendering layer** and **cross-layer prompt caching architecture**. This is the translation layer between stored profile data and AI comprehension — it directly determines the quality of every LLM call in the system.

---

## Table of Contents

1. [Profile Rendering Format](#1-profile-rendering-format)
2. [Observation Labels](#2-observation-labels)
3. [Token Budget Enforcement](#3-token-budget-enforcement)
4. [Prompt Caching Strategy (All Layers)](#4-prompt-caching-strategy-all-layers)
5. [Differential Rendering per Layer](#5-differential-rendering-per-layer)
6. [Profile Serialization for Database](#6-profile-serialization-for-database)
7. [Context Assembly Pipeline](#7-context-assembly-pipeline)

---

## 1. Profile Rendering Format

**The question**: When the Profile Router selects sections to load, how are they converted into prompt text?

### Approach A: Raw JSON

Dump the profile sections as-is into the prompt.

**Example — P1S1 understanding rendered as JSON:**
```
{
  "understanding": {
    "observedFunctions": [
      {"observation": "Grounds reader in pawnshop scene through physical action", "confidence": 0.9, "evidence": "slid the ring across the counter"},
      {"observation": "Introduces the cloudy diamond as imperfection-with-value", "confidence": 0.85, "evidence": "cloudy diamond + grandfather's choice"}
    ],
    "inferredIntents": [
      {"observation": "Creating physical stakes before emotional ones", "confidence": 0.85, "evidence": "action precedes reflection"}
    ],
    "rhetoricalFunctions": ["scene-setting", "symbol-introduction"],
    "narrativeContributions": [
      {"observation": "Opens the essay's metaphor arc", "confidence": 0.95, "evidence": "P5S4 closes with same diamond, transformed meaning"}
    ],
    "paragraphContribution": "Establishes the pawnshop as the essay's opening world",
    "rhythmContribution": "Short declarative sentences create tension",
    "voiceAlignment": "Consistent — terse, physical, grounded",
    "techniques": ["concrete detail", "metaphor"],
    "significantChoices": [
      {"wordOrPhrase": "slid", "significance": "Implies deliberateness — not dropped or tossed"},
      {"wordOrPhrase": "cloudy", "significance": "Imperfection visible to anyone who looks"}
    ],
    "connectionRefs": ["conn_001", "conn_003"],
    "tags": ["metaphor:diamond", "theme:imperfection", "voice:terse"]
  }
}
```

**Token cost**: ~185 tokens for this one sentence's understanding.

**Pros**: Exact fidelity, trivially implemented (`JSON.stringify`), no renderer code to maintain.
**Cons**: ~40% token overhead from JSON syntax (braces, quotes, field names). Harder for the LLM to read fluently — JSON keys like `observedFunctions` and `narrativeContributions` are engineering labels, not reading cues. Wastes tokens on metadata the LLM doesn't need (confidence scores, evidence fields that duplicate text it already has).

### Approach B: Structured Text

Custom format with headers, indentation, and natural-language cues.

**Example — P1S1 understanding rendered as structured text:**
```
P1S1: "She slid the ring across the counter, the cloudy diamond catching the fluorescent light."

  What it does:
    [U1] Grounds reader in pawnshop scene through physical action
    [U2] Introduces the cloudy diamond as imperfection-with-value

  Writer's intent:
    [I1] Creating physical stakes before emotional ones

  Rhetorical: scene-setting, symbol-introduction

  Narrative role:
    [N1] Opens the essay's metaphor arc — P5S4 closes with same diamond, transformed meaning

  Paragraph contribution: Establishes the pawnshop as the essay's opening world

  Craft:
    Rhythm: Short declarative sentences create tension
    Voice: Consistent — terse, physical, grounded
    Techniques: concrete detail, metaphor

  Significant choices:
    "slid" — implies deliberateness (not dropped or tossed)
    "cloudy" — imperfection visible to anyone who looks

  Connections: conn_001, conn_003
  Tags: metaphor:diamond, theme:imperfection, voice:terse
```

**Token cost**: ~120 tokens for the same content. **~35% savings vs JSON.**

**Pros**: Natural reading flow for the LLM — headers act as cognitive anchors. Observation labels ([U1], [I1]) are inline and referenceable. Strips metadata the LLM doesn't need (confidence scores rendered only when they're informative — e.g., low-confidence observations). More token-efficient.
**Cons**: Requires a renderer per section type. Potential for formatting bugs. Two systems to maintain (structured types + text renderers).

### Approach C: Hybrid

Structured text for understanding/analysis (where natural reading matters). JSON for types that need exact machine-readable structure (connections, Profile Index).

**Example — Mixed rendering:**
```
=== PROFILE INDEX ===
{"essayLength":{"paragraphs":5,"sentences":23,"words":412},"confidenceLevel":"deep","essayTopics":["identity","family","imperfection"],"paragraphDigest":[{"index":0,"roleSummary":"Opening scene: pawnshop with grandmother's ring","tags":["opening","scene","diamond_metaphor"],"sentenceCount":4,"hasStrengths":true,"hasWeaknesses":false,"improvementPriority":1}]}

=== P1S1 UNDERSTANDING ===
P1S1: "She slid the ring across the counter..."

  What it does:
    [U1] Grounds reader in pawnshop scene through physical action
    [U2] Introduces the cloudy diamond as imperfection-with-value
  ...
```

**Pros**: Each data type gets the format that best serves it. Profile Index is compact JSON because it's a lookup table, not narrative. Understanding is structured text because it needs to be comprehended.
**Cons**: Two rendering systems. Inconsistent format within the same prompt.

### Recommendation: **Approach B (Structured Text)** with selective JSON for machine-readable sections

**Why**: The LLM is the consumer of this text. Structured text is optimized for LLM comprehension — headers provide cognitive anchoring, labels enable cross-referencing, and the format naturally strips low-value metadata. The ~35% token savings compounds across every call.

The one exception: the **Profile Index** is rendered as compact JSON because it's a lookup table that the LLM scans for tags/indices, not a passage it reads for meaning. Connections metadata (`conn_001` descriptions) are rendered as structured text because the LLM needs to understand what the connection IS.

**Implementation sketch:**

```typescript
// Central renderer — one function per profile section type
class ProfileRenderer {
  renderIndex(index: ProfileIndex): string { /* compact JSON */ }
  renderHolisticSection(name: string, data: any): string { /* structured text with headers */ }
  renderParagraphDigest(para: ParagraphDigestEntry): string { /* one-liner */ }
  renderParagraphFull(para: ParagraphProfile, layers: LayerFilter): string { /* full detail */ }
  renderSentence(sent: SentenceDeepAnalysis, layers: LayerFilter, labelState: LabelState): string { /* structured text with labels */ }
  renderConnections(conns: Connection[], filterFn?: (c: Connection) => boolean): string { /* structured text */ }
}
```

**Token efficiency analysis:**

| Section | JSON (A) | Structured Text (B) | Savings |
|---------|----------|---------------------|---------|
| 1 sentence understanding | ~185 tokens | ~120 tokens | 35% |
| 1 paragraph (5 sentences) | ~950 tokens | ~620 tokens | 35% |
| Full understanding profile (5 paras) | ~4750 tokens | ~3100 tokens | 35% |
| Profile Index | ~250 tokens (JSON) | ~250 tokens (keep JSON) | 0% |
| Holistic sections (all 7) | ~1400 tokens | ~950 tokens | 32% |
| Connections (10 entries) | ~400 tokens | ~280 tokens | 30% |

**Total for a typical L3.5 analysis call** (full understanding profile + holistic + connections + index):
- JSON: ~6800 tokens of profile context
- Structured text: ~4580 tokens
- **Savings: ~2200 tokens per call, ~$0.007 per L3.5 call, ~$0.035 across 5 parallel calls**

Over a full session (first pass + 4 re-analyses + 10 coaching turns), the savings are ~$0.15-0.25 — meaningful within the $2 budget.

---

## 2. Observation Labels ([U1], [U2], [I1], etc.)

**The question**: How are labels generated, are they consistent across calls, and how do analysis prompts reference them?

### Approach A: Generated at Render Time, Scoped Per-Call

Labels are assigned sequentially within each prompt rendering. In Call X, P1S1's first observed function is [U1]. In Call Y (which loads different sections), P1S1's first observed function might be [U7] because other sentences' observations came first.

**Pros**: Simplest implementation. Labels are dense (no gaps). No storage cost.
**Cons**: Labels are meaningless across calls. If L3.5-P1 says "[U1] lands effectively" and L3.5-P3 needs to reference the same observation, it's a different label. Makes cross-referencing harder.

### Approach B: Generated at Render Time, Globally Consistent (Position-Based)

Labels are derived from the sentence's position in the profile: `P{para}S{sent}.U{index}`. P1S1's first observed function is always `P1S1.U1`. This is consistent regardless of what else is loaded.

**Example:**
```
P1S1 Understanding:
  [P1S1.U1] Grounds reader in pawnshop scene through physical action
  [P1S1.U2] Introduces the cloudy diamond as imperfection-with-value
  [P1S1.I1] Creating physical stakes before emotional ones

P2S3 Understanding:
  [P2S3.U1] Transitions from scene to reflection
```

**Analysis prompt reference:**
```
"P1S1.U1 lands effectively because the physical detail creates immediate sensory engagement."
```

**Pros**: Labels are globally stable — the same observation always has the same label. Cross-call referencing works (L3.5-P3 can say "P1S1.U1" and it means the same thing it did in L3.5-P1). Labels are self-documenting (P1S1.U1 = paragraph 1, sentence 1, understanding observation 1).
**Cons**: Slightly more verbose labels. If observations are superseded (array replaced), the same label now points to different content — but that's fine because the system operates on CURRENT state, not historical.

### Approach C: Stored in Profile as Metadata

Each observation gets a persistent ID stored in the profile itself.

**Pros**: Maximum consistency. Labels survive across sessions.
**Cons**: Bloats the profile. Labels become stale when observations are superseded. Adds complexity to the Profile Manager (must assign and track labels). The LLM doesn't need cross-session stability — it operates within a single call.

### Recommendation: **Approach B (Position-Based, Globally Consistent)**

**Why**: Labels serve one purpose — letting the LLM reference an understanding observation from the analysis layer without re-describing it. Position-based labels achieve this with zero storage cost. They're human-readable, self-documenting, and consistent across any call that loads the same profile state.

**Labeling scheme:**

```
{Paragraph}{Sentence}.{LayerPrefix}{Index}

Layer prefixes:
  U = Understanding: observedFunctions
  I = Intent: inferredIntents
  N = Narrative: narrativeContributions
  S = Strength (analysis layer): strengths
  W = Weakness (analysis layer): weaknesses

Examples:
  P1S1.U1 — Paragraph 1, Sentence 1, first observed function
  P1S1.U2 — Paragraph 1, Sentence 1, second observed function
  P1S1.I1 — Paragraph 1, Sentence 1, first inferred intent
  P3S2.N1 — Paragraph 3, Sentence 2, first narrative contribution
  P2S4.S1 — Paragraph 2, Sentence 4, first strength (analysis)
  P2S4.W1 — Paragraph 2, Sentence 4, first weakness (analysis)
```

**Implementation:**

```typescript
interface LabelState {
  // No state needed — labels are pure functions of position
}

function observationLabel(
  para: number,
  sent: number,
  layer: 'U' | 'I' | 'N' | 'S' | 'W',
  index: number,  // 1-based
): string {
  return `P${para + 1}S${sent + 1}.${layer}${index}`;
}

// In the renderer:
function renderSentenceUnderstanding(
  para: number,
  sent: SentenceDeepAnalysis,
): string {
  const lines: string[] = [];
  lines.push(`P${para + 1}S${sent.index + 1}: "${truncate(sent.text, 80)}"`);
  lines.push('');

  if (sent.understanding.observedFunctions.length > 0) {
    lines.push('  What it does:');
    sent.understanding.observedFunctions.forEach((obs, i) => {
      lines.push(`    [P${para + 1}S${sent.index + 1}.U${i + 1}] ${obs.observation}`);
    });
  }

  if (sent.understanding.inferredIntents.length > 0) {
    lines.push('  Writer\'s intent:');
    sent.understanding.inferredIntents.forEach((obs, i) => {
      lines.push(`    [P${para + 1}S${sent.index + 1}.I${i + 1}] ${obs.observation}`);
    });
  }
  // ... etc.
  return lines.join('\n');
}
```

**How the analysis prompt references labels:**

In the L3.5 analysis system prompt:
```
When evaluating each sentence, reference its understanding observations by label.
Do NOT re-describe what the sentence does — the understanding profile already
captures that. Instead, evaluate HOW WELL it does what the labels describe.

Example:
  Wrong: "The sentence grounds the reader in physical action, which is effective"
  Right: "P1S1.U1 lands effectively — the physical detail creates immediate
          sensory engagement that establishes stakes before emotion."
  Right: "P1S1.U2 is premature — the 'cloudy diamond' symbol is introduced but
          not yet earned. The reader doesn't know why this diamond matters."
```

**Token cost of labels**: Each label adds ~5 tokens (e.g., `[P1S1.U1] `). For a 5-paragraph essay with ~23 sentences and ~3 observations each, that's ~345 extra tokens. This is paid back many times over by preventing re-description in the analysis output.

---

## 3. Token Budget Enforcement

**The question**: When the router selects more sections than the budget allows, what gets dropped and how?

### Approach A: Priority-Based Trimming (Post-Selection)

Router selects all relevant sections, ranks them by relevance score, renders all of them, then trims from the bottom until within budget.

**Pros**: Simple. Optimal trimming — you see the exact rendered size before deciding.
**Cons**: Wasteful — renders content just to discard it. Rendering can be expensive for large sections.

### Approach B: Progressive Loading (Pre-Selection)

Router loads sections in priority order, checking the token budget after each section. Stops when budget would be exceeded.

**Pros**: Never renders wasted content. Natural priority ordering. Budget respected by construction.
**Cons**: May miss a small high-value section that could fit if a larger lower-priority section were skipped. Order-dependent — a large P2 full profile might block a small but relevant P4 sentence.

### Approach C: Two-Pass Estimate-then-Render

**Pass 1**: Router estimates token cost of each candidate section using `sectionTokens` from the Profile Index. Selects sections that fit within budget using a priority-weighted knapsack approach.
**Pass 2**: Renders the selected sections. If actual tokens exceed estimate by >10%, trim the lowest-priority rendered section.

**Pros**: No wasted rendering. Uses pre-computed token estimates (Profile Index already tracks `sectionTokens`). Knapsack allows optimal section selection. Safety valve catches estimation errors.
**Cons**: Two-pass complexity. Token estimates may be stale if profile was recently updated.

### Recommendation: **Approach C (Two-Pass Estimate-then-Render)**

**Why**: The Profile Index already stores `sectionTokens` for exactly this purpose. Using these estimates avoids rendering waste. The safety valve (trim if over 10%) handles estimation drift. The knapsack is simple because sections have clear priority tiers, not arbitrary weights.

**Priority ordering (highest to lowest):**

| Priority | Sections | Rationale |
|----------|----------|-----------|
| P0 (always) | Profile Index | Required for every call. ~200-300 tokens. Never dropped. |
| P1 (task-critical) | Target paragraph/sentence full detail | The thing being analyzed/discussed |
| P2 (directly connected) | Connected sentences/paragraphs (from connectionGraph) | Cross-references the LLM needs to evaluate connections |
| P3 (task-relevant holistic) | Holistic sections relevant to the task (e.g., voiceIdentity for voice questions) | Breadth context for the specific topic |
| P4 (adjacent context) | Adjacent paragraph understanding | Local context for the target |
| P5 (background) | Other paragraph digests, other holistic sections | General awareness |

**Implementation:**

```typescript
function enforceTokenBudget(
  candidates: Array<{ section: string; priority: number; estimatedTokens: number; rendered?: string }>,
  budget: number,
): Array<{ section: string; rendered: string }> {
  // Profile Index always included (P0)
  const mandatory = candidates.filter(c => c.priority === 0);
  const optional = candidates.filter(c => c.priority > 0)
    .sort((a, b) => a.priority - b.priority);  // Lower priority number = higher importance

  let remainingBudget = budget;
  const selected: typeof candidates = [...mandatory];

  for (const m of mandatory) {
    remainingBudget -= m.estimatedTokens;
  }

  // Greedy selection by priority (sections within same priority tier sorted by estimated tokens ascending)
  for (const candidate of optional) {
    if (candidate.estimatedTokens <= remainingBudget) {
      selected.push(candidate);
      remainingBudget -= candidate.estimatedTokens;
    }
    // Skip if doesn't fit — don't block lower-priority smaller sections
  }

  // Render selected sections
  const rendered = selected.map(s => ({
    section: s.section,
    rendered: s.rendered ?? renderSection(s.section),
  }));

  // Safety valve: if actual tokens exceed budget by >10%, trim from bottom
  const actualTokens = estimateTokens(rendered.map(r => r.rendered).join('\n\n'));
  if (actualTokens > budget * 1.1 && rendered.length > 1) {
    rendered.pop();  // Drop lowest-priority section
  }

  return rendered;
}
```

**Token budget targets per call type:**

| Call Type | Budget | Rationale |
|-----------|--------|-----------|
| L3 understanding walk | 2500 tokens | Index + holistic + 2 prior paragraphs + current paragraph L1 |
| L3.75 holistic synthesis | 4000 tokens | Index + all paragraph understanding maps + connections |
| L3.5 analysis pass | 4500 tokens | Index + full understanding profile (cached) |
| L4 crystallization | 2000 tokens | Index + holistic sections + paragraph digests |
| L5 annotations | 5000 tokens | Index + full understanding + analysis |
| L6 coaching | 1500-3000 tokens | Dynamic based on focus detection |
| Focused mode understanding | 1500 tokens | Index + changed sentence + connections |
| Focused mode analysis | 1500 tokens | Index + updated understanding + prior analysis |

---

## 4. Prompt Caching Strategy (All Layers)

The Anthropic API supports `cache_control: { type: 'ephemeral' }` on system prompt blocks. Cached blocks are reused across calls within a 5-minute TTL. For the Essay Intelligence System, this means:

- **Within a single essay analysis**: L3's sequential paragraph calls share a cached system prompt + essay text. L3.5's parallel calls share the entire understanding profile.
- **Across calls**: The system prompt (instructions + schema) is stable across essays and cached across multiple essay analyses.

### Current Codebase Support

The existing `callClaude()` function supports a single `cacheSystemPrompt: boolean` flag that wraps the entire system prompt in `cache_control`. This works for the current single-block caching but needs extension for multi-block caching.

**Required extension**: The `callClaude` wrapper needs to accept an array of system blocks, each optionally cacheable:

```typescript
interface SystemBlock {
  text: string;
  cache?: boolean;  // If true, add cache_control: { type: 'ephemeral' }
}

// New callClaude signature option:
callClaude({
  model: string;
  system: SystemBlock[];  // Multiple system blocks with individual cache control
  messages: MessageParam[];
  ...
});
```

### Layer-by-Layer Cache Architecture

#### L1: First Impressions (Haiku, parallel per-paragraph)

```
┌─────────────────────────────────────────────────────────┐
│ SYSTEM BLOCK 1 [CACHED] — Instructions + output schema  │
│ ~800 tokens, stable across all essays                    │
│ "You are producing first impressions of each paragraph   │
│  of a college application essay..."                      │
│ + ParagraphFirstImpression JSON schema                   │
├─────────────────────────────────────────────────────────┤
│ SYSTEM BLOCK 2 [CACHED] — Full essay text                │
│ ~400-800 tokens, stable across paragraph calls           │
│ [P1] "She slid the ring across the counter..."           │
│ [P2] "I remember the first time..."                      │
│ ...                                                      │
├─────────────────────────────────────────────────────────┤
│ USER PROMPT [CHANGES PER CALL] — Target paragraph        │
│ ~50-100 tokens                                           │
│ "Analyze paragraph 3. Basic metrics: 4 sentences,        │
│  87 words, specificity 62/100."                          │
└─────────────────────────────────────────────────────────┘
```

**Cache hit rate**: Block 1 hits on every essay (same instructions). Block 2 hits across the ~5 parallel calls for one essay.
**Token savings**: ~1200 cached tokens x 4 cache-hit calls = ~4800 input tokens saved. At Haiku pricing ($0.80/M input), saves ~$0.004. Small per-essay but adds up.

#### L2: Structural Cartography (Sonnet, 1 call)

```
┌─────────────────────────────────────────────────────────┐
│ SYSTEM BLOCK 1 [CACHED] — Instructions + output schema  │
│ ~1200 tokens, stable across all essays                   │
├─────────────────────────────────────────────────────────┤
│ USER PROMPT [UNIQUE] — Essay text + L1 impressions       │
│ ~1500-2500 tokens                                        │
└─────────────────────────────────────────────────────────┘
```

**Cache hit rate**: Block 1 hits on every essay. Single call per essay, so no intra-essay caching benefit.
**Token savings**: ~1200 tokens cached. At Sonnet pricing ($3/M input), saves ~$0.004 per essay.

#### L2.5: Connection Scout (Haiku, 1 call)

Same pattern as L2. Single call, system prompt cached across essays. Minimal savings.

#### L3: Understanding Walk (Sonnet x N, sequential) — THE CRITICAL CACHING OPPORTUNITY

```
┌─────────────────────────────────────────────────────────┐
│ SYSTEM BLOCK 1 [CACHED — across ALL essays]              │
│ ~1800 tokens                                             │
│ - Role + understanding-only instructions                 │
│ - UnderstandingWalkOutput JSON schema                    │
│ - Back-propagation format + rules                        │
│ - Novelty-driven growth instructions                     │
│ - Evidence grounding + utility filtering rules           │
│ - Essay type context                                     │
├─────────────────────────────────────────────────────────┤
│ SYSTEM BLOCK 2 [CACHED — across paragraph calls]         │
│ ~1000-2000 tokens                                        │
│ - Full essay text with [P1]...[PN] markers               │
│ - L2 structural map (paragraph roles, arc, transitions)  │
│ - L1 first impressions (per-paragraph summaries)         │
│ - L2.5 scout connection leads (all)                      │
├─────────────────────────────────────────────────────────┤
│ USER PROMPT [CHANGES PER PARAGRAPH]                      │
│ ~800-2500 tokens (grows as profile grows)                │
│ - "Analyzing paragraph {N} of {total}"                   │
│ - Current paragraph highlighted                          │
│ - Selectively-loaded profile context (via Profile Router)│
│   - Index always                                         │
│   - Holistic understanding evolution so far              │
│   - Adjacent paragraphs: full understanding              │
│   - Connected paragraphs: full understanding             │
│   - Other paragraphs: digest only                        │
│ - Scout connection leads for THIS paragraph              │
│ - "What does P{N} reveal that wasn't already understood?"│
└─────────────────────────────────────────────────────────┘
```

**Cache hit rate**: Block 1 hits across ALL essays (~100% within TTL). Block 2 hits across all ~5 paragraph calls for one essay (~80% — first call writes, calls 2-5 read).
**Token savings**: (1800 + 1500 avg) = ~3300 cached tokens x 4 cache-hit calls = ~13200 input tokens saved. At Sonnet pricing, saves ~$0.040 per essay. **This is the biggest single savings.**
**Note**: The user prompt grows because the profile context grows with each paragraph. P1's call has minimal profile context (~300 tokens). P5's call has ~2000 tokens of profile context. This is unavoidable and correct — later paragraphs need more context.

#### L3.75: Holistic Synthesis (Sonnet x 1)

```
┌─────────────────────────────────────────────────────────┐
│ SYSTEM BLOCK 1 [CACHED — across all essays]              │
│ ~1500 tokens                                             │
│ - Role + synthesis instructions                          │
│ - HolisticSynthesisOutput JSON schema (all 7 sections)   │
│ - Rules: synthesize from sentences, not from walk's      │
│   incremental holisticEvolution                          │
├─────────────────────────────────────────────────────────┤
│ USER PROMPT [UNIQUE PER ESSAY]                           │
│ ~3000-4000 tokens                                        │
│ - Profile Index                                          │
│ - All paragraph understanding maps (full detail)         │
│ - All connections                                        │
│ - Walk's holisticEvolution values (starting point)       │
└─────────────────────────────────────────────────────────┘
```

**Cache hit rate**: System block cached across essays. Single call per essay — no intra-essay benefit.
**Token savings**: ~1500 tokens. At Sonnet pricing, ~$0.005 per essay.

#### L3.5: Analysis Pass (Sonnet x N, parallel) — SECOND-BIGGEST CACHING OPPORTUNITY

```
┌─────────────────────────────────────────────────────────┐
│ SYSTEM BLOCK 1 [CACHED — across all essays]              │
│ ~1500 tokens                                             │
│ - Role + analysis-only instructions                      │
│ - AnalysisPassOutput JSON schema                         │
│ - Label referencing rules ("Reference P1S1.U1, don't     │
│   re-describe")                                          │
│ - Scoring guidelines + evidence requirements             │
├─────────────────────────────────────────────────────────┤
│ SYSTEM BLOCK 2 [CACHED — across parallel calls]          │
│ ~4000-5000 tokens                                        │
│ - Full essay text with markers                           │
│ - COMPLETE understanding profile (all paragraphs,        │
│   all sentences, with observation labels)                │
│ - Holistic understanding (from L3.75)                    │
│ - All connections with descriptions                      │
│ - Profile Index                                          │
│ - Improvement phase context (if re-analysis)             │
├─────────────────────────────────────────────────────────┤
│ USER PROMPT [CHANGES PER PARAGRAPH]                      │
│ ~100-200 tokens                                          │
│ - "Evaluate paragraph {N}."                              │
│ - Target paragraph highlighted                           │
│ - (Minimal — all context is in cached Block 2)           │
└─────────────────────────────────────────────────────────┘
```

**Cache hit rate**: Block 1 hits across all essays. Block 2 hits across all ~5 parallel calls (~80% — first writes, rest read).
**Token savings**: (1500 + 4500 avg) = ~6000 cached tokens x 4 cache-hit calls = ~24000 input tokens saved. At Sonnet pricing, saves ~$0.072 per essay. **Largest absolute savings.**

**Critical design decision**: For L3.5, the understanding profile is placed in System Block 2 (not the user prompt) because all parallel calls need the exact same profile. Putting it in the user prompt would prevent caching since each call targets a different paragraph. The target paragraph specification is the only thing that changes between calls.

#### L4: Crystallization (Sonnet, 1 call)

```
┌─────────────────────────────────────────────────────────┐
│ SYSTEM BLOCK 1 [CACHED — across all essays]              │
│ ~1200 tokens                                             │
│ - EssayDNA schema + crystallization instructions         │
├─────────────────────────────────────────────────────────┤
│ USER PROMPT [UNIQUE PER ESSAY]                           │
│ ~2000 tokens                                             │
│ - Profile Index + holistic sections + paragraph digests  │
│ - Strength/weakness map                                  │
└─────────────────────────────────────────────────────────┘
```

**Runs in parallel with L5.** System block cached across essays.

#### L5: Annotations (Sonnet, 1-2 calls, parallel with L4)

```
┌─────────────────────────────────────────────────────────┐
│ SYSTEM BLOCK 1 [CACHED — across all essays]              │
│ ~1500 tokens                                             │
│ - Annotation generation instructions + schema            │
│ - Phase-aware density guidelines                         │
├─────────────────────────────────────────────────────────┤
│ SYSTEM BLOCK 2 [ESSAY-SPECIFIC — cached if split]        │
│ ~4000-5000 tokens                                        │
│ - Full essay text                                        │
│ - Understanding + analysis profile (with labels)         │
│ - ImprovementPhase context                               │
│ - Deferred areas (what NOT to annotate)                  │
├─────────────────────────────────────────────────────────┤
│ USER PROMPT [PER CALL]                                   │
│ ~100-200 tokens                                          │
│ - "Generate annotations." (or specific paragraph range   │
│   if split across 2 calls for long essays)               │
└─────────────────────────────────────────────────────────┘
```

If annotations are split into 2 calls (paragraphs 1-3 and 4-5), Block 2 is cached across both calls.

#### L6: Coaching (Sonnet, per-turn)

```
┌─────────────────────────────────────────────────────────┐
│ SYSTEM BLOCK 1 [CACHED — across all coaching turns]      │
│ ~1200 tokens                                             │
│ - Coaching role + phase-aware response instructions      │
│ - Profile deepening extraction instructions              │
│ - Output schema (response + profile updates)             │
├─────────────────────────────────────────────────────────┤
│ SYSTEM BLOCK 2 [ESSAY-SPECIFIC — cached across turns]    │
│ ~800-1500 tokens                                         │
│ - Full essay text                                        │
│ - EssayDNA (~500 tokens)                                 │
│ - ImprovementPhase + focus/deferred areas                │
│ - Profile Index                                          │
├─────────────────────────────────────────────────────────┤
│ USER PROMPT [CHANGES PER TURN]                           │
│ ~500-2000 tokens                                         │
│ - Conversation history (last 3-5 turns)                  │
│ - Selectively-loaded profile sections (via Profile Router│
│   based on focus detection)                              │
│ - Student's current message                              │
└─────────────────────────────────────────────────────────┘
```

**Cache hit rate**: Block 1 cached across ALL coaching conversations for all essays. Block 2 cached across turns within one coaching session (TTL matters — if turns are >5 minutes apart, cache expires).
**Token savings**: ~2500 cached tokens per turn. At ~10 turns, ~22500 input tokens saved. At Sonnet pricing, ~$0.068 per coaching session.

**Design consideration**: The essay text and EssayDNA go in Block 2 (cached across turns) because they don't change during coaching. The selectively-loaded profile sections go in the user prompt because they change per turn based on focus detection.

#### Focused Mode (Sonnet, 2 calls)

**Call 1: Focused Understanding Update**
```
┌─────────────────────────────────────────────────────────┐
│ SYSTEM BLOCK 1 [CACHED — across all focused analyses]    │
│ ~1200 tokens                                             │
│ - Focused understanding update instructions              │
│ - Ripple detection instructions                          │
│ - Output schema                                          │
├─────────────────────────────────────────────────────────┤
│ SYSTEM BLOCK 2 [CACHED — across the 2 focused calls]     │
│ ~1500-2000 tokens                                        │
│ - Profile Index                                          │
│ - Relevant paragraph understanding                       │
│ - Connected sentences' understanding                     │
│ - Relevant holistic sections                             │
├─────────────────────────────────────────────────────────┤
│ USER PROMPT [UNIQUE]                                     │
│ ~200-400 tokens                                          │
│ - Changed sentence: old text -> new text                 │
│ - Current understanding of changed sentence (with labels)│
│ - "How does this change affect understanding?"           │
└─────────────────────────────────────────────────────────┘
```

**Call 2: Focused Analysis Update** — reuses Block 1 (same instructions apply) and the profile context from Block 2 (augmented with the understanding update from Call 1).

### Caching Summary

| Layer | Block 1 (Instructions) | Block 2 (Essay-Specific) | Block 2 Cache Hits | Est. Savings |
|-------|----------------------|------------------------|--------------------|-------------|
| L1 (Haiku x N) | Cached across essays | Essay text cached across para calls | N-1 hits | ~$0.004 |
| L2 (Sonnet x 1) | Cached across essays | N/A (single call) | 0 | ~$0.004 |
| L2.5 (Haiku x 1) | Cached across essays | N/A (single call) | 0 | ~$0.001 |
| **L3 (Sonnet x N)** | **Cached across essays** | **Essay + L1/L2 cached across paras** | **N-1 hits** | **~$0.040** |
| L3.75 (Sonnet x 1) | Cached across essays | N/A (single call) | 0 | ~$0.005 |
| **L3.5 (Sonnet x N)** | **Cached across essays** | **Full understanding cached across paras** | **N-1 hits** | **~$0.072** |
| L4 (Sonnet x 1) | Cached across essays | N/A (single call) | 0 | ~$0.004 |
| L5 (Sonnet x 1-2) | Cached across essays | Cached if split | 0-1 | ~$0.005 |
| **L6 (Sonnet x T)** | **Cached across all coaching** | **Essay+DNA cached across turns** | **T-1 hits** | **~$0.068** |
| Focused (Sonnet x 2) | Cached across analyses | Profile context cached across 2 calls | 1 hit | ~$0.005 |

**Total first-pass caching savings**: ~$0.13-0.15 (roughly 20-25% of the ~$0.60 average first-pass cost).
**Total session savings** (first pass + 4 rounds + 10 coaching turns): ~$0.25-0.35.

---

## 5. Differential Rendering per Layer

**The question**: Does the same profile data render differently for different consumers?

### The Problem

Different layers need the profile in fundamentally different formats:

- **L3 understanding walk**: Only understanding layer (analysis doesn't exist yet). Current paragraph at full detail, prior paragraphs at selective detail. Scout leads for forward connections.
- **L3.5 analysis pass**: Full understanding (all paragraphs, all sentences, with labels). No analysis (this IS the analysis pass). Holistic understanding from L3.75.
- **L5 annotations**: Full understanding + analysis. Improvement phase context for feedback zoom.
- **L6 coaching**: Selective sections based on focus detection. Conversational framing. Phase-aware coaching context.
- **Focused mode**: Change-focused rendering with old-to-new comparison. Previous understanding/analysis for the changed sentence.

### Approach A: Single Renderer with Mode Parameter

```typescript
function renderProfile(profile: EssayProfile, mode: RenderMode): string;

type RenderMode =
  | { type: 'understanding_walk'; currentParagraph: number }
  | { type: 'analysis_pass'; targetParagraph: number }
  | { type: 'annotation'; improvementPhase: ImprovementPhase }
  | { type: 'coaching'; focus: ConversationFocus }
  | { type: 'focused'; changeContext: FocusedChangeContext };
```

**Pros**: Single entry point. Easy to find all rendering logic. Mode parameter controls what's included.
**Cons**: Function becomes a giant switch statement. Different modes have fundamentally different needs — forcing them through one function produces suboptimal prompts for each.

### Approach B: Per-Layer Renderers

```typescript
class L3UnderstandingRenderer { render(profile, paragraphIndex): string }
class L35AnalysisRenderer { render(profile, paragraphIndex): string }
class L5AnnotationRenderer { render(profile, phase): string }
class L6CoachingRenderer { render(profile, focus): string }
class FocusedRenderer { render(profile, change): string }
```

**Pros**: Each renderer is optimized for its consumer. No switch statements. Easy to test in isolation.
**Cons**: Code duplication — sentence rendering logic repeated across renderers. Many files to maintain. Changes to the profile structure require updates across all renderers.

### Approach C: Composable Renderer with Pluggable Section Formatters

A core renderer handles the mechanics (traversing the profile, enforcing budgets, generating labels). Pluggable formatters control HOW each section is presented for different consumers.

```typescript
class ProfileRenderer {
  // Core mechanics — shared across all layers
  private renderIndex(index: ProfileIndex): string;
  private renderSentence(sent: SentenceDeepAnalysis, options: SentenceRenderOptions): string;
  private renderParagraph(para: ParagraphProfile, options: ParagraphRenderOptions): string;
  private renderHolistic(section: string, data: any): string;
  private renderConnections(conns: Connection[], filter?: ConnectionFilter): string;

  // Layer-specific assembly — uses core renderers with different options
  assembleForUnderstandingWalk(profile: EssayProfile, paragraphIndex: number): PromptBlocks;
  assembleForAnalysisPass(profile: EssayProfile, paragraphIndex: number): PromptBlocks;
  assembleForAnnotations(profile: EssayProfile, phase: ImprovementPhase): PromptBlocks;
  assembleForCoaching(profile: EssayProfile, focus: ConversationFocus): PromptBlocks;
  assembleForFocused(profile: EssayProfile, change: FocusedChangeContext): PromptBlocks;
}

interface SentenceRenderOptions {
  layers: ('understanding' | 'analysis')[];  // Which layers to include
  includeLabels: boolean;                     // Whether to generate [U1] labels
  includeEvidence: boolean;                   // Whether to show evidence fields
  includeConfidence: boolean;                 // Whether to show confidence scores
  detail: 'full' | 'summary' | 'digest';     // Level of detail
}

interface ParagraphRenderOptions extends SentenceRenderOptions {
  sentenceDetail: 'full' | 'summary' | 'skip';
  includeCraft: boolean;
  includeEmotional: boolean;
}

// Output: structured blocks for prompt caching
interface PromptBlocks {
  staticBlock: string;    // Instructions + schema (cached across essays)
  essayBlock: string;     // Essay text + stable profile data (cached across calls)
  dynamicBlock: string;   // Per-call context (user prompt)
}
```

**Pros**: Core rendering logic written once, tested once. Layer-specific assembly controls WHAT is included and HOW without duplicating the mechanics. `SentenceRenderOptions` provides fine-grained control. Each `assembleFor*` method is small (~30-50 lines) — just selects sections and options.
**Cons**: Options proliferation — but bounded by the finite set of section types and layer needs.

### Recommendation: **Approach C (Composable Renderer)**

**Why**: The core rendering mechanics (traversing paragraphs, formatting sentences, generating labels, counting tokens) are identical across layers. What differs is WHAT sections are included and WHICH fields are shown. Composable renderers with options capture this cleanly. Adding a new layer or consumer means writing a small `assembleFor*` method, not a whole new renderer.

**Concrete rendering differences by layer:**

| Layer | Understanding | Analysis | Labels | Holistic | Detail Level | Special |
|-------|--------------|----------|--------|----------|-------------|---------|
| L3 walk (P3) | P1-P2: full, P0: digest | None (doesn't exist) | No | Voice + thesis evolution | Mixed | Scout leads for P3 |
| L3.75 synthesis | All: full | None | No | Walk's incremental evolution only | Full | All connections |
| L3.5 analysis (P3) | All: full (cached) | None (this IS analysis) | Yes (U, I, N) | All from L3.75 | Full | Phase context |
| L5 annotations | All: full | All: full | Yes (all) | All | Full | Phase + deferred areas |
| L6 coaching | Focus-relevant: full, others: skip | Focus-relevant: full | Yes (relevant only) | Focus-relevant | Mixed | Conversation history |
| Focused understanding | Changed sentence: full, connected: full | Previous analysis for context | Yes | Relevant sections | Full | Old-to-new diff |
| Focused analysis | Updated understanding | Previous analysis | Yes | Relevant | Full | Change delta |

**Example: assembleForAnalysisPass**

```typescript
assembleForAnalysisPass(profile: EssayProfile, paragraphIndex: number): PromptBlocks {
  const sentenceOptions: SentenceRenderOptions = {
    layers: ['understanding'],  // Analysis pass only sees understanding
    includeLabels: true,         // Labels for cross-referencing
    includeEvidence: false,      // LLM has the essay text — evidence is redundant
    includeConfidence: false,    // Confidence scores clutter the prompt
    detail: 'full',
  };

  const paragraphOptions: ParagraphRenderOptions = {
    ...sentenceOptions,
    sentenceDetail: 'full',      // Every sentence fully rendered with labels
    includeCraft: true,
    includeEmotional: true,
  };

  // Static block: instructions + schema (cached across ALL essays)
  const staticBlock = buildAnalysisPassSystemPrompt();

  // Essay block: essay text + full understanding profile (cached across parallel calls)
  const essayParts: string[] = [];
  essayParts.push(this.renderEssayWithMarkers(profile));
  essayParts.push(this.renderIndex(profile.index));
  // All holistic understanding sections
  for (const section of HOLISTIC_SECTIONS) {
    essayParts.push(this.renderHolistic(section, profile[section]));
  }
  // All paragraph understanding (every sentence with labels)
  for (const para of profile.paragraphs) {
    essayParts.push(this.renderParagraph(para, paragraphOptions));
  }
  // All connections
  essayParts.push(this.renderConnections(profile.connections.all));

  const essayBlock = essayParts.join('\n\n');

  // Dynamic block: just "evaluate paragraph N" (changes per parallel call)
  const dynamicBlock = `Evaluate paragraph ${paragraphIndex + 1} of ${profile.paragraphs.length}.\n\n` +
    `Target paragraph text:\n${profile.paragraphs[paragraphIndex].text}`;

  return { staticBlock, essayBlock, dynamicBlock };
}
```

---

## 6. Profile Serialization for Database

**Three distinct representations of the same data:**

### Stored Profile (Database JSONB)

The canonical, complete representation. Full JSON with every field, every observation, every connection.

- **Format**: TypeScript `EssayProfile` serialized as JSON
- **Size**: ~50-200KB depending on essay length and profile depth
- **Updates**: Profile Manager applies supersessions, adds connections, recomputes index
- **Storage**: `essay_understanding` table, JSONB column with GIN index
- **No rendering artifacts**: No labels, no headers, no formatting. Pure data.

### Rendered Profile (Prompt Text)

The consumer-facing representation, optimized for LLM comprehension.

- **Format**: Structured text with headers, labels, and selective content
- **Size**: ~1500-5000 tokens depending on what's loaded
- **Generated**: Fresh for every API call by the ProfileRenderer
- **Discarded**: After the call. Never stored. Never sent to the database.
- **Contains rendering artifacts**: Labels ([P1S1.U1]), headers (=== UNDERSTANDING ===), formatting

### Profile Index (Compact Lookup Table)

A bridge between stored and rendered. Small enough to always include, rich enough to drive routing decisions.

- **Format**: JSON (stored), also JSON in prompts (it's a lookup table, not narrative)
- **Size**: ~200-300 tokens
- **Stored**: As part of the stored profile
- **Always loaded**: Included in every API call's prompt
- **Updated**: By Profile Manager after every profile change (new tags, connection graph changes, section token count updates)

**Lifecycle:**

```
Database (JSONB)
    │
    ├── Load: SELECT jsonb_column FROM essay_understanding WHERE essay_id = ?
    │         → Parse into EssayProfile TypeScript object
    │
    ├── Route: Profile Router reads ProfileIndex → decides what sections to load
    │         → Returns list of section identifiers
    │
    ├── Render: ProfileRenderer formats selected sections into structured text
    │          → Adds labels, headers, strips metadata
    │          → Assigns to cache blocks (static / essay-specific / dynamic)
    │          → Returns PromptBlocks
    │
    ├── Call: PromptBlocks → Anthropic API
    │         → LLM produces structured JSON output
    │
    ├── Apply: Profile Manager parses output → applies to EssayProfile
    │          → Supersessions, new connections, index recompute
    │
    └── Save: EssayProfile → JSON.stringify → UPDATE essay_understanding SET jsonb_column = ?
```

**No intermediate format** is needed. The stored profile IS the source of truth. The rendered profile is a view generated on-demand. The Profile Index is a pre-computed summary that lives inside the stored profile.

---

## 7. Context Assembly Pipeline

**The complete pipeline from "router decides what to load" to "prompt text ready for API call":**

### Pipeline Steps

```
1. TASK CLASSIFICATION
   Input: API call type + parameters
   Output: RouterTask (type, paragraph, sentence, focus, layers needed)

2. PROFILE LOADING
   Input: essayId
   Output: EssayProfile (full, from database)

3. SECTION SELECTION (Profile Router)
   Input: RouterTask + ProfileIndex + tokenBudget
   Output: ProfileRouterOutput (which sections, which paragraphs full/digest,
           which specific sentences, estimated tokens)

4. RENDERING (Profile Renderer)
   Input: EssayProfile + ProfileRouterOutput + RenderOptions (per layer)
   Output: rendered section strings

5. LABEL GENERATION
   Input: Rendered sentences with understanding/analysis observations
   Output: Same text with [P1S1.U1] labels injected
   Note: Labels are generated DURING rendering (step 4), not as a separate step.
         Listed separately for clarity.

6. TOKEN BUDGET VERIFICATION
   Input: All rendered sections + budget
   Output: Trimmed sections if over budget (drop lowest-priority)
   Note: Usually a no-op because step 3 used token estimates.
         Safety valve for estimate drift.

7. CACHE BLOCK ASSIGNMENT
   Input: Rendered sections + layer type
   Output: PromptBlocks { staticBlock, essayBlock, dynamicBlock }
   - Static: instructions + schema (same across essays, always cached)
   - Essay-specific: essay text + profile data (cached across calls within one analysis)
   - Dynamic: per-call data (target paragraph, conversation message, etc.)

8. API CALL
   Input: PromptBlocks → system blocks with cache_control + user message
   Output: LLM response (structured JSON)
```

### API Design

```typescript
// ═══════════════════════════════════════════════════════
// CONTEXT ASSEMBLY — the public API
// ═══════════════════════════════════════════════════════

interface ContextAssemblyService {
  /**
   * Main entry point. Takes a task and profile, returns prompt-ready blocks.
   *
   * This is the ONLY function that external code calls. It encapsulates
   * the entire pipeline: routing → rendering → labeling → budget → caching.
   */
  assembleContext(
    profile: EssayProfile,
    task: RouterTask,
    options?: AssemblyOptions,
  ): PromptBlocks;
}

interface AssemblyOptions {
  /** Maximum tokens for profile context. Default per task type. */
  tokenBudget?: number;
  /** Override which layers to render. Default determined by task. */
  layers?: ('understanding' | 'analysis')[];
  /** Additional context to include (e.g., conversation history). */
  additionalContext?: string;
  /** Whether to include observation labels. Default true for analysis tasks. */
  includeLabels?: boolean;
}

type RouterTask =
  | { type: 'understanding_walk'; paragraphIndex: number }
  | { type: 'holistic_synthesis' }
  | { type: 'analysis_pass'; paragraphIndex: number }
  | { type: 'crystallization' }
  | { type: 'feedback_annotation'; phase: ImprovementPhase }
  | { type: 'coaching'; focus: ConversationFocus; conversationHistory?: string }
  | { type: 'inline_edit'; paragraph: number; sentence: number }
  | { type: 'focused_understanding'; paragraph: number; sentence: number;
      oldText: string; newText: string }
  | { type: 'focused_analysis'; paragraph: number; sentence: number;
      updatedUnderstanding: SentenceUnderstanding }
  | { type: 'impact_classification'; changedParagraphs: number[] };

interface PromptBlocks {
  /** Instructions + schema. Cached across ALL essays. */
  staticBlock: string;
  /** Essay text + profile data. Cached across calls within one analysis. */
  essayBlock: string;
  /** Per-call data (target, conversation message). Changes every call. */
  dynamicBlock: string;

  /** Metadata for debugging and cost tracking */
  metadata: {
    sectionsLoaded: string[];
    estimatedTokens: {
      static: number;
      essay: number;
      dynamic: number;
      total: number;
    };
    labelsGenerated: number;
    sectionsDroppedForBudget: string[];
  };
}
```

### Implementation Architecture

```
src/services/essayIntelligence/
├── analysis/
│   ├── profileRouter.ts          // Section selection logic
│   ├── profileRenderer.ts        // Core rendering + composable assembly
│   └── contextAssembly.ts        // Public API (assembleContext)
```

**`contextAssembly.ts`** is the orchestrator — thin, ~100 lines:

```typescript
export class ContextAssemblyService {
  constructor(
    private router: ProfileRouter,
    private renderer: ProfileRenderer,
  ) {}

  assembleContext(
    profile: EssayProfile,
    task: RouterTask,
    options?: AssemblyOptions,
  ): PromptBlocks {
    // 1. Route: determine what to load
    const budget = options?.tokenBudget ?? DEFAULT_BUDGETS[task.type];
    const layers = options?.layers ?? DEFAULT_LAYERS[task.type];
    const routerOutput = this.router.route(profile.index, task, budget, layers);

    // 2. Render: format selected sections
    const blocks = this.renderer.assembleFor(task.type, profile, routerOutput, {
      includeLabels: options?.includeLabels ?? LABEL_DEFAULTS[task.type],
      layers,
    });

    // 3. Verify budget (safety valve)
    const totalTokens = estimateTokens(blocks.essayBlock) + estimateTokens(blocks.dynamicBlock);
    if (totalTokens > budget * 1.1) {
      // Trim lowest-priority section from essayBlock
      // (staticBlock is never trimmed — it's instructions)
      blocks.essayBlock = this.trimToFit(blocks.essayBlock, routerOutput, budget);
    }

    // 4. Inject additional context
    if (options?.additionalContext) {
      blocks.dynamicBlock += '\n\n' + options.additionalContext;
    }

    return blocks;
  }
}
```

**`profileRouter.ts`** is the brain — ~250 lines, implements the routing table from docs/specs/PLAN.md section "Routing Rules by Call Type":

```typescript
export class ProfileRouter {
  route(
    index: ProfileIndex,
    task: RouterTask,
    budget: number,
    layers: ('understanding' | 'analysis')[],
  ): ProfileRouterOutput {
    switch (task.type) {
      case 'understanding_walk':
        return this.routeUnderstandingWalk(index, task.paragraphIndex, budget);
      case 'analysis_pass':
        return this.routeAnalysisPass(index, task.paragraphIndex, budget);
      case 'coaching':
        return this.routeCoaching(index, task.focus, budget, layers);
      // ... etc.
    }
  }

  private routeUnderstandingWalk(
    index: ProfileIndex,
    paragraphIndex: number,
    budget: number,
  ): ProfileRouterOutput {
    const sections: SectionRequest[] = [];

    // Always: holistic understanding evolution
    sections.push({ section: 'holisticEvolution', priority: 1 });

    // Current paragraph: L1 impressions (full)
    sections.push({ section: `paragraphs[${paragraphIndex}].l1`, priority: 1 });

    // Connected paragraphs: full understanding
    const connected = index.connectionGraph
      .filter(c =>
        c.from[0] === paragraphIndex || c.to[0] === paragraphIndex
      )
      .map(c => c.from[0] === paragraphIndex ? c.to[0] : c.from[0]);

    for (const connPara of connected) {
      if (connPara < paragraphIndex) {  // Only prior paragraphs
        sections.push({
          section: `paragraphs[${connPara}].understanding`,
          priority: 2,
          estimatedTokens: index.sectionTokens.paragraphs[connPara],
        });
      }
    }

    // Adjacent paragraphs: full understanding
    if (paragraphIndex > 0) {
      sections.push({
        section: `paragraphs[${paragraphIndex - 1}].understanding`,
        priority: 3,
        estimatedTokens: index.sectionTokens.paragraphs[paragraphIndex - 1],
      });
    }
    if (paragraphIndex > 1) {
      sections.push({
        section: `paragraphs[${paragraphIndex - 2}].understanding`,
        priority: 4,
        estimatedTokens: index.sectionTokens.paragraphs[paragraphIndex - 2],
      });
    }

    // Earlier paragraphs: digest only
    for (let i = 0; i < paragraphIndex - 2; i++) {
      if (!connected.includes(i)) {
        sections.push({
          section: `paragraphs[${i}].digest`,
          priority: 5,
          estimatedTokens: 30,  // Digests are ~30 tokens each
        });
      }
    }

    return this.selectWithinBudget(sections, budget, index);
  }
}
```

**`profileRenderer.ts`** is the workhorse — ~400 lines, handles all formatting:

```typescript
export class ProfileRenderer {
  // ═══ CORE RENDERERS (shared across all layers) ═══

  renderIndex(index: ProfileIndex): string {
    // Compact JSON — it's a lookup table
    return `=== PROFILE INDEX ===\n${JSON.stringify(index, null, 0)}`;
  }

  renderSentence(
    paraIndex: number,
    sent: SentenceDeepAnalysis,
    options: SentenceRenderOptions,
  ): string {
    const lines: string[] = [];
    const prefix = `P${paraIndex + 1}S${sent.index + 1}`;

    lines.push(`${prefix}: "${truncate(sent.text, 80)}"`);

    if (options.layers.includes('understanding')) {
      const u = sent.understanding;

      if (u.observedFunctions.length > 0) {
        lines.push('  What it does:');
        u.observedFunctions.forEach((obs, i) => {
          const label = options.includeLabels ? `[${prefix}.U${i + 1}] ` : '';
          lines.push(`    ${label}${obs.observation}`);
        });
      }

      if (u.inferredIntents.length > 0) {
        lines.push('  Writer\'s intent:');
        u.inferredIntents.forEach((obs, i) => {
          const label = options.includeLabels ? `[${prefix}.I${i + 1}] ` : '';
          lines.push(`    ${label}${obs.observation}`);
        });
      }

      if (u.narrativeContributions.length > 0) {
        lines.push('  Narrative role:');
        u.narrativeContributions.forEach((obs, i) => {
          const label = options.includeLabels ? `[${prefix}.N${i + 1}] ` : '';
          lines.push(`    ${label}${obs.observation}`);
        });
      }

      lines.push(`  Paragraph contribution: ${u.paragraphContribution}`);

      if (options.detail === 'full') {
        lines.push(`  Craft: rhythm=${u.rhythmContribution}, voice=${u.voiceAlignment}`);
        if (u.techniques.length > 0) {
          lines.push(`  Techniques: ${u.techniques.join(', ')}`);
        }
        if (u.significantChoices.length > 0) {
          lines.push('  Significant choices:');
          u.significantChoices.forEach(c => {
            lines.push(`    "${c.wordOrPhrase}" — ${c.significance}`);
          });
        }
      }

      if (u.connectionRefs.length > 0) {
        lines.push(`  Connections: ${u.connectionRefs.join(', ')}`);
      }
      if (u.tags.length > 0) {
        lines.push(`  Tags: ${u.tags.join(', ')}`);
      }
    }

    if (options.layers.includes('analysis') && sent.analysis) {
      const a = sent.analysis;
      lines.push(`  Effectiveness: ${a.effectiveness}/100 — ${a.effectivenessReasoning}`);

      if (a.strengths.length > 0) {
        lines.push('  Strengths:');
        a.strengths.forEach((s, i) => {
          const label = options.includeLabels ? `[${prefix}.S${i + 1}] ` : '';
          lines.push(`    ${label}${s.observation}`);
        });
      }

      if (a.weaknesses.length > 0) {
        lines.push('  Weaknesses:');
        a.weaknesses.forEach((w, i) => {
          const label = options.includeLabels ? `[${prefix}.W${i + 1}] ` : '';
          lines.push(`    ${label}${w.observation}`);
        });
      }

      if (a.isProblem) lines.push(`  !! FLAGGED: priority ${a.priorityForImprovement}/5`);
      if (a.isStrength) lines.push(`  ** STANDOUT STRENGTH`);
    }

    return lines.join('\n');
  }

  renderParagraphDigest(digest: ParagraphDigestEntry): string {
    const flags = [
      digest.hasStrengths ? '+strengths' : '',
      digest.hasWeaknesses ? '-weaknesses' : '',
      digest.improvementPriority > 3 ? `!priority=${digest.improvementPriority}` : '',
    ].filter(Boolean).join(' ');

    return `  P${digest.index + 1}: ${digest.roleSummary} [${digest.sentenceCount}s] ${flags}`;
  }

  renderHolistic(name: string, data: any): string {
    // Render holistic sections as structured text with appropriate headers
    const lines: string[] = [`=== ${name.toUpperCase().replace(/([A-Z])/g, ' $1').trim()} ===`];
    // Iterate fields, skip nulls, format as "Key: value"
    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) continue;
      if (Array.isArray(value)) {
        lines.push(`${formatKey(key)}:`);
        value.forEach(item => {
          if (typeof item === 'string') {
            lines.push(`  - ${item}`);
          } else if (typeof item === 'object') {
            lines.push(`  - ${Object.values(item).join(' | ')}`);
          }
        });
      } else {
        lines.push(`${formatKey(key)}: ${value}`);
      }
    }
    return lines.join('\n');
  }

  renderConnections(connections: Connection[], filter?: (c: Connection) => boolean): string {
    const filtered = filter ? connections.filter(filter) : connections;
    if (filtered.length === 0) return '';

    const lines: string[] = ['=== CONNECTIONS ==='];
    for (const conn of filtered) {
      lines.push(
        `  [${conn.id}] P${conn.from[0] + 1}S${conn.from[1] + 1} → ` +
        `P${conn.to[0] + 1}S${conn.to[1] + 1} (${conn.type}): ${conn.description}`
      );
    }
    return lines.join('\n');
  }

  // ═══ LAYER-SPECIFIC ASSEMBLY (uses core renderers with different options) ═══

  assembleFor(
    taskType: string,
    profile: EssayProfile,
    routerOutput: ProfileRouterOutput,
    options: { includeLabels: boolean; layers: ('understanding' | 'analysis')[] },
  ): PromptBlocks {
    switch (taskType) {
      case 'understanding_walk':
        return this.assembleForUnderstandingWalk(profile, routerOutput, options);
      case 'analysis_pass':
        return this.assembleForAnalysisPass(profile, routerOutput, options);
      // ... etc.
    }
  }
}
```

### Pipeline Execution Example: L3.5 Analysis Pass for Paragraph 3

```
Step 1: Task = { type: 'analysis_pass', paragraphIndex: 2 }

Step 2: Load full EssayProfile from database

Step 3: Router.route(index, task, budget=4500, layers=['understanding'])
  → Load: Profile Index (always)
  → Load: All paragraph understanding (full detail)
  → Load: All holistic sections (from L3.75)
  → Load: All connections
  → Skip: Analysis (doesn't exist yet)
  → Estimated: ~4200 tokens

Step 4: Renderer.assembleForAnalysisPass(profile, routerOutput, {labels: true, layers: ['understanding']})
  → staticBlock: L3.5 system prompt with schema + label referencing rules (~1500 tokens)
  → essayBlock: essay text + rendered understanding profile with [P1S1.U1] labels + holistic + connections (~4200 tokens)
  → dynamicBlock: "Evaluate paragraph 3." + P3 text (~150 tokens)

Step 5: Labels generated inline during step 4 (38 labels across 23 sentences)

Step 6: Budget check: 4200 + 150 = 4350 < 4500 budget. No trimming.

Step 7: Cache blocks assigned:
  - staticBlock → system[0] with cache_control: ephemeral
  - essayBlock → system[1] with cache_control: ephemeral
  - dynamicBlock → messages[0].content (user message)

Step 8: API call. For the 4 other parallel L3.5 calls (P1, P2, P4, P5):
  - staticBlock: cache HIT (same instructions)
  - essayBlock: cache HIT (same understanding profile)
  - dynamicBlock: different (different target paragraph)
  - Cost: ~$0.003 each (mostly cached) vs ~$0.015 without caching
```

### Error Handling in the Pipeline

```typescript
// contextAssembly.ts error handling

assembleContext(profile, task, options): PromptBlocks {
  try {
    const routerOutput = this.router.route(profile.index, task, budget, layers);

    // Defensive: if router returns empty sections (shouldn't happen),
    // fall back to index-only
    if (routerOutput.sectionsToLoad.length === 0) {
      console.warn('[ContextAssembly] Router returned empty sections for task:', task.type);
      return {
        staticBlock: this.getStaticBlockForTask(task.type),
        essayBlock: this.renderer.renderIndex(profile.index),
        dynamicBlock: '',
        metadata: { sectionsLoaded: ['index'], estimatedTokens: { ... }, labelsGenerated: 0, sectionsDroppedForBudget: [] },
      };
    }

    const blocks = this.renderer.assembleFor(task.type, profile, routerOutput, renderOptions);

    // Defensive: if rendered blocks are empty, log and return minimal
    if (!blocks.essayBlock && !blocks.dynamicBlock) {
      console.error('[ContextAssembly] Renderer produced empty blocks for task:', task.type);
      // ... return minimal context
    }

    return blocks;
  } catch (error) {
    console.error('[ContextAssembly] Assembly failed:', error);
    // Return minimal context rather than throwing — the LLM can still
    // produce useful output with just the essay text and instructions
    return {
      staticBlock: this.getStaticBlockForTask(task.type),
      essayBlock: `=== ESSAY TEXT ===\n${profile.paragraphs.map(p => p.text).join('\n\n')}`,
      dynamicBlock: '',
      metadata: { ... },
    };
  }
}
```

---

## Summary: Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| **Rendering format** | Structured text (B) with JSON for Index | LLM comprehension > machine readability. 35% token savings. |
| **Observation labels** | Position-based, globally consistent (B) | `P1S1.U1` is self-documenting, stable across calls, zero storage cost |
| **Token budget** | Two-pass estimate-then-render (C) | Leverages ProfileIndex.sectionTokens. No wasted rendering. Safety valve. |
| **Prompt caching** | Multi-block (static + essay-specific) per layer | L3 saves ~$0.040, L3.5 saves ~$0.072, L6 saves ~$0.068 per session |
| **Differential rendering** | Composable renderer with options (C) | Core mechanics shared. Layer-specific assembly via options. ~400 lines total. |
| **DB serialization** | Full JSON, no intermediate format | Stored profile is canonical. Rendered profile is ephemeral view. |
| **Pipeline API** | `assembleContext(profile, task, options): PromptBlocks` | Single entry point. Encapsulates routing, rendering, budgeting, caching. |

**Total estimated savings from caching + rendering optimization**: ~$0.40-0.55 per full session (first pass + 4 rounds + 10 coaching turns), representing 20-30% cost reduction from naive rendering.

---

## Implementation Order

1. **ProfileRenderer** core renderers (`renderSentence`, `renderParagraph`, `renderHolistic`, `renderConnections`, `renderIndex`) — these are the building blocks everything else depends on
2. **Observation label generation** — integrated into `renderSentence` via options
3. **ProfileRouter** section selection logic — implements the routing table from docs/specs/PLAN.md
4. **ContextAssemblyService** — thin orchestrator that wires router + renderer
5. **Layer-specific assembly methods** — `assembleForUnderstandingWalk`, `assembleForAnalysisPass`, etc.
6. **Multi-block caching support** in `callClaude` — extend to accept `SystemBlock[]`
7. **Token budget enforcement** — two-pass with safety valve
8. **Tests**: `test-profile-rendering.ts` (unit tests for each renderer) + `test-context-assembly.ts` (integration tests for the full pipeline)
