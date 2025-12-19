/**
 * Workshop Session Types
 *
 * Type definitions for the workshop session management system.
 * This enables:
 *
 * 1. Session-level caching across teaching stages
 * 2. Progressive context accumulation (Stage 1 → 2 → 3)
 * 3. Teaching history tracking (don't repeat advice)
 * 4. Adaptive feedback based on student patterns
 * 5. Quality-first cost optimization (74% savings)
 *
 * **QUALITY PRINCIPLE**: Sessions accumulate context, never compress it.
 * Each stage has MORE information than the previous one.
 */

import {
  CollegeResearch,
  CollegeCoreValue,
  CollegeRedFlag,
  CollegeGreenFlag,
  CollegeKeyQuote,
  CollegeEliteExample,
  CollegeSocraticQuestion,
  CitationMapping,
  EssayPattern,
  TeachingStage,
  DimensionStrength,
} from './collegeResearch';

// ============================================================================
// WORKSHOP SESSION
// ============================================================================

/**
 * Complete workshop session state
 * Persists across all 3 teaching stages
 */
export interface WorkshopSession {
  // Session identification
  sessionId: string;
  studentId: string;
  essayId: string;

  // College and pattern context
  college: string;                      // e.g., 'stanford'
  pattern: EssayPattern;                // e.g., 'why_this_school'
  promptId: string;                     // e.g., 'stanford_intellectual_vitality'

  // The comprehensive cache
  cache: WorkshopConversationCache;

  // Current stage
  currentStage: TeachingStage;

  // Timestamps
  createdAt: Date;
  lastUpdatedAt: Date;
  expiresAt: Date;                      // Sessions expire after inactivity

  // Cost tracking
  costTracking: {
    stage1Cost: number;
    stage2Cost: number;
    stage3Cost: number;
    totalCost: number;
    cacheHits: number;
    cacheMisses: number;
  };
}

// ============================================================================
// CONVERSATION CACHE
// ============================================================================

/**
 * The core conversation cache that accumulates across stages
 * This is the heart of the quality-first caching strategy
 */
export interface WorkshopConversationCache {
  // SESSION CONTEXT (loaded once in Stage 1, cached for Stages 2-3)
  sessionContext: SessionContext;

  // VERSION HISTORY (accumulates across stages)
  versionHistory: VersionHistory;

  // TEACHING HISTORY (what we've already taught)
  teachingHistory: TeachingHistory;

  // CITATION MAPPING (from Haiku, updated each stage)
  citationMapping: CitationMapping | null;

  // ADAPTIVE CONTEXT (learns about student across stages)
  adaptiveContext: AdaptiveContext;
}

// ============================================================================
// SESSION CONTEXT (Loaded Once, Cached)
// ============================================================================

/**
 * Static session context loaded in Stage 1
 * This is the expensive data that gets cached
 */
export interface SessionContext {
  // Activity context (what activity the essay is about)
  activity: ActivityContext | null;

  // College research (FULL - never compressed)
  collegeResearch: CollegeResearchContext;

  // Pattern rubric (FULL)
  patternRubric: PatternRubricContext;

  // Relevant examples (FULL texts, not summaries)
  relevantExamples: CollegeEliteExample[];

  // Socratic question bank (filtered to this pattern)
  socraticQuestions: CollegeSocraticQuestion[];
}

/**
 * Activity context from the student's profile
 */
export interface ActivityContext {
  activityId: string;
  name: string;
  role: string;
  category: string;
  description: string;
  whyItMatters: string;

  // Key details that should appear in essay
  keyDetails: {
    specificMoments: string[];
    uniqueAspects: string[];
    personalGrowth: string[];
  };
}

/**
 * College research context (subset of CollegeResearch relevant to this session)
 */
export interface CollegeResearchContext {
  collegeId: string;
  collegeName: string;

  // Core values with full evidence
  coreValues: CollegeCoreValue[];

  // All key quotes (for citation)
  keyQuotes: CollegeKeyQuote[];

  // Red flags for this pattern
  redFlags: CollegeRedFlag[];

