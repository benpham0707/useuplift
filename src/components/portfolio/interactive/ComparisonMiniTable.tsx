import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SchoolComparison {
  tier: string;
  avgScore: number;
  difference: number;
}

interface ComparisonMiniTableProps {
  comparisons: SchoolComparison[];
  className?: string;
}

export const ComparisonMiniTable: React.FC<ComparisonMiniTableProps> = ({
  comparisons,
  className,
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
          vs. Admitted Students
        </div>

        <div className="space-y-2">
          {comparisons.map((comp) => {
            const isPositive = comp.difference > 0;
            const isNeutral = comp.difference === 0;
            
            return (
              <div
                key={comp.tier}
                className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0"
              >
                <span className="text-muted-foreground text-xs">{comp.tier}</span>
                <div className="flex items-center gap-1">
                  {isNeutral ? (
                    <Minus className="h-3 w-3 text-muted-foreground" />
                  ) : isPositive ? (
                    <ArrowUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-600" />
                  )}
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      isNeutral && 'text-muted-foreground',
                      isPositive && 'text-green-600',
                      !isPositive && !isNeutral && 'text-red-600'
                    )}
                  >
                    {isPositive ? '+' : ''}{comp.difference.toFixed(1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
