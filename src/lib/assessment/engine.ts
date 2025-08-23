// ==================================================================================
// ADAPTIVE CAREER ASSESSMENT ENGINE
// Enterprise-grade assessment flow management with intelligent conditional logic
// ==================================================================================

import { 
  type CompleteAssessment, 
  type AssessmentSection, 
  type AssessmentSubsection,
  type AssessmentPath,
  type ProgressState,
  AcademicStatus,
  InitialRoutingSchema,
  HighSchoolAcademicSchema,
  CollegeAcademicSchema,
  ProfessionalExperienceSchema,
  InterestDiscoverySchema,
  GoalsConstraintsSchema,
  CareerDirectionSchema,
  PersonalityWorkStyleSchema,
  NetworkResourcesSchema,
  FinalQuestionsSchema
} from '@/lib/types/assessment';

// ==================================================================================
// ASSESSMENT FLOW CONFIGURATION
// ==================================================================================

/**
 * Enterprise-grade assessment section definitions with adaptive logic
 * Each section can have conditional requirements based on user responses
 */
export const ASSESSMENT_SECTIONS: AssessmentSection[] = [
  {
    id: 'initial_routing',
    title: 'Getting Started',
    description: 'Basic information to personalize your assessment experience',
    required: true,
    estimatedMinutes: 2,
    subsections: [
      {
        id: 'basic_info',
        title: 'Basic Information',
        component: 'InitialRoutingForm',
        validation: InitialRoutingSchema,
        required: true
      }
    ]
  },
  
  {
    id: 'interest_discovery',
    title: 'Interest Discovery',
    description: 'Discover your career interests and explore potential paths',
    required: true,
    estimatedMinutes: 8,
    subsections: [
      {
        id: 'interests_exploration',
        title: 'Career Interests',
        component: 'InterestDiscoveryForm',
        validation: InterestDiscoverySchema,
        required: true
      }
    ]
  },
  
  {
    id: 'high_school_academic',
    title: 'Academic Background',
    description: 'Your high school academic experience and achievements',
    required: false,
    estimatedMinutes: 5,
    subsections: [
      {
        id: 'academic_details',
        title: 'Academic Details',
        component: 'HighSchoolAcademicForm',
        validation: HighSchoolAcademicSchema,
        required: true
      }
    ]
  },
  
  {
    id: 'college_academic',
    title: 'College Experience',
    description: 'Your college academic background and major focus',
    required: false,
    estimatedMinutes: 5,
    subsections: [
      {
        id: 'college_details',
        title: 'College Details',
        component: 'CollegeAcademicForm',
        validation: CollegeAcademicSchema,
        required: true
      }
    ]
  },
  
  {
    id: 'professional_experience',
    title: 'Professional Experience',
    description: 'Your work experience and professional background',
    required: false,
    estimatedMinutes: 6,
    subsections: [
      {
        id: 'work_experience',
        title: 'Work Experience',
        component: 'ProfessionalExperienceForm',
        validation: ProfessionalExperienceSchema,
        required: true
      }
    ]
  },
  
  {
    id: 'activities',
    title: 'Activities & Interests',
    description: 'Your extracurricular activities and personal interests',
    required: true,
    estimatedMinutes: 4,
    subsections: [
      {
        id: 'activities_interests',
        title: 'Activities & Interests',
        component: 'ActivitiesForm',
        validation: InitialRoutingSchema,
        required: true
      }
    ]
  },
  
  {
    id: 'goals_constraints',
    title: 'Goals & Constraints',
    description: 'Your career goals and any constraints to consider',
    required: true,
    estimatedMinutes: 5,
    subsections: [
      {
        id: 'career_goals',
        title: 'Career Goals',
        component: 'GoalsConstraintsForm',
        validation: GoalsConstraintsSchema,
        required: true
      }
    ]
  },
  
  {
    id: 'career_direction',
    title: 'Career Direction',
    description: 'Explore specific career paths and opportunities',
    required: true,
    estimatedMinutes: 6,
    subsections: [
      {
        id: 'career_exploration',
        title: 'Career Exploration',
        component: 'CareerDirectionForm',
        validation: CareerDirectionSchema,
        required: true
      }
    ]
  },
  
  {
    id: 'personality_work_style',
    title: 'Personality & Work Style',
    description: 'Understand your personality and preferred work environment',
    required: true,
    estimatedMinutes: 10,
    subsections: [
      {
        id: 'personality_assessment',
        title: 'Personality Assessment',
        component: 'PersonalityWorkStyleForm',
        validation: PersonalityWorkStyleSchema,
        required: true
      }
    ]
  },
  
  {
    id: 'network_resources',
    title: 'Network & Resources',
    description: 'Your support network and available resources',
    required: true,
    estimatedMinutes: 4,
    subsections: [
      {
        id: 'network_assessment',
        title: 'Network Assessment',
        component: 'NetworkResourcesForm',
        validation: NetworkResourcesSchema,
        required: true
      }
    ]
  },
  
  {
    id: 'final_questions',
    title: 'Final Questions',
    description: 'Last few questions to complete your assessment',
    required: true,
    estimatedMinutes: 3,
    subsections: [
      {
        id: 'final_details',
        title: 'Final Details',
        component: 'FinalQuestionsForm',
        validation: FinalQuestionsSchema,
        required: true
      }
    ]
  }
];

