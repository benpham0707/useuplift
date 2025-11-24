/**
 * CRAFT & LANGUAGE LLM ANALYZER
 *
 * Dimension: Craft & Language Quality
 *
 * Evaluates the technical quality and literary sophistication of the writing:
 * - Word Choice: Strong verbs vs weak verbs ("dashed" vs "went").
 * - Sentence Variety: Mix of long/short sentences. Rhythm.
 * - Literary Devices: Metaphor, simile, imagery.
 * - Clarity/Conciseness: No fluff.
 *
 * Based on the v4 "Gold Standard" Architecture.
 */
export interface CraftAnalysis {
    score: number;
    quality_level: 'sophisticated' | 'polished' | 'competent' | 'functional';
    reasoning: {
        verb_strength: string;
        sentence_variety: string;
        literary_devices: string;
        clarity_conciseness: string;
    };
    tier_evaluation: {
        current_tier: 'functional' | 'competent' | 'polished' | 'sophisticated';
        next_tier: 'competent' | 'polished' | 'sophisticated' | 'max_tier';
        tier_reasoning: string;
    };
    evidence_quotes: string[];
    evaluator_note: string;
    technical_aspects: {
        strong_verbs_count: number;
        cliches_count: number;
        sentence_rhythm: 'varied' | 'repetitive' | 'choppy' | 'flowery';
    };
    strengths: string[];
    weaknesses: string[];
    strategic_pivot: string;
    writer_prompts: string[];
    confidence: number;
}
export declare function analyzeCraft(essayText: string): Promise<CraftAnalysis>;
//# sourceMappingURL=craftAnalyzer_llm.d.ts.map