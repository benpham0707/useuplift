import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';

interface ScoreOrbitalHeroProps {
  score: number;
  tier: string;
  percentile: string;
}

export const ScoreOrbitalHero: React.FC<ScoreOrbitalHeroProps> = ({
  score,
  tier,
  percentile,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score counting on mount
  useEffect(() => {
    let start = 0;
    const end = score;
    const duration = 2000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedScore(end);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [score]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-md mx-auto"
    >
      {/* Radial Gradient Background */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent rounded-full blur-3xl" />
      
      {/* Orbital Rings Container */}
      <div className="relative w-64 h-64 mx-auto">
        {/* Outer Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-primary/20"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50" />
        </motion.div>

        {/* Middle Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-8 rounded-full border-2 border-secondary/30"
        >
          <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-secondary shadow-lg shadow-secondary/50" />
        </motion.div>

        {/* Inner Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-16 rounded-full border-2 border-accent/40"
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-accent shadow-lg shadow-accent/50" />
        </motion.div>

        {/* Center Score Circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur-sm border-2 border-primary/30 flex flex-col items-center justify-center depth-layer-3">
              <div className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {animatedScore}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                Overall
              </div>
            </div>
            {/* Glow effect */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-primary/20 blur-xl -z-10"
            />
          </div>
        </div>
      </div>

      {/* Tier Badge & Percentile */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex items-center justify-center gap-3 mt-4"
      >
        <Badge 
          variant="default" 
          className="px-4 py-1.5 text-sm font-medium bg-gradient-to-r from-primary to-secondary text-white border-0 hover:scale-105 transition-transform"
        >
          {tier}
        </Badge>
        <span className="text-sm font-medium text-muted-foreground">•</span>
        <span className="text-sm font-medium text-foreground">{percentile}</span>
      </motion.div>
    </motion.div>
  );
};
