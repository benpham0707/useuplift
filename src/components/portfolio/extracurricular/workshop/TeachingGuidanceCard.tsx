/**
 * Teaching Guidance Card - Simplified
 *
 * Shows teaching content with truncation and fade effect.
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

  // Build the full teaching content as a single flowing text
  const buildTeachingContent = () => {
    const parts: string[] = [];

    // Problem hook
    if (teaching.problem?.hook) {
      parts.push(teaching.problem.hook);
    }

    // Why it matters preview
    if (teaching.problem?.whyItMatters?.preview) {
      parts.push(teaching.problem.whyItMatters.preview);
    }

    // Craft principle hook
    if (teaching.craftPrinciple?.hook) {
      parts.push(teaching.craftPrinciple.hook);
    }

    // Application quick start
    if (teaching.applicationStrategy?.quickStart) {
      parts.push(teaching.applicationStrategy.quickStart);
    }

    return parts.join(' ');
  };

  // Build extended content for expanded view
  const buildExtendedContent = () => {
    const parts: string[] = [];

    // Full problem description
    if (teaching.problem?.description) {
      parts.push(teaching.problem.description);
    }

    // Full why it matters
    if (teaching.problem?.whyItMatters?.fullExplanation) {
      parts.push(teaching.problem.whyItMatters.fullExplanation);
    }

    // Full craft teaching
    if (teaching.craftPrinciple?.fullTeaching) {
      parts.push(teaching.craftPrinciple.fullTeaching);
    }

    // Real world example
    if (teaching.craftPrinciple?.realWorldExample) {
      parts.push(teaching.craftPrinciple.realWorldExample);
    }

    // Deep dive application
    if (teaching.applicationStrategy?.deepDive) {
      parts.push(teaching.applicationStrategy.deepDive);
    }

    // Transferability
    if (teaching.applicationStrategy?.transferability) {
      parts.push(teaching.applicationStrategy.transferability);
    }

    // Personal note
    if (teaching.personalNote) {
      parts.push(teaching.personalNote);
    }

    return parts.join('\n\n');
  };

  const previewContent = buildTeachingContent();
  const extendedContent = buildExtendedContent();

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Why This Matters
      </p>

      <div className="relative">
        {/* Preview text (always visible) */}
        <div className={`text-sm text-foreground/80 leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
          {previewContent}
        </div>

        {/* Fade overlay when collapsed */}
        {!isExpanded && previewContent.length > 200 && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        )}
      </div>

      {/* Extended content when expanded */}
      {isExpanded && extendedContent && (
        <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line mt-3 pt-3 border-t border-border/50">
          {extendedContent}
        </div>
      )}

      {/* View more/less button */}
      {(previewContent.length > 200 || extendedContent) && (
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
