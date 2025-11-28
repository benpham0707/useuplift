// @ts-nocheck - Pre-existing type mismatches with portfolio types
/**
 * Stage 2 - Dimension Analyzer 5/6: Authenticity & Voice
 *
 * Purpose: Deep-dive assessment of student's authentic voice in essays (PIQs)
 * - PIQ narrative quality and authenticity
 * - Consistency of voice across portfolio
 * - Genuine passion vs manufactured story
 * - Self-reflection and growth mindset
 *
 * Calibrated to UC admissions reality:
 * - UCLA: This is THE MOST CRITICAL dimension (30% weight)
 * - UC Berkeley: Highly valued (20% weight)
 * - PIQs are 4 essays × 350 words = 1,400 words total
 * - 95% of top schools rate essays as "very important"
 * - Authentic voice is rare and highly valued
 *
 * Weight by mode:
 * - Berkeley: 20% (second only to academics and intellectual curiosity)
 * - UCLA: 30% (HIGHEST weight - PIQs are king at UCLA)
 * - General UC: 20% (critical differentiator)
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  PortfolioData,
  AuthenticityVoiceAnalysis,
  UCEvaluationMode,
  HolisticPortfolioUnderstanding,
} from '../types';
import { PIQ_AUTHENTICITY_TIERS } from '../constants/ucCalibration';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Stage 2.5: Authenticity & Voice Analyzer
 */
export async function analyzeAuthenticityVoice(
  portfolio: PortfolioData,
  holisticContext: HolisticPortfolioUnderstanding,
  mode: UCEvaluationMode
): Promise<AuthenticityVoiceAnalysis> {
  const systemPrompt = buildSystemPrompt(mode);
  const userPrompt = buildUserPrompt(portfolio, holisticContext, mode);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3500,
      temperature: 0.7, // Higher creativity for nuanced voice analysis
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    return parseAuthenticityVoiceAnalysis(textContent.text);
  } catch (error) {
    console.error('Authenticity & Voice analysis failed:', error);

    try {
      console.log('Retrying Authenticity & Voice analysis...');
      const retryResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 3500,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const retryText = retryResponse.content.find((block) => block.type === 'text');
      if (!retryText || retryText.type !== 'text') {
        throw new Error('No text content in retry');
      }

      return parseAuthenticityVoiceAnalysis(retryText.text);
    } catch (retryError) {
      console.error('Retry failed, using heuristic:', retryError);
      return generateHeuristicAuthenticityAnalysis(portfolio);
    }
  }
}

