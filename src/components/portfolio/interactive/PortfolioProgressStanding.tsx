import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { TrendingUp, Trophy, Target } from 'lucide-react';
import { PortfolioProgressData } from './types/portfolioTypes';
import { ProgressTimeline } from './ProgressTimeline';
import { CompetitiveSpectrum } from './CompetitiveSpectrum';
import { SchoolTierCard } from './SchoolTierCard';
import GradientText from '@/components/ui/GradientText';

interface PortfolioProgressStandingProps {
  data: PortfolioProgressData;
}

export const PortfolioProgressStanding: React.FC<PortfolioProgressStandingProps> = ({ data }) => {
  return (
    <div className="space-y-8 w-full">
      {/* Hero Stats Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-primary/10 via-secondary/5 to-background backdrop-blur-sm border-2 border-primary/20 shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <GradientText 
                className="text-xs font-bold uppercase tracking-wider mb-2"
                colors={["#a855f7", "#07c6ff"]}
              >
                Portfolio Progress & Standing
              </GradientText>
              <h2 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {data.current.score}
              </h2>
              <Badge 
                variant="default" 
                className="mt-3 text-sm px-4 py-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
              >
                {data.current.tier}
              </Badge>
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center p-4 rounded-xl bg-background/50 border border-border"
              >
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Current Score
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {data.current.score}/100
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center p-4 rounded-xl bg-background/50 border border-border"
              >
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Percentile
                </div>
                <div className="text-3xl font-bold text-primary">
                  {data.current.percentile}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center p-4 rounded-xl bg-background/50 border border-border"
              >
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Growth
                </div>
                <div className="text-3xl font-bold text-success">
                  {data.history.length > 1 
                    ? `+${(data.current.score - data.history[0].score).toFixed(1)}`
                    : '+0.0'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  vs {data.history[0]?.date || 'baseline'}
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress Timeline Section */}
      <Card className="bg-background/95 backdrop-blur-sm border-2 border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <ProgressTimeline 
            history={data.history}
            projection={data.projection}
            currentScore={data.current.score}
          />
        </CardContent>
      </Card>

      {/* Competitive Standing Spectrum */}
      <Card className="bg-background/95 backdrop-blur-sm border-2 border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <CompetitiveSpectrum 
            yourScore={data.competitiveStanding.yourScore}
            spectrum={data.competitiveStanding.spectrum}
          />
        </CardContent>
      </Card>

      {/* School Tier Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold text-foreground">School Tier Analysis</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SchoolTierCard tier={data.competitiveStanding.tiers.safety} index={0} />
          <SchoolTierCard tier={data.competitiveStanding.tiers.target} index={1} />
          <SchoolTierCard tier={data.competitiveStanding.tiers.reach} index={2} />
        </div>
      </div>

      {/* Next Milestones Section */}
      <Card className="bg-gradient-to-br from-accent/10 to-background backdrop-blur-sm border-2 border-accent/20 shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <GradientText
                  className="text-lg font-bold uppercase tracking-wide"
                  colors={["#a855f7", "#07c6ff"]}
                >
                  Next Milestones
                </GradientText>
                <p className="text-xs text-muted-foreground">Path to {data.projection.targetScore}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Target by</div>
              <div className="text-sm font-bold text-foreground">{data.projection.targetDate}</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Progress</span>
              <span>
                {data.nextMilestones.filter(m => m.status === 'completed').length}/{data.nextMilestones.length} completed
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: `${(data.nextMilestones.filter(m => m.status === 'completed').length / data.nextMilestones.length) * 100}%` 
                }}
                transition={{ delay: 0.5, duration: 1 }}
                className="h-full bg-gradient-to-r from-success to-primary"
              />
            </div>
          </div>

          {/* Milestone List */}
          <div className="space-y-3">
            {data.nextMilestones.slice(0, 4).map((milestone, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border hover:border-primary/30 transition-colors"
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  milestone.status === 'completed' 
                    ? 'bg-success text-white' 
                    : milestone.status === 'in-progress'
                    ? 'bg-amber-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {milestone.status === 'completed' ? '✓' : idx + 1}
                </div>
                <div className="flex-1">
                  <div className={`font-medium text-sm ${
                    milestone.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'
                  }`}>
                    {milestone.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-green-600 font-semibold">
                      +{milestone.estimatedImpact} pts
                    </span>
                    {milestone.deadline && (
                      <span className="text-xs text-muted-foreground">
                        • Due: {milestone.deadline}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {data.nextMilestones.length > 4 && (
            <button className="w-full mt-4 text-primary text-sm font-medium hover:text-primary/80 transition-colors flex items-center justify-center gap-1 group">
              View all {data.nextMilestones.length} milestones
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
