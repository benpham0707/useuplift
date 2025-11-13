import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatPillProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  colorClass?: string;
  className?: string;
}

export const StatPill: React.FC<StatPillProps> = ({
  icon: Icon,
  value,
  label,
  colorClass = 'bg-muted',
  className,
}) => {
  return (
    <Card className={cn('backdrop-blur-sm bg-background/60', className)}>
      <CardContent className={cn('p-3 text-center', colorClass)}>
        <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
        <div className="text-xl font-bold text-foreground mb-0.5">
          {value}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </div>
      </CardContent>
    </Card>
  );
};
