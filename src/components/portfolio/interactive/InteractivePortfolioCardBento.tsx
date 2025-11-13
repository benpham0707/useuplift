import React, { useState } from 'react';
import { BentoQuickStats } from './BentoQuickStats';
import { BentoCenterScore } from './BentoCenterScore';
import { BentoMetricCard } from './BentoMetricCard';
import { BentoAchievements } from './BentoAchievements';
import { BentoProgressBar } from './BentoProgressBar';
import { Achievement } from '../portfolioInsightsData';
import { motion, AnimatePresence } from 'motion/react';

interface InteractivePortfolioCardBentoProps {
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
  schoolComparisons?: any[];
  tierProgress: {
    currentTier: string;
    nextTier: string;
    progress: number;
    pointsNeeded: number;
  };
}

export const InteractivePortfolioCardBento: React.FC<InteractivePortfolioCardBentoProps> = ({
  overallScore,
  tierName,
  percentile,
  metrics,
  achievements,
  tierProgress,
}) => {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  const quickStats = {
    gpa: 3.95,
    sat: 1520,
    hours: 450,
    awards: 12,
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {expandedMetric ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="absolute inset-0 z-50 p-6 bg-background rounded-3xl"
          >
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">Detailed {expandedMetric} Insights</h2>
                <p className="text-muted-foreground mb-6">Coming soon...</p>
                <button
                  onClick={() => setExpandedMetric(null)}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="bento-maze-grid">
            {/* Quick Stats - Top-left entry point */}
            <div className="area-quick-stats">
              <BentoQuickStats stats={quickStats} />
            </div>

            {/* Academic */}
            <div className="area-academic">
              <BentoMetricCard
                title="Academic"
                score={metrics.academic}
                color="blue"
                onClick={() => setExpandedMetric('Academic')}
              />
            </div>

            {/* Center Score - Large visual anchor */}
            <div className="area-center-score">
              <BentoCenterScore
                score={overallScore}
                tierName={tierName}
                percentile={percentile}
                onClick={() => setExpandedMetric('Overall')}
              />
            </div>

            {/* Leadership */}
            <div className="area-leadership">
              <BentoMetricCard
                title="Leadership"
                score={metrics.leadership}
                color="purple"
                onClick={() => setExpandedMetric('Leadership')}
              />
            </div>

            {/* Extracurricular */}
            <div className="area-extracurricular">
              <BentoMetricCard
                title="Extracurr"
                score={metrics.extracurricular}
                color="cyan"
                onClick={() => setExpandedMetric('Extracurricular')}
              />
            </div>

            {/* Readiness */}
            <div className="area-readiness">
              <BentoMetricCard
                title="Readiness"
                score={metrics.readiness}
                color="green"
                onClick={() => setExpandedMetric('Readiness')}
              />
            </div>

            {/* Course Rigor */}
            <div className="area-course-rigor">
              <BentoMetricCard
                title="Course Rigor"
                score={metrics.courseRigor}
                color="indigo"
                description="Strong • 6 APs"
                onClick={() => setExpandedMetric('Course Rigor')}
              />
            </div>

            {/* Progress Bar - Full width separator */}
            <div className="area-progress-bar">
              <BentoProgressBar tierProgress={tierProgress} />
            </div>

            {/* Achievements */}
            <div className="area-achievements">
              <BentoAchievements achievements={achievements} />
            </div>

            {/* Comparison Table */}
            <div className="area-comparison">
              <div className="depth-layer-3 holo-surface rounded-2xl p-6 h-full bg-gradient-to-br from-white/95 to-white/85 hover:shadow-depth-4 transition-all duration-500">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                  vs Admitted Students
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Elite Schools</span>
                    <span className="text-sm font-bold text-orange-600">-0.7 ⚠</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Target Schools</span>
                    <span className="text-sm font-bold text-green-600">+0.2 ✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Safety Schools</span>
                    <span className="text-sm font-bold text-green-600">+1.0 ✓✓</span>
                  </div>
                  <div className="pt-3 border-t border-border/50">
                    <div className="text-xs text-muted-foreground mb-1">Community Impact</div>
                    <div className="text-lg font-bold text-primary">{metrics.community} • Service Leader</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
