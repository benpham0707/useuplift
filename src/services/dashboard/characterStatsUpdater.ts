/**
 * Character Stats Updater Service
 *
 * Connects character stats to real assessment data from the platform.
 * Updates the character_stats table based on actual user performance.
 */

import { supabase } from '@/integrations/supabase/safeClient';
import { CharacterStats } from '@/lib/types/dashboard';

/**
 * Updates character stats based on real assessment data
 */
export async function updateCharacterStats(userId: string): Promise<CharacterStats | null> {
  try {
    // Get existing stats or create if missing
    const { data: existingStats } = await supabase
      .from('character_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Initialize previous values
    let prevStats = {
      narrative: existingStats?.narrative_score || 50,
      impact: existingStats?.impact_score || 50,
      academics: existingStats?.academics_score || 50,
      curiosity: existingStats?.curiosity_score || 50,
      network: existingStats?.network_score || 50,
    };

    // Calculate new stats from real data
    const newStats = await calculateStatsFromAssessments(userId);

    // Calculate XP based on activities
    const xp = await calculateXP(userId);

    // Determine level and title
    const { level, title } = getLevelFromXP(xp);

    // Update or create character stats
    const { data, error } = await supabase
      .from('character_stats')
      .upsert({
        user_id: userId,
        narrative_score: newStats.narrative,
        impact_score: newStats.impact,
        academics_score: newStats.academics,
        curiosity_score: newStats.curiosity,
        network_score: newStats.network,
        narrative_prev: prevStats.narrative,
        impact_prev: prevStats.impact,
        academics_prev: prevStats.academics,
        curiosity_prev: prevStats.curiosity,
        network_prev: prevStats.network,
        level,
        xp,
        title,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating character stats:', error);
      return null;
    }

    return data as CharacterStats;
  } catch (error) {
    console.error('Error in updateCharacterStats:', error);
    return null;
  }
}

/**
 * Calculate stats from various assessment sources
 */
async function calculateStatsFromAssessments(userId: string) {
  const stats = {
    narrative: 50,
    impact: 50,
    academics: 50,
    curiosity: 50,
    network: 50
  };

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('id').eq('user_id', userId).maybeSingle();
  if (profileError || !profile) return stats;

  const [{ data: academic }, { data: goals }, { data: experiences }, { data: reports }] = await Promise.all([
    supabase.from('academic_journey').select('gpa').eq('profile_id', profile.id).maybeSingle(),
    supabase.from('goals_aspirations').select('career_interests').eq('profile_id', profile.id).maybeSingle(),
    supabase.from('experiences_activities').select('extracurriculars, volunteer_service, leadership_roles, personal_projects').eq('profile_id', profile.id).maybeSingle(),
    supabase.from('essay_analysis_reports').select('essay_quality_index, essays!inner(user_id)').eq('essays.user_id', userId).limit(3),
  ]);

  if (reports?.length) {
    const average = reports.reduce((sum: number, report: any) => sum + Number(report.essay_quality_index ?? 0), 0) / reports.length;
    stats.narrative = Math.round(average);
  }
  if (academic?.gpa != null) stats.academics = Math.min(100, Math.round((Number(academic.gpa) / 4) * 100));
  const activityCount = ['extracurriculars', 'volunteer_service', 'leadership_roles', 'personal_projects']
    .reduce((sum, key) => sum + (Array.isArray((experiences as any)?.[key]) ? (experiences as any)[key].length : 0), 0);
  if (activityCount) stats.impact = Math.min(100, 50 + activityCount * 8);
  const interestCount = Array.isArray(goals?.career_interests) ? goals.career_interests.length : 0;
  if (interestCount) stats.curiosity = Math.min(100, 50 + interestCount * 10);
  if (Array.isArray(experiences?.leadership_roles) && experiences.leadership_roles.length) stats.network = Math.min(100, 38 + experiences.leadership_roles.length * 8);

  return stats;
}

/**
 * Calculate XP based on platform engagement
 */
async function calculateXP(userId: string): Promise<number> {
  let xp = 0;

  try {
    // XP for completed quests
    const { data: quests } = await supabase
      .from('daily_quests')
      .select('completed_count')
      .eq('user_id', userId);

    if (quests) {
      quests.forEach(q => {
        xp += (q.completed_count || 0) * 10; // 10 XP per completed quest
      });
    }

    // XP for essay submissions
    const { data: essays } = await supabase
      .from('essays')
      .select('id')
      .eq('user_id', userId);

    if (essays) {
      xp += essays.length * 25; // 25 XP per essay
    }

    const { data: reports } = await supabase
      .from('essay_analysis_reports')
      .select('id, essays!inner(user_id)')
      .eq('essays.user_id', userId);
    if (reports) xp += reports.length * 20;

  } catch (error) {
    console.error('Error calculating XP:', error);
  }

  return xp;
}

/**
 * Determine level and title from XP
 */
function getLevelFromXP(xp: number): { level: number; title: string } {
  if (xp >= 1000) return { level: 5, title: 'Elite Applicant' };
  if (xp >= 500) return { level: 4, title: 'Admissions Contender' };
  if (xp >= 250) return { level: 3, title: 'Strategic Thinker' };
  if (xp >= 100) return { level: 2, title: 'Rising Scholar' };
  return { level: 1, title: 'Freshman Explorer' };
}
