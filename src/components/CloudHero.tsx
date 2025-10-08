import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CloudHero = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const skyRef = useRef<HTMLDivElement | null>(null);
  const backCloudRef = useRef<HTMLDivElement | null>(null);
  const midCloudRef = useRef<HTMLDivElement | null>(null);
  const frontCloudRef = useRef<HTMLDivElement | null>(null);
  const spriteGroupRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      // Hero content fades and moves up slightly on scroll
      if (contentRef.current) {
        gsap.to(contentRef.current, {
          y: -100,
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }

      // Parallax layers for depth
      if (backCloudRef.current) {
        gsap.to(backCloudRef.current, {
          yPercent: 20,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }

      if (midCloudRef.current) {
        gsap.to(midCloudRef.current, {
          yPercent: 35,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }

      if (frontCloudRef.current) {
        gsap.to(frontCloudRef.current, {
          yPercent: 50,
          scale: 1.8,
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }

      if (skyRef.current) {
        gsap.to(skyRef.current, {
          opacity: 0.2,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }

      // Drift disabled for performance
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="relative h-[120vh] min-h-[700px] overflow-clip bg-sky-50">
      {/* Fixed sky gradient */}
      <div ref={skyRef} className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100" />

      {/* Fixed cloud visible on initial landing view (matches seam style) */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-[50vh]">
        <div className="cloud-mask left-1/2 -translate-x-1/2 w-[160vw] h-[56vh] opacity-100" style={{ position: 'absolute', transform: 'translate(-50%, 0)', bottom: '-12vh' }} />
      </div>

      {/* Center hero content */}
      <div ref={contentRef} className="relative z-20 max-w-6xl mx-auto px-6 pt-28 lg:pt-32 text-center">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/70 backdrop-blur border border-white/50 shadow-soft">
          <span className="text-sky-700 font-semibold">Uplift</span>
        </div>
        <h1 className="mt-6 text-4xl lg:text-7xl font-bold tracking-tight text-sky-900">
          Life Guidance, Reimagined
        </h1>
        <p className="mt-4 text-lg lg:text-xl text-sky-800/80 max-w-2xl mx-auto">
          Your AI‑Powered Life Strategist combines portfolio scanning, career exploration, and opportunity matching into one intelligent platform.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <a className="inline-flex items-center rounded-lg bg-sky-600 text-white px-5 py-3 font-semibold shadow-medium hover:brightness-110 transition" href="#get-started">Get Started</a>
          <a className="inline-flex items-center rounded-lg bg-white text-sky-700 px-5 py-3 font-semibold border border-sky-200 shadow-soft hover:bg-sky-50 transition" href="#demo">Watch Demo</a>
        </div>
      </div>

      {/* Spacer to allow scroll interaction within hero */}
      <div className="h-[40vh]" />

      {/* Masked sprite cloud bed using provided image */}
      {/* Removed hero-located cloud; handled by SeamScrollCloud seam component */}
    </section>
  );
};

export default CloudHero;


