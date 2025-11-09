/**
 * Category Scoring Engine
 *
 * Scores individual rubric categories using Claude with extracted features
 * and rubric definitions. This is Stage 2 of the analysis pipeline.
 *
 * Approach:
 * - Batch categories into 3 parallel calls for efficiency
 * - Use anchor-based scoring with evidence quotation
 * - Return structured JSON with scores + justification
 */

import { ExperienceEntry, ExtractedFeatures, RubricCategoryScore, RubricCategory } from '../../types/experience';
import { RUBRIC_CATEGORIES_DEFINITIONS, CategoryDefinition } from '../../rubrics/v1.0.0';
import { callClaudeWithRetry } from '../../../lib/llm/claude';
import { AuthenticityAnalysis } from '../features/authenticityDetector';

// ============================================================================
// CATEGORY BATCHING STRATEGY
// ============================================================================

/**
 * Group categories by focus area for parallel processing
 */
export const CATEGORY_BATCHES: Record<string, RubricCategory[]> = {
  text_focused: [
    'voice_integrity',
    'craft_language_quality',
    'specificity_evidence',
  ],
  outcome_focused: [
    'transformative_impact',
    'initiative_leadership',
    'community_collaboration',
  ],
  narrative_focused: [
    'narrative_arc_stakes',
    'reflection_meaning',
    'fit_trajectory',
    'time_investment_consistency',
  ],
};

// Role clarity is special - can be batched with any group, but we'll put it with outcome_focused
CATEGORY_BATCHES.outcome_focused.push('role_clarity_ownership');

// ============================================================================
// PROMPT CONSTRUCTION
// ============================================================================

/**
 * Build system prompt for category scoring
 */
function buildScoringSystemPrompt(categories: RubricCategory[]): string {
  const categoryDefs = categories.map(cat => RUBRIC_CATEGORIES_DEFINITIONS[cat]);

  return `You are an elite college admissions evaluator tasked with scoring extracurricular experience descriptions.

**Your Task:**
Score the following categories for a student's experience description. For each category, provide:
1. A score from 0-10 (decimals allowed)
2. 1-3 direct quotes from the text that justify your score
3. A brief (1-2 sentence) evaluator note explaining the score

**Scoring Philosophy - READ THIS CAREFULLY:**
- Be BRUTALLY strict - this determines college admissions outcomes
- **Scores must be EARNED, not given** - start from 0 and only increase for strong evidence
- **Resume bullets with no story = 1-2 per category** (not 4-6!)
- **Facts + numbers but no emotion/reflection = 2-3 per category**
- **Decent storytelling with some depth = 5-6 per category**
- **Exceptional narrative + vulnerability = 7-8 per category**
- **Near-perfect literary craft = 9-10 per category** (reserved for top 1% of HYPSM essays)
- anchor_5 represents SOLID/ACCEPTABLE work - most essays are BELOW this
- anchor_0 is template/no-content - anything factual should still score 1-3 if it lacks story
- Never invent facts or quotes not in the text
- Evidence-based: always quote exact phrases to justify scores
- CRITICAL: 80+ NQI = admitted to Stanford/MIT. 70-80 = UCLA/Berkeley. 50-70 = mid-tier UCs. Below 50 = needs major work.

**Categories to Score:**

${categoryDefs.map((def, idx) => `
**${idx + 1}. ${def.display_name}** (Weight: ${Math.round(def.weight * 100)}%)

*Definition:* ${def.definition}

*Scoring Anchors:*
- **0/10:** ${def.anchor_0}
- **5/10:** ${def.anchor_5}
- **10/10:** ${def.anchor_10}

*Evaluator Prompts:*
${def.evaluator_prompts.map(p => `  - ${p}`).join('\n')}

*Warning Signs (penalize if present):*
${def.warning_signs.map(w => `  - "${w}"`).join('\n')}
`).join('\n---\n')}

**Output Format:**
Return a JSON object with this structure:
{
  "categories": [
    {
      "name": "category_name",
      "score_0_to_10": 7.5,
      "evidence_snippets": ["quote 1", "quote 2"],
      "evaluator_notes": "Brief explanation of score",
      "confidence": 0.85
    },
    ...
  ]
}

**CRITICAL SCORING CALIBRATION:**
- All quotes must be exact, verbatim excerpts from the student's text
- **DEFAULT to scores of 1-3 for most categories** - only increase if there's strong evidence
- Voice Integrity: Resume language = 1-2. Some personality = 3-4. Authentic voice = 5-6. Exceptional voice = 7-10.
- Narrative Arc: No story = 0-1. Some structure = 3-4. Good arc = 5-6. Masterful arc = 8-10.
- Reflection: None = 0. Surface = 1-2. Some depth = 4-5. Profound = 7-10.
- **If a category is missing entirely (no reflection, no story, no emotion), score it 0-1, not 4-6**
- **LENGTH PENALTIES:** <100 words = cap all scores at 4/10. <50 words = cap at 2/10. <25 words = cap at 1/10.
- Confidence is 0-1, reflecting how certain you are of the score (based on evidence quality)
- Remember: An NQI of 80+ means this student gets into Stanford. An NQI of 35 means they need to completely rewrite.`;
}

