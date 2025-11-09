/**
 * ReflectionPromptsPanel - Guided Questions for Application
 *
 * Implements Socratic teaching method:
 * - Ask guided questions that lead students to discover solutions
 * - Each question has a clear purpose (explain why we're asking)
 * - Support different answer types (text, number, multiple choice)
 * - Validate answers with helpful hints
 * - Track completion progress
 *
 * Philosophy: Students learn better when they discover answers themselves.
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ReflectionPrompt } from '../teachingTypes';

interface ReflectionPromptsPanelProps {
  prompts: ReflectionPrompt[];
  issueId: string;
  onUpdateAnswer?: (promptIndex: number, answer: string | number) => void;
}

export const ReflectionPromptsPanel: React.FC<ReflectionPromptsPanelProps> = ({
  prompts,
  issueId,
  onUpdateAnswer,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showHints, setShowHints] = useState<Record<number, boolean>>({});

  // Calculate completion progress
  const answeredCount = prompts.filter(p => p.student_answer !== undefined && p.student_answer !== '').length;
  const totalCount = prompts.length;
  const completionPercentage = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  // Validate answer
  const validateAnswer = (prompt: ReflectionPrompt, answer: string | number): { isValid: boolean; message?: string } => {
    if (!prompt.validation) return { isValid: true };

    const { min_length, max_length, required } = prompt.validation;

    if (required && (answer === '' || answer === undefined)) {
      return { isValid: false, message: 'This question is required' };
    }

    if (typeof answer === 'string') {
      if (min_length && answer.length < min_length) {
        return { isValid: false, message: `Please write at least ${min_length} characters` };
      }
      if (max_length && answer.length > max_length) {
        return { isValid: false, message: `Please keep it under ${max_length} characters` };
      }
    }

    return { isValid: true };
  };

  // Handle answer change
  const handleAnswerChange = (promptIndex: number, answer: string | number) => {
    if (onUpdateAnswer) {
      onUpdateAnswer(promptIndex, answer);
    }
  };

  // Toggle hint visibility
  const toggleHint = (promptIndex: number) => {
    setShowHints(prev => ({
      ...prev,
      [promptIndex]: !prev[promptIndex],
    }));
  };

  if (prompts.length === 0) {
    return null;
  }

  // Collapsed state
  if (!isExpanded) {
    return (
      <Card
        className="border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20 cursor-pointer hover:shadow-md transition-all"
        onClick={() => setIsExpanded(true)}
      >
        <div className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300">
                  Reflection Questions
                </h4>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {answeredCount}/{totalCount} answered ({completionPercentage}%)
                </p>
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </Card>
    );
  }

  // Expanded state with all prompts
  return (
    <Card className="border-2 border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div>
          <button
            onClick={() => setIsExpanded(false)}
            className="w-full flex items-start justify-between gap-3 text-left hover:opacity-80 transition-opacity"
          >
            <div className="flex items-start gap-3 flex-1">
              <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-base font-bold text-blue-900 dark:text-blue-300 mb-1">
                  Reflection Questions
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Think through these questions to apply the principle to your own work
                </p>
              </div>
            </div>
            <ChevronUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-700 dark:text-blue-400 font-medium">
              Progress: {answeredCount}/{totalCount}
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              {completionPercentage}%
            </span>
          </div>
          <div className="h-2 bg-blue-100 dark:bg-blue-950/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Prompts */}
        <div className="space-y-4">
          {prompts.map((prompt, index) => {
            const isAnswered = prompt.student_answer !== undefined && prompt.student_answer !== '';
            const validation = validateAnswer(prompt, prompt.student_answer || '');

            return (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  isAnswered
                    ? 'bg-white dark:bg-gray-900 border-blue-300 dark:border-blue-700'
                    : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                }`}
              >
                {/* Question */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-start gap-2">
                    {isAnswered ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
                        {index + 1}.
                      </span>
                    )}
                    <Label className="text-sm font-semibold text-foreground leading-relaxed">
                      {prompt.question}
                    </Label>
                  </div>

                  {/* Purpose */}
                  <div className="pl-6">
                    <p className="text-xs text-muted-foreground italic">
                      <span className="font-semibold">Why we ask:</span> {prompt.purpose}
                    </p>
                  </div>
                </div>

                {/* Answer Input */}
                <div className="pl-6 space-y-2">
                  {prompt.answer_type === 'short_text' && (
                    <Input
                      placeholder="Your answer..."
                      value={(prompt.student_answer as string) || ''}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      className="text-sm"
                    />
                  )}

                  {prompt.answer_type === 'long_text' && (
                    <Textarea
                      placeholder="Take your time to think through this..."
                      value={(prompt.student_answer as string) || ''}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      className="min-h-[100px] text-sm"
                    />
                  )}

                  {prompt.answer_type === 'number' && (
                    <Input
                      type="number"
                      placeholder="Enter a number..."
                      value={(prompt.student_answer as number) || ''}
                      onChange={(e) => handleAnswerChange(index, parseFloat(e.target.value) || 0)}
                      className="text-sm"
                    />
                  )}

                  {prompt.answer_type === 'multiple_choice' && prompt.options && (
                    <RadioGroup
                      value={(prompt.student_answer as string) || ''}
                      onValueChange={(value) => handleAnswerChange(index, value)}
                    >
                      <div className="space-y-2">
                        {prompt.options.map((option, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <RadioGroupItem value={option} id={`${issueId}-${index}-${optIdx}`} />
                            <Label
                              htmlFor={`${issueId}-${index}-${optIdx}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  )}

                  {/* Character count for text inputs */}
                  {(prompt.answer_type === 'short_text' || prompt.answer_type === 'long_text') &&
                    prompt.student_answer && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{(prompt.student_answer as string).length} characters</span>
                        {prompt.validation?.min_length && (
                          <span>
                            {(prompt.student_answer as string).length >= prompt.validation.min_length
                              ? '✓ Meets minimum'
                              : `${prompt.validation.min_length - (prompt.student_answer as string).length} more needed`}
                          </span>
                        )}
                      </div>
                    )}

                  {/* Validation error */}
                  {!validation.isValid && validation.message && (
                    <div className="flex items-start gap-2 p-2 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 dark:text-red-400">{validation.message}</p>
                    </div>
                  )}

                  {/* Hint toggle */}
                  {prompt.validation?.helpful_hint && (
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleHint(index)}
                        className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        {showHints[index] ? 'Hide hint' : 'Show hint'}
                      </button>

                      {showHints[index] && (
                        <div className="p-3 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                          <p className="text-xs text-amber-900 dark:text-amber-300">
                            💡 <span className="font-semibold">Hint:</span> {prompt.validation.helpful_hint}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion message */}
        {answeredCount === totalCount && totalCount > 0 && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-900 dark:text-green-300 mb-1">
                  Great work! All questions answered.
                </p>
                <p className="text-xs text-green-700 dark:text-green-400">
                  Now apply what you've learned in the workspace below. Try rewriting your excerpt using
                  the principles you reflected on.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
