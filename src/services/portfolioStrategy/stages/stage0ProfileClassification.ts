// @ts-nocheck
/**
 * PASS Stage 0: Profile Classification & Archetype Detection
 *
 * WORKSHOP-LEVEL DEPTH: This stage provides standalone value as a complete
 * profile assessment that could be delivered to a student independently.
 *
 * PURPOSE:
 * - Identify student archetype (not just classification - deep understanding)
 * - Detect hidden strengths that may not be obvious
 * - Identify context factors that affect evaluation (first-gen, geographic, socioeconomic)
 * - Surface potential red flags early
 * - Establish narrative threads that run through the application
 *
 * WHAT MAKES THIS WORKSHOP-WORTHY:
 * - Deep archetype analysis with evidence from the profile
 * - "Hidden gem" detection for undervalued achievements
 * - Context calibration that adjusts expectations fairly
 * - Strategic positioning suggestions based on archetype
 * - Preliminary narrative coherence assessment
 *
 * MODEL: Sonnet (quality matters for accurate classification)
 * COST: ~$0.04-0.06 per analysis
 */

import { callClaude } from '../../../lib/llm/claude';
import {
  ComprehensiveStudentInput,
  GradeLevel,
} from '../types';

// ============================================================================
// ARCHETYPE DEFINITIONS (Research-Backed)
// ============================================================================

/**
 * Student archetypes based on admissions research and counseling patterns.
 * Each archetype has distinct strengths, common weaknesses, and strategic approaches.
 */