  // Green flags for this pattern
  greenFlags: CollegeGreenFlag[];

  // Dimension weights
  dimensionWeights: {
    dimensionId: string;
    weight: number;
    context: string;
  }[];
}

/**
 * Pattern rubric context
 */
export interface PatternRubricContext {
  pattern: EssayPattern;
  patternName: string;

  // Full rubric (not compressed)
  rubric: {
    excellent: string[];
    good: string[];
    average: string[];
    weak: string[];
  };

  // Dimensional criteria
  dimensionalCriteria: {
    dimensionId: string;
    weight: number;
    scoringLogic: {
      strong: string[];
      adequate: string[];
      weak: string[];
    };
  }[];
}

// ============================================================================
// VERSION HISTORY (Accumulates)
// ============================================================================

/**
 * History of all drafts and analyses
 */
export interface VersionHistory {
  // All versions (accumulates)
  versions: EssayVersion[];

  // Progress tracking
  nqiProgression: number[];             // e.g., [65, 72, 81, 88]
  issuesResolved: string[];             // IDs of resolved issues
  issuesPersisting: string[];           // IDs still present
  improvementPatterns: string[];        // What student does well
  strugglingPatterns: string[];         // What student struggles with
}

/**
 * A single version of the essay
 */
export interface EssayVersion {
  versionId: string;
  stage: TeachingStage;
  timestamp: Date;

  // Draft content
  draft: string;
  wordCount: number;

  // Compressed summary (for efficiency in later stages)
  draftSummary: string;                 // ~200 word summary

  // Analysis results
  analysis: EssayAnalysis;

  // Teaching issues identified
  teachingIssues: TeachingIssue[];

  // Citation mapping for this version
  citationMapping: CitationMapping | null;
}

/**
 * Analysis of an essay version
 */
export interface EssayAnalysis {
  // Overall score
  nqi: number;
  tier: 'excellent' | 'strong' | 'competitive' | 'developing';

  // Category scores (12 dimensions)
  categoryScores: {
    dimensionId: string;
    dimensionName: string;
    score: number;
    maxScore: number;
    percentage: number;
    status: DimensionStrength;
    justification: string;
    strengths: string[];
    weaknesses: string[];
  }[];

  // Weak categories (for focused teaching)
  weakCategories: {
    dimensionId: string;
    score: number;
    primaryIssue: string;
    howToImprove: string;
  }[];

  // Elite patterns detected
  elitePatterns: {
    patternName: string;
    confidence: number;
    location: string;
    whatWorks: string;
  }[];

  // Authenticity analysis
  authenticity: {
    voiceScore: number;
    uniquenessScore: number;
    concerns: string[];
  };

  // Red/green flags detected
  flagsDetected: {
    redFlags: { flagId: string; evidence: string; location: string }[];
    greenFlags: { flagId: string; evidence: string; location: string }[];
  };
}

/**
 * A teaching issue to address
 */
export interface TeachingIssue {
  issueId: string;
  severity: 'critical' | 'major' | 'minor' | 'optimization';

  // What the issue is
  quote: string;                        // The problematic text
  problem: string;                      // Description of issue
  whyItMatters: string;                 // Why it needs fixing
  dimension: string;                    // Which dimension is affected

  // College-specific context
  collegeContext: {
    relevantValue?: string;             // Which college value this relates to
    relevantQuote?: CollegeKeyQuote;    // Quote to cite
    relevantRedFlag?: string;           // If a red flag is triggered
  };

  // Teaching content
  teaching: {
    principle: string;                  // The craft principle
    explanation: string;                // Detailed explanation
    exampleFromElite?: string;          // Quote from elite example
    socraticQuestion?: string;          // Question to ask
  };

  // Suggestions
  suggestions: {
    type: 'polished_original' | 'voice_amplifier' | 'divergent_strategy';
    text: string;
    rationale: string;
  }[];

  // Status
  status: 'pending' | 'addressed' | 'resolved' | 'persisting';
  stageIdentified: TeachingStage;
  stageResolved?: TeachingStage;
}

