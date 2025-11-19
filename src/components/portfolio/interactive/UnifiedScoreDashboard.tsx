import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GraduationCap, Brain, BookOpen, TrendingUp, Trophy, Clock, Target, Award } from 'lucide-react';

interface AcademicMetrics {
  gpa: { weighted: number; unweighted: number };
  sat?: number;
  act?: number;
  apScores: { total: number; average: number; fives: number };
  classRank: { percentage: number; outOf: number; rank: number };
  activities: number;
  hours: number;
  impactReach: string;
  awards: number;
}

interface CompetitiveAnalysis {
  percentile: string;
  context: string;
  schoolTiers?: Array<{ tier: string; status: string; label: string }>;
  schoolExamples?: Array<{ name: string; range: string; status: string }>;
  tip: string;
}

interface UnifiedScoreDashboardProps {
  score: number;
  tier: string;
  percentile: string;
  metrics: AcademicMetrics;
  competitiveAnalysis: Record<string, CompetitiveAnalysis>;
}

export const UnifiedScoreDashboard: React.FC<UnifiedScoreDashboardProps> = ({
  score,
  tier,
  percentile,
  metrics,
  competitiveAnalysis
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score counting
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const metricCards = [
    {
      id: 'gpa',
      icon: GraduationCap,
      value: `${metrics.gpa.weighted.toFixed(2)}`,
      subValue: `UW: ${metrics.gpa.unweighted.toFixed(2)}`,
      label: 'GPA (Weighted)'
    },
    {
      id: 'sat',
      icon: Brain,
      value: metrics.sat ? `${metrics.sat}` : metrics.act ? `${metrics.act} ACT` : 'N/A',
      subValue: metrics.sat ? 'SAT' : 'ACT',
      label: 'Test Score'
    },
    {
      id: 'apScores',
      icon: BookOpen,
      value: `${metrics.apScores.total} APs`,
      subValue: `Avg: ${metrics.apScores.average.toFixed(1)} • ${metrics.apScores.fives} 5s`,
      label: 'AP/IB Scores'
    },
    {
      id: 'classRank',
      icon: TrendingUp,
      value: `Top ${metrics.classRank.percentage}%`,
      subValue: `${metrics.classRank.rank} / ${metrics.classRank.outOf}`,
      label: 'Class Rank'
    }
  ];

  const getStatusIcon = (status: string) => {
    if (status === 'competitive' || status === 'within' || status === 'strong') return '✓';
    if (status === 'average' || status === 'above') return '○';
    return '⚠';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/98 backdrop-blur-xl rounded-2xl border-2 border-border shadow-xl overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-6 p-6">
        {/* Left Side - Overall Score */}
        <div className="flex flex-col items-center justify-center space-y-4 p-6 relative">
          {/* Pulsing background glow */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-purple-400/10 to-cyan-400/10 rounded-lg blur-xl"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Orbital Rings */}
          <div className="relative">
            {[1, 2, 3].map((ring) => (
              <motion.div
                key={ring}
                className="absolute inset-0 rounded-full border-2 border-cyan-400/20"
                style={{
                  width: `${140 + ring * 30}px`,
                  height: `${140 + ring * 30}px`,
                  left: `${-15 * ring}px`,
                  top: `${-15 * ring}px`,
                }}
                animate={{
                  rotate: ring % 2 === 0 ? 360 : -360,
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 15 + ring * 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            ))}

            {/* Score Circle */}
            <motion.div
              className="relative z-10 w-[140px] h-[140px] rounded-full bg-gradient-to-br from-cyan-400 via-purple-400 to-cyan-500 p-1 shadow-[0_0_40px_rgba(7,198,255,0.4)]"
              animate={{
                boxShadow: [
                  '0 0 40px rgba(7,198,255,0.4)',
                  '0 0 60px rgba(193,55,255,0.5)',
                  '0 0 40px rgba(7,198,255,0.4)',
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center">
                <motion.div
                  className="text-5xl font-bold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                >
                  {animatedScore.toFixed(1)}
                </motion.div>
                <div className="text-sm text-muted-foreground mt-1">/10</div>
              </div>
            </motion.div>
          </div>

          {/* Tier and Percentile */}
          <div className="flex flex-col items-center gap-2 relative z-10">
            <Badge className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white border-0 px-3 py-1">
              {tier}
            </Badge>
            <span className="text-sm text-muted-foreground font-medium">{percentile}</span>
          </div>
        </div>

        {/* Right Side - Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <TooltipProvider>
            {metricCards.map((metric, index) => {
              const Icon = metric.icon;
              const analysis = competitiveAnalysis[metric.id];

              return (
                <Tooltip key={metric.id} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="bg-white/95 backdrop-blur-sm rounded-xl border-2 border-border/50 p-4 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-400/20 hover:scale-105 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-2xl font-bold text-foreground mb-0.5">
                            {metric.value}
                          </div>
                          <div className="text-[10px] text-muted-foreground mb-1 leading-tight">
                            {metric.subValue}
                          </div>
                          <div className="text-xs font-medium text-foreground/80">
                            {metric.label}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-400/10 to-purple-400/10 group-hover:from-cyan-400/20 group-hover:to-purple-400/20 transition-colors">
                            <Icon className="h-5 w-5 text-cyan-500" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </TooltipTrigger>
                  
                  {analysis && (
                    <TooltipContent 
                      side="top" 
                      className="w-80 p-4 bg-white/95 backdrop-blur-xl border-2 border-purple-400/40 shadow-xl"
                      sideOffset={5}
                    >
                      <div className="space-y-3">
                        {/* Percentile Badge */}
                        <Badge className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white border-0">
                          🎯 {analysis.percentile}
                        </Badge>

                        {/* Context */}
                        <p className="text-sm text-foreground leading-relaxed">
                          {analysis.context}
                        </p>

                        {/* School Tiers or Examples */}
                        {analysis.schoolTiers && (
                          <div className="space-y-1.5">
                            {analysis.schoolTiers.map((tier, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                <span className="text-base leading-none mt-0.5">
                                  {getStatusIcon(tier.status)}
                                </span>
                                <span className="text-foreground/90">
                                  <span className="font-medium">{tier.tier}:</span> {tier.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {analysis.schoolExamples && (
                          <div className="space-y-1.5">
                            {analysis.schoolExamples.map((school, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                <span className="text-base leading-none mt-0.5">
                                  {getStatusIcon(school.status)}
                                </span>
                                <span className="text-foreground/90">
                                  <span className="font-medium">{school.name}</span> ({school.range}): 
                                  {school.status === 'within' && ' Within range ✨'}
                                  {school.status === 'strong' && ' Strong match'}
                                  {school.status === 'above' && ' Well above avg'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Tip */}
                        <div className="pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-foreground">💡 Tip:</span> {analysis.tip}
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </div>
    </motion.div>
  );
};
