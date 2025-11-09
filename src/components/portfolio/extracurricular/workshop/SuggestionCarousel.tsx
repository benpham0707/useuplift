import React from 'react';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';
import { SuggestedFix } from './types';
import { NavigationControls } from '../../NavigationControls';

interface SuggestionCarouselProps {
  suggestions: SuggestedFix[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onApply: (
    suggestionText: string,
    type: 'replace' | 'insert_before' | 'insert_after'
  ) => void;
}

export const SuggestionCarousel: React.FC<SuggestionCarouselProps> = ({
  suggestions,
  currentIndex,
  onNext,
  onPrev,
  onApply
}) => {
  const currentSuggestion = suggestions[currentIndex];

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
          {currentSuggestion.fix_text}
        </p>
      </div>

      <div className="pl-3 border-l-2 border-primary/30">
        <p className="text-xs font-semibold text-primary mb-1">
          Why This Works
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {currentSuggestion.why_this_works}
        </p>
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
              currentSuggestion.fix_text,
              mapApplyType(currentSuggestion.apply_type)
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
