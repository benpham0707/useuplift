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
      label: 'GPA (Weighted)',
      gradient: 'from-purple-50/80 via-white to-pink-50/60',
      border: 'border-purple-200/50',
      hoverBorder: 'hover:border-purple-400/80',
      shadow: 'shadow-[0_4px_20px_rgba(147,51,234,0.15)]',
      hoverShadow: 'hover:shadow-[0_8px_30px_rgba(147,51,234,0.30)]',
      hoverGradient: 'group-hover:from-purple-100/40 group-hover:via-pink-100/30 group-hover:to-purple-100/40',
      highlight: 'from-transparent via-purple-200/80 to-transparent',
      innerGlow: 'shadow-purple-100/30',
      iconBg: 'from-purple-100 to-pink-100',
      iconHoverBg: 'group-hover:from-purple-200 group-hover:to-pink-200',
      iconColor: 'text-purple-600'
    },
    {
      id: 'sat',
      icon: Brain,
      value: metrics.sat ? `${metrics.sat}` : metrics.act ? `${metrics.act} ACT` : 'N/A',
      subValue: metrics.sat ? 'SAT' : 'ACT',
      label: 'Test Score',
      gradient: 'from-blue-50/80 via-white to-cyan-50/60',
      border: 'border-blue-200/50',
      hoverBorder: 'hover:border-blue-400/80',
      shadow: 'shadow-[0_4px_20px_rgba(59,130,246,0.15)]',
      hoverShadow: 'hover:shadow-[0_8px_30px_rgba(59,130,246,0.30)]',
      hoverGradient: 'group-hover:from-blue-100/40 group-hover:via-cyan-100/30 group-hover:to-blue-100/40',
      highlight: 'from-transparent via-blue-200/80 to-transparent',
      innerGlow: 'shadow-blue-100/30',
      iconBg: 'from-blue-100 to-cyan-100',
      iconHoverBg: 'group-hover:from-blue-200 group-hover:to-cyan-200',
      iconColor: 'text-blue-600'
    },
    {
      id: 'apScores',
      icon: BookOpen,
      value: `${metrics.apScores.total} APs`,
      subValue: `Avg: ${metrics.apScores.average.toFixed(1)} • ${metrics.apScores.fives} 5s`,
      label: 'AP/IB Scores',
      gradient: 'from-cyan-50/80 via-white to-teal-50/60',
      border: 'border-cyan-200/50',
      hoverBorder: 'hover:border-cyan-400/80',
      shadow: 'shadow-[0_4px_20px_rgba(6,182,212,0.15)]',
      hoverShadow: 'hover:shadow-[0_8px_30px_rgba(6,182,212,0.30)]',
      hoverGradient: 'group-hover:from-cyan-100/40 group-hover:via-teal-100/30 group-hover:to-cyan-100/40',
      highlight: 'from-transparent via-cyan-200/80 to-transparent',
      innerGlow: 'shadow-cyan-100/30',
      iconBg: 'from-cyan-100 to-teal-100',
      iconHoverBg: 'group-hover:from-cyan-200 group-hover:to-teal-200',
      iconColor: 'text-cyan-600'
    },
    {
      id: 'classRank',
      icon: TrendingUp,
      value: `Top ${metrics.classRank.percentage}%`,
      subValue: `${metrics.classRank.rank} / ${metrics.classRank.outOf}`,
      label: 'Class Rank',
      gradient: 'from-violet-50/80 via-white to-purple-50/60',
      border: 'border-violet-200/50',
      hoverBorder: 'hover:border-violet-400/80',
      shadow: 'shadow-[0_4px_20px_rgba(139,92,246,0.15)]',
      hoverShadow: 'hover:shadow-[0_8px_30px_rgba(139,92,246,0.30)]',
      hoverGradient: 'group-hover:from-violet-100/40 group-hover:via-purple-100/30 group-hover:to-violet-100/40',
      highlight: 'from-transparent via-violet-200/80 to-transparent',
      innerGlow: 'shadow-violet-100/30',
      iconBg: 'from-violet-100 to-purple-100',
      iconHoverBg: 'group-hover:from-violet-200 group-hover:to-purple-200',
      iconColor: 'text-violet-600'
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
      className="bg-white rounded-3xl border-2 border-purple-400/30 shadow-[0_8px_30px_rgb(147,51,234,0.12)] hover:shadow-[0_12px_40px_rgb(147,51,234,0.16)] transition-shadow duration-500 overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-8 p-8">
        {/* Left Side - Overall Score */}
        <div className="flex flex-col items-center justify-center space-y-6 relative">
          {/* Pulsing background glow */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-cyan-300/20 via-purple-300/20 to-cyan-300/20 rounded-2xl blur-3xl"
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.08, 1],
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
                className="absolute rounded-full"
                style={{
                  width: `${140 + ring * 30}px`,
                  height: `${140 + ring * 30}px`,
                  left: `${-15 * ring}px`,
                  top: `${-15 * ring}px`,
                  border: '2px solid',
                  borderColor: 
                    ring === 1 ? 'rgba(6,182,212,0.3)' :   // cyan
                    ring === 2 ? 'rgba(147,51,234,0.3)' :  // purple
                    'rgba(139,92,246,0.3)',                // violet
                }}
                animate={{
                  rotate: ring % 2 === 0 ? 360 : -360,
                  opacity: [0.3, 0.6, 0.3],
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
              className="relative z-10 w-[140px] h-[140px] rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-violet-500 p-[3px]"
              animate={{
                boxShadow: [
                  '0 0 50px rgba(6,182,212,0.5)',
                  '0 0 70px rgba(147,51,234,0.6)',
                  '0 0 50px rgba(6,182,212,0.5)',
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="w-full h-full rounded-full bg-white shadow-inner flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <motion.div
                    className="text-6xl font-bold bg-gradient-to-r from-cyan-500 via-purple-500 to-violet-600 bg-clip-text text-transparent"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  >
                    {animatedScore.toFixed(1)}
                  </motion.div>
                  <div className="text-sm text-slate-500 font-semibold">/10</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tier and Percentile */}
          <div className="flex flex-col items-center gap-3 relative z-10">
            <Badge className="bg-gradient-to-r from-cyan-500 via-purple-500 to-violet-600 text-white border-0 px-5 py-1.5 text-sm font-bold shadow-lg shadow-purple-400/40">
              {tier}
            </Badge>
            <span className="text-sm text-slate-600 font-semibold tracking-wide">{percentile}</span>
          </div>
        </div>

        {/* Right Side - Metrics Grid */}
        <div className="grid grid-cols-2 gap-6 pr-6">
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
                      transition={{ duration: 0.4, delay: index * 0.08 }}
                      className={`relative bg-gradient-to-br ${metric.gradient} border-2 ${metric.border} rounded-2xl p-5 ${metric.shadow} ${metric.hoverBorder} ${metric.hoverShadow} hover:scale-[1.03] transition-all duration-300 cursor-pointer group overflow-hidden`}
                    >
                      {/* Layer 1: Base gradient (already in className) */}
                      
                      {/* Layer 2: Top highlight shine */}
                      <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r ${metric.highlight}`} />
                      
                      {/* Layer 3: Hover gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent ${metric.hoverGradient} transition-all duration-300 pointer-events-none rounded-2xl`} />
                      
                      {/* Layer 4: Inner glow */}
                      <div className={`absolute inset-0 rounded-2xl shadow-inner ${metric.innerGlow} pointer-events-none`} />

                      {/* Content */}
                      <div className="relative z-10 flex flex-col gap-3">
                        {/* Top: Label + Icon */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                            {metric.label}
                          </span>
                          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${metric.iconBg} shadow-sm group-hover:scale-110 group-hover:shadow-lg ${metric.iconHoverBg} transition-all duration-200`}>
                            <Icon className={`h-5 w-5 ${metric.iconColor}`} />
                          </div>
                        </div>

                        {/* Middle: Value (gradient text) */}
                        <div className="text-3xl font-bold bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                          {metric.value}
                        </div>

                        {/* Bottom: SubValue */}
                        <div className="text-sm text-slate-600 font-medium">
                          {metric.subValue}
                        </div>
                      </div>
                    </motion.div>
                  </TooltipTrigger>
                  
                  {analysis && (
                    <TooltipContent 
                      side="top" 
                      className="w-80 p-5 bg-white/98 backdrop-blur-xl border-2 border-purple-300/40 shadow-2xl rounded-xl"
                      sideOffset={10}
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
