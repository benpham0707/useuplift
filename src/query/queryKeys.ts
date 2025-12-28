/**
 * Centralized query key factory for consistent caching and invalidation.
 * All query keys include user identity to prevent cross-user contamination.
 */
export const queryKeys = {
  // User profile and identity
  profileId: (userId: string) => ['profileId', userId] as const,
  profile: (userId: string) => ['profile', userId] as const,
  
  // Credits and transactions
  credits: (userId: string) => ['credits', userId] as const,
  creditTransactions: (userId: string) => ['creditTransactions', userId] as const,
  
  // Referrals
  referralMe: (userId: string) => ['referralMe', userId] as const,
  referralDiscount: (userId: string) => ['referralDiscount', userId] as const,
  
  // PIQ Workshop
  piqEssay: (userId: string, promptId: string | number) => ['piqEssay', userId, String(promptId)] as const,
  piqEssays: (userId: string) => ['piqEssays', userId] as const,
  
  // Portfolio Insights
  portfolioInsights: (userId: string) => ['portfolioInsights', userId] as const,
  
  // Portfolio Scanner sections (by profileId)
  personalInformation: (profileId: string) => ['personalInformation', profileId] as const,
  academicJourney: (profileId: string) => ['academicJourney', profileId] as const,
  experiencesActivities: (profileId: string) => ['experiencesActivities', profileId] as const,
  supportNetwork: (profileId: string) => ['supportNetwork', profileId] as const,
  goalsAspirations: (profileId: string) => ['goalsAspirations', profileId] as const,
  familyResponsibilities: (profileId: string) => ['familyResponsibilities', profileId] as const,
  personalGrowth: (profileId: string) => ['personalGrowth', profileId] as const,
  
  // Assessment progress (combines all sections)
  assessmentProgress: (profileId: string) => ['assessmentProgress', profileId] as const,
};

