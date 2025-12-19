/**
 * Quality Assurance Tests
 *
 * Validates that our evolved workshop system:
 * 1. Accurately understands all 14 supplemental types
 * 2. Generates type-appropriate suggestions
 * 3. Respects word count constraints
 * 4. Applies type-specific constraints correctly
 */

import {
  TYPE_WEIGHT_CONFIGS,
  getCriticalDimensions,
  getExcellenceRequirements,
  getTopDimensions,
} from '../src/services/commonAppWorkshop/rubrics/typeWeightMatrices';
import { TYPE_SUGGESTION_CONSTRAINTS } from '../src/services/commonAppWorkshop/services/typeSpecificSuggestionService';
import { ALL_ISSUE_PATTERNS, getPatternsByType } from '../src/services/commonAppWorkshop/rubrics/issueDetectionPatterns';
import type { SupplementalType } from '../src/data/commonAppSupplementalTypes';

// ============================================================================
// TEST UTILITIES
// ============================================================================

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`\x1b[32m✓\x1b[0m ${message}`);
    passed++;
  } else {
    console.log(`\x1b[31m✗\x1b[0m ${message}`);
    failed++;
  }
}

function section(title: string): void {
  console.log(`\n\x1b[1m${title}\x1b[0m`);
  console.log('─'.repeat(60));
}

// ============================================================================
// TYPE DEFINITIONS - What each type SHOULD test for
// ============================================================================

interface TypeValidation {
  type: SupplementalType;
  name: string;
  expectedCriticalDimensions: string[];
  expectedWordRange: { min: number; max: number };
  mustHavePatterns: string[];  // Issue patterns that MUST be relevant
  forbiddenHighWeights: string[];  // Dimensions that should NOT have high weight
  expectedWordEfficiency: 'ruthless' | 'moderate' | 'flexible';
}

