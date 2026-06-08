import React, { memo, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  MousePointerClick,
  Target,
  PenTool,
  XCircle,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CollegeLogo } from '@/components/ui/CollegeLogo';
import { getCollegeBgClasses, getCollegeBorderClasses } from '@/data/collegeColors';
import { useCollegeData } from '@/hooks/useCollegeData';
import { cn } from '@/lib/utils';
import { RandomizingScore } from '@/components/portfolio/piq/workshop/RandomizingScore';
import type { RubricDimension } from '@/components/portfolio/extracurricular/workshop/types';

interface EnhancedCollegeHeaderProps {
  collegeId: string;
  collegeName: string;
  essayProgress: {
    completed: number;
    total: number;
  };
  onClick: () => void;
  
  // Analysis State
  dimensions: RubricDimension[];
  currentScore: number;
  initialScore: number;
  isAnalyzing: boolean;
  hasAnalysis: boolean;
  
  // Navigation handler
  onScrollToDimension: (dimensionId: string) => void;
}

export const EnhancedCollegeHeader: React.FC<EnhancedCollegeHeaderProps> = memo(({
  collegeId,
  collegeName,
  essayProgress,
  onClick,
  dimensions,
  currentScore,
  initialScore,
  isAnalyzing,
  hasAnalysis,
  onScrollToDimension,
}) => {
  // Use cached college data
  const { colors, profile } = useCollegeData(collegeId);
  
  // Computed values
  const progressPercent = useMemo(() => 
    essayProgress.total > 0 
      ? (essayProgress.completed / essayProgress.total) * 100 
      : 0,
    [essayProgress.completed, essayProgress.total]
  );

  // Analysis computations
  const totalIssues = useMemo(() => 
    dimensions.reduce((sum, d) => sum + d.issues.length, 0),
    [dimensions]
  );
  
  const fixedIssues = useMemo(() => 
    dimensions.reduce((sum, d) => sum + d.issues.filter(i => i.status === 'fixed').length, 0),
    [dimensions]
  );

  const criticalDimensions = useMemo(() => 
    dimensions.filter(d => d.status === 'critical'),
    [dimensions]
  );
  
  const needsWorkDimensions = useMemo(() => 
    dimensions.filter(d => d.status === 'needs_work'),
    [dimensions]
  );
  
  const goodDimensions = useMemo(() => 
    dimensions.filter(d => d.status === 'good'),
    [dimensions]
  );

  const scoreDelta = useMemo(() => 
    (hasAnalysis && initialScore > 0) ? (currentScore - initialScore) : 0,
    [hasAnalysis, initialScore, currentScore]
  );

  const issueProgressPercent = useMemo(() => 
    totalIssues > 0 ? (fixedIssues / totalIssues) * 100 : 0,
    [totalIssues, fixedIssues]
  );

  // NQI tier configuration
  const getNQIConfig = () => {
    if (currentScore >= 85) return { 
      label: 'Outstanding', 
      color: 'text-green-600 dark:text-green-400', 
      bg: 'bg-green-100 dark:bg-green-950/30', 
      border: 'border-green-300 dark:border-green-800' 
    };
    if (currentScore >= 70) return { 
      label: 'Competitive', 
      color: 'text-blue-600 dark:text-blue-400', 
      bg: 'bg-blue-100 dark:bg-blue-950/30', 
      border: 'border-blue-300 dark:border-blue-800' 
    };
    if (currentScore >= 55) return { 
      label: 'Needs Work', 
      color: 'text-amber-600 dark:text-amber-400', 
      bg: 'bg-amber-100 dark:bg-amber-950/30', 
      border: 'border-amber-300 dark:border-amber-800' 
    };
    return { 
      label: 'Critical', 
      color: 'text-red-600 dark:text-red-400', 
      bg: 'bg-red-100 dark:bg-red-950/30', 
      border: 'border-red-300 dark:border-red-800' 
    };
  };

  // Score color configuration
  const getScoreColor = (score: number) => {
    if (score >= 90) return { gradient: true, className: 'text-transparent bg-clip-text bg-gradient-to-r from-[hsl(250,70%,60%)] via-[hsl(185,80%,55%)] to-[hsl(280,90%,65%)]' };
    if (score >= 85) return { gradient: false, className: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 70) return { gradient: true, className: 'text-transparent bg-clip-text bg-gradient-to-r from-[hsl(217,91%,60%)] via-[hsl(262,83%,58%)] to-[hsl(217,91%,65%)]' };
    if (score >= 55) return { gradient: false, className: 'text-amber-600 dark:text-amber-400' };
    return { gradient: false, className: 'text-red-600 dark:text-red-400' };
  };

  const nqiConfig = getNQIConfig();
  const scoreColorConfig = getScoreColor(currentScore);

  return (
    <TooltipProvider>
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left relative overflow-hidden rounded-xl border transition-all duration-300",
          "cursor-pointer group",
          "hover:shadow-lg hover:scale-[1.005] active:scale-[0.995]",
          getCollegeBgClasses(collegeId),
          getCollegeBorderClasses(collegeId)
        )}
      >
        {/* Gradient accent bar */}
        <div className={cn("h-1.5 bg-gradient-to-r", colors.gradient)} />
        
        {/* Click hint overlay - shows on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        <div className="p-5 sm:p-6">
          {/* ROW 1: College Identity + Analysis Score */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* LEFT: College Identity */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* College Logo */}
              <CollegeLogo 
                collegeId={collegeId} 
                size="xl" 
                className="flex-shrink-0"
              />
              
              <div className="flex-1 min-w-0">
                {/* College Name */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className={cn("text-2xl sm:text-3xl font-bold tracking-tight", colors.icon)}>
                    {collegeName}
                  </h1>
                  {/* Click hint */}
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <MousePointerClick className="w-3 h-3" />
                    Click to switch
                  </span>
                </div>
                
                {/* College Tagline */}
                {profile && (
                  <p className="mt-1.5 text-sm text-muted-foreground italic line-clamp-2">
                    "{profile.tagline}"
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT: Analysis Summary OR Essay Progress */}
            <div className="flex flex-col items-end gap-3">
              {isAnalyzing ? (
                /* Analyzing State */
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 border-b-pink-500 animate-spin" />
                    <Target className="w-5 h-5 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-right">
                    <RandomizingScore 
                      score={0} 
                      isAnalyzing={true} 
                      className="text-3xl font-extrabold text-primary" 
                    />
                    <p className="text-xs text-muted-foreground">Analyzing...</p>
                  </div>
                </div>
              ) : hasAnalysis ? (
                /* Analysis Results - Clean vertical stack */
                <div className="flex flex-col items-end gap-2">
                  {/* Score Display */}
                  <div className="flex items-baseline gap-1 justify-end">
                    <RandomizingScore 
                      score={currentScore} 
                      isAnalyzing={false} 
                      className={cn("text-4xl font-extrabold", scoreColorConfig.className)}
                    />
                    <span className="text-lg font-medium text-muted-foreground">/100</span>
                  </div>
                  
                  {/* Tier Badge - pill style below score */}
                  <Badge className={cn(
                    "px-4 py-1 rounded-full text-xs font-semibold",
                    nqiConfig.bg, nqiConfig.color, "border", nqiConfig.border
                  )}>
                    {nqiConfig.label}
                  </Badge>
                </div>
              ) : (
                /* Pre-Analysis: Essay Progress Stats */
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      "bg-background/80 border",
                      getCollegeBorderClasses(collegeId)
                    )}>
                      <FileText className={cn("w-5 h-5", colors.icon)} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Essays</p>
                      <p className="text-base font-semibold">
                        {essayProgress.completed}/{essayProgress.total}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      "bg-background/80 border",
                      getCollegeBorderClasses(collegeId)
                    )}>
                      <PenTool className={cn("w-5 h-5", colors.icon)} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Score</p>
                      <p className="text-base font-semibold text-muted-foreground">--</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ROW 2: Progress Bar OR Issues Progress + Quick Navigate */}
          {(isAnalyzing || hasAnalysis) ? (
            /* Analysis Mode: Issues Progress + Quick Navigate */
            <div className="mt-5 space-y-3">
              {/* Issues Progress */}
              {hasAnalysis && totalIssues > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">
                        Issues Resolved
                      </span>
                      <span className="text-xs font-medium">
                        {fixedIssues}/{totalIssues}
                      </span>
                    </div>
                    <Progress value={issueProgressPercent} className="h-2" />
                  </div>
                </div>
              )}
              
              {/* Quick Navigate Badges */}
              {hasAnalysis && (
                <div className="flex items-center gap-3 flex-wrap pt-3">
                  <span className="text-sm font-medium text-muted-foreground">Quick navigate:</span>
                  
                  {/* Critical Badge */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        disabled={criticalDimensions.length === 0}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                          criticalDimensions.length > 0
                            ? "bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 hover:shadow-sm dark:bg-red-950/40 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/60"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Critical ({criticalDimensions.length})
                      </button>
                    </PopoverTrigger>
                    {criticalDimensions.length > 0 && (
                      <PopoverContent side="bottom" align="start" className="w-72 p-3">
                        <p className="font-semibold text-sm text-red-600 dark:text-red-400 mb-2">Critical Dimensions</p>
                        <div className="space-y-1">
                          {criticalDimensions.map(dim => (
                            <button
                              key={dim.id}
                              onClick={() => onScrollToDimension(dim.id)}
                              className="w-full text-left text-xs hover:bg-muted/50 rounded-md p-2 transition-colors group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium group-hover:underline underline-offset-2 decoration-red-300 dark:decoration-red-700">
                                  {dim.name}
                                </span>
                                <span className="text-muted-foreground">{dim.score}/{dim.maxScore}</span>
                              </div>
                              {dim.issues.length > 0 && (
                                <p className="text-muted-foreground mt-1 line-clamp-1">{dim.issues[0].title}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    )}
                  </Popover>

                  {/* Needs Work Badge */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        disabled={needsWorkDimensions.length === 0}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                          needsWorkDimensions.length > 0
                            ? "bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200 hover:shadow-sm dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/60"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Needs Work ({needsWorkDimensions.length})
                      </button>
                    </PopoverTrigger>
                    {needsWorkDimensions.length > 0 && (
                      <PopoverContent side="bottom" align="start" className="w-72 p-3">
                        <p className="font-semibold text-sm text-amber-600 dark:text-amber-400 mb-2">Needs Improvement</p>
                        <div className="space-y-1">
                          {needsWorkDimensions.map(dim => (
                            <button
                              key={dim.id}
                              onClick={() => onScrollToDimension(dim.id)}
                              className="w-full text-left text-xs hover:bg-muted/50 rounded-md p-2 transition-colors group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium group-hover:underline underline-offset-2 decoration-amber-300 dark:decoration-amber-700">
                                  {dim.name}
                                </span>
                                <span className="text-muted-foreground">{dim.score}/{dim.maxScore}</span>
                              </div>
                              {dim.issues.length > 0 && (
                                <p className="text-muted-foreground mt-1 line-clamp-1">{dim.issues[0].title}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    )}
                  </Popover>

                  {/* Strong Badge */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        disabled={goodDimensions.length === 0}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                          goodDimensions.length > 0
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200 hover:shadow-sm dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/60"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Strong ({goodDimensions.length})
                      </button>
                    </PopoverTrigger>
                    {goodDimensions.length > 0 && (
                      <PopoverContent side="bottom" align="start" className="w-72 p-3">
                        <p className="font-semibold text-sm text-emerald-600 dark:text-emerald-400 mb-2">Strong Areas</p>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {goodDimensions.slice(0, 5).map(dim => (
                            <button
                              key={dim.id}
                              onClick={() => onScrollToDimension(dim.id)}
                              className="w-full text-left text-xs hover:bg-muted/50 rounded-md p-2 transition-colors group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium group-hover:underline underline-offset-2 decoration-emerald-300 dark:decoration-emerald-700">
                                  {dim.name}
                                </span>
                                <span className="text-muted-foreground">{dim.score}/{dim.maxScore}</span>
                              </div>
                            </button>
                          ))}
                          {goodDimensions.length > 5 && (
                            <p className="text-xs text-muted-foreground px-2 pt-1">+{goodDimensions.length - 5} more...</p>
                          )}
                        </div>
                      </PopoverContent>
                    )}
                  </Popover>
                </div>
              )}
            </div>
          ) : (
            /* Pre-Analysis: Essay Progress Bar */
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  {progressPercent === 100 ? 'All essays complete!' : `${Math.round(progressPercent)}% complete`}
                </span>
                {profile && (
                  <span className="text-xs text-muted-foreground">
                    Tone: <span className="font-medium">{profile.tone}</span>
                  </span>
                )}
              </div>
              <div className="relative h-2.5 bg-background/50 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all duration-500 bg-gradient-to-r", colors.gradient)}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* ROW 3: Top Values Preview (always shown) */}
          {profile && !hasAnalysis && !isAnalyzing && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Top values:</span>
              {profile.valueWeights.slice(0, 3).map((value) => (
                <Badge 
                  key={value.key}
                  variant="secondary"
                  className={cn(
                    "text-xs px-2.5 py-0.5",
                    "bg-background/60 hover:bg-background/80"
                  )}
                >
                  {value.name} ({value.weight}%)
                </Badge>
              ))}
              {profile.valueWeights.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{profile.valueWeights.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </button>
    </TooltipProvider>
  );
});

EnhancedCollegeHeader.displayName = 'EnhancedCollegeHeader';
