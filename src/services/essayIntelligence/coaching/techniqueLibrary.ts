/**
 * Technique Library — Research-backed craft technique reference for coaching.
 *
 * Imports the 8 technique categories and their bundles from the Common App Workshop's
 * technique system, and provides a compact lookup function for the coaching prompt.
 *
 * When a finding in the essay profile matches a technique route, the coaching system
 * can look up the technique's WHY (research backing), HOW (core principles),
 * and EXAMPLES (before/after transformations) to produce more specific, teachable coaching.
 *
 * This supplements the TECHNIQUE_ROUTES in coachingService.ts (which map findings to
 * directives) with deeper pedagogical content from the Common App research base.
 */

// Lazy-loaded to avoid pulling in the full Common App Workshop at import time
let _techniqueBundles: Record<string, any> | null = null;

async function loadBundles(): Promise<Record<string, any>> {
  if (_techniqueBundles) return _techniqueBundles;

  try {
    const { TECHNIQUE_BUNDLES } = await import(
      '../../commonAppWorkshop/services/techniqueCategories'
    );
    _techniqueBundles = TECHNIQUE_BUNDLES;
    return _techniqueBundles;
  } catch (err) {
    console.warn('[TechniqueLibrary] Failed to load technique bundles:', err);
    return {};
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

export interface TechniqueTeaching {
  name: string;
  description: string;
  /** WHY this technique works (core principles, 2-3 most important) */
  why: string;
  /** HOW to apply it (when to use, integration tips) */
  how: string;
  /** EXAMPLE transformations (before → after with explanation) */
  examples: string;
  /** What NOT to do (anti-patterns) */
  avoid: string;
}

/**
 * Look up teaching content for a specific technique category.
 *
 * Categories: storytelling, technical_depth, evidence_impact, intellectual_character,
 * reflection_depth, voice_authenticity, complexity_showcase, connection_specificity
 *
 * Returns null if the technique ID is not found.
 */
export async function getTechniqueTeaching(techniqueId: string): Promise<TechniqueTeaching | null> {
  const bundles = await loadBundles();
  const bundle = bundles[techniqueId];
  if (!bundle) return null;

  // Compact the rich bundle data into a coaching-ready format
  const principles = (bundle.corePrinciples ?? []).slice(0, 3).join('. ');
  const whenToUse = (bundle.whenToUse ?? []).slice(0, 3).join('; ');
  const tips = (bundle.integrationTips ?? []).slice(0, 2).join('. ');
  const antiPatterns = (bundle.antiPatterns ?? []).slice(0, 3).join('; ');

  // Build before/after examples
  const transformations = (bundle.transformations ?? []).slice(0, 2);
  const exampleText = transformations.length > 0
    ? transformations.map((t: any) =>
        `Before: "${t.before}"\nAfter: "${t.after}"\nWhy: ${t.why_it_works}`
      ).join('\n\n')
    : 'No transformation examples available.';

  return {
    name: bundle.name ?? techniqueId,
    description: bundle.description ?? '',
    why: principles || 'See core principles in the teaching materials.',
    how: `When to use: ${whenToUse}. ${tips}`,
    examples: exampleText,
    avoid: antiPatterns || 'No specific anti-patterns documented.',
  };
}

/**
 * Get a compact coaching prompt section for a technique.
 * Returns a ~100-200 token block ready for injection into the coaching prompt.
 * Returns empty string if technique not found.
 */
export async function getTechniqueCoachingBlock(techniqueId: string): Promise<string> {
  const teaching = await getTechniqueTeaching(techniqueId);
  if (!teaching) return '';

  return `RESEARCH-BACKED TECHNIQUE: ${teaching.name}
${teaching.description}
Core principles: ${teaching.why}
Application: ${teaching.how}
Anti-patterns to avoid: ${teaching.avoid}
${teaching.examples}`;
}

/**
 * Get all available technique IDs.
 */
export async function getAvailableTechniques(): Promise<string[]> {
  const bundles = await loadBundles();
  return Object.keys(bundles);
}
