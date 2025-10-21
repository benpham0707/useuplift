import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GapAnalysisGrowth {
  criticalGaps: Array<{
    issue: string;
    impact: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  minorGaps: string[];
  diminishingReturns: Array<{
    category: string;
    currentCount: number;
    recommendation: string;
  }>;
  growthTrajectory: {
    timelineData: Array<{ quarter: string; count: number }>;
    trend: 'accelerating' | 'steady' | 'declining';
    analysis: string;
  };
  seniorYearStrategy?: {
    timeRemaining: string;
    realisticTargets: string[];
    strategicTiming: string[];
    actionsTabCTA: string;
  };
}

interface GapAnalysisGrowthTabProps {
  data: GapAnalysisGrowth;
}

const priorityColors = {
  HIGH: 'border-l-4 border-l-destructive bg-destructive/5',
  MEDIUM: 'border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20',
  LOW: 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
};

const priorityIcons = {
  HIGH: AlertTriangle,
  MEDIUM: TrendingUp,
  LOW: CheckCircle
};

export const GapAnalysisGrowthTab: React.FC<GapAnalysisGrowthTabProps> = ({ data }) => {
  const navigate = useNavigate();
  
  const trendEmoji = {
    accelerating: '↗️',
    steady: '→',
    declining: '↘️'
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Gaps */}
      <Card className="p-6">
        <h3 className="text-xl md:text-2xl font-extrabold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Portfolio Gaps</h3>
        
        <div className="space-y-3 mb-4">
          <div className="text-sm font-semibold text-muted-foreground mb-2">Critical Gaps (would significantly strengthen):</div>
          {data.criticalGaps.map((gap, idx) => {
            const Icon = priorityIcons[gap.priority];
            return (
              <div key={idx} className={`p-4 rounded-lg ${priorityColors[gap.priority]}`}>
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-sm mb-1">{gap.issue}</div>
                    <div className="text-sm text-muted-foreground mb-2">{gap.impact}</div>
                    <div className="text-xs font-semibold">Priority: {gap.priority}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {data.minorGaps.length > 0 && (
          <div>
            <div className="text-sm font-semibold text-muted-foreground mb-2">Minor Gaps (nice to have, not critical):</div>
            <ul className="space-y-2">
              {data.minorGaps.map((gap, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Diminishing Returns Analysis */}
      <Card className="p-6">
        <h3 className="text-xl md:text-2xl font-extrabold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Diminishing Returns Analysis</h3>
        <div className="text-sm text-muted-foreground mb-4">Where you have ENOUGH (don't pursue more):</div>
        
        <div className="space-y-3">
          {data.diminishingReturns.map((item, idx) => (
            <div key={idx} className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
              <div className="flex items-start gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold text-sm">{item.category}: {item.currentCount} is sufficient</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground pl-7">{item.recommendation}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Growth Trajectory */}
      <Card className="p-6">
        <h3 className="text-xl md:text-2xl font-extrabold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Growth Trajectory</h3>
        <div className="text-sm text-muted-foreground mb-4">Recognition Earning Timeline:</div>
        
        <div className="space-y-2 mb-4">
          {data.growthTrajectory.timelineData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
              <span className="text-sm font-medium">{item.quarter}</span>
              <span className="text-sm">{item.count} recognition{item.count !== 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg border bg-primary/5 mb-4">
          <div className="text-sm font-semibold mb-1">
            Trajectory: <span className="capitalize">{data.growthTrajectory.trend}</span> {trendEmoji[data.growthTrajectory.trend]}
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {data.growthTrajectory.analysis}
        </p>
      </Card>

      {/* Senior Year Strategy (if applicable) */}
      {data.seniorYearStrategy && (
        <Card className="p-6">
          <h3 className="text-xl md:text-2xl font-extrabold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Senior Year Strategy</h3>
          
          <div className="mb-4 p-3 rounded-lg border bg-muted/10">
            <div className="text-sm font-semibold mb-1">Time Remaining</div>
            <div className="text-sm text-muted-foreground">{data.seniorYearStrategy.timeRemaining}</div>
          </div>

          <div className="mb-4">
            <div className="text-sm font-semibold mb-2">Realistic Targets:</div>
            <ul className="space-y-1">
              {data.seniorYearStrategy.realisticTargets.map((target, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{target}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <div className="text-sm font-semibold mb-2">Strategic Timing:</div>
            <ul className="space-y-1">
              {data.seniorYearStrategy.strategicTiming.map((timing, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{timing}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span className="text-xl">💡</span>
              <span>Ready to strengthen your recognition portfolio?</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {data.seniorYearStrategy.actionsTabCTA}
            </p>
            <Button 
              onClick={() => navigate('/portfolio-insights?tab=actions')}
              className="w-full"
            >
              Go to Actions Tab <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Call to Action for Actions Tab */}
      {!data.seniorYearStrategy && (
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="text-sm font-semibold mb-2 flex items-center gap-2">
            <span className="text-xl">💡</span>
            <span>Ready to strengthen your recognition portfolio?</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            See personalized competition recommendations, deadlines, and application strategies.
          </p>
          <Button 
            onClick={() => navigate('/portfolio-insights?tab=actions')}
            className="w-full"
          >
            Go to Actions Tab <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Card>
      )}
    </div>
  );
};
