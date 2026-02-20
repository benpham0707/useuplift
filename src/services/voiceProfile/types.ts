/**
 * Voice Profile Types
 *
 * Defines the StudentVoiceProfile — a persistent, cross-workshop
 * representation of a student's authentic writing voice.
 *
 * Voice profiles are built from essay samples, chat interactions,
 * and uploaded writing. They are injected into LLM prompts to
 * ensure all coaching preserves the student's authentic voice.
 */

import type { EmotionalRegister } from '../commonAppWorkshop/types/stage0Types';

// ============================================================================
// CORE VOICE PROFILE
// ============================================================================

/**
 * A persistent voice profile for a student.
 *
 * Built incrementally from writing samples across all workshops.
 * Injected into LLM system prompts to constrain suggestions.
 */
export interface StudentVoiceProfile {
  userId: string;
  version: number;
  createdAt: string;
  updatedAt: string;

  /** Emotional register detection */
  register: {
    primary: EmotionalRegister;
    secondary?: EmotionalRegister;
    confidence: number; // 0-1
  };

  /** Linguistic fingerprint */
  linguistics: {
    averageSentenceLength: number;
    sentenceLengthVariety: number; // 1-10
    vocabularyLevel: 'sophisticated' | 'clear' | 'simple';
    formality: 'formal' | 'semi-formal' | 'casual';
    fragmentUse: 'effective' | 'moderate' | 'minimal';
    signatureWords: string[];
    avoidWords: string[];
  };

  /** Personality traits expressed through writing */
  personality: {
    energy: 'high' | 'medium' | 'low';
    humor: 'frequent' | 'occasional' | 'rare';
    directness: 'very_direct' | 'moderate' | 'circumspect';
    emotionalOpenness: 'open' | 'guarded' | 'reserved';
  };

  /** Phrases that must be preserved exactly */
  authenticPhrases: AuthenticPhrase[];

  /** Known weaknesses in the student's writing */
  weaknesses: string[];

  /** Things that must NOT be edited away */
  preservationWarnings: string[];

  /** Overall confidence in this profile (0-1) */
  confidence: number;

  /** Number of samples used to build this profile */
  sampleCount: number;

  /** Timestamp of the last sample analyzed */
  lastSampleAt: string;
}

/**
 * A phrase identified as authentically the student's voice.
 */
export interface AuthenticPhrase {
  phrase: string;
  source: 'essay' | 'chat' | 'uploaded_sample';
  sourceId?: string;
  preserveExactly: boolean;
}
