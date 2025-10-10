import { useRef, useEffect, useCallback, useState } from 'react';
import { gsap } from 'gsap';

export interface GlowEffectOptions {
  glowColor?: string;
  spotlightRadius?: number;
  particleCount?: number;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  enableParticles?: boolean;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  disableAnimations?: boolean;
}

const DEFAULT_OPTIONS: Required<GlowEffectOptions> = {
  glowColor: '132, 0, 255',
  spotlightRadius: 300,
  particleCount: 12,
  enableSpotlight: true,
  enableBorderGlow: true,
  enableParticles: true,
  enableTilt: false,
  enableMagnetism: false,
  clickEffect: true,
  disableAnimations: false,
};

const createParticleElement = (x: number, y: number, color: string = DEFAULT_OPTIONS.glowColor) => {
  const el = document.createElement('div');
  el.className = 'glow-particle';
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const calculateSpotlightValues = (radius: number) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75,
});

const updateGlowProperties = (
  element: HTMLElement,
  mouseX: number,
  mouseY: number,
  glowIntensity: number,
  radius: number
) => {
  const rect = element.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  element.style.setProperty('--glow-x', `${relativeX}%`);
  element.style.setProperty('--glow-y', `${relativeY}%`);
  element.style.setProperty('--glow-intensity', glowIntensity.toString());
  element.style.setProperty('--glow-radius', `${radius}px`);
};