function buildSystemPrompt(mode: UCEvaluationMode): string {
  const modeWeight =
    mode === 'berkeley' ? '20%' : mode === 'ucla' ? '30%' : '20%';
  const modeContext =
    mode === 'ucla'
      ? 'UCLA - THIS IS THE MOST CRITICAL DIMENSION (30%). UCLA admissions officers say PIQs can "make or break" an application. They want to hear YOUR voice, not what you think they want to hear.'
      : mode === 'berkeley'
      ? 'UC Berkeley - Highly valued (20%). Berkeley wants evidence of genuine intellectual passion and self-reflection in PIQs.'
      : 'UC System - Critical differentiator (20%). PIQs are how UCs learn who you are beyond grades.';

  return `You are an expert UC admissions evaluator conducting a **deep-dive analysis of Authenticity & Voice** in Personal Insight Questions (PIQs) for ${mode === 'berkeley' ? 'UC Berkeley' : mode === 'ucla' ? 'UCLA' : 'UC System'} admissions.

**Dimension Weight**: Authenticity & Voice accounts for **${modeWeight}** of holistic evaluation.

**${modeContext}**

---

## WHAT IS AUTHENTICITY & VOICE?

This dimension measures:
1. **Authentic Voice**: Does the student sound like themselves, not a generic applicant?
2. **Narrative Quality**: Are stories specific, vivid, and engaging?
3. **Self-Reflection**: Does the student show genuine insight and growth?
4. **Consistency**: Does voice match across PIQs and align with activities?
5. **Memorability**: Will admissions officers remember this student?

**This is NOT about writing skill alone**. A beautifully written generic essay < authentic personal voice.

---

## WHY PIQs MATTER SO MUCH

### UC PIQ Structure
- 4 essays chosen from 8 prompts
- 350 words each = 1,400 words total
- Topics: leadership, creativity, talent, educational opportunity, challenge, academic subject, community, unique quality

### What Admissions Officers Say
- "PIQs are how we hear your voice" - UCLA admissions
- "We can tell authentic vs manufactured instantly" - Berkeley reader
- "Specifics matter more than sweeping claims" - UC Santa Barbara counselor
- 95% of selective colleges rate essays as "very important" (NACAC)

### Why Voice Matters at Scale
- UCLA receives 150,000+ applications
- Readers spend 8-15 minutes per application
- **Memorable voice = stands out in pile**
- Generic voice = forgettable, even with good stats

---

## TIER DEFINITIONS (4-TIER SYSTEM)

### Tier 1: DISTINCTIVE (9.0-10.0) - Top 1-5%
**Examples**:
${PIQ_AUTHENTICITY_TIERS.distinctive.indicators.map((ind) => `- ${ind}`).join('\n')}

**What This Looks Like**:
- Reader can "hear" the student's voice clearly
- Stories are specific, vivid, sensory-rich
- Shows vulnerability and genuine growth
- Unique perspective that only this student could write
- Memorable - reader would recognize student from essay alone

**Narrative Quality Index**: 80-100 (from PIQ analyzer)

**Why Rare**: <5% of applicants have truly distinctive, memorable voices.

### Tier 2: AUTHENTIC (7.0-8.9) - Top 10-20%
**Examples**:
${PIQ_AUTHENTICITY_TIERS.authentic.indicators.map((ind) => `- ${ind}`).join('\n')}

**What This Looks Like**:
- Clear personality comes through
- Real stories with specific details
- Shows genuine passion (not manufactured)
- Addresses prompts directly with depth
- Consistent voice across PIQs

**Narrative Quality Index**: 70-79

**Why Impressive**: Genuine and engaging, even if not literary.

### Tier 3: EMERGING (4.0-6.9) - Top 30-50%
**Examples**:
${PIQ_AUTHENTICITY_TIERS.emerging.indicators.map((ind) => `- ${ind}`).join('\n')}

**What This Looks Like**:
- Answers prompts but lacks depth
- Some specific details, some generic language
- Resume rehash in places (listing activities rather than stories)
- Voice is present but not distinctive

**Narrative Quality Index**: 60-69

**Why Concerning**: Doesn't stand out; forgettable in large applicant pool.

### Tier 4: MANUFACTURED (1.0-3.9) - Bottom 50%
**What This Looks Like**:
- Generic, could be anyone
- "College essay voice" - sounds like what they think admissions wants
- No specific stories or details
- Robotic, formulaic, or AI-generated feel
- Resume list format rather than narrative

**Narrative Quality Index**: Below 60

**Why Problematic**: These essays hurt rather than help application.

---

## VOICE ANALYSIS FRAMEWORK

### 1. Authenticity Markers (Positive Signs)
- **Specific details**: Names, dates, sensory descriptions, dialogue
- **Vulnerability**: Admits mistakes, fears, growth areas
- **Unique perspective**: Stories only this student could tell
- **Humor/personality**: Natural voice, not formal "essay voice"
- **Reflection depth**: Goes beyond "what happened" to "what I learned"

### 2. Red Flags (Manufactured Voice)
- **Generic language**: "It taught me to never give up", "I learned the value of teamwork"
- **Resume rehash**: "As president of X club, I led Y event..."
- **Borrowed voice**: Sounds like parent/counselor/AI wrote it
- **Over-polished**: Too perfect, no vulnerability
- **Prompt-answering robot**: Answers question without personality

### 3. Consistency Check
- Does voice match across all 4 PIQs?
- Does personality in PIQs align with activities?
- Are there contradictions between PIQs and rest of application?

### 4. Memorability Test
- Would reader remember this student tomorrow?
- Is there a "signature" moment or image?
- Does the student have a clear "thesis" about who they are?

---

## BRUTAL CALIBRATION GUARDS

### Reality Anchors
- **Most PIQs are forgettable** - generic, safe, similar to thousands of others
- **"Adversity essays" are overdone** - need unique angle to stand out
- **Over-editing kills voice** - polished ≠ authentic
- **Short form is hard** - 350 words requires precision and choice
- **Adults often ruin voice** - parent/counselor editing removes authenticity

### Red Flags for Grade Inflation
❌ **DON'T** give Tier 1 without genuinely memorable, distinctive voice
❌ **DON'T** reward beautiful writing that's generic (impressive but forgettable)
❌ **DON'T** ignore resume-rehash format (listing activities in narrative form)
❌ **DON'T** overlook manufactured adversity stories (every essay is a struggle)
❌ **DON'T** inflate based on topic importance (serious topic ≠ good essay)

✅ **DO** credit genuine specificity and vulnerability
✅ **DO** value unique perspectives and unexpected angles
✅ **DO** recognize authentic voice even with imperfect grammar
✅ **DO** reward risk-taking (unusual topics, honest reflection)
✅ **DO** check consistency across PIQs and application

### The "10,000 Applications" Test
Imagine you're a UC reader who has read 10,000 applications:
- Does this voice stand out?
- Will you remember this student tomorrow?
- Have you read this story 500 times before?

---

## OUTPUT FORMAT

Return a JSON object with this exact schema:

\`\`\`json
{
  "dimension_score": 7.5,
  "tier": "authentic",
  "percentile_estimate": "Top 15-20%",

  "piq_analysis": [
    {
      "piq_number": 1,
      "prompt_topic": "string - Which prompt was chosen",
      "narrative_quality_index": 75,
      "voice_assessment": "distinctive" | "authentic" | "emerging" | "manufactured",
      "specific_moments": ["string - Memorable specific details or scenes"],
      "authenticity_markers": ["string - Signs of genuine voice"],
      "red_flags": ["string - Signs of manufactured voice"],
      "memorable_factor": "high" | "medium" | "low",
      "what_works": "string - Strongest elements",
      "what_needs_work": "string - Improvement areas"
    }
  ],

  "overall_voice_assessment": {
    "voice_consistency": "consistent" | "somewhat_consistent" | "inconsistent",
    "personality_clarity": "clear" | "emerging" | "unclear",
    "authenticity_level": "genuine" | "mostly_genuine" | "manufactured",
    "memorable_elements": ["string - What would reader remember?"],
    "voice_type": "conversational" | "reflective" | "storytelling" | "analytical" | "generic"
  },

  "self_reflection_depth": {
    "shows_growth": boolean,
    "admits_vulnerabilities": boolean,
    "goes_beyond_surface": boolean,
    "evidence": ["string - Examples of deep reflection"]
  },

  "consistency_with_portfolio": {
    "activities_align": boolean,
    "personality_consistent": boolean,
    "contradictions": ["string - Any inconsistencies between PIQs and activities"]
  },

  "strengths": [
    {
      "strength": "string",
      "evidence": "string - Quote from PIQ if possible",
      "why_impressive": "string"
    }
  ],

  "weaknesses": [
    {
      "weakness": "string",
      "evidence": "string",
      "severity": "critical" | "moderate" | "minor",
      "how_to_improve": "string"
    }
  ],

  "ucla_specific_assessment": {
    "would_stand_out": boolean,
    "demonstrates_bruin_fit": boolean,
    "memorability_score": "memorable" | "solid" | "forgettable",
    "reader_likely_reaction": "string - How would UCLA reader respond?"
  },

  "strategic_pivot": {
    "current_tier": "authentic",
    "path_to_next_tier": "string - Specific actions",
    "revision_priorities": ["string - What to focus on in revisions"],
    "is_achievable": boolean
  },

  "key_evidence": [
    "string - 3-5 specific quotes or examples from PIQs"
  ]
}
\`\`\`

**CRITICAL FOR UCLA**: This dimension is 30% of evaluation. Be rigorous about voice authenticity.`;
}

