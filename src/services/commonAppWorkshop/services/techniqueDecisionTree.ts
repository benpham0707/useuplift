// @ts-nocheck
/**
 * Technique Decision Tree
 *
 * The brain of the nuanced guidance system. This module combines:
 * - Essay element detection (where in the essay)
 * - Essay type requirements (what the prompt needs)
 * - Current essay strengths/gaps (what's present/missing)
 * - Technique appropriateness (what would actually help)
 *
 * To produce context-aware recommendations that go beyond "add storytelling."
 *
 * The decision tree asks:
 * 1. What element of the essay is this? (opening, body, reflection, etc.)
 * 2. What does this essay type need? (why_us needs specificity, intellectual needs depth)
 * 3. What techniques are already present? (don't recommend more of what's overused)
 * 4. What gaps exist? (missing evidence, shallow reflection, etc.)
 * 5. What technique would best address the gap? (not always storytelling!)
 */

import { SupplementalType } from '../types';
import {
  EssayElement,
  ElementAnalysis,
  FullEssayStructure,
  essayElementDetector,
  ElementGap,
} from './essayElementDetector';
import {
  TechniqueCategory,
  TechniqueRecommendation,
  TECHNIQUE_BUNDLES,
  TECHNIQUE_PRIORITIES_BY_TYPE,
  TECHNIQUE_PREFERENCES_BY_ELEMENT,
  getRecommendedTechnique,
  isStorytellingOverused,
  getMissingTechniques,
} from './techniqueCategories';

// ============================================================================
// TYPES
// ============================================================================

export interface DecisionContext {
  essayType: SupplementalType;
  essay: string;
  targetPassage?: string;  // Specific section being analyzed
  wordCount: number;
  existingStrengths: TechniqueCategory[];
  detectedIssues: DetectedIssue[];
  essayStructure?: FullEssayStructure;
}

export interface DetectedIssue {
  type: string;  // Issue type from detection system
  severity: 'critical' | 'major' | 'minor';
  location: string;
  description: string;
}

export interface TechniqueDecision {
  primary: TechniqueRecommendation;
  alternatives: TechniqueRecommendation[];
  reasoning: DecisionReasoning;
  actionableGuidance: ActionableGuidance;
}

export interface DecisionReasoning {
  whyThisTechnique: string;
  whyNotStorytelling?: string;  // Only if storytelling was considered but rejected
  whyNotOthers: string[];
  keyFactors: string[];
}

export interface ActionableGuidance {
  whatToDo: string[];
  whatToAvoid: string[];
  exampleTransformations: ExampleTransformation[];
  questionToAsk: string;  // A reflection prompt for the student
}

export interface ExampleTransformation {
  before: string;
  after: string;
  technique: TechniqueCategory;
  explanation: string;
}

// ============================================================================
// DECISION RULES
// ============================================================================

/**
 * Rules for when storytelling should NOT be the primary recommendation
 */
const STORYTELLING_REJECTION_RULES: Array<{
  condition: (ctx: DecisionContext, element: EssayElement) => boolean;
  reason: string;
  preferredTechnique: TechniqueCategory;
}> = [
  {
    condition: (ctx) => isStorytellingOverused(ctx.existingStrengths, ctx.essayType),
    reason: 'The essay already has strong storytelling. Adding more would create imbalance.',
    preferredTechnique: 'evidence_impact',
  },
  {
    condition: (ctx) => ctx.essayType === 'why_us' && !ctx.existingStrengths.includes('connection_specificity'),
    reason: 'Why Us essays need specific school connections before more narrative.',
    preferredTechnique: 'connection_specificity',
  },
  {
    condition: (ctx) => ctx.essayType === 'intellectual' && ctx.existingStrengths.includes('storytelling'),
    reason: 'Intellectual curiosity essays should prioritize showing how you think over what happened.',
    preferredTechnique: 'intellectual_character',
  },
  {
    condition: (ctx, element) => element === 'evidence_section',
    reason: 'Evidence sections need data and metrics, not more narrative.',
    preferredTechnique: 'evidence_impact',
  },
  {
    condition: (ctx, element) => element === 'reflection_moment' && ctx.detectedIssues.some(i => i.type === 'shallow_reflection'),
    reason: 'Shallow reflection needs depth, not more story.',
    preferredTechnique: 'reflection_depth',
  },
  {
    condition: (ctx, element) => element === 'connection_bridge',
    reason: 'Connection sections need specificity about fit, not narrative.',
    preferredTechnique: 'connection_specificity',
  },
  {
    condition: (ctx) => ctx.essayType === 'why_major' && !ctx.existingStrengths.includes('technical_depth'),
    reason: 'Why Major essays need to demonstrate intellectual engagement with the field.',
    preferredTechnique: 'technical_depth',
  },
  {
    condition: (ctx) => ctx.detectedIssues.some(i => i.type === 'over_narrated'),
    reason: 'The essay is already over-narrated. Different approach needed.',
    preferredTechnique: 'evidence_impact',
  },
  {
    condition: (ctx) => ctx.detectedIssues.some(i => i.type === 'missing_evidence_of_impact'),
    reason: 'Claims need evidence to be credible.',
    preferredTechnique: 'evidence_impact',
  },
  {
    condition: (ctx) => ctx.wordCount < 150 && ctx.essayType === 'short_answer',
    reason: 'Short answers need efficiency - evidence and specificity over narrative.',
    preferredTechnique: 'evidence_impact',
  },
];

