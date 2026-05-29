/**
 * run-all.ts — Run every unit test in tests/unit/ and aggregate results.
 *
 * Intended as the default CI smoke test for essay-intelligence regressions.
 * All tests in this directory are PURE — no LLM calls, no network, no fixtures
 * beyond in-repo JSON. Every test should complete in <1 second; the full
 * suite should run in <5 seconds for $0.
 *
 * Run: npx tsx tests/unit/run-all.ts
 * Exit code: 0 = all green, 1 = any failure, 2 = crash.
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SuiteResult {
  file: string;
  pass: boolean;
  exitCode: number;
  stdoutTail: string;
  durationMs: number;
}

async function runSuite(file: string): Promise<SuiteResult> {
  const start = Date.now();
  return new Promise((resolve) => {
    const child = spawn('npx', ['tsx', file], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => {
      const tail = (stdout + '\n' + stderr).trim().split('\n').slice(-4).join('\n');
      resolve({
        file: path.basename(file),
        pass: code === 0,
        exitCode: code ?? -1,
        stdoutTail: tail,
        durationMs: Date.now() - start,
      });
    });
  });
}

async function main(): Promise<void> {
  // Two test styles live in tests/unit/: legacy plain-tsx scripts (top-level
  // assertions) and vitest-style suites (import from 'vitest'). This runner
  // owns ONLY the tsx scripts — vitest suites run separately via
  // `npm run test:vitest` (see vitest.config.ts, which enumerates them).
  // Running a vitest suite under raw tsx crashes (vitest worker state is never
  // initialised), so filter them out here by detecting the vitest import.
  const allFiles = (await fs.readdir(__dirname))
    .filter((f) => f.endsWith('.test.ts'))
    .filter((f) => f !== 'run-all.ts')
    .sort();
  const files: string[] = [];
  let skippedVitest = 0;
  for (const f of allFiles) {
    const abs = path.join(__dirname, f);
    const usesVitest = /from\s+['"]vitest['"]/.test(await fs.readFile(abs, 'utf8'));
    if (usesVitest) { skippedVitest++; continue; }
    files.push(abs);
  }
  if (skippedVitest > 0) {
    console.log(`(skipping ${skippedVitest} vitest-style suite(s) — run via 'npm run test:vitest')`);
  }

  if (files.length === 0) {
    console.log('no unit test files found in tests/unit/');
    process.exit(0);
  }

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`UNIT TEST SUITE — ${files.length} files`);
  console.log('═══════════════════════════════════════════════════════════════════');

  const results: SuiteResult[] = [];
  for (const file of files) {
    process.stdout.write(`  Running ${path.basename(file)}... `);
    const r = await runSuite(file);
    results.push(r);
    console.log(r.pass ? `✓ (${r.durationMs}ms)` : `✗ exit=${r.exitCode} (${r.durationMs}ms)`);
  }

  const failures = results.filter((r) => !r.pass);

  console.log('───────────────────────────────────────────────────────────────────');
  for (const f of failures) {
    console.log(`\n[FAIL] ${f.file}:`);
    console.log(f.stdoutTail.split('\n').map((l) => '    ' + l).join('\n'));
  }

  const passed = results.length - failures.length;
  console.log(
    `\nSummary: ${passed} passed · ${failures.length} failed (${results.length} total)`,
  );
  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('run-all crashed:', err);
  process.exit(2);
});
