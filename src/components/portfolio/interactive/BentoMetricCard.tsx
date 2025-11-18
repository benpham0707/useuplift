import React from 'react';
import { BookOpen, Users, Target, TrendingUp, Award, Sparkles } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface BentoMetricCardProps {
  title: string;
  score: number;
  color: 'blue' | 'purple' | 'cyan' | 'green' | 'indigo' | 'orange';
  description?: string;
  onClick?: () => void;
}

const colorConfig = {
  blue: {
    gradient: 'from-blue-500 to-indigo-500',
    bgGradient: 'from-blue-50 to-indigo-50',
    textGradient: 'from-blue-600 to-indigo-600',
    progress: 'from-blue-500 to-indigo-500',
    hoverGlow: 'from-blue-500/0 via-indigo-500/0 to-blue-500/5',
    icon: BookOpen,
  },
  purple: {
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50',
    textGradient: 'from-purple-600 to-pink-600',
    progress: 'from-purple-500 to-pink-500',
    hoverGlow: 'from-purple-500/0 via-pink-500/0 to-purple-500/5',
    icon: Target,
  },
  cyan: {
    gradient: 'from-cyan-500 to-blue-500',
    bgGradient: 'from-cyan-50 to-blue-50',
    textGradient: 'from-cyan-600 to-blue-600',
    progress: 'from-cyan-500 to-blue-500',
    hoverGlow: 'from-cyan-500/0 via-blue-500/0 to-cyan-500/5',
    icon: Sparkles,
  },
  green: {
    gradient: 'from-green-500 to-emerald-500',
    bgGradient: 'from-green-50 to-emerald-50',
    textGradient: 'from-green-600 to-emerald-600',
    progress: 'from-green-500 to-emerald-500',
    hoverGlow: 'from-green-500/0 via-emerald-500/0 to-green-500/5',
    icon: TrendingUp,
  },
  indigo: {
    gradient: 'from-indigo-500 to-violet-500',
    bgGradient: 'from-indigo-50 to-violet-50',
    textGradient: 'from-indigo-600 to-violet-600',
    progress: 'from-indigo-500 to-violet-500',
    hoverGlow: 'from-indigo-500/0 via-violet-500/0 to-indigo-500/5',
    icon: Award,
  },
  orange: {
    gradient: 'from-orange-500 to-amber-500',
    bgGradient: 'from-orange-50 to-amber-50',
    textGradient: 'from-orange-600 to-amber-600',
    progress: 'from-orange-500 to-amber-500',
    hoverGlow: 'from-orange-500/0 via-amber-500/0 to-orange-500/5',
    icon: Users,
  },
};

export const BentoMetricCard: React.FC<BentoMetricCardProps> = ({
  title,
  score,
  color,
  description,
  onClick,
}) => {
  const config = colorConfig[color];
  const Icon = config.icon;
  const percentage = Math.round((score / 10) * 100);

  return (
    <div
      className={`rounded-2xl p-6 h-full bg-white/80 backdrop-blur-md border-2 border-white/50 hover:border-${color}-400/70 shadow-lg hover:scale-[1.02] hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer group/metric relative overflow-hidden ${
        color === 'blue' ? 'shadow-blue-100/50 hover:shadow-blue-200/60' :
        color === 'purple' ? 'shadow-purple-100/50 hover:shadow-purple-200/60' :
        color === 'cyan' ? 'shadow-cyan-100/50 hover:shadow-cyan-200/60' :
        color === 'green' ? 'shadow-green-100/50 hover:shadow-green-200/60' :
        color === 'indigo' ? 'shadow-indigo-100/50 hover:shadow-indigo-200/60' :
        'shadow-orange-100/50 hover:shadow-orange-200/60'
      }`}
      onClick={onClick}
    >
      {/* Icon badge */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-depth-2 group-hover/metric:shadow-depth-3 group-hover/metric:scale-110 transition-all duration-300`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">
            {title}
          </div>
          <div className={`text-3xl font-black bg-gradient-to-r ${config.textGradient} bg-clip-text text-transparent`}>
            {score.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-full overflow-hidden shadow-inner mb-4">
        <div
          className={`absolute inset-0 bg-gradient-to-r ${config.progress} rounded-full transition-all duration-1000 shadow-depth-1`}
          style={{ width: `${percentage}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent rounded-full blur-sm" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white/90 drop-shadow-md">{percentage}%</span>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="text-sm text-foreground/80 leading-relaxed font-medium">
          {description}
        </div>
      )}

      {/* Click hint */}
      <div className="mt-4 text-xs text-muted-foreground/60 opacity-0 group-hover/metric:opacity-100 transition-opacity duration-300">
        Click for detailed insights →
      </div>

      {/* Hover glow */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${config.hoverGlow} opacity-0 group-hover/metric:opacity-100 transition-opacity duration-500 pointer-events-none`} />
    </div>
  );
};
