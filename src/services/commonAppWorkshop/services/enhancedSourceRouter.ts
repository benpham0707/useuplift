// @ts-nocheck
/**
 * Enhanced Source Router V2
 *
 * Implements the 4-layer source routing hierarchy:
 * 1. Universal (always safe fallback)
 * 2. Prompt-Type (category-specific advice)
 * 3. College-Specific (institution-focused advice)
 * 4. Prompt-Specific (exact prompt match - highest priority)
 *
 * Key Features:
 * - Automatic scope validation to prevent misapplication
 * - Weighted scoring based on scope + authority + relevance
 * - Graceful fallback when specific sources unavailable
 * - Author diversity controls
 * - Context requirement validation
 *
 * This router ensures the RIGHT source is used for the RIGHT context,
 * preventing advice meant for supplements from being applied to main essays.
 */

import type {
  EnhancedLabeledSource,
  SourceRoutingContext,
  SourceValidationResult,
  SourceScope,
  SourceAuthority,
  ClicheSymptomType,
  CollegeId,
  PromptType,
  LabeledSource,
  SourceBundle,
  SCOPE_LEVEL_WEIGHTS,
  AUTHORITY_WEIGHTS,
} from '../types/labeledSourceTypes';
import { validateSourceForContext } from '../types/labeledSourceTypes';
import { UNIVERSAL_SOURCES, getUniversalSourcesForIssue } from '../data/universalSources';
import { PROMPT_TYPE_SOURCES, getSourcesForPromptAndIssue } from '../data/promptTypeSpecificSources';
import { LABELED_SOURCES } from '../data/labeledSources';
import { getSourceIndexer } from './sourceIndexer';

// ============================================================================
// SCOPE AND AUTHORITY WEIGHTS
// ============================================================================

const SCOPE_WEIGHTS: Record<SourceScope, number> = {
  prompt_specific: 1.0,
  college_specific: 0.95,
  prompt_type: 0.85,
  universal: 0.75,
};

const AUTH_WEIGHTS: Record<SourceAuthority, number> = {
  primary: 1.0,
  research: 0.95,
  expert: 0.9,
  pattern: 0.85,
  principle: 0.8,
};

// ============================================================================
// TYPES
// ============================================================================

interface ScoredSource {
  source: EnhancedLabeledSource | LabeledSource;
  score: number;
  scopeLevel: SourceScope;
  validationResult: SourceValidationResult;
  matchReason: string;
}

interface RoutingResult {
  primary: ScoredSource | null;
  supporting: ScoredSource[];
  universalFallback: ScoredSource | null;
  metadata: {
    totalCandidates: number;
    layersSearched: SourceScope[];
    usedFallback: boolean;
    warnings: string[];
  };
}

// ============================================================================
// ENHANCED SOURCE ROUTER
// ============================================================================

export class EnhancedSourceRouter {
  private universalSources: EnhancedLabeledSource[];
  private promptTypeSources: EnhancedLabeledSource[];
  private collegeSources: LabeledSource[];
  private indexer: ReturnType<typeof getSourceIndexer>;

  constructor() {
    this.universalSources = UNIVERSAL_SOURCES;
    this.promptTypeSources = PROMPT_TYPE_SOURCES;
    this.collegeSources = LABELED_SOURCES;
    this.indexer = getSourceIndexer();
  }

  // ============================================================================
  // MAIN ROUTING METHOD
  // ============================================================================

  /**
   * Route to the best sources for a given context
   * Follows the 4-layer hierarchy with automatic fallback
   */
  routeForContext(context: SourceRoutingContext): RoutingResult {
    const candidates: ScoredSource[] = [];
    const warnings: string[] = [];
    const layersSearched: SourceScope[] = [];

    // Layer 1: College-Specific Sources (highest priority for college fit)
    layersSearched.push('college_specific');
    const collegeCandidates = this.getCollegeSpecificCandidates(context);
    candidates.push(...collegeCandidates);

    // Layer 2: Prompt-Type Sources
    layersSearched.push('prompt_type');
    const promptTypeCandidates = this.getPromptTypeCandidates(context);
    candidates.push(...promptTypeCandidates);

    // Layer 3: Universal Sources (always include as potential fallback)
    layersSearched.push('universal');
    const universalCandidates = this.getUniversalCandidates(context);
    candidates.push(...universalCandidates);

    // Sort by score (higher is better)
    candidates.sort((a, b) => b.score - a.score);

    // Select primary and supporting
    const validCandidates = candidates.filter(c => c.validationResult.valid);
    const primary = validCandidates[0] || null;

    // Get supporting sources with author diversity
    const supporting = this.selectSupportingWithDiversity(
      validCandidates.slice(1),
      primary,
      3 // Max 3 supporting
    );

    // Always keep a universal fallback ready
    const universalFallback = universalCandidates.find(c => c.validationResult.valid) || null;

    // Add warnings if we had to fall back
    if (collegeCandidates.length === 0) {
      warnings.push(`No college-specific sources for ${context.college_id}`);
    }
    if (primary?.scopeLevel === 'universal') {
      warnings.push('Using universal fallback - no specific sources matched');
    }

    return {
      primary,
      supporting,
      universalFallback,
      metadata: {
        totalCandidates: candidates.length,
        layersSearched,
        usedFallback: primary?.scopeLevel === 'universal',
        warnings,
      },
    };
  }

