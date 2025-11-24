/**
 * Stage 2.5: Character Development Analysis Engine
 *
 * Deep dive analysis of protagonist characterization and voice authenticity.
 * Critical because: Strong character = clear voice + interiority + authentic growth.
 *
 * Focus Areas:
 * - Interiority presence (internal thoughts, feelings, reasoning)
 * - Voice authenticity (sounds like real person, age-appropriate, consistent)
 * - Character growth demonstration (before → after transformation)
 * - Dialogue usage and quality (reveals character, advances story)
 * - Emotion description (physical/sensory vs abstract/telling)
 * - Protagonist clarity (reader knows who narrator is)
 * - Agency level (active decision-maker vs passive observer)
 *
 * Elite Benchmarks (from 20 top essays):
 * - 90% demonstrate interiority through specific thoughts/reactions
 * - 75% use physical emotion descriptions ("clammy hands" vs "I felt nervous")
 * - Elite essays show growth through changed actions/perspectives
 * - Strong dialogue is sparse but meaningful (≤5% of essay)
 * - Top essays have distinctive voice (word choice, rhythm, perspective)
 * - Protagonist has clear identity markers within first 100 words
 *
 * LLM Configuration:
 * - Temperature: 0.5 (interpretive for voice/character nuance)
 * - Model: Sonnet 4.5
 * - Focus: Authenticity, interiority, voice consistency
 */
import { CharacterDevelopmentAnalysis, NarrativeEssayInput } from '../types';
/**
 * Analyze character development and voice authenticity
 */
export declare function analyzeCharacterDevelopment(input: NarrativeEssayInput, essayType: string): Promise<CharacterDevelopmentAnalysis>;
/**
 * Quick deterministic analysis of character development (pre-LLM)
 */
export declare function analyzeCharacterDeterministic(essayText: string): {
    interiorityMarkers: string[];
    physicalEmotionCount: number;
    abstractEmotionCount: number;
    dialoguePercentage: number;
    activeVerbCount: number;
    passiveConstructionCount: number;
    flags: string[];
};
/**
 * Detect interiority presence
 */
export declare function detectInteriority(essayText: string): {
    present: boolean;
    markers: string[];
    depth: 'none' | 'minimal' | 'moderate' | 'deep';
};
/**
 * Detect emotion description style
 */
export declare function detectEmotionStyle(essayText: string): {
    physicalCount: number;
    behavioralCount: number;
    abstractCount: number;
    dominantStyle: 'physical' | 'behavioral' | 'abstract' | 'mixed' | 'minimal';
};
/**
 * Detect dialogue usage
 */
export declare function detectDialogue(essayText: string): {
    present: boolean;
    estimatedPercentage: number;
    quoteCount: number;
};
/**
 * Assess protagonist clarity
 */
export declare function assessProtagonistClarity(essayText: string): {
    identityMarkersFound: string[];
    establishedEarly: boolean;
    clarity: 'clear' | 'moderate' | 'vague';
};
//# sourceMappingURL=characterDevelopmentAnalyzer.d.ts.map