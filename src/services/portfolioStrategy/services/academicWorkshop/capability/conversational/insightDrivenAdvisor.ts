// @ts-nocheck
/**
 * Insight-Driven Academic Advisor
 *
 * DEFERRED: School-specific context injection and competition-realistic framing.
 * The advisor needs its own forge plan — it has separate types, prompts, and
 * conversation flow from the essay coaching pipeline. Adding school-specific
 * context (acceptance rates, program strengths) and realistic competition
 * framing requires understanding the advisor's architecture deeply. This is
 * NOT a quick fix to bolt onto the coaching/essay pipeline changes.
 * See: final audit Finding 56+ (academic advisor improvements).
 *
 * PHILOSOPHY:
 * This is NOT a generic chatbot. This is an expert advisor who has:
 * 1. Already analyzed the student's FULL profile (grades, courses, activities)
 * 2. Identified SPECIFIC patterns, gaps, and opportunities
 * 3. Has INTENTIONAL questions that serve a strategic purpose
 * 4. Shows their thinking NATURALLY - not in rigid template sections
 *
 * The conversation should feel like talking to a real expert advisor who:
 * - Knows their stuff (can cite specific data when helpful)
 * - Adapts their style to the student's needs
 * - Explains their thinking naturally, not in bullet points
 * - Weaves knowledge in when relevant, not dumping info
 *
 * NOT like:
 * "**Question:** Tell me about X
 *  **Why I'm Asking:** Because Y
 *  **How This Affects Strategy:** Z"
 *
 * UPDATED: Now integrates with naturalResponseGenerator for LLM-powered
 * natural conversation and academicCourseKnowledgeBase for deep expertise.
 */

import {
  COURSE_RIGOR_BENCHMARKS,
  GPA_CALIBRATION,
  GRADE_TRAJECTORY_ANALYSIS,
} from '../../../../knowledge/academicDatabase';

import type { SubjectArea } from '../types';
import type { NuancedCapabilityAnalysis, SubjectPattern } from '../nuancedCapabilityAnalyzer';

// Import new knowledge bases and natural response generator
import {
  AP_COURSES,
  getAPCourse,
  getCoursesForMajor,
  getLoadGuidance,
  formatPassRate,
  type APCourseProfile,
} from './academicCourseKnowledgeBase';

import {
  COLLEGE_TIERS,
  getMajorExpectations,
  assessMajorReadiness,
  type MajorSpecificExpectation,
} from './collegeExpectationsDatabase';

import {
  generateNaturalOpening,
  generateNaturalResponse,
  generateAPCourseTeaching,
  type ConversationContext as NaturalConversationContext,
  type GeneratedResponse,
  type OpeningContext,
} from './naturalResponseGenerator';

import {
  assembleResearchForStudent,
  type StudentContext as ResearchStudentContext,
} from './unifiedResearchAssemblyService';

// R8: Import verified AP statistics for dynamic lookups
import { AP_EXAM_STATISTICS } from './academicResearchFoundation';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate overall GPA from NuancedCapabilityAnalysis
 * Uses subject patterns to derive average GPA
 */
function calculateOverallGPA(quant: NuancedCapabilityAnalysis): number {
  const patterns = Object.values(quant.subjectPatterns);
  if (patterns.length === 0) return 3.5; // Default fallback

  const totalGPA = patterns.reduce((sum, p) => sum + p.performanceHistory.avgGPA, 0);
  return totalGPA / patterns.length;
}

// R8: Dynamic AP stat lookups from verified data source
function getAPPassRate(examKey: string): string {
  const stat = AP_EXAM_STATISTICS[examKey];
  return stat ? `${Math.round(stat.passRate.value * 100)}%` : 'N/A';
}

// ============================================================================
// TYPES
// ============================================================================

export interface StudentProfile {
  /** Full quantitative analysis we've already done */
  quantitativeAnalysis: NuancedCapabilityAnalysis;

  /** Intended major (if specified) */
  intendedMajor?: string;

  /** Target schools (if specified) */
  targetSchools?: string[];

  /** Grade level */
  currentGrade: number;

  /** School context */
  schoolContext: {
    type: 'elite_prep' | 'competitive_magnet' | 'well_resourced_suburban' | 'average_public' | 'under_resourced' | 'rural_remote';
    name?: string;
    apCoursesAvailable?: string[];
  };

  /** Activities/ECs (if available) */
  activities?: Array<{
    name: string;
    category: string;
    yearsInvolved: number;
    leadershipRole?: string;
    hoursPerWeek?: number;
  }>;

  /** Any previous qualitative data gathered */
  previousInsights?: {
    effortLevels?: Record<SubjectArea, number>;
    interestLevels?: Record<SubjectArea, number>;
    teacherIssues?: string[];
    externalCircumstances?: string[];
  };
}

export interface InsightDrivenOpener {
  /** The opening message - shows we've done our homework */
  message: string;

  /** Key insights we're surfacing to the student */
  insightsSurfaced: ProfileInsight[];

  /** The strategic question we're leading with */
  strategicQuestion: StrategicQuestion;

  /** What we already know vs what we need to learn */
  knowledgeState: {
    confident: string[];
    uncertain: string[];
    missing: string[];
  };
}

export interface ProfileInsight {
  /** What we observed */
  observation: string;

  /** What it might mean */
  interpretation: string;

  /** Why it matters for their application */
  strategicImplication: string;

  /** Evidence from their data */
  evidence: string[];
}

export interface StrategicQuestion {
  /** The question itself */
  question: string;

  /** Why we're asking (transparent to student) */
  purpose: string;

  /** How the answer affects our strategy */
  strategicImpact: string;

  /** What we're trying to determine */
  hypothesis: string;

  /** Priority level */
  priority: 'critical' | 'important' | 'helpful';
}

export interface ConversationContext {
  /** All insights we've identified */
  allInsights: ProfileInsight[];

  /** Questions we still need to ask */
  remainingQuestions: StrategicQuestion[];

  /** What we've learned from conversation so far */
  learnedFromConversation: Record<string, string>;

  /** Current strategic focus */
  currentFocus: 'capability_estimation' | 'major_alignment' | 'trajectory_explanation' | 'opportunity_identification';

  /** Answers collected from student during conversation */
  answersCollected: Array<{
    question: StrategicQuestion;
    response: string;
  }>;
}

// ============================================================================
// INSIGHT EXTRACTION
// ============================================================================

/**
 * Get specific AP course recommendations based on subject and major
 *
 * NOTE: This function uses VERIFIED data where available:
 * - AP pass rates: College Board 2024 official statistics
 * - Admissions importance: NACAC State of College Admission 2023
 * - College expectations: Common Data Set (Stanford, Harvard)
 *
 * We do NOT cite fabricated percentages like "X% of admits took Y course"
 * because colleges do not publish this data.
 */
