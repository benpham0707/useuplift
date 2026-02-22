/**
 * Inline Editing Latency Test -- requires ANTHROPIC_API_KEY
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-inline-editing-latency.ts
 *
 * Measures wall-clock latency of InlineEditorService.applyCommand() across
 * 10 calls: 6 Haiku commands and 4 Sonnet commands, each on 2 test passages.
 *
 * Pass criteria:
 *   - Haiku p95 < 3000ms (3 seconds)
 *   - Sonnet p95 < 5000ms (5 seconds)
 */

import { requireApiKey } from './utils/loadEnv';

const apiKey = requireApiKey('ANTHROPIC_API_KEY');

import { InlineEditorService } from '../src/services/inlineEditor/inlineEditorService';
import type { EditingCommand, InlineEditRequest } from '../src/services/inlineEditor/types';

// ============================================================================
// TEST PASSAGES (realistic college essay excerpts, ~100 words each)
// ============================================================================

const PASSAGE_1 = `The summer before senior year, I spent three weeks volunteering at the county hospital. I helped out wherever I could and learned a lot from the experience. The doctors were incredibly dedicated people who inspired me to consider a career in medicine. I realized that healthcare is about more than just treating symptoms. It changed my perspective on what it means to serve others. I grew as a person during those weeks and came to understand the value of hard work and empathy in professional settings.`;

const PASSAGE_2 = `When my family moved from Guadalajara to Minneapolis, everything felt foreign. The cold was unbearable and I didn't know anyone at school. I struggled with English for months and felt invisible in the hallways. But slowly, I started finding my footing. I joined the soccer team and made a few friends. My ESL teacher Mrs. Rodriguez believed in me even when I didn't. By the end of freshman year, I gave a speech at the multicultural assembly and people actually clapped.`;

// ============================================================================
// COMMAND DEFINITIONS: 3 Haiku + 2 Sonnet, each on both passages = 10 calls
// ============================================================================

interface LatencyTestCase {
  command: EditingCommand;
  selectedText: string;
  fullDocument: string;
  tier: 'haiku' | 'sonnet';
}

const TEST_CASES: LatencyTestCase[] = [
  // --- Haiku commands (3 commands x 2 passages = 6 calls) ---
  {
    command: 'make_concrete',
    selectedText: 'I helped out wherever I could and learned a lot from the experience.',
    fullDocument: PASSAGE_1,
    tier: 'haiku',
  },
  {
    command: 'make_concrete',
    selectedText: 'I struggled with English for months and felt invisible in the hallways.',
    fullDocument: PASSAGE_2,
    tier: 'haiku',
  },
  {
    command: 'cut_filler',
    selectedText: 'I grew as a person during those weeks and came to understand the value of hard work and empathy in professional settings.',
    fullDocument: PASSAGE_1,
    tier: 'haiku',
  },
  {
    command: 'cut_filler',
    selectedText: 'But slowly, I started finding my footing. I joined the soccer team and made a few friends.',
    fullDocument: PASSAGE_2,
    tier: 'haiku',
  },
  {
    command: 'add_dialogue',
    selectedText: 'The doctors were incredibly dedicated people who inspired me to consider a career in medicine.',
    fullDocument: PASSAGE_1,
    tier: 'haiku',
  },
  {
    command: 'add_dialogue',
    selectedText: 'My ESL teacher Mrs. Rodriguez believed in me even when I didn\'t.',
    fullDocument: PASSAGE_2,
    tier: 'haiku',
  },

  // --- Sonnet commands (2 commands x 2 passages = 4 calls) ---
  {
    command: 'deepen_vulnerability',
    selectedText: 'It changed my perspective on what it means to serve others.',
    fullDocument: PASSAGE_1,
    tier: 'sonnet',
  },
  {
    command: 'deepen_vulnerability',
    selectedText: 'When my family moved from Guadalajara to Minneapolis, everything felt foreign. The cold was unbearable and I didn\'t know anyone at school.',
    fullDocument: PASSAGE_2,
    tier: 'sonnet',
  },
  {
    command: 'connect_to_theme',
    selectedText: 'I realized that healthcare is about more than just treating symptoms.',
    fullDocument: PASSAGE_1,
    tier: 'sonnet',
  },
  {
    command: 'connect_to_theme',
    selectedText: 'By the end of freshman year, I gave a speech at the multicultural assembly and people actually clapped.',
    fullDocument: PASSAGE_2,
    tier: 'sonnet',
  },
];

// ============================================================================
// LATENCY MEASUREMENT
// ============================================================================

