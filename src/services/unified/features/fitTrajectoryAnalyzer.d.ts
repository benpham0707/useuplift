/**
 * FIT & TRAJECTORY ANALYZER
 *
 * Dimension 8/13: Contribution & Fit (7% weight)
 *
 * Detects future connection and credible trajectory:
 * - Specific future connection (major, career, continued work)
 * - Logical trajectory from experience to future
 * - Continued commitment indicators ("I plan to continue")
 * - UC-specific mentions (bonus)
 * - Credible next steps
 * - Generic "change the world" penalty
 *
 * Scoring Philosophy:
 * - Specific trajectory + continued commitment + UC mentions = 9-10
 * - Generic mission + no connection + one-time thing = 0-3
 */
export interface FitTrajectoryAnalysis {
    fit_score: number;
    fit_quality: 'clear_trajectory' | 'strong_connection' | 'some_connection' | 'generic_mission' | 'no_future_link';
    has_future_connection: boolean;
    future_connection_type: ('major' | 'career' | 'continued_work' | 'research' | 'none')[];
    future_connection_count: number;
    future_connection_examples: string[];
    has_logical_trajectory: boolean;
    trajectory_strength: 'explicit' | 'implied' | 'weak' | 'absent';
    trajectory_examples: string[];
    shows_continued_commitment: boolean;
    commitment_count: number;
    commitment_examples: string[];
    has_uc_mentions: boolean;
    uc_mention_count: number;
    uc_mention_examples: string[];
    has_credible_next_steps: boolean;
    next_step_count: number;
    next_step_examples: string[];
    has_generic_mission: boolean;
    generic_mission_count: number;
    generic_mission_examples: string[];
    strengths: string[];
    weaknesses: string[];
    quick_wins: string[];
}
/**
 * Analyze fit and trajectory in an essay
 */
export declare function analyzeFitTrajectory(essayText: string): FitTrajectoryAnalysis;
//# sourceMappingURL=fitTrajectoryAnalyzer.d.ts.map