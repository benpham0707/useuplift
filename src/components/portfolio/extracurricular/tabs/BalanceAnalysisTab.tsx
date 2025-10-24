import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, BarChart3, Scale } from 'lucide-react';

interface BalanceAnalysisTabProps {
  data: any;
  balanceAnalysis: any;
}

export const BalanceAnalysisTab: React.FC<BalanceAnalysisTabProps> = ({ data, balanceAnalysis }) => {
  if (!data) return <div className="text-muted-foreground">No balance analysis data available</div>;

  return (
    <div className="space-y-6">
      {/* Critical Gaps */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h4 className="text-lg font-bold text-foreground">Critical Gaps</h4>
          </div>

          <div className="space-y-3">
            {data.criticalGaps.map((gap: any, i: number) => (
              <div
                key={i}
                className={`p-4 rounded-md border ${
                  gap.priority === 'HIGH'
                    ? 'bg-red-500/10 border-red-500/20'
                    : gap.priority === 'MEDIUM'
                    ? 'bg-yellow-500/10 border-yellow-500/20'
                    : 'bg-blue-500/10 border-blue-500/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-semibold text-foreground">{gap.issue}</div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      gap.priority === 'HIGH'
                        ? 'bg-red-500/20 text-red-700'
                        : gap.priority === 'MEDIUM'
                        ? 'bg-yellow-500/20 text-yellow-700'
                        : 'bg-blue-500/20 text-blue-700'
                    }`}
                  >
                    {gap.priority}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{gap.impact}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overweighted Categories */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-bold text-foreground">Category Distribution</h4>
          </div>

          {data.overweightedCategories.length > 0 && (
            <div className="space-y-3">
              {data.overweightedCategories.map((cat: any, i: number) => (
                <div key={i} className="p-4 bg-orange-500/10 rounded-md border border-orange-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-foreground capitalize">{cat.category}</span>
                    <span className="text-xl font-bold text-orange-600">{cat.count}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{cat.recommendation}</p>
                </div>
              ))}
            </div>
          )}

          {/* Visual distribution */}
          <div className="pt-4 border-t">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              All Categories
            </div>
            <div className="space-y-2">
              {Object.entries(balanceAnalysis.categoryBreakdown).map(([category, count]) => (
                <div key={category}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground capitalize">{category}</span>
                    <span className="font-semibold text-foreground">{count as number}</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                      style={{ width: `${((count as number) / balanceAnalysis.totalActivities) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Depth vs. Breadth Ratio */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-bold text-foreground">Depth vs. Breadth Balance</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-primary/5 rounded-md border border-primary/10">
              <div className="text-xs text-muted-foreground mb-1">Current Ratio</div>
              <div className="text-lg font-bold text-foreground">
                {data.depthVsBreadthRatio.currentRatio}
              </div>
            </div>
            <div className="p-4 bg-green-500/10 rounded-md border border-green-500/20">
              <div className="text-xs text-muted-foreground mb-1">Ideal Ratio</div>
              <div className="text-lg font-bold text-green-600">
                {data.depthVsBreadthRatio.idealRatio}
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.depthVsBreadthRatio.adjustment}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
