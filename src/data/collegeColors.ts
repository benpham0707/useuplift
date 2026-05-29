/**
 * College Brand Colors & Visual Identity
 * 
 * Defines brand colors and visual styling for each college
 * to create distinct visual identities in the workshop.
 */

export interface CollegeVisualIdentity {
  primary: string;      // HSL primary brand color
  accent: string;       // HSL accent color
  gradient: string;     // Tailwind gradient classes
  bgLight: string;      // Light mode background
  bgDark: string;       // Dark mode background
  borderLight: string;  // Light mode border
  borderDark: string;   // Dark mode border
  icon: string;         // Icon/logo text color
}

export const collegeColors: Record<string, CollegeVisualIdentity> = {
  stanford: {
    primary: 'hsl(0 70% 35%)',
    accent: 'hsl(350 60% 45%)',
    gradient: 'from-red-800 via-red-700 to-red-600',
    bgLight: 'bg-red-50',
    bgDark: 'dark:bg-red-950/20',
    borderLight: 'border-red-200',
    borderDark: 'dark:border-red-800/50',
    icon: 'text-red-700 dark:text-red-400',
  },
  harvard: {
    primary: 'hsl(350 70% 40%)',
    accent: 'hsl(345 65% 50%)',
    gradient: 'from-red-900 via-red-800 to-red-700',
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-950/20',
    borderLight: 'border-rose-200',
    borderDark: 'dark:border-rose-800/50',
    icon: 'text-rose-800 dark:text-rose-400',
  },
  mit: {
    primary: 'hsl(0 60% 30%)',
    accent: 'hsl(220 10% 50%)',
    gradient: 'from-red-950 via-gray-800 to-gray-700',
    bgLight: 'bg-slate-50',
    bgDark: 'dark:bg-slate-900/30',
    borderLight: 'border-slate-300',
    borderDark: 'dark:border-slate-700',
    icon: 'text-slate-800 dark:text-slate-300',
  },
  yale: {
    primary: 'hsl(215 80% 25%)',
    accent: 'hsl(210 70% 45%)',
    gradient: 'from-blue-900 via-blue-800 to-blue-700',
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-950/20',
    borderLight: 'border-blue-200',
    borderDark: 'dark:border-blue-800/50',
    icon: 'text-blue-800 dark:text-blue-400',
  },
  princeton: {
    primary: 'hsl(25 100% 40%)',
    accent: 'hsl(0 0% 10%)',
    gradient: 'from-orange-600 via-orange-500 to-amber-500',
    bgLight: 'bg-orange-50',
    bgDark: 'dark:bg-orange-950/20',
    borderLight: 'border-orange-200',
    borderDark: 'dark:border-orange-800/50',
    icon: 'text-orange-700 dark:text-orange-400',
  },
  columbia: {
    primary: 'hsl(210 80% 35%)',
    accent: 'hsl(210 70% 50%)',
    gradient: 'from-sky-800 via-sky-700 to-sky-600',
    bgLight: 'bg-sky-50',
    bgDark: 'dark:bg-sky-950/20',
    borderLight: 'border-sky-200',
    borderDark: 'dark:border-sky-800/50',
    icon: 'text-sky-700 dark:text-sky-400',
  },
  brown: {
    primary: 'hsl(20 50% 30%)',
    accent: 'hsl(25 45% 40%)',
    gradient: 'from-amber-900 via-amber-800 to-amber-700',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-950/20',
    borderLight: 'border-amber-200',
    borderDark: 'dark:border-amber-800/50',
    icon: 'text-amber-800 dark:text-amber-400',
  },
  upenn: {
    primary: 'hsl(215 75% 30%)',
    accent: 'hsl(0 70% 45%)',
    gradient: 'from-blue-900 via-blue-800 to-red-800',
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-950/20',
    borderLight: 'border-blue-200',
    borderDark: 'dark:border-blue-800/50',
    icon: 'text-blue-800 dark:text-blue-400',
  },
  cornell: {
    primary: 'hsl(0 65% 40%)',
    accent: 'hsl(355 60% 50%)',
    gradient: 'from-red-700 via-red-600 to-red-500',
    bgLight: 'bg-red-50',
    bgDark: 'dark:bg-red-950/20',
    borderLight: 'border-red-200',
    borderDark: 'dark:border-red-800/50',
    icon: 'text-red-700 dark:text-red-400',
  },
  dartmouth: {
    primary: 'hsl(155 60% 25%)',
    accent: 'hsl(150 50% 35%)',
    gradient: 'from-green-900 via-green-800 to-green-700',
    bgLight: 'bg-green-50',
    bgDark: 'dark:bg-green-950/20',
    borderLight: 'border-green-200',
    borderDark: 'dark:border-green-800/50',
    icon: 'text-green-800 dark:text-green-400',
  },
};

// Default fallback for colleges not in the list
export const defaultCollegeColors: CollegeVisualIdentity = {
  primary: 'hsl(260 60% 50%)',
  accent: 'hsl(260 50% 60%)',
  gradient: 'from-purple-700 via-purple-600 to-purple-500',
  bgLight: 'bg-purple-50',
  bgDark: 'dark:bg-purple-950/20',
  borderLight: 'border-purple-200',
  borderDark: 'dark:border-purple-800/50',
  icon: 'text-purple-700 dark:text-purple-400',
};

/**
 * Get visual identity for a college
 */
export const getCollegeColors = (collegeId: string): CollegeVisualIdentity => {
  return collegeColors[collegeId] || defaultCollegeColors;
};

/**
 * Get combined background classes for a college
 */
export const getCollegeBgClasses = (collegeId: string): string => {
  const colors = getCollegeColors(collegeId);
  return `${colors.bgLight} ${colors.bgDark}`;
};

/**
 * Get combined border classes for a college
 */
export const getCollegeBorderClasses = (collegeId: string): string => {
  const colors = getCollegeColors(collegeId);
  return `${colors.borderLight} ${colors.borderDark}`;
};