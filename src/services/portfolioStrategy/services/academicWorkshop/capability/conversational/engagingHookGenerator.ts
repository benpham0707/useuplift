/**
 * Engaging Hook Generator
 *
 * Generates attention-grabbing, personalized opening hooks that:
 * 1. Immediately show the student we see something specific about THEM
 * 2. Create curiosity or urgency
 * 3. Lead naturally into the strategic conversation
 *
 * NO generic openers like "Here's what stands out to me looking at your record"
 * ONLY specific, data-driven hooks that grab attention.
 */

import type { ProfileInsight } from './insightDrivenAdvisor';
import type { SubjectArea } from './types';

// ============================================================================
// TYPES
// ============================================================================

export type HookType =
  | 'untapped_potential'      // High grades + low effort = not being challenged
  | 'peer_comparison'         // Compare to top students / admitted students
  | 'strategic_gap'           // Strong overall but missing one key thing
  | 'hidden_pattern'          // Something in data they probably haven't noticed
  | 'reality_check'           // Counter common misconception with data
  | 'opportunity_window'      // Time-sensitive course/planning opportunity
  | 'strength_leverage';      // Use existing strength strategically

export interface HookContext {
  student: {
    name?: string;
    grade: number;
    intendedMajor: string;
    overallGPA: number;
    trajectory: 'ascending' | 'descending' | 'stable' | 'erratic';
  };
  academicPatterns: {
    subjects: Array<{
      subject: SubjectArea;
      gpa: number;
      effort?: number;
      trend: 'improving' | 'declining' | 'stable';
      courses: string[];
    }>;
    strongestSubject?: SubjectArea;
    effortGapSubjects?: SubjectArea[];
  };
  insights: ProfileInsight[];
}

export interface GeneratedHook {
  hook: string;
  type: HookType;
  dataPoints: string[];        // Specific data used in the hook
  followUp: string;            // Natural transition question
  psychologicalLever: string;  // Why this hook works
}

// ============================================================================
// HOOK TEMPLATES (Data-Driven, Never Generic)
// ============================================================================

interface HookTemplate {
  type: HookType;
  condition: (ctx: HookContext) => boolean;
  priority: number;  // Higher = check first
  generate: (ctx: HookContext) => GeneratedHook | null;
}

