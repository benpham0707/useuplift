import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronDown, Check, Pencil, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';
import GradientText from '@/components/ui/GradientText';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface ActivityItem {
  id: string;
  title: string;
  tier: 1 | 2 | 3 | 4;
  teachingDepth?: 'deep' | 'medium' | 'quick';
}

interface ActivityCarouselNavProps {
  activities: ActivityItem[];
  currentActivityId: string;
  onActivityChange: (activityId: string) => void;
  /** Optional: map of activityId to status for showing completion indicators */
  activityStatus?: Record<string, 'empty' | 'draft' | 'complete'>;
}

// ============================================================================
// TIER BADGE CONFIG
// ============================================================================

const TIER_CONFIG: Record<number, { label: string; color: string; bg: string; border: string }> = {
  1: { label: 'T1', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-950/50', border: 'border-amber-300 dark:border-amber-700' },
  2: { label: 'T2', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-950/50', border: 'border-blue-300 dark:border-blue-700' },
  3: { label: 'T3', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-950/50', border: 'border-green-300 dark:border-green-700' },
  4: { label: 'T4', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-300 dark:border-gray-600' },
};

const TIER_DOT_COLORS: Record<number, string> = {
  1: 'bg-amber-500',
  2: 'bg-blue-500',
  3: 'bg-green-500',
  4: 'bg-gray-400',
};

// ============================================================================
// COMPONENT
// ============================================================================

export const ActivityCarouselNav: React.FC<ActivityCarouselNavProps> = ({
  activities,
  currentActivityId,
  onActivityChange,
  activityStatus = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentIndex = activities.findIndex(a => a.id === currentActivityId);
  const currentActivity = activities[currentIndex];

  const handleNavigate = (activity: ActivityItem) => {
    onActivityChange(activity.id);
    setIsOpen(false);
  };

  const handlePrevious = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : activities.length - 1;
    handleNavigate(activities[prevIndex]);
  };

  const handleNext = () => {
    const nextIndex = currentIndex < activities.length - 1 ? currentIndex + 1 : 0;
    handleNavigate(activities[nextIndex]);
  };

  const getStatusIcon = (activityId: string) => {
    const status = activityStatus[activityId];
    if (status === 'complete') return <Check className="w-3.5 h-3.5 text-green-500" />;
    if (status === 'draft') return <Pencil className="w-3.5 h-3.5 text-amber-500" />;
    return <FileText className="w-3.5 h-3.5 text-muted-foreground/40" />;
  };

  const getStatusBadge = (activityId: string) => {
    const status = activityStatus[activityId];
    if (status === 'complete') {
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400">Complete</span>;
    }
    if (status === 'draft') {
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">Draft</span>;
    }
    return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Not started</span>;
  };

  const tierConfig = currentActivity ? TIER_CONFIG[currentActivity.tier] : TIER_CONFIG[4];

  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* Navigation row with pipes */}
      <div className="flex items-center justify-center gap-3 w-full">
        <Button variant="ghost" size="sm" onClick={handlePrevious} className="h-8 w-8 p-0 hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-muted-foreground/50 text-lg">|</span>

          {/* Dropdown trigger with gradient text */}
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer group whitespace-nowrap">
                <GradientText
                  colors={["#3b82f6", "#6366f1", "#818cf8", "#60a5fa", "#3b82f6"]}
                  className="text-lg font-bold whitespace-nowrap"
                >
                  {currentActivity?.title || 'Activity'}
                </GradientText>
                {currentActivity && (
                  <Badge variant="outline" className={cn("text-[10px] font-bold px-1.5 py-0 h-5", tierConfig.color, tierConfig.bg, tierConfig.border)}>
                    {tierConfig.label}
                  </Badge>
                )}
                <ChevronDown className={cn(
                  "w-4 h-4 text-blue-500 transition-transform duration-200 flex-shrink-0",
                  isOpen && "rotate-180"
                )} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="center" sideOffset={8}>
              <div className="space-y-1">
                <div className="px-2 py-1.5 mb-2">
                  <p className="text-sm font-semibold text-foreground">Select Activity</p>
                  <p className="text-xs text-muted-foreground">Choose which activity to work on</p>
                </div>
                {activities.map((activity, index) => {
                  const isActive = activity.id === currentActivityId;
                  const tc = TIER_CONFIG[activity.tier];
                  return (
                    <button
                      key={activity.id}
                      onClick={() => handleNavigate(activity)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                        isActive
                          ? "bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/30"
                          : "hover:bg-muted/70"
                      )}
                    >
                      {/* Number badge */}
                      <span className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0",
                        isActive
                          ? "bg-blue-600 text-white"
                          : "bg-muted-foreground/10 text-muted-foreground"
                      )}>
                        {index + 1}
                      </span>

                      {/* Title and tier */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            isActive ? "text-blue-700 dark:text-blue-300" : "text-foreground"
                          )}>
                            {activity.title}
                          </p>
                          <Badge variant="outline" className={cn("text-[9px] font-bold px-1 py-0 h-4 flex-shrink-0", tc.color, tc.bg, tc.border)}>
                            {tc.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div className="flex-shrink-0">
                        {getStatusBadge(activity.id)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground/50 text-lg">|</span>
        </div>

        <Button variant="ghost" size="sm" onClick={handleNext} className="h-8 w-8 p-0 hover:bg-muted">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Dot indicators with tier colors */}
      <div className="flex items-center gap-2">
        {activities.map((activity, index) => {
          const isActive = index === currentIndex;
          const status = activityStatus[activity.id];

          return (
            <TooltipProvider key={activity.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleNavigate(activity)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      isActive
                        ? `${TIER_DOT_COLORS[activity.tier]} scale-125`
                        : status === 'complete'
                          ? 'bg-green-500/70 hover:scale-110'
                          : status === 'draft'
                            ? 'bg-amber-500/70 hover:scale-110'
                            : 'border border-muted-foreground/30 hover:border-muted-foreground/50 hover:scale-110'
                    )}
                    aria-label={`Go to activity ${index + 1}`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(activity.id)}
                    <span className="text-xs">#{index + 1}: {activity.title}</span>
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
