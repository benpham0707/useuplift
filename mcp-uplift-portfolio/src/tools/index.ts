/**
 * MCP TOOLS
 *
 * All 12 tools for portfolio intelligence and essay analysis
 */

import { z } from 'zod';
import {
  getCompleteStudentContext,
  getActivities,
  getAcademicData,
  getFamilyContext,
  getGoals,
  validateUser
} from '../database/supabaseClientTestable.js';
import {
  calculateTextSimilarity,
  extractOverlappingContent,
  getSimilaritySeverity
} from '../utils/textAnalysis.js';
import { validateClaim } from '../utils/claimValidator.js';
import { analyzeFullApplicationTool, AnalyzeFullApplicationInputSchema } from './orchestrator/analyzeFullApplication.js';
import type {
  ClaimValidationInput,
  ClaimValidationOutput,
  RepetitionCheckInput,
  RepetitionCheckOutput,
  PIQSuggestionInput,
  PIQSuggestionOutput,
  BetterStoriesInput,
  BetterStoriesOutput,
  PortfolioAnalyticsOutput
} from '../database/types.js';

// ============================================================================
// TOOL INPUT/OUTPUT SCHEMAS
// ============================================================================

// Tool 1: get_student_profile
export const GetStudentProfileInputSchema = z.object({
  user_id: z.string().uuid()
});

// Tool 2: get_extracurriculars
export const GetExtracurricularsInputSchema = z.object({
  user_id: z.string().uuid(),
  include_leadership_only: z.boolean().optional().default(false)
});

// Tool 3: get_academic_context
export const GetAcademicContextInputSchema = z.object({
  user_id: z.string().uuid()
});

// Tool 4: get_context_circumstances
export const GetContextCircumstancesInputSchema = z.object({
  user_id: z.string().uuid()
});

// Tool 5: get_all_essays (placeholder - will integrate with essay system)
export const GetAllEssaysInputSchema = z.object({
  user_id: z.string().uuid(),
  include_analysis: z.boolean().optional().default(false)
});

// Tool 6: check_repetition
export const CheckRepetitionInputSchema = z.object({
  current_essay_text: z.string().min(1),
  user_id: z.string().uuid()
});

// Tool 7: get_portfolio_analytics
export const GetPortfolioAnalyticsInputSchema = z.object({
  user_id: z.string().uuid()
});

// Tool 8: validate_claim
export const ValidateClaimInputSchema = z.object({
  claim: z.string().min(1),
  claim_type: z.enum(['leadership', 'activity', 'achievement', 'academic']),
  user_id: z.string().uuid()
});

// Tool 9: suggest_piq_prompts
export const SuggestPIQPromptsInputSchema = z.object({
  user_id: z.string().uuid(),
  already_written: z.array(z.number().min(1).max(8)).optional().default([])
});

// Tool 10: analyze_portfolio_balance
export const AnalyzePortfolioBalanceInputSchema = z.object({
  user_id: z.string().uuid(),
  piq_numbers: z.array(z.number().min(1).max(8))
});

// Tool 11: get_better_stories
export const GetBetterStoriesInputSchema = z.object({
  current_essay_text: z.string().min(1),
  piq_prompt_number: z.number().min(1).max(8),
  user_id: z.string().uuid()
});

// Tool 12: check_narrative_consistency
export const CheckNarrativeConsistencyInputSchema = z.object({
  user_id: z.string().uuid()
});

// ============================================================================
// TOOL IMPLEMENTATIONS
// ============================================================================

/**
 * Tool 13: analyze_full_application
 * Run the complete 13-dimension essay analysis with holistic profile validation
 */
export async function analyzeFullApplication(input: z.infer<typeof AnalyzeFullApplicationInputSchema>) {
  return analyzeFullApplicationTool(input);
}

/**
 * Tool 1: get_student_profile
 * Get complete student context for analysis
 */
export async function getStudentProfile(input: z.infer<typeof GetStudentProfileInputSchema>) {
  const userExists = await validateUser(input.user_id);

  if (!userExists) {
    throw new Error(`User ${input.user_id} not found`);
  }

  const context = await getCompleteStudentContext(input.user_id);

  if (!context) {
    throw new Error(`Could not fetch complete context for user ${input.user_id}`);
  }

  return {
    profile: context.profile,
    personal_info: context.personal_info,
    academic: context.academic,
    goals: context.goals,
    family: context.family,
    personal_growth: context.personal_growth,
    completion_score: context.profile.completion_score,
    has_leadership_roles: (context.activities?.leadership_roles as any[] || []).length > 0,
    is_first_gen: context.personal_info?.first_gen || false,
    has_challenging_circumstances: context.family?.challenging_circumstances || false
  };
}

/**
 * Tool 2: get_extracurriculars
 * Get all activities for claim validation
 */
export async function getExtracurriculars(input: z.infer<typeof GetExtracurricularsInputSchema>) {
  const activities = await getActivities(input.user_id);

  if (!activities) {
    return {
      extracurriculars: [],
      work_experiences: [],
      volunteer_service: [],
      personal_projects: [],
      leadership_roles: [],
      total_count: 0
    };
  }

  let extracurriculars = activities.extracurriculars || [];

  if (input.include_leadership_only) {
    extracurriculars = extracurriculars.filter((act: any) => act.leadership_role === true);
  }

  return {
    extracurriculars,
    work_experiences: activities.work_experiences,
    volunteer_service: activities.volunteer_service,
    personal_projects: activities.personal_projects,
    leadership_roles: activities.leadership_roles,
    total_count: extracurriculars.length
  };
}

/**
 * Tool 3: get_academic_context
 * Validate academic claims in essays
 */
export async function getAcademicContext(input: z.infer<typeof GetAcademicContextInputSchema>) {
  const academic = await getAcademicData(input.user_id);

  if (!academic) {
    return {
      gpa: null,
      class_rank: null,
      course_rigor: 'unknown',
      ap_ib_courses: [],
      test_scores: {},
      honors_awards: []
    };
  }

  const courseHistory = academic.course_history as any[] || [];
  const apIbCourses = courseHistory.filter((c: any) =>
    c.level === 'AP' || c.level === 'IB' || c.level === 'Honors'
  );

  const courseRigor = apIbCourses.length >= 8 ? 'high' :
                     apIbCourses.length >= 4 ? 'medium' : 'low';

  return {
    gpa: academic.gpa,
    gpa_scale: academic.gpa_scale,
    class_rank: academic.class_rank,
    class_size: academic.class_size,
    course_rigor: courseRigor as 'high' | 'medium' | 'low',
    ap_ib_courses: apIbCourses,
    ap_exams: academic.ap_exams,
    ib_exams: academic.ib_exams,
    test_scores: academic.standardized_tests,
    took_math_early: academic.took_math_early,
    took_language_early: academic.took_language_early
  };
}

/**
 * Tool 4: get_context_circumstances
 * Understand student's challenges for Context dimension
 */
export async function getContextCircumstances(input: z.infer<typeof GetContextCircumstancesInputSchema>) {
  const context = await getCompleteStudentContext(input.user_id);

  if (!context) {
    throw new Error(`User ${input.user_id} not found`);
  }

  return {
    family_responsibilities: {
      types: context.family?.responsibilities || [],
      hours_per_week: context.family?.hours_per_week || 0,
      circumstances: context.family?.circumstances || []
    },
    challenging_circumstances: context.family?.challenging_circumstances || false,
    first_generation: context.personal_info?.first_gen || false,
    financial_need: context.profile.constraints.needsFinancialAid || false,
    household_income: context.personal_info?.household_income || null,
    english_proficiency_needed: context.academic?.need_english_proficiency || false,
    years_in_us: context.personal_info?.years_in_us || null,
    other_context: context.family?.other_circumstances || ''
  };
}

/**
 * Tool 5: get_all_essays
 * Fetch all essays for a student (requires Supabase integration)
 */
export async function getAllEssays(input: z.infer<typeof GetAllEssaysInputSchema>) {
  // NOTE: Placeholder - will integrate with essay system
  // This would query the essays table and optionally include analysis_reports

  return {
    essays: [],
    total_count: 0,
    note: 'Essay system integration pending - will return personal statement, PIQs, and supplements'
  };
}

/**
 * Tool 6: check_repetition
 * Detect if current essay repeats content from other essays
 */
export async function checkRepetition(input: z.infer<typeof CheckRepetitionInputSchema>): Promise<RepetitionCheckOutput> {
  // NOTE: This is a placeholder implementation
  // In production, this would fetch all essays from the essay system and compare

  // For now, return a basic structure
  // TODO: Integrate with essay system when available

  return {
    has_repetition: false,
    repetition_details: [],
    suggestions: [
      'Full repetition detection requires essay system integration',
      'This tool will check against personal statement, other PIQs, and supplemental essays'
    ]
  };
}

/**
 * Tool 7: get_portfolio_analytics
 * Get comprehensive portfolio analytics including dimension coverage
 */
export async function getPortfolioAnalytics(input: z.infer<typeof GetPortfolioAnalyticsInputSchema>): Promise<PortfolioAnalyticsOutput> {
  const context = await getCompleteStudentContext(input.user_id);

  if (!context || !context.portfolio_analytics) {
    const emptyDimensionCoverage: Record<string, import('../database/types.js').DimensionCoverage> = {};
    return {
      dimension_coverage: emptyDimensionCoverage,
      essay_count: 0,
      portfolio_coherence_score: 0,
      gaps: [
        'No portfolio analytics found',
        'Student needs to submit essays for analysis'
      ],
      strengths: []
    };
  }

  const analytics = context.portfolio_analytics;

  // Calculate dimension coverage (how many essays cover each dimension)
  const dimensionCoverage: Record<string, import('../database/types.js').DimensionCoverage> = {};

  // NOTE: In production, this would aggregate across all essay analysis_reports
  // For now, return structure from portfolio_analytics table

  const allDimensions = [
    'opening_hook_quality',
    'vulnerability_authenticity',
    'specificity_evidence',
    'voice_integrity',
    'narrative_arc_stakes',
    'transformative_impact',
    'role_clarity_ownership',
    'initiative_leadership',
    'context_circumstances',
    'reflection_insight',
    'identity_self_discovery',
    'craft_language_quality',
    'fit_trajectory'
  ];

  // Mock coverage analysis (in production, query actual essay scores)
  for (const dim of allDimensions) {
    dimensionCoverage[dim] = {
      essays_showing_it: [],
      average_score: 0,
      strength_level: 'absent'
    };
  }

  // Identify gaps (dimensions not covered well)
  const gaps: string[] = [];
  const strengths: string[] = [];

  for (const [dimension, coverage] of Object.entries(dimensionCoverage)) {
    if (coverage.strength_level === 'absent') {
      gaps.push(`No essays demonstrate ${dimension.replace(/_/g, ' ')}`);
    } else if (coverage.strength_level === 'strong') {
      strengths.push(`Strong coverage of ${dimension.replace(/_/g, ' ')}`);
    }
  }

  return {
    dimension_coverage: dimensionCoverage,
    essay_count: 0, // Would be actual count from essays table
    portfolio_coherence_score: (analytics.overall as number) || 0,
    gaps: gaps.length > 0 ? gaps : ['Complete portfolio analytics requires essay submissions'],
    strengths
  };
}

/**
 * Tool 8: validate_claim
 * Check if essay claim is backed by student data
 */
export async function validateClaimTool(input: z.infer<typeof ValidateClaimInputSchema>): Promise<ClaimValidationOutput> {
  const activities = await getActivities(input.user_id);
  const academic = await getAcademicData(input.user_id);

  const result = validateClaim(input.claim, input.claim_type, activities, academic);

  return {
    is_valid: result.is_valid,
    evidence_found: result.evidence_found,
    confidence: result.confidence,
    suggestion: result.suggestion
  };
}

/**
 * Tool 9: suggest_piq_prompts
 * Recommend which PIQ prompts align with student's story
 * ENHANCED: Deep analysis of student's actual experiences and potential
 */
