/**
 * Tier 2 — Full Validation (Cross-Domain)
 *
 * Semantic coherence checks. Run at checkpoints (after L3, L3.75, L3.5).
 * More expensive than Tier 1 but still no LLM calls — these are structural
 * cross-checks between different profile domains.
 *
 * Checks:
 * - Voice-emotion alignment: voice shifts correlate with emotional transitions
 * - Earned-ness / connection alignment: earned-ness claims have connection graph support
 * - Evaluative language in understanding: contamination detection
 * - Orphaned connection refs: sentences reference connections they're not endpoints of
 * - North Star / holistic coherence: structural role labels align with narrative strategy
 * - Profile Index completeness: tags, connections, and digests are reflected in the index
 *
 * Error handling philosophy: Full validation warnings are logged as informational.
 * They indicate potential prompt quality issues that may self-correct in subsequent layers.
 * Neither tier blocks the pipeline.
 *
 * Spec: docs/plan-sections/04-profile-manager.md Section 4 (Tier 2)
 */

import type {
  EssayProfile,
  ValidationResult,
  ValidationCheck,
} from '../../profileTypes';

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Run full validation — semantic coherence checks.
 * More expensive than quick validation. Returns warnings (never throws).
 */
export function validateFull(profile: Readonly<EssayProfile>): ValidationResult {
  const checks: ValidationCheck[] = [];

  checks.push(checkVoiceEmotionAlignment(profile));
  checks.push(checkEarnednessConnectionAlignment(profile));
  checks.push(checkEvaluativeLanguageInUnderstanding(profile));
  checks.push(checkOrphanedConnectionRefs(profile));
  checks.push(checkNorthStarHolisticCoherence(profile));
  checks.push(checkProfileIndexCompleteness(profile));

  const errors = checks.filter((c) => !c.passed && c.severity === 'error').length;
  const warnings = checks.filter((c) => !c.passed && c.severity === 'warning').length;
  const passed = checks.filter((c) => c.passed).length;

  return {
    valid: errors === 0 && warnings === 0,
    checks,
    summary: { passed, warnings, errors },
    validatedAt: Date.now(),
    tier: 'full',
  };
}

// ============================================================================
// INDIVIDUAL CHECKS
// ============================================================================

/**
 * Voice-emotion alignment: if the voice map records a shift at P(n),
 * does the emotional topography record a transition near P(n)?
 *
 * Misalignment is a WARNING — the shift could be structural rather than emotional.
 */
function checkVoiceEmotionAlignment(profile: Readonly<EssayProfile>): ValidationCheck {
  const voiceShifts = profile.voiceMap.shifts;
  const emotionalProgression = profile.emotionalTopography.emotionalProgression;

  if (voiceShifts.length === 0 || emotionalProgression.length === 0) {
    // Nothing to compare — vacuously valid
    return { name: 'voice_emotion_alignment', passed: true, severity: 'warning' };
  }

  // Build a set of paragraph indices where emotional transitions occur
  const emotionalTransitionParagraphs = new Set<number>();
  for (const entry of emotionalProgression) {
    // An emotional transition is indicated by a non-empty shift description
    if (entry.shift && entry.shift.length > 0) {
      emotionalTransitionParagraphs.add(entry.paragraph);
    }
  }

  // Check: for each voice shift, is there an emotional transition nearby (within 1 paragraph)?
  const misalignedLocations: Array<{ paragraph: number }> = [];

  for (const shift of voiceShifts) {
    const shiftPara = shift.location.paragraph;
    const hasNearbyEmotionalTransition =
      emotionalTransitionParagraphs.has(shiftPara) ||
      emotionalTransitionParagraphs.has(shiftPara - 1) ||
      emotionalTransitionParagraphs.has(shiftPara + 1);

    if (!hasNearbyEmotionalTransition) {
      misalignedLocations.push({ paragraph: shiftPara });
    }
  }

  if (misalignedLocations.length === 0) {
    return { name: 'voice_emotion_alignment', passed: true, severity: 'warning' };
  }

  return {
    name: 'voice_emotion_alignment',
    passed: false,
    severity: 'warning',
    details: `${misalignedLocations.length} voice shift(s) without nearby emotional transition — may indicate structural-only shifts`,
    locations: misalignedLocations,
  };
}

