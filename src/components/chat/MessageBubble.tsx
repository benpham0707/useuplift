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

/** A single sample in the positional glow gradient */
export interface GlowStop {
  /** 0 = top of box, 1 = bottom of box */
  offset: number;
  /** 0–1 glow intensity at this point */
  opacity: number;
}

interface HoloFrameProps {
  w: number;
  h: number;
  colors: FrameColors;
  topNotchPct: number;
  bottomNotchPct: number;
  mirror?: boolean;
  /** Multi-stop glow profile (empty = no glow) */
  glowStops?: GlowStop[];
}

// Rainbow-within-palette glow stops — more stops = richer shimmer
const FRAME_GLOW_STOPS = {
  bot: [
    { offset: "0%",   color: "hsla(185, 90%, 65%, 1)" },
    { offset: "20%",  color: "hsla(200, 85%, 68%, 1)" },
    { offset: "40%",  color: "hsla(220, 82%, 70%, 1)" },
    { offset: "60%",  color: "hsla(245, 78%, 72%, 1)" },
    { offset: "80%",  color: "hsla(265, 75%, 74%, 1)" },
    { offset: "100%", color: "hsla(200, 80%, 68%, 1)" },
  ],
  user: [
    { offset: "0%",   color: "hsla(320, 85%, 72%, 1)" },
    { offset: "20%",  color: "hsla(300, 80%, 70%, 1)" },
    { offset: "40%",  color: "hsla(280, 78%, 68%, 1)" },
    { offset: "60%",  color: "hsla(260, 82%, 72%, 1)" },
    { offset: "80%",  color: "hsla(240, 80%, 74%, 1)" },
    { offset: "100%", color: "hsla(310, 82%, 70%, 1)" },
  ],
};

