/**
 * Teaching-Focused Types for Workshop
 *
 * Implements pedagogical approach: Teach principles through examples,
 * not copy-paste solutions. Students learn by seeing how elite essays
 * apply writing principles, then practice applying those principles
 * to their own work.
 *
 * Philosophy: Build better writers, not just better essays.
 */

import type { RubricCategory } from './backendTypes';

// ============================================================================
// TEACHING ISSUE (Replaces simple WritingIssue)
// ============================================================================

export interface TeachingIssue {
  id: string;
  category: RubricCategory;
  rubric_category: RubricCategory; // For matching with UI categories
  severity: 'critical' | 'major' | 'minor';

  // Backwards compatibility - flat properties
  title?: string;
  context?: string;
  teaching_points?: string[];
  why_it_matters?: string;
  short_label?: string;
  one_line_why?: string;
  problem_explanation?: string;
  teaching_example?: any;
  fix_strategies?: string[];

  // Problem identification
  problem: {
    title: string; // e.g., "Missing Quantified Impact"
    from_draft: string; // Excerpt from their essay
    explanation: string; // What's wrong and why
    impact_on_score: string; // e.g., "Costing you 3-5 points"
  };

  // Educational content
  principle: {
    name: string; // e.g., "ANCHOR WITH NUMBERS"
    description: string; // The transferable concept
    why_officers_care: string; // Admissions perspective
    skill_level: 'fundamental' | 'intermediate' | 'advanced';
  };

  // Learning through examples
  examples: EliteEssayExample[];

  // Guided application
  reflection_prompts: ReflectionPrompt[];

  // Student workspace
  student_workspace: {
    draft_text: string; // Their rewrite attempt
    last_updated?: number;
    feedback?: string; // Optional AI feedback on their attempt
    is_complete: boolean;
  };

  // Support levels
  support: {
    current_level: 'teach' | 'hint' | 'assist';
    hint?: string; // Contextual hint if stuck
    ai_variations?: string[]; // Generated variations (inspiration only)
  };

  // Progress tracking
  status: 'not_started' | 'in_progress' | 'needs_review' | 'completed';
  priority_rank: number;
}

// ============================================================================
// ELITE ESSAY EXAMPLES (Real admitted student patterns)
// ============================================================================

export interface EliteEssayExample {
  context: string; // e.g., "Robotics - Caltech admit"
  school_tier: 'ivy_plus' | 'top_uc' | 'competitive'; // Tier 1, 2, or 3

  before: {
    text: string; // Generic version
    problems: string[]; // What's wrong with it
  };

  after: {
    text: string; // Elite version
    score_improvement: string; // e.g., "+5 points"
  };

  annotations: Array<{
    highlight: string; // What to notice
    explanation: string; // Why it works
    principle: string; // Transferable lesson
  }>;

  // What made this effective
  success_factors: string[];
}

// ============================================================================
// REFLECTION PROMPTS (Guided questions)
// ============================================================================

export interface ReflectionPrompt {
  question: string;
  purpose: string; // Why we're asking this
  answer_type: 'short_text' | 'long_text' | 'number' | 'multiple_choice';

  // For multiple choice
  options?: string[];

  // Student's answer
  student_answer?: string | number;

  // Validation
  validation?: {
    min_length?: number;
    max_length?: number;
    required?: boolean;
    helpful_hint?: string;
  };
}

// ============================================================================
// EXAMPLE LIBRARY (Curated database)
// ============================================================================

export interface ExampleLibrary {
  // Organized by principle
  by_principle: Record<string, EliteEssayExample[]>;

  // Organized by category
  by_category: Record<RubricCategory, EliteEssayExample[]>;

  // Organized by tier
  by_tier: {
    tier_1: EliteEssayExample[]; // Harvard/MIT/Stanford
    tier_2: EliteEssayExample[]; // Top UC/Ivies
    tier_3: EliteEssayExample[]; // Competitive schools
  };

  // Quick access to common issues
  common_fixes: {
    add_vulnerability: EliteEssayExample[];
    add_metrics: EliteEssayExample[];
    add_dialogue: EliteEssayExample[];
    show_transformation: EliteEssayExample[];
    deepen_reflection: EliteEssayExample[];
  };
}

// ============================================================================
// TEACHING RUBRIC DIMENSION (Enhanced version)
// ============================================================================

export interface TeachingRubricDimension {
  id: string;
  name: string;
  score: number; // 0-10
  maxScore: number; // Usually 10
  status: 'critical' | 'needs_work' | 'good' | 'excellent';
  weight: number; // Percentage

  // Educational content
  description: string; // What this dimension measures
  why_it_matters: string; // Why officers care

