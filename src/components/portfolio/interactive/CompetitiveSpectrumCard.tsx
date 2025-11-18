import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'motion/react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { MapPin } from 'lucide-react';
import GradientText from '@/components/ui/GradientText';

interface CompetitiveSpectrumCardProps {
  userScore: number;
  userPercentile: string;
  schoolTiers: Array<{
    name: string;
    score: number;
    type: 'safety' | 'target' | 'reach';
    color: string;
  }>;
}

export const CompetitiveSpectrumCard: React.FC<CompetitiveSpectrumCardProps> = ({
  userScore,
  userPercentile,
  schoolTiers,
}) => {
  // Calculate position percentage (7.0 to 9.0 scale)
  const minScore = 7.0;
  const maxScore = 9.0;
  const userPosition = ((userScore - minScore) / (maxScore - minScore)) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <Card className="h-full bg-white/80 backdrop-blur-md border-2 border-[#07c6ff]/40 shadow-lg shadow-cyan-400/30 hover:border-[#07c6ff]/60 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-1 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 md:gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#07c6ff] to-[#c137ff] flex items-center justify-center shadow-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <GradientText
              className="text-base md:text-lg font-extrabold uppercase tracking-wide"
              colors={["#07c6ff", "#00ffaa", "#8b5cf6", "#c137ff"]}
            >
              WHERE YOU STAND
            </GradientText>
          </div>

          {/* Spectrum Bar */}
          <div className="relative h-20 mb-8">
            {/* Background Gradient Bar */}
            <div className="absolute inset-x-0 top-8 h-3 bg-gradient-to-r from-green-500 via-amber-400 to-red-500 rounded-full border border-white/30" />
            
            {/* School Markers */}
            {schoolTiers.map((school, idx) => {
              const position = ((school.score - minScore) / (maxScore - minScore)) * 100;
              return (
                <HoverCard key={idx}>
                  <HoverCardTrigger asChild>
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5 + idx * 0.1, duration: 0.3 }}
                      className="absolute top-7 cursor-pointer group"
                      style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className={`w-4 h-4 rounded-full bg-${school.color}-500 border-2 border-white shadow-lg group-hover:scale-125 transition-transform`} />
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {school.score.toFixed(1)}
                      </div>
                    </motion.div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64">
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm">{school.name}</h4>
                      <div className="text-xs text-muted-foreground">
                        <p>Average Admit Score: <span className="font-bold text-foreground">{school.score.toFixed(1)}</span></p>
                        <p className="capitalize mt-1">
                          <span className={`inline-block w-2 h-2 rounded-full bg-${school.color}-500 mr-1`} />
                          {school.type} school for you
                        </p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })}

            {/* Your Position - Animated Marker */}
            <HoverCard>
              <HoverCardTrigger asChild>
                <motion.div
                  initial={{ scale: 0, opacity: 0, x: 0 }}
                  animate={{ scale: 1, opacity: 1, x: `${userPosition}%` }}
                  transition={{ delay: 0.8, duration: 1, type: "spring", stiffness: 100 }}
                  className="absolute top-6 left-0 -translate-x-1/2 cursor-pointer group"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-6 h-6 rounded-full bg-primary border-4 border-white shadow-xl relative"
                  >
                    {/* Pulsing glow */}
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full bg-primary blur-md -z-10"
                    />
                  </motion.div>
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <div className="text-xs font-bold text-primary group-hover:scale-110 transition-transform">
                      You: {userScore.toFixed(1)}
                    </div>
                  </div>
                </motion.div>
              </HoverCardTrigger>
              <HoverCardContent className="w-56">
                <div className="space-y-2">
                  <h4 className="font-bold text-sm">Your Position</h4>
                  <div className="text-xs text-muted-foreground">
                    <p>Overall Score: <span className="font-bold text-primary text-base">{userScore.toFixed(1)}</span></p>
                    <p>Percentile: <span className="font-bold text-foreground">{userPercentile}</span></p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>

          {/* Tier Status Legend */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center group cursor-pointer hover:scale-105 transition-transform">
              <div className="w-3 h-3 rounded-full bg-green-500 mx-auto mb-2 shadow-lg group-hover:shadow-green-500/50" />
              <div className="text-xs font-bold text-green-600 dark:text-green-400">Safety</div>
              <div className="text-xs text-muted-foreground">Strong fit</div>
            </div>
            <div className="text-center group cursor-pointer hover:scale-105 transition-transform">
              <div className="w-3 h-3 rounded-full bg-amber-500 mx-auto mb-2 shadow-lg group-hover:shadow-amber-500/50" />
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400">Target</div>
              <div className="text-xs text-muted-foreground">Competitive</div>
            </div>
            <div className="text-center group cursor-pointer hover:scale-105 transition-transform">
              <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-2 shadow-lg group-hover:shadow-red-500/50" />
              <div className="text-xs font-bold text-red-600 dark:text-red-400">Reach</div>
              <div className="text-xs text-muted-foreground">Need +0.7</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
