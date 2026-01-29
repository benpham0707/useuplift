/**
 * Course Commitment Analyzer Service
 *
 * Analyzes course selection patterns to detect commitment signals:
 * - Multi-year sequences (4-year language, math progression, etc.)
 * - Deepening within disciplines (Honors → AP progression)
 * - Subject drops (especially after poor grades)
 * - Evidence of sustained academic interests
 *
 * Pure heuristic analysis - no LLM required.
 *
 * @version 1.0
 * @date January 2026
 * @research Section 6.1, 6.2: Course rigor and progression
 */

import type { AcademicHistoryInput, CourseRecord } from './academicHistoryAnalyzer';

// ============================================================================
// TYPES
// ============================================================================

export interface CourseSequence {
  subject: string;
  subjectArea: 'math' | 'science' | 'english' | 'social_studies' | 'foreign_language' | 'arts' | 'cs' | 'other';
  courses: Array<{
    name: string;
    year: 9 | 10 | 11 | 12;
    level: string;
    grade: string;
  }>;
  years: ('freshman' | 'sophomore' | 'junior' | 'senior')[];
  progression: 'deepening' | 'maintaining' | 'declining';
  highestLevel: string;
  startedYear: 9 | 10 | 11 | 12;
  endedYear: 9 | 10 | 11 | 12;
  droppedAfterPoorGrade: boolean;
  poorGradeBeforeDrop?: string;
}

export interface SubjectDrop {
  subject: string;
  droppedAfterYear: 'freshman' | 'sophomore' | 'junior' | 'senior';
  lastGrade: string;
  reasonSuspected: 'avoidance' | 'scheduling' | 'requirement_met' | 'unknown';
  severity: 'minor' | 'moderate' | 'concerning';
}

export interface CommitmentSignal {
  type: 'positive' | 'negative';
  signal: string;
  evidence: string;
  weight: number; // Impact on overall commitment score
}

export interface CommitmentAnalysis {
  // Sequences found
  sustainedSequences: CourseSequence[];   // 3+ years
  moderateSequences: CourseSequence[];    // 2 years
  shortSequences: CourseSequence[];       // 1 year only

  // Concerning drops
  concerningDrops: SubjectDrop[];

  // Commitment signals
  signals: {
    positive: CommitmentSignal[];
    negative: CommitmentSignal[];
  };

  // By-subject analysis
  subjectDepth: Array<{
    subject: string;
    yearsStudied: number;
    highestLevel: string;
    progression: 'deepening' | 'maintaining' | 'declining';
    commitmentScore: number; // 0-100 for this subject
  }>;

  // Overall score
  overallCommitmentScore: number; // 0-100

  // Teaching insight
  teachingInsight: string;

