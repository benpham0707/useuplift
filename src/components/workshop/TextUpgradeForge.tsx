import React, { useState, useCallback } from "react";
import { motion } from "motion/react";
import { Copy, Check, ArrowDown, Sparkles } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { WorkshopData, Issue } from "@/types/workshop";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// SEVERITY COLOR MAP — crisp, non-muddy colors for light theme
// ============================================================================

const SEVERITY_STYLES = {
  high: {
    bg: "bg-red-100",
    bgActive: "bg-red-100",
    border: "border-red-400",
    borderIdle: "border-red-300",
    text: "text-red-950",
    underline: "decoration-red-400",
  },
  medium: {
    bg: "bg-yellow-100",
    bgActive: "bg-yellow-100",
    border: "border-yellow-400",
    borderIdle: "border-yellow-300",
    text: "text-yellow-950",
    underline: "decoration-yellow-400",
  },
  low: {
    bg: "bg-blue-100",
    bgActive: "bg-blue-100",
    border: "border-blue-400",
    borderIdle: "border-blue-300",
    text: "text-blue-950",
    underline: "decoration-blue-400",
  },
} as const;

function getSeverityStyle(severity: Issue["severity"]) {
  return SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.medium;
}

// ============================================================================
// COMPONENT
// ============================================================================

interface TextUpgradeForgeProps {
  data: WorkshopData;
  activeIssueId: string | null;
}

export const TextUpgradeForge: React.FC<TextUpgradeForgeProps> = ({ data, activeIssueId }) => {
  const [copied, setCopied] = useState(false);

  // ── Before text: severity-colored background highlights ──
  const renderBeforeText = (text: string) => {
    const ranges: { start: number; end: number; issue: typeof data.issues[number] }[] = [];
    for (const issue of data.issues) {
      const idx = text.indexOf(issue.highlightedText);
      if (idx !== -1) {
        ranges.push({ start: idx, end: idx + issue.highlightedText.length, issue });
      }
    }
    ranges.sort((a, b) => a.start - b.start);

    const elements: React.ReactNode[] = [];
    let cursor = 0;

    for (const range of ranges) {
      const isActive = activeIssueId === range.issue.id;
      const isDimmed = activeIssueId !== null && !isActive;
      const style = getSeverityStyle(range.issue.severity);

      if (cursor < range.start) {
        elements.push(
          <span
            key={`text-${cursor}`}
            className={cn(
              "transition-colors duration-200",
              isDimmed ? "text-foreground/40" : "text-foreground/70"
            )}
          >
            {text.slice(cursor, range.start)}
          </span>
        );
      }

      elements.push(
        <span
          key={`hl-${range.issue.id}`}
          className={cn(
            "px-1 py-0.5 rounded border transition-all duration-200",
            isActive
              ? `${style.bgActive} ${style.border} ${style.text} font-medium`
              : `${style.bg} ${style.borderIdle} ${style.text}`,
            isDimmed && "bg-transparent border-transparent text-foreground/40"
          )}
        >
          {text.slice(range.start, range.end)}
        </span>
      );

      cursor = range.end;
    }

    if (cursor < text.length) {
      const isDimmed = activeIssueId !== null;
      elements.push(
        <span
          key="text-tail"
          className={cn(
            "transition-colors duration-200",
            isDimmed ? "text-foreground/40" : "text-foreground/70"
          )}
        >
          {text.slice(cursor)}
        </span>
      );
    }

    return elements;
  };

  // ── Suggested text: severity-colored solid underlines ──
  const renderSuggestedText = (text: string) => {
    const ranges: { start: number; end: number; issue: typeof data.issues[number] }[] = [];
    for (const issue of data.issues) {
      if (!issue.suggestedChangePhrase) continue;
      const idx = text.indexOf(issue.suggestedChangePhrase);
      if (idx !== -1) {
        ranges.push({ start: idx, end: idx + issue.suggestedChangePhrase.length, issue });
      }
    }
    ranges.sort((a, b) => a.start - b.start);

    // Deduplicate overlapping ranges
    const merged: typeof ranges = [];
    for (const r of ranges) {
      if (merged.length && r.start < merged[merged.length - 1].end) continue;
      merged.push(r);
    }

    if (!merged.length) return <span>{text}</span>;

    const elements: React.ReactNode[] = [];
    let cursor = 0;

    for (const range of merged) {
      const isActive = activeIssueId === range.issue.id;
      const isDimmed = activeIssueId !== null && !isActive;
      const style = getSeverityStyle(range.issue.severity);

      if (cursor < range.start) {
        elements.push(
          <span key={`st-${cursor}`}>{text.slice(cursor, range.start)}</span>
        );
      }

      elements.push(
        <span
          key={`su-${range.issue.id}`}
          className={cn(
            "underline decoration-solid decoration-2 transition-all duration-200",
            style.underline,
            isActive && "font-semibold",
            isDimmed && "decoration-transparent"
          )}
        >
          {text.slice(range.start, range.end)}
        </span>
      );

      cursor = range.end;
    }

    if (cursor < text.length) {
      elements.push(<span key="st-tail">{text.slice(cursor)}</span>);
    }

    return elements;
  };

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(data.afterText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = data.afterText;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data.afterText]);

  const beforeOverLimit = data.beforeCharCount > 150;

  return (
    <div className="flex flex-col gap-0 relative w-full">
      {/* BEFORE */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Before
          </span>
          <span className="flex items-center gap-1.5 ml-1">
            <span className="w-8 h-1 rounded-full bg-muted overflow-hidden">
              <span
                className={cn(
                  "block h-full rounded-full",
                  beforeOverLimit ? "bg-red-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min((data.beforeCharCount / 150) * 100, 100)}%` }}
              />
            </span>
            <span className={cn(
              "text-[10px] font-medium tabular-nums",
              beforeOverLimit ? "text-red-500" : "text-muted-foreground"
            )}>
              {data.beforeCharCount}/150
            </span>
          </span>
        </div>
        <p className="text-[13px] leading-relaxed">
          {renderBeforeText(data.beforeText)}
        </p>
      </motion.div>

      {/* DIVIDER with arrow */}
      <div className="relative z-10 border-t border-border/60">
        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-border/60 rounded-full p-1.5">
          <ArrowDown className="w-3.5 h-3.5 text-muted-foreground/60" />
        </div>
      </div>

      {/* SUGGESTED */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="p-5 pt-3"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-cyan-600">
              <Sparkles className="w-3 h-3" />
              Suggested
            </span>
            <span className="flex items-center gap-1.5 ml-1">
              <span className="w-8 h-1 rounded-full bg-muted overflow-hidden">
                <span
                  className="block h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min((data.afterCharCount / 150) * 100, 100)}%` }}
                />
              </span>
              <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                {data.afterCharCount}/150
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={copyToClipboard}
            className={cn(
              "flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors duration-200",
              copied
                ? "bg-emerald-50 text-emerald-600"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {copied ? (
              <><Check className="w-3 h-3" />Copied</>
            ) : (
              <><Copy className="w-3 h-3" />Copy</>
            )}
          </button>
        </div>
        <p className="text-[13px] leading-relaxed text-foreground font-medium">
          {renderSuggestedText(data.afterText)}
        </p>
      </motion.div>
    </div>
  );
};
