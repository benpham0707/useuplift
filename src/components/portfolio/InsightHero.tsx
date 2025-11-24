import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface InsightHeroProps {
  icon: LucideIcon;
  headline: string;
  insight: string;
  action: {
    label: string;
    onClick: () => void;
  };
  colorClass: string;
  bgClass: string;
}

export const InsightHero: React.FC<InsightHeroProps> = ({
  icon: Icon,
  headline,
  insight,
  action,
  colorClass,
  bgClass,
}) => {
  return (
    <Card className="border-2 border-destructive/30 shadow-xl overflow-hidden bg-gradient-to-br from-background/95 via-background/90 to-pink-50/80 backdrop-blur-xl">
      <CardContent className="p-10 md:p-14 text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className={cn(
            'p-4 rounded-2xl',
            bgClass
          )}>
            <Icon className={cn('h-14 w-14 md:h-16 md:w-16', colorClass)} />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="inline-block">
            <span className="text-base md:text-lg font-bold uppercase tracking-wider text-destructive">
              Most Important Action
            </span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-extrabold text-foreground leading-tight">
            {headline}
          </h2>
          
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
            {insight}
          </p>
        </div>

        {/* Action */}
        <div className="pt-4">
          <Button
            onClick={action.onClick}
            size="lg"
            className="text-xl md:text-2xl px-10 md:px-12 py-7"
          >
            {action.label}
          </Button>
        </div>

        {/* Progress Indicator */}
        <p className="text-base text-muted-foreground pt-2">
          Critical insight 1 of 2
        </p>
      </CardContent>
    </Card>
  );
};
