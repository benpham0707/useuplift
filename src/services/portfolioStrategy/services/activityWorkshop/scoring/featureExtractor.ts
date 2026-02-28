/**
 * Feature Extractor — Layer 1 of the Cognitive Decomposition Architecture
 *
 * Uses Haiku to extract structured features from activity descriptions.
 * This is PURE EXTRACTION — no scoring, no judgment, no tier classification.
 *
 * The prompt asks "what is present?" never "how good is it?"
 *
 * KEY DESIGN DECISIONS:
 * 1. One Haiku call per activity (parallel) — no batching cross-contamination
 * 2. Extraction is near-deterministic — LLMs almost never disagree on what's present
 * 3. Output feeds BOTH description scoring (Layer 2) and tier classification (Layer 2)
 * 4. Cheap: ~$0.001 per activity with Haiku
 * 5. Fast: ~1-2s per call, all parallel = ~2s total for 10 activities
 *
 * Cost: ~$0.01 for 10 activities (Haiku)
 * Latency: ~2s (all parallel)
 */

import { callClaude, type ClaudeResponse } from '@/lib/llm/claude';
import { tryParseClaudeJSON } from '../../../../commonAppWorkshop/utils/jsonParser';
import type { ExtractedEvidence } from './types';
import type {
  ActivityFeatureExtraction,
  BatchFeatureExtractionInput,
  BatchFeatureExtractionResult,
  ExtractedDescriptionFeatures,
  ExtractedVerb,
  ExtractedNumber,
  RoleOwnershipSignals,
  ImpactSignals,
  DifferentiationSignals,
  CharacterEfficiency,
  AuthenticitySignals,
} from './featureTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

/** Estimated cost per Haiku call for budgeting */
const ESTIMATED_COST_PER_CALL = 0.001;

// ============================================================================
// EXTRACTION PROMPT
// ============================================================================

/**
 * Build the system prompt for feature extraction.
 *
 * CRITICAL: This prompt asks ONLY for extraction, never for judgment.
 * Every instruction is phrased as "identify" / "list" / "extract" —
 * never "evaluate" / "score" / "assess quality".
 */
