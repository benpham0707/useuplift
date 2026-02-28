/**
 * Knowledge Base — Recognition Index
 *
 * O(1) lookup index for known awards, competitions, and programs.
 * Extracts recognitions from ACHIEVEMENT_DATABASE (Tiers 1-2 primarily)
 * and builds a keyword-indexed lookup table.
 *
 * Used by:
 *   - tierClassifier.ts — fast award-to-tier mapping
 *   - nuanceCalibrationService.ts — selectivity context
 *   - descriptionScoringService.ts — recognition-aware scoring
 *
 * Cost: $0.00 (pure data, built at module load)
 * Latency: <1ms per lookup
 */

import type { InternalTier } from '../types';
import type { RecognitionEntry, RecognitionLookupResult } from './types';

// ============================================================================
// RECOGNITION ENTRIES — Extracted from ACHIEVEMENT_DATABASE Tiers 1-3
// ============================================================================

/**
 * All recognized awards/competitions/programs with tier classification.
 * Organized by category for maintainability. Each entry has detection keywords
 * for fast matching against activity descriptions.
 */
const RECOGNITION_ENTRIES: RecognitionEntry[] = [
  // ========================================================================
  // STEM RESEARCH
  // ========================================================================
  {
    name: 'RSI (Research Science Institute)',
    aliases: ['rsi', 'research science institute'],
    tier: 1 as InternalTier,
    scoreRange: [9.5, 10],
    categoryId: 'stem_research',
    subcategory: 'bench_science',
    selectivityRatio: '~100 of 3,000+ (~3.3%)',
    scope: 'international',
    context: 'Most selective HS research program in the world',
    differentiator: 'RSI alum vs general summer research',
    detectionKeywords: ['rsi', 'research science institute'],
  },
  {
    name: 'Regeneron STS Finalist',
    aliases: ['regeneron sts', 'science talent search', 'sts finalist'],
    tier: 1 as InternalTier,
    scoreRange: [9.5, 10],
    categoryId: 'stem_research',
    subcategory: 'bench_science',
    selectivityRatio: '40 of 2,200+ (~1.8%)',
    scope: 'national',
    context: 'Often called junior Nobel Prize',
    differentiator: 'STS finalist vs semifinalist vs applicant',
    detectionKeywords: ['regeneron sts', 'sts finalist', 'science talent search'],
  },
  {
    name: 'Regeneron STS Semifinalist',
    aliases: ['regeneron semifinalist', 'sts semifinalist'],
    tier: 2 as InternalTier,
    scoreRange: [7.5, 8.5],
    categoryId: 'stem_research',
    subcategory: 'bench_science',
    selectivityRatio: '300 of 2,200+ (~14%)',
    scope: 'national',
    context: 'Top 300 research papers from HS students',
    differentiator: 'Semifinalist vs finalist',
    detectionKeywords: ['regeneron semifinalist', 'sts semifinalist'],
  },
  {
    name: 'Published First-Author Paper',
    aliases: ['first-author', 'first author publication'],
    tier: 1 as InternalTier,
    scoreRange: [9.5, 10],
    categoryId: 'stem_research',
    subcategory: 'bench_science',
    selectivityRatio: 'Fewer than 200 HS students/year in US',
    scope: 'international',
    context: 'Graduate-level accomplishment as HS student',
    differentiator: 'First-author vs co-author vs acknowledged',
    detectionKeywords: ['first author', 'first-author', 'published paper', 'peer-reviewed'],
  },
  {
    name: 'PRIMES / PRIMES-USA',
    aliases: ['primes', 'mit primes'],
    tier: 1 as InternalTier,
    scoreRange: [9, 10],
    categoryId: 'stem_research',
    subcategory: 'computational',
    selectivityRatio: 'PRIMES: ~30 of 400+ applicants (7.5%)',
    scope: 'national',
    context: 'MIT-hosted year-long math research program',
    differentiator: 'PRIMES publication vs summer research',
    detectionKeywords: ['primes', 'mit primes'],
  },
  {
    name: 'SSP (Summer Science Program)',
    aliases: ['ssp', 'summer science program'],
    tier: 2 as InternalTier,
    scoreRange: [7, 8],
    categoryId: 'stem_research',
    subcategory: 'bench_science',
    selectivityRatio: 'SSP: 108 of ~750 (~14%)',
    scope: 'national',
    context: 'Selective residential STEM summer program',
    differentiator: 'Program selectivity serves as external validation',
    detectionKeywords: ['ssp', 'summer science program'],
  },
  {
    name: 'COSMOS',
    aliases: ['cosmos program', 'california cosmos'],
    tier: 2 as InternalTier,
    scoreRange: [7, 8],
    categoryId: 'stem_research',
    subcategory: 'bench_science',
    selectivityRatio: '~15-20% acceptance',
    scope: 'state',
    context: 'UC-hosted STEM summer program',
    differentiator: 'Selective program with UC mentorship',
    detectionKeywords: ['cosmos'],
  },
  {
    name: 'Clark Scholar',
    aliases: ['clark scholars program'],
    tier: 2 as InternalTier,
    scoreRange: [7, 8],
    categoryId: 'stem_research',
    subcategory: 'bench_science',
    selectivityRatio: '~12 of 600+ (~2%)',
    scope: 'national',
    context: 'Texas Tech intensive research program',
    differentiator: 'Highly selective research mentorship',
    detectionKeywords: ['clark scholar'],
  },

  // ========================================================================
  // STEM COMPETITIONS
  // ========================================================================
  {
    name: 'USAMO (USA Mathematical Olympiad)',
    aliases: ['usamo', 'usa math olympiad'],
    tier: 1 as InternalTier,
    scoreRange: [9.5, 10],
    categoryId: 'stem_competition',
    subcategory: 'math',
    selectivityRatio: '500 of 300,000 (0.17%)',
    scope: 'national',
    context: 'Pinnacle of HS math competition in US',
    differentiator: 'USAMO vs AIME — two selection rounds beyond AMC',
    detectionKeywords: ['usamo', 'usa math olympiad', 'usa mathematical olympiad'],
  },
  {
    name: 'IMO (International Mathematical Olympiad)',
    aliases: ['imo', 'international math olympiad'],
    tier: 1 as InternalTier,
    scoreRange: [9.5, 10],
    categoryId: 'stem_competition',
    subcategory: 'math',
    selectivityRatio: '6 per country',
    scope: 'international',
    context: 'Representing country at International Math Olympiad',
    differentiator: 'IMO team member vs USAMO qualifier',
    detectionKeywords: ['imo', 'international math olympiad', 'international mathematical olympiad'],
  },
  {
    name: 'IOI (International Olympiad in Informatics)',
    aliases: ['ioi', 'international informatics olympiad'],
    tier: 1 as InternalTier,
    scoreRange: [9.5, 10],
    categoryId: 'stem_competition',
    subcategory: 'informatics',
    selectivityRatio: '4 per country',
    scope: 'international',
    context: 'Representing country at International Informatics Olympiad',
    differentiator: 'IOI team member vs USACO Platinum',
    detectionKeywords: ['ioi', 'international olympiad in informatics'],
  },
  {
    name: 'IPhO (International Physics Olympiad)',
    aliases: ['ipho', 'international physics olympiad'],
    tier: 1 as InternalTier,
    scoreRange: [9.5, 10],
    categoryId: 'stem_competition',
    subcategory: 'physics',
    selectivityRatio: '5 per country',
    scope: 'international',
    context: 'Representing country at International Physics Olympiad',
    differentiator: 'IPhO team member vs USAPhO semifinalist',
    detectionKeywords: ['ipho', 'international physics olympiad'],
  },
  {
    name: 'IBO (International Biology Olympiad)',
    aliases: ['ibo', 'international biology olympiad'],
    tier: 1 as InternalTier,
    scoreRange: [9.5, 10],
    categoryId: 'stem_competition',
    subcategory: 'biology',
    selectivityRatio: '4 per country',
    scope: 'international',
    context: 'Representing country at International Biology Olympiad',
    differentiator: 'IBO team member vs USABO finalist',
    detectionKeywords: ['ibo', 'international biology olympiad'],
  },
  {
    name: 'IChO (International Chemistry Olympiad)',
    aliases: ['icho', 'international chemistry olympiad'],
    tier: 1 as InternalTier,
    scoreRange: [9.5, 10],
    categoryId: 'stem_competition',
    subcategory: 'chemistry',
    selectivityRatio: '4 per country',
    scope: 'international',
    context: 'Representing country at International Chemistry Olympiad',
    differentiator: 'IChO team member vs USAChO camp',
    detectionKeywords: ['icho', 'international chemistry olympiad'],
  },
  {
    name: 'USACO Platinum',
    aliases: ['usaco platinum division'],
    tier: 1 as InternalTier,
    scoreRange: [9, 10],
    categoryId: 'stem_competition',
    subcategory: 'informatics',
    selectivityRatio: '~260 pre-college of 12,000+ active',
    scope: 'national',
    context: 'Top tier of USACO competitive programming',
    differentiator: 'Platinum requires graduate-level algorithmic knowledge',
    detectionKeywords: ['usaco platinum'],
  },
  {
    name: 'USACO Camp / Finalist',
    aliases: ['usaco camp', 'usaco finalist'],
    tier: 1 as InternalTier,
    scoreRange: [9.5, 10],
    categoryId: 'stem_competition',
    subcategory: 'informatics',
    selectivityRatio: '~26 camp invitees from 12,000+ active',
    scope: 'national',
    context: 'Top 26 competitive programmers invited to training camp',
    differentiator: 'Camp invitee vs Platinum division',
    detectionKeywords: ['usaco camp', 'usaco finalist'],
  },
  {
    name: 'ISEF Grand Award',
    aliases: ['isef grand award', 'intel isef', 'regeneron isef'],
    tier: 1 as InternalTier,
    scoreRange: [9.5, 10],
    categoryId: 'stem_competition',
    subcategory: 'science_fair',
    selectivityRatio: '~88 Grand Awards of ~1,600 finalists',
    scope: 'international',
    context: 'Top project at International Science & Engineering Fair',
    differentiator: 'Grand Award vs Special Award vs participation',
    detectionKeywords: ['isef', 'grand award', 'international science'],
  },
  {
    name: 'USAPhO Semifinalist / Camp Invitee',
    aliases: ['usapho', 'usapho semifinalist', 'usapho camp'],
    tier: 1 as InternalTier,
    scoreRange: [9.5, 10],
    categoryId: 'stem_competition',
    subcategory: 'physics',
    selectivityRatio: '~500 take USAPhO exam → 20 camp → 5 team',
    scope: 'national',
    context: 'Top 20 physics students invited to training camp',
    differentiator: 'Camp invitee vs exam taker',
    detectionKeywords: ['usapho', 'physics olympiad camp'],
  },
  {
    name: 'USABO Finalist',
    aliases: ['usabo finalist', 'usabo camp'],
    tier: 1 as InternalTier,
    scoreRange: [9.5, 10],
    categoryId: 'stem_competition',
    subcategory: 'biology',
    selectivityRatio: '20 finalists of 10,000+',
    scope: 'national',
    context: 'Top 20 biology students nationally',
    differentiator: 'National camp invitee',
    detectionKeywords: ['usabo finalist', 'usabo camp', 'biology olympiad finalist'],
  },
  {
    name: 'USAChO Study Camp',
    aliases: ['usacho camp', 'usnco camp'],
    tier: 1 as InternalTier,
    scoreRange: [9.5, 10],
    categoryId: 'stem_competition',
    subcategory: 'chemistry',
    selectivityRatio: '20 study camp of 1,000+ USNCO exam takers',
    scope: 'national',
    context: 'Top 20 chemistry students nationally',
    differentiator: 'IChO team (4) vs study camp (20) vs nationals qualifier',
    detectionKeywords: ['usacho', 'usnco camp', 'chemistry olympiad camp'],
  },
  {
    name: 'AIME Qualifier (High Score)',
    aliases: ['aime high score', 'aime 10+'],
    tier: 2 as InternalTier,
    scoreRange: [7.5, 8.5],
    categoryId: 'stem_competition',
    subcategory: 'math',
    selectivityRatio: '~6,000 of 300,000+ (2%)',
    scope: 'national',
    context: 'Top 2% of AMC takers with 10+ AIME score',
    differentiator: 'AIME score of 10+ vs bare qualifier',
    detectionKeywords: ['aime'],
  },
  {
    name: 'USACO Gold',
    aliases: ['usaco gold division'],
    tier: 2 as InternalTier,
    scoreRange: [7, 8.5],
    categoryId: 'stem_competition',
    subcategory: 'informatics',
    selectivityRatio: '~1,000 competitive programmers',
    scope: 'national',
    context: 'Strong algorithmic fundamentals',
    differentiator: 'Gold requires strong algorithmic fundamentals',
    detectionKeywords: ['usaco gold'],
  },
  {
    name: 'F=MA Qualifier (USAPhO)',
    aliases: ['f=ma qualifier', 'usapho qualifier'],
    tier: 2 as InternalTier,
    scoreRange: [7, 8],
    categoryId: 'stem_competition',
    subcategory: 'physics',
    selectivityRatio: 'Top 400 qualify for USAPhO',
    scope: 'national',
    context: 'Qualifying for USAPhO exam round',
    differentiator: 'Qualifying for USAPhO exam round',
    detectionKeywords: ['f=ma', 'usapho qualifier'],
  },
  {
    name: 'USNCO National Exam Qualifier',
    aliases: ['usnco qualifier', 'usnco nationals'],
    tier: 2 as InternalTier,
    scoreRange: [7, 8],
    categoryId: 'stem_competition',
    subcategory: 'chemistry',
    selectivityRatio: '~1,000 of 16,000+',
    scope: 'national',
    context: 'National chemistry exam qualifier',
    differentiator: 'National exam vs local section exam',
    detectionKeywords: ['usnco', 'national chemistry olympiad'],
  },
  {
    name: 'MATHCOUNTS National Competitor',
    aliases: ['mathcounts national', 'mathcounts nationals'],
    tier: 2 as InternalTier,
    scoreRange: [7, 8],
    categoryId: 'stem_competition',
    subcategory: 'math',
    selectivityRatio: '224 national competitors from ~33,000',
    scope: 'national',
    context: 'Top middle school mathematicians',
    differentiator: 'National vs state; middle school accomplishment',
    detectionKeywords: ['mathcounts national'],
  },
  {
    name: 'Science Olympiad National Medalist',
    aliases: ['scioly national medal', 'science olympiad nationals medal'],
    tier: 2 as InternalTier,
    scoreRange: [7.5, 8.5],
    categoryId: 'stem_competition',
    subcategory: 'science_olympiad',
    selectivityRatio: '~120 teams at nationals; 3 medals per event',
    scope: 'national',
    context: 'National individual medalist at Science Olympiad',
    differentiator: 'National medalist vs participant vs state medalist',
    detectionKeywords: ['science olympiad national', 'scioly national medal'],
  },

  // ========================================================================
  // DEBATE & SPEECH
  // ========================================================================
  {
    name: 'TOC (Tournament of Champions) Finalist',
    aliases: ['toc finalist', 'tournament of champions'],
    tier: 1 as InternalTier,
    scoreRange: [9, 10],
    categoryId: 'debate_speech',
    subcategory: 'policy_debate',
    selectivityRatio: '~200 qualifiers nationally',
    scope: 'national',
    context: 'Most prestigious debate tournament',
    differentiator: 'TOC final round vs early elimination',
    detectionKeywords: ['toc', 'tournament of champions'],
  },
  {
    name: 'NSDA National Champion',
    aliases: ['nsda champion', 'national speech debate champion'],
    tier: 1 as InternalTier,
    scoreRange: [9.5, 10],
    categoryId: 'debate_speech',
    subcategory: 'ld_debate',
    selectivityRatio: '1 of ~6,700 qualifiers',
    scope: 'national',
    context: 'Single national champion in each event',
    differentiator: 'Champion vs qualifier',
    detectionKeywords: ['nsda champion', 'nsda national champion', 'national champion debate'],
  },
  {
    name: 'TOC Qualifier (2+ bids)',
    aliases: ['toc qualifier', 'toc bid'],
    tier: 2 as InternalTier,
    scoreRange: [7.5, 8.5],
    categoryId: 'debate_speech',
    subcategory: 'policy_debate',
    selectivityRatio: null,
    scope: 'national',
    context: 'Consistently winning at championship-level tournaments',
    differentiator: 'Multiple bids vs single bid',
    detectionKeywords: ['toc qualifier', 'toc bid'],
  },
  {
    name: 'State Debate Champion',
    aliases: ['state debate champion', 'state champion debate'],
    tier: 2 as InternalTier,
    scoreRange: [7, 8.5],
    categoryId: 'debate_speech',
    subcategory: 'ld_debate',
    selectivityRatio: null,
    scope: 'state',
    context: 'Top debater in state; ~1,000+ competitors',
    differentiator: 'State champion vs state qualifier',
    detectionKeywords: ['state debate champion', 'state champion'],
  },

  // ========================================================================
  // PERFORMING ARTS
  // ========================================================================
  {
    name: 'National YoungArts Winner',
    aliases: ['youngarts', 'young arts winner', 'youngarts finalist'],
    tier: 1 as InternalTier,
    scoreRange: [9.5, 10],
    categoryId: 'performing_arts',
    subcategory: 'instrumental_classical',
    selectivityRatio: '~150-170 of 9,000-11,000 (~1.5-1.9%)',
    scope: 'national',
    context: 'Most prestigious HS arts recognition in US',
    differentiator: 'With Distinction vs Honorable Mention vs Merit',
    detectionKeywords: ['youngarts', 'young arts'],
  },
  {
    name: 'Juilliard Pre-College',
    aliases: ['juilliard pre-college', 'juilliard precollege'],
    tier: 1 as InternalTier,
    scoreRange: [9, 10],
    categoryId: 'performing_arts',
    subcategory: 'instrumental_classical',
    selectivityRatio: 'Juilliard Pre-College: ~10% acceptance',
    scope: 'national',
    context: 'Most selective pre-college music program',
    differentiator: 'Elite pre-conservatory vs regional youth program',
    detectionKeywords: ['juilliard', 'pre-college', 'precollege'],
  },
  {
    name: 'Jimmy Awards Nominee',
    aliases: ['jimmy awards', 'national high school musical theatre awards'],
    tier: 1 as InternalTier,
    scoreRange: [9, 10],
    categoryId: 'performing_arts',
    subcategory: 'theater_acting',
    selectivityRatio: '~80-90 nominees nationally',
    scope: 'national',
    context: 'Top HS musical theater performers from 140,000+ participants',
    differentiator: 'Nominee vs regional winner vs participant',
    detectionKeywords: ['jimmy award', 'jimmy awards'],
  },
  {
    name: 'All-State Orchestra/Band/Choir',
    aliases: ['all-state', 'all state orchestra', 'all state band', 'all state choir'],
    tier: 2 as InternalTier,
    scoreRange: [7, 8.5],
    categoryId: 'performing_arts',
    subcategory: 'instrumental_classical',
    selectivityRatio: null,
    scope: 'state',
    context: 'Top ~100 musicians statewide in competitive states',
    differentiator: 'All-State in CA/NY/TX vs small state',
    detectionKeywords: ['all-state orchestra', 'all-state band', 'all-state choir', 'all-state ensemble'],
  },

  // ========================================================================
  // ATHLETICS
  // ========================================================================
  {
    name: 'D1 Recruit / Blue-Chip Athlete',
    aliases: ['d1 recruit', 'division 1 recruit', 'blue chip'],
    tier: 1 as InternalTier,
    scoreRange: [9, 10],
    categoryId: 'athletics',
    subcategory: 'individual_sports',
    selectivityRatio: null,
    scope: 'national',
    context: 'Recruited by Division 1 program',
    differentiator: 'D1 recruit vs D3 vs club level',
    detectionKeywords: ['d1 recruit', 'division 1', 'recruited', 'blue chip'],
  },
  {
    name: 'All-American Athlete',
    aliases: ['all-american', 'all american'],
    tier: 1 as InternalTier,
    scoreRange: [9, 10],
    categoryId: 'athletics',
    subcategory: 'individual_sports',
    selectivityRatio: null,
    scope: 'national',
    context: 'National-level athletic recognition',
    differentiator: 'All-American vs All-State vs All-Conference',
    detectionKeywords: ['all-american', 'all american'],
  },
  {
    name: 'All-State Athlete',
    aliases: ['all-state athlete', 'all state team'],
    tier: 2 as InternalTier,
    scoreRange: [7, 8.5],
    categoryId: 'athletics',
    subcategory: 'individual_sports',
    selectivityRatio: null,
    scope: 'state',
    context: 'State-level athletic recognition',
    differentiator: 'All-State vs All-Conference vs honorable mention',
    detectionKeywords: ['all-state athlete', 'all-state team', 'all-state selection'],
  },

  // ========================================================================
  // COMMUNITY SERVICE
  // ========================================================================
  {
    name: 'Presidential Volunteer Service Award (Gold)',
    aliases: ['pvsa gold', 'presidential volunteer service award'],
    tier: 2 as InternalTier,
    scoreRange: [7, 8],
    categoryId: 'community_service',
    subcategory: 'local_nonprofit',
    selectivityRatio: null,
    scope: 'national',
    context: 'Federal recognition for 250+ hours of service',
    differentiator: 'Gold (250+ hrs) vs Silver vs Bronze',
    detectionKeywords: ['pvsa', 'presidential volunteer', 'volunteer service award'],
  },

  // ========================================================================
  // ENTREPRENEURSHIP
  // ========================================================================
  {
    name: 'DECA International Career Development Conference',
    aliases: ['deca icdc', 'deca international'],
    tier: 2 as InternalTier,
    scoreRange: [7, 8],
    categoryId: 'entrepreneurship',
    subcategory: 'startup',
    selectivityRatio: null,
    scope: 'international',
    context: 'Business competition at international level',
    differentiator: 'International finalist vs state only',
    detectionKeywords: ['deca international', 'deca icdc'],
  },
  {
    name: 'FBLA National Leadership Conference',
    aliases: ['fbla nlc', 'fbla national'],
    tier: 2 as InternalTier,
    scoreRange: [7, 8],
    categoryId: 'entrepreneurship',
    subcategory: 'startup',
    selectivityRatio: null,
    scope: 'national',
    context: 'Business leadership competition at national level',
    differentiator: 'National competitor vs state only',
    detectionKeywords: ['fbla national', 'fbla nlc'],
  },

  // ========================================================================
  // ACADEMIC ENRICHMENT
  // ========================================================================
  {
    name: 'Scholastic Gold Medal (Art & Writing)',
    aliases: ['scholastic gold', 'scholastic art and writing'],
    tier: 2 as InternalTier,
    scoreRange: [7, 8.5],
    categoryId: 'academic_enrichment',
    subcategory: 'independent_research',
    selectivityRatio: null,
    scope: 'national',
    context: 'National recognition in art or writing',
    differentiator: 'Gold Medal (national) vs Silver Key (regional)',
    detectionKeywords: ['scholastic gold', 'scholastic award', 'gold medal writing'],
  },
];

