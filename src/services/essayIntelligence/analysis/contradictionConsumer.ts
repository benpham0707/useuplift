/**
 * W4.4: Contradiction Consumer — processes programmatic + LLM-detected contradictions.
 *
 * Routes contradictions by severity:
 *   - blocking → create Finding via FindingStore (source: 'coherence_check', coachingValue: 'critical')
 *   - notable  → flag for L5 annotation context
 *   - minor    → log only
 *
 * Called by the orchestrator after L4 crystallization + programmatic detection merge.
 * Pure data transformation — no LLM calls.
 */

import type { ProgrammaticContradiction } from '../profileTypes';
import type { Finding } from '../profileTypes';
import { FindingStore } from '../findings/findingStore';

// ============================================================================
// TYPES
// ============================================================================

export interface ContradictionConsumptionResult {
  /** IDs of findings created from blocking contradictions */
  findingsCreated: string[];
  /** Text flags for L5 annotation context (from notable contradictions) */
  annotationFlags: string[];
  /** Total number of contradictions consumed */
  consumed: number;
}

// ============================================================================
// CONSUMER
// ============================================================================

/**
 * Consume programmatic contradictions based on severity.
 *
 * Blocking contradictions become findings in the store — these represent
 * profile-level problems that need resolution. Notable contradictions
 * become annotation flags so L5 can surface them to the student in context.
 * Minor contradictions are logged for diagnostic purposes only.
 *
 * Marks each contradiction as consumed after processing.
 */
