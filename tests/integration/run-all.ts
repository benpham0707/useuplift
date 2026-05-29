/**
 * run-all.ts — Run every integration test in tests/integration/ and aggregate results.
 *
 * Integration tests run against a live Postgres (service-container in CI,
 * supabase start locally) and may call a live LLM. They are gated behind
 * `SUPABASE_TEST_DB_URL` / `ANTHROPIC_API_KEY` env vars; if absent, the suite
 * reports "skipped" per-file and exits 0 (so CI stays green when secrets
 * aren't wired for a given run).
 *
 * Run: npm run test:integration
 * Exit code: 0 = all green or skipped, 1 = any failure, 2 = crash.
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SuiteResult {
  file: string;
  status: 'pass' | 'fail' | 'skip';
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
      const tail = (stdout + '\n' + stderr).trim().split('\n').slice(-6).join('\n');
      // Integration tests may self-skip by exiting 77 (prior-art Autoconf convention)
      const status: SuiteResult['status'] =
        code === 77 ? 'skip' : code === 0 ? 'pass' : 'fail';
      resolve({
        file: path.basename(file),
        status,
        exitCode: code ?? -1,
        stdoutTail: tail,
        durationMs: Date.now() - start,
      });
    });
  });
}

async function main(): Promise<void> {
  // Like tests/unit/run-all.ts, this tsx runner owns ONLY the plain-tsx
  // integration scripts. Vitest-style suites (import from 'vitest') are
  // enumerated in vitest.config.ts and run via `npm run test:vitest` — they
  // crash under raw tsx (vitest worker state never initialises), so skip them.
  const allFiles = (await fs.readdir(__dirname))
    .filter((f) => f.endsWith('.test.ts'))
    .sort();
  const files: string[] = [];
  let skippedVitest = 0;
  for (const f of allFiles) {
    const abs = path.join(__dirname, f);
    if (/from\s+['"]vitest['"]/.test(await fs.readFile(abs, 'utf8'))) { skippedVitest++; continue; }
    files.push(abs);
  }
  if (skippedVitest > 0) {
    console.log(`(skipping ${skippedVitest} vitest-style suite(s) — run via 'npm run test:vitest')`);
  }

  if (files.length === 0) {
    console.log('no integration test files found in tests/integration/');
    process.exit(0);
  }

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`INTEGRATION TEST SUITE — ${files.length} files`);
  console.log('═══════════════════════════════════════════════════════════════════');

  const results: SuiteResult[] = [];
  for (const file of files) {
    process.stdout.write(`  Running ${path.basename(file)}... `);
    const r = await runSuite(file);
    results.push(r);
    const tag =
      r.status === 'pass' ? `✓ (${r.durationMs}ms)` :
      r.status === 'skip' ? `⊘ skipped (${r.durationMs}ms)` :
      `✗ exit=${r.exitCode} (${r.durationMs}ms)`;
    console.log(tag);
  }

  const failures = results.filter((r) => r.status === 'fail');
  const skipped = results.filter((r) => r.status === 'skip');

  console.log('───────────────────────────────────────────────────────────────────');
  for (const f of failures) {
    console.log(`\n[FAIL] ${f.file}:`);
    console.log(f.stdoutTail.split('\n').map((l) => '    ' + l).join('\n'));
  }

  const passed = results.length - failures.length - skipped.length;
  console.log(
    `\nSummary: ${passed} passed · ${failures.length} failed · ${skipped.length} skipped`,
  );
  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('run-all crashed:', err);
  process.exit(2);
});
