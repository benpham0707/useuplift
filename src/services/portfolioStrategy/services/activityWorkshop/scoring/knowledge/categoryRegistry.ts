/**
 * Knowledge Base — Category Registry
 *
 * Composes CategoryKnowledge objects from TWO existing data sources:
 *   1. ACHIEVEMENT_DATABASE (achievementIntelligence.ts) — calibration benchmarks
 *   2. EXPERTISE_DOMAINS (expertiseSignaling/) — expertise patterns & AO expectations
 *
 * This is a composition layer, NOT a data duplication layer. The raw data stays
 * in its original location. The registry provides a unified view.
 *
 * Cost: $0.00 (pure data composition at module load)
 * Latency: <1ms per lookup
 */

import { ACHIEVEMENT_DATABASE } from '../achievementIntelligence';
import { EXPERTISE_DOMAINS } from '../expertiseSignaling';
import type { CategoryKnowledge, CategoryResolution } from './types';
import type { SubcategoryProfile } from '../nuanceCalibrationTypes';

// ============================================================================
// CATEGORY-TO-EXPERTISE DOMAIN MAPPING
// ============================================================================

/**
 * Maps ACHIEVEMENT_DATABASE category keys to EXPERTISE_DOMAINS domain IDs.
 * Not all categories have expertise domains — some are calibration-only.
 */
const CATEGORY_TO_EXPERTISE: Record<string, string | null> = {
  stem_research: 'stem_research',
  stem_competition: 'stem_competition',
  debate_speech: 'debate_speech',
  performing_arts: 'performing_arts',
  athletics: 'athletics',
  community_service: 'community_service',
  leadership_government: 'leadership_government',
  technology: 'coding_engineering',
  writing_journalism: 'writing_journalism',
  entrepreneurship: 'entrepreneurship',
  academic_enrichment: 'academic',
  visual_arts: 'visual_arts',
  medical_health: 'medical_health',               // domain exists in expertiseSignaling
  social_activism: null,                         // no expertise domain
  work_family: 'work_employment',
  religious_cultural: null,                      // no expertise domain
  international: null,                           // no expertise domain
  media_digital: null,                           // no expertise domain
};

/**
 * Category aliases — alternative names that map to canonical category IDs.
 */
const CATEGORY_ALIASES: Record<string, string> = {
  // STEM Research
  'research': 'stem_research',
  'lab': 'stem_research',
  'science_research': 'stem_research',
  // STEM Competitions
  'competition': 'stem_competition',
  'math_competition': 'stem_competition',
  'olympiad': 'stem_competition',
  // Debate & Speech
  'debate': 'debate_speech',
  'speech': 'debate_speech',
  'forensics': 'debate_speech',
  'model_un': 'debate_speech',
  'mun': 'debate_speech',
  'mock_trial': 'debate_speech',
  // Performing Arts
  'music': 'performing_arts',
  'theater': 'performing_arts',
  'theatre': 'performing_arts',
  'dance': 'performing_arts',
  'arts': 'performing_arts',
  'arts_creative': 'performing_arts',
  // Athletics
  'sports': 'athletics',
  'sport': 'athletics',
  // Community Service
  'volunteer': 'community_service',
  'volunteering': 'community_service',
  'nonprofit': 'community_service',
  'tutoring': 'community_service',
  // Leadership & Government
  'government': 'leadership_government',
  'student_government': 'leadership_government',
  'leadership': 'leadership_government',
  // Technology & Software
  'coding': 'technology',
  'coding_engineering': 'technology',
  'engineering': 'technology',
  'robotics': 'technology',
  'programming': 'technology',
  'hackathon': 'technology',
  'hackathons_innovation': 'technology',
  // Academic Enrichment
  'academic': 'academic_enrichment',
  'honor_society': 'academic_enrichment',
  'club': 'academic_enrichment',
  // Visual Arts
  'visual_arts_design': 'visual_arts',
  'design': 'visual_arts',
  'art': 'visual_arts',
  // Writing & Journalism
  'writing': 'writing_journalism',
  'journalism': 'writing_journalism',
  'newspaper': 'writing_journalism',
  // Work & Family
  'work': 'work_family',
  'job': 'work_family',
  'employment': 'work_family',
  'work_employment': 'work_family',
  'internship': 'work_family',
  'internships_work': 'work_family',
  'family': 'work_family',
  'caretaking': 'work_family',
  'sibling_care': 'work_family',
  'family_responsibility': 'work_family',
  // Entrepreneurship
  'startup': 'entrepreneurship',
  'business': 'entrepreneurship',
  'founder': 'entrepreneurship',
  // Religious & Cultural
  'religion': 'religious_cultural',
  'religious_spiritual': 'religious_cultural',
  'church': 'religious_cultural',
  'mosque': 'religious_cultural',
  'temple': 'religious_cultural',
  'faith': 'religious_cultural',
  // Medical & Health
  'medical': 'medical_health',
  'health': 'medical_health',
  'hospital': 'medical_health',
  // Social Activism
  'activism': 'social_activism',
  'advocacy': 'social_activism',
  // International
  'exchange': 'international',
  'study_abroad': 'international',
  // Media & Digital
  'media': 'media_digital',
  'podcast': 'media_digital',
  'youtube': 'media_digital',
  'content_creation': 'media_digital',
  'gaming': 'media_digital',
  'hobby': 'media_digital',
  'esports': 'media_digital',
  // Fallback
  'other': 'academic_enrichment',
};

