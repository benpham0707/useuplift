import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Activity, MessageSquareDot, SearchCheck, Microchip, LayoutGrid } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatNavProps {
  isAnalyzing: boolean;
}

const platformTabs = [
  { id: "chat", label: "Chat", icon: MessageSquareDot },
  { id: "review", label: "Review", icon: SearchCheck },
  { id: "audio", label: "Audio", icon: Microchip },
];

export const ChatNav: React.FC<ChatNavProps> = ({ isAnalyzing }) => {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <header className="relative z-50 flex h-20 items-center justify-between gap-6 border-b border-[hsl(250,70%,60%,0.2)] bg-white px-8 shadow-md shadow-[hsl(250,70%,60%,0.05)]">
      {/* Background Layer: Integrated platform depth */}
      <div className="absolute inset-0 z-[-1] overflow-hidden">
        <div className="absolute inset-0 bg-slate-50/50" />
        {/* Subtle, moving light beam effect */}
        <motion.div
          animate={{ x: ['100%', '-100%'] }}
          transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          className="absolute -top-1/2 left-0 h-[200%] w-32 bg-gradient-to-r from-transparent via-[hsl(185,80%,55%,0.1)] to-transparent skew-x-[-20deg]"
        />
      </div>

      {/* 1. Identity Module */}
      <div className="flex w-1/4 shrink-0 items-center gap-4">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 shadow-lg shadow-purple-500/10">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[hsl(250,70%,60%)] to-[hsl(185,80%,55%)] opacity-20" />

          {/* Breathing glow effect */}
          <motion.div
            animate={{
              opacity: isAnalyzing ? [0.2, 0.7, 0.2] : 0.2,
              scale: isAnalyzing ? [1, 1.05, 1] : 1,
            }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute inset-0 rounded-2xl border-2 border-[hsl(185,80%,55%)] blur-sm"
          />

          <Sparkles className="relative z-10 h-7 w-7 text-white" strokeWidth={1.5} />
        </div>

        <div className="flex flex-col">
          <h2 className="text-xl font-bold tracking-tighter text-slate-950">
            Uplift OS
          </h2>
          <span className="flex items-center gap-1.5 text-sm font-medium text-[hsl(250,70%,60%)]">
            <Activity className="h-3.5 w-3.5" />
            Core Analytics V2.0
          </span>
        </div>
      </div>

      {/* 2. Platform Navigation (Technical Capability tabs) */}
      <nav className="flex items-center gap-2 rounded-2xl bg-slate-100/80 p-1.5 ring-1 ring-slate-950/5">
        {platformTabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              className={cn(
                "relative flex items-center gap-2.5 rounded-[12px] px-6 py-3 text-sm font-semibold tracking-tight transition-colors duration-200",
                isActive ? "text-white" : "text-slate-600 hover:text-slate-900"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="navTabIndicator"
                  className="absolute inset-0 z-0 rounded-[12px] bg-gradient-to-r from-[hsl(250,70%,60%)] to-[hsl(185,80%,55%)] shadow-md shadow-purple-500/25"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <Icon className={cn("relative z-10 h-[18px] w-[18px]", isActive ? "opacity-100" : "opacity-70")} strokeWidth={isActive ? 2 : 1.5} />
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* 3. Status and System Actions */}
      <div className="flex w-1/4 shrink-0 items-center justify-end gap-3">
        {/* System Active Status Indicator */}
        <div className="flex items-center gap-2.5 rounded-full bg-white px-5 py-2.5 shadow-inner shadow-slate-950/5 ring-1 ring-slate-200">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_4px_rgba(52,211,153,0.3)]" />
          <span className="text-sm font-medium text-slate-700">Online</span>
        </div>

        {/* Modern technical control action */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: "#fff" }}
          whileTap={{ scale: 0.95 }}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/60 text-slate-500 transition-colors hover:text-slate-900 ring-1 ring-slate-200"
        >
          <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />
        </motion.button>
      </div>
    </header>
  );
};
