/**
 * Template Fallback — Used when LLM calls fail
 *
 * Generates deterministic report sections from quantitative data alone.
 * No LLM required — purely data-driven with basic heuristics.
 *
 * Ported from monolith's generateTemplateFallback() method, updated to use
 * EnrichedReportContext instead of the old AssembledReportContext.
 */

import type {
  AcademicIdentitySection,
  ChallengesAndRealitySection,
  StrategicRoadmapSection,
  UpliftGrade,
  StrategicPriority,
} from '../types';
import { UPLIFT_SCALE_DATABASE } from '../types';
import { formatSubject } from '../context/tierCalibration';
import type { EnrichedReportContext } from '../types';

// ============================================================================
// TEMPLATE FALLBACK GENERATOR
// ============================================================================

export function generateTemplateFallback(ctx: EnrichedReportContext): {
  academicIdentity: AcademicIdentitySection;
  challengesAndReality: ChallengesAndRealitySection;
  strategicRoadmap: StrategicRoadmapSection;
} {
  const quant = ctx.quantitativeAnalysis;
  const overallGPA = ctx.overallGPA;
  const synthesis = quant.synthesis;
  const planning = ctx.planningAdvice;
  const tierPosition = ctx.tierPosition;

  // Section 1: Academic Identity with notable strengths, weaknesses, and tier position
  const strengthSubjects = Object.entries(quant.subjectPatterns)
    .filter(([_, p]) => p.relativeStrength > 0.05)
    .sort((a, b) => b[1].relativeStrength - a[1].relativeStrength)
    .slice(0, 3);

  const weaknessSubjects = Object.entries(quant.subjectPatterns)
    .filter(([_, p]) => p.relativeStrength < -0.05)
    .sort((a, b) => a[1].relativeStrength - b[1].relativeStrength)
    .slice(0, 2);

  // Determine Uplift grade from GPA + rigor heuristic
  const rigorBonus = quant.performanceFingerprint.sweetSpot.level === 'ap_ib' ? 0.15 : 0;
  const trendBonus = quant.progressionTrajectory.historical.overallTrend === 'improving' ? 0.05 : quant.progressionTrajectory.historical.overallTrend === 'declining' ? -0.1 : 0;
  const adjustedScore = overallGPA + rigorBonus + trendBonus;
  const fallbackGrade: UpliftGrade = adjustedScore >= 3.9 ? 'A' : adjustedScore >= 3.75 ? 'A-' : adjustedScore >= 3.6 ? 'B+' : adjustedScore >= 3.4 ? 'B' : adjustedScore >= 3.2 ? 'B-' : adjustedScore >= 3.0 ? 'C+' : 'C';
  const gradeDescriptor = UPLIFT_SCALE_DATABASE.find(d => d.grade === fallbackGrade);

  const academicIdentity: AcademicIdentitySection = {
    narrativeIdentity: `${synthesis.profileSummary}\n\n${synthesis.coreInsight} ${synthesis.uniquePattern}`,
    notableStrengths: strengthSubjects.map(([subj, p]) => ({
      subject: formatSubject(subj),
      insight: `Your ${p.performanceHistory.avgGPA.toFixed(2)} average with +${Math.round(p.relativeStrength * 100)}% relative strength signals genuine aptitude beyond what most students demonstrate at this level.`,
      majorRelevance: ctx.input.intendedMajor
        ? `This connects directly to your interest in ${ctx.input.intendedMajor}.`
        : 'This strength opens doors across multiple fields.',
    })),
    notableWeaknesses: weaknessSubjects.map(([subj, p]) => ({
      area: formatSubject(subj),
      gap: `Your ${p.performanceHistory.avgGPA.toFixed(2)} average is ${Math.abs(Math.round(p.relativeStrength * 100))}% below your overall performance, indicating this is a relative challenge area.`,
      consequence: ctx.input.intendedMajor
        ? `If ${formatSubject(subj).toLowerCase()} is relevant to ${ctx.input.intendedMajor}, this gap could weaken your application.`
        : 'Admissions officers may notice this relative weakness in your transcript.',
    })),
    tierPosition,
    upliftRating: {
      grade: fallbackGrade,
      explanation: gradeDescriptor
        ? `${gradeDescriptor.description} ${gradeDescriptor.schoolFit}`
        : `Your ${overallGPA.toFixed(2)} GPA with ${quant.performanceFingerprint.difficultySensitivity} difficulty sensitivity places you in this range.`,
    },
  };

  // Section 2: Challenges & Admissions Reality (merged)
  const challengesAndReality: ChallengesAndRealitySection = {
    firstGlance: `An admissions officer would first notice your ${overallGPA.toFixed(2)} GPA (${tierPosition.currentTier} range) and ${quant.progressionTrajectory.historical.overallTrend} trajectory.`,
    // R17: Populate researchBacking from verified stats instead of empty array
    challenges: synthesis.challenges.slice(0, 3).map(c => {
      // Try to find relevant verified stats for this challenge
      const challengeWords = c.insight.toLowerCase().split(' ');
      const relevantStats = ctx.forChallenges.verifiedStats
        .filter(s => challengeWords.some(w => w.length > 4 && s.claim.toLowerCase().includes(w)))
        .slice(0, 2)
        .map(s => ({
          claim: s.claim,
          value: String(s.value),
          source: s.citation,
        }));

      // Fallback to NACAC generic if no specific stats match
      const researchBacking = relevantStats.length > 0 ? relevantStats : [{
        claim: 'Curriculum rigor rated "considerably important" by 64% of colleges',
        value: '64%',
        source: 'NACAC State of College Admission 2024',
      }];

      return {
        title: c.insight,
        issue: c.evidence,
        aoImpact: c.implication,
        tierImpact: `This affects your positioning within the ${tierPosition.currentTier} range.`,
        roadmapConnection: 'See the Strategic Roadmap for specific course recommendations.',
        researchBacking,
      };
    }),
    unintendedNarrative: `Your current course selections and grade patterns tell a story of ${
      quant.progressionTrajectory.historical.overallTrend === 'improving' ? 'growth and increasing engagement' : 'steady performance'
    }.`,
    narrativeControlStrategy: 'Align senior year course choices with your intended major and address identified gaps to reshape this narrative.',
  };

  // Section 3: Strategic Roadmap from planning advice
  const strategicRoadmap: StrategicRoadmapSection = {
    priorities: [
      {
        priority: 1,
        title: planning.trajectoryAssessment?.recommendation || 'Strengthen Course Rigor',
        description: planning.trajectoryAssessment?.aoInterpretation || 'Increase rigor strategically.',
        impact: 'critical' as const,
        actionItems: planning.trajectoryAssessment?.actionItems || ['Review course options for next semester'],
      },
      ...(planning.opportunities || []).slice(0, 2).map((o, i) => ({
        priority: (i + 2) as number,
        title: o.description.slice(0, 50),
        description: `${o.action} — ${o.benefit}`,
        impact: 'high' as const,
        actionItems: [o.action],
      })),
    ].slice(0, 3) as StrategicPriority[],
    courseStrategy: {
      recommended: (planning.courseRecommendations || []).slice(0, 5).map(r => ({
        course: r.specificCourse || `AP ${formatSubject(r.subject)}`,
        rationale: r.rationale,
        risk: r.riskLevel as 'low' | 'medium' | 'high',
        expectedOutcome: r.evidenceBasis,
      })),
      avoid: (planning.redFlags || [])
        .filter(r => r.subject)
        .slice(0, 2)
        .map(r => ({
          course: `AP ${formatSubject(r.subject || '')}`,
          reason: r.howToAddress,
        })),
      rationale: planning.workloadAdvice?.balanceAdvice || 'Balance rigor with success in your strongest areas.',
    },
    majorAlignment: {
      score: planning.majorAlignment?.alignmentScore || 0,
      assessment: planning.majorAlignment?.recommendations?.join('. ') || 'No major-specific assessment available.',
      missingPieces: planning.majorAlignment?.missingCourses || [],
      strengthsToLeverage: planning.majorAlignment?.requiredCourses?.filter((_, i) => i < 3) || [],
    },
    trajectoryOptimization: planning.trajectoryAssessment?.recommendation || 'Maintain current rigor while showing improvement in challenge areas.',
  };

  return {
    academicIdentity,
    challengesAndReality,
    strategicRoadmap,
  };
}
