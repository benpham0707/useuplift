/**
 * Activity Citation Service
 *
 * Provides research-backed citations for activity analysis feedback.
 * Links to the comprehensive knowledge databases we created:
 * - extracurricularDatabase (competition hierarchies)
 * - extracurricularDatabaseExtended (startups, nonprofits, arts, etc.)
 * - impactMetricsFramework (quantifiable thresholds)
 * - majorActivityAlignment (major-activity fit)
 * - spikeDetectionSystem (coherence and spike criteria)
 *
 * Inspired by PIQ Workshop's citation engine but adapted for activities.
 */

import {
  ActivityCitation,
  CitedText,
  ActivityWorkshopInput,
  IActivityCitationService,
} from './types';

import { ActivityTier, ActivityCategory } from '../../types';

// Import knowledge databases
import {
  // Base extracurricular database
  MATH_COMPETITION_HIERARCHY,
  SCIENCE_OLYMPIAD_HIERARCHY,
  CS_COMPETITION_HIERARCHY,
  RESEARCH_COMPETITION_HIERARCHY,
  DEBATE_SPEECH_HIERARCHY,
  ARTS_COMPETITION_HIERARCHY,
  ATHLETICS_HIERARCHY,
  SUMMER_PROGRAMS_HIERARCHY,
  MODEL_UN_HIERARCHY,
  ECONOMICS_BUSINESS_HIERARCHY,
  ADMISSION_IMPACT_MULTIPLIERS,
  RED_FLAG_PATTERNS,

  // Extended database
  ENTREPRENEURSHIP_STARTUP_HIERARCHY,
  NONPROFIT_SERVICE_HIERARCHY,
  INTERNSHIP_WORK_HIERARCHY,
  SCHOOL_CLUBS_HIERARCHY,
  PERFORMING_ARTS_HIERARCHY,
  VISUAL_ARTS_HIERARCHY,
  WRITING_JOURNALISM_HIERARCHY,
  UNIQUE_ACTIVITIES_HIERARCHY,

  // Impact metrics
  IMPACT_TIER_DESCRIPTIONS,
  BENEFICIARY_METRICS,
  FINANCIAL_METRICS,
  DIGITAL_METRICS,
  RESEARCH_METRICS,
  LEADERSHIP_METRICS,
  METRIC_RED_FLAGS,
  VERIFICATION_STANDARDS,

  // Major alignment
  MAJOR_ACTIVITY_ALIGNMENT_MATRIX,
  MAJOR_COMPETITIVE_BENCHMARKS,
  COHERENCE_RED_FLAGS,
  COHERENCE_GREEN_FLAGS,

  // Spike detection
  SPIKE_DEFINITIONS,
  SPIKE_SCORING_RULES,
  ARCHETYPE_DETECTION_RULES,
} from '../../knowledge';

// ============================================================================
// CITATION ID GENERATOR
// ============================================================================

let citationCounter = 0;

function generateCitationId(): string {
  citationCounter++;
  return `cite_${citationCounter}`;
}

function resetCitationCounter(): void {
  citationCounter = 0;
}

// ============================================================================
// TIER BENCHMARK CITATIONS
// ============================================================================

/**
 * Get tier benchmark citations based on activity category and achievements
 */
