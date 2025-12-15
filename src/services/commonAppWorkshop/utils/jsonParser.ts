/**
 * Robust JSON Parser for Claude Responses
 *
 * Claude can return JSON in various formats:
 * - Markdown code block: ```json {...} ```
 * - Plain code block: ``` {...} ```
 * - Raw JSON: {...}
 * - Text before/after JSON
 *
 * This parser handles all formats gracefully.
 */

export interface ParseResult<T> {
  data: T;
  rawText: string;
}

export function parseClaudeJSON<T>(responseText: string, context?: string): T {
  let jsonText: string | null = null;

  // Try markdown code block first (```json ... ```)
  const markdownMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
  if (markdownMatch) {
    jsonText = markdownMatch[1];
  }

  // Try plain code block (``` ... ```)
  if (!jsonText) {
    const plainMatch = responseText.match(/```\s*([\s\S]*?)\s*```/);
    if (plainMatch) {
      jsonText = plainMatch[1];
    }
  }

  // Try finding raw JSON object ({ ... })
  if (!jsonText) {
    const rawMatch = responseText.match(/\{[\s\S]*\}/);
    if (rawMatch) {
      jsonText = rawMatch[0];
    }
  }

  // If still no match, fail with helpful error
  if (!jsonText) {
    const preview = responseText.substring(0, 500);
    const contextMsg = context ? ` (${context})` : '';
    console.error(`Failed to parse JSON${contextMsg}. Response preview:`, preview);
    throw new Error(
      `Could not parse JSON from Claude response${contextMsg}. Response did not contain valid JSON format.`
    );
  }

  // Parse the JSON with repair attempts
  try {
    return JSON.parse(jsonText) as T;
  } catch (error) {
    // Try common JSON repairs
    let repairedText = jsonText;

    // 1. Remove trailing commas before closing braces/brackets
    repairedText = repairedText.replace(/,(\s*[}\]])/g, '$1');

    // 2. Remove single-line comments (// ...)
    repairedText = repairedText.replace(/\/\/[^\n]*/g, '');

    // 3. Remove multi-line comments (/* ... */)
    repairedText = repairedText.replace(/\/\*[\s\S]*?\*\//g, '');

    // 4. Try to close unclosed braces if truncated
    const openBraces = (repairedText.match(/\{/g) || []).length;
    const closeBraces = (repairedText.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      repairedText += '}'.repeat(openBraces - closeBraces);
    }

    // Try parsing repaired JSON
    try {
      console.log(`⚠️  JSON parse failed, attempting repair for ${context || 'response'}...`);
      return JSON.parse(repairedText) as T;
    } catch (repairError) {
      // Both attempts failed
      const preview = jsonText.substring(0, 500);
      const contextMsg = context ? ` (${context})` : '';
      console.error(`JSON parse error${contextMsg}:`, error);
      console.error('Extracted text:', preview);
      throw new Error(
        `Invalid JSON format in Claude response${contextMsg}: ${error instanceof Error ? error.message : 'Unknown error'}`
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