  // ============================================================================
  // LAYER-SPECIFIC CANDIDATE GETTERS
  // ============================================================================

  private getCollegeSpecificCandidates(context: SourceRoutingContext): ScoredSource[] {
    const candidates: ScoredSource[] = [];

    // Get from existing indexed sources
    const indexedSources = this.indexer.getBestForCollegeAndIssue(
      context.college_id,
      context.issue_type,
      10
    );

    for (const indexed of indexedSources) {
      const source = indexed.source;
      const relevance = source.issue_relevance[context.issue_type];
      if (!relevance) continue;

      // Basic validation for LabeledSource (non-enhanced)
      const validationResult = this.validateLegacySource(source, context);
      if (!validationResult.valid) continue;

      const score = this.calculateScore({
        scopeLevel: 'college_specific',
        authority: 'expert', // Default for legacy sources
        relevanceScore: relevance.score,
        weightAdjustment: validationResult.weight_adjustment,
        isPrimaryCollege: indexed.is_primary_for_college === context.college_id,
      });

      candidates.push({
        source,
        score,
        scopeLevel: 'college_specific',
        validationResult,
        matchReason: `College: ${context.college_id}, Issue: ${context.issue_type}`,
      });
    }

    return candidates;
  }

  private getPromptTypeCandidates(context: SourceRoutingContext): ScoredSource[] {
    const candidates: ScoredSource[] = [];

    const promptSources = getSourcesForPromptAndIssue(context.prompt_type, context.issue_type);

    for (const source of promptSources) {
      const validationResult = validateSourceForContext(source, context);
      if (!validationResult.valid) continue;

      const relevance = source.issue_relevance[context.issue_type];
      if (!relevance) continue;

      const score = this.calculateScore({
        scopeLevel: 'prompt_type',
        authority: source.authority,
        relevanceScore: relevance.score,
        weightAdjustment: validationResult.weight_adjustment,
        isPrimaryCollege: false,
      });

      candidates.push({
        source,
        score,
        scopeLevel: 'prompt_type',
        validationResult,
        matchReason: `Prompt Type: ${context.prompt_type}, Issue: ${context.issue_type}`,
      });
    }

    return candidates;
  }

  private getUniversalCandidates(context: SourceRoutingContext): ScoredSource[] {
    const candidates: ScoredSource[] = [];

    const universalSources = getUniversalSourcesForIssue(context.issue_type);

    for (const source of universalSources) {
      const validationResult = validateSourceForContext(source, context);
      if (!validationResult.valid) continue;

      const relevance = source.issue_relevance[context.issue_type];
      if (!relevance) continue;

      const score = this.calculateScore({
        scopeLevel: 'universal',
        authority: source.authority,
        relevanceScore: relevance.score,
        weightAdjustment: validationResult.weight_adjustment,
        isPrimaryCollege: false,
      });

      candidates.push({
        source,
        score,
        scopeLevel: 'universal',
        validationResult,
        matchReason: `Universal source for: ${context.issue_type}`,
      });
    }

    return candidates;
  }

  // ============================================================================
  // SCORING
  // ============================================================================

  private calculateScore(params: {
    scopeLevel: SourceScope;
    authority: SourceAuthority;
    relevanceScore: number;
    weightAdjustment: number;
    isPrimaryCollege: boolean;
  }): number {
    const { scopeLevel, authority, relevanceScore, weightAdjustment, isPrimaryCollege } = params;

    // Base score from relevance (0-100)
    let score = relevanceScore;

    // Apply scope weight
    score *= SCOPE_WEIGHTS[scopeLevel];

    // Apply authority weight
    score *= AUTH_WEIGHTS[authority];

    // Apply validation weight adjustment
    score *= weightAdjustment;

    // Bonus for primary college source
    if (isPrimaryCollege) {
      score *= 1.1;
    }

    return Math.round(score * 100) / 100;
  }

  // ============================================================================
  // DIVERSITY SELECTION
  // ============================================================================

