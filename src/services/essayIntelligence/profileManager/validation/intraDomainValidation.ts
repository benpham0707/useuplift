/**
 * Tier 1 — Quick Validation (Intra-Domain)
 *
 * Referential integrity checks. Target: <1ms. Run after every mutation.
 *
 * These checks traverse known indices, not content — they are fast because
 * they verify structural consistency, not semantic meaning.
 *
 * Checks:
 * - Index bounds: paragraph/sentence indices are in range
 * - Connection refs: every connectionRef ID in every sentence points to existing connection
 * - Connection endpoints: every connection's from and to point to existing paragraphs/sentences
 * - Earned-ness arrows: every arrow's source and target are valid locations
 * - Voice shift entries: every entry references valid paragraph boundary
 * - No orphaned refs: no sentence carries connectionRef to deleted connection
 * - Index consistency: paragraphDigest length matches paragraph count, tokens non-negative
 *
 * Error handling philosophy: Quick validation errors are logged as warnings.
 * They indicate a bug in a mutator that should be investigated but should not
 * block the pipeline.
 *
 * Spec: docs/plan-sections/04-profile-manager.md Section 4 (Tier 1)
 */

import type {
  EssayProfile,
  ValidationResult,
  ValidationCheck,
  SignatureMove,
  SignatureMoveInstance,
} from '../../profileTypes';

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Run quick validation — referential integrity checks only.
 * Target: <1ms. Returns errors (never throws).
 */
export function validateQuick(profile: Readonly<EssayProfile>): ValidationResult {
  const checks: ValidationCheck[] = [];

  checks.push(checkIndexBounds(profile));
  checks.push(checkConnectionRefs(profile));
  checks.push(checkConnectionEndpoints(profile));
  checks.push(checkEarnednessArrows(profile));
  checks.push(checkVoiceShiftEntries(profile));
  checks.push(checkNoOrphanedRefs(profile));
  checks.push(checkIndexConsistency(profile));

  const errors = checks.filter((c) => !c.passed && c.severity === 'error').length;
  const warnings = checks.filter((c) => !c.passed && c.severity === 'warning').length;
  const passed = checks.filter((c) => c.passed).length;

  return {
    valid: errors === 0,
    checks,
    summary: { passed, warnings, errors },
    validatedAt: Date.now(),
    tier: 'quick',
  };
}

// ============================================================================
// INDIVIDUAL CHECKS
// ============================================================================

/**
 * Check that all paragraph/sentence indices are within range.
 */
function checkIndexBounds(profile: Readonly<EssayProfile>): ValidationCheck {
  const locations: Array<{ paragraph: number; sentence?: number }> = [];
  const paragraphCount = profile.paragraphs.length;

  for (const para of profile.paragraphs) {
    if (para.index < 0 || para.index >= paragraphCount) {
      locations.push({ paragraph: para.index });
    }

    for (const sentence of para.sentences) {
      if (sentence.index < 0 || sentence.index >= para.sentences.length) {
        locations.push({ paragraph: para.index, sentence: sentence.index });
      }
    }
  }

  // Check connection graph entries reference valid indices
  for (const entry of profile.index.connectionGraph) {
    const fromP = entry.from.paragraph;
    const fromS = entry.from.sentence;
    const toP = entry.to.paragraph;
    const toS = entry.to.sentence;

    if (fromP < 0 || fromP >= paragraphCount) {
      locations.push({ paragraph: fromP });
    } else if (fromS !== undefined && (fromS < 0 || fromS >= (profile.paragraphs[fromP]?.sentences.length ?? 0))) {
      locations.push({ paragraph: fromP, sentence: fromS });
    }

    if (toP < 0 || toP >= paragraphCount) {
      locations.push({ paragraph: toP });
    } else if (toS !== undefined && (toS < 0 || toS >= (profile.paragraphs[toP]?.sentences.length ?? 0))) {
      locations.push({ paragraph: toP, sentence: toS });
    }
  }

  if (locations.length === 0) {
    return { name: 'index_bounds_valid', passed: true, severity: 'error' };
  }

  return {
    name: 'index_bounds_valid',
    passed: false,
    severity: 'error',
    details: `${locations.length} index bound violation(s) found`,
    locations,
  };
}

