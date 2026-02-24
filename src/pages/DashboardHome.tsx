import { Home, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';

/**
 * Dashboard Home - Default landing page for authenticated users
 *
 * Displays welcome banner (dismissible via localStorage) and placeholder content.
 * Loading skeleton simulates data fetch (500ms) - will be replaced with real data in Phase 3.
 */
export default function DashboardHome() {
  const [loading, setLoading] = useState(true);

  // Simulate data fetch - will be replaced with real data loading in Phase 3
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <DashboardHomeSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <WelcomeBanner />

      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Dashboard Home</h1>
        <p className="text-muted-foreground">
          This is where your next steps and application status will appear.
          Use the sidebar to navigate to your portfolio scanner, insights, and workshop tools.
        </p>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for Dashboard Home
 * Shown during initial data fetch to improve perceived performance
 */
function DashboardHomeSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Banner skeleton */}
      <Skeleton className="h-16 w-full" />

      {/* Title skeleton */}
      <Skeleton className="h-8 w-64" />

      {/* Subtitle skeleton */}
      <Skeleton className="h-4 w-96" />
    </div>
  );
}

/**
 * Welcome banner - dismissible, persists via localStorage
 * Only shows on first visit or until user explicitly dismisses
 */
function WelcomeBanner() {
  const STORAGE_KEY = 'dashboard-welcome-dismissed';
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
  };

  // Don't render if previously dismissed
  if (dismissed) {
    return null;
  }

  return (
    <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-md flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Home className="h-5 w-5 text-primary" />
        <p className="text-sm font-medium">
          Welcome to your new dashboard! Find everything you need in one place.
        </p>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss welcome message"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
