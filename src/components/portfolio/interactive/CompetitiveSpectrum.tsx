import { motion } from "motion/react";

interface CompetitiveSpectrumProps {
  min: number;
  max: number;
  yourScore: number;
  avgScore: number;
  percentile: string;
  variant?: "default" | "inline";
}

export function CompetitiveSpectrum({ min, max, yourScore, avgScore, percentile, variant = "default" }: CompetitiveSpectrumProps) {
  // Calculate positions as percentages
  const getPosition = (score: number) => {
    return ((score - min) / (max - min)) * 100;
  };

  const yourPosition = getPosition(yourScore);
  const avgPosition = getPosition(avgScore);

  // Quartile positions - hardcoded placeholder values
  const quartiles = [
    { label: "25th", position: 25, score: min + (max - min) * 0.25 },
    { label: "50th", position: 50, score: min + (max - min) * 0.5 },
    { label: "75th", position: 75, score: min + (max - min) * 0.75 },
    { label: "90th", position: 90, score: min + (max - min) * 0.9 },
  ];

  // Inline variant - compact version
  if (variant === "inline") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Your Position: {percentile} ({yourScore} vs avg {avgScore})</span>
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
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-muted-foreground rounded-full border border-background"
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
            <div className="w-3 h-3 bg-primary rounded-full border-2 border-background" />
          </motion.div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>↑ You</span>
          <span>State Avg ↓</span>
        </div>
      </div>
    );
  }

  // Default variant - full version
  return (
    <div className="space-y-4">
      {/* Spectrum Bar */}
      <div className="relative h-16 rounded-lg overflow-hidden">
        {/* Gradient Background */}
        <div 
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, hsl(var(--destructive) / 0.2), hsl(var(--warning) / 0.2) 33%, hsl(var(--primary) / 0.2) 66%, hsl(var(--success) / 0.2))"
          }}
        />

        {/* Quartile Markers */}
        {quartiles.map((q, index) => (
          <div
            key={index}
            className="absolute top-0 bottom-0 w-[1px] bg-border"
            style={{ left: `${q.position}%` }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
              {q.label}
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
              {Math.round(q.score)}
            </div>
          </div>
        ))}

        {/* Average Marker */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${avgPosition}%` }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-3 h-3 bg-muted-foreground rounded-full border-2 border-background" />
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
            Avg: {avgScore}
          </div>
        </motion.div>

        {/* Your Position Marker */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
          style={{ left: `${yourPosition}%` }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 w-5 h-5 -translate-x-[calc(50%-10px)] -translate-y-[calc(50%-10px)] bg-primary/30 rounded-full blur-md animate-pulse" />
            
            {/* Marker */}
            <div className="relative w-5 h-5 bg-primary rounded-full border-4 border-background shadow-lg" />
            
            {/* Label */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-lg">
              You: {yourScore}
              <div className="text-[10px] font-normal opacity-90">{percentile}</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scale Labels */}
      <div className="flex justify-between text-xs text-muted-foreground pt-8">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