function getSpecificAPRecommendation(
  subject: SubjectArea,
  intendedMajor?: string,
  currentGPA?: number
): { course: string; reason: string; peerData: string } {
  const majorLower = intendedMajor?.toLowerCase() || '';
  const isSTEM = majorLower.includes('computer') || majorLower.includes('engineer') ||
                 majorLower.includes('cs') || majorLower.includes('science') || majorLower.includes('math');
  const isBusiness = majorLower.includes('business') || majorLower.includes('econ');
  const isPreMed = majorLower.includes('med') || majorLower.includes('bio');

  const recommendations: Record<SubjectArea, { course: string; reason: string; peerData: string }> = {
    math: isSTEM
      ? {
          course: 'AP Calculus BC',
          reason: 'BC covers single-variable calculus in full—the same content as Calc I and II in college. Stopping at AB means retaking Calc I in college while your peers who took BC skip directly to Calc III or Linear Algebra.',
          peerData: `VERIFIED: BC has a ${getAPPassRate('AP Calculus BC')} pass rate vs AB's ${getAPPassRate('AP Calculus AB')} (College Board 2024). NACAC research shows 64% of colleges rate curriculum rigor as "considerably important." For CS/Engineering, BC is the expected baseline—it's what rigorous programs assume you've taken.`
        }
      : isBusiness
        ? {
            course: 'AP Calculus AB + AP Statistics',
            reason: 'Business schools value both. AB shows you can handle quantitative rigor; Stats shows you understand data-driven decision making—which is what modern business actually runs on.',
            peerData: `VERIFIED: AP Statistics has a ${getAPPassRate('AP Statistics')} pass rate; AP Calc AB has ${getAPPassRate('AP Calculus AB')} (College Board 2024). The combination demonstrates both theoretical mathematical thinking and applied data analysis—both essential for quantitative business fields.`
          }
        : {
            course: 'AP Calculus AB',
            reason: 'Calculus is the universal signal of mathematical maturity. Even humanities majors at selective schools benefit from proving they can handle rigorous abstract thinking.',
            peerData: `VERIFIED: AP Calculus AB has a ${getAPPassRate('AP Calculus AB')} pass rate (College Board 2024). NACAC data shows curriculum rigor is increasingly important—up from 51% in 2017 to 64% in 2023. Taking calculus when available signals college readiness.`
          },
    science: isPreMed
      ? {
          course: 'AP Biology + AP Chemistry',
          reason: 'Pre-med requires both. Taking only one suggests incomplete preparation. Both together signal serious pre-med commitment—you know what medical school requires.',
          peerData: `VERIFIED: AP Biology has a ${getAPPassRate('AP Biology')} pass rate; AP Chemistry has ${getAPPassRate('AP Chemistry')} (College Board 2024). Medical schools require biology and chemistry coursework. Taking both APs in high school demonstrates you understand and are preparing for pre-med prerequisites.`
        }
      : isSTEM
        ? {
            course: 'AP Physics C: Mechanics',
            reason: 'Physics C uses calculus, which makes many problems MORE straightforward, not harder. The problems become elegant when you have calculus as a tool. Plus, it\'s the version that earns credit at selective schools.',
            peerData: `VERIFIED: Physics C: Mechanics has a ${getAPPassRate('AP Physics C: Mechanics')} pass rate vs Physics 1's ${getAPPassRate('AP Physics 1')} (College Board 2024). The higher pass rate reflects both self-selection AND that calculus simplifies physics problem-solving. For engineering applicants, Physics C demonstrates serious STEM preparation.`
          }
        : {
            course: 'AP Environmental Science or AP Psychology',
            reason: 'For non-STEM majors, these demonstrate scientific literacy without the heavy math load. They\'re strategic choices showing intellectual breadth.',
            peerData: 'Stanford and Harvard both rate curriculum rigor as "very important" (Common Data Set). Even for non-STEM majors, having at least one rigorous science course prevents questions about academic breadth.'
          },
    english: {
      course: 'AP English Literature',
      reason: 'Lit requires genuine engagement with complex texts and sophisticated literary analysis. It signals intellectual depth beyond formulaic essay writing.',
      peerData: `VERIFIED: AP English Literature has a ${getAPPassRate('AP English Literature')} pass rate (College Board 2024). The course builds college-level analytical reading and writing skills valued across all fields—law, policy, business, and humanities.`
    },
    social_studies: isBusiness || majorLower.includes('politic') || majorLower.includes('history')
      ? {
          course: 'AP US History + AP Government',
          reason: 'APUSH is content-heavy with demanding writing requirements. Taking it proves you can handle college-level reading loads and historical analysis. Government adds contemporary policy relevance.',
          peerData: `VERIFIED: AP US History has a ${getAPPassRate('AP US History')} pass rate (College Board 2024). The content-heavy nature of APUSH means success here demonstrates serious academic capability and preparation for humanities/social science fields.`
        }
      : {
          course: 'AP Psychology or AP Human Geography',
          reason: 'For non-humanities majors, these offer accessible social science rigor while demonstrating intellectual breadth.',
          peerData: 'NACAC research: 64% of colleges rate curriculum rigor as considerably important. For STEM applicants, having humanities/social science coursework shows well-roundedness that selective colleges value.'
        },
    foreign_language: {
      course: 'AP Spanish/French/Chinese (your strongest)',
      reason: 'The AP language exam tests real fluency—listening, reading, writing, speaking. A 4 or 5 demonstrates genuine communicative ability, not just classroom memorization.',
      peerData: 'Strong foreign language performance is particularly valued for international relations, global business, and area studies. It demonstrates cultural literacy and communication skills beyond English.'
    },
    computer_science: {
      course: 'AP Computer Science A',
      reason: 'CS A covers object-oriented programming in Java—real software engineering concepts, not just coding. It\'s the difference between "I like coding" and "I can think like a computer scientist."',
      peerData: `VERIFIED: AP Computer Science A has a ${getAPPassRate('AP Computer Science A')} pass rate (College Board 2024). For CS applicants, formal coursework validates self-taught skills. Personal projects show passion; AP CS A shows you can handle structured computer science curriculum.`
    },
  };

  return recommendations[subject] || {
    course: 'AP course in this area',
    reason: 'Advanced coursework demonstrates capability and initiative.',
    peerData: 'NACAC research shows curriculum rigor is rated as "considerably important" by 64% of colleges (2023). Taking available AP courses signals college readiness.'
  };
}

/**
 * Calculate national percentile estimate from GPA and effort
 */
function estimateNationalPercentile(gpa: number, effort: number): number {
  // GPA component (0-100)
  const gpaPercentile = Math.min(99, Math.max(1, (gpa / 4.0) * 80 + 10));

  // Effort adjustment: low effort + high GPA = HIGHER true capability
  // This is the "efficiency" factor
  if (effort < 40 && gpa >= 3.7) {
    // Low effort achievers are rarer and higher capability
    return Math.min(99, gpaPercentile + (40 - effort) * 0.3);
  }

  return Math.round(gpaPercentile);
}

/**
 * Get specific admission value proposition for a course - explains WHY colleges value this course
 * rather than generic "compete with other students" messaging
 */
function getAdmissionValueProposition(courseName: string, intendedMajor?: string): string {
  const majorLower = intendedMajor?.toLowerCase() || '';
  const courseNameLower = courseName.toLowerCase();

  // BC Calculus value propositions
  if (courseNameLower.includes('calculus bc')) {
    if (majorLower.includes('cs') || majorLower.includes('computer') || majorLower.includes('engineer')) {
      return 'BC is the gateway course for CS/Engineering programs. A strong BC score often qualifies you for Calc III placement, saving you a semester and signaling you\'re ready for the mathematical rigor of upper-level CS courses. Top programs expect it.';
    }
    if (majorLower.includes('business') || majorLower.includes('econ')) {
      return 'Quantitative business programs (finance, economics) view BC as proof you can handle econometrics and financial modeling. It separates "interested in business" from "ready for quantitative finance."';
    }
    return 'BC Calculus is the single most respected math course on a high school transcript. A strong score demonstrates analytical capability that transfers to any rigorous major and often earns college credit.';
  }

  // AB Calculus
  if (courseNameLower.includes('calculus ab')) {
    return 'AB Calculus demonstrates core mathematical maturity. Scoring well (4-5) shows you can handle college-level mathematical reasoning, which is foundational for STEM fields and valued even in non-STEM applications.';
  }

  // CS A
  if (courseNameLower.includes('computer science a')) {
    if (majorLower.includes('cs') || majorLower.includes('computer')) {
      return 'AP CS A is the baseline expectation for CS applicants. Beyond proving coding ability, it shows formal training in computational thinking—object-oriented design, algorithms, data structures—that personal projects alone don\'t validate.';
    }
    return 'CS A demonstrates logical thinking and technical capability that transfers across fields. In an increasingly technical world, this course shows you can think systematically.';
  }

  // Physics C
  if (courseNameLower.includes('physics c')) {
    if (majorLower.includes('engineer') || majorLower.includes('physics')) {
      return 'Physics C (Mechanics) is the engineering gateway course. Using calculus for physics problems demonstrates the mathematical physics fluency that engineering programs require from day one.';
    }
    return 'Physics C shows you can apply calculus to real-world problems—a skill that separates theoretical understanding from practical application. The higher pass rate reflects its self-selected, capable student population.';
  }

  // Biology
  if (courseNameLower.includes('biology')) {
    if (majorLower.includes('med') || majorLower.includes('bio')) {
      return 'AP Biology is the cornerstone course for pre-med and biology tracks. It covers foundational concepts (genetics, cellular biology, evolution) that medical schools and biology programs expect you to already understand.';
    }
    return 'AP Biology demonstrates scientific literacy and ability to handle heavy content loads—useful signals for any analytical field.';
  }

  // Chemistry
  if (courseNameLower.includes('chemistry')) {
    if (majorLower.includes('med') || majorLower.includes('chem') || majorLower.includes('bio')) {
      return 'AP Chemistry is essential for pre-med and lab sciences. It teaches stoichiometry, thermodynamics, and lab skills that you\'ll use throughout your science career. Programs expect this foundation.';
    }
    return 'AP Chemistry demonstrates rigorous analytical thinking and the ability to handle quantitative science—valued across STEM fields.';
  }

  // Literature
  if (courseNameLower.includes('literature')) {
    return 'AP Literature demonstrates sophisticated reading and critical analysis skills. The essay-intensive format proves you can construct nuanced arguments—skills that transfer to law, policy, and any field requiring complex written communication.';
  }

  // Statistics
  if (courseNameLower.includes('statistics')) {
    if (majorLower.includes('business') || majorLower.includes('econ') || majorLower.includes('psych')) {
      return 'AP Statistics teaches data-driven decision making—the language of modern business and social science. Understanding statistical inference is increasingly essential for any field that uses data.';
    }
    return 'Statistics literacy is increasingly valued across fields. This course shows you can interpret data and understand probability—skills applicable from medicine to marketing.';
  }

  // APUSH
  if (courseNameLower.includes('us history') || courseNameLower.includes('apush')) {
    return 'AP US History is among the most content-heavy APs. Success here proves you can handle college-level reading volumes and synthesize large amounts of information—skills essential for any rigorous academic program.';
  }

  // Default for unrecognized courses
  return `Taking this AP course demonstrates willingness to challenge yourself academically and builds the foundation for college-level work in this area.`;
}