function buildExtractionSystemPrompt(charLimit: number): string {
  return `You are a precise text analysis tool. Your job is to EXTRACT structured features from a college activity description. You do NOT judge, score, or evaluate quality — you only identify what is present in the text.

TASK: Given an activity description (max ${charLimit} characters) plus metadata (title, role, hours, etc.), extract ALL features into the JSON schema below.

RULES:
1. EXTRACT, don't judge. "Founded" is a verb you list — don't say it's "strong" or "elite."
2. Be exhaustive. Every verb, every number, every signal. Miss nothing.
3. Be literal. Quote exact phrases from the description when populating fields.
4. Context matters. Use the title, role, hours, achievements, and student context to inform extraction — but still only extract what IS there, not what SHOULD be there.
5. For fields requiring classification (scope level, role type, etc.), pick the most accurate option based on the evidence present. If unclear, use the lowest applicable level.

OUTPUT FORMAT (strict JSON):
{
  "descriptionFeatures": {
    "verbs": [
      {
        "verb": "<exact verb as it appears>",
        "lemma": "<base form: 'organizing' → 'organize'>",
        "context": "<the phrase containing this verb, max 15 words>",
        "isIndividualAction": <true if the student did this, false if team/org>
      }
    ],
    "numbers": [
      {
        "rawValue": "<as it appears: '200', '$12K', '93%'>",
        "numericValue": <number: 200, 12000, 93>,
        "unit": "<what it measures: 'students', 'dollars', 'percent improvement'>",
        "hasContext": <true if the number has explanation of significance>,
        "isMeaningful": <true if it demonstrates scale/impact, false if vanity ('attended 10 meetings')>,
        "vanityReason": "<only if isMeaningful=false: explain why>"
      }
    ],
    "roleOwnership": {
      "individualPhrases": ["<exact phrases showing individual action>"],
      "teamPhrases": ["<exact phrases showing team/org attribution>"],
      "usesFirstPerson": <true if 'I', 'my', 'me' appear>,
      "firstPersonInstances": ["<exact instances>"],
      "roleClearFromDescription": <true if reader knows student's role without reading position field>
    },
    "impact": {
      "causalChains": [
        {
          "action": "<what the student did>",
          "outcome": "<what resulted>",
          "hasExternalValidation": <true if outcome validated by others (adopted by school, published, etc.)>
        }
      ],
      "unsupportedClaims": ["<impact claims without evidence: 'made a positive impact'>"],
      "hasMeasurableOutcome": <true if any outcome is quantified or objectively observable>
    },
    "differentiation": {
      "uniqueDetails": ["<details specific to THIS student that others couldn't write>"],
      "genericPhrases": ["<phrases any student in this role could write>"],
      "passesThousandStudentTest": <true if description could NOT be written by 1000 other students in same role>,
      "standoutElement": "<the single most unique thing, or null>"
    },
    "characterEfficiency": {
      "totalChars": <character count of description>,
      "charLimit": ${charLimit},
      "utilizationRate": <totalChars / charLimit as decimal>,
      "wastedPatterns": [
        {
          "pattern": "<type: 'first_person', 'spelled_out_and', 'full_sentence', 'restates_position', 'filler_phrase'>",
          "example": "<the exact text>",
          "charsSaved": <how many chars could be saved>
        }
      ],
      "usesFragments": <true if description uses efficient fragment style, false if full sentences>,
      "restatesPosition": <true if description repeats role/title already in position field>
    },
    "authenticity": {
      "overclaiming": [
        {
          "claim": "<the claim>",
          "reason": "<why it seems disproportionate>"
        }
      ],
      "authenticityMarkers": ["<specific details suggesting genuine experience>"],
      "readsAsAIGenerated": <true if description has hallmarks of AI resume bullets>
    },
    "detectedActivityType": "<one of: stem_research, stem_competition, coding_engineering, leadership_government, community_service, work_employment, family_responsibility, arts_creative, athletics, academic, other>"
  },
  "activityEvidence": {
    "scope": {
      "level": "<school|local|regional|state|national|international>",
      "confidence": <0.0-1.0>,
      "evidence": "<quote or reasoning>"
    },
    "recognitions": [
      {
        "name": "<award/recognition name>",
        "level": "<school|local|regional|state|national|international>",
        "isVerifiable": <true if this is a known, real award/competition>,
        "selectivityContext": "<'top 500 of 300K' if extractable, null otherwise>"
      }
    ],
    "role": {
      "title": "<role title from position field or description>",
      "type": "<founder|president_captain|executive|team_lead|contributor|participant|member>",
      "isLeadershipApplicable": <false for solo research, individual competitions, personal projects>,
      "evidence": "<quote supporting role classification>"
    },
    "impact": {
      "hasQuantifiedOutcomes": <true if any outcome has a number>,
      "metrics": [
        {
          "value": "<the metric value>",
          "unit": "<what it measures>",
          "context": "<how it's used>",
          "isVerifiable": <true if externally checkable>
        }
      ],
      "estimatedPeopleReached": <number or null>,
      "tangibleOutcomes": ["<concrete results>"]
    },
    "commitment": {
      "yearsActive": <from metadata or description>,
      "hoursPerWeek": <from metadata>,
      "weeksPerYear": <from metadata>,
      "showsProgression": <true if growth in responsibility evident>,
      "progressionArc": "<'member → captain → mentor' or null>",
      "sustainedThroughJunior": <true if grade 11 included>
    },
    "character": {
      "primaryTrait": "<service|innovation|resilience|curiosity|empathy|discipline|creativity|integrity>",
      "communityBenefit": "<significant|moderate|minimal|self-focused>",
      "authenticitySignals": ["<specific details suggesting genuine engagement>"],
      "paddingSignals": ["<red flags suggesting resume inflation>"]
    },
    "categoryMatch": {
      "category": "<best matching category from: stem_research, leadership, community_service, work_employment, family_obligations, arts_creative, athletics, academic_clubs, entrepreneurship>",
      "confidence": "<high|medium|low>"
    },
    "overallSignalStrength": "<strong|moderate|weak>"
  }
}

IMPORTANT:
- Empty arrays [] are fine when nothing matches.
- null is fine for optional fields when no data exists.
- Be conservative with confidence scores — only 0.8+ when evidence is explicit.
- For recognitions, only mark isVerifiable=true for well-known awards/competitions.
- For estimatedPeopleReached, only provide a number if explicitly stated or clearly implied.

RECOGNITION GUIDANCE:
- Published academic papers (IEEE, Nature, Science, journal/conference proceedings) are NATIONAL-level recognitions. Mark isVerifiable=true.
- Poster presentations at national conferences (AHA, SfN, ACS, AGU) are NATIONAL-level recognitions. Mark isVerifiable=true.
- Research conducted at named university labs (Stanford, MIT, Johns Hopkins, etc.) implies at minimum REGIONAL scope, usually NATIONAL.
- AIME qualifier, USAMO, Intel STS, Regeneron STS, Science Olympiad nationals, DECA nationals — these are NATIONAL, isVerifiable=true.
- Include ACHIEVEMENTS metadata as recognitions even when not mentioned in the description text.
- When achievements include a "level" field, trust that level classification.`;
}

