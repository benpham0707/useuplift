// @ts-nocheck - Pre-existing type mismatches with portfolio types
/**
 * Stage 2 - Dimension Analyzer 4/6: Community Impact
 *
 * Purpose: Deep-dive assessment of student's community engagement and service
 * - Quality and depth of service (not just hours logged)
 * - Measurable impact on beneficiaries
 * - Connection to personal values and interests
 * - Sustained commitment vs one-time events
 *
 * Calibrated to UC admissions reality:
 * - UCLA: This is HIGHLY valued (20% weight) - "Bruin values"
 * - UC Berkeley: Lower weight (3%) but still positive
 * - UCs as public universities value service to community
 * - Context matters: Family responsibilities = community contribution
 *
 * Weight by mode:
 * - Berkeley: 3% (valued but not differentiating)
 * - UCLA: 20% (CRITICAL - aligns with "Bruin spirit")
 * - General UC: 10% (meaningful contribution to holistic review)
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  PortfolioData,
  CommunityImpactAnalysis,
  UCEvaluationMode,
  HolisticPortfolioUnderstanding,
} from '../types';
import { COMMUNITY_IMPACT_TIERS, UC_CONTEXT_ADJUSTMENTS } from '../constants/ucCalibration';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Stage 2.4: Community Impact Analyzer
 */
export async function analyzeCommunityImpact(
  portfolio: PortfolioData,
  holisticContext: HolisticPortfolioUnderstanding,
  mode: UCEvaluationMode
): Promise<CommunityImpactAnalysis> {
  const systemPrompt = buildSystemPrompt(mode);
  const userPrompt = buildUserPrompt(portfolio, holisticContext, mode);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3000,
      temperature: 0.6,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    return parseCommunityImpactAnalysis(textContent.text);
  } catch (error) {
    console.error('Community Impact analysis failed:', error);

    try {
      console.log('Retrying Community Impact analysis...');
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

      return parseCommunityImpactAnalysis(retryText.text);
    } catch (retryError) {
      console.error('Retry failed, using heuristic:', retryError);
      return generateHeuristicCommunityImpactAnalysis(portfolio);
    }
  }
}

