import React from 'react';
import { Gem, TrendingUp, FileText, Award } from 'lucide-react';

interface BentoProgressBarProps {
  tierProgress: {
    currentTier: string;
    nextTier: string;
    progress: number;
    pointsNeeded: number;
  };
}

export const BentoProgressBar: React.FC<BentoProgressBarProps> = ({ tierProgress }) => {
  return (
    <div className="depth-layer-3 holo-surface rounded-2xl p-6 bg-gradient-to-r from-white/95 via-white/90 to-white/95 hover:shadow-depth-4 transition-all duration-500">
      <div className="flex items-center justify-between mb-5">
        {/* Current tier */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-depth-3">
            <Gem className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="text-2xl font-black text-foreground">{tierProgress.currentTier}</div>
            <div className="text-sm text-muted-foreground font-medium">
              {tierProgress.progress}% to {tierProgress.nextTier}
            </div>
          </div>
        </div>

        {/* Points needed */}
        <div className="text-right">
          <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
            +{tierProgress.pointsNeeded.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground font-medium">points needed</div>
        </div>
      </div>

      {/* Multi-layer progress bar */}
      <div className="relative h-6 bg-gradient-to-r from-slate-100 to-slate-50 rounded-full overflow-hidden shadow-inner mb-5">
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 11px)',
          }}
        />

        {/* Progress fill with shimmer */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-primary via-cyan-400 to-primary rounded-full transition-all duration-1000 shadow-depth-2 bg-[length:200%_100%] animate-shimmer"
          style={{ width: `${tierProgress.progress}%` }}
        />

        {/* Top highlight */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent rounded-full blur-sm pointer-events-none" />

        {/* Progress text overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white/90 drop-shadow-md">
            {tierProgress.progress}%
          </span>
        </div>
      </div>

      {/* Stat pills */}
      <div className="flex gap-3 justify-center">
        <div className="depth-layer-1 px-4 py-2 rounded-full bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-sm font-bold text-green-700">Top 15%</span>
        </div>

        <div className="depth-layer-1 px-4 py-2 rounded-full bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-bold text-blue-700">Essays Ready</span>
        </div>

        <div className="depth-layer-1 px-4 py-2 rounded-full bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-bold text-purple-700">10/10 Recs</span>
        </div>
      </div>
    </div>
  );
};
