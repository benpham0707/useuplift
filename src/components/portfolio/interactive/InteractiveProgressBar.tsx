import { motion } from "motion/react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Trophy, Award, Medal, Star } from "lucide-react";

interface Milestone {
  title: string;
  impact: number;
  icon: string;
  competitiveContext?: string[];
  profileImpact?: string;
}

interface HistoryPoint {
  date: string;
  score: number;
  milestones: Milestone[];
}

interface InteractiveProgressBarProps {
  history: HistoryPoint[];
  currentScore: number;
}

// Icon mapping - hardcoded data values for demonstration
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  award: Award,
  medal: Medal,
  star: Star,
};

export function InteractiveProgressBar({ history, currentScore }: InteractiveProgressBarProps) {
  const startScore = history[0]?.score || 70;
  const endScore = currentScore;

  // Helper function to calculate position (70-100 scale)
  const getMilestonePosition = (score: number) => {
    return ((score - 70) / 30) * 100;
  };

  return (
    <div className="space-y-3">
      {/* Labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>3 months ago: {startScore}</span>
        <span>Today: {endScore}</span>
      </div>

      {/* Progress Bar Container */}
      <div className="relative h-[60px] bg-muted/30 rounded-full overflow-visible">
        {/* Background Scale Markers */}
        <div className="absolute inset-0 flex justify-between items-center px-4 text-[10px] text-muted-foreground/40">
          {[75, 80, 85, 90, 95].map((mark) => (
            <div key={mark} className="relative">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-[1px] h-3 bg-muted-foreground/20" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2">{mark}</div>
            </div>
          ))}
        </div>

        {/* Gradient Progress Fill */}
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--accent)))",
            boxShadow: "0 0 20px hsl(var(--primary) / 0.3)",
          }}
          initial={{ width: "0%" }}
          animate={{ width: `${getMilestonePosition(currentScore)}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* Milestone Markers */}
        {history.map((point, index) => 
          point.milestones.map((milestone, mIndex) => {
            const IconComponent = iconMap[milestone.icon] || Star;
            const position = getMilestonePosition(point.score);

            return (
              <HoverCard key={`${index}-${mIndex}`} openDelay={200}>
                <HoverCardTrigger asChild>
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer z-10"
                    style={{ left: `${position}%` }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.2, duration: 0.3 }}
                  >
                    <div className="relative">
                      {/* Outer glow ring */}
                      <div className="absolute inset-0 w-12 h-12 -translate-x-[calc(50%-6px)] -translate-y-[calc(50%-6px)] bg-primary/20 rounded-full blur-sm" />
                      
                      {/* Icon container */}
                      <div className="relative w-12 h-12 bg-background border-2 border-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </motion.div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80" side="top">
                  <div className="space-y-3">
                    {/* Header */}
                    <div>
                      <div className="font-semibold text-base">{milestone.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {point.date} • +{milestone.impact} points
                      </div>
                    </div>

                    {/* Competitive Context */}
                    {milestone.competitiveContext && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-primary">Competitive Context:</div>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {milestone.competitiveContext.map((context, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{context}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Profile Impact */}
                    {milestone.profileImpact && (
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-secondary">Impact on Your Profile:</div>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          {milestone.profileImpact}
                        </div>
                      </div>
                    )}
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          })
        )}
      </div>
    </div>
  );
}
