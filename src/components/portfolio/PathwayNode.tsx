import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import GlowEffect from '@/components/ui/GlowEffect';
import FlowingBanner from '@/components/ui/FlowingBanner';
import { useState } from 'react';

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

const PathwayNode = ({ section, onClick }: PathwayNodeProps) => {
  const { title, description, icon: Icon, progress, status, unlockThreshold } = section;
  const gradientId = `progressGradient_${section.id}`;
  const filterId = `ringGlow_${section.id}`;
  const [isHovered, setIsHovered] = useState(false);

  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          borderColor: 'border-success',
          bgColor: 'bg-success/10',
          textColor: 'text-success',
          iconBg: 'bg-success',
          iconColor: 'text-white',
          clickable: true
        };
      case 'in-progress':
        return {
          borderColor: 'border-primary',
          bgColor: 'bg-primary/10',
          textColor: 'text-primary',
          iconBg: 'bg-primary',
          iconColor: 'text-white',
          clickable: true
        };
      case 'available':
        return {
          borderColor: 'border-secondary',
          bgColor: 'bg-secondary/10',
          textColor: 'text-secondary',
          iconBg: 'bg-secondary',
          iconColor: 'text-white',
          clickable: true
        };
      case 'locked':
        return {
          borderColor: 'border-muted',
          bgColor: 'bg-muted/10',
          textColor: 'text-muted-foreground',
          iconBg: 'bg-muted',
          iconColor: 'text-muted-foreground',
          clickable: false
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="relative">
      <FlowingBanner 
        isCompleted={status === 'completed'}
        sectionId={section.id}
        isHovered={isHovered}
      />
      <GlowEffect
        className={cn("rounded-xl relative")}
        style={{ overflow: 'visible', willChange: 'transform', transform: 'translateZ(0)' }}
        glowColor="147, 51, 234"
        enableBorderGlow={true}
        enableSpotlight={true}
        enableParticles={false}
        enableTilt={true}
        enableMagnetism={false}
        clickEffect={false}
        spotlightRadius={220}
      >
        <div
        className={cn(
          "relative z-10 w-[34rem] md:w-[40rem] p-12 rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-visible",
          // Pastel glass background for contrast without murkiness
          "border-purple-400/40",
          "bg-gradient-to-br from-purple-50/80 via-indigo-50/70 to-blue-50/80",
          "backdrop-blur-xl",
          config.clickable && "hover:shadow-lg hover:scale-[1.02]",
          !config.clickable && "opacity-60 cursor-not-allowed"
        )}
        style={{
          boxShadow: '0 8px 30px rgba(147, 51, 234, 0.15), 0 0 30px rgba(59, 130, 246, 0.10), inset 0 0 0 1px rgba(255,255,255,0.25)'
        }}
        onClick={config.clickable ? onClick : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* Color tint overlay for depth */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/12 via-blue-500/10 to-cyan-400/12" />
      {/* Subtle vignette */}
      <div className="pointer-events-none absolute inset-0 rounded-xl" style={{ background: 'radial-gradient(120% 90% at 50% 40%, rgba(0,0,0,0) 55%, rgba(124,58,237,0.05) 100%)' }} />
      {/* Progress Ring */}
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
        <div className="relative w-20 h-20">
          {/* Background Ring */}
          <div className={cn("w-20 h-20 rounded-full border-4 border-white/20 bg-gradient-to-br from-purple-600 to-blue-600")}/>
          
          {/* Progress Ring */}
          {progress > 0 && (
            <svg className="absolute inset-0 w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60A5FA" />
                  <stop offset="50%" stopColor="#22D3EE" />
                  <stop offset="100%" stopColor="#A78BFA" />
                </linearGradient>
                <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth="6"
                strokeDasharray={`${(progress / 100) * 213} 213`}
                strokeLinecap="round"
                filter={`url(#${filterId})`}
              />
            </svg>
          )}
          
          {/* Center Icon */}
          <div className={cn("absolute inset-2 w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-md")}>        
            {status === 'completed' ? (
              <Check className={cn("h-8 w-8", "text-white")} />
            ) : status === 'locked' ? (
              <Lock className={cn("h-7 w-7", "text-white/90")} />
            ) : (
              <Icon className={cn("h-8 w-8", "text-white")} />
            )}
          </div>
          
          {/* Progress Percentage */}
          {progress > 0 && progress < 100 && (
            <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2">
              <div className={cn("px-2.5 py-1 rounded-full text-[13px] font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600")}> 
                {progress}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-16 text-center relative z-10">
        <h3 className={cn("font-bold text-[28px] mb-5 text-foreground")}> 
          {title}
        </h3>
        
        <p className="text-muted-foreground text-[19px] mb-7 leading-relaxed">
          {description}
        </p>

        {/* Status Indicator */}
        <div className="flex items-center justify-center space-x-2.5">
          <div className={cn("h-2.5 w-2.5 rounded-full", 
            status === 'completed' && "bg-emerald-400",
            status === 'in-progress' && "bg-purple-400",
            status === 'available' && "bg-blue-400", 
            status === 'locked' && "bg-slate-400"
          )} />
          <span className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
            {status === 'in-progress' ? 'In Progress' : status.replace('-', ' ')}
          </span>
        </div>

        {/* Unlock Message */}
        {status === 'locked' && unlockThreshold && (
          <div className="mt-4 text-xs text-white/80 bg-white/10 px-3 py-2 rounded-lg border border-white/20">
            {unlockThreshold}
          </div>
        )}
      </div>
      </div>
      </GlowEffect>
    </div>
  );
};

export default PathwayNode;