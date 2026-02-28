import React from "react";
import { motion } from "motion/react";
import { TrendingUp, ArrowDown } from "lucide-react";
import type { WorkshopData } from "@/types/workshop";

export const ScoreProjectionCard: React.FC<{ scoreData: WorkshopData["score"] }> = ({ scoreData }) => {
  const gain = (scoreData.projected - scoreData.current).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 120, damping: 18 }}
      className="mt-8 rounded-xl border border-border bg-card/50 shadow-sm overflow-hidden flex flex-col md:flex-row"
    >
      {/* Left Panel — Score Gauge */}
      <div className="p-6 bg-muted/30 border-b md:border-b-0 md:border-r border-border flex flex-col items-center justify-center text-center shrink-0 min-w-[200px]">
        <span className="text-lg text-muted-foreground line-through">
          {scoreData.current.toFixed(1)}
        </span>
        <ArrowDown className="w-4 h-4 text-muted-foreground/30 my-1" />
        <span className="text-5xl font-black tracking-tighter text-foreground">
          {scoreData.projected.toFixed(1)}
        </span>
        <div className="mt-3 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          +{gain} Projected
        </div>
      </div>

      {/* Right Panel — Analysis Readout */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        {/* Narrative */}
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Impact Forecast
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {scoreData.narrative}
          </p>
        </div>

        {/* Stat Chips */}
        {scoreData.dimensions.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {scoreData.dimensions.map((dim, i) => (
              <motion.div
                key={dim.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-border bg-background shadow-sm text-xs"
              >
                <span className="text-muted-foreground font-medium">{dim.name}</span>
                <span className="text-foreground font-bold">+{dim.value.toFixed(1)}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
