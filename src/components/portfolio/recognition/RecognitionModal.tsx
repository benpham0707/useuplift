import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecognitionItem } from './RecognitionCard';
import { UsageGuidancePanel } from './UsageGuidancePanel';
import { Button } from '@/components/ui/button';

interface RecognitionModalProps {
  recognition: RecognitionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getScoreColor = (score: number) => {
  if (score >= 9.0) return 'text-amber-600 dark:text-amber-400';
  if (score >= 7.5) return 'text-green-600 dark:text-green-400';
  if (score >= 6.0) return 'text-blue-600 dark:text-blue-400';
  return 'text-muted-foreground';
};

const useConfig = {
  flagship: { label: 'FLAGSHIP RECOGNITION', icon: '⭐' },
  bridge: { label: 'BRIDGE RECOGNITION', icon: '🌉' },
  support: { label: 'SUPPORT RECOGNITION', icon: '📋' },
  footnote: { label: 'FOOTNOTE RECOGNITION', icon: '📝' },
  archive: { label: 'ARCHIVE', icon: '📦' }
};

export const RecognitionModal: React.FC<RecognitionModalProps> = ({
  recognition,
  open,
  onOpenChange
}) => {
  const [showScoring, setShowScoring] = React.useState(false);

  if (!recognition) return null;

  const { scores } = recognition;
  const useStyle = useConfig[recognition.recommendedUse];
  const scoreColor = getScoreColor(scores.portfolioLift.overall);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <DialogTitle className="text-3xl font-bold leading-tight">
                {recognition.name}
              </DialogTitle>
              <div className="text-base text-muted-foreground">
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
                <ExternalLink className="w-5 h-5 text-primary hover:text-primary/80" />
              </a>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-8 pt-4">
          {/* Portfolio Lift Hero */}
          <div className="text-center py-8 border rounded-xl bg-muted/30">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              PORTFOLIO LIFT
            </div>
            <div className={cn('text-6xl font-bold mb-3', scoreColor)}>
              {scores.portfolioLift.overall.toFixed(1)}
              <span className="text-3xl text-muted-foreground">/10</span>
            </div>
            <Badge className="text-sm px-4 py-1.5 bg-foreground text-background">
              {useStyle.icon} {useStyle.label}
            </Badge>
          </div>

          {/* At a Glance */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">AT A GLANCE</h3>
            <ul className="space-y-2 text-muted-foreground">
              {recognition.selectivity && (
                <li className="flex items-start gap-2">
                  <span className="text-foreground mt-0.5">•</span>
                  <span>{recognition.selectivity.description} ({(recognition.selectivity.acceptanceRate * 100).toFixed(1)}% acceptance)</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-foreground mt-0.5">•</span>
                <span>{recognition.tier.charAt(0).toUpperCase() + recognition.tier.slice(1)} tier recognition</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground mt-0.5">•</span>
                <span>Recent ({recognition.date})</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground mt-0.5">•</span>
                <span>{scores.narrativeFit.spineAlignment}% alignment with your narrative spine</span>
              </li>
            </ul>
          </div>

          <div className="border-t pt-6" />

          {/* Why This Matters */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">WHY THIS MATTERS</h3>
            <p className="text-muted-foreground leading-relaxed">
              {scores.portfolioLift.reasoning}
            </p>
          </div>

          {/* What It Validates */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">WHAT IT VALIDATES</h3>
            <ul className="space-y-2">
              {scores.narrativeFit.themeSupport.map((theme, idx) => (
                <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-foreground mt-0.5">•</span>
                  <span>{theme}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t pt-6" />

          {/* How to Use It */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">HOW TO USE IT</h3>
            <UsageGuidancePanel guidance={recognition.usageGuidance} />
          </div>

          {/* Optional Scoring Breakdown */}
          <div className="border-t pt-6">
            <Button
              variant="ghost"
              onClick={() => setShowScoring(!showScoring)}
              className="w-full justify-between"
            >
              <span className="text-sm font-semibold">SCORING BREAKDOWN</span>
              {showScoring ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            {showScoring && (
              <div className="mt-6 space-y-6 animate-accordion-down">
                {/* Impressiveness */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground">Impressiveness</h4>
                    <span className={cn('text-lg font-bold', getScoreColor(scores.impressiveness.overall))}>
                      {scores.impressiveness.overall.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
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
                </div>

                {/* Narrative Fit */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground">Narrative Fit</h4>
                    <span className={cn('text-lg font-bold', getScoreColor(scores.narrativeFit.overall))}>
                      {scores.narrativeFit.overall.toFixed(1)}/10
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {scores.narrativeFit.analysis}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
