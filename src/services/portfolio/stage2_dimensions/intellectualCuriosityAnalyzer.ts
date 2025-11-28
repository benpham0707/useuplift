// @ts-nocheck - Pre-existing type mismatches with portfolio types
/**
 * Stage 2 - Dimension Analyzer 3/6: Intellectual Curiosity
 *
 * Purpose: Deep-dive assessment of student's intellectual curiosity and exploration
 * - Self-directed learning beyond classroom
 * - Research and independent projects
 * - Depth of exploration in areas of interest
 * - Academic risk-taking and intellectual engagement
 *
 * Calibrated to UC admissions reality:
 * - UC Berkeley: This is the MOST valued dimension (25% weight)
 * - Berkeley seeks future researchers, scholars, innovators
 * - Research experience (even unpublished) is highly valued
 * - Self-directed learning signals readiness for independent work
 * - Academic competitions (USAMO, Science Olympiad, USACO) are strong signals
 *
 * Weight by mode:
 * - Berkeley: 25% (second only to academics - CRITICAL differentiator)
 * - UCLA: 3% (valued but not primary focus)
 * - General UC: 10% (moderate importance)
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  PortfolioData,
  IntellectualCuriosityAnalysis,
  UCEvaluationMode,
  HolisticPortfolioUnderstanding,
} from '../types';
import { INTELLECTUAL_CURIOSITY_TIERS } from '../constants/ucCalibration';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Stage 2.3: Intellectual Curiosity Analyzer
 */
export async function analyzeIntellectualCuriosity(
  portfolio: PortfolioData,
  holisticContext: HolisticPortfolioUnderstanding,
  mode: UCEvaluationMode
): Promise<IntellectualCuriosityAnalysis> {
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

    return parseIntellectualCuriosityAnalysis(textContent.text);
  } catch (error) {
    console.error('Intellectual Curiosity analysis failed:', error);

    try {
      console.log('Retrying Intellectual Curiosity analysis...');
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

      return parseIntellectualCuriosityAnalysis(retryText.text);
    } catch (retryError) {
      console.error('Retry failed, using heuristic:', retryError);
      return generateHeuristicIntellectualCuriosityAnalysis(portfolio);
    }
  }
}

