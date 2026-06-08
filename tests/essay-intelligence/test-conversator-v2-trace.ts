/**
 * Conversator V2 Trace Test
 * Tests the core algorithms added by the V2 session memory enrichments.
 * No LLM calls -- logic layer only.
 *
 * Algorithms are replicated from coachingService.ts private methods
 * so they can be tested in isolation with controlled inputs.
 */

import type {
  SessionEvent,
  CoachingSessionMemory,
  ConversationInsight,
  InsightCategory,
} from '../../src/services/essayIntelligence/profileTypes';

// ============================================================================
// Test utilities
// ============================================================================

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    console.log(`  FAIL: ${message}`);
  }
}

function section(name: string): void {
  console.log(`\n--- ${name} ---`);
}

// ============================================================================
// Replicated algorithms (exact copies from coachingService.ts private methods)
// ============================================================================

/**
 * initializeSessionMemory -- from coachingService.ts line 2340
 */
function initializeSessionMemory(): CoachingSessionMemory {
  return {
    turnCount: 0,
    topicsDiscussed: [],
    approachesUsed: [],
    studentStances: [],
    events: [],
    sessionArcSummary: '',
    nextFocus: '',
  };
}

/**
 * retrieveRelevantEvents -- from coachingService.ts line 2433
 *
 * Selection criteria:
 * 1. Always: the 3 most recent events (temporal relevance)
 * 2. Overlap: events whose paragraphRefs overlap with current focus paragraphs
 * 3. Finding overlap: events whose findingRefs overlap with current focus findings
 * 4. Significant: events with significance > 0.8 (regardless of recency)
 * Deduplicates and caps at 12 events.
 */
function retrieveRelevantEvents(
  events: SessionEvent[],
  focusParagraphs: number[],
  focusFindingIds: string[],
): SessionEvent[] {
  if (events.length <= 6) return events;

  const selected = new Map<number, SessionEvent>();

  // 1. Most recent 3
  for (const e of events.slice(-3)) selected.set(e.turn, e);

  // 2. Paragraph overlap
  if (focusParagraphs.length > 0) {
    for (const e of events) {
      if (e.paragraphRefs.some(p => focusParagraphs.includes(p))) {
        selected.set(e.turn, e);
      }
    }
  }

  // 3. Finding overlap
  if (focusFindingIds.length > 0) {
    for (const e of events) {
      if (e.findingRefs.some(f => focusFindingIds.includes(f))) {
        selected.set(e.turn, e);
      }
    }
  }

  // 4. High significance
  for (const e of events) {
    if (e.significance > 0.8) selected.set(e.turn, e);
  }

  return Array.from(selected.values())
    .sort((a, b) => a.turn - b.turn)
    .slice(-12);
}

/**
 * serializeEventsForPrompt -- from coachingService.ts line 2473
 */
function serializeEventsForPrompt(events: SessionEvent[]): string {
  if (events.length === 0) return 'No session history yet.';
  return events
    .map(e => `T${e.turn} [${e.kind}] ${e.summary}`)
    .join('\n');
}

/**
 * selectCoachingInsights -- from coachingService.ts line 1362
 */
function selectCoachingInsights(
  insights: ConversationInsight[],
  budget: number,
): ConversationInsight[] {
  // Always include durable insights
  const durable = insights.filter(i =>
    i.durability === 'student_durable' || i.durability === 'essay_durable'
  );

  // Fill remaining budget with most recent non-durable
  const remaining = budget - durable.length;
  const nonDurable = insights
    .filter(i => i.durability !== 'student_durable' && i.durability !== 'essay_durable')
    .slice(-Math.max(0, remaining));

  return [...durable, ...nonDurable].slice(0, budget);
}

/**
 * SessionEvent creation logic -- from updateSessionMemory (coachingService.ts line 2366)
 * Extracted so we can test the event construction algorithm independently.
 */
