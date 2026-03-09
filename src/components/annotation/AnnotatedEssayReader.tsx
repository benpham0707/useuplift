/**
 * AnnotatedEssayReader — non-editable essay display with colored highlights.
 *
 * Renders paragraph by paragraph using ParagraphWithGutter.
 * Each paragraph contains text segments: plain spans for non-annotated text,
 * AnnotationHighlight spans for annotated regions.
 */

import React, { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TextSegment, ParagraphInfo } from './types';
import { AnnotationHighlight } from './AnnotationHighlight';
import { ParagraphWithGutter } from './ParagraphWithGutter';

interface AnnotatedEssayReaderProps {
  text: string;
  segments: TextSegment[];
  paragraphs: ParagraphInfo[];
  selectedAnnotationId: string | null;
  hoveredAnnotationId: string | null;
  onAnnotationClick: (id: string) => void;
  onAnnotationHover: (id: string | null) => void;
}

/**
 * Group text segments by paragraph.
 * Each paragraph's segments are the subset of global segments
 * whose character range falls within the paragraph's offset range.
 */
function groupSegmentsByParagraph(
  segments: TextSegment[],
  paragraphs: ParagraphInfo[],
): Map<number, TextSegment[]> {
  const map = new Map<number, TextSegment[]>();
  for (const para of paragraphs) {
    map.set(para.index, []);
  }

  for (const seg of segments) {
    for (const para of paragraphs) {
      if (seg.start < para.endOffset && seg.end > para.startOffset) {
        const list = map.get(para.index);
        if (list) {
          // Clamp segment to paragraph boundaries
          const clampedStart = Math.max(seg.start, para.startOffset);
          const clampedEnd = Math.min(seg.end, para.endOffset);
          const clampedText = seg.text.slice(
            clampedStart - seg.start,
            clampedEnd - seg.start,
          );
          if (clampedText.length > 0) {
            list.push({
              ...seg,
              text: clampedText,
              start: clampedStart,
              end: clampedEnd,
            });
          }
        }
      }
    }
  }

  return map;
}

export const AnnotatedEssayReader: React.FC<AnnotatedEssayReaderProps> = ({
  segments,
  paragraphs,
  selectedAnnotationId,
  hoveredAnnotationId,
  onAnnotationClick,
  onAnnotationHover,
}) => {
  const segmentsByParagraph = useMemo(
    () => groupSegmentsByParagraph(segments, paragraphs),
    [segments, paragraphs],
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-2">
        {paragraphs.map((para) => {
          const paraSegments = segmentsByParagraph.get(para.index) ?? [];

          return (
            <ParagraphWithGutter key={para.index} paragraph={para}>
              {paraSegments.map((seg, i) => {
                if (seg.annotations.length === 0) {
                  return <span key={`${seg.start}-${i}`}>{seg.text}</span>;
                }

                const primaryId = seg.annotations[0].id;
                const isSelected = seg.annotations.some((a) => a.id === selectedAnnotationId);
                const isHovered = seg.annotations.some((a) => a.id === hoveredAnnotationId);

                return (
                  <AnnotationHighlight
                    key={`${seg.start}-${i}`}
                    segment={seg}
                    isSelected={isSelected}
                    isHovered={isHovered}
                    onClick={() => onAnnotationClick(primaryId)}
                    onMouseEnter={() => onAnnotationHover(primaryId)}
                    onMouseLeave={() => onAnnotationHover(null)}
                  />
                );
              })}
            </ParagraphWithGutter>
          );
        })}
      </div>
    </ScrollArea>
  );
};
