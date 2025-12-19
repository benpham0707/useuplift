/**
 * Citation Exposure System - Holistic 3-Type Tests
 *
 * Tests for the NEW simplified 3-type citation system:
 * - problem (red highlight)
 * - strength (green underline)
 * - teaching (purple box only, no inline style)
 *
 * Run: npx tsx tests/test-citation-holistic-3type.ts
 */

import { citationProcessor } from '../src/services/commonAppWorkshop/services/citationProcessor';
import {
  citationFormatter,
  formatCitation,
} from '../src/services/commonAppWorkshop/utils/citationFormatter';
import type {
  Citation,
  CitationDatabase,
  TextWithCitations,
  ProblemCitation,
  StrengthCitation,
  TeachingCitation,
} from '../src/services/commonAppWorkshop/types';

// ============================================================================
// TEST UTILITIES
// ============================================================================

let testCount = 0;
let passCount = 0;
let failCount = 0;

function test(name: string, fn: () => void | Promise<void>) {
  testCount++;
  try {
    const result = fn();
    if (result instanceof Promise) {
      result
        .then(() => {
          passCount++;
          console.log(`✅ ${name}`);
        })
        .catch(error => {
          failCount++;
          console.error(`❌ ${name}`);
          console.error(`   Error: ${error.message}`);
        });
    } else {
      passCount++;
      console.log(`✅ ${name}`);
    }
  } catch (error: any) {
    failCount++;
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEquals(actual: any, expected: any, message?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      message ||
        `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`
    );
  }
}

// ============================================================================
// TEST FIXTURES - HOLISTIC 3-TYPE SYSTEM
// ============================================================================

const problemCitation: ProblemCitation = {
  id: 'prob_1',
  type: 'problem',
  source: {
    name: 'Stanford Red Flag System',
    title: 'CLASS_BASED_ONLY',
  },
  evidence: {
    problem_id: 'CLASS_BASED_ONLY',
    problem_name: 'Classroom-Bounded Learning',
    severity: 'major',
    what_triggered_it: 'All learning activities happen in class with no independent extension',
    why_matters: 'Stanford values self-directed exploration beyond requirements',
    score_impact: 'Caps Intellectual Vitality at 69',
    how_to_fix: 'Show independent projects or self-directed learning',
  },
  why_relevant: 'Shows what the original draft was missing',
  research_id: 'stanford_red_flag_class_based',
};

const strengthCitation_CoreValue: StrengthCitation = {
  id: 'strength_1',
  type: 'strength',
  source: {
    name: 'Stanford Core Values',
    title: 'Intellectual Vitality',
  },
  evidence: {
    strength_id: 'stanford_iv_self_directed',
    strength_name: 'Intellectual Vitality: Self-Directed Project',
    strength_type: 'core_value',
    what_demonstrates_it: 'Independent web scraper project analyzing Reddit discussions',
    why_valued: "Stanford's top-weighted value (40%) - pursuing ideas independently",
    score_impact: 'Supports 85+ scoring',
    value_weight: 40,
    value_definition: 'Pursuing learning for its own sake, independent of requirements',
  },
  why_relevant: 'Primary core value being demonstrated',
  research_id: 'stanford_value_iv',
};

const strengthCitation_Pattern: StrengthCitation = {
  id: 'strength_2',
  type: 'strength',
  source: {
    name: 'Stanford Pattern Recognition',
    title: 'INDEPENDENT_PROJECT_EXTENSION',
  },
  evidence: {
    strength_id: 'independent_project_extension',
    strength_name: 'Self-Directed Project Extension',
    strength_type: 'pattern',
    what_demonstrates_it: 'Taking classroom Python concept and building independent web scraper',
    why_valued: 'Pattern of extending classroom learning into self-directed work',
    score_impact: 'Supports 85+ scoring',
    pattern_strength: 'exceptional',
  },
  why_relevant: 'Pattern demonstrated in revision',
  research_id: 'stanford_green_flag_project',
};