export function consumeContradictions(
  contradictions: ProgrammaticContradiction[],
  findingStore: FindingStore,
): ContradictionConsumptionResult {
  const findingsCreated: string[] = [];
  const annotationFlags: string[] = [];
  let consumed = 0;

  for (const contradiction of contradictions) {
    if (contradiction.consumed) continue;

    switch (contradiction.severity) {
      case 'blocking': {
        const finding = createFindingFromContradiction(contradiction, findingStore);
        findingStore.add(finding);
        findingsCreated.push(finding.id);
        // Also flag for annotations — blocking contradictions are always annotation-worthy
        annotationFlags.push(
          `[BLOCKING CONTRADICTION] ${contradiction.evidenceA.section}: ${contradiction.evidenceA.claim} ` +
          `vs ${contradiction.evidenceB.section}: ${contradiction.evidenceB.claim}`,
        );
        contradiction.consumed = true;
        consumed++;
        break;
      }

      case 'notable': {
        // Notable contradictions also become findings (at hypothesis maturity) so the growth
        // cycle can validate them. Without this, notable contradictions are ephemeral annotation
        // flags that vanish after one L5 call — losing potentially valuable tension signals.
        // The growth cycle can promote to 'developing'/'confirmed' or supersede as false positive.
        const notableFinding = createFindingFromContradiction(contradiction, findingStore);
        notableFinding.maturity = 'hypothesis';
        notableFinding.maturityReasoning =
          'Notable tension detected by programmatic check — hypothesis maturity because the evidence ' +
          'threshold is moderate (not blocking). Growth cycle should validate whether this tension ' +
          'is genuine or a labeling artifact.';
        notableFinding.coachingValue = 'medium';
        notableFinding.lineage[0].previousMaturity = 'hypothesis';
        notableFinding.lineage[0].newMaturity = 'hypothesis';
        findingStore.add(notableFinding);
        findingsCreated.push(notableFinding.id);
        annotationFlags.push(
          `[NOTABLE TENSION] ${contradiction.evidenceA.section}: ${contradiction.evidenceA.claim} ` +
          `vs ${contradiction.evidenceB.section}: ${contradiction.evidenceB.claim}`,
        );
        contradiction.consumed = true;
        consumed++;
        break;
      }

      case 'minor': {
        console.log(
          `[ContradictionConsumer] Minor contradiction logged: ` +
          `${contradiction.type} — ${contradiction.evidenceA.claim} vs ${contradiction.evidenceB.claim}`,
        );
        contradiction.consumed = true;
        consumed++;
        break;
      }
    }
  }

  if (consumed > 0) {
    console.log(
      `[ContradictionConsumer] Processed ${consumed} contradiction(s): ` +
      `${findingsCreated.length} findings created, ${annotationFlags.length} annotation flags`,
    );
  }

  return { findingsCreated, annotationFlags, consumed };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Create a Finding from a blocking contradiction.
 * The finding captures the contradiction as a claim with both sides as evidence.
 */
function createFindingFromContradiction(
  contradiction: ProgrammaticContradiction,
  findingStore: FindingStore,
): Finding {
  const id = findingStore.generateId();
  const now = new Date().toISOString();

  // Determine scope from contradiction locations
  const paragraphA = contradiction.evidenceA.location?.paragraph;
  const paragraphB = contradiction.evidenceB.location?.paragraph;
  const paragraphs = [
    ...(paragraphA !== undefined ? [paragraphA] : []),
    ...(paragraphB !== undefined && paragraphB !== paragraphA ? [paragraphB] : []),
  ];

  const textEvidence: Array<{ text: string; location: { paragraph: number; sentence?: number } }> = [];
  if (contradiction.evidenceA.location) {
    textEvidence.push({
      text: contradiction.evidenceA.claim,
      location: contradiction.evidenceA.location,
    });
  }
  if (contradiction.evidenceB.location) {
    textEvidence.push({
      text: contradiction.evidenceB.claim,
      location: contradiction.evidenceB.location,
    });
  }

  return {
    id,
    claim: `Profile contradiction (${contradiction.type}): ${contradiction.evidenceA.claim} conflicts with ${contradiction.evidenceB.claim}`,
    scope: {
      type: paragraphs.length > 1 ? 'cross_paragraph' : paragraphs.length === 1 ? 'paragraph' : 'essay_level',
      paragraph: paragraphs[0],
      paragraphs: paragraphs.length > 1 ? paragraphs : undefined,
      textEvidence,
    },
    maturity: 'developing',
    maturityReasoning: 'Detected by programmatic cross-domain validation with explicit evidence on both sides. Set to developing (not confirmed) because programmatic keyword-matching may produce false positives — the growth cycle should validate whether this tension is genuine or a labeling artifact.',
    coachingValue: 'critical',
    dimensions: mapContradictionTypeToDimensions(contradiction.type),
    buildsOn: [],
    relatedTo: [],
    source: 'coherence_check',
    deepeningPotential: `Investigate why ${contradiction.evidenceA.section} and ${contradiction.evidenceB.section} disagree — may indicate a prompt quality issue or genuine essay tension.`,
    raisesQuestions: [
      `Is the ${contradiction.evidenceA.section} assessment accurate, or does it need revision?`,
      `Does the ${contradiction.evidenceB.section} score/claim account for the full context?`,
    ],
    evidence: [
      {
        text: `${contradiction.evidenceA.section}: ${contradiction.evidenceA.claim}`,
        location: contradiction.evidenceA.location,
        type: 'present',
      },
      {
        text: `${contradiction.evidenceB.section}: ${contradiction.evidenceB.claim}`,
        location: contradiction.evidenceB.location,
        type: 'present',
      },
    ],
    lineage: [
      {
        timestamp: now,
        previousMaturity: 'developing',
        newMaturity: 'developing',
        trigger: 'programmatic_contradiction_check',
        reasoning: 'Created from programmatic cross-domain contradiction detection. Starts at developing maturity — L3.75 growth cycle or L6 coaching should validate whether this tension is genuine.',
      },
    ],
    createdAt: now,
    lastUpdated: now,
  };
}

/**
 * Map contradiction type to relevant holistic dimensions.
 *
 * These are INITIAL routing hints, not definitive assignments.
 * When the growth cycle validates the contradiction finding,
 * the LLM may reassign dimensions based on the actual content.
 * Broad defaults are better than narrow ones — downstream can refine.
 */
function mapContradictionTypeToDimensions(
  type: ProgrammaticContradiction['type'],
): Finding['dimensions'] {
  switch (type) {
    case 'understanding_vs_analysis':
      // Could touch any dimension — understanding is holistic
      return ['voice', 'craft', 'emotion'];
    case 'voicemap_vs_identity':
      return ['voice'];
    case 'structural_weight_vs_scores':
      return ['structure', 'craft', 'narrative'];
    case 'earnedness_vs_effectiveness':
      return ['emotion', 'narrative', 'craft'];
  }
}
