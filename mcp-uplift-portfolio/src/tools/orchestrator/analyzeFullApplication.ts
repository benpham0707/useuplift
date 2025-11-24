import { z } from 'zod';
import { getCompleteStudentContext } from '../../database/supabaseClientTestable.js';
import type { StudentContext, Activity } from '../../database/types.js';
import type { StudentProfile, ActivityItem } from '../../../../src/services/orchestrator/types.js';
import { PIQPromptType } from '../../../../src/services/piq/types.js';

// Dynamic import for the orchestrator to avoid build/export issues
async function getOrchestrator() {
  const { analyzeFullApplication } = await import('../../../../src/services/orchestrator/index.js');
  return { analyzeFullApplication };
}

export const AnalyzeFullApplicationInputSchema = z.object({
  essay_text: z.string().min(1),
  prompt_type: z.enum([
    'piq1_leadership',
    'piq2_creative',
    'piq3_talent',
    'piq4_educational',
    'piq5_challenge',
    'piq6_academic',
    'piq7_community',
    'piq8_open_ended'
  ]),
  user_id: z.string().uuid()
});

export type AnalyzeFullApplicationInput = z.infer<typeof AnalyzeFullApplicationInputSchema>;

function mapContextToProfile(context: StudentContext): StudentProfile {
  // Map Identity
  const identity: StudentProfile['identity'] = {
    name: `${context.personal_info?.first_name || 'Student'} ${context.personal_info?.last_name || ''}`.trim(),
    demographics: {
      firstGen: context.personal_info?.first_gen || false,
      lowIncome: context.profile.constraints?.needsFinancialAid || false,
      languages: context.personal_info?.primary_language ? [context.personal_info.primary_language] : []
    },
    circumstances: context.family?.circumstances || []
  };

  // Map Academics
  const academics: StudentProfile['academics'] = {
    gpa: {
      unweighted: context.academic?.gpa || 0,
      trend: 'consistent', // Default, would need transcript analysis for trend
      scale: 4.0
    },
    intendedMajor: context.goals?.intended_major || 'Undeclared',
    careerGoals: context.goals?.career_interests || [],
    academicStrengths: [], // Would need to extract from course history
    courseRigor: 'demanding', // Default assumption or heuristic needed
    testScores: {
      sat: typeof context.academic?.standardized_tests?.sat === 'number' ? context.academic.standardized_tests.sat : undefined,
      act: typeof context.academic?.standardized_tests?.act === 'number' ? context.academic.standardized_tests.act : undefined
    }
  };

  // Map Activities
  const activities: ActivityItem[] = (context.activities?.extracurriculars || []).map((act: Activity, index: number) => ({
    id: `act-${index}`,
    name: act.name,
    role: act.role || 'Member',
    category: (act.category as any) || 'other',
    timeCommitment: {
      hoursPerWeek: act.hours_per_week || 0,
      weeksPerYear: act.weeks_per_year || 0,
      totalHoursEstimated: (act.hours_per_week || 0) * (act.weeks_per_year || 0)
    },
    grades: (act.grade_levels || []).map(g => parseInt(g.replace(/\D/g, ''))).filter(n => !isNaN(n)),
    isCurrent: true, // Assumption
    description: act.description || '',
    achievements: act.impact ? [act.impact] : []
  }));

  // Map Awards (combine academic honors and formal recognition)
  const awards: StudentProfile['awards'] = [
    ...(context.activities?.academic_honors || []),
    ...(context.activities?.formal_recognition || [])
  ].map((award: any) => ({
    name: award.name || award.title || 'Unknown Award',
    level: award.level || 'school',
    year: award.year || '2024'
  }));

  return {
    identity,
    academics,
    activities,
    awards
  };
}

export async function analyzeFullApplicationTool(input: AnalyzeFullApplicationInput) {
  console.log(`[MCP Tool] Starting full application analysis for user ${input.user_id}...`);

  // 1. Fetch Student Context from Database
  const context = await getCompleteStudentContext(input.user_id);
  
  if (!context) {
    throw new Error(`Student context not found for user_id: ${input.user_id}`);
  }

  // 2. Map to Orchestrator Profile
  const profile = mapContextToProfile(context);
  console.log(`[MCP Tool] Profile mapped. Activities: ${profile.activities.length}, Awards: ${profile.awards?.length}`);

  // 3. Run Orchestrator
  const { analyzeFullApplication } = await getOrchestrator();
  const result = await analyzeFullApplication(input.essay_text, input.prompt_type as PIQPromptType, profile);

  return result;
}

