import React, { useState } from 'react';
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

  // Hard-coded quick stats values for display
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
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setExpandedMetric(null)}
          >
            <motion.div
              className="bg-background rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto depth-layer-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-cyan-500 to-primary bg-clip-text text-transparent">
                  {expandedMetric} Insights
                </h2>
                <p className="text-muted-foreground mb-8 text-lg">
                  Detailed analysis and recommendations coming soon...
                </p>
                <div className="space-y-6 text-left">
                  <div className="depth-layer-2 rounded-2xl p-6 bg-gradient-to-br from-primary/5 to-cyan-500/5">
                    <h3 className="font-bold text-lg mb-2">Score Breakdown</h3>
                    <p className="text-muted-foreground">How your score is calculated and what factors contribute to it.</p>
                  </div>
                  <div className="depth-layer-2 rounded-2xl p-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                    <h3 className="font-bold text-lg mb-2">Contributing Factors</h3>
                    <p className="text-muted-foreground">Key activities and achievements that influence this metric.</p>
                  </div>
                  <div className="depth-layer-2 rounded-2xl p-6 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
                    <h3 className="font-bold text-lg mb-2">Recommendations</h3>
                    <p className="text-muted-foreground">Specific actions you can take to improve your score.</p>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedMetric(null)}
                  className="mt-8 px-8 py-3 bg-gradient-to-r from-primary to-cyan-500 text-white rounded-xl hover:shadow-depth-3 transition-all duration-300 font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <div className="insights-dashboard-container">
            {/* Hero Section - Large Center Score */}
            <div className="insights-hero-section">
              <BentoCenterScore
                score={overallScore}
                tierName={tierName}
                percentile={percentile}
                onClick={() => setExpandedMetric('Overall Score')}
                quickStats={quickStats}
              />
            </div>

            {/* Metrics Grid - 3 Columns */}
            <div className="insights-metrics-grid">
              <BentoMetricCard
                title="Academic"
                score={metrics.academic}
                color="blue"
                description="Strong foundation with room for strategic enhancement"
                onClick={() => setExpandedMetric('Academic')}
              />
              <BentoMetricCard
                title="Leadership"
                score={metrics.leadership}
                color="purple"
                description="Exceptional leadership demonstrated across activities"
                onClick={() => setExpandedMetric('Leadership')}
              />
              <BentoMetricCard
                title="Readiness"
                score={metrics.readiness}
                color="green"
                description="Well-prepared for college-level challenges"
                onClick={() => setExpandedMetric('Readiness')}
              />
              <BentoMetricCard
                title="Extracurricular"
                score={metrics.extracurricular}
                color="cyan"
                description="Impressive breadth and depth of involvement"
                onClick={() => setExpandedMetric('Extracurricular')}
              />
              <BentoMetricCard
                title="Course Rigor"
                score={metrics.courseRigor}
                color="indigo"
                description="Strong • 6 APs completed"
                onClick={() => setExpandedMetric('Course Rigor')}
              />
              <BentoMetricCard
                title="Community"
                score={metrics.community}
                color="orange"
                description="Meaningful service and community leadership"
                onClick={() => setExpandedMetric('Community')}
              />
            </div>

            {/* Context Section */}
            <div className="insights-context-section">
              {/* Progress Bar */}
              <BentoProgressBar tierProgress={tierProgress} />

              {/* Bottom Grid */}
              <div className="insights-bottom-grid">
                {/* Achievements */}
                <BentoAchievements achievements={achievements} />

                {/* Comparison Table */}
                <div className="depth-layer-3 holo-surface rounded-2xl p-6 h-full bg-gradient-to-br from-white/95 to-white/85 hover:shadow-depth-4 transition-all duration-500">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">
                    vs Admitted Students
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50">
                      <span className="font-semibold">Elite Schools</span>
                      <span className="text-lg font-bold text-orange-600">-0.7 ⚠</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50">
                      <span className="font-semibold">Target Schools</span>
                      <span className="text-lg font-bold text-green-600">+0.2 ✓</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50">
                      <span className="font-semibold">Safety Schools</span>
                      <span className="text-lg font-bold text-green-600">+1.0 ✓✓</span>
                    </div>
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
