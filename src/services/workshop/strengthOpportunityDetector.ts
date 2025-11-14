/**
 * Strength & Opportunity Detector
 *
 * Identifies what's working well (strengths) and untapped potential (opportunities)
 * in the student's narrative. Not all insights are problems to fix - we also want
 * to highlight what they should amplify and what they could add.
 *
 * Philosophy: Show we understand their narrative holistically - celebrate strengths,
 * spot opportunities for elevation, not just point out problems.
 */

import type {
  StrengthInsight,
  OpportunityInsight,
  InsightCard,
} from './insightTypes';

import type {
  RubricCategory,
  RubricCategoryScore,
} from '@/components/portfolio/extracurricular/workshop/backendTypes';

import { PATTERN_GROUPS } from './issuePatterns';

// ============================================================================
// STRENGTH DETECTION
// ============================================================================

/**
 * Detect strengths across all dimensions
 */
export function detectStrengths(
  draftText: string,
  dimensionScores: RubricCategoryScore[]
): StrengthInsight[] {
  const strengths: StrengthInsight[] = [];

  // For each high-scoring dimension, identify what's working
  dimensionScores.forEach(dimScore => {
    if (dimScore.score_0_to_10 >= 7.5) {
      const strength = analyzeStrength(draftText, dimScore);
      if (strength) {
        strengths.push(strength);
      }
    }
  });

  // Sort by score (highest first)
  return strengths.sort((a, b) => {
    const aScore = dimensionScores.find(d => d.name === a.dimension)?.score_0_to_10 || 0;
    const bScore = dimensionScores.find(d => d.name === b.dimension)?.score_0_to_10 || 0;
    return bScore - aScore;
  });
}

/**
 * Analyze specific strength in a dimension
 */
function analyzeStrength(
  draftText: string,
  dimensionScore: RubricCategoryScore
): StrengthInsight | null {
  const dimension = dimensionScore.name as RubricCategory;
  const score = dimensionScore.score_0_to_10;

  // Dimension-specific strength analysis
  const strengthAnalyzers: Record<RubricCategory, (text: string, score: number) => StrengthInsight | null> = {
    voice_integrity: analyzeVoiceStrength,
    specificity_evidence: analyzeSpecificityStrength,
    transformative_impact: analyzeTransformationStrength,
    role_clarity_ownership: analyzeOwnershipStrength,
    narrative_arc_stakes: analyzeNarrativeStrength,
    initiative_leadership: analyzeInitiativeStrength,
    community_collaboration: analyzeCommunityStrength,
    reflection_meaning: analyzeReflectionStrength,
    craft_language_quality: analyzeCraftStrength,
    fit_trajectory: analyzeFitStrength,
    time_investment_consistency: analyzeTimeStrength,
  };

  const analyzer = strengthAnalyzers[dimension];
  return analyzer ? analyzer(draftText, score) : null;
}

// ============================================================================
// DIMENSION-SPECIFIC STRENGTH ANALYZERS
// ============================================================================