/**
 * Rules for when specific techniques should be boosted
 */
const TECHNIQUE_BOOST_RULES: Array<{
  condition: (ctx: DecisionContext, element: EssayElement) => boolean;
  technique: TechniqueCategory;
  boostReason: string;
}> = [
  // Intellectual character boosts
  {
    condition: (ctx) => ctx.essayType === 'intellectual',
    technique: 'intellectual_character',
    boostReason: 'Essay type explicitly asks about intellectual curiosity',
  },
  {
    condition: (ctx) => ctx.detectedIssues.some(i => i.type === 'missing_intellectual_engagement'),
    technique: 'intellectual_character',
    boostReason: 'Detected lack of intellectual engagement',
  },

  // Evidence impact boosts
  {
    condition: (ctx) => ['extracurricular', 'leadership'].includes(ctx.essayType) &&
                       !ctx.existingStrengths.includes('evidence_impact'),
    technique: 'evidence_impact',
    boostReason: 'Activity essays need quantifiable impact',
  },
  {
    condition: (ctx) => ctx.detectedIssues.some(i => i.type === 'NO_NUMBERS'),
    technique: 'evidence_impact',
    boostReason: 'Missing quantification detected',
  },

  // Technical depth boosts
  {
    condition: (ctx) => ctx.essayType === 'why_major',
    technique: 'technical_depth',
    boostReason: 'Why Major essays benefit from demonstrating field knowledge',
  },

  // Reflection depth boosts
  {
    condition: (ctx) => ctx.detectedIssues.some(i => ['shallow_reflection', 'GENERIC_LESSONS'].includes(i.type)),
    technique: 'reflection_depth',
    boostReason: 'Generic or shallow reflection detected',
  },
  {
    condition: (ctx, element) => element === 'insight_revelation',
    technique: 'reflection_depth',
    boostReason: 'Insight sections need depth, not just conclusions',
  },

  // Complexity showcase boosts
  {
    condition: (ctx) => ctx.essayType === 'values',
    technique: 'complexity_showcase',
    boostReason: 'Values essays benefit from nuance and tension',
  },
  {
    condition: (ctx) => ctx.detectedIssues.some(i => i.type === 'missing_complexity'),
    technique: 'complexity_showcase',
    boostReason: 'Essay appears oversimplified',
  },

  // Voice authenticity boosts
  {
    condition: (ctx) => ctx.detectedIssues.some(i => ['AI_PATTERNS', 'ESSAY_SPEAK_HEAVY'].includes(i.type)),
    technique: 'voice_authenticity',
    boostReason: 'Essay sounds generic or AI-generated',
  },
  {
    condition: (ctx, element) => ['opening_hook', 'closing_synthesis'].includes(element),
    technique: 'voice_authenticity',
    boostReason: 'Opening/closing should showcase personal voice',
  },

  // Connection specificity boosts
  {
    condition: (ctx) => ctx.essayType === 'why_us' && ctx.detectedIssues.some(i => i.type === 'SWAP_TEST_FAIL'),
    technique: 'connection_specificity',
    boostReason: 'Why Us fails swap test - needs school-specific details',
  },
];

// ============================================================================
// EXAMPLE TRANSFORMATIONS
// ============================================================================

