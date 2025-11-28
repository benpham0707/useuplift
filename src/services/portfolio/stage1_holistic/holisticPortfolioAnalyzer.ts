// @ts-nocheck - Pre-existing type mismatches with portfolio types
/**
 * Stage 1: Holistic Portfolio Analyzer
 *
 * Purpose: First-pass comprehensive assessment of student's complete portfolio
 * - Identifies central narrative thread and signature elements
 * - Assesses UC-specific competitiveness (GPA, PIQs, context)
 * - Detects red flags and hidden strengths
 * - Recommends UC tier alignment
 *
 * This is the FIRST of 9 LLM calls in the portfolio analysis pipeline.
 * Output feeds into Stage 2's 6 dimension analyzers.
 *
 * Calibrated to UC admissions reality:
 * - UC Berkeley: 11.3% acceptance, 4.15-4.29 weighted GPA (middle 50%)
 * - UCLA: 9% acceptance, 4.20-4.34 weighted GPA (middle 50%)
 * - Test-blind policy (no SAT/ACT)
 * - PIQs are critical differentiator (4 essays, 1,400 words)
 * - Context heavily weighted (first-gen, low-income, under-resourced)
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  PortfolioData,
  HolisticPortfolioUnderstanding,
  UCEvaluationMode,
} from '../types';
import {
  UC_BERKELEY_GPA_BENCHMARKS,
  UCLA_GPA_BENCHMARKS,
  GENERAL_UC_GPA_BENCHMARKS,
  UC_COMPREHENSIVE_REVIEW_FACTORS,
  getUCGPABenchmark,
  isCompetitiveGPA,
} from '../constants/ucCalibration';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Stage 1: Holistic Portfolio Analyzer
 *
 * @param portfolio - Complete student portfolio data
 * @param mode - UC evaluation mode ('berkeley' | 'ucla' | 'general_uc')
 * @returns Holistic understanding of portfolio with UC-specific insights
 */
export async function analyzeHolisticPortfolio(
  portfolio: PortfolioData,
  mode: UCEvaluationMode
): Promise<HolisticPortfolioUnderstanding> {
  const systemPrompt = buildSystemPrompt(mode);
  const userPrompt = buildUserPrompt(portfolio, mode);

  try {
    // Primary attempt with Claude Sonnet 4.5
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.7, // Slight creativity for narrative synthesis
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

    const result = parseHolisticAnalysis(textContent.text);
    return result;
  } catch (error) {
    console.error('Stage 1 Holistic Analysis failed:', error);

    // Retry once before falling back to heuristic
    try {
      console.log('Retrying Stage 1 analysis...');
      const retryResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const retryTextContent = retryResponse.content.find((block) => block.type === 'text');
      if (!retryTextContent || retryTextContent.type !== 'text') {
        throw new Error('No text content in retry response');
      }

      return parseHolisticAnalysis(retryTextContent.text);
    } catch (retryError) {
      console.error('Retry failed, using heuristic fallback:', retryError);
      return generateHeuristicHolisticAnalysis(portfolio, mode);
    }
  }
}

/**
 * Build UC-specific system prompt for holistic analysis
 */
