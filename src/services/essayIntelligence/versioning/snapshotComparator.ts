/**
 * snapshotComparator.ts — Orchestrates LLM comparison between a snapshot
 * and the current essay state.
 *
 * Single Sonnet call per comparison. Results are cached by SnapshotManager
 * so the same comparison is not repeated.
 *
 * The comparison is understanding-based, not text-based: "what does each
 * version understand differently?" is more valuable than "what words changed?"
 *
 * Cost: ~$0.03-0.08 per comparison (single Sonnet call).
 */

import { createHash } from 'crypto';
import type {
  EssaySnapshot,
  SnapshotComparison,
  SnapshotUnderstanding,
  FindingMaturity,
} from '../profileTypes';
import { callClaude } from '../../../lib/llm/claude';
import { SnapshotManager } from './snapshotManager';

// ============================================================================
// CURRENT STATE INTERFACE
// ============================================================================

/**
 * CurrentEssayState — the live state to compare against a snapshot.
 * Assembled by the caller from the active EssayProfile + FindingStore + ConnectionGraph.
 */
export interface CurrentEssayState {
  /** Current essay text */
  text: string;
  /** Current understanding (same structure as snapshot understanding) */
  understanding: SnapshotUnderstanding;
}

// ============================================================================
// COMPARISON PROMPTS
// ============================================================================

const COMPARISON_SYSTEM_PROMPT = `You are an expert essay analysis system comparing two versions of an essay.
Your job is NOT to declare a winner. Your job is to illuminate what each version
does better and what it sacrifices — so the student can make an informed choice.

Be specific and grounded: cite actual text, name actual findings, reference
specific connections. Never default to "the current version is better because
it's newer." Sometimes the snapshot version is genuinely stronger — say so.

Your analysis should help the student understand the TRADE-OFFS of their revision,
not just validate their most recent work.

Respond in valid JSON matching the requested format.`;

