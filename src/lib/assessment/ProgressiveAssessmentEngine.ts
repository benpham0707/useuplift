// src/core/assessment/ProgressiveAssessmentEngine.ts

import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/di/types';
import { Logger } from '../../shared/utils/logger';
import { UserProfile, UserContext } from '../domain/entities/UserProfile';

export interface AssessmentQuestion {
  id: string;
  category: AssessmentCategory;
  question: string;
  inputType: 'text' | 'select' | 'multiselect' | 'scale' | 'date' | 'compound';
  options?: Array<{ value: string; label: string; followUp?: string }>;
  placeholder?: string;
  helpText?: string;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  }

  // Core Methods for Assessment Flow

  public async startAssessment(
    userId: string,
    profileId: string,
    flowType: 'quick_start' | 'standard' | 'deep_dive' = 'quick_start'
  ): Promise<AssessmentSession> {
    const flow = this.flows.get(flowType);
    if (!flow) {
      throw new Error(`Assessment flow ${flowType} not found`);
    }

    const session: AssessmentSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      profileId,
      flowId: flow.id,
      currentStage: flow.stages[0].id,
      startedAt: new Date(),
      lastActiveAt: new Date(),
      responses: new Map(),
      completedQuestions: new Set(),
      skippedQuestions: new Set(),
      progressPercentage: 0,
      estimatedTimeRemaining: flow.estimatedTime
    };

    this.sessions.set(session.id, session);
    this.logger.info('Assessment started', { sessionId: session.id, flowType });

    return session;
  }

  public async getNextQuestion(sessionId: string): Promise<AssessmentQuestion | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const flow = this.flows.get(session.flowId);
    if (!flow) {
      throw new Error('Flow not found');
    }

    // Get current stage
    const currentStage = flow.stages.find(s => s.id === session.currentStage);
    if (!currentStage) {
      return null; // Assessment complete
    }

    // Find next unanswered question in current stage
    for (const question of currentStage.questions) {
      if (!session.completedQuestions.has(question.id) && 
          !session.skippedQuestions.has(question.id)) {
        
        // Check conditions
        if (this.checkConditions(question, session)) {
          return question;
        }
      }
    }

    // Check if we can move to next stage
    const answeredInStage = currentStage.questions.filter(
      q => session.completedQuestions.has(q.id)
    ).length;

    if (answeredInStage >= currentStage.minQuestions) {
      // Move to next stage
      const currentIndex = flow.stages.indexOf(currentStage);
      if (currentIndex < flow.stages.length - 1) {
        session.currentStage = flow.stages[currentIndex + 1].id;
        session.lastActiveAt = new Date();
        return this.getNextQuestion(sessionId);
      }
    }

    return null; // No more questions
  }

  public async submitAnswer(
    sessionId: string,
    questionId: string,
    answer: any
  ): Promise<{
    success: boolean;
    nextQuestion?: AssessmentQuestion;
    progress: number;
    unlock?: string;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Store response
    session.responses.set(questionId, answer);
    session.completedQuestions.add(questionId);
    session.lastActiveAt = new Date();

    // Calculate progress
    const flow = this.flows.get(session.flowId)!;
    const progress = (session.completedQuestions.size / flow.totalQuestions) * 100;
    session.progressPercentage = progress;

    // Get next question
    const nextQuestion = await this.getNextQuestion(sessionId);

    // Check for unlocks
    const unlock = this.checkUnlocks(session);

    this.logger.info('Answer submitted', {
      sessionId,
      questionId,
      progress,
      hasNext: !!nextQuestion
    });

    return {
      success: true,
      nextQuestion: nextQuestion || undefined,
      progress,
      unlock
    };
  }

  public async skipQuestion(sessionId: string, questionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.skippedQuestions.add(questionId);
    session.lastActiveAt = new Date();
  }

  // Smart Question Generation based on context

  public generateContextualQuestions(
    category: AssessmentCategory,
    context: {
      grade?: string;
      goals?: string[];
      previousAnswers?: Map<string, any>;
    }
  ): AssessmentQuestion[] {
    const questions: AssessmentQuestion[] = [];

    // High school specific questions
    if (context.grade?.includes('high_school')) {
      if (context.grade.includes('11th') || context.grade.includes('12th')) {
        questions.push(this.createQuestion({
          id: 'college_prep_stress',
          category: 'challenges',
          question: 'How are you feeling about the college process?',
          inputType: 'scale',
          options: [
            { value: '1', label: 'Totally overwhelmed' },
            { value: '2', label: 'Pretty stressed' },
            { value: '3', label: 'Managing okay' },
            { value: '4', label: 'Feeling good' },
            { value: '5', label: 'Very confident' }
          ],
          priority: 6,
          estimatedTime: '5 seconds',
          whyWeAsk: 'We\'ll adjust our support based on where you are emotionally'
        }));
      }

      if (context.grade.includes('9th') || context.grade.includes('10th')) {
        questions.push(this.createQuestion({
          id: 'exploring_interests',
          category: 'interests',
          question: 'What new thing would you like to try this year?',
          inputType: 'text',
          placeholder: 'A club, sport, skill, anything!',
          priority: 4,
          estimatedTime: '15 seconds',
          helpText: 'It\'s never too early to explore'
        }));
      }
    }

    // College student specific
    if (context.grade?.includes('college')) {
      questions.push(this.createQuestion({
        id: 'major_satisfaction',
        category: 'academic',
        question: 'How do you feel about your major?',
        inputType: 'select',
        options: [
          { value: 'love', label: 'Love it!' },
          { value: 'good', label: 'It\'s good' },
          { value: 'unsure', label: 'Not sure anymore' },
          { value: 'changing', label: 'Want to change' },
          { value: 'undecided', label: 'Still undecided' }
        ],
        priority: 7,
        estimatedTime: '5 seconds'
      }));
    }

    // Goal-specific questions
    if (context.goals?.includes('college_admission')) {
      questions.push(this.createQuestion({
        id: 'college_list_status',
        category: 'goals',
        question: 'How\'s your college list coming along?',
        inputType: 'select',
        options: [
          { value: 'done', label: 'Finalized my list' },
          { value: 'researching', label: 'Still researching' },
          { value: 'started', label: 'Just getting started' },
          { value: 'help', label: 'Need help building it' },
          { value: 'none', label: 'Haven\'t started' }
        ],
        priority: 6,
        estimatedTime: '5 seconds'
      }));
    }

    return questions;
  }

  // Helper Methods

  private createQuestion(partial: Partial<AssessmentQuestion>): AssessmentQuestion {
    return {
      id: partial.id || '',
      category: partial.category || 'identity',
      question: partial.question || '',
      inputType: partial.inputType || 'text',
      options: partial.options,
      placeholder: partial.placeholder,
      helpText: partial.helpText,
      validation: partial.validation || { required: true },
      priority: partial.priority || 5,
      dependencies: partial.dependencies,
      conditions: partial.conditions,
      estimatedTime: partial.estimatedTime || '10 seconds',
      whyWeAsk: partial.whyWeAsk
    };
  }

  private generateYearOptions(): Array<{ value: string; label: string }> {
    const currentYear = new Date().getFullYear();
    const options: Array<{ value: string; label: string }> = [];
    
    for (let year = currentYear; year <= currentYear + 6; year++) {
      options.push({
        value: year.toString(),
        label: year.toString()
      });
    }
    
    return options;
  }

  private checkConditions(question: AssessmentQuestion, session: AssessmentSession): boolean {
    if (!question.conditions || question.conditions.length === 0) {
      return true;
    }

    for (const condition of question.conditions) {
      const response = session.responses.get(condition.questionId);
      if (!response) {
        return false; // Dependency not answered yet
      }

      switch (condition.operator) {
        case 'equals':
          if (response !== condition.value) return false;
          break;
        case 'contains':
          if (!response.includes(condition.value)) return false;
          break;
        case 'includes':
          if (!condition.value.includes(response)) return false;
          break;
        case 'greaterThan':
          if (response <= condition.value) return false;
          break;
        case 'lessThan':
          if (response >= condition.value) return false;
          break;
      }
    }

    return true;
  }

  private checkUnlocks(session: AssessmentSession): string | undefined {
    const answeredCount = session.completedQuestions.size;

    if (answeredCount === 5) {
      return 'Basic profile complete! You can now get personalized recommendations.';
    }
    if (answeredCount === 10) {
      return 'Profile enhanced! Unlocked skill analysis and opportunity matching.';
    }
    if (answeredCount === 20) {
      return 'Comprehensive profile! Full platform features now available.';
    }

    return undefined;
  }

  // Get assessment insights for other services

  public getSessionInsights(sessionId: string): {
    responses: Map<string, any>;
    completedCategories: AssessmentCategory[];
    strongAreas: string[];
    dataGaps: string[];
    recommendedNextSteps: string[];
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Analyze responses
    const completedCategories = new Set<AssessmentCategory>();
    const categoryResponses = new Map<AssessmentCategory, number>();

    session.completedQuestions.forEach(qId => {
      const question = this.questionBank.get(qId);
      if (question) {
        completedCategories.add(question.category);
        const count = categoryResponses.get(question.category) || 0;
        categoryResponses.set(question.category, count + 1);
      }
    });

    // Identify strong areas and gaps
    const strongAreas: string[] = [];
    const dataGaps: string[] = [];

    // Check academic strength
    if (session.responses.has('gpa_range')) {
      const gpa = session.responses.get('gpa_range');
      if (gpa === '3.8+' || gpa === '3.3-3.7') {
        strongAreas.push('Strong academic performance');
      }
    }

    // Check for leadership/activities
    if (session.responses.has('activities_quick')) {
      const activities = session.responses.get('activities_quick');
      if (activities && activities.length > 3) {
        strongAreas.push('Diverse extracurricular involvement');
      }
    }

    // Identify gaps
    if (!session.responses.has('test_plans') && !session.responses.has('test_scores')) {
      dataGaps.push('Standardized test information');
    }
    if (!session.responses.has('work_experience')) {
      dataGaps.push('Work/volunteer experience details');
    }

    // Recommend next steps
    const recommendedNextSteps: string[] = [];
    
    if (session.progressPercentage < 30) {
      recommendedNextSteps.push('Complete basic profile for personalized recommendations');
    } else if (session.progressPercentage < 60) {
      recommendedNextSteps.push('Add academic details to unlock college matching');
    } else {
      recommendedNextSteps.push('Add experiences and achievements for stronger applications');
    }

    return {
      responses: session.responses,
      completedCategories: Array.from(completedCategories),
      strongAreas,
      dataGaps,
      recommendedNextSteps
    };
  }
}