function buildSystemPrompt(mode: UCEvaluationMode): string {
  const modeContext = getModeSpecificContext(mode);

  return `You are an expert UC admissions counselor conducting a **holistic first-pass review** of a student's complete college application portfolio.

**YOUR ROLE**: Provide a comprehensive understanding of this student's academic journey, extracurricular involvement, personal narrative, and overall competitiveness for ${modeContext.campusName}.

---

## UC ADMISSIONS CONTEXT (CRITICAL)

### UC Comprehensive Review (14 Factors)
The UC system evaluates students holistically using these official factors:
${UC_COMPREHENSIVE_REVIEW_FACTORS.map((factor, i) => `${i + 1}. **${factor.factor}**: ${factor.description}`).join('\n')}

### UC-Specific Policies
- ✅ **Test-Blind**: SAT/ACT scores are NOT considered (since 2021)
- ✅ **UC-Weighted GPA**: Capped at 8 semesters of honors/AP courses (grades 10-11)
- ✅ **Personal Insight Questions (PIQs)**: 4 essays × 350 words = 1,400 words total
  - PIQs are a CRITICAL differentiator (95% of top schools rate as "very important")
  - Students choose 4 out of 8 prompts
  - Quality of narrative voice, authenticity, and insight matters enormously
- ✅ **Context Matters**: First-gen, low-income, under-resourced schools heavily considered
- ✅ **California Resident Priority**: In-state students have 3-5x higher acceptance rates

### ${modeContext.campusName} Specific Profile
${modeContext.priorities}

**GPA Benchmarks (Middle 50%)**:
- Weighted: ${modeContext.gpaRange.weighted}
- Unweighted: ${modeContext.gpaRange.unweighted}
- Advanced courses: ${modeContext.gpaRange.aps} APs typical

**Acceptance Rate**: ${(modeContext.acceptanceRate * 100).toFixed(1)}%

**What ${modeContext.shortName} Values Most**:
${modeContext.values.map((v) => `- ${v}`).join('\n')}

---

## YOUR TASK

Conduct a **holistic first-pass assessment** of this student's portfolio:

### 1. CENTRAL NARRATIVE THREAD
- What is the **unifying story** of this student's journey?
- What are their **signature elements** (2-3 defining strengths)?
- Is there a clear **intellectual/personal theme** that connects academics, ECs, and PIQs?

### 2. UC COMPETITIVENESS ASSESSMENT
- **Academic Standing**: How does their UC-weighted GPA compare to ${modeContext.shortName} benchmarks?
- **Course Rigor**: Is their course load appropriately challenging for top UCs?
- **PIQ Quality**: Do their PIQ scores (narrative quality) suggest strong writing?
- **UC Fit**: Based on holistic review, are they competitive for ${modeContext.shortName}?

### 3. CONTEXT FACTORS (CRITICAL FOR UCs)
- **First-generation**: Significant plus factor (UCs prioritize first-gen access)
- **Low-income**: Work/family responsibilities = valuable ECs
- **Under-resourced school**: Limited AP/honors courses evaluated in context
- **Geographic diversity**: Rural, underrepresented regions valued

### 4. HIDDEN STRENGTHS
Identify rare combinations that admissions officers notice:
- First-gen + Research (Top 3%)
- Low-income + Entrepreneurship (Top 5%)
- Depth in multiple unrelated fields (interdisciplinary scholar)
- Leadership in adversity (family responsibilities + club president)

### 5. RED FLAGS (BE HONEST)
- **Resume padding**: Long list of clubs with no depth or outcomes
- **Lack of coherence**: Activities seem random, no connecting thread
- **Grade trends**: Declining GPA in junior year (critical for UCs)
- **Weak PIQs**: Generic stories, no self-reflection
- **Unrealistic goals**: "I want to cure cancer" without any relevant preparation

### 6. UC TIER RECOMMENDATION
Based on this holistic assessment, which UC tier should they target?

- **Top UCs** (Berkeley, UCLA, UCSD): 4.15+ weighted GPA, exceptional PIQs, strong ECs
- **Mid-Tier UCs** (UCSB, UCI, UCD): 3.90-4.15 weighted, solid PIQs, decent ECs
- **All UCs** (UCR, UCM, UCSC): 3.70-3.90 weighted, meets a-g requirements

---

## CALIBRATION GUARDS (PREVENT GRADE INFLATION)

### Reality Anchors
- ${modeContext.shortName} admits ~${(modeContext.acceptanceRate * 100).toFixed(1)}% of applicants
- Middle 50% weighted GPA: ${modeContext.gpaRange.weighted}
- A 4.0 unweighted GPA is common among admits (not exceptional)
- "Club president" without measurable outcomes = decent, not exceptional
- Most students are qualified; small differences in narrative/fit decide outcomes

### Be Brutally Honest But Fair
- ✅ **DO**: Acknowledge genuine strengths backed by evidence
- ✅ **DO**: Recognize context (first-gen, low-income) appropriately
- ✅ **DO**: Identify hidden gems (rare combinations, authentic voice)
- ❌ **DON'T**: Inflate scores to be encouraging
- ❌ **DON'T**: Ignore red flags to protect feelings
- ❌ **DON'T**: Treat "club president" as Tier 1 leadership without outcomes

---

## OUTPUT FORMAT

Return your analysis as a **structured JSON object** with the following schema:

\`\`\`json
{
  "central_thread": {
    "narrative": "string - What is the unifying story? (2-3 sentences)",
    "signature_elements": ["string - Top 3 defining strengths"],
    "thematic_coherence": "strong" | "moderate" | "weak"
  },
  "uc_competitiveness": {
    "academic_standing": "exceptional" | "competitive" | "below_benchmark",
    "gpa_percentile": "75th+" | "50th-75th" | "25th-50th" | "below_25th",
    "course_rigor_assessment": "string - 1-2 sentences",
    "piq_quality_preview": "distinctive" | "strong" | "adequate" | "weak",
    "overall_fit": "strong_match" | "possible_match" | "reach"
  },
  "context_factors": {
    "first_generation": {
      "applies": boolean,
      "impact": "string - How does this strengthen their profile?"
    },
    "low_income": {
      "applies": boolean,
      "impact": "string"
    },
    "under_resourced_school": {
      "applies": boolean,
      "impact": "string"
    },
    "other_context": "string - Any other relevant context"
  },
  "hidden_strengths": [
    {
      "strength": "string - Name of rare combination/quality",
      "rarity": "Top 1-5%" | "Top 5-10%" | "Top 10-20%",
      "why_valuable": "string - Why admissions officers care",
      "evidence": "string - Specific examples from portfolio"
    }
  ],
  "red_flags": [
    {
      "concern": "string - Name of issue",
      "severity": "critical" | "moderate" | "minor",
      "explanation": "string - Why this matters",
      "mitigation": "string - Can this be addressed?"
    }
  ],
  "uc_tier_recommendation": {
    "tier": "top_ucs" | "mid_tier_ucs" | "all_ucs",
    "target_campuses": ["string - Specific UC campuses"],
    "rationale": "string - Why this tier? (2-3 sentences)",
    "stretch_campuses": ["string - Reach schools worth applying"],
    "safety_campuses": ["string - Likely admits"]
  },
  "key_insights": [
    "string - 3-5 bullet points of critical insights for dimension analyzers"
  ]
}
\`\`\`

**CRITICAL**: Base every assessment on **specific evidence** from the portfolio. Quote examples. Be honest about weaknesses. Recognize genuine context factors.`;
}