const teachingCitation_EliteTechnique: TeachingCitation = {
  id: 'teach_1',
  type: 'teaching',
  source: {
    name: 'Elite Example STAN_IV_007',
    title: 'Successful Stanford IV Essay',
  },
  evidence: {
    teaching_type: 'elite_technique',
    example_id: 'STAN_IV_007',
    example_score: 92,
    example_quote: 'Built web scraper analyzing 50,000 Reddit mental health posts',
    technique: 'Transform classroom skill into independent project with real purpose',
    dean_quote: 'We want students who pursue curiosity beyond requirements',
  },
  why_relevant: 'Shows exact technique to transform classroom learning',
  research_id: 'stanford_example_iv_007',
};

const teachingCitation_DeanQuote: TeachingCitation = {
  id: 'teach_2',
  type: 'teaching',
  source: {
    name: 'Dean Richard Shaw',
    title: 'Dean of Admission and Financial Aid',
    publication: 'Stanford Magazine',
    date: '2023-09',
  },
  evidence: {
    teaching_type: 'dean_quote',
    dean_name: 'Dean Richard Shaw',
    dean_title: 'Dean of Admission and Financial Aid',
    dean_publication: 'Stanford Magazine',
    dean_date: '2023-09',
    dean_quote: "We want students who can't help but pursue their curiosity beyond requirements.",
    dean_context: 'Explaining Stanford intellectual vitality philosophy',
    technique: 'Show genuine curiosity that extends beyond classroom',
  },
  why_relevant: 'Establishes what Stanford means by intellectual vitality',
  research_id: 'stanford_shaw_iv_quote_3',
};

const sampleCitationDatabase: CitationDatabase = {
  citations: {
    prob_1: problemCitation,
    strength_1: strengthCitation_CoreValue,
    strength_2: strengthCitation_Pattern,
    teach_1: teachingCitation_EliteTechnique,
    teach_2: teachingCitation_DeanQuote,
  },
  metadata: {
    total_count: 5,
    by_type: {
      problem: 1,
      strength: 2,
      teaching: 2,
    },
    generated_at: new Date().toISOString(),
  },
};

const sampleText_OriginalWithProblem: TextWithCitations =
  `I learned about Python in [my computer science class]{{prob_1}} and found it very interesting.`;

const sampleText_RevisedWithStrengths: TextWithCitations =
  `I discovered Python through CS50, then built [a web scraper analyzing Reddit discussions]{{strength_1}}
  to understand mental health conversations. This project showed me [how technical skills can serve
  social research]{{strength_2}}.`;

const sampleText_RationaleWithTeaching: TextWithCitations =
  `This revision [transforms classroom learning into self-directed exploration]{{teach_1}}.
  Stanford specifically values students who [pursue ideas beyond requirements]{{teach_2}}.`;

// ============================================================================
// TEST SUITE 1: HOLISTIC 3-TYPE SYSTEM BASICS
// ============================================================================

console.log('\n🧪 TEST SUITE 1: Holistic 3-Type System Basics\n');

test('Problem citation has correct type', () => {
  assert(problemCitation.type === 'problem', 'Should be problem type');
  assert(problemCitation.evidence.severity === 'major', 'Should have severity');
  assert(problemCitation.evidence.what_triggered_it, 'Should have trigger');
});

test('Strength citation (core value) has correct structure', () => {
  assert(strengthCitation_CoreValue.type === 'strength', 'Should be strength type');
  assert(strengthCitation_CoreValue.evidence.strength_type === 'core_value', 'Should be core_value');
  assert(strengthCitation_CoreValue.evidence.value_weight === 40, 'Should have weight');
});

test('Strength citation (pattern) has correct structure', () => {
  assert(strengthCitation_Pattern.type === 'strength', 'Should be strength type');
  assert(strengthCitation_Pattern.evidence.strength_type === 'pattern', 'Should be pattern');
  assert(strengthCitation_Pattern.evidence.pattern_strength === 'exceptional', 'Should have strength level');
});

test('Teaching citation (elite technique) has correct structure', () => {
  assert(teachingCitation_EliteTechnique.type === 'teaching', 'Should be teaching type');
  assert(teachingCitation_EliteTechnique.evidence.teaching_type === 'elite_technique', 'Should be elite_technique');
  assert(teachingCitation_EliteTechnique.evidence.example_id === 'STAN_IV_007', 'Should have example ID');
});

test('Teaching citation (dean quote) has correct structure', () => {
  assert(teachingCitation_DeanQuote.type === 'teaching', 'Should be teaching type');
  assert(teachingCitation_DeanQuote.evidence.teaching_type === 'dean_quote', 'Should be dean_quote');
  assert(teachingCitation_DeanQuote.evidence.dean_quote, 'Should have dean quote');
});