function HoloFrameSvg({
  w,
  h,
  colors,
  topNotchPct,
  bottomNotchPct,
  mirror,
  glowStops = [],
}: HoloFrameProps) {
  // Stable unique ID for SVG defs (masks, filters, gradients)
  const uid = React.useRef(`hf-${Math.random().toString(36).slice(2, 8)}`).current;

  if (w < 40 || h < 40) return null;

  const c = CHAMFER;
  const s = 1;
  const showGlow = glowStops.length > 0;

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

  const stops = mirror ? FRAME_GLOW_STOPS.bot : FRAME_GLOW_STOPS.user;

  return (
    <svg
      width={w}
      height={h}
      className="absolute inset-0 z-[5] pointer-events-none"
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      {showGlow && (
        <defs>
          {/* Multi-stop rainbow-within-palette gradient (diagonal sweep) */}
          <linearGradient id={`${uid}-grad`} x1="0" y1="0" x2="1" y2="1">
            {stops.map((s) => (
              <stop key={s.offset} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>
          {/* Multi-stop positional mask — accurately maps the cloud zone onto the box.
              Rect extends 40px beyond the box so that blurred glow bleeds out softly
              instead of being hard-clipped at the SVG boundary.
              gradientUnits=userSpaceOnUse with y1=0,y2=h maps the 0-1 stop offsets
              to the box height in absolute coords; the oversized rect inherits the
              edge colors (first/last stop) outside the box — no hard clip. */}
          <linearGradient id={`${uid}-mg`} x1="0" y1="0" x2="0" y2={h} gradientUnits="userSpaceOnUse">
            {glowStops.map((gs, i) => (
              <stop key={i} offset={gs.offset} stopColor="white" stopOpacity={gs.opacity} />
            ))}
          </linearGradient>
          <mask id={`${uid}-mask`}>
            <rect x="-40" y="-40" width={w + 80} height={h + 80} fill={`url(#${uid}-mg)`} />
          </mask>
          {/* Soft wide bloom — larger stdDeviation for visible aura */}
          <filter id={`${uid}-bloom`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Extra-wide outer aura */}
          <filter id={`${uid}-aura`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" />
          </filter>
        </defs>
      )}

      {/* Outer frame — always normal colors */}
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

      {/* ═══ Glow overlay — positionally masked to cloud zone ═══ */}
      {showGlow && (
        <g mask={`url(#${uid}-mask)`}>
          {/* Layer 1: Wide diffuse aura behind the frame */}
          <g opacity={0.5} filter={`url(#${uid}-aura)`}>
            <polygon points={outerPoints} fill="none" stroke={`url(#${uid}-grad)`} strokeWidth="6" />
          </g>
          {/* Layer 2: Crisp bloomed frame lines */}
          <g filter={`url(#${uid}-bloom)`}>
            <polygon points={outerPoints} fill="none" stroke={`url(#${uid}-grad)`} strokeWidth="3" />
            <polygon points={innerPoints} fill="none" stroke={`url(#${uid}-grad)`} strokeWidth="2" />
          </g>
        </g>
      )}
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
  "flex w-full items-end gap-3 mb-5 group",
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
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm relative z-10",
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
  /** Multi-stop glow profile — empty array = no glow */
  glowStops?: GlowStop[];
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
    maxWidth: "78%",
    borderFill: "hsla(280, 60%, 78%, 0.35)",
    panelGradient: `linear-gradient(
      145deg,
      hsla(280, 55%, 97%, 0.92) 0%,
      hsla(290, 50%, 96%, 0.88) 35%,
      hsla(300, 45%, 97%, 0.9) 65%,
      hsla(320, 40%, 97%, 0.92) 100%
    )`,
    auraGradient: `linear-gradient(
      135deg,
      hsla(320, 85%, 72%, 0.6) 0%,
      hsla(290, 80%, 70%, 0.5) 30%,
      hsla(270, 78%, 68%, 0.5) 50%,
      hsla(250, 82%, 74%, 0.5) 70%,
      hsla(310, 80%, 70%, 0.6) 100%
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
    textColor: "hsl(260, 20%, 18%)",
    textShadow: "none",
    strongColor: "hsl(260, 30%, 14%)",
    emColor: "hsl(270, 40%, 52%)",
  },
  assistant: {
    clip: BOT_CLIP,
    colors: BOT_COLORS,
    topNotchPct: 0.70,
    bottomNotchPct: 0.25,
    mirror: true,
    glowAnim: "holo-glow-pulse-bot",
    maxWidth: "88%",
    borderFill: "hsla(220, 65%, 75%, 0.35)",
    panelGradient: `linear-gradient(
      145deg,
      hsla(220, 65%, 97%, 0.92) 0%,
      hsla(225, 45%, 96%, 0.88) 35%,
      hsla(230, 42%, 97%, 0.9) 65%,
      hsla(235, 42%, 97%, 0.92) 100%
    )`,
    auraGradient: `linear-gradient(
      135deg,
      hsla(185, 90%, 65%, 0.5) 0%,
      hsla(210, 85%, 68%, 0.5) 25%,
      hsla(235, 80%, 70%, 0.5) 50%,
      hsla(260, 78%, 72%, 0.5) 75%,
      hsla(200, 82%, 68%, 0.5) 100%
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
    textColor: "hsl(230, 20%, 18%)",
    textShadow: "none",
    strongColor: "hsl(235, 28%, 14%)",
    emColor: "hsl(255, 40%, 52%)",
  },
} as const;

/** Convert GlowStop[] to a CSS linear-gradient mask string */
function glowStopsToCSS(stops: GlowStop[]): string {
  const parts = stops.map(s => `rgba(0,0,0,${s.opacity}) ${s.offset * 100}%`);
  return `linear-gradient(to bottom, ${parts.join(', ')})`;
}

export function MessageBubble({
  content,
  role,
  className,
  glowStops = [],
  ...props
}: MessageBubbleProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const { w, h } = useElementSize(panelRef);
  const cfg = ROLE_CONFIG[role];
  const showAura = glowStops.length > 0;

  return (
    <div className={cn(messageRowVariants({ role }), className)} {...props}>
      {/* Avatar */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={cn(avatarVariants({ role }))}
      >
        {role === "assistant" ? (
          <Sparkles className="h-4 w-4" strokeWidth={2} />
        ) : (
          <User className="h-4 w-4" strokeWidth={2} />
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
        {/* ── Background aura: positionally masked to cloud zone ── */}
        {showAura && (
          <div
            className="absolute pointer-events-none rounded-2xl"
            style={{
              inset: "-8px",
              background: cfg.auraGradient,
              opacity: 0.6,
              filter: "blur(14px)",
              transition: "opacity 0.4s ease-out",
              maskImage: glowStopsToCSS(glowStops),
              WebkitMaskImage: glowStopsToCSS(glowStops),
            }}
            aria-hidden="true"
          />
        )}

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
          }}
          aria-hidden="true"
        >
          {/* Shimmer sweep — low opacity so it doesn't wash out text */}
          <div
            className="absolute inset-0 holo-shimmer-layer opacity-40"
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
          glowStops={glowStops}
        />

        {/* Text content */}
        <div
          className={cn(
            "relative z-10 px-5 py-4 break-words",
            // Base typography — compact, readable for long-form
            "text-[13.5px] leading-[1.7] tracking-[0.01em]",
            // Role-specific text weight
            role === "user" ? "font-[450]" : "font-normal",
            // Rich text styling for assistant long-form responses
            "[&_p]:mb-2.5 [&_p:last-child]:mb-0",
            "[&_strong]:font-[570] [&_strong]:tracking-[0.01em] [&_strong]:[color:var(--strong-color)]",
            "[&_em]:italic [&_em]:font-[420] [&_em]:[color:var(--em-color)]",
            // Lists
            "[&_ul]:my-2 [&_ul]:ml-1 [&_ul]:space-y-1.5",
            "[&_li]:pl-1 [&_li]:text-[13px] [&_li]:leading-[1.65]",
            // Headings inside messages
            "[&_h3]:text-[14px] [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3:first-child]:mt-0",
            // Blockquotes for pulled essay text
            "[&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-[12.5px] [&_blockquote]:italic [&_blockquote]:opacity-75",
          )}
          style={{
            color: cfg.textColor,
            textShadow: cfg.textShadow,
            ["--strong-color" as string]: cfg.strongColor,
            ["--em-color" as string]: cfg.emColor,
          }}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
