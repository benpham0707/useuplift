/**
 * CoachingKnowledgeBase — Contextual expert knowledge for essay coaching.
 *
 * Lazy-loads writing principles, type-specific evaluation criteria, performative
 * writing indicators, and issue patterns from the Common App Workshop and PIQ
 * Workshop research databases. Provides compact, coaching-ready context blocks
 * that the prompt block system can inject based on essay type and coaching mode.
 *
 * All data is imported from existing modules — no duplication.
 * All loading is lazy and cached — zero startup cost.
 */

import type { BlockContext } from './types';

// ============================================================================
// LAZY-LOADED DATA SOURCES (cached after first load)
// ============================================================================

let _corePrinciples: any[] | null = null;
let _typeSpecific: Record<string, any> | null = null;
let _performativeIndicators: any[] | null = null;
let _typeWeightConfigs: Record<string, any> | null = null;

async function loadCorePrinciples(): Promise<any[]> {
  if (_corePrinciples) return _corePrinciples;
  try {
    const { CORE_WRITING_PRINCIPLES } = await import(
      '../../commonAppWorkshop/rubrics/writingPrinciples'
    );
    _corePrinciples = CORE_WRITING_PRINCIPLES;
    return _corePrinciples;
  } catch (err) { console.warn('[KnowledgeBase] Failed to load writing principles:', err); return []; }
}

async function loadTypeSpecificPrinciples(): Promise<Record<string, any>> {
  if (_typeSpecific) return _typeSpecific;
  try {
    const { TYPE_SPECIFIC_PRINCIPLES } = await import(
      '../../commonAppWorkshop/rubrics/writingPrinciples'
    );
    _typeSpecific = TYPE_SPECIFIC_PRINCIPLES;
    return _typeSpecific;
  } catch (err) { console.warn('[KnowledgeBase] Failed to load type principles:', err); return {}; }
}

async function loadPerformativeIndicators(): Promise<any[]> {
  if (_performativeIndicators) return _performativeIndicators;
  try {
    const { PERFORMATIVE_INDICATORS } = await import(
      '../../commonAppWorkshop/rubrics/writingPrinciples'
    );
    _performativeIndicators = PERFORMATIVE_INDICATORS;
    return _performativeIndicators;
  } catch (err) { console.warn('[KnowledgeBase] Failed to load performative indicators:', err); return []; }
}

async function loadTypeWeightConfigs(): Promise<Record<string, any>> {
  if (_typeWeightConfigs) return _typeWeightConfigs;
  try {
    const { TYPE_WEIGHT_CONFIGS } = await import(
      '../../commonAppWorkshop/rubrics/typeWeightMatrices'
    );
    _typeWeightConfigs = TYPE_WEIGHT_CONFIGS;
    return _typeWeightConfigs;
  } catch (err) { console.warn('[KnowledgeBase] Failed to load type weights:', err); return {}; }
}

// ============================================================================
// PUBLIC API — Contextual knowledge blocks for coaching prompts
// ============================================================================

/**
 * Get the 6 core writing principles as a compact coaching reference.
 * Injected into the craft reference block — gives the coach expert-level
 * understanding of WHY things work, not just WHAT to look for.
 *
 * Returns ~400 tokens of principle summaries.
 */
export async function getCorePrinciplesBlock(): Promise<string> {
  const principles = await loadCorePrinciples();
  if (principles.length === 0) return '';

  // Include full reader_effect (3-4 lines each) — the WHY behind each principle.
  // We paid for this research; truncating to one line loses the insight.
  const lines = principles.map((p: any) => {
    const effect = p.reader_effect.replace(/\n/g, ' ').trim();
    return `${p.name}: ${effect}`;
  });

  return `WRITING PRINCIPLES (why things work — ground your coaching in these):
${lines.join('\n\n')}`;
}

/**
 * Get type-specific coaching guidance for the current essay type.
 * Includes the AO's reader question, success principles, common pitfalls,
 * and what excellence looks like.
 *
 * Maps BlockContext.essayType to the closest SupplementalType.
 * Returns ~200-400 tokens or empty string if no match.
 */
