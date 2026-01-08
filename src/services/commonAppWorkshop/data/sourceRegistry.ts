/**
 * Source Registry - Scalable Deep Research Source Integration
 *
 * This module provides a centralized registry for all deep research sources,
 * enabling automatic discovery, validation, and merging of new source batches.
 *
 * ARCHITECTURE:
 * 1. Each research batch exports sources via a standardized interface
 * 2. This registry imports and validates all batches
 * 3. LABELED_SOURCES in labeledSources.ts imports from here
 * 4. SourceIndexer builds indices from the merged sources
 *
 * TO ADD NEW SOURCES:
 * 1. Create a new source file following the template (e.g., intellectualDepthSources.ts)
 * 2. Export ALL_[BATCH_NAME]_SOURCES array
 * 3. Add import and registration below
 * 4. Run validation test: npx tsx tests/test-source-integration-validation.ts
 *
 * @version 2.0
 * @date January 2025
 */

import type { LabeledSource, EnhancedLabeledSource } from '../types/labeledSourceTypes';
import { validateLabeledSource, validateSourceCollection } from '../types/labeledSourceTypes';

// ============================================================================
// RESEARCH BATCH IMPORTS
// ============================================================================

// Batch 1: Show Don't Tell (January 2025)
import { ALL_SHOW_DONT_TELL_SOURCES } from './showDontTellSources';

// Batch 2: Emotional Intelligence (January 2025)
import { ALL_EMOTIONAL_INTELLIGENCE_SOURCES } from './emotionalIntelligenceSources';

// Batch 3: Intellectual Depth & Nuance (January 2025)
import { ALL_INTELLECTUAL_DEPTH_SOURCES } from './intellectualDepthSources';

// Batch 4: Prose Quality & Voice (January 2025)
import { ALL_PROSE_QUALITY_SOURCES } from './proseQualitySources';

// Batch 5: Essay Openings & First Impressions (January 2025)
import { ESSAY_OPENINGS_SOURCES } from './essayOpeningsSources';

// Future batches (uncomment as implemented):
// import { ALL_ENDINGS_SOURCES } from './endingsSources';
// import { ALL_STRUCTURE_PACING_SOURCES } from './structurePacingSources';
// import { ALL_SPECIFICITY_SOURCES } from './specificitySources';

// ============================================================================
// RESEARCH BATCH METADATA
// ============================================================================

/**
 * Metadata for a research batch
 */
export interface ResearchBatchMetadata {
  id: string;
  name: string;
  description: string;
  perplexityPromptNumber: number;
  dateIntegrated: string;
  sourceCount: number;
  categories: string[];
  status: 'integrated' | 'pending' | 'in_progress';
}

/**
 * Registry of all research batches
 */
