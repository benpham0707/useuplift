import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface CompetitivePositioning {
  selectivityBenchmark: {
    theirAverage: number;
    ivyAdmitsAverage: number;
    top20Average: number;
    top50Average: number;
    percentile: number;
    interpretation: string;
  };
  tierDistribution: {
    current: { national: number; state: number; school: number };
    ivyTypical: { national: number; state: number; school: number };
    top20Typical: { national: number; state: number; school: number };
    analysis: string;
    impactProjection: {
      withOneMoreNational: { percentile: number };
      withOneMoreState: { percentile: number };
    };
  };
  competitiveDensity: {
    stemCount: number;
    communityCount: number;
    leadershipCount: number;
    artsCount: number;
    diversificationScore: number;
    analysis: string;
  };
}

interface CompetitivePositioningTabProps {
  data: CompetitivePositioning;
}

export const CompetitivePositioningTab: React.FC<CompetitivePositioningTabProps> = ({ data }) => {
  const maxAcceptance = Math.max(
    data.selectivityBenchmark.theirAverage,
    data.selectivityBenchmark.ivyAdmitsAverage,
    data.selectivityBenchmark.top20Average,
    data.selectivityBenchmark.top50Average
  );

  return (
    <div className="space-y-6">
      {/* Selectivity Benchmark Analysis */}
      <Card className="p-6">
        <h3 className="text-xl md:text-2xl font-extrabold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Selectivity Benchmark Analysis</h3>
        <div className="text-sm text-muted-foreground mb-4">
          Your Average Acceptance Rate: <span className="text-foreground font-semibold">{data.selectivityBenchmark.theirAverage}%</span>
        </div>
        
        <div className="space-y-3 mb-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-foreground font-medium">Your Portfolio</span>
              <span className="font-semibold text-primary">{data.selectivityBenchmark.theirAverage}%</span>
            </div>
            <Progress value={(data.selectivityBenchmark.theirAverage / maxAcceptance) * 100} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Ivy+ Admits Avg</span>
              <span className="text-muted-foreground">{data.selectivityBenchmark.ivyAdmitsAverage}%</span>
            </div>
            <Progress value={(data.selectivityBenchmark.ivyAdmitsAverage / maxAcceptance) * 100} className="h-2 opacity-60" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Top 20 Admits Avg</span>
              <span className="text-muted-foreground">{data.selectivityBenchmark.top20Average}%</span>
            </div>
            <Progress value={(data.selectivityBenchmark.top20Average / maxAcceptance) * 100} className="h-2 opacity-60" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Top 50 Admits Avg</span>
              <span className="text-muted-foreground">{data.selectivityBenchmark.top50Average}%</span>
            </div>
            <Progress value={(data.selectivityBenchmark.top50Average / maxAcceptance) * 100} className="h-2 opacity-60" />
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {data.selectivityBenchmark.interpretation}
        </p>
      </Card>

      {/* Tier Distribution Analysis */}
      <Card className="p-6">
        <h3 className="text-xl md:text-2xl font-extrabold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Tier Distribution Analysis</h3>
        
        <div className="mb-4">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Current Mix</div>
          <div className="flex gap-2 text-sm">
            <span className="font-medium">{data.tierDistribution.current.national}% National</span>
            <span className="text-muted-foreground">|</span>
            <span className="font-medium">{data.tierDistribution.current.state}% State</span>
            <span className="text-muted-foreground">|</span>
            <span className="font-medium">{data.tierDistribution.current.school}% School</span>
          </div>
        </div>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ivy+ Typical:</span>
            <span>{data.tierDistribution.ivyTypical.national}% National | {data.tierDistribution.ivyTypical.state}% State | {data.tierDistribution.ivyTypical.school}% School</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Top 20 Typical:</span>
            <span>{data.tierDistribution.top20Typical.national}% National | {data.tierDistribution.top20Typical.state}% State | {data.tierDistribution.top20Typical.school}% School</span>
          </div>
        </div>

        <div className="mb-4 p-3 rounded-lg border bg-muted/10">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Analysis</div>
          <p className="text-sm leading-relaxed">{data.tierDistribution.analysis}</p>
        </div>

        <div className="p-3 rounded-lg border bg-primary/5">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Impact Projection</div>
          <div className="space-y-1 text-sm">
            <div>+1 National Recognition → {data.selectivityBenchmark.percentile}th → {data.tierDistribution.impactProjection.withOneMoreNational.percentile}th percentile</div>
            <div>+1 State Recognition → {data.selectivityBenchmark.percentile}th → {data.tierDistribution.impactProjection.withOneMoreState.percentile}th percentile</div>
          </div>
        </div>
      </Card>

      {/* Competitive Density Map */}
      <Card className="p-6">
        <h3 className="text-xl md:text-2xl font-extrabold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Competitive Density Map</h3>
        <div className="text-sm text-muted-foreground mb-4">Your Recognition Distribution by Domain:</div>
        
        <div className="space-y-3 mb-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>STEM/Tech</span>
              <span className="font-medium">{data.competitiveDensity.stemCount} recognitions</span>
            </div>
            <Progress value={(data.competitiveDensity.stemCount / 6) * 100} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Community</span>
              <span className="font-medium">{data.competitiveDensity.communityCount} recognitions</span>
            </div>
            <Progress value={(data.competitiveDensity.communityCount / 6) * 100} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Leadership</span>
              <span className="font-medium">{data.competitiveDensity.leadershipCount} recognitions</span>
            </div>
            <Progress value={(data.competitiveDensity.leadershipCount / 6) * 100} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Arts/Humanities</span>
              <span className="font-medium">{data.competitiveDensity.artsCount} recognitions</span>
            </div>
            <Progress value={(data.competitiveDensity.artsCount / 6) * 100} className="h-2" />
          </div>
        </div>

        <div className="mb-3 p-3 rounded-lg border bg-muted/10">
          <div className="text-sm font-semibold mb-1">
            Diversification Score: <span className="text-primary">{data.competitiveDensity.diversificationScore}/10</span>
            <span className="text-muted-foreground font-normal ml-2">(Strong)</span>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {data.competitiveDensity.analysis}
        </p>
      </Card>
    </div>
  );
};
