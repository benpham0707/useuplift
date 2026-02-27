/**
 * Dashboard Data Seeding
 *
 * Initializes dashboard with realistic sample data for first-time users
 * Runs once when user first visits the dashboard
 */

import { supabase } from '@/integrations/supabase/safeClient';
import {
  Quest,
  QuestTool,
  EventType,
  CharacterTitle,
  DashboardEvent,
  PortfolioSuggestion
} from '@/lib/types/dashboard';

/**
 * Seeds all dashboard data for a new user
 * @param userId - Clerk user ID (string)
 */
export async function seedDashboardData(userId: string) {
  try {
    // Check if user already has character stats (indicates already seeded)
    const { data: existingStats } = await supabase
      .from('character_stats')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingStats) {
      console.log('Dashboard data already seeded for user:', userId);
      return;
    }

    console.log('Seeding dashboard data for new user:', userId);

    // Seed all dashboard tables in parallel
    await Promise.all([
      seedDailyQuests(userId),
      seedCharacterStats(userId),
      seedUserStreak(userId),
      seedDashboardEvents(userId),
      seedPortfolioSuggestions(userId)
    ]);

    console.log('Dashboard data seeding complete for user:', userId);
  } catch (error) {
    console.error('Error seeding dashboard data:', error);
  }
}

/**
 * Seeds daily quests for today
 */
async function seedDailyQuests(userId: string) {
  const today = new Date().toISOString().split('T')[0];

  const quests: Quest[] = [
    {
      id: 'quest-1',
      title: 'Complete Your Portfolio Scan',
      description: 'Update your activities and see where you stand',
      tool: QuestTool.Scanner,
      completed: false,
      route: '/portfolio-scanner'
    },
    {
      id: 'quest-2',
      title: 'Write a PIQ Response',
      description: 'Work on one Personal Insight Question',
      tool: QuestTool.PIQ,
      completed: false,
      route: '/piq-workshop'
    },
    {
      id: 'quest-3',
      title: 'Explore College Programs',
      description: 'Research schools that match your profile',
      tool: QuestTool.Schools,
      completed: false,
      route: '/schools'
    },
    {
      id: 'quest-4',
      title: 'Review AI Insights',
      description: 'Check personalized recommendations for your application',
      tool: QuestTool.Insights,
      completed: false,
      route: '/portfolio-insights'
    },
    {
      id: 'quest-5',
      title: 'Journal Your Progress',
      description: 'Reflect on your college application journey',
      tool: QuestTool.Journal,
      completed: false,
      route: '/journal'
    }
  ];

  const { error } = await supabase
    .from('daily_quests')
    .upsert({
      user_id: userId,
      quest_date: today,
      quests,
      completed_count: 0,
      credits_earned: 0
    }, {
      onConflict: 'user_id,quest_date'
    });

  if (error) {
    console.error('Error seeding daily quests:', error);
  }
}

/**
 * Seeds character stats with varied, realistic scores
 */
async function seedCharacterStats(userId: string) {
  const { error } = await supabase
    .from('character_stats')
    .insert({
      user_id: userId,
      narrative_score: 72,
      impact_score: 56,
      academics_score: 88,
      curiosity_score: 64,
      network_score: 38,
      narrative_prev: 68,
      impact_prev: 56,
      academics_prev: 85,
      curiosity_prev: 60,
      network_prev: 38,
      level: 1,
      xp: 0,
      title: CharacterTitle.FreshmanExplorer
    });

  if (error) {
    console.error('Error seeding character stats:', error);
  }
}

/**
 * Seeds user streak (fresh start)
 */