  // Research citation
  researchBasis: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Subject area classifications
 */
const SUBJECT_CLASSIFICATIONS: Record<string, CourseSequence['subjectArea']> = {
  // Math
  algebra: 'math',
  geometry: 'math',
  precalculus: 'math',
  'pre-calculus': 'math',
  precalc: 'math',
  calculus: 'math',
  'calc ab': 'math',
  'calc bc': 'math',
  'ap calculus': 'math',
  statistics: 'math',
  'ap statistics': 'math',
  'multivariable calculus': 'math',
  'linear algebra': 'math',
  'discrete math': 'math',

  // Science
  biology: 'science',
  'ap biology': 'science',
  chemistry: 'science',
  'ap chemistry': 'science',
  physics: 'science',
  'ap physics': 'science',
  'environmental science': 'science',
  'ap environmental': 'science',
  anatomy: 'science',
  'earth science': 'science',

  // English
  english: 'english',
  'ap english': 'english',
  'ap literature': 'english',
  'ap language': 'english',
  literature: 'english',
  composition: 'english',
  'creative writing': 'english',

  // Social Studies
  history: 'social_studies',
  'world history': 'social_studies',
  'us history': 'social_studies',
  'ap us history': 'social_studies',
  'ap world history': 'social_studies',
  'ap european history': 'social_studies',
  government: 'social_studies',
  'ap government': 'social_studies',
  economics: 'social_studies',
  'ap economics': 'social_studies',
  'ap macro': 'social_studies',
  'ap micro': 'social_studies',
  psychology: 'social_studies',
  'ap psychology': 'social_studies',
  sociology: 'social_studies',

  // Foreign Language
  spanish: 'foreign_language',
  french: 'foreign_language',
  german: 'foreign_language',
  chinese: 'foreign_language',
  mandarin: 'foreign_language',
  japanese: 'foreign_language',
  latin: 'foreign_language',
  italian: 'foreign_language',
  korean: 'foreign_language',
  arabic: 'foreign_language',

  // CS
  'computer science': 'cs',
  programming: 'cs',
  'ap computer science': 'cs',
  'ap cs': 'cs',
  coding: 'cs',
  'web development': 'cs',

  // Arts
  art: 'arts',
  music: 'arts',
  band: 'arts',
  orchestra: 'arts',
  choir: 'arts',
  theater: 'arts',
  drama: 'arts',
  dance: 'arts',
  'studio art': 'arts',
  'ap art': 'arts',
  'art history': 'arts',
  'ap art history': 'arts',
};

/**
 * Level hierarchy for progression analysis
 */
const LEVEL_HIERARCHY: Record<string, number> = {
  regular: 1,
  accelerated: 2,
  honors: 3,
  ib_sl: 4,
  dual_enrollment: 5,
  ib_hl: 6,
  ap: 6,
};

/**
 * Year to name mapping
 */
const YEAR_NAMES: Record<number, 'freshman' | 'sophomore' | 'junior' | 'senior'> = {
  9: 'freshman',
  10: 'sophomore',
  11: 'junior',
  12: 'senior',
};

/**
 * Grade quality mapping
 */
const GRADE_QUALITY: Record<string, number> = {
  'A+': 4.3, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0,
};

// ============================================================================
// COURSE COMMITMENT ANALYZER CLASS
// ============================================================================

export class CourseCommitmentAnalyzer {
  /**
   * Analyze course commitment patterns
   */
  analyze(input: AcademicHistoryInput): CommitmentAnalysis {
    // Group courses by subject area
    const coursesBySubject = this.groupCoursesBySubject(input.courses);

    // Build sequences
    const sequences = this.buildSequences(coursesBySubject);

    // Identify drops
    const drops = this.identifyDrops(coursesBySubject, input.courses);

    // Generate commitment signals
    const signals = this.generateSignals(sequences, drops);

    // Calculate subject depth
    const subjectDepth = this.calculateSubjectDepth(sequences);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(sequences, drops, signals);

    // Generate teaching insight
    const teachingInsight = this.generateTeachingInsight(sequences, drops, signals);

    // Categorize sequences by length
    const sustainedSequences = sequences.filter(s => s.years.length >= 3);
    const moderateSequences = sequences.filter(s => s.years.length === 2);
    const shortSequences = sequences.filter(s => s.years.length === 1);

    return {
      sustainedSequences,
      moderateSequences,
      shortSequences,
      concerningDrops: drops,
      signals,
      subjectDepth,
      overallCommitmentScore: overallScore,
      teachingInsight,
      researchBasis: 'Section 6.1: Course rigor hierarchy. Multi-year sequences in challenging subjects demonstrate genuine intellectual commitment vs. course "sampling."',
    };
  }

  // ========================================================================
  // GROUPING & CLASSIFICATION
  // ========================================================================

  private groupCoursesBySubject(courses: CourseRecord[]): Map<string, CourseRecord[]> {
    const grouped = new Map<string, CourseRecord[]>();

    for (const course of courses) {
      const subjectArea = this.classifySubject(course.name);
      const key = `${subjectArea}_${this.normalizeSubjectName(course.name)}`;

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(course);
    }

    return grouped;
  }

  private classifySubject(courseName: string): CourseSequence['subjectArea'] {
    const normalized = courseName.toLowerCase().trim();

    // Check exact matches first
    for (const [keyword, area] of Object.entries(SUBJECT_CLASSIFICATIONS)) {
      if (normalized.includes(keyword)) {
        return area;
      }
    }

    return 'other';
  }

  private normalizeSubjectName(courseName: string): string {
    const normalized = courseName.toLowerCase().trim();

    // Remove level prefixes
    const withoutLevel = normalized
      .replace(/^(ap|ib|honors?|h\s+|advanced)\s+/i, '')
      .replace(/\s+(1|2|3|4|i|ii|iii|iv|a|b|c)$/i, '')
      .trim();

    // Find the base subject
    for (const keyword of Object.keys(SUBJECT_CLASSIFICATIONS)) {
      if (withoutLevel.includes(keyword)) {
        return keyword;
      }
    }

    return withoutLevel.split(' ')[0]; // First word as fallback
  }

