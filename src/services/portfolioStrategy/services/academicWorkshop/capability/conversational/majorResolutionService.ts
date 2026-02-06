/**
 * Major Resolution Service
 *
 * Smart, efficient system for resolving student interest strings to
 * the correct MajorSpecificExpectation entries with hierarchical
 * parent-child merging.
 *
 * DESIGN PRINCIPLES:
 * 1. O(1) lookups via pre-built index (not linear scans)
 * 2. Hierarchical resolution: child entries inherit from parent
 * 3. Fuzzy matching: handles typos, abbreviations, informal names
 * 4. Targeted context assembly: returns ONLY relevant data, not everything
 * 5. Single source of truth: index built from MAJOR_EXPECTATIONS array
 */

import {
  MAJOR_EXPECTATIONS,
  type MajorSpecificExpectation,
} from './collegeExpectationsDatabase';

import {
  getCoursesForMajor,
  type APCourseProfile,
} from './academicCourseKnowledgeBase';

import {
  AP_EXAM_STATISTICS,
  VERIFIED_GUIDANCE,
  type VerifiedDataPoint,
} from './academicResearchFoundation';

// ============================================================================
// TYPES
// ============================================================================

export interface ResolvedMajor {
  /** The directly matched entry */
  matched: MajorSpecificExpectation;

  /** The parent entry (if matched is a specialization) */
  parent?: MajorSpecificExpectation;

  /** Merged requirements: parent base + child additions */
  mergedRequirements: {
    minimum: string[];
    competitive: string[];
    exceptional: string[];
  };

  /** Combined beyondCourses from both parent and child */
  mergedBeyondCourses: string[];

  /** Combined common mistakes */
  mergedCommonMistakes: string[];

  /** Combined catch-up strategies */
  mergedCatchUpStrategies: string[];

  /** Whether this was an exact match or fuzzy */
  matchType: 'exact' | 'alternate_name' | 'substring' | 'word_overlap';

  /** Match confidence (0-1) */
  confidence: number;
}

export interface TargetedMajorContext {
  /** Resolved major(s) for the student's interest */
  resolvedMajors: ResolvedMajor[];

  /** AP courses relevant to their major(s), deduplicated and sorted by relevance */
  relevantCourses: Array<{
    course: APCourseProfile;
    relevance: string;
    relevanceLevel: 'essential' | 'strongly_recommended' | 'recommended' | 'helpful';
  }>;

  /** Verified AP statistics for relevant courses only */
  relevantStatistics: Array<{
    examName: string;
    passRate: number;
    fiveRate: number;
    meanScore: number;
    citation: string;
  }>;

  /** Relevant verified guidance statements */
  relevantGuidance: Array<{
    key: string;
    statement: string;
    citation: string;
  }>;

  /** If the major has subcategories, list them for exploration */
  availableSpecializations?: string[];
}

// ============================================================================
// INDEX BUILDING (Runs once at module load)
// ============================================================================

interface IndexEntry {
  major: MajorSpecificExpectation;
  /** All lowercase name variants that map to this entry */
  nameVariants: string[];
}

/** Maps lowercase name variants → IndexEntry for O(1) lookups */
const MAJOR_INDEX = new Map<string, IndexEntry>();

/** Maps major name → its parent entry (for specializations) */
const PARENT_INDEX = new Map<string, MajorSpecificExpectation>();

/** Maps parent major name → its child entries */
const CHILDREN_INDEX = new Map<string, MajorSpecificExpectation[]>();

/**
 * Build the index from MAJOR_EXPECTATIONS.
 * Called once at module initialization.
 */
