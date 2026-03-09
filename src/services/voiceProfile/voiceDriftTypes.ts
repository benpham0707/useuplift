/**
 * Voice Drift Analysis Types
 *
 * Detects when editing has drifted the text away from the student's
 * authentic voice profile. Grammarly CREATES drift. Kolly IGNORES it.
 * We DETECT and prevent it.
 */

/** Per-dimension drift signal */
export interface DriftSignal {
  /** Which voice dimension drifted */
  dimension: 'sentence_length' | 'vocabulary_level' | 'formality' | 'contraction_rate' | 'energy';
  /** Baseline value from voice profile */
  baseline: number;
  /** Current value in the text */
  current: number;
  /** Absolute deviation */
  deviation: number;
  /** How severe the drift is */
  severity: 'none' | 'low' | 'medium' | 'high';
  /** Human-readable explanation */
  explanation: string;
}

/** Full voice drift analysis result */
export interface VoiceDriftAnalysis {
  /** Overall drift score (0-100, 0 = no drift, 100 = completely different voice) */
  driftScore: number;
  /** Per-dimension signals */
  signals: DriftSignal[];
  /** Is the current text still acceptably close to the student's voice? */
  isAcceptable: boolean;
  /** Human-readable summary */
  summary: string;
}
