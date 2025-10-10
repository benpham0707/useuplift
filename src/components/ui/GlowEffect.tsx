import React, { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useGlowEffect, GlowEffectOptions } from '@/hooks/useGlowEffect';
import './GlowEffect.css';

export interface GlowEffectProps extends GlowEffectOptions {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * GlowEffect Component
 * 
 * A reusable component that provides magical glow effects including:
 * - Border glow that follows mouse position
 * - Spotlight effect
 * - Particle animations
 * - Tilt and magnetism effects
 * - Click ripple effects
 * 
 * @example
 * ```tsx
 * <GlowEffect
 *   glowColor="132, 0, 255"
 *   enableBorderGlow={true}
 *   enableSpotlight={true}
 *   enableParticles={true}
 *   enableTilt={true}
 *   clickEffect={true}
 * >
 *   <div>Your content here</div>
 * </GlowEffect>
 * ```
 */
const GlowEffect = forwardRef<HTMLElement, GlowEffectProps>(
  (
    {
      children,
      className,
      style,
      as: Component = 'div',
      glowColor = '132, 0, 255',
      spotlightRadius = 300,
      particleCount = 12,
      enableSpotlight = true,
      enableBorderGlow = true,
      enableParticles = true,
      enableTilt = false,
      enableMagnetism = false,
      clickEffect = true,
      disableAnimations = false,
      ...props
    },
    ref
  ) => {
    const { elementRef, config } = useGlowEffect({
      glowColor,
      spotlightRadius,
      particleCount,
      enableSpotlight,
      enableBorderGlow,
      enableParticles,
      enableTilt,
      enableMagnetism,
      clickEffect,
      disableAnimations,
    });

    // Combine refs if both are provided
    const combinedRef = (node: HTMLElement | null) => {
      if (elementRef.current !== node) {
        (elementRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    };

    const glowClasses = cn(
      'glow-container',
      {
        'glow-container--border-glow': enableBorderGlow,
      },
      className
    );

    const glowStyle = {
      ['--glow-color' as any]: config.glowColor,
      ...style,
    } as React.CSSProperties;

    const Comp = Component as any;

    return (
      <Comp
        ref={combinedRef}
        className={glowClasses}
        style={glowStyle}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

GlowEffect.displayName = 'GlowEffect';

export default GlowEffect;

// Export types for convenience
export type { GlowEffectOptions } from '@/hooks/useGlowEffect';
