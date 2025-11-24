/**
 * ROLE CLARITY & OWNERSHIP ANALYZER
 *
 * Dimension 7A: Role Clarity & Ownership (7% weight)
 *
 * Detects individual agency vs team credit ambiguity:
 * - "I" vs "we" statement ratio (80%+ I statements = world-class)
 * - Specific role descriptions vs title-only mentions
 * - Differentiation of personal contribution from team's work
 * - Ownership of failures ("I messed up", not "we struggled")
 * - Vague language penalties ("helped with", "was part of")
 * - Strong action verbs showing individual agency
 *
 * Scoring Philosophy:
 * - High "I" ratio + specific role + failure ownership = 9-10
 * - Vague "helped with" language + "we" dominance = 0-3
 */
export interface RoleOwnershipAnalysis {
    role_score: number;
    role_quality: 'crystal_clear_agency' | 'strong_clarity' | 'mixed_clarity' | 'ambiguous' | 'no_individual_agency';
    i_statement_count: number;
    we_statement_count: number;
    agency_ratio: number;
    i_examples: string[];
    we_examples: string[];
    has_role_description: boolean;
    role_clarity: 'specific' | 'mentioned' | 'title_only' | 'absent';
    role_examples: string[];
    differentiates_from_team: boolean;
    differentiation_count: number;
    differentiation_examples: string[];
    owns_failures: boolean;
    failure_ownership_count: number;
    failure_examples: string[];
    vague_phrase_count: number;
    vague_examples: string[];
    agency_verb_count: number;
    strong_verbs: string[];
    strengths: string[];
    weaknesses: string[];
    quick_wins: string[];
}
/**
 * Analyze role clarity and individual ownership in an essay
 */
export declare function analyzeRoleOwnership(essayText: string): RoleOwnershipAnalysis;
//# sourceMappingURL=roleOwnershipAnalyzer.d.ts.map