// ==================================================================================
// ADAPTIVE LOGIC ENGINE
// ==================================================================================

export class AssessmentEngine {
  private assessment: Partial<CompleteAssessment>;
  private currentPath: AssessmentPath;
  
  constructor(initialAssessment: Partial<CompleteAssessment> = {}) {
    this.assessment = initialAssessment;
    this.currentPath = this.determineAssessmentPath();
  }
  
  /**
   * Determines the assessment path based on academic status
   */
  private determineAssessmentPath(): AssessmentPath {
    const academicStatus = this.assessment.initial_routing?.academic_status;
    
    switch (academicStatus) {
      case AcademicStatus.HIGH_SCHOOL:
        return 'high_school';
      case AcademicStatus.COLLEGE:
      case AcademicStatus.GRADUATE_SCHOOL:
        return 'college';
      case AcademicStatus.WORKING_PROFESSIONAL:
        return 'professional';
      case AcademicStatus.GAP_YEAR:
        return 'gap_year';
      default:
        return 'high_school'; // Default fallback
    }
  }
  
  /**
   * Gets all applicable sections for the current assessment state
   */
  getApplicableSections(): AssessmentSection[] {
    return ASSESSMENT_SECTIONS.filter(section => {
      // Always include sections without conditions
      if (!section.condition) {
        return true;
      }
      
      // Evaluate condition with current assessment state
      return section.condition(this.assessment);
    });
  }
  
  /**
   * Gets the next section that should be completed
   */
  getNextSection(): AssessmentSection | null {
    const applicableSections = this.getApplicableSections();
    const completedSections = this.assessment.sections_completed || [];
    
    return applicableSections.find(section => 
      !completedSections.includes(section.id)
    ) || null;
  }
  
  /**
   * Checks if a specific section is required for completion
   */
  isSectionRequired(sectionId: string): boolean {
    const section = ASSESSMENT_SECTIONS.find(s => s.id === sectionId);
    if (!section) return false;
    
    // Check if section applies to current assessment state
    if (section.condition && !section.condition(this.assessment)) {
      return false;
    }
    
    return section.required;
  }
  
