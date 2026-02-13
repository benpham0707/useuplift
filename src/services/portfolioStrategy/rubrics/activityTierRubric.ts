// @ts-nocheck
/**
 * Activity Tier Classification Rubric
 *
 * Based on Sara Harberson's 4-tier system for evaluating extracurricular activities.
 * Used in Stage 1A for rapid activity diagnosis.
 *
 * TIER SYSTEM:
 * - Tier 1: Exceptional (National/International impact)
 * - Tier 2: Outstanding (State/Regional impact with leadership)
 * - Tier 3: Solid (School/Local impact with commitment)
 * - Tier 4: Standard (Participation without distinction)
 */

import { ActivityTier, ActivityCategory } from '../types';

// ============================================================================
// TIER DEFINITIONS
// ============================================================================

export interface TierCriteria {
  tier: ActivityTier;
  label: string;
  description: string;
  indicatorsMustHave: string[];
  indicatorsMayHave: string[];
  exclusions: string[];
  examples: string[];
  admissionsImpact: string;
}

export const TIER_CRITERIA: Record<ActivityTier, TierCriteria> = {
  1: {
    tier: 1,
    label: 'Exceptional',
    description: 'National/international recognition or extremely rare achievement',
    indicatorsMustHave: [
      'National or international recognition',
      'Highly selective (< 5% acceptance)',
      'Significant measurable impact (1000+ people affected)',
      'Published, awarded, or recognized by prestigious institution',
    ],
    indicatorsMayHave: [
      'Recruited athlete (D1 likely)',
      'Founded organization with significant scale',
      'Research published in peer-reviewed journal',
      'Awarded significant grant/prize (> $10,000)',
    ],
    exclusions: [
      'Pay-to-play programs',
      'Self-published work without external validation',
      'Awards with no selective process',
    ],
    examples: [
      'Intel/Regeneron Science Talent Search finalist',
      'USABO/USAMO top 20',
      'International olympiad medalist',
      'TEDx speaker (main stage, not student event)',
      'Founded nonprofit with 501(c)(3) and significant impact',
      'Published research in Nature, Science, or equivalent',
      'Professional athlete (Olympic trials, national team)',
    ],
    admissionsImpact: 'Likely to significantly boost admission odds at any school',
  },
  2: {
    tier: 2,
    label: 'Outstanding',
    description: 'State/regional distinction with demonstrated leadership',
    indicatorsMustHave: [
      'State or regional recognition',
      'Significant leadership role (President, Captain, Editor-in-Chief)',
      'Measurable impact (100+ people affected)',
      'Multi-year commitment with progression',
    ],
    indicatorsMayHave: [
      'Varsity athlete with all-state/all-region honors',
      'Student body president or equivalent',
      'State science fair winner',
      'Regional competition finalist',
    ],
    exclusions: [
      'Leadership role without tangible accomplishments',
      'State honors in non-competitive categories',
      'Positions held for < 1 year',
    ],
    examples: [
      'State debate champion',
      'All-state musician (competitive audition)',
      'Student body president at large school',
      'Founded school club that grew to 50+ members',
      'Eagle Scout / Gold Award',
      'Regional AMC/MATHCOUNTS top scorer',
      'Varsity captain with winning record',
    ],
    admissionsImpact: 'Strong positive factor, especially with demonstrated impact',
  },
  3: {
    tier: 3,
    label: 'Solid',
    description: 'School/local impact with consistent commitment',
    indicatorsMustHave: [
      'School or local recognition',
      'Consistent participation (2+ years)',
      'Some leadership or specialized role',
      'Demonstrable contribution to team/organization',
    ],
    indicatorsMayHave: [
      'Club officer (VP, Secretary, Treasurer)',
      'Varsity athlete (participates, not recruited)',
      'Regular volunteer (100+ hours cumulative)',
      'Work experience with responsibility',
    ],
    exclusions: [
      'Participation without any leadership/specialized role',
      'Short-term involvement (< 1 year)',
      'Activities done solely for college apps',
    ],
    examples: [
      'Varsity athlete (not recruited)',
      'Club officer with initiatives',
      'Consistent community service (same organization)',
      'Part-time job with increasing responsibility',
      'School newspaper section editor',
      'Orchestra member (non-principal)',
    ],
    admissionsImpact: 'Expected for competitive applicants; helps show commitment',
  },
  4: {
    tier: 4,
    label: 'Standard',
    description: 'Participation without significant distinction',
    indicatorsMustHave: [
      'Participation in organized activity',
    ],
    indicatorsMayHave: [
      'Club member',
      'JV athlete',
      'Occasional volunteer',
      'Informal hobbies',
    ],
    exclusions: [],
    examples: [
      'Club member without leadership',
      'One-time volunteer events',
      'Recreational sports',
      'Casual hobbies',
    ],
    admissionsImpact: 'Fills out activity list but doesn\'t differentiate',
  },
};

