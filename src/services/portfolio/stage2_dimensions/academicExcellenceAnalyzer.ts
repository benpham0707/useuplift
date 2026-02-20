// @ts-nocheck - Pre-existing type mismatches with portfolio types
/**
 * Stage 2 - Dimension Analyzer 1/6: Academic Excellence
 *
 * Purpose: Deep-dive assessment of student's academic profile
 * - GPA in context of school resources
 * - Course rigor and challenge-seeking behavior
 * - Grade trends and consistency
 * - UC-specific a-g requirements and UC-weighted GPA
 *
 * Calibrated to UC admissions reality:
 * - NACAC: 76.8% of colleges rate GPA as #1 factor
 * - UC Berkeley middle 50%: 4.15-4.29 weighted GPA
 * - UCLA middle 50%: 4.20-4.34 weighted GPA
 * - UC policy: Test-blind, capped at 8 semesters of honors weighting
 *
 * Weight by mode:
 * - Berkeley: 35% (important but not sole differentiator)
 * - UCLA: 30% (co-equal with PIQs/voice)
 * - General UC: 40% (primary factor)
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  PortfolioData,
  AcademicExcellenceAnalysis,
  UCEvaluationMode,
  HolisticPortfolioUnderstanding,
} from '../types';
import {
  ACADEMIC_EXCELLENCE_TIERS,
  UC_CONTEXT_ADJUSTMENTS,
  getUCGPABenchmark,
  isCompetitiveGPA,
} from '../constants/ucCalibration';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Stage 2.1: Academic Excellence Analyzer
 */
export async function analyzeAcademicExcellence(
  portfolio: PortfolioData,
  holisticContext: HolisticPortfolioUnderstanding,
  mode: UCEvaluationMode
): Promise<AcademicExcellenceAnalysis> {
  const systemPrompt = buildSystemPrompt(mode);
  const userPrompt = buildUserPrompt(portfolio, holisticContext, mode);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3000,
      temperature: 0.5, // Moderate creativity for contextual analysis
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    return parseAcademicAnalysis(textContent.text);
  } catch (error) {

    // Retry once
    try {
      const retryResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 3000,
        temperature: 0.5,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const retryText = retryResponse.content.find((block) => block.type === 'text');
      if (!retryText || retryText.type !== 'text') {
        throw new Error('No text content in retry');
      }

      return parseAcademicAnalysis(retryText.text);
    } catch (retryError) {
      return generateHeuristicAcademicAnalysis(portfolio, mode);
    }
  }
}

