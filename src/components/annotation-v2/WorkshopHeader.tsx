import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import type { RightTab } from './mockData';

// ═══════════════════════════════════════════════════════════════
// WorkshopHeader — Mystical unified header for the right panel.
//
// Two stacked rows, one continuous celestial atmosphere:
//   ROW 1 — Tabs (Coach / Insights / Profile / Roadmap). Active tab
//           is marked with a constellation glow, not a hard fill.
//   ROW 2 — Chat-context controls:
//             • Mini Luna avatar (lives in a cloud wisp, breathes)
//             • Identity block (Luna · essay coach · essay type)
//             • Chat mode switcher (Coach/Brainstorm/Critique/Freewrite)
//             • AI settings popover (model tier, voice tone, memory)
//             • Conversation controls (new, history, close)
//
// Atmosphere layers (back → front):
//   1. Frosted glass base + soft sky gradient
//   2. Slow-drifting aurora ribbon
//   3. Starfield — 7 pin-lights with staggered twinkle
//   4. Cloud wisps bookending top-left and top-right
//   5. Content
//   6. Pulsing gradient hairline at the bottom
// ═══════════════════════════════════════════════════════════════

export type ChatMode = 'coach' | 'brainstorm' | 'critique' | 'freewrite';
export type ModelTier = 'fast' | 'deep';
export type VoiceTone = 'warm' | 'direct' | 'socratic';

interface WorkshopHeaderProps {
  activeTab: RightTab;
  onTabChange: (tab: RightTab) => void;
  essayType?: string;
  onClose?: () => void;
}

const TABS: Array<{ id: RightTab; label: string }> = [
  { id: 'chat', label: 'Coach' },
  { id: 'insights', label: 'Insights' },
  { id: 'profile', label: 'Profile' },
  { id: 'roadmap', label: 'Roadmap' },
];

const MODES: Array<{ id: ChatMode; label: string; description: string }> = [
  { id: 'coach', label: 'Coach', description: 'Guided teaching through questions' },
  { id: 'brainstorm', label: 'Brainstorm', description: 'Open exploration, no critique' },
  { id: 'critique', label: 'Critique', description: 'Direct, unfiltered feedback' },
  { id: 'freewrite', label: 'Free-write', description: 'Quiet listening, minimal interruption' },
];