function buildSystemPrompt(mode: UCEvaluationMode): string {
  const modeWeight =
    mode === 'berkeley' ? '25%' : mode === 'ucla' ? '3%' : '10%';
  const modeContext =
    mode === 'berkeley'
      ? 'UC Berkeley - THIS IS CRITICAL. Berkeley is a research university seeking future scholars. Intellectual curiosity is the #2 dimension after academics.'
      : mode === 'ucla'
      ? 'UCLA - Valued but not primary. UCLA focuses more on community and voice.'
      : 'UC System - Moderate importance across campuses.';

  return `You are an expert UC admissions evaluator conducting a **deep-dive analysis of Intellectual Curiosity** for ${mode === 'berkeley' ? 'UC Berkeley' : mode === 'ucla' ? 'UCLA' : 'UC System'} admissions.

**Dimension Weight**: Intellectual Curiosity accounts for **${modeWeight}** of holistic evaluation.

**${modeContext}**

---

## WHAT IS INTELLECTUAL CURIOSITY?

Intellectual Curiosity measures:
1. **Self-Directed Learning**: Do they learn beyond what's assigned?
2. **Research & Independent Projects**: Have they done original work?
3. **Depth of Exploration**: How deep do they go in areas of interest?
4. **Academic Risk-Taking**: Do they challenge themselves intellectually?
5. **Evidence of Passion**: Can they talk passionately about intellectual interests?

**This is NOT about having good grades**. It's about genuine love of learning.

---

## WHY THIS MATTERS FOR UC BERKELEY (CRITICAL)

UC Berkeley is a **premier research university**. Admissions officers are looking for:
- **Future researchers and scholars** (not just good students)
- **Self-directed learners** who will thrive in Berkeley's independent environment
- **Intellectual risk-takers** who pursue hard questions
- **Evidence of genuine curiosity** (not resume padding)

**Key Insight**: At Berkeley, ~74% of admits have near-perfect GPAs. Academics are **baseline**.
Intellectual curiosity is what **differentiates** top applicants.

---

## TIER DEFINITIONS (4-TIER SYSTEM)

### Tier 1: SCHOLAR (9.0-10.0) - Top 1-5%
**Examples**:
${INTELLECTUAL_CURIOSITY_TIERS.scholar.examples.map((ex) => `- ${ex}`).join('\n')}

**What This Looks Like**:
- Published research or presented at academic conference
- Intel/Regeneron Science Fair finalist
- USAMO/USACO Platinum/IMO qualifier
- Created significant open-source project (1000+ stars/users)
- Independent research with university professor

**Why Rare**: <5% of applicants have done genuine original work or achieved national academic recognition.

### Tier 2: EXPLORER (7.0-8.9) - Top 10-20%
**Examples**:
${INTELLECTUAL_CURIOSITY_TIERS.explorer.examples.map((ex) => `- ${ex}`).join('\n')}

**What This Looks Like**:
- Selective summer research program (COSMOS, SSP, RSI, etc.)
- Multiple personal coding projects or contributions to open source
- Regional/state science fair awards
- Self-taught college-level material and applied it
- Started educational blog/YouTube with quality content

**Why Impressive**: Demonstrates genuine interest and initiative beyond assignments.

### Tier 3: LEARNER (4.0-6.9) - Top 30-50%
**Examples**:
${INTELLECTUAL_CURIOSITY_TIERS.learner.examples.map((ex) => `- ${ex}`).join('\n')}

**What This Looks Like**:
- Completed online courses (Coursera, edX) with certificates
- Attended non-selective summer programs
- Read extensively in area of interest (can discuss books/papers)
- Basic independent projects (school science fair, personal website)
- Member of academic clubs (Science Olympiad, Math League)

**Why Solid**: Shows interest but lacks depth or standout achievement.

### Tier 4: STUDENT (1.0-3.9) - Bottom 50%
**What This Looks Like**:
- Learning is primarily assigned (no self-directed exploration)
- No independent projects or research
- Academic clubs listed but no notable involvement
- "Interested in science" without evidence of action

**Why Concerning**: At research universities, passive learning is not sufficient.

---

## BRUTAL CALIBRATION GUARDS

### Reality Anchors
- **Most students do NOT have genuine research experience** - it's rare
- **"I like math" is not intellectual curiosity** - show evidence
- **Taking APs = academic rigor, NOT intellectual curiosity** (different dimension)
- **Summer programs vary wildly** - SSP/RSI = Tier 1; generic camp = Tier 3/4
- **School science fair alone is NOT Tier 1** - regional/state+ needed

### Red Flags for Grade Inflation
❌ **DON'T** give Tier 1 without published research, national awards, or exceptional projects
❌ **DON'T** confuse taking hard classes with intellectual curiosity
❌ **DON'T** treat non-selective summer programs as major achievements
❌ **DON'T** inflate "interested in..." without evidence of action
❌ **DON'T** count resume-padding activities (joining 10 academic clubs with no depth)

✅ **DO** credit genuine self-directed learning with evidence
✅ **DO** value depth over breadth (one deep project > five shallow ones)
✅ **DO** recognize independent work even if not formally published
✅ **DO** distinguish selective programs (RSI, SSP, COSMOS) from generic ones

### Program Selectivity Reference
**Tier 1 Programs** (< 5% acceptance): RSI, SSP, MOSTEC, Garcia MRSEC, Simons
**Tier 2 Programs** (10-20% acceptance): COSMOS, CSSSA, Clark Scholars, TASP
**Tier 3 Programs** (>30% acceptance): Generic university summer courses, most online programs

---

## OUTPUT FORMAT

Return a JSON object with this exact schema:

\`\`\`json
{
  "dimension_score": 7.5,
  "tier": "explorer",
  "percentile_estimate": "Top 15-20%",

  "self_directed_learning": {
    "evidence": ["string - Specific examples of learning beyond classroom"],
    "assessment": "strong" | "moderate" | "limited" | "none",
    "depth_of_exploration": "string - How deep do they go?"
  },

  "research_experience": {
    "has_formal_research": boolean,
    "research_description": "string - What research, with whom, what outcomes?",
    "tier_assessment": "tier_1" | "tier_2" | "tier_3" | "tier_4" | "none",
    "evidence_of_outcomes": "string - Papers, presentations, awards?"
  },

  "independent_projects": [
    {
      "project_name": "string",
      "description": "string",
      "tier": "tier_1" | "tier_2" | "tier_3" | "tier_4",
      "evidence_of_depth": "string - How deep? How long? What outcomes?",
      "why_impressive": "string"
    }
  ],

  "academic_competitions": {
    "competitions_listed": ["string - Competition names and levels"],
    "highest_achievement": "string - Best result (e.g., 'USAMO qualifier', 'State Science Fair 2nd place')",
    "tier_assessment": "tier_1" | "tier_2" | "tier_3" | "tier_4" | "none"
  },

  "summer_programs": {
    "programs_attended": [
      {
        "program_name": "string",
        "selectivity": "highly_selective" | "selective" | "non_selective",
        "tier": "tier_1" | "tier_2" | "tier_3",
        "what_they_did": "string"
      }
    ],
    "overall_assessment": "string"
  },

  "intellectual_passion": {
    "can_articulate_interests": boolean,
    "evidence_from_piqs": "string - Did PIQs demonstrate intellectual passion?",
    "depth_of_knowledge": "exceptional" | "strong" | "surface" | "none"
  },

  "strengths": [
    {
      "strength": "string",
      "evidence": "string - Quote specific activities/achievements",
      "tier_level": "tier_1" | "tier_2" | "tier_3",
      "why_impressive_for_berkeley": "string"
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

  "berkeley_specific_assessment": {
    "ready_for_research_university": boolean,
    "evidence_of_scholarly_potential": "string",
    "fit_with_berkeley_mission": "strong" | "possible" | "weak"
  },

  "strategic_pivot": {
    "current_tier": "explorer",
    "path_to_next_tier": "string - Specific actions",
    "recommended_focus": "string - Where to invest time",
    "timeline": "string",
    "is_achievable": boolean
  },

  "key_evidence": [
    "string - 3-5 specific pieces of evidence used in evaluation"
  ]
}
\`\`\`

**CRITICAL FOR BERKELEY**: This dimension is 25% of evaluation. Be rigorous but recognize genuine curiosity.`;
}

