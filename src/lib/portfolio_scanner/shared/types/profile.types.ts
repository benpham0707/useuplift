// src/shared/types/profile.types.ts

import { UserContext, ProfileStatus } from '../../core/domain/entities/UserProfile';
import { ExperienceType, TimeCommitment } from '../../core/domain/entities/Experience';
import { AchievementType, AchievementScope } from '../../core/domain/entities/Achievement';

// Profile Completion Types
export interface ProfileCompletionScore {
  overall: number; // 0-1
  sections: {
    basic: number;
    academic: number;
    experience: number;
    goals: number;
    enrichment: number;
  };
  nextMilestone: string;
}

export interface ProfileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completionScore: ProfileCompletionScore;
}

// Enrichment Types
export interface EnrichmentPriority {
  type: 'academic_record' | 'test_scores' | 'experiences' | 'achievements' | 'skills' | 'narrative';
  priority: 'high' | 'medium' | 'low';
  reason: string;
  estimatedImpact: number; // 0-1, how much this would improve profile
  estimatedTime?: string; // "5 minutes", "30 minutes", etc.
}

export interface EnrichmentRequest {
  profileId: string;
  priorities: EnrichmentPriority[];
  message: string;
  incentive?: string;
  dueDate?: Date;
}

export interface EnrichmentSession {
  id: string;
  profileId: string;
  startTime: Date;
  endTime?: Date;
  itemsCompleted: string[];
  completionRate: number;
}

// Data Collection Types
export interface DataCollectionStep {
  id: string;
  title: string;
  description: string;
  fields: FieldDefinition[];
  required: boolean;
  estimatedTime: string;
  completionIncentive?: string;
}

export interface FieldDefinition {
  name: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'date' | 'number' | 'boolean';
  label: string;
  placeholder?: string;
  helpText?: string;
  validation?: FieldValidation;
  options?: SelectOption[];
  conditionalOn?: ConditionalRule;
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null; // Return error message or null
}

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface ConditionalRule {
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
  value: any;
}