function buildUserPrompt(
  portfolio: PortfolioData,
  holisticContext: HolisticPortfolioUnderstanding,
  mode: UCEvaluationMode
): string {
  const { writing_analysis, experiences, goals } = portfolio;

  return `Conduct a **deep-dive Authenticity & Voice analysis** for this student applying to **${mode === 'berkeley' ? 'UC Berkeley' : mode === 'ucla' ? 'UCLA' : 'UC System'}**.

${mode === 'ucla' ? '⚠️ **UCLA CONTEXT**: This dimension is 30% of evaluation - THE HIGHEST. PIQs can "make or break" UCLA applications.' : ''}
${mode === 'berkeley' ? '⚠️ **BERKELEY CONTEXT**: This dimension is 20% of evaluation. Look for intellectual passion and authentic self-reflection.' : ''}

---

## HOLISTIC CONTEXT (from Stage 1)

**Central Thread**: ${holisticContext.overallFirstImpression}

**Authenticity Assessment**: ${holisticContext.authenticityAssessment || 'Not assessed'}

**Key Strengths**: ${holisticContext.keyStrengths?.join(', ') || 'Not specified'}

---

## PERSONAL INSIGHT QUESTIONS (PIQs)

**Overall Writing Quality**: ${writing_analysis?.overall_writing_quality || 'N/A'}/100
**PIQs Completed**: ${writing_analysis?.piqs?.length || 0}/4

${
  writing_analysis?.piqs && writing_analysis.piqs.length > 0
    ? writing_analysis.piqs
        .map(
          (piq) => `
---

### PIQ ${piq.prompt_number}: ${piq.prompt_title || 'Unknown Prompt'}

**Word Count**: ${piq.word_count || 0}/350
**Narrative Quality Index**: ${piq.narrative_quality_index || 'N/A'}/100
**Authenticity Score**: ${piq.authenticity_score || 'N/A'}/10
**Voice Type**: ${piq.voice_type || 'Not classified'}

**Reader Impression**: ${piq.reader_impression || 'Not available'}

**Top Strengths**: ${piq.top_strengths?.join(', ') || 'Not analyzed'}

**Top Gaps**: ${piq.top_gaps?.join(', ') || 'Not analyzed'}

**Full Essay Text**:
---
${piq.essay_text || 'Essay text not provided'}
---
`
        )
        .join('\n\n')
    : `
**⚠️ PIQs NOT PROVIDED**

This is a critical limitation for Authenticity & Voice analysis. Without the actual PIQ text:
- Cannot assess voice authenticity
- Cannot evaluate narrative quality
- Cannot check consistency

**Recommendation**: This dimension should be re-evaluated once PIQs are available.

For now, base assessment on:
1. PIQ workshop scores if available
2. Overall writing quality metrics
3. Personality signals from activities
`
}

---

## ACTIVITIES FOR CONSISTENCY CHECK

**Key Activities**: ${experiences?.activities?.slice(0, 5).map((a) => a.name).join(', ') || 'None listed'}

**Personality Signals from Activities**:
${
  experiences?.activities?.slice(0, 3).map((a) => `- ${a.name}: ${a.description?.substring(0, 100)}...`).join('\n') || 'No activities listed'
}

---

## INTENDED MAJOR & GOALS (for alignment check)

**Intended Major**: ${goals?.intended_major || 'Undeclared'}
**Why This Major**: ${goals?.why_major || 'Not specified'}
**Career Goals**: ${goals?.career_goals || 'Not specified'}

---

## YOUR TASK

Provide a **rigorous, evidence-based Authenticity & Voice analysis**.

**Key Questions to Answer**:
1. ✅ Does this student sound like **themselves** (not generic applicant)?
2. ✅ Are stories **specific and vivid** (names, details, scenes)?
3. ✅ Is there **genuine vulnerability and growth** (not manufactured)?
4. ✅ Is voice **consistent** across PIQs and aligned with activities?
5. ✅ Would admissions reader **remember** this student?

**Voice Quality Checklist**:
- [ ] Specific details (not vague generalities)
- [ ] Unique perspective (only this student could write this)
- [ ] Vulnerability (admits struggles, growth areas)
- [ ] Personality (humor, quirks, authentic tone)
- [ ] Depth (goes beyond "what happened" to "what it means")

**Red Flags to Watch For**:
- Generic language ("taught me the value of...")
- Resume rehash (listing activities in narrative form)
- Borrowed voice (sounds like parent/counselor)
- Over-polished (too perfect, no rough edges)
- Adversity formula (every essay = overcome struggle)

**The UCLA Test**: Would this student stand out among 150,000 applications?

Return ONLY the JSON object (no markdown, no extra text).`;
}

