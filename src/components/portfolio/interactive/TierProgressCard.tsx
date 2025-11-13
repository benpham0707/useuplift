import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';

interface TierProgressCardProps {
  currentTier: string;
  nextTier: string;
  progress: number;
  pointsNeeded: number;
  className?: string;
}

export const TierProgressCard: React.FC<TierProgressCardProps> = ({
  currentTier,
  nextTier,
  progress,
  pointsNeeded,
  className,
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Tier Progress
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{currentTier}</span>
            <span className="font-bold text-primary">{nextTier}</span>
          </div>
          
          <Progress value={progress} className="h-3" />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress.toFixed(0)}% to next tier</span>
            <span>{pointsNeeded} points needed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
