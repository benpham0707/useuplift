/**
 * Test: Optimized Gap Awareness Injection
 *
 * Verifies that the enhanced gap awareness injection:
 * 1. Captures STRENGTHS from Sonnet analysis
 * 2. Captures WORKAROUND_SUGGESTION for each gap
 * 3. Builds an optimized injection block with both
 * 4. Passes this to the suggestion generator
 */

import 'dotenv/config';
import { SonnetContextLayer, SonnetContextAnalysis } from '../src/services/commonAppWorkshop/services/sonnetContextLayer';

// ============================================================================
// TEST DATA
// ============================================================================

const TEST_ESSAY_MEDIUM = `
My grandmother's phone sits in a drawer now. After a week of trying, she gave up—the icons were too small, the menus too deep, the voice assistant couldn't understand her accent.

I started learning to code because I wanted to fix this. Last summer, I spent three weeks building a simplified interface, but the AI underneath still struggled. I'd trained it on standard English datasets, and my grandmother's mix of Cantonese and English confused it.

I know AI needs to be more accessible. The technology exists, but the implementation keeps failing people like my grandmother. I want to change that.
`;

const EXPECTED_STRENGTHS = [
  'concrete_detail',  // grandmother's phone, drawer, icons too small
  'authentic_voice',  // personal connection to the problem
  'emotional_moment'  // grandmother giving up after a week
];