/**
 * Analyze the student's profile and extract DEEP, actionable insights.
 *
 * QUALITY STANDARD: Every insight must include:
 * 1. SPECIFIC observation with concrete numbers
 * 2. WHY this matters - admissions officer perspective, peer comparison
 * 3. EXACTLY what to do about it - specific courses, specific actions
 * 4. CONSEQUENCES of not acting - concrete stakes, not vague warnings
 */
export function extractProfileInsights(profile: StudentProfile): ProfileInsight[] {
  const insights: ProfileInsight[] = [];
  const quant = profile.quantitativeAnalysis;

  // -------------------------------------------------------------------------
  // INSIGHT 1: Effort-Performance Mismatch (Hidden Capability)
  // -------------------------------------------------------------------------
  if (profile.previousInsights?.effortLevels) {
    for (const [subject, effort] of Object.entries(profile.previousInsights.effortLevels)) {
      const pattern = quant.subjectPatterns[subject as SubjectArea];
      if (!pattern) continue;

      const gpa = pattern.performanceHistory.avgGPA;
      const currentLevel = pattern.performanceHistory.courses[0]?.level || 'standard';
      const currentCourse = pattern.performanceHistory.courses[0]?.name || 'current course';

      // Low effort + High grades = Untapped potential
      if (effort < 40 && gpa >= 3.7) {
        const percentile = estimateNationalPercentile(gpa, effort);
        const apRec = getSpecificAPRecommendation(subject as SubjectArea, profile.intendedMajor, gpa);

        insights.push({
          observation: `${gpa.toFixed(2)} GPA in ${formatSubject(subject as SubjectArea)} on ${effort}% effort—top ${100 - percentile}% capability operating at 50% throttle`,
          interpretation: `The transcript doesn't show your actual capability—it shows what courses you chose. A ${gpa.toFixed(1)} in ${currentLevel} reads as "${gpa.toFixed(1)}-level capability" to admissions officers, not "hidden genius coasting." They have no way to know you could handle more. Meanwhile, the student who took ${apRec.course} and got a 3.8 has PROVEN higher capability on their transcript. ${apRec.peerData}`,
          strategicImplication: `**Recommended course:** ${apRec.course}. ${apRec.reason} **Why this matters for admission:** ${getAdmissionValueProposition(apRec.course, profile.intendedMajor)}`,
          evidence: [
            `GPA: ${gpa.toFixed(2)} in ${formatSubject(subject as SubjectArea)}`,
            `Self-reported effort: ${effort}%`,
            `Current level: ${currentLevel}`,
            `Estimated capability percentile: ${percentile}%`,
          ],
        });
      }

      // High effort + Low grades = At capacity or external issue
      if (effort > 80 && gpa < 3.3) {
        insights.push({
          observation: `${effort}% effort in ${formatSubject(subject as SubjectArea)} yielding only ${gpa.toFixed(2)}—this is either ceiling or obstacle`,
          interpretation: `Two possibilities: (1) You've hit your genuine capability ceiling in this subject, which is fine—not everyone is equally strong everywhere. (2) Something external is blocking you—teaching quality, learning style mismatch, test anxiety, or circumstances at home. The distinction matters enormously for planning.`,
          strategicImplication: `**If it's capability:** Do NOT add rigor here. A B+ in ${currentCourse} is better than a C in AP. Focus your AP ambitions on subjects where effort converts to results. **If it's external:** Name the obstacle. Bad teacher? Seek tutoring or online resources. Test anxiety? Get accommodations. Home circumstances? That's Additional Info material. Either way: don't take AP ${formatSubject(subject as SubjectArea)} next year until we understand this.`,
          evidence: [
            `GPA: ${gpa.toFixed(2)} despite high effort`,
            `Effort level: ${effort}%`,
            `Current course: ${currentCourse}`,
          ],
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // INSIGHT 2: Trajectory Patterns
  // -------------------------------------------------------------------------
  const trajectory = quant.progressionTrajectory.historical.overallTrend;
  // B2 fix: correct property is gpaByYear (not yearlyGPAs which doesn't exist)
  const yearlyGPAs = quant.progressionTrajectory.historical.gpaByYear.map(y => y.gpa);

  if (trajectory === 'declining' && yearlyGPAs.length >= 2) {
    const drop = yearlyGPAs[0] - yearlyGPAs[yearlyGPAs.length - 1];
    insights.push({
      observation: `GPA trajectory: ${yearlyGPAs.map(g => g.toFixed(2)).join(' → ')}—a ${drop.toFixed(2)}-point decline that admissions WILL notice`,
      interpretation: `Admissions officers read transcripts left-to-right. A declining trajectory triggers an automatic question: "What happened?" If you don't answer it, they'll assume the worst—loss of motivation, can't handle increasing rigor, or undisclosed issues. The decline becomes the story of your application unless you control the narrative.`,
      strategicImplication: `**Two paths forward:** (1) If there's a legitimate reason (family crisis, health issue, school change), document it NOW for the Additional Information section. Get your counselor aligned to corroborate. (2) If there's no external reason, you need a VISIBLE recovery. Junior/senior year grades matter more than freshman/sophomore. Show an upward tick this semester—even a small one—and that becomes "student who overcame a rough patch" instead of "student in decline."`,
      evidence: [
        `Year-over-year GPAs: ${yearlyGPAs.map(g => g.toFixed(2)).join(' → ')}`,
        `Total decline: ${drop.toFixed(2)} points`,
        `This is your #1 application vulnerability`,
      ],
    });
  }

  if (trajectory === 'improving' || trajectory === 'accelerating') {
    const improvement = yearlyGPAs[yearlyGPAs.length - 1] - yearlyGPAs[0];
    insights.push({
      observation: `GPA trajectory: ${yearlyGPAs.map(g => g.toFixed(2)).join(' → ')}—a ${improvement.toFixed(2)}-point improvement that tells a growth story`,
      interpretation: `Admissions officers are trained to value trajectory over absolute numbers. A student who went 3.3 → 3.7 often beats a student who was steady at 3.6. Why? The improver demonstrates resilience, maturation, and upward momentum. They're asking "Where will this student be in 4 years?" and your trajectory says "Still climbing."`,
      strategicImplication: `**Keep the momentum:** Maintain or increase rigor in your remaining semesters. An upward trajectory that plateaus loses its narrative power. If you've been improving at current course levels, you're ready to add AP courses—admissions officers view "improved AND stepped up to harder courses" as the strongest signal.`,
      evidence: [
        `Year-over-year GPAs: ${yearlyGPAs.map(g => g.toFixed(2)).join(' → ')}`,
        `Total improvement: ${improvement.toFixed(2)} points`,
        `This is a narrative strength worth emphasizing`,
      ],
    });
  }

  // -------------------------------------------------------------------------
  // INSIGHT 3: Major Alignment with SPECIFIC Course Gaps
  // -------------------------------------------------------------------------
  if (profile.intendedMajor) {
    const majorKey = getMajorKey(profile.intendedMajor);
    if (majorKey) {
      const requirements = COURSE_RIGOR_BENCHMARKS.major_specific_rigor[majorKey];

      // Check for missing required courses
      const takenCourses = new Set<string>();
      for (const pattern of Object.values(quant.subjectPatterns)) {
        for (const course of pattern.performanceHistory.courses) {
          takenCourses.add(course.name.toLowerCase());
        }
      }

      const missingRequired: string[] = [];
      for (const required of requirements.required_signals) {
        const requiredLower = required.toLowerCase().replace('ap ', '').replace('(not just ab)', '').trim();
        const hasCourse = Array.from(takenCourses).some(c => c.includes(requiredLower));
        if (!hasCourse) {
          missingRequired.push(required);
        }
      }

      if (missingRequired.length > 0) {
        const alignedSubjects = getAlignedSubjects(profile.intendedMajor);
        const strongInAligned = alignedSubjects.some(s => {
          const pattern = quant.subjectPatterns[s];
          return pattern && pattern.performanceHistory.avgGPA >= 3.5;
        });

        const weakInAligned = alignedSubjects.some(s => {
          const pattern = quant.subjectPatterns[s];
          return pattern && pattern.performanceHistory.avgGPA < 3.3;
        });

        const majorLower = profile.intendedMajor.toLowerCase();
        // Use verified NACAC/CDS data instead of fabricated admit percentages
        const peerData = majorLower.includes('computer') || majorLower.includes('cs')
          ? 'NACAC: 64% of colleges rate curriculum rigor as "considerably important." For CS/Engineering, this means taking BC over AB, Physics C over Physics 1. These are the rigorous options colleges expect serious STEM applicants to choose.'
          : majorLower.includes('business') || majorLower.includes('econ')
            ? 'NACAC: 64% of colleges rate curriculum rigor as considerably important. Quantitative business programs expect strong math preparation—calculus and statistics demonstrate data-driven thinking.'
            : majorLower.includes('med') || majorLower.includes('bio')
              ? `Medical schools require biology AND chemistry. Taking both AP Bio (${getAPPassRate('AP Biology')} pass rate) and AP Chemistry (${getAPPassRate('AP Chemistry')} pass rate) in high school demonstrates you understand the pre-med prerequisites.`
              : `NACAC: 64% of colleges rate curriculum rigor as considerably important. For ${profile.intendedMajor}, this means: ${requirements.required_signals.slice(0, 3).join(', ')}.`;

        if (weakInAligned) {
          insights.push({
            observation: `Claimed major: ${profile.intendedMajor}. Grades in aligned subjects: below average. Missing courses: ${missingRequired.slice(0, 3).join(', ')}`,
            interpretation: `Admissions officers see this pattern constantly: student claims hot major, transcript tells different story. They call it "interest without evidence." Your strongest subjects point elsewhere, and you're missing the courses that would validate your stated interest. ${peerData}`,
            strategicImplication: `**Decision point:** (1) If ${profile.intendedMajor} is your genuine passion, you need to BUILD evidence fast—take ${missingRequired[0]} next year even if it's hard, start a related project this summer, find relevant activities. (2) If you're claiming ${profile.intendedMajor} because it sounds impressive or parents want it, reconsider. An authentic application about what you're actually good at beats a forced narrative about what you're not.`,
              evidence: [
              `Intended major: ${profile.intendedMajor}`,
              `Missing required courses: ${missingRequired.join(', ')}`,
              `Weaker performance in aligned subjects: ${alignedSubjects.filter(s => quant.subjectPatterns[s]?.performanceHistory.avgGPA < 3.3).map(formatSubject).join(', ')}`,
            ],
          });
        } else if (strongInAligned) {
          insights.push({
            observation: `Strong foundation for ${profile.intendedMajor} (${alignedSubjects.filter(s => quant.subjectPatterns[s]?.performanceHistory.avgGPA >= 3.5).map(formatSubject).join(', ')}), but missing credential courses: ${missingRequired.slice(0, 2).join(', ')}`,
            interpretation: `You have the capability—your grades prove it. But capability alone doesn't get you admitted; demonstrated coursework does. ${peerData} Right now, you have the foundation without the validation.`,
            strategicImplication: `**Specific schedule for next year:** Add ${missingRequired[0]}${missingRequired[1] ? ` and ${missingRequired[1]}` : ''}. Your ${alignedSubjects[0]} strength means you can handle these—in fact, students with your profile typically find these APs MORE engaging because they finally match your capability level. BC has a ${getAPPassRate('AP Calculus BC')} pass rate (College Board 2024), and strong math students often exceed this.`,
              evidence: [
              `Strong in: ${alignedSubjects.filter(s => quant.subjectPatterns[s]?.performanceHistory.avgGPA >= 3.5).map(formatSubject).join(', ')}`,
              `Missing credentials: ${missingRequired.join(', ')}`,
              `Your capability predicts AP success above national averages`,
            ],
          });
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // INSIGHT 4: Subject-Specific Anomalies with SPECIFIC Diagnosis
  // -------------------------------------------------------------------------
  for (const [subject, pattern] of Object.entries(quant.subjectPatterns)) {
    const subjectArea = subject as SubjectArea;
    const apRec = getSpecificAPRecommendation(subjectArea, profile.intendedMajor, pattern.performanceHistory.avgGPA);

    // Sudden grade drop in a single subject
    if (pattern.performanceHistory.trend === 'declining') {
      const courses = pattern.performanceHistory.courses;
      if (courses.length >= 2) {
        const recentGrade = courses[0].grade;
        const previousGrade = courses[1].grade;
        const drop = previousGrade - recentGrade;

        if (drop >= 0.5) {
          insights.push({
            observation: `${formatSubject(subjectArea)} drop: ${courses[1].name} (${previousGrade.toFixed(1)}) → ${courses[0].name} (${recentGrade.toFixed(1)})—a ${drop.toFixed(1)}-point single-subject decline`,
            interpretation: `A ${drop.toFixed(1)}-point drop in one subject while others stay stable is a signal. Common causes: (1) Specific teacher issue—some teachers grade harder or teach poorly. (2) Content jump—${courses[0].name} may require skills ${courses[1].name} didn't build. (3) Personal circumstances hitting during this specific class period. The single-subject nature rules out "general slump."`,
            strategicImplication: `**Diagnostic question:** What was different about ${courses[0].name}? If teacher: seek outside resources (Khan Academy, tutoring, peer study groups). If content gap: identify the specific skill that's missing and remediate. If circumstances: document for application. **Do not:** Take AP ${formatSubject(subjectArea)} next year until this is resolved. Building on a shaky foundation leads to collapse.`,
              evidence: [
              `${courses[1].name}: ${previousGrade.toFixed(1)}`,
              `${courses[0].name}: ${recentGrade.toFixed(1)}`,
              `Other subjects stable = isolated issue`,
            ],
          });
        }
      }
    }

    // Strength relative to other subjects
    if (pattern.relativeStrength > 0.15) {
      const alignedMajors = getAlignedMajorsForSubject(subjectArea);
      const alignedSubjectsForMajor = profile.intendedMajor ? getAlignedSubjects(profile.intendedMajor) : [];
      const strengthAlignedWithMajor = alignedSubjectsForMajor.includes(subjectArea);

      // Build interpretation based on whether this strength aligns with their major
      let interpretation: string;
      let strategicImplication: string;

      if (profile.intendedMajor && strengthAlignedWithMajor) {
        // Strength DOES align with their intended major - great position
        interpretation = `Your strongest subject aligns with your intended ${profile.intendedMajor} major—this is the ideal position. Admissions officers want to see demonstrated capability in the subjects that matter for your chosen field.`;
        strategicImplication = `**Course path:** Take ${apRec.course}. ${apRec.reason} This builds directly on your demonstrated strength and validates your ${profile.intendedMajor} interest with coursework evidence.`;
      } else if (profile.intendedMajor && !strengthAlignedWithMajor) {
        // Strength does NOT align with their intended major - tension to address
        interpretation = `Your strongest subject (${formatSubject(subjectArea)}) doesn't directly align with your intended ${profile.intendedMajor} major. This creates a question for admissions: are you pursuing ${profile.intendedMajor} despite stronger capability elsewhere? Strong ${formatSubject(subjectArea)} performers often excel in ${alignedMajors.slice(0, 2).join(' or ')}.`;
        strategicImplication = `**Two options:** (1) Double down on ${profile.intendedMajor}—take the required courses and build evidence there. (2) Consider whether ${alignedMajors[0]} or ${alignedMajors[1]} might be a better fit for your demonstrated strengths. Either way, still take ${apRec.course} to maximize this strength on your transcript.`;
      } else {
        // No intended major specified
        interpretation = `This is your standout subject—${Math.round(pattern.relativeStrength * 100)}% above your average. Strong ${formatSubject(subjectArea)} performance opens doors to ${alignedMajors.slice(0, 3).join(', ')} and related fields.`;
        strategicImplication = `**Course recommendation:** Take ${apRec.course}. ${apRec.reason} Building on your strongest area makes strategic sense regardless of final major choice.`;
      }

      insights.push({
        observation: `${formatSubject(subjectArea)}: ${pattern.performanceHistory.avgGPA.toFixed(2)} GPA, ${Math.round(pattern.relativeStrength * 100)}% above your average—your strongest academic area`,
        interpretation,
        strategicImplication,
        evidence: [
          `Subject GPA: ${pattern.performanceHistory.avgGPA.toFixed(2)}`,
          `Relative strength: +${Math.round(pattern.relativeStrength * 100)}%`,
          profile.intendedMajor ? `Intended major: ${profile.intendedMajor}` : `No major specified yet`,
        ],
      });
    }

    // Weakness relative to other subjects
    if (pattern.relativeStrength < -0.15 && profile.intendedMajor) {
      const alignedSubjects = getAlignedSubjects(profile.intendedMajor);
      const isRelevantToMajor = alignedSubjects.includes(subjectArea);

      insights.push({
        observation: `${formatSubject(subjectArea)}: ${pattern.performanceHistory.avgGPA.toFixed(2)} GPA, ${Math.round(Math.abs(pattern.relativeStrength) * 100)}% below your average${isRelevantToMajor ? ' (RELEVANT TO YOUR MAJOR)' : ''}`,
        interpretation: isRelevantToMajor
          ? `This is a problem. You're claiming ${profile.intendedMajor}, but your ${formatSubject(subjectArea)} grades are your weakest. Admissions officers WILL notice this disconnect. They'll question either your capability or your commitment.`
          : `A weakness in ${formatSubject(subjectArea)} is manageable since it's not central to ${profile.intendedMajor}. But don't let it become a liability—even non-major subjects contribute to overall GPA and transcript appearance.`,
        strategicImplication: isRelevantToMajor
          ? `**Critical decision:** Either improve this subject significantly (tutoring, summer program, different approach) OR reconsider your major. You cannot credibly claim ${profile.intendedMajor} with weak ${formatSubject(subjectArea)} grades. The transcript contradiction will sink your application narrative.`
          : `**Containment strategy:** Don't take AP ${formatSubject(subjectArea)}—it's not worth the risk. Focus AP ambitions on your strengths. For ${formatSubject(subjectArea)}, aim for B+ minimum to avoid it dragging down overall GPA.`,
          evidence: [
          `Subject GPA: ${pattern.performanceHistory.avgGPA.toFixed(2)}`,
          `Relative weakness: ${Math.round(Math.abs(pattern.relativeStrength) * 100)}%`,
          isRelevantToMajor ? `Directly conflicts with claimed major` : `Not directly major-relevant`,
        ],
      });
    }
  }

  // -------------------------------------------------------------------------
  // INSIGHT 5: Rigor Maximization with PEER COMPARISON
  // -------------------------------------------------------------------------
  let apCount = 0;
  let totalCourses = 0;
  const apCoursesTaken: string[] = [];

  for (const pattern of Object.values(quant.subjectPatterns)) {
    for (const course of pattern.performanceHistory.courses) {
      totalCourses++;
      if (course.level.toLowerCase().includes('ap') || course.level.toLowerCase().includes('ib')) {
        apCount++;
        apCoursesTaken.push(course.name);
      }
    }
  }

  const rigorRatio = totalCourses > 0 ? apCount / totalCourses : 0;
  const schoolExpectation = getSchoolRigorExpectation(profile.schoolContext.type);

  // Rigor gap analysis
  if (rigorRatio < schoolExpectation.min && profile.currentGrade >= 11) {
    const expectedAPs = Math.round(schoolExpectation.expected * totalCourses);
    const admitAverage = profile.intendedMajor?.toLowerCase().includes('cs') || profile.intendedMajor?.toLowerCase().includes('engineer')
      ? '8-10 AP courses'
      : profile.intendedMajor?.toLowerCase().includes('business')
        ? '6-8 AP courses'
        : '5-7 AP courses';

    insights.push({
      observation: `AP/IB count: ${apCount} out of ${totalCourses} courses (${Math.round(rigorRatio * 100)}%). Your school type suggests ${expectedAPs}+ APs are available; admits to your target schools average ${admitAverage}`,
      interpretation: `Admissions officers evaluate rigor in context: "Did this student take the challenging courses available to them?" At a ${profile.schoolContext.type.replace(/_/g, ' ')} school, ${Math.round(schoolExpectation.expected * 100)}% rigor is the baseline expectation, not the ceiling. Below that, they assume either you can't handle it (capability issue) or you chose not to (motivation issue). Neither is good.`,
      strategicImplication: `**Math for junior/senior year:** You need ${expectedAPs - apCount} more AP courses to hit baseline expectations. Given your ${Object.entries(quant.subjectPatterns).sort((a, b) => b[1].performanceHistory.avgGPA - a[1].performanceHistory.avgGPA)[0]?.[0] || 'strongest'} strength, prioritize APs in that area. **Reality check:** If your school offers 15 APs and you've taken 2, the explanation better be good (sports, work, family obligations) or the application looks weak.`,
      evidence: [
        `Current AP/IB courses: ${apCoursesTaken.length > 0 ? apCoursesTaken.join(', ') : 'None yet'}`,
        `School type: ${profile.schoolContext.type.replace(/_/g, ' ')}`,
        `Expected rigor for competitive admits: ${Math.round(schoolExpectation.expected * 100)}%+`,
      ],
    });
  }

  return insights;
}

/**
 * Get majors that align well with a given subject strength
 */
function getAlignedMajorsForSubject(subject: SubjectArea): string[] {
  const alignments: Record<SubjectArea, string[]> = {
    math: ['Computer Science', 'Engineering', 'Physics', 'Economics', 'Data Science', 'Actuarial Science', 'Applied Mathematics'],
    science: ['Pre-Med', 'Biology', 'Chemistry', 'Environmental Science', 'Neuroscience', 'Bioengineering', 'Public Health'],
    english: ['English Literature', 'Journalism', 'Communications', 'Creative Writing', 'Law (Pre-Law)', 'Publishing', 'Film Studies'],
    social_studies: ['Political Science', 'History', 'International Relations', 'Economics', 'Sociology', 'Psychology', 'Public Policy'],
    foreign_language: ['International Relations', 'Global Business', 'Linguistics', 'Translation Studies', 'Diplomacy', 'Area Studies'],
    computer_science: ['Computer Science', 'Software Engineering', 'Data Science', 'AI/Machine Learning', 'Cybersecurity', 'Information Systems'],
  };

  return alignments[subject] || [];
}

// ============================================================================
// STRATEGIC QUESTION GENERATION
// ============================================================================

/**
 * Generate strategic questions based on insights - each question has a PURPOSE.
 */
export function generateStrategicQuestions(
  profile: StudentProfile,
  insights: ProfileInsight[]
): StrategicQuestion[] {
  const questions: StrategicQuestion[] = [];

  // Questions driven by specific insights
  for (const insight of insights) {
    // Declining trajectory needs explanation
    if (insight.observation.includes('dropped') || insight.observation.includes('declined')) {
      questions.push({
        question: `I noticed ${insight.observation.toLowerCase()}. Walk me through what was happening during that time.`,
        purpose: `I'm trying to understand if this was circumstantial (and can be explained) or a capability issue (which changes our strategy)`,
        strategicImpact: `If there's a compelling explanation, we can address it in Additional Info. If not, we need to show recovery.`,
        hypothesis: `External factors or increased rigor caused the decline, not capability`,
        priority: 'critical',
      });
    }

    // Low effort + high grades needs confirmation
    if (insight.observation.includes('effort') && insight.observation.includes('low')) {
      const subject = extractSubjectFromInsight(insight);
      questions.push({
        question: `You mentioned ${subject} comes easily to you. When you hit something challenging in ${subject}, how do you typically handle it?`,
        purpose: `I want to confirm this is genuine capability, not just easier coursework. How you handle challenge tells me if you're ready to step up.`,
        strategicImpact: `If you rise to challenges well, I'll recommend stepping up to AP. If challenges frustrate you, we need a different approach.`,
        hypothesis: `Student has high capability and can handle increased rigor`,
        priority: 'important',
      });
    }

    // Major mismatch needs exploration
    if (insight.observation.includes('want to study') && insight.observation.includes('strongest subjects are in different areas')) {
      questions.push({
        question: `You want to study ${profile.intendedMajor}, but your academic strengths are elsewhere. Tell me about your genuine interest in ${profile.intendedMajor} - what draws you to it?`,
        purpose: `I need to understand if this is authentic passion or external pressure. Colleges can tell the difference.`,
        strategicImpact: `If authentic, we build evidence to support it. If it's pressure-driven, we might reconsider the major choice.`,
        hypothesis: `Student has genuine interest that just hasn't been reflected in course choices yet`,
        priority: 'critical',
      });
    }

    // Subject weakness needs diagnosis
    if (insight.observation.includes('weakest subject')) {
      const subject = extractSubjectFromInsight(insight);
      questions.push({
        question: `${subject} is your weakest area. Is that because the material doesn't click for you, or is there something else going on (teaching, interest, time)?`,
        purpose: `Knowing the root cause determines whether this is fixable or something we work around`,
        strategicImpact: `If it's fixable, we address it. If it's a genuine weakness, we adjust expectations and potentially major choice.`,
        hypothesis: `External factors (teaching, time) are the cause rather than capability`,
        priority: 'important',
      });
    }
  }

  // Always need to understand effort patterns if we don't have them
  if (!profile.previousInsights?.effortLevels) {
    // Find their strongest and weakest subjects
    const subjects = Object.entries(profile.quantitativeAnalysis.subjectPatterns);
    const sorted = subjects.sort((a, b) => b[1].performanceHistory.avgGPA - a[1].performanceHistory.avgGPA);

    if (sorted.length >= 2) {
      const strongest = sorted[0];
      const weakest = sorted[sorted.length - 1];

      questions.push({
        question: `Compare how much effort you put into ${formatSubject(strongest[0] as SubjectArea)} versus ${formatSubject(weakest[0] as SubjectArea)}. Which one requires more work from you?`,
        purpose: `Your effort-to-grades ratio tells me your true capability in each subject - which is different from what grades alone show`,
        strategicImpact: `High grades + low effort = untapped potential (step up). Low grades + high effort = at capacity (don't add rigor).`,
        hypothesis: `Strong subject requires less effort, revealing higher capability`,
        priority: 'critical',
      });
    }
  }

  // If undecided on major, probe for direction
  if (!profile.intendedMajor || profile.intendedMajor.toLowerCase() === 'undecided') {
    questions.push({
      question: `When you have free time to learn something on your own - no assignment, no grade - what do you gravitate toward?`,
      purpose: `Genuine interests, not just good grades, point to authentic major choices`,
      strategicImpact: `This helps me recommend coursework that builds toward something you actually care about`,
      hypothesis: `Student has latent interests that could inform major choice`,
      priority: 'important',
    });
  }

  // Sort by priority
  const priorityOrder = { 'critical': 0, 'important': 1, 'helpful': 2 };
  questions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return questions;
}

// ============================================================================
// INSIGHT-DRIVEN OPENER (with LLM natural response support)
// ============================================================================

/**
 * Generate an opener that shows we've done our homework and have specific insights.
 * SYNC VERSION: Uses template fallback. For natural LLM responses, use generateInsightDrivenOpenerAsync.
 */
export function generateInsightDrivenOpener(profile: StudentProfile): InsightDrivenOpener {
  const insights = extractProfileInsights(profile);
  const questions = generateStrategicQuestions(profile, insights);

  // Select the most important insights to surface (max 3)
  const topInsights = insights.slice(0, 3);

  // Fallback question if none were generated
  const fallbackQuestion: StrategicQuestion = {
    question: `What subjects do you find yourself most engaged with, and what about them captures your interest?`,
    purpose: `Understanding your genuine interests helps me recommend coursework that builds toward something meaningful to you`,
    strategicImpact: `This informs both course recommendations and how to position your academic narrative`,
    hypothesis: `Student has interests that can inform course planning`,
    priority: 'important',
  };
  // Get the most important question
  const leadQuestion = questions[0] || fallbackQuestion;

  // Build the knowledge state
  const knowledgeState = {
    confident: [] as string[],
    uncertain: [] as string[],
    missing: [] as string[],
  };

  // What we're confident about
  const overallGPA = calculateOverallGPA(profile.quantitativeAnalysis);
  knowledgeState.confident.push(`Your overall GPA is ${overallGPA.toFixed(2)}`);
  knowledgeState.confident.push(
    `Your trajectory is ${profile.quantitativeAnalysis.progressionTrajectory.historical.overallTrend}`
  );

  if (profile.intendedMajor) {
    knowledgeState.confident.push(`You're interested in ${profile.intendedMajor}`);
  }

  // What we're uncertain about
  if (!profile.previousInsights?.effortLevels) {
    knowledgeState.uncertain.push('How much effort each subject actually takes you');
  }

  // Add insights about areas we need more information on
  for (const insight of insights.filter(i => i.observation.includes('either ceiling or obstacle'))) {
    knowledgeState.uncertain.push(insight.observation);
  }

  // What we're missing
  if (!profile.previousInsights?.effortLevels) {
    knowledgeState.missing.push('Effort levels by subject');
  }
  if (!profile.previousInsights?.interestLevels) {
    knowledgeState.missing.push('Interest levels by subject');
  }
  if (insights.some(i => i.observation.includes('dropped'))) {
    knowledgeState.missing.push('Explanation for grade changes');
  }

  // Build the opening message
  const message = buildOpeningMessage(profile, topInsights, leadQuestion);

  return {
    message,
    insightsSurfaced: topInsights,
    strategicQuestion: leadQuestion,
    knowledgeState,
  };
}

/**
 * ASYNC version that uses LLM for natural, flowing responses.
 * This is the preferred method for production use.
 *
 * INTEGRATION: Now uses the Unified Research Assembly Service to provide
 * the LLM with comprehensive, verified research context including:
 * - GPA calibration data from research-backed guidance layer
 * - Major-specific expectations and benchmarks
 * - Verified AP course statistics (College Board)
 * - College tier expectations
 * - Admitted student profiles
 */
export async function generateInsightDrivenOpenerAsync(
  profile: StudentProfile
): Promise<InsightDrivenOpener & { naturalMessage: string }> {
  const insights = extractProfileInsights(profile);
  const questions = generateStrategicQuestions(profile, insights);
  const topInsights = insights.slice(0, 3);

  // Fallback question if none were generated
  const fallbackQuestion: StrategicQuestion = {
    question: `What subjects do you find yourself most engaged with, and what about them captures your interest?`,
    purpose: `Understanding your genuine interests helps me recommend coursework that builds toward something meaningful to you`,
    strategicImpact: `This informs both course recommendations and how to position your academic narrative`,
    hypothesis: `Student has interests that can inform course planning`,
    priority: 'important',
  };
  const leadQuestion = questions[0] || fallbackQuestion;

  // Build context for natural response generator
  const academicPatterns = buildAcademicPatterns(profile);

  // =========================================================================
  // UNIFIED RESEARCH ASSEMBLY INTEGRATION
  // Assemble comprehensive research context for the LLM to use
  // =========================================================================
  const researchContext: ResearchStudentContext = {
    quantitativeAnalysis: profile.quantitativeAnalysis,
    intendedMajor: profile.intendedMajor,
    currentGrade: profile.currentGrade,
    schoolContext: profile.schoolContext,
    targetSchools: profile.targetSchools,
  };

  // Assemble all relevant research data for this student's context
  const assembledResearch = assembleResearchForStudent(researchContext);

  // Calculate overall GPA once for reuse
  const overallGPA = calculateOverallGPA(profile.quantitativeAnalysis);

  const openingContext: OpeningContext = {
    student: {
      grade: profile.currentGrade,
      intendedMajor: profile.intendedMajor || 'Undecided',
      schoolType: profile.schoolContext.type.replace(/_/g, ' '),
      overallGPA,
      trajectory: profile.quantitativeAnalysis.progressionTrajectory.historical.overallTrend as
        | 'ascending'
        | 'descending'
        | 'stable'
        | 'erratic',
    },
    academicPatterns,
    insights: topInsights,
    topPriorityQuestion: leadQuestion,
    // Pass the LLM-optimized research context to enrich the prompt
    assembledResearchContext: assembledResearch.llmFormattedContext,
  };

  // Generate natural response using LLM with enriched research context
  const naturalResponse = await generateNaturalOpening(openingContext);

  // Build knowledge state
  const knowledgeState = {
    confident: [
      `Your overall GPA is ${overallGPA.toFixed(2)}`,
      `Your trajectory is ${profile.quantitativeAnalysis.progressionTrajectory.historical.overallTrend}`,
    ],
    uncertain: [] as string[],
    missing: [] as string[],
  };

  if (!profile.previousInsights?.effortLevels) {
    knowledgeState.missing.push('Effort levels by subject');
  }

  return {
    message: buildOpeningMessage(profile, topInsights, leadQuestion), // Fallback
    naturalMessage: naturalResponse.message, // LLM-generated natural version
    insightsSurfaced: topInsights,
    strategicQuestion: leadQuestion,
    knowledgeState,
  };
}

/**
 * Build academic patterns structure from profile for natural response generator
 */
function buildAcademicPatterns(profile: StudentProfile): OpeningContext['academicPatterns'] {
  const subjects: OpeningContext['academicPatterns']['subjects'] = [];

  let strongestSubject: SubjectArea | undefined;
  let weakestSubject: SubjectArea | undefined;
  let highestGPA = 0;
  let lowestGPA = 5;

  const effortGapSubjects: SubjectArea[] = [];
  const strugglingSubjects: SubjectArea[] = [];

  for (const [subject, pattern] of Object.entries(profile.quantitativeAnalysis.subjectPatterns)) {
    const subjectArea = subject as SubjectArea;
    const gpa = pattern.performanceHistory.avgGPA;
    const effort = profile.previousInsights?.effortLevels?.[subjectArea];

    subjects.push({
      subject: subjectArea,
      gpa,
      effort,
      trend: pattern.performanceHistory.trend as 'improving' | 'declining' | 'stable',
      currentLevel: pattern.performanceHistory.courses[0]?.level || 'Unknown',
      courses: pattern.performanceHistory.courses.map((c) => c.name),
    });

    if (gpa > highestGPA) {
      highestGPA = gpa;
      strongestSubject = subjectArea;
    }
    if (gpa < lowestGPA) {
      lowestGPA = gpa;
      weakestSubject = subjectArea;
    }

    // Detect effort gaps
    if (effort !== undefined) {
      if (effort < 40 && gpa >= 3.7) {
        effortGapSubjects.push(subjectArea);
      }
      if (effort > 80 && gpa < 3.3) {
        strugglingSubjects.push(subjectArea);
      }
    }
  }

  return {
    subjects,
    strongestSubject,
    weakestSubject,
    effortGapSubjects: effortGapSubjects.length > 0 ? effortGapSubjects : undefined,
    strugglingSubjects: strugglingSubjects.length > 0 ? strugglingSubjects : undefined,
  };
}

/**
 * Fallback sync builder for opening message.
 * Used when LLM is not available or for testing.
 */
function buildOpeningMessage(
  profile: StudentProfile,
  insights: ProfileInsight[],
  leadQuestion: StrategicQuestion
): string {
  const parts: string[] = [];

  // Opening that shows we've analyzed their profile
  parts.push(
    `I've been looking at your academic record, and there are some interesting patterns I want to discuss with you.`
  );
  parts.push('');

  // Surface the most important insight
  if (insights.length > 0) {
    const topInsight = insights[0];
    parts.push(`**What I noticed:** ${topInsight.observation}`);
    parts.push('');
    parts.push(`**What this might mean:** ${topInsight.interpretation}`);
    parts.push('');
    parts.push(`**Why this matters:** ${topInsight.strategicImplication}`);
    parts.push('');
  }

  // The strategic question with transparent reasoning
  if (leadQuestion) {
    parts.push(`---`);
    parts.push('');
    parts.push(`**My question for you:** ${leadQuestion.question}`);
    parts.push('');
    parts.push(`*(I'm asking because ${leadQuestion.purpose.toLowerCase()})*`);
  }

  return parts.join('\n');
}

// ============================================================================
// FOLLOW-UP RESPONSE GENERATION
// ============================================================================

export interface StudentResponse {
  message: string;
  questionAnswered: StrategicQuestion;
}

export interface AdvisorFollowUp {
  /** The follow-up message */
  message: string;

  /** What we learned from their response */
  learnedInsight: string;

  /** How this affects our strategy */
  strategyUpdate: string;

  /** Next question (if any) */
  nextQuestion?: StrategicQuestion;

  /** Updated recommendations based on what we learned */
  updatedRecommendations?: string[];
}

/**
 * Generate a follow-up that shows we understood their answer and updates our thinking.
 */
export function generateFollowUp(
  profile: StudentProfile,
  studentResponse: StudentResponse,
  context: ConversationContext
): AdvisorFollowUp {
  const response = studentResponse.message.toLowerCase();
  const question = studentResponse.questionAnswered;

  let learnedInsight = '';
  let strategyUpdate = '';
  let messageParts: string[] = [];
  const recommendations: string[] = [];

  // Analyze the response based on what question was asked
  if (question.hypothesis.includes('capability')) {
    // They were asked about effort/capability
    if (response.includes('easy') || response.includes('naturally') || response.includes('don\'t study')) {
      learnedInsight = 'Student confirms low effort in this subject - indicates high capability';
      strategyUpdate = 'Recommend stepping up to AP level in this subject';
      recommendations.push('Step up to AP in this subject next year');

      messageParts.push(`That confirms what I suspected - you're not being challenged enough.`);
      messageParts.push('');
      messageParts.push(`**Updated thinking:** Since this comes naturally to you, you're leaving potential on the table by staying at the current level. AP coursework would not only challenge you appropriately but also show colleges you're pushing yourself.`);
    } else if (response.includes('hard') || response.includes('struggle') || response.includes('hours')) {
      learnedInsight = 'Student indicates high effort - grades may reflect true capability';
      strategyUpdate = 'Do not recommend adding more rigor in this subject';
      recommendations.push('Maintain current level; focus on improving efficiency');

      messageParts.push(`Got it - you're already working hard for these results.`);
      messageParts.push('');
      messageParts.push(`**Updated thinking:** Adding more rigor here would likely hurt more than help. Let's focus on either improving your efficiency in this subject or accepting this is close to your ceiling and investing effort elsewhere.`);
    }
  }

  if (question.hypothesis.includes('external factors') || question.hypothesis.includes('circumstantial')) {
    // They were asked about grade drops
    if (response.includes('sick') || response.includes('family') || response.includes('moved') || response.includes('teacher')) {
      learnedInsight = 'External circumstances explain grade decline';
      strategyUpdate = 'Frame this in Additional Information section';
      recommendations.push('Address this in your Additional Information');
      recommendations.push('Get counselor to corroborate in recommendation');

      messageParts.push(`That makes sense, and it's important context.`);
      messageParts.push('');
      messageParts.push(`**Updated thinking:** This is exactly what the Additional Information section is for. Colleges want to understand context, not excuses. A brief, factual explanation of what happened and how you managed it shows maturity. Your counselor should also mention this in their letter.`);
    } else if (response.includes('harder') || response.includes('difficult') || response.includes('didn\'t understand')) {
      learnedInsight = 'Increased difficulty caused decline, not external factors';
      strategyUpdate = 'Focus on recovery and showing upward trend';
      recommendations.push('Focus on showing improvement in current term');
      recommendations.push('Consider whether current rigor level is appropriate');

      messageParts.push(`So it was the step up in difficulty that got you.`);
      messageParts.push('');
      messageParts.push(`**Updated thinking:** This happens a lot - especially when jumping to AP level. The question now is: are you recovering? If your grades this term are better, that's a positive signal. If not, we might need to reconsider your course load.`);
    }
  }

  if (question.hypothesis.includes('authentic passion') || question.hypothesis.includes('genuine interest')) {
    // They were asked about major choice
    if (response.length > 100 && (response.includes('love') || response.includes('fascinated') || response.includes('always wanted'))) {
      learnedInsight = 'Student shows genuine passion for intended major';
      strategyUpdate = 'Build evidence to support this interest in coursework and activities';
      recommendations.push('Take courses that demonstrate this interest');
      recommendations.push('Find activities/projects that show initiative in this field');

      messageParts.push(`I can hear the genuine interest there.`);
      messageParts.push('');
      messageParts.push(`**Updated thinking:** Your challenge isn't convincing yourself - it's convincing colleges. Right now your transcript doesn't tell this story. We need to build evidence: courses, projects, activities that demonstrate this isn't just a whim.`);
    } else if (response.includes('parents') || response.includes('job') || response.includes('money') || response.includes('should')) {
      learnedInsight = 'Major choice may be externally influenced rather than authentic';
      strategyUpdate = 'Explore whether to pursue this major or pivot to strengths';
      recommendations.push('Consider whether this is truly your path');
      recommendations.push('Explore majors that align with your demonstrated strengths');

      messageParts.push(`I want to be direct with you about something.`);
      messageParts.push('');
      messageParts.push(`**Updated thinking:** Colleges see a lot of applications from students who claim a major because it sounds impressive or because of family pressure. Your application will be stronger if you pursue what you're genuinely good at and interested in. That doesn't mean you can't do ${profile.intendedMajor} - but let's make sure it's YOUR choice.`);
    }
  }

  // Get next question if we have more
  const remainingQuestions = context.remainingQuestions.filter(q => q !== question);
  const nextQuestion = remainingQuestions[0];

  if (nextQuestion && messageParts.length > 0) {
    messageParts.push('');
    messageParts.push(`---`);
    messageParts.push('');
    messageParts.push(`**Next thing I want to understand:** ${nextQuestion.question}`);
    messageParts.push('');
    messageParts.push(`*(${nextQuestion.purpose})*`);
  }

  return {
    message: messageParts.join('\n'),
    learnedInsight,
    strategyUpdate,
    nextQuestion,
    updatedRecommendations: recommendations.length > 0 ? recommendations : undefined,
  };
}

// ============================================================================
// FINAL SYNTHESIS
// ============================================================================

export interface FinalSynthesis {
  /** Summary of what we learned */
  keySummary: string;

  /** Specific, actionable recommendations */
  recommendations: Array<{
    action: string;
    rationale: string;
    priority: 'must-do' | 'should-do' | 'consider';
  }>;

  /** The narrative we're building for their application */
  applicationNarrative: string;

  /** Concerns that remain */
  remainingConcerns: string[];

  /** Strengths to leverage */
  strengthsToLeverage: string[];
}

export function generateFinalSynthesis(
  profile: StudentProfile,
  conversationContext: ConversationContext
): FinalSynthesis {
  const insights = conversationContext.allInsights;
  const learned = conversationContext.learnedFromConversation;

  const recommendations: FinalSynthesis['recommendations'] = [];
  const remainingConcerns: string[] = [];
  const strengthsToLeverage: string[] = [];

  // Build recommendations from insights + what we learned
  for (const insight of insights) {
    if (insight.strategicImplication.includes('step up') || insight.strategicImplication.includes('AP')) {
      if (learned['capability_confirmed'] === 'high') {
        recommendations.push({
          action: 'Step up to AP level in your strongest subjects',
          rationale: insight.strategicImplication,
          priority: 'should-do',
        });
      }
    }

    if (insight.observation.includes('dropped') && !learned['decline_explained']) {
      remainingConcerns.push('Grade decline still needs explanation');
    }

    if (insight.observation.includes('strongest subject')) {
      strengthsToLeverage.push(insight.observation);
    }
  }

  // Build narrative summary
  const narrativeParts: string[] = [];

  if (learned['trajectory_story']) {
    narrativeParts.push(learned['trajectory_story']);
  }

  if (strengthsToLeverage.length > 0) {
    narrativeParts.push(`Your strength in ${strengthsToLeverage[0]} should be central to your application.`);
  }

  if (profile.intendedMajor && learned['major_authentic'] === 'true') {
    narrativeParts.push(`Your interest in ${profile.intendedMajor} is genuine and should be developed further.`);
  }

  return {
    keySummary: `Based on our conversation, I have a clearer picture of your true capabilities versus what your grades show.`,
    recommendations,
    applicationNarrative: narrativeParts.join(' '),
    remainingConcerns,
    strengthsToLeverage,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatSubject(subject: SubjectArea): string {
  const names: Record<string, string> = {
    math: 'Math',
    science: 'Science',
    english: 'English',
    social_studies: 'Social Studies',
    foreign_language: 'Foreign Language',
    computer_science: 'Computer Science',
  };
  return names[subject] || subject.charAt(0).toUpperCase() + subject.slice(1).replace(/_/g, ' ');
}

function getMajorKey(major: string): keyof typeof COURSE_RIGOR_BENCHMARKS.major_specific_rigor | null {
  const majorLower = major.toLowerCase();

  if (majorLower.includes('engineer') || majorLower.includes('computer') || majorLower.includes('cs')) {
    return 'engineering_cs';
  }
  if (majorLower.includes('med') || majorLower.includes('bio') || majorLower.includes('pre-med')) {
    return 'pre_med';
  }
  if (majorLower.includes('english') || majorLower.includes('history') || majorLower.includes('philosophy')) {
    return 'humanities';
  }
  if (majorLower.includes('business') || majorLower.includes('econ')) {
    return 'business_economics';
  }

  return null;
}

function getAlignedSubjects(major: string): SubjectArea[] {
  const majorLower = major.toLowerCase();

  // CS/Engineering - includes "computer science", "cs", "software", "engineering"
  if (majorLower.includes('computer') || majorLower.includes('engineer') || majorLower.includes('cs') || majorLower.includes('software')) {
    return ['math', 'science', 'computer_science'];
  }
  // Pre-med/Biology
  if (majorLower.includes('med') || majorLower.includes('bio') || majorLower.includes('health')) {
    return ['science', 'math'];
  }
  // Humanities
  if (majorLower.includes('english') || majorLower.includes('history') || majorLower.includes('literature')) {
    return ['english', 'social_studies'];
  }
  // Business/Economics
  if (majorLower.includes('business') || majorLower.includes('econ') || majorLower.includes('finance')) {
    return ['math', 'social_studies'];
  }
  // Math/Physics/Data Science
  if (majorLower.includes('math') || majorLower.includes('physics') || majorLower.includes('data')) {
    return ['math', 'science'];
  }

  return [];
}

function getSchoolRigorExpectation(schoolType: string): { min: number; expected: number } {
  const expectations: Record<string, { min: number; expected: number }> = {
    'elite_prep': { min: 0.6, expected: 0.8 },
    'competitive_magnet': { min: 0.6, expected: 0.75 },
    'well_resourced_suburban': { min: 0.4, expected: 0.6 },
    'average_public': { min: 0.3, expected: 0.5 },
    'under_resourced': { min: 0.1, expected: 0.3 },
    'rural_remote': { min: 0.1, expected: 0.3 },
  };

  return expectations[schoolType] || { min: 0.3, expected: 0.5 };
}

function extractSubjectFromInsight(insight: ProfileInsight): string {
  const subjectNames = ['Math', 'Science', 'English', 'Social Studies', 'Foreign Language', 'Computer Science'];

  for (const name of subjectNames) {
    if (insight.observation.includes(name)) {
      return name;
    }
  }

  return 'this subject';
}

// ============================================================================
// ASYNC FOLLOW-UP WITH RESEARCH INTEGRATION
// ============================================================================

/**
 * ASYNC version of generateFollowUp that:
 * 1. Uses unified research assembly for deep context
 * 2. Calls LLM for natural, flowing responses
 * 3. Dynamically pulls relevant course knowledge based on conversation topic
 *
 * This is the PREFERRED method for production use.
 */
export async function generateFollowUpAsync(
  profile: StudentProfile,
  studentResponse: StudentResponse,
  context: ConversationContext
): Promise<AdvisorFollowUp & { naturalMessage: string }> {
  // First get the template-based response as fallback and for structure
  const templateResponse = generateFollowUp(profile, studentResponse, context);

  // Assemble research context for the LLM
  const researchContext: ResearchStudentContext = {
    quantitativeAnalysis: profile.quantitativeAnalysis,
    intendedMajor: profile.intendedMajor,
    currentGrade: profile.currentGrade,
    schoolContext: profile.schoolContext,
    targetSchools: profile.targetSchools,
  };

  const assembledResearch = assembleResearchForStudent(researchContext);

  // Detect what the student is talking about to pull relevant context
  const responseText = studentResponse.message.toLowerCase();
  const topicContext = detectConversationTopics(responseText, profile.intendedMajor);

  // Build academic patterns for the natural response generator
  const academicPatterns = buildAcademicPatterns(profile);

  // Build the conversation context for the natural response generator
  const conversationOverallGPA = calculateOverallGPA(profile.quantitativeAnalysis);
  const naturalContext: NaturalConversationContext = {
    student: {
      grade: profile.currentGrade,
      intendedMajor: profile.intendedMajor || 'Undecided',
      schoolType: profile.schoolContext.type.replace(/_/g, ' '),
      overallGPA: conversationOverallGPA,
      trajectory: profile.quantitativeAnalysis.progressionTrajectory.historical.overallTrend as
        | 'ascending'
        | 'descending'
        | 'stable'
        | 'erratic',
    },
    academicPatterns,
    insights: context.allInsights,
    currentExchange: {
      phase: context.answersCollected.length >= 2 ? 'synthesis' : 'exploration',
      turnNumber: context.answersCollected.length + 1,
      ourLastQuestion: studentResponse.questionAnswered,
      theirResponse: studentResponse.message,
      emotionalTone: detectEmotionalTone(studentResponse.message),
      whatWeLearned: [templateResponse.learnedInsight],
    },
    informationGaps: context.remainingQuestions.map((q) => q.purpose),
    // Pass the comprehensive research context
    assembledResearchContext: assembledResearch.llmFormattedContext,
  };

  // Generate natural response using LLM with enriched research context
  const naturalResponse = await generateNaturalResponse(naturalContext);

  return {
    ...templateResponse,
    message: templateResponse.message, // Keep template as fallback
    naturalMessage: naturalResponse.message, // LLM-generated natural version
  };
}

/**
 * Detect what topics the student is discussing to pull relevant context
 */
function detectConversationTopics(
  response: string,
  intendedMajor?: string
): {
  mentionsAP: boolean;
  mentionsFear: boolean;
  mentionsEffort: boolean;
  mentionsMajor: boolean;
  specificCourses: string[];
} {
  const specificCourses: string[] = [];

  // Check for specific AP course mentions
  const apCoursePatterns = [
    { pattern: /calculus\s*bc/i, course: 'AP Calculus BC' },
    { pattern: /calculus\s*ab/i, course: 'AP Calculus AB' },
    { pattern: /physics\s*c/i, course: 'AP Physics C: Mechanics' },
    { pattern: /physics\s*1/i, course: 'AP Physics 1' },
    { pattern: /computer\s*science\s*a/i, course: 'AP Computer Science A' },
    { pattern: /chemistry/i, course: 'AP Chemistry' },
    { pattern: /biology/i, course: 'AP Biology' },
    { pattern: /english\s*lit/i, course: 'AP English Literature' },
    { pattern: /us\s*history|apush/i, course: 'AP US History' },
  ];

  for (const { pattern, course } of apCoursePatterns) {
    if (pattern.test(response)) {
      specificCourses.push(course);
    }
  }

  return {
    mentionsAP: /\bap\b|advanced\s*placement/i.test(response),
    mentionsFear: /scared|worried|afraid|nervous|anxious|hard|difficult|struggle/i.test(response),
    mentionsEffort: /easy|naturally|don't study|barely|minimal|hours|time/i.test(response),
    mentionsMajor: intendedMajor
      ? new RegExp(intendedMajor.split(' ')[0], 'i').test(response)
      : false,
    specificCourses,
  };
}

/**
 * Detect emotional tone from student response
 */
function detectEmotionalTone(
  response: string
): 'positive' | 'negative' | 'neutral' | 'anxious' | 'defensive' | 'open' {
  const text = response.toLowerCase();

  if (/scared|worried|anxious|nervous|afraid/i.test(text)) {
    return 'anxious';
  }
  if (/but|however|i mean|not really|i guess/i.test(text) && text.length < 50) {
    return 'defensive';
  }
  if (/love|excited|passionate|fascinated|enjoy/i.test(text)) {
    return 'positive';
  }
  if (/hate|frustrated|annoyed|stress/i.test(text)) {
    return 'negative';
  }
  if (text.length > 100 || /because|reason|think|feel/i.test(text)) {
    return 'open';
  }

  return 'neutral';
}

// ============================================================================
// EXPORTS
// ============================================================================

export const insightDrivenAdvisor = {
  extractProfileInsights,
  generateStrategicQuestions,
  generateInsightDrivenOpener,
  generateInsightDrivenOpenerAsync, // LLM-powered natural version
  generateFollowUp,
  generateFollowUpAsync, // NEW: LLM-powered follow-up with research
  generateFinalSynthesis,
};

// Re-export knowledge bases for convenience
export { AP_COURSES, getAPCourse, getCoursesForMajor, formatPassRate } from './academicCourseKnowledgeBase';
export { COLLEGE_TIERS, getMajorExpectations, assessMajorReadiness } from './collegeExpectationsDatabase';
export { generateNaturalOpening, generateNaturalResponse, generateAPCourseTeaching } from './naturalResponseGenerator';