/**
 * Build user prompt with entry and extracted features
 */
function buildScoringUserPrompt(entry: ExperienceEntry, features: ExtractedFeatures, authenticity: AuthenticityAnalysis): string {
  const wordCount = entry.description_original.trim().split(/\s+/).filter(Boolean).length;
  const charCount = entry.description_original.length;

  return `**Student's Experience Description:**

"${entry.description_original}"

**LENGTH:** ${wordCount} words, ${charCount} characters
${wordCount < 100 ? '⚠️ WARNING: Essay is very short (<100 words) - apply LENGTH PENALTIES!' : ''}
${wordCount < 50 ? '⚠️ CRITICAL: Essay is extremely short (<50 words) - maximum score 2/10 per category!' : ''}

**AUTHENTICITY ANALYSIS (CRITICAL FOR VOICE SCORING):**

⚠️ **Authenticity Score: ${authenticity.authenticity_score}/10** (${authenticity.voice_type} voice)

*Manufactured Signals Found:*
${authenticity.manufactured_signals.length > 0 ? authenticity.manufactured_signals.map(s => `  - ${s}`).join('\n') : '  ✓ No manufactured signals'}

*Authentic Signals Found:*
${authenticity.authentic_signals.length > 0 ? authenticity.authentic_signals.map(s => `  - ${s}`).join('\n') : '  ✗ No authentic signals'}

*Red Flags:* ${authenticity.red_flags.length > 0 ? authenticity.red_flags.join(', ') : 'None ✓'}
*Green Flags:* ${authenticity.green_flags.length > 0 ? authenticity.green_flags.join(', ') : 'None'}

**IMPORTANT FOR VOICE INTEGRITY:** ${authenticity.voice_type === 'conversational' ? 'This essay shows AUTHENTIC conversational voice - reward this highly!' : authenticity.voice_type === 'essay' || authenticity.voice_type === 'robotic' ? 'This essay uses manufactured ESSAY VOICE - penalize heavily!' : 'Mixed voice quality - evaluate carefully.'}

**Extracted Features (to inform your scoring):**

*Voice Analysis:*
- Active verbs: ${features.voice.active_verb_count}
- Passive verbs: ${features.voice.passive_verb_count}
- Passive ratio: ${Math.round(features.voice.passive_ratio * 100)}%
- Buzzwords found: ${features.voice.buzzwords_found.length > 0 ? features.voice.buzzwords_found.join(', ') : 'None'}
- Sentence variety score: ${features.voice.sentence_variety_score}/10
- Average sentence length: ${features.voice.avg_sentence_length} words

*Evidence Analysis:*
- Numbers found: ${features.evidence.numbers_found.join(', ') || 'None'}
- Outcome statements: ${features.evidence.outcome_statements.length}
- Before/after comparison: ${features.evidence.before_after_comparison ? 'Yes' : 'No'}
- Metric specificity score: ${features.evidence.metric_specificity_score}/10

*Narrative Arc Analysis:*
- Stakes present: ${features.arc.has_stakes ? 'Yes' : 'No'}
- Stakes indicators: ${features.arc.stakes_indicators.join(', ') || 'None'}
- Turning point: ${features.arc.has_turning_point ? 'Yes' : 'No'}
- Temporal markers: ${features.arc.temporal_markers.length}
- Narrative structure score: ${features.arc.narrative_structure_score}/10

*Collaboration Analysis:*
- "We" usage: ${features.collaboration.we_usage_count} times
- Credit given to others: ${features.collaboration.credit_given ? 'Yes' : 'No'}
- Named partners: ${features.collaboration.named_partners.join(', ') || 'None'}
- Team orientation score: ${features.collaboration.team_orientation_score}/10

*Reflection Analysis:*
- Learning statements: ${features.reflection.learning_statements.length}
- Belief shift indicators: ${features.reflection.belief_shift_indicators.length}
- Reflection quality: ${features.reflection.reflection_quality}
- Transferable learning: ${features.reflection.transferable_learning ? 'Yes' : 'No'}
- Insight depth score: ${features.reflection.insight_depth_score}/10

**Additional Context:**
- Activity category: ${entry.category}
- Time span: ${entry.time_span || `${entry.start_date} - ${entry.end_date}`}
- Hours/week: ${entry.hours_per_week || 'Not specified'}
- Weeks/year: ${entry.weeks_per_year || 'Not specified'}

Now score the requested categories. Return only the JSON object.`;
}

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Score a batch of categories
 */
