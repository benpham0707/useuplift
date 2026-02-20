/**
 * Authenticity & Anti-AI-Detection Types
 * Phase 2 implementation — heuristic-based AI risk assessment
 */

import type { StudentVoiceProfile } from '../voiceProfile/types';

/** AI risk assessment for a piece of text */
export interface AIRiskAssessment {
  /** Overall AI-likeness score (0-100, higher = more AI-like) */
  overallRisk: number;
  riskLevel: 'low' | 'medium' | 'high';
  flaggedPassages: {
    text: string;
    risk: number;
    reason: string;
    suggestion: string;
  }[];
  metrics: {
    vocabularyUniformity: number;
    sentenceLengthVariance: number;
    genericReflectionDensity: number;
    bannedTermCount: number;
    clicheDensity: number;
    hedgingDensity: number;
    adverbDensity: number;
    firstPersonDensity: number;
  };
}
