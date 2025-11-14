/**
 * Stage 5.2: Insight Generator
 *
 * Generates detailed, actionable sentence-level insights with:
 * - What we detected and why it matters
 * - Weak vs strong examples
 * - Multiple solution approaches (easy/moderate/challenging)
 * - Before/after suggestions
 * - Pre-filled chat prompts
 *
 * This is the final layer of precision - turning analysis into action.
 */

import {
  SentenceLevelInsight,
  GeneralInsight,
  SpecificInsights,
  SynthesizedInsights
} from '../types';
import { ALL_NARRATIVE_PATTERNS } from '../narrativePatterns';
import { ParsedSentence, getSurroundingContext } from './patternMatcher';

/**
 * Generate comprehensive sentence-level insight
 */
export function generateSentenceLevelInsight(
  sentence: ParsedSentence,
  issueType: string,
  issueCategory: string,
  severity: 'critical' | 'major' | 'minor',
  evidence: string,
  patternId: string | undefined,
  allSentences: ParsedSentence[]
): SentenceLevelInsight {
  // Find pattern if available
  const pattern = patternId ? ALL_NARRATIVE_PATTERNS.find(p => p.patternId === patternId) : null;

  // Generate insight ID
  const insightId = `${issueCategory}_${sentence.index}_${Date.now()}`;

  // Get surrounding context
  const context = getSurroundingContext(allSentences, sentence.index);

  // Build what we detected
  const whatWeDetected = pattern
    ? pattern.technicalExplanation
    : generateWhatDetected(issueType, evidence);

  // Build why it matters
  const whyItMatters = pattern
    ? pattern.whyItMatters
    : generateWhyItMatters(issueType, issueCategory);

  // Build impact on score
  const impactOnScore = generateImpact(severity, issueCategory);

  // Get examples (weak and strong)
  const { weakExample, strongExample, whatToNotice } = getExamples(issueType, pattern, sentence.text);

  // Generate solutions
  const solutions = generateSolutions(issueType, sentence.text, pattern);

  // Generate before/after
  const { beforeText, suggestedAfter, rationale } = generateBeforeAfter(issueType, sentence.text, pattern);

  // Generate chat prompt
  const preFillledChatPrompt = generateChatPrompt(issueType, sentence.text, issueCategory);

  // Generate follow-ups
  const suggestedFollowUps = generateFollowUps(issueType);

  return {
    insightId,
    sentenceIndex: sentence.index,
    sentenceText: sentence.text,
    paragraphIndex: sentence.paragraphIndex,
    essaySection: sentence.section,
    issueType,
    issueCategory,
    severity,
    whatWeDetected,
    whyItMatters,
    impactOnScore,
    surroundingContext: context,
    weakExample,
    strongExample,
    whatToNotice,
    solutions,
    beforeText,
    suggestedAfter,
    rationale,
    preFillledChatPrompt,
    suggestedFollowUps
  };
}

// ============================================================================
// GENERATION HELPERS
// ============================================================================

function generateWhatDetected(issueType: string, evidence: string): string {
  const templates: Record<string, string> = {
    vague_language: `Vague, non-specific language: "${evidence}". Lacks concrete details that create credibility and immersion.`,
    weak_verb: `Weak verb usage: "${evidence}". Generic verbs reduce impact and make writing feel passive or uninspired.`,
    cliche: `Clichéd expression: "${evidence}". Overused phrase that signals generic, template-like writing to admissions officers.`,
    generic_reflection: `Generic reflection: "${evidence}". Surface-level insight that doesn't show intellectual depth or meaning-making.`,
    telling_not_showing: `Telling rather than showing. States traits/feelings abstractly instead of demonstrating through action and detail.`,
    passive_voice: `Passive voice construction. Makes protagonist feel acted upon rather than active driver of narrative.`,
    grammar_issue: `Grammar or mechanics issue: ${evidence}`
  };

  return templates[issueType] || `Detected issue: ${evidence}`;
}

function generateWhyItMatters(issueType: string, category: string): string {
  const categoryReasons: Record<string, string> = {
    show_dont_tell_concrete: `Admissions officers read thousands of essays. Specific details create credibility ("20,000 students" vs "many students") and immersion (sensory scenes beat abstract summaries). Elite essays show ≥80%, tell ≤20%.`,
    reflection_meaning_making: `Reflection separates good essays from exceptional ones. Surface reflections ("taught me teamwork") are in 80% of applications. Profound insights (micro→macro, philosophical reframing) appear in top 3% and demonstrate intellectual maturity.`,
    originality_specificity_voice: `Generic language makes essays forgettable. AOs seek distinctive voices they'll remember in 2 hours. Clichés and vague language signal template-like writing, killing competitive advantage.`,
    sentence_craft_style: `Sentence craft affects readability and impression. Weak verbs, passive voice, and monotonous rhythm make essays feel flat. Elite essays use varied sentence structure and strong verbs to create energy.`,
    character_interiority_vulnerability: `Vulnerability and interiority show self-awareness and authenticity. 85% of elite essays have 2+ specific vulnerability moments. Perfection facades hurt credibility and relatability.`,
    opening_power_scene_entry: `Opening hooks in first 10 words determine if AO truly engages or just skims. 0% of elite essays use generic openings. Specific scene or provocative claim beats abstract introduction every time.`,
    narrative_arc_structure: `Strong narrative arc (before → turning point → after transformation) appears in 95% of elite essays. Clear structure makes essay coherent and impactful.`
  };

  return categoryReasons[category] || `This issue affects essay quality in the ${category} dimension.`;
}

