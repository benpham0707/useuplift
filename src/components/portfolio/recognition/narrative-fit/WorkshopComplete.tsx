import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Copy, FileText } from 'lucide-react';

interface WorkshopCompleteProps {
  onViewRubric?: () => void;
}

export const WorkshopComplete: React.FC<WorkshopCompleteProps> = ({ onViewRubric }) => {
  return (
    <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 border-2 border-green-300 dark:border-green-700 shadow-lg">
      <div className="p-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl animate-scale-in">
              <CheckCircle2 className="w-14 h-14 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              🎉 Workshop Complete! 🎉
            </h3>
            <p className="text-base text-muted-foreground max-w-md mx-auto">
              All issues addressed. Your narrative is now officer-ready with professional polish and strategic positioning.
            </p>
          </div>
        </div>

        <div className="bg-background/80 backdrop-blur-sm rounded-xl p-6 space-y-4 border shadow-sm">
          <p className="font-bold text-sm uppercase tracking-wide text-muted-foreground">
            Your narrative now includes:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">✅</span>
              <div>
                <p className="font-semibold text-sm">Clear selectivity context</p>
                <p className="text-xs text-muted-foreground">Top 10/1,200 applicants</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">✅</span>
              <div>
                <p className="font-semibold text-sm">Explicit thematic connection</p>
                <p className="text-xs text-muted-foreground">Linked to your academic spine</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">✅</span>
              <div>
                <p className="font-semibold text-sm">Direct cause→effect language</p>
                <p className="text-xs text-muted-foreground">Showing measurable impact</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">✅</span>
              <div>
                <p className="font-semibold text-sm">Metacognitive reflection</p>
                <p className="text-xs text-muted-foreground">Demonstrates maturity and growth</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">✅</span>
              <div>
                <p className="font-semibold text-sm">Evidence-based metrics</p>
                <p className="text-xs text-muted-foreground">Concrete numbers throughout</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">✅</span>
              <div>
                <p className="font-semibold text-sm">Tight, professional tone</p>
                <p className="text-xs text-muted-foreground">142 words (perfect range)</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-xl p-6 text-center border-2 border-green-300 dark:border-green-700 shadow-md">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Overall Narrative Quality
            </div>
            <div className="text-5xl font-bold text-green-600 dark:text-green-400">
              8.7/10
            </div>
            <div className="text-base font-semibold text-green-700 dark:text-green-300">
              Strong
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-green-300 dark:border-green-700">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">20-word draft</span> → <span className="font-semibold text-foreground">145-word polished narrative</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Word count: <span className="text-green-600 dark:text-green-400 font-semibold">✓ Perfect</span> (90-170 range)
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 gap-2"
            onClick={() => {
              // Copy draft functionality would go here
              navigator.clipboard.writeText('Draft content would be copied here');
            }}
          >
            <Copy className="w-4 h-4" />
            Copy Final Draft
          </Button>
          {onViewRubric && (
            <Button 
              onClick={onViewRubric} 
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <FileText className="w-4 h-4" />
              View Rubric Details
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
