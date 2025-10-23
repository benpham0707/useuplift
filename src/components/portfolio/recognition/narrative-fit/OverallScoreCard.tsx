import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PenTool, ChevronDown, ChevronUp } from 'lucide-react';
import GradientText from '@/components/ui/GradientText';

interface OverallScoreCardProps {
  overallScore: number;
  fixedCount: number;
  totalCount: number;
  howToExpanded?: boolean;
  onToggleHowTo?: () => void;
}

export const OverallScoreCard: React.FC<OverallScoreCardProps> = ({
  overallScore,
  fixedCount,
  totalCount,
  howToExpanded = false,
  onToggleHowTo
}) => {
  const progressPercent = totalCount > 0 ? (fixedCount / totalCount) * 100 : 0;
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-blue-600 dark:text-blue-400';
    if (score >= 6) return 'text-green-600 dark:text-green-400';
    if (score >= 4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };
  
  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-blue-50 dark:bg-blue-950/20';
    if (score >= 6) return 'bg-green-50 dark:bg-green-950/20';
    if (score >= 4) return 'bg-yellow-50 dark:bg-yellow-950/20';
    return 'bg-red-50 dark:bg-red-950/20';
  };

  return (
    <Card className="border bg-muted/20">
      <div className="p-6 md:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center">
              <PenTool className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <GradientText
                className="text-base md:text-lg font-extrabold uppercase tracking-wide"
                colors={["#a855f7", "#8b5cf6", "#c084fc", "#a78bfa", "#a855f7"]}
              >
                Overall Narrative Quality
              </GradientText>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl md:text-4xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore.toFixed(1)}
            </span>
            <span className="text-2xl font-semibold text-muted-foreground">/10</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm md:text-base">
            <span className="text-muted-foreground">Issues Resolved</span>
            <span className="font-semibold">
              {fixedCount} / {totalCount}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2.5" />
        </div>
        
        <div className="space-y-1">
          {overallScore >= 8.0 && fixedCount === totalCount ? (
            <p className="text-sm text-primary font-medium">
              Excellent work! Your narrative is ready for admissions officers.
            </p>
          ) : (
            <button
              onClick={() => {
                const el = document.getElementById('narrative-rubric');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="group text-sm text-primary hover:text-primary/90 flex items-center gap-1 cursor-pointer"
            >
              Address {totalCount - fixedCount} more issue{totalCount - fixedCount !== 1 ? 's' : ''} to improve your score
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </button>
          )}

          {/* How-to toggle action */}
          <button
            onClick={onToggleHowTo}
            className="group text-sm text-primary hover:text-primary/90 flex items-center gap-1 cursor-pointer"
          >
            How to use this workshop
            {howToExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {howToExpanded && (
            <div className="mt-1 bg-background/80 backdrop-blur-sm rounded-lg p-5 md:p-6 border shadow-sm space-y-3">
              <p className="font-semibold text-base mb-4">Transform your recognition description into an officer-ready narrative:</p>
              <div className="grid gap-3 text-sm leading-relaxed">
                <div className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-xs font-bold text-primary-foreground">1</span>
                  </div>
                  <span className="pt-0.5">Review your draft and overall score</span>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-xs font-bold text-primary-foreground">2</span>
                  </div>
                  <span className="pt-0.5">Expand rubric dimensions to see specific issues</span>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-xs font-bold text-primary-foreground">3</span>
                  </div>
                  <span className="pt-0.5">Click issues to see analysis and edit suggestions</span>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-xs font-bold text-primary-foreground">4</span>
                  </div>
                  <span className="pt-0.5">Apply edits and watch your scores improve in real-time</span>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-xs font-bold text-primary-foreground">5</span>
                  </div>
                  <span className="pt-0.5">Use undo/redo to experiment with different approaches</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
