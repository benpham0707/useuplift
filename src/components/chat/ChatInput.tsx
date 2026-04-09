import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Lightbulb, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type SuggestionKind = 'action' | 'tip' | 'prompt';

interface Suggestion {
  kind: SuggestionKind;
  message: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    kind: 'action',
    message: "Here's my essay draft — I'd love your honest take on what's working and what needs rethinking.",
  },
  {
    kind: 'tip',
    message: "I haven't picked a topic yet. Can we talk through some ideas and figure out what story I should tell?",
  },
];

function dominantKind(items: Suggestion[]): SuggestionKind {
  if (items.some(s => s.kind === 'action')) return 'action';
  if (items.some(s => s.kind === 'prompt')) return 'prompt';
  return 'tip';
}

const BADGE_COLORS: Record<SuggestionKind, string> = {
  action: 'bg-amber-400 shadow-amber-400/40',
  tip:    'bg-cyan-400 shadow-cyan-400/40',
  prompt: 'bg-purple-400 shadow-purple-400/40',
};

const KIND_THEME: Record<SuggestionKind, { accent: string; msgColor: string; hoverMsg: string; border: string; bg: string }> = {
  action: {
    accent:  'from-violet-400 to-fuchsia-400',
    msgColor: 'text-slate-600',
    hoverMsg: 'group-hover/sg:text-slate-800',
    border:   'border-violet-200/30 group-hover/sg:border-violet-300/40',
    bg:       'from-violet-100/20 to-fuchsia-50/10',
  },
  tip: {
    accent:  'from-cyan-400 to-sky-400',
    msgColor: 'text-slate-600',
    hoverMsg: 'group-hover/sg:text-slate-800',
    border:   'border-cyan-200/30 group-hover/sg:border-cyan-300/40',
    bg:       'from-cyan-100/20 to-sky-50/10',
  },
  prompt: {
    accent:  'from-purple-400 to-indigo-400',
    msgColor: 'text-slate-600',
    hoverMsg: 'group-hover/sg:text-slate-800',
    border:   'border-purple-200/30 group-hover/sg:border-purple-300/40',
    bg:       'from-purple-100/20 to-indigo-50/10',
  },
};

/* ═══════════════════════════════════════════════════════════
 * ACTION CARD
 *
 * Design intent: "I have something waiting on me."
 *
 * Grounded, present, gently urgent. Like an unread notification
 * you haven't cleared — not shouting, but you can feel it there.
 * Anchored (no float animation). Warm pulse on the border says
 * "alive and waiting." Status dot says "incomplete."
 * ═══════════════════════════════════════════════════════════ */

function ActionCard({ message, onSelect }: { message: string; onSelect: () => void }) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.012 }}
      whileTap={{ scale: 0.99 }}
      className="relative w-full text-left cursor-pointer group/action"
    >
      {/* Pulsing border — the "heartbeat" that says this is alive and waiting */}
      <motion.div
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -inset-[1px] rounded-[17px] bg-gradient-to-r from-rose-400/60 via-fuchsia-400/50 to-violet-400/60"
      />

      {/* Card body */}
      <div className="relative overflow-hidden rounded-[16px] shadow-[0_4px_16px_rgba(244,114,182,0.08)] group-hover/action:shadow-[0_6px_24px_rgba(244,114,182,0.16)] transition-shadow duration-300">
        {/* Warm glass background — more opaque than tip, grounded */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-2xl" />
        {/* Warm rose/violet tint — barely there but gives warmth */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 via-fuchsia-50/30 to-violet-50/20" />

        {/* Slow shimmer — light catching the surface, draws the eye */}
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none"
        />

        <div className="relative flex items-start gap-2.5 px-3.5 py-2.5">
          {/* Status dot — "pending/incomplete" indicator */}
          <div className="relative flex-shrink-0 mt-[5px]">
            {/* Outer glow ring */}
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.6, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 w-2 h-2 rounded-full bg-rose-400/30"
            />
            {/* Solid dot */}
            <div className="relative w-2 h-2 rounded-full bg-gradient-to-br from-rose-400 to-fuchsia-500 shadow-[0_0_4px_rgba(244,114,182,0.5)]" />
          </div>

          {/* Message — confident, direct, this is a next step */}
          <p className="flex-1 text-[12.5px] leading-[1.55] font-semibold text-slate-700 group-hover/action:text-slate-900 transition-colors">
            {message}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════
 * TIP CARD
 *
 * Temporary — will be fully designed next.
 * ═══════════════════════════════════════════════════════════ */

function TipCard({ message, onSelect }: { message: string; onSelect: () => void }) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.012 }}
      whileTap={{ scale: 0.99 }}
      className="relative w-full text-left cursor-pointer group/tip"
    >
      <div className="relative overflow-hidden rounded-[16px] backdrop-blur-2xl border border-cyan-200/30 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="absolute inset-0 bg-white/45" />
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/20 to-sky-50/10 opacity-60" />
        <div className="relative px-3.5 py-2.5">
          <p className="text-[12.5px] leading-[1.55] font-medium text-slate-500 group-hover/tip:text-slate-700 transition-colors">
            {message}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

