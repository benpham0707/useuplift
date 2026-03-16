/**
 * ConnectionGraph — Pure Data Management + Graph Analysis
 *
 * The connection graph is the essay's architectural DNA: a bidirectional,
 * strength-aware network that reveals how the parts serve the whole.
 *
 * This class owns CRUD operations, graph queries, and structural analysis.
 * It does NOT make LLM calls — it is pure data infrastructure.
 *
 * Key invariants:
 * - Connections are NEVER deleted (Rule 2: never discard paid output)
 * - Invalidated connections preserve their reason
 * - All queries on "active" connections filter by status === 'active'
 * - IDs are unique and sequential within a session
 */

import type {
  Connection,
  ConnectionEndpoint,
  ConnectionRoutingTag,
  ConnectionStrengthCategory,
  ConnectionDirectionality,
  ConnectionSource,
} from '../profileTypes';

// ============================================================================
// CONNECTION GRAPH
// ============================================================================

export class ConnectionGraph {
  private connections: Map<string, Connection> = new Map();
  private nextId: number = 1;

  /**
   * Initialize from an existing connection array (e.g., from a profile snapshot).
   * Sets the ID counter past any existing IDs to prevent collisions.
   */
  static fromArray(connections: Connection[]): ConnectionGraph {
    const graph = new ConnectionGraph();
    for (const conn of connections) {
      graph.connections.set(conn.id, conn);

      // Track highest numeric suffix to avoid ID collisions
      const match = conn.id.match(/^C(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= graph.nextId) {
          graph.nextId = num + 1;
        }
      }
    }
    return graph;
  }

  /** Generate a unique connection ID. */
  generateId(): string {
    return `C${this.nextId++}`;
  }

  /** Get all connections (including invalidated). */
  getAll(): Connection[] {
    return Array.from(this.connections.values());
  }

  /** Add a connection with referential integrity validation. */
  add(connection: Connection): void {
    if (this.connections.has(connection.id)) {
      console.warn(`[ConnectionGraph] Duplicate connection ID: ${connection.id} — overwriting`);
    }
    this.connections.set(connection.id, connection);
  }

  /** Get a connection by ID. */
  get(id: string): Connection | undefined {
    return this.connections.get(id);
  }

  /** Get all active connections. */
  getActive(): Connection[] {
    return Array.from(this.connections.values())
      .filter(c => c.status === 'active');
  }

  /** Get connections involving a specific paragraph (active only). */
  getByParagraph(paragraph: number): Connection[] {
    return this.getActive().filter(c =>
      c.from.paragraph === paragraph || c.to.paragraph === paragraph,
    );
  }

  /** Get connections involving a specific sentence (active only). */
  getBySentence(paragraph: number, sentence: number): Connection[] {
    return this.getActive().filter(c =>
      (c.from.paragraph === paragraph && c.from.sentence === sentence) ||
      (c.to.paragraph === paragraph && c.to.sentence === sentence),
    );
  }

  /**
   * Get connections by routing tag — for operational decisions.
   * Example: getByTag('structural') returns all load-bearing connections.
   */
  getByTag(tag: ConnectionRoutingTag): Connection[] {
    return this.getActive().filter(c => c.routingTags.includes(tag));
  }

  /**
   * Get connections by strength category — for edit triage.
   * After editing P3, what connections need revalidation?
   */
  getRevalidationCandidates(editedParagraph: number): {
    immediate: Connection[];  // foundational + significant
    deferred: Connection[];   // supporting + tentative
  } {
    const affected = this.getByParagraph(editedParagraph);
    return {
      immediate: affected.filter(c =>
        c.strengthCategory === 'foundational' || c.strengthCategory === 'significant',
      ),
      deferred: affected.filter(c =>
        c.strengthCategory === 'supporting' || c.strengthCategory === 'tentative',
      ),
    };
  }

  /**
   * Invalidate a connection — mark as invalidated with reason.
   * Never deletes (Rule 2).
   */
  invalidate(id: string, reason: string, trigger: string): void {
    const conn = this.connections.get(id);
    if (!conn) {
      console.error(`[ConnectionGraph] Cannot invalidate: connection ${id} not found`);
      return;
    }
    conn.status = 'invalidated';
    conn.invalidation = {
      reason,
      invalidatedAt: new Date().toISOString(),
      trigger,
    };
  }

  /**
   * Mark a connection as under review (e.g., after a related finding changes).
   */
  markUnderReview(id: string): void {
    const conn = this.connections.get(id);
    if (!conn) return;
    conn.status = 'under_review';
  }