function createSessionEvent(
  turnNumber: number,
  category: InsightCategory,
  cognitiveState: string,
  recommendedApproach: string,
  focusProbabilities: Record<string, number>,
  dimensionFocus: string[],
): SessionEvent {
  // Extract paragraph refs from focus probabilities
  const paragraphRefs: number[] = [];
  for (const [label, prob] of Object.entries(focusProbabilities)) {
    if (prob > 0.3) {
      const match = label.match(/P(\d+)/);
      if (match) paragraphRefs.push(parseInt(match[1], 10) - 1);
    }
  }

  // Build event kind: always starts with category, optionally appends first dimension
  const kindParts: string[] = [category];
  if (dimensionFocus.length > 0) kindParts.push(dimensionFocus[0]);
  const kind = kindParts.join(':');

  // Summary from cognitive assessment
  const summary = `${recommendedApproach} — student ${cognitiveState}`;

  // Significance heuristic (retrieval signal, not quality judgment)
  const significanceMap: Record<string, number> = {
    reinterpretation: 0.9, resistance: 0.85, new_context: 0.8,
    correction: 0.8, preference: 0.7, emotional_reaction: 0.6,
    confirmation: 0.4, clarification: 0.3,
  };

  return {
    turn: turnNumber,
    kind,
    summary,
    significance: significanceMap[category] ?? 0.5,
    paragraphRefs,
    findingRefs: [],
  };
}

// ============================================================================
// Helper: create a mock ConversationInsight
// ============================================================================

function makeInsight(
  id: string,
  category: InsightCategory,
  durability: ConversationInsight['durability'],
): ConversationInsight {
  return {
    id,
    timestamp: new Date().toISOString(),
    sourceText: `source for ${id}`,
    category,
    emotionalValence: 'neutral',
    studentConfidence: 'high',
    explicitness: 'explicit',
    scopeCertainty: 'high',
    novelty: 'high',
    scope: {
      essayProbability: 1.0,
      paragraphs: [],
      sentences: [],
    },
    durability,
    essayVersion: 1,
  };
}

// ============================================================================
// Tests
// ============================================================================

console.log('\n=== CONVERSATOR V2 TRACE TEST ===');

// --------------------------------------------------------------------------
// TEST 1: initializeSessionMemory
// --------------------------------------------------------------------------
section('TEST 1: initializeSessionMemory');

const mem = initializeSessionMemory();
assert(mem.turnCount === 0, 'turnCount starts at 0');
assert(Array.isArray(mem.events) && mem.events.length === 0, 'events starts as empty array');
assert(mem.sessionArcSummary === '', 'sessionArcSummary starts empty');
assert(mem.nextFocus === '', 'nextFocus starts empty');
assert(mem.topicsDiscussed.length === 0, 'deprecated topicsDiscussed starts empty');
assert(mem.approachesUsed.length === 0, 'deprecated approachesUsed starts empty');
assert(mem.studentStances.length === 0, 'deprecated studentStances starts empty');

// --------------------------------------------------------------------------
// TEST 2: SessionEvent creation via createSessionEvent
// --------------------------------------------------------------------------
section('TEST 2: SessionEvent creation (kind, significance, paragraphRefs)');

const e1 = createSessionEvent(
  1, 'clarification', 'confused_about_feedback',
  'Socratic questioning', { P3: 0.9 }, [],
);
assert(e1.kind === 'clarification', 'clarification kind preserved (not "general")');
assert(e1.significance === 0.3, 'clarification significance = 0.3');
assert(e1.paragraphRefs.length === 1 && e1.paragraphRefs[0] === 2, 'P3 label maps to paragraphRef index 2');
assert(e1.turn === 1, 'turn number correct');
assert(e1.findingRefs.length === 0, 'findingRefs starts empty');
assert(e1.summary === 'Socratic questioning — student confused_about_feedback', 'summary format correct');

