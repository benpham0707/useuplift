import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ExtracurricularScoreDisplay } from './ExtracurricularScoreDisplay';

export interface ExtracurricularItem {
  id: string;
  name: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  hoursPerWeek: number;
  weeksPerYear: number;
  category: 'leadership' | 'service' | 'athletics' | 'arts' | 'academic' | 'work' | 'research';
  description: string;
  dateRange: { start: string; end: string; };
  roleEvolution: { current: string; };
  impactMetrics: { tangibilityLevel: string; };
  skillsDeveloped: { technical: string[]; };
  link?: string;
  scores: {
    portfolioContribution: { overall: number; breakdown: { commitmentDepth: number; leadershipTrajectory: number; impactScale: number; narrativeAlignment: number; }; };
    commitment: { overall: number; totalHours: number; consistencyScore: number; roleGrowth: string[]; hoursPerWeek: number; weeksPerYear: number; };
    impact: { overall: number; metrics: Array<{ label: string; value: string; }>; tangibility: number; analysis: string; };
  };
  recommendedUse: 'centerpiece' | 'supporting' | 'breadth' | 'optional';
  applicationGuidance: {
    whyItMatters: string;
    descriptionAnalysis: { strengths: string[]; improvements: string[]; };
    essayFit: Array<{ promptType: string; suitability: number; angle: string; }>;
    descriptionStrength: { clarity: number; specificityScore: number; actionVerbStrength: string; issues: string[]; improvements: string[]; };
  };
  evolution: { milestones: Array<{ date: string; event: string; significance: string; }>; skillsGained: string[]; };
}

interface ExtracurricularCardProps {
  activity: ExtracurricularItem;
}

export const ExtracurricularCard: React.FC<ExtracurricularCardProps> = ({ activity }) => {
  const [whyItMattersExpanded, setWhyItMattersExpanded] = useState(false);

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-extrabold leading-tight flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{activity.name}</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{activity.dateRange?.start || activity.startDate} - {activity.dateRange?.end || activity.endDate}</span>
            <span>•</span>
            <span>{activity.category}</span>
            <span>•</span>
            <span>{activity.scores.commitment.totalHours}h</span>
          </div>
        </div>

        <div className="mb-4"><ExtracurricularScoreDisplay scores={activity.scores} /></div>

        <div className="mb-4 p-3 rounded-lg border bg-muted/20">
          <div className="text-xs font-semibold text-muted-foreground mb-2">At a Glance</div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Role:</span><span className="font-medium">{activity.roleEvolution?.current || activity.role}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Commitment:</span><span className="font-medium">{activity.scores.commitment.hoursPerWeek}h/wk · {activity.scores.commitment.weeksPerYear}w/yr</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Impact:</span><span className="font-medium">{activity.impactMetrics?.tangibilityLevel || 'Quantified'}</span></div>
          </div>
        </div>

        <div className="mb-4 p-3 rounded-lg border bg-muted/10">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Why It Matters</div>
          <p className="text-sm leading-relaxed">{whyItMattersExpanded ? activity.applicationGuidance.whyItMatters : `${activity.applicationGuidance.whyItMatters.slice(0, 120)}...`}</p>
          <button onClick={() => setWhyItMattersExpanded(!whyItMattersExpanded)} className="text-xs text-primary hover:underline mt-2 flex items-center gap-1">
            {whyItMattersExpanded ? <><span>Show less</span> <ChevronUp className="h-3 w-3" /></> : <><span>Read more</span> <ChevronDown className="h-3 w-3" /></>}
          </button>
        </div>

        <div className="mt-auto">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Description Analysis</div>
          <div className="space-y-2">
            <div className="p-2 rounded bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <div className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">Strengths</div>
              <ul className="text-xs text-green-700 dark:text-green-400 space-y-1">{activity.applicationGuidance.descriptionAnalysis.strengths.map((s, i) => <li key={i}>• {s}</li>)}</ul>
            </div>
            <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <div className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">Improvements</div>
              <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1">{activity.applicationGuidance.descriptionAnalysis.improvements.map((imp, i) => <li key={i}>• {imp}</li>)}</ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
