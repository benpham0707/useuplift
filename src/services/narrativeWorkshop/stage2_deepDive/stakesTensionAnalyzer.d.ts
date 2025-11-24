/**
 * Stage 2.6: Stakes & Tension Analysis Engine
 *
 * Deep dive analysis of narrative tension, conflict, and stakes.
 * Critical because: Tension keeps readers engaged; stakes make them care.
 *
 * Focus Areas:
 * - Tension presence and building (does essay maintain reader interest?)
 * - Conflict clarity (internal/external/both?)
 * - Stakes establishment (what's at risk? why does it matter?)
 * - Suspense techniques (withholding, pacing, anticipation)
 * - Resolution quality (satisfying payoff? earned insight?)
 * - Reader investment (will AO care about outcome?)
 *
 * Elite Benchmarks (from 20 top essays):
 * - 95% establish clear stakes within first 25% of essay
 * - 80% have both internal + external conflict
 * - Elite essays maintain tension through uncertainty
 * - Strong essays use specific obstacles (not vague "challenges")
 * - Top essays resolve tension with earned insight (not neat bow)
 * - Reader investment requires personal cost + specific stakes
 *
 * LLM Configuration:
 * - Temperature: 0.5 (interpretive for tension/engagement)
 * - Model: Sonnet 4.5
 * - Focus: Tension pacing, stakes clarity, conflict complexity
 */
import { StakesTensionAnalysis, NarrativeEssayInput } from '../types';
/**
 * Analyze stakes and tension
 */
export declare function analyzeStakesTension(input: NarrativeEssayInput, essayType: string): Promise<StakesTensionAnalysis>;
/**
 * Quick deterministic detection of stakes and tension (pre-LLM)
 */
export declare function analyzeStakesTensionDeterministic(essayText: string): {
    conflictMarkers: string[];
    internalConflictCount: number;
    externalConflictCount: number;
    tensionMarkers: string[];
    suspenseMarkers: string[];
    stakesMarkers: string[];
    flags: string[];
};
/**
 * Detect stakes establishment timing
 */
export declare function detectStakesEstablishment(essayText: string): {
    stakesPresent: boolean;
    establishedByPercent: number;
    stakesDescription: string | null;
};
/**
 * Assess conflict type and complexity
 */
export declare function assessConflictType(essayText: string): {
    hasInternal: boolean;
    hasExternal: boolean;
    conflictType: 'internal' | 'external' | 'both' | 'none';
    complexity: 'simple' | 'moderate' | 'complex';
};
/**
 * Detect tension-building techniques
 */
export declare function detectTensionTechniques(essayText: string): {
    techniques: string[];
    tensionLevel: 'none' | 'low' | 'moderate' | 'high';
};
//# sourceMappingURL=stakesTensionAnalyzer.d.ts.map