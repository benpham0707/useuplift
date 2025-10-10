import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  variant = 'default',
  className
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'gradient-gpa text-white border-l-4 border-l-purple-500';
      case 'secondary':
        return 'gradient-percentile text-white border-l-4 border-l-blue-500';
      case 'success':
        return 'gradient-progress text-white border-l-4 border-l-emerald-500';
      case 'warning':
        return 'gradient-requirements text-white border-l-4 border-l-amber-500';
      default:
        return 'bg-card border-gradient border-l-4 border-l-gray-300';
    }
  };

  return (
    <Card className={cn(
      'group hover-lift transition-all duration-300 shadow-soft relative overflow-hidden',
      getVariantClasses(),
      className
    )}>
      <CardContent className="p-6 relative z-10">
        <div className="space-y-3">
          <h3 className={cn(
            'text-sm font-medium tracking-wide uppercase',
            variant === 'default' ? 'text-muted-foreground' : 'text-white/80'
          )}>
            {title}
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <div className={cn(
                'text-3xl font-bold tracking-tight',
                variant === 'default' ? 'text-foreground' : 'text-white'
              )}>
                {value}
              </div>
              
              {/* Mini circular progress indicator for visual interest */}
              {variant !== 'default' && typeof value === 'number' && (
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      className="stroke-current text-white/20"
                      strokeWidth="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      className="stroke-current text-white"
                      strokeWidth="3"
                      strokeDasharray={`${(value / 10) * 88}, 88`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}
            </div>
            
            {subtitle && (
              <p className={cn(
                'text-sm leading-snug',
                variant === 'default' ? 'text-muted-foreground' : 'text-white/70'
              )}>
                {subtitle}
              </p>
            )}
            
            {trend && trendValue && (
              <div className={cn(
                'flex items-center gap-2 text-sm font-medium',
                variant === 'default' ? getTrendColor() : 'text-white/90'
              )}>
                {getTrendIcon()}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Subtle decorative gradient overlay */}
      {variant !== 'default' && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      )}
    </Card>
  );
};