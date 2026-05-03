import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';

// Type exports for other components
export type SectionKey = 'activities' | 'academic_details' | 'goals_aspirations' | 'identity_demographics' | 'family_context' | 'support_network' | 'personal_growth';

interface WelcomeProfileWidgetProps {
  onSectionClick?: (sectionKey: SectionKey) => void;
}

/**
 * Welcome + Profile Progress Widget
 *
 * Displays:
 * - Section progress checklist (clickable)
 * - Circular progress ring showing profile completion (right side on desktop)
 * - Next recommended section to complete (or success state if 100%)
 */
export default function WelcomeProfileWidget({ onSectionClick }: WelcomeProfileWidgetProps) {
  const { user } = useAuth();
  const { percentage, sections, nextSection, isFullyComplete, isLoading, error } = useProfileCompletion();

  // Filter out quick_start from the displayed checklist (user already completed onboarding)
  const displaySections = sections.filter(s => s.key !== 'quick_start');
  const completedCount = displaySections.filter(s => s.isComplete).length;

  // Show loading skeleton while data loads
  if (isLoading) {
    return (
      <Card className="p-4 border-gray-200">
        <div className="flex items-start gap-6">
          <div className="flex-1 max-w-xs space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="flex flex-col items-center">
              <Skeleton className="h-[160px] w-[160px] rounded-full" />
            </div>
            <div className="space-y-2 flex flex-col items-center">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-8 w-40" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Card className="p-4 border-gray-200">
        <div className="text-center space-y-4 py-6">
          <p className="text-sm text-red-600">Couldn't load profile progress</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  // Estimated time per section (in minutes)
  const estimatedTimes: Record<string, number> = {
    activities: 10,
    academic_details: 5,
    goals_aspirations: 5,
    identity_demographics: 3,
    family_context: 3,
    support_network: 3,
    personal_growth: 5
  };

  return (
    <Card className="p-4 border-gray-200">
      <div className="flex items-start gap-6">
        {/* Left: Section Checklist - Compact */}
        <div className="flex-1 max-w-xs">
          {/* Header */}
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Your profile sections:</h3>

          {/* Section Checklist - Each row is clickable */}
          <div className="space-y-0.5">
            {displaySections.map((section) => {
              const isNext = nextSection?.key === section.key;
              const sectionKey = section.key as SectionKey;

              return (
                <button
                  key={section.key}
                  onClick={() => onSectionClick?.(sectionKey)}
                  className={`flex items-center gap-2 w-full text-left py-1.5 px-2 rounded transition-colors hover:bg-gray-50 ${
                    isNext ? 'border-l-2 border-blue-500 pl-1.5' : ''
                  }`}
                >
                  {section.isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <Circle className={`w-4 h-4 flex-shrink-0 ${isNext ? 'text-blue-600' : 'text-gray-300'}`} />
                  )}
                  <span className={`text-sm ${section.isComplete ? 'text-gray-700' : isNext ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                    {section.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Progress Ring + CTA Section */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          {/* Circular Progress Ring */}
          <div className="flex flex-col items-center justify-center">
            <ProgressRing percentage={percentage} size={160} />
          </div>

          {/* CTA Section */}
          {isFullyComplete ? (
            <div className="flex items-center gap-2 text-sm text-gray-700 text-center">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p>Your profile is complete — all recommendations are fully personalized.</p>
            </div>
          ) : nextSection ? (
            <div className="text-center">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Up next: {nextSection.label}</h3>
              <p className="text-xs text-gray-600 mb-2">{nextSection.description}</p>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => onSectionClick?.(nextSection.key as SectionKey)}
              >
                Complete Now · ~{estimatedTimes[nextSection.key] || 5} min
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

/**
 * Circular Progress Ring Component
 *
 * Pure SVG progress indicator with animated fill
 * Configurable size
 */
function ProgressRing({ percentage, size = 90 }: { percentage: number; size?: number }) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  // Animate the ring on mount with 800ms ease-out
  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);
    return () => clearTimeout(timeout);
  }, [percentage]);

  // SVG circle calculations
  const strokeWidth = size >= 110 ? 9 : 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle - very light gray */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-[800ms] ease-out"
        />
      </svg>
      {/* Percentage text - bolder and larger */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-baseline">
          <span className="text-4xl font-bold text-gray-900">
            {Math.round(percentage)}
          </span>
          <span className="text-lg font-medium text-gray-600">%</span>
        </div>
      </div>
    </div>
  );
}
