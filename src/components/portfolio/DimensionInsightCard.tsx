import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Lightbulb, LucideIcon } from 'lucide-react';
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
    <Card className={cn("bg-white border-2 transition-all duration-300 h-full", className)}>
      <CardContent className="p-6 space-y-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-300"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">{label}</h3>
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
        <div className="space-y-1.5">
          <Progress value={progressPercent} className="h-2" style={{ 
            ['--progress-background' as any]: color 
          }} />
        </div>

        {/* Insight Note */}
        {insight && (
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            {insight}
          </p>
        )}

        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="space-y-2 flex-1">
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Key Strengths Identified
            </div>
            <ul className="space-y-1.5">
              {strengths.slice(0, 3).map((strength, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2 leading-snug">
                  <span className="text-emerald-500 mt-0.5 flex-shrink-0">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Growth Areas */}
        {growthAreas.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" />
              Development Opportunities
            </div>
            <ul className="space-y-1.5">
              {growthAreas.slice(0, 2).map((area, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2 leading-snug">
                  <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Empty State */}
        {strengths.length === 0 && growthAreas.length === 0 && !insight && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-muted-foreground text-center">
              More data needed for detailed analysis
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
