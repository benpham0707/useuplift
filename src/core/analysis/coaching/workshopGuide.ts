/**
 * Workshop Guide: Translates analysis into actionable, digestible feedback
 *
 * Philosophy:
 * - Break down improvements into bite-sized, manageable steps
 * - Don't rewrite for them - guide them to find their own voice
 * - Use questions and prompts to elicit better content
 * - Prioritize high-impact changes (biggest NQI gains)
 */

import { AnalysisReport, RubricCategoryScore, ExperienceEntry } from '../../types/experience';
import { AuthenticityAnalysis } from '../features/authenticityDetector';
import { ExtractedFeatures } from '../../types/experience';

// ============================================================================
// TYPES
// ============================================================================

export interface WorkshopPlan {
  // Summary
  current_score: number;
  target_score: number;
  score_tier: 'excellent' | 'strong' | 'good' | 'needs_work' | 'weak';

  // Quick wins (high impact, low effort)
  quick_wins: ActionableInsight[];

  // Deep work (high impact, high effort)
  deep_work: ActionableInsight[];

  // Voice & authenticity guidance
  voice_guidance: VoiceGuidance;

  // Content elicitation (help them find what to write)
  missing_elements: MissingElement[];

  // What's working well (keep this!)
  strengths: string[];

  // Red flags to avoid
  warnings: string[];
}

export interface ActionableInsight {
  category: string;
  current_score: number;
  target_score: number;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';

  // What's wrong
  diagnosis: string;

  // What to do about it
  action_steps: string[];

  // Questions to help them discover content
  reflection_prompts: string[];

  // Specific examples from their text (if applicable)
  evidence_from_text?: string[];

  // Before/after micro-examples (not full rewrites)
  micro_examples?: MicroExample[];
}

export interface MicroExample {
  label: string;
  before: string;  // Generic/weak version
  after: string;   // Specific/strong version
  why_better: string;
}

export interface VoiceGuidance {
  authenticity_score: number;
  voice_type: 'conversational' | 'essay' | 'mixed' | 'robotic';

  diagnosis: string;

  // Specific phrases to remove/change
  phrases_to_cut: Array<{
    phrase: string;
    why_problematic: string;
  }>;

  // Stylistic guidance
  voice_tips: string[];

  // Examples of good voice for this activity type
  inspiration_examples?: string[];
}

export interface MissingElement {
  element: string;
  why_important: string;
  how_to_find_it: string;

  // Questions to help them discover it
  elicitation_prompts: string[];
}

// ============================================================================
// MAIN WORKSHOP PLAN GENERATOR
// ============================================================================

export function generateWorkshopPlan(
  entry: ExperienceEntry,
  report: AnalysisReport,
  authenticity: AuthenticityAnalysis,
  features: ExtractedFeatures
): WorkshopPlan {
  const nqi = report.narrative_quality_index;

  // Determine score tier and target
  const scoreTier = getScoreTier(nqi);
  const targetScore = getTargetScore(nqi);

  // Categorize insights by impact and effort
  const allInsights = generateActionableInsights(report, authenticity, features, entry);
  const quickWins = allInsights.filter(i => i.impact === 'high' && i.effort !== 'high');
  const deepWork = allInsights.filter(i => i.impact === 'high' && i.effort === 'high');

  // Voice guidance
  const voiceGuidance = generateVoiceGuidance(authenticity, entry);

  // Missing elements
  const missingElements = identifyMissingElements(report, features, entry);

  // Strengths to preserve
  const strengths = identifyStrengths(report, authenticity);

  // Warnings
  const warnings = generateWarnings(report, authenticity);

  return {
    current_score: nqi,
    target_score: targetScore,
    score_tier: scoreTier,
    quick_wins: quickWins,
    deep_work: deepWork,
    voice_guidance: voiceGuidance,
    missing_elements: missingElements,
    strengths,
    warnings,
  };
}

// ============================================================================
// SCORE TIER & TARGETING
// ============================================================================

function getScoreTier(nqi: number): 'excellent' | 'strong' | 'good' | 'needs_work' | 'weak' {
  if (nqi >= 80) return 'excellent';
  if (nqi >= 70) return 'strong';
  if (nqi >= 60) return 'good';
  if (nqi >= 45) return 'needs_work';
  return 'weak';
}

