import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface RecognitionScoreBadgeProps {
  score: number;
  label: string;
  breakdown?: { label: string; value: number }[];
  className?: string;
}

const getScoreColor = (score: number) => {
  if (score >= 9.0) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
  if (score >= 7.5) return { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' };
  if (score >= 6.0) return { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
  if (score >= 4.0) return { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
  return { text: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border' };
};

export const RecognitionScoreBadge: React.FC<RecognitionScoreBadgeProps> = ({ 
  score, 
  label, 
  breakdown,
  className 
}) => {
  const colors = getScoreColor(score);
  
  const badge = (
    <div className={cn(
      'inline-flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border transition-colors',
      colors.bg,
      colors.border,
      className
    )}>
      <div className={cn('text-xs font-medium text-muted-foreground')}>
        {label}
      </div>
      <div className={cn('text-lg font-bold', colors.text)}>
        {score.toFixed(1)}
      </div>
    </div>
  );

  if (!breakdown || breakdown.length === 0) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1.5">
            <div className="font-semibold text-sm">{label} Breakdown</div>
            {breakdown.map((item, idx) => (
              <div key={idx} className="flex justify-between gap-3 text-xs">
                <span className="text-muted-foreground">{item.label}:</span>
                <span className="font-medium">{item.value.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
