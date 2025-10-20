import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UsageGuidance } from './UsageGuidancePanel';

export interface RecognitionItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  tier: 'national' | 'state' | 'regional' | 'school';
  type: 'award' | 'partnership' | 'media' | 'institutional' | 'peer';
  link?: string;
  selectivity?: {
    accepted: number;
    applicants: number;
    acceptanceRate: number;
    description: string;
  };
  scores: {
    impressiveness: {
      overall: number;
      breakdown: {
        selectivity: number;
        issuerPrestige: number;
        fieldScale: number;
        recency: number;
      };
    };
    narrativeFit: {
      overall: number;
      analysis: string;
      spineAlignment: number;
      themeSupport: string[];
    };
    portfolioLift: {
      overall: number;
      reasoning: string;
      strategicValue: string[];
    };
  };
  recommendedUse: 'flagship' | 'bridge' | 'support' | 'footnote' | 'archive';
  usageGuidance: UsageGuidance;
}

interface RecognitionCardProps {
  recognition: RecognitionItem;
  onViewAnalysis: () => void;
}

const tierConfig = {
  national: { label: 'National', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  state: { label: 'State', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  regional: { label: 'Regional', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
  school: { label: 'School', color: 'text-muted-foreground', bg: 'bg-muted/50' }
};

const useConfig = {
  flagship: { label: 'FLAGSHIP', icon: '⭐', gradient: 'from-amber-500 to-yellow-400' },
  bridge: { label: 'BRIDGE', icon: '🌉', gradient: 'from-blue-500 to-cyan-400' },
  support: { label: 'SUPPORT', icon: '📋', gradient: 'from-green-500 to-emerald-400' },
  footnote: { label: 'FOOTNOTE', icon: '📝', gradient: 'from-gray-400 to-slate-400' },
  archive: { label: 'ARCHIVE', icon: '📦', gradient: 'from-gray-300 to-gray-400' }
};

export const RecognitionCard: React.FC<RecognitionCardProps> = ({ recognition, onViewAnalysis }) => {
  const useStyle = useConfig[recognition.recommendedUse];
  const { scores } = recognition;

  const getScoreColor = (score: number) => {
    if (score >= 9.0) return 'text-amber-600 dark:text-amber-400';
    if (score >= 7.5) return 'text-green-600 dark:text-green-400';
    if (score >= 6.0) return 'text-blue-600 dark:text-blue-400';
    return 'text-muted-foreground';
  };

  const scoreColor = getScoreColor(scores.portfolioLift.overall);

  return (
    <Card className="border hover:border-primary/40 transition-all">
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <h3 className="text-xl font-bold text-foreground leading-tight">
              {recognition.name}
            </h3>
            <div className="text-sm text-muted-foreground">
              {recognition.issuer} • {recognition.date}
            </div>
          </div>
          {recognition.link && (
            <a
              href={recognition.link}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </a>
          )}
        </div>

        {/* Portfolio Lift Score & Badge */}
        <div className="flex items-center gap-4">
          <div className="flex-1 text-center py-4 border rounded-lg bg-muted/30">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              PORTFOLIO LIFT
            </div>
            <div className={cn('text-4xl font-bold', scoreColor)}>
              {scores.portfolioLift.overall.toFixed(1)}
              <span className="text-xl text-muted-foreground">/10</span>
            </div>
          </div>
          <Badge className="text-xs px-3 py-1.5 bg-foreground text-background whitespace-nowrap">
            {useStyle.icon} {useStyle.label}
          </Badge>
        </div>

        {/* Quick Facts - One Line */}
        <div className="text-sm text-muted-foreground text-center">
          {recognition.selectivity && (
            <>{recognition.selectivity.description} • </>
          )}
          {scores.narrativeFit.spineAlignment}% spine match
        </div>

        {/* View Analysis CTA */}
        <Button
          variant="outline"
          className="w-full"
          onClick={onViewAnalysis}
        >
          View Full Analysis →
        </Button>
      </CardContent>
    </Card>
  );
};
