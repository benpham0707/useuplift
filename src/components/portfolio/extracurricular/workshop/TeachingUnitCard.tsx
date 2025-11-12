/**
 * Teaching Unit Card Component
 *
 * Displays a single detected issue with:
 * - Problem explanation (what's wrong + why it matters)
 * - Before/After teaching example from corpus
 * - Multiple fix strategies (2-3 different approaches)
 * - LLM-generated reflection prompts (3 adaptive questions)
 *
 * Design Philosophy:
 * - Teach, don't prescribe
 * - Show patterns, not answers
 * - Guide discovery through questions
 * - Multiple pathways (not one "correct" way)
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
  BookOpen,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import { WorkshopIssue } from '@/services/workshop/workshopAnalyzer';
import { TeachingExample } from '@/services/workshop/teachingExamples';
import {
  ReflectionPromptSet,
  generateReflectionPromptsWithCache,
} from '@/services/workshop/reflectionPrompts';
import { ExperienceEntry } from '@/core/types/experience';

// ============================================================================
// TYPES
// ============================================================================

export interface TeachingUnitCardProps {
  issue: WorkshopIssue;
  entry: ExperienceEntry;
  isExpanded: boolean;
  onToggle: () => void;
  onReflectionAnswersChange?: (answers: Record<string, string>) => void;
  onMarkComplete?: () => void;
}

interface ReflectionAnswers {
  [promptId: string]: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TeachingUnitCard: React.FC<TeachingUnitCardProps> = ({
  issue,
  entry,
  isExpanded,
  onToggle,
  onReflectionAnswersChange,
  onMarkComplete,
}) => {
  const [reflectionPrompts, setReflectionPrompts] = useState<ReflectionPromptSet | null>(null);
  const [reflectionAnswers, setReflectionAnswers] = useState<ReflectionAnswers>({});
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [promptsError, setPromptsError] = useState<string | null>(null);
  const [selectedFixIndex, setSelectedFixIndex] = useState(0);

  // Load LLM prompts when card expands
  useEffect(() => {
    if (isExpanded && !reflectionPrompts && !isLoadingPrompts) {
      loadReflectionPrompts();
    }
  }, [isExpanded]);

  const loadReflectionPrompts = async () => {
    setIsLoadingPrompts(true);
    setPromptsError(null);

    try {
      const prompts = await generateReflectionPromptsWithCache(issue, entry, {
        tone: 'mentor',
        depth: issue.severity === 'critical' ? 'deep' : 'surface',
      });

      setReflectionPrompts(prompts);
    } catch (error) {
      console.error('[TeachingUnitCard] Failed to load prompts:', error);
      setPromptsError('Unable to load reflection questions. Please try again.');
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  const handleReflectionAnswer = (promptId: string, answer: string) => {
    const updated = { ...reflectionAnswers, [promptId]: answer };
    setReflectionAnswers(updated);

    if (onReflectionAnswersChange) {
      onReflectionAnswersChange(updated);
    }
  };

  const getSeverityConfig = () => {
    switch (issue.severity) {
      case 'critical':
        return {
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          badge: 'destructive',
          icon: AlertCircle,
        };
      case 'important':
        return {
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          badge: 'default',
          icon: HelpCircle,
        };
      default:
        return {
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          badge: 'secondary',
          icon: Lightbulb,
        };
    }
  };

  const config = getSeverityConfig();
  const SeverityIcon = config.icon;

  const hasAnsweredAllPrompts =
    reflectionPrompts &&
    reflectionPrompts.prompts.every((p) => reflectionAnswers[p.id]?.trim().length > 0);

  return (
    <Card className={`border-2 ${isExpanded ? config.border : 'border-border'} transition-all`}>
      {/* COLLAPSED HEADER */}
      <button
        onClick={onToggle}
        className={`w-full p-4 text-left hover:bg-muted/30 transition-colors ${
          isExpanded ? config.bg : ''
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <SeverityIcon className={`w-5 h-5 ${config.color} mt-0.5 flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-bold text-base text-foreground">{issue.title}</h4>
                <Badge variant={config.badge as any} className="text-xs">
                  {issue.severity}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {issue.category}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{issue.problem}</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          )}
        </div>
      </button>

      {/* EXPANDED CONTENT */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-6 border-t">
          {/* 1. FROM YOUR DRAFT */}
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h5 className="font-semibold text-sm text-foreground">From Your Draft:</h5>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-foreground/90 italic">"{issue.from_draft}"</p>
            </div>
          </div>

          {/* 2. THE PROBLEM */}
          <div className={`p-4 rounded-lg ${config.bg} border ${config.border}`}>
            <h5 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              The Problem
            </h5>
            <p className="text-sm text-foreground/90 mb-3">{issue.problem}</p>

            <h6 className="font-semibold text-xs text-foreground mb-1">Why It Matters:</h6>
            <p className="text-sm text-foreground/80">{issue.why_matters}</p>
          </div>

          {/* 3. TEACHING EXAMPLE */}
          {issue.teachingExample && (
            <div className="border-2 border-primary/20 rounded-lg overflow-hidden">
              <div className="bg-primary/5 px-4 py-3 border-b border-primary/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h5 className="font-semibold text-sm text-foreground">
                    Learn from this Example:
                  </h5>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* BEFORE (Weak) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                      ❌ WEAK
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-foreground/90">
                      {issue.teachingExample.weakExample}
                    </p>
                  </div>
                </div>

                {/* ARROW */}
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-primary" />
                </div>

                {/* AFTER (Strong) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                      ✅ STRONG
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-sm text-foreground/90">
                      {issue.teachingExample.strongExample}
                    </p>
                  </div>
                </div>

                {/* WHAT CHANGED */}
                <div className="pt-2 border-t">
                  <h6 className="font-semibold text-xs text-foreground mb-2">
                    ➜ What Changed:
                  </h6>
                  <ul className="space-y-1">
                    {issue.teachingExample.diffHighlights.map((highlight, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-foreground/80 flex items-start gap-2"
                      >
                        <span className="text-primary mt-0.5">•</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* EXPLANATION */}
                <div className="p-3 rounded-lg bg-primary/5">
                  <p className="text-sm text-foreground/90">
                    {issue.teachingExample.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. FIX STRATEGIES */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-primary" />
              <h5 className="font-semibold text-sm text-foreground">
                Fix Strategies (choose one that fits your voice):
              </h5>
            </div>

            <div className="space-y-3">
              {issue.suggested_fixes.map((fix, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedFixIndex === idx
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 bg-card'
                  }`}
                  onClick={() => setSelectedFixIndex(idx)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          selectedFixIndex === idx
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {idx + 1}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground mb-2">{fix.fix_text}</p>

                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-semibold text-muted-foreground">
                            Why this works:
                          </span>
                          <p className="text-xs text-foreground/80 mt-0.5">
                            {fix.why_this_works}
                          </p>
                        </div>

                        {fix.teaching_example && (
                          <div className="p-2 rounded bg-muted/50">
                            <span className="text-xs font-semibold text-muted-foreground">
                              Example:
                            </span>
                            <p className="text-xs text-foreground/80 mt-0.5 italic">
                              {fix.teaching_example}
                            </p>
                          </div>
                        )}
                      </div>

                      {selectedFixIndex === idx && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Scroll to editor and highlight relevant section
                          }}
                        >
                          Apply This Fix
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. REFLECTION PROMPTS */}
          <div className="border-2 border-blue-200 rounded-lg overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                  <h5 className="font-semibold text-sm text-foreground">
                    Dig Deeper (answer these to strengthen your draft):
                  </h5>
                </div>
                {isLoadingPrompts && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* LOADING STATE */}
              {isLoadingPrompts && !reflectionPrompts && (
                <div className="text-center py-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Generating personalized questions for you...
                  </p>
                </div>
              )}

              {/* ERROR STATE */}
              {promptsError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{promptsError}</span>
                    <Button variant="outline" size="sm" onClick={loadReflectionPrompts}>
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* PROMPTS LOADED */}
              {reflectionPrompts && (
                <>
                  {/* Rationale */}
                  {reflectionPrompts.rationale && (
                    <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                      <p className="text-xs text-foreground/80 italic">
                        {reflectionPrompts.rationale}
                      </p>
                    </div>
                  )}

                  {/* Questions */}
                  <div className="space-y-4">
                    {reflectionPrompts.prompts.map((prompt, idx) => (
                      <div key={prompt.id} className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <label
                              htmlFor={prompt.id}
                              className="text-sm font-medium text-foreground block mb-1"
                            >
                              {prompt.question}
                            </label>
                            <p className="text-xs text-muted-foreground mb-2">
                              {prompt.purpose}
                            </p>

                            <Textarea
                              id={prompt.id}
                              value={reflectionAnswers[prompt.id] || ''}
                              onChange={(e) => handleReflectionAnswer(prompt.id, e.target.value)}
                              placeholder={
                                prompt.placeholderExample ||
                                `Your answer (${prompt.expectedLength === 'short' ? '1-2' : '3-4'} sentences)...`
                              }
                              className={`text-sm ${
                                prompt.expectedLength === 'short' ? 'min-h-[60px]' : 'min-h-[100px]'
                              }`}
                            />

                            {reflectionAnswers[prompt.id]?.trim().length > 0 && (
                              <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Answered</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SUBMIT BUTTON */}
                  {hasAnsweredAllPrompts && (
                    <div className="pt-4 border-t">
                      <Button
                        onClick={() => {
                          // TODO: Use these answers to improve draft
                          if (onMarkComplete) onMarkComplete();
                        }}
                        className="w-full"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Use These Answers to Improve Draft
                      </Button>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        Your answers will help guide rewrite suggestions
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
