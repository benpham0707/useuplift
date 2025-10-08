import { useEffect, useRef } from 'react';

// Seamless cloud seam between sections: the same cloud you see at the bottom of
// the hero moves upward as you scroll, revealing the section below.
// Performance: single element transform, no external libs.

const SeamScrollCloud = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const group = groupRef.current;
    if (!container || !group) return;

    let raf = 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const update = () => {
      const rect = container.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const totalScrollable = Math.max(rect.height - viewport, 1);
      const clampedTop = Math.min(Math.max(-rect.top, 0), totalScrollable);
      const progress = clampedTop / totalScrollable; // 0..1

      // Move the cloud from slightly below the fold to well above it
      const startYvh = -12;   // start high enough so cap is visible on load
      const endYvh = -62;     // ends well above the seam
      const y = startYvh + (endYvh - startYvh) * progress;
      group.style.transform = `translate(-50%, ${y}vh)`;
    };

    const onScroll = () => {
      if (reduce) return; // static on reduced motion
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={containerRef} className="relative h-[140vh]">
      {/* Sticky viewport that holds the cloud while you scroll through the seam */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Sky above (matches hero) */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-100 to-transparent z-0" />

        {/* White below to represent the inside of the cloud / next section */}
        <div className="absolute inset-x-0 bottom-0 h-[120vh] bg-white z-0" />

        {/* Cloud group: single masked body (no wavy cap) */}
        <div ref={groupRef} className="absolute left-1/2 bottom-0 w-[180vw] h-[64vh] z-10" style={{ transform: 'translate(-50%, -12vh)' }}>
          <div className="absolute inset-0 cloud-mask opacity-100" />
        </div>
      </div>
    </section>
  );
};

export default SeamScrollCloud;


