import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Options for configuring the useProfileSection hook
 */
export interface UseProfileSectionOptions {
  /** Name of the database table to query */
  tableName: string;
  /** Profile ID to filter by */
  profileId: string;
  /** Whether to enable queries (default: true) */
  enabled?: boolean;
}

/**
 * Result returned by the useProfileSection hook
 */
export interface UseProfileSectionResult<T> {
  /** Current data from the table (null if no row exists) */
  data: T | null;
  /** Whether initial data is loading */
  isLoading: boolean;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Error message if any operation failed */
  error: string | null;
  /** Function to save/upsert data to the table */
  save: (values: Partial<T>) => Promise<void>;
  /** Function to manually refetch data */
  refetch: () => Promise<void>;
}

/**
 * Generic hook for loading and saving profile section data
 *
 * Fetches a single row from a canonical profile table (e.g., personal_information, academic_journey)
 * where profile_id matches the provided profileId. Provides methods to upsert data and refetch.
 *
 * After successful save, triggers a refetch of useProfileCompletion data via custom event.
 *
 * @example
 * ```tsx
 * const { data, isLoading, save } = useProfileSection<PersonalInformation>({
 *   tableName: 'personal_information',
 *   profileId: profile.id,
 * });
 *
 * await save({ first_name: 'John', last_name: 'Doe' });
 * ```
 */
export function useProfileSection<T = any>(
  options: UseProfileSectionOptions
): UseProfileSectionResult<T> {
  const { tableName, profileId, enabled = true } = options;
  const { user } = useAuth();

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches the row from the table where profile_id = profileId
   */
  const fetchData = useCallback(async () => {
    if (!enabled || !profileId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const { data: result, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setData(result as T);
    } catch (err) {
      console.error(`[useProfileSection:${tableName}] Fetch error:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [tableName, profileId, enabled]);

  /**
   * Manually refetch data from the table
   */
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  /**
   * Save (upsert) data to the table
   * - Inserts a new row if one doesn't exist
   * - Updates the existing row if one exists
   * - Sets updated_at to now()
   * - After success, invalidates useProfileCompletion cache
   */
  const save = useCallback(async (values: Partial<T>) => {
    if (!profileId) {
      throw new Error('Profile ID is required to save data');
    }

    try {
      setError(null);
      setIsSaving(true);

      // Prepare the data with profile_id and updated_at
      const saveData = {
        ...values,
        profile_id: profileId,
        updated_at: new Date().toISOString(),
      };

      const { data: result, error: saveError } = await supabase
        .from(tableName)
        .upsert(saveData, {
          onConflict: 'profile_id', // Use profile_id as the conflict target for most tables
        })
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      // Update local state with the saved data
      setData(result as T);

      // Trigger useProfileCompletion to refetch by dispatching a custom event
      // This ensures completion percentage updates immediately after saving
      window.dispatchEvent(new CustomEvent('profile:section-updated', {
        detail: { tableName, profileId }
      }));

      // Also refetch the data to ensure we have the latest from the server
      await fetchData();

    } catch (err) {
      console.error(`[useProfileSection:${tableName}] Save error:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save data';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [tableName, profileId, fetchData]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    isSaving,
    error,
    save,
    refetch,
  };
}
