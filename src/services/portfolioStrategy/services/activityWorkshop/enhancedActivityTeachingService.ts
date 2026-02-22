// @ts-nocheck
/**
 * Enhanced Activity Teaching Service
 *
 * DEEP TEACHING following the PIQ Workshop pattern:
 * - THE PROBLEM: Why the issue matters for admissions
 * - WHY THIS WORKS: Psychology and research behind the fix
 * - WHAT DETAILS TO PRIORITIZE: Activity-specific guidance
 * - MULTIPLE BEFORE/AFTER EXAMPLES: Concrete transformations
 *
 * This service produces rich, educational feedback that helps students
 * understand not just WHAT to fix, but WHY it matters and HOW to think
 * about their activities differently.
 *
 * MODEL: Sonnet for quality (teaching is user-facing)
 */

import type Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient } from '../../../../lib/llm/claude';
import {
  ActivityWorkshopInput,
  ActivityWorkshopSessionInput,
  ActivityAnalysis,
  PortfolioAnalysis,
  CitedText,
} from './types';
import { ActivityTier } from '../../types';
import { activityCitationService } from './activityCitationService';
import {
  ACTIVITY_TEACHING_KNOWLEDGE_BASE,
  ActivityIssueType,
  ActivityTeachingBundle,
  ActivityTransformation,
  getTeachingForIssue,
} from './activityTeachingKnowledgeBase';
import { parseClaudeJSON } from '../../../commonAppWorkshop/utils/jsonParser';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS_ENHANCED_TEACHING = 6000;

// ============================================================================
// ENHANCED TEACHING TYPES
// ============================================================================

/**
 * Enhanced teaching output with PIQ-style depth
 */
export interface EnhancedActivityTeaching {
  activityId: string;

  // TIER EXPLANATION with research backing
  tierExplanation: {
    assignedTier: ActivityTier;
    headline: string;               // One-line summary
    fullExplanation: CitedText;     // Detailed explanation with citations
    whatThisTierMeans: string;      // What Tier X activities look like
    whatHigherTierLooksLike: string; // Concrete upgrade benchmarks
    saraHarbersonCriteria: {
      criterion: string;
      studentMeets: boolean;
      evidence: string;
    }[];
  };

  // DETAIL PRIORITY TEACHING - What to showcase
  detailPriorities: {
    whatAdmissionersLookFor: string;      // General principle
    criticalDetails: DetailPriority[];    // Must include
    valuableDetails: DetailPriority[];    // Nice to have
    avoidThese: string[];                 // Common mistakes
  };

  // ISSUE-SPECIFIC TEACHING (PIQ-style)
  issueTeaching: EnhancedIssueTeaching[];

  // DESCRIPTION TRANSFORMATION
  descriptionTransformation: {
    original: string;
    problems: {
      issue: string;
      location: string;
      impact: string;
    }[];
    optimized: {
      version: string;
      characterCount: number;
      changesExplained: {
        change: string;
        principle: string;
        whyBetter: string;
      }[];
    };
    alternatives: {
      version: string;
      characterCount: number;
      emphasis: string;  // What this version emphasizes
    }[];
  };

  // NARRATIVE & PRESENTATION
  narrativeGuidance: {
    howToTalkAboutThis: CitedText;
    uniqueAngle: {
      angle: string;
      whyThisStandsOut: string;
    };
    connectionToStory: string;
    interviewGuidance: InterviewGuidance;
    essayPotential: {
      recommended: boolean;
      strength: 'high' | 'medium' | 'low';
      angle: string;
      whyThisWorks: string;
      cautionAreas: string[];
    };
  };

  // UPGRADE PATHWAY (if applicable)
  upgradePathway?: UpgradePathway;
}

/**
 * Detail priority for what to include
 */
export interface DetailPriority {
  detail: string;
  whyItMatters: string;
  example: string;
}

/**
 * Enhanced issue teaching following PIQ pattern
 */
export interface EnhancedIssueTeaching {
  issueType: ActivityIssueType;

  // THE PROBLEM
  theProblem: {
    headline: string;             // Attention-grabbing hook (80-120 chars)
    explanation: string;          // Full explanation (300-500 chars)
    admissionsImpact: string;     // How AOs react
    inYourDescription: string;    // How this manifests in their specific text
  };

  // WHY THIS WORKS (the fix)
  whyThisWorks: {
    psychology: string;           // Cognitive/psychological principle
    researchInsight: string;      // Research-backed finding
    admissionsQuote?: string;     // Quote from AO or counselor
    quoteSource?: string;         // Who said it
  };

