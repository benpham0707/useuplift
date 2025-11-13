import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface MetricCardLargeProps {
  title: string;
  score: number;
  maxScore?: number;
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
}

// Score-based gradient styling
const getScoreGradient = (score: number) => {
  if (score >= 9.0) return 'from-purple-500 via-cyan-400 to-purple-500';
  if (score >= 7.5) return 'from-blue-500 via-indigo-500 to-blue-600';
  if (score >= 6.0) return 'from-yellow-500 via-orange-400 to-yellow-500';
  return 'from-red-500 via-orange-500 to-red-600';
};

const getScoreBorderGradient = (score: number) => {
  if (score >= 9.0) return 'from-purple-500/30 via-cyan-400/30 to-purple-500/30';
  if (score >= 7.5) return 'from-blue-500/30 via-indigo-500/30 to-blue-600/30';
  if (score >= 6.0) return 'from-yellow-500/30 via-orange-400/30 to-yellow-500/30';
  return 'from-red-500/30 via-orange-500/30 to-red-600/30';
};

export const MetricCardLarge: React.FC<MetricCardLargeProps> = ({
  title,
  score,
  maxScore = 10,
  icon: Icon,
  onClick,
  className,
}) => {
  const percentage = (score / maxScore) * 100;
  const gradientClass = getScoreGradient(score);
  const borderGradientClass = getScoreBorderGradient(score);

  return (
    <Card
      className={cn(
        'group relative overflow-hidden backdrop-blur-sm bg-background/60 border-2 cursor-pointer',
        'transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl',
        className
      )}
      onClick={onClick}
    >
      {/* Gradient border effect */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none',
        borderGradientClass
      )} />
      
      <CardContent className="relative z-10 p-5 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
              {title}
            </div>
            <div className={cn(
              'text-5xl font-bold bg-gradient-to-r bg-clip-text text-transparent',
              gradientClass
            )}>
              {score.toFixed(1)}
            </div>
          </div>
          <Icon className="h-6 w-6 text-muted-foreground opacity-60" />
        </div>

        <Progress value={percentage} className="h-2 mb-2" />
        
        <div className="text-xs text-muted-foreground">
          Tap to explore details
        </div>
      </CardContent>
    </Card>
  );
};
