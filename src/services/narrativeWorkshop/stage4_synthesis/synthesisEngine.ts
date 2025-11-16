/**
 * Stage 4.2: Synthesis Engine (LLM-based)
 *
 * The BRAIN of the system. Aggregates all insights from Stages 1-3 and
 * generates holistic assessment, improvement roadmap, and AO perspective.
 *
 * This is the culmination - where all the detailed analyses come together
 * into actionable, prioritized, strategically sound guidance.
 *
 * Critical outputs:
 * - Overall quality score (0-100 EQI)
 * - Top strengths with rarity factors
 * - Critical gaps with fix complexity
 * - Improvement roadmap (quick wins → transformative moves)
 * - Admissions officer perspective
 * - Comparative context
 *
 * LLM Configuration:
 * - Temperature: 0.3 (strategic, analytical)
 * - Model: Sonnet 4.5
 * - Focus: Synthesis, prioritization, strategic guidance
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';
import {
  HolisticUnderstanding,
  DeepDiveAnalyses,
  GrammarStyleAnalysis,
  SynthesizedInsights,
  NarrativeEssayInput
} from '../types';
import { DimensionScores } from './dimensionScorer';

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYNTHESIS_SYSTEM_PROMPT = `You are the master synthesis engine for college essay analysis - the strategic brain that aggregates all detailed analyses into actionable guidance.

Your expertise: Synthesizing multi-layered analysis into prioritized, strategic improvement roadmaps calibrated to elite admissions standards (Harvard, Princeton, Stanford, MIT, Yale, Berkeley).

**Your Mission**: Take comprehensive analysis data and create:
1. Holistic quality assessment (0-100 EQI score)
2. Top strengths with rarity factors ("Top 10% of essays show this")
3. Critical gaps with fix complexity and impact
4. Improvement roadmap: Quick wins → Strategic moves → Transformative moves
5. Admissions officer perspective (first impression, memorability, concerns)
6. Comparative context (vs typical applicant, vs top 10%)

**Critical Principles**:

**BRUTAL HONESTY**: No sugarcoating. Calibrate to actual elite standards, not participation trophy standards.

**STRATEGIC PRIORITIZATION**: Not all improvements are equal. Focus on highest ROI:
- Quick wins: 5 min, +1-2 points (low-hanging fruit)
- Strategic moves: 20-30 min, +3-5 points (meaningful upgrades)
- Transformative moves: 45-60 min, +5-8 points (game-changers)

**SPECIFICITY**: Never say "add more details." Say "Replace 'I worked hard' (line 15) with specific action: 'I spent 47 nights, 3 AM fluorescent hum, debugging...' (+2 points to show-don't-tell)"

**RARITY MATTERS**: Strengths are impressive only if rare:
- "Top 1-3% show this" = elite advantage
- "Top 10-15% show this" = strong differentiator
- "Common across 50%+" = table stakes, not strength

**ELITE BENCHMARKS** (from 20 admitted essays):
- 85% have 2+ specific vulnerability moments
- 70% use micro→macro structure
- 65% quantify impact (3+ numbers)
- 60% use sensory openings
- 0% use generic openings ("ever since I was young")
- 0% avoid all vulnerability
- 95% have clear turning point

**ADMISSIONS OFFICER LENS**:
- First 10 seconds: Hook or skip?
- Credibility: Specific or generic?
- Memorability: Will I remember this in 2 hours?
- Red flags: Inauthentic, arrogant, clichéd?
- Competitive context: Strong enough for [school tier]?

**IMPROVEMENT ROADMAP LOGIC**:
- Quick wins: Grammar fixes, cut clichés, add 1-2 numbers
- Strategic: Strengthen vulnerability, improve opening, deepen reflection
- Transformative: Restructure arc, find micro→macro, rewrite for show-don't-tell

Your synthesis should feel like a strategic consultant's analysis: data-driven, prioritized, actionable, honest.

Return valid JSON matching the SynthesizedInsights type exactly.`;

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildSynthesisPrompt(
  essayText: string,
  essayType: string,
  stage1: HolisticUnderstanding,
  stage2: DeepDiveAnalyses,
  stage3: GrammarStyleAnalysis,
  dimensionScores: DimensionScores
): string {
  // Calculate aggregate stats for context
  const wordCount = essayText.split(/\s+/).length;
  const vulnCount = stage2.climaxTurningPoint.vulnerabilityMoments?.length || 0;
  const numberCount = stage3.grammarAnalysis.wordChoice.totalWords; // Simplified
  const clicheCount = stage2.conclusionReflection.clichesDetected?.length || 0;

  // Prepare dimension scores summary
  const dimScores = Object.entries(dimensionScores)
    .map(([key, value]) => `${key}: ${value.toFixed(1)}/10`)
    .join('\n  ');

  return `Synthesize all analysis data into holistic assessment and strategic improvement roadmap.

**ESSAY CONTEXT**:
- Type: ${essayType}
- Word count: ${wordCount}
- Overall structure: ${stage1.essayStructure}
- Primary voice: ${stage1.primaryVoice}

**DIMENSION SCORES** (essay-type-weighted):
  ${dimScores}

**STAGE 1 HIGHLIGHTS** (Holistic Understanding):
- Central theme: ${stage1.centralTheme}
- Estimated strength tier: ${stage1.estimatedStrengthTier}
- Overall coherence: ${stage1.overallCoherence}/10
- Authenticity signals: ${stage1.authenticitySignals.length}
- Red flags: ${stage1.redFlags.length}
- First impression: "${stage1.firstImpression}"

**STAGE 2 HIGHLIGHTS** (Deep Dive):
Opening:
- Hook type: ${stage2.opening.hookType}, strength: ${stage2.opening.hookStrength}/10
- Reader engagement: ${stage2.opening.readerEngagement}/10
- Sensory details: ${stage2.opening.sensoryDetails.length}

Body:
- Specificity: ${stage2.bodyDevelopment.specificityLevel}/10
- Quantification: ${stage2.bodyDevelopment.quantificationPresence}/10
- Show vs tell: ${stage2.bodyDevelopment.showVsTell.balance}
- Pacing: ${stage2.bodyDevelopment.pacingRating}/10

Climax/Turning Point:
- Has turning point: ${stage2.climaxTurningPoint.hasTurningPoint}
- Vulnerability moments: ${vulnCount} (elite benchmark: 2+)
- Conflict type: ${stage2.climaxTurningPoint.conflictType}
- Stakes clarity: ${stage2.climaxTurningPoint.stakesClarity}/10

Conclusion:
- Reflection depth: ${stage2.conclusionReflection.reflectionDepth}/10
- Reflection type: ${stage2.conclusionReflection.reflectionType}
- Micro→macro present: ${stage2.conclusionReflection.microToMacro.present} (elite benchmark: 70% have this)
- Philosophical depth: ${stage2.conclusionReflection.philosophicalDepth}/10
- Clichés detected: ${clicheCount}

Character:
- Interiority depth: ${stage2.characterDevelopment.interiorityDepth}/10
- Voice authenticity: ${stage2.characterDevelopment.voiceAuthenticity}/10
- Agency level: ${stage2.characterDevelopment.agencyLevel}/10
- Emotion description: ${stage2.characterDevelopment.emotionDescriptionType}

Stakes/Tension:
- Tension level: ${stage2.stakesTension.tensionLevel}/10
- Reader investment: ${stage2.stakesTension.readerInvestment}/10
- Conflict type: ${stage2.stakesTension.conflictType}

**STAGE 3 HIGHLIGHTS** (Grammar & Style):
Grammar:
- Sentence variety: ${stage3.grammarAnalysis.sentenceMetrics.varietyScore}/10
- Passive voice: ${stage3.grammarAnalysis.verbAnalysis.passivePercentage.toFixed(1)}% (elite: <15%)
- Lexical diversity: ${stage3.grammarAnalysis.wordChoice.lexicalDiversity.toFixed(3)} (elite: 0.55-0.65)
- Cliché phrases: ${stage3.grammarAnalysis.wordChoice.clicheCount}
- Red flags: ${stage3.grammarAnalysis.redFlags.length}
- Green flags: ${stage3.grammarAnalysis.greenFlags.length}

Style:
- Formality: ${stage3.styleAnalysis.formalityLevel}/10
- Energy: ${stage3.styleAnalysis.energyLevel}/10
- Warmth: ${stage3.styleAnalysis.warmth}/10
- Confidence: ${stage3.styleAnalysis.confidence}/10
- Imagery strength: ${stage3.styleAnalysis.imageryStrength}/10
- Originality: ${stage3.styleAnalysis.originalityScore}/10
- Voice distinctiveness: ${stage3.styleAnalysis.voiceDistinctiveness}

---

Provide your synthesis as valid JSON with these EXACT fields:

{
  "overallQualityScore": number (0-100, EQI scale),
  "impressionLabel": "exceptional" | "compelling" | "competent" | "developing" | "weak",
  "oneLineSummary": "string - single sentence capturing essence",

  "dimensionScores": {
    "openingPower": number,
    "narrativeArc": number,
    "characterInteriority": number,
    "showDontTell": number,
    "reflectionMeaningMaking": number,
    "dialogueAction": number,
    "originalityVoice": number,
    "structurePacing": number,
    "sentenceCraft": number,
    "contextConstraints": number,
    "schoolFit": number,
    "ethicalHumility": number
  },

  "topStrengths": [
    {
      "strength": "string - what's strong",
      "evidence": ["array of specific quotes/examples"],
      "rarityFactor": "string - 'Top 1-3%' or 'Top 10-15%' or 'Top 25-30%'",
      "whyItMatters": "string - why AOs care"
    }
  ],

  "criticalGaps": [
    {
      "gap": "string - what's missing/weak",
      "impact": "string - how it hurts essay",
      "evidence": ["array of specific examples"],
      "fixComplexity": "easy" | "moderate" | "challenging"
    }
  ],

  "opportunities": [
    {
      "opportunity": "string - what could be elevated",
      "currentState": "string - how it is now",
      "potentialState": "string - what it could become",
      "captureStrategy": "string - how to capture it",
      "estimatedImpact": number (points, e.g., 3)
    }
  ],

  "officerPerspective": {
    "firstImpression": "string - gut reaction in first 30 seconds",
    "credibilityAssessment": "string - specific vs generic? trustworthy?",
    "memorabilityFactor": number (0-10),
    "emotionalImpact": number (0-10),
    "intellectualImpact": number (0-10),
    "concernsFlags": ["array of concerns AO might have"],
    "positiveSignals": ["array of green lights"]
  },

  "comparativeContext": {
    "vsTypicalApplicant": "string - how this compares to average essay",
    "vsTop10Percent": "string - how this compares to strong essays",
    "competitiveAdvantages": ["array of edges over peers"],
    "competitiveWeaknesses": ["array of vulnerabilities vs peers"],
    "percentileEstimate": "string - 'Top 1-5%' or 'Top 10-20%' or 'Top 25-40%' or 'Top 50-70%'"
  },

  "improvementRoadmap": {
    "quickWins": [
      {
        "action": "string - specific action to take",
        "timeEstimate": "string - e.g., '5 min'",
        "impactEstimate": "string - e.g., '+1-2 points'",
        "difficulty": "easy"
      }
    ],
    "strategicMoves": [
      {
        "action": "string - specific action",
        "timeEstimate": "string - e.g., '20-30 min'",
        "impactEstimate": "string - e.g., '+3-5 points'",
        "difficulty": "moderate"
      }
    ],
    "transformativeMoves": [
      {
        "action": "string - specific action",
        "timeEstimate": "string - e.g., '45-60 min'",
        "impactEstimate": "string - e.g., '+5-8 points'",
        "difficulty": "challenging"
      }
    ],
    "aspirationalTarget": "string - what this essay could become with full implementation"
  },

  "keyInsights": ["array of 5-7 top-level insights - most important takeaways"],

  "tokensUsed": number (estimated)
}

**CRITICAL INSTRUCTIONS**:

1. **Overall Score Calibration** (0-100 EQI):
   - 90-100: Exceptional (Top 1-3%, arresting, deeply human, elite admit quality)
   - 80-89: Compelling (Top 10-15%, clear voice, strong narrative)
   - 70-79: Competent (Top 25-40%, functional, needs texture)
   - 60-69: Developing (Top 50-70%, shows potential but significant gaps)
   - <60: Weak (generic, template-like, major issues)

   Calculate by averaging dimension scores and adjusting for critical patterns:
   - 2+ vulnerability moments = potential for 85+
   - Micro→macro structure = +5-8 points
   - Generic opening = cap at 75
   - No vulnerability = cap at 70
   - 2+ clichés = -5-10 points

2. **Top Strengths** (3-5 maximum):
   - Only include if genuinely strong (dimension score ≥7)
   - Provide rarity factor based on elite benchmarks
   - Explain why it matters to admissions

3. **Critical Gaps** (3-5 maximum):
   - Focus on highest-impact gaps
   - Prioritize: vulnerability → specificity → reflection → opening
   - Classify fix complexity honestly

4. **Improvement Roadmap**:
   - Quick wins (2-3): Grammar, cut clichés, add 1-2 numbers
   - Strategic moves (2-4): Strengthen key moments, deepen reflection
   - Transformative moves (1-2): Restructure, find micro→macro, major rewrites
   - Be SPECIFIC: "Replace line X with Y" not "add more details"

5. **AO Perspective**:
   - Think like exhausted AO reading 50th essay today
   - First impression in 30 seconds: Keep reading or skim?
   - Memorability: Will they remember this in 2 hours?
   - Red flags that hurt credibility

6. **Comparative Context**:
   - Use elite benchmarks (20 essays analyzed)
   - Percentile honest: Most essays are 50-70%, few are top 10%
   - Competitive context matters: edges and vulnerabilities

Return ONLY valid JSON, no markdown, no explanation.`;
}

// ============================================================================
// SYNTHESIS FUNCTION
// ============================================================================

/**
 * Generate holistic synthesis and improvement roadmap
 */
