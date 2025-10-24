import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Clock, Award } from 'lucide-react';
import { ExtracurricularItem } from '../ExtracurricularCard';

interface CommitmentDepthTabProps {
  data: any;
  activities: ExtracurricularItem[];
}

export const CommitmentDepthTab: React.FC<CommitmentDepthTabProps> = ({ data, activities }) => {
  if (!data) return <div className="text-muted-foreground">No commitment depth data available</div>;

  return (
    <div className="space-y-6">
      {/* Longevity Benchmark */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-bold text-foreground">Longevity Benchmark</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-primary/5 rounded-md border border-primary/10">
              <div className="text-xs text-muted-foreground mb-1">Your Average</div>
              <div className="text-2xl font-bold text-foreground">
                {data.longevityBenchmark.theirAverage.toFixed(1)} yrs
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-md">
              <div className="text-xs text-muted-foreground mb-1">Top Applicants</div>
              <div className="text-2xl font-bold text-muted-foreground">
                {data.longevityBenchmark.topApplicantsAverage.toFixed(1)} yrs
              </div>
            </div>
            <div className="p-4 bg-green-500/10 rounded-md border border-green-500/20">
              <div className="text-xs text-muted-foreground mb-1">Percentile</div>
              <div className="text-2xl font-bold text-green-600">
                {data.longevityBenchmark.percentile}th
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.longevityBenchmark.interpretation}
          </p>
        </CardContent>
      </Card>

      {/* Leadership Progression */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-bold text-foreground">Leadership Trajectory</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-500/10 rounded-md border border-green-500/20">
              <div className="text-xs text-muted-foreground mb-1">Activities with Growth</div>
              <div className="text-3xl font-bold text-green-600">
                {data.leadershipProgression.activitiesWithGrowth}
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-md">
              <div className="text-xs text-muted-foreground mb-1">Activities Stagnant</div>
              <div className="text-3xl font-bold text-muted-foreground">
                {data.leadershipProgression.activitiesStagnant}
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.leadershipProgression.analysis}
          </p>

          {/* Visual timeline of activities with growth */}
          <div className="space-y-2 pt-2">
            {activities
              .filter(a => a.scores.commitment.roleGrowth.length > 0)
              .map(activity => (
                <div key={activity.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                  <div className="text-sm font-medium text-foreground flex-1">
                    {activity.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activity.scores.commitment.roleGrowth.join(' → ')}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Hours Investment */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-bold text-foreground">Hours Investment</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-primary/5 rounded-md border border-primary/10">
              <div className="text-xs text-muted-foreground mb-1">Total Hours</div>
              <div className="text-2xl font-bold text-foreground">
                {data.hoursBenchmark.totalHours.toLocaleString()}+
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-md">
              <div className="text-xs text-muted-foreground mb-1">Weekly Average</div>
              <div className="text-2xl font-bold text-muted-foreground">
                {data.hoursBenchmark.weeklyAverage} hrs
              </div>
            </div>
            <div className="p-4 bg-primary/5 rounded-md border border-primary/10">
              <div className="text-xs text-muted-foreground mb-1">vs Top Applicants</div>
              <div className="text-lg font-bold text-foreground">
                {data.hoursBenchmark.vsTopApplicants}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
