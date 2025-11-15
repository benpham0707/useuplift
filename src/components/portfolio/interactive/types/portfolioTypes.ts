import { LucideIcon } from 'lucide-react';

export interface ProfileStoryData {
  score: number;
  tierName: string;
  summarySentences: string[];
  
  fullNarrative: {
    strengths: Array<{
      title: string;
      score: number;
      percentile: string;
      evidence: string[];
      icon: string;
      impactStatement: string;
    }>;
    opportunities: Array<{
      title: string;
      currentScore: number;
      targetScore: number;
      whyItMatters: string;
      specificAction: string;
      estimatedImpact: string;
    }>;
    schoolFit: {
      elite: { schools: string[]; status: string; gap: number };
      target: { schools: string[]; status: string; gap: number };
      safety: { schools: string[]; status: string; gap: number };
    };
  };
}

export interface TierDetails {
  name: string;
  schools: string[];
  averageAdmitScore: number;
  yourScore: number;
  gap: number;
  status: 'ahead' | 'competitive' | 'needs-work';
  
  metricBreakdown: {
    academic: { yours: number; needed: number; action: string };
    leadership: { yours: number; needed: number; action: string };
    extracurricular: { yours: number; needed: number; action: string };
  };
  specificActions: Array<{
    action: string;
    impact: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  admissionProbability: { min: number; max: number };
}

export interface CompetitiveStandingData {
  yourScore: number;
  spectrum: {
    min: number;
    max: number;
    safetyThreshold: number;
    targetThreshold: number;
    reachThreshold: number;
  };
  tiers: {
    elite: TierDetails;
    target: TierDetails;
    safety: TierDetails;
  };
}

export interface AttributionData {
  contributions: Array<{
    id: string;
    category: string;
    title: string;
    points: number;
    percentile?: string;
    icon: string;
    breakdown: Array<{
      source: string;
      pointValue: number;
    }>;
    evidence: string[];
    peerComparison: string;
    admissionsContext: string;
  }>;
}

export interface NextStepsData {
  actions: Array<{
    id: string;
    title: string;
    category: string;
    effort: 'low' | 'medium' | 'high';
    quickImpact: string;
    whyItMatters: string;
    specificSteps: Array<{
      step: string;
      completed: boolean;
    }>;
    timeline: string;
    expectedImpact: {
      points: { min: number; max: number };
      description: string;
    };
    difficulty: {
      level: string;
      timeCommitment: string;
    };
  }>;
}

export interface ProgressTrackingData {
  currentTier: string;
  nextTier: string;
  progress: number;
  pointsNeeded: number;
  milestones: Array<{
    id: string;
    title: string;
    status: 'completed' | 'in-progress' | 'future';
    points: number;
    deadline?: string;
    action: string;
    resources: string[];
  }>;
}