function getTierBenchmarkCitations(
  activity: ActivityWorkshopInput,
  tier: ActivityTier,
  detectedCategory: ActivityCategory
): ActivityCitation[] {
  const citations: ActivityCitation[] = [];
  const description = activity.description.toLowerCase();
  const title = activity.title.toLowerCase();

  // Math competition citations
  if (
    detectedCategory === 'academic_competition' &&
    (description.includes('math') || description.includes('amc') || description.includes('aime'))
  ) {
    if (tier === 1) {
      citations.push({
        id: generateCitationId(),
        type: 'tier_justification',
        source: {
          name: 'USAMO/IMO Qualification Standards',
          type: 'database',
          database: 'extracurricularDatabase',
          specificity: 'USAMO qualification threshold',
        },
        evidence: {
          statistic: 'USAMO qualifiers: ~270 students nationally from ~7,000 AIME takers',
          benchmark: 'Top 0.01% of high school math students',
        },
        relevance: 'National-level math achievement represents Tier 1 exceptional standing',
      });
    } else if (tier === 2) {
      citations.push({
        id: generateCitationId(),
        type: 'tier_justification',
        source: {
          name: 'AIME Qualification Standards',
          type: 'database',
          database: 'extracurricularDatabase',
          specificity: 'AIME score tiers',
        },
        evidence: {
          statistic: 'AIME scores 10-11: Top ~3% of qualifiers',
          benchmark: 'Strong regional-level achievement',
        },
        relevance: 'High AIME scores demonstrate strong mathematical ability at state/regional level',
      });
    }
  }

  // Computer science citations
  if (
    detectedCategory === 'academic_competition' &&
    (description.includes('usaco') ||
      description.includes('programming') ||
      description.includes('competitive coding'))
  ) {
    if (tier === 1) {
      citations.push({
        id: generateCitationId(),
        type: 'tier_justification',
        source: {
          name: 'USACO Platinum/Camp Standards',
          type: 'database',
          database: 'extracurricularDatabase',
          specificity: 'USACO camp finalist criteria',
        },
        evidence: {
          statistic: 'USACO Camp: ~25 students selected nationally',
          benchmark: 'Top 0.01% of competitive programmers',
        },
        relevance: 'USACO Platinum+ represents exceptional programming ability',
      });
    } else if (tier === 2) {
      citations.push({
        id: generateCitationId(),
        type: 'tier_justification',
        source: {
          name: 'USACO Gold Standards',
          type: 'database',
          database: 'extracurricularDatabase',
          specificity: 'USACO Gold promotion rate',
        },
        evidence: {
          statistic: 'USACO Gold: Top ~5% of competitive programmers',
          benchmark: 'Strong achievement for CS applicants',
        },
        relevance: 'USACO Gold demonstrates significant algorithmic problem-solving ability',
      });
    }
  }

  // Research citations
  if (detectedCategory === 'research') {
    if (tier === 1) {
      citations.push({
        id: generateCitationId(),
        type: 'tier_justification',
        source: {
          name: 'Research Competition Standards',
          type: 'database',
          database: 'extracurricularDatabase',
          specificity: 'ISEF/Regeneron finalist criteria',
        },
        evidence: {
          statistic: 'Regeneron STS Finalists: 40 from ~2,000 applicants (2%)',
          benchmark: 'Published research in peer-reviewed journal',
        },
        relevance: 'National research recognition represents exceptional scientific achievement',
      });
    }
  }

  // Entrepreneurship citations
  if (
    detectedCategory === 'entrepreneurship' ||
    description.includes('founded') ||
    description.includes('startup') ||
    description.includes('business')
  ) {
    const thielInfo = ENTREPRENEURSHIP_STARTUP_HIERARCHY.tier_1_exceptional.thiel_fellowship;
    if (tier === 1 && thielInfo) {
      citations.push({
        id: generateCitationId(),
        type: 'tier_justification',
        source: {
          name: 'Entrepreneurship Achievement Standards',
          type: 'database',
          database: 'extracurricularDatabaseExtended',
          specificity: 'Tier 1 startup metrics',
        },
        evidence: {
          statistic: 'Tier 1 threshold: $100K+ revenue OR 100K+ users OR VC funding',
          benchmark: 'Significant traction with external validation',
        },
        relevance: 'Real entrepreneurship requires demonstrable traction, not just titles',
      });
    } else if (tier === 2) {
      citations.push({
        id: generateCitationId(),
        type: 'tier_justification',
        source: {
          name: 'Entrepreneurship Achievement Standards',
          type: 'database',
          database: 'extracurricularDatabaseExtended',
          specificity: 'Tier 2 startup metrics',
        },
        evidence: {
          statistic: 'Tier 2 threshold: $10K-100K revenue OR 10K-100K users',
          benchmark: 'Demonstrable business with real customers',
        },
        relevance: 'Distinguished entrepreneurship shows sustained business traction',
      });
    }
  }

  // Performing arts citations
  if (detectedCategory === 'arts_performance') {
    if (tier === 1) {
      citations.push({
        id: generateCitationId(),
        type: 'tier_justification',
        source: {
          name: 'Performing Arts Standards',
          type: 'database',
          database: 'extracurricularDatabaseExtended',
          specificity: 'Elite music/theater benchmarks',
        },
        evidence: {
          statistic: 'National Youth Orchestra: <1% acceptance rate',
          benchmark: 'YoungArts, All-State first chair, pre-conservatory acceptance',
        },
        relevance: 'National-level performing arts requires exceptional demonstrated ability',
      });
    } else if (tier === 2) {
      citations.push({
        id: generateCitationId(),
        type: 'tier_justification',
        source: {
          name: 'Performing Arts Standards',
          type: 'database',
          database: 'extracurricularDatabaseExtended',
          specificity: 'State-level music benchmarks',
        },
        evidence: {
          statistic: 'All-State selection: Top 2-5% of state musicians',
          benchmark: 'Regional competition wins, competitive summer programs',
        },
        relevance: 'All-State and equivalent represent strong state-level achievement',
      });
    }
  }

  // Community service/nonprofit citations
  if (detectedCategory === 'community_service') {
    citations.push({
      id: generateCitationId(),
      type: 'tier_justification',
      source: {
        name: 'Community Service Impact Standards',
        type: 'database',
        database: 'impactMetricsFramework',
        specificity: 'Beneficiary thresholds by tier',
      },
      evidence: {
        statistic: `Tier ${tier} threshold: ${
          tier === 1
            ? '10,000+ direct beneficiaries'
            : tier === 2
              ? '1,000+ direct beneficiaries'
              : tier === 3
                ? '100+ direct beneficiaries'
                : 'Participation-level involvement'
        }`,
        benchmark: 'Impact must be documented and verifiable',
      },
      relevance: 'Service quality measured by depth of impact, not just hours',
    });
  }

  // Add general tier criteria citation
  citations.push({
    id: generateCitationId(),
    type: 'tier_justification',
    source: {
      name: 'Sara Harberson Activity Tier Framework',
      type: 'expert',
      specificity: `Tier ${tier} criteria`,
    },
    evidence: {
      quote:
        tier === 1
          ? 'Tier 1 activities demonstrate national/international recognition or founding successful organizations with significant impact'
          : tier === 2
            ? 'Tier 2 activities show state/regional leadership with documented achievements'
            : tier === 3
              ? 'Tier 3 activities demonstrate school-level leadership with consistent commitment'
              : 'Tier 4 activities represent general participation without distinction',
    },
    relevance: 'Industry-standard framework used by admissions consultants',
  });

  return citations;
}