export const STUDENT_ARCHETYPES = {
  stem_innovator: {
    name: 'STEM Innovator',
    description: 'Deep technical expertise with original projects or research',
    keyIndicators: [
      'Published research or significant independent project',
      'Competition success in STEM fields (USAMO, USACO, Science Olympiad)',
      'Technical skills demonstrated through building/creating',
      'Evidence of intellectual curiosity beyond coursework',
    ],
    strengths: [
      'Clear intellectual spike that colleges value',
      'Quantifiable achievements (competition ranks, metrics)',
      'Often have compelling "origin story" for their passion',
    ],
    commonWeaknesses: [
      'May neglect humanities/communication skills',
      'Essays can be overly technical without personal connection',
      'May appear one-dimensional without supporting activities',
    ],
    strategicApproach: [
      'Lead with technical achievements but show human connection',
      'Ensure essays reveal the person behind the projects',
      'Include 1-2 non-STEM activities showing breadth',
    ],
    eliteSchoolFit: ['MIT', 'Caltech', 'Stanford', 'Carnegie Mellon'],
  },
  humanities_scholar: {
    name: 'Humanities Scholar',
    description: 'Deep engagement with ideas, writing, history, philosophy, or social sciences',
    keyIndicators: [
      'Strong writing demonstrated through publications or awards',
      'Debate, Model UN, or speech competition success',
      'Independent reading/research beyond curriculum',
      'Philosophy, ethics, or social justice engagement',
    ],
    strengths: [
      'Essays are typically their strongest component',
      'Can articulate complex ideas clearly',
      'Often show intellectual depth and curiosity',
    ],
    commonWeaknesses: [
      'May lack quantifiable achievements',
      'STEM courses may be weaker (can hurt at some schools)',
      'Activities may seem less "impressive" than STEM competitions',
    ],
    strategicApproach: [
      'Essays should be exceptional - this is your showcase',
      'Frame intellectual pursuits with concrete outcomes',
      'Highlight any interdisciplinary connections',
    ],
    eliteSchoolFit: ['Yale', 'Princeton', 'Stanford', 'Columbia', 'Brown'],
  },
  athlete_leader: {
    name: 'Athlete Leader',
    description: 'Excellence in athletics combined with leadership and team impact',
    keyIndicators: [
      'Varsity sport with significant playing time',
      'Captain or leadership position',
      'Athletic awards (all-conference, all-state)',
      'Evidence of teamwork and resilience',
    ],
    strengths: [
      'Demonstrates discipline, time management, resilience',
      'Team context shows collaboration skills',
      'If recruited, massive admissions advantage',
    ],
    commonWeaknesses: [
      'May be perceived as one-dimensional',
      'Academic profile may be weaker',
      'Non-athletic activities may lack depth',
    ],
    strategicApproach: [
      'Show intellectual engagement beyond athletics',
      'Essays should reveal personal growth through sports',
      'If not recruited, athletics are supporting, not central',
    ],
    eliteSchoolFit: ['Stanford', 'Duke', 'Northwestern', 'Notre Dame', 'Ivies'],
  },
  artist_creator: {
    name: 'Artist/Creator',
    description: 'Exceptional creative talent in visual arts, music, theater, or design',
    keyIndicators: [
      'Portfolio of original work',
      'Recognition at competitive level (all-state music, art awards)',
      'Professional or semi-professional experience',
      'Teaching or mentoring others in craft',
    ],
    strengths: [
      'Unique perspective that enriches campus',
      'Demonstrates dedication and practice ethic',
      'Portfolio provides concrete evidence of talent',
    ],
    commonWeaknesses: [
      'Academic profile may be overlooked',
      'May struggle to articulate process in essays',
      'Non-art activities may lack depth',
    ],
    strategicApproach: [
      'Lead with portfolio but show intellectual depth',
      'Essays should reveal artistic process and growth',
      'Connect art to broader themes (community, identity)',
    ],
    eliteSchoolFit: ['RISD', 'Yale', 'Stanford', 'Columbia', 'Carnegie Mellon'],
  },
  social_entrepreneur: {
    name: 'Social Entrepreneur',
    description: 'Creates organizations or initiatives to address social problems',
    keyIndicators: [
      'Founded or led organization with measurable impact',
      'Sustained commitment to cause (not one-time)',
      'Evidence of scaling impact beyond initial scope',
      'Combines passion with strategic thinking',
    ],
    strengths: [
      'Demonstrates initiative and leadership',
      'Quantifiable impact (people served, funds raised)',
      'Shows concern for others - character evidence',
    ],
    commonWeaknesses: [
      'Can appear performative if not genuine',
      'May overstate impact (red flag territory)',
      'Sometimes lacks depth in academic areas',
    ],
    strategicApproach: [
      'Be specific about impact - numbers, testimonials',
      'Show personal connection to cause (not resume-building)',
      'Essays should reveal genuine motivation',
    ],
    eliteSchoolFit: ['Stanford', 'Brown', 'Princeton', 'Duke', 'Penn'],
  },
  well_rounded: {
    name: 'Well-Rounded',
    description: 'Strong across multiple dimensions without extreme spike',
    keyIndicators: [
      'Solid academics (not exceptional but strong)',
      'Multiple activities with some leadership',
      'No glaring weaknesses',
      'Consistent engagement rather than depth',
    ],
    strengths: [
      'No red flags or weak areas',
      'Versatile - can contribute in multiple ways',
      'Often good communicators and team players',
    ],
    commonWeaknesses: [
      'Lacks distinctive spike that stands out',
      'Can appear interchangeable with other applicants',
      'Harder to position for highly selective schools',
    ],
    strategicApproach: [
      'Find the thread that connects activities',
      'Develop one area deeper if time permits',
      'Essays must create memorable differentiation',
    ],
    eliteSchoolFit: ['Liberal arts colleges', 'Strong state flagships', 'T30-50'],
  },
  late_bloomer: {
    name: 'Late Bloomer',
    description: 'Recent acceleration showing potential not reflected in early years',
    keyIndicators: [
      'Significant improvement in junior/senior year',
      'New activities showing rapid achievement',
      'Grade trend strongly upward',
      'Explanation for earlier limitations',
    ],
    strengths: [
      'Shows growth and adaptability',
      'Recent performance predicts college success',
      'Often has compelling transformation story',
    ],
    commonWeaknesses: [
      'GPA may be dragged down by earlier years',
      'Less depth than students engaged since freshman year',
      'May raise questions about consistency',
    ],
    strategicApproach: [
      'Address the trajectory directly',
      'Emphasize recent achievements prominently',
      'Additional letter explaining circumstances if warranted',
    ],
    eliteSchoolFit: ['Schools valuing demonstrated growth', 'T30-50', 'Strong matches'],
  },
  hidden_gem: {
    name: 'Hidden Gem',
    description: 'Outstanding potential not reflected in traditional metrics due to circumstances',
    keyIndicators: [
      'First-generation, low-income, or underrepresented background',
      'Significant work or family responsibilities',
      'Maximized limited opportunities',
      'Impact relative to resources available',
    ],
    strengths: [
      'Resilience and grit demonstrated through circumstances',
      'Perspective that enriches campus diversity',
      'Often overlooked but highly valued when recognized',
    ],
    commonWeaknesses: [
      'May lack traditional markers of achievement',
      'May undersell accomplishments (don\'t know they\'re valued)',
      'Information asymmetry about application process',
    ],
    strategicApproach: [
      'Frame achievements in context of constraints',
      'Ensure counselor letter explains circumstances',
      'Apply to schools with strong socioeconomic diversity commitment',
    ],
    eliteSchoolFit: ['QuestBridge schools', 'Schools with need-blind admissions'],
  },
};

