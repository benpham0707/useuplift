import { useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TrendingUp, Target, ChevronDown } from "lucide-react";
import { PortfolioProgressData } from "./types/portfolioTypes";
import { ProgressTimeline } from "./ProgressTimeline";
import { CompetitiveSpectrum } from "./CompetitiveSpectrum";
import { SchoolTierCard } from "./SchoolTierCard";

interface PortfolioProgressStandingProps {
  data: PortfolioProgressData;
}

export function PortfolioProgressStanding({ data }: PortfolioProgressStandingProps) {
  const { current, history, projection, competitiveStanding, nextMilestones } = data;
  
  // Collapsed state management - only first section open by default
  const [openSections, setOpenSections] = useState({
    timeline: true,
    standing: false,
    tiers: false,
    milestones: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const completedMilestones = nextMilestones.filter(m => m.status === 'completed').length;
  const totalMilestones = nextMilestones.length;
  const milestoneProgress = (completedMilestones / totalMilestones) * 100;
  const growthPoints = history[history.length - 1].score - history[0].score;

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <CardContent className="p-6">
        {/* Always Visible Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center pb-6 mb-6 border-b"
        >
          {/* Large Score Display */}
          <div className="text-7xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent mb-2">
            {current.score}
          </div>
          
          {/* Tier Badge */}
          <Badge variant="secondary" className="text-base px-4 py-1.5 mb-4">
            {current.tier}
          </Badge>

          {/* Compact 3-stat Grid */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <div className="text-lg font-semibold">{current.score}/100</div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{current.percentile}</div>
              <div className="text-xs text-muted-foreground">Percentile</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">+{growthPoints}</div>
              <div className="text-xs text-muted-foreground">Growth</div>
            </div>
          </div>
        </motion.div>

        {/* Collapsible Sections */}
        <div className="space-y-2">
          {/* Section 1: Progress Timeline */}
          <Collapsible open={openSections.timeline} onOpenChange={() => toggleSection('timeline')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 rounded-lg transition-colors border-b">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <div className="font-semibold">Progress Timeline</div>
                  <div className="text-sm text-muted-foreground">
                    View your progress over time • +{growthPoints} pts in 3 months
                  </div>
                </div>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-muted-foreground transition-transform ${
                  openSections.timeline ? 'rotate-180' : ''
                }`} 
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-5 pb-5 pt-4">
              <ProgressTimeline 
                history={history}
                projection={projection}
                currentScore={current.score}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Section 2: Competitive Standing */}
          <Collapsible open={openSections.standing} onOpenChange={() => toggleSection('standing')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 rounded-lg transition-colors border-b">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <div className="font-semibold">Competitive Standing</div>
                  <div className="text-sm text-muted-foreground">
                    You're in the competitive range • {current.percentile}
                  </div>
                </div>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-muted-foreground transition-transform ${
                  openSections.standing ? 'rotate-180' : ''
                }`} 
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-5 pb-5 pt-4">
              <CompetitiveSpectrum 
                yourScore={competitiveStanding.yourScore}
                spectrum={competitiveStanding.spectrum}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Section 3: School Tier Analysis */}
          <Collapsible open={openSections.tiers} onOpenChange={() => toggleSection('tiers')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 rounded-lg transition-colors border-b">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div className="text-left">
                  <div className="font-semibold">School Tier Analysis</div>
                  <div className="text-sm text-muted-foreground">
                    View admission probability by tier • 3 tiers analyzed
                  </div>
                </div>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-muted-foreground transition-transform ${
                  openSections.tiers ? 'rotate-180' : ''
                }`} 
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-5 pb-5 pt-4">
              <div className="space-y-3">
                <SchoolTierCard tier={competitiveStanding.tiers.safety} index={0} />
                <SchoolTierCard tier={competitiveStanding.tiers.target} index={1} />
                <SchoolTierCard tier={competitiveStanding.tiers.reach} index={2} />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Section 4: Next Milestones */}
          <Collapsible open={openSections.milestones} onOpenChange={() => toggleSection('milestones')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <div className="font-semibold">Next Milestones</div>
                  <div className="text-sm text-muted-foreground">
                    {completedMilestones} of {totalMilestones} milestones completed • +{nextMilestones.reduce((sum, m) => sum + m.estimatedImpact, 0)} pts possible
                  </div>
                </div>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-muted-foreground transition-transform ${
                  openSections.milestones ? 'rotate-180' : ''
                }`} 
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-5 pb-5 pt-4 space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {completedMilestones} of {totalMilestones} completed
                  </span>
                  <span className="font-medium">
                    {Math.round(milestoneProgress)}%
                  </span>
                </div>
                <Progress value={milestoneProgress} className="h-2" />
              </div>

              {/* Milestone List */}
              <div className="space-y-2">
                {nextMilestones.slice(0, 4).map((milestone, index) => {
                  const statusConfig = {
                    completed: { icon: "✅", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
                    "in-progress": { icon: "🔄", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
                    upcoming: { icon: "⏳", color: "text-muted-foreground", bg: "bg-muted/50" },
                  };
                  const config = statusConfig[milestone.status];

                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg ${config.bg}`}
                    >
                      <span className="text-lg">{config.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{milestone.title}</div>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <span className={`font-semibold ${config.color}`}>
                            +{milestone.estimatedImpact} pts
                          </span>
                          {milestone.deadline && (
                            <span className="text-muted-foreground">
                              Due: {new Date(milestone.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View All Button */}
              {totalMilestones > 4 && (
                <Button variant="outline" className="w-full" size="sm">
                  View All {totalMilestones} Milestones
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}
