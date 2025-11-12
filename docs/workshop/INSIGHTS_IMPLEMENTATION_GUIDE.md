# Insights & Analysis System - Implementation Guide

**Companion to**: INSIGHTS_ANALYSIS_SYSTEM_DESIGN.md
**Version**: 1.0.0
**Last Updated**: 2025-11-12

---

## Quick Start

This guide provides step-by-step implementation instructions for the Insights & Analysis System. It assumes you've read the design document and understand the architecture.

---

## Phase 1: Type Definitions & Core Data Structures

### Step 1.1: Create Insight Types

Create `/src/services/workshop/insightTypes.ts`:

```typescript
import { RubricCategory } from '@/components/portfolio/extracurricular/workshop/backendTypes';

/**
 * Core insight card representing a single issue
 */
export interface InsightCard {
  // Identification
  id: string;
  dimension: RubricCategory;
  severity: 'critical' | 'major' | 'minor';

  // Problem statement
  title: string; // e.g., "Manufactured Phrases Weaken Voice"
  summary: string; // One-line explanation

  // Technical analysis
  technical: {
    whatWeDetected: string; // Specific patterns found
    fromYourDraft: string[]; // Quoted excerpts (2-4 quotes)
    whyThisMatters: string; // Impact on reader/admissions
    pointImpact: string; // e.g., "-5 to -8 points"
  };

  // Comparative learning
  examples: {
    weak: InsightExample;
    strong: InsightExample;
  };

  // Solution guidance
  solutions: {
    approaches: SolutionApproach[];
    principles: string[]; // Transferable lessons
    difficulty: 'easy' | 'moderate' | 'challenging';
    estimatedTime: string; // e.g., "10-15 minutes"
  };

  // Chat integration
  chatRouting: {
    prefilledPrompt: string; // What to ask the AI coach
    contextData: Record<string, any>; // Additional context for chat
    suggestedFollowUps: string[]; // Related questions
  };

  // UI state
  isExpanded?: boolean;
  isCompleted?: boolean;
}

export interface InsightExample {
  text: string;
  score: number; // 0-10
  annotations: string[]; // What to notice
}

export interface SolutionApproach {
  name: string;
  description: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  estimatedTime: string;
  estimatedImpact: string; // e.g., "+2 to +3 points"
  steps?: string[]; // Optional step-by-step instructions
}

/**
 * Dimension summary grouping all issues for one rubric dimension
 */
export interface DimensionSummary {
  dimension: RubricCategory;
  name: string; // Display name
  description: string; // What this dimension measures
  score: number; // 0-10
  weight: number; // Percentage (0-1)
  status: 'critical' | 'needs_work' | 'good' | 'excellent';

  // Issue breakdown
  issueCount: {
    critical: number;
    major: number;
    minor: number;
    total: number;
  };

  // Potential improvement
  potentialGain: {
    min: number;
    max: number;
    display: string; // e.g., "+6 to +8 points"
  };

  // All insights for this dimension
  insights: InsightCard[];

  // UI state
  isExpanded: boolean;
}

/**
 * Overall insights state
 */
export interface InsightsState {
  // Score overview
  currentNQI: number;
  targetNQI: number;
  potentialGain: number;

  // Dimension summaries
  dimensions: DimensionSummary[];

  // All insights (flat list for filtering/sorting)
  allInsights: InsightCard[];

  // Filters
  filters: {
    severity: 'all' | 'critical' | 'major' | 'minor';
    dimension: RubricCategory | 'all';
    status: 'all' | 'not_started' | 'completed';
  };

  // Sort
  sortBy: 'priority' | 'score' | 'dimension' | 'impact';

  // UI state
  selectedInsight: InsightCard | null;
  showDetailView: boolean;
}
```

### Step 1.2: Create Pattern Detection Types

Create `/src/services/workshop/issuePatterns.ts`:

```typescript
import { RubricCategory } from '@/components/portfolio/extracurricular/workshop/backendTypes';

/**
 * Pattern definition for detecting issues in draft
 */
export interface IssuePattern {
  name: string;
  regex: RegExp;
  severity: 'critical' | 'major' | 'minor';
  explanation: string;
  dimension: RubricCategory;
}

/**
 * Example for teaching (weak vs strong)
 */
export interface TeachingExample {
  text: string;
  score: number; // 0-10
  annotations: string[]; // Key points to notice
  techniques?: string[]; // For strong examples
  problems?: string[]; // For weak examples
}

export interface ExampleSet {
  weak: TeachingExample[];
  strong: TeachingExample[];
}

/**
 * Complete pattern database
 */
export const ISSUE_PATTERNS: Record<RubricCategory, IssuePattern[]> = {
  voice_integrity: [
    {
      name: 'Manufactured Phrases',
      regex: /\b(countless|numerous|various|valuable|rewarding|meaningful|intense|significant)\b/gi,
      severity: 'critical',
      explanation: 'Generic intensifiers that replace specific details',
      dimension: 'voice_integrity',
    },
    {
      name: 'Hedge Words',
      regex: /\b(sort of|kind of|somewhat|rather|quite|fairly|pretty much)\b/gi,
      severity: 'major',
      explanation: 'Weak qualifiers that undermine confidence',
      dimension: 'voice_integrity',
    },
    {
      name: 'College Essay Clichés',
      regex: /\b(passion|journey|rewarding experience|valuable learning|important skills)\b/gi,
      severity: 'major',
      explanation: 'Overused phrases that signal generic writing',
      dimension: 'voice_integrity',
    },
  ],

  specificity_evidence: [
    {
      name: 'Vague Quantifiers',
      regex: /\b(many|some|several|few|lots of|plenty of|a lot of)\b/gi,
      severity: 'major',
      explanation: 'Imprecise quantities instead of specific numbers',
      dimension: 'specificity_evidence',
    },
  ],

  role_clarity_ownership: [
    {
      name: 'Passive Voice',
      regex: /\b(was|were|been|being) \w+ed\b/gi,
      severity: 'major',
      explanation: 'Passive constructions hide agency',
      dimension: 'role_clarity_ownership',
    },
  ],

  narrative_arc_stakes: [
    {
      name: 'Generic Conflict',
      regex: /\b(was challenging|was difficult|faced obstacles|overcame challenges)\b/gi,
      severity: 'major',
      explanation: 'Generic conflict statements without specifics',
      dimension: 'narrative_arc_stakes',
    },
  ],

  // ... Add patterns for remaining 7 dimensions
};

/**
 * Teaching examples database
 */
export const TEACHING_EXAMPLES: Record<RubricCategory, ExampleSet> = {
  voice_integrity: {
    weak: [
      {
        text: "I spent countless hours working on the project. It was a valuable learning experience that taught me important leadership skills.",
        score: 3,
        annotations: [
          "Manufactured phrase: 'countless hours'",
          "Cliché: 'valuable learning experience'",
          "Vague outcome: 'important leadership skills'",
        ],
        problems: [
          "No specific time commitment",
          "Generic conclusion",
          "Tells rather than shows",
        ],
      },
    ],
    strong: [
      {
        text: "Tuesday and Thursday nights, 7pm to midnight, I coded the platform's backend. When the database crashed three days before launch, I learned that good leaders don't panic - they debug methodically, line by line.",
        score: 9,
        annotations: [
          "Specific schedule: Tuesday/Thursday 7pm-midnight",
          "Concrete crisis: database crash",
          "Philosophical insight: leaders debug methodically",
        ],
        techniques: [
          "Numeric specificity",
          "Crisis moment",
          "Universal insight",
          "Active voice",
        ],
      },
    ],
  },

  // ... Add examples for remaining 10 dimensions
};
```

---

