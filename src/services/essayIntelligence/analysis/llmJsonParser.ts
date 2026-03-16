/**
 * Shared LLM JSON output parser — consolidates independent implementations
 * across analysis services into one robust utility with consistent error handling.
 *
 * Parsing chain:
 *   1. Already-parsed object (from useJsonMode) -> return as-is
 *   2. Direct JSON.parse
 *   3. Extract from markdown code blocks (```json ... ```)
 *   4. Extract largest JSON object/array ({ ... } or [ ... ])
 *   5. jsonrepair for minor syntax issues
 *   6. Throw with context on complete failure
 *
 * Used by: firstImpressions, structuralCartographer, holisticSynthesis,
 *          analysisPass, deepAnnotationService
 */

import { jsonrepair } from 'jsonrepair';

/**
 * Parse LLM output into a JSON object. Handles all common LLM output formats:
 * - Pre-parsed object (from useJsonMode)
 * - Raw JSON string
 * - JSON in markdown code blocks
 * - Partially malformed JSON (via jsonrepair)
 *
 * @param raw The raw LLM output (object or string)
 * @param context Optional context string for error messages (e.g., "L1 firstImpressions P2")
 * @returns Parsed JSON object
 * @throws Error with descriptive message if all parsing strategies fail
 */
export function parseLlmJsonOutput(raw: unknown, context?: string): Record<string, unknown> {
  const ctxLabel = context ? ` [${context}]` : '';

  // Step 1: Already-parsed object (from useJsonMode: true)
  if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }

  // Step 2+: String parsing chain
  if (typeof raw === 'string') {
    const { result, breadcrumbs } = parseJsonString(raw);
    if (result !== null) {
      if (typeof result !== 'object' || Array.isArray(result)) {
        throw new Error(
          `Expected JSON object but got ${Array.isArray(result) ? 'array' : typeof result}${ctxLabel}`,
        );
      }
      return result as Record<string, unknown>;
    }

    throw new Error(
      `Failed to parse JSON object from LLM response${ctxLabel}. ` +
      `Strategies tried: ${breadcrumbs.join(' → ')}. ` +
      `Input length: ${raw.length} chars. ` +
      `First 200 chars: ${raw.substring(0, 200)}. ` +
      `Last 200 chars: ${raw.substring(Math.max(0, raw.length - 200))}`,
    );
  }

  throw new Error(`Unexpected response type: ${typeof raw}${ctxLabel}`);
}

/**
 * Parse LLM output into a JSON array. Same parsing chain as parseLlmJsonOutput
 * but expects and returns an array.
 *
 * @param raw The raw LLM output (object or string)
 * @param context Optional context string for error messages
 * @returns Parsed JSON array
 * @throws Error with descriptive message if all parsing strategies fail
 */
export function parseLlmJsonArray(raw: unknown, context?: string): Array<Record<string, unknown>> {
  const ctxLabel = context ? ` [${context}]` : '';

  // Step 1: Already-parsed array
  if (Array.isArray(raw)) {
    return raw as Array<Record<string, unknown>>;
  }

  // Step 1b: Already-parsed object — check if it wraps an array
  if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    // Some LLM outputs wrap arrays in { "items": [...] } or { "annotations": [...] }
    const obj = raw as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        return obj[key] as Array<Record<string, unknown>>;
      }
    }
    throw new Error(
      `Expected JSON array but got object with keys: ${Object.keys(obj).join(', ')}${ctxLabel}`,
    );
  }

  // Step 2+: String parsing chain
  if (typeof raw === 'string') {
    const { result, breadcrumbs } = parseJsonString(raw);
    if (result !== null) {
      if (Array.isArray(result)) {
        return result as Array<Record<string, unknown>>;
      }
      // Check if result is an object wrapping an array
      if (typeof result === 'object') {
        const obj = result as Record<string, unknown>;
        for (const key of Object.keys(obj)) {
          if (Array.isArray(obj[key])) {
            return obj[key] as Array<Record<string, unknown>>;
          }
        }
      }
      throw new Error(
        `Expected JSON array but got ${typeof result}${ctxLabel}`,
      );
    }

    throw new Error(
      `Failed to parse JSON array from LLM response${ctxLabel}. ` +
      `Strategies tried: ${breadcrumbs.join(' → ')}. ` +
      `Input length: ${raw.length} chars. ` +
      `First 200 chars: ${raw.substring(0, 200)}. ` +
      `Last 200 chars: ${raw.substring(Math.max(0, raw.length - 200))}`,
    );
  }

  throw new Error(`Unexpected response type: ${typeof raw}${ctxLabel}`);
}