function buildIndex(): void {
  for (const major of MAJOR_EXPECTATIONS) {
    const entry: IndexEntry = {
      major,
      nameVariants: [],
    };

    // Index by exact major name
    const primaryKey = major.major.toLowerCase();
    entry.nameVariants.push(primaryKey);
    MAJOR_INDEX.set(primaryKey, entry);

    // Index by all alternate names
    for (const alt of major.alternateNames) {
      const altKey = alt.toLowerCase();
      entry.nameVariants.push(altKey);
      // Don't overwrite if a more specific entry already claims this name
      if (!MAJOR_INDEX.has(altKey)) {
        MAJOR_INDEX.set(altKey, entry);
      }
    }

    // Build parent-child relationships
    if (major.specializationOf) {
      // Find parent entry
      const parent = MAJOR_EXPECTATIONS.find(
        (m) => m.major === major.specializationOf
      );
      if (parent) {
        PARENT_INDEX.set(major.major, parent);

        // Add to children index
        const existing = CHILDREN_INDEX.get(parent.major) || [];
        existing.push(major);
        CHILDREN_INDEX.set(parent.major, existing);
      }
    }
  }
}

// Build index immediately at module load
buildIndex();

// ============================================================================
// RESOLUTION FUNCTIONS
// ============================================================================

/**
 * Resolve a student's stated interest to the best matching major entry.
 *
 * Resolution strategy (in order of preference):
 * 1. Exact match on major name or alternate name
 * 2. Substring match (student interest contains or is contained in a name)
 * 3. Word overlap (shares significant words)
 *
 * If the matched entry is a specialization, also returns the parent.
 */
export function resolveStudentInterest(interest: string): ResolvedMajor | undefined {
  if (!interest || interest.trim().length === 0) return undefined;

  const normalized = interest.toLowerCase().trim();

  // Strategy 1: Exact match in index
  const exactMatch = MAJOR_INDEX.get(normalized);
  if (exactMatch) {
    return buildResolvedMajor(exactMatch.major, 'exact', 1.0);
  }

  // Strategy 2: Substring match
  // Check if interest is a substring of any indexed name, or vice versa
  let bestSubstringMatch: { entry: IndexEntry; overlap: number } | undefined;

  for (const [key, entry] of MAJOR_INDEX) {
    if (key.includes(normalized) || normalized.includes(key)) {
      const overlap = Math.min(key.length, normalized.length) / Math.max(key.length, normalized.length);
      if (!bestSubstringMatch || overlap > bestSubstringMatch.overlap) {
        bestSubstringMatch = { entry, overlap };
      }
    }
  }

  if (bestSubstringMatch && bestSubstringMatch.overlap > 0.3) {
    return buildResolvedMajor(
      bestSubstringMatch.entry.major,
      'substring',
      Math.min(0.95, bestSubstringMatch.overlap + 0.2)
    );
  }

  // Strategy 3: Word overlap (with prefix matching for abbreviated words)
  const interestWords = extractSignificantWords(normalized);
  let bestWordMatch: { major: MajorSpecificExpectation; score: number } | undefined;

  for (const entry of MAJOR_EXPECTATIONS) {
    const majorWords = extractSignificantWords(entry.major.toLowerCase());
    const altWords = entry.alternateNames.flatMap((a) => extractSignificantWords(a.toLowerCase()));
    const allWords = [...majorWords, ...altWords];

    let matchCount = 0;
    for (const word of interestWords) {
      // Exact match
      if (allWords.includes(word)) {
        matchCount++;
      }
      // Prefix match: "poli" matches "political", "mech" matches "mechanical", etc.
      else if (word.length >= 3 && allWords.some((w) => w.startsWith(word) || word.startsWith(w))) {
        matchCount += 0.8;
      }
    }

    if (matchCount > 0) {
      const score = matchCount / Math.max(interestWords.length, 1);
      if (!bestWordMatch || score > bestWordMatch.score) {
        bestWordMatch = { major: entry, score };
      }
    }
  }

  if (bestWordMatch && bestWordMatch.score >= 0.3) {
    return buildResolvedMajor(
      bestWordMatch.major,
      'word_overlap',
      Math.min(0.85, bestWordMatch.score)
    );
  }

  return undefined;
}

/**
 * Resolve multiple interests and deduplicate.
 * Useful when a student mentions several possible majors.
 */
