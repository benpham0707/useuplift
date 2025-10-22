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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold uppercase tracking-wide text-green-600 dark:text-green-400">
          ✏️ Suggested Fix
        </span>
        <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground font-medium">
          {currentIndex + 1} of {suggestions.length}
        </span>
      </div>

      <div className="p-5 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800 shadow-sm">
        <p className="text-base font-medium leading-relaxed">
          {currentSuggestion.text}
        </p>
      </div>

      <div className="pl-6 border-l-2 border-muted">
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">💭 Why this works:</span> {currentSuggestion.rationale}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          onClick={() => onApply(currentSuggestion.text)}
          size="lg"
          className="flex-1 min-w-[160px] bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
        >
          Apply This Edit
        </Button>
        {currentIndex < suggestions.length - 1 && (
          <Button
            onClick={onNext}
            variant="outline"
            size="lg"
            className="gap-2 hover:bg-accent transition-all"
          >
            Try Next Idea ({currentIndex + 2}/{suggestions.length})
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