function getTargetScore(currentNqi: number): number {
  // Realistic targets based on current tier
  if (currentNqi >= 80) return 90;  // Excellent → polish to 90+
  if (currentNqi >= 70) return 82;  // Strong → push to excellent
  if (currentNqi >= 60) return 75;  // Good → strengthen to strong
  if (currentNqi >= 45) return 65;  // Needs work → get to good
  return 55;  // Weak → get to passable
}

// ============================================================================
// ACTIONABLE INSIGHTS GENERATION
// ============================================================================

function generateActionableInsights(
  report: AnalysisReport,
  authenticity: AuthenticityAnalysis,
  features: ExtractedFeatures,
  entry: ExperienceEntry
): ActionableInsight[] {
  const insights: ActionableInsight[] = [];

  // Analyze each category score
  for (const category of report.categories) {
    const score = category.score_0_to_10;

    // Focus on categories with room for improvement (< 7.5)
    if (score < 7.5) {
      const insight = generateCategoryInsight(category, authenticity, features, entry);
      if (insight) {
        insights.push(insight);
      }
    }
  }

  // Sort by impact (prioritize high-impact improvements)
  return insights.sort((a, b) => {
    const impactOrder = { high: 3, medium: 2, low: 1 };
    return impactOrder[b.impact] - impactOrder[a.impact];
  });
}

function generateCategoryInsight(
  category: RubricCategoryScore,
  authenticity: AuthenticityAnalysis,
  features: ExtractedFeatures,
  entry: ExperienceEntry
): ActionableInsight | null {
  const categoryName = category.name.toLowerCase();
  const score = category.score_0_to_10;

  // Voice Integrity
  if (categoryName.includes('voice')) {
    return {
      category: 'Voice & Authenticity',
      current_score: score,
      target_score: Math.min(10, score + 2),
      impact: score < 6 ? 'high' : 'medium',
      effort: score < 4 ? 'high' : 'medium',
      diagnosis: getVoiceDiagnosis(score, authenticity),
      action_steps: getVoiceActionSteps(score, authenticity),
      reflection_prompts: getVoicePrompts(entry),
      evidence_from_text: category.evidence_snippets,
      micro_examples: getVoiceMicroExamples(score),
    };
  }

  // Specificity & Evidence
  if (categoryName.includes('specificity') || categoryName.includes('evidence')) {
    return {
      category: 'Specificity & Evidence',
      current_score: score,
      target_score: Math.min(10, score + 2.5),
      impact: 'high',
      effort: 'low',
      diagnosis: getSpecificityDiagnosis(score, features),
      action_steps: getSpecificityActionSteps(score, features),
      reflection_prompts: getSpecificityPrompts(entry),
      evidence_from_text: category.evidence_snippets,
      micro_examples: getSpecificityMicroExamples(),
    };
  }

  // Reflection & Meaning
  if (categoryName.includes('reflection') || categoryName.includes('meaning')) {
    return {
      category: 'Reflection & Meaning',
      current_score: score,
      target_score: Math.min(10, score + 2),
      impact: 'high',
      effort: 'medium',
      diagnosis: getReflectionDiagnosis(score, features),
      action_steps: getReflectionActionSteps(score),
      reflection_prompts: getReflectionPrompts(entry),
      evidence_from_text: category.evidence_snippets,
      micro_examples: getReflectionMicroExamples(),
    };
  }

  // Narrative Arc & Stakes
  if (categoryName.includes('narrative') || categoryName.includes('arc')) {
    return {
      category: 'Narrative Arc & Stakes',
      current_score: score,
      target_score: Math.min(10, score + 1.5),
      impact: score < 5 ? 'high' : 'medium',
      effort: 'medium',
      diagnosis: getArcDiagnosis(score, features),
      action_steps: getArcActionSteps(score),
      reflection_prompts: getArcPrompts(entry),
      evidence_from_text: category.evidence_snippets,
      micro_examples: getArcMicroExamples(),
    };
  }

  // Initiative & Leadership
  if (categoryName.includes('initiative') || categoryName.includes('leadership')) {
    return {
      category: 'Initiative & Leadership',
      current_score: score,
      target_score: Math.min(10, score + 1.5),
      impact: 'medium',
      effort: 'medium',
      diagnosis: getInitiativeDiagnosis(score, entry.category),
      action_steps: getInitiativeActionSteps(score, entry.category),
      reflection_prompts: getInitiativePrompts(entry),
      evidence_from_text: category.evidence_snippets,
    };
  }

  // Default for other categories
  return null;
}

