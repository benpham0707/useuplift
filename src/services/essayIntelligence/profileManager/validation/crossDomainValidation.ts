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
  ProgrammaticContradiction,
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
  // Only consider active connections for alignment checks
  const activeConnections = connections.filter(c => c.status === 'active');
  const connectionPairs = new Set<string>();
  for (const conn of activeConnections) {
    const fromS = conn.from.sentence ?? -1;
    const toS = conn.to.sentence ?? -1;
    connectionPairs.add(`${conn.from.paragraph}.${fromS}->${conn.to.paragraph}.${toS}`);
    // Also add reverse direction since connections may be undirected
    connectionPairs.add(`${conn.to.paragraph}.${toS}->${conn.from.paragraph}.${fromS}`);
  }

  // Also build paragraph-level pairs (less strict check)
  const paragraphPairs = new Set<string>();
  for (const conn of activeConnections) {
    paragraphPairs.add(`${conn.from.paragraph}->${conn.to.paragraph}`);
    paragraphPairs.add(`${conn.to.paragraph}->${conn.from.paragraph}`);
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
      // Phase 2: scan primaryFunction (primary) + fallback observation arrays for pre-Phase-1 profiles
      if (sentence.understanding.primaryFunction) {
        sentenceTexts.push(sentence.understanding.primaryFunction);
      }
      for (const obs of sentence.understanding.observedFunctions) {
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
          (conn.from.paragraph === para.index && conn.from.sentence === sentence.index) ||
          (conn.to.paragraph === para.index && conn.to.sentence === sentence.index);

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
      (pr) =>
        (role.role ?? '').toLowerCase().includes(pr) ||
        (role.significance ?? '').toLowerCase().includes(pr),
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
  const graphIds = new Set(
    profile.index.connectionGraph.map((e) => e.id),
  );

  for (const conn of profile.connections.all) {
    if (!graphIds.has(conn.id)) {
      const key = `${conn.from.paragraph}.${conn.from.sentence ?? '-'}->${conn.to.paragraph}.${conn.to.sentence ?? '-'}`;
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

// ============================================================================
// W4.2: PROGRAMMATIC CONTRADICTION CHECKS
// ============================================================================

/**
 * Detect programmatic contradictions across all cross-domain checks.
 * Returns all found contradictions. Called by the orchestrator after L4
 * to augment the LLM-detected coherence report with deterministic checks.
 */
export function detectProgrammaticContradictions(
  profile: Readonly<EssayProfile>,
): ProgrammaticContradiction[] {
  const contradictions: ProgrammaticContradiction[] = [];

  contradictions.push(...checkUnderstandingVsAnalysisScores(profile));
  contradictions.push(...checkVoiceMapVsVoiceIdentity(profile));
  contradictions.push(...checkStructuralWeightVsScores(profile));
  contradictions.push(...checkEarnednessVsEffectiveness(profile));

  return contradictions;
}

/**
 * W4.2.1: Understanding describes earned/authentic language but analysis
 * gives low effectiveness scores.
 *
 * Detects: paragraph understanding describes language as "earned", "authentic",
 * "genuine", or "grounded" but the paragraph's analysis effectiveness is < 50.
 */
function checkUnderstandingVsAnalysisScores(
  profile: Readonly<EssayProfile>,
): ProgrammaticContradiction[] {
  const contradictions: ProgrammaticContradiction[] = [];
  const authenticityMarkers = [
    'earned', 'authentic', 'genuine', 'grounded', 'sincere',
    'deeply felt', 'hard-won', 'lived experience',
  ];

  for (const para of profile.paragraphs) {
    if (!para.understanding || !para.analysis) continue;

    const understandingText = [
      para.understanding.role,
      para.understanding.function,
      para.understanding.narrativeContribution,
    ].join(' ').toLowerCase();

    const hasAuthenticityLanguage = authenticityMarkers.some(
      (marker) => understandingText.includes(marker),
    );

    if (hasAuthenticityLanguage && para.analysis.effectiveness < 50) {
      contradictions.push({
        type: 'understanding_vs_analysis',
        evidenceA: {
          section: `P${para.index} understanding`,
          claim: `Describes language as earned/authentic (found markers in role/function/narrativeContribution)`,
          location: { paragraph: para.index },
        },
        evidenceB: {
          section: `P${para.index} analysis`,
          claim: `Effectiveness score is ${para.analysis.effectiveness}/100 (below 50 threshold)`,
          location: { paragraph: para.index },
        },
        severity: para.analysis.effectiveness < 30 ? 'blocking' : 'notable',
        consumed: false,
      });
    }
  }

  return contradictions;
}

/**
 * W4.2.2: VoiceMap has many unintentional shifts but voiceIdentity claims
 * consistency.
 *
 * Detects: voiceMap has 3+ unintentional shifts while voiceIdentity's
 * consistency description suggests high consistency.
 */
function checkVoiceMapVsVoiceIdentity(
  profile: Readonly<EssayProfile>,
): ProgrammaticContradiction[] {
  const contradictions: ProgrammaticContradiction[] = [];

  const unintentionalShifts = profile.voiceMap.shifts.filter(
    (s) => !s.intentional,
  );

  if (unintentionalShifts.length < 3) return contradictions;

  // Check if voiceIdentity claims consistency. Guard against undefined
  // consistency field (seen on profiles where L3.75 truncation dropped
  // optional voiceIdentity sub-fields).
  const consistencyText = (profile.voiceIdentity?.consistency ?? '').toLowerCase();
  const consistencyMarkers = [
    'consistent', 'unified', 'cohesive', 'stable', 'steady',
    'uniform', 'harmonious', 'unwavering',
  ];
  const claimsConsistency = consistencyMarkers.some(
    (marker) => consistencyText.includes(marker),
  );

  if (claimsConsistency) {
    contradictions.push({
      type: 'voicemap_vs_identity',
      evidenceA: {
        section: 'voiceMap.shifts',
        claim: `${unintentionalShifts.length} unintentional voice shifts detected (at paragraphs ${unintentionalShifts.map((s) => s.location.paragraph).join(', ')})`,
      },
      evidenceB: {
        section: 'voiceIdentity.consistency',
        claim: `Voice identity describes consistency as: "${(profile.voiceIdentity?.consistency ?? '').substring(0, 150)}"`,
      },
      severity: unintentionalShifts.length >= 5 ? 'blocking' : 'notable',
      consumed: false,
    });
  }

  return contradictions;
}

/**
 * W4.2.3: North Star marks a paragraph as load-bearing but it has the lowest
 * effectiveness scores.
 *
 * Detects: a paragraph with structural weight 'load_bearing' in the North Star
 * has the lowest effectiveness score among all paragraphs with analysis.
 */
function checkStructuralWeightVsScores(
  profile: Readonly<EssayProfile>,
): ProgrammaticContradiction[] {
  const contradictions: ProgrammaticContradiction[] = [];

  if (!profile.northStar?.structuralRolesMap?.length) return contradictions;

  // Find load-bearing paragraphs
  const loadBearingParagraphs = new Set<number>();
  for (const role of profile.northStar.structuralRolesMap) {
    if (role.weight === 'load_bearing') {
      for (const pIdx of role.paragraphs) {
        loadBearingParagraphs.add(pIdx);
      }
    }
  }

  if (loadBearingParagraphs.size === 0) return contradictions;

  // Find min effectiveness across all analyzed paragraphs
  const analyzedParagraphs = profile.paragraphs.filter((p) => p.analysis);
  if (analyzedParagraphs.length < 2) return contradictions;

  const minEffectiveness = Math.min(
    ...analyzedParagraphs.map((p) => p.analysis!.effectiveness),
  );

  // Check if any load-bearing paragraph has the lowest score
  for (const para of analyzedParagraphs) {
    if (
      loadBearingParagraphs.has(para.index) &&
      para.analysis!.effectiveness === minEffectiveness
    ) {
      const role = profile.northStar.structuralRolesMap.find(
        (r) => r.weight === 'load_bearing' && r.paragraphs.includes(para.index),
      );

      contradictions.push({
        type: 'structural_weight_vs_scores',
        evidenceA: {
          section: `northStar.structuralRolesMap`,
          claim: `P${para.index} is marked as load_bearing (role: "${role?.role ?? 'unknown'}")`,
          location: { paragraph: para.index },
        },
        evidenceB: {
          section: `P${para.index} analysis`,
          claim: `Has the lowest effectiveness score (${para.analysis!.effectiveness}/100) among all paragraphs`,
          location: { paragraph: para.index },
        },
        severity: para.analysis!.effectiveness < 40 ? 'blocking' : 'notable',
        consumed: false,
      });
    }
  }

  return contradictions;
}

/**
 * W4.2.4: Earned moments exist in paragraphs with low overall effectiveness.
 *
 * Detects: the moment earnedness map identifies earned moments in a paragraph
 * whose analysis effectiveness is below 45.
 */
function checkEarnednessVsEffectiveness(
  profile: Readonly<EssayProfile>,
): ProgrammaticContradiction[] {
  const contradictions: ProgrammaticContradiction[] = [];

  const moments = profile.momentEarnednessMap?.moments ?? [];
  if (moments.length === 0) return contradictions;

  for (const moment of moments) {
    const paraIdx = moment.location.paragraph;
    const para = profile.paragraphs.find((p) => p.index === paraIdx);
    if (!para?.analysis) continue;

    if (para.analysis.effectiveness < 45) {
      contradictions.push({
        type: 'earnedness_vs_effectiveness',
        evidenceA: {
          section: `momentEarnednessMap`,
          claim: `P${paraIdx} has an earned moment: "${(moment.moment ?? '').substring(0, 120)}" (${moment.mechanisms?.length ?? 0} earning mechanism(s))`,
          location: { paragraph: paraIdx },
        },
        evidenceB: {
          section: `P${paraIdx} analysis`,
          claim: `Paragraph effectiveness is only ${para.analysis.effectiveness}/100 (below 45 threshold)`,
          location: { paragraph: paraIdx },
        },
        severity: para.analysis.effectiveness < 30 ? 'blocking' : 'notable',
        consumed: false,
      });
    }
  }

  return contradictions;
}