// ============================================================================
// CATEGORY KNOWLEDGE REGISTRY
// ============================================================================

/** Pre-built registry of all CategoryKnowledge objects */
const _registry: Map<string, CategoryKnowledge> = new Map();

/** Keyword → category ID index for fast matching */
const _keywordIndex: Map<string, string[]> = new Map();

/**
 * Build a CategoryKnowledge from an achievement category + expertise domain.
 */
function buildCategoryKnowledge(
  categoryId: string,
): CategoryKnowledge {
  const achievement = ACHIEVEMENT_DATABASE[categoryId];
  if (!achievement) {
    throw new Error(`[KB] Unknown category: ${categoryId}`);
  }

  const expertiseDomainId = CATEGORY_TO_EXPERTISE[categoryId] ?? null;
  const expertiseDomain = expertiseDomainId
    ? EXPERTISE_DOMAINS.get(expertiseDomainId) ?? null
    : null;

  // C3c: work_family merges expertise from BOTH work_employment AND family_responsibility
  const secondaryDomain = categoryId === 'work_family'
    ? EXPERTISE_DOMAINS.get('family_responsibility') ?? null
    : null;

  // Collect aliases for this category
  const aliases = Object.entries(CATEGORY_ALIASES)
    .filter(([, catId]) => catId === categoryId)
    .map(([alias]) => alias);

  return {
    categoryId,
    label: achievement.label,
    keywords: achievement.keywords,
    aliases,
    expertiseDomainId,

    // Achievement/calibration data
    subcategories: achievement.subcategories,
    achievementLadder: achievement.achievementLadder,
    roleHierarchy: achievement.roleHierarchy,
    tiers: achievement.tiers,

    // Expertise/teaching data (null/empty if no domain)
    // For work_family: primary AO expectations from work_employment, signals merged from both
    aoExpectations: expertiseDomain?.aoExpectations ?? null,
    realExpertiseSignals: [
      ...(expertiseDomain?.realExpertiseSignals ?? []),
      ...(secondaryDomain?.realExpertiseSignals ?? []),
    ],
    nameDropTraps: [
      ...(expertiseDomain?.nameDropTraps ?? []),
      ...(secondaryDomain?.nameDropTraps ?? []),
    ],
    proofOfWorkPatterns: [
      ...(expertiseDomain?.proofOfWorkPatterns ?? []),
      ...(secondaryDomain?.proofOfWorkPatterns ?? []),
    ],
    descriptionTransforms: [
      ...(expertiseDomain?.descriptionTransforms ?? []),
      ...(secondaryDomain?.descriptionTransforms ?? []),
    ],
    verbHierarchy: expertiseDomain?.verbHierarchy ?? [],
    roleExpertise: [
      ...(expertiseDomain?.roleExpertise ?? []),
      ...(secondaryDomain?.roleExpertise ?? []),
    ],
    jargonExceptions: [
      ...(expertiseDomain?.jargonExceptions ?? []),
      ...(secondaryDomain?.jargonExceptions ?? []),
    ],
  };
}

/**
 * Build the keyword index for fast category matching.
 */
function buildKeywordIndex(): void {
  for (const [categoryId, category] of _registry) {
    for (const keyword of category.keywords) {
      const lower = keyword.toLowerCase();
      if (!_keywordIndex.has(lower)) {
        _keywordIndex.set(lower, []);
      }
      _keywordIndex.get(lower)!.push(categoryId);
    }
  }
}

/**
 * Initialize the registry by composing from both data sources.
 */
function initializeRegistry(): void {
  for (const categoryId of Object.keys(ACHIEVEMENT_DATABASE)) {
    _registry.set(categoryId, buildCategoryKnowledge(categoryId));
  }
  buildKeywordIndex();
}

// Initialize on module load
initializeRegistry();

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get a category by its canonical ID.
 */
export function getCategory(categoryId: string): CategoryKnowledge | undefined {
  return _registry.get(categoryId);
}

/**
 * Get a category by alias or canonical ID.
 */
export function getCategoryByAlias(nameOrAlias: string): CategoryKnowledge | undefined {
  const lower = nameOrAlias.toLowerCase().trim();

  // Direct match
  const direct = _registry.get(lower);
  if (direct) return direct;

  // Alias match
  const aliasTarget = CATEGORY_ALIASES[lower];
  if (aliasTarget) return _registry.get(aliasTarget);

  return undefined;
}

/**
 * Resolve a category from keywords in a description, activity type, or other text.
 * Returns the best-matching category with confidence.
 */