## Phase 2: Transformation Pipeline

### Step 2.1: Create Insight Transformer

Create `/src/services/workshop/insightTransformer.ts`:

```typescript
import { CoachingIssue, AnalysisResult } from '@/components/portfolio/extracurricular/workshop/backendTypes';
import { InsightCard, DimensionSummary, InsightsState } from './insightTypes';
import { ISSUE_PATTERNS, TEACHING_EXAMPLES } from './issuePatterns';

/**
 * Main transformation function: Backend CoachingIssue → InsightCard
 */
export function transformIssueToInsight(
  issue: CoachingIssue,
  draft: string,
  analysis: AnalysisResult
): InsightCard {
  return {
    id: issue.id,
    dimension: issue.category,
    severity: issue.severity,
    title: issue.title,
    summary: issue.problem,

    technical: {
      whatWeDetected: generateDetectionSummary(issue, draft),
      fromYourDraft: extractQuotesFromDraft(issue, draft),
      whyThisMatters: issue.why_it_matters,
      pointImpact: issue.suggested_fixes[0]?.impact_estimate || 'Impact unknown',
    },

    examples: {
      weak: findWeakExample(issue),
      strong: findStrongExample(issue),
    },

    solutions: {
      approaches: generateSolutionApproaches(issue),
      principles: extractPrinciples(issue),
      difficulty: estimateOverallDifficulty(issue),
      estimatedTime: estimateOverallTime(issue),
    },

    chatRouting: {
      prefilledPrompt: generateChatPrompt(issue),
      contextData: {
        issueId: issue.id,
        dimension: issue.category,
        severity: issue.severity,
      },
      suggestedFollowUps: generateFollowUpQuestions(issue),
    },

    isExpanded: false,
    isCompleted: false,
  };
}

/**
 * Generate "What We Detected" summary
 */
function generateDetectionSummary(issue: CoachingIssue, draft: string): string {
  const patterns = ISSUE_PATTERNS[issue.category] || [];
  const matchingPattern = patterns.find(p => issue.title.includes(p.name));

  if (!matchingPattern) {
    return issue.problem;
  }

  // Count matches
  const matches = draft.match(matchingPattern.regex);
  const count = matches ? matches.length : 0;

  if (count === 0) {
    return issue.problem;
  }

  // Build summary
  return `Your essay contains ${count} instance${count !== 1 ? 's' : ''} of ${matchingPattern.explanation}. ${issue.problem}`;
}

/**
 * Extract relevant quotes from draft
 */
function extractQuotesFromDraft(issue: CoachingIssue, draft: string): string[] {
  const quotes: string[] = [];

  // If issue has from_draft field, use it
  if (issue.from_draft) {
    quotes.push(issue.from_draft);
  }

  // Find pattern matches
  const patterns = ISSUE_PATTERNS[issue.category] || [];
  const matchingPattern = patterns.find(p => issue.title.includes(p.name));

  if (matchingPattern) {
    const sentences = draft.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const matchingSentences = sentences.filter(sentence =>
      matchingPattern.regex.test(sentence)
    );

    // Add up to 3 matching sentences
    quotes.push(...matchingSentences.slice(0, 3).map(s => s.trim()));
  }

  // If still no quotes, extract context around issue
  if (quotes.length === 0 && issue.from_draft) {
    const index = draft.indexOf(issue.from_draft);
    if (index !== -1) {
      const start = Math.max(0, index - 50);
      const end = Math.min(draft.length, index + issue.from_draft.length + 50);
      quotes.push(draft.substring(start, end).trim());
    }
  }

  return quotes.slice(0, 4); // Max 4 quotes
}

/**
 * Find weak example for comparison
 */
function findWeakExample(issue: CoachingIssue): InsightExample {
  const examples = TEACHING_EXAMPLES[issue.category];
  if (!examples || examples.weak.length === 0) {
    return {
      text: 'Example not available',
      score: 3,
      annotations: [],
    };
  }

  // Find example that matches issue
  const matchingExample = examples.weak.find(ex =>
    ex.annotations.some(ann => ann.toLowerCase().includes(issue.title.toLowerCase()))
  );

  const example = matchingExample || examples.weak[0];

  return {
    text: example.text,
    score: example.score,
    annotations: example.problems || example.annotations,
  };
}

/**
 * Find strong example for comparison
 */
function findStrongExample(issue: CoachingIssue): InsightExample {
  const examples = TEACHING_EXAMPLES[issue.category];
  if (!examples || examples.strong.length === 0) {
    return {
      text: 'Example not available',
      score: 9,
      annotations: [],
    };
  }

  const example = examples.strong[0];

  return {
    text: example.text,
    score: example.score,
    annotations: example.techniques || example.annotations,
  };
}

/**
 * Generate solution approaches from suggested fixes
 */
function generateSolutionApproaches(issue: CoachingIssue): SolutionApproach[] {
  return issue.suggested_fixes.map((fix, index) => ({
    name: `Approach ${index + 1}`,
    description: fix.rationale,
    difficulty: estimateDifficulty(fix),
    estimatedTime: estimateTimeForFix(fix),
    estimatedImpact: fix.impact_estimate,
  }));
}

/**
 * Extract transferable principles
 */
function extractPrinciples(issue: CoachingIssue): string[] {
  const principles: string[] = [];

  // Extract from issue title and problem
  if (issue.title.includes('Specificity')) {
    principles.push('Replace vague language with concrete details');
  }
  if (issue.title.includes('Passive')) {
    principles.push('Use active voice to show agency');
  }
  if (issue.title.includes('Quantified')) {
    principles.push('Anchor claims with numbers');
  }
  // ... add more pattern matching

  return principles;
}

/**
 * Estimate overall difficulty
 */
function estimateOverallDifficulty(issue: CoachingIssue): 'easy' | 'moderate' | 'challenging' {
  if (issue.severity === 'critical') return 'challenging';
  if (issue.severity === 'major') return 'moderate';
  return 'easy';
}

/**
 * Estimate overall time
 */
function estimateOverallTime(issue: CoachingIssue): string {
  if (issue.severity === 'critical') return '20-30 minutes';
  if (issue.severity === 'major') return '10-20 minutes';
  return '5-10 minutes';
}

/**
 * Estimate difficulty for single fix
 */
function estimateDifficulty(fix: any): 'easy' | 'moderate' | 'challenging' {
  if (fix.type === 'replace') return 'easy';
  if (fix.type === 'insert_before' || fix.type === 'insert_after') return 'moderate';
  return 'challenging'; // rewrite
}

/**
 * Estimate time for single fix
 */
function estimateTimeForFix(fix: any): string {
  if (fix.type === 'replace') return '5 minutes';
  if (fix.type === 'insert_before' || fix.type === 'insert_after') return '10-15 minutes';
  return '20-25 minutes'; // rewrite
}

/**
 * Generate pre-filled chat prompt
 */
function generateChatPrompt(issue: CoachingIssue): string {
  const templates = {
    critical: `Help me fix the ${issue.title.toLowerCase()}. This is critical for my essay. Can you walk me through exactly what to change?`,
    major: `I want to improve ${issue.category.replace(/_/g, ' ')}. The analysis says ${issue.problem.toLowerCase()}. How should I approach this?`,
    minor: `I'd like to polish ${issue.category.replace(/_/g, ' ')}. ${issue.problem} What's the best way to fix this?`,
  };

  return templates[issue.severity];
}

/**
 * Generate follow-up questions
 */
function generateFollowUpQuestions(issue: CoachingIssue): string[] {
  return [
    `Show me exactly which parts of my draft to change`,
    `Walk me through rewriting this step by step`,
    `Give me 3 different ways to fix this issue`,
    `How did successful essays handle this?`,
  ];
}

/**
 * Group insights by dimension
 */
export function groupInsightsByDimension(
  insights: InsightCard[],
  analysis: AnalysisResult
): DimensionSummary[] {
  // Get unique dimensions
  const dimensions = Array.from(new Set(insights.map(i => i.dimension)));

  return dimensions.map(dimension => {
    const dimensionInsights = insights.filter(i => i.dimension === dimension);
    const categoryScore = analysis.report.categories.find(c =>
      c.name.toLowerCase().includes(dimension.replace(/_/g, ' '))
    );

    // Count by severity
    const critical = dimensionInsights.filter(i => i.severity === 'critical').length;
    const major = dimensionInsights.filter(i => i.severity === 'major').length;
    const minor = dimensionInsights.filter(i => i.severity === 'minor').length;

    // Calculate potential gain
    const minGain = dimensionInsights.reduce((sum, i) => {
      const match = i.technical.pointImpact.match(/\+?(\d+)/);
      return sum + (match ? parseInt(match[1]) : 0);
    }, 0);
    const maxGain = dimensionInsights.reduce((sum, i) => {
      const match = i.technical.pointImpact.match(/to \+?(\d+)/);
      return sum + (match ? parseInt(match[1]) : minGain / dimensionInsights.length);
    }, 0);

    return {
      dimension,
      name: formatDimensionName(dimension),
      description: getDimensionDescription(dimension),
      score: categoryScore?.score_0_to_10 || 0,
      weight: categoryScore?.weight || 0,
      status: getStatusFromScore(categoryScore?.score_0_to_10 || 0),

      issueCount: {
        critical,
        major,
        minor,
        total: dimensionInsights.length,
      },

      potentialGain: {
        min: minGain,
        max: maxGain,
        display: `+${minGain} to +${maxGain} points`,
      },

      insights: dimensionInsights.sort((a, b) => {
        const severityOrder = { critical: 0, major: 1, minor: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),

      isExpanded: critical > 0, // Auto-expand if has critical issues
    };
  });
}

/**
 * Helper: Format dimension name for display
 */
function formatDimensionName(dimension: string): string {
  return dimension
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' & ');
}

/**
 * Helper: Get dimension description
 */
function getDimensionDescription(dimension: string): string {
  const descriptions: Record<string, string> = {
    voice_integrity: 'Authenticity and natural language',
    specificity_evidence: 'Concrete details and quantified impact',
    transformative_impact: 'Personal growth and meaningful change',
    role_clarity_ownership: 'What you actually did and led',
    narrative_arc_stakes: 'Story structure and dramatic tension',
    // ... add remaining 6 dimensions
  };

  return descriptions[dimension] || 'Quality measure';
}

/**
 * Helper: Get status from score
 */
function getStatusFromScore(score: number): 'critical' | 'needs_work' | 'good' | 'excellent' {
  if (score >= 9) return 'excellent';
  if (score >= 7) return 'good';
  if (score >= 4) return 'needs_work';
  return 'critical';
}
```