export function ChatInput() {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleSelectSuggestion = (message: string) => {
    setInputValue(message);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full">
      {/* Suggestion cards */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute bottom-full left-0 right-0 mb-2.5 flex flex-col gap-2"
          >
            {SUGGESTIONS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.15 }}
              >
                {s.kind === 'action' ? (
                  <ActionCard message={s.message} onSelect={() => handleSelectSuggestion(s.message)} />
                ) : (
                  /* Tip/Prompt — placeholder, will be designed next */
                  <TipCard message={s.message} onSelect={() => handleSelectSuggestion(s.message)} />
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative group w-full"
      >
        {/* Ethereal Glow Aura */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-cyan-400/20 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />

        {/* The Cloud-Glass Input Container */}
        <div className="relative flex items-center gap-1 p-1 bg-white/50 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_rgba(168,85,247,0.08)] rounded-full">

          {/* Suggestion Toggle with count badge */}
          <button
            onClick={() => setShowSuggestions(prev => !prev)}
            className="relative flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
            aria-label={showSuggestions ? 'Close suggestions' : 'Show suggestions'}
          >
            {/* Gradient border ring — visible when open */}
            {showSuggestions && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 p-[1px]">
                <div className="w-full h-full rounded-full bg-white" />
              </div>
            )}
            {/* Default border — visible when closed */}
            {!showSuggestions && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/80 to-white/40 border border-purple-100/60 hover:from-purple-50 hover:to-cyan-50 transition-all duration-200" />
            )}
            {/* Icon — swap between lightbulb and X */}
            <AnimatePresence mode="wait" initial={false}>
              {showSuggestions ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.15 }}
                  className="relative z-10 text-purple-500"
                >
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </motion.span>
              ) : (
                <motion.span
                  key="bulb"
                  initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.15 }}
                  className="relative z-10 text-purple-400 hover:text-purple-600 transition-colors"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                </motion.span>
              )}
            </AnimatePresence>
            {/* Count badge */}
            {SUGGESTIONS.length > 0 && !showSuggestions && (
              <span className={cn(
                'absolute -top-1 -right-1 flex items-center justify-center',
                'w-3.5 h-3.5 rounded-full text-[8px] font-bold text-white leading-none',
                'shadow-[0_0_6px] ring-1 ring-white/80',
                BADGE_COLORS[dominantKind(SUGGESTIONS)],
              )}>
                {SUGGESTIONS.length}
              </span>
            )}
          </button>

          {/* Input Field */}
          <div className="flex-1 min-h-[32px] flex items-center px-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setShowSuggestions(false)}
              placeholder="Inscribe your thoughts into the mist..."
              className="w-full bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-purple-400/60 font-medium placeholder:font-normal placeholder:tracking-wide"
            />
          </div>

          {/* Send Button — only visible when there's input */}
          <AnimatePresence>
            {inputValue.trim() && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all transform hover:scale-105 flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5 ml-0.5" />
              </motion.button>
            )}
          </AnimatePresence>
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
    </div>
  );
}
