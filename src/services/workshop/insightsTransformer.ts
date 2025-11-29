/**
 * Sophisticated Insights Transformation Pipeline
 *
 * Transforms backend CoachingIssue[] → Rich InsightCard[] with:
 * - Deep pattern analysis
 * - Extracted quotes with context
 * - Comparative examples (weak vs strong)
 * - Multiple solution approaches
 * - Pre-filled chat prompts
 * - Dynamic severity calculation
 * - Point impact estimation
 *
 * Philosophy: Show we deeply understand their narrative and where it can go.
 */

import type {
  InsightCard,
  DraftQuote,
  PointImpact,
  PatternAnalysis,
  ComparativeExample,
  Annotation,
  SolutionApproach,
  FocusModeContext,
  DimensionSummary,
  StrengthInsight,
  OpportunityInsight,
  PortfolioContributionInsights,
  InsightsState,
} from './insightTypes';

import type {
  CoachingIssue,
  CoachingOutput,
  RubricCategory,
  RubricCategoryScore,
} from '@/components/portfolio/extracurricular/workshop/backendTypes';

import type { TeachingExample } from './teachingExamples';
import { TEACHING_EXAMPLES } from './teachingExamples';
import {
  PATTERN_GROUPS,
  getPatternsForDimension,
  getPatternById,
  type IssuePattern,
} from './issuePatterns';

// ============================================================================
// MAIN TRANSFORMATION FUNCTION
// ============================================================================

/**
 * Transform CoachingIssue → Rich InsightCard with deep analysis
 */
