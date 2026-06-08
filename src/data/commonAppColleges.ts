/**
 * Common App Colleges Data
 * 
 * Central data source for Common App supplemental essays.
 * Contains college metadata and essay prompts with enhanced fields.
 */

// HARD-CODED: Placeholder college data for development/testing
// These prompts are representative examples and may not reflect current year prompts

export type SupplementalCategory = 'why_us' | 'why_major' | 'community' | 'extracurricular' | 'intellectual' | 'additional';

export interface CommonAppSupplemental {
  id: string;
  collegeId: string;
  number: number;
  title: string;
  prompt: string;
  wordLimit: number;
  wordMin?: number;
  required: boolean;
  category: SupplementalCategory;
}

export interface CommonAppCollege {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  supplementals: CommonAppSupplemental[];
}

export const COMMON_APP_COLLEGES: CommonAppCollege[] = [
  {
    id: 'stanford',
    name: 'Stanford University',
    shortName: 'Stanford',
    supplementals: [
      {
        id: 'stanford-1',
        collegeId: 'stanford',
        number: 1,
        title: 'Intellectual Curiosity',
        prompt: 'The Stanford community is deeply curious and driven to learn in and out of the classroom. Reflect on an idea or experience that makes you genuinely excited about learning.',
        wordLimit: 250,
        wordMin: 100,
        required: true,
        category: 'intellectual',
      },
      {
        id: 'stanford-2',
        collegeId: 'stanford',
        number: 2,
        title: 'Roommate Letter',
        prompt: 'Virtually all of Stanford\'s undergraduates live on campus. Write a note to your future roommate that reveals something about you or that will help your roommate—and us—get to know you better.',
        wordLimit: 250,
        wordMin: 100,
        required: true,
        category: 'community',
      },
      {
        id: 'stanford-3',
        collegeId: 'stanford',
        number: 3,
        title: 'What Matters Most',
        prompt: 'Tell us about something that is meaningful to you, and why?',
        wordLimit: 250,
        wordMin: 100,
        required: true,
        category: 'additional',
      },
    ],
  },
  {
    id: 'mit',
    name: 'Massachusetts Institute of Technology',
    shortName: 'MIT',
    supplementals: [
      {
        id: 'mit-1',
        collegeId: 'mit',
        number: 1,
        title: 'World You Come From',
        prompt: 'Describe the world you come from (for example, your family, school, community, city, or town). How has that world shaped your dreams and aspirations?',
        wordLimit: 250,
        required: true,
        category: 'community',
      },
      {
        id: 'mit-2',
        collegeId: 'mit',
        number: 2,
        title: 'Activities for Pleasure',
        prompt: 'We know you lead a busy life, full of activities, many of which are required of you. Tell us about something you do simply for the pleasure of it.',
        wordLimit: 250,
        required: true,
        category: 'extracurricular',
      },
      {
        id: 'mit-3',
        collegeId: 'mit',
        number: 3,
        title: 'Community Impact',
        prompt: 'Describe one way in which you have contributed to your community, whether in your family, the classroom, your neighborhood, etc.',
        wordLimit: 250,
        required: true,
        category: 'community',
      },
      {
        id: 'mit-4',
        collegeId: 'mit',
        number: 4,
        title: 'Challenge',
        prompt: 'Tell us about a significant challenge you\'ve faced or something that didn\'t go according to plan. How did you manage the situation?',
        wordLimit: 250,
        required: true,
        category: 'additional',
      },
      {
        id: 'mit-5',
        collegeId: 'mit',
        number: 5,
        title: 'Creative Expression',
        prompt: 'Tell us about something you created, designed, or built. What was the creative process like for you?',
        wordLimit: 250,
        required: false,
        category: 'intellectual',
      },
    ],
  },
  {
    id: 'harvard',
    name: 'Harvard University',
    shortName: 'Harvard',
    supplementals: [
      {
        id: 'harvard-1',
        collegeId: 'harvard',
        number: 1,
        title: 'Open Essay',
        prompt: 'Harvard has long recognized the importance of enrolling a diverse student body. How will the life experiences that shape who you are today enable you to contribute to Harvard?',
        wordLimit: 200,
        required: true,
        category: 'additional',
      },
    ],
  },
  {
    id: 'yale',
    name: 'Yale University',
    shortName: 'Yale',
    supplementals: [
      {
        id: 'yale-1',
        collegeId: 'yale',
        number: 1,
        title: 'Why Yale',
        prompt: 'What is it about Yale that has led you to apply?',
        wordLimit: 125,
        required: true,
        category: 'why_us',
      },
      {
        id: 'yale-2',
        collegeId: 'yale',
        number: 2,
        title: 'Academic Interest',
        prompt: 'Reflect on your engagement with a topic or idea that excites you. Why are you drawn to it?',
        wordLimit: 250,
        required: true,
        category: 'why_major',
      },
      {
        id: 'yale-3',
        collegeId: 'yale',
        number: 3,
        title: 'Community',
        prompt: 'Yale\'s residential colleges regularly host conversations with guests representing a wide range of experiences and perspectives. What person, living or deceased, would you invite to speak? What would you ask them to discuss?',
        wordLimit: 250,
        required: false,
        category: 'community',
      },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all prompts as a flat array with college info attached
 */
export const getAllPrompts = (): (CommonAppSupplemental & { collegeName: string; collegeShortName: string })[] => {
  return COMMON_APP_COLLEGES.flatMap(college =>
    college.supplementals.map(supp => ({
      ...supp,
      collegeName: college.name,
      collegeShortName: college.shortName,
    }))
  );
};

/**
 * Get college by ID
 */
export const getCollegeById = (collegeId: string): CommonAppCollege | undefined => {
  return COMMON_APP_COLLEGES.find(c => c.id === collegeId);
};

/**
 * Get prompt by ID with college info
 */
export const getPromptById = (promptId: string): (CommonAppSupplemental & { collegeName: string; collegeShortName: string }) | undefined => {
  const allPrompts = getAllPrompts();
  return allPrompts.find(p => p.id === promptId);
};

/**
 * Get prompts by category
 */
export const getPromptsByCategory = (category: SupplementalCategory): (CommonAppSupplemental & { collegeName: string; collegeShortName: string })[] => {
  return getAllPrompts().filter(p => p.category === category);
};

/**
 * Get display label for category
 */
export const getCategoryLabel = (category: SupplementalCategory): string => {
  const labels: Record<SupplementalCategory, string> = {
    why_us: 'Why Us',
    why_major: 'Why Major',
    community: 'Community',
    extracurricular: 'Activities',
    intellectual: 'Intellectual',
    additional: 'Additional',
  };
  return labels[category];
};

/**
 * Get category color classes
 */
export const getCategoryColors = (category: SupplementalCategory): { bg: string; text: string; border: string } => {
  const colors: Record<SupplementalCategory, { bg: string; text: string; border: string }> = {
    why_us: { bg: 'bg-blue-100 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
    why_major: { bg: 'bg-purple-100 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
    community: { bg: 'bg-green-100 dark:bg-green-950/40', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
    extracurricular: { bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
    intellectual: { bg: 'bg-cyan-100 dark:bg-cyan-950/40', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
    additional: { bg: 'bg-slate-100 dark:bg-slate-800/40', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' },
  };
  return colors[category];
};

/**
 * Format word limit display (handles min-max range)
 */
export const formatWordLimit = (prompt: CommonAppSupplemental): string => {
  if (prompt.wordMin) {
    return `${prompt.wordMin}-${prompt.wordLimit} words`;
  }
  return `${prompt.wordLimit} words`;
};
