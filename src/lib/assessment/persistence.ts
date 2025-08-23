// Temporary persistence layer using localStorage
import { type CompleteAssessment } from '@/lib/types/assessment';

export class AssessmentPersistenceError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AssessmentPersistenceError';
  }
}

export async function saveAssessment(assessment: Partial<CompleteAssessment>): Promise<CompleteAssessment> {
  try {
    const key = `assessment_${assessment.user_id}`;
    localStorage.setItem(key, JSON.stringify(assessment));
    return assessment as CompleteAssessment;
  } catch (error) {
    throw new AssessmentPersistenceError(
      'SAVE_FAILED',
      'Failed to save assessment',
      error as Error
    );
  }
}

export async function loadAssessment(userId: string): Promise<Partial<CompleteAssessment> | null> {
  try {
    const key = `assessment_${userId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    throw new AssessmentPersistenceError(
      'LOAD_FAILED',
      'Failed to load assessment',
      error as Error
    );
  }
}

export async function getAssessmentList(
  userId: string
): Promise<Pick<CompleteAssessment, 'id' | 'created_at' | 'updated_at' | 'completion_percentage'>[]> {
  return [];
}

export async function deleteAssessment(assessmentId: string, userId: string): Promise<boolean> {
  try {
    const key = `assessment_${userId}`;
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    throw new AssessmentPersistenceError(
      'DELETE_FAILED',
      'Failed to delete assessment',
      error as Error
    );
  }
}

export async function completeAssessment(assessment: CompleteAssessment): Promise<boolean> {
  try {
    const key = `assessment_${assessment.user_id}`;
    const completedAssessment = {
      ...assessment,
      completed_at: new Date(),
      completion_percentage: 100
    };
    localStorage.setItem(key, JSON.stringify(completedAssessment));
    return true;
  } catch (error) {
    throw new AssessmentPersistenceError(
      'COMPLETE_FAILED',
      'Failed to complete assessment',
      error as Error
    );
  }
}