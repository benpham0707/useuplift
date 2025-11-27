/**
 * Strategic Constraints Edge Function
 *
 * Analyzes workshop suggestions for:
 * 1. Word efficiency (bloat detection, compression opportunities)
 * 2. Strategic balance (imagery vs depth vs achievements vs insights)
 * 3. Topic viability (substantiveness, academic potential)
 *
 * Provides enhanced metadata for each workshop item without modifying core analysis.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface WorkshopItem {
  section: string;
  issue: string;
  severity: string;
  rationale: string;
  suggestions: {
    polished_original: { text: string; why: string };
    voice_amplifier: { text: string; why: string };
    divergent_strategy: { text: string; why: string };
  };
}

interface StrategicAnalysisRequest {
  essayText: string;
  currentWordCount: number;
  targetWordCount: number;
  promptText: string;
  promptTitle: string;
  workshopItems: WorkshopItem[];
  rubricDimensionDetails: any[];
  voiceFingerprint: any;
  experienceFingerprint: any;
  analysis: {
    narrative_quality_index: number;
    overall_strengths: string[];
    overall_weaknesses: string[];
  };
}

interface StrategicAnalysisResult {
  success: boolean;
  wordCountAnalysis: {
    current: number;
    target: number;
    available_budget: number;
    efficiency_score: number;
    bloat_areas: Array<{
      section: string;
      word_count: number;
      potential_savings: number;
      why_bloated: string;
    }>;
    compression_opportunities: Array<{
      technique: string;
      where: string;
      estimated_savings: number;
      example: string;
    }>;
  };
  strategicBalance: {
    imagery_density: number;
    intellectual_depth: number;
    achievement_presence: number;
    insight_quality: number;
    recommendation: string;
    imbalance_severity: string;
    detailed_assessment: string;
  };
  topicViability: {
    substantiveness_score: number;
    academic_potential_score: number;
    differentiation_score: number;
    verdict: string;
    concerns: string[];
    strengths: string[];
    alternative_angles: Array<{
      suggestion: string;
      why_better: string;
      example: string;
    }>;
  };
  enhancedWorkshopItems: Array<{
    original_item_id: string;
    efficiency_assessment: {
      word_delta: number;
      efficiency_rating: string;
      implementable_with_budget: boolean;
      alternative_if_too_long?: string;
    };
    strategic_value: {
      adds_depth: boolean;
      adds_achievements: boolean;
      reduces_fluff: boolean;
      priority_adjustment: number;
      strategic_note: string;
    };
  }>;
  strategicRecommendations: Array<{
    type: string;
    priority: string;
    title: string;
    description: string;
    where_to_apply: string;
    why_matters: string;
    estimated_word_impact: number;
    example_implementation?: string;
  }>;
}

const STRATEGIC_ANALYZER_PROMPT = `You are a strategic college admissions essay consultant specializing in UC Personal Insight Question (PIQ) optimization.

CONTEXT:
- Word Limit: 350 words (STRICT - cannot exceed)
- Genre: UC Personal Insight Questions
- Purpose: Demonstrate academic potential, achievements, intellectual depth, and personal qualities
- Audience: UC admissions officers reading 80+ essays per day

CRITICAL UNDERSTANDING:
UC PIQs are NOT creative writing exercises. They are strategic demonstrations of:
1. Academic capability and intellectual curiosity
2. Concrete achievements and measurable impact
3. Personal qualities relevant to college success
4. Unique perspectives and experiences

═══════════════════════════════════════════════════════════════
1. WORD EFFICIENCY ANALYSIS
═══════════════════════════════════════════════════════════════

Analyze how efficiently the essay uses its 350-word budget:

A) Identify BLOAT (words not earning their space):
   - Flowery adjectives that don't add meaning ("truly magnificent", "absolutely incredible")
   - Redundant phrases ("I learned and discovered", "thought and considered")
   - Excessive transitions ("Furthermore, moreover, additionally")
   - Over-description of mundane details
   - Vague generalities that could be cut ("I really enjoyed this experience")
   - Phrases that state the obvious

B) Calculate WORD BUDGET for implementing suggestions:
   - Current word count vs 350-word limit
   - For EACH workshop item suggestion, estimate net word delta (+/- words)
   - Flag items that would push essay over limit
   - Prioritize compression suggestions when budget is tight

C) Identify COMPRESSION OPPORTUNITIES:
   - Where to condense imagery while keeping essence
   - Where to combine redundant sentences
   - Where to use stronger verbs instead of adjective-heavy phrases
   - Where to cut transitions and let ideas flow naturally

CRITICAL RULE: If essay is 300+ words, prioritize COMPRESSION over expansion suggestions.

EFFICIENCY SCORING (0-10):
- 0-3: Severe bloat, needs aggressive trimming
- 4-6: Moderate inefficiency, could be tightened
- 7-8: Good efficiency, minor improvements possible
- 9-10: Excellent efficiency, every word earns its place

═══════════════════════════════════════════════════════════════
2. STRATEGIC BALANCE ASSESSMENT
═══════════════════════════════════════════════════════════════

Evaluate balance across 4 dimensions (each scored 0-10):

A) IMAGERY DENSITY (sensory details, descriptions, scene-setting):
   - 0-3: Too sparse, essay feels abstract
   - 4-6: Balanced, imagery used strategically
   - 7-10: Too heavy, over-description crowding out substance

B) INTELLECTUAL DEPTH (analysis, insights, abstract thinking):
   - 0-3: Too shallow, lacks reflection
   - 4-6: Adequate depth for PIQ format
   - 7-10: Sophisticated analysis, demonstrates academic readiness

C) ACHIEVEMENT PRESENCE (accomplishments, impact, measurable results):
   - 0-3: Missing or vague achievements
   - 4-6: Achievements mentioned but could be stronger
   - 7-10: Concrete achievements well-integrated

D) INSIGHT QUALITY (lessons learned, growth, self-awareness):
   - 0-3: Generic or missing insights
   - 4-6: Solid insights, genuine reflection
   - 7-10: Profound insights, exceptional self-awareness

BALANCE RECOMMENDATIONS:
- "increase_depth": Essay too descriptive, needs more analysis
- "increase_achievements": Essay lacks concrete accomplishments
- "reduce_imagery": Too much description, cut to make room for substance
- "balanced": Good strategic balance across all dimensions

IMBALANCE SEVERITY:
- "critical": Major imbalance hurting essay effectiveness (e.g., 9/10 imagery, 2/10 achievements)
- "moderate": Noticeable imbalance, should address (e.g., 8/10 imagery, 4/10 depth)
- "minor": Slight imbalance, optional to address
- "none": Well-balanced essay

═══════════════════════════════════════════════════════════════
3. TOPIC VIABILITY EVALUATION
═══════════════════════════════════════════════════════════════

Assess whether the essay topic is substantive enough to showcase academic potential.

A) SUBSTANTIVENESS SCORE (0-10):
   - Does this topic have enough depth to explore meaningfully?
   - Is it too trivial or shallow for a college application?
   - Can it demonstrate qualities UC admissions wants to see?

   Examples:
   - 2/10: "I like playing video games because they're fun"
   - 5/10: "I helped organize a school dance"
   - 8/10: "I founded a tutoring program that helped 50+ students"
   - 10/10: "I conducted independent research on water quality in my community"

B) ACADEMIC POTENTIAL SCORE (0-10):
   - Does this topic position the student as intellectually curious?
   - Does it demonstrate initiative, leadership, or problem-solving?
   - Would admissions officers see college readiness?

C) DIFFERENTIATION SCORE (0-10):
   - Is this topic common or unique?
   - Does it reveal something distinctive about the student?
   - Will it stand out in a stack of 100+ essays?

VERDICT:
- "strong": Excellent topic, proceed with current direction (7+ on all metrics)
- "adequate": Workable topic, could be elevated with better execution (5-6 average)
- "weak": Topic has limitations, consider reframing (3-4 average)
- "reconsider": Topic too shallow, suggest alternative angles (0-2 average)

CONCERNS: List specific weaknesses of current topic
STRENGTHS: List what's working about current topic
ALTERNATIVE ANGLES: If topic is weak, suggest 2-3 better angles the student could take

═══════════════════════════════════════════════════════════════
4. WORKSHOP ITEM ENHANCEMENT
═══════════════════════════════════════════════════════════════

For EACH of the 12 workshop items provided, analyze:

A) EFFICIENCY ASSESSMENT:
   - Estimate word delta for each of 3 suggestions (polished_original, voice_amplifier, divergent_strategy)
   - Use negative numbers for compression, positive for expansion
   - Flag if suggestion is implementable within word budget
   - If too long, provide brief alternative that compresses instead

B) STRATEGIC VALUE:
   - Does this suggestion add intellectual depth? (boolean)
   - Does this suggestion add achievements/impact? (boolean)
   - Does this suggestion reduce fluff/bloat? (boolean)
   - Priority adjustment: -2 to +2 (how to re-rank based on strategic needs)
   - Strategic note: 1-2 sentence explanation of why this item matters strategically

═══════════════════════════════════════════════════════════════
5. STRATEGIC RECOMMENDATIONS
═══════════════════════════════════════════════════════════════

Generate 3-6 high-level strategic recommendations:

TYPES:
- "compression": Where/how to cut words efficiently
- "depth_over_imagery": Where to trade description for analysis
- "add_achievements": Where to integrate accomplishments
- "topic_reframe": How to reframe topic for better positioning

PRIORITY: critical > high > medium > low

Each recommendation must include:
- Clear title (action-oriented)
- Detailed description (what to do)
- Where to apply (specific essay sections)
- Why it matters (impact on admissions appeal)
- Estimated word impact (negative = saves words, positive = adds words)
- Example implementation (concrete before/after if helpful)

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

Return ONLY valid JSON matching this structure:

{
  "wordCountAnalysis": {
    "current": <number>,
    "target": 350,
    "available_budget": <number>,
    "efficiency_score": <0-10>,
    "bloat_areas": [
      {
        "section": "string (paragraph identifier)",
        "word_count": <number>,
        "potential_savings": <number>,
        "why_bloated": "string (specific explanation)"
      }
    ],
    "compression_opportunities": [
      {
        "technique": "remove_redundancy | condense_imagery | tighten_transitions | stronger_verbs | cut_obvious",
        "where": "string (location in essay)",
        "estimated_savings": <number>,
        "example": "string (before → after)"
      }
    ]
  },
  "strategicBalance": {
    "imagery_density": <0-10>,
    "intellectual_depth": <0-10>,
    "achievement_presence": <0-10>,
    "insight_quality": <0-10>,
    "recommendation": "increase_depth | increase_achievements | reduce_imagery | balanced",
    "imbalance_severity": "critical | moderate | minor | none",
    "detailed_assessment": "string (2-3 sentences explaining the balance assessment)"
  },
  "topicViability": {
    "substantiveness_score": <0-10>,
    "academic_potential_score": <0-10>,
    "differentiation_score": <0-10>,
    "verdict": "strong | adequate | weak | reconsider",
    "concerns": ["string"],
    "strengths": ["string"],
    "alternative_angles": [
      {
        "suggestion": "string",
        "why_better": "string",
        "example": "string (how to open the essay)"
      }
    ]
  },
  "enhancedWorkshopItems": [
    {
      "original_item_id": "string (use section + issue from workshop item)",
      "efficiency_assessment": {
        "word_delta": <number (estimate for longest suggestion)>,
        "efficiency_rating": "expands | neutral | compresses",
        "implementable_with_budget": <boolean>,
        "alternative_if_too_long": "string (optional compression alternative)"
      },
      "strategic_value": {
        "adds_depth": <boolean>,
        "adds_achievements": <boolean>,
        "reduces_fluff": <boolean>,
        "priority_adjustment": <-2 to +2>,
        "strategic_note": "string"
      }
    }
  ],
  "strategicRecommendations": [
    {
      "type": "compression | depth_over_imagery | add_achievements | topic_reframe",
      "priority": "critical | high | medium | low",
      "title": "string",
      "description": "string",
      "where_to_apply": "string",
      "why_matters": "string",
      "estimated_word_impact": <number>,
      "example_implementation": "string (optional)"
    }
  ]
}

═══════════════════════════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════════════════════════

1. UC PIQs are demonstrations of FIT and POTENTIAL, not creative writing
2. Every word must earn its place - no flowery filler allowed
3. Achievements > Descriptions when word budget is tight
4. Intellectual insights > Sensory details for academic positioning
5. Topic must be substantive enough to showcase meaningful capabilities
6. When essay is 300+ words, PRIORITIZE compression over expansion
7. Balance imagery, depth, achievements, and insights strategically
8. Catch shallow topics before student submits
9. Be ruthlessly honest about topic viability
10. Provide actionable, specific guidance with examples

Remember: The goal is to help students write essays that get them ADMITTED, not just essays that sound pretty.`;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const requestBody: StrategicAnalysisRequest = await req.json();

    console.log('🎯 Strategic Constraints Analysis Request:', {
      essayLength: requestBody.essayText?.length,
      currentWordCount: requestBody.currentWordCount,
      targetWordCount: requestBody.targetWordCount,
      workshopItems: requestBody.workshopItems?.length,
      nqi: requestBody.analysis?.narrative_quality_index,
    });

    // Validate required fields
    if (!requestBody.essayText || !requestBody.promptText) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: essayText and promptText are required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Workshop items are optional - if none provided, analysis focuses on topic viability and balance
    const hasWorkshopItems = requestBody.workshopItems && requestBody.workshopItems.length > 0;

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      console.error('❌ ANTHROPIC_API_KEY not configured');
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Prepare context for Claude
    const analysisContext = {
      essay: {
        text: requestBody.essayText,
        currentWordCount: requestBody.currentWordCount,
        targetWordCount: requestBody.targetWordCount || 350,
      },
      prompt: {
        text: requestBody.promptText,
        title: requestBody.promptTitle,
      },
      currentAnalysis: {
        nqi: requestBody.analysis?.narrative_quality_index,
        strengths: requestBody.analysis?.overall_strengths,
        weaknesses: requestBody.analysis?.overall_weaknesses,
      },
      workshopItems: requestBody.workshopItems.map((item, idx) => ({
        id: `${item.section}_${idx}`,
        section: item.section,
        issue: item.issue,
        severity: item.severity,
        rationale: item.rationale,
        suggestions: item.suggestions,
      })),
      rubricScores: requestBody.rubricDimensionDetails?.map(d => ({
        dimension: d.dimension,
        score: d.score,
      })),
      voiceFingerprint: {
        patterns: requestBody.voiceFingerprint?.patterns,
        strengths: requestBody.voiceFingerprint?.strengths,
      },
      experienceFingerprint: {
        uniqueness_score: requestBody.experienceFingerprint?.uniqueness_score,
        convergence_risks: requestBody.experienceFingerprint?.convergence_risks,
      },
    };

    console.log('📤 Calling Claude Sonnet 4 for strategic analysis...');
    const claudeStartTime = Date.now();

    // Call Claude Sonnet 4 with comprehensive strategic analysis prompt
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
        temperature: 0.7,
        system: STRATEGIC_ANALYZER_PROMPT,
        messages: [{
          role: 'user',
          content: `Analyze this UC PIQ essay for strategic constraints and provide comprehensive guidance:\n\n${JSON.stringify(analysisContext, null, 2)}`
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const claudeResponse = await response.json();
    const claudeDuration = ((Date.now() - claudeStartTime) / 1000).toFixed(1);
    console.log(`✅ Claude response received in ${claudeDuration}s`);

    // Extract JSON from Claude's response
    let strategicAnalysis: StrategicAnalysisResult;
    try {
      const content = claudeResponse.content[0].text;

      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                       content.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, content];

      const jsonText = jsonMatch[1] || content;
      const parsedAnalysis = JSON.parse(jsonText.trim());

      strategicAnalysis = {
        success: true,
        ...parsedAnalysis
      };

      console.log('✅ Strategic analysis parsed successfully:', {
        efficiency_score: strategicAnalysis.wordCountAnalysis?.efficiency_score,
        balance_recommendation: strategicAnalysis.strategicBalance?.recommendation,
        topic_verdict: strategicAnalysis.topicViability?.verdict,
        enhanced_items: strategicAnalysis.enhancedWorkshopItems?.length,
        strategic_recommendations: strategicAnalysis.strategicRecommendations?.length,
      });

    } catch (parseError) {
      console.error('❌ Failed to parse Claude response:', parseError);
      console.error('Raw content:', claudeResponse.content[0].text.substring(0, 500));

      // Return graceful fallback
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to parse strategic analysis',
          raw_response: claudeResponse.content[0].text.substring(0, 1000),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`🎯 Strategic constraints analysis completed in ${totalDuration}s`);

    return new Response(
      JSON.stringify(strategicAnalysis),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const errorDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`❌ Strategic constraints error after ${errorDuration}s:`, error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: errorDuration,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
