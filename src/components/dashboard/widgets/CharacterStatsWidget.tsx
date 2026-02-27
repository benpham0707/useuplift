import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCharacterStats } from '@/hooks/useDashboard';
import { calculateStatTrend, getNextLevelThreshold } from '@/lib/types/dashboard';
import { TrendingUp, TrendingDown, Minus, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Character Stats Widget - RPG-style character profile with 5 key stats
 *
 * Displays narrative, impact, academics, curiosity, and network scores
 * with trend indicators, progress bars, and level/XP tracking.
 */
export default function CharacterStatsWidget() {
  const { stats, loading } = useCharacterStats();

  if (loading) {
    return <CharacterStatsWidgetSkeleton />;
  }

  if (!stats) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full text-muted-foreground">
          <p>Character stats loading...</p>
        </CardContent>
      </Card>
    );
  }

  const nextLevel = getNextLevelThreshold(stats.xp);
  const xpProgress = nextLevel
    ? ((stats.xp - (nextLevel.xpRequired - 100)) / 100) * 100
    : 100;

  const statItems = [
    {
      name: 'Narrative',
      current: stats.narrative_score,
      previous: stats.narrative_prev,
      hint: 'Tell your unique story with authenticity and depth',
      color: 'from-purple-500 to-blue-500'
    },
    {
      name: 'Impact',
      current: stats.impact_score,
      previous: stats.impact_prev,
      hint: 'Show how you make a difference in your community',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Academics',
      current: stats.academics_score,
      previous: stats.academics_prev,
      hint: 'Demonstrate intellectual curiosity and achievement',
      color: 'from-green-500 to-emerald-500'
    },
    {
      name: 'Curiosity',
      current: stats.curiosity_score,
      previous: stats.curiosity_prev,
      hint: 'Explore new ideas and pursue your passions',
      color: 'from-orange-500 to-yellow-500'
    },
    {
      name: 'Network',
      current: stats.network_score,
      previous: stats.network_prev,
      hint: 'Build meaningful connections and collaborations',
      color: 'from-pink-500 to-rose-500'
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Character Profile</CardTitle>
          </div>
          <Badge variant="secondary" className="font-medium">
            Level {stats.level} — {stats.title}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stat Rows */}
        <div className="space-y-3">
          {statItems.map((stat) => {
            const trend = calculateStatTrend(stat.current, stat.previous);

            return (
              <div
                key={stat.name}
                className="space-y-2 p-3 rounded-lg hover:bg-muted/30 transition-colors"
              >
                {/* Stat Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{stat.name}</span>
                    <TrendIndicator trend={trend} />
                  </div>
                  <span className="font-bold text-lg">{stat.current}</span>
                </div>

                {/* Progress Bar */}
                <div className="relative">
                  <Progress
                    value={stat.current}
                    className="h-2"
                  />
                  <div
                    className={cn(
                      "absolute inset-0 h-2 rounded-full opacity-50",
                      `bg-gradient-to-r ${stat.color}`
                    )}
                    style={{ width: `${stat.current}%` }}
                  />
                </div>

                {/* Hint Text */}
                <p className="text-xs text-muted-foreground">{stat.hint}</p>
              </div>
            );
          })}
        </div>

        {/* XP Progress Section */}
        {nextLevel && (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Experience</span>
              <span className="font-medium">
                {stats.xp} / {nextLevel.xpRequired} XP
              </span>
            </div>
            <Progress value={xpProgress} className="h-1.5" />
            <p className="text-xs text-muted-foreground text-center">
              {nextLevel.xpRequired - stats.xp} XP to Level {nextLevel.level}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Trend indicator component
 */
function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    case 'down':
      return <TrendingDown className="h-3 w-3 text-red-500" />;
    default:
      return <Minus className="h-3 w-3 text-gray-400" />;
  }
}

/**
 * Loading skeleton for Character Stats Widget
 */
function CharacterStatsWidgetSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2 p-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </div>
        <div className="pt-3 border-t space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-1.5 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}