---

## Phase 3: React Components

### Step 3.1: Insights Dashboard Container

Create `/src/components/portfolio/extracurricular/workshop/insights/InsightsDashboard.tsx`:

```typescript
import React, { useState, useMemo } from 'react';
import { AnalysisResult } from '../backendTypes';
import { InsightsState, DimensionSummary } from '@/services/workshop/insightTypes';
import { transformIssueToInsight, groupInsightsByDimension } from '@/services/workshop/insightTransformer';
import ScoreOverview from './ScoreOverview';
import QuickInsightsBar from './QuickInsightsBar';
import FilterSortBar from './FilterSortBar';
import DimensionCard from './DimensionCard';
import InsightDetailView from './InsightDetailView';

interface InsightsDashboardProps {
  analysisResult: AnalysisResult;
  currentDraft: string;
  activityName: string;
  onNavigateToChat: (insight: InsightCard, prompt: string) => void;
}

export default function InsightsDashboard({
  analysisResult,
  currentDraft,
  activityName,
  onNavigateToChat,
}: InsightsDashboardProps) {
  // Transform backend data to insights
  const insights = useMemo(() => {
    if (!analysisResult.coaching) return [];

    return analysisResult.coaching.prioritized_issues.map(issue =>
      transformIssueToInsight(issue, currentDraft, analysisResult)
    );
  }, [analysisResult, currentDraft]);

  // Group by dimension
  const dimensions = useMemo(() =>
    groupInsightsByDimension(insights, analysisResult),
    [insights, analysisResult]
  );

  // State
  const [filters, setFilters] = useState<InsightsState['filters']>({
    severity: 'all',
    dimension: 'all',
    status: 'all',
  });
  const [sortBy, setSortBy] = useState<InsightsState['sortBy']>('priority');
  const [selectedInsight, setSelectedInsight] = useState<InsightCard | null>(null);
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(
    new Set(dimensions.filter(d => d.status === 'critical').map(d => d.dimension))
  );

  // Filter dimensions
  const filteredDimensions = useMemo(() => {
    return dimensions
      .filter(dim => {
        if (filters.dimension !== 'all' && dim.dimension !== filters.dimension) {
          return false;
        }
        if (filters.severity !== 'all') {
          return dim.insights.some(i => i.severity === filters.severity);
        }
        return true;
      })
      .map(dim => ({
        ...dim,
        insights: dim.insights.filter(insight => {
          if (filters.severity !== 'all' && insight.severity !== filters.severity) {
            return false;
          }
          if (filters.status !== 'all') {
            if (filters.status === 'completed' && !insight.isCompleted) return false;
            if (filters.status === 'not_started' && insight.isCompleted) return false;
          }
          return true;
        }),
      }))
      .filter(dim => dim.insights.length > 0);
  }, [dimensions, filters]);

  // Sort dimensions
  const sortedDimensions = useMemo(() => {
    const sorted = [...filteredDimensions];

    if (sortBy === 'priority') {
      sorted.sort((a, b) => {
        const severityOrder = { critical: 0, needs_work: 1, good: 2, excellent: 3 };
        return severityOrder[a.status] - severityOrder[b.status];
      });
    } else if (sortBy === 'score') {
      sorted.sort((a, b) => a.score - b.score);
    } else if (sortBy === 'impact') {
      sorted.sort((a, b) => b.potentialGain.max - a.potentialGain.max);
    }
    // 'dimension' keeps natural order

    return sorted;
  }, [filteredDimensions, sortBy]);

  // Toggle dimension expand/collapse
  const toggleDimension = (dimension: string) => {
    setExpandedDimensions(prev => {
      const next = new Set(prev);
      if (next.has(dimension)) {
        next.delete(dimension);
      } else {
        next.add(dimension);
      }
      return next;
    });
  };

  // Calculate totals for quick insights
  const totals = useMemo(() => {
    const allInsights = dimensions.flatMap(d => d.insights);
    return {
      critical: allInsights.filter(i => i.severity === 'critical').length,
      major: allInsights.filter(i => i.severity === 'major').length,
      minor: allInsights.filter(i => i.severity === 'minor').length,
      totalTime: allInsights.reduce((sum, i) => {
        const match = i.solutions.estimatedTime.match(/(\d+)/);
        return sum + (match ? parseInt(match[1]) : 10);
      }, 0),
    };
  }, [dimensions]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Narrative Insights & Analysis</h1>
        <p className="text-muted-foreground mt-1">{activityName}</p>
      </div>

      {/* Score Overview */}
      <ScoreOverview
        currentNQI={analysisResult.report.narrative_quality_index}
        targetNQI={analysisResult.coaching?.overall.target_nqi || 80}
        impression={analysisResult.report.reader_impression_label}
      />

      {/* Quick Insights Bar */}
      <QuickInsightsBar
        criticalCount={totals.critical}
        majorCount={totals.major}
        minorCount={totals.minor}
        estimatedTime={`${Math.floor(totals.totalTime / 60)}h ${totals.totalTime % 60}m`}
        highestImpact={dimensions[0]?.name || 'N/A'}
      />

      {/* Filter & Sort */}
      <FilterSortBar
        filters={filters}
        sortBy={sortBy}
        onFilterChange={setFilters}
        onSortChange={setSortBy}
      />

      {/* Dimension Cards */}
      <div className="space-y-4">
        {sortedDimensions.map(dimension => (
          <DimensionCard
            key={dimension.dimension}
            dimension={dimension}
            isExpanded={expandedDimensions.has(dimension.dimension)}
            onToggleExpand={() => toggleDimension(dimension.dimension)}
            onViewInsight={setSelectedInsight}
            onWorkOnInsight={(insight) => {
              onNavigateToChat(insight, insight.chatRouting.prefilledPrompt);
            }}
          />
        ))}
      </div>

      {/* Detail View Modal */}
      {selectedInsight && (
        <InsightDetailView
          insight={selectedInsight}
          onClose={() => setSelectedInsight(null)}
          onWorkOnThis={(insight) => {
            setSelectedInsight(null);
            onNavigateToChat(insight, insight.chatRouting.prefilledPrompt);
          }}
        />
      )}
    </div>
  );
}
```

