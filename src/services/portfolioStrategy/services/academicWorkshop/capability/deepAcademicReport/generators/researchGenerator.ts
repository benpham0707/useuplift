/**
 * Research Generator — Section 4: Research Context
 *
 * Pure template (no LLM call). Builds the research context section
 * from verified data sources.
 *
 * Ported from monolith's generateResearchContext() with:
 * - B5 fix: Include ALL student AP courses (not just those in research set)
 * - B9 fix: Corrected NACAC 2023 values (already in Phase 1)
 */

import type { EnrichedReportContext } from '../types';
import type { ResearchContextSection } from '../types';
import { COLLEGE_TIER_BENCHMARKS } from '../context/tierCalibration';
import { AP_EXAM_STATISTICS } from '../../conversational/academicResearchFoundation';

// ============================================================================
// HELPERS
// ============================================================================

/** Characterize AP course difficulty based on exam pass rate (includes "AP course(s)" noun) */
function characterizeDifficulty(passRate: number): string {
  if (passRate >= 0.70) return 'one of the more accessible AP courses';
  if (passRate >= 0.55) return 'a moderately challenging AP course';
  return 'among the most challenging AP courses';
}

/** Format a citation object to a readable string */
function formatCitation(citation: unknown): string {
  if (typeof citation === 'string') return citation;
  if (citation && typeof citation === 'object' && 'source' in citation && 'document' in citation) {
    const c = citation as { source: string; document: string };
    return `${c.source} ${c.document}`;
  }
  return 'College Board 2024 AP Score Distributions by Subject';
}

/** Look up AP stats from AP_EXAM_STATISTICS by name (exact then substring match) */
function lookupAPStats(courseName: string): { passRate: number; fiveRate: number; citation: string } | null {
  // Exact match
  if (AP_EXAM_STATISTICS[courseName]) {
    const stats = AP_EXAM_STATISTICS[courseName];
    return { passRate: stats.passRate.value, fiveRate: stats.fiveRate.value, citation: formatCitation(stats.passRate.citation) };
  }
  // Substring match: student course name might be shorter (e.g., "AP Chemistry" matches "AP Chemistry")
  const lowerName = courseName.toLowerCase();
  for (const [key, stats] of Object.entries(AP_EXAM_STATISTICS)) {
    if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
      return { passRate: stats.passRate.value, fiveRate: stats.fiveRate.value, citation: formatCitation(stats.passRate.citation) };
    }
  }
  return null;
}

/** Build comparative student context note using course difficulty data */
function buildComparativeContext(grade: number, courseName: string, passRate: number, fiveRate: number): string {
  const passRatePct = Math.round(passRate * 100);
  const fiveRatePct = Math.round(fiveRate * 100);
  const difficulty = characterizeDifficulty(passRate);

  if (grade >= 3.7) {
    return `You earned ${grade.toFixed(2)} in ${courseName}. This AP exam has a ${passRatePct}% pass rate and ${fiveRatePct}% score-5 rate — ${difficulty}.`;
  } else if (grade >= 3.3) {
    const challengeLabel = passRate >= 0.55 ? 'moderately challenging' : 'challenging';
    return `You earned ${grade.toFixed(2)} in ${courseName}. With a ${passRatePct}% exam pass rate, this is a ${challengeLabel} AP course — your result reflects solid capability at this level.`;
  } else {
    const difficultyLabel = passRate >= 0.60 ? 'moderate' : 'significant';
    return `You earned ${grade.toFixed(2)} in ${courseName}. The ${passRatePct}% exam pass rate indicates ${difficultyLabel} course difficulty. See the Challenges section for strategic context.`;
  }
}

// ============================================================================
// GENERATOR (Template only — $0, no LLM call)
// ============================================================================

