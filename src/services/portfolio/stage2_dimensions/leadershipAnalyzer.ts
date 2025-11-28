// @ts-nocheck - Pre-existing type mismatches with portfolio types
/**
 * Stage 2 - Dimension Analyzer 2/6: Leadership & Initiative
 *
 * Purpose: Deep-dive assessment of student's leadership and initiative
 * - Quality over quantity (outcomes > titles)
 * - Tier-based EC system (Tier 1-4 from CollegeVine research)
 * - Initiative beyond structured roles
 * - Impact and outcomes measurement
 *
 * Calibrated to admissions reality:
 * - Only 44.3% of colleges rate ECs as "moderate importance" (NACAC)
 * - ECs are secondary to academics at most schools
 * - But at top UCs: leadership differentiates among high-GPA applicants
 * - Tier 1 ECs (Top 1-5%): National recognition, major impact
 * - Tier 2 ECs (Top 10-20%): State/regional recognition, significant leadership
 * - Tier 3 ECs (Top 30-40%): School leadership, sustained involvement
 * - Tier 4 ECs (60%+): Generic membership, participation
 *
 * Weight by mode:
 * - Berkeley: 15% (valued but not primary)
 * - UCLA: 15% (valued but not primary)
 * - General UC: 15% (consistent across UCs)
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  PortfolioData,
  LeadershipInitiativeAnalysis,
  UCEvaluationMode,
  HolisticPortfolioUnderstanding,
} from '../types';
import { LEADERSHIP_TIERS, UC_CONTEXT_ADJUSTMENTS } from '../constants/ucCalibration';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Stage 2.2: Leadership & Initiative Analyzer
 */
export async function analyzeLeadership(
  portfolio: PortfolioData,
  holisticContext: HolisticPortfolioUnderstanding,
  mode: UCEvaluationMode
): Promise<LeadershipInitiativeAnalysis> {
  const systemPrompt = buildSystemPrompt(mode);
  const userPrompt = buildUserPrompt(portfolio, holisticContext, mode);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3000,
      temperature: 0.6, // Slightly higher for pattern recognition
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    return parseLeadershipAnalysis(textContent.text);
  } catch (error) {
    console.error('Leadership analysis failed:', error);

    try {
      console.log('Retrying Leadership analysis...');
      const retryResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 3000,
        temperature: 0.6,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const retryText = retryResponse.content.find((block) => block.type === 'text');
      if (!retryText || retryText.type !== 'text') {
        throw new Error('No text content in retry');
      }

      return parseLeadershipAnalysis(retryText.text);
    } catch (retryError) {
      console.error('Retry failed, using heuristic:', retryError);
      return generateHeuristicLeadershipAnalysis(portfolio);
    }
  }
}