export const RESEARCH_BATCHES: ResearchBatchMetadata[] = [
  {
    id: 'show_dont_tell',
    name: 'Show Don\'t Tell',
    description: 'Techniques for narrative showing, sensory details, scene construction',
    perplexityPromptNumber: 1,
    dateIntegrated: '2025-01-04',
    sourceCount: ALL_SHOW_DONT_TELL_SOURCES.length,
    categories: ['showing_vs_telling', 'specificity', 'narrative_structure'],
    status: 'integrated',
  },
  {
    id: 'emotional_intelligence',
    name: 'Emotional Intelligence & Vulnerability',
    description: 'Authentic vulnerability, emotional maturity, empathy demonstration',
    perplexityPromptNumber: 2,
    dateIntegrated: '2025-01-05',
    sourceCount: ALL_EMOTIONAL_INTELLIGENCE_SOURCES.length,
    categories: ['vulnerability', 'authenticity', 'impact_on_others'],
    status: 'integrated',
  },
  {
    id: 'intellectual_depth',
    name: 'Intellectual Depth & Nuance',
    description: 'Complex thinking, nuanced arguments, intellectual sophistication, systems-level awareness',
    perplexityPromptNumber: 3,
    dateIntegrated: '2025-01-06',
    sourceCount: ALL_INTELLECTUAL_DEPTH_SOURCES.length,
    categories: ['intellectual_vitality', 'fresh_perspective', 'authenticity'],
    status: 'integrated',
  },
  {
    id: 'prose_quality',
    name: 'Prose Quality & Voice',
    description: 'Sentence-level craft, voice development, rhythm and flow',
    perplexityPromptNumber: 4,
    dateIntegrated: '2025-01-06',
    sourceCount: ALL_PROSE_QUALITY_SOURCES.length,
    categories: ['authenticity', 'showing_vs_telling', 'specificity'],
    status: 'integrated',
  },
  {
    id: 'opening_lines',
    name: 'Opening Lines & First Impressions',
    description: 'Hooks, opening strategies, first sentence craft, thin-slicing psychology, AO time constraints',
    perplexityPromptNumber: 5,
    dateIntegrated: '2025-01-08',
    sourceCount: ESSAY_OPENINGS_SOURCES.length,
    categories: ['opening_hooks', 'narrative_structure', 'specificity', 'authenticity'],
    status: 'integrated',
  },
  {
    id: 'endings',
    name: 'Endings & Conclusions',
    description: 'Closing strategies, resolution, lasting impressions',
    perplexityPromptNumber: 6,
    dateIntegrated: '',
    sourceCount: 0,
    categories: ['narrative_structure', 'vulnerability'],
    status: 'pending',
  },
  {
    id: 'structure_pacing',
    name: 'Structure & Pacing',
    description: 'Essay organization, narrative flow, scene vs summary',
    perplexityPromptNumber: 7,
    dateIntegrated: '',
    sourceCount: 0,
    categories: ['narrative_structure'],
    status: 'pending',
  },
  {
    id: 'specificity',
    name: 'The Art of Specificity',
    description: 'Concrete details, sensory precision, unique moments',
    perplexityPromptNumber: 8,
    dateIntegrated: '',
    sourceCount: 0,
    categories: ['specificity', 'showing_vs_telling'],
    status: 'pending',
  },
];

// ============================================================================
// TYPE CONVERSION
// ============================================================================

/**
 * Convert EnhancedLabeledSource to LabeledSource
 * Strips V2-specific fields while preserving base functionality
 */
export function convertToLabeledSource(source: EnhancedLabeledSource): LabeledSource {
  const {
    scope: _scope,
    context_requirements: _contextReqs,
    authority: _authority,
    advice_type: _adviceType,
    ...baseLabeledSource
  } = source;

  return baseLabeledSource as LabeledSource;
}

/**
 * Convert an array of EnhancedLabeledSources to LabeledSources
 */
export function convertBatchToLabeledSources(sources: EnhancedLabeledSource[]): LabeledSource[] {
  return sources.map(convertToLabeledSource);
}

// ============================================================================
// SOURCE AGGREGATION
// ============================================================================

/**
 * All deep research sources in their enhanced format
 * Use this when you need the full V2 metadata (scope, context_requirements, etc.)
 */
export const ALL_ENHANCED_DEEP_RESEARCH_SOURCES: EnhancedLabeledSource[] = [
  ...ALL_SHOW_DONT_TELL_SOURCES,
  ...ALL_EMOTIONAL_INTELLIGENCE_SOURCES,
  ...ALL_INTELLECTUAL_DEPTH_SOURCES,
  ...ALL_PROSE_QUALITY_SOURCES,
  ...ESSAY_OPENINGS_SOURCES,
  // Add future batches here as they're integrated:
  // ...ALL_ENDINGS_SOURCES,
  // ...ALL_STRUCTURE_PACING_SOURCES,
  // ...ALL_SPECIFICITY_SOURCES,
];

/**
 * All deep research sources converted to LabeledSource format
 * Use this for merging into LABELED_SOURCES
 */
export const ALL_DEEP_RESEARCH_SOURCES: LabeledSource[] =
  convertBatchToLabeledSources(ALL_ENHANCED_DEEP_RESEARCH_SOURCES);

// ============================================================================
// REGISTRY FUNCTIONS
// ============================================================================

/**
 * Get sources from a specific research batch
 */
