import React, { useState } from "react";
import { motion } from "motion/react";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";

export const ChatWidget: React.FC = () => {
  // Simulating the analysis state for demonstration
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  const handleSendMessage = (message: string) => {
    setIsAnalyzing(true);
    // Simulated network request
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
  };

  const handleReset = () => {
    setIsAnalyzing(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
      {/* Main Widget Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex h-[800px] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white/90 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05),0_0_80px_-20px_rgba(124,58,237,0.1)] ring-1 ring-slate-900/5 backdrop-blur-3xl"
      >
        <ChatHeader />

        {/* Message Area (Placeholder structure ready for actual messages) */}
        <div className="relative flex-1 overflow-y-auto bg-slate-50/50">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-[hsl(250,70%,60%,0.03)] via-transparent to-[hsl(185,80%,55%,0.03)]" />

          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.2 }}
               className="max-w-xs space-y-4"
             >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[hsl(250,70%,60%)] to-[hsl(185,80%,55%)] opacity-20" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Awaiting Input</h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  Ready to map architecture, analyze code, or refine the user experience.
                </p>
             </motion.div>
          </div>
        </div>

        <ChatInput isAnalyzing={isAnalyzing} onSendMessage={handleSendMessage} />
      </motion.div>
    </div>
  );
};
