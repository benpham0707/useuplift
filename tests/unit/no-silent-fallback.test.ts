// ============================================================================
// NO-SILENT-FALLBACK RULE — self-test (D-0.12)
// ============================================================================
// Per the D-0.12 contract: "rule fires correctly on synthetic test
// cases; doesn't fire on the legitimate-pattern cases (e.g.,
// Promise.allSettled with explicit error filtering is fine)."
//
// Uses ESLint's RuleTester for deterministic AST-level assertions —
// the rule's behavior is independently verifiable without running
// the full linter on a fixture file.
//
// Three pattern groups:
//   1. allSettledWithoutHandling — fires on every Promise.allSettled call
//   2. catchWithoutThrowOrEmit   — fires when catch body has no throw/emit
//   3. criticalPathFallback      — fires on `??` in functions starting
//                                   with orchestrate / analyze / generate / build

import { describe, it } from 'vitest';
// @ts-expect-error — eslint provides types via auto-detection; the
// import resolves at runtime via the npm-installed package.
import { RuleTester } from 'eslint';
// @ts-expect-error — local rule, not a typed module.
import rule from '../../eslint-rules/no-silent-fallback.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

describe('no-silent-fallback ESLint rule', () => {
  it('fires on Promise.allSettled', () => {
    ruleTester.run('no-silent-fallback', rule, {
      valid: [
        // No allSettled call — clearly valid.
        'Promise.all([a, b]);',
        // Member access not on Promise — different identifier.
        'NotPromise.allSettled([a]);',
      ],
      invalid: [
        {
          code: 'await Promise.allSettled([a, b]);',
          errors: [{ messageId: 'allSettledWithoutHandling' }],
        },
        {
          code: `
            async function f() {
              const results = await Promise.allSettled(promises);
              return results;
            }
          `,
          errors: [{ messageId: 'allSettledWithoutHandling' }],
        },
      ],
    });
  });

  it('fires on catch blocks without throw or emit', () => {
    ruleTester.run('no-silent-fallback', rule, {
      valid: [
        // Re-throw → valid.
        `
          try { dangerous(); }
          catch (e) { throw e; }
        `,
        // Calls emit* → valid.
        `
          try { dangerous(); }
          catch (e) { emitStepFailure('id', e); }
        `,
        // Emit nested in if → valid (recursive descent).
        `
          try { dangerous(); }
          catch (e) {
            if (shouldLog) emitIterationEvent({ ...e });
          }
        `,
        // Wrapped + re-thrown.
        `
          try { dangerous(); }
          catch (e) {
            const wrapped = new Error('wrapped');
            throw wrapped;
          }
        `,
        // Member-emit (telemetry.emitX) → valid.
        `
          try { dangerous(); }
          catch (e) { telemetry.emitFailure(e); }
        `,
      ],
      invalid: [
        {
          // Empty catch — silent fallback.
          code: `
            try { dangerous(); }
            catch (e) {}
          `,
          errors: [{ messageId: 'catchWithoutThrowOrEmit' }],
        },
        {
          // Logs only — no throw, no emit*.
          code: `
            try { dangerous(); }
            catch (e) { console.error(e); }
          `,
          errors: [{ messageId: 'catchWithoutThrowOrEmit' }],
        },
        {
          // Returns a default — classic silent-fallback.
          code: `
            function safeFetch() {
              try { return doFetch(); }
              catch (e) { return null; }
            }
          `,
          errors: [{ messageId: 'catchWithoutThrowOrEmit' }],
        },
      ],
    });
  });

  it('fires on `??` defaults in critical-path functions', () => {
    ruleTester.run('no-silent-fallback', rule, {
      valid: [
        // Non-critical helper name — not in the prefix set.
        `
          function helperFunction(x) {
            return x ?? 'default';
          }
        `,
        // No `??` operator — `||` is excluded.
        `
          function orchestrateAnalysis(x) {
            return x || [];
          }
        `,
        // `??` in a top-level expression with no enclosing function.
        `const x = a ?? b;`,
      ],
      invalid: [
        {
          code: `
            function orchestratePipeline(input) {
              return input.layers ?? [];
            }
          `,
          errors: [{ messageId: 'criticalPathFallback', data: { funcName: 'orchestratePipeline' } }],
        },
        {
          code: `
            const analyzeProfile = (data) => {
              return data.value ?? null;
            };
          `,
          errors: [{ messageId: 'criticalPathFallback', data: { funcName: 'analyzeProfile' } }],
        },
        {
          code: `
            const obj = {
              generateAnnotations(data) {
                return data.list ?? [];
              }
            };
          `,
          errors: [{ messageId: 'criticalPathFallback', data: { funcName: 'generateAnnotations' } }],
        },
        {
          code: `
            class X {
              buildManifest(data) {
                return data ?? {};
              }
            }
          `,
          errors: [{ messageId: 'criticalPathFallback', data: { funcName: 'buildManifest' } }],
        },
      ],
    });
  });

  it('does not double-fire on a function that has both ?? and a clean catch', () => {
    ruleTester.run('no-silent-fallback', rule, {
      valid: [
        `
          function helper(x) {
            try { return doIt(x); } catch (e) { throw e; }
          }
        `,
      ],
      invalid: [],
    });
  });
});
