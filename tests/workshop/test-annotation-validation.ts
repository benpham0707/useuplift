/**
 * Annotation Validation — Comprehensive Unit Tests
 *
 * Tests the critical data integrity layer that validates LLM-produced
 * annotations against source text. Covers:
 * - clamp() utility
 * - Offset validation and correction (THE most critical behavior)
 * - Span text matching
 * - Paragraph index computation
 * - Field validation (dimensionId, severity, confidence, isStrength)
 * - Integration-level realistic scenarios
 *
 * No LLM calls. Pure computation. $0 cost.
 *
 * Run: npx tsx tests/test-annotation-validation.ts
 */

import { validateAnnotations, clamp } from '../../src/pipeline/annotationValidation';
import { dimensionRegistry } from '../../src/workshop/registry/dimensionRegistry';
import type { RawLLMAnnotation } from '../../src/pipeline/types';

// Explicit dimension imports (autoImport uses __dirname which doesn't work in tsx/ESM)
import '../../src/workshop/dimensions/narrative-craft.dim';
import '../../src/workshop/dimensions/emotional-resonance.dim';
import '../../src/workshop/dimensions/intellectual-vitality.dim';
import '../../src/workshop/dimensions/originality-voice.dim';
import '../../src/workshop/dimensions/structural-coherence.dim';
import '../../src/workshop/dimensions/word-economy.dim';
import '../../src/workshop/dimensions/thematic-depth.dim';
import '../../src/workshop/dimensions/opening-hook.dim';
import '../../src/workshop/dimensions/closing-impact.dim';
import '../../src/workshop/dimensions/growth-transformation.dim';
import '../../src/workshop/dimensions/authenticity-specificity.dim';
import '../../src/workshop/dimensions/tonal-sophistication.dim';
import '../../src/workshop/dimensions/argument-rhetorical.dim';
import '../../src/workshop/dimensions/narrative-dynamics.dim';
import '../../src/workshop/dimensions/narrative-structure.dim';

