/**
 * WhatsWorking — Rich strength teaching carousel.
 *
 * Displays Stage 2 strengthTeaching data in a one-at-a-time carousel
 * so students see full coaching (whyItMatters, howToLeverage, expert quotes)
 * without overcrowding. Falls back to shallow Stage 1 greenFlags when
 * teaching data isn't available.
 */
import React, { useState, useCallback } from 'react';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Quote,
  Lightbulb,
  Brain,
  FlaskConical,
} from 'lucide-react';
import { ParagraphText, CollapsibleText } from '../RichText';

// ============================================================================
// TYPES
// ============================================================================

export interface WhatsWorkingProps {
  greenFlags: Array<{
    flag: string;
    strength: string;
    evidence: string;
    admissionsValue: string;
  }>;
  strengthTeaching?: Array<{
    strength: string;
    whyItMatters: string;
    psychology?: string;
    research?: string;
    quote?: string;
    quoteSource?: string;
    howToLeverage: string;
    inApplications: string;
    references: Array<{ quotedText: string; type: string; label: string }>;
  }>;
  accentColor: string;
}

// ============================================================================
// CAROUSEL CARD — Rich strength teaching
// ============================================================================

function StrengthCarouselCard({
  item,
}: {
  item: NonNullable<WhatsWorkingProps['strengthTeaching']>[number];
}) {
  const hasRichContent = item.whyItMatters.includes('\n\n') || item.psychology || item.research;

  return (
    <div className={`space-y-3 ${hasRichContent ? 'max-h-[350px] overflow-y-auto pr-1' : ''}`}>
      {/* Why This Matters */}
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
          <Lightbulb className="h-2.5 w-2.5 text-emerald-500" />
          Why This Matters
        </p>
        <div className="border-l-2 border-emerald-500/30 pl-2.5 py-1">
          <CollapsibleText
            text={item.whyItMatters}
            previewParagraphs={2}
            className="text-xs text-foreground/80"
          />
        </div>
      </div>

      {/* Admissions Psychology */}
      {item.psychology && (
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
            <Brain className="h-2.5 w-2.5 text-purple-500" />
            Admissions Psychology
          </p>
          <div className="border-l-2 border-purple-500/20 pl-2.5 py-1">
            <CollapsibleText
              text={item.psychology}
              previewParagraphs={2}
              className="text-[11px] text-foreground/75"
            />
          </div>
        </div>
      )}

      {/* Research Evidence */}
      {item.research && (
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
            <FlaskConical className="h-2.5 w-2.5 text-blue-500" />
            Research
          </p>
          <ParagraphText text={item.research} className="text-[11px] text-foreground/70 pl-2.5" />
        </div>
      )}

      {/* How to Leverage */}
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
          <BookOpen className="h-2.5 w-2.5 text-blue-500" />
          How to Leverage
        </p>
        <div className="bg-muted/20 rounded-md px-2.5 py-1.5">
          <ParagraphText text={item.howToLeverage} className="text-xs text-foreground/75" />
        </div>
      </div>

      {/* Expert quote — inline */}
      {item.quote && (
        <div className="flex gap-1.5 items-start">
          <Quote className="h-3 w-3 text-amber-500/60 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-foreground/60 italic leading-snug">
            {item.quote}
            {item.quoteSource && (
              <span className="text-muted-foreground/50 not-italic"> — {item.quoteSource}</span>
            )}
          </p>
        </div>
      )}

      {/* In Applications */}
      {item.inApplications && (
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            In Your Applications
          </p>
          <CollapsibleText
            text={item.inApplications}
            previewParagraphs={2}
            className="text-[11px] text-foreground/70 pl-2.5"
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FALLBACK — Shallow green flags (Stage 1 data only)
// ============================================================================

function ShallowStrengthList({
  greenFlags,
}: {
  greenFlags: WhatsWorkingProps['greenFlags'];
}) {
  return (
    <div className="space-y-2">
      {greenFlags.map((flag, i) => (
        <div
          key={`${flag.flag}-${i}`}
          className="flex items-start gap-2.5 rounded-md border bg-card px-3 py-2.5"
        >
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{flag.flag}</p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
              {flag.admissionsValue}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function WhatsWorkingInner({ greenFlags, strengthTeaching = [], accentColor }: WhatsWorkingProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const hasTeaching = strengthTeaching.length > 0;
  const items = strengthTeaching;
  const total = items.length;

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Empty state
  if (greenFlags.length === 0 && !hasTeaching) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What&rsquo;s Working
          </h3>
        </div>
        <div className="rounded-lg border bg-card p-6 text-center">
          <Sparkles className="h-5 w-5 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            Keep building your activity profile — strengths will appear here as you add detail.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Section header — compact */}
      <div className="flex items-center gap-1.5">
        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          What&rsquo;s Working
        </h3>
        <span className="text-[10px] text-muted-foreground/50">
          ({hasTeaching ? total : greenFlags.length})
        </span>
        <p className="text-[10px] text-muted-foreground/40 ml-auto">
          {hasTeaching ? 'Deep coaching' : 'Admissions signals'}
        </p>
      </div>

      {/* Carousel or fallback */}
      {hasTeaching ? (
        <div className="rounded-lg border bg-card overflow-hidden">
          {/* Carousel header */}
          <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
            {total > 1 && (
              <button
                type="button"
                onClick={goPrev}
                className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Previous strength"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            )}
            <h4 className="flex-1 min-w-0 text-xs font-semibold truncate">
              {items[activeIndex].strength}
            </h4>
            {total > 1 && (
              <>
                <span className="text-[9px] text-muted-foreground/50 tabular-nums">
                  {activeIndex + 1}/{total}
                </span>
                <button
                  type="button"
                  onClick={goNext}
                  className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Next strength"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Carousel body */}
          <div className="relative px-3 pb-3 overflow-hidden">
            <div key={activeIndex} className="animate-in fade-in slide-in-from-right-2 duration-200">
              <StrengthCarouselCard item={items[activeIndex]} />
            </div>
          </div>

          {/* Dot indicators */}
          {total > 1 && (
            <div className="flex items-center justify-center gap-1 pb-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === activeIndex
                      ? 'w-3 h-1 bg-emerald-500'
                      : 'w-1 h-1 bg-muted-foreground/20 hover:bg-muted-foreground/35'
                  }`}
                  aria-label={`Go to strength ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <ShallowStrengthList greenFlags={greenFlags} />
      )}
    </div>
  );
}

export const WhatsWorking = React.memo(WhatsWorkingInner);
