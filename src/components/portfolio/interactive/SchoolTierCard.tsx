import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { CheckCircle, AlertCircle, Target, TrendingUp } from 'lucide-react';
import { SchoolTierData } from './types/portfolioTypes';

interface SchoolTierCardProps {
  tier: SchoolTierData;
  index: number;
}

const statusConfig = {
  strong: {
    icon: CheckCircle,
    color: 'from-green-500/20 to-emerald-500/20',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-600',
    badgeVariant: 'default' as const,
  },
  competitive: {
    icon: Target,
    color: 'from-amber-500/20 to-yellow-500/20',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-600',
    badgeVariant: 'secondary' as const,
  },
  challenging: {
    icon: AlertCircle,
    color: 'from-red-500/20 to-orange-500/20',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-600',
    badgeVariant: 'destructive' as const,
  },
};

export const SchoolTierCard: React.FC<SchoolTierCardProps> = ({ tier, index }) => {
  const config = statusConfig[tier.status];
  const StatusIcon = config.icon;
  const gapText = tier.gap > 0 ? `+${tier.gap}` : tier.gap;

  return (
    <div className={`bg-gradient-to-br ${config.color} backdrop-blur-sm border-2 ${config.borderColor} rounded-lg p-4 hover:shadow-lg transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-foreground mb-1">{tier.name}</h3>
          <p className="text-xs text-muted-foreground">
            {tier.schools.slice(0, 2).join(', ')}
            {tier.schools.length > 2 && ` +${tier.schools.length - 2} more`}
          </p>
        </div>
        <StatusIcon className={`w-5 h-5 ${config.textColor}`} />
      </div>

      {/* Score Comparison */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="text-center p-2 rounded-lg bg-background/50">
          <div className="text-xs text-muted-foreground mb-1">Your Score</div>
          <div className="text-xl font-bold text-foreground">{tier.yourScore}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-background/50">
          <div className="text-xs text-muted-foreground mb-1">Avg Admitted</div>
          <div className="text-xl font-bold text-foreground">{tier.avgAdmitScore}</div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <Badge variant={config.badgeVariant} className="capitalize text-xs">
          {tier.status}
        </Badge>
        <div className="text-xs">
          <span className="text-muted-foreground">Gap: </span>
          <span className={`font-bold ${tier.gap > 0 ? 'text-green-600' : tier.gap === 0 ? 'text-amber-600' : 'text-red-600'}`}>
            {gapText} pts
          </span>
        </div>
      </div>

      {/* Admission Probability */}
      <div className="mb-3 p-2 rounded-lg bg-background/50">
        <div className="text-xs text-muted-foreground mb-2">Admission Probability</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              style={{ width: `${tier.admissionProbability.max}%` }}
              className={`h-full bg-gradient-to-r ${tier.status === 'strong' ? 'from-green-500 to-emerald-500' : tier.status === 'competitive' ? 'from-amber-500 to-yellow-500' : 'from-red-500 to-orange-500'}`}
            />
          </div>
          <span className="text-xs font-bold text-foreground">
            {tier.admissionProbability.min}-{tier.admissionProbability.max}%
          </span>
        </div>
      </div>

      {/* Actions (if gap exists) */}
      {tier.actions && tier.actions.length > 0 && (
        <div className="space-y-1.5 pt-3 border-t">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-1">
            <TrendingUp className="w-3 h-3" />
            Quick Actions
          </div>
          {tier.actions.slice(0, 2).map((action, idx) => (
            <div key={idx} className="text-xs text-muted-foreground pl-5 relative">
              <span className="absolute left-1 top-1">•</span>
              {action}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