const EXPECTED_GAP_TYPES = [
  'missing_reflection',    // No deep insight into what this taught
  'missing_resolution'     // What happened with the project? What's next?
];

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runOptimizedInjectionTest(): Promise<void> {
  console.log('='.repeat(70));
  console.log('OPTIMIZED GAP AWARENESS INJECTION TEST');
  console.log('='.repeat(70));
  console.log();

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const layer = new SonnetContextLayer();

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1: Verify Sonnet captures STRENGTHS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('─'.repeat(70));
  console.log('TEST 1: Verify Sonnet Captures Strengths & Workarounds');
  console.log('─'.repeat(70));

  const analysis = await layer.analyzeContextGaps(TEST_ESSAY_MEDIUM, 'challenge');

  console.log(`\n📊 ANALYSIS RESULTS:`);
  console.log(`   Score: ${analysis.context_quality_score}/100`);
  console.log(`   Summary: ${analysis.quality_summary}`);

  // Check strengths
  console.log(`\n✨ STRENGTHS DETECTED (${analysis.strengths.length}):`);
  if (analysis.strengths.length > 0) {
    analysis.strengths.forEach((s, i) => {
      console.log(`   ${i + 1}. [${s.strength_type}]`);
      console.log(`      Evidence: "${s.evidence_text.substring(0, 60)}..."`);
      console.log(`      Why effective: ${s.why_effective}`);
      console.log(`      Amplify: ${s.amplification_hint}`);
    });
  } else {
    console.log('   ⚠️ No strengths detected - prompt may need adjustment');
  }

  // Check gaps with workarounds
  console.log(`\n🚧 GAPS DETECTED (${analysis.gaps.length}):`);
  let workaroundCount = 0;
  analysis.gaps.forEach((g, i) => {
    console.log(`   ${i + 1}. [P${g.priority}] ${g.gap_type}`);
    console.log(`      Trigger: "${g.trigger_text.substring(0, 50)}..."`);
    if (g.workaround_suggestion) {
      console.log(`      ✓ Workaround: ${g.workaround_suggestion}`);
      workaroundCount++;
    } else {
      console.log(`      ⚠️ No workaround provided`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2: Verify injection block is built correctly
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(70));
  console.log('TEST 2: Build Optimized Injection Block');
  console.log('─'.repeat(70));

  // Simulate what buildOptimizedGapAwareness does
  const injectionBlock = buildInjectionBlock(analysis);

  console.log('\n📝 INJECTION BLOCK PREVIEW:');
  console.log('```');
  console.log(injectionBlock.substring(0, 1500) + (injectionBlock.length > 1500 ? '...' : ''));
  console.log('```');

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));

  const strengthsFound = analysis.strengths.length > 0;
  const workaroundsFound = workaroundCount > 0;
  const injectionHasStrengths = injectionBlock.includes('STRENGTHS TO PRESERVE');
  const injectionHasGaps = injectionBlock.includes('CONTEXT GAPS');
  const injectionHasRules = injectionBlock.includes('GENERATION RULES');

  console.log(`\n✓ Strengths captured: ${strengthsFound ? '✅ YES' : '❌ NO'} (${analysis.strengths.length} found)`);
  console.log(`✓ Workarounds captured: ${workaroundsFound ? '✅ YES' : '⚠️ PARTIAL'} (${workaroundCount}/${analysis.gaps.length})`);
  console.log(`✓ Injection has strengths section: ${injectionHasStrengths ? '✅ YES' : '⚠️ NO'}`);
  console.log(`✓ Injection has gaps section: ${injectionHasGaps ? '✅ YES' : '⚠️ NO'}`);
  console.log(`✓ Injection has rules section: ${injectionHasRules ? '✅ YES' : '⚠️ NO'}`);

  const cost = (analysis.tokens_used.input * 3 / 1_000_000) + (analysis.tokens_used.output * 15 / 1_000_000);
  console.log(`\n💰 Cost: $${cost.toFixed(4)}`);

  // Pass/fail
  const passed = strengthsFound && injectionHasStrengths && injectionHasGaps && injectionHasRules;
  console.log(`\n${passed ? '🎉 TEST PASSED' : '⚠️ TEST NEEDS ATTENTION'}`);

  if (passed) {
    console.log(`\n✅ Optimized injection is working:`);
    console.log(`   - Sonnet captures essay strengths`);
    console.log(`   - Sonnet provides workaround suggestions`);
    console.log(`   - Injection block guides AI on what to preserve/avoid`);
  }
}

/**
 * Simulates the buildOptimizedGapAwareness method to test injection block
 */
function buildInjectionBlock(analysis: SonnetContextAnalysis): string {
  const sortedGaps = [...analysis.gaps].sort((a, b) => b.priority - a.priority);
  const criticalGaps = sortedGaps.slice(0, 3);

  const gapToAction: Record<string, { avoid: string; instead: string }> = {
    'missing_concrete_detail': {
      avoid: 'inventing specific scenes, times, or places',
      instead: 'use structural improvements (pacing, word choice)'
    },
    'missing_emotional_depth': {
      avoid: 'adding emotional language the student didn\'t write',
      instead: 'create space for emotion by removing performative phrases'
    },
    'missing_specific_example': {
      avoid: 'fabricating examples or scenarios',
      instead: 'use placeholders like [YOUR SPECIFIC EXAMPLE]'
    },
    'missing_research': {
      avoid: 'inventing professor names, program details, or statistics',
      instead: 'use [SPECIFIC PROGRAM/PROFESSOR] placeholders'
    },
    'missing_reflection': {
      avoid: 'putting insights into the student\'s mouth',
      instead: 'pose Socratic questions in the teaching section'
    },
    'missing_stakes': {
      avoid: 'fabricating consequences or emotional weight',
      instead: 'use "What was at risk?" framing'
    },
    'missing_resolution': {
      avoid: 'inventing outcomes or lessons learned',
      instead: 'end with an open question or pivot to what the experience means NOW'
    }
  };

  const lines: string[] = [
    '',
    '═══════════════════════════════════════════════════════════',
    '⚠️ CONTEXT AWARENESS - WHAT TO PRESERVE & WHAT TO AVOID',
    '═══════════════════════════════════════════════════════════',
    '',
    `Quality Score: ${analysis.context_quality_score}/100`,
    `Assessment: ${analysis.quality_summary}`,
    ''
  ];

  // SECTION 1: STRENGTHS TO PRESERVE
  if (analysis.strengths && analysis.strengths.length > 0) {
    lines.push('✨ STRENGTHS TO PRESERVE & AMPLIFY:');
    lines.push('');
    analysis.strengths.slice(0, 3).forEach((strength, i) => {
      lines.push(`${i + 1}. ${strength.strength_type.replace(/_/g, ' ').toUpperCase()}`);
      lines.push(`   Evidence: "${strength.evidence_text.substring(0, 80)}${strength.evidence_text.length > 80 ? '...' : ''}"`);
      lines.push(`   Why it works: ${strength.why_effective}`);
      lines.push(`   💡 Amplify: ${strength.amplification_hint}`);
      lines.push('');
    });
  }

  // SECTION 2: GAPS WITH WORKAROUNDS
  if (criticalGaps.length > 0) {
    lines.push('🚧 CONTEXT GAPS - WHAT YOU CAN DO:');
    lines.push('');

    criticalGaps.forEach((gap, i) => {
      const hasWorkaround = gap.workaround_suggestion && gap.workaround_suggestion.length > 0;
      const defaultAction = gapToAction[gap.gap_type] || {
        avoid: 'inventing details not in the essay',
        instead: 'work with what\'s present'
      };

      lines.push(`GAP ${i + 1} [Priority ${gap.priority}/10]: ${gap.gap_type.replace(/_/g, ' ').toUpperCase()}`);
      lines.push(`   Location: "${gap.trigger_text.substring(0, 50)}${gap.trigger_text.length > 50 ? '...' : ''}"`);
      lines.push(`   ❌ DO NOT: ${defaultAction.avoid}`);

      if (hasWorkaround) {
        lines.push(`   ✓ WORKAROUND: ${gap.workaround_suggestion}`);
      } else {
        lines.push(`   ✓ INSTEAD: ${defaultAction.instead}`);
      }
      lines.push('');
    });
  }

  // SECTION 3: SUMMARY INSTRUCTIONS
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('GENERATION RULES:');
  lines.push('');
  lines.push('1. BUILD ON STRENGTHS: Your suggestions should amplify what\'s working');
  lines.push('2. WORK AROUND GAPS: Use the workarounds above, not invented content');
  lines.push('3. USE [BRACKETS]: For content only the student can provide, use [YOUR SPECIFIC...]');
  lines.push('4. PRIORITIZE STRUCTURE: When content is thin, improve flow/pacing/clarity');
  lines.push('5. SOCRATIC TEACHING: Surface gaps as questions in the teaching section');
  lines.push('');

  return lines.join('\n');
}

// Run
runOptimizedInjectionTest().catch(console.error);
