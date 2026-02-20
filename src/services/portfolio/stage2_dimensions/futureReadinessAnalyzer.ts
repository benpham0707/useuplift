// @ts-nocheck - Pre-existing type mismatches with portfolio types
/**
 * Stage 2 - Dimension Analyzer 6/6: Future Readiness
 *
 * Purpose: Deep-dive assessment of student's preparation for college and career
 * - Goal clarity and intentionality
 * - Major-activity alignment
 * - Evidence of preparation (not just interest)
 * - UC campus fit assessment
 *
 * Calibrated to UC admissions reality:
 * - This dimension has lower weight across all UCs (2-5%)
 * - But provides important context for holistic review
 * - Helps with "fit" assessment for specific campuses
 * - Major alignment matters more for competitive programs
 *
 * Weight by mode:
 * - Berkeley: 2% (minimal but relevant for competitive majors)
 * - UCLA: 2% (minimal but relevant)
 * - General UC: 5% (slightly more relevant for placement)
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  PortfolioData,
  FutureReadinessAnalysis,
  UCEvaluationMode,
  HolisticPortfolioUnderstanding,
} from '../types';
import { UC_CAMPUS_PROFILES } from '../constants/ucCalibration';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Stage 2.6: Future Readiness Analyzer
 */
export async function analyzeFutureReadiness(
  portfolio: PortfolioData,
  holisticContext: HolisticPortfolioUnderstanding,
  mode: UCEvaluationMode
): Promise<FutureReadinessAnalysis> {
  const systemPrompt = buildSystemPrompt(mode);
  const userPrompt = buildUserPrompt(portfolio, holisticContext, mode);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2500,
      temperature: 0.5,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    return parseFutureReadinessAnalysis(textContent.text);
  } catch (error) {

    try {
      const retryResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2500,
        temperature: 0.5,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const retryText = retryResponse.content.find((block) => block.type === 'text');
      if (!retryText || retryText.type !== 'text') {
        throw new Error('No text content in retry');
      }

      return parseFutureReadinessAnalysis(retryText.text);
    } catch (retryError) {
      return generateHeuristicFutureReadinessAnalysis(portfolio, mode);
    }
  }
}