// ============================================================================
// TEST HELPERS
// ============================================================================

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  \u2713 ${message}`);
  } else {
    failed++;
    console.error(`  \u2717 FAIL: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual === expected) {
    passed++;
    console.log(`  \u2713 ${message}`);
  } else {
    failed++;
    console.error(`  \u2717 FAIL: ${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
  }
}

function assertRange(value: number, min: number, max: number, label: string): void {
  assert(value >= min && value <= max, `${label}: ${value} (expected ${min}-${max})`);
}

// ============================================================================
// TEST DATA
// ============================================================================

const SIMPLE_ESSAY = 'The kitchen smelled like burnt garlic. I sat down and opened the letter.';

const MULTI_PARAGRAPH_ESSAY = `The kitchen smelled like burnt garlic and failure. My mother stood at the stove, her back rigid, stirring a pot that had already boiled over twice. I sat at the table, tears blurring the words.

"You could try again next year," she said, not turning around. Her voice cracked on "year," and I realized she had been crying too. The wooden spoon scraped against the bottom of the pot.

I grabbed my jacket and walked out into the December cold. The streetlights cast orange pools on the wet sidewalk. My breath came in ragged clouds. I walked for three miles, past the library where I had studied every weekend.

At the bridge over Miller Creek, I stopped. The water below was black and fast, reflecting nothing. I leaned against the railing and felt the cold metal bite through my sleeves. This was the moment I had to decide.

Over the next six months, I volunteered at three community organizations and rebuilt my portfolio from scratch. I woke at five every morning to write. My hands cramped. My eyes burned. But I kept going.`;

// ============================================================================
// INITIALIZATION
// ============================================================================

async function main() {
  // Dimensions are loaded via explicit imports above (autoImport uses __dirname which breaks in tsx/ESM)
  const allDimensions = dimensionRegistry.getAll();
  if (allDimensions.length === 0) {
    console.error('FATAL: No dimensions loaded. Cannot run tests.');
    process.exit(1);
  }

  // Use real dimension IDs from the registry
  const VALID_DIM_ID = allDimensions[0].id;
  const VALID_DIM_ID_2 = allDimensions.length > 1 ? allDimensions[1].id : allDimensions[0].id;

  console.log(`\nDimension registry loaded: ${allDimensions.length} dimensions`);
  console.log(`Using dimension IDs: "${VALID_DIM_ID}", "${VALID_DIM_ID_2}"\n`);

  console.log('=== Annotation Validation Tests ===\n');

  // ============================================================================
  // 1. clamp() UTILITY
  // ============================================================================

  console.log('1. clamp() utility');
  {
    // Value below min
    assertEqual(clamp(-5, 0, 100), 0, 'Value below min clamped to min');

    // Value above max
    assertEqual(clamp(150, 0, 100), 100, 'Value above max clamped to max');

    // Value within range
    assertEqual(clamp(50, 0, 100), 50, 'Value within range preserved');

    // Value exactly at min boundary
    assertEqual(clamp(0, 0, 100), 0, 'Value exactly at min preserved');

    // Value exactly at max boundary
    assertEqual(clamp(100, 0, 100), 100, 'Value exactly at max preserved');

    // Negative range
    assertEqual(clamp(-5, -10, -1), -5, 'Negative range: value within range');
    assertEqual(clamp(-15, -10, -1), -10, 'Negative range: value below min');
    assertEqual(clamp(5, -10, -1), -1, 'Negative range: value above max');

    // Fractional values (0-1 range, used for confidence)
    assertEqual(clamp(0.5, 0, 1), 0.5, 'Fractional: 0.5 within [0,1]');
    assertEqual(clamp(-0.1, 0, 1), 0, 'Fractional: -0.1 clamped to 0');
    assertEqual(clamp(1.5, 0, 1), 1, 'Fractional: 1.5 clamped to 1');
  }

  // ============================================================================
  // 2. OFFSET VALIDATION (THE MOST CRITICAL TESTS)
  // ============================================================================

  console.log('\n2. Offset validation and correction');

  // --- Correct offsets: preserved as-is ---
  console.log('\n  2a. Correct offsets preserved');
  {
    const text = SIMPLE_ESSAY;
    const spanText = 'burnt garlic';
    const correctStart = text.indexOf(spanText);
    const correctEnd = correctStart + spanText.length;

    const raw: RawLLMAnnotation[] = [{
      span: { text: spanText, startOffset: correctStart, endOffset: correctEnd, paragraphIndex: 0 },
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: false,
      insight: 'Good sensory detail.',
      suggestion: 'Consider expanding.',
      confidence: 0.8,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 1, 'Annotation with correct offsets accepted');
    assertEqual(result[0].span.startOffset, correctStart, `startOffset preserved (${correctStart})`);
    assertEqual(result[0].span.endOffset, correctEnd, `endOffset preserved (${correctEnd})`);
    assertEqual(result[0].span.text, spanText, 'span.text preserved');
  }

  // --- Wrong offsets: corrected via indexOf ---
  console.log('\n  2b. Wrong offsets corrected');
  {
    const text = SIMPLE_ESSAY;
    const spanText = 'burnt garlic';
    const expectedStart = text.indexOf(spanText);
    const expectedEnd = expectedStart + spanText.length;

    const raw: RawLLMAnnotation[] = [{
      span: { text: spanText, startOffset: 999, endOffset: 1020, paragraphIndex: 0 },
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: false,
      insight: 'Test insight.',
      suggestion: 'Test suggestion.',
      confidence: 0.7,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 1, 'Annotation with wrong offsets still accepted');
    assertEqual(result[0].span.startOffset, expectedStart, `startOffset corrected to ${expectedStart}`);
    assertEqual(result[0].span.endOffset, expectedEnd, `endOffset corrected to ${expectedEnd}`);
  }

  // --- Zero offsets: corrected ---
  console.log('\n  2c. Zero offsets corrected');
  {
    const text = SIMPLE_ESSAY;
    // "sat down" does NOT start at offset 0, so startOffset=0 + endOffset=0 is clearly wrong
    const spanText = 'sat down';
    const expectedStart = text.indexOf(spanText);
    const expectedEnd = expectedStart + spanText.length;

    const raw: RawLLMAnnotation[] = [{
      span: { text: spanText, startOffset: 0, endOffset: 0, paragraphIndex: 0 },
      dimensionId: VALID_DIM_ID,
      severity: 'important',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.6,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 1, 'Annotation with zero offsets accepted');
    assertEqual(result[0].span.startOffset, expectedStart, `startOffset corrected from 0 to ${expectedStart}`);
    assertEqual(result[0].span.endOffset, expectedEnd, `endOffset corrected from 0 to ${expectedEnd}`);
  }

  // --- Missing offsets: computed from indexOf ---
  console.log('\n  2d. Missing offsets computed');
  {
    const text = SIMPLE_ESSAY;
    const spanText = 'opened the letter';
    const expectedStart = text.indexOf(spanText);
    const expectedEnd = expectedStart + spanText.length;

    // Simulate LLM omitting offsets by casting a partial object
    const raw = [{
      span: { text: spanText },
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.5,
    }] as unknown as RawLLMAnnotation[];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 1, 'Annotation with missing offsets accepted');
    assertEqual(result[0].span.startOffset, expectedStart, `startOffset computed: ${expectedStart}`);
    assertEqual(result[0].span.endOffset, expectedEnd, `endOffset computed: ${expectedEnd}`);
  }

  // --- Out-of-bounds offsets: corrected ---
  console.log('\n  2e. Out-of-bounds offsets corrected');
  {
    const text = SIMPLE_ESSAY;
    const spanText = 'The kitchen';
    const expectedStart = text.indexOf(spanText);
    const expectedEnd = expectedStart + spanText.length;

    const raw: RawLLMAnnotation[] = [{
      span: { text: spanText, startOffset: text.length + 100, endOffset: text.length + 200, paragraphIndex: 0 },
      dimensionId: VALID_DIM_ID,
      severity: 'critical',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.9,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 1, 'Annotation with out-of-bounds offsets accepted');
    assertEqual(result[0].span.startOffset, expectedStart, `startOffset corrected to ${expectedStart}`);
    assertEqual(result[0].span.endOffset, expectedEnd, `endOffset corrected to ${expectedEnd}`);
  }

  // --- Multiple occurrences: first occurrence used when offsets wrong ---
  console.log('\n  2f. Multiple occurrences: first occurrence used');
  {
    // "the" appears multiple times in the essay
    const text = 'The cat sat on the mat. The dog jumped over the fence.';
    const spanText = 'the';
    // "the" (lowercase) first occurs at index 15 ("on the mat")
    const firstIndex = text.indexOf(spanText);

    const raw: RawLLMAnnotation[] = [{
      span: { text: spanText, startOffset: 999, endOffset: 1002, paragraphIndex: 0 },
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.5,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 1, 'Annotation accepted');
    assertEqual(result[0].span.startOffset, firstIndex, `startOffset corrected to first occurrence (${firstIndex})`);
    assertEqual(result[0].span.endOffset, firstIndex + spanText.length, 'endOffset matches first occurrence');
  }

  // --- Offsets that don't match span text substring ---
  console.log('\n  2g. Offsets pointing to different text corrected');
  {
    const text = 'Hello world. Goodbye world.';
    const spanText = 'Goodbye world';
    const expectedStart = text.indexOf(spanText);
    const expectedEnd = expectedStart + spanText.length;

    // Offsets point to "Hello world" but span.text says "Goodbye world"
    const raw: RawLLMAnnotation[] = [{
      span: { text: spanText, startOffset: 0, endOffset: 11, paragraphIndex: 0 },
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.5,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 1, 'Annotation accepted despite mismatched offset content');
    assertEqual(result[0].span.startOffset, expectedStart, `startOffset corrected to actual location (${expectedStart})`);
    assertEqual(result[0].span.endOffset, expectedEnd, `endOffset corrected to actual location (${expectedEnd})`);
  }

  // ============================================================================
  // 3. SPAN TEXT MATCHING
  // ============================================================================

  console.log('\n3. Span text matching');

  // --- Exact match found ---
  console.log('\n  3a. Exact match found');
  {
    const text = 'The kitchen smelled like burnt garlic.';
    const raw: RawLLMAnnotation[] = [{
      span: { text: 'burnt garlic', startOffset: 0, endOffset: 0, paragraphIndex: 0 },
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: false,
      insight: 'Vivid detail.',
      suggestion: 'Expand.',
      confidence: 0.7,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 1, 'Annotation with matching span.text kept');
  }

  // --- No match: span text not in source ---
  console.log('\n  3b. No match: span text not in source');
  {
    const text = 'The kitchen smelled like burnt garlic.';
    const raw: RawLLMAnnotation[] = [{
      span: { text: 'roasted chicken', startOffset: 0, endOffset: 15, paragraphIndex: 0 },
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.7,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 0, 'Annotation with non-matching span.text dropped');
  }

  // --- Empty span text ---
  console.log('\n  3c. Empty span text');
  {
    const text = 'Some essay text here.';
    const raw: RawLLMAnnotation[] = [{
      span: { text: '', startOffset: 0, endOffset: 5, paragraphIndex: 0 },
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.5,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 0, 'Annotation with empty span.text dropped');
  }

  // --- Missing span object ---
  console.log('\n  3d. Missing span object');
  {
    const text = 'Some essay text here.';
    const raw = [{
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.5,
    }] as unknown as RawLLMAnnotation[];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 0, 'Annotation with missing span object dropped');
  }

  // --- Null span ---
  console.log('\n  3e. Null span');
  {
    const text = 'Some essay text here.';
    const raw = [{
      span: null,
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.5,
    }] as unknown as RawLLMAnnotation[];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 0, 'Annotation with null span dropped');
  }

  // ============================================================================
  // 4. PARAGRAPH INDEX COMPUTATION
  // ============================================================================

  console.log('\n4. Paragraph index computation');

  // --- Single paragraph: offset in first paragraph ---
  console.log('\n  4a. Single paragraph');
  {
    const text = 'This is a single paragraph with no breaks. It contains multiple sentences.';
    const spanText = 'multiple sentences';
    const raw: RawLLMAnnotation[] = [{
      span: { text: spanText, startOffset: 0, endOffset: 0, paragraphIndex: 99 },
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.5,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 1, 'Annotation accepted');
    assertEqual(result[0].span.paragraphIndex, 0, 'paragraphIndex = 0 for single paragraph');
  }

  // --- Multi-paragraph: offset in third paragraph ---
  console.log('\n  4b. Multi-paragraph: offset in third paragraph');
  {
    const text = MULTI_PARAGRAPH_ESSAY;
    // Find text in the third paragraph
    const spanText = 'December cold';
    const spanStart = text.indexOf(spanText);
    assert(spanStart > 0, `Found "${spanText}" in essay at offset ${spanStart}`);

    const raw: RawLLMAnnotation[] = [{
      span: { text: spanText, startOffset: spanStart, endOffset: spanStart + spanText.length, paragraphIndex: 0 },
      dimensionId: VALID_DIM_ID,
      severity: 'important',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.7,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 1, 'Annotation accepted');
    assertEqual(result[0].span.paragraphIndex, 2, 'paragraphIndex = 2 for third paragraph');
  }

  // --- Multi-paragraph: offset in fifth paragraph ---
  console.log('\n  4c. Multi-paragraph: offset in fifth paragraph');
  {
    const text = MULTI_PARAGRAPH_ESSAY;
    // "Over the next six months" is in the 5th paragraph
    const spanText = 'Over the next six months';
    const spanStart = text.indexOf(spanText);
    assert(spanStart > 0, `Found "${spanText}" in essay at offset ${spanStart}`);

    const raw: RawLLMAnnotation[] = [{
      span: { text: spanText, startOffset: spanStart, endOffset: spanStart + spanText.length, paragraphIndex: 0 },
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: true,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.8,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 1, 'Annotation accepted');
    assertEqual(result[0].span.paragraphIndex, 4, 'paragraphIndex = 4 for fifth paragraph');
  }

  // --- Blank line variations ---
  console.log('\n  4d. Blank line variations (\\n\\n, \\n  \\n, \\n\\t\\n)');
  {
    // Paragraph 1, then various blank line styles
    const text = 'First paragraph here.\n\nSecond paragraph here.\n  \nThird paragraph here.\n\t\nFourth paragraph here.';
    const spanText = 'Fourth paragraph';
    const spanStart = text.indexOf(spanText);

    const raw: RawLLMAnnotation[] = [{
      span: { text: spanText, startOffset: spanStart, endOffset: spanStart + spanText.length, paragraphIndex: 0 },
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.5,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 1, 'Annotation accepted');
    assertEqual(result[0].span.paragraphIndex, 3, 'paragraphIndex = 3 for fourth paragraph with varied breaks');
  }

  // --- Offset at paragraph boundary ---
  console.log('\n  4e. Offset at start of a paragraph after a break');
  {
    const text = 'Paragraph one content.\n\nParagraph two content.';
    const spanText = 'Paragraph two';
    const spanStart = text.indexOf(spanText);

    const raw: RawLLMAnnotation[] = [{
      span: { text: spanText, startOffset: spanStart, endOffset: spanStart + spanText.length, paragraphIndex: 0 },
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.5,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 1, 'Annotation accepted');
    assertEqual(result[0].span.paragraphIndex, 1, 'paragraphIndex = 1 at start of second paragraph');
  }

  // --- First paragraph always index 0 ---
  console.log('\n  4f. First paragraph always index 0');
  {
    const text = 'Very first sentence.\n\nSecond paragraph.';
    const spanText = 'Very first';
    const spanStart = text.indexOf(spanText);

    const raw: RawLLMAnnotation[] = [{
      span: { text: spanText, startOffset: spanStart, endOffset: spanStart + spanText.length, paragraphIndex: 5 },
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.5,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 1, 'Annotation accepted');
    assertEqual(result[0].span.paragraphIndex, 0, 'paragraphIndex = 0 for text in first paragraph');
  }

  // ============================================================================
  // 5. FIELD VALIDATION
  // ============================================================================

  console.log('\n5. Field validation');

  // --- Valid dimensionId ---
  console.log('\n  5a. Valid dimensionId accepted');
  {
    const text = 'Some essay text with content.';
    const raw: RawLLMAnnotation[] = [{
      span: { text: 'essay text', startOffset: 5, endOffset: 15, paragraphIndex: 0 },
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.5,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 1, `Valid dimensionId "${VALID_DIM_ID}" accepted`);
    assertEqual(result[0].dimensionId, VALID_DIM_ID, 'dimensionId preserved');
  }

  // --- Unknown dimensionId ---
  console.log('\n  5b. Unknown dimensionId dropped');
  {
    const text = 'Some essay text with content.';
    const raw: RawLLMAnnotation[] = [{
      span: { text: 'essay text', startOffset: 5, endOffset: 15, paragraphIndex: 0 },
      dimensionId: 'totally_fake_dimension_xyz_999',
      severity: 'suggestion',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.5,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 0, 'Unknown dimensionId causes annotation to be dropped');
  }

  // --- Valid severities ---
  console.log('\n  5c. Valid severities all accepted');
  {
    const text = 'The cat sat on the mat and looked around the room curiously and then decided to take a nap.';
    const validSeverities: Array<'critical' | 'important' | 'suggestion' | 'strength'> = [
      'critical', 'important', 'suggestion', 'strength'
    ];

    for (const severity of validSeverities) {
      const raw: RawLLMAnnotation[] = [{
        span: { text: 'cat sat', startOffset: 0, endOffset: 0, paragraphIndex: 0 },
        dimensionId: VALID_DIM_ID,
        severity,
        isStrength: false,
        insight: 'Test.',
        suggestion: 'Test.',
        confidence: 0.5,
      }];

      const result = validateAnnotations(raw, text, '[Test]');
      assertEqual(result.length, 1, `Severity "${severity}" accepted`);
    }
  }

  // --- Invalid severity ---
  console.log('\n  5d. Invalid severity dropped');
  {
    const text = 'Some essay text with content.';
    const invalidSeverities = ['high', 'low', 'warning', 'info', 'error', 'medium', ''];

    for (const severity of invalidSeverities) {
      const raw = [{
        span: { text: 'essay text', startOffset: 5, endOffset: 15, paragraphIndex: 0 },
        dimensionId: VALID_DIM_ID,
        severity,
        isStrength: false,
        insight: 'Test.',
        suggestion: 'Test.',
        confidence: 0.5,
      }] as unknown as RawLLMAnnotation[];

      const result = validateAnnotations(raw, text, '[Test]');
      assertEqual(result.length, 0, `Invalid severity "${severity}" causes drop`);
    }
  }

  // --- Confidence clamping ---
  console.log('\n  5e. Confidence clamping');
  {
    const text = 'The quick brown fox jumps.';
    const spanText = 'quick brown';

    // Negative confidence -> 0
    {
      const raw: RawLLMAnnotation[] = [{
        span: { text: spanText, startOffset: 0, endOffset: 0, paragraphIndex: 0 },
        dimensionId: VALID_DIM_ID,
        severity: 'suggestion',
        isStrength: false,
        insight: 'Test.',
        suggestion: 'Test.',
        confidence: -0.5,
      }];

      const result = validateAnnotations(raw, text, '[Test]');
      assertEqual(result[0].confidence, 0, 'Negative confidence clamped to 0');
    }

    // Confidence > 1 -> 1
    {
      const raw: RawLLMAnnotation[] = [{
        span: { text: spanText, startOffset: 0, endOffset: 0, paragraphIndex: 0 },
        dimensionId: VALID_DIM_ID,
        severity: 'suggestion',
        isStrength: false,
        insight: 'Test.',
        suggestion: 'Test.',
        confidence: 1.5,
      }];

      const result = validateAnnotations(raw, text, '[Test]');
      assertEqual(result[0].confidence, 1, 'Confidence > 1 clamped to 1');
    }

    // Normal confidence preserved
    {
      const raw: RawLLMAnnotation[] = [{
        span: { text: spanText, startOffset: 0, endOffset: 0, paragraphIndex: 0 },
        dimensionId: VALID_DIM_ID,
        severity: 'suggestion',
        isStrength: false,
        insight: 'Test.',
        suggestion: 'Test.',
        confidence: 0.75,
      }];

      const result = validateAnnotations(raw, text, '[Test]');
      assertEqual(result[0].confidence, 0.75, 'Normal confidence 0.75 preserved');
    }

    // Missing confidence defaults to 0.5
    {
      const raw = [{
        span: { text: spanText, startOffset: 0, endOffset: 0, paragraphIndex: 0 },
        dimensionId: VALID_DIM_ID,
        severity: 'suggestion',
        isStrength: false,
        insight: 'Test.',
        suggestion: 'Test.',
      }] as unknown as RawLLMAnnotation[];

      const result = validateAnnotations(raw, text, '[Test]');
      assertEqual(result[0].confidence, 0.5, 'Missing confidence defaults to 0.5');
    }
  }

  // --- isStrength defaulting ---
  console.log('\n  5f. isStrength defaulting');
  {
    const text = 'The quick brown fox jumps.';
    const spanText = 'quick brown';

    // isStrength=true when severity is 'strength' and isStrength omitted
    {
      const raw = [{
        span: { text: spanText, startOffset: 0, endOffset: 0, paragraphIndex: 0 },
        dimensionId: VALID_DIM_ID,
        severity: 'strength',
        insight: 'Test.',
        suggestion: 'Test.',
        confidence: 0.5,
      }] as unknown as RawLLMAnnotation[];

      const result = validateAnnotations(raw, text, '[Test]');
      assertEqual(result[0].isStrength, true, 'isStrength defaults to true when severity is "strength"');
    }

    // isStrength=false when severity is 'suggestion' and isStrength omitted
    {
      const raw = [{
        span: { text: spanText, startOffset: 0, endOffset: 0, paragraphIndex: 0 },
        dimensionId: VALID_DIM_ID,
        severity: 'suggestion',
        insight: 'Test.',
        suggestion: 'Test.',
        confidence: 0.5,
      }] as unknown as RawLLMAnnotation[];

      const result = validateAnnotations(raw, text, '[Test]');
      assertEqual(result[0].isStrength, false, 'isStrength defaults to false when severity is "suggestion"');
    }

    // isStrength=false when severity is 'critical' and isStrength omitted
    {
      const raw = [{
        span: { text: spanText, startOffset: 0, endOffset: 0, paragraphIndex: 0 },
        dimensionId: VALID_DIM_ID,
        severity: 'critical',
        insight: 'Test.',
        suggestion: 'Test.',
        confidence: 0.5,
      }] as unknown as RawLLMAnnotation[];

      const result = validateAnnotations(raw, text, '[Test]');
      assertEqual(result[0].isStrength, false, 'isStrength defaults to false when severity is "critical"');
    }

    // Explicit isStrength=true with non-strength severity preserved
    {
      const raw: RawLLMAnnotation[] = [{
        span: { text: spanText, startOffset: 0, endOffset: 0, paragraphIndex: 0 },
        dimensionId: VALID_DIM_ID,
        severity: 'suggestion',
        isStrength: true,
        insight: 'Test.',
        suggestion: 'Test.',
        confidence: 0.5,
      }];

      const result = validateAnnotations(raw, text, '[Test]');
      assertEqual(result[0].isStrength, true, 'Explicit isStrength=true preserved even with severity "suggestion"');
    }
  }

  // --- Empty insight/suggestion defaults ---
  console.log('\n  5g. Empty insight/suggestion defaults');
  {
    const text = 'The quick brown fox jumps.';
    const spanText = 'quick brown';

    // Missing insight defaults to ''
    {
      const raw = [{
        span: { text: spanText, startOffset: 0, endOffset: 0, paragraphIndex: 0 },
        dimensionId: VALID_DIM_ID,
        severity: 'suggestion',
        isStrength: false,
        suggestion: 'A suggestion.',
        confidence: 0.5,
      }] as unknown as RawLLMAnnotation[];

      const result = validateAnnotations(raw, text, '[Test]');
      assertEqual(result[0].insight, '', 'Missing insight defaults to empty string');
    }

    // Missing suggestion defaults to ''
    {
      const raw = [{
        span: { text: spanText, startOffset: 0, endOffset: 0, paragraphIndex: 0 },
        dimensionId: VALID_DIM_ID,
        severity: 'suggestion',
        isStrength: false,
        insight: 'An insight.',
        confidence: 0.5,
      }] as unknown as RawLLMAnnotation[];

      const result = validateAnnotations(raw, text, '[Test]');
      assertEqual(result[0].suggestion, '', 'Missing suggestion defaults to empty string');
    }

    // Provided insight/suggestion preserved
    {
      const raw: RawLLMAnnotation[] = [{
        span: { text: spanText, startOffset: 0, endOffset: 0, paragraphIndex: 0 },
        dimensionId: VALID_DIM_ID,
        severity: 'suggestion',
        isStrength: false,
        insight: 'A real insight here.',
        suggestion: 'A real suggestion here.',
        confidence: 0.5,
      }];

      const result = validateAnnotations(raw, text, '[Test]');
      assertEqual(result[0].insight, 'A real insight here.', 'Provided insight preserved');
      assertEqual(result[0].suggestion, 'A real suggestion here.', 'Provided suggestion preserved');
    }
  }

  // --- stale always set to false ---
  console.log('\n  5h. stale always set to false');
  {
    const text = 'The quick brown fox jumps.';
    const raw: RawLLMAnnotation[] = [{
      span: { text: 'quick brown', startOffset: 0, endOffset: 0, paragraphIndex: 0 },
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.5,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result[0].stale, false, 'stale field set to false on new annotation');
  }

  // --- id is generated (UUID format) ---
  console.log('\n  5i. id is generated (UUID format)');
  {
    const text = 'The quick brown fox jumps.';
    const raw: RawLLMAnnotation[] = [{
      span: { text: 'quick brown', startOffset: 0, endOffset: 0, paragraphIndex: 0 },
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.5,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assert(typeof result[0].id === 'string' && result[0].id.length > 0, 'id is a non-empty string');
    assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(result[0].id), 'id is UUID format');
  }

  // --- rewriteExample and applicableCommand passed through ---
  console.log('\n  5j. Optional fields passed through');
  {
    const text = 'The quick brown fox jumps.';
    const raw: RawLLMAnnotation[] = [{
      span: { text: 'quick brown', startOffset: 0, endOffset: 0, paragraphIndex: 0 },
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.5,
      rewriteExample: 'The swift russet fox',
      applicableCommand: 'replace_adjectives',
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result[0].rewriteExample, 'The swift russet fox', 'rewriteExample passed through');
    assertEqual(result[0].applicableCommand, 'replace_adjectives', 'applicableCommand passed through');
  }

  // ============================================================================
  // 6. INTEGRATION-LEVEL SCENARIOS
  // ============================================================================

  console.log('\n6. Integration-level scenarios');

  // --- Realistic LLM output ---
  console.log('\n  6a. Realistic LLM output with mixed valid/invalid data');
  {
    const essay = MULTI_PARAGRAPH_ESSAY;

    // Simulate realistic LLM output: some correct, some wrong offsets, some bad data
    const raw: RawLLMAnnotation[] = [
      // 1. Correct offsets
      {
        span: {
          text: 'burnt garlic and failure',
          startOffset: essay.indexOf('burnt garlic and failure'),
          endOffset: essay.indexOf('burnt garlic and failure') + 'burnt garlic and failure'.length,
          paragraphIndex: 0,
        },
        dimensionId: VALID_DIM_ID,
        severity: 'strength',
        isStrength: true,
        insight: 'Strong sensory opening that immediately grounds the reader.',
        suggestion: 'This multi-sensory detail is effective. Consider echoing it later.',
        confidence: 0.92,
      },
      // 2. Wrong offsets (will be corrected)
      {
        span: {
          text: 'Her voice cracked on "year,"',
          startOffset: 50,
          endOffset: 77,
          paragraphIndex: 1,
        },
        dimensionId: VALID_DIM_ID_2,
        severity: 'important',
        isStrength: false,
        insight: 'The dialogue here reveals character emotion effectively.',
        suggestion: 'Consider adding a brief physical action to accompany this moment.',
        confidence: 0.85,
      },
      // 3. Text not in source (will be dropped)
      {
        span: {
          text: 'This text does not exist anywhere in the essay whatsoever',
          startOffset: 100,
          endOffset: 156,
          paragraphIndex: 2,
        },
        dimensionId: VALID_DIM_ID,
        severity: 'suggestion',
        isStrength: false,
        insight: 'Hallucinated annotation.',
        suggestion: 'This should be dropped.',
        confidence: 0.7,
      },
      // 4. Invalid dimensionId (will be dropped)
      {
        span: {
          text: 'The streetlights cast orange pools',
          startOffset: 0,
          endOffset: 0,
          paragraphIndex: 2,
        },
        dimensionId: 'nonexistent_dimension_id',
        severity: 'strength',
        isStrength: true,
        insight: 'Great imagery.',
        suggestion: 'Vivid.',
        confidence: 0.88,
      },
      // 5. Valid but with zero offsets (will be corrected)
      {
        span: {
          text: 'The water below was black and fast',
          startOffset: 0,
          endOffset: 0,
          paragraphIndex: 3,
        },
        dimensionId: VALID_DIM_ID,
        severity: 'strength',
        isStrength: true,
        insight: 'Powerful symbolic image.',
        suggestion: 'This mirrors the emotional state effectively.',
        confidence: 0.9,
      },
    ];

    const result = validateAnnotations(raw, essay, '[Integration]');

    // Should keep 3 out of 5 (items 1, 2, 5 are valid; 3 has bad text, 4 has bad dimensionId)
    assertEqual(result.length, 3, 'Kept 3 valid annotations out of 5');

    // Verify first annotation has correct offsets (was already correct)
    const first = result[0];
    assertEqual(first.span.text, 'burnt garlic and failure', 'First annotation span text correct');
    assertEqual(first.severity, 'strength', 'First annotation severity correct');
    assertEqual(first.isStrength, true, 'First annotation isStrength correct');
    assertEqual(first.span.paragraphIndex, 0, 'First annotation in paragraph 0');
    assertEqual(first.confidence, 0.92, 'First annotation confidence preserved');

    // Verify second annotation had offsets corrected
    const second = result[1];
    const expectedStart2 = essay.indexOf('Her voice cracked on "year,"');
    assertEqual(second.span.startOffset, expectedStart2, 'Second annotation startOffset corrected');
    assertEqual(second.span.endOffset, expectedStart2 + 'Her voice cracked on "year,"'.length, 'Second annotation endOffset corrected');
    assertEqual(second.span.paragraphIndex, 1, 'Second annotation in paragraph 1');

    // Verify third annotation (was item 5) had offsets corrected
    const third = result[2];
    const expectedStart3 = essay.indexOf('The water below was black and fast');
    assertEqual(third.span.startOffset, expectedStart3, 'Third annotation startOffset corrected from 0');
    assertEqual(third.span.endOffset, expectedStart3 + 'The water below was black and fast'.length, 'Third annotation endOffset corrected');
    assertEqual(third.span.paragraphIndex, 3, 'Third annotation in paragraph 3');

    // Verify all have unique IDs
    const ids = new Set(result.map(r => r.id));
    assertEqual(ids.size, 3, 'All annotations have unique IDs');

    // Verify all have stale = false
    assert(result.every(r => r.stale === false), 'All annotations have stale = false');
  }

  // --- All annotations invalid: empty result ---
  console.log('\n  6b. All annotations invalid');
  {
    const text = 'A simple essay.';
    const raw: RawLLMAnnotation[] = [
      {
        span: { text: 'nonexistent text', startOffset: 0, endOffset: 16, paragraphIndex: 0 },
        dimensionId: VALID_DIM_ID,
        severity: 'suggestion',
        isStrength: false,
        insight: 'Test.',
        suggestion: 'Test.',
        confidence: 0.5,
      },
      {
        span: { text: 'simple essay', startOffset: 2, endOffset: 14, paragraphIndex: 0 },
        dimensionId: 'fake_dimension_id',
        severity: 'suggestion',
        isStrength: false,
        insight: 'Test.',
        suggestion: 'Test.',
        confidence: 0.5,
      },
      {
        span: { text: 'simple essay', startOffset: 2, endOffset: 14, paragraphIndex: 0 },
        dimensionId: VALID_DIM_ID,
        severity: 'warning' as any,
        isStrength: false,
        insight: 'Test.',
        suggestion: 'Test.',
        confidence: 0.5,
      },
    ];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 0, 'All invalid annotations produce empty result');
  }

  // --- Empty annotations array ---
  console.log('\n  6c. Empty annotations array');
  {
    const text = 'Some essay text.';
    const result = validateAnnotations([], text, '[Test]');
    assertEqual(result.length, 0, 'Empty input produces empty result');
  }

  // --- Large batch with mixed validity ---
  console.log('\n  6d. Large batch: 10 annotations with mixed validity');
  {
    const text = MULTI_PARAGRAPH_ESSAY;

    const raw: RawLLMAnnotation[] = [];

    // 5 valid annotations with various span texts from the essay
    const validSpans = [
      'burnt garlic',
      'wooden spoon',
      'December cold',
      'Miller Creek',
      'My hands cramped',
    ];

    for (const spanText of validSpans) {
      assert(text.includes(spanText), `Prerequisite: "${spanText}" exists in essay`);
      raw.push({
        span: { text: spanText, startOffset: 0, endOffset: 0, paragraphIndex: 0 },
        dimensionId: VALID_DIM_ID,
        severity: 'suggestion',
        isStrength: false,
        insight: `Insight about ${spanText}.`,
        suggestion: `Suggestion about ${spanText}.`,
        confidence: 0.7,
      });
    }

    // 5 invalid annotations
    raw.push(
      // Bad text
      { span: { text: 'DOES NOT EXIST', startOffset: 0, endOffset: 14, paragraphIndex: 0 }, dimensionId: VALID_DIM_ID, severity: 'suggestion', isStrength: false, insight: '', suggestion: '', confidence: 0.5 },
      // Bad dimension
      { span: { text: 'burnt garlic', startOffset: 0, endOffset: 0, paragraphIndex: 0 }, dimensionId: 'bad_dim', severity: 'suggestion', isStrength: false, insight: '', suggestion: '', confidence: 0.5 },
      // Bad severity
      { span: { text: 'burnt garlic', startOffset: 0, endOffset: 0, paragraphIndex: 0 }, dimensionId: VALID_DIM_ID, severity: 'warn' as any, isStrength: false, insight: '', suggestion: '', confidence: 0.5 },
      // Empty span text
      { span: { text: '', startOffset: 0, endOffset: 0, paragraphIndex: 0 }, dimensionId: VALID_DIM_ID, severity: 'suggestion', isStrength: false, insight: '', suggestion: '', confidence: 0.5 },
      // Missing span
      { dimensionId: VALID_DIM_ID, severity: 'suggestion', isStrength: false, insight: '', suggestion: '', confidence: 0.5 } as any,
    );

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 5, 'Exactly 5 valid annotations kept from batch of 10');
  }

  // --- Verify substring match is exact (case-sensitive) ---
  console.log('\n  6e. Case-sensitive matching');
  {
    const text = 'The Kitchen smelled amazing.';

    // "the kitchen" (lowercase t, k) does not match "The Kitchen"
    const raw: RawLLMAnnotation[] = [{
      span: { text: 'the kitchen', startOffset: 0, endOffset: 11, paragraphIndex: 0 },
      dimensionId: VALID_DIM_ID,
      severity: 'suggestion',
      isStrength: false,
      insight: 'Test.',
      suggestion: 'Test.',
      confidence: 0.5,
    }];

    const result = validateAnnotations(raw, text, '[Test]');
    assertEqual(result.length, 0, 'Case-sensitive: "the kitchen" does not match "The Kitchen"');
  }

  // --- Custom log prefix ---
  console.log('\n  6f. Custom log prefix used (no crash)');
  {
    const text = 'Some text here.';
    // Just ensure custom prefix doesn't cause issues
    const result = validateAnnotations([], text, '[CustomPrefix]');
    assertEqual(result.length, 0, 'Custom log prefix works without error');

    // Default prefix
    const result2 = validateAnnotations([], text);
    assertEqual(result2.length, 0, 'Default log prefix works without error');
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  if (failed > 0) {
    console.error('\nSOME TESTS FAILED');
    process.exit(1);
  } else {
    console.log('\nAll tests passed!');
  }
}

main().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
