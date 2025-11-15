import React, { useState } from 'react';
import { BentoMetricCard } from './BentoMetricCard';
import { BentoAchievements } from './BentoAchievements';
import { Achievement } from '../portfolioInsightsData';
import { motion, AnimatePresence } from 'motion/react';
import { ExpandableWrapper } from './ExpandableWrapper';
import { ProfileStoryComponent } from './ProfileStoryComponent';
import { CompetitiveStandingComponent } from './CompetitiveStandingComponent';
import { AttributionBreakdownComponent } from './AttributionBreakdownComponent';
import { NextStepsComponent } from './NextStepsComponent';
import { ProgressTrackingComponent } from './ProgressTrackingComponent';
import {
  MOCK_PROFILE_STORY,
  MOCK_COMPETITIVE_STANDING,
  MOCK_ATTRIBUTION,
  MOCK_NEXT_STEPS,
  MOCK_PROGRESS_TRACKING,
} from './mockPortfolioData';
import { cn } from '@/lib/utils';

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
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null);

  const handleComponentToggle = (componentId: string) => {
    setExpandedComponent(expandedComponent === componentId ? null : componentId);
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
                  className="mt-8 px-8 py-3 bg-gradient-to-r from-primary to-cyan-500 text-white rounded-xl hover:shadow-depth-3 transition-all duration-300 font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <div className="insights-dashboard-container">
            {/* Profile Story Component */}
            <div className={cn(
              'profile-story-section transition-all duration-300',
              expandedComponent && expandedComponent !== 'profile-story' && 'opacity-40 blur-sm pointer-events-none'
            )}>
              <ExpandableWrapper
                id="profile-story"
                isExpanded={expandedComponent === 'profile-story'}
                onToggle={() => handleComponentToggle('profile-story')}
                shapeClass="shape-profile angular-border"
                expandedHeight="85vh"
                collapsedContent={
                  <ProfileStoryComponent data={MOCK_PROFILE_STORY} isExpanded={false} />
                }
                className="depth-layer-3 bg-gradient-to-br from-background to-muted/20 hover:shadow-depth-3 transition-all duration-300"
              >
                <ProfileStoryComponent data={MOCK_PROFILE_STORY} isExpanded={true} />
              </ExpandableWrapper>
            </div>

            {/* Metrics Grid - Keep Existing */}
            <div className={cn(
              'insights-metrics-grid transition-all duration-300',
              expandedComponent && 'opacity-40 blur-sm pointer-events-none'
            )}>
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

            {/* Competitive Standing and Attribution */}
            <div className="insights-two-column-section">
              <div className={cn(
                'transition-all duration-300',
                expandedComponent && expandedComponent !== 'competitive' && 'opacity-40 blur-sm pointer-events-none'
              )}>
                <ExpandableWrapper
                  id="competitive"
                  isExpanded={expandedComponent === 'competitive'}
                  onToggle={() => handleComponentToggle('competitive')}
                  shapeClass="shape-competitive angular-border"
                  expandedHeight="80vh"
                  collapsedContent={
                    <CompetitiveStandingComponent data={MOCK_COMPETITIVE_STANDING} isExpanded={false} />
                  }
                  className="depth-layer-3 bg-gradient-to-br from-background to-muted/20 hover:shadow-depth-3 transition-all duration-300 h-full"
                >
                  <CompetitiveStandingComponent data={MOCK_COMPETITIVE_STANDING} isExpanded={true} />
                </ExpandableWrapper>
              </div>

              <div className={cn(
                'transition-all duration-300',
                expandedComponent && expandedComponent !== 'attribution' && 'opacity-40 blur-sm pointer-events-none'
              )}>
                <ExpandableWrapper
                  id="attribution"
                  isExpanded={expandedComponent === 'attribution'}
                  onToggle={() => handleComponentToggle('attribution')}
                  shapeClass="shape-attribution angular-border"
                  expandedHeight="75vh"
                  collapsedContent={
                    <AttributionBreakdownComponent data={MOCK_ATTRIBUTION} isExpanded={false} />
                  }
                  className="depth-layer-3 bg-gradient-to-br from-background to-muted/20 hover:shadow-depth-3 transition-all duration-300 h-full"
                >
                  <AttributionBreakdownComponent data={MOCK_ATTRIBUTION} isExpanded={true} />
                </ExpandableWrapper>
              </div>
            </div>

            {/* Next Steps and Progress */}
            <div className="insights-two-column-section-alt">
              <div className={cn(
                'transition-all duration-300',
                expandedComponent && expandedComponent !== 'next-steps' && 'opacity-40 blur-sm pointer-events-none'
              )}>
                <ExpandableWrapper
                  id="next-steps"
                  isExpanded={expandedComponent === 'next-steps'}
                  onToggle={() => handleComponentToggle('next-steps')}
                  shapeClass="shape-next-steps angular-border"
                  expandedHeight="80vh"
                  collapsedContent={<NextStepsComponent data={MOCK_NEXT_STEPS} isExpanded={false} />}
                  className="depth-layer-3 bg-gradient-to-br from-background to-muted/20 hover:shadow-depth-3 transition-all duration-300 h-full"
                >
                  <NextStepsComponent data={MOCK_NEXT_STEPS} isExpanded={true} />
                </ExpandableWrapper>
              </div>

              <div className={cn(
                'transition-all duration-300',
                expandedComponent && expandedComponent !== 'progress' && 'opacity-40 blur-sm pointer-events-none'
              )}>
                <ExpandableWrapper
                  id="progress"
                  isExpanded={expandedComponent === 'progress'}
                  onToggle={() => handleComponentToggle('progress')}
                  shapeClass="shape-progress angular-border"
                  expandedHeight="70vh"
                  collapsedContent={
                    <ProgressTrackingComponent data={MOCK_PROGRESS_TRACKING} isExpanded={false} />
                  }
                  className="depth-layer-3 bg-gradient-to-br from-background to-muted/20 hover:shadow-depth-3 transition-all duration-300 h-full"
                >
                  <ProgressTrackingComponent data={MOCK_PROGRESS_TRACKING} isExpanded={true} />
                </ExpandableWrapper>
              </div>
            </div>

            {/* Achievements Grid - Keep Existing */}
            <div className={cn(
              'insights-achievements-section transition-all duration-300',
              expandedComponent && 'opacity-40 blur-sm pointer-events-none'
            )}>
              <BentoAchievements achievements={achievements} />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