// ============================================================================
// VOICE GUIDANCE
// ============================================================================

function getVoiceDiagnosis(score: number, auth: AuthenticityAnalysis): string {
  if (score >= 8) return "Your voice is strong and authentic. Keep this!";
  if (score >= 6) return "Your voice is decent but could be more distinctive. Remove essay-speak and write like you're telling a friend.";
  if (score >= 4) return "Your writing sounds formal/manufactured. It feels written FOR admissions rather than FROM you.";
  return "CRITICAL: Your writing sounds robotic/templated. Start over with your authentic voice.";
}

function getVoiceActionSteps(score: number, auth: AuthenticityAnalysis): string[] {
  const steps: string[] = [];

  if (auth.red_flags.includes('excessive_manufactured_phrases')) {
    steps.push('Remove essay-speak phrases like "this taught me that..." and "I came to realize..."');
  }

  if (auth.red_flags.includes('vocabulary_showing_off')) {
    steps.push('Replace SAT words (plethora, myriad, culmination) with simpler, natural language');
  }

  if (auth.red_flags.includes('pure_essay_voice')) {
    steps.push('Rewrite in a conversational tone - imagine explaining this to a friend over coffee');
  }

  if (auth.voice_type === 'robotic' || auth.voice_type === 'essay') {
    steps.push('Read it aloud - if it doesn\'t sound like you talking, rewrite it');
    steps.push('Start sentences with "No.", "Yes.", "But" - break formal grammar rules');
  }

  if (steps.length === 0) {
    steps.push('Add more sensory details (what you saw, heard, smelled)');
    steps.push('Use shorter, punchier sentences for key moments');
  }

  return steps;
}

function getVoicePrompts(entry: ExperienceEntry): string[] {
  return [
    'If you were telling a friend about this experience, what would you say first?',
    'What\'s a specific moment you remember clearly? Describe what you saw/heard/felt.',
    'What surprised you about this experience?',
    'What\'s something you didn\'t expect when you started?',
  ];
}

function getVoiceMicroExamples(score: number): MicroExample[] {
  if (score >= 7) return [];

  return [
    {
      label: 'Opening',
      before: 'I was excited to volunteer at the community center, where I had the opportunity to work with children.',
      after: 'Tuesday mornings, 9am. Fifteen kids, one marker board, zero attention spans.',
      why_better: 'Specific, immediate, conversational. Shows don\'t tell.',
    },
    {
      label: 'Reflection',
      before: 'Through this experience, I learned valuable lessons about perseverance and dedication.',
      after: 'Turns out, teaching isn\'t about having the right answer. It\'s about knowing when to shut up and let them figure it out.',
      why_better: 'Authentic insight vs. generic platitude. Sounds like a real person.',
    },
  ];
}

// ============================================================================
// SPECIFICITY GUIDANCE
// ============================================================================

function getSpecificityDiagnosis(score: number, features: ExtractedFeatures): string {
  if (score >= 8) return "Great specificity! Concrete details make your story credible.";
  if (score >= 6) return "You have some specifics but could add more concrete details (numbers, names, prices, timeframes).";
  if (score >= 4) return "Too vague. Add specific numbers, timeframes, and measurable outcomes.";
  return "Almost no concrete details. Readers can't visualize your work - everything is abstract.";
}