export async function getTypeSpecificBlock(essayType: string | undefined): Promise<string> {
  if (!essayType || essayType === 'common_app') return '';

  // Map to SupplementalType keys
  const typeMap: Record<string, string[]> = {
    supplement: ['why_us', 'why_major'], // default supplement types
    piq: [],  // PIQ has its own system in essayTypeBlock
    activity_description: ['extracurricular'],
    narrative: ['challenge', 'diversity'],
  };

  // For supplements, we'd need the specific supplement type from the essay prompt
  // For now, return the general why_us principles as the most common supplement type
  const typeKeys = typeMap[essayType] ?? [];
  if (typeKeys.length === 0) return '';

  const allTypes = await loadTypeSpecificPrinciples();
  const primaryKey = typeKeys[0];
  const typeData = allTypes[primaryKey];
  if (!typeData) return '';

  const parts: string[] = [];
  parts.push(`AO'S QUESTION: ${typeData.reader_question.split('\n')[0].trim()}`);
  if (typeData.success_principles?.length > 0) {
    parts.push(`SUCCESS CRITERIA:\n${typeData.success_principles.slice(0, 4).map((s: string) => `- ${s}`).join('\n')}`);
  }
  if (typeData.type_pitfalls?.length > 0) {
    parts.push(`COMMON PITFALLS:\n${typeData.type_pitfalls.slice(0, 3).map((s: string) => `- ${s}`).join('\n')}`);
  }

  return parts.join('\n');
}

/**
 * Get critical dimensions and excellence requirements for supplement essay types.
 * Tells the coach which dimensions matter MOST for this essay type.
 *
 * Returns ~150-250 tokens or empty string.
 */
export async function getTypeWeightBlock(essayType: string | undefined, supplementType?: string): Promise<string> {
  if (!essayType || essayType !== 'supplement') return '';

  const configs = await loadTypeWeightConfigs();
  const typeKey = supplementType ?? 'why_us'; // default to most common
  const config = configs[typeKey];
  if (!config) return '';

  const parts: string[] = [];

  // Critical dimensions
  if (config.critical_dimensions?.length > 0) {
    const criticalStr = config.critical_dimensions
      .map((d: string) => `${d.replace(/_/g, ' ')} (${config.weights[d]}%)`)
      .join(', ');
    parts.push(`CRITICAL DIMENSIONS for ${config.name}: ${criticalStr}`);
  }

  // Excellence requirements
  if (config.excellence_requirements?.length > 0) {
    parts.push(`WHAT MAKES THIS 85+:\n${config.excellence_requirements.slice(0, 4).map((r: string) => `- ${r}`).join('\n')}`);
  }

  // Word range
  if (config.word_range) {
    parts.push(`WORD RANGE: ${config.word_range.min}-${config.word_range.max} words`);
  }

  return parts.join('\n');
}

/**
 * Get performative writing indicators as coaching guardrails.
 * Helps the coach detect when students are performing rather than communicating.
 *
 * Returns ~300-400 tokens.
 */
export async function getPerformativeIndicatorsBlock(): Promise<string> {
  const indicators = await loadPerformativeIndicators();
  if (indicators.length === 0) return '';

  // Select the 4 most common performative patterns
  const top4 = indicators.slice(0, 4);
  const lines = top4.map((ind: any) =>
    `${ind.name}: ${ind.recognition_cues.slice(0, 2).join('; ')}. ` +
    `Antidote: ${ind.antidote}`
  );

  return `PERFORMATIVE WRITING DETECTION (when students perform rather than communicate):
${lines.join('\n')}`;
}

/**
 * AI-convergence terms the coaching system must never produce in sample prose.
 */
export const BANNED_COACH_TERMS = [
  'tapestry', 'realm', 'unwavering', 'testament', 'delve', 'showcase',
  'underscore', 'legs burning', 'gave 110%', 'journey', 'toolbox',
  'unlocking potential', 'transformative experience', 'profound impact',
  'multifaceted', 'instrumental in shaping',
];

/**
 * Get the banned terms as a coaching constraint block.
 * Returns ~50 tokens.
 */
export function getBannedTermsBlock(): string {
  return `BANNED TERMS (never use in sample prose or suggestions): ${BANNED_COACH_TERMS.join(', ')}`;
}

// ============================================================================
// PIQ-SPECIFIC KNOWLEDGE (loaded only for PIQ essays)
// ============================================================================

/**
 * Get PIQ prompt-specific coaching guidance.
 * Auto-detects which of the 8 UC prompts the student is answering,
 * then injects key themes, common pitfalls, and emphasis areas.
 *
 * Returns ~200-300 tokens or empty string.
 */
