# Implementation Prompt: Improvement #3 -- Bidirectional Connections with Strength

## Context

The Essay Intelligence V2 system tracks **connections** between parts of an essay: thematic echoes, structural dependencies, earning chains, vocabulary domain collisions, tonal shifts, and more. Connections are the architectural DNA of the essay -- they reveal how the parts serve the whole, where the structure is load-bearing vs. decorative, and what would break if a paragraph were removed or rewritten.

The current system has a minimal connection model: a `Connection` type with `from`, `to`, `type` (from a 5-value closed enum: callback, contrast, escalation, parallel, contradiction), `description`, `confidence`, and `discoveredByLayer`. This is insufficient in three ways:

1. **The type enum is a ceiling on perception** (violates Rule 3). "Ironic echo," "vocabulary domain collision," "earning dependency," and "structural inversion" cannot be expressed. The LLM must choose from 5 buckets that don't capture what it actually sees.

2. **Connections are unidirectional** but meaning flows both ways. A thematic echo from P0 to P4 also reveals something about P0 when read from P4's perspective. A structural dependency from P3 on P1 means P1 is load-bearing for P3. Connections need bidirectional semantics.

3. **Connection strength is absent.** A tentative tonal echo and a structural dependency that would break the essay if severed are treated identically. Strength enables triage: when P3 is edited, strong connections through P3 need revalidation immediately; tentative connections can wait.

This improvement builds the **connection graph**: a bidirectional, strength-aware, LLM-described network that serves as the essay's architectural map.

---

## Design Principles (LLM-First Rules That Apply Here)

### From Rule 1: The LLM Owns All Judgment

