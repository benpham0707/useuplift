/**
 * ScoreRing — Shared SVG score ring component.
 * Consolidates 4 duplicate implementations across the activity workshop.
 */
import React from 'react';
import { getScoreColor, getScoreTextColor } from './insightTypes';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  animateOnMount?: boolean;
}

const ScoreRing = React.memo(function ScoreRing({
  score,
  size = 48,
  strokeWidth = 3,
  showLabel = true,
  label,
  animateOnMount = false,
}: ScoreRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / 10, 1);
  const offset = circumference * (1 - pct);
  const color = getScoreColor(score);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-sm font-bold tabular-nums ${getScoreTextColor(score)}`}>
            {score.toFixed(1)}
          </span>
          {label && (
            <span className="text-[9px] text-muted-foreground font-medium">{label}</span>
          )}
        </div>
      )}
    </div>
  );
});

export default ScoreRing;
