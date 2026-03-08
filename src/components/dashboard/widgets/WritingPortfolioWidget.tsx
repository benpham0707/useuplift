import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWritingProgress } from '@/hooks/useDashboard';
import { PenLine, TrendingUp, TrendingDown, Minus, ArrowRight, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatTrend } from '@/lib/types/dashboard';

/**
 * Writing Portfolio Widget - Writing progress and gap analysis
 *
 * Displays current writing score vs target with a visual gap meter,
 * trend indicator, and CTA to continue workshop.
 */
export default function WritingPortfolioWidget() {
  const navigate = useNavigate();
  const { progress, loading } = useWritingProgress();

  if (loading) {
    return <WritingPortfolioWidgetSkeleton />;
  }

  // No writing score yet
  if (!progress) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-primary" />
            <CardTitle>Writing Progress</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <PenLine className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Start your writing journey
            </p>
            <p className="text-xs text-muted-foreground">
              Complete a workshop to get your writing score
            </p>
          </div>
          <Button
            onClick={() => navigate('/dashboard/workshop')}
            size="sm"
            className="mt-2"
          >
            Start Workshop
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: StatTrend) => {
    switch (trend) {
      case StatTrend.Up:
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case StatTrend.Down:
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendText = (trend: StatTrend) => {
    switch (trend) {
      case StatTrend.Up:
        return 'Improving';
      case StatTrend.Down:
        return 'Needs attention';
      default:
        return 'Stable';
    }
  };

  const getTrendColor = (trend: StatTrend) => {
    switch (trend) {
      case StatTrend.Up:
        return 'text-green-600';
      case StatTrend.Down:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Calculate percentages for the visual meter
  const maxScore = 10;
  const currentPercentage = (progress.current_score / maxScore) * 100;
  const targetPercentage = (progress.target_score / maxScore) * 100;
  const gapPercentage = targetPercentage - currentPercentage;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-primary" />
            <CardTitle>Writing Progress</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon(progress.trend)}
            <span className={cn("text-sm font-medium", getTrendColor(progress.trend))}>
              {getTrendText(progress.trend)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Visual Gap Meter */}
        <div className="space-y-3">
          <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
            {/* Full background bar */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200" />

            {/* Current score bar */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${currentPercentage}%` }}
            />

            {/* Gap indicator */}
            {gapPercentage > 0 && (
              <div
                className="absolute top-0 bottom-0 bg-amber-500/20 border-l-2 border-amber-500 border-dashed"
                style={{
                  left: `${currentPercentage}%`,
                  width: `${gapPercentage}%`
                }}
              />
            )}

            {/* Score markers */}
            <div
              className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center bg-white shadow-sm rounded-full h-8 w-8 border-2 border-blue-500"
              style={{ left: `calc(${currentPercentage}% - 16px)` }}
            >
              <span className="text-xs font-bold">{progress.current_score.toFixed(1)}</span>
            </div>

            <div
              className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center bg-white shadow-sm rounded-full h-6 w-6 border-2 border-amber-500"
              style={{ left: `calc(${targetPercentage}% - 12px)` }}
            >
              <Target className="h-3 w-3 text-amber-600" />
            </div>
          </div>

          {/* Score Labels */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Your Score</p>
              <p className="text-lg font-bold text-blue-600">
                {progress.current_score.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gap</p>
              <p className="text-lg font-bold text-amber-600">
                {progress.gap.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="text-lg font-bold text-green-600">
                {progress.target_score.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="space-y-2">
          {progress.gap > 0 ? (
            <Badge variant="secondary" className="w-full justify-center py-1">
              {progress.gap <= 1
                ? "You're so close! Keep pushing! 🎯"
                : progress.gap <= 2
                ? "Great progress! Bridge that gap! 💪"
                : "Every workshop brings you closer! 📈"}
            </Badge>
          ) : (
            <Badge className="w-full justify-center py-1 bg-green-600 hover:bg-green-700">
              Target achieved! Keep refining! 🌟
            </Badge>
          )}
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => navigate('/dashboard/workshop')}
          className="w-full"
          size="lg"
        >
          Continue Workshop
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for Writing Portfolio Widget
 */
function WritingPortfolioWidgetSkeleton() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-36" />
          </div>
          <Skeleton className="h-5 w-24" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </div>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}