/**
 * Common App Prompt Selector — annotation-v2 editor adapter
 *
 * Composes the real Common App workshop components transferred from the
 * production Common App workshop project:
 *
 *   • <EssayPromptBanner />  — gradient prompt banner with chevron-down popover
 *                               listing all of the current college's supplementals
 *   • <CollegeSwitcher />    — fullscreen Dialog with searchable, ranked /
 *                               deadline-grouped college cards
 *
 * The banner is wired to local state (via `onSelectEssay`) instead of routing
 * to /common-app-workshop/:collegeId/:essayNumber, so the editor can switch
 * essays in-place. A "Switch college" trigger above the banner opens the
 * CollegeSwitcher dialog.
 */

import * as React from 'react';
import { useCallback, useState } from 'react';
import { GraduationCap, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EssayPromptBanner } from '@/components/portfolio/commonApp/workshop/EssayPromptBanner';
import { CollegeSwitcher } from '@/components/portfolio/commonApp/workshop/CollegeSwitcher';
import { useCollegeData } from '@/hooks/useCollegeData';
import { COMMON_APP_COLLEGES } from '@/data/commonAppColleges';
import { CollegeLogo } from '@/components/ui/CollegeLogo';

// Re-export defaults for the page wiring.
export const DEFAULT_COLLEGE_ID = COMMON_APP_COLLEGES[0]?.id ?? 'stanford';
export const DEFAULT_ESSAY_NUMBER = 1;

// Back-compat with the prior page wiring (which passed schoolId / promptId).
export const DEFAULT_SCHOOL_ID = DEFAULT_COLLEGE_ID;
export const DEFAULT_PROMPT_ID = `${DEFAULT_COLLEGE_ID}-${DEFAULT_ESSAY_NUMBER}`;

interface CommonAppPromptSelectorProps {
  /** Which college's supplementals are shown. */
  collegeId: string;
  /** Which supplemental is active (1-indexed, matches `supplementals[].number`). */
  essayNumber: number;
  onChange: (next: { collegeId: string; essayNumber: number }) => void;
  className?: string;
  essayStatus?: Record<string, 'empty' | 'draft' | 'complete'>;
}

export const CommonAppPromptSelector: React.FC<CommonAppPromptSelectorProps> = ({
  collegeId,
  essayNumber,
  onChange,
  className,
  essayStatus,
}) => {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const { college, colors } = useCollegeData(collegeId, essayNumber);

  const handleSelectCollege = useCallback(
    (nextCollegeId: string) => {
      onChange({ collegeId: nextCollegeId, essayNumber: 1 });
      setSwitcherOpen(false);
    },
    [onChange],
  );

  const handleSelectEssay = useCallback(
    (nextEssayNumber: number) => {
      onChange({ collegeId, essayNumber: nextEssayNumber });
    },
    [onChange, collegeId],
  );

  return (
    <div className={cn('space-y-3', className)}>
      {/* College identity row — click to open the CollegeSwitcher Dialog */}
      <button
        type="button"
        onClick={() => setSwitcherOpen(true)}
        className={cn(
          'group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left',
          'bg-gradient-to-r from-purple-50/70 via-pink-50/40 to-purple-50/70',
          'dark:from-purple-950/30 dark:via-pink-950/20 dark:to-purple-950/30',
          'border border-purple-200/60 dark:border-purple-700/40',
          'hover:from-purple-100/80 hover:via-pink-100/60 hover:to-purple-100/80',
          'hover:border-purple-300/80 dark:hover:border-purple-500/50',
          'hover:shadow-[0_0_18px_-6px_rgba(168,85,247,0.35)]',
        )}
      >
        <CollegeLogo collegeId={collegeId} size="sm" className="flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <GraduationCap className={cn('w-3 h-3', colors.icon)} />
            <span className={cn('text-[10px] font-semibold uppercase tracking-wider', colors.icon)}>
              Application
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground truncate">
            {college?.name ?? collegeId}
          </p>
        </div>
        <span className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-300 opacity-70 group-hover:opacity-100 transition-opacity">
          <ArrowLeftRight className="w-3 h-3" />
          Switch
        </span>
      </button>

      {/* Prompt banner — gradient button + popover with all supplementals */}
      <EssayPromptBanner
        collegeId={collegeId}
        essayNumber={essayNumber}
        essayStatus={essayStatus}
        onSelectEssay={handleSelectEssay}
      />

      {/* Fullscreen searchable college picker */}
      <CollegeSwitcher
        open={switcherOpen}
        onOpenChange={setSwitcherOpen}
        currentCollegeId={collegeId}
        onSelectCollege={handleSelectCollege}
      />
    </div>
  );
};

export default CommonAppPromptSelector;