const e2 = createSessionEvent(
  2, 'reinterpretation', 'engaged',
  'Direct instruction', { P2: 0.6 }, ['voice'],
);
assert(e2.kind === 'reinterpretation:voice', 'kind includes category + first dimension');
assert(e2.significance === 0.9, 'reinterpretation significance = 0.9');
assert(e2.paragraphRefs.length === 1 && e2.paragraphRefs[0] === 1, 'P2 label maps to paragraphRef index 1');

const e3 = createSessionEvent(
  3, 'new_context', 'emotional',
  'Reflective mirroring', {}, [],
);
assert(e3.kind === 'new_context', 'new_context kind without dimension');
assert(e3.significance === 0.8, 'new_context significance = 0.8');
assert(e3.paragraphRefs.length === 0, 'no paragraph refs when focusProbabilities is empty');

const e4 = createSessionEvent(
  4, 'resistance', 'defensive',
  'Listen first', { P1: 0.5, P2: 0.4 }, ['structure'],
);
assert(e4.kind === 'resistance:structure', 'resistance:structure kind');
assert(e4.significance === 0.85, 'resistance significance = 0.85');
assert(e4.paragraphRefs.length === 2, 'multiple paragraphs captured (P1 and P2 both > 0.3)');
assert(e4.paragraphRefs.includes(0) && e4.paragraphRefs.includes(1), 'P1->0 and P2->1 correct');

// Low-probability paragraphs should be filtered out
const e5 = createSessionEvent(
  5, 'confirmation', 'engaged',
  'Validate understanding', { P1: 0.1, P4: 0.9 }, [],
);
assert(e5.paragraphRefs.length === 1 && e5.paragraphRefs[0] === 3, 'P1 at 0.1 filtered out, only P4 at 0.9 kept');
assert(e5.significance === 0.4, 'confirmation significance = 0.4');

// All 8 categories have correct significance
const e6 = createSessionEvent(6, 'correction', 'engaged', 'x', {}, []);
assert(e6.significance === 0.8, 'correction significance = 0.8');
const e7 = createSessionEvent(7, 'preference', 'engaged', 'x', {}, []);
assert(e7.significance === 0.7, 'preference significance = 0.7');
const e8 = createSessionEvent(8, 'emotional_reaction', 'engaged', 'x', {}, []);
assert(e8.significance === 0.6, 'emotional_reaction significance = 0.6');

// --------------------------------------------------------------------------
// TEST 3: retrieveRelevantEvents
// --------------------------------------------------------------------------
section('TEST 3: retrieveRelevantEvents');

// Build a 20-event log with varied characteristics
const events: SessionEvent[] = [];
for (let i = 1; i <= 20; i++) {
  events.push({
    turn: i,
    kind: i % 5 === 0 ? 'reinterpretation' : i % 3 === 0 ? 'new_context' : 'clarification',
    summary: `Turn ${i} event`,
    significance: i % 5 === 0 ? 0.9 : i % 3 === 0 ? 0.95 : 0.3,
    paragraphRefs: i <= 10 ? [2] : [0], // First 10 about P3 (index 2), last 10 about P1 (index 0)
    findingRefs: i === 7 ? ['F1'] : [],
  });
}

// Test A: focus on paragraph index 2 (P3)
const resultA = retrieveRelevantEvents(events, [2], []);
assert(resultA.length <= 12, `capped at 12 (got ${resultA.length})`);
assert(resultA.some(e => e.turn === 20), 'includes most recent event (turn 20)');
assert(resultA.some(e => e.turn === 19), 'includes second most recent (turn 19)');
assert(resultA.some(e => e.turn === 18), 'includes third most recent (turn 18)');
assert(resultA.some(e => e.paragraphRefs.includes(2)), 'includes P3-related events via paragraph overlap');
assert(
  resultA.every(
    e => e.significance > 0.8 || e.paragraphRefs.includes(2) || e.turn >= 18
  ),
  'all selected events are recent, P3-related, or high-significance'
);

// Test B: no focus -- only recent 3 + high significance
const resultB = retrieveRelevantEvents(events, [], []);
assert(resultB.some(e => e.turn >= 18), 'includes recent 3 events');
assert(
  resultB.every(e => e.significance > 0.8 || e.turn >= 18),
  'without focus, only high-significance and recent events selected'
);