// ============================================================================
// RED FLAG CITATIONS
// ============================================================================

/**
 * Get citations for detected red flags
 */
function getRedFlagCitations(flag: string, activity: ActivityWorkshopInput): ActivityCitation[] {
  const citations: ActivityCitation[] = [];

  // Map common red flags to citations
  const redFlagCitations: Record<string, () => ActivityCitation> = {
    fake_ceo: () => ({
      id: generateCitationId(),
      type: 'red_flag',
      source: {
        name: 'Entrepreneurship Red Flags',
        type: 'database',
        database: 'extracurricularDatabaseExtended',
        specificity: 'CEO title without traction',
      },
      evidence: {
        quote:
          '"CEO" with no revenue, users, or verifiable product is a common red flag that admissions officers see constantly',
        comparison: 'Real founders show metrics: users, revenue, or external validation',
      },
      relevance: 'Title inflation without substance is viewed negatively',
    }),

    senior_year_nonprofit: () => ({
      id: generateCitationId(),
      type: 'red_flag',
      source: {
        name: 'Nonprofit Authenticity Standards',
        type: 'database',
        database: 'extracurricularDatabaseExtended',
        specificity: '501(c)(3) timing concerns',
      },
      evidence: {
        quote: '501(c)(3) filed in senior year is a red flag - real nonprofits take years to develop impact',
        statistic: 'Sustainable nonprofits typically require 2+ years to demonstrate real impact',
      },
      relevance: 'Late-stage organization founding suggests resume padding',
    }),

    voluntourism: () => ({
      id: generateCitationId(),
      type: 'red_flag',
      source: {
        name: 'Service Quality Standards',
        type: 'database',
        database: 'extracurricularDatabaseExtended',
        specificity: 'Voluntourism concerns',
      },
      evidence: {
        quote: 'Short-term overseas "service" without relevant skills often shows privilege rather than impact',
        comparison: 'Meaningful service requires sustained local engagement or specialized skills',
      },
      relevance: 'Quality of service matters more than exotic location',
    }),

    inflated_hours: () => ({
      id: generateCitationId(),
      type: 'red_flag',
      source: {
        name: 'Time Commitment Verification',
        type: 'database',
        database: 'impactMetricsFramework',
        specificity: 'Impossible hours threshold',
      },
      evidence: {
        statistic: 'Maximum possible hours per week: 168. Claims exceeding this are physically impossible.',
        benchmark: 'Realistic high commitment: 15-25 hrs/week for passionate pursuit',
      },
      relevance: 'Hour inflation undermines credibility of entire application',
    }),

    pay_to_play: () => ({
      id: generateCitationId(),
      type: 'red_flag',
      source: {
        name: 'Program Selectivity Standards',
        type: 'database',
        database: 'extracurricularDatabase',
        specificity: 'Paid program evaluation',
      },
      evidence: {
        quote: 'Programs that accept anyone who pays (no selection) do not demonstrate merit',
        comparison: 'Selective programs: RSI (3.5% acceptance), TASP (5%), MIT LaunchX (8%)',
      },
      relevance: 'Admissions officers know which programs are selective vs. pay-to-play',
    }),
  };

  // Normalize flag name and look up citation
  const normalizedFlag = flag.toLowerCase().replace(/\s+/g, '_');
  for (const [key, citationFn] of Object.entries(redFlagCitations)) {
    if (normalizedFlag.includes(key) || key.includes(normalizedFlag)) {
      citations.push(citationFn());
    }
  }

  // If no specific match, add general red flag citation
  if (citations.length === 0) {
    citations.push({
      id: generateCitationId(),
      type: 'red_flag',
      source: {
        name: 'Application Red Flag Patterns',
        type: 'database',
        database: 'extracurricularDatabase',
        specificity: 'General authenticity concerns',
      },
      evidence: {
        quote: `Detected pattern: ${flag}`,
        comparison: 'Authentic activities show sustained commitment and verifiable impact',
      },
      relevance: 'Admissions officers are trained to identify inauthenticity signals',
    });
  }

  return citations;
}