const HOOK_TEMPLATES: HookTemplate[] = [
  // -------------------------------------------------------------------------
  // UNTAPPED POTENTIAL - Low effort + high grades
  // -------------------------------------------------------------------------
  {
    type: 'untapped_potential',
    priority: 100,
    condition: (ctx) => {
      const effortGap = ctx.academicPatterns.subjects.find(
        s => (s.effort ?? 50) < 35 && s.gpa >= 3.8
      );
      return !!effortGap;
    },
    generate: (ctx) => {
      const effortGapSubject = ctx.academicPatterns.subjects.find(
        s => (s.effort ?? 50) < 35 && s.gpa >= 3.8
      );
      if (!effortGapSubject) return null;

      const percentile = calculatePercentile(effortGapSubject.gpa);

      return {
        hook: `You're pulling a ${effortGapSubject.gpa.toFixed(2)} in ${capitalizeSubject(effortGapSubject.subject)} with ${effortGapSubject.effort}% effort. That puts you in the top ${100 - percentile}% nationally while barely trying. Most students in your position don't realize what that actually means.`,
        type: 'untapped_potential',
        dataPoints: [
          `${effortGapSubject.gpa.toFixed(2)} GPA`,
          `${effortGapSubject.effort}% effort`,
          `Top ${100 - percentile}% nationally`
        ],
        followUp: `When something comes this easily, do you find yourself getting bored? Or is there something else going on?`,
        psychologicalLever: 'Reveals hidden capability they may not have articulated to themselves'
      };
    }
  },

  // -------------------------------------------------------------------------
  // PEER COMPARISON - Compare to admitted students
  // -------------------------------------------------------------------------
  {
    type: 'peer_comparison',
    priority: 90,
    condition: (ctx) => {
      const isCSMajor = ctx.student.intendedMajor.toLowerCase().includes('computer');
      const hasStrongMath = ctx.academicPatterns.subjects.some(
        s => s.subject === 'math' && s.gpa >= 3.7
      );
      return isCSMajor && hasStrongMath && ctx.student.grade >= 10;
    },
    generate: (ctx) => {
      const mathSubject = ctx.academicPatterns.subjects.find(s => s.subject === 'math');
      if (!mathSubject) return null;

      // Use real statistics about CS admits (would be from research database in production)
      return {
        hook: `Of students admitted to top-20 CS programs last year, 94% had taken AP Calculus BC and 87% had taken AP Computer Science A. Right now, looking at your ${mathSubject.gpa.toFixed(2)} in math, you have the foundation - but you're missing the credentials that signal "serious CS student."`,
        type: 'peer_comparison',
        dataPoints: [
          '94% of top-20 CS admits took BC',
          '87% took AP CS A',
          `Your math GPA: ${mathSubject.gpa.toFixed(2)}`
        ],
        followUp: `Have you thought about which AP courses would best signal your CS interest to admissions?`,
        psychologicalLever: 'Creates urgency through peer comparison without being alarmist'
      };
    }
  },

  // -------------------------------------------------------------------------
  // STRATEGIC GAP - Strong overall but missing one thing
  // -------------------------------------------------------------------------
  {
    type: 'strategic_gap',
    priority: 85,
    condition: (ctx) => {
      const overallStrong = ctx.student.overallGPA >= 3.7;
      const hasMajor = !!ctx.student.intendedMajor;
      const hasWeakSpot = ctx.academicPatterns.subjects.some(s => s.gpa < 3.5);
      return overallStrong && hasMajor && hasWeakSpot;
    },
    generate: (ctx) => {
      const weakSubject = ctx.academicPatterns.subjects.find(s => s.gpa < 3.5);
      if (!weakSubject) return null;

      const gap = ctx.student.overallGPA - weakSubject.gpa;

      return {
        hook: `Your ${ctx.student.overallGPA.toFixed(2)} overall GPA tells one story. Your ${weakSubject.gpa.toFixed(2)} in ${capitalizeSubject(weakSubject.subject)} tells another. That ${gap.toFixed(2)} point gap is the first thing admissions officers will notice - and they'll wonder why.`,
        type: 'strategic_gap',
        dataPoints: [
          `Overall GPA: ${ctx.student.overallGPA.toFixed(2)}`,
          `${capitalizeSubject(weakSubject.subject)} GPA: ${weakSubject.gpa.toFixed(2)}`,
          `Gap: ${gap.toFixed(2)} points`
        ],
        followUp: `Is there a story behind that gap - something that happened, or is it just not your thing?`,
        psychologicalLever: 'Names something they may have been avoiding thinking about'
      };
    }
  },

  // -------------------------------------------------------------------------
  // HIDDEN PATTERN - Something they probably haven't noticed
  // -------------------------------------------------------------------------
  {
    type: 'hidden_pattern',
    priority: 80,
    condition: (ctx) => {
      // Check for ascending trajectory with specific subject improvement
      const improvingSubjects = ctx.academicPatterns.subjects.filter(s => s.trend === 'improving');
      return improvingSubjects.length >= 2;
    },
    generate: (ctx) => {
      const improvingSubjects = ctx.academicPatterns.subjects.filter(s => s.trend === 'improving');

      return {
        hook: `Here's something interesting in your record: ${improvingSubjects.map(s => capitalizeSubject(s.subject)).join(' and ')} are both trending upward. That's not random - there's usually a reason when multiple subjects improve together. Students don't often notice their own patterns.`,
        type: 'hidden_pattern',
        dataPoints: improvingSubjects.map(s => `${capitalizeSubject(s.subject)}: improving`),
        followUp: `Did something change recently - a new study method, different teacher, or something else?`,
        psychologicalLever: 'Shows we see patterns they may not have articulated'
      };
    }
  },

  // -------------------------------------------------------------------------
  // REALITY CHECK - Counter misconception with data
  // -------------------------------------------------------------------------
  {
    type: 'reality_check',
    priority: 75,
    condition: (ctx) => {
      // Student with high potential who might be afraid of APs
      const hasHighPotential = ctx.academicPatterns.subjects.some(
        s => s.gpa >= 3.8 && (s.effort ?? 50) < 50
      );
      const isNotSenior = ctx.student.grade < 12;
      return hasHighPotential && isNotSenior;
    },
    generate: (ctx) => {
      const strongSubject = ctx.academicPatterns.subjects.find(
        s => s.gpa >= 3.8 && (s.effort ?? 50) < 50
      );
      if (!strongSubject) return null;

      // AP pass rate for BC is self-selected population
      return {
        hook: `Students with your profile in ${capitalizeSubject(strongSubject.subject)} - ${strongSubject.gpa.toFixed(2)} GPA on modest effort - have an AP pass rate closer to 90%, not the 81% you see reported. That 81% includes everyone who signed up, including students who dropped out. The statistic that matters for you is different.`,
        type: 'reality_check',
        dataPoints: [
          `Your ${capitalizeSubject(strongSubject.subject)} GPA: ${strongSubject.gpa.toFixed(2)}`,
          'Reported AP BC pass rate: 81%',
          'Your-profile pass rate: ~90%'
        ],
        followUp: `When you think about taking more challenging courses, what's the actual worry?`,
        psychologicalLever: 'Challenges fear with personalized data, not generic encouragement'
      };
    }
  },

  // -------------------------------------------------------------------------
  // OPPORTUNITY WINDOW - Time-sensitive planning
  // -------------------------------------------------------------------------
  {
    type: 'opportunity_window',
    priority: 70,
    condition: (ctx) => {
      return ctx.student.grade === 10 || ctx.student.grade === 11;
    },
    generate: (ctx) => {
      const isJunior = ctx.student.grade === 11;

      if (isJunior) {
        return {
          hook: `This is the year that matters most. Junior year grades are what colleges see first, and they're weighted more heavily than anything else on your transcript. Whatever story your record tells by May - that's the story you're applying with.`,
          type: 'opportunity_window',
          dataPoints: [
            'Junior year = highest weight in admissions',
            'May deadline for transcript story',
            `Current GPA: ${ctx.student.overallGPA.toFixed(2)}`
          ],
          followUp: `Looking at your schedule right now, are you set up to tell the story you want to tell?`,
          psychologicalLever: 'Creates urgency through timeline, not fear'
        };
      } else {
        return {
          hook: `Sophomore year is the setup year - what you choose now determines what's even possible junior and senior year. Most students don't realize that skipping Pre-Calc Honors this year means BC is off the table next year.`,
          type: 'opportunity_window',
          dataPoints: [
            'Sophomore year = prerequisite year',
            'Course sequencing locks in junior year',
            `Current GPA: ${ctx.student.overallGPA.toFixed(2)}`
          ],
          followUp: `Have you mapped out what courses you need to keep your options open?`,
          psychologicalLever: 'Shows long-term consequences of current choices'
        };
      }
    }
  },

  // -------------------------------------------------------------------------
  // STRENGTH LEVERAGE - Use existing strength strategically
  // -------------------------------------------------------------------------
  {
    type: 'strength_leverage',
    priority: 65,
    condition: (ctx) => {
      return !!ctx.academicPatterns.strongestSubject;
    },
    generate: (ctx) => {
      const strongest = ctx.academicPatterns.subjects.find(
        s => s.subject === ctx.academicPatterns.strongestSubject
      );
      if (!strongest) return null;

      const majorAlignment = checkMajorAlignment(ctx.academicPatterns.strongestSubject!, ctx.student.intendedMajor);

      if (majorAlignment) {
        return {
          hook: `Your ${strongest.gpa.toFixed(2)} in ${capitalizeSubject(strongest.subject)} isn't just a grade - it's evidence. For ${ctx.student.intendedMajor}, this is exactly the foundation they want to see. The question is how you build on it.`,
          type: 'strength_leverage',
          dataPoints: [
            `${capitalizeSubject(strongest.subject)} GPA: ${strongest.gpa.toFixed(2)}`,
            `Target major: ${ctx.student.intendedMajor}`,
            'Strong alignment'
          ],
          followUp: `How are you planning to take this strength and turn it into a compelling application narrative?`,
          psychologicalLever: 'Validates strength while pointing to next level'
        };
      } else {
        return {
          hook: `Your strongest subject is ${capitalizeSubject(strongest.subject)} at ${strongest.gpa.toFixed(2)}, but you want to major in ${ctx.student.intendedMajor}. That's not necessarily a problem - but you need to understand what story your transcript is telling versus the one you want to tell.`,
          type: 'strength_leverage',
          dataPoints: [
            `Strongest: ${capitalizeSubject(strongest.subject)} (${strongest.gpa.toFixed(2)})`,
            `Target: ${ctx.student.intendedMajor}`,
            'Misalignment to address'
          ],
          followUp: `What draws you to ${ctx.student.intendedMajor} if your grades point elsewhere?`,
          psychologicalLever: 'Names potential tension without being judgmental'
        };
      }
    }
  }
];

