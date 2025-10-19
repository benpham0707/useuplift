import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, TrendingUp, AlertCircle, Target } from 'lucide-react';
import { GuidanceInsight } from './StorytellingGuidance';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  insight: GuidanceInsight;
  onExpand: (insight: GuidanceInsight) => void;
}

const typeConfig = {
  'strength': {
    icon: TrendingUp,
    label: 'Strength',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
  'opportunity': {
    icon: Lightbulb,
    label: 'Opportunity',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
  },
  'consideration': {
    icon: AlertCircle,
    label: 'Consider',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
  },
  'strategy': {
    icon: Target,
    label: 'Strategy',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
};

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onExpand }) => {
  const [isHovered, setIsHovered] = useState(false);
  const config = typeConfig[insight.type];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 border-2",
        config.bgColor,
        config.borderColor,
        isHovered && "shadow-lg -translate-y-1"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onExpand(insight)}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-5 h-5", config.color)} />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {config.label}
          </span>
        </div>
        <h3 className="font-semibold text-foreground leading-snug line-clamp-2">
          {insight.headline}
        </h3>
        {isHovered && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {insight.detail}
          </p>
        )}
        <p className="text-xs text-primary">Click to expand</p>
      </CardContent>
    </Card>
  );
};