/**
 * ConnectionMutator — Connection CRUD + Referential Integrity
 *
 * `connections.all[]` is THE canonical connection store. Every connection has a
 * unique ID, typed endpoints, a connection type, and a description.
 *
 * Sentences reference connections via `connectionRefs: string[]` -- lightweight
 * ID arrays, not embedded descriptions.
 *
 * When adding a connection, the ConnectionMutator also adds connectionRef IDs
 * to both endpoint sentences. When removing, it cleans up those refs.
 *
 * Image recurrences and narrative arc map are DERIVED views of connection data.
 *
 * Profile Manager spec: docs/plan-sections/04-profile-manager.md
 */

import type {
  EssayProfile,
  Connection,
  MutationType,
} from '../../profileTypes';

import { SentenceMutator } from './sentenceMutator';

// ============================================================================
// ID GENERATION
// ============================================================================

/** Counter for generating unique connection IDs within a session */
let connectionIdCounter = 0;

/**
 * Generate a unique connection ID.
 * Format: conn_{timestamp_base36}_{counter_base36}
 * This avoids external dependencies (no nanoid needed) while ensuring uniqueness.
 */
function generateConnectionId(): string {
  connectionIdCounter++;
  const timestamp = Date.now().toString(36);
  const counter = connectionIdCounter.toString(36).padStart(4, '0');
  return `conn_${timestamp}_${counter}`;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if two endpoints match (same [paragraph, sentence] pair).
 */
function endpointsMatch(
  a: [number, number],
  b: [number, number],
): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/**
 * Check if an endpoint [paragraph, sentence] is valid within the profile.
 */
function isValidEndpoint(
  profile: EssayProfile,
  endpoint: [number, number],
): boolean {
  const [paragraphIndex, sentenceIndex] = endpoint;
  if (paragraphIndex < 0 || paragraphIndex >= profile.paragraphs.length) {
    return false;
  }
  const para = profile.paragraphs[paragraphIndex];
  if (sentenceIndex < 0 || sentenceIndex >= para.sentences.length) {
    return false;
  }
  return true;
}

/**
 * Check if a connection is a duplicate of an existing one.
 * Duplicate = same from + same to + same type.
 */
function isDuplicate(
  existing: Connection[],
  from: [number, number],
  to: [number, number],
  type: string,
): Connection | null {
  for (const conn of existing) {
    if (
      endpointsMatch(conn.from, from) &&
      endpointsMatch(conn.to, to) &&
      conn.type === type
    ) {
      return conn;
    }
  }
  return null;
}

// ============================================================================
// CONNECTION MUTATOR
// ============================================================================

export class ConnectionMutator {
  private sentenceMutator: SentenceMutator;

  constructor(sentenceMutator: SentenceMutator) {
    this.sentenceMutator = sentenceMutator;
  }

  /**
   * Add a new connection. Generates unique ID if not provided.
   * Validates: unique ID, valid endpoints, no duplicates (same endpoints + same type).
   *
   * If a duplicate is found (same from + to + type), the EXISTING connection's
   * description is updated instead of creating a new one.
   *
   * Also adds connectionRef IDs to both endpoint sentences.
   *
   * @returns The connection ID and MutationType[]
   */
  addConnection(
    profile: EssayProfile,
    connection: {
      from: [number, number];
      to: [number, number];
      type: string;
      description: string;
      confidence?: number;
      discoveredByLayer?: string;
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

    // Check for duplicate (same from + to + type)
    const existing = isDuplicate(
      profile.connections.all,
      connection.from,
      connection.to,
      connection.type,
    );

    if (existing) {
      // Duplicate found -- update the existing connection's description instead
      existing.description = connection.description;
      if (connection.confidence !== undefined) {
        existing.confidence = connection.confidence;
      }
      return { connectionId: existing.id, mutations: ['connection_added'] };
    }

    // Generate unique ID
    const connectionId = generateConnectionId();

    // Ensure ID is unique (should always be, but defensive)
    const existingById = profile.connections.all.find((c) => c.id === connectionId);
    if (existingById) {
      console.error(
        `[ConnectionMutator] Generated duplicate connection ID: ${connectionId}`,
      );
      return { connectionId: '', mutations: [] };
    }

    // Create the connection
    const newConnection: Connection = {
      id: connectionId,
      from: connection.from,
      to: connection.to,
      type: connection.type,
      description: connection.description,
      confidence: connection.confidence ?? 0.5,
      discoveredByLayer: connection.discoveredByLayer ?? 'unknown',
    };

    profile.connections.all.push(newConnection);

    // Add connectionRef to both endpoint sentences
    this.sentenceMutator.addConnectionRef(
      profile,
      connection.from[0],
      connection.from[1],
      connectionId,
    );
    this.sentenceMutator.addConnectionRef(
      profile,
      connection.to[0],
      connection.to[1],
      connectionId,
    );

    return { connectionId, mutations: ['connection_added'] };
  }

  /**
   * Update an existing connection's description or type.
   */
  updateConnection(
    profile: EssayProfile,
    connectionId: string,
    updates: { description?: string; type?: string; confidence?: number },
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
    if (updates.type !== undefined) {
      connection.type = updates.type;
    }
    if (updates.confidence !== undefined) {
      connection.confidence = updates.confidence;
    }

    return ['connection_added']; // Reuse same mutation type for updates
  }

  /**
   * Remove a connection and clean up refs from endpoint sentences.
   */
  removeConnection(
    profile: EssayProfile,
    connectionId: string,
  ): MutationType[] {
    const connectionIndex = profile.connections.all.findIndex(
      (c) => c.id === connectionId,
    );
    if (connectionIndex < 0) {
      console.error(
        `[ConnectionMutator] removeConnection: connection ${connectionId} not found`,
      );
      return [];
    }

    const connection = profile.connections.all[connectionIndex];

    // Clean up connectionRefs from both endpoint sentences
    this.sentenceMutator.removeConnectionRef(
      profile,
      connection.from[0],
      connection.from[1],
      connectionId,
    );
    this.sentenceMutator.removeConnectionRef(
      profile,
      connection.to[0],
      connection.to[1],
      connectionId,
    );

    // Remove the connection from the canonical store
    profile.connections.all.splice(connectionIndex, 1);

    // Clean up any image recurrences that reference this connection
    // (image recurrences don't store connectionRefs in current type, so skip)

    return ['connection_removed'];
  }

  /**
   * Add scout leads (L2.5 provisional connections with low confidence).
   * Scout leads are regular connections with low confidence, discovered by L2.5.
   */
  addScoutLeads(
    profile: EssayProfile,
    leads: Array<{
      from: [number, number];
      to: [number, number];
      type: string;
      description: string;
    }>,
  ): MutationType[] {
    const mutations: MutationType[] = [];

    for (const lead of leads) {
      const result = this.addConnection(profile, {
        from: lead.from,
        to: lead.to,
        type: lead.type,
        description: lead.description,
        confidence: 0.3, // Scout leads have low confidence
        discoveredByLayer: 'L2.5',
      });

      if (result.connectionId && result.mutations.length > 0) {
        for (const m of result.mutations) {
          if (!mutations.includes(m)) {
            mutations.push(m);
          }
        }
      }
    }

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

    // Check valid endpoints
    for (const conn of profile.connections.all) {
      if (!isValidEndpoint(profile, conn.from)) {
        errors.push(
          `Connection ${conn.id}: invalid from endpoint [${conn.from[0]}, ${conn.from[1]}]`,
        );
      }
      if (!isValidEndpoint(profile, conn.to)) {
        errors.push(
          `Connection ${conn.id}: invalid to endpoint [${conn.to[0]}, ${conn.to[1]}]`,
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
                `Orphaned connectionRef "${ref}" on sentence [${para.index}, ${sentence.index}]`,
              );
            }
          }
        }
      }
    }

    // Check that connection endpoints have the connectionRef
    for (const conn of profile.connections.all) {
      if (isValidEndpoint(profile, conn.from)) {
        const fromSentence =
          profile.paragraphs[conn.from[0]].sentences[conn.from[1]];
        if (
          fromSentence.understanding &&
          !fromSentence.understanding.connectionRefs.includes(conn.id)
        ) {
          errors.push(
            `Connection ${conn.id}: from endpoint [${conn.from[0]}, ${conn.from[1]}] missing connectionRef`,
          );
        }
      }

      if (isValidEndpoint(profile, conn.to)) {
        const toSentence =
          profile.paragraphs[conn.to[0]].sentences[conn.to[1]];
        if (
          toSentence.understanding &&
          !toSentence.understanding.connectionRefs.includes(conn.id)
        ) {
          errors.push(
            `Connection ${conn.id}: to endpoint [${conn.to[0]}, ${conn.to[1]}] missing connectionRef`,
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
    from: [number, number],
    to: [number, number],
  ): string[] {
    const errors: string[] = [];

    if (!isValidEndpoint(profile, from)) {
      errors.push(
        `Invalid from endpoint: [${from[0]}, ${from[1]}]`,
      );
    }
    if (!isValidEndpoint(profile, to)) {
      errors.push(
        `Invalid to endpoint: [${to[0]}, ${to[1]}]`,
      );
    }

    return errors;
  }
}
