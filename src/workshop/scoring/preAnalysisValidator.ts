/**
 * Pre-Analysis Validator — Parses, validates, and reformats Haiku's raw JSON
 * output into clean readable text for Sonnet's evaluation prompt.
 *
 * Haiku returns structured JSON about paragraph-level observations.
 * Sonnet should NOT parse JSON — it should read natural language observations
 * from a "skilled colleague." This bridge converts between the two.
 */

// ============================================================================
// TYPES
// ============================================================================

/** Haiku's pre-analysis output for narrative structure */
interface StructurePreAnalysis {
  paragraphs: Array<{
    index: number;
    role: string;
    strongestSentence?: { text: string; why: string };
    concerns: string[];
    concreteOrAbstract: string;
  }>;
  /** Transition analysis between consecutive paragraph pairs */
  transitions?: Array<{
    from: number;
    to: number;
    type: string;
    mechanism: string;
    earned: boolean;
  }>;
  /** Thematic elements: core theme and recurring motifs */
  thematicElements?: {
    coreTheme: string;
    recurringMotifs: Array<{
      motif: string;
      paragraphs: number[];
      transformation?: string;
    }>;
  };
  /** Pacing observations per paragraph */
  pacingObservations?: Array<{
    paragraphIndex: number;
    pace: string;
    proportional?: boolean;
    note: string;
  }>;
  /** Structural pattern identification */
  structuralPattern?: {
    identified: string;
    isDeliberate: boolean;
    note: string;
  };
  overallObservations: {
    comesAlive: { paragraphs: number[]; why: string };
    goesFlat: { paragraphs: number[]; why: string };
    tellNotShow: Array<{
      text: string;
      paragraphIndex: number;
      assessment: string;
    }>;
    structuralArc: string;
  };
}

/** Haiku's pre-analysis output for narrative dynamics */
interface DynamicsPreAnalysis {
  paragraphs: Array<{
    index: number;
    readerEmotion: string;
    emotionalShift: string;
    tensionLevel: number;
    tensionReason: string;
    authenticityAssessment: string;
  }>;
  overallObservations: {
    emotionalArc: string;
    turningPoint: { paragraphIndex: number; what: string };
    whatItConveys: string;
    lingeringMoment: string;
    pacingNotes: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  formatted: string;
  warnings: string[];
}

// ============================================================================
// JSON PARSING (handles markdown fences, partial JSON, etc.)
// ============================================================================

function extractJSON(raw: string): unknown | null {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall through to regex extraction
  }

  // Extract the outermost JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }

