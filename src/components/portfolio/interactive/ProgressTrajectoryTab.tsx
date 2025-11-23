import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceDot } from "recharts";
import { TrendingUp, Calendar, Award } from "lucide-react";

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
    hasMilestone: point.milestones.length > 0,
    milestones: point.milestones,
  }));

  // Add projection point
  const projectionData = [
    ...chartData,
    {
      date: projection.targetDate,
      score: projection.targetScore,
      isProjection: true,
      hasMilestone: false,
      milestones: [],
    }
  ];

  // Custom tooltip to show milestones
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm">{data.date}</p>
          <p className="text-primary font-bold text-lg">Score: {data.score}</p>
          {data.milestones && data.milestones.length > 0 && (
            <div className="mt-2 pt-2 border-t space-y-1">
              {data.milestones.map((milestone: any, idx: number) => (
                <div key={idx} className="text-xs">
                  <p className="font-medium">{milestone.title}</p>
                  <p className="text-success">+{milestone.impact} pts</p>
                </div>
              ))}
            </div>
          )}
          {data.isProjection && (
            <p className="text-xs text-muted-foreground mt-1">Projected</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Your Growth Story */}
      <Card className="p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h3 className="font-bold text-2xl">Your Growth Story</h3>
        </div>
        
        {/* Timeline Chart with Milestones */}
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={projectionData}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
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
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fill="url(#scoreGradient)"
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (payload.hasMilestone) {
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={6} fill="hsl(var(--success))" stroke="hsl(var(--background))" strokeWidth={2} />
                      <Award className="w-3 h-3" x={cx - 6} y={cy - 6} fill="hsl(var(--background))" />
                    </g>
                  );
                }
                if (payload.isProjection) {
                  return (
                    <circle cx={cx} cy={cy} r={5} fill="hsl(var(--secondary))" stroke="hsl(var(--background))" strokeWidth={2} strokeDasharray="4 4" />
                  );
                }
                return <circle cx={cx} cy={cy} r={4} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2} />;
              }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Divider */}
        <div className="my-6 border-t border-border" />

        {/* Growth Analysis */}
        <div>
          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span className="text-primary">What This Means</span>
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {trajectory.growthAnalysis}
          </p>
        </div>

        {/* Milestone Legend */}
        <div className="mt-6 pt-4 border-t flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success rounded-full" />
            <span>Milestone Achievement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-secondary rounded-full border-2 border-dashed" />
            <span>Projected Target</span>
          </div>
        </div>
      </Card>

      {/* Section 2: What's Next */}
      <Card className="p-8 bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-6 h-6 text-secondary" />
          <h3 className="font-bold text-2xl">What's Next: Your Growth Targets</h3>
        </div>
        
        <p className="text-sm text-muted-foreground mb-6">
          With 6 months remaining, here's your path forward:
        </p>
        
        <div className="space-y-4">
          {trajectory.scenarios.map((scenario, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4 p-5 bg-background/60 rounded-lg border-2 border-border/50 hover:border-secondary/50 transition-colors"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center">
                <div className="text-lg font-bold text-secondary">+{scenario.points}</div>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-base mb-1">
                  {scenario.title} → {scenario.newPercentile}
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {scenario.requirements}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recommendation */}
        {trajectory.scenarios.length > 0 && (
          <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
            <p className="text-sm">
              <span className="font-semibold text-accent">Our Recommendation:</span>{" "}
              <span className="text-muted-foreground">
                Focus on {trajectory.scenarios[0].title.toLowerCase()} as it provides the strongest 
                return on investment given your current profile and timeline.
              </span>
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