export async function suggestPIQPrompts(input: z.infer<typeof SuggestPIQPromptsInputSchema>): Promise<PIQSuggestionOutput> {
  const context = await getCompleteStudentContext(input.user_id);

  if (!context) {
    throw new Error(`User ${input.user_id} not found`);
  }

  // Ensure already_written has a fallback
  const alreadyWritten = input.already_written || [];

  const recommendations: any[] = [];
  const avoid: any[] = [];

  // Deep portfolio analysis
  const activities = context.activities;
  const academic = context.academic;
  const family = context.family;
  const personalInfo = context.personal_info;
  const goals = context.goals;
  const personalGrowth = context.personal_growth;

  // Leadership analysis - NUANCED
  const leadershipRoles = (activities?.leadership_roles as any[] || []);
  const extrasWithLeadership = (activities?.extracurriculars || []).filter((a: any) => a.leadership_role);
  const allLeadership = [...leadershipRoles, ...extrasWithLeadership];
  const hasSubstantiveLeadership = allLeadership.some((r: any) => {
    const hours = r.hours_per_week || 0;
    const hasImpact = (r.impact || '').length > 50;
    return hours >= 5 || hasImpact; // Real commitment, not title-only
  });
  const leadershipCount = allLeadership.length;

  // Creative/talent analysis
  const creativeActivities = (activities?.extracurriculars || []).filter((a: any) => {
    const name = (a.name || '').toLowerCase();
    const category = (a.category || '').toLowerCase();
    return name.includes('art') || name.includes('music') || name.includes('theater') ||
           name.includes('dance') || name.includes('creative') || name.includes('design') ||
           category.includes('arts') || category.includes('creative');
  });
  const hasCreativeTalent = creativeActivities.length > 0;
  const hasDedicatedTalent = creativeActivities.some((a: any) => (a.hours_per_week || 0) >= 10);

  // Community/service analysis
  const volunteerService = (activities?.volunteer_service as any[] || []);
  const hasMeaningfulService = volunteerService.some((v: any) => {
    const hours = v.hours_per_week || v.total_hours || 0;
    const hasImpact = (v.impact || '').length > 50;
    return hours >= 100 || hasImpact; // Substantial service, not one-off
  });

  // Context/circumstances analysis - DEEPLY NUANCED
  const isFirstGen = personalInfo?.first_gen || false;
  const hasChallenges = family?.challenging_circumstances || false;
  const familyResponsibilities = (family?.responsibilities as any[] || []);
  const familyHoursPerWeek = family?.hours_per_week || 0;
  const hasSubstantialFamilyDuties = familyHoursPerWeek >= 10;
  const financialNeed = context.profile.constraints.needsFinancialAid || false;
  const englishLearner = academic?.need_english_proficiency || false;
  const yearsInUS = personalInfo?.years_in_us;
  const isImmigrant = yearsInUS !== null && yearsInUS !== undefined && yearsInUS < 10;

  // Calculate "context depth score" (0-100)
  let contextDepth = 0;
  if (isFirstGen) contextDepth += 25;
  if (hasChallenges) contextDepth += 20;
  if (hasSubstantialFamilyDuties) contextDepth += 20;
  if (financialNeed) contextDepth += 15;
  if (englishLearner) contextDepth += 10;
  if (isImmigrant) contextDepth += 10;

  // Academic passion indicators
  const intendedMajor = goals?.intended_major;

  // Calculate course rigor - use course_history OR fallback to ap_exams count
  const courseHistoryRigor = academic?.course_history ?
    (academic.course_history as any[]).filter((c: any) => c.level === 'AP' || c.level === 'IB').length : 0;

  const apExams = (academic?.ap_exams as any[] || []);
  const ibExams = (academic?.ib_exams as any[] || []);
  const examBasedRigor = apExams.length + ibExams.length;

  // Use whichever is higher (some students have detailed course history, others just have exam counts)
  const courseRigor = Math.max(courseHistoryRigor, examBasedRigor);
  const hasAcademicDepth = courseRigor >= 6;
  const highAPScores = apExams.filter((e: any) => e.score >= 4).length;

  // Work experience analysis
  const workExperiences = (activities?.work_experiences as any[] || []);
  const hasSignificantWork = workExperiences.some((w: any) => {
    const months = w.months_duration || 0;
    const hours = w.hours_per_week || 0;
    return months >= 6 || hours >= 15; // Real job, not summer job
  });

  // Personal growth/identity indicators
  const meaningfulExperiences = Array.isArray(personalGrowth?.meaningful_experiences) ?
    personalGrowth.meaningful_experiences as any[] : [];
  const additionalContext = typeof personalGrowth?.additional_context === 'string' ?
    personalGrowth.additional_context : '';
  const hasIdentityStory = meaningfulExperiences.length > 0 || additionalContext.length > 100;

  // PIQ 1: Leadership - STRICT HYPSM-LEVEL TIERED SCORING
  if (!alreadyWritten.includes(1)) {
    if (hasSubstantiveLeadership) {
      const topLeadershipRole = allLeadership.sort((a: any, b: any) =>
        (b.hours_per_week || 0) - (a.hours_per_week || 0)
      )[0];

      const impact = topLeadershipRole.impact || topLeadershipRole.description || '';
      const hours = topLeadershipRole.hours_per_week || 0;
      const name = topLeadershipRole.name || topLeadershipRole.title || topLeadershipRole.role || '';

      // STEP 1: Determine Leadership Tier (base score)
      let leadershipBase = 0;
      let leadershipTier = '';

      // Check for founder/founded organization
      const isFounder = name.toLowerCase().includes('found') ||
                       (topLeadershipRole.role || '').toLowerCase().includes('found');

      // Check for scale indicators in impact
      const impactLower = impact.toLowerCase();
      const servesLarge = impactLower.includes('500+') || impactLower.includes('1000+') ||
                         impactLower.includes('school-wide') || impactLower.includes('1,000');
      const hasMetrics = /\d+/.test(impact) && impact.length > 80; // Has numbers and detailed description
      const hasNationalMention = impactLower.includes('national') || impactLower.includes('state');

      if ((isFounder && servesLarge) || hasNationalMention) {
        leadershipBase = 60; // Recalibrated to 110-point scale (+10 from 50)
        leadershipTier = 'Transformative (founded large org or state/national level)';
      } else if (servesLarge || (isFounder && hasMetrics)) {
        leadershipBase = 50; // +10 from 40
        leadershipTier = 'Impactful (school-wide impact or founded org with metrics)';
      } else if (hasMetrics && hours >= 10) {
        leadershipBase = 40; // +10 from 30
        leadershipTier = 'Substantive (documented measurable impact)';
      } else if (impact.length >= 50) {
        leadershipBase = 32; // +10 from 22
        leadershipTier = 'Positional (some impact documented)';
      } else {
        leadershipBase = 25; // +10 from 15
        leadershipTier = 'Title-based (limited documented impact)';
      }

      // STEP 2: Achievement Bonuses (unlimited)
      const adjustments: Array<{ reason: string; points: number }> = [];

      adjustments.push({
        reason: `Leadership Level - ${leadershipTier}`,
        points: leadershipBase
      });

      // National/state recognition bonus
      if (hasNationalMention && impact.includes('champion')) {
        adjustments.push({ reason: 'National/state championship or recognition', points: 25 });
      } else if (hasNationalMention) {
        adjustments.push({ reason: 'State/regional level competition or impact', points: 18 });
      }

      // Founded organization bonus
      if (isFounder && servesLarge) {
        adjustments.push({ reason: 'Founded organization serving 500+ people', points: 20 });
      } else if (isFounder && hasMetrics) {
        adjustments.push({ reason: 'Founded organization with documented impact', points: 15 });
      }

      // Documented transformation bonus (specific metrics showing change)
      const hasBeforeAfter = impactLower.includes('increased') || impactLower.includes('improved') ||
                            impactLower.includes('raised') || impactLower.includes('grew');
      const hasPercentage = impact.includes('%');
      const hasDollarAmount = impact.includes('$') || impact.includes('k');

      if (hasBeforeAfter && (hasPercentage || hasDollarAmount) && impact.length > 100) {
        adjustments.push({ reason: 'Quantified transformation metrics (before/after data)', points: 18 });
      } else if (hasBeforeAfter || hasPercentage || hasDollarAmount) {
        adjustments.push({ reason: 'Some quantified impact metrics', points: 12 });
      }

      // Breadth bonus (multiple substantive roles, not just titles)
      if (leadershipCount >= 3 && allLeadership.filter((r: any) =>
          (r.impact || r.description || '').length > 60).length >= 3) {
        adjustments.push({ reason: `${leadershipCount} substantive leadership roles (demonstrates versatility)`, points: 10 });
      } else if (leadershipCount >= 2) {
        adjustments.push({ reason: `${leadershipCount} leadership roles`, points: 6 });
      }

      // Deep time commitment bonus (15+ hrs/week for 2+ years is HYPSM-level)
      if (hours >= 15 && (topLeadershipRole.years_participated || topLeadershipRole.months_duration || 0) >= 2) {
        adjustments.push({ reason: `Deep sustained commitment (${hours} hrs/week for 2+ years)`, points: 8 });
      } else if (hours >= 12) {
        adjustments.push({ reason: `Significant time commitment (${hours} hrs/week)`, points: 5 });
      }

      // STEP 3: Context Bonus (MAX +20 for leadership)
      let contextBonus = 0;
      const contextFactors: string[] = [];

      // Self-initiated/created from scratch
      const createdFromScratch = isFounder || impactLower.includes('created') || impactLower.includes('started');
      if (createdFromScratch) {
        contextBonus += 8;
        contextFactors.push('self-initiated/created from scratch');
      }

      // Led despite barriers
      if ((isFirstGen || hasSubstantialFamilyDuties) && hours >= 10) {
        contextBonus += 12;
        contextFactors.push('led despite first-gen/family responsibilities');
      }

      if (contextBonus > 0) {
        adjustments.push({
          reason: `Context: ${contextFactors.join(', ')}`,
          points: Math.min(contextBonus, 20)
        });
      }

      // Calculate final score (110-point scale)
      const baseScore = leadershipBase;
      const achievementBonuses = adjustments.slice(1).reduce((sum, adj) => sum + adj.points, 0);
      const contextAdjustment = achievementBonuses;
      const fitScore = Math.min(baseScore + contextAdjustment, 110); // Cap at 110

      // Build engaging rationale based on score (110-point scale)
      let rationale = `🎯 YOUR SCORE: ${fitScore}/110 - ${leadershipTier}\n\n`;

      // Add achievement summary
      const achievementFactors: string[] = [];
      if (hasNationalMention && impact.includes('champion')) {
        achievementFactors.push('national/state championship');
      } else if (hasNationalMention) {
        achievementFactors.push('state/regional recognition');
      }
      if (isFounder && servesLarge) {
        achievementFactors.push('founded organization serving 500+');
      } else if (isFounder) {
        achievementFactors.push('founded organization');
      }
      if (hasBeforeAfter && (hasPercentage || hasDollarAmount)) {
        achievementFactors.push('quantified transformation metrics');
      }
      if (hours >= 15) {
        achievementFactors.push(`deep commitment (${hours} hrs/week)`);
      }

      // Score-band specific rationale with emoji sections
      if (fitScore >= 100) {
        // 100-110: Elite Competitive (Harvard, Yale, Princeton, Stanford, MIT)
        const placementBand = 'Harvard, Yale, Princeton, Stanford, MIT, Columbia, Caltech';

        rationale += `📍 WHERE YOU STAND RIGHT NOW\n\n`;
        rationale += `Your leadership (${name}) places you in the top 3-5% nationally. Schools like ${placementBand} look for exactly this kind of impact. You've demonstrated ${achievementFactors.length > 0 ? achievementFactors.join(', ') : 'exceptional leadership depth'}.\n\n`;

        rationale += `📝 HOW TO WRITE YOUR ESSAY\n\n`;
        rationale += `Don't just list what you did. Show the moments that changed you:\n`;
        rationale += `• What failed at first? What did you learn from failure?\n`;
        rationale += `• What hard conversations did you have? How did you handle conflict?\n`;
        rationale += `• How are you different now as a leader than when you started?\n`;
        rationale += `• What ONE moment captures your growth best?\n\n`;

        rationale += `Your metrics and scale are impressive—now show the human side. Admissions officers want to see reflection, vulnerability, and growth.\n\n`;

        rationale += `⚠️ IMPORTANT DISCLAIMER\n\n`;
        rationale += `This score reflects strength in your leadership dimension. Actual admissions at these schools (3-6% acceptance rates) depend on your entire application: GPA, test scores, all essays, letters of recommendation, and holistic review. Strong leadership is necessary but not sufficient on its own.`;

      } else if (fitScore >= 90) {
        // 90-99: Highly Competitive (Berkeley, UCLA, Northwestern, Duke)
        const placementBand = 'UC Berkeley, UCLA, Northwestern, Duke, Cornell, USC, Carnegie Mellon';

        rationale += `📍 WHERE YOU STAND RIGHT NOW\n\n`;
        rationale += `Your leadership (${name}) is excellent. Schools like ${placementBand} actively seek students with your profile. You're competitive for top-tier universities (10-15% acceptance rates).\n\n`;

        rationale += `🎓 YOUR PATH TO ELITE LEVEL (100-110: Harvard, Yale, Princeton, Stanford, MIT)\n\n`;
        rationale += `You're ${100 - fitScore}-${110 - fitScore} points away from elite competitive level. Your roadmap:\n`;
        rationale += `• Scale: Grow your impact to 500+ people served, or take it to state/national level\n`;
        rationale += `• Metrics: Show systemic change with before/after data (% improvement, $ raised, students mentored)\n`;
        rationale += `• Recognition: Win state/national competition, or get featured for your work\n`;
        rationale += `• Depth: Increase to 15+ hrs/week if you're not there already\n\n`;
        rationale += `Pick ONE of these and execute it deeply over the next 6-12 months.\n\n`;

        rationale += `💪 WHAT MAKES YOUR LEADERSHIP STRONG\n\n`;
        rationale += `You've demonstrated ${achievementFactors.length > 0 ? achievementFactors.join(', ') : 'real leadership impact'}. For your essay, focus on one specific leadership moment—a conflict you resolved, a time you failed and learned, or a decision where you had to choose between two hard options. Show growth, not just success.`;

      } else if (fitScore >= 80) {
        // 80-89: Very Competitive (UCSD, Michigan, UNC)
        const placementBand = 'UC San Diego, UC Santa Barbara, UC Irvine, Michigan, UNC, UT Austin, NYU';

        rationale += `📍 WHERE YOU STAND RIGHT NOW\n\n`;
        rationale += `Your leadership (${name}) shows strong potential. You're competitive for schools like ${placementBand}. These are excellent universities (15-30% acceptance rates) where your profile fits well.\n\n`;

        rationale += `🎓 YOUR PATH TO HIGHLY COMPETITIVE LEVEL (90-99: Berkeley, UCLA, Duke)\n\n`;
        rationale += `You're ${90 - fitScore}-${99 - fitScore} points away from highly competitive level. To strengthen:\n`;
        rationale += `• Add quantified metrics: How many people did you impact? What % improvement did you create?\n`;
        rationale += `• Increase scale: Take your role from club-level to school-wide, or school-wide to district/regional\n`;
        rationale += `• Show transformation: Document before/after data (satisfaction scores, participation rates, money raised)\n`;
        rationale += `• Deepen commitment: Push to 12-15 hrs/week if you're below that\n\n`;

        rationale += `💪 WHAT MAKES YOUR LEADERSHIP GOOD\n\n`;
        rationale += `You have ${leadershipCount} leadership role(s), with ${name} as your strongest. You've shown ${hours} hrs/week commitment. For your essay, pick one moment where you influenced someone else's thinking or behavior. Show how you learned to lead, not just that you held a position.`;

      } else if (fitScore >= 70) {
        // 70-79: Competitive (UC Davis, BU, Wisconsin)
        const placementBand = 'UC Davis, UC Irvine, Boston University, Wisconsin, UIUC';

        rationale += `📍 WHERE YOU STAND RIGHT NOW\n\n`;
        rationale += `You're competitive for universities like ${placementBand}. Your leadership (${name}, ${hours} hrs/week) shows you can manage responsibilities and work with others. These schools (30-50% acceptance rates) value students with your profile.\n\n`;

        rationale += `🎓 YOUR PATH TO VERY COMPETITIVE LEVEL (80-89: UC San Diego, Michigan, UNC)\n\n`;
        rationale += `You're ${80 - fitScore}-${89 - fitScore} points away from very competitive level. Your action plan:\n`;
        rationale += `• Metrics are critical: Add specific numbers—how many people did you lead? What did you accomplish? $ raised? % improvement in anything?\n`;
        rationale += `• Expand your role: Take on more responsibilities, launch a new initiative, or scale what you're already doing\n`;
        rationale += `• Time matters: Increase to 10-12 hrs/week minimum, maintain for 2+ years\n`;
        rationale += `• Document impact: Keep track of before/after data so you can show real change\n\n`;

        rationale += `Pick 2-3 of these and focus on them for the next 6-12 months.\n\n`;

        rationale += `💪 YOUR ESSAY APPROACH\n\n`;
        rationale += `Focus on one specific story from ${name}. Don't try to cover everything you did. Pick the moment where you influenced someone, solved a problem, or learned something important about leadership. Show your thinking process and growth.`;

      } else if (fitScore >= 60) {
        // 60-69: Developing
        rationale += `📍 WHERE YOU STAND RIGHT NOW\n\n`;
        rationale += `You have ${leadershipCount} leadership role(s), with ${name} as your primary experience (${hours} hrs/week). This shows you're willing to step up, but your leadership profile needs strengthening to be competitive for top universities.\n\n`;

        rationale += `🎓 YOUR PATH TO COMPETITIVE LEVEL (70-79: UC Davis, BU, Wisconsin)\n\n`;
        rationale += `To reach competitive level (${70 - fitScore}-${79 - fitScore} points higher), you need to add depth:\n\n`;
        rationale += `**1. Add Measurable Impact (Most Important)**\n`;
        rationale += `• How many people did you lead or influence?\n`;
        rationale += `• What specific outcome did you create? (event attendance, money raised, satisfaction scores)\n`;
        rationale += `• Can you show before/after data for anything?\n\n`;

        rationale += `**2. Increase Time & Duration**\n`;
        rationale += `• Push to 10-15 hrs/week minimum\n`;
        rationale += `• Maintain for 2+ years (colleges want sustained commitment)\n\n`;

        rationale += `**3. Expand Scope**\n`;
        rationale += `• Take your role from class-level to club-level, or club-level to school-wide\n`;
        rationale += `• Launch a new initiative within your current role\n`;
        rationale += `• Mentor others or train new leaders\n\n`;

        rationale += `Pick 1-2 of these and focus deeply. It's better to do one thing exceptionally than three things adequately.`;

      } else {
        // <60: Needs Growth
        rationale += `📍 HONEST ASSESSMENT\n\n`;
        rationale += `Your current leadership (${name}) shows you're willing to take on responsibility, but it lacks the depth that competitive universities look for. Leadership isn't about having a title—it's about creating measurable impact on other people.\n\n`;

        rationale += `🎓 HOW TO BUILD REAL LEADERSHIP (Target: 70+ to be competitive)\n\n`;
        rationale += `You need to add ${70 - fitScore}+ points. Here's how:\n\n`;

        rationale += `**1. Document Measurable Impact (Essential)**\n`;
        rationale += `• Count the people you influenced (members, attendees, students taught)\n`;
        rationale += `• Track outcomes (money raised, events organized, projects completed)\n`;
        rationale += `• Before/after data (attendance growth, satisfaction scores, skill improvement)\n`;
        rationale += `• Write at least 100-150 characters describing specific accomplishments\n\n`;

        rationale += `**2. Increase Commitment (Required)**\n`;
        rationale += `• Minimum 10 hrs/week for leadership roles\n`;
        rationale += `• Sustain for at least 2 years\n`;
        rationale += `• Consistency matters more than occasional bursts\n\n`;

        rationale += `**3. Deepen Your Current Role OR Start Something New**\n`;
        rationale += `• If staying in ${name}: Take on bigger projects, mentor others, create new initiatives\n`;
        rationale += `• If starting fresh: Found a club, launch a community project, organize peers around a cause you care about\n\n`;

        rationale += `**4. Scale Your Impact**\n`;
        rationale += `• Move from individual work to leading teams\n`;
        rationale += `• Expand from 5-10 people to 20-50+ people\n`;
        rationale += `• Go from club-level to school-wide impact\n\n`;

        rationale += `Focus on ONE area and go deep. Better to lead one thing exceptionally than hold three titles with minimal impact.`;
      }

      recommendations.push({
        prompt_number: 1,
        prompt_text: 'Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time.',
        fit_score: fitScore,
        base_score: leadershipBase,
        context_adjustment: contextAdjustment,
        score_breakdown: {
          base: 0, // Show tiers in adjustments
          adjustments: adjustments,
          final: fitScore
        },
        rationale: rationale,
        story_suggestions: allLeadership.map((r: any) => r.name || r.title || r.role).filter(Boolean).slice(0, 3),
        dimension_alignment: ['initiative_leadership', 'role_clarity_ownership', 'transformative_impact', 'specificity_evidence']
      });
    } else if (leadershipCount > 0) {
      // Has titles but lacks depth
      avoid.push({
        prompt_number: 1,
        reason: 'You have leadership titles but limited documented impact. Consider strengthening your current roles before writing PIQ 1, or focus on other prompts where you have deeper stories.'
      });
    } else {
      avoid.push({
        prompt_number: 1,
        reason: 'No leadership roles in your activity list. PIQ 1 requires demonstrable leadership experience.'
      });
    }
  }

  // PIQ 2: Creative - ENHANCED LOGIC WITH TRANSPARENT SCORING
  if (!alreadyWritten.includes(2)) {
    if (hasCreativeTalent) {
      const topCreative = creativeActivities.sort((a: any, b: any) =>
        (b.hours_per_week || 0) - (a.hours_per_week || 0)
      )[0];

      // Base score: creative talent identified
      const baseScore = 70;

      // Build adjustments array dynamically
      const adjustments: Array<{ reason: string; points: number }> = [];

      if (hasDedicatedTalent) {
        adjustments.push({ reason: `Dedicated creative practice (${topCreative.hours_per_week}+ hrs/week shows mastery)`, points: 15 });
      }
      if ((topCreative.impact || topCreative.description || '').length > 100) {
        adjustments.push({ reason: `Detailed documentation of creative work (${(topCreative.impact || topCreative.description || '').length} characters)`, points: 10 });
      }

      // Calculate final score
      const contextAdjustment = adjustments.reduce((sum, adj) => sum + adj.points, 0);
      const fitScore = Math.min(baseScore + contextAdjustment, 92);

      recommendations.push({
        prompt_number: 2,
        prompt_text: 'Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side.',
        fit_score: fitScore,
        base_score: baseScore,
        context_adjustment: contextAdjustment,
        score_breakdown: {
          base: baseScore,
          adjustments: adjustments,
          final: fitScore
        },
        rationale: hasDedicatedTalent ?
          `You invest significant time (${topCreative.hours_per_week}+ hrs/week) in ${topCreative.name}` :
          `You participate in creative activities like ${topCreative.name}`,
        story_suggestions: creativeActivities.map((a: any) => a.name).filter(Boolean),
        dimension_alignment: ['craft_language_quality', 'specificity_evidence', 'voice_integrity', 'reflection_insight']
      });
    }
  }

  // PIQ 3: Talent/Skill - ENHANCED LOGIC WITH TRANSPARENT SCORING
  if (!alreadyWritten.includes(3)) {
    // Find activities with deep time investment (10+ hrs/week for 6+ months)
    const allActivities = [
      ...(activities?.extracurriculars || []),
      ...(activities?.personal_projects as any[] || []),
      ...workExperiences
    ];

    const deepCommitments = allActivities.filter((a: any) => {
      const hours = a.hours_per_week || 0;
      const duration = a.months_duration || a.years_participated || 0;
      return hours >= 10 && (duration >= 6 || duration >= 1); // 10+ hrs/week for 6+ months or 1+ year
    });

    if (deepCommitments.length > 0) {
      const topTalent = deepCommitments.sort((a: any, b: any) =>
        (b.hours_per_week || 0) * (b.months_duration || b.years_participated || 1) -
        (a.hours_per_week || 0) * (a.months_duration || a.years_participated || 1)
      )[0];

      const totalHours = (topTalent.hours_per_week || 0) * (topTalent.months_duration || topTalent.years_participated || 1) * 4;

      // Base score: deep commitment exists
      const baseScore = 70;

      // Build adjustments array dynamically
      const adjustments: Array<{ reason: string; points: number }> = [];

      if (totalHours >= 500) {
        adjustments.push({ reason: `Mastery-level commitment (${totalHours}+ total hours invested)`, points: 18 });
      } else if (totalHours >= 200) {
        adjustments.push({ reason: `Significant time investment (${totalHours}+ hours)`, points: 10 });
      }

      // Calculate final score
      const contextAdjustment = adjustments.reduce((sum, adj) => sum + adj.points, 0);
      const fitScore = Math.min(baseScore + contextAdjustment, 88);

      recommendations.push({
        prompt_number: 3,
        prompt_text: 'What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time?',
        fit_score: fitScore,
        base_score: baseScore,
        context_adjustment: contextAdjustment,
        score_breakdown: {
          base: baseScore,
          adjustments: adjustments,
          final: fitScore
        },
        rationale: `You've invested ${totalHours}+ hours in ${topTalent.name}. This depth shows true dedication and skill development.`,
        story_suggestions: deepCommitments.map((a: any) => a.name).filter(Boolean).slice(0, 3),
        dimension_alignment: ['specificity_evidence', 'transformative_impact', 'reflection_insight', 'narrative_arc_stakes']
      });
    }
  }

  // PIQ 4: Educational Barrier - STRICT HYPSM-LEVEL SCORING
  if (!alreadyWritten.includes(4)) {
    if (contextDepth >= 20) { // Lowered threshold - some context to discuss
      const barriers: string[] = [];
      const opportunities: string[] = [];

      // STEP 1: Determine Barrier Severity Tier (sets base score)
      let barrierSeverityBase = 0;
      let barrierTier = '';
      const barrierFactors: string[] = [];

      // Count barrier types
      const otherCircumstances = context.family?.other_circumstances || '';
      const hasHomelessness = typeof otherCircumstances === 'string' &&
        otherCircumstances.toLowerCase().includes('homeless');
      const isRefugee = (context.personal_info as any)?.immigration_status === 'refugee';
      const isExtremePoverty = financialNeed && hasSignificantWork && familyHoursPerWeek >= 20;

      if (hasHomelessness || isRefugee || isExtremePoverty) {
        barrierSeverityBase = 80; // Recalibrated to 110-point scale (+10 from 70)
        barrierTier = 'Tier 1 (Severe)';
        if (hasHomelessness) barrierFactors.push('homelessness');
        if (isRefugee) barrierFactors.push('refugee status');
        if (isExtremePoverty) barrierFactors.push('extreme poverty with extensive work/family obligations');
      } else if ((isFirstGen && hasSubstantialFamilyDuties && hasSignificantWork) ||
                 ((context.personal_info as any)?.immigration_status === 'undocumented' && hasSignificantWork)) {
        barrierSeverityBase = 68; // +10 from 58
        barrierTier = 'Tier 2 (Major Compound)';
        barrierFactors.push('multiple significant barriers');
      } else if ((isFirstGen && hasSubstantialFamilyDuties) || (isFirstGen && hasSignificantWork)) {
        barrierSeverityBase = 58; // +10 from 48
        barrierTier = 'Tier 3 (Moderate Compound)';
        if (isFirstGen) barrierFactors.push('first-generation college student');
        if (hasSubstantialFamilyDuties) barrierFactors.push(`family responsibilities (${familyHoursPerWeek} hrs/week)`);
        if (hasSignificantWork) barrierFactors.push('significant work obligations');
      } else if (isFirstGen || hasSubstantialFamilyDuties || hasSignificantWork) {
        barrierSeverityBase = 48; // +10 from 38
        barrierTier = 'Tier 4 (Single Major)';
        if (isFirstGen) barrierFactors.push('first-generation college student');
        if (hasSubstantialFamilyDuties) barrierFactors.push(`family caregiver (${familyHoursPerWeek} hrs/week)`);
        if (hasSignificantWork) barrierFactors.push('working student');
      } else {
        barrierSeverityBase = 38; // +10 from 28
        barrierTier = 'Tier 5 (Minor)';
        if (englishLearner) barrierFactors.push('English language learner');
        if (contextDepth >= 20) barrierFactors.push('some contextual challenges');
      }

      barriers.push(...barrierFactors);

      // STEP 2: Calculate Achievement Multiplier (how much they achieved DESPITE barriers)
      let achievementMultiplier = 0;
      let achievementLevel = '';
      const achievementFactors: string[] = [];

      // Check for research/publication
      const hasResearch = (activities?.personal_projects as any[] || []).some((p: any) =>
        (p.category || p.type || '').toLowerCase().includes('research'));
      const hasPublication = ((activities as any)?.achievements as any[] || []).some((a: any) =>
        (a.type || a.category || '').toLowerCase().includes('publication') ||
        (a.type || a.category || '').toLowerCase().includes('research'));

      if ((courseRigor >= 12 && academic?.gpa && academic.gpa >= 4.0) && (hasResearch || hasPublication)) {
        achievementMultiplier = 32;
        achievementLevel = 'Transcendent';
        achievementFactors.push(`${courseRigor} AP/IB courses with 4.0 GPA + research/publication`);
      } else if (courseRigor >= 10 && academic?.gpa && academic.gpa >= 3.9) {
        achievementMultiplier = 22;
        achievementLevel = 'Exceptional';
        achievementFactors.push(`${courseRigor} AP/IB courses with ${academic.gpa.toFixed(2)} GPA`);
      } else if (courseRigor >= 8 && academic?.gpa && academic.gpa >= 3.7) {
        achievementMultiplier = 16;
        achievementLevel = 'Strong';
        achievementFactors.push(`${courseRigor} AP/IB courses with ${academic.gpa.toFixed(2)} GPA`);
      } else if (courseRigor >= 6 && academic?.gpa && academic.gpa >= 3.5) {
        achievementMultiplier = 10;
        achievementLevel = 'Good';
        achievementFactors.push(`${courseRigor} AP/Honors courses with ${academic.gpa.toFixed(2)} GPA`);
      } else if (courseRigor >= 3 && academic?.gpa && academic.gpa >= 3.0) {
        achievementMultiplier = 5;
        achievementLevel = 'Adequate';
        achievementFactors.push(`${courseRigor} rigorous courses with ${academic.gpa?.toFixed(2) || '?'} GPA`);
      } else {
        achievementMultiplier = 0;
        achievementLevel = 'Minimal';
        achievementFactors.push('limited academic rigor documented');
      }

      opportunities.push(...achievementFactors);

      // STEP 3: Opportunity Creation Bonus (founded org, advocacy, created programs)
      let opportunityBonus = 0;
      const opportunityFactors: string[] = [];

      // Check if founded organization helping others with similar barriers
      const foundedEquityOrg = (activities?.extracurriculars as any[] || []).some((ec: any) => {
        const isFounder = ec.leadership_role && (ec.role || '').toLowerCase().includes('found');
        const helpsOthers = (ec.impact || ec.description || '').toLowerCase().includes('help') ||
                           (ec.impact || ec.description || '').toLowerCase().includes('serve') ||
                           (ec.impact || ec.description || '').toLowerCase().includes('tutor');
        return isFounder && helpsOthers;
      });

      if (hasPublication && ((context.goals as any)?.essay_topics || []).some((t: any) =>
        (t || '').toLowerCase().includes('equity') || (t || '').toLowerCase().includes('barrier'))) {
        opportunityBonus += 12;
        opportunityFactors.push('published research on educational equity/barriers');
      }
      if (foundedEquityOrg) {
        opportunityBonus += 10;
        opportunityFactors.push('founded organization to help others facing similar barriers');
      }

      // STEP 4: Build transparent scoring breakdown
      const adjustments: Array<{ reason: string; points: number }> = [];

      adjustments.push({
        reason: `Barrier Severity - ${barrierTier}: ${barrierFactors.join(', ')}`,
        points: barrierSeverityBase
      });

      adjustments.push({
        reason: `Achievement Despite Barriers - ${achievementLevel}: ${achievementFactors.join(', ')}`,
        points: achievementMultiplier
      });

      if (opportunityBonus > 0) {
        adjustments.push({
          reason: `Opportunity Creation: ${opportunityFactors.join(', ')}`,
          points: opportunityBonus
        });
      }

      // Calculate final score (110-point scale)
      const baseScore = barrierSeverityBase; // Barrier severity IS the base
      const contextAdjustment = achievementMultiplier + opportunityBonus; // Achievement adds on top
      const fitScore = Math.min(baseScore + contextAdjustment, 110); // Cap at 110 for PIQ 4

      // Determine school placement potential band
      let placementBand = '';
      if (fitScore >= 100) {
        placementBand = 'HYPSM (Harvard, Yale, Princeton, Stanford, MIT), Columbia, Caltech';
      } else if (fitScore >= 90) {
        placementBand = 'UC Berkeley, UCLA, Northwestern, Duke, Cornell';
      } else if (fitScore >= 80) {
        placementBand = 'UCSD, UCSB, UCI, Michigan, UNC, UT Austin';
      } else if (fitScore >= 70) {
        placementBand = 'UC Davis, UC Irvine, Boston University, Wisconsin';
      } else if (fitScore >= 60) {
        placementBand = 'UC Riverside, UC Merced, strong state schools';
      } else {
        placementBand = 'Focus on strengthening this component';
      }

      // Build engaging, clear, lively rationale
      let rationale = `🎯 YOUR SCORE: ${fitScore}/110 - ${barrierTier}, ${achievementLevel} Achievement\n\n`;

      // Build score-appropriate rationale with personality
      if (fitScore >= 100) {
        rationale += `📍 WHERE YOU STAND RIGHT NOW\n\n`;
        rationale += `You're in rare air. Only 3-5% of applicants nationally reach this level - we're talking about students competitive for Harvard, Yale, Princeton, Stanford, and MIT.\n\n`;
        rationale += `Your achievement (${achievementFactors[0]}) WHILE facing ${barrierFactors.join(', ')} is extraordinary. Admissions officers at the most selective schools will absolutely notice this.\n\n`;

        rationale += `💪 WHAT MAKES YOUR STORY TRANSCENDENT\n\n`;
        rationale += `Most students with your academic credentials didn't face what you faced. Most students who faced your barriers didn't achieve what you achieved. You did both. That's what makes this exceptional.\n\n`;

        rationale += `📝 ESSAY WRITING TIP FOR THIS LEVEL\n\n`;
        rationale += `At your achievement level, admissions officers know you're capable. What they want to understand is WHO you are beyond the achievements. Show specific moments of growth, what failure taught you, and how reflection changed your perspective. Don't write a resume - write a window into your growth as a person.\n\n`;

        rationale += `⚠️ IMPORTANT NOTE\n\n`;
        rationale += `This score reflects extraordinary strength in this essay dimension. However, college admissions is holistic - they'll evaluate your entire application. Being competitive for these schools doesn't guarantee admission (they admit only 3-6% of applicants), but it does mean you belong in the conversation.`;

      } else if (fitScore >= 90) {
        rationale += `📍 WHERE YOU STAND RIGHT NOW\n\n`;
        rationale += `You're competitive for top-tier schools like UC Berkeley, UCLA, Northwestern, Duke, and Cornell. Your profile (${achievementFactors[0]} while facing ${barrierFactors.join(', ')}) shows both academic excellence and resilience. These are incredibly selective schools (10-15% acceptance rates), and you're in the range they're looking for.\n\n`;

        rationale += `🎓 YOUR PATH TO THE HIGHEST TIER (100-110)\n\n`;
        rationale += `You're 6-15 points away from Harvard, Yale, Princeton, Stanford, and MIT level. To bridge that gap:\n`;
        rationale += `• Push from ${courseRigor} to 12+ APs with all 5s (not mostly 5s - ALL 5s)\n`;
        rationale += `• Maintain ${academic?.gpa?.toFixed(2) || 'strong'} GPA → aim for 4.0\n`;
        rationale += `• Add transcendent achievement: published research, Intel/Regeneron finalist, OR founded organization with significant impact (100+ people served)\n\n`;
        rationale += `This is a high bar - only 3-5% reach it. But knowing what it takes helps you decide if pushing for that level aligns with your goals.\n\n`;

        rationale += `💪 WHAT MAKES YOUR STORY STRONG\n\n`;
        rationale += `You balanced ${barrierFactors.join(', ')} with exceptional academic performance (${achievementFactors[0]}). That resilience plus achievement combination is exactly what schools like UCLA and Berkeley are looking for.\n\n`;

        rationale += `📝 ESSAY WRITING TIP\n\n`;
        rationale += `Your sweet spot is showing HOW the barriers shaped WHO you are. Make them understand why your experience makes you a better student, not just a sympathetic candidate. Focus on transformation and specific moments of growth.`;

      } else if (fitScore >= 80) {
        rationale += `📍 WHERE YOU STAND RIGHT NOW\n\n`;
        rationale += `You're competitive for excellent schools like ${placementBand}. Your story (${achievementFactors[0]} while facing ${barrierFactors.join(', ')}) shows solid academic achievement. These schools have 20-30% acceptance rates, and you're building a profile that fits what they're looking for.\n\n`;

        rationale += `🎓 YOUR PATH TO TOP-TIER SCHOOLS (90-99: Berkeley, UCLA, Duke)\n\n`;
        rationale += `You're 10-20 points away from UC Berkeley, UCLA, and Duke. Here's your roadmap:\n`;
        if (achievementLevel === 'Strong') {
          rationale += `• Increase rigor: Push from ${courseRigor} to 10+ AP courses\n`;
          rationale += `• Raise GPA: Move from ${academic?.gpa?.toFixed(2) || '3.7'} to 3.9+\n`;
        } else {
          rationale += `• Increase rigor: Add more AP courses and aim for stronger exam scores\n`;
        }
        rationale += `• Add significant achievement: Research project, founded organization, or leadership with measurable impact\n\n`;
        rationale += `Pick ONE of these paths and go deep. Two of these and you're very competitive for top-tier schools.\n\n`;

        rationale += `💪 WHAT MAKES YOUR STORY SOLID\n\n`;
        rationale += `${barrierFactors[0].charAt(0).toUpperCase() + barrierFactors[0].slice(1)} means you navigated challenges many students don't face. You still achieved ${achievementFactors[0]}. That initiative matters. For your essay, lean into specific moments where you had to figure things out and what that taught you.`;

      } else if (fitScore >= 70) {
        rationale += `📍 WHERE YOU STAND RIGHT NOW\n\n`;
        rationale += `You're competitive for strong universities like ${placementBand}. Your profile (${barrierFactors.join(', ')}, achieving ${achievementFactors[0]}) shows resilience and solid academic performance. These schools have 30-50% acceptance rates, and your story fits well here.\n\n`;

        rationale += `🎓 YOUR PATH TO VERY COMPETITIVE LEVEL (80-89: UC San Diego, Michigan, UNC)\n\n`;
        rationale += `You're 6-15 points away from schools like UC San Diego, Michigan, and UNC. Your roadmap:\n`;
        rationale += `• Academic rigor: Push from ${courseRigor} to ${courseRigor + 2}-${courseRigor + 3} AP courses\n`;
        rationale += `• GPA boost: Move to 3.9+ if possible\n`;
        rationale += `• Add achievement: Research project, leadership role, or found an initiative that helps others\n\n`;
        rationale += `Pick ONE of these and execute it well over the next year. That gets you into the 80-89 range.\n\n`;

        rationale += `💪 WHAT MAKES YOUR STORY GOOD\n\n`;
        rationale += `You're balancing ${barrierFactors.join(', ')} while ${achievementFactors[0]}. For your essay, show specific moments of growth. What did you sacrifice? What did challenges teach you? How are you different now?`;

      } else if (fitScore >= 60) {
        rationale += `📍 WHERE YOU STAND\n\n`;
        rationale += `Your profile (${barrierFactors.join(', ')}, ${achievementFactors[0]}) shows you're pushing yourself. Right now, you're in range for schools like UC Riverside, UC Merced, UC Santa Cruz, and solid state universities.\n\n`;

        rationale += `🎓 YOUR PATH TO COMPETITIVE LEVEL (70-79: UC Davis, UC Irvine, Boston U)\n\n`;
        rationale += `You're 6-15 points away from UC Davis and UC Irvine. Your action plan:\n`;
        rationale += `• Increase rigor: Push to 9-10 AP courses\n`;
        rationale += `• Boost GPA: Work toward 3.8-3.85\n`;
        rationale += `• Add one significant achievement: Research, leadership, or founded initiative\n\n`;
        rationale += `Pick ONE thing and go deep with it. That moves you up.\n\n`;

        rationale += `💪 WHAT YOU'RE DOING RIGHT\n\n`;
        rationale += `You're ${barrierFactors[0]} and you're taking rigorous courses. That takes initiative. For your essay, focus on specific moments where you had to figure things out on your own and what that taught you about yourself.`;

      } else {
        rationale += `📍 WHERE YOU ARE\n\n`;
        rationale += `Your current profile needs strengthening in academic rigor to be competitive for selective universities. Let's be direct: this component needs development, but knowing where you stand means you can make a plan.\n\n`;

        rationale += `🎓 YOUR ROADMAP TO GET COMPETITIVE (70+)\n\n`;
        rationale += `To reach 70-79 range (UC Davis, UC Irvine, Boston University):\n`;
        rationale += `• Academic rigor: Add AP/Honors courses (target 6-8 by senior year)\n`;
        rationale += `• GPA: Focus on raising to 3.5+ (get tutoring, office hours, study groups)\n`;
        rationale += `• Achievement: Join a club, take on leadership, or start a project with measurable impact\n\n`;

        rationale += `Focus on steady improvement and building a strong foundation now.`;
      }

      recommendations.push({
        prompt_number: 4,
        prompt_text: 'Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced.',
        fit_score: fitScore,
        base_score: barrierSeverityBase,
        context_adjustment: contextAdjustment,
        score_breakdown: {
          base: 0, // For PIQ 4, we show barriers as part of adjustments, not separate base
          adjustments: adjustments,
          final: fitScore
        },
        rationale: rationale,
        story_suggestions: [...barriers, ...opportunities, ...opportunityFactors],
        dimension_alignment: ['context_circumstances', 'vulnerability_authenticity', 'transformative_impact', 'reflection_insight', 'initiative_leadership']
      });
    }
  }

  // PIQ 5: Challenge - ENHANCED ANALYSIS WITH TRANSPARENT SCORING
  if (!alreadyWritten.includes(5)) {
    // Challenge can overlap with PIQ 4 but focuses more on personal transformation
    const personalChallenges = meaningfulExperiences.filter((e: any) =>
      (e.type || '').toLowerCase().includes('challenge') ||
      (e.description || '').toLowerCase().includes('overcame') ||
      (e.description || '').toLowerCase().includes('struggled')
    );

    if (hasChallenges || contextDepth >= 30 || personalChallenges.length > 0) {
      // Base score: challenges exist
      const baseScore = 75;

      // Build adjustments array dynamically
      const adjustments: Array<{ reason: string; points: number }> = [];

      if (contextDepth >= 50) {
        adjustments.push({ reason: `Deep context with significant challenges (${contextDepth}/100)`, points: 15 });
      }
      if (personalChallenges.length > 0) {
        adjustments.push({ reason: `Documented transformation/growth experiences (${personalChallenges.length} stories)`, points: 10 });
      }

      // Calculate final score
      const contextAdjustment = adjustments.reduce((sum, adj) => sum + adj.points, 0);
      const fitScore = Math.min(baseScore + contextAdjustment, 96);

      recommendations.push({
        prompt_number: 5,
        prompt_text: 'Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement?',
        fit_score: fitScore,
        base_score: baseScore,
        context_adjustment: contextAdjustment,
        score_breakdown: {
          base: baseScore,
          adjustments: adjustments,
          final: fitScore
        },
        rationale: contextDepth >= 50 ?
          'You have significant challenges that shaped your journey. This prompt lets you show resilience and growth.' :
          'You have challenges to discuss. Focus on transformation and impact on academics.',
        story_suggestions: [
          ...familyResponsibilities.map((r: any) => typeof r === 'string' ? r : r.type).filter(Boolean),
          ...personalChallenges.map((c: any) => c.description || c.name).filter(Boolean),
          ...(family?.circumstances as any[] || [])
        ].slice(0, 4),
        dimension_alignment: ['vulnerability_authenticity', 'context_circumstances', 'narrative_arc_stakes', 'transformative_impact', 'reflection_insight']
      });
    }
  }

  // PIQ 6: Academic Passion - STRICT 110-POINT TIERED SCORING
  if (!alreadyWritten.includes(6)) {
    if (intendedMajor || hasAcademicDepth) {
      // STEP 1: Determine Academic Passion Tier (base score)
      let academicBase = 0;
      let academicTier = '';

      // Check for research/academic activities
      const allActivitiesForPIQ6 = [
        ...(activities?.extracurriculars || []),
        ...(activities?.personal_projects as any[] || []),
        ...workExperiences
      ];

      const relatedActivities = (intendedMajor && typeof intendedMajor === 'string') ?
        allActivitiesForPIQ6.filter((a: any) => {
          const majorKeyword = intendedMajor.toLowerCase().split(' ')[0];
          const activityText = `${a.name || ''} ${a.description || ''} ${a.category || ''}`.toLowerCase();
          return activityText.includes(majorKeyword) ||
                 activityText.includes('research') ||
                 (a.category === 'academic' && activityText.length > 50);
        }) : [];

      const hasPublication = relatedActivities.some((a: any) => {
        const text = `${a.name || ''} ${a.description || ''}`.toLowerCase();
        return text.includes('published') || text.includes('publication') || text.includes('journal');
      });

      const hasResearch = relatedActivities.some((a: any) => {
        const text = `${a.name || ''} ${a.description || ''}`.toLowerCase();
        return text.includes('research');
      });

      const hasCompetition = relatedActivities.some((a: any) => {
        const text = `${a.name || ''} ${a.description || ''}`.toLowerCase();
        return text.includes('competition') || text.includes('olympiad') || text.includes('contest');
      });

      const hasSignificantEC = relatedActivities.some((a: any) => {
        const hours = a.hours_per_week || 0;
        return hours >= 8 || (a.description || '').length > 100;
      });

      // Tier logic (110-point scale)
      if (courseRigor >= 12 && hasPublication && hasResearch) {
        academicBase = 60; // Research + competition/publication
        academicTier = 'Research-driven (12+ AP/IB + published research)';
      } else if (courseRigor >= 10 && (hasResearch || hasCompetition) && hasSignificantEC) {
        academicBase = 52; // Strong rigor + achievement
        academicTier = 'Strong rigor + achievement (10+ AP/IB + significant EC)';
      } else if (courseRigor >= 8 && hasSignificantEC) {
        academicBase = 42; // Good rigor + alignment
        academicTier = 'Good rigor + alignment (8+ AP/IB + subject EC)';
      } else if (courseRigor >= 6 && intendedMajor) {
        academicBase = 32; // Adequate rigor
        academicTier = 'Adequate rigor (6+ AP/IB + major declared)';
      } else {
        academicBase = 28; // Basic interest
        academicTier = 'Basic interest (some rigor)';
      }

      // STEP 2: Achievement Bonuses (unlimited)
      const adjustments: Array<{ reason: string; points: number }> = [];

      adjustments.push({
        reason: `Academic Passion Level - ${academicTier}`,
        points: academicBase
      });

      // Published research (HUGE bonus for elite schools)
      if (hasPublication && hasResearch) {
        const pubActivity = relatedActivities.find((a: any) => {
          const text = `${a.name || ''} ${a.description || ''}`.toLowerCase();
          return text.includes('published');
        });
        if (pubActivity && (pubActivity.description || '').length > 150) {
          adjustments.push({ reason: 'Published research with detailed documentation (journal/conference)', points: 35 });
        } else {
          adjustments.push({ reason: 'Published research', points: 28 });
        }
      }

      // National/state academic competition
      if (hasCompetition) {
        const compActivity = relatedActivities.find((a: any) => {
          const text = `${a.name || ''} ${a.description || ''}`.toLowerCase();
          return text.includes('competition') || text.includes('olympiad');
        });
        const compText = `${compActivity?.name || ''} ${compActivity?.description || ''}`.toLowerCase();
        if (compText.includes('national') || compText.includes('international')) {
          adjustments.push({ reason: 'National/international academic competition', points: 22 });
        } else if (compText.includes('state') || compText.includes('regional')) {
          adjustments.push({ reason: 'State/regional academic competition', points: 18 });
        } else {
          adjustments.push({ reason: 'Academic competition participation', points: 12 });
        }
      }

      // Significant research (not published but substantive)
      if (hasResearch && !hasPublication) {
        const researchActivity = relatedActivities.find((a: any) => {
          const text = `${a.name || ''} ${a.description || ''}`.toLowerCase();
          return text.includes('research');
        });
        const hours = researchActivity?.hours_per_week || 0;
        if (hours >= 10 && (researchActivity?.description || '').length > 150) {
          adjustments.push({ reason: 'Significant research project (10+ hrs/week, detailed documentation)', points: 24 });
        } else if ((researchActivity?.description || '').length > 100) {
          adjustments.push({ reason: 'Research project with documentation', points: 18 });
        }
      }

      // High AP/IB scores in subject area
      const relatedCourses = (intendedMajor && typeof intendedMajor === 'string') ?
        (academic?.course_history as any[] || []).filter((c: any) => {
          const majorKeyword = intendedMajor.toLowerCase().split(' ')[0];
          return (c.name || '').toLowerCase().includes(majorKeyword);
        }) : [];

      const highScoresInSubject = relatedCourses.filter((c: any) => {
        const score = c.ap_score || c.score || 0;
        return score >= 4;
      }).length;

      if (highScoresInSubject >= 3) {
        adjustments.push({ reason: `High performance in ${intendedMajor} courses (${highScoresInSubject} AP 4+ scores)`, points: 12 });
      } else if (highScoresInSubject >= 1) {
        adjustments.push({ reason: `Strong performance in ${intendedMajor} courses`, points: 8 });
      }

      // Deep EC alignment with intended major
      const deepECAlignment = relatedActivities.filter((a: any) => {
        const hours = a.hours_per_week || 0;
        const duration = a.years_participated || a.months_duration || 0;
        return hours >= 8 && duration >= 1;
      });

      if (deepECAlignment.length >= 2) {
        adjustments.push({ reason: `${deepECAlignment.length} deep extracurriculars aligned with ${intendedMajor} (8+ hrs/week each)`, points: 15 });
      } else if (deepECAlignment.length === 1) {
        adjustments.push({ reason: `Deep extracurricular aligned with ${intendedMajor} (8+ hrs/week)`, points: 10 });
      } else if (relatedActivities.length > 0) {
        adjustments.push({ reason: `Related extracurricular engagement (${relatedActivities.length} activities)`, points: 5 });
      }

      // STEP 3: Context Bonus (MAX +15 for academic passion)
      let contextBonus = 0;
      const contextFactors: string[] = [];

      // Self-taught (taught yourself advanced concepts)
      const selfTaught = relatedActivities.some((a: any) => {
        const text = `${a.name || ''} ${a.description || ''}`.toLowerCase();
        return text.includes('self-taught') || text.includes('taught myself') || text.includes('independent study');
      });

      if (selfTaught) {
        contextBonus += 8;
        contextFactors.push('self-taught advanced concepts');
      }

      // Under-resourced school (pursuing passion despite limited resources)
      const currentSchool = context.academic?.current_school as Record<string, any> | undefined;
      const limitedResources = currentSchool?.school_type === 'under-resourced' ||
                              context.profile.constraints.needsFinancialAid === true;
      if (limitedResources && courseRigor >= 8) {
        contextBonus += 7;
        contextFactors.push('pursued rigor at under-resourced school');
      }

      if (contextBonus > 0) {
        adjustments.push({
          reason: `Context: ${contextFactors.join(', ')}`,
          points: Math.min(contextBonus, 15)
        });
      }

      // Calculate final score (110-point scale)
      const baseScore = academicBase;
      const achievementBonuses = adjustments.slice(1).reduce((sum, adj) => sum + adj.points, 0);
      const contextAdjustment = achievementBonuses;
      const fitScore = Math.min(baseScore + contextAdjustment, 110); // Cap at 110

      // Build engaging rationale based on score (110-point scale)
      let rationale = `🎯 YOUR SCORE: ${fitScore}/110 - ${academicTier}\n\n`;

      // Add achievement summary
      const achievementFactors: string[] = [];
      if (hasPublication) {
        achievementFactors.push('published research');
      } else if (hasResearch) {
        achievementFactors.push('research project');
      }
      if (hasCompetition) {
        achievementFactors.push('academic competition');
      }
      if (courseRigor >= 10) {
        achievementFactors.push(`${courseRigor} AP/IB courses`);
      }
      if (deepECAlignment.length > 0) {
        achievementFactors.push(`${deepECAlignment.length} deep EC(s) in ${intendedMajor}`);
      }

      // Score-band specific rationale with emoji sections
      if (fitScore >= 100) {
        // 100-110: Elite Competitive (Harvard, Yale, Princeton, Stanford, MIT)
        const placementBand = 'Harvard, Yale, Princeton, Stanford, MIT, Columbia, Caltech';

        rationale += `📍 WHERE YOU STAND RIGHT NOW\n\n`;
        rationale += `Your academic passion for ${intendedMajor || 'your subject'} places you in the top 3-5% nationally. Schools like ${placementBand} look for students who go beyond coursework into real research and intellectual contribution. You've demonstrated ${achievementFactors.join(', ')}.\n\n`;

        rationale += `📝 HOW TO WRITE YOUR ESSAY\n\n`;
        rationale += `Don't just describe your research or achievements. Show your intellectual journey:\n`;
        rationale += `• What question sparked your curiosity? What moment made you fall in love with this subject?\n`;
        rationale += `• What failed experiments or wrong turns taught you something important?\n`;
        rationale += `• How did your thinking evolve? What do you understand now that you didn't before?\n`;
        rationale += `• What's the ONE idea or insight that excites you most about ${intendedMajor || 'this field'}?\n\n`;

        rationale += `Your credentials are impressive—now show the curiosity and intellectual vitality that drives you.\n\n`;

        rationale += `⚠️ IMPORTANT DISCLAIMER\n\n`;
        rationale += `This score reflects strength in your academic passion dimension. Actual admissions at these schools (3-6% acceptance rates) depend on your entire application: GPA, test scores, all essays, letters of recommendation, and holistic review.`;

      } else if (fitScore >= 90) {
        // 90-99: Highly Competitive (Berkeley, UCLA, Northwestern, Duke)
        const placementBand = 'UC Berkeley, UCLA, Northwestern, Duke, Cornell, USC, Carnegie Mellon';

        rationale += `📍 WHERE YOU STAND RIGHT NOW\n\n`;
        rationale += `Your academic passion for ${intendedMajor || 'your subject'} is excellent. Schools like ${placementBand} actively seek students with your depth (${achievementFactors.join(', ')}). You're competitive for top-tier universities (10-15% acceptance rates).\n\n`;

        rationale += `🎓 YOUR PATH TO ELITE LEVEL (100-110: Harvard, Yale, Princeton, Stanford, MIT)\n\n`;
        rationale += `You're ${100 - fitScore}-${110 - fitScore} points away from elite competitive level. Your roadmap:\n`;
        rationale += `• Research: Publish your work in a journal or present at a conference\n`;
        rationale += `• Competition: Compete at national level (USABO, USACO, Physics Olympiad, etc.)\n`;
        rationale += `• Scale: Turn your research into something that helps others or advances the field\n`;
        rationale += `• Rigor: Push to 12+ AP/IB courses if you're not there already\n\n`;
        rationale += `Pick ONE of these and go deep over the next 6-12 months.\n\n`;

        rationale += `💪 WHAT MAKES YOUR PASSION STRONG\n\n`;
        rationale += `You've demonstrated ${achievementFactors.join(', ')}. For your essay, show your intellectual curiosity—the moment you got hooked, a question you're still chasing, or how you think differently about ${intendedMajor || 'this subject'} than you did a year ago.`;

      } else if (fitScore >= 80) {
        // 80-89: Very Competitive (UCSD, Michigan, UNC)
        const placementBand = 'UC San Diego, UC Santa Barbara, UC Irvine, Michigan, UNC, UT Austin, NYU';

        rationale += `📍 WHERE YOU STAND RIGHT NOW\n\n`;
        rationale += `Your academic interests in ${intendedMajor || 'your subject'} show strong potential. You're competitive for schools like ${placementBand}. These are excellent universities (15-30% acceptance rates) where your profile (${achievementFactors.length > 0 ? achievementFactors.join(', ') : `${courseRigor} AP/IB courses`}) fits well.\n\n`;

        rationale += `🎓 YOUR PATH TO HIGHLY COMPETITIVE LEVEL (90-99: Berkeley, UCLA, Duke)\n\n`;
        rationale += `You're ${90 - fitScore}-${99 - fitScore} points away from highly competitive level. To strengthen:\n`;
        rationale += `• Research: Start a research project (reach out to professors, design your own experiment, or analyze data)\n`;
        rationale += `• Competition: Enter academic competitions in ${intendedMajor || 'your field'} (USACO, Math Olympiad, Science Olympiad)\n`;
        rationale += `• Depth: Add a deep extracurricular (8+ hrs/week) aligned with ${intendedMajor || 'your passion'}\n`;
        rationale += `• Performance: Get high scores (4-5) on APs related to ${intendedMajor || 'your subject'}\n\n`;

        rationale += `💪 WHAT MAKES YOUR PASSION GOOD\n\n`;
        rationale += `You've taken ${courseRigor} AP/IB courses and ${relatedActivities.length > 0 ? `engaged in ${relatedActivities.length} related activities` : 'declared interest in ' + (intendedMajor || 'a field')}. For your essay, pick one moment where you learned something surprising or changed how you think about ${intendedMajor || 'this subject'}.`;

      } else if (fitScore >= 70) {
        // 70-79: Competitive (UC Davis, BU, Wisconsin)
        const placementBand = 'UC Davis, UC Irvine, Boston University, Wisconsin, UIUC';

        rationale += `📍 WHERE YOU STAND RIGHT NOW\n\n`;
        rationale += `You're competitive for universities like ${placementBand}. Your academic profile (${courseRigor} AP/IB courses${intendedMajor ? `, interested in ${intendedMajor}` : ''}) shows you're taking rigorous courses. These schools (30-50% acceptance rates) value students with your foundation.\n\n`;

        rationale += `🎓 YOUR PATH TO VERY COMPETITIVE LEVEL (80-89: UC San Diego, Michigan, UNC)\n\n`;
        rationale += `You're ${80 - fitScore}-${89 - fitScore} points away from very competitive level. Your action plan:\n`;
        rationale += `• Add depth outside class: Join a club, start a project, or find an internship related to ${intendedMajor || 'a field you care about'}\n`;
        rationale += `• Increase rigor: Push to 10+ AP/IB courses\n`;
        rationale += `• Show passion with time: Spend 8+ hrs/week on something academic (research, tutoring, coding, writing)\n`;
        rationale += `• Connect courses to interest: Take APs related to ${intendedMajor || 'what you want to study'} and get 4-5 scores\n\n`;

        rationale += `Pick 2-3 of these and focus on them for the next year.\n\n`;

        rationale += `💪 YOUR ESSAY APPROACH\n\n`;
        rationale += `Focus on one subject that genuinely excites you. Show a specific moment—reading a book that changed your thinking, solving a hard problem, or asking a question that led you down a rabbit hole. Curiosity matters more than credentials.`;

      } else if (fitScore >= 60) {
        // 60-69: Developing
        rationale += `📍 WHERE YOU STAND RIGHT NOW\n\n`;
        rationale += `You have ${courseRigor} AP/IB courses${intendedMajor ? ` and interest in ${intendedMajor}` : ''}. This shows you're taking on some rigor, but your academic passion profile needs strengthening to be competitive for selective universities.\n\n`;

        rationale += `🎓 YOUR PATH TO COMPETITIVE LEVEL (70-79: UC Davis, BU, Wisconsin)\n\n`;
        rationale += `To reach competitive level (${70 - fitScore}-${79 - fitScore} points higher), you need to show deeper engagement:\n\n`;

        rationale += `**1. Build Outside-Classroom Engagement (Most Important)**\n`;
        rationale += `• Join a club related to what you want to study (Coding Club, Debate, Science Olympiad)\n`;
        rationale += `• Start a personal project (build something, research something, create something)\n`;
        rationale += `• Find an internship or shadowing opportunity in ${intendedMajor || 'a field you care about'}\n`;
        rationale += `• Spend 6-8 hrs/week minimum on academic interests outside class\n\n`;

        rationale += `**2. Increase Academic Rigor**\n`;
        rationale += `• Push to 8-10 AP/IB courses by senior year\n`;
        rationale += `• Take APs related to ${intendedMajor || 'your intended major'}\n`;
        rationale += `• Aim for scores of 4-5\n\n`;

        rationale += `**3. Define Your Passion**\n`;
        rationale += `• Identify ONE subject you actually care about (not just good at)\n`;
        rationale += `• Read beyond textbooks—articles, books, online courses\n`;
        rationale += `• Talk to teachers or professionals in that field\n\n`;

        rationale += `Pick 1-2 of these and go deep. Better to be genuinely passionate about one thing than superficially interested in many.`;

      } else {
        // <60: Needs Growth
        rationale += `📍 HONEST ASSESSMENT\n\n`;
        rationale += `Your current academic profile (${courseRigor} AP/IB courses) needs significant strengthening to be competitive for selective universities. Academic passion isn't just about taking hard classes—it's about pursuing interests deeply both inside and outside the classroom.\n\n`;

        rationale += `🎓 HOW TO BUILD REAL ACADEMIC PASSION (Target: 70+ to be competitive)\n\n`;
        rationale += `You need to add ${70 - fitScore}+ points. Here's how:\n\n`;

        rationale += `**1. Increase Course Rigor (Essential)**\n`;
        rationale += `• Target 8-10 AP/IB courses by graduation\n`;
        rationale += `• Focus on subjects related to what you want to study\n`;
        rationale += `• Study for high scores (4-5 on AP exams)\n\n`;

        rationale += `**2. Find ONE Subject You Care About**\n`;
        rationale += `• Not just what you're good at—what makes you curious?\n`;
        rationale += `• What would you read about or work on even if it wasn't for a grade?\n`;
        rationale += `• Declare an intended major if you haven't already\n\n`;

        rationale += `**3. Pursue It Outside Class (Required)**\n`;
        rationale += `• Join or start a club related to your interest\n`;
        rationale += `• Do a personal project (research, build something, create content)\n`;
        rationale += `• Enter a competition (Science Fair, Coding Competition, Essay Contest)\n`;
        rationale += `• Find a mentor—teacher, professor, or professional\n`;
        rationale += `• Commit 6-10 hrs/week minimum\n\n`;

        rationale += `**4. Document Your Journey**\n`;
        rationale += `• Write down what you learn and discover\n`;
        rationale += `• Track hours, projects, accomplishments\n`;
        rationale += `• Save work samples, reflections, insights\n\n`;

        rationale += `Focus on ONE field and go deep. Admissions officers can tell the difference between genuine passion and resume-building.`;
      }

      recommendations.push({
        prompt_number: 6,
        prompt_text: 'Think about an academic subject that inspires you. Describe how you have furthered this interest inside and/or outside of the classroom.',
        fit_score: fitScore,
        base_score: baseScore,
        context_adjustment: contextAdjustment,
        score_breakdown: {
          base: 0, // Show tiers in adjustments
          adjustments: adjustments,
          final: fitScore
        },
        rationale: rationale,
        story_suggestions: intendedMajor ?
          [`Deep dive into ${intendedMajor}`, ...relatedActivities.map((a: any) => a.name).slice(0, 2), ...relatedCourses.map((c: any) => c.name).slice(0, 2)].filter(Boolean) :
          ['Identify your academic passion first'],
        dimension_alignment: ['reflection_insight', 'fit_trajectory', 'specificity_evidence', 'intellectual_vitality']
      });
    }
  }

  // PIQ 7: Community - ENHANCED WITH TRANSPARENT SCORING
  if (!alreadyWritten.includes(7)) {
    if (hasMeaningfulService || hasSubstantiveLeadership) {
      const topService = [...volunteerService, ...allLeadership].sort((a: any, b: any) => {
        const aImpact = (a.impact || '').length;
        const bImpact = (b.impact || '').length;
        return bImpact - aImpact;
      })[0];

      // Base score: community involvement exists
      const baseScore = 75;

      // Build adjustments array dynamically
      const adjustments: Array<{ reason: string; points: number }> = [];

      if (hasMeaningfulService) {
        adjustments.push({ reason: `Substantial community service (100+ total hours or significant impact)`, points: 12 });
      }
      if ((topService?.impact || '').length > 150) {
        adjustments.push({ reason: `Detailed documentation of community impact (${(topService?.impact || '').length} characters)`, points: 8 });
      }

      // Calculate final score
      const contextAdjustment = adjustments.reduce((sum, adj) => sum + adj.points, 0);
      const fitScore = Math.min(baseScore + contextAdjustment, 94);

      recommendations.push({
        prompt_number: 7,
        prompt_text: 'What have you done to make your school or your community a better place?',
        fit_score: fitScore,
        base_score: baseScore,
        context_adjustment: contextAdjustment,
        score_breakdown: {
          base: baseScore,
          adjustments: adjustments,
          final: fitScore
        },
        rationale: hasMeaningfulService ?
          `You have substantial community service. Focus on tangible impact on your community.` :
          `Your leadership roles likely benefited your community. Highlight the community impact.`,
        story_suggestions: [
          ...volunteerService.map((v: any) => v.name).filter(Boolean),
          ...allLeadership.filter((l: any) => (l.impact || '').includes('community')).map((l: any) => l.name)
        ].slice(0, 4),
        dimension_alignment: ['initiative_leadership', 'transformative_impact', 'specificity_evidence', 'reflection_insight']
      });
    }
  }

  // PIQ 8: Open-ended - ALWAYS RECOMMEND (universal fit) WITH TRANSPARENT SCORING
  if (!alreadyWritten.includes(8)) {
    // Base score: universal prompt, works for everyone
    const baseScore = 78;

    // Build adjustments array dynamically
    const adjustments: Array<{ reason: string; points: number }> = [];

    if (hasIdentityStory) {
      adjustments.push({ reason: `Documented meaningful experiences shaping identity (${meaningfulExperiences.length} stories)`, points: 12 });
    }
    if (isImmigrant || contextDepth >= 40) {
      adjustments.push({ reason: `Rich identity story potential (immigrant or high context depth)`, points: 8 });
    }

    // Calculate final score
    const contextAdjustment = adjustments.reduce((sum, adj) => sum + adj.points, 0);
    const fitScore = Math.min(baseScore + contextAdjustment, 95);

    recommendations.push({
      prompt_number: 8,
      prompt_text: 'Beyond what has already been shared in your application, what do you believe makes you a strong candidate for admissions to the University of California?',
      fit_score: fitScore,
      base_score: baseScore,
      context_adjustment: contextAdjustment,
      score_breakdown: {
        base: baseScore,
        adjustments: adjustments,
        final: fitScore
      },
      rationale: hasIdentityStory ?
        'You have meaningful experiences that shaped your identity. This open-ended prompt lets you tell your unique story.' :
        'This flexible prompt works for any compelling story not covered in other PIQs.',
      story_suggestions: meaningfulExperiences.length > 0 ?
        meaningfulExperiences.map((e: any) => e.name || e.description).filter(Boolean).slice(0, 3) :
        ['Consider what makes you uniquely you', 'What haven\'t other PIQs captured?'],
      dimension_alignment: ['identity_self_discovery', 'reflection_insight', 'voice_integrity', 'vulnerability_authenticity']
    });
  }

  // Sort by fit score (descending)
  recommendations.sort((a, b) => b.fit_score - a.fit_score);

  return {
    recommendations: recommendations.slice(0, 6), // Return top 6 instead of 5
    avoid
  };
}