function buildSystemPrompt(mode: UCEvaluationMode): string {
  const modeWeight =
    mode === 'berkeley' ? '35%' : mode === 'ucla' ? '30%' : '40%';

  return `You are an expert UC admissions evaluator conducting a **deep-dive analysis of Academic Excellence** for ${mode === 'berkeley' ? 'UC Berkeley' : mode === 'ucla' ? 'UCLA' : 'UC System'} admissions.

**Dimension Weight**: Academic Excellence accounts for **${modeWeight}** of holistic evaluation for ${mode === 'berkeley' ? 'Berkeley' : mode === 'ucla' ? 'UCLA' : 'UCs'}.

---

## WHAT IS ACADEMIC EXCELLENCE?

Academic Excellence measures:
1. **GPA Performance**: Sustained high achievement in core academic courses
2. **Course Rigor**: Challenge-seeking behavior (taking hardest courses available)
3. **Grade Trends**: Consistency and improvement over time
4. **UC Preparation**: Meeting a-g requirements with depth beyond minimums
5. **Context-Aware**: Performance relative to school resources and personal circumstances

**NOT Just About Numbers**: A 4.0 GPA at a well-resourced school with 30 APs ≠ 3.85 GPA at under-resourced school with 5 APs. Context matters enormously.

---

## UC ACADEMIC REALITY (CALIBRATION DATA)

### GPA Benchmarks (Middle 50% of Admits)
- **UC Berkeley**: 4.15-4.29 weighted (11.3% acceptance)
- **UCLA**: 4.20-4.34 weighted (9% acceptance)
- **General UCs**: 3.90-4.20 weighted (varies by campus)

**Critical Insight**: 74% of Ivy admits have 4.0 unweighted GPAs. At top UCs, strong GPA is **baseline**, not differentiator.

### UC-Weighted GPA Policy
- **Capped at 8 semesters** of honors/AP/IB courses (grades 10-11)
- Only UC-certified honors courses get the +1.0 boost
- All APs and IBs get the boost
- UC calculates GPA themselves (transcript-based)

### Course Rigor Matters More Than You Think
- NACAC: 63.8% of colleges rate course rigor as "considerable importance"
- Taking hardest courses available > taking easy courses for GPA boost
- **Challenge-seeking behavior** signals readiness for rigorous college work

### Context Adjustments (Based on Research)
${Object.entries(UC_CONTEXT_ADJUSTMENTS)
  .slice(0, 4)
  .map(([key, adj]) => `- **${key.replace(/_/g, ' ')}**: ${adj.description}`)
  .join('\n')}

---

## TIER DEFINITIONS (4-TIER SYSTEM)

### Tier 1: EXCEPTIONAL (9.0-10.0)
**UC Berkeley Standards**:
- Weighted GPA: 4.25+ (top 75th percentile)
- Unweighted: 3.95+
- 12+ APs/IBs or equivalent rigor
- Upward grade trend (all A's in junior year)

**Profile**: Top 5% nationally. Near-perfect GPA with maximum rigor. Sustains excellence even in hardest courses. Ready for Berkeley's academic intensity.

**Evidence Required**:
- All As or A+s in core academic courses (grades 10-11)
- 10+ honors/AP courses with As
- Took hardest math/science available
- Strong performance in 12th grade (if applicable)

### Tier 2: STRONG (7.0-8.9)
**UC Berkeley Standards**:
- Weighted GPA: 4.05-4.24
- Unweighted: 3.85-3.94
- 8-11 APs/IBs
- Consistent performance (mostly As, occasional B)

**Profile**: Top 10-20% nationally. Very strong academic record. Competitive for mid-tier UCs, possible for top UCs with strong PIQs/context.

**Evidence Required**:
- Mostly As in rigorous courses
- 6-9 honors/AP courses
- Challenged themselves appropriately
- Upward trend if any dips

### Tier 3: DEVELOPING (4.0-6.9)
**General UC Standards**:
- Weighted GPA: 3.70-4.04
- Unweighted: 3.50-3.84
- 3-7 APs/IBs
- Some inconsistency (Bs and Cs mixed with As)

**Profile**: Top 30-50% nationally. Meets UC eligibility. Competitive for UCR, UCM, UCSC. Needs strong PIQs for mid-tier UCs.

**Evidence Required**:
- Meets a-g requirements
- Took some challenging courses
- Improvement trend preferred
- Strengths in specific subject areas

### Tier 4: FOUNDATIONAL (1.0-3.9)
**Below UC Competitive Range**:
- Weighted GPA: Below 3.70
- Limited rigor (0-2 APs)
- Significant inconsistency or declining trend

**Profile**: Below typical UC admit range. May qualify for admission by exception with extraordinary context (foster youth, homelessness, severe family hardship).

**Note**: We don't give scores below 4.0 to discourage students. This tier indicates significant academic growth needed or extraordinary circumstances.

---

## BRUTAL CALIBRATION GUARDS

### Reality Anchors
- A **4.0 unweighted GPA is common** among top UC admits (not exceptional)
- **Course rigor matters as much as GPA** - 3.9 with 12 APs > 4.0 with 2 APs
- **Context adjustments are real** but require evidence of adversity
- **Grade trends matter** - upward trend can offset lower early grades
- **Senior year rigor counts** - taking easy classes senior year is a red flag

### Red Flags for Grade Inflation
❌ **DON'T** give Tier 1 unless GPA is truly exceptional (4.20+ weighted for Berkeley)
❌ **DON'T** ignore declining grades junior year (critical evaluation period)
❌ **DON'T** inflate context adjustments without clear evidence
❌ **DON'T** treat "took 1 AP" as rigorous course load
❌ **DON'T** give high scores to students who avoided challenging courses

✅ **DO** recognize genuine academic excellence backed by evidence
✅ **DO** adjust for under-resourced schools with limited AP offerings
✅ **DO** credit upward trends and recovery from challenges
✅ **DO** value depth in core subjects (math, science, English, history)

---

## OUTPUT FORMAT

Return a JSON object with this exact schema:

\`\`\`json
{
  "dimension_score": 7.5,
  "tier": "strong",
  "percentile_estimate": "Top 15-20% nationally",

  "gpa_analysis": {
    "uc_weighted_gpa": 4.18,
    "percentile_vs_target": "50th-75th for Berkeley",
    "context_adjusted_assessment": "string - How context affects evaluation",
    "grade_trend": "upward" | "consistent" | "declining",
    "trend_explanation": "string"
  },

  "rigor_analysis": {
    "course_load_assessment": "exceptional" | "strong" | "adequate" | "limited",
    "challenge_seeking_behavior": "string - Did they take hardest courses available?",
    "standout_courses": ["List of impressive courses"],
    "missed_opportunities": ["Courses they should have taken but didn't"]
  },

  "uc_preparation": {
    "ag_requirements_status": "exceeded" | "met" | "in_progress" | "deficient",
    "courses_beyond_minimum": 8,
    "stem_depth": "strong" | "adequate" | "weak",
    "humanities_depth": "strong" | "adequate" | "weak"
  },

  "strengths": [
    {
      "strength": "string",
      "evidence": "string - Quote specific courses/grades",
      "why_impressive": "string"
    }
  ],

  "weaknesses": [
    {
      "weakness": "string",
      "evidence": "string",
      "severity": "critical" | "moderate" | "minor",
      "can_improve": boolean,
      "how_to_improve": "string"
    }
  ],

  "strategic_pivot": {
    "current_tier": "strong",
    "path_to_next_tier": "string - Specific actions to reach Tier 1",
    "timeline": "string - When improvements should happen",
    "is_achievable": boolean
  },

  "key_evidence": [
    "string - 3-5 specific pieces of evidence used in evaluation"
  ]
}
\`\`\`

**CRITICAL REQUIREMENTS**:
1. **Base score on SPECIFIC EVIDENCE** from transcript
2. **Quote actual course names and grades** in evidence sections
3. **Compare to UC benchmarks** explicitly
4. **Adjust for context** only with clear justification
5. **Be BRUTALLY HONEST** about weaknesses
6. **Provide ACTIONABLE** strategic pivots

Remember: Students deserve truth, not comforting myths. A Tier 2 score is excellent! Not everyone is Tier 1.`;
}