// ============================================================================
// CATEGORY-SPECIFIC BENCHMARKS
// ============================================================================

export interface CategoryBenchmark {
  category: ActivityCategory;
  tier1Threshold: string[];
  tier2Threshold: string[];
  tier3Threshold: string[];
  commonPitfalls: string[];
  upgradeStrategies: string[];
}

export const CATEGORY_BENCHMARKS: Partial<Record<ActivityCategory, CategoryBenchmark>> = {
  academic_competition: {
    category: 'academic_competition',
    tier1Threshold: [
      'USAMO/USABO/USAPhO qualifier',
      'Intel/Regeneron semifinalist+',
      'International olympiad team',
    ],
    tier2Threshold: [
      'AIME qualifier',
      'State science fair top 3',
      'Regional olympiad winner',
    ],
    tier3Threshold: [
      'School math team captain',
      'Science olympiad state participant',
      'Local competition winner',
    ],
    commonPitfalls: [
      'Listing competitions without results',
      'Participating in too many without depth',
    ],
    upgradeStrategies: [
      'Focus on one competition track and advance further',
      'Document specific scores and rankings',
      'Highlight team leadership/mentoring',
    ],
  },
  stem_project: {
    category: 'stem_project',
    tier1Threshold: [
      'Published peer-reviewed research',
      'Patent filed/granted',
      'Research at top university lab',
    ],
    tier2Threshold: [
      'Presented at academic conference',
      'Research internship at institution',
      'Science fair state winner',
    ],
    tier3Threshold: [
      'Independent project with documentation',
      'School science research program',
      'Local competition presentation',
    ],
    commonPitfalls: [
      'Overstating role in group projects',
      'Claiming research without tangible output',
    ],
    upgradeStrategies: [
      'Publish or present findings',
      'Quantify project impact',
      'Seek mentorship from professionals',
    ],
  },
  community_service: {
    category: 'community_service',
    tier1Threshold: [
      'Founded nonprofit with 501(c)(3)',
      '1000+ hours with leadership',
      'Measurable community transformation',
    ],
    tier2Threshold: [
      'Led service initiative (100+ participants)',
      '500+ hours with same organization',
      'Created sustainable program',
    ],
    tier3Threshold: [
      '100+ hours consistent service',
      'Board/leadership role in service org',
      'Regular commitment (weekly for 2+ years)',
    ],
    commonPitfalls: [
      'Listing many one-time events',
      'Hours without depth or impact',
      'Mission trip tourism',
    ],
    upgradeStrategies: [
      'Focus on one cause deeply',
      'Take leadership role',
      'Document quantifiable impact',
    ],
  },
  performing_arts: {
    category: 'performing_arts',
    tier1Threshold: [
      'All-State/All-National ensemble',
      'Professional performance credits',
      'Major competition winner (YoungArts, etc.)',
    ],
    tier2Threshold: [
      'Regional honors ensemble',
      'Lead roles in major productions',
      'Private teacher with credentials',
    ],
    tier3Threshold: [
      'Section leader/principal chair',
      'Supporting roles in school productions',
      'Consistent multi-year participation',
    ],
    commonPitfalls: [
      'Listing every minor performance',
      'No external validation of skill',
    ],
    upgradeStrategies: [
      'Pursue competitive auditions',
      'Perform outside of school',
      'Teach or mentor others',
    ],
  },
  athletics: {
    category: 'athletics',
    tier1Threshold: [
      'D1 recruited athlete',
      'National team/Olympic trials',
      'Professional contract',
    ],
    tier2Threshold: [
      'All-state/All-region honors',
      'Team captain with winning record',
      'D3/NAIA recruitment interest',
    ],
    tier3Threshold: [
      'Varsity letter (2+ years)',
      'JV captain or varsity contributor',
      'Club sport at competitive level',
    ],
    commonPitfalls: [
      'Listing sports without achievements',
      'Overestimating recruitment interest',
    ],
    upgradeStrategies: [
      'Focus on one sport for depth',
      'Document statistics/records',
      'Pursue leadership role',
    ],
  },
  leadership_governance: {
    category: 'leadership_governance',
    tier1Threshold: [
      'State/national youth organization leader',
      'Created school-wide initiative with lasting impact',
      'Elected to position representing 1000+ students',
    ],
    tier2Threshold: [
      'Student body president/VP',
      'Class president with initiatives',
      'Founded significant school club',
    ],
    tier3Threshold: [
      'Club president (existing club)',
      'Class officer',
      'Committee leadership',
    ],
    commonPitfalls: [
      'Titles without tangible accomplishments',
      'Too many leadership positions (appears thin)',
    ],
    upgradeStrategies: [
      'Focus on impact, not title collection',
      'Document specific initiatives and outcomes',
      'Quantify people affected',
    ],
  },
  entrepreneurship: {
    category: 'entrepreneurship',
    tier1Threshold: [
      'Revenue-generating business ($10k+)',
      'Venture-backed startup',
      'Product with significant user base',
    ],
    tier2Threshold: [
      'Small business with customers',
      'Competition winner (DECA state+)',
      'Social enterprise with measurable impact',
    ],
    tier3Threshold: [
      'Side project with some traction',
      'School business club leadership',
      'Freelance work with portfolio',
    ],
    commonPitfalls: [
      'Claiming "CEO" of inactive venture',
      'Ideas without execution',
    ],
    upgradeStrategies: [
      'Focus on metrics and outcomes',
      'Build real product/service',
      'Document customer/user impact',
    ],
  },
  work_experience: {
    category: 'work_experience',
    tier1Threshold: [
      'Professional role at recognized company',
      'Significant responsibility/promotion',
      'Work directly relevant to intended field',
    ],
    tier2Threshold: [
      'Consistent employment with advancement',
      'Supervisory responsibility',
      'Specialized skills demonstrated',
    ],
    tier3Threshold: [
      'Part-time job (1+ years)',
      'Family business responsibility',
      'Internship completion',
    ],
    commonPitfalls: [
      'Undervaluing significant family responsibilities',
      'Not articulating transferable skills',
    ],
    upgradeStrategies: [
      'Document responsibilities and growth',
      'Seek roles with more responsibility',
      'Connect work to interests/goals',
    ],
  },
};

