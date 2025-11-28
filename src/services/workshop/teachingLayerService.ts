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
  console.warn('[TeachingLayerService] Missing Supabase credentials');
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

  try {
    // Build essay text from entry
    const essayText = `${entry.title}\n\n${entry.description}`;

    // Transform issues to API format
    const requestBody: TeachingLayerRequest = {
      workshopItems: issues.map((issue) => ({
        id: issue.id || `issue_${Date.now()}_${Math.random()}`,
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
      promptText: entry.description, // Full description serves as prompt response
      promptTitle: entry.title,
      voiceFingerprint: analysisContext.voiceFingerprint || {},
      experienceFingerprint: analysisContext.experienceFingerprint || {},
      rubricDimensionDetails: analysisContext.rubricDimensionDetails || [],
      currentNQI: analysisContext.currentNQI,
    };

    console.log('[TeachingLayerService] Calling teaching-layer edge function...', {
      itemCount: issues.length,
      essayLength: essayText.length,
      currentNQI: analysisContext.currentNQI,
    });

    // Call edge function
    const { data, error } = await supabase.functions.invoke<TeachingLayerResponse>(
      'teaching-layer',
      {
        body: requestBody,
      }
    );

    if (error) {
      console.error('[TeachingLayerService] Edge function error:', error);
      throw error;
    }

    if (!data || !data.success) {
      console.error('[TeachingLayerService] Invalid response:', data);
      throw new Error(data?.error || 'Failed to enhance items');
    }

    console.log('[TeachingLayerService] Success!', {
      itemsEnhanced: data.enhancedItems.length,
      duration: data.performance?.duration_s,
      costPerItem: data.performance?.cost_per_item,
    });

    // Merge teaching guidance back into issues
    const enhancedIssues = issues.map((issue) => {
      const issueId = issue.id || `issue_${Date.now()}_${Math.random()}`;
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
    console.log('[TeachingLayerService] Total time:', totalTime, 'ms');

    return enhancedIssues;
  } catch (error) {
    console.error('[TeachingLayerService] Failed to enhance issues:', error);
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