/**
 * Check that every connectionRef ID in every sentence points to an existing connection.
 */
function checkConnectionRefs(profile: Readonly<EssayProfile>): ValidationCheck {
  const connectionIds = new Set(profile.connections.all.map((c) => c.id));
  const locations: Array<{ paragraph: number; sentence?: number }> = [];

  for (const para of profile.paragraphs) {
    for (const sentence of para.sentences) {
      if (!sentence.understanding) continue;

      for (const ref of sentence.understanding.connectionRefs) {
        if (!connectionIds.has(ref)) {
          locations.push({ paragraph: para.index, sentence: sentence.index });
        }
      }
    }
  }

  if (locations.length === 0) {
    return { name: 'connection_refs_valid', passed: true, severity: 'error' };
  }

  return {
    name: 'connection_refs_valid',
    passed: false,
    severity: 'error',
    details: `${locations.length} sentence(s) reference non-existent connection IDs`,
    locations,
  };
}

/**
 * Check that every connection's from and to indices point to existing paragraphs/sentences.
 */
function checkConnectionEndpoints(profile: Readonly<EssayProfile>): ValidationCheck {
  const paragraphCount = profile.paragraphs.length;
  const locations: Array<{ paragraph: number; sentence?: number }> = [];

  for (const conn of profile.connections.all) {
    const fromP = conn.from.paragraph;
    const fromS = conn.from.sentence;
    const toP = conn.to.paragraph;
    const toS = conn.to.sentence;

    // Check from endpoint
    if (fromP < 0 || fromP >= paragraphCount) {
      locations.push({ paragraph: fromP, sentence: fromS });
    } else if (fromS !== undefined) {
      const fromPara = profile.paragraphs[fromP];
      if (fromS < 0 || fromS >= fromPara.sentences.length) {
        locations.push({ paragraph: fromP, sentence: fromS });
      }
    }

    // Check to endpoint
    if (toP < 0 || toP >= paragraphCount) {
      locations.push({ paragraph: toP, sentence: toS });
    } else if (toS !== undefined) {
      const toPara = profile.paragraphs[toP];
      if (toS < 0 || toS >= toPara.sentences.length) {
        locations.push({ paragraph: toP, sentence: toS });
      }
    }
  }

  if (locations.length === 0) {
    return { name: 'connection_endpoints_valid', passed: true, severity: 'error' };
  }

  return {
    name: 'connection_endpoints_valid',
    passed: false,
    severity: 'error',
    details: `${locations.length} connection endpoint(s) reference non-existent paragraphs/sentences`,
    locations,
  };
}

/**
 * Check that every earned-ness arrow's source and target are valid paragraph/sentence locations.
 */
function checkEarnednessArrows(profile: Readonly<EssayProfile>): ValidationCheck {
  const paragraphCount = profile.paragraphs.length;
  const locations: Array<{ paragraph: number; sentence?: number }> = [];

  for (const moment of profile.momentEarnednessMap.moments) {
    // Check moment location
    const mLoc = moment.location;
    if (mLoc.paragraph < 0 || mLoc.paragraph >= paragraphCount) {
      locations.push({ paragraph: mLoc.paragraph, sentence: mLoc.sentence });
    } else {
      const para = profile.paragraphs[mLoc.paragraph];
      if (mLoc.sentence < 0 || mLoc.sentence >= para.sentences.length) {
        locations.push({ paragraph: mLoc.paragraph, sentence: mLoc.sentence });
      }
    }

    // Check each earning mechanism location
    for (const mechanism of moment.mechanisms) {
      const loc = mechanism.location;
      if (loc.paragraph < 0 || loc.paragraph >= paragraphCount) {
        locations.push({ paragraph: loc.paragraph, sentence: loc.sentence });
      } else if (loc.sentence !== undefined) {
        const para = profile.paragraphs[loc.paragraph];
        if (loc.sentence < 0 || loc.sentence >= para.sentences.length) {
          locations.push({ paragraph: loc.paragraph, sentence: loc.sentence });
        }
      }
    }
  }

  if (locations.length === 0) {
    return { name: 'earnedness_arrows_valid', passed: true, severity: 'error' };
  }

  return {
    name: 'earnedness_arrows_valid',
    passed: false,
    severity: 'error',
    details: `${locations.length} earned-ness arrow location(s) reference non-existent paragraphs/sentences`,
    locations,
  };
}

