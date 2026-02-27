import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { TextUpgradeForge } from "./TextUpgradeForge";
import { CritiqueAccordion } from "./CritiqueAccordion";
import { ScoreProjectionCard } from "./ScoreProjectionCard";
import type { WorkshopData } from "@/types/workshop";

// ============================================================================
// PROP TYPES — matches the real data shape from InsightDetailView
// ============================================================================

interface ImprovementIssue {
  issue: string;
  whyItMatters: string;
  howToFix: string;
  exampleBefore: string;
  exampleAfter: string;
  priority: string;
  references: Array<{ quotedText: string; type: string; label: string }>;
  [key: string]: unknown;
}

interface TransformationData {
  currentScore: number;
  rewrite: {
    original: string;
    suggested: string;
    characterCount: number;
    changesApplied: Array<{ element: string; original: string; transformed: string; rationale: string }>;
  };
  expectedScoreImprovement: {
    projectedScore: number;
    improvingComponents: string[];
    rationale: string;
  };
  [key: string]: unknown;
}

export interface ActivityWorkshopDescriptionProps {
  optimization: {
    original: string;
    optimized: string;
    originalCharCount: number;
    optimizedCharCount: number;
    changes: Array<{ change: string; reason?: string }>;
  };
  improvementTeaching?: ImprovementIssue[];
  accentColor: string;
  scoreProjection?: { projectedScore: number; improvingComponents: string[]; rationale: string } | null;
  transformation?: TransformationData | null;
}

// ============================================================================
// DATA ADAPTER — maps real pipeline data → WorkshopData for sub-components
// ============================================================================

/** Extract short quoted phrases from a text for inline highlighting. */
function extractQuotes(teaching: ImprovementIssue): string[] {
  const quotes: string[] = [];
  // Pull from references first (most accurate)
  if (teaching.references?.length) {
    for (const ref of teaching.references) {
      if (ref.quotedText && ref.quotedText.length > 3 && ref.quotedText.length < 80) {
        quotes.push(ref.quotedText);
      }
    }
  }
  // Fall back to exampleBefore if no quotes found
  if (quotes.length === 0 && teaching.exampleBefore) {
    quotes.push(teaching.exampleBefore);
  }
  return quotes;
}

function adaptToWorkshopData(props: ActivityWorkshopDescriptionProps): WorkshopData {
  const { optimization, improvementTeaching = [], scoreProjection, transformation } = props;

  const currentScore = transformation?.currentScore ?? 0;
  const projectedScore = scoreProjection?.projectedScore ?? currentScore;

  const issues = improvementTeaching.map((teaching, i) => ({
    id: `issue-${i}`,
    title: teaching.issue,
    description: {
      problem: teaching.whyItMatters || "",
      actionable: teaching.howToFix || "",
      quotes: extractQuotes(teaching),
    },
    severity: (teaching.priority?.toLowerCase() === "high" ? "high" : "medium") as "high" | "medium",
    highlightedText: teaching.exampleBefore || "",
  }));

  const totalGain = projectedScore - currentScore;
  const components = scoreProjection?.improvingComponents ?? [];
  const perDimGain = components.length > 0 ? totalGain / components.length : 0;
  const dimensions = components.map((name) => ({
    name,
    value: Math.round(perDimGain * 10) / 10,
  }));

  return {
    beforeText: optimization.original,
    afterText: optimization.optimized,
    beforeCharCount: optimization.originalCharCount,
    afterCharCount: optimization.optimizedCharCount,
    issues,
    score: {
      current: currentScore,
      projected: projectedScore,
      narrative: scoreProjection?.rationale ?? "",
      dimensions,
    },
  };
}

// ============================================================================
// MAIN COMPONENT — Diagnostic Console
// ============================================================================

function ActivityWorkshopDescriptionInner(props: ActivityWorkshopDescriptionProps) {
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const workshopData = useMemo(() => adaptToWorkshopData(props), [props]);

  const hasScore = workshopData.score.current > 0 || workshopData.score.projected > 0;
  const hasIssues = workshopData.issues.length > 0;

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col gap-0"
      >
        {/* ── Unified Diagnostic Console ── */}
        <div className="group relative flex flex-col rounded-xl border-2 border-border/80 bg-white overflow-hidden transition-colors duration-200 hover:border-purple-500/30">
          {/* Text Analysis (Before → Suggested) */}
          <TextUpgradeForge data={workshopData} activeIssueId={activeIssueId} />

          {/* Tether + Accordion */}
          {hasIssues && (
            <div className="relative">
              {/* Separator — horizontal line with rounded top corners curving into the outer border */}
              <div className="mx-[-2px] h-3 border-t-2 border-l-2 border-r-2 border-border/80 rounded-t-xl transition-colors duration-200 group-hover:border-purple-500/30" />
              <CritiqueAccordion issues={workshopData.issues} setActiveIssueId={setActiveIssueId} />
            </div>
          )}
        </div>

        {/* Score Projection — separate card below */}
        {hasScore && <ScoreProjectionCard scoreData={workshopData.score} />}
      </motion.div>
    </div>
  );
}

export const ActivityWorkshopDescription = React.memo(ActivityWorkshopDescriptionInner);
export default ActivityWorkshopDescription;
