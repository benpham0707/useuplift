import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, TrendingUp, CheckCircle } from 'lucide-react';
import { ExtracurricularItem } from '../ExtracurricularCard';

interface ImpactEvolutionTabProps {
  data: any;
  activities: ExtracurricularItem[];
}

export const ImpactEvolutionTab: React.FC<ImpactEvolutionTabProps> = ({ data, activities }) => {
  if (!data) return <div className="text-muted-foreground">No impact evolution data available</div>;

  return (
    <div className="space-y-6">
      {/* Tangibility Distribution */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-bold text-foreground">Impact Tangibility Distribution</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-500/10 rounded-md border border-green-500/20">
              <div className="text-xs text-muted-foreground mb-1">Highly Measurable</div>
              <div className="text-3xl font-bold text-green-600">
                {data.tangibilityDistribution.highlyMeasurable}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ({((data.tangibilityDistribution.highlyMeasurable / activities.length) * 100).toFixed(0)}%)
              </div>
            </div>
            <div className="p-4 bg-yellow-500/10 rounded-md border border-yellow-500/20">
              <div className="text-xs text-muted-foreground mb-1">Moderate</div>
              <div className="text-3xl font-bold text-yellow-600">
                {data.tangibilityDistribution.moderate}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ({((data.tangibilityDistribution.moderate / activities.length) * 100).toFixed(0)}%)
              </div>
            </div>
            <div className="p-4 bg-orange-500/10 rounded-md border border-orange-500/20">
              <div className="text-xs text-muted-foreground mb-1">Vague</div>
              <div className="text-3xl font-bold text-orange-600">
                {data.tangibilityDistribution.vague}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ({((data.tangibilityDistribution.vague / activities.length) * 100).toFixed(0)}%)
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.tangibilityDistribution.analysis}
          </p>
        </CardContent>
      </Card>

      {/* Skill Development */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-bold text-foreground">Skill Development Arc</h4>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Technical Skills Gained
              </div>
              <div className="flex flex-wrap gap-2">
                {data.skillDevelopment.technicalSkills.map((skill: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-blue-500/10 text-blue-700 text-xs font-medium rounded-full border border-blue-500/20">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Leadership Skills Gained
              </div>
              <div className="flex flex-wrap gap-2">
                {data.skillDevelopment.leadershipSkills.map((skill: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-purple-500/10 text-purple-700 text-xs font-medium rounded-full border border-purple-500/20">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Interpersonal Skills Gained
              </div>
              <div className="flex flex-wrap gap-2">
                {data.skillDevelopment.interpersonalSkills.map((skill: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-green-500/10 text-green-700 text-xs font-medium rounded-full border border-green-500/20">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="text-sm font-semibold text-foreground mb-2">Growth Trajectory</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.skillDevelopment.growthTrajectory}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Impact Verification */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-bold text-foreground">Impact Verification</h4>
          </div>

          <div className="p-4 bg-primary/5 rounded-md border border-primary/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Activities with Proof</span>
              <span className="text-2xl font-bold text-foreground">
                {activities.filter(a => a.scores.impact.metrics.length > 0).length} / {activities.length}
              </span>
            </div>
            <div className="w-full bg-background rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                style={{ width: `${(activities.filter(a => a.scores.impact.metrics.length > 0).length / activities.length) * 100}%` }}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Consider adding concrete metrics or artifacts for remaining activities to strengthen your impact narrative.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
