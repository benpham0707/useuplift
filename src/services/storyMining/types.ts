/**
 * Story Mining & Brainstorming Types
 * Phase 3 implementation — discover compelling stories from student activities
 */

import type { EmotionalRegister } from '../commonAppWorkshop/types/stage0Types';

/** A discovered story seed from student activities */
export interface StorySeed {
  id: string;
  /** The specific moment/decision/conflict */
  moment: string;
  /** Activities it draws from */
  sourceActivityIds: string[];
  /** The emotional core */
  emotionalCore: string;
  /** What makes it distinctive */
  distinctiveness: {
    score: number;
    reasoning: string;
    uniqueElements: string[];
  };
  /** Reflection depth potential */
  reflectionDepth: {
    score: number;
    possibleInsights: string[];
  };
  /** Prompt fit scores */
  promptFit: {
    promptId: string;
    fitScore: number;
    fitReasoning: string;
  }[];
  /** Suggested narrative angles */
  narrativeAngles: string[];
  /** Voice register that fits this story */
  suggestedRegister: EmotionalRegister;
  /** Raw student quotes that could start this story */
  seedQuotes: string[];
}

/** Result from a story mining session */
export interface StoryMiningResult {
  sessionId: string;
  userId: string;
  seeds: StorySeed[];
  clusters: {
    theme: string;
    seedIds: string[];
    clusterStrength: number;
  }[];
  topRecommendations: {
    promptId: string;
    recommendedSeedId: string;
    reasoning: string;
  }[];
  metadata: {
    generatedAt: string;
    modelUsed: string;
    tokensUsed: { input: number; output: number };
    cost: number;
  };
}