// ============================================================================
// CONTEXT FACTORS
// ============================================================================

export const CONTEXT_FACTORS = {
  first_generation: {
    name: 'First-Generation College Student',
    impactDescription: 'Neither parent has 4-year degree. Achievements evaluated in context of limited guidance.',
    adjustmentRange: [0.2, 0.4],
    evidenceNeeded: ['Self-navigation of college process', 'Limited resources'],
  },
  low_income: {
    name: 'Low-Income Background',
    impactDescription: 'Financial constraints limited access to opportunities. Work/family responsibilities valued.',
    adjustmentRange: [0.2, 0.5],
    evidenceNeeded: ['Free/reduced lunch', 'Work to support family', 'Limited activity access'],
  },
  rural_geographic: {
    name: 'Rural/Geographic Disadvantage',
    impactDescription: 'Limited access to programs, competitions, resources. Underrepresented in elite admissions.',
    adjustmentRange: [0.1, 0.3],
    evidenceNeeded: ['Small school with limited offerings', 'Distance from opportunities'],
  },
  immigrant_background: {
    name: 'Immigrant/Refugee Background',
    impactDescription: 'Cultural adaptation, language barriers, family circumstances.',
    adjustmentRange: [0.2, 0.4],
    evidenceNeeded: ['Recent immigration', 'Language acquisition', 'Family support roles'],
  },
  personal_adversity: {
    name: 'Significant Personal Adversity',
    impactDescription: 'Health challenges, family crisis, or other significant obstacles overcome.',
    adjustmentRange: [0.2, 0.5],
    evidenceNeeded: ['Documented challenge', 'Evidence of overcoming', 'Maintained performance'],
  },
  underrepresented_minority: {
    name: 'Underrepresented Minority',
    impactDescription: 'Brings perspective from underrepresented background.',
    adjustmentRange: [0.1, 0.2],
    evidenceNeeded: ['Identification', 'Cultural engagement if relevant'],
  },
  legacy_status: {
    name: 'Legacy Status',
    impactDescription: 'Parent attended target institution. Varies by school.',
    adjustmentRange: [-0.1, -0.3],
    evidenceNeeded: ['Parent attended', 'Demonstrated interest in school'],
  },
  recruited_athlete: {
    name: 'Recruited Athlete',
    impactDescription: 'On coach\'s recruitment list. Significant advantage if confirmed.',
    adjustmentRange: [-0.5, -1.5],
    evidenceNeeded: ['Coach contact', 'Recruitment list placement'],
  },
};

// ============================================================================
// STAGE 0 PROMPT BUILDER
// ============================================================================

