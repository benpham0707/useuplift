import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import "./HologramBubble.css";

// ═══════════════════════════════════════════
// HUD Panel Shape System
// ═══════════════════════════════════════════

const CHAMFER = 14;

// User clip — notches at top-left (25%) and bottom-right (70%)
const USER_CLIP = `polygon(
  ${CHAMFER}px 0%,
  25% 0%, 25% 4px, calc(25% + 40px) 4px, calc(25% + 40px) 0%,
  calc(100% - ${CHAMFER}px) 0%,
  100% ${CHAMFER}px,
  100% calc(100% - ${CHAMFER}px),
  calc(100% - ${CHAMFER}px) 100%,
  calc(70% + 30px) 100%, calc(70% + 30px) calc(100% - 3px), 70% calc(100% - 3px), 70% 100%,
  ${CHAMFER}px 100%,
  0% calc(100% - ${CHAMFER}px),
  0% ${CHAMFER}px
)`;

// Assistant clip — mirrored notches at top-right (70%) and bottom-left (25%)
const BOT_CLIP = `polygon(
  ${CHAMFER}px 0%,
  70% 0%, 70% 4px, calc(70% + 40px) 4px, calc(70% + 40px) 0%,
  calc(100% - ${CHAMFER}px) 0%,
  100% ${CHAMFER}px,
  100% calc(100% - ${CHAMFER}px),
  calc(100% - ${CHAMFER}px) 100%,
  calc(25% + 30px) 100%, calc(25% + 30px) calc(100% - 3px), 25% calc(100% - 3px), 25% 100%,
  ${CHAMFER}px 100%,
  0% calc(100% - ${CHAMFER}px),
  0% ${CHAMFER}px
)`;

// ═══════════════════════════════════════════
// Color Palettes
// ═══════════════════════════════════════════

interface FrameColors {
  border: string;
  borderBright: string;
  accent: string;
  accentSoft: string;
  detail: string;
  detailSoft: string;
  innerFrame: string;
  tick: string;
}

// User — orchid-violet with rose accents (fairy)
const USER_COLORS: FrameColors = {
  border: "hsla(280, 65%, 75%, 0.5)",
  borderBright: "hsla(280, 65%, 75%, 0.6)",
  accent: "hsla(325, 60%, 78%, 0.4)",
  accentSoft: "hsla(325, 60%, 78%, 0.25)",
  detail: "hsla(280, 60%, 77%, 0.35)",
  detailSoft: "hsla(280, 60%, 80%, 0.2)",
  innerFrame: "hsla(280, 55%, 80%, 0.16)",
  tick: "hsla(280, 60%, 77%, 0.25)",
};

// Assistant — soft blue with periwinkle accents (mystical)
const BOT_COLORS: FrameColors = {
  border: "hsla(220, 70%, 72%, 0.5)",
  borderBright: "hsla(220, 70%, 72%, 0.6)",
  accent: "hsla(220, 65%, 78%, 0.4)",
  accentSoft: "hsla(220, 65%, 78%, 0.25)",
  detail: "hsla(220, 65%, 75%, 0.35)",
  detailSoft: "hsla(220, 65%, 78%, 0.2)",
  innerFrame: "hsla(220, 60%, 78%, 0.16)",
  tick: "hsla(220, 65%, 75%, 0.25)",
};

// ═══════════════════════════════════════════
// SVG HUD Frame (shared, parameterized)
// ═══════════════════════════════════════════

interface HoloFrameProps {
  w: number;
  h: number;
  colors: FrameColors;
  topNotchPct: number;
  bottomNotchPct: number;
  mirror?: boolean;
}

