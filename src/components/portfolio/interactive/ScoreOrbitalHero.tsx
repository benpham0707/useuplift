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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative w-full h-[400px] flex items-center justify-center bg-white/70 backdrop-blur-xl rounded-3xl overflow-hidden border-2 border-white/50 shadow-[0_20px_60px_-15px_rgba(147,51,234,0.3)] hover:shadow-[0_25px_70px_-15px_rgba(147,51,234,0.4)] hover:-translate-y-1 transition-all duration-300"
      style={{ willChange: 'opacity, transform' }}
    >
      {/* Multi-layer pulsing glow effects */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute w-72 h-72 rounded-full bg-gradient-radial from-purple-500/50 via-purple-400/30 to-transparent blur-3xl"
        style={{ willChange: 'opacity, transform' }}
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
        className="absolute w-96 h-96 rounded-full bg-gradient-radial from-cyan-400/40 via-blue-400/25 to-transparent blur-3xl"
        style={{ willChange: 'opacity, transform' }}
      />
      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.25, 0.4, 0.25],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute w-[500px] h-[500px] rounded-full bg-gradient-radial from-pink-400/35 via-rose-400/20 to-transparent blur-3xl"
        style={{ willChange: 'opacity, transform' }}
      />
      
      {/* Orbital Rings Container */}
      <div className="relative w-64 h-64 mx-auto">
        {/* Outer Ring - Enhanced glow */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-purple-400/60 shadow-lg shadow-purple-400/40"
          style={{ willChange: 'transform' }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
        </motion.div>

        {/* Middle Ring - Enhanced glow */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-8 rounded-full border-2 border-cyan-400/55 shadow-lg shadow-cyan-400/40"
          style={{ willChange: 'transform' }}
        >
          <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
        </motion.div>

        {/* Inner Ring - Enhanced glow */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-16 rounded-full border-2 border-pink-400/50 shadow-lg shadow-pink-400/40"
          style={{ willChange: 'transform' }}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.8)]" />
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

        {/* Central score display */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <div className="relative mb-4">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-purple-400 via-cyan-400 to-pink-400 blur-2xl opacity-60"
            />
            <div className="relative text-8xl font-black bg-gradient-to-r from-purple-600 via-cyan-600 to-pink-600 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.9)]" style={{ textShadow: '0 0 40px rgba(168,85,247,0.7), 0 0 60px rgba(34,211,238,0.5)' }}>
              {animatedScore}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="px-4 py-1.5 text-sm font-bold bg-primary text-primary-foreground border-0 shadow-lg shadow-primary/30">
              {tier}
            </Badge>
            <span className="text-base font-semibold text-foreground">
              {percentile}
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