/**
 * Check that every voice shift entry references a valid paragraph boundary.
 */
function checkVoiceShiftEntries(profile: Readonly<EssayProfile>): ValidationCheck {
  const paragraphCount = profile.paragraphs.length;
  const locations: Array<{ paragraph: number; sentence?: number }> = [];

  for (const shift of profile.voiceMap.shifts) {
    const loc = shift.location;
    if (loc.paragraph < 0 || loc.paragraph >= paragraphCount) {
      locations.push({ paragraph: loc.paragraph, sentence: loc.sentence });
    } else if (loc.sentence !== undefined) {
      const para = profile.paragraphs[loc.paragraph];
      if (loc.sentence < 0 || loc.sentence >= para.sentences.length) {
        locations.push({ paragraph: loc.paragraph, sentence: loc.sentence });
      }
    }
  }

  // Also check code-switching events.
  // Scope 1 Phase 2: codeSwitching is optional (removed from L3.75 schema);
  // legacy profiles may still carry entries. `?? []` handles both cases.
  for (const event of profile.voiceMap.codeSwitching ?? []) {
    const loc = event.location;
    if (loc.paragraph < 0 || loc.paragraph >= paragraphCount) {
      locations.push({ paragraph: loc.paragraph, sentence: loc.sentence });
    } else {
      const para = profile.paragraphs[loc.paragraph];
      if (loc.sentence < 0 || loc.sentence >= para.sentences.length) {
        locations.push({ paragraph: loc.paragraph, sentence: loc.sentence });
      }
    }
  }

  if (locations.length === 0) {
    return { name: 'voice_shifts_valid', passed: true, severity: 'error' };
  }

  return {
    name: 'voice_shifts_valid',
    passed: false,
    severity: 'error',
    details: `${locations.length} voice shift/code-switching entry references invalid paragraph/sentence`,
    locations,
  };
}

/**
 * Check that no sentence carries a connectionRef to a deleted connection.
 * This is similar to checkConnectionRefs but specifically catches the deletion case.
 */
