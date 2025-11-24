/**
 * Stage 2.4: Conclusion & Reflection Analysis Engine
 *
 * Deep dive analysis of essay conclusion and reflection quality.
 * Critical because: Reflection shows intellectual depth and meaning-making ability.
 *
 * Focus Areas:
 * - Conclusion structure and strength
 * - Reflection depth (surface → profound)
 * - Meaning-making (extracting portable insights)
 * - Micro→macro structure (70% of elite essays)
 * - Philosophical depth and intellectual maturity
 * - Future connection (forward-looking perspective)
 *
 * Elite Benchmarks (from 20 top essays):
 * - 70% use micro→macro structure (small moment → universal insight)
 * - 75% show philosophical depth (reframing, portable lessons)
 * - Elite essays avoid clichés ("taught me teamwork/leadership")
 * - Strong essays extract meaning beyond the activity itself
 * - Top essays show nuanced thinking (not black/white)
 *
 * LLM Configuration:
 * - Temperature: 0.4 (analytical for depth assessment)
 * - Model: Sonnet 4.5
 * - Focus: Intellectual maturity, meaning-making, philosophical insight
 */
import { ConclusionReflectionAnalysis, NarrativeEssayInput } from '../types';
/**
 * Analyze conclusion and reflection
 */
export declare function analyzeConclusionReflection(input: NarrativeEssayInput, essayType: string): Promise<ConclusionReflectionAnalysis>;
/**
 * Quick deterministic analysis of conclusion (pre-LLM)
 */
export declare function analyzeConclusionDeterministic(essayText: string): {
    hasMicroToMacro: boolean;
    clicheCount: number;
    cliches: string[];
    reflectionMarkers: string[];
    futureMarkers: string[];
    flags: string[];
};
/**
 * Extract conclusion section (last 20%)
 */
export declare function extractConclusion(essayText: string): string;
/**
 * Detect micro→macro structure
 */
export declare function detectMicroToMacro(essayText: string): {
    detected: boolean;
    specificMoment: string | null;
    universalInsight: string | null;
};
/**
 * Extract last paragraph
 */
export declare function getLastParagraph(essayText: string): string;
//# sourceMappingURL=conclusionReflectionAnalyzer.d.ts.map