import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import GradientText from '@/components/ui/GradientText';

interface ScoreBreakdown {
  overall: number;
  breakdown?: {
    selectivity?: number;
    issuerPrestige?: number;
    fieldScale?: number;
    recency?: number;
  };
}

interface RecognitionScoreDisplayProps {
  portfolioLift: number;
  impressiveness: ScoreBreakdown;
  narrativeFit: ScoreBreakdown;
  className?: string;
}

const getScoreColor = (score: number) => {
  if (score >= 9.0) return 'text-amber-600 dark:text-amber-400';
  if (score >= 7.5) return 'text-green-600 dark:text-green-400';
  if (score >= 6.0) return 'text-blue-600 dark:text-blue-400';
  return 'text-gray-600 dark:text-gray-400';
};

const getScoreLabel = (score: number) => {
  if (score >= 9.0) return 'Exceptional';
  if (score >= 7.5) return 'Strong';
  if (score >= 6.0) return 'Developing';
  return 'Supporting';
};

export const RecognitionScoreDisplay: React.FC<RecognitionScoreDisplayProps> = ({
  portfolioLift,
  impressiveness,
  narrativeFit,
  className
}) => {
  const renderScore = (value: number, sizeClass: string = 'text-2xl') => {
    if (value >= 9.0) {
      return (
        <GradientText
          className={cn(sizeClass, 'font-extrabold metric-value')}
          colors={['hsl(250 70% 60%)','hsl(185 80% 55%)','hsl(280 90% 65%)','hsl(250 70% 60%)']}
          textOnly
        >
          {value.toFixed(1)}
        </GradientText>
      );
    }
    return (
      <div className={cn(sizeClass, 'font-bold', getScoreColor(value))}>{value.toFixed(1)}</div>
    );
  };
  return (
    <div className={cn('space-y-3', className)}>
      {/* Portfolio Lift - Primary Score */}
      <div className="text-center pb-3 border-b">
        <div className="text-sm text-muted-foreground mb-1">Portfolio Lift</div>
        {renderScore(portfolioLift, 'text-4xl')}
        <div className="text-xs text-muted-foreground mt-1">
          {getScoreLabel(portfolioLift)}
        </div>
      </div>

      {/* Tri-Score Display */}
      <div className="grid grid-cols-3 gap-3">
        {/* Impressiveness */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center cursor-help">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-xs text-muted-foreground">Impressiveness</span>
                  <Info className="h-3 w-3 text-muted-foreground/60" />
                </div>
                {renderScore(impressiveness.overall, 'text-2xl')}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1">
                <p className="font-semibold text-sm mb-2">How impressive is this recognition?</p>
                {impressiveness.breakdown && (
                  <div className="text-xs space-y-1">
                    <div>Selectivity: {impressiveness.breakdown.selectivity?.toFixed(1)}/10</div>
                    <div>Issuer Prestige: {impressiveness.breakdown.issuerPrestige?.toFixed(1)}/10</div>
                    <div>Field Scale: {impressiveness.breakdown.fieldScale?.toFixed(1)}/10</div>
                    <div>Recency: {impressiveness.breakdown.recency?.toFixed(1)}/10</div>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Narrative Fit */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center cursor-help">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-xs text-muted-foreground">Narrative Fit</span>
                  <Info className="h-3 w-3 text-muted-foreground/60" />
                </div>
                {renderScore(narrativeFit.overall, 'text-2xl')}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold text-sm">How well does this align with your narrative spine?</p>
              <p className="text-xs mt-1">Higher scores indicate direct validation of your core themes and story.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Strategic Value (Portfolio Lift displayed differently) */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center cursor-help">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-xs text-muted-foreground">Strategic Value</span>
                  <Info className="h-3 w-3 text-muted-foreground/60" />
                </div>
                {renderScore(portfolioLift, 'text-2xl')}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold text-sm">How much does this strengthen your overall portfolio?</p>
              <p className="text-xs mt-1">Combines impressiveness and narrative fit to determine strategic priority.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
