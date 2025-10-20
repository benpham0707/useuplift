import React from 'react';
import { Star, GitBranch, CheckCircle, FileText, Archive } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type RecommendedUse = 'flagship' | 'bridge' | 'support' | 'footnote' | 'archive';

interface RecommendedUseLabelProps {
  use: RecommendedUse;
  className?: string;
}

const useConfig = {
  flagship: {
    label: 'FLAGSHIP',
    icon: Star,
    description: 'Lead credentials that define your narrative. Use in Activity #1, first honors entry, and as credibility anchors in essays.',
    className: 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
  },
  bridge: {
    label: 'BRIDGE',
    icon: GitBranch,
    description: 'Strong supporting credentials that connect themes. Use in Activities #2-3, honors section, and as supporting evidence in supplements.',
    className: 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
  },
  support: {
    label: 'SUPPORT',
    icon: CheckCircle,
    description: 'Credentials that validate existing themes. List in honors section but don\'t emphasize. Group similar awards together.',
    className: 'border-2 border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300'
  },
  footnote: {
    label: 'FOOTNOTE',
    icon: FileText,
    description: 'Include only if space allows. List briefly in honors section, grouped with similar recognitions.',
    className: 'border-2 border-gray-400 bg-gray-50 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400'
  },
  archive: {
    label: 'ARCHIVE',
    icon: Archive,
    description: 'Consider omitting from application. Redundant with higher-tier awards or misaligned with narrative spine.',
    className: 'border-2 border-gray-300 bg-gray-50 dark:bg-gray-900/30 text-gray-500 dark:text-gray-500'
  }
};

export const RecommendedUseLabel: React.FC<RecommendedUseLabelProps> = ({ use, className }) => {
  const config = useConfig[use];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all hover:scale-105',
            config.className,
            className
          )}>
            <Icon className="h-3.5 w-3.5" />
            <span>{config.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
