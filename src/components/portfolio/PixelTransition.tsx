import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './PixelTransition.css';

interface PixelTransitionProps {
  firstContent: React.ReactNode;
  secondContent: React.ReactNode;
  gridSize?: number;
  /** CSS color or gradient string used to paint the pixels */
  pixelFill?: string;
  /** Minimum pixel square size in px to ensure fewer, larger tiles */
  pixelSizeMin?: number;
  /** Optional subtle glassmorphism blur strength on the pixel overlay */
  glassBlur?: number; // px
  /** Optional subtle saturation boost to mimic frosted glass */
  glassSaturate?: number; // multiplier
  /** When true, hover will NOT trigger the animation */
  disableHover?: boolean;
  animationStepDuration?: number;
  className?: string;
  style?: React.CSSProperties;
  /**
   * When this value changes, the component runs the pixel reveal animation,
   * switching from firstContent to secondContent.
   */
  trigger?: number;
  /** Callback invoked after the secondContent is revealed */
  onReveal?: () => void;
  /** If true, the active overlay will be hidden after the pixel sweep completes */
  autoHideActive?: boolean;
}

const PixelTransition: React.FC<PixelTransitionProps> = ({
  firstContent,
  secondContent,
  gridSize = 7,
  pixelFill = 'linear-gradient(135deg, #6366F1, #22D3EE)',
  pixelSizeMin = 24,
  glassBlur = 1.2,
  glassSaturate = 1.1,
  disableHover = true,
  animationStepDuration = 0.3,
  className = '',
  style = {},
  trigger,
  onReveal,
  autoHideActive = true
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pixelGridRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLDivElement | null>(null);
  const delayedCallRef = useRef<any>(null);

  const [isActive, setIsActive] = useState(false);

  const isTouchDevice = typeof window !== 'undefined' && (
    'ontouchstart' in window ||
    (navigator as any).maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches
  );

  // Build a square pixel grid that fills the container, independent of aspect ratio
  useEffect(() => {
    const containerEl = containerRef.current;
    const pixelGridEl = pixelGridRef.current;
    const activeEl = activeRef.current;
    if (!containerEl || !pixelGridEl) return;

    const buildGrid = () => {
      const rect = containerEl.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      // Choose pixel size from the shorter side so pixels are squares
      const pixelSize = Math.max(pixelSizeMin, Math.floor(Math.min(width, height) / gridSize));
      const cols = Math.ceil(width / pixelSize);
      const rows = Math.ceil(height / pixelSize);

      pixelGridEl.innerHTML = '';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pixel = document.createElement('div');
          pixel.classList.add('pixelated-image-card__pixel');
          // Support gradients or solid fills
          (pixel.style as any).background = pixelFill;
          (pixel.style as any).opacity = '1';
          pixel.style.width = `${pixelSize}px`;
          pixel.style.height = `${pixelSize}px`;
          pixel.style.left = `${c * pixelSize}px`;
          pixel.style.top = `${r * pixelSize}px`;
          pixelGridEl.appendChild(pixel);
        }
      }

      // Mirror border-radius from the default content's first child so pixels respect rounded corners
      const defaultEl = containerEl.querySelector('.pixelated-image-card__default') as HTMLElement | null;
      const roundedTarget = (defaultEl?.firstElementChild as HTMLElement) || defaultEl || containerEl;
      if (roundedTarget && activeEl) {
        const radius = getComputedStyle(roundedTarget).borderRadius;
        (pixelGridEl.style as any).borderRadius = radius;
        (activeEl.style as any).borderRadius = radius;
        (pixelGridEl.style as any).overflow = 'hidden';
        (activeEl.style as any).overflow = 'hidden';
        // Subtle glassmorphism on the overlay plane for a frosted effect during animation only
        (pixelGridEl.style as any).backdropFilter = '';
        (pixelGridEl.style as any).WebkitBackdropFilter = '';
        pixelGridEl.style.visibility = 'hidden';
      }
    };

    buildGrid();
    const ro = new ResizeObserver(buildGrid);
    ro.observe(containerEl);
    return () => ro.disconnect();
  }, [gridSize, pixelFill, pixelSizeMin]);

  const animatePixels = (activate: boolean) => {
    setIsActive(activate);

    const pixelGridEl = pixelGridRef.current;
    const activeEl = activeRef.current as HTMLDivElement | null;
    if (!pixelGridEl || !activeEl) return;

    const pixels = pixelGridEl.querySelectorAll<HTMLDivElement>('.pixelated-image-card__pixel');
    if (!pixels.length) return;

    gsap.killTweensOf(pixels);
    if (delayedCallRef.current) {
      delayedCallRef.current.kill();
    }

    // Reset overlay plane immediately so repeated triggers don't leave stale state
    pixelGridEl.style.visibility = 'hidden';
    // Show overlay plane only during the animation to avoid constant blur on content
    pixelGridEl.style.visibility = 'visible';
    pixelGridEl.style.pointerEvents = 'none';

    gsap.set(pixels, { display: 'none' });

    const totalPixels = pixels.length;
    const staggerDuration = animationStepDuration / totalPixels;

    gsap.to(pixels, {
      display: 'block',
      duration: 0,
      stagger: {
        each: staggerDuration,
        from: 'random'
      }
    });

    const hasActiveContent = activeEl && activeEl.childElementCount > 0;
    delayedCallRef.current = gsap.delayedCall(animationStepDuration, () => {
      if (hasActiveContent) {
        activeEl.style.display = activate ? 'block' : 'none';
        activeEl.style.pointerEvents = activate ? 'none' : '';
      }
      if (activate && onReveal) onReveal();
    });

    gsap.to(pixels, {
      display: 'none',
      duration: 0,
      delay: animationStepDuration,
      stagger: {
        each: staggerDuration,
        from: 'random'
      },
      onComplete: () => {
        if (autoHideActive && hasActiveContent) {
          activeEl.style.display = 'none';
        }
        // Hide overlay plane again so no blur is applied post-animation
        pixelGridEl.style.visibility = 'hidden';
        (pixelGridEl.style as any).backdropFilter = '';
        (pixelGridEl.style as any).WebkitBackdropFilter = '';
      }
    });
  };

  useEffect(() => {
    if (typeof trigger !== 'undefined') {
      // Debounce rapid triggers; reflow grid, then run reveal animation
      const pixelGridEl = pixelGridRef.current;
      if (pixelGridEl) {
        // Force a reflow so any previous visibility/display changes settle
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        pixelGridEl.offsetHeight;
      }
      animatePixels(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const handleMouseEnter = () => {
    if (!isActive) animatePixels(true);
  };
  const handleMouseLeave = () => {
    if (isActive) animatePixels(false);
  };
  const handleClick = () => {
    animatePixels(!isActive);
  };

  return (
    <div
      ref={containerRef}
      className={`pixelated-image-card ${className}`}
      style={style}
      onMouseEnter={!disableHover && !isTouchDevice ? handleMouseEnter : undefined}
      onMouseLeave={!disableHover && !isTouchDevice ? handleMouseLeave : undefined}
      onClick={isTouchDevice ? handleClick : undefined}
    >
      <div className="pixelated-image-card__default">{firstContent}</div>
      <div className="pixelated-image-card__active" ref={activeRef}>
        {secondContent}
      </div>
      <div className="pixelated-image-card__pixels" ref={pixelGridRef} />
    </div>
  );
};

export default PixelTransition;


