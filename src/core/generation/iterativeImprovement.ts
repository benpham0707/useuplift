/**
 * Iterative Improvement System
 *
 * Learns from analysis feedback to improve generation prompts and logic.
 * Each iteration gets smarter based on what gaps were identified.
 */

import { callClaudeWithRetry } from '../../lib/llm/claude';
import { GenerationProfile, GenerationResult, buildGenerationPrompt, selectOptimalAngle } from './essayGenerator';
import { analyzeAuthenticity } from '../analysis/features/authenticityDetector';
import { analyzeElitePatterns } from '../analysis/features/elitePatternDetector';
import { analyzeLiterarySophistication } from '../analysis/features/literarySophisticationDetector';
import { buildIntelligentPrompt, identifyEmphasis } from './intelligentPrompting';
import { generateNarrativeAngles, type NarrativeAngle } from './narrativeAngleGenerator';

// ============================================================================
// LEARNING SYSTEM
// ============================================================================

interface IterationLearning {
  iteration: number;
  gapsIdentified: string[];
  specificInstructions: string[];
  promptEnhancements: string[];
  focusAreas: string[];
}

/**
 * Analyze what went wrong and build targeted improvements
 */
function analyzeGapsAndBuildImprovements(
  result: GenerationResult,
  targetScore: number
): IterationLearning {
  const gaps = result.gaps;
  const specificInstructions: string[] = [];
  const promptEnhancements: string[] = [];
  const focusAreas: string[] = [];

  // Authenticity issues
  if (result.authenticityScore < 7) {
    focusAreas.push('AUTHENTICITY');

    specificInstructions.push(`
**CRITICAL: Your voice sounds manufactured (score: ${result.authenticityScore}/10)**
- Remove ALL "essay voice" phrases: "I used to think...but learned", "this taught me", "shaped who I am"
- Remove forced sensory details that feel performed: "smelled like X", "tasted like Y"
- Use conversational language: fragments, questions, parenthetical asides (like this!)
- Sound like how you'd text a friend about this experience, not how you'd write for a teacher`);

    promptEnhancements.push('USE_CONVERSATIONAL_FRAGMENTS');
    promptEnhancements.push('ADD_RHETORICAL_QUESTIONS');
    promptEnhancements.push('AVOID_ESSAY_CLICHES');
  }

  // Vulnerability missing
  if (result.elitePatternsScore < 70 && gaps.some(g => g.includes('vulnerability'))) {
    focusAreas.push('VULNERABILITY');

    specificInstructions.push(`
**MISSING: Specific vulnerability (current elite score: ${result.elitePatternsScore}/100)**
You MUST include at least ONE of these:
1. Physical symptom: "I got stomach ulcers", "my hands trembled", "my jaw dropped"
2. Named emotion: "I was afraid", "I felt dumbstruck", "I was out of place"
3. Admits ignorance: "I didn't know how", "seemed like a distant idea"
4. Before/after: "The first few days were not kind... That first Thursday however..."

NOT acceptable: Generic "I faced challenges" - BE SPECIFIC!`);

    promptEnhancements.push('REQUIRE_PHYSICAL_SYMPTOMS');
    promptEnhancements.push('NAME_SPECIFIC_EMOTIONS');
  }

  // Dialogue missing
  if (!gaps.some(g => g.includes('dialogue')) && result.elitePatternsScore < 80) {
    // Dialogue present but quality low
    focusAreas.push('DIALOGUE_QUALITY');

    specificInstructions.push(`
**IMPROVE: Dialogue quality**
Your dialogue exists but needs more impact:
- Make it confrontational or revealing: "He isn't some charity project... He is my friend"
- Show personality through HOW they speak
- Use exclamations or questions: "Who-the-what-now!?"
- Keep it SHORT and punchy, not long explanations`);

    promptEnhancements.push('CONFRONTATIONAL_DIALOGUE');
  } else if (gaps.some(g => g.includes('dialogue'))) {
    focusAreas.push('DIALOGUE');

    specificInstructions.push(`
**MISSING: Quoted dialogue (REQUIRED for elite essays)**
Add at least ONE direct quote:
- Something someone said to you: "This will definitely grant you an A"
- Your response: "He isn't some charity project... He is my friend"
- Internal question: "Have I completely lost it?"
- Even reconstruct from memory if needed, but it must feel REAL`);

    promptEnhancements.push('REQUIRE_DIALOGUE');
  }

  // Community transformation missing
  if (gaps.some(g => g.includes('community transformation'))) {
    focusAreas.push('COMMUNITY_TRANSFORMATION');

    specificInstructions.push(`
**MISSING: Community transformation (you only show YOUR growth)**
Show how OTHERS changed because of your actions:

BEFORE state:
- "people stared and whispered"
- "Neighbors who bickered over whose dog urinated on whose lawn"
- "Classmates believed we'd only succeed with 4.0 GPAs"

AFTER state:
- "classmates still stare—they stare with admiration"
- "put their differences aside for the common interest"
- "people began to put their priorities in perspective"

The essay should show: "The community was X. After my work, the community became Y."`);

    promptEnhancements.push('REQUIRE_BEFORE_AFTER_CONTRAST');
    promptEnhancements.push('COMMUNITY_NOT_JUST_PERSONAL');
  }

  // Metrics missing
  if (gaps.some(g => g.includes('metrics') || g.includes('quantified'))) {
    focusAreas.push('QUANTIFIED_IMPACT');

    specificInstructions.push(`
**MISSING: Specific numbers**
Include concrete metrics:
- People: "350+ people mobilized", "hundreds participated"
- Money: "$15,000 raised", "$7,000 for Red Cross"
- Time: "18→9 minutes wait time", "47→22 questions"
- Scale: "500 students reached", "7 countries", "15 conferences"

NOT: "many people" or "a lot of money" - BE SPECIFIC!`);

    promptEnhancements.push('REQUIRE_METRICS');
  }

  // Extended metaphor missing or weak
  if (result.literarySophisticationScore < 70 && gaps.some(g => g.includes('metaphor'))) {
    focusAreas.push('EXTENDED_METAPHOR');

    specificInstructions.push(`
**MISSING: Extended metaphor (literary score: ${result.literarySophisticationScore}/100)**
Choose ONE central image and weave it through the entire essay:

Example (Symphony/Silence):
- Opening: "My life feels like a symphony"
- Middle: "the silence that frames the sound, the breath that carries melody"
- Crisis: "There was a time I raced toward volume"
- Insight: "a life lived fully is not a nonstop performance but a deliberate composition"
- Close: "The gaps. The breath before the next phrase."

ALL paragraphs should reference the central metaphor!`);

    promptEnhancements.push('WEAVE_METAPHOR_THROUGHOUT');
  }

  // Philosophical depth missing
  if (gaps.some(g => g.includes('philosophical') || g.includes('universal'))) {
    focusAreas.push('PHILOSOPHICAL_DEPTH');

    specificInstructions.push(`
**MISSING: Universal insight at the end**
Don't end with: "I learned about teamwork" (too generic!)

Instead, challenge an assumption or reveal universal truth:
- "The shortsightedness in the mindless race to superficial success is meaningless without cherishing relationships"
- "The power of public policy lies in the hands of the people, not politicians"
- "Cutting out milk became the least impactful part - the connections mattered most"

Make the reader THINK about life, not just about your activity.`);

    promptEnhancements.push('COUNTER_NARRATIVE_CLOSING');
  }

  // Sentence variety
  if (result.literarySophisticationScore < 75 && gaps.some(g => g.includes('sentence'))) {
    focusAreas.push('RHYTHMIC_PROSE');

    specificInstructions.push(`
**CRITICAL: Sentence rhythm missing (literary score: ${result.literarySophisticationScore}/100)**

You MUST include ALL of these in your rewrite:
1. VERY SHORT (1-2 words): At least 2 sentences like "No." "Gone." "Three days."
   → Place these at emotional peaks for dramatic punch

2. SHORT (3-5 words): At least 2 sentences like "My hands trembled." "I was terrified."
   → Use for crisp, clear moments

3. LONG (25+ words): At least 2 sentences with complex clauses
   → Example: "As I walked up to the podium to present the case, I thought about Hobbes's natural rights philosophies and understood that our free will determines our self-governed society."

RHYTHM EXAMPLE:
[Long: 30 words setting scene] → [Medium: 12 words] → [Short: 3 words - punch!] → [Long: 28 words reflecting]

This variety creates musicality and emphasis. WITHOUT IT, your score caps at 70/100.`);

    promptEnhancements.push('SENTENCE_VARIETY');
  }

  return {
    iteration: result.iteration + 1,
    gapsIdentified: gaps,
    specificInstructions,
    promptEnhancements,
    focusAreas,
  };
}

