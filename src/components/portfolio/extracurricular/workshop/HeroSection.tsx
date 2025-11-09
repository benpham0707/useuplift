import React, { useState } from 'react';
import { ChevronDown, ChevronUp, PenTool } from 'lucide-react';
import GradientText from '@/components/ui/GradientText';
import { OverallScoreCard } from './OverallScoreCard';

interface HeroSectionProps {
  overallScore?: number;
  fixedCount?: number;
  totalCount?: number;
  embedScoreCard?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  overallScore,
  fixedCount,
  totalCount,
  embedScoreCard
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number | undefined) => {
    if (score === undefined) return 'text-foreground';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 60) return 'text-green-600 dark:text-green-400';
    if (score >= 45) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-0">
      {embedScoreCard && overallScore !== undefined ? (
        <OverallScoreCard
          overallScore={overallScore}
          fixedCount={fixedCount || 0}
          totalCount={totalCount || 0}
          howToExpanded={isExpanded}
          onToggleHowTo={() => setIsExpanded(!isExpanded)}
        />
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center shadow-medium">
            <PenTool className="w-6 h-6 text-primary-foreground" />
          </div>
          <GradientText className="text-3xl font-bold">
            Narrative Workshop
          </GradientText>
        </div>
      )}
      {/* How-to panel is rendered inside OverallScoreCard to ensure tight spacing below the link */}
    </div>
  );
};
