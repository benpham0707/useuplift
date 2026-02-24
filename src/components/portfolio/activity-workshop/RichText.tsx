/**
 * RichText — Utility components for rendering multi-paragraph pipeline content.
 *
 * ParagraphText: Splits \n\n-delimited strings into proper <p> tags with spacing.
 * CollapsibleText: Shows first N lines with "Show more" toggle, using ParagraphText internally.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

// ============================================================================
// ParagraphText — splits on \n\n, renders each chunk as <p>
// ============================================================================

interface ParagraphTextProps {
  text: string;
  className?: string;
}

export function ParagraphText({ text, className = '' }: ParagraphTextProps) {
  if (!text) return null;

  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  if (paragraphs.length <= 1) {
    return <p className={`leading-relaxed ${className}`}>{text}</p>;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {paragraphs.map((para, i) => (
        <p key={i} className="leading-relaxed">
          {para.trim()}
        </p>
      ))}
    </div>
  );
}

// ============================================================================
// CollapsibleText — shows first N lines with "Show more" toggle
// ============================================================================

interface CollapsibleTextProps {
  text: string;
  /** Number of paragraphs to show in preview (default: 2) */
  previewParagraphs?: number;
  className?: string;
}

export function CollapsibleText({
  text,
  previewParagraphs = 2,
  className = '',
}: CollapsibleTextProps) {
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const paragraphs = useMemo(
    () => text.split(/\n\n+/).filter((p) => p.trim().length > 0),
    [text],
  );

  const needsCollapse = paragraphs.length > previewParagraphs;
  const visibleParagraphs = expanded || !needsCollapse
    ? paragraphs
    : paragraphs.slice(0, previewParagraphs);

  return (
    <div className={className}>
      <div className="space-y-2">
        {visibleParagraphs.map((para, i) => (
          <p key={i} className="leading-relaxed">
            {para.trim()}
          </p>
        ))}
      </div>

      {needsCollapse && (
        <button
          type="button"
          onClick={toggle}
          className="flex items-center gap-1 mt-2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
          {expanded
            ? 'Show less'
            : `Show ${paragraphs.length - previewParagraphs} more paragraph${paragraphs.length - previewParagraphs !== 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
}