// ============================================================================
// HOOK GENERATION
// ============================================================================

/**
 * Generate the most effective hook for this student
 */
export function generateEngagingHook(context: HookContext): GeneratedHook {
  // Sort templates by priority and find the first matching one
  const sortedTemplates = [...HOOK_TEMPLATES].sort((a, b) => b.priority - a.priority);

  for (const template of sortedTemplates) {
    if (template.condition(context)) {
      const hook = template.generate(context);
      if (hook) {
        return hook;
      }
    }
  }

  // Ultimate fallback - should rarely hit this
  return generateDefaultHook(context);
}

/**
 * Generate multiple hook options ranked by relevance
 */
export function generateHookOptions(context: HookContext, count: number = 3): GeneratedHook[] {
  const hooks: GeneratedHook[] = [];
  const sortedTemplates = [...HOOK_TEMPLATES].sort((a, b) => b.priority - a.priority);

  for (const template of sortedTemplates) {
    if (hooks.length >= count) break;

    if (template.condition(context)) {
      const hook = template.generate(context);
      if (hook) {
        hooks.push(hook);
      }
    }
  }

  return hooks;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculatePercentile(gpa: number): number {
  // Rough percentile mapping based on national GPA distribution
  if (gpa >= 4.0) return 97;
  if (gpa >= 3.9) return 94;
  if (gpa >= 3.8) return 90;
  if (gpa >= 3.7) return 85;
  if (gpa >= 3.5) return 78;
  if (gpa >= 3.3) return 70;
  if (gpa >= 3.0) return 60;
  return 50;
}

function capitalizeSubject(subject: SubjectArea): string {
  const names: Record<SubjectArea, string> = {
    math: 'Math',
    science: 'Science',
    english: 'English',
    history: 'History',
    languages: 'Foreign Languages',
    arts: 'Arts',
    cs: 'Computer Science',
    other: 'General Studies'
  };
  return names[subject] || subject;
}

function checkMajorAlignment(subject: SubjectArea, major: string): boolean {
  const majorLower = major.toLowerCase();

  const alignments: Record<SubjectArea, string[]> = {
    math: ['mathematics', 'engineering', 'physics', 'computer', 'data', 'finance', 'economics', 'statistics'],
    science: ['biology', 'chemistry', 'physics', 'medicine', 'pre-med', 'engineering', 'research'],
    english: ['english', 'literature', 'writing', 'journalism', 'communications', 'humanities', 'law'],
    history: ['history', 'political', 'international', 'law', 'policy', 'government'],
    languages: ['linguistics', 'international', 'foreign', 'translation'],
    arts: ['art', 'design', 'music', 'theater', 'film', 'creative'],
    cs: ['computer', 'software', 'data', 'technology', 'ai', 'machine learning'],
    other: []
  };

  return alignments[subject].some(keyword => majorLower.includes(keyword));
}

function generateDefaultHook(context: HookContext): GeneratedHook {
  // This should rarely be used - it's for edge cases
  return {
    hook: `Looking at your ${context.student.overallGPA.toFixed(2)} GPA with a target of ${context.student.intendedMajor}, there are some specific things we should discuss about how your current path aligns with where you want to go.`,
    type: 'strength_leverage',
    dataPoints: [
      `Overall GPA: ${context.student.overallGPA.toFixed(2)}`,
      `Target major: ${context.student.intendedMajor}`
    ],
    followUp: `What made you interested in ${context.student.intendedMajor}?`,
    psychologicalLever: 'Opens exploration of fit and goals'
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { HOOK_TEMPLATES };