export default ProgressiveAssessmentEngine;;
  priority: number; // 1-10, higher = more important
  dependencies?: string[]; // Question IDs this depends on
  conditions?: AssessmentCondition[];
  estimatedTime?: string; // "30 seconds"
  whyWeAsk?: string; // Transparency about data use
}

export interface AssessmentCondition {
  questionId: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'includes';
  value: any;
}

export type AssessmentCategory = 
  | 'identity'      // Basic info: name, grade, location
  | 'goals'         // What they want to achieve
  | 'academic'      // School performance
  | 'interests'     // Passions and hobbies
  | 'experiences'   // Work, volunteer, projects
  | 'challenges'    // Obstacles and constraints
  | 'achievements'  // Recognition and wins
  | 'reflection';   // Self-awareness questions

export interface AssessmentFlow {
  id: string;
  name: string;
  description: string;
  stages: AssessmentStage[];
  totalQuestions: number;
  estimatedTime: string;
}

export interface AssessmentStage {
  id: string;
  name: string;
  category: AssessmentCategory;
  questions: AssessmentQuestion[];
  minQuestions: number; // Minimum to complete stage
  maxQuestions: number; // Maximum before moving on
  canSkip: boolean;
  unlockCondition?: () => boolean;
  completionReward?: string;
}

