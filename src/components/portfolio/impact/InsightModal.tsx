import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GuidanceInsight } from './StorytellingGuidance';
import { Lightbulb, TrendingUp, AlertCircle, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightModalProps {
  insight: GuidanceInsight | null;
  isOpen: boolean;
  onClose: () => void;
}

const typeConfig = {
  'strength': {
    icon: TrendingUp,
    label: 'Strength',
    color: 'text-green-500',
  },
  'opportunity': {
    icon: Lightbulb,
    label: 'Opportunity',
    color: 'text-yellow-500',
  },
  'consideration': {
    icon: AlertCircle,
    label: 'Consider',
    color: 'text-orange-500',
  },
  'strategy': {
    icon: Target,
    label: 'Strategy',
    color: 'text-blue-500',
  },
};

export const InsightModal: React.FC<InsightModalProps> = ({ insight, isOpen, onClose }) => {
  if (!insight) return null;

  const config = typeConfig[insight.type];
  const Icon = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Icon className={cn("w-6 h-6", config.color)} />
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                {config.label}
              </span>
              <DialogTitle className="text-xl">{insight.headline}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Details</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {insight.detail}
            </p>
          </div>

          {insight.actionable && (
            <div className="p-4 bg-primary/5 rounded-lg space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                ✨ Action Step
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {insight.actionable}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};