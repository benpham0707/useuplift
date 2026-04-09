/**
 * Teaching Content Router — routes curated teaching content from workshop systems
 * into the Essay Intelligence coaching pipeline.
 *
 * Sources:
 *   - PIQ_TEACHING_EXAMPLES: 21+ weak→strong example pairs (hooks, vulnerability, arc, specificity)
 *   - TELLING_PHRASE_PATTERNS: 33 patterns for zero-cost cliche detection + transformation examples
 *   - TRANSFORMATION_EXAMPLES: 12+ gold-standard before/after transformations by craft move
 *   - NARRATIVE_STRATEGIES: 13 narrative techniques (sensory anchor, in media res, etc.)
 *   - SURGICAL_EXAMPLES: 15 gold-standard before/after with rubricCategory + symptomTags
 *   - ISSUE_DETECTION_PATTERNS: 38 patterns with detection phrases + fix strategies
 *
 * All sources are lazy-loaded and cached after first access. Zero LLM cost —
 * this is pure content routing via keyword/pattern matching.
 *
 * Consumed by: coachingService.ts (buildFindingCoachingContext) and promptBlocks.ts
 */

import type { Finding } from '../profileTypes';

// ============================================================================
// TYPES
// ============================================================================

export interface TeachingContentMatch {
  /** Which source system provided this content */
  source: 'piq_example' | 'telling_phrase' | 'transformation_example'
    | 'narrative_strategy' | 'surgical_example' | 'issue_pattern';
  /** Formatted content ready for prompt injection */
  content: string;
  /** Estimated token count for budget tracking */
  tokenEstimate: number;
  /** Match quality 0-1 (higher = more relevant) */
  relevance: number;
}

// ============================================================================
// LAZY-LOADED CACHES
// ============================================================================

let piqExamplesCache: any[] | null = null;
let tellingPhrasesCache: Record<string, string[]> | null = null;
let transformationExamplesCache: any[] | null = null;
let narrativeStrategiesCache: any[] | null = null;
let surgicalExamplesCache: any[] | null = null;
let issuePatternsCacheLoaded = false;
let issuePatternsDetectFn: ((text: string) => string[]) | null = null;
let issuePatternLookupFn: ((id: string) => any | undefined) | null = null;

async function loadPIQExamples(): Promise<any[]> {
  if (piqExamplesCache) return piqExamplesCache;
  const { PIQ_TEACHING_EXAMPLES } = await import('../../piq/teachingExamples');
  piqExamplesCache = PIQ_TEACHING_EXAMPLES;
  return piqExamplesCache;
}

async function loadTellingPhrases(): Promise<Record<string, string[]>> {
  if (tellingPhrasesCache) return tellingPhrasesCache;
  const { TELLING_PHRASE_PATTERNS } = await import(
    '../../commonAppWorkshop/data/transformationExamples'
  );
  tellingPhrasesCache = TELLING_PHRASE_PATTERNS;
  return tellingPhrasesCache;
}

async function loadTransformationExamples(): Promise<any[]> {
  if (transformationExamplesCache) return transformationExamplesCache;
  const { TRANSFORMATION_EXAMPLES } = await import(
    '../../commonAppWorkshop/data/transformationExamples'
  );
  transformationExamplesCache = TRANSFORMATION_EXAMPLES;
  return transformationExamplesCache;
}

async function loadNarrativeStrategies(): Promise<any[]> {
  if (narrativeStrategiesCache) return narrativeStrategiesCache;
  const { NARRATIVE_STRATEGIES } = await import(
    '../../narrativeWorkshop/strategies'
  );
  narrativeStrategiesCache = NARRATIVE_STRATEGIES;
  return narrativeStrategiesCache;
}

async function loadSurgicalExamples(): Promise<any[]> {
  if (surgicalExamplesCache) return surgicalExamplesCache;
  const { SURGICAL_EXAMPLES } = await import(
    '../../narrativeWorkshop/surgicalExamples'
  );
  surgicalExamplesCache = SURGICAL_EXAMPLES;
  return surgicalExamplesCache;
}