  /**
   * Reactivate a connection after review confirms it's still valid.
   */
  reactivate(id: string): void {
    const conn = this.connections.get(id);
    if (!conn) return;
    conn.status = 'active';
    conn.invalidation = undefined;
  }

  /**
   * Update a connection's strength, description, or routing tags.
   * Used when a later layer enriches an earlier connection.
   */
  update(
    id: string,
    updates: Partial<Pick<Connection,
      'description' | 'reverseIllumination' | 'significance' |
      'strengthCategory' | 'directionality' | 'routingTags' | 'relatedFindings'
    >>,
  ): void {
    const conn = this.connections.get(id);
    if (!conn) {
      console.error(`[ConnectionGraph] Cannot update: connection ${id} not found`);
      return;
    }
    Object.assign(conn, updates);
  }

  /**
   * Identify structural islands — paragraphs with no strong connections.
   * System-computed from graph structure (not LLM judgment).
   */
  findStructuralIslands(totalParagraphs: number): number[] {
    const connectedParagraphs = new Set<number>();
    for (const c of this.getActive()) {
      if (c.strengthCategory === 'foundational' || c.strengthCategory === 'significant') {
        connectedParagraphs.add(c.from.paragraph);
        connectedParagraphs.add(c.to.paragraph);
      }
    }
    const islands: number[] = [];
    for (let i = 0; i < totalParagraphs; i++) {
      if (!connectedParagraphs.has(i)) islands.push(i);
    }
    return islands;
  }

  /**
   * Compute hub paragraphs — paragraphs with the most connections.
   * These are the essay's architectural centers.
   */
  getHubs(): Array<{ paragraph: number; connectionCount: number; strongCount: number }> {
    const counts: Record<number, { total: number; strong: number }> = {};
    for (const c of this.getActive()) {
      for (const p of [c.from.paragraph, c.to.paragraph]) {
        if (!counts[p]) counts[p] = { total: 0, strong: 0 };
        counts[p].total++;
        if (c.strengthCategory === 'foundational' || c.strengthCategory === 'significant') {
          counts[p].strong++;
        }
      }
    }
    return Object.entries(counts)
      .map(([p, c]) => ({ paragraph: parseInt(p, 10), connectionCount: c.total, strongCount: c.strong }))
      .sort((a, b) => b.strongCount - a.strongCount);
  }

  /**
   * Build adjacency representation for the LLM context.
   * Compact format that lets the LLM see the graph structure.
   */
  toAdjacencyContext(): string {
    const active = this.getActive();
    if (active.length === 0) return 'No connections discovered yet.';

    const lines: string[] = [];
    for (const c of active) {
      const dir = c.directionality === 'bidirectional' ? '<->'
        : c.directionality === 'reverse' ? '<-'
        : '->';
      const from = c.from.sentence !== undefined
        ? `P${c.from.paragraph}S${c.from.sentence}`
        : `P${c.from.paragraph}`;
      const to = c.to.sentence !== undefined
        ? `P${c.to.paragraph}S${c.to.sentence}`
        : `P${c.to.paragraph}`;
      const tags = c.routingTags.join(',');
      const strength = c.strengthCategory[0].toUpperCase(); // F/S/S/T
      lines.push(`  ${c.id}: ${from} ${dir} ${to} [${tags}] (${strength}) -- ${c.description.slice(0, 120)}`);
    }
    return `Connection graph (${active.length} active):\n${lines.join('\n')}`;
  }

  /** Total count of active connections. */
  get activeCount(): number {
    return this.getActive().length;
  }

  /** Total count of all connections (including invalidated). */
  get totalCount(): number {
    return this.connections.size;
  }