function buildSystemPrompt(mode: UCEvaluationMode): string {
  const modeWeight =
    mode === 'berkeley' ? '3%' : mode === 'ucla' ? '20%' : '10%';
  const modeContext =
    mode === 'ucla'
      ? 'UCLA - THIS IS CRITICAL. UCLA values "Bruin spirit" - service, community, making a difference. This dimension is 20% of evaluation.'
      : mode === 'berkeley'
      ? 'UC Berkeley - Valued but not differentiating (3%). Berkeley focuses more on academics and intellectual curiosity.'
      : 'UC System - Meaningful component (10%). Public universities value service to community.';

  return `You are an expert UC admissions evaluator conducting a **deep-dive analysis of Community Impact** for ${mode === 'berkeley' ? 'UC Berkeley' : mode === 'ucla' ? 'UCLA' : 'UC System'} admissions.

**Dimension Weight**: Community Impact accounts for **${modeWeight}** of holistic evaluation.

**${modeContext}**

---

## WHAT IS COMMUNITY IMPACT?

Community Impact measures:
1. **Meaningful Service**: Not just logging hours, but making genuine difference
2. **Impact on Beneficiaries**: Who was helped? How? Can they measure the change?
3. **Sustained Commitment**: Long-term involvement (2+ years) > one-time events
4. **Connection to Values**: Does service connect to who they are?
5. **Initiative & Leadership**: Did they organize, mobilize, create - or just participate?

**This is NOT about hour counts**. 50 hours of deep, meaningful tutoring > 500 hours of passive "volunteering."

---

## WHY THIS MATTERS FOR UCLA (CRITICAL)

UCLA emphasizes "Bruin Values": **Respect, Accountability, Integrity, Service, Excellence**

UCLA admissions officers look for:
- **Evidence of giving back** to community
- **Connection between service and personal story** (PIQs should reflect this)
- **Leadership in service** (organizing, mobilizing, not just showing up)
- **Sustained commitment** (not just pre-college resume padding)

**Key Insight**: UCLA receives 150,000+ applications. Many have good grades.
Community impact and authentic voice (PIQs) **differentiate** at UCLA.

---

## TIER DEFINITIONS (4-TIER SYSTEM)

### Tier 1: CHANGEMAKER (9.0-10.0) - Top 1-5%
**Examples**:
${COMMUNITY_IMPACT_TIERS.changemaker.examples.map((ex) => `- ${ex}`).join('\n')}

**What This Looks Like**:
- Founded organization serving 200+ families, operating 2+ years
- Created program adopted by school/district (now permanent infrastructure)
- Raised $20k+ for cause with personal involvement (not just fundraising platform)
- Led initiative solving root-cause problem in community
- Received recognition from elected officials or major institutions

**Why Rare**: <5% of applicants create lasting institutional change.

### Tier 2: LEADER (7.0-8.9) - Top 10-20%
**Examples**:
${COMMUNITY_IMPACT_TIERS.leader.examples.map((ex) => `- ${ex}`).join('\n')}

**What This Looks Like**:
- Led service project affecting 50+ people with measurable outcomes
- Organized volunteer program (coordinated 10+ volunteers regularly)
- Created tutoring program with evidence of student improvement
- 200+ hours annually with specific beneficiaries they can name

**Why Impressive**: Demonstrates commitment and ability to mobilize others.

### Tier 3: CONTRIBUTOR (4.0-6.9) - Top 30-50%
**Examples**:
${COMMUNITY_IMPACT_TIERS.contributor.examples.map((ex) => `- ${ex}`).join('\n')}

**What This Looks Like**:
- Regular volunteering at specific org (6+ months, consistent)
- Tutored 5-10 students over sustained period
- Participated in service trips with meaningful follow-up
- Can name specific people/groups they helped and how

**Why Solid**: Shows genuine care but lacks scale or leadership.

### Tier 4: VOLUNTEER (1.0-3.9) - Bottom 50%
**What This Looks Like**:
- Logged hours for requirement (NHS, graduation requirement)
- One-time events (beach cleanup, food drive)
- Cannot name specific beneficiaries
- No sustained commitment or measurable impact

**Why Concerning**: Resume padding without genuine engagement.

---

## CONTEXT ADJUSTMENTS (CRITICAL FOR UCS)

UCs are public universities with a mission to serve California communities.
Context matters enormously for community impact evaluation.

### Family Responsibilities = Community Contribution
${UC_CONTEXT_ADJUSTMENTS.family_responsibilities.description}
- **Caring for siblings** 15+ hrs/week = Tier 2-3 equivalent (responsibility, sacrifice, time management)
- **Translating for parents** = community bridge, cultural contribution
- **Working to support family** = contributing to household, not just "work experience"

### Under-Resourced Communities
- Students from under-resourced communities may have **fewer formal service opportunities**
- But they may have **genuine community ties** (church, neighborhood, family networks)
- Evaluate service in context of what was available

### First-Generation Context
- First-gen students often lack guidance on "strategic" service activities
- But may have authentic service to family and immediate community
- Value genuine contribution over resume-optimized activities

---

## BRUTAL CALIBRATION GUARDS

### Reality Anchors
- **Hour counts are meaningless** without evidence of impact
- **One-time events are Tier 4** (beach cleanup, food drive, walk-a-thon)
- **NHS membership alone is Tier 4** (requirement-driven, not initiative)
- **Most service is passive** - sitting at a booth, handing out flyers
- **Genuine impact is rare** - requires initiative, leadership, sustained commitment

### Red Flags for Grade Inflation
❌ **DON'T** give Tier 1 without evidence of institutional change or major scale
❌ **DON'T** treat hour counts as evidence of impact (100 hours of what?)
❌ **DON'T** inflate passive participation (attended food drive ≠ organized food drive)
❌ **DON'T** reward generic "volunteer at hospital/library" without specific outcomes
❌ **DON'T** ignore resume padding (10 service activities, 1 month each)

✅ **DO** credit genuine initiative (starting programs, mobilizing volunteers)
✅ **DO** value depth over breadth (3 years at one org > 1 month at 10)
✅ **DO** recognize family responsibilities as community contribution
✅ **DO** ask "who was helped and how?" - specifics matter

### Questions That Reveal True Impact
1. "Who specifically did you help?" (Should be able to name people/groups)
2. "What changed because of your work?" (Measurable outcomes)
3. "What would happen if you stopped?" (Indicates dependency/importance)
4. "Why did you choose this cause?" (Connection to values)

---

## OUTPUT FORMAT

Return a JSON object with this exact schema:

\`\`\`json
{
  "dimension_score": 7.5,
  "tier": "leader",
  "percentile_estimate": "Top 15-20%",

  "service_inventory": [
    {
      "activity_name": "string",
      "tier": "tier_1" | "tier_2" | "tier_3" | "tier_4",
      "duration": "string - How long involved?",
      "hours_commitment": "string - Hours per week/month",
      "specific_beneficiaries": "string - Who exactly was helped?",
      "measurable_impact": "string - What changed? Numbers if available",
      "why_this_tier": "string - Justification"
    }
  ],

  "impact_assessment": {
    "quantitative_impact": ["string - Numbers, metrics, scale"],
    "qualitative_impact": ["string - Stories, changes, testimonials"],
    "sustainability": "lasting" | "temporary" | "one_time",
    "depth_vs_breadth": "deep_focused" | "balanced" | "shallow_scattered"
  },

  "connection_to_values": {
    "clear_connection": boolean,
    "explanation": "string - How does service connect to their story?",
    "evidence_in_piqs": "string - Did PIQs reflect service values?"
  },

  "leadership_in_service": {
    "has_organized": boolean,
    "has_mobilized_others": boolean,
    "has_created_programs": boolean,
    "leadership_examples": ["string - Specific leadership actions"]
  },

  "context_adjustment": {
    "applies": boolean,
    "adjustment_type": "family_responsibilities" | "under_resourced" | "first_gen" | "none",
    "family_contribution": "string - If applicable, how family responsibilities count",
    "impact_on_score": "+0.5 to +1.5 points",
    "justification": "string"
  },

  "strengths": [
    {
      "strength": "string",
      "evidence": "string",
      "tier_level": "tier_1" | "tier_2" | "tier_3",
      "why_impressive_for_ucla": "string"
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
    "demonstrates_bruin_values": boolean,
    "service_authenticity": "genuine" | "resume_driven" | "unclear",
    "fit_with_ucla_mission": "strong" | "possible" | "weak"
  },

  "strategic_pivot": {
    "current_tier": "contributor",
    "path_to_next_tier": "string - Specific actions",
    "recommended_focus": "string - Where to invest time",
    "timeline": "string"
  },

  "key_evidence": [
    "string - 3-5 specific pieces of evidence used in evaluation"
  ]
}
\`\`\`

**CRITICAL FOR UCLA**: This dimension is 20% of evaluation. Look for authentic service that connects to values.`;
}

