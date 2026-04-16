/**
 * Cross-Module Context Assembly Unit Tests
 * Tests the studentNarrativeBridge.assembleStudentContext() function.
 * No API calls — pure logic tests.
 *
 * Run: npx tsx tests/test-cross-module-context.ts
 */

import { assembleStudentContext } from '../src/services/studentNarrativeBridge';
import type { StudentModuleOutputs } from '../src/services/studentNarrativeBridge';

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

console.log('\n=== Cross-Module Context Assembly Tests ===\n');

// ── Test 1: Empty inputs → empty string ──
console.log('Test 1: Empty inputs');
assert(assembleStudentContext({}) === '', 'Empty outputs → empty string');
assert(assembleStudentContext({ activityProfiles: [] }) === '', 'Empty activity array → empty string');

// ── Test 2: Activity profiles produce output ──
console.log('Test 2: Activity profiles');
const withActivities = assembleStudentContext({
  activityProfiles: [
    {
      title: 'Robotics Team Captain',
      tier: 1,
      keyStrengths: ['Technical leadership', 'Mentoring younger members'],
      keyMoment: 'Led team to state finals after rebuilding robot in 48 hours',
      authenticQuote: 'I realized the team mattered more than the trophy',
    },
    {
      title: 'Hospital Volunteer',
      tier: 2,
      keyStrengths: ['Patient empathy', 'Communication under pressure'],
    },
  ],
});
assert(withActivities.includes('STUDENT CONTEXT'), 'Has context header');
assert(withActivities.includes('Robotics Team Captain'), 'Contains activity title');
assert(withActivities.includes('Tier 1'), 'Contains tier');
assert(withActivities.includes('Led team to state finals'), 'Contains key moment');
assert(withActivities.includes('I realized the team mattered'), 'Contains authentic quote');
assert(withActivities.includes('Hospital Volunteer'), 'Contains second activity');

// ── Test 3: Essay intelligence context ──
console.log('Test 3: Essay intelligence context');
const withEssay = assembleStudentContext({
  essayIntelligence: {
    writerPortrait: 'A systems thinker who processes experience through craft',
    revealedQualities: ['intellectual curiosity', 'quiet determination'],
    coachingLens: 'Focus on specificity and voice authenticity',
  },
});
assert(withEssay.includes('systems thinker'), 'Contains writer portrait');
assert(withEssay.includes('intellectual curiosity'), 'Contains revealed qualities');
assert(withEssay.includes('Focus on specificity'), 'Contains coaching lens');

// ── Test 4: Academic context ──
console.log('Test 4: Academic context');
const withAcademic = assembleStudentContext({
  academicContext: {
    gpaContext: '3.8 unweighted, strong STEM',
    majorDirection: 'Biomedical Engineering',
    courseLoadSummary: '5 APs, focus on bio + physics',
  },
});
assert(withAcademic.includes('Biomedical Engineering'), 'Contains major direction');
assert(withAcademic.includes('3.8 unweighted'), 'Contains GPA context');

// ── Test 5: Full cross-module context ──
console.log('Test 5: Full cross-module context');
const fullContext = assembleStudentContext({
  essayIntelligence: {
    writerPortrait: 'Someone who translates between worlds',
    revealedQualities: ['protective instinct', 'linguistic creativity'],
  },
  activityProfiles: [
    {
      title: 'Medical Interpreter',
      tier: 1,
      keyStrengths: ['Bilingual fluency', 'Empathy under pressure'],
      keyMoment: 'Translated a cardiac diagnosis for her mother at age 12',
    },
  ],
  academicContext: {
    majorDirection: 'Pre-Medicine',
    gpaContext: '3.9 unweighted',
  },
  piqSummaries: ['Strong vulnerability in PIQ 5 about family sacrifice'],
});
assert(fullContext.includes('translates between worlds'), 'Has essay portrait');
assert(fullContext.includes('Medical Interpreter'), 'Has activity');
assert(fullContext.includes('Pre-Medicine'), 'Has academic direction');
assert(fullContext.includes('PIQ 5'), 'Has PIQ summary');

// Token count check — should be compact
const tokenEstimate = Math.ceil(fullContext.length / 4);
assert(tokenEstimate < 500, `Full context is compact: ~${tokenEstimate} tokens (< 500)`);

// ── Summary ──
console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