/**
 * Build the user prompt for a single activity extraction.
 */
function buildExtractionUserPrompt(
  activity: BatchFeatureExtractionInput['activities'][0],
  studentContext?: BatchFeatureExtractionInput['studentContext']
): string {
  const parts: string[] = [];

  parts.push(`ACTIVITY: ${activity.title}`);
  if (activity.role) parts.push(`POSITION: ${activity.role}`);
  if (activity.organization) parts.push(`ORGANIZATION: ${activity.organization}`);
  if (activity.category) parts.push(`CATEGORY: ${activity.category}`);

  const timeInfo: string[] = [];
  if (activity.hoursPerWeek) timeInfo.push(`${activity.hoursPerWeek} hrs/week`);
  if (activity.weeksPerYear) timeInfo.push(`${activity.weeksPerYear} weeks/year`);
  if (activity.yearsInvolved) timeInfo.push(`${activity.yearsInvolved} years`);
  if (timeInfo.length > 0) parts.push(`TIME: ${timeInfo.join(', ')}`);

  if (activity.gradeLevels && activity.gradeLevels.length > 0) {
    parts.push(`GRADES: ${activity.gradeLevels.join(', ')}`);
  }
  if (activity.isPaid !== undefined) parts.push(`PAID: ${activity.isPaid ? 'Yes' : 'No'}`);

  if (activity.achievements && activity.achievements.length > 0) {
    const achievementStrs = activity.achievements.map(a => {
      let s = a.title;
      if (a.level) s += ` (${a.level})`;
      if (a.date) s += ` [${a.date}]`;
      return s;
    });
    parts.push(`ACHIEVEMENTS: ${achievementStrs.join('; ')}`);
  }

  parts.push(`\nDESCRIPTION (${activity.description.length} characters):\n"${activity.description}"`);

  if (studentContext) {
    const ctxParts: string[] = [];
    if (studentContext.intendedMajor) ctxParts.push(`Major: ${studentContext.intendedMajor}`);
    if (studentContext.gradeLevel) ctxParts.push(`Grade: ${studentContext.gradeLevel}`);
    if (studentContext.firstGen) ctxParts.push('First-generation');
    if (studentContext.lowIncome) ctxParts.push('Low-income');
    if (studentContext.rural) ctxParts.push('Rural');
    if (studentContext.workFamilyObligations) ctxParts.push('Work/family obligations');
    if (ctxParts.length > 0) {
      parts.push(`\nSTUDENT CONTEXT: ${ctxParts.join(', ')}`);
    }
  }

  parts.push('\nExtract all features into the JSON format specified. Be exhaustive and literal.');

  return parts.join('\n');
}

// ============================================================================
// RESPONSE PARSING & VALIDATION
// ============================================================================

/**
 * Parse and validate the Haiku extraction response.
 * Fills in sensible defaults for any missing fields to ensure type safety.
 */
