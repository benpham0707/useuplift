import React from 'react';
import { motion } from 'motion/react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Award, Heart, Users, BookOpen } from 'lucide-react';

interface Milestone {
  title: string;
  impact: number;
  icon: string;
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

const iconMap: Record<string, React.ComponentType<any>> = {
  Award,
  Heart,
  Users,
  BookOpen,
};

export const InteractiveProgressBar: React.FC<InteractiveProgressBarProps> = ({
  history,
  currentScore,
}) => {
  const startScore = history[0].score;
  const endScore = currentScore;
  const scoreRange = 100 - 70; // Display range 70-100

  // Calculate position for each milestone
  const getMilestonePosition = (score: number) => {
    return ((score - 70) / scoreRange) * 100;
  };

  return (
    <div className="w-full py-4">
      {/* Labels */}
      <div className="flex justify-between mb-2 text-sm">
        <span className="text-muted-foreground">3 months ago: {startScore}</span>
        <span className="font-semibold text-foreground">Today: {endScore}</span>
      </div>

      {/* Progress Bar Container */}
      <div className="relative h-16 w-full">
        {/* Background bar with gradient */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-muted via-muted to-muted overflow-hidden">
          {/* Score scale markers */}
          <div className="absolute inset-0 flex items-center justify-between px-4">
            {[70, 75, 80, 85, 90, 95, 100].map((score) => (
              <div key={score} className="text-xs text-muted-foreground/40 font-mono">
                {score}
              </div>
            ))}
          </div>
        </div>

        {/* Filled progress gradient */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${getMilestonePosition(currentScore)}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
          style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.5)' }}
        />

        {/* Milestone markers */}
        {history.map((point, index) => {
          const position = getMilestonePosition(point.score);
          const milestone = point.milestones[0]; // Get first milestone for this point
          if (!milestone) return null;

          const IconComponent = iconMap[milestone.icon] || Award;

          return (
            <HoverCard key={index} openDelay={0} closeDelay={100}>
              <HoverCardTrigger asChild>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.2, type: 'spring', stiffness: 200 }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer z-10"
                  style={{ left: `${position}%` }}
                >
                  <div className="relative">
                    {/* Milestone dot */}
                    <div className="w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-lg">
                      <IconComponent className="w-4 h-4 text-primary" />
                    </div>
                    {/* Pulse animation */}
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                      className="absolute inset-0 rounded-full bg-primary"
                    />
                  </div>
                </motion.div>
              </HoverCardTrigger>
              <HoverCardContent className="w-64" side="top">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <IconComponent className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm leading-tight">{milestone.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{point.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Impact</span>
                    <span className="text-lg font-bold text-green-600">+{milestone.impact} pts</span>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </div>
    </div>
  );
};
