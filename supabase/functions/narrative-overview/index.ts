/**
 * Narrative Overview Edge Function
 *
 * Generates a holistic, empowering narrative overview using full context
 * from completed workshop analysis. This is a separate, lightweight call.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface OverviewRequest {
  essayText: string;
  promptText: string;
  voiceFingerprint: any;
  experienceFingerprint: any;
  rubricDimensionDetails: any[];
  workshopItems: any[];
  narrativeQualityIndex: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody: OverviewRequest = await req.json();

    // Validate required fields
    if (!requestBody.essayText || !requestBody.promptText) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: essayText and promptText' }),
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

    // Extract context from analysis
    const nqi = requestBody.narrativeQualityIndex || 50;
    const strongDimensions = requestBody.rubricDimensionDetails
      ?.filter((d: any) => d.final_score >= 7)
      .map((d: any) => d.dimension_name.replace(/_/g, ' '))
      .join(', ') || 'none yet';

    const growthAreas = requestBody.rubricDimensionDetails
      ?.filter((d: any) => d.final_score < 6)
      .map((d: any) => d.dimension_name.replace(/_/g, ' '))
      .join(', ') || 'none';

    const workshopFocus = requestBody.workshopItems
      ?.slice(0, 3)
      .map((w: any) => w.problem)
      .join('; ') || 'overall polish';

    const voiceTone = requestBody.voiceFingerprint?.tone?.primary || 'authentic';
    const pacing = requestBody.voiceFingerprint?.pacing?.speed || 'measured';
    const uniqueness = requestBody.experienceFingerprint?.confidenceScore || 5;

    // Generate holistic overview using Claude
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        temperature: 0.8,
        system: `You are an empathetic essay coach who deeply understands student narratives. Generate a holistic, encouraging overview that shows you understand what they're trying to convey.

Your overview should:
- Lead with their strongest narrative asset (what makes their story work)
- Articulate what their essay is trying to show or convey
- Identify what would make it more compelling (patterns: specificity, emotion, transformation, structure)
- Give overarching guidance on narrative improvements (not dimension-by-dimension)
- Close with an encouraging, concrete next step
- Use storytelling tone, not report-card language
- NO scores or numbers (we already show those elsewhere)
- Be 3-5 sentences maximum
- Sound like a human coach who really gets their story

Return ONLY valid JSON:
{
  "narrative_overview": "string - the holistic narrative understanding"
}`,
        messages: [
          {
            role: 'user',
            content: `Generate a holistic narrative overview for this essay:

Essay:
${requestBody.essayText}

Prompt:
${requestBody.promptText}

Analysis Context:
- Voice: ${voiceTone}, ${pacing} pacing
- Experience uniqueness confidence: ${uniqueness}/10
- Narrative Quality Index: ${nqi}/100
- Strongest dimensions: ${strongDimensions}
- Areas for growth: ${growthAreas}
- Key workshop focus: ${workshopFocus}

Write an empowering 3-5 sentence overview that:
1. Shows deep understanding of what they're trying to say
2. Identifies their narrative's strongest asset
3. Gives specific, encouraging guidance on making it more compelling
4. Uses storytelling tone (no scores/numbers)
5. Closes with a concrete next step`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Overview generation failed: ${response.status}`);
    }

    const result = await response.json();
    const overviewText = result.content[0].text;

    let narrativeOverview;
    try {
      const jsonMatch = overviewText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : overviewText.trim();
      const parsed = JSON.parse(jsonString);
      narrativeOverview = parsed.narrative_overview;
    } catch (e) {
      // Fallback: use the raw text if JSON parsing fails
      narrativeOverview = overviewText;
    }

    return new Response(
      JSON.stringify({
        success: true,
        narrative_overview: narrativeOverview,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
