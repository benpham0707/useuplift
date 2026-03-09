import React, { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ChatNav } from "./ChatNav";
import { MessageDisplay } from "./MessageDisplay";
import { ChatInput } from "./ChatInput";

export const ChatPlatform: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax background effect on global scroll for deep immersion
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  const handleSendMessage = (message: string) => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 4500);
  };

  return (
    <div ref={containerRef} className="relative min-h-screen w-full bg-slate-50/50">
      {/* 1. Immersive Global Environment */}
      <motion.div
        className="absolute inset-0 z-[-2] bg-[radial-gradient(circle_at_40%_20%,var(--tw-gradient-stops))] from-[hsl(250,70%,60%,0.08)] via-transparent to-transparent"
        style={{ y: backgroundY }}
      />
      <div className="absolute inset-0 z-[-1] overflow-hidden">
        <div className="absolute top-1/2 left-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-radial from-[hsl(185,80%,55%,0.05)] to-transparent blur-3xl" />
        <div className="absolute top-1/2 right-0 h-[800px] w-[800px] translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-radial from-[hsl(280,90%,65%,0.05)] to-transparent blur-3xl" />
      </div>

      {/* 2. Platform Navigation */}
      <ChatNav isAnalyzing={isAnalyzing} />

      {/* 3. Central Holo-Surface Console */}
      <main className="flex h-[calc(100vh-80px)] w-full items-center justify-center p-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex h-full w-full max-w-[1600px] flex-col overflow-hidden rounded-[2.5rem] bg-slate-100/50 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1),0_10px_40px_-10px_rgba(124,58,237,0.05)] ring-1 ring-white/60 backdrop-blur-3xl"
        >
          {/* Layered Holo-Surface depth stack */}
          <div className="absolute inset-0 z-[-1] overflow-hidden rounded-[2.5rem]">
            {/* The oscillating gradient border/edge light */}
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.01, 1],
              }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute -inset-[3px] rounded-[2.6rem] bg-gradient-to-r from-[hsl(250,70%,60%)] via-[hsl(185,80%,55%)] to-[hsl(280,90%,65%)] blur-[2px]"
            />
            {/* Inner background surface */}
            <div className="absolute inset-[3px] rounded-[2.5rem] bg-slate-100/60 shadow-inner shadow-slate-950/5" />
          </div>

          {/* Integrated Components */}
          <MessageDisplay isAnalyzing={isAnalyzing} />
          <ChatInput isAnalyzing={isAnalyzing} onSendMessage={handleSendMessage} />

          {/* Subtle Platform Watermark */}
          <div className="absolute bottom-2 left-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 opacity-70">
            Platform Stratum V1.4 // Uplift OS
          </div>
        </motion.div>
      </main>
    </div>
  );
};
