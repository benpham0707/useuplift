import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ChatHeader } from './ChatHeader';
import { MessageDisplay, type Message } from './MessageDisplay';
import { ChatInput } from './ChatInput';
import { LunaSprite, type LunaState } from './LunaSprite';
import { cn } from '@/lib/utils';

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'user',
    content: "I just submitted my Common App essay draft — it's about how my grandmother's garden taught me patience and resilience after my parents' divorce. I'm worried it sounds too generic though. Can you take a look?"
  },
  {
    id: '2',
    role: 'assistant',
    content: (
      <>
        <p>I've read through your draft carefully. The garden metaphor is actually a strong foundation — the issue isn't the topic, it's that the essay <span className="msg-key">tells us about patience</span> rather than letting us <em>experience</em> it with you.</p>
        <p>Your strongest moment is in paragraph two, where you describe pulling weeds at 6am before school. That's specific, physical, and real. But then you immediately jump to the abstract lesson: <span className="msg-quote">"This taught me that growth takes time."</span> The reader already felt that — the sentence actually undercuts the image.</p>
        <span className="msg-action">Here's what I'd focus on first: <span className="msg-key">find three more moments like the 6am weeding.</span> Concrete, sensory, and small. The divorce and the resilience will come through — you don't need to announce them.</span>
      </>
    )
  },
  {
    id: '3',
    role: 'user',
    content: "That makes sense. I think I keep defaulting to explaining what things mean because I'm afraid the admissions officer won't get it. Like if I just describe the garden, will they understand it's really about my family falling apart?"
  },
  {
    id: '4',
    role: 'assistant',
    content: (
      <>
        <p>That's a really common instinct, and honestly a smart one — you want to make sure your point lands. But here's the thing: <span className="msg-term">admissions officers</span> read thousands of essays. They're trained to read between the lines. What they can't get from anyone else is <em>your</em> specific details.</p>
        <p>Think about it this way — when you read a great novel, the author doesn't stop to say <span className="msg-quote">"and this is why this matters."</span> The meaning emerges from the <span className="msg-soft">accumulation of precise details</span>. Your essay has the same opportunity.</p>
        <span className="msg-action">Try this exercise: rewrite your opening paragraph using <span className="msg-key">only what you could see, hear, smell, or touch.</span> No interpretations, no lessons. Just the scene. Then read it back and see if the emotional weight is already there.</span>
      </>
    )
  },
  {
    id: '5',
    role: 'assistant',
    content: (
      <>
        <h3>Typography Showcase</h3>
        <p>This is <strong>bold text</strong> — used for general emphasis on important words.</p>
        <p>This is <em>italic text</em> — a softer, lighter emphasis for asides or tone.</p>
        <p>This is a <span className="msg-key">key insight</span> — the core advice or "aha" moment, highlighted with a purple wash.</p>
        <p>This is a <span className="msg-quote">"quoted essay phrase"</span> — your own writing referenced back, warm amber tint with underline.</p>
        <p>This is a <span className="msg-term">writing concept</span> — domain vocabulary like admissions terms, small-caps style.</p>
        <p>This is a <span className="msg-soft">soft highlight</span> — secondary emphasis, subtle blue background.</p>
        <span className="msg-action">This is an action step — a clear directive with a teal left border telling you exactly what to do next.</span>
        <p>And this is plain body text that flows naturally between all the treatments above, showing how regular sentences read alongside the styled elements.</p>
      </>
    )
  }
];

interface ChatPanelProps {
  className?: string;
}

export function ChatPanel({ className }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Progressive reveal — simulates real chat so each message triggers its mount animation
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);

  // ═══ Luna Phase 1 demo cycler ═══
  // Cycles through the 3 MVP states so the spatial design and motion
  // can be validated before investing in Kling video generation.
  // Remove this once real coaching state is wired in from session memory.
  const [lunaState, setLunaState] = useState<LunaState>('neutral');

  useEffect(() => {
    const sequence: { state: LunaState; hold: number }[] = [
      { state: 'neutral', hold: 4500 },
      { state: 'thinking', hold: 3500 },
      { state: 'happy', hold: 3500 },
    ];
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setLunaState(sequence[i].state);
      timer = setTimeout(() => {
        i = (i + 1) % sequence.length;
        tick();
      }, sequence[i].hold);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

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
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 pt-4 scrollbar-none z-10 relative"
          style={{
            maskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 140px), transparent calc(100% - 60px))',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 140px), transparent calc(100% - 60px))',
          }}
        >
          <MessageDisplay messages={visibleMessages} scrollContainerRef={scrollRef} />
          {/* Bumper so user can scroll last message above the cloud valley */}
          <div className="h-[300px] w-full flex-shrink-0 pointer-events-none" />
        </div>

        {/* The Cloud Valley & Input Area */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none h-56">

          {/* Central Mist - Gentle veil, not a wall */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/80 via-white/30 to-transparent" />

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

        {/* Luna — free-floating mascot that inhabits the chat panel.
            Lives at z-25, above the cloud valley pillars (z-20) and
            below the input (z-30). Her spatial home is the cloud
            valley, and she travels up into the message area for
            reading/thinking states and rises to center for celebration. */}
        <LunaSprite state={lunaState} />

        {/* Interactive Input Container - Above everything */}
        <div className="absolute bottom-0 left-0 right-0 p-5 flex justify-center z-30">
          <div className="w-full relative">
            <ChatInput />
          </div>
        </div>

        {/* ═══ Luna Phase 1 manual state controls (dev only) ═══
            Tiny button cluster pinned to the top-right of the panel so
            you can manually trigger state changes and evaluate whether
            the spatial design + spring motion feels alive. Remove once
            Phase 1 validation passes. */}
        <div className="absolute top-14 right-3 z-40 flex flex-col gap-1 pointer-events-auto">
          {(['neutral', 'thinking', 'happy'] as LunaState[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setLunaState(s)}
              className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all"
              style={{
                background:
                  lunaState === s
                    ? 'hsla(260, 70%, 60%, 0.9)'
                    : 'hsla(260, 30%, 95%, 0.85)',
                color: lunaState === s ? 'white' : 'hsl(260, 30%, 35%)',
                border: '1px solid hsla(260, 40%, 60%, 0.25)',
                backdropFilter: 'blur(4px)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
