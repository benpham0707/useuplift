/**
 * Signal Matcher — Pattern Matching Utility for Expertise Signaling Library
 *
 * Matches activity descriptions and extracted features against the expertise
 * signaling library to detect real expertise signals, name-drop traps, and
 * proof-of-work patterns.
 *
 * Cost: $0.00 (pure TypeScript, no LLM calls)
 * Latency: <1ms per activity
 *
 * Used by:
 * - Description Rule Scorer (authenticity/differentiation adjustments)
 * - Nuance Calibration Service (field-specific context)
 * - Expert System Prompts (teaching context injection)
 */

import type {
  ExpertiseDomain,
  ExpertiseSignal,
  NameDropTrap,
  ProofOfWorkPattern,
  DescriptionTransform,
  ExpertiseMatchResult,
  ExpertiseTeachingContext,
  RoleExpertise,
} from './types';
import type { ExtractedDescriptionFeatures } from '../featureTypes';

// ============================================================================
// CORE MATCHING ENGINE
// ============================================================================

/**
 * Match a description against expertise patterns for a given domain.
 * Returns detected signals, traps, proofs, and scoring adjustments.
 *
 * @param description - The activity description text (up to 150 chars)
 * @param features - Extracted description features (from feature extractor)
 * @param domain - The expertise domain to match against
 * @param role - Optional role/position for role-specific matching
 * @returns ExpertiseMatchResult with detected patterns and scoring adjustments
 */
export function matchExpertiseSignals(
  description: string,
  features: ExtractedDescriptionFeatures,
  domain: ExpertiseDomain,
  role?: string,
): ExpertiseMatchResult {
  const descLower = description.toLowerCase();

  // Collect all text to search (description + extracted verb contexts + impact chains)
  const searchableTexts = buildSearchableTexts(description, features);

  // Match signals
  const detectedSignals = matchSignals(searchableTexts, domain.realExpertiseSignals);

  // Match traps
  const detectedTraps = matchTraps(searchableTexts, descLower, domain.nameDropTraps);

  // Match proofs
  const detectedProofs = matchProofs(searchableTexts, domain.proofOfWorkPatterns);

  // Find applicable transforms
  const applicableTransforms = findApplicableTransforms(
    descLower,
    features,
    domain.descriptionTransforms,
  );

  // Calculate overall assessment
  const assessment = calculateAssessment(detectedSignals, detectedTraps, detectedProofs);

  return {
    domainId: domain.domainId,
    confidence: calculateMatchConfidence(detectedSignals, detectedTraps, detectedProofs),
    detectedSignals,
    detectedTraps,
    detectedProofs,
    applicableTransforms,
    assessment,
  };
}

/**
 * Build teaching context from the expertise signaling library.
 * This is injected into teaching prompts for field-specific guidance.
 *
 * @param domain - The matched expertise domain
 * @param matchResult - The expertise match result for this activity
 * @param role - The student's role/position
 * @returns ExpertiseTeachingContext for prompt injection
 */
export function buildExpertiseTeachingContext(
  domain: ExpertiseDomain,
  matchResult: ExpertiseMatchResult,
  role?: string,
): ExpertiseTeachingContext {
  // Find role-specific expectations
  const roleExpectations = role
    ? findRoleExpertise(role, domain.roleExpertise)
    : undefined;

  // Get traps relevant to this student (both detected and common ones)
  const trapsToAvoid = domain.nameDropTraps
    .filter(trap => trap.prevalence === 'very_common' || trap.prevalence === 'common')
    .map(trap => ({
      trap,
      inStudentDescription: matchResult.detectedTraps.some(dt => dt.trap.id === trap.id),
    }));

  // Get relevant transforms (prioritize ones that match detected traps)
  const relevantTransforms = matchResult.applicableTransforms.length > 0
    ? matchResult.applicableTransforms
    : domain.descriptionTransforms.slice(0, 5); // Fallback: top 5 generic transforms

  // Get power verbs for this field
  const powerVerbTier = domain.verbHierarchy.find(vh => vh.tier === 'power');
  const powerVerbs = powerVerbTier?.verbs ?? [];

  // Get proof-of-work patterns relevant to the student's level
  const proofPatterns = domain.proofOfWorkPatterns.slice(0, 5);

  return {
    domainId: domain.domainId,
    domainLabel: domain.label,
    aoExpectations: domain.aoExpectations,
    trapsToAvoid,
    relevantTransforms,
    powerVerbs,
    roleExpectations,
    proofPatterns,
  };
}

