import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MetricCardLarge } from './MetricCardLarge';
import { MetricBoxCompact } from './MetricBoxCompact';
import { TierProgressCard } from './TierProgressCard';
import { StatPill } from './StatPill';
import { AchievementTracker, Achievement } from './AchievementTracker';
import { ComparisonMiniTable, SchoolComparison } from './ComparisonMiniTable';
import { OverallScoreDisplay } from './OverallScoreDisplay';
import { MetricDetailView } from './MetricDetailView';
import { BookOpen, Users, Target, TrendingUp, FileText, Award, Sparkles, X } from 'lucide-react';

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
  const [expandedMetric, setExpandedMetric] = useState<MetricType | null>(null);

  const handleMetricClick = (metric: MetricType) => {
    setExpandedMetric(expandedMetric === metric ? null : metric);
  };

  const handleClose = () => {
    setExpandedMetric(null);
  };

  return (
    <Card className="w-full mx-auto backdrop-blur-sm bg-card/95 border-2 border-border shadow-2xl overflow-hidden relative">
      <div className="p-4 md:p-6">
        {/* Expanded Metric View - Takes Full Space */}
        {expandedMetric && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground capitalize">{expandedMetric} Details</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClose}
                className="hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <MetricDetailView metricType={expandedMetric} />
          </div>
        )}

        {/* Collapsed View - Grid of Cards */}
        {!expandedMetric && (
          <div className="space-y-6 animate-fade-in">
            {/* Header with Overall Score */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pb-6 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary">{overallScore}</div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <div className="text-lg font-semibold text-foreground">{tierName}</div>
                  <div className="text-sm text-muted-foreground">{percentile}</div>
                </div>
              </div>

              <div className="flex gap-3">
                <StatPill icon={TrendingUp} value={percentile} label="Percentile" />
                <StatPill icon={FileText} value="Ready" label="Essays" colorClass="bg-green-500/10" />
                <StatPill icon={Award} value="10/10" label="Recs" />
              </div>
            </div>

            {/* Main Metrics Grid - Desktop */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-4">
              <MetricCardLarge
                title="Academic"
                score={metrics.academic}
                icon={BookOpen}
                onClick={() => handleMetricClick('academic')}
                className="hover:scale-[1.02] transition-transform cursor-pointer"
              />
              <MetricCardLarge
                title="Leadership"
                score={metrics.leadership}
                icon={Users}
                onClick={() => handleMetricClick('leadership')}
                className="hover:scale-[1.02] transition-transform cursor-pointer"
              />
              <MetricCardLarge
                title="Extracurricular"
                score={metrics.extracurricular}
                icon={Sparkles}
                onClick={() => handleMetricClick('extracurricular')}
                className="hover:scale-[1.02] transition-transform cursor-pointer"
              />
            </div>

            {/* Secondary Metrics - Desktop */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-4">
              <MetricBoxCompact
                title="Readiness"
                score={metrics.readiness}
                icon={Target}
                onClick={() => handleMetricClick('readiness')}
                className="hover:scale-[1.02] transition-transform cursor-pointer"
              />
              <MetricBoxCompact
                title="Community"
                score={metrics.community}
                icon={Users}
                onClick={() => handleMetricClick('community')}
                className="hover:scale-[1.02] transition-transform cursor-pointer"
              />
              <MetricBoxCompact
                title="Course Rigor"
                score={metrics.courseRigor}
                icon={TrendingUp}
                onClick={() => handleMetricClick('courseRigor')}
                className="hover:scale-[1.02] transition-transform cursor-pointer"
              />
              <div className="flex items-center">
                <TierProgressCard
                  progress={{
                    currentTier: tierProgress.currentTier,
                    nextTier: tierProgress.nextTier,
                    progress: tierProgress.progress,
                    pointsNeeded: tierProgress.pointsNeeded,
                    milestonesCompleted: 2,
                    milestonesTotal: 6,
                    milestones: [
                      { text: 'Complete 6 AP courses with 5s', completed: true },
                      { text: 'Reach 400+ service hours', completed: true },
                      { text: 'Start research project', completed: false },
                    ],
                  }}
                />
              </div>
            </div>

            {/* Additional Info - Desktop */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-4">
              <AchievementTracker achievements={achievements} />
              <ComparisonMiniTable comparisons={schoolComparisons} />
            </div>

            {/* Tablet Layout */}
            <div className="hidden md:grid lg:hidden md:grid-cols-2 gap-4">
              <MetricCardLarge 
                title="Academic" 
                score={metrics.academic} 
                icon={BookOpen} 
                onClick={() => handleMetricClick('academic')}
                className="hover:scale-[1.02] transition-transform cursor-pointer"
              />
              <MetricCardLarge 
                title="Leadership" 
                score={metrics.leadership} 
                icon={Users} 
                onClick={() => handleMetricClick('leadership')}
                className="hover:scale-[1.02] transition-transform cursor-pointer"
              />
              
              <MetricBoxCompact 
                title="Readiness" 
                score={metrics.readiness} 
                icon={Target}
                onClick={() => handleMetricClick('readiness')}
                className="hover:scale-[1.02] transition-transform cursor-pointer"
              />
              <MetricBoxCompact 
                title="Community" 
                score={metrics.community} 
                icon={Users}
                onClick={() => handleMetricClick('community')}
                className="hover:scale-[1.02] transition-transform cursor-pointer"
              />
              
              <MetricBoxCompact 
                title="Extra" 
                score={metrics.extracurricular} 
                icon={Sparkles}
                onClick={() => handleMetricClick('extracurricular')}
                className="hover:scale-[1.02] transition-transform cursor-pointer"
              />
              <MetricBoxCompact 
                title="Rigor" 
                score={metrics.courseRigor} 
                icon={TrendingUp}
                onClick={() => handleMetricClick('courseRigor')}
                className="hover:scale-[1.02] transition-transform cursor-pointer"
              />

              <div className="col-span-2">
                <TierProgressCard
                  progress={{
                    currentTier: tierProgress.currentTier,
                    nextTier: tierProgress.nextTier,
                    progress: tierProgress.progress,
                    pointsNeeded: tierProgress.pointsNeeded,
                    milestonesCompleted: 2,
                    milestonesTotal: 6,
                    milestones: [
                      { text: 'Complete 6 AP courses with 5s', completed: true },
                      { text: 'Reach 400+ service hours', completed: true },
                      { text: 'Start research project', completed: false },
                    ],
                  }}
                />
              </div>

              <AchievementTracker achievements={achievements} />
              <ComparisonMiniTable comparisons={schoolComparisons} />
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden space-y-4">
              <MetricCardLarge 
                title="Academic" 
                score={metrics.academic} 
                icon={BookOpen} 
                onClick={() => handleMetricClick('academic')}
                className="hover:scale-[1.02] transition-transform cursor-pointer"
              />
              <MetricCardLarge 
                title="Leadership" 
                score={metrics.leadership} 
                icon={Users} 
                onClick={() => handleMetricClick('leadership')}
                className="hover:scale-[1.02] transition-transform cursor-pointer"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <MetricBoxCompact 
                  title="Readiness" 
                  score={metrics.readiness} 
                  icon={Target}
                  onClick={() => handleMetricClick('readiness')}
                  className="hover:scale-[1.02] transition-transform cursor-pointer"
                />
                <MetricBoxCompact 
                  title="Community" 
                  score={metrics.community} 
                  icon={Users}
                  onClick={() => handleMetricClick('community')}
                  className="hover:scale-[1.02] transition-transform cursor-pointer"
                />
                <MetricBoxCompact 
                  title="Extra" 
                  score={metrics.extracurricular} 
                  icon={Sparkles}
                  onClick={() => handleMetricClick('extracurricular')}
                  className="hover:scale-[1.02] transition-transform cursor-pointer"
                />
                <MetricBoxCompact 
                  title="Rigor" 
                  score={metrics.courseRigor} 
                  icon={TrendingUp}
                  onClick={() => handleMetricClick('courseRigor')}
                  className="hover:scale-[1.02] transition-transform cursor-pointer"
                />
              </div>

              <TierProgressCard
                progress={{
                  currentTier: tierProgress.currentTier,
                  nextTier: tierProgress.nextTier,
                  progress: tierProgress.progress,
                  pointsNeeded: tierProgress.pointsNeeded,
                  milestonesCompleted: 2,
                  milestonesTotal: 6,
                  milestones: [
                    { text: 'Complete 6 AP courses with 5s', completed: true },
                    { text: 'Reach 400+ service hours', completed: true },
                    { text: 'Start research project', completed: false },
                  ],
                }}
              />
              
              <AchievementTracker achievements={achievements} />
              <ComparisonMiniTable comparisons={schoolComparisons} />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
