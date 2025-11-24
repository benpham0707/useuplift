import { PIQPromptType } from '../piq/types';
/**
 * The Holistic Context Layer
 *
 * This interface unifies all student data into a single, coherent structure
 * optimized for LLM consumption. It allows the "Holistic Analyzer" to check
 * essays against reality (grades, activities, goals).
 */
export interface StudentProfile {
    identity: {
        name: string;
        demographics?: {
            firstGen?: boolean;
            lowIncome?: boolean;
            underrepresented?: boolean;
            languages?: string[];
        };
        circumstances?: string[];
    };
    academics: {
        gpa: {
            unweighted: number;
            weighted?: number;
            scale?: number;
            trend: 'upward' | 'consistent' | 'downward' | 'varied';
        };
        intendedMajor: string;
        alternateMajor?: string;
        careerGoals?: string[];
        academicStrengths: string[];
        courseRigor: 'most_demanding' | 'very_demanding' | 'demanding' | 'average' | 'below_average';
        testScores?: {
            sat?: number;
            act?: number;
            apScores?: Record<string, number>;
        };
    };
    activities: ActivityItem[];
    awards?: Array<{
        name: string;
        level: 'international' | 'national' | 'state' | 'regional' | 'school';
        year: string;
    }>;
}
/**
 * A single activity entry, normalized for analysis.
 */
export interface ActivityItem {
    id: string;
    name: string;
    role: string;
    category: 'leadership' | 'service' | 'athletics' | 'arts' | 'academic' | 'work' | 'research' | 'other';
    timeCommitment: {
        hoursPerWeek: number;
        weeksPerYear: number;
        totalHoursEstimated: number;
    };
    grades: number[];
    isCurrent: boolean;
    description: string;
    achievements?: string[];
}
export type RichTextSegment = string | {
    text: string;
    details: string[];
};
export interface InsightCandidate {
    id: string;
    text: RichTextSegment[];
    score: number;
    reasoning: string;
}
export interface ArchetypeCandidate {
    id: string;
    archetype: string;
    narrative: RichTextSegment[];
    score: number;
    reasoning: string;
    tags: string[];
}
export interface HolisticAnalysis {
    consistency_check: {
        status: 'consistent' | 'inconsistent' | 'gap_detected';
        score: number;
        contradictions: Array<{
            severity: 'critical' | 'warning' | 'minor';
            issue: string;
            essay_evidence: string;
            profile_evidence: string;
            fix_recommendation: string;
        }>;
    };
    strategic_fit: {
        status: 'aligned' | 'stretch' | 'misaligned';
        score: number;
        major_alignment_analysis: string;
        gaps: string[];
    };
    narrative_quality: {
        coherence_score: number;
        spine: InsightCandidate[];
        spike: InsightCandidate[];
        lift: InsightCandidate[];
        blind_spots: InsightCandidate[];
    };
    brand_archetype: {
        candidates: ArchetypeCandidate[];
    };
    risk_analysis: {
        has_red_flags: boolean;
        flags: Array<{
            type: 'tone' | 'integrity' | 'maturity' | 'topic';
            description: string;
            severity: 'high' | 'medium' | 'low';
        }>;
    };
}
export interface EssayAnalysisResult {
    metadata: {
        promptType: PIQPromptType;
        timestamp: string;
        wordCount: number;
    };
    voice: any;
    craft: any;
    specificity: any;
    narrative_arc: any;
    thematic_coherence: any;
    opening_hook: any;
    vulnerability: any;
    primary_dimensions: {
        [key: string]: any;
    };
    secondary_dimensions: {
        [key: string]: any;
    };
    holistic_context?: HolisticAnalysis;
}
//# sourceMappingURL=types.d.ts.map