function parseExtractionResponse(
  raw: string,
  activityId: string,
  activityTitle: string,
  activity: BatchFeatureExtractionInput['activities'][0],
  charLimit: number
): ActivityFeatureExtraction | null {
  const parsed = tryParseClaudeJSON<Record<string, unknown>>(raw, 'FeatureExtractor');
  if (!parsed) {
    console.error(`[FeatureExtractor] Failed to parse JSON for activity ${activityId}`);
    return null;
  }

  const desc = (parsed.descriptionFeatures ?? {}) as Record<string, unknown>;
  const ev = (parsed.activityEvidence ?? {}) as Record<string, unknown>;

  // --- Description Features ---
  const descriptionFeatures = parseDescriptionFeatures(desc, activityId, activity, charLimit);

  // --- Activity Evidence ---
  const activityEvidence = parseActivityEvidence(ev, activity);

  return {
    activityId,
    activityTitle,
    descriptionFeatures,
    activityEvidence,
    metadata: {
      extractedAt: new Date().toISOString(),
      modelUsed: HAIKU_MODEL,
      tokensUsed: { input: 0, output: 0 }, // Will be filled by caller
      cost: 0,
      signalDensity: mapSignalStrengthToDensity(activityEvidence.overallSignalStrength),
    },
  };
}

/**
 * Parse description features from raw extraction, with defaults for missing fields.
 */
function parseDescriptionFeatures(
  desc: Record<string, unknown>,
  activityId: string,
  activity: BatchFeatureExtractionInput['activities'][0],
  charLimit: number
): ExtractedDescriptionFeatures {
  const rawVerbs = Array.isArray(desc.verbs) ? desc.verbs : [];
  const rawNumbers = Array.isArray(desc.numbers) ? desc.numbers : [];
  const rawRoleOwnership = (desc.roleOwnership ?? {}) as Record<string, unknown>;
  const rawImpact = (desc.impact ?? {}) as Record<string, unknown>;
  const rawDiff = (desc.differentiation ?? {}) as Record<string, unknown>;
  const rawCharEff = (desc.characterEfficiency ?? {}) as Record<string, unknown>;
  const rawAuth = (desc.authenticity ?? {}) as Record<string, unknown>;

  const verbs: ExtractedVerb[] = rawVerbs.map((v: Record<string, unknown>) => ({
    verb: String(v.verb ?? ''),
    lemma: String(v.lemma ?? v.verb ?? ''),
    context: String(v.context ?? ''),
    isIndividualAction: Boolean(v.isIndividualAction ?? true),
  })).filter((v: ExtractedVerb) => v.verb.length > 0);

  const numbers: ExtractedNumber[] = rawNumbers.map((n: Record<string, unknown>) => ({
    rawValue: String(n.rawValue ?? ''),
    numericValue: Number(n.numericValue) || 0,
    unit: String(n.unit ?? ''),
    hasContext: Boolean(n.hasContext ?? false),
    isMeaningful: Boolean(n.isMeaningful ?? true),
    vanityReason: n.vanityReason ? String(n.vanityReason) : undefined,
  })).filter((n: ExtractedNumber) => n.rawValue.length > 0);

  const roleOwnership: RoleOwnershipSignals = {
    individualPhrases: asStringArray(rawRoleOwnership.individualPhrases),
    teamPhrases: asStringArray(rawRoleOwnership.teamPhrases),
    usesFirstPerson: Boolean(rawRoleOwnership.usesFirstPerson ?? false),
    firstPersonInstances: asStringArray(rawRoleOwnership.firstPersonInstances),
    roleClearFromDescription: Boolean(rawRoleOwnership.roleClearFromDescription ?? false),
  };

  const rawCausalChains = Array.isArray(rawImpact.causalChains) ? rawImpact.causalChains : [];
  const impact: ImpactSignals = {
    causalChains: rawCausalChains.map((c: Record<string, unknown>) => ({
      action: String(c.action ?? ''),
      outcome: String(c.outcome ?? ''),
      hasExternalValidation: Boolean(c.hasExternalValidation ?? false),
    })),
    unsupportedClaims: asStringArray(rawImpact.unsupportedClaims),
    hasMeasurableOutcome: Boolean(rawImpact.hasMeasurableOutcome ?? false),
  };

  const differentiation: DifferentiationSignals = {
    uniqueDetails: asStringArray(rawDiff.uniqueDetails),
    genericPhrases: asStringArray(rawDiff.genericPhrases),
    passesThousandStudentTest: Boolean(rawDiff.passesThousandStudentTest ?? false),
    standoutElement: rawDiff.standoutElement ? String(rawDiff.standoutElement) : undefined,
  };

  const totalChars = activity.description.length;
  const rawWastedPatterns = Array.isArray(rawCharEff.wastedPatterns) ? rawCharEff.wastedPatterns : [];
  const characterEfficiency: CharacterEfficiency = {
    totalChars,
    charLimit,
    utilizationRate: charLimit > 0 ? totalChars / charLimit : 0,
    wastedPatterns: rawWastedPatterns.map((w: Record<string, unknown>) => ({
      pattern: String(w.pattern ?? ''),
      example: String(w.example ?? ''),
      charsSaved: Number(w.charsSaved) || 0,
    })),
    usesFragments: Boolean(rawCharEff.usesFragments ?? false),
    restatesPosition: Boolean(rawCharEff.restatesPosition ?? false),
  };

  const rawOverclaiming = Array.isArray(rawAuth.overclaiming) ? rawAuth.overclaiming : [];
  const authenticity: AuthenticitySignals = {
    overclaiming: rawOverclaiming.map((o: Record<string, unknown>) => ({
      claim: String(o.claim ?? ''),
      reason: String(o.reason ?? ''),
    })),
    authenticityMarkers: asStringArray(rawAuth.authenticityMarkers),
    readsAsAIGenerated: Boolean(rawAuth.readsAsAIGenerated ?? false),
  };

  const detectedType = String(desc.detectedActivityType ?? 'other');
  const validTypes = [
    'stem_research', 'stem_competition', 'coding_engineering',
    'leadership_government', 'community_service', 'work_employment',
    'family_responsibility', 'arts_creative', 'athletics', 'academic', 'other',
  ];
  const detectedActivityType = validTypes.includes(detectedType) ? detectedType : 'other';

  return {
    activityId,
    verbs,
    numbers,
    roleOwnership,
    impact,
    differentiation,
    characterEfficiency,
    authenticity,
    detectedActivityType: detectedActivityType as ExtractedDescriptionFeatures['detectedActivityType'],
  };
}

