/**
 * Unit tests for coaching mode detection.
 * No API calls — pure logic tests.
 *
 * Run: npx tsx tests/test-mode-detection.ts
 */

import { detectCoachingMode } from '../../src/services/essayIntelligence/coaching/modeDetection';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ ${name}`);
    failed++;
  }
}

console.log('\n=== Coaching Mode Detection Tests ===\n');

// ── Test 1: No edit context, no history → first_encounter ──
console.log('Test 1: No edit context, no history');
assert(
  detectCoachingMode(undefined, undefined, 0, 'What do you think of my essay?', false)
    === 'first_encounter',
  'No edit context + no history → first_encounter',
);

// ── Test 2: No edit context, has history → first_encounter ──
console.log('Test 2: No edit context, has history');
assert(
  detectCoachingMode(undefined, undefined, 0, 'Tell me about my opening', true)
    === 'first_encounter',
  'No edit context + has history → first_encounter (conversation)',
);

// ── Test 3: Edit context present, low edit count → revision_response ──
console.log('Test 3: Edit context present, low edit count');
assert(
  detectCoachingMode('Change type: content rewrite', 'significant', 1, 'How is this?', true)
    === 'revision_response',
  'Edit context + editCount=1 → revision_response',
);

// ── Test 4: Edit context present, high edit count → iteration_deep ──
console.log('Test 4: Edit context present, high edit count (3+)');
assert(
  detectCoachingMode('Change type: word refinement', 'minor', 3, 'Better?', true)
    === 'iteration_deep',
  'Edit context + editCount=3 → iteration_deep',
);

assert(
  detectCoachingMode('Change type: content rewrite', 'significant', 5, 'How about now?', true)
    === 'iteration_deep',
  'Edit context + editCount=5 → iteration_deep',
);

// ── Test 5: Edit context present, edit count exactly 2 → revision_response ──
console.log('Test 5: Edit context present, edit count=2 (not yet iteration)');
assert(
  detectCoachingMode('Change type: meaning evolution', 'moderate', 2, 'What do you think?', true)
    === 'revision_response',
  'Edit context + editCount=2 → revision_response (threshold is 3)',
);

// ── Test 6: Chat-pasted revision (revision language + substantial prose + history) ──
console.log('Test 6: Chat-pasted revision detection');
const longRevisionMessage = `I rewrote my opening paragraph. Here it is: "The bench was still warm when I sat down. Mrs. Chen had just finished the Nocturne, and the last chord was still hanging in the room — not an echo exactly, but a weight in the air. I put my hands where hers had been and played the same opening phrase. Mine sounded thinner. I played it again, slower this time, listening for the spaces between the notes the way she always told me to."`;
assert(
  detectCoachingMode(undefined, undefined, 0, longRevisionMessage, true)
    === 'revision_response',
  'Revision language + >40 words + hasAnyEdits → revision_response',
);

// ── Test 7: Chat-pasted revision language but short message → first_encounter ──
console.log('Test 7: Revision language but short message');
assert(
  detectCoachingMode(undefined, undefined, 0, 'I rewrote my opening', true)
    === 'first_encounter',
  'Revision language but <40 words → first_encounter (not enough prose)',
);

// ── Test 8: Long message without revision language but substantial prose ──
// With detectInSessionDraft: 60+ words, no questions → revision_response (in-session draft)
console.log('Test 8: Long prose message (60+ words, no questions) → revision_response via in-session draft');
const longNonRevisionMessage = `My grandmother used to tell me stories about growing up in Vietnam. She would sit on the porch and talk about the river near her village, the way the water would change color with the seasons. I never understood why she kept going back to those stories until I started writing this essay. Now I think maybe she was teaching me something about memory and place and belonging that I'm only starting to understand.`;
assert(
  detectCoachingMode(undefined, undefined, 0, longNonRevisionMessage, true)
    === 'revision_response',
  'Long prose (60+ words, no questions) → revision_response (in-session draft detected)',
);