// ============================================================================
// GREEN FLAG CITATIONS
// ============================================================================

/**
 * Get citations for detected green flags (strengths)
 */
function getGreenFlagCitations(flag: string, activity: ActivityWorkshopInput): ActivityCitation[] {
  const citations: ActivityCitation[] = [];

  const greenFlagCitations: Record<string, () => ActivityCitation> = {
    sustained_commitment: () => ({
      id: generateCitationId(),
      type: 'green_flag',
      source: {
        name: 'Commitment Quality Standards',
        type: 'database',
        database: 'spikeDetectionSystem',
        specificity: 'Multi-year commitment value',
      },
      evidence: {
        quote: 'Multi-year commitment to same activity demonstrates genuine passion, not resume building',
        statistic: 'COHERENCE_GREEN_FLAGS.multi_year_commitment: +15 points',
      },
      relevance: 'Sustained involvement is a key indicator of authentic interest',
    }),

    leadership_progression: () => ({
      id: generateCitationId(),
      type: 'green_flag',
      source: {
        name: 'Leadership Development Standards',
        type: 'database',
        database: 'spikeDetectionSystem',
        specificity: 'Leadership growth patterns',
      },
      evidence: {
        quote: 'Natural progression from participant to leader shows earned leadership',
        statistic: 'COHERENCE_GREEN_FLAGS.leadership_progression: +10 points',
      },
      relevance: 'Earned leadership is more valued than appointed titles',
    }),

    external_validation: () => ({
      id: generateCitationId(),
      type: 'green_flag',
      source: {
        name: 'Achievement Validation Standards',
        type: 'database',
        database: 'spikeDetectionSystem',
        specificity: 'External recognition value',
      },
      evidence: {
        quote: 'External recognition (awards, publications, media) provides third-party validation',
        statistic: 'COHERENCE_GREEN_FLAGS.external_validation: +10 points',
      },
      relevance: 'Third-party validation is more credible than self-reported claims',
    }),

    unique_niche: () => ({
      id: generateCitationId(),
      type: 'green_flag',
      source: {
        name: 'Differentiation Standards',
        type: 'database',
        database: 'spikeDetectionSystem',
        specificity: 'Unique positioning value',
      },
      evidence: {
        quote: 'Carving out a distinctive position helps you stand out in applicant pool',
        statistic: 'COHERENCE_GREEN_FLAGS.unique_niche: +15 points',
      },
      relevance: 'Uniqueness is memorable; generic profiles blend together',
    }),

    quantifiable_impact: () => ({
      id: generateCitationId(),
      type: 'green_flag',
      source: {
        name: 'Impact Documentation Standards',
        type: 'database',
        database: 'impactMetricsFramework',
        specificity: 'Quantifiable metrics value',
      },
      evidence: {
        quote: 'Specific numbers (served 500 students, raised $10K, 50K users) are more credible than vague claims',
        benchmark: 'Strong impact: specific metrics with documentation',
      },
      relevance: 'Quantifiable impact demonstrates real achievement',
    }),
  };

  const normalizedFlag = flag.toLowerCase().replace(/\s+/g, '_');
  for (const [key, citationFn] of Object.entries(greenFlagCitations)) {
    if (normalizedFlag.includes(key) || key.includes(normalizedFlag)) {
      citations.push(citationFn());
    }
  }

  return citations;
}