/**
 * Parse activity evidence from raw extraction, with defaults for missing fields.
 */
function parseActivityEvidence(
  ev: Record<string, unknown>,
  activity: BatchFeatureExtractionInput['activities'][0]
): ExtractedEvidence {
  const rawScope = (ev.scope ?? {}) as Record<string, unknown>;
  const rawRecognitions = Array.isArray(ev.recognitions) ? ev.recognitions : [];
  const rawRole = (ev.role ?? {}) as Record<string, unknown>;
  const rawImpact = (ev.impact ?? {}) as Record<string, unknown>;
  const rawCommitment = (ev.commitment ?? {}) as Record<string, unknown>;
  const rawCharacter = (ev.character ?? {}) as Record<string, unknown>;
  const rawCategory = (ev.categoryMatch ?? {}) as Record<string, unknown>;

  const validScopes = ['school', 'local', 'regional', 'state', 'national', 'international'] as const;
  const scopeLevel = validScopes.includes(rawScope.level as typeof validScopes[number])
    ? rawScope.level as typeof validScopes[number]
    : 'school';

  const validRoleTypes = ['founder', 'president_captain', 'executive', 'team_lead', 'contributor', 'participant', 'member'] as const;
  const roleType = validRoleTypes.includes(rawRole.type as typeof validRoleTypes[number])
    ? rawRole.type as typeof validRoleTypes[number]
    : 'participant';

  const validTraits = ['service', 'innovation', 'resilience', 'curiosity', 'empathy', 'discipline', 'creativity', 'integrity'] as const;
  const primaryTrait = validTraits.includes(rawCharacter.primaryTrait as typeof validTraits[number])
    ? rawCharacter.primaryTrait as typeof validTraits[number]
    : 'discipline';

  const validBenefits = ['significant', 'moderate', 'minimal', 'self-focused'] as const;
  const communityBenefit = validBenefits.includes(rawCharacter.communityBenefit as typeof validBenefits[number])
    ? rawCharacter.communityBenefit as typeof validBenefits[number]
    : 'minimal';

  const rawMetrics = Array.isArray(rawImpact.metrics) ? rawImpact.metrics : [];

  // Use metadata for commitment if extraction doesn't provide it
  const yearsActive = Number(rawCommitment.yearsActive) || activity.yearsInvolved || 1;
  const hoursPerWeek = Number(rawCommitment.hoursPerWeek) || activity.hoursPerWeek || 0;
  const weeksPerYear = Number(rawCommitment.weeksPerYear) || activity.weeksPerYear || 0;

  // Determine if sustained through junior year from grade levels
  const sustainedThroughJunior = rawCommitment.sustainedThroughJunior !== undefined
    ? Boolean(rawCommitment.sustainedThroughJunior)
    : (activity.gradeLevels?.includes(11) ?? false);

  const validSignalStrengths = ['strong', 'moderate', 'weak'] as const;
  const overallSignalStrength = validSignalStrengths.includes(ev.overallSignalStrength as typeof validSignalStrengths[number])
    ? ev.overallSignalStrength as typeof validSignalStrengths[number]
    : 'moderate';

  const validConfidences = ['high', 'medium', 'low'] as const;
  const categoryConfidence = validConfidences.includes(rawCategory.confidence as typeof validConfidences[number])
    ? rawCategory.confidence as typeof validConfidences[number]
    : 'medium';

  return {
    scope: {
      level: scopeLevel,
      confidence: Math.max(0, Math.min(1, Number(rawScope.confidence) || 0.5)),
      evidence: String(rawScope.evidence ?? ''),
    },
    recognitions: rawRecognitions.map((r: Record<string, unknown>) => ({
      name: String(r.name ?? ''),
      level: validScopes.includes(r.level as typeof validScopes[number])
        ? r.level as typeof validScopes[number]
        : 'school',
      isVerifiable: Boolean(r.isVerifiable ?? false),
      selectivityContext: r.selectivityContext ? String(r.selectivityContext) : undefined,
    })),
    role: {
      title: String(rawRole.title ?? activity.role ?? ''),
      type: roleType,
      isLeadershipApplicable: Boolean(rawRole.isLeadershipApplicable ?? true),
      evidence: String(rawRole.evidence ?? ''),
    },
    impact: {
      hasQuantifiedOutcomes: Boolean(rawImpact.hasQuantifiedOutcomes ?? false),
      metrics: rawMetrics.map((m: Record<string, unknown>) => ({
        value: String(m.value ?? ''),
        unit: String(m.unit ?? ''),
        context: String(m.context ?? ''),
        isVerifiable: Boolean(m.isVerifiable ?? false),
      })),
      estimatedPeopleReached: rawImpact.estimatedPeopleReached != null
        ? Number(rawImpact.estimatedPeopleReached)
        : null,
      tangibleOutcomes: asStringArray(rawImpact.tangibleOutcomes),
    },
    commitment: {
      yearsActive,
      hoursPerWeek,
      weeksPerYear,
      showsProgression: Boolean(rawCommitment.showsProgression ?? false),
      progressionArc: rawCommitment.progressionArc ? String(rawCommitment.progressionArc) : null,
      sustainedThroughJunior,
    },
    character: {
      primaryTrait,
      communityBenefit,
      authenticitySignals: asStringArray(rawCharacter.authenticitySignals),
      paddingSignals: asStringArray(rawCharacter.paddingSignals),
    },
    categoryMatch: {
      category: String(rawCategory.category ?? 'other'),
      confidence: categoryConfidence,
    },
    overallSignalStrength,
  };
}

