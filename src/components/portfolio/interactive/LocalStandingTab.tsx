import { useState } from "react";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp, School, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
      {/* Section 1: Where You Stand */}
      <Card className="p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="w-7 h-7 text-primary" />
          <div>
            <h3 className="text-2xl font-bold">Your {data.region} Standing</h3>
            <p className="text-sm text-muted-foreground">
              Among {data.totalStudents.toLocaleString()} high school students in your state
            </p>
          </div>
        </div>
        
        {/* Hero Metric */}
        <div className="text-center py-6 mb-6">
          <div className="text-6xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Top {data.percentile.replace(/[^\d]/g, '')}%
          </div>
          <div className="text-lg text-muted-foreground mb-4">Your State Percentile</div>
          
          {/* Inline Spectrum */}
          <div className="max-w-2xl mx-auto mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-foreground">Your Score: {yourScore}</span>
              <span className="text-muted-foreground">State Avg: {data.avgScore}</span>
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
                <div className="w-4 h-4 bg-primary rounded-full border-2 border-background shadow-lg" />
              </motion.div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>↑ You</span>
              <span>State Avg ↓</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-border" />

        {/* What This Means */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-success" />
            <h4 className="font-semibold text-lg">What This Means for You</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.strengths}
          </p>
        </div>
      </Card>

      {/* Section 2: School Fit Analysis */}
      <Card className="p-8 bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent">
        <div className="flex items-center gap-2 mb-6">
          <School className="w-6 h-6 text-secondary" />
          <h3 className="font-bold text-2xl">School Fit Analysis</h3>
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
                  variant={selectedComparison.gap > 0 ? "default" : selectedComparison.gap === 0 ? "secondary" : "outline"}
                  className={selectedComparison.gap > 0 ? "bg-success text-white" : selectedComparison.gap === 0 ? "" : "bg-warning text-warning-foreground"}
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
                  <span className="text-muted-foreground">{tiers.safety.schools.join(", ")} ({tiers.safety.schools.length} schools)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-warning font-medium">⚠️ Target:</span>
                  <span className="text-muted-foreground">{tiers.target.schools.join(", ")} ({Math.abs(tiers.target.gap)}pt gap, {tiers.target.schools.length} schools)</span>
                </div>
              </div>

              <CollapsibleContent className="pt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Safety */}
                  <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-success">Safety Schools</div>
                      <div className="text-xl">✅</div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {tiers.safety.schools.join(", ")}
                    </div>
                    <div className="text-xs font-medium text-success">
                      {tiers.safety.admissionProbability.min}-{tiers.safety.admissionProbability.max}% admit rate
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Above avg by +{Math.abs(tiers.safety.gap)} pts
                    </div>
                  </div>

                  {/* Target */}
                  <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-warning">Target Schools</div>
                      <div className="text-xl">⚠️</div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {tiers.target.schools.join(", ")}
                    </div>
                    <div className="text-xs font-medium text-warning">
                      {tiers.target.admissionProbability.min}-{tiers.target.admissionProbability.max}% admit rate
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Gap: {Math.abs(tiers.target.gap)} pts
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>

        {/* Strategy */}
        <div className="p-5 bg-accent/10 rounded-lg border border-accent/20">
          <h4 className="font-semibold text-accent mb-2 flex items-center gap-2">
            Strategy
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.actionableInsight}
          </p>
        </div>
      </Card>
    </div>
  );
}