function getSpecificityActionSteps(score: number, features: ExtractedFeatures): string[] {
  const steps: string[] = [];

  if (!features.evidence.has_concrete_numbers) {
    steps.push('Add specific numbers: How many? How much? How often?');
  }

  if (features.evidence.number_count < 3) {
    steps.push('Include measurable outcomes: hours invested, people impacted, money raised, etc.');
  }

  if (!features.evidence.before_after_comparison) {
    steps.push('Show change over time: "From X to Y" or "Started with A, ended with B"');
  }

  steps.push('Name specific people, places, or things (builds credibility)');
  steps.push('Replace vague words like "many", "several", "often" with exact amounts');

  return steps;
}

function getSpecificityPrompts(entry: ExperienceEntry): string[] {
  return [
    'How many hours per week did you actually spend on this?',
    'How many people were involved/impacted?',
    'What changed between when you started and when you finished?',
    'What specific skills or tools did you use?',
    'Can you name 2-3 specific people you worked with?',
  ];
}

function getSpecificityMicroExamples(): MicroExample[] {
  return [
    {
      label: 'Numbers',
      before: 'I volunteered frequently at the hospital.',
      after: 'Every Wednesday, 4pm to 7pm. 156 hours over 11 months.',
      why_better: 'Specific schedule + total commitment shows real dedication.',
    },
    {
      label: 'Outcomes',
      before: 'We raised money for the charity.',
      after: 'We raised $2,847 - enough to sponsor 12 families for Thanksgiving.',
      why_better: 'Exact amount + tangible impact shows concrete results.',
    },
    {
      label: 'Specificity',
      before: 'I worked with my mentor to improve my skills.',
      after: 'Dr. Kim taught me to debug Python stack traces without panicking.',
      why_better: 'Named person + specific skill beats generic mentorship.',
    },
  ];
}

// ============================================================================
// REFLECTION GUIDANCE
// ============================================================================

function getReflectionDiagnosis(score: number, features: ExtractedFeatures): string {
  if (score >= 8) return "Strong reflection - you show genuine insight and growth.";
  if (score >= 6) return "Decent reflection but somewhat surface-level. Dig deeper into what changed for you.";
  if (score >= 4) return "Reflection feels formulaic (\"I learned teamwork\"). What REALLY changed about how you see yourself or the world?";
  return "No meaningful reflection. You're describing what you DID, not what you LEARNED or how you CHANGED.";
}

function getReflectionActionSteps(score: number): string[] {
  return [
    'Replace "I learned X" with a specific story that SHOWS the learning',
    'Identify one belief or assumption you had at the start that changed',
    'Explain how this experience changed how you approach other situations',
    'Avoid generic lessons like "teamwork" or "leadership" - what\'s YOUR unique takeaway?',
    'Show how you\'re different now vs. when you started',
  ];
}

function getReflectionPrompts(entry: ExperienceEntry): string[] {
  return [
    'What did you believe about [this activity/yourself] before starting? What do you believe now?',
    'What\'s one thing you do differently now because of this experience?',
    'When did you realize something important? What triggered that realization?',
    'What mistake taught you the most? What did it teach you?',
    'How has this changed how you see yourself?',
  ];
}

function getReflectionMicroExamples(): MicroExample[] {
  return [
    {
      label: 'Generic vs. Specific',
      before: 'This experience taught me the importance of teamwork and communication.',
      after: 'I used to think leadership meant having all the answers. Watching Marcus rally the team after I froze during the crisis taught me it means knowing when to step back.',
      why_better: 'Specific moment + belief shift + personal insight vs. generic platitude.',
    },
    {
      label: 'Show don\'t tell',
      before: 'I learned to appreciate different perspectives.',
      after: 'When Mrs. Patel insisted on handwriting every label instead of using my printed spreadsheet, I was annoyed. Three weeks later, I realized customers recognized her handwriting and asked for her by name. Efficiency isn\'t everything.',
      why_better: 'Story that demonstrates the learning vs. telling us the learning.',
    },
  ];
}

// ============================================================================
// NARRATIVE ARC GUIDANCE
// ============================================================================

function getArcDiagnosis(score: number, features: ExtractedFeatures): string {
  if (score >= 7) return "Good narrative flow with clear progression.";
  if (score >= 5) return "Story feels flat - add stakes, tension, or obstacles you overcame.";
  return "No clear narrative. Reads like a resume bullet point, not a story.";
}

