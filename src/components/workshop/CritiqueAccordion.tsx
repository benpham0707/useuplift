import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Issue } from "@/types/workshop";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CritiqueAccordionProps {
  issues: Issue[];
  setActiveIssueId: (id: string | null) => void;
}

/**
 * Renders a text string with any matching `quotes` wrapped in an inline
 * code-style pill for scannability.
 */
function RichText({ text, quotes }: { text: string; quotes: string[] }) {
  if (!quotes.length || !text) {
    return <span>{text}</span>;
  }

  const ranges: { start: number; end: number; quote: string }[] = [];
  for (const q of quotes) {
    let searchFrom = 0;
    while (true) {
      const idx = text.indexOf(q, searchFrom);
      if (idx === -1) break;
      ranges.push({ start: idx, end: idx + q.length, quote: q });
      searchFrom = idx + q.length;
    }
  }
  ranges.sort((a, b) => a.start - b.start);

  const merged: typeof ranges = [];
  for (const r of ranges) {
    if (merged.length && r.start < merged[merged.length - 1].end) continue;
    merged.push(r);
  }

  if (!merged.length) return <span>{text}</span>;

  const elements: React.ReactNode[] = [];
  let cursor = 0;
  for (const r of merged) {
    if (cursor < r.start) {
      elements.push(<span key={`t-${cursor}`}>{text.slice(cursor, r.start)}</span>);
    }
    elements.push(
      <span
        key={`q-${r.start}`}
        className="bg-muted text-foreground font-mono text-[11px] px-1.5 py-0.5 rounded-md border border-border inline-block"
      >
        &ldquo;{r.quote}&rdquo;
      </span>
    );
    cursor = r.end;
  }
  if (cursor < text.length) {
    elements.push(<span key="tail">{text.slice(cursor)}</span>);
  }
  return <>{elements}</>;
}

/**
 * CritiqueAccordion — Expandable teaching points displayed on the tether line.
 *
 * The tether line is rendered per-item: each non-last item gets a vertical
 * segment that runs from its badge down to just before the next badge.
 * The last item has NO line below it — the tether terminates at its circle.
 */
export const CritiqueAccordion: React.FC<CritiqueAccordionProps> = ({ issues, setActiveIssueId }) => {
  const [expandedId, setExpandedId] = useState<string | null>(issues[0]?.id || null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="flex flex-col w-full py-2">
      {issues.map((issue, index) => {
        const isHigh = issue.severity === "high";
        const isExpanded = expandedId === issue.id;
        const isLast = index === issues.length - 1;

        return (
          <motion.div
            key={issue.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 + index * 0.06, type: "spring", stiffness: 140, damping: 20 }}
            onMouseEnter={() => setActiveIssueId(issue.id)}
            onMouseLeave={() => setActiveIssueId(null)}
            className="relative"
          >
            {/* ── Trigger Row ── */}
            <button
              onClick={() => toggleExpand(issue.id)}
              className="w-full flex items-center gap-0 text-left focus:outline-none group"
            >
              {/* Badge region — badge sits on the tether line */}
              <div className="relative flex-shrink-0 w-10 flex items-center justify-center self-stretch">
                {/*
                  Tether line segment: runs from top of this badge region to
                  bottom — but ONLY for non-last items. This means the line
                  connects badge N to badge N+1 but stops at the last circle.
                */}
                {!isLast && (
                  <div className="absolute left-[19px] top-1/2 bottom-0 w-px bg-border" />
                )}
                {/* Connecting segment from previous item — top half of non-first items */}
                {index > 0 && (
                  <div className="absolute left-[19px] top-0 bottom-1/2 w-px bg-border" />
                )}

                <div className={cn(
                  "relative z-10 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold border bg-white transition-colors duration-150",
                  isExpanded
                    ? isHigh ? "border-red-400 text-red-500" : "border-amber-400 text-amber-500"
                    : isHigh ? "border-red-300/60 text-red-400" : "border-amber-300/60 text-amber-400",
                  "group-hover:border-purple-400 group-hover:text-purple-500"
                )}>
                  {index + 1}
                </div>
              </div>

              {/* Title + severity */}
              <div className="flex-1 flex items-center justify-between py-2.5 pr-4 min-w-0">
                <span className="text-[13px] font-medium text-foreground truncate">{issue.title}</span>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded border",
                    isHigh
                      ? "text-red-600 border-red-500/25 bg-red-500/5"
                      : "text-amber-600 border-amber-500/25 bg-amber-500/5"
                  )}>
                    {isHigh ? "High" : "Medium"}
                  </span>
                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.15 }}>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </motion.div>
                </div>
              </div>
            </button>

            {/* ── Expanded Content ── */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 140, damping: 22 }}
                  className="relative"
                >
                  {/* Continue tether line through expanded content for non-last items */}
                  {!isLast && (
                    <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
                  )}

                  <div className="ml-10 mr-4 mb-3 rounded-lg bg-muted/30 border border-border/30 p-3.5 space-y-3">
                    {/* Why this matters */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                        Why this matters
                      </span>
                      <p className="text-[13px] leading-relaxed text-foreground/90">
                        <RichText text={issue.description.problem} quotes={issue.description.quotes} />
                      </p>
                    </div>

                    {/* How to fix it */}
                    {issue.description.actionable && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                          How to fix it
                        </span>
                        <p className="text-[13px] leading-relaxed text-foreground/90">
                          <RichText text={issue.description.actionable} quotes={issue.description.quotes} />
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};