// ============================================================================
// INTERNAL MATCHING FUNCTIONS
// ============================================================================

/**
 * Build a collection of searchable text fragments from description and features.
 */
function buildSearchableTexts(
  description: string,
  features: ExtractedDescriptionFeatures,
): string[] {
  const texts: string[] = [description.toLowerCase()];

  // Add verb contexts
  for (const verb of features.verbs) {
    texts.push(verb.context.toLowerCase());
  }

  // Add impact chain actions and outcomes
  for (const chain of features.impact.causalChains) {
    texts.push(chain.action.toLowerCase());
    texts.push(chain.outcome.toLowerCase());
  }

  // Add unique details
  for (const detail of features.differentiation.uniqueDetails) {
    texts.push(detail.toLowerCase());
  }

  // Add authenticity markers
  for (const marker of features.authenticity.authenticityMarkers) {
    texts.push(marker.toLowerCase());
  }

  return texts;
}

/**
 * Match real expertise signals against searchable texts.
 */
function matchSignals(
  searchableTexts: string[],
  signals: ExpertiseSignal[],
): ExpertiseMatchResult['detectedSignals'] {
  const results: ExpertiseMatchResult['detectedSignals'] = [];

  for (const signal of signals) {
    const matchedKeywords: string[] = [];
    let totalMatchStrength = 0;
    let matchCount = 0;

    for (const keyword of signal.detectionKeywords) {
      const keywordLower = keyword.toLowerCase();
      for (const text of searchableTexts) {
        if (text.includes(keywordLower)) {
          if (!matchedKeywords.includes(keyword)) {
            matchedKeywords.push(keyword);
          }
          matchCount++;
          break; // Only count each keyword once across texts
        }
      }
    }

    if (matchedKeywords.length > 0) {
      // Match strength = proportion of keywords matched, weighted by signal strength
      const keywordRatio = matchedKeywords.length / signal.detectionKeywords.length;
      const strengthMultiplier = signal.signalStrength === 'strong' ? 1.0
        : signal.signalStrength === 'moderate' ? 0.7
          : 0.4;
      totalMatchStrength = Math.min(1, keywordRatio * strengthMultiplier * 1.5);

      results.push({
        signal,
        matchedKeywords,
        matchStrength: Math.round(totalMatchStrength * 100) / 100,
      });
    }
  }

  // Sort by match strength descending
  return results.sort((a, b) => b.matchStrength - a.matchStrength);
}

/**
 * Match name-drop traps against searchable texts.
 */
function matchTraps(
  searchableTexts: string[],
  descLower: string,
  traps: NameDropTrap[],
): ExpertiseMatchResult['detectedTraps'] {
  const results: ExpertiseMatchResult['detectedTraps'] = [];

  for (const trap of traps) {
    const matchedKeywords: string[] = [];

    for (const keyword of trap.detectionKeywords) {
      const keywordLower = keyword.toLowerCase();
      // Check primarily against the raw description for traps
      if (descLower.includes(keywordLower)) {
        if (!matchedKeywords.includes(keyword)) {
          matchedKeywords.push(keyword);
        }
      }
    }

    if (matchedKeywords.length > 0) {
      // Estimate character waste based on matched keywords in the description
      let charWaste = 0;
      for (const keyword of matchedKeywords) {
        const idx = descLower.indexOf(keyword.toLowerCase());
        if (idx >= 0) {
          charWaste += keyword.length;
        }
      }
      // Cap at the trap's typical waste
      charWaste = Math.min(charWaste, trap.typicalCharWaste);

      results.push({
        trap,
        matchedKeywords,
        charWaste,
      });
    }
  }

  return results;
}