// AI Analysis Types
export interface SkillExtraction {
  skill: string;
  confidence: number; // 0-1
  evidence: string[];
  category: 'technical' | 'soft' | 'domain' | 'language';
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface HiddenStrengthAnalysis {
  strength: string;
  rationale: string;
  evidence: string[];
  relevantCareers: string[];
  developmentSuggestions: string[];
}

export interface NarrativeGeneration {
  audience: 'college_admissions' | 'scholarship' | 'employer' | 'general';
  tone: 'professional' | 'personal' | 'academic' | 'inspirational';
  length: 'elevator' | 'short' | 'medium' | 'full';
  themes: string[];
  generatedText: string;
  alternativeVersions?: string[];
}

// Gap Analysis Types
export interface SkillGap {
  skill: string;
  currentLevel: 'none' | 'beginner' | 'intermediate' | 'advanced';
  requiredLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  importance: 'critical' | 'important' | 'nice_to_have';
  estimatedLearningTime: string;
  recommendedResources: LearningResource[];
}

export interface LearningResource {
  type: 'course' | 'book' | 'video' | 'project' | 'mentorship' | 'practice';
  title: string;
  provider: string;
  url?: string;
  cost: 'free' | '$' | '$$' | '$$$';
  timeCommitment: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  userRating?: number;
}

export interface OpportunityGap {
  type: 'experience' | 'achievement' | 'skill' | 'credential';
  description: string;
  importance: number; // 0-1
  suggestions: OpportunitySuggestion[];
}

export interface OpportunitySuggestion {
  title: string;
  description: string;
  timeframe: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  impact: 'low' | 'medium' | 'high';
  steps: string[];
}

// Portfolio Analysis Types
export interface PortfolioStrength {
  area: string;
  score: number; // 0-1
  evidence: string[];
  improvements: string[];
}

export interface PortfolioAnalysis {
  overallStrength: number; // 0-100
  strengths: PortfolioStrength[];
  weaknesses: PortfolioStrength[];
  uniqueValue: string[];
  competitiveAdvantage: string[];
  risks: string[];
  recommendations: string[];
}

// Career Path Types
export interface CareerPathMatch {
  careerPath: string;
  matchScore: number; // 0-1
  strengths: string[];
  gaps: string[];
  nextSteps: string[];
  timelineEstimate: string;
  salaryRange: {
    entry: string;
    mid: string;
    senior: string;
  };
}

export interface AlternativePathAnalysis {
  traditionalPath: CareerPathMatch;
  alternativePaths: CareerPathMatch[];
  unconventionalOptions: {
    path: string;
    rationale: string;
    pioneers: string[]; // Examples of people who took this path
    risks: string[];
    rewards: string[];
  }[];
}

// API Request/Response Types
export interface CreateProfileRequest {
  userId: string;
  userContext: UserContext;
  goals: {
    primaryGoal: string;
    timelineUrgency: string;
    desiredOutcomes: string[];
  };
  constraints: {
    needsFinancialAid: boolean;
    geographicLimitations?: string;
    familyObligations?: boolean;
  };
  demographics?: {
    firstGenerationStudent?: boolean;
    englishSecondLanguage?: boolean;
  };
}

export interface UpdateProfileRequest {
  profileId: string;
  updates: Partial<{
    userContext: UserContext;
    status: ProfileStatus;
    goals: any;
    constraints: any;
    demographics: any;
  }>;
}

export interface AddExperienceRequest {
  profileId: string;
  experience: {
    title: string;
    organization: string;
    type: ExperienceType;
    startDate: string; // ISO date
    endDate?: string;
    timeCommitment: TimeCommitment;
    description: string;
    responsibilities?: string[];
    achievements?: string[];
    skills?: string[];
  };
}

export interface AddAchievementRequest {
  profileId: string;
  achievement: {
    title: string;
    organization: string;
    type: AchievementType;
    dateReceived: string; // ISO date
    scope: AchievementScope;
    description: string;
    metrics?: Record<string, any>;
    context?: {
      backstory?: string;
      effort?: string;
      significance?: string;
    };
  };
}

// Analytics Types
export interface ProfileAnalyticsEvent {
  profileId: string;
  eventType: 'profile_created' | 'section_completed' | 'enrichment_completed' | 
             'achievement_added' | 'experience_added' | 'goal_updated';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface EnrichmentAnalytics {
  profileId: string;
  totalSessions: number;
  averageSessionDuration: number;
  completionRates: Record<string, number>;
  mostEngagedSections: string[];
  dropoffPoints: string[];
}

// Gamification Types
export interface ProfileLevel {
  current: 'bronze' | 'silver' | 'gold' | 'platinum';
  progress: number; // 0-100 to next level
  unlockedFeatures: string[];
  nextMilestone: {
    level: string;
    requirement: string;
    reward: string;
  };
}

export interface ProfileBadge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  earnedDate: Date;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

// Export convenience type unions
export type ProfileUpdateType = 
  | 'basic_info'
  | 'academic_record'
  | 'experience'
  | 'achievement'
  | 'goals'
  | 'constraints';

export type ProfileSectionStatus = 
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'needs_update';

// Notification Types
export interface ProfileNotification {
  id: string;
  profileId: string;
  type: 'enrichment_request' | 'milestone_reached' | 'update_reminder' | 
        'opportunity_match' | 'deadline_approaching';
  title: string;
  message: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

// Privacy Types
export interface ProfilePrivacySettings {
  profileId: string;
  shareWithEmployers: boolean;
  shareWithColleges: boolean;
  shareWithPeers: boolean;
  anonymizeForResearch: boolean;
  dataRetentionPeriod: '1_year' | '2_years' | '5_years' | 'indefinite';
}

// Bias Prevention Types
export interface BiasCheckResult {
  profileId: string;
  timestamp: Date;
  potentialBiases: {
    area: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    mitigation: string;
  }[];
  fairnessScore: number; // 0-1
  recommendations: string[];
}