export interface AssessmentSession {
  id: string;
  userId: string;
  profileId: string;
  flowId: string;
  currentStage: string;
  startedAt: Date;
  lastActiveAt: Date;
  responses: Map<string, any>;
  completedQuestions: Set<string>;
  skippedQuestions: Set<string>;
  progressPercentage: number;
  estimatedTimeRemaining: string;
}

@injectable()
export class ProgressiveAssessmentEngine {
  private flows: Map<string, AssessmentFlow> = new Map();
  private sessions: Map<string, AssessmentSession> = new Map();
  private questionBank: Map<string, AssessmentQuestion> = new Map();

  constructor(
    @inject(TYPES.Logger) private logger: Logger
  ) {
    this.initializeFlows();
    this.initializeQuestionBank();
  }

  // Initialize Assessment Flows

  private initializeFlows(): void {
    // Quick Start Flow - Bare minimum to get started
    this.flows.set('quick_start', {
      id: 'quick_start',
      name: 'Quick Start',
      description: 'Get started in under 2 minutes',
      totalQuestions: 5,
      estimatedTime: '2 minutes',
      stages: [
        {
          id: 'essential',
          name: 'The Essentials',
          category: 'identity',
          questions: [
            this.createQuestion({
              id: 'name',
              category: 'identity',
              question: "What's your name?",
              inputType: 'text',
              placeholder: 'First Last',
              priority: 10,
              estimatedTime: '5 seconds'
            }),
            this.createQuestion({
              id: 'grade_level',
              category: 'identity',
              question: 'What grade are you in?',
              inputType: 'select',
              options: [
                { value: 'high_school_9th', label: '9th Grade' },
                { value: 'high_school_10th', label: '10th Grade' },
                { value: 'high_school_11th', label: '11th Grade' },
                { value: 'high_school_12th', label: '12th Grade' },
                { value: 'gap_year', label: 'Gap Year' },
                { value: 'college_freshman', label: 'College Freshman' },
                { value: 'college_sophomore', label: 'College Sophomore' },
                { value: 'college_junior', label: 'College Junior' },
                { value: 'college_senior', label: 'College Senior' }
              ],
              priority: 10,
              estimatedTime: '5 seconds'
            }),
            this.createQuestion({
              id: 'primary_goal',
              category: 'goals',
              question: 'What brings you to Uplift?',
              inputType: 'select',
              options: [
                { value: 'college_admission', label: 'Getting into college' },
                { value: 'career_prep', label: 'Preparing for my career' },
                { value: 'skill_development', label: 'Building new skills' },
                { value: 'exploring_options', label: 'Exploring my options' }
              ],
              priority: 9,
              estimatedTime: '10 seconds',
              whyWeAsk: 'This helps us personalize your experience from day one'
            }),
            this.createQuestion({
              id: 'biggest_challenge',
              category: 'challenges',
              question: "What's your biggest challenge right now?",
              inputType: 'select',
              options: [
                { value: 'grades', label: 'Improving my grades' },
                { value: 'test_scores', label: 'Test scores (SAT/ACT)' },
                { value: 'finding_direction', label: "Not sure what I want to do" },
                { value: 'standing_out', label: 'Standing out from others' },
                { value: 'financial', label: 'Paying for college' },
                { value: 'time_management', label: 'Managing my time' }
              ],
              priority: 8,
              estimatedTime: '10 seconds'
            }),
            this.createQuestion({
              id: 'location',
              category: 'identity',
              question: 'Where are you located?',
              inputType: 'text',
              placeholder: 'City, State',
              priority: 7,
              estimatedTime: '10 seconds',
              helpText: 'We use this to find local opportunities'
            })
          ],
          minQuestions: 5,
          maxQuestions: 5,
          canSkip: false
        }
      ]
    });

    // Standard Flow - More comprehensive but still quick
    this.flows.set('standard', {
      id: 'standard',
      name: 'Standard Assessment',
      description: 'Complete profile in 10 minutes',
      totalQuestions: 20,
      estimatedTime: '10 minutes',
      stages: [
        // Stage 1: Identity & Goals (Required)
        {
          id: 'identity_goals',
          name: 'About You',
          category: 'identity',
          questions: [], // Will be populated from question bank
          minQuestions: 5,
          maxQuestions: 7,
          canSkip: false
        },
        // Stage 2: Academic Snapshot (Semi-required)
        {
          id: 'academic_snapshot',
          name: 'Academic Profile',
          category: 'academic',
          questions: [],
          minQuestions: 3,
          maxQuestions: 5,
          canSkip: true,
          completionReward: 'Unlock college matching'
        },
        // Stage 3: Quick Experiences (Optional but valuable)
        {
          id: 'quick_experiences',
          name: 'Your Experiences',
          category: 'experiences',
          questions: [],
          minQuestions: 2,
          maxQuestions: 4,
          canSkip: true,
          completionReward: 'Unlock skill analysis'
        },
        // Stage 4: Interests & Passions (Engaging)
        {
          id: 'interests',
          name: 'Interests & Passions',
          category: 'interests',
          questions: [],
          minQuestions: 2,
          maxQuestions: 4,
          canSkip: true,
          completionReward: 'Unlock career exploration'
        }
      ]
    });

    // Deep Dive Flow - For highly engaged users
    this.flows.set('deep_dive', {
      id: 'deep_dive',
      name: 'Comprehensive Assessment',
      description: 'Complete analysis in 25 minutes',
      totalQuestions: 50,
      estimatedTime: '25 minutes',
      stages: [] // Full comprehensive assessment
    });
  }