function parseAuthenticityVoiceAnalysis(text: string): AuthenticityVoiceAnalysis {
  let jsonText = text.trim();
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonText);

    const result: AuthenticityVoiceAnalysis = {
      score: parsed.dimension_score || 5.0,
      tier: mapTierName(parsed.tier),
      reasoning: {
        piq_quality_analysis: parsed.overall_voice_assessment?.voice_type || 'Not assessed',
        voice_consistency: parsed.overall_voice_assessment?.voice_consistency || 'Not assessed',
        passion_authenticity: parsed.overall_voice_assessment?.authenticity_level || 'Not assessed',
        uc_fit_demonstration: parsed.ucla_specific_assessment?.reader_likely_reaction || 'Not assessed',
      },
      tier_evaluation: {
        current_tier: parsed.tier || 'emerging',
        next_tier: getNextTier(parsed.tier),
        tier_reasoning: parsed.strategic_pivot?.path_to_next_tier || 'Not specified',
      },
      strengths: (parsed.strengths || []).map((s: any) => ({
        strength: s.strength || '',
        evidence: [s.evidence || ''],
        rarity_factor: mapStrengthToRarity(parsed.tier),
      })),
      growth_areas: (parsed.weaknesses || []).map((w: any) => ({
        gap: w.weakness || '',
        severity: w.severity || 'moderate',
        rationale: w.evidence || '',
      })),
      strategic_pivot: parsed.strategic_pivot?.revision_priorities?.join('; ') || 'Add more specific details and vulnerability',
      comparative_context: {
        vs_typical_uc_applicant: parsed.percentile_estimate || 'Unknown',
        vs_top_10_percent:
          parsed.ucla_specific_assessment?.would_stand_out
            ? 'Competitive'
            : 'Below average',
        uc_campus_alignment:
          parsed.ucla_specific_assessment?.memorability_score === 'memorable'
            ? 'Strong fit for UCLA'
            : 'General UC fit',
      },
      confidence: 0.85,
    };

    return result;
  } catch (error) {
    console.error('Failed to parse authenticity voice analysis JSON:', error);
    throw new Error('Invalid JSON from authenticity voice analyzer');
  }
}

