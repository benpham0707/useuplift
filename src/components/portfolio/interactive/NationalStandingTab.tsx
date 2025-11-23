import { useState } from "react";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Target, Lightbulb, School, ChevronDown } from "lucide-react";
import { CompetitiveSpectrum } from "./CompetitiveSpectrum";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [selectedSchool, setSelectedSchool] = useState(data.schoolComparisons[0]?.school || "");
  const [isTierDetailsOpen, setIsTierDetailsOpen] = useState(false);
  
  const selectedComparison = data.schoolComparisons.find(c => c.school === selectedSchool) || data.schoolComparisons[0];

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

      {/* Inline Spectrum */}
      <Card className="p-4">
        <CompetitiveSpectrum
          min={data.spectrum.min}
          max={data.spectrum.max}
          yourScore={yourScore}
          avgScore={data.avgScore}
          percentile={data.percentile}
          variant="inline"
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

      {/* School Comparison Selector */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <School className="w-5 h-5 text-secondary" />
          <h4 className="font-semibold">Compare Your Profile To:</h4>
        </div>
        
        <Select value={selectedSchool} onValueChange={setSelectedSchool}>
          <SelectTrigger className="w-full mb-4">
            <SelectValue placeholder="Select a school" />
          </SelectTrigger>
          <SelectContent>
            {data.schoolComparisons.map((comparison) => (
              <SelectItem key={comparison.school} value={comparison.school}>
                {comparison.school}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedComparison && (
          <motion.div
            key={selectedSchool}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border rounded-lg space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="font-medium text-lg">{selectedComparison.school}</div>
              <Badge 
                variant={selectedComparison.gap > 0 ? "default" : selectedComparison.gap >= -3 ? "secondary" : "outline"}
                className={
                  selectedComparison.gap > 0 
                    ? "bg-success" 
                    : selectedComparison.gap >= -3 
                    ? "bg-warning text-warning-foreground" 
                    : "bg-destructive text-destructive-foreground"
                }
              >
                {selectedComparison.gap > 0 ? `+${selectedComparison.gap}` : selectedComparison.gap} pts
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Average Admit Score</div>
                <div className="font-semibold text-lg">{selectedComparison.avgScore}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Your Score</div>
                <div className="font-semibold text-lg">{yourScore}</div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground pt-3 border-t leading-relaxed">
              <span className="font-medium text-foreground">Assessment:</span> {selectedComparison.assessment}
            </div>
          </motion.div>
        )}
      </Card>

      {/* Condensed School Tier Summary */}
      <Card className="p-4 bg-muted/30">
        <Collapsible open={isTierDetailsOpen} onOpenChange={setIsTierDetailsOpen}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">National School Tiers</h4>
              <CollapsibleTrigger asChild>
                <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  {isTierDetailsOpen ? "Hide details" : "View breakdown"}
                  <ChevronDown className={`w-4 h-4 transition-transform ${isTierDetailsOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
            </div>
            
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-success font-medium">Safety:</span>
                <span className="text-muted-foreground">{tiers.safety.schools.length} schools (✅ Strong positioning)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-warning font-medium">Target:</span>
                <span className="text-muted-foreground">{tiers.target.schools.length} schools (⚠️ {Math.abs(tiers.target.gap)}pt gap)</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-destructive font-medium">Reach:</span>
                <span className="text-muted-foreground">{tiers.reach.schools.length} schools</span>
              </div>
            </div>

            <CollapsibleContent className="pt-4">
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
            </CollapsibleContent>
          </div>
        </Collapsible>
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
