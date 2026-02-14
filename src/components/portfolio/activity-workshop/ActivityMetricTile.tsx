import React from 'react';
import { cn } from '@/lib/utils';
import GradientText from '@/components/ui/GradientText';

interface ActivityMetricTileProps {
  label: string;
  value: string | number;
  maxValue?: string | number;
  suffix?: string;
  onClick: () => void;
  isSelected: boolean;
  tileRef?: React.Ref<HTMLDivElement>;
  colors: string[];
  glowStyle?: React.CSSProperties;
}

const ActivityMetricTile: React.FC<ActivityMetricTileProps> = ({
  label,
  value,
  maxValue,
  suffix,
  onClick,
  isSelected,
  tileRef,
  colors,
  glowStyle,
}) => {
  return (
    <div
      ref={tileRef}
      onClick={onClick}
      className={cn(
        'relative cursor-pointer rounded-xl border p-4 transition-all duration-300',
        'bg-card/80 backdrop-blur-sm hover:shadow-lg',
        isSelected
          ? 'border-blue-500/50 shadow-lg shadow-blue-500/10 dark:shadow-blue-500/20 ring-1 ring-blue-500/30'
          : 'border-border/50 hover:border-blue-400/30'
      )}
      style={isSelected ? glowStyle : undefined}
    >
      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
        {label}
      </p>
      <div className="flex items-baseline gap-0.5">
        <GradientText colors={colors} animationSpeed={6} className="text-2xl font-bold">
          {value}
        </GradientText>
        {maxValue && (
          <span className="text-sm text-muted-foreground">/{maxValue}</span>
        )}
        {suffix && (
          <span className="text-sm text-muted-foreground ml-1">{suffix}</span>
        )}
      </div>
    </div>
  );
};

export default ActivityMetricTile;
