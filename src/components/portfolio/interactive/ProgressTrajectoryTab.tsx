import { useState } from "react";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, Calendar, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface HistoryPoint {
  date: string;
  score: number;
  milestones: Array<{
    title: string;
    impact: number;
    icon: string;
  }>;
}

interface TrajectoryData {
  growthAnalysis: string;
  scenarios: Array<{
    title: string;
    newPercentile: string;
    requirements: string;
    points: number;
  }>;
}

interface ProjectionData {
  targetScore: number;
  targetDate: string;
  confidence: 'low' | 'medium' | 'high';
}

interface ProgressTrajectoryTabProps {
  history: HistoryPoint[];
  trajectory: TrajectoryData;
  projection: ProjectionData;
}

export function ProgressTrajectoryTab({ history, trajectory, projection }: ProgressTrajectoryTabProps) {
  const [isMilestonesOpen, setIsMilestonesOpen] = useState(false);
  
  // Safety checks
  if (!trajectory || !trajectory.growthAnalysis) {
    console.error('Invalid trajectory data:', trajectory);
    return (
      <div className="text-center p-6 text-muted-foreground">
        Trajectory data is not available
      </div>
    );
  }

  // Format data for chart - hardcoded placeholder data structure
  const chartData = history.map(point => ({
    date: point.date,
    score: point.score,
  }));

  // Add projection point
  const projectionData = [
    ...chartData,
    {
      date: projection.targetDate,
      score: projection.targetScore,
      isProjection: true,
    }
  ];

  return (
    <div className="space-y-6">
      {/* Timeline Chart */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Score Progression</h3>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={projectionData}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              domain={[70, 100]} 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fill="url(#scoreGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Milestone Breakdown - Collapsible */}
      <Card className="p-4">
        <Collapsible open={isMilestonesOpen} onOpenChange={setIsMilestonesOpen}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Key Milestones</h3>
              <CollapsibleTrigger asChild>
                <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  {isMilestonesOpen ? "Hide details" : "View impact analysis"}
                  <ChevronDown className={`w-4 h-4 transition-transform ${isMilestonesOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
            </div>
            
            {/* Condensed Summary */}
            <div className="space-y-1 text-sm">
              {history.slice(0, 3).map((point, index) => (
                point.milestones.map((milestone, mIndex) => (
                  <div key={`${index}-${mIndex}`} className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-primary">•</span>
                    <span>{point.date}: {milestone.title}</span>
                    <span className="text-success font-medium">(+{milestone.impact})</span>
                  </div>
                ))
              ))}
            </div>

            <CollapsibleContent className="pt-3">
              <div className="space-y-3">
                {history.map((point, index) => (
                  <div key={index}>
                    {point.milestones.map((milestone, mIndex) => (
                      <motion.div
                        key={`${index}-${mIndex}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between py-3 border-b last:border-b-0"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{milestone.title}</div>
                          <div className="text-sm text-muted-foreground">{point.date}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-semibold text-success">+{milestone.impact} pts</div>
                          </div>
                          <div className="text-right min-w-[60px]">
                            <div className="text-lg font-bold">{point.score}</div>
                            <div className="text-xs text-muted-foreground">New Score</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </Card>

      {/* Growth Analysis */}
      <Card className="p-6 bg-gradient-to-br from-accent/5 to-accent/10">
        <h3 className="font-semibold text-lg mb-4">Growth Analysis</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {trajectory.growthAnalysis}
        </p>
      </Card>

      {/* Projection Box */}
      <Card className="p-6 bg-gradient-to-br from-secondary/5 to-secondary/10">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-secondary" />
          <h3 className="font-semibold text-lg">Future Projections</h3>
        </div>
        
        <div className="space-y-4">
          <div className="text-sm font-medium mb-3">
            With 6 months until applications, realistic targets include:
          </div>
          
          {trajectory.scenarios.map((scenario, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-4 bg-background/50 rounded-lg border"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center text-sm font-bold text-secondary">
                +{scenario.points}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm mb-1">
                  {scenario.title} → {scenario.newPercentile}
                </div>
                <div className="text-xs text-muted-foreground">
                  {scenario.requirements}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