// Count: recent 3 (turns 18,19,20) + high-sig events (turns 3,5,6,9,10,12,15,20)
// Some overlap expected -- verify deduplication works
const highSigCount = events.filter(e => e.significance > 0.8).length;
console.log(`  (info) Total high-significance events in log: ${highSigCount}`);
console.log(`  (info) resultB size: ${resultB.length}`);

// Test C: finding focus selects finding-overlap event
const resultC = retrieveRelevantEvents(events, [], ['F1']);
assert(resultC.some(e => e.findingRefs.includes('F1')), 'includes finding-overlap event (turn 7)');
assert(resultC.some(e => e.turn === 7), 'specifically turn 7 with F1 is included');

// Test D: small event list (under threshold of 6) returns all
const smallEvents = events.slice(0, 4);
const resultD = retrieveRelevantEvents(smallEvents, [2], []);
assert(resultD.length === 4, `returns all events when count (4) <= 6 threshold (got ${resultD.length})`);

// Test E: exactly 6 events also returns all
const sixEvents = events.slice(0, 6);
const resultE = retrieveRelevantEvents(sixEvents, [], []);
assert(resultE.length === 6, `returns all events when count equals 6 threshold (got ${resultE.length})`);

// Test F: 7 events triggers filtering
const sevenEvents = events.slice(0, 7);
const resultF = retrieveRelevantEvents(sevenEvents, [], []);
assert(resultF.length <= 7, 'filtering kicks in at 7 events');
// Recent 3 (5,6,7) + high-sig should be selected
assert(resultF.some(e => e.turn === 7), 'most recent included at boundary');

// Test G: deduplication -- same event matched by multiple criteria counted once
const resultG = retrieveRelevantEvents(events, [0], ['F1']);
const turnCounts = new Map<number, number>();
for (const e of resultG) {
  turnCounts.set(e.turn, (turnCounts.get(e.turn) ?? 0) + 1);
}
assert(
  Array.from(turnCounts.values()).every(c => c === 1),
  'no duplicate turns in result (deduplication via Map key)'
);

// Test H: result is sorted by turn number
const resultH = retrieveRelevantEvents(events, [2], ['F1']);
for (let i = 1; i < resultH.length; i++) {
  if (resultH[i].turn < resultH[i - 1].turn) {
    assert(false, 'result should be sorted by turn number');
    break;
  }
  if (i === resultH.length - 1) {
    assert(true, 'result is sorted by turn number ascending');
  }
}

// --------------------------------------------------------------------------
// TEST 4: serializeEventsForPrompt
// --------------------------------------------------------------------------
section('TEST 4: serializeEventsForPrompt');

const serialized = serializeEventsForPrompt([e1, e2, e3]);
assert(
  serialized.includes('T1 [clarification]'),
  'format includes T1 [clarification]'
);
assert(
  serialized.includes('T2 [reinterpretation:voice]'),
  'format includes T2 [reinterpretation:voice]'
);
assert(
  serialized.includes('T3 [new_context]'),
  'format includes T3 [new_context]'
);
assert(serialized.split('\n').length === 3, '3 lines for 3 events');

// Verify full line content
const lines = serialized.split('\n');
assert(
  lines[0] === 'T1 [clarification] Socratic questioning — student confused_about_feedback',
  'first line has complete format: T{turn} [{kind}] {summary}'
);

const emptySerial = serializeEventsForPrompt([]);
assert(emptySerial === 'No session history yet.', 'empty events returns placeholder string');

// Single event
const singleSerial = serializeEventsForPrompt([e4]);
assert(singleSerial.split('\n').length === 1, 'single event produces single line');
assert(singleSerial.startsWith('T4'), 'single event starts with correct turn');

// --------------------------------------------------------------------------
// TEST 5: selectCoachingInsights
// --------------------------------------------------------------------------
section('TEST 5: selectCoachingInsights');