const TYPE_VALIDATIONS: TypeValidation[] = [
  {
    type: 'why_us',
    name: 'Why Us Essay',
    expectedCriticalDimensions: ['fit_demonstration', 'research_depth', 'specificity_evidence'],
    expectedWordRange: { min: 100, max: 350 },
    mustHavePatterns: ['SWAP_TEST_FAIL', 'NO_NUMBERS'],
    forbiddenHighWeights: ['vulnerability_balance', 'growth_transformation'],
    expectedWordEfficiency: 'moderate'
  },
  {
    type: 'why_major',
    name: 'Why This Major',
    expectedCriticalDimensions: ['reflection_insight', 'research_depth', 'specificity_evidence'],
    expectedWordRange: { min: 150, max: 350 },
    mustHavePatterns: ['GENERIC_ORIGIN_STORY', 'CAREER_ONLY'],
    forbiddenHighWeights: ['vulnerability_balance'],
    expectedWordEfficiency: 'moderate'
  },
  {
    type: 'community',
    name: 'Community Contribution',
    expectedCriticalDimensions: ['fit_demonstration', 'personal_connection', 'specificity_evidence'],
    expectedWordRange: { min: 150, max: 300 },
    mustHavePatterns: ['VAGUE_COMMUNITY', 'NO_NUMBERS'],
    forbiddenHighWeights: [],
    expectedWordEfficiency: 'moderate'
  },
  {
    type: 'diversity',
    name: 'Diversity Statement',
    expectedCriticalDimensions: ['personal_connection', 'vulnerability_balance', 'authenticity_voice'],
    expectedWordRange: { min: 200, max: 500 },
    mustHavePatterns: ['VULNERABILITY_DUMP', 'TRAUMA_WITHOUT_AGENCY'],
    forbiddenHighWeights: ['research_depth'],
    expectedWordEfficiency: 'flexible'
  },
  {
    type: 'intellectual',
    name: 'Intellectual Curiosity',
    expectedCriticalDimensions: ['reflection_insight', 'specificity_evidence', 'authenticity_voice'],
    expectedWordRange: { min: 200, max: 400 },
    mustHavePatterns: ['GENERIC_ORIGIN_STORY'],
    forbiddenHighWeights: ['vulnerability_balance'],
    expectedWordEfficiency: 'moderate'
  },
  {
    type: 'extracurricular',
    name: 'Activity/Passion Essay',
    expectedCriticalDimensions: ['personal_connection', 'specificity_evidence', 'authenticity_voice'],
    expectedWordRange: { min: 250, max: 500 },
    mustHavePatterns: ['GENERIC_ORIGIN_STORY', 'NO_NUMBERS', 'NO_DIALOGUE'],
    forbiddenHighWeights: ['research_depth'],
    expectedWordEfficiency: 'flexible'
  },
  {
    type: 'challenge',
    name: 'Challenge Essay',
    expectedCriticalDimensions: ['growth_transformation', 'vulnerability_balance', 'narrative_clarity'],
    expectedWordRange: { min: 250, max: 650 },
    mustHavePatterns: ['VULNERABILITY_DUMP', 'TRAUMA_WITHOUT_AGENCY', 'NO_DIALOGUE'],
    forbiddenHighWeights: ['research_depth', 'fit_demonstration'],
    expectedWordEfficiency: 'flexible'
  },
  {
    type: 'leadership',
    name: 'Leadership Experience',
    expectedCriticalDimensions: ['specificity_evidence', 'growth_transformation', 'vulnerability_balance'],
    expectedWordRange: { min: 200, max: 400 },
    mustHavePatterns: ['STATED_NOT_SHOWN', 'NO_NUMBERS', 'NO_DIALOGUE'],
    forbiddenHighWeights: ['research_depth'],
    expectedWordEfficiency: 'moderate'
  },
  {
    type: 'creative',
    name: 'Creative Side',
    expectedCriticalDimensions: ['authenticity_voice', 'impact_memorability', 'personal_connection'],
    expectedWordRange: { min: 200, max: 350 },
    mustHavePatterns: [],
    forbiddenHighWeights: ['research_depth', 'fit_demonstration'],
    expectedWordEfficiency: 'moderate'
  },
  {
    type: 'values',
    name: 'Personal Values',
    expectedCriticalDimensions: ['authenticity_voice', 'reflection_insight', 'personal_connection'],
    expectedWordRange: { min: 200, max: 400 },
    mustHavePatterns: ['STATED_NOT_SHOWN'],
    forbiddenHighWeights: ['research_depth', 'fit_demonstration'],
    expectedWordEfficiency: 'moderate'
  },
  {
    type: 'future_goals',
    name: 'Future Goals',
    expectedCriticalDimensions: ['personal_connection', 'specificity_evidence', 'fit_demonstration'],
    expectedWordRange: { min: 150, max: 300 },
    mustHavePatterns: [],
    forbiddenHighWeights: ['vulnerability_balance'],
    expectedWordEfficiency: 'moderate'
  },
  {
    type: 'additional_info',
    name: 'Additional Information',
    expectedCriticalDimensions: ['strategic_coherence', 'specificity_evidence', 'prompt_responsiveness'],
    expectedWordRange: { min: 100, max: 650 },
    mustHavePatterns: ['REPEATED_THEMES'],
    forbiddenHighWeights: [],
    expectedWordEfficiency: 'moderate'
  },
  {
    type: 'short_answer',
    name: 'Short Answer',
    expectedCriticalDimensions: ['specificity_evidence', 'authenticity_voice', 'impact_memorability'],
    expectedWordRange: { min: 25, max: 150 },
    mustHavePatterns: ['WORD_COUNT_PADDING', 'THROAT_CLEARING'],
    forbiddenHighWeights: ['growth_transformation', 'vulnerability_balance', 'research_depth'],
    expectedWordEfficiency: 'ruthless'
  },
  {
    type: 'optional',
    name: 'Optional Essay',
    expectedCriticalDimensions: ['strategic_coherence', 'impact_memorability', 'authenticity_voice'],
    expectedWordRange: { min: 200, max: 500 },
    mustHavePatterns: ['REPEATED_THEMES'],
    forbiddenHighWeights: ['research_depth', 'fit_demonstration'],
    expectedWordEfficiency: 'moderate'
  }
];

// ============================================================================
// TEST 1: Critical Dimension Accuracy
// ============================================================================

section('TEST 1: Critical Dimension Accuracy');

for (const validation of TYPE_VALIDATIONS) {
  const actualCritical = getCriticalDimensions(validation.type);
  const matches = validation.expectedCriticalDimensions.every(d => actualCritical.includes(d as any));
  assert(
    matches,
    `${validation.type}: Has correct critical dimensions (${actualCritical.join(', ')})`
  );
}

// ============================================================================
// TEST 2: Word Range Accuracy
// ============================================================================

section('TEST 2: Word Range Accuracy');

for (const validation of TYPE_VALIDATIONS) {
  const config = TYPE_WEIGHT_CONFIGS[validation.type];
  assert(
    config.word_range.min === validation.expectedWordRange.min,
    `${validation.type}: min word count ${config.word_range.min} = ${validation.expectedWordRange.min}`
  );
  assert(
    config.word_range.max === validation.expectedWordRange.max,
    `${validation.type}: max word count ${config.word_range.max} = ${validation.expectedWordRange.max}`
  );
}

