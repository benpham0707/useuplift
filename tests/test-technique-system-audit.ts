/**
 * Technique System Audit Test
 *
 * Verifies that all 8 techniques have:
 * 1. Equal data depth in TECHNIQUE_BUNDLES (incl. transformations)
 * 2. Research-backed sources in techniqueSources
 * 3. Correct routing for non-storytelling scenarios
 * 4. Correct property access in Router prompt template
 * 5. Correct property access in Batch generation service
 */

import { TECHNIQUE_BUNDLES, TECHNIQUE_PRIORITIES_BY_TYPE, TECHNIQUE_PREFERENCES_BY_ELEMENT, type TechniqueCategory } from '../src/services/commonAppWorkshop/services/techniqueCategories';
import { techniqueDecisionTree } from '../src/services/commonAppWorkshop/services/techniqueDecisionTree';
import { getSourcesForTechnique, getTechniqueSourceStats } from '../src/services/commonAppWorkshop/data/techniqueSources';

const ALL_TECHNIQUES: TechniqueCategory[] = [
  'storytelling', 'technical_depth', 'evidence_impact', 'intellectual_character',
  'reflection_depth', 'voice_authenticity', 'complexity_showcase', 'connection_specificity'
];

let passed = 0;
let failed = 0;
let total = 0;