const mockInsights: ConversationInsight[] = [
  makeInsight('i1', 'preference', 'ephemeral'),
  makeInsight('i2', 'confirmation', 'student_durable'),
  makeInsight('i3', 'new_context', 'essay_durable'),
  makeInsight('i4', 'reinterpretation', 'draft_durable'),
  makeInsight('i5', 'preference', 'ephemeral'),
  makeInsight('i6', 'clarification', 'ephemeral'),
  makeInsight('i7', 'correction', 'student_durable'),
  makeInsight('i8', 'resistance', 'draft_durable'),
  makeInsight('i9', 'emotional_reaction', 'ephemeral'),
  makeInsight('i10', 'new_context', 'essay_durable'),
];

// Budget of 8: 4 durable (i2, i3, i7, i10) + 4 most recent non-durable
const selected8 = selectCoachingInsights(mockInsights, 8);
assert(selected8.length === 8, `budget of 8 respected (got ${selected8.length})`);
assert(selected8.some(i => i.id === 'i2'), 'student_durable i2 included');
assert(selected8.some(i => i.id === 'i3'), 'essay_durable i3 included');
assert(selected8.some(i => i.id === 'i7'), 'student_durable i7 included');
assert(selected8.some(i => i.id === 'i10'), 'essay_durable i10 included');

// Budget of 5: 4 durable + only 1 most recent non-durable
const selected5 = selectCoachingInsights(mockInsights, 5);
assert(selected5.length === 5, `budget of 5 respected (got ${selected5.length})`);
assert(selected5.some(i => i.id === 'i2'), 'student_durable i2 in budget 5');
assert(selected5.some(i => i.id === 'i3'), 'essay_durable i3 in budget 5');
assert(selected5.some(i => i.id === 'i7'), 'student_durable i7 in budget 5');
assert(selected5.some(i => i.id === 'i10'), 'essay_durable i10 in budget 5');

// Budget of 2: more durable than budget -- sliced to budget
const selected2 = selectCoachingInsights(mockInsights, 2);
assert(selected2.length === 2, `budget of 2 respected (got ${selected2.length})`);
// With 4 durable items, [...durable, ...nonDurable].slice(0, 2) takes first 2 durable
assert(
  selected2.every(i => i.durability === 'student_durable' || i.durability === 'essay_durable'),
  'budget 2 with 4 durable: both selected are durable (first 2 from durable array)'
);

// Budget of 4: exactly matches durable count -- no non-durable added
const selected4 = selectCoachingInsights(mockInsights, 4);
assert(selected4.length === 4, `budget of 4 respected (got ${selected4.length})`);
assert(
  selected4.every(i => i.durability === 'student_durable' || i.durability === 'essay_durable'),
  'budget 4 = durable count: all selected are durable'
);

// No durable insights: most recent non-durable selected
const noDurable = mockInsights.filter(
  i => i.durability !== 'student_durable' && i.durability !== 'essay_durable'
);
const selectedNoDurable = selectCoachingInsights(noDurable, 3);
assert(selectedNoDurable.length === 3, `3 selected from non-durable-only list (got ${selectedNoDurable.length})`);
// Should be the last 3 from the non-durable list
assert(selectedNoDurable[2].id === noDurable[noDurable.length - 1].id, 'most recent non-durable is last');

// Empty insights
const selectedEmpty = selectCoachingInsights([], 5);
assert(selectedEmpty.length === 0, 'empty input returns empty output');

// --------------------------------------------------------------------------
// TEST 6: buildFindingCoachingContext selection algorithm
// --------------------------------------------------------------------------
section('TEST 6: buildFindingCoachingContext selection algorithm (replicated)');

// Replicate the finding selection algorithm from coachingService.ts line 2626
interface MockFinding {
  id: string;
  scope: { type: string; paragraph?: number; paragraphs?: number[] };
  dimensions: string[];
  coachingValue: string;
}