async function seedUserStreak(userId: string) {
  const { error } = await supabase
    .from('user_streaks')
    .upsert({
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      last_quest_date: null,
      total_credits_earned: 0
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('Error seeding user streak:', error);
  }
}

/**
 * Seeds realistic college application deadlines
 */
async function seedDashboardEvents(userId: string) {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  // Calculate appropriate dates based on current month
  const now = new Date();
  const currentMonth = now.getMonth();

  // If it's past application season (after January), use next year's dates
  const applicationYear = currentMonth <= 0 ? currentYear : nextYear;

  const events: Omit<DashboardEvent, 'id' | 'created_at'>[] = [
    {
      user_id: userId,
      title: 'Stanford REA Deadline',
      event_date: new Date(applicationYear - 1, 10, 1).toISOString(), // Nov 1
      event_type: EventType.Deadline,
      urgency: 'upcoming',
      description: 'Restrictive Early Action application due',
      related_link: '/applications',
      is_completed: false
    },
    {
      user_id: userId,
      title: 'UC Application Opens',
      event_date: new Date(applicationYear - 1, 9, 1).toISOString(), // Oct 1
      event_type: EventType.Milestone,
      urgency: 'upcoming',
      description: 'University of California application portal opens',
      related_link: '/applications',
      is_completed: false
    },
    {
      user_id: userId,
      title: 'UC Application Deadline',
      event_date: new Date(applicationYear - 1, 10, 30).toISOString(), // Nov 30
      event_type: EventType.Deadline,
      urgency: 'upcoming',
      description: 'All UC campus applications due',
      related_link: '/applications',
      is_completed: false
    },
    {
      user_id: userId,
      title: 'Common App Regular Decision',
      event_date: new Date(applicationYear, 0, 1).toISOString(), // Jan 1
      event_type: EventType.Deadline,
      urgency: 'upcoming',
      description: 'Most private colleges RD deadline',
      related_link: '/applications',
      is_completed: false
    },
    {
      user_id: userId,
      title: 'FAFSA Opens',
      event_date: new Date(applicationYear - 1, 9, 1).toISOString(), // Oct 1
      event_type: EventType.Milestone,
      urgency: 'upcoming',
      description: 'Federal financial aid application available',
      related_link: '/financial-aid',
      is_completed: false
    },
    {
      user_id: userId,
      title: 'College Counselor Meeting',
      event_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      event_type: EventType.Appointment,
      urgency: 'this_week',
      description: 'Review application strategy',
      is_completed: false
    },
    {
      user_id: userId,
      title: 'Submit Teacher Rec Requests',
      event_date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
      event_type: EventType.Reminder,
      urgency: 'upcoming',
      description: 'Ask teachers for recommendation letters',
      is_completed: false
    }
  ];

  const { error } = await supabase
    .from('dashboard_events')
    .insert(events);

  if (error) {
    console.error('Error seeding dashboard events:', error);
  }
}

/**
 * Seeds portfolio improvement suggestions
 */
async function seedPortfolioSuggestions(userId: string) {
  const suggestions: Omit<PortfolioSuggestion, 'id' | 'created_at'>[] = [
    {
      user_id: userId,
      category: 'Leadership',
      suggestion_text: 'Your leadership activities show potential but lack depth. Consider focusing on one organization where you can demonstrate increasing responsibility over time.',
      related_tool: 'Scanner',
      related_link: '/portfolio-scanner',
      is_dismissed: false
    },
    {
      user_id: userId,
      category: 'Community Service',
      suggestion_text: 'Add more consistent community service. Colleges value sustained commitment over one-time events. Aim for 2-3 hours weekly in one meaningful cause.',
      related_tool: 'Scanner',
      related_link: '/portfolio-scanner',
      is_dismissed: false
    },
    {
      user_id: userId,
      category: 'Academic Enrichment',
      suggestion_text: 'Consider adding academic competitions or research projects related to your intended major. This shows intellectual curiosity beyond the classroom.',
      related_tool: 'Insights',
      related_link: '/portfolio-insights',
      is_dismissed: false
    }
  ];

  const { error } = await supabase
    .from('portfolio_suggestions')
    .insert(suggestions);

  if (error) {
    console.error('Error seeding portfolio suggestions:', error);
  }
}

/**
 * Checks if a user needs dashboard data seeding
 */
export async function needsDashboardSeeding(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('character_stats')
      .select('id')
      .eq('user_id', userId)
      .single();

    return !data;
  } catch {
    return true;
  }
}