/**
 * Validate Workshop Suggestions - Edge Function
 *
 * Runs Phase 18 validation on Phase 17 workshop output
 * Separate endpoint to avoid 150s timeout
 *
 * This allows us to:
 * 1. Return Phase 17 results immediately (88-133s)
 * 2. Validate in a separate call (40-50s)
 * 3. Avoid hitting the 150s timeout limit
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Suggestion {
  type: string;
  text: string;
  rationale: string;
  fingerprint_connection?: string;
}

interface WorkshopItem {
  id: string;
  quote: string;
  suggestions: Suggestion[];
}

interface ValidateRequest {
  workshopItems: WorkshopItem[];
  essayText: string;
  promptText?: string;
}

interface ValidationResult {
  suggestion_id: string;
  quality_score: number;
  issues: string[];
  improvements: string[];
  verdict: 'excellent' | 'good' | 'needs_work';
}

/**
 * Simple validation prompt - focuses on core quality
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
 * Validate suggestions with Claude API
 */
async function validateSuggestions(
  suggestions: Array<{ suggestion_id: string; suggestion_text: string; suggestion_type: string }>,
  essayContext: string,
  anthropicApiKey: string
): Promise<ValidationResult[]> {

  console.log(`🔍 Validating ${suggestions.length} suggestions...`);

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

    console.log(`✅ Validation complete:`);
    console.log(`   Avg Score: ${avgScore.toFixed(1)}/10`);
    console.log(`   Excellent: ${excellentCount}, Needs Work: ${needsWorkCount}`);

    return validations;

  } catch (error) {
    console.error('❌ Validation error:', error);
    throw error;
  }
}

/**
 * Main handler
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ValidateRequest = await req.json();

    console.log('🔍 Phase 18 Validation Request:', {
      itemCount: body.workshopItems?.length,
      suggestionCount: body.workshopItems?.reduce((sum, item) => sum + item.suggestions.length, 0)
    });

    // Validate input
    if (!body.workshopItems || !body.essayText) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: workshopItems and essayText' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Flatten suggestions from all workshop items
    const allSuggestions = body.workshopItems.flatMap((item, itemIdx) =>
      item.suggestions.map((sug, sugIdx) => ({
        suggestion_id: `item_${itemIdx}_sug_${sugIdx}`,
        suggestion_text: sug.text,
        suggestion_type: sug.type
      }))
    );

    console.log(`   Total suggestions to validate: ${allSuggestions.length}`);

    const startTime = Date.now();

    // Run validation (single API call, ~40-50s)
    const validations = await validateSuggestions(
      allSuggestions,
      body.essayText,
      anthropicApiKey
    );

    const elapsed = Date.now() - startTime;
    console.log(`   Validation completed in ${(elapsed / 1000).toFixed(1)}s`);

    // Map validations back to workshop structure
    const enrichedWorkshopItems = body.workshopItems.map((item, itemIdx) => ({
      ...item,
      suggestions: item.suggestions.map((sug, sugIdx) => {
        const globalIdx = itemIdx * item.suggestions.length + sugIdx;
        return {
          ...sug,
          validation: validations[globalIdx]
        };
      })
    }));

    // Calculate summary statistics
    const summary = {
      average_quality: validations.reduce((sum, v) => sum + v.quality_score, 0) / validations.length,
      excellent_count: validations.filter(v => v.verdict === 'excellent').length,
      good_count: validations.filter(v => v.verdict === 'good').length,
      needs_work_count: validations.filter(v => v.verdict === 'needs_work').length,
      total_suggestions: validations.length,
      validation_time_seconds: elapsed / 1000
    };

    console.log('✅ Phase 18 Complete:', {
      avgQuality: summary.average_quality.toFixed(1),
      excellent: summary.excellent_count,
      good: summary.good_count,
      needsWork: summary.needs_work_count
    });

    return new Response(
      JSON.stringify({
        success: true,
        workshopItems: enrichedWorkshopItems,
        summary
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Phase 18 validation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
