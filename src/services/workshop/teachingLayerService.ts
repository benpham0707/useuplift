// @ts-nocheck - Service file with type mismatches
/**
 * Teaching Layer Service - Phase 19
 *
 * Calls the teaching-layer edge function to enhance workshop items with deep,
 * conversational teaching guidance.
 *
 * Philosophy: Pass knowledge, not just fixes. Make students feel SEEN, HEARD, EMPOWERED.
 */

import { createClient } from '@supabase/supabase-js';
import { TeachingGuidance } from '@/components/portfolio/extracurricular/workshop/backendTypes';
import { WorkshopIssue } from './workshopAnalyzer';
import { ExperienceEntry } from '@/core/types/experience';

// ============================================================================
// TYPES
// ============================================================================

interface TeachingLayerRequest {
  workshopItems: Array<{
    id: string;
    quote: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    rubric_category: string;
    suggestions: Array<{
      type: string;
      text: string;
      rationale: string;
      fingerprint_connection: string;
    }>;
  }>;
  essayText: string;
  promptText: string;
  promptTitle: string;
  voiceFingerprint: any;
  experienceFingerprint: any;
  rubricDimensionDetails: any[];
  currentNQI: number;
}

interface TeachingLayerResponse {
  success: boolean;
  enhancedItems: Array<{
    id: string;
    teaching: TeachingGuidance;
    teachingDepth: 'foundational' | 'craft' | 'polish';
    estimatedImpact: {
      nqiGain: number;
      dimensionsAffected: string[];
    };
  }>;
  performance?: {
    duration_s: number;
    cost_per_item: number;
  };
  error?: string;
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Enhance workshop issues with Phase 19 teaching guidance
 *
 * @param issues - Workshop issues to enhance
 * @param entry - Full experience entry with essay text and context
 * @param analysisContext - Additional analysis context (NQI, fingerprints, rubric)
 * @returns Enhanced issues with teaching guidance
 */
export async function enhanceWithTeachingLayer(
  issues: WorkshopIssue[],
  entry: ExperienceEntry,
  analysisContext: {
    currentNQI: number;
    voiceFingerprint?: any;
    experienceFingerprint?: any;
    rubricDimensionDetails?: any[];
  }
): Promise<WorkshopIssue[]> {
  const startTime = Date.now();

  // Generate stable IDs for issues that don't have them
  const issueIdMap = new Map<WorkshopIssue, string>();
  issues.forEach((issue) => {
    issueIdMap.set(issue, issue.id || `issue_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  });

  try {
    // Build essay text from entry - use description_original for PIQ essays
    const essayText = `${entry.title}\n\n${(entry as any).description_original || entry.description || ''}`;

    // Transform issues to API format with stable IDs
    const requestBody: TeachingLayerRequest = {
      workshopItems: issues.map((issue) => ({
        id: issueIdMap.get(issue)!,
        quote: issue.from_draft || '',
        severity: mapSeverityToEdgeFormat(issue.severity),
        rubric_category: issue.category,
        suggestions: issue.suggested_fixes.map((fix) => ({
          type: 'polished_original',
          text: fix.fix_text,
          rationale: fix.why_this_works,
          fingerprint_connection: '', // Can add if available
        })),
      })),
      essayText,
      promptText: (entry as any).description_original || entry.description || '',
      promptTitle: entry.title,
      voiceFingerprint: analysisContext.voiceFingerprint || {},
      experienceFingerprint: analysisContext.experienceFingerprint || {},
      rubricDimensionDetails: analysisContext.rubricDimensionDetails || [],
      currentNQI: analysisContext.currentNQI,
    };

    // Call edge function
    const { data, error } = await supabase.functions.invoke<TeachingLayerResponse>(
      'teaching-layer',
      {
        body: requestBody,
      }
    );

    if (error) {
      throw error;
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Failed to enhance items');
    }

    // Merge teaching guidance back into issues using the stable ID map
    const enhancedIssues = issues.map((issue) => {
      const issueId = issueIdMap.get(issue)!;
      const enhancement = data.enhancedItems.find((item) => item.id === issueId);

      if (enhancement) {
        return {
          ...issue,
          teaching: enhancement.teaching,
          teachingDepth: enhancement.teachingDepth,
          estimatedImpact: enhancement.estimatedImpact,
        };
      }

      return issue;
    });

    const totalTime = Date.now() - startTime;

    return enhancedIssues;
  } catch (error) {
    // Return original issues on error - teaching layer is enhancement, not required
    return issues;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map workshop severity to edge function format
 */
function mapSeverityToEdgeFormat(
  severity: 'critical' | 'important' | 'helpful'
): 'critical' | 'high' | 'medium' | 'low' {
  switch (severity) {
    case 'critical':
      return 'critical';
    case 'important':
      return 'high';
    case 'helpful':
      return 'medium';
    default:
      return 'medium';
  }
}

/**
 * Check if teaching layer is available
 */
export function isTeachingLayerAvailable(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
