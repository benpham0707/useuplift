/**
 * Teaching Unit Card - Integrated Version
 *
 * Replaces the basic "Learning Opportunity" box with full teaching framework.
 * Designed to feel alive, thoughtful, and AI-generated - not static templates.
 *
 * Key differences from test version:
 * - Progressive loading with skeleton states
 * - Animated reveals for LLM-generated content
 * - Dynamic styling that responds to severity/status
 * - Inline editing with live feedback
 * - Celebratory micro-interactions on completion
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Lightbulb,
  BookOpen,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Loader2,
  Zap,
  Brain,
  Target,
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

export interface TeachingUnitCardIntegratedProps {
  issue: WorkshopIssue;
  entry: ExperienceEntry;
  onReflectionAnswersChange?: (answers: Record<string, string>) => void;
  onMarkComplete?: () => void;
}

interface ReflectionAnswers {
  [promptId: string]: string;
}

// ============================================================================
// SEVERITY CONFIGURATION
// ============================================================================

const getSeverityConfig = (severity: 'critical' | 'important' | 'helpful') => {
  const configs = {
    critical: {
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      badgeVariant: 'destructive' as const,
      label: 'Critical Issue',
      impact: 'High Impact',
    },
    important: {
      icon: Zap,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      badgeVariant: 'default' as const,
      label: 'Important',
      impact: 'Medium Impact',
    },
    helpful: {
      icon: Lightbulb,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badgeVariant: 'secondary' as const,
      label: 'Helpful',
      impact: 'Polish',
    },
  };
  return configs[severity];
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TeachingUnitCardIntegrated: React.FC<TeachingUnitCardIntegratedProps> = ({
  issue,
  entry,
  onReflectionAnswersChange,
  onMarkComplete,
}) => {
  const [reflectionPrompts, setReflectionPrompts] = useState<ReflectionPromptSet | null>(null);
  const [reflectionAnswers, setReflectionAnswers] = useState<ReflectionAnswers>({});
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [promptsError, setPromptsError] = useState<string | null>(null);
  const [selectedFixIndex, setSelectedFixIndex] = useState(0);
  const [showReflectionPrompts, setShowReflectionPrompts] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const severityConfig = getSeverityConfig(issue.severity);
  const SeverityIcon = severityConfig.icon;

  // Auto-load prompts on mount (progressive enhancement)
  useEffect(() => {
    loadReflectionPrompts();
  }, []);

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
      console.error('[TeachingUnitCardIntegrated] Failed to load prompts:', error);
      setPromptsError('Unable to generate personalized questions. Please try again.');
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  const handleAnswerChange = (promptId: string, answer: string) => {
    const updated = { ...reflectionAnswers, [promptId]: answer };
    setReflectionAnswers(updated);
    onReflectionAnswersChange?.(updated);
  };

  const handleComplete = () => {
    setIsCompleted(true);
    onMarkComplete?.();
  };

  const allPromptsAnswered = reflectionPrompts
    ? reflectionPrompts.prompts.every(
        (p) => reflectionAnswers[p.id]?.trim().length > 10
      )
    : false;

  return (
    <div className={`p-5 rounded-lg ${severityConfig.bg} border-2 ${severityConfig.border} space-y-4 animate-in slide-in-from-bottom-2 duration-300`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${severityConfig.bg} border ${severityConfig.border}`}>
            <SeverityIcon className={`w-5 h-5 ${severityConfig.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h5 className="font-bold text-base text-foreground">
                {issue.title}
              </h5>
              <Badge variant={severityConfig.badgeVariant} className="text-xs">
                {severityConfig.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {severityConfig.impact} • Category: {issue.category}
            </p>
          </div>
        </div>
        {isCompleted && (
          <div className="flex items-center gap-2 animate-in zoom-in-75 duration-300">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-xs font-semibold text-green-600">Completed</span>
          </div>
        )}
      </div>

      {/* FROM YOUR DRAFT */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            From Your Draft
          </p>
        </div>
        <div className="p-3 rounded-md bg-white/50 border border-border">
          <p className="text-sm text-foreground/80 italic leading-relaxed">
            "{issue.from_draft}"
          </p>
        </div>
      </div>

      {/* THE PROBLEM */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            The Problem
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-foreground leading-relaxed">
            {issue.problem}
          </p>
          <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
            <p className="text-xs font-semibold text-primary mb-1">
              💡 Why This Matters
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {issue.why_matters}
            </p>
          </div>
        </div>
      </div>

      {/* TEACHING EXAMPLE */}
      {issue.teachingExample && (
        <div className="space-y-3 animate-in slide-in-from-left-2 duration-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">
              Teaching Example: Weak → Strong
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {/* Weak Example */}
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
                <span>❌</span> Weak Version
              </p>
              <p className="text-sm text-foreground/80 italic leading-relaxed">
                "{issue.teachingExample.weakExample}"
              </p>
            </div>

            {/* Strong Example */}
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                <span>✅</span> Strong Version
              </p>
              <p className="text-sm text-foreground/80 font-medium leading-relaxed">
                "{issue.teachingExample.strongExample}"
              </p>
            </div>
          </div>

          <div className="p-3 rounded-md bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <p className="text-xs font-semibold text-primary mb-1">
              📖 What Changed & Why
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {issue.teachingExample.explanation}
            </p>
          </div>
        </div>
      )}

      {/* FIX STRATEGIES */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {issue.suggested_fixes.length} Ways to Fix This
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {issue.suggested_fixes.map((fix, idx) => (
            <Button
              key={idx}
              variant={selectedFixIndex === idx ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFixIndex(idx)}
              className="text-xs"
            >
              Approach {idx + 1}
            </Button>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-white border-2 border-primary/30 space-y-2">
          <div className="flex items-start gap-2">
            <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground mb-1">
                {issue.suggested_fixes[selectedFixIndex].fix_text}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                {issue.suggested_fixes[selectedFixIndex].why_this_works}
              </p>
              {issue.suggested_fixes[selectedFixIndex].teaching_example && (
                <div className="p-2 rounded bg-primary/5 text-xs text-foreground/80 italic">
                  Example: {issue.suggested_fixes[selectedFixIndex].teaching_example}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* REFLECTION PROMPTS */}
      <div className="space-y-3 pt-2 border-t-2 border-dashed border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">
              Guided Reflection
            </p>
          </div>
          {!showReflectionPrompts && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReflectionPrompts(true)}
              className="text-xs"
            >
              Start Reflection
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>

        {showReflectionPrompts && (
          <div className="space-y-4 animate-in slide-in-from-bottom-3 duration-500">
            {isLoadingPrompts && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Crafting personalized questions...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Analyzing your specific situation to generate thoughtful prompts
                  </p>
                </div>
              </div>
            )}

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

            {reflectionPrompts && (
              <div className="space-y-4">
                <div className="p-3 rounded-md bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                  <p className="text-xs text-blue-900 leading-relaxed">
                    💭 <strong>These questions are tailored to your specific activity.</strong> Take time to reflect deeply - your answers will help you discover content you might have forgotten or didn't realize was important.
                  </p>
                </div>

                {reflectionPrompts.prompts.map((prompt, idx) => (
                  <div
                    key={prompt.id}
                    className="space-y-2 animate-in slide-in-from-bottom-2 duration-300"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-1">
                        Q{idx + 1}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground leading-relaxed mb-1">
                          {prompt.question}
                        </p>
                        <p className="text-xs text-muted-foreground italic">
                          {prompt.purpose}
                        </p>
                      </div>
                    </div>
                    <Textarea
                      value={reflectionAnswers[prompt.id] || ''}
                      onChange={(e) => handleAnswerChange(prompt.id, e.target.value)}
                      placeholder={prompt.placeholderExample || 'Your answer...'}
                      className="min-h-[80px] text-sm"
                    />
                  </div>
                ))}

                {allPromptsAnswered && !isCompleted && (
                  <Button
                    onClick={handleComplete}
                    className="w-full"
                    size="lg"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Complete
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
