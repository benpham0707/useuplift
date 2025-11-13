import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { MetricCardLarge } from './MetricCardLarge';
import { MetricBoxCompact } from './MetricBoxCompact';
import { TierProgressCard } from './TierProgressCard';
import { StatPill } from './StatPill';
import { AchievementTracker, Achievement } from './AchievementTracker';
import { ComparisonMiniTable, SchoolComparison } from './ComparisonMiniTable';
import { OverallScoreDisplay } from './OverallScoreDisplay';
import { MetricDetailModal } from './MetricDetailModal';
import { BookOpen, Users, Target, TrendingUp, FileText, Award, Sparkles } from 'lucide-react';

interface InteractivePortfolioCardProps {
  overallScore: number;
  tierName: string;
  percentile: string;
  metrics: {
    academic: number;
    leadership: number;
    readiness: number;
    community: number;
    extracurricular: number;
    courseRigor: number;
  };
  achievements: Achievement[];
  schoolComparisons: SchoolComparison[];
  tierProgress: {
    currentTier: string;
    nextTier: string;
    progress: number;
    pointsNeeded: number;
  };
}

export type MetricType = 'academic' | 'leadership' | 'readiness' | 'community' | 'extracurricular' | 'courseRigor';

export const InteractivePortfolioCard: React.FC<InteractivePortfolioCardProps> = ({
  overallScore,
  tierName,
  percentile,
  metrics,
  achievements,
  schoolComparisons,
  tierProgress,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);

  return (
    <>
      <Card className="w-full max-w-[95%] mx-auto backdrop-blur-sm bg-background/80 border-2 shadow-2xl overflow-hidden">
        <div className="p-6 md:p-8">
          {/* Desktop: 12-column grid layout */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-4 min-h-[600px]">
            {/* LEFT SIDE - 5 columns */}
            <div className="col-span-5 flex flex-col gap-4">
              {/* Large Academic Card - 40% height */}
              <div className="h-[40%]">
                <MetricCardLarge
                  title="Academic"
                  score={metrics.academic}
                  icon={BookOpen}
                  onClick={() => setSelectedMetric('academic')}
                  className="h-full"
                />
              </div>

              {/* Two medium cards side-by-side - 25% height */}
              <div className="h-[25%] grid grid-cols-2 gap-4">
                <MetricBoxCompact
                  title="Readiness"
                  score={metrics.readiness}
                  icon={Target}
                  onClick={() => setSelectedMetric('readiness')}
                />
                <MetricBoxCompact
                  title="Course Rigor"
                  score={metrics.courseRigor}
                  icon={TrendingUp}
                  onClick={() => setSelectedMetric('courseRigor')}
                />
              </div>

              {/* Full-width progress bar - 20% height */}
              <div className="h-[20%]">
                <TierProgressCard
                  currentTier={tierProgress.currentTier}
                  nextTier={tierProgress.nextTier}
                  progress={tierProgress.progress}
                  pointsNeeded={tierProgress.pointsNeeded}
                  className="h-full"
                />
              </div>

              {/* Three small stat pills - 15% height */}
              <div className="h-[15%] grid grid-cols-3 gap-3">
                <StatPill icon={TrendingUp} value={percentile} label="Percentile" />
                <StatPill icon={FileText} value="Ready" label="Essays" colorClass="bg-green-500/10" />
                <StatPill icon={Award} value="10/10" label="Recommendations" />
              </div>
            </div>

            {/* CENTER - 2 columns */}
            <div className="col-span-2">
              <OverallScoreDisplay
                score={overallScore}
                tierName={tierName}
                percentile={percentile}
              />
            </div>

            {/* RIGHT SIDE - 5 columns */}
            <div className="col-span-5 flex flex-col gap-4">
              {/* Achievement tracker - 25% height */}
              <div className="h-[25%]">
                <AchievementTracker achievements={achievements} className="h-full" />
              </div>

              {/* Large Leadership card - 35% height */}
              <div className="h-[35%]">
                <MetricCardLarge
                  title="Leadership"
                  score={metrics.leadership}
                  icon={Users}
                  onClick={() => setSelectedMetric('leadership')}
                  className="h-full"
                />
              </div>

              {/* Two small cards side-by-side - 20% height */}
              <div className="h-[20%] grid grid-cols-5 gap-4">
                <div className="col-span-2">
                  <MetricBoxCompact
                    title="Community"
                    score={metrics.community}
                    icon={Users}
                    onClick={() => setSelectedMetric('community')}
                    className="h-full"
                  />
                </div>
                <div className="col-span-3">
                  <MetricBoxCompact
                    title="Extracurricular"
                    score={metrics.extracurricular}
                    icon={Sparkles}
                    onClick={() => setSelectedMetric('extracurricular')}
                    className="h-full"
                  />
                </div>
              </div>

              {/* Comparison stats - 20% height */}
              <div className="h-[20%]">
                <ComparisonMiniTable comparisons={schoolComparisons} className="h-full" />
              </div>
            </div>
          </div>

          {/* Tablet: 8-column grid with stacking */}
          <div className="hidden md:grid lg:hidden md:grid-cols-8 gap-4 min-h-[800px]">
            <div className="col-span-3 flex flex-col gap-4">
              <MetricCardLarge title="Academic" score={metrics.academic} icon={BookOpen} onClick={() => setSelectedMetric('academic')} />
              <div className="grid grid-cols-2 gap-4">
                <MetricBoxCompact title="Readiness" score={metrics.readiness} onClick={() => setSelectedMetric('readiness')} />
                <MetricBoxCompact title="Rigor" score={metrics.courseRigor} onClick={() => setSelectedMetric('courseRigor')} />
              </div>
            </div>
            
            <div className="col-span-2">
              <OverallScoreDisplay score={overallScore} tierName={tierName} percentile={percentile} />
            </div>
            
            <div className="col-span-3 flex flex-col gap-4">
              <AchievementTracker achievements={achievements} />
              <MetricCardLarge title="Leadership" score={metrics.leadership} icon={Users} onClick={() => setSelectedMetric('leadership')} />
              <div className="grid grid-cols-2 gap-4">
                <MetricBoxCompact title="Community" score={metrics.community} onClick={() => setSelectedMetric('community')} />
                <MetricBoxCompact title="Extra" score={metrics.extracurricular} onClick={() => setSelectedMetric('extracurricular')} />
              </div>
            </div>
            
            <div className="col-span-8 grid grid-cols-2 gap-4">
              <TierProgressCard
                currentTier={tierProgress.currentTier}
                nextTier={tierProgress.nextTier}
                progress={tierProgress.progress}
                pointsNeeded={tierProgress.pointsNeeded}
              />
              <ComparisonMiniTable comparisons={schoolComparisons} />
            </div>
            
            <div className="col-span-8 grid grid-cols-3 gap-4">
              <StatPill icon={TrendingUp} value={percentile} label="Percentile" />
              <StatPill icon={FileText} value="Ready" label="Essays" />
              <StatPill icon={Award} value="10/10" label="Recs" />
            </div>
          </div>

          {/* Mobile: Single column vertical stack */}
          <div className="md:hidden space-y-4">
            <OverallScoreDisplay score={overallScore} tierName={tierName} percentile={percentile} />
            
            <div className="grid grid-cols-3 gap-3">
              <StatPill icon={TrendingUp} value={percentile} label="Rank" />
              <StatPill icon={FileText} value="Ready" label="Essays" />
              <StatPill icon={Award} value="10/10" label="Recs" />
            </div>

            <MetricCardLarge title="Academic" score={metrics.academic} icon={BookOpen} onClick={() => setSelectedMetric('academic')} />
            <MetricCardLarge title="Leadership" score={metrics.leadership} icon={Users} onClick={() => setSelectedMetric('leadership')} />
            
            <div className="grid grid-cols-2 gap-4">
              <MetricBoxCompact title="Readiness" score={metrics.readiness} onClick={() => setSelectedMetric('readiness')} />
              <MetricBoxCompact title="Community" score={metrics.community} onClick={() => setSelectedMetric('community')} />
              <MetricBoxCompact title="Extra" score={metrics.extracurricular} onClick={() => setSelectedMetric('extracurricular')} />
              <MetricBoxCompact title="Rigor" score={metrics.courseRigor} onClick={() => setSelectedMetric('courseRigor')} />
            </div>

            <TierProgressCard
              currentTier={tierProgress.currentTier}
              nextTier={tierProgress.nextTier}
              progress={tierProgress.progress}
              pointsNeeded={tierProgress.pointsNeeded}
            />
            
            <AchievementTracker achievements={achievements} />
            <ComparisonMiniTable comparisons={schoolComparisons} />
          </div>
        </div>
      </Card>

      <MetricDetailModal
        metricType={selectedMetric}
        open={!!selectedMetric}
        onOpenChange={(open) => !open && setSelectedMetric(null)}
      />
    </>
  );
};