export function buildStage0Prompt(input: ComprehensiveStudentInput): string {
  const academicSummary = buildAcademicSummary(input);
  const activitySummary = buildActivitySummary(input);
  const awardsSummary = buildAwardsSummary(input);
  const contextSummary = buildContextSummary(input);

  return `You are a senior admissions consultant with 20+ years of experience at elite institutions (Harvard, Stanford, Yale). You've read thousands of applications and have deep expertise in identifying student potential.

Your task is to provide a COMPREHENSIVE PROFILE CLASSIFICATION that would be valuable as a standalone consultation. This is not a quick triage - this is a thorough initial assessment.

<student_profile>
GRADE LEVEL: ${input.gradeLevel}
INTENDED MAJOR(S): ${input.intendedMajors?.join(', ') || 'Undecided'}
MAJOR CERTAINTY: ${input.majorCertainty || 'Not specified'}

${academicSummary}

${activitySummary}

${awardsSummary}

${contextSummary}
</student_profile>

<archetype_reference>
Recognize these patterns but don't force-fit. Students may be hybrid or defy categorization:

1. STEM INNOVATOR: Deep technical expertise, research/projects, competition success
2. HUMANITIES SCHOLAR: Writing, debate, philosophy, social science depth
3. ATHLETE LEADER: Athletic excellence with leadership, team impact
4. ARTIST CREATOR: Exceptional creative talent with portfolio
5. SOCIAL ENTREPRENEUR: Founded initiatives, measurable social impact
6. WELL-ROUNDED: Strong across dimensions without extreme spike
7. LATE BLOOMER: Recent acceleration, transformation story
8. HIDDEN GEM: Outstanding potential constrained by circumstances
</archetype_reference>

<your_task>
Provide a WORKSHOP-LEVEL profile assessment covering:

1. **PRIMARY ARCHETYPE IDENTIFICATION**
   - Which archetype best fits (can be hybrid: "STEM Innovator with Social Entrepreneur elements")
   - Confidence level with justification
   - Evidence from the profile supporting this classification

2. **HIDDEN STRENGTHS DETECTION**
   - What impressive achievements might be UNDERSOLD by the student?
   - What "hidden gems" exist in this profile that colleges would value?
   - Any work/family responsibilities that deserve recognition?
   - Achievements relative to available opportunities

3. **CONTEXT CALIBRATION**
   - What context factors affect how this profile should be evaluated?
   - First-gen, socioeconomic, geographic, personal circumstances?
   - How should achievements be recalibrated given context?

4. **PRELIMINARY NARRATIVE THREADS**
   - What themes run through this application?
   - What story could this profile tell?
   - What is the "two-sentence pitch" for this student?

5. **STRATEGIC POSITIONING**
   - How should this student be positioned for competitive admissions?
   - What school tiers are realistic? (T10, T20, T50)
   - What is their competitive advantage?

6. **EARLY RED FLAGS**
   - Any inconsistencies or concerns?
   - Areas that need development?
   - Potential weaknesses in the application?

7. **PRELIMINARY TIER ESTIMATES**
   - Academic tier (1-4, where 1 = national recognition level)
   - Activity tier (1-4, using Sara Harberson's system)
   - Awards tier (1-4)
   - Overall preliminary Harvard-scale estimate (1-6)
</your_task>

Respond with a detailed JSON analysis:
{
  "archetypeAnalysis": {
    "primaryArchetype": "archetype_name",
    "secondaryArchetype": "archetype_name or null",
    "archetypeConfidence": 0.0-1.0,
    "archetypeEvidence": ["evidence1", "evidence2", "evidence3"],
    "archetypeStrengths": ["strength1", "strength2"],
    "archetypeWeaknesses": ["weakness1", "weakness2"],
    "hybridNature": "description if applicable"
  },

  "hiddenStrengths": {
    "undersoldAchievements": [
      {"achievement": "description", "whyUndervalued": "explanation", "trueValue": "what colleges see"}
    ],
    "hiddenGems": [
      {"gem": "description", "significance": "why this matters"}
    ],
    "workFamilyContributions": {
      "present": true/false,
      "description": "what they do",
      "significance": "why this is valuable"
    },
    "opportunityMaximization": "how well they've used available resources"
  },

  "contextCalibration": {
    "factors": [
      {"factor": "factor_name", "present": true/false, "evidence": "evidence", "adjustmentImpact": "description"}
    ],
    "overallContextAdjustment": "significant|moderate|minimal|none",
    "recalibrationNotes": "how achievements should be viewed in context"
  },

  "narrativeThreads": {
    "primaryTheme": "the main story",
    "supportingThemes": ["theme1", "theme2"],
    "twoSentencePitch": "A compelling summary of this student",
    "narrativeCoherence": 0-100,
    "narrativeStrengths": ["what works"],
    "narrativeGaps": ["what's missing"]
  },

  "strategicPositioning": {
    "competitiveAdvantage": "what sets them apart",
    "positioningStrategy": "how to present this profile",
    "realisticSchoolTiers": {
      "t10": {"realistic": true/false, "probability": 0-100, "rationale": "why"},
      "t20": {"realistic": true/false, "probability": 0-100, "rationale": "why"},
      "t50": {"realistic": true/false, "probability": 0-100, "rationale": "why"}
    },
    "bestFitSchoolTypes": ["school type 1", "school type 2"],
    "schoolsToResearch": ["specific school suggestions based on fit"]
  },

  "earlyRedFlags": {
    "inconsistencies": ["any contradictions in the profile"],
    "concernAreas": ["areas that need attention"],
    "developmentNeeded": ["what should be strengthened"],
    "severityLevel": "critical|moderate|minor|none"
  },

  "preliminaryTiers": {
    "academic": {
      "tier": 1-4,
      "justification": "why this tier",
      "standoutElements": ["what's strong"],
      "weakElements": ["what's weak"]
    },
    "activities": {
      "tier": 1-4,
      "justification": "why this tier",
      "standoutElements": ["what's strong"],
      "weakElements": ["what's weak"]
    },
    "awards": {
      "tier": 1-4,
      "justification": "why this tier",
      "standoutElements": ["what's strong"],
      "gapAreas": ["missing recognition types"]
    },
    "overallHarvardEstimate": {
      "score": 1.0-6.0,
      "justification": "why this score",
      "confidenceLevel": 0.0-1.0
    }
  },

  "consultationSummary": {
    "keyTakeaways": ["3-5 main insights"],
    "immediateRecommendations": ["what to do now"],
    "questionsToExplore": ["what needs more investigation"]
  }
}

BE RIGOROUS. Do not inflate assessments. Be honest about weaknesses while recognizing genuine strengths. This analysis should be valuable as a standalone consultation.`;
}

