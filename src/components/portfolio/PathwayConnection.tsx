import { cn } from '@/lib/utils';

interface PathwayConnectionProps {
  fromStatus: 'completed' | 'in-progress' | 'available' | 'locked';
  toStatus: 'completed' | 'in-progress' | 'available' | 'locked';
  fromPosition?: string;
  toPosition?: string;
  isZigzag?: boolean;
}

const PathwayConnection = ({ fromStatus, toStatus, fromPosition, toPosition, isZigzag = false }: PathwayConnectionProps) => {
  const getConnectionStyle = () => {
    const isActive = fromStatus !== 'locked' && toStatus !== 'locked';
    const isCompleted = fromStatus === 'completed' && (toStatus === 'completed' || toStatus === 'in-progress' || toStatus === 'available');
    
    if (isCompleted) {
      return {
        color: 'hsl(var(--success))',
        opacity: 0.8,
        strokeWidth: 4,
        animation: 'none'
      };
    } else if (isActive) {
      return {
        color: 'hsl(var(--primary))',
        opacity: 0.6,
        strokeWidth: 3,
        animation: fromStatus === 'in-progress' ? 'dash' : 'none'
      };
    } else {
      return {
        color: 'hsl(var(--muted-foreground))',
        opacity: 0.3,
        strokeWidth: 2,
        animation: 'none'
      };
    }
  };

  const connectionStyle = getConnectionStyle();

  // Helper function to get position coordinates
  const getPositionCoords = (position: string) => {
    if (position?.includes('justify-start')) return { x: 25, side: 'left' };
    if (position?.includes('justify-end')) return { x: 75, side: 'right' };
    return { x: 50, side: 'center' };
  };

  const fromCoords = getPositionCoords(fromPosition || '');
  const toCoords = getPositionCoords(toPosition || '');

  if (!isZigzag) {
    // Simple vertical connection for non-zigzag layouts
    return (
      <div className="absolute left-1/2 top-32 w-0.5 h-16 z-0 transform -translate-x-1/2">
        <div 
          className="w-full h-full transition-all duration-500"
          style={{ 
            backgroundColor: connectionStyle.color,
            opacity: connectionStyle.opacity
          }} 
        />
      </div>
    );
  }

  // Zigzag curved connection using SVG
  return (
    <div className="absolute inset-0 w-full h-20 z-0 pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`gradient-${fromStatus}-${toStatus}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={connectionStyle.color} stopOpacity={connectionStyle.opacity} />
            <stop offset="50%" stopColor={connectionStyle.color} stopOpacity={connectionStyle.opacity * 0.7} />
            <stop offset="100%" stopColor={connectionStyle.color} stopOpacity={connectionStyle.opacity} />
          </linearGradient>
          
          {/* Animated dashes for in-progress connections */}
          {connectionStyle.animation === 'dash' && (
            <pattern id={`dash-${fromStatus}-${toStatus}`} patternUnits="userSpaceOnUse" width="8" height="2">
              <rect width="4" height="2" fill={connectionStyle.color} opacity={connectionStyle.opacity}>
                <animateTransform 
                  attributeName="transform" 
                  type="translate" 
                  values="0,0; 8,0; 0,0" 
                  dur="2s" 
                  repeatCount="indefinite"
                />
              </rect>
            </pattern>
          )}
        </defs>
        
        {/* Curved Path */}
        <path
          d={`M ${fromCoords.x} 2 Q ${(fromCoords.x + toCoords.x) / 2} 10 ${toCoords.x} 18`}
          fill="none"
          stroke={connectionStyle.animation === 'dash' ? `url(#dash-${fromStatus}-${toStatus})` : `url(#gradient-${fromStatus}-${toStatus})`}
          strokeWidth={connectionStyle.strokeWidth / 10} // Scale for viewBox
          strokeLinecap="round"
          className="transition-all duration-700"
        />
        
        {/* Connection dots */}
        <circle 
          cx={fromCoords.x} 
          cy="2" 
          r="0.8" 
          fill={connectionStyle.color} 
          opacity={connectionStyle.opacity}
          className="transition-all duration-500"
        />
        <circle 
          cx={toCoords.x} 
          cy="18" 
          r="0.8" 
          fill={connectionStyle.color} 
          opacity={connectionStyle.opacity}
          className="transition-all duration-500"
        />
        
        {/* Flowing particle effect for in-progress connections */}
        {connectionStyle.animation === 'dash' && (
          <circle 
            r="0.6" 
            fill={connectionStyle.color}
            opacity={connectionStyle.opacity * 0.8}
          >
            <animateMotion 
              dur="3s" 
              repeatCount="indefinite"
              path={`M ${fromCoords.x} 2 Q ${(fromCoords.x + toCoords.x) / 2} 10 ${toCoords.x} 18`}
            />
          </circle>
        )}
      </svg>
    </div>
  );
};

// Add the vertical flow animation to the global styles if not present
const style = document.createElement('style');
style.textContent = `
  @keyframes flow-vertical {
    0% { transform: translateY(-100%); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateY(100%); opacity: 0; }
  }
`;
if (!document.head.querySelector('style[data-pathway-animations]')) {
  style.setAttribute('data-pathway-animations', 'true');
  document.head.appendChild(style);
}

export default PathwayConnection;