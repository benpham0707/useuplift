/**
 * CollegeLogo Component
 * 
 * Reusable component for displaying official college logos.
 * Handles loading states, errors, and fallback to initials.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getCollegeLogo, CollegeLogoData } from '@/data/collegeLogos';
import { getCollegeColors } from '@/data/collegeColors';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type LogoVariant = 'light' | 'dark' | 'icon' | 'auto';

interface CollegeLogoProps {
  collegeId: string;
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
  showFallback?: boolean;
  rounded?: boolean;
}

const sizeClasses: Record<LogoSize, { container: string; text: string; img: string }> = {
  xs: { container: 'w-5 h-5', text: 'text-[8px]', img: 'max-h-5' },
  sm: { container: 'w-8 h-8', text: 'text-xs', img: 'max-h-8' },
  md: { container: 'w-10 h-10', text: 'text-sm', img: 'max-h-10' },
  lg: { container: 'w-14 h-14', text: 'text-base', img: 'max-h-14' },
  xl: { container: 'w-20 h-20', text: 'text-xl', img: 'max-h-20' },
  '2xl': { container: 'w-28 h-28', text: 'text-2xl', img: 'max-h-28' },
};

export const CollegeLogo = ({
  collegeId,
  size = 'md',
  variant = 'auto',
  className,
  showFallback = true,
  rounded = false,
}: CollegeLogoProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const logoData = getCollegeLogo(collegeId);
  const colorData = getCollegeColors(collegeId);
  const sizeConfig = sizeClasses[size];
  
  // Determine which logo URL to use based on variant
  const getLogoUrl = (): string | null => {
    if (!logoData) return null;
    
    switch (variant) {
      case 'light':
        return logoData.logoLight;
      case 'dark':
        return logoData.logoDark;
      case 'icon':
        return logoData.logoIcon || logoData.logoLight;
      case 'auto':
      default:
        // Could add dark mode detection here
        return logoData.logoLight;
    }
  };
  
  const logoUrl = getLogoUrl();
  const shouldShowFallback = !logoUrl || imageError;
  
  // Fallback initials component
  const FallbackInitials = () => {
    const initials = logoData?.fallbackInitials || collegeId.substring(0, 2).toUpperCase();
    
    return (
      <div
        className={cn(
          'flex items-center justify-center font-bold',
          sizeConfig.container,
          sizeConfig.text,
          rounded ? 'rounded-full' : 'rounded-lg',
          'bg-gradient-to-br from-muted to-muted/80',
          'border border-border/50',
          className
        )}
        style={{ color: colorData.primary }}
      >
        {initials}
      </div>
    );
  };
  
  if (shouldShowFallback && showFallback) {
    return <FallbackInitials />;
  }
  
  if (shouldShowFallback && !showFallback) {
    return null;
  }
  
  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        sizeConfig.container,
        rounded && 'rounded-full overflow-hidden',
        className
      )}
    >
      {/* Loading skeleton */}
      {!imageLoaded && (
        <div
          className={cn(
            'absolute inset-0 animate-pulse bg-muted',
            rounded ? 'rounded-full' : 'rounded-lg'
          )}
        />
      )}
      
      <img
        src={logoUrl!}
        alt={logoData?.name || collegeId}
        className={cn(
          'object-contain transition-opacity duration-200',
          sizeConfig.img,
          imageLoaded ? 'opacity-100' : 'opacity-0',
          rounded && 'rounded-full'
        )}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </div>
  );
};

export default CollegeLogo;
