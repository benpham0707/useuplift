/**
 * INITIATIVE & LEADERSHIP ANALYZER
 *
 * Dimension 7B: Initiative & Leadership (7% weight)
 *
 * Detects self-directed action and informal leadership:
 * - Problem identification ("I noticed", "I saw that nobody")
 * - Opportunity creation ("I started/founded/created")
 * - Self-directed action ("I taught myself", "without being asked")
 * - Risk-taking ("I wasn't sure... but I")
 * - Informal leadership (leading without title)
 * - Reactive language penalty ("I was told/asked to")
 *
 * Scoring Philosophy:
 * - Problem-spotting + self-directed + risk-taking = 9-10
 * - Reactive + title without initiative = 0-3
 */
export interface InitiativeLeadershipAnalysis {
    initiative_score: number;
    initiative_quality: 'proactive_builder' | 'strong_initiative' | 'mixed_leadership' | 'reactive_participation' | 'passive_member';
    identifies_problems: boolean;
    problem_identification_count: number;
    problem_examples: string[];
    creates_opportunities: boolean;
    opportunity_creation_count: number;
    opportunity_examples: string[];
    shows_self_direction: boolean;
    self_direction_count: number;
    self_direction_examples: string[];
    takes_risks: boolean;
    risk_taking_count: number;
    risk_examples: string[];
    shows_informal_leadership: boolean;
    informal_leadership_count: number;
    informal_leadership_examples: string[];
    has_reactive_language: boolean;
    reactive_count: number;
    reactive_examples: string[];
    has_title: boolean;
    title_count: number;
    title_examples: string[];
    strengths: string[];
    weaknesses: string[];
    quick_wins: string[];
}
/**
 * Analyze initiative and leadership in an essay
 */
export declare function analyzeInitiativeLeadership(essayText: string): InitiativeLeadershipAnalysis;
//# sourceMappingURL=initiativeLeadershipAnalyzer.d.ts.map