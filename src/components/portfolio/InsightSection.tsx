import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightSectionProps {
  title: string;
  count: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  variant?: 'high' | 'medium';
}

export const InsightSection: React.FC<InsightSectionProps> = ({
  title,
  count,
  defaultExpanded = false,
  children,
  variant = 'high',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const borderColor = variant === 'high' ? 'border-primary/20' : 'border-border';
  const badgeVariant = variant === 'high' ? 'default' : 'secondary';

  return (
    <div className={cn(
      'border-2 rounded-lg overflow-hidden transition-all duration-300 bg-gradient-to-br from-background/95 via-background/90 to-pink-50/80 backdrop-blur-xl shadow-lg',
      borderColor
    )}>
      {/* Header */}
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between p-7 md:p-8 h-auto hover:bg-accent/5"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            {title}
          </h3>
          <Badge variant={badgeVariant} className="text-base">
            {count}
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-6 w-6 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-6 w-6 text-muted-foreground" />
        )}
      </Button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-7 md:p-8 pt-0 animate-accordion-down">
          {children}
        </div>
      )}
    </div>
  );
};
