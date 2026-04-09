/**
 * Unified System Preflight — Verifies all essay types, college overlays,
 * and cross-module integration work correctly.
 *
 * No API calls. Tests prompt composition for all essay types and college overlays.
 *
 * Run: npx tsx tests/test-unified-system-preflight.ts
 */

import { buildCoachingPrompt } from '../src/services/essayIntelligence/coaching/promptBlocks';
import { getCollegeCoachingOverlay, getAvailableColleges } from '../src/services/essayIntelligence/coaching/collegeOverlay';
import { getTechniqueTeaching, getAvailableTechniques } from '../src/services/essayIntelligence/coaching/techniqueLibrary';
import { assembleStudentContext } from '../src/services/studentNarrativeBridge';
import type { BlockContext } from '../src/services/essayIntelligence/coaching/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) { console.log(`  ✓ ${name}`); passed++; }
  else { console.error(`  ✗ ${name}`); failed++; }
}

console.log('\n=== Unified System Preflight ===\n');

// ── Test 1: Essay type blocks produce content ──
console.log('--- Essay Type Blocks ---\n');

const essayTypes = ['common_app', 'supplement', 'piq', 'activity_description', 'narrative'] as const;

for (const essayType of essayTypes) {
  const ctx: BlockContext = {
    mode: 'first_encounter',
    phase: 'craft',
    essayType,
    collegeId: essayType === 'supplement' ? 'stanford' : undefined,
    promptText: essayType === 'piq' ? 'Describe your leadership experience' : undefined,
  };
  const prompt = await buildCoachingPrompt(ctx);
  assert(prompt.length > 5000, `${essayType} prompt: ${prompt.length} chars`);

  // Verify type-specific content
  if (essayType === 'piq') {
    assert(prompt.includes('350 words'), `PIQ prompt mentions 350 words`);
    assert(prompt.includes('VULNERABILITY'), `PIQ prompt mentions vulnerability`);
    assert(prompt.includes('Describe your leadership'), `PIQ prompt includes student's prompt text`);
  }
  if (essayType === 'activity_description') {
    assert(prompt.includes('150 character'), `Activity desc mentions 150 characters`);
    assert(prompt.includes('verb'), `Activity desc mentions verbs`);
  }
  if (essayType === 'supplement') {
    // Stanford overlay should be included
    assert(prompt.includes('Stanford') || prompt.includes('stanford'), `Supplement prompt includes college name`);
  }
}

// ── Test 2: College overlays for all available colleges ──
console.log('\n--- College Overlays ---\n');

const colleges = getAvailableColleges();
assert(colleges.length >= 10, `${colleges.length} colleges available (≥10)`);

for (const collegeId of colleges) {
  const overlay = await getCollegeCoachingOverlay(collegeId);
  if (overlay) {
    assert(overlay.length > 100, `${collegeId}: ${overlay.length} chars`);
  } else {
    assert(false, `${collegeId}: returned null (expected overlay content)`);
  }
}

// ── Test 3: Technique library ──
console.log('\n--- Technique Library ---\n');

const techniques = await getAvailableTechniques();
assert(techniques.length >= 5, `${techniques.length} techniques available (≥5)`);

for (const techniqueId of techniques.slice(0, 3)) {
  const teaching = await getTechniqueTeaching(techniqueId);
  if (teaching) {
    assert(teaching.why.length > 10, `${techniqueId}: has WHY (${teaching.why.length} chars)`);
    assert(teaching.how.length > 10, `${techniqueId}: has HOW (${teaching.how.length} chars)`);
  } else {
    assert(false, `${techniqueId}: returned null`);
  }
}

// ── Test 4: Cross-module context with full data ──
console.log('\n--- Cross-Module Context ---\n');

const fullContext = assembleStudentContext({
  essayIntelligence: {
    writerPortrait: 'A translator who carries adult weight in a child\'s body',
    revealedQualities: ['protective instinct', 'linguistic creativity', 'structural precarity'],
  },
  activityProfiles: [
    {
      title: 'Medical Interpreter Volunteer',
      tier: 1,
      keyStrengths: ['Bilingual fluency', 'Empathy under pressure', 'Medical terminology'],
      keyMoment: 'Translated cardiac diagnosis for mother at age 12',
      authenticQuote: 'I made that up because I didn\'t have the real words',
    },
  ],
  academicContext: {
    majorDirection: 'Pre-Medicine / Public Health',
    gpaContext: '3.95 UW, strong science track',
    courseLoadSummary: '6 APs including Bio, Chem, Physics',
  },
  piqSummaries: ['PIQ 5: Strong vulnerability about family sacrifice and code-switching'],
});

assert(fullContext.includes('translator'), 'Full context has essay portrait');
assert(fullContext.includes('Medical Interpreter'), 'Full context has activity');
assert(fullContext.includes('Pre-Medicine'), 'Full context has academic direction');
assert(fullContext.includes('PIQ 5'), 'Full context has PIQ summary');
assert(fullContext.includes('I made that up'), 'Full context has authentic quote');

// ── Summary ──
console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
else console.log('\n✅ UNIFIED SYSTEM PREFLIGHT PASSED');
