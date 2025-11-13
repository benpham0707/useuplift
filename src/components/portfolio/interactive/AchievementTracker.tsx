import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Star, Award, Target, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

interface AchievementTrackerProps {
  achievements: Achievement[];
  className?: string;
}

const achievementIcons = [Trophy, Star, Award, Target, Sparkles];

export const AchievementTracker: React.FC<AchievementTrackerProps> = ({
  achievements,
  className,
}) => {
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Achievements
          </div>
          <div className="text-xs font-bold text-primary">
            {unlockedCount}/{totalCount}
          </div>
        </div>

        <TooltipProvider>
          <div className="flex gap-2 flex-wrap">
            {achievements.slice(0, 8).map((achievement, index) => {
              const Icon = achievementIcons[index % achievementIcons.length];
              return (
                <Tooltip key={achievement.id}>
                  <TooltipTrigger>
                    <div
                      className={cn(
                        'h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200',
                        achievement.unlocked
                          ? 'bg-primary/20 text-primary hover:scale-110'
                          : 'bg-muted text-muted-foreground opacity-40'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <div className="font-semibold">{achievement.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {achievement.description}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};