function buildUserPrompt(
  portfolio: PortfolioData,
  holisticContext: HolisticPortfolioUnderstanding,
  mode: UCEvaluationMode
): string {
  const { experiences, personal_context, writing_analysis } = portfolio;

  // Extract service activities
  const serviceActivities =
    experiences?.activities?.filter(
      (ec) =>
        ec.category === 'service' ||
        ec.name?.toLowerCase().includes('volunteer') ||
        ec.name?.toLowerCase().includes('service') ||
        ec.name?.toLowerCase().includes('community') ||
        ec.name?.toLowerCase().includes('tutor')
    ) || [];

  return `Conduct a **deep-dive Community Impact analysis** for this student applying to **${mode === 'berkeley' ? 'UC Berkeley' : mode === 'ucla' ? 'UCLA' : 'UC System'}**.

${mode === 'ucla' ? '⚠️ **UCLA CONTEXT**: This dimension is 20% of evaluation. Look for authentic "Bruin values" - service, community, making a difference.' : ''}

---

## HOLISTIC CONTEXT (from Stage 1)

**Central Thread**: ${holisticContext.central_thread?.narrative || 'Not determined'}

**Key Insights**: ${holisticContext.key_insights?.join(', ') || 'Not specified'}

**Hidden Strengths**:
${holisticContext.hidden_strengths?.map(hs => `- ${hs.strength}: ${hs.why_valuable}`).join('\n') || 'None identified'}

**Context Factors**:
- First-generation: ${holisticContext.context_factors?.first_generation?.applies ? '✅ Yes' : 'No'}
- Low-income: ${personal_context?.background?.low_income ? '✅ Yes' : 'No'}
- Family responsibilities: ${personal_context?.family_responsibilities?.has_responsibilities ? '✅ Yes - ' + personal_context.family_responsibilities.description : 'No'}

---

## SERVICE & COMMUNITY ACTIVITIES

**Total Service Activities Listed**: ${serviceActivities.length}

${
  serviceActivities.length > 0
    ? serviceActivities
        .map(
          (ec, idx) => `
### ${idx + 1}. ${ec.name}
- **Category**: ${ec.category}
- **Role**: ${ec.role || 'Volunteer'}
- **Duration**: ${ec.years_involved || '?'} years (${ec.hours_per_week || '?'} hrs/week)
- **Grade Levels**: ${ec.grade_levels?.join(', ') || 'Not specified'}

**Description**: ${ec.description}

${ec.impact ? `**Impact/Outcomes**: ${ec.impact}` : '**Impact/Outcomes**: Not specified'}

${ec.awards ? `**Recognition**: ${ec.awards.join(', ')}` : ''}
`
        )
        .join('\n')
    : '**No explicit service activities listed** - Will look for service elements in other activities and family context'
}

---

## FAMILY RESPONSIBILITIES (COUNTS AS COMMUNITY CONTRIBUTION)

**Has Family Responsibilities**: ${personal_context?.family_responsibilities?.has_responsibilities ? 'Yes' : 'No'}
${
  personal_context?.family_responsibilities?.has_responsibilities
    ? `
**Description**: ${personal_context.family_responsibilities.description}
**Hours per Week**: ${personal_context.family_responsibilities.hours_per_week || 'Not specified'}

**Note for Evaluation**: Family responsibilities (caring for siblings, translating, household management) demonstrate:
- Responsibility and maturity
- Time management under constraints
- Real contribution to family/community
- Should be counted as Tier 2-3 equivalent
`
    : ''
}

---

## PIQ EVIDENCE OF SERVICE VALUES

**Overall Writing Quality**: ${writing_analysis?.overall_writing_quality || 'N/A'}/100

${
  writing_analysis?.piqs?.length > 0
    ? writing_analysis.piqs
        .map(
          (piq) => `
**PIQ ${piq.prompt_number}** (${piq.prompt_title || 'N/A'}):
- Themes: ${piq.top_strengths?.join(', ') || 'N/A'}
- Evidence of service values: ${piq.essay_text?.substring(0, 200) || 'Not available'}...
`
        )
        .join('\n')
    : '**PIQs not yet analyzed**'
}

---

## CONTEXT FOR EVALUATION

**Background**:
- First-generation: ${personal_context?.background?.first_gen ? 'Yes' : 'No'}
- Low-income: ${personal_context?.background?.low_income ? 'Yes' : 'No'}
- Under-resourced school: ${personal_context?.background?.geographic_diversity ? 'Yes' : 'No'}

**Challenges Overcome**: ${personal_context?.challenges_overcome?.join(', ') || 'None listed'}

**Important Context**:
${personal_context?.background?.low_income ? '- Low-income students may have had fewer "strategic" volunteer opportunities' : ''}
${personal_context?.background?.first_gen ? '- First-gen students may lack guidance on traditional service activities' : ''}
${personal_context?.family_responsibilities?.has_responsibilities ? '- Family responsibilities should be valued as genuine community contribution' : ''}

---

## YOUR TASK

Provide a **rigorous, evidence-based Community Impact analysis** using the tier framework.

**Key Questions to Answer**:
1. ✅ Did they **genuinely help people**? (Not just log hours)
2. ✅ Can they name **specific beneficiaries** and **measurable impact**?
3. ✅ Was their service **sustained** (2+ years) or one-time events?
4. ✅ Did they show **initiative** (organize, create, mobilize) or just participate?
5. ✅ Does service **connect to their values** and story?

**Context Adjustments**:
- Family responsibilities (15+ hrs/week) = Tier 2-3 equivalent
- Under-resourced background = fewer formal opportunities, value authentic ties
- First-gen = may have less "strategic" service, value genuine contribution

**Brutal Honesty Required**:
- Hour counts without impact = Tier 4
- NHS membership alone = Tier 4
- One-time events = Tier 4
- Generic "volunteer at hospital" without specifics = Tier 3 at best

${mode === 'ucla' ? '\n**UCLA CRITICAL**: This is 20% of evaluation. Look for authentic Bruin values - genuine service, not resume padding.' : ''}

Return ONLY the JSON object (no markdown, no extra text).`;
}