  // WHAT TO DO
  whatToDo: {
    principle: string;            // The core technique
    steps: string[];              // Step-by-step guidance
    prioritizeThese: string[];    // Details that matter for this issue
  };

  // BEFORE/AFTER EXAMPLES
  transformationExamples: {
    yourText: {
      before: string;
      after: string;
      principle: string;
      whyItWorks: string;
    };
    similarExamples: {
      context: string;
      before: string;
      after: string;
      principle: string;
      whyItWorks: string;
      highlightedChange: string;
    }[];
  };

  // METADATA
  difficulty: 'simple' | 'moderate' | 'advanced';
  timeToFix: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Interview preparation guidance
 */
export interface InterviewGuidance {
  likelyQuestions: string[];
  responseFramework: {
    opening: string;
    middlePoints: string[];
    closing: string;
  };
  pitfallsToAvoid: string[];
  authenticityTips: string[];
}

/**
 * Upgrade pathway with milestones
 */
export interface UpgradePathway {
  currentTier: ActivityTier;
  targetTier: ActivityTier;
  feasibility: 'high' | 'medium' | 'low';
  timeRequired: string;
  steps: {
    step: number;
    action: string;
    rationale: string;
    milestone: string;
    timeframe: string;
    resources?: string[];
  }[];
  successIndicators: string[];
  risks: string[];
}

// ============================================================================
// ENHANCED TEACHING PROMPT
// ============================================================================

const ENHANCED_TEACHING_PROMPT = `You are an expert college admissions counselor providing DEEP, EDUCATIONAL teaching about extracurricular activities. Your goal is to help students understand not just WHAT to improve, but WHY it matters and HOW to think about their activities differently.

## ACTIVITY INFORMATION:
Title: {{title}}
Description: {{description}}
Role: {{role}}
Category: {{category}}
Hours/Week: {{hoursPerWeek}}
Weeks/Year: {{weeksPerYear}}
Years: {{yearsInvolved}}
Achievements: {{achievements}}

## ANALYSIS RESULTS (from diagnosis):
{{analysisJson}}

## STUDENT CONTEXT:
Intended Major: {{intendedMajor}}
Target Schools: {{targetSchools}}

## TEACHING KNOWLEDGE BASE:
The following research-backed teaching content should inform your response:
{{teachingKnowledgeBase}}

## YOUR TASK:
Provide DEEP, EDUCATIONAL teaching that helps the student truly understand their activity and how to present it. For each issue identified, explain:
1. THE PROBLEM - Why this matters for admissions (with specific impact)
2. WHY THE FIX WORKS - The psychology and research behind better approaches
3. WHAT DETAILS TO PRIORITIZE - Which specific details matter most
4. CONCRETE EXAMPLES - Before/after transformations

Be specific to THIS student's activity. Reference the teaching knowledge base but personalize to their situation.

## RESPOND IN THIS EXACT JSON FORMAT:

{
  "tierExplanation": {
    "assignedTier": 1|2|3|4,
    "headline": "One-line summary of tier classification (80-120 chars)",
    "fullExplanation": "Detailed 2-3 paragraph explanation of why this tier with specific evidence from the Sara Harberson framework",
    "whatThisTierMeans": "Description of what Tier X activities typically look like",
    "whatHigherTierLooksLike": "Specific benchmarks for the next tier up",
    "saraHarbersonCriteria": [
      {
        "criterion": "specific criterion (e.g., 'National/international recognition')",
        "studentMeets": true|false,
        "evidence": "specific evidence for why they do/don't meet this"
      }
    ]
  },

  "detailPriorities": {
    "whatAdmissionersLookFor": "General principle of what AOs value in this type of activity",
    "criticalDetails": [
      {
        "detail": "specific detail type (e.g., 'Quantified impact metrics')",
        "whyItMatters": "why AOs care about this",
        "example": "example of how to include this detail"
      }
    ],
    "valuableDetails": [
      {
        "detail": "nice-to-have detail",
        "whyItMatters": "why this adds value",
        "example": "example"
      }
    ],
    "avoidThese": ["common mistakes to avoid"]
  },

  "issueTeaching": [
    {
      "issueType": "vague_description|missing_quantification|weak_role_clarity|etc",
      "theProblem": {
        "headline": "Attention-grabbing statement about why this issue matters (80-120 chars)",
        "explanation": "Full 2-3 sentence explanation of the problem",
        "admissionsImpact": "How AOs specifically react when they see this issue",
        "inYourDescription": "How this issue appears in THIS student's specific text"
      },
      "whyThisWorks": {
        "psychology": "The cognitive/psychological principle behind the fix",
        "researchInsight": "Research-backed finding supporting this approach",
        "admissionsQuote": "Quote from AO or counselor (if available)",
        "quoteSource": "Who said it"
      },
      "whatToDo": {
        "principle": "The core technique to apply",
        "steps": ["Step 1", "Step 2", "Step 3"],
        "prioritizeThese": ["Specific details that matter for this fix"]
      },
      "transformationExamples": {
        "yourText": {
          "before": "The problematic phrase from their description",
          "after": "Your suggested improvement for their specific text",
          "principle": "What technique was applied",
          "whyItWorks": "Why this version is better"
        },
        "similarExamples": [
          {
            "context": "Type of activity this example is from",
            "before": "Original weak version",
            "after": "Improved version",
            "principle": "What changed",
            "whyItWorks": "Why it's better",
            "highlightedChange": "The key difference to note"
          }
        ]
      },
      "difficulty": "simple|moderate|advanced",
      "timeToFix": "realistic time estimate",
      "priority": "high|medium|low"
    }
  ],

  "descriptionTransformation": {
    "original": "Their current description",
    "problems": [
      {
        "issue": "specific problem",
        "location": "where in the text",
        "impact": "why it matters"
      }
    ],
    "optimized": {
      "version": "Your optimized 150-char version",
      "characterCount": number,
      "changesExplained": [
        {
          "change": "what changed",
          "principle": "the technique applied",
          "whyBetter": "why this is an improvement"
        }
      ]
    },
    "alternatives": [
      {
        "version": "Alternative optimized version",
        "characterCount": number,
        "emphasis": "what this version emphasizes differently"
      }
    ]
  },

  "narrativeGuidance": {
    "howToTalkAboutThis": "Guidance on how to present this activity in applications and interviews",
    "uniqueAngle": {
      "angle": "The distinctive element of this activity",
      "whyThisStandsOut": "Why this differentiates them"
    },
    "connectionToStory": "How this connects to their broader application narrative",
    "interviewGuidance": {
      "likelyQuestions": ["Questions they might be asked about this activity"],
      "responseFramework": {
        "opening": "How to start their answer",
        "middlePoints": ["Key points to hit"],
        "closing": "How to end strong"
      },
      "pitfallsToAvoid": ["Common interview mistakes"],
      "authenticityTips": ["How to sound genuine"]
    },
    "essayPotential": {
      "recommended": true|false,
      "strength": "high|medium|low",
      "angle": "Potential essay approach",
      "whyThisWorks": "Why this would make a good essay (or why not)",
      "cautionAreas": ["What to avoid if writing about this"]
    }
  },

  "upgradePathway": {
    "currentTier": 1|2|3|4,
    "targetTier": 1|2|3,
    "feasibility": "high|medium|low",
    "timeRequired": "realistic estimate",
    "steps": [
      {
        "step": 1,
        "action": "specific action to take",
        "rationale": "why this matters for tier upgrade",
        "milestone": "what success looks like",
        "timeframe": "when to achieve",
        "resources": ["optional resources"]
      }
    ],
    "successIndicators": ["how to know you've upgraded"],
    "risks": ["what could derail progress"]
  }
}

Remember: The goal is EDUCATION, not just feedback. Help the student understand WHY things matter and HOW to think about their activities differently.`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function detectIssuesFromAnalysis(analysis: ActivityAnalysis, activity?: ActivityWorkshopInput): ActivityIssueType[] {
  const issues: ActivityIssueType[] = [];
  const description = activity?.description || '';
  const descriptionLower = description.toLowerCase();

  // Check description quality scores
  if (analysis.descriptionQuality.specificityScore < 6) {
    issues.push('vague_description');
  }
  if (analysis.descriptionQuality.quantificationScore < 5) {
    issues.push('missing_quantification');
  }
  if (analysis.descriptionQuality.uniquenessScore < 5) {
    issues.push('generic_contribution');
  }

  // Check from red flags
  for (const flag of analysis.redFlags) {
    const flagLower = flag.flag.toLowerCase();

    if (flagLower.includes('role') || flagLower.includes('unclear')) {
      issues.push('weak_role_clarity');
    }
    if (flagLower.includes('leadership') && flagLower.includes('hidden')) {
      issues.push('buried_leadership');
    }
    if (flagLower.includes('impact')) {
      issues.push('hidden_impact');
    }
    if (flagLower.includes('progression') || flagLower.includes('growth')) {
      issues.push('missing_progression');
    }
    if (flagLower.includes('achievement') && flagLower.includes('buried')) {
      issues.push('buried_achievement');
    }
    if (flagLower.includes('context')) {
      issues.push('missing_context');
    }
    if (flagLower.includes('depth') || flagLower.includes('shallow')) {
      issues.push('shallow_depth');
    }
    if (flagLower.includes('authentic')) {
      issues.push('authenticity_gap');
    }
    if (flagLower.includes('resume') || flagLower.includes('jargon') || flagLower.includes('buzzword')) {
      issues.push('resume_speak');
    }
  }

  // ALWAYS detect issues from description text patterns (even when analysis fails)
  // This ensures we provide teaching content when LLM parsing fails

  // Check for vague language patterns
  const vaguePatterns = ['helped', 'assisted', 'worked on', 'participated', 'was involved', 'contributed to', 'various', 'many', 'some', 'stuff'];
  if (vaguePatterns.some(p => descriptionLower.includes(p))) {
    issues.push('vague_description');
  }

  // Check for missing numbers/quantification
  const hasNumbers = /\d+/.test(description);
  if (!hasNumbers && description.length > 20) {
    issues.push('missing_quantification');
  }

  // Check for weak role indicators
  const weakRoles = ['member', 'participant', 'part of', 'involved in'];
  if (weakRoles.some(r => descriptionLower.includes(r))) {
    issues.push('weak_role_clarity');
  }

  // Check for buried leadership (has leadership words but buried)
  const leadershipWords = ['founded', 'created', 'led', 'organized', 'managed', 'directed'];
  const hasLeadership = leadershipWords.some(w => descriptionLower.includes(w));
  if (hasLeadership && !descriptionLower.startsWith('led') && !descriptionLower.startsWith('founded') && !descriptionLower.startsWith('created')) {
    issues.push('buried_leadership');
  }

  // Check for missing impact
  const impactWords = ['increased', 'decreased', 'improved', 'raised', 'grew', 'reduced', 'saved', 'generated'];
  if (!impactWords.some(w => descriptionLower.includes(w)) && description.length > 30) {
    issues.push('hidden_impact');
  }

  // Check for resume speak / buzzwords
  const buzzwords = ['leverage', 'synergy', 'spearhead', 'facilitate', 'stakeholder', 'optimize', 'strategic', 'dynamic', 'proactive'];
  if (buzzwords.some(b => descriptionLower.includes(b))) {
    issues.push('resume_speak');
  }

  // Check for generic contribution patterns
  const genericPatterns = ['passionate about', 'dedicated to', 'committed to', 'love to help', 'enjoy helping'];
  if (genericPatterns.some(p => descriptionLower.includes(p))) {
    issues.push('generic_contribution');
  }

  // If description is very short, it's missing details
  if (description.length < 50) {
    issues.push('vague_description');
    issues.push('missing_quantification');
  }

  // Deduplicate and ensure at least one issue for weak descriptions
  const uniqueIssues = [...new Set(issues)];

  // If no issues detected but description quality is low, add default issues
  if (uniqueIssues.length === 0 && analysis.descriptionQuality.overallScore < 60) {
    uniqueIssues.push('vague_description');
    uniqueIssues.push('missing_quantification');
  }

  return uniqueIssues;
}

function getRelevantKnowledgeBase(issues: ActivityIssueType[]): string {
  const relevantBundles: ActivityTeachingBundle[] = [];

  for (const issue of issues) {
    const bundle = getTeachingForIssue(issue);
    if (bundle) {
      relevantBundles.push(bundle);
    }
  }

  // Format for prompt
  return relevantBundles.map(bundle => `
### ${bundle.issue_type.toUpperCase().replace(/_/g, ' ')}

**THE PROBLEM:**
${bundle.the_problem.headline}
${bundle.the_problem.explanation}

**WHY THE FIX WORKS:**
Psychology: ${bundle.why_this_works.psychology}
Research: ${bundle.why_this_works.research_insight}
${bundle.why_this_works.admissions_quote ? `"${bundle.why_this_works.admissions_quote}" - ${bundle.why_this_works.quote_source}` : ''}

**EXAMPLE TRANSFORMATIONS:**
${bundle.transformations.map(t => `
Before: "${t.before}"
After: "${t.after}"
Why it works: ${t.why_it_works}
`).join('\n')}
`).join('\n---\n');
}

function formatEnhancedPrompt(
  activity: ActivityWorkshopInput,
  analysis: ActivityAnalysis,
  studentContext?: ActivityWorkshopSessionInput['studentContext']
): string {
  const issues = detectIssuesFromAnalysis(analysis);
  const knowledgeBase = getRelevantKnowledgeBase(issues);

  return ENHANCED_TEACHING_PROMPT
    .replace('{{title}}', activity.title)
    .replace('{{description}}', activity.description)
    .replace('{{role}}', activity.role || 'Not specified')
    .replace('{{category}}', activity.category || 'Not specified')
    .replace('{{hoursPerWeek}}', String(activity.hoursPerWeek || 'Not specified'))
    .replace('{{weeksPerYear}}', String(activity.weeksPerYear || 'Not specified'))
    .replace('{{yearsInvolved}}', String(activity.yearsInvolved || 'Not specified'))
    .replace('{{achievements}}', activity.achievements?.map(a => a.title).join(', ') || 'None listed')
    .replace('{{analysisJson}}', JSON.stringify(analysis, null, 2))
    .replace('{{intendedMajor}}', studentContext?.intendedMajor || 'Not specified')
    .replace('{{targetSchools}}', studentContext?.targetSchools?.join(', ') || 'Not specified')
    .replace('{{teachingKnowledgeBase}}', knowledgeBase || 'No specific teaching content matched.');
}


// ============================================================================
// ENHANCED ACTIVITY TEACHING SERVICE
// ============================================================================

export class EnhancedActivityTeachingService {
  private _anthropic: Anthropic | null = null;

