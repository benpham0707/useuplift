import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Cloud, History, BookOpen } from 'lucide-react';

export function ChatHeader() {
  return (
    <header className="relative flex items-center justify-between px-6 py-4 bg-white/40 backdrop-blur-xl border-b border-white/60 shadow-sm z-20">

      {/* Title & Icon Group */}
      <div className="flex items-center gap-3">
        {/* Sage Icon Container */}
        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-cyan-100 to-purple-100 border border-white shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-purple-300/50"
          />
          <Sparkles className="w-5 h-5 text-cyan-600 drop-shadow-sm" />
          <Cloud className="absolute -bottom-1 -right-1 w-4 h-4 text-purple-500 opacity-80" />
        </div>

        <div className="flex flex-col">
          <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-800 to-cyan-700 tracking-tight">
            Uplift Coach
          </h2>
          <span className="text-[10px] font-semibold tracking-widest text-purple-500/80 uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Celestial Wisdom
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 hover:bg-white/70 border border-purple-100 text-purple-700 text-xs font-medium transition-all shadow-sm hover:shadow-[0_0_10px_rgba(168,85,247,0.2)]">
          <History className="w-3.5 h-3.5" />
          <span>Past Scrolls</span>
        </button>
        <button className="flex items-center justify-center w-8 h-8 rounded-full bg-white/50 hover:bg-white/70 border border-cyan-100 text-cyan-700 transition-all shadow-sm hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]">
          <BookOpen className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
