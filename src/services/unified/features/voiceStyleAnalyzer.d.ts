/**
 * VOICE & STYLE ANALYZER
 *
 * Dimension 4: Distinctive Voice & Style (8% weight)
 *
 * Detects natural, authentic voice vs generic essay-speak:
 * - Essay-speak detection ("this taught me", "through this experience")
 * - AI phrase flagging ("delve into", "furthermore", "it should be noted")
 * - Active vs passive voice ratio (80%+ active = world-class)
 * - Fancy word penalties ("plethora", "myriad", "utilize")
 * - Sentence rhythm variety (mix of 3-word + 20+ word sentences)
 * - Conversational markers ("I mean", "honestly", "yeah")
 *
 * Scoring Philosophy:
 * - Zero essay-speak + 80%+ active + natural vocab = 9-10
 * - Heavy essay-speak + AI phrases + passive voice = 0-3
 */
export interface VoiceStyleAnalysis {
    voice_score: number;
    voice_quality: 'authentic_distinctive' | 'strong_voice' | 'mixed_voice' | 'generic_essay' | 'ai_generated';
    has_essay_speak: boolean;
    essay_speak_count: number;
    essay_speak_examples: string[];
    has_ai_phrases: boolean;
    ai_phrase_count: number;
    ai_phrase_examples: string[];
    active_voice_count: number;
    passive_voice_count: number;
    active_ratio: number;
    active_examples: string[];
    passive_examples: string[];
    fancy_word_count: number;
    fancy_word_examples: string[];
    has_rhythm_variety: boolean;
    short_sentence_count: number;
    long_sentence_count: number;
    rhythm_score: number;
    conversational_count: number;
    conversational_examples: string[];
    strengths: string[];
    weaknesses: string[];
    quick_wins: string[];
}
/**
 * Analyze voice and style in an essay
 */
export declare function analyzeVoiceStyle(essayText: string): VoiceStyleAnalysis;
//# sourceMappingURL=voiceStyleAnalyzer.d.ts.map