function buildUserPrompt(
  portfolio: PortfolioData,
  holisticContext: HolisticPortfolioUnderstanding,
  mode: UCEvaluationMode
): string {
  const { academic, profile, personal_context } = portfolio;
  const benchmark = getUCGPABenchmark(mode, '50th');

  // Extract context values safely
  const apsOffered = personal_context?.school_context?.total_aps_offered ?? 20;
  const isUnderResourced = apsOffered < 10;

  return `Conduct a **deep-dive Academic Excellence analysis** for this student applying to **${mode === 'berkeley' ? 'UC Berkeley' : mode === 'ucla' ? 'UCLA' : 'UC System'}**.

---

## HOLISTIC CONTEXT (from Stage 1)

**Central Thread**: ${holisticContext.central_thread?.narrative || 'Not determined'}

**Key Insights**:
${holisticContext.key_insights?.map((insight) => `- ${insight}`).join('\n') || '- No key insights available'}

**Context Factors**:
- First-generation: ${holisticContext.context_factors?.first_generation?.applies ? '✅ Yes - ' + holisticContext.context_factors.first_generation.impact : 'No'}
- Low-income: ${holisticContext.context_factors?.low_income?.applies ? '✅ Yes - ' + holisticContext.context_factors.low_income.impact : 'No'}
- Under-resourced school: ${holisticContext.context_factors?.under_resourced_school?.applies ? '✅ Yes - ' + holisticContext.context_factors.under_resourced_school.impact : 'No'}

---

## ACADEMIC PROFILE

### GPA Overview
- **UC-Weighted GPA**: ${academic.gpa_weighted.toFixed(2)}
  - **Benchmark for ${mode}**: ${benchmark.weighted} (50th percentile)
  - **Competitive?**: ${isCompetitiveGPA(academic.gpa_weighted, mode, '50th') ? '✅ Yes' : '⚠️ Below benchmark'}
- **Unweighted GPA**: ${academic.gpa_unweighted?.toFixed(2) || 'N/A'}
- **Fully Weighted GPA**: ${academic.gpa_fully_weighted?.toFixed(2) || 'N/A'}

### Course Rigor (Advanced Courses)
**Total**: ${academic.advanced_courses?.length || 0} advanced courses
**Rigor Description**: ${academic.coursework_rigor || 'Not specified'}

${
  academic.advanced_courses && academic.advanced_courses.length > 0
    ? academic.advanced_courses
        .map(
          (course) =>
            `- **${course.name}** (${course.type}${course.is_uc_honors_certified ? ', UC-certified' : ''})
   - Grade: ${course.grade || 'In progress'}
   - Grade Level: ${course.grade_level || 'N/A'}`
        )
        .join('\n')
    : 'No advanced courses reported'
}

### AP/IB Exam Scores
${
  academic.test_scores?.ap_exams && academic.test_scores.ap_exams.length > 0
    ? academic.test_scores.ap_exams.map((exam) => `- ${exam.subject}: ${exam.score}/5`).join('\n')
    : 'No AP/IB exams reported'
}

### Academic Honors
${
  academic.honors && academic.honors.length > 0
    ? academic.honors.map((h) => `- ${h}`).join('\n')
    : 'No academic honors listed'
}

### UC a-g Requirements
- **Status**: ${academic.ag_requirements?.completed ? '✅ Completed' : '⚠️ In progress or deficient'}
- **Courses Beyond Minimum**: ${academic.ag_requirements?.courses_beyond_minimum || 0}

---

## SCHOOL CONTEXT

**School Name**: ${profile.school_name}
**School Type**: ${profile.school_type || 'Public'}
**Under-resourced**: ${isUnderResourced ? 'Yes - Limited AP/honors offerings' : 'No'}
**AP Courses Available**: ~${apsOffered} courses

---

## YOUR TASK

Provide a **rigorous, evidence-based Academic Excellence analysis** using the tier system and calibration guards.

**Remember**:
1. Compare GPA to **UC benchmarks** (${benchmark.weighted} for 50th percentile at ${mode})
2. Evaluate **course rigor in context** of school resources
3. Assess **grade trends** (upward is excellent, declining is concerning)
4. Apply **context adjustments** only with clear justification
5. Identify **specific strengths and weaknesses** with evidence
6. Provide **actionable strategic pivot** to next tier

**Be brutally honest**: A Tier 2 score (7.0-8.9) is strong! Not everyone is Tier 1.

Return ONLY the JSON object (no markdown, no extra text).`;
}

