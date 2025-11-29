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
  mode?: 'full' | 'problem' | 'solution';
}

export const TeachingGuidanceCard: React.FC<TeachingGuidanceCardProps> = ({
  teaching,
  mode = 'full',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to split text if it contains "WHY THIS WORKS"
  const splitContent = (text: string | undefined): { problemPart: string, solutionPart: string } => {
    if (!text) return { problemPart: '', solutionPart: '' };
    // Look for "WHY THIS WORKS" or similar headers, case insensitive
    const splitRegex = /(?:^|\n+)(?:WHY THIS WORKS|Why This Works|Why this works|WHY IT WORKS|Why It Works)(?:[:\s]|$)/i;
    const match = text.match(splitRegex);
    if (match && match.index !== undefined) {
      return {
        problemPart: text.substring(0, match.index).trim(),
        solutionPart: text.substring(match.index + match[0].length).trim()
      };
    }
    return { problemPart: text, solutionPart: '' };
  };

  // Build The Problem content (raw)
  const buildRawProblemContent = (expanded: boolean) => {
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

  // Build Why This Works content (raw)
  const buildRawSolutionContent = (expanded: boolean) => {
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

  // Process content to handle mixed data
  const rawProblem = buildRawProblemContent(isExpanded);
  const rawSolution = buildRawSolutionContent(isExpanded);

  const { problemPart: cleanProblem, solutionPart: extractedSolution } = splitContent(rawProblem);
  
  const problemContent = cleanProblem;
  const solutionContent = rawSolution ? rawSolution : extractedSolution;
  
  // Check if there is actually more content to show (based on mode)
  // We approximate this by checking if raw content has enough length or if split occurred
  const hasMoreContent = mode === 'full' 
    ? (teaching.problem?.description || teaching.problem?.whyItMatters?.fullExplanation ||
       teaching.craftPrinciple?.fullTeaching || teaching.craftPrinciple?.realWorldExample ||
       teaching.applicationStrategy?.deepDive || teaching.applicationStrategy?.transferability ||
       teaching.personalNote)
    : mode === 'problem'
    ? (teaching.problem?.description || teaching.problem?.whyItMatters?.fullExplanation)
    : (teaching.craftPrinciple?.fullTeaching || teaching.craftPrinciple?.realWorldExample ||
       teaching.applicationStrategy?.deepDive || teaching.applicationStrategy?.transferability ||
       teaching.personalNote);

  const showProblem = (mode === 'full' || mode === 'problem') && problemContent;
  const showSolution = (mode === 'full' || mode === 'solution') && solutionContent;

  return (
    <div className="space-y-4">
      {/* Section 1: The Problem */}
      {showProblem && (
        <div className="pl-3 border-l-2 border-red-400/50 space-y-2">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">
            The Problem
          </p>
          <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
            {problemContent}
          </div>
        </div>
      )}

      {/* Section 2: Why This Works */}
      {showSolution && (
        <div className="pl-3 border-l-2 border-green-400/50 space-y-2">
          <p className="text-xs font-semibold text-green-500 uppercase tracking-wide">
            Why This Works
          </p>
          <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
            {solutionContent}
          </div>
        </div>
      )}

      {/* View more/less button */}
      {hasMoreContent && (
        <div className="pl-3">
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
        </div>
      )}
    </div>
  );
};
