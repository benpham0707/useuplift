// @ts-nocheck
/**
 * Activity Teaching Layer Service
 *
 * The PRESCRIPTION layer that builds on diagnostic scoring analysis.
 * Uses Sonnet for quality-critical generation.
 *
 * ARCHITECTURE: Two-Stage Analysis (interconnected)
 * 1. Portfolio Scoring (Haiku) → DIAGNOSIS: Where you stand, scores, observations
 * 2. Teaching Layer (Sonnet) → PRESCRIPTION: How to improve, timeline, actions
 *
 * Philosophy:
 * - Scoring tells you WHERE YOU STAND (diagnosis)
 * - Teaching tells you HOW TO IMPROVE (prescription)
 * - No repetition between stages — teaching BUILDS ON scoring output
 *
 * Grade-Level Timeline Awareness:
 * - Freshmen (9): Long runway, can pursue new activities, build from scratch
 * - Sophomores (10): Time to deepen, develop leadership, start planning
 * - Juniors (11): Focus on elevation, maximize existing activities
 * - Seniors (12): Description craft only — activities are set
 *
 * Key Outputs:
 * - Concrete activity description rewrites (150 chars)
 * - Grade-appropriate strategic priorities
 * - Principle explanations (why this matters)
 * - Research-backed citations
 * - Focused action items the student can actually control
 *
 * Cost: ~$0.04-0.06 per analysis (Sonnet)
 */

import { callClaude } from '../../../../../lib/llm/claude';
import {
  TeachingLayerInput,
  TeachingLayerResult,
  TeachingLayerOutput,
  ActivityTransformation,
  ConnectionStrategy,
  StrategicPriority,
  SpikeReinforcement,
  CraftTeaching,
} from './teachingLayerTypes';
import { PortfolioScoreRubric, ActivityScoreRubric } from './types';
import { ActivityWorkshopInput, ApplicationPlatform, getDescriptionCharLimit, getPlatformName } from '../types';

// Teaching Sophistication Router — adaptive teaching depth by description score
import {
  type TeachingSophistication,
  type SophisticationMap,
  buildSophisticationMap,
  getDominantSophistication,
  getSophisticationPromptBlock,
  getSystemSophisticationDirective,
} from './teachingSophisticationRouter';

// Robust JSON parser with jsonrepair fallback
import { parseClaudeJSON } from '../../../../commonAppWorkshop/utils/jsonParser';

// Expertise teaching formatters for prompt injection
import {
  buildExpertiseTeachingBlock,
  buildExemplarBlock,
  getAdvancedTeachingBundle,
  buildActivityExpertContext,
} from '../expertSystemPrompts';
import type { ExpertKnowledgeContext } from '../expertCounselorKnowledgeBase';

// Import knowledge databases for research backing
import {
  SPIKE_DEFINITIONS,
  RECOMMENDATION_TEMPLATES,
} from '../../../knowledge/spikeDetectionSystem';
import {
  IMPACT_TIER_DESCRIPTIONS,
  VERIFICATION_STANDARDS,
} from '../../../knowledge/impactMetricsFramework';
import {
  COHERENCE_GREEN_FLAGS,
  COHERENCE_RED_FLAGS,
} from '../../../knowledge/majorActivityAlignment';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_TRANSFORMATIONS = 3;

/**
 * Teaching principles to apply based on issue type
 */
const TEACHING_PRINCIPLES = {
  passive_voice: {
    name: 'Active Voice Command',
    whyItMatters:
      'Active verbs (created, led, built) signal ownership and initiative. Passive verbs (participated, helped, assisted) signal following, not leading. Admissions officers read thousands of applications—active voice cuts through.',
  },
  missing_quantification: {
    name: 'Specific Numbers Tell Stories',
    whyItMatters:
      'Numbers make achievements concrete and memorable. "Helped students" is forgettable; "Tutored 45 students, 23 improved by 1+ letter grade" is proof of impact. Numbers also suggest you actually tracked and cared about outcomes.',
  },
  no_impact: {
    name: 'The "So What" Test',
    whyItMatters:
      'Every activity description must answer "So what did this accomplish?" If a reader finishes and wonders why it matters, you\'ve lost them. Lead with outcome, not process.',
  },
  generic_language: {
    name: 'Specificity Creates Memorability',
    whyItMatters:
      'Generic language ("helped the community") could describe anyone. Specific language ("reduced cafeteria food waste 40% through composting system I designed") can only describe you. Admissions officers remember specifics.',
  },
  voice_inconsistency: {
    name: 'Authentic Voice Throughout',
    whyItMatters:
      'When your best activities sound like YOU and your weakest sound like a counselor template, readers notice. Voice consistency signals genuine engagement across all activities, not selective enthusiasm.',
  },
  narrative_disconnection: {
    name: 'Every Activity Supports Your Story',
    whyItMatters:
      'Disconnected activities dilute your spike. Each description should subtly reinforce your core narrative. An environmental club can support a "systems builder" spike if framed as "designed waste tracking system."',
  },
};

/**
 * Research citations to use for backing
 */