  /**
   * Calculates current progress percentage
   */
  calculateProgress(): ProgressState {
    const applicableSections = this.getApplicableSections();
    const completedSections = this.assessment.sections_completed || [];
    const requiredSections = applicableSections.filter(s => s.required);
    const completedRequiredSections = requiredSections.filter(s => 
      completedSections.includes(s.id)
    );
    
    const totalMinutes = applicableSections.reduce((sum, section) => 
      sum + section.estimatedMinutes, 0
    );
    const completedMinutes = applicableSections
      .filter(section => completedSections.includes(section.id))
      .reduce((sum, section) => sum + section.estimatedMinutes, 0);
    
    const completionPercentage = totalMinutes > 0 
      ? Math.round((completedMinutes / totalMinutes) * 100)
      : 0;
    
    const estimatedTimeRemaining = totalMinutes - completedMinutes;
    
    const canProceed = completedRequiredSections.length === requiredSections.length;
    
    const currentSection = this.getNextSection();
    
    return {
      currentSection: currentSection?.id || 'complete',
      completedSections,
      completionPercentage,
      estimatedTimeRemaining,
      canProceed,
      hasUnsavedChanges: false // Will be managed by form state
    };
  }
  
  /**
   * Updates assessment data and recalculates path if needed
   */
  updateAssessment(updates: Partial<CompleteAssessment>): void {
    this.assessment = { ...this.assessment, ...updates };
    
    // Recalculate path if academic status changed
    if (updates.initial_routing?.academic_status) {
      this.currentPath = this.determineAssessmentPath();
    }
  }
  
  /**
   * Marks a section as completed
   */
  completeSection(sectionId: string): void {
    const completedSections = this.assessment.sections_completed || [];
    if (!completedSections.includes(sectionId)) {
      this.assessment.sections_completed = [...completedSections, sectionId];
    }
    
    // Update completion percentage
    this.assessment.completion_percentage = this.calculateProgress().completionPercentage;
  }
  
  /**
   * Gets adaptive follow-up questions based on responses
   */
  getAdaptiveQuestions(sectionId: string, responses: any): any[] {
    switch (sectionId) {
      case 'academic_profile_hs':
        return this.getHighSchoolAdaptiveQuestions(responses);
      case 'interest_discovery':
        return this.getInterestAdaptiveQuestions(responses);
      case 'network_resources':
        return this.getNetworkAdaptiveQuestions(responses);
      default:
        return [];
    }
  }
  
  /**
   * High school specific adaptive questions
   */
  private getHighSchoolAdaptiveQuestions(responses: any): any[] {
    const adaptiveQuestions = [];
    
    // If GPA is low, add improvement strategy questions
    if (responses.current_gpa && responses.current_gpa < 3.0) {
      adaptiveQuestions.push({
        id: 'gpa_improvement',
        type: 'textarea',
        question: 'What strategies are you using or planning to use to improve your academic performance?',
        placeholder: 'Describe your improvement plan...',
        required: false
      });
    }
    
    // If no test scores, encourage them
    if (!responses.test_scores || responses.test_scores.length === 0) {
      adaptiveQuestions.push({
        id: 'test_prep_plan',
        type: 'select',
        question: 'Do you plan to take standardized tests (SAT/ACT)?',
        options: [
          { value: 'yes_preparing', label: 'Yes, I\'m currently preparing' },
          { value: 'yes_planning', label: 'Yes, I plan to take them soon' },
          { value: 'no_not_required', label: 'No, not required for my goals' },
          { value: 'unsure', label: 'I\'m not sure yet' }
        ]
      });
    }
    
    return adaptiveQuestions;
  }
  
  /**
   * Interest discovery adaptive questions
   */
  private getInterestAdaptiveQuestions(responses: any): any[] {
    const adaptiveQuestions = [];
    
    // If they selected "I don't know" for career exploration
    if (responses.career_exploration_status === 'undecided') {
      adaptiveQuestions.push({
        id: 'exploration_barriers',
        type: 'checkbox',
        question: 'What makes career exploration challenging for you?',
        options: [
          { value: 'too_many_options', label: 'Too many options to choose from' },
          { value: 'lack_information', label: 'Not enough information about careers' },
          { value: 'family_pressure', label: 'Family pressure or expectations' },
          { value: 'financial_concerns', label: 'Financial concerns' },
          { value: 'no_clear_interests', label: 'No clear interests or passions' },
          { value: 'other', label: 'Other' }
        ]
      });
    }
    
    return adaptiveQuestions;
  }
  