/**
 * Earned-ness / connection alignment: if the earned-ness map claims
 * "P(a) earns P(b)", does the connection graph have a P(a)->P(b) link?
 *
 * Missing link means the earned-ness map sees a relationship the connection
 * graph missed (or vice versa) — a signal for the next synthesis pass.
 */
function checkEarnednessConnectionAlignment(profile: Readonly<EssayProfile>): ValidationCheck {
  const moments = profile.momentEarnednessMap.moments;
  const connections = profile.connections.all;

  if (moments.length === 0) {
    return { name: 'earnedness_connection_alignment', passed: true, severity: 'warning' };
  }

  // Build a lookup of connection pairs: "fromP.fromS->toP.toS"
  const connectionPairs = new Set<string>();
  for (const conn of connections) {
    connectionPairs.add(`${conn.from[0]}.${conn.from[1]}->${conn.to[0]}.${conn.to[1]}`);
    // Also add reverse direction since connections may be undirected
    connectionPairs.add(`${conn.to[0]}.${conn.to[1]}->${conn.from[0]}.${conn.from[1]}`);
  }

  // Also build paragraph-level pairs (less strict check)
  const paragraphPairs = new Set<string>();
  for (const conn of connections) {
    paragraphPairs.add(`${conn.from[0]}->${conn.to[0]}`);
    paragraphPairs.add(`${conn.to[0]}->${conn.from[0]}`);
  }

  const misalignedLocations: Array<{ paragraph: number; sentence?: number }> = [];

  for (const moment of moments) {
    for (const mechanism of moment.mechanisms) {
      const mechLoc = mechanism.location;
      const momentLoc = moment.location;

      // Check if there's a connection between mechanism and moment (paragraph-level)
      const hasParagraphLink =
        paragraphPairs.has(`${mechLoc.paragraph}->${momentLoc.paragraph}`) ||
        mechLoc.paragraph === momentLoc.paragraph; // Same paragraph doesn't need a connection

      if (!hasParagraphLink) {
        // The mechanism also has a connectionRef field — if set, that's explicit
        if (!mechanism.connectionRef) {
          misalignedLocations.push({
            paragraph: mechLoc.paragraph,
            sentence: mechLoc.sentence,
          });
        }
      }
    }
  }

  if (misalignedLocations.length === 0) {
    return { name: 'earnedness_connection_alignment', passed: true, severity: 'warning' };
  }

  return {
    name: 'earnedness_connection_alignment',
    passed: false,
    severity: 'warning',
    details: `${misalignedLocations.length} earned-ness mechanism(s) without corresponding connection graph link`,
    locations: misalignedLocations,
  };
}

/**
 * Evaluative language in understanding: scan understanding fields for evaluative
 * words ("effectively", "weakly", "successfully", etc.).
 *
 * Their presence suggests L3 leaked evaluation into understanding — a contamination
 * signal for prompt tuning. Pure understanding should be descriptive only.
 */
