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
      <CardContent className="p-5 relative z-10">
        {/* Header with tier badge and score on same line */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-baseline gap-3">
            <span className="text-6xl font-bold text-white tracking-tight">
              {score.toFixed(1)}
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-xl text-white/60 font-medium">/10</span>
              <Badge 
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs px-2 py-0.5"
              >
                {tierName}
              </Badge>
            </div>
          </div>
          <Target className="h-6 w-6 text-white/60" />
        </div>

        <div className="text-white/80 text-base font-medium mb-3">
          {getReadinessMessage()}
        </div>

        {/* Progress to target */}
        <div className="mb-3 space-y-1">
          <div className="flex justify-between text-xs text-white/70">
            <span>Progress to Elite Tier</span>
            <span className="font-medium">{progressToTarget.toFixed(0)}%</span>
          </div>
          <Progress 
            value={progressToTarget} 
            className="h-1.5 bg-white/20"
          />
        </div>

        {/* Quick insights as horizontal badges */}
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/15 text-xs px-2.5 py-1 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Top {percentile}%</span>
          </Badge>
          
          <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/15 text-xs px-2.5 py-1 flex items-center gap-1.5">
            <School className="h-3.5 w-3.5" />
            <span>{getSchoolTier()}</span>
          </Badge>
          
          <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/15 text-xs px-2.5 py-1">
            <span className="font-bold">{excellingCount}/{totalDimensions}</span>
            <span className="ml-1">Strong Dimensions</span>
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
