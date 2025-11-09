/**
 * Workshop API Integration Layer
 *
 * Provides typed interfaces to all backend analysis and generation services:
 * - analyzeEntry: Full 11-category rubric analysis + coaching
 * - generateNarrativeAngles: Create 10+ unique angles with quality validation
 * - generateEssay: AI-assisted generation with selected angle
 * - iterativeImprovement: Multi-iteration refinement loop
 *
 * All functions include proper error handling, loading states, and retries.
 */

import type {
  AnalysisResult,
  NarrativeAngle,
  AngleQualityScore,
  GenerationProfile,
  GenerationResult,
} from './backendTypes';
import type { ExtracurricularItem } from '../ExtracurricularCard';

// ============================================================================
// API CONFIGURATION
// ============================================================================

const API_BASE_URL = '/api';
const DEFAULT_TIMEOUT = 60000; // 60 seconds
const RETRY_COUNT = 2;
const RETRY_DELAY = 1000; // 1 second

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class WorkshopApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WorkshopApiError';
  }
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = RETRY_COUNT,
  delay: number = RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;

    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

// ============================================================================
// CORE ANALYSIS API
// ============================================================================

export interface AnalyzeEntryRequest {
  description: string;
  activity: ExtracurricularItem;
  depth?: 'quick' | 'standard' | 'comprehensive';
  skip_coaching?: boolean;
}

export interface AnalyzeEntryResponse {
  success: boolean;
  result?: AnalysisResult;
  error?: string;
  performance_ms?: number;
}

/**
 * Analyze extracurricular description with full backend system
 *
 * Returns:
 * - 11-category rubric scores with NQI (0-100)
 * - Authenticity analysis (voice detection)
 * - Elite pattern detection (vulnerability, dialogue, transformation, etc.)
 * - Literary sophistication (metaphor, structure, rhythm)
 * - Coaching output with prioritized issues (unless skip_coaching=true)
 */
