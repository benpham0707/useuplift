import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, CheckCircle2 } from 'lucide-react';
import { ExtracurricularItem } from '../ExtracurricularCard';

interface ImpactEvolutionTabProps {
  data: any;
  activities: ExtracurricularItem[];
}

export const ImpactEvolutionTab: React.FC<ImpactEvolutionTabProps> = ({ data, activities }) => {
  if (!data) return <div>No data available</div>;

  return (
    <div className="space-y-6">
      {/* Impact Tangibility Distribution */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Impact Tangibility Distribution
          </h3>
        </div>
        
        <div className="space-y-3 mb-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Quantified Impact</span>
              <span className="font-medium">{data.impactTangibility?.quantified}%</span>
            </div>
            <Progress value={data.impactTangibility?.quantified || 0} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Demonstrated Outcomes</span>
              <span className="font-medium">{data.impactTangibility?.demonstrated}%</span>
            </div>
            <Progress value={data.impactTangibility?.demonstrated || 0} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Described Efforts</span>
              <span className="font-medium">{data.impactTangibility?.described}%</span>
            </div>
            <Progress value={data.impactTangibility?.described || 0} className="h-2" />
          </div>
        </div>

        <div className="p-3 rounded-lg border bg-muted/10">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Analysis</div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {data.impactTangibility?.analysis}
          </p>
        </div>
      </Card>

      {/* Skill Development Arc */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Skill Development Arc
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
            <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">Technical Skills</div>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              {data.skillsDeveloped?.technical?.map((skill: string, idx: number) => (
                <li key={idx}>• {skill}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
            <div className="text-xs font-semibold text-green-800 dark:text-green-300 mb-2">Leadership Skills</div>
            <ul className="text-xs text-green-700 dark:text-green-400 space-y-1">
              {data.skillsDeveloped?.leadership?.map((skill: string, idx: number) => (
                <li key={idx}>• {skill}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-lg border bg-purple-50 dark:bg-purple-950/20">
            <div className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-2">Interpersonal Skills</div>
            <ul className="text-xs text-purple-700 dark:text-purple-400 space-y-1">
              {data.skillsDeveloped?.interpersonal?.map((skill: string, idx: number) => (
                <li key={idx}>• {skill}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-3 rounded-lg border bg-primary/5">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Qualitative Analysis</div>
          <p className="text-sm leading-relaxed">{data.skillsDeveloped?.qualitativeAnalysis}</p>
        </div>
      </Card>

      {/* Impact Verification */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <h3 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Impact Verification
          </h3>
        </div>
        
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/20 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.impactVerification?.verifiedCount || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Verified Claims</div>
          </div>
          <div className="p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20 text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {data.impactVerification?.needsSupport || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Need Support</div>
          </div>
        </div>

        <div className="mb-3">
          <div className="text-sm font-semibold mb-1">
            Verification Rate: <span className="text-primary">{data.impactVerification?.rate}%</span>
          </div>
          <Progress value={data.impactVerification?.rate || 0} className="h-2" />
        </div>

        <div className="p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Recommendation</div>
          <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
            {data.impactVerification?.recommendation}
          </p>
        </div>
      </Card>
    </div>
  );
};