function HoloFrameSvg({
  w,
  h,
  colors,
  topNotchPct,
  bottomNotchPct,
  mirror,
}: HoloFrameProps) {
  if (w < 40 || h < 40) return null;

  const c = CHAMFER;
  const s = 1;

  const tnX = Math.round(w * topNotchPct);
  const tnW = 40;
  const tnD = 4;

  const bnX = Math.round(w * bottomNotchPct);
  const bnW = 30;
  const bnD = 3;

  const outerPoints = [
    `${c + s},${s}`,
    `${tnX},${s}`,
    `${tnX},${s + tnD}`,
    `${tnX + tnW},${s + tnD}`,
    `${tnX + tnW},${s}`,
    `${w - c - s},${s}`,
    `${w - s},${c + s}`,
    `${w - s},${h - c - s}`,
    `${w - c - s},${h - s}`,
    `${bnX + bnW},${h - s}`,
    `${bnX + bnW},${h - s - bnD}`,
    `${bnX},${h - s - bnD}`,
    `${bnX},${h - s}`,
    `${c + s},${h - s}`,
    `${s},${h - c - s}`,
    `${s},${c + s}`,
  ].join(" ");

  const ig = 7;
  const ci = 10;
  const innerPoints = [
    `${ci + ig},${ig}`,
    `${w - ci - ig},${ig}`,
    `${w - ig},${ci + ig}`,
    `${w - ig},${h - ci - ig}`,
    `${w - ci - ig},${h - ig}`,
    `${ci + ig},${h - ig}`,
    `${ig},${h - ci - ig}`,
    `${ig},${ci + ig}`,
  ].join(" ");

  return (
    <svg
      width={w}
      height={h}
      className="absolute inset-0 z-[5] pointer-events-none"
      aria-hidden="true"
    >
      {/* Outer frame */}
      <polygon
        points={outerPoints}
        fill="none"
        stroke={colors.border}
        strokeWidth="2"
      />
      {/* Inner frame */}
      <polygon
        points={innerPoints}
        fill="none"
        stroke={colors.innerFrame}
        strokeWidth="1"
      />

      {/* ── Corner Accents (mirrored between roles) ── */}

      {/* TL */}
      {mirror ? (
        <>
          <line x1={18} y1={8} x2={30} y2={20} stroke={colors.accent} strokeWidth="1.5" />
          <line x1={24} y1={8} x2={36} y2={20} stroke={colors.accentSoft} strokeWidth="1.5" />
        </>
      ) : (
        <line x1={c + 4} y1={3} x2={c + 28} y2={3} stroke={colors.borderBright} strokeWidth="2" strokeLinecap="round" />
      )}

      {/* TR */}
      {mirror ? (
        <line x1={w - c - 28} y1={3} x2={w - c - 4} y2={3} stroke={colors.borderBright} strokeWidth="2" strokeLinecap="round" />
      ) : (
        <>
          <line x1={w - 32} y1={8} x2={w - 20} y2={20} stroke={colors.accent} strokeWidth="1.5" />
          <line x1={w - 26} y1={8} x2={w - 14} y2={20} stroke={colors.accentSoft} strokeWidth="1.5" />
        </>
      )}

      {/* BL */}
      {mirror ? (
        <line x1={c + 4} y1={h - 3} x2={c + 28} y2={h - 3} stroke={colors.accent} strokeWidth="2" strokeLinecap="round" />
      ) : (
        <polyline
          points={`10,${h - 26} 10,${h - 10} 26,${h - 10}`}
          fill="none"
          stroke={colors.detail}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* BR */}
      {mirror ? (
        <polyline
          points={`${w - 10},${h - 26} ${w - 10},${h - 10} ${w - 26},${h - 10}`}
          fill="none"
          stroke={colors.detail}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <line x1={w - c - 28} y1={h - 3} x2={w - c - 4} y2={h - 3} stroke={colors.accent} strokeWidth="2" strokeLinecap="round" />
      )}

      {/* ── Edge Ticks ── */}
      <line x1={1} y1={Math.round(h * 0.5)} x2={9} y2={Math.round(h * 0.5)} stroke={colors.tick} strokeWidth="1.5" />
      <line x1={w - 1} y1={Math.round(h * 0.35)} x2={w - 9} y2={Math.round(h * 0.35)} stroke={colors.detailSoft} strokeWidth="1.5" />
    </svg>
  );
}

// ═══════════════════════════════════════════
// Shared hook
// ═══════════════════════════════════════════

function useElementSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = React.useState({ w: 0, h: 0 });

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return size;
}

// ═══════════════════════════════════════════
// CVA (only messageRow + avatar remain)
// ═══════════════════════════════════════════

const messageRowVariants = cva(
  "flex w-full items-end gap-4 mb-8 group",
  {
    variants: {
      role: {
        assistant: "flex-row",
        user: "flex-row-reverse",
      },
    },
    defaultVariants: { role: "assistant" },
  }
);

const avatarVariants = cva(
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm relative z-10",
  {
    variants: {
      role: {
        assistant: [
          "bg-[hsla(220,60%,95%,0.7)]",
          "backdrop-blur-sm",
          "border border-[hsla(220,65%,72%,0.35)]",
          "text-[hsl(220,50%,36%)]",
          "ring-2 ring-[hsla(220,65%,72%,0.1)]",
          "shadow-[0_0_8px_hsla(220,65%,72%,0.12)]",
        ],
        user: [
          "bg-[hsla(280,55%,95%,0.7)]",
          "backdrop-blur-sm",
          "border border-[hsla(280,60%,75%,0.35)]",
          "text-[hsl(280,50%,48%)]",
          "ring-2 ring-[hsla(280,60%,75%,0.1)]",
          "shadow-[0_0_8px_hsla(280,60%,75%,0.12)]",
        ],
      },
    },
    defaultVariants: { role: "assistant" },
  }
);

// ═══════════════════════════════════════════
// Component
// ═══════════════════════════════════════════

