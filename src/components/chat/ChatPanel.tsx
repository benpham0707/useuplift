import React from 'react';
import { motion } from 'motion/react';
import { ChatHeader } from './ChatHeader';
import { MessageDisplay } from './MessageDisplay';
import { ChatInput } from './ChatInput';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  className?: string;
}

export function ChatPanel({ className }: ChatPanelProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col h-full w-full max-w-md overflow-hidden rounded-[2.5rem]",
        "bg-[#f8faff] shadow-[0_20px_60px_-15px_rgba(168,85,247,0.2)] border border-white/80",
        className
      )}
    >
      {/* Deep Celestial Sky Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-gradient-to-b from-indigo-50/40 to-white/10">
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[5%] left-[5%] w-[120%] h-[120%] rounded-full bg-[radial-gradient(circle_at_center,rgba(192,132,252,0.12)_0%,transparent_50%)] blur-[40px]"
        />
        <motion.div
          animate={{ y: [0, 20, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[25%] right-[5%] w-[100%] h-[100%] rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12)_0%,transparent_50%)] blur-[40px]"
        />
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex flex-col h-full w-full">
        <ChatHeader />

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-36 scrollbar-hide z-10">
          <MessageDisplay />
        </div>

        {/* The Cloud Valley & Input Area */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none h-56">

          {/* Central Mist - Smooth gradient fade for reading */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white/95 via-white/50 to-transparent [mask-image:linear-gradient(to_right,transparent_10%,black_50%,transparent_90%)]" />

          {/* Left Cloud Pillar - Raised, pushed left, structured but soft */}
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-6 -left-12 w-72 h-40"
          >
            {/* Magical Cyan Underglow */}
            <div className="absolute inset-0 bg-cyan-300/30 blur-2xl rounded-full" />

            {/* Physical Cloud Body - blur-[4px] softens edges without destroying the shape */}
            <div className="relative w-full h-full blur-[4px]">
              {/* Flat Base */}
              <div className="absolute bottom-0 left-0 w-full h-20 bg-white/95 rounded-full" />
              {/* Outer Left Bump */}
              <div className="absolute bottom-6 left-8 w-24 h-24 bg-white/95 rounded-full" />
              {/* Center Peak - Pushed further left to clear the text area */}
              <div className="absolute bottom-[20px] left-20 w-32 h-32 bg-white/95 rounded-full" />
              {/* Inner Right Slope - Smaller and much lower to open the valley */}
              <div className="absolute bottom-4 left-44 w-20 h-20 bg-white/90 rounded-full" />
            </div>
          </motion.div>

          {/* Right Cloud Pillar - Raised, pushed right, structured but soft */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-6 -right-12 w-72 h-40"
          >
            {/* Magical Purple Underglow */}
            <div className="absolute inset-0 bg-purple-400/30 blur-2xl rounded-full" />

            {/* Physical Cloud Body - blur-[4px] softens edges without destroying the shape */}
            <div className="relative w-full h-full blur-[4px]">
              {/* Flat Base */}
              <div className="absolute bottom-0 left-0 w-full h-20 bg-white/95 rounded-full" />
              {/* Inner Left Slope - Smaller and much lower to open the valley */}
              <div className="absolute bottom-4 left-8 w-20 h-20 bg-white/90 rounded-full" />
              {/* Left Center Bump */}
              <div className="absolute bottom-[25px] left-[72px] w-[100px] h-[100px] bg-white/95 rounded-full" />
              {/* Right Center Bump */}
              <div className="absolute bottom-[35px] left-[130px] w-[110px] h-[110px] bg-white/95 rounded-full" />
              {/* Outer Right Bump */}
              <div className="absolute bottom-8 left-48 w-24 h-24 bg-white/95 rounded-full" />
            </div>
          </motion.div>

          {/* Interactive Input Container */}
          <div className="absolute bottom-0 left-0 right-0 p-5 pointer-events-auto flex justify-center z-30">
            <div className="w-full relative z-40">
              <ChatInput />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