function buildSystemPrompt(mode: UCEvaluationMode): string {
  return `You are an expert UC admissions evaluator conducting a **deep-dive analysis of Leadership & Initiative** for ${mode === 'berkeley' ? 'UC Berkeley' : mode === 'ucla' ? 'UCLA' : 'UC System'} admissions.

**Dimension Weight**: Leadership accounts for **15%** of holistic evaluation across all UCs.

---

## WHAT IS LEADERSHIP & INITIATIVE?

Leadership measures:
1. **Impact Over Titles**: What did you *accomplish*, not just what position you held?
2. **Initiative**: Did you *create* something new or *transform* something existing?
3. **Outcomes**: What changed because of your leadership?
4. **Depth Over Breadth**: Sustained commitment (2+ years) > one-semester involvement
5. **Rarity**: How many students achieve this level of recognition/impact?

**CRITICAL**: "Club President" is NOT automatically impressive. We need evidence of outcomes.

---

## EC TIER SYSTEM (CollegeVine 4-Tier Framework)

### Tier 1: TRANSFORMATIONAL (Top 1-5% nationally)
**Examples**:
- National/international recognition (ISEF finalist, USAMO qualifier, Presidential Scholar)
- Recruited Division 1 athlete
- Founded organization with 500+ members or $50k+ raised
- Published research in peer-reviewed journal
- National youth organization leadership (e.g., National Student Council President)
- Started company with $100k+ revenue

**Admission Impact**: Major boost at any school, including Ivies/Stanford/Berkeley
**Evidence Required**: Specific metrics, recognition, third-party validation

### Tier 2: SIGNIFICANT (Top 10-20% nationally)
**Examples**:
- State-level recognition (All-State musician, State Science Fair winner)
- Significant community impact (raised $10k+, impacted 200+ people)
- Regional leadership (district/county youth council)
- Founded school club with measurable outcomes (tripled membership, won competitions)
- Varsity athlete captain with team achievements
- Internship at competitive organization (university lab, competitive tech company)

**Admission Impact**: Strong boost at top UCs, expected at Berkeley/UCLA
**Evidence Required**: Quantified impact, leadership titles with outcomes

### Tier 3: SUBSTANTIAL (Top 30-40% nationally)
**Examples**:
- School club president (managed 20+ members, organized events)
- Varsity athlete (competed, contributed to team)
- Regular volunteer (100+ hours annually, consistent commitment)
- School leadership position (ASB, class officer)
- Part-time job (15+ hours/week, demonstrates responsibility)
- School musical/play lead role

**Admission Impact**: Expected at any UC, baseline for competitive applicants
**Evidence Required**: Consistency (2+ years), some measurable contributions

### Tier 4: PARTICIPATORY (60%+ have similar)
**Examples**:
- Club member (attended meetings, no leadership)
- Volunteer (occasional, no sustained commitment)
- Short-term activities (<1 year)
- Generic memberships (NHS with no active involvement)
- One-time events or summer programs

**Admission Impact**: Minimal - demonstrates participation but not leadership
**Evidence Required**: Just listing these is not enough

---

## BRUTAL CALIBRATION GUARDS

### Reality Anchors from Research
- **NACAC**: Only 44.3% of colleges rate ECs as "moderate importance"
- **Academics matter 2-3x more than ECs** at most schools
- **Top UCs**: Leadership differentiates among 4.0+ GPA applicants
- **Most applicants**: Have Tier 3 activities (club president, varsity athlete)
- **Rarity matters**: Tier 1/2 activities are genuinely rare (Top 20% or better)

### What "Club President" Actually Means
- **Tier 1**: Transformed club (3x membership, won national competitions, raised $20k+)
- **Tier 2**: Significant growth (2x membership, organized major events, won regional recognition)
- **Tier 3**: Competent leadership (maintained club, organized meetings, steady involvement)
- **Tier 4**: Title only (attended meetings, no measurable outcomes)

**Default assumption**: "Club President" = Tier 3 unless outcomes prove otherwise.

### Context Adjustments (Evidence-Based)
${Object.entries(UC_CONTEXT_ADJUSTMENTS)
  .filter(([key]) => ['low_income', 'first_generation', 'family_responsibilities'].includes(key))
  .map(([key, adj]) => `- **${key.replace(/_/g, ' ')}**: ${adj.description}`)
  .join('\n')}

**Critical**: Work/family responsibilities for low-income students = valuable Tier 2-3 ECs

### Red Flags for Grade Inflation
❌ **DON'T** give Tier 1 without national recognition or extraordinary impact
❌ **DON'T** give Tier 2 without quantified outcomes (members, money, reach)
❌ **DON'T** list 10+ activities and call it "leadership" (it's resume padding)
❌ **DON'T** ignore lack of depth (1 year in 10 clubs < 4 years in 2 clubs)
❌ **DON'T** inflate context adjustments without clear evidence

✅ **DO** credit genuine impact with evidence
✅ **DO** recognize initiative (starting something new)
✅ **DO** value depth and consistency (2-4 years)
✅ **DO** adjust for low-income context (work = leadership)

---

## LEADERSHIP ASSESSMENT FRAMEWORK

### 1. EC Inventory Analysis
- Categorize each activity by tier (1-4)
- Identify **spike activities** (areas of exceptional depth)
- Calculate **depth score** (years invested × impact)

### 2. Initiative Detection
- Did they **create** something new? (started club, founded org, launched project)
- Did they **transform** something existing? (revitalized dying club, modernized process)
- Did they **take risks**? (tackled hard problems, advocated for change)

### 3. Outcomes & Impact Measurement
- **Quantitative**: Numbers, metrics, growth statistics
- **Qualitative**: Testimonials, recognition, lasting changes
- **Third-party validation**: Awards, media coverage, institutional recognition

### 4. Depth vs. Breadth
- **Depth**: 3-4 years in 1-2 core activities = excellent
- **Breadth**: 1 year in 10+ activities = red flag (resume padding)
- **Ideal**: Deep spike (Tier 1-2) + 2-3 supporting activities

### 5. Rarity Assessment
- How many students achieve this level? (Top 1%, 5%, 10%, 20%, 50%?)
- Is this impressive in context? (First-gen low-income student founding nonprofit = Tier 1)

---

## OUTPUT FORMAT

Return a JSON object with this exact schema:

\`\`\`json
{
  "dimension_score": 7.5,
  "tier": "significant",
  "percentile_estimate": "Top 15-20% nationally",

  "ec_inventory": [
    {
      "activity_name": "string",
      "tier": "tier_1" | "tier_2" | "tier_3" | "tier_4",
      "duration_years": 3,
      "evidence_of_impact": "string - Specific outcomes, metrics, recognition",
      "rarity": "Top 5%" | "Top 10-20%" | "Top 30-40%" | "Common",
      "why_this_tier": "string - Justification for tier placement"
    }
  ],

  "spike_analysis": {
    "has_clear_spike": boolean,
    "spike_area": "string - Domain of exceptional depth (e.g., 'STEM Research', 'Community Service')",
    "spike_tier": "tier_1" | "tier_2" | "tier_3",
    "depth_score": "string - Assessment of depth vs breadth"
  },

  "initiative_examples": [
    {
      "initiative": "string - What they created/transformed",
      "evidence": "string - Specific outcomes",
      "why_impressive": "string"
    }
  ],

  "outcomes_impact": {
    "quantitative_impact": ["string - Numbers, metrics, growth"],
    "qualitative_impact": ["string - Changes, recognition, testimonials"],
    "third_party_validation": ["string - Awards, media, institutional recognition"]
  },

  "strengths": [
    {
      "strength": "string",
      "evidence": "string",
      "tier_level": "tier_1" | "tier_2" | "tier_3",
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

  "context_adjustment": {
    "applies": boolean,
    "adjustment_type": "low_income_work" | "first_gen_barriers" | "family_responsibilities" | "none",
    "impact_on_score": "+0.5 to +1.5 points",
    "justification": "string"
  },

  "strategic_pivot": {
    "current_tier": "tier_3",
    "path_to_next_tier": "string - Specific actions to reach Tier 2",
    "recommended_focus": "string - Where to invest time for maximum impact",
    "timeline": "string"
  },

  "key_evidence": [
    "string - 3-5 specific pieces of evidence used in evaluation"
  ]
}
\`\`\`

**CRITICAL REQUIREMENTS**:
1. **Cite SPECIFIC activities** with evidence of outcomes
2. **Quantify impact** wherever possible (numbers, metrics, reach)
3. **Assign tiers based on framework** (not generously)
4. **Identify genuine spike** (not just "interested in many things")
5. **Be BRUTALLY HONEST** about resume padding
6. **Apply context adjustments** only with clear evidence

Remember: Most competitive applicants have Tier 3 activities. Tier 2 is impressive. Tier 1 is genuinely rare.`;
}

