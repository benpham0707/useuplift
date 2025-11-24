/**
 * FIT & TRAJECTORY LLM ANALYZER
 *
 * Dimension: Fit & Trajectory (Why Major?) (6% weight)
 *
 * Evaluates the alignment between the student's stated goals/major
 * and their actual activities/intellectual vitality.
 *
 * - Does the student have a clear "North Star"?
 * - Do their activities align with their stated goals?
 * - Is the "Why Major" argument convincing and evidence-based?
 *
 * Based on the v4 "Gold Standard" Architecture.
 */
export interface FitTrajectoryAnalysis {
    score: number;
    quality_level: 'alignment' | 'pursuit' | 'interest' | 'disconnect';
    reasoning: {
        goal_analysis: string;
        alignment_analysis: string;
        vitality_analysis: string;
        trajectory_analysis: string;
    };
    tier_evaluation: {
        current_tier: 'disconnect' | 'interest' | 'pursuit' | 'alignment';
        next_tier: 'interest' | 'pursuit' | 'alignment' | 'max_tier';
        tier_reasoning: string;
    };
    evidence_quotes: string[];
    evaluator_note: string;
    major_goal: {
        identified: boolean;
        specificity: 'specific' | 'broad' | 'vague' | 'absent';
        topic: string;
        description: string;
    };
    activity_alignment: {
        aligned: boolean;
        strength: 'strong' | 'moderate' | 'weak' | 'none';
        examples: string[];
        description: string;
    };
    intellectual_vitality: {
        present: boolean;
        level: 'high' | 'moderate' | 'low' | 'none';
        examples: string[];
        description: string;
    };
    strengths: string[];
    weaknesses: string[];
    strategic_pivot: string;
    writer_prompts: string[];
    confidence: number;
}
/**
 * Analyze Fit & Trajectory using LLM semantic understanding
 */
export declare function analyzeFitTrajectory(essayText: string, intendedMajor?: string): Promise<FitTrajectoryAnalysis>;
//# sourceMappingURL=fitTrajectoryAnalyzer_llm.d.ts.map