const EXAMPLE_TRANSFORMATIONS: Record<TechniqueCategory, ExampleTransformation[]> = {
  storytelling: [
    {
      before: 'I learned a lot from being team captain.',
      after: '"You\'re not listening!" My co-captain\'s words stopped me mid-sentence. She was right. I\'d spent ten minutes explaining my strategy without once asking for input.',
      technique: 'storytelling',
      explanation: 'Ground abstract claims in a specific, vivid moment with dialogue.',
    },
  ],

  technical_depth: [
    {
      before: 'I did research on machine learning.',
      after: 'I implemented a convolutional neural network with three hidden layers, experimenting with dropout rates to address overfitting. When accuracy plateaued at 78%, I hypothesized that our feature extraction was losing spatial information...',
      technique: 'technical_depth',
      explanation: 'Show intellectual process and domain knowledge, not just topic.',
    },
    {
      before: 'I\'m interested in economics.',
      after: 'Reading Kahneman\'s work on loss aversion, I began questioning the rational actor model I\'d learned in AP Econ. If people systematically overweight losses, what does that mean for policies designed around utility maximization?',
      technique: 'technical_depth',
      explanation: 'Demonstrate genuine intellectual engagement with the field.',
    },
  ],

  evidence_impact: [
    {
      before: 'Our club made a real difference in the community.',
      after: 'In two years, we grew from 8 members to 43, partnered with 12 local businesses, and raised $4,200 for the food bank—enough to provide 12,600 meals.',
      technique: 'evidence_impact',
      explanation: 'Replace vague claims with specific, quantifiable outcomes.',
    },
    {
      before: 'I helped many students with tutoring.',
      after: 'I tutored 15 students weekly, with 11 improving by at least one letter grade. Three went from failing to honor roll.',
      technique: 'evidence_impact',
      explanation: 'Quantify impact with meaningful metrics, not vanity numbers.',
    },
  ],

  intellectual_character: [
    {
      before: 'I discovered I love physics.',
      after: 'I keep a notebook of "physics moments"—times when a concept suddenly connected to something unexpected. Last month: realizing that the feeling of being pressed into your seat on a roller coaster and gravity are, fundamentally, indistinguishable. Einstein\'s insight, experienced.',
      technique: 'intellectual_character',
      explanation: 'Show how you engage with ideas, not just that you like them.',
    },
    {
      before: 'The project taught me a lot.',
      after: 'The project forced me to confront a question I\'m still working through: at what point does optimization become over-optimization? We improved efficiency by 40%, but the original system had a certain robustness that the optimized version lost.',
      technique: 'intellectual_character',
      explanation: 'Reveal your thinking process and ongoing questions.',
    },
  ],

  reflection_depth: [
    {
      before: 'This experience taught me the importance of teamwork.',
      after: 'What surprised me wasn\'t that teamwork mattered—I knew that. It was discovering that my instinct to take control when things got hard was actually the opposite of leadership. Real leadership meant trusting others with pieces I cared about.',
      technique: 'reflection_depth',
      explanation: 'Go beyond generic lessons to unexpected, personal insights.',
    },
    {
      before: 'I learned to never give up.',
      after: 'I used to think persistence meant refusing to quit. Now I understand it differently: persistence is knowing when to quit one approach so you can try another. I "gave up" on my original design three times before finding one that worked.',
      technique: 'reflection_depth',
      explanation: 'Complicate the obvious lesson with nuance and specificity.',
    },
  ],

  voice_authenticity: [
    {
      before: 'I have always been passionate about helping others.',
      after: 'Honestly? I didn\'t start volunteering because I wanted to help people. I started because my mom made me. The wanting-to-help part came later, around hour 30, when I realized I looked forward to Saturdays.',
      technique: 'voice_authenticity',
      explanation: 'Replace performed enthusiasm with honest, specific voice.',
    },
    {
      before: 'This experience was very meaningful to me.',
      after: 'Here\'s the weird part: I miss the frustration. I miss staring at code that refuses to compile at 2 AM. I miss the specific kind of tired that comes from actually caring whether something works.',
      technique: 'voice_authenticity',
      explanation: 'Say something only you would say, in the way you\'d say it.',
    },
  ],

  complexity_showcase: [
    {
      before: 'Volunteering taught me to appreciate what I have.',
      after: 'I went in expecting to feel grateful for my privileges. Instead, I felt something more complicated: guilt for my relief that I could go home, respect for resilience I\'d never needed to develop, and an uncomfortable awareness that "helping" can be its own kind of taking.',
      technique: 'complexity_showcase',
      explanation: 'Resist easy conclusions. Show the tensions you\'re still processing.',
    },
    {
      before: 'Leadership requires putting the team first.',
      after: 'The hardest leadership decision I made wasn\'t about the team—it was about me. I had to admit that my vision for the project, the one I\'d been pushing for months, was wrong. Putting the team first meant letting go of being right.',
      technique: 'complexity_showcase',
      explanation: 'Find the paradox or tension within conventional wisdom.',
    },
  ],

  connection_specificity: [
    {
      before: 'I want to attend your university because of its strong engineering program.',
      after: 'Professor Martinez\'s work on sustainable concrete alternatives directly connects to my independent research on construction waste. I want to bring my data on local demolition patterns to her lab and explore whether regional material availability affects optimal mix designs.',
      technique: 'connection_specificity',
      explanation: 'Name specific people, programs, and how they connect to your work.',
    },
    {
      before: 'I love the collaborative environment at your school.',
      after: 'The d.school\'s requirement to take at least one course outside your major solved a problem I\'ve been wrestling with: how to combine my interest in urban planning with my background in data science. The ME 310 Global Innovation course would let me do exactly that.',
      technique: 'connection_specificity',
      explanation: 'Cite specific programs/courses and explain why they matter to you.',
    },
  ],
};