function buildUserPrompt(
  portfolio: PortfolioData,
  holisticContext: HolisticPortfolioUnderstanding,
  mode: UCEvaluationMode
): string {
  const { experiences, writing_analysis, goals } = portfolio;

  // Extract intellectual activities
  const intellectualActivities =
    experiences?.activities?.filter(
      (ec) =>
        ec.category === 'stem' ||
        ec.category === 'academic_prep' ||
        ec.name?.toLowerCase().includes('research') ||
        ec.name?.toLowerCase().includes('science') ||
        ec.name?.toLowerCase().includes('olympiad') ||
        ec.description?.toLowerCase().includes('research') ||
        ec.description?.toLowerCase().includes('independent project')
    ) || [];

  return `Conduct a **deep-dive Intellectual Curiosity analysis** for this student applying to **${mode === 'berkeley' ? 'UC Berkeley' : mode === 'ucla' ? 'UCLA' : 'UC System'}**.

${mode === 'berkeley' ? '⚠️ **BERKELEY CONTEXT**: This dimension is 25% of evaluation. Be rigorous but fair.' : ''}

---

## HOLISTIC CONTEXT (from Stage 1)

**Central Thread**: ${holisticContext.overallFirstImpression}

**Key Strengths**: ${holisticContext.keyStrengths?.join(', ') || 'Not specified'}

**Intellectual Coherence Score**: ${holisticContext.intellectualCoherence?.score || 'N/A'}/10
**Intellectual Coherence Explanation**: ${holisticContext.intellectualCoherence?.explanation || 'Not assessed'}

**Depth vs Breadth**: ${holisticContext.depthVsBreadth?.assessment || 'Not assessed'}
${holisticContext.depthVsBreadth?.explanation || ''}

---

## INTELLECTUAL ACTIVITIES & PROJECTS

**Total Activities Relevant to Intellectual Curiosity**: ${intellectualActivities.length}

${
  intellectualActivities.length > 0
    ? intellectualActivities
        .map(
          (ec, idx) => `
### ${idx + 1}. ${ec.name}
- **Category**: ${ec.category}
- **Role**: ${ec.role || 'Participant'}
- **Duration**: ${ec.years_involved || '?'} years (${ec.hours_per_week || '?'} hrs/week)

**Description**: ${ec.description}

${ec.impact ? `**Impact/Outcomes**: ${ec.impact}` : '**Impact/Outcomes**: Not specified'}

${ec.awards ? `**Awards/Recognition**: ${ec.awards.join(', ')}` : ''}
`
        )
        .join('\n')
    : '**No intellectual activities explicitly listed** - Will look for evidence in other sections'
}

---

## RESEARCH EXPERIENCE

${
  experiences?.activities?.filter(
    (ec) =>
      ec.name?.toLowerCase().includes('research') ||
      ec.description?.toLowerCase().includes('research') ||
      ec.category === 'stem'
  ).length > 0
    ? experiences.activities
        .filter(
          (ec) =>
            ec.name?.toLowerCase().includes('research') ||
            ec.description?.toLowerCase().includes('research') ||
            ec.category === 'stem'
        )
        .map(
          (research) => `
- **${research.name}**: ${research.description}
  - Duration: ${research.years_involved || '?'} years
  - Outcomes: ${research.impact || 'Not specified'}
  ${research.awards ? `- Recognition: ${research.awards.join(', ')}` : ''}
`
        )
        .join('\n')
    : '**No formal research experience listed**'
}

---

## ACADEMIC COMPETITIONS & AWARDS

${
  experiences?.activities?.filter(
    (ec) =>
      ec.name?.toLowerCase().includes('olympiad') ||
      ec.name?.toLowerCase().includes('competition') ||
      ec.name?.toLowerCase().includes('mathcounts') ||
      ec.name?.toLowerCase().includes('usamo') ||
      ec.name?.toLowerCase().includes('usaco')
  ).length > 0
    ? experiences.activities
        .filter(
          (ec) =>
            ec.name?.toLowerCase().includes('olympiad') ||
            ec.name?.toLowerCase().includes('competition') ||
            ec.name?.toLowerCase().includes('mathcounts') ||
            ec.name?.toLowerCase().includes('usamo') ||
            ec.name?.toLowerCase().includes('usaco')
        )
        .map((comp) => `- **${comp.name}**: ${comp.impact || comp.description}`)
        .join('\n')
    : '**No academic competitions listed**'
}

---

## PIQ EVIDENCE OF INTELLECTUAL CURIOSITY

**Overall Writing Quality**: ${writing_analysis?.overall_writing_quality || 'N/A'}/100

${
  writing_analysis?.piqs?.length > 0
    ? writing_analysis.piqs
        .map(
          (piq) => `
**PIQ ${piq.prompt_number}** (${piq.prompt_title || 'N/A'}):
- Narrative Quality: ${piq.narrative_quality_index || 'N/A'}/100
- Key Themes: ${piq.top_strengths?.join(', ') || 'N/A'}
- Evidence of intellectual passion: ${piq.essay_text?.substring(0, 200) || 'Not available'}...
`
        )
        .join('\n')
    : '**PIQs not yet analyzed**'
}

---

## INTENDED MAJOR & ACADEMIC INTERESTS

**Intended Major**: ${goals?.intended_major || 'Undeclared'}
**Why This Major**: ${goals?.why_major || 'Not specified'}
**Career Goals**: ${goals?.career_goals || 'Not specified'}

---

## YOUR TASK

Provide a **rigorous, evidence-based Intellectual Curiosity analysis** using the tier framework.

**Key Questions to Answer**:
1. ✅ Does this student learn **beyond what's assigned**?
2. ✅ Have they done **original research or independent projects**?
3. ✅ How **deep** do they go in areas of interest (vs surface-level)?
4. ✅ Is there evidence of **genuine passion** (not resume padding)?
5. ✅ Are they **ready for a research university** like Berkeley?

**Brutal Honesty Required**:
- Tier 1 requires published research, national recognition, or exceptional projects
- Tier 2 requires selective programs, substantial independent work, or regional recognition
- Taking hard classes is NOT intellectual curiosity (that's Academic Excellence)
- "Interested in..." without evidence = Tier 4

${mode === 'berkeley' ? '\n**BERKELEY CRITICAL**: This is 25% of evaluation. Look for evidence of scholarly potential and self-directed learning.' : ''}

Return ONLY the JSON object (no markdown, no extra text).`;
}

