/**
 * Phase 18: Lightweight Quality Validation & Refinement Layer
 *
 * Purpose: Final quality check & iteration feedback for Phase 17 suggestions
 * Approach: Single API call, focuses on what matters most
 *
 * NOT a duplicate system - just a lightweight refinement layer
 */

interface Suggestion {
  suggestion_id: string;
  suggestion_text: string;
  suggestion_type: string;
}

interface ValidationResult {
  suggestion_id: string;
  quality_score: number;  // 0-10
  issues: string[];
  improvements: string[];
  verdict: 'excellent' | 'good' | 'needs_work';
}

/**
 * Simple Validation Prompt - Focused on Core Quality
 */
const VALIDATION_PROMPT = `You are a final quality reviewer for college essay workshop suggestions.

Your job: Quick quality check focusing on 4 key areas:

1. **AI-Detection Risk** - Does this sound AI-generated or authentic?
   - Red flags: "journey", "passion", "grew as a person", lists of 3 adjectives
   - Good signs: Specific details, concrete examples, natural voice

2. **Admissions Value** - Would this help the essay stand out?
   - Red flags: Generic insights, vague claims, no evidence
   - Good signs: Specific impact, unique perspective, character shown through action

3. **Word Efficiency** - Is every word adding value? (350-word limit!)
   - Red flags: "really", "very", redundant phrases, filler
   - Good signs: Concrete > abstract, every sentence adds something new

4. **Originality** - Is this unique to THIS student?
   - Red flags: Could be anyone's story, common topics without fresh angle
   - Good signs: Irreplaceable details, surprising insights, authentic voice

**Output Format** (JSON):
{
  "suggestion_id": "string",
  "quality_score": 0-10,
  "issues": [
    "Uses generic phrase 'learned valuable lessons'",
    "No specific numbers or timeframes"
  ],
  "improvements": [
    "Replace 'learned lessons' with specific action showing what changed",
    "Add concrete details: ages, times, objects, numbers"
  ],
  "verdict": "excellent" | "good" | "needs_work"
}

**Scoring**:
- 9-10: Excellent - specific, authentic, strategically strong
- 7-8: Good - solid with minor issues
- 5-6: Needs work - several generic/vague elements
- 0-4: Weak - major issues with AI-detection risk or generic language

Be harsh but fair. We want Berkeley/UCLA quality.`;

/**
 * Validate suggestions with single API call
 */
export async function validateSuggestions(
  suggestions: Suggestion[],
  essayContext: string,
  anthropicApiKey: string
): Promise<ValidationResult[]> {

  const userMessage = `Review these ${suggestions.length} workshop suggestions for quality.

ESSAY CONTEXT: ${essayContext.substring(0, 500)}...

SUGGESTIONS:
${JSON.stringify(suggestions, null, 2)}

Return JSON array of validation results.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        temperature: 0.3,
        system: VALIDATION_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    let responseText = result.content[0].text;

    // Remove markdown code fences if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();

    const validations = JSON.parse(responseText);

    // Calculate summary
    const avgScore = validations.reduce((sum: number, v: ValidationResult) => sum + v.quality_score, 0) / validations.length;
    const excellentCount = validations.filter((v: ValidationResult) => v.verdict === 'excellent').length;
    const needsWorkCount = validations.filter((v: ValidationResult) => v.verdict === 'needs_work').length;

    return validations;

  } catch (error) {
    throw error;
  }
}