export function transformIssueToInsight(
  issue: CoachingIssue,
  draftText: string,
  dimensionScore: RubricCategoryScore,
  overallNQI: number,
  context?: {
    activityCategory?: string;
    studentMajorInterest?: string;
    culturalContext?: string;
  }
): InsightCard {
  // Extract quotes from draft
  const quotes = extractQuotesFromDraft(draftText, issue, dimensionScore.name as RubricCategory);

  // Get pattern analysis
  const patternAnalysis = generatePatternAnalysis(draftText, issue, dimensionScore.name as RubricCategory);

  // Calculate severity dynamically
  const severity = calculateDynamicSeverity({
    dimensionScore: dimensionScore.score_0_to_10,
    dimensionWeight: dimensionScore.weight,
    issueImpact: patternAnalysis.occurrenceCount * 0.5, // Rough estimate
    issueFrequency: patternAnalysis.occurrenceCount,
    rarityInStrongEssays: 0.2, // Default: rare in top essays
  });

  // Calculate point impact
  const pointImpact = calculatePointImpact(
    dimensionScore.score_0_to_10,
    dimensionScore.weight,
    severity,
    patternAnalysis.occurrenceCount
  );

  // Get comparative examples
  const examples = matchComparativeExamples(issue, dimensionScore.name as RubricCategory, context);

  // Generate solution approaches
  const solutions = generateSolutionApproaches(issue, dimensionScore.name as RubricCategory, severity);

  // Generate pre-filled chat prompt
  const chatRouting = generateChatPrompt(
    issue,
    dimensionScore.name as RubricCategory,
    severity,
    quotes,
    examples,
    solutions,
    {
      currentDimensionScore: dimensionScore.score_0_to_10,
      targetDimensionScore: Math.min(10, dimensionScore.score_0_to_10 + 2),
      overallNQI,
    }
  );

  const problemText = issue.teaching?.problem?.explanation || issue.problem || 'Writing issue detected';
  return {
    id: `insight-${dimensionScore.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    dimension: dimensionScore.name as RubricCategory,
    dimensionDisplayName: getDimensionDisplayName(dimensionScore.name as RubricCategory),
    severity,
    type: 'issue',
    title: generateInsightTitle(issue, dimensionScore.name as RubricCategory),
    summary: problemText.substring(0, 120) + '...',
    technical: {
      whatWeDetected: generateTechnicalDetection(issue, patternAnalysis),
      fromYourDraft: quotes,
      whyThisMatters: generateWhyThisMatters(issue, dimensionScore.name as RubricCategory),
      pointImpact,
      patternAnalysis,
    },
    examples,
    solutions: {
      approaches: solutions,
      principles: extractPrinciples(solutions),
      difficulty: determineDifficulty(solutions),
      estimatedTime: estimateTotalTime(solutions),
      priorityRank: calculatePriorityRank(severity, pointImpact, dimensionScore.weight),
    },
    chatRouting,
    isExpanded: false,
    isCompleted: false,
  };
}

// ============================================================================
// QUOTE EXTRACTION WITH CONTEXT
// ============================================================================

/**
 * Extract relevant quotes from student's draft with context awareness
 */
function extractQuotesFromDraft(
  draftText: string,
  issue: CoachingIssue,
  dimension: RubricCategory
): DraftQuote[] {
  const quotes: DraftQuote[] = [];
  const sentences = draftText.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Get patterns for this dimension
  const patterns = getPatternsForDimension(dimension);

  // For each pattern, find matching sentences
  patterns.forEach(pattern => {
    sentences.forEach((sentence, index) => {
      const trimmed = sentence.trim();
      if (pattern.regex.test(trimmed)) {
        // Determine context (beginning/middle/end)
        let context: 'beginning' | 'middle' | 'end' = 'middle';
        if (index < sentences.length * 0.25) context = 'beginning';
        else if (index > sentences.length * 0.75) context = 'end';

        // Get surrounding text for context
        const surroundingText =
          index > 0 && index < sentences.length - 1
            ? `...${sentences[index - 1].trim()}. ${trimmed}. ${sentences[index + 1].trim()}...`
            : undefined;

        quotes.push({
          text: trimmed,
          lineNumber: index + 1,
          context,
          surroundingText,
          highlightReason: pattern.explanation,
        });
      }
    });
  });

  // Limit to top 5 most relevant quotes
  return quotes.slice(0, 5);
}

// ============================================================================
// PATTERN ANALYSIS
// ============================================================================

/**
 * Generate deep pattern analysis for the issue
 */
function generatePatternAnalysis(
  draftText: string,
  issue: CoachingIssue,
  dimension: RubricCategory
): PatternAnalysis {
  const patterns = getPatternsForDimension(dimension);
  let totalOccurrences = 0;
  let matchedPatternType = 'generic_issue';

  // Count occurrences across all patterns for this dimension
  patterns.forEach(pattern => {
    const matches = draftText.match(pattern.regex);
    if (matches && matches.length > 0) {
      totalOccurrences += matches.length;
      matchedPatternType = pattern.id;
    }
  });

  const sentenceCount = draftText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const frequency = totalOccurrences > 0 ? `${totalOccurrences} times across essay` : 'Pattern detected';
  const severity =
    totalOccurrences > 5
      ? `Appears in ~${Math.round((totalOccurrences / sentenceCount) * 100)}% of sentences`
      : `${totalOccurrences} instances found`;

  const problemText = issue.teaching?.problem?.explanation || issue.problem || 'Issue detected';
  return {
    patternType: matchedPatternType,
    occurrenceCount: totalOccurrences,
    frequency,
    severity,
    comparison: generateComparisonStatement(totalOccurrences, dimension),
    technicalDetails: [
      problemText,
      `Detected ${totalOccurrences} instances of this pattern`,
      `This pattern weakens the ${getDimensionDisplayName(dimension)} dimension`,
    ],
  };
}

/**
 * Generate comparison statement vs top essays
 */
function generateComparisonStatement(count: number, dimension: RubricCategory): string {
  // High-performing essays benchmarks
  const benchmarks: Record<RubricCategory, number> = {
    voice_integrity: 1,
    specificity_evidence: 2,
    transformative_impact: 0,
    role_clarity_ownership: 3,
    narrative_arc_stakes: 1,
    initiative_leadership: 2,
    community_collaboration: 4,
    reflection_meaning: 1,
    craft_language_quality: 2,
    fit_trajectory: 0,
    time_investment_consistency: 0,
  };

  const benchmark = benchmarks[dimension] || 1;
  if (count > benchmark * 3) {
    return `Top essays average ${benchmark} or fewer instances`;
  } else if (count > benchmark) {
    return `Strong essays typically show ${benchmark} or fewer`;
  } else {
    return `Within range of strong essays`;
  }
}

// ============================================================================
// SEVERITY CALCULATION
// ============================================================================

/**
 * Calculate dynamic severity based on multiple factors
 */
function calculateDynamicSeverity(inputs: {
  dimensionScore: number;
  dimensionWeight: number;
  issueImpact: number;
  issueFrequency: number;
  rarityInStrongEssays: number;
}): 'critical' | 'major' | 'minor' {
  const { dimensionScore, dimensionWeight, issueImpact, issueFrequency } = inputs;

  // Critical if:
  // - Dimension score < 5 AND high weight (>9%) AND frequent issue
  if (dimensionScore < 5 && dimensionWeight > 0.09 && issueFrequency > 5) {
    return 'critical';
  }

  // Critical if:
  // - Dimension score < 4 regardless of weight
  if (dimensionScore < 4) {
    return 'critical';
  }

  // Major if:
  // - Dimension score < 7 AND medium-high frequency
  if (dimensionScore < 7 && issueFrequency > 3) {
    return 'major';
  }

  // Major if:
  // - High weight dimension with score < 8
  if (dimensionWeight > 0.1 && dimensionScore < 8) {
    return 'major';
  }

  // Otherwise minor
  return 'minor';
}

// ============================================================================
// POINT IMPACT ESTIMATION
// ============================================================================

/**
 * Calculate estimated point impact (loss from issue + potential gain)
 */
function calculatePointImpact(
  dimensionScore: number,
  dimensionWeight: number,
  severity: 'critical' | 'major' | 'minor',
  frequency: number
): PointImpact {
  // Base impact on severity
  const baseImpact = {
    critical: 8,
    major: 4,
    minor: 2,
  }[severity];

  // Scale by weight and frequency
  const scaledImpact = baseImpact * dimensionWeight * Math.min(frequency / 3, 2);
  const currentLoss = Math.round(scaledImpact);

  // Potential gain depends on how much room for improvement
  const roomForImprovement = 10 - dimensionScore;
  const potentialGainMin = Math.round(Math.min(currentLoss * 0.6, roomForImprovement * 0.3));
  const potentialGainMax = Math.round(Math.min(currentLoss * 0.9, roomForImprovement * 0.5));

  // Confidence based on pattern clarity
  const confidence = frequency > 5 ? 'high' : frequency > 2 ? 'medium' : 'low';

  return {
    current: `-${currentLoss} points`,
    potential: potentialGainMax > potentialGainMin ? `+${potentialGainMin} to +${potentialGainMax} points if fixed` : `+${potentialGainMax} points if fixed`,
    confidence,
    explanation: generateImpactExplanation(currentLoss, potentialGainMin, potentialGainMax, dimensionWeight),
  };
}

/**
 * Generate explanation for impact estimation
 */
function generateImpactExplanation(
  loss: number,
  gainMin: number,
  gainMax: number,
  weight: number
): string {
  const weightPercent = Math.round(weight * 100);
  return `This dimension accounts for ${weightPercent}% of your total NQI score. Fixing this issue could recover ${gainMin}-${gainMax} points.`;
}

// ============================================================================
// COMPARATIVE EXAMPLES
// ============================================================================

/**
 * Match weak vs strong comparative examples
 */
function matchComparativeExamples(
  issue: CoachingIssue,
  dimension: RubricCategory,
  context?: {
    activityCategory?: string;
    culturalContext?: string;
  }
): { weak: ComparativeExample; strong: ComparativeExample; contextualNote?: string } {
  // Get teaching examples for this dimension (using category instead of dimensions)
  const dimensionExamples = TEACHING_EXAMPLES.filter(ex =>
    ex.category && ex.category.includes(dimension)
  );

  // Find first weak and strong examples
  const weakExample = dimensionExamples[0];
  const strongExample = dimensionExamples[dimensionExamples.length - 1] || dimensionExamples[0];

  return {
    weak: convertTeachingToComparative(weakExample, 'weak'),
    strong: convertTeachingToComparative(strongExample, 'strong'),
    contextualNote: `Notice how the strong example demonstrates ${dimension.replace(/_/g, ' ')} through specific details and authentic voice.`,
  };
}

/**
 * Convert TeachingExample to ComparativeExample
 */
function convertTeachingToComparative(
  teaching: TeachingExample | undefined,
  type: 'weak' | 'strong'
): ComparativeExample {
  if (!teaching) {
    return {
      text: type === 'weak'
        ? 'Generic placeholder text without specific details or authentic voice.'
        : 'Specific, authentic text with concrete details, active voice, and clear narrative arc.',
      score: type === 'weak' ? 3 : 9,
      annotations: [
        {
          highlight: type === 'weak' ? 'Vague language' : 'Specific details',
          explanation: type === 'weak'
            ? 'This could appear in anyone\'s essay'
            : 'Concrete evidence of unique experience',
          category: type === 'weak' ? 'weakness' : 'strength',
        },
      ],
    };
  }

  return {
    text: type === 'weak' ? teaching.weakExample : teaching.strongExample,
    score: type === 'weak' ? 3 : 9,
    annotations: [
      {
        highlight: (teaching.diffHighlights && teaching.diffHighlights[0]) || (type === 'weak' ? 'Weak execution' : 'Strong technique'),
        explanation: teaching.explanation,
        category: type === 'weak' ? 'weakness' : 'strength',
      },
    ],
    context: teaching.category,
  };
}

// ============================================================================
// SOLUTION APPROACHES
// ============================================================================

/**
 * Generate multiple solution approaches with difficulty ratings
 */
function generateSolutionApproaches(
  issue: CoachingIssue,
  dimension: RubricCategory,
  severity: 'critical' | 'major' | 'minor'
): SolutionApproach[] {
  const approaches: SolutionApproach[] = [];

  // Easy approach (always include)
  approaches.push({
    name: 'Quick Fix',
    description: issue.suggested_fixes?.[0]?.text || 'Replace vague language with specific details',
    difficulty: 'easy',
    estimatedTime: '5-10 minutes',
    estimatedImpact: '+1 to +2 points',
    principle: 'Specificity builds credibility',
  });

  // Moderate approach
  approaches.push({
    name: 'Structural Revision',
    description: generateModerateApproach(dimension),
    difficulty: 'moderate',
    estimatedTime: '15-25 minutes',
    estimatedImpact: '+2 to +4 points',
    steps: generateModerateSteps(dimension),
    principle: getDimensionPrinciple(dimension),
  });

  // Challenging approach (for critical issues)
  if (severity === 'critical' || severity === 'major') {
    approaches.push({
      name: 'Deep Narrative Restructure',
      description: generateChallengingApproach(dimension),
      difficulty: 'challenging',
      estimatedTime: '30-45 minutes',
      estimatedImpact: '+4 to +6 points',
      steps: generateChallengingSteps(dimension),
      principle: 'Transform narrative to showcase growth and impact',
    });
  }

  return approaches;
}

/**
 * Generate moderate difficulty approach
 */
function generateModerateApproach(dimension: RubricCategory): string {
  const approaches: Record<RubricCategory, string> = {
    voice_integrity: 'Replace manufactured phrases with specific observations and concrete language',
    specificity_evidence: 'Add precise numbers, timeframes, and before/after comparisons throughout',
    transformative_impact: 'Show specific moments where your understanding shifted or approach changed',
    role_clarity_ownership: 'Clarify your unique contributions vs team efforts with action verbs',
    narrative_arc_stakes: 'Add a specific obstacle/setback and show how you overcame it',
    initiative_leadership: 'Highlight a moment where YOU identified a problem and took action',
    community_collaboration: 'Name specific people and show how collaboration created better outcomes',
    reflection_meaning: 'Extract universal insight from specific experience - what transferable lesson emerged?',
    craft_language_quality: 'Add sensory details and vary sentence structure for rhythm',
    fit_trajectory: 'Connect this experience to your academic interests and future goals',
    time_investment_consistency: 'Add exact duration (dates) and frequency (hours/week) of involvement',
  };
  return approaches[dimension] || 'Revise to strengthen this dimension';
}

/**
 * Generate moderate solution steps
 */
function generateModerateSteps(dimension: RubricCategory): string[] {
  return [
    'Re-read essay and highlight all instances of the issue',
    'For each instance, replace with specific, concrete alternative',
    'Check that revisions maintain your authentic voice',
    'Read aloud to verify natural flow',
  ];
}

/**
 * Generate challenging approach
 */
function generateChallengingApproach(dimension: RubricCategory): string {
  return `Restructure narrative to deeply showcase ${dimension.replace(/_/g, ' ')} through scene, dialogue, and reflection`;
}

/**
 * Generate challenging steps
 */
function generateChallengingSteps(dimension: RubricCategory): string[] {
  return [
    'Identify the most transformative moment in your experience',
    'Expand that moment into a full scene with sensory details',
    'Add dialogue to bring relationships and voice to life',
    'Include interior thought/feeling to show vulnerability',
    'Connect specific experience to universal insight',
    'Revise for voice authenticity and narrative arc',
  ];
}

/**
 * Extract principles from solution approaches
 */
function extractPrinciples(approaches: SolutionApproach[]): string[] {
  return approaches.map(a => a.principle);
}

/**
 * Determine overall difficulty
 */
function determineDifficulty(approaches: SolutionApproach[]): 'easy' | 'moderate' | 'challenging' {
  // Return the recommended approach difficulty
  return approaches.find(a => a.estimatedImpact.includes('4 to 6')) ? 'challenging' :
         approaches.find(a => a.estimatedImpact.includes('2 to 4')) ? 'moderate' : 'easy';
}

/**
 * Estimate total time for recommended fix
 */
function estimateTotalTime(approaches: SolutionApproach[]): string {
  // Return time for moderate approach (recommended default)
  const moderate = approaches.find(a => a.difficulty === 'moderate');
  return moderate?.estimatedTime || '15-20 minutes';
}

/**
 * Calculate priority rank
 */
function calculatePriorityRank(
  severity: 'critical' | 'major' | 'minor',
  pointImpact: PointImpact,
  weight: number
): number {
  const severityScore = { critical: 100, major: 50, minor: 20 }[severity];
  const weightScore = weight * 100;
  return Math.round(severityScore + weightScore);
}

// ============================================================================
// CHAT PROMPT GENERATION
// ============================================================================

/**
 * Generate pre-filled chat prompt with focus mode context
 */
function generateChatPrompt(
  issue: CoachingIssue,
  dimension: RubricCategory,
  severity: 'critical' | 'major' | 'minor',
  quotes: DraftQuote[],
  examples: { weak: ComparativeExample; strong: ComparativeExample },
  solutions: SolutionApproach[],
  scores: {
    currentDimensionScore: number;
    targetDimensionScore: number;
    overallNQI: number;
  }
): {
  prefilledPrompt: string;
  focusContext: FocusModeContext;
  suggestedFollowUps: string[];
} {
  const dimensionName = getDimensionDisplayName(dimension);
  const quoteSummary = quotes.length > 0 ? quotes[0].text.substring(0, 100) : 'this section';
  const problemText = issue.teaching?.problem?.explanation || issue.problem || 'this writing issue';

  // Generate pre-filled prompt
  const prefilledPrompt = `Help me improve the ${dimensionName} in my extracurricular essay.

Specifically, I want to work on: ${problemText}

Here's an example from my draft:
"${quoteSummary}${quoteSummary.length >= 100 ? '...' : ''}"

I'm aiming to go from a ${scores.currentDimensionScore}/10 to at least ${scores.targetDimensionScore}/10 on this dimension.`;

  // Generate focus mode context
  const focusContext: FocusModeContext = {
    issueId: `${dimension}-${Date.now()}`,
    dimension,
    severity,
    title: problemText,
    technicalAnalysis: problemText,
    draftQuotes: quotes.map(q => q.text),
    patternDetails: [
      `This issue appears ${quotes.length} times in your essay`,
      issue.suggested_fixes?.[0]?.rationale || 'Consider revising for specificity and authenticity',
    ],
    examples: {
      weak: {
        text: examples.weak.text,
        problems: examples.weak.annotations.map(a => a.explanation),
      },
      strong: {
        text: examples.strong.text,
        techniques: examples.strong.annotations.map(a => a.explanation),
      },
    },
    solutionApproaches: solutions.map(s => `${s.name}: ${s.description}`),
    principles: solutions.map(s => s.principle),
    estimatedTime: solutions[1]?.estimatedTime || '15-20 minutes',
    currentDimensionScore: scores.currentDimensionScore,
    targetDimensionScore: scores.targetDimensionScore,
    overallNQI: scores.overallNQI,
  };

  // Generate follow-up questions
  const suggestedFollowUps = [
    'Show me specific examples of how to rewrite this',
    'How does this compare to strong essays you\'ve seen?',
    'What are the key principles I should keep in mind?',
    `Are there other places in my essay where I can improve ${dimensionName}?`,
  ];

  return {
    prefilledPrompt,
    focusContext,
    suggestedFollowUps,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get display name for dimension
 */
function getDimensionDisplayName(dimension: RubricCategory): string {
  const group = PATTERN_GROUPS.find(g => g.dimension === dimension);
  return group?.displayName || dimension.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get core principle for dimension
 */
function getDimensionPrinciple(dimension: RubricCategory): string {
  const principles: Record<RubricCategory, string> = {
    voice_integrity: 'Authentic voice comes from specific observations, not generic intensifiers',
    specificity_evidence: 'Concrete details build credibility; vague claims invite doubt',
    transformative_impact: 'Show how you changed, not what you learned',
    role_clarity_ownership: 'Make YOUR unique contribution unmistakably clear',
    narrative_arc_stakes: 'Tension and obstacles make achievement meaningful',
    initiative_leadership: 'Leaders identify problems and drive solutions',
    community_collaboration: 'Name people, show relationships, prove collective impact',
    reflection_meaning: 'Extract transferable wisdom from specific experience',
    craft_language_quality: 'Sensory details and varied rhythm create immersion',
    fit_trajectory: 'Connect past experience to future aspirations',
    time_investment_consistency: 'Exact time investment proves depth of commitment',
  };
  return principles[dimension] || 'Strengthen this dimension through specific, authentic details';
}

/**
 * Generate insight title
 */
function generateInsightTitle(issue: CoachingIssue, dimension: RubricCategory): string {
  // Extract key issue from the issue text
  const firstSentence = issue.problem.split('.')[0];
  return firstSentence || `${getDimensionDisplayName(dimension)} Needs Strengthening`;
}

/**
 * Generate technical detection summary
 */
function generateTechnicalDetection(issue: CoachingIssue, analysis: PatternAnalysis): string {
  return `We detected ${analysis.occurrenceCount} instances of this pattern. ${analysis.comparison}`;
}

/**
 * Generate "Why This Matters" explanation
 */
function generateWhyThisMatters(issue: CoachingIssue, dimension: RubricCategory): string {
  const impacts: Record<RubricCategory, string> = {
    voice_integrity: 'Admissions officers read 50+ essays per day. Authentic voice makes you memorable; manufactured phrases make you blend into the pile.',
    specificity_evidence: 'Vague claims invite skepticism. Specific evidence builds trust and credibility.',
    transformative_impact: 'Officers want students who grow and learn. Generic lessons signal surface involvement.',
    role_clarity_ownership: 'Officers need to know what YOU contributed. Vague attribution leaves them guessing about your actual impact.',
    narrative_arc_stakes: 'Easy success is forgettable. Obstacles overcome demonstrate resilience and problem-solving.',
    initiative_leadership: 'Top colleges seek students who identify opportunities and drive change, not just participate.',
    community_collaboration: 'Collaboration skills matter at elite institutions. Generic claims about "helping others" lack credibility.',
    reflection_meaning: 'Intellectual depth shows through ability to extract transferable lessons from experience.',
    craft_language_quality: 'Literary sophistication demonstrates communication skills and makes essays more engaging.',
    fit_trajectory: 'Officers want coherent narrative: your past informs your future. Disconnects raise questions.',
    time_investment_consistency: 'Consistent, sustained commitment signals genuine passion vs superficial resume-building.',
  };
  return impacts[dimension] || 'This dimension significantly impacts how admissions officers evaluate your application.';
}

// All exports are already declared with the function definitions above
