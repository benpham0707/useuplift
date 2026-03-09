/**
 * Running Understanding Manager
 *
 * Manages the RunningUnderstanding accumulator — the compounding state
 * that grows with each paragraph the sequential deep walk analyzes.
 *
 * Responsibilities:
 *   - Create empty RunningUnderstanding state
 *   - Serialize RunningUnderstanding to human-readable text for prompt injection
 *   - Parse/validate Sonnet's JSON response into RunningUnderstanding
 *   - Detect whether a change between two states is "significant" (for early-stop)
 */

import type {
  RunningUnderstanding,
  ThreadStrength,
  ArcMomentum,
  ConnectionType,
  WeaknessSeverity,
} from '../types';

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

const VALID_THREAD_STRENGTHS: readonly ThreadStrength[] = ['dominant', 'supporting', 'hinted', 'dropped'];
const VALID_ARC_MOMENTUMS: readonly ArcMomentum[] = ['building', 'sustaining', 'releasing', 'stalling'];
const VALID_CONNECTION_TYPES: readonly ConnectionType[] = ['callback', 'contrast', 'escalation', 'parallel', 'contradiction'];
const VALID_WEAKNESS_SEVERITIES: readonly WeaknessSeverity[] = ['critical', 'significant', 'minor'];

function isString(val: unknown): val is string {
  return typeof val === 'string';
}

function isNumber(val: unknown): val is number {
  return typeof val === 'number' && !Number.isNaN(val);
}

