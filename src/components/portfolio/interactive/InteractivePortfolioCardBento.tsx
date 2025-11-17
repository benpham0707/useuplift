import React, { useState } from 'react';
import { BentoMetricCard } from './BentoMetricCard';
import { BentoAchievements } from './BentoAchievements';
import { ScoreOrbitalHero } from './ScoreOrbitalHero';
import { CompetitiveSpectrumCard } from './CompetitiveSpectrumCard';
import { TopContributorsCard } from './TopContributorsCard';
import { QuickStatsGrid } from './QuickStatsGrid';
import { PriorityActionsCard } from './PriorityActionsCard';
import { TierProgressCard } from './TierProgressCard';
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

// Hard-coded mock data for new components
const MOCK_TOP_CONTRIBUTORS = [
  { name: 'Leadership Impact', dimension: 'Leadership', score: 18, color: 'purple', icon: 'Users' as const },
  { name: 'Community Service', dimension: 'Service', score: 14, color: 'green', icon: 'Heart' as const },
  { name: 'Award Recognition', dimension: 'Awards', score: 12, color: 'amber', icon: 'Award' as const },
];

const MOCK_QUICK_STATS = {
  activities: 12,
  hours: 450,
  impactReach: '2.5K',
  recognitions: 8,
};

const MOCK_PRIORITY_ACTIONS = [
  {
    title: 'Start Research Project',
    dimension: 'Academic Differentiation',
    priority: 'high' as const,
    impact: 0.5,
    effort: 'high' as const,
  },
  {
    title: 'Enter National Competition',
    dimension: 'Recognition & Awards',
    priority: 'medium' as const,
    impact: 0.4,
    effort: 'medium' as const,
  },
  {
    title: 'Apply for National Programs',
    dimension: 'Recognition',
    priority: 'low' as const,
    impact: 0.3,
    effort: 'low' as const,
  },
];

const MOCK_SCHOOL_TIERS = [
  { name: 'UC Berkeley', score: 7.8, type: 'safety' as const, color: 'green' },
  { name: 'Northwestern', score: 8.2, type: 'target' as const, color: 'amber' },
  { name: 'MIT', score: 8.9, type: 'reach' as const, color: 'red' },
];

export const InteractivePortfolioCardBento: React.FC<InteractivePortfolioCardBentoProps> = ({
  overallScore,
  tierName,
  percentile,
  metrics,
  achievements,
  tierProgress,
}) => {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  const metricCards = [
    { title: 'Academic', score: metrics.academic, color: 'blue' as const },
    { title: 'Leadership', score: metrics.leadership, color: 'purple' as const },
    { title: 'Readiness', score: metrics.readiness, color: 'cyan' as const },
    { title: 'Extracurricular', score: metrics.extracurricular, color: 'green' as const },
    { title: 'Course Rigor', score: metrics.courseRigor, color: 'indigo' as const },
    { title: 'Community', score: metrics.community, color: 'orange' as const },
  ];

  // Prepare tier progress data with milestones
  const tierProgressData = {
    ...tierProgress,
    milestonesCompleted: 2,
    milestonesTotal: 6,
    milestones: [
      { text: 'Complete 6 AP courses with 5s', completed: true },
      { text: 'Reach 400+ service hours', completed: true },
      { text: 'Start research project or major competition', completed: false },
    ],
  };

  return (
    <div className="relative">
      {/* Modal for Expanded Metric */}
      <AnimatePresence>
        {expandedMetric && (
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
                    <p className="text-muted-foreground">
                      How your score is calculated and what factors contribute to it.
                    </p>
                  </div>
                  <div className="depth-layer-2 rounded-2xl p-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                    <h3 className="font-bold text-lg mb-2">Contributing Factors</h3>
                    <p className="text-muted-foreground">
                      Key activities and achievements that influence this metric.
                    </p>
                  </div>
                  <div className="depth-layer-2 rounded-2xl p-6 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
                    <h3 className="font-bold text-lg mb-2">Recommendations</h3>
                    <p className="text-muted-foreground">
                      Specific actions you can take to improve your score.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedMetric(null)}
                  className="mt-8 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:scale-105 transition-transform"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dashboard Layout */}
      <div className="space-y-6 w-full">
        {/* 1. Hero Score Orbital */}
        <div className="flex justify-center">
          <ScoreOrbitalHero 
            score={overallScore} 
            tier={tierName} 
            percentile={percentile} 
          />
        </div>

        {/* 2. Competitive Context */}
        <CompetitiveSpectrumCard
          userScore={8.2}
          userPercentile={percentile}
          schoolTiers={MOCK_SCHOOL_TIERS}
        />

        {/* 3. Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <TopContributorsCard contributors={MOCK_TOP_CONTRIBUTORS} />
          </div>
          <div className="lg:col-span-2">
            <QuickStatsGrid stats={MOCK_QUICK_STATS} />
          </div>
        </div>

        {/* 4. Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metricCards.map((metric) => (
            <BentoMetricCard
              key={metric.title}
              title={metric.title}
              score={metric.score}
              color={metric.color}
              onClick={() => setExpandedMetric(metric.title)}
            />
          ))}
        </div>

        {/* 5. Action & Progress Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PriorityActionsCard actions={MOCK_PRIORITY_ACTIONS} />
          <TierProgressCard progress={tierProgressData} />
        </div>

        {/* 6. Achievements */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <BentoAchievements achievements={achievements} />
          </div>
        </div>
      </div>
    </div>
  );
};