function parseAcademicAnalysis(text: string): AcademicExcellenceAnalysis {
  let jsonText = text.trim();
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonText);

    const result: AcademicExcellenceAnalysis = {
      dimension_score: parsed.dimension_score || 5.0,
      tier: parsed.tier || 'developing',
      percentile_estimate: parsed.percentile_estimate || 'Unable to estimate',
      gpa_analysis: {
        uc_weighted_gpa: parsed.gpa_analysis?.uc_weighted_gpa || 0,
        percentile_vs_target: parsed.gpa_analysis?.percentile_vs_target || 'Unknown',
        context_adjusted_assessment:
          parsed.gpa_analysis?.context_adjusted_assessment || 'No context provided',
        grade_trend: parsed.gpa_analysis?.grade_trend || 'consistent',
        trend_explanation: parsed.gpa_analysis?.trend_explanation || 'Not provided',
      },
      rigor_analysis: {
        course_load_assessment: parsed.rigor_analysis?.course_load_assessment || 'adequate',
        challenge_seeking_behavior:
          parsed.rigor_analysis?.challenge_seeking_behavior || 'Not assessed',
        standout_courses: parsed.rigor_analysis?.standout_courses || [],
        missed_opportunities: parsed.rigor_analysis?.missed_opportunities || [],
      },
      uc_preparation: {
        ag_requirements_status: parsed.uc_preparation?.ag_requirements_status || 'in_progress',
        courses_beyond_minimum: parsed.uc_preparation?.courses_beyond_minimum || 0,
        stem_depth: parsed.uc_preparation?.stem_depth || 'adequate',
        humanities_depth: parsed.uc_preparation?.humanities_depth || 'adequate',
      },
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      strategic_pivot: {
        current_tier: parsed.strategic_pivot?.current_tier || 'developing',
        path_to_next_tier:
          parsed.strategic_pivot?.path_to_next_tier || 'Unable to determine',
        timeline: parsed.strategic_pivot?.timeline || 'N/A',
        is_achievable: parsed.strategic_pivot?.is_achievable || false,
      },
      key_evidence: parsed.key_evidence || [],
    };

    return result;
  } catch (error) {
    throw new Error('Invalid JSON from academic analyzer');
  }
}

