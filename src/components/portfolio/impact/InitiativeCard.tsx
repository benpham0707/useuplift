import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Initiative } from './ImpactLedger';
import { cn } from '@/lib/utils';

interface InitiativeCardProps {
  initiative: Initiative;
  onOpenModal: (initiative: Initiative) => void;
}

const statusConfig = {
  'ongoing': { label: 'Ongoing', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  'handed-off': { label: 'Handed Off', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  'completed': { label: 'Completed', color: 'bg-muted text-muted-foreground border-border' },
};

export const InitiativeCard: React.FC<InitiativeCardProps> = ({ initiative, onOpenModal }) => {
  const [isHovered, setIsHovered] = useState(false);
  const statusStyle = statusConfig[initiative.durability.status];

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={isHovered}>
        <TooltipTrigger asChild>
          <Card
            className={cn(
              "border-primary/20 cursor-pointer transition-all duration-200",
              isHovered && "border-primary/40 shadow-lg -translate-y-1"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onOpenModal(initiative)}
          >
            <CardContent className="p-5 space-y-3">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground line-clamp-2">
                  {initiative.name}
                </h3>
                <Badge className={cn("text-xs w-fit", statusStyle.color)}>
                  {statusStyle.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {initiative.outcome.primary}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span className="line-clamp-1">{initiative.beneficiary.who}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold">{initiative.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{initiative.beneficiary.who}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{initiative.timeSpan.duration}</span>
            </div>
            <p className="text-xs text-primary">Click for full details</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};