/**
 * Get mode-specific context for system prompt
 */
function getModeSpecificContext(mode: UCEvaluationMode) {
  switch (mode) {
    case 'berkeley':
      return {
        campusName: 'UC Berkeley',
        shortName: 'Berkeley',
        acceptanceRate: UC_BERKELEY_GPA_BENCHMARKS.acceptance_rate,
        gpaRange: {
          weighted: '4.15-4.29',
          unweighted: '3.92-3.96',
          aps: '8-12',
        },
        priorities: `**UC Berkeley** is a premier research university valuing:
- Intellectual curiosity and research initiative (25% weight)
- Academic excellence with rigorous course load (35% weight)
- Authentic voice in PIQs showing self-reflection (20% weight)
- Berkeley seeks future researchers, scholars, and innovators`,
        values: [
          'Research experience (even if not published)',
          'Intellectual risk-taking (taking hardest courses available)',
          'Self-directed learning projects',
          'Depth over breadth in academic interests',
          'PIQs showing genuine intellectual passion',
        ],
      };

    case 'ucla':
      return {
        campusName: 'UCLA',
        shortName: 'UCLA',
        acceptanceRate: UCLA_GPA_BENCHMARKS.acceptance_rate,
        gpaRange: {
          weighted: '4.20-4.34',
          unweighted: '3.92-3.96',
          aps: '8-12',
        },
        priorities: `**UCLA** is a diverse community-focused research university valuing:
- Authentic voice and narrative in PIQs (30% weight - highest)
- Academic excellence co-equal with story (30% weight)
- Community impact and "Bruin values" (20% weight)
- UCLA seeks well-rounded contributors with compelling stories`,
        values: [
          'Compelling personal narrative (overcoming adversity, unique perspective)',
          'Community service with measurable impact',
          '"Bruin values": respect, accountability, integrity, service, excellence',
          'Cultural/geographic diversity contributions',
          'PIQs that show authentic voice, not what they think UCLA wants to hear',
        ],
      };

    case 'general_uc':
      return {
        campusName: 'General UC System',
        shortName: 'UCs',
        acceptanceRate: 0.30, // Average across all UCs
        gpaRange: {
          weighted: '3.90-4.20',
          unweighted: '3.75-3.95',
          aps: '5-10',
        },
        priorities: `**General UC System** provides accessible, high-quality public education valuing:
- Academic excellence (40% weight - primary factor)
- Authentic PIQ narratives (20% weight)
- Balanced involvement in school/community (15% weight)
- UCs seek students who thrive in large research universities`,
        values: [
          'Meeting a-g requirements with solid grades',
          'Challenging course load appropriate to school resources',
          'Meaningful involvement (depth over breadth)',
          'Clear academic interests and goals',
          'PIQs showing self-awareness and growth',
        ],
      };
  }
}

