import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, TrendingUp, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecommendationInsightCardProps {
  title: string;
  priority: 'high' | 'medium' | 'low';
  impact?: string;
  timeline?: string;
  rationale?: string;
  category?: string;
  categoryIcon?: LucideIcon;
  className?: string;
}

export const RecommendationInsightCard: React.FC<RecommendationInsightCardProps> = ({
  title,
  priority,
  impact,
  timeline,
  rationale,
  category,
  categoryIcon: CategoryIcon,
  className
}) => {
  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-amber-500';
      case 'low':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const getPriorityBadgeVariant = (): 'destructive' | 'default' | 'secondary' => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getPriorityLabel = () => {
    switch (priority) {
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
        return 'Low Priority';
      default:
        return 'Priority';
    }
  };

  return (
    <Card className={cn(
      "bg-white border-2 border-l-4 transition-all duration-300 hover:shadow-lg",
      getPriorityColor(),
      className
    )}>
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-base leading-tight flex-1">{title}</h3>
            {CategoryIcon && (
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <CategoryIcon className="h-5 w-5 text-amber-600" />
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getPriorityBadgeVariant()} className="text-xs">
              {getPriorityLabel()}
            </Badge>
            {category && (
              <Badge variant="outline" className="text-xs">
                {category}
              </Badge>
            )}
          </div>
        </div>

        {/* Impact & Timeline */}
        <div className="space-y-2">
          {impact && (
            <div className="flex items-start gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-emerald-700">Impact: </span>
                <span className="text-muted-foreground">{impact}</span>
              </div>
            </div>
          )}
          
          {timeline && (
            <div className="flex items-start gap-2 text-sm">
              <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-blue-700">Timeline: </span>
                <span className="text-muted-foreground">{timeline}</span>
              </div>
            </div>
          )}
        </div>

        {/* Rationale */}
        {rationale && (
          <div className="pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Why this matters: </span>
              {rationale}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
