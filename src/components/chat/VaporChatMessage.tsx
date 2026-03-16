/**
 * VaporChatMessage v19 — Straight Top-Down Fade
 *
 * Simple linear-gradient mask: solid at top, fades to transparent
 * at the forming edge. No curves. Scroll-scrubable, replays on
 * scroll up/down. ~25% gradient zone for a gradual appearance.
 */

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionTemplate } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Sparkles } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface VaporChatMessageProps {
  id: string;
  role: "user" | "sage";
  content: string;
}

export const VaporChatMessage: React.FC<VaporChatMessageProps> = ({ id, role, content }) => {
  const isUser = role === "user";
  const containerRef = useRef<HTMLDivElement>(null);

  // --- 1. THE PHYSICS ENGINE ---
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 85%", "start 50%"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 20,
    mass: 0.8,
    restDelta: 0.001,
  });

  // --- 2. STRAIGHT TOP-DOWN FADE ---
  // Simple linear gradient mask. Solid at top, fades to transparent at the forming edge.
  // solidStop: where fully-visible region ends. fadeStop: where it goes fully transparent.
  // At p=0: solid 0%, fade 0% → completely invisible.
  // At p=1: solid 100%, fade 100% → completely visible.
  // 110% gap = even more gradual. Middle stays noticeably faded longer.
  const solidStop = useTransform(smoothProgress, [0, 1], [-110, 100]);
  const fadeStop = useTransform(smoothProgress, [0, 1], [0, 210]);
  const revealMask = useMotionTemplate`linear-gradient(to bottom, black ${solidStop}%, transparent ${fadeStop}%)`;

  // --- WHITE MIST OVERLAY ---
  // Tracks the forming edge and fades out progressively as the box solidifies.
  const mistTop = useTransform(smoothProgress, [0, 1], [-15, 110]);
  const mistOpacity = useTransform(smoothProgress, [0, 0.05, 0.5, 0.85, 1], [0, 0.6, 0.4, 0.15, 0]);

  // --- 3. AVATAR FADE ---
  const avatarOpacity = useTransform(smoothProgress, [0, 0.15], [0, 1]);
  const avatarScale = useTransform(smoothProgress, [0, 0.2, 1], [0.8, 1, 1]);

  // --- 4. COLOR PALETTES ---
  const glassGradient = isUser
    ? "linear-gradient(135deg, hsl(250 70% 60% / 0.85), hsl(280 90% 65% / 0.75))"
    : "linear-gradient(135deg, hsl(235 20% 15% / 0.95), hsl(230 15% 12% / 0.95))";

  const borderRadiusClasses = isUser
    ? "rounded-[22px_22px_4px_22px]"
    : "rounded-[22px_22px_22px_4px]";

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex w-full mb-8 relative group",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* --- SAGE AVATAR --- */}
      {!isUser && (
        <div className="flex-shrink-0 mr-4 flex items-end pb-1 z-20">
          <motion.div
            style={{ opacity: avatarOpacity, scale: avatarScale }}
            className="h-9 w-9 rounded-full bg-gradient-to-tr from-[hsl(250_70%_60%)] to-[hsl(185_80%_55%)] p-[1.5px] shadow-[0_0_20px_rgba(136,100,230,0.5)]"
          >
            <div className="h-full w-full rounded-full bg-[hsl(235_20%_15%)] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[hsl(185_80%_55%)]" />
            </div>
          </motion.div>
        </div>
      )}

      {/* --- THE MATERIALIZING MESSAGE BOX --- */}
      <div className="relative max-w-[80%] flex items-end">
        {/* Mask is permanent — at p=1 the math makes it fully solid.
            Scrolling away rewinds smoothProgress to 0, replaying the fade. */}
        <motion.div
          className={cn(
            "relative px-6 py-4 backdrop-blur-md overflow-hidden z-10",
            borderRadiusClasses,
            isUser
              ? "text-white shadow-[0_4px_24px_rgba(147,51,234,0.15)] border border-[hsl(280_90%_65%)]/30"
              : "text-[hsl(0_0%_92%)] shadow-[0_4px_24px_rgba(0,0,0,0.2)] border border-[hsl(185_80%_55%)]/20"
          )}
          style={{
            background: glassGradient,
            WebkitMaskImage: revealMask,
            maskImage: revealMask,
          }}
        >
          {/* Inner glass reflection */}
          <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] pointer-events-none" />

          {/* White mist at the forming edge — rises out of a white haze */}
          <motion.div
            className="absolute left-0 right-0 h-[80px] pointer-events-none z-30 blur-[12px]"
            style={{
              top: useMotionTemplate`${mistTop}%`,
              opacity: mistOpacity,
              background: "linear-gradient(to bottom, transparent, white 40%, white 60%, transparent)",
            }}
          />

          <p className="relative z-20 m-0 drop-shadow-md text-[15px] leading-relaxed">
            {content}
          </p>
        </motion.div>
      </div>
    </div>
  );
};