export function WorkshopHeader({
  activeTab,
  onTabChange,
  essayType = 'Common App',
  onClose,
}: WorkshopHeaderProps) {
  const [mode, setMode] = useState<ChatMode>('coach');
  const [modeOpen, setModeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelTier, setModelTier] = useState<ModelTier>('deep');
  const [voiceTone, setVoiceTone] = useState<VoiceTone>('warm');
  const [memoryOn, setMemoryOn] = useState(true);

  // Close popovers when clicking outside
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!modeOpen && !settingsOpen) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setModeOpen(false);
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [modeOpen, settingsOpen]);

  return (
    <header
      ref={rootRef}
      className="relative z-20 flex-shrink-0 overflow-visible"
    >
      {/* ═══ Atmosphere layers (overflow-hidden wrapper so wisps don't leak) ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Frosted glass base — soft sky gradient */}
        <div
          aria-hidden
          className="absolute inset-0 backdrop-blur-xl"
          style={{
            background:
              'linear-gradient(180deg, hsla(240,60%,96%,0.75) 0%, hsla(255,55%,97%,0.6) 55%, hsla(0,0%,100%,0.65) 100%)',
          }}
        />

        {/* Aurora ribbon — slow horizontal drift */}
        <motion.div
          aria-hidden
          className="absolute inset-y-0"
          style={{
            width: '170%',
            left: '-35%',
            background:
              'linear-gradient(90deg, transparent 0%, hsla(260,75%,72%,0.11) 28%, hsla(200,75%,72%,0.08) 52%, hsla(280,70%,76%,0.1) 78%, transparent 100%)',
          }}
          animate={{ x: ['-10%', '10%', '-10%'] }}
          transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Starfield */}
        <Starfield />
      </div>

      {/* ═══ Content stack ═══ */}
      <div className="relative z-10">
        <TabRail tabs={TABS} active={activeTab} onChange={onTabChange} />

        {/* Inter-row separator — faint, radial */}
        <div
          aria-hidden
          className="h-px mx-3"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, hsla(250,40%,60%,0.15) 25%, hsla(260,45%,60%,0.22) 50%, hsla(250,40%,60%,0.15) 75%, transparent 100%)',
          }}
        />

        {/* Row 2: Luna identity + controls */}
        <div className="relative flex items-center gap-2 px-3 py-1">
          <LunaAvatar />

          <div className="flex flex-col justify-center gap-[2px] flex-shrink-0 pl-0.5 min-w-0">
            <span className="text-[13px] font-bold text-slate-800 leading-none tracking-tight">
              Luna
            </span>
            <span className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-slate-400 leading-none">
              {essayType}
            </span>
          </div>

          <div className="flex-1 min-w-[4px]" />

          <ModeSwitcher
            mode={mode}
            open={modeOpen}
            onToggle={() => {
              setModeOpen((v) => !v);
              setSettingsOpen(false);
            }}
            onSelect={(m) => {
              setMode(m);
              setModeOpen(false);
            }}
          />

          <SettingsButton
            open={settingsOpen}
            onToggle={() => {
              setSettingsOpen((v) => !v);
              setModeOpen(false);
            }}
            modelTier={modelTier}
            setModelTier={setModelTier}
            voiceTone={voiceTone}
            setVoiceTone={setVoiceTone}
            memoryOn={memoryOn}
            setMemoryOn={setMemoryOn}
          />

          <div
            className="w-px h-4 mx-0.5 flex-shrink-0"
            style={{
              background:
                'linear-gradient(to bottom, transparent, hsla(250,25%,60%,0.25), transparent)',
            }}
            aria-hidden
          />

          <ActionIcon label="Start new conversation">
            <PlusIcon />
          </ActionIcon>
          <ActionIcon label="Conversation history">
            <HistoryIcon />
          </ActionIcon>
          {onClose && (
            <ActionIcon label="Close panel" onClick={onClose}>
              <CloseIcon />
            </ActionIcon>
          )}
        </div>
      </div>

      {/* Pulsing bottom hairline */}
      <motion.div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        animate={{ opacity: [0.72, 1, 0.72] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, hsla(250,55%,60%,0.28) 22%, hsla(260,60%,60%,0.42) 50%, hsla(250,55%,60%,0.28) 78%, transparent 100%)',
        }}
      />
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab rail — row 1
// ═══════════════════════════════════════════════════════════════

