import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { MessageBubble, type GlowStop } from './MessageBubble';

export type Role = 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: React.ReactNode;
}

interface MessageDisplayProps {
  messages: Message[];
  className?: string;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

// Glow zone: distance (px) from container bottom.
// Clouds sit in the bottom ~160px of the panel.  Glow is tightly localized
// around them — peak inside the cloud body, fading out just above cloud tops.
const GLOW_ZONE_TOP = 200; // glow fully gone above this (~40px above cloud tops)
const GLOW_PEAK = 60;      // peak glow deep inside the cloud body

/** Glow intensity at a given distance from the container bottom */
function glowAtDist(dist: number): number {
  if (dist < 0) return 0;
  if (dist <= GLOW_PEAK) return 1;
  if (dist < GLOW_ZONE_TOP) return 1 - (dist - GLOW_PEAK) / (GLOW_ZONE_TOP - GLOW_PEAK);
  return 0;
}

/** Number of sample points along the box height for the glow gradient */
const GLOW_SAMPLES = 10;

const EMPTY_STOPS: GlowStop[] = [];

/**
 * Per-message wrapper that tracks its vertical position relative to the
 * scroll container and computes a multi-stop glow gradient that precisely
 * maps the cloud zone onto the box — works correctly for any box height.
 */
function ScrollGlowMessage({
  message,
  scrollContainerRef,
}: {
  message: Message;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const [glowStops, setGlowStops] = useState<GlowStop[]>(EMPTY_STOPS);
  const rafRef = useRef<number>(0);

  const recalc = useCallback(() => {
    const el = elRef.current;
    const container = scrollContainerRef?.current;
    if (!el || !container) return;

    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const h = elRect.height;

    if (h <= 0) { setGlowStops(EMPTY_STOPS); return; }

    // Sample glow intensity at evenly-spaced points down the box.
    // This correctly maps the cloud zone regardless of box height.
    const stops: GlowStop[] = [];
    let anyNonZero = false;
    for (let i = 0; i <= GLOW_SAMPLES; i++) {
      const frac = i / GLOW_SAMPLES;
      const yViewport = elRect.top + frac * h;
      const dist = containerRect.bottom - yViewport;
      const opacity = glowAtDist(dist);
      stops.push({ offset: frac, opacity });
      if (opacity > 0.01) anyNonZero = true;
    }

    setGlowStops(anyNonZero ? stops : EMPTY_STOPS);
  }, [scrollContainerRef]);

  useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container) return;

    const schedule = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(recalc);
    };

    container.addEventListener('scroll', schedule, { passive: true });

    // Recalc when the scroll container OR its content resizes.
    // This catches layout shifts when new messages are added below — without
    // this, earlier messages are stuck with stale glow values from mount time.
    const ro = new ResizeObserver(schedule);
    ro.observe(container);
    const content = container.firstElementChild;
    if (content) ro.observe(content);

    // Initial calc + recalc after layout settles
    recalc();
    const t = setTimeout(recalc, 100);

    return () => {
      container.removeEventListener('scroll', schedule);
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
      clearTimeout(t);
    };
  }, [scrollContainerRef, recalc]);

  return (
    <motion.div
      ref={elRef}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <MessageBubble
        role={message.role}
        content={message.content}
        glowStops={glowStops}
      />
    </motion.div>
  );
}

export function MessageDisplay({ messages, className, scrollContainerRef }: MessageDisplayProps) {
  return (
    <div className={cn("flex flex-col w-full", className)}>
      {messages.map((message) => (
        <ScrollGlowMessage
          key={message.id}
          message={message}
          scrollContainerRef={scrollContainerRef}
        />
      ))}
    </div>
  );
}
