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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Card className={`h-full bg-gradient-to-br ${config.color} backdrop-blur-sm border-2 ${config.borderColor} hover:shadow-xl transition-all duration-300`}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">{tier.name}</h3>
              <p className="text-xs text-muted-foreground">
                {tier.schools.slice(0, 3).join(', ')}
                {tier.schools.length > 3 && ` +${tier.schools.length - 3} more`}
              </p>
            </div>
            <StatusIcon className={`w-6 h-6 ${config.textColor}`} />
          </div>

          {/* Score Comparison */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-background/50">
              <div className="text-xs text-muted-foreground mb-1">Your Score</div>
              <div className="text-2xl font-bold text-foreground">{tier.yourScore}</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <div className="text-xs text-muted-foreground mb-1">Avg Admitted</div>
              <div className="text-2xl font-bold text-foreground">{tier.avgAdmitScore}</div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between mb-4">
            <Badge variant={config.badgeVariant} className="capitalize">
              {tier.status}
            </Badge>
            <div className="text-sm">
              <span className="text-muted-foreground">Gap: </span>
              <span className={`font-bold ${tier.gap > 0 ? 'text-green-600' : tier.gap === 0 ? 'text-amber-600' : 'text-red-600'}`}>
                {gapText} pts
              </span>
            </div>
          </div>

          {/* Admission Probability */}
          <div className="mb-4 p-3 rounded-lg bg-background/50">
            <div className="text-xs text-muted-foreground mb-2">Admission Probability</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${tier.admissionProbability.max}%` }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                  className={`h-full bg-gradient-to-r ${tier.status === 'strong' ? 'from-green-500 to-emerald-500' : tier.status === 'competitive' ? 'from-amber-500 to-yellow-500' : 'from-red-500 to-orange-500'}`}
                />
              </div>
              <span className="text-sm font-bold text-foreground">
                {tier.admissionProbability.min}-{tier.admissionProbability.max}%
              </span>
            </div>
          </div>

          {/* Actions (if gap exists) */}
          {tier.actions && tier.actions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-2">
                <TrendingUp className="w-4 h-4" />
                Quick Actions to Bridge Gap
              </div>
              {tier.actions.slice(0, 2).map((action, idx) => (
                <div key={idx} className="text-xs text-muted-foreground pl-6 relative">
                  <span className="absolute left-2 top-1">•</span>
                  {action}
                </div>
              ))}
              {tier.actions.length > 2 && (
                <button className="text-xs text-primary hover:text-primary/80 font-medium pl-6">
                  View {tier.actions.length - 2} more actions →
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