function parseIntellectualCuriosityAnalysis(text: string): IntellectualCuriosityAnalysis {
  let jsonText = text.trim();
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonText);

    const result: IntellectualCuriosityAnalysis = {
      score: parsed.dimension_score || 5.0,
      tier: mapTierName(parsed.tier),
      reasoning: {
        exploration_analysis: parsed.self_directed_learning?.assessment || 'Not assessed',
        depth_analysis: parsed.self_directed_learning?.depth_of_exploration || 'Not assessed',
        independence_analysis: parsed.intellectual_passion?.depth_of_knowledge || 'Not assessed',
        research_analysis: parsed.research_experience?.research_description || 'No research',
      },
      tier_evaluation: {
        current_tier: parsed.tier || 'learner',
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
      strategic_pivot: parsed.strategic_pivot?.recommended_focus || 'Develop depth in core interest area',
      comparative_context: {
        vs_typical_uc_applicant: parsed.percentile_estimate || 'Unknown',
        vs_top_10_percent:
          parsed.berkeley_specific_assessment?.fit_with_berkeley_mission === 'strong'
            ? 'Competitive'
            : 'Below average',
        uc_campus_alignment:
          parsed.berkeley_specific_assessment?.ready_for_research_university
            ? 'Strong fit for Berkeley'
            : 'Better fit for general UCs',
      },
      confidence: 0.8,
    };

    return result;
  } catch (error) {
    console.error('Failed to parse intellectual curiosity analysis JSON:', error);
    throw new Error('Invalid JSON from intellectual curiosity analyzer');
  }
}

