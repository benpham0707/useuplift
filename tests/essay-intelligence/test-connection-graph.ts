/**
 * Connection Graph V2 — Integration Tests
 *
 * Tests the ConnectionGraph class and its integration with the profile system.
 * Covers: CRUD, graph analysis, revalidation triage, adjacency context, islands, hubs.
 *
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-connection-graph.ts
 */

import {
  ConnectionGraph,
  createConnection,
} from '../../src/services/essayIntelligence/connections/connectionGraph';
import type {
  Connection,
  ConnectionEndpoint,
  ConnectionRoutingTag,
  ConnectionStrengthCategory,
  ConnectionDirectionality,
  ConnectionSource,
  ProfileConnections,
} from '../../src/services/essayIntelligence/profileTypes';

// ============================================================================
// TEST HELPERS
// ============================================================================

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual === expected) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function makeEndpoint(p: number, s?: number, label?: string): ConnectionEndpoint {
  return { paragraph: p, sentence: s, label: label ?? `P${p}${s !== undefined ? `S${s}` : ''}` };
}

function makeConnection(
  graph: ConnectionGraph,
  from: ConnectionEndpoint,
  to: ConnectionEndpoint,
  overrides?: Partial<{
    description: string;
    strengthCategory: ConnectionStrengthCategory;
    routingTags: ConnectionRoutingTag[];
    directionality: ConnectionDirectionality;
    discoveredBy: ConnectionSource;
    significance: string;
    reverseIllumination: string | null;
  }>,
): Connection {
  return createConnection(graph, {
    from,
    to,
    description: overrides?.description ?? `Connection from P${from.paragraph} to P${to.paragraph}`,
    reverseIllumination: overrides?.reverseIllumination ?? null,
    significance: overrides?.significance ?? 'Test connection',
    strengthCategory: overrides?.strengthCategory ?? 'supporting',
    directionality: overrides?.directionality ?? 'forward',
    discoveredBy: overrides?.discoveredBy ?? 'walk',
    routingTags: overrides?.routingTags ?? [],
  });
}

// ============================================================================
// TESTS
// ============================================================================