function buildSystemPrompt(mode: UCEvaluationMode): string {
  const modeWeight = mode === 'general_uc' ? '5%' : '2%';

  return `You are an expert UC admissions evaluator conducting a **deep-dive analysis of Future Readiness** for ${mode === 'berkeley' ? 'UC Berkeley' : mode === 'ucla' ? 'UCLA' : 'UC System'} admissions.

**Dimension Weight**: Future Readiness accounts for **${modeWeight}** of holistic evaluation.

**Note**: While this dimension has lower weight, it provides important context for campus fit and helps readers understand the student's trajectory.

---

## WHAT IS FUTURE READINESS?

Future Readiness measures:
1. **Goal Clarity**: Does the student have clear academic/career direction?
2. **Major-Activity Alignment**: Do activities support intended major?
3. **Evidence of Preparation**: Have they taken concrete steps (not just "interested")?
4. **UC Campus Fit**: Is this the right UC for their goals?
5. **Realistic Self-Assessment**: Do goals match capabilities and preparation?

**This is NOT about having everything figured out**. Undeclared is fine. But if stating goals, they should be substantiated.

---

## WHY FUTURE READINESS MATTERS

### For Competitive Programs
Some UC programs are more selective than the university overall:
- **Berkeley Engineering**: More competitive than Berkeley L&S
- **UCLA Film/Theater**: Highly selective within UCLA
- **UCSD CS**: Very competitive

For these, **major-activity alignment** matters more.

### For Holistic Review
Admissions readers want to understand:
- What motivates this student?
- Why this major/campus?
- Is this student likely to thrive here?

### UC Campus Fit
${Object.entries(UC_CAMPUS_PROFILES)
  .slice(0, 4)
  .map(([campus, profile]) => `- **${campus}**: ${profile.ideal_profile}`)
  .join('\n')}

---

## TIER DEFINITIONS (4-TIER SYSTEM)

### Tier 1: PREPARED (9.0-10.0) - Top 5-10%
**What This Looks Like**:
- Clear major with deep preparation (relevant ECs, coursework, research)
- "Why this major" story is compelling and substantiated
- Activities directly support career trajectory
- Has explored field through internships, research, or professional exposure
- Specific UC campus choice is well-reasoned

**Examples**:
- Wants CS major + has built apps + done research + won competitions
- Wants Biology + done lab research + shadowed doctors + taken all available science APs
- Wants Film at UCLA + made films + won awards + can articulate "why UCLA specifically"

### Tier 2: INTENTIONAL (7.0-8.9) - Top 15-25%
**What This Looks Like**:
- Clear direction with some supporting evidence
- Activities align with interests (even if not perfect)
- Has explored field through coursework or basic involvement
- Can articulate why this path (even if still developing)
- UC choice makes sense for their goals

**Examples**:
- Wants Engineering + strong in STEM + robotics club + but no research yet
- Wants Psychology + interested in mental health + volunteer at clinic + curious about research
- Wants Business + entrepreneurship club + works part-time + exploring options

### Tier 3: EXPLORING (4.0-6.9) - Top 40-60%
**What This Looks Like**:
- Some direction but vague or undeveloped
- Activities may or may not align with stated major
- "Why this major" is generic or unclear
- UC choice is not well-reasoned (or undeclared, which is fine)
- Still figuring things out (developmentally appropriate)

**Examples**:
- Says "wants to be a doctor" but only typical pre-med boxes checked
- Undeclared but has broad interests and activities
- Major doesn't match activities but that's okay

### Tier 4: UNFOCUSED (1.0-3.9) - Bottom 40%
**What This Looks Like**:
- No clear direction AND no exploration
- Activities seem random with no thread
- "Why this major" is clearly made up or generic
- UC choice seems arbitrary
- No evidence of self-reflection about future

---

## ASSESSMENT FRAMEWORK

### 1. Goal Clarity Analysis
- What is their stated major/career goal?
- How specific and developed is this goal?
- Is this developmentally appropriate for their grade?

### 2. Major-Activity Alignment
- Do activities support stated major?
- Is there evidence of genuine interest (not resume padding)?
- Have they taken concrete steps toward this field?

### 3. Preparation Evidence
- Relevant coursework taken?
- Relevant ECs (clubs, research, internships)?
- Professional/academic exposure to field?
- Self-directed exploration?

### 4. UC Campus Fit
- Does target campus match their goals/profile?
- Is their reasoning for campus choice substantiated?
- Would they thrive at this specific UC?

### 5. Realistic Assessment
- Are goals realistic given preparation?
- Do they understand what's required?
- Are they on track (or course-correctable)?

---

## BRUTAL CALIBRATION GUARDS

### Reality Anchors
- **Undeclared is perfectly fine** - many successful students enter undeclared
- **Most students are Tier 2-3** - still developing direction (developmentally appropriate)
- **Perfect alignment is rare** - Tier 1 requires exceptional preparation
- **"I want to be a doctor" without evidence = Tier 3** (generic without preparation)

### Red Flags for Grade Inflation
❌ **DON'T** penalize undeclared students (they can be Tier 2-3)
❌ **DON'T** give Tier 1 without exceptional alignment and preparation
❌ **DON'T** believe generic "why this major" statements without evidence
❌ **DON'T** weight this dimension too heavily (it's 2-5%)

✅ **DO** credit genuine exploration and self-reflection
✅ **DO** value realistic self-assessment over ambitious claims
✅ **DO** consider grade level (9th grader exploring vs 12th grader applying)
✅ **DO** assess fit for specific UC campus if targeted

---

## OUTPUT FORMAT

Return a JSON object with this exact schema:

\`\`\`json
{
  "dimension_score": 6.5,
  "tier": "exploring",
  "percentile_estimate": "Top 40-50%",

  "goal_clarity": {
    "stated_major": "string - What major did they indicate?",
    "clarity_level": "clear" | "developing" | "vague" | "undeclared",
    "career_direction": "string - What career path are they considering?",
    "why_this_major": "string - Their stated reason (and is it substantiated?)",
    "developmentally_appropriate": boolean
  },

  "major_activity_alignment": {
    "alignment_score": "strong" | "moderate" | "weak" | "no_major_stated",
    "supporting_activities": ["string - Activities that support major"],
    "gaps": ["string - Missing preparation for major"],
    "evidence_of_genuine_interest": "string"
  },

  "preparation_evidence": {
    "relevant_coursework": ["string - Courses that prepare for major"],
    "relevant_ecs": ["string - ECs that prepare for major"],
    "professional_exposure": "string - Internships, shadowing, etc.",
    "self_directed_exploration": "string - What have they done on their own?"
  },

  "uc_campus_fit": {
    "target_campuses": ["string - Which UCs are they targeting?"],
    "primary_campus_fit": "strong" | "moderate" | "weak",
    "fit_reasoning": "string - Why this campus fits (or doesn't)",
    "recommended_campuses": ["string - Best fit UCs based on profile"],
    "competitive_major_assessment": "string - For impacted majors"
  },

  "strengths": [
    {
      "strength": "string",
      "evidence": "string",
      "why_matters": "string"
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

  "strategic_pivot": {
    "current_tier": "exploring",
    "path_to_next_tier": "string - Specific actions",
    "recommended_focus": "string - What to prioritize",
    "timeline": "string"
  },

  "key_evidence": [
    "string - 3-5 specific pieces of evidence used in evaluation"
  ]
}
\`\`\``;
}