function assert(condition: boolean, description: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ ${description}`);
  } else {
    failed++;
    console.error(`  ❌ ${description}`);
  }
}

// ============================================================================
// TEST 1: All techniques have equal bundle depth
// ============================================================================
console.log('\n═══ TEST 1: Technique Bundle Depth Equality ═══');

for (const technique of ALL_TECHNIQUES) {
  const bundle = TECHNIQUE_BUNDLES[technique];
  assert(bundle !== undefined, `${technique}: bundle exists`);
  assert(bundle.corePrinciples.length >= 4, `${technique}: has ${bundle.corePrinciples.length} corePrinciples (≥4)`);
  assert(bundle.examplePhrases.length >= 4, `${technique}: has ${bundle.examplePhrases.length} examplePhrases (≥4)`);
  assert(bundle.antiPatterns.length >= 4, `${technique}: has ${bundle.antiPatterns.length} antiPatterns (≥4)`);
  assert(bundle.integrationTips.length >= 2, `${technique}: has ${bundle.integrationTips.length} integrationTips (≥2)`);
  assert(bundle.whenToUse.length >= 3, `${technique}: has ${bundle.whenToUse.length} whenToUse (≥3)`);
  assert(bundle.whenToAvoid.length >= 2, `${technique}: has ${bundle.whenToAvoid.length} whenToAvoid (≥2)`);
  assert(bundle.transformations.length >= 1, `${technique}: has ${bundle.transformations.length} transformations (≥1)`);

  // Verify transformation structure
  for (const t of bundle.transformations) {
    assert(typeof t.before === 'string' && t.before.length > 0, `${technique}: transformation has non-empty 'before'`);
    assert(typeof t.after === 'string' && t.after.length > 0, `${technique}: transformation has non-empty 'after'`);
    assert(typeof t.why_it_works === 'string' && t.why_it_works.length > 0, `${technique}: transformation has non-empty 'why_it_works'`);
  }
}

// ============================================================================
// TEST 2: All techniques have research sources
// ============================================================================
console.log('\n═══ TEST 2: Research Source Coverage ═══');

const stats = getTechniqueSourceStats();
console.log(`  Total technique sources: ${stats.total}`);

for (const technique of ALL_TECHNIQUES) {
  const sources = getSourcesForTechnique(technique);
  assert(sources.length >= 2, `${technique}: has ${sources.length} research sources (≥2)`);

  // Verify source structure
  if (sources.length > 0) {
    const firstSource = sources[0];
    assert(typeof firstSource.quote === 'string' && firstSource.quote.length > 0, `${technique}: first source has quote`);
    assert(typeof firstSource.author === 'string' && firstSource.author.length > 0, `${technique}: first source has author`);
  }
}

// ============================================================================
// TEST 3: Non-storytelling routing scenarios
// ============================================================================
console.log('\n═══ TEST 3: Non-Storytelling Routing ═══');

// Scenario A: Why Us with generic claims
const whyUsDecision = techniqueDecisionTree.decide({
  essayType: 'why_us',
  essay: 'I love your school because of its amazing community and great professors.',
  wordCount: 13,
  existingStrengths: [],
  detectedIssues: [{
    type: 'SWAP_TEST_FAIL',
    severity: 'major',
    location: 'throughout',
    description: 'Could apply to any school - generic school reference',
  }],
});
assert(
  whyUsDecision.primary.category === 'connection_specificity',
  `Why Us + generic claims → ${whyUsDecision.primary.category} (expected connection_specificity)`
);

// Scenario B: Extracurricular with no metrics
const extracurricularDecision = techniqueDecisionTree.decide({
  essayType: 'extracurricular',
  essay: 'I worked really hard on the school newspaper and made a big difference.',
  wordCount: 14,
  existingStrengths: ['storytelling'],
  detectedIssues: [{
    type: 'missing_evidence_of_impact',
    severity: 'major',
    location: 'body',
    description: 'Claims impact without quantifiable evidence or metrics',
  }],
});
assert(
  extracurricularDecision.primary.category === 'evidence_impact',
  `Extracurricular + no metrics → ${extracurricularDecision.primary.category} (expected evidence_impact)`
);

// Scenario C: Intellectual essay with shallow reflection
const intellectualDecision = techniqueDecisionTree.decide({
  essayType: 'intellectual',
  essay: 'I love learning about science. It has always been my passion.',
  wordCount: 12,
  existingStrengths: ['storytelling'],
  detectedIssues: [{
    type: 'shallow_reflection',
    severity: 'major',
    location: 'conclusion',
    description: 'Surface-level reflection that could apply to anyone',
  }],
});
assert(
  intellectualDecision.primary.category !== 'storytelling',
  `Intellectual + shallow reflection → ${intellectualDecision.primary.category} (NOT storytelling)`
);
assert(
  ['intellectual_character', 'reflection_depth'].includes(intellectualDecision.primary.category),
  `Intellectual + shallow reflection → ${intellectualDecision.primary.category} (expected intellectual_character or reflection_depth)`
);

// Scenario D: AI-sounding writing
const voiceDecision = techniqueDecisionTree.decide({
  essayType: 'creative',
  essay: 'This transformative experience has profoundly impacted my multifaceted journey.',
  wordCount: 10,
  existingStrengths: [],
  detectedIssues: [{
    type: 'AI_PATTERNS',
    severity: 'major',
    location: 'throughout',
    description: 'Essay sounds AI-generated or uses generic essay mode language',
  }],
});
assert(
  voiceDecision.primary.category === 'voice_authenticity',
  `AI patterns → ${voiceDecision.primary.category} (expected voice_authenticity)`
);

// Scenario E: Values essay oversimplified
const valuesDecision = techniqueDecisionTree.decide({
  essayType: 'values',
  essay: 'Leadership is important. I learned to be a leader through my experience.',
  wordCount: 13,
  existingStrengths: [],
  detectedIssues: [{
    type: 'missing_complexity',
    severity: 'major',
    location: 'throughout',
    description: 'Oversimplified narrative without nuance or tension',
  }],
});
assert(
  valuesDecision.primary.category === 'complexity_showcase',
  `Values + oversimplified → ${valuesDecision.primary.category} (expected complexity_showcase)`
);

// Scenario F: Why Major with no field knowledge
const whyMajorDecision = techniqueDecisionTree.decide({
  essayType: 'why_major',
  essay: 'I want to study computer science because I like technology.',
  wordCount: 11,
  existingStrengths: [],
  detectedIssues: [{
    type: 'missing_technical_depth',
    severity: 'major',
    location: 'body',
    description: 'Claims interest without demonstrating field knowledge or technical engagement',
  }],
});
assert(
  whyMajorDecision.primary.category === 'technical_depth',
  `Why Major + no field knowledge → ${whyMajorDecision.primary.category} (expected technical_depth)`
);

// ============================================================================
// TEST 4: Storytelling is NOT the default fallback
// ============================================================================
console.log('\n═══ TEST 4: Anti-Storytelling Default ═══');

// Count how many essay types have storytelling as PRIMARY
let storytellingPrimaryCount = 0;
let nonStorytellingPrimaryCount = 0;

for (const [essayType, priorities] of Object.entries(TECHNIQUE_PRIORITIES_BY_TYPE)) {
  if (priorities.primary.includes('storytelling')) {
    storytellingPrimaryCount++;
  } else {
    nonStorytellingPrimaryCount++;
  }
}

assert(
  nonStorytellingPrimaryCount > storytellingPrimaryCount,
  `Non-storytelling primary for ${nonStorytellingPrimaryCount} types vs storytelling primary for ${storytellingPrimaryCount} types`
);

// ============================================================================
// TEST 5: Property access verification (the critical bug)
// ============================================================================
console.log('\n═══ TEST 5: Property Access Verification ═══');

for (const technique of ALL_TECHNIQUES) {
  const bundle = TECHNIQUE_BUNDLES[technique];

  // These are the properties the Router's getTechniquePrompt() accesses
  assert(Array.isArray(bundle.corePrinciples), `${technique}: corePrinciples is array`);
  assert(Array.isArray(bundle.whenToUse), `${technique}: whenToUse is array`);
  assert(Array.isArray(bundle.transformations), `${technique}: transformations is array`);

  // These are the properties the Batch service's getTechniqueGuidance() accesses
  assert(typeof bundle.name === 'string', `${technique}: name is string`);
  assert(typeof bundle.description === 'string', `${technique}: description is string`);
  assert(Array.isArray(bundle.antiPatterns), `${technique}: antiPatterns is array`);
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n═══════════════════════════════════════════════');
console.log(`  TOTAL: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('═══════════════════════════════════════════════');

if (failed > 0) {
  console.error(`\n❌ ${failed} tests FAILED`);
  process.exit(1);
} else {
  console.log(`\n✅ All ${passed} tests PASSED`);
  process.exit(0);
}
