import * as React from 'react';
import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';

// Types for deadlines and events
type DeadlineType = 'application' | 'event' | 'early' | 'custom';

interface Deadline {
  id: string;
  date: Date;
  type: DeadlineType;
  title: string;
  description: string;
  school?: string;
  completed?: boolean;
}

// Mock data for deadlines
const mockDeadlines: Deadline[] = [
  {
    id: '1',
    date: new Date(2026, 2, 15), // March 15
    type: 'early',
    title: 'Stanford REA Deadline',
    description: 'Restricted Early Action application due',
    school: 'Stanford',
    completed: false
  },
  {
    id: '2',
    date: new Date(2026, 2, 15), // March 15
    type: 'early',
    title: 'MIT EA Deadline',
    description: 'Early Action application due',
    school: 'MIT',
    completed: false
  },
  {
    id: '3',
    date: new Date(2026, 2, 20), // March 20
    type: 'application',
    title: 'UC Application Deadline',
    description: 'Regular Decision for UC schools',
    school: 'UC System',
    completed: false
  },
  {
    id: '4',
    date: new Date(2026, 2, 12), // March 12
    type: 'event',
    title: 'College Fair',
    description: 'Virtual college fair with top universities',
    completed: false
  },
  {
    id: '5',
    date: new Date(2026, 2, 25), // March 25
    type: 'custom',
    title: 'Essay Review Meeting',
    description: 'Meeting with counselor to review Common App essay',
    completed: false
  },
  {
    id: '6',
    date: new Date(2026, 2, 2), // March 2 (today)
    type: 'application',
    title: 'Submit Yale Supplement',
    description: 'Yale supplemental essays due',
    school: 'Yale',
    completed: true
  },
  {
    id: '7',
    date: new Date(2026, 2, 2), // March 2 (today)
    type: 'custom',
    title: 'Update Activities List',
    description: 'Add recent Science Olympiad achievement',
    completed: false
  }
];

export default function EnhancedCalendarWidget() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [deadlines] = useState<Deadline[]>(mockDeadlines);

  // Get deadlines for a specific date
  const getDeadlinesForDate = (date: Date) => {
    return deadlines.filter(deadline => isSameDay(deadline.date, date));
  };

  // Get deadlines for selected date
  const selectedDateDeadlines = useMemo(() => {
    if (!selectedDate) return [];
    return getDeadlinesForDate(selectedDate);
  }, [selectedDate, deadlines]);

  // Group deadlines by date for indicator dots
  const deadlinesByDate = useMemo(() => {
    const map = new Map<string, Deadline[]>();
    deadlines.forEach(deadline => {
      const key = format(deadline.date, 'yyyy-MM-dd');
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(deadline);
    });
    return map;
  }, [deadlines]);

  // Get color for deadline type
  const getDeadlineColor = (type: DeadlineType) => {
    switch (type) {
      case 'application':
        return 'bg-blue-500';
      case 'event':
        return 'bg-red-500';
      case 'early':
        return 'bg-green-500';
      case 'custom':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get icon for deadline type
  const getDeadlineIcon = (type: DeadlineType) => {
    switch (type) {
      case 'application':
        return <FileText className="w-4 h-4" />;
      case 'event':
        return <CalendarIcon className="w-4 h-4" />;
      case 'early':
        return <GraduationCap className="w-4 h-4" />;
      case 'custom':
        return <Clock className="w-4 h-4" />;
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  // Mark task as complete
  const toggleTaskCompletion = (deadlineId: string) => {
    // In a real app, this would update the database
    console.log('Toggling task:', deadlineId);
  };

  return (
    <div className="w-full space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Calendar</h3>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => console.log('Navigate to full calendar')}
        >
          <ExternalLink className="w-3 h-3" />
          Full Calendar
        </Button>
      </div>

      {/* Calendar Component */}
      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="w-full"
          modifiers={{
            hasDeadlines: (date: Date) => {
              const key = format(date, 'yyyy-MM-dd');
              return deadlinesByDate.has(key);
            }
          }}
          modifiersClassNames={{
            hasDeadlines: 'font-semibold'
          }}
          components={{
            Day: ({ date, displayMonth }: any) => {
              if (!date) return null;
              const dayDeadlines = getDeadlinesForDate(date);
              const isOutside = displayMonth && date.getMonth() !== displayMonth.getMonth();

              return (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <span className={isOutside ? 'text-gray-400' : ''}>
                    {format(date, 'd')}
                  </span>
                  {dayDeadlines.length > 0 && !isOutside && (
                    <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                      {dayDeadlines.slice(0, 3).map((deadline, index) => (
                        <div
                          key={index}
                          className={`w-1 h-1 rounded-full ${getDeadlineColor(deadline.type)}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            }
          }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-gray-600">Application</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-600">Early</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-gray-600">Event</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-gray-600">Custom</span>
        </div>
      </div>

      {/* Selected Date Tasks */}
      {selectedDate && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              {format(selectedDate, 'EEEE, MMMM d')}
            </h4>
            {selectedDateDeadlines.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {selectedDateDeadlines.filter(d => !d.completed).length} pending
              </Badge>
            )}
          </div>

          {selectedDateDeadlines.length > 0 ? (
            <div className="space-y-2">
              {selectedDateDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className={`p-3 rounded-lg border ${
                    deadline.completed
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  } transition-all group cursor-pointer`}
                  onClick={() => toggleTaskCompletion(deadline.id)}
                >
                  <div className="flex items-start gap-3">
                    <button
                      className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        deadline.completed
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300 group-hover:border-blue-400'
                      }`}
                    >
                      {deadline.completed && (
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      )}
                    </button>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${getDeadlineColor(deadline.type)} text-white`}>
                          {getDeadlineIcon(deadline.type)}
                        </div>
                        <span className={`text-sm font-medium ${
                          deadline.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                        }`}>
                          {deadline.title}
                        </span>
                        {deadline.school && (
                          <Badge variant="outline" className="text-xs">
                            {deadline.school}
                          </Badge>
                        )}
                      </div>
                      <p className={`text-xs ${
                        deadline.completed ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {deadline.description}
                      </p>
                    </div>

                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 rounded-lg">
              No deadlines or events on this date
            </div>
          )}
        </div>
      )}
    </div>
  );
}