// ============================================================================
// TIER CLASSIFICATION FUNCTIONS
// ============================================================================

export interface TierClassificationInput {
  name: string;
  category: ActivityCategory;
  description: string;
  yearsInvolved: number;
  hoursPerWeek: number;
  leadershipRoles: string[];
  achievements: string[];
  recognitionLevel: 'international' | 'national' | 'state' | 'regional' | 'local' | 'school' | 'none';
  impactMetrics?: {
    peopleAffected?: number;
    fundsRaised?: number;
    hoursContributed?: number;
  };
}

export interface TierClassificationResult {
  tier: ActivityTier;
  confidence: number;
  primaryReasons: string[];
  potentialUpgrade?: {
    toTier: ActivityTier;
    requirements: string[];
  };
  concerns?: string[];
}

/**
 * Heuristic tier classification (used as fallback or pre-filter)
 */
export function classifyActivityTier(input: TierClassificationInput): TierClassificationResult {
  const reasons: string[] = [];
  let score = 0;

  // Recognition level scoring
  const recognitionScores: Record<string, number> = {
    international: 4,
    national: 3,
    state: 2,
    regional: 1.5,
    local: 1,
    school: 0.5,
    none: 0,
  };
  score += recognitionScores[input.recognitionLevel] || 0;

  // Leadership scoring
  if (input.leadershipRoles.length > 0) {
    const topRoles = ['president', 'founder', 'captain', 'editor-in-chief', 'director'];
    const hasTopRole = input.leadershipRoles.some(role =>
      topRoles.some(top => role.toLowerCase().includes(top))
    );
    if (hasTopRole) {
      score += 1.5;
      reasons.push(`Top leadership role: ${input.leadershipRoles[0]}`);
    } else {
      score += 0.5;
      reasons.push('Has leadership position');
    }
  }

  // Commitment scoring
  if (input.yearsInvolved >= 4) {
    score += 1;
    reasons.push('4+ years of commitment');
  } else if (input.yearsInvolved >= 2) {
    score += 0.5;
    reasons.push('2+ years of commitment');
  }

  // Hours scoring
  if (input.hoursPerWeek >= 20) {
    score += 1;
    reasons.push('High time commitment (20+ hrs/week)');
  } else if (input.hoursPerWeek >= 10) {
    score += 0.5;
    reasons.push('Significant time commitment (10+ hrs/week)');
  }

  // Achievement scoring
  if (input.achievements.length > 0) {
    score += Math.min(input.achievements.length * 0.5, 1.5);
    reasons.push(`${input.achievements.length} achievements noted`);
  }

  // Impact metrics scoring
  if (input.impactMetrics?.peopleAffected) {
    if (input.impactMetrics.peopleAffected >= 1000) {
      score += 2;
      reasons.push(`Large scale impact: ${input.impactMetrics.peopleAffected}+ people`);
    } else if (input.impactMetrics.peopleAffected >= 100) {
      score += 1;
      reasons.push(`Meaningful impact: ${input.impactMetrics.peopleAffected}+ people`);
    }
  }

  // Determine tier from score
  let tier: ActivityTier;
  if (score >= 7) {
    tier = 1;
  } else if (score >= 4.5) {
    tier = 2;
  } else if (score >= 2.5) {
    tier = 3;
  } else {
    tier = 4;
  }

  // Calculate confidence based on how clear the classification is
  const tierMidpoints = { 1: 8, 2: 5.5, 3: 3.5, 4: 1.5 };
  const distance = Math.abs(score - tierMidpoints[tier]);
  const confidence = Math.max(0.5, 1 - (distance / 3));

  // Determine potential upgrade
  let potentialUpgrade: TierClassificationResult['potentialUpgrade'];
  if (tier > 1) {
    const nextTier = (tier - 1) as ActivityTier;
    const criteria = TIER_CRITERIA[nextTier];
    potentialUpgrade = {
      toTier: nextTier,
      requirements: criteria.indicatorsMustHave.slice(0, 2),
    };
  }

  return {
    tier,
    confidence,
    primaryReasons: reasons.slice(0, 3),
    potentialUpgrade,
    concerns: [],
  };
}