  /**
   * Deduplicate reversed connections — one-time cleanup for profiles
   * created before W0.2 where A→B and B→A may exist as separate connections.
   *
   * For each pair where connection A has from→to and connection B has to→from
   * (same paragraphs), merge them:
   * - Combine routing tags (union)
   * - Keep the stronger strengthCategory (foundational > significant > supporting > tentative)
   * - Set directionality to 'bidirectional' on the kept connection
   * - Populate reverseIllumination from the weaker connection's description if the kept one lacks it
   * - Mark the weaker/duplicate with status: 'superseded'
   *
   * @returns The number of connections merged (superseded)
   */
  deduplicateReversedConnections(): number {
    const STRENGTH_ORDER: Record<ConnectionStrengthCategory, number> = {
      foundational: 3,
      significant: 2,
      supporting: 1,
      tentative: 0,
    };

    const active = this.getActive();
    const processed = new Set<string>();
    let mergedCount = 0;

    for (let i = 0; i < active.length; i++) {
      const a = active[i];
      if (processed.has(a.id)) continue;

      for (let j = i + 1; j < active.length; j++) {
        const b = active[j];
        if (processed.has(b.id)) continue;

        // Check if A's from→to matches B's to→from (same paragraphs, reversed)
        const isReversed =
          a.from.paragraph === b.to.paragraph &&
          a.to.paragraph === b.from.paragraph;

        if (!isReversed) continue;

        // Determine which is stronger
        const strengthA = STRENGTH_ORDER[a.strengthCategory] ?? 0;
        const strengthB = STRENGTH_ORDER[b.strengthCategory] ?? 0;
        const [kept, weaker] = strengthA >= strengthB ? [a, b] : [b, a];

        // Merge routing tags (union)
        const mergedTags = new Set<ConnectionRoutingTag>([
          ...kept.routingTags,
          ...weaker.routingTags,
        ]);
        kept.routingTags = Array.from(mergedTags);

        // Set bidirectional
        kept.directionality = 'bidirectional';

        // Populate reverseIllumination from weaker's description if kept lacks it
        if (!kept.reverseIllumination && weaker.description) {
          kept.reverseIllumination = weaker.description;
        }

        // Mark weaker as superseded
        weaker.status = 'superseded';
        weaker.invalidation = {
          reason: `Merged into ${kept.id} as bidirectional connection`,
          invalidatedAt: new Date().toISOString(),
          trigger: 'deduplicate_reversed_connections',
        };

        processed.add(weaker.id);
        mergedCount++;

        // A can only match one reverse; break inner loop
        break;
      }
    }

    if (mergedCount > 0) {
      console.log(`[ConnectionGraph] Deduplicated ${mergedCount} reversed connection pair(s)`);
    }

    return mergedCount;
  }
}

// ============================================================================
// HELPERS — Connection Factory
// ============================================================================

/**
 * Create a V2 Connection from walk/synthesis output.
 * System fills in: id, routingTags, discoveredBy, status, relatedFindings, createdAt.
 */
export function createConnection(
  graph: ConnectionGraph,
  input: {
    from: ConnectionEndpoint;
    to: ConnectionEndpoint;
    description: string;
    reverseIllumination: string | null;
    significance: string;
    strengthCategory: ConnectionStrengthCategory;
    directionality: ConnectionDirectionality;
    discoveredBy: ConnectionSource;
    routingTags?: ConnectionRoutingTag[];
    relatedFindings?: string[];
  },
): Connection {
  const connection: Connection = {
    id: graph.generateId(),
    from: input.from,
    to: input.to,
    description: input.description,
    reverseIllumination: input.reverseIllumination,
    routingTags: input.routingTags ?? inferRoutingTags(input.description),
    significance: input.significance,
    strengthCategory: input.strengthCategory,
    directionality: input.directionality,
    discoveredBy: input.discoveredBy,
    status: 'active',
    relatedFindings: input.relatedFindings ?? [],
    createdAt: new Date().toISOString(),
  };
  graph.add(connection);
  return connection;
}

/**
 * Infer routing tags from description text.
 * Simple keyword heuristic — the LLM's description is the source of truth,
 * but the system needs functional tags for routing decisions.
 */
function inferRoutingTags(description: string): ConnectionRoutingTag[] {
  const tags: ConnectionRoutingTag[] = [];
  const lower = description.toLowerCase();

  // Structural: dependency, breaks, load-bearing, remove/removing
  if (/\b(depend|break|load.?bearing|remov|without|structural|needs?)\b/.test(lower)) {
    tags.push('structural');
  }

  // Earning: earn, setup, payoff, evidence, credibility, support, demonstrate
  if (/\b(earn|setup|payoff|evidence|credib|demonstrat|concrete|support)\b/.test(lower)) {
    tags.push('earning');
  }

  // Thematic: theme, echo, recur, vocabulary, image, thread, motif
  if (/\b(thema|echo|recur|vocabular|image|thread|motif|register|bookend)\b/.test(lower)) {
    tags.push('thematic');
  }

  // Contrastive: contrast, tension, opposition, paradox, irony, shift, inversion
  if (/\b(contrast|tension|opposit|paradox|iron|shift|inversion|juxtapos)\b/.test(lower)) {
    tags.push('contrastive');
  }

  return tags;
}