  // Score interpretation
  score_interpretation: {
    current_level: string; // e.g., "Acceptable but improvable"
    target_level: string; // e.g., "Strong and distinctive"
    gap_analysis: string; // What's missing to reach target
  };

  // Teaching issues for this dimension
  teaching_issues: TeachingIssue[];

  // Examples of excellence in this dimension
  exemplars: EliteEssayExample[];

  // Progress
  is_expanded: boolean;
  completed_issues: number;
  total_issues: number;
}

// ============================================================================
// STUDENT PROGRESS TRACKING
// ============================================================================

export interface StudentProgress {
  // Overall metrics
  issues_total: number;
  issues_completed: number;
  issues_in_progress: number;

  // Score improvement
  initial_nqi: number;
  current_nqi: number;
  target_nqi: number;
  improvements: Array<{
    timestamp: number;
    dimension: string;
    before_score: number;
    after_score: number;
    change: number;
  }>;

  // Skills mastered
  principles_learned: string[];

  // Time tracking
  time_spent_minutes: number;
  sessions: number;

  // Milestones
  milestones: Array<{
    type: 'first_issue_completed' | 'dimension_improved' | 'target_reached' | 'all_issues_completed';
    timestamp: number;
    message: string;
  }>;
}

// ============================================================================
// TEACHING SETTINGS (User preferences)
// ============================================================================

export interface TeachingSettings {
  // Support level preferences
  default_support_level: 'teach' | 'hint' | 'assist';
  auto_escalate: boolean; // Auto-provide hints after N attempts
  escalation_threshold: number; // How many attempts before hint

  // Example preferences
  show_tier_1_only: boolean; // Only show Harvard/MIT examples
  examples_per_issue: number; // How many to show

  // Workspace preferences
  show_inline_feedback: boolean;
  enable_ai_review: boolean; // AI can review their attempts

  // Progress
  celebrate_milestones: boolean; // Show confetti, etc.
  show_score_changes: boolean; // Real-time NQI updates
}

// ============================================================================
// AI ASSISTANCE (When requested)
// ============================================================================

export interface AIAssistance {
  type: 'hint' | 'variations' | 'feedback';

  // Contextual hint (doesn't give answer)
  hint?: {
    message: string;
    focus_areas: string[];
  };

  // Multiple variations (inspiration, not copy-paste)
  variations?: Array<{
    style: 'formal' | 'conversational' | 'creative';
    text: string;
    rationale: string;
    warning: string; // "Don't copy this - adapt to your voice"
  }>;

  // Feedback on student's attempt
  feedback?: {
    strengths: string[];
    improvements: string[];
    score_estimate: number; // How close to target
    next_steps: string[];
  };

  // Metadata
  timestamp: number;
  tokens_used: number;
}

// ============================================================================
// TEACHING MODES
// ============================================================================

export type TeachingMode = 'guided' | 'independent' | 'ai_assisted';

export interface ModeConfig {
  guided: {
    show_examples: true;
    show_prompts: true;
    require_reflection: true;
    enable_hints: true;
  };

  independent: {
    show_examples: true;
    show_prompts: false;
    require_reflection: false;
    enable_hints: false;
  };

  ai_assisted: {
    show_examples: true;
    show_prompts: true;
    require_reflection: false;
    enable_hints: true;
    enable_ai_feedback: true;
    enable_ai_variations: true;
  };
}

// ============================================================================
// COACHING OUTPUT (Enhanced with teaching)
// ============================================================================

export interface TeachingCoachingOutput {
  // Overall assessment
  overall: {
    current_nqi: number;
    target_nqi: number;
    potential_gain: number;
    total_issues: number;
    estimated_time_minutes: number; // How long to complete
  };

  // Prioritized teaching issues
  teaching_issues: TeachingIssue[];

  // Quick wins (high impact, low effort)
  quick_wins: Array<{
    issue_id: string;
    title: string;
    effort: 'low' | 'medium' | 'high';
    impact: string; // e.g., "+3 to +5 points"
    estimated_minutes: number;
  }>;

  // Strategic guidance
  strategy: {
    strengths_to_maintain: string[];
    critical_gaps: string[];
    recommended_order: string[]; // Issue IDs in priority order
    learning_path: string; // Narrative of how to improve
  };

  // Estimated outcomes
  projections: {
    if_all_completed: {
      estimated_nqi: number;
      confidence_range: [number, number]; // e.g., [82, 88]
      tier_placement: 1 | 2 | 3;
    };
    if_quick_wins_only: {
      estimated_nqi: number;
      time_saved_minutes: number;
    };
  };
}