// ============================================================================
// TEACHING HISTORY (Don't Repeat)
// ============================================================================

/**
 * History of what we've taught
 * Ensures we don't repeat the same advice
 */
export interface TeachingHistory {
  // Issues we've addressed (don't repeat)
  issuesAddressed: {
    issueId: string;
    issueName: string;
    stage: TeachingStage;
    wasResolved: boolean;
    feedbackGiven: string;              // Summary of what we said
  }[];

  // Examples we've shown (don't repeat same examples)
  examplesShown: string[];              // Example IDs

  // Questions we've asked (don't repeat)
  questionsAsked: string[];             // Question IDs

  // Principles we've taught (reference but don't re-explain)
  principlesTaught: string[];

  // Strengths we've acknowledged (reinforce but don't over-praise)
  strengthsAcknowledged: string[];

  // Quotes we've cited (vary citations)
  quotesUsed: string[];                 // Quote IDs
}

// ============================================================================
// ADAPTIVE CONTEXT (Learns About Student)
// ============================================================================

/**
 * Context that adapts based on student behavior across stages
 */
export interface AdaptiveContext {
  // Estimated skill level
  skillLevel: 'advanced' | 'intermediate' | 'developing';

  // Learning patterns observed
  learningPatterns: {
    respondsWellTo: ('examples' | 'questions' | 'principles' | 'direct_feedback')[];
    struggles: string[];                // Specific areas of struggle
    improvementVelocity: 'fast' | 'moderate' | 'slow';
  };

  // Preferred feedback style (inferred from engagement)
  preferredFeedbackStyle: 'direct' | 'socratic' | 'example_heavy';

  // What they've improved on
  improvementAreas: string[];

  // What still needs work
  persistentChallenges: string[];

  // Confidence indicators
  confidence: {
    inWriting: 'high' | 'medium' | 'low';
    inVoice: 'high' | 'medium' | 'low';
    inContent: 'high' | 'medium' | 'low';
  };
}

// ============================================================================
// TEACHING FEEDBACK OUTPUT
// ============================================================================

/**
 * The output of a teaching stage
 */
export interface TeachingFeedback {
  // Stage this feedback is for
  stage: TeachingStage;

  // Overall assessment
  assessment: {
    currentNqi: number;
    previousNqi: number;
    improvement: number;
    tier: 'excellent' | 'strong' | 'competitive' | 'developing';
    overallSummary: string;
  };

  // Progress acknowledgment (for Stages 2-3)
  progressAcknowledgment?: {
    issuesResolved: string[];
    improvement: string;
    encouragement: string;
  };

  // Priority issues to address
  priorityIssues: {
    issue: TeachingIssue;
    teaching: {
      hook: string;                     // Attention-grabbing opener
      problem: string;                  // What's wrong
      principle: string;                // The craft principle
      collegeConnection: string;        // Why this college cares
      example: string;                  // Example from elite database
      question: string;                 // Socratic question
      suggestions: string[];            // Specific suggestions
    };
  }[];

  // Strengths to preserve
  strengthsToPreserve: {
    strength: string;
    whyItWorks: string;
    preservationAdvice: string;
  }[];

  // Next steps (action items)
  nextSteps: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    expectedImpact: string;
  }[];

  // College-specific guidance
  collegeGuidance: {
    valueAlignment: {
      value: string;
      currentAlignment: 'strong' | 'partial' | 'weak';
      howToStrengthen: string;
    }[];
    keyQuoteToRemember: CollegeKeyQuote;
  };
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Options for creating a new session
 */
export interface CreateSessionOptions {
  studentId: string;
  essayId: string;
  college: string;
  pattern: EssayPattern;
  promptId: string;
  initialDraft: string;
  activity?: ActivityContext;
}

/**
 * Options for updating a session
 */
export interface UpdateSessionOptions {
  newDraft: string;
  stage: TeachingStage;
  previousFeedback: TeachingFeedback;
}

/**
 * Session lookup result
 */
export interface SessionLookupResult {
  found: boolean;
  session?: WorkshopSession;
  cacheHit: boolean;
}
