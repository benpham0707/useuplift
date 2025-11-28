// @ts-nocheck - Database service with Supabase schema sync issues
/**
 * PIQ Workshop Database Service
 *
 * Handles persistent storage of PIQ essays, analysis results, and version history
 * Uses existing essay system tables: essays, essay_analysis_reports, essay_revision_history
 *
 * IMPORTANT: All functions require a Clerk JWT token to authenticate requests
 * The token is obtained via: await getToken({ template: 'supabase' })
 */

import type { AnalysisResult } from '@/components/portfolio/extracurricular/workshop/backendTypes';
import { assertAuthenticated } from '../auth/clerkSupabaseAdapter';
import { getAuthenticatedSupabaseClient, verifyClerkToken } from '../auth/getAuthenticatedSupabaseClient';

// =============================================================================
// TYPES
// =============================================================================

export interface PIQEssay {
  id: string;
  user_id: string;
  essay_type: 'uc_piq';
  prompt_text: string;
  prompt_id?: string; // Custom field for tracking which PIQ (piq1, piq2, etc.)
  draft_original: string;
  draft_current: string;
  version: number;
  max_words: number;
  created_at: string;
  updated_at: string;
  locked: boolean;
}

export interface PIQAnalysisReport {
  id: string;
  essay_id: string;
  essay_quality_index: number; // Maps to narrative_quality_index
  rubric_version: string;
  analysis_depth: 'quick' | 'standard' | 'comprehensive';
  dimension_scores: any; // JSONB
  weights: any; // JSONB
  flags: string[];
  prioritized_levers: string[];
  voice_fingerprint: any; // JSONB - NEW
  experience_fingerprint: any; // JSONB - NEW
  workshop_items: any; // JSONB - NEW
  full_analysis_result: any; // JSONB - NEW (complete AnalysisResult for archival)
  created_at: string;
}

export interface PIQVersion {
  id: string;
  essay_id: string;
  version: number;
  draft_content: string;
  word_count: number;
  change_summary?: string;
  source: 'student' | 'coach_suggestion' | 'system_auto' | 'analyze' | 'save_draft';
  created_at: string;
  score?: number; // Joined from analysis report - undefined for 'save_draft' versions
}

export interface SaveEssayResult {
  success: boolean;
  essayId?: string;
  error?: string;
  isNew?: boolean;
}

export interface SaveAnalysisResult {
  success: boolean;
  reportId?: string;
  error?: string;
}

export interface LoadEssayResult {
  success: boolean;
  essay?: PIQEssay;
  analysis?: AnalysisResult;
  error?: string;
}