function TabRail({
  tabs,
  active,
  onChange,
}: {
  tabs: typeof TABS;
  active: RightTab;
  onChange: (t: RightTab) => void;
}) {
  return (
    <div className="relative z-10 flex items-center justify-between gap-1 px-5 py-1.5 bg-[rgb(251,252,253)] border-b border-slate-100">
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              'relative flex items-center justify-center flex-1 px-3.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight transition-colors duration-150',
              isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="workshopTabActive"
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'radial-gradient(ellipse at center, hsla(260,70%,72%,0.22) 0%, hsla(200,75%,72%,0.14) 55%, transparent 100%)',
                  boxShadow:
                    'inset 0 0 0 1px hsla(260,60%,65%,0.32), 0 0 20px hsla(260,60%,65%,0.18)',
                }}
                transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
              />
            )}
            {isActive && (
              <motion.span
                aria-hidden
                className="absolute -top-[3px] right-2 rounded-full bg-white pointer-events-none"
                style={{
                  width: 3,
                  height: 3,
                  boxShadow: '0 0 6px 1px hsla(260,80%,82%,0.9)',
                }}
                animate={{ opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Luna mini avatar
// ═══════════════════════════════════════════════════════════════

function LunaAvatar() {
  return (
    <motion.div
      className="relative flex-shrink-0"
      style={{ width: 34, height: 34 }}
      animate={{ y: [0, -1.5, 0], rotate: [-1.2, 1.2, -1.2] }}
      transition={{
        y: { duration: 3.6, repeat: Infinity, ease: 'easeInOut' },
        rotate: { duration: 7.4, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      {/* Soft ambient glow */}
      <div className="absolute -inset-1 rounded-full bg-purple-400/22 blur-md" />
      {/* Tiny cyan shimmer behind */}
      <div
        className="absolute -inset-0.5 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 35% 35%, hsla(200,75%,72%,0.28) 0%, transparent 60%)',
        }}
      />
      <img
        src="/clouds/luna/luna-neutral.png"
        alt=""
        draggable={false}
        className="relative w-full h-full object-contain select-none"
        style={{ filter: 'drop-shadow(0 2px 6px hsla(265,70%,60%,0.35))' }}
      />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Mode switcher + popover
// ═══════════════════════════════════════════════════════════════

function ModeSwitcher({
  mode,
  open,
  onToggle,
  onSelect,
}: {
  mode: ChatMode;
  open: boolean;
  onToggle: () => void;
  onSelect: (m: ChatMode) => void;
}) {
  const current = MODES.find((m) => m.id === mode)!;
  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className="group flex items-center gap-1.5 pl-1.5 pr-1 h-[28px] rounded-lg transition-all duration-150"
        style={{
          background: open
            ? 'linear-gradient(180deg, hsla(255,65%,90%,0.75) 0%, hsla(255,60%,94%,0.5) 100%)'
            : 'linear-gradient(180deg, hsla(255,60%,92%,0.5) 0%, hsla(255,55%,95%,0.3) 100%)',
          border: '1px solid hsla(260,50%,65%,0.22)',
          boxShadow:
            'inset 0 1px 0 hsla(0,0%,100%,0.6), 0 1px 2px hsla(250,40%,40%,0.04)',
        }}
      >
        <ModeGlyph mode={mode} />
        <span className="text-[11.5px] font-bold leading-none text-slate-800 tracking-tight whitespace-nowrap">
          {current.label}
        </span>
        <Chevron open={open} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-[248px] rounded-xl overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, hsla(255,55%,99%,0.96) 0%, hsla(255,50%,96%,0.93) 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid hsla(260,50%,65%,0.22)',
              boxShadow:
                '0 22px 44px -14px hsla(260,40%,30%,0.2), 0 0 0 1px hsla(260,60%,70%,0.08)',
            }}
            role="menu"
          >
            <div className="px-3 pt-2.5 pb-1.5 border-b border-slate-100/80 flex items-center gap-1.5">
              <SparkleDot />
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Chat mode
              </span>
            </div>
            <div className="py-1">
              {MODES.map((m) => {
                const isActive = m.id === mode;
                return (
                  <button
                    key={m.id}
                    role="menuitemradio"
                    aria-checked={isActive}
                    onClick={() => onSelect(m.id)}
                    className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-purple-50/70 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <ModeGlyph mode={m.id} active={isActive} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'text-[12px] font-bold',
                            isActive ? 'text-purple-700' : 'text-slate-800'
                          )}
                        >
                          {m.label}
                        </span>
                        {isActive && (
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: 'hsl(260,70%,60%)',
                              boxShadow: '0 0 6px hsla(260,70%,60%,0.7)',
                            }}
                          />
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-500 leading-snug mt-0.5">
                        {m.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModeGlyph({ mode, active }: { mode: ChatMode; active?: boolean }) {
  const color = active ? 'hsl(260,70%,55%)' : 'hsl(260,60%,60%)';
  const bg = active
    ? 'linear-gradient(135deg, hsl(260,75%,62%) 0%, hsl(200,75%,58%) 100%)'
    : 'linear-gradient(135deg, hsl(260,70%,62%) 0%, hsl(280,70%,60%) 100%)';
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 rounded-md"
      style={{
        width: 20,
        height: 20,
        background: bg,
        boxShadow:
          '0 1px 2px hsla(260,60%,40%,0.3), inset 0 1px 0 hsla(0,0%,100%,0.2)',
      }}
    >
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
        {mode === 'coach' && (
          // Compass / guiding star
          <>
            <path
              d="M6 1.5 L7 5 L10.5 6 L7 7 L6 10.5 L5 7 L1.5 6 L5 5 Z"
              stroke="white"
              strokeWidth="0.9"
              strokeLinejoin="round"
              fill="white"
              fillOpacity="0.25"
            />
          </>
        )}
        {mode === 'brainstorm' && (
          // Cloud + sparkle
          <>
            <path
              d="M3 7 Q2 7 2 5.8 Q2 4.6 3.2 4.6 Q3.4 3.4 4.8 3.4 Q6 3.4 6.4 4.4 Q7.4 4 8.2 4.8 Q9.2 5.2 9 6.2 Q9.6 6.4 9.5 7.2 Q9.3 8 8.3 8 L3.5 8 Q2.6 8 3 7 Z"
              stroke="white"
              strokeWidth="0.85"
              strokeLinejoin="round"
              fill="white"
              fillOpacity="0.2"
            />
            <circle cx="9.5" cy="2.5" r="0.5" fill="white" />
          </>
        )}
        {mode === 'critique' && (
          // Precise edit mark
          <>
            <path
              d="M2.5 9.5 L7.5 4.5 L9 6 L4 11 Z"
              transform="translate(-1 -2)"
              stroke="white"
              strokeWidth="0.9"
              strokeLinejoin="round"
              fill="white"
              fillOpacity="0.2"
            />
            <path
              d="M8 3 L9 4"
              stroke="white"
              strokeWidth="0.9"
              strokeLinecap="round"
            />
          </>
        )}
        {mode === 'freewrite' && (
          // Calm wave
          <>
            <path
              d="M2 7 Q3.5 5.5 5 7 T8 7 T11 7"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M2 9.5 Q3.5 8 5 9.5 T8 9.5 T11 9.5"
              stroke="white"
              strokeWidth="0.9"
              strokeLinecap="round"
              strokeOpacity="0.6"
              fill="none"
            />
          </>
        )}
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Settings button + popover
// ═══════════════════════════════════════════════════════════════

function SettingsButton({
  open,
  onToggle,
  modelTier,
  setModelTier,
  voiceTone,
  setVoiceTone,
  memoryOn,
  setMemoryOn,
}: {
  open: boolean;
  onToggle: () => void;
  modelTier: ModelTier;
  setModelTier: (t: ModelTier) => void;
  voiceTone: VoiceTone;
  setVoiceTone: (t: VoiceTone) => void;
  memoryOn: boolean;
  setMemoryOn: (v: boolean) => void;
}) {
  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={onToggle}
        aria-label="AI coach settings"
        aria-expanded={open}
        title="Coach settings"
        className="relative flex items-center justify-center w-[28px] h-[28px] rounded-lg transition-all duration-150"
        style={{
          background: open ? 'hsla(250,40%,70%,0.18)' : 'transparent',
          color: open ? 'hsl(250,55%,38%)' : 'hsl(240,15%,55%)',
          border: '1px solid transparent',
        }}
      >
        <GearIcon />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-[260px] rounded-xl overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, hsla(255,55%,99%,0.96) 0%, hsla(255,50%,96%,0.93) 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid hsla(260,50%,65%,0.22)',
              boxShadow:
                '0 22px 44px -14px hsla(260,40%,30%,0.2), 0 0 0 1px hsla(260,60%,70%,0.08)',
            }}
            role="dialog"
            aria-label="Coach settings"
          >
            <div className="px-3 pt-2.5 pb-1.5 border-b border-slate-100/80 flex items-center gap-1.5">
              <SparkleDot />
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Coach settings
              </span>
            </div>

            <div className="px-3 py-2.5 space-y-3">
              <SegmentedGroup
                label="Model"
                value={modelTier}
                options={[
                  { id: 'fast', label: 'Fast', hint: 'Haiku · quick takes' },
                  { id: 'deep', label: 'Deep', hint: 'Sonnet · full teaching' },
                ]}
                onChange={setModelTier}
              />

              <SegmentedGroup
                label="Voice"
                value={voiceTone}
                options={[
                  { id: 'warm', label: 'Warm' },
                  { id: 'direct', label: 'Direct' },
                  { id: 'socratic', label: 'Socratic' },
                ]}
                onChange={setVoiceTone}
              />

              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-500 leading-none">
                    Memory
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-snug mt-1">
                    Remember across conversations
                  </p>
                </div>
                <Toggle on={memoryOn} onChange={setMemoryOn} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SegmentedGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ id: T; label: string; hint?: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-500 leading-none mb-1.5">
        {label}
      </div>
      <div
        className="flex items-center p-0.5 rounded-lg"
        style={{
          background: 'hsla(250,25%,92%,0.7)',
          border: '1px solid hsla(250,25%,80%,0.4)',
        }}
      >
        {options.map((opt) => {
          const isActive = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className="relative flex-1 px-2 py-1.5 rounded-md text-[11px] font-semibold tracking-tight transition-colors"
              style={{
                color: isActive ? 'hsl(260,55%,35%)' : 'hsl(240,15%,52%)',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId={`seg-${label}`}
                  className="absolute inset-0 rounded-md"
                  style={{
                    background:
                      'linear-gradient(180deg, hsla(0,0%,100%,0.95) 0%, hsla(255,60%,97%,0.9) 100%)',
                    boxShadow:
                      '0 1px 2px hsla(250,40%,40%,0.08), inset 0 0 0 1px hsla(260,50%,70%,0.25)',
                  }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">{opt.label}</span>
            </button>
          );
        })}
      </div>
      {/* Hint for active option */}
      {(() => {
        const active = options.find((o) => o.id === value);
        return active?.hint ? (
          <p className="text-[10px] text-slate-400 mt-1 leading-snug">{active.hint}</p>
        ) : null;
      })()}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="relative flex-shrink-0 rounded-full transition-colors"
      style={{
        width: 32,
        height: 18,
        background: on ? 'hsl(260,70%,60%)' : 'hsla(250,15%,75%,0.7)',
        boxShadow: on
          ? '0 0 0 1px hsla(260,70%,55%,0.3), 0 0 10px hsla(260,70%,60%,0.35)'
          : 'inset 0 1px 2px hsla(250,20%,40%,0.1)',
      }}
    >
      <motion.span
        className="absolute top-0.5 bg-white rounded-full"
        style={{ width: 14, height: 14, boxShadow: '0 1px 2px hsla(0,0%,0%,0.15)' }}
        animate={{ left: on ? 16 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// Shared UI atoms
// ═══════════════════════════════════════════════════════════════

function ActionIcon({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="relative group flex items-center justify-center w-[28px] h-[28px] rounded-lg transition-all duration-150"
      style={{
        background: 'transparent',
        color: 'hsl(240,15%,55%)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'hsla(250,40%,70%,0.15)';
        e.currentTarget.style.color = 'hsl(250,30%,32%)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'hsl(240,15%,55%)';
      }}
    >
      {children}
    </button>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <motion.span
      aria-hidden
      className="flex-shrink-0 ml-auto flex items-center justify-center text-slate-500"
      style={{ width: 14, height: 14 }}
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.18 }}
    >
      <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
        <path
          d="M2.5 3.5 L5 6 L7.5 3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.span>
  );
}

function SparkleDot() {
  return (
    <motion.span
      aria-hidden
      className="w-1.5 h-1.5 rounded-full bg-purple-500"
      style={{ boxShadow: '0 0 6px hsla(260,70%,65%,0.8)' }}
      animate={{ opacity: [0.55, 1, 0.55] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M7 3 L7 11 M3 7 L11 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3.5 3 L3.5 5.5 L6 5.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.8 5.2 A4.2 4.2 0 1 0 4.8 3.3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M7 5 L7 7.3 L8.8 8.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3.8 3.8 L10.2 10.2 M10.2 3.8 L3.8 10.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle
        cx="7"
        cy="7"
        r="1.8"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
      />
      <path
        d="M7 1.6 L7 3.2 M7 10.8 L7 12.4 M1.6 7 L3.2 7 M10.8 7 L12.4 7 M3.05 3.05 L4.2 4.2 M9.8 9.8 L10.95 10.95 M3.05 10.95 L4.2 9.8 M9.8 4.2 L10.95 3.05"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Starfield
// ═══════════════════════════════════════════════════════════════

function Starfield() {
  // Hand-placed for aesthetic balance. Sizes are px; twinkle cycles are
  // mismatched primes so the field never pulses in unison.
  const stars = [
    { top: '18%', left: '8%', size: 1.6, period: 5.2, delay: 0 },
    { top: '62%', left: '22%', size: 1.1, period: 6.7, delay: 2.2 },
    { top: '34%', left: '40%', size: 1.3, period: 7.3, delay: 4.5 },
    { top: '74%', left: '60%', size: 1.0, period: 5.9, delay: 1.4 },
    { top: '20%', left: '72%', size: 1.5, period: 6.1, delay: 3.1 },
    { top: '50%', left: '88%', size: 1.1, period: 7.7, delay: 5.6 },
    { top: '82%', left: '47%', size: 0.9, period: 6.3, delay: 2.7 },
  ];
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      {stars.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            top: s.top,
            left: s.left,
            width: s.size * 2,
            height: s.size * 2,
            boxShadow: `0 0 ${s.size * 3.5}px ${s.size}px hsla(260,75%,82%,0.55)`,
          }}
          animate={{ opacity: [0.15, 0.85, 0.15] }}
          transition={{
            duration: s.period,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: s.delay,
          }}
        />
      ))}
    </div>
  );
}