// ============================================================================
// DECISION TREE IMPLEMENTATION
// ============================================================================

export class TechniqueDecisionTree {
  /**
   * Main decision function - determines the best technique for a given context
   */
  decide(context: DecisionContext): TechniqueDecision {
    // Step 1: Analyze essay structure if not provided
    const structure = context.essayStructure ||
      essayElementDetector.analyzeFullStructure(context.essay, context.essayType);

    // Step 2: Determine which element we're focusing on
    const targetElement = this.determineTargetElement(context, structure);

    // Step 3: Check storytelling rejection rules
    const storytellingRejection = this.checkStorytellingRejection(context, targetElement);

    // Step 4: Apply boost rules to get technique scores
    const techniqueScores = this.scoreTechniques(context, targetElement);

    // Step 5: Get primary recommendation
    const primary = this.selectPrimaryTechnique(
      techniqueScores,
      storytellingRejection,
      context,
      targetElement
    );

    // Step 6: Get alternative recommendations
    const alternatives = this.selectAlternatives(techniqueScores, primary.category);

    // Step 7: Generate reasoning
    const reasoning = this.generateReasoning(
      primary,
      storytellingRejection,
      context,
      targetElement
    );

    // Step 8: Generate actionable guidance
    const actionableGuidance = this.generateActionableGuidance(
      primary.category,
      context,
      targetElement
    );

    return {
      primary,
      alternatives,
      reasoning,
      actionableGuidance,
    };
  }

  /**
   * Determine which essay element to focus on
   */
  private determineTargetElement(
    context: DecisionContext,
    structure: FullEssayStructure
  ): EssayElement {
    if (context.targetPassage) {
      // Analyze the specific passage
      const analysis = essayElementDetector.detectElement(
        context.targetPassage,
        context.essayType,
        {
          fullEssay: context.essay,
          passagePosition: this.estimatePosition(context.targetPassage, context.essay),
        }
      );
      return analysis.element;
    }

    // Find the element with the most critical gaps
    const elementsWithGaps = structure.elements
      .filter(e => e.gaps.some(g => g.severity === 'critical' || g.severity === 'major'))
      .sort((a, b) => {
        const aScore = a.gaps.reduce((sum, g) => sum + (g.severity === 'critical' ? 2 : 1), 0);
        const bScore = b.gaps.reduce((sum, g) => sum + (g.severity === 'critical' ? 2 : 1), 0);
        return bScore - aScore;
      });

    if (elementsWithGaps.length > 0) {
      return elementsWithGaps[0].element;
    }

    // Default to action_body
    return 'action_body';
  }

  /**
   * Estimate position of passage in essay
   */
  private estimatePosition(
    passage: string,
    fullEssay: string
  ): 'start' | 'early' | 'middle' | 'late' | 'end' {
    const index = fullEssay.indexOf(passage);
    if (index === -1) return 'middle';

    const position = index / fullEssay.length;
    if (position < 0.1) return 'start';
    if (position < 0.25) return 'early';
    if (position < 0.65) return 'middle';
    if (position < 0.9) return 'late';
    return 'end';
  }

  /**
   * Check if storytelling should be rejected
   */
  private checkStorytellingRejection(
    context: DecisionContext,
    element: EssayElement
  ): { rejected: boolean; reason?: string; preferredTechnique?: TechniqueCategory } {
    for (const rule of STORYTELLING_REJECTION_RULES) {
      if (rule.condition(context, element)) {
        return {
          rejected: true,
          reason: rule.reason,
          preferredTechnique: rule.preferredTechnique,
        };
      }
    }
    return { rejected: false };
  }

