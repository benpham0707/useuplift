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
  // Multi-paragraph content needs scrolling
  const hasRichContent = item.whyItMatters.includes('\n\n') || item.psychology || item.research;

  return (
    <div className={`space-y-4 ${hasRichContent ? 'max-h-[400px] overflow-y-auto pr-1' : ''}`}>
      {/* Why This Matters — quote-styled box with emerald accent */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Lightbulb className="h-3 w-3 text-emerald-500" />
          Why This Matters
        </p>
        <div className="border-l-2 border-emerald-500/40 pl-3 py-1.5 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] rounded-r-md">
          <CollapsibleText
            text={item.whyItMatters}
            previewParagraphs={2}
            className="text-[13px] text-foreground/85"
          />
        </div>
      </div>

      {/* Admissions Psychology — conditional subsection */}
      {item.psychology && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Brain className="h-3 w-3 text-purple-500" />
            Admissions Psychology
          </p>
          <div className="border-l-2 border-purple-500/30 pl-3 py-1.5 bg-purple-500/[0.03] dark:bg-purple-500/[0.05] rounded-r-md">
            <CollapsibleText
              text={item.psychology}
              previewParagraphs={2}
              className="text-xs text-foreground/80"
            />
          </div>
        </div>
      )}

      {/* Research Evidence — conditional subsection */}
      {item.research && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <FlaskConical className="h-3 w-3 text-blue-500" />
            Research Evidence
          </p>
          <div className="bg-blue-50/30 dark:bg-blue-950/15 rounded-md px-3 py-2">
            <ParagraphText text={item.research} className="text-xs text-foreground/80" />
          </div>
        </div>
      )}

      {/* How to Leverage — subtle background differentiation */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <BookOpen className="h-3 w-3 text-blue-500" />
          How to Leverage
        </p>
        <div className="bg-muted/30 dark:bg-muted/20 rounded-md px-3 py-2">
          <ParagraphText text={item.howToLeverage} className="text-[13px] text-foreground/80" />
        </div>
      </div>

      {/* Expert Insight — conditional, special callout */}
      {item.quote && (
        <div className="flex gap-2 items-start pt-0.5">
          <Quote className="h-3.5 w-3.5 text-amber-500/70 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-foreground/70 italic leading-relaxed">
              {item.quote}
            </p>
            {item.quoteSource && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                &mdash; {item.quoteSource}
              </p>
            )}
          </div>
        </div>
      )}

      {/* In Applications — multi-paragraph rendering */}
      {item.inApplications && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            In Your Applications
          </p>
          <div className="bg-muted/20 rounded-md px-3 py-2">
            <CollapsibleText
              text={item.inApplications}
              previewParagraphs={2}
              className="text-xs text-foreground/80"
            />
          </div>
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

export function WhatsWorking({ greenFlags, strengthTeaching = [], accentColor }: WhatsWorkingProps) {
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
    <div className="space-y-3">
      {/* Section header */}
      <div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What&rsquo;s Working
          </h3>
          <span className="text-[10px] text-muted-foreground/60 font-medium">
            ({hasTeaching ? total : greenFlags.length} strength
            {(hasTeaching ? total : greenFlags.length) !== 1 ? 's' : ''})
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5 pl-6">
          {hasTeaching
            ? 'Deep coaching on your strongest signals'
            : 'What admissions officers notice'}
        </p>
      </div>

      {/* Carousel (rich) or fallback (shallow) */}
      {hasTeaching ? (
        <div className="rounded-lg border bg-card overflow-hidden">
          {/* Carousel header: navigation + title */}
          <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
            {total > 1 && (
              <button
                type="button"
                onClick={goPrev}
                className="p-1 -ml-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                aria-label="Previous strength"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold truncate">
                {items[activeIndex].strength}
              </h4>
            </div>

            {total > 1 && (
              <>
                <span className="text-[10px] text-muted-foreground font-medium tabular-nums flex-shrink-0">
                  {activeIndex + 1} of {total}
                </span>
                <button
                  type="button"
                  onClick={goNext}
                  className="p-1 -mr-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                  aria-label="Next strength"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Carousel body — clip overflow, transition content */}
          <div className="relative px-4 pb-4 overflow-hidden">
            <div
              key={activeIndex}
              className="animate-in fade-in slide-in-from-right-2 duration-200"
            >
              <StrengthCarouselCard item={items[activeIndex]} />
            </div>
          </div>

          {/* Dot indicators */}
          {total > 1 && (
            <div className="flex items-center justify-center gap-1.5 pb-3">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === activeIndex
                      ? 'w-4 h-1.5 bg-emerald-500'
                      : 'w-1.5 h-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/40'
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