  /**
   * Network and resources adaptive questions
   */
  private getNetworkAdaptiveQuestions(responses: any): any[] {
    const adaptiveQuestions = [];
    
    // First-generation college student support
    if (responses.first_generation_college) {
      adaptiveQuestions.push({
        id: 'first_gen_support',
        type: 'textarea',
        question: 'As a first-generation college student, what additional support would be most helpful for you?',
        placeholder: 'Describe the support you need...',
        required: false
      });
    }
    
    // If they have limited mentor access
    const mentorAccess = responses.mentor_access || {};
    const hasLimitedMentors = !mentorAccess.has_career_mentor && !mentorAccess.has_academic_mentor;
    
    if (hasLimitedMentors) {
      adaptiveQuestions.push({
        id: 'mentor_interest',
        type: 'select',
        question: 'Would you be interested in connecting with a career mentor?',
        options: [
          { value: 'very_interested', label: 'Very interested' },
          { value: 'somewhat_interested', label: 'Somewhat interested' },
          { value: 'not_interested', label: 'Not interested right now' },
          { value: 'unsure', label: 'I\'m not sure' }
        ]
      });
    }
    
    return adaptiveQuestions;
  }
  
  /**
   * Validates if assessment is complete and ready for results
   */
  isAssessmentComplete(): boolean {
    const applicableSections = this.getApplicableSections();
    const completedSections = this.assessment.sections_completed || [];
    const requiredSections = applicableSections.filter(s => s.required);
    
    return requiredSections.every(section => 
      completedSections.includes(section.id)
    );
  }
  
  /**
   * Gets personalized encouragement messages
   */
  getEncouragementMessage(progress: ProgressState): string {
    const { completionPercentage } = progress;
    
    if (completionPercentage < 25) {
      return "Great start! You're building a strong foundation for your career exploration.";
    } else if (completionPercentage < 50) {
      return "You're making excellent progress! Keep going - we're learning so much about you.";
    } else if (completionPercentage < 75) {
      return "Fantastic work! You're more than halfway there. Your insights are incredibly valuable.";
    } else if (completionPercentage < 100) {
      return "Almost there! You're doing amazing. Just a few more questions to complete your profile.";
    } else {
      return "Congratulations! You've completed your assessment. Get ready for your personalized insights!";
    }
  }
  
  /**
   * Gets current assessment path
   */
  getCurrentPath(): AssessmentPath {
    return this.currentPath;
  }
  
  /**
   * Gets assessment summary for debugging/admin purposes
   */
  getAssessmentSummary(): {
    path: AssessmentPath;
    applicableSections: string[];
    completedSections: string[];
    progress: ProgressState;
  } {
    const progress = this.calculateProgress();
    
    return {
      path: this.currentPath,
      applicableSections: this.getApplicableSections().map(s => s.id),
      completedSections: this.assessment.sections_completed || [],
      progress
    };
  }
}

// ==================================================================================
// UTILITY FUNCTIONS
// ==================================================================================

/**
 * Creates a new assessment engine instance
 */
export function createAssessmentEngine(
  initialAssessment?: Partial<CompleteAssessment>
): AssessmentEngine {
  return new AssessmentEngine(initialAssessment);
}

/**
 * Validates section completion requirements
 */
export function validateSectionCompletion(
  sectionId: string, 
  assessment: Partial<CompleteAssessment>
): { isValid: boolean; missingFields: string[] } {
  const section = ASSESSMENT_SECTIONS.find(s => s.id === sectionId);
  
  if (!section) {
    return { isValid: false, missingFields: ['Invalid section'] };
  }
  
  // TODO: Implement detailed validation for each section
  // This would check if all required fields in the section are completed
  
  return { isValid: true, missingFields: [] };
}

/**
 * Gets section metadata by ID
 */
export function getSectionMetadata(sectionId: string): AssessmentSection | null {
  return ASSESSMENT_SECTIONS.find(s => s.id === sectionId) || null;
}