// ============================================================================
// UPGRADE PATH CITATIONS
// ============================================================================

/**
 * Get citations for upgrade pathway recommendations
 */
function getUpgradePathCitations(
  activity: ActivityWorkshopInput,
  currentTier: ActivityTier,
  targetTier: ActivityTier,
  detectedCategory: ActivityCategory
): ActivityCitation[] {
  const citations: ActivityCitation[] = [];

  // Add tier transition citation
  citations.push({
    id: generateCitationId(),
    type: 'upgrade_path',
    source: {
      name: 'Activity Tier Progression Framework',
      type: 'expert',
      specificity: `Tier ${currentTier} to Tier ${targetTier} pathway`,
    },
    evidence: {
      benchmark: `Moving from Tier ${currentTier} to Tier ${targetTier} requires: ${
        targetTier === 1
          ? 'national/international recognition OR founding organization with significant impact'
          : targetTier === 2
            ? 'state/regional recognition OR documented leadership impact'
            : 'consistent multi-year commitment with school-level leadership'
      }`,
    },
    relevance: 'Clear milestones help students plan realistic improvement paths',
  });

  // Category-specific upgrade citations
  if (detectedCategory === 'academic_competition') {
    citations.push({
      id: generateCitationId(),
      type: 'upgrade_path',
      source: {
        name: 'Competition Advancement Guidelines',
        type: 'database',
        database: 'extracurricularDatabase',
        specificity: 'Competition progression paths',
      },
      evidence: {
        benchmark:
          'Competition upgrade path: local → regional → state → national. Each level typically requires 1-2 years of focused preparation.',
      },
      relevance: 'Systematic competition preparation improves placement predictably',
    });
  }

  if (detectedCategory === 'community_service') {
    citations.push({
      id: generateCitationId(),
      type: 'upgrade_path',
      source: {
        name: 'Service Impact Scaling',
        type: 'database',
        database: 'impactMetricsFramework',
        specificity: 'Beneficiary scaling thresholds',
      },
      evidence: {
        benchmark: `Current threshold: ${BENEFICIARY_METRICS.direct_beneficiaries.solid} beneficiaries. Target: ${
          targetTier === 1
            ? BENEFICIARY_METRICS.direct_beneficiaries.transformational
            : targetTier === 2
              ? BENEFICIARY_METRICS.direct_beneficiaries.exceptional
              : BENEFICIARY_METRICS.direct_beneficiaries.strong
        } beneficiaries.`,
      },
      relevance: 'Impact scaling provides concrete targets for improvement',
    });
  }

  if (detectedCategory === 'entrepreneurship') {
    citations.push({
      id: generateCitationId(),
      type: 'upgrade_path',
      source: {
        name: 'Startup Traction Milestones',
        type: 'database',
        database: 'extracurricularDatabaseExtended',
        specificity: 'Business metrics progression',
      },
      evidence: {
        benchmark: `Target metrics: ${
          targetTier === 1
            ? '$100K+ revenue OR 100K+ users OR significant funding'
            : targetTier === 2
              ? '$10K-100K revenue OR 10K-100K users'
              : 'Paying customers and consistent revenue'
        }`,
      },
      relevance: 'Startup progress measured by traction, not titles or ideas',
    });
  }

  return citations;
}

