import React from 'react';
import { motion } from 'motion/react';

// ═══════════════════════════════════════════════════════════════
// Chat Header — Coaching Console
// Crafted controls for the functions a coaching chat panel needs:
//   • Luna identity (avatar)
//   • Essay context switcher (which essay am I working on)
//   • New conversation
//   • Conversation history
//   • Overflow menu
//   • Close panel
// ═══════════════════════════════════════════════════════════════

export function ChatHeader() {
  // In production these stream from session state
  const essayType = 'Common App';

  return (
    <header className="relative z-20 flex-shrink-0 overflow-hidden">
      {/* Frosted glass base */}
      <div
        aria-hidden
        className="absolute inset-0 bg-white/60 backdrop-blur-xl"
      />

      {/* Subtle aurora drift */}
      <motion.div
        aria-hidden
        className="absolute inset-y-0 pointer-events-none"
        style={{
          width: '160%',
          left: '-30%',
          background:
            'linear-gradient(90deg, transparent 0%, hsla(260,75%,75%,0.07) 40%, hsla(200,75%,75%,0.05) 60%, transparent 100%)',
        }}
        animate={{ x: ['-8%', '8%', '-8%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Bottom separator */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, hsla(250,45%,55%,0.2) 22%, hsla(250,45%,55%,0.3) 50%, hsla(250,45%,55%,0.2) 78%, transparent 100%)',
        }}
      />

      {/* Content row */}
      <div className="relative flex items-center gap-2.5 px-3 py-2.5">
        {/* Name block — the animated LunaSprite in the cloud valley IS
            the coach's visual presence, so no avatar lives in the header */}
        <div className="flex flex-col justify-center gap-[2px] flex-shrink-0 pl-1">
          <span className="text-[13px] font-bold text-slate-800 leading-none tracking-tight">
            Luna
          </span>
          <span className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-slate-400 leading-none">
            essay coach
          </span>
        </div>

        {/* Divider */}
        <VerticalDivider />

        {/* Essay context switcher (primary navigation) */}
        <EssaySwitcher type={essayType} />

        {/* Action cluster */}
        <div className="flex items-center gap-0.5 flex-shrink-0 ml-auto pl-1">
          <ActionButton label="Start new conversation" kind="primary">
            <PlusIcon />
          </ActionButton>
          <ActionButton label="Conversation history">
            <HistoryIcon />
          </ActionButton>
          <ActionButton label="More options">
            <MenuIcon />
          </ActionButton>
          <div className="w-px h-4 mx-0.5" style={{
            background: 'linear-gradient(to bottom, transparent, hsla(250,25%,60%,0.25), transparent)'
          }} aria-hidden />
          <ActionButton label="Close panel">
            <CloseIcon />
          </ActionButton>
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════
// Essay Switcher (primary context navigation)
// ═══════════════════════════════════════════════════════════════

function EssaySwitcher({ type }: { type: string }) {
  return (
    <button
      type="button"
      aria-label={`Current essay: ${type}. Click to switch.`}
      className="group flex items-center gap-1.5 pl-1.5 pr-1 h-[28px] rounded-lg min-w-0 flex-1 transition-all duration-200"
      style={{
        background:
          'linear-gradient(180deg, hsla(255,60%,92%,0.5) 0%, hsla(255,55%,95%,0.3) 100%)',
        border: '1px solid hsla(260,50%,65%,0.22)',
        boxShadow:
          'inset 0 1px 0 hsla(0,0%,100%,0.6), 0 1px 2px hsla(250,40%,40%,0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background =
          'linear-gradient(180deg, hsla(255,65%,90%,0.7) 0%, hsla(255,60%,94%,0.5) 100%)';
        e.currentTarget.style.borderColor = 'hsla(260,55%,62%,0.35)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background =
          'linear-gradient(180deg, hsla(255,60%,92%,0.5) 0%, hsla(255,55%,95%,0.3) 100%)';
        e.currentTarget.style.borderColor = 'hsla(260,50%,65%,0.22)';
      }}
    >
      {/* Document glyph */}
      <div
        className="flex items-center justify-center flex-shrink-0 rounded-md"
        style={{
          width: 20,
          height: 20,
          background:
            'linear-gradient(135deg, hsl(260,70%,60%) 0%, hsl(280,70%,58%) 100%)',
          boxShadow:
            '0 1px 2px hsla(260,60%,40%,0.3), inset 0 1px 0 hsla(0,0%,100%,0.2)',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path
            d="M2 1 L6.5 1 L8 2.5 L8 9 L2 9 Z"
            stroke="white"
            strokeWidth="1"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M6.5 1 L6.5 2.5 L8 2.5"
            stroke="white"
            strokeWidth="1"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M3.5 4.5 L6.5 4.5 M3.5 6 L6.5 6 M3.5 7.5 L5.5 7.5"
            stroke="white"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Label */}
      <span className="text-[12px] font-bold leading-none text-slate-800 tracking-tight whitespace-nowrap truncate">
        {type}
      </span>

      {/* Chevron */}
      <motion.div
        aria-hidden
        className="flex-shrink-0 ml-auto flex items-center justify-center text-slate-500 group-hover:text-slate-700 transition-colors"
        style={{ width: 14, height: 14 }}
        whileHover={{ y: 1 }}
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
      </motion.div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// Action Button (crafted icon button)
// ═══════════════════════════════════════════════════════════════

function ActionButton({
  label,
  children,
  kind = 'default',
}: {
  label: string;
  children: React.ReactNode;
  kind?: 'default' | 'primary';
}) {
  const primary = kind === 'primary';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="relative group flex items-center justify-center w-[28px] h-[28px] rounded-lg transition-all duration-150"
      style={{
        background: primary
          ? 'linear-gradient(180deg, hsla(260,70%,60%,0.11) 0%, hsla(260,70%,60%,0.05) 100%)'
          : 'transparent',
        border: primary
          ? '1px solid hsla(260,60%,60%,0.18)'
          : '1px solid transparent',
        color: primary ? 'hsl(260,60%,45%)' : 'hsl(240,15%,55%)',
      }}
      onMouseEnter={(e) => {
        if (primary) {
          e.currentTarget.style.background =
            'linear-gradient(180deg, hsla(260,70%,60%,0.18) 0%, hsla(260,70%,60%,0.1) 100%)';
          e.currentTarget.style.borderColor = 'hsla(260,60%,60%,0.32)';
        } else {
          e.currentTarget.style.background = 'hsla(250,40%,70%,0.12)';
          e.currentTarget.style.color = 'hsl(250,30%,32%)';
        }
      }}
      onMouseLeave={(e) => {
        if (primary) {
          e.currentTarget.style.background =
            'linear-gradient(180deg, hsla(260,70%,60%,0.11) 0%, hsla(260,70%,60%,0.05) 100%)';
          e.currentTarget.style.borderColor = 'hsla(260,60%,60%,0.18)';
        } else {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'hsl(240,15%,55%)';
        }
      }}
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// Icons (crafted)
// ═══════════════════════════════════════════════════════════════

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

function MenuIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="3" cy="7" r="1.2" fill="currentColor" />
      <circle cx="7" cy="7" r="1.2" fill="currentColor" />
      <circle cx="11" cy="7" r="1.2" fill="currentColor" />
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

function VerticalDivider() {
  return (
    <div
      aria-hidden
      className="w-px h-8 flex-shrink-0"
      style={{
        background:
          'linear-gradient(to bottom, transparent 0%, hsla(250,40%,55%,0.2) 25%, hsla(250,40%,55%,0.26) 75%, transparent 100%)',
      }}
    />
  );
}
