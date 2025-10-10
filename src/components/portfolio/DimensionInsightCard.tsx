import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Lightbulb, Info, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DimensionInsightCardProps {
  label: string;
  icon: LucideIcon;
  color: string;
  score: number | null;
  strengths?: string[];
  growthAreas?: string[];
  insight?: string;
  className?: string;
}

export const DimensionInsightCard: React.FC<DimensionInsightCardProps> = ({
  label,
  icon: Icon,
  color,
  score,
  strengths = [],
  growthAreas = [],
  insight,
  className
}) => {
  const scoreValue = score !== null ? score : 0;
  const progressPercent = Math.min(100, Math.max(0, scoreValue * 10));

  return (
    <Card 
      className={cn(
        "bg-white border-2 transition-all duration-300 hover:shadow-lg border-l-4",
        className
      )}
      style={{ borderLeftColor: color }}
    >
      <CardContent className="p-6 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">{label}</h3>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold" style={{ color }}>
                  {score !== null ? score.toFixed(1) : '—'}
                </span>
                <span className="text-xs text-muted-foreground">/10</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <Progress value={progressPercent} className="h-2" style={{ 
            ['--progress-background' as any]: color 
          }} />
        </div>

        {/* Two-Column Grid for Strengths & Growth */}
        {(strengths.length > 0 || growthAreas.length > 0) && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            {/* Strengths Column */}
            {strengths.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Strengths
                </div>
                <ul className="space-y-1.5">
                  {strengths.slice(0, 2).map((strength, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5 leading-snug">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Growth Areas Column */}
            {growthAreas.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Growth
                </div>
                <ul className="space-y-1.5">
                  {growthAreas.slice(0, 2).map((area, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5 leading-snug">
                      <Lightbulb className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Insight Footer */}
        {insight && (
          <div className="pt-2 mt-1">
            <div className="flex items-start gap-2 text-xs bg-blue-50 rounded-lg p-2">
              <Info className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-blue-900 leading-snug">{insight}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {strengths.length === 0 && growthAreas.length === 0 && !insight && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground text-center py-3">
              More data needed for detailed analysis
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
