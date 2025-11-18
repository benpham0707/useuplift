import React from 'react';
import { Trophy, Star, Target, Sparkles, Lock, Award } from 'lucide-react';
import { Achievement } from '../portfolioInsightsData';
import GradientText from '@/components/ui/GradientText';

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
    <div className="rounded-2xl p-5 h-full bg-white/80 backdrop-blur-md border-2 border-amber-200/60 hover:border-amber-400/80 shadow-lg shadow-amber-100/50 hover:shadow-xl hover:shadow-amber-200/60 hover:-translate-y-1 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 md:gap-4 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-400/50">
          <Award className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 flex items-center justify-between">
          <GradientText
            className="text-base md:text-lg font-extrabold uppercase tracking-wide"
            colors={["#eab308", "#f59e0b", "#fbbf24", "#eab308"]}
          >
            ACHIEVEMENTS
          </GradientText>
          <div className="text-xs font-bold text-primary">
            {unlockedCount}/{totalCount}
          </div>
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
