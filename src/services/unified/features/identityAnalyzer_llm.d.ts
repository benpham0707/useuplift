/**
 * IDENTITY & SELF-DISCOVERY LLM ANALYZER
 *
 * Dimension: Identity & Self-Discovery
 *
 * Evaluates how well the essay reveals the student's core self:
 * - Does it reveal *who* the student is (values, traits, personality)?
 * - Is the identity complex (nuanced) or simple (one-note)?
 * - Is the self-concept told ("I am a leader") or shown through choices?
 *
 * Based on the v4 "Gold Standard" Architecture.
 */
export interface IdentityAnalysis {
    score: number;
    quality_level: 'deep' | 'emerging' | 'surface' | 'invisible';
    reasoning: {
        core_values: string[];
        identity_complexity: string;
        show_vs_tell_identity: string;
        authenticity_check: string;
    };
    tier_evaluation: {
        current_tier: 'invisible' | 'surface' | 'emerging' | 'deep';
        next_tier: 'surface' | 'emerging' | 'deep' | 'max_tier';
        tier_reasoning: string;
    };
    evidence_quotes: string[];
    evaluator_note: string;
    traits: {
        dominant_trait: string;
        supporting_traits: string[];
        contradictions: string[];
    };
    strengths: string[];
    weaknesses: string[];
    strategic_pivot: string;
    writer_prompts: string[];
    confidence: number;
}
export declare function analyzeIdentity(essayText: string): Promise<IdentityAnalysis>;
//# sourceMappingURL=identityAnalyzer_llm.d.ts.map