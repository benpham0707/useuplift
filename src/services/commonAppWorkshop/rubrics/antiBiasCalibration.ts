/**
 * Anti-Bias Calibration for College Tailoring Rubric
 *
 * **Problem**: If our scoring rewards what our enhancement does, we create a
 * self-fulfilling loop that doesn't measure real-world admissions value.
 *
 * **Solution**: This module provides:
 * 1. Bias risk identification for each dimension
 * 2. Real-world calibration criteria (what actually matters in admissions)
 * 3. Anti-gaming guardrails
 * 4. Ground truth examples from admitted students
 *
 * **Principle**: The scoring should reward what ADMISSIONS OFFICERS value,
 * not what OUR ENHANCEMENT SYSTEM produces.
 */

// ============================================================================
// BIAS RISK ANALYSIS
// ============================================================================

export interface DimensionBiasRisk {
  dimension: string;
  risk_level: 'high' | 'medium' | 'low';
  self_bias_pattern: string;
  real_world_truth: string;
  anti_gaming_check: string;
  calibration_question: string;
}

/**
 * Bias risks for each tailoring dimension
 */
export const DIMENSION_BIAS_RISKS: DimensionBiasRisk[] = [
  {
    dimension: 'research_depth',
    risk_level: 'high',
    self_bias_pattern: 'Enhancement adds program/faculty names → Scoring rewards program/faculty names',
    real_world_truth: 'AOs value GENUINE research that connects to student interests, not name-dropping. A heartfelt "I want to explore X" beats "I want to explore X at Professor Y\'s Z Lab" if the lab mention feels forced.',
    anti_gaming_check: 'Would the essay be WORSE without the specific name? If removing "Stanford\'s Program in Ethics" doesn\'t hurt the narrative, the reference was decorative.',
    calibration_question: 'Does this read like a student who actually researched, or a student who was told to add program names?',
  },
  {
    dimension: 'citation_integration',
    risk_level: 'high',
    self_bias_pattern: 'Enhancement adds citations → Scoring rewards "seamless" citations',
    real_world_truth: 'Many admitted essays have ZERO specific program mentions. What matters is authentic fit demonstration, not citation count.',
    anti_gaming_check: 'Compare to essays with no citations that show fit through values/tone. Do they score lower? They shouldn\'t automatically.',
    calibration_question: 'Would an essay with zero program names but perfect value alignment score lower than one with 3 forced program drops?',
  },
  {
    dimension: 'distinctiveness',
    risk_level: 'medium',
    self_bias_pattern: 'Enhancement adds college-specific details → "Would only work for this college" scores higher',
    real_world_truth: 'Distinctiveness comes from authentic FIT, not just college-specific vocabulary. An essay about intellectual curiosity can be Stanford-distinctive without mentioning Stanford programs.',
    anti_gaming_check: 'Can you tell it\'s for Stanford from the MINDSET and VALUES, not just the nouns?',
    calibration_question: 'If I replaced all Stanford names with "College X", would the essay still feel distinctively Stanford-appropriate?',
  },
  {
    dimension: 'value_alignment',
    risk_level: 'low',
    self_bias_pattern: 'Less risk - values are about demonstrated qualities, not added text',
    real_world_truth: 'This dimension measures authentic character demonstration, which is hard to fake by adding text.',
    anti_gaming_check: 'Are values SHOWN through stories, or just CLAIMED with college vocabulary?',
    calibration_question: 'Does the essay demonstrate intellectual vitality through genuine examples, or just use the phrase "intellectual vitality"?',
  },
  {
    dimension: 'tone_match',
    risk_level: 'low',
    self_bias_pattern: 'Less risk - enhancement doesn\'t significantly change tone',
    real_world_truth: 'Tone is about voice and style, which comes from the student, not our enhancements.',
    anti_gaming_check: 'Is the voice consistent throughout, or does enhanced text sound different?',
    calibration_question: 'Does the essay sound like a real student talking, or like a consultant-polished product?',
  },
  {
    dimension: 'cliche_avoidance',
    risk_level: 'low',
    self_bias_pattern: 'Less risk - we check for clichés, we don\'t add them',
    real_world_truth: 'Cliché detection is grounded in real AO feedback about overused patterns.',
    anti_gaming_check: 'Are we detecting patterns AOs actually hate, or just our own heuristics?',
    calibration_question: 'Would an admissions officer reading 50 essays today find this one fresh?',
  },
  {
    dimension: 'prompt_responsiveness',
    risk_level: 'low',
    self_bias_pattern: 'Less risk - we don\'t change how the essay addresses the prompt',
    real_world_truth: 'Prompt responsiveness is about content and structure, not added details.',
    anti_gaming_check: 'Does adding college details actually help answer the prompt better?',
    calibration_question: 'Does the essay answer what the prompt ACTUALLY asks, not just what we think it asks?',
  },
  {
    dimension: 'elite_craft',
    risk_level: 'medium',
    self_bias_pattern: 'We define "elite markers" and then reward essays that have them',
    real_world_truth: 'Elite markers should be derived from actual admitted essays, not theoretical ideals.',
    anti_gaming_check: 'Are these markers present in real admitted essays, or just our framework?',
    calibration_question: 'Have we validated these markers against actual Stanford admits?',
  },
];