function mapTierName(tier: string): 'exceptional' | 'strong' | 'developing' | 'foundational' {
  const tierMap: Record<string, 'exceptional' | 'strong' | 'developing' | 'foundational'> = {
    scholar: 'exceptional',
    explorer: 'strong',
    learner: 'developing',
    student: 'foundational',
    exceptional: 'exceptional',
    strong: 'strong',
    developing: 'developing',
    foundational: 'foundational',
  };
  return tierMap[tier?.toLowerCase()] || 'developing';
}

function getNextTier(currentTier: string): string {
  const progression: Record<string, string> = {
    student: 'learner',
    learner: 'explorer',
    explorer: 'scholar',
    scholar: 'scholar (already at top)',
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

function generateHeuristicIntellectualCuriosityAnalysis(
  portfolio: PortfolioData
): IntellectualCuriosityAnalysis {
  const { experiences } = portfolio;

  // Count research/STEM activities
  const intellectualActivities =
    experiences?.activities?.filter(
      (ec) =>
        ec.category === 'stem' ||
        ec.category === 'academic_prep' ||
        ec.name?.toLowerCase().includes('research')
    ) || [];

  let score = 5.0;
  let tier: 'exceptional' | 'strong' | 'developing' | 'foundational' = 'developing';

  if (intellectualActivities.length >= 3) {
    tier = 'strong';
    score = 7.0;
  } else if (intellectualActivities.length >= 1) {
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
      exploration_analysis: 'Heuristic assessment based on activity count',
      depth_analysis: 'Unable to determine depth in heuristic mode',
      independence_analysis: 'Manual review needed',
      research_analysis: intellectualActivities.length > 0 ? 'Some STEM activities present' : 'No research detected',
    },
    tier_evaluation: {
      current_tier: tier,
      next_tier: getNextTier(tier),
      tier_reasoning: 'Heuristic fallback - detailed analysis needed',
    },
    strengths: [
      {
        strength: 'Activities Listed',
        evidence: [`${intellectualActivities.length} STEM/research activities`],
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
    strategic_pivot: 'Pursue independent research or selective summer program',
    comparative_context: {
      vs_typical_uc_applicant: 'Unable to determine',
      vs_top_10_percent: 'Unable to determine',
      uc_campus_alignment: 'Manual review needed',
    },
    confidence: 0.4,
  };
}
