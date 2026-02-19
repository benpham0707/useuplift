# PIQ Workshop Writing System — Deep Analysis Report

> **Analyst**: piq-analyst | **Date**: 2026-02-19 | **Scope**: Full PIQ Workshop codebase

---

## 1. Architecture Overview

### 1.1 System Identity

The PIQ (Personal Insight Questions) Workshop is Uplift's UC-application-focused essay coaching system. It handles all 8 UC PIQ prompts (350-word limit each, students pick 4) with a multi-phase analysis pipeline, a conversational AI coach, and full persistence/versioning.

### 1.2 Pipeline Architecture

```
Student Essay Input
      │
      ├─► [Phase 17] workshop-analysis edge function ──► Surgical Workshop Backend
      │     └─► Voice Fingerprint + Experience Fingerprint + 12-Dimension Rubric + Workshop Items
      │                                                          (88–133s, Sonnet)
      ├─► [Phase 18] validate-workshop edge function ──► Suggestion Quality Validation
      │                                                          (20–50s, Sonnet)
      ├─► [Phase 19] teaching-layer edge function ──► Deep Teaching Guidance
      │                                                          (30–60s, Sonnet)
      └─► [Phase 20] suggestion-rationales edge function ──► Per-Suggestion Rationales
                                                             (parallel calls, Sonnet)

Total: ~140–300s for full analysis

Chat Coaching (separate path):
      Student Question ──► piq-chat edge function ──► Sonnet with full context ──► Coaching Response
                                                        (~2–5s per turn)
```

### 1.3 File Map

| File | Role | LOC (approx) |
|------|------|--------------|
| **Core Services** | | |
| `src/services/piqWorkshop/piqChatService.ts` | Main chat service with 415-line system prompt, welcome/starters, fallback | ~715 |
| `src/services/piqWorkshop/piqChatContext.ts` | Context builder: voice/experience fingerprints, dimensions, workshop items → LLM format | ~520 |
| `src/services/piqWorkshop/piqChatApiClient.ts` | Frontend API client for piq-chat edge function | ~72 |
| `src/services/piqWorkshopAnalysisService.ts` | Two-step analysis orchestrator (Phase 17→18→19→20), heuristic fallback | ~1110 |
| `src/services/piqSurgicalWorkshopService.ts` | Full surgical workshop integration (delegates to narrativeWorkshop) | ~120 |
| **PIQ Data Layer** | | |
| `src/services/piq/types.ts` | 13-dimension rubric types, issue patterns, teaching examples, workshop result types | ~237 |
| `src/services/piq/rubric.ts` | 13 dimension definitions with metadata, weights, tier functions | ~417 |
| `src/services/piq/issuePatterns.ts` | 35+ issue patterns across 8 categories with detection rules & fix strategies | ~1200 |
| `src/services/piq/teachingExamples.ts` | 21 weak→strong example pairs (Hook, Vulnerability, Arc, Specificity) | ~508 |
| `src/services/piq/prompts/promptMetadata.ts` | All 8 UC PIQ official prompts with themes, pitfalls, heuristic type detection | ~376 |
| `src/services/piq/weights/dimensionWeights.ts` | 8 prompt-specific weight profiles (13 dimensions × 8 prompts = 104 weights) | ~330 |
| **Persistence** | | |
| `src/services/piqWorkshop/piqDatabaseService.ts` | Supabase CRUD: save/load essays, analysis reports, version history (v2: autosave/milestone/analysis) | ~1050 |
| `src/services/piqWorkshop/autosaveService.ts` | AutosaveManager class: 5s debounce, blur/navigate saves, offline retry, local backup | ~485 |
| `src/services/piqWorkshop/storageService.ts` | localStorage caching, dual-key format (legacy + new), analysis cache with v3 versioning | ~485 |
| `src/services/piqWorkshop/supabaseService.ts` | **DEPRECATED** — old Supabase auth cloud versioning | ~230 |
| **Edge Functions** | | |
| `supabase/functions/piq-chat/index.ts` | Deno edge function: Anthropic API call with system prompt + context | ~234 |
| `supabase/functions/piq-chat/systemPrompt.ts` | Duplicate of client-side system prompt (deployed to edge) | ~415+ |
| `supabase/functions/piq-chat/contextBuilder.ts` | Server-side context formatting for LLM | — |
| `supabase/functions/piq-chat/helpers.ts` | Conversation history + cost calculation | — |
| **Frontend** | | |
| `src/pages/PIQWorkshop.tsx` | Full-page workshop with editor, rubric dimensions, version history, chat | large |
| `src/components/portfolio/piq/workshop/PIQWorkshopIntegrated.tsx` | Integrated workshop component with two-step analysis | large |
| `src/components/portfolio/piq/workshop/PIQPromptSelector.tsx` | UC PIQ prompt selection UI | — |
| `src/components/portfolio/piq/workshop/PIQCarouselNav.tsx` | Carousel navigation between PIQs | — |
| `src/components/portfolio/piq/workshop/PIQTabsNav.tsx` | Tab-based navigation | — |