export async function getPIQPromptBlock(promptText?: string, essayText?: string): Promise<string> {
  try {
    const { detectPIQType, getPIQPrompt } = await import('../../piq/prompts/promptMetadata');

    // Detect prompt type from explicit prompt text or essay content
    let promptType: string | undefined;
    if (promptText) {
      // Try to detect from the prompt text itself
      promptType = detectPIQType(promptText);
    } else if (essayText) {
      promptType = detectPIQType(essayText);
    }

    if (!promptType) return '';

    const meta = getPIQPrompt(promptType as any);
    if (!meta) return '';

    const parts: string[] = [];
    parts.push(`PIQ PROMPT ${meta.promptNumber} (${meta.shortName}): "${meta.officialText.slice(0, 200)}..."`);

    if (meta.keyThemes?.length > 0) {
      parts.push(`KEY THEMES TO EVALUATE:\n${meta.keyThemes.slice(0, 5).map((t: string) => `- ${t}`).join('\n')}`);
    }
    if (meta.commonPitfalls?.length > 0) {
      parts.push(`COMMON PITFALLS TO WATCH FOR:\n${meta.commonPitfalls.slice(0, 4).map((p: string) => `- ${p}`).join('\n')}`);
    }

    return parts.join('\n');
  } catch { return ''; }
}

/**
 * Get vulnerability level coaching guidance for PIQ essays.
 * The 5-level vulnerability classification with level-specific fixes.
 *
 * Returns ~250 tokens.
 */
export function getVulnerabilityCoachingBlock(): string {
  return `VULNERABILITY LEVEL COACHING (PIQ-specific — vulnerability is the highest-weighted dimension):

LEVEL 1 (Minimal): Generic acknowledgments ("it was difficult but...", "this taught me...")
→ FIX: Add physical symptoms. "What did your body do? Hands shaking? Couldn't sleep? Stomach dropped?"

LEVEL 2 (Defensive Retreat): Opens with vulnerability but retreats to safety ("but I learned", "this made me stronger")
→ FIX: Replace "but" with "and." Stay in the complexity. "I still don't know if it was the right choice — and that's the point."

LEVEL 3 (Manufactured): Uses phrases that TALK ABOUT vulnerability rather than showing it ("vulnerability is a strength", "asking for help isn't weakness")
→ FIX: Delete the lesson sentence entirely. Show the moment instead. The reader doesn't need to be told what to feel.

LEVEL 4 (No Specific Failure): Mentions challenges generally but never a specific failure moment
→ FIX: Pick the most embarrassing failure. The one they don't want to write about. That's the essay.

LEVEL 5 (Transformation Imposed): Growth feels sudden/neat ("and then I realized...")
→ FIX: Show 2-3 failed attempts. Real growth is messy: "I thought I understood. Six months later I realized I'd only understood the easy part."`;
}

/**
 * Get PIQ word economy coaching — the 350-word surgical system.
 * Tiered strategy based on current word count, plus cut priority hierarchy.
 *
 * Returns ~200 tokens.
 */
export function getPIQWordEconomyBlock(currentWords?: number): string {
  const wordStatus = currentWords
    ? currentWords <= 300 ? 'under_300'
    : currentWords <= 340 ? '300_to_340'
    : currentWords <= 350 ? '340_to_350'
    : 'over_350'
    : 'unknown';

  const strategy: Record<string, string> = {
    under_300: 'UNDER 300: Room to add. Suggest additions freely — concrete details, dialogue, sensory moments.',
    '300_to_340': '300-340: Getting tight. Suggest additions BUT mention remaining word budget with each one.',
    '340_to_350': '340-350: CRITICAL ZONE. EVERY addition MUST come with a specific cut. Show the trade-off math: "Adding 18 words of dialogue → cut these 2 phrases (-13 words) → net 347 words."',
    over_350: 'OVER 350: CUT MODE ONLY. Suggest ONLY cuts until under limit. No additions until room exists.',
    unknown: 'Word budget is tight at 350. Every addition requires a named cut.',
  };

  return `PIQ 350-WORD ECONOMY:
${strategy[wordStatus]}

CUT PRIORITY (what to cut first):
1. Generic statements ("I learned a lot", "It was a great experience")
2. Redundant transitions ("In addition", "Furthermore")
3. Throat-clearing ("I realized that", "I began to understand")
4. Stated outcomes that are already shown
5. Adjective stacking ("amazing, wonderful experience")
6. Weak intensifiers ("very", "really", "quite")

BAD CUT (don't do this): "Most Wednesdays smelled like bleach and citrus" → "Wednesdays smelled like bleach" — loses "Most" (routine detail) and "citrus" (specific sensory)
GOOD CUT: "I was incredibly passionate about making a real difference" → "I wanted to change my community" — saves 6 words, stronger verb`;
}

