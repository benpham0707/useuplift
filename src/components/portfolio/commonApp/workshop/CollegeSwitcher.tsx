import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Check, Clock, LayoutGrid, TrendingUp, Trophy, GraduationCap, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { COMMON_APP_COLLEGES, type CommonAppCollege } from '@/data/commonAppColleges';
import { getCollegeColors, getCollegeBorderClasses } from '@/data/collegeColors';
import { getCollegeProfile } from '@/data/commonAppCollegeProfiles';
import { getCollegeLogo, getCollegesByRank, CollegeLogoData } from '@/data/collegeLogos';
import { CollegeLogo } from '@/components/ui/CollegeLogo';
import { cn } from '@/lib/utils';

// Entrance animation: CSS-only stagger. Replaces per-card framer-motion +
// IntersectionObserver (which kept 30+ subscribers live during scroll). The
// cubic-bezier matches the spring(320, 26, 0.6) shape closely enough that the
// bounce-in feels identical, and the work happens entirely on the compositor.
const ENTRANCE_KEYFRAMES_ID = '__college-card-entrance-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(ENTRANCE_KEYFRAMES_ID)) {
  const style = document.createElement('style');
  style.id = ENTRANCE_KEYFRAMES_ID;
  style.textContent = `
    @keyframes collegeCardEntrance {
      from { opacity: 0; transform: translate3d(0, 16px, 0) scale(0.96); }
      to   { opacity: 1; transform: translate3d(0, 0,    0) scale(1); }
    }
    .college-card-enter {
      animation: collegeCardEntrance 360ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
      animation-delay: var(--card-delay, 0ms);
      will-change: transform, opacity;
    }
    /* Glare/sheen on hover. A "dark/light/dark" sandwich gradient gives
       the highlight visible contrast even on near-white pastel cards
       (pure white on near-white washes out). The 105deg gradient angle
       slopes the band like a real reflection without using transform-skew
       (which complicates traversal math). Linear motion at 1100ms lets
       the eye actually track the glint across rather than catching only
       the trailing edge. */
    .college-card-sheen {
      position: absolute;
      inset: 0;
      pointer-events: none;
      transform: translateX(-110%);
      opacity: 0;
      background: linear-gradient(
        105deg,
        transparent 30%,
        rgba(0, 0, 0, 0.07) 41%,             /* leading shadow */
        rgba(255, 255, 255, 0.0) 47%,
        rgba(255, 255, 255, 1.0) 50%,        /* specular peak */
        rgba(255, 255, 255, 0.0) 53%,
        rgba(0, 0, 0, 0.07) 59%,             /* trailing shadow */
        transparent 70%
      );
    }
    .dark .college-card-sheen {
      background: linear-gradient(
        105deg,
        transparent 30%,
        rgba(0, 0, 0, 0.20) 41%,
        rgba(255, 255, 255, 0.0) 47%,
        rgba(255, 255, 255, 0.55) 50%,
        rgba(255, 255, 255, 0.0) 53%,
        rgba(0, 0, 0, 0.20) 59%,
        transparent 70%
      );
    }
    .group:hover > .college-card-sheen {
      animation: collegeCardSheen 1100ms linear;
    }
    @keyframes collegeCardSheen {
      0%   { transform: translateX(-110%); opacity: 0; }
      8%   { opacity: 1; }
      92%  { opacity: 1; }
      100% { transform: translateX(110%);  opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .college-card-enter { animation: none; }
      .group:hover > .college-card-sheen { animation: none; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Lock pointer events on the grid while the user is actively wheel/touch
 * scrolling the dialog. Without this, the cursor passes over ~30 cards in
 * sequence as the list scrolls under it, each firing a 300ms hover transition
 * + 700ms gradient-sweep — a stacked paint storm on every scroll. With it, the
 * grid is inert mid-scroll and resumes hover instantly on idle.
 */
/**
 * Returns a callback ref. When the element mounts (dialog opens), walk up to
 * the scrollable ancestor and attach a scroll listener that toggles
 * `pointer-events:none` on the grid for ~120ms after each scroll event.
 *
 * Why callback ref (not useEffect): `CollegeSwitcher` mounts while the Dialog
 * is closed, so a useEffect with empty deps would run with `ref.current=null`
 * and never re-run when the user later opens the dialog.
 *
 * Why the rAF retry: Radix ScrollArea sets `overflow:scroll` on its viewport
 * via its own JS during mount; that may not have applied yet at the moment
 * our ref fires. We retry up to twice on subsequent frames.
 *
 * Why this matters: wheel-scrolling through ~30 cards drags the cursor across
 * each in sequence, firing `mouseenter`/`mouseleave` per card. Without the
 * lockout, each card runs its 300ms hover transition + the 700ms gradient
 * sweep simultaneously — a stacked paint storm. Locked, the grid is inert
 * mid-scroll and resumes hover instantly on idle.
 */
function useHoverLockDuringScroll<T extends HTMLElement>(): (el: T | null) => void {
  const cleanupRef = useRef<(() => void) | null>(null);
  return React.useCallback((el: T | null) => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (!el) return;

    // Find the scrollable ancestor. Recognize Radix ScrollArea viewports by
    // their data attribute (their `overflow` style is set by Radix's own JS,
    // which may not have applied yet at ref-attach time), then fall back to
    // a generic computed-style check.
    const findScroller = (): HTMLElement | null => {
      let cur: HTMLElement | null = el.parentElement;
      while (cur) {
        if (cur.hasAttribute('data-radix-scroll-area-viewport')) return cur;
        const cs = window.getComputedStyle(cur);
        if (cs.overflowY === 'auto' || cs.overflowY === 'scroll') return cur;
        cur = cur.parentElement;
      }
      return null;
    };

    // Setup may need to wait for Radix to finish mounting. Try now, then on
    // the next frame, then once more — give up after that.
    let attempt = 0;
    let cancelRaf: number | undefined;
    let listenerScroller: HTMLElement | null = null;
    let timeoutId: number | undefined;
    const onScroll = () => {
      el.style.pointerEvents = 'none';
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => { el.style.pointerEvents = ''; }, 120);
    };
    const trySetup = () => {
      const scroller = findScroller();
      if (scroller) {
        listenerScroller = scroller;
        scroller.addEventListener('scroll', onScroll, { passive: true });
        return;
      }
      if (++attempt < 3) {
        cancelRaf = requestAnimationFrame(trySetup);
      }
    };
    trySetup();

    cleanupRef.current = () => {
      if (cancelRaf !== undefined) cancelAnimationFrame(cancelRaf);
      if (listenerScroller) listenerScroller.removeEventListener('scroll', onScroll);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      el.style.pointerEvents = '';
    };
  }, []);
}

interface CollegeProgress {
  completed: number;
  total: number;
  alignmentScore?: number;
}

const getStatusColor = (progress: CollegeProgress) => {
  if (progress.completed === progress.total && progress.total > 0) return 'text-green-600 dark:text-green-400';
  if (progress.completed > 0) return 'text-amber-600 dark:text-amber-400';
  return 'text-muted-foreground';
};

interface AnimatedCollegeCardProps {
  collegeId: string;
  logoData: CollegeLogoData;
  index: number;
  isActive: boolean;
  progress: CollegeProgress;
  onSelect: (collegeId: string) => void;
}

// Module scope + React.memo so identity is stable across parent re-renders
// (search typing, tab switches) and unchanged cards skip re-render entirely.
// Entrance animation is CSS-driven (see ENTRANCE_KEYFRAMES_ID above) — no
// framer-motion or IntersectionObserver per card, which previously kept 30+
// JS subscribers live during scroll.
const AnimatedCollegeCard = React.memo<AnimatedCollegeCardProps>(({
  collegeId,
  logoData,
  index,
  isActive,
  progress,
  onSelect,
}) => {
  const profile = getCollegeProfile(collegeId);
  const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
  const isComplete = progress.completed === progress.total && progress.total > 0;
  const entranceDelay = `${Math.min(index * 40, 240)}ms`;

  return (
    <div
      className="h-full college-card-enter"
      style={{ ['--card-delay' as string]: entranceDelay }}
    >
      <button
        onClick={() => onSelect(collegeId)}
        className={cn(
          "w-full h-full text-left p-4 rounded-xl group relative",
          // Scoped transitions: only the props that actually change on hover.
          // `transition-all` previously animated every property, expanding the
          // invalidation surface on every paint.
          "transition-[box-shadow,border-color] duration-300",
          "bg-gradient-to-br from-purple-50/80 via-pink-50/60 to-purple-100/50",
          "dark:from-purple-950/40 dark:via-pink-950/30 dark:to-purple-900/40",
          "border border-purple-200/60 dark:border-purple-500/30",
          "backdrop-blur-sm",
          "overflow-hidden",
          "hover:shadow-lg hover:shadow-purple-500/20 dark:hover:shadow-purple-500/10",
          "hover:border-purple-300/80 dark:hover:border-purple-400/40",
          isActive && [
            "ring-2 ring-purple-400/60 ring-offset-2 ring-offset-background",
            "bg-gradient-to-br from-purple-100/90 via-pink-100/80 to-purple-200/70",
            "dark:from-purple-900/60 dark:via-pink-900/50 dark:to-purple-800/60",
            "border-purple-400/70 dark:border-purple-400/50"
          ]
        )}
      >
        <div className="college-card-sheen" aria-hidden />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-400/5 via-transparent to-pink-400/5 pointer-events-none" />

        <div className="relative flex items-start gap-3">
          <div className="flex-shrink-0 relative">
            <div className="p-1 rounded-lg bg-white/80 dark:bg-white/10 shadow-sm">
              <CollegeLogo collegeId={collegeId} size="lg" className="rounded-md" />
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
              <span className="text-[9px] font-bold text-white">#{logoData.usNewsRank}</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate text-purple-900 dark:text-purple-100 group-hover:text-purple-700 dark:group-hover:text-purple-200 transition-colors">
                {logoData.shortName}
              </h3>
              {isActive && (
                <Badge className="text-[10px] px-1.5 py-0 bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300/50">
                  Current
                </Badge>
              )}
              {isComplete && (
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
            </div>

            <p className="text-[11px] text-purple-700/70 dark:text-purple-300/70 truncate mt-0.5">
              {logoData.name}
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span className={cn("text-xs font-medium", getStatusColor(progress))}>
                {progress.completed}/{progress.total} essays
              </span>
              {progress.alignmentScore !== undefined && (
                <>
                  <span className="text-purple-400/50">•</span>
                  <span className="text-xs text-purple-600/70 dark:text-purple-400/70 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    {progress.alignmentScore}%
                  </span>
                </>
              )}
            </div>

            <div className="mt-2 h-1.5 bg-purple-200/50 dark:bg-purple-800/30 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isComplete
                    ? "bg-gradient-to-r from-green-400 to-emerald-500"
                    : "bg-gradient-to-r from-purple-400 to-pink-400"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {profile && (
              <p className="mt-1.5 text-[10px] text-purple-600/60 dark:text-purple-400/60 truncate">
                <span className="font-medium">Core:</span> {profile.valueWeights[0]?.name} ({profile.valueWeights[0]?.weight}%)
              </p>
            )}
          </div>
        </div>
      </button>
    </div>
  );
});
AnimatedCollegeCard.displayName = 'AnimatedCollegeCard';

interface CollegeSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCollegeId: string;
  onSelectCollege: (collegeId: string) => void;
  /** Map of collegeId to progress data */
  collegeProgress?: Record<string, CollegeProgress>;
}

// HARD-CODED: Mock deadline groups for demonstration
// In production, this would come from user's application data
const DEADLINE_GROUPS = {
  early: {
    label: 'Early Decision/Action (Nov 1-15)',
    colleges: ['stanford', 'harvard', 'yale', 'princeton'],
  },
  regular: {
    label: 'Regular Decision (Jan 1-15)',
    colleges: ['mit', 'columbia', 'brown', 'upenn', 'cornell', 'dartmouth'],
  },
};

export const CollegeSwitcher: React.FC<CollegeSwitcherProps> = ({
  open,
  onOpenChange,
  currentCollegeId,
  onSelectCollege,
  collegeProgress = {},
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'rank' | 'deadline'>('rank');

  // One ref per scrollable grid — each finds its own ScrollArea ancestor
  // and toggles pointer-events:none during active scroll.
  const rankGridRef = useHoverLockDuringScroll<HTMLDivElement>();
  const deadlineGridRef = useHoverLockDuringScroll<HTMLDivElement>();

  // Get all colleges from logo system sorted by rank
  const rankedColleges = useMemo(() => getCollegesByRank(), []);

  // Calculate portfolio stats
  const portfolioStats = useMemo(() => {
    let totalColleges = rankedColleges.length;
    let startedColleges = 0;
    let completedColleges = 0;
    let totalEssays = 0;
    let completedEssays = 0;

    rankedColleges.forEach(({ id }) => {
      const college = COMMON_APP_COLLEGES.find(c => c.id === id);
      const progress = collegeProgress[id];
      const total = progress?.total || college?.supplementals.length || 3;
      const completed = progress?.completed || 0;
      
      totalEssays += total;
      completedEssays += completed;
      
      if (completed > 0) startedColleges++;
      if (completed === total && total > 0) completedColleges++;
    });

    return { totalColleges, startedColleges, completedColleges, totalEssays, completedEssays };
  }, [collegeProgress, rankedColleges]);

  // Filter colleges based on search
  const filteredColleges = useMemo(() => {
    if (!searchQuery.trim()) return rankedColleges;
    const query = searchQuery.toLowerCase();
    return rankedColleges.filter(
      ({ data }) =>
        data.name.toLowerCase().includes(query) ||
        data.shortName.toLowerCase().includes(query)
    );
  }, [searchQuery, rankedColleges]);

  // Group colleges by deadline
  const collegesByDeadline = useMemo(() => {
    const grouped: Record<string, Array<{ id: string; data: CollegeLogoData }>> = {};
    
    Object.entries(DEADLINE_GROUPS).forEach(([key, group]) => {
      const colleges = filteredColleges.filter(({ id }) => 
        group.colleges.includes(id)
      );
      if (colleges.length > 0) {
        grouped[key] = colleges;
      }
    });

    // Add "Other" group for colleges not in deadline groups
    const groupedIds = Object.values(DEADLINE_GROUPS).flatMap(g => g.colleges);
    const otherColleges = filteredColleges.filter(({ id }) => !groupedIds.includes(id));
    if (otherColleges.length > 0) {
      grouped['other'] = otherColleges;
    }

    return grouped;
  }, [filteredColleges]);

  const getProgress = React.useCallback((collegeId: string): CollegeProgress => {
    const college = COMMON_APP_COLLEGES.find(c => c.id === collegeId);
    return collegeProgress[collegeId] || {
      completed: 0,
      total: college?.supplementals.length || 3,
    };
  }, [collegeProgress]);

  const handleSelect = React.useCallback((nextCollegeId: string) => {
    onSelectCollege(nextCollegeId);
    onOpenChange(false);
  }, [onSelectCollege, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col bg-background p-4 [&>button]:hidden">
        {/* Search + Close Button Row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search colleges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex-shrink-0 p-2 rounded-lg transition-all border border-purple-300/60 dark:border-purple-500/40 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/30 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/50 dark:hover:to-pink-900/40 shadow-[0_0_12px_-3px_rgba(168,85,247,0.3)]"
          >
            <X className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </button>
        </div>

        {/* View Toggle */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'rank' | 'deadline')}>
          <TabsList className="w-full h-11 p-1 bg-gradient-to-r from-purple-100/80 via-pink-100/60 to-purple-100/80 dark:from-purple-900/40 dark:via-pink-900/30 dark:to-purple-900/40 border border-purple-200/50 dark:border-purple-700/40 rounded-xl">
            <TabsTrigger 
              value="rank" 
              className="flex-1 h-full gap-1.5 rounded-lg text-purple-700 dark:text-purple-300 data-[state=active]:bg-white dark:data-[state=active]:bg-purple-800/60 data-[state=active]:text-purple-900 dark:data-[state=active]:text-purple-100 data-[state=active]:shadow-md transition-all"
            >
              <Trophy className="w-3.5 h-3.5" />
              By US News Rank
            </TabsTrigger>
            <TabsTrigger 
              value="deadline" 
              className="flex-1 h-full gap-1.5 rounded-lg text-purple-700 dark:text-purple-300 data-[state=active]:bg-white dark:data-[state=active]:bg-purple-800/60 data-[state=active]:text-purple-900 dark:data-[state=active]:text-purple-100 data-[state=active]:shadow-md transition-all"
            >
              <Clock className="w-3.5 h-3.5" />
              By Deadline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rank" className="mt-4">
            <ScrollArea className="h-[65vh]">
              {/* Outer padding for hover scale breathing room + symmetric alignment */}
              <div ref={rankGridRef} className="p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredColleges.map(({ id, data }, index) => (
                    <AnimatedCollegeCard
                      key={id}
                      collegeId={id}
                      logoData={data}
                      index={index}
                      isActive={id === currentCollegeId}
                      progress={getProgress(id)}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
                {filteredColleges.length === 0 && (
                  <div className="text-center py-12 text-purple-400/60">
                    <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No colleges found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="deadline" className="mt-4">
            <ScrollArea className="h-[65vh]">
              {/* Outer padding for hover scale breathing room + symmetric alignment */}
              <div ref={deadlineGridRef} className="p-3 space-y-6">
                {Object.entries(collegesByDeadline).map(([key, colleges], groupIndex) => (
                  <div key={key}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded-lg bg-purple-100/80 dark:bg-purple-900/40">
                        <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                        {key === 'early' ? DEADLINE_GROUPS.early.label :
                         key === 'regular' ? DEADLINE_GROUPS.regular.label :
                         'Other Deadlines'}
                      </h3>
                      <Badge className="text-[10px] bg-purple-100/80 dark:bg-purple-800/40 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-700/40">
                        {colleges.length} schools
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {colleges.map(({ id, data }, index) => (
                        <AnimatedCollegeCard
                          key={id}
                          collegeId={id}
                          logoData={data}
                          index={groupIndex * 4 + index}
                          isActive={id === currentCollegeId}
                          progress={getProgress(id)}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(collegesByDeadline).length === 0 && (
                  <div className="text-center py-12 text-purple-400/60">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No colleges match your search</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
