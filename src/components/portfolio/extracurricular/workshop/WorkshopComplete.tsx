import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Copy,
  FileText,
  Award,
  Target,
  TrendingUp,
  Zap,
  Eye,
  MessageSquare
} from 'lucide-react';

interface WorkshopCompleteProps {
  draft: string;
  overallScore: number;
  onViewRubric?: () => void;
}

export const WorkshopComplete: React.FC<WorkshopCompleteProps> = ({
  draft,
  overallScore,
  onViewRubric
}) => {
  const wordCount = draft.trim().split(/\s+/).filter(Boolean).length;
  return (
    <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 border-2 border-green-300 dark:border-green-700 shadow-strong overflow-hidden">
      <div className="p-10 space-y-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full blur-xl opacity-50" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-strong">
                <CheckCircle2 className="w-14 h-14 text-white" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Award className="w-8 h-8 text-green-600 dark:text-green-400" />
              <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Workshop Complete!
              </h3>
              <Award className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-base text-foreground/80 max-w-md mx-auto leading-relaxed">
              All issues addressed. Your narrative is now officer-ready with
              professional polish and strategic positioning.
            </p>
          </div>
        </div>

        <div className="bg-background/80 backdrop-blur-sm rounded-xl p-6 space-y-5 border shadow-soft">
          <p className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Target className="w-4 h-4" />
            Your narrative now includes:
          </p>
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Authentic voice</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Genuine, conversational tone
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Concrete specificity</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Numbers, metrics, tangible outcomes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Clear causality</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Action → outcome connections
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Meaningful reflection</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Growth insights and learning
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center flex-shrink-0">
                <Award className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Role clarity</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Agency and ownership evident
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Professional craft</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {wordCount} words (perfect range)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-xl p-8 text-center border-2 border-green-300 dark:border-green-700 shadow-strong overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-teal-400/20 to-green-400/20 rounded-full blur-3xl" />

          <div className="relative space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Overall Narrative Quality
              </div>
            </div>
            <div className="text-6xl font-bold text-green-600 dark:text-green-400">
              {overallScore.toFixed(0)}
              <span className="text-3xl text-muted-foreground">/100</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-medium">
              <Award className="w-5 h-5" />
              Outstanding
            </div>
          </div>

          <div className="relative mt-6 pt-6 border-t border-green-300 dark:border-green-700">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
              <p className="text-sm font-semibold text-foreground">
                {wordCount} words in your polished narrative
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-1.5 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Perfect Range (90-170)
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2 h-12 hover:bg-accent hover:border-primary transition-all"
            onClick={() => {
              navigator.clipboard.writeText(draft);
            }}
          >
            <Copy className="w-5 h-5" />
            <span className="font-semibold">Copy Final Draft</span>
          </Button>
          {onViewRubric && (
            <Button
              onClick={onViewRubric}
              className="flex-1 gap-2 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-medium hover:shadow-strong transition-all"
            >
              <FileText className="w-5 h-5" />
              <span className="font-semibold">View Rubric Details</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
