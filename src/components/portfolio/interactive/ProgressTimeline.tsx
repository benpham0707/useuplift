import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion } from 'motion/react';
import { Award, TrendingUp, CheckCircle } from 'lucide-react';

interface TimelineDataPoint {
  date: string;
  score: number;
  milestones: Array<{
    title: string;
    impact: number;
    icon: string;
  }>;
}

interface ProgressTimelineProps {
  history: TimelineDataPoint[];
  projection: {
    targetScore: number;
    targetDate: string;
    confidence: 'low' | 'medium' | 'high';
  };
  currentScore: number;
}

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({ 
  history, 
  projection,
  currentScore 
}) => {
  // Combine history with projection
  const allData = [
    ...history,
    {
      date: projection.targetDate,
      score: projection.targetScore,
      milestones: [],
      projected: true,
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null;
    
    const data = payload[0].payload;
    const milestones = data.milestones || [];
    
    return (
      <div className="bg-background border-2 border-primary/20 rounded-lg p-3 shadow-lg">
        <div className="font-bold text-sm mb-1">{data.date}</div>
        <div className="text-xl font-bold text-primary mb-2">Score: {data.score}</div>
        {milestones.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Milestones:</div>
            {milestones.map((milestone: any, idx: number) => (
              <div key={idx} className="text-xs flex items-start gap-2">
                <Award className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">{milestone.title}</div>
                  <div className="text-green-600">+{milestone.impact} pts</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {data.projected && (
          <div className="text-xs text-muted-foreground mt-2 italic">
            Projected ({projection.confidence} confidence)
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* Timeline Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Your Portfolio Growth
          </h3>
          <p className="text-sm text-muted-foreground">Track your progress over time</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Current Score</div>
          <div className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {currentScore}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={allData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="50%" stopColor="hsl(var(--secondary))" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              domain={[70, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Current score reference line */}
            <ReferenceLine 
              y={currentScore} 
              stroke="hsl(var(--primary))" 
              strokeDasharray="5 5"
              label={{ value: 'Current', fill: 'hsl(var(--primary))', fontSize: 12 }}
            />
            
            {/* Historical line */}
            <Line
              type="monotone"
              dataKey="score"
              stroke="url(#scoreGradient)"
              strokeWidth={3}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const hasMilestones = payload.milestones && payload.milestones.length > 0;
                
                return (
                  <g>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={hasMilestones ? 6 : 4}
                      fill={payload.projected ? 'transparent' : 'hsl(var(--primary))'}
                      stroke={payload.projected ? 'hsl(var(--primary))' : 'hsl(var(--background))'}
                      strokeWidth={2}
                      strokeDasharray={payload.projected ? '2 2' : '0'}
                    />
                    {hasMilestones && (
                      <CheckCircle
                        x={cx - 8}
                        y={cy - 18}
                        width={16}
                        height={16}
                        fill="hsl(var(--success))"
                      />
                    )}
                  </g>
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-gradient-to-r from-primary to-secondary" />
          <span className="text-muted-foreground">Historical Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 border-t-2 border-primary border-dashed" />
          <span className="text-muted-foreground">Projected</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-success" />
          <span className="text-muted-foreground">Milestone Achieved</span>
        </div>
      </div>
    </motion.div>
  );
};
