/**
 * Scoring Rules — Single Source of Truth for Deterministic Scoring
 *
 * Central registry of all scoring thresholds, weights, and lookup tables.
 * No logic — just data. Other files import from here.
 *
 * This is Layer 3 of the cognitive decomposition architecture.
 * All constants are derived from the existing LLM prompt's scoring rubric
 * and calibrated against benchmark activities.
 *
 * Cost: $0.00 (pure data)
 */

// ============================================================================
// A. VERB QUALITY HIERARCHY — 5-tier verb classification
// ============================================================================

/**
 * Maps verb lemmas to quality tiers (1-5).
 * Sourced from the existing LLM prompt's verb hierarchy.
 *
 * Tier 5 (ELITE): Verbs showing innovation, expertise, professional-level action
 * Tier 4 (STRONG): Verbs showing leadership, initiative, clear ownership
 * Tier 3 (GOOD): Verbs showing active participation, competence
 * Tier 2 (WEAK): Verbs showing passive involvement, support roles
 * Tier 1 (POOR): Verbs showing no individual distinction
 *
 * Default for unlisted verbs: 3 (GOOD — benefit of doubt)
 */
export const VERB_QUALITY_HIERARCHY: Record<string, 1 | 2 | 3 | 4 | 5> = {
  // ELITE (tier 5)
  design: 5,
  engineer: 5,
  pioneer: 5,
  negotiate: 5,
  diagnose: 5,
  synthesize: 5,
  architect: 5,
  invent: 5,
  publish: 5,
  patent: 5,
  spearhead: 5,
  transform: 5,
  revolutionize: 5,
  conceptualize: 5,
  orchestrate: 5,

  // STRONG (tier 4)
  lead: 4,
  manage: 4,
  direct: 4,
  train: 4,
  analyze: 4,
  implement: 4,
  launch: 4,
  found: 4,
  build: 4,
  develop: 4,
  'co-author': 4,
  mentor: 4,
  establish: 4,
  produce: 4,
  secure: 4,

  // GOOD (tier 3)
  organize: 3,
  coordinate: 3,
  create: 3,
  research: 3,
  present: 3,
  teach: 3,
  facilitate: 3,
  supervise: 3,
  maintain: 3,
  operate: 3,
  conduct: 3,
  prepare: 3,
  administer: 3,

  // WEAK (tier 2)
  work: 2,
  handle: 2,
  run: 2,
  support: 2,
  assist: 2,
  contribute: 2,
  serve: 2,
  attend: 2,
  join: 2,
  provide: 2,
  follow: 2,
  complete: 2,

  // POOR (tier 1)
  participate: 1,
  involve: 1,
  help: 1,
  member: 1,
  part: 1,
  do: 1,
  go: 1,
  have: 1,
  be: 1,
};

/** Default verb tier for unlisted verbs */
export const DEFAULT_VERB_TIER: 1 | 2 | 3 | 4 | 5 = 3;

// ============================================================================
// B. DESCRIPTION DIMENSION WEIGHTS
// ============================================================================

/**
 * Weights for the 5 description scoring dimensions.
 * Total: 1.00 (100%)
 */
export const DESCRIPTION_DIMENSION_WEIGHTS = {
  roleOwnership: 0.25,
  impactEvidence: 0.25,
  differentiation: 0.20,
  actionPrecision: 0.15,
  quantification: 0.15,
} as const;

// ============================================================================
// C. ACTIVITY COMPONENT WEIGHTS
// ============================================================================

/**
 * Standard weights when leadership component IS applicable.
 * Total: 1.00 (100%)
 */
export const STANDARD_WEIGHTS = {
  tier: 0.30,
  recognition: 0.25,
  leadership: 0.125,
  community: 0.15,
  commitment: 0.175,
} as const;

/**
 * Redistributed weights when leadership component is NOT applicable.
 * Leadership weight (12.5%) redistributed proportionally across other components.
 * Total: 1.00 (100%)
 */
export const NO_LEADERSHIP_WEIGHTS = {
  tier: 0.343,
  recognition: 0.286,
  leadership: 0.00,
  community: 0.171,
  commitment: 0.20,
} as const;

// ============================================================================
// D. RECOGNITION SCOPE SCORES
// ============================================================================

/**
 * Base score (0-10) for each recognition scope level.
 */
export const RECOGNITION_SCOPE_SCORES: Record<string, number> = {
  international: 10,
  national: 9,
  state: 7,
  regional: 5.5,
  school: 3.5,
  local: 2.5,
  none: 1,
};

// ============================================================================
// E. ROLE HIERARCHY SCORES
// ============================================================================

/**
 * Base score (0-10) for each role type.
 */
export const ROLE_HIERARCHY_SCORES: Record<string, number> = {
  founder: 10,
  president_captain: 8.5,
  executive: 7.5,
  team_lead: 6,
  contributor: 4,
  participant: 2.5,
  member: 1.5,
  not_applicable: 0,
};

// ============================================================================
// F. IMPACT SCOPE SCORES
// ============================================================================

/**
 * Base score (0-10) for each impact scope level.
 */
export const IMPACT_SCOPE_SCORES: Record<string, number> = {
  national: 10,
  regional: 8,
  community: 6.5,
  organization: 5,
  team: 3.5,
  individual: 2,
  not_applicable: 0,
};

// ============================================================================
// G. COMMUNITY BENEFIT SCORES
// ============================================================================

/**
 * Base score (0-10) for community benefit level.
 */
export const COMMUNITY_BENEFIT_SCORES: Record<string, number> = {
  significant: 9,
  moderate: 6.5,
  minimal: 3.5,
  'self-focused': 1.5,
};

// ============================================================================
// H. AUTHENTICITY SIGNAL SCORES
// ============================================================================

/**
 * Score modifiers based on authenticity assessment.
 */
export const AUTHENTICITY_SIGNAL_SCORES: Record<string, number> = {
  highly_authentic: 1.5,
  genuine: 0.5,
  neutral: 0,
  resume_padding: -2.0,
};

// ============================================================================
// I. CHARACTER TRAIT BASE SCORES
// ============================================================================

/**
 * Base scores for character traits (all between 5-7).
 * The trait itself doesn't drive the score much — it's about
 * HOW the trait is demonstrated, not WHICH trait.
 */
export const CHARACTER_TRAIT_BASE_SCORES: Record<string, number> = {
  service: 6.5,
  innovation: 6,
  resilience: 7,
  curiosity: 6,
  empathy: 6.5,
  discipline: 5.5,
  creativity: 6,
  integrity: 7,
};
