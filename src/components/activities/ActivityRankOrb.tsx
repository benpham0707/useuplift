/**
 * ActivityRankOrb — Animated score visualization with glow ring.
 *
 * Renders a circular SVG progress ring with motion-animated fill,
 * score-based color theming, and a hover-responsive outer glow.
 */
import { motion } from "motion/react";
import { getScoreColor } from "../portfolio/activity-workshop/insightTypes";

interface ActivityRankOrbProps {
  score: number;
  tier: string;
}

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const ActivityRankOrb = ({ score, tier }: ActivityRankOrbProps) => {
  const percentage = Math.min(score / 10, 1) * 100;
  const color = getScoreColor(score);

  return (
    <div className="relative flex items-center justify-center w-16 h-16 group">
      {/* Outer Glow Ring — pulses on card hover */}
      <div
        className="absolute inset-0 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle, ${color}50, transparent)` }}
      />

      <svg className="w-full h-full" viewBox="0 0 64 64">
        {/* Track ring */}
        <circle
          cx="32"
          cy="32"
          r={RADIUS}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          className="text-muted/30"
        />
        {/* Animated progress ring */}
        <motion.circle
          cx="32"
          cy="32"
          r={RADIUS}
          stroke={color}
          strokeWidth="4"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: CIRCUMFERENCE - (CIRCUMFERENCE * percentage) / 100 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "32px 32px",
            filter: `drop-shadow(0 0 6px ${color}60)`,
          }}
        />
      </svg>

      {/* Centered label */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl font-black tracking-tighter text-foreground leading-none">
          {score.toFixed(1)}
        </span>
        <span className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest">
          {tier}
        </span>
      </div>
    </div>
  );
};