// ============================================================================
// CITATION ATTACHMENT
// ============================================================================

/**
 * Attach citations to text, inserting {{cite_N}} markers
 */
function attachCitationsToText(text: string, citations: ActivityCitation[]): CitedText {
  // For now, append citation markers at logical break points
  // In production, this would be more sophisticated with NLP

  let citedText = text;
  const usedCitations: ActivityCitation[] = [];

  citations.forEach((citation, index) => {
    // Find a relevant insertion point based on citation relevance
    const marker = `{{cite_${index + 1}}}`;

    // Simple heuristic: add citations at end of sentences containing relevant keywords
    const keywords = citation.relevance.toLowerCase().split(' ').slice(0, 3);

    let inserted = false;
    for (const keyword of keywords) {
      if (keyword.length > 4 && citedText.toLowerCase().includes(keyword)) {
        // Find the sentence containing this keyword and add citation after it
        const sentences = citedText.split(/(?<=[.!?])\s+/);
        const relevantSentenceIndex = sentences.findIndex((s) => s.toLowerCase().includes(keyword));

        if (relevantSentenceIndex !== -1 && !sentences[relevantSentenceIndex].includes('{{cite_')) {
          sentences[relevantSentenceIndex] = sentences[relevantSentenceIndex].replace(/([.!?])$/, `${marker}$1`);
          citedText = sentences.join(' ');
          usedCitations.push({ ...citation, id: `cite_${index + 1}` });
          inserted = true;
          break;
        }
      }
    }

    // If no good insertion point, add at end
    if (!inserted && citations.length <= 3) {
      citedText = citedText.replace(/([.!?])$/, `${marker}$1`);
      usedCitations.push({ ...citation, id: `cite_${index + 1}` });
    }
  });

  return {
    text: citedText,
    citations: usedCitations,
  };
}

