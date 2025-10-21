import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface QualityIndicators {
  issuerPrestige: Array<{
    recognition: string;
    issuerType: 'foundation' | 'state_agency' | 'governor' | 'institution' | 'federal';
    prestigeScore: number;
    contextTooltip: string;
  }>;
  averageIssuerPrestige: number;
  recencyDistribution: {
    last6Months: number;
    months6to12: number;
    months12to24: number;
    older: number;
    recencyScore: number;
    analysis: string;
  };
  verification: {
    verifiedCount: number;
    selfReportedCount: number;
    verificationRate: number;
    recommendation: string;
  };
}

interface QualityIndicatorsTabProps {
  data: QualityIndicators;
}

const issuerTypeLabels = {
  foundation: 'Foundation',
  state_agency: 'State Agency',
  governor: 'Governor',
  institution: 'Institution',
  federal: 'Federal'
};

export const QualityIndicatorsTab: React.FC<QualityIndicatorsTabProps> = ({ data }) => {
  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-green-600 dark:text-green-400';
    if (score >= 7) return 'text-blue-600 dark:text-blue-400';
    return 'text-amber-600 dark:text-amber-400';
  };

  return (
    <div className="space-y-6">
      {/* Issuer Prestige Analysis */}
      <Card className="p-6">
        <h3 className="text-xl md:text-2xl font-extrabold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Issuer Prestige Analysis</h3>
        
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-semibold">Recognition</th>
                <th className="text-left py-2 font-semibold">Issuer Type</th>
                <th className="text-right py-2 font-semibold">Prestige</th>
                <th className="text-center py-2 font-semibold">Context</th>
              </tr>
            </thead>
            <tbody>
              {data.issuerPrestige.map((item, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="py-3">{item.recognition}</td>
                  <td className="py-3 text-muted-foreground">{issuerTypeLabels[item.issuerType]}</td>
                  <td className={`py-3 text-right font-semibold ${getScoreColor(item.prestigeScore)}`}>
                    {item.prestigeScore.toFixed(1)}/10
                  </td>
                  <td className="py-3 text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">{item.contextTooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 rounded-lg border bg-muted/10">
          <div className="text-sm">
            Average Issuer Prestige: <span className={`font-semibold ${getScoreColor(data.averageIssuerPrestige)}`}>{data.averageIssuerPrestige.toFixed(1)}/10</span>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground mt-4">
          Strong issuer credibility with mix of third-party validators and institutional honors. National foundation issuers establish independent verification.
        </p>
      </Card>

      {/* Recency Distribution */}
      <Card className="p-6">
        <h3 className="text-xl md:text-2xl font-extrabold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Recency Distribution</h3>
        <div className="text-sm text-muted-foreground mb-4">Recognition Timeline</div>
        
        <div className="space-y-3 mb-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Last 6 months</span>
              <span className="font-medium">{data.recencyDistribution.last6Months} recognitions</span>
            </div>
            <Progress value={(data.recencyDistribution.last6Months / 6) * 100} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>6-12 months</span>
              <span className="font-medium">{data.recencyDistribution.months6to12} recognitions</span>
            </div>
            <Progress value={(data.recencyDistribution.months6to12 / 6) * 100} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>12-24 months</span>
              <span className="font-medium">{data.recencyDistribution.months12to24} recognitions</span>
            </div>
            <Progress value={(data.recencyDistribution.months12to24 / 6) * 100} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>24+ months</span>
              <span className="font-medium">{data.recencyDistribution.older} recognitions</span>
            </div>
            <Progress value={(data.recencyDistribution.older / 6) * 100} className="h-2" />
          </div>
        </div>

        <div className="mb-4 p-3 rounded-lg border bg-primary/5">
          <div className="text-sm font-semibold mb-1">
            Recency Score: <span className={getScoreColor(data.recencyDistribution.recencyScore)}>{data.recencyDistribution.recencyScore.toFixed(1)}/10</span>
            <span className="text-muted-foreground font-normal ml-2">(Excellent)</span>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {data.recencyDistribution.analysis}
        </p>
      </Card>

      {/* Verification & Evidence */}
      <Card className="p-6">
        <h3 className="text-xl md:text-2xl font-extrabold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Verification & Evidence</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-lg border bg-muted/10">
            <div className="text-2xl font-bold mb-1">{data.verification.verifiedCount}</div>
            <div className="text-sm text-muted-foreground">Verified (with links/certificates)</div>
            <div className="text-xs text-primary mt-1">{data.verification.verificationRate}%</div>
          </div>
          
          <div className="p-4 rounded-lg border bg-muted/10">
            <div className="text-2xl font-bold mb-1">{data.verification.selfReportedCount}</div>
            <div className="text-sm text-muted-foreground">Self-reported (no documentation)</div>
            <div className="text-xs text-muted-foreground mt-1">{100 - data.verification.verificationRate}%</div>
          </div>
        </div>

        <div className="p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20">
          <div className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">Recommendation</div>
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            {data.verification.recommendation}
          </p>
        </div>
      </Card>
    </div>
  );
};
