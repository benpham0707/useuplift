/**
 * ConnectionMutator — V2 Connection CRUD + Referential Integrity
 *
 * `connections.all[]` is THE canonical connection store. Every connection has a
 * unique ID, `ConnectionEndpoint` from/to, routing tags, strength category,
 * directionality, and a free-form LLM description.
 *
 * V2 connections are append-only with status tracking: instead of removing
 * connections, they are invalidated (status → 'invalidated' with reason).
 * Querying active connections means filtering to `status === 'active'`.
 *
 * Sentences reference connections via `connectionRefs: string[]` -- lightweight
 * ID arrays, not embedded descriptions. Paragraph-level endpoints (where
 * `sentence` is undefined) do NOT create sentence-level connectionRefs.
 *
 * When adding a connection, the ConnectionMutator also adds connectionRef IDs
 * to both endpoint sentences (if sentence-level). When invalidating, it cleans
 * up those refs.
 *
 * Image recurrences and narrative arc map are DERIVED views of connection data.
 *
 * Profile Manager spec: docs/plan-sections/04-profile-manager.md
 */

import type {
  EssayProfile,
  Connection,
  ConnectionEndpoint,
  ConnectionRoutingTag,
  ConnectionStrengthCategory,
  ConnectionDirectionality,
  ConnectionSource,
  ConnectionScoutOutput,
  MutationType,
} from '../../profileTypes';

import { SentenceMutator } from './sentenceMutator';

// ============================================================================
// ID GENERATION
// ============================================================================

// Note: connectionIdCounter was previously a module-level variable, shared
// across all sessions in a long-running server. It is now an instance field
// on ConnectionMutator — each coordinator (and therefore each session) gets
// its own counter, preventing cross-session ID leakage.

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if two ConnectionEndpoints match (same paragraph + sentence pair).
 * Two paragraph-level endpoints (both sentence undefined) at the same
 * paragraph are considered matching.
 */
function endpointsMatch(
  a: ConnectionEndpoint,
  b: ConnectionEndpoint,
): boolean {
  return a.paragraph === b.paragraph && a.sentence === b.sentence;
}

/**
 * Check if a ConnectionEndpoint is valid within the profile.
 * Paragraph-level endpoints (sentence undefined) are valid as long as
 * the paragraph index is in bounds.
 */
function isValidEndpoint(
  profile: EssayProfile,
  endpoint: ConnectionEndpoint,
): boolean {
  if (endpoint.paragraph < 0 || endpoint.paragraph >= profile.paragraphs.length) {
    return false;
  }
  // Paragraph-level endpoint — no sentence to validate
  if (endpoint.sentence === undefined) {
    return true;
  }
  const para = profile.paragraphs[endpoint.paragraph];
  if (endpoint.sentence < 0 || endpoint.sentence >= para.sentences.length) {
    return false;
  }
  return true;
}

/**
 * Strength ordering for upgrade comparisons (higher = stronger).
 * Used by isDuplicate to upgrade scout leads when walk rediscovers them.
 */
const STRENGTH_ORDER: Record<ConnectionStrengthCategory, number> = {
  foundational: 3,
  significant: 2,
  supporting: 1,
  tentative: 0,
};

/**
 * Check if a connection is a duplicate of an existing active one.
 * Checks both endpoint orderings:
 * - Forward match: from===from && to===to
 * - Reverse match: from===to && to===from (W0.2 fix)
 *
 * W3.3c: Returns metadata without mutating the connection. The caller
 * is responsible for updating directionality and descriptions based on
 * the isReverse flag.
 *
 * Only checks active connections — invalidated ones are ignored.
 *
 * @returns { connection, isReverse } — the matched connection and whether it was a reverse match
 */
function isDuplicate(
  existing: Connection[],
  from: ConnectionEndpoint,
  to: ConnectionEndpoint,
): { connection: Connection | null; isReverse: boolean } {
  for (const conn of existing) {
    if (conn.status !== 'active') continue;

    // Forward match: same from+to
    if (endpointsMatch(conn.from, from) && endpointsMatch(conn.to, to)) {
      return { connection: conn, isReverse: false };
    }

    // Reverse match: from===to && to===from (W0.2)
    if (endpointsMatch(conn.from, to) && endpointsMatch(conn.to, from)) {
      return { connection: conn, isReverse: true };
    }
  }
  return { connection: null, isReverse: false };
}