export function generateResearchContext(ctx: EnrichedReportContext): ResearchContextSection {
  const quant = ctx.quantitativeAnalysis;

  // Build a flat map of all student courses for lookup
  const studentCourseMap = new Map<string, number>();
  for (const pattern of Object.values(quant.subjectPatterns)) {
    for (const course of pattern.performanceHistory.courses) {
      // Normalize: "AP Computer Science A" matches "AP Computer Science A"
      studentCourseMap.set(course.name.toLowerCase(), course.grade);
    }
  }

  // AP Statistics for relevant courses, with student performance context
  // L2: Filter phantom courses — only include if student took it, otherwise mark as recommended
  const apStatistics: ResearchContextSection['apStatistics'] = ctx.forResearch.relevantAPCourses.map(c => {
    const courseName = c.course.name;
    const studentGrade = studentCourseMap.get(courseName.toLowerCase());
    const passRate = c.verifiedStatistics?.passRate || `${Math.round(c.course.passRate * 100)}%`;
    const fiveRate = c.verifiedStatistics?.score5Rate || `${Math.round(c.course.fiveRate * 100)}%`;
    const numPassRate = c.course.passRate;
    const numFiveRate = c.course.fiveRate;

    // L2: Student didn't take this course — mark as recommended reference
    if (studentGrade === undefined) {
      return {
        course: courseName,
        passRate,
        fiveRate,
        citation: c.verifiedStatistics?.citation || 'College Board 2024',
        studentContext: "Recommended for your profile — you haven't taken this course yet.",
      };
    }

    // H4: Build comparative context using difficulty data
    const studentContext = buildComparativeContext(studentGrade, courseName, numPassRate, numFiveRate);

    return {
      course: courseName,
      passRate,
      fiveRate,
      citation: c.verifiedStatistics?.citation || 'College Board 2024',
      studentGrade: studentGrade.toFixed(2),
      studentContext,
    };
  });

  // B5 fix: Include AP courses the student took that aren't in relevantAPCourses
  // H3 fix: Look up verified stats from AP_EXAM_STATISTICS before defaulting to N/A
  const coveredCourses = new Set(apStatistics.map(s => s.course.toLowerCase()));
  for (const apCourse of ctx.forResearch.allStudentAPCourses) {
    if (!coveredCourses.has(apCourse.name.toLowerCase())) {
      const stats = lookupAPStats(apCourse.name);
      if (stats) {
        // H3: Found verified stats — use them
        const passRateStr = `${Math.round(stats.passRate * 100)}%`;
        const fiveRateStr = `${Math.round(stats.fiveRate * 100)}%`;
        // H4: Comparative context for fallback courses too
        const studentContext = buildComparativeContext(apCourse.grade, apCourse.name, stats.passRate, stats.fiveRate);
        apStatistics.push({
          course: apCourse.name,
          passRate: passRateStr,
          fiveRate: fiveRateStr,
          citation: stats.citation,
          studentGrade: apCourse.grade.toFixed(2),
          studentContext,
        });
      } else {
        // Truly unknown course — keep N/A
        apStatistics.push({
          course: apCourse.name,
          passRate: 'N/A (not in research set)',
          fiveRate: 'N/A',
          citation: 'Student transcript',
          studentGrade: apCourse.grade.toFixed(2),
          studentContext: `You took this course and earned ${apCourse.grade.toFixed(2)}.`,
        });
      }
    }
  }

  // College tier expectations — aligned with COLLEGE_TIER_BENCHMARKS used in Sections 1-3
  const collegeTierExpectations = COLLEGE_TIER_BENCHMARKS
    .filter(t => t.name !== 'Accessible')
    .map(t => ({
      tier: t.name,
      gpaRange: `${t.gpaRange} UW`,
      rigorExpectation: t.name.includes('Ivy') ? 'Maximum available rigor expected'
        : t.name.includes('Highly') ? 'Strong rigor, most available APs'
        : t.name === 'Very Selective' ? 'Strong rigor, multiple APs in key subjects'
        : t.name === 'Selective' ? 'Good rigor, several APs in strengths'
        : 'Some AP/Honors coursework',
    }));

  // Major requirements from pre-resolved context
  const majorRequirements = ctx.forResearch.majorRequirements;

  // NACAC factors — B9 fix: corrected NACAC 2023 values and reordered by importance
  const admissionsFactors = [
    { factor: 'Grades in college prep courses', importance: 'Very Important (77% of colleges)', citation: 'NACAC 2023' },
    { factor: 'Academic GPA', importance: 'Very Important (74% of colleges)', citation: 'NACAC 2023' },
    { factor: 'Rigor of secondary school record', importance: 'Very Important (64% of colleges)', citation: 'NACAC 2023' },
    { factor: 'Standardized test scores', importance: 'Moderately Important (varies by school)', citation: 'NACAC 2023' },
  ];

  return {
    apStatistics,
    collegeTierExpectations,
    majorRequirements,
    admissionsFactors,
  };
}
