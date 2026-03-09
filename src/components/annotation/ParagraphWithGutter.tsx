/**
 * ParagraphWithGutter — essay paragraph with a gutter dot showing annotation density.
 *
 * The gutter dot color reflects the highest severity annotation in the paragraph.
 * Hovering the dot shows annotation count details.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import type { ParagraphInfo, AnnotationSeverity } from './types';

interface ParagraphWithGutterProps {
  paragraph: ParagraphInfo;
  children: React.ReactNode;
}

function getDominantSeverity(counts: Record<AnnotationSeverity, number>): AnnotationSeverity | null {
  if (counts.critical > 0) return 'critical';
  if (counts.important > 0) return 'important';
  if (counts.suggestion > 0) return 'suggestion';
  if (counts.strength > 0) return 'strength';
  return null;
}

const DOT_COLORS: Record<AnnotationSeverity, string> = {
  critical: 'bg-red-500',
  important: 'bg-amber-500',
  suggestion: 'bg-blue-400',
  strength: 'bg-green-500',
};

export const ParagraphWithGutter: React.FC<ParagraphWithGutterProps> = ({
  paragraph,
  children,
}) => {
  const dominant = getDominantSeverity(paragraph.severityCounts);

  return (
    <div className="flex gap-3 group">
      {/* Gutter */}
      <div className="flex-shrink-0 w-4 pt-1.5 flex justify-center">
        {dominant && paragraph.annotationCount > 0 ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'block w-2 h-2 rounded-full transition-transform',
                    DOT_COLORS[dominant],
                    'group-hover:scale-125',
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                {paragraph.annotationCount} annotation{paragraph.annotationCount !== 1 ? 's' : ''}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="block w-2 h-2" />
        )}
      </div>

      {/* Paragraph text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-relaxed text-foreground/90">
          {children}
        </p>
      </div>
    </div>
  );
};