// ============================================================================
// KEYWORD INDEX — Built at module load for O(1) lookup
// ============================================================================

/** Escape special regex characters in a string */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Maps lowercase keywords to matching recognition entries */
const _keywordToRecognitions: Map<string, RecognitionEntry[]> = new Map();

/** Maps lowercase exact names/aliases to recognition entries */
const _nameIndex: Map<string, RecognitionEntry> = new Map();

/** Pre-compiled word-boundary regexes for each keyword (case-insensitive) */
const _keywordRegexes: Map<string, RegExp> = new Map();

function buildRecognitionIndexes(): void {
  for (const entry of RECOGNITION_ENTRIES) {
    // Index by canonical name (lowercase)
    _nameIndex.set(entry.name.toLowerCase(), entry);

    // Index by aliases
    for (const alias of entry.aliases) {
      _nameIndex.set(alias.toLowerCase(), entry);
    }

    // Index by detection keywords
    for (const keyword of entry.detectionKeywords) {
      const lower = keyword.toLowerCase();
      if (!_keywordToRecognitions.has(lower)) {
        _keywordToRecognitions.set(lower, []);
      }
      _keywordToRecognitions.get(lower)!.push(entry);

      // Pre-compile word-boundary regex for this keyword
      if (!_keywordRegexes.has(lower)) {
        _keywordRegexes.set(lower, new RegExp('\\b' + escapeRegex(lower) + '\\b', 'i'));
      }
    }
  }
}

