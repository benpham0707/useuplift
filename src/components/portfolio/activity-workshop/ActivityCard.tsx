// @ts-nocheck
/**
 * ActivityCard — Compact card for a single activity in the input list.
 * Shows title + role + description preview in collapsed state.
 * Click to expand for inline editing.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Trash2, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Common App activity type options
export const ACTIVITY_TYPES = [
  'Academic',
  'Art',
  'Athletics: Club',
  'Athletics: JV/Varsity',
  'Career Oriented',
  'Community Service (Volunteer)',
  'Computer/Technology',
  'Cultural',
  'Dance',
  'Debate/Speech',
  'Environmental',
  'Family Responsibilities',
  'Foreign Exchange',
  'Journalism/Publication',
  'Junior R.O.T.C.',
  'LGBT',
  'Music: Instrumental',
  'Music: Vocal',
  'Religious',
  'Research',
  'Robotics',
  'School Spirit',
  'Science/Math',
  'Student Government',
  'Theater/Drama',
  'Work (Paid)',
  'Other Club/Activity',
] as const;

export interface ActivityFormData {
  id: string;
  activityType: string;
  role: string;
  organizationName: string;
  description: string;
  hoursPerWeek: number;
  weeksPerYear: number;
  gradeLevels: number[];
}

interface ActivityCardProps {
  activity: ActivityFormData;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onChange: (updated: ActivityFormData) => void;
  onDelete: () => void;
}

const ActivityCardInner = function ActivityCard({
  activity,
  index,
  isExpanded,
  onToggleExpand,
  onChange,
  onDelete,
}: ActivityCardProps) {
  const descCharCount = activity.description.length;
  const descLimit = 150;

  const handleFieldChange = (field: keyof ActivityFormData, value: any) => {
    onChange({ ...activity, [field]: value });
  };

  const toggleGradeLevel = (grade: number) => {
    const current = activity.gradeLevels;
    const next = current.includes(grade)
      ? current.filter((g) => g !== grade)
      : [...current, grade].sort();
    handleFieldChange('gradeLevels', next);
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm transition-all duration-200">
      {/* Collapsed header */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
        <span className="text-xs font-bold text-muted-foreground/60 w-5">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {activity.role || activity.organizationName || 'New Activity'}
            </span>
            {activity.activityType && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                {activity.activityType}
              </Badge>
            )}
          </div>
          {activity.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {activity.description}
            </p>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {/* Expanded edit form */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t">
          {/* Activity Type */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Activity Type
            </label>
            <select
              value={activity.activityType}
              onChange={(e) => handleFieldChange('activityType', e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select type...</option>
              {ACTIVITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Role + Organization (side by side) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Position/Role
              </label>
              <input
                type="text"
                value={activity.role}
                onChange={(e) => handleFieldChange('role', e.target.value)}
                placeholder="e.g. President, Volunteer"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                maxLength={50}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Organization Name
              </label>
              <input
                type="text"
                value={activity.organizationName}
                onChange={(e) => handleFieldChange('organizationName', e.target.value)}
                placeholder="e.g. School CS Club"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                maxLength={100}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">
                Description
              </label>
              <span
                className={`text-[10px] font-mono ${
                  descCharCount > descLimit ? 'text-red-500' : 'text-muted-foreground'
                }`}
              >
                {descCharCount}/{descLimit}
              </span>
            </div>
            <textarea
              value={activity.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Describe your involvement, impact, and key accomplishments..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none h-20"
              maxLength={descLimit}
            />
          </div>

          {/* Hours + Weeks (side by side) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Hours per Week
              </label>
              <input
                type="number"
                value={activity.hoursPerWeek || ''}
                onChange={(e) =>
                  handleFieldChange('hoursPerWeek', parseInt(e.target.value) || 0)
                }
                placeholder="e.g. 10"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                min={0}
                max={168}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Weeks per Year
              </label>
              <input
                type="number"
                value={activity.weeksPerYear || ''}
                onChange={(e) =>
                  handleFieldChange('weeksPerYear', parseInt(e.target.value) || 0)
                }
                placeholder="e.g. 40"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                min={0}
                max={52}
              />
            </div>
          </div>

          {/* Grade Levels */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Grade Levels
            </label>
            <div className="flex gap-2">
              {[9, 10, 11, 12].map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => toggleGradeLevel(grade)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                    activity.gradeLevels.includes(grade)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground hover:bg-muted border-input'
                  }`}
                >
                  {grade}th
                </button>
              ))}
            </div>
          </div>

          {/* Delete button */}
          <div className="flex justify-end pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ActivityCard = React.memo(ActivityCardInner);