async function scoreCategoryBatch(
  categories: RubricCategory[],
  entry: ExperienceEntry,
  features: ExtractedFeatures,
  authenticity: AuthenticityAnalysis
): Promise<RubricCategoryScore[]> {
  const systemPrompt = buildScoringSystemPrompt(categories);
  const userPrompt = buildScoringUserPrompt(entry, features, authenticity);

  const response = await callClaudeWithRetry<{ categories: RubricCategoryScore[] }>(
    userPrompt,
    {
      systemPrompt,
      temperature: 0.3, // Low temperature for consistency
      maxTokens: 2048,
      useJsonMode: true,
      cacheSystemPrompt: true, // Cache the rubric definitions
    }
  );

  return response.content.categories;
}

/**
 * Score all categories in parallel batches
 */
export async function scoreAllCategories(
  entry: ExperienceEntry,
  features: ExtractedFeatures,
  authenticity: AuthenticityAnalysis
): Promise<{ scores: RubricCategoryScore[]; totalUsage: any }> {
  console.log(`Scoring all categories for entry ${entry.id}...`);

  // Execute all three batches in parallel
  const [textScores, outcomeScores, narrativeScores] = await Promise.all([
    scoreCategoryBatch(CATEGORY_BATCHES.text_focused, entry, features, authenticity),
    scoreCategoryBatch(CATEGORY_BATCHES.outcome_focused, entry, features, authenticity),
    scoreCategoryBatch(CATEGORY_BATCHES.narrative_focused, entry, features, authenticity),
  ]);

  // Combine all scores
  const allScores = [...textScores, ...outcomeScores, ...narrativeScores];

  // Verify we have all 11 categories
  const scoredCategories = new Set(allScores.map(s => s.name));
  const expectedCategories = Object.keys(RUBRIC_CATEGORIES_DEFINITIONS);

  const missingCategories = expectedCategories.filter(cat => !scoredCategories.has(cat));
  if (missingCategories.length > 0) {
    console.warn(`Missing category scores: ${missingCategories.join(', ')}`);
  }

  console.log(`Scored ${allScores.length} categories successfully`);

  return {
    scores: allScores,
    totalUsage: {
      // Usage tracking would be aggregated here from individual calls
      batches: 3,
    },
  };
}

/**
 * Score a single category (used for conditional deep dives)
 */
export async function scoreSingleCategory(
  category: RubricCategory,
  entry: ExperienceEntry,
  features: ExtractedFeatures,
  authenticity: AuthenticityAnalysis
): Promise<RubricCategoryScore> {
  const scores = await scoreCategoryBatch([category], entry, features, authenticity);
  return scores[0];
}

/**
 * Validate category scores
 */
export function validateCategoryScores(scores: RubricCategoryScore[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const score of scores) {
    // Check score range (critical)
    if (score.score_0_to_10 < 0 || score.score_0_to_10 > 10) {
      errors.push(`${score.name}: score ${score.score_0_to_10} out of range [0, 10]`);
    }

    // Check evidence (warning only for very weak entries)
    if (!score.evidence_snippets || score.evidence_snippets.length === 0) {
      // For very weak entries, evidence might be sparse - make this a warning
      warnings.push(`${score.name}: missing evidence snippets (may be acceptable for very weak entries)`);
      // Add placeholder evidence
      score.evidence_snippets = ['(No specific evidence found in text)'];
    }

    // Check notes (critical)
    if (!score.evaluator_notes || score.evaluator_notes.trim().length === 0) {
      errors.push(`${score.name}: missing evaluator notes`);
    }

    // Check confidence if provided
    if (score.confidence !== undefined && (score.confidence < 0 || score.confidence > 1)) {
      errors.push(`${score.name}: confidence ${score.confidence} out of range [0, 1]`);
    }
  }

  if (warnings.length > 0) {
    console.warn(`Validation warnings: ${warnings.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
