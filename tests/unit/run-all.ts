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
  // Two test styles coexist in this directory: plain tsx scripts (top-level
  // assertions) and vitest-style suites (import { describe, it, expect } from
  // 'vitest'). Vitest tests cannot run under raw `tsx` — vitest's internal
  // worker state is never initialised, so every assertion throws. Detect the
  // vitest import and route those files through the vitest CLI instead.
  let usesVitest = false;
  try {
    usesVitest = /from\s+['"]vitest['"]/.test(await fs.readFile(file, 'utf8'));
  } catch {
    /* unreadable file falls back to tsx and surfaces the real error */
  }
  const [cmd, args] = usesVitest
    ? ['npx', ['vitest', 'run', file]]
    : ['npx', ['tsx', file]];
  return new Promise((resolve) => {
    const child = spawn(cmd, args as string[], { stdio: ['ignore', 'pipe', 'pipe'] });
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
  const files = (await fs.readdir(__dirname))
    .filter((f) => f.endsWith('.test.ts'))
    .filter((f) => f !== 'run-all.ts')
    .sort()
    .map((f) => path.join(__dirname, f));

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