// ============================================================================
// UTILITY
// ============================================================================

/** Map extraction's signal strength to metadata's signal density vocabulary */
function mapSignalStrengthToDensity(strength: string): 'rich' | 'moderate' | 'sparse' {
  switch (strength) {
    case 'strong': return 'rich';
    case 'moderate': return 'moderate';
    case 'weak': return 'sparse';
    default: return 'moderate';
  }
}

/** Safely coerce unknown to string[] */
function asStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is string => typeof v === 'string' && v.length > 0);
}

// ============================================================================
// SINGLE ACTIVITY EXTRACTION
// ============================================================================

/**
 * Extract features from a single activity using Haiku.
 */
async function extractSingleActivity(
  activity: BatchFeatureExtractionInput['activities'][0],
  studentContext: BatchFeatureExtractionInput['studentContext'] | undefined,
  charLimit: number
): Promise<ActivityFeatureExtraction | { error: string; activityId: string }> {
  const systemPrompt = buildExtractionSystemPrompt(charLimit);
  const userPrompt = buildExtractionUserPrompt(activity, studentContext);

  try {
    const response: ClaudeResponse<string> = await callClaude(userPrompt, {
      model: HAIKU_MODEL,
      systemPrompt,
      maxTokens: 2000,
      temperature: 0, // Deterministic extraction
      useJsonMode: false,
      cacheSystemPrompt: true, // System prompt is identical across all calls
    });

    const content = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const extraction = parseExtractionResponse(
      content,
      activity.id,
      activity.title,
      activity,
      charLimit
    );

    if (!extraction) {
      return { error: 'Failed to parse extraction response', activityId: activity.id };
    }

    // Fill in token usage from response
    extraction.metadata.tokensUsed = {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    };

    // Calculate real cost from token usage
    // Haiku pricing: $0.80/MTok input, $4.00/MTok output (as of 2025)
    const inputCost = (response.usage.input_tokens / 1_000_000) * 0.80;
    const outputCost = (response.usage.output_tokens / 1_000_000) * 4.00;
    extraction.metadata.cost = inputCost + outputCost;

    return extraction;

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[FeatureExtractor] Failed for activity ${activity.id}: ${errorMsg}`);
    return { error: errorMsg, activityId: activity.id };
  }
}

// ============================================================================
// BATCH EXTRACTION (PARALLEL)
// ============================================================================

/**
 * Extract features from all activities in parallel.
 *
 * Each activity gets its own Haiku call — no batching, no cross-contamination.
 * All calls run in parallel via Promise.allSettled.
 */
async function extractBatch(
  input: BatchFeatureExtractionInput
): Promise<BatchFeatureExtractionResult> {
  const startTime = Date.now();
  const charLimit = input.charLimit ?? 150;

  console.log(`[FeatureExtractor] Starting extraction for ${input.activities.length} activities (parallel Haiku calls)...`);

  // Launch all extractions in parallel
  const promises = input.activities.map(activity =>
    extractSingleActivity(activity, input.studentContext, charLimit)
  );

  const results = await Promise.allSettled(promises);

  const extractions: ActivityFeatureExtraction[] = [];
  const failures: Array<{ activityId: string; error: string }> = [];
  let totalCost = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const activityId = input.activities[i].id;

    if (result.status === 'rejected') {
      failures.push({ activityId, error: String(result.reason) });
      continue;
    }

    const value = result.value;
    if ('error' in value) {
      failures.push({ activityId: value.activityId, error: value.error });
      continue;
    }

    extractions.push(value);
    totalCost += value.metadata.cost;
    totalInputTokens += value.metadata.tokensUsed.input;
    totalOutputTokens += value.metadata.tokensUsed.output;
  }

  const durationMs = Date.now() - startTime;

  console.log(
    `[FeatureExtractor] Complete in ${durationMs}ms. ` +
    `Success: ${extractions.length}/${input.activities.length}, ` +
    `Failures: ${failures.length}, ` +
    `Cost: $${totalCost.toFixed(4)}`
  );

  if (failures.length > 0) {
    console.warn(
      `[FeatureExtractor] Failures: ${failures.map(f => `${f.activityId}: ${f.error}`).join('; ')}`
    );
  }

  return {
    success: failures.length === 0,
    extractions,
    totalCost,
    totalTokens: { input: totalInputTokens, output: totalOutputTokens },
    durationMs,
    failures,
  };
}

// ============================================================================
// SERVICE CLASS (singleton pattern per codebase convention)
// ============================================================================

export class FeatureExtractorService {
  /**
   * Extract features from a single activity.
   */
  async extractSingle(
    activity: BatchFeatureExtractionInput['activities'][0],
    studentContext?: BatchFeatureExtractionInput['studentContext'],
    charLimit?: number
  ): Promise<ActivityFeatureExtraction | null> {
    const result = await extractSingleActivity(activity, studentContext, charLimit ?? 150);
    if ('error' in result) {
      console.error(`[FeatureExtractor] Extraction failed: ${result.error}`);
      return null;
    }
    return result;
  }

  /**
   * Extract features from all activities in parallel.
   * This is the primary entry point for the scoring pipeline.
   */
  async extractBatch(input: BatchFeatureExtractionInput): Promise<BatchFeatureExtractionResult> {
    return extractBatch(input);
  }
}

export const featureExtractorService = new FeatureExtractorService();