export function getSourcesByBatch(batchId: string): EnhancedLabeledSource[] {
  switch (batchId) {
    case 'show_dont_tell':
      return ALL_SHOW_DONT_TELL_SOURCES;
    case 'emotional_intelligence':
      return ALL_EMOTIONAL_INTELLIGENCE_SOURCES;
    case 'intellectual_depth':
      return ALL_INTELLECTUAL_DEPTH_SOURCES;
    case 'prose_quality':
      return ALL_PROSE_QUALITY_SOURCES;
    case 'opening_lines':
      return ESSAY_OPENINGS_SOURCES;
    // Add future batches:
    default:
      return [];
  }
}

/**
 * Get batch metadata by ID
 */
export function getBatchMetadata(batchId: string): ResearchBatchMetadata | undefined {
  return RESEARCH_BATCHES.find(b => b.id === batchId);
}

/**
 * Get all integrated batches
 */
export function getIntegratedBatches(): ResearchBatchMetadata[] {
  return RESEARCH_BATCHES.filter(b => b.status === 'integrated');
}

/**
 * Get all pending batches (research needed)
 */
export function getPendingBatches(): ResearchBatchMetadata[] {
  return RESEARCH_BATCHES.filter(b => b.status === 'pending');
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate all sources in the registry
 * Run this after adding new sources to ensure quality
 */
export function validateRegistry(): {
  valid: boolean;
  totalSources: number;
  byBatch: Record<string, { count: number; valid: boolean; errors: string[] }>;
  duplicateIds: string[];
} {
  const results: Record<string, { count: number; valid: boolean; errors: string[] }> = {};
  const allIds: string[] = [];
  const duplicates: string[] = [];

  // Validate each batch
  for (const batch of getIntegratedBatches()) {
    const sources = getSourcesByBatch(batch.id);
    const converted = convertBatchToLabeledSources(sources);
    const validation = validateSourceCollection(converted);

    results[batch.id] = {
      count: sources.length,
      valid: validation.valid,
      errors: validation.failed.flatMap(f => f.errors),
    };

    // Track IDs for duplicate detection
    for (const source of sources) {
      if (allIds.includes(source.source_id)) {
        duplicates.push(source.source_id);
      } else {
        allIds.push(source.source_id);
      }
    }
  }

  const allValid = Object.values(results).every(r => r.valid) && duplicates.length === 0;

  return {
    valid: allValid,
    totalSources: ALL_DEEP_RESEARCH_SOURCES.length,
    byBatch: results,
    duplicateIds: duplicates,
  };
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get comprehensive statistics about the source registry
 */
export function getRegistryStats(): {
  total: number;
  byBatch: Record<string, number>;
  byCategory: Record<string, number>;
  byAuthority: Record<string, number>;
  byScope: Record<string, number>;
  integratedBatches: number;
  pendingBatches: number;
} {
  const byBatch: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const byAuthority: Record<string, number> = {};
  const byScope: Record<string, number> = {};

  // Count by batch
  for (const batch of getIntegratedBatches()) {
    byBatch[batch.id] = batch.sourceCount;
  }

  // Count by category, authority, scope
  for (const source of ALL_ENHANCED_DEEP_RESEARCH_SOURCES) {
    // Category
    const cat = source.taxonomy.primary_category;
    byCategory[cat] = (byCategory[cat] || 0) + 1;

    // Authority
    const auth = source.authority;
    byAuthority[auth] = (byAuthority[auth] || 0) + 1;

    // Scope
    const scope = source.scope.level;
    byScope[scope] = (byScope[scope] || 0) + 1;
  }

  return {
    total: ALL_DEEP_RESEARCH_SOURCES.length,
    byBatch,
    byCategory,
    byAuthority,
    byScope,
    integratedBatches: getIntegratedBatches().length,
    pendingBatches: getPendingBatches().length,
  };
}

// ============================================================================
// EXPORTS FOR EXTERNAL USE
// ============================================================================

export {
  ALL_SHOW_DONT_TELL_SOURCES,
  ALL_EMOTIONAL_INTELLIGENCE_SOURCES,
  ALL_INTELLECTUAL_DEPTH_SOURCES,
  ALL_PROSE_QUALITY_SOURCES,
  ESSAY_OPENINGS_SOURCES,
};