  private selectSupportingWithDiversity(
    candidates: ScoredSource[],
    primary: ScoredSource | null,
    maxCount: number
  ): ScoredSource[] {
    const selected: ScoredSource[] = [];
    const authorsSeen = new Set<string>();
    const scopesSeen = new Set<SourceScope>();

    // Track primary author
    if (primary) {
      const primaryAuthor = this.getSourceAuthor(primary.source);
      if (primaryAuthor) authorsSeen.add(primaryAuthor);
      scopesSeen.add(primary.scopeLevel);
    }

    for (const candidate of candidates) {
      if (selected.length >= maxCount) break;

      const author = this.getSourceAuthor(candidate.source);

      // Allow max 2 sources per author
      if (author) {
        const authorCount = [primary, ...selected].filter(s =>
          s && this.getSourceAuthor(s.source) === author
        ).length;
        if (authorCount >= 2) continue;
      }

      // Prefer scope diversity
      if (!scopesSeen.has(candidate.scopeLevel) || selected.length < 2) {
        selected.push(candidate);
        if (author) authorsSeen.add(author);
        scopesSeen.add(candidate.scopeLevel);
      }
    }

    return selected;
  }

  private getSourceAuthor(source: EnhancedLabeledSource | LabeledSource): string | null {
    return source.author || null;
  }

  // ============================================================================
  // LEGACY SOURCE VALIDATION
  // ============================================================================

  private validateLegacySource(
    source: LabeledSource,
    context: SourceRoutingContext
  ): SourceValidationResult {
    // Check college applicability
    const spec = source.college_specificity;

    if (spec.exclusions.includes(context.college_id)) {
      return {
        valid: false,
        reason: `Source excluded for ${context.college_id}`,
        weight_adjustment: 0,
      };
    }

    // Check if applicable
    const isApplicable = spec.applicable_colleges.length === 0 ||
      spec.applicable_colleges.includes(context.college_id);

    if (!isApplicable) {
      // Check peer institutions
      const peerInstitutions = this.getPeerInstitutions(context.college_id);
      const isPeerMatch = spec.applicable_colleges.some(c => peerInstitutions.includes(c));

      if (isPeerMatch) {
        return {
          valid: true,
          warning: 'Using peer institution source',
          weight_adjustment: 0.9,
        };
      }

      return {
        valid: false,
        reason: `Source not applicable to ${context.college_id}`,
        weight_adjustment: 0,
      };
    }

    // Check issue relevance
    if (!source.issue_relevance[context.issue_type]) {
      return {
        valid: false,
        reason: `Source does not address ${context.issue_type}`,
        weight_adjustment: 0,
      };
    }

    return {
      valid: true,
      weight_adjustment: 1.0,
    };
  }

  private getPeerInstitutions(collegeId: CollegeId): CollegeId[] {
    const peers: Record<CollegeId, CollegeId[]> = {
      stanford: ['mit', 'harvard', 'caltech'],
      harvard: ['yale', 'princeton', 'stanford'],
      mit: ['caltech', 'stanford', 'cornell'],
      uchicago: ['columbia', 'yale', 'northwestern'],
      duke: ['northwestern', 'penn', 'brown'],
      yale: ['harvard', 'princeton', 'columbia'],
      princeton: ['harvard', 'yale', 'stanford'],
      columbia: ['uchicago', 'yale', 'penn'],
      penn: ['duke', 'northwestern', 'cornell'],
      brown: ['dartmouth', 'duke', 'penn'],
      dartmouth: ['brown', 'cornell', 'penn'],
      cornell: ['penn', 'dartmouth', 'mit'],
      caltech: ['mit', 'stanford', 'cornell'],
      northwestern: ['duke', 'uchicago', 'penn'],
      johns_hopkins: ['cornell', 'northwestern', 'duke'],
      uva: ['duke', 'northwestern', 'penn'],
      tulane: ['uva', 'gmu', 'duke'],
      harvey_mudd: ['caltech', 'mit', 'stanford'],
      gmu: ['uva', 'tulane', 'johns_hopkins'],
    };
    return peers[collegeId] || [];
  }

  // ============================================================================
  // BUNDLE CREATION
  // ============================================================================

  /**
   * Create a SourceBundle from routing results
   */
  createBundle(result: RoutingResult): SourceBundle | null {
    if (!result.primary) {
      return null;
    }

    const primary = result.primary.source as LabeledSource;
    const supporting = result.supporting.map(s => s.source as LabeledSource);

    // Find college-specific and general principle sources
    const collegeSpecific = result.supporting.find(s =>
      s.scopeLevel === 'college_specific'
    )?.source as LabeledSource || null;

    const generalPrinciple = result.supporting.find(s =>
      s.scopeLevel === 'universal'
    )?.source as LabeledSource || result.universalFallback?.source as LabeledSource || null;

    return {
      primary,
      supporting,
      college_specific: collegeSpecific,
      general_principle: generalPrinciple,
      formatted: {
        inline: this.formatInline(primary),
        tooltip: this.formatTooltip(primary),
        full: this.formatFull([primary, ...supporting]),
      },
      metadata: {
        total_candidates: result.metadata.totalCandidates,
        selection_criteria: [
          `Layers: ${result.metadata.layersSearched.join(' → ')}`,
          ...result.metadata.warnings,
        ],
        diversity_score: this.calculateDiversityScore([result.primary, ...result.supporting]),
      },
    };
  }

