import React from 'react';
import { Trophy, Star, Target, Sparkles, Lock } from 'lucide-react';
import { Achievement } from '../portfolioInsightsData';

interface BentoAchievementsProps {
  achievements: Achievement[];
}

export const BentoAchievements: React.FC<BentoAchievementsProps> = ({ achievements }) => {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = 6; // Fixed total for now

  const achievementBadges = [
    {
      icon: Trophy,
      gradient: 'from-yellow-50 to-amber-50',
      border: 'border-amber-200/50',
      iconColor: 'text-amber-500',
      glowColor: 'bg-amber-500/50',
      unlocked: true,
    },
    {
      icon: Star,
      gradient: 'from-purple-50 to-pink-50',
      border: 'border-purple-200/50',
      iconColor: 'text-purple-500',
      glowColor: 'bg-purple-500/50',
      unlocked: true,
    },
    {
      icon: Target,
      gradient: 'from-cyan-50 to-blue-50',
      border: 'border-cyan-200/50',
      iconColor: 'text-cyan-500',
      glowColor: 'bg-cyan-500/50',
      unlocked: true,
    },
    {
      icon: Sparkles,
      gradient: 'from-pink-50 to-rose-50',
      border: 'border-pink-200/50',
      iconColor: 'text-pink-500',
      glowColor: 'bg-pink-500/50',
      unlocked: true,
    },
    {
      icon: Lock,
      gradient: 'from-slate-50 to-gray-50',
      border: 'border-slate-300/50',
      iconColor: 'text-slate-400',
      glowColor: 'bg-slate-400/50',
      unlocked: false,
    },
    {
      icon: Lock,
      gradient: 'from-slate-50 to-gray-50',
      border: 'border-slate-300/50',
      iconColor: 'text-slate-400',
      glowColor: 'bg-slate-400/50',
      unlocked: false,
    },
  ];

  return (
    <div className="depth-layer-3 holo-surface rounded-2xl p-5 h-full bg-gradient-to-br from-white/95 to-white/85">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Achievements
          </h3>
        </div>
        <div className="text-xs font-bold text-primary">
          {unlockedCount}/{totalCount}
        </div>
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-3 gap-3">
        {achievementBadges.map((badge, index) => {
          const Icon = badge.icon;

          return badge.unlocked ? (
            <div
              key={index}
              className={`aspect-square rounded-xl bg-gradient-to-br ${badge.gradient} border-2 ${badge.border} flex items-center justify-center hover:scale-110 hover:shadow-depth-3 hover:border-opacity-100 transition-all duration-300 cursor-pointer group/badge depth-layer-2`}
            >
              <div className="relative">
                <div className={`absolute inset-0 blur-md ${badge.glowColor} rounded-full`} />
                <Icon className={`relative w-8 h-8 ${badge.iconColor} drop-shadow-sm`} />
              </div>
            </div>
          ) : (
            <div
              key={index}
              className={`aspect-square rounded-xl bg-gradient-to-br ${badge.gradient} border-2 border-dashed ${badge.border} flex items-center justify-center grayscale opacity-40 hover:opacity-60 hover:grayscale-0 transition-all duration-300 cursor-not-allowed shadow-inner`}
            >
              <Icon className={`w-7 h-7 ${badge.iconColor}`} />
            </div>
          );
        })}
      </div>

      <div className="text-xs text-center text-muted-foreground mt-4 font-medium">
        {totalCount - unlockedCount} more to unlock
      </div>
    </div>
  );
};