async function loadIssuePatternDetection(): Promise<{
  detect: (text: string) => string[];
  lookup: (id: string) => any | undefined;
}> {
  if (issuePatternsCacheLoaded && issuePatternsDetectFn && issuePatternLookupFn) {
    return { detect: issuePatternsDetectFn, lookup: issuePatternLookupFn };
  }
  const { detectPhrasePatterns, getPatternById } = await import(
    '../../commonAppWorkshop/rubrics/issueDetectionPatterns'
  );
  issuePatternsDetectFn = detectPhrasePatterns;
  issuePatternLookupFn = getPatternById;
  issuePatternsCacheLoaded = true;
  return { detect: detectPhrasePatterns, lookup: getPatternById };
}

// ============================================================================
// PIQ TEACHING EXAMPLE MATCHING
// ============================================================================

/**
 * Keyword map: finding claim keywords → PIQ issue types.
 * When a finding's claim text contains these keywords, we match to the
 * corresponding PIQ issue type and inject the curated weak→strong example.
 */
const CLAIM_TO_PIQ_ISSUE: Array<{ keywords: string[]; issueType: string }> = [
  // Hook issues (4 examples in PIQ corpus)
  { keywords: ['generic opening', 'template opening', 'weak hook', 'could be anyone'], issueType: 'hook-weak-generic' },
  { keywords: ['missing stakes', 'no stakes', 'stakes absent', 'no tension'], issueType: 'hook-missing-stakes' },
  { keywords: ['summary mode', 'summary', 'narrates from', 'operates in summary', '30,000 feet'], issueType: 'hook-weak-generic' },

  // Vulnerability issues (6 examples in PIQ corpus)
  { keywords: ['manufactured', 'forced vulnerability', 'performative', 'talking about vulnerability'], issueType: 'vuln-manufactured-phrases' },
  { keywords: ['defensive retreat', 'but i learned', 'retreats to safety', 'but then'], issueType: 'vuln-defensive-retreat' },
  { keywords: ['surface emotion', 'emotion label', 'named emotion', 'minimal vulnerability', 'level 1'], issueType: 'vuln-level-1-minimal' },
  { keywords: ['transformation imposed', 'sudden growth', 'too neat', 'and then i realized', 'epiphany'], issueType: 'vuln-transformation-imposed' },
  { keywords: ['no specific failure', 'vague challenge', 'general difficulty', 'challenges generally'], issueType: 'vuln-no-specific-failure' },

  // Arc issues (5 examples in PIQ corpus)
  { keywords: ['flat narrative', 'no conflict', 'no tension', 'chronological list'], issueType: 'arc-flat-no-conflict' },
  { keywords: ['no turning point', 'missing arc', 'no pivot', 'no shift'], issueType: 'arc-no-turning-point' },
  { keywords: ['summary not scene', 'telling not showing', 'narrates instead'], issueType: 'arc-summary-not-scene' },
  { keywords: ['too neat', 'convenient resolution', 'wrapped up', 'tidy ending'], issueType: 'arc-too-neat-resolved' },
  { keywords: ['unclear stakes', 'why should we care', 'no consequences', 'low stakes'], issueType: 'arc-unclear-stakes' },

  // Specificity issues (5 examples in PIQ corpus)
  { keywords: ['no numbers', 'no data', 'no metrics', 'no quantities', 'name-drop'], issueType: 'spec-no-numbers' },
  { keywords: ['missing sensory', 'no physical detail', 'abstract', 'no texture'], issueType: 'spec-missing-sensory' },
  { keywords: ['vague description', 'generic detail', 'could be anyone', 'no specifics'], issueType: 'spec-vague-descriptions' },
  { keywords: ['no time', 'no when', 'timeless', 'no temporal', 'undated'], issueType: 'spec-no-time-specificity' },
];

/**
 * Match a finding to a PIQ teaching example.
 * Returns a formatted weak→strong example block if a match is found.
 */
