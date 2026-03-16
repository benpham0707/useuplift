/**
 * Connection Context Builder — Serializes connection graph for LLM prompts.
 *
 * Converts the ConnectionGraph into human-readable text sections for injection
 * into walk, synthesis, and analysis prompts. Respects token budgets.
 */

import type { Connection, ConnectionRoutingTag } from '../profileTypes';
import { ConnectionGraph } from './connectionGraph';

// ============================================================================
// CONTEXT BUILDING
// ============================================================================

/**
 * Build full connection context for L3.75 holistic synthesis.
 * Includes: adjacency view, hub analysis, island detection, graph summary.
 */
export function buildHolisticConnectionContext(
  graph: ConnectionGraph,
  totalParagraphs: number,
): string {
  const sections: string[] = [];

  // Adjacency view
  sections.push(graph.toAdjacencyContext());

  // Hub analysis
  const hubs = graph.getHubs();
  if (hubs.length > 0) {
    const hubLines = hubs
      .filter(h => h.strongCount > 0)
      .slice(0, 5)
      .map(h => `  P${h.paragraph}: ${h.connectionCount} connections (${h.strongCount} strong)`);
    if (hubLines.length > 0) {
      sections.push(`\nHub paragraphs:\n${hubLines.join('\n')}`);
    }
  }

  // Structural islands
  const islands = graph.findStructuralIslands(totalParagraphs);
  if (islands.length > 0) {
    sections.push(`\nStructural islands (no strong connections): ${islands.map(i => `P${i}`).join(', ')}`);
  }

  return sections.join('\n');
}

/**
 * Build connection context for a specific paragraph (used in walk prompts).
 * Shows connections that involve this paragraph, with endpoints labeled.
 */
export function buildParagraphConnectionContext(
  graph: ConnectionGraph,
  paragraphIndex: number,
): string {
  const connections = graph.getByParagraph(paragraphIndex);
  if (connections.length === 0) return '';

  const lines = connections.map(c => {
    const dir = c.directionality === 'bidirectional' ? '<->'
      : c.directionality === 'reverse' ? '<-'
      : '->';
    const from = formatEndpoint(c.from);
    const to = formatEndpoint(c.to);
    const tags = c.routingTags.join(',');
    const strength = c.strengthCategory[0].toUpperCase();
    const reverse = c.reverseIllumination
      ? ` | reverse: ${c.reverseIllumination.slice(0, 80)}`
      : '';
    return `  ${c.id}: ${from} ${dir} ${to} [${tags}] (${strength}) -- ${c.description.slice(0, 100)}${reverse}`;
  });

  return `Connections involving P${paragraphIndex} (${connections.length}):\n${lines.join('\n')}`;
}

/**
 * Build scout lead context — tentative connections for the walk to investigate.
 */
export function buildScoutLeadContext(
  graph: ConnectionGraph,
  paragraphIndex: number,
): string {
  const leads = graph.getByParagraph(paragraphIndex)
    .filter(c => c.discoveredBy === 'scout' && c.strengthCategory === 'tentative');

  if (leads.length === 0) return '';

  const lines = leads.map(c => {
    const otherEndpoint = c.from.paragraph === paragraphIndex ? c.to : c.from;
    return `  ${c.id}: possible connection to ${formatEndpoint(otherEndpoint)} — ${c.description}`;
  });

  return `Scout leads to investigate:\n${lines.join('\n')}`;
}

/**
 * Build revalidation context — connections affected by an edit.
 */
export function buildRevalidationContext(
  graph: ConnectionGraph,
  editedParagraph: number,
): string {
  const { immediate, deferred } = graph.getRevalidationCandidates(editedParagraph);

  if (immediate.length === 0 && deferred.length === 0) {
    return 'No connections affected by this edit.';
  }

  const sections: string[] = [];

  if (immediate.length > 0) {
    sections.push('Connections requiring IMMEDIATE revalidation:');
    for (const c of immediate) {
      const otherEndpoint = c.from.paragraph === editedParagraph ? c.to : c.from;
      sections.push(
        `  ${c.id} (${c.strengthCategory}): ${formatEndpoint(c.from)} → ${formatEndpoint(c.to)}\n` +
        `    Description: ${c.description}\n` +
        `    Other endpoint: ${formatEndpoint(otherEndpoint)}\n` +
        `    Tags: [${c.routingTags.join(', ')}]`,
      );
    }
  }

  if (deferred.length > 0) {
    sections.push(`\n${deferred.length} weaker connections flagged for deferred review: ${deferred.map(c => c.id).join(', ')}`);
  }

  return sections.join('\n');
}

/**
 * Build compact connection context for the ProfileIndex connection graph.
 * Used in the analysis pass and other prompts that get the full index.
 */
export function buildCompactConnectionContext(
  connections: Connection[],
): string {
  const active = connections.filter(c => c.status === 'active');
  if (active.length === 0) return 'No active connections.';

  const lines = active.map(c => {
    const from = formatEndpoint(c.from);
    const to = formatEndpoint(c.to);
    const reverse = c.reverseIllumination
      ? ` | reverse: ${c.reverseIllumination.slice(0, 80)}`
      : '';
    return `  ${from} → ${to}: ${c.description.slice(0, 80)} [${c.routingTags.join(',')}] (${c.strengthCategory})${reverse}`;
  });

  return `Active connections (${active.length}):\n${lines.join('\n')}`;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatEndpoint(ep: { paragraph: number; sentence?: number; label?: string }): string {
  if (ep.sentence !== undefined) {
    return `P${ep.paragraph}S${ep.sentence}`;
  }
  return `P${ep.paragraph}`;
}