function buildUserPrompt(
  portfolio: PortfolioData,
  holisticContext: HolisticPortfolioUnderstanding,
  mode: UCEvaluationMode
): string {
  const { experiences, personal_context, profile } = portfolio;
  const activities = experiences?.activities ?? [];

  // Extract context values safely
  const isFirstGen = personal_context?.background?.first_gen ?? false;
  const isLowIncome = personal_context?.background?.low_income ?? false;
  const familyResponsibilities = personal_context?.family_responsibilities;
  const challenges = personal_context?.challenges_overcome ?? [];
  const apsOffered = personal_context?.school_context?.total_aps_offered ?? 20;
  const isUnderResourced = apsOffered < 10;

  return `Conduct a **deep-dive Leadership & Initiative analysis** for this student applying to **${mode === 'berkeley' ? 'UC Berkeley' : mode === 'ucla' ? 'UCLA' : 'UC System'}**.

---

## HOLISTIC CONTEXT (from Stage 1)

**Central Thread**: ${holisticContext.central_thread?.narrative || 'Not determined'}

**Key Insights**:
${holisticContext.key_insights?.map((insight) => `- ${insight}`).join('\n') || '- No key insights available'}

**Hidden Strengths Identified**:
${
  holisticContext.hidden_strengths?.length > 0
    ? holisticContext.hidden_strengths.map((hs) => `- ${hs.strength} (${hs.rarity}): ${hs.why_valuable}`).join('\n')
    : 'None identified'
}

**Context Factors**:
- First-generation: ${holisticContext.context_factors?.first_generation?.applies ? '✅ Yes' : 'No'}
- Low-income: ${holisticContext.context_factors?.low_income?.applies ? '✅ Yes (work/family = valuable EC)' : 'No'}
- Family responsibilities: ${familyResponsibilities?.description || 'None'}

---

## EXTRACURRICULAR ACTIVITIES

**Total Activities Listed**: ${activities.length}

${
  activities.length > 0
    ? activities
        .map(
          (activity, idx) => `
### ${idx + 1}. ${activity.name}
- **Category**: ${activity.category}
- **Role**: ${activity.role || 'Member'}
- **Duration**: ${activity.years_involved} years (${activity.hours_per_week || '?'} hrs/week, ${activity.weeks_per_year || '?'} weeks/year)
- **Grade Levels**: ${activity.grade_levels?.join(', ') || 'Not specified'}

**Description**: ${activity.description}

${activity.impact ? `**Outcomes/Impact**: ${activity.impact}` : '**Outcomes/Impact**: Not specified'}

${activity.leadership_positions?.length ? `**Leadership Positions**: ${activity.leadership_positions.join(', ')}` : ''}

${activity.awards?.length ? `**Recognition**: ${activity.awards.join(', ')}` : ''}
`
        )
        .join('\n')
    : '**No extracurricular activities listed** - This is a significant red flag unless context explains (e.g., work 30+ hrs/week)'
}

---

## WORK EXPERIENCE (if applicable)

${
  activities.filter((a) => a.category === 'work' || a.is_paid_work).length > 0
    ? activities
        .filter((a) => a.category === 'work' || a.is_paid_work)
        .map(
          (work) => `
- **${work.name}**: ${work.hours_per_week || '?'} hrs/week for ${work.years_involved} years
  - ${work.description}
  ${work.impact ? `- Impact: ${work.impact}` : ''}
`
        )
        .join('\n')
    : 'No work experience listed'
}

---

## CONTEXT THAT MAY AFFECT EC INVOLVEMENT

**Family Responsibilities**: ${familyResponsibilities?.has_responsibilities ? `${familyResponsibilities.hours_per_week || '?'} hrs/week - ${familyResponsibilities.description || 'Description not provided'}` : 'None listed'}
**Low Income**: ${isLowIncome ? 'Yes' : 'No'}
**First-Generation**: ${isFirstGen ? 'Yes - May have had less guidance on EC strategy' : 'No'}

**Significant Challenges**: ${challenges.length > 0 ? challenges.join(', ') : 'None disclosed'}

**Important Context for Evaluation**:
${
  holisticContext.context_factors?.low_income?.applies
    ? '- Low-income students often work 15-30 hrs/week to support family (this IS a valuable EC)'
    : ''
}
${
  familyResponsibilities?.has_responsibilities
    ? '- Family responsibilities (caregiving, translation, household management) count as leadership'
    : ''
}
${
  isUnderResourced
    ? '- Under-resourced school may have limited club offerings (fewer opportunities, not lack of initiative)'
    : ''
}

---

## YOUR TASK

Provide a **rigorous, evidence-based Leadership & Initiative analysis** using the tier framework.

**Evaluation Checklist**:
1. ✅ **Categorize each EC by tier** (1-4) using framework
2. ✅ **Identify spike area** (domain of exceptional depth)
3. ✅ **Quantify outcomes** (numbers, metrics, reach)
4. ✅ **Assess depth vs breadth** (4 years in 2 ECs > 1 year in 8 ECs)
5. ✅ **Detect genuine initiative** (created/transformed something)
6. ✅ **Apply context adjustments** (work/family = leadership)
7. ✅ **Be honest about resume padding** (long list with no depth)

**Brutal Honesty Required**:
- Most "Club President" roles = Tier 3 (unless outcomes prove Tier 2)
- Tier 1 requires national recognition or extraordinary impact
- Work 20+ hrs/week for family = Tier 2-3 leadership (responsibility, time management)
- 10+ activities with 1 year each = red flag (breadth without depth)

Return ONLY the JSON object (no markdown, no extra text).`;
}