function getArcActionSteps(score: number): string[] {
  return [
    'Identify one challenge, obstacle, or unexpected problem you faced',
    'Show the tension: What was at stake? What could have gone wrong?',
    'Include a turning point: When did things change?',
    'Structure: Setup → Challenge → Response → Outcome → Reflection',
    'Don\'t make it overly dramatic - authentic stakes are enough',
  ];
}

function getArcPrompts(entry: ExperienceEntry): string[] {
  return [
    'What was harder than you expected?',
    'When did you doubt yourself or think you might fail?',
    'What problem did you have to solve?',
    'What would have happened if you hadn\'t [taken action/persisted/changed approach]?',
    'What was the turning point when things started working?',
  ];
}

function getArcMicroExamples(): MicroExample[] {
  return [
    {
      label: 'Adding stakes',
      before: 'I organized a fundraiser that raised $500.',
      after: 'Three days before the fundraiser, our venue cancelled. We had 45 RSVPs and nowhere to host. I called seven backup locations before the church agreed to let us use their basement for free.',
      why_better: 'Obstacle + stakes + problem-solving creates narrative tension.',
    },
  ];
}

// ============================================================================
// INITIATIVE/LEADERSHIP GUIDANCE
// ============================================================================

function getInitiativeDiagnosis(score: number, category: string): string {
  // Leadership roles should score higher
  const expectedScore = category === 'leadership' ? 7 : 5;

  if (score >= 8) return "Clear ownership and initiative shown.";
  if (score >= expectedScore) return "Some initiative shown, but could highlight your specific role more clearly.";
  return "Sounds passive - what did YOU specifically do? What was YOUR idea?";
}

function getInitiativeActionSteps(score: number, category: string): string[] {
  return [
    'Use "I" not "we" when describing YOUR specific contributions',
    'Identify one thing you initiated (not just participated in)',
    'Show a decision you made or problem you solved independently',
    'Replace passive voice with active voice ("I organized" not "it was organized")',
    'Clarify: What would NOT have happened without you?',
  ];
}

function getInitiativePrompts(entry: ExperienceEntry): string[] {
  return [
    'What did you do that no one asked you to do?',
    'What problem did you notice and decide to solve?',
    'What was YOUR specific role vs. others on the team?',
    'What decision did you make? What were the alternatives?',
    'What would have happened if you hadn\'t been involved?',
  ];
}

// ============================================================================
// VOICE GUIDANCE GENERATION
// ============================================================================

function generateVoiceGuidance(auth: AuthenticityAnalysis, entry: ExperienceEntry): VoiceGuidance {
  const phrasesToCut: Array<{ phrase: string; why_problematic: string }> = [];

  // Identify problematic phrases from manufactured signals
  for (const signal of auth.manufactured_signals) {
    if (signal.startsWith('Pattern:')) continue; // Skip regex patterns
    phrasesToCut.push({
      phrase: signal,
      why_problematic: getPhraseExplanation(signal),
    });
  }

  // Voice tips based on authenticity analysis
  const voiceTips: string[] = [];

  if (auth.voice_type === 'essay') {
    voiceTips.push('Write like you\'re texting a friend, not writing a college essay');
    voiceTips.push('Read it aloud - if it doesn\'t sound like you speaking, rewrite it');
  }

  if (auth.red_flags.includes('vocabulary_showing_off')) {
    voiceTips.push('Use simpler words - admissions readers prefer clarity over complexity');
  }

  if (auth.green_flags.length === 0) {
    voiceTips.push('Add sensory details (what you saw, heard, felt)');
    voiceTips.push('Use shorter sentences for emphasis');
    voiceTips.push('Start some sentences with "But", "So", "And" - break formal rules');
  }

  return {
    authenticity_score: auth.authenticity_score,
    voice_type: auth.voice_type,
    diagnosis: getVoiceDiagnosis(auth.authenticity_score, auth),
    phrases_to_cut: phrasesToCut.slice(0, 5), // Top 5 most problematic
    voice_tips: voiceTips.slice(0, 4),
  };
}