/**
 * Build enhanced prompt based on learning
 */
function buildEnhancedPrompt(
  profile: GenerationProfile,
  techniques: string[],
  learning: IterationLearning,
  previousEssay: string
): string {
  const focusAreasText = learning.focusAreas.length > 0
    ? `\n🎯 PRIORITY FOCUS AREAS FOR THIS ITERATION:\n${learning.focusAreas.map(f => `- ${f}`).join('\n')}`
    : '';

  const specificInstructionsText = learning.specificInstructions.length > 0
    ? `\n\n${'='.repeat(80)}\n⚠️  CRITICAL IMPROVEMENTS NEEDED (from previous iteration)\n${'='.repeat(80)}\n${learning.specificInstructions.join('\n\n')}`
    : '';

  return `You are an elite college admissions essay coach. This is iteration ${learning.iteration}.

PREVIOUS ITERATION FAILED TO MEET STANDARDS.
Current gaps: ${learning.gapsIdentified.slice(0, 5).join(', ')}
${focusAreasText}

STUDENT PROFILE:
- Activity: ${profile.activityType} - ${profile.role}
- Duration: ${profile.duration}
- Voice Style: ${profile.studentVoice}
- Target: ${profile.targetTier === 1 ? 'Harvard/Stanford/MIT (score 85+)' : profile.targetTier === 2 ? 'UC Berkeley/Top Ivies (score 75+)' : 'UCLA/Top UCs (score 65+)'}

CONTENT:
Achievements: ${profile.achievements.join('; ')}
Challenges: ${profile.challenges.join('; ')}
People: ${profile.relationships.join('; ')}
Impact: ${profile.impact.join('; ')}

PREVIOUS ESSAY (use as reference but IMPROVE significantly):
"${previousEssay}"
${specificInstructionsText}

${'='.repeat(80)}
YOUR TASK: Rewrite to address ALL gaps above while keeping core story
${'='.repeat(80)}

REQUIRED LITERARY TECHNIQUES:
${techniques.map(t => `- ${t}`).join('\n')}

MANDATORY ELEMENTS (if missing from previous):
${learning.promptEnhancements.includes('REQUIRE_PHYSICAL_SYMPTOMS') ? `
✓ Physical symptom or named emotion in a vulnerable moment` : ''}
${learning.promptEnhancements.includes('REQUIRE_DIALOGUE') ? `
✓ At least ONE quoted conversation (even if reconstructed)` : ''}
${learning.promptEnhancements.includes('REQUIRE_METRICS') ? `
✓ Specific numbers (people, money, time, scale)` : ''}
${learning.promptEnhancements.includes('REQUIRE_BEFORE_AFTER_CONTRAST') ? `
✓ Community transformation with before/after states` : ''}
${learning.promptEnhancements.includes('WEAVE_METAPHOR_THROUGHOUT') ? `
✓ Extended metaphor in ALL paragraphs` : ''}
${learning.promptEnhancements.includes('COUNTER_NARRATIVE_CLOSING') ? `
✓ Universal insight that challenges assumptions` : ''}
${learning.promptEnhancements.includes('SENTENCE_VARIETY') ? `
✓ At least 2 sentences with 4 words or less` : ''}
${learning.promptEnhancements.includes('USE_CONVERSATIONAL_FRAGMENTS') ? `
✓ Conversational voice with fragments, questions, parentheticals` : ''}

AUTHENTICITY REQUIREMENTS (CRITICAL):
- Sound like a real ${profile.studentVoice} high school student
- Use how you'd actually talk/text, not "essay voice"
- Include imperfect moments, doubts, failures
- Avoid: "I used to think...but learned", "this taught me", "changed my life"
- YES: Questions, fragments, parentheticals, dialogue, specific emotions

STRUCTURE:
- Length: 800-1200 characters
- Paragraphs: 2-3 substantial
- Sentence variety: Mix 1-word sentences with 25+ word sentences
- Active voice throughout

Generate the improved essay now. Score must be 85+ combined.

Return ONLY the essay text, no commentary.`;
}

