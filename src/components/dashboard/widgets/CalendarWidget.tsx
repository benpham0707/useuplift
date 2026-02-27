import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardEvents } from '@/hooks/useDashboard';
import { formatRelativeDate, EventUrgency } from '@/lib/types/dashboard';
import { Calendar, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Calendar Widget - Displays upcoming deadlines and events
 *
 * Shows up to 7 events sorted by date with urgency indicators
 * and navigation to related pages.
 */
export default function CalendarWidget() {
  const navigate = useNavigate();
  const { events, loading } = useDashboardEvents();

  if (loading) {
    return <CalendarWidgetSkeleton />;
  }

  const handleEventClick = (link?: string) => {
    if (link) {
      navigate(link);
    }
  };

  const getUrgencyColor = (urgency: EventUrgency) => {
    switch (urgency) {
      case EventUrgency.Overdue:
      case EventUrgency.Today:
        return 'bg-red-500';
      case EventUrgency.ThisWeek:
        return 'bg-amber-500';
      default:
        return 'bg-green-500';
    }
  };

  const getUrgencyTextColor = (urgency: EventUrgency) => {
    switch (urgency) {
      case EventUrgency.Overdue:
      case EventUrgency.Today:
        return 'text-red-600';
      case EventUrgency.ThisWeek:
        return 'text-amber-600';
      default:
        return 'text-green-600';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle>Coming Up</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                No upcoming deadlines
              </p>
              <p className="text-xs text-muted-foreground">
                Explore schools to get started
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/schools')}
              className="mt-2"
            >
              Explore Schools
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event.related_link)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all",
                  "hover:bg-muted/50",
                  event.related_link && "cursor-pointer"
                )}
              >
                {/* Urgency Dot */}
                <div className="flex-shrink-0">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      getUrgencyColor(event.urgency)
                    )}
                  />
                </div>

                {/* Event Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {event.title}
                  </p>
                  <p className={cn(
                    "text-xs font-medium",
                    getUrgencyTextColor(event.urgency)
                  )}>
                    {formatRelativeDate(event.event_date)}
                  </p>
                </div>

                {/* Navigation Arrow */}
                {event.related_link && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {events.length > 0 && (
        <CardFooter className="pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/calendar')}
            className="w-full"
          >
            View full calendar →
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * Loading skeleton for Calendar Widget
 */
function CalendarWidgetSkeleton() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-2 w-2 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-4" />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-8 w-full" />
      </CardFooter>
    </Card>
  );
}