function getPhraseExplanation(phrase: string): string {
  const explanations: Record<string, string> = {
    'this taught me that': 'Sounds like an essay conclusion - show the learning through story instead',
    'i came to realize': 'Formulaic reflection starter - just state the insight directly',
    'through this experience': 'Generic transition - cut it and get to the point',
    'valuable lessons': 'Vague and cliché - what specific lesson?',
    'looking back now': 'Essay-speak - tell the story in present tense if possible',
    'plethora': 'SAT word showing off - just say "many" or be specific',
    'myriad': 'SAT word showing off - just say "many" or be specific',
    'moreover': 'Formal essay transition - use conversational connectors',
    'furthermore': 'Formal essay transition - use conversational connectors',
  };

  return explanations[phrase.toLowerCase()] || 'Sounds manufactured/essay-like instead of authentic';
}

// ============================================================================
// MISSING ELEMENTS
// ============================================================================

function identifyMissingElements(
  report: AnalysisReport,
  features: ExtractedFeatures,
  entry: ExperienceEntry
): MissingElement[] {
  const missing: MissingElement[] = [];

  // Check for missing specifics
  if (!features.evidence.has_concrete_numbers || features.evidence.number_count < 2) {
    missing.push({
      element: 'Concrete Numbers & Metrics',
      why_important: 'Numbers make your story credible and measurable. Without them, readers can\'t gauge your commitment.',
      how_to_find_it: 'Think about: hours per week, total hours, number of people involved/helped, money raised, items created, etc.',
      elicitation_prompts: getSpecificityPrompts(entry),
    });
  }

  // Check for missing stakes/tension
  if (!features.arc.has_stakes && !features.arc.has_turning_point) {
    missing.push({
      element: 'Challenge or Obstacle',
      why_important: 'Stories without tension feel flat. Showing what was hard makes your achievement meaningful.',
      how_to_find_it: 'Think about: What went wrong? What was harder than expected? When did you doubt yourself?',
      elicitation_prompts: getArcPrompts(entry),
    });
  }

  // Check for missing reflection
  if (features.reflection.reflection_quality === 'none' || features.reflection.reflection_quality === 'superficial') {
    missing.push({
      element: 'Genuine Insight or Growth',
      why_important: 'Admissions wants to see self-awareness and growth, not just activities.',
      how_to_find_it: 'Think about: What belief changed? What do you do differently now? What surprised you?',
      elicitation_prompts: getReflectionPrompts(entry),
    });
  }

  return missing;
}

// ============================================================================
// STRENGTHS IDENTIFICATION
// ============================================================================

function identifyStrengths(report: AnalysisReport, auth: AuthenticityAnalysis): string[] {
  const strengths: string[] = [];

  // High-scoring categories
  const highScores = report.categories.filter(c => c.score_0_to_10 >= 7.5);
  for (const category of highScores) {
    strengths.push(`Strong ${category.name.replace(/_/g, ' ')}`);
  }

  // Authentic voice
  if (auth.authenticity_score >= 7.5) {
    strengths.push('Authentic, conversational voice');
  }

  // Green flags
  if (auth.green_flags.includes('conversational_questions')) {
    strengths.push('Engaging conversational style');
  }
  if (auth.green_flags.includes('real_world_specifics')) {
    strengths.push('Concrete, credible details');
  }

  return strengths;
}

// ============================================================================
// WARNINGS
// ============================================================================

function generateWarnings(report: AnalysisReport, auth: AuthenticityAnalysis): string[] {
  const warnings: string[] = [];

  if (auth.voice_type === 'robotic') {
    warnings.push('⚠️ CRITICAL: Voice sounds robotic/templated - consider starting fresh');
  }

  if (auth.red_flags.includes('pure_essay_voice')) {
    warnings.push('⚠️ Sounds like it was written FOR admissions - write FROM your authentic voice');
  }

  if (auth.red_flags.includes('vocabulary_showing_off')) {
    warnings.push('⚠️ Using fancy vocabulary makes you sound inauthentic - use simpler language');
  }

  if (report.flags.includes('low_specificity')) {
    warnings.push('⚠️ Too vague - add concrete numbers and details');
  }

  return warnings;
}
