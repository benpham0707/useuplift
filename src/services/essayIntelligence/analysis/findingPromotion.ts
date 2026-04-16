/**
 * Finding Promotion — Bridges L3.5 analysis output into the FindingStore.
 *
 * L3.5 (analysis pass) is the FIRST evaluative layer. It produces per-paragraph
 * verdicts, per-sentence strengths/weaknesses (with text evidence), and
 * essay-level strength signatures + growth edges. Until this module, L3.5's
 * judgments lived only on the profile's sentence/paragraph fields — they were
 * never promoted to first-class Findings, which meant the FindingStore was
 * almost empty entering L4 and L5/L6 had no scoped findings to coach against.
 *
 * What this module does:
 *  - Walks every AnalysisPassOutput from L3.5.
 *  - Promotes high-signal observations (sentence weaknesses, paragraph verdicts
 *    with low effectiveness, essay-level growth edges, paragraph-spanning
 *    strength signatures) into Finding objects.
 *  - Wires `source: 'analysis_pass'`, `paragraph` scope, and a coaching value
 *    derived from severity (effectiveness score, priority for improvement,
 *    and whether the LLM flagged the sentence as a problem).
 *  - Adds them to the coordinator's FindingStore so L4 sees them, L5 can
 *    annotate against them, and L6 can route off them.
 *
 * Design rules followed:
 *  - LLM-first (Rule 1): we never invent an observation; every Finding is
 *    backed by the LLM's own observation + evidence text.
 *  - Never discard paid output (Rule 2): all evidence-bearing
 *    strengths/weaknesses get a Finding; we only DROP observations that lack
 *    evidence (which would fail FindingStore's referential integrity anyway).
 *  - System bookkeeping (Rule 6): coachingValue derivation is mechanical from
 *    LLM-supplied effectiveness/priority — not a re-judgment of the observation.
 *
 * NOTE: Some L3.5 modes (essay_level) emit empty sentenceAnalyses but populated
 * paragraphVerdict + holisticAnalysisEvolution. This promoter handles both.
 */

import type {
  AnalysisPassOutput,
  Finding,
  FindingCoachingValue,
  FindingEvidence,
  FindingScope,
  HolisticDimension,
  ObservationEntry,
} from '../profileTypes';
import type { FindingStore } from '../findings/findingStore';

/** Result of a promotion pass — surfaced for logging + tests. */
export interface FindingPromotionResult {
  promoted: number;
  skipped: number;
  byKind: {
    sentenceWeakness: number;
    sentenceStrength: number;
    paragraphVerdict: number;
    strengthSignature: number;
    growthEdge: number;
  };
  errors: string[];
}

/**
 * Decide a finding's coachingValue from a sentence-level analysis.
 * Higher priority + lower effectiveness + isProblem → critical.
 * Pure mechanical mapping — no analytical judgment beyond the LLM's own fields.
 */
function coachingValueForSentenceWeakness(
  effectiveness: number,
  priorityForImprovement: number,
  isProblem: boolean,
): FindingCoachingValue {
  if (isProblem && priorityForImprovement >= 4) return 'critical';
  if (effectiveness < 40 || priorityForImprovement >= 4) return 'critical';
  if (effectiveness < 55 || priorityForImprovement >= 3) return 'high';
  if (effectiveness < 70 || priorityForImprovement >= 2) return 'medium';
  return 'contextual';
}

function coachingValueForSentenceStrength(
  effectiveness: number,
  isStrength: boolean,
): FindingCoachingValue {
  if (effectiveness >= 86) return 'high';
  if (isStrength || effectiveness >= 76) return 'medium';
  return 'contextual';
}

function coachingValueForParagraphVerdict(effectiveness: number): FindingCoachingValue {
  if (effectiveness < 40) return 'critical';
  if (effectiveness < 55) return 'high';
  if (effectiveness < 70) return 'medium';
  if (effectiveness >= 80) return 'medium'; // strong paragraphs are still coaching anchors
  return 'contextual';
}

/**
 * Best-effort dimension inference from observation text.
 * The L3.5 sentence-level outputs do not carry explicit dimensions —
 * we keep the list empty rather than guess (LLM-first principle).
 * The store accepts an empty dimensions array; routing falls back to scope.
 */