  private initializeQuestionBank(): void {
    // Identity Questions
    const identityQuestions: AssessmentQuestion[] = [
      {
        id: 'preferred_name',
        category: 'identity',
        question: 'What should we call you?',
        inputType: 'text',
        placeholder: 'Nickname or preferred name',
        priority: 8,
        estimatedTime: '5 seconds',
        whyWeAsk: 'We want to address you the way you prefer'
      },
      {
        id: 'school_name',
        category: 'identity',
        question: 'What school do you attend?',
        inputType: 'text',
        placeholder: 'Your school name',
        priority: 7,
        estimatedTime: '10 seconds'
      },
      {
        id: 'graduation_year',
        category: 'identity',
        question: 'When do you graduate?',
        inputType: 'select',
        options: this.generateYearOptions(),
        priority: 8,
        estimatedTime: '5 seconds'
      }
    ];

    // Goals Questions
    const goalsQuestions: AssessmentQuestion[] = [
      {
        id: 'dream_colleges',
        category: 'goals',
        question: 'Any dream schools? (Optional)',
        inputType: 'text',
        placeholder: 'e.g., MIT, Stanford, State University',
        priority: 5,
        estimatedTime: '20 seconds',
        validation: { required: false },
        helpText: 'Separate multiple schools with commas'
      },
      {
        id: 'career_interests',
        category: 'goals',
        question: 'What careers interest you? (Even if unsure)',
        inputType: 'multiselect',
        options: [
          { value: 'tech', label: 'Technology & Engineering' },
          { value: 'health', label: 'Healthcare & Medicine' },
          { value: 'business', label: 'Business & Finance' },
          { value: 'creative', label: 'Arts & Design' },
          { value: 'science', label: 'Science & Research' },
          { value: 'education', label: 'Education & Teaching' },
          { value: 'law', label: 'Law & Government' },
          { value: 'social', label: 'Social Services' },
          { value: 'trades', label: 'Skilled Trades' },
          { value: 'unsure', label: "I'm not sure yet" }
        ],
        priority: 6,
        estimatedTime: '15 seconds'
      },
      {
        id: 'timeline_urgency',
        category: 'goals',
        question: 'When do you need to make your next big decision?',
        inputType: 'select',
        options: [
          { value: 'immediate', label: 'This month' },
          { value: 'this_semester', label: 'This semester' },
          { value: 'this_year', label: 'This school year' },
          { value: 'next_year', label: 'Next year' },
          { value: 'flexible', label: 'I have time' }
        ],
        priority: 7,
        estimatedTime: '10 seconds'
      }
    ];

    // Academic Questions
    const academicQuestions: AssessmentQuestion[] = [
      {
        id: 'gpa_range',
        category: 'academic',
        question: 'What\'s your GPA range?',
        inputType: 'select',
        options: [
          { value: '3.8+', label: '3.8 - 4.0+ (A/A+)' },
          { value: '3.3-3.7', label: '3.3 - 3.7 (B+/A-)' },
          { value: '2.8-3.2', label: '2.8 - 3.2 (B-/B)' },
          { value: '2.3-2.7', label: '2.3 - 2.7 (C+/B-)' },
          { value: '<2.3', label: 'Below 2.3' },
          { value: 'no_gpa', label: 'My school doesn\'t use GPA' }
        ],
        priority: 6,
        estimatedTime: '10 seconds',
        whyWeAsk: 'This helps us find realistic opportunities for you'
      },
      {
        id: 'favorite_subject',
        category: 'academic',
        question: 'What\'s your favorite subject?',
        inputType: 'select',
        options: [
          { value: 'math', label: 'Math' },
          { value: 'science', label: 'Science' },
          { value: 'english', label: 'English' },
          { value: 'history', label: 'History' },
          { value: 'language', label: 'Foreign Language' },
          { value: 'arts', label: 'Arts' },
          { value: 'tech', label: 'Computer/Tech' },
          { value: 'other', label: 'Something else' }
        ],
        priority: 4,
        estimatedTime: '5 seconds'
      },
      {
        id: 'test_plans',
        category: 'academic',
        question: 'Are you planning to take the SAT or ACT?',
        inputType: 'select',
        options: [
          { value: 'taken', label: 'Already taken' },
          { value: 'scheduled', label: 'Scheduled to take' },
          { value: 'planning', label: 'Planning to take' },
          { value: 'unsure', label: 'Not sure yet' },
          { value: 'no', label: 'Not planning to' }
        ],
        priority: 5,
        estimatedTime: '5 seconds',
        conditions: [
          { questionId: 'grade_level', operator: 'includes', value: ['11th', '12th'] }
        ]
      }
    ];

    // Experience Questions
    const experienceQuestions: AssessmentQuestion[] = [
      {
        id: 'work_experience',
        category: 'experiences',
        question: 'Do you have any work experience?',
        inputType: 'select',
        options: [
          { value: 'job', label: 'Yes, I have/had a job' },
          { value: 'family', label: 'I help with family business' },
          { value: 'freelance', label: 'I do freelance/gig work' },
          { value: 'none', label: 'No work experience yet' }
        ],
        priority: 5,
        estimatedTime: '5 seconds'
      },
      {
        id: 'activities_quick',
        category: 'experiences',
        question: 'What do you do outside of school? (Check all)',
        inputType: 'multiselect',
        options: [
          { value: 'sports', label: 'Sports/Athletics' },
          { value: 'clubs', label: 'School Clubs' },
          { value: 'volunteer', label: 'Volunteering' },
          { value: 'arts', label: 'Arts/Music/Theater' },
          { value: 'work', label: 'Part-time Job' },
          { value: 'family', label: 'Family Responsibilities' },
          { value: 'hobbies', label: 'Personal Projects/Hobbies' },
          { value: 'none', label: 'Not much right now' }
        ],
        priority: 6,
        estimatedTime: '15 seconds'
      }
    ];

    // Interest Questions
    const interestQuestions: AssessmentQuestion[] = [
      {
        id: 'passion_project',
        category: 'interests',
        question: 'What could you talk about for hours?',
        inputType: 'text',
        placeholder: 'Gaming, cooking, cars, music, anything!',
        priority: 4,
        estimatedTime: '20 seconds',
        helpText: 'No judgment - we find value in all interests!'
      },
      {
        id: 'learning_style',
        category: 'interests',
        question: 'How do you learn best?',
        inputType: 'select',
        options: [
          { value: 'doing', label: 'By doing/hands-on' },
          { value: 'watching', label: 'Watching videos/demos' },
          { value: 'reading', label: 'Reading and studying' },
          { value: 'discussing', label: 'Talking with others' },
          { value: 'teaching', label: 'Teaching others' }
        ],
        priority: 3,
        estimatedTime: '10 seconds'
      }
    ];

    // Store all questions in the bank
    [...identityQuestions, ...goalsQuestions, ...academicQuestions, 
     ...experienceQuestions, ...interestQuestions, ...challengeQuestions]
      .forEach(q => this.questionBank.set(q.id, q));

    // Challenge Questions
    const challengeQuestions: AssessmentQuestion[] = [
      {
        id: 'financial_aid_need',
        category: 'challenges',
        question: 'Will you need financial aid for college?',
        inputType: 'select',
        options: [
          { value: 'full', label: 'Yes, full aid needed' },
          { value: 'partial', label: 'Yes, some aid needed' },
          { value: 'unsure', label: 'Not sure yet' },
          { value: 'no', label: 'No aid needed' }
        ],
        priority: 7,
        estimatedTime: '5 seconds',
        whyWeAsk: 'We\'ll prioritize schools and scholarships that match your needs'
      },
      {
        id: 'first_gen',
        category: 'challenges',
        question: 'Are you the first in your family to go to college?',
        inputType: 'select',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'unsure', label: 'Not sure' }
        ],
        priority: 6,
        estimatedTime: '5 seconds',
        whyWeAsk: 'First-gen students have access to special programs and support'
      },
      {
        id: 'responsibilities',
        category: 'challenges',
        question: 'Do you have responsibilities outside school?',
        inputType: 'multiselect',
        options: [
          { value: 'work', label: 'I work to support myself/family' },
          { value: 'siblings', label: 'I care for siblings' },
          { value: 'parent', label: 'I help care for a parent' },
          { value: 'translation', label: 'I translate for my family' },
          { value: 'household', label: 'Major household duties' },
          { value: 'none', label: 'No major responsibilities' }
        ],
        priority: 5,
        estimatedTime: '10 seconds',
        whyWeAsk: 'These responsibilities show maturity and skills colleges value'
      }
    ];