/**
 * Match proof-of-work patterns against searchable texts.
 */
function matchProofs(
  searchableTexts: string[],
  proofs: ProofOfWorkPattern[],
): ExpertiseMatchResult['detectedProofs'] {
  const results: ExpertiseMatchResult['detectedProofs'] = [];

  for (const proof of proofs) {
    // Proof patterns are harder to detect by keyword — they're more about
    // the STRUCTURE of what's described. We look for conceptual matches
    // using the proof's examples as keyword sources.
    const matchedKeywords: string[] = [];

    // Extract keywords from proof examples
    const proofKeywords = extractKeywordsFromExamples(proof.examples);

    for (const keyword of proofKeywords) {
      for (const text of searchableTexts) {
        if (text.includes(keyword.toLowerCase())) {
          if (!matchedKeywords.includes(keyword)) {
            matchedKeywords.push(keyword);
          }
          break;
        }
      }
    }

    // Require at least 2 keyword matches for proof detection (higher bar)
    if (matchedKeywords.length >= 2) {
      results.push({
        proof,
        matchedKeywords,
      });
    }
  }

  return results;
}

/**
 * Find description transforms applicable to this activity.
 */
function findApplicableTransforms(
  descLower: string,
  features: ExtractedDescriptionFeatures,
  transforms: DescriptionTransform[],
): DescriptionTransform[] {
  const applicable: DescriptionTransform[] = [];

  for (const transform of transforms) {
    const beforeLower = transform.before.toLowerCase();

    // Direct match: the "before" text appears in the description
    if (descLower.includes(beforeLower.slice(0, 20))) {
      applicable.push(transform);
      continue;
    }

    // Pattern match based on transform type
    switch (transform.transformType) {
      case 'name_drop_to_impact':
        // Check if description has technology names without impact context
        if (features.authenticity.overclaiming.length > 0 ||
            features.differentiation.genericPhrases.length > 2) {
          applicable.push(transform);
        }
        break;

      case 'generic_to_specific':
        // Check if description lacks specificity
        if (!features.differentiation.passesThousandStudentTest) {
          applicable.push(transform);
        }
        break;

      case 'passive_to_active':
        // Check for weak verbs
        if (features.verbs.some(v => !v.isIndividualAction)) {
          applicable.push(transform);
        }
        break;

      case 'claim_to_evidence':
        // Check for unsupported claims
        if (features.impact.unsupportedClaims.length > 0) {
          applicable.push(transform);
        }
        break;

      case 'jargon_to_outcome':
        // Check for jargon without context
        if (features.numbers.some(n => !n.hasContext) ||
            features.differentiation.genericPhrases.length > 1) {
          applicable.push(transform);
        }
        break;

      case 'duty_to_achievement':
        // Check for role restating or lack of impact
        if (features.characterEfficiency.restatesPosition ||
            !features.impact.hasMeasurableOutcome) {
          applicable.push(transform);
        }
        break;
    }
  }

  // Deduplicate and limit to top 8
  const unique = applicable.filter((t, i, arr) =>
    arr.findIndex(a => a.id === t.id) === i
  );
  return unique.slice(0, 8);
}

/**
 * Calculate overall expertise assessment from detected patterns.
 */