// Build indexes on module load
buildRecognitionIndexes();

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Look up a recognition by exact name or alias.
 * O(1) lookup.
 */
export function lookupRecognitionByName(name: string): RecognitionEntry | undefined {
  return _nameIndex.get(name.toLowerCase().trim());
}

/**
 * Find recognitions mentioned in a text description.
 * Scans the text for known recognition keywords and returns all matches.
 *
 * @param text Activity description or title to scan
 * @returns Array of lookup results, sorted by tier (best first)
 */
export function findRecognitionsInText(text: string): RecognitionLookupResult[] {
  const results: RecognitionLookupResult[] = [];
  const seen = new Set<string>(); // Deduplicate by name

  for (const [keyword, entries] of _keywordToRecognitions) {
    const regex = _keywordRegexes.get(keyword);
    if (regex && regex.test(text)) {
      for (const entry of entries) {
        if (!seen.has(entry.name)) {
          seen.add(entry.name);

          // Calculate confidence based on keyword specificity
          const confidence: 'high' | 'medium' | 'low' =
            keyword.length >= 10 ? 'high' :
            keyword.length >= 5 ? 'medium' :
            'low';

          results.push({
            entry,
            confidence,
            matchedTerm: keyword,
          });
        }
      }
    }
  }

  // Sort by tier (best first), then by confidence
  results.sort((a, b) => {
    if (a.entry.tier !== b.entry.tier) return a.entry.tier - b.entry.tier;
    const confOrder = { high: 0, medium: 1, low: 2 };
    return confOrder[a.confidence] - confOrder[b.confidence];
  });

  return results;
}

/**
 * Get all recognition entries for a specific category.
 */
export function getRecognitionsByCategory(categoryId: string): RecognitionEntry[] {
  return RECOGNITION_ENTRIES.filter(e => e.categoryId === categoryId);
}

/**
 * Get all recognition entries for a specific tier.
 */
export function getRecognitionsByTier(tier: InternalTier): RecognitionEntry[] {
  return RECOGNITION_ENTRIES.filter(e => e.tier === tier);
}

/**
 * Get the total number of recognition entries.
 */
export function getRecognitionCount(): number {
  return RECOGNITION_ENTRIES.length;
}

/**
 * Get all recognition entries (for testing/validation).
 */
export function getAllRecognitions(): readonly RecognitionEntry[] {
  return RECOGNITION_ENTRIES;
}
