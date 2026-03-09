import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Send } from 'lucide-react';

export function ChatInput() {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative group w-full"
    >
      {/* Ethereal Glow Aura Behind the Input */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-cyan-400/20 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />

      {/* The Cloud-Glass Input Container */}
      <div className="relative flex items-end gap-2 p-2 bg-white/50 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_rgba(168,85,247,0.08)] rounded-[2rem]">

        {/* Input Field */}
        <div className="flex-1 min-h-[44px] flex items-center px-4">
          <input
            type="text"
            placeholder="Inscribe your thoughts into the mist..."
            className="w-full bg-transparent border-none outline-none text-slate-700 placeholder:text-purple-400/60 font-medium placeholder:font-normal placeholder:tracking-wide"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center pr-1 pb-1">
          {/* Magic/Enhance Button */}
          <button className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-white/80 to-white/40 hover:from-white hover:to-white/80 transition-all shadow-sm border border-purple-100 group/btn">
            <Sparkles className="w-4 h-4 text-cyan-500 group-hover/btn:rotate-12 transition-transform" />
          </button>

          {/* Send Button */}
          <button className="flex items-center justify-center w-10 h-10 ml-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all transform hover:scale-105">
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Floating Cloud Particles */}
      <motion.div
        animate={{ y: [0, -6, 0], x: [0, 4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-4 -left-2 w-8 h-8 rounded-full bg-white/70 blur-[3px] shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, 5, 0], x: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-3 right-14 w-10 h-10 rounded-full bg-cyan-50/60 blur-[4px] pointer-events-none"
      />
    </motion.div>
  );
}