export function resolveCategory(
  text: string,
  activityType?: string,
  role?: string,
): CategoryResolution | null {
  const searchText = `${text} ${activityType ?? ''} ${role ?? ''}`.toLowerCase();

  // 1. Try exact activity type match
  if (activityType) {
    const typeMatch = getCategoryByAlias(activityType);
    if (typeMatch) {
      // Log when 'other' category silently resolves to academic_enrichment
      if (activityType.toLowerCase() === 'other') {
        console.warn(`[KB] resolveCategory: 'other' category resolved to '${typeMatch.categoryId}' via alias — activity may be miscategorized. Text: "${text.substring(0, 60)}..."`);
      }
      const subcategory = resolveSubcategory(typeMatch, searchText);
      return {
        category: typeMatch,
        confidence: 'high',
        matchType: 'alias',
        matchedTerm: activityType,
        subcategory,
      };
    }
  }

  // 2. Keyword matching — score each category by keyword hits
  const scores: Array<{ categoryId: string; score: number; matchedTerm: string }> = [];

  for (const [keyword, categoryIds] of _keywordIndex) {
    if (searchText.includes(keyword)) {
      for (const categoryId of categoryIds) {
        const existing = scores.find(s => s.categoryId === categoryId);
        if (existing) {
          existing.score += keyword.length; // longer keywords = more specific
        } else {
          scores.push({ categoryId, score: keyword.length, matchedTerm: keyword });
        }
      }
    }
  }

  if (scores.length === 0) {
    // M5: Telemetry on resolution failures (truncated for privacy)
    const truncated = searchText.length > 60 ? searchText.substring(0, 60) + '...' : searchText;
    console.warn(`[KB] resolveCategory: no match for "${truncated}"`);
    return null;
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];
  const category = _registry.get(best.categoryId)!;
  const subcategory = resolveSubcategory(category, searchText);

  // Confidence based on score gap and hit count
  const confidence: 'high' | 'medium' | 'low' =
    best.score >= 20 ? 'high' :
    best.score >= 10 ? 'medium' :
    'low';

  return {
    category,
    confidence,
    matchType: 'keyword',
    matchedTerm: best.matchedTerm,
    subcategory,
  };
}

/**
 * Resolve subcategory within a category based on text content.
 */
function resolveSubcategory(
  category: CategoryKnowledge,
  searchText: string,
): SubcategoryProfile | null {
  let bestSub: SubcategoryProfile | null = null;
  let bestScore = 0;

  for (const sub of category.subcategories) {
    let score = 0;
    for (const keyword of sub.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        score += keyword.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestSub = sub;
    }
  }

  return bestSub;
}

/**
 * Get all categories in the registry.
 */
export function getAllCategories(): CategoryKnowledge[] {
  return Array.from(_registry.values());
}

/**
 * Get all category IDs.
 */
export function getAllCategoryIds(): string[] {
  return Array.from(_registry.keys());
}

/**
 * Get the category keyword index for external use.
 */
export function getCategoryKeywordIndex(): ReadonlyMap<string, string[]> {
  return _keywordIndex;
}

/**
 * Get category count.
 */
export function getCategoryCount(): number {
  return _registry.size;
}

/**
 * Get all category aliases.
 */
export function getCategoryAliases(): Readonly<Record<string, string>> {
  return CATEGORY_ALIASES;
}

// ============================================================================
// SIMILAR DOMAINS MAP
// ============================================================================

/**
 * Maps each canonical category to its 2-3 most similar domains.
 * Used for proxy-based calibration fallback when no direct match exists.
 * Order matters — first entry is the closest proxy.
 */
const SIMILAR_DOMAINS_MAP: Record<string, string[]> = {
  stem_research:        ['stem_competition', 'technology', 'medical_health'],
  stem_competition:     ['stem_research', 'academic_enrichment', 'technology'],
  debate_speech:        ['leadership_government', 'writing_journalism', 'academic_enrichment'],
  performing_arts:      ['visual_arts', 'writing_journalism', 'media_digital'],
  athletics:            ['leadership_government', 'community_service'],
  community_service:    ['leadership_government', 'social_activism', 'medical_health'],
  leadership_government:['community_service', 'debate_speech', 'entrepreneurship'],
  technology:           ['stem_research', 'stem_competition', 'entrepreneurship'],
  writing_journalism:   ['performing_arts', 'visual_arts', 'media_digital'],
  entrepreneurship:     ['technology', 'leadership_government', 'work_family'],
  academic_enrichment:  ['stem_research', 'stem_competition', 'debate_speech'],
  visual_arts:          ['performing_arts', 'writing_journalism', 'media_digital'],
  medical_health:       ['stem_research', 'community_service'],
  social_activism:      ['community_service', 'leadership_government'],
  work_family:          ['community_service', 'entrepreneurship'],
  religious_cultural:   ['community_service', 'social_activism'],
  international:        ['leadership_government', 'community_service', 'academic_enrichment'],
  media_digital:        ['writing_journalism', 'visual_arts', 'entrepreneurship'],
};

/**
 * Get the similar/proxy domains for a given category.
 * Returns an empty array if the category is unknown.
 */
export function getSimilarDomains(categoryId: string): string[] {
  return SIMILAR_DOMAINS_MAP[categoryId] ?? [];
}
