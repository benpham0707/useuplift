import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, BarChart3, Scale } from 'lucide-react';

interface BalanceAnalysisTabProps {
  data: any;
  balanceAnalysis: any;
}

export const BalanceAnalysisTab: React.FC<BalanceAnalysisTabProps> = ({ data, balanceAnalysis }) => {
  if (!data) return <div>No data available</div>;

  return (
    <div className="space-y-6">
      {/* Critical Gaps */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-primary" />
          <h3 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Critical Gaps
          </h3>
        </div>
        
        <div className="space-y-3">
          {balanceAnalysis?.criticalGaps?.map((gap: any, idx: number) => {
            const priorityClass = gap.priority === 'HIGH' 
              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
              : gap.priority === 'MEDIUM'
              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
              : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800';
            
            const textClass = gap.priority === 'HIGH'
              ? 'text-red-800 dark:text-red-300'
              : gap.priority === 'MEDIUM'
              ? 'text-amber-800 dark:text-amber-300'
              : 'text-blue-800 dark:text-blue-300';

            return (
              <div key={idx} className={`p-3 rounded-lg border ${priorityClass}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-xs font-semibold ${textClass}`}>{gap.issue}</div>
                  <div className="text-xs px-2 py-1 rounded bg-background font-medium">
                    {gap.priority}
                  </div>
                </div>
                <div className={`text-sm ${textClass}`}>{gap.impact}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Category Distribution */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Category Distribution
          </h3>
        </div>
        
        {balanceAnalysis?.categoryDistribution?.overweighted && balanceAnalysis.categoryDistribution.overweighted.length > 0 && (
          <div className="mb-4 p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20">
            <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">Overweighted Categories</div>
            {balanceAnalysis.categoryDistribution.overweighted.map((cat: any, idx: number) => (
              <div key={idx} className="text-sm text-amber-700 dark:text-amber-400 mb-1">
                • {cat.category}: {cat.count} activities - {cat.recommendation}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {Object.entries(balanceAnalysis?.categoryDistribution?.all || {}).map(([category, count]: [string, any]) => (
            <div key={category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="capitalize">{category}</span>
                <span className="font-medium">{count} activities</span>
              </div>
              <Progress value={(count / 10) * 100} className="h-2" />
            </div>
          ))}
        </div>
      </Card>

      {/* Depth vs Breadth Ratio */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="h-5 w-5 text-primary" />
          <h3 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Depth vs. Breadth Ratio
          </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-lg border bg-muted/10 text-center">
            <div className="text-xs text-muted-foreground mb-1">Current Ratio</div>
            <div className="text-2xl font-bold">{balanceAnalysis?.depthVsBreadth?.currentRatio}</div>
          </div>
          <div className="p-3 rounded-lg border bg-primary/5 text-center">
            <div className="text-xs text-muted-foreground mb-1">Ideal Ratio</div>
            <div className="text-2xl font-bold">{balanceAnalysis?.depthVsBreadth?.idealRatio}</div>
          </div>
        </div>

        <div className="p-3 rounded-lg border bg-primary/5">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Adjustment Recommendation</div>
          <p className="text-sm leading-relaxed">
            {balanceAnalysis?.depthVsBreadth?.adjustmentRecommendation}
          </p>
        </div>
      </Card>
    </div>
  );
};
