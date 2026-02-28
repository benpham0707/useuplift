import React from "react";
import { motion } from "motion/react";
import { CardHeader } from "./CardHeader";
import { CardBody } from "./CardBody";
import { CardFooter } from "./CardFooter";
import { ChevronRight } from "lucide-react";

export interface ActivityData {
  id: string;
  index: number;
  title: string;
  score: number;
  tier: string;
  category: string;
  description: string;
  hours: number;
  essays: number;
  checks: number;
  insights: number;
}

interface ActivityCardProps {
  data: ActivityData;
  onClick?: () => void;
}

export const ActivityCard = ({ data, onClick }: ActivityCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: data.index * 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="group relative w-full mb-6"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="relative bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_20px_40px_rgba(99,102,241,0.08)] hover:border-indigo-100 dark:hover:border-indigo-900/30 hover:-translate-y-1 overflow-hidden z-10 cursor-pointer">

        {/* Subtle decorative glow — top-right corner */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-full blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform translate-x-1/2 -translate-y-1/2" />

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Main Content (Left) */}
          <div className="flex-1 min-w-0 space-y-4">
            <CardHeader index={data.index} title={data.title} tier={data.tier} category={data.category} />
            <CardBody description={data.description} />
            <div className="pt-3">
              <CardFooter hours={data.hours} essays={data.essays} checks={data.checks} insights={data.insights} />
            </div>
          </div>

          {/* Score & Action (Right) */}
          <div className="flex flex-row md:flex-col items-center justify-between md:justify-center gap-6 md:pl-8 md:border-l border-slate-100 dark:border-slate-800 shrink-0 h-full">
            <ScoreRing score={data.score} tier={data.tier} />

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_8px_20px_rgba(79,70,229,0.3)] group-hover:border-indigo-600"
            >
              <ChevronRight size={24} strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/** Score Ring — vibrant cyan with perfect text alignment */
const ScoreRing = ({ score, tier }: { score: number; tier: string }) => {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (circumference * (score / 10));

  return (
    <div className="relative flex flex-col items-center justify-center w-[84px] h-[84px]">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={radius} className="fill-none stroke-slate-100 dark:stroke-slate-800" strokeWidth="5" />
        <motion.circle
          cx="42" cy="42" r={radius}
          className="fill-none stroke-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]"
          strokeWidth="5"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: strokeOffset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          strokeLinecap="round"
        />
      </svg>
      {/* Perfect Alignment — No Overlap */}
      <div className="flex flex-col items-center justify-center z-10 pt-1">
        <span className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">
          {score.toFixed(1)}
        </span>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          {tier}
        </span>
      </div>
    </div>
  );
};