function buildUserPrompt(
  portfolio: PortfolioData,
  holisticContext: HolisticPortfolioUnderstanding,
  mode: UCEvaluationMode
): string {
  const { goals, academic, experiences, profile } = portfolio;

  return `Conduct a **Future Readiness analysis** for this student applying to **${mode === 'berkeley' ? 'UC Berkeley' : mode === 'ucla' ? 'UCLA' : 'UC System'}**.

---

## HOLISTIC CONTEXT (from Stage 1)

**Central Thread**: ${holisticContext.overallFirstImpression}

**Depth vs Breadth**: ${holisticContext.depthVsBreadth?.assessment || 'Not assessed'}

**UC Tier Recommendation (from Stage 1)**: ${holisticContext.ucSpecificAssessment?.recommended_uc_tier || 'Not specified'}

---

## GOALS & ASPIRATIONS

**Intended Major**: ${goals?.intended_major || 'Undeclared/Not specified'}
**Alternative Majors**: ${goals?.alternative_majors?.join(', ') || 'None listed'}

**Why This Major**:
${goals?.why_major || 'Not specified'}

**Career Goals**:
${goals?.career_goals || 'Not specified'}

**Target UC Campuses**: ${goals?.target_uc_campuses?.join(', ') || 'Not specified'}

---

## ACADEMIC PREPARATION (for major alignment)

**Advanced Courses Relevant to Major**:
${
  academic?.advanced_courses
    ?.filter((course) => {
      const major = goals?.intended_major?.toLowerCase() || '';
      const courseName = course.name?.toLowerCase() || '';
      // Simple relevance check
      if (major.includes('computer') || major.includes('engineering')) {
        return courseName.includes('math') || courseName.includes('computer') || courseName.includes('physics');
      }
      if (major.includes('bio') || major.includes('pre-med') || major.includes('health')) {
        return courseName.includes('bio') || courseName.includes('chem') || courseName.includes('physics');
      }
      if (major.includes('business') || major.includes('econ')) {
        return courseName.includes('econ') || courseName.includes('math') || courseName.includes('stat');
      }
      return true; // Include all for other majors
    })
    .map((course) => `- ${course.name} (${course.type}): ${course.grade || 'In progress'}`)
    .join('\n') || 'No relevant advanced courses identified'
}

---

## ACTIVITIES (for major alignment)

**Activities Potentially Related to Major**:
${
  experiences?.activities
    ?.filter((ec) => {
      const major = goals?.intended_major?.toLowerCase() || '';
      const ecName = (ec.name + ' ' + ec.description).toLowerCase();
      // Simple relevance check
      if (major.includes('computer') || major.includes('engineering')) {
        return ecName.includes('code') || ecName.includes('robot') || ecName.includes('tech') || ecName.includes('programming');
      }
      if (major.includes('bio') || major.includes('pre-med') || major.includes('health')) {
        return ecName.includes('health') || ecName.includes('hospital') || ecName.includes('research') || ecName.includes('science');
      }
      if (major.includes('business') || major.includes('econ')) {
        return ecName.includes('business') || ecName.includes('entrepreneur') || ecName.includes('finance');
      }
      return true;
    })
    .slice(0, 5)
    .map(
      (ec) => `
- **${ec.name}** (${ec.years_involved || '?'} years)
  - ${ec.description?.substring(0, 150)}...
  - ${ec.impact ? `Impact: ${ec.impact?.substring(0, 100)}` : 'No impact specified'}
`
    )
    .join('\n') || 'No activities clearly aligned with major'
}

---

## STUDENT CONTEXT

**Grade Level**: ${profile?.grade || 'Not specified'}
**School Type**: ${profile?.school_type || 'Unknown'}

---

## YOUR TASK

Provide a **Future Readiness analysis** using the tier framework.

**Key Questions to Answer**:
1. ✅ How **clear and developed** are their goals?
2. ✅ Do **activities align** with stated major (if any)?
3. ✅ Is there **evidence of preparation** (not just interest)?
4. ✅ Is their **UC campus choice** well-reasoned?
5. ✅ Are goals **realistic** given preparation?

**Important Notes**:
- **Undeclared is fine** - don't penalize exploration
- **Grade level matters** - 9th graders should be exploring
- **Lower weight dimension** (2-5%) - don't over-weight in final assessment
- **Focus on fit** - would this student thrive at target UC?

Return ONLY the JSON object (no markdown, no extra text).`;
}