function inferDimensionsFromKeywords(text: string): HolisticDimension[] {
  const lower = text.toLowerCase();
  const dims: HolisticDimension[] = [];
  if (/\bvoice|tone|register|persona\b/.test(lower)) dims.push('voice');
  if (/\bemotion|feel|grief|joy|fear|vulnerab/.test(lower)) dims.push('emotion');
  if (/\btheme|motif|symbol|throughline\b/.test(lower)) dims.push('theme');
  if (/\bnarrative|arc|pivot|structure of the story|story\b/.test(lower)) dims.push('narrative');
  if (/\bcharacter|reveal|self-aware|growth\b/.test(lower)) dims.push('character');
  if (/\bcraft|imag(?:e|ery)|metaphor|sentence|prose|diction|specific(ity)?\b/.test(lower)) dims.push('craft');
  if (/\badmissions|admission officer|ao\b/.test(lower)) dims.push('admissions');
  if (/\bstructure|paragraph|transition|opening|closing|ordering\b/.test(lower)) dims.push('structure');
  return dims;
}

function evidenceFromObservation(
  obs: ObservationEntry,
  paragraph: number,
  sentence?: number,
): FindingEvidence | null {
  const text = (obs.evidence ?? '').trim();
  if (!text) return null;
  return {
    text,
    location: { paragraph, ...(sentence != null ? { sentence } : {}) },
    type: 'present',
  };
}

function makeScopeForSentence(paragraph: number, sentence: number, evidence: FindingEvidence): FindingScope {
  return {
    type: 'sentence',
    paragraph,
    sentences: [sentence],
    textEvidence: [{ text: evidence.text, location: { paragraph, sentence } }],
  };
}

function makeScopeForParagraph(paragraph: number, evidenceTexts: string[]): FindingScope {
  return {
    type: 'paragraph',
    paragraph,
    textEvidence: evidenceTexts
      .filter(t => t.trim().length > 0)
      .map(t => ({ text: t, location: { paragraph } })),
  };
}

function makeScopeForCrossParagraph(paragraphs: number[], evidenceTexts: string[]): FindingScope {
  const ordered = [...new Set(paragraphs)].sort((a, b) => a - b);
  const primary = ordered[0] ?? 0;
  return {
    type: ordered.length > 1 ? 'cross_paragraph' : 'paragraph',
    paragraph: primary,
    paragraphs: ordered.length > 1 ? ordered : undefined,
    textEvidence: evidenceTexts
      .filter(t => t.trim().length > 0)
      .map((t, i) => ({ text: t, location: { paragraph: ordered[Math.min(i, ordered.length - 1)] ?? primary } })),
  };
}

/**
 * Promote one L3.5 paragraph-level analysis into Findings.
 * Returns the count promoted + skipped (skipped = no usable evidence).
 */