// ============================================================================
// ANTI-GAMING GUARDRAILS
// ============================================================================

export interface AntiGamingGuardrail {
  name: string;
  description: string;
  check: (essay: string, enhanced_essay: string) => GuardrailResult;
}

export interface GuardrailResult {
  passed: boolean;
  concern?: string;
  recommendation?: string;
}

/**
 * Check if enhancement added names without substance
 */
export function checkNameDropping(original: string, enhanced: string): GuardrailResult {
  // Count program/faculty name patterns
  const programPattern = /(?:Program in|Institute|Center for|Professor|Lab|School of)\s+[A-Z][a-zA-Z\s]+/g;

  const originalNames = original.match(programPattern) || [];
  const enhancedNames = enhanced.match(programPattern) || [];
  const addedNames = enhancedNames.length - originalNames.length;

  // If we added names but didn't add meaningful connection
  if (addedNames > 0) {
    // Check for connective phrases that indicate genuine integration
    const connectionPhrases = [
      'because', 'which connects to', 'where I can', 'building on my',
      'related to my interest in', 'complements my work on'
    ];

    const hasConnection = connectionPhrases.some(phrase =>
      enhanced.toLowerCase().includes(phrase) &&
      !original.toLowerCase().includes(phrase)
    );

    if (!hasConnection && addedNames > 1) {
      return {
        passed: false,
        concern: `Added ${addedNames} program/faculty names without meaningful connective tissue`,
        recommendation: 'Each name drop should be connected to the student\'s personal narrative',
      };
    }
  }

  return { passed: true };
}

/**
 * Check if enhancement sounds natural vs. inserted
 */
export function checkNaturalFlow(original: string, enhanced: string): GuardrailResult {
  // Find what was added
  const originalWords = new Set(original.toLowerCase().split(/\s+/));
  const enhancedWords = enhanced.toLowerCase().split(/\s+/);
  const addedWords = enhancedWords.filter(w => !originalWords.has(w));

  // Check if added content is bunched together (insertion) vs. distributed (rewrite)
  // This is a heuristic - bunched insertions feel unnatural
  const enhancedLower = enhanced.toLowerCase();
  const addedPhrase = addedWords.slice(0, 10).join(' ');

  if (addedPhrase.length > 20 && enhancedLower.includes(addedPhrase)) {
    return {
      passed: false,
      concern: 'Enhancement appears to be a single insertion rather than integrated changes',
      recommendation: 'Changes should feel like natural evolution, not inserted blocks',
    };
  }

  return { passed: true };
}

/**
 * Check if essay would score well WITHOUT our enhancements
 * This is the key anti-bias check
 */
export function checkBaselineQuality(original: string): GuardrailResult {
  // If the original is already strong, enhancement should be minimal
  const qualitySignals = [
    /I\s+(?:discovered|realized|learned|wondered)/i,  // Reflection
    /because|which made me|leading me to/i,            // Causation
    /specific|particular|especially/i,                 // Specificity
    /my|I've|I'm/i,                                    // Personal voice
  ];

  const signalCount = qualitySignals.filter(p => p.test(original)).length;

  if (signalCount >= 3) {
    return {
      passed: true,
      recommendation: 'Original is already strong - enhancement should be minimal and surgical',
    };
  }

  if (signalCount <= 1) {
    return {
      passed: true,
      concern: 'Original lacks quality signals - enhancement alone won\'t fix fundamental issues',
      recommendation: 'Focus on voice and reflection, not just adding college names',
    };
  }

  return { passed: true };
}

