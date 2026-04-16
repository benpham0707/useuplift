import { useEffect } from 'react';
import { motion, AnimatePresence, useSpring } from 'motion/react';

// ═══════════════════════════════════════════════════════════════
// LunaSprite — free-floating mascot that inhabits the chat panel
//
// Spatial model:
//   Luna lives INSIDE the chat panel as an absolutely-positioned
//   sprite (no document-level portal). Her "home" is the cloud
//   valley at the bottom of the panel where she's framed by the
//   existing cloud pillars. She travels between positions
//   depending on the coaching state, using spring physics so the
//   motion feels aquatic rather than mechanical.
//
// Phase 1 (this file): static PNGs per state + spring positioning
// Phase 2 (later):     swap PNGs for Kling WebP frame sequences
// ═══════════════════════════════════════════════════════════════

export type LunaState = 'neutral' | 'thinking' | 'happy';

// Position presets are expressed as % of the parent chat panel.
// The parent is `position: relative` and these values are applied
// to a `position: absolute` child whose transform-origin is center.
//
//   • x: 0% = left edge of panel,      100% = right edge
//   • y: 0% = top  edge of panel,      100% = bottom edge
//   • scale: 1 = base size, > 1 for hero moments
//
// Home (neutral) sits inside the cloud valley at the bottom,
// horizontally centered. Reading drifts up into the scroll area.
// Celebration rises to dead center at a larger scale.
const POSITIONS: Record<LunaState, { x: number; y: number; scale: number }> = {
  neutral: { x: 50, y: 72, scale: 1 },
  thinking: { x: 50, y: 38, scale: 1.05 },
  happy: { x: 50, y: 46, scale: 1.25 },
};

// Maps a LunaState to the PNG variant to render.
const IMAGE_SRC: Record<LunaState, string> = {
  neutral: '/clouds/luna/luna-neutral.png',
  thinking: '/clouds/luna/luna-thinking.png',
  happy: '/clouds/luna/luna-happy.png',
};

// Base size at scale=1, in pixels. Celebration gets 1.25× this.
const BASE_SIZE = 96;

interface LunaSpriteProps {
  state: LunaState;
}

export function LunaSprite({ state }: LunaSpriteProps) {
  // Spring-based position and scale. Lower stiffness + medium damping
  // gives the character a floaty "swimming through air" feel — she
  // drifts into place rather than snapping. Overshoot is intentional.
  const xSpring = useSpring(POSITIONS[state].x, { stiffness: 40, damping: 14, mass: 1.1 });
  const ySpring = useSpring(POSITIONS[state].y, { stiffness: 40, damping: 14, mass: 1.1 });
  const scaleSpring = useSpring(POSITIONS[state].scale, { stiffness: 60, damping: 16 });

  // Re-target the springs whenever the coaching state changes.
  useEffect(() => {
    const target = POSITIONS[state];
    xSpring.set(target.x);
    ySpring.set(target.y);
    scaleSpring.set(target.scale);
  }, [state, xSpring, ySpring, scaleSpring]);

  return (
    <motion.div
      aria-hidden
      className="absolute pointer-events-none"
      style={{
        // Spring-driven position as % of parent chat panel
        left: xSpring.to((v) => `${v}%`),
        top: ySpring.to((v) => `${v}%`),
        // Compensate for the top-left anchor so (x,y) targets the center
        translateX: '-50%',
        translateY: '-50%',
        // Hero-moment scale is part of the sprite transform
        scale: scaleSpring,
        width: BASE_SIZE,
        height: BASE_SIZE,
        zIndex: 25,
        // Soft ambient glow under the sprite so she blends into the
        // cloud valley instead of looking pasted on
        filter: 'drop-shadow(0 6px 18px hsla(265, 70%, 65%, 0.22))',
      }}
    >
      {/* Idle breathing loop — lives on an inner wrapper so it stacks
          with the spring-driven transform on the parent without fighting
          it. Three channels with mismatched periods means Luna never
          looks mechanical: scale 4.2s, bob 3.5s, sway 7s — primes that
          never resync. */}
      <motion.div
        className="relative w-full h-full"
        animate={{
          scale: [1, 1.03, 1],
          y: [0, -4, 0],
          rotate: [-1.5, 1.5, -1.5],
        }}
        transition={{
          scale: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        {/* Crossfade between state PNGs. AnimatePresence ensures the
            outgoing variant fades out while the incoming one fades in,
            so state changes feel like a morph even with static assets. */}
        <AnimatePresence mode="sync">
          <motion.img
            key={state}
            src={IMAGE_SRC[state]}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full select-none"
            style={{ objectFit: 'contain' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
          />
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