/**
 * Tool 11: get_better_stories
 * Suggest alternative stories from student's experiences
 * ENHANCED: Sophisticated scoring algorithm aligned with PIQ dimension weights
 */
export async function getBetterStories(input: z.infer<typeof GetBetterStoriesInputSchema>): Promise<BetterStoriesOutput> {
  const context = await getCompleteStudentContext(input.user_id);

  if (!context || !context.activities) {
    return {
      alternative_stories: [],
      current_story_issues: ['No activities found in profile']
    };
  }

  const activities = context.activities;
  const allActivities = [
    ...(activities.extracurriculars || []),
    ...(activities.work_experiences as any[] || []),
    ...(activities.volunteer_service as any[] || []),
    ...(activities.personal_projects as any[] || [])
  ];

  // Analyze current essay to understand what story they're telling
  const currentEssayText = input.current_essay_text.toLowerCase();
  const currentStoryIssues: string[] = [];

  // Detect if essay is generic/vague
  const isVague = currentEssayText.length < 200 ||
    (currentEssayText.match(/\b(I|my|me)\b/g) || []).length < 5 ||
    !currentEssayText.includes('i');

  if (isVague) {
    currentStoryIssues.push('Current essay appears generic or underdeveloped. Consider using a specific activity with concrete details.');
  }

  // Check if current story shows up in activities (claim validation)
  const activityNames = allActivities.map((a: any) => (a.name || '').toLowerCase());
  const mentionsActivity = activityNames.some(name =>
    name.length > 3 && currentEssayText.includes(name)
  );

  if (!mentionsActivity && currentEssayText.length > 100) {
    currentStoryIssues.push('Current essay topic doesn\'t match any activities in your profile. Using a documented activity adds credibility.');
  }

  // Sophisticated scoring based on PIQ type and dimension weights with transparent breakdown
  const scoredActivities = allActivities.map((activity: any) => {
    const baseScore = 40; // Base score for having an activity
    let score = baseScore;
    const reasons: string[] = [];
    const adjustments: Array<{ reason: string; points: number }> = [];

    // Universal quality indicators
    const hours = activity.hours_per_week || 0;
    const duration = activity.months_duration || activity.years_participated || 0;
    const hasImpact = (activity.impact || '').length > 50;
    const hasDetailedDescription = (activity.description || '').length > 100;
    const totalHourCommitment = hours * duration * 4; // Approximate total hours

    // Universal bonuses
    if (hasImpact) {
      score += 12;
      reasons.push('documented impact');
      adjustments.push({ reason: 'Documented impact (50+ characters)', points: 12 });
    }
    if (hasDetailedDescription) {
      score += 8;
      reasons.push('detailed description shows depth');
      adjustments.push({ reason: 'Detailed description (100+ characters)', points: 8 });
    }

    // PIQ-specific scoring algorithms
    switch (input.piq_prompt_number) {
      case 1: // Leadership (dimensions: initiative, role clarity, transformative impact)
        if (activity.leadership_role) {
          score += 25;
          reasons.push('formal leadership role');
          adjustments.push({ reason: 'Formal leadership role', points: 25 });
        }
        if (hours >= 8) {
          score += 10;
          reasons.push(`significant time commitment (${hours} hrs/week)`);
          adjustments.push({ reason: `High commitment (${hours} hrs/week)`, points: 10 });
        }
        if ((activity.impact || '').includes('led') || (activity.impact || '').includes('organized')) {
          score += 8;
          reasons.push('demonstrates initiative');
          adjustments.push({ reason: 'Demonstrates initiative (led/organized)', points: 8 });
        }
        break;

      case 2: // Creative (dimensions: craft, voice, specificity, reflection)
        const creativeTags = ['art', 'music', 'creative', 'design', 'writing', 'theater', 'dance', 'film'];
        const isCreative = creativeTags.some(tag =>
          (activity.name || '').toLowerCase().includes(tag) ||
          (activity.category || '').toLowerCase().includes(tag)
        );
        if (isCreative) {
          score += 30;
          reasons.push('creative/artistic activity');
          adjustments.push({ reason: 'Creative/artistic activity', points: 30 });
        }
        if (hours >= 10) {
          score += 12;
          reasons.push('deep creative practice');
          adjustments.push({ reason: `Deep creative practice (${hours} hrs/week)`, points: 12 });
        }
        break;

      case 3: // Talent/Skill (dimensions: specificity, transformative impact, reflection)
        if (totalHourCommitment >= 500) {
          score += 25;
          reasons.push(`${totalHourCommitment}+ total hours shows mastery`);
          adjustments.push({ reason: `Mastery-level commitment (${totalHourCommitment}+ hours)`, points: 25 });
        }
        if (hours >= 15) {
          score += 15;
          reasons.push('exceptional weekly commitment');
          adjustments.push({ reason: `Exceptional weekly commitment (${hours} hrs/week)`, points: 15 });
        }
        if (duration >= 24) { // 2+ years
          score += 10;
          reasons.push('sustained over years');
          adjustments.push({ reason: 'Sustained commitment (2+ years)', points: 10 });
        }
        break;

      case 4: // Educational Barrier (dimensions: context, vulnerability, transformative impact)
        // Work experience during school shows overcoming financial barriers
        if (activity.category === 'work' && hours >= 15) {
          score += 20;
          reasons.push('work experience shows overcoming barriers');
          adjustments.push({ reason: 'Work experience shows overcoming financial barriers', points: 20 });
        }
        // Activities despite challenges
        if (context.family?.challenging_circumstances && hours >= 8) {
          score += 15;
          reasons.push('maintained commitment despite challenges');
          adjustments.push({ reason: 'Maintained commitment despite challenging circumstances', points: 15 });
        }
        break;

      case 5: // Challenge (dimensions: vulnerability, context, narrative arc, transformation)
        // Look for activities tied to personal growth
        if ((activity.description || '').toLowerCase().includes('challenge') ||
            (activity.description || '').toLowerCase().includes('struggle') ||
            (activity.description || '').toLowerCase().includes('overcome')) {
          score += 20;
          reasons.push('tied to personal challenge');
          adjustments.push({ reason: 'Activity tied to personal challenge/growth', points: 20 });
        }
        if (context.family?.challenging_circumstances) {
          score += 12;
          reasons.push('shows resilience given context');
          adjustments.push({ reason: 'Shows resilience given challenging context', points: 12 });
        }
        break;

      case 6: // Academic Passion (dimensions: reflection, fit/trajectory, specificity)
        const intendedMajor = (context.goals?.intended_major || '').toLowerCase();
        const activityName = (activity.name || '').toLowerCase();
        const activityDesc = (activity.description || '').toLowerCase();

        // Check if activity relates to intended major (with safe string operations)
        if (intendedMajor && typeof intendedMajor === 'string' && intendedMajor.length > 0) {
          const majorKeyword = intendedMajor.toLowerCase().split(' ')[0];
          if (activityName.includes(majorKeyword) || activityDesc.includes(majorKeyword)) {
            score += 28;
            reasons.push(`directly relates to ${intendedMajor}`);
            adjustments.push({ reason: `Directly relates to intended major (${context.goals?.intended_major})`, points: 28 });
          }
        }

        // Academic-oriented activities
        const academicTags = ['research', 'science', 'math', 'engineering', 'coding', 'programming', 'academic'];
        if (academicTags.some(tag => activityName.includes(tag) || activityDesc.includes(tag))) {
          score += 18;
          reasons.push('academic/intellectual activity');
          adjustments.push({ reason: 'Academic/intellectual activity', points: 18 });
        }
        break;

      case 7: // Community (dimensions: initiative, transformative impact, specificity)
        if (activity.category === 'volunteer' || activity.category === 'service') {
          score += 25;
          reasons.push('community service activity');
          adjustments.push({ reason: 'Community service activity', points: 25 });
        }
        const totalServiceHours = activity.total_hours || (hours * duration * 4);
        if (totalServiceHours >= 100) {
          score += 15;
          reasons.push(`${totalServiceHours}+ service hours`);
          adjustments.push({ reason: `Significant service hours (${totalServiceHours}+)`, points: 15 });
        }
        if ((activity.impact || '').toLowerCase().includes('community') ||
            (activity.impact || '').toLowerCase().includes('helped')) {
          score += 10;
          reasons.push('clear community impact');
          adjustments.push({ reason: 'Clear documented community impact', points: 10 });
        }
        break;

      case 8: // Open-ended (dimensions: identity, reflection, voice, vulnerability)
        // Unique/unconventional activities stand out
        if ((activity.name || '').length > 0 && allActivities.filter((a: any) =>
            (a.category || '').toLowerCase() === (activity.category || '').toLowerCase()
          ).length <= 2) {
          score += 15;
          reasons.push('unique/uncommon activity');
          adjustments.push({ reason: 'Unique/uncommon activity (stands out)', points: 15 });
        }
        // Personal projects show initiative and identity
        if (activity.category === 'personal_project') {
          score += 18;
          reasons.push('personal project shows initiative and identity');
          adjustments.push({ reason: 'Personal project (shows initiative and identity)', points: 18 });
        }
        break;
    }

    // Penalize if activity is already mentioned in current essay
    const activityMentioned = (activity.name || '').toLowerCase().length > 3 &&
      currentEssayText.includes((activity.name || '').toLowerCase());
    if (activityMentioned) {
      score -= 30;
      reasons.push('(already in current essay)');
      adjustments.push({ reason: 'Already mentioned in current essay (penalty)', points: -30 });
    }

    return {
      activity,
      score,
      baseScore,
      adjustments,
      reasons
    };
  });

  // Sort by score and take top 5 (increased from 3)
  const topActivities = scoredActivities
    .filter(({ score }) => score >= 50) // Only recommend activities with decent fit
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (topActivities.length === 0) {
    return {
      alternative_stories: [],
      current_story_issues: [
        ...currentStoryIssues,
        'No strong alternative activities found. Your current story may be the best fit, or you need to add more activities to your profile.'
      ]
    };
  }

  const alternativeStories = topActivities.map(({ activity, score, baseScore, adjustments, reasons }) => {
    // Calculate estimated score improvement (0-20 points)
    const activityHasImpact = (activity.impact || '').length > 50;
    const currentEssayStrength = currentEssayText.length > 300 && activityHasImpact ? 70 : 50;
    const estimatedNewScore = Math.min(score + 20, 90); // Assume good execution
    const improvement = Math.max(0, Math.min(estimatedNewScore - currentEssayStrength, 20));

    // Calculate context adjustment from adjustments array
    const contextAdjustment = adjustments.reduce((sum, adj) => sum + adj.points, 0);

    return {
      activity_name: activity.name || 'Unnamed activity',
      activity_type: activity.category || 'extracurricular',
      fit_score: score,
      base_score: baseScore,
      context_adjustment: contextAdjustment,
      score_breakdown: {
        base: baseScore,
        adjustments: adjustments,
        final: score
      },
      why_better: `Fit score: ${score}/100. ${reasons.filter(r => !r.includes('already')).join('; ')}. This story aligns better with PIQ ${input.piq_prompt_number}'s key dimensions.`,
      dimension_strengths: getDimensionStrengthsForActivity(activity, input.piq_prompt_number),
      estimated_score_improvement: improvement
    };
  });

  return {
    alternative_stories: alternativeStories,
    current_story_issues: currentStoryIssues.length > 0 ? currentStoryIssues : [
      'Current story may work, but consider if these alternatives offer stronger material'
    ]
  };
}

