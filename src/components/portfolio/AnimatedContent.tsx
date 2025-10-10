import { useRef, useEffect, PropsWithChildren } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type Direction = 'horizontal' | 'vertical';

interface AnimatedContentProps {
  distance?: number;
  direction?: Direction;
  reverse?: boolean;
  duration?: number;
  ease?: string;
  initialOpacity?: number;
  animateOpacity?: boolean;
  scale?: number;
  threshold?: number;
  enterThreshold?: number; // fraction of viewport for appearance
  leaveThreshold?: number; // fraction of viewport for disappearance (hysteresis)
  delay?: number;
  onComplete?: () => void;
  reversible?: boolean;
  leaveOpacity?: number;
  leaveScale?: number;
  onActiveChange?: (active: boolean) => void;
  enterBackDelay?: number; // extra delay when entering back (scrolling up)
  enterBackDurationMultiplier?: number; // slow down enter when scrolling up
  initialReveal?: boolean; // if true and already in view on mount, reveal immediately
  endExtendPct?: number; // extend end boundary percentage for reversible triggers
  hideDuration?: number; // duration for hide animation
  // If true, force opacity to 1 when element center hits viewport center
  snapOpacityAtCenter?: boolean;
}

const AnimatedContent = ({
  children,
  distance = 100,
  direction = 'vertical',
  reverse = false,
  duration = 0.8,
  ease = 'power3.out',
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold = 0.1,
  enterThreshold,
  leaveThreshold,
  delay = 0,
  onComplete,
  reversible = false,
  leaveOpacity = 0.12,
  leaveScale = 0.98,
  onActiveChange,
  enterBackDelay = 0.15,
  enterBackDurationMultiplier = 1.3,
  initialReveal = false,
  endExtendPct = 0,
  hideDuration,
  snapOpacityAtCenter = false
}: PropsWithChildren<AnimatedContentProps>) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const axis = direction === 'horizontal' ? 'x' : 'y';
    const offset = reverse ? -distance : distance;
    const startPct = (1 - threshold) * 100;

    // ensure starting state is hidden (default to entering from the bottom on first reveal)
    gsap.set(el, {
      [axis]: offset,
      scale,
      autoAlpha: animateOpacity ? initialOpacity : 1
    } as any);

    let stEnter: ScrollTrigger | null = null;
    let stLeaveTop: ScrollTrigger | null = null;
    let stLeaveBottom: ScrollTrigger | null = null;
    let stOpacitySnap: ScrollTrigger | null = null;

    if (reversible) {
      const distanceAbs = Math.abs(distance);
      const offsetDown = reverse ? -distanceAbs : distanceAbs; // entering while scrolling down -> from bottom
      const offsetUp = -offsetDown; // entering while scrolling up -> from top

      const showFrom = (fromOffset: number, dur: number = duration, del: number = delay, isBack: boolean = false) => {
        gsap.killTweensOf(el);
        // Position/scale tween (longer)
        const tl = gsap.timeline({ overwrite: 'auto' });
        tl.fromTo(
          el,
          { [axis]: fromOffset, scale },
          { [axis]: 0, scale: 1, duration: dur, ease, delay: del } as any,
          0
        );

        // Opacity tween (shorter) so the box becomes solid early
        if (animateOpacity) {
          // Reach full opacity quickly; motion continues longer
          const opacityDur = Math.max(0.18, Math.min(0.4, dur * 0.45));
          tl.to(el, { autoAlpha: 1, duration: opacityDur, ease: 'power2.out', delay: del } as any, 0);
        } else {
          gsap.set(el, { autoAlpha: 1 } as any);
        }

        if (onComplete) tl.eventCallback('onComplete', onComplete);
      };

      const hideTo = (toOffset: number) => {
        gsap.killTweensOf(el);
        // Favor a longer opacity fade and a shorter motion for a gentle exit
        const fadeDur = hideDuration ?? Math.max(1.2, duration * 1.4);
        const moveDur = Math.max(0.25, Math.min(fadeDur * 0.35, duration * 0.5));
        const tl = gsap.timeline({ overwrite: 'auto' });
        tl.to(el, { [axis]: toOffset, scale: leaveScale, duration: moveDur, ease: 'power1.out' } as any, 0);
        if (animateOpacity) {
          tl.to(el, { autoAlpha: leaveOpacity, duration: fadeDur, ease: 'power2.inOut' } as any, 0);
        } else {
          tl.set(el, { autoAlpha: 1 } as any);
        }
      };

      const enterT = typeof enterThreshold === 'number' ? enterThreshold : threshold;
      const leaveT = typeof leaveThreshold === 'number' ? leaveThreshold : Math.min(0.48, enterT + 0.12);
      const startEnterPct = (1 - enterT) * 100;
      const startLeavePct = (1 - leaveT) * 100;

      // Show trigger (wider band)
      stEnter = ScrollTrigger.create({
        trigger: el,
        start: `top ${startEnterPct}%`,
        end: `bottom ${100 - startEnterPct + endExtendPct}%`,
        onEnter: () => { showFrom(offsetDown, duration, delay, false); if (onActiveChange) onActiveChange(true); }, // scrolling down
        onEnterBack: () => { showFrom(offsetUp, duration * enterBackDurationMultiplier, delay + enterBackDelay, true); if (onActiveChange) onActiveChange(true); }, // scrolling up
        invalidateOnRefresh: true
      });

      // Hide trigger (narrower band to create hysteresis) for leaving at TOP when scrolling down
      stLeaveTop = ScrollTrigger.create({
        trigger: el,
        start: `top ${startLeavePct}%`,
        end: `bottom ${100 - startLeavePct + endExtendPct}%`,
        onLeave: self => { // leaving top when scrolling down
          // If scrolling up out of range, don't hide via this trigger
          if (self.direction === -1) return;
          hideTo(offsetUp); if (onActiveChange) onActiveChange(false);
        },
        // When scrolling up, do not use the top-boundary to hide; defer to bottom trigger
        onLeaveBack: () => {},
        invalidateOnRefresh: true
      });

      // Hide trigger at BOTTOM when scrolling up: when element's bottom reaches viewport bottom
      stLeaveBottom = ScrollTrigger.create({
        trigger: el,
        start: 'bottom 100%', // hide exactly when bottom touches viewport bottom while scrolling up
        end: 'bottom 100%',
        onLeaveBack: () => { hideTo(offsetDown); if (onActiveChange) onActiveChange(false); },
        invalidateOnRefresh: true
      });

      // Force initial hidden state then optionally reveal if already in view (e.g., first card)
      if (stEnter) {
        if (stEnter.isActive && initialReveal) {
          showFrom(offsetDown);
          if (onActiveChange) onActiveChange(true);
        } else {
          hideTo(offsetDown);
          if (onActiveChange) onActiveChange(false);
        }
      }

      // Ensure opacity is fully solid when element center reaches viewport center
      if (snapOpacityAtCenter && animateOpacity) {
        stOpacitySnap = ScrollTrigger.create({
          trigger: el,
          start: 'center 50%',
          end: 'center 50%',
          onEnter: () => { gsap.to(el, { autoAlpha: 1, duration: 0.12, overwrite: 'auto' } as any); },
          onEnterBack: () => { gsap.to(el, { autoAlpha: 1, duration: 0.12, overwrite: 'auto' } as any); },
          invalidateOnRefresh: true
        });
      }
    } else {
      gsap.to(el, {
        [axis]: 0,
        scale: 1,
        opacity: 1,
        duration,
        ease,
        delay,
        onComplete,
        scrollTrigger: {
          trigger: el,
          start: `top ${startPct}%`,
          toggleActions: 'play none none none',
          once: true,
          onEnter: () => { if (onActiveChange) onActiveChange(true); },
          onLeave: () => { if (onActiveChange) onActiveChange(false); }
        }
      } as any);
    }

    return () => {
      if (stEnter) stEnter.kill();
      if (stLeaveTop) stLeaveTop.kill();
      if (stLeaveBottom) stLeaveBottom.kill();
      if (stOpacitySnap) stOpacitySnap.kill();
      gsap.killTweensOf(el);
    };
  }, [
    distance,
    direction,
    reverse,
    duration,
    ease,
    initialOpacity,
    animateOpacity,
    scale,
    threshold,
    enterThreshold,
    leaveThreshold,
    delay,
    onComplete,
    reversible,
    leaveOpacity,
    leaveScale,
    initialReveal,
    endExtendPct,
    hideDuration,
    snapOpacityAtCenter
  ]);

  return <div ref={ref}>{children}</div>;
};

export default AnimatedContent;