export async function synthesizeInsights(
  input: NarrativeEssayInput,
  essayType: string,
  stage1: HolisticUnderstanding,
  stage2: DeepDiveAnalyses,
  stage3: GrammarStyleAnalysis,
  dimensionScores: DimensionScores
): Promise<SynthesizedInsights> {
  console.log('  → Synthesizing holistic insights and roadmap (LLM)');
  const startTime = Date.now();

  try {
    const prompt = buildSynthesisPrompt(
      input.essayText,
      essayType,
      stage1,
      stage2,
      stage3,
      dimensionScores
    );

    const response = await callClaudeWithRetry(
      prompt,
      {
        systemPrompt: SYNTHESIS_SYSTEM_PROMPT,
        temperature: 0.3,
        useJsonMode: true,
        maxTokens: 4000,
      }
    );

    let synthesis: SynthesizedInsights;

    if (typeof response.content === 'string') {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in synthesis response');
      synthesis = JSON.parse(jsonMatch[0]);
    } else {
      synthesis = response.content as SynthesizedInsights;
    }

    synthesis.tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
    synthesis.synthesizedAt = new Date().toISOString();

    const duration = Date.now() - startTime;
    console.log(`     ✓ Synthesis complete (${duration}ms, ${synthesis.tokensUsed} tokens)`);
    console.log(`       Overall Score: ${synthesis.overallQualityScore}/100 (${synthesis.impressionLabel})`);
    console.log(`       Top Strengths: ${synthesis.topStrengths.length}`);
    console.log(`       Critical Gaps: ${synthesis.criticalGaps.length}`);
    console.log(`       Quick Wins: ${synthesis.improvementRoadmap.quickWins.length}`);
    console.log(`       Strategic Moves: ${synthesis.improvementRoadmap.strategicMoves.length}`);
    console.log(`       Transformative Moves: ${synthesis.improvementRoadmap.transformativeMoves.length}`);
    console.log(`       Percentile: ${synthesis.comparativeContext.percentileEstimate}`);

    return synthesis;

  } catch (error) {
    console.error('     ✗ Synthesis failed:', error);
    throw error;
  }
}

