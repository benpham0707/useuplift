# Glossary — Shared Vocabulary

> Terms used across all three workstreams. Defined once, referenced everywhere. If a term is ambiguous across chats, resolve it here first.

**Last updated**: 2026-04-23

## Pipeline layers

- **L1** (descriptive): Haiku, surface-level observations per sentence. No judgment.
- **L2**: Sonnet, structural cartography (paragraphs, transitions, architecture).
- **L2.5**: Sonnet, connection scout — cross-paragraph surface connections (repeated words, tonal shifts).
- **L3** (walk): Sonnet, sentence-level deep understanding. Per-paragraph calls (10×). File: `sequentialDeepWalk.ts`.
- **L3.75** (holistic synthesis): Sonnet, two phases (A = voice/emotion, B = theme/craft/admissions). Post-walk. File: `holisticSynthesis.ts`.
- **L3.5** (analysis pass): Sonnet, scoring + effectiveness judgment. Separate from L3's understanding. File: `analysisPass.ts`.
- **L4** (crystallizer): Sonnet, three sub-calls (NorthStar, ScoreMatrix, Crystallizer). Scoring + priorities. File: `crystallizer.ts`.
- **L5** (feedback / deep annotation): Sonnet, per-paragraph (10×) annotations. File: `deepAnnotationService.ts` + `growthEngine.ts`.
- **L6** (coaching): phase-aware, Haiku-classified then Sonnet for substantive, Haiku for simple confirmations. File: `coachingService.ts`.

## Cost concepts

- **Fresh input tokens**: uncached input, $3/M Sonnet.
- **Cache read tokens**: cached prefix read, $0.30/M Sonnet (10× cheaper).
- **Cache create tokens**: first write into cache, $3.75/M Sonnet (25% premium).
- **Output tokens**: $15/M Sonnet (5× input).
- **Cache hit rate**: `cache_read / (cache_read + fresh_input + cache_create)`.
- **iter_1**: L3.75's second synthesis iteration when iter_0 doesn't converge. Costs ~$0.47/run. Currently firing 62.5% (target: <15%).
- **Reread**: a targeted re-analysis of a specific paragraph after L3.75 iter_0 identifies something worth revisiting. Different from iter_1 (which re-runs full synthesis).
- **Convergence**: LLM's self-assessment via `selfAssessedConvergence.hasConverged`. Controls loop exit.
- **Phase A / Phase B**: L3.75's two Sonnet calls. Phase A = voice/emotion. Phase B = theme/craft/admissions/positioning.

## Workstream terms

### Cost Recovery (01)

- **Regression**: the $1.47 → $3.60 cost jump between March and April 2026.
- **Silent bleed**: cost leakage from cache prefix instability — cache marked but not hit.
- **Load-bearing**: a prompt/field/layer whose removal would measurably harm output quality.
- **Deadweight**: compute or prompt content that can be removed with no output quality impact.
- **Consumer migration cost**: work required downstream if a schema field is deleted (readinessScoring, diffEngine, coaching, API routes).

### Conversator (02)

- **Ground truth**: student's actual lived experience as collected by the Conversator. The anti-fabrication substrate.
- **ExperienceProfile** (proposed): structured representation of ground truth. Schema TBD by design doc.
- **Fabrication**: pipeline generating specifics (metrics, sensory detail, quotes) the student never provided. P0 of Deep Research Synthesis.
- **Rewrite grounding**: constraining L5/L6 rewrite output to only elaborate facts from the ExperienceProfile.
- **Round-trip flywheel**: pipeline finds a gap → Conversator asks a targeted question → new ground truth enters profile → pipeline re-analyzes with fuller context.

### RAG (03)

- **Research asset**: any curated data structure used to inform the LLM (corpus moves, archetypes, patterns, rubrics, taxonomies).
- **Retrieval trigger**: the mechanism that decides WHEN to fetch research. Eager / on-demand / predictive / hybrid.
- **Research budget**: token allocation for retrieved research per layer.
- **Corpus retrieval flag** (`ENABLE_CORPUS_RETRIEVAL_L35`): master gate for Wave-3a corpus. Currently OFF, blocked by Phase B truncation.
- **Dormant asset**: research imported into the codebase but not injected into any prompt.

## Shared quality dimensions

- **Fabrication risk**: likelihood of inventing specifics. Cost chat's Phase C1 prompt discipline gently reduces this; Conversator's ground truth eliminates it structurally.
- **Context budget**: prompt token ceiling per layer. Cost chat's Phase D creates headroom; Conversator + RAG both want to fill that headroom.
- **Signal-to-noise ratio**: ratio of decision-useful content to filler in a prompt. RAG chat's anti-contamination guards target this.

## Status values

Used in `CURRENT_STATE.md` and PLAN.md files across chats:

- `draft`: being thought through, not yet approved.
- `planned`: approved, queued for execution.
- `approved`: Tue has signed off; ready to execute.
- `in_flight`: actively being implemented.
- `blocked`: waiting on a dependency (named in the item).
- `landed`: committed to the branch.
- `verified`: passed its verification gate.
- `reverted`: committed but rolled back.

## File path conventions

- Paths are always absolute from repo root: `src/services/essayIntelligence/analysis/holisticSynthesis.ts`.
- Line references: `file.ts:784` or `file.ts:784–795`.
- Plan references across chats: `[01 Phase C1](../01-cost-recovery/PLAN.md#phase-c1)`.

## Date format

Always absolute ISO-8601: `2026-04-23`. Never relative (`Thursday`, `yesterday`).
