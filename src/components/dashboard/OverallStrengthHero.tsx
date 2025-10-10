import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, School } from 'lucide-react';

interface OverallStrengthHeroProps {
  score: number;
  tierName: string;
  tierColor: string;
  tierGradient: string;
  excellingCount: number;
  totalDimensions: number;
}

export function OverallStrengthHero({ 
  score, 
  tierName, 
  tierColor,
  tierGradient,
  excellingCount,
  totalDimensions 
}: OverallStrengthHeroProps) {
  // Calculate percentile and school tier recommendations
  const percentile = Math.round((score / 10) * 100);
  const targetScore = 9.2;
  const progressToTarget = Math.min((score / targetScore) * 100, 100);
  
  // School tier recommendations based on score
  const getSchoolTier = () => {
    if (score >= 9) return 'Top 5 Schools (Ivy+)';
    if (score >= 8.5) return 'Top 15 Schools';
    if (score >= 7.5) return 'Top 25 Schools';
    if (score >= 6.5) return 'Top 50 Schools';
    return 'Strong Regional Schools';
  };

  const getReadinessMessage = () => {
    if (score >= 9) return 'Elite competitive profile';
    if (score >= 8.5) return 'Highly competitive profile';
    if (score >= 7.5) return 'Competitive for selective schools';
    if (score >= 6.5) return 'Solid foundation for growth';
    return 'Building toward competitive range';
  };

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${tierGradient} border-2 border-white/20 shadow-2xl transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] h-full`}>
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <CardContent className="p-8 relative z-10">
        {/* Header with tier badge */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-white/80 text-sm font-medium mb-1">Overall Portfolio Strength</div>
            <Badge 
              className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-sm px-3 py-1"
            >
              {tierName}
            </Badge>
          </div>
          <Target className="h-8 w-8 text-white/60" />
        </div>

        {/* Giant score display */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-8xl font-bold text-white tracking-tight">
              {score.toFixed(1)}
            </span>
            <span className="text-3xl text-white/60 font-medium mb-4">/10</span>
          </div>
          <div className="text-white/80 text-lg font-medium mt-2">
            {getReadinessMessage()}
          </div>
        </div>

        {/* Progress to target */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm text-white/70">
            <span>Progress to Elite Tier</span>
            <span className="font-medium">{progressToTarget.toFixed(0)}%</span>
          </div>
          <Progress 
            value={progressToTarget} 
            className="h-2 bg-white/20"
          />
        </div>

        {/* Quick insights grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
            <TrendingUp className="h-5 w-5 text-white/80 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-white font-semibold text-sm">Top {percentile}%</div>
              <div className="text-white/70 text-xs">Estimated percentile</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
            <School className="h-5 w-5 text-white/80 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-white font-semibold text-sm">{getSchoolTier()}</div>
              <div className="text-white/70 text-xs">Target tier range</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
            <div className="h-5 w-5 text-white/80 mt-0.5 flex-shrink-0 font-bold">
              {excellingCount}/{totalDimensions}
            </div>
            <div>
              <div className="text-white font-semibold text-sm">Strong Dimensions</div>
              <div className="text-white/70 text-xs">Scoring above 8.0</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
