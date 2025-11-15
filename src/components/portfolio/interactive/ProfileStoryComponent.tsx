import React from 'react';
import { TrendingUp, Target, Award, ArrowUpRight } from 'lucide-react';
import { ProfileStoryData } from './types/portfolioTypes';
import { cn } from '@/lib/utils';

interface ProfileStoryComponentProps {
  data: ProfileStoryData;
  isExpanded: boolean;
}

export const ProfileStoryComponent: React.FC<ProfileStoryComponentProps> = ({
  data,
  isExpanded,
}) => {
  if (isExpanded) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary mb-6 relative">
            <div className="absolute inset-0 rounded-full animate-pulse bg-primary/20"></div>
            <span className="text-4xl font-bold text-primary-foreground relative z-10">
              {data.score}
            </span>
          </div>
          <h2 className="text-3xl font-bold mb-2">{data.tierName}</h2>
        </div>

        {/* Full Narrative */}
        <div className="space-y-6">
          {data.summarySentences.map((sentence, idx) => (
            <p key={idx} className="text-lg leading-relaxed text-foreground/90">
              {sentence}
            </p>
          ))}
        </div>

        {/* Strengths Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold uppercase tracking-wide text-primary">
            Your Top Strengths
          </h3>
          <div className="grid gap-4">
            {data.fullNarrative.strengths.map((strength, idx) => (
              <div
                key={idx}
                className="depth-layer-3 rounded-2xl p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border border-border/50"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-bold">{strength.title}</h4>
                      <div className="text-sm font-mono font-bold text-primary">
                        {strength.score}/10
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {strength.percentile}
                    </p>
                    <ul className="space-y-2 mt-4">
                      {strength.evidence.map((item, i) => (
                        <li key={i} className="text-sm text-foreground/80 flex items-start">
                          <span className="text-primary mr-2">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-sm font-medium text-primary italic">
                      {strength.impactStatement}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunities Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold uppercase tracking-wide text-amber-600">
            Opportunities to Grow
          </h3>
          <div className="grid gap-4">
            {data.fullNarrative.opportunities.map((opp, idx) => (
              <div
                key={idx}
                className="depth-layer-3 rounded-2xl p-6 bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-200/50"
              >
                <h4 className="text-lg font-bold mb-2">{opp.title}</h4>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-sm text-muted-foreground">
                    Current: <span className="font-mono font-bold">{opp.currentScore}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">→</span>
                  <span className="text-sm text-green-600">
                    Target: <span className="font-mono font-bold">{opp.targetScore}</span>
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-3">{opp.whyItMatters}</p>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2">
                    Action Item:
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-300">{opp.specificAction}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    {opp.estimatedImpact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* School Fit */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold uppercase tracking-wide text-primary">
            Your School Positioning
          </h3>
          <div className="grid gap-4">
            {Object.entries(data.fullNarrative.schoolFit).map(([tier, info]) => (
              <div
                key={tier}
                className={cn(
                  'depth-layer-3 rounded-2xl p-6 border',
                  tier === 'elite' && 'bg-gradient-to-br from-red-500/5 to-orange-500/5 border-red-200/50',
                  tier === 'target' && 'bg-gradient-to-br from-amber-500/5 to-yellow-500/5 border-amber-200/50',
                  tier === 'safety' && 'bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-200/50'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-bold capitalize">{tier} Tier</h4>
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-bold',
                      tier === 'elite' && 'bg-red-100 text-red-700',
                      tier === 'target' && 'bg-amber-100 text-amber-700',
                      tier === 'safety' && 'bg-green-100 text-green-700'
                    )}
                  >
                    {info.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {info.schools.join(' • ')}
                </p>
                {info.gap !== 0 && (
                  <p className="text-sm font-medium">
                    Gap: <span className="font-mono">{info.gap > 0 ? '+' : ''}{info.gap}</span> points
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Collapsed view
  return (
    <div className="p-6 h-full flex items-center gap-6">
      <div className="relative flex-shrink-0">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <span className="text-3xl font-bold text-primary-foreground">{data.score}</span>
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold mb-2">{data.tierName}</h3>
        {data.summarySentences.slice(0, 2).map((sentence, idx) => (
          <p key={idx} className="text-sm text-muted-foreground leading-relaxed">
            {sentence}
          </p>
        ))}
        <div className="flex items-center gap-2 mt-3 text-sm text-primary font-medium">
          <span>Expand for full story</span>
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