// ============================================================================
// SPIKE DETECTION
// ============================================================================

export interface SpikeDetectionInput {
  activities: TierClassificationInput[];
  classifications: TierClassificationResult[];
}

export interface SpikeDetectionResult {
  hasSpike: boolean;
  spikeStrength: 'strong' | 'moderate' | 'weak' | 'none';
  spikeAreas: string[];
  depthVsBreadth: 'depth_focused' | 'balanced' | 'breadth_focused';
  thematicCoherence: number; // 0-100
  recommendations: string[];
}

export function detectSpike(input: SpikeDetectionInput): SpikeDetectionResult {
  const { activities, classifications } = input;

  // Count tier distribution
  const tierCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const c of classifications) {
    tierCounts[c.tier]++;
  }

  // Detect spike based on concentrated excellence
  const tier1And2Count = tierCounts[1] + tierCounts[2];
  const totalActivities = activities.length;

  // Group by category
  const categoryGroups: Record<string, number[]> = {};
  for (let i = 0; i < activities.length; i++) {
    const cat = activities[i].category;
    if (!categoryGroups[cat]) categoryGroups[cat] = [];
    categoryGroups[cat].push(classifications[i].tier);
  }

  // Find concentrated areas
  const spikeAreas: string[] = [];
  for (const [category, tiers] of Object.entries(categoryGroups)) {
    const avgTier = tiers.reduce((a, b) => a + b, 0) / tiers.length;
    if (avgTier <= 2.5 && tiers.length >= 2) {
      spikeAreas.push(category);
    }
  }

  // Determine spike strength
  let spikeStrength: SpikeDetectionResult['spikeStrength'] = 'none';
  if (tierCounts[1] >= 2) {
    spikeStrength = 'strong';
  } else if (tierCounts[1] >= 1 && tierCounts[2] >= 2) {
    spikeStrength = 'strong';
  } else if (tierCounts[2] >= 3) {
    spikeStrength = 'moderate';
  } else if (tier1And2Count >= 2) {
    spikeStrength = 'weak';
  }

  // Determine depth vs breadth
  const uniqueCategories = Object.keys(categoryGroups).length;
  let depthVsBreadth: SpikeDetectionResult['depthVsBreadth'] = 'balanced';
  if (uniqueCategories <= 3 && totalActivities >= 5) {
    depthVsBreadth = 'depth_focused';
  } else if (uniqueCategories >= 6) {
    depthVsBreadth = 'breadth_focused';
  }

  // Calculate thematic coherence
  const largestGroup = Math.max(...Object.values(categoryGroups).map(g => g.length));
  const thematicCoherence = Math.round((largestGroup / totalActivities) * 100);

  // Generate recommendations
  const recommendations: string[] = [];
  if (spikeStrength === 'none') {
    recommendations.push('Consider developing deeper expertise in one area');
    recommendations.push('Focus on advancing from Tier 3/4 activities to Tier 2');
  } else if (spikeStrength === 'weak') {
    recommendations.push('Continue building in your strongest area');
    recommendations.push('Seek state/regional level recognition');
  }

  if (depthVsBreadth === 'breadth_focused') {
    recommendations.push('Consider narrowing focus to demonstrate depth');
  }

  return {
    hasSpike: spikeStrength !== 'none',
    spikeStrength,
    spikeAreas,
    depthVsBreadth,
    thematicCoherence,
    recommendations,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const activityTierRubric = {
  TIER_CRITERIA,
  CATEGORY_BENCHMARKS,
  classifyActivityTier,
  detectSpike,
};