/**
 * Build user prompt with complete portfolio data
 */
function buildUserPrompt(portfolio: PortfolioData, mode: UCEvaluationMode): string {
  const { profile, academic, experiences, writing_analysis, personal_context, goals } = portfolio;

  // Calculate UC GPA competitiveness
  const benchmark = getUCGPABenchmark(mode, '50th');
  const isCompetitive = isCompetitiveGPA(academic.gpa_weighted, mode, '50th');

  // Extract context values safely
  const isFirstGen = personal_context?.background?.first_gen ?? false;
  const isLowIncome = personal_context?.background?.low_income ?? false;
  const apsOffered = personal_context?.school_context?.total_aps_offered ?? 20;
  const isUnderResourced = apsOffered < 10;
  const familyResponsibilities = personal_context?.family_responsibilities;
  const challenges = personal_context?.challenges_overcome ?? [];
  const uniqueCircumstances = personal_context?.unique_circumstances ?? '';

  // Get activities from experiences
  const activities = experiences?.activities ?? [];

  return `Please conduct a holistic first-pass assessment of this student's portfolio for **${mode === 'berkeley' ? 'UC Berkeley' : mode === 'ucla' ? 'UCLA' : 'UC System'}**.

---

## STUDENT PROFILE

**Grade**: ${profile.grade}${profile.grade === 12 ? ' (Senior - applying now)' : profile.grade === 11 ? ' (Junior - applying next year)' : ''}
**California Resident**: ${profile.is_california_resident ? '✅ Yes (in-state advantage)' : '❌ No (international/OOS)'}
**First Generation**: ${isFirstGen ? '✅ Yes' : 'No'}
**Low Income**: ${isLowIncome ? '✅ Yes' : 'No'}
**Under-resourced School**: ${isUnderResourced ? '✅ Yes' : 'No'}

---

## ACADEMIC PROFILE

### GPA & Course Rigor
- **UC-Weighted GPA**: ${academic.gpa_weighted.toFixed(2)} ${isCompetitive ? '✅' : '⚠️'} (Benchmark: ${benchmark.weighted})
- **Unweighted GPA**: ${academic.gpa_unweighted?.toFixed(2) || 'N/A'}
- **Fully Weighted GPA**: ${academic.gpa_fully_weighted?.toFixed(2) || 'N/A'}

### Advanced Coursework
**Total Advanced Courses**: ${academic.advanced_courses?.length || 0}
${academic.advanced_courses && academic.advanced_courses.length > 0 ? `
**Course Breakdown**:
${academic.advanced_courses
  .map(
    (course) =>
      `- ${course.name} (${course.type}${course.is_uc_honors_certified ? ', UC-certified honors' : ''}) - Grade: ${course.grade || 'In progress'}`
  )
  .join('\n')}

**AP Exams Taken**: ${academic.test_scores?.ap_exams?.length || 0}
${
  academic.test_scores?.ap_exams && academic.test_scores.ap_exams.length > 0
    ? academic.test_scores.ap_exams.map((exam) => `- ${exam.subject}: ${exam.score}`).join('\n')
    : ''
}
` : 'No advanced courses listed'}

### UC a-g Requirements
- **Completed**: ${academic.ag_requirements?.completed ? '✅ Yes' : '⚠️ Not yet / Unknown'}
- **Courses Beyond Minimum**: ${academic.ag_requirements?.courses_beyond_minimum || 0}

### Academic Honors
${academic.honors && academic.honors.length > 0
  ? academic.honors.map(h => `- ${h}`).join('\n')
  : 'No academic honors listed'}

---

## EXTRACURRICULAR ACTIVITIES

${
  activities.length > 0
    ? activities
        .map(
          (activity, idx) => `
### ${idx + 1}. ${activity.name} (${activity.category})
- **Role**: ${activity.role || 'Member'}
- **Duration**: ${activity.years_involved} years (${activity.hours_per_week || '?'} hrs/week, ${activity.weeks_per_year || '?'} weeks/year)
- **Description**: ${activity.description}
${activity.impact ? `- **Impact/Outcomes**: ${activity.impact}` : ''}
${activity.leadership_positions && activity.leadership_positions.length > 0 ? `- **Leadership**: ${activity.leadership_positions.join(', ')}` : ''}
${activity.awards && activity.awards.length > 0 ? `- **Awards**: ${activity.awards.join(', ')}` : ''}
`
        )
        .join('\n')
    : 'No extracurricular activities listed'
}

---

## PERSONAL INSIGHT QUESTIONS (PIQs)

**PIQs Completed**: ${writing_analysis?.piqs?.length || 0} out of 4 required
**Overall Writing Quality**: ${writing_analysis?.overall_writing_quality?.toFixed(1) || 'N/A'}/100

${
  writing_analysis?.piqs && writing_analysis.piqs.length > 0
    ? writing_analysis.piqs
        .map(
          (piq) => `
### PIQ Prompt ${piq.prompt_number}: ${piq.prompt_title || ''}
**Word Count**: ${piq.word_count}/350
**Narrative Quality Index**: ${piq.narrative_quality_index?.toFixed(1) || 'N/A'}/100 (from PIQ analyzer)
**Authenticity Score**: ${piq.authenticity_score || 'N/A'}/10
**Voice Type**: ${piq.voice_type || 'N/A'}
**Top Strengths**: ${piq.top_strengths?.join(', ') || 'N/A'}
**Top Gaps**: ${piq.top_gaps?.join(', ') || 'N/A'}
**Reader Impression**: ${piq.reader_impression || 'N/A'}

**Essay Excerpt** (first 150 words):
${piq.essay_text?.substring(0, 500) || 'Essay text not provided'}...
`
        )
        .join('\n')
    : 'PIQs not yet written or not provided'
}

---

## CONTEXT FACTORS

### Family & Background
- **First-Generation College Student**: ${isFirstGen ? 'Yes' : 'No'}
- **Low Income**: ${isLowIncome ? 'Yes' : 'No'}
- **English Learner**: ${personal_context?.background?.english_learner ? 'Yes' : 'No'}
- **Underrepresented Minority**: ${personal_context?.background?.underrepresented_minority ? 'Yes' : 'No'}
- **Geographic Diversity**: ${personal_context?.background?.geographic_diversity ? 'Yes' : 'No'}

### Family Responsibilities
${familyResponsibilities?.has_responsibilities
  ? `- **Hours per Week**: ${familyResponsibilities.hours_per_week || 'Unknown'}
- **Description**: ${familyResponsibilities.description || 'Not described'}`
  : 'No family responsibilities reported'}

### School Environment
- **School Type**: ${profile.school_type || 'Public'}
- **AP/Honors Courses Available**: ~${apsOffered} courses
- **Under-resourced**: ${isUnderResourced ? 'Yes (limited offerings considered in context)' : 'No'}

### Challenges & Resilience
${challenges.length > 0
  ? challenges.map(c => `- ${c}`).join('\n')
  : 'No significant challenges disclosed'}

### Unique Circumstances
${uniqueCircumstances || 'None disclosed'}

---

## GOALS & ASPIRATIONS

**Intended Major**: ${goals?.intended_major || 'Undeclared'}
**Alternative Majors**: ${goals?.alternative_majors?.join(', ') || 'Not specified'}
**Career Goals**: ${goals?.career_goals || 'Not specified'}
**Target UC Campuses**: ${goals?.target_uc_campuses?.join(', ') || 'Not specified'}

**Why this major?**
${goals?.why_major || 'Not provided'}

---

## YOUR TASK

Now provide your **holistic first-pass assessment** using the JSON schema specified in the system prompt.

**Remember**:
1. Base all assessments on **specific evidence** from this portfolio
2. Quote examples from PIQs, ECs, and achievements
3. Be **brutally honest** about weaknesses (students need truth)
4. Recognize **genuine context factors** (first-gen, low-income) appropriately
5. Identify **hidden strengths** (rare combinations, authentic voice)
6. Flag **red flags** (resume padding, incoherence, declining grades)
7. Provide **actionable UC tier recommendation**

Return ONLY the JSON object (no additional commentary).`;
}