export interface MessageBubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof messageRowVariants> {
  content: string | React.ReactNode;
  role: "assistant" | "user";
}

// Per-role config for the HUD panel
const ROLE_CONFIG = {
  user: {
    clip: USER_CLIP,
    colors: USER_COLORS,
    topNotchPct: 0.25,
    bottomNotchPct: 0.70,
    mirror: false,
    glowAnim: "holo-glow-pulse-user",
    maxWidth: "75%",
    borderFill: "hsla(280, 60%, 78%, 0.35)",
    panelGradient: `linear-gradient(
      145deg,
      hsla(280, 55%, 97%, 0.78) 0%,
      hsla(290, 50%, 96%, 0.7) 35%,
      hsla(300, 45%, 97%, 0.72) 65%,
      hsla(320, 40%, 97%, 0.75) 100%
    )`,
    shimmer: `linear-gradient(
      105deg,
      transparent 40%,
      hsla(280, 60%, 82%, 0.07) 46%,
      hsla(0, 0%, 100%, 0.14) 50%,
      hsla(325, 55%, 84%, 0.06) 54%,
      transparent 60%
    )`,
    selectionBg: "hsla(280,55%,75%,0.18)",
    textColor: "hsl(280, 35%, 30%)",
    textShadow: "0 0 12px hsla(280, 55%, 75%, 0.2)",
  },
  assistant: {
    clip: BOT_CLIP,
    colors: BOT_COLORS,
    topNotchPct: 0.70,
    bottomNotchPct: 0.25,
    mirror: true,
    glowAnim: "holo-glow-pulse-bot",
    maxWidth: "85%",
    borderFill: "hsla(220, 65%, 75%, 0.35)",
    panelGradient: `linear-gradient(
      145deg,
      hsla(220, 65%, 97%, 0.78) 0%,
      hsla(225, 45%, 96%, 0.7) 35%,
      hsla(230, 42%, 97%, 0.72) 65%,
      hsla(235, 42%, 97%, 0.75) 100%
    )`,
    shimmer: `linear-gradient(
      105deg,
      transparent 40%,
      hsla(220, 65%, 78%, 0.07) 46%,
      hsla(0, 0%, 100%, 0.14) 50%,
      hsla(220, 60%, 80%, 0.06) 54%,
      transparent 60%
    )`,
    selectionBg: "hsla(220,60%,72%,0.18)",
    textColor: "hsl(220, 40%, 28%)",
    textShadow: "0 0 12px hsla(220, 60%, 72%, 0.2)",
  },
} as const;

export function MessageBubble({
  content,
  role,
  className,
  ...props
}: MessageBubbleProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const { w, h } = useElementSize(panelRef);
  const cfg = ROLE_CONFIG[role];

  return (
    <div className={cn(messageRowVariants({ role }), className)} {...props}>
      {/* Avatar */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={cn(avatarVariants({ role }))}
      >
        {role === "assistant" ? (
          <Sparkles className="h-[18px] w-[18px]" strokeWidth={2} />
        ) : (
          <User className="h-[18px] w-[18px]" strokeWidth={2} />
        )}
      </motion.div>

      {/* ──── HUD Panel (both roles) ──── */}
      <div
        ref={panelRef}
        className="relative holo-panel-wrapper"
        style={{
          maxWidth: cfg.maxWidth,
          animation: `${cfg.glowAnim} 4s ease-in-out infinite`,
        }}
      >
        {/* Border fill — outer clip */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ clipPath: cfg.clip, background: cfg.borderFill }}
          aria-hidden="true"
        />

        {/* Panel fill — inset 2px */}
        <div
          className="absolute overflow-hidden pointer-events-none"
          style={{
            inset: "2px",
            clipPath: cfg.clip,
            background: cfg.panelGradient,
            backdropFilter: "blur(12px)",
          }}
          aria-hidden="true"
        >
          {/* Shimmer sweep */}
          <div
            className="absolute inset-0 holo-shimmer-layer"
            style={{
              background: cfg.shimmer,
              backgroundSize: "200% 100%",
              animation: "holo-shimmer 6s ease-in-out infinite",
            }}
          />
        </div>

        {/* SVG frame overlay */}
        <HoloFrameSvg
          w={w}
          h={h}
          colors={cfg.colors}
          topNotchPct={cfg.topNotchPct}
          bottomNotchPct={cfg.bottomNotchPct}
          mirror={cfg.mirror}
        />

        {/* Text content */}
        <div
          className="relative z-10 px-6 py-5 text-[16px] leading-[1.75] tracking-[0.02em] font-medium break-words [&_p]:mb-4 [&_p:last-child]:mb-0"
          style={{
            color: cfg.textColor,
            textShadow: cfg.textShadow,
          }}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
