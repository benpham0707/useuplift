import React, { useState, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Lightbulb, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════
// Suggestion Clouds — gooey-merged circle clouds.
//
// Each card's silhouette is built from a central rectangle + a
// ring of overlapping circles. An SVG gooey filter
// (Gaussian-blur + alpha-threshold color matrix) merges them into
// one smooth cloud shape. Two layers — a larger stroke-color set
// and a slightly smaller fill-color set on top — produce a
// visible colored border with prominent ROUND bumps.
// ═══════════════════════════════════════════════════════════════

type SuggestionKind = 'action' | 'tip' | 'prompt';

interface Suggestion {
  kind: SuggestionKind;
  message: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    kind: 'action',
    message:
      "Here's my essay draft — I'd love your honest take on what's working and what needs rethinking.",
  },
  {
    kind: 'tip',
    message:
      "I haven't picked a topic yet. Can we talk through some ideas and figure out what story I should tell?",
  },
  {
    kind: 'prompt',
    message:
      'What if I opened with the moment I broke the vase instead of the morning after?',
  },
];

function dominantKind(items: Suggestion[]): SuggestionKind {
  if (items.some((s) => s.kind === 'action')) return 'action';
  if (items.some((s) => s.kind === 'prompt')) return 'prompt';
  return 'tip';
}

const BADGE_COLORS: Record<SuggestionKind, string> = {
  action: 'bg-gradient-to-br from-orange-400 to-rose-500 shadow-orange-400/40',
  tip: 'bg-cyan-400 shadow-cyan-400/40',
  prompt: 'bg-purple-400 shadow-purple-400/40',
};

const KIND_PAINT: Record<SuggestionKind, { fill: string; stroke: string }> = {
  action: { fill: 'hsl(30, 55%, 97%)', stroke: 'hsl(16, 55%, 60%)' },
  tip: { fill: 'hsl(200, 45%, 97%)', stroke: 'hsl(205, 52%, 56%)' },
  prompt: { fill: 'hsl(268, 40%, 97%)', stroke: 'hsl(265, 45%, 62%)' },
};

// ═══════════════════════════════════════════════════════════════
// Cloud shape configs — central body rect + overlapping circles.
// Each circle MUST overlap a neighbor / the rect so the gooey
// filter merges everything into one continuous silhouette.
// ═══════════════════════════════════════════════════════════════

type CloudShape = {
  vw: number; // viewBox width
  vh: number; // viewBox height
  body: { x: number; y: number; w: number; h: number };
  circles: Array<{ cx: number; cy: number; r: number }>;
};

// Shared dimensions so every card is the same size in the panel
const SHAPE_W = 400;
const SHAPE_H = 120;
const BODY = { x: 50, y: 44, w: 300, h: 32 };
const CAP_LEFT = { cx: 50, cy: 60, r: 36 };
const CAP_RIGHT = { cx: 350, cy: 60, r: 36 };

// Action — cumulus: 3 chunky top bumps + 3 chunky bottom bumps
const ACTION_SHAPE: CloudShape = {
  vw: SHAPE_W,
  vh: SHAPE_H,
  body: BODY,
  circles: [
    CAP_LEFT,
    CAP_RIGHT,
    { cx: 135, cy: 32, r: 26 },
    { cx: 200, cy: 22, r: 32 },
    { cx: 265, cy: 32, r: 26 },
    { cx: 135, cy: 86, r: 22 },
    { cx: 200, cy: 94, r: 28 },
    { cx: 265, cy: 86, r: 22 },
  ],
};

// Tip — cirrus: 5 smaller top bumps + 5 smaller bottom bumps
const TIP_SHAPE: CloudShape = {
  vw: SHAPE_W,
  vh: SHAPE_H,
  body: BODY,
  circles: [
    CAP_LEFT,
    CAP_RIGHT,
    { cx: 110, cy: 36, r: 20 },
    { cx: 160, cy: 32, r: 22 },
    { cx: 210, cy: 28, r: 24 },
    { cx: 260, cy: 32, r: 22 },
    { cx: 310, cy: 36, r: 20 },
    { cx: 110, cy: 82, r: 18 },
    { cx: 160, cy: 86, r: 20 },
    { cx: 210, cy: 90, r: 22 },
    { cx: 260, cy: 86, r: 20 },
    { cx: 310, cy: 82, r: 18 },
  ],
};

