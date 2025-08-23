// src/shared/types/enhanced.types.ts

import { 
  UserContext, 
  ProfileStatus 
} from '../../core/domain/entities/UserProfile';

// Strict Constants with const assertions
export const PROFILE_CONSTANTS = {
  MAX_EXPERIENCES: 100,
  MAX_ACHIEVEMENTS: 50,
  MAX_SKILLS: 200,
  MAX_NARRATIVE_LENGTH: 5000,
  CACHE_TTL: {
    PROFILE: 3600,
    ANALYSIS: 86400,
    SKILLS: 7200
  },
  COMPLETION_THRESHOLDS: {
    BRONZE: 0.4,
    SILVER: 0.6,
    GOLD: 0.8,
    PLATINUM: 0.95
  }
} as const;

// Strongly typed metric values
export type MetricValue = {
  type: 'number';
  value: number;
  unit?: string;
} | {
  type: 'percentage';
  value: number; // 0-100
} | {
  type: 'currency';
  value: number;
  currency: 'USD' | 'EUR' | 'GBP';
} | {
  type: 'text';
  value: string;
};

export interface StrictExperienceMetrics {
  peopleImpacted?: MetricValue;
  moneyRaised?: MetricValue;
  moneyEarned?: MetricValue;
  hoursContributed?: MetricValue;
  teamSize?: MetricValue;
  customMetrics: Record<string, MetricValue>;
}

// Strict Goal Types
export interface StrictProfileGoals {
  primaryGoal: 'college_admission' | 'career_prep' | 'skill_development' | 'exploring_options';
  secondaryGoals?: Array<'networking' | 'portfolio_building' | 'certification' | 'research'>;
  targetColleges?: string[];
  targetCareers?: string[];
  targetCompanies?: string[];
  timelineUrgency: 'immediate' | 'this_year' | 'next_year' | 'flexible';
  desiredOutcomes: string[];
  constraints: {
    maxTuition?: number;
    requiredAid?: number;
    preferredLocation?: string[];
  };
}

// DTO Layer for API Communication
export namespace ProfileDTO {
  export interface CreateRequest {
    userId: string;
    userContext: UserContext;
    goals: StrictProfileGoals;
    constraints: {
      needsFinancialAid: boolean;
      geographicLimitations?: 'local_only' | 'in_state' | 'regional' | 'anywhere';
      familyObligations?: boolean;
      workingWhileStudying?: boolean;
      disabilityAccommodations?: boolean;
    };
    demographics?: {
      firstGenerationStudent?: boolean;
      englishSecondLanguage?: boolean;
      socioeconomicBackground?: 'low_income' | 'middle_income' | 'high_income' | 'prefer_not_say';
      race?: string;
      gender?: string;
    };
  }

  export interface UpdateRequest {
    profileId: string;
    updates: {
      userContext?: UserContext;
      status?: ProfileStatus;
      goals?: Partial<StrictProfileGoals>;
      constraints?: Partial<CreateRequest['constraints']>;
      demographics?: Partial<CreateRequest['demographics']>;
    };
  }

  export interface Response {
    id: string;
    userId: string;
    userContext: UserContext;
    status: ProfileStatus;
    completionScore: ProfileCompletionScore;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
    level: ProfileLevel;
    nextEnrichmentPriorities: EnrichmentPriority[];
  }

  export interface DetailedResponse extends Response {
    academicRecord?: AcademicRecordDTO.Response;
    experiences: ExperienceDTO.Response[];
    achievements: AchievementDTO.Response[];
    extractedSkills: Array<{
      skill: string;
      confidence: number;
      sources: string[];
    }>;
    hiddenStrengths: string[];
    narrativeSummary?: string;
  }
}

export namespace AcademicRecordDTO {
  export interface CreateRequest {
    school: {
      name: string;
      type: 'public' | 'private' | 'charter' | 'magnet' | 'homeschool' | 'international';
      city: string;
      state?: string;
      country: string;
      graduationYear?: number;
    };
    currentGrade: string;
    gpa?: number;
    gpaScale: '4.0' | '5.0' | '100' | 'international';
    weightedGPA?: number;
    classRank?: number;
    classSize?: number;
    strongSubjects?: string[];
    strugglingSubjects?: string[];
  }

  export interface Response extends CreateRequest {
    id: string;
    profileId: string;
    academicStrength: {
      overall: number;
      factors: Record<string, number>;
    };
    suggestedImprovements: string[];
  }
}

export namespace ExperienceDTO {
  export interface CreateRequest {
    title: string;
    organization: string;
    type: ExperienceType;
    startDate: string; // ISO date
    endDate?: string; // ISO date
    timeCommitment: TimeCommitment;
    description: string;
    responsibilities?: string[];
    achievements?: string[];
    skills?: string[];
    metrics?: Record<string, MetricValue>;
  }

  export interface Response extends CreateRequest {
    id: string;
    profileId: string;
    duration: number; // months
    extractedSkills: SkillExtraction[];
    hiddenStrengths: string[];
    narrativeSummary?: string;
    collegeRelevanceScore?: number;
    strengthAnalysis: {
      score: number;
      strengths: string[];
      improvements: string[];
    };
  }
}

