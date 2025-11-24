/**
 * SPECIFICITY & EVIDENCE ANALYZER
 *
 * Dimension 3: Specificity & Evidence (10% weight)
 *
 * Detects concrete details, numbers, and evidence that build credibility:
 * - Quantified metrics (hours, people, percentages, dollars)
 * - Proper nouns (names, places, organizations, titles)
 * - Time specificity (dates, durations, timelines)
 * - Before/after comparisons with numbers
 * - Concrete vs vague language
 *
 * Works alongside vividnessAnalyzer (sensory details) to form complete
 * Specificity dimension score.
 */
export interface SpecificityAnalysis {
    specificity_score: number;
    evidence_strength: 'concrete' | 'mixed' | 'vague' | 'abstract';
    numbers_count: number;
    numbers_examples: string[];
    has_percentages: boolean;
    has_time_duration: boolean;
    has_money_amounts: boolean;
    has_people_counts: boolean;
    proper_nouns_count: number;
    person_names: string[];
    place_names: string[];
    organization_names: string[];
    specific_titles: string[];
    has_specific_dates: boolean;
    has_time_markers: boolean;
    time_examples: string[];
    has_before_after: boolean;
    comparison_examples: string[];
    concrete_details_count: number;
    vague_phrases_count: number;
    vague_examples: string[];
    strengths: string[];
    weaknesses: string[];
    quick_wins: string[];
}
/**
 * Analyze specificity and evidence in an essay
 */
export declare function analyzeSpecificity(essayText: string): SpecificityAnalysis;
//# sourceMappingURL=specificityAnalyzer.d.ts.map