// ============================================================================
// TEST SUITE 2: VISUAL STYLING
// ============================================================================

console.log('\n🧪 TEST SUITE 2: Visual Styling (Red Highlight, Green Underline, Purple Box)\n');

test('Problem citation formats with RED HIGHLIGHT', () => {
  const uiReady = formatCitation(problemCitation, 'Stanford');

  assert(uiReady.styling.type === 'problem', 'Should be problem type');
  assert(uiReady.styling.inline_style === 'red_highlight', 'Should use red_highlight');
  assert(uiReady.styling.background_color === '#FEE2E2', 'Should have red background');
  assert(uiReady.styling.box_indicator_color === '#EF4444', 'Should have red box indicator');
});

test('Strength citation (core value) formats with GREEN UNDERLINE', () => {
  const uiReady = formatCitation(strengthCitation_CoreValue, 'Stanford');

  assert(uiReady.styling.type === 'strength', 'Should be strength type');
  assert(uiReady.styling.inline_style === 'green_underline', 'Should use green_underline');
  assert(uiReady.styling.underline_color === '#10B981', 'Should have green underline');
  assert(uiReady.styling.box_indicator_color === '#10B981', 'Should have green box indicator');
  assert(!uiReady.styling.background_color, 'Should NOT have background (underline only)');
});

test('Strength citation (pattern) formats with GREEN UNDERLINE', () => {
  const uiReady = formatCitation(strengthCitation_Pattern, 'Stanford');

  assert(uiReady.styling.inline_style === 'green_underline', 'Should use green_underline');
  assert(uiReady.styling.underline_color === '#10B981', 'Should have green underline');
});

test('Teaching citation formats with NO INLINE STYLE (purple box only)', () => {
  const uiReady = formatCitation(teachingCitation_EliteTechnique, 'Stanford');

  assert(uiReady.styling.type === 'teaching', 'Should be teaching type');
  assert(uiReady.styling.inline_style === 'none', 'Should have NO inline style');
  assert(!uiReady.styling.background_color, 'Should NOT have background');
  assert(!uiReady.styling.underline_color, 'Should NOT have underline');
  assert(uiReady.styling.box_indicator_color === '#8B5CF6', 'Should have purple box indicator');
});

// ============================================================================
// TEST SUITE 3: PARSING & VALIDATION
// ============================================================================

console.log('\n🧪 TEST SUITE 3: Parsing & Validation\n');

test('Parse original essay with problem citation', () => {
  const parsed = citationProcessor.parseTextWithCitations(
    sampleText_OriginalWithProblem,
    sampleCitationDatabase,
    { validate: false }
  );

  assert(parsed.citation_ids.length === 1, 'Should find 1 citation');
  assertEquals(parsed.citation_ids, ['prob_1'], 'Should find problem citation');
});

test('Parse revised essay with strength citations', () => {
  const parsed = citationProcessor.parseTextWithCitations(
    sampleText_RevisedWithStrengths,
    sampleCitationDatabase,
    { validate: false }
  );

  assert(parsed.citation_ids.length === 2, 'Should find 2 citations');
  assert(parsed.citation_ids.includes('strength_1'), 'Should find strength_1');
  assert(parsed.citation_ids.includes('strength_2'), 'Should find strength_2');
});

test('Parse rationale with teaching citations', () => {
  const parsed = citationProcessor.parseTextWithCitations(
    sampleText_RationaleWithTeaching,
    sampleCitationDatabase,
    { validate: false }
  );

  assert(parsed.citation_ids.length === 2, 'Should find 2 citations');
  assert(parsed.citation_ids.includes('teach_1'), 'Should find teach_1');
  assert(parsed.citation_ids.includes('teach_2'), 'Should find teach_2');
});

test('Validate problem citation completeness', () => {
  const validation = citationProcessor.validateCitations(
    sampleText_OriginalWithProblem,
    sampleCitationDatabase
  );

  assert(validation.valid, 'Problem citation should validate');
  assertEquals(validation.errors, [], 'Should have no errors');
});

