import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, TrendingUp } from 'lucide-react';

interface WorkshopCompleteProps {
  onViewRubric?: () => void;
}

export const WorkshopComplete: React.FC<WorkshopCompleteProps> = ({ onViewRubric }) => {
  return (
    <Card className="p-8 bg-gradient-to-br from-success/10 via-background to-background border-success/20">
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-success/10 p-4">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold">✓ All Issues Addressed!</h3>
          <p className="text-muted-foreground">
            Your narrative is now officer-ready with:
          </p>
        </div>

        <div className="space-y-2 text-sm text-left max-w-md mx-auto">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <span>Clear selectivity context (competitive positioning)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <span>Explicit thematic connection to your academic spine</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <span>Direct cause→effect language connecting actions to outcomes</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <span>Metacognitive reflection demonstrating growth</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <span>Evidence-based metrics throughout (no buzzwords)</span>
          </div>
        </div>

        <div className="pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/20">
            <TrendingUp className="w-5 h-5 text-success" />
            <div className="text-left">
              <div className="text-xs text-muted-foreground">Overall Narrative Quality</div>
              <div className="text-xl font-bold text-success">8.7/10</div>
              <div className="text-xs font-medium">Strong</div>
            </div>
          </div>
        </div>

        {onViewRubric && (
          <Button onClick={onViewRubric} variant="outline" className="mt-4">
            View Full Rubric Breakdown
          </Button>
        )}
      </div>
    </Card>
  );
};
