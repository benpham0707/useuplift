import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ExternalLink, MapPin, Calendar, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecognitionScoreBadge } from './RecognitionScoreBadge';
import { UsageGuidancePanel, UsageGuidance } from './UsageGuidancePanel';

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

export const RecognitionCard: React.FC<RecognitionCardProps> = ({ recognition }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const tierStyle = tierConfig[recognition.tier];
  const useStyle = useConfig[recognition.recommendedUse];
  const { scores } = recognition;

  return (
    <Card className="border-primary/20 hover:border-primary/40 transition-all">
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-bold text-foreground leading-tight">
              {recognition.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{recognition.issuer}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {recognition.date}
              </div>
            </div>
          </div>
          {recognition.link && (
            <a
              href={recognition.link}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <ExternalLink className="w-4 h-4 text-primary hover:text-primary/80" />
            </a>
          )}
        </div>

        {/* Scores */}
        <div className="flex items-center gap-3 flex-wrap">
          <RecognitionScoreBadge
            score={scores.impressiveness.overall}
            label="Impressiveness"
            breakdown={[
              { label: 'Selectivity', value: scores.impressiveness.breakdown.selectivity },
              { label: 'Issuer Prestige', value: scores.impressiveness.breakdown.issuerPrestige },
              { label: 'Field Scale', value: scores.impressiveness.breakdown.fieldScale },
              { label: 'Recency', value: scores.impressiveness.breakdown.recency }
            ]}
          />
          <RecognitionScoreBadge
            score={scores.narrativeFit.overall}
            label="Narrative Fit"
          />
          <RecognitionScoreBadge
            score={scores.portfolioLift.overall}
            label="Portfolio Lift"
          />
          <Badge 
            className={cn(
              'text-xs px-3 py-1 bg-gradient-to-r text-white font-semibold',
              useStyle.gradient
            )}
          >
            {useStyle.icon} {useStyle.label}
          </Badge>
        </div>

        {/* Quick Facts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={cn('px-3 py-2 rounded-lg border', tierStyle.bg)}>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span className={cn('text-xs font-semibold', tierStyle.color)}>
                {tierStyle.label}
              </span>
            </div>
            {recognition.selectivity && (
              <div className="text-xs text-muted-foreground mt-1">
                {recognition.selectivity.description}
              </div>
            )}
          </div>

          <div className="px-3 py-2 rounded-lg border bg-primary/5">
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">
                {scores.narrativeFit.spineAlignment}% aligned
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              to your spine
            </div>
          </div>

          <div className="px-3 py-2 rounded-lg border bg-muted/30">
            <div className="text-xs font-semibold text-foreground">
              Themes Supported
            </div>
            <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {scores.narrativeFit.themeSupport.join(', ')}
            </div>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Close Analysis
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              View Analysis & Guidance
            </>
          )}
        </Button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-5 pt-4 border-t animate-accordion-down">
            {/* Impressiveness Breakdown */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-foreground">
                IMPRESSIVENESS BREAKDOWN ({scores.impressiveness.overall.toFixed(1)}/10)
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Selectivity:</span>
                  <span className="font-semibold">{scores.impressiveness.breakdown.selectivity.toFixed(1)}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issuer Prestige:</span>
                  <span className="font-semibold">{scores.impressiveness.breakdown.issuerPrestige.toFixed(1)}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Field Scale:</span>
                  <span className="font-semibold">{scores.impressiveness.breakdown.fieldScale.toFixed(1)}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recency:</span>
                  <span className="font-semibold">{scores.impressiveness.breakdown.recency.toFixed(1)}/10</span>
                </div>
              </div>
              {recognition.selectivity && (
                <div className="text-sm text-muted-foreground">
                  {recognition.selectivity.accepted} selected from {recognition.selectivity.applicants} applicants ({(recognition.selectivity.acceptanceRate * 100).toFixed(1)}%)
                </div>
              )}
            </div>

            {/* Narrative Fit Analysis */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-foreground">
                NARRATIVE FIT ANALYSIS ({scores.narrativeFit.overall.toFixed(1)}/10)
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {scores.narrativeFit.analysis}
              </p>
            </div>

            {/* Portfolio Lift */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-foreground">
                WHY IT LIFTS YOUR PORTFOLIO ({scores.portfolioLift.overall.toFixed(1)}/10)
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                {scores.portfolioLift.reasoning}
              </p>
              <ul className="space-y-1.5">
                {scores.portfolioLift.strategicValue.map((value, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Divider */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge className={cn('bg-gradient-to-r text-white font-semibold', useStyle.gradient)}>
                  {useStyle.icon} RECOMMENDED USE: {useStyle.label}
                </Badge>
              </div>

              {/* Usage Guidance */}
              <UsageGuidancePanel guidance={recognition.usageGuidance} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