test('Validate strength citations completeness', () => {
  const validation = citationProcessor.validateCitations(
    sampleText_RevisedWithStrengths,
    sampleCitationDatabase
  );

  assert(validation.valid, 'Strength citations should validate');
  assertEquals(validation.errors, [], 'Should have no errors');
});

test('Validate teaching citations completeness', () => {
  const validation = citationProcessor.validateCitations(
    sampleText_RationaleWithTeaching,
    sampleCitationDatabase
  );

  assert(validation.valid, 'Teaching citations should validate');
  assertEquals(validation.errors, [], 'Should have no errors');
});

// ============================================================================
// TEST SUITE 4: TOOLTIP CONTENT
// ============================================================================

console.log('\n🧪 TEST SUITE 4: Tooltip Content\n');

test('Problem tooltip shows severity and score impact', () => {
  const uiReady = formatCitation(problemCitation, 'Stanford');

  assert(uiReady.tooltip.title.includes('Classroom-Bounded'), 'Should show problem name');
  assert(uiReady.tooltip.subtitle.includes('Issue'), 'Should indicate issue');
  assert(uiReady.tooltip.footer?.includes('Score Impact'), 'Should show score impact');
  assert(uiReady.tooltip.footer?.includes('Caps'), 'Should show score impact');
});

test('Strength (core value) tooltip shows weight', () => {
  const uiReady = formatCitation(strengthCitation_CoreValue, 'Stanford');

  assert(uiReady.tooltip.subtitle.includes('40%'), 'Should show value weight');
  assert(uiReady.tooltip.content.includes('You demonstrated'), 'Should show what was demonstrated');
  assert(uiReady.tooltip.context.includes("What's working"), 'Should show why valued');
});

test('Strength (pattern) tooltip shows pattern strength', () => {
  const uiReady = formatCitation(strengthCitation_Pattern, 'Stanford');

  assert(uiReady.tooltip.subtitle.includes('Exceptional'), 'Should show pattern strength');
  assert(uiReady.tooltip.title.includes('🌟'), 'Should use exceptional icon');
});

test('Teaching (elite technique) tooltip shows example and technique', () => {
  const uiReady = formatCitation(teachingCitation_EliteTechnique, 'Stanford');

  assert(uiReady.tooltip.title.includes('Elite Technique'), 'Should show elite technique');
  assert(uiReady.tooltip.subtitle.includes('STAN_IV_007'), 'Should show example ID');
  assert(uiReady.tooltip.subtitle.includes('92'), 'Should show score');
  assert(uiReady.tooltip.context.includes('Technique to apply'), 'Should show technique');
});

test('Teaching (dean quote) tooltip shows dean info', () => {
  const uiReady = formatCitation(teachingCitation_DeanQuote, 'Stanford');

  assert(uiReady.tooltip.title.includes('Dean Richard Shaw'), 'Should show dean name');
  assert(uiReady.tooltip.subtitle.includes('Dean of Admission'), 'Should show title');
  assert(uiReady.tooltip.content.includes("can't help but"), 'Should show quote');
});

// ============================================================================
// TEST SUITE 5: END-TO-END FORMATTING
// ============================================================================

console.log('\n🧪 TEST SUITE 5: End-to-End Formatting\n');

test('Format original essay with problem highlighting', () => {
  const uiReady = citationFormatter.formatTextWithCitations(
    sampleText_OriginalWithProblem,
    sampleCitationDatabase,
    'Stanford'
  );

  const citedSpan = uiReady.spans.find(s => s.citation_id === 'prob_1');
  assert(citedSpan, 'Should have cited span for problem');
  assert(citedSpan!.citation, 'Should have citation object');
  assert(citedSpan!.citation!.styling.inline_style === 'red_highlight', 'Should use red highlight');
});

test('Format revised essay with strength underlines', () => {
  const uiReady = citationFormatter.formatTextWithCitations(
    sampleText_RevisedWithStrengths,
    sampleCitationDatabase,
    'Stanford'
  );

  const strengthSpans = uiReady.spans.filter(s => s.citation_id?.startsWith('strength'));
  assert(strengthSpans.length === 2, 'Should have 2 strength spans');

  strengthSpans.forEach(span => {
    assert(span.citation, 'Should have citation');
    assert(span.citation!.styling.inline_style === 'green_underline', 'Should use green underline');
  });
});