  constructor() {
    // Lazy initialization - client created on first use
  }

  private get anthropic(): Anthropic {
    if (!this._anthropic) {
      this._anthropic = getAnthropicClient();
    }
    return this._anthropic;
  }

  /**
   * Provide enhanced teaching for a single activity
   */
  async teachActivity(
    activity: ActivityWorkshopInput,
    analysis: ActivityAnalysis,
    portfolioAnalysis: PortfolioAnalysis,
    studentContext?: ActivityWorkshopSessionInput['studentContext']
  ): Promise<EnhancedActivityTeaching> {
    const prompt = formatEnhancedPrompt(activity, analysis, studentContext);

    try {
      console.log(`[EnhancedTeaching] Processing: ${activity.title}`);

      const response = await this.anthropic.messages.create({
        model: SONNET_MODEL,
        max_tokens: MAX_TOKENS_ENHANCED_TEACHING,
        messages: [{ role: 'user', content: prompt }],
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

      // Use robust parser - this should ALWAYS succeed for Claude JSON
      const parsed = parseClaudeJSON<any>(responseText, `EnhancedTeaching:${activity.title}`);

      // Process and enrich response
      return this.enrichTeachingResponse(activity, analysis, parsed);

    } catch (error) {
      // This should be extremely rare with the robust parser
      console.error('[EnhancedTeaching] Error:', error);
      return this.createFallbackTeaching(activity, analysis);
    }
  }

  /**
   * Enrich the parsed response with citations and formatting
   */
  private enrichTeachingResponse(
    activity: ActivityWorkshopInput,
    analysis: ActivityAnalysis,
    parsed: any
  ): EnhancedActivityTeaching {
    const tierCitations = activityCitationService.getCitationsForTier(
      activity,
      parsed.tierExplanation?.assignedTier || analysis.classification.tier
    );

    return {
      activityId: activity.id,

      tierExplanation: {
        assignedTier: parsed.tierExplanation?.assignedTier || analysis.classification.tier,
        headline: parsed.tierExplanation?.headline || `Tier ${analysis.classification.tier} Activity`,
        fullExplanation: activityCitationService.attachCitations(
          parsed.tierExplanation?.fullExplanation || analysis.classification.tierReasoning,
          tierCitations
        ),
        whatThisTierMeans: parsed.tierExplanation?.whatThisTierMeans || this.getDefaultTierDescription(analysis.classification.tier),
        whatHigherTierLooksLike: parsed.tierExplanation?.whatHigherTierLooksLike || this.getNextTierDescription(analysis.classification.tier),
        saraHarbersonCriteria: parsed.tierExplanation?.saraHarbersonCriteria || [],
      },

      detailPriorities: {
        whatAdmissionersLookFor: parsed.detailPriorities?.whatAdmissionersLookFor || 'Impact, leadership, and genuine engagement',
        criticalDetails: parsed.detailPriorities?.criticalDetails || [],
        valuableDetails: parsed.detailPriorities?.valuableDetails || [],
        avoidThese: parsed.detailPriorities?.avoidThese || [],
      },

      issueTeaching: this.processIssueTeaching(activity, analysis, parsed.issueTeaching || []),

      descriptionTransformation: {
        original: activity.description,
        problems: parsed.descriptionTransformation?.problems || [],
        optimized: {
          version: parsed.descriptionTransformation?.optimized?.version || activity.description.slice(0, 150),
          characterCount: parsed.descriptionTransformation?.optimized?.characterCount || Math.min(activity.description.length, 150),
          changesExplained: parsed.descriptionTransformation?.optimized?.changesExplained || [],
        },
        alternatives: parsed.descriptionTransformation?.alternatives || [],
      },

      narrativeGuidance: {
        howToTalkAboutThis: activityCitationService.attachCitations(
          parsed.narrativeGuidance?.howToTalkAboutThis || 'Focus on your specific contribution and measurable impact.',
          []
        ),
        uniqueAngle: {
          angle: parsed.narrativeGuidance?.uniqueAngle?.angle || 'Your unique perspective',
          whyThisStandsOut: parsed.narrativeGuidance?.uniqueAngle?.whyThisStandsOut || 'Personalize with your specific experience',
        },
        connectionToStory: parsed.narrativeGuidance?.connectionToStory || 'Connect to your broader application narrative',
        interviewGuidance: parsed.narrativeGuidance?.interviewGuidance || {
          likelyQuestions: ['Tell me about this activity', 'What did you learn?', 'Why did you continue?'],
          responseFramework: {
            opening: 'Start with a specific moment or insight',
            middlePoints: ['Describe your contribution', 'Share measurable outcomes', 'Explain personal growth'],
            closing: 'Connect to future goals',
          },
          pitfallsToAvoid: ['Being too general', 'Focusing only on achievements', 'Sounding rehearsed'],
          authenticityTips: ['Use specific examples', 'Share honest challenges', 'Express genuine interest'],
        },
        essayPotential: parsed.narrativeGuidance?.essayPotential || {
          recommended: false,
          strength: 'medium',
          angle: 'Explore if there\'s a distinctive story',
          whyThisWorks: 'Could work if you have a unique perspective',
          cautionAreas: ['Avoid clichés', 'Make it personal'],
        },
      },

      upgradePathway: parsed.upgradePathway || undefined,
    };
  }

  /**
   * Process issue teaching with knowledge base enrichment
   */
  private processIssueTeaching(
    activity: ActivityWorkshopInput,
    analysis: ActivityAnalysis,
    issueTeachings: any[]
  ): EnhancedIssueTeaching[] {
    // If no issues from LLM, detect from analysis and use knowledge base
    if (!issueTeachings || issueTeachings.length === 0) {
      const detectedIssues = detectIssuesFromAnalysis(analysis);
      return detectedIssues.slice(0, 3).map(issueType => this.createIssueTeachingFromKnowledgeBase(activity, issueType));
    }

    // Enrich LLM issues with knowledge base
    return issueTeachings.map(issue => {
      const knowledgeBundle = getTeachingForIssue(issue.issueType);

      return {
        issueType: issue.issueType,
        theProblem: {
          headline: issue.theProblem?.headline || knowledgeBundle?.the_problem.headline || 'Improvement opportunity identified',
          explanation: issue.theProblem?.explanation || knowledgeBundle?.the_problem.explanation || 'This aspect could be strengthened.',
          admissionsImpact: issue.theProblem?.admissionsImpact || knowledgeBundle?.the_problem.admissions_impact || 'May affect how AOs perceive this activity.',
          inYourDescription: issue.theProblem?.inYourDescription || 'See your current description for examples.',
        },
        whyThisWorks: {
          psychology: issue.whyThisWorks?.psychology || knowledgeBundle?.why_this_works.psychology || 'Strong descriptions create lasting impressions.',
          researchInsight: issue.whyThisWorks?.researchInsight || knowledgeBundle?.why_this_works.research_insight || 'Research supports specific, quantified descriptions.',
          admissionsQuote: issue.whyThisWorks?.admissionsQuote || knowledgeBundle?.why_this_works.admissions_quote,
          quoteSource: issue.whyThisWorks?.quoteSource || knowledgeBundle?.why_this_works.quote_source,
        },
        whatToDo: {
          principle: issue.whatToDo?.principle || 'Apply specific, measurable details',
          steps: issue.whatToDo?.steps || knowledgeBundle?.detail_priorities.must_include || [],
          prioritizeThese: issue.whatToDo?.prioritizeThese || [],
        },
        transformationExamples: {
          yourText: issue.transformationExamples?.yourText || {
            before: activity.description.slice(0, 80),
            after: 'See optimized version above',
            principle: 'Apply the teaching principles',
            whyItWorks: 'Creates clearer, more impactful impression',
          },
          similarExamples: this.getSimilarExamples(issue.issueType, knowledgeBundle),
        },
        difficulty: issue.difficulty || knowledgeBundle?.difficulty || 'moderate',
        timeToFix: issue.timeToFix || knowledgeBundle?.time_to_fix || '10-15 minutes',
        priority: issue.priority || 'medium',
      };
    });
  }

  /**
   * Get similar examples from knowledge base
   */
  private getSimilarExamples(issueType: ActivityIssueType, bundle: ActivityTeachingBundle | null): any[] {
    if (!bundle?.transformations) return [];

    return bundle.transformations.slice(0, 2).map(t => ({
      context: t.context,
      before: t.before,
      after: t.after,
      principle: t.principle_applied,
      whyItWorks: t.why_it_works,
      highlightedChange: t.highlighted_change,
    }));
  }

  /**
   * Create issue teaching from knowledge base when LLM fails
   */
  private createIssueTeachingFromKnowledgeBase(
    activity: ActivityWorkshopInput,
    issueType: ActivityIssueType
  ): EnhancedIssueTeaching {
    const bundle = getTeachingForIssue(issueType);

    if (!bundle) {
      return this.createGenericIssueTeaching(activity, issueType);
    }

    return {
      issueType: issueType,
      theProblem: {
        headline: bundle.the_problem.headline,
        explanation: bundle.the_problem.explanation,
        admissionsImpact: bundle.the_problem.admissions_impact,
        inYourDescription: `Review your description for instances of: ${bundle.the_problem.common_manifestations.slice(0, 2).join(', ')}`,
      },
      whyThisWorks: {
        psychology: bundle.why_this_works.psychology,
        researchInsight: bundle.why_this_works.research_insight,
        admissionsQuote: bundle.why_this_works.admissions_quote,
        quoteSource: bundle.why_this_works.quote_source,
      },
      whatToDo: {
        principle: `Apply the ${issueType.replace(/_/g, ' ')} fix`,
        steps: bundle.detail_priorities.must_include,
        prioritizeThese: bundle.detail_priorities.must_include.slice(0, 2),
      },
      transformationExamples: {
        yourText: {
          before: activity.description.slice(0, 80),
          after: 'Apply the transformation principles below',
          principle: bundle.transformations[0]?.principle_applied || 'Specificity and impact',
          whyItWorks: bundle.transformations[0]?.why_it_works || 'Creates clearer impression',
        },
        similarExamples: bundle.transformations.slice(0, 2).map(t => ({
          context: t.context,
          before: t.before,
          after: t.after,
          principle: t.principle_applied,
          whyItWorks: t.why_it_works,
          highlightedChange: t.highlighted_change,
        })),
      },
      difficulty: bundle.difficulty,
      timeToFix: bundle.time_to_fix,
      priority: 'medium',
    };
  }

  /**
   * Create generic issue teaching as ultimate fallback
   */
  private createGenericIssueTeaching(
    activity: ActivityWorkshopInput,
    issueType: ActivityIssueType
  ): EnhancedIssueTeaching {
    return {
      issueType,
      theProblem: {
        headline: `Opportunity to strengthen: ${issueType.replace(/_/g, ' ')}`,
        explanation: 'This aspect of your description could be improved to make a stronger impression on admissions officers.',
        admissionsImpact: 'Improving this will help AOs better understand your contribution and impact.',
        inYourDescription: 'Review your current description for areas to add specificity.',
      },
      whyThisWorks: {
        psychology: 'Specific, concrete details are more memorable and credible than general claims.',
        researchInsight: 'Admissions research consistently shows that specific descriptions outperform vague ones.',
      },
      whatToDo: {
        principle: 'Add specificity and measurable outcomes',
        steps: [
          'Identify vague language in your description',
          'Replace with specific numbers and outcomes',
          'Show your unique contribution clearly',
        ],
        prioritizeThese: ['Quantified impact', 'Clear role definition'],
      },
      transformationExamples: {
        yourText: {
          before: activity.description.slice(0, 80),
          after: 'Apply the principles above to your specific text',
          principle: 'Specificity and impact',
          whyItWorks: 'Creates clearer, more memorable impression',
        },
        similarExamples: [],
      },
      difficulty: 'moderate',
      timeToFix: '10-15 minutes',
      priority: 'medium',
    };
  }

  /**
   * Create fallback teaching when API fails
   */
  private createFallbackTeaching(
    activity: ActivityWorkshopInput,
    analysis: ActivityAnalysis
  ): EnhancedActivityTeaching {
    const detectedIssues = detectIssuesFromAnalysis(analysis);

    return {
      activityId: activity.id,
      tierExplanation: {
        assignedTier: analysis.classification.tier,
        headline: `Tier ${analysis.classification.tier}: ${analysis.classification.tierReasoning.slice(0, 80)}`,
        fullExplanation: {
          text: analysis.classification.tierReasoning,
          citations: [],
        },
        whatThisTierMeans: this.getDefaultTierDescription(analysis.classification.tier),
        whatHigherTierLooksLike: this.getNextTierDescription(analysis.classification.tier),
        saraHarbersonCriteria: [],
      },
      detailPriorities: {
        whatAdmissionersLookFor: 'Impact, leadership, and genuine engagement with specific evidence',
        criticalDetails: [],
        valuableDetails: [],
        avoidThese: ['Vague language', 'Unsupported claims', 'Generic descriptions'],
      },
      issueTeaching: detectedIssues.slice(0, 3).map(issue =>
        this.createIssueTeachingFromKnowledgeBase(activity, issue)
      ),
      descriptionTransformation: {
        original: activity.description,
        problems: [],
        optimized: {
          version: activity.description.slice(0, 150),
          characterCount: Math.min(activity.description.length, 150),
          changesExplained: [],
        },
        alternatives: [],
      },
      narrativeGuidance: {
        howToTalkAboutThis: {
          text: 'Focus on specific contributions and measurable outcomes when discussing this activity.',
          citations: [],
        },
        uniqueAngle: {
          angle: 'Your personal experience and growth',
          whyThisStandsOut: 'Personalize with specific moments and insights',
        },
        connectionToStory: 'Connect to your broader interests and goals',
        interviewGuidance: {
          likelyQuestions: ['Tell me about this activity', 'What did you learn?', 'Why did you get involved?'],
          responseFramework: {
            opening: 'Start with a specific moment or insight',
            middlePoints: ['Describe your contribution', 'Share outcomes', 'Explain growth'],
            closing: 'Connect to future goals',
          },
          pitfallsToAvoid: ['Being too general', 'Only listing achievements'],
          authenticityTips: ['Use specific examples', 'Be honest about challenges'],
        },
        essayPotential: {
          recommended: false,
          strength: 'medium',
          angle: 'Explore unique angles if available',
          whyThisWorks: 'Could work with the right personal story',
          cautionAreas: ['Avoid clichés'],
        },
      },
    };
  }

  /**
   * Get default tier description
   */
  private getDefaultTierDescription(tier: ActivityTier): string {
    const descriptions: Record<ActivityTier, string> = {
      1: 'Tier 1 activities show national or international recognition with exceptional achievement that places the student in the top 1% of their field.',
      2: 'Tier 2 activities demonstrate state or regional recognition, or significant leadership with measurable impact beyond the school level.',
      3: 'Tier 3 activities show school-level leadership or consistent, committed participation with clear contribution and growth.',
      4: 'Tier 4 activities represent general participation in organized activities, showing engagement but without distinctive leadership or recognition.',
    };
    return descriptions[tier];
  }

  /**
   * Get next tier description
   */
  private getNextTierDescription(tier: ActivityTier): string {
    const nextDescriptions: Record<ActivityTier, string> = {
      1: 'You\'re at the top tier. Focus on deepening impact and ensuring your description captures the full significance.',
      2: 'To reach Tier 1: Achieve national/international recognition, compete at the highest levels, or create impact that extends nationally.',
      3: 'To reach Tier 2: Pursue state/regional recognition, take on significant leadership that affects change beyond your school, or achieve measurable external validation.',
      4: 'To reach Tier 3: Take on leadership roles, demonstrate progression over time, and show clear measurable contribution to your organization.',
    };
    return nextDescriptions[tier];
  }
}

// Export singleton
export const enhancedActivityTeachingService = new EnhancedActivityTeachingService();