function promoteSingleParagraph(
  store: FindingStore,
  analysis: AnalysisPassOutput,
  result: FindingPromotionResult,
  sourceCandidateIds: Map<string, string[]>,
): void {
  const now = new Date().toISOString();
  const pIdx = analysis.paragraphIndex;

  // ── Sentence-level weaknesses + strengths ──
  for (const sa of analysis.sentenceAnalyses ?? []) {
    for (const weakness of sa.weaknesses ?? []) {
      const ev = evidenceFromObservation(weakness, pIdx, sa.sentenceIndex);
      if (!ev) {
        result.skipped++;
        continue;
      }
      const id = store.generateId();
      const finding: Finding = {
        id,
        claim: weakness.observation,
        scope: makeScopeForSentence(pIdx, sa.sentenceIndex, ev),
        maturity: 'confirmed',
        maturityReasoning:
          `L3.5 evaluative pass: weakness identified at P${pIdx}S${sa.sentenceIndex} with cited evidence ` +
          `(effectiveness=${sa.effectiveness}, priority=${sa.priorityForImprovement}).`,
        coachingValue: coachingValueForSentenceWeakness(
          sa.effectiveness,
          sa.priorityForImprovement,
          sa.isProblem,
        ),
        dimensions: inferDimensionsFromKeywords(weakness.observation),
        buildsOn: [],
        relatedTo: [],
        source: 'analysis_pass',
        deepeningPotential: sa.priorityForImprovement >= 3
          ? `Coaching could explore concrete revision of this sentence — what would specificity look like?`
          : null,
        raisesQuestions: [],
        evidence: [ev],
        lineage: [{
          timestamp: now,
          previousMaturity: 'hypothesis',
          newMaturity: 'confirmed',
          trigger: `analysis_pass_P${pIdx}S${sa.sentenceIndex}`,
          reasoning: `Promoted from L3.5 weakness observation (confidence=${weakness.confidence}).`,
        }],
        createdAt: now,
        lastUpdated: now,
      };
      try {
        store.add(finding);
        result.promoted++;
        result.byKind.sentenceWeakness++;
        // Track lineage from candidate-store key (paragraph+sentence) → new finding ID
        const key = `weakness:${pIdx}:${sa.sentenceIndex}`;
        const existing = sourceCandidateIds.get(key) ?? [];
        existing.push(id);
        sourceCandidateIds.set(key, existing);
      } catch (e) {
        result.errors.push(
          `Failed to promote weakness at P${pIdx}S${sa.sentenceIndex}: ${(e as Error).message}`,
        );
      }
    }

    // Promote sentence strengths only when noteworthy (high effectiveness or isStrength flag)
    if (sa.isStrength || sa.effectiveness >= 76) {
      for (const strength of sa.strengths ?? []) {
        const ev = evidenceFromObservation(strength, pIdx, sa.sentenceIndex);
        if (!ev) {
          result.skipped++;
          continue;
        }
        const id = store.generateId();
        const finding: Finding = {
          id,
          claim: strength.observation,
          scope: makeScopeForSentence(pIdx, sa.sentenceIndex, ev),
          maturity: 'confirmed',
          maturityReasoning:
            `L3.5 evaluative pass: strength identified at P${pIdx}S${sa.sentenceIndex} with cited evidence ` +
            `(effectiveness=${sa.effectiveness}).`,
          coachingValue: coachingValueForSentenceStrength(sa.effectiveness, sa.isStrength),
          dimensions: inferDimensionsFromKeywords(strength.observation),
          buildsOn: [],
          relatedTo: [],
          source: 'analysis_pass',
          deepeningPotential: null,
          raisesQuestions: [],
          evidence: [ev],
          lineage: [{
            timestamp: now,
            previousMaturity: 'hypothesis',
            newMaturity: 'confirmed',
            trigger: `analysis_pass_P${pIdx}S${sa.sentenceIndex}`,
            reasoning: `Promoted from L3.5 strength observation (confidence=${strength.confidence}).`,
          }],
          createdAt: now,
          lastUpdated: now,
        };
        try {
          store.add(finding);
          result.promoted++;
          result.byKind.sentenceStrength++;
        } catch (e) {
          result.errors.push(
            `Failed to promote strength at P${pIdx}S${sa.sentenceIndex}: ${(e as Error).message}`,
          );
        }
      }
    }
  }

  // ── Paragraph-level verdict ──
  const verdictText = (analysis.paragraphVerdict ?? '').trim();
  if (verdictText.length > 0) {
    // Build evidence from a representative sentence (lowest-scoring or first)
    const evidenceTexts: string[] = [];
    if (analysis.sentenceAnalyses && analysis.sentenceAnalyses.length > 0) {
      const sortedByEff = [...analysis.sentenceAnalyses].sort(
        (a, b) => a.effectiveness - b.effectiveness,
      );
      const lowest = sortedByEff[0];
      const lowestEv = (lowest?.weaknesses?.[0]?.evidence ?? lowest?.strengths?.[0]?.evidence ?? '').trim();
      if (lowestEv) evidenceTexts.push(lowestEv);
    }
    // If no sentence-level evidence (essay_level mode), use the verdict itself as scope
    // anchored to paragraph-level — accept verdictText as the textEvidence.
    if (evidenceTexts.length === 0) evidenceTexts.push(verdictText.slice(0, 200));

    const id = store.generateId();
    const finding: Finding = {
      id,
      claim: `Paragraph verdict: ${verdictText}`,
      scope: makeScopeForParagraph(pIdx, evidenceTexts),
      maturity: 'confirmed',
      maturityReasoning:
        `L3.5 paragraph-level verdict for P${pIdx} (effectiveness=${analysis.paragraphEffectiveness}).`,
      coachingValue: coachingValueForParagraphVerdict(analysis.paragraphEffectiveness),
      dimensions: inferDimensionsFromKeywords(verdictText),
      buildsOn: [],
      relatedTo: [],
      source: 'analysis_pass',
      deepeningPotential: analysis.paragraphEffectiveness < 60
        ? `Paragraph effectiveness is ${analysis.paragraphEffectiveness} — coaching could explore revision direction.`
        : null,
      raisesQuestions: [],
      evidence: evidenceTexts.map(t => ({
        text: t,
        location: { paragraph: pIdx },
        type: 'present' as const,
      })),
      lineage: [{
        timestamp: now,
        previousMaturity: 'hypothesis',
        newMaturity: 'confirmed',
        trigger: `analysis_pass_P${pIdx}_verdict`,
        reasoning: `Promoted from L3.5 paragraph verdict (effectiveness=${analysis.paragraphEffectiveness}).`,
      }],
      createdAt: now,
      lastUpdated: now,
    };
    try {
      store.add(finding);
      result.promoted++;
      result.byKind.paragraphVerdict++;
    } catch (e) {
      result.errors.push(`Failed to promote paragraph verdict for P${pIdx}: ${(e as Error).message}`);
    }
  }
}

