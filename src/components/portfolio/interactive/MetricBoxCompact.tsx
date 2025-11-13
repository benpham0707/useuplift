import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricBoxCompactProps {
  title: string;
  score: number;
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
}

const getScoreColor = (score: number) => {
  if (score >= 9.0) return 'text-purple-600 dark:text-purple-400';
  if (score >= 7.5) return 'text-blue-600 dark:text-blue-400';
  if (score >= 6.0) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

const getBorderColor = (score: number) => {
  if (score >= 9.0) return 'border-purple-500/30';
  if (score >= 7.5) return 'border-blue-500/30';
  if (score >= 6.0) return 'border-yellow-500/30';
  return 'border-red-500/30';
};

export const MetricBoxCompact: React.FC<MetricBoxCompactProps> = ({
  title,
  score,
  icon: Icon,
  onClick,
  className,
}) => {
  return (
    <Card
      className={cn(
        'cursor-pointer backdrop-blur-sm bg-background/60 border-2 transition-all duration-200',
        'hover:scale-105 hover:shadow-lg',
        getBorderColor(score),
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 text-center">
        {Icon && <Icon className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />}
        <div className={cn('text-3xl font-bold mb-1', getScoreColor(score))}>
          {score.toFixed(1)}
        </div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          {title}
        </div>
      </CardContent>
    </Card>
  );
};
