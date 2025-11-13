import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OverallScoreDisplayProps {
  score: number;
  tierName: string;
  percentile: string;
}

export const OverallScoreDisplay: React.FC<OverallScoreDisplayProps> = ({
  score,
  tierName,
  percentile,
}) => {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 px-4 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent rounded-2xl">
      {/* Large score */}
      <div className="text-center">
        <div className="text-7xl md:text-8xl font-extrabold bg-gradient-to-br from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          {score}
        </div>
        <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">
          Overall
        </div>
      </div>

      {/* Tier badge */}
      <Badge 
        variant="default" 
        className="text-sm px-4 py-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
      >
        {tierName}
      </Badge>

      {/* Percentile */}
      <div className="text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">
          Percentile
        </div>
        <div className="text-lg font-bold text-foreground">
          {percentile}
        </div>
      </div>
    </div>
  );
};