// ============================================================================
// INTERNAL: String parsing chain
// ============================================================================

/**
 * Attempt to parse a JSON string through multiple fallback strategies.
 * Returns the parsed value and breadcrumb trail on success, or just breadcrumbs with null result if all strategies fail.
 */
function parseJsonString(raw: string): { result: unknown; breadcrumbs: string[] } {
  const text = raw.trim();
  const breadcrumbs: string[] = [];

  // Strategy 1: Direct JSON.parse
  breadcrumbs.push('S1:direct');
  try {
    const result = JSON.parse(text);
    breadcrumbs.push('S1:OK');
    return { result, breadcrumbs };
  } catch (e) {
    breadcrumbs.push(`S1:FAIL(${(e instanceof Error ? e.message : String(e)).slice(0, 60)})`);
  }

  // Strategy 2: Extract from markdown code blocks (```json ... ```)
  breadcrumbs.push('S2:markdown');
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try {
      const result = JSON.parse(codeBlockMatch[1].trim());
      breadcrumbs.push('S2:OK');
      return { result, breadcrumbs };
    } catch (e) {
      breadcrumbs.push(`S2:FAIL(${(e instanceof Error ? e.message : String(e)).slice(0, 60)})`);
      // Try jsonrepair on the code block content
      breadcrumbs.push('S2b:markdown+repair');
      try {
        const repaired = jsonrepair(codeBlockMatch[1].trim());
        const result = JSON.parse(repaired);
        breadcrumbs.push('S2b:OK');
        return { result, breadcrumbs };
      } catch (e2) {
        breadcrumbs.push(`S2b:FAIL(${(e2 instanceof Error ? e2.message : String(e2)).slice(0, 60)})`);
      }
    }
  } else {
    breadcrumbs.push('S2:SKIP(no code block)');
  }

  // Strategy 3: jsonrepair on the full text
  breadcrumbs.push('S3:jsonrepair');
  try {
    const repaired = jsonrepair(text);
    const result = JSON.parse(repaired);
    breadcrumbs.push('S3:OK');
    return { result, breadcrumbs };
  } catch (e) {
    breadcrumbs.push(`S3:FAIL(${(e instanceof Error ? e.message : String(e)).slice(0, 60)})`);
  }

  // Strategy 4: Extract largest JSON structure (object or array)
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  const lastBrace = text.lastIndexOf('}');
  const lastBracket = text.lastIndexOf(']');

  // Try object extraction { ... }
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    breadcrumbs.push('S4a:extract-object');
    const extracted = text.substring(firstBrace, lastBrace + 1);
    try {
      const result = JSON.parse(extracted);
      breadcrumbs.push('S4a:OK');
      return { result, breadcrumbs };
    } catch (e) {
      breadcrumbs.push(`S4a:FAIL(${(e instanceof Error ? e.message : String(e)).slice(0, 60)})`);
      breadcrumbs.push('S4a-repair:extract-object+repair');
      try {
        const repaired = jsonrepair(extracted);
        const result = JSON.parse(repaired);
        breadcrumbs.push('S4a-repair:OK');
        return { result, breadcrumbs };
      } catch (e2) {
        breadcrumbs.push(`S4a-repair:FAIL(${(e2 instanceof Error ? e2.message : String(e2)).slice(0, 60)})`);
      }
    }
  }

  // Try array extraction [ ... ]
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    breadcrumbs.push('S4b:extract-array');
    const extracted = text.substring(firstBracket, lastBracket + 1);
    try {
      const result = JSON.parse(extracted);
      breadcrumbs.push('S4b:OK');
      return { result, breadcrumbs };
    } catch (e) {
      breadcrumbs.push(`S4b:FAIL(${(e instanceof Error ? e.message : String(e)).slice(0, 60)})`);
      breadcrumbs.push('S4b-repair:extract-array+repair');
      try {
        const repaired = jsonrepair(extracted);
        const result = JSON.parse(repaired);
        breadcrumbs.push('S4b-repair:OK');
        return { result, breadcrumbs };
      } catch (e2) {
        breadcrumbs.push(`S4b-repair:FAIL(${(e2 instanceof Error ? e2.message : String(e2)).slice(0, 60)})`);
      }
    }
  }

  return { result: null, breadcrumbs };
}