  /**
   * Score all techniques based on context
   */
  private scoreTechniques(
    context: DecisionContext,
    element: EssayElement
  ): Map<TechniqueCategory, number> {
    const scores = new Map<TechniqueCategory, number>();

    const allTechniques: TechniqueCategory[] = [
      'storytelling', 'technical_depth', 'evidence_impact', 'intellectual_character',
      'reflection_depth', 'voice_authenticity', 'complexity_showcase', 'connection_specificity'
    ];

    // Initialize with base scores from type priorities
    const typePriorities = TECHNIQUE_PRIORITIES_BY_TYPE[context.essayType];
    for (const technique of allTechniques) {
      let score = 0;
      if (typePriorities.primary.includes(technique)) score = 10;
      else if (typePriorities.secondary.includes(technique)) score = 6;
      else if (typePriorities.optional.includes(technique)) score = 2;
      else if (typePriorities.avoid.includes(technique)) score = -5;
      scores.set(technique, score);
    }

    // NOTE: Rigid issue-to-technique mappings have been REMOVED.
    // For production use, call decideAsync() which uses the DynamicTechniqueSelector
    // with Haiku API calls for nuanced, context-aware technique selection.
    //
    // The synchronous decide() method now uses SOFT heuristics based on
    // issue description content analysis, not rigid type mappings.
    // This allows for dynamic routing even without API calls.

    // Apply SOFT heuristics based on issue CONTENT (not rigid type mapping)
    for (const issue of context.detectedIssues) {
      const description = (issue.description || '').toLowerCase();
      const issueType = (issue.type || '').toLowerCase();

      // Analyze the issue content to suggest technique (soft boost only)
      let suggestedTechnique: TechniqueCategory | null = null;
      const boostAmount = 8; // Soft boost, not overwhelming

      // Evidence/metrics patterns
      if (description.includes('number') || description.includes('quantif') ||
          description.includes('metric') || description.includes('no evidence') ||
          description.includes('impact') || issueType.includes('evidence')) {
        suggestedTechnique = 'evidence_impact';
      }
      // Voice/authenticity patterns
      else if (description.includes('generic voice') || description.includes('ai-like') ||
               description.includes('essay mode') || description.includes('cliche') ||
               description.includes('sounds like') || issueType.includes('voice') ||
               issueType.includes('ai_pattern')) {
        suggestedTechnique = 'voice_authenticity';
      }
      // Complexity/nuance patterns
      else if (description.includes('oversimplif') || description.includes('black and white') ||
               description.includes('too simple') || description.includes('nuance') ||
               issueType.includes('complexity')) {
        suggestedTechnique = 'complexity_showcase';
      }
      // Connection/specificity patterns
      else if (description.includes('generic school') || description.includes('could apply anywhere') ||
               description.includes('swap test') || description.includes('not specific') ||
               issueType.includes('connection') || issueType.includes('specificity')) {
        suggestedTechnique = 'connection_specificity';
      }
      // Reflection depth patterns
      else if (description.includes('shallow') || description.includes('generic lesson') ||
               description.includes('surface') || description.includes('unearned') ||
               issueType.includes('reflection')) {
        suggestedTechnique = 'reflection_depth';
      }
      // Intellectual character patterns
      else if (description.includes('thought process') || description.includes('how you think') ||
               description.includes('intellectual') || issueType.includes('intellectual') ||
               issueType.includes('character_through_thought')) {
        suggestedTechnique = 'intellectual_character';
      }
      // Technical depth patterns
      else if (description.includes('technical') || description.includes('field knowledge') ||
               description.includes('expertise') || issueType.includes('technical')) {
        suggestedTechnique = 'technical_depth';
      }
      // Storytelling patterns - ONLY for pure telling with NO scene
      else if (description.includes('no scene') || description.includes('no moment') ||
               description.includes('pure claim') || description.includes('all telling') ||
               (issueType.includes('telling') && !description.includes('already has'))) {
        suggestedTechnique = 'storytelling';
      }

      // Apply soft boost if we found a suggestion
      if (suggestedTechnique) {
        const currentScore = scores.get(suggestedTechnique) || 0;
        scores.set(suggestedTechnique, currentScore + boostAmount);

        // Soft penalty to storytelling if another technique is more appropriate
        if (suggestedTechnique !== 'storytelling') {
          const storyScore = scores.get('storytelling') || 0;
          scores.set('storytelling', storyScore - 4);
        }
      }
    }

    // Adjust for element preferences
    const elementPrefs = TECHNIQUE_PREFERENCES_BY_ELEMENT[element];
    for (const technique of elementPrefs.preferred) {
      scores.set(technique, (scores.get(technique) || 0) + 5);
    }
    for (const technique of elementPrefs.discouraged) {
      scores.set(technique, (scores.get(technique) || 0) - 3);
    }

    // Apply boost rules (lower priority than direct mappings)
    for (const rule of TECHNIQUE_BOOST_RULES) {
      if (rule.condition(context, element)) {
        scores.set(rule.technique, (scores.get(rule.technique) || 0) + 4);
      }
    }

    // Penalize overused techniques
    const usageCounts = new Map<TechniqueCategory, number>();
    for (const t of context.existingStrengths) {
      usageCounts.set(t, (usageCounts.get(t) || 0) + 1);
    }
    for (const [technique, count] of usageCounts) {
      if (count >= 2) {
        scores.set(technique, (scores.get(technique) || 0) - 4);
      }
    }

    // Boost missing techniques
    const missing = getMissingTechniques(context.existingStrengths, context.essayType);
    for (const technique of missing) {
      scores.set(technique, (scores.get(technique) || 0) + 3);
    }

    return scores;
  }