// ============================================================================
// ISSUE PATTERN KNOWLEDGE (loaded for any essay type)
// ============================================================================

/**
 * Get issue detection patterns relevant to the coaching context.
 * Loads PIQ-specific patterns for PIQ essays, Common App patterns for supplements.
 * Returns keyword-based detection signals + fix strategies the coach can reference.
 *
 * Returns ~200-400 tokens or empty string.
 */
export async function getIssuePatternBlock(essayType: string | undefined): Promise<string> {
  if (essayType === 'piq') {
    try {
      const { PIQ_ISSUE_PATTERNS } = await import('../../piq/issuePatterns');

      // Select the most impactful patterns (critical severity first)
      const critical = PIQ_ISSUE_PATTERNS
        .filter((p: any) => p.severity === 'critical')
        .slice(0, 5);

      if (critical.length === 0) return '';

      const lines = critical.map((p: any) => {
        const keywords = p.triggerConditions.keywordPatterns?.slice(0, 2).join(', ') ?? '';
        const fix = p.fixStrategies[0];
        return `[${p.id}] ${p.title}: Watch for: ${keywords}${fix ? ` → FIX: ${fix.technique} — ${fix.description.slice(0, 100)}` : ''}`;
      });

      return `PIQ ISSUE PATTERNS (keyword signals → fix strategies):\n${lines.join('\n')}`;
    } catch { return ''; }
  }

  // For supplements and Common App, load the universal issue patterns
  if (essayType === 'supplement' || essayType === 'common_app') {
    try {
      const { ALL_ISSUE_PATTERNS } = await import(
        '../../commonAppWorkshop/rubrics/issueDetectionPatterns'
      );

      const critical = ALL_ISSUE_PATTERNS
        .filter((p: any) => p.severity === 'critical')
        .slice(0, 4);

      if (critical.length === 0) return '';

      const lines = critical.map((p: any) => {
        const phrases = p.detection_phrases?.slice(0, 2).join(', ') ?? '';
        return `[${p.id}] ${p.title}: Watch for: ${phrases}. Why: ${p.why_it_matters?.slice(0, 80) ?? ''}`;
      });

      return `ISSUE PATTERNS (common problems to detect):\n${lines.join('\n')}`;
    } catch { return ''; }
  }

  return '';
}

// ============================================================================
// MAIN ASSEMBLY (updated to include all knowledge layers)
// ============================================================================

/**
 * Assemble all relevant knowledge blocks for a given coaching context.
 * This is the main entry point — called from promptBlocks.ts composition.
 *
 * Returns a combined block (~400-1200 tokens depending on essay type) or empty string.
 */
export async function assembleKnowledgeBlock(ctx: BlockContext): Promise<string> {
  const blocks: string[] = [];

  // Core writing principles — always included (gives the coach expert grounding)
  const principles = await getCorePrinciplesBlock();
  if (principles) blocks.push(principles);

  // Type-specific guidance — only for supplements and activity descriptions
  const typeBlock = await getTypeSpecificBlock(ctx.essayType);
  if (typeBlock) blocks.push(typeBlock);

  // Type weight / excellence criteria — only for supplements
  const weightBlock = await getTypeWeightBlock(ctx.essayType);
  if (weightBlock) blocks.push(weightBlock);

  // PIQ-specific knowledge (prompt metadata, vulnerability coaching, word economy)
  if (ctx.essayType === 'piq') {
    const piqPrompt = await getPIQPromptBlock(ctx.promptText);
    if (piqPrompt) blocks.push(piqPrompt);
    blocks.push(getVulnerabilityCoachingBlock());
    blocks.push(getPIQWordEconomyBlock());
  }

  // Issue detection patterns — loaded per essay type
  const issuePatterns = await getIssuePatternBlock(ctx.essayType);
  if (issuePatterns) blocks.push(issuePatterns);

  // Performative writing detection — always included
  const performative = await getPerformativeIndicatorsBlock();
  if (performative) blocks.push(performative);

  // Banned terms — always included
  blocks.push(getBannedTermsBlock());

  return blocks.length > 0 ? blocks.join('\n\n') : '';
}
