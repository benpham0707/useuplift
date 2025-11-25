import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UC_PIQ_PROMPTS } from './PIQPromptSelector';

interface PIQCarouselNavProps {
  currentPromptId: string;
  onPromptChange: (promptId: string) => void;
}

export const PIQCarouselNav: React.FC<PIQCarouselNavProps> = ({
  currentPromptId,
  onPromptChange
}) => {
  const currentIndex = UC_PIQ_PROMPTS.findIndex(p => p.id === currentPromptId);
  const currentPrompt = UC_PIQ_PROMPTS[currentIndex];

  const handlePrevious = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : UC_PIQ_PROMPTS.length - 1;
    onPromptChange(UC_PIQ_PROMPTS[prevIndex].id);
  };

  const handleNext = () => {
    const nextIndex = currentIndex < UC_PIQ_PROMPTS.length - 1 ? currentIndex + 1 : 0;
    onPromptChange(UC_PIQ_PROMPTS[nextIndex].id);
  };

  const handleDotClick = (index: number) => {
    onPromptChange(UC_PIQ_PROMPTS[index].id);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Navigation row with pipes */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevious}
          className="h-7 w-7 p-0 hover:bg-muted"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground/50">|</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-default whitespace-nowrap">
                  PIQ #{currentIndex + 1}: {currentPrompt?.title.split(' ')[0] || 'Leadership'}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">{currentPrompt?.title}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="text-muted-foreground/50">|</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNext}
          className="h-7 w-7 p-0 hover:bg-muted"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center gap-1.5">
        {UC_PIQ_PROMPTS.map((prompt, index) => (
          <TooltipProvider key={prompt.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleDotClick(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-purple-500 scale-125'
                      : 'border border-muted-foreground/30 hover:border-muted-foreground/50 hover:scale-110'
                  }`}
                  aria-label={`Go to PIQ ${index + 1}`}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">PIQ #{index + 1}: {prompt.title}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};
