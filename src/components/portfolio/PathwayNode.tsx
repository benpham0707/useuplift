import { Check, Lock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PathwaySection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  progress: number;
  status: 'completed' | 'in-progress' | 'available' | 'locked';
  unlockThreshold?: string;
}

interface PathwayNodeProps {
  section: PathwaySection;
  onClick: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  position?: string;
}

const PathwayNode = ({ section, onClick, isFirst, isLast, position }: PathwayNodeProps) => {
  const { title, description, icon: Icon, progress, status, unlockThreshold } = section;

  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          nodeClass: 'bg-gradient-to-br from-success via-success to-success/90 border-2 border-success/30 text-white shadow-strong hover:shadow-[0_0_30px_hsl(var(--success)/0.6)] hover:scale-105',
          ringClass: 'ring-4 ring-success/30 hover:ring-success/50',
          iconElement: <Check className="h-8 w-8" />,
          progressColor: 'text-white',
          clickable: true,
          celebration: true,
          bgGlow: 'bg-success/20'
        };
      case 'in-progress':
        return {
          nodeClass: 'bg-gradient-to-br from-primary via-primary to-primary/90 border-2 border-primary/30 text-white shadow-strong hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)] hover:scale-105 animate-pulse',
          ringClass: 'ring-4 ring-primary/30 hover:ring-primary/50 animate-pulse',
          iconElement: <Icon className="h-8 w-8" />,
          progressColor: 'text-white',
          clickable: true,
          celebration: false,
          bgGlow: 'bg-primary/20'
        };
      case 'available':
        return {
          nodeClass: 'bg-gradient-to-br from-secondary via-secondary to-secondary/90 border-2 border-secondary/30 text-white shadow-medium hover:shadow-strong hover:shadow-[0_0_25px_hsl(var(--secondary)/0.5)] hover:scale-105',
          ringClass: 'ring-3 ring-secondary/20 hover:ring-secondary/40',
          iconElement: <Icon className="h-8 w-8" />,
          progressColor: 'text-white',
          clickable: true,
          celebration: false,
          bgGlow: 'bg-secondary/20'
        };
      case 'locked':
        return {
          nodeClass: 'bg-gradient-to-br from-muted via-muted to-muted/80 border-2 border-muted/50 text-muted-foreground cursor-not-allowed opacity-60',
          ringClass: 'ring-2 ring-muted/20',
          iconElement: <Lock className="h-6 w-6" />,
          progressColor: 'text-muted-foreground',
          clickable: false,
          celebration: false,
          bgGlow: 'bg-muted/10'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="w-full max-w-md mx-auto group">
      {/* Enhanced Background Glow */}
      <div className={`absolute inset-0 rounded-3xl ${statusConfig.bgGlow} blur-2xl opacity-0 group-hover:opacity-70 transition-all duration-700 -z-10`} />
      
      {/* Main Node Container */}
      <div className="relative">
        {/* Large Progress Ring & Node */}
        <div className="relative flex justify-center mb-8">
          <div className="relative w-40 h-40">
            {/* Background Circle with Gradient */}
            <div className="absolute inset-0 w-40 h-40 rounded-full bg-gradient-to-br from-background/80 via-background/60 to-background/40 backdrop-blur-md border border-border/30" />
            
            {/* Progress Ring */}
            {progress > 0 && (
              <svg className="absolute inset-0 w-40 h-40 -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="72"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${(progress / 100) * 452.4} 452.4`}
                  strokeLinecap="round"
                  className={cn(
                    "transition-all duration-1000 drop-shadow-lg",
                    status === 'completed' ? 'text-success animate-pulse' : 
                    status === 'in-progress' ? 'text-primary animate-pulse' :
                    status === 'available' ? 'text-secondary' : 'text-muted'
                  )}
                />
              </svg>
            )}
            
            {/* Center Node */}
            <Button
              onClick={statusConfig.clickable ? onClick : undefined}
              disabled={!statusConfig.clickable}
              className={cn(
                "absolute inset-4 w-32 h-32 rounded-full transition-all duration-500 p-0 text-2xl font-bold group-hover:scale-110",
                statusConfig.nodeClass,
                statusConfig.ringClass,
                statusConfig.clickable && "active:scale-95 hover:animate-bounce"
              )}
            >
              {statusConfig.iconElement}
              
              {/* Enhanced Celebration Effects */}
              {statusConfig.celebration && (
                <>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-ping opacity-75" />
                  <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '0.5s' }} />
                  <div className="absolute top-0 left-1/2 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '1s' }} />
                </>
              )}
              
              {/* Pulsing Ring for Available/In-Progress */}
              {(status === 'available' || status === 'in-progress') && (
                <div className="absolute inset-0 rounded-full border-4 border-current opacity-30 animate-ping" />
              )}
            </Button>
          </div>

          {/* Progress Percentage */}
          {progress > 0 && progress < 100 && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-primary to-secondary text-white text-sm px-3 py-1 rounded-full font-bold shadow-medium">
                {progress}%
              </div>
            </div>
          )}

          {/* Completion Badge */}
          {status === 'completed' && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-success to-success/80 text-white text-sm px-3 py-1 rounded-full font-bold shadow-medium flex items-center space-x-1">
                <Check className="h-4 w-4" />
                <span>Complete</span>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Content Card */}
        <Card 
          className={cn(
            "transition-all duration-700 cursor-pointer shadow-strong border-2 backdrop-blur-sm",
            statusConfig.clickable && "hover:shadow-[0_10px_40px_rgba(0,0,0,0.2)] hover:border-primary/50 hover:-translate-y-2 hover:scale-105",
            !statusConfig.clickable && "opacity-60 cursor-not-allowed",
            status === 'completed' && "border-success/40 bg-gradient-to-br from-success/10 via-success/5 to-transparent",
            status === 'in-progress' && "border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent", 
            status === 'available' && "border-secondary/40 bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent",
            status === 'locked' && "border-muted/30 bg-gradient-to-br from-muted/10 via-muted/5 to-transparent"
          )}
          onClick={statusConfig.clickable ? onClick : undefined}
        >
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              {/* Title */}
              <h3 className={cn(
                "font-bold text-xl leading-tight",
                status === 'completed' && "text-success",
                status === 'in-progress' && "text-primary",
                status === 'available' && "text-secondary",
                status === 'locked' && "text-muted-foreground"
              )}>
                {title}
              </h3>
              
              {/* Description */}
              <p className="text-muted-foreground text-sm leading-relaxed">
                {description}
              </p>

              {/* Progress Bar for in-progress sections */}
              {status === 'in-progress' && progress > 0 && progress < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">Progress</span>
                    <span className="text-xs font-bold text-primary">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
              )}

              {/* Unlock requirement for locked sections */}
              {status === 'locked' && unlockThreshold && (
                <div className="text-xs text-muted-foreground bg-muted/30 px-4 py-3 rounded-lg border border-muted/50">
                  <Lock className="h-4 w-4 inline mr-2" />
                  {unlockThreshold}
                </div>
              )}

              {/* Enhanced Status indicator */}
              <div className="flex items-center justify-center space-x-3">
                <div className={cn(
                  "h-3 w-3 rounded-full",
                  status === 'completed' && "bg-success animate-pulse",
                  status === 'in-progress' && "bg-primary animate-pulse",
                  status === 'available' && "bg-secondary",
                  status === 'locked' && "bg-muted-foreground"
                )} />
                <span className="text-sm font-semibold capitalize">
                  {status === 'in-progress' ? 'In Progress' : status.replace('-', ' ')}
                </span>
                
                {/* Action Arrow */}
                {statusConfig.clickable && (
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-current transition-colors ml-2" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PathwayNode;