/**
 * Tool 10: analyze_portfolio_balance
 * Evaluate if chosen PIQ essays create a well-rounded application
 * ENHANCED: Strategic admissions counselor-level portfolio analysis
 */
export async function analyzePortfolioBalance(input: z.infer<typeof AnalyzePortfolioBalanceInputSchema>) {
  const context = await getCompleteStudentContext(input.user_id);

  if (!context) {
    throw new Error(`User ${input.user_id} not found`);
  }

  // Validate PIQ count (must be exactly 4 for UC)
  if (input.piq_numbers.length !== 4) {
    return {
      is_well_rounded: false,
      dimension_coverage: {},
      gaps: [`UC requires exactly 4 PIQs. You selected ${input.piq_numbers.length}.`],
      overlaps: [],
      suggestions: ['Select exactly 4 PIQ prompts for UC applications'],
      balance_score: 0
    };
  }

  // Enhanced PIQ dimension mapping with weighted emphasis
  const piqDimensionProfiles: Record<number, Record<string, number>> = {
    1: { initiative_leadership: 10, role_clarity_ownership: 9, transformative_impact: 8, specificity_evidence: 7 },
    2: { craft_language_quality: 13, voice_integrity: 9, specificity_evidence: 8, reflection_insight: 6 },
    3: { specificity_evidence: 11, transformative_impact: 9, reflection_insight: 8, narrative_arc_stakes: 7 },
    4: { context_circumstances: 14, vulnerability_authenticity: 13, transformative_impact: 9, reflection_insight: 7, initiative_leadership: 6 },
    5: { vulnerability_authenticity: 15, context_circumstances: 14, narrative_arc_stakes: 11, transformative_impact: 10, reflection_insight: 8 },
    6: { reflection_insight: 11, fit_trajectory: 10, specificity_evidence: 9, voice_integrity: 6 },
    7: { initiative_leadership: 10, transformative_impact: 10, specificity_evidence: 9, reflection_insight: 6 },
    8: { identity_self_discovery: 12, reflection_insight: 9, voice_integrity: 8, vulnerability_authenticity: 7 }
  };

  // Calculate weighted dimension coverage
  const dimensionCounts: Record<string, number> = {};
  const dimensionWeightedScores: Record<string, number> = {};

  for (const piqNum of input.piq_numbers) {
    const profile = piqDimensionProfiles[piqNum] || {};
    for (const [dim, weight] of Object.entries(profile)) {
      dimensionCounts[dim] = (dimensionCounts[dim] || 0) + 1;
      dimensionWeightedScores[dim] = (dimensionWeightedScores[dim] || 0) + weight;
    }
  }

  // Analyze strategic portfolio coverage
  const gaps: string[] = [];
  const overlaps: string[] = [];
  const wellCovered: string[] = [];
  const strategicInsights: string[] = [];

  // Tier 1: Critical dimensions (MUST show)
  const tier1Critical = ['vulnerability_authenticity', 'transformative_impact', 'specificity_evidence'];

  // Tier 2: Important dimensions (SHOULD show)
  const tier2Important = ['initiative_leadership', 'reflection_insight', 'narrative_arc_stakes'];

  // Tier 3: Differentiating dimensions (NICE to show)
  const tier3Differentiating = ['identity_self_discovery', 'context_circumstances', 'craft_language_quality', 'fit_trajectory'];

  // Check Tier 1 coverage
  for (const dim of tier1Critical) {
    const count = dimensionCounts[dim] || 0;
    const weightedScore = dimensionWeightedScores[dim] || 0;

    if (count === 0) {
      gaps.push(`CRITICAL GAP: ${dim.replace(/_/g, ' ')} not shown in any PIQ. This is essential for competitive applications.`);
    } else if (count === 1 && weightedScore < 10) {
      gaps.push(`${dim.replace(/_/g, ' ')} only weakly represented. Consider strengthening.`);
    } else if (count >= 3) {
      overlaps.push(`Over-reliance on ${dim.replace(/_/g, ' ')} (${count}/4 PIQs). Risk of repetitive narrative.`);
    } else {
      wellCovered.push(dim);
    }
  }

  // Check Tier 2 coverage
  let tier2Count = 0;
  for (const dim of tier2Important) {
    const count = dimensionCounts[dim] || 0;
    if (count >= 1) {
      tier2Count++;
      wellCovered.push(dim);
    }
  }

  if (tier2Count < 2) {
    gaps.push(`Only ${tier2Count}/3 important dimensions covered. Add PIQs that show ${tier2Important.filter(d => !dimensionCounts[d]).map(d => d.replace(/_/g, ' ')).join(', ')}.`);
  }

  // Check Tier 3 - differentiation
  const tier3Count = tier3Differentiating.filter(d => dimensionCounts[d]).length;
  if (tier3Count >= 2) {
    strategicInsights.push(`Strong differentiation: showing ${tier3Count} unique dimensions (${tier3Differentiating.filter(d => dimensionCounts[d]).map(d => d.replace(/_/g, ' ')).join(', ')})`);
  }

  // Archetypal profile analysis
  const hasLeadership = input.piq_numbers.includes(1) || input.piq_numbers.includes(7);
  const hasContext = input.piq_numbers.includes(4) || input.piq_numbers.includes(5);
  const hasIntellectual = input.piq_numbers.includes(6);
  const hasCreative = input.piq_numbers.includes(2);
  const hasIdentity = input.piq_numbers.includes(8);
  const hasTalent = input.piq_numbers.includes(3);

  // Check student's actual profile for alignment
  const leadershipRoles = (context.activities?.leadership_roles as any[] || []).length;
  const hasSubstantialContext = (
    context.personal_info?.first_gen ||
    context.family?.challenging_circumstances ||
    (context.family?.hours_per_week || 0) >= 10
  );
  const intendedMajor = context.goals?.intended_major;

  // Strategic portfolio archetypes
  let archetype = '';
  let archetypeScore = 0;

  if (hasLeadership && hasIntellectual && hasContext) {
    archetype = 'Well-Rounded Leader';
    archetypeScore = 92;
    strategicInsights.push('Portfolio shows leadership + intellect + context. Strong profile for competitive UCs.');
  } else if (hasContext && hasIntellectual && (hasIdentity || hasCreative)) {
    archetype = 'Resilient Scholar';
    archetypeScore = 88;
    strategicInsights.push('Portfolio emphasizes overcoming barriers with intellectual curiosity. Compelling narrative.');
  } else if (hasLeadership && hasTalent && hasIntellectual) {
    archetype = 'Accomplished Achiever';
    archetypeScore = 85;
    strategicInsights.push('Portfolio shows deep commitment + leadership + academics. May lack vulnerability/context.');
  } else if (hasCreative && hasIdentity && hasIntellectual) {
    archetype = 'Creative Thinker';
    archetypeScore = 83;
    strategicInsights.push('Portfolio emphasizes creative expression and self-discovery. Ensure you show impact.');
  } else {
    archetype = 'Custom Mix';
    archetypeScore = 70;
  }

  // Context-aware suggestions
  const suggestions: string[] = [];

  // Leadership recommendation
  if (!hasLeadership && leadershipRoles > 0) {
    suggestions.push(`STRONG RECOMMENDATION: Add PIQ 1 or 7 (Leadership/Community). You have ${leadershipRoles} leadership role(s) but aren't showcasing them.`);
  } else if (!hasLeadership && leadershipRoles === 0) {
    suggestions.push('Consider if you have informal leadership experiences (organizing events, mentoring, etc.) for PIQ 1 or 7.');
  }

  // Context recommendation
  if (!hasContext && hasSubstantialContext) {
    suggestions.push(`CRITICAL RECOMMENDATION: Add PIQ 4 or 5 (Educational Barrier/Challenge). Your context (first-gen: ${context.personal_info?.first_gen}, challenges: ${context.family?.challenging_circumstances}) is admissions-relevant and should be shared.`);
  }

  // Intellectual recommendation
  if (!hasIntellectual && intendedMajor) {
    suggestions.push(`Consider PIQ 6 (Academic Passion). You have ${intendedMajor} as intended major—show intellectual curiosity.`);
  }

  // Identity/vulnerability check
  const vulnerabilityScore = dimensionWeightedScores['vulnerability_authenticity'] || 0;
  if (vulnerabilityScore < 12) {
    suggestions.push('Low vulnerability/authenticity across PIQs. Consider PIQ 5 (Challenge) or PIQ 8 (Open-ended) to show deeper reflection and growth.');
  }

  // Overlap warnings
  if (input.piq_numbers.includes(4) && input.piq_numbers.includes(5)) {
    suggestions.push('WARNING: PIQ 4 (Educational Barrier) and PIQ 5 (Challenge) overlap heavily. Risk of repetitive story. Consider if both are necessary.');
  }

  if (input.piq_numbers.includes(1) && input.piq_numbers.includes(7)) {
    suggestions.push('PIQ 1 (Leadership) and PIQ 7 (Community) can overlap. Ensure they tell different stories or use different activities.');
  }

  // Calculate sophisticated balance score WITH TRANSPARENT SCORING
  const scoreComponents: Array<{ component: string; points: number; max: number }> = [];

  // Tier 1 critical dimensions (40 points max)
  const tier1Coverage = tier1Critical.filter(d => dimensionCounts[d] >= 1).length;
  const tier1Points = Math.round((tier1Coverage / tier1Critical.length) * 40);
  scoreComponents.push({
    component: `Tier 1 Critical Coverage (${tier1Coverage}/${tier1Critical.length} dimensions)`,
    points: tier1Points,
    max: 40
  });

  // Tier 2 important dimensions (30 points max)
  const tier2Points = Math.round((tier2Count / tier2Important.length) * 30);
  scoreComponents.push({
    component: `Tier 2 Important Coverage (${tier2Count}/${tier2Important.length} dimensions)`,
    points: tier2Points,
    max: 30
  });

  // No critical overlaps (20 points max)
  const criticalOverlaps = overlaps.filter(o => o.includes('CRITICAL') || o.includes('Over-reliance')).length;
  const overlapPenalty = criticalOverlaps * 7;
  const overlapPoints = Math.max(0, 20 - overlapPenalty);
  scoreComponents.push({
    component: criticalOverlaps > 0
      ? `No Critical Overlaps (${criticalOverlaps} overlap(s), -${overlapPenalty} penalty)`
      : 'No Critical Overlaps (clean portfolio)',
    points: overlapPoints,
    max: 20
  });

  // Archetype alignment (10 points max)
  const archetypePoints = Math.round((archetypeScore / 100) * 10);
  scoreComponents.push({
    component: `Archetype Alignment (${archetype}, ${archetypeScore}/100)`,
    points: archetypePoints,
    max: 10
  });

  // Calculate final balance score
  const balanceScore = Math.min(
    scoreComponents.reduce((sum, comp) => sum + comp.points, 0),
    100
  );

  const isWellRounded = (
    balanceScore >= 75 &&
    tier1Coverage === tier1Critical.length &&
    tier2Count >= 2 &&
    criticalOverlaps === 0
  );

  return {
    is_well_rounded: isWellRounded,
    dimension_coverage: dimensionCounts,
    gaps,
    overlaps,
    suggestions,
    balance_score: balanceScore,
    score_breakdown: {
      components: scoreComponents,
      total: balanceScore,
      explanation: `Balance score calculated from 4 components: Tier 1 critical dimensions (${tier1Points}/40), Tier 2 important dimensions (${tier2Points}/30), overlap penalty avoidance (${overlapPoints}/20), and archetype alignment (${archetypePoints}/10).`
    },
    strategic_insights: [
      `Portfolio Archetype: ${archetype} (alignment score: ${archetypeScore}/100)`,
      ...strategicInsights,
      `Dimension coverage: ${Object.keys(dimensionCounts).length}/13 unique dimensions shown`,
      `Critical dimensions: ${tier1Coverage}/${tier1Critical.length} covered`,
      isWellRounded ?
        'Portfolio is well-balanced and strategically sound for competitive UC admissions.' :
        `Portfolio needs ${gaps.length} improvement(s) to be competitive.`
    ]
  };
}

