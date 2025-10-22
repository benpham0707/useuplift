import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface DraftEditorProps {
  draft: string;
  onDraftChange: (draft: string) => void;
  wordCount: number;
}

export const DraftEditor: React.FC<DraftEditorProps> = ({ draft, onDraftChange, wordCount }) => {
  const targetMin = 90;
  const targetMax = 170;
  const progress = Math.min((wordCount / targetMax) * 100, 100);
  
  const getProgressColor = () => {
    if (wordCount < targetMin) return 'bg-warning';
    if (wordCount > targetMax) return 'bg-destructive';
    return 'bg-success';
  };

  const insertText = (text: string) => {
    onDraftChange(draft + (draft.endsWith(' ') ? '' : ' ') + text);
  };

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-md">
      <div className="max-w-4xl mx-auto p-8 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">📝 Your Draft</h3>
            <div className="text-xs text-muted-foreground">
              ✓ Autosaved
            </div>
          </div>
          <Textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder="Write about your recognition here... Aim for 90-170 words with specific metrics, selectivity context, and thematic connection."
            className="min-h-[180px] text-base leading-relaxed resize-none"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${
                wordCount < 90 ? 'text-yellow-600 dark:text-yellow-400' : 
                wordCount > 170 ? 'text-red-600 dark:text-red-400' : 
                'text-green-600 dark:text-green-400'
              }`}>
                {wordCount} words
              </span>
              <span className="text-muted-foreground">
                • Sweet spot: 90-170
              </span>
              {wordCount >= 90 && wordCount <= 170 && (
                <span className="text-green-600 dark:text-green-400">✓ Perfect</span>
              )}
            </div>
            <div className="h-2.5 w-full max-w-md bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  wordCount < 90 ? 'bg-yellow-500' : 
                  wordCount > 170 ? 'bg-red-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min((wordCount / 170) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Quick Insert:</p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => insertText('This directly reinforces my [theme name] narrative. ')}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              + Theme
            </Button>
            <Button
              onClick={() => insertText('(Top X of Y applicants) ')}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              + Selectivity
            </Button>
            <Button
              onClick={() => insertText('which resulted in ')}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              + Cause→Effect
            </Button>
            <Button
              onClick={() => insertText('This experience taught me ')}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              + Reflection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
