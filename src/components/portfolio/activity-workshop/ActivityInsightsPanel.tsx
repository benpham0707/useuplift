import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Brain, BookOpen, Sparkles } from 'lucide-react';
import type { ActivityWorkshopPipelineResult } from './mockData';

type MetricId = 'harvard' | 'coherence' | 'activityScore' | 'descriptionScore' | 'spike';

interface ActivityInsightsPanelProps {
  selectedMetric: MetricId;
  data: ActivityWorkshopPipelineResult;
  carrotLeft: number | null;
}

const ActivityInsightsPanel: React.FC<ActivityInsightsPanelProps> = ({
  selectedMetric,
  data,
  carrotLeft,
}) => {
  const renderContent = () => {
    switch (selectedMetric) {
      case 'harvard': {
        const scale = data.stage3.finalAssessment.harvardScale;
        const labels: Record<number, string> = { 1: 'Outstanding', 2: 'Very Strong', 3: 'Competitive', 4: 'Developing', 5: 'Needs Work', 6: 'Weak' };
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <h4 className="font-semibold text-foreground">Harvard Scale: {scale}/6 — {labels[scale]}</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              This rating reflects overall portfolio strength using the Harvard admissions framework. A score of {scale} means your profile is {labels[scale]?.toLowerCase()}.
            </p>
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium text-foreground mb-1">What would improve it:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Achieve Tier 1 recognition in at least one activity (national/international level)</li>
                <li>Strengthen research with peer-reviewed publication</li>
                <li>Develop deeper spike with measurable outcomes</li>
              </ul>
            </div>
          </div>
        );
      }
      case 'coherence': {
        const score = data.stage1.coherenceAnalysis.score;
        const theme = data.stage1.coherenceAnalysis.primaryTheme;
        const threads = data.stage0.narrativeThreads;
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <h4 className="font-semibold text-foreground">Coherence: {score}/100</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Primary theme: <span className="text-foreground font-medium">{theme}</span>. Your activities tell a {score >= 70 ? 'unified' : 'somewhat fragmented'} story.
            </p>
            <div className="space-y-2">
              {threads.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    t.strength === 'strong' ? 'bg-green-500' : t.strength === 'emerging' ? 'bg-amber-500' : 'bg-muted-foreground'
                  )} />
                  <span className="text-foreground">{t.thread}</span>
                  <Badge variant="secondary" className="text-[10px]">{t.strength}</Badge>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'activityScore': {
        const scores = data.scoring?.activityScores || [];
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <h4 className="font-semibold text-foreground">Activity Score Breakdown</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Weighted across tier assessment (30%), recognition (25%), commitment (17.5%), community (15%), and leadership (12.5%).
            </p>
            <div className="space-y-2">
              {scores.map((s) => (
                <div key={s.activityId} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{s.activityTitle}</span>
                  <span className="font-mono font-medium text-foreground">{s.activityScore.total.toFixed(1)}/10</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'descriptionScore': {
        const scores = data.scoring?.activityScores || [];
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <h4 className="font-semibold text-foreground">Description Score Breakdown</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Evaluates specificity, impact clarity, authenticity, action language, and quantification for the 150-character Common App limit.
            </p>
            <div className="space-y-2">
              {scores.map((s) => (
                <div key={s.activityId} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{s.activityTitle}</span>
                  <span className="font-mono font-medium text-foreground">{s.descriptionScore.total.toFixed(1)}/10</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'spike': {
        const spike = data.stage0.spikeHypothesis;
        const spikeActivities = data.finalNarrative?.spike?.primarySpike?.activities || [];
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <h4 className="font-semibold text-foreground">Spike: {spike.spikeArea || 'None detected'}</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Maturity: <Badge variant="secondary" className="capitalize">{spike.maturity}</Badge>
              {spike.maturity === 'emerging' && ' — Your spike is developing but needs deeper demonstration.'}
              {spike.maturity === 'mature' && ' — Your spike is well-established with clear evidence.'}
            </p>
            {spikeActivities.length > 0 && (
              <div className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">Connected activities:</span>{' '}
                {spikeActivities.join(', ')}
              </div>
            )}
          </div>
        );
      }
    }
  };

  return (
    <div className="relative">
      {/* Carrot/arrow indicator */}
      {carrotLeft !== null && (
        <div
          className="absolute -top-2 w-4 h-4 bg-card border-t border-l border-blue-500/30 rotate-45 z-10"
          style={{ left: carrotLeft - 8 }}
        />
      )}
      <Card className="border-blue-500/20 bg-card/90 backdrop-blur-sm">
        <CardContent className="p-5">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityInsightsPanel;