function parseFutureReadinessAnalysis(text: string): FutureReadinessAnalysis {
  let jsonText = text.trim();
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonText);

    const result: FutureReadinessAnalysis = {
      score: parsed.dimension_score || 5.0,
      tier: mapTierName(parsed.tier),
      reasoning: {
        goal_clarity: parsed.goal_clarity?.clarity_level || 'Not assessed',
        preparation: parsed.preparation_evidence?.self_directed_exploration || 'Not assessed',
        trajectory: parsed.major_activity_alignment?.alignment_score || 'Not assessed',
        uc_campus_fit: parsed.uc_campus_fit?.fit_reasoning || 'Not assessed',
      },
      tier_evaluation: {
        current_tier: parsed.tier || 'exploring',
        next_tier: getNextTier(parsed.tier),
        tier_reasoning: parsed.strategic_pivot?.path_to_next_tier || 'Not specified',
      },
      strengths: (parsed.strengths || []).map((s: any) => ({
        strength: s.strength || '',
        evidence: [s.evidence || ''],
        rarity_factor: mapTierToRarity(parsed.tier),
      })),
      growth_areas: (parsed.weaknesses || []).map((w: any) => ({
        gap: w.weakness || '',
        severity: w.severity || 'moderate',
        rationale: w.evidence || '',
      })),
      strategic_pivot: parsed.strategic_pivot?.recommended_focus || 'Explore interests through meaningful activities',
      comparative_context: {
        vs_typical_uc_applicant: parsed.percentile_estimate || 'Unknown',
        vs_top_10_percent:
          parsed.uc_campus_fit?.primary_campus_fit === 'strong'
            ? 'Competitive'
            : 'Average',
        uc_campus_alignment: parsed.uc_campus_fit?.recommended_campuses?.join(', ') || 'General UC fit',
      },
      confidence: 0.75,
    };

    return result;
  } catch (error) {
    throw new Error('Invalid JSON from future readiness analyzer');
  }
}

