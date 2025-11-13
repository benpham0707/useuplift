import React from 'react';
import { BookOpen, TrendingUp, Users, Award } from 'lucide-react';

interface BentoQuickStatsProps {
  stats: {
    gpa: number;
    sat: number;
    hours: number;
    awards: number;
  };
}

export const BentoQuickStats: React.FC<BentoQuickStatsProps> = ({ stats }) => {
  return (
    <div className="depth-layer-3 holo-surface rounded-2xl p-5 h-full bg-gradient-to-br from-white/95 via-white/90 to-white/85 hover:shadow-depth-4 transition-all duration-500 group">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-depth-2">
          <Users className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Quick Stats
        </h3>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* GPA */}
        <div className="depth-layer-2 rounded-xl p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 hover:scale-105 hover:shadow-depth-3 transition-all duration-300 cursor-pointer group/stat relative overflow-hidden">
          <div className="flex flex-col items-center gap-2 relative z-10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow-depth-2 group-hover/stat:shadow-depth-3 transition-shadow duration-300">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="text-3xl font-extrabold bg-gradient-to-br from-green-600 to-emerald-500 bg-clip-text text-transparent">
              {stats.gpa}
            </div>
            <div className="text-xs font-medium text-green-700/80">GPA</div>
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-400/0 via-emerald-400/0 to-green-400/10 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>

        {/* Test Score */}
        <div className="depth-layer-2 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 hover:scale-105 hover:shadow-depth-3 transition-all duration-300 cursor-pointer group/stat relative overflow-hidden">
          <div className="flex flex-col items-center gap-2 relative z-10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-depth-2 group-hover/stat:shadow-depth-3 transition-shadow duration-300">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="text-3xl font-extrabold bg-gradient-to-br from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              {stats.sat}
            </div>
            <div className="text-xs font-medium text-blue-700/80">SAT</div>
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/0 via-cyan-400/0 to-blue-400/10 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>

        {/* Service Hours */}
        <div className="depth-layer-2 rounded-xl p-4 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50 hover:scale-105 hover:shadow-depth-3 transition-all duration-300 cursor-pointer group/stat relative overflow-hidden">
          <div className="flex flex-col items-center gap-2 relative z-10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-depth-2 group-hover/stat:shadow-depth-3 transition-shadow duration-300">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="text-3xl font-extrabold bg-gradient-to-br from-orange-600 to-amber-500 bg-clip-text text-transparent">
              {stats.hours}+
            </div>
            <div className="text-xs font-medium text-orange-700/80">Hours</div>
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-400/0 via-amber-400/0 to-orange-400/10 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>

        {/* Awards */}
        <div className="depth-layer-2 rounded-xl p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 hover:scale-105 hover:shadow-depth-3 transition-all duration-300 cursor-pointer group/stat relative overflow-hidden">
          <div className="flex flex-col items-center gap-2 relative z-10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center shadow-depth-2 group-hover/stat:shadow-depth-3 transition-shadow duration-300">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div className="text-3xl font-extrabold bg-gradient-to-br from-purple-600 to-pink-500 bg-clip-text text-transparent">
              {stats.awards}
            </div>
            <div className="text-xs font-medium text-purple-700/80">Awards</div>
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-400/0 via-pink-400/0 to-purple-400/10 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
