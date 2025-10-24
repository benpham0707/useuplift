import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, TrendingUp, Calendar } from 'lucide-react';
import { ExtracurricularItem } from '../ExtracurricularCard';

interface CommitmentDepthTabProps {
  data: any;
  activities: ExtracurricularItem[];
}

export const CommitmentDepthTab: React.FC<CommitmentDepthTabProps> = ({ data, activities }) => {
  if (!data) return <div>No data available</div>;

  const maxYears = Math.max(data.longevityBenchmark?.theirAverage || 0, data.longevityBenchmark?.admitsAverage || 0, 4);

  return (
    <div className="space-y-6">
      {/* Longevity Benchmark Analysis */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Longevity Benchmark Analysis
          </h3>
        </div>
        <div className="text-sm text-muted-foreground mb-4">
          Your Average Longevity: <span className="text-foreground font-semibold">{data.longevityBenchmark?.theirAverage?.toFixed(1)} years</span>
        </div>
        
        <div className="space-y-3 mb-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-foreground font-medium">Your Portfolio</span>
              <span className="font-semibold text-primary">{data.longevityBenchmark?.theirAverage?.toFixed(1)} years</span>
            </div>
            <Progress value={(data.longevityBenchmark?.theirAverage / maxYears) * 100} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Admitted Students Avg</span>
              <span className="text-muted-foreground">{data.longevityBenchmark?.admitsAverage?.toFixed(1)} years</span>
            </div>
            <Progress value={(data.longevityBenchmark?.admitsAverage / maxYears) * 100} className="h-2 opacity-60" />
          </div>
        </div>

        <div className="p-3 rounded-lg border bg-muted/10">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {data.longevityBenchmark?.interpretation}
          </p>
        </div>
      </Card>

      {/* Leadership Trajectory */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Leadership Trajectory
          </h3>
        </div>
        
        <div className="space-y-4">
          {data.leadershipProgression?.timeline?.map((item: any, idx: number) => (
            <div key={idx} className="p-3 rounded-lg border bg-muted/10">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold">{item.activity}</div>
                  <div className="text-sm text-muted-foreground">{item.timeframe}</div>
                </div>
                <div className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                  {item.growthType}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">{item.roles}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-lg border bg-primary/5">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Analysis</div>
          <p className="text-sm leading-relaxed">{data.leadershipProgression?.analysis}</p>
        </div>
      </Card>

      {/* Hours Investment */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Hours Investment
          </h3>
        </div>
        
        <div className="mb-4 p-4 rounded-lg border bg-primary/5 text-center">
          <div className="text-3xl font-bold mb-1">{data.hoursInvestment?.totalHours?.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Hours Invested</div>
        </div>

        <div className="space-y-3 mb-4">
          {activities.slice(0, 5).map((activity) => (
            <div key={activity.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="truncate flex-1">{activity.name}</span>
                <span className="font-medium ml-2">{activity.scores.commitment.totalHours}h</span>
              </div>
              <Progress 
                value={(activity.scores.commitment.totalHours / Math.max(...activities.map(a => a.scores.commitment.totalHours))) * 100} 
                className="h-2" 
              />
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Recommendation</div>
          <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
            {data.hoursInvestment?.recommendation}
          </p>
        </div>
      </Card>
    </div>
  );
};