function generateImpact(severity: 'critical' | 'major' | 'minor', category: string): string {
  const severityImpact: Record<string, string> = {
    critical: `-2 to -3 points from ${category} dimension. Major competitive disadvantage if not fixed.`,
    major: `-1 to -2 points from ${category} dimension. Noticeable weakness that should be addressed.`,
    minor: `-0.5 to -1 point from ${category} dimension. Small polish opportunity.`
  };

  return severityImpact[severity];
}

function getExamples(
  issueType: string,
  pattern: any,
  currentText: string
): { weakExample: string | null; strongExample: string | null; whatToNotice: string } {
  if (pattern) {
    return {
      weakExample: pattern.weakExample,
      strongExample: pattern.strongExample,
      whatToNotice: `Notice: ${pattern.weakExample.split('→')[0]} is vague/generic. ${pattern.strongExample.split('→')[0]} is specific/vivid.`
    };
  }

  // Default examples by issue type
  const examples: Record<string, any> = {
    vague_language: {
      weak: '"I worked very hard on the project" - vague, no specifics',
      strong: '"I spent 47 nights until 3 AM, surrounded by fluorescent hum, debugging 2,000 lines of code" - specific, sensory, quantified',
      notice: 'Strong version uses numbers (47 nights, 3 AM, 2,000 lines), sensory detail (fluorescent hum), and specific action (debugging) vs abstract claim (worked hard)'
    },
    weak_verb: {
      weak: '"I was involved in organizing the event" - passive, weak verb',
      strong: '"I recruited 15 volunteers, secured $5,000 in funding, and designed the event logistics" - active, strong verbs, specific',
      notice: 'Strong version uses powerful verbs (recruited, secured, designed) and quantifies (15, $5,000) vs weak passive construction (was involved)'
    },
    cliche: {
      weak: '"This experience taught me the importance of teamwork" - clichéd, generic',
      strong: '"When three teammates quit, I learned to ask for help instead of drowning alone. Listening became as important as leading" - specific situation, nuanced insight',
      notice: 'Strong version grounds insight in specific moment and offers nuanced perspective vs generic cliché'
    },
    generic_reflection: {
      weak: '"I grew as a person and learned a lot" - surface-level, vague',
      strong: "\"I discovered that following dreams requires more than wishing upon a star—it demands sacrifice, persistence, and grueling work at 3 AM when no one's watching\" - philosophical depth, specific, portable",
      notice: 'Strong version offers portable insight that applies beyond this activity and includes specific details vs generic growth claim'
    }
  };

  const example = examples[issueType] || { weak: currentText, strong: currentText, notice: 'Replace with specific details' };
  return {
    weakExample: example.weak,
    strongExample: example.strong,
    whatToNotice: example.notice
  };
}

function generateSolutions(issueType: string, currentText: string, pattern: any): Array<{
  approach: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  timeEstimate: string;
  impactEstimate: string;
  steps?: string[];
  transferablePrinciple: string;
}> {
  const solutions: Array<any> = [];

  // Quick fix (if pattern provides one)
  if (pattern?.quickFix) {
    solutions.push({
      approach: pattern.quickFix,
      difficulty: 'easy' as const,
      timeEstimate: '5-10 min',
      impactEstimate: '+1-2 points',
      transferablePrinciple: 'Surface fixes - cut weak language, add specific detail'
    });
  } else if (issueType === 'vague_language') {
    solutions.push({
      approach: 'Add specific numbers, names, or sensory details to this sentence',
      difficulty: 'easy' as const,
      timeEstimate: '5 min',
      impactEstimate: '+1-2 points',
      steps: [
        'Identify the vague word or phrase',
        'Replace with specific: number, proper name, or concrete noun',
        'Add one sensory detail if possible (sight, sound, smell, touch, taste)'
      ],
      transferablePrinciple: 'Specificity creates credibility. Always prefer "47 nights" over "many nights," "purple nitrite gloves" over "lab equipment"'
    });
  }

  // Deep fix (if pattern provides one)
  if (pattern?.deepFix) {
    solutions.push({
      approach: pattern.deepFix,
      difficulty: 'challenging' as const,
      timeEstimate: '20-30 min',
      impactEstimate: '+3-5 points',
      transferablePrinciple: 'Structural improvements - reframe, restructure, or rewrite for deeper impact'
    });
  } else if (issueType === 'generic_reflection') {
    solutions.push({
      approach: 'Find micro→macro structure: specific moment → universal insight',
      difficulty: 'challenging' as const,
      timeEstimate: '20-30 min',
      impactEstimate: '+3-5 points',
      steps: [
        'Identify the specific experience (micro): "rowing pain," "chemistry failure," "hot sauce journey"',
        'Extract portable lesson (macro): What truth applies beyond this activity?',
        'Connect explicitly: "Beyond rowing, this taught me..." or "Not just X, but Y..."',
        'Test: Can this insight apply to any domain? If yes, you have micro→macro'
      ],
      transferablePrinciple: 'Micro→macro (70% of elite essays): Small specific moment → Universal portable insight'
    });
  }

  // Moderate solution
  solutions.push({
    approach: issueType === 'weak_verb'
      ? 'Replace weak verb with strong action verb (created, built, secured, recruited, designed)'
      : issueType === 'cliche'
        ? 'Replace cliché with specific scene or unique insight from your experience'
        : 'Rewrite showing action/scene instead of telling trait/feeling',
    difficulty: 'moderate' as const,
    timeEstimate: '10-15 min',
    impactEstimate: '+2-3 points',
    transferablePrinciple: issueType === 'weak_verb'
      ? 'Use strong verbs that demonstrate agency and decision-making'
      : 'Show through scenes and action, don\'t tell through abstract summary'
  });

  return solutions;
}