// ============================================================================
// HELPER FUNCTIONS FOR PROMPT BUILDING
// ============================================================================

function buildAcademicSummary(input: ComprehensiveStudentInput): string {
  const academic = input.academic;
  if (!academic) return 'ACADEMICS: Not provided';

  const parts: string[] = ['ACADEMICS:'];

  if (academic.gpa) {
    parts.push(`  GPA: ${academic.gpa.value}/${academic.gpa.scale} (${academic.gpa.type || 'unweighted'})`);
  }

  if (academic.classRank) {
    parts.push(`  Class Rank: ${academic.classRank.rank}/${academic.classRank.totalStudents}`);
  }

  if (academic.testScores) {
    if (academic.testScores.sat) {
      parts.push(`  SAT: ${academic.testScores.sat.composite} (M: ${academic.testScores.sat.math}, EBRW: ${academic.testScores.sat.ebrw})`);
    }
    if (academic.testScores.act) {
      parts.push(`  ACT: ${academic.testScores.act.composite}`);
    }
  }

  if (academic.courses && academic.courses.length > 0) {
    const apCount = academic.courses.filter(c => c.level === 'AP').length;
    const honorsCount = academic.courses.filter(c => c.level === 'Honors').length;
    parts.push(`  Course Rigor: ${apCount} AP courses, ${honorsCount} Honors courses`);

    // List specific courses
    const courseListing = academic.courses.slice(0, 12).map(c =>
      `    - ${c.name} (${c.level || 'Regular'}): ${c.grade || 'N/A'}`
    ).join('\n');
    parts.push(`  Key Courses:\n${courseListing}`);
  }

  if (academic.apExams && academic.apExams.length > 0) {
    const apScores = academic.apExams.map(ap => `${ap.subject}: ${ap.score}`).join(', ');
    parts.push(`  AP Scores: ${apScores}`);
  }

  if (academic.schoolContext) {
    parts.push(`  School Context: ${academic.schoolContext.type || 'Unknown'} school, ${academic.schoolContext.competitiveness || 'Unknown'} competitiveness`);
  }

  return parts.join('\n');
}

function buildActivitySummary(input: ComprehensiveStudentInput): string {
  const activities = input.activities?.activities;
  if (!activities || activities.length === 0) return 'ACTIVITIES: None provided';

  const parts: string[] = [`ACTIVITIES (${activities.length} total):`];

  for (const [i, activity] of activities.entries()) {
    parts.push(`\n  Activity ${i + 1}: ${activity.name}`);
    parts.push(`    Category: ${activity.category || 'Not specified'}`);
    parts.push(`    Years: ${activity.yearsInvolved || 'Unknown'} | Hours/Week: ${activity.hoursPerWeek || 'Unknown'}`);

    if (activity.description) {
      parts.push(`    Description: ${activity.description}`);
    }

    if (activity.leadershipPositions && activity.leadershipPositions.length > 0) {
      const positions = activity.leadershipPositions.map(p => p.title).join(', ');
      parts.push(`    Leadership: ${positions}`);
    }

    if (activity.achievements && activity.achievements.length > 0) {
      const achievements = activity.achievements.map(a => a.description).join('; ');
      parts.push(`    Achievements: ${achievements}`);
    }
  }

  return parts.join('\n');
}