### Step 3.2: Score Overview Component

Create `/src/components/portfolio/extracurricular/workshop/insights/ScoreOverview.tsx`:

```typescript
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ScoreOverviewProps {
  currentNQI: number;
  targetNQI: number;
  impression: string;
}

export default function ScoreOverview({
  currentNQI,
  targetNQI,
  impression,
}: ScoreOverviewProps) {
  const progressPercentage = (currentNQI / 100) * 100;
  const potentialGain = targetNQI - currentNQI;

  const statusColor = currentNQI >= 80 ? 'text-green-600' : currentNQI >= 60 ? 'text-yellow-600' : 'text-orange-600';

  const impressionDisplay = impression
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-6">
      <div className="flex items-start gap-6">
        {/* Score Ring */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${progressPercentage * 2.51} 251`}
              className={statusColor}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">{currentNQI}</span>
          </div>
        </div>

        {/* Score Details */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold">
            NQI: {currentNQI}/100
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Status: {impressionDisplay}
          </p>
          <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mt-2">
            Target: {targetNQI}/100 (+{potentialGain} points possible)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            With all improvements: {targetNQI - 5}-{targetNQI + 2} range
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Step 3.3: Quick Insights Bar

Create `/src/components/portfolio/extracurricular/workshop/insights/QuickInsightsBar.tsx`:

```typescript
import React from 'react';
import { AlertCircle, Clock, TrendingUp } from 'lucide-react';

interface QuickInsightsBarProps {
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  estimatedTime: string;
  highestImpact: string;
}

export default function QuickInsightsBar({
  criticalCount,
  majorCount,
  minorCount,
  estimatedTime,
  highestImpact,
}: QuickInsightsBarProps) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Issue Counts */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm font-medium">{criticalCount} Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-sm font-medium">{majorCount} Major</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-sm font-medium">{minorCount} Minor</span>
          </div>
        </div>

        {/* Estimated Time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Estimated work time: <strong>{estimatedTime}</strong></span>
        </div>

        {/* Highest Impact */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span>Highest impact: <strong className="text-purple-600 dark:text-purple-400">{highestImpact}</strong></span>
        </div>
      </div>
    </div>
  );
}
```

*(Continue with Step 3.4 through 3.8 for remaining components...)*

---

## Phase 4: Chat Integration

### Step 4.1: Update Chat Context

Modify `/src/services/workshop/chatContext.ts`:

```typescript
// Add to existing WorkshopChatContext interface
export interface WorkshopChatContext {
  // ... existing fields

  // NEW: Focused issue context (when routed from insights)
  focusedIssue?: {
    id: string;
    dimension: RubricCategory;
    severity: 'critical' | 'major' | 'minor';
    title: string;
    technicalAnalysis: string;
    draftQuotes: string[];
    examples: {
      weak: { text: string; problems: string[] };
      strong: { text: string; techniques: string[] };
    };
    solutions: {
      approaches: string[];
      estimatedTime: string;
    };
  };

  // Suggested follow-up questions
  suggestedFollowUps?: string[];
}
```

### Step 4.2: Update Chat Service

Modify `/src/services/workshop/chatService.ts` to handle focused mode:

```typescript
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  // ... existing code

  // Build prompt with focus mode context
  const contextString = formatContextForLLM(context);

  let focusModePrompt = '';
  if (context.focusedIssue) {
    focusModePrompt = buildFocusModePrompt(context.focusedIssue);
  }

  const fullPrompt = `${contextString}\n\n${focusModePrompt}\n\n${userMessage}`;

  // ... rest of function
}

function buildFocusModePrompt(focusedIssue: any): string {
  return `
FOCUS MODE ACTIVE

The student is specifically working on this issue from their analysis:

**Issue**: ${focusedIssue.title}
**Dimension**: ${focusedIssue.dimension}
**Severity**: ${focusedIssue.severity}

**Technical Analysis**:
${focusedIssue.technicalAnalysis}

**Quotes from Their Draft**:
${focusedIssue.draftQuotes.map(q => `- "${q}"`).join('\n')}

**Example Patterns**:

Weak Pattern:
${focusedIssue.examples.weak.text}
Problems: ${focusedIssue.examples.weak.problems.join(', ')}

Strong Pattern:
${focusedIssue.examples.strong.text}
Techniques: ${focusedIssue.examples.strong.techniques.join(', ')}

Your goal: Help them fix THIS SPECIFIC ISSUE. Reference the examples and quotes above. Be focused and practical.
`;
}
```

---

## Testing & Validation

### Test Checklist

- [ ] **Data Transformation**
  - [ ] Backend CoachingIssue transforms correctly to InsightCard
  - [ ] All 11 dimensions are represented
  - [ ] Quote extraction works for different issue types
  - [ ] Examples are matched appropriately

- [ ] **UI Components**
  - [ ] Dashboard loads with correct score
  - [ ] Dimensions can be expanded/collapsed
  - [ ] Filters work (severity, dimension, status)
  - [ ] Sort works (priority, score, impact, dimension)
  - [ ] Detail view displays full technical analysis

- [ ] **Chat Integration**
  - [ ] "Work on This" button navigates to chat
  - [ ] Pre-filled prompt is correct
  - [ ] Chat receives focused issue context
  - [ ] AI responses reference the specific issue
  - [ ] Follow-up questions are relevant

- [ ] **Performance**
  - [ ] Dashboard loads in <2 seconds
  - [ ] Expand/collapse is smooth (no lag)
  - [ ] Filtering doesn't cause re-renders of all cards
  - [ ] Large issue lists (20+) render efficiently

---

## Deployment

### Pre-deployment Checklist

1. [ ] All TypeScript types validated
2. [ ] All components unit tested
3. [ ] Integration tests pass
4. [ ] Performance benchmarks met
5. [ ] Accessibility audit passed (WCAG 2.1 AA)
6. [ ] Dark mode tested
7. [ ] Mobile responsive verified
8. [ ] Error boundaries in place
9. [ ] Analytics tracking implemented
10. [ ] Documentation updated

---

**End of Implementation Guide**

For questions or clarifications, refer to the main design document: `INSIGHTS_ANALYSIS_SYSTEM_DESIGN.md`