### 1.4 Data Flow

```
1. User selects PIQ prompt (1 of 8) → prompt metadata loaded
2. User writes/pastes essay text (350 word limit)
3. Click "Analyze" → analyzePIQEntryTwoStep() called
   a. Phase 17: essay → workshop-analysis edge fn → surgicalOrchestrator backend
      Output: NQI score, voice fingerprint, experience fingerprint, 12 dimension scores, workshop items
   b. Phase 18: workshop items → validate-workshop edge fn
      Output: validated items with quality scores
   c. Phase 19: validated items + context → teaching-layer edge fn
      Output: teaching guidance (problem hooks, craft principles, application strategies, personal notes)
   d. Phase 20: items + suggestions → suggestion-rationales edge fn (parallel per item)
      Output: per-suggestion "why this works" rationales
4. Results displayed: score, dimensions, surgical fixes with 3 suggestion types
5. Chat opens with full context → piq-chat edge fn → coaching responses
6. Autosave fires on edits (5s debounce) → database + localStorage
```

---

## 2. Writing Quality Mechanisms

### 2.1 13-Dimension PIQ-Specific Rubric

The rubric is purpose-built for UC PIQs, organized in 4 tiers:

| Tier | Weight | Dimensions |
|------|--------|------------|
| **Critical Foundations** | 45% | Opening Hook (10%), Vulnerability & Authenticity (12%), Specificity & Evidence (10%), Voice Integrity (8%), Narrative Arc & Stakes (9%) |
| **Impact & Growth** | 30% | Transformative Impact (10%), Role Clarity (7%), Initiative & Leadership (7%), Context & Circumstances (6%) |
| **Depth & Meaning** | 15% | Reflection & Insight (9%), Identity & Self-Discovery (6%) |
| **Polish & Positioning** | 10% | Craft & Language Quality (6%), Fit & Trajectory (5%) |

**Key strength**: Vulnerability & Authenticity (12%) is the single highest-weighted dimension — this is aligned with what UC admissions actually values.

### 2.2 Prompt-Specific Weight Profiles

Each of the 8 PIQ types gets a customized weight matrix. Examples:

- **PIQ 5 (Challenge)**: Vulnerability 15%, Context 14%, Arc 13% — emphasizes emotional honesty and obstacles
- **PIQ 2 (Creative)**: Craft 13%, Hook 12%, Voice 10% — emphasizes artistic expression
- **PIQ 6 (Academic)**: Reflection 12%, Fit/Trajectory 12%, Specificity 12% — emphasizes intellectual depth

This ensures the system evaluates each prompt through the lens most relevant to what UC readers expect.

### 2.3 Voice Preservation System

The system has a multi-layered voice preservation architecture:

1. **Voice Fingerprint** (4 dimensions):
   - Sentence structure (pattern + example)
   - Vocabulary (level + signature words)
   - Pacing (speed + rhythm)
   - Tone (primary + secondary)

2. **Quality Anchors** (from Experience Fingerprint):
   - Specific sentences that work well
   - Explanation of why they work
   - Preservation priority (critical/high/medium)
   - Explicit instruction: "DO NOT CHANGE THESE"

