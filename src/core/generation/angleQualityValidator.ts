// @ts-nocheck - Legacy generation file with type mismatches
/**
 * Angle Quality Validator
 *
 * Comprehensive system for validating narrative angle quality based on:
 * - Session 18 findings (7/10 originality > 8/10 > 9/10)
 * - Grounded vs abstract language analysis
 * - Authenticity potential prediction
 * - Technical-human bridge strength
 *
 * Purpose: Prevent low-quality angles from bottlenecking essay scores
 */

import type { NarrativeAngle, GenerationProfile } from './narrativeAngleGenerator';

// ============================================================================
// TYPES
// ============================================================================

export interface AngleQualityScore {
  angle: NarrativeAngle;

  // Overall quality (0-100)
  overallQuality: number;

  // Dimensional scores
  groundingScore: number;        // 0-100: How concrete vs abstract
  bridgeScore: number;           // 0-100: Technical-human connection strength
  authenticityPotential: number; // 0-100: Predicted authenticity score
  implementabilityScore: number; // 0-100: How easy to execute well

  // Flags
  redFlags: string[];            // Deal-breakers
  warnings: string[];            // Concerns
  strengths: string[];           // What makes it good

  // Recommendations
  recommendation: 'excellent' | 'good' | 'acceptable' | 'risky' | 'avoid';
  confidence: number;            // 0-1: How confident we are in this assessment
}

// ============================================================================
// KEYWORD DICTIONARIES (Expanded from Session 18 learnings)
// ============================================================================

const GROUNDED_KEYWORDS = {
  // Technical actions (strongest signals)
  actions: [
    'build', 'debug', 'code', 'create', 'fix', 'design', 'construct',
    'measure', 'test', 'prototype', 'engineer', 'program', 'wire',
    'solder', 'calibrate', 'optimize', 'refactor', 'compile'
  ],

  // Technical objects
  objects: [
    'vision', 'system', 'circuit', 'sensor', 'tool', 'robot', 'machine',
    'code', 'algorithm', 'software', 'hardware', 'component', 'module',
    'interface', 'protocol', 'framework', 'platform'
  ],

  // Human/concrete concepts
  human: [
    'guide', 'conversation', 'page', 'document', 'team', 'people',
    'friend', 'mentor', 'student', 'collaboration', 'communication',
    'relationship', 'community', 'group', 'culture'
  ],

  // Tangible results
  results: [
    'working', 'functional', 'operational', 'running', 'successful',
    'complete', 'finished', 'deployed', 'shipped', 'launched'
  ]
};

const ABSTRACT_KEYWORDS = {
  // Philosophical/mystical (highest risk)
  mystical: [
    'oracle', 'prophecy', 'spiritual', 'sacred', 'reverence', 'divine',
    'mystical', 'ethereal', 'transcendent', 'sublime', 'ineffable',
    'metaphysical', 'existential', 'cosmic', 'universal', 'eternal'
  ],

  // Overly poetic/abstract
  poetic: [
    'cartography', 'territories', 'invisible', 'undiscovered', 'hidden',
    'liminal', 'ephemeral', 'transient', 'fleeting', 'gossamer',
    'luminous', 'radiant', 'crystalline', 'prismatic'
  ],

  // Abstract concepts without grounding
  concepts: [
    'conspiracy', 'curator', 'alchemy', 'archaeology', 'mythology',
    'symphony', 'orchestra', 'tapestry', 'mosaic', 'kaleidoscope',
    'labyrinth', 'maze', 'puzzle', 'riddle', 'enigma'
  ],

  // Academic jargon
  jargon: [
    'paradigm', 'dialectic', 'hermeneutic', 'ontological', 'epistemological',
    'phenomenological', 'heuristic', 'recursive', 'iterative', 'emergent'
  ]
};

// Bridge patterns that work well (technical → human)
const EFFECTIVE_BRIDGES = [
  // Technical process → human process
  { pattern: /debug.*social|social.*debug/i, score: 15 },
  { pattern: /code.*culture|culture.*code/i, score: 15 },
  { pattern: /system.*people|people.*system/i, score: 12 },
  { pattern: /build.*relationship|relationship.*build/i, score: 12 },
  { pattern: /engineer.*empathy|empathy.*engineer/i, score: 10 },

  // Technical object → human insight
  { pattern: /vision.*blind|blind.*vision/i, score: 15 },
  { pattern: /robot.*human|human.*robot/i, score: 12 },
  { pattern: /machine.*learn.*human/i, score: 12 },
  { pattern: /circuit.*connect/i, score: 10 },
  { pattern: /program.*behavior|behavior.*program/i, score: 10 },

  // Documentation → communication
  { pattern: /guide.*conversation|conversation.*guide/i, score: 12 },
  { pattern: /document.*understand/i, score: 10 },
  { pattern: /page.*speak|speak.*page/i, score: 10 },
  { pattern: /manual.*relationship/i, score: 10 },
];

