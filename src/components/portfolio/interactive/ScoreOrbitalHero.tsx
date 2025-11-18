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
      {/* Multi-layer pulsing glow effects */}
      <motion.div
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full bg-primary/30 blur-3xl -z-20"
        style={{ willChange: 'opacity, transform' }}
      />
      <motion.div
        animate={{ 
          opacity: [0.2, 0.5, 0.2],
          scale: [1.2, 1, 1.2]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute inset-0 rounded-full bg-secondary/20 blur-3xl -z-20"
        style={{ willChange: 'opacity, transform' }}
      />
      <motion.div
        animate={{ 
          opacity: [0.1, 0.3, 0.1],
          scale: [1, 1.3, 1]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute inset-0 rounded-full bg-accent/20 blur-3xl -z-20"
        style={{ willChange: 'opacity, transform' }}
      />
      
      {/* Orbital Rings Container */}
      <div className="relative w-64 h-64 mx-auto">
        {/* Outer Ring - Enhanced glow */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-primary/60 shadow-[0_0_15px_rgba(147,51,234,0.5)]"
          style={{ willChange: 'transform' }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-[0_0_20px_rgba(147,51,234,0.8)]" />
        </motion.div>

        {/* Middle Ring - Enhanced glow */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-8 rounded-full border-2 border-secondary/60 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
          style={{ willChange: 'transform' }}
        >
          <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_20px_rgba(6,182,212,0.8)]" />
        </motion.div>

        {/* Inner Ring - Enhanced glow */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-16 rounded-full border-2 border-accent/60 shadow-[0_0_15px_rgba(192,38,211,0.5)]"
          style={{ willChange: 'transform' }}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-accent shadow-[0_0_20px_rgba(192,38,211,0.8)]" />
        </motion.div>

        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [-20, 20],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
            className="absolute w-1 h-1 rounded-full bg-primary/60 blur-sm"
            style={{
              left: `${(i * 12.5) + 10}%`,
              top: `${i % 2 === 0 ? '20%' : '80%'}`,
              willChange: 'transform, opacity'
            }}
          />
        ))}

        {/* Center Score Circle - Dark glass with intense glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-slate-900/90 backdrop-blur-md border-2 border-primary/50 shadow-[0_0_40px_rgba(147,51,234,0.4)] flex flex-col items-center justify-center">
              <div 
                className="text-6xl font-bold bg-gradient-to-r from-white via-primary to-secondary bg-clip-text text-transparent"
                style={{ textShadow: '0 0 30px rgba(147, 51, 234, 0.8)' }}
              >
                {animatedScore}
              </div>
              <div className="text-xs text-white/80 uppercase tracking-wider mt-1">
                Overall
              </div>
            </div>
            {/* Additional center glow */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-primary/30 blur-xl -z-10"
              style={{ willChange: 'opacity, transform' }}
            />
          </div>
        </div>
      </div>

      {/* Tier Badge & Percentile - Dark mode styling */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex items-center justify-center gap-3 mt-4"
      >
        <Badge 
          variant="default" 
          className="px-4 py-1.5 text-sm font-medium bg-slate-800/80 backdrop-blur-sm border-2 border-primary/40 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:scale-105 transition-transform"
        >
          {tier}
        </Badge>
        <span className="text-sm font-medium text-white/60">•</span>
        <span className="text-sm font-medium text-white font-semibold">{percentile}</span>
      </motion.div>
    </motion.div>
  );
};
