import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NavigationVariant = 'default' | 'purple';

interface NavigationControlsProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
  variant?: NavigationVariant;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  current,
  total,
  onPrev,
  onNext,
  className = '',
  variant = 'default'
}) => {
  const isPurple = variant === 'purple';

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1',
        isPurple 
          ? 'rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800'
          : 'rounded-md border border-border/50 px-1 py-0.5',
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrev}
        disabled={current === 0}
        className={cn(
          'h-5 w-5',
          isPurple 
            ? 'text-purple-900 dark:text-purple-100 hover:bg-purple-100 dark:hover:bg-purple-900/30 disabled:text-purple-400' 
            : 'hover:bg-accent/50'
        )}
      >
        <ChevronLeft className="h-3 w-3" />
      </Button>
      <span 
        className={cn(
          'text-[10px] px-1 min-w-[2.5rem] text-center font-medium',
          isPurple ? 'text-purple-900 dark:text-purple-100' : 'text-muted-foreground'
        )}
      >
        {current + 1} of {total}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={current === total - 1}
        className={cn(
          'h-5 w-5',
          isPurple 
            ? 'text-purple-900 dark:text-purple-100 hover:bg-purple-100 dark:hover:bg-purple-900/30 disabled:text-purple-400' 
            : 'hover:bg-accent/50'
        )}
      >
        <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
};