// ============================================================================
// REAL-WORLD CALIBRATION EXAMPLES
// ============================================================================

/**
 * Ground truth examples to calibrate scoring
 * These represent what ACTUALLY works in admissions
 */
export interface CalibrationExample {
  id: string;
  college: string;
  essay_excerpt: string;
  why_it_works: string;
  program_mentions: number;
  expected_tailoring_score: number;
  dimension_notes: Record<string, string>;
}

export const CALIBRATION_EXAMPLES: CalibrationExample[] = [
  {
    id: 'stanford_admit_no_programs',
    college: 'Stanford',
    essay_excerpt: `The question that keeps me up at night isn't about CRISPR or neural networks - it's simpler and stranger. Why do I feel guilty when I accidentally step on an ant? That guilt led me down a three-month journey through Peter Singer, Buddhist ethics, and eventually to building an Arduino sensor that warns insects before I walk. My friends think I'm weird. I think I'm onto something.`,
    why_it_works: 'Demonstrates Stanford\'s intellectual vitality and genuine curiosity WITHOUT mentioning any Stanford programs. The "rabbit hole" is authentic, not performed.',
    program_mentions: 0,
    expected_tailoring_score: 85,
    dimension_notes: {
      value_alignment: '9/10 - Shows intellectual vitality through authentic example',
      research_depth: '3/10 - No Stanford-specific research, but doesn\'t need it',
      tone_match: '9/10 - Perfect Stanford voice - curious, quirky, unafraid to be weird',
      distinctiveness: '8/10 - This mindset IS Stanford, even without the name',
    },
  },
  {
    id: 'stanford_admit_with_programs',
    college: 'Stanford',
    essay_excerpt: `Professor Greely's "CRISPR People" ended with a question I couldn't stop thinking about: who gets to decide what's "normal"? This isn't abstract for me - my sister was diagnosed with a genetic condition at 12. I don't want to "fix" her. I want to understand why our first instinct is to see her as broken. Stanford's Program in Ethics in Society feels like the only place asking these questions at the level they deserve.`,
    why_it_works: 'The program mention is ESSENTIAL to the narrative, not decorative. The personal connection makes the research feel genuine, not performative.',
    program_mentions: 2,
    expected_tailoring_score: 92,
    dimension_notes: {
      value_alignment: '10/10 - Deep engagement with ideas, personal stakes',
      research_depth: '9/10 - Specific and genuinely connected to personal story',
      citation_integration: '10/10 - Would break narrative to remove citations',
      distinctiveness: '9/10 - Could NOT work for Harvard or MIT',
    },
  },
  {
    id: 'stanford_reject_name_dropping',
    college: 'Stanford',
    essay_excerpt: `I want to study at Stanford because of Professor Fei-Fei Li's work in AI at the Stanford AI Lab (SAIL) and the Stanford Institute for Human-Centered AI (HAI). I am also interested in the Program in Ethics in Society and the Symbolic Systems Program. These programs align with my passion for AI ethics.`,
    why_it_works: 'This is what gaming looks like. High name count, zero authentic connection. No personal voice, no genuine curiosity - just a list.',
    program_mentions: 5,
    expected_tailoring_score: 35,
    dimension_notes: {
      value_alignment: '2/10 - Claims "passion" without demonstration',
      research_depth: '4/10 - Names are present but connections are empty',
      citation_integration: '2/10 - Pure name-dropping',
      tone_match: '3/10 - Sounds like a form letter',
    },
  },
  {
    id: 'mit_admit_no_programs',
    college: 'MIT',
    essay_excerpt: `The motor burned out at 2 AM. Third rebuild that night. My roommate asked why I didn't just order the right part. I said: where's the fun in that? Turns out my "wrong" motor - salvaged from a broken printer - could handle 2x the torque if I rewound it myself. The robot walked on Saturday. Ugly, loud, and entirely mine.`,
    why_it_works: 'This IS MIT without saying MIT. The builder mentality, comfort with failure, hands-on problem-solving - all demonstrated through story.',
    program_mentions: 0,
    expected_tailoring_score: 88,
    dimension_notes: {
      value_alignment: '10/10 - Builder mindset, failure as feature',
      research_depth: '2/10 - No MIT programs, doesn\'t matter',
      tone_match: '10/10 - Casual, technical, maker voice',
      distinctiveness: '9/10 - Could not work for Harvard',
    },
  },
];