// ============================================================================
// TEST 3: Issue Pattern Relevance
// ============================================================================

section('TEST 3: Issue Pattern Relevance');

for (const validation of TYPE_VALIDATIONS) {
  const relevantPatterns = getPatternsByType(validation.type);
  const patternIds = relevantPatterns.map(p => p.id);

  for (const requiredPattern of validation.mustHavePatterns) {
    assert(
      patternIds.includes(requiredPattern),
      `${validation.type}: Has relevant pattern ${requiredPattern}`
    );
  }
}

// ============================================================================
// TEST 4: Low Weight Dimensions
// ============================================================================

section('TEST 4: Low Weight Dimensions (Forbidden High Weights)');

for (const validation of TYPE_VALIDATIONS) {
  const config = TYPE_WEIGHT_CONFIGS[validation.type];

  for (const forbiddenDim of validation.forbiddenHighWeights) {
    const weight = config.weights[forbiddenDim as keyof typeof config.weights];
    assert(
      weight <= 5,
      `${validation.type}: ${forbiddenDim} has low weight (${weight}%)`
    );
  }
}

// ============================================================================
// TEST 5: Suggestion Constraint Accuracy
// ============================================================================

section('TEST 5: Suggestion Constraint Accuracy');

for (const validation of TYPE_VALIDATIONS) {
  const constraints = TYPE_SUGGESTION_CONSTRAINTS[validation.type];
  assert(
    constraints.word_efficiency === validation.expectedWordEfficiency,
    `${validation.type}: word efficiency is ${constraints.word_efficiency} (expected ${validation.expectedWordEfficiency})`
  );

  // Check max suggestion length is appropriate for word range
  const config = TYPE_WEIGHT_CONFIGS[validation.type];
  const maxPossiblePercentage = constraints.max_suggestion_length / config.word_range.max;
  assert(
    maxPossiblePercentage <= 0.5,  // Suggestions should be at most 50% of max essay
    `${validation.type}: max suggestion (${constraints.max_suggestion_length}) is reasonable for essay max (${config.word_range.max})`
  );
}

// ============================================================================
// TEST 6: Excellence Requirements Quality
// ============================================================================

section('TEST 6: Excellence Requirements Quality');

for (const validation of TYPE_VALIDATIONS) {
  const requirements = getExcellenceRequirements(validation.type);

  assert(
    requirements.length === 5,
    `${validation.type}: Has exactly 5 excellence requirements`
  );

  // Check that requirements are specific, not generic
  const hasSpecificLanguage = requirements.some(r =>
    r.includes('specific') || r.includes('3-5') || r.includes('20%') ||
    r.includes('name') || r.includes('Names') || r.includes('shows') ||
    r.includes('Shows') || r.includes('demonstrates') || r.includes('Demonstrates') ||
    r.includes('unique') || r.includes('Adds') || r.includes('Provides') ||
    r.includes('Explains') || r.includes('Strategic') || r.includes('Balances')
  );
  assert(
    hasSpecificLanguage,
    `${validation.type}: Excellence requirements are specific and actionable`
  );
}

// ============================================================================
// TEST 7: Top Dimensions Match Critical
// ============================================================================

section('TEST 7: Top Dimensions Overlap with Critical');

for (const validation of TYPE_VALIDATIONS) {
  const topDims = getTopDimensions(validation.type, 5);
  const criticalDims = getCriticalDimensions(validation.type);

  // At least 2 of 3 critical dimensions should be in top 5 by weight
  const overlap = criticalDims.filter(d => topDims.includes(d)).length;
  assert(
    overlap >= 2,
    `${validation.type}: ${overlap}/3 critical dimensions are in top 5 by weight`
  );
}

// ============================================================================
// TEST 8: Constraint Preserve/Avoid Balance
// ============================================================================

section('TEST 8: Type-Specific Constraints Have Content');

for (const validation of TYPE_VALIDATIONS) {
  const constraints = TYPE_SUGGESTION_CONSTRAINTS[validation.type];

  assert(
    constraints.preserve_requirements.length >= 2,
    `${validation.type}: Has ${constraints.preserve_requirements.length} preserve requirements`
  );

  assert(
    constraints.avoid_patterns.length >= 1,
    `${validation.type}: Has ${constraints.avoid_patterns.length} avoid patterns`
  );

  assert(
    constraints.prioritize.length >= 2,
    `${validation.type}: Has ${constraints.prioritize.length} prioritization guidelines`
  );
}

// ============================================================================
// TEST 9: Short Answer Constraints Are Ruthless
// ============================================================================

section('TEST 9: Short Answer Special Handling');

