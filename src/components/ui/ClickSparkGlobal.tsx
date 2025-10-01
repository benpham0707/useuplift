import React, { useEffect, useRef, useCallback } from 'react';

type Props = {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  extraScale?: number;
};

/**
 * Global, viewport-level click spark overlay.
 * - Renders a fixed canvas covering the entire viewport
 * - Listens to window clicks (capture phase) and never blocks propagation
 * - pointer-events: none guarantees no interaction glitches
 */
const ClickSparkGlobal: React.FC<Props> = ({
  sparkColor = '#a855f7',
  sparkSize = 10,
  sparkRadius = 18,
  sparkCount = 10,
  duration = 450,
  easing = 'ease-out',
  extraScale = 1.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sparksRef = useRef<Array<{ x: number; y: number; angle: number; startTime: number }>>([]);
  const rafRef = useRef<number>(0);

  const ease = useCallback((t: number) => {
    switch (easing) {
      case 'linear':
        return t;
      case 'ease-in':
        return t * t;
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default:
        return t * (2 - t); // ease-out
    }
  }, [easing]);

  // Keep canvas sized to viewport
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    setSize();
    window.addEventListener('resize', setSize);
    return () => window.removeEventListener('resize', setSize);
  }, []);

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (ts: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = ts - spark.startTime;
        if (elapsed >= duration) return false;
        const p = elapsed / duration;
        const e = ease(p);
        const dist = e * sparkRadius * extraScale;
        const len = sparkSize * (1 - e);
        const x1 = spark.x + dist * Math.cos(spark.angle);
        const y1 = spark.y + dist * Math.sin(spark.angle);
        const x2 = spark.x + (dist + len) * Math.cos(spark.angle);
        const y2 = spark.y + (dist + len) * Math.sin(spark.angle);
        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        return true;
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [sparkColor, sparkSize, sparkRadius, duration, ease, extraScale]);

  // Global click listener (capture phase, non-blocking)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const now = performance.now();
      const sparks = Array.from({ length: sparkCount }, (_, i) => ({
        x,
        y,
        angle: (2 * Math.PI * i) / sparkCount,
        startTime: now,
      }));
      sparksRef.current.push(...sparks);
    };

    window.addEventListener('click', onClick, { capture: true });
    return () => window.removeEventListener('click', onClick, { capture: true } as any);
  }, [sparkCount]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
};

export default ClickSparkGlobal;


