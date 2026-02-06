/**
 * Robust JSON Parser for Claude Responses
 *
 * Claude can return JSON in various formats:
 * - Markdown code block: ```json {...} ```
 * - Plain code block: ``` {...} ```
 * - Raw JSON: {...}
 * - Text before/after JSON
 *
 * Common Claude JSON issues handled:
 * - Unescaped quotes within strings
 * - Newlines within strings not escaped
 * - Trailing commas
 * - Comments
 * - Truncated JSON
 * - Control characters
 *
 * Uses jsonrepair library as ultimate fallback for maximum reliability.
 */

import { jsonrepair } from 'jsonrepair';

export interface ParseResult<T> {
  data: T;
  rawText: string;
}

/**
 * Extract JSON text from Claude response (handles various formats)
 */
function extractJSONText(responseText: string): string | null {
  // Try markdown code block first (```json ... ```)
  const markdownMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
  if (markdownMatch) {
    return markdownMatch[1];
  }

  // Try plain code block (``` ... ```)
  const plainMatch = responseText.match(/```\s*([\s\S]*?)\s*```/);
  if (plainMatch) {
    return plainMatch[1];
  }

  // Try finding raw JSON object ({ ... })
  // Use a more careful extraction that handles nested braces
  const firstBrace = responseText.indexOf('{');
  if (firstBrace === -1) return null;

  // Find the matching closing brace
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  let lastBrace = -1;

  for (let i = firstBrace; i < responseText.length; i++) {
    const char = responseText[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          lastBrace = i;
          break;
        }
      }
    }
  }

  if (lastBrace > firstBrace) {
    return responseText.substring(firstBrace, lastBrace + 1);
  }

  // Fallback: just use the simple regex if smart extraction failed
  const rawMatch = responseText.match(/\{[\s\S]*\}/);
  return rawMatch ? rawMatch[0] : null;
}

/**
 * Apply manual repairs before using jsonrepair
 * These handle common Claude-specific issues
 */
function applyManualRepairs(jsonText: string): string {
  let repaired = jsonText;

  // 1. Remove trailing commas before closing braces/brackets
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  // 2. Remove single-line comments (// ...)
  // Be careful not to match URLs (http://...)
  repaired = repaired.replace(/(?<!:)\/\/[^\n]*/g, '');

  // 3. Remove multi-line comments (/* ... */)
  repaired = repaired.replace(/\/\*[\s\S]*?\*\//g, '');

  // 4. Replace actual newlines within string values with escaped versions
  // This is tricky - we need to only do this inside strings
  repaired = repairStringNewlines(repaired);

  // 5. Fix unquoted property names (common in LLM output)
  // Match: {word: or ,word: and replace with {"word": or ,"word":
  repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');

  // 6. Replace single quotes with double quotes for property names
  // This handles: {'key': value} -> {"key": value}
  repaired = repaired.replace(/'([^']+)'\s*:/g, '"$1":');

  return repaired;
}

/**
 * Repair newlines inside strings
 * JSON doesn't allow actual newlines in strings - they must be \n
 */
function repairStringNewlines(jsonText: string): string {
  const result: string[] = [];
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < jsonText.length; i++) {
    const char = jsonText[i];

    if (escapeNext) {
      result.push(char);
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      result.push(char);
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result.push(char);
      continue;
    }

    if (inString) {
      // Replace actual newlines with escaped versions
      if (char === '\n') {
        result.push('\\n');
        continue;
      }
      if (char === '\r') {
        result.push('\\r');
        continue;
      }
      if (char === '\t') {
        result.push('\\t');
        continue;
      }
      // Handle other control characters
      const code = char.charCodeAt(0);
      if (code < 32 && code !== 10 && code !== 13 && code !== 9) {
        result.push(`\\u${code.toString(16).padStart(4, '0')}`);
        continue;
      }
    }

    result.push(char);
  }

  return result.join('');
}

/**
 * Parse Claude JSON response with maximum reliability
 *
 * Strategy:
 * 1. Extract JSON from response (handles code blocks, etc.)
 * 2. Try direct parse (fast path for valid JSON)
 * 3. Apply manual repairs and retry
 * 4. Use jsonrepair library as ultimate fallback
 *
 * This function should NEVER fail for valid-ish JSON from Claude.
 */
export function parseClaudeJSON<T>(responseText: string, context?: string): T {
  const contextMsg = context ? ` (${context})` : '';

  // Step 1: Extract JSON from response
  const jsonText = extractJSONText(responseText);

  if (!jsonText) {
    const preview = responseText.substring(0, 500);
    console.error(`[parseClaudeJSON] No JSON found${contextMsg}. Response preview:`, preview);
    throw new Error(
      `Could not parse JSON from Claude response${contextMsg}. Response did not contain valid JSON format.`
    );
  }

  // Step 2: Try direct parse (fast path)
  try {
    return JSON.parse(jsonText) as T;
  } catch (_directError) {
    // Expected for malformed JSON, continue to repairs
  }

  // Step 3: Apply manual repairs and retry
  try {
    const manuallyRepaired = applyManualRepairs(jsonText);
    return JSON.parse(manuallyRepaired) as T;
  } catch (_manualError) {
    // Continue to jsonrepair
  }

  // Step 4: Use jsonrepair as ultimate fallback
  try {
    console.log(`[parseClaudeJSON] Using jsonrepair for${contextMsg}...`);
    const repaired = jsonrepair(jsonText);
    return JSON.parse(repaired) as T;
  } catch (repairError) {
    // Even jsonrepair failed - this is extremely rare
    // Try one more thing: jsonrepair on the manually repaired version
    try {
      const manuallyRepaired = applyManualRepairs(jsonText);
      const doubleRepaired = jsonrepair(manuallyRepaired);
      return JSON.parse(doubleRepaired) as T;
    } catch (_doubleError) {
      // Log details for debugging
      const preview = jsonText.substring(0, 1000);
      console.error(`[parseClaudeJSON] All repair attempts failed${contextMsg}`);
      console.error('[parseClaudeJSON] JSON preview:', preview);
      console.error('[parseClaudeJSON] Error:', repairError);

      throw new Error(
        `Invalid JSON format in Claude response${contextMsg}: ${
          repairError instanceof Error ? repairError.message : 'Unknown error'
        }`
      );
    }
  }
}

/**
 * Parse with detailed result (includes raw text for debugging)
 */
export function parseClaudeJSONWithMeta<T>(
  responseText: string,
  context?: string
): ParseResult<T> {
  const data = parseClaudeJSON<T>(responseText, context);
  return { data, rawText: responseText };
}

/**
 * Attempt to parse JSON, returning null on failure instead of throwing
 * Useful when you want to handle parse failures gracefully
 */
export function tryParseClaudeJSON<T>(responseText: string, context?: string): T | null {
  try {
    return parseClaudeJSON<T>(responseText, context);
  } catch {
    return null;
  }
}