// Prompt — cumulonimbus: 3 top bumps with a hero centre tower +
// 3 symmetric bottom bumps
const PROMPT_SHAPE: CloudShape = {
  vw: SHAPE_W,
  vh: SHAPE_H,
  body: BODY,
  circles: [
    CAP_LEFT,
    CAP_RIGHT,
    { cx: 140, cy: 34, r: 24 },
    { cx: 200, cy: 18, r: 34 },
    { cx: 260, cy: 34, r: 24 },
    { cx: 140, cy: 86, r: 22 },
    { cx: 200, cy: 92, r: 26 },
    { cx: 260, cy: 86, r: 22 },
  ],
};

// ═══════════════════════════════════════════════════════════════
// CloudShell — renders the gooey cloud silhouette with coloured
// fill + stroke. Interior content (sunset glow, mist, stars) is
// passed as children and clipped to the cloud outline.
// ═══════════════════════════════════════════════════════════════

function CloudShell({
  shape,
  kind,
  children,
}: {
  shape: CloudShape;
  kind: SuggestionKind;
  children?: React.ReactNode;
}) {
  const uid = useId().replace(/:/g, 's');
  const gooeyId = `g-${uid}`;
  const clipId = `c-${uid}`;
  const paint = KIND_PAINT[kind];
  const strokeW = 3;
  const innerPad = strokeW;

  return (
    <svg
      viewBox={`0 0 ${shape.vw} ${shape.vh}`}
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
      style={{ filter: 'drop-shadow(0 4px 10px hsla(220,40%,30%,0.10))' }}
    >
      <defs>
        {/* Gooey filter — merges overlapping shapes into one smooth silhouette */}
        <filter id={gooeyId} x="-12%" y="-12%" width="124%" height="124%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          <feColorMatrix
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 32 -14"
          />
        </filter>
        {/* Clip path for interior effects — union of all shapes */}
        <clipPath id={clipId}>
          <rect
            x={shape.body.x}
            y={shape.body.y}
            width={shape.body.w}
            height={shape.body.h}
          />
          {shape.circles.map((c, i) => (
            <circle key={i} cx={c.cx} cy={c.cy} r={c.r} />
          ))}
        </clipPath>
      </defs>

      {/* Stroke layer — larger merged silhouette in border colour */}
      <g filter={`url(#${gooeyId})`}>
        <rect
          x={shape.body.x}
          y={shape.body.y}
          width={shape.body.w}
          height={shape.body.h}
          fill={paint.stroke}
        />
        {shape.circles.map((c, i) => (
          <circle
            key={i}
            cx={c.cx}
            cy={c.cy}
            r={c.r}
            fill={paint.stroke}
          />
        ))}
      </g>

      {/* Fill layer — slightly smaller merged silhouette in fill colour,
          on top of stroke layer. The size difference produces the visible
          coloured border. */}
      <g filter={`url(#${gooeyId})`}>
        <rect
          x={shape.body.x + innerPad}
          y={shape.body.y + innerPad}
          width={shape.body.w - innerPad * 2}
          height={shape.body.h - innerPad * 2}
          fill={paint.fill}
        />
        {shape.circles.map((c, i) => (
          <circle
            key={i}
            cx={c.cx}
            cy={c.cy}
            r={c.r - strokeW}
            fill={paint.fill}
          />
        ))}
      </g>

      {/* Interior effects, clipped to the cloud outline */}
      {children && <g clipPath={`url(#${clipId})`}>{children}</g>}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// ACTION — cumulus cloud with inner sunset glow
// ═══════════════════════════════════════════════════════════════

function ActionCloud({ message, onSelect }: { message: string; onSelect: () => void }) {
  const uid = useId().replace(/:/g, 's');
  const sunsetId = `sunset-${uid}`;
  const topWashId = `top-${uid}`;

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.99 }}
      className="relative w-full text-left cursor-pointer group/action"
      style={{ aspectRatio: `${SHAPE_W} / ${SHAPE_H}` }}
    >
      {/* Underglow — warm sunset halo */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          inset: '-18%',
          background:
            'radial-gradient(ellipse at 50% 55%, hsla(18,95%,60%,0.45) 0%, hsla(6,85%,56%,0.25) 45%, transparent 78%)',
          filter: 'blur(22px)',
        }}
      />

      <CloudShell shape={ACTION_SHAPE} kind="action">
        <defs>
          <radialGradient id={sunsetId} cx="50%" cy="62%" r="55%">
            <stop offset="0%" stopColor="hsla(20,98%,62%,0.45)" />
            <stop offset="55%" stopColor="hsla(8,90%,58%,0.18)" />
            <stop offset="100%" stopColor="hsla(8,90%,58%,0)" />
          </radialGradient>
          <linearGradient id={topWashId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsla(38,95%,88%,0.5)" />
            <stop offset="100%" stopColor="hsla(38,95%,88%,0)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={SHAPE_W} height={SHAPE_H} fill={`url(#${sunsetId})`}>
          <animate
            attributeName="opacity"
            values="0.6;1;0.6"
            dur="4s"
            repeatCount="indefinite"
          />
        </rect>
        <rect x="0" y="0" width={SHAPE_W} height="50" fill={`url(#${topWashId})`} opacity="0.5" />
      </CloudShell>

      <CardText kind="action" message={message} />
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════
// TIP — cirrus cloud with drifting mist streak
// ═══════════════════════════════════════════════════════════════

function TipCloud({ message, onSelect }: { message: string; onSelect: () => void }) {
  const uid = useId().replace(/:/g, 's');
  const mistId = `mist-${uid}`;

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.99 }}
      className="relative w-full text-left cursor-pointer group/tip"
      style={{ aspectRatio: `${SHAPE_W} / ${SHAPE_H}` }}
    >
      {/* Underglow — cool cyan wash */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          inset: '-18%',
          background:
            'radial-gradient(ellipse at 50% 55%, hsla(192,90%,70%,0.4) 0%, hsla(210,80%,75%,0.2) 45%, transparent 78%)',
          filter: 'blur(22px)',
        }}
      />

      <CloudShell shape={TIP_SHAPE} kind="tip">
        <defs>
          <linearGradient id={mistId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsla(200,95%,95%,0)" />
            <stop offset="50%" stopColor="hsla(200,95%,95%,0.6)" />
            <stop offset="100%" stopColor="hsla(200,95%,95%,0)" />
          </linearGradient>
        </defs>
        <rect y="40" width="160" height="40" fill={`url(#${mistId})`}>
          <animate
            attributeName="x"
            from="-180"
            to="420"
            dur="8s"
            repeatCount="indefinite"
          />
        </rect>
      </CloudShell>

      <CardText kind="tip" message={message} />
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROMPT — cumulonimbus cloud with twinkling star cluster
// ═══════════════════════════════════════════════════════════════

function PromptCloud({ message, onSelect }: { message: string; onSelect: () => void }) {
  const uid = useId().replace(/:/g, 's');
  const irisId = `iris-${uid}`;

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.99 }}
      className="relative w-full text-left cursor-pointer group/prompt"
      style={{ aspectRatio: `${SHAPE_W} / ${SHAPE_H}` }}
    >
      {/* Underglow — purple halo */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          inset: '-18%',
          background:
            'radial-gradient(ellipse at 50% 50%, hsla(275,85%,72%,0.45) 0%, hsla(255,75%,70%,0.24) 45%, transparent 78%)',
          filter: 'blur(22px)',
        }}
      />

      <CloudShell shape={PROMPT_SHAPE} kind="prompt">
        <defs>
          <linearGradient id={irisId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsla(275,80%,72%,0.18)" />
            <stop offset="50%" stopColor="hsla(220,70%,78%,0.08)" />
            <stop offset="100%" stopColor="hsla(190,80%,78%,0.18)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={SHAPE_W} height={SHAPE_H} fill={`url(#${irisId})`} />

        {/* Two stars inside the tower bump (centered around (200, 18)) */}
        <circle cx="196" cy="16" r="1.8" fill="#ffffff">
          <animate
            attributeName="opacity"
            values="0.3;1;0.3"
            dur="3.2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="r"
            values="1.5;2.2;1.5"
            dur="3.2s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="196" cy="16" r="4" fill="hsla(280,95%,80%,0.32)">
          <animate
            attributeName="opacity"
            values="0.2;0.55;0.2"
            dur="3.2s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="210" cy="12" r="1.4" fill="#ffffff">
          <animate
            attributeName="opacity"
            values="0.25;0.95;0.25"
            dur="4.1s"
            begin="1.2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="r"
            values="1.2;1.7;1.2"
            dur="4.1s"
            begin="1.2s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="210" cy="12" r="3.5" fill="hsla(260,95%,82%,0.28)">
          <animate
            attributeName="opacity"
            values="0.15;0.45;0.15"
            dur="4.1s"
            begin="1.2s"
            repeatCount="indefinite"
          />
        </circle>
      </CloudShell>

      <CardText kind="prompt" message={message} />
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════
// Shared card text — positioned inside the cloud body rectangle
// ═══════════════════════════════════════════════════════════════

function CardText({ kind, message }: { kind: SuggestionKind; message: string }) {
  const top = (BODY.y / SHAPE_H) * 100;
  const bot = ((SHAPE_H - (BODY.y + BODY.h)) / SHAPE_H) * 100;
  const textClass =
    kind === 'action'
      ? 'text-[12px] leading-[1.35] font-semibold text-slate-700 group-hover/action:text-slate-900'
      : kind === 'tip'
        ? 'text-[12px] leading-[1.35] font-medium text-slate-600 group-hover/tip:text-slate-800'
        : 'text-[12px] leading-[1.35] font-medium italic text-slate-700 group-hover/prompt:text-slate-900';
  return (
    <div
      className="absolute inset-x-0 flex items-center justify-center px-[18%]"
      style={{ top: `${top}%`, bottom: `${bot}%` }}
    >
      <p className={`${textClass} transition-colors text-center line-clamp-2`}>{message}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Dispatch
// ═══════════════════════════════════════════════════════════════

function SuggestionCloud({ suggestion, onSelect }: { suggestion: Suggestion; onSelect: () => void }) {
  switch (suggestion.kind) {
    case 'action':
      return <ActionCloud message={suggestion.message} onSelect={onSelect} />;
    case 'tip':
      return <TipCloud message={suggestion.message} onSelect={onSelect} />;
    case 'prompt':
      return <PromptCloud message={suggestion.message} onSelect={onSelect} />;
  }
}

// ═══════════════════════════════════════════════════════════════
// Chat Input
// ═══════════════════════════════════════════════════════════════

export function ChatInput() {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleSelectSuggestion = (message: string) => {
    setInputValue(message);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full">
      {/* Suggestion clouds */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute bottom-full left-0 right-0 mb-3 flex flex-col gap-2"
          >
            {SUGGESTIONS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.08, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <SuggestionCloud
                  suggestion={s}
                  onSelect={() => handleSelectSuggestion(s.message)}
                />
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
            onClick={() => setShowSuggestions((prev) => !prev)}
            className="relative flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
            aria-label={showSuggestions ? 'Close suggestions' : 'Show suggestions'}
          >
            {showSuggestions && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 p-[1px]">
                <div className="w-full h-full rounded-full bg-white" />
              </div>
            )}
            {!showSuggestions && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/80 to-white/40 border border-purple-100/60 hover:from-purple-50 hover:to-cyan-50 transition-all duration-200" />
            )}
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
            {SUGGESTIONS.length > 0 && !showSuggestions && (
              <span
                className={cn(
                  'absolute -top-1 -right-1 flex items-center justify-center',
                  'w-3.5 h-3.5 rounded-full text-[8px] font-bold text-white leading-none',
                  'shadow-[0_0_6px] ring-1 ring-white/80',
                  BADGE_COLORS[dominantKind(SUGGESTIONS)],
                )}
              >
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

          {/* Send Button */}
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
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-4 -left-2 w-8 h-8 rounded-full bg-white/70 blur-[3px] shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none"
        />
        <motion.div
          animate={{ y: [0, 5, 0], x: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-3 right-14 w-10 h-10 rounded-full bg-cyan-50/60 blur-[4px] pointer-events-none"
        />
      </motion.div>
    </div>
  );
}
