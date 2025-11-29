// @ts-nocheck - Legacy workshop file with type mismatches
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { SuggestedFix, TeachingGuidance } from './types';
import { NavigationControls } from '../../NavigationControls';
import { TeachingGuidanceCard } from './TeachingGuidanceCard';

interface SuggestionCarouselProps {
  suggestions: SuggestedFix[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onApply: (
    suggestionText: string,
    type: 'replace' | 'insert_before' | 'insert_after'
  ) => void;
  teaching?: TeachingGuidance;
}

export const SuggestionCarousel: React.FC<SuggestionCarouselProps> = ({
  suggestions,
  currentIndex,
  onNext,
  onPrev,
  onApply,
  teaching
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset expanded state when navigating between suggestions
  useEffect(() => {
    setIsExpanded(false);
  }, [currentIndex]);

  // DEBUG: Log teaching data
  console.log('🔍 SuggestionCarousel render:', {
    currentIndex,
    hasTeaching: !!teaching,
    hasSuggestionRationales: !!teaching?.suggestionRationales,
    rationaleCount: teaching?.suggestionRationales?.length || 0,
    currentRationale: teaching?.suggestionRationales?.[currentIndex] ? 'EXISTS' : 'MISSING',
  });

  // CRITICAL WARNING: Detect old teaching format without suggestionRationales
  if (teaching && !teaching.suggestionRationales) {
    console.warn('⚠️⚠️⚠️ OLD TEACHING FORMAT DETECTED ⚠️⚠️⚠️');
    console.warn('This analysis was created BEFORE suggestionRationales were added.');
    console.warn('You are seeing generic fallback content instead of per-suggestion rationales.');
    console.warn('👉 SOLUTION: Click "Re-analyze Essay" to get fresh Phase 19 data with suggestionRationales!');
    console.warn('⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️');
  }

  // Guard against empty suggestions or invalid index
  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-muted/20 border border-muted">
        <p className="text-sm text-muted-foreground">No suggestions available</p>
      </div>
    );
  }

  const currentSuggestion = suggestions[currentIndex] || suggestions[0];

  // Map backend apply_type to frontend type
  const mapApplyType = (
    type: 'replace' | 'add' | 'reframe' | 'elicit'
  ): 'replace' | 'insert_before' | 'insert_after' => {
    if (type === 'add') return 'insert_after';
    if (type === 'reframe') return 'replace';
    if (type === 'elicit') return 'insert_after';
    return 'replace';
  };

  // Helper to determine if content needs truncation
  const hasLongContent = (content: string) => content.length > 150;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-primary">
          Suggested Fix
        </span>
        <NavigationControls
          current={currentIndex}
          total={suggestions.length}
          onPrev={onPrev}
          onNext={onNext}
        />
      </div>

      <div className="p-4 rounded-lg bg-primary/5 border-l-4 border-primary">
        <p className="text-sm leading-relaxed text-foreground">
          {currentSuggestion.text || currentSuggestion.fix_text}
        </p>
      </div>

      {teaching && teaching.suggestionRationales && teaching.suggestionRationales[currentIndex] ? (
        // Phase 19 per-suggestion deep rationale (~800 chars, HS-friendly, segmented)
        <div className="pl-3 border-l-2 border-green-400/50">
          <p className="text-xs font-semibold text-green-500 mb-1 uppercase tracking-wide">
            Why This Works
          </p>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            {isExpanded
              ? teaching.suggestionRationales[currentIndex].whyThisWorks.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))
              : (
                  <p>
                    {teaching.suggestionRationales[currentIndex].whyThisWorks.split('\n\n')[0].slice(0, 150)}...
                  </p>
                )
            }
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm transition-all text-xs font-medium text-purple-900 dark:text-purple-100"
          >
            {isExpanded ? (
              <>
                Show less
                <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                View more
                <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      ) : (
        // Fallback: ONLY use Phase 17 rationale (skip TeachingGuidanceCard - that's for problem/impact, not suggestions)
        <div className="pl-3 border-l-2 border-green-400/50">
          <p className="text-xs font-semibold text-green-500 mb-1 uppercase tracking-wide">
            Why This Works
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isExpanded || !hasLongContent(currentSuggestion.rationale || currentSuggestion.why_this_works || '')
              ? (currentSuggestion.rationale || currentSuggestion.why_this_works)
              : `${(currentSuggestion.rationale || currentSuggestion.why_this_works || '').slice(0, 150)}...`
            }
          </p>
          {hasLongContent(currentSuggestion.rationale || currentSuggestion.why_this_works || '') && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm transition-all text-xs font-medium text-purple-900 dark:text-purple-100"
            >
              {isExpanded ? (
                <>
                  Show less
                  <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  View more
                  <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {currentSuggestion.teaching_example && (
        <div className="pl-3 border-l-2 border-muted-foreground/30">
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            Example
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            {currentSuggestion.teaching_example}
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          onClick={() =>
            onApply(
              currentSuggestion.text || currentSuggestion.fix_text,
              currentSuggestion.type || mapApplyType(currentSuggestion.apply_type)
            )
          }
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Wand2 className="w-4 h-4" />
          Apply This Edit
        </Button>
      </div>
    </div>
  );
};
