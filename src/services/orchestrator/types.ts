import { PIQPromptType } from '../piq/types';

// ============================================================================
// STUDENT PROFILE INTERFACE (The "Context Layer")
// ============================================================================

/**
 * The Holistic Context Layer
 * 
 * This interface unifies all student data into a single, coherent structure
 * optimized for LLM consumption. It allows the "Holistic Analyzer" to check
 * essays against reality (grades, activities, goals).
 */
export interface StudentProfile {
  // 1. Identity & Demographics (Context & Circumstances)
  identity: {
    name: string; // Used for personalized feedback
    demographics?: {
      firstGen?: boolean;
      lowIncome?: boolean;
      underrepresented?: boolean;
      languages?: string[];
    };
    circumstances?: string[]; // e.g. "Single parent household", "Worked 20hrs/week to support family"
  };

  // 2. Academic Journey (Fit & Trajectory + Intellectual Vitality)
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
    academicStrengths: string[]; // e.g. ["Math", "Computer Science"]
    courseRigor: 'most_demanding' | 'very_demanding' | 'demanding' | 'average' | 'below_average';
    testScores?: {
      sat?: number;
      act?: number;
      apScores?: Record<string, number>; // e.g. { "Calculus BC": 5 }
    };
  };

  // 3. Extracurricular Portfolio (Leadership, Role Clarity, Community Impact)
  activities: ActivityItem[];
  
  // 4. Awards & Distinctions (Evidence of Excellence)
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
  role: string; // "Founder", "Member", "Captain"
  category: 'leadership' | 'service' | 'athletics' | 'arts' | 'academic' | 'work' | 'research' | 'other';
  
  // Quantification
  timeCommitment: {
    hoursPerWeek: number;
    weeksPerYear: number;
    totalHoursEstimated: number;
  };
  
  // Timeline
  grades: number[]; // [9, 10, 11, 12]
  isCurrent: boolean;

  // Qualitative
  description: string; // The 150-char description
  achievements?: string[]; // Bullet points of impact
}

// ============================================================================
// HOLISTIC ANALYSIS TYPES (Rich UI Support)
// ============================================================================

export type RichTextSegment = string | { text: string; details: string[] };

export interface InsightCandidate {
  id: string;
  text: RichTextSegment[]; // Primary insight content (paragraph length)
  score: number; // 0-10
  reasoning: string; // Meta-commentary on why this insight matters
}

export interface ArchetypeCandidate {
  id: string;
  archetype: string; // e.g., "Civic-Tech Builder"
  narrative: RichTextSegment[]; // Strategic positioning statement
  score: number; // 0-10
  reasoning: string;
  tags: string[];
}

export interface HolisticAnalysis {
  // 1. Consistency & Integrity (Reality Check)
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

  // 2. Strategic Fit (Trajectory)
  strategic_fit: {
    status: 'aligned' | 'stretch' | 'misaligned';
    score: number;
    major_alignment_analysis: string;
    gaps: string[];
  };

  // 3. Portfolio Insights (UI: Overview Tab)
  narrative_quality: {
    coherence_score: number;   // 0-100
    recurring_motifs?: string[]; // New: Extracted sensory motifs for Phase 7 Stitching
    spine: InsightCandidate[]; // "Your Narrative Thread"
    spike: InsightCandidate[]; // "What Stands Out"
    lift: InsightCandidate[];  // "What to Improve"
    blind_spots: InsightCandidate[]; // "Unintended Signals" (New depth layer)
  };

  // 4. Strategic Positioning (UI: Archetypes)
  brand_archetype: {
    candidates: ArchetypeCandidate[];
  };

  // 5. Risk Analysis
  risk_analysis: {
    has_red_flags: boolean;
    flags: Array<{
      type: 'tone' | 'integrity' | 'maturity' | 'topic';
      description: string;
      severity: 'high' | 'medium' | 'low';
    }>;
  };
}

// ============================================================================
// ORCHESTRATOR TYPES
// ============================================================================

export interface EssayAnalysisResult {
  metadata: {
    promptType: PIQPromptType;
    timestamp: string;
    wordCount: number;
  };
  
  // Universal Dimensions
  voice: any;
  craft: any;
  specificity: any;
  narrative_arc: any;
  thematic_coherence: any;
  opening_hook: any;
  vulnerability: any;

  // Primary Dimensions
  primary_dimensions: {
    [key: string]: any;
  };

  // Secondary Dimensions
  secondary_dimensions: {
    [key: string]: any;
  };

  // Holistic Context Analysis
  holistic_context?: HolisticAnalysis;
}