/**
 * Tool 12: check_narrative_consistency
 * Detect contradictions across essays using fact graph
 */
export async function checkNarrativeConsistency(input: z.infer<typeof CheckNarrativeConsistencyInputSchema>) {
  // NOTE: Placeholder - requires essay system integration
  // In production, this would:
  // 1. Extract facts from all essays (names, dates, roles, numbers)
  // 2. Build a fact graph
  // 3. Detect contradictions (same club with different names, conflicting dates, etc.)

  return {
    is_consistent: true,
    conflicts: [],
    suggestions: [
      'Full narrative consistency checking requires essay system integration',
      'This will detect: name inconsistencies, date conflicts, role contradictions, number discrepancies'
    ]
  };
}

/**
 * Helper: Get dimension strengths for an activity based on PIQ type
 */
function getDimensionStrengthsForActivity(activity: any, piqNumber: number): string[] {
  const strengths: string[] = [];

  if (activity.leadership_role) {
    strengths.push('initiative_leadership', 'role_clarity_ownership');
  }

  if (activity.impact && activity.impact.length > 50) {
    strengths.push('transformative_impact', 'specificity_evidence');
  }

  if (activity.description && activity.description.length > 100) {
    strengths.push('narrative_arc_stakes');
  }

  return strengths;
}