  /**
   * Select the primary technique recommendation
   */
  private selectPrimaryTechnique(
    scores: Map<TechniqueCategory, number>,
    storytellingRejection: { rejected: boolean; reason?: string; preferredTechnique?: TechniqueCategory },
    context: DecisionContext,
    element: EssayElement
  ): TechniqueRecommendation {
    // If storytelling was rejected, boost the preferred alternative
    if (storytellingRejection.rejected && storytellingRejection.preferredTechnique) {
      scores.set(storytellingRejection.preferredTechnique,
        (scores.get(storytellingRejection.preferredTechnique) || 0) + 8);
      scores.set('storytelling', (scores.get('storytelling') || 0) - 10);
    }

    // Find highest scoring technique - ACTUALLY USE THE CALCULATED SCORES
    let bestTechnique: TechniqueCategory = 'storytelling';
    let bestScore = -Infinity;
    for (const [technique, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        bestTechnique = technique;
      }
    }

    // Build the recommendation using the actual best technique from scores
    const bundle = TECHNIQUE_BUNDLES[bestTechnique];
    return {
      category: bestTechnique,
      priority: 'primary' as const,
      rationale: bundle.description,
      exampleApproaches: bundle.examplePhrases.slice(0, 3),
      antiPatterns: bundle.antiPatterns.slice(0, 3),
      signals: bundle.corePrinciples.slice(0, 3),
    };
  }

  /**
   * Select alternative techniques
   */
  private selectAlternatives(
    scores: Map<TechniqueCategory, number>,
    primaryTechnique: TechniqueCategory
  ): TechniqueRecommendation[] {
    const sorted = Array.from(scores.entries())
      .filter(([technique]) => technique !== primaryTechnique)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    return sorted.map(([technique]) => ({
      category: technique,
      priority: 'secondary' as const,
      rationale: TECHNIQUE_BUNDLES[technique].description,
      exampleApproaches: TECHNIQUE_BUNDLES[technique].examplePhrases.slice(0, 2),
      antiPatterns: TECHNIQUE_BUNDLES[technique].antiPatterns.slice(0, 2),
      signals: TECHNIQUE_BUNDLES[technique].corePrinciples.slice(0, 2),
    }));
  }

  /**
   * Generate human-readable reasoning for the decision
   */
  private generateReasoning(
    primary: TechniqueRecommendation,
    storytellingRejection: { rejected: boolean; reason?: string },
    context: DecisionContext,
    element: EssayElement
  ): DecisionReasoning {
    const keyFactors: string[] = [];

    // Essay type factor
    keyFactors.push(`Essay type: ${context.essayType.replace(/_/g, ' ')}`);

    // Element factor
    keyFactors.push(`Target element: ${element.replace(/_/g, ' ')}`);

    // Existing strengths factor
    if (context.existingStrengths.length > 0) {
      const counts = new Map<TechniqueCategory, number>();
      context.existingStrengths.forEach(t => counts.set(t, (counts.get(t) || 0) + 1));
      const summary = Array.from(counts.entries())
        .map(([t, c]) => `${t.replace(/_/g, ' ')} (${c}x)`)
        .join(', ');
      keyFactors.push(`Existing techniques: ${summary}`);
    }

    // Issues factor
    if (context.detectedIssues.length > 0) {
      keyFactors.push(`Detected issues: ${context.detectedIssues.map(i => i.type).join(', ')}`);
    }

    const reasoning: DecisionReasoning = {
      whyThisTechnique: primary.rationale,
      whyNotOthers: [],
      keyFactors,
    };

    // Add storytelling rejection reason if applicable
    if (storytellingRejection.rejected) {
      reasoning.whyNotStorytelling = storytellingRejection.reason;
    }

    // Add reasons for not selecting other techniques
    const allTechniques: TechniqueCategory[] = [
      'storytelling', 'technical_depth', 'evidence_impact', 'intellectual_character',
      'reflection_depth', 'voice_authenticity', 'complexity_showcase', 'connection_specificity'
    ];

    const typePriorities = TECHNIQUE_PRIORITIES_BY_TYPE[context.essayType];
    for (const technique of allTechniques) {
      if (technique === primary.category) continue;

      if (typePriorities.avoid.includes(technique)) {
        reasoning.whyNotOthers.push(
          `${technique.replace(/_/g, ' ')}: not recommended for ${context.essayType.replace(/_/g, ' ')} essays`
        );
      } else if (context.existingStrengths.filter(t => t === technique).length >= 2) {
        reasoning.whyNotOthers.push(
          `${technique.replace(/_/g, ' ')}: already well-represented in the essay`
        );
      }
    }

    return reasoning;
  }