async function matchPIQExample(finding: Finding): Promise<TeachingContentMatch | null> {
  const claimLower = finding.claim.toLowerCase();

  // Find matching issue type by keyword scan
  let matchedIssueType: string | null = null;
  let bestKeywordCount = 0;

  for (const mapping of CLAIM_TO_PIQ_ISSUE) {
    const hitCount = mapping.keywords.filter(kw => claimLower.includes(kw)).length;
    if (hitCount > bestKeywordCount) {
      bestKeywordCount = hitCount;
      matchedIssueType = mapping.issueType;
    }
  }

  // Require at least 1 keyword match. For ambiguous single-keyword matches,
  // use lower relevance so more precise matches win in the ranking.
  if (!matchedIssueType || bestKeywordCount === 0) return null;

  const examples = await loadPIQExamples();
  const match = examples.find((ex: any) => ex.issueType === matchedIssueType);
  if (!match) return null;

  const content =
    `TEACHING EXAMPLE (${match.principle}):\n` +
    `  WEAK: "${match.weakExample}"\n` +
    `  STRONG: "${match.strongExample}"\n` +
    `  WHY: ${match.explanation}`;

  return {
    source: 'piq_example',
    content,
    tokenEstimate: Math.ceil(content.length / 4),
    // 2+ keyword hits = confident match, 1 hit = tentative (may be a false positive)
    relevance: bestKeywordCount >= 2 ? 0.9 : 0.55,
    // Semantic key for cross-source dedup: the matched issue category
    _issueCategory: matchedIssueType,
  } as TeachingContentMatch;
}

// ============================================================================
// TELLING PHRASE DETECTION (ZERO LLM COST)
// ============================================================================

/**
 * Scan essay text for telling phrases and return matched transformation examples.
 * Pure string matching — no LLM calls. Returns matches with the category that
 * triggered them so the coach can name the pattern.
 */
export async function detectTellingPhrases(
  essayText: string,
  maxMatches: number = 3,
): Promise<TeachingContentMatch[]> {
  const patterns = await loadTellingPhrases();
  const transformations = await loadTransformationExamples();
  const textLower = essayText.toLowerCase();
  const matches: TeachingContentMatch[] = [];

  // Category → craft move mapping for finding relevant transformation examples
  const CATEGORY_CRAFT_MAP: Record<string, string> = {
    growth_claims: 'active_verbs',
    passion_claims: 'sensory_details',
    character_claims: 'specific_names',
    emotion_labels: 'emotional_physical',
    impact_claims: 'statistics_data',
  };

  for (const [category, phrases] of Object.entries(patterns)) {
    for (const phrase of phrases) {
      if (textLower.includes(phrase.toLowerCase())) {
        // Find a transformation example that matches this category's craft move
        const craftMove = CATEGORY_CRAFT_MAP[category];
        const example = craftMove
          ? transformations.find((ex: any) => ex.primaryCraftMove === craftMove)
          : null;

        let content = `TELLING PHRASE DETECTED: "${phrase}" (${category.replace(/_/g, ' ')})`;
        if (example) {
          content +=
            `\n  BEFORE: "${example.before.text}"` +
            `\n  AFTER: "${example.after.text}"` +
            `\n  TECHNIQUE: ${example.primaryCraftMove.replace(/_/g, ' ')}`;
        }

        matches.push({
          source: 'telling_phrase',
          content,
          tokenEstimate: Math.ceil(content.length / 4),
          relevance: 0.8,
        });

        if (matches.length >= maxMatches) return matches;
        break; // One match per category is enough
      }
    }
  }

  return matches;
}

// ============================================================================
// NARRATIVE STRATEGY MATCHING
// ============================================================================

/**
 * Finding dimension → rubric affinity mapping.
 * Maps Essay Intelligence dimension names to Narrative Workshop rubric_affinity tags
 * so we can route findings to the right narrative strategies.
 */
const DIMENSION_TO_RUBRIC_AFFINITY: Record<string, string[]> = {
  voice: ['originality_specificity_voice', 'show_dont_tell_craft'],
  emotion: ['character_interiority_vulnerability', 'show_dont_tell_craft'],
  narrative: ['narrative_arc_stakes_turn', 'structure_pacing_coherence'],
  opening: ['opening_power_scene_entry'],
  reflection: ['reflection_meaning_making', 'ethical_awareness_humility'],
  specificity: ['show_dont_tell_craft', 'dialogue_action_texture'],
  intellectual: ['intellectual_vitality_curiosity'],
  growth: ['personal_growth_trajectory', 'reflection_meaning_making'],
  craft: ['show_dont_tell_craft', 'dialogue_action_texture'],
};

