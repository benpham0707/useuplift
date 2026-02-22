// @ts-nocheck
/**
 * ActivityInputForm — Activity list input with add/edit/remove.
 * Mirrors Common App activity fields.
 * Up to 10 activities, with analyze CTA at the bottom.
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import { ActivityCard, type ActivityFormData } from './ActivityCard';

const MAX_ACTIVITIES = 10;

function createEmptyActivity(): ActivityFormData {
  return {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    activityType: '',
    role: '',
    organizationName: '',
    description: '',
    hoursPerWeek: 0,
    weeksPerYear: 0,
    gradeLevels: [],
  };
}

interface ActivityInputFormProps {
  onAnalyze: (activities: ActivityFormData[]) => void;
  isAnalyzing?: boolean;
}

export function ActivityInputForm({ onAnalyze, isAnalyzing = false }: ActivityInputFormProps) {
  const [activities, setActivities] = useState<ActivityFormData[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAdd = useCallback(() => {
    if (activities.length >= MAX_ACTIVITIES) return;
    const newActivity = createEmptyActivity();
    setActivities((prev) => [...prev, newActivity]);
    setExpandedId(newActivity.id);
  }, [activities.length]);

  const handleChange = useCallback((id: string, updated: ActivityFormData) => {
    setActivities((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      setActivities((prev) => prev.filter((a) => a.id !== id));
      if (expandedId === id) setExpandedId(null);
    },
    [expandedId]
  );

  const handleToggleExpand = useCallback(
    (id: string) => {
      setExpandedId((prev) => (prev === id ? null : id));
    },
    []
  );

  const filledActivities = activities.filter(
    (a) => a.description.trim().length > 0 || a.role.trim().length > 0
  );
  const canAnalyze = filledActivities.length >= 1 && !isAnalyzing;

  const encouragement = (() => {
    const count = filledActivities.length;
    if (count === 0) return 'Add your first activity to get started.';
    if (count === 1) return 'Great start! Add more activities for deeper portfolio insights.';
    if (count <= 3) return `${count} activities added. More activities = richer analysis.`;
    if (count <= 6) return `${count} activities — nice portfolio! You can add up to ${MAX_ACTIVITIES}.`;
    return `${count} activities — comprehensive portfolio ready for analysis!`;
  })();

  return (
    <div className="space-y-4">
      {/* Activity list */}
      {activities.length > 0 && (
        <div className="space-y-2">
          {activities.map((activity, index) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              index={index}
              isExpanded={expandedId === activity.id}
              onToggleExpand={() => handleToggleExpand(activity.id)}
              onChange={(updated) => handleChange(activity.id, updated)}
              onDelete={() => handleDelete(activity.id)}
            />
          ))}
        </div>
      )}

      {/* Add button */}
      {activities.length < MAX_ACTIVITIES && (
        <Button
          variant="outline"
          onClick={handleAdd}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Activity ({activities.length}/{MAX_ACTIVITIES})
        </Button>
      )}

      {/* Encouragement text */}
      <p className="text-xs text-muted-foreground text-center">{encouragement}</p>

      {/* Analyze CTA */}
      <Button
        onClick={() => onAnalyze(filledActivities)}
        disabled={!canAnalyze}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
        size="lg"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        {isAnalyzing ? 'Analyzing...' : 'Analyze My Portfolio'}
      </Button>
    </div>
  );
}