function generateHeuristicAcademicAnalysis(
  portfolio: PortfolioData,
  mode: UCEvaluationMode
): AcademicExcellenceAnalysis {
  const { academic } = portfolio;
  const gpa = academic.gpa_weighted;
  const advancedCount = academic.advanced_courses?.length || 0;

  // Determine tier based on GPA and rigor
  let tier: 'exceptional' | 'strong' | 'developing' | 'foundational' = 'developing';
  let score = 5.0;

  const isTop = isCompetitiveGPA(gpa, mode, '75th');
  const is50th = isCompetitiveGPA(gpa, mode, '50th');

  if (isTop && advancedCount >= 10) {
    tier = 'exceptional';
    score = 9.5;
  } else if (is50th && advancedCount >= 6) {
    tier = 'strong';
    score = 7.5;
  } else if (gpa >= 3.7) {
    tier = 'developing';
    score = 5.5;
  } else {
    tier = 'foundational';
    score = 3.0;
  }

  return {
    dimension_score: score,
    tier,
    percentile_estimate: tier === 'exceptional' ? 'Top 5%' : tier === 'strong' ? 'Top 15%' : 'Top 40%',
    gpa_analysis: {
      uc_weighted_gpa: gpa,
      percentile_vs_target: isTop ? '75th+' : is50th ? '50th-75th' : 'Below 50th',
      context_adjusted_assessment: 'Heuristic fallback - manual review recommended',
      grade_trend: 'consistent',
      trend_explanation: 'Trend data not available in heuristic mode',
    },
    rigor_analysis: {
      course_load_assessment: advancedCount >= 10 ? 'exceptional' : advancedCount >= 6 ? 'strong' : 'adequate',
      challenge_seeking_behavior: `${advancedCount} advanced courses taken`,
      standout_courses: [],
      missed_opportunities: [],
    },
    uc_preparation: {
      ag_requirements_status: academic.ag_requirements?.completed ? 'met' : 'in_progress',
      courses_beyond_minimum: academic.ag_requirements?.courses_beyond_minimum || 0,
      stem_depth: 'adequate',
      humanities_depth: 'adequate',
    },
    strengths: [
      {
        strength: 'GPA Performance',
        evidence: `${gpa.toFixed(2)} weighted GPA`,
        why_impressive: tier === 'exceptional' ? 'Exceeds UC benchmarks' : 'Solid academic foundation',
      },
    ],
    weaknesses: [
      {
        weakness: 'Heuristic Analysis',
        evidence: 'LLM analysis failed',
        severity: 'moderate',
        can_improve: false,
        how_to_improve: 'Manual expert review recommended',
      },
    ],
    strategic_pivot: {
      current_tier: tier,
      path_to_next_tier: 'Detailed analysis required',
      timeline: 'N/A',
      is_achievable: false,
    },
    key_evidence: ['Heuristic fallback mode - limited evidence available'],
  };
}
