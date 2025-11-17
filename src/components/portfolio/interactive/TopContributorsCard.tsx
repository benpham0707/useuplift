import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'motion/react';
import { Users, Heart, Award, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

interface Contributor {
  name: string;
  dimension: string;
  score: number;
  color: string;
  icon: 'Users' | 'Heart' | 'Award' | 'Sparkles';
}

interface TopContributorsCardProps {
  contributors: Contributor[];
}

const iconMap = {
  Users,
  Heart,
  Award,
  Sparkles,
};

export const TopContributorsCard: React.FC<TopContributorsCardProps> = ({
  contributors,
}) => {
  const maxScore = Math.max(...contributors.map((c) => c.score));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <Card className="h-full depth-layer-3 hover:depth-layer-4 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              What's Driving Your Score
            </h3>
          </div>

          <div className="space-y-4">
            {contributors.map((contributor, idx) => {
              const Icon = iconMap[contributor.icon];
              const percentage = (contributor.score / maxScore) * 100;
              
              return (
                <HoverCard key={idx}>
                  <HoverCardTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + idx * 0.1, duration: 0.4 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-background to-muted/30 border border-border hover:border-primary/50 transition-all duration-300 cursor-pointer group hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-4">
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 5 }}
                          className={`w-12 h-12 rounded-full bg-gradient-to-br from-${contributor.color}-500 to-${contributor.color}-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-${contributor.color}-500/50 transition-shadow`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </motion.div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2 mb-2">
                            <div>
                              <div className="text-sm font-bold text-foreground truncate">
                                {contributor.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {contributor.dimension}
                              </div>
                            </div>
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.8 + idx * 0.1, duration: 0.3 }}
                              className={`text-lg font-bold text-${contributor.color}-600 dark:text-${contributor.color}-400 flex-shrink-0`}
                            >
                              +{contributor.score}
                            </motion.div>
                          </div>
                          
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ delay: 0.8 + idx * 0.1, duration: 0.8 }}
                          >
                            <Progress 
                              value={percentage} 
                              className={`h-2 [&>div]:bg-gradient-to-r [&>div]:from-${contributor.color}-500 [&>div]:to-${contributor.color}-600`}
                            />
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-72">
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm flex items-center gap-2">
                        <Icon className={`w-4 h-4 text-${contributor.color}-500`} />
                        {contributor.name}
                      </h4>
                      <div className="text-xs text-muted-foreground">
                        <p className="mb-2">
                          This {contributor.dimension.toLowerCase()} contribution adds{' '}
                          <span className="font-bold text-foreground">+{contributor.score} points</span> to your overall score.
                        </p>
                        <p>
                          It represents {percentage.toFixed(0)}% of your top driving factors.
                        </p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })}
          </div>

          <button className="w-full mt-6 text-primary text-sm font-medium hover:text-primary/80 transition-colors flex items-center justify-center gap-1 group">
            See all contributors
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
