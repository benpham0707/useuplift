/**
 * Teaching GuidanceCard - Segmented
 *
 * Shows teaching content properly segmented into "The Problem" and "Why This Works".
 * Each section has its own themed expand/collapse button.
 */

import React, { useState } from 'react';
import { ThemedPillButton } from '@/components/ui/ThemedPillButton';
import { TeachingGuidance } from './backendTypes';

export interface TeachingGuidanceCardProps {
  teaching: TeachingGuidance;
  mode?: 'full' | 'problem' | 'solution';
}

export const TeachingGuidanceCard: React.FC<TeachingGuidanceCardProps> = ({
  teaching,
  mode = 'full',
}) => {
  const [isProblemExpanded, setIsProblemExpanded] = useState(false);
  const [isSolutionExpanded, setIsSolutionExpanded] = useState(false);

  // 🔍 SAFETY CHECK: Prevent crash when teaching.problem is undefined
  if (!teaching?.problem) {
    return (
      <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
        <p className="text-sm text-yellow-800 font-medium">
          Teaching guidance is loading or unavailable.
        </p>
        <p className="text-xs text-yellow-600 mt-1">
          Try re-analyzing this essay to generate fresh teaching content.
        </p>
      </div>
    );
  }

  // Build The Problem content (raw)
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

  // Build Why This Works content (raw)
  const buildSolutionContent = (expanded: boolean) => {
    const parts: string[] = [];

    // Preview parts (always shown)
    if (teaching.craftPrinciple?.hook) parts.push(teaching.craftPrinciple.hook);
    if (teaching.applicationStrategy?.whatMakesGoodExample) parts.push(teaching.applicationStrategy.whatMakesGoodExample);

    if (expanded) {
      // Expanded parts
      if (teaching.craftPrinciple?.fullTeaching) parts.push('\n\n' + teaching.craftPrinciple.fullTeaching);
      if (teaching.craftPrinciple?.realWorldExample) parts.push('\n\nExample: ' + teaching.craftPrinciple.realWorldExample);
      if (teaching.applicationStrategy?.implementationGuide) parts.push('\n\n' + teaching.applicationStrategy.implementationGuide);
      if (teaching.applicationStrategy?.narrativePurposeAndAngles) parts.push('\n\n' + teaching.applicationStrategy.narrativePurposeAndAngles);
      if (teaching.personalNote) parts.push('\n\nNote: ' + teaching.personalNote);
    }

    return parts.join(' ');
  };

  const problemContent = buildProblemContent(isProblemExpanded);
  const solutionContent = buildSolutionContent(isSolutionExpanded);
  
  // Check if there is more content to show for each section
  const hasProblemMore = teaching.problem?.description || teaching.problem?.whyItMatters?.fullExplanation;
  const hasSolutionMore = teaching.craftPrinciple?.fullTeaching || 
    teaching.craftPrinciple?.realWorldExample ||
    teaching.applicationStrategy?.implementationGuide || 
    teaching.applicationStrategy?.narrativePurposeAndAngles ||
    teaching.personalNote;

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
          {hasProblemMore && (
            <ThemedPillButton
              variant="red"
              isExpanded={isProblemExpanded}
              onClick={() => setIsProblemExpanded(!isProblemExpanded)}
            >
              {isProblemExpanded ? 'Show less' : 'View more'}
            </ThemedPillButton>
          )}
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
          {hasSolutionMore && (
            <ThemedPillButton
              variant="green"
              isExpanded={isSolutionExpanded}
              onClick={() => setIsSolutionExpanded(!isSolutionExpanded)}
            >
              {isSolutionExpanded ? 'Show less' : 'View more'}
            </ThemedPillButton>
          )}
        </div>
      )}
    </div>
  );
};