function checkNoOrphanedRefs(profile: Readonly<EssayProfile>): ValidationCheck {
  const connectionIds = new Set(profile.connections.all.map((c) => c.id));
  const locations: Array<{ paragraph: number; sentence?: number }> = [];

  for (const para of profile.paragraphs) {
    for (const sentence of para.sentences) {
      if (!sentence.understanding) continue;

      // Check that each connectionRef points to a connection where this sentence is an endpoint
      for (const ref of sentence.understanding.connectionRefs) {
        if (!connectionIds.has(ref)) {
          // Orphaned ref — connection was deleted but ref remains
          locations.push({ paragraph: para.index, sentence: sentence.index });
          continue;
        }

        // Verify this sentence is actually an endpoint of the connection
        const conn = profile.connections.all.find((c) => c.id === ref);
        if (!conn) continue; // Already caught by connectionIds check

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
    return { name: 'no_orphaned_refs', passed: true, severity: 'error' };
  }

  return {
    name: 'no_orphaned_refs',
    passed: false,
    severity: 'error',
    details: `${locations.length} orphaned connection ref(s) found — sentences reference connections they are not endpoints of`,
    locations,
  };
}

/**
 * Check index consistency:
 * - paragraphDigest array length matches paragraph count
 * - Token counts are non-negative
 */
function checkIndexConsistency(profile: Readonly<EssayProfile>): ValidationCheck {
  const issues: string[] = [];

  // Paragraph digest length check
  if (profile.index.paragraphDigest.length !== profile.paragraphs.length) {
    issues.push(
      `paragraphDigest length (${profile.index.paragraphDigest.length}) !== paragraph count (${profile.paragraphs.length})`,
    );
  }

  // Token counts non-negative
  const tokenEntries = profile.index.sectionTokenCounts;
  const namedSections: Array<{ name: string; value: number }> = [
    { name: 'voiceIdentity', value: tokenEntries.voiceIdentity },
    { name: 'voiceMap', value: tokenEntries.voiceMap },
    { name: 'emotionalTopography', value: tokenEntries.emotionalTopography },
    { name: 'momentEarnednessMap', value: tokenEntries.momentEarnednessMap },
    { name: 'thematicArchitecture', value: tokenEntries.thematicArchitecture },
    { name: 'narrativeStrategy', value: tokenEntries.narrativeStrategy },
    { name: 'characterRevelation', value: tokenEntries.characterRevelation },
    { name: 'craftAssessment', value: tokenEntries.craftAssessment },
    { name: 'entanglements', value: tokenEntries.entanglements },
    { name: 'admissionsPositioning', value: tokenEntries.admissionsPositioning },
    { name: 'northStar', value: tokenEntries.northStar },
    { name: 'connections', value: tokenEntries.connections },
  ];

  for (const section of namedSections) {
    if (section.value < 0) {
      issues.push(`sectionTokenCounts.${section.name} is negative (${section.value})`);
    }
  }

  for (let i = 0; i < tokenEntries.paragraphs.length; i++) {
    if (tokenEntries.paragraphs[i] < 0) {
      issues.push(`sectionTokenCounts.paragraphs[${i}] is negative (${tokenEntries.paragraphs[i]})`);
    }
  }

  // Paragraph token array length check
  if (tokenEntries.paragraphs.length !== profile.paragraphs.length) {
    issues.push(
      `sectionTokenCounts.paragraphs length (${tokenEntries.paragraphs.length}) !== paragraph count (${profile.paragraphs.length})`,
    );
  }

  if (issues.length === 0) {
    return { name: 'index_consistency', passed: true, severity: 'error' };
  }

  return {
    name: 'index_consistency',
    passed: false,
    severity: 'error',
    details: issues.join('; '),
  };
}

// ============================================================================
// SIGNATURE MOVE VALIDATOR (Gap 1)
// ============================================================================

/**
 * Normalize text for substring comparison: collapses smart quotes, em-dash
 * variants, and Unicode whitespace into ASCII equivalents, then lowercases.
 * This is referential-integrity normalization (rule 6 system bookkeeping),
 * not quality enforcement.
 */
function normalizeForSubstring(text: string): string {
  return text
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[–—―−]/g, '-')
    // Any Unicode whitespace → ASCII space (NBSP, narrow NBSP, en/em space, tabs, newlines, etc.)
    .replace(/\s+/g, ' ')
    // Spaces surrounding a hyphen are stylistic — collapse "now – I" and "now—I" both to "now-i"
    .replace(/\s*-\s*/g, '-')
    .trim()
    .toLowerCase();
}

/**
 * Validate a SignatureMove candidate against essay paragraph texts.
 *
 * Referential-integrity check only (rule 6). Per-instance: an instance that
 * fails grounding is DROPPED (with a diagnostic), not fatal to the whole move —
 * one off-by-one paragraph index or a hallucinated quote should not discard a
 * move that is otherwise well-grounded across its other instances. The move is
 * returned (with `instances` filtered to the grounded set) as long as at least
 * one instance survives. NEVER fabricates: surviving instances are the LLM's
 * own, unaltered.
 *
 * Returns null ONLY when:
 * - the candidate is null/undefined, or
 * - it has no instances, or
 * - EVERY instance fails grounding (a move that can point to nothing in the
 *   essay is asserting a pattern it cannot evidence — null is the honest result).
 *
 * Per-instance failure modes (drop that instance):
 * - sentence_quote with quotedText not a substring of cited paragraph
 * - any paragraph index out of range
 * - cross_paragraph_pattern with fewer than 2 paragraph entries
 *
 * (Cardinality / "a signature recurs" quality lives in the prompt; this
 * validator's job is referential integrity with graceful degradation.)
 *
 * @param candidate - LLM-emitted SignatureMove or null
 * @param paragraphTexts - The essay's paragraphs in order (zero-indexed array
 *                        position = paragraph.index). The full text of each
 *                        paragraph is what `sentence_quote.quotedText` must be
 *                        a substring of.
 * @param diagnostic - Optional callback invoked once per dropped instance
 * @returns The candidate with grounded instances, or null if none survive
 */
export function validateSignatureMoveAgainstParagraphs(
  candidate: SignatureMove | null | undefined,
  paragraphTexts: readonly string[],
  diagnostic?: (msg: string) => void,
): SignatureMove | null {
  if (candidate == null) return null;

  const log = (msg: string): void => {
    if (diagnostic) diagnostic(msg);
    else console.warn(`[SignatureMove validator] dropping instance: ${msg}`);
  };

  const inRange = (idx: number): boolean =>
    Number.isInteger(idx) && idx >= 0 && idx < paragraphTexts.length;

  if (!Array.isArray(candidate.instances) || candidate.instances.length === 0) {
    log('candidate has no instances');
    return null;
  }

  const validInstances: SignatureMoveInstance[] = [];

  for (let i = 0; i < candidate.instances.length; i++) {
    const instance = candidate.instances[i] as SignatureMoveInstance;
    if (!instance || typeof instance !== 'object') {
      log(`instance[${i}] is not an object`);
      continue;
    }

    switch (instance.kind) {
      case 'sentence_quote': {
        const para = instance.location?.paragraph;
        if (typeof para !== 'number' || !inRange(para)) {
          log(`instance[${i}] sentence_quote paragraph index ${para} out of range [0, ${paragraphTexts.length})`);
          continue;
        }
        const quotedText = instance.quotedText;
        if (typeof quotedText !== 'string' || quotedText.length === 0) {
          log(`instance[${i}] sentence_quote has empty quotedText`);
          continue;
        }
        const haystack = normalizeForSubstring(paragraphTexts[para]);
        const needle = normalizeForSubstring(quotedText);
        if (!haystack.includes(needle)) {
          log(`instance[${i}] sentence_quote quotedText not a substring of P${para}: "${quotedText.slice(0, 60)}…"`);
          continue;
        }
        break;
      }
      case 'paragraph_compression': {
        const para = instance.paragraph;
        if (typeof para !== 'number' || !inRange(para)) {
          log(`instance[${i}] paragraph_compression paragraph index ${para} out of range [0, ${paragraphTexts.length})`);
          continue;
        }
        break;
      }
      case 'cross_paragraph_pattern': {
        const paragraphs = instance.paragraphs;
        if (!Array.isArray(paragraphs) || paragraphs.length < 2) {
          log(`instance[${i}] cross_paragraph_pattern has fewer than 2 paragraphs`);
          continue;
        }
        let allInRange = true;
        for (const p of paragraphs) {
          if (!inRange(p)) {
            log(`instance[${i}] cross_paragraph_pattern paragraph index ${p} out of range [0, ${paragraphTexts.length})`);
            allInRange = false;
            break;
          }
        }
        if (!allInRange) continue;
        break;
      }
      default: {
        const exhaustive: never = instance;
        log(`instance[${i}] unknown kind: ${JSON.stringify(exhaustive)}`);
        continue;
      }
    }

    validInstances.push(instance);
  }

  // Null ONLY when nothing survives — a move that can point to nothing grounded
  // in the essay asserts a pattern it cannot evidence. Otherwise return the move
  // with its instances filtered to the grounded set (drop-instance, not
  // drop-move). Surviving instances are unaltered — no fabrication.
  if (validInstances.length === 0) {
    return null;
  }

  return { ...candidate, instances: validInstances };
}
