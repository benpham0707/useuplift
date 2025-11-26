import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronDown, Check, Pencil, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UC_PIQ_PROMPTS } from './PIQPromptSelector';
import GradientText from '@/components/ui/GradientText';
import { cn } from '@/lib/utils';

interface PIQCarouselNavProps {
  currentPromptId: string;
  onPromptChange?: (promptId: string) => void;
  /** If true, use URL navigation instead of callback */
  useRoutes?: boolean;
  /** Optional: map of promptId to essay status for showing completion indicators */
  essayStatus?: Record<string, 'empty' | 'draft' | 'complete'>;
}

export const PIQCarouselNav: React.FC<PIQCarouselNavProps> = ({
  currentPromptId,
  onPromptChange,
  useRoutes = true,
  essayStatus = {}
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const currentIndex = UC_PIQ_PROMPTS.findIndex(p => p.id === currentPromptId);
  const currentPrompt = UC_PIQ_PROMPTS[currentIndex];

  const handleNavigate = (prompt: typeof UC_PIQ_PROMPTS[0]) => {
    if (useRoutes) {
      navigate(`/piq-workshop/${prompt.number}`);
    } else if (onPromptChange) {
      onPromptChange(prompt.id);
    }
    setIsOpen(false);
  };

  const handlePrevious = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : UC_PIQ_PROMPTS.length - 1;
    handleNavigate(UC_PIQ_PROMPTS[prevIndex]);
  };

  const handleNext = () => {
    const nextIndex = currentIndex < UC_PIQ_PROMPTS.length - 1 ? currentIndex + 1 : 0;
    handleNavigate(UC_PIQ_PROMPTS[nextIndex]);
  };

  const handleDotClick = (index: number) => {
    handleNavigate(UC_PIQ_PROMPTS[index]);
  };

  const getStatusIcon = (promptId: string) => {
    const status = essayStatus[promptId];
    if (status === 'complete') {
      return <Check className="w-3.5 h-3.5 text-green-500" />;
    }
    if (status === 'draft') {
      return <Pencil className="w-3.5 h-3.5 text-amber-500" />;
    }
    return <FileText className="w-3.5 h-3.5 text-muted-foreground/40" />;
  };

  const getStatusBadge = (promptId: string) => {
    const status = essayStatus[promptId];
    if (status === 'complete') {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400">
          Complete
        </span>
      );
    }
    if (status === 'draft') {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
          Draft
        </span>
      );
    }
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
        Not started
      </span>
    );
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* Navigation row with pipes */}
      <div className="flex items-center justify-center gap-3 w-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevious}
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-muted-foreground/50 text-lg">|</span>
          
          {/* Dropdown trigger with gradient text */}
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer group">
                <GradientText 
                  colors={["#a855f7", "#8b5cf6", "#c084fc", "#a78bfa", "#a855f7"]}
                  className="text-xl font-bold"
                >
                  PIQ #{currentIndex + 1}: {currentPrompt?.title || 'Leadership experience'}
                </GradientText>
                <ChevronDown className={cn(
                  "w-4 h-4 text-purple-500 transition-transform duration-200",
                  isOpen && "rotate-180"
                )} />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80 p-2" 
              align="center"
              sideOffset={8}
            >
              <div className="space-y-1">
                <div className="px-2 py-1.5 mb-2">
                  <p className="text-sm font-semibold text-foreground">Select PIQ Prompt</p>
                  <p className="text-xs text-muted-foreground">Choose which essay to work on</p>
                </div>
                {UC_PIQ_PROMPTS.map((prompt, index) => {
                  const isActive = prompt.id === currentPromptId;
                  return (
                    <button
                      key={prompt.id}
                      onClick={() => handleNavigate(prompt)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                        isActive 
                          ? "bg-gradient-to-r from-purple-600/10 to-indigo-600/10 border border-purple-500/30" 
                          : "hover:bg-muted/70"
                      )}
                    >
                      {/* Number badge */}
                      <span className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0",
                        isActive 
                          ? "bg-purple-600 text-white" 
                          : "bg-muted-foreground/10 text-muted-foreground"
                      )}>
                        {prompt.number}
                      </span>
                      
                      {/* Title and status */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          isActive ? "text-purple-700 dark:text-purple-300" : "text-foreground"
                        )}>
                          {prompt.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {prompt.prompt.slice(0, 50)}...
                        </p>
                      </div>
                      
                      {/* Status indicator */}
                      <div className="flex-shrink-0">
                        {getStatusBadge(prompt.id)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
          
          <span className="text-muted-foreground/50 text-lg">|</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNext}
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Dot indicators with status */}
      <div className="flex items-center gap-2">
        {UC_PIQ_PROMPTS.map((prompt, index) => {
          const status = essayStatus[prompt.id];
          const isActive = index === currentIndex;
          
          return (
            <TooltipProvider key={prompt.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleDotClick(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      isActive
                        ? 'bg-purple-500 scale-125'
                        : status === 'complete'
                          ? 'bg-green-500/70 hover:scale-110'
                          : status === 'draft'
                            ? 'bg-amber-500/70 hover:scale-110'
                            : 'border border-muted-foreground/30 hover:border-muted-foreground/50 hover:scale-110'
                    )}
                    aria-label={`Go to PIQ ${index + 1}`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(prompt.id)}
                    <span className="text-xs">PIQ #{index + 1}: {prompt.title}</span>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
};