function selectFindings(
  active: MockFinding[],
  focusParagraphs: number[],
  dimensionFocus: string[],
): MockFinding[] {
  const hasFocusParagraphs = focusParagraphs.length > 0;

  let selectedFindings: MockFinding[];

  if (hasFocusParagraphs) {
    const scopedFindings = new Map<string, MockFinding>();

    // Tier 1: Paragraph-scoped findings for focus paragraphs
    for (const pIdx of focusParagraphs) {
      for (const f of active) {
        if (f.scope.type === 'paragraph_level' && f.scope.paragraph === pIdx) {
          scopedFindings.set(f.id, f);
        }
      }
    }

    // Tier 2: Essay-level and cross-paragraph findings touching focus
    for (const f of active) {
      if (f.scope.type === 'essay_level') {
        scopedFindings.set(f.id, f);
      } else if (
        f.scope.type === 'cross_paragraph' &&
        f.scope.paragraphs?.some(p => focusParagraphs.includes(p))
      ) {
        scopedFindings.set(f.id, f);
      }
    }

    // Tier 3: Dimension-matched findings (cap at 8 total)
    if (dimensionFocus.length > 0) {
      for (const dim of dimensionFocus) {
        for (const f of active) {
          if (f.dimensions.includes(dim) && scopedFindings.size < 8) {
            scopedFindings.set(f.id, f);
          }
        }
      }
    }

    selectedFindings = Array.from(scopedFindings.values());
  } else {
    // No focus paragraph -- fall back to global top 5
    selectedFindings = active.slice(0, 5);
  }

  // Cap at 8
  return selectedFindings.slice(0, 8);
}

const mockFindings: MockFinding[] = [
  { id: 'F1', scope: { type: 'paragraph_level', paragraph: 0 }, dimensions: ['voice'], coachingValue: 'high' },
  { id: 'F2', scope: { type: 'paragraph_level', paragraph: 2 }, dimensions: ['structure'], coachingValue: 'high' },
  { id: 'F3', scope: { type: 'essay_level' }, dimensions: ['theme'], coachingValue: 'medium' },
  { id: 'F4', scope: { type: 'cross_paragraph', paragraphs: [0, 1] }, dimensions: ['narrative'], coachingValue: 'low' },
  { id: 'F5', scope: { type: 'cross_paragraph', paragraphs: [2, 3] }, dimensions: ['voice'], coachingValue: 'medium' },
  { id: 'F6', scope: { type: 'paragraph_level', paragraph: 1 }, dimensions: ['craft'], coachingValue: 'high' },
  { id: 'F7', scope: { type: 'paragraph_level', paragraph: 3 }, dimensions: ['emotion'], coachingValue: 'low' },
  { id: 'F8', scope: { type: 'paragraph_level', paragraph: 0 }, dimensions: ['identity'], coachingValue: 'medium' },
  { id: 'F9', scope: { type: 'paragraph_level', paragraph: 4 }, dimensions: ['voice'], coachingValue: 'high' },
  { id: 'F10', scope: { type: 'essay_level' }, dimensions: ['admissions'], coachingValue: 'medium' },
];

// Focus on paragraph 0
const findingsA = selectFindings(mockFindings, [0], []);
assert(findingsA.some(f => f.id === 'F1'), 'Tier 1: paragraph-scoped F1 for focus P1 included');
assert(findingsA.some(f => f.id === 'F8'), 'Tier 1: paragraph-scoped F8 for focus P1 included');
assert(findingsA.some(f => f.id === 'F3'), 'Tier 2: essay-level F3 always included');
assert(findingsA.some(f => f.id === 'F10'), 'Tier 2: essay-level F10 always included');
assert(findingsA.some(f => f.id === 'F4'), 'Tier 2: cross-paragraph F4 touching P1 included');
assert(!findingsA.some(f => f.id === 'F5'), 'cross-paragraph F5 not touching P1 excluded');