// Export all tools
export const tools = {
  get_student_profile: getStudentProfile,
  get_extracurriculars: getExtracurriculars,
  get_academic_context: getAcademicContext,
  get_context_circumstances: getContextCircumstances,
  get_all_essays: getAllEssays,
  check_repetition: checkRepetition,
  get_portfolio_analytics: getPortfolioAnalytics,
  validate_claim: validateClaimTool,
  suggest_piq_prompts: suggestPIQPrompts,
  analyze_portfolio_balance: analyzePortfolioBalance,
  get_better_stories: getBetterStories,
  check_narrative_consistency: checkNarrativeConsistency,
  analyze_full_application: analyzeFullApplication
};

export const toolSchemas = {
  get_student_profile: GetStudentProfileInputSchema,
  get_extracurriculars: GetExtracurricularsInputSchema,
  get_academic_context: GetAcademicContextInputSchema,
  get_context_circumstances: GetContextCircumstancesInputSchema,
  get_all_essays: GetAllEssaysInputSchema,
  check_repetition: CheckRepetitionInputSchema,
  get_portfolio_analytics: GetPortfolioAnalyticsInputSchema,
  validate_claim: ValidateClaimInputSchema,
  suggest_piq_prompts: SuggestPIQPromptsInputSchema,
  analyze_portfolio_balance: AnalyzePortfolioBalanceInputSchema,
  get_better_stories: GetBetterStoriesInputSchema,
  check_narrative_consistency: CheckNarrativeConsistencyInputSchema,
  analyze_full_application: AnalyzeFullApplicationInputSchema
};
