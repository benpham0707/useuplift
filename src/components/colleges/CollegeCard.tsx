/**
 * CollegeCard Component
 *
 * Displays a college in the gallery grid with lazy-loaded images
 * Priority hierarchy: Logo + Name → Location + Setting → Key Stats → Match Indicator
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { College, CollegeCategory } from '@/lib/types/college';
import { Building2 } from 'lucide-react';

interface CollegeCardProps {
  college: College;
  category?: CollegeCategory;
  onSave?: (college: College) => void;
}

export function CollegeCard({ college, category }: CollegeCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/dashboard/colleges/${college.slug}`);
  };

  // Format stats for display
  const acceptanceText = college.acceptance_rate
    ? `${college.acceptance_rate}% acceptance`
    : 'N/A';

  const gpaText =
    college.avg_gpa_min && college.avg_gpa_max
      ? `${college.avg_gpa_min}-${college.avg_gpa_max} GPA`
      : '';

  const satText =
    college.avg_sat_min && college.avg_sat_max
      ? `${college.avg_sat_min}-${college.avg_sat_max} SAT`
      : '';

  const settingText = college.campus_setting
    ? college.campus_setting.charAt(0).toUpperCase() + college.campus_setting.slice(1)
    : '';

  const categoryBadgeColors = {
    reach: 'bg-red-100 text-red-800 border-red-200',
    match: 'bg-green-100 text-green-800 border-green-200',
    safety: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        {/* Logo + Name */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 shrink-0 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
            {college.logo_url ? (
              <img
                src={college.logo_url}
                alt={`${college.name} logo`}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            ) : (
              <Building2 className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {college.name}
            </h3>
          </div>
          {category && (
            <Badge variant="outline" className={categoryBadgeColors[category]}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Badge>
          )}
        </div>

        {/* Location + Setting */}
        <div className="text-sm text-muted-foreground mb-3">
          {college.city}, {college.state}
          {settingText && ` • ${settingText}`}
          {college.type && ` • ${college.type.charAt(0).toUpperCase() + college.type.slice(1)}`}
        </div>

        {/* Key Stats */}
        <div className="text-sm space-y-1">
          <div className="text-slate-700">{acceptanceText}</div>
          {gpaText && <div className="text-slate-600">{gpaText}</div>}
          {satText && <div className="text-slate-600">{satText}</div>}
        </div>

        {/* Program Strengths Pills */}
        {college.program_strengths && college.program_strengths.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {college.program_strengths.slice(0, 3).map((strength) => (
              <span
                key={strength}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
              >
                {strength}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
