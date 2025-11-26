/**
 * Workshop Analysis Edge Function - CHUNKED ARCHITECTURE
 *
 * Supports 3-stage chunked execution to avoid 150s timeout:
 * - Stage 1 (~30-35s): Analysis (voice + experience + rubric)
 * - Stage 2 (~35-40s): Generation (9 items in 3 batches of 3)
 * - Stage 3 (~40-45s): Validation (27 suggestions)
 *
 * Total: 105-120s across 3 separate requests
 * Each stage < 60s = Safe margin below 150s timeout per stage
 */

import { generateWorkshopBatch, validateWorkshopItemSuggestions } from './validator.ts';

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
  anthropicApiKey?: string;
}

interface ContinueToken {
  essayText: string;
  essayType: string;
  promptText: string;
  promptTitle: string;
  anthropicApiKey: string;
  // Stage 1 results
  voiceFingerprint?: any;
  experienceFingerprint?: any;
  rubricAnalysis?: any;
  // Stage 2 results
  workshopItems?: any[];
}

// Helper functions for continue token (UTF-8 safe)
function encodeContinueToken(data: ContinueToken): string {
  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(jsonString);
  // Convert to base64
  let binary = '';
  uint8Array.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeContinueToken(token: string): ContinueToken {
  // Decode from base64
  const binary = atob(token);
  const uint8Array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    uint8Array[i] = binary.charCodeAt(i);
  }
  const decoder = new TextDecoder();
  const jsonString = decoder.decode(uint8Array);
  return JSON.parse(jsonString);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract stage parameter from URL
    const url = new URL(req.url);
    const stage = url.searchParams.get('stage') || 'all';

    // Parse request body
    const requestBody: WorkshopRequest & { continueToken?: string } = await req.json();

    // Continue token is now passed in request body (not URL) to avoid 414 URI Too Long
    const continueTokenParam = requestBody.continueToken;

    console.log(`🎯 Stage: ${stage}${continueTokenParam ? ' (with continue token)' : ''}`);

    // Get API key from environment or request body
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY') || requestBody.anthropicApiKey;
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured in environment or request');
    }

    // Decode continue token if provided
    let tokenData: ContinueToken | null = null;
    if (continueTokenParam) {
      try {
        tokenData = decodeContinueToken(continueTokenParam);
        console.log('✅ Continue token decoded successfully');
      } catch (err) {
        return new Response(
          JSON.stringify({ error: 'Invalid continue token', details: (err as Error).message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Validate required fields based on stage
    if (stage === '1' || stage === 'all') {
      if (!requestBody.essayText || !requestBody.promptText) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: essayText and promptText' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    console.log('🤖 Starting surgical workshop analysis...');
    const startTime = Date.now();

    // Declare variables for cross-stage use
    let voiceFingerprint: any;
    let experienceFingerprint: any;
    let rubricAnalysis: any;
    let workshopItems: any[] = [];

    // ═══════════════════════════════════════════════════════════════════
    // STAGE 1: ANALYSIS (Voice + Experience + Rubric) - ~35-40s
    // ═══════════════════════════════════════════════════════════════════
    if (stage === '1') {
      console.log('📊 STAGE 1: Running parallel analysis (voice + experience + rubric)...');

      // Use data from request or token
      const essayText = tokenData?.essayText || requestBody.essayText;
      const promptText = tokenData?.promptText || requestBody.promptText;

      const [voiceFingerprintResponse, experienceFingerprintResponse, rubricResponse] = await Promise.all([
        // Voice Fingerprint Analysis
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
                content: `Analyze the voice fingerprint of this essay:\n\nPrompt: ${promptText}\n\nEssay:\n${essayText}`
              }
            ]
          })
        }),
        // Experience Fingerprint (Anti-Convergence Analysis)
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
                content: `Analyze the experience fingerprint of this essay:\n\nPrompt: ${promptText}\n\nEssay:\n${essayText}`
              }
            ]
          })
        }),
        // 12-Dimension Rubric Analysis
        fetch('https://api.anthropic.com/v1/messages', {
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
                content: `Analyze this essay across all 12 dimensions:\n\nPrompt: ${promptText}\n\nEssay:\n${essayText}`
              }
            ]
          })
        })
      ]);

      // Parse Voice Fingerprint
      if (!voiceFingerprintResponse.ok) {
        const errorText = await voiceFingerprintResponse.text();
        console.error('Voice fingerprint API error:', errorText);
        throw new Error(`Voice fingerprint analysis failed: ${voiceFingerprintResponse.status}`);
      }

      const voiceFingerprintResult = await voiceFingerprintResponse.json();
      const voiceFingerprintText = voiceFingerprintResult.content[0].text;

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

      try {
        const jsonMatch = experienceFingerprintText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1].trim() : experienceFingerprintText.trim();
        experienceFingerprint = JSON.parse(jsonString);
      } catch (e) {
        console.error('Failed to parse experience fingerprint JSON:', experienceFingerprintText);
        experienceFingerprint = null;
      }

      // Parse Rubric Analysis
      if (!rubricResponse.ok) {
        const errorText = await rubricResponse.text();
        console.error('Rubric analysis API error:', errorText);
        throw new Error(`Rubric analysis failed: ${rubricResponse.status}`);
      }

      const rubricResult = await rubricResponse.json();
      const rubricText = rubricResult.content[0].text;

      try {
        const jsonMatch = rubricText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1].trim() : rubricText.trim();
        rubricAnalysis = JSON.parse(jsonString);
      } catch (e) {
        console.error('Failed to parse rubric JSON:', rubricText);
        throw new Error('Failed to parse rubric analysis');
      }

      // Apply score calibration
      function calibrateScore(rawScore: number): number {
        if (rawScore === 0) return 0;
        if (rawScore >= 9) return rawScore;
        return rawScore + 0.5;
      }

      function calibrateNQI(rawNQI: number): number {
        if (rawNQI === 0) return 0;
        if (rawNQI >= 95) return Math.round(rawNQI * 0.95 + 5);
        if (rawNQI >= 75) return Math.round(rawNQI * 1.1 - 3);
        if (rawNQI >= 50) return Math.round(rawNQI * 1.2 - 5);
        if (rawNQI >= 25) return Math.round(rawNQI * 1.3 - 8);
        return Math.round(rawNQI * 1.8 + 15);
      }

      if (rubricAnalysis.dimensions) {
        rubricAnalysis.dimensions = rubricAnalysis.dimensions.map((dim: any) => ({
          ...dim,
          raw_score: calibrateScore(dim.raw_score),
          final_score: calibrateScore(dim.final_score),
        }));
      }

      if (rubricAnalysis.narrative_quality_index) {
        const originalNQI = rubricAnalysis.narrative_quality_index;
        rubricAnalysis.narrative_quality_index = calibrateNQI(originalNQI);
        console.log(`📊 Score calibration: ${originalNQI} -> ${rubricAnalysis.narrative_quality_index}`);
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ STAGE 1 COMPLETE in ${elapsed}s`);

      // Prepare continue token for Stage 2
      const continueToken: ContinueToken = {
        essayText: requestBody.essayText,
        essayType: requestBody.essayType,
        promptText: requestBody.promptText,
        promptTitle: requestBody.promptTitle,
        anthropicApiKey,
        voiceFingerprint,
        experienceFingerprint,
        rubricAnalysis,
      };

      return new Response(
        JSON.stringify({
          stage: 1,
          status: 'complete',
          data: {
            voiceFingerprint,
            experienceFingerprint,
            rubricAnalysis,
          },
          continueToken: encodeContinueToken(continueToken),
          nextStage: 2,
          timing: elapsed,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    // STAGE 2: GENERATION (12 items in 3 batches) - ~40-50s
    // ═══════════════════════════════════════════════════════════════════
    if (stage === '2') {
      console.log('🔧 STAGE 2: Generating 12 workshop items in 3 parallel batches...');

      if (!tokenData) {
        return new Response(
          JSON.stringify({ error: 'Stage 2 requires continue token from Stage 1' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Extract data from token
      const essayText = tokenData.essayText;
      const promptText = tokenData.promptText;
      voiceFingerprint = tokenData.voiceFingerprint;
      experienceFingerprint = tokenData.experienceFingerprint;
      rubricAnalysis = tokenData.rubricAnalysis;

      const baseSystemPrompt = `You are a surgical essay editor. Identify specific issues in the essay and provide 3 types of surgical fixes:

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
      "problem": "brief problem description",
      "why_it_matters": "impact explanation",
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

      // Generate 9 items in 3 parallel batches (3 items each)
      console.log('   🔄 Generating 9 workshop items in 3 parallel batches (3 items each)...');
      const [batch1Items, batch2Items, batch3Items] = await Promise.all([
        generateWorkshopBatch(essayText, promptText, rubricAnalysis, voiceFingerprint, anthropicApiKey, baseSystemPrompt, 1),
        generateWorkshopBatch(essayText, promptText, rubricAnalysis, voiceFingerprint, anthropicApiKey, baseSystemPrompt, 2),
        generateWorkshopBatch(essayText, promptText, rubricAnalysis, voiceFingerprint, anthropicApiKey, baseSystemPrompt, 3)
      ]);

      workshopItems = [...batch1Items, ...batch2Items, ...batch3Items];
      console.log(`   ✅ Generated ${workshopItems.length} total items (${batch1Items.length} + ${batch2Items.length} + ${batch3Items.length})`);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ STAGE 2 COMPLETE in ${elapsed}s - Generated ${workshopItems.length} items`);

      // Prepare continue token for Stage 3
      const continueToken: ContinueToken = {
        ...tokenData,
        workshopItems,
      };

      return new Response(
        JSON.stringify({
          stage: 2,
          status: 'complete',
          data: {
            workshopItems: workshopItems.map(item => ({
              ...item,
              validated: false,
            })),
          },
          continueToken: encodeContinueToken(continueToken),
          nextStage: 3,
          timing: elapsed,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    // STAGE 3: VALIDATION (36 suggestions) - ~45-55s
    // ═══════════════════════════════════════════════════════════════════
    if (stage === '3') {
      console.log('🔍 STAGE 3: Validating all suggestions (85+ quality threshold)...');

      if (!tokenData) {
        return new Response(
          JSON.stringify({ error: 'Stage 3 requires continue token from Stage 2' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Extract data from token
      const essayText = tokenData.essayText;
      voiceFingerprint = tokenData.voiceFingerprint;
      workshopItems = tokenData.workshopItems || [];

      const baseSystemPrompt = `You are a quality validator for essay suggestions.`;

      // Validate all items IN PARALLEL (massive speedup!)
      console.log(`   🔄 Validating ${workshopItems.length} items in parallel...`);

      const validationPromises = workshopItems
        .filter(item => item && item.suggestions)
        .map(async (item) => {
          const validatedSuggestions = await validateWorkshopItemSuggestions(
            item,
            voiceFingerprint,
            anthropicApiKey,
            baseSystemPrompt,
            essayText,
            2 // maxAttempts
          );

          if (validatedSuggestions.length > 0) {
            return {
              ...item,
              suggestions: validatedSuggestions
            };
          }
          return null;
        });

      const validationResults = await Promise.all(validationPromises);
      const validatedItems = validationResults.filter(item => item !== null);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ STAGE 3 COMPLETE in ${elapsed}s`);

      // Assemble final result
      const finalResult = {
        success: true,
        analysis: {
          narrative_quality_index: tokenData.rubricAnalysis?.narrative_quality_index || 75,
          overall_strengths: tokenData.rubricAnalysis?.overall_strengths || [],
          overall_weaknesses: tokenData.rubricAnalysis?.overall_weaknesses || [],
        },
        voiceFingerprint: tokenData.voiceFingerprint,
        experienceFingerprint: tokenData.experienceFingerprint,
        rubricDimensionDetails: tokenData.rubricAnalysis?.dimensions || [],
        workshopItems: validatedItems,
        timing: {
          stage3: elapsed,
        },
      };

      console.log('🎉 ALL STAGES COMPLETE');
      console.log(`   - NQI: ${finalResult.analysis.narrative_quality_index}`);
      console.log(`   - Validated Items: ${finalResult.workshopItems.length}`);
      console.log(`   - Total Suggestions: ${validatedItems.reduce((sum, item) => sum + item.suggestions.length, 0)}`);

      return new Response(
        JSON.stringify(finalResult),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    // LEGACY: ALL-IN-ONE MODE (for backward compatibility)
    // ═══════════════════════════════════════════════════════════════════
    if (stage === 'all') {
      console.log('⚠️ Running in ALL-IN-ONE mode (may timeout at 150s)');
      return new Response(
        JSON.stringify({
          error: 'ALL-IN-ONE mode deprecated. Please use staged approach: ?stage=1, then ?stage=2, then ?stage=3',
          recommendation: 'Start with POST to ?stage=1',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid stage parameter. Use: 1, 2, 3' }),
      {
        status: 400,
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