function parseLeadershipAnalysis(text: string): LeadershipInitiativeAnalysis {
  let jsonText = text.trim();
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonText);

    const result: LeadershipInitiativeAnalysis = {
      dimension_score: parsed.dimension_score || 5.0,
      tier: parsed.tier || 'substantial',
      percentile_estimate: parsed.percentile_estimate || 'Unable to estimate',
      ec_inventory: parsed.ec_inventory || [],
      spike_analysis: {
        has_clear_spike: parsed.spike_analysis?.has_clear_spike || false,
        spike_area: parsed.spike_analysis?.spike_area || 'No clear spike identified',
        spike_tier: parsed.spike_analysis?.spike_tier || 'tier_3',
        depth_score: parsed.spike_analysis?.depth_score || 'Breadth over depth',
      },
      initiative_examples: parsed.initiative_examples || [],
      outcomes_impact: {
        quantitative_impact: parsed.outcomes_impact?.quantitative_impact || [],
        qualitative_impact: parsed.outcomes_impact?.qualitative_impact || [],
        third_party_validation: parsed.outcomes_impact?.third_party_validation || [],
      },
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      context_adjustment: {
        applies: parsed.context_adjustment?.applies || false,
        adjustment_type: parsed.context_adjustment?.adjustment_type || 'none',
        impact_on_score: parsed.context_adjustment?.impact_on_score || 'None',
        justification: parsed.context_adjustment?.justification || '',
      },
      strategic_pivot: {
        current_tier: parsed.strategic_pivot?.current_tier || 'tier_3',
        path_to_next_tier: parsed.strategic_pivot?.path_to_next_tier || 'Unable to determine',
        recommended_focus: parsed.strategic_pivot?.recommended_focus || 'Develop depth in key areas',
        timeline: parsed.strategic_pivot?.timeline || 'N/A',
      },
      key_evidence: parsed.key_evidence || [],
    };

    return result;
  } catch (error) {
    console.error('Failed to parse leadership analysis JSON:', error);
    throw new Error('Invalid JSON from leadership analyzer');
  }
}

