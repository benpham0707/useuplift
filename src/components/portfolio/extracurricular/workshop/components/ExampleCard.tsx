/**
 * ExampleCard - Display Elite Essay Examples
 *
 * Shows before/after essay excerpts from admitted students with:
 * - School context and tier badge
 * - Problems in "before" version
 * - Annotations highlighting what makes "after" version work
 * - Score improvement indicator
 * - Success factors
 *
 * Purpose: Teach through real examples, not abstract advice.
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, TrendingUp, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import type { EliteEssayExample } from '../teachingTypes';

interface ExampleCardProps {
  example: EliteEssayExample;
  defaultExpanded?: boolean;
}

export const ExampleCard: React.FC<ExampleCardProps> = ({
  example,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // School tier badge configuration
  const getTierConfig = () => {
    switch (example.school_tier) {
      case 'ivy_plus':
        return {
          label: 'Harvard/MIT/Stanford Tier',
          color: 'bg-purple-600 text-white',
          icon: '🏆',
        };
      case 'top_uc':
        return {
          label: 'Top UC/Ivy Tier',
          color: 'bg-blue-600 text-white',
          icon: '⭐',
        };
      case 'competitive':
        return {
          label: 'Competitive Schools',
          color: 'bg-green-600 text-white',
          icon: '✓',
        };
    }
  };

  const tierConfig = getTierConfig();

  // Collapsed state - show just context and expand button
  if (!isExpanded) {
    return (
      <Card
        className="border border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/20 cursor-pointer hover:shadow-md transition-all"
        onClick={() => setIsExpanded(true)}
      >
        <div className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 truncate">
                  {example.context}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  {tierConfig.icon} {tierConfig.label} • {example.after.score_improvement}
                </p>
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
          </div>
        </div>
      </Card>
    );
  }

  // Expanded state - full before/after with annotations
  return (
    <Card className="border-2 border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/30">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div>
          <button
            onClick={() => setIsExpanded(false)}
            className="w-full flex items-start justify-between gap-3 text-left hover:opacity-80 transition-opacity"
          >
            <div className="flex items-start gap-3 flex-1">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="text-base font-bold text-purple-900 dark:text-purple-300">
                    {example.context}
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${tierConfig.color}`}>
                    {tierConfig.icon} {tierConfig.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                    {example.after.score_improvement}
                  </span>
                </div>
              </div>
            </div>
            <ChevronUp className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
          </button>
        </div>

        {/* Before Version */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <h5 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
              Before (Generic)
            </h5>
          </div>

          <div className="relative rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm italic text-foreground/90 mb-3">
              "{example.before.text}"
            </p>

            {/* Problems list */}
            <div className="pt-3 border-t border-red-200 dark:border-red-800">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">
                ❌ Problems:
              </p>
              <ul className="space-y-1">
                {example.before.problems.map((problem, idx) => (
                  <li key={idx} className="text-xs text-red-800 dark:text-red-300 flex items-start gap-1.5">
                    <span className="text-red-500 dark:text-red-400 mt-0.5">•</span>
                    <span>{problem}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* After Version (Elite) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            <h5 className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">
              After (Elite Version)
            </h5>
          </div>

          <div className="relative rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4">
            <p className="text-sm font-medium text-foreground mb-3">
              "{example.after.text}"
            </p>

            {/* Score improvement */}
            <div className="mb-3 flex items-center gap-2 p-2 rounded bg-green-100 dark:bg-green-950/50 border border-green-300 dark:border-green-700">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-bold text-green-700 dark:text-green-400">
                Score Impact: {example.after.score_improvement}
              </span>
            </div>

            {/* Annotations - What makes this work */}
            {example.annotations.length > 0 && (
              <div className="pt-3 border-t border-green-200 dark:border-green-800 space-y-2.5">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">
                  💡 What Makes This Work:
                </p>
                {example.annotations.map((annotation, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-mono font-bold text-green-700 dark:text-green-400 bg-green-200 dark:bg-green-900/50 px-1.5 py-0.5 rounded">
                        "{annotation.highlight}"
                      </span>
                    </div>
                    <p className="text-xs text-green-800 dark:text-green-300 pl-2 border-l-2 border-green-300 dark:border-green-700">
                      <span className="font-semibold">Why:</span> {annotation.explanation}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-400 italic pl-2">
                      <span className="font-semibold">Principle:</span> {annotation.principle}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Success Factors */}
        {example.success_factors.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
              🎯 Key Success Factors
            </h5>
            <div className="grid gap-2">
              {example.success_factors.map((factor, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-purple-900 dark:text-purple-300">
                    {factor}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teaching Callout */}
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-900 dark:text-amber-300">
            <span className="font-semibold">📚 Learn from this:</span> Don't copy the specific details
            - they're unique to this student. Instead, apply the <span className="font-bold">principles</span> you
            see here to your own experiences and voice.
          </p>
        </div>
      </div>
    </Card>
  );
};
