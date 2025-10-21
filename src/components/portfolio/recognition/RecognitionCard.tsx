import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RecognitionScoreDisplay } from './RecognitionScoreDisplay';
import { cn } from '@/lib/utils';

export interface RecognitionItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  tier: 'national' | 'state' | 'regional' | 'school';
  type: 'award' | 'honor' | 'fellowship' | 'institutional';
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
  usageGuidance: {
    whereToUse: string[];
    howToFrame: string[];
    framingAngles: Array<{ angle: string; example: string }>;
    strategicNote?: string;
  };
}

interface RecognitionCardProps {
  recognition: RecognitionItem;
  onViewAnalysis: () => void;
}

const tierConfig = {
  national: { label: 'National', className: 'text-amber-600 dark:text-amber-400' },
  state: { label: 'State', className: 'text-blue-600 dark:text-blue-400' },
  regional: { label: 'Regional', className: 'text-orange-600 dark:text-orange-400' },
  school: { label: 'School', className: 'text-green-600 dark:text-green-400' }
};

export const RecognitionCard: React.FC<RecognitionCardProps> = ({ recognition, onViewAnalysis }) => {
  const [whyItMattersExpanded, setWhyItMattersExpanded] = useState(false);
  const tierInfo = tierConfig[recognition.tier];

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardContent className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-extrabold leading-tight flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {recognition.name}
            </h3>
            {recognition.link && (
              <a 
                href={recognition.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{recognition.issuer}</span>
            <span>•</span>
            <span>{recognition.date}</span>
            <span>•</span>
            <span className={tierInfo.className}>{tierInfo.label}</span>
          </div>
        </div>

        {/* Score Display */}
        <div className="mb-4">
          <RecognitionScoreDisplay
            portfolioLift={recognition.scores.portfolioLift.overall}
            impressiveness={recognition.scores.impressiveness}
            narrativeFit={recognition.scores.narrativeFit}
          />
        </div>

        {/* At a Glance */}
        <div className="mb-4 p-3 rounded-lg border bg-muted/20">
          <div className="text-xs font-semibold text-muted-foreground mb-2">At a Glance</div>
          <div className="space-y-1.5 text-sm">
            {recognition.selectivity && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selectivity:</span>
                <span className="font-medium">{recognition.selectivity.description}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Spine Match:</span>
              <span className="font-medium">{recognition.scores.narrativeFit.spineAlignment}% alignment</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recency:</span>
              <span className="font-medium">{recognition.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Validates:</span>
              <span className="font-medium text-right">{recognition.scores.narrativeFit.themeSupport.slice(0, 2).join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Why It Matters */}
        <div className="mb-4 p-3 rounded-lg border bg-muted/10">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Why It Matters</div>
          <p className="text-sm leading-relaxed">
            {whyItMattersExpanded 
              ? recognition.scores.narrativeFit.analysis 
              : `${recognition.scores.narrativeFit.analysis.slice(0, 120)}...`}
          </p>
          <button
            onClick={() => setWhyItMattersExpanded(!whyItMattersExpanded)}
            className="text-xs text-primary hover:underline mt-2 flex items-center gap-1"
          >
            {whyItMattersExpanded ? (
              <>Show less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>Read more <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        </div>

        {/* Recommended Use removed for streamlined card UI */}

        {/* View Full Analysis CTA */}
        <div className="mt-auto pt-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onViewAnalysis}
          >
            View Full Analysis →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
