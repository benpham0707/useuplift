/**
 * Universal test environment loader
 *
 * === HOW TO RUN TESTS WITH API KEYS ===
 *
 * Option 1 (recommended): Set in .env.local at project root
 *   echo 'ANTHROPIC_API_KEY=sk-ant-...' >> .env.local
 *   npx tsx tests/test-whatever.ts
 *
 * Option 2: Pass on command line
 *   ANTHROPIC_API_KEY="sk-ant-..." npx tsx tests/test-whatever.ts
 *
 * Option 3: Export in shell
 *   export ANTHROPIC_API_KEY="sk-ant-..."
 *   npx tsx tests/test-whatever.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// ============================================================================
// ENV LOADING (runs on import)
// ============================================================================

/**
 * Load environment variables from .env.local and .env at the project root.
 * Non-destructive: existing env vars are NOT overridden.
 */
function loadEnv(): void {
  const root = path.resolve(process.cwd());

  // .env.local takes priority (loaded first so dotenv sees them as "existing")
  dotenv.config({ path: path.resolve(root, '.env.local'), override: false });

  // .env as fallback
  dotenv.config({ path: path.resolve(root, '.env'), override: false });
}

// Auto-load on import
loadEnv();

// ============================================================================
// API KEY HELPERS
// ============================================================================

/**
 * Require an API key from the environment. Throws with a helpful multi-line
 * error message if the key is not set.
 */
export function requireApiKey(name: string): string {
  const value = process.env[name];
  if (value) return value;

  throw new Error(
    `\n` +
    `═══════════════════════════════════════════════════════════\n` +
    `  Missing required environment variable: ${name}\n` +
    `═══════════════════════════════════════════════════════════\n` +
    `\n` +
    `  Set it using one of these methods:\n` +
    `\n` +
    `  1. (recommended) Add to .env.local at project root:\n` +
    `     echo '${name}=sk-ant-...' >> .env.local\n` +
    `\n` +
    `  2. Pass on the command line:\n` +
    `     ${name}="sk-ant-..." npx tsx tests/<test-file>.ts\n` +
    `\n` +
    `  3. Export in your shell:\n` +
    `     export ${name}="sk-ant-..."\n` +
    `     npx tsx tests/<test-file>.ts\n` +
    `\n` +
    `═══════════════════════════════════════════════════════════\n`
  );
}

/**
 * Get an optional API key. Returns null (with a warning) if not set.
 */
export function getOptionalApiKey(name: string): string | null {
  const value = process.env[name];
  if (value) return value;
  console.warn(`⚠️  ${name} not set — some tests may be skipped`);
  return null;
}