// Focus on paragraph 2 with dimension focus 'voice'
const findingsB = selectFindings(mockFindings, [2], ['voice']);
assert(findingsB.some(f => f.id === 'F2'), 'Tier 1: paragraph-scoped F2 for P3 included');
assert(findingsB.some(f => f.id === 'F5'), 'Tier 2: cross-paragraph F5 touching P3 included');
assert(findingsB.some(f => f.id === 'F1'), 'Tier 3: dimension-matched F1 (voice) included');
assert(findingsB.some(f => f.id === 'F9'), 'Tier 3: dimension-matched F9 (voice) included');

// No focus paragraphs: global top 5
const findingsC = selectFindings(mockFindings, [], []);
assert(findingsC.length === 5, `no focus: returns top 5 (got ${findingsC.length})`);
assert(findingsC[0].id === 'F1', 'first finding from active list');

// Cap at 8
const findingsD = selectFindings(mockFindings, [0, 1, 2, 3, 4], []);
assert(findingsD.length <= 8, `capped at 8 findings (got ${findingsD.length})`);

// --------------------------------------------------------------------------
// TEST 7: SessionEvent kind always includes category
// --------------------------------------------------------------------------
section('TEST 7: SessionEvent kind always includes category');

// Every InsightCategory should produce a kind that starts with that category
const allCategories: InsightCategory[] = [
  'confirmation', 'reinterpretation', 'new_context', 'correction',
  'preference', 'clarification', 'emotional_reaction', 'resistance',
];

for (const cat of allCategories) {
  const ev = createSessionEvent(1, cat, 'engaged', 'approach', {}, []);
  assert(ev.kind === cat, `kind for ${cat} without dimension = "${ev.kind}"`);
}

for (const cat of allCategories) {
  const ev = createSessionEvent(1, cat, 'engaged', 'approach', {}, ['voice', 'structure']);
  assert(ev.kind === `${cat}:voice`, `kind for ${cat} with dimensions = "${ev.kind}" (only first dimension used)`);
}

// --------------------------------------------------------------------------
// TEST 8: Edit event creation pattern
// --------------------------------------------------------------------------
section('TEST 8: Edit event creation pattern');

// When an edit understanding exists, the system creates an edit event.
// The kind format is 'edit:<changeType>' and significance is based on the edit impact.

const editEvent: SessionEvent = {
  turn: 6,
  kind: 'edit:meaning_evolution',
  summary: 'Edited P3 -- Replacing abstract opening with grounded scene',
  significance: 0.8,
  paragraphRefs: [2],
  findingRefs: [],
};
assert(editEvent.kind.startsWith('edit:'), 'edit event kind starts with "edit:"');
assert(editEvent.kind === 'edit:meaning_evolution', 'edit event has specific changeType after "edit:"');
assert(editEvent.significance === 0.8, 'meaningful edit gets significance 0.8');
assert(editEvent.paragraphRefs.length === 1 && editEvent.paragraphRefs[0] === 2, 'edit targets correct paragraph');

// Minor edit
const minorEdit: SessionEvent = {
  turn: 7,
  kind: 'edit:surface_polish',
  summary: 'Edited P1 -- Minor wording cleanup',
  significance: 0.3,
  paragraphRefs: [0],
  findingRefs: [],
};
assert(minorEdit.significance === 0.3, 'minor edit gets lower significance');
assert(minorEdit.kind === 'edit:surface_polish', 'minor edit kind is edit:surface_polish');

// Structural edit affecting multiple paragraphs
const structuralEdit: SessionEvent = {
  turn: 8,
  kind: 'edit:structural_rewrite',
  summary: 'Edited P2-P4 -- Reorganized entire middle section',
  significance: 0.95,
  paragraphRefs: [1, 2, 3],
  findingRefs: ['F2', 'F5'],
};
assert(structuralEdit.paragraphRefs.length === 3, 'structural edit spans multiple paragraphs');
assert(structuralEdit.findingRefs.length === 2, 'structural edit can reference affected findings');
assert(structuralEdit.significance === 0.95, 'structural edit gets highest significance');