**The LLM describes connections freely; the system tags for routing.** No fixed taxonomy of connection types. The LLM writes a prose description of what connects two passages. The system adds 3-4 functional routing tags based on what the connection means for system operations (not what it means for the essay -- that is in the LLM's description).

**The LLM assesses connection significance in context.** No `CONNECTION_SCORING_WEIGHT` per-type weights. A thematic echo might be the most important connection in one essay and trivial in another. The LLM assigns significance based on what it knows about this specific essay's architecture.

**The LLM specifies directionality per instance.** No static `CONNECTION_DIRECTIONALITY` lookup. Some connections are naturally directional (an earning chain flows from setup to payoff). Others are genuinely bidirectional (a thematic echo illuminates both endpoints equally). Others are primarily one-directional with secondary reverse illumination. The LLM decides per connection.

### From Rule 2: Never Discard Paid LLM Output

Connections are never deleted. A connection invalidated by an edit is marked `invalidated` with the reason preserved. The connection graph is an append-only log with status tracking. Querying active connections means filtering to `status === 'active'`.

### From Rule 3: No Closed Taxonomies for LLM Perception

The current 5-value `ConnectionType` enum is eliminated. In its place: the LLM writes a free-text `description` (what the connection IS) and assigns one or more `routingTags` from a small functional set (what the system needs to KNOW about the connection for operational decisions).

### From Rule 6: System Infrastructure for Bookkeeping

Routing tags are system infrastructure: they enable programmatic decisions without parsing prose. `strengthCategory()` thresholds for UI display badges (strong/moderate/tentative) are system infrastructure. Connection IDs, endpoint coordinates, status lifecycle -- all bookkeeping.

---

## Core Architecture

### Type Definitions

```typescript
// In profileTypes.ts

/**
 * Functional routing tags -- the system's operational view of connections.
 * These answer: "What does the system need to know about this connection
 * to make routing, revalidation, and dispatch decisions?"
 *
 * NOT a taxonomy of what connections mean. That lives in `description`.
 */
type ConnectionRoutingTag =
  | 'structural'   // Removing/changing one endpoint would break the other.
                    // Drives edit impact assessment and revalidation priority.
  | 'earning'      // One endpoint sets up or earns the other.
                    // Drives earned-ness analysis and earning chain tracing.
  | 'thematic'     // Endpoints share a thematic thread or image system.
                    // Drives through-line mapping and coherence checking.
  | 'contrastive'; // Endpoints create meaning through opposition or tension.
                    // Drives tension mapping and paradox identification.

/**
 * Connection -- a single relationship between two passages in the essay.
 *
 * Bidirectional: the connection has a primary direction (from -> to)
 * and describes what each endpoint means to the other.
 */
interface Connection {
  id: string;

  /** Primary endpoint -- where the connection originates or is first visible */
  from: ConnectionEndpoint;

  /** Secondary endpoint -- where the connection lands or becomes visible */
  to: ConnectionEndpoint;

  /**
   * LLM-written description of what connects these passages.
   * No category constraint -- the LLM expresses freely.
   *
   * Examples:
   * - "P0's kinesthetic vocabulary ('fingers danced,' 'sound washed') returns
   *    in P4's 'seeing users smile' -- the only two moments of physical
   *    experience in an otherwise abstract essay. The bookending creates
   *    an implicit argument: authentic moments require embodiment."
   *
   * - "P1's Chopin reference and P3's coding metaphor share vocabulary
   *    from the 'composition' domain, but P1 treats composition as
   *    world-creation while P3 treats it as problem-solving. The shared
   *    vocabulary masks a conceptual shift."
   *
   * - "P2's abstract assertion ('I believe in the power of constraint')
   *    depends on P4's concrete demonstration ('seeing users smile') for
   *    its credibility. Without P4, P2 is unsupported philosophy."
   */
  description: string;

  /**
   * What this connection reveals about the FROM endpoint (reverse illumination).
   * null if the connection is primarily one-directional and the reverse
   * doesn't add meaningful insight.
   *
   * Example: "Knowing that P4's concrete moment is the essay's only
   * embodied evidence reframes P0's kinesthetic opening -- it's not just
   * scene-setting but the essay's native register, momentarily allowed
   * before the abstract voice takes over."
   */
  reverseIllumination: string | null;

  /**
   * Functional routing tags -- what the system needs to know operationally.
   * Multiple tags allowed (a connection can be both structural and thematic).
   */
  routingTags: ConnectionRoutingTag[];

  /**
   * Connection significance -- LLM's assessment of how important this
   * connection is to the essay's architecture of meaning.
   *
   * NOT a score. A prose assessment that captures WHY this connection
   * matters (or doesn't) for THIS essay.
   *
   * Example: "This is the essay's primary earning chain. P2's abstract
   * claim is only credible because P4 demonstrates it concretely.
   * If P4 were removed, P2's philosophy would have no evidence."
   */
  significance: string;

  /**
   * Strength category for UI display and edit triage.
   * LLM-assigned based on significance assessment.
   * Used for: badge colors in UI, revalidation priority after edits.
   */
  strengthCategory: 'foundational' | 'significant' | 'supporting' | 'tentative';

  /**
   * Directionality -- how meaning flows in this connection.
   * LLM specifies per instance.
   */
  directionality: ConnectionDirectionality;

  /** Which layer/step discovered this connection */
  discoveredBy: ConnectionSource;

  /** Connection status -- system bookkeeping */
  status: 'active' | 'invalidated' | 'under_review';

  /** If invalidated, why and when */
  invalidation?: {
    reason: string;
    invalidatedAt: string;
    trigger: string;  // 'edit_P3', 'coaching_correction', etc.
  };

  /** Finding IDs this connection is related to */
  relatedFindings: string[];

  /** ISO timestamp */
  createdAt: string;
}

interface ConnectionEndpoint {
  paragraph: number;
  sentence?: number;  // null = paragraph-level endpoint
  /** Brief label for this endpoint in the connection context */
  label: string;  // e.g., "P0's kinesthetic opening" or "P4S3's concrete moment"
}

type ConnectionDirectionality =
  | 'forward'           // from -> to is the primary meaning direction
  | 'reverse'           // to -> from is the primary meaning direction
  | 'bidirectional'     // both directions carry equal meaning
  | 'asymmetric';       // both directions carry meaning but unequally
                        // (primary direction specified by from->to order,
                        //  reverseIllumination captures the weaker direction)

type ConnectionSource =
  | 'scout'             // L2.5 surface-level detection
  | 'walk'              // L3 sequential walk discovery
  | 'holistic_synthesis'// L3.75 full-context discovery
  | 'deep_dive'         // Post-walk targeted investigation
  | 'coaching'          // Student conversation reveals connection
  | 'edit_reanalysis';  // Re-analysis after edit discovers new connection

/**
 * ProfileConnections (V2) -- the connection graph.
 * Replaces the current flat ProfileConnections.
 */
interface ProfileConnections {
  /** All connections -- append-only with status tracking */
  all: Connection[];

  /**
   * Graph summary -- LLM-generated prose describing the essay's
   * overall connection architecture. Updated after each layer that
   * discovers connections.
   *
   * Example: "This essay has a sparse connection graph centered on
   * two hubs: P0 (kinesthetic opening) connects to P4 (concrete
   * evidence) through embodiment vocabulary, and P2 (abstract thesis)
   * connects to P4 through an earning dependency. P3 (music-coding
   * bridge) is weakly connected to both hubs but strongly connected
   * to P1 (Chopin). P5-P6 are structurally isolated -- they
   * restate the thesis without connecting to any concrete moment."
   */
  graphSummary: string;

  /**
   * Structural islands -- paragraphs with no strong connections
   * in or out. Identified by the system from the connection graph.
   * These are architectural signals: an island paragraph could be
   * removed without breaking any connection. That's either a
   * problem (it should be connected) or a feature (it's intentionally
   * standalone).
   */
  structuralIslands: number[];  // paragraph indices
}
```

### The Connection Graph Manager

```typescript
// connectionGraph.ts -- pure data management + graph analysis

class ConnectionGraph {
  private connections: Map<string, Connection> = new Map();
  private nextId: number = 1;

  generateId(): string {
    return `C${this.nextId++}`;
  }

  /** Add a connection with referential integrity validation */
  add(connection: Connection): void {
    // Validate: finding references exist (if findingStore provided)
    this.connections.set(connection.id, connection);
  }

  /** Get all active connections */
  getActive(): Connection[] {
    return Array.from(this.connections.values())
      .filter(c => c.status === 'active');
  }

  /** Get connections involving a specific paragraph */
  getByParagraph(paragraph: number): Connection[] {
    return this.getActive().filter(c =>
      c.from.paragraph === paragraph || c.to.paragraph === paragraph
    );
  }

  /** Get connections involving a specific sentence */
  getBySentence(paragraph: number, sentence: number): Connection[] {
    return this.getActive().filter(c =>
      (c.from.paragraph === paragraph && c.from.sentence === sentence) ||
      (c.to.paragraph === paragraph && c.to.sentence === sentence)
    );
  }

  /**
   * Get connections by routing tag -- for operational decisions.
   * Example: getByTag('structural') returns all load-bearing connections.
   */
  getByTag(tag: ConnectionRoutingTag): Connection[] {
    return this.getActive().filter(c => c.routingTags.includes(tag));
  }

  /**
   * Get connections by strength category -- for edit triage.
   * After editing P3, what connections need revalidation?
   */
  getRevalidationCandidates(editedParagraph: number): {
    immediate: Connection[];  // foundational + significant
    deferred: Connection[];   // supporting + tentative
  } {
    const affected = this.getByParagraph(editedParagraph);
    return {
      immediate: affected.filter(c =>
        c.strengthCategory === 'foundational' || c.strengthCategory === 'significant'
      ),
      deferred: affected.filter(c =>
        c.strengthCategory === 'supporting' || c.strengthCategory === 'tentative'
      ),
    };
  }

  /**
   * Invalidate a connection -- mark as invalidated with reason.
   * Never deletes (Rule 2).
   */
  invalidate(id: string, reason: string, trigger: string): void {
    const conn = this.connections.get(id);
    if (!conn) throw new Error(`Connection ${id} not found`);
    conn.status = 'invalidated';
    conn.invalidation = {
      reason,
      invalidatedAt: new Date().toISOString(),
      trigger,
    };
  }

  /**
   * Identify structural islands -- paragraphs with no strong connections.
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
      const strength = c.strengthCategory[0].toUpperCase(); // F/S/U/T
      lines.push(`  ${c.id}: ${from} ${dir} ${to} [${tags}] (${strength}) -- ${c.description.slice(0, 120)}`);
    }
    return `Connection graph (${active.length} active):\n${lines.join('\n')}`;
  }

  /**
   * Compute hub paragraphs -- paragraphs with the most connections.
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
      .map(([p, c]) => ({ paragraph: parseInt(p), connectionCount: c.total, strongCount: c.strong }))
      .sort((a, b) => b.strongCount - a.strongCount);
  }
}
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/services/essayIntelligence/connections/connectionGraph.ts` | CREATE | ConnectionGraph class -- pure data management + graph analysis |
| `src/services/essayIntelligence/connections/connectionContextBuilder.ts` | CREATE | Builds connection context for LLM prompts |
| `src/services/essayIntelligence/connections/index.ts` | CREATE | Barrel export |
| `src/services/essayIntelligence/profileTypes.ts` | MODIFY | Replace Connection, ProfileConnections, ConnectionType with V2 types |
| `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` | MODIFY | Walk discovers connections and outputs them in V2 format |
| `src/services/essayIntelligence/analysis/holisticSynthesis.ts` | MODIFY | L3.75 discovers full-context connections, produces graph summary |
| `src/services/essayIntelligence/analysis/structuralCartographer.ts` | MODIFY | L2.5 scout produces V2 connections (scout-level, tentative) |
| `src/services/essayIntelligence/profileManager/mutators/connectionMutator.ts` | MODIFY | Update to work with V2 Connection type |
| `src/services/essayIntelligence/analysis/reanalysisOrchestrator.ts` | MODIFY | Use connection strength for revalidation triage |
| `tests/essay-intelligence/test-connection-graph.ts` | CREATE | Connection graph integration tests |

---

## Deeper Design Questions (with Proposed Answers)

### 1. Connection Discovery: Multi-Layer Coordination

Connections come from four layers, each with a different vantage point:

**L2.5 (Scout):** Surface-level detection. Finds repeated words, tonal shifts, structural echoes. These are `tentative` strength, `scout` source. The scout does NOT deeply analyze what the connections mean -- it identifies CANDIDATES for the walk to investigate.

**L3 (Walk):** The walk discovers deeper connections while reading paragraph-by-paragraph. When reading P3, the walk may notice that P3's metaphor extends P1's image system. These connections are `supporting` or `significant` strength, `walk` source. The walk has sequential context but not full-essay context.

**L3.75 (Holistic Synthesis):** Full-text simultaneous view. Discovers connections the sequential walk cannot see: "P0 and P6 use the same vocabulary but P0 feels genuine and P6 feels performed." These are often `significant` or `foundational` strength because L3.75 has complete context.

**Deep Dives:** Domain-specific investigation may discover connections within that domain. An `image_system_trace` deep dive might discover that the puzzle metaphor in P2 recurs as the AI constraint metaphor in P4 -- a connection invisible to the walk because it requires tracking a specific image across the full essay.

**Coordination protocol:**

1. Scout produces tentative connection candidates with IDs.
2. Walk receives scout connections in its context. When the walk reads a paragraph that is an endpoint of a scout connection, it either **confirms** the connection (upgrading it, enriching the description) or **dismisses** it (marking as irrelevant with reason -- not deleted, but status -> invalidated).
3. Walk also discovers NEW connections the scout missed.
4. L3.75 sees all walk-discovered connections. It may discover additional cross-essay connections. It may also **upgrade** walk connections (adding reverseIllumination, adjusting strength, adding routing tags that weren't visible sequentially).
5. Deep dives may add domain-specific connections.

**Do layers ever disagree?** Yes, and that is a feature. The scout might flag a surface echo between P1 and P5 (same word used). The walk might confirm the echo exists but assess it as coincidental (tentative strength). L3.75 might then see that the coincidence is actually structural irony the walk missed (upgrade to significant). The connection's lineage preserves this evolution -- each layer's contribution is recorded in the description as the understanding deepens.

**Implementation:** Each layer that produces connections outputs them in V2 format. The ConnectionGraph merges them, using the connection ID for scout-confirmed connections and generating new IDs for newly discovered connections.

### 2. Connection vs. Finding: Cross-Reference Without Circular Dependency

Findings and connections are independent data structures that reference each other by ID.

**How findings reference connections:**
- A finding's `claim` may describe a connection pattern: "The earning chain from P1 to P4 is the essay's only concrete evidence pathway."
- The finding stores connection IDs in `relatedTo` (using the connection ID, e.g., `C3`).
- This is a REFERENCE, not an embedding. The finding doesn't contain the connection's description.

**How connections reference findings:**
- A connection's `relatedFindings` array stores finding IDs it is relevant to.
- This enables queries like: "Show me all connections related to F5" (the voice bifurcation finding).

**No circular dependency:** Both structures are independently valid. A finding can exist without any connection references. A connection can exist without any finding references. The cross-references are enrichment, not structural dependency.

**The graph reconstruction:** At query time, the system can reconstruct the full web:
```typescript
function getConnectionContext(findingId: string, graph: ConnectionGraph, store: FindingStore): {
  finding: Finding;
  relatedConnections: Connection[];
  connectedFindings: Finding[];
} {
  const finding = store.get(findingId);
  const relatedConnections = graph.getActive()
    .filter(c => c.relatedFindings.includes(findingId));
  const connectedFindings = relatedConnections
    .flatMap(c => c.relatedFindings)
    .filter(id => id !== findingId)
    .map(id => store.get(id))
    .filter(Boolean);
  return { finding, relatedConnections, connectedFindings };
}
```

### 3. Connection Graph as Architectural DNA

The connection graph reveals structural properties that no individual connection captures. These are system-derived (computed from graph structure) and LLM-enriched (the graph summary adds interpretive prose):

**Hub analysis:** Paragraphs with many strong connections are architectural centers. A hub paragraph is load-bearing -- editing it has wide ripple effects. The `getHubs()` method computes this from graph structure. The LLM's graph summary interprets it: "P4 is the essay's hub: it provides the only concrete evidence (earning connection to P2), returns to P0's kinesthetic register (thematic connection), and introduces the AI domain that P5-P6 develop. Editing P4 would affect the essay's entire evidence architecture."

**Island detection:** Paragraphs with no strong connections are structural islands. They could be removed without breaking any connection. The `findStructuralIslands()` method computes this mechanically. The LLM interprets: "P5 is an island -- it restates the thesis without connecting to any concrete moment or building on any thematic thread. This means P5 is either doing work invisible to the connection analysis (unlikely) or is structurally redundant."

**Earning chain completeness:** Follow `earning`-tagged connections from claims to evidence. If a claim paragraph has no earning connection to a concrete-evidence paragraph, the claim is unsupported. This is computed from the graph and reported to the LLM for the holistic synthesis.

**Prompt for L3.75 graph summary:**

```
=== CONNECTION GRAPH SUMMARY ===

You have seen all connections discovered during the walk and your own
full-context analysis. Now step back and describe the essay's CONNECTION
ARCHITECTURE:

1. What are the HUB paragraphs -- the ones most connections pass through?
   What does their centrality reveal about the essay's structure?

2. What are the ISLANDS -- paragraphs with no strong connections?
   Are they structurally redundant or intentionally standalone?

3. Are there BROKEN CHAINS -- earning connections that start but don't
   complete? Thematic threads that appear and vanish?

4. What is the overall TOPOLOGY? Is this a linear chain (P0->P1->P2...),
   a hub-and-spoke (everything connects to P3), a web (dense cross-
   connections), or something else? What does the topology reveal about
   how the essay makes meaning?

Describe in 3-5 sentences. This summary becomes part of the essay's
architectural understanding.
```

### 4. Connection Strength and Edit Revalidation

When a student edits P3, connections through P3 need revalidation. Strength-based triage:

**Immediate revalidation (foundational + significant):**
```
For each strong connection through P3:
  - Include the connection + its description in the focused re-analysis prompt
  - Ask: "P3 has been edited. Is this connection still valid? Has it
    strengthened, weakened, or changed meaning? Update the description
    and strength if needed."
  - Cost: included in the focused re-analysis Sonnet call (no extra cost)
```

**Deferred revalidation (supporting + tentative):**
```
For each weak connection through P3:
  - Flag for revalidation on the next full analysis pass
  - Do NOT include in the focused re-analysis (saves tokens)
  - If the weak connection is the only connection to an otherwise-isolated
    paragraph, upgrade it to immediate revalidation (losing the only
    connection to a paragraph is architecturally significant)
```

**Integration with focused analysis mode (from PLAN2):**

```typescript
function buildFocusedReanalysisContext(
  editedParagraph: number,
  graph: ConnectionGraph,
  store: FindingStore,
): FocusedReanalysisContext {
  const { immediate, deferred } = graph.getRevalidationCandidates(editedParagraph);

  return {
    // Connections that must be revalidated in this call
    connectionsToRevalidate: immediate.map(c => ({
      id: c.id,
      description: c.description,
      otherEndpoint: c.from.paragraph === editedParagraph
        ? c.to : c.from,
      strengthCategory: c.strengthCategory,
      routingTags: c.routingTags,
    })),
    // Connections flagged for later
    deferredConnections: deferred.map(c => c.id),
    // Findings affected by this edit (from finding store)
    affectedFindings: store.getByScope(editedParagraph),
  };
}
```

### 5. The Minimal Routing Tag Set

Four tags serve all operational routing decisions:

| Tag | What it means operationally | System decisions it enables |
|-----|----------------------------|---------------------------|
| `structural` | Removing one endpoint would damage the other | Edit impact assessment: which paragraphs are affected by this edit? Revalidation priority: structural connections get immediate revalidation. |
| `earning` | One endpoint provides evidence/setup for the other | Earned-ness analysis: trace earning chains from claims to evidence. Coaching: "P2's claim is earned by P4's concrete moment." |
| `thematic` | Endpoints share a thematic thread or image system | Through-line mapping: which threads span the essay? Coherence: are thematic threads developed or just mentioned? |
| `contrastive` | Endpoints create meaning through opposition | Tension mapping: where does the essay create productive tension? Paradox identification: where does the essay argue against itself? |

**Why not more tags?** Every additional tag creates a routing decision the system must handle. These four cover the operational decisions: "what breaks if I edit here?" (structural), "what is earned by what?" (earning), "what threads span the essay?" (thematic), "where is productive tension?" (contrastive). Any connection that doesn't fit these four is still fully described in the LLM's prose description -- it just doesn't trigger a specific system behavior.

**Why not fewer tags?** Collapsing `earning` into `structural` loses the directional semantics (earning flows from setup to payoff, structural is symmetric). Collapsing `contrastive` into `thematic` loses the opposition semantics (themes connect through similarity, contrasts connect through difference). Four is the minimal useful set.

**A connection can have multiple tags.** P0's kinesthetic opening and P4's concrete moment might be both `thematic` (shared sensory register) and `earning` (P0 sets up the reader's expectation that the essay will be embodied, which P4 pays off). Multiple tags are common for foundational connections.

---

## Prompt Engineering Guidance

### Walk Prompt: Connection Discovery

```
=== DISCOVERING CONNECTIONS ===

As you read this paragraph, you may notice connections to earlier text.
A connection exists when two passages ILLUMINATE each other -- knowing
one changes how you read the other.

When you discover a connection, describe it freely. Do NOT fit it into
a category. Instead, tell me:

1. WHAT connects these passages (the specific textual evidence on both sides)
2. WHY this connection matters for the essay's meaning-making
3. HOW meaning flows -- is it primarily from earlier to later (the earlier
   passage sets up the later one), later to earlier (the later passage
   reframes the earlier one), or bidirectional (both illuminate each other)?
4. HOW STRONG is this connection? Would the essay break if one endpoint
   were removed (foundational)? Would it lose something important
   (significant)? Would it lose a nuance (supporting)? Is it a possible
   echo you're not sure about (tentative)?

The system will add routing tags automatically. You describe what you see.

EXAMPLES of connections at different levels:

SURFACE (tentative): "P1 and P4 both use the word 'compose.' This might
be a deliberate echo or just vocabulary coincidence."

STRUCTURAL (foundational): "P2's abstract claim ('constraint enables
creativity') depends entirely on P4's concrete demonstration for its
credibility. Without P4, P2 is philosophy without evidence. This is
an earning dependency."

ARCHITECTURAL (significant): "P0's kinesthetic register returns in P4
but nowhere else. These two passages share a mode of knowing (embodied,
sensory) that the rest of the essay abandons for abstract reflection.
They bracket the essay's authentic moments."

META (significant): "P0's opening line 'From the first moment' mirrors
P6's closing 'looking forward.' The essay's temporal framework moves
from past-origin to future-aspiration -- a common essay arc. But the
middle paragraphs don't develop chronologically, creating a frame that
doesn't match its content."

Don't force connections. A paragraph might have no meaningful connections
to earlier text. That's fine -- and it's a signal worth noting (isolation
is architecturally meaningful).
```

### L3.75 Prompt: Graph Summary

```
=== CONNECTION ARCHITECTURE ===

You now see ALL connections discovered during the walk, plus any new
connections visible from the full-text view. Describe the essay's
connection architecture:

What kind of structure does this essay have?

- LINEAR CHAIN: each paragraph connects primarily to its neighbors.
  Meaning builds sequentially. Common in narrative essays.

- HUB AND SPOKE: one or two central paragraphs connect to everything.
  The hubs are load-bearing; the spokes are specialized.

- WEB: dense cross-connections. Ideas echo and interweave throughout.
  Common in intellectually sophisticated essays.

- FRAGMENTED: clusters of connected paragraphs with gaps between clusters.
  The gaps are architectural weaknesses (or intentional pauses).

- SPARSE: few connections overall. Each paragraph is relatively
  self-contained. This might mean the essay lacks coherence, or it
  might mean each paragraph does standalone work that doesn't need
  architectural support.

Also identify:
- Which paragraphs are HUBS (most connections passing through them)?
- Which paragraphs are ISLANDS (no strong connections)?
- Are there BROKEN CHAINS (earning connections that start but don't
  complete, thematic threads that appear and vanish)?
- What is the essay's primary STRUCTURAL DEPENDENCY (the one connection
  that, if broken, would most damage the essay's coherence)?
```

### Scout Prompt: Surface Connection Candidates

```
=== CONNECTION SCOUTING ===

Scan the full essay for surface-level connection CANDIDATES. You are
looking for:
- Repeated words or phrases across paragraphs
- Tonal or register shifts between paragraphs
- Image or metaphor recurrences
- Structural echoes (similar sentence patterns in different paragraphs)
- Vocabulary domain overlaps

For each candidate, note:
- The two endpoints (paragraph + sentence if specific)
- What you noticed (brief -- the walk will investigate in depth)
- A brief label for each endpoint

Mark ALL candidates as 'tentative' strength. The walk will determine
which are meaningful and which are coincidental.

Do NOT deeply analyze these connections. Surface detection only.
The walk reads with full context and decides what matters.
```

---

## Integration Points

### With Improvement #1 (Finding Lifecycle)

**Findings reference connections, connections reference findings.** When the walk produces a finding about an earning chain ("The earning chain from P1 to P4 is the essay's only concrete evidence pathway"), it also produces the connection object. The finding's `relatedTo` includes the connection ID. The connection's `relatedFindings` includes the finding ID.

**Finding maturity updates may trigger connection updates.** When a finding is superseded (e.g., the student corrects a factual assumption), connections related to that finding should be flagged for review. The system adds them to the `under_review` status, and the next analysis pass revalidates them.

**Connection discovery may trigger finding maturity updates.** When L3.75 discovers a new foundational connection between P0 and P4, this may confirm a hypothesis-level finding about P0's significance. The L3.75 prompt should explicitly check: "Given this new connection, should any existing findings have their maturity updated?"

### With Improvement #10 (Version Branching)

**Branches fork the connection graph.** When a branch is created, it gets a copy of the connection graph. Edits on the branch may invalidate connections, create new ones, or change strengths.

**Branch comparison uses the connection graph.** The most architecturally meaningful comparison between branches is: "Which connections exist on branch A but not branch B, and vice versa?" A branch that preserves all foundational connections while adding new ones is architecturally superior to one that breaks foundational connections.

**Connection IDs across branches:** Use the same prefix scheme as findings: `C-main-1`, `C-branch1-1`.

### With PLAN2's Growth Engine

**Connection count and strength feed into dimension coverage.** The `coherence` dimension's depth level depends partly on connection density and the graph topology. An essay with no cross-paragraph connections has `coherence` at `unexplored`. The dimension tracking (from PLAN2) uses connection graph metadata.

**Connection graph feeds into Reading Strategy.** The graph topology informs the reading strategy: "This essay has a hub-and-spoke structure centered on P3. Reading strategy should focus on how P3 serves as the structural center and whether the spokes earn their connection to the hub."

---

## Implementation Sequence

### Step 1: Types and ConnectionGraph (day 1)
1. Define V2 types in `profileTypes.ts`: `Connection`, `ConnectionEndpoint`, `ConnectionRoutingTag`, `ConnectionDirectionality`, `ProfileConnections`
2. Create `connectionGraph.ts` with all CRUD + graph analysis methods
3. Create `connectionContextBuilder.ts` for LLM context serialization
4. Unit tests: add, invalidate, getByParagraph, getRevalidationCandidates, findStructuralIslands, getHubs

### Step 2: Scout Integration (day 1-2)
1. Update L2.5 scout to produce V2 connections (tentative, scout source)
2. Scout output feeds into ConnectionGraph via `add()`
3. Integration test: scout produces parseable V2 connections

### Step 3: Walk Integration (days 2-3)
1. Walk prompt receives scout connections in context (via adjacency representation)
2. Walk outputs connection confirmations/dismissals and new connections
3. Walk output parser constructs V2 connections with proper source, strength, routing tags
4. Connection cross-references with findings (relatedFindings populated)
5. Integration test: walk confirms/dismisses scout connections, discovers new ones

### Step 4: L3.75 Integration (day 3)
1. L3.75 receives full connection graph in context
2. L3.75 discovers full-context connections, produces graph summary
3. L3.75 may upgrade walk connection strengths
4. Integration test: L3.75 produces graph summary, discovers connections walk missed

### Step 5: Edit Revalidation (day 4)
1. Integrate `getRevalidationCandidates()` into focused analysis mode
2. Build revalidation prompt section (include immediate connections in re-analysis context)
3. Process revalidation results: update connection status, strength, description
4. Integration test: edit P3, verify strong connections revalidated, weak deferred

### Step 6: ConnectionMutator Migration (day 4-5)
1. Update ConnectionMutator to work with V2 Connection type
2. Update sentence connectionRefs management
3. Remove old ConnectionType enum references
4. Verify all downstream consumers work with V2 types

**Total: ~5 days. Each step produces testable output.**
