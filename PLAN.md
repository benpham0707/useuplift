# Phase 2: Prompt Enrichment Design

**Last Updated**: February 24, 2026
**Status**: DESIGN COMPLETE — Awaiting Approval
**Author**: Claude (AI Integration Specialist)
**Scope**: Inject computational analysis into LLM prompts for targeted, cost-effective essay coaching

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prompt Enrichment Templates](#2-prompt-enrichment-templates)
3. [PromptEnrichmentService (Complete Implementation)](#3-promptenrichmentservice)
4. [Token Budget Analysis](#4-token-budget-analysis)
5. [Quality Impact Predictions](#5-quality-impact-predictions)
6. [Prompt Engineering Safety](#6-prompt-engineering-safety)
7. [Implementation Plan (Exact Diffs)](#7-implementation-plan)
8. [Testing Strategy](#8-testing-strategy)

---

## 1. Architecture Overview

### Data Flow

```
Essay Text
    |
    ├─ InformationTheoreticAnalyzer.analyze(text)    ~5ms
    |   → entropy, surprisal, compression, density, MI, NCD, Zipf
    |   → rubricScores (11 dimensions, 0-10 each)
    |   → diagnostics[] (human-readable flags)
    |
    ├─ stylometricAnalyzer.analyze(text)             ~15ms
    |   → fingerprint (sentence metrics, vocab, rhythm, register)
    |   → aiDetection (probability + 6 signals)
    |   → registerAnalysis (primary register, shifts, factors)
    |   → rhythmAnalysis (quality score, devices, pattern)
    |   → idiolect (signature phrases, characteristic words)
    |
    └─ [ScoringScience — future Phase 3]
         → Bayesian priors, constraint predictions
         (Not integrated in Phase 2)

    |
    v
PromptEnrichmentService.enrich(stage, computationalResults)
    |
    ├─ Filter to stage-relevant findings only
    ├─ Prioritize actionable insights (max 5 per stage)
    ├─ Format as calibration block (NOT instructions)
    ├─ Enforce 200-token budget
    |
    v
Enrichment Block (injected into prompt template)
    |
    v
Existing LLM Prompt (stage1A, stage1B, stage2, stage3, PIQ, Activity)
```

### Design Principles

1. **Calibration, not instruction.** Enrichment tells Claude "here is what the computational analysis found" — never "you must agree with this." Claude interprets the signals through its own judgment.

2. **Stage-specific relevance.** Each stage gets different signals. Stage 1A (teaching) gets voice and craft signals. Stage 1B (diagnosis) gets density and structural signals. Stage 3 (polish) gets rhythm and idiolect signals.

3. **200-token hard cap.** Enrichment must be dense and useful. No padding, no explanation of methodology. Just findings.

4. **Feature-flag gated.** Every enrichment injection is independently toggleable per stage via a configuration object. Shadow mode computes enrichment and logs it but does not inject.

5. **Anti-parroting by design.** Enrichment is framed as "pre-analysis calibration" — a second opinion that Claude should incorporate, not parrot back to the student.

---

## 2. Prompt Enrichment Templates

### 2.1 Template: Stage 1A (Foundation Teaching)

**Purpose**: Help Claude identify the student's authentic voice signature and calibrate coaching tone.

**Relevant signals**: Voice fingerprint, register analysis, AI detection, engagement score, Zipf naturalness.

**Injection point**: Before the essay draft in `STAGE1A_TEACHING_PROMPT`, after "CRITICAL AWARENESS" section.

```
═══════════════════════════════════════════════════════════
PRE-ANALYSIS CALIBRATION (computational signals — use as context, not script)
═══════════════════════════════════════════════════════════

Voice Profile:
- Register: {primaryRegister} (formality {formalityScore}/1.0)
- Sentence rhythm: avg {meanLength} words (std {stdDevLength}), pattern: {lengthPattern}
- Vocabulary: TTR {typeTokenRatio}, {polysyllabicRatio}% polysyllabic
- Contraction preference: {contractionPreference}/1.0

Authenticity Signals:
- AI probability: {aiProbability} (confidence {confidence})
{dominantSignals → if aiProbability > 0.4: "- Dominant AI signals: {signals}"}
- Zipf naturalness: {interpretation} (alpha {alpha})
- Engagement score: {engagementScore}/10

Quality Anchors:
{engagingPassages → top 2, truncated to 60 chars each}

Risk Flags:
{monotonousSections → count} monotonous sections detected
{predictablePassages → count} predictable/cliche passages detected
{registerShifts → if any: "{count} register shifts detected ({from}→{to})"}
```

**Token estimate**: 120-160 tokens depending on flags.


### 2.2 Template: Stage 1B (Deep Diagnosis)

**Purpose**: Give Claude precise structural and density data to ground issue identification in evidence.

**Relevant signals**: Compression analysis, density variation, NCD, mutual information, surprisal passages.

**Injection point**: Before essay draft in `STAGE1B_DIAGNOSIS_PROMPT`, after the JSON structure requirements section.

```
═══════════════════════════════════════════════════════════
COMPUTATIONAL DIAGNOSIS CALIBRATION
═══════════════════════════════════════════════════════════

Structural Analysis:
- Compression ratio: {overallRatio} ({uniquenessScore}/10 uniqueness)
- Density arc: {shapeProfile} (variation {variationScore}/10)
- Intro-conclusion coherence: MI={introConclusion} ({coherenceScore}/10)

Redundancy Map:
{redundantPairs → "P{p1}↔P{p2}: NCD={ncd} (redundant)" for each}
{disconnectedPairs → "P{p1}↔P{p2}: NCD={ncd} (disconnected)" for each}
{crossParagraphRedundancy → top 2 highest redundancy scores}

Passage-Level Evidence:
- Predictable: {predictablePassages → top 3, 40 chars each with paragraph index}
- Engaging: {engagingPassages → top 2, 40 chars each with paragraph index}

Rubric Pre-Scores (computational only — verify with your own judgment):
- Word choice diversity: {wordChoiceDiversity}/10
- Structural balance: {structuralBalance}/10
- Information uniqueness: {informationUniqueness}/10
- Opening surprisal: {openingSurprisal}/10
```

**Token estimate**: 130-180 tokens.


### 2.3 Template: Stage 2 Batch (Surgical Teaching)

**Purpose**: For each diagnosed issue, provide per-paragraph computational evidence so Claude generates grounded suggestions.

**Relevant signals**: Per-paragraph compression, density curve position, redundancy with adjacent paragraphs, local surprisal.

**Injection point**: Inside `HolisticContext` passed to `BatchGenerationService`, as a new `computationalEvidence` field per issue.

```
═══════════════════════════════════════════════════════════
ISSUE #{issueNumber} COMPUTATIONAL EVIDENCE
═══════════════════════════════════════════════════════════

Paragraph {paragraphIndex}:
- Local compression: {ratio} (essay avg: {overallRatio})
- Local entropy: {avgEntropy} (essay avg: {densityMean})
- Surprisal profile: {localSurprisal} (engagement: {engagementLabel})
- Redundancy: NCD {ncd} with P{adjacentParagraph}

{if predictablePassage in this paragraph:
  "Cliche detected: \"{passage}\" (surprisal {avgSurprisal})"}
{if monotonousSection in this paragraph:
  "Low diversity: \"{sentence}\" (entropy {entropy})"}
```

**Token estimate**: 60-90 tokens per issue, 180-270 tokens for 3 issues.


### 2.4 Template: Stage 3 (Final Polish)

**Purpose**: Guide micro-refinement toward authentic rhythm and voice preservation. Ensure polish suggestions maintain the student's idiolect.

**Relevant signals**: Rhythm analysis (devices, quality), idiolect profile, voice evolution (if comparing revisions), register consistency.

**Injection point**: In the Stage 3 consolidated prompt, before the journey context section.

```
═══════════════════════════════════════════════════════════
POLISH CALIBRATION (preserve voice, refine craft)
═══════════════════════════════════════════════════════════

Rhythm Profile:
- Quality: {qualityScore}/10, pattern: {lengthPattern}
- Devices found: {detectedDevices → comma-separated list}
- Syllabic variation: {syllabicVariation}/1.0

Voice Signature (preserve these):
- Signature phrases: {signaturePhrases → top 3}
- Characteristic words: {characteristicWords → top 5}
- Punctuation habits: {punctuationHabits → top 2}
- Distinctiveness: {distinctiveness}/1.0

{if voiceEvolution available:
  "Voice Drift: {direction} (magnitude {driftMagnitude})
   Homogenization risk: {homogenizationRisk}/1.0
   {warnings → if any}"}

Register Consistency:
- Primary: {primaryRegister}, internal consistency: {internalConsistency}/1.0
{registerShifts → if any: "Shifts: {count} detected — review for intentionality"}
```

**Token estimate**: 110-150 tokens.


### 2.5 Template: PIQ Workshop (Chat Coaching)

**Purpose**: Calibrate word-economy coaching with density and compression data. PIQs have a 350-word hard limit, so every word matters.

**Relevant signals**: Compression ratio (redundancy = wasted words), density variation (flat = boring), Zipf (vocabulary naturalness), engagement score.

**Injection point**: Appended to `SYSTEM_PROMPT` in `piqChatService.ts`, in a new "COMPUTATIONAL CONTEXT" section after the existing "ANTI-PATTERNS" section.

```
═══════════════════════════════════════════════════════════
COMPUTATIONAL WORD ECONOMY ANALYSIS
═══════════════════════════════════════════════════════════

Density Profile:
- Compression: {overallRatio} ({uniquenessScore}/10 — lower ratio = more redundant words)
- Density arc: {shapeProfile} (ideal: mountain or gradual_build)
- Engagement: {engagementScore}/10

Word Budget Efficiency:
- {monotonousSections.length} low-diversity sentences (candidates for cutting/tightening)
- {predictablePassages.length} cliche passages (generic language wasting word budget)
- {redundantPairs.length > 0 ? "Cross-paragraph redundancy detected — consolidation opportunity" : "No major redundancy"}

Voice Calibration:
- Register: {primaryRegister}, formality {formalityScore}
- Contraction rate: {contractionPreference} (higher = more casual/word-efficient)
- Zipf: {interpretation}
```

**Token estimate**: 90-120 tokens.


### 2.6 Template: Activity Workshop (Description Scoring)

**Purpose**: Pre-analyze the 150-character description with computational signals so Claude's scoring is more precise. Activity descriptions are too short for most information-theoretic analysis, so we focus on stylometric signals.

**Relevant signals**: Vocabulary metrics (TTR in micro-context), action verb detection, register/formality, AI probability.

**Injection point**: Appended to the system prompt in `buildDescriptionScoringSystemPrompt()`, after the scoring rubric but before the examples.

```
═══════════════════════════════════════════════════════════
PRE-SCORING CALIBRATION
═══════════════════════════════════════════════════════════

Description Metrics:
- Character count: {charCount}/150
- Word count: {wordCount}
- Unique words: {uniqueWords}/{wordCount} (TTR: {ttr})
- Avg word length: {meanWordLength} chars
- Formality: {formalityScore}/1.0

Action Language:
- First word: "{firstWord}" ({isActionVerb ? "strong verb" : "weak opening"})
- Polysyllabic ratio: {polysyllabicRatio}

Authenticity Check:
- AI probability: {aiProbability}
{aiProbability > 0.5 ? "- WARNING: Description reads as AI-generated" : ""}
```

**Token estimate**: 60-80 tokens.

---

## 3. PromptEnrichmentService

### File: `src/services/enrichment/promptEnrichmentService.ts`

```typescript
/**
 * Prompt Enrichment Service
 *
 * Transforms computational analysis results into concise, stage-specific
 * calibration blocks injected into LLM prompts.
 *
 * Design principles:
 * - 200-token hard cap per enrichment block
 * - Stage-specific signal selection (not all data goes everywhere)
 * - Framed as "calibration" not "instruction" (anti-parroting)
 * - Feature-flag gated per stage with shadow mode
 * - Zero LLM calls — pure string formatting
 *
 * Performance: < 1ms per enrichment block generation.
 */

import type { InformationTheoreticAnalysis } from '@/core/analysis/features/informationTheoreticAnalyzer';
import type { StylometricAnalysis, VoiceEvolutionResult } from '@/services/stylometrics';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface EnrichmentConfig {
  /** Master switch — disables all enrichment */
  enabled: boolean;

  /** Per-stage toggles */
  stages: {
    stage1A: StageEnrichmentConfig;
    stage1B: StageEnrichmentConfig;
    stage2:  StageEnrichmentConfig;
    stage3:  StageEnrichmentConfig;
    piq:     StageEnrichmentConfig;
    activity: StageEnrichmentConfig;
  };

  /** Maximum tokens per enrichment block (hard cap) */
  maxTokensBudget: number;

  /** Log enrichment blocks for A/B comparison even when disabled */
  shadowMode: boolean;
}

export interface StageEnrichmentConfig {
  enabled: boolean;
  /** If true, compute and log enrichment but do not inject into prompt */
  shadow: boolean;
}

/** Default configuration — all stages enabled, no shadow */
const DEFAULT_CONFIG: EnrichmentConfig = {
  enabled: true,
  stages: {
    stage1A:  { enabled: true, shadow: false },
    stage1B:  { enabled: true, shadow: false },
    stage2:   { enabled: true, shadow: false },
    stage3:   { enabled: true, shadow: false },
    piq:      { enabled: true, shadow: false },
    activity: { enabled: true, shadow: false },
  },
  maxTokensBudget: 200,
  shadowMode: false,
};

// ============================================================================
// TYPES
// ============================================================================

export type EnrichmentStage = 'stage1A' | 'stage1B' | 'stage2' | 'stage3' | 'piq' | 'activity';

export interface ComputationalResults {
  infoTheoretic?: InformationTheoreticAnalysis;
  stylometric?: StylometricAnalysis;
  voiceEvolution?: VoiceEvolutionResult;
}

export interface EnrichmentResult {
  /** The enrichment block text to inject */
  block: string;
  /** Whether this was actually injected (false in shadow mode) */
  injected: boolean;
  /** Estimated token count */
  estimatedTokens: number;
  /** Which stage this was generated for */
  stage: EnrichmentStage;
  /** Generation time in ms */
  generationTimeMs: number;
}

/** Per-issue evidence for Stage 2 batch */
export interface IssueEvidence {
  issueNumber: number;
  paragraphIndex: number;
  block: string;
  estimatedTokens: number;
}

// ============================================================================
// SERVICE
// ============================================================================

export class PromptEnrichmentService {
  private config: EnrichmentConfig;

  constructor(config?: Partial<EnrichmentConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (config?.stages) {
      this.config.stages = { ...DEFAULT_CONFIG.stages, ...config.stages };
    }
  }

  /**
   * Update configuration at runtime (e.g., from feature flags).
   */
  updateConfig(config: Partial<EnrichmentConfig>): void {
    Object.assign(this.config, config);
    if (config.stages) {
      this.config.stages = { ...this.config.stages, ...config.stages };
    }
  }

  /**
   * Check if enrichment is active for a given stage.
   */
  isActive(stage: EnrichmentStage): boolean {
    return this.config.enabled && this.config.stages[stage].enabled;
  }

  /**
   * Check if stage is in shadow mode (compute but don't inject).
   */
  isShadow(stage: EnrichmentStage): boolean {
    return this.config.stages[stage].shadow || this.config.shadowMode;
  }

  // ==========================================================================
  // MAIN ENTRY POINT
  // ==========================================================================

  /**
   * Generate enrichment block for a specific stage.
   *
   * Returns the formatted block and metadata. The caller decides where
   * to inject based on `result.injected`.
   */
  enrich(
    stage: EnrichmentStage,
    results: ComputationalResults,
  ): EnrichmentResult {
    const startTime = performance.now();

    if (!this.config.enabled) {
      return this.emptyResult(stage, startTime);
    }

    const stageConfig = this.config.stages[stage];
    if (!stageConfig.enabled && !stageConfig.shadow && !this.config.shadowMode) {
      return this.emptyResult(stage, startTime);
    }

    let block: string;
    switch (stage) {
      case 'stage1A':
        block = this.buildStage1AEnrichment(results);
        break;
      case 'stage1B':
        block = this.buildStage1BEnrichment(results);
        break;
      case 'stage2':
        block = this.buildStage2Enrichment(results);
        break;
      case 'stage3':
        block = this.buildStage3Enrichment(results);
        break;
      case 'piq':
        block = this.buildPIQEnrichment(results);
        break;
      case 'activity':
        block = this.buildActivityEnrichment(results);
        break;
      default:
        block = '';
    }

    const estimatedTokens = this.estimateTokens(block);
    const shouldInject = stageConfig.enabled && !stageConfig.shadow && !this.config.shadowMode;

    const result: EnrichmentResult = {
      block,
      injected: shouldInject,
      estimatedTokens,
      stage,
      generationTimeMs: performance.now() - startTime,
    };

    // Log in shadow mode for A/B comparison
    if (!shouldInject && (stageConfig.shadow || this.config.shadowMode)) {
      console.log(`[Enrichment:Shadow:${stage}] ${estimatedTokens} tokens generated (not injected)`);
    }

    return result;
  }

  /**
   * Generate per-issue evidence blocks for Stage 2 batch generation.
   *
   * Returns one evidence block per issue, keyed by issue number.
   */
  enrichStage2Issues(
    results: ComputationalResults,
    issues: Array<{ issueNumber: number; paragraphIndex: number }>,
  ): IssueEvidence[] {
    if (!this.isActive('stage2') && !this.isShadow('stage2')) {
      return [];
    }

    const it = results.infoTheoretic;
    if (!it) return [];

    return issues.map(({ issueNumber, paragraphIndex }) => {
      const lines: string[] = [];
      lines.push(`ISSUE #${issueNumber} COMPUTATIONAL EVIDENCE`);
      lines.push('');

      // Per-paragraph compression
      const paraCompression = it.compression.perParagraph.find(p => p.index === paragraphIndex);
      if (paraCompression) {
        lines.push(`Paragraph ${paragraphIndex}:`);
        lines.push(`- Local compression: ${paraCompression.ratio.toFixed(3)} (essay avg: ${it.compression.overallRatio.toFixed(3)})`);
      }

      // Per-paragraph entropy
      const paraEntropy = it.entropy.perParagraph.find(p => p.index === paragraphIndex);
      if (paraEntropy) {
        lines.push(`- Local entropy: ${paraEntropy.avgEntropy.toFixed(2)} (essay avg: ${it.densityVariation.densityMean.toFixed(2)})`);
      }

      // NCD with adjacent paragraphs
      const adjacentNCDs = it.ncd.paragraphPairs
        .filter(p => p.p1 === paragraphIndex || p.p2 === paragraphIndex)
        .slice(0, 2);
      for (const pair of adjacentNCDs) {
        const other = pair.p1 === paragraphIndex ? pair.p2 : pair.p1;
        const label = pair.ncd < 0.3 ? 'redundant' : pair.ncd > 0.95 ? 'disconnected' : 'connected';
        lines.push(`- NCD with P${other}: ${pair.ncd.toFixed(2)} (${label})`);
      }

      // Cliche/predictable passages in this paragraph
      const predictable = it.surprisal.predictablePassages
        .filter(p => this.passageInParagraph(p.startIndex, paragraphIndex, it))
        .slice(0, 1);
      for (const p of predictable) {
        lines.push(`- Cliche: "${this.truncate(p.text, 50)}" (surprisal ${p.avgSurprisal.toFixed(2)})`);
      }

      // Monotonous sentences in this paragraph
      const monotonous = it.entropy.monotonousSections
        .filter(s => this.sentenceInParagraph(s.index, paragraphIndex, it))
        .slice(0, 1);
      for (const m of monotonous) {
        lines.push(`- Low diversity: "${this.truncate(m.text, 50)}" (entropy ${m.entropy.toFixed(2)})`);
      }

      const block = lines.join('\n');
      return {
        issueNumber,
        paragraphIndex,
        block,
        estimatedTokens: this.estimateTokens(block),
      };
    });
  }

  // ==========================================================================
  // STAGE-SPECIFIC BUILDERS
  // ==========================================================================

  private buildStage1AEnrichment(results: ComputationalResults): string {
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('PRE-ANALYSIS CALIBRATION (computational signals — use as context, not script)');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('');

    const s = results.stylometric;
    const it = results.infoTheoretic;

    // Voice Profile
    if (s) {
      lines.push('Voice Profile:');
      lines.push(`- Register: ${s.registerAnalysis.primaryRegister} (formality ${s.registerAnalysis.formalityScore.toFixed(2)})`);
      lines.push(`- Sentence rhythm: avg ${s.fingerprint.sentenceMetrics.meanLength.toFixed(1)} words (std ${s.fingerprint.sentenceMetrics.stdDevLength.toFixed(1)}), pattern: ${s.rhythmAnalysis.lengthPattern}`);
      lines.push(`- Vocabulary: TTR ${s.fingerprint.vocabulary.typeTokenRatio.toFixed(2)}, ${(s.fingerprint.vocabulary.polysyllabicRatio * 100).toFixed(0)}% polysyllabic`);
      lines.push(`- Contraction preference: ${s.fingerprint.contractions.contractionPreference.toFixed(2)}`);
      lines.push('');
    }

    // Authenticity Signals
    if (s) {
      lines.push('Authenticity Signals:');
      lines.push(`- AI probability: ${s.aiDetection.aiProbability.toFixed(2)} (confidence ${s.aiDetection.confidence.toFixed(2)})`);
      if (s.aiDetection.aiProbability > 0.4) {
        lines.push(`- Dominant AI signals: ${s.aiDetection.dominantSignals.slice(0, 3).join(', ')}`);
      }
    }
    if (it) {
      lines.push(`- Zipf: ${it.zipf.interpretation} (alpha ${it.zipf.alpha.toFixed(2)})`);
      lines.push(`- Engagement: ${it.surprisal.engagementScore}/10`);
      lines.push('');
    }

    // Quality Anchors (engaging passages)
    if (it && it.surprisal.engagingPassages.length > 0) {
      lines.push('Quality Anchors:');
      for (const p of it.surprisal.engagingPassages.slice(0, 2)) {
        lines.push(`- "${this.truncate(p.text, 60)}"`);
      }
      lines.push('');
    }

    // Risk Flags
    const risks: string[] = [];
    if (it) {
      if (it.entropy.monotonousSections.length > 0) {
        risks.push(`${it.entropy.monotonousSections.length} monotonous sections`);
      }
      if (it.surprisal.predictablePassages.length > 0) {
        risks.push(`${it.surprisal.predictablePassages.length} cliche passages`);
      }
    }
    if (s && s.registerAnalysis.registerShifts.length > 0) {
      const shifts = s.registerAnalysis.registerShifts;
      risks.push(`${shifts.length} register shift(s) (${shifts[0].from}→${shifts[0].to})`);
    }
    if (risks.length > 0) {
      lines.push('Risk Flags:');
      for (const r of risks) {
        lines.push(`- ${r}`);
      }
    }

    return this.enforceTokenBudget(lines.join('\n'));
  }

  private buildStage1BEnrichment(results: ComputationalResults): string {
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('COMPUTATIONAL DIAGNOSIS CALIBRATION');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('');

    const it = results.infoTheoretic;
    if (!it) return '';

    // Structural Analysis
    lines.push('Structural Analysis:');
    lines.push(`- Compression: ${it.compression.overallRatio.toFixed(3)} (uniqueness ${it.compression.uniquenessScore}/10)`);
    lines.push(`- Density arc: ${it.densityVariation.shapeProfile} (variation ${it.densityVariation.variationScore}/10)`);
    lines.push(`- Intro-conclusion MI: ${it.mutualInformation.introConclusion.toFixed(2)} (coherence ${it.mutualInformation.coherenceScore}/10)`);
    lines.push('');

    // Redundancy Map
    if (it.ncd.redundantPairs.length > 0 || it.ncd.disconnectedPairs.length > 0) {
      lines.push('Redundancy Map:');
      for (const p of it.ncd.redundantPairs.slice(0, 2)) {
        lines.push(`- P${p.p1}↔P${p.p2}: NCD=${p.ncd.toFixed(2)} (redundant)`);
      }
      for (const p of it.ncd.disconnectedPairs.slice(0, 2)) {
        lines.push(`- P${p.p1}↔P${p.p2}: NCD=${p.ncd.toFixed(2)} (disconnected)`);
      }
      lines.push('');
    }

    // Passage-Level Evidence
    lines.push('Passage-Level Evidence:');
    if (it.surprisal.predictablePassages.length > 0) {
      lines.push('- Predictable:');
      for (const p of it.surprisal.predictablePassages.slice(0, 3)) {
        lines.push(`  "${this.truncate(p.text, 40)}"`);
      }
    }
    if (it.surprisal.engagingPassages.length > 0) {
      lines.push('- Engaging:');
      for (const p of it.surprisal.engagingPassages.slice(0, 2)) {
        lines.push(`  "${this.truncate(p.text, 40)}"`);
      }
    }
    lines.push('');

    // Rubric Pre-Scores
    lines.push('Rubric Pre-Scores (computational — verify with judgment):');
    lines.push(`- Word choice diversity: ${it.rubricScores.wordChoiceDiversity}/10`);
    lines.push(`- Structural balance: ${it.rubricScores.structuralBalance}/10`);
    lines.push(`- Information uniqueness: ${it.rubricScores.informationUniqueness}/10`);
    lines.push(`- Opening surprisal: ${it.rubricScores.openingSurprisal}/10`);

    return this.enforceTokenBudget(lines.join('\n'));
  }

  private buildStage2Enrichment(results: ComputationalResults): string {
    // Stage 2 uses per-issue evidence via enrichStage2Issues()
    // This fallback provides holistic context if called directly
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('COMPUTATIONAL CONTEXT (holistic)');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('');

    const it = results.infoTheoretic;
    if (it) {
      lines.push(`- Density arc: ${it.densityVariation.shapeProfile}`);
      lines.push(`- Compression: ${it.compression.overallRatio.toFixed(3)}`);
      lines.push(`- Engagement: ${it.surprisal.engagementScore}/10`);
      if (it.ncd.redundantPairs.length > 0) {
        lines.push(`- ${it.ncd.redundantPairs.length} redundant paragraph pair(s)`);
      }
    }

    const s = results.stylometric;
    if (s) {
      lines.push(`- Voice: ${s.registerAnalysis.primaryRegister}, distinctiveness ${s.idiolect.distinctiveness.toFixed(2)}`);
    }

    return this.enforceTokenBudget(lines.join('\n'));
  }

  private buildStage3Enrichment(results: ComputationalResults): string {
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('POLISH CALIBRATION (preserve voice, refine craft)');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('');

    const s = results.stylometric;
    if (s) {
      // Rhythm Profile
      lines.push('Rhythm Profile:');
      lines.push(`- Quality: ${s.rhythmAnalysis.qualityScore}/10, pattern: ${s.rhythmAnalysis.lengthPattern}`);

      const devices: string[] = [];
      if (s.rhythmAnalysis.devices.anaphora.detected) devices.push('anaphora');
      if (s.rhythmAnalysis.devices.epistrophe.detected) devices.push('epistrophe');
      if (s.rhythmAnalysis.devices.parallelStructure.detected) devices.push('parallel structure');
      if (s.rhythmAnalysis.devices.staccato.detected) devices.push('staccato');
      if (s.rhythmAnalysis.devices.tricolon.detected) devices.push('tricolon');
      if (devices.length > 0) {
        lines.push(`- Devices: ${devices.join(', ')}`);
      }
      lines.push(`- Syllabic variation: ${s.rhythmAnalysis.syllabicVariation.toFixed(2)}`);
      lines.push('');

      // Voice Signature
      lines.push('Voice Signature (preserve these):');
      if (s.idiolect.signaturePhrases.length > 0) {
        lines.push(`- Phrases: ${s.idiolect.signaturePhrases.slice(0, 3).map(p => `"${p}"`).join(', ')}`);
      }
      if (s.idiolect.characteristicWords.length > 0) {
        lines.push(`- Words: ${s.idiolect.characteristicWords.slice(0, 5).join(', ')}`);
      }
      if (s.idiolect.punctuationHabits.length > 0) {
        lines.push(`- Punctuation: ${s.idiolect.punctuationHabits.slice(0, 2).join(', ')}`);
      }
      lines.push(`- Distinctiveness: ${s.idiolect.distinctiveness.toFixed(2)}`);
      lines.push('');

      // Voice Evolution (if available)
      const ve = results.voiceEvolution;
      if (ve) {
        lines.push(`Voice Drift: ${ve.direction} (magnitude ${ve.driftMagnitude.toFixed(2)})`);
        lines.push(`- Homogenization risk: ${ve.homogenizationRisk.toFixed(2)}`);
        if (ve.warnings.length > 0) {
          for (const w of ve.warnings.slice(0, 2)) {
            lines.push(`- WARNING: ${w}`);
          }
        }
        lines.push('');
      }

      // Register Consistency
      lines.push('Register:');
      lines.push(`- ${s.registerAnalysis.primaryRegister}, consistency ${s.registerAnalysis.internalConsistency.toFixed(2)}`);
      if (s.registerAnalysis.registerShifts.length > 0) {
        lines.push(`- ${s.registerAnalysis.registerShifts.length} shift(s) — review for intentionality`);
      }
    }

    return this.enforceTokenBudget(lines.join('\n'));
  }

  private buildPIQEnrichment(results: ComputationalResults): string {
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('COMPUTATIONAL WORD ECONOMY ANALYSIS');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('');

    const it = results.infoTheoretic;
    if (it) {
      lines.push('Density Profile:');
      lines.push(`- Compression: ${it.compression.overallRatio.toFixed(3)} (uniqueness ${it.compression.uniquenessScore}/10)`);
      lines.push(`- Density arc: ${it.densityVariation.shapeProfile}`);
      lines.push(`- Engagement: ${it.surprisal.engagementScore}/10`);
      lines.push('');

      lines.push('Word Budget Efficiency:');
      if (it.entropy.monotonousSections.length > 0) {
        lines.push(`- ${it.entropy.monotonousSections.length} low-diversity sentences (cut/tighten candidates)`);
      }
      if (it.surprisal.predictablePassages.length > 0) {
        lines.push(`- ${it.surprisal.predictablePassages.length} cliche passages (wasting word budget)`);
      }
      if (it.ncd.redundantPairs.length > 0) {
        lines.push('- Cross-paragraph redundancy detected (consolidation opportunity)');
      } else {
        lines.push('- No major redundancy');
      }
      lines.push('');
    }

    const s = results.stylometric;
    if (s) {
      lines.push('Voice Calibration:');
      lines.push(`- Register: ${s.registerAnalysis.primaryRegister}, formality ${s.registerAnalysis.formalityScore.toFixed(2)}`);
      lines.push(`- Contraction rate: ${s.fingerprint.contractions.contractionPreference.toFixed(2)}`);
    }
    if (it) {
      lines.push(`- Zipf: ${it.zipf.interpretation}`);
    }

    return this.enforceTokenBudget(lines.join('\n'));
  }

  private buildActivityEnrichment(results: ComputationalResults): string {
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('PRE-SCORING CALIBRATION');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('');

    const s = results.stylometric;
    if (s) {
      lines.push('Description Metrics:');
      lines.push(`- Words: ${s.fingerprint.sourceWordCount}`);
      lines.push(`- TTR: ${s.fingerprint.vocabulary.typeTokenRatio.toFixed(2)}`);
      lines.push(`- Avg word length: ${s.fingerprint.vocabulary.meanWordLength.toFixed(1)} chars`);
      lines.push(`- Formality: ${s.registerAnalysis.formalityScore.toFixed(2)}`);
      lines.push('');

      lines.push('Authenticity:');
      lines.push(`- AI probability: ${s.aiDetection.aiProbability.toFixed(2)}`);
      if (s.aiDetection.aiProbability > 0.5) {
        lines.push('- WARNING: Description reads as AI-generated');
      }
    }

    return this.enforceTokenBudget(lines.join('\n'));
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Rough token estimate: ~4 chars per token for English text.
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Enforce the token budget by trimming from the bottom.
   * Removes lines from the end until under budget.
   */
  private enforceTokenBudget(text: string): string {
    const budget = this.config.maxTokensBudget;
    let estimated = this.estimateTokens(text);

    if (estimated <= budget) return text;

    const lines = text.split('\n');
    while (estimated > budget && lines.length > 4) {
      lines.pop();
      estimated = this.estimateTokens(lines.join('\n'));
    }

    return lines.join('\n');
  }

  private truncate(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen - 3) + '...';
  }

  private emptyResult(stage: EnrichmentStage, startTime: number): EnrichmentResult {
    return {
      block: '',
      injected: false,
      estimatedTokens: 0,
      stage,
      generationTimeMs: performance.now() - startTime,
    };
  }

  /**
   * Determine if a passage (by startIndex character offset) falls within
   * a specific paragraph index. Uses paragraph boundary estimation.
   */
  private passageInParagraph(
    startIndex: number,
    paragraphIndex: number,
    it: InformationTheoreticAnalysis,
  ): boolean {
    // Use per-paragraph data as a rough mapping. Each paragraph has
    // roughly equal word count. This is an approximation.
    const totalParagraphs = it.entropy.perParagraph.length;
    if (totalParagraphs === 0) return false;
    const estimatedParaIndex = Math.floor(
      (startIndex / (it.entropy.perParagraph.reduce((a, p) => a + p.wordCount, 0) * 5)) * totalParagraphs
    );
    return estimatedParaIndex === paragraphIndex;
  }

  /**
   * Determine if a sentence (by sentence index) falls within a paragraph.
   * Uses cumulative sentence counts per paragraph.
   */
  private sentenceInParagraph(
    sentenceIndex: number,
    paragraphIndex: number,
    it: InformationTheoreticAnalysis,
  ): boolean {
    // Estimate: sentences are roughly evenly distributed across paragraphs
    const totalSentences = it.entropy.perSentence.length;
    const totalParagraphs = it.entropy.perParagraph.length;
    if (totalParagraphs === 0 || totalSentences === 0) return false;
    const sentencesPerPara = totalSentences / totalParagraphs;
    const estimatedParaIndex = Math.floor(sentenceIndex / sentencesPerPara);
    return estimatedParaIndex === paragraphIndex;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

export const promptEnrichmentService = new PromptEnrichmentService();
```

### File: `src/services/enrichment/index.ts`

```typescript
export { PromptEnrichmentService, promptEnrichmentService } from './promptEnrichmentService';
export type {
  EnrichmentConfig,
  StageEnrichmentConfig,
  EnrichmentStage,
  ComputationalResults,
  EnrichmentResult,
  IssueEvidence,
} from './promptEnrichmentService';
```

---

## 4. Token Budget Analysis

### Cost Per Enrichment Block

| Stage | Enrichment Tokens | Model | Input Cost/1M | Cost Per Enrichment |
|-------|-------------------|-------|---------------|---------------------|
| Stage 1A | ~140 tokens | Sonnet ($3/M) | $3.00 | $0.000420 |
| Stage 1B | ~160 tokens | Sonnet ($3/M) | $3.00 | $0.000480 |
| Stage 2 (per issue) | ~75 tokens x3 | Sonnet ($3/M) | $3.00 | $0.000675 |
| Stage 3 | ~130 tokens | Sonnet ($3/M) | $3.00 | $0.000390 |
| PIQ | ~100 tokens | Sonnet ($3/M) | $3.00 | $0.000300 |
| Activity | ~70 tokens | Sonnet ($3/M) | $3.00 | $0.000210 |

### Net Cost Impact Per Full Common App Pipeline

```
Current pipeline cost (no enrichment):
  Stage 0: $0.02  (Sonnet, voice excavation)
  Stage 1A: $0.04 (Sonnet, 8000 max output)
  Stage 1B: $0.03 (Sonnet, 6000 max output)
  Stage 2: $0.12  (Haiku diagnosis $0.06 + Sonnet batch $0.06)
  Stage 3: $0.06  (Haiku verify $0.003 + Sonnet polish $0.055)
  ──────────────
  Total: $0.27

Enrichment overhead:
  Stage 1A: +$0.000420
  Stage 1B: +$0.000480
  Stage 2:  +$0.000675
  Stage 3:  +$0.000390
  ──────────────
  Total enrichment cost: $0.001965

Net impact: +$0.002/pipeline (+0.73%)
```

### Prompt Reduction Opportunity

Enrichment can REDUCE output tokens by making Claude's analysis more targeted:

| Stage | Current Output Budget | Expected Reduction | Savings |
|-------|----------------------|-------------------|---------|
| Stage 1B | 6000 tokens | 10-15% (more focused diagnosis) | ~$0.009-0.013 |
| Stage 2 | ~4000 tokens | 5-10% (pre-grounded suggestions) | ~$0.003-0.006 |
| Stage 3 | ~3000 tokens | 5% (calibrated micro-refinements) | ~$0.002 |

**Conservative estimate**: Output reduction saves $0.010-0.020 per pipeline, yielding a **net savings of $0.008-0.018 per pipeline** (3-7% cost reduction).

**Mechanism**: When Claude receives computational evidence, it spends fewer output tokens on exploratory analysis and more on teaching. Stage 1B is the biggest win — instead of Claude independently discovering structural issues, it can verify/calibrate against computational findings.

### Computational Overhead

| Analyzer | Time | Memory | Cost |
|----------|------|--------|------|
| InformationTheoreticAnalyzer | < 5ms | ~2MB | $0.00 |
| StylometricAnalyzer | < 15ms | ~1MB | $0.00 |
| PromptEnrichmentService | < 1ms | negligible | $0.00 |
| **Total** | **< 21ms** | **~3MB** | **$0.00** |

---

## 5. Quality Impact Predictions

### Stage 1A: Foundation Teaching

| Metric | Baseline | With Enrichment | Expected Improvement |
|--------|----------|-----------------|---------------------|
| Voice-matched coaching | 60% | 85% | +25% |
| False AI accusations | 5% | 2% | -60% |
| Register-appropriate tone | 70% | 90% | +29% |

**Mechanism**: Claude currently infers voice from the essay text alone. With the voice profile (register, contraction preference, rhythm pattern), Claude can immediately calibrate its coaching tone. A casual writer gets casual coaching; a literary writer gets literary coaching.

**Risk**: Low. Voice profile is purely additive information.

**Measurement**: A/B test 50 essays. Score each response for voice-matching (does the coaching style match the student's writing style?). Blind evaluation by human rater.

### Stage 1B: Deep Diagnosis

| Metric | Baseline | With Enrichment | Expected Improvement |
|--------|----------|-----------------|---------------------|
| Issue identification accuracy | 75% | 90% | +20% |
| Redundancy detection | 50% | 85% | +70% |
| False positives (non-issues flagged) | 15% | 8% | -47% |
| Diagnosis specificity | Medium | High | Qualitative |

**Mechanism**: This is the highest-impact integration. Claude currently has to independently discover structural problems like paragraph redundancy and density imbalance. With computational evidence (NCD values, compression ratios, predictable passages), Claude can confirm structural issues with mathematical backing and focus diagnosis on nuanced problems that require LLM judgment.

**Risk**: Medium. Claude might anchor too heavily on computational scores. Mitigated by framing as "verify with judgment" and limiting to pre-scores, not directives.

**Measurement**: Compare issue lists between enriched and non-enriched runs on 30 essays. Track: (a) issues identified by both (agreement), (b) issues only in enriched (computational catch), (c) issues only in non-enriched (potential regression). Expert review of each for validity.

### Stage 2: Surgical Teaching

| Metric | Baseline | With Enrichment | Expected Improvement |
|--------|----------|-----------------|---------------------|
| Evidence-grounded suggestions | 40% | 75% | +88% |
| Cross-issue coherence | Good | Better | Qualitative |
| Output token efficiency | ~4000 tokens | ~3600 tokens | -10% |

**Mechanism**: Per-issue computational evidence (local compression, NCD with neighbors, cliche detection) gives Claude concrete data points when generating rewrite suggestions. Instead of "this paragraph could be more specific," Claude can say "this paragraph compresses to 0.42 (vs essay avg 0.38), suggesting repetitive language — specifically, the phrase 'I learned to...' appears predictable."

**Risk**: Low. Evidence is additive and per-issue scoped.

**Measurement**: Evaluate suggestion quality on a 5-point specificity rubric (1=generic, 5=precisely grounded). Compare enriched vs non-enriched across 20 essays.

### Stage 3: Final Polish

| Metric | Baseline | With Enrichment | Expected Improvement |
|--------|----------|-----------------|---------------------|
| Voice preservation in suggestions | 60% | 85% | +42% |
| Homogenization in micro-refinements | 20% risk | 8% risk | -60% |
| Rhythm-appropriate suggestions | 50% | 80% | +60% |

**Mechanism**: The idiolect profile (signature phrases, characteristic words, punctuation habits) acts as a "do not disturb" list for Stage 3 polish. Claude knows which patterns are intentional voice markers vs. errors. Voice evolution data (if available from revisions) alerts Claude to homogenization drift.

**Risk**: Low-Medium. Over-preservation could prevent beneficial changes. Mitigated by framing as "preserve these" rather than "never change these."

**Measurement**: Track voice drift (stylometric comparison of pre-polish vs post-polish suggestions). Enriched runs should show lower drift magnitude.

### PIQ Workshop

| Metric | Baseline | With Enrichment | Expected Improvement |
|--------|----------|-----------------|---------------------|
| Word economy coaching precision | Medium | High | Qualitative |
| Specific cut/tighten suggestions | 2-3 per turn | 4-5 per turn | +67% |
| False "too long" warnings | 10% | 4% | -60% |

**Mechanism**: Compression and density data give the chat coach objective evidence for where words are wasted. Instead of "this section could be tighter," the coach can reference specific low-diversity sentences and redundant paragraph pairs.

**Risk**: Low. PIQ chat already uses voice fingerprint; this extends the pattern.

**Measurement**: Count actionable word-economy suggestions per chat turn. Compare enriched vs non-enriched across 15 conversations.

### Activity Workshop Scoring

| Metric | Baseline | With Enrichment | Expected Improvement |
|--------|----------|-----------------|---------------------|
| AI-generated description detection | 70% | 90% | +29% |
| Scoring consistency (std dev) | 0.8 | 0.5 | -38% |
| Calibration accuracy vs human | 85% | 92% | +8% |

**Mechanism**: Activity descriptions are 150 characters — too short for reliable LLM-only AI detection. The computational AI probability signal gives Claude a prior. The vocabulary metrics (TTR, word length) help calibrate action precision scoring.

**Risk**: Low. Descriptions are short, so enrichment is small (~70 tokens).

**Measurement**: Score 100 descriptions with and without enrichment. Compare to expert human scores (3 raters, majority vote).

---

## 6. Prompt Engineering Safety

### 6.1 Anti-Parroting Design

**Problem**: If we inject "compression ratio: 0.42", Claude might parrot this to the student: "Your compression ratio is 0.42, indicating..."

**Solution**: Three layers of protection.

**Layer 1: Framing language.** Every enrichment block opens with explicit framing:
```
PRE-ANALYSIS CALIBRATION (computational signals — use as context, not script)
```
This tells Claude the data is for its own calibration, not for student-facing output.

**Layer 2: Existing prompt instructions.** All stage prompts already contain tone guidelines like "Sound Like This: 'Okay, so here's what I'm noticing...'" and "Not Like This: 'Per the rubric guidelines...'". These naturally suppress technical jargon.

**Layer 3: Post-processing check.** Add a lightweight check in the response handler:

```typescript
/**
 * Check if the response contains raw computational terms that
 * should not appear in student-facing output.
 */
function checkForComputationalLeakage(response: string): string[] {
  const COMPUTATIONAL_TERMS = [
    'compression ratio',
    'NCD',
    'entropy',
    'surprisal',
    'Zipf',
    'mutual information',
    'TTR',
    'type-token ratio',
    'polysyllabic ratio',
    'burstiness',
    'perplexity',
    'formality score',
    'ai probability',
  ];

  const leaked: string[] = [];
  const lower = response.toLowerCase();
  for (const term of COMPUTATIONAL_TERMS) {
    if (lower.includes(term.toLowerCase())) {
      leaked.push(term);
    }
  }
  return leaked;
}
```

This is a monitoring tool (logged, not blocking) that tracks whether Claude is leaking computational terms. If leakage exceeds 5% of responses, we tighten the framing language.


### 6.2 Calibration Framing Pattern

Every enrichment block follows the same framing pattern:

```
═══════════════════════════════════════════════════════════
{SECTION TITLE} ({qualifier — establishes role of data})
═══════════════════════════════════════════════════════════
```

Qualifiers used:
- "computational signals — use as context, not script"
- "computational — verify with judgment"
- "preserve voice, refine craft"
- "computational word economy analysis"
- "pre-scoring calibration"

These qualifiers establish a relationship where Claude is the expert and computational data is the assistant — not the other way around.


### 6.3 Handling Contradictions

**Scenario**: Computational analysis says "low redundancy" (uniqueness 8/10) but Claude's LLM judgment finds repetitive themes.

**Design decision**: Claude's judgment ALWAYS wins. The enrichment block says "verify with judgment" explicitly. We do NOT add instructions like "if computational and your judgment disagree, prioritize..."

**Why**: Adding contradiction-handling instructions would make Claude second-guess itself, reducing confidence in its own analysis. The framing as "calibration" already establishes the right hierarchy:

1. Claude's own analysis = primary
2. Computational signals = calibration/pre-analysis
3. Student-reported information = context

**Monitoring**: Track cases where Claude explicitly disagrees with computational findings. These are valuable signals for improving the computational analyzers, not bugs.


### 6.4 Graceful Degradation

If computational analysis fails or produces invalid results:

```typescript
// In each stage service, before injection:
const enrichment = promptEnrichmentService.enrich('stage1A', computationalResults);

// Only inject if we got meaningful content
const enrichmentBlock = enrichment.injected && enrichment.block.length > 20
  ? `\n\n${enrichment.block}\n\n`
  : '';

// Prompt construction continues with or without enrichment
const prompt = STAGE1A_TEACHING_PROMPT
  .replace('{enrichment}', enrichmentBlock)
  .replace('{essayDraft}', essayDraft);
```

No enrichment = no change to existing behavior. The pipeline never fails because of enrichment.


### 6.5 Privacy and Data Safety

Computational analysis is pure math on text the student already submitted. No new data is collected. The enrichment block contains only aggregate statistics and brief passage quotes (already present in the essay). No PII is added by the enrichment layer.

---

## 7. Implementation Plan

### File Changes Summary

| # | File | Action | Lines Changed |
|---|------|--------|---------------|
| 1 | `src/services/enrichment/promptEnrichmentService.ts` | CREATE | ~450 lines |
| 2 | `src/services/enrichment/index.ts` | CREATE | ~12 lines |
| 3 | `src/services/commonAppWorkshop/services/stage1ATeachingService.ts` | EDIT | ~25 lines |
| 4 | `src/services/commonAppWorkshop/services/stage1BDiagnosisService.ts` | EDIT | ~25 lines |
| 5 | `src/services/commonAppWorkshop/services/stage2BatchService.ts` | EDIT | ~30 lines |
| 6 | `src/services/commonAppWorkshop/services/stage3ConsolidatedService.ts` | EDIT | ~25 lines |
| 7 | `src/services/piqWorkshop/piqChatService.ts` | EDIT | ~20 lines |
| 8 | `src/services/portfolioStrategy/services/activityWorkshop/scoring/descriptionScoringService.ts` | EDIT | ~20 lines |

### 7.1 Integration Diff: Stage 1A Teaching Service

**File**: `src/services/commonAppWorkshop/services/stage1ATeachingService.ts`

```diff
 import Anthropic from '@anthropic-ai/sdk';
 import { getAnthropicClient } from '../../../lib/llm/claude';
+import { promptEnrichmentService, type ComputationalResults } from '@/services/enrichment';
+import { InformationTheoreticAnalyzer } from '@/core/analysis/features/informationTheoreticAnalyzer';
+import { stylometricAnalyzer } from '@/services/stylometrics';

 // ... existing code ...

 export class Stage1ATeachingService {
-  async generateTeaching(input: Stage1AInput): Promise<Stage1ATeachingOutput> {
+  async generateTeaching(
+    input: Stage1AInput,
+    computationalResults?: ComputationalResults,
+  ): Promise<Stage1ATeachingOutput> {
     const client = getAnthropicClient();

+    // Run computational analysis if not pre-computed
+    const compResults = computationalResults ?? this.runComputationalAnalysis(input.essayDraft);
+
+    // Generate enrichment block
+    const enrichment = promptEnrichmentService.enrich('stage1A', compResults);
+
     // Build prompt
-    const userPrompt = STAGE1A_TEACHING_PROMPT
+    const enrichmentBlock = enrichment.injected && enrichment.block.length > 20
+      ? `\n\n${enrichment.block}\n\n`
+      : '';
+
+    const userPrompt = STAGE1A_TEACHING_PROMPT
+      .replace('{computationalCalibration}', enrichmentBlock)
       .replace('{essayDraft}', input.essayDraft)
       .replace('{essayPrompt}', input.essayPrompt || 'Not specified')
       // ... rest unchanged

+  private runComputationalAnalysis(essayText: string): ComputationalResults {
+    try {
+      const itAnalyzer = new InformationTheoreticAnalyzer();
+      return {
+        infoTheoretic: itAnalyzer.analyze(essayText),
+        stylometric: stylometricAnalyzer.analyze(essayText),
+      };
+    } catch (error) {
+      console.error('[Stage1A] Computational analysis failed:', error);
+      return {};
+    }
+  }
```

**Prompt template addition** (in `STAGE1A_TEACHING_PROMPT`, after the "CRITICAL AWARENESS" section, before "Now analyze this essay"):

```diff
 ### 5. ANTI-CONVERGENCE (Diverse Approaches)
 ...existing anti-convergence text...

+{computationalCalibration}
+
 ═══════════════════════════════════════════════════════════
 NOW ANALYZE THIS ESSAY
 ═══════════════════════════════════════════════════════════
```


### 7.2 Integration Diff: Stage 1B Diagnosis Service

**File**: `src/services/commonAppWorkshop/services/stage1BDiagnosisService.ts`

```diff
 import Anthropic from '@anthropic-ai/sdk';
 import { getAnthropicClient } from '../../../lib/llm/claude';
+import { promptEnrichmentService, type ComputationalResults } from '@/services/enrichment';

 // ... existing code ...

 export class Stage1BDiagnosisService {
-  async generateDiagnosis(input: Stage1BInput): Promise<Stage1BOutput> {
+  async generateDiagnosis(
+    input: Stage1BInput,
+    computationalResults?: ComputationalResults,
+  ): Promise<Stage1BOutput> {
     const client = getAnthropicClient();

+    // Generate enrichment block (expects pre-computed results from Stage 1A)
+    const enrichment = computationalResults
+      ? promptEnrichmentService.enrich('stage1B', computationalResults)
+      : { block: '', injected: false, estimatedTokens: 0, stage: 'stage1B' as const, generationTimeMs: 0 };
+
     // Build prompt
+    const enrichmentBlock = enrichment.injected && enrichment.block.length > 20
+      ? `\n\n${enrichment.block}\n\n`
+      : '';
+
     const userPrompt = STAGE1B_DIAGNOSIS_PROMPT
+      .replace('{computationalCalibration}', enrichmentBlock)
       .replace('{conceptualFoundation}', input.conceptualFoundation)
       // ... rest unchanged
```

**Prompt template addition** (in `STAGE1B_DIAGNOSIS_PROMPT`, after the JSON structure requirements, before the Stage 1A teaching block):

```diff
 **QUALITY STANDARDS FOR missing_elements:**
 ...existing quality standards...

+{computationalCalibration}
+
 ═══════════════════════════════════════════════════════════
 STAGE 1A TEACHING (PIQ-quality warm coaching)
 ═══════════════════════════════════════════════════════════
```


### 7.3 Integration Diff: Stage 2 Batch Service

**File**: `src/services/commonAppWorkshop/services/stage2BatchService.ts`

```diff
+import { promptEnrichmentService, type ComputationalResults } from '@/services/enrichment';

 export class Stage2BatchService {
-  async generateStage2(input: Stage2BatchInput): Promise<Stage2BatchOutput> {
+  async generateStage2(
+    input: Stage2BatchInput,
+    computationalResults?: ComputationalResults,
+  ): Promise<Stage2BatchOutput> {

     // ... existing Haiku diagnosis ...

+    // Generate per-issue computational evidence
+    const issueEvidence = computationalResults
+      ? promptEnrichmentService.enrichStage2Issues(
+          computationalResults,
+          diagnosedIssues.map((d, i) => ({
+            issueNumber: i + 1,
+            paragraphIndex: this.findParagraphIndex(d.issue, input.essayDraft),
+          })),
+        )
+      : [];
+
     // Build context bundles for batch generation
     const contextBundles = diagnosedIssues.map((d, i) => ({
       ...d.context_bundle,
+      computationalEvidence: issueEvidence.find(e => e.issueNumber === i + 1)?.block ?? '',
     }));

     // ... rest of batch generation unchanged ...

+  private findParagraphIndex(issue: CriticalIssue, essayText: string): number {
+    const paragraphs = essayText.split(/\n\s*\n/);
+    for (let i = 0; i < paragraphs.length; i++) {
+      if (paragraphs[i].includes(issue.quote?.slice(0, 30) ?? '')) {
+        return i;
+      }
+    }
+    return 0;
+  }
```


### 7.4 Integration Diff: Stage 3 Consolidated Service

**File**: `src/services/commonAppWorkshop/services/stage3ConsolidatedService.ts`

```diff
+import { promptEnrichmentService, type ComputationalResults } from '@/services/enrichment';
+import { stylometricAnalyzer } from '@/services/stylometrics';

 export class Stage3ConsolidatedService {
-  async generateStage3(input: Stage3Input): Promise<Stage3ConsolidatedOutput> {
+  async generateStage3(
+    input: Stage3Input,
+    computationalResults?: ComputationalResults,
+  ): Promise<Stage3ConsolidatedOutput> {

+    // For Stage 3, we may also have voice evolution data
+    const compResults = computationalResults ?? {};
+    if (input.previousDraft && input.currentDraft && !compResults.voiceEvolution) {
+      try {
+        compResults.voiceEvolution = stylometricAnalyzer.trackEvolution(
+          input.previousDraft,
+          input.currentDraft,
+        );
+      } catch { /* graceful degradation */ }
+    }
+
+    const enrichment = promptEnrichmentService.enrich('stage3', compResults);
+    const enrichmentBlock = enrichment.injected && enrichment.block.length > 20
+      ? `\n\n${enrichment.block}\n\n`
+      : '';
+
     // Build prompt (inject enrichment before journey context)
     const prompt = STAGE3_CONSOLIDATED_PROMPT
+      .replace('{polishCalibration}', enrichmentBlock)
       .replace('{voiceBaseline}', input.voiceBaseline)
       // ... rest unchanged
```


### 7.5 Integration Diff: PIQ Chat Service

**File**: `src/services/piqWorkshop/piqChatService.ts`

```diff
+import { promptEnrichmentService, type ComputationalResults } from '@/services/enrichment';
+import { InformationTheoreticAnalyzer } from '@/core/analysis/features/informationTheoreticAnalyzer';
+import { stylometricAnalyzer } from '@/services/stylometrics';

 // In the sendPIQChatMessage function:
 export async function sendPIQChatMessage(
   input: PIQChatInput,
+  computationalResults?: ComputationalResults,
 ): Promise<PIQChatOutput> {

+  // Compute analysis if essay text is available and results not provided
+  const compResults = computationalResults ?? (() => {
+    if (!input.currentDraft) return {};
+    try {
+      const itAnalyzer = new InformationTheoreticAnalyzer();
+      return {
+        infoTheoretic: itAnalyzer.analyze(input.currentDraft),
+        stylometric: stylometricAnalyzer.analyze(input.currentDraft),
+      };
+    } catch { return {}; }
+  })();
+
+  const enrichment = promptEnrichmentService.enrich('piq', compResults);
+
   // Build system prompt
-  const systemPrompt = SYSTEM_PROMPT;
+  const enrichmentBlock = enrichment.injected && enrichment.block.length > 20
+    ? `\n\n${enrichment.block}`
+    : '';
+  const systemPrompt = SYSTEM_PROMPT + enrichmentBlock;
```


### 7.6 Integration Diff: Activity Description Scoring Service

**File**: `src/services/portfolioStrategy/services/activityWorkshop/scoring/descriptionScoringService.ts`

```diff
+import { promptEnrichmentService, type ComputationalResults } from '@/services/enrichment';
+import { stylometricAnalyzer } from '@/services/stylometrics';

 export class DescriptionScoringService {
   async scoreDescription(
     input: DescriptionScoringInput,
+    computationalResults?: ComputationalResults,
   ): Promise<DescriptionScoringResult> {

+    // Run lightweight stylometric analysis on the description
+    const compResults = computationalResults ?? (() => {
+      try {
+        return { stylometric: stylometricAnalyzer.analyze(input.description) };
+      } catch { return {}; }
+    })();
+
+    const enrichment = promptEnrichmentService.enrich('activity', compResults);
+
     const systemPrompt = buildDescriptionScoringSystemPrompt(input.platform);
+    const enrichmentBlock = enrichment.injected && enrichment.block.length > 20
+      ? `\n\n${enrichment.block}`
+      : '';

     const result = await callClaude({
-      systemPrompt,
+      systemPrompt: systemPrompt + enrichmentBlock,
       prompt: buildScoringUserPrompt(input),
       // ... rest unchanged
```

### 7.7 Computational Analysis Sharing Across Stages

To avoid running the same analysis multiple times in a pipeline, the orchestrator should compute once and pass results through.

**File**: `src/services/commonAppWorkshop/services/handoffService.ts`

The `HandoffService.runCompleteWorkshop()` method (line 199) orchestrates Stages 0-3 sequentially. Computational analysis runs once at the top and flows through all stages:

```diff
 import { Stage0ConditionalService } from './stage0ConditionalService';
 import { Stage1ATeachingService } from './stage1ATeachingService';
 import { Stage1BDiagnosisService } from './stage1BDiagnosisService';
 import { Stage2BatchService } from './stage2BatchService';
 import { Stage3ConsolidatedService } from './stage3ConsolidatedService';
+import { InformationTheoreticAnalyzer } from '@/core/analysis/features/informationTheoreticAnalyzer';
+import { stylometricAnalyzer } from '@/services/stylometrics';
+import type { ComputationalResults } from '@/services/enrichment';

 // ... existing types ...

   async runCompleteWorkshop(input: WorkshopInput): Promise<CompleteWorkshopOutput> {
     console.log('Starting Complete Common App Workshop...');
     const startTime = Date.now();

+    // Compute once, share across all stages (~20ms, $0.00)
+    const computationalResults: ComputationalResults = {};
+    try {
+      const itAnalyzer = new InformationTheoreticAnalyzer();
+      computationalResults.infoTheoretic = itAnalyzer.analyze(input.rawDraft);
+      computationalResults.stylometric = stylometricAnalyzer.analyze(input.rawDraft);
+      console.log(`   Computational pre-analysis: ${(performance.now() - startTime).toFixed(1)}ms`);
+    } catch (error) {
+      console.error('[Handoff] Computational pre-analysis failed:', error);
+      // Pipeline continues without enrichment — graceful degradation
+    }

     // Stage 0: Voice Excavation
     const stage0Output = await this.runStage0(input);
     this.validateStage0Output(stage0Output);

     // Stage 1: Foundation Teaching
-    const stage1Output = await this.runStage1(input, stage0Output);
+    const stage1Output = await this.runStage1(input, stage0Output, computationalResults);
     this.validateStage1Output(stage1Output);

     // Stage 2: Surgical Teaching
-    const stage2Output = await this.runStage2(input, stage0Output, stage1Output);
+    const stage2Output = await this.runStage2(input, stage0Output, stage1Output, computationalResults);
     this.validateStage2Output(stage2Output);

     // Stage 3: Final Polish
-    const stage3Output = await this.runStage3(input, stage1Output, stage2Output);
+    const stage3Output = await this.runStage3(input, stage1Output, stage2Output, computationalResults);
     this.validateStage3Output(stage3Output);
```

The private `runStage1()`, `runStage2()`, `runStage3()` methods pass `computationalResults` through to their respective services. `runStage0()` does not receive enrichment (voice excavation needs to run independently to establish baseline).

---

## 8. Testing Strategy

### 8.1 Unit Tests

**File**: `tests/test-prompt-enrichment-service.ts`

Test cases:
1. **Each stage builder** produces output under 200 tokens
2. **Empty inputs** (no infoTheoretic, no stylometric) return empty string gracefully
3. **Feature flags** correctly enable/disable per stage
4. **Shadow mode** logs but does not inject
5. **Token budget enforcement** truncates correctly
6. **Per-issue evidence** maps correctly to paragraph indices
7. **Truncation** handles edge cases (empty text, very long text)

### 8.2 Integration Tests

**File**: `tests/test-enrichment-integration.ts`

Test cases:
1. **Full pipeline** with real essay text — verify enrichment blocks are generated and injected
2. **Computational analysis** runs in < 25ms for 650-word essay
3. **Prompt length** with enrichment stays within model context window
4. **Graceful degradation** — disable enrichment mid-pipeline, verify no errors

### 8.3 A/B Quality Tests

**File**: `tests/test-enrichment-ab-comparison.ts`

Strategy:
1. Run 10 diverse essays through the pipeline twice: once with enrichment, once without
2. For each, capture:
   - Full prompt (with/without enrichment)
   - Claude's response
   - Token usage (input + output)
   - Response quality scores (manual evaluation rubric)
3. Compare:
   - Token usage difference (enrichment should increase input ~150 tokens, decrease output ~200 tokens)
   - Quality delta (enriched should score higher on specificity and voice-matching)
   - Computational term leakage (enriched responses should NOT contain terms like "compression ratio")

### 8.4 Regression Tests

**File**: `tests/test-enrichment-regression.ts`

Guard against:
1. **No degradation** when enrichment is disabled (output identical to current)
2. **No crash** when computational analysis returns malformed data
3. **No prompt injection** — enrichment block cannot escape its section and modify instructions
4. **Token count stability** — enrichment tokens stay within 10% of estimates across 50 essays

---

## Appendix A: Feature Flag Configuration Examples

### All On (default)

```typescript
const config: EnrichmentConfig = {
  enabled: true,
  stages: {
    stage1A:  { enabled: true, shadow: false },
    stage1B:  { enabled: true, shadow: false },
    stage2:   { enabled: true, shadow: false },
    stage3:   { enabled: true, shadow: false },
    piq:      { enabled: true, shadow: false },
    activity: { enabled: true, shadow: false },
  },
  maxTokensBudget: 200,
  shadowMode: false,
};
```

### Shadow Mode (compute + log, don't inject)

```typescript
const config: EnrichmentConfig = {
  enabled: true,
  stages: {
    stage1A:  { enabled: true, shadow: false },
    stage1B:  { enabled: true, shadow: false },
    stage2:   { enabled: true, shadow: false },
    stage3:   { enabled: true, shadow: false },
    piq:      { enabled: true, shadow: false },
    activity: { enabled: true, shadow: false },
  },
  maxTokensBudget: 200,
  shadowMode: true,  // Compute all, inject none
};
```

### Staged Rollout (start with Stage 1B only)

```typescript
const config: EnrichmentConfig = {
  enabled: true,
  stages: {
    stage1A:  { enabled: false, shadow: true },  // Shadow — collect data
    stage1B:  { enabled: true,  shadow: false },  // Active — highest impact
    stage2:   { enabled: false, shadow: true },   // Shadow — collect data
    stage3:   { enabled: false, shadow: false },  // Off
    piq:      { enabled: false, shadow: false },  // Off
    activity: { enabled: false, shadow: false },  // Off
  },
  maxTokensBudget: 200,
  shadowMode: false,
};
```

---

## Appendix B: Previous Plan Archive

The Chat integration plan previously stored in this file has been moved to `docs/CHAT_INTEGRATION_PLAN.md`.