3. **Anti-Flowery Guardrails** (embedded in system prompt):
   - Explicit examples of bad vs good: "olfactory tapestry" vs "bleach and citrus"
   - "Sounds like the student, not like a thesaurus threw up"
   - Coach must match suggestions to student's natural voice
   - Coach must reference voice fingerprint in every response

### 2.4 Anti-Convergence / Anti-Pattern System

The Experience Fingerprint includes:

- **Unique Elements** (6 types): unusual circumstance, unexpected emotion, contrary insight, sensory anchor, unique relationship, cultural specificity
- **Anti-Pattern Flags**: followsTypicalArc, hasGenericInsight, hasManufacturedBeat, hasCrowdPleaser, with specific warnings
- **Divergence Requirements**: mustInclude, mustAvoid, uniqueAngle, authenticTension

This actively pushes essays away from the "challenge→overcome→growth" arc that 47% of essays follow.

### 2.5 Issue Detection (35+ Patterns)

Comprehensive pattern library across 8 dimensions:

| Category | Pattern Count | Severity Mix |
|----------|--------------|--------------|
| Opening Hook | 4 | 2 critical, 1 major, 1 minor |
| Vulnerability | 5 | 3 critical, 2 major |
| Narrative Arc | 5 | 2 critical, 2 major, 1 minor |
| Specificity | 4 | 1 critical, 2 major, 1 minor |
| Voice | 5 | 2 critical, 1 major, 2 minor |
| Reflection | 5 | 1 critical, 4 major |
| Identity | 5 | 0 critical, 4 major, 1 minor |
| Craft | 4 | 0 critical, 0 major, 4 minor |
| Coherence | 3 | 0 critical, 1 major, 2 minor |

Each pattern includes: trigger conditions (score thresholds, keyword regex, absence checks, custom checks), problem/why-it-matters templates, and 1-3 fix strategies with estimated impact.

### 2.6 Teaching Examples Corpus

21 weak→strong example pairs covering 4 dimensions:

- **Hook**: 5 examples (generic→physical vulnerability, in medias res, sensory, stakes, dialogue)
- **Vulnerability**: 6 examples (manufactured→specific failure, defensive retreat→sustained, physical symptoms, defense mechanisms, transformation credibility, no-failure→named failure)
- **Arc**: 5 examples (flat→conflict, no turning point→specific moment, summary→scene, too neat→complexity, unclear stakes→layered)
- **Specificity**: 5 examples (no numbers→quantified, vague→before/after metrics, no sensory→multi-sense, vague descriptions→proper nouns, no time→exact breakdown)

Each example includes: weak/strong text, explanation, diff highlights, transferable principle, and essay context (leadership/challenge/creative/community/academic).

**Gap**: The TODO notes indicate examples for Voice, Reflection, Identity, Craft, and Coherence dimensions are planned but not yet implemented.

### 2.7 Three-Tier Quality Standards

The system prompt defines concrete quality targets:

| Tier | Score | Target School | Requirements |
|------|-------|---------------|-------------|
| 85-100 | Stanford/Harvard | Extended metaphor, physical vulnerability + named emotions, quoted dialogue with confrontation, community transformation with metrics, universal philosophical insight |
| 70-84 | UCLA/Berkeley | Clear narrative arc with tension, vulnerability present, dialogue exists, impact shown, reflection connects to future |
| 40-69 | Competitive | Specific story (one moment), active voice throughout, concrete details, shows growth through action |

### 2.8 Word Count Awareness (350-Word Limit)

Deeply integrated word count strategy:

- **Under 300**: Suggest additions freely
- **300-340**: Suggest additions BUT mention remaining room
- **340-350**: ALWAYS pair additions with cuts — explicit about what to remove
- **Over 350**: ONLY suggest cuts until under limit

The system calculates "trade-offs" showing: current count → cost of addition → specific cuts → net result. This is a standout feature for the 350-word PIQ format.

### 2.9 Surgical Fix System

Workshop items include 3 suggestion types per issue:

