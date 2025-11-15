import React from 'react';
import { CompetitiveStandingData } from './types/portfolioTypes';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompetitiveStandingComponentProps {
  data: CompetitiveStandingData;
  isExpanded: boolean;
}

export const CompetitiveStandingComponent: React.FC<CompetitiveStandingComponentProps> = ({
  data,
  isExpanded,
}) => {
  const getPositionPercentage = () => {
    const range = data.spectrum.max - data.spectrum.min;
    return ((data.yourScore - data.spectrum.min) / range) * 100;
  };

  if (isExpanded) {
    return (
      <div className="space-y-6">
        {/* Fixed Spectrum at Top */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm pb-4 border-b border-border z-10">
          <h2 className="text-2xl font-bold uppercase tracking-wide mb-4">
            Your Competitive Analysis
          </h2>
          <div className="relative h-12 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-lg z-10 transition-all duration-500"
              style={{ left: `calc(${getPositionPercentage()}% - 8px)` }}
            >
              <div className="absolute inset-0 rounded-full animate-ping bg-primary opacity-75"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-between px-4 text-xs font-medium text-muted-foreground">
              <span>{data.spectrum.min}</span>
              <span>UC Berkeley</span>
              <span>MIT</span>
              <span>{data.spectrum.max}</span>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            ↑ You're at <span className="font-mono font-bold text-primary">{data.yourScore}</span>
          </p>
        </div>

        {/* Detailed Tier Cards */}
        <div className="space-y-6">
          {Object.entries(data.tiers).map(([tierKey, tier]) => (
            <div
              key={tierKey}
              className={cn(
                'depth-layer-3 rounded-2xl p-6 border-2',
                tierKey === 'elite' && 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-300',
                tierKey === 'target' && 'bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-300',
                tierKey === 'safety' && 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-300'
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold uppercase">{tier.name}</h3>
                <span
                  className={cn(
                    'px-4 py-1 rounded-full text-sm font-bold',
                    tier.status === 'ahead' && 'bg-green-100 text-green-700',
                    tier.status === 'competitive' && 'bg-amber-100 text-amber-700',
                    tier.status === 'needs-work' && 'bg-red-100 text-red-700'
                  )}
                >
                  {tier.status.replace('-', ' ')}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {tier.schools.join(' • ')}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-xl bg-background/50">
                  <p className="text-xs text-muted-foreground mb-1">Your Score</p>
                  <p className="text-2xl font-mono font-bold">{tier.yourScore}</p>
                </div>
                <div className="p-4 rounded-xl bg-background/50">
                  <p className="text-xs text-muted-foreground mb-1">Avg Admitted</p>
                  <p className="text-2xl font-mono font-bold">{tier.averageAdmitScore}</p>
                </div>
              </div>

              {tier.gap !== 0 && (
                <div className="mb-4 p-4 rounded-xl bg-background/70">
                  <p className="text-sm font-semibold mb-1">
                    Gap: <span className={cn(
                      'font-mono',
                      tier.gap < 0 ? 'text-red-600' : 'text-green-600'
                    )}>
                      {tier.gap > 0 ? '+' : ''}{tier.gap}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tier.gap < 0 ? 'Need to strengthen profile' : 'Above typical admits'}
                  </p>
                </div>
              )}

              {/* Metric Breakdown */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Metric Breakdown
                </h4>
                <div className="space-y-2">
                  {Object.entries(tier.metricBreakdown).map(([metric, data]) => (
                    <div key={metric} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{metric}</span>
                      <span className="font-mono">
                        <span className="text-foreground">{data.yours}</span>
                        <span className="text-muted-foreground mx-2">/</span>
                        <span className="text-primary">{data.needed}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specific Actions */}
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  To Bridge Gap
                </h4>
                <div className="space-y-2">
                  {tier.specificActions.map((action, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-background/50"
                    >
                      <span className="text-primary font-bold text-sm">{idx + 1}.</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{action.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">{action.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admission Probability */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">Admission Probability</p>
                <p className="text-lg font-bold">
                  {tier.admissionProbability.min}% - {tier.admissionProbability.max}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Collapsed view
  return (
    <div className="p-6 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold uppercase tracking-wide mb-4">Where You Stand</h3>
        
        {/* Spectrum Bar */}
        <div className="relative h-8 bg-muted rounded-full overflow-hidden mb-4">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg z-10"
            style={{ left: `calc(${getPositionPercentage()}% - 6px)` }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium text-muted-foreground">
            <span>{data.spectrum.min}</span>
            <span className="text-[10px]">UC Berkeley</span>
            <span className="text-[10px]">MIT</span>
            <span>{data.spectrum.max}</span>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mb-4">
          ↑ You're at <span className="font-mono font-bold">{data.yourScore}</span>
        </p>

        {/* Quick Tier Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>🟢 Safety Tier</span>
            <span className="font-semibold text-green-600">{data.tiers.safety.status}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>🟡 Target Tier</span>
            <span className="font-semibold text-amber-600">{data.tiers.target.status}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>🔴 Reach Tier</span>
            <span className="font-semibold text-red-600">
              {data.tiers.elite.gap < 0 ? `Need +${Math.abs(data.tiers.elite.gap)}` : data.tiers.elite.status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-primary font-medium mt-4">
        <span>Expand for tier analysis</span>
        <ArrowUpRight className="w-4 h-4" />
      </div>
    </div>
  );
};
