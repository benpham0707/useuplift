import { useState } from "react";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Target, Lightbulb, School, ChevronDown } from "lucide-react";
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

  // Calculate position for inline spectrum
  const getPosition = (score: number) => {
    return ((score - data.spectrum.min) / (data.spectrum.max - data.spectrum.min)) * 100;
  };
  const yourPosition = getPosition(yourScore);
  const avgPosition = getPosition(data.avgScore);

  return (
    <div className="space-y-6">
      {/* Section 1: Where You Stand Nationally */}
      <Card className="p-8 bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-7 h-7 text-secondary" />
          <div>
            <h3 className="text-2xl font-bold">Your National Standing</h3>
            <p className="text-sm text-muted-foreground">
              Among {data.totalStudents.toLocaleString()} high school students nationwide
            </p>
          </div>
        </div>
        
        {/* Hero Metric */}
        <div className="text-center py-6 mb-6">
          <div className="text-6xl font-extrabold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mb-2">
            Top {data.percentile.replace(/[^\d]/g, '')}%
          </div>
          <div className="text-lg text-muted-foreground mb-4">Your National Percentile</div>
          
          {/* Inline Spectrum */}
          <div className="max-w-2xl mx-auto mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-foreground">Your Score: {yourScore}</span>
              <span className="text-muted-foreground">National Avg: {data.avgScore}</span>
            </div>
            <div className="relative h-8 rounded-lg overflow-hidden">
              <div 
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(90deg, hsl(var(--destructive) / 0.2), hsl(var(--warning) / 0.2) 33%, hsl(var(--primary) / 0.2) 66%, hsl(var(--success) / 0.2))"
                }}
              />
              
              {/* Average Marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-muted-foreground rounded-full border-2 border-background"
                style={{ left: `${avgPosition}%` }}
              />
              
              {/* Your Position Marker */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${yourPosition}%` }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <div className="w-4 h-4 bg-secondary rounded-full border-2 border-background shadow-lg" />
              </motion.div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>↑ You</span>
              <span>Nat'l Avg ↓</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-border" />

        {/* What This Means */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-lg">What This Means</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.strengths}
          </p>
        </div>
      </Card>

      {/* Section 2: Path to Top Schools */}
      <Card className="p-8 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent">
        <div className="flex items-center gap-2 mb-6">
          <School className="w-6 h-6 text-accent" />
          <h3 className="font-bold text-2xl">Path to Top Schools</h3>
        </div>
        
        {/* School Comparison */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Compare to:</label>
          <Select value={selectedSchool} onValueChange={setSelectedSchool}>
            <SelectTrigger className="w-full">
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
              className="mt-4 p-5 border-2 rounded-lg bg-background/50"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="font-semibold text-xl">{selectedComparison.school}</div>
                <Badge 
                  variant={selectedComparison.gap > 0 ? "default" : selectedComparison.gap >= -3 ? "secondary" : "outline"}
                  className={
                    selectedComparison.gap > 0 
                      ? "bg-success text-white" 
                      : selectedComparison.gap >= -3 
                      ? "bg-warning text-warning-foreground" 
                      : "bg-destructive text-destructive-foreground"
                  }
                >
                  {selectedComparison.gap > 0 ? `+${selectedComparison.gap}` : selectedComparison.gap} pts
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <div className="text-muted-foreground text-xs">Avg Admit</div>
                  <div className="font-bold text-2xl">{selectedComparison.avgScore}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Your Score</div>
                  <div className="font-bold text-2xl">{yourScore}</div>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground pt-4 border-t leading-relaxed">
                <span className="font-semibold text-foreground">Assessment:</span> {selectedComparison.assessment}
              </div>
            </motion.div>
          )}
        </div>

        {/* Quick School Tiers */}
        <div className="mb-6 p-4 bg-muted/30 rounded-lg">
          <Collapsible open={isTierDetailsOpen} onOpenChange={setIsTierDetailsOpen}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Quick School Tiers</h4>
                <CollapsibleTrigger asChild>
                  <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                    {isTierDetailsOpen ? "Hide" : "View details"}
                    <ChevronDown className={`w-4 h-4 transition-transform ${isTierDetailsOpen ? "rotate-180" : ""}`} />
                  </button>
                </CollapsibleTrigger>
              </div>
              
              <div className="text-sm space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-success font-medium">✅ Safety:</span>
                  <span className="text-muted-foreground">Top state flagships ({tiers.safety.schools.length} schools)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-warning font-medium">⚠️ Target:</span>
                  <span className="text-muted-foreground">{tiers.target.schools.slice(0, 2).join(", ")} ({Math.abs(tiers.target.gap)}pt gap, {tiers.target.schools.length} schools)</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-destructive font-medium">🎯 Reach:</span>
                  <span className="text-muted-foreground">{tiers.reach.schools.slice(0, 2).join(", ")} ({tiers.reach.schools.length} schools)</span>
                </div>
              </div>

              <CollapsibleContent className="pt-4">
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Safety */}
                  <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-success">Safety</div>
                      <div className="text-xl">✅</div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {tiers.safety.schools.join(", ")}
                    </div>
                    <div className="text-xs font-medium text-success">
                      {tiers.safety.admissionProbability.min}-{tiers.safety.admissionProbability.max}% admit rate
                    </div>
                  </div>

                  {/* Target */}
                  <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-warning">Target</div>
                      <div className="text-xl">⚠️</div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {tiers.target.schools.join(", ")}
                    </div>
                    <div className="text-xs font-medium text-warning">
                      {tiers.target.admissionProbability.min}-{tiers.target.admissionProbability.max}% admit rate
                    </div>
                  </div>

                  {/* Reach */}
                  <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-destructive">Reach</div>
                      <div className="text-xl">🎯</div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {tiers.reach.schools.join(", ")}
                    </div>
                    <div className="text-xs font-medium text-destructive">
                      {tiers.reach.admissionProbability.min}-{tiers.reach.admissionProbability.max}% admit rate
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>

        {/* Closing the Gap */}
        <div className="mb-6 p-5 bg-warning/5 rounded-lg border border-warning/20">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-warning" />
            <h4 className="font-semibold">Closing the Gap</h4>
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            To reach the 'likely' range for {tiers.target.schools.slice(0, 2).join(" and ")} (top {data.gapAnalysis.targetPercentile}% 
            nationally), you need approximately <span className="font-semibold text-foreground">{data.gapAnalysis.pointsNeeded} more points</span>:
          </p>
          
          <div className="space-y-2">
            {data.gapAnalysis.scenarios.map((scenario, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg text-sm">
                <div className="flex-shrink-0 w-6 h-6 bg-warning/20 rounded-full flex items-center justify-center text-xs font-bold text-warning">
                  {scenario.points}
                </div>
                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">Path {index + 1}:</span> {scenario.description}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Timeline:</span> {data.gapAnalysis.timeline}
          </div>
        </div>

        {/* Our Recommendation */}
        <div className="p-5 bg-accent/10 rounded-lg border border-accent/20">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-accent" />
            <h4 className="font-semibold text-accent">Our Recommendation</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {data.strategicRecommendations}
          </p>
        </div>
      </Card>
    </div>
  );
}