function checkEvaluativeLanguageInUnderstanding(profile: Readonly<EssayProfile>): ValidationCheck {
  const evaluativeWords = [
    'effectively',
    'ineffectively',
    'weakly',
    'strongly',
    'successfully',
    'unsuccessfully',
    'poorly',
    'excellently',
    'brilliantly',
    'masterfully',
    'clumsily',
    'awkwardly',
    'fails to',
    'fails at',
    'does a good job',
    'does a poor job',
    'impressively',
    'disappointingly',
    'beautifully written',
    'poorly written',
  ];

  const contaminated: Array<{ paragraph: number; sentence?: number }> = [];

  for (const para of profile.paragraphs) {
    // Check paragraph-level understanding
    if (para.understanding) {
      const paraText = [
        para.understanding.role,
        para.understanding.function,
        para.understanding.narrativeContribution,
      ].join(' ');

      if (containsEvaluativeLanguage(paraText, evaluativeWords)) {
        contaminated.push({ paragraph: para.index });
      }
    }

    // Check sentence-level understanding
    for (const sentence of para.sentences) {
      if (!sentence.understanding) continue;

      const sentenceTexts: string[] = [];
      for (const obs of sentence.understanding.observedFunctions) {
        sentenceTexts.push(obs.observation);
      }
      for (const obs of sentence.understanding.inferredIntents) {
        sentenceTexts.push(obs.observation);
      }
      for (const obs of sentence.understanding.narrativeContributions) {
        sentenceTexts.push(obs.observation);
      }
      sentenceTexts.push(sentence.understanding.paragraphContribution);

      const combined = sentenceTexts.join(' ');
      if (containsEvaluativeLanguage(combined, evaluativeWords)) {
        contaminated.push({ paragraph: para.index, sentence: sentence.index });
      }
    }
  }

  if (contaminated.length === 0) {
    return { name: 'no_evaluative_in_understanding', passed: true, severity: 'warning' };
  }

  return {
    name: 'no_evaluative_in_understanding',
    passed: false,
    severity: 'warning',
    details: `${contaminated.length} understanding field(s) contain evaluative language — L3 may have leaked evaluation into understanding`,
    locations: contaminated,
  };
}

/**
 * Orphaned connection refs: sentences with connectionRefs pointing to connections
 * where neither endpoint is that sentence.
 *
 * This is a more thorough version of the quick validation check — it verifies
 * the semantic correctness of the reference, not just its existence.
 */
function checkOrphanedConnectionRefs(profile: Readonly<EssayProfile>): ValidationCheck {
  const locations: Array<{ paragraph: number; sentence?: number }> = [];

  for (const para of profile.paragraphs) {
    for (const sentence of para.sentences) {
      if (!sentence.understanding) continue;

      for (const ref of sentence.understanding.connectionRefs) {
        const conn = profile.connections.all.find((c) => c.id === ref);
        if (!conn) {
          // Connection doesn't exist — already caught by quick validation
          continue;
        }

        // Check that this sentence is actually an endpoint
        const isEndpoint =
          (conn.from[0] === para.index && conn.from[1] === sentence.index) ||
          (conn.to[0] === para.index && conn.to[1] === sentence.index);

        if (!isEndpoint) {
          locations.push({ paragraph: para.index, sentence: sentence.index });
        }
      }
    }
  }

  if (locations.length === 0) {
    return { name: 'no_orphaned_connection_refs', passed: true, severity: 'warning' };
  }

  return {
    name: 'no_orphaned_connection_refs',
    passed: false,
    severity: 'warning',
    details: `${locations.length} sentence(s) reference connections where they are not an endpoint`,
    locations,
  };
}

/**
 * North Star / holistic coherence: if the North Star's structural roles map
 * labels a paragraph as "the fulcrum" (or similar critical structural role),
 * does the narrative strategy's pivotPoints agree?
 */