// ============================================================================
// ACTIVITY CITATION SERVICE CLASS
// ============================================================================

export class ActivityCitationService implements IActivityCitationService {
  /**
   * Get citations for tier justification
   */
  getCitationsForTier(activity: ActivityWorkshopInput, tier: ActivityTier): ActivityCitation[] {
    resetCitationCounter();

    // Detect category from activity
    const detectedCategory = this.detectCategory(activity);

    return getTierBenchmarkCitations(activity, tier, detectedCategory);
  }

  /**
   * Get citations for red flag
   */
  getCitationsForRedFlag(flag: string, activity: ActivityWorkshopInput): ActivityCitation[] {
    return getRedFlagCitations(flag, activity);
  }

  /**
   * Get citations for green flag
   */
  getCitationsForGreenFlag(flag: string, activity: ActivityWorkshopInput): ActivityCitation[] {
    return getGreenFlagCitations(flag, activity);
  }

  /**
   * Get citations for upgrade pathway
   */
  getCitationsForUpgrade(
    activity: ActivityWorkshopInput,
    currentTier: ActivityTier,
    targetTier: ActivityTier
  ): ActivityCitation[] {
    const detectedCategory = this.detectCategory(activity);
    return getUpgradePathCitations(activity, currentTier, targetTier, detectedCategory);
  }

  /**
   * Attach citations to text
   */
  attachCitations(text: string, citations: ActivityCitation[]): CitedText {
    return attachCitationsToText(text, citations);
  }

  /**
   * Get all relevant citations for an activity
   */
  getAllCitations(
    activity: ActivityWorkshopInput,
    tier: ActivityTier,
    redFlags: string[],
    greenFlags: string[]
  ): ActivityCitation[] {
    resetCitationCounter();

    const citations: ActivityCitation[] = [];

    // Tier citations
    citations.push(...this.getCitationsForTier(activity, tier));

    // Red flag citations
    for (const flag of redFlags) {
      citations.push(...this.getCitationsForRedFlag(flag, activity));
    }

    // Green flag citations
    for (const flag of greenFlags) {
      citations.push(...this.getCitationsForGreenFlag(flag, activity));
    }

    return citations;
  }

  /**
   * Get citations for spike analysis
   */
  getCitationsForSpike(spikeType: string, strength: string): ActivityCitation[] {
    const citations: ActivityCitation[] = [];

    // Add spike definition citation
    citations.push({
      id: generateCitationId(),
      type: 'spike_evidence',
      source: {
        name: 'Spike Detection Framework',
        type: 'database',
        database: 'spikeDetectionSystem',
        specificity: `${spikeType} spike at ${strength} level`,
      },
      evidence: {
        quote: 'A spike is concentrated excellence in one area with external validation that distinguishes you from the applicant pool',
        statistic: strength === 'national'
          ? 'National-level spikes typically include multiple Tier 1-2 activities with national recognition'
          : strength === 'regional'
            ? 'Regional spikes show Tier 2 activities with state/regional recognition and clear theme'
            : 'Emerging spikes show concentration but need higher-level achievement for impact',
      },
      relevance: 'Spike strength directly correlates with competitive advantage at selective schools',
    });

    // Add archetype-specific citation if applicable
    if (spikeType && spikeType !== 'none') {
      citations.push({
        id: generateCitationId(),
        type: 'spike_evidence',
        source: {
          name: 'Archetype Detection Rules',
          type: 'database',
          database: 'spikeDetectionSystem',
          specificity: `${spikeType} archetype`,
        },
        evidence: {
          quote: `The ${spikeType.replace(/_/g, ' ')} archetype is characterized by specific activity patterns and achievements`,
          benchmark: 'Strong archetypes have 3+ mutually reinforcing activities in the same domain',
        },
        relevance: 'Clear archetype makes applications more memorable and coherent',
      });
    }

    return citations;
  }

