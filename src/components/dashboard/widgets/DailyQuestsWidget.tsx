import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useDailyQuests, useUserStreak } from '@/hooks/useDashboard';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Daily Quests Widget - Gamified task list with credit rewards
 *
 * Displays 5 daily quests with completion tracking, streak counter,
 * and credit rewards for completing 3+ quests.
 */
export default function DailyQuestsWidget() {
  const navigate = useNavigate();
  const { quests, completedCount, creditsEarned, loading, completeQuest } = useDailyQuests();
  const { currentStreak, loading: streakLoading } = useUserStreak();

  if (loading || streakLoading) {
    return <DailyQuestsWidgetSkeleton />;
  }

  const progressPercentage = (completedCount / 5) * 100;
  const hasEarnedCredits = completedCount >= 3;

  const handleQuestClick = (questId: string, route?: string) => {
    if (route) {
      navigate(route);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent, questId: string) => {
    e.stopPropagation();
    completeQuest(questId);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Daily Quests</CardTitle>

          <div className="flex items-center gap-4">
            {/* Streak Counter */}
            {currentStreak > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 rounded-full">
                <span className="text-lg">🔥</span>
                <span className="text-sm font-semibold text-orange-600">
                  {currentStreak} day{currentStreak !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Credit Reward Badge */}
            <Badge
              variant={hasEarnedCredits ? "default" : "secondary"}
              className={cn(
                "transition-all",
                hasEarnedCredits && "bg-green-600 hover:bg-green-700"
              )}
            >
              {hasEarnedCredits
                ? `✨ ${creditsEarned} credits earned!`
                : `Complete 3 → earn 10 credits`}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quest Items */}
        <div className="space-y-3">
          {quests.map((quest) => (
            <div
              key={quest.id}
              onClick={() => handleQuestClick(quest.id, quest.route)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-all cursor-pointer",
                "hover:bg-muted/50",
                quest.completed && "opacity-60"
              )}
            >
              {/* Custom Checkbox */}
              <div
                onClick={(e) => handleCheckboxClick(e, quest.id)}
                className="mt-0.5"
              >
                <Checkbox
                  checked={quest.completed}
                  className={cn(
                    "h-5 w-5 rounded-full border-2",
                    quest.completed
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-primary hover:border-primary/80"
                  )}
                />
              </div>

              {/* Quest Content */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "font-medium text-sm",
                    quest.completed && "line-through text-muted-foreground"
                  )}>
                    {quest.title}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {quest.tool}
                  </Badge>
                </div>
                <p className={cn(
                  "text-xs text-muted-foreground",
                  quest.completed && "line-through"
                )}>
                  {quest.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedCount}/5 completed
            </span>
            {hasEarnedCredits && (
              <span className="text-green-600 font-medium animate-pulse">
                Credits earned! 🎉
              </span>
            )}
          </div>
          <Progress
            value={progressPercentage}
            className={cn(
              "h-2 transition-all",
              hasEarnedCredits && "[&>div]:bg-green-500"
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for Daily Quests Widget
 */
function DailyQuestsWidgetSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 pt-2 border-t">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}