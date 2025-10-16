import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Rocket, Target, AlertTriangle, ArrowRight } from 'lucide-react';
import { HolisticSummary, renderRich } from '../portfolioInsightsData';

interface OverviewTabProps {
  summary: HolisticSummary;
  onNavigateToTab?: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ summary, onNavigateToTab }) => {
  const insight = summary.overarchingInsight;

  if (!insight) return null;

  return (
    <div className="space-y-12 pb-12">
      {/* Spine, Spike, Lift - Three Column Layout */}
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Your Portfolio Verdict</h2>
          <p className="text-muted-foreground">The backbone of your narrative, your strengths to amplify, and critical improvements needed</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* SPIKE - What to amplify */}
          <Card className="relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background hover:shadow-lg transition-shadow">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Rocket className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <Badge variant="default" className="mb-1">Your Spike</Badge>
                  <h3 className="text-xl font-bold text-foreground">What Stands Out</h3>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">
                {renderRich(insight.verdict.spike)}
              </p>
            </div>
          </Card>

          {/* SPINE - Thematic thread */}
          <Card className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-background hover:shadow-lg transition-shadow">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <Target className="w-6 h-6 text-green-600 dark:text-green-500" />
                </div>
                <div>
                  <Badge variant="outline" className="mb-1 border-green-500/50">Your Spine</Badge>
                  <h3 className="text-xl font-bold text-foreground">Narrative Thread</h3>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">
                {renderRich(insight.verdict.spine)}
              </p>
            </div>
          </Card>

          {/* LIFT - Biggest improvement */}
          <Card className="relative overflow-hidden border-2 border-destructive/30 bg-gradient-to-br from-destructive/5 to-background hover:shadow-lg transition-shadow">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-destructive/10">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <Badge variant="destructive" className="mb-1">Critical Lift</Badge>
                  <h3 className="text-xl font-bold text-foreground">What to Improve</h3>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">
                {renderRich(insight.verdict.lift)}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Story Coherence */}
      <Card className="border-2">
        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-foreground">Story Coherence</h3>
              <div className="text-2xl font-bold text-primary">{insight.storyCoherencePercent}%</div>
            </div>
            <Progress value={insight.storyCoherencePercent} className="h-3 mb-4" />
            <p className="text-sm leading-relaxed text-foreground/90">
              {renderRich(insight.storyCoherenceLine)}
            </p>
          </div>
        </div>
      </Card>

      {/* How to Tell This Story */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <Badge variant="default" className="text-xs">Strategic Positioning</Badge>
            <h3 className="text-2xl font-bold text-foreground">How to Tell This Story</h3>
          </div>
          
          <p className="text-base leading-relaxed text-foreground/90">
            {renderRich(insight.concludingNarrative)}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Button 
              onClick={() => onNavigateToTab?.('evidence')}
              size="lg"
            >
              View Detailed Evidence
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              onClick={() => onNavigateToTab?.('recommendations')}
              variant="outline"
              size="lg"
            >
              See Recommendations
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