  /**
   * Get citations for coherence analysis
   */
  getCitationsForCoherence(score: number, assessment: string): ActivityCitation[] {
    const citations: ActivityCitation[] = [];

    // Add coherence score interpretation citation
    citations.push({
      id: generateCitationId(),
      type: 'coherence_factor',
      source: {
        name: 'Coherence Scoring Framework',
        type: 'database',
        database: 'spikeDetectionSystem',
        specificity: `${assessment} coherence (${score}/100)`,
      },
      evidence: {
        statistic: `Score ${score}/100 = ${assessment}`,
        benchmark: score >= 85
          ? 'Exceptional coherence: Clear narrative thread, activities reinforce each other'
          : score >= 70
            ? 'Strong coherence: Visible theme with mostly aligned activities'
            : score >= 50
              ? 'Moderate coherence: Emerging focus but diluted by unrelated activities'
              : score >= 30
                ? 'Weak coherence: No clear theme, activities seem unconnected'
                : 'Scattered: Random activities, possible resume padding concern',
      },
      relevance: 'Portfolio coherence signals authentic passion vs. resume padding to admissions officers',
    });

    // Add specific guidance based on score
    if (score < 70) {
      citations.push({
        id: generateCitationId(),
        type: 'coherence_factor',
        source: {
          name: 'Coherence Improvement Strategies',
          type: 'database',
          database: 'spikeDetectionSystem',
          specificity: 'Low coherence remediation',
        },
        evidence: {
          quote: 'Low coherence can be improved by: (1) finding connections between activities, (2) deprioritizing disconnected activities, or (3) reframing descriptions to show common thread',
        },
        relevance: 'Improving coherence is one of the highest-impact changes for competitive applications',
      });
    }

    return citations;
  }

  /**
   * Detect activity category from input
   */
  private detectCategory(activity: ActivityWorkshopInput): ActivityCategory {
    const description = activity.description.toLowerCase();
    const title = activity.title.toLowerCase();
    const combined = `${title} ${description}`;

    // Academic competition detection
    if (
      combined.includes('olympiad') ||
      combined.includes('competition') ||
      combined.includes('amc') ||
      combined.includes('aime') ||
      combined.includes('usaco') ||
      combined.includes('science bowl') ||
      combined.includes('quiz bowl') ||
      combined.includes('debate')
    ) {
      return 'academic_competition';
    }

    // Research detection
    if (
      combined.includes('research') ||
      combined.includes('lab') ||
      combined.includes('publication') ||
      combined.includes('thesis')
    ) {
      return 'research';
    }

    // Entrepreneurship detection
    if (
      combined.includes('founded') ||
      combined.includes('startup') ||
      combined.includes('business') ||
      combined.includes('company') ||
      combined.includes('ceo') ||
      combined.includes('entrepreneur')
    ) {
      return 'entrepreneurship';
    }

    // Arts detection
    if (
      combined.includes('orchestra') ||
      combined.includes('band') ||
      combined.includes('choir') ||
      combined.includes('theater') ||
      combined.includes('dance')
    ) {
      return 'arts_performance';
    }

    // Community service detection
    if (
      combined.includes('volunteer') ||
      combined.includes('nonprofit') ||
      combined.includes('charity') ||
      combined.includes('community service') ||
      combined.includes('tutoring')
    ) {
      return 'community_service';
    }

    // Work experience detection
    if (activity.isPaid || combined.includes('job') || combined.includes('internship') || combined.includes('work')) {
      return activity.category === 'work' ? 'work_experience' : 'internship';
    }

    // Default based on frontend category
    const categoryMap: Record<string, ActivityCategory> = {
      work: 'work_experience',
      volunteer: 'community_service',
      school_activity: 'leadership_governance',
      project: 'stem_project',
    };

    return categoryMap[activity.category] || 'other';
  }
}

// Export singleton instance
export const activityCitationService = new ActivityCitationService();