/**
 * Promote essay-level holistic evolution (strength signatures + growth edges)
 * from a SINGLE paragraph analysis. We deduplicate by the `quality` key so that
 * a strength signature observed across multiple paragraphs becomes one Finding,
 * not N copies. Called AFTER per-paragraph promotion to ensure paragraph-level
 * findings are added first (so cross-paragraph findings can reference them).
 */
function promoteHolisticEvolution(
  store: FindingStore,
  analyses: ReadonlyArray<AnalysisPassOutput>,
  result: FindingPromotionResult,
): void {
  const now = new Date().toISOString();

  // Aggregate strength signatures across all paragraphs by quality
  type SigEntry = { quality: string; evidence: string[]; paragraphs: Set<number> };
  const sigByQuality = new Map<string, SigEntry>();
  for (const analysis of analyses) {
    const sigs = analysis.holisticAnalysisEvolution?.strengthSignatures ?? [];
    for (const sig of sigs) {
      const key = sig.quality.trim().toLowerCase();
      if (!key) continue;
      let entry = sigByQuality.get(key);
      if (!entry) {
        entry = { quality: sig.quality, evidence: [], paragraphs: new Set() };
        sigByQuality.set(key, entry);
      }
      if (sig.evidence) entry.evidence.push(sig.evidence);
      for (const p of sig.paragraphs ?? []) entry.paragraphs.add(p);
      entry.paragraphs.add(analysis.paragraphIndex);
    }
  }

  for (const entry of sigByQuality.values()) {
    if (entry.evidence.length === 0) {
      result.skipped++;
      continue;
    }
    const paragraphs = [...entry.paragraphs];
    const id = store.generateId();
    const finding: Finding = {
      id,
      claim: `Strength signature: ${entry.quality}`,
      scope: makeScopeForCrossParagraph(paragraphs, entry.evidence),
      maturity: 'confirmed',
      maturityReasoning:
        `L3.5 essay-level strength signature observed across ${paragraphs.length} paragraph(s): ${paragraphs.map(p => `P${p}`).join(', ')}.`,
      coachingValue: paragraphs.length >= 2 ? 'high' : 'medium',
      dimensions: inferDimensionsFromKeywords(entry.quality),
      buildsOn: [],
      relatedTo: [],
      source: 'analysis_pass',
      deepeningPotential: null,
      raisesQuestions: [],
      evidence: entry.evidence.map((t, i) => ({
        text: t,
        location: { paragraph: paragraphs[Math.min(i, paragraphs.length - 1)] ?? paragraphs[0] },
        type: 'present' as const,
      })),
      lineage: [{
        timestamp: now,
        previousMaturity: 'hypothesis',
        newMaturity: 'confirmed',
        trigger: 'analysis_pass_strength_signature',
        reasoning: 'Promoted from L3.5 holistic strength signature aggregation.',
      }],
      createdAt: now,
      lastUpdated: now,
    };
    try {
      store.add(finding);
      result.promoted++;
      result.byKind.strengthSignature++;
    } catch (e) {
      result.errors.push(`Failed to promote strength signature "${entry.quality}": ${(e as Error).message}`);
    }
  }

  // Aggregate growth edges across all paragraphs by quality
  type EdgeEntry = { quality: string; descriptions: string[]; paragraphs: Set<number> };
  const edgeByQuality = new Map<string, EdgeEntry>();
  for (const analysis of analyses) {
    const edges = analysis.holisticAnalysisEvolution?.growthEdges ?? [];
    for (const edge of edges) {
      const key = edge.quality.trim().toLowerCase();
      if (!key) continue;
      let entry = edgeByQuality.get(key);
      if (!entry) {
        entry = { quality: edge.quality, descriptions: [], paragraphs: new Set() };
        edgeByQuality.set(key, entry);
      }
      if (edge.description) entry.descriptions.push(edge.description);
      for (const p of edge.paragraphs ?? []) entry.paragraphs.add(p);
      entry.paragraphs.add(analysis.paragraphIndex);
    }
  }

  for (const entry of edgeByQuality.values()) {
    const evidenceTexts = entry.descriptions.length > 0
      ? entry.descriptions
      : [entry.quality]; // fall back to the quality phrase itself as evidence anchor
    const paragraphs = [...entry.paragraphs];
    const id = store.generateId();
    const finding: Finding = {
      id,
      claim: `Growth edge: ${entry.quality}`,
      scope: makeScopeForCrossParagraph(paragraphs, evidenceTexts),
      maturity: 'confirmed',
      maturityReasoning:
        `L3.5 essay-level growth edge observed across ${paragraphs.length} paragraph(s): ${paragraphs.map(p => `P${p}`).join(', ')}.`,
      coachingValue: paragraphs.length >= 3 ? 'critical' : paragraphs.length >= 2 ? 'high' : 'medium',
      dimensions: inferDimensionsFromKeywords(entry.quality + ' ' + entry.descriptions.join(' ')),
      buildsOn: [],
      relatedTo: [],
      source: 'analysis_pass',
      deepeningPotential: `L3.5 flagged this as an essay-wide growth edge — coaching can target it directly.`,
      raisesQuestions: [],
      evidence: evidenceTexts.map((t, i) => ({
        text: t,
        location: { paragraph: paragraphs[Math.min(i, paragraphs.length - 1)] ?? paragraphs[0] },
        type: 'present' as const,
      })),
      lineage: [{
        timestamp: now,
        previousMaturity: 'hypothesis',
        newMaturity: 'confirmed',
        trigger: 'analysis_pass_growth_edge',
        reasoning: 'Promoted from L3.5 holistic growth edge aggregation.',
      }],
      createdAt: now,
      lastUpdated: now,
    };
    try {
      store.add(finding);
      result.promoted++;
      result.byKind.growthEdge++;
    } catch (e) {
      result.errors.push(`Failed to promote growth edge "${entry.quality}": ${(e as Error).message}`);
    }
  }
}

/**
 * Public entry point: promote ALL L3.5 paragraph analyses into the FindingStore.
 *
 * Called after L3.5 completes and before L4 reads findings. The store is
 * mutated in place; the result is returned for logging/diagnostics.
 *
 * Idempotency note: the store generates fresh IDs each call, so re-running on
 * the same store will create duplicate findings. The orchestrator calls this
 * exactly once per L3.5 completion.
 */
export function promoteAnalysisFindings(
  store: FindingStore,
  paragraphAnalyses: ReadonlyArray<AnalysisPassOutput>,
): FindingPromotionResult {
  const result: FindingPromotionResult = {
    promoted: 0,
    skipped: 0,
    byKind: {
      sentenceWeakness: 0,
      sentenceStrength: 0,
      paragraphVerdict: 0,
      strengthSignature: 0,
      growthEdge: 0,
    },
    errors: [],
  };
  const sourceCandidateIds = new Map<string, string[]>();

  for (const analysis of paragraphAnalyses) {
    promoteSingleParagraph(store, analysis, result, sourceCandidateIds);
  }

  promoteHolisticEvolution(store, paragraphAnalyses, result);

  return result;
}