function parseCommunityImpactAnalysis(text: string): CommunityImpactAnalysis {
  let jsonText = text.trim();
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonText);

    const result: CommunityImpactAnalysis = {
      score: parsed.dimension_score || 5.0,
      tier: mapTierName(parsed.tier),
      reasoning: {
        service_analysis: parsed.impact_assessment?.depth_vs_breadth || 'Not assessed',
        impact_analysis: parsed.impact_assessment?.sustainability || 'Not assessed',
        commitment_analysis: parsed.service_inventory?.length > 0 ? 'Activities analyzed' : 'No activities',
        beneficiary_analysis: parsed.connection_to_values?.explanation || 'Not assessed',
      },
      tier_evaluation: {
        current_tier: parsed.tier || 'contributor',
        next_tier: getNextTier(parsed.tier),
        tier_reasoning: parsed.strategic_pivot?.path_to_next_tier || 'Not specified',
      },
      strengths: (parsed.strengths || []).map((s: any) => ({
        strength: s.strength || '',
        evidence: [s.evidence || ''],
        rarity_factor: mapRarityFactor(s.tier_level),
      })),
      growth_areas: (parsed.weaknesses || []).map((w: any) => ({
        gap: w.weakness || '',
        severity: w.severity || 'moderate',
        rationale: w.evidence || '',
      })),
      strategic_pivot: parsed.strategic_pivot?.recommended_focus || 'Deepen commitment to one cause',
      comparative_context: {
        vs_typical_uc_applicant: parsed.percentile_estimate || 'Unknown',
        vs_top_10_percent:
          parsed.ucla_specific_assessment?.fit_with_ucla_mission === 'strong'
            ? 'Competitive'
            : 'Below average',
        uc_campus_alignment:
          parsed.ucla_specific_assessment?.demonstrates_bruin_values
            ? 'Strong fit for UCLA'
            : 'General UC fit',
      },
      confidence: 0.8,
    };

    return result;
  } catch (error) {
    console.error('Failed to parse community impact analysis JSON:', error);
    throw new Error('Invalid JSON from community impact analyzer');
  }
}