  // ============================================================================
  // FORMATTING
  // ============================================================================

  private formatInline(source: LabeledSource): string {
    if (source.author && source.author_title) {
      return `(${source.author}, ${source.author_title})`;
    }
    return `(${source.author || source.publication || 'Admissions Expert'})`;
  }

  private formatTooltip(source: LabeledSource): string {
    const lines: string[] = [];

    if (source.author) {
      lines.push(`**${source.author}**`);
      if (source.author_title) {
        lines.push(source.author_title);
      }
    }

    if (source.quote) {
      lines.push(`\n"${source.quote}"`);
    }

    if (source.publication && source.date) {
      const year = source.date.split('-')[0];
      lines.push(`\n— ${source.publication}, ${year}`);
    }

    return lines.join('\n');
  }

  private formatFull(sources: LabeledSource[]): string {
    return sources.map((source, index) => {
      const lines: string[] = [];

      lines.push(`### Source ${index + 1}: ${source.title || 'Admissions Insight'}`);

      if (source.author && source.author_title) {
        lines.push(`**${source.author}**, ${source.author_title}`);
      }

      if (source.quote) {
        lines.push(`\n> "${source.quote}"`);
      }

      if (source.publication && source.date) {
        const year = source.date.split('-')[0];
        lines.push(`\n*${source.publication}*, ${year}`);
      }

      if (source.relevance_to_claim) {
        lines.push(`\n**Why this matters:** ${source.relevance_to_claim}`);
      }

      return lines.join('\n');
    }).join('\n\n---\n\n');
  }

  private calculateDiversityScore(sources: ScoredSource[]): number {
    if (sources.length <= 1) return 100;

    const authors = new Set(sources.map(s => this.getSourceAuthor(s.source)).filter(Boolean));
    const scopes = new Set(sources.map(s => s.scopeLevel));

    const authorDiversity = (authors.size / sources.length) * 100;
    const scopeDiversity = (scopes.size / sources.length) * 100;

    return Math.round((authorDiversity + scopeDiversity) / 2);
  }

  // ============================================================================
  // QUICK ACCESS METHODS
  // ============================================================================

  /**
   * Get the single best source for an issue/context
   */
  getBestSingle(context: SourceRoutingContext): LabeledSource | null {
    const result = this.routeForContext(context);
    return result.primary?.source as LabeledSource || null;
  }

  /**
   * Get a quick universal fallback for any issue
   */
  getUniversalFallback(issueType: ClicheSymptomType): LabeledSource | null {
    const sources = getUniversalSourcesForIssue(issueType);
    return sources[0] || null;
  }

  /**
   * Check if we have good coverage for a context
   */
  hasGoodCoverage(context: SourceRoutingContext): {
    hasCollegeSpecific: boolean;
    hasPromptTypeSpecific: boolean;
    hasUniversal: boolean;
    totalSources: number;
  } {
    const result = this.routeForContext(context);
    const sources = [result.primary, ...result.supporting].filter(Boolean);

    return {
      hasCollegeSpecific: sources.some(s => s!.scopeLevel === 'college_specific'),
      hasPromptTypeSpecific: sources.some(s => s!.scopeLevel === 'prompt_type'),
      hasUniversal: sources.some(s => s!.scopeLevel === 'universal'),
      totalSources: result.metadata.totalCandidates,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let _router: EnhancedSourceRouter | null = null;

export function getEnhancedSourceRouter(): EnhancedSourceRouter {
  if (!_router) {
    _router = new EnhancedSourceRouter();
  }
  return _router;
}

export function resetEnhancedSourceRouter(): void {
  _router = null;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick function to route sources for a context
 */
export function routeSourcesForContext(context: SourceRoutingContext): RoutingResult {
  return getEnhancedSourceRouter().routeForContext(context);
}

/**
 * Quick function to get a source bundle for a context
 */
export function getSourceBundleForContext(context: SourceRoutingContext): SourceBundle | null {
  const router = getEnhancedSourceRouter();
  const result = router.routeForContext(context);
  return router.createBundle(result);
}

/**
 * Quick function to get universal fallback
 */
export function getUniversalFallbackSource(issueType: ClicheSymptomType): LabeledSource | null {
  return getEnhancedSourceRouter().getUniversalFallback(issueType);
}
