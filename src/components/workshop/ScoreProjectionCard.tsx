import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import gsap from "gsap";
import { TrendingUp } from "lucide-react";
import type { WorkshopData } from "@/types/workshop";

export const ScoreProjectionCard: React.FC<{ scoreData: WorkshopData["score"] }> = ({ scoreData }) => {
  const currentRef = useRef<HTMLSpanElement>(null);
  const projectedRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        currentRef.current,
        { textContent: "0.0" },
        {
          textContent: scoreData.current.toFixed(1),
          duration: 1,
          snap: { textContent: 0.1 },
        }
      ).fromTo(
        projectedRef.current,
        { textContent: scoreData.current.toFixed(1) },
        {
          textContent: scoreData.projected.toFixed(1),
          duration: 1.5,
          snap: { textContent: 0.1 },
          ease: "elastic.out(1, 0.5)",
          delay: 0.2,
        },
        "<"
      );
    });

    return () => ctx.revert();
  }, [scoreData]);

  const gain = (scoreData.projected - scoreData.current).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 120, damping: 18 }}
      className="mt-6 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/[0.03] to-cyan-500/[0.03]"
    >
      <div className="p-5 flex flex-col gap-4">

        {/* Score Header */}
        <div className="flex items-center gap-5">
          <div className="flex items-baseline gap-2">
            <span
              ref={currentRef}
              className="text-2xl font-bold text-muted-foreground/60 line-through decoration-red-400/40 decoration-1"
            />
            <span className="text-base text-muted-foreground/40">&rarr;</span>
            <span
              ref={projectedRef}
              className="text-4xl font-black text-purple-600"
            />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-500/8 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <TrendingUp className="w-3.5 h-3.5" />
            +{gain} projected
          </div>
        </div>

        {/* Narrative */}
        <p className="text-[13px] text-foreground/70 leading-relaxed">
          {scoreData.narrative}
        </p>

        {/* Dimension Stat Chips */}
        {scoreData.dimensions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border/40">
            {scoreData.dimensions.map((dim, i) => (
              <motion.div
                key={dim.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.08 }}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 border border-purple-500/15 bg-purple-500/[0.03]"
              >
                <span className="text-muted-foreground">{dim.name}</span>
                <span className="text-purple-600 font-semibold">+{dim.value.toFixed(1)}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
