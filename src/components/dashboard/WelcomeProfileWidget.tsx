import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Welcome + Profile Progress Widget
 *
 * Displays:
 * - Time-based greeting with user's name (left side on desktop)
 * - Section progress checklist
 * - Circular progress ring showing profile completion (right side on desktop)
 * - Next recommended section to complete (or success state if 100%)
 */
export default function WelcomeProfileWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { percentage, sections, nextSection, isFullyComplete, isLoading, error } = useProfileCompletion();
  const [userName, setUserName] = useState<string>('');

  // Get time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Get today's date
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Fetch user's first name
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user) return;

      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('user_id', user.id)
          .maybeSingle();

        const name = profile?.first_name || user.email?.split('@')[0] || 'there';
        setUserName(name);
      } catch (err) {
        console.error('[WelcomeProfileWidget] Error fetching user name:', err);
        setUserName(user.email?.split('@')[0] || 'there');
      }
    };

    fetchUserName();
  }, [user]);

  // Show loading skeleton while data loads
  if (isLoading) {
    return (
      <Card className="p-6 border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-6">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3 w-32" />
            <div className="space-y-2 mt-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="flex flex-col items-center sm:items-end">
            <Skeleton className="h-28 w-28 rounded-full" />
            <Skeleton className="h-3 w-24 mt-2" />
            <Skeleton className="h-2 w-16 mt-1" />
          </div>
        </div>
        <div className="border-t border-gray-200 my-4" />
        <Skeleton className="h-12 w-full" />
      </Card>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Card className="p-6 border-gray-200">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-gray-900">{greeting}, {userName}</h2>
          <p className="text-sm text-gray-500">{currentDate}</p>
          <div className="py-6">
            <p className="text-sm text-red-600">Couldn't load profile progress</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Estimated time per section (in minutes)
  const estimatedTimes: Record<string, number> = {
    activities: 10,
    academic_details: 5,
    interest_deep_dive: 8,
    goals_constraints: 5,
    personality_work_style: 5
  };

  // Filter out quick_start from the displayed checklist (user already completed onboarding)
  const displaySections = sections.filter(s => s.key !== 'quick_start');
  const completedCount = displaySections.filter(s => s.isComplete).length;

  return (
    <Card className="p-6 border-gray-200">
      {/* Top Section: Greeting + Checklist (left) | Progress Ring (right) */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6">
        {/* Left Column: Greeting + Section Checklist */}
        <div className="flex-1">
          {/* Greeting */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">{greeting}, {userName}!</h2>
            <p className="text-sm text-gray-500">{currentDate}</p>
          </div>

          {/* Section Checklist */}
          <div className="space-y-1">
            {displaySections.map((section) => {
              const isNext = nextSection?.key === section.key;
              return (
                <div key={section.key} className="flex items-center gap-2">
                  {section.isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <Circle className={`w-4 h-4 flex-shrink-0 ${isNext ? 'text-blue-600' : 'text-gray-300'}`} />
                  )}
                  <span className={`text-sm ${section.isComplete ? 'text-gray-700' : isNext ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {section.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Progress Ring */}
        <div className="flex flex-col items-center sm:items-end">
          <ProgressRing percentage={percentage} />
          <p className="text-sm text-gray-600 mt-2">Profile Complete</p>
          <p className="text-xs text-gray-500">
            {completedCount} of {displaySections.length} done
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-4" />

      {/* CTA Section */}
      {isFullyComplete ? (
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p>Your profile is complete — all recommendations are fully personalized.</p>
        </div>
      ) : nextSection ? (
        <div>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Up next: {nextSection.label}</h3>
            <p className="text-xs text-gray-600 mt-1">{nextSection.description}</p>
          </div>
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate(nextSection.route)}
            >
              Complete Now · ~{estimatedTimes[nextSection.key] || 5} min
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

/**
 * Circular Progress Ring Component
 *
 * Pure SVG progress indicator with animated fill
 * Size: 110px on desktop, responsive
 */
function ProgressRing({ percentage }: { percentage: number }) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  // Animate the ring on mount with 800ms ease-out
  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);
    return () => clearTimeout(timeout);
  }, [percentage]);

  // SVG circle calculations - smaller ring for side-by-side layout
  const size = 110;
  const strokeWidth = 8;
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