export const useGlowEffect = (options: GlowEffectOptions = {}) => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const elementRef = useRef<HTMLElement>(null);
  const particlesRef = useRef<HTMLElement[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef<HTMLElement[]>([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef<gsap.core.Tween | null>(null);
  const spotlightRef = useRef<HTMLElement | null>(null);
  const isInsideSection = useRef(false);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !elementRef.current || !config.enableParticles) return;

    const { width, height } = elementRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: config.particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, config.glowColor)
    );
    particlesInitialized.current = true;
  }, [config.particleCount, config.glowColor, config.enableParticles]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();

    particlesRef.current.forEach(particle => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'back.in(1.7)',
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        }
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!elementRef.current || !isHoveredRef.current || !config.enableParticles) return;

    if (!particlesInitialized.current) {
      initializeParticles();
    }

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !elementRef.current) return;

        const clone = particle.cloneNode(true) as HTMLElement;
        elementRef.current!.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { 
          scale: 1, 
          opacity: 1, 
          duration: 0.3, 
          ease: 'back.out(1.7)' 
        });

        gsap.to(clone, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true
        });

        gsap.to(clone, {
          opacity: 0.3,
          duration: 1.5,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true
        });
      }, index * 100);

      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles, config.enableParticles]);

  const createSpotlight = useCallback(() => {
    if (!config.enableSpotlight || spotlightRef.current) return;

    const spotlight = document.createElement('div');
    spotlight.className = 'glow-spotlight';
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${config.glowColor}, 0.15) 0%,
        rgba(${config.glowColor}, 0.08) 15%,
        rgba(${config.glowColor}, 0.04) 25%,
        rgba(${config.glowColor}, 0.02) 40%,
        rgba(${config.glowColor}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;
  }, [config.enableSpotlight, config.glowColor]);

  const updateSpotlight = useCallback((mouseX: number, mouseY: number) => {
    if (!spotlightRef.current || !elementRef.current || !config.enableSpotlight) return;

    const section = elementRef.current.closest('.glow-section');
    const rect = section?.getBoundingClientRect();
    const mouseInside = rect && 
      mouseX >= rect.left && 
      mouseX <= rect.right && 
      mouseY >= rect.top && 
      mouseY <= rect.bottom;

    isInsideSection.current = mouseInside || false;

    if (!mouseInside) {
      gsap.to(spotlightRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
      if (config.enableBorderGlow) {
        elementRef.current.style.setProperty('--glow-intensity', '0');
      }
      return;
    }

    const { proximity, fadeDistance } = calculateSpotlightValues(config.spotlightRadius);
    const elementRect = elementRef.current.getBoundingClientRect();
    const centerX = elementRect.left + elementRect.width / 2;
    const centerY = elementRect.top + elementRect.height / 2;
    const distance = Math.hypot(mouseX - centerX, mouseY - centerY) - 
      Math.max(elementRect.width, elementRect.height) / 2;
    const effectiveDistance = Math.max(0, distance);

    let glowIntensity = 0;
    if (effectiveDistance <= proximity) {
      glowIntensity = 1;
    } else if (effectiveDistance <= fadeDistance) {
      glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
    }

    if (config.enableBorderGlow) {
      updateGlowProperties(elementRef.current, mouseX, mouseY, glowIntensity, config.spotlightRadius);
    }

    gsap.to(spotlightRef.current, {
      left: mouseX,
      top: mouseY,
      duration: 0.1,
      ease: 'power2.out'
    });

    const targetOpacity = effectiveDistance <= proximity
      ? 0.8
      : effectiveDistance <= fadeDistance
        ? ((fadeDistance - effectiveDistance) / (fadeDistance - proximity)) * 0.8
        : 0;

    gsap.to(spotlightRef.current, {
      opacity: targetOpacity,
      duration: targetOpacity > 0 ? 0.2 : 0.5,
      ease: 'power2.out'
    });
  }, [config.enableSpotlight, config.enableBorderGlow, config.spotlightRadius]);

  const handleMouseEnter = useCallback(() => {
    if (config.disableAnimations || !elementRef.current) return;

    isHoveredRef.current = true;
    animateParticles();

    if (config.enableTilt) {
      gsap.to(elementRef.current, {
        rotateX: 5,
        rotateY: 5,
        duration: 0.3,
        ease: 'power2.out',
        transformPerspective: 1000
      });
    }
  }, [animateParticles, config.disableAnimations, config.enableTilt]);

  const handleMouseLeave = useCallback(() => {
    if (config.disableAnimations || !elementRef.current) return;

    isHoveredRef.current = false;
    clearAllParticles();

    if (config.enableTilt) {
      gsap.to(elementRef.current, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    }

    if (config.enableMagnetism) {
      gsap.to(elementRef.current, {
        x: 0,
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    }

    if (config.enableBorderGlow) {
      elementRef.current.style.setProperty('--glow-intensity', '0');
    }
  }, [clearAllParticles, config.disableAnimations, config.enableTilt, config.enableMagnetism, config.enableBorderGlow]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (config.disableAnimations || !elementRef.current) return;

    const rect = elementRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    if (config.enableTilt) {
      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      gsap.to(elementRef.current, {
        rotateX,
        rotateY,
        duration: 0.1,
        ease: 'power2.out',
        transformPerspective: 1000
      });
    }

    if (config.enableMagnetism) {
      const magnetX = (x - centerX) * 0.05;
      const magnetY = (y - centerY) * 0.05;

      magnetismAnimationRef.current = gsap.to(elementRef.current, {
        x: magnetX,
        y: magnetY,
        duration: 0.3,
        ease: 'power2.out'
      });
    }

    updateSpotlight(e.clientX, e.clientY);
  }, [config.disableAnimations, config.enableTilt, config.enableMagnetism, updateSpotlight]);

  const handleClick = useCallback((e: MouseEvent) => {
    if (!config.clickEffect || config.disableAnimations || !elementRef.current) return;

    const rect = elementRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const maxDistance = Math.max(
      Math.hypot(x, y),
      Math.hypot(x - rect.width, y),
      Math.hypot(x, y - rect.height),
      Math.hypot(x - rect.width, y - rect.height)
    );

    const ripple = document.createElement('div');
    ripple.className = 'glow-ripple';
    ripple.style.cssText = `
      position: absolute;
      width: ${maxDistance * 2}px;
      height: ${maxDistance * 2}px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(${config.glowColor}, 0.4) 0%, rgba(${config.glowColor}, 0.2) 30%, transparent 70%);
      left: ${x - maxDistance}px;
      top: ${y - maxDistance}px;
      pointer-events: none;
      z-index: 1000;
    `;

    elementRef.current.appendChild(ripple);

    gsap.fromTo(
      ripple,
      {
        scale: 0,
        opacity: 1
      },
      {
        scale: 1,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => ripple.remove()
      }
    );
  }, [config.clickEffect, config.disableAnimations, config.glowColor]);

  const setupEventListeners = useCallback(() => {
    if (!elementRef.current || config.disableAnimations) return;

    const element = elementRef.current;

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('click', handleClick);

    if (config.enableSpotlight) {
      document.addEventListener('mousemove', (e) => updateSpotlight(e.clientX, e.clientY));
      document.addEventListener('mouseleave', () => {
        isInsideSection.current = false;
        if (spotlightRef.current) {
          gsap.to(spotlightRef.current, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.out'
          });
        }
      });
    }

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('click', handleClick);
      
      if (config.enableSpotlight) {
        document.removeEventListener('mousemove', updateSpotlight as any);
        document.removeEventListener('mouseleave', () => {});
      }
      
      clearAllParticles();
    };
  }, [
    handleMouseEnter,
    handleMouseLeave,
    handleMouseMove,
    handleClick,
    updateSpotlight,
    clearAllParticles,
    config.disableAnimations,
    config.enableSpotlight
  ]);

  useEffect(() => {
    createSpotlight();
    const cleanup = setupEventListeners();

    return () => {
      cleanup?.();
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [createSpotlight, setupEventListeners]);

  return {
    elementRef,
    config
  };
};
