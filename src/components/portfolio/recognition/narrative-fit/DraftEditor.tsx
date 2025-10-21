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
    <div className="sticky top-0 z-10 bg-background border-b p-6 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">📝 Your Draft</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="w-4 h-4 text-success" />
            <span>Autosaved</span>
          </div>
        </div>
        
        <Textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Write how you'll describe this recognition in your application..."
          className="min-h-[160px] text-sm resize-none"
        />

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress: {wordCount} words</span>
            <span>Sweet spot: {targetMin}-{targetMax} words</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => insertText('This recognition reinforces my [theme] narrative by')}
        >
          + Theme
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => insertText('(Top X of Y applicants)')}
        >
          + Selectivity
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => insertText('I led [action], which resulted in [outcome]')}
        >
          + Cause→Effect
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => insertText('which taught me that')}
        >
          + Reflection
        </Button>
      </div>
    </div>
  );
};
