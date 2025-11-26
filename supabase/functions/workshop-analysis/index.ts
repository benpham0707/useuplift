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

    // Stage 1: Voice Fingerprint Analysis
    const voiceFingerprintResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
    });

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

    console.log('✅ Voice fingerprint complete');

    // Stage 2: Experience Fingerprint (Anti-Convergence Analysis)
    const experienceFingerprintResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
    });

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

    console.log('✅ Experience fingerprint complete');

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

    // Stage 4: Surgical Workshop Items (Issues & Suggestions) - PHASE 17 WITH EXPERIENCE FINGERPRINTING
    const workshopResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
        system: `You are a Narrative Editor helping a student sound MORE LIKE THEMSELVES while BREAKING BEYOND typical essay patterns.

**YOUR CORE MISSION:**
The student's essay should read like THEY wrote it - their authentic voice processing their own experience.
Every suggestion should sound like something THIS SPECIFIC PERSON would write, not generic "good writing."

**THE AUTHENTICITY TEST:**
Before writing anything, ask: "Could this have ONLY been written by this person?"
- If yes → you've captured their voice
- If anyone could have written it → try again with more specificity to their experience

**ANTI-CONVERGENCE MANDATE:**
AI writing naturally drifts toward:
- The same narrative arc (setup → struggle → triumph → lesson)
- "Safe" phrasings that feel polished but generic
- Crowd-pleasing insights that lack edge
- Manufactured emotional beats
- Generic college essay language ("passion", "journey", "grew as a person")

You MUST actively RESIST these patterns. When in doubt, choose the more surprising, more specific, more uncomfortable option.

**WRITING QUALITY REQUIREMENTS:**
Each suggestion should be 300-500 characters and include:
- CONCRETE DETAILS: Specific ages, objects, actions, sensory details (NOT abstract concepts)
- FULL TRANSFORMATIONS: Show the complete before/after, not just hints
- SPECIFIC EXAMPLES: "Jordan 1 Retro High - $180" not "sneakers"
- ACTIVE SCENES: What they DID, not what they thought or felt abstractly
- MICRO-STAKES: Small, specific consequences that reveal character

**WHAT TO AVOID:**
- Writing that sounds impressive but could be anyone's
- Insights that are generic life lessons rather than specific realizations
- Language that sounds like an AI or essay guide ("tapestry", "testament", "delve", "showcase", "underscore")
- "Performed" vulnerability (struggle mentioned just to show triumph)
- Abstract emotions without concrete anchoring ("I felt passionate" → show the passion through action)

**YOUR MANDATE:**
1. Read the Experience Fingerprint carefully - these are IRREPLACEABLE elements of their story
2. Generate 3 options that sound like THIS PERSON wrote them, incorporating fingerprint elements
3. Each suggestion should be 300-500 characters with full concrete examples
4. Rationales should explain the specific writing principle being applied
5. Show HOW each suggestion connects to their unique experience

**OUTPUT FORMAT:**
Return ONLY valid JSON with this structure:
{
  "workshopItems": [
    {
      "id": "unique_id",
      "quote": "exact text from essay",
      "problem": "brief problem description (what's generic or weak)",
      "why_it_matters": "impact explanation (why this hurts their essay)",
      "severity": "critical" | "high" | "medium" | "low",
      "rubric_category": "dimension_name",
      "suggestions": [
        {
          "type": "polished_original",
          "text": "revised text (300-500 chars with concrete details, full transformation)",
          "rationale": "why this works (specific writing principle explained)",
          "fingerprint_connection": "how this incorporates their unique experience elements"
        },
        {
          "type": "voice_amplifier",
          "text": "revised text (300-500 chars, amplifies their natural voice patterns)",
          "rationale": "why this works (voice-specific explanation)",
          "fingerprint_connection": "connection to their unique elements"
        },
        {
          "type": "divergent_strategy",
          "text": "revised text (300-500 chars, bold alternative angle)",
          "rationale": "why this works (strategy explanation)",
          "fingerprint_connection": "connection to their unique elements"
        }
      ]
    }
  ]
}

**CRITICAL REMINDERS:**
- Each "text" field should be 300-500 characters minimum
- Include specific details: ages, times, objects, sensory details
- Show full scenes with concrete actions, not summaries
- Make it sound like THIS student, not a generic "good writer"
- Every suggestion MUST use elements from the Experience Fingerprint`,
        messages: [
          {
            role: 'user',
            content: `Identify surgical fixes for this essay that make it sound MORE like this specific student wrote it.

**ESSAY PROMPT:**
${requestBody.promptText}

**ESSAY TEXT:**
${requestBody.essayText}

**EXPERIENCE FINGERPRINT (CRITICAL - Use these irreplaceable elements):**
${JSON.stringify(experienceFingerprint, null, 2)}

**RUBRIC ANALYSIS (Weaknesses to address):**
${JSON.stringify(rubricAnalysis, null, 2)}

**INSTRUCTIONS:**
Generate 5 surgical fixes that:
1. Address the weakest rubric dimensions
2. Incorporate elements from the Experience Fingerprint
3. Make suggestions 300-500 characters with concrete details
4. Sound like THIS student, not a generic essay
5. Include specific ages, objects, actions, sensory anchors

Focus on the most impactful improvements first. Each suggestion should be a FULL transformation showing exactly how to rewrite the text with concrete examples.`
          }
        ]
      })
    });

    if (!workshopResponse.ok) {
      const errorText = await workshopResponse.text();
      console.error('Workshop items API error:', errorText);
      throw new Error(`Workshop items generation failed: ${workshopResponse.status}`);
    }

    const workshopResult = await workshopResponse.json();
    const workshopText = workshopResult.content[0].text;

    let workshopData;
    try {
      const jsonMatch = workshopText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : workshopText.trim();
      workshopData = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse workshop JSON:', workshopText);
      workshopData = { workshopItems: [] };
    }

    console.log('✅ Workshop items complete');

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
