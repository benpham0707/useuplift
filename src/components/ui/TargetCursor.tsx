import { useEffect, useRef, useState } from "react";

const isTouchDevice = () => {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    (navigator as any).maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
};

export default function TargetCursor() {
  const [disabled, setDisabled] = useState<boolean>(false);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const crossHRef = useRef<HTMLDivElement | null>(null);
  const crossVRef = useRef<HTMLDivElement | null>(null);
  const visibleRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const shouldDisable = prefersReducedMotion || isTouchDevice();
    setDisabled(shouldDisable);
    if (shouldDisable) return;

    const ringSize = 36;
    const dotSize = 6;

    const setPosition = (x: number, y: number) => {
      const translateRing = `translate3d(${x - ringSize / 2}px, ${y - ringSize / 2}px, 0)`;
      const translateDot = `translate3d(${x - dotSize / 2}px, ${y - dotSize / 2}px, 0)`;
      if (ringRef.current) ringRef.current.style.transform = translateRing;
      if (dotRef.current) dotRef.current.style.transform = translateDot;
      if (crossHRef.current)
        crossHRef.current.style.transform = `translate3d(${x - ringSize / 2}px, ${y - 1}px, 0)`;
      if (crossVRef.current)
        crossVRef.current.style.transform = `translate3d(${x - 1}px, ${y - ringSize / 2}px, 0)`;
    };

    const handleMouseMove = (e: MouseEvent) => {
      visibleRef.current = true;
      setPosition(e.clientX, e.clientY);
      if (ringRef.current) ringRef.current.style.opacity = "1";
      if (dotRef.current) dotRef.current.style.opacity = "1";
      if (crossHRef.current) crossHRef.current.style.opacity = "0.85";
      if (crossVRef.current) crossVRef.current.style.opacity = "0.85";
    };

    const handleMouseLeave = () => {
      visibleRef.current = false;
      if (ringRef.current) ringRef.current.style.opacity = "0";
      if (dotRef.current) dotRef.current.style.opacity = "0";
      if (crossHRef.current) crossHRef.current.style.opacity = "0";
      if (crossVRef.current) crossVRef.current.style.opacity = "0";
    };

    const handleMouseDown = () => {
      if (!ringRef.current) return;
      ringRef.current.style.transform += " scale(0.9)";
      ringRef.current.style.borderColor = "hsl(var(--primary))";
    };

    const handleMouseUp = () => {
      if (!ringRef.current) return;
      // Remove the extra scale on next frame for a subtle spring-back
      requestAnimationFrame(() => {
        if (!ringRef.current) return;
        // Reset back to translate only by removing any scale(...) suffix
        const transform = ringRef.current.style.transform;
        const translateOnly = transform.replace(/\s+scale\([^)]*\)/, "");
        ringRef.current.style.transform = translateOnly;
        ringRef.current.style.borderColor = "hsl(var(--muted-foreground))";
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove as any);
      window.removeEventListener("mouseleave", handleMouseLeave as any);
      window.removeEventListener("mousedown", handleMouseDown as any);
      window.removeEventListener("mouseup", handleMouseUp as any);
    };
  }, []);

  if (disabled) return null;

  return (
    <>
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: 36,
          height: 36,
          borderRadius: 9999,
          border: "2px solid hsl(var(--muted-foreground))",
          opacity: 0,
          zIndex: 2147483647,
          pointerEvents: "none",
          transition: "opacity 150ms ease, border-color 150ms ease",
          willChange: "transform",
          mixBlendMode: "difference"
        }}
      />
      <div
        ref={crossHRef}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: 36,
          height: 2,
          background: "hsl(var(--muted-foreground))",
          opacity: 0,
          zIndex: 2147483647,
          pointerEvents: "none",
          transition: "opacity 150ms ease",
          willChange: "transform",
          mixBlendMode: "difference"
        }}
      />
      <div
        ref={crossVRef}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: 2,
          height: 36,
          background: "hsl(var(--muted-foreground))",
          opacity: 0,
          zIndex: 2147483647,
          pointerEvents: "none",
          transition: "opacity 150ms ease",
          willChange: "transform",
          mixBlendMode: "difference"
        }}
      />
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: 6,
          height: 6,
          borderRadius: 9999,
          background: "hsl(var(--primary))",
          boxShadow: "0 0 12px hsl(var(--primary) / 0.7)",
          opacity: 0,
          zIndex: 2147483647,
          pointerEvents: "none",
          transition: "opacity 150ms ease",
          willChange: "transform",
          mixBlendMode: "normal"
        }}
      />
    </>
  );
}