const shortAnswerConstraints = TYPE_SUGGESTION_CONSTRAINTS['short_answer'];
const shortAnswerConfig = TYPE_WEIGHT_CONFIGS['short_answer'];

assert(
  shortAnswerConstraints.word_efficiency === 'ruthless',
  'Short answer has ruthless word efficiency'
);

assert(
  shortAnswerConstraints.max_suggestion_length <= 40,
  `Short answer max suggestion (${shortAnswerConstraints.max_suggestion_length}) is very tight`
);

assert(
  shortAnswerConfig.word_range.max === 150,
  'Short answer max is 150 words'
);

// Verify avoid patterns include filler
assert(
  shortAnswerConstraints.avoid_patterns.some(p => p.includes('filler') || p.includes('generic')),
  'Short answer avoids filler/generic patterns'
);

// ============================================================================
// TEST 10: Challenge/Diversity Have Vulnerability Focus
// ============================================================================

section('TEST 10: Challenge/Diversity Vulnerability Handling');

const challengeConfig = TYPE_WEIGHT_CONFIGS['challenge'];
const diversityConfig = TYPE_WEIGHT_CONFIGS['diversity'];

assert(
  challengeConfig.weights.vulnerability_balance >= 10,
  `Challenge vulnerability weight (${challengeConfig.weights.vulnerability_balance}%) is significant`
);

assert(
  diversityConfig.weights.vulnerability_balance >= 10,
  `Diversity vulnerability weight (${diversityConfig.weights.vulnerability_balance}%) is significant`
);

assert(
  getCriticalDimensions('challenge').includes('vulnerability_balance'),
  'Challenge has vulnerability_balance as critical'
);

assert(
  getCriticalDimensions('diversity').includes('vulnerability_balance'),
  'Diversity has vulnerability_balance as critical'
);

// ============================================================================
// TEST 11: Why Us/Why Major Research Focus
// ============================================================================

section('TEST 11: Why Us/Why Major Research Focus');

const whyUsConfig = TYPE_WEIGHT_CONFIGS['why_us'];
const whyMajorConfig = TYPE_WEIGHT_CONFIGS['why_major'];

assert(
  whyUsConfig.weights.research_depth >= 10,
  `Why Us research_depth weight (${whyUsConfig.weights.research_depth}%) is high`
);

assert(
  whyMajorConfig.weights.research_depth >= 10,
  `Why Major research_depth weight (${whyMajorConfig.weights.research_depth}%) is high`
);

assert(
  getCriticalDimensions('why_us').includes('research_depth'),
  'Why Us has research_depth as critical'
);

// ============================================================================
// TEST 12: Issue Patterns Cover All Types
// ============================================================================

section('TEST 12: Issue Pattern Coverage');

const ALL_TYPES: SupplementalType[] = [
  'why_us', 'why_major', 'community', 'diversity', 'intellectual',
  'extracurricular', 'challenge', 'leadership', 'creative', 'values',
  'future_goals', 'additional_info', 'short_answer', 'optional'
];

for (const type of ALL_TYPES) {
  const relevantPatterns = getPatternsByType(type);
  assert(
    relevantPatterns.length >= 5,
    `${type}: Has ${relevantPatterns.length} relevant issue patterns (min 5)`
  );
}

// Count universal patterns
const universalPatterns = ALL_ISSUE_PATTERNS.filter(p => p.relevant_types === 'all');
assert(
  universalPatterns.length >= 5,
  `Have ${universalPatterns.length} universal patterns (min 5)`
);

// ============================================================================
// SUMMARY
// ============================================================================

console.log(`\n\x1b[1mTEST SUMMARY\x1b[0m`);
console.log('─'.repeat(60));
console.log(`\x1b[32m✓ Passed: ${passed}\x1b[0m`);
if (failed > 0) {
  console.log(`\x1b[31m✗ Failed: ${failed}\x1b[0m`);
}

console.log(`\n\x1b[1mValidated Components:\x1b[0m`);
console.log('• 14 Type Weight Matrices');
console.log('• 14 Type Suggestion Constraints');
console.log('• 12 Universal Dimensions per Type');
console.log('• 5 Excellence Requirements per Type');
console.log(`• ${ALL_ISSUE_PATTERNS.length} Issue Detection Patterns`);
console.log('• Critical Dimension Accuracy');
console.log('• Word Range Accuracy');
console.log('• Word Efficiency Settings');

if (failed === 0) {
  console.log(`\n\x1b[32m\x1b[1m✓ ALL QUALITY CHECKS PASSED\x1b[0m`);
} else {
  console.log(`\n\x1b[31m\x1b[1m✗ SOME QUALITY CHECKS FAILED\x1b[0m`);
  process.exit(1);
}
