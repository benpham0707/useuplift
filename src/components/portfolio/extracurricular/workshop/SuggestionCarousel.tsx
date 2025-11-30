// @ts-nocheck - Legacy workshop file with type mismatches
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';
import { SuggestedFix, TeachingGuidance } from './types';
import { NavigationControls } from '../../NavigationControls';
import { ThemedPillButton } from '@/components/ui/ThemedPillButton';

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-primary">
          Suggested Fix Example
        </span>
        <NavigationControls
          current={currentIndex}
          total={suggestions.length}
          onPrev={onPrev}
          onNext={onNext}
          variant="purple"
        />
      </div>

      <div className="p-4 rounded-lg bg-primary/5 border-l-4 border-primary">
        <p className="text-sm leading-relaxed text-foreground">
          {currentSuggestion.text || currentSuggestion.fix_text}
        </p>
      </div>

      {/* Phase 20 Per-Suggestion Rationale (REQUIRED) */}
      <div className="pl-3 border-l-2 border-green-400/50">
        <p className="text-xs font-semibold text-green-500 mb-1 uppercase tracking-wide">
          Why This Works
        </p>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
          {(() => {
            const rationale = teaching?.suggestionRationales?.[currentIndex]?.whyThisWorks;

            if (!rationale) {
              return (
                <p className="text-yellow-700 italic">
                  Rationale unavailable. Try re-analyzing to generate suggestion explanations.
                </p>
              );
            }

            const paragraphs = rationale.split('\n\n');

            if (isExpanded) {
              return paragraphs.map((paragraph, idx) => <p key={idx}>{paragraph}</p>);
            } else {
              const preview = paragraphs[0]?.slice(0, 150) || rationale.slice(0, 150);
              return <p>{preview}...</p>;
            }
          })()}
        </div>

        {teaching?.suggestionRationales?.[currentIndex]?.whyThisWorks && (
          <ThemedPillButton
            variant="green"
            isExpanded={isExpanded}
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2"
          >
            {isExpanded ? 'Show less' : 'View more'}
          </ThemedPillButton>
        )}
      </div>

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