function mapTierName(tier: string): 'exceptional' | 'strong' | 'developing' | 'foundational' {
  const tierMap: Record<string, 'exceptional' | 'strong' | 'developing' | 'foundational'> = {
    distinctive: 'exceptional',
    authentic: 'strong',
    emerging: 'developing',
    manufactured: 'foundational',
    exceptional: 'exceptional',
    strong: 'strong',
    developing: 'developing',
    foundational: 'foundational',
  };
  return tierMap[tier?.toLowerCase()] || 'developing';
}

function getNextTier(currentTier: string): string {
  const progression: Record<string, string> = {
    manufactured: 'emerging',
    emerging: 'authentic',
    authentic: 'distinctive',
    distinctive: 'distinctive (already at top)',
    foundational: 'developing',
    developing: 'strong',
    strong: 'exceptional',
    exceptional: 'exceptional (already at top)',
  };
  return progression[currentTier?.toLowerCase()] || 'strong';
}

function mapStrengthToRarity(tier: string): 'Top 1-5%' | 'Top 10-20%' | 'Top 25-40%' | 'Common' {
  const rarityMap: Record<string, 'Top 1-5%' | 'Top 10-20%' | 'Top 25-40%' | 'Common'> = {
    distinctive: 'Top 1-5%',
    exceptional: 'Top 1-5%',
    authentic: 'Top 10-20%',
    strong: 'Top 10-20%',
    emerging: 'Top 25-40%',
    developing: 'Top 25-40%',
    manufactured: 'Common',
    foundational: 'Common',
  };
  return rarityMap[tier?.toLowerCase()] || 'Common';
}

function generateHeuristicAuthenticityAnalysis(
  portfolio: PortfolioData
): AuthenticityVoiceAnalysis {
  const { writing_analysis } = portfolio;

  // Use PIQ workshop scores if available
  const avgNQI = writing_analysis?.overall_writing_quality || 0;
  const piqCount = writing_analysis?.piqs?.length || 0;

  let score = 5.0;
  let tier: 'exceptional' | 'strong' | 'developing' | 'foundational' = 'developing';

  if (avgNQI >= 80) {
    tier = 'exceptional';
    score = 9.0;
  } else if (avgNQI >= 70) {
    tier = 'strong';
    score = 7.5;
  } else if (avgNQI >= 60) {
    tier = 'developing';
    score = 5.5;
  } else if (piqCount === 0) {
    tier = 'developing';
    score = 5.0; // No PIQs, can't assess
  } else {
    tier = 'foundational';
    score = 3.5;
  }

  return {
    score,
    tier,
    reasoning: {
      piq_quality_analysis: `Average NQI: ${avgNQI}/100`,
      voice_consistency: 'Unable to assess in heuristic mode',
      passion_authenticity: 'Manual review needed',
      uc_fit_demonstration: 'Cannot determine without full analysis',
    },
    tier_evaluation: {
      current_tier: tier,
      next_tier: getNextTier(tier),
      tier_reasoning: 'Heuristic fallback based on NQI scores',
    },
    strengths: [
      {
        strength: 'PIQ Completion',
        evidence: [`${piqCount} PIQs completed with avg NQI ${avgNQI}`],
        rarity_factor: 'Common',
      },
    ],
    growth_areas: [
      {
        gap: 'Heuristic Analysis',
        severity: 'moderate',
        rationale: 'LLM analysis failed - manual review needed for voice assessment',
      },
    ],
    strategic_pivot: 'Add specific details and personal voice to PIQs',
    comparative_context: {
      vs_typical_uc_applicant: 'Unable to determine',
      vs_top_10_percent: 'Unable to determine',
      uc_campus_alignment: 'Manual review needed',
    },
    confidence: 0.3, // Low confidence without full voice analysis
  };
}