/**
 * Match a finding to a narrative strategy based on dimension affinity.
 * Returns the strategy's name, instruction, and example concept.
 */
async function matchNarrativeStrategy(finding: Finding): Promise<TeachingContentMatch | null> {
  const strategies = await loadNarrativeStrategies();
  if (strategies.length === 0) return null;

  // Collect rubric affinities from finding dimensions
  const targetAffinities = new Set<string>();
  for (const dim of finding.dimensions) {
    const affinities = DIMENSION_TO_RUBRIC_AFFINITY[dim.toLowerCase()];
    if (affinities) affinities.forEach(a => targetAffinities.add(a));
  }

  // Also check claim text for common patterns
  const claimLower = finding.claim.toLowerCase();
  if (claimLower.includes('show') || claimLower.includes('telling')) {
    targetAffinities.add('show_dont_tell_craft');
  }
  if (claimLower.includes('opening') || claimLower.includes('hook')) {
    targetAffinities.add('opening_power_scene_entry');
  }
  if (claimLower.includes('arc') || claimLower.includes('stakes')) {
    targetAffinities.add('narrative_arc_stakes_turn');
  }

  if (targetAffinities.size === 0) return null;

  // Score strategies by affinity overlap
  let bestStrategy: any = null;
  let bestScore = 0;
  for (const strategy of strategies) {
    const score = strategy.rubric_affinity.filter(
      (a: string) => targetAffinities.has(a)
    ).length;
    if (score > bestScore) {
      bestScore = score;
      bestStrategy = strategy;
    }
  }

  if (!bestStrategy || bestScore === 0) return null;

  const content =
    `NARRATIVE TECHNIQUE — ${bestStrategy.name.toUpperCase()}:\n` +
    `  ${bestStrategy.instruction}\n` +
    `  EXAMPLE: ${bestStrategy.example_concept}`;

  return {
    source: 'narrative_strategy',
    content,
    tokenEstimate: Math.ceil(content.length / 4),
    relevance: bestScore >= 2 ? 0.85 : 0.65,
  };
}

// ============================================================================
// SURGICAL EXAMPLE MATCHING
// ============================================================================

/**
 * Finding dimension → surgical example rubricCategory mapping.
 */
const DIMENSION_TO_RUBRIC_CATEGORY: Record<string, string> = {
  voice: 'originality_specificity_voice',
  emotion: 'character_interiority_vulnerability',
  narrative: 'narrative_arc_stakes_turn',
  craft: 'show_dont_tell_craft',
  specificity: 'show_dont_tell_craft',
  reflection: 'reflection_meaning_making',
  intellectual: 'intellectual_vitality_curiosity',
  structure: 'structure_pacing_flow',
};

/**
 * Finding claim keywords → symptom tags for surgical example matching.
 */
const CLAIM_TO_SYMPTOM: Array<{ keywords: string[]; symptom: string }> = [
  { keywords: ['abstract', 'vague', 'generic'], symptom: 'abstract_language' },
  { keywords: ['telling', 'show', 'label'], symptom: 'telling_not_showing' },
  { keywords: ['cliche', 'template', 'overused'], symptom: 'cliche_metaphor' },
  { keywords: ['passive', 'agency', 'weak verb'], symptom: 'weak_verb' },
  { keywords: ['pacing', 'flat', 'monotonous'], symptom: 'generic_pacing' },
];

/**
 * Match a finding to a surgical example (gold-standard before/after).
 * Uses rubricCategory + symptomTags for precise matching.
 */