1. **polished_original**: Fixes the issue while keeping their voice
2. **voice_amplifier**: Strengthens their existing style
3. **divergent_strategy**: Completely different approach to avoid convergence

Each suggestion includes rationale text and teaching context (problem hook, craft principle, application strategy, personal note).

---

## 3. LLM Usage

### 3.1 Model Selection

| Phase | Model | Purpose | Estimated Tokens |
|-------|-------|---------|-----------------|
| Phase 17 (Analysis) | Claude Sonnet (via edge fn → surgical backend) | Holistic understanding, fingerprints, rubric scoring, surgical fixes | ~15K–25K in, ~5K–10K out |
| Phase 18 (Validation) | Claude Sonnet (via edge fn) | Validate suggestion quality | ~3K–5K in, ~1K–2K out |
| Phase 19 (Teaching) | Claude Sonnet (via edge fn) | Deep teaching guidance per item | ~5K–8K in, ~3K–5K out |
| Phase 20 (Rationales) | Claude Sonnet (via edge fn) | Per-suggestion rationales (parallel) | ~1K–2K in × N items, ~0.5K out × N |
| Chat (coaching) | Claude Sonnet 4.5 (`claude-sonnet-4-5-20250514`) | Conversational coaching | ~3K–8K in (context), ~300–500 out |

**Note**: The edge function for chat uses `claude-sonnet-4-5-20250514` — this is an **outdated model ID**. The correct current ID per project standards is `claude-sonnet-4-5-20250929`.

### 3.2 Prompt Caching

- The chat edge function uses `cache_control: { type: 'ephemeral' }` on the system prompt block
- The system prompt is ~3K+ tokens, so caching saves significant cost on subsequent chat turns
- Analysis cache key uses version prefix (`v3`) to invalidate stale caches

### 3.3 Conversation Management

- Last 6 messages included in context (configurable)
- Max 20 messages per conversation cache
- Max 50 conversations cached globally
- LRU eviction on cache overflow

### 3.4 Heuristic Fallback

When the backend is unavailable, the system provides a regex/keyword-based fallback analysis:
- Detects: story elements, emotions, dialogue, reflection, numbers, leadership, community, impact
- Produces dimension scores and basic coaching
- Flagged with `heuristic_fallback` in analysis metadata

---

## 4. Strengths

### 4.1 World-Class System Prompt

The ~415-line coaching prompt is the crown jewel. It:
- Defines a specific, memorable persona ("that English teacher who actually gets it")
- Gives concrete tone examples ("This part? *Chef's kiss.*" vs "Per the rubric guidelines...")
- Includes 3 golden standard response examples (strong essay, poetic-but-vague, word-count-aware)
- Has explicit anti-patterns ("What NOT to do")
- Provides detailed instruction on how to USE each context element naturally
- Emphasizes "ONE focused direction" per response — avoids overwhelming

### 4.2 Deep Context Awareness

Every coaching response has access to:
- Full essay text
- All 12/13 dimension scores with justification
- Voice fingerprint (preserve style)
- Experience fingerprint (unique elements + anti-patterns)
- Quality anchors (what to celebrate/protect)
- Top 3 workshop items with surgical fixes
- Version history and score trends
- Word count relative to 350 limit

### 4.3 UC-Specific Calibration

The system is deeply calibrated for UC PIQs:
- All 8 official prompts with official text and "things to consider"
- Prompt-specific weight matrices
- Common pitfalls per prompt type
- UC values explicitly encoded (Authenticity > Polish, Specificity > Vagueness, Growth > Achievement)
- 350-word limit deeply integrated into coaching strategy

### 4.4 Progressive Loading