function analyzeVoiceStrength(text: string, score: number): StrengthInsight | null {
  // Check for authentic voice markers
  const authenticMarkers = /\b(honestly|actually|turns out|realized|didn't expect|surprised)\b/gi;
  const matches = text.match(authenticMarkers);

  if (matches && matches.length >= 2) {
    const examples = extractExamples(text, authenticMarkers, 2);
    return {
      dimension: 'voice_integrity',
      title: 'Authentic, Natural Voice',
      whatWorking: 'Your voice sounds genuine and conversational, not manufactured for admissions. You use natural language that reveals honest thoughts and surprises.',
      examples,
      whyItMatters: 'Authenticity is rare and memorable. Admissions officers read thousands of manufactured essays - yours stands out by sounding real.',
      howToAmplify: 'Continue letting your natural voice guide your writing. Trust moments of vulnerability and surprise - these are your strongest authenticity markers.',
      rarityFactor: 'Only top 15-20% of essays achieve this level of voice authenticity.',
    };
  }

  return null;
}

function analyzeSpecificityStrength(text: string, score: number): StrengthInsight | null {
  // Check for concrete numbers and specific details
  const numbers = text.match(/\d+/g);
  const specificTimeframes = /\b(every (monday|tuesday|wednesday|thursday|friday|saturday|sunday)|am|pm|hours per week|weeks|months)\b/gi;
  const timeMatches = text.match(specificTimeframes);

  if (numbers && numbers.length >= 5 && timeMatches && timeMatches.length >= 2) {
    const examples = extractNumberExamples(text, 3);
    return {
      dimension: 'specificity_evidence',
      title: 'Strong Quantified Evidence',
      whatWorking: 'You consistently use specific numbers, timeframes, and metrics to ground your claims. Your essay reads like a credible report, not vague assertions.',
      examples,
      whyItMatters: 'Specificity builds trust. Officers can verify scope and assess real commitment level. Vague claims invite skepticism.',
      howToAmplify: 'Continue this pattern. Add before/after comparisons to show growth: "Started with X, grew to Y."',
      rarityFactor: 'Top 10% of essays demonstrate this level of quantified evidence.',
    };
  }

  return null;
}

function analyzeTransformationStrength(text: string, score: number): StrengthInsight | null {
  // Check for genuine transformation markers
  const transformMarkers = /(realized|understood|discovered|shifted|changed my (thinking|approach|perspective)|now i|used to think|before.*but now)/gi;
  const matches = text.match(transformMarkers);

  if (matches && matches.length >= 2) {
    const examples = extractExamples(text, transformMarkers, 2);
    return {
      dimension: 'transformative_impact',
      title: 'Visible Personal Transformation',
      whatWorking: 'You show clear evidence of how this experience changed your thinking or approach. The transformation feels genuine, not manufactured.',
      examples,
      whyItMatters: 'Officers seek students who learn and grow. Visible transformation distinguishes deep involvement from casual participation.',
      howToAmplify: 'Ground these shifts in specific moments: "After X happened, I realized Y." Story-based transformation is most credible.',
      rarityFactor: 'Only 20-25% of essays show this level of authentic personal growth.',
    };
  }

  return null;
}

function analyzeOwnershipStrength(text: string, score: number): StrengthInsight | null {
  // Check for strong ownership language
  const ownershipVerbs = /\b(i (created|designed|built|founded|launched|organized|led|initiated|developed|established))\b/gi;
  const matches = text.match(ownershipVerbs);

  if (matches && matches.length >= 3) {
    const examples = extractExamples(text, ownershipVerbs, 3);
    return {
      dimension: 'role_clarity_ownership',
      title: 'Crystal-Clear Ownership',
      whatWorking: 'Your role and contributions are unmistakably clear. You use strong action verbs and make YOUR unique contribution visible.',
      examples,
      whyItMatters: 'Officers need to know what YOU did, not what the team accomplished. Clear ownership signals leadership and initiative.',
      howToAmplify: 'Keep this clarity throughout. When mentioning "we," immediately clarify your specific role: "While the team X, I Y."',
      rarityFactor: 'Top 15% of essays achieve this level of role clarity.',
    };
  }

  return null;
}

function analyzeNarrativeStrength(text: string, score: number): StrengthInsight | null {
  // Check for strong narrative elements
  const conflictMarkers = /\b(challenge|problem|failed|mistake|wrong|setback|obstacle|difficult|struggle)\b/gi;
  const resolutionMarkers = /\b(overcame|solved|fixed|adapted|pivoted|changed approach|breakthrough|success)\b/gi;

  const conflicts = text.match(conflictMarkers);
  const resolutions = text.match(resolutionMarkers);

  if (conflicts && conflicts.length >= 2 && resolutions && resolutions.length >= 1) {
    const examples = extractExamples(text, conflictMarkers, 2);
    return {
      dimension: 'narrative_arc_stakes',
      title: 'Compelling Narrative Arc',
      whatWorking: 'Your essay includes real conflict, obstacles, and resolution. The narrative has tension and stakes that make achievement meaningful.',
      examples,
      whyItMatters: 'Stories with obstacles are memorable and demonstrate resilience. Easy success is forgettable.',
      howToAmplify: 'Deepen the stakes by showing what was at risk emotionally, not just practically. "I was terrified that..."',
      rarityFactor: 'Only 30% of essays include genuine narrative tension.',
    };
  }

  return null;
}

function analyzeInitiativeStrength(text: string, score: number): StrengthInsight | null {
  // Check for initiative markers
  const initiativeMarkers = /\b((i )?(noticed|saw|identified|recognized).*(problem|need|gap|opportunity|issue)|(i )?(started|created|founded|launched|initiated))\b/gi;
  const matches = text.match(initiativeMarkers);

  if (matches && matches.length >= 2) {
    const examples = extractExamples(text, initiativeMarkers, 2);
    return {
      dimension: 'initiative_leadership',
      title: 'Strong Initiative & Problem-Spotting',
      whatWorking: 'You demonstrate proactive leadership by identifying problems or opportunities and taking action. This signals independent thinking.',
      examples,
      whyItMatters: 'Top colleges seek students who create change, not just participate in existing structures. Initiative distinguishes leaders.',
      howToAmplify: 'Show the thought process: "When I noticed X, I wondered if Y, so I Z." The cognitive journey matters.',
      rarityFactor: 'Top 20% of essays show this level of proactive initiative.',
    };
  }

  return null;
}

function analyzeCommunityStrength(text: string, score: number): StrengthInsight | null {
  // Check for community impact evidence
  const communityMarkers = /\b(people|students|families|community|participants).*(now|before.*after|used to.*now|changed|improved|grew)\b/gi;
  const namedPeople = /[A-Z][a-z]+\s+(said|told|taught|helped|showed|asked)/g;

  const impactMatches = text.match(communityMarkers);
  const nameMatches = text.match(namedPeople);

  if ((impactMatches && impactMatches.length >= 1) || (nameMatches && nameMatches.length >= 2)) {
    const examples = extractExamples(text, communityMarkers, 2);
    return {
      dimension: 'community_collaboration',
      title: 'Credible Community Impact',
      whatWorking: 'You show specific evidence of how your work transformed others or the community. Impact feels real, not inflated.',
      examples,
      whyItMatters: 'Generic claims about "helping people" lack credibility. Specific community transformation proves lasting impact.',
      howToAmplify: 'Add more voices: what did beneficiaries say? How did their behavior change? Direct quotes build credibility.',
      rarityFactor: 'Only 25% of essays provide this level of community impact evidence.',
    };
  }

  return null;
}

function analyzeReflectionStrength(text: string, score: number): StrengthInsight | null {
  // Check for universal insights
  const universalMarkers = /\b(people|everyone|human nature|in general|realized about).*(not just|beyond|applies to)\b/gi;
  const matches = text.match(universalMarkers);

  if (matches && matches.length >= 1) {
    const examples = extractExamples(text, universalMarkers, 1);
    return {
      dimension: 'reflection_meaning',
      title: 'Deep, Universal Insight',
      whatWorking: 'You extract transferable wisdom from specific experience, showing intellectual depth. Your reflection transcends the activity.',
      examples,
      whyItMatters: 'Universal insights demonstrate ability to generalize from experience - key skill for academic success.',
      howToAmplify: 'Ground universal insights in specific moments: "When X happened, I realized this applies to all Y situations."',
      rarityFactor: 'Top 15% of essays achieve this depth of reflection.',
    };
  }

  return null;
}

function analyzeCraftStrength(text: string, score: number): StrengthInsight | null {
  // Check for literary craft
  const dialogueCount = (text.match(/["'].*?["']/g) || []).length;
  const sensoryWords = /\b(smell|sound|taste|touch|felt|looked|heard|saw|texture|color|warm|cold|bright|dark)\b/gi;
  const sensoryMatches = text.match(sensoryWords);

  if (dialogueCount >= 2 || (sensoryMatches && sensoryMatches.length >= 5)) {
    const examples = dialogueCount >= 2
      ? extractExamples(text, /["'].*?["']/g, 2)
      : extractExamples(text, sensoryWords, 3);
    return {
      dimension: 'craft_language_quality',
      title: 'Strong Literary Craft',
      whatWorking: 'Your essay uses dialogue and/or sensory details to create immersive scenes. This demonstrates literary sophistication.',
      examples,
      whyItMatters: 'Literary craft makes essays memorable and shows communication skill. Officers remember well-crafted scenes.',
      howToAmplify: 'Continue building scenes. Brief, natural dialogue and specific sensory details are authenticity markers.',
      rarityFactor: 'Only 20% of essays demonstrate this level of craft.',
    };
  }

  return null;
}

function analyzeFitStrength(text: string, score: number): StrengthInsight | null {
  // Check for future connection
  const futureMarkers = /\b(college|major|career|future|want to|plan to|pursuing|studying|research|continue)\b/gi;
  const matches = text.match(futureMarkers);

  if (matches && matches.length >= 2) {
    const examples = extractExamples(text, futureMarkers, 2);
    return {
      dimension: 'fit_trajectory',
      title: 'Clear Trajectory & Fit',
      whatWorking: 'You connect past experience to future aspirations, creating coherent narrative. Officers see where you\'re headed.',
      examples,
      whyItMatters: 'Coherent trajectory from past → present → future makes you memorable and your interests credible.',
      howToAmplify: 'Make the connection explicit: "This experience is why I want to study X" or "I plan to use Y approach in college."',
      rarityFactor: 'Top 30% of essays create this level of narrative coherence.',
    };
  }

  return null;
}

function analyzeTimeStrength(text: string, score: number): StrengthInsight | null {
  // Check for detailed time commitment
  const durationMarkers = /(from|since|september|january|months|years|grade \d+)/gi;
  const frequencyMarkers = /(every|per week|per day|hours|times a week)/gi;

  const duration = text.match(durationMarkers);
  const frequency = text.match(frequencyMarkers);

  if (duration && duration.length >= 2 && frequency && frequency.length >= 1) {
    const examples = extractExamples(text, durationMarkers, 2);
    return {
      dimension: 'time_investment_consistency',
      title: 'Clear, Sustained Commitment',
      whatWorking: 'You specify exact duration and frequency of involvement, demonstrating sustained commitment over time.',
      examples,
      whyItMatters: 'Specific time investment proves depth vs superficial involvement. Officers can assess true commitment level.',
      howToAmplify: 'Add growth over time: "First year: 2 hours/week. By senior year: 8 hours/week."',
      rarityFactor: 'Only 40% of essays provide this level of time detail.',
    };
  }

  return null;
}

// ============================================================================
// OPPORTUNITY DETECTION
// ============================================================================

/**
 * Detect opportunities for elevation across all dimensions
 */
export function detectOpportunities(
  draftText: string,
  dimensionScores: RubricCategoryScore[]
): OpportunityInsight[] {
  const opportunities: OpportunityInsight[] = [];

  // For dimensions scoring 5-7 (solid but room for elevation)
  dimensionScores.forEach(dimScore => {
    if (dimScore.score_0_to_10 >= 5 && dimScore.score_0_to_10 < 7.5) {
      const opportunity = analyzeOpportunity(draftText, dimScore);
      if (opportunity) {
        opportunities.push(opportunity);
      }
    }
  });

  // Sort by potential impact (weight * gap to 10)
  return opportunities.sort((a, b) => {
    const aScore = dimensionScores.find(d => d.name === a.dimension);
    const bScore = dimensionScores.find(d => d.name === b.dimension);
    if (!aScore || !bScore) return 0;

    const aImpact = aScore.weight * (10 - aScore.score_0_to_10);
    const bImpact = bScore.weight * (10 - bScore.score_0_to_10);
    return bImpact - aImpact;
  });
}

/**
 * Analyze opportunity in a specific dimension
 */
function analyzeOpportunity(
  draftText: string,
  dimensionScore: RubricCategoryScore
): OpportunityInsight | null {
  const dimension = dimensionScore.name as RubricCategory;
  const score = dimensionScore.score_0_to_10;
  const roomForGrowth = 10 - score;

  // Focus on highest-leverage opportunities
  const opportunityDescriptions: Record<RubricCategory, {
    title: string;
    currentState: string;
    potentialState: string;
    whyItMatters: string;
    howToCapture: string;
  }> = {
    voice_integrity: {
      title: 'Untapped Authenticity Potential',
      currentState: 'Voice is solid but occasionally slips into essay-speak or manufactured phrases',
      potentialState: 'Consistently authentic voice that sounds like you talking to a trusted mentor',
      whyItMatters: 'Authentic voice is rare and makes essays memorable. Small shifts can dramatically increase uniqueness.',
      howToCapture: 'Replace 2-3 remaining manufactured phrases with specific observations. Read aloud and revise anything that sounds "written for admissions."',
    },
    specificity_evidence: {
      title: 'Opportunity for Deeper Quantification',
      currentState: 'Some specifics present but missing key metrics or before/after comparisons',
      potentialState: 'Every major claim backed by numbers, timeframes, or observable change',
      whyItMatters: 'Specificity builds credibility and lets officers verify scope of commitment.',
      howToCapture: 'Add 3-5 concrete numbers (time spent, people impacted, resources mobilized, growth metrics). Include one before/after comparison.',
    },
    transformative_impact: {
      title: 'Deepen Transformation Narrative',
      currentState: 'Some learning visible but could show more specific moments of shift or surprise',
      potentialState: 'Clear before/after transformation with specific moments where understanding shifted',
      whyItMatters: 'Transformation distinguishes deep involvement from casual participation.',
      howToCapture: 'Add one specific moment of surprise: "I didn\'t expect X, but it turned out Y." Show what you used to think vs now.',
    },
    role_clarity_ownership: {
      title: 'Sharpen Role Clarity',
      currentState: 'General sense of your involvement but could be more explicit about unique contribution',
      potentialState: 'Crystal-clear distinction between what YOU did vs team efforts',
      whyItMatters: 'Officers evaluate YOU, not the team. Vague attribution dilutes your achievement.',
      howToCapture: 'Replace 2-3 "we" statements with "While team did X, I specifically Y." Use action verbs that show ownership.',
    },
    narrative_arc_stakes: {
      title: 'Add Narrative Tension',
      currentState: 'Story present but missing clear obstacle or moment of uncertainty',
      potentialState: 'Compelling arc with specific challenge, turning point, and resolution',
      whyItMatters: 'Stories with stakes are memorable. Easy success doesn\'t demonstrate resilience.',
      howToCapture: 'Add one specific setback or obstacle. Show emotional stakes: "I worried that..." or "When X failed, I..."',
    },
    initiative_leadership: {
      title: 'Highlight Problem-Spotting',
      currentState: 'Action visible but missing the "why" - what problem or opportunity did you identify?',
      potentialState: 'Clear narrative: "I noticed X was broken/missing, so I Y"',
      whyItMatters: 'Initiative distinguishes leaders from participants. Problem identification shows independent thinking.',
      howToCapture: 'Add one sentence: "I noticed [problem]. This mattered because [impact]. So I [action]."',
    },
    community_collaboration: {
      title: 'Strengthen Community Impact Evidence',
      currentState: 'Impact stated but could show more specific behavioral change or voices',
      potentialState: 'Clear before/after community change with specific evidence or quotes',
      whyItMatters: 'Generic impact claims lack credibility. Specific community transformation proves lasting effect.',
      howToCapture: 'Add one example of community behavioral change: "Families now..." or "Students started..." Include a quote if possible.',
    },
    reflection_meaning: {
      title: 'Extract Universal Insight',
      currentState: 'Activity-specific reflection but could connect to broader truth',
      potentialState: 'Transferable wisdom that applies beyond this experience',
      whyItMatters: 'Universal insights demonstrate intellectual depth and ability to generalize from experience.',
      howToCapture: 'From your specific experience, extract one broader principle: "This taught me about how people learn" or "about effective collaboration."',
    },
    craft_language_quality: {
      title: 'Add Immersive Scene Elements',
      currentState: 'Clear writing but could add sensory details or dialogue to create presence',
      potentialState: 'At least one vivid scene with sensory details or brief dialogue',
      whyItMatters: 'Literary craft makes essays memorable and demonstrates communication skill.',
      howToCapture: 'Choose one key moment and expand into scene: add what you saw/heard/felt or 1-2 lines of dialogue.',
    },
    fit_trajectory: {
      title: 'Strengthen Future Connection',
      currentState: 'Experience described but missing explicit link to academic/career goals',
      potentialState: 'Clear connection: "This experience shaped my interest in X" or "I want to use Y approach in college"',
      whyItMatters: 'Coherent past→present→future narrative makes you memorable and interests credible.',
      howToCapture: 'Add one sentence connecting experience to future: "This is why I want to study..." or "I plan to use this approach when..."',
    },
    time_investment_consistency: {
      title: 'Quantify Time Commitment',
      currentState: 'Involvement clear but missing specific duration/frequency',
      potentialState: 'Exact dates/duration and weekly time commitment specified',
      whyItMatters: 'Time investment proves depth vs casual involvement. Officers can assess true commitment.',
      howToCapture: 'Add exact duration (dates/months) and frequency (hours/week). Even better: show growth over time.',
    },
  };

  const opp = opportunityDescriptions[dimension];
  if (!opp) return null;

  const potentialGain = Math.round(roomForGrowth * dimensionScore.weight * 10);

  return {
    dimension,
    title: opp.title,
    currentState: opp.currentState,
    potentialState: opp.potentialState,
    whyItMatters: opp.whyItMatters,
    howToCapture: opp.howToCapture,
    estimatedImpact: `+${potentialGain} to +${potentialGain + 2} points`,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract example sentences matching a pattern
 */
function extractExamples(text: string, pattern: RegExp, count: number): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const examples: string[] = [];

  for (const sentence of sentences) {
    if (pattern.test(sentence) && examples.length < count) {
      examples.push(sentence.trim());
    }
  }

  return examples;
}

/**
 * Extract sentences containing numbers
 */
function extractNumberExamples(text: string, count: number): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const examples: string[] = [];

  for (const sentence of sentences) {
    if (/\d+/.test(sentence) && examples.length < count) {
      examples.push(sentence.trim());
    }
  }

  return examples;
}

export {
  detectStrengths,
  detectOpportunities,
  analyzeStrength,
  analyzeOpportunity,
};