  // ========================================================================
  // SEQUENCE BUILDING
  // ========================================================================

  private buildSequences(coursesBySubject: Map<string, CourseRecord[]>): CourseSequence[] {
    const sequences: CourseSequence[] = [];

    for (const [key, courses] of coursesBySubject) {
      if (courses.length === 0) continue;

      // Sort by year
      const sorted = [...courses].sort((a, b) => a.year - b.year);

      const subjectArea = this.classifySubject(sorted[0].name);
      const baseSubject = key.split('_')[1] || sorted[0].name;

      const years = [...new Set(sorted.map(c => YEAR_NAMES[c.year]))];
      const levels = sorted.map(c => LEVEL_HIERARCHY[c.level] || 1);

      // Determine progression
      let progression: CourseSequence['progression'] = 'maintaining';
      if (levels.length >= 2) {
        const firstAvg = levels.slice(0, Math.ceil(levels.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(levels.length / 2);
        const lastAvg = levels.slice(Math.floor(levels.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(levels.length / 2);

        if (lastAvg > firstAvg + 0.5) progression = 'deepening';
        else if (lastAvg < firstAvg - 0.5) progression = 'declining';
      }

      // Find highest level
      const highestLevelValue = Math.max(...levels);
      const highestLevel = Object.entries(LEVEL_HIERARCHY).find(([, v]) => v === highestLevelValue)?.[0] || 'regular';

      // Check for drop after poor grade
      let droppedAfterPoorGrade = false;
      let poorGradeBeforeDrop: string | undefined;

      if (sorted.length > 0 && sorted[sorted.length - 1].year < 12) {
        const lastCourse = sorted[sorted.length - 1];
        const gradeValue = GRADE_QUALITY[lastCourse.grade.toUpperCase()] ?? 3.0;
        if (gradeValue < 2.5) {
          droppedAfterPoorGrade = true;
          poorGradeBeforeDrop = lastCourse.grade;
        }
      }

      sequences.push({
        subject: baseSubject,
        subjectArea,
        courses: sorted.map(c => ({
          name: c.name,
          year: c.year,
          level: c.level,
          grade: c.grade,
        })),
        years,
        progression,
        highestLevel,
        startedYear: sorted[0].year,
        endedYear: sorted[sorted.length - 1].year,
        droppedAfterPoorGrade,
        poorGradeBeforeDrop,
      });
    }

    return sequences;
  }

  // ========================================================================
  // DROP DETECTION
  // ========================================================================

  private identifyDrops(
    coursesBySubject: Map<string, CourseRecord[]>,
    allCourses: CourseRecord[]
  ): SubjectDrop[] {
    const drops: SubjectDrop[] = [];

    // Core subjects that students typically continue
    const coreSubjects = ['math', 'science', 'foreign_language'];

    for (const [key, courses] of coursesBySubject) {
      const subjectArea = key.split('_')[0] as CourseSequence['subjectArea'];
      const subject = key.split('_')[1] || 'unknown';

      if (!courses.length) continue;

      const sorted = [...courses].sort((a, b) => a.year - b.year);
      const lastYear = sorted[sorted.length - 1].year;
      const lastGrade = sorted[sorted.length - 1].grade;

      // Check if dropped before senior year
      if (lastYear < 12) {
        const gradeValue = GRADE_QUALITY[lastGrade.toUpperCase()] ?? 3.0;

        let reasonSuspected: SubjectDrop['reasonSuspected'] = 'unknown';
        let severity: SubjectDrop['severity'] = 'minor';

        // Check if dropped after poor grade
        if (gradeValue < 2.5) {
          reasonSuspected = 'avoidance';
          severity = 'concerning';
        } else if (lastYear === 9 || lastYear === 10) {
          // Dropped early in sequence
          if (coreSubjects.includes(subjectArea)) {
            reasonSuspected = 'avoidance';
            severity = 'moderate';
          } else {
            reasonSuspected = 'scheduling';
            severity = 'minor';
          }
        } else if (sorted.length >= 2) {
          // Met minimum but didn't continue
          reasonSuspected = 'requirement_met';
          severity = 'minor';
        }

        // Foreign language drops are more notable
        if (subjectArea === 'foreign_language' && lastYear < 11) {
          severity = severity === 'minor' ? 'moderate' : 'concerning';
        }

        drops.push({
          subject,
          droppedAfterYear: YEAR_NAMES[lastYear],
          lastGrade,
          reasonSuspected,
          severity,
        });
      }
    }

    return drops.filter(d => d.severity !== 'minor'); // Only return notable drops
  }

  // ========================================================================
  // SIGNAL GENERATION
  // ========================================================================

  private generateSignals(
    sequences: CourseSequence[],
    drops: SubjectDrop[]
  ): CommitmentAnalysis['signals'] {
    const positive: CommitmentSignal[] = [];
    const negative: CommitmentSignal[] = [];

    // Positive signals

    // 4-year sequences
    const fourYearSequences = sequences.filter(s => s.years.length === 4);
    for (const seq of fourYearSequences) {
      positive.push({
        type: 'positive',
        signal: `4-year commitment to ${seq.subject}`,
        evidence: `Studied ${seq.subject} from freshman to senior year`,
        weight: 15,
      });
    }

    // Deepening progressions
    const deepeningSequences = sequences.filter(s => s.progression === 'deepening' && s.years.length >= 2);
    for (const seq of deepeningSequences) {
      positive.push({
        type: 'positive',
        signal: `Deepening rigor in ${seq.subject}`,
        evidence: `Progressed to ${seq.highestLevel} level`,
        weight: 10,
      });
    }

    // Multiple AP/IB in same area
    const advancedByArea = new Map<string, number>();
    for (const seq of sequences) {
      if (['ap', 'ib_hl'].includes(seq.highestLevel)) {
        const count = advancedByArea.get(seq.subjectArea) || 0;
        advancedByArea.set(seq.subjectArea, count + 1);
      }
    }
    for (const [area, count] of advancedByArea) {
      if (count >= 2) {
        positive.push({
          type: 'positive',
          signal: `Multiple advanced courses in ${area}`,
          evidence: `${count} AP/IB courses in ${area}`,
          weight: 12,
        });
      }
    }

    // 4 years of foreign language
    const languageSequences = sequences.filter(s => s.subjectArea === 'foreign_language');
    for (const seq of languageSequences) {
      if (seq.years.length >= 4) {
        positive.push({
          type: 'positive',
          signal: '4+ years of foreign language',
          evidence: `Studied ${seq.subject} for ${seq.years.length} years`,
          weight: 15,
        });
      }
    }

    // Math through calculus or beyond
    const mathSequences = sequences.filter(s => s.subjectArea === 'math');
    const hasCalculus = mathSequences.some(s =>
      s.courses.some(c => c.name.toLowerCase().includes('calculus'))
    );
    if (hasCalculus) {
      positive.push({
        type: 'positive',
        signal: 'Math progression through calculus',
        evidence: 'Completed calculus coursework',
        weight: 12,
      });
    }

    // Negative signals

    // Drops after poor grades
    const avoidanceDrops = drops.filter(d => d.reasonSuspected === 'avoidance');
    for (const drop of avoidanceDrops) {
      negative.push({
        type: 'negative',
        signal: `Dropped ${drop.subject} after low grade`,
        evidence: `Last grade: ${drop.lastGrade}, dropped after ${drop.droppedAfterYear}`,
        weight: -10,
      });
    }

    // Short foreign language
    const shortLanguage = languageSequences.filter(s => s.years.length <= 2);
    for (const seq of shortLanguage) {
      negative.push({
        type: 'negative',
        signal: 'Limited foreign language commitment',
        evidence: `Only ${seq.years.length} year(s) of ${seq.subject}`,
        weight: -8,
      });
    }

    // Declining sequences in core subjects
    const decliningCore = sequences.filter(s =>
      s.progression === 'declining' &&
      ['math', 'science', 'english'].includes(s.subjectArea)
    );
    for (const seq of decliningCore) {
      negative.push({
        type: 'negative',
        signal: `Declining rigor in ${seq.subject}`,
        evidence: `Course difficulty decreased over time`,
        weight: -8,
      });
    }

    return { positive, negative };
  }

  // ========================================================================
  // SUBJECT DEPTH CALCULATION
  // ========================================================================

  private calculateSubjectDepth(sequences: CourseSequence[]): CommitmentAnalysis['subjectDepth'] {
    // Group by subject area
    const byArea = new Map<string, CourseSequence[]>();
    for (const seq of sequences) {
      const existing = byArea.get(seq.subjectArea) || [];
      byArea.set(seq.subjectArea, [...existing, seq]);
    }

    const depth: CommitmentAnalysis['subjectDepth'] = [];

    for (const [area, areaSequences] of byArea) {
      // Find the longest/deepest sequence in this area
      const best = areaSequences.reduce((a, b) => {
        const aScore = a.years.length * 10 + LEVEL_HIERARCHY[a.highestLevel] * 5;
        const bScore = b.years.length * 10 + LEVEL_HIERARCHY[b.highestLevel] * 5;
        return bScore > aScore ? b : a;
      });

      // Calculate commitment score for this subject
      let score = 50; // Base score
      score += best.years.length * 12; // Years bonus
      score += LEVEL_HIERARCHY[best.highestLevel] * 5; // Level bonus
      if (best.progression === 'deepening') score += 10;
      if (best.progression === 'declining') score -= 15;
      if (best.droppedAfterPoorGrade) score -= 20;

      depth.push({
        subject: area,
        yearsStudied: best.years.length,
        highestLevel: best.highestLevel,
        progression: best.progression,
        commitmentScore: Math.max(0, Math.min(100, score)),
      });
    }

    return depth.sort((a, b) => b.commitmentScore - a.commitmentScore);
  }

  // ========================================================================
  // OVERALL SCORE
  // ========================================================================

  private calculateOverallScore(
    sequences: CourseSequence[],
    drops: SubjectDrop[],
    signals: CommitmentAnalysis['signals']
  ): number {
    let score = 50; // Base score

    // Add positive signal weights
    for (const signal of signals.positive) {
      score += signal.weight;
    }

    // Add negative signal weights
    for (const signal of signals.negative) {
      score += signal.weight; // Already negative
    }

    // Bonus for sustained sequences
    const sustainedCount = sequences.filter(s => s.years.length >= 3).length;
    score += sustainedCount * 5;

    // Penalty for concerning drops
    const concerningDropCount = drops.filter(d => d.severity === 'concerning').length;
    score -= concerningDropCount * 8;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // ========================================================================
  // TEACHING INSIGHT
  // ========================================================================

  private generateTeachingInsight(
    sequences: CourseSequence[],
    drops: SubjectDrop[],
    signals: CommitmentAnalysis['signals']
  ): string {
    const hasStrongCommitment = signals.positive.length >= 3;
    const hasConcerningPatterns = signals.negative.length >= 2;
    const sustainedCount = sequences.filter(s => s.years.length >= 3).length;

    if (hasStrongCommitment && !hasConcerningPatterns) {
      return "Your course selection shows sustained intellectual commitment. Multi-year sequences and progressively challenging courses demonstrate genuine academic interest rather than course 'sampling.' Colleges notice this depth.";
    }

    if (hasConcerningPatterns) {
      const hasDropAfterGrade = drops.some(d => d.reasonSuspected === 'avoidance');
      if (hasDropAfterGrade) {
        return "Dropping subjects after receiving lower grades can appear as avoiding challenge. Colleges look for students who persist through difficulty. Consider whether there's a compelling reason to explain these changes, or ways to demonstrate continued interest outside of school courses.";
      }
      return "Your course selection shows some patterns that may raise questions. Colleges look for sustained commitment to subjects rather than brief exploration. Consider ways to demonstrate depth, such as summer programs, independent projects, or continued study.";
    }

    if (sustainedCount >= 2) {
      return "You've shown good commitment to several subjects. Consider whether you can deepen your engagement further - taking AP/IB courses in areas of genuine interest, or connecting coursework to extracurricular activities for a more coherent profile.";
    }

    return "Building longer sequences in subjects that interest you will strengthen your academic profile. Colleges value depth over breadth - 4 years of one language is stronger than 2 years each of two languages.";
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const courseCommitmentAnalyzer = new CourseCommitmentAnalyzer();

/**
 * Convenience function for commitment analysis
 */
export function analyzeCommitment(input: AcademicHistoryInput): CommitmentAnalysis {
  return courseCommitmentAnalyzer.analyze(input);
}
