# Writing Quality Improvement — Success Criteria & Validation Framework

> **Purpose**: Define measurable success criteria for every feature, validation methods to prove they work, and quality gates before moving forward.
> **Created**: 2026-02-19
> **Philosophy**: If you can't measure it, you can't improve it. Every feature gets a concrete "definition of done" with pass/fail tests.

---

## Table of Contents

1. [Overall Vision & North Star Metrics](#1-overall-vision--north-star-metrics)
2. [Phase 0: Foundation — Success Criteria](#2-phase-0-foundation--success-criteria)
3. [Phase 1: Voice System — Success Criteria](#3-phase-1-voice-system--success-criteria)
4. [Phase 2: Inline Editing — Success Criteria](#4-phase-2-inline-editing--success-criteria)
5. [Phase 3: RAG + Story Mining — Success Criteria](#5-phase-3-rag--story-mining--success-criteria)
6. [Phase 4: Analytics — Success Criteria](#6-phase-4-analytics--success-criteria)
7. [Cross-Cutting Quality Gates](#7-cross-cutting-quality-gates)
8. [Type.ai Parity Scorecard](#8-typeai-parity-scorecard)
9. [Validation Test Suite](#9-validation-test-suite)
10. [Progress Tracker](#10-progress-tracker)

---

## 1. Overall Vision & North Star Metrics

### What "Success" Looks Like

> After all 4 phases, a student should be able to:
> 1. Upload a writing sample and have the system **know their voice** across all workshops
> 2. Get **teaching backed by real examples** ("Here's how a strong Stanford essay handles this...")
> 3. Select any sentence and apply **targeted editing commands** that preserve their voice
> 4. See an **authenticity score** that flags AI-sounding passages before submission
> 5. Use **story mining** to discover their best essay angles from their activities
> 6. Track their **progress over time** — which edits improved scores, which didn't
>
> All of this at **~45% lower cost** than today.

### North Star Metrics

| Metric | Current Baseline | Target | How to Measure |
|--------|-----------------|--------|----------------|
| **Writing quality** (human eval) | N/A (establish baseline) | Preferred over type.ai output in blind comparison | Side-by-side evaluation on 20 sample essays |
| **Voice preservation** | 0% (no voice system) | 85%+ voice consistency score on re-analysis | VoiceProfileService re-scores output against profile |
| **Cost per student** | $1.50-3.00 | $0.80-1.60 | Token tracking across full workflow |
| **Inline edit response time** | N/A (no inline editing) | < 3 seconds (Haiku), < 5 seconds (Sonnet) | p95 latency measurement |
| **Teaching specificity** | Static examples only | 80%+ of teaching includes retrieved real examples | RAG hit rate tracking |
| **Authenticity score** | N/A | < 30 AI risk score on all system-generated suggestions | AIRiskScorer on output |
| **Type.ai parity** | 21/50 (current scorecard) | 45+/50 | Scorecard in Section 8 |

---

## 2. Phase 0: Foundation — Success Criteria

### 2A. Model ID Fix

| Criterion | Pass Condition | Validation Method |
|-----------|---------------|-------------------|
| No stale model IDs | Zero instances of `claude-sonnet-4-5-20250514` in codebase | `grep -r "20250514" src/ supabase/` returns empty |
| Correct model everywhere | All Sonnet calls use `claude-sonnet-4-5-20250929` | `grep -r "sonnet" src/ supabase/ --include="*.ts"` audit |
| No regressions | All existing tests still pass | Run existing test suite |

**Validation script:**
```bash
# MUST return 0 results
grep -r "20250514" src/ supabase/ --include="*.ts" | wc -l
# Expected: 0

# SHOULD return many results (all using correct ID)
grep -r "20250929" src/ supabase/ --include="*.ts" | wc -l
# Expected: 10+
```

### 2B. Prompt Caching

| Criterion | Pass Condition | Validation Method |
|-----------|---------------|-------------------|
| Caching enabled on Sonnet calls | All Sonnet calls with stable system prompts use `cacheSystemPrompt: true` | Code audit of all `callClaude` invocations |
| Measurable cost reduction | Token cost drops 30-40% on second run of same pipeline | Run pipeline twice, compare `cache_read_input_tokens` vs `input_tokens` |
| Cache actually hits | `cache_creation_input_tokens` on first call, `cache_read_input_tokens` on subsequent | Check Anthropic API response metadata |

**Validation test:**
```typescript
// tests/test-prompt-caching-validation.ts
// Run Activity Workshop pipeline twice with same system prompts
// First run: expect cache_creation_input_tokens > 0
// Second run: expect cache_read_input_tokens > 0, cost < first run
// Pass if: second run cost < 70% of first run cost
```

### 2C. PIQ Type Fixes

| Criterion | Pass Condition | Validation Method |
|-----------|---------------|-------------------|
| No @ts-nocheck | Zero `@ts-nocheck` in PIQ files | `grep -r "ts-nocheck" src/services/piq` returns empty |
| Types compile clean | `npx tsc --noEmit` passes with zero errors | CI gate |
| Dimension consistency | All dimension references match the type union | Grep all dimension string literals, verify against union type |

### Phase 0 Gate: ALL THREE must pass before proceeding to Phase 1

```
□ grep "20250514" returns 0 results
□ npx tsc --noEmit passes
□ grep "ts-nocheck" in PIQ returns 0 results
□ Prompt caching validation shows 30%+ cost reduction on second run
```

---

## 3. Phase 1: Voice System — Success Criteria

### 3A. Voice Profile Accuracy

The voice profiling system must accurately capture a student's writing style. Test with diverse writing samples.

| Criterion | Pass Condition | Validation Method |
|-----------|---------------|-------------------|
| **Register detection** | Correctly identifies emotional register in 8/10 test samples | Human-labeled test set of 10 diverse writing samples |
| **Vocabulary level** | Matches human judgment in 9/10 cases | Compare `sophisticated/clear/simple` against 10 labeled samples |
| **Sentence metrics** | Average sentence length within ±2 words of actual | Compute actual avg sentence length, compare to profile output |
| **Signature words** | At least 3/5 identified words appear 2+ times in source | Statistical verification against source text |
| **Formality** | Matches human judgment in 9/10 cases | Human-labeled test set |
| **Cross-sample stability** | Same student's profile from 2 different samples has similarity > 0.8 | Profile two samples from same author, cosine similarity on numeric fields |

**Validation test:**
```typescript
// tests/test-voice-profile-accuracy.ts
// 10 diverse writing samples (formal, casual, academic, creative, etc.)
// Each labeled by human for register, vocabulary, formality
// Pass if: 80%+ agreement with human labels
// Also test: same author, two samples → profiles should be similar
```

### 3B. Voice Preservation in Output

When the voice profile is injected into prompts, the output should sound like the student.

| Criterion | Pass Condition | Validation Method |
|-----------|---------------|-------------------|
| **Sentence length match** | Generated text avg sentence length within ±3 words of profile | Measure on 10 generated suggestions |
| **No banned terms** | Zero banned/avoid words from profile appear in output | String search |
| **Formality match** | Generated text formality matches profile setting | Heuristic check (formal markers vs casual markers) |
| **Signature word inclusion** | At least 1 signature word used naturally per 200 words | String search on generated output |
| **A/B preference** | Voice-profiled output preferred over non-profiled in 7/10 blind comparisons | Human evaluation: show both, ask "which sounds more like this student?" |

**Validation test:**
```typescript
// tests/test-voice-preservation.ts
// Take 5 student samples, build profiles, generate suggestions with and without profile
// Measure: sentence length deviation, banned term count, formality match
// Pass if: profiled output is closer to original voice on all metrics
// Bonus: blind human preference test (profiled preferred 70%+)
```

### 3C. Cross-Workshop Consistency

The same voice profile should produce consistent-sounding output across all 3 workshops.

| Criterion | Pass Condition | Validation Method |
|-----------|---------------|-------------------|
| **Same voice across workshops** | Output from Common App, PIQ, and Activity workshops for same student has voice similarity > 0.7 | Generate output from all 3 workshops with same profile, measure voice metrics consistency |
| **Profile persistence** | Save → load → use produces identical results to direct use | Integration test with Supabase |

**Validation test:**
```typescript
// tests/test-voice-cross-workshop.ts
// Build profile for one student
// Generate: Common App suggestion, PIQ feedback, Activity description optimization
// Measure: sentence length variance, formality consistency, vocabulary overlap
// Pass if: all 3 outputs have similar voice metrics (within 20% of each other)
```

### Phase 1 Gate

```
□ Voice profile accuracy: 80%+ agreement with human labels on 10 test samples
□ Voice preservation: profiled output has lower voice deviation than non-profiled (all 5 samples)
□ Cross-workshop: voice metrics within 20% across all 3 workshops
□ Persistence: save/load/use roundtrip works correctly
□ npx tsc --noEmit passes
□ No regressions in existing tests
```

---

## 4. Phase 2: Inline Editing — Success Criteria

### 4A. Edit Quality

Each of the 15 editing commands must produce useful, voice-consistent edits.

| Criterion | Pass Condition | Validation Method |
|-----------|---------------|-------------------|
| **Command effectiveness** | Each command measurably changes the target dimension | Run each command on 5 test passages, score before/after on target dimension |
| **Two alternatives** | Every response has primary (safe) + creative (bolder) | Schema validation on all responses |
| **Teaching note** | Every response includes non-trivial teaching note + principle | Length check (> 20 words) + human review |
| **Voice preservation** | Edits pass quickVoiceCheck against student profile | Run quickVoiceCheck on all generated alternatives |
| **No fabrication** | Edits don't invent facts, experiences, or achievements | Human review of 30 edit samples |

**Validation test per command:**
```typescript
// tests/test-inline-editing-e2e.ts
// For each of 15 commands:
//   1. Apply to 5 different test passages
//   2. Verify JSON schema (primary, creative, teachingNote, principle)
//   3. Verify primary != creative (actually different approaches)
//   4. Verify neither alternative == original (actually changed something)
//   5. Run quickVoiceCheck on both alternatives
//   6. Measure target dimension improvement:
//      - make_concrete: specificity score should increase
//      - show_dont_tell: sensory detail count should increase
//      - cut_filler: word count should decrease
//      - etc.
// Pass if: all commands pass on 4/5 test passages
```

**Command-specific success metrics:**

| Command | Success Signal | Measurement |
|---------|---------------|-------------|
| `make_concrete` | Specificity increases | Count specific nouns, numbers, names (before vs after) |
| `show_dont_tell` | Sensory/scene language increases | Count sensory words, dialogue markers, action verbs |
| `clarify_learning` | Reflection depth increases | Count insight phrases, first-person reflection markers |
| `add_stakes` | Tension/consequence language increases | Count consequence words, conditional phrases |
| `strengthen_voice` | Voice similarity to profile increases | quickVoiceCheck deviation decreases |
| `cut_filler` | Word count decreases 15%+ | Word count comparison |
| `add_evidence` | Specific metrics/numbers appear | Count numbers, percentages, named results |
| `deepen_vulnerability` | Emotional specificity increases | Count specific emotion words (not generic "felt good") |
| `connect_to_theme` | Theme reference appears in passage | Check for theme keywords from essay context |
| `fix_hook` | Opening has more concrete/surprising element | Human eval + sensory word count |
| `sharpen_ending` | Ending has stronger resolution/echo | Human eval |
| `expand_moment` | Word count increases, sensory detail increases | Word count + sensory word count |
| `compress` | Word count decreases 20%+, meaning preserved | Word count + semantic similarity to original |
| `add_dialogue` | Dialogue markers appear | Count quotation marks, dialogue tags |
| `remove_cliche` | Banned/cliché terms removed | Cliché pattern match (before vs after) |

### 4B. Response Time

| Criterion | Pass Condition | Validation Method |
|-----------|---------------|-------------------|
| **Haiku commands** | p95 < 3 seconds | Time 100 inline edits, compute p95 |
| **Sonnet commands** | p95 < 5 seconds | Time 20 complex edits, compute p95 |
| **Command suggestion** | p95 < 2 seconds | Time 50 suggest-commands calls |

### 4C. AIRiskScorer

| Criterion | Pass Condition | Validation Method |
|-----------|---------------|-------------------|
| **Detects AI text** | Scores AI-generated text > 60 risk | Test on 10 ChatGPT-generated essays |
| **Passes human text** | Scores human-written text < 30 risk | Test on 10 real student essays |
| **Flags specific passages** | Identifies at least 1 flagged passage per AI essay | Check flaggedPassages array |
| **Useful suggestions** | Each flagged passage has actionable personalization suggestion | Human review |
| **Speed** | < 50ms per assessment | Time 100 assessments |

**Validation test:**
```typescript
// tests/test-ai-risk-scorer.ts
// 10 AI-generated essays (ChatGPT, Claude raw output)
// 10 real student essays (anonymized, consented)
// Pass if:
//   - AI essays: mean risk > 60, all > 40
//   - Human essays: mean risk < 30, all < 50
//   - Separation: lowest AI score > highest human score (or close)
//   - Speed: all < 50ms
```

### 4D. StyleConsistencyService

| Criterion | Pass Condition | Validation Method |
|-----------|---------------|-------------------|
| **quickVoiceCheck catches violations** | Detects 8/10 planted voice violations | Create 10 test cases with deliberate violations (wrong formality, banned terms, etc.) |
| **quickVoiceCheck passes clean text** | Passes 9/10 voice-consistent texts | Create 10 clean test cases matching a profile |
| **buildVoiceConstraintBlock** | Block is < 300 tokens and includes all key voice parameters | Token count + content verification |
| **No false positives blocking good output** | False positive rate < 10% | Run on 50 good outputs, count failures |

### Phase 2 Gate

```
□ All 15 editing commands pass on 4/5 test passages each
□ p95 response time: < 3s (Haiku), < 5s (Sonnet)
□ AI risk scorer separates AI from human text (mean gap > 30 points)
□ quickVoiceCheck: < 10% false positive rate, > 80% true positive rate on violations
□ Voice-profiled inline edits pass quickVoiceCheck in 90%+ of cases
□ npx tsc --noEmit passes
□ No regressions
```

---

## 5. Phase 3: RAG + Story Mining — Success Criteria

### 5A. RAG Retrieval Quality

| Criterion | Pass Condition | Validation Method |
|-----------|---------------|-------------------|
| **Relevance** | Top-3 retrieved examples are relevant to the query in 8/10 cases | Human eval: "Is this example relevant to this student's text + dimension?" |
| **Diversity** | Top-3 results are not near-duplicates | Pairwise similarity < 0.85 among top results |
| **Quality tier filter** | Only `excellent`/`strong` tier results returned when filtered | Verify quality_tier field on all returned results |
| **Metadata filter** | Filtering by essay_type, dimension, college returns correct subset | Unit tests with known test data |
| **No language copying** | `formatForPrompt()` output contains principles, not copied phrases | Human review of 20 formatted outputs |
| **Token efficiency** | Formatted output < 300 tokens per 3 examples | Token count measurement |

**Validation test:**
```typescript
// tests/test-rag-retrieval-e2e.ts
// Seed 50 test fragments with known metadata
// Query 10 different student texts
// For each: retrieve top-3, verify:
//   1. All results match requested filters (essay_type, dimension)
//   2. Results are semantically relevant (embedding cosine sim > 0.5 with query)
//   3. Results are diverse (pairwise sim < 0.85)
//   4. formatForPrompt output < 300 tokens
//   5. formatForPrompt output contains NO quoted phrases > 8 words from source
```

### 5B. RAG Impact on Teaching Quality

The most important test: does RAG actually improve the teaching output?

| Criterion | Pass Condition | Validation Method |
|-----------|---------------|-------------------|
| **Teaching specificity** | RAG-enhanced suggestions cite specific examples/patterns | Compare outputs with and without RAG: count specific references |
| **Human preference** | RAG-enhanced teaching preferred in 7/10 blind comparisons | A/B test: same input, one with RAG context, one without |
| **Actionability** | RAG-enhanced suggestions have more concrete action items | Count specific instructions (do X, try Y) vs vague advice |

**Validation test:**
```typescript
// tests/test-rag-teaching-impact.ts
// Take 10 real essay issues
// Generate teaching for each: once with RAG context, once without
// Measure:
//   1. Specificity: count concrete references (names, patterns, principles)
//   2. Actionability: count specific instructions vs vague advice
//   3. Length: RAG-enhanced should be similar length (not just longer)
// Pass if: RAG-enhanced scores higher on specificity + actionability in 7/10 cases
```

### 5C. Content Migration (Seeder)

| Criterion | Pass Condition | Validation Method |
|-----------|---------------|-------------------|
| **Fragment count** | 400+ fragments seeded | `SELECT COUNT(*) FROM rag_essay_fragments` |
| **Transformation count** | 80+ transformations seeded | `SELECT COUNT(*) FROM rag_transformations` |
| **Embeddings present** | All rows have non-null embeddings | `SELECT COUNT(*) WHERE embedding IS NULL` = 0 |
| **Metadata complete** | All rows have essay_type, dimension, quality_tier | `SELECT COUNT(*) WHERE essay_type IS NULL` = 0 |
| **No duplicates** | < 5% near-duplicate fragments | Pairwise similarity check on random sample |

### 5D. Story Mining Quality

| Criterion | Pass Condition | Validation Method |
|-----------|---------------|-------------------|
| **Moment specificity** | Extracted moments are specific instants, not summaries | Human eval: "Is this a concrete moment or a vague summary?" (8/10 must be specific) |
| **Distinctiveness scoring** | High-scored moments are actually more distinctive | Human ranking of 10 moments should correlate with system ranking (Spearman r > 0.6) |
| **Prompt fit accuracy** | Top-ranked seed for a prompt actually fits that prompt | Human eval: "Does this story fit this prompt?" (8/10) |
| **Narrative angle usefulness** | Suggested angles are genuinely different approaches | Human eval: "Are these 2 angles meaningfully different?" (7/10) |
| **Source attribution** | Every moment links to correct source activities | Verify sourceActivityIds match actual activity data |
| **Coverage** | Extracts moments from 80%+ of provided activities | Count unique activities referenced in moments / total activities |

**Validation test:**
```typescript
// tests/test-story-mining-e2e.ts
// Provide 8 diverse activity profiles (athletics, research, community service, arts, etc.)
// Run mineStories()
// Verify:
//   1. Returns 8-12 story seeds
//   2. Each seed has: moment, emotionalCore, distinctiveness, reflectionDepth
//   3. Each seed links to at least 1 valid activity
//   4. Distinctiveness scores have reasonable spread (not all the same)
//   5. Run rankForPrompt() for Common App prompt 1, 5, and 7
//   6. Top-ranked seed for each prompt should be different (not same seed wins all)
// Pass if: all structural checks pass, human review confirms quality
```

### Phase 3 Gate

```
□ RAG retrieval: relevant results in 8/10 test queries
□ RAG teaching impact: enhanced output preferred in 7/10 blind comparisons
□ Content seeded: 400+ fragments, 80+ transformations, all with embeddings
□ Story mining: 8-12 specific moments from 8 activities, quality confirmed by human review
□ Distinctiveness ranking correlates with human judgment (r > 0.6)
□ npx tsc --noEmit passes
□ No regressions
```

---

## 6. Phase 4: Analytics — Success Criteria

### 6A. Event Tracking

| Criterion | Pass Condition | Validation Method |
|-----------|---------------|-------------------|
| **All events captured** | Every suggestion shown, accepted, rejected creates a row | E2E test: generate suggestions, accept some, verify DB rows |
| **Inline edit tracking** | Every inline edit creates a row with command + outcome | E2E test: run 10 inline edits, verify 10 rows |
| **Score changes tracked** | Re-analysis after edits captures before/after scores | E2E test: analyze, edit, re-analyze, verify score delta row |
| **No data loss** | Events survive server restart | Integration test with actual Supabase |
| **Performance** | Tracking adds < 50ms latency to any request | Benchmark with and without tracking |

### 6B. Version Comparison

| Criterion | Pass Condition | Validation Method |
|-----------|---------------|-------------------|
| **Score deltas accurate** | Per-dimension deltas match actual score differences | Compare computed deltas to manual calculation |
| **Improvements detected** | Correctly identifies which dimensions improved | Test with known before/after pairs |
| **Most impactful edit** | Correctly identifies the edit that caused the biggest score change | Test with known edit sequences |
| **No LLM cost** | Version comparison uses cached scores only | Verify no LLM calls during comparison |

### 6C. Aggregation Queries

| Criterion | Pass Condition | Validation Method |
|-----------|---------------|-------------------|
| **Acceptance rate** | Returns correct % for a time range | Seed test data, verify calculation |
| **Most-used commands** | Returns correct ranking | Seed test data, verify ordering |
| **Score improvement** | Returns correct average | Seed test data, verify calculation |
| **Query performance** | All aggregations complete in < 500ms | Benchmark with 10K rows |

### Phase 4 Gate

```
□ All event types tracked correctly (verified with E2E test)
□ Version comparison produces correct score deltas
□ Aggregation queries return correct results on test data
□ Tracking adds < 50ms latency
□ npx tsc --noEmit passes
□ All previous phase tests still pass (full regression)
```

---

## 7. Cross-Cutting Quality Gates

### Applied AFTER Every Phase

| Gate | Check | Tool |
|------|-------|------|
| **Type safety** | Zero TypeScript errors | `npx tsc --noEmit` |
| **No regressions** | All existing tests pass | Run full test suite |
| **No secrets** | No API keys, passwords in committed code | `grep -r "sk-" src/` and similar |
| **No dead code** | No commented-out blocks, no unused imports | ESLint + manual review |
| **Service pattern** | New services export class + singleton | Code review |
| **Error handling** | Every async function has try/catch or returns Result type | Code review |
| **Cost tracking** | New LLM calls include token tracking | Verify `callClaude` responses log token usage |

### Applied at Project Completion

| Gate | Check | Tool |
|------|-------|------|
| **Cost target met** | Per-student cost < $1.60 | Full pipeline cost measurement |
| **Type.ai parity** | Scorecard 45+/50 | Section 8 scorecard |
| **No new @ts-nocheck** | Zero across entire codebase | `grep -r "ts-nocheck" src/` |
| **All E2E tests pass** | All 4 test suites green | Run all tests |

---

## 8. Type.ai Parity Scorecard

Score each capability 0-5. **Current baseline** is from the analysis reports. **Target** is after all 4 phases.

| # | Capability | Current | After Phase | Target | How to Verify |
|---|-----------|---------|-------------|--------|---------------|
| 1 | **Voice capture from writing sample** | 1 | Phase 1 | 5 | Voice profile accuracy test passes |
| 2 | **Voice persistence across sessions** | 0 | Phase 1 | 5 | Save/load roundtrip test passes |
| 3 | **Voice consistency across workshops** | 0 | Phase 1 | 4 | Cross-workshop voice test passes |
| 4 | **Story mining / brainstorming** | 2 | Phase 3 | 4 | Story mining E2E test passes |
| 5 | **Story seed ranking by prompt fit** | 0 | Phase 3 | 4 | Ranking correlation test passes |
| 6 | **Rubric-based multi-dimension critique** | 5 | — | 5 | Already exceeds type.ai |
| 7 | **RAG with real essay examples** | 1 | Phase 3 | 4 | RAG retrieval relevance test passes |
| 8 | **Teaching backed by examples** | 2 | Phase 3 | 4 | RAG teaching impact test passes |
| 9 | **Inline editing: make_concrete** | 0 | Phase 2 | 5 | Command-specific test passes |
| 10 | **Inline editing: show_dont_tell** | 0 | Phase 2 | 5 | Command-specific test passes |
| 11 | **Inline editing: 13 other commands** | 0 | Phase 2 | 4 | All 15 commands pass 4/5 test passages |
| 12 | **Command suggestion for selection** | 0 | Phase 2 | 4 | Suggested commands are relevant in 8/10 cases |
| 13 | **Document-context awareness** | 2 | Phase 2 | 4 | Session context test passes |
| 14 | **Style-preserving rewrites** | 1 | Phase 1+2 | 4 | Voice preservation test passes |
| 15 | **Anti-AI-detection scoring** | 2 | Phase 2 | 4 | AI risk scorer separates AI from human (gap > 30) |
| 16 | **Anti-cliché / banned terms** | 4 | — | 5 | Already strong, minor expansion |
| 17 | **Paragraph-level (not full-essay) coaching** | 2 | Phase 2 | 4 | Inline editing works at paragraph level |
| 18 | **Template/mode system** | 3 | — | 4 | Existing technique system + inline modes |
| 19 | **Analytics: edit tracking** | 0 | Phase 4 | 4 | Analytics event tracking test passes |
| 20 | **Analytics: version comparison** | 0 | Phase 4 | 4 | Version comparison test passes |
| | | | | | |
| | **TOTAL** | **25/100** | | **88/100** | |

### Scoring Guide
- **0**: Not implemented at all
- **1**: Minimal/partial — exists in concept but barely functional
- **2**: Basic — works for some cases but significant gaps
- **3**: Functional — works for most cases, some rough edges
- **4**: Strong — works well, competitive with type.ai
- **5**: Excellent — exceeds type.ai for our domain (college essays)

### Parity Thresholds
- **< 60/100**: Below type.ai — not acceptable
- **60-75/100**: Approaching parity — functional but gaps remain
- **75-85/100**: At parity — competitive with type.ai
- **85+/100**: Exceeds type.ai — our target for college essay domain

---

## 9. Validation Test Suite

### Complete Test File List

Each test is created in the phase that builds the feature, but ALL tests are run as regression after every phase.

| Test File | Phase | What It Validates | Pass Criteria |
|-----------|-------|-------------------|---------------|
| `tests/test-prompt-caching-validation.ts` | 0 | Caching reduces cost 30%+ | Second run cost < 70% of first |
| `tests/test-voice-profile-accuracy.ts` | 1 | Voice profiling matches human labels | 80%+ agreement on 10 samples |
| `tests/test-voice-preservation.ts` | 1 | Output preserves student voice | Profiled output closer to original in all metrics |
| `tests/test-voice-cross-workshop.ts` | 1 | Same voice across all workshops | Voice metrics within 20% across workshops |
| `tests/test-inline-editing-e2e.ts` | 2 | All 15 commands produce quality edits | 4/5 passages pass per command |
| `tests/test-inline-editing-latency.ts` | 2 | Response time meets targets | p95 < 3s (Haiku), < 5s (Sonnet) |
| `tests/test-ai-risk-scorer.ts` | 2 | Separates AI from human text | Mean gap > 30 points |
| `tests/test-style-consistency.ts` | 2 | Voice check catches violations | < 10% false positive, > 80% true positive |
| `tests/test-rag-retrieval-e2e.ts` | 3 | RAG returns relevant examples | 8/10 queries return relevant results |
| `tests/test-rag-teaching-impact.ts` | 3 | RAG improves teaching quality | Preferred in 7/10 blind comparisons |
| `tests/test-story-mining-e2e.ts` | 3 | Story mining extracts quality moments | 8-12 specific moments, ranking correlates with human |
| `tests/test-analytics-tracking.ts` | 4 | Events captured correctly | All event types produce DB rows |
| `tests/test-version-comparison.ts` | 4 | Version deltas are accurate | Computed deltas match manual calculation |
| `tests/test-cost-validation.ts` | 4 | Cost targets met | Per-student < $1.60 |

### Running the Full Suite

```bash
# Quick validation (no LLM cost)
npx tsc --noEmit

# Phase 0 validation
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-prompt-caching-validation.ts

# Phase 1 validation
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-voice-profile-accuracy.ts
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-voice-preservation.ts
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-voice-cross-workshop.ts

# Phase 2 validation
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-inline-editing-e2e.ts
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-inline-editing-latency.ts
npx tsx tests/test-ai-risk-scorer.ts  # No API key needed (heuristic only)
npx tsx tests/test-style-consistency.ts  # No API key needed (heuristic only)

# Phase 3 validation
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-rag-retrieval-e2e.ts
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-rag-teaching-impact.ts
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-story-mining-e2e.ts

# Phase 4 validation
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-analytics-tracking.ts
npx tsx tests/test-version-comparison.ts  # No API key needed
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-cost-validation.ts

# Full regression (run after every phase)
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/run-writing-improvement-suite.ts
```

---

## 10. Progress Tracker

Copy this checklist and update as you complete each phase.

### Phase 0: Foundation ⬜

```
Implementation:
  ⬜ Model IDs fixed (grep confirms 0 stale)
  ⬜ Prompt caching enabled (all Sonnet calls with stable prompts)
  ⬜ PIQ @ts-nocheck removed + types fixed
  ⬜ PIQ teaching examples completed (9 remaining dimensions)

Validation:
  ⬜ grep "20250514" returns 0
  ⬜ npx tsc --noEmit passes
  ⬜ Prompt caching shows 30%+ reduction on second run
  ⬜ Existing tests still pass

Gate: ⬜ PASSED / ⬜ BLOCKED (reason: ___)
```

### Phase 1: Voice System ⬜

```
Implementation:
  ⬜ StudentVoiceProfile type created
  ⬜ VoiceProfileService implemented (build, enrich, save, load)
  ⬜ Database migration applied (voice_profiles table)
  ⬜ Converters from existing formats (CommonApp, Activity, PIQ)
  ⬜ Integrated into Common App orchestrator
  ⬜ Integrated into Activity workshop
  ⬜ Integrated into PIQ chat context
  ⬜ Type stubs created (inlineEditor, RAG, analytics)

Validation:
  ⬜ Voice accuracy: 80%+ agreement with human labels
  ⬜ Voice preservation: profiled output closer to original
  ⬜ Cross-workshop: metrics within 20%
  ⬜ Persistence roundtrip works
  ⬜ npx tsc --noEmit passes

Scorecard: ___/100 (target: 35+, up from 25)
Gate: ⬜ PASSED / ⬜ BLOCKED (reason: ___)
```

### Phase 2: Inline Editing ⬜

```
Implementation:
  ⬜ InlineEditorService (15 commands)
  ⬜ Command prompt templates (commandPrompts.ts)
  ⬜ SessionContextService
  ⬜ StyleConsistencyService (quickVoiceCheck + buildVoiceConstraintBlock)
  ⬜ AIRiskScorer (heuristic, no LLM)
  ⬜ API endpoints (inline-edit, suggest-commands, authenticity-check, voice-profile)

Validation:
  ⬜ All 15 commands pass 4/5 test passages
  ⬜ p95 latency: < 3s (Haiku), < 5s (Sonnet)
  ⬜ AI risk scorer: mean gap > 30 between AI and human text
  ⬜ quickVoiceCheck: < 10% false positive, > 80% true positive
  ⬜ npx tsc --noEmit passes

Scorecard: ___/100 (target: 60+, up from ~35)
Gate: ⬜ PASSED / ⬜ BLOCKED (reason: ___)
```

### Phase 3: RAG + Story Mining ⬜

```
Implementation:
  ⬜ pgvector schema (rag_essay_fragments + rag_transformations)
  ⬜ RAGService (retrieve, format, add)
  ⬜ Content migration (ragSeeder: 400+ fragments, 80+ transformations)
  ⬜ RAG integrated into Common App Stage 2
  ⬜ RAG integrated into PIQ teaching
  ⬜ RAG integrated into Activity Stage 2
  ⬜ RAG integrated into Inline Editor
  ⬜ StoryMiningService (mine, deepen, rank)
  ⬜ API endpoints (story-mining)

Validation:
  ⬜ RAG retrieval: relevant in 8/10 queries
  ⬜ RAG teaching impact: preferred in 7/10 blind comparisons
  ⬜ Content seeded: 400+ fragments, 80+ transformations, all embedded
  ⬜ Story mining: 8-12 specific moments, ranking correlates with human
  ⬜ npx tsc --noEmit passes

Scorecard: ___/100 (target: 78+, up from ~60)
Gate: ⬜ PASSED / ⬜ BLOCKED (reason: ___)
```

### Phase 4: Analytics + Final Validation ⬜

```
Implementation:
  ⬜ Analytics schema (writing_analytics + prompt_effectiveness)
  ⬜ WritingAnalyticsService (track + aggregate)
  ⬜ VersionComparisonService
  ⬜ Analytics integrated into all suggestion/editing flows
  ⬜ API endpoints (analytics)

Validation:
  ⬜ All event types tracked correctly
  ⬜ Version comparison produces correct deltas
  ⬜ Aggregations return correct results
  ⬜ Tracking adds < 50ms latency
  ⬜ npx tsc --noEmit passes

Final Validation:
  ⬜ Full regression: ALL 14 test files pass
  ⬜ Cost validation: per-student < $1.60
  ⬜ Type.ai scorecard: 85+/100

Scorecard: ___/100 (target: 88+)
Gate: ⬜ PASSED — PROJECT COMPLETE / ⬜ BLOCKED (reason: ___)
```

---

## Appendix: Human Evaluation Protocol

Some criteria require human judgment. Use this protocol for consistency:

### Blind Comparison Test
1. Prepare test inputs (essay text + issue to address)
2. Generate output A (without new feature) and output B (with new feature)
3. Randomize order (evaluator doesn't know which is A/B)
4. Evaluator rates: "Which suggestion is more helpful for this student?" (A/B/Tie)
5. Count preferences across all test cases
6. Pass if: new feature preferred in 70%+ of comparisons

### Voice Match Test
1. Show evaluator the student's original writing (2-3 paragraphs)
2. Show 2 generated suggestions (with profile / without profile)
3. Ask: "Which sounds more like this student wrote it?"
4. Pass if: profiled version preferred in 70%+ of comparisons

### Quality Spot Check
1. Generate 30 outputs from the feature being tested
2. Evaluator reviews each for: accuracy, helpfulness, voice consistency, no fabrication
3. Rate each 1-5 on these dimensions
4. Pass if: mean rating > 3.5 across all dimensions

### Who Evaluates
- Tue (product owner) for final approval
- Claude (self-evaluation) for automated checks during development
- Ideally: 2-3 students for voice matching and preference tests (if available)

---

*This document is the source of truth for measuring progress. Update the Progress Tracker (Section 10) after each phase. If a gate fails, diagnose and fix before proceeding.*