function buildComparisonUserPrompt(
  snapshot: EssaySnapshot,
  current: CurrentEssayState,
): string {
  // Build snapshot understanding context
  // Rule 2: show ALL non-superseded findings — don't trim via context window.
  // The LLM needs the full picture to judge understanding deltas accurately.
  const activeSnapshotFindings = snapshot.understanding.findings
    .filter(f => f.maturity !== 'superseded');
  if (activeSnapshotFindings.length > 25) {
    console.log(`[SnapshotComparator] High snapshot finding density: ${activeSnapshotFindings.length} active findings`);
  }
  const snapshotFindings = activeSnapshotFindings
    .map(f => `  [${f.id}] (${f.maturity}) ${f.claim}`)
    .join('\n');

  const activeSnapshotConnections = snapshot.understanding.connections
    .filter(c => c.status === 'active');
  if (activeSnapshotConnections.length > 15) {
    console.log(`[SnapshotComparator] High snapshot connection density: ${activeSnapshotConnections.length} active connections`);
  }
  const snapshotConnections = activeSnapshotConnections
    .map(c => `  [${c.id}] P${c.from.paragraph}→P${c.to.paragraph}: ${c.description}`)
    .join('\n');

  // Build current understanding context
  const activeCurrentFindings = current.understanding.findings
    .filter(f => f.maturity !== 'superseded');
  if (activeCurrentFindings.length > 25) {
    console.log(`[SnapshotComparator] High current finding density: ${activeCurrentFindings.length} active findings`);
  }
  const currentFindings = activeCurrentFindings
    .map(f => `  [${f.id}] (${f.maturity}) ${f.claim}`)
    .join('\n');

  const activeCurrentConnections = current.understanding.connections
    .filter(c => c.status === 'active');
  if (activeCurrentConnections.length > 15) {
    console.log(`[SnapshotComparator] High current connection density: ${activeCurrentConnections.length} active connections`);
  }
  const currentConnections = activeCurrentConnections
    .map(c => `  [${c.id}] P${c.from.paragraph}→P${c.to.paragraph}: ${c.description}`)
    .join('\n');

  // Build paragraph understanding summaries
  const snapshotParaReadings = snapshot.understanding.paragraphUnderstandings
    .map(p => `  P${p.paragraphIndex}: ${p.understanding?.role ?? '(not yet analyzed)'}`)
    .join('\n');

  const currentParaReadings = current.understanding.paragraphUnderstandings
    .map(p => `  P${p.paragraphIndex}: ${p.understanding?.role ?? '(not yet analyzed)'}`)
    .join('\n');

  // Reading strategy comparison
  const snapshotStrategy = snapshot.understanding.readingStrategy
    ? `Strategy: ${snapshot.understanding.readingStrategy.strategy}\nBest approach: ${snapshot.understanding.readingStrategy.bestApproach}`
    : '(not yet produced)';

  const currentStrategy = current.understanding.readingStrategy
    ? `Strategy: ${current.understanding.readingStrategy.strategy}\nBest approach: ${current.understanding.readingStrategy.bestApproach}`
    : '(not yet produced)';

  return `=== ESSAY VERSION COMPARISON ===

=== SNAPSHOT VERSION (saved as "${snapshot.name}" on ${snapshot.createdAt}) ===

Essay text:
${snapshot.text}

Paragraph roles:
${snapshotParaReadings}

Key findings:
${snapshotFindings || '  (none)'}

Connection architecture:
${snapshotConnections || '  (none)'}
Graph summary: ${snapshot.understanding.connectionGraphSummary || '(none)'}

Reading strategy:
${snapshotStrategy}

Understanding maturity: ${snapshot.understanding.maturity}
${snapshot.understanding.northStarThroughLine ? `Through-line: ${snapshot.understanding.northStarThroughLine}` : ''}

=== CURRENT VERSION ===

Essay text:
${current.text}

Paragraph roles:
${currentParaReadings}

Key findings:
${currentFindings || '  (none)'}

Connection architecture:
${currentConnections || '  (none)'}
Graph summary: ${current.understanding.connectionGraphSummary || '(none)'}

Reading strategy:
${currentStrategy}

Understanding maturity: ${current.understanding.maturity}
${current.understanding.northStarThroughLine ? `Through-line: ${current.understanding.northStarThroughLine}` : ''}

=== YOUR ANALYSIS ===

For each paragraph that changed between the snapshot and the current version:

1. Did the TEXT change? (Compare the actual words.)
2. Did the UNDERSTANDING change? Compare the findings, readings, and connections for
   this paragraph between versions. If findings are essentially the same (same claims,
   same maturity, same connections), then understanding didn't change — it was a cosmetic edit.
3. If understanding changed, describe the delta: what does the current version understand
   about this paragraph that the snapshot didn't, and vice versa?
4. For this paragraph specifically, which version serves the essay's architecture better? WHY?

Do NOT default to "the current version is better because it's newer."

Also analyze:
- What connections were gained or lost?
- Did the essay's structural topology change?
- What is the essential trade-off between these versions?
- What does this comparison reveal about the student's revision instincts?

Respond with a JSON object matching this structure:
{
  "analysis": "string — 2-4 paragraph prose comparison of the two versions",
  "paragraphDeltas": [
    {
      "paragraph": number,
      "textChanged": boolean,
      "understandingChanged": boolean,
      "understandingDelta": "string or null",
      "assessment": "string — which version serves the essay better for this paragraph"
    }
  ],
  "structuralDelta": {
    "lostConnections": [{"id": "string", "description": "string", "significance": "string"}],
    "gainedConnections": [{"id": "string", "description": "string", "significance": "string"}],
    "changedConnections": [{"id": "string", "changeDescription": "string"}],
    "architecturalAssessment": "string"
  },
  "findingDelta": {
    "newFindings": ["string — finding IDs only in current"],
    "supersededFindings": [{"snapshotFindingId": "string", "currentSuccessor": "string", "reason": "string"}],
    "maturityDifferences": [{"findingId": "string", "snapshotMaturity": "string", "currentMaturity": "string"}]
  },
  "coachingImplications": "string — what this comparison means for coaching the student"
}`;
}

// ============================================================================
// COMPARISON ORCHESTRATOR
// ============================================================================

/**
 * Compare the current essay state to a snapshot.
 * Uses caching to avoid redundant LLM calls.
 *
 * @param snapshotId - The snapshot to compare against
 * @param currentState - The live essay state
 * @param snapshotManager - Manager for snapshot access + caching
 * @returns The comparison result
 * @throws If snapshot not found or LLM call fails
 */