async function matchSurgicalExample(finding: Finding): Promise<TeachingContentMatch | null> {
  const examples = await loadSurgicalExamples();
  if (examples.length === 0) return null;

  const claimLower = finding.claim.toLowerCase();

  // Determine target rubric category from finding dimensions
  let targetCategory: string | null = null;
  for (const dim of finding.dimensions) {
    const cat = DIMENSION_TO_RUBRIC_CATEGORY[dim.toLowerCase()];
    if (cat) { targetCategory = cat; break; }
  }

  // Determine target symptom from claim keywords
  let targetSymptom: string | null = null;
  for (const mapping of CLAIM_TO_SYMPTOM) {
    if (mapping.keywords.some(kw => claimLower.includes(kw))) {
      targetSymptom = mapping.symptom;
      break;
    }
  }

  if (!targetCategory && !targetSymptom) return null;

  // Score examples by category match + symptom match
  let bestExample: any = null;
  let bestScore = 0;

  for (const example of examples) {
    let score = 0;
    if (targetCategory && example.rubricCategory === targetCategory) score += 2;
    if (targetSymptom && example.symptomTags?.includes(targetSymptom)) score += 3;
    if (score > bestScore) {
      bestScore = score;
      bestExample = example;
    }
  }

  if (!bestExample || bestScore === 0) return null;

  const content =
    `SURGICAL EXAMPLE (${bestExample.strategyUsed}):\n` +
    `  BEFORE: "${bestExample.original}"\n` +
    `  PROBLEM: ${bestExample.problem}\n` +
    `  AFTER: "${bestExample.fix}"\n` +
    `  WHY IT WORKS: ${bestExample.rationale}`;

  return {
    source: 'surgical_example',
    content,
    tokenEstimate: Math.ceil(content.length / 4),
    relevance: bestScore >= 3 ? 0.9 : 0.7,
  };
}

// ============================================================================
// ISSUE PATTERN PRE-SCAN (ZERO LLM COST)
// ============================================================================

/**
 * Scan essay text against 38 CommonApp issue detection patterns.
 * Uses the battle-tested detectPhrasePatterns() function which does phrase +
 * regex matching with essay-type awareness.
 *
 * Returns the most critical matched patterns with problem descriptions,
 * why they matter for admissions, and specific fix strategies.
 */
export async function detectIssuePatterns(
  essayText: string,
  maxMatches: number = 3,
): Promise<TeachingContentMatch[]> {
  const { detect, lookup } = await loadIssuePatternDetection();
  const matchedIds = detect(essayText);
  const matches: TeachingContentMatch[] = [];

  // Sort by severity: critical first
  const SEVERITY_ORDER: Record<string, number> = { critical: 0, major: 1, minor: 2 };
  const sortedIds = matchedIds
    .map(id => ({ id, pattern: lookup(id) }))
    .filter(({ pattern }) => pattern != null)
    .sort((a, b) =>
      (SEVERITY_ORDER[a.pattern.severity] ?? 3) - (SEVERITY_ORDER[b.pattern.severity] ?? 3)
    );

  for (const { pattern } of sortedIds) {
    if (matches.length >= maxMatches) break;

    let content =
      `ISSUE DETECTED [${pattern.severity.toUpperCase()}] — ${pattern.name}:\n` +
      `  ${pattern.problem_description}\n` +
      `  AO PERSPECTIVE: ${pattern.why_it_matters}`;

    // Include before/after if available
    if (pattern.example_before && pattern.example_after) {
      content +=
        `\n  BEFORE: "${pattern.example_before}"` +
        `\n  AFTER: "${pattern.example_after}"`;
    }

    // Include top 2 fix suggestions
    if (pattern.fix_suggestions?.length > 0) {
      const fixes = pattern.fix_suggestions.slice(0, 2).map((f: string) => `  - ${f}`).join('\n');
      content += `\n  FIXES:\n${fixes}`;
    }

    matches.push({
      source: 'issue_pattern',
      content,
      tokenEstimate: Math.ceil(content.length / 4),
      relevance: pattern.severity === 'critical' ? 0.95 : pattern.severity === 'major' ? 0.8 : 0.6,
    });
  }

  return matches;
}

// ============================================================================
// UNIFIED ROUTER
// ============================================================================

/**
 * Route teaching content for a finding — tries all finding-based sources:
 * PIQ examples, narrative strategies, and surgical examples.
 * Returns the best match (highest relevance).
 */
export async function routeTeachingContent(
  finding: Finding,
): Promise<TeachingContentMatch | null> {
  // Run all finding-based matchers in parallel
  const [piq, strategy, surgical] = await Promise.all([
    matchPIQExample(finding),
    matchNarrativeStrategy(finding),
    matchSurgicalExample(finding),
  ]);

  // Return the highest-relevance match (or null if none matched)
  const candidates = [piq, strategy, surgical].filter(
    (m): m is TeachingContentMatch => m !== null
  );

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.relevance - a.relevance);
  return candidates[0];
}

