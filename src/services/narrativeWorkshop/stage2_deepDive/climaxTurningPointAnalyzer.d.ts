/**
 * Stage 2.3: Climax & Turning Point Analysis Engine
 *
 * Deep dive analysis of essay's climactic moment and turning point.
 * Critical because: Turning points show intellectual/emotional growth and self-awareness.
 *
 * Focus Areas:
 * - Climax identification (peak of tension/conflict)
 * - Turning point detection ("that's when I realized...")
 * - Stakes clarity (what's at risk?)
 * - Vulnerability moments (admitting uncertainty, failure, fear)
 * - Conflict presence and complexity
 *
 * Elite Benchmarks (from 20 top essays):
 * - 85% have 2+ vulnerability moments with specific details
 * - 95% have clear turning point (before → after realization)
 * - Elite essays show stakes explicitly (what could be lost)
 * - Strong essays have internal conflict (not just external challenges)
 * - Top essays use physical/sensory descriptions of emotional moments
 *
 * LLM Configuration:
 * - Temperature: 0.5 (analytical + interpretive for emotional nuance)
 * - Model: Sonnet 4.5
 * - Focus: Vulnerability, growth, transformation
 */
import { ClimaxTurningPointAnalysis, NarrativeEssayInput } from '../types';
/**
 * Analyze climax and turning point
 */
export declare function analyzeClimaxTurningPoint(input: NarrativeEssayInput, essayType: string): Promise<ClimaxTurningPointAnalysis>;
/**
 * Quick deterministic detection (pre-LLM)
 */
export declare function detectTurningPointsDeterministic(essayText: string): {
    turningPointMarkers: string[];
    vulnerabilityMarkers: string[];
    conflictMarkers: string[];
    flags: string[];
};
/**
 * Extract middle section where climax typically occurs
 */
export declare function extractMiddleSection(essayText: string): string;
/**
 * Find sentence containing turning point
 */
export declare function findTurningPointSentence(essayText: string): {
    found: boolean;
    sentenceIndex: number;
    sentence: string;
} | null;
//# sourceMappingURL=climaxTurningPointAnalyzer.d.ts.map