// ============================================================================
// MAIN ITERATIVE IMPROVEMENT ENGINE
// ============================================================================

export async function generateWithIterativeImprovement(
  profile: GenerationProfile,
  maxIterations: number = 5,
  targetScore: number = 85
): Promise<GenerationResult & { iterationHistory: GenerationResult[] }> {
  console.log(`\n${'█'.repeat(80)}`);
  console.log(`ITERATIVE IMPROVEMENT ENGINE: ${profile.role}`);
  console.log(`Target Score: ${targetScore}/100, Max Iterations: ${maxIterations}`);
  console.log(`${'█'.repeat(80)}\n`);

  // Generate narrative angle if requested (Session 18 optimization)
  let narrativeAngle = profile.narrativeAngle;

  if (profile.generateAngle && !narrativeAngle) {
    console.log(`🎨 GENERATING NARRATIVE ANGLES...\n`);

    const angles = await generateNarrativeAngles({
      profile,
      numAngles: 10,
      prioritize: 'originality',
    });

    console.log(`✓ Generated ${angles.length} unique angles`);

    // Use smart selection (prioritize moderate risk + grounded)
    narrativeAngle = selectOptimalAngle(angles, profile);

    console.log(`\n🎯 SELECTED ANGLE: "${narrativeAngle.title}"`);
    console.log(`   Originality: ${narrativeAngle.originality}/10 | Risk: ${narrativeAngle.riskLevel}`);
    console.log(`   Hook: "${narrativeAngle.hook}"`);
    console.log(`   Connection: ${narrativeAngle.unusualConnection}\n`);
  } else if (narrativeAngle) {
    console.log(`🎯 USING PROVIDED ANGLE: "${narrativeAngle.title}"\n`);
  }

  const techniques = profile.literaryTechniques.length > 0
    ? profile.literaryTechniques
    : ['extendedMetaphor', 'dualScene', 'inMediasRes'];

  const iterationHistory: GenerationResult[] = [];
  let currentEssay = '';
  let bestEssay = '';
  let bestScore = 0;
  let iteration = 1;

  // Initial generation (no learning yet)
  console.log(`\n${'▓'.repeat(80)}`);
  console.log(`ITERATION 1: Initial Generation`);
  console.log(`${'▓'.repeat(80)}\n`);

  // Use intelligent prompting from the start (no previous essay for iteration 1)
  const initialPrompt = buildIntelligentPrompt(profile, techniques, null, 1, narrativeAngle);
  console.log(`Generating initial essay with intelligent prompting...`);

  const initialResponse = await callClaudeWithRetry<{ essay: string }>(
    initialPrompt,
    {
      temperature: 0.65, // Slightly lower for more consistent technique application
      maxTokens: 2000,
      useJsonMode: false,
    }
  );

  currentEssay = initialResponse.content;
  bestEssay = currentEssay;
  console.log(`✓ Generated ${currentEssay.length} characters\n`);

  // Analyze initial
  const initialResult = await analyzeEssay(currentEssay, profile, techniques, 1, narrativeAngle);
  iterationHistory.push(initialResult);
  bestScore = initialResult.combinedScore;

  console.log(`📊 INITIAL SCORES:`);
  console.log(`  Combined: ${initialResult.combinedScore}/100`);
  console.log(`  Authenticity: ${initialResult.authenticityScore}/10`);
  console.log(`  Elite Patterns: ${initialResult.elitePatternsScore}/100`);
  console.log(`  Literary: ${initialResult.literarySophisticationScore}/100\n`);

  if (initialResult.combinedScore >= targetScore) {
    console.log(`✅ TARGET REACHED on iteration 1!\n`);
    return { ...initialResult, iterationHistory };
  }

  // Iterative improvement
  while (iteration < maxIterations) {
    iteration++;

    console.log(`\n${'▓'.repeat(80)}`);
    console.log(`ITERATION ${iteration}: Learning & Improving`);
    console.log(`${'▓'.repeat(80)}\n`);

    // CRITICAL: Always analyze gaps from BEST result, not just previous
    const bestResult = iterationHistory.reduce((best, current) =>
      current.combinedScore > best.combinedScore ? current : best
    );

    // INTELLIGENT PROMPTING: Full holistic prompts with smart emphasis
    // Analyzes previous essay and dynamically emphasizes critical gaps
    // within the holistic context (maintains coherence unlike surgical edits)

    const emphasis = identifyEmphasis(bestEssay);
    if (emphasis.category !== 'none') {
      console.log(`🎯 INTELLIGENT FOCUS: ${emphasis.category.replace(/_/g, ' ').toUpperCase()}`);
      console.log(`   Reason: ${emphasis.reason}\n`);
    }

    const intelligentPrompt = buildIntelligentPrompt(
      profile,
      techniques,
      bestEssay,
      iteration,
      narrativeAngle
    );

    console.log(`Generating improved essay (~${Math.round(intelligentPrompt.length / 4)} tokens)...`);

    const improvedResponse = await callClaudeWithRetry<{ essay: string }>(
      intelligentPrompt,
      {
        temperature: 0.65,
        maxTokens: 1500,
        useJsonMode: false,
      }
    );

    currentEssay = improvedResponse.content;
    console.log(`✓ Generated ${currentEssay.length} characters\n`);

    // Analyze improved version
    const improvedResult = await analyzeEssay(currentEssay, profile, techniques, iteration, narrativeAngle);
    iterationHistory.push(improvedResult);

    // Update best if this is better
    if (improvedResult.combinedScore > bestScore) {
      bestScore = improvedResult.combinedScore;
      bestEssay = currentEssay;
      console.log(`🎯 NEW BEST SCORE! ${bestScore}/100\n`);
    }

    const previousResult = iterationHistory[iterationHistory.length - 2];
    const improvement = improvedResult.combinedScore - previousResult.combinedScore;

    console.log(`📊 ITERATION ${iteration} SCORES:`);
    console.log(`  Combined: ${improvedResult.combinedScore}/100 (${improvement >= 0 ? '+' : ''}${improvement})`);
    console.log(`  Authenticity: ${improvedResult.authenticityScore}/10 (${improvedResult.authenticityScore >= previousResult.authenticityScore ? '+' : ''}${(improvedResult.authenticityScore - previousResult.authenticityScore).toFixed(1)})`);
    console.log(`  Elite Patterns: ${improvedResult.elitePatternsScore}/100 (${improvedResult.elitePatternsScore >= previousResult.elitePatternsScore ? '+' : ''}${improvedResult.elitePatternsScore - previousResult.elitePatternsScore})`);
    console.log(`  Literary: ${improvedResult.literarySophisticationScore}/100 (${improvedResult.literarySophisticationScore >= previousResult.literarySophisticationScore ? '+' : ''}${improvedResult.literarySophisticationScore - previousResult.literarySophisticationScore})\n`);

    if (improvement > 0) {
      console.log(`✓ Improvement: +${improvement} points\n`);
    } else {
      console.log(`⚠️  Regression: ${improvement} points (but keeping best: ${bestScore}/100)\n`);
    }

    if (improvedResult.combinedScore >= targetScore) {
      console.log(`✅ TARGET REACHED: ${improvedResult.combinedScore}/100\n`);
      return { ...improvedResult, iterationHistory };
    }

    // COST OPTIMIZATION: Exit if within 3 points of target
    if (improvedResult.combinedScore >= targetScore - 3) {
      console.log(`💡 CLOSE TO TARGET: ${improvedResult.combinedScore}/${targetScore} (within 3 pts). Exiting early to save cost.\n`);
      return { ...bestResult, iterationHistory };
    }

    // COST OPTIMIZATION: Check if we're plateaued (< 2 pt improvement for 2 consecutive iterations)
    if (iteration > 3) {
      const recentScores = iterationHistory.slice(-3).map(r => r.combinedScore);
      const improvements = [
        recentScores[1] - recentScores[0],
        recentScores[2] - recentScores[1]
      ];

      if (improvements.every(imp => Math.abs(imp) < 2)) {
        console.log(`⚠️  PLATEAU DETECTED: Last 2 improvements < 2 pts each. Exiting early.\n`);
        console.log(`💰 Cost saved: ${maxIterations - iteration} iterations (~$${((maxIterations - iteration) * 0.011).toFixed(3)})\n`);
        return { ...bestResult, iterationHistory };
      }

      const maxRecent = Math.max(...recentScores);
      const minRecent = Math.min(...recentScores);

      if (maxRecent - minRecent < 3) {
        console.log(`⚠️  Scores oscillating (range: ${minRecent}-${maxRecent}). Next iteration will try radical changes...\n`);
      }
    }
  }

  // Return best result from all iterations
  const bestResult = iterationHistory.reduce((best, current) =>
    current.combinedScore > best.combinedScore ? current : best
  );

  console.log(`\n⚠️  Max iterations reached. Best score: ${bestResult.combinedScore}/100\n`);
  return { ...bestResult, iterationHistory };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildInitialGenerationPrompt(profile: GenerationProfile, techniques: string[]): string {
  // Use the full detailed prompt from essayGenerator for initial generation
  // This ensures high-quality starting point
  return buildGenerationPrompt(profile, techniques, 1);
}

async function analyzeEssay(
  essay: string,
  profile: GenerationProfile,
  techniques: string[],
  iteration: number,
  narrativeAngle?: NarrativeAngle
): Promise<GenerationResult> {
  const authenticity = analyzeAuthenticity(essay);
  const elitePatterns = analyzeElitePatterns(essay);
  const literary = analyzeLiterarySophistication(essay);

  const combinedScore = Math.round(
    (authenticity.authenticity_score / 10) * 20 +
    (elitePatterns.overallScore / 100) * 40 +
    (literary.overallScore / 100) * 40
  );

  return {
    essay,
    authenticityScore: authenticity.authenticity_score,
    elitePatternsScore: elitePatterns.overallScore,
    literarySophisticationScore: literary.overallScore,
    combinedScore,
    strengths: [...elitePatterns.strengths, ...literary.strengths],
    gaps: [...elitePatterns.gaps, ...literary.improvements],
    iteration,
    techniquesUsed: techniques,
    warningFlags: authenticity.voice_type === 'essay' || authenticity.voice_type === 'robotic' ? ['essay_voice'] : [],
    narrativeAngle, // Include the angle used
  };
}