// ============================================================================
// GROUNDING SCORE (0-100)
// ============================================================================

function calculateGroundingScore(angle: NarrativeAngle): {
  score: number;
  details: string[];
} {
  let score = 50; // Start neutral
  const details: string[] = [];

  const titleLower = angle.title.toLowerCase();
  const hookLower = angle.hook.toLowerCase();
  const connectionLower = angle.unusualConnection?.toLowerCase() || '';
  const combinedText = `${titleLower} ${hookLower} ${connectionLower}`;

  // Boost for grounded keywords
  let groundedCount = 0;
  Object.entries(GROUNDED_KEYWORDS).forEach(([category, keywords]) => {
    keywords.forEach(kw => {
      if (titleLower.includes(kw)) {
        score += 5;
        groundedCount++;
      }
      if (hookLower.includes(kw)) {
        score += 3;
        groundedCount++;
      }
      if (connectionLower.includes(kw)) {
        score += 2;
        groundedCount++;
      }
    });
  });

  if (groundedCount > 0) {
    details.push(`Found ${groundedCount} grounded keywords (+${Math.min(groundedCount * 3, 30)} pts)`);
  }

  // Penalty for abstract keywords
  let abstractCount = 0;
  let criticalAbstract = 0;
  Object.entries(ABSTRACT_KEYWORDS).forEach(([category, keywords]) => {
    keywords.forEach(kw => {
      if (titleLower.includes(kw)) {
        const penalty = category === 'mystical' ? 15 : category === 'poetic' ? 10 : 8;
        score -= penalty;
        abstractCount++;
        if (category === 'mystical' || category === 'poetic') criticalAbstract++;
      }
      if (hookLower.includes(kw)) {
        const penalty = category === 'mystical' ? 12 : category === 'poetic' ? 8 : 6;
        score -= penalty;
        abstractCount++;
      }
    });
  });

  if (abstractCount > 0) {
    details.push(`Found ${abstractCount} abstract keywords (-${Math.min(abstractCount * 8, 40)} pts)`);
  }

  if (criticalAbstract > 0) {
    details.push(`⚠️ ${criticalAbstract} high-risk abstract terms in title`);
  }

  // Multiple abstract words = exponential penalty
  if (abstractCount >= 3) {
    score -= 20;
    details.push(`Multiple abstract terms = additional -20 pts`);
  }

  // Ratio check: grounded/abstract balance
  if (groundedCount > 0 && abstractCount > 0) {
    const ratio = groundedCount / abstractCount;
    if (ratio >= 2) {
      score += 10;
      details.push(`Strong grounded/abstract ratio (${ratio.toFixed(1)}:1) +10 pts`);
    } else if (ratio < 0.5) {
      score -= 10;
      details.push(`Poor grounded/abstract ratio (${ratio.toFixed(1)}:1) -10 pts`);
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    details
  };
}

// ============================================================================
// BRIDGE SCORE (0-100): Technical-Human Connection
// ============================================================================

function calculateBridgeScore(angle: NarrativeAngle): {
  score: number;
  details: string[];
} {
  let score = 30; // Start low (bridge must be demonstrated)
  const details: string[] = [];

  const titleLower = angle.title.toLowerCase();
  const hookLower = angle.hook.toLowerCase();
  const connectionLower = angle.unusualConnection?.toLowerCase() || '';
  const combinedText = `${titleLower} ${hookLower} ${connectionLower}`;

  // Check for effective bridge patterns
  let bridgePatternCount = 0;
  EFFECTIVE_BRIDGES.forEach(({ pattern, score: patternScore }) => {
    if (pattern.test(combinedText)) {
      score += patternScore;
      bridgePatternCount++;
    }
  });

  if (bridgePatternCount > 0) {
    details.push(`Found ${bridgePatternCount} strong bridge pattern(s) (+${bridgePatternCount * 12} pts avg)`);
  }

  // Check if title contains both technical and human elements
  const hasTechnical = GROUNDED_KEYWORDS.actions.some(kw => titleLower.includes(kw)) ||
                       GROUNDED_KEYWORDS.objects.some(kw => titleLower.includes(kw));
  const hasHuman = GROUNDED_KEYWORDS.human.some(kw => titleLower.includes(kw)) ||
                   ['understand', 'learn', 'teach', 'communicate', 'collaborate'].some(kw => titleLower.includes(kw));

  if (hasTechnical && hasHuman) {
    score += 15;
    details.push(`Title bridges technical + human domains (+15 pts)`);
  } else if (!hasTechnical && !hasHuman) {
    score -= 15;
    details.push(`Title lacks clear technical-human bridge (-15 pts)`);
  }

  // Check hook for concrete → insight transition
  const hasConcreteAction = /\b(built|fixed|debugged|created|designed|programmed)\b/i.test(hookLower);
  const hasPersonalInsight = /\b(realized|learned|discovered|understood|saw)\b/i.test(hookLower);

  if (hasConcreteAction && hasPersonalInsight) {
    score += 20;
    details.push(`Hook transitions concrete action → personal insight (+20 pts)`);
  }

  // Check unusualConnection for clarity
  if (connectionLower.length > 0) {
    const hasExplicitBridge = /as|like|through|via|by way of|connects to|relates to/i.test(connectionLower);
    if (hasExplicitBridge) {
      score += 10;
      details.push(`Connection explicitly states the bridge (+10 pts)`);
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    details
  };
}

// ============================================================================
// AUTHENTICITY POTENTIAL (0-100)
// ============================================================================

function calculateAuthenticityPotential(angle: NarrativeAngle, profile: GenerationProfile): {
  score: number;
  details: string[];
} {
  let score = 60; // Start slightly positive
  const details: string[] = [];

  // Originality impact (Session 18 finding: 7 > 8 > 9)
  if (angle.originality === 7) {
    score += 15;
    details.push(`Optimal originality (7/10) = highest auth potential (+15 pts)`);
  } else if (angle.originality === 6) {
    score += 10;
    details.push(`Safe originality (6/10) = good auth potential (+10 pts)`);
  } else if (angle.originality === 8) {
    score += 5;
    details.push(`Moderate-high originality (8/10) = some auth risk (+5 pts)`);
  } else if (angle.originality >= 9) {
    score -= 10;
    details.push(`Very high originality (${angle.originality}/10) = auth risk (-10 pts)`);
  }

  // Abstract language hurts authenticity
  const abstractCount = Object.values(ABSTRACT_KEYWORDS).flat()
    .filter(kw => angle.title.toLowerCase().includes(kw) || angle.hook.toLowerCase().includes(kw)).length;

  if (abstractCount > 0) {
    const penalty = abstractCount * 8;
    score -= penalty;
    details.push(`${abstractCount} abstract terms = authenticity risk (-${penalty} pts)`);
  }

  // Grounded language helps authenticity
  const groundedCount = Object.values(GROUNDED_KEYWORDS).flat()
    .filter(kw => angle.title.toLowerCase().includes(kw) || angle.hook.toLowerCase().includes(kw)).length;

  if (groundedCount >= 3) {
    score += 15;
    details.push(`${groundedCount} grounded terms = strong authenticity (+15 pts)`);
  }

  // Voice alignment check
  const titleLower = angle.title.toLowerCase();
  if (profile.studentVoice === 'conversational') {
    // Conversational voice needs simple, direct language
    const hasComplexWords = /metaphysical|phenomenological|dialectic|hermeneutic/i.test(titleLower);
    if (hasComplexWords) {
      score -= 15;
      details.push(`Complex vocabulary conflicts with conversational voice (-15 pts)`);
    }
  } else if (profile.studentVoice === 'introspective') {
    // Introspective can handle more abstract, but still needs grounding
    if (abstractCount > 2 && groundedCount === 0) {
      score -= 10;
      details.push(`Too abstract even for introspective voice (-10 pts)`);
    }
  }

  // Risk level alignment
  if (angle.riskLevel === 'bold' && profile.riskTolerance === 'low') {
    score -= 20;
    details.push(`Bold angle with low risk tolerance = mismatch (-20 pts)`);
  } else if (angle.riskLevel === 'moderate' && profile.riskTolerance === 'high') {
    score += 10;
    details.push(`Moderate angle with high risk tolerance = safe choice (+10 pts)`);
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    details
  };
}

// ============================================================================
// IMPLEMENTABILITY SCORE (0-100)
// ============================================================================

function calculateImplementabilityScore(angle: NarrativeAngle, profile: GenerationProfile): {
  score: number;
  details: string[];
} {
  let score = 50;
  const details: string[] = [];

  // Check if angle connects to profile activities
  const activityType = profile.activityType || 'other';
  const role = profile.role?.toLowerCase() || '';
  const titleLower = angle.title.toLowerCase();

  // Activity relevance
  if (activityType === 'academic' || activityType === 'research') {
    const hasAcademicRelevance = /research|study|discover|analyze|experiment|investigate/i.test(titleLower);
    if (hasAcademicRelevance) {
      score += 10;
      details.push(`Angle aligns with academic activity (+10 pts)`);
    }
  }

  if (activityType === 'technical' || role.includes('engineer') || role.includes('robot') || role.includes('code')) {
    const hasTechnicalRelevance = GROUNDED_KEYWORDS.actions.some(kw => titleLower.includes(kw)) ||
                                  GROUNDED_KEYWORDS.objects.some(kw => titleLower.includes(kw));
    if (hasTechnicalRelevance) {
      score += 15;
      details.push(`Strong technical relevance to role (+15 pts)`);
    }
  }

  // Hook clarity (can the student actually write this opening?)
  const hookLength = angle.hook.length;
  if (hookLength > 150) {
    score -= 10;
    details.push(`Hook too long (${hookLength} chars) = hard to implement (-10 pts)`);
  } else if (hookLength < 50) {
    score -= 5;
    details.push(`Hook too short (${hookLength} chars) = vague guidance (-5 pts)`);
  } else {
    score += 10;
    details.push(`Hook well-sized (${hookLength} chars) = clear guidance (+10 pts)`);
  }

  // Philosophical depth check (too deep = hard to execute)
  const philDepthLower = angle.philosophicalDepth?.toLowerCase() || '';
  const hasHeavyPhilosophy = /fundamental nature|essence of|existential|ontological/i.test(philDepthLower);

  if (hasHeavyPhilosophy) {
    score -= 15;
    details.push(`Heavy philosophical depth = difficult execution (-15 pts)`);
  }

  // Universal insight clarity
  const insightLower = angle.universalInsight?.toLowerCase() || '';
  const hasActionableInsight = /when|how|why we|what happens/i.test(insightLower);

  if (hasActionableInsight) {
    score += 10;
    details.push(`Clear, actionable universal insight (+10 pts)`);
  }

  // Throughline check
  if (angle.throughline && angle.throughline.length > 30) {
    score += 15;
    details.push(`Detailed throughline provides clear direction (+15 pts)`);
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    details
  };
}

// ============================================================================
// RED FLAGS & WARNINGS
// ============================================================================

function identifyFlags(angle: NarrativeAngle, scores: {
  grounding: number;
  bridge: number;
  authenticity: number;
  implementability: number;
}): {
  redFlags: string[];
  warnings: string[];
  strengths: string[];
} {
  const redFlags: string[] = [];
  const warnings: string[] = [];
  const strengths: string[] = [];

  // RED FLAGS (deal-breakers)
  if (scores.authenticity < 40) {
    redFlags.push(`Very low authenticity potential (${scores.authenticity}/100) - likely to sound inauthentic`);
  }

  if (scores.grounding < 30) {
    redFlags.push(`Critically abstract (${scores.grounding}/100) - will lose concrete grounding`);
  }

  const mysticalCount = ABSTRACT_KEYWORDS.mystical.filter(kw =>
    angle.title.toLowerCase().includes(kw) || angle.hook.toLowerCase().includes(kw)
  ).length;

  if (mysticalCount >= 2) {
    redFlags.push(`Multiple mystical/spiritual terms - too abstract for college essay`);
  }

  if (angle.originality >= 9 && scores.grounding < 60) {
    redFlags.push(`Very high originality (${angle.originality}/10) + low grounding = Session 18 failure pattern`);
  }

  // WARNINGS
  if (scores.bridge < 40) {
    warnings.push(`Weak technical-human bridge (${scores.bridge}/100) - connection may not be clear`);
  }

  if (scores.implementability < 50) {
    warnings.push(`Low implementability (${scores.implementability}/100) - difficult to execute well`);
  }

  if (angle.originality === 8 && scores.grounding < 70) {
    warnings.push(`Originality 8/10 needs strong grounding (current: ${scores.grounding}/100)`);
  }

  const abstractCount = Object.values(ABSTRACT_KEYWORDS).flat()
    .filter(kw => angle.title.toLowerCase().includes(kw)).length;

  if (abstractCount >= 2) {
    warnings.push(`${abstractCount} abstract terms in title - may lose authenticity`);
  }

  // STRENGTHS
  if (scores.grounding >= 70) {
    strengths.push(`Strong grounding (${scores.grounding}/100) - concrete and tangible`);
  }

  if (scores.bridge >= 70) {
    strengths.push(`Excellent technical-human bridge (${scores.bridge}/100)`);
  }

  if (scores.authenticity >= 75) {
    strengths.push(`High authenticity potential (${scores.authenticity}/100)`);
  }

  if (angle.originality === 7) {
    strengths.push(`Optimal originality (7/10) - Session 18 sweet spot`);
  }

  const groundedCount = Object.values(GROUNDED_KEYWORDS).flat()
    .filter(kw => angle.title.toLowerCase().includes(kw) || angle.hook.toLowerCase().includes(kw)).length;

  if (groundedCount >= 3) {
    strengths.push(`${groundedCount} grounded keywords - highly concrete`);
  }

  return { redFlags, warnings, strengths };
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

export function validateAngleQuality(
  angle: NarrativeAngle,
  profile: GenerationProfile
): AngleQualityScore {
  // Calculate dimensional scores
  const grounding = calculateGroundingScore(angle);
  const bridge = calculateBridgeScore(angle);
  const authenticity = calculateAuthenticityPotential(angle, profile);
  const implementability = calculateImplementabilityScore(angle, profile);

  // Weighted overall quality (grounding and authenticity most important)
  const overallQuality = (
    grounding.score * 0.30 +
    bridge.score * 0.20 +
    authenticity.score * 0.35 +
    implementability.score * 0.15
  );

  // Identify flags
  const { redFlags, warnings, strengths } = identifyFlags(angle, {
    grounding: grounding.score,
    bridge: bridge.score,
    authenticity: authenticity.score,
    implementability: implementability.score
  });

  // Determine recommendation
  let recommendation: 'excellent' | 'good' | 'acceptable' | 'risky' | 'avoid';
  let confidence: number;

  if (redFlags.length > 0) {
    recommendation = 'avoid';
    confidence = 0.9;
  } else if (overallQuality >= 75 && authenticity.score >= 70) {
    recommendation = 'excellent';
    confidence = 0.85;
  } else if (overallQuality >= 65 && authenticity.score >= 60) {
    recommendation = 'good';
    confidence = 0.75;
  } else if (overallQuality >= 50 && authenticity.score >= 50) {
    recommendation = 'acceptable';
    confidence = 0.65;
  } else {
    recommendation = 'risky';
    confidence = 0.70;
  }

  return {
    angle,
    overallQuality: Math.round(overallQuality),
    groundingScore: grounding.score,
    bridgeScore: bridge.score,
    authenticityPotential: authenticity.score,
    implementabilityScore: implementability.score,
    redFlags,
    warnings,
    strengths,
    recommendation,
    confidence
  };
}

/**
 * Validate and rank multiple angles
 */
export function validateAndRankAngles(
  angles: NarrativeAngle[],
  profile: GenerationProfile
): AngleQualityScore[] {
  const validatedAngles = angles.map(angle => validateAngleQuality(angle, profile));

  // Sort by overall quality (highest first), but penalize 'avoid' recommendations
  validatedAngles.sort((a, b) => {
    if (a.recommendation === 'avoid' && b.recommendation !== 'avoid') return 1;
    if (a.recommendation !== 'avoid' && b.recommendation === 'avoid') return -1;
    return b.overallQuality - a.overallQuality;
  });

  return validatedAngles;
}

/**
 * Get the best angle after validation (replaces selectOptimalAngle)
 */
export function selectBestValidatedAngle(
  angles: NarrativeAngle[],
  profile: GenerationProfile
): { angle: NarrativeAngle; validation: AngleQualityScore } {
  const validated = validateAndRankAngles(angles, profile);

  // Filter out 'avoid' recommendations
  const usableAngles = validated.filter(v => v.recommendation !== 'avoid');

  if (usableAngles.length === 0) {
    return { angle: validated[0].angle, validation: validated[0] };
  }

  // Return best angle
  return { angle: usableAngles[0].angle, validation: usableAngles[0] };
}
