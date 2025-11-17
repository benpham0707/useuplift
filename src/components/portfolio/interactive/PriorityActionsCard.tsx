import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { Lightbulb, Flame, Zap, CheckCircle } from 'lucide-react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

interface PriorityAction {
  title: string;
  dimension: string;
  priority: 'high' | 'medium' | 'low';
  impact: number;
  effort: 'high' | 'medium' | 'low';
}

interface PriorityActionsCardProps {
  actions: PriorityAction[];
}

const priorityConfig = {
  high: {
    bg: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20',
    border: 'border-red-200 dark:border-red-800',
    badge: 'destructive',
    accentBorder: 'border-l-4 border-l-red-500',
  },
  medium: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20',
    border: 'border-amber-200 dark:border-amber-800',
    badge: 'outline',
    accentBorder: 'border-l-4 border-l-amber-500',
  },
  low: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
    border: 'border-green-200 dark:border-green-800',
    badge: 'outline',
    accentBorder: 'border-l-4 border-l-green-500',
  },
};

const effortIcon = {
  high: Flame,
  medium: Zap,
  low: CheckCircle,
};

export const PriorityActionsCard: React.FC<PriorityActionsCardProps> = ({ actions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
    >
      <Card className="h-full depth-layer-3 hover:depth-layer-4 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Your Next Steps
            </h3>
          </div>

          <div className="space-y-3">
            {actions.map((action, idx) => {
              const config = priorityConfig[action.priority];
              const EffortIcon = effortIcon[action.effort];
              const isPulse = action.priority === 'high';

              return (
                <HoverCard key={idx}>
                  <HoverCardTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 + idx * 0.1, duration: 0.4 }}
                      className={`relative p-4 rounded-xl border ${config.bg} ${config.border} ${config.accentBorder} cursor-pointer group hover:scale-[1.02] transition-all duration-300`}
                    >
                      {isPulse && (
                        <motion.div
                          animate={{ scale: [1, 1.02, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 rounded-xl bg-red-500/5"
                        />
                      )}

                      <div className="relative flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <div className="text-sm font-bold text-foreground mb-1">
                                {action.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {action.dimension}
                              </div>
                            </div>
                            <Badge 
                              variant={config.badge as any}
                              className={`text-xs flex-shrink-0 ${
                                action.priority === 'high' 
                                  ? '' 
                                  : action.priority === 'medium' 
                                  ? 'border-amber-500 text-amber-700 dark:text-amber-400' 
                                  : 'border-green-500 text-green-700 dark:text-green-400'
                              }`}
                            >
                              {action.priority}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1 text-primary font-bold">
                              <span>+{action.impact.toFixed(1)} pts</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <EffortIcon className="w-3 h-3" />
                              <span className="capitalize">{action.effort} effort</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-bold text-sm mb-1">{action.title}</h4>
                        <Badge variant={config.badge as any} className="text-xs">
                          {action.priority} priority
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-2">
                        <p>
                          <span className="font-bold text-foreground">Impact:</span> This action could add{' '}
                          <span className="font-bold text-primary">+{action.impact.toFixed(1)} points</span> to your {action.dimension.toLowerCase()} score.
                        </p>
                        <p>
                          <span className="font-bold text-foreground">Effort:</span> Requires{' '}
                          <span className="capitalize font-bold">{action.effort}</span> level commitment and resources.
                        </p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })}
          </div>

          <button className="w-full mt-6 text-primary text-sm font-medium hover:text-primary/80 transition-colors flex items-center justify-center gap-1 group">
            Expand for detailed roadmap
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
