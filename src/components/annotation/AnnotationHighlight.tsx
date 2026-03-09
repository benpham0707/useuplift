/**
 * AnnotationHighlight — a styled text span for annotated essay regions.
 *
 * Color-coded by severity with distinct underline styles:
 * - critical: wavy red underline
 * - important: solid amber underline
 * - suggestion: dotted blue underline
 * - strength: solid green underline
 *
 * Supports hover tooltips showing the annotation insight preview.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import type { TextSegment, AnnotationSeverity } from './types';

interface AnnotationHighlightProps {
  segment: TextSegment;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const SEVERITY_STYLES: Record<AnnotationSeverity, { bg: string; ring: string; underline: string }> = {
  critical: {
    bg: 'bg-red-100/60 dark:bg-red-900/30',
    ring: 'ring-red-400 dark:ring-red-500',
    underline: 'underline decoration-wavy decoration-red-400 dark:decoration-red-500 decoration-2',
  },
  important: {
    bg: 'bg-amber-100/60 dark:bg-amber-900/30',
    ring: 'ring-amber-400 dark:ring-amber-500',
    underline: 'underline decoration-solid decoration-amber-400 dark:decoration-amber-500 decoration-2',
  },
  suggestion: {
    bg: 'bg-blue-100/50 dark:bg-blue-900/30',
    ring: 'ring-blue-400 dark:ring-blue-500',
    underline: 'underline decoration-dotted decoration-blue-400 dark:decoration-blue-500 decoration-2',
  },
  strength: {
    bg: 'bg-green-100/50 dark:bg-green-900/30',
    ring: 'ring-green-400 dark:ring-green-500',
    underline: 'underline decoration-solid decoration-green-400 dark:decoration-green-500 decoration-2',
  },
};

export const AnnotationHighlight: React.FC<AnnotationHighlightProps> = ({
  segment,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const severity = segment.dominantSeverity ?? 'suggestion';
  const styles = SEVERITY_STYLES[severity];
  const primaryAnnotation = segment.annotations[0];

  const span = (
    <span
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        'cursor-pointer rounded-sm px-0.5 -mx-0.5 transition-all duration-150 underline-offset-4',
        styles.underline,
        styles.bg,
        isSelected && `ring-2 ${styles.ring}`,
        isHovered && !isSelected && 'brightness-95 dark:brightness-110',
      )}
    >
      {segment.text}
    </span>
  );

  if (!primaryAnnotation) return span;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{span}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          <p className="line-clamp-2">{primaryAnnotation.insight}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