The 4-phase split (17→18→19→20) means:
- Users see results progressively (scores first, then teaching)
- Avoids 150s edge function timeout
- Graceful degradation (Phase 18/19/20 failures don't lose Phase 17 results)

### 4.5 Robust Persistence

- Three version types (autosave, milestone, analysis) with soft delete
- Dual-format localStorage backup (new + legacy)
- Offline detection with retry queue
- Local recovery detection with server timestamp comparison
- AutosaveManager with clean lifecycle (construct → use → destroy)

### 4.6 Anti-Convergence by Design

The system actively fights the "everyone sounds the same" problem:
- Experience fingerprint identifies unique elements to protect
- Anti-pattern flags warn against common arcs
- Divergent strategy suggestions offer completely different approaches
- Coach prompt explicitly says "don't shame, redirect with empathy"

---

## 5. Weaknesses

### 5.1 Incomplete Teaching Examples

Only 21 examples across 4 dimensions (Hook, Vulnerability, Arc, Specificity). TODO comments indicate 70-95 more examples planned for Voice, Reflection, Identity, Craft, and Coherence. Without these, the teaching examples system cannot cover all 35+ issue patterns.

### 5.2 Issue Detection is Heuristic-Only on Client

The 35+ issue patterns in `issuePatterns.ts` define trigger conditions (keyword patterns, absence checks) but the actual detection runs server-side via the surgical workshop. The client-side patterns appear to be reference/configuration data, not actively used for local detection. If the server is down, these patterns are unused.

### 5.3 No Story Mining / Brainstorming Phase

The system only works with existing text. There is **no pre-writing brainstorming** flow to help students:
- Surface specific moments from their life
- Choose which PIQ prompt to answer
- Identify their strongest stories
- Do guided story mining before writing

Students must arrive with a draft — the system cannot help with the "blank page" problem.

### 5.4 No Paragraph-Level Drafting

The workshop analyzes the full essay and provides surgical fixes to specific quotes, but there's no:
- Section-by-section guided drafting
- Paragraph-level coaching (intro, body, conclusion)
- Template/outline mode for structuring before writing
- Sentence-level inline editing commands

### 5.5 No RAG with Example PIQ Responses

The teaching examples are hardcoded (21 pairs). There's no:
- Database of successful PIQ responses to reference
- Dynamic retrieval of similar essays for comparison
- "Here's what a winning leadership PIQ looks like" functionality
- Score-calibrated example bank (show a 90/100 essay vs a 60/100 essay)

### 5.6 No Multi-PIQ Portfolio Strategy

Students write 4 of 8 PIQs. The system treats each PIQ independently with no:
- Cross-PIQ theme analysis (are you repeating yourself?)
- Portfolio balance recommendation (you have two leadership PIQs — diversify)
- Strategic prompt selection guidance based on student profile
- Holistic 4-PIQ portfolio scoring

### 5.7 Stale Model IDs

The piq-chat edge function uses `claude-sonnet-4-5-20250514` — this is outdated. Per project standards, the correct ID is `claude-sonnet-4-5-20250929`. This may cause unexpected behavior or API deprecation issues.

### 5.8 Cost Estimation Accuracy

The `calculateCost()` function hardcodes pricing (`$0.000003/input, $0.000015/output`) which may be out of date. No centralized pricing configuration exists.

### 5.9 Duplicated System Prompt

The system prompt exists in two places:
- `src/services/piqWorkshop/piqChatService.ts` (client-side, used only for the `buildUserPrompt` function that's actually dead code since the API client calls the edge function)
- `supabase/functions/piq-chat/systemPrompt.ts` (edge function, actually used)

This creates drift risk — changes to one may not be reflected in the other.

### 5.10 @ts-nocheck on Critical Files

Multiple core files use `@ts-nocheck`:
- `piqDatabaseService.ts`
- `piqWorkshopAnalysisService.ts`
- `supabaseService.ts` (deprecated but still exists)
- `issuePatterns.ts` (uses `thematic_coherence` dimension not in the type union)

This suppresses type safety on critical data persistence and analysis code.

### 5.11 No Inline Editing Commands

The chat coach can suggest rewrites, but there's no:
- "Apply this suggestion" button that replaces text in the editor
- Inline diff view (before/after)
- Accept/reject workflow for suggestions
- Track changes mode

Students must manually copy suggestions from the chat into their draft.

---

## 6. Type.ai Comparison

### Feature-by-Feature Analysis

| Feature | Type.ai | Uplift PIQ Workshop | Gap |
|---------|---------|---------------------|-----|
| **Voice Capture & Style Preservation** | Core feature — voice extraction, style fingerprinting, all suggestions match student voice | **Strong** — Voice Fingerprint (4 dimensions), quality anchors, anti-flowery guardrails in system prompt. Explicit instruction to match coaching to student's voice. | Comparable. Uplift's implementation is deep. |
| **Story Mining & Brainstorming** | Guided brainstorming, moment surfacing, prompt selection help | **Missing** — System only works with existing drafts. No pre-writing flow, no story mining, no prompt selection guidance. | **Major gap**. The "blank page" problem is completely unaddressed. |
| **Paragraph-Level Drafting** | Section-by-section guided drafting with coaching at each stage | **Partial** — Surgical fixes target specific quotes, but no guided paragraph-level drafting or section templates. Full-essay analysis only. | **Moderate gap**. Could add section-aware coaching. |
| **Rubric-Based Critique with UC Scoring** | Dimension scoring calibrated to admissions criteria | **Excellent** — 13-dimension rubric with prompt-specific weights across all 8 PIQ types. 4-tier system (Critical/Impact/Depth/Polish). Issue severity (critical/major/minor). | Uplift is **stronger** here with 104 calibrated weights. |
| **RAG with Example PIQ Responses** | Example database for reference | **Partial** — 21 weak→strong teaching examples, but no dynamic retrieval, no database of actual successful PIQs, no score-calibrated example bank. | **Significant gap**. Static examples vs dynamic retrieval. |
| **Inline Editing Commands** | Inline suggestions, accept/reject, diff view | **Missing** — Suggestions displayed in analysis panel and chat, but no inline editing integration. No "apply this fix" button. | **Major gap** for UX. |
| **Guardrails Against Generic/AI Output** | Anti-AI detection, authenticity scoring | **Strong** — Voice integrity dimension, AI-pattern detection (keywords: "delve into", "furthermore", etc.), anti-convergence experience fingerprint, anti-pattern warnings. | Comparable. Both address this. |
| **UC-Specific Guidance Integration** | UC official guidance integrated | **Excellent** — All 8 UC PIQ official prompts with complete text, "things to consider" from UC, common pitfalls, key themes, weight calibration per prompt. | Uplift is **stronger** with complete UC integration. |
| **Template / Mode System** | Multiple modes (brainstorm, draft, revise, polish) | **Missing** — Single mode: analyze-and-coach. No distinct brainstorm/draft/revise/polish modes. No templates or outlines. | **Moderate gap**. |
| **Analytics / Feedback Loops** | Writing analytics, improvement tracking | **Good** — Version history with score tracking, improvement trend (improving/stable/declining), NQI delta tracking. Missing: learning analytics, common mistakes dashboard, aggregate insights. | Partial. Score tracking exists, deeper analytics missing. |
| **Conversational Coaching** | Chat-based coaching | **Excellent** — World-class system prompt with persona, tone examples, golden standard responses. Word count awareness. Progressive context loading. | Uplift is **strong** here with exceptional prompt engineering. |
| **Multi-Essay Strategy** | Portfolio-level thinking | **Missing** — No cross-PIQ analysis, no portfolio balance, no strategic prompt selection. | **Significant gap** for UC applications (4 PIQs). |
| **Cost Efficiency** | Unknown | 4-phase analysis (~$0.20-0.50 per full analysis), chat (~$0.01-0.03 per turn) | See cost analysis below. |

### Summary Comparison

**Uplift Wins On:**
- UC-specific rubric calibration (13 dimensions × 8 prompts)
- Voice preservation depth (fingerprint + anchors + anti-flowery)
- Anti-convergence system (experience fingerprint + divergence requirements)
- Conversational coaching quality (exceptional system prompt)
- Word count awareness (deep 350-word limit integration)
- Progressive loading architecture

**Type.ai Wins On:**
- Story mining / brainstorming (pre-writing)
- Paragraph-level guided drafting
- RAG with example essays
- Inline editing commands (apply/reject/diff)
- Template/mode system
- Multi-essay portfolio strategy

---

## 7. Cost Analysis

### 7.1 Per-Analysis Cost Estimate

| Phase | Input Tokens | Output Tokens | Model | Estimated Cost |
|-------|-------------|---------------|-------|---------------|
| Phase 17 (Analysis) | ~20,000 | ~8,000 | Sonnet | $0.060 + $0.120 = **$0.180** |
| Phase 18 (Validation) | ~5,000 | ~2,000 | Sonnet | $0.015 + $0.030 = **$0.045** |
| Phase 19 (Teaching) | ~8,000 | ~4,000 | Sonnet | $0.024 + $0.060 = **$0.084** |
| Phase 20 (Rationales, 3 items) | ~4,500 | ~1,500 | Sonnet | $0.014 + $0.023 = **$0.037** |
| **Total per analysis** | | | | **~$0.35** |

### 7.2 Per-Chat-Turn Cost

| Component | Input Tokens | Output Tokens | Model | Estimated Cost |
|-----------|-------------|---------------|-------|---------------|
| System prompt (cached) | ~3,000 (cache read) | — | Sonnet | ~$0.001 |
| Context block | ~2,000–5,000 | — | Sonnet | $0.006–$0.015 |
| Conversation history (6 msgs) | ~1,500 | — | Sonnet | $0.005 |
| Response | — | ~300–500 | Sonnet | $0.005–$0.008 |
| **Total per chat turn** | | | | **~$0.02–$0.03** |

### 7.3 Session Cost Estimate

Typical session: 1 analysis + 5 chat turns + 1 re-analysis:
- 2 analyses: $0.70
- 5 chat turns: $0.12
- **Total: ~$0.82 per essay session**

For 4 PIQs: **~$3.30 per complete UC PIQ portfolio**

### 7.4 Optimization Opportunities

1. **Prompt caching on analysis**: The surgical workshop backend could cache the rubric/dimension descriptions across analyses (these are static). Estimated saving: 20-30% of Phase 17 input tokens.

2. **Batch Phase 20**: Instead of N parallel calls for suggestion rationales, batch into a single prompt. Saves N-1 overhead calls.

3. **Smart re-analysis**: When user edits <20 words, run "delta analysis" instead of full re-analysis. Could use Haiku for minor edits.

4. **Context compression for chat**: After 3+ turns, summarize earlier conversation instead of sending full history. Saves ~30% of chat input tokens.

5. **Haiku for Phase 18 validation**: Suggestion quality validation may not need Sonnet-level reasoning. Testing Haiku could cut Phase 18 cost by 90%.

6. **Cache teaching examples**: The 21 teaching examples are static text included in prompts. These could be cached via prompt caching prefix.

---

## 8. Key Recommendations (Priority Order)

### P0 — Fix Model ID
Update `supabase/functions/piq-chat/index.ts` from `claude-sonnet-4-5-20250514` to `claude-sonnet-4-5-20250929`.

### P1 — Add Story Mining / Brainstorming
Build a pre-writing phase that helps students surface stories before drafting. This is the single biggest gap vs competitors.

### P2 — Multi-PIQ Portfolio Strategy
Add cross-PIQ analysis: theme overlap detection, portfolio balance scoring, strategic prompt selection.

### P3 — Inline Editing Integration
Add "Apply This Fix" buttons that replace text in the editor, with undo. This is critical for surgical fix usability.

### P4 — Complete Teaching Examples
Finish the remaining 70-95 examples for Voice, Reflection, Identity, Craft, and Coherence dimensions.

### P5 — RAG with PIQ Examples
Build a scored example database of UC PIQ responses for reference and calibration.

### P6 — Remove @ts-nocheck
Fix type issues in `piqDatabaseService.ts`, `piqWorkshopAnalysisService.ts`, and `issuePatterns.ts` to restore type safety.

### P7 — Deduplicate System Prompt
Remove the dead code system prompt from `piqChatService.ts` (client-side) since the edge function version is authoritative.

---

*End of PIQ Workshop Writing Analysis Report*
