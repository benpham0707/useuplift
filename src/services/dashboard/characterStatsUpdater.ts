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

  // 1. Narrative Score - from essay assessments
  try {
    const { data: essays } = await supabase
      .from('essay_analysis_reports')
      .select('total_score, narrative_voice, depth_of_reflection')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (essays && essays.length > 0) {
      // Average the latest essay scores
      const avgScore = essays.reduce((sum, e) => sum + (e.total_score || 0), 0) / essays.length;
      stats.narrative = Math.min(100, Math.round(avgScore * 10)); // Convert 0-10 to 0-100
    }
  } catch (error) {
    console.error('Error fetching narrative data:', error);
  }

  // 2. Impact Score - from activities
  try {
    const { data: activities } = await supabase
      .from('assessment_activities')
      .select('*')
      .eq('user_id', userId);

    if (activities && activities.length > 0) {
      // Calculate impact based on:
      // - Number of activities
      // - Leadership roles
      // - Community service hours
      // - Awards/recognition

      let impactPoints = 0;
      activities.forEach((activity: any) => {
        impactPoints += 5; // Base points per activity

        if (activity.category === 'Leadership') impactPoints += 10;
        if (activity.category === 'Community Service') impactPoints += 8;
        if (activity.awards_recognition) impactPoints += 15;

        // Hours commitment (assuming stored in hours_per_week)
        if (activity.hours_per_week) {
          impactPoints += Math.min(activity.hours_per_week * 2, 20);
        }
      });

      stats.impact = Math.min(100, Math.round(50 + (impactPoints / 10)));
    }
  } catch (error) {
    console.error('Error fetching impact data:', error);
  }

  // 3. Academics Score - from GPA and course rigor
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('gpa')
      .eq('user_id', userId)
      .single();

    if (profile?.gpa) {
      // Convert GPA to 0-100 scale (assuming 4.0 scale)
      stats.academics = Math.min(100, Math.round((profile.gpa / 4.0) * 100));
    }

    // Bonus for AP/IB courses
    const { data: assessment } = await supabase
      .from('assessments')
      .select('ap_courses_count, ib_courses_count')
      .eq('user_id', userId)
      .single();

    if (assessment) {
      const advancedCourses = (assessment.ap_courses_count || 0) + (assessment.ib_courses_count || 0);
      stats.academics = Math.min(100, stats.academics + (advancedCourses * 2));
    }
  } catch (error) {
    console.error('Error fetching academics data:', error);
  }

  // 4. Curiosity Score - from interests and research
  try {
    const { data: interests } = await supabase
      .from('assessment_interests')
      .select('*')
      .eq('user_id', userId);

    if (interests && interests.length > 0) {
      // More diverse interests = higher curiosity
      stats.curiosity = Math.min(100, 50 + (interests.length * 10));
    }

    // Bonus for research/independent projects
    const { data: activities } = await supabase
      .from('assessment_activities')
      .select('category')
      .eq('user_id', userId)
      .or('category.eq.Research,category.eq.Academic');

    if (activities && activities.length > 0) {
      stats.curiosity = Math.min(100, stats.curiosity + (activities.length * 5));
    }
  } catch (error) {
    console.error('Error fetching curiosity data:', error);
  }

  // 5. Network Score - placeholder for future network intelligence
  // For now, base it on number of recommenders and activities with collaboration
  try {
    const { data: activities } = await supabase
      .from('assessment_activities')
      .select('category')
      .eq('user_id', userId)
      .or('category.eq.Clubs,category.eq.Sports,category.eq.Leadership');

    if (activities && activities.length > 0) {
      stats.network = Math.min(100, 38 + (activities.length * 8));
    }
  } catch (error) {
    console.error('Error fetching network data:', error);
  }

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

    // XP for assessments completed
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id')
      .eq('user_id', userId)
      .not('completed_at', 'is', null);

    if (assessments && assessments.length > 0) {
      xp += 100; // 100 XP for completing assessment
    }

    // XP for portfolio scans
    const { data: reports } = await supabase
      .from('assessment_reports')
      .select('id')
      .eq('user_id', userId);

    if (reports) {
      xp += reports.length * 20; // 20 XP per scan
    }

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