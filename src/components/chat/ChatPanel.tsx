import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChatHeader } from './ChatHeader';
import { MessageDisplay, type Message } from './MessageDisplay';
import { ChatInput } from './ChatInput';
import { cn } from '@/lib/utils';

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'user',
    content: "Hi there, I'm currently working on a fiction book. Can you start by asking me a few key questions to help me get started? Ask me questions one at a time."
  },
  {
    id: '2',
    role: 'assistant',
    content: (
      <div className="space-y-3">
        <p>A worthy endeavor. Let us weave the tapestry of your world together. We must first establish the anchor of your reality.</p>
        <p>What is the <strong>core truth or central premise</strong> of this narrative? Is it a dystopian descent, a cyberpunk thriller, or a galactic enigma?</p>
      </div>
    )
  },
  {
    id: '3',
    role: 'user',
    content: "It is a sci-fi mystery set within the neon depths of a cyberpunk city."
  },
  {
    id: '4',
    role: 'assistant',
    content: (
      <div className="space-y-3">
        <p>An excellent foundation. The neon lights cast long shadows where secrets breed. Now, we must define the rules of this realm.</p>
        <p>How do the <strong>technological advancements</strong> of this city directly manipulate the lives of its denizens or the nature of your mystery?</p>
        <p>Consider the following paradigms:</p>
        <ul className="list-disc pl-4 marker:text-cyan-500">
          <li>Are sentient artificial minds walking among them?</li>
          <li>Does the eye of surveillance ever close?</li>
          <li>How deep is the chasm between the elite and the forgotten?</li>
        </ul>
      </div>
    )
  }
];

interface ChatPanelProps {
  className?: string;
}

export function ChatPanel({ className }: ChatPanelProps) {
  // Progressive reveal — simulates real chat so each message triggers its mount animation
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);

  useEffect(() => {
    const timers = MOCK_MESSAGES.map((msg, i) =>
      setTimeout(() => {
        setVisibleMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }, i * 800)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

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
        <div
          className="flex-1 overflow-y-auto px-4 pt-4 scrollbar-none z-10 relative"
          style={{
            maskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 280px), rgba(0,0,0,0.7) calc(100% - 180px), rgba(0,0,0,0.3) calc(100% - 120px), transparent calc(100% - 60px))',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 280px), rgba(0,0,0,0.7) calc(100% - 180px), rgba(0,0,0,0.3) calc(100% - 120px), transparent calc(100% - 60px))',
          }}
        >
          <MessageDisplay messages={visibleMessages} />
          {/* Bumper matches fade zone so user can scroll last message fully above it */}
          <div className="h-[450px] w-full flex-shrink-0 pointer-events-none" />
        </div>

        {/* The Cloud Valley & Input Area */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none h-56">

          {/* Central Mist - Smooth gradient fade for reading */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white/95 via-white/50 to-transparent [mask-image:linear-gradient(to_right,transparent_10%,black_50%,transparent_90%)]" />

          {/* Left Cloud Pillar - Raised, pushed left, structured but soft */}
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[1px] -left-[53px] w-[268px] h-40"
          >
            {/* Magical Cyan Underglow */}
            <div className="absolute inset-0 bg-cyan-300/30 blur-2xl rounded-full" />

            {/* Physical Cloud Body - blur-[4px] softens edges without destroying the shape */}
            <div className="relative w-full h-full blur-[4px]">
              {/* Flat Base */}
              <div className="absolute bottom-0 left-0 w-full h-20 bg-white/95 rounded-full" />
              {/* Outer Left Bump */}
              <div className="absolute bottom-12 left-8 w-24 h-24 bg-white/95 rounded-full" />
              {/* Left Center Bump */}
              <div className="absolute bottom-[18px] left-16 w-[100px] h-[100px] bg-white/95 rounded-full" />
              {/* Right Center Bump */}
              <div className="absolute bottom-[25px] left-[100px] w-[90px] h-[90px] bg-white/95 rounded-full" />
              {/* Inner Right Slope - Smaller and much lower to open the valley */}
              <div className="absolute bottom-2 left-40 w-20 h-20 bg-white/90 rounded-full" />
            </div>
          </motion.div>

          {/* Right Cloud Pillar - Raised, pushed right, structured but soft */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[1px] -right-[53px] w-[268px] h-40"
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

        </div>

        {/* Interactive Input Container - Above everything */}
        <div className="absolute bottom-0 left-0 right-0 p-5 flex justify-center z-30">
          <div className="w-full relative">
            <ChatInput />
          </div>
        </div>
      </div>
    </div>
  );
}