interface LatencyResult {
  command: EditingCommand;
  passage: number; // 1 or 2
  tier: 'haiku' | 'sonnet';
  latencyMs: number;
  success: boolean;
  error?: string;
}

function calculateP95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  // For small samples (< 20), p95 is effectively the max
  const index = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.min(index, sorted.length - 1)];
}

async function main() {
  console.log('\n=== Inline Editing Latency Test ===\n');

  const svc = new InlineEditorService();
  const results: LatencyResult[] = [];
  let passCount = 0;
  let failCount = 0;

  // Run all 10 calls sequentially to avoid rate limiting
  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    const passageNum = tc.fullDocument === PASSAGE_1 ? 1 : 2;

    const selectionStart = tc.fullDocument.indexOf(tc.selectedText);
    const selectionEnd = selectionStart + tc.selectedText.length;

    const request: InlineEditRequest = {
      selectedText: tc.selectedText,
      fullDocument: tc.fullDocument,
      selectionStart,
      selectionEnd,
      command: tc.command,
      essayType: 'common_app',
    };

    const startMs = Date.now();
    let success = false;
    let errorMsg: string | undefined;

    try {
      const result = await svc.applyCommand(request);
      success = !!result.primary?.text && result.primary.text.length > 0;
      if (!success) {
        errorMsg = 'Empty primary text returned';
      }
    } catch (error: any) {
      errorMsg = error.message || String(error);
    }

    const latencyMs = Date.now() - startMs;

    results.push({
      command: tc.command,
      passage: passageNum,
      tier: tc.tier,
      latencyMs,
      success,
      error: errorMsg,
    });

    // Brief pause between calls to avoid rate limits
    if (i < TEST_CASES.length - 1) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // ============================================================================
  // REPORT: Haiku commands
  // ============================================================================

  const haikuResults = results.filter(r => r.tier === 'haiku');
  const sonnetResults = results.filter(r => r.tier === 'sonnet');

  console.log('Haiku Commands:');
  for (const r of haikuResults) {
    const target = 3000;
    const ok = r.success && r.latencyMs < target;
    const icon = ok ? 'PASS' : 'FAIL';
    if (ok) passCount++; else failCount++;
    console.log(`  ${r.command} (passage ${r.passage}): ${r.latencyMs}ms ${icon}${r.error ? ` [${r.error}]` : ''}`);
  }

  const haikuLatencies = haikuResults.filter(r => r.success).map(r => r.latencyMs);
  const haikuP95 = calculateP95(haikuLatencies);
  const haikuP95Pass = haikuP95 < 3000;
  console.log(`  Haiku p95: ${haikuP95}ms ${haikuP95Pass ? 'PASS' : 'FAIL'} (target: <3000ms)\n`);

  // ============================================================================
  // REPORT: Sonnet commands
  // ============================================================================

  console.log('Sonnet Commands:');
  for (const r of sonnetResults) {
    const target = 5000;
    const ok = r.success && r.latencyMs < target;
    const icon = ok ? 'PASS' : 'FAIL';
    if (ok) passCount++; else failCount++;
    console.log(`  ${r.command} (passage ${r.passage}): ${r.latencyMs}ms ${icon}${r.error ? ` [${r.error}]` : ''}`);
  }

  const sonnetLatencies = sonnetResults.filter(r => r.success).map(r => r.latencyMs);
  const sonnetP95 = calculateP95(sonnetLatencies);
  const sonnetP95Pass = sonnetP95 < 5000;
  console.log(`  Sonnet p95: ${sonnetP95}ms ${sonnetP95Pass ? 'PASS' : 'FAIL'} (target: <5000ms)\n`);

  // ============================================================================
  // OVERALL
  // ============================================================================

  const totalCalls = results.length;
  const successCalls = results.filter(r => r.success).length;
  const overallPass = haikuP95Pass && sonnetP95Pass && failCount === 0;

  console.log(`=== Summary ===`);
  console.log(`  API calls: ${successCalls}/${totalCalls} succeeded`);
  console.log(`  Haiku p95: ${haikuP95}ms ${haikuP95Pass ? 'PASS' : 'FAIL'}`);
  console.log(`  Sonnet p95: ${sonnetP95}ms ${sonnetP95Pass ? 'PASS' : 'FAIL'}`);
  console.log(`  Individual: ${passCount}/${passCount + failCount} within targets`);
  console.log(`\nOVERALL: ${overallPass ? 'PASS' : 'FAIL'} (${passCount}/${totalCalls} within targets)`);

  if (!overallPass) {
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
