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
  const apStatistics: ResearchContextSection['apStatistics'] = ctx.forResearch.relevantAPCourses.map(c => {
    const courseName = c.course.name;
    // Try to find this student's grade in this course
    const studentGrade = studentCourseMap.get(courseName.toLowerCase());
    const passRate = c.verifiedStatistics?.passRate || `${Math.round(c.course.passRate * 100)}%`;
    const fiveRate = c.verifiedStatistics?.score5Rate || `${Math.round(c.course.fiveRate * 100)}%`;

    // Q13: National pass rate is presented separately in the table column — do NOT mix into studentContext
    let studentContext: string | undefined;
    if (studentGrade !== undefined) {
      if (studentGrade >= 3.7) {
        studentContext = `You earned ${studentGrade.toFixed(2)} in this course — strong performance at the AP level.`;
      } else if (studentGrade >= 3.3) {
        studentContext = `You earned ${studentGrade.toFixed(2)} — solid AP-level performance.`;
      } else if (studentGrade >= 3.0) {
        studentContext = `You earned ${studentGrade.toFixed(2)} — this was a stretch course for you, which is worth noting.`;
      } else {
        studentContext = `You earned ${studentGrade.toFixed(2)} — this course was significantly challenging. See the Challenges section for context.`;
      }
    }

    return {
      course: courseName,
      passRate,
      fiveRate,
      citation: c.verifiedStatistics?.citation || 'College Board 2024',
      ...(studentGrade !== undefined ? { studentGrade: studentGrade.toFixed(2) } : {}),
      ...(studentContext ? { studentContext } : {}),
    };
  });

  // B5 fix: Include AP courses the student took that aren't in relevantAPCourses
  const coveredCourses = new Set(apStatistics.map(s => s.course.toLowerCase()));
  for (const apCourse of ctx.forResearch.allStudentAPCourses) {
    if (!coveredCourses.has(apCourse.name.toLowerCase())) {
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

  // College tier expectations — aligned with COLLEGE_TIER_BENCHMARKS used in Sections 1-3
  const collegeTierExpectations = COLLEGE_TIER_BENCHMARKS
    .filter(t => t.name !== 'Accessible')
    .map(t => ({
      tier: t.name,
      gpaRange: `${t.gpaRange} UW`,
      rigorExpectation: t.name.includes('Ivy') ? 'Maximum available rigor expected'
        : t.name.includes('Highly') ? 'Strong rigor, most available APs'
        : t.name.includes('Selective') ? 'Good rigor, several APs in strengths'
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