  /**
   * Generate actionable guidance for the student
   */
  private generateActionableGuidance(
    technique: TechniqueCategory,
    context: DecisionContext,
    element: EssayElement
  ): ActionableGuidance {
    const bundle = TECHNIQUE_BUNDLES[technique];

    return {
      whatToDo: bundle.corePrinciples.slice(0, 4),
      whatToAvoid: bundle.antiPatterns.slice(0, 4),
      exampleTransformations: EXAMPLE_TRANSFORMATIONS[technique] || [],
      questionToAsk: this.generateReflectionQuestion(technique, context.essayType, element),
    };
  }

  /**
   * Generate a Socratic question to prompt student reflection
   */
  private generateReflectionQuestion(
    technique: TechniqueCategory,
    essayType: SupplementalType,
    element: EssayElement
  ): string {
    const questions: Record<TechniqueCategory, string[]> = {
      storytelling: [
        'What specific moment best shows (rather than tells) what you\'re trying to communicate?',
        'If you could only keep one scene, which would it be and why?',
      ],
      technical_depth: [
        'What do you understand about this field that you didn\'t before you started?',
        'What question in this field keeps you thinking even when you\'re not working on it?',
      ],
      evidence_impact: [
        'What changed because of your work, and how would you measure it?',
        'If you had to prove your impact to a skeptic, what evidence would you show?',
      ],
      intellectual_character: [
        'What\'s a question in this area that you\'re still genuinely uncertain about?',
        'How has your thinking about this topic evolved, and what changed it?',
      ],
      reflection_depth: [
        'What surprised you most about what you learned from this experience?',
        'What would you tell your past self about this that they wouldn\'t believe?',
      ],
      voice_authenticity: [
        'If you read this aloud to a friend, would they recognize it as yours?',
        'What\'s something true about this experience that you almost didn\'t include?',
      ],
      complexity_showcase: [
        'What tension or contradiction in this experience are you still processing?',
        'What\'s the uncomfortable truth that a simpler version of this essay would leave out?',
      ],
      connection_specificity: [
        'What specific resource at this school would you use in your first semester?',
        'Why this school for this goal, and not somewhere else with similar offerings?',
      ],
    };

    const techniqueQuestions = questions[technique];
    return techniqueQuestions[Math.floor(Math.random() * techniqueQuestions.length)];
  }

  /**
   * Quick decision for a specific issue using CONTENT ANALYSIS
   * NOTE: This is a SOFT heuristic. For production, use decideForIssueAsync()
   */
  decideForIssue(
    issueType: string,
    essayType: SupplementalType,
    existingStrengths: TechniqueCategory[],
    issueDescription?: string
  ): TechniqueCategory {
    // Use content-based analysis instead of rigid mapping
    const description = (issueDescription || issueType).toLowerCase();
    let suggested: TechniqueCategory | null = null;

    // Evidence patterns
    if (description.includes('number') || description.includes('quantif') ||
        description.includes('metric') || description.includes('impact') ||
        description.includes('evidence') || description.includes('resume')) {
      suggested = 'evidence_impact';
    }
    // Reflection patterns
    else if (description.includes('shallow') || description.includes('generic lesson') ||
             description.includes('surface') || description.includes('reflection') ||
             description.includes('describing')) {
      suggested = 'reflection_depth';
    }
    // Connection patterns
    else if (description.includes('swap') || description.includes('generic school') ||
             description.includes('connection') || description.includes('specificity') ||
             description.includes('one-sided')) {
      suggested = 'connection_specificity';
    }
    // Intellectual patterns
    else if (description.includes('intellectual') || description.includes('engagement') ||
             description.includes('career only') || description.includes('thought')) {
      suggested = 'intellectual_character';
    }
    // Voice patterns
    else if (description.includes('ai') || description.includes('voice') ||
             description.includes('cliche') || description.includes('essay mode')) {
      suggested = 'voice_authenticity';
    }
    // Complexity patterns
    else if (description.includes('complexity') || description.includes('simple') ||
             description.includes('resolution') || description.includes('nuance')) {
      suggested = 'complexity_showcase';
    }
    // Technical patterns
    else if (description.includes('technical') || description.includes('depth') ||
             description.includes('expertise')) {
      suggested = 'technical_depth';
    }
    // Storytelling - ONLY for pure telling with no concrete moments
    else if (description.includes('telling') || description.includes('stated') ||
             description.includes('no scene') || description.includes('pure claim')) {
      suggested = 'storytelling';
    }

    // Default based on essay type if no pattern matched
    if (!suggested) {
      const typePriorities = TECHNIQUE_PRIORITIES_BY_TYPE[essayType];
      suggested = typePriorities.primary[0] || 'reflection_depth';
    }

    // If suggested technique is already overused, pick alternative
    if (existingStrengths.filter(t => t === suggested).length >= 2) {
      const missing = getMissingTechniques(existingStrengths, essayType);
      return missing[0] || suggested;
    }

    return suggested;
  }

