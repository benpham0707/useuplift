import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'motion/react';
import { TrendingUp, CheckCircle, Circle } from 'lucide-react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

interface TierProgressCardProps {
  progress: {
    currentTier: string;
    nextTier: string;
    progress: number;
    pointsNeeded: number;
    milestonesCompleted: number;
    milestonesTotal: number;
    milestones: Array<{
      text: string;
      completed: boolean;
    }>;
  };
}

export const TierProgressCard: React.FC<TierProgressCardProps> = ({ progress }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress.progress);
    }, 1000);

    return () => clearTimeout(timer);
  }, [progress.progress]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
    >
      <Card className="h-full depth-layer-3 hover:depth-layer-4 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Progress to {progress.nextTier}
              </h3>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.4 }}
              className="text-2xl font-bold text-primary"
            >
              {progress.progress}%
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="relative mb-6">
            <Progress 
              value={animatedProgress} 
              className="h-3"
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="text-xs text-muted-foreground mb-1">Points Needed</div>
              <div className="text-xl font-bold text-foreground">
                +{progress.pointsNeeded.toFixed(1)}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-secondary/5 to-secondary/10">
              <div className="text-xs text-muted-foreground mb-1">Milestones</div>
              <div className="text-xl font-bold text-foreground">
                {progress.milestonesCompleted}/{progress.milestonesTotal}
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-2">
            {progress.milestones.map((milestone, idx) => (
              <HoverCard key={idx}>
                <HoverCardTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.4 + idx * 0.1, duration: 0.3 }}
                    className="flex items-start gap-2 text-xs cursor-pointer hover:bg-muted/30 p-2 rounded-lg transition-colors group"
                  >
                    {milestone.completed ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.4 + idx * 0.1, type: "spring", stiffness: 200 }}
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      </motion.div>
                    ) : (
                      <Circle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5 group-hover:text-amber-600 transition-colors" />
                    )}
                    <span className={milestone.completed ? 'text-muted-foreground line-through' : 'text-foreground'}>
                      {milestone.text}
                    </span>
                  </motion.div>
                </HoverCardTrigger>
                <HoverCardContent className="w-64">
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      {milestone.completed ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 text-amber-500" />
                          In Progress
                        </>
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {milestone.completed 
                        ? 'This milestone has been successfully completed and contributes to your tier advancement.'
                        : 'Complete this milestone to move closer to your next tier.'}
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>

          <button className="w-full mt-6 text-primary text-sm font-medium hover:text-primary/80 transition-colors flex items-center justify-center gap-1 group">
            View all milestones
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
