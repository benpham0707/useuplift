/**
 * Workshop Analysis Edge Function
 *
 * Runs the full surgical workshop analysis on the backend where Claude API calls are allowed.
 * This edge function wraps the surgicalOrchestrator to enable frontend access.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface WorkshopRequest {
  essayText: string;
  essayType: 'personal_statement' | 'uc_piq' | 'why_us' | 'supplemental' | 'activity_essay';
  promptText: string;
  promptTitle: string;
  maxWords?: number;
  targetSchools?: string[];
  studentContext?: {
    academicStrength?: 'strong' | 'moderate' | 'developing';
    voicePreference?: 'concise' | 'expressive' | 'balanced';
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const requestBody: WorkshopRequest = await req.json();

    console.log('🔧 Workshop Analysis Request:', {
      essayType: requestBody.essayType,
      essayLength: requestBody.essayText?.length,
      promptTitle: requestBody.promptTitle,
    });

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

    // Import the surgical workshop orchestrator
    // Note: We need to transpile TypeScript files or use a bundled version
    // For now, we'll make a Claude API call directly with the workshop logic

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured in environment');
    }

    console.log('🤖 Starting surgical workshop analysis...');
    const startTime = Date.now();

    // Stages 1 & 2: Run Voice and Experience Fingerprints in PARALLEL (saves ~20-30s)
    console.log('🔄 Starting parallel fingerprint analysis...');
    const [voiceFingerprintResponse, experienceFingerprintResponse] = await Promise.all([
      // Stage 1: Voice Fingerprint Analysis
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          temperature: 0.7,
          system: `You are an expert essay analyst specializing in voice fingerprinting. Analyze the student's unique writing voice across 4 key dimensions.

Return ONLY valid JSON with this structure:
{
  "sentenceStructure": {
    "pattern": "string describing pattern (e.g., 'varied complex with short punchy beats')",
    "example": "example sentence from essay"
  },
  "vocabulary": {
    "level": "string (e.g., 'accessible with technical precision')",
    "signatureWords": ["word1", "word2", "word3"]
  },
  "pacing": {
    "speed": "string (e.g., 'deliberate', 'brisk')",
    "rhythm": "string describing rhythm"
  },
  "tone": {
    "primary": "string (e.g., 'reflective', 'analytical')",
    "secondary": "string"
  }
}`,
          messages: [
            {
              role: 'user',
              content: `Analyze the voice fingerprint of this essay:\n\nPrompt: ${requestBody.promptText}\n\nEssay:\n${requestBody.essayText}`
            }
          ]
        })
      }),
      // Stage 2: Experience Fingerprint (Anti-Convergence Analysis)
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 3072,
          temperature: 0.7,
          system: `You are an expert at identifying unique, non-convergent experiences in essays. Analyze for 6 dimensions of uniqueness and detect generic patterns.

Return ONLY valid JSON with this structure:
{
  "unusualCircumstance": { "description": "string", "whyItMatters": "string", "specificDetail": "string" } or null,
  "unexpectedEmotion": { "emotion": "string", "trigger": "string", "counterExpectation": "string" } or null,
  "contraryInsight": { "insight": "string", "againstWhat": "string", "whyAuthentic": "string" } or null,
  "specificSensoryAnchor": { "sensory": "string", "context": "string", "emotionalWeight": "string" } or null,
  "uniqueRelationship": { "person": "string", "dynamic": "string", "unexpectedAspect": "string" } or null,
  "culturalSpecificity": { "element": "string", "connection": "string", "universalBridge": "string" } or null,
  "antiPatternFlags": {
    "followsTypicalArc": boolean,
    "hasGenericInsight": boolean,
    "hasManufacturedBeat": boolean,
    "hasCrowdPleaser": boolean,
    "warnings": ["string"]
  },
  "divergenceRequirements": {
    "mustInclude": ["string"],
    "mustAvoid": ["string"],
    "uniqueAngle": "string",
    "authenticTension": "string"
  },
  "qualityAnchors": [
    {
      "sentence": "exact sentence from essay",
      "whyItWorks": "string",
      "preservationPriority": "critical" | "high" | "medium"
    }
  ],
  "confidenceScore": number (0-10)
}`,
          messages: [
            {
              role: 'user',
              content: `Analyze the experience fingerprint of this essay:\n\nPrompt: ${requestBody.promptText}\n\nEssay:\n${requestBody.essayText}`
            }
          ]
        })
      })
    ]);
    console.log(`✅ Parallel fingerprints complete in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

    if (!voiceFingerprintResponse.ok) {
      const errorText = await voiceFingerprintResponse.text();
      console.error('Voice fingerprint API error:', errorText);
      throw new Error(`Voice fingerprint analysis failed: ${voiceFingerprintResponse.status}`);
    }

    const voiceFingerprintResult = await voiceFingerprintResponse.json();
    const voiceFingerprintText = voiceFingerprintResult.content[0].text;

    // Parse JSON from response (handle code blocks)
    let voiceFingerprint;
    try {
      const jsonMatch = voiceFingerprintText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : voiceFingerprintText.trim();
      voiceFingerprint = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse voice fingerprint JSON:', voiceFingerprintText);
      voiceFingerprint = null;
    }

    // Parse Experience Fingerprint
    if (!experienceFingerprintResponse.ok) {
      const errorText = await experienceFingerprintResponse.text();
      console.error('Experience fingerprint API error:', errorText);
      throw new Error(`Experience fingerprint analysis failed: ${experienceFingerprintResponse.status}`);
    }

    const experienceFingerprintResult = await experienceFingerprintResponse.json();
    const experienceFingerprintText = experienceFingerprintResult.content[0].text;

    let experienceFingerprint;
    try {
      const jsonMatch = experienceFingerprintText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : experienceFingerprintText.trim();
      experienceFingerprint = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse experience fingerprint JSON:', experienceFingerprintText);
      experienceFingerprint = null;
    }

    // Stage 3: 12-Dimension Rubric Analysis
    const rubricResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        temperature: 0.7,
        system: `You are an expert college admissions essay evaluator. Analyze this essay across 12 key dimensions.

The 12 dimensions are:
1. Opening Hook & Engagement
2. Character Development & Specificity
3. Stakes & Tension
4. Climax & Turning Point
5. Conclusion & Reflection
6. Narrative Voice & Authenticity
7. Structural Clarity & Flow
8. Sensory Details & Immersion
9. Insight Depth & Maturity
10. Emotional Resonance
11. Uniqueness & Differentiation
12. Prompt Responsiveness

For each dimension, provide:
- raw_score (0-10): Initial objective assessment
- final_score (0-10): Adjusted for context and potential
- evidence: { justification: string, strengths: [strings], weaknesses: [strings] }

Also provide:
- narrative_quality_index (0-100): Overall score
- overall_strengths: [strings]
- overall_weaknesses: [strings]

Return ONLY valid JSON with this structure:
{
  "dimensions": [
    {
      "dimension_name": "opening_hook",
      "raw_score": number,
      "final_score": number,
      "evidence": {
        "justification": "string",
        "strengths": ["string"],
        "weaknesses": ["string"]
      }
    }
    // ... repeat for all 12 dimensions
  ],
  "narrative_quality_index": number,
  "overall_strengths": ["string"],
  "overall_weaknesses": ["string"]
}`,
        messages: [
          {
            role: 'user',
            content: `Analyze this essay across all 12 dimensions:\n\nPrompt: ${requestBody.promptText}\n\nEssay:\n${requestBody.essayText}`
          }
        ]
      })
    });

    if (!rubricResponse.ok) {
      const errorText = await rubricResponse.text();
      console.error('Rubric analysis API error:', errorText);
      throw new Error(`Rubric analysis failed: ${rubricResponse.status}`);
    }

    const rubricResult = await rubricResponse.json();
    const rubricText = rubricResult.content[0].text;

    let rubricAnalysis;
    try {
      const jsonMatch = rubricText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : rubricText.trim();
      rubricAnalysis = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse rubric JSON:', rubricText);
      throw new Error('Failed to parse rubric analysis');
    }

    console.log('✅ Rubric analysis complete');

    // Apply score calibration curve to make scoring more lenient
    // This adjusts Claude's naturally harsh scoring to be more student-friendly
    // while preserving the ceiling for truly exceptional work
    function calibrateScore(rawScore: number): number {
      // Gentler scoring curve: modest uplift while preserving top end
      // Input 0-10 -> Output 0-10
      // Maps: 0->0, 1->1.5, 2->2.5, 3->3.5, 4->4.5, 5->5.5, 6->6.5, 7->7.5, 8->8.5, 9->9, 10->10
      if (rawScore === 0) return 0;
      if (rawScore >= 9) return rawScore; // Preserve 9 and 10 ceiling
      return rawScore + 0.5; // Add half point to scores 1-8
    }

    function calibrateNQI(rawNQI: number): number {
      // More moderate NQI calibration: target ~50 for typical essays
      // Input 0-100 -> Output 0-100
      // Maps roughly: 15->42, 25->48, 35->56, 45->62, 55->68, 65->74, 75->82, 85->90, 95->97, 100->100
      if (rawNQI === 0) return 0;
      if (rawNQI >= 95) return Math.round(rawNQI * 0.95 + 5); // Gentle compression at top
      if (rawNQI >= 75) return Math.round(rawNQI * 1.1 - 3);
      if (rawNQI >= 50) return Math.round(rawNQI * 1.2 - 5);
      if (rawNQI >= 25) return Math.round(rawNQI * 1.3 - 8);
      return Math.round(rawNQI * 1.8 + 15); // Modest lift for very low scores
    }

    // Apply calibration to all dimension scores
    if (rubricAnalysis.dimensions) {
      rubricAnalysis.dimensions = rubricAnalysis.dimensions.map((dim: any) => ({
        ...dim,
        raw_score: calibrateScore(dim.raw_score),
        final_score: calibrateScore(dim.final_score),
      }));
    }

    // Apply calibration to NQI
    if (rubricAnalysis.narrative_quality_index) {
      const originalNQI = rubricAnalysis.narrative_quality_index;
      rubricAnalysis.narrative_quality_index = calibrateNQI(originalNQI);
      console.log(`📊 Score calibration: ${originalNQI} -> ${rubricAnalysis.narrative_quality_index}`);
    }

    // Stage 4: Surgical Workshop Items (3-Tiered Batched Approach for Maximum Quality)
    // Tier 1: 4 critical/high severity items with full depth
    // Tier 2: 4 medium/high items covering uncovered dimensions
    // Tier 3: 4 final items filling remaining gaps
    console.log('🔧 Stage 4: Generating workshop items (3-tier batched approach)...');

    const BASE_SYSTEM_PROMPT = `You are a surgical essay editor. Identify specific issues in the essay and provide 3 types of surgical fixes:

1. polished_original: Minimal edits preserving voice
2. voice_amplifier: Heightens student's existing voice patterns
3. divergent_strategy: Bold alternative exploring different angle

For each issue:
- Extract exact quote from essay
- Explain problem and why it matters
- Assign severity (critical/high/medium/low)
- Map to rubric category (opening_hook, character_development, stakes_tension, etc.)
- Provide 3 surgical suggestions with rationale

Return ONLY valid JSON with this structure:
{
  "workshopItems": [
    {
      "id": "unique_id",
      "quote": "exact text from essay",
      "problem": "detailed problem description",
      "why_it_matters": "concrete impact explanation",
      "severity": "critical" | "high" | "medium" | "low",
      "rubric_category": "dimension_name",
      "suggestions": [
        {
          "type": "polished_original",
          "text": "revised text",
          "rationale": "why this works"
        },
        {
          "type": "voice_amplifier",
          "text": "revised text",
          "rationale": "why this works"
        },
        {
          "type": "divergent_strategy",
          "text": "revised text",
          "rationale": "why this works"
        }
      ]
    }
  ]
}`;

    // Tier 1: Critical/High Priority Items (4 items)
    console.log('  📍 Tier 1: Generating 4 critical/high priority items...');
    const tier1Response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        temperature: 0.8,
        system: BASE_SYSTEM_PROMPT + `

TIER 1: Focus on the 4 MOST CRITICAL issues (severity: critical/high)`,
        messages: [{
          role: 'user',
          content: `Identify 4 critical workshop items for this essay:

Prompt: ${requestBody.promptText}

Essay:
${requestBody.essayText}

Rubric Analysis:
${JSON.stringify(rubricAnalysis, null, 2)}

Voice Fingerprint:
${JSON.stringify(voiceFingerprint, null, 2)}`
        }]
      })
    });

    if (!tier1Response.ok) {
      const errorText = await tier1Response.text();
      console.error('Tier 1 API error:', errorText);
      throw new Error(`Tier 1 generation failed: ${tier1Response.status}`);
    }

    const tier1Result = await tier1Response.json();
    const tier1Text = tier1Result.content[0].text;
    let tier1Data;
    try {
      const jsonMatch = tier1Text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : tier1Text.trim();
      tier1Data = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse Tier 1 JSON:', tier1Text);
      tier1Data = { workshopItems: [] };
    }

    console.log(`  ✅ Tier 1 complete: ${tier1Data.workshopItems?.length || 0} items`);

    // Tier 2: Medium/High Priority Items (4 items, excluding Tier 1 dimensions)
    console.log('  📍 Tier 2: Generating 4 medium/high priority items...');
    const tier1Categories = tier1Data.workshopItems?.map((item: any) => item.rubric_category) || [];

    const tier2Response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        temperature: 0.8,
        system: BASE_SYSTEM_PROMPT + `

TIER 2: Cover dimensions NOT in Tier 1 (severity: medium/high)`,
        messages: [{
          role: 'user',
          content: `Identify 4 workshop items for this essay (excluding already-covered dimensions):

Prompt: ${requestBody.promptText}

Essay:
${requestBody.essayText}

Rubric Analysis:
${JSON.stringify(rubricAnalysis, null, 2)}

Voice Fingerprint:
${JSON.stringify(voiceFingerprint, null, 2)}

Already covered: ${tier1Categories.join(', ')}`
        }]
      })
    });

    if (!tier2Response.ok) {
      const errorText = await tier2Response.text();
      console.error('Tier 2 API error:', errorText);
      throw new Error(`Tier 2 generation failed: ${tier2Response.status}`);
    }

    const tier2Result = await tier2Response.json();
    const tier2Text = tier2Result.content[0].text;
    let tier2Data;
    try {
      const jsonMatch = tier2Text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : tier2Text.trim();
      tier2Data = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse Tier 2 JSON:', tier2Text);
      tier2Data = { workshopItems: [] };
    }

    console.log(`  ✅ Tier 2 complete: ${tier2Data.workshopItems?.length || 0} items`);

    // Tier 3: Final Polish Items (4 items, filling remaining gaps)
    console.log('  📍 Tier 3: Generating 4 final polish items...');
    const tier2Categories = tier2Data.workshopItems?.map((item: any) => item.rubric_category) || [];
    const allCoveredCategories = [...tier1Categories, ...tier2Categories];

    const tier3Response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        temperature: 0.8,
        system: BASE_SYSTEM_PROMPT + `

TIER 3: Final 4 items covering remaining dimensions`,
        messages: [{
          role: 'user',
          content: `Identify 4 final workshop items for this essay:

Prompt: ${requestBody.promptText}

Essay:
${requestBody.essayText}

Rubric Analysis:
${JSON.stringify(rubricAnalysis, null, 2)}

Voice Fingerprint:
${JSON.stringify(voiceFingerprint, null, 2)}

Already covered: ${allCoveredCategories.join(', ')}`
        }]
      })
    });

    if (!tier3Response.ok) {
      const errorText = await tier3Response.text();
      console.error('Tier 3 API error:', errorText);
      throw new Error(`Tier 3 generation failed: ${tier3Response.status}`);
    }

    const tier3Result = await tier3Response.json();
    const tier3Text = tier3Result.content[0].text;
    let tier3Data;
    try {
      const jsonMatch = tier3Text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : tier3Text.trim();
      tier3Data = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse Tier 3 JSON:', tier3Text);
      tier3Data = { workshopItems: [] };
    }

    console.log(`  ✅ Tier 3 complete: ${tier3Data.workshopItems?.length || 0} items`);

    // Combine all tiers
    const allWorkshopItems = [
      ...(tier1Data.workshopItems || []),
      ...(tier2Data.workshopItems || []),
      ...(tier3Data.workshopItems || [])
    ];

    const workshopData = { workshopItems: allWorkshopItems };
    console.log(`✅ Stage 4 complete: ${allWorkshopItems.length} total workshop items (Tier 1: ${tier1Data.workshopItems?.length || 0}, Tier 2: ${tier2Data.workshopItems?.length || 0}, Tier 3: ${tier3Data.workshopItems?.length || 0})`);

    // Assemble final result
    const finalResult = {
      success: true,
      analysis: {
        narrative_quality_index: rubricAnalysis.narrative_quality_index || 75,
        overall_strengths: rubricAnalysis.overall_strengths || [],
        overall_weaknesses: rubricAnalysis.overall_weaknesses || [],
      },
      voiceFingerprint: voiceFingerprint,
      experienceFingerprint: experienceFingerprint,
      rubricDimensionDetails: rubricAnalysis.dimensions || [],
      workshopItems: workshopData.workshopItems || [],
    };

    console.log('🎉 Full surgical workshop analysis complete');
    console.log(`   - NQI: ${finalResult.analysis.narrative_quality_index}`);
    console.log(`   - Dimensions: ${finalResult.rubricDimensionDetails.length}`);
    console.log(`   - Workshop Items: ${finalResult.workshopItems.length}`);

    return new Response(
      JSON.stringify(finalResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Workshop analysis error:', error);
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