function checkNorthStarHolisticCoherence(profile: Readonly<EssayProfile>): ValidationCheck {
  const northStar = profile.northStar;
  const narrativeStrategy = profile.narrativeStrategy;

  // If no North Star or no structural roles, skip
  if (!northStar.structuralRolesMap || northStar.structuralRolesMap.length === 0) {
    return { name: 'north_star_holistic_coherence', passed: true, severity: 'info' };
  }

  // Find structural roles that imply critical pivot/turning points
  const pivotRoles = ['fulcrum', 'turning_point', 'pivot', 'climax', 'crisis'];
  const pivotRoleParagraphs = new Set<number>();

  for (const role of northStar.structuralRolesMap) {
    const isKeyRole = pivotRoles.some(
      (pr) => role.role.toLowerCase().includes(pr) || role.significance.toLowerCase().includes(pr),
    );
    if (isKeyRole) {
      for (const pIdx of role.paragraphs) {
        pivotRoleParagraphs.add(pIdx);
      }
    }
  }

  // Compare with narrative strategy pivot points
  const narrativePivotParagraphs = new Set(
    narrativeStrategy.pivotPoints.map((pp) => pp.location.paragraph),
  );

  // Check alignment: each North Star pivot paragraph should have a narrative pivot point nearby
  const misaligned: Array<{ paragraph: number }> = [];
  for (const pIdx of pivotRoleParagraphs) {
    const hasNearbyPivot =
      narrativePivotParagraphs.has(pIdx) ||
      narrativePivotParagraphs.has(pIdx - 1) ||
      narrativePivotParagraphs.has(pIdx + 1);

    if (!hasNearbyPivot && narrativePivotParagraphs.size > 0) {
      misaligned.push({ paragraph: pIdx });
    }
  }

  if (misaligned.length === 0) {
    return { name: 'north_star_holistic_coherence', passed: true, severity: 'info' };
  }

  return {
    name: 'north_star_holistic_coherence',
    passed: false,
    severity: 'info',
    details: `${misaligned.length} North Star structural role(s) marked as critical pivot but not reflected in narrative strategy pivotPoints`,
    locations: misaligned,
  };
}

/**
 * Profile Index completeness: all tags and connections in the actual data
 * are reflected in the index.
 *
 * Checks:
 * - All paragraph tags are reflected in index paragraphDigest
 * - All connections in connections.all appear in connectionGraph
 * - Paragraph digest count matches paragraph count (redundant with quick, but semantic here)
 */
function checkProfileIndexCompleteness(profile: Readonly<EssayProfile>): ValidationCheck {
  const issues: string[] = [];

  // Check paragraph tags are reflected in index
  for (const para of profile.paragraphs) {
    const digest = profile.index.paragraphDigest.find((d) => d.index === para.index);
    if (!digest) {
      issues.push(`Paragraph ${para.index} missing from index paragraphDigest`);
      continue;
    }

    // Check that all paragraph-level tags appear in digest
    for (const tag of para.tags) {
      if (!digest.tags.includes(tag)) {
        issues.push(`Paragraph ${para.index} tag "${tag}" not in index digest`);
      }
    }

    // Check sentenceCount matches
    if (digest.sentenceCount !== para.sentences.length) {
      issues.push(
        `Paragraph ${para.index} sentenceCount mismatch: index says ${digest.sentenceCount}, actual ${para.sentences.length}`,
      );
    }
  }

  // Check connections are reflected in connectionGraph
  const graphPairs = new Set(
    profile.index.connectionGraph.map(
      (e) => `${e.from[0]}.${e.from[1]}->${e.to[0]}.${e.to[1]}`,
    ),
  );

  for (const conn of profile.connections.all) {
    const key = `${conn.from[0]}.${conn.from[1]}->${conn.to[0]}.${conn.to[1]}`;
    if (!graphPairs.has(key)) {
      issues.push(`Connection ${conn.id} (${key}) not in index connectionGraph`);
    }
  }

  if (issues.length === 0) {
    return { name: 'profile_index_completeness', passed: true, severity: 'warning' };
  }

  return {
    name: 'profile_index_completeness',
    passed: false,
    severity: 'warning',
    details: `${issues.length} index completeness issue(s): ${issues.slice(0, 3).join('; ')}${issues.length > 3 ? ` (and ${issues.length - 3} more)` : ''}`,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if a text contains any evaluative language words.
 */
function containsEvaluativeLanguage(text: string, evaluativeWords: string[]): boolean {
  const lower = text.toLowerCase();
  return evaluativeWords.some((word) => lower.includes(word));
}