export function resolveMultipleInterests(interests: string[]): ResolvedMajor[] {
  const seen = new Set<string>();
  const results: ResolvedMajor[] = [];

  for (const interest of interests) {
    const resolved = resolveStudentInterest(interest);
    if (resolved && !seen.has(resolved.matched.major)) {
      seen.add(resolved.matched.major);
      results.push(resolved);
    }
  }

  return results;
}

// ============================================================================
// TARGETED CONTEXT ASSEMBLY
// ============================================================================

/**
 * Assemble targeted context for a student's intended major.
 *
 * Returns ONLY the data relevant to their specific major - not the entire
 * database. This keeps LLM context focused and prevents knowledge dilution.
 */
export function getTargetedContext(
  intendedMajor: string,
  additionalInterests?: string[]
): TargetedMajorContext {
  // Resolve primary major
  const allInterests = [intendedMajor, ...(additionalInterests || [])];
  const resolvedMajors = resolveMultipleInterests(allInterests);

  if (resolvedMajors.length === 0) {
    return {
      resolvedMajors: [],
      relevantCourses: [],
      relevantStatistics: [],
      relevantGuidance: [],
    };
  }

  // Collect relevant AP courses (deduplicated)
  // NOTE: AP course majorRelevance keys use short names like 'Engineering', 'Pre-Med',
  // 'Business', 'Biology', 'Economics' - not our full major names like 'Pre-Med / Biology'.
  // We need to try multiple lookup names to bridge this gap.
  const courseMap = new Map<string, { course: APCourseProfile; relevance: string; relevanceLevel: string }>();

  for (const resolved of resolvedMajors) {
    // Build all possible lookup names for this major
    const lookupNames = getCourseRelevanceLookupNames(resolved);

    for (const name of lookupNames) {
      const courses = getCoursesForMajor(name);
      for (const { course, relevance } of courses) {
        if (!courseMap.has(course.name)) {
          courseMap.set(course.name, {
            course,
            relevance,
            relevanceLevel: mapRelevanceLevel(relevance),
          });
        }
      }
    }
  }

  // Sort courses by relevance level
  const relevanceOrder: Record<string, number> = {
    essential: 0,
    strongly_recommended: 1,
    recommended: 2,
    helpful: 3,
  };

  const relevantCourses = Array.from(courseMap.values())
    .sort((a, b) => (relevanceOrder[a.relevanceLevel] || 4) - (relevanceOrder[b.relevanceLevel] || 4))
    .slice(0, 10) as TargetedMajorContext['relevantCourses'];

  // Collect verified statistics for relevant courses only
  const relevantStatistics: TargetedMajorContext['relevantStatistics'] = [];
  for (const { course } of relevantCourses) {
    const stats = AP_EXAM_STATISTICS[course.name];
    if (stats) {
      relevantStatistics.push({
        examName: course.name,
        passRate: stats.passRate.value,
        fiveRate: stats.fiveRate.value,
        meanScore: stats.meanScore.value,
        citation: `${stats.passRate.citation.source} ${stats.passRate.citation.document}`,
      });
    }
  }

  // Collect relevant guidance statements
  const relevantGuidance = getRelevantGuidance(resolvedMajors);

  // Check for available specializations
  const primaryResolved = resolvedMajors[0];
  let availableSpecializations: string[] | undefined;

  if (primaryResolved.matched.subcategories) {
    // Parent entry: show available specializations
    availableSpecializations = primaryResolved.matched.subcategories;
  } else if (primaryResolved.parent?.subcategories) {
    // Child entry: show sibling specializations
    availableSpecializations = primaryResolved.parent.subcategories.filter(
      (s) => s !== primaryResolved.matched.major
    );
  }

  return {
    resolvedMajors,
    relevantCourses,
    relevantStatistics,
    relevantGuidance,
    availableSpecializations,
  };
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Build lookup names for course relevance matching.
 *
 * AP course majorRelevance keys use short names like 'Engineering', 'Pre-Med',
 * 'Business', 'Biology', etc. This function generates all possible lookup names
 * from a resolved major to bridge the gap between our full major names
 * (e.g., "Pre-Med / Biology") and the short keys in course profiles.
 */
function getCourseRelevanceLookupNames(resolved: ResolvedMajor): string[] {
  const names = new Set<string>();

  // Add the full major name
  names.add(resolved.matched.major);

  // Add all alternate names (these often include short forms)
  for (const alt of resolved.matched.alternateNames) {
    names.add(alt);
  }

  // Add parent name if specialization
  if (resolved.parent) {
    names.add(resolved.parent.major);
    for (const alt of resolved.parent.alternateNames) {
      names.add(alt);
    }
  }

  // Split on ' / ' to handle names like 'Pre-Med / Biology', 'Business / Economics'
  for (const name of [...names]) {
    if (name.includes(' / ')) {
      for (const part of name.split(' / ')) {
        names.add(part.trim());
      }
    }
  }

  // Also try common short forms derived from the major name
  const majorLower = resolved.matched.major.toLowerCase();
  if (majorLower.includes('engineering')) {
    names.add('Engineering');
  }
  if (majorLower.includes('business') || majorLower.includes('finance') || majorLower.includes('marketing') || majorLower.includes('accounting')) {
    names.add('Business');
  }

  return Array.from(names);
}

/**
 * Build a ResolvedMajor with parent-child merging.
 */
function buildResolvedMajor(
  matched: MajorSpecificExpectation,
  matchType: ResolvedMajor['matchType'],
  confidence: number
): ResolvedMajor {
  const parent = PARENT_INDEX.get(matched.major);

  // Merge requirements: child's own + parent's base requirements (avoiding duplicates)
  let mergedRequirements: ResolvedMajor['mergedRequirements'];

  if (parent) {
    mergedRequirements = {
      minimum: deduplicateStrings([
        ...matched.requirements.minimum,
        ...parent.requirements.minimum,
      ]),
      competitive: deduplicateStrings([
        ...matched.requirements.competitive,
        ...(matched.additionalRequirements?.competitive || []),
        ...parent.requirements.competitive,
      ]),
      exceptional: deduplicateStrings([
        ...matched.requirements.exceptional,
        ...(matched.additionalRequirements?.exceptional || []),
        ...parent.requirements.exceptional,
      ]),
    };
  } else {
    mergedRequirements = {
      minimum: [...matched.requirements.minimum],
      competitive: [...matched.requirements.competitive],
      exceptional: [...matched.requirements.exceptional],
    };
  }

  // Merge beyondCourses
  const mergedBeyondCourses = parent
    ? deduplicateStrings([...matched.beyondCourses, ...parent.beyondCourses])
    : [...matched.beyondCourses];

  // Merge commonMistakes
  const mergedCommonMistakes = parent
    ? deduplicateStrings([...matched.commonMistakes, ...parent.commonMistakes])
    : [...matched.commonMistakes];

  // Merge catchUpStrategies
  const mergedCatchUpStrategies = parent
    ? deduplicateStrings([...matched.catchUpStrategies, ...parent.catchUpStrategies])
    : [...matched.catchUpStrategies];

  return {
    matched,
    parent,
    mergedRequirements,
    mergedBeyondCourses,
    mergedCommonMistakes,
    mergedCatchUpStrategies,
    matchType,
    confidence,
  };
}

/**
 * Get relevant VERIFIED_GUIDANCE statements based on resolved majors.
 * Only returns guidance that's actually relevant, not all of it.
 */
function getRelevantGuidance(
  resolvedMajors: ResolvedMajor[]
): TargetedMajorContext['relevantGuidance'] {
  const guidance: TargetedMajorContext['relevantGuidance'] = [];

  // Build a set of keywords from all resolved major names
  const majorKeywords = new Set<string>();
  for (const resolved of resolvedMajors) {
    for (const word of extractSignificantWords(resolved.matched.major.toLowerCase())) {
      majorKeywords.add(word);
    }
    if (resolved.parent) {
      for (const word of extractSignificantWords(resolved.parent.major.toLowerCase())) {
        majorKeywords.add(word);
      }
    }
  }

  // Keyword → guidance key mapping for efficient lookup
  const GUIDANCE_RELEVANCE: Record<string, string[]> = {
    engineering: ['physicsPathway', 'precalculusRecommendation'],
    computer: ['csComparison'],
    cs: ['csComparison'],
    software: ['csComparison'],
    physics: ['physicsPathway'],
    language: ['worldLanguageRecommendation'],
    linguistics: ['worldLanguageRecommendation'],
    capstone: ['capstoneRecommendation'],
    research: ['capstoneRecommendation'],
    geography: ['humanGeographyRecommendation'],
    art: ['studioArtRecommendation'],
    design: ['studioArtRecommendation'],
    film: ['studioArtRecommendation'],
    music: ['studioArtRecommendation'],
    precalculus: ['precalculusRecommendation'],
    math: ['precalculusRecommendation'],
    mathematics: ['precalculusRecommendation'],
    finance: ['precalculusRecommendation'],
    business: ['precalculusRecommendation'],
  };

  const addedKeys = new Set<string>();

  for (const keyword of majorKeywords) {
    const relevantKeys = GUIDANCE_RELEVANCE[keyword];
    if (relevantKeys) {
      for (const key of relevantKeys) {
        if (addedKeys.has(key)) continue;

        const guidanceEntry = VERIFIED_GUIDANCE[key as keyof typeof VERIFIED_GUIDANCE];
        if (guidanceEntry) {
          addedKeys.add(key);
          guidance.push({
            key,
            statement: guidanceEntry.statement,
            citation: `${guidanceEntry.citation.source} ${guidanceEntry.citation.document}`,
          });
        }
      }
    }
  }

  return guidance;
}

/**
 * Extract significant words from a string (filtering out common words).
 */
function extractSignificantWords(text: string): string[] {
  const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'of', 'in', 'for', 'to', 'at', 'by',
    'with', 'from', 'on', 'is', 'are', 'was', 'were', 'be', 'been',
    'ap', '/', '&',
  ]);

  return text
    .split(/[\s/&,]+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/**
 * Deduplicate strings (case-insensitive), keeping first occurrence.
 */
function deduplicateStrings(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const lower = item.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}

/**
 * Map relevance description to a level enum.
 */
function mapRelevanceLevel(relevance: string): 'essential' | 'strongly_recommended' | 'recommended' | 'helpful' {
  const lower = relevance.toLowerCase();
  if (lower.includes('essential') || lower.includes('critical') || lower.includes('required')) return 'essential';
  if (lower.includes('strongly') || lower.includes('expected') || lower.includes('important')) return 'strongly_recommended';
  if (lower.includes('recommended') || lower.includes('valuable')) return 'recommended';
  return 'helpful';
}

// ============================================================================
// UTILITY EXPORTS (for testing and debugging)
// ============================================================================

/**
 * Get all indexed major names (for debugging/testing).
 */
export function getAllIndexedNames(): string[] {
  return Array.from(MAJOR_INDEX.keys()).sort();
}

/**
 * Get the total count of major entries.
 */
export function getMajorCount(): {
  total: number;
  parents: number;
  specializations: number;
  standalone: number;
} {
  const parents = MAJOR_EXPECTATIONS.filter((m) => m.subcategories && m.subcategories.length > 0).length;
  const specializations = MAJOR_EXPECTATIONS.filter((m) => m.specializationOf).length;
  const standalone = MAJOR_EXPECTATIONS.length - parents - specializations;

  return {
    total: MAJOR_EXPECTATIONS.length,
    parents,
    specializations,
    standalone,
  };
}

/**
 * Get children of a parent major.
 */
export function getSpecializationsOf(parentMajor: string): MajorSpecificExpectation[] {
  return CHILDREN_INDEX.get(parentMajor) || [];
}