export interface VersionHistoryResult {
  success: boolean;
  versions?: PIQVersion[];
  error?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract prompt ID from prompt text or use explicit ID
 * PIQ prompts are identified by "piq1", "piq2", etc.
 */
function normalizePromptId(promptId?: string, promptText?: string): string {
  if (promptId) {
    return promptId;
  }

  // Try to extract from prompt text
  if (promptText) {
    // You could add logic here to match prompt text to known PIQ IDs
    return 'custom';
  }

  return 'unknown';
}

/**
 * Convert score to impression label enum value
 */
function getImpressionLabel(score: number): string {
  if (score >= 90) return 'arresting_deeply_human';
  if (score >= 80) return 'compelling_clear_voice';
  if (score >= 70) return 'competent_needs_texture';
  if (score >= 60) return 'readable_but_generic';
  return 'template_like_rebuild';
}

/**
 * Convert AnalysisResult to database format
 */
function analysisResultToDatabaseFormat(analysisResult: AnalysisResult) {
  const score = analysisResult.analysis?.narrative_quality_index || 0;
  return {
    essay_quality_index: score,
    impression_label: getImpressionLabel(score),
    rubric_version: 'v1.0.0',
    analysis_depth: 'comprehensive' as const,
    dimension_scores: analysisResult.rubricDimensionDetails || [],
    weights: {}, // Could extract from rubric if available
    flags: analysisResult.workshopItems?.map(item => item.problem) || [],
    prioritized_levers: [], // Could extract from workshop items
    voice_fingerprint: analysisResult.voiceFingerprint || null,
    experience_fingerprint: analysisResult.experienceFingerprint || null,
    workshop_items: analysisResult.workshopItems || [],
    full_analysis_result: analysisResult
  };
}

/**
 * Convert database format back to AnalysisResult
 */
function databaseFormatToAnalysisResult(report: PIQAnalysisReport): AnalysisResult | null {
  // Prefer full_analysis_result if available (complete object)
  if (report.full_analysis_result) {
    return report.full_analysis_result as AnalysisResult;
  }

  // Reconstruct from individual fields (fallback)
  const reconstructed = {
    analysis: {
      narrative_quality_index: report.essay_quality_index,
      target_tier: report.essay_quality_index >= 85 ? 'Elite (90-100)' :
                   report.essay_quality_index >= 70 ? 'Competitive (70-84)' :
                   report.essay_quality_index >= 55 ? 'Developing (55-69)' : 'Needs Work (<55)'
    },
    rubricDimensionDetails: report.dimension_scores || [],
    workshopItems: report.workshop_items || [],
    voiceFingerprint: report.voice_fingerprint || null,
    experienceFingerprint: report.experience_fingerprint || null,
    report: {},
    features: {},
    authenticity: {},
    performance: {},
  };
  return reconstructed as AnalysisResult;
}

// =============================================================================
// SAVE FUNCTIONS
// =============================================================================

/**
 * Save or update a PIQ essay in the database
 *
 * @param clerkToken - JWT token from Clerk's getToken({ template: 'supabase' })
 * @param userId - Clerk user ID (required for RLS)
 * @param promptId - PIQ identifier (e.g., "piq1", "piq2")
 * @param promptText - Full text of the PIQ prompt
 * @param currentDraft - Current essay content
 * @param originalDraft - Original essay content (optional, defaults to currentDraft)
 * @returns SaveEssayResult with essay ID
 */
export async function saveOrUpdatePIQEssay(
  clerkToken: string,
  userId: string,
  promptId: string,
  promptText: string,
  currentDraft: string,
  originalDraft?: string
): Promise<SaveEssayResult> {
  try {
    assertAuthenticated(userId);

    // Verify token
    if (!verifyClerkToken(clerkToken)) {
      return { success: false, error: 'Invalid authentication token' };
    }

    // Create authenticated client
    const supabase = getAuthenticatedSupabaseClient(clerkToken);

    const normalizedPromptId = normalizePromptId(promptId, promptText);

    // Check if essay already exists for this user + prompt
    const { data: existing, error: fetchError } = await supabase
      .from('essays')
      .select('id, version, draft_current')
      .eq('user_id', userId)
      .eq('essay_type', 'uc_piq')
      .eq('prompt_text', promptText)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching existing essay:', fetchError);
      return { success: false, error: fetchError.message };
    }

    // UPDATE existing essay
    if (existing) {
      // Only update if content actually changed
      if (existing.draft_current === currentDraft) {
        console.log('✅ Essay unchanged, skipping update');
        return { success: true, essayId: existing.id, isNew: false };
      }

      const { data: updated, error: updateError } = await supabase
        .from('essays')
        .update({
          draft_current: currentDraft,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating essay:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log(`✅ Essay updated: ${existing.id} (version ${existing.version} -> ${existing.version + 1})`);
      return { success: true, essayId: updated.id, isNew: false };
    }

    // INSERT new essay
    const { data: inserted, error: insertError } = await supabase
      .from('essays')
      .insert({
        user_id: userId,
        essay_type: 'uc_piq',
        prompt_text: promptText,
        draft_original: originalDraft || currentDraft,
        draft_current: currentDraft,
        max_words: 350, // UC PIQ limit
        version: 1,
        locked: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting essay:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log(`✅ New essay created: ${inserted.id}`);
    return { success: true, essayId: inserted.id, isNew: true };

  } catch (error) {
    console.error('Unexpected error in saveOrUpdatePIQEssay:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Save analysis results to database
 *
 * @param clerkToken - JWT token from Clerk's getToken({ template: 'supabase' })
 * @param userId - Clerk user ID (required for RLS)
 * @param essayId - Essay ID from essays table
 * @param analysisResult - Complete AnalysisResult object from backend
 * @returns SaveAnalysisResult with report ID
 */
export async function saveAnalysisReport(
  clerkToken: string,
  userId: string,
  essayId: string,
  analysisResult: AnalysisResult
): Promise<SaveAnalysisResult> {
  try {
    assertAuthenticated(userId);

    // Verify token
    if (!verifyClerkToken(clerkToken)) {
      return { success: false, error: 'Invalid authentication token' };
    }

    // Create authenticated client
    const supabase = getAuthenticatedSupabaseClient(clerkToken);

    // Verify user owns this essay (RLS will also check, but good to validate)
    const { data: essay, error: essayError } = await supabase
      .from('essays')
      .select('id')
      .eq('id', essayId)
      .eq('user_id', userId)
      .maybeSingle();

    if (essayError || !essay) {
      return {
        success: false,
        error: essayError?.message || 'Essay not found or access denied'
      };
    }

    // Convert to database format
    const reportData = analysisResultToDatabaseFormat(analysisResult);

    // Insert new analysis report
    const { data: inserted, error: insertError } = await supabase
      .from('essay_analysis_reports')
      .insert({
        essay_id: essayId,
        ...reportData
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting analysis report:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log(`✅ Analysis report saved: ${inserted.id} (NQI: ${reportData.essay_quality_index})`);
    return { success: true, reportId: inserted.id };

  } catch (error) {
    console.error('Unexpected error in saveAnalysisReport:', error);
    return { success: false, error: (error as Error).message };
  }
}

// =============================================================================
// LOAD FUNCTIONS
// =============================================================================

/**
 * Load PIQ essay and its latest analysis from database
 *
 * @param clerkToken - JWT token from Clerk's getToken({ template: 'supabase' })
 * @param userId - Clerk user ID (required for RLS)
 * @param promptId - PIQ identifier (e.g., "piq1")
 * @param promptText - Full text of the PIQ prompt (used to match essay)
 * @returns LoadEssayResult with essay and analysis
 */
export async function loadPIQEssay(
  clerkToken: string,
  userId: string,
  promptId: string,
  promptText: string
): Promise<LoadEssayResult> {
  try {
    assertAuthenticated(userId);

    // Verify token
    if (!verifyClerkToken(clerkToken)) {
      return { success: false, error: 'Invalid authentication token' };
    }

    // Create authenticated client
    const supabase = getAuthenticatedSupabaseClient(clerkToken);

    // Find essay by user_id + prompt_text
    const { data: essay, error: essayError } = await supabase
      .from('essays')
      .select('*')
      .eq('user_id', userId)
      .eq('essay_type', 'uc_piq')
      .eq('prompt_text', promptText)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (essayError) {
      console.error('Error loading essay:', essayError);
      return { success: false, error: essayError.message };
    }

    if (!essay) {
      // No essay found - not an error, just means user hasn't saved yet
      console.log('📭 No saved essay found for this prompt');
      return { success: true, essay: undefined, analysis: undefined };
    }

    // Load latest analysis report for this essay
    const { data: report, error: reportError } = await supabase
      .from('essay_analysis_reports')
      .select('*')
      .eq('essay_id', essay.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reportError) {
      console.error('Error loading analysis report:', reportError);
      // Continue without analysis rather than failing completely
    }

    const analysisResult = report ? databaseFormatToAnalysisResult(report) : undefined;

    console.log(`✅ Loaded essay: ${essay.id} (version ${essay.version})`);
    if (analysisResult) {
      console.log(`✅ Loaded analysis: NQI ${analysisResult.analysis?.narrative_quality_index}`);
    }

    return {
      success: true,
      essay: essay as PIQEssay,
      analysis: analysisResult || undefined
    };

  } catch (error) {
    console.error('Unexpected error in loadPIQEssay:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get version history for a PIQ essay
 *
 * @param clerkToken - JWT token from Clerk's getToken({ template: 'supabase' })
 * @param userId - Clerk user ID (required for RLS)
 * @param essayId - Essay ID from essays table
 * @returns VersionHistoryResult with array of versions
 */
export async function getVersionHistory(
  clerkToken: string,
  userId: string,
  essayId: string
): Promise<VersionHistoryResult> {
  try {
    assertAuthenticated(userId);

    // Verify token
    if (!verifyClerkToken(clerkToken)) {
      return { success: false, error: 'Invalid authentication token' };
    }

    // Create authenticated client
    const supabase = getAuthenticatedSupabaseClient(clerkToken);

    // Verify user owns this essay
    const { data: essay, error: essayError } = await supabase
      .from('essays')
      .select('id')
      .eq('id', essayId)
      .eq('user_id', userId)
      .maybeSingle();

    if (essayError || !essay) {
      return {
        success: false,
        error: essayError?.message || 'Essay not found or access denied'
      };
    }

    // Get all revision history
    const { data: versions, error: versionsError } = await supabase
      .from('essay_revision_history')
      .select('*')
      .eq('essay_id', essayId)
      .order('created_at', { ascending: false });

    if (versionsError) {
      console.error('Error loading version history:', versionsError);
      return { success: false, error: versionsError.message };
    }

    // For each version, try to find corresponding analysis report
    const versionsWithScores: PIQVersion[] = await Promise.all(
      (versions || []).map(async (version) => {
        // Find analysis report created around the same time
        const { data: report } = await supabase
          .from('essay_analysis_reports')
          .select('essay_quality_index')
          .eq('essay_id', essayId)
          .gte('created_at', version.created_at)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        return {
          ...version,
          score: report?.essay_quality_index
        } as PIQVersion;
      })
    );

    console.log(`✅ Loaded ${versionsWithScores.length} versions for essay ${essayId}`);
    return { success: true, versions: versionsWithScores };

  } catch (error) {
    console.error('Unexpected error in getVersionHistory:', error);
    return { success: false, error: (error as Error).message };
  }
}

// =============================================================================
// VERSION MANAGEMENT
// =============================================================================

/**
 * Save a new version to revision history
 *
 * @param clerkToken - JWT token from Clerk's getToken({ template: 'supabase' })
 * @param userId - Clerk user ID (required for RLS)
 * @param essayId - Essay ID from essays table
 * @param draftContent - Content of this version
 * @param source - What triggered this save
 * @param changeSummary - Optional description of changes
 */
export async function saveVersion(
  clerkToken: string,
  userId: string,
  essayId: string,
  draftContent: string,
  source: PIQVersion['source'],
  changeSummary?: string
): Promise<{ success: boolean; versionId?: string; error?: string }> {
  try {
    assertAuthenticated(userId);

    if (!verifyClerkToken(clerkToken)) {
      return { success: false, error: 'Invalid authentication token' };
    }

    const supabase = getAuthenticatedSupabaseClient(clerkToken);

    // Get current version number
    const { data: essay } = await supabase
      .from('essays')
      .select('version')
      .eq('id', essayId)
      .eq('user_id', userId)
      .single();

    const newVersionNumber = (essay?.version || 0) + 1;
    const wordCount = draftContent.split(/\s+/).filter(Boolean).length;

    // Insert new version
    const { data: version, error: insertError } = await supabase
      .from('essay_revision_history')
      .insert({
        essay_id: essayId,
        version: newVersionNumber,
        draft_content: draftContent,
        word_count: wordCount,
        change_summary: changeSummary,
        source
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving version:', insertError);
      return { success: false, error: insertError.message };
    }

    // Update essay version number
    await supabase
      .from('essays')
      .update({ version: newVersionNumber })
      .eq('id', essayId);

    console.log(`✅ Version ${newVersionNumber} saved for essay ${essayId}`);
    return { success: true, versionId: version.id };

  } catch (error) {
    console.error('Unexpected error in saveVersion:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Restore a previous version
 *
 * @param clerkToken - JWT token from Clerk's getToken({ template: 'supabase' })
 * @param userId - Clerk user ID (required for RLS)
 * @param essayId - Essay ID from essays table
 * @param versionId - Version ID to restore
 */
export async function restoreVersion(
  clerkToken: string,
  userId: string,
  essayId: string,
  versionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    assertAuthenticated(userId);

    if (!verifyClerkToken(clerkToken)) {
      return { success: false, error: 'Invalid authentication token' };
    }

    const supabase = getAuthenticatedSupabaseClient(clerkToken);

    // Get the version to restore
    const { data: version, error: versionError } = await supabase
      .from('essay_revision_history')
      .select('draft_content')
      .eq('id', versionId)
      .eq('essay_id', essayId)
      .single();

    if (versionError || !version) {
      return { success: false, error: versionError?.message || 'Version not found' };
    }

    // Update essay with restored content
    const { error: updateError } = await supabase
      .from('essays')
      .update({
        draft_current: version.draft_content,
        updated_at: new Date().toISOString()
      })
      .eq('id', essayId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error restoring version:', updateError);
      return { success: false, error: updateError.message };
    }

    // Save a new version marking the restore
    await saveVersion(
      clerkToken,
      userId,
      essayId,
      version.draft_content,
      'system_auto',
      `Restored from version ${versionId}`
    );

    console.log(`✅ Restored version ${versionId} for essay ${essayId}`);
    return { success: true };

  } catch (error) {
    console.error('Unexpected error in restoreVersion:', error);
    return { success: false, error: (error as Error).message };
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if user has any saved PIQ essays
 */
export async function hasAnyPIQEssays(
  clerkToken: string,
  userId: string
): Promise<boolean> {
  try {
    if (!verifyClerkToken(clerkToken)) {
      return false;
    }

    const supabase = getAuthenticatedSupabaseClient(clerkToken);

    const { count, error } = await supabase
      .from('essays')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('essay_type', 'uc_piq');

    if (error) {
      console.error('Error checking PIQ essays:', error);
      return false;
    }

    return (count || 0) > 0;
  } catch (error) {
    console.error('Unexpected error in hasAnyPIQEssays:', error);
    return false;
  }
}

/**
 * Get all PIQ essays for a user (summary only)
 */
export async function getAllPIQEssaySummaries(
  clerkToken: string,
  userId: string
): Promise<{ success: boolean; essays?: Array<{ id: string; promptText: string; wordCount: number; lastUpdated: string }>; error?: string }> {
  try {
    assertAuthenticated(userId);

    if (!verifyClerkToken(clerkToken)) {
      return { success: false, error: 'Invalid authentication token' };
    }

    const supabase = getAuthenticatedSupabaseClient(clerkToken);

    const { data: essays, error } = await supabase
      .from('essays')
      .select('id, prompt_text, draft_current, updated_at')
      .eq('user_id', userId)
      .eq('essay_type', 'uc_piq')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading essay summaries:', error);
      return { success: false, error: error.message };
    }

    const summaries = (essays || []).map(essay => ({
      id: essay.id,
      promptText: essay.prompt_text,
      wordCount: essay.draft_current?.split(/\s+/).filter(Boolean).length || 0,
      lastUpdated: essay.updated_at
    }));

    return { success: true, essays: summaries };

  } catch (error) {
    console.error('Unexpected error in getAllPIQEssaySummaries:', error);
    return { success: false, error: (error as Error).message };
  }
}