/**
 * Parse LLM response into HolisticPortfolioUnderstanding
 */
function parseHolisticAnalysis(text: string): HolisticPortfolioUnderstanding {
  // Extract JSON from markdown code blocks if present
  let jsonText = text.trim();
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonText);

    // Validate and map to our interface
    const result: HolisticPortfolioUnderstanding = {
      central_thread: {
        narrative: parsed.central_thread?.narrative || 'Unable to determine central narrative',
        signature_elements: parsed.central_thread?.signature_elements || [],
        thematic_coherence:
          parsed.central_thread?.thematic_coherence || 'weak',
      },
      uc_competitiveness: {
        academic_standing: parsed.uc_competitiveness?.academic_standing || 'below_benchmark',
        gpa_percentile: parsed.uc_competitiveness?.gpa_percentile || 'below_25th',
        course_rigor_assessment:
          parsed.uc_competitiveness?.course_rigor_assessment || 'Unable to assess',
        piq_quality_preview: parsed.uc_competitiveness?.piq_quality_preview || 'weak',
        overall_fit: parsed.uc_competitiveness?.overall_fit || 'reach',
      },
      context_factors: {
        first_generation: {
          applies: parsed.context_factors?.first_generation?.applies || false,
          impact: parsed.context_factors?.first_generation?.impact || '',
        },
        low_income: {
          applies: parsed.context_factors?.low_income?.applies || false,
          impact: parsed.context_factors?.low_income?.impact || '',
        },
        under_resourced_school: {
          applies: parsed.context_factors?.under_resourced_school?.applies || false,
          impact: parsed.context_factors?.under_resourced_school?.impact || '',
        },
        other_context: parsed.context_factors?.other_context || '',
      },
      hidden_strengths: parsed.hidden_strengths || [],
      red_flags: parsed.red_flags || [],
      uc_tier_recommendation: {
        tier: parsed.uc_tier_recommendation?.tier || 'all_ucs',
        target_campuses: parsed.uc_tier_recommendation?.target_campuses || [],
        rationale:
          parsed.uc_tier_recommendation?.rationale || 'Unable to determine tier',
        stretch_campuses: parsed.uc_tier_recommendation?.stretch_campuses || [],
        safety_campuses: parsed.uc_tier_recommendation?.safety_campuses || [],
      },
      key_insights: parsed.key_insights || [],
    };

    return result;
  } catch (error) {
    console.error('Failed to parse holistic analysis JSON:', error);
    throw new Error('Invalid JSON response from holistic analyzer');
  }
}