function generateBeforeAfter(issueType: string, currentText: string, pattern: any): {
  beforeText: string;
  suggestedAfter: string;
  rationale: string;
} {
  // Use pattern examples if available
  if (pattern?.weakExample && pattern?.strongExample) {
    return {
      beforeText: pattern.weakExample,
      suggestedAfter: pattern.strongExample,
      rationale: `Replaces ${pattern.patternName.toLowerCase()} with specific, vivid detail that creates credibility and immersion`
    };
  }

  // Generate context-aware suggestions
  const suggestions: Record<string, any> = {
    vague_language: {
      after: currentText.replace(/many|several|a lot|some|various/gi, '[SPECIFIC NUMBER]'),
      rationale: 'Replace vague quantifier with specific number to build credibility'
    },
    weak_verb: {
      after: currentText.replace(/was|were|had|got|made/gi, '[STRONG VERB: created/built/secured/designed]'),
      rationale: 'Replace weak verb with strong action verb to demonstrate agency'
    },
    cliche: {
      after: '[SPECIFIC SCENE: What actually happened? Show the moment.]',
      rationale: 'Replace cliché with unique, specific scene from your experience'
    },
    generic_reflection: {
      after: '[MICRO→MACRO: "Beyond [this activity], I learned [universal truth that applies everywhere]"]',
      rationale: 'Transform generic reflection into micro→macro structure (specific moment → portable insight)'
    }
  };

  const suggestion = suggestions[issueType] || { after: currentText, rationale: 'Revise for specificity and impact' };

  return {
    beforeText: currentText,
    suggestedAfter: suggestion.after,
    rationale: suggestion.rationale
  };
}

function generateChatPrompt(issueType: string, sentenceText: string, category: string): string {
  const prompts: Record<string, string> = {
    vague_language: `Help me make this sentence more specific and concrete: "${sentenceText}"\n\nWhat specific numbers, names, or sensory details could I add to create credibility and immersion?`,
    weak_verb: `Help me strengthen the verb in this sentence: "${sentenceText}"\n\nWhat strong action verb (like created, built, secured, recruited, designed) could replace the weak verb and demonstrate my agency?`,
    cliche: `This sentence uses a cliché: "${sentenceText}"\n\nHelp me replace this with a specific scene or unique insight from my experience. What actually happened? What's the real story?`,
    generic_reflection: `This reflection feels generic: "${sentenceText}"\n\nHelp me find the micro→macro structure: What specific moment led to what universal insight that applies beyond this activity?`,
    telling_not_showing: `I'm telling rather than showing: "${sentenceText}"\n\nHow can I rewrite this as a scene with action and sensory detail instead of abstract summary?`
  };

  return prompts[issueType] || `Help me improve this sentence: "${sentenceText}"\n\nHow can I make it more specific, vivid, and impactful for the ${category} dimension?`;
}

function generateFollowUps(issueType: string): string[] {
  const followUps: Record<string, string[]> = {
    vague_language: [
      'What other sentences have vague quantifiers I should replace?',
      'How can I add more sensory details throughout the essay?',
      'Show me examples of highly specific writing from elite essays'
    ],
    weak_verb: [
      'What other weak verbs should I replace?',
      'How can I demonstrate more agency throughout the essay?',
      'Show me strong verb alternatives for my essay type'
    ],
    cliche: [
      'What other clichés should I avoid?',
      'How can I find my unique voice and perspective?',
      'Show me examples of original insights from elite essays'
    ],
    generic_reflection: [
      'How can I deepen my reflection throughout the essay?',
      'What is micro→macro structure and how do I create it?',
      'Show me examples of profound reflection from elite essays'
    ]
  };

  return followUps[issueType] || [
    'What else can I improve in this section?',
    'Show me more examples of strong writing',
    'How can I elevate my essay overall?'
  ];
}
