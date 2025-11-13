import React from 'react';

import { BookOpen, TrendingUp, Users, Award } from 'lucide-react';

interface BentoCenterScoreProps {
  score: number;
  tierName: string;
  percentile: string;
  onClick?: () => void;
  quickStats: {
    gpa: number;
    sat: number;
    hours: number;
    awards: number;
  };
}

export const BentoCenterScore: React.FC<BentoCenterScoreProps> = ({
  score,
  tierName,
  percentile,
  onClick,
  quickStats,
}) => {
  return (
    <div className="relative h-full">
      {/* Multi-layer ambient glow */}
      <div className="absolute inset-[-30px] rounded-[3rem] blur-3xl bg-gradient-radial from-primary/30 via-cyan-400/20 to-transparent animate-ambient-pulse pointer-events-none z-0" />
      <div className="absolute inset-[-15px] rounded-[2.5rem] blur-xl bg-gradient-radial from-primary/20 via-cyan-400/15 to-transparent animate-ambient-pulse-slow pointer-events-none z-0" />

      {/* Main card */}
      <div
        className="depth-layer-4 holo-surface relative h-full rounded-3xl p-8 bg-gradient-to-br from-white/95 via-white/85 to-white/90 hover:scale-[1.01] transition-all duration-700 cursor-pointer group/center"
        onClick={onClick}
      >
        {/* Animated neon edge */}
        <div className="absolute inset-[-3px] rounded-3xl opacity-0 group-hover/center:opacity-100 bg-gradient-to-r from-primary via-cyan-400 to-primary bg-[length:200%_100%] animate-border-flow transition-opacity duration-500 -z-10" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center">
          {/* Floating circular score */}
          <div className="relative mb-8">
            {/* Orbital rings */}
            <div className="absolute inset-[-12px] border-2 border-cyan-400/30 rounded-full animate-ring-orbit-slow" />
            <div className="absolute inset-[-22px] border border-primary/20 rounded-full animate-ring-orbit-reverse-slow" />
            <div className="absolute inset-[-32px] border border-cyan-400/15 rounded-full animate-ring-orbit" />

            {/* Main circle */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-xl bg-gradient-to-br from-primary/50 to-cyan-500/50" />
              <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-primary via-cyan-400 to-primary flex flex-col items-center justify-center shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.6),0_10px_30px_-10px_rgba(34,211,238,0.4)] group-hover/center:shadow-[0_25px_70px_-15px_hsl(var(--primary)/0.8),0_15px_40px_-10px_rgba(34,211,238,0.6)] transition-shadow duration-700">
                {/* Inner highlight */}
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-white/30 to-transparent blur-md" />
                <div className="relative z-10 text-8xl font-black text-white drop-shadow-2xl">
                  {score}
                </div>
                <div className="relative z-10 text-xs text-white/90 uppercase tracking-widest font-bold mt-1">
                  Overall
                </div>
              </div>
            </div>
          </div>

          {/* Tier badge */}
          <div className="depth-layer-2 rounded-2xl px-6 py-3 bg-gradient-to-br from-purple-50 via-cyan-50 to-purple-50 border-2 border-purple-200/50">
            <div className="text-2xl font-black bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
              {tierName}
            </div>
            <div className="text-sm text-muted-foreground text-center mt-1 font-medium">
              {percentile}
            </div>
          </div>

          {/* Quick Stats Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <div className="depth-layer-1 px-4 py-2 rounded-full bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-green-700">GPA {quickStats.gpa}</span>
            </div>
            <div className="depth-layer-1 px-4 py-2 rounded-full bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-700">SAT {quickStats.sat}</span>
            </div>
            <div className="depth-layer-1 px-4 py-2 rounded-full bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-bold text-orange-700">{quickStats.hours}+ Hours</span>
            </div>
            <div className="depth-layer-1 px-4 py-2 rounded-full bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-bold text-purple-700">{quickStats.awards} Awards</span>
            </div>
          </div>

          {/* Hint */}
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground/60 opacity-0 group-hover/center:opacity-100 transition-opacity duration-500">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Click to explore detailed insights</span>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};
