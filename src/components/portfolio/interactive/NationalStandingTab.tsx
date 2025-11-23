import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Target, Lightbulb, School } from "lucide-react";
import { CompetitiveSpectrum } from "./CompetitiveSpectrum";

interface NationalStandingData {
  region: string;
  percentile: string;
  yourScore: number;
  avgScore: number;
  totalStudents: number;
  spectrum: { min: number; max: number; position: number };
  strengths: string;
  schoolComparisons: Array<{
    school: string;
    avgScore: number;
    gap: number;
    assessment: string;
  }>;
  gapAnalysis: {
    targetPercentile: number;
    pointsNeeded: number;
    scenarios: Array<{
      description: string;
      points: number;
    }>;
    timeline: string;
  };
  strategicRecommendations: string;
}

interface SchoolTierData {
  name: string;
  schools: string[];
  avgAdmitScore: number;
  yourScore: number;
  gap: number;
  admissionProbability: { min: number; max: number };
  status: 'strong' | 'competitive' | 'challenging';
}

interface NationalStandingTabProps {
  data: NationalStandingData;
  tiers: {
    safety: SchoolTierData;
    target: SchoolTierData;
    reach: SchoolTierData;
  };
  yourScore: number;
}

export function NationalStandingTab({ data, tiers, yourScore }: NationalStandingTabProps) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="p-6 bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-6 h-6 text-secondary" />
          <div>
            <h3 className="text-2xl font-bold">Your National Standing</h3>
            <p className="text-sm text-muted-foreground">
              Among {data.totalStudents.toLocaleString()} high school students nationwide
            </p>
          </div>
        </div>
        
        <div className="text-center py-6">
          <div className="text-6xl font-extrabold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mb-2">
            {data.percentile}
          </div>
          <div className="text-lg text-muted-foreground">Your National Percentile</div>
        </div>
      </Card>

      {/* Spectrum Visualization */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">National Score Distribution</h4>
        <CompetitiveSpectrum
          min={data.spectrum.min}
          max={data.spectrum.max}
          yourScore={yourScore}
          avgScore={data.avgScore}
          percentile={data.percentile}
        />
      </Card>

      {/* Strengths Card */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          <h4 className="font-semibold">Your National Strengths</h4>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {data.strengths}
        </p>
      </Card>

      {/* School Comparisons */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <School className="w-5 h-5 text-secondary" />
          <h4 className="font-semibold">Comparison to Top Schools</h4>
        </div>
        
        <div className="space-y-4">
          {data.schoolComparisons.map((comparison, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 border rounded-lg space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="font-medium">{comparison.school}</div>
                <Badge 
                  variant={comparison.gap > 0 ? "default" : comparison.gap >= -3 ? "secondary" : "outline"}
                  className={
                    comparison.gap > 0 
                      ? "bg-success" 
                      : comparison.gap >= -3 
                      ? "bg-warning text-warning-foreground" 
                      : "bg-destructive text-destructive-foreground"
                  }
                >
                  {comparison.gap > 0 ? `+${comparison.gap}` : comparison.gap} pts
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Average Admit Score</div>
                  <div className="font-semibold">{comparison.avgScore}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Your Score</div>
                  <div className="font-semibold">{yourScore}</div>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground pt-2 border-t">
                <span className="font-medium text-foreground">Assessment:</span> {comparison.assessment}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* School Tier Summary */}
      <Card className="p-6 bg-muted/30">
        <h4 className="font-semibold mb-4">National School Tiers</h4>
        
        <div className="grid md:grid-cols-3 gap-4">
          {/* Safety */}
          <div className="p-4 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-success">Safety</div>
              <div className="text-2xl">✅</div>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              {tiers.safety.schools.join(", ")}
            </div>
            <div className="text-xs font-medium text-success">
              {tiers.safety.admissionProbability.min}-{tiers.safety.admissionProbability.max}% admit probability
            </div>
          </div>

          {/* Target */}
          <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-warning">Target</div>
              <div className="text-2xl">⚠️</div>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              {tiers.target.schools.join(", ")}
            </div>
            <div className="text-xs font-medium text-warning">
              {tiers.target.admissionProbability.min}-{tiers.target.admissionProbability.max}% admit probability
            </div>
          </div>

          {/* Reach */}
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-destructive">Reach</div>
              <div className="text-2xl">🎯</div>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              {tiers.reach.schools.join(", ")}
            </div>
            <div className="text-xs font-medium text-destructive">
              {tiers.reach.admissionProbability.min}-{tiers.reach.admissionProbability.max}% admit probability
            </div>
          </div>
        </div>
      </Card>

      {/* Gap Analysis */}
      <Card className="p-6 bg-gradient-to-br from-warning/5 to-warning/10">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-warning" />
          <h4 className="font-semibold">Gap Analysis</h4>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            To move into the 'likely' range for schools like Northwestern and Duke (top {data.gapAnalysis.targetPercentile}% 
            nationally, score 90+), you need approximately <span className="font-semibold text-foreground">{data.gapAnalysis.pointsNeeded} more 
            portfolio points</span>. This typically requires:
          </p>
          
          <div className="space-y-2">
            {data.gapAnalysis.scenarios.map((scenario, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-warning/20 rounded-full flex items-center justify-center text-xs font-bold text-warning">
                  {scenario.points}
                </div>
                <div className="text-sm text-muted-foreground">{scenario.description}</div>
              </div>
            ))}
          </div>
          
          <div className="pt-3 border-t text-sm">
            <span className="font-medium text-foreground">Timeline:</span>{" "}
            <span className="text-muted-foreground">{data.gapAnalysis.timeline}</span>
          </div>
        </div>
      </Card>

      {/* Strategic Recommendations */}
      <Card className="p-6 bg-gradient-to-br from-accent/5 to-accent/10">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-accent" />
          <h4 className="font-semibold text-accent">Strategic Recommendations</h4>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {data.strategicRecommendations}
        </p>
      </Card>
    </div>
  );
}