// ============================================================================
// SCORING ADJUSTMENTS
// ============================================================================

/**
 * Adjust raw scores to prevent self-bias
 */
export interface ScoreAdjustment {
  dimension: string;
  adjustment_type: 'cap' | 'floor' | 'penalty' | 'bonus';
  condition: string;
  amount: number;
  rationale: string;
}

export const ANTI_BIAS_ADJUSTMENTS: ScoreAdjustment[] = [
  {
    dimension: 'research_depth',
    adjustment_type: 'cap',
    condition: 'Program names present but connections feel generic',
    amount: 6, // Cap at 6/10 even with multiple names
    rationale: 'Name count without meaningful connection should not score high',
  },
  {
    dimension: 'citation_integration',
    adjustment_type: 'floor',
    condition: 'Zero citations but values strongly demonstrated',
    amount: 5, // Minimum 5/10 if values are strong
    rationale: 'Essays without citations can still be excellent fits',
  },
  {
    dimension: 'distinctiveness',
    adjustment_type: 'bonus',
    condition: 'Essay shows college-appropriate MINDSET without college names',
    amount: 2, // +2 bonus for authentic distinctiveness
    rationale: 'Reward authenticity over keyword matching',
  },
  {
    dimension: 'research_depth',
    adjustment_type: 'penalty',
    condition: 'More than 3 program mentions in <200 words',
    amount: -2, // -2 penalty for obvious gaming
    rationale: 'Excessive name-dropping suggests gaming not genuine fit',
  },
];

// ============================================================================
// CALIBRATION FUNCTIONS
// ============================================================================

/**
 * Check if a score seems biased based on calibration examples
 */
export function checkScoreCalibration(
  dimension: string,
  score: number,
  programMentions: number,
  wordCount: number
): { calibrated: boolean; warning?: string; suggestedRange?: [number, number] } {
  // High score with many programs but low word count = suspicious
  if (dimension === 'research_depth' && score >= 8 && programMentions >= 3 && wordCount < 200) {
    return {
      calibrated: false,
      warning: 'High research_depth score with many program mentions in short text - may be name-dropping',
      suggestedRange: [4, 6],
    };
  }

  // Low score with zero programs but strong voice = potentially underscored
  if (dimension === 'research_depth' && score <= 3 && programMentions === 0) {
    // This alone isn't enough to adjust - check with other dimensions
    return {
      calibrated: true,
      warning: 'Low research_depth with no programs is expected, but verify value_alignment is properly weighted',
    };
  }

  return { calibrated: true };
}

/**
 * Validate that our scoring matches real-world outcomes
 */
export function validateAgainstCalibration(
  assessment: { dimension_scores: Array<{ dimension: string; score: number }> },
  programMentions: number
): { valid: boolean; concerns: string[] } {
  const concerns: string[] = [];

  // Get key scores
  const researchScore = assessment.dimension_scores.find(d => d.dimension === 'research_depth')?.score || 0;
  const valueScore = assessment.dimension_scores.find(d => d.dimension === 'value_alignment')?.score || 0;
  const citationScore = assessment.dimension_scores.find(d => d.dimension === 'citation_integration')?.score || 0;

  // Check for gaming pattern: high research/citation with low value
  if (researchScore >= 8 && citationScore >= 8 && valueScore <= 5) {
    concerns.push('High research/citation scores with low value alignment suggests gaming - names without substance');
  }

  // Check for undervaluing authentic essays: low research with high value
  if (researchScore <= 3 && valueScore >= 8 && programMentions === 0) {
    // This is GOOD - authentic essay without programs should score well overall
    // But check that total score reflects this
  }

  // Check calibration example #3 (name-dropping reject)
  if (programMentions >= 4 && researchScore >= 7) {
    concerns.push('High program count with high research score - compare to calibration example #3 (expected ~35 total)');
  }

  return {
    valid: concerns.length === 0,
    concerns,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const antiBiasFramework = {
  biasRisks: DIMENSION_BIAS_RISKS,
  guardrails: {
    checkNameDropping,
    checkNaturalFlow,
    checkBaselineQuality,
  },
  calibrationExamples: CALIBRATION_EXAMPLES,
  adjustments: ANTI_BIAS_ADJUSTMENTS,
  validation: {
    checkScoreCalibration,
    validateAgainstCalibration,
  },
};
