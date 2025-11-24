/**
 * OPENING HOOK ANALYZER V5 - HYBRID APPROACH
 *
 * Philosophy:
 * - Deterministic patterns for SPEED and RELIABILITY (known patterns)
 * - LLM for UNDERSTANDING and ADAPTABILITY (novel patterns, nuanced analysis)
 * - LLM learns from examples, not hard-coded rules
 * - System improves as LLM sees more examples
 *
 * Two-stage approach:
 * 1. Quick deterministic check (instant, 95%+ accuracy on common patterns)
 * 2. LLM deep analysis (understands WHY, handles edge cases, provides insights)
 */
export type HookType = 'shocking_statement' | 'paradox' | 'provocative_question' | 'scene_immersion' | 'vulnerability_first' | 'dialogue_opening' | 'list_catalog' | 'metaphor_extended' | 'in_medias_res' | 'identity_statement' | 'false_certainty' | 'generic_opening';
export interface HookAnalysisResult {
    hook_type: HookType;
    hook_type_confidence: number;
    detection_method: 'deterministic' | 'llm' | 'hybrid';
    why_this_type: string;
    effectiveness_score: number;
    hook_tier: 'weak' | 'adequate' | 'strong' | 'exceptional';
    what_makes_it_work: string[];
    what_could_be_stronger: string[];
    what_i_notice: string;
    what_works: string;
    opportunity: string;
    next_step: string;
    literary_techniques: string[];
    voice_quality: string;
    specificity_level: 'hyperspecific' | 'specific' | 'general' | 'vague';
    matched_patterns?: string[];
    key_phrases?: string[];
}
export declare function analyzeOpeningHookV5(fullEssay: string, options?: {
    forceLLM?: boolean;
    essayType?: 'leadership' | 'challenge' | 'creative' | 'academic' | 'growth';
    depth?: 'quick' | 'comprehensive';
}): Promise<HookAnalysisResult>;
//# sourceMappingURL=openingHookAnalyzer_v5_hybrid.d.ts.map