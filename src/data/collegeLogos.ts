/**
 * College Logo System
 * 
 * Centralized logo URLs for top 30 colleges.
 * Uses official/high-quality logos from university brand resources.
 * 
 * HARD-CODED: These are official college logo URLs from university websites
 * and brand asset pages. Update URLs if they become unavailable.
 * 
 * US News Rankings are approximate 2024 rankings for demonstration.
 */

export interface CollegeLogoData {
  name: string;
  shortName: string;
  logoLight: string;      // Logo for light backgrounds (colored/dark logo)
  logoDark: string;       // Logo for dark backgrounds (white/light logo)
  logoIcon?: string;      // Square icon version if available
  fallbackInitials: string;
  brandColor: string;     // Primary brand color in HSL
  usNewsRank: number;     // US News National University Ranking
}

export const collegeLogos: Record<string, CollegeLogoData> = {
  // Ivy League
  stanford: {
    name: 'Stanford University',
    shortName: 'Stanford',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Stanford_Cardinal_logo.svg/1200px-Stanford_Cardinal_logo.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Stanford_Cardinal_logo.svg/1200px-Stanford_Cardinal_logo.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Stanford_Cardinal_logo.svg/1200px-Stanford_Cardinal_logo.svg.png',
    fallbackInitials: 'SU',
    brandColor: 'hsl(0, 70%, 35%)',
    usNewsRank: 3,
  },
  harvard: {
    name: 'Harvard University',
    shortName: 'Harvard',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Harvard_University_coat_of_arms.svg/1200px-Harvard_University_coat_of_arms.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Harvard_University_coat_of_arms.svg/1200px-Harvard_University_coat_of_arms.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Harvard_University_coat_of_arms.svg/1200px-Harvard_University_coat_of_arms.svg.png',
    fallbackInitials: 'H',
    brandColor: 'hsl(350, 70%, 40%)',
    usNewsRank: 4,
  },
  yale: {
    name: 'Yale University',
    shortName: 'Yale',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Yale_University_Shield_1.svg/1200px-Yale_University_Shield_1.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Yale_University_Shield_1.svg/1200px-Yale_University_Shield_1.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Yale_University_Shield_1.svg/1200px-Yale_University_Shield_1.svg.png',
    fallbackInitials: 'Y',
    brandColor: 'hsl(215, 80%, 25%)',
    usNewsRank: 5,
  },
  princeton: {
    name: 'Princeton University',
    shortName: 'Princeton',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Princeton_seal.svg/1200px-Princeton_seal.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Princeton_seal.svg/1200px-Princeton_seal.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Princeton_seal.svg/1200px-Princeton_seal.svg.png',
    fallbackInitials: 'P',
    brandColor: 'hsl(25, 100%, 40%)',
    usNewsRank: 1,
  },
  columbia: {
    name: 'Columbia University',
    shortName: 'Columbia',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Columbia_University_shield.svg/1200px-Columbia_University_shield.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Columbia_University_shield.svg/1200px-Columbia_University_shield.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Columbia_University_shield.svg/1200px-Columbia_University_shield.svg.png',
    fallbackInitials: 'C',
    brandColor: 'hsl(210, 80%, 35%)',
    usNewsRank: 12,
  },
  brown: {
    name: 'Brown University',
    shortName: 'Brown',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Brown_University_coat_of_arms.svg/1200px-Brown_University_coat_of_arms.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Brown_University_coat_of_arms.svg/1200px-Brown_University_coat_of_arms.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Brown_University_coat_of_arms.svg/1200px-Brown_University_coat_of_arms.svg.png',
    fallbackInitials: 'B',
    brandColor: 'hsl(20, 50%, 30%)',
    usNewsRank: 9,
  },
  upenn: {
    name: 'University of Pennsylvania',
    shortName: 'Penn',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/UPenn_shield_with_banner.svg/1200px-UPenn_shield_with_banner.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/UPenn_shield_with_banner.svg/1200px-UPenn_shield_with_banner.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/UPenn_shield_with_banner.svg/1200px-UPenn_shield_with_banner.svg.png',
    fallbackInitials: 'UP',
    brandColor: 'hsl(215, 75%, 30%)',
    usNewsRank: 6,
  },
  cornell: {
    name: 'Cornell University',
    shortName: 'Cornell',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Cornell_University_seal.svg/1200px-Cornell_University_seal.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Cornell_University_seal.svg/1200px-Cornell_University_seal.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Cornell_University_seal.svg/1200px-Cornell_University_seal.svg.png',
    fallbackInitials: 'C',
    brandColor: 'hsl(0, 65%, 40%)',
    usNewsRank: 11,
  },
  dartmouth: {
    name: 'Dartmouth College',
    shortName: 'Dartmouth',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Dartmouth_College_shield.svg/1200px-Dartmouth_College_shield.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Dartmouth_College_shield.svg/1200px-Dartmouth_College_shield.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Dartmouth_College_shield.svg/1200px-Dartmouth_College_shield.svg.png',
    fallbackInitials: 'D',
    brandColor: 'hsl(155, 60%, 25%)',
    usNewsRank: 18,
  },
  
  // Top Private Universities
  mit: {
    name: 'Massachusetts Institute of Technology',
    shortName: 'MIT',
    logoLight: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/44/MIT_Seal.svg/1200px-MIT_Seal.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/44/MIT_Seal.svg/1200px-MIT_Seal.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/44/MIT_Seal.svg/1200px-MIT_Seal.svg.png',
    fallbackInitials: 'MIT',
    brandColor: 'hsl(0, 60%, 30%)',
    usNewsRank: 2,
  },
  duke: {
    name: 'Duke University',
    shortName: 'Duke',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Duke_Blue_Devils_logo.svg/1200px-Duke_Blue_Devils_logo.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Duke_Blue_Devils_logo.svg/1200px-Duke_Blue_Devils_logo.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Duke_Blue_Devils_logo.svg/1200px-Duke_Blue_Devils_logo.svg.png',
    fallbackInitials: 'D',
    brandColor: 'hsl(220, 80%, 30%)',
    usNewsRank: 7,
  },
  northwestern: {
    name: 'Northwestern University',
    shortName: 'Northwestern',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Northwestern_Wildcats_logo.svg/1200px-Northwestern_Wildcats_logo.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Northwestern_Wildcats_logo.svg/1200px-Northwestern_Wildcats_logo.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Northwestern_Wildcats_logo.svg/1200px-Northwestern_Wildcats_logo.svg.png',
    fallbackInitials: 'NU',
    brandColor: 'hsl(270, 60%, 35%)',
    usNewsRank: 9,
  },
  caltech: {
    name: 'California Institute of Technology',
    shortName: 'Caltech',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Seal_of_the_California_Institute_of_Technology.svg/1200px-Seal_of_the_California_Institute_of_Technology.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Seal_of_the_California_Institute_of_Technology.svg/1200px-Seal_of_the_California_Institute_of_Technology.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Seal_of_the_California_Institute_of_Technology.svg/1200px-Seal_of_the_California_Institute_of_Technology.svg.png',
    fallbackInitials: 'CT',
    brandColor: 'hsl(25, 100%, 45%)',
    usNewsRank: 6,
  },
  jhu: {
    name: 'Johns Hopkins University',
    shortName: 'Johns Hopkins',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Formal_Seal_of_Johns_Hopkins_University.svg/1200px-Formal_Seal_of_Johns_Hopkins_University.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Formal_Seal_of_Johns_Hopkins_University.svg/1200px-Formal_Seal_of_Johns_Hopkins_University.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Formal_Seal_of_Johns_Hopkins_University.svg/1200px-Formal_Seal_of_Johns_Hopkins_University.svg.png',
    fallbackInitials: 'JHU',
    brandColor: 'hsl(210, 70%, 35%)',
    usNewsRank: 9,
  },
  uchicago: {
    name: 'University of Chicago',
    shortName: 'UChicago',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/University_of_Chicago_Coat_of_arms.svg/1200px-University_of_Chicago_Coat_of_arms.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/University_of_Chicago_Coat_of_arms.svg/1200px-University_of_Chicago_Coat_of_arms.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/University_of_Chicago_Coat_of_arms.svg/1200px-University_of_Chicago_Coat_of_arms.svg.png',
    fallbackInitials: 'UC',
    brandColor: 'hsl(350, 65%, 35%)',
    usNewsRank: 12,
  },
  rice: {
    name: 'Rice University',
    shortName: 'Rice',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Rice_Owls_logo.svg/1200px-Rice_Owls_logo.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Rice_Owls_logo.svg/1200px-Rice_Owls_logo.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Rice_Owls_logo.svg/1200px-Rice_Owls_logo.svg.png',
    fallbackInitials: 'R',
    brandColor: 'hsl(215, 65%, 30%)',
    usNewsRank: 17,
  },
  vanderbilt: {
    name: 'Vanderbilt University',
    shortName: 'Vanderbilt',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Vanderbilt_Commodores_logo.svg/1200px-Vanderbilt_Commodores_logo.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Vanderbilt_Commodores_logo.svg/1200px-Vanderbilt_Commodores_logo.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Vanderbilt_Commodores_logo.svg/1200px-Vanderbilt_Commodores_logo.svg.png',
    fallbackInitials: 'V',
    brandColor: 'hsl(45, 90%, 45%)',
    usNewsRank: 18,
  },
  notredame: {
    name: 'University of Notre Dame',
    shortName: 'Notre Dame',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Notre_Dame_Fighting_Irish_logo.svg/1200px-Notre_Dame_Fighting_Irish_logo.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Notre_Dame_Fighting_Irish_logo.svg/1200px-Notre_Dame_Fighting_Irish_logo.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Notre_Dame_Fighting_Irish_logo.svg/1200px-Notre_Dame_Fighting_Irish_logo.svg.png',
    fallbackInitials: 'ND',
    brandColor: 'hsl(215, 75%, 25%)',
    usNewsRank: 20,
  },
  georgetown: {
    name: 'Georgetown University',
    shortName: 'Georgetown',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Georgetown_Hoyas_logo.svg/1200px-Georgetown_Hoyas_logo.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Georgetown_Hoyas_logo.svg/1200px-Georgetown_Hoyas_logo.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Georgetown_Hoyas_logo.svg/1200px-Georgetown_Hoyas_logo.svg.png',
    fallbackInitials: 'GU',
    brandColor: 'hsl(215, 70%, 30%)',
    usNewsRank: 22,
  },
  washu: {
    name: 'Washington University in St. Louis',
    shortName: 'WashU',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Washington_University_in_St._Louis_seal.svg/1200px-Washington_University_in_St._Louis_seal.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Washington_University_in_St._Louis_seal.svg/1200px-Washington_University_in_St._Louis_seal.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Washington_University_in_St._Louis_seal.svg/1200px-Washington_University_in_St._Louis_seal.svg.png',
    fallbackInitials: 'WU',
    brandColor: 'hsl(350, 70%, 35%)',
    usNewsRank: 24,
  },
  emory: {
    name: 'Emory University',
    shortName: 'Emory',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Emory_University_Seal.svg/1200px-Emory_University_Seal.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Emory_University_Seal.svg/1200px-Emory_University_Seal.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Emory_University_Seal.svg/1200px-Emory_University_Seal.svg.png',
    fallbackInitials: 'E',
    brandColor: 'hsl(215, 75%, 30%)',
    usNewsRank: 24,
  },
  cmu: {
    name: 'Carnegie Mellon University',
    shortName: 'CMU',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Carnegie_Mellon_Tartans_logo.svg/1200px-Carnegie_Mellon_Tartans_logo.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Carnegie_Mellon_Tartans_logo.svg/1200px-Carnegie_Mellon_Tartans_logo.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Carnegie_Mellon_Tartans_logo.svg/1200px-Carnegie_Mellon_Tartans_logo.svg.png',
    fallbackInitials: 'CMU',
    brandColor: 'hsl(350, 75%, 40%)',
    usNewsRank: 24,
  },
  tufts: {
    name: 'Tufts University',
    shortName: 'Tufts',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Tufts_Jumbos_logo.svg/1200px-Tufts_Jumbos_logo.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Tufts_Jumbos_logo.svg/1200px-Tufts_Jumbos_logo.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Tufts_Jumbos_logo.svg/1200px-Tufts_Jumbos_logo.svg.png',
    fallbackInitials: 'T',
    brandColor: 'hsl(210, 70%, 35%)',
    usNewsRank: 40,
  },
  
  // Top Public Universities
  usc: {
    name: 'University of Southern California',
    shortName: 'USC',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/USC_Trojans_logo.svg/1200px-USC_Trojans_logo.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/USC_Trojans_logo.svg/1200px-USC_Trojans_logo.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/USC_Trojans_logo.svg/1200px-USC_Trojans_logo.svg.png',
    fallbackInitials: 'USC',
    brandColor: 'hsl(350, 75%, 40%)',
    usNewsRank: 28,
  },
  ucla: {
    name: 'University of California, Los Angeles',
    shortName: 'UCLA',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/UCLA_Bruins_primary_logo.svg/1200px-UCLA_Bruins_primary_logo.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/UCLA_Bruins_primary_logo.svg/1200px-UCLA_Bruins_primary_logo.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/UCLA_Bruins_primary_logo.svg/1200px-UCLA_Bruins_primary_logo.svg.png',
    fallbackInitials: 'UCLA',
    brandColor: 'hsl(205, 85%, 40%)',
    usNewsRank: 15,
  },
  berkeley: {
    name: 'University of California, Berkeley',
    shortName: 'UC Berkeley',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Seal_of_University_of_California%2C_Berkeley.svg/1200px-Seal_of_University_of_California%2C_Berkeley.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Seal_of_University_of_California%2C_Berkeley.svg/1200px-Seal_of_University_of_California%2C_Berkeley.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Seal_of_University_of_California%2C_Berkeley.svg/1200px-Seal_of_University_of_California%2C_Berkeley.svg.png',
    fallbackInitials: 'UCB',
    brandColor: 'hsl(210, 75%, 35%)',
    usNewsRank: 15,
  },
  nyu: {
    name: 'New York University',
    shortName: 'NYU',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/New_York_University_Seal.svg/1200px-New_York_University_Seal.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/New_York_University_Seal.svg/1200px-New_York_University_Seal.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/New_York_University_Seal.svg/1200px-New_York_University_Seal.svg.png',
    fallbackInitials: 'NYU',
    brandColor: 'hsl(270, 60%, 40%)',
    usNewsRank: 35,
  },
  umich: {
    name: 'University of Michigan',
    shortName: 'Michigan',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Michigan_Wolverines_logo.svg/1200px-Michigan_Wolverines_logo.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Michigan_Wolverines_logo.svg/1200px-Michigan_Wolverines_logo.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Michigan_Wolverines_logo.svg/1200px-Michigan_Wolverines_logo.svg.png',
    fallbackInitials: 'UM',
    brandColor: 'hsl(45, 100%, 45%)',
    usNewsRank: 21,
  },
  uva: {
    name: 'University of Virginia',
    shortName: 'UVA',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Virginia_Cavaliers_logo.svg/1200px-Virginia_Cavaliers_logo.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Virginia_Cavaliers_logo.svg/1200px-Virginia_Cavaliers_logo.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Virginia_Cavaliers_logo.svg/1200px-Virginia_Cavaliers_logo.svg.png',
    fallbackInitials: 'UVA',
    brandColor: 'hsl(220, 75%, 30%)',
    usNewsRank: 24,
  },
  gatech: {
    name: 'Georgia Institute of Technology',
    shortName: 'Georgia Tech',
    logoLight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Georgia_Tech_Yellow_Jackets_logo.svg/1200px-Georgia_Tech_Yellow_Jackets_logo.svg.png',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Georgia_Tech_Yellow_Jackets_logo.svg/1200px-Georgia_Tech_Yellow_Jackets_logo.svg.png',
    logoIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Georgia_Tech_Yellow_Jackets_logo.svg/1200px-Georgia_Tech_Yellow_Jackets_logo.svg.png',
    fallbackInitials: 'GT',
    brandColor: 'hsl(45, 95%, 45%)',
    usNewsRank: 33,
  },
};

/**
 * Get logo data for a specific college
 */
export const getCollegeLogo = (collegeId: string): CollegeLogoData | null => {
  return collegeLogos[collegeId] || null;
};

/**
 * Get all colleges sorted by US News ranking
 */
export const getCollegesByRank = (): Array<{ id: string; data: CollegeLogoData }> => {
  return Object.entries(collegeLogos)
    .map(([id, data]) => ({ id, data }))
    .sort((a, b) => a.data.usNewsRank - b.data.usNewsRank);
};

/**
 * Check if a college has logo data
 */
export const hasCollegeLogo = (collegeId: string): boolean => {
  return collegeId in collegeLogos;
};
