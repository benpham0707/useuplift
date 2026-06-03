/**
 * Test: Model ID Consistency — CI Guard
 * Run: npx tsx tests/test-model-id-consistency.ts
 * No API key required — grep-based static analysis
 *
 * Ensures no stale model IDs remain in the codebase.
 * Verifies correct Sonnet (20250929) and Haiku (20251001) IDs are used.
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve project root (works in both CJS and ESM contexts)
const __filename_resolved = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename_resolved), '..', '..');

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${message}`);
    failed++;
  }
}

function grepCount(pattern: string, dirs: string[]): number {
  try {
    const absDirs = dirs.map(d => path.resolve(projectRoot, d));
    const dirArgs = absDirs.join(' ');
    const result = execSync(
      `grep -r "${pattern}" ${dirArgs} --include="*.ts" --include="*.tsx" -l 2>/dev/null || true`,
      { encoding: 'utf-8' }
    );
    const files = result.trim().split('\n').filter(Boolean);
    return files.length;
  } catch {
    return 0;
  }
}

function grepLines(pattern: string, dirs: string[]): string[] {
  try {
    const absDirs = dirs.map(d => path.resolve(projectRoot, d));
    const dirArgs = absDirs.join(' ');
    const result = execSync(
      `grep -rn "${pattern}" ${dirArgs} --include="*.ts" --include="*.tsx" 2>/dev/null || true`,
      { encoding: 'utf-8' }
    );
    return result.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

async function main() {
  console.log('\n=== Model ID Consistency Test ===\n');

  const searchDirs = ['src/', 'supabase/'];

  // ===== STALE MODEL ID CHECK =====
  console.log('--- Stale Model IDs ---\n');

  // Check for stale Sonnet ID (20250514)
  const staleLines = grepLines('20250514', searchDirs);
  const staleCount = staleLines.length;
  if (staleCount > 0) {
    console.log('  Found stale 20250514 references:');
    staleLines.forEach(line => console.log(`    ${line}`));
  }
  assert(staleCount === 0, `No stale "20250514" model IDs found (found ${staleCount})`);

  // Check for other known stale IDs
  const stale2Lines = grepLines('20250620', searchDirs);
  assert(stale2Lines.length === 0, `No stale "20250620" model IDs found (found ${stale2Lines.length})`);

  // ===== CORRECT MODEL ID CHECK =====
  console.log('\n--- Correct Model IDs ---\n');

  // Check that Sonnet 20250929 is present
  const sonnetCount = grepCount('20250929', searchDirs);
  assert(sonnetCount >= 5, `Sonnet "20250929" found in ${sonnetCount} files (need 5+)`);

  // Check that Haiku 20251001 is present
  const haikuCount = grepCount('20251001', searchDirs);
  assert(haikuCount >= 3, `Haiku "20251001" found in ${haikuCount} files (need 3+)`);

  // ===== MODEL STRING PATTERN CHECK =====
  console.log('\n--- Model String Patterns ---\n');

  // Verify exact model strings exist
  const sonnetFullCount = grepCount('claude-sonnet-4-5-20250929', searchDirs);
  assert(sonnetFullCount >= 3, `Full Sonnet model string found in ${sonnetFullCount} files (need 3+)`);

  const haikuFullCount = grepCount('claude-haiku-4-5-20251001', searchDirs);
  assert(haikuFullCount >= 2, `Full Haiku model string found in ${haikuFullCount} files (need 2+)`);

  // Check for old model families being used as primary model IDs
  // Note: References in arrays/configs (e.g., fallback lists) are acceptable
  const wrongFamilyLines = grepLines('claude-3-5-sonnet', searchDirs);
  if (wrongFamilyLines.length > 0) {
    console.log('  ⚠️  Old "claude-3-5-sonnet" references found (check if intentional):');
    wrongFamilyLines.forEach(line => console.log(`    ${line.slice(0, 120)}`));
  }
  // Allow up to 5 references (legacy configs, fallback arrays)
  assert(wrongFamilyLines.length <= 5, `"claude-3-5-sonnet" references limited (found ${wrongFamilyLines.length}, max 5)`);

  const wrongFamily2Lines = grepLines('claude-3-haiku', searchDirs);
  if (wrongFamily2Lines.length > 0) {
    console.log('  ⚠️  Old "claude-3-haiku" references found (check if intentional):');
    wrongFamily2Lines.forEach(line => console.log(`    ${line.slice(0, 120)}`));
  }
  assert(wrongFamily2Lines.length <= 3, `"claude-3-haiku" references limited (found ${wrongFamily2Lines.length}, max 3)`);
  // ===== RESULTS =====
  console.log(`\n=== Results: ${passed}/${passed + failed} passed ===`);
  if (failed > 0) {
    console.log(`❌ ${failed} tests FAILED`);
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
