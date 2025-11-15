import React from 'react';
import { AttributionData } from './types/portfolioTypes';
import { TrendingUp, Award, Users, BookOpen, Target, Zap, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttributionBreakdownComponentProps {
  data: AttributionData;
  isExpanded: boolean;
}

const iconMap: Record<string, any> = {
  leadership: Users,
  service: Award,
  academic: BookOpen,
  extracurricular: Target,
  awards: Zap,
  default: TrendingUp,
};

export const AttributionBreakdownComponent: React.FC<AttributionBreakdownComponentProps> = ({
  data,
  isExpanded,
}) => {
  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || iconMap.default;
    return <Icon className="w-5 h-5" />;
  };

  if (isExpanded) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold uppercase tracking-wide">
          What Drives Your Score
        </h2>

        <div className="space-y-4">
          {data.contributions.map((contribution) => (
            <div
              key={contribution.id}
              className="depth-layer-3 rounded-2xl p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border border-border"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                  {getIcon(contribution.icon)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold">{contribution.title}</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {contribution.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-mono font-bold text-primary">
                        +{contribution.points}
                      </div>
                      {contribution.percentile && (
                        <div className="text-xs text-muted-foreground">
                          {contribution.percentile}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Point Breakdown */}
                  <div className="mb-4 p-4 rounded-xl bg-background/50">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Point Breakdown
                    </h4>
                    <div className="space-y-2">
                      {contribution.breakdown.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-foreground/80">{item.source}</span>
                          <span className="font-mono font-bold text-primary">
                            +{item.pointValue}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Evidence */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Evidence
                    </h4>
                    <ul className="space-y-1">
                      {contribution.evidence.map((item, idx) => (
                        <li key={idx} className="text-sm text-foreground/80 flex items-start">
                          <span className="text-primary mr-2">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Peer Comparison */}
                  <div className="mb-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50">
                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">
                      Peer Comparison
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      {contribution.peerComparison}
                    </p>
                  </div>

                  {/* Admissions Context */}
                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200/50">
                    <p className="text-xs font-semibold text-purple-900 dark:text-purple-200 mb-1">
                      Why It Matters
                    </p>
                    <p className="text-sm text-purple-800 dark:text-purple-300 italic">
                      {contribution.admissionsContext}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Collapsed view
  const topThree = data.contributions.slice(0, 3);

  return (
    <div className="p-6 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-4">
          What Makes You Stand Out
        </h3>

        <div className="space-y-3">
          {topThree.map((contribution) => (
            <div
              key={contribution.id}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {getIcon(contribution.icon)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{contribution.title}</p>
                  <p className="text-xs text-muted-foreground">{contribution.category}</p>
                </div>
              </div>
              <span className="text-lg font-mono font-bold text-primary">
                +{contribution.points}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-primary font-medium mt-4">
        <span>See all {data.contributions.length} contributors</span>
        <ArrowUpRight className="w-4 h-4" />
      </div>
    </div>
  );
};