/**
 * Heuristic fallback if LLM calls fail
 * Provides basic portfolio assessment using rules-based logic
 */
function generateHeuristicHolisticAnalysis(
  portfolio: PortfolioData,
  mode: UCEvaluationMode
): HolisticPortfolioUnderstanding {
  const { academic, experiences, personal_context, writing_analysis } = portfolio;

  // Determine GPA competitiveness
  const isTopGPA = isCompetitiveGPA(academic.gpa_weighted, mode, '75th');
  const isCompetitiveGPA_50th = isCompetitiveGPA(academic.gpa_weighted, mode, '50th');
  const gpaPercentile = isTopGPA
    ? '75th+'
    : isCompetitiveGPA_50th
    ? '50th-75th'
    : academic.gpa_weighted >= 3.7
    ? '25th-50th'
    : 'below_25th';

  // Determine UC tier
  let tier: 'top_ucs' | 'mid_tier_ucs' | 'all_ucs' = 'all_ucs';
  if (isTopGPA && (academic.advanced_courses?.length || 0) >= 10) {
    tier = 'top_ucs';
  } else if (isCompetitiveGPA_50th && (academic.advanced_courses?.length || 0) >= 6) {
    tier = 'mid_tier_ucs';
  }

  // Detect context factors (using correct PortfolioData structure)
  const hasFirstGen = personal_context?.background?.first_gen ?? false;
  const hasLowIncome = personal_context?.background?.low_income ?? false;
  const hasUnderResourced = (personal_context?.school_context?.total_aps_offered ?? 20) < 10;

  return {
    central_thread: {
      narrative:
        'Unable to determine central narrative thread (heuristic fallback mode). Manual review recommended.',
      signature_elements: ['Academic performance', 'Extracurricular involvement'],
      thematic_coherence: 'weak',
    },
    uc_competitiveness: {
      academic_standing: isTopGPA
        ? 'exceptional'
        : isCompetitiveGPA_50th
        ? 'competitive'
        : 'below_benchmark',
      gpa_percentile: gpaPercentile as any,
      course_rigor_assessment: `${academic.advanced_courses?.length || 0} advanced courses taken`,
      piq_quality_preview:
        (writing_analysis?.piqs?.length || 0) >= 3
          ? 'adequate'
          : 'weak',
      overall_fit:
        tier === 'top_ucs'
          ? 'strong_match'
          : tier === 'mid_tier_ucs'
          ? 'possible_match'
          : 'reach',
    },
    context_factors: {
      first_generation: {
        applies: hasFirstGen,
        impact: hasFirstGen
          ? 'First-generation status is a significant plus factor for UCs'
          : '',
      },
      low_income: {
        applies: hasLowIncome,
        impact: hasLowIncome
          ? 'Low-income context considered; work/family responsibilities valued as ECs'
          : '',
      },
      under_resourced_school: {
        applies: hasUnderResourced,
        impact: hasUnderResourced
          ? 'Limited course offerings evaluated in context'
          : '',
      },
      other_context: '',
    },
    hidden_strengths: [],
    red_flags: [
      {
        concern: 'Heuristic fallback mode',
        severity: 'moderate',
        explanation: 'LLM analysis failed; using rule-based assessment only',
        mitigation: 'Manual review recommended for accuracy',
      },
    ],
    uc_tier_recommendation: {
      tier,
      target_campuses:
        tier === 'top_ucs'
          ? ['UC Berkeley', 'UCLA', 'UCSD']
          : tier === 'mid_tier_ucs'
          ? ['UCSB', 'UCI', 'UCD']
          : ['UCR', 'UCM', 'UCSC'],
      rationale: `Based on GPA (${academic.gpa_weighted.toFixed(2)}) and course rigor`,
      stretch_campuses: tier === 'mid_tier_ucs' ? ['UCLA', 'UCSD'] : ['UCLA'],
      safety_campuses: tier === 'top_ucs' ? ['UCSB', 'UCI'] : ['UCR', 'UCM'],
    },
    key_insights: [
      'Heuristic analysis only - LLM assessment failed',
      'GPA and course rigor are primary factors in this assessment',
      'Manual review recommended for complete evaluation',
    ],
  };
}