export namespace AchievementDTO {
  export interface CreateRequest {
    title: string;
    organization: string;
    type: AchievementType;
    dateReceived: string; // ISO date
    scope: AchievementScope;
    description: string;
    metrics?: {
      ranking?: string;
      participants?: number;
      selectionRate?: number;
      quantifiedImpact?: string;
    };
    context?: {
      backstory?: string;
      effort?: string;
      significance?: string;
      growth?: string;
    };
  }

  export interface Response extends CreateRequest {
    id: string;
    profileId: string;
    impact: AchievementImpact;
    isUnderrecognized: boolean;
    enhancedDescription?: string;
    prestigeScore: number;
    narratives: {
      elevator: string;
      short: string;
      full: string;
    };
  }
}

// Enhanced Types for Side Hustle Intelligence
export interface SideHustleCategory {
  category: 'ecommerce' | 'content_creation' | 'freelancing' | 'tutoring' | 
            'gig_economy' | 'service_based' | 'digital_products' | 'other';
  platforms: string[];
  timeActive: number; // months
  averageHoursPerWeek: number;
  revenueRange: '$0-100' | '$100-500' | '$500-1000' | '$1000-5000' | '$5000+';
  skills: string[];
  achievements: string[];
}

export interface HobbyTranslation {
  hobby: string;
  category: 'gaming' | 'sports' | 'creative' | 'technical' | 'social' | 'academic';
  translatedSkills: Array<{
    skill: string;
    proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    evidence: string;
    professionalRelevance: string;
  }>;
  leadershipIndicators?: string[];
  timeInvestment: number; // hours per week
}

// Cache Key Generation
export class CacheKeyGenerator {
  private static readonly PREFIX = 'portfolio_scanner';
  
  static profile(profileId: string): string {
    return `${this.PREFIX}:profile:${profileId}`;
  }
  
  static profileByUser(userId: string): string {
    return `${this.PREFIX}:profile:user:${userId}`;
  }
  
  static analysis(profileId: string): string {
    return `${this.PREFIX}:analysis:${profileId}`;
  }
  
  static experiences(profileId: string, page?: number): string {
    return `${this.PREFIX}:experiences:${profileId}${page ? `:page:${page}` : ''}`;
  }
  
  static achievements(profileId: string, page?: number): string {
    return `${this.PREFIX}:achievements:${profileId}${page ? `:page:${page}` : ''}`;
  }
  
  static skills(profileId: string): string {
    return `${this.PREFIX}:skills:${profileId}`;
  }
  
  static enrichmentPriorities(profileId: string): string {
    return `${this.PREFIX}:enrichment:${profileId}`;
  }
}

// Pagination Types
export interface PaginationRequest {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Event Types for Event Sourcing
export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: 'profile' | 'experience' | 'achievement' | 'academic_record';
  eventData: Record<string, unknown>;
  eventMetadata: {
    userId: string;
    timestamp: Date;
    version: number;
    correlationId?: string;
  };
}

export class ProfileCreatedEvent implements DomainEvent {
  eventId: string;
  eventType = 'ProfileCreated';
  aggregateType: 'profile' = 'profile';
  
  constructor(
    public aggregateId: string,
    public eventData: {
      userId: string;
      userContext: UserContext;
      goals: StrictProfileGoals;
    },
    public eventMetadata: DomainEvent['eventMetadata']
  ) {
    this.eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Validation Types
export interface FieldValidationRule {
  field: string;
  rules: Array<{
    type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom' | 
          'dateRange' | 'businessRule' | 'uniqueness';
    params?: Record<string, unknown>;
    message: string;
  }>;
}

export interface ValidationContext {
  entity: 'profile' | 'experience' | 'achievement' | 'academic_record';
  operation: 'create' | 'update' | 'delete';
  existingData?: Record<string, unknown>;
  relatedData?: Record<string, unknown>;
}

// Import remaining types from original file
export type {
  ProfileCompletionScore,
  ProfileValidationResult,
  EnrichmentPriority,
  SkillExtraction,
  HiddenStrengthAnalysis,
  NarrativeGeneration,
  SkillGap,
  LearningResource,
  ProfileAnalysis,
  CareerPathMatch,
  AlternativePathAnalysis,
  ProfileAnalyticsEvent,
  ProfileLevel,
  ProfileBadge,
  BiasCheckResult
} from './profile.types';

// Re-export enums with consistent naming
export { 
  UserContext,
  ProfileStatus,
  ExperienceType,
  TimeCommitment,
  AchievementType,
  AchievementScope,
  AchievementImpact,
  GPAScale,
  CourseLevel
} from '../../core/domain/entities';

// Type guards for runtime validation
export const TypeGuards = {
  isMetricValue(value: unknown): value is MetricValue {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as any;
    return ['number', 'percentage', 'currency', 'text'].includes(v.type);
  },
  
  isPaginationRequest(value: unknown): value is PaginationRequest {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as any;
    return typeof v.page === 'number' && typeof v.limit === 'number';
  },
  
  isDomainEvent(value: unknown): value is DomainEvent {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as any;
    return v.eventId && v.eventType && v.aggregateId && v.eventData && v.eventMetadata;
  }
};