function isArrayOf<T>(val: unknown, check: (item: unknown) => item is T): val is T[] {
  return Array.isArray(val) && val.every(check);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ============================================================================
// RUNNING UNDERSTANDING MANAGER
// ============================================================================

export class RunningUnderstandingManager {
  /**
   * Create an empty RunningUnderstanding for the start of a deep walk.
   */
  createEmpty(): RunningUnderstanding {
    return {
      emergingThesis: '',
      thesisConfidence: 0,
      thematicThreads: [],

      arcSoFar: '',
      arcType: null,
      currentMomentum: 'building',
      turningPointDetected: null,

      voiceFingerprint: {
        dominantRegister: '',
        authenticMoments: [],
        voiceDrifts: [],
        consistencyScore: 0,
      },

      emotionalArc: [],
      emotionalPeak: null,

      strengthsFound: [],
      weaknessesFound: [],

      connections: [],
      redundancies: [],

      aoTakeaway: '',
      memorabilityFactor: null,
      revealedQualities: [],
    };
  }

  /**
   * Serialize RunningUnderstanding to a human-readable format for prompt injection.
   * This is NOT raw JSON — it's a structured text format designed for Sonnet to read
   * and update efficiently.
   */
  serialize(ru: RunningUnderstanding): string {
    const paragraphCount = ru.emotionalArc.length;
    const lines: string[] = [];

    lines.push(`=== UNDERSTANDING SO FAR (after analyzing ${paragraphCount} paragraph${paragraphCount !== 1 ? 's' : ''}) ===`);
    lines.push('');

    // Thesis
    if (ru.emergingThesis) {
      lines.push(`THESIS: "${ru.emergingThesis}" (confidence: ${ru.thesisConfidence}%)`);
    } else {
      lines.push('THESIS: [not yet identified]');
    }

    // Thematic threads
    if (ru.thematicThreads.length > 0) {
      const threadStrs = ru.thematicThreads.map(t => {
        const range = t.introducedAt === t.lastSeenAt
          ? `P${t.introducedAt + 1}`
          : `P${t.introducedAt + 1}-P${t.lastSeenAt + 1}`;
        return `${t.thread} (${t.strength}, ${range})`;
      });
      lines.push(`THEMATIC THREADS: [${threadStrs.join(', ')}]`);
    } else {
      lines.push('THEMATIC THREADS: [none detected yet]');
    }

    // Arc
    if (ru.arcSoFar) {
      const arcParts = [ru.arcSoFar];
      if (ru.arcType) arcParts.push(`type: ${ru.arcType}`);
      arcParts.push(`momentum: ${ru.currentMomentum}`);
      if (ru.turningPointDetected !== null) {
        arcParts.push(`turning point at P${ru.turningPointDetected + 1}`);
      }
      lines.push(`ARC: ${arcParts.join(' | ')}`);
    } else {
      lines.push('ARC: [not yet determined]');
    }

    // Voice
    const vf = ru.voiceFingerprint;
    if (vf.dominantRegister) {
      lines.push(`VOICE: "${vf.dominantRegister}" | Consistency: ${vf.consistencyScore}%`);
      if (vf.authenticMoments.length > 0) {
        lines.push(`  Authentic moments: ${vf.authenticMoments.map(m => `"${m}"`).join(', ')}`);
      }
      if (vf.voiceDrifts.length > 0) {
        const drifts = vf.voiceDrifts.map(d => `P${d.paragraph + 1}: ${d.from} → ${d.to}`);
        lines.push(`  Voice drifts: ${drifts.join('; ')}`);
      }
    } else {
      lines.push('VOICE: [not yet characterized]');
    }

    // Emotional journey
    if (ru.emotionalArc.length > 0) {
      const journey = ru.emotionalArc.map(e => `P${e.paragraph + 1}(${e.register},${e.depth}${e.isEarned ? '' : ',unearned'})`);
      lines.push(`EMOTIONAL JOURNEY: ${journey.join(' → ')}`);
      if (ru.emotionalPeak) {
        lines.push(`  Peak: P${ru.emotionalPeak.paragraph + 1} — "${ru.emotionalPeak.moment}"`);
      }
    } else {
      lines.push('EMOTIONAL JOURNEY: [no data yet]');
    }

    // Strengths
    if (ru.strengthsFound.length > 0) {
      const strengths = ru.strengthsFound.map(s => `S(P${s.paragraph + 1}): "${s.quality}" — ${s.evidence}`);
      lines.push(`STRENGTHS: [${strengths.join('; ')}]`);
    } else {
      lines.push('STRENGTHS: [none identified yet]');
    }

    // Weaknesses
    if (ru.weaknessesFound.length > 0) {
      const weaknesses = ru.weaknessesFound.map(w => `W(P${w.paragraph + 1},${w.severity}): "${w.quality}" — ${w.description}`);
      lines.push(`WEAKNESSES: [${weaknesses.join('; ')}]`);
    } else {
      lines.push('WEAKNESSES: [none identified yet]');
    }

    // Connections
    if (ru.connections.length > 0) {
      const conns = ru.connections.map(c => `${c.type} P${c.paragraphs[0] + 1}↔P${c.paragraphs[1] + 1}: "${c.description}"`);
      lines.push(`CONNECTIONS: [${conns.join('; ')}]`);
    }

    // Redundancies
    if (ru.redundancies.length > 0) {
      const redund = ru.redundancies.map(r => `P${r.paragraphs.map(p => p + 1).join(',P')}: "${r.overlappingContent}"`);
      lines.push(`REDUNDANCIES: [${redund.join('; ')}]`);
    }

    // AO takeaway
    if (ru.aoTakeaway) {
      lines.push(`AO TAKEAWAY: "${ru.aoTakeaway}"`);
    }
    if (ru.memorabilityFactor) {
      lines.push(`MEMORABILITY: "${ru.memorabilityFactor}"`);
    }
    if (ru.revealedQualities.length > 0) {
      lines.push(`REVEALED QUALITIES: [${ru.revealedQualities.join(', ')}]`);
    }

    return lines.join('\n');
  }

  /**
   * Parse Sonnet's raw JSON response into a typed RunningUnderstanding.
   * Applies defaults for missing fields and clamps numeric values.
   */
  parse(raw: unknown): RunningUnderstanding {
    if (!raw || typeof raw !== 'object') {
      return this.createEmpty();
    }

    const obj = raw as Record<string, unknown>;

    return {
      emergingThesis: isString(obj.emergingThesis) ? obj.emergingThesis : '',
      thesisConfidence: isNumber(obj.thesisConfidence) ? clamp(obj.thesisConfidence, 0, 100) : 0,
      thematicThreads: this.parseThematicThreads(obj.thematicThreads),

      arcSoFar: isString(obj.arcSoFar) ? obj.arcSoFar : '',
      arcType: isString(obj.arcType) ? obj.arcType as RunningUnderstanding['arcType'] : null,
      currentMomentum: this.parseEnum(obj.currentMomentum, VALID_ARC_MOMENTUMS, 'building'),
      turningPointDetected: isNumber(obj.turningPointDetected) ? obj.turningPointDetected : null,

      voiceFingerprint: this.parseVoiceFingerprint(obj.voiceFingerprint),

      emotionalArc: this.parseEmotionalArc(obj.emotionalArc),
      emotionalPeak: this.parseEmotionalPeak(obj.emotionalPeak),

      strengthsFound: this.parseStrengths(obj.strengthsFound),
      weaknessesFound: this.parseWeaknesses(obj.weaknessesFound),

      connections: this.parseConnections(obj.connections),
      redundancies: this.parseRedundancies(obj.redundancies),

      aoTakeaway: isString(obj.aoTakeaway) ? obj.aoTakeaway : '',
      memorabilityFactor: isString(obj.memorabilityFactor) ? obj.memorabilityFactor : null,
      revealedQualities: isArrayOf(obj.revealedQualities, isString) ? obj.revealedQualities : [],
    };
  }

  /**
   * Validate a RunningUnderstanding for structural correctness.
   */
  validate(ru: RunningUnderstanding): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Thesis confidence range
    if (ru.thesisConfidence < 0 || ru.thesisConfidence > 100) {
      errors.push(`thesisConfidence out of range: ${ru.thesisConfidence}`);
    }

    // Thematic threads
    for (let i = 0; i < ru.thematicThreads.length; i++) {
      const t = ru.thematicThreads[i];
      if (!t.thread) errors.push(`thematicThreads[${i}].thread is empty`);
      if (!VALID_THREAD_STRENGTHS.includes(t.strength)) {
        errors.push(`thematicThreads[${i}].strength invalid: ${t.strength}`);
      }
      if (t.lastSeenAt < t.introducedAt) {
        errors.push(`thematicThreads[${i}].lastSeenAt (${t.lastSeenAt}) < introducedAt (${t.introducedAt})`);
      }
    }

    // Momentum
    if (!VALID_ARC_MOMENTUMS.includes(ru.currentMomentum)) {
      errors.push(`currentMomentum invalid: ${ru.currentMomentum}`);
    }

    // Voice consistency
    if (ru.voiceFingerprint.consistencyScore < 0 || ru.voiceFingerprint.consistencyScore > 100) {
      errors.push(`voiceFingerprint.consistencyScore out of range: ${ru.voiceFingerprint.consistencyScore}`);
    }

    // Emotional arc depths
    for (let i = 0; i < ru.emotionalArc.length; i++) {
      const e = ru.emotionalArc[i];
      if (e.depth < 0 || e.depth > 100) {
        errors.push(`emotionalArc[${i}].depth out of range: ${e.depth}`);
      }
    }

    // Connection types
    for (let i = 0; i < ru.connections.length; i++) {
      if (!VALID_CONNECTION_TYPES.includes(ru.connections[i].type)) {
        errors.push(`connections[${i}].type invalid: ${ru.connections[i].type}`);
      }
    }

    // Weakness severities
    for (let i = 0; i < ru.weaknessesFound.length; i++) {
      if (!VALID_WEAKNESS_SEVERITIES.includes(ru.weaknessesFound[i].severity)) {
        errors.push(`weaknessesFound[${i}].severity invalid: ${ru.weaknessesFound[i].severity}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Check if the change between two RunningUnderstanding states is "significant".
   *
   * Used for early-stop in incremental re-walk: if editing paragraph 3 no longer
   * changes the RunningUnderstanding meaningfully by paragraph 5, we can stop.
   *
   * Compares: thesis, arcType, connections count, emotional journey depths.
   */
  isChangeSignificant(
    oldRU: RunningUnderstanding,
    newRU: RunningUnderstanding
  ): boolean {
    // Thesis changed
    if (oldRU.emergingThesis !== newRU.emergingThesis) return true;

    // Thesis confidence changed by >10%
    if (Math.abs(oldRU.thesisConfidence - newRU.thesisConfidence) > 10) return true;

    // Arc type changed
    if (oldRU.arcType !== newRU.arcType) return true;

    // Momentum changed
    if (oldRU.currentMomentum !== newRU.currentMomentum) return true;

    // Connection count changed (new connections found)
    if (oldRU.connections.length !== newRU.connections.length) return true;

    // Strength or weakness count changed
    if (oldRU.strengthsFound.length !== newRU.strengthsFound.length) return true;
    if (oldRU.weaknessesFound.length !== newRU.weaknessesFound.length) return true;

    // Emotional journey depths changed significantly
    const sharedLen = Math.min(oldRU.emotionalArc.length, newRU.emotionalArc.length);
    for (let i = 0; i < sharedLen; i++) {
      if (Math.abs(oldRU.emotionalArc[i].depth - newRU.emotionalArc[i].depth) > 15) return true;
      if (oldRU.emotionalArc[i].register !== newRU.emotionalArc[i].register) return true;
    }
    // New emotional arc entries count as significant
    if (oldRU.emotionalArc.length !== newRU.emotionalArc.length) return true;

    // Turning point detected or changed
    if (oldRU.turningPointDetected !== newRU.turningPointDetected) return true;

    // Voice consistency changed significantly
    if (Math.abs(oldRU.voiceFingerprint.consistencyScore - newRU.voiceFingerprint.consistencyScore) > 10) return true;

    // AO takeaway changed
    if (oldRU.aoTakeaway !== newRU.aoTakeaway) return true;

    return false;
  }

  // ══════════════════════════════════════════════════════════════
  // PRIVATE PARSE HELPERS
  // ══════════════════════════════════════════════════════════════

  private parseEnum<T extends string>(val: unknown, valid: readonly T[], fallback: T): T {
    if (isString(val) && (valid as readonly string[]).includes(val)) {
      return val as T;
    }
    return fallback;
  }

  private parseThematicThreads(val: unknown): RunningUnderstanding['thematicThreads'] {
    if (!Array.isArray(val)) return [];
    return val
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
      .map(item => ({
        thread: isString(item.thread) ? item.thread : '',
        introducedAt: isNumber(item.introducedAt) ? item.introducedAt : 0,
        lastSeenAt: isNumber(item.lastSeenAt) ? item.lastSeenAt : 0,
        strength: this.parseEnum(item.strength, VALID_THREAD_STRENGTHS, 'hinted'),
      }))
      .filter(t => t.thread.length > 0);
  }

  private parseVoiceFingerprint(val: unknown): RunningUnderstanding['voiceFingerprint'] {
    if (!val || typeof val !== 'object') {
      return { dominantRegister: '', authenticMoments: [], voiceDrifts: [], consistencyScore: 0 };
    }
    const obj = val as Record<string, unknown>;
    return {
      dominantRegister: isString(obj.dominantRegister) ? obj.dominantRegister : '',
      authenticMoments: isArrayOf(obj.authenticMoments, isString)
        ? obj.authenticMoments
        : [],
      voiceDrifts: this.parseVoiceDrifts(obj.voiceDrifts),
      consistencyScore: isNumber(obj.consistencyScore) ? clamp(obj.consistencyScore, 0, 100) : 0,
    };
  }

  private parseVoiceDrifts(val: unknown): RunningUnderstanding['voiceFingerprint']['voiceDrifts'] {
    if (!Array.isArray(val)) return [];
    return val
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
      .map(item => ({
        paragraph: isNumber(item.paragraph) ? item.paragraph : 0,
        from: isString(item.from) ? item.from : '',
        to: isString(item.to) ? item.to : '',
      }))
      .filter(d => d.from.length > 0 && d.to.length > 0);
  }

  private parseEmotionalArc(val: unknown): RunningUnderstanding['emotionalArc'] {
    if (!Array.isArray(val)) return [];
    return val
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
      .map(item => ({
        paragraph: isNumber(item.paragraph) ? item.paragraph : 0,
        register: isString(item.register) ? item.register : '',
        depth: isNumber(item.depth) ? clamp(item.depth, 0, 100) : 50,
        isEarned: typeof item.isEarned === 'boolean' ? item.isEarned : true,
      }));
  }

  private parseEmotionalPeak(val: unknown): RunningUnderstanding['emotionalPeak'] {
    if (!val || typeof val !== 'object') return null;
    const obj = val as Record<string, unknown>;
    if (!isNumber(obj.paragraph) || !isString(obj.moment)) return null;
    return { paragraph: obj.paragraph, moment: obj.moment };
  }

  private parseStrengths(val: unknown): RunningUnderstanding['strengthsFound'] {
    if (!Array.isArray(val)) return [];
    return val
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
      .map(item => ({
        quality: isString(item.quality) ? item.quality : '',
        paragraph: isNumber(item.paragraph) ? item.paragraph : 0,
        evidence: isString(item.evidence) ? item.evidence : '',
      }))
      .filter(s => s.quality.length > 0);
  }

  private parseWeaknesses(val: unknown): RunningUnderstanding['weaknessesFound'] {
    if (!Array.isArray(val)) return [];
    return val
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
      .map(item => ({
        quality: isString(item.quality) ? item.quality : '',
        paragraph: isNumber(item.paragraph) ? item.paragraph : 0,
        description: isString(item.description) ? item.description : '',
        severity: this.parseEnum(item.severity, VALID_WEAKNESS_SEVERITIES, 'minor'),
      }))
      .filter(w => w.quality.length > 0);
  }

  private parseConnections(val: unknown): RunningUnderstanding['connections'] {
    if (!Array.isArray(val)) return [];
    return val
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
      .map(item => {
        const paragraphs = Array.isArray(item.paragraphs) && item.paragraphs.length >= 2
          ? [Number(item.paragraphs[0]), Number(item.paragraphs[1])] as [number, number]
          : [0, 0] as [number, number];
        return {
          type: this.parseEnum(item.type, VALID_CONNECTION_TYPES, 'parallel'),
          paragraphs,
          description: isString(item.description) ? item.description : '',
        };
      })
      .filter(c => c.description.length > 0);
  }

  private parseRedundancies(val: unknown): RunningUnderstanding['redundancies'] {
    if (!Array.isArray(val)) return [];
    return val
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
      .map(item => ({
        paragraphs: Array.isArray(item.paragraphs) ? item.paragraphs.filter(isNumber) : [],
        overlappingContent: isString(item.overlappingContent) ? item.overlappingContent : '',
      }))
      .filter(r => r.paragraphs.length > 0 && r.overlappingContent.length > 0);
  }
}

/** Singleton instance */
export const runningUnderstandingManager = new RunningUnderstandingManager();
