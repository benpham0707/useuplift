/**
 * Unit test: effectivenessToTier() — AnnotationV2 §4.3 6-tier visual mapping.
 *
 * Deterministic, zero API cost. Exhaustive table-driven coverage of every
 * band boundary so a threshold drift fails loudly.
 *
 * Run: npx tsx tests/test-sentence-tier-mapping.ts
 */
import {
  effectivenessToTier,
  type SentenceEffectivenessTier,
} from '../../src/services/essayIntelligence/analysis/sentenceTier';

interface Case {
  score: number;
  expected: SentenceEffectivenessTier;
}

// Boundary-focused table. Each band's lower edge, upper edge, and the
// first score of the next band are covered.
const CASES: Case[] = [
  { score: 0, expected: 'critical' },
  { score: 39, expected: 'critical' },
  { score: 40, expected: 'needs_work' },
  { score: 54, expected: 'needs_work' },
  { score: 55, expected: 'functional' },
  { score: 64, expected: 'functional' }, // load-bearing mid-band
  { score: 75, expected: 'functional' },
  { score: 76, expected: 'strong' },
  { score: 85, expected: 'strong' },
  { score: 86, expected: 'exceptional' },
  { score: 95, expected: 'exceptional' },
  { score: 96, expected: 'masterful' },
  { score: 100, expected: 'masterful' },
];

let passed = 0;
let failed = 0;

for (const { score, expected } of CASES) {
  const actual = effectivenessToTier(score);
  if (actual === expected) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL score=${score}: expected '${expected}', got '${actual}'`);
  }
}

console.log(`\neffectivenessToTier: ${passed}/${CASES.length} passed`);

if (failed > 0) {
  console.error(`\n❌ ${failed} case(s) failed — band thresholds drifted from the UX contract.`);
  process.exit(1);
}

console.log('✅ All band boundaries match UX contract §4 (line 192).');