export async function compareToSnapshot(
  snapshotId: string,
  currentState: CurrentEssayState,
  snapshotManager: SnapshotManager,
): Promise<SnapshotComparison> {
  const snapshot = snapshotManager.getSnapshot(snapshotId);
  if (!snapshot) {
    throw new Error(`Snapshot ${snapshotId} not found.`);
  }

  // Check cache first
  const stateHash = hashCurrentState(currentState);
  const cached = snapshotManager.getCachedComparison(snapshotId, stateHash);
  if (cached) {
    console.log(
      `[SnapshotComparator] Using cached comparison for snapshot '${snapshot.name}'`
    );
    return cached;
  }

  console.log(
    `[SnapshotComparator] Generating comparison: current vs snapshot '${snapshot.name}' (${snapshotId})`
  );

  // Build comparison prompt
  const userPrompt = buildComparisonUserPrompt(snapshot, currentState);

  // Single Sonnet call — comparison is a judgment call.
  // Using simple input format with useJsonMode for automatic JSON parsing.
  const response = await callClaude<Record<string, unknown>>({
    model: 'claude-sonnet-4-5-20250929',
    systemPrompt: COMPARISON_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 4096,
    useJsonMode: true,
    cacheSystemPrompt: true,
  });

  // Build comparison from parsed JSON response
  const comparison = buildComparisonFromParsed(
    response.content,
    snapshotId,
    snapshot.name,
  );

  // Cache the result
  snapshotManager.cacheComparison(snapshotId, stateHash, comparison);

  console.log(
    `[SnapshotComparator] Comparison complete: ${comparison.paragraphDeltas.length} paragraph deltas, ` +
    `${comparison.structuralDelta.gainedConnections.length} gained + ` +
    `${comparison.structuralDelta.lostConnections.length} lost connections`
  );

  return comparison;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Hash the current essay state for cache key generation.
 * Uses a subset of state for efficiency — text + finding IDs + connection IDs.
 */
export function hashCurrentState(state: CurrentEssayState): string {
  const hashInput = [
    state.text,
    state.understanding.findings.map(f => `${f.id}:${f.maturity}`).join(','),
    state.understanding.connections.map(c => `${c.id}:${c.status}`).join(','),
    state.understanding.maturity,
  ].join('|');

  return createHash('sha256').update(hashInput).digest('hex').slice(0, 16);
}

/**
 * Build a SnapshotComparison from parsed LLM JSON response.
 * Handles missing or malformed fields gracefully with defaults.
 */
function buildComparisonFromParsed(
  parsed: Record<string, unknown>,
  snapshotId: string,
  snapshotName: string,
): SnapshotComparison {
  const sd = (parsed.structuralDelta ?? {}) as Record<string, unknown>;
  const fd = (parsed.findingDelta ?? {}) as Record<string, unknown>;

  return {
    snapshotId,
    snapshotName,
    comparedAt: new Date().toISOString(),
    analysis: String(parsed.analysis ?? ''),
    paragraphDeltas: Array.isArray(parsed.paragraphDeltas)
      ? (parsed.paragraphDeltas as SnapshotComparison['paragraphDeltas'])
      : [],
    structuralDelta: {
      lostConnections: Array.isArray(sd.lostConnections)
        ? (sd.lostConnections as SnapshotComparison['structuralDelta']['lostConnections'])
        : [],
      gainedConnections: Array.isArray(sd.gainedConnections)
        ? (sd.gainedConnections as SnapshotComparison['structuralDelta']['gainedConnections'])
        : [],
      changedConnections: Array.isArray(sd.changedConnections)
        ? (sd.changedConnections as SnapshotComparison['structuralDelta']['changedConnections'])
        : [],
      architecturalAssessment: String(sd.architecturalAssessment ?? ''),
    },
    findingDelta: {
      newFindings: Array.isArray(fd.newFindings)
        ? (fd.newFindings as string[])
        : [],
      supersededFindings: Array.isArray(fd.supersededFindings)
        ? (fd.supersededFindings as SnapshotComparison['findingDelta']['supersededFindings'])
        : [],
      maturityDifferences: Array.isArray(fd.maturityDifferences)
        ? (fd.maturityDifferences as Array<{
            findingId: string;
            snapshotMaturity: FindingMaturity;
            currentMaturity: FindingMaturity;
          }>)
        : [],
    },
    coachingImplications: String(parsed.coachingImplications ?? ''),
  };
}