/**
 * Format a ConnectionEndpoint for error messages.
 */
function formatEndpoint(endpoint: ConnectionEndpoint): string {
  if (endpoint.sentence === undefined) {
    return `[P${endpoint.paragraph}]`;
  }
  return `[P${endpoint.paragraph}, S${endpoint.sentence}]`;
}

// ============================================================================
// CONNECTION MUTATOR
// ============================================================================

export class ConnectionMutator {
  private sentenceMutator: SentenceMutator;
  /** Per-instance counter for generating unique connection IDs. */
  private connectionIdCounter = 0;

  constructor(sentenceMutator: SentenceMutator) {
    this.sentenceMutator = sentenceMutator;
  }

  /**
   * Generate a unique connection ID.
   * Format: conn_{timestamp_base36}_{counter_base36}
   * Uses an instance counter (not module-level) so each session gets its own sequence.
   */
  private generateConnectionId(): string {
    this.connectionIdCounter++;
    const timestamp = Date.now().toString(36);
    const counter = this.connectionIdCounter.toString(36).padStart(4, '0');
    return `conn_${timestamp}_${counter}`;
  }

  /**
   * Add a new V2 connection. Generates unique ID if not provided.
   * Validates: unique ID, valid endpoints, no duplicates (same from+to).
   *
   * If a duplicate is found (same from + to endpoints among active connections),
   * the EXISTING connection's description and fields are updated instead of
   * creating a new one.
   *
   * Also adds connectionRef IDs to both endpoint sentences (sentence-level only).
   * Paragraph-level endpoints (sentence undefined) do NOT get connectionRefs.
   *
   * @returns The connection ID and MutationType[]
   */
  addConnection(
    profile: EssayProfile,
    connection: {
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
  ): { connectionId: string; mutations: MutationType[] } {
    // Validate endpoints
    const endpointErrors = this.validateEndpoints(profile, connection.from, connection.to);
    if (endpointErrors.length > 0) {
      console.error(
        `[ConnectionMutator] addConnection endpoint validation failed:`,
        endpointErrors,
      );
      return { connectionId: '', mutations: [] };
    }

    // Check for duplicate (same from + to endpoints among active connections)
    const { connection: existingConn, isReverse } = isDuplicate(
      profile.connections.all,
      connection.from,
      connection.to,
    );

    if (existingConn) {
      // Duplicate found -- update the existing connection's fields instead.
      if (isReverse) {
        // W3.3c: Reverse match (B→A found when adding A→B) — upgrade to bidirectional.
        // Preserve original description, store new description as reverseIllumination.
        existingConn.directionality = 'bidirectional';
        if (!existingConn.reverseIllumination && connection.description) {
          existingConn.reverseIllumination = connection.description;
        }
        // Do NOT overwrite existingConn.description — the original direction's description is preserved.
      } else {
        // Forward duplicate — update description with the newer one.
        existingConn.description = connection.description;
      }
      if (connection.reverseIllumination !== undefined) {
        existingConn.reverseIllumination = connection.reverseIllumination;
      }
      if (connection.significance !== undefined) {
        existingConn.significance = connection.significance;
      }
      // W2.1: Only upgrade strength, never downgrade
      if (connection.strengthCategory !== undefined) {
        const existingStrength = STRENGTH_ORDER[existingConn.strengthCategory] ?? 0;
        const newStrength = STRENGTH_ORDER[connection.strengthCategory] ?? 0;
        if (newStrength > existingStrength) {
          existingConn.strengthCategory = connection.strengthCategory;
        }
      }
      // W2.1: Upgrade discoveredBy from scout to walk/synthesis
      if (existingConn.discoveredBy === 'scout' && connection.discoveredBy !== 'scout') {
        existingConn.discoveredBy = connection.discoveredBy;
      }
      if (connection.routingTags !== undefined) {
        existingConn.routingTags = connection.routingTags;
      }
      return { connectionId: existingConn.id, mutations: ['connection_added'] };
    }

    // Generate unique ID
    const connectionId = this.generateConnectionId();

    // Ensure ID is unique (should always be, but defensive)
    const existingById = profile.connections.all.find((c) => c.id === connectionId);
    if (existingById) {
      console.error(
        `[ConnectionMutator] Generated duplicate connection ID: ${connectionId}`,
      );
      return { connectionId: '', mutations: [] };
    }

    // Create the V2 connection
    const newConnection: Connection = {
      id: connectionId,
      from: connection.from,
      to: connection.to,
      description: connection.description,
      reverseIllumination: connection.reverseIllumination,
      routingTags: connection.routingTags ?? [],
      significance: connection.significance,
      strengthCategory: connection.strengthCategory,
      directionality: connection.directionality,
      discoveredBy: connection.discoveredBy,
      status: 'active',
      relatedFindings: connection.relatedFindings ?? [],
      createdAt: new Date().toISOString(),
    };

    profile.connections.all.push(newConnection);

    // Add connectionRef to both endpoint sentences (sentence-level only)
    if (connection.from.sentence !== undefined) {
      this.sentenceMutator.addConnectionRef(
        profile,
        connection.from.paragraph,
        connection.from.sentence,
        connectionId,
      );
    }
    if (connection.to.sentence !== undefined) {
      this.sentenceMutator.addConnectionRef(
        profile,
        connection.to.paragraph,
        connection.to.sentence,
        connectionId,
      );
    }

    return { connectionId, mutations: ['connection_added'] };
  }

  /**
   * Add multiple connections in batch.
   * Matches the IConnectionMutator interface signature.
   *
   * Delegates to addConnection for each entry, collecting all generated IDs
   * and mutations. Returns the connection IDs in the same order as the input.
   *
   * @returns Object with all mutations and connectionIds (parallel arrays)
   */
  addConnections(
    profile: EssayProfile,
    connections: Array<{
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
    }>,
  ): { mutations: MutationType[]; connectionIds: string[] } {
    const allMutations: MutationType[] = [];
    const connectionIds: string[] = [];

    for (const conn of connections) {
      const result = this.addConnection(profile, conn);
      connectionIds.push(result.connectionId);
      for (const m of result.mutations) {
        if (!allMutations.includes(m)) {
          allMutations.push(m);
        }
      }
    }

    return { mutations: allMutations, connectionIds };
  }

  /**
   * Get connection IDs involving a specific sentence.
   * Only returns ACTIVE connections (invalidated ones are excluded).
   *
   * Searches all active connections for any that have the given sentence
   * as either a 'from' or 'to' endpoint.
   *
   * @returns Array of connection IDs involving the sentence
   */
  getConnectionsForSentence(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
  ): string[] {
    return profile.connections.all
      .filter(
        (c) =>
          c.status === 'active' &&
          (
            (c.from.paragraph === paragraphIndex && c.from.sentence === sentenceIndex) ||
            (c.to.paragraph === paragraphIndex && c.to.sentence === sentenceIndex)
          ),
      )
      .map((c) => c.id);
  }

  /**
   * Update an existing connection's V2 fields.
   */
  updateConnection(
    profile: EssayProfile,
    connectionId: string,
    updates: {
      description?: string;
      reverseIllumination?: string | null;
      significance?: string;
      strengthCategory?: ConnectionStrengthCategory;
      directionality?: ConnectionDirectionality;
      routingTags?: ConnectionRoutingTag[];
      relatedFindings?: string[];
      status?: 'active' | 'invalidated' | 'under_review' | 'superseded';
    },
  ): MutationType[] {
    const connection = profile.connections.all.find((c) => c.id === connectionId);
    if (!connection) {
      console.error(
        `[ConnectionMutator] updateConnection: connection ${connectionId} not found`,
      );
      return [];
    }

    if (updates.description !== undefined) {
      connection.description = updates.description;
    }
    if (updates.reverseIllumination !== undefined) {
      connection.reverseIllumination = updates.reverseIllumination;
    }
    if (updates.significance !== undefined) {
      connection.significance = updates.significance;
    }
    if (updates.strengthCategory !== undefined) {
      connection.strengthCategory = updates.strengthCategory;
    }
    if (updates.directionality !== undefined) {
      connection.directionality = updates.directionality;
    }
    if (updates.routingTags !== undefined) {
      connection.routingTags = updates.routingTags;
    }
    if (updates.relatedFindings !== undefined) {
      connection.relatedFindings = updates.relatedFindings;
    }
    if (updates.status !== undefined) {
      connection.status = updates.status;
    }

    return ['connection_added']; // Reuse same mutation type for updates
  }

  /**
   * Invalidate a connection (V2 soft-delete).
   * Instead of removing from the array, sets status → 'invalidated' with reason.
   * Cleans up connectionRefs from endpoint sentences.
   *
   * @param reason - Why the connection was invalidated
   * @param trigger - What caused the invalidation (e.g. 'edit_P3', 'coaching_correction')
   */
  invalidateConnection(
    profile: EssayProfile,
    connectionId: string,
    reason: string,
    trigger: string,
  ): MutationType[] {
    const connection = profile.connections.all.find(
      (c) => c.id === connectionId,
    );
    if (!connection) {
      console.error(
        `[ConnectionMutator] invalidateConnection: connection ${connectionId} not found`,
      );
      return [];
    }

    if (connection.status === 'invalidated') {
      // Already invalidated — no-op
      return [];
    }

    // Set invalidation metadata
    connection.status = 'invalidated';
    connection.invalidation = {
      reason,
      invalidatedAt: new Date().toISOString(),
      trigger,
    };

    // Clean up connectionRefs from both endpoint sentences (sentence-level only)
    if (connection.from.sentence !== undefined) {
      this.sentenceMutator.removeConnectionRef(
        profile,
        connection.from.paragraph,
        connection.from.sentence,
        connectionId,
      );
    }
    if (connection.to.sentence !== undefined) {
      this.sentenceMutator.removeConnectionRef(
        profile,
        connection.to.paragraph,
        connection.to.sentence,
        connectionId,
      );
    }

    return ['connection_invalidated'];
  }

  /**
   * Add scout leads from L2.5 categorized ConnectionScoutOutput.
   * Accepts the categorized format (repeatedElements, tonalShifts, structuralEchoes)
   * and flattens into provisional connections with 'tentative' strength.
   *
   * Scout leads are created with:
   * - strengthCategory: 'tentative' (not yet confirmed by L3)
   * - discoveredBy: 'scout'
   * - directionality: 'forward' (default for initial scouting)
   * - reverseIllumination: null (scout doesn't assess reverse direction)
   * - status: 'active'
   */
  addScoutLeads(
    profile: EssayProfile,
    scout: ConnectionScoutOutput,
  ): MutationType[] {
    const mutations: MutationType[] = [];

    // Repeated elements → pairwise connections between occurrences
    for (const elem of scout.repeatedElements) {
      for (let i = 0; i < elem.occurrences.length; i++) {
        for (let j = i + 1; j < elem.occurrences.length; j++) {
          const fromOcc = elem.occurrences[i];
          const toOcc = elem.occurrences[j];
          const result = this.addConnection(profile, {
            from: {
              paragraph: fromOcc.paragraphIndex,
              sentence: fromOcc.sentenceIndex,
              label: `"${elem.element}" occurrence ${i + 1}`,
            },
            to: {
              paragraph: toOcc.paragraphIndex,
              sentence: toOcc.sentenceIndex,
              label: `"${elem.element}" occurrence ${j + 1}`,
            },
            description: `Repeated element "${elem.element}": ${elem.potentialSignificance}`,
            reverseIllumination: null,
            significance: elem.potentialSignificance,
            strengthCategory: 'tentative',
            directionality: 'forward',
            discoveredBy: 'scout',
            routingTags: ['thematic'],
            relatedFindings: [],
          });
          if (result.connectionId && result.mutations.length > 0) {
            for (const m of result.mutations) {
              if (!mutations.includes(m)) mutations.push(m);
            }
          }
        }
      }
    }

    // Structural echoes → source-to-echo connections
    for (const echo of scout.structuralEchoes) {
      const result = this.addConnection(profile, {
        from: {
          paragraph: echo.source.paragraphIndex,
          sentence: echo.source.sentenceIndex,
          label: `Echo source`,
        },
        to: {
          paragraph: echo.echo.paragraphIndex,
          sentence: echo.echo.sentenceIndex,
          label: `Echo: ${echo.echoType}`,
        },
        description: `Structural echo: ${echo.echoType}`,
        reverseIllumination: null,
        significance: `Structural echo detected: ${echo.echoType}`,
        strengthCategory: 'tentative',
        directionality: 'forward',
        discoveredBy: 'scout',
        routingTags: ['structural'],
        relatedFindings: [],
      });
      if (result.connectionId && result.mutations.length > 0) {
        for (const m of result.mutations) {
          if (!mutations.includes(m)) mutations.push(m);
        }
      }
    }

    // Tonal shifts are noted but don't create cross-paragraph connections
    // (they mark a location, not a pair). The coordinator handles these separately.

    return mutations;
  }

  /**
   * Update image recurrences derived view.
   * Image recurrences track where images/metaphors recur across the essay.
   * This is a DERIVED view -- the canonical data is in connections.all[].
   */
  updateImageRecurrences(
    profile: EssayProfile,
    recurrences: Array<{
      image: string;
      locations: Array<[number, number]>;
      connectionRefs: string[];
    }>,
  ): void {
    // Map to ProfileConnections.imageRecurrences format (no connectionRefs in type)
    profile.connections.imageRecurrences = recurrences.map((r) => ({
      image: r.image,
      locations: r.locations,
    }));
  }

  /**
   * Update narrative arc map derived view.
   * The narrative arc map identifies which sentences play which arc roles.
   */
  updateNarrativeArcMap(
    profile: EssayProfile,
    arcMap: Array<{
      role: string;
      location: [number, number];
      connectionRef?: string;
    }>,
  ): void {
    profile.connections.narrativeArcMap = arcMap.map((entry) => ({
      role: entry.role,
      location: entry.location,
    }));
  }

  /**
   * Validate all connections: unique IDs, valid endpoints, no orphaned refs.
   * Only validates ACTIVE connections for endpoint-ref consistency.
   * Invalidated connections are checked for ID uniqueness but not ref integrity.
   */
  validate(profile: EssayProfile): string[] {
    const errors: string[] = [];

    // Check unique IDs
    const seenIds = new Set<string>();
    for (const conn of profile.connections.all) {
      if (seenIds.has(conn.id)) {
        errors.push(`Duplicate connection ID: ${conn.id}`);
      }
      seenIds.add(conn.id);
    }

    // Check valid endpoints (all connections, regardless of status)
    for (const conn of profile.connections.all) {
      if (!isValidEndpoint(profile, conn.from)) {
        errors.push(
          `Connection ${conn.id}: invalid from endpoint ${formatEndpoint(conn.from)}`,
        );
      }
      if (!isValidEndpoint(profile, conn.to)) {
        errors.push(
          `Connection ${conn.id}: invalid to endpoint ${formatEndpoint(conn.to)}`,
        );
      }
    }

    // Check for orphaned connectionRefs on sentences
    const validConnectionIds = new Set(
      profile.connections.all.map((c) => c.id),
    );

    for (const para of profile.paragraphs) {
      for (const sentence of para.sentences) {
        if (sentence.understanding) {
          for (const ref of sentence.understanding.connectionRefs) {
            if (!validConnectionIds.has(ref)) {
              errors.push(
                `Orphaned connectionRef "${ref}" on sentence [P${para.index}, S${sentence.index}]`,
              );
            }
          }
        }
      }
    }

    // Check that active connection endpoints have the connectionRef (sentence-level only)
    for (const conn of profile.connections.all) {
      if (conn.status !== 'active') continue;

      // From endpoint
      if (conn.from.sentence !== undefined && isValidEndpoint(profile, conn.from)) {
        const fromSentence =
          profile.paragraphs[conn.from.paragraph].sentences[conn.from.sentence];
        if (
          fromSentence.understanding &&
          !fromSentence.understanding.connectionRefs.includes(conn.id)
        ) {
          errors.push(
            `Connection ${conn.id}: from endpoint ${formatEndpoint(conn.from)} missing connectionRef`,
          );
        }
      }

      // To endpoint
      if (conn.to.sentence !== undefined && isValidEndpoint(profile, conn.to)) {
        const toSentence =
          profile.paragraphs[conn.to.paragraph].sentences[conn.to.sentence];
        if (
          toSentence.understanding &&
          !toSentence.understanding.connectionRefs.includes(conn.id)
        ) {
          errors.push(
            `Connection ${conn.id}: to endpoint ${formatEndpoint(conn.to)} missing connectionRef`,
          );
        }
      }
    }

    return errors;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Validate that both endpoints are valid locations in the profile.
   */
  private validateEndpoints(
    profile: EssayProfile,
    from: ConnectionEndpoint,
    to: ConnectionEndpoint,
  ): string[] {
    const errors: string[] = [];

    if (!isValidEndpoint(profile, from)) {
      errors.push(
        `Invalid from endpoint: ${formatEndpoint(from)}`,
      );
    }
    if (!isValidEndpoint(profile, to)) {
      errors.push(
        `Invalid to endpoint: ${formatEndpoint(to)}`,
      );
    }

    return errors;
  }
}
