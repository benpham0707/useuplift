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
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left side: Number and text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-4xl font-bold tracking-tight text-foreground">
                {value}
              </span>
              {visualIndicator && (
                <div className="ml-1">
                  {visualIndicator}
                </div>
              )}
            </div>
            <div className="text-xs font-semibold text-foreground/90 mb-0.5">
              {title}
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">
              {subtitle}
            </div>
          </div>

          {/* Right side: Icon */}
          <div className="flex-shrink-0">
            <div className="p-1.5 rounded-lg bg-background/50">
              <Icon className="h-5 w-5" style={{ color: borderColor }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
