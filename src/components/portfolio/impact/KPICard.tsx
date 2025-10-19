import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { KPI } from './KPIDashboard';
import { cn } from '@/lib/utils';

interface KPICardProps {
  kpi: KPI;
  onOpenModal: (kpi: KPI) => void;
}

export const KPICard: React.FC<KPICardProps> = ({ kpi, onOpenModal }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={isHovered}>
        <TooltipTrigger asChild>
          <Card
            className={cn(
              "border-primary/20 cursor-pointer transition-all duration-200",
              isHovered && "border-primary/40 shadow-lg -translate-y-1"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onOpenModal(kpi)}
          >
            <CardContent className="p-6 space-y-2">
              <div className="text-4xl md:text-5xl font-extrabold text-primary">
                {kpi.value}
              </div>
              <div className="text-sm font-semibold text-foreground uppercase tracking-wide">
                {kpi.label}
              </div>
              {kpi.trend && (
                <div className="flex items-center gap-2 text-sm">
                  {getTrendIcon(kpi.trend.direction)}
                  <span className="text-muted-foreground">{kpi.trend.change}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold">{kpi.label}</p>
            <p className="text-xs text-muted-foreground">{kpi.context}</p>
            <p className="text-xs text-primary">Click for full details</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};