// ── Test 9: Revision language + prose but NO edit history ──
// detectChatPastedRevision requires hasAnyEdits=true, BUT detectInSessionDraft
// doesn't check hasAnyEdits — it triggers on revision language + substantial prose
console.log('Test 9: Revision language + prose, no edit history → revision_response via in-session draft');
assert(
  detectCoachingMode(undefined, undefined, 0, longRevisionMessage, false)
    === 'revision_response',
  'Revision language + prose, hasAnyEdits=false → revision_response (in-session draft)',
);

// ── Test 10: "Here's my new version" variant ──
console.log('Test 10: Alternative revision language patterns');
const altRevisionMessage = `Here's my new version of the opening: "The first time I sat down at Mrs. Chen's piano, the keys were still warm from her fingers. She'd been playing Chopin — I could tell from the way the sustain pedal was still humming. I pressed middle C and held it, listening to her music fade into mine, wondering if the piano could tell the difference."`;
assert(
  detectCoachingMode(undefined, undefined, 0, altRevisionMessage, true)
    === 'revision_response',
  '"Here\'s my new version" + prose + history → revision_response',
);

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 2 TESTS: Architecture + Polish modes
// ══════════════════════════════════════════════════════════════════════════════

console.log('\n--- Phase 2: Architecture + Polish Mode Tests ---\n');

// ── Test 11: Structural reorganization → architecture ──
console.log('Test 11: Structural reorganization → architecture');
assert(
  detectCoachingMode(
    'Change type: structural reorganization', 'significant', 1, 'How does this order work?', true,
    'structural_reorganization', 'architecture',
  ) === 'architecture',
  'structural_reorganization changeType → architecture',
);

// ── Test 12: Architecture takes priority over iteration_deep ──
console.log('Test 12: Architecture priority over iteration_deep');
assert(
  detectCoachingMode(
    'Change type: structural reorganization', 'significant', 5, 'Better?', true,
    'structural_reorganization', 'craft',
  ) === 'architecture',
  'structural_reorganization + high editCount → architecture (not iteration_deep)',
);

// ── Test 13: Minor edit during polish phase → polish ──
console.log('Test 13: Minor edit during polish phase → polish');
assert(
  detectCoachingMode(
    'Change type: word refinement', 'minor', 1, 'How about this word?', true,
    'word_refinement', 'polish',
  ) === 'polish',
  'minor significance + polish phase → polish',
);

// ── Test 14: Minor edit during distinction phase → polish ──
console.log('Test 14: Minor edit during distinction phase → polish');
assert(
  detectCoachingMode(
    'Change type: word refinement', 'minor', 1, 'Better?', true,
    'word_refinement', 'distinction',
  ) === 'polish',
  'minor significance + distinction phase → polish',
);

// ── Test 15: Minor edit during craft phase → revision_response (not polish) ──
console.log('Test 15: Minor edit during craft phase → revision_response');
assert(
  detectCoachingMode(
    'Change type: word refinement', 'minor', 1, 'How is this?', true,
    'word_refinement', 'craft',
  ) === 'revision_response',
  'minor significance + craft phase → revision_response (polish only for polish/distinction)',
);

// ── Test 16: Significant edit during polish phase → revision_response (not polish) ──
console.log('Test 16: Significant edit during polish phase → revision_response');
assert(
  detectCoachingMode(
    'Change type: content rewrite', 'significant', 1, 'I rewrote P2', true,
    'content_expansion', 'polish',
  ) === 'revision_response',
  'significant edit + polish phase → revision_response (polish only for minor edits)',
);

// ── Test 17: Non-structural changeType with edit context → revision_response ──
console.log('Test 17: Non-structural changeType → revision_response');
assert(
  detectCoachingMode(
    'Change type: meaning evolution', 'moderate', 1, 'What do you think?', true,
    'meaning_evolution', 'architecture',
  ) === 'revision_response',
  'meaning_evolution changeType → revision_response (not architecture)',
);

// ── Test 18: Iteration deep takes priority over polish ──
console.log('Test 18: Iteration deep takes priority over polish');
assert(
  detectCoachingMode(
    'Change type: word refinement', 'minor', 4, 'Better?', true,
    'word_refinement', 'polish',
  ) === 'iteration_deep',
  'minor + polish + editCount=4 → iteration_deep (3+ edits takes priority)',
);

// ── Summary ──
console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failed > 0) {
  process.exit(1);
}