function calculateAssessment(
  detectedSignals: ExpertiseMatchResult['detectedSignals'],
  detectedTraps: ExpertiseMatchResult['detectedTraps'],
  detectedProofs: ExpertiseMatchResult['detectedProofs'],
): ExpertiseMatchResult['assessment'] {
  // Calculate net expertise score (-5 to +5)
  let score = 0;

  // Positive: real expertise signals
  for (const ds of detectedSignals) {
    const strength = ds.signal.signalStrength === 'strong' ? 1.5
      : ds.signal.signalStrength === 'moderate' ? 1.0
        : 0.5;
    score += strength * ds.matchStrength;
  }

  // Positive: proof-of-work patterns
  score += detectedProofs.length * 0.5;

  // Negative: name-drop traps
  for (const dt of detectedTraps) {
    const penalty = dt.trap.prevalence === 'very_common' ? -1.0
      : dt.trap.prevalence === 'common' ? -0.7
        : -0.4;
    score += penalty;
  }

  // Clamp to [-5, 5]
  score = Math.max(-5, Math.min(5, Math.round(score * 10) / 10));

  // Calculate scoring adjustments
  const authenticityModifier = calculateDimensionModifier(
    detectedSignals.filter(s => s.signal.affectsDimension === 'authenticity'),
    detectedTraps,
  );

  const differentiationModifier = calculateDimensionModifier(
    detectedSignals.filter(s => s.signal.affectsDimension === 'differentiation'),
    detectedTraps,
  );

  const specificityModifier = calculateDimensionModifier(
    detectedSignals.filter(s => s.signal.affectsDimension === 'specificity'),
    detectedTraps,
  );

  // Generate summary
  const summary = generateAssessmentSummary(score, detectedSignals, detectedTraps, detectedProofs);

  return {
    expertiseScore: score,
    summary,
    scoringAdjustments: {
      authenticityModifier: clampModifier(authenticityModifier),
      differentiationModifier: clampModifier(differentiationModifier),
      specificityModifier: clampModifier(specificityModifier),
    },
  };
}

/**
 * Calculate a scoring modifier for a specific dimension.
 */
function calculateDimensionModifier(
  relevantSignals: ExpertiseMatchResult['detectedSignals'],
  detectedTraps: ExpertiseMatchResult['detectedTraps'],
): number {
  let modifier = 0;

  // Positive from signals
  for (const ds of relevantSignals) {
    modifier += ds.matchStrength * 0.3;
  }

  // Negative from traps (spread across dimensions)
  modifier -= detectedTraps.length * 0.15;

  return modifier;
}

/**
 * Clamp a modifier to [-1, 1] range.
 */
function clampModifier(value: number): number {
  return Math.max(-1, Math.min(1, Math.round(value * 100) / 100));
}

/**
 * Calculate match confidence based on how many patterns were detected.
 */
function calculateMatchConfidence(
  detectedSignals: ExpertiseMatchResult['detectedSignals'],
  detectedTraps: ExpertiseMatchResult['detectedTraps'],
  detectedProofs: ExpertiseMatchResult['detectedProofs'],
): 'high' | 'medium' | 'low' {
  const totalMatches = detectedSignals.length + detectedTraps.length + detectedProofs.length;

  if (totalMatches >= 4) return 'high';
  if (totalMatches >= 2) return 'medium';
  return 'low';
}

/**
 * Generate a human-readable summary of the expertise assessment.
 */
function generateAssessmentSummary(
  score: number,
  detectedSignals: ExpertiseMatchResult['detectedSignals'],
  detectedTraps: ExpertiseMatchResult['detectedTraps'],
  detectedProofs: ExpertiseMatchResult['detectedProofs'],
): string {
  if (score >= 3) {
    return `Strong expertise signaling: ${detectedSignals.length} real expertise signals and ${detectedProofs.length} proof-of-work patterns detected. Description communicates genuine depth.`;
  }
  if (score >= 1) {
    const trapNote = detectedTraps.length > 0
      ? ` ${detectedTraps.length} name-drop trap(s) reduce signal quality.`
      : '';
    return `Moderate expertise signaling: ${detectedSignals.length} expertise signals detected.${trapNote} Description shows some depth but could be more specific.`;
  }
  if (score >= -1) {
    return `Mixed signaling: ${detectedSignals.length} expertise signals offset by ${detectedTraps.length} name-drop traps. Description uses jargon without demonstrating depth.`;
  }
  if (score >= -3) {
    return `Weak signaling: ${detectedTraps.length} name-drop traps detected with few genuine expertise signals. Description relies on impressive-sounding words rather than demonstrated impact.`;
  }
  return `Name-dropping dominant: ${detectedTraps.length} filler patterns detected. Description wastes characters on jargon that communicates nothing to admissions officers.`;
}