  /**
   * ASYNC decision using Haiku API for nuanced, context-aware technique selection
   * This is the PRODUCTION method for dynamic routing.
   */
  async decideAsync(context: DecisionContext): Promise<TechniqueDecision> {
    // Import dynamically to avoid circular dependencies
    const { dynamicTechniqueSelector } = await import('./dynamicTechniqueSelector');

    // If no issues to analyze, fall back to sync decision
    if (!context.detectedIssues.length) {
      return this.decide(context);
    }

    // Use dynamic selector for the primary issue
    const primaryIssue = context.detectedIssues[0];

    try {
      const dynamicDecision = await dynamicTechniqueSelector.selectTechnique({
        passage: context.targetPassage || context.essay.substring(0, 500),
        surroundingContext: context.essay,
        essayType: context.essayType,
        fullEssay: context.essay,
        diagnosedIssue: {
          type: primaryIssue.type,
          description: primaryIssue.description,
        },
        existingStrengths: context.existingStrengths,
      });

      // Analyze essay structure for element detection
      const structure = context.essayStructure ||
        essayElementDetector.analyzeFullStructure(context.essay, context.essayType);
      const targetElement = this.determineTargetElement(context, structure);

      // Build the full decision with dynamic technique
      const primary: TechniqueRecommendation = {
        category: dynamicDecision.selectedTechnique,
        priority: 'primary',
        rationale: dynamicDecision.reasoning,
        exampleApproaches: TECHNIQUE_BUNDLES[dynamicDecision.selectedTechnique]?.examplePhrases?.slice(0, 3) || [],
        antiPatterns: TECHNIQUE_BUNDLES[dynamicDecision.selectedTechnique]?.antiPatterns?.slice(0, 3) || [],
        signals: TECHNIQUE_BUNDLES[dynamicDecision.selectedTechnique]?.corePrinciples?.slice(0, 3) || [],
      };

      const alternatives: TechniqueRecommendation[] = dynamicDecision.alternativeTechniques.map(tech => ({
        category: tech,
        priority: 'secondary' as const,
        rationale: TECHNIQUE_BUNDLES[tech]?.description || '',
        exampleApproaches: TECHNIQUE_BUNDLES[tech]?.examplePhrases?.slice(0, 2) || [],
        antiPatterns: TECHNIQUE_BUNDLES[tech]?.antiPatterns?.slice(0, 2) || [],
        signals: TECHNIQUE_BUNDLES[tech]?.corePrinciples?.slice(0, 2) || [],
      }));

      const reasoning: DecisionReasoning = {
        whyThisTechnique: dynamicDecision.reasoning,
        whyNotStorytelling: dynamicDecision.whyNotStorytelling,
        whyNotOthers: [],
        keyFactors: [
          `Essay type: ${context.essayType}`,
          `Issue: ${primaryIssue.type}`,
          `Confidence: ${(dynamicDecision.confidence * 100).toFixed(0)}%`,
          `API cost: $${dynamicDecision.cost.toFixed(4)}`,
        ],
      };

      const actionableGuidance = this.generateActionableGuidance(
        dynamicDecision.selectedTechnique,
        context,
        targetElement
      );

      return {
        primary,
        alternatives,
        reasoning,
        actionableGuidance,
      };
    } catch (error) {
      console.error('[TechniqueDecisionTree] Async decision failed, falling back to sync:', error);
      return this.decide(context);
    }
  }

  /**
   * ASYNC decision for a specific issue using Haiku API
   */
  async decideForIssueAsync(
    passage: string,
    issueType: string,
    issueDescription: string,
    essayType: SupplementalType,
    fullEssay: string,
    existingStrengths: TechniqueCategory[] = []
  ): Promise<TechniqueCategory> {
    const { dynamicTechniqueSelector } = await import('./dynamicTechniqueSelector');

    try {
      const decision = await dynamicTechniqueSelector.selectTechnique({
        passage,
        surroundingContext: '',
        essayType,
        fullEssay,
        diagnosedIssue: {
          type: issueType,
          description: issueDescription,
        },
        existingStrengths,
      });

      return decision.selectedTechnique;
    } catch (error) {
      console.error('[TechniqueDecisionTree] Async issue decision failed:', error);
      return this.decideForIssue(issueType, essayType, existingStrengths, issueDescription);
    }
  }
}

// Export singleton
export const techniqueDecisionTree = new TechniqueDecisionTree();
