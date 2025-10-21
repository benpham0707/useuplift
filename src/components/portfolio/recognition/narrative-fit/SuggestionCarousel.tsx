import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { EditSuggestion } from './types';

interface SuggestionCarouselProps {
  suggestions: EditSuggestion[];
  currentIndex: number;
  onNext: () => void;
  onApply: (suggestionText: string) => void;
  onInsert: (suggestionText: string) => void;
}

export const SuggestionCarousel: React.FC<SuggestionCarouselProps> = ({
  suggestions,
  currentIndex,
  onNext,
  onApply,
  onInsert
}) => {
  const currentSuggestion = suggestions[currentIndex];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">✏️ Edit Suggestion {currentIndex + 1} of {suggestions.length}</h4>
      </div>

      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
        <p className="text-sm font-medium leading-relaxed">
          {currentSuggestion.text}
        </p>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {currentSuggestion.rationale}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => onApply(currentSuggestion.text)}
          size="sm"
          className="flex-1 min-w-[140px]"
        >
          Apply This Edit
        </Button>
        <Button
          onClick={() => onInsert(currentSuggestion.text)}
          variant="outline"
          size="sm"
          className="flex-1 min-w-[140px]"
        >
          Insert at Cursor
        </Button>
        {currentIndex < suggestions.length - 1 && (
          <Button
            onClick={onNext}
            variant="ghost"
            size="sm"
            className="gap-1"
          >
            Next Idea
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
