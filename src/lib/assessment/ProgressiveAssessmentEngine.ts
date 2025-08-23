// src/lib/assessment/ProgressiveAssessmentEngine.ts

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
  };
  priority: number;
  dependencies?: string[];
  conditions?: AssessmentCondition[];
  estimatedTime?: string;
  whyWeAsk?: string;
}

export interface AssessmentCondition {
  questionId: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'includes';
  value: any;
}

export type AssessmentCategory = 
  | 'identity'
  | 'goals'
  | 'academic'
  | 'interests'
  | 'experiences'
  | 'challenges'
  | 'achievements'
  | 'reflection';

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
  minQuestions: number;
  maxQuestions: number;
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

export class ProgressiveAssessmentEngine {
  private flows: Map<string, AssessmentFlow> = new Map();
  private sessions: Map<string, AssessmentSession> = new Map();
  private questionBank: Map<string, AssessmentQuestion> = new Map();

  constructor() {
    this.initializeFlows();
    this.initializeQuestionBank();
  }

  private initializeFlows(): void {
    this.flows.set('quick_start', {
      id: 'quick_start',
      name: 'Quick Start',
      description: 'Get started in under 2 minutes',
      totalQuestions: 5,
      estimatedTime: '2 minutes',
      stages: []
    });
  }

  private initializeQuestionBank(): void {
    // Initialize with basic questions
    const basicQuestions: AssessmentQuestion[] = [
      {
        id: 'name',
        category: 'identity',
        question: "What's your name?",
        inputType: 'text',
        placeholder: 'First Last',
        priority: 10,
        estimatedTime: '5 seconds'
      }
    ];

    basicQuestions.forEach(q => this.questionBank.set(q.id, q));
  }

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
      currentStage: flow.stages[0]?.id || 'default',
      startedAt: new Date(),
      lastActiveAt: new Date(),
      responses: new Map(),
      completedQuestions: new Set(),
      skippedQuestions: new Set(),
      progressPercentage: 0,
      estimatedTimeRemaining: flow.estimatedTime
    };

    this.sessions.set(session.id, session);
    return session;
  }

  public async getNextQuestion(sessionId: string): Promise<AssessmentQuestion | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Return first question from bank for now
    return Array.from(this.questionBank.values())[0] || null;
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

    session.responses.set(questionId, answer);
    session.completedQuestions.add(questionId);
    session.lastActiveAt = new Date();
    session.progressPercentage = 50; // Simple progress for now

    const nextQuestion = await this.getNextQuestion(sessionId);

    return {
      success: true,
      nextQuestion: nextQuestion || undefined,
      progress: session.progressPercentage
    };
  }
}

export default ProgressiveAssessmentEngine;