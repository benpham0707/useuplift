/**
 * PIQ Workshop Supabase Service
 *
 * Handles cloud storage, version history, and cross-device sync
 */

import { supabase } from '@/integrations/supabase/client';
import type { AnalysisResult } from '@/components/portfolio/extracurricular/workshop/backendTypes';
import type { DraftVersion } from './storageService';

export interface CloudVersion {
  id: string;
  user_id: string;
  prompt_id: string;
  prompt_title: string;
  essay_text: string;
  word_count: number;
  analysis_result: AnalysisResult | null;
  narrative_quality_index: number | null;
  version_number: number;
  is_current: boolean;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
  notes: string | null;
}

/**
 * Save a version to Supabase cloud
 */
export async function saveVersionToCloud(
  promptId: string,
  promptTitle: string,
  draftVersion: DraftVersion
): Promise<{ success: boolean; error?: string; versionId?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get current version number for this prompt
    const { data: existing } = await supabase
      .from('piq_essay_versions')
      .select('version_number')
      .eq('user_id', user.id)
      .eq('prompt_id', promptId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersionNumber = (existing && existing.length > 0)
      ? (existing[0].version_number + 1)
      : 1;

    // Mark all previous versions as not current
    await supabase
      .from('piq_essay_versions')
      .update({ is_current: false })
      .eq('user_id', user.id)
      .eq('prompt_id', promptId);

    // Insert new version
    const { data, error } = await supabase
      .from('piq_essay_versions')
      .insert({
        user_id: user.id,
        prompt_id: promptId,
        prompt_title: promptTitle,
        essay_text: draftVersion.text,
        word_count: draftVersion.wordCount,
        analysis_result: draftVersion.analysisSnapshot || null,
        narrative_quality_index: draftVersion.score,
        version_number: nextVersionNumber,
        is_current: true
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase save error:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Saved version ${nextVersionNumber} to cloud:`, data.id);
    return { success: true, versionId: data.id };

  } catch (error) {
    console.error('Failed to save to cloud:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Load all versions for a prompt from cloud
 */
export async function loadVersionsFromCloud(
  promptId: string
): Promise<{ success: boolean; versions?: CloudVersion[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('piq_essay_versions')
      .select('*')
      .eq('user_id', user.id)
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase load error:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Loaded ${data?.length || 0} versions from cloud`);
    return { success: true, versions: data || [] };

  } catch (error) {
    console.error('Failed to load from cloud:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Load the current (most recent) version from cloud
 */
export async function loadCurrentVersionFromCloud(
  promptId: string
): Promise<{ success: boolean; version?: CloudVersion; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('piq_essay_versions')
      .select('*')
      .eq('user_id', user.id)
      .eq('prompt_id', promptId)
      .eq('is_current', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Supabase load error:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, version: undefined }; // No current version
    }

    console.log(`✅ Loaded current version from cloud`);
    return { success: true, version: data };

  } catch (error) {
    console.error('Failed to load current version:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete a version from cloud
 */
export async function deleteVersionFromCloud(
  versionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('piq_essay_versions')
      .delete()
      .eq('id', versionId)
      .eq('user_id', user.id); // Security: only delete own versions

    if (error) {
      console.error('Supabase delete error:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Deleted version from cloud:`, versionId);
    return { success: true };

  } catch (error) {
    console.error('Failed to delete from cloud:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update version notes/tags
 */
export async function updateVersionMetadata(
  versionId: string,
  metadata: { notes?: string; tags?: string[] }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('piq_essay_versions')
      .update({
        notes: metadata.notes,
        tags: metadata.tags,
        updated_at: new Date().toISOString()
      })
      .eq('id', versionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Supabase update error:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Updated version metadata:`, versionId);
    return { success: true };

  } catch (error) {
    console.error('Failed to update metadata:', error);
    return { success: false, error: (error as Error).message };
  }
}
