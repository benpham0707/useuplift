import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { seedDashboardData, needsDashboardSeeding } from '@/lib/seedDashboardData';
import { useUserStreak } from '@/hooks/useDashboard';

// Import all widgets
import QuickActionsBar from '@/components/dashboard/widgets/QuickActionsBar';
import DailyQuestsWidget from '@/components/dashboard/widgets/DailyQuestsWidget';
import CharacterStatsWidget from '@/components/dashboard/widgets/CharacterStatsWidget';
import CalendarWidget from '@/components/dashboard/widgets/CalendarWidget';
import ActivityPortfolioWidget from '@/components/dashboard/widgets/ActivityPortfolioWidget';
import WritingPortfolioWidget from '@/components/dashboard/widgets/WritingPortfolioWidget';

/**
 * Dashboard Home - Main landing page for authenticated users
 *
 * Displays welcome header, user streak, and dashboard widgets in a responsive grid layout.
 * Seeds initial data on first visit.
 */
export default function DashboardHome() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const initializeDashboard = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Set user name
      setUserName(user.email?.split('@')[0] || 'there');

      // Check if dashboard needs seeding
      try {
        const needsSeeding = await needsDashboardSeeding(user.id);
        if (needsSeeding) {
          await seedDashboardData(user.id);
        }
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      }

      setLoading(false);
    };

    initializeDashboard();
  }, [user]);

  if (loading) {
    return <DashboardHomeSkeleton />;
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground mt-1">{currentDate}</p>
        </div>
        <StreakBadge />
      </div>

      {/* Main Grid Layout */}
      <div className="space-y-6">
        {/* Full-width Quick Actions Bar */}
        <QuickActionsBar />

        {/* Full-width Daily Quests */}
        <DailyQuestsWidget />

        {/* Two-column grid for remaining widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CharacterStatsWidget />
          <CalendarWidget />
          <ActivityPortfolioWidget />
          <WritingPortfolioWidget />
        </div>
      </div>
    </div>
  );
}

/**
 * Streak badge component - displays current streak with flame emoji
 */
function StreakBadge() {
  const { currentStreak } = useUserStreak();

  if (currentStreak === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
        <span className="text-sm text-muted-foreground">Start your streak!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-full border border-orange-500/20">
      <span className="text-xl">🔥</span>
      <span className="font-semibold text-orange-600">{currentStreak} day streak</span>
    </div>
  );
}

/**
 * Loading skeleton for Dashboard Home
 */
function DashboardHomeSkeleton() {
  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Grid skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}