async function runTests() {
  console.log('=== ConnectionGraph V2 Tests ===\n');

  // ── Test 1: Basic CRUD ──
  console.log('Test 1: Basic CRUD operations');
  {
    const graph = new ConnectionGraph();

    // Add a connection
    const conn = makeConnection(
      graph,
      makeEndpoint(0, 2, "P0's kinesthetic opening"),
      makeEndpoint(4, 1, "P4's concrete moment"),
      {
        description: "Kinesthetic vocabulary returns — bookending creates implicit argument about embodiment",
        strengthCategory: 'foundational',
        routingTags: ['thematic', 'earning'],
        directionality: 'bidirectional',
        reverseIllumination: "P0's opening is not just scene-setting but the essay's native register",
        significance: "Primary earning chain — P0 sets up what P4 pays off",
      },
    );

    assertEqual(conn.id, 'C1', 'First connection gets ID C1');
    assertEqual(conn.status, 'active', 'New connection is active');
    assert(conn.routingTags.includes('thematic'), 'Has thematic routing tag');
    assert(conn.routingTags.includes('earning'), 'Has earning routing tag');
    assertEqual(conn.strengthCategory, 'foundational', 'Strength is foundational');
    assertEqual(conn.directionality, 'bidirectional', 'Bidirectional');
    assert(conn.reverseIllumination !== null, 'Has reverse illumination');
    assert(conn.createdAt.length > 0, 'Has createdAt timestamp');
    assertEqual(graph.activeCount, 1, 'Active count is 1');
  }

  // ── Test 2: fromArray + ID collision prevention ──
  console.log('\nTest 2: fromArray initialization');
  {
    const existing: Connection[] = [
      {
        id: 'C5',
        from: makeEndpoint(0, 0),
        to: makeEndpoint(1, 0),
        description: 'Test',
        reverseIllumination: null,
        routingTags: ['thematic'],
        significance: 'Test',
        strengthCategory: 'supporting',
        directionality: 'forward',
        discoveredBy: 'walk',
        status: 'active',
        relatedFindings: [],
        createdAt: new Date().toISOString(),
      },
    ];

    const graph = ConnectionGraph.fromArray(existing);
    assertEqual(graph.totalCount, 1, 'Loaded 1 existing connection');

    const newConn = makeConnection(graph, makeEndpoint(2, 0), makeEndpoint(3, 0));
    assert(newConn.id === 'C6', 'New ID is C6 (avoids collision with C5)');
  }

  // ── Test 3: Get by paragraph and sentence ──
  console.log('\nTest 3: Query by paragraph and sentence');
  {
    const graph = new ConnectionGraph();
    makeConnection(graph, makeEndpoint(0, 1), makeEndpoint(2, 3), { strengthCategory: 'significant' });
    makeConnection(graph, makeEndpoint(1, 0), makeEndpoint(2, 1), { strengthCategory: 'tentative' });
    makeConnection(graph, makeEndpoint(3, 0), makeEndpoint(4, 0), { strengthCategory: 'supporting' });

    const p2Conns = graph.getByParagraph(2);
    assertEqual(p2Conns.length, 2, 'P2 has 2 connections');

    const p2s3Conns = graph.getBySentence(2, 3);
    assertEqual(p2s3Conns.length, 1, 'P2S3 has 1 connection');

    const p5Conns = graph.getByParagraph(5);
    assertEqual(p5Conns.length, 0, 'P5 has no connections');
  }

  // ── Test 4: Get by routing tag ──
  console.log('\nTest 4: Query by routing tag');
  {
    const graph = new ConnectionGraph();
    makeConnection(graph, makeEndpoint(0, 0), makeEndpoint(1, 0), { routingTags: ['structural', 'earning'] });
    makeConnection(graph, makeEndpoint(1, 0), makeEndpoint(2, 0), { routingTags: ['thematic'] });
    makeConnection(graph, makeEndpoint(2, 0), makeEndpoint(3, 0), { routingTags: ['contrastive'] });

    assertEqual(graph.getByTag('structural').length, 1, '1 structural connection');
    assertEqual(graph.getByTag('thematic').length, 1, '1 thematic connection');
    assertEqual(graph.getByTag('earning').length, 1, '1 earning connection');
    assertEqual(graph.getByTag('contrastive').length, 1, '1 contrastive connection');
  }

  // ── Test 5: Invalidation (never deletes) ──
  console.log('\nTest 5: Invalidation preserves connections');
  {
    const graph = new ConnectionGraph();
    const conn = makeConnection(graph, makeEndpoint(0, 0), makeEndpoint(1, 0));

    assertEqual(graph.activeCount, 1, 'Active count starts at 1');
    assertEqual(graph.totalCount, 1, 'Total count starts at 1');

    graph.invalidate(conn.id, 'P1 was deleted', 'edit_P1');

    assertEqual(graph.activeCount, 0, 'Active count is 0 after invalidation');
    assertEqual(graph.totalCount, 1, 'Total count still 1 (never deleted)');

    const invalidated = graph.get(conn.id);
    assert(invalidated !== undefined, 'Connection still retrievable by ID');
    assertEqual(invalidated!.status, 'invalidated', 'Status is invalidated');
    assert(invalidated!.invalidation !== undefined, 'Has invalidation metadata');
    assertEqual(invalidated!.invalidation!.reason, 'P1 was deleted', 'Reason preserved');
    assertEqual(invalidated!.invalidation!.trigger, 'edit_P1', 'Trigger preserved');
  }

  // ── Test 6: Revalidation candidates (strength-based triage) ──
  console.log('\nTest 6: Revalidation candidates by strength');
  {
    const graph = new ConnectionGraph();
    makeConnection(graph, makeEndpoint(3, 0), makeEndpoint(0, 0), { strengthCategory: 'foundational' });
    makeConnection(graph, makeEndpoint(3, 1), makeEndpoint(1, 0), { strengthCategory: 'significant' });
    makeConnection(graph, makeEndpoint(3, 2), makeEndpoint(2, 0), { strengthCategory: 'supporting' });
    makeConnection(graph, makeEndpoint(3, 3), makeEndpoint(4, 0), { strengthCategory: 'tentative' });

    const { immediate, deferred } = graph.getRevalidationCandidates(3);

    assertEqual(immediate.length, 2, '2 immediate (foundational + significant)');
    assertEqual(deferred.length, 2, '2 deferred (supporting + tentative)');

    assert(
      immediate.every(c => c.strengthCategory === 'foundational' || c.strengthCategory === 'significant'),
      'All immediate are foundational or significant',
    );
    assert(
      deferred.every(c => c.strengthCategory === 'supporting' || c.strengthCategory === 'tentative'),
      'All deferred are supporting or tentative',
    );
  }

  // ── Test 7: Structural islands ──
  console.log('\nTest 7: Structural island detection');
  {
    const graph = new ConnectionGraph();
    // P0-P1 foundational, P2-P3 significant, P4 and P5 unconnected
    makeConnection(graph, makeEndpoint(0, 0), makeEndpoint(1, 0), { strengthCategory: 'foundational' });
    makeConnection(graph, makeEndpoint(2, 0), makeEndpoint(3, 0), { strengthCategory: 'significant' });
    // P4 has only a tentative connection (not strong enough to count)
    makeConnection(graph, makeEndpoint(4, 0), makeEndpoint(0, 0), { strengthCategory: 'tentative' });

    const islands = graph.findStructuralIslands(6); // 6 paragraphs total
    assert(islands.includes(4), 'P4 is an island (only tentative connections)');
    assert(islands.includes(5), 'P5 is an island (no connections at all)');
    assert(!islands.includes(0), 'P0 is not an island');
    assert(!islands.includes(1), 'P1 is not an island');
    assert(!islands.includes(2), 'P2 is not an island');
    assert(!islands.includes(3), 'P3 is not an island');
  }

  // ── Test 8: Hub analysis ──
  console.log('\nTest 8: Hub paragraph detection');
  {
    const graph = new ConnectionGraph();
    // P2 is a hub — connected to P0, P1, P3, P4
    makeConnection(graph, makeEndpoint(0, 0), makeEndpoint(2, 0), { strengthCategory: 'foundational' });
    makeConnection(graph, makeEndpoint(1, 0), makeEndpoint(2, 0), { strengthCategory: 'significant' });
    makeConnection(graph, makeEndpoint(2, 0), makeEndpoint(3, 0), { strengthCategory: 'supporting' });
    makeConnection(graph, makeEndpoint(2, 0), makeEndpoint(4, 0), { strengthCategory: 'tentative' });

    const hubs = graph.getHubs();
    assert(hubs.length > 0, 'Detected at least one hub');
    assertEqual(hubs[0].paragraph, 2, 'P2 is the primary hub');
    assertEqual(hubs[0].connectionCount, 4, 'P2 has 4 connections');
    assertEqual(hubs[0].strongCount, 2, 'P2 has 2 strong connections (foundational + significant)');
  }

  // ── Test 9: Adjacency context output ──
  console.log('\nTest 9: Adjacency context serialization');
  {
    const graph = new ConnectionGraph();
    makeConnection(graph, makeEndpoint(0, 2), makeEndpoint(4, 1), {
      description: 'Kinesthetic vocabulary bookending',
      strengthCategory: 'foundational',
      routingTags: ['thematic', 'earning'],
      directionality: 'bidirectional',
    });

    const context = graph.toAdjacencyContext();
    assert(context.includes('Connection graph (1 active)'), 'Has header');
    assert(context.includes('C1:'), 'Has connection ID');
    assert(context.includes('P0S2'), 'Has from endpoint');
    assert(context.includes('P4S1'), 'Has to endpoint');
    assert(context.includes('<->'), 'Shows bidirectional arrow');
    assert(context.includes('thematic,earning'), 'Shows routing tags');
    assert(context.includes('(F)'), 'Shows strength badge (F for foundational)');
  }

  // ── Test 10: Under review + reactivation lifecycle ──
  console.log('\nTest 10: Under review and reactivation');
  {
    const graph = new ConnectionGraph();
    const conn = makeConnection(graph, makeEndpoint(0, 0), makeEndpoint(1, 0));

    graph.markUnderReview(conn.id);
    assertEqual(graph.get(conn.id)!.status, 'under_review', 'Status is under_review');
    assertEqual(graph.activeCount, 0, 'Not counted as active while under review');

    graph.reactivate(conn.id);
    assertEqual(graph.get(conn.id)!.status, 'active', 'Status back to active');
    assertEqual(graph.activeCount, 1, 'Counted as active again');
  }

  // ── Test 11: Update connection fields ──
  console.log('\nTest 11: Connection field updates');
  {
    const graph = new ConnectionGraph();
    const conn = makeConnection(graph, makeEndpoint(0, 0), makeEndpoint(1, 0), {
      strengthCategory: 'tentative',
      routingTags: [],
    });

    graph.update(conn.id, {
      strengthCategory: 'significant',
      routingTags: ['thematic', 'structural'],
      reverseIllumination: 'New insight from full-text view',
      significance: 'Upgraded after L3.75 analysis',
    });

    const updated = graph.get(conn.id)!;
    assertEqual(updated.strengthCategory, 'significant', 'Strength upgraded');
    assertEqual(updated.routingTags.length, 2, 'Has 2 routing tags');
    assertEqual(updated.reverseIllumination, 'New insight from full-text view', 'Reverse illumination added');
  }

  // ── Test 12: Paragraph-level endpoints ──
  console.log('\nTest 12: Paragraph-level endpoints (no sentence)');
  {
    const graph = new ConnectionGraph();
    const conn = makeConnection(
      graph,
      makeEndpoint(0, undefined, 'P0 kinesthetic paragraph'),
      makeEndpoint(4, undefined, 'P4 concrete evidence'),
      { strengthCategory: 'foundational' },
    );

    assert(conn.from.sentence === undefined, 'From sentence is undefined');
    assert(conn.to.sentence === undefined, 'To sentence is undefined');

    // Should appear in paragraph queries
    const p0Conns = graph.getByParagraph(0);
    assertEqual(p0Conns.length, 1, 'Found via paragraph query');

    // Should NOT appear in sentence queries
    const p0s0Conns = graph.getBySentence(0, 0);
    assertEqual(p0s0Conns.length, 0, 'Not found via sentence query (sentence is undefined)');
  }

  // ── Test 13: createConnection infers routing tags from description ──
  console.log('\nTest 13: Automatic routing tag inference');
  {
    const graph = new ConnectionGraph();

    const thematic = createConnection(graph, {
      from: makeEndpoint(0, 0),
      to: makeEndpoint(4, 0),
      description: "The 'diamond' image recurs — thematic echo bookending the essay",
      reverseIllumination: null,
      significance: 'test',
      strengthCategory: 'supporting',
      directionality: 'forward',
      discoveredBy: 'walk',
    });
    assert(thematic.routingTags.includes('thematic'), 'Inferred thematic tag from "echo" in description');

    const structural = createConnection(graph, {
      from: makeEndpoint(1, 0),
      to: makeEndpoint(3, 0),
      description: "P3 depends on P1 — without P1's setup, P3 would break",
      reverseIllumination: null,
      significance: 'test',
      strengthCategory: 'foundational',
      directionality: 'forward',
      discoveredBy: 'walk',
    });
    assert(structural.routingTags.includes('structural'), 'Inferred structural tag from "break" in description');

    const earning = createConnection(graph, {
      from: makeEndpoint(1, 0),
      to: makeEndpoint(4, 0),
      description: "P1 provides concrete evidence that earns P4's abstract claim",
      reverseIllumination: null,
      significance: 'test',
      strengthCategory: 'significant',
      directionality: 'forward',
      discoveredBy: 'walk',
    });
    assert(earning.routingTags.includes('earning'), 'Inferred earning tag from "evidence" and "earns"');
  }

  // ── Test 14: Empty graph edge cases ──
  console.log('\nTest 14: Empty graph edge cases');
  {
    const graph = new ConnectionGraph();
    assertEqual(graph.activeCount, 0, 'Empty graph has 0 active');
    assertEqual(graph.totalCount, 0, 'Empty graph has 0 total');
    assertEqual(graph.getActive().length, 0, 'getActive returns empty array');
    assertEqual(graph.getByParagraph(0).length, 0, 'getByParagraph returns empty');
    assertEqual(graph.getByTag('structural').length, 0, 'getByTag returns empty');
    assertEqual(graph.findStructuralIslands(3).length, 3, 'All paragraphs are islands');
    assertEqual(graph.getHubs().length, 0, 'No hubs');

    const context = graph.toAdjacencyContext();
    assert(context.includes('No connections discovered'), 'Empty context message');

    const { immediate, deferred } = graph.getRevalidationCandidates(0);
    assertEqual(immediate.length, 0, 'No immediate revalidation');
    assertEqual(deferred.length, 0, 'No deferred revalidation');
  }

  // ── Summary ──
  console.log(`\n${'='.repeat(50)}`);
  console.log(`ConnectionGraph V2 Tests: ${passed} passed, ${failed} failed`);
  console.log(`${'='.repeat(50)}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
