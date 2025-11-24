/**
 * VOICE & WRITING STYLE LLM ANALYZER
 *
 * Dimension: Voice & Writing Style (6% weight)
 *
 * Evaluates narrative authenticity and writing quality:
 * - Does this sound like a real person who lived the experience?
 * - Voice integrity: honesty, specificity of perspective, natural cadence
 * - Absence of essay-speak, AI-ish phrasing, corporate jargon
 * - Warmth and clarity over grandiosity
 *
 * Based on the v4 "Gold Standard" Architecture.
 */
export interface VoiceStyleAnalysis {
    score: number;
    quality_level: 'distinctive_voice' | 'authentic_voice' | 'some_personality' | 'flat_correct' | 'essay_speak' | 'ai_generated';
    reasoning: {
        voice_authenticity: string;
        sentence_cadence: string;
        perspective_specificity: string;
        essay_speak_analysis: string;
    };
    tier_evaluation: {
        current_tier: 'ai_template' | 'resume_prose' | 'emerging_voice' | 'authentic' | 'distinctive';
        next_tier: 'resume_prose' | 'emerging_voice' | 'authentic' | 'distinctive' | 'max_tier';
        tier_reasoning: string;
    };
    evidence_quotes: string[];
    evaluator_note: string;
    authentic_signals: {
        present: boolean;
        examples: string[];
        description: string;
    };
    manufactured_signals: {
        present: boolean;
        examples: string[];
        description: string;
    };
    sensory_details: {
        present: boolean;
        examples: string[];
        description: string;
    };
    distinctive_phrases: {
        present: boolean;
        examples: string[];
        description: string;
    };
    strengths: string[];
    weaknesses: string[];
    strategic_pivot: string;
    writer_prompts: string[];
    confidence: number;
}
export declare function analyzeVoiceStyle(essayText: string): Promise<VoiceStyleAnalysis>;
//# sourceMappingURL=voiceStyleAnalyzer_llm.d.ts.map