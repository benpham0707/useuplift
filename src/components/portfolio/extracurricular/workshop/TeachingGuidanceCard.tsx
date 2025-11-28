/**
 * Teaching GuidanceCard - Segmented
 *
 * Shows teaching content properly segmented into "The Problem" and "Why This Works".
 * Expands to show full content on "View more" click.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TeachingGuidance } from './backendTypes';

export interface TeachingGuidanceCardProps {
  teaching: TeachingGuidance;
}

export const TeachingGuidanceCard: React.FC<TeachingGuidanceCardProps> = ({
  teaching,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Build The Problem content
  const buildProblemContent = (expanded: boolean) => {
    const parts: string[] = [];
    
    // Preview parts (always shown)
    if (teaching.problem?.hook) parts.push(teaching.problem.hook);
    if (teaching.problem?.whyItMatters?.preview) parts.push(teaching.problem.whyItMatters.preview);
    
    if (expanded) {
      // Expanded parts
      if (teaching.problem?.description) parts.push('\n\n' + teaching.problem.description);
      if (teaching.problem?.whyItMatters?.fullExplanation) parts.push('\n\n' + teaching.problem.whyItMatters.fullExplanation);
    }
    
    return parts.join(' ');
  };

  // Build Why This Works content
  const buildSolutionContent = (expanded: boolean) => {
    const parts: string[] = [];
    
    // Preview parts (always shown)
    if (teaching.craftPrinciple?.hook) parts.push(teaching.craftPrinciple.hook);
    if (teaching.applicationStrategy?.quickStart) parts.push(teaching.applicationStrategy.quickStart);
    
    if (expanded) {
      // Expanded parts
      if (teaching.craftPrinciple?.fullTeaching) parts.push('\n\n' + teaching.craftPrinciple.fullTeaching);
      if (teaching.craftPrinciple?.realWorldExample) parts.push('\n\nExample: ' + teaching.craftPrinciple.realWorldExample);
      if (teaching.applicationStrategy?.deepDive) parts.push('\n\n' + teaching.applicationStrategy.deepDive);
      if (teaching.applicationStrategy?.transferability) parts.push('\n\n' + teaching.applicationStrategy.transferability);
      if (teaching.personalNote) parts.push('\n\nNote: ' + teaching.personalNote);
    }
    
    return parts.join(' ');
  };

  const problemContent = buildProblemContent(isExpanded);
  const solutionContent = buildSolutionContent(isExpanded);
  
  // Check if there is actually more content to show
  const hasMoreContent = 
    (teaching.problem?.description || teaching.problem?.whyItMatters?.fullExplanation ||
     teaching.craftPrinciple?.fullTeaching || teaching.craftPrinciple?.realWorldExample ||
     teaching.applicationStrategy?.deepDive || teaching.applicationStrategy?.transferability ||
     teaching.personalNote);

  return (
    <div className="space-y-4">
      {/* Section 1: The Problem */}
      {problemContent && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            The Problem
          </p>
          <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
            {problemContent}
          </div>
        </div>
      )}

      {/* Section 2: Why This Works */}
      {solutionContent && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Why This Works
          </p>
          <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
            {solutionContent}
          </div>
        </div>
      )}

      {/* View more/less button */}
      {hasMoreContent && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-primary hover:text-primary/80 p-0 h-auto font-medium"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3 mr-1" />
              View less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              View more
            </>
          )}
        </Button>
      )}
    </div>
  );
};
