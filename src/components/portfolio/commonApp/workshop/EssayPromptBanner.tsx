/**
 * Essay Prompt Banner - Integrated supplemental essay selector
 * 
 * Displays current essay prompt with dropdown navigation,
 * themed to match the editor card styling
 * 
 * PERFORMANCE: Removed TextType animation for instant rendering
 */

import React, { useState, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  FileText, 
  Check,
  Pencil
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { useCollegeData } from '@/hooks/useCollegeData';

interface EssayPromptBannerProps {
  collegeId: string;
  essayNumber: number;
  className?: string;
  /** Optional: map of promptId to essay status */
  essayStatus?: Record<string, 'empty' | 'draft' | 'complete'>;
  /**
   * Optional callback to override default route navigation.
   * When provided, switching prompts fires this callback instead of routing
   * to /common-app-workshop/:collegeId/:essayNumber.
   */
  onSelectEssay?: (essayNumber: number) => void;
}

export const EssayPromptBanner: React.FC<EssayPromptBannerProps> = memo(({
  collegeId,
  essayNumber,
  className,
  essayStatus = {},
  onSelectEssay,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Use cached college data hook for instant loading
  const { college, colors, currentPrompt } = useCollegeData(collegeId, essayNumber);

  const handleNavigate = useCallback((newEssayNumber: number) => {
    if (onSelectEssay) {
      onSelectEssay(newEssayNumber);
    } else {
      navigate(`/common-app-workshop/${collegeId}/${newEssayNumber}`);
    }
    setIsOpen(false);
  }, [navigate, collegeId, onSelectEssay]);

  const getStatusBadge = useCallback((promptId: string) => {
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
  }, [essayStatus]);

  if (!college || !currentPrompt) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200/70 dark:border-slate-700/40 bg-gradient-to-r from-cyan-50/70 via-blue-50/60 to-purple-50/70 dark:from-cyan-950/20 dark:via-blue-950/20 dark:to-purple-950/20 overflow-hidden",
        className,
      )}
    >
      {/* Essay Selector - Full Width */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 transition-colors",
            "hover:bg-white/30 dark:hover:bg-white/5"
          )}>
            {/* Left spacer for centering */}
            <div className="flex-1 flex justify-start" />

            {/* Center content: Badge + Title + Chevron */}
            <div className="flex items-center gap-2.5">
              {/* Essay Number Badge */}
              <span className={cn(
                "flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-semibold flex-shrink-0",
                "bg-white/80 text-slate-600 border border-slate-200/70",
                "dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/40"
              )}>
                {essayNumber}/{college.supplementals.length}
              </span>

              {/* Essay Title */}
              <span className="font-semibold text-[15px] text-slate-700 dark:text-slate-200">
                {currentPrompt.title}
              </span>

              {/* Chevron */}
              <ChevronDown className={cn(
                "w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0",
                isOpen && "rotate-180"
              )} />
            </div>

            {/* Word Count - Right aligned */}
            <div className="flex-1 flex justify-end">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                {currentPrompt.wordLimit} words
              </span>
            </div>
          </button>
        </PopoverTrigger>
          
          <PopoverContent 
            className="w-[calc(100vw-4rem)] max-w-2xl p-2 bg-popover border shadow-lg z-50" 
            align="center"
            sideOffset={8}
          >
            <div className="space-y-1">
              <div className="px-3 py-2.5 mb-2 rounded-lg bg-gradient-to-r from-cyan-50/70 via-blue-50/60 to-purple-50/70 dark:from-cyan-950/20 dark:via-blue-950/20 dark:to-purple-950/20 border border-slate-200/60 dark:border-slate-700/40">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{college.shortName} Supplemental Essays</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {college.supplementals.length} essay{college.supplementals.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              {college.supplementals.map((prompt) => {
                const isActive = prompt.number === essayNumber;
                
                return (
                  <button
                    key={prompt.id}
                    onClick={() => handleNavigate(prompt.number)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                      isActive 
                        ? cn("bg-gradient-to-r border", colors.bgLight, colors.bgDark, colors.borderLight, colors.borderDark)
                        : "hover:bg-muted/70"
                    )}
                  >
                    {/* Number badge */}
                    <div className="relative flex-shrink-0">
                      <span className={cn(
                        "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",
                        isActive 
                          ? cn("text-white bg-gradient-to-br", colors.gradient)
                          : "bg-muted-foreground/10 text-muted-foreground"
                      )}>
                        {prompt.number}
                      </span>
                    </div>
                    
                    {/* Title & word limit - Single Line */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        isActive ? colors.icon : "text-foreground"
                      )}>
                        {prompt.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {prompt.wordLimit} words
                      </span>
                    </div>
                    
                    {/* Status */}
                    <div className="flex-shrink-0">
                      {getStatusBadge(prompt.id)}
                    </div>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
      </Popover>

      {/* Full Prompt Text - inset within the same card, separated by hairline */}
      <div className="px-4 py-3 border-t border-slate-200/60 dark:border-slate-700/40 text-center">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {currentPrompt.prompt}
        </p>
      </div>
    </div>
  );
});

EssayPromptBanner.displayName = 'EssayPromptBanner';