function generateHeuristicLeadershipAnalysis(
  portfolio: PortfolioData
): LeadershipInitiativeAnalysis {
  const { extracurriculars, achievements } = portfolio;
  const ecCount = extracurriculars?.length || 0;
  const hasAchievements = (achievements?.length || 0) > 0;

  // Simple heuristic scoring
  let score = 5.0;
  let tier: 'transformational' | 'significant' | 'substantial' | 'participatory' = 'substantial';

  if (hasAchievements && ecCount >= 3) {
    tier = 'significant';
    score = 7.0;
  } else if (ecCount >= 5) {
    tier = 'substantial';
    score = 6.0;
  } else if (ecCount < 2) {
    tier = 'participatory';
    score = 4.0;
  }

  return {
    dimension_score: score,
    tier,
    percentile_estimate: 'Unable to estimate (heuristic mode)',
    ec_inventory: [],
    spike_analysis: {
      has_clear_spike: false,
      spike_area: 'Unable to determine',
      spike_tier: 'tier_3',
      depth_score: 'Heuristic analysis - manual review needed',
    },
    initiative_examples: [],
    outcomes_impact: {
      quantitative_impact: [],
      qualitative_impact: [],
      third_party_validation: [],
    },
    strengths: [
      {
        strength: 'Participation in activities',
        evidence: `${ecCount} activities listed`,
        tier_level: 'tier_3',
        why_impressive: 'Shows involvement',
      },
    ],
    weaknesses: [
      {
        weakness: 'Heuristic Analysis',
        evidence: 'LLM analysis failed',
        severity: 'moderate',
        how_to_improve: 'Manual expert review recommended',
      },
    ],
    context_adjustment: {
      applies: false,
      adjustment_type: 'none',
      impact_on_score: 'None',
      justification: 'Heuristic mode - context not evaluated',
    },
    strategic_pivot: {
      current_tier: 'tier_3',
      path_to_next_tier: 'Detailed analysis required',
      recommended_focus: 'Develop depth and measure outcomes',
      timeline: 'N/A',
    },
    key_evidence: ['Heuristic fallback mode - limited evidence'],
  };
}