const RESEARCH_CITATIONS = {
  mit_t_shaped: {
    source: 'elite_school_guidance' as const,
    sourceName: 'MIT Admissions Office',
    insight: 'MIT explicitly values "T-shaped" students: deep expertise in one area with breadth across others.',
    application: 'Your spike must be demonstrably deep. Supporting activities should show breadth without competing for depth.',
  },
  stanford_intellectual_vitality: {
    source: 'elite_school_guidance' as const,
    sourceName: 'Stanford Admissions',
    insight: 'Stanford seeks "intellectual vitality"—genuine curiosity that extends beyond requirements.',
    application: 'Activities should demonstrate pursuit of knowledge for its own sake, not just credential accumulation.',
  },
  harvard_excellence: {
    source: 'elite_school_guidance' as const,
    sourceName: 'Harvard Tips for Applicants',
    insight: 'Harvard values "excellence in some endeavor" over well-rounded mediocrity.',
    application: 'One exceptional achievement beats five good ones. Focus on deepening your strongest activity.',
  },
  harberson_tiers: {
    source: 'counselor_consensus' as const,
    sourceName: 'Sara Harberson, Former Penn Dean',
    insight: 'Activities fall into 4 tiers: Tier 1 (national), Tier 2 (state), Tier 3 (school), Tier 4 (participation). One Tier 1 can carry an application.',
    application: 'Prioritize elevating your highest-tier activity before improving lower-tier ones.',
  },
  verb_research: {
    source: 'research_study' as const,
    sourceName: 'College Essay Efficacy Studies',
    insight: 'Applications with predominantly active verbs receive 23% higher reader ratings than those with passive voice.',
    application: 'Replace every "participated in" with what you actually did: led, created, developed, launched.',
  },
  quantification_impact: {
    source: 'admissions_officer' as const,
    sourceName: 'Anonymous AO Interviews',
    insight: 'Admissions officers report specific numbers are "anchor points" they remember and cite in committee.',
    application: 'If you can measure it, include it. If you can\'t, find a way to quantify even qualitative impact.',
  },
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class ActivityTeachingLayerService {
  /**
   * Generate deep teaching content from scoring results
   */
  async generateTeaching(input: TeachingLayerInput): Promise<TeachingLayerResult> {
    const startTime = Date.now();
    console.log('[TeachingLayer] Starting teaching generation...');

    try {
      const { scoringRubric, activities, studentContext, options } = input;
      const maxTransformations = options?.maxTransformations ?? DEFAULT_MAX_TRANSFORMATIONS;

      // Identify activities needing transformation (score < 7 or specific focus)
      const activitiesToTransform = this.identifyActivitiesForTransformation(
        scoringRubric,
        activities,
        options?.focusActivities,
        maxTransformations
      );

      console.log(`[TeachingLayer] Transforming ${activitiesToTransform.length} activities`);

      // Build sophistication map from description scores
      const sophisticationMap = buildSophisticationMap(
        activitiesToTransform.map(a => ({
          activityId: a.activityId,
          descriptionScoreTotal: a.descriptionScore.total,
        }))
      );
      const dominantSophistication = getDominantSophistication(sophisticationMap);
      console.log(`[TeachingLayer] Sophistication: dominant=${dominantSophistication}, map=${[...sophisticationMap.entries()].map(([id, c]) => `${id}=${c.level}`).join(', ')}`);

      // Build the teaching prompt
      const prompt = this.buildTeachingPrompt(
        scoringRubric,
        activities,
        activitiesToTransform,
        studentContext,
        options,
        input.targetPlatform,
        sophisticationMap,
        input.expertiseData,
        input.expertContext
      );

      // Call Claude Sonnet for quality teaching (with 1 retry on empty/parse-failed result)
      const callOpts = {
        systemPrompt: this.getSystemPrompt(studentContext?.currentGrade, input.targetPlatform, dominantSophistication),
        model: 'claude-sonnet-4-5-20250929' as const,
        cacheSystemPrompt: true,
        maxTokens: 12000, // 5 activities × complex JSON schema; may truncate at tail, jsonrepair recovers gracefully
        temperature: 0.3,
        timeoutMs: 300000, // 5 min — 12K structured JSON + prompt processing (~268s observed)
      };

      let teaching: TeachingLayerOutput | null = null;

      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await callClaude(
          attempt === 0 ? prompt : `${prompt}\n\nIMPORTANT: You MUST respond with ONLY valid JSON. No markdown, no code fences, no explanatory text. Start your response with { and end with }.`,
          { ...callOpts, temperature: attempt === 0 ? 0.3 : 0.1 }
        );

        if (!response.content) {
          if (attempt === 0) {
            console.warn('[TeachingLayer] Empty response on attempt 1, retrying...');
            continue;
          }
          return { success: false, error: 'Failed to generate teaching content after 2 attempts' };
        }

        // Truncation detection — stopReason 'max_tokens' means JSON is incomplete
        if (response.stopReason === 'max_tokens') {
          console.warn(`[TeachingLayer] Response TRUNCATED (stop_reason=max_tokens, ${response.usage?.output_tokens} tokens). Ends with: "${response.content.slice(-80)}"`);
        }

        // parseTeachingResponse catches errors internally and returns minimal output
        // (0 transformations) on parse failure — detect this and retry
        const result = this.parseTeachingResponse(
          response.content,
          scoringRubric,
          activitiesToTransform,
          response.usage,
          input.targetPlatform
        );

        if (result.activityTransformations.length > 0 || attempt === 1) {
          teaching = result;
          break;
        }

        // Empty transformations on first attempt — likely parse failure, retry
        console.warn(`[TeachingLayer] 0 transformations on attempt 1 (expected ${activitiesToTransform.length}), retrying with stricter prompt...`);
      }

      if (!teaching) {
        return { success: false, error: 'Failed to generate teaching after 2 attempts' };
      }

      const timing = { totalMs: Date.now() - startTime };
      console.log(`[TeachingLayer] Teaching generated in ${timing.totalMs}ms`);

      return {
        success: true,
        teaching,
        timing,
      };
    } catch (error) {
      console.error('[TeachingLayer] Error generating teaching:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Identify which activities need transformation
   *
   * Strategy: Every activity deserves a polished description. We showcase ALL activities
   * in their best light — no activity is excluded from transformation.
   *
   * Priority order for transformation:
   * - Activities with the biggest gap between activity quality and description quality (highest ROI)
   * - Activities scoring below 7 (most room for improvement)
   * - All remaining activities that could benefit from description polish
   *
   * We NEVER exclude weak activities — those need the MOST help with description craft
   * to present them in their best possible light.
   */
  private identifyActivitiesForTransformation(
    rubric: PortfolioScoreRubric,
    activities: ActivityWorkshopInput[],
    focusIds?: string[],
    maxCount: number = DEFAULT_MAX_TRANSFORMATIONS
  ): ActivityScoreRubric[] {
    // If specific focus activities requested, prioritize those
    if (focusIds && focusIds.length > 0) {
      return rubric.activityScores
        .filter((a) => focusIds.includes(a.activityId))
        .slice(0, maxCount);
    }

    // ALL activities are candidates — every one deserves a polished description
    // Sort by transformation priority: biggest description gaps first, then lowest scores
    const candidates = rubric.activityScores
      .filter((a) => {
        // Include any activity where description could improve
        if (a.descriptionScore.total < 9) return true;

        // Include strong activities where description notably lags activity score
        if (a.activityScore.total - a.descriptionScore.total >= 2) return true;

        return false;
      })
      // Sort by ROI potential: activities with biggest description gap first,
      // then by lowest combined score (weakest activities need the most help)
      .sort((a, b) => {
        const aGap = a.activityScore.total - a.descriptionScore.total;
        const bGap = b.activityScore.total - b.descriptionScore.total;
        if (bGap !== aGap) return bGap - aGap; // Biggest description gap first
        return a.combinedScore.total - b.combinedScore.total; // Then weakest activities first
      });

    return candidates.slice(0, maxCount);
  }

  /**
   * Build the system prompt for teaching generation
   */
  private getSystemPrompt(currentGrade?: number, targetPlatform?: ApplicationPlatform, dominantSophistication?: TeachingSophistication): string {
    const gradeContext = this.getGradeContext(currentGrade, targetPlatform);
    const charLimit = getDescriptionCharLimit(targetPlatform);
    const platformName = getPlatformName(targetPlatform);
    const sophisticationDirective = dominantSophistication
      ? getSystemSophisticationDirective(dominantSophistication)
      : '';

    return `You are an elite college admissions essay coach with 20+ years of experience helping students get into Harvard, Stanford, MIT, and other top schools.

## YOUR ROLE: THE PRESCRIPTION LAYER

The student has already received a DIAGNOSTIC analysis (scores, observations, where they stand). Your job is to provide the PRESCRIPTION — specific, actionable guidance on HOW to improve. Don't repeat the diagnosis; build on it.

IMPORTANT:
- The diagnosis told them WHERE they stand. You tell them HOW to improve.
- Use second person ("you/your") throughout. Speak directly to the student.
- Focus on what the student can actually CONTROL or AIM FOR.
- Don't repeat information from the scoring layer — extend it with actionable guidance.
${sophisticationDirective ? `\n## TEACHING SOPHISTICATION LEVEL\n${sophisticationDirective}\n` : ''}
## GRADE-LEVEL TIMELINE AWARENESS
${gradeContext}

## DESCRIPTION REWRITE PRINCIPLES:
1. Every rewrite must be EXACTLY ${charLimit} characters or fewer (${platformName} hard limit)
2. Use active verbs: created, led, built, developed, launched (never: participated, helped, assisted)
3. Include specific numbers whenever possible
4. Answer the "so what?" - what was the outcome/impact?
5. Connect to your spike narrative when possible
6. Maintain authentic student voice (not consultant-polished)

## WRITING FORMAT — MATCH FORMAT TO ACTIVITY TYPE:
Identify the activity category FIRST, then apply its specific format guidance when rewriting.

### 1. STEM/RESEARCH (lab research, independent projects, science fairs, coding, engineering, competitions):
→ Technical specificity + output. AOs at STEM schools know the hierarchy cold.
  FORMULA: [YOUR method/technique]; [scope]; [output — paper, award, product]; [validation + selectivity denominator]

  **Lab/Mentored Research:**
  GOOD: "Under Dr. Chen, optimized CRISPR protocols for zebrafish gene editing; 50+ microinjections; results inform Parkinson's study"
  GOOD: "Performed LC-MS on tumor samples; identified 3 dysregulated pathways; data contributed to 2 published studies"

  **Independent Research:**
  GOOD: "Designed survey (n=300) on teen social media anxiety; self-taught stats in Python; published in peer-reviewed journal"

  **Science Competitions** (STS > ISEF Grand > ISEF Category > STS Semi > State > Regional):
  GOOD: "Regeneron STS Scholar (top 40 of 1,949); developed protein-folding algorithm; presented at Natl Academy of Sciences"

  **Math/CS Competitions** (USAMO/IMO > AIME > AMC; USACO Platinum > Gold > Silver):
  GOOD: "USAMO Qualifier (top 500 of 300K); AIME 12/15; invited to Math Olympiad Summer Program"

  **Coding/Engineering Projects:**
  GOOD: "Developed iOS mental health app (CBT + mood tracking); 2,500+ downloads, 4.8★; adopted by school wellness program"

  **Publications:** "published in [Journal]" > "co-authored in [Journal]" > "under review at [Journal]" > "submitted to [Journal]"

  TEACH: Title in position field; description = what you actually DID. "Assisted in lab" = Tier 4; "Designed PCR protocol reducing false positives 30%" = Tier 2. ALWAYS add selectivity denominators for competitions ("top 40 of 1,949"). Max 1-2 technical terms, rest accessible. Tool lists without output = red flag. For coding projects: translate to impact AOs understand (users, downloads, adoption).

### 2. LEADERSHIP/GOVERNMENT (student council, club president, team captain, org head):
→ What you CHANGED, not what you held. Title is in position field — description adds the delta.
  FORMULA: [How selected]; [what changed]; [quantified result]
  GOOD: "SC President: created anonymous feedback app (400+ monthly submissions); first successful policy change in 3 yrs"
  GOOD: "Founded Environmental Action Club (60 members); led campus plastic ban adopted by administration"
  TEACH: "Elected by peers" > "appointed." Progression arrows show growth: "member → VP → President." Duty lists without outcomes = worst pattern ("organized events, led meetings").

### 3. COMMUNITY SERVICE (volunteering, tutoring, mentoring, nonprofit):
→ Impact on OTHERS first. What changed for people served, not what student learned.
  FORMULA: [Who served + specificity]; [quantified outcome]; [sustainability]
  GOOD: "Tutor 8 middle schoolers weekly; avg grades C+ → B+; created study guides now used schoolwide"
  GOOD: "Founded free SAT prep for low-income students; 45 students/yr; avg score +120 pts; program in 3 schools"
  TEACH: Sustained 3+ yrs >> one-time events. Local impact >> voluntourism. Specific beneficiary details (age, number, context) >> "the community." Mission trips without follow-up = red flag.

### 4. WORK/EMPLOYMENT (paid jobs, family business, freelancing, entrepreneurship):
→ Scope + progression + one ownership detail. The "failed simulation effect" (Shemmassian): specifics AOs can't easily imagine.
  FORMULA: [Scope/volume]; [progression]; [one initiative YOU owned]
  GOOD: "Processed 300+ transactions/shift; trained 5 new cashiers; created closing checklist reducing errors 40%"
  GOOD: "Built lawn care business from scratch; 20 regular clients; hired 2 seasonal employees; $12K annual revenue"
  TEACH: Let hours fields handle time commitment. Description handles WHAT you did. Promotions = high-value signals. Never apologize for working — frame with business language. Entrepreneurial activities use startup vocabulary (revenue, clients, growth).

### 5. FAMILY RESPONSIBILITIES (caregiving, sibling care, translation, household management):
→ Specificity = competence, not pity. State facts with same confident fragment format as any activity.
  FORMULA: [Specific responsibilities]; [scope/frequency]; [skills demonstrated]
  GOOD: "Primary caregiver for 3 siblings (ages 4-9); manage routines, meals, homework; coordinate medical appointments"
  GOOD: "Family interpreter (Spanish/English) for medical, legal & school; navigate insurance systems; translate documents"
  TEACH: Frame as SKILLS, not sacrifice. The hours fields (25 hrs/wk, 52 wk/yr) communicate necessity — description communicates competence. Never use victimhood framing ("had to" / "forced to").

### 6. ARTS/CREATIVE (music, visual arts, theater, film, dance, creative writing):
→ Verifiable credentials + body of work. AOs can't evaluate art quality from text — external validation critical.
  FORMULA: [Medium + years]; [highest recognition + selectivity]; [output volume/audience]; [teaching if applicable]
  GOOD: "Cello (10 yrs); All-State principal (selected from 2,400); solo recitals 3/yr; teach 5 students"
  GOOD: "Oil painting; Scholastic Gold Key (Regional); exhibited 3 juried galleries; 40+ works; $2K commissions"
  TEACH: Selectivity context transforms claims — "All-State (selected from 2,400)" >> "All-State" alone. Juried exhibitions >> open shows. Teaching = mastery signal. Keep emotion for essays — description is the fact sheet.

### 7. ATHLETICS (team sports, individual sports, club/recreational):
→ Non-recruited: character + growth trajectory. Recruited: stats + rankings.
  FORMULA (non-recruited): [Position + years]; [progression]; [leadership]; [team impact]
  FORMULA (recruited): [Stats/times/rankings]; [selection context]; [records]
  GOOD: "Starting midfielder (3 yrs); 12 assists/season (team lead); captain (elected by teammates); team 8th → 2nd"
  GOOD: "JV (soph) → Varsity starter (jr) → Captain (sr); created offseason conditioning; cut injuries 60%"
  TEACH: Growth arcs show character. Stats need denominators ("3rd of 180" >> "3rd place"). "Captain" without evidence of what changed = discounted. Practice hours establish commitment parity.

### UNIVERSAL RULES (all categories):

BAD (always avoid):
  "I founded the first computer science club at my school and taught 25 students Python and web development."
  → Fails the "1,000 student test" (PrepScholar): could 1,000 students write this? If yes, rewrite.

CHARACTER EFFICIENCY:
- Abbreviations: hrs/wk, yr, avg, dept, natl, regl, govt, dev, mgmt, org
- Symbols: & (not "and"), / (not "or"), + (not "more than"), → (for progression)
- Parentheses for context: (60 participants), ($3K raised), (3 yrs), (selected from 2,400)
- Drop articles (the/a/an) and pronouns (I/my/we) — start with verbs or context
- Numbers not words: "8" not "eight", "$3K" not "$3,000"
- DON'T repeat position/org fields — description adds NEW info only
- Semicolons to chain distinct claims efficiently
- A brief "why" clause can be worth the characters: "after realizing zero STEM options existed" shows initiative

## STRATEGIC PHILOSOPHY: DEEPEN THE SPIKE, SHOWCASE EVERYTHING
- List ALL your activities — every Common App slot is valuable real estate.
- Priority 1: Deepen the spike — help strong activities become exceptional
- Priority 2: Amplify through description craft — connect mid-tier activities to the spike
- Priority 3: Elevate weaker activities — craft the most compelling description possible
- NEVER tell a student to remove or minimize an activity.

## TEACHING APPROACH:
- Don't just say "add numbers" — show exactly what numbers to add
- Don't just say "use active verbs" — rewrite with the active verbs
- Explain WHY each change matters to admissions officers
- Cite research and admissions wisdom to back recommendations
- Be direct and specific, not vague and general

OUTPUT FORMAT:
Respond in valid JSON matching the requested structure exactly.`;
  }

  /**
   * Get grade-appropriate context for timeline guidance
   */
  private getGradeContext(grade?: number, targetPlatform?: ApplicationPlatform): string {
    const limit = getDescriptionCharLimit(targetPlatform);
    const platform = getPlatformName(targetPlatform);

    if (!grade) {
      return `Grade level not specified. Provide general guidance, but note that recommendations should be adjusted based on when the student is applying.`;
    }

    const contexts: Record<number, string> = {
      9: `FRESHMAN (Grade 9) — Maximum Runway
- You have 3+ years before applications. This is the time to EXPLORE and BUILD.
- Recommendations can include starting new activities, trying different areas to find your spike.
- Focus on laying foundations that can be deepened over time.
- It's OK to suggest longer-term projects (research, businesses, organizations).
- "Start now" recommendations are highly appropriate.`,

      10: `SOPHOMORE (Grade 10) — Time to Deepen
- You have 2 years before applications. Time to FOCUS and DEVELOP.
- Start narrowing toward your spike — quality over quantity.
- Seek leadership positions, start planning for junior year elevation.
- Can still start new activities if they align with emerging spike.
- Medium-term projects (6-18 months) are appropriate.`,

      11: `JUNIOR (Grade 11) — Maximize and Elevate
- You have ~1 year before applications. Focus on ELEVATION of existing activities.
- Push for highest recognition levels in your spike activities.
- Less time for new activities unless they directly strengthen your spike.
- Focus on awards, competitions, credentials that can be achieved this year.
- Description craft becomes more important — you're presenting what you have.`,

      12: `SENIOR (Grade 12) — Description Craft Only
- You're applying NOW. Focus purely on PRESENTATION.
- Activity changes are essentially done — work with what you have.
- ALL recommendations should be about description craft and framing.
- Don't suggest new activities or achievements — there's no time.
- Help each activity shine in ${limit} characters (${platform}).`,
    };

    return contexts[grade] || contexts[11]; // Default to junior if unusual grade
  }

  /**
   * Get human-readable grade label
   */
  private getGradeLabel(grade?: number): string {
    if (!grade) return 'Not specified';
    const labels: Record<number, string> = {
      9: 'Freshman (9th grade)',
      10: 'Sophomore (10th grade)',
      11: 'Junior (11th grade)',
      12: 'Senior (12th grade)',
    };
    return labels[grade] || `Grade ${grade}`;
  }

  /**
   * Get timeline-specific priority guidance based on grade
   */
  private getTimelinePriorityGuidance(grade?: number): string {
    if (!grade) {
      return `- Priority 1: What to do THIS WEEK (immediate description improvements)
- Priority 2: What to do THIS MONTH (activity enhancements you can control)
- Priority 3: What to work toward THIS SEMESTER (longer-term spike development)`;
    }

    if (grade === 12) {
      return `SENIORS: All priorities should be description craft. You cannot change your activities at this point.
- Priority 1: Most impactful description rewrite (biggest score boost)
- Priority 2: Second most impactful description rewrite
- Priority 3: Third most impactful description rewrite or framing adjustment`;
    }

    if (grade === 11) {
      return `JUNIORS: Focus on maximizing existing activities and polish.
- Priority 1: What to do NOW to elevate your spike (competitions, recognition)
- Priority 2: Description rewrites that will immediately boost your scores
- Priority 3: What to achieve THIS YEAR before applications`;
    }

    if (grade === 10) {
      return `SOPHOMORES: Balance building and polishing.
- Priority 1: How to deepen your emerging spike this semester
- Priority 2: Leadership positions or recognition to pursue
- Priority 3: Description improvements that clarify your narrative`;
    }

    // Freshman (grade 9)
    return `FRESHMEN: You have time to build — use it wisely.
- Priority 1: What area to explore/commit to as your potential spike
- Priority 2: Foundational activities to start now that can grow
- Priority 3: Early description habits to develop`;
  }

  /**
   * Build a shared reference block with full sophistication prompt blocks.
   *
   * Emits each distinct level's full getSophisticationPromptBlock() ONCE,
   * avoiding repetition when multiple activities share a level.
   * Per-activity labels then reference these blocks by level name.
   */
  private buildSophisticationReferenceBlock(sophisticationMap: SophisticationMap | undefined): string {
    if (!sophisticationMap || sophisticationMap.size === 0) return '';

    // Collect distinct levels present, ordered: foundational → intermediate → advanced
    const levelOrder: TeachingSophistication[] = ['foundational', 'intermediate', 'advanced'];
    const distinctLevels = new Set<TeachingSophistication>();
    for (const classification of sophisticationMap.values()) {
      distinctLevels.add(classification.level);
    }
    const orderedLevels = levelOrder.filter(l => distinctLevels.has(l));

    if (orderedLevels.length === 0) return '';

    const blocks = orderedLevels.map(level => getSophisticationPromptBlock(level));

    const preamble = orderedLevels.length > 1
      ? 'This portfolio has activities at DIFFERENT writing levels. Apply the specific depth for each activity as labeled below.\n\n'
      : '';

    return `## TEACHING DEPTH REFERENCE\n\n${preamble}${blocks.join('\n\n---\n\n')}`;
  }

  /**
   * Detect advanced issues in a description and return psychology-backed teaching bundles.
   * Issues: overclaiming (inflated numbers), tone (consultant jargon),
   * leadership-without-evidence, growth arc failure.
   * Cost: $0 (static data lookup)
   */
  private detectAndBuildIssueBundles(description: string, role?: string): string {
    const bundles: string[] = [];
    const desc = description.toLowerCase();

    // Overclaiming: 4+ digit numbers suggesting inflated metrics
    if (/\d{4,}/.test(description)) {
      const bundle = getAdvancedTeachingBundle('overclaiming');
      if (bundle) bundles.push(bundle);
    }

    // Tone/voice: consultant jargon that reads as inauthentic
    const consultantWords = ['spearheaded', 'synergized', 'leveraged', 'facilitated'];
    if (consultantWords.some(w => desc.includes(w))) {
      const bundle = getAdvancedTeachingBundle('toneVoiceIssues');
      if (bundle) bundles.push(bundle);
    }

    // Leadership without evidence: role implies leadership but description may lack specifics
    const leadershipRoles = ['president', 'captain', 'leader', 'head', 'chair', 'founder', 'director'];
    if (role && leadershipRoles.some(r => role.toLowerCase().includes(r))) {
      const bundle = getAdvancedTeachingBundle('leadershipWithoutEvidence');
      if (bundle) bundles.push(bundle);
    }

    // Growth arc failure: long involvement without progression language
    if (/\b[3-4]\s*(years?|yrs?)\b/i.test(description) && !/grew|advanced|promoted|expanded|scaled|built on/i.test(description)) {
      const bundle = getAdvancedTeachingBundle('growthArcFailure');
      if (bundle) bundles.push(bundle);
    }

    return bundles.length > 0
      ? `\n### ISSUE-SPECIFIC TEACHING (psychology-backed)\n${bundles.join('\n')}`
      : '';
  }

  /**
   * Build portfolio-level strategy section from expert knowledge context.
   * Injects: school-specific strategy, T-shape analysis, character gaps,
   * narrative arc, authenticity notes.
   * Cost: $0 (pre-computed heuristic data)
   */
  private buildPortfolioStrategySection(expertContext: ExpertKnowledgeContext | undefined, rubric: PortfolioScoreRubric): string {
    if (!expertContext) return '';

    const sections: string[] = [];

    sections.push(`## PORTFOLIO STRATEGY FRAMEWORK

Think about this portfolio as a STRATEGIC DOCUMENT, not a list:
- Do positions 1-3 immediately communicate the student's spike?
- Is the portfolio T-shaped? (deep spike + breadth of engagement)
- Would an AO know WHO this person is from activities alone?
- The 90-second pitch: What would an AO say to their committee about this student?`);

    // School-specific strategy
    if (expertContext.schoolArchetypes.length > 0) {
      sections.push(`### TARGET SCHOOL STRATEGY
${expertContext.schoolArchetypes.map(arch =>
  `**${arch.name}** values: ${arch.whatTheyValue.primary}\nIdeal spike: ${arch.idealSpike}\nDescription advice: ${arch.descriptionAdvice}`
).join('\n\n')}`);
    }

    // Character trait gaps
    if (expertContext.characterTraits.missing.length > 0) {
      sections.push(`### CHARACTER GAPS
Portfolio demonstrates: ${expertContext.characterTraits.demonstrated.join(', ')}
Missing evidence of: ${expertContext.characterTraits.missing.join(', ')}
Consider: Can any existing activity descriptions surface these missing traits?`);
    }

    // Narrative arc
    if (expertContext.narrativeArc) {
      sections.push(`### NARRATIVE ARC: "${expertContext.narrativeArc.name}"
Strengthen by ensuring descriptions across activities reinforce this arc.`);
    }

    // Constraint intelligence
    if (expertContext.constraintLevel) {
      sections.push(`### CONSTRAINT CONTEXT
Level ${expertContext.constraintLevel.level}: ${expertContext.constraintLevel.name}
${expertContext.constraintLevel.evaluationNote}
Factor this into teaching — what's impressive GIVEN their constraints.`);
    }

    // Authenticity
    if (expertContext.authenticityAssessment.redFlags.length > 0) {
      sections.push(`### AUTHENTICITY NOTES
${expertContext.authenticityAssessment.redFlags.map(f => `- ${f}`).join('\n')}
Guide toward honest, specific claims rather than inflated ones.`);
    }

    return sections.join('\n\n');
  }

  /**
   * Build the main teaching prompt
   */
  private buildTeachingPrompt(
    rubric: PortfolioScoreRubric,
    activities: ActivityWorkshopInput[],
    activitiesToTransform: ActivityScoreRubric[],
    studentContext?: TeachingLayerInput['studentContext'],
    options?: TeachingLayerInput['options'],
    targetPlatform?: ApplicationPlatform,
    sophisticationMap?: SophisticationMap,
    expertiseData?: TeachingLayerInput['expertiseData'],
    expertContext?: ExpertKnowledgeContext
  ): string {
    const charLimit = getDescriptionCharLimit(targetPlatform);
    const platformName = getPlatformName(targetPlatform);
    // Build activity context with per-activity sophistication level
    const activityContext = activitiesToTransform.map((score) => {
      const activity = activities.find((a) => a.id === score.activityId);
      const sophistication = sophisticationMap?.get(score.activityId);
      return {
        id: score.activityId,
        title: score.activityTitle,
        currentDescription: activity?.description || '',
        currentScore: score.combinedScore.total,
        descriptionScore: score.descriptionScore.total,
        activityScore: score.activityScore.total,
        teachingSophistication: sophistication?.level || 'foundational',
        issues: [
          ...score.descriptionScore.improvements,
          ...(score.activityScore.improvementPaths || []),
        ],
        strengths: score.descriptionScore.strengths,
        tierClassification: score.activityScore.breakdown.tierAssessment.tier,
      };
    });

    // Build per-activity expertise blocks for prompt injection
    // Combines: field-specific teaching context, exemplars, transforms,
    // issue-specific psychology bundles (Step 2), and expert context (Step 3)
    let expertiseBlocks = '';
    {
      const blocks: string[] = [];
      for (const score of activitiesToTransform) {
        const activity = activities.find(a => a.id === score.activityId);
        const blockParts: string[] = [];

        // Field-specific expertise data (existing)
        const expData = expertiseData?.get(score.activityId);
        if (expData) {
          const teachingBlock = buildExpertiseTeachingBlock(expData.teachingContext);
          const exemplarBlock = buildExemplarBlock(expData.exemplars);
          const transformBlock = expData.transforms.length > 0
            ? `\n## FIELD-SPECIFIC IMPROVEMENTS FOR "${score.activityTitle}"\n${expData.transforms.slice(0, 3).map(t => `Before: "${t.before}"\nAfter: "${t.after}"\nWhy: ${t.explanation}`).join('\n\n')}`
            : '';
          if (teachingBlock) blockParts.push(teachingBlock);
          if (exemplarBlock) blockParts.push(exemplarBlock);
          if (transformBlock) blockParts.push(transformBlock);
        }

        // Step 2: Issue-specific psychology-backed teaching bundles
        if (activity) {
          const issueBundles = this.detectAndBuildIssueBundles(activity.description, activity.role);
          if (issueBundles) blockParts.push(issueBundles);
        }

        // Step 3: Expert context per activity (school context, constraints, character gaps)
        if (expertContext && activity) {
          const actExpCtx = buildActivityExpertContext(expertContext, score.activityId, activity.description);
          if (actExpCtx) blockParts.push(actExpCtx);
        }

        if (blockParts.length > 0) {
          blocks.push(`### EXPERTISE CONTEXT: ${score.activityTitle}\n${blockParts.join('\n\n')}`);
        }
      }
      if (blocks.length > 0) {
        expertiseBlocks = `\n\n## FIELD-SPECIFIC EXPERTISE GUIDANCE (pre-computed, $0)\n\n${blocks.join('\n\n---\n\n')}`;
      }
    }

    // Build spike context from actual rubric fields
    const spikeContext = {
      detectedSpike: rubric.narrative.archetype,
      spikeStrength: rubric.breakdown.spikeDetection.score >= 8 ? 'strong' :
                     rubric.breakdown.spikeDetection.score >= 6 ? 'moderate' : 'emerging',
      narrativeSummary: rubric.narrative.storyLine,
    };

    // Get grade label for prompt
    const gradeLabel = this.getGradeLabel(studentContext?.currentGrade);

    // Build the prompt with explicit connection to diagnostic layer
    return `## CONTEXT: BUILDING ON YOUR DIAGNOSTIC ANALYSIS

The diagnostic layer has already identified where you stand. Here's the diagnosis — now you need to provide the PRESCRIPTION (how to improve).

YOUR PROFILE:
${studentContext?.intendedMajor ? `- Intended Major: ${studentContext.intendedMajor}` : ''}
${studentContext?.currentGrade ? `- Current Grade: ${gradeLabel}` : ''}
- Detected Spike: ${spikeContext.detectedSpike}
- Spike Strength: ${spikeContext.spikeStrength}
- Overall Portfolio Score: ${rubric.overallScore.total}/10
- Competitive Tier: ${rubric.harvardScale.description}

## DIAGNOSTIC SUMMARY (already shared with student — don't repeat, BUILD ON):
Story: "${spikeContext.narrativeSummary}"
Strengths (already identified): ${rubric.keyStrengths.join('; ')}
Gaps needing attention: ${rubric.keyGaps.join('; ')}

## ACTIVITIES NEEDING TRANSFORMATION:
${JSON.stringify(activityContext, null, 2)}

${this.buildSophisticationReferenceBlock(sophisticationMap)}

## PER-ACTIVITY TEACHING DEPTH:
${activitiesToTransform.map(score => {
  const sophistication = sophisticationMap?.get(score.activityId);
  if (!sophistication) return '';
  return `- ${score.activityTitle}: Apply ${sophistication.level.toUpperCase()} depth (description score: ${sophistication.descriptionScore.toFixed(1)}/10)`;
}).filter(Boolean).join('\n')}
${expertiseBlocks}

${this.buildPortfolioStrategySection(expertContext, rubric)}

## YOUR TASK: PROVIDE THE PRESCRIPTION

You're the coach giving specific guidance. The student knows their diagnosis — now tell them exactly HOW to improve.

${studentContext?.currentGrade === 12 ? '⚠️ SENIOR YEAR: Focus ONLY on description craft. No activity enhancement recommendations.' : ''}

### For EACH activity needing transformation, provide:

1. **TRANSFORMATION PRINCIPLE**
- Name the principle being applied
- Explain WHY it matters to admissions officers (be concise: 1 sentence for obvious fixes like "use active verbs" or "add numbers"; 2-3 sentences only when the insight is non-obvious and genuinely needs context)
- Explain how it applies to THIS specific activity

2. **CONCRETE REWRITE**
- Provide the EXACT improved description (MUST be ≤${charLimit} characters)
- FORMAT: Use semicolon-separated fragments, NOT flowing sentences
  Example: "Founded school's first CS club; taught 25 students Python/web dev; led 4-school hackathon (60 participants)"
  NOT: "Founded the first computer science club at my school and taught 25 students Python and web development."
- Use abbreviations (hrs/wk, yr, avg, &, /, +, →) to maximize info density
- Drop articles (the/a/an), pronouns (I/my), unnecessary prepositions
- Break down each change made:
  - Element changed (verb_choice, quantification, impact_clarity, specificity, voice, narrative_connection, character_efficiency)
  - Original text
  - Transformed text
  - Why this specific change improves the description

3. **ALTERNATIVE ANGLE** (if applicable)
- A different approach to the same activity (also in fragment format, ≤${charLimit} chars)
- When to use this version instead

4. **EXPECTED IMPACT**
- Projected new score (be realistic)
- Which components would improve

### Additionally, provide:

5. **STRATEGIC PRIORITIES** (top 3, ordered by urgency and impact)

Structure priorities by TIMELINE and what the student can actually control:
${this.getTimelinePriorityGuidance(studentContext?.currentGrade)}

6. **SPIKE REINFORCEMENT** (streamlined — don't repeat diagnosis)
- Strengthened narrative summary (one sentence, how you could pitch yourself)
- Key phrases to weave across descriptions
- One concrete action to deepen your spike

7. **CRAFT TEACHING** (for 2-3 elements from: verb_choice, quantification, impact_clarity, voice_consistency, specificity, character_efficiency)
- Principle explanation
- Before/after examples from YOUR portfolio
- General tips to apply
- ALWAYS include character_efficiency as one element (abbreviations, fragments, dropping articles)

NOTE: Skip "connectionStrategies" as a separate section — fold connection guidance into the activity transformations and strategic priorities to avoid repetition.

Respond in this JSON structure:
{
  "activityTransformations": [
    {
      "activityId": "string",
      "activityName": "string",
      "currentScore": number,
      "primaryIssues": ["string"],
      "revisionLevel": "minor_polish" | "moderate_revision" | "major_overhaul" | "strategic_rethink",
      "principle": {
        "name": "string",
        "whyItMatters": "string (1-2 sentences)",
        "applicationToActivity": "string"
      },
      "rewrite": {
        "original": "string (current description)",
        "suggested": "string (MUST be ≤${charLimit} chars, fragment format with semicolons, use abbreviations)",
        "characterCount": number,
        "changesApplied": [
          {
            "element": "verb_choice" | "quantification" | "impact_clarity" | "specificity" | "voice" | "narrative_connection" | "character_efficiency",
            "original": "string",
            "transformed": "string",
            "rationale": "string"
          }
        ]
      },
      "alternatives": [
        {
          "angle": "string",
          "rewrite": "string (≤${charLimit} chars, fragment format)",
          "whenToUse": "string"
        }
      ],
      "citations": [
        {
          "source": "admissions_officer" | "counselor_consensus" | "research_study" | "elite_school_guidance",
          "sourceName": "string",
          "insight": "string",
          "application": "string"
        }
      ],
      "expectedScoreImprovement": {
        "projectedScore": number,
        "improvingComponents": ["string"],
        "rationale": "string"
      }
    }
  ],
  "strategicPriorities": [
    {
      "priority": 1 | 2 | 3,
      "target": "string (activity or area)",
      "category": "description_rewrite" | "activity_enhancement" | "new_credential" | "narrative_connection" | "activity_elevation",
      "action": "string (specific, actionable — what exactly to do)",
      "rationale": "string (why this matters for your application)",
      "steps": ["string (concrete steps you can take)"],
      "timeline": "string (this week / this month / this semester — grade-appropriate)",
      "expectedImpact": "string (what this will achieve)"
    }
  ],
  "spikeReinforcement": {
    "strengthenedNarrative": "string (one-sentence pitch: 'You are a student who...')",
    "keyPhrases": ["string (phrases to weave across your descriptions)"],
    "oneAction": "string (single most impactful action to deepen your spike)"
  },
  "craftTeaching": [
    {
      "element": "verb_choice" | "quantification" | "impact_clarity" | "voice_consistency" | "specificity" | "character_efficiency",
      "principle": "string",
      "whyItMatters": "string",
      "examples": [
        {
          "context": "string",
          "weak": "string",
          "strong": "string",
          "explanation": "string"
        }
      ],
      "studentSpecificFixes": [
        {
          "activity": "string",
          "current": "string",
          "improved": "string"
        }
      ],
      "generalTips": ["string"]
    }
  ]
}`;
  }

  /**
   * Parse the teaching response from Claude
   */
  private parseTeachingResponse(
    content: string,
    rubric: PortfolioScoreRubric,
    activitiesToTransform: ActivityScoreRubric[],
    usage?: { input_tokens: number; output_tokens: number },
    targetPlatform?: ApplicationPlatform
  ): TeachingLayerOutput {
    try {
      // Use robust JSON parser with jsonrepair fallback (handles code fences,
      // truncated JSON, unescaped quotes, trailing commas, etc.)
      const parsed = parseClaudeJSON<any>(content, 'TeachingLayer');

      // Normalize spike reinforcement from streamlined format to full format
      const spikeReinforcement = this.normalizeSpikeReinforcement(
        parsed.spikeReinforcement,
        rubric
      );

      // Build the complete output
      const teaching: TeachingLayerOutput = {
        teachingFocus: {
          primaryFocus: this.determinePrimaryFocus(parsed),
          activitiesNeedingWork: activitiesToTransform.length,
          approach: this.determineApproach(rubric),
        },
        activityTransformations: parsed.activityTransformations || [],
        strategicPriorities: this.normalizeStrategicPriorities(parsed.strategicPriorities || []),
        connectionStrategies: [], // Deprecated — connection guidance now folded into activity transformations
        spikeReinforcement,
        craftTeaching: parsed.craftTeaching || [],
        rewriteQuickReference: this.buildQuickReference(parsed.activityTransformations || []),
        metadata: {
          generatedAt: new Date().toISOString(),
          modelUsed: 'claude-sonnet-4-5-20250929',
          tokensUsed: {
            input: usage?.input_tokens || 0,
            output: usage?.output_tokens || 0,
          },
          cost: this.estimateCost(usage),
          activitiesAnalyzed: rubric.activityScores.length,
          activitiesTransformed: activitiesToTransform.length,
        },
      };

      // Validate character counts
      this.validateRewrites(teaching, targetPlatform);

      return teaching;
    } catch (error) {
      console.error('[TeachingLayer] Error parsing response:', error);
      // Return a minimal valid output on parse error
      return this.getMinimalOutput(rubric, activitiesToTransform);
    }
  }

  /**
   * Determine the primary teaching focus
   */
  private determinePrimaryFocus(parsed: any): string {
    if (!parsed.activityTransformations?.length) {
      return 'Portfolio narrative strengthening';
    }

    const issues = parsed.activityTransformations.flatMap((t: any) => t.primaryIssues || []);

    if (issues.some((i: string) => i.toLowerCase().includes('passive'))) {
      return 'Active voice transformation';
    }
    if (issues.some((i: string) => i.toLowerCase().includes('number') || i.toLowerCase().includes('quantif'))) {
      return 'Impact quantification';
    }
    if (issues.some((i: string) => i.toLowerCase().includes('generic') || i.toLowerCase().includes('specific'))) {
      return 'Specificity enhancement';
    }
    if (issues.some((i: string) => i.toLowerCase().includes('narrative') || i.toLowerCase().includes('connect'))) {
      return 'Narrative cohesion';
    }

    return 'Description quality improvement';
  }

  /**
   * Determine the teaching approach based on scoring
   */
  private determineApproach(rubric: PortfolioScoreRubric): string {
    const overallScore = rubric.overallScore.total;

    if (overallScore >= 8) {
      return 'Polish and refinement - your portfolio is strong, we\'re optimizing for excellence';
    }
    if (overallScore >= 6) {
      return 'Strategic strengthening - focusing on the activities with highest improvement potential';
    }
    return 'Foundation building - establishing core narrative and description quality';
  }

  /**
   * Build quick reference for all rewrites
   */
  private buildQuickReference(transformations: ActivityTransformation[]): TeachingLayerOutput['rewriteQuickReference'] {
    return transformations.map((t) => ({
      activityId: t.activityId,
      activityName: t.activityName,
      original: t.rewrite.original,
      suggested: t.rewrite.suggested,
      priority: t.revisionLevel === 'major_overhaul' || t.revisionLevel === 'strategic_rethink' ? 'high' :
                t.revisionLevel === 'moderate_revision' ? 'medium' : 'low',
    }));
  }

  /**
   * Validate that all rewrites are under the character limit
   */
  private validateRewrites(teaching: TeachingLayerOutput, targetPlatform?: ApplicationPlatform): void {
    const charLimit = getDescriptionCharLimit(targetPlatform);
    for (const transformation of teaching.activityTransformations) {
      if (transformation.rewrite.suggested.length > charLimit) {
        console.warn(`[TeachingLayer] Rewrite for ${transformation.activityName} exceeds ${charLimit} chars (${transformation.rewrite.suggested.length})`);
        // Truncate at sentence or word boundary instead of hard cut
        const text = transformation.rewrite.suggested;
        const truncated = text.substring(0, charLimit);
        const lastSentenceEnd = Math.max(
          truncated.lastIndexOf('. '),
          truncated.lastIndexOf('! '),
          truncated.lastIndexOf('; ')
        );
        if (lastSentenceEnd > charLimit * 0.6) {
          transformation.rewrite.suggested = truncated.substring(0, lastSentenceEnd + 1);
        } else {
          const lastSpace = truncated.lastIndexOf(' ');
          transformation.rewrite.suggested = lastSpace > charLimit * 0.5
            ? truncated.substring(0, lastSpace)
            : truncated.substring(0, charLimit - 3) + '...';
        }
        transformation.rewrite.characterCount = transformation.rewrite.suggested.length;
      }
    }
  }

  /**
   * Normalize strategic priorities to ensure consistent format
   * Handles both old 'deadline' field and new 'timeline' field
   */
  private normalizeStrategicPriorities(priorities: any[]): StrategicPriority[] {
    return priorities.map((p) => ({
      priority: p.priority || 1,
      target: p.target || '',
      category: p.category || 'description_rewrite',
      action: p.action || '',
      rationale: p.rationale || '',
      steps: p.steps || [],
      deadline: p.timeline || p.deadline || undefined, // Support both field names
      expectedImpact: p.expectedImpact || '',
    }));
  }

  /**
   * Normalize spike reinforcement from streamlined new format to full format
   * New format: { strengthenedNarrative: string, keyPhrases: [], oneAction: string }
   * Old format: { detectedSpike, spikeStrength, currentNarrative, strengthenedNarrative, perActivityFraming }
   */
  private normalizeSpikeReinforcement(parsed: any, rubric: PortfolioScoreRubric): SpikeReinforcement {
    if (!parsed) {
      return this.getDefaultSpikeReinforcement(rubric);
    }

    // Check if it's the new streamlined format
    const isNewFormat = typeof parsed.strengthenedNarrative === 'string' &&
                        !parsed.detectedSpike;

    if (isNewFormat) {
      // Convert new streamlined format to old format
      return {
        detectedSpike: rubric.narrative.archetype,
        spikeStrength: rubric.breakdown.spikeDetection.score >= 8 ? 'strong' :
                       rubric.breakdown.spikeDetection.score >= 6 ? 'moderate' : 'emerging',
        currentNarrative: {
          summary: rubric.narrative.storyLine,
          strengths: rubric.keyStrengths || [],
          weaknesses: rubric.keyGaps || [],
        },
        strengthenedNarrative: {
          summary: parsed.strengthenedNarrative || rubric.narrative.storyLine,
          keyPhrases: parsed.keyPhrases || [],
          themes: [parsed.oneAction || ''].filter(Boolean), // Put oneAction in themes for visibility
        },
        perActivityFraming: [], // Deprecated — now in activity transformations
      };
    }

    // It's the old format — return as-is with defaults
    return {
      detectedSpike: parsed.detectedSpike || rubric.narrative.archetype,
      spikeStrength: parsed.spikeStrength || (
        rubric.breakdown.spikeDetection.score >= 8 ? 'strong' :
        rubric.breakdown.spikeDetection.score >= 6 ? 'moderate' : 'emerging'
      ),
      currentNarrative: parsed.currentNarrative || {
        summary: rubric.narrative.storyLine,
        strengths: rubric.keyStrengths || [],
        weaknesses: rubric.keyGaps || [],
      },
      strengthenedNarrative: parsed.strengthenedNarrative || {
        summary: rubric.narrative.storyLine,
        keyPhrases: [],
        themes: [],
      },
      perActivityFraming: parsed.perActivityFraming || [],
    };
  }

  /**
   * Get default spike reinforcement if parsing fails
   */
  private getDefaultSpikeReinforcement(rubric: PortfolioScoreRubric): SpikeReinforcement {
    return {
      detectedSpike: rubric.narrative.archetype,
      spikeStrength: rubric.breakdown.spikeDetection.score >= 8 ? 'strong' :
                     rubric.breakdown.spikeDetection.score >= 6 ? 'moderate' : 'emerging',
      currentNarrative: {
        summary: rubric.narrative.storyLine,
        strengths: rubric.keyStrengths || [],
        weaknesses: rubric.keyGaps || [],
      },
      strengthenedNarrative: {
        summary: rubric.narrative.storyLine,
        keyPhrases: [],
        themes: [],
      },
      perActivityFraming: [],
    };
  }

  /**
   * Get minimal output on parse error
   */
  private getMinimalOutput(rubric: PortfolioScoreRubric, activitiesToTransform: ActivityScoreRubric[]): TeachingLayerOutput {
    return {
      teachingFocus: {
        primaryFocus: 'Description improvement',
        activitiesNeedingWork: activitiesToTransform.length,
        approach: 'Foundation building',
      },
      activityTransformations: [],
      strategicPriorities: [],
      connectionStrategies: [],
      spikeReinforcement: this.getDefaultSpikeReinforcement(rubric),
      craftTeaching: [],
      rewriteQuickReference: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        modelUsed: 'claude-sonnet-4-5-20250929',
        tokensUsed: { input: 0, output: 0 },
        cost: 0,
        activitiesAnalyzed: rubric.activityScores.length,
        activitiesTransformed: 0,
      },
    };
  }

  /**
   * Estimate cost based on token usage
   */
  private estimateCost(usage?: { input_tokens: number; output_tokens: number }): number {
    if (!usage) return 0;
    // Sonnet pricing: $3/1M input, $15/1M output
    const inputCost = (usage.input_tokens / 1_000_000) * 3;
    const outputCost = (usage.output_tokens / 1_000_000) * 15;
    return Number((inputCost + outputCost).toFixed(4));
  }
}

// Export singleton
export const activityTeachingLayerService = new ActivityTeachingLayerService();
