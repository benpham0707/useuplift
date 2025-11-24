/**
 * PIQ WORKSHOP TYPES
 *
 * Type definitions for Personal Insight Question (PIQ) workshop system.
 * Unified 13-dimension rubric combining:
 * - PIQ-specific dimensions (Opening Hook, Vulnerability, Identity)
 * - Proven extracurricular dimensions (Initiative, Role Clarity, Context)
 * - Shared dimensions refined from both systems
 */
export type PIQRubricDimension = 'opening_hook_quality' | 'vulnerability_authenticity' | 'specificity_evidence' | 'voice_integrity' | 'narrative_arc_stakes' | 'transformative_impact' | 'role_clarity_ownership' | 'initiative_leadership' | 'context_circumstances' | 'reflection_insight' | 'identity_self_discovery' | 'craft_language_quality' | 'fit_trajectory';
export type PIQPromptType = 'piq1_leadership' | 'piq2_creative' | 'piq3_talent' | 'piq4_educational' | 'piq5_challenge' | 'piq6_academic' | 'piq7_community' | 'piq8_open_ended';
export interface PIQRubricScore {
    dimension: PIQRubricDimension;
    name: string;
    score_0_to_10: number;
    weight: number;
    evidence_snippets: string[];
    evaluator_notes: string;
}
export interface PIQDetectedIssue {
    id: string;
    dimension: PIQRubricDimension;
    issueType: string;
    severity: 'critical' | 'major' | 'minor';
    title: string;
    from_draft: string;
    problem: string;
    why_matters: string;
    suggested_fixes: PIQSuggestedFix[];
    teachingExample?: PIQTeachingExample;
    reflectionPrompts?: PIQReflectionPrompts;
    priority?: number;
}
export interface PIQSuggestedFix {
    fix_text: string;
    why_this_works: string;
    technique: string;
    apply_type: 'replace' | 'add' | 'reframe' | 'deepen';
    estimated_impact: string;
}
export interface PIQTeachingExample {
    id: string;
    issueType: string;
    dimension: PIQRubricDimension;
    weakExample: string;
    strongExample: string;
    explanation: string;
    diffHighlights: string[];
    principle: string;
    essayContext?: string;
    sourceInfo?: string;
}
export interface PIQReflectionPrompts {
    issueId: string;
    surface_prompts: string[];
    deep_prompts: string[];
    tone: 'mentor' | 'coach' | 'curious_friend';
}
export interface PIQDimensionSummary {
    dimension: PIQRubricDimension;
    name: string;
    description: string;
    score: number;
    maxScore: number;
    weight: number;
    status: 'critical' | 'needs_work' | 'good' | 'excellent';
    issueCount: {
        critical: number;
        major: number;
        minor: number;
        total: number;
    };
    issues: PIQDetectedIssue[];
    diagnosis: string;
    keyPriority: string;
    potentialGain: {
        min: number;
        max: number;
        display: string;
    };
    isExpanded: boolean;
}
export interface PIQWorkshopResult {
    overallScore: number;
    scoreTier: 'excellent' | 'strong' | 'good' | 'needs_work' | 'weak';
    readerImpression: string;
    dimensions: PIQDimensionSummary[];
    topIssues: PIQDetectedIssue[];
    allIssues: PIQDetectedIssue[];
    quickSummary: string;
    analysisId: string;
    timestamp: string;
    performance: {
        analysisMs: number;
        detectionMs: number;
        enrichmentMs: number;
        totalMs: number;
    };
}
export interface PIQWorkshopOptions {
    depth?: 'quick' | 'standard' | 'comprehensive';
    maxIssues?: number;
    generateReflectionPrompts?: boolean;
    reflectionTone?: 'mentor' | 'coach' | 'curious_friend';
    promptType?: PIQPromptType;
    essayType?: 'leadership' | 'challenge' | 'creative' | 'academic' | 'growth' | 'community' | 'passion';
}
export interface PIQIssuePattern {
    id: string;
    dimension: PIQRubricDimension;
    title: string;
    severity: 'critical' | 'major' | 'minor';
    triggerConditions: {
        scoreThreshold?: number;
        keywordPatterns?: string[];
        absencePatterns?: string[];
        customCheck?: string;
    };
    problemTemplate: string;
    whyMattersTemplate: string;
    fixStrategies: {
        technique: string;
        description: string;
        estimatedImpact: string;
    }[];
}
//# sourceMappingURL=types.d.ts.map