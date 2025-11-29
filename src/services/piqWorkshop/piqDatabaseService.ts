// @ts-nocheck - Database service with Supabase schema sync issues
/**
 * PIQ Workshop Database Service
 *
 * Handles persistent storage of PIQ essays, analysis results, and version history
 * Uses existing essay system tables: essays, essay_analysis_reports, essay_revision_history
 *
 * IMPORTANT: All functions require a Clerk JWT token to authenticate requests
 * The token is obtained via: await getToken({ template: 'supabase' })
 * 
 * Version History System (v2):
 * - Three version types: autosave, milestone, analysis
 * - Direct score storage on versions
 * - Labels for milestone versions
 * - Soft delete support
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
  voice_fingerprint: any; // JSONB
  experience_fingerprint: any; // JSONB
  workshop_items: any; // JSONB
  full_analysis_result: any; // JSONB (complete AnalysisResult for archival)
  created_at: string;
}

/** Version source types - matches version_source_type enum in database */
export type VersionSourceType = 'autosave' | 'milestone' | 'analysis';

/**
 * PIQ Version - represents a single version in the revision history
 * Updated for v2 version history system
 */
export interface PIQVersion {
  id: string;
  essay_id: string;
  version: number;
  draft_content: string;
  word_count: number;
  change_summary?: string;
  /** Version type: autosave, milestone, or analysis */
  created_by: VersionSourceType;
  /** Label for milestone versions (e.g., "Before counselor feedback") */
  label?: string;
  /** Parent version ID for diffing (optional) */
  parent_version_id?: string;
  /** Score at time of save (for analysis versions, or if manually set) */
  score?: number;
  /** Dimension scores breakdown (for analysis versions) */
  dimension_scores?: any;
  /** Link to analysis report (for analysis versions) */
  analysis_report_id?: string;
  /** Soft delete flag */
  is_deleted: boolean;
  created_at: string;
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

export interface SaveVersionResult {
  success: boolean;
  versionId?: string;
  versionNumber?: number;
  error?: string;
}

/** Options for saving a version */
export interface SaveVersionOptions {
  /** Type of version being saved */
  createdBy: VersionSourceType;
  /** Label for milestone versions */
  label?: string;
  /** Parent version ID for diffing */
  parentVersionId?: string;
  /** Score to store (for analysis versions) */
  score?: number;
  /** Dimension scores breakdown */
  dimensionScores?: any;
  /** Link to analysis report */
  analysisReportId?: string;
  /** Change summary/description */
  changeSummary?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Minimum character difference to trigger a new autosave version */
const AUTOSAVE_MIN_CHAR_DIFF = 20;

/** Minimum time between autosaves in milliseconds (10 minutes) */
const AUTOSAVE_MIN_INTERVAL_MS = 10 * 60 * 1000;

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

/**
 * Calculate character difference between two strings
 */
function getCharDiff(oldContent: string, newContent: string): number {
  return Math.abs(newContent.length - oldContent.length);
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
 * Returns non-deleted versions sorted by created_at desc
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

    // Get all non-deleted revision history
    // Score is now stored directly on the version, no need for joins
    const { data: versions, error: versionsError } = await supabase
      .from('essay_revision_history')
      .select('*')
      .eq('essay_id', essayId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (versionsError) {
      console.error('Error loading version history:', versionsError);
      return { success: false, error: versionsError.message };
    }

    // Map to PIQVersion type
    const mappedVersions: PIQVersion[] = (versions || []).map(v => ({
      id: v.id,
      essay_id: v.essay_id,
      version: v.version,
      draft_content: v.draft_content,
      word_count: v.word_count,
      change_summary: v.change_summary,
      created_by: v.created_by,
      label: v.label,
      parent_version_id: v.parent_version_id,
      score: v.score,
      dimension_scores: v.dimension_scores,
      analysis_report_id: v.analysis_report_id,
      is_deleted: v.is_deleted,
      created_at: v.created_at,
    }));

    console.log(`✅ Loaded ${mappedVersions.length} versions for essay ${essayId}`);
    return { success: true, versions: mappedVersions };

  } catch (error) {
    console.error('Unexpected error in getVersionHistory:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get the latest version for an essay
 * Used for autosave dedup logic
 */
export async function getLatestVersion(
  clerkToken: string,
  userId: string,
  essayId: string
): Promise<{ success: boolean; version?: PIQVersion; error?: string }> {
  try {
    assertAuthenticated(userId);

    if (!verifyClerkToken(clerkToken)) {
      return { success: false, error: 'Invalid authentication token' };
    }

    const supabase = getAuthenticatedSupabaseClient(clerkToken);

    const { data: version, error } = await supabase
      .from('essay_revision_history')
      .select('*')
          .eq('essay_id', essayId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

    if (error) {
      console.error('Error getting latest version:', error);
      return { success: false, error: error.message };
    }

    return { success: true, version: version as PIQVersion | undefined };

  } catch (error) {
    console.error('Unexpected error in getLatestVersion:', error);
    return { success: false, error: (error as Error).message };
  }
}

// =============================================================================
// VERSION MANAGEMENT - NEW API
// =============================================================================

/**
 * Save a new version to revision history (generic)
 * This is the base function used by specialized save functions
 *
 * @param clerkToken - JWT token from Clerk's getToken({ template: 'supabase' })
 * @param userId - Clerk user ID (required for RLS)
 * @param essayId - Essay ID from essays table
 * @param draftContent - Content of this version
 * @param options - Version options (type, label, score, etc.)
 */
export async function saveVersion(
  clerkToken: string,
  userId: string,
  essayId: string,
  draftContent: string,
  options: SaveVersionOptions
): Promise<SaveVersionResult> {
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

    // Insert new version with all new fields
    const { data: version, error: insertError } = await supabase
      .from('essay_revision_history')
      .insert({
        essay_id: essayId,
        version: newVersionNumber,
        draft_content: draftContent,
        word_count: wordCount,
        change_summary: options.changeSummary,
        created_by: options.createdBy,
        label: options.label,
        parent_version_id: options.parentVersionId,
        score: options.score,
        dimension_scores: options.dimensionScores,
        analysis_report_id: options.analysisReportId,
        is_deleted: false,
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

    console.log(`✅ Version ${newVersionNumber} (${options.createdBy}) saved for essay ${essayId}`);
    return { success: true, versionId: version.id, versionNumber: newVersionNumber };

  } catch (error) {
    console.error('Unexpected error in saveVersion:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Save an autosave version with dedup logic
 * Only creates a new version if:
 * - Content changed by more than AUTOSAVE_MIN_CHAR_DIFF characters, OR
 * - Last autosave was more than AUTOSAVE_MIN_INTERVAL_MS ago
 *
 * @param clerkToken - JWT token
 * @param userId - Clerk user ID
 * @param essayId - Essay ID
 * @param draftContent - Content to save
 * @returns SaveVersionResult with skipped=true if deduped
 */
export async function saveAutosaveVersion(
  clerkToken: string,
  userId: string,
  essayId: string,
  draftContent: string
): Promise<SaveVersionResult & { skipped?: boolean }> {
  try {
    assertAuthenticated(userId);

    if (!verifyClerkToken(clerkToken)) {
      return { success: false, error: 'Invalid authentication token' };
    }

    const supabase = getAuthenticatedSupabaseClient(clerkToken);

    // Get the latest version for dedup check
    const { data: latestVersion } = await supabase
      .from('essay_revision_history')
      .select('draft_content, created_at, created_by')
      .eq('essay_id', essayId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Dedup logic: skip if content hasn't changed enough AND it's too recent
    if (latestVersion) {
      const charDiff = getCharDiff(latestVersion.draft_content || '', draftContent);
      const timeSinceLastSave = Date.now() - new Date(latestVersion.created_at).getTime();
      
      // Only check dedup for autosave versions
      if (
        latestVersion.created_by === 'autosave' &&
        charDiff < AUTOSAVE_MIN_CHAR_DIFF &&
        timeSinceLastSave < AUTOSAVE_MIN_INTERVAL_MS
      ) {
        console.log(`⏭️ Autosave skipped (charDiff: ${charDiff}, timeSince: ${Math.round(timeSinceLastSave / 1000)}s)`);
        return { success: true, skipped: true };
      }

      // Also skip if content is exactly the same
      if (latestVersion.draft_content === draftContent) {
        console.log('⏭️ Autosave skipped (content unchanged)');
        return { success: true, skipped: true };
      }
    }

    // Save the autosave version
    const result = await saveVersion(clerkToken, userId, essayId, draftContent, {
      createdBy: 'autosave',
      parentVersionId: latestVersion?.id,
    });

    return result;

  } catch (error) {
    console.error('Unexpected error in saveAutosaveVersion:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Save a milestone version (user-triggered "Save Milestone")
 * Always creates a new version, even if content hasn't changed
 *
 * @param clerkToken - JWT token
 * @param userId - Clerk user ID
 * @param essayId - Essay ID
 * @param draftContent - Content to save
 * @param label - Optional label (e.g., "Before counselor feedback")
 */
export async function saveMilestoneVersion(
  clerkToken: string,
  userId: string,
  essayId: string,
  draftContent: string,
  label?: string
): Promise<SaveVersionResult> {
  try {
    assertAuthenticated(userId);

    if (!verifyClerkToken(clerkToken)) {
      return { success: false, error: 'Invalid authentication token' };
    }

    const supabase = getAuthenticatedSupabaseClient(clerkToken);

    // Get the latest version for parent reference
    const { data: latestVersion } = await supabase
      .from('essay_revision_history')
      .select('id')
      .eq('essay_id', essayId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Save the milestone version
    const result = await saveVersion(clerkToken, userId, essayId, draftContent, {
      createdBy: 'milestone',
      label: label,
      parentVersionId: latestVersion?.id,
      changeSummary: label ? `Milestone: ${label}` : 'Milestone saved',
    });

    return result;

  } catch (error) {
    console.error('Unexpected error in saveMilestoneVersion:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Save an analysis version (triggered by Analyze button)
 * Creates a new version with score and dimension scores attached
 *
 * @param clerkToken - JWT token
 * @param userId - Clerk user ID
 * @param essayId - Essay ID
 * @param draftContent - Content that was analyzed
 * @param score - Overall score from analysis
 * @param dimensionScores - Dimension breakdown from analysis
 * @param analysisReportId - ID of the analysis report (optional)
 */
export async function saveAnalysisVersion(
  clerkToken: string,
  userId: string,
  essayId: string,
  draftContent: string,
  score: number,
  dimensionScores?: any,
  analysisReportId?: string
): Promise<SaveVersionResult> {
  try {
    assertAuthenticated(userId);

    if (!verifyClerkToken(clerkToken)) {
      return { success: false, error: 'Invalid authentication token' };
    }

    const supabase = getAuthenticatedSupabaseClient(clerkToken);

    // Get the latest version for parent reference
    const { data: latestVersion } = await supabase
      .from('essay_revision_history')
      .select('id')
      .eq('essay_id', essayId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Save the analysis version
    const result = await saveVersion(clerkToken, userId, essayId, draftContent, {
      createdBy: 'analysis',
      parentVersionId: latestVersion?.id,
      score: score,
      dimensionScores: dimensionScores,
      analysisReportId: analysisReportId,
      changeSummary: `Analyzed (Score: ${score})`,
    });

    return result;

  } catch (error) {
    console.error('Unexpected error in saveAnalysisVersion:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Restore a previous version
 * Creates an autosave of current content first, then updates essay
 *
 * @param clerkToken - JWT token from Clerk's getToken({ template: 'supabase' })
 * @param userId - Clerk user ID (required for RLS)
 * @param essayId - Essay ID from essays table
 * @param versionId - Version ID to restore
 * @param currentContent - Current content to save as autosave before restore
 */
export async function restoreVersion(
  clerkToken: string,
  userId: string,
  essayId: string,
  versionId: string,
  currentContent?: string
): Promise<{ success: boolean; restoredContent?: string; error?: string }> {
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

    // Save current content as autosave before restoring (if provided)
    if (currentContent && currentContent !== version.draft_content) {
      await saveAutosaveVersion(clerkToken, userId, essayId, currentContent);
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

    // Create a new version marking the restore
    await saveVersion(clerkToken, userId, essayId, version.draft_content, {
      createdBy: 'autosave',
      changeSummary: `Restored from version ${versionId}`,
    });

    console.log(`✅ Restored version ${versionId} for essay ${essayId}`);
    return { success: true, restoredContent: version.draft_content };

  } catch (error) {
    console.error('Unexpected error in restoreVersion:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Soft delete a version
 * Sets is_deleted = true instead of actually deleting
 */
export async function softDeleteVersion(
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

    // Verify user owns this essay
    const { data: essay, error: essayError } = await supabase
      .from('essays')
      .select('id')
      .eq('id', essayId)
      .eq('user_id', userId)
      .maybeSingle();

    if (essayError || !essay) {
      return { success: false, error: 'Essay not found or access denied' };
    }

    // Soft delete the version
    const { error: updateError } = await supabase
      .from('essay_revision_history')
      .update({ is_deleted: true })
      .eq('id', versionId)
      .eq('essay_id', essayId);

    if (updateError) {
      console.error('Error soft deleting version:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`✅ Soft deleted version ${versionId}`);
    return { success: true };

  } catch (error) {
    console.error('Unexpected error in softDeleteVersion:', error);
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