  return null;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function validateParagraphIndices(
  indices: number[],
  paragraphCount: number,
  context: string,
  warnings: string[]
): number[] {
  return indices.filter(idx => {
    if (typeof idx !== 'number' || idx < 0 || idx >= paragraphCount) {
      warnings.push(`${context}: invalid paragraph index ${idx} (essay has ${paragraphCount} paragraphs)`);
      return false;
    }
    return true;
  });
}

function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

// ============================================================================
// STRUCTURE VALIDATOR + FORMATTER
// ============================================================================

function validateStructure(
  parsed: unknown,
  paragraphCount: number
): ValidationResult {
  const warnings: string[] = [];

  // Type guard for the top-level shape
  const data = parsed as Partial<StructurePreAnalysis>;
  if (!data || typeof data !== 'object') {
    return { valid: false, formatted: '', warnings: ['Response is not an object'] };
  }

  if (!Array.isArray(data.paragraphs) || data.paragraphs.length === 0) {
    return { valid: false, formatted: '', warnings: ['Missing or empty paragraphs array'] };
  }

  if (!data.overallObservations || typeof data.overallObservations !== 'object') {
    warnings.push('Missing overallObservations — formatting paragraph data only');
  }

  // Validate and format each paragraph
  const lines: string[] = [];

  for (const p of data.paragraphs) {
    if (typeof p !== 'object' || p === null) continue;

    const idx = p.index;
    const validIndices = validateParagraphIndices(
      [idx], paragraphCount, `paragraph entry`, warnings
    );
    if (validIndices.length === 0) continue;

    // Build paragraph line
    const rolePart = isNonEmptyString(p.role) ? ` (${p.role})` : '';
    let line = `P${idx}${rolePart}:`;

    // Concerns flag
    const hasConcerns = Array.isArray(p.concerns) && p.concerns.length > 0;
    if (hasConcerns) {
      line += ' CONCERN —';
      line += ` ${p.concerns.map(c => typeof c === 'string' ? c : '').filter(Boolean).join('; ')}`;
    }

    // Concrete/abstract assessment
    if (isNonEmptyString(p.concreteOrAbstract)) {
      line += hasConcerns ? `. ${capitalize(p.concreteOrAbstract)}.` : ` ${capitalize(p.concreteOrAbstract)}.`;
    }

    lines.push(line);

    // Strongest sentence on its own indented line
    if (p.strongestSentence && isNonEmptyString(p.strongestSentence.text)) {
      let sentenceLine = `   Best sentence: "${p.strongestSentence.text}"`;
      if (isNonEmptyString(p.strongestSentence.why)) {
        sentenceLine += ` — ${p.strongestSentence.why}`;
      }
      lines.push(sentenceLine);
    }

    lines.push(''); // blank line between paragraphs
  }

  // Transitions between paragraphs
  if (Array.isArray(data.transitions) && data.transitions.length > 0) {
    lines.push('Transitions:');
    for (const t of data.transitions) {
      if (!t || typeof t !== 'object') continue;
      const fromValid = validateParagraphIndices([t.from], paragraphCount, 'transition.from', warnings);
      const toValid = validateParagraphIndices([t.to], paragraphCount, 'transition.to', warnings);
      if (fromValid.length === 0 || toValid.length === 0) continue;
      const type = isNonEmptyString(t.type) ? t.type : 'unspecified';
      const earned = t.earned === false ? ' — NOT EARNED' : '';
      let line = `  P${t.from}→P${t.to} (${type}${earned}):`;
      if (isNonEmptyString(t.mechanism)) {
        line += ` ${t.mechanism}`;
      }
      lines.push(line);
    }
    lines.push('');
  }

  // Thematic elements
  if (data.thematicElements && typeof data.thematicElements === 'object') {
    lines.push('Theme:');
    if (isNonEmptyString(data.thematicElements.coreTheme)) {
      lines.push(`  Core: ${data.thematicElements.coreTheme}`);
    }
    if (Array.isArray(data.thematicElements.recurringMotifs)) {
      for (const m of data.thematicElements.recurringMotifs) {
        if (!m || typeof m !== 'object' || !isNonEmptyString(m.motif)) continue;
        const paragraphs = Array.isArray(m.paragraphs)
          ? validateParagraphIndices(m.paragraphs, paragraphCount, 'motif.paragraphs', warnings)
          : [];
        let motifLine = `  Motif: "${m.motif}"`;
        if (paragraphs.length > 0) {
          motifLine += ` (${paragraphs.map(i => `P${i}`).join(', ')})`;
        }
        if (isNonEmptyString(m.transformation)) {
          motifLine += ` — ${m.transformation}`;
        }
        lines.push(motifLine);
      }
    }
    lines.push('');
  }

  // Pacing observations
  if (Array.isArray(data.pacingObservations) && data.pacingObservations.length > 0) {
    lines.push('Pacing:');
    for (const p of data.pacingObservations) {
      if (!p || typeof p !== 'object') continue;
      const validIdx = validateParagraphIndices(
        [p.paragraphIndex], paragraphCount, 'pacing', warnings
      );
      if (validIdx.length === 0) continue;
      const proportional = p.proportional === false ? ' — DISPROPORTIONATE' : '';
      let paceLine = `  P${p.paragraphIndex}${proportional}:`;
      if (isNonEmptyString(p.pace)) {
        paceLine += ` ${p.pace}.`;
      }
      if (isNonEmptyString(p.note)) {
        paceLine += ` ${p.note}`;
      }
      lines.push(paceLine);
    }
    lines.push('');
  }

  // Structural pattern
  if (data.structuralPattern && typeof data.structuralPattern === 'object') {
    if (isNonEmptyString(data.structuralPattern.identified)) {
      const deliberate = data.structuralPattern.isDeliberate ? 'deliberate' : 'default';
      lines.push(`Structure: ${data.structuralPattern.identified} (${deliberate})`);
      if (isNonEmptyString(data.structuralPattern.note)) {
        lines.push(`  ${data.structuralPattern.note}`);
      }
      lines.push('');
    }
  }

  // Overall observations
  const obs = data.overallObservations;
  if (obs && typeof obs === 'object') {
    lines.push('Overall:');

    // Comes alive
    if (obs.comesAlive && Array.isArray(obs.comesAlive.paragraphs)) {
      const validAlive = validateParagraphIndices(
        obs.comesAlive.paragraphs, paragraphCount, 'comesAlive', warnings
      );
      if (validAlive.length > 0) {
        const why = isNonEmptyString(obs.comesAlive.why) ? ` — ${obs.comesAlive.why}` : '';
        lines.push(`  Comes alive at: ${validAlive.map(i => `P${i}`).join(', ')}${why}`);
      }
    }

    // Goes flat
    if (obs.goesFlat && Array.isArray(obs.goesFlat.paragraphs)) {
      const validFlat = validateParagraphIndices(
        obs.goesFlat.paragraphs, paragraphCount, 'goesFlat', warnings
      );
      if (validFlat.length > 0) {
        const why = isNonEmptyString(obs.goesFlat.why) ? ` — ${obs.goesFlat.why}` : '';
        lines.push(`  Goes flat at: ${validFlat.map(i => `P${i}`).join(', ')}${why}`);
      }
    }

    // Tell-not-show
    if (Array.isArray(obs.tellNotShow) && obs.tellNotShow.length > 0) {
      lines.push('  Tell-not-show flags:');
      for (const tns of obs.tellNotShow) {
        if (!tns || typeof tns !== 'object') continue;
        const validIdx = validateParagraphIndices(
          [tns.paragraphIndex], paragraphCount, 'tellNotShow', warnings
        );
        if (validIdx.length === 0) continue;
        const quote = isNonEmptyString(tns.text) ? `"${tns.text}"` : '(no quote)';
        const assessment = isNonEmptyString(tns.assessment) ? ` [${tns.assessment}]` : '';
        lines.push(`    P${tns.paragraphIndex}: ${quote}${assessment}`);
      }
    }

    // Structural arc
    if (isNonEmptyString(obs.structuralArc)) {
      lines.push(`  Arc: ${obs.structuralArc}`);
    }
  }

  const formatted = lines.join('\n').trim();
  if (formatted.length === 0) {
    return { valid: false, formatted: '', warnings: [...warnings, 'No content produced after formatting'] };
  }

  return { valid: true, formatted, warnings };
}

// ============================================================================
// DYNAMICS VALIDATOR + FORMATTER
// ============================================================================

function validateDynamics(
  parsed: unknown,
  paragraphCount: number
): ValidationResult {
  const warnings: string[] = [];

  const data = parsed as Partial<DynamicsPreAnalysis>;
  if (!data || typeof data !== 'object') {
    return { valid: false, formatted: '', warnings: ['Response is not an object'] };
  }

  if (!Array.isArray(data.paragraphs) || data.paragraphs.length === 0) {
    return { valid: false, formatted: '', warnings: ['Missing or empty paragraphs array'] };
  }

  if (!data.overallObservations || typeof data.overallObservations !== 'object') {
    warnings.push('Missing overallObservations — formatting paragraph data only');
  }

  const lines: string[] = [];

  for (const p of data.paragraphs) {
    if (typeof p !== 'object' || p === null) continue;

    const idx = p.index;
    const validIndices = validateParagraphIndices(
      [idx], paragraphCount, 'paragraph entry', warnings
    );
    if (validIndices.length === 0) continue;

    // Tension level bracket
    const tension = typeof p.tensionLevel === 'number'
      ? Math.max(1, Math.min(10, Math.round(p.tensionLevel)))
      : null;
    const tensionTag = tension !== null ? ` [tension: ${tension}/10]` : '';

    // Authenticity flag
    const auth = isNonEmptyString(p.authenticityAssessment) ? p.authenticityAssessment : '';
    const isPerformed = auth.toLowerCase().includes('performed');
    const authFlag = isPerformed ? ' — PERFORMED' : '';

    // Reader emotion
    const emotion = isNonEmptyString(p.readerEmotion) ? p.readerEmotion : 'unspecified';
    let line = `P${idx}${tensionTag}${authFlag}: Reader feels ${emotion}.`;

    // Emotional shift
    if (isNonEmptyString(p.emotionalShift)) {
      line += ` Shift: ${p.emotionalShift}.`;
    }

    // Tension reason on separate indented line if present
    lines.push(line);
    if (isNonEmptyString(p.tensionReason)) {
      lines.push(`   ${p.tensionReason}`);
    }

    // Authenticity detail (only if more than just "lived"/"performed")
    if (isNonEmptyString(auth) && auth.length > 15) {
      lines.push(`   Authenticity: ${auth}`);
    }

    lines.push(''); // blank separator
  }

  // Overall observations
  const obs = data.overallObservations;
  if (obs && typeof obs === 'object') {
    lines.push('Overall:');

    if (isNonEmptyString(obs.emotionalArc)) {
      lines.push(`  Emotional arc: ${obs.emotionalArc}`);
    }

    if (obs.turningPoint && typeof obs.turningPoint === 'object') {
      const validIdx = validateParagraphIndices(
        [obs.turningPoint.paragraphIndex], paragraphCount, 'turningPoint', warnings
      );
      if (validIdx.length > 0 && isNonEmptyString(obs.turningPoint.what)) {
        lines.push(`  Turning point: P${obs.turningPoint.paragraphIndex} — ${obs.turningPoint.what}`);
      }
    }

    if (isNonEmptyString(obs.whatItConveys)) {
      lines.push(`  Conveys: ${obs.whatItConveys}`);
    }

    if (isNonEmptyString(obs.lingeringMoment)) {
      lines.push(`  Lingers: ${obs.lingeringMoment}`);
    }

    if (isNonEmptyString(obs.pacingNotes)) {
      lines.push(`  Pacing: ${obs.pacingNotes}`);
    }
  }

  const formatted = lines.join('\n').trim();
  if (formatted.length === 0) {
    return { valid: false, formatted: '', warnings: [...warnings, 'No content produced after formatting'] };
  }

  return { valid: true, formatted, warnings };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Validate and reformat Haiku's raw pre-analysis output for a given dimension.
 *
 * @param raw - Raw string response from Haiku (may contain JSON, markdown fences, etc.)
 * @param dimensionId - 'narrative_structure' or 'narrative_dynamics'
 * @param paragraphCount - Number of paragraphs in the essay (for index validation)
 * @returns Validation result with clean formatted text (or empty string on failure)
 */
export function validatePreAnalysis(
  raw: string,
  dimensionId: string,
  paragraphCount: number
): ValidationResult {
  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    return { valid: false, formatted: '', warnings: ['Empty or missing raw response'] };
  }

  const parsed = extractJSON(raw);
  if (parsed === null) {
    return { valid: false, formatted: '', warnings: ['Could not parse JSON from Haiku response'] };
  }

  switch (dimensionId) {
    case 'narrative_structure':
      return validateStructure(parsed, paragraphCount);
    case 'narrative_dynamics':
      return validateDynamics(parsed, paragraphCount);
    default:
      // Unknown dimension — pass through raw (better than nothing)
      return {
        valid: true,
        formatted: raw,
        warnings: [`Unknown dimension '${dimensionId}' — passing raw output`],
      };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