/**
 * Extract meaningful keywords from proof-of-work examples.
 * Used for loose matching against descriptions.
 */
function extractKeywordsFromExamples(examples: string[]): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
    'those', 'my', 'your', 'our', 'their', 'its', 'i', 'we', 'you',
    'they', 'he', 'she', 'it', 'not', 'no', 'all', 'each', 'every',
    'both', 'few', 'more', 'most', 'other', 'some', 'such', 'than',
    'too', 'very', 'just', 'also', 'only', 'about', 'after', 'before',
  ]);

  const keywords: string[] = [];

  for (const example of examples) {
    const words = example.toLowerCase().split(/\s+/);
    for (const word of words) {
      const cleaned = word.replace(/[^a-z0-9-]/g, '');
      if (cleaned.length > 3 && !stopWords.has(cleaned) && !keywords.includes(cleaned)) {
        keywords.push(cleaned);
      }
    }
  }

  return keywords;
}

// ============================================================================
// ROLE MATCHING
// ============================================================================

/**
 * Find the best-matching role expertise for a given role string.
 */
function findRoleExpertise(
  role: string,
  roleExpertiseList: RoleExpertise[],
): RoleExpertise | undefined {
  const roleLower = role.toLowerCase();

  // Exact match first
  const exactMatch = roleExpertiseList.find(
    re => re.role.toLowerCase() === roleLower,
  );
  if (exactMatch) return exactMatch;

  // Partial match — find the role with the most keyword overlap
  let bestMatch: RoleExpertise | undefined;
  let bestScore = 0;

  for (const roleExp of roleExpertiseList) {
    const roleWords = roleExp.role.toLowerCase().split(/\s+/);
    const inputWords = roleLower.split(/\s+/);

    let matchScore = 0;
    for (const rw of roleWords) {
      for (const iw of inputWords) {
        if (rw.includes(iw) || iw.includes(rw)) {
          matchScore++;
        }
      }
    }

    if (matchScore > bestScore) {
      bestScore = matchScore;
      bestMatch = roleExp;
    }
  }

  return bestScore > 0 ? bestMatch : undefined;
}

// ============================================================================
// BATCH MATCHING
// ============================================================================

/**
 * Match multiple activities against the expertise library in batch.
 * Used by the scoring orchestrator for efficiency.
 *
 * @param activities - Array of { description, features, domainId, role }
 * @param domainRegistry - Map of domainId → ExpertiseDomain
 * @returns Map of activityId → ExpertiseMatchResult
 */
export function batchMatchExpertiseSignals(
  activities: Array<{
    activityId: string;
    description: string;
    features: ExtractedDescriptionFeatures;
    domainId: string;
    role?: string;
  }>,
  domainRegistry: Map<string, ExpertiseDomain>,
): Map<string, ExpertiseMatchResult> {
  const results = new Map<string, ExpertiseMatchResult>();

  for (const activity of activities) {
    const domain = domainRegistry.get(activity.domainId);
    if (!domain) {
      // No matching domain — return minimal result
      results.set(activity.activityId, {
        domainId: activity.domainId,
        confidence: 'low',
        detectedSignals: [],
        detectedTraps: [],
        detectedProofs: [],
        applicableTransforms: [],
        assessment: {
          expertiseScore: 0,
          summary: 'No matching expertise domain found for this activity type.',
          scoringAdjustments: {
            authenticityModifier: 0,
            differentiationModifier: 0,
            specificityModifier: 0,
          },
        },
      });
      continue;
    }

    results.set(
      activity.activityId,
      matchExpertiseSignals(activity.description, activity.features, domain, activity.role),
    );
  }

  return results;
}
