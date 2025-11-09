/**
 * AnalysisView - Comprehensive Analysis Display
 *
 * Shows complete backend analysis results:
 * - NQI Score (0-100) with reader impression
 * - 11 Rubric Categories with expandable details
 * - Authenticity Analysis (voice type, flags)
 * - Elite Pattern Breakdown (5 dimensions)
 * - Literary Sophistication (5 dimensions)
 *
 * Purpose: Give students a complete diagnostic of their essay's strengths and gaps.
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Target,
  Sparkles,
  Shield,
  BookOpen,
  Zap,
  ArrowRight,
} from 'lucide-react';
import type {
  AnalysisReport,
  RubricCategoryScore,
  AuthenticityAnalysis,
  ElitePatternAnalysis,
  LiterarySophisticationAnalysis,
} from '../backendTypes';

interface AnalysisViewProps {
  analysis: AnalysisReport;
  authenticity?: AuthenticityAnalysis;
  elitePatterns?: ElitePatternAnalysis;
  literarySophistication?: LiterarySophisticationAnalysis;
  onStartCoaching?: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  analysis,
  authenticity,
  elitePatterns,
  literarySophistication,
  onStartCoaching,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showDeepAnalysis, setShowDeepAnalysis] = useState(false);

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Expand/collapse all categories
  const expandAll = () => {
    setExpandedCategories(new Set(analysis.categories.map((cat) => cat.category)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Get NQI status configuration
  const getNQIConfig = () => {
    const nqi = analysis.narrative_quality_index;
    if (nqi >= 85)
      return {
        label: 'Outstanding',
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-100 dark:bg-green-950/30',
        border: 'border-green-300 dark:border-green-800',
        icon: TrendingUp,
      };
    if (nqi >= 75)
      return {
        label: 'Strong',
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-950/30',
        border: 'border-blue-300 dark:border-blue-800',
        icon: TrendingUp,
      };
    if (nqi >= 65)
      return {
        label: 'Solid',
        color: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-100 dark:bg-yellow-950/30',
        border: 'border-yellow-300 dark:border-yellow-800',
        icon: Minus,
      };
    return {
      label: 'Needs Work',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-950/30',
      border: 'border-red-300 dark:border-red-800',
      icon: TrendingDown,
    };
  };

  const nqiConfig = getNQIConfig();
  const NQIIcon = nqiConfig.icon;

  // Get category status
  const getCategoryStatus = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 85)
      return { label: 'Excellent', color: 'text-green-600 dark:text-green-400', icon: CheckCircle2 };
    if (percentage >= 70)
      return { label: 'Good', color: 'text-blue-600 dark:text-blue-400', icon: CheckCircle2 };
    if (percentage >= 55)
      return { label: 'Acceptable', color: 'text-yellow-600 dark:text-yellow-400', icon: AlertCircle };
    return { label: 'Needs Work', color: 'text-red-600 dark:text-red-400', icon: AlertCircle };
  };

  // Format reader impression label
  const formatReaderImpression = (label: string) => {
    return label
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      {/* NQI Score Card */}
      <Card className={`border-2 ${nqiConfig.border}`}>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-primary">Narrative Quality Index</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Holistic measure of essay effectiveness across all dimensions
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-5xl font-bold text-primary">
                  {analysis.narrative_quality_index}
                </span>
                <span className="text-2xl font-semibold text-muted-foreground mb-1">/100</span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${nqiConfig.bg}`}>
                <NQIIcon className={`w-4 h-4 ${nqiConfig.color}`} />
                <span className={`text-sm font-bold ${nqiConfig.color}`}>{nqiConfig.label}</span>
              </div>
            </div>
          </div>

          {/* Reader Impression */}
          <div className={`p-4 rounded-lg ${nqiConfig.bg} border ${nqiConfig.border}`}>
            <p className="text-xs font-semibold text-muted-foreground mb-1">
              📖 Reader Impression:
            </p>
            <p className={`text-base font-semibold ${nqiConfig.color}`}>
              {formatReaderImpression(analysis.reader_impression_label)}
            </p>
          </div>

          {/* Flags if any */}
          {analysis.flags.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">⚠️ Important Flags:</p>
              <div className="flex flex-wrap gap-2">
                {analysis.flags.map((flag, idx) => (
                  <Badge key={idx} variant="destructive" className="text-xs">
                    {flag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Start Coaching CTA */}
          {onStartCoaching && (
            <div className="mt-4">
              <Button onClick={onStartCoaching} className="w-full" size="lg">
                <Sparkles className="w-4 h-4 mr-2" />
                Start Coaching Session
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 11 Rubric Categories */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-primary">Rubric Categories ({analysis.categories.length})</h2>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                <ChevronDown className="w-4 h-4 mr-1" />
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                <ChevronUp className="w-4 h-4 mr-1" />
                Collapse All
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {analysis.categories.map((category) => {
              const isExpanded = expandedCategories.has(category.category);
              const status = getCategoryStatus(category.score, category.maxScore);
              const StatusIcon = status.icon;
              const percentage = Math.round((category.score / category.maxScore) * 100);
              const weight = analysis.weights[category.category] || 0;

              return (
                <Card
                  key={category.category}
                  className={`border-2 transition-all ${
                    isExpanded ? 'border-primary' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <button
                    onClick={() => toggleCategory(category.category)}
                    className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <StatusIcon className={`w-5 h-5 ${status.color} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-base text-foreground">
                              {category.category
                                .split('_')
                                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                .join(' ')}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              Weight: {Math.round(weight * 100)}%
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-foreground">
                              {category.score.toFixed(1)}/{category.maxScore}
                            </span>
                            <span className={`text-xs font-bold ${status.color}`}>
                              {percentage}% • {status.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          percentage >= 85
                            ? 'bg-green-600 dark:bg-green-400'
                            : percentage >= 70
                            ? 'bg-blue-600 dark:bg-blue-400'
                            : percentage >= 55
                            ? 'bg-yellow-600 dark:bg-yellow-400'
                            : 'bg-red-600 dark:bg-red-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t">
                      {/* Comments */}
                      {category.comments && category.comments.length > 0 && (
                        <div className="pt-3">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">
                            💬 Assessment:
                          </p>
                          <ul className="space-y-1.5">
                            {category.comments.map((comment, idx) => (
                              <li key={idx} className="text-sm text-foreground/90 flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{comment}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Evidence */}
                      {category.evidence && category.evidence.length > 0 && (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">
                            🔍 Evidence from your essay:
                          </p>
                          <ul className="space-y-1">
                            {category.evidence.map((item, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground italic">
                                "{item}"
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Suggestions */}
                      {category.suggestions && category.suggestions.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-primary mb-2">💡 How to improve:</p>
                          <ul className="space-y-1.5">
                            {category.suggestions.map((suggestion, idx) => (
                              <li key={idx} className="text-sm text-foreground/90 flex items-start gap-2">
                                <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Deep Analysis Toggle */}
      {(authenticity || elitePatterns || literarySophistication) && (
        <div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowDeepAnalysis(!showDeepAnalysis)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {showDeepAnalysis ? 'Hide' : 'Show'} Deep Analysis
            {showDeepAnalysis ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </Button>
        </div>
      )}

      {/* Deep Analysis Panels */}
      {showDeepAnalysis && (
        <div className="space-y-4">
          {/* Authenticity Analysis */}
          {authenticity && (
            <Card className="border-2 border-purple-300 dark:border-purple-700">
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300">
                    Authenticity Analysis
                  </h3>
                  <Badge variant="secondary">{authenticity.authenticity_score.toFixed(1)}/10</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                      Voice Type
                    </p>
                    <p className="text-sm font-bold text-purple-900 dark:text-purple-300 capitalize">
                      {authenticity.voice_type}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                      Assessment
                    </p>
                    <p className="text-sm font-bold text-purple-900 dark:text-purple-300">
                      {authenticity.assessment}
                    </p>
                  </div>
                </div>

                {authenticity.green_flags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">
                      ✓ Green Flags:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {authenticity.green_flags.map((flag, idx) => (
                        <Badge key={idx} className="bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {authenticity.red_flags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
                      ⚠️ Red Flags:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {authenticity.red_flags.map((flag, idx) => (
                        <Badge key={idx} variant="destructive">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Elite Patterns */}
          {elitePatterns && (
            <Card className="border-2 border-amber-300 dark:border-amber-700">
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-lg font-bold text-amber-900 dark:text-amber-300">
                      Elite Pattern Analysis
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-900 dark:text-amber-300">
                      {elitePatterns.overallScore}/100
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Tier {elitePatterns.tier}</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  {[
                    { label: 'Vulnerability', data: elitePatterns.vulnerability },
                    { label: 'Dialogue', data: elitePatterns.dialogue },
                    { label: 'Community Transformation', data: elitePatterns.communityTransformation },
                    { label: 'Quantified Impact', data: elitePatterns.quantifiedImpact },
                    { label: 'Universal Insight', data: elitePatterns.microToMacro },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                          {item.label}
                        </p>
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                          {item.data.score}/10
                        </span>
                      </div>
                      {item.data.examples && item.data.examples.length > 0 && (
                        <div className="space-y-1">
                          {item.data.examples.map((example: string, exIdx: number) => (
                            <p key={exIdx} className="text-xs text-amber-700 dark:text-amber-400 italic">
                              "{example}"
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Literary Sophistication */}
          {literarySophistication && (
            <Card className="border-2 border-blue-300 dark:border-blue-700">
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300">
                      Literary Sophistication
                    </h3>
                  </div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                    {literarySophistication.overallScore}/100
                  </div>
                </div>

                <div className="grid gap-3">
                  {[
                    { label: 'Extended Metaphor', data: literarySophistication.extendedMetaphor },
                    { label: 'Structural Innovation', data: literarySophistication.structuralInnovation },
                    { label: 'Sentence Rhythm', data: literarySophistication.sentenceRhythm },
                    { label: 'Sensory Immersion', data: literarySophistication.sensoryImmersion },
                    { label: 'Active Voice', data: literarySophistication.activeVoice },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                          {item.label}
                        </p>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {item.data.score}/10
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