export async function analyzeEntry(
  description: string,
  activity: ExtracurricularItem,
  options: {
    depth?: 'quick' | 'standard' | 'comprehensive';
    skip_coaching?: boolean;
  } = {}
): Promise<AnalysisResult> {
  const request: AnalyzeEntryRequest = {
    description,
    activity,
    depth: options.depth || 'standard',
    skip_coaching: options.skip_coaching || false,
  };

  try {
    const response = await retryWithBackoff(async () => {
      const res = await fetch(`${API_BASE_URL}/analyze-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new WorkshopApiError(
          errorData.error || 'Analysis failed',
          `HTTP_${res.status}`,
          errorData
        );
      }

      return res.json();
    });

    if (!response.success || !response.result) {
      throw new WorkshopApiError(
        response.error || 'Analysis returned no results',
        'ANALYSIS_FAILED'
      );
    }

    return response.result;
  } catch (error) {
    if (error instanceof WorkshopApiError) throw error;

    throw new WorkshopApiError(
      `Failed to analyze entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'NETWORK_ERROR',
      error
    );
  }
}

// ============================================================================
// NARRATIVE ANGLE GENERATION API
// ============================================================================

export interface GenerateAnglesRequest {
  profile: GenerationProfile;
  num_angles?: number; // Default: 10
  prioritize?: 'originality' | 'safety' | 'depth';
  avoid_angles?: string[];
}

export interface GenerateAnglesResponse {
  success: boolean;
  angles?: NarrativeAngle[];
  quality_scores?: AngleQualityScore[];
  error?: string;
}

/**
 * Generate 10+ unique narrative angles for an experience
 *
 * Uses Session 18 angle generation system with:
 * - Multi-stage quality validation
 * - Grounding score (concrete vs abstract)
 * - Bridge score (technical-human connection)
 * - Authenticity potential
 * - Implementability assessment
 *
 * Returns angles sorted by quality with recommendations
 */
export async function generateNarrativeAngles(
  profile: GenerationProfile,
  options: {
    num_angles?: number;
    prioritize?: 'originality' | 'safety' | 'depth';
  } = {}
): Promise<{ angles: NarrativeAngle[]; qualityScores: AngleQualityScore[] }> {
  const request: GenerateAnglesRequest = {
    profile,
    num_angles: options.num_angles || 10,
    prioritize: options.prioritize || 'originality',
  };

  try {
    const response = await retryWithBackoff(async () => {
      const res = await fetch(`${API_BASE_URL}/generate-narrative-angles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new WorkshopApiError(
          errorData.error || 'Angle generation failed',
          `HTTP_${res.status}`,
          errorData
        );
      }

      return res.json();
    });

    if (!response.success || !response.angles) {
      throw new WorkshopApiError(
        response.error || 'No angles generated',
        'GENERATION_FAILED'
      );
    }

    return {
      angles: response.angles,
      qualityScores: response.quality_scores || [],
    };
  } catch (error) {
    if (error instanceof WorkshopApiError) throw error;

    throw new WorkshopApiError(
      `Failed to generate angles: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'NETWORK_ERROR',
      error
    );
  }
}

// ============================================================================
// AI ESSAY GENERATION API
// ============================================================================

export interface GenerateEssayRequest {
  profile: GenerationProfile;
  max_iterations?: number;
  target_score?: number;
}

export interface GenerateEssayResponse {
  success: boolean;
  result?: GenerationResult;
  error?: string;
}

/**
 * Generate elite-tier essay using AI with selected narrative angle
 *
 * Uses iterative improvement loop:
 * 1. Generate initial draft with literary techniques
 * 2. Analyze with authenticity, elite patterns, literary sophistication
 * 3. Identify gaps and build targeted improvements
 * 4. Regenerate with intelligent prompting
 * 5. Repeat until target score reached (or max iterations)
 *
 * Target scores:
 * - Tier 1 (Harvard/MIT): 85+
 * - Tier 2 (Top UC): 75+
 * - Tier 3 (Competitive): 65+
 */
export async function generateEssay(
  profile: GenerationProfile,
  options: {
    max_iterations?: number;
    target_score?: number;
  } = {}
): Promise<GenerationResult> {
  const targetScore = options.target_score || (
    profile.targetTier === 1 ? 85 :
    profile.targetTier === 2 ? 75 : 65
  );

  const request: GenerateEssayRequest = {
    profile,
    max_iterations: options.max_iterations || 3,
    target_score: targetScore,
  };

  try {
    const response = await retryWithBackoff(async () => {
      const res = await fetch(`${API_BASE_URL}/generate-essay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(120000), // 2 minutes for generation
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new WorkshopApiError(
          errorData.error || 'Essay generation failed',
          `HTTP_${res.status}`,
          errorData
        );
      }

      return res.json();
    });

    if (!response.success || !response.result) {
      throw new WorkshopApiError(
        response.error || 'No essay generated',
        'GENERATION_FAILED'
      );
    }

    return response.result;
  } catch (error) {
    if (error instanceof WorkshopApiError) throw error;

    throw new WorkshopApiError(
      `Failed to generate essay: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'NETWORK_ERROR',
      error
    );
  }
}

// ============================================================================
// ITERATIVE IMPROVEMENT API
// ============================================================================

export interface IterativeImprovementRequest {
  profile: GenerationProfile;
  max_iterations?: number;
  target_score?: number;
}

export interface IterativeImprovementResponse {
  success: boolean;
  result?: GenerationResult & { iterationHistory: GenerationResult[] };
  error?: string;
}

/**
 * Run full iterative improvement loop with learning
 *
 * Features:
 * - Analyzes best result (not just previous) for gap identification
 * - Intelligent prompting with dynamic emphasis on weak areas
 * - Tracks score progression across iterations
 * - Early exit on plateau or close-to-target (cost optimization)
 * - Returns best result across all iterations
 */
export async function iterativeImprovement(
  profile: GenerationProfile,
  options: {
    max_iterations?: number;
    target_score?: number;
  } = {}
): Promise<GenerationResult & { iterationHistory: GenerationResult[] }> {
  const targetScore = options.target_score || (
    profile.targetTier === 1 ? 85 :
    profile.targetTier === 2 ? 75 : 65
  );

  const request: IterativeImprovementRequest = {
    profile,
    max_iterations: options.max_iterations || 5,
    target_score: targetScore,
  };

  try {
    const response = await retryWithBackoff(async () => {
      const res = await fetch(`${API_BASE_URL}/iterative-improvement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(180000), // 3 minutes for multiple iterations
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new WorkshopApiError(
          errorData.error || 'Iterative improvement failed',
          `HTTP_${res.status}`,
          errorData
        );
      }

      return res.json();
    });

    if (!response.success || !response.result) {
      throw new WorkshopApiError(
        response.error || 'No result from iterative improvement',
        'IMPROVEMENT_FAILED'
      );
    }

    return response.result;
  } catch (error) {
    if (error instanceof WorkshopApiError) throw error;

    throw new WorkshopApiError(
      `Failed to run iterative improvement: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'NETWORK_ERROR',
      error
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Build generation profile from ExtracurricularItem
 */
export function buildGenerationProfile(
  activity: ExtracurricularItem,
  options: {
    studentVoice?: 'formal' | 'conversational' | 'quirky' | 'introspective';
    riskTolerance?: 'low' | 'medium' | 'high';
    academicStrength?: 'strong' | 'moderate' | 'weak';
    targetTier?: 1 | 2 | 3;
  } = {}
): GenerationProfile {
  return {
    // Student context (defaults or from options)
    studentVoice: options.studentVoice || 'conversational',
    riskTolerance: options.riskTolerance || 'medium',
    academicStrength: options.academicStrength || 'strong',

    // Activity details from ExtracurricularItem
    activityType: activity.category as any,
    role: activity.role,
    duration: `${activity.startDate} - ${activity.endDate}`,
    hoursPerWeek: activity.hoursPerWeek || activity.scores?.commitment?.hoursPerWeek || 0,

    // Extract content from activity
    achievements: extractAchievements(activity),
    challenges: extractChallenges(activity),
    relationships: extractRelationships(activity),
    impact: extractImpact(activity),

    // Generation settings
    targetTier: options.targetTier || 2, // Default to Top UC tier
    literaryTechniques: [],
    avoidClichés: true,
  };
}

// Helper extractors
function extractAchievements(activity: ExtracurricularItem): string[] {
  const achievements: string[] = [];

  // From description
  if (activity.description) {
    achievements.push(activity.description);
  }

  // From impact metrics
  if (activity.scores?.impact?.metrics) {
    achievements.push(...activity.scores.impact.metrics.map(m => `${m.label}: ${m.value}`));
  }

  return achievements.length > 0 ? achievements : ['Led key initiatives in ' + activity.name];
}

function extractChallenges(activity: ExtracurricularItem): string[] {
  // Could be extracted from description or application guidance
  return activity.applicationGuidance?.descriptionAnalysis?.improvements?.slice(0, 3) || [];
}

function extractRelationships(activity: ExtracurricularItem): string[] {
  // Extract from description if mentions people
  const description = activity.description || '';
  const peopleMatches = description.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g);
  return peopleMatches ? Array.from(new Set(peopleMatches)).slice(0, 3) : [];
}

function extractImpact(activity: ExtracurricularItem): string[] {
  const impact: string[] = [];

  if (activity.scores?.impact?.analysis) {
    impact.push(activity.scores.impact.analysis);
  }

  if (activity.applicationGuidance?.whyItMatters) {
    impact.push(activity.applicationGuidance.whyItMatters);
  }

  return impact.length > 0 ? impact : ['Made meaningful impact on ' + activity.organization];
}