function mapTierName(tier: string): 'exceptional' | 'strong' | 'developing' | 'foundational' {
  const tierMap: Record<string, 'exceptional' | 'strong' | 'developing' | 'foundational'> = {
    changemaker: 'exceptional',
    leader: 'strong',
    contributor: 'developing',
    volunteer: 'foundational',
    exceptional: 'exceptional',
    strong: 'strong',
    developing: 'developing',
    foundational: 'foundational',
  };
  return tierMap[tier?.toLowerCase()] || 'developing';
}

function getNextTier(currentTier: string): string {
  const progression: Record<string, string> = {
    volunteer: 'contributor',
    contributor: 'leader',
    leader: 'changemaker',
    changemaker: 'changemaker (already at top)',
    foundational: 'developing',
    developing: 'strong',
    strong: 'exceptional',
    exceptional: 'exceptional (already at top)',
  };
  return progression[currentTier?.toLowerCase()] || 'strong';
}

function mapRarityFactor(tierLevel: string): 'Top 1-5%' | 'Top 10-20%' | 'Top 25-40%' | 'Common' {
  const rarityMap: Record<string, 'Top 1-5%' | 'Top 10-20%' | 'Top 25-40%' | 'Common'> = {
    tier_1: 'Top 1-5%',
    tier_2: 'Top 10-20%',
    tier_3: 'Top 25-40%',
    tier_4: 'Common',
  };
  return rarityMap[tierLevel] || 'Common';
}

function generateHeuristicCommunityImpactAnalysis(
  portfolio: PortfolioData
): CommunityImpactAnalysis {
  const { experiences, personal_context } = portfolio;

  // Count service activities
  const serviceActivities =
    experiences?.activities?.filter(
      (ec) =>
        ec.category === 'service' ||
        ec.name?.toLowerCase().includes('volunteer') ||
        ec.name?.toLowerCase().includes('community')
    ) || [];

  // Check for family responsibilities
  const hasFamilyResponsibilities = personal_context?.family_responsibilities?.has_responsibilities;

  let score = 5.0;
  let tier: 'exceptional' | 'strong' | 'developing' | 'foundational' = 'developing';

  if (serviceActivities.length >= 3 || hasFamilyResponsibilities) {
    tier = 'strong';
    score = 7.0;
  } else if (serviceActivities.length >= 1) {
    tier = 'developing';
    score = 5.5;
  } else {
    tier = 'foundational';
    score = 3.5;
  }

  return {
    score,
    tier,
    reasoning: {
      service_analysis: 'Heuristic assessment based on activity count',
      impact_analysis: 'Unable to assess impact in heuristic mode',
      commitment_analysis: `${serviceActivities.length} service activities detected`,
      beneficiary_analysis: 'Manual review needed',
    },
    tier_evaluation: {
      current_tier: tier,
      next_tier: getNextTier(tier),
      tier_reasoning: 'Heuristic fallback - detailed analysis needed',
    },
    strengths: [
      {
        strength: 'Service Activities',
        evidence: [`${serviceActivities.length} service activities listed`],
        rarity_factor: 'Common',
      },
    ],
    growth_areas: [
      {
        gap: 'Heuristic Analysis',
        severity: 'moderate',
        rationale: 'LLM analysis failed - manual review needed',
      },
    ],
    strategic_pivot: 'Deepen commitment to one cause with measurable impact',
    comparative_context: {
      vs_typical_uc_applicant: 'Unable to determine',
      vs_top_10_percent: 'Unable to determine',
      uc_campus_alignment: 'Manual review needed',
    },
    confidence: 0.4,
  };
}