function buildAwardsSummary(input: ComprehensiveStudentInput): string {
  const awards = input.awards?.awards;
  if (!awards || awards.length === 0) return 'AWARDS: None provided';

  const parts: string[] = [`AWARDS (${awards.length} total):`];

  for (const award of awards) {
    parts.push(`  - ${award.name} (${award.level || 'Unknown level'}, ${award.category || 'Unknown category'})`);
  }

  return parts.join('\n');
}

function buildContextSummary(input: ComprehensiveStudentInput): string {
  const parts: string[] = ['PERSONAL CONTEXT:'];

  if (input.personalContext) {
    parts.push(`  Background: ${JSON.stringify(input.personalContext)}`);
  } else {
    parts.push('  Background: Not provided');
  }

  if (input.goals) {
    parts.push(`  Goals: ${JSON.stringify(input.goals)}`);
  }

  if (input.summerHistory) {
    parts.push(`  Summer History: ${JSON.stringify(input.summerHistory)}`);
  }

  return parts.join('\n');
}

// ============================================================================
// STAGE 0 EXECUTION
// ============================================================================

export interface Stage0Output {
  archetypeAnalysis: {
    primaryArchetype: string;
    secondaryArchetype: string | null;
    archetypeConfidence: number;
    archetypeEvidence: string[];
    archetypeStrengths: string[];
    archetypeWeaknesses: string[];
    hybridNature?: string;
  };
  hiddenStrengths: {
    undersoldAchievements: Array<{
      achievement: string;
      whyUndervalued: string;
      trueValue: string;
    }>;
    hiddenGems: Array<{
      gem: string;
      significance: string;
    }>;
    workFamilyContributions: {
      present: boolean;
      description?: string;
      significance?: string;
    };
    opportunityMaximization: string;
  };
  contextCalibration: {
    factors: Array<{
      factor: string;
      present: boolean;
      evidence?: string;
      adjustmentImpact?: string;
    }>;
    overallContextAdjustment: string;
    recalibrationNotes: string;
  };
  narrativeThreads: {
    primaryTheme: string;
    supportingThemes: string[];
    twoSentencePitch: string;
    narrativeCoherence: number;
    narrativeStrengths: string[];
    narrativeGaps: string[];
  };
  strategicPositioning: {
    competitiveAdvantage: string;
    positioningStrategy: string;
    realisticSchoolTiers: {
      t10: { realistic: boolean; probability: number; rationale: string };
      t20: { realistic: boolean; probability: number; rationale: string };
      t50: { realistic: boolean; probability: number; rationale: string };
    };
    bestFitSchoolTypes: string[];
    schoolsToResearch: string[];
  };
  earlyRedFlags: {
    inconsistencies: string[];
    concernAreas: string[];
    developmentNeeded: string[];
    severityLevel: string;
  };
  preliminaryTiers: {
    academic: { tier: number; justification: string; standoutElements: string[]; weakElements: string[] };
    activities: { tier: number; justification: string; standoutElements: string[]; weakElements: string[] };
    awards: { tier: number; justification: string; standoutElements: string[]; gapAreas: string[] };
    overallHarvardEstimate: { score: number; justification: string; confidenceLevel: number };
  };
  consultationSummary: {
    keyTakeaways: string[];
    immediateRecommendations: string[];
    questionsToExplore: string[];
  };
}

export async function executeStage0(
  input: ComprehensiveStudentInput
): Promise<{ output: Stage0Output; usage: { inputTokens: number; outputTokens: number } }> {
  const prompt = buildStage0Prompt(input);

  const response = await callClaude(prompt, {
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 6000,
    temperature: 0.4,
    useJsonMode: true,
  });

  // Parse the response
  let output: Stage0Output;
  if (typeof response.content === 'string') {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      output = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Failed to parse Stage 0 response');
    }
  } else {
    output = response.content as Stage0Output;
  }

  return {
    output,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const stage0ProfileClassification = {
  STUDENT_ARCHETYPES,
  CONTEXT_FACTORS,
  buildStage0Prompt,
  executeStage0,
};