test('Format rationale with teaching (no inline styles)', () => {
  const uiReady = citationFormatter.formatTextWithCitations(
    sampleText_RationaleWithTeaching,
    sampleCitationDatabase,
    'Stanford'
  );

  const teachingSpans = uiReady.spans.filter(s => s.citation_id?.startsWith('teach'));
  assert(teachingSpans.length === 2, 'Should have 2 teaching spans');

  teachingSpans.forEach(span => {
    assert(span.citation, 'Should have citation');
    assert(span.citation!.styling.inline_style === 'none', 'Should have NO inline style');
    assert(span.citation!.styling.box_indicator_color === '#8B5CF6', 'Should have purple box');
  });
});

// ============================================================================
// TEST SUITE 6: HOLISTIC INTEGRATION
// ============================================================================

console.log('\n🧪 TEST SUITE 6: Holistic Integration (Problem → Strength → Teaching)\n');

test('Complete workflow: problem in original, strength in revision, teaching in rationale', () => {
  // Step 1: Original with problem
  const originalUI = citationFormatter.formatTextWithCitations(
    sampleText_OriginalWithProblem,
    sampleCitationDatabase,
    'Stanford'
  );

  const problemSpan = originalUI.spans.find(s => s.citation_id === 'prob_1');
  assert(problemSpan?.citation?.styling.inline_style === 'red_highlight', 'Original should have red highlight');

  // Step 2: Revision with strengths
  const revisedUI = citationFormatter.formatTextWithCitations(
    sampleText_RevisedWithStrengths,
    sampleCitationDatabase,
    'Stanford'
  );

  const strengthSpan = revisedUI.spans.find(s => s.citation_id === 'strength_1');
  assert(strengthSpan?.citation?.styling.inline_style === 'green_underline', 'Revision should have green underline');

  // Step 3: Rationale with teaching
  const rationaleUI = citationFormatter.formatTextWithCitations(
    sampleText_RationaleWithTeaching,
    sampleCitationDatabase,
    'Stanford'
  );

  const teachingSpan = rationaleUI.spans.find(s => s.citation_id === 'teach_1');
  assert(teachingSpan?.citation?.styling.inline_style === 'none', 'Rationale should have no inline style');
  assert(teachingSpan?.citation?.styling.box_indicator_color === '#8B5CF6', 'Rationale should have purple box');
});

test('Visual hierarchy: only 2 inline styles (red + green), purple box only', () => {
  // Collect all styling types from test database
  const stylings = [
    formatCitation(problemCitation, 'Stanford').styling,
    formatCitation(strengthCitation_CoreValue, 'Stanford').styling,
    formatCitation(strengthCitation_Pattern, 'Stanford').styling,
    formatCitation(teachingCitation_EliteTechnique, 'Stanford').styling,
  ];

  const inlineStyles = stylings.map(s => s.inline_style);
  const uniqueInlineStyles = new Set(inlineStyles);

  assert(uniqueInlineStyles.has('red_highlight'), 'Should have red highlight');
  assert(uniqueInlineStyles.has('green_underline'), 'Should have green underline');
  assert(uniqueInlineStyles.has('none'), 'Should have none (teaching)');
  assert(uniqueInlineStyles.size === 3, 'Should have exactly 3 inline style types');

  // Count actual visible styles (not "none")
  const visibleInlineStyles = [...uniqueInlineStyles].filter(s => s !== 'none');
  assert(visibleInlineStyles.length === 2, 'Should have exactly 2 visible inline styles');
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('📊 HOLISTIC 3-TYPE SYSTEM TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: ${testCount}`);
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log('='.repeat(60));
console.log('\n🎨 Visual Hierarchy Validated:');
console.log('  • RED HIGHLIGHT (problem) - Original essay issues');
console.log('  • GREEN UNDERLINE (strength) - Revised essay strengths + values');
console.log('  • PURPLE BOX ONLY (teaching) - Rationale techniques (no inline style)');
console.log('='.repeat(60));

if (failCount === 0) {
  console.log('\n🎉 All holistic 3-type tests passed!');
  console.log('✅ System ready: Clean visual hierarchy with only 2 inline colors');
  process.exit(0);
} else {
  console.log(`\n❌ ${failCount} test(s) failed.`);
  process.exit(1);
}
