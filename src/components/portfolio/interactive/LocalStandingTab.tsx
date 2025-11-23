import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp, School } from "lucide-react";
import { CompetitiveSpectrum } from "./CompetitiveSpectrum";

interface LocalStandingData {
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
  actionableInsight: string;
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

interface LocalStandingTabProps {
  data: LocalStandingData;
  tiers: {
    safety: SchoolTierData;
    target: SchoolTierData;
    reach: SchoolTierData;
  };
  yourScore: number;
}

export function LocalStandingTab({ data, tiers, yourScore }: LocalStandingTabProps) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-2xl font-bold">Your Standing in {data.region}</h3>
            <p className="text-sm text-muted-foreground">
              Among {data.totalStudents.toLocaleString()} high school students in your state
            </p>
          </div>
        </div>
        
        <div className="text-center py-6">
          <div className="text-6xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            {data.percentile}
          </div>
          <div className="text-lg text-muted-foreground">Your State Percentile</div>
        </div>
      </Card>

      {/* Spectrum Visualization */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Score Distribution</h4>
        <CompetitiveSpectrum
          min={data.spectrum.min}
          max={data.spectrum.max}
          yourScore={yourScore}
          avgScore={data.avgScore}
          percentile={data.percentile}
        />
      </Card>

      {/* Strengths Card */}
      <Card className="p-6 bg-gradient-to-br from-success/5 to-success/10">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-success" />
          <h4 className="font-semibold">Your Strengths in {data.region}</h4>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {data.strengths}
        </p>
      </Card>

      {/* School Comparisons */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <School className="w-5 h-5 text-primary" />
          <h4 className="font-semibold">Comparison to Admitted Students (In-State)</h4>
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
                  variant={comparison.gap > 0 ? "default" : comparison.gap === 0 ? "secondary" : "outline"}
                  className={comparison.gap > 0 ? "bg-success" : comparison.gap === 0 ? "" : "bg-warning text-warning-foreground"}
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
        <h4 className="font-semibold mb-4">In-State School Tiers</h4>
        
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
            <div className="text-xs text-muted-foreground mt-1">
              Above by +{Math.abs(tiers.safety.gap)} pts
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
            <div className="text-xs text-muted-foreground mt-1">
              Gap: {Math.abs(tiers.target.gap)} pts
            </div>
          </div>

          {/* Reach */}
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-destructive">Reach</div>
              <div className="text-2xl">🎯</div>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              {tiers.reach.schools.length > 0 ? tiers.reach.schools.join(", ") : "N/A for in-state publics"}
            </div>
            {tiers.reach.schools.length > 0 && (
              <>
                <div className="text-xs font-medium text-destructive">
                  {tiers.reach.admissionProbability.min}-{tiers.reach.admissionProbability.max}% admit probability
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Gap: {Math.abs(tiers.reach.gap)} pts
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Actionable Insight */}
      <Card className="p-6 bg-gradient-to-br from-accent/5 to-accent/10">
        <h4 className="font-semibold mb-3 text-accent">Strategic Recommendations</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {data.actionableInsight}
        </p>
      </Card>
    </div>
  );
}