/**
 * Get all teaching content matches for a set of findings + essay text.
 * Returns deduplicated, relevance-sorted matches within a token budget.
 *
 * Quality rules:
 *   - At most 3 teaching content items per turn (prevent flooding)
 *   - Finding-based sources compete — only the BEST match per finding survives
 *   - Text-based detection scoped to provided essay text (caller should scope)
 *   - Cross-source dedup: if a PIQ example and surgical example both address
 *     "telling not showing," only the highest-relevance one is kept
 *   - Telling phrase and issue pattern detection limited to 2 each
 *
 * @param findings - Active findings to match against teaching content
 * @param essayText - Essay text to scan (should be scoped to focus paragraphs)
 * @param maxTokens - Token budget for teaching content (default 800)
 */
export async function getTeachingContentForContext(
  findings: Finding[],
  essayText: string,
  maxTokens: number = 800,
): Promise<TeachingContentMatch[]> {
  // Run all detection streams in parallel
  const [findingMatches, tellingMatches, issueMatches] = await Promise.all([
    Promise.all(findings.map(f => routeTeachingContent(f))),
    detectTellingPhrases(essayText, 2),  // cap at 2 (was 3)
    detectIssuePatterns(essayText, 2),   // cap at 2 (was 3)
  ]);

  // Semantic dedup: track which CATEGORIES of content we've already included.
  // A "telling not showing" match from PIQ should block a "telling not showing"
  // match from surgical examples — they teach the same lesson.
  const allMatches: TeachingContentMatch[] = [];
  const seenCategories = new Set<string>();

  const addMatch = (match: TeachingContentMatch | null) => {
    if (!match) return;

    // Extract semantic category from content for cross-source dedup
    // Use the first meaningful phrase (technique name, pattern name, or principle)
    const categoryKey = extractSemanticCategory(match);
    if (seenCategories.has(categoryKey)) return;

    seenCategories.add(categoryKey);
    allMatches.push(match);
  };

  // Finding-based matches first (these are the most contextually relevant)
  for (const match of findingMatches) addMatch(match);
  // Text-based detection next (telling phrases, issue patterns)
  for (const match of tellingMatches) addMatch(match);
  for (const match of issueMatches) addMatch(match);

  // Sort by relevance (highest first), cap at 3 items, trim to token budget
  allMatches.sort((a, b) => b.relevance - a.relevance);

  const result: TeachingContentMatch[] = [];
  let tokenCount = 0;
  for (const match of allMatches) {
    if (result.length >= 3) break;  // hard cap: 3 items max
    if (tokenCount + match.tokenEstimate > maxTokens) break;
    result.push(match);
    tokenCount += match.tokenEstimate;
  }

  return result;
}

/**
 * Extract a semantic category key from a teaching content match for dedup.
 * Groups content by WHAT it teaches, not WHERE it came from.
 */
function extractSemanticCategory(match: TeachingContentMatch): string {
  const contentLower = match.content.toLowerCase();

  // Check for common teaching categories
  if (contentLower.includes('telling') || contentLower.includes('show')) return 'show_dont_tell';
  if (contentLower.includes('hook') || contentLower.includes('opening')) return 'opening';
  if (contentLower.includes('vulnerability') || contentLower.includes('emotion')) return 'vulnerability';
  if (contentLower.includes('arc') || contentLower.includes('stakes') || contentLower.includes('tension')) return 'narrative_arc';
  if (contentLower.includes('specific') || contentLower.includes('sensory') || contentLower.includes('detail')) return 'specificity';
  if (contentLower.includes('voice') || contentLower.includes('authentic')) return 'voice';
  if (contentLower.includes('reflection') || contentLower.includes('insight')) return 'reflection';
  if (contentLower.includes('swap test') || contentLower.includes('college-specific')) return 'college_fit';
  if (contentLower.includes('essay-speak') || contentLower.includes('template')) return 'essay_speak';
  if (contentLower.includes('generic') || contentLower.includes('cliche')) return 'generic_language';

  // Fallback: use source + first 30 chars
  return `${match.source}:${match.content.slice(0, 30)}`;
}