function mapTierName(tier: string): 'exceptional' | 'strong' | 'developing' | 'foundational' {
  const tierMap: Record<string, 'exceptional' | 'strong' | 'developing' | 'foundational'> = {
    prepared: 'exceptional',
    intentional: 'strong',
    exploring: 'developing',
    unfocused: 'foundational',
    exceptional: 'exceptional',
    strong: 'strong',
    developing: 'developing',
    foundational: 'foundational',
  };
  return tierMap[tier?.toLowerCase()] || 'developing';
}

function getNextTier(currentTier: string): string {
  const progression: Record<string, string> = {
    unfocused: 'exploring',
    exploring: 'intentional',
    intentional: 'prepared',
    prepared: 'prepared (already at top)',
    foundational: 'developing',
    developing: 'strong',
    strong: 'exceptional',
    exceptional: 'exceptional (already at top)',
  };
  return progression[currentTier?.toLowerCase()] || 'strong';
}

function mapTierToRarity(tier: string): 'Top 1-5%' | 'Top 10-20%' | 'Top 25-40%' | 'Common' {
  const rarityMap: Record<string, 'Top 1-5%' | 'Top 10-20%' | 'Top 25-40%' | 'Common'> = {
    prepared: 'Top 1-5%',
    exceptional: 'Top 1-5%',
    intentional: 'Top 10-20%',
    strong: 'Top 10-20%',
    exploring: 'Top 25-40%',
    developing: 'Top 25-40%',
    unfocused: 'Common',
    foundational: 'Common',
  };
  return rarityMap[tier?.toLowerCase()] || 'Common';
}

function generateHeuristicFutureReadinessAnalysis(
  portfolio: PortfolioData,
  mode: UCEvaluationMode
): FutureReadinessAnalysis {
  const { goals, experiences } = portfolio;

  // Simple heuristic based on goal clarity and activity count
  const hasMajor = !!goals?.intended_major && goals.intended_major !== 'Undeclared';
  const hasWhyMajor = !!goals?.why_major && goals.why_major.length > 50;
  const activityCount = experiences?.activities?.length || 0;

  let score = 5.0;
  let tier: 'exceptional' | 'strong' | 'developing' | 'foundational' = 'developing';

  if (hasMajor && hasWhyMajor && activityCount >= 3) {
    tier = 'strong';
    score = 7.0;
  } else if (hasMajor || activityCount >= 2) {
    tier = 'developing';
    score = 5.5;
  } else {
    tier = 'foundational';
    score = 4.0;
  }

  return {
    score,
    tier,
    reasoning: {
      goal_clarity: hasMajor ? 'Major declared' : 'Undeclared',
      preparation: 'Unable to assess in heuristic mode',
      trajectory: activityCount > 0 ? `${activityCount} activities listed` : 'No activities',
      uc_campus_fit: `Target: ${goals?.target_uc_campuses?.join(', ') || 'Not specified'}`,
    },
    tier_evaluation: {
      current_tier: tier,
      next_tier: getNextTier(tier),
      tier_reasoning: 'Heuristic fallback - detailed analysis needed',
    },
    strengths: [
      {
        strength: 'Goal Direction',
        evidence: [hasMajor ? `Declared major: ${goals?.intended_major}` : 'Exploring options'],
        rarity_factor: 'Common',
      },
    ],
    growth_areas: [
      {
        gap: 'Heuristic Analysis',
        severity: 'minor',
        rationale: 'LLM analysis failed - manual review recommended',
      },
    ],
    strategic_pivot: 'Explore interests through meaningful activities and coursework',
    comparative_context: {
      vs_typical_uc_applicant: 'Unable to determine',
      vs_top_10_percent: 'Unable to determine',
      uc_campus_alignment: 'Manual review needed',
    },
    confidence: 0.4,
  };
}
