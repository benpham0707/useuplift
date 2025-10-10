import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface QuickMetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  colorClasses: string;
  borderColor: string;
  visualIndicator?: React.ReactNode;
}

export function QuickMetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  colorClasses,
  borderColor,
  visualIndicator
}: QuickMetricCardProps) {
  return (
    <Card className={`${colorClasses} border-l-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full`} style={{ borderLeftColor: borderColor }}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left side: Number and text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-5xl font-bold tracking-tight text-foreground">
                {value}
              </span>
              {visualIndicator && (
                <div className="ml-2">
                  {visualIndicator}
                </div>
              )}
            </div>
            <div className="text-sm font-semibold text-foreground/90 mb-0.5">
              {title}
            </div>
            <div className="text-xs text-muted-foreground">
              {subtitle}
            </div>
          </div>

          {/* Right side: Icon */}
          <div className="flex-shrink-0">
            <div className="p-2 rounded-lg bg-background/50">
              <Icon className="h-6 w-6" style={{ color: borderColor }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