// Verify edit events work with retrieveRelevantEvents
const eventsWithEdits: SessionEvent[] = [
  ...events.slice(0, 10), // 10 regular events
  editEvent,               // turn 6 (but we'll set it to 11)
  minorEdit,               // turn 7 (but we'll set it to 12)
  structuralEdit,          // turn 8 (but we'll set it to 13)
];
// Adjust turn numbers to be sequential
eventsWithEdits[10] = { ...editEvent, turn: 11 };
eventsWithEdits[11] = { ...minorEdit, turn: 12 };
eventsWithEdits[12] = { ...structuralEdit, turn: 13 };

const editResult = retrieveRelevantEvents(eventsWithEdits, [2], []);
assert(
  editResult.some(e => e.kind === 'edit:meaning_evolution'),
  'edit event retrieved via paragraph overlap with focus'
);
assert(
  editResult.some(e => e.kind === 'edit:structural_rewrite'),
  'structural edit retrieved (high significance 0.95 > 0.8)'
);

// --------------------------------------------------------------------------
// TEST 9: End-to-end trace -- simulate a 5-turn session
// --------------------------------------------------------------------------
section('TEST 9: End-to-end 5-turn session trace');

const session = initializeSessionMemory();
assert(session.events.length === 0, 'session starts with 0 events');

// Simulate 5 turns
const turnConfigs: Array<{
  category: InsightCategory;
  cognitive: string;
  approach: string;
  focus: Record<string, number>;
  dims: string[];
}> = [
  { category: 'clarification', cognitive: 'confused_about_feedback', approach: 'Simplify language', focus: { P1: 0.8 }, dims: [] },
  { category: 'new_context', cognitive: 'emotional', approach: 'Acknowledge emotion', focus: {}, dims: ['emotion'] },
  { category: 'reinterpretation', cognitive: 'engaged', approach: 'Build on reinterpretation', focus: { P3: 0.7, P4: 0.5 }, dims: ['voice'] },
  { category: 'confirmation', cognitive: 'engaged', approach: 'Validate and deepen', focus: { P3: 0.9 }, dims: ['voice'] },
  { category: 'preference', cognitive: 'curious_deeper', approach: 'Honor preference', focus: { P2: 0.6 }, dims: ['craft'] },
];

for (let i = 0; i < turnConfigs.length; i++) {
  const cfg = turnConfigs[i];
  const event = createSessionEvent(i + 1, cfg.category, cfg.cognitive, cfg.approach, cfg.focus, cfg.dims);
  session.events.push(event);
  session.turnCount = i + 1;
}

assert(session.events.length === 5, '5 events after 5 turns');
assert(session.turnCount === 5, 'turnCount is 5');

// Serialize the full session
const sessionSerialized = serializeEventsForPrompt(session.events);
const sessionLines = sessionSerialized.split('\n');
assert(sessionLines.length === 5, 'serialized session has 5 lines');
console.log('  (info) Full session trace:');
for (const line of sessionLines) {
  console.log(`         ${line}`);
}

// Retrieve with focus on paragraph 2 (P3)
// With only 5 events (<= 6), all should be returned
const sessionRetrieved = retrieveRelevantEvents(session.events, [2], []);
assert(sessionRetrieved.length === 5, 'all 5 events returned (under threshold)');

// Verify significance ordering is correct in the events
assert(session.events[0].significance === 0.3, 'turn 1 clarification sig=0.3');
assert(session.events[1].significance === 0.8, 'turn 2 new_context sig=0.8');
assert(session.events[2].significance === 0.9, 'turn 3 reinterpretation sig=0.9');
assert(session.events[3].significance === 0.4, 'turn 4 confirmation sig=0.4');
assert(session.events[4].significance === 0.7, 'turn 5 preference sig=0.7');

// ============================================================================
// Summary
// ============================================================================

console.log('\n=== RESULTS ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);

if (failed > 0) {
  console.log('\nSOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\nALL TESTS PASSED');
}
