/**
 * Major Alignment Analyzer Service
 *
 * Evaluates course selection against intended major requirements:
 * - Required courses for specific majors
 * - Highly recommended preparatory courses
 * - Bonus courses showing initiative
 * - Red flags for misalignment
 *
 * Pure heuristic analysis - no LLM required.
 *
 * @version 1.0
 * @date January 2026
 * @research Section 6.2: AP Difficulty Tiers, Section 6.9: Academic Red Flags
 */

import type { AcademicHistoryInput, CourseRecord } from './academicHistoryAnalyzer';

// ============================================================================
// TYPES
// ============================================================================

export interface MajorRequirements {
  name: string;
  aliases: string[];
  required: string[];                // Must-have courses
  highlyRecommended: string[];       // Should have for competitive apps
  bonus: string[];                   // Extra credit
  redFlags: string[];                // Concerning gaps
  description: string;
}

export interface MajorAlignmentResult {
  intendedMajor: string;
  matchedMajorCategory: string | null;
  alignmentScore: number;            // 0-100

  // Requirements analysis
  requirementsMet: Array<{
    requirement: string;
    courseName: string;
    grade: string;
    level: string;
  }>;
  requirementsMissing: string[];

  // Highly recommended
  recommendedPresent: Array<{
    recommendation: string;
    courseName: string;
    grade: string;
    level: string;
  }>;
  recommendedMissing: string[];

  // Bonus courses
  bonusCourses: Array<{
    bonus: string;
    courseName: string;
    grade: string;
    level: string;
  }>;

  // Red flags
  redFlagsTriggered: Array<{
    flag: string;
    severity: 'critical' | 'serious' | 'moderate';
    explanation: string;
  }>;

  // Summary
  strengthAreas: string[];
  gapAreas: string[];
  recommendation: string;

  // Teaching insight
  teachingInsight: string;

  // Confidence in assessment
  confidence: number;                // 0-100

  // Research citation
  researchBasis: string;
}

// ============================================================================
// MAJOR REQUIREMENTS DATABASE
// ============================================================================

const MAJOR_REQUIREMENTS: MajorRequirements[] = [
  {
    name: 'Engineering',
    aliases: ['engineering', 'mechanical engineering', 'electrical engineering', 'civil engineering', 'aerospace', 'biomedical engineering'],
    required: ['calculus', 'physics'],
    highlyRecommended: ['chemistry', 'ap physics c', 'calc bc', 'multivariable calculus', 'linear algebra', 'ap computer science'],
    bonus: ['research', 'independent study', 'robotics', 'engineering course'],
    redFlags: ['no_physics', 'no_calculus', 'stopped_at_precalc'],
    description: 'Engineering programs expect strong math through calculus and physics preparation.',
  },
  {
    name: 'Computer Science',
    aliases: ['computer science', 'cs', 'software engineering', 'data science', 'cybersecurity', 'artificial intelligence'],
    required: ['calculus'],
    highlyRecommended: ['ap computer science a', 'ap computer science principles', 'statistics', 'physics', 'discrete math'],
    bonus: ['programming courses', 'web development', 'app development', 'research', 'hackathons'],
    redFlags: ['no_programming', 'stopped_at_algebra2', 'no_math_beyond_precalc'],
    description: 'CS programs require strong math foundation; programming experience is highly valued.',
  },
  {
    name: 'Pre-Med / Biology',
    aliases: ['pre-med', 'premed', 'biology', 'biochemistry', 'neuroscience', 'public health', 'pre-dental', 'pre-vet'],
    required: ['biology', 'chemistry'],
    highlyRecommended: ['ap biology', 'ap chemistry', 'physics', 'calculus', 'statistics'],
    bonus: ['ap psychology', 'research', 'anatomy', 'organic chemistry', 'hospital volunteering'],
    redFlags: ['no_lab_sciences', 'dropped_after_honors_chem', 'no_biology', 'no_chemistry'],
    description: 'Pre-med tracks require strong lab science preparation with AP-level biology and chemistry.',
  },
  {
    name: 'Economics / Business',
    aliases: ['economics', 'business', 'finance', 'accounting', 'marketing', 'entrepreneurship', 'business administration'],
    required: ['calculus'],
    highlyRecommended: ['statistics', 'ap macroeconomics', 'ap microeconomics', 'ap calculus bc'],
    bonus: ['accounting', 'business courses', 'ap government', 'research', 'DECA', 'FBLA'],
    redFlags: ['no_math_beyond_algebra2', 'no_econ_courses', 'avoided_statistics'],
    description: 'Economics requires strong quantitative skills; business benefits from economics coursework.',
  },
  {
    name: 'Humanities',
    aliases: ['english', 'literature', 'history', 'philosophy', 'classics', 'religious studies', 'art history', 'anthropology'],
    required: ['ap_english_or_honors_sequence'],
    highlyRecommended: ['ap literature', 'ap language', 'ap history', 'foreign language 4 years'],
    bonus: ['creative writing', 'philosophy', 'debate', 'journalism', 'independent research', 'multiple humanities aps'],
    redFlags: ['dropped_language_early', 'no_writing_intensive', 'minimal_humanities_courses'],
    description: 'Humanities programs value strong writing, analytical thinking, and foreign language commitment.',
  },
  {
    name: 'Natural Sciences',
    aliases: ['physics', 'chemistry', 'environmental science', 'astronomy', 'geology', 'materials science'],
    required: ['ap science in field', 'calculus'],
    highlyRecommended: ['multiple ap sciences', 'research experience', 'ap physics c', 'ap chemistry'],
    bonus: ['science olympiad', 'independent research', 'science fair', 'olympiad competitions'],
    redFlags: ['single_year_science', 'no_ap_science', 'no_calculus'],
    description: 'Natural science majors need deep preparation in their specific science plus strong math.',
  },
  {
    name: 'Political Science / International Relations',
    aliases: ['political science', 'international relations', 'government', 'public policy', 'law', 'pre-law'],
    required: ['ap government or honors civics'],
    highlyRecommended: ['ap us history', 'ap world history', 'ap economics', 'foreign language 4 years', 'ap english'],
    bonus: ['model un', 'debate', 'mock trial', 'policy research', 'ap comparative government'],
    redFlags: ['no_social_studies_depth', 'dropped_language', 'minimal_writing_courses'],
    description: 'Political science values history, government, economics, and strong analytical writing.',
  },
  {
    name: 'Arts / Design',
    aliases: ['art', 'studio art', 'graphic design', 'architecture', 'film', 'music', 'theater', 'dance'],
    required: ['art portfolio or music audition'],
    highlyRecommended: ['ap studio art', 'art history', '4 years of arts courses', 'ap music theory'],
    bonus: ['independent projects', 'exhibitions', 'performances', 'competitions'],
    redFlags: ['no_arts_courses', 'dropped_arts_for_academics'],
    description: 'Arts programs prioritize portfolio/audition quality but value academic preparation too.',
  },
  {
    name: 'Psychology',
    aliases: ['psychology', 'cognitive science', 'behavioral science'],
    required: ['ap psychology or honors psychology'],
    highlyRecommended: ['ap biology', 'statistics', 'ap english', 'research methods'],
    bonus: ['research experience', 'ap statistics', 'sociology', 'neuroscience interest'],
    redFlags: ['no_psychology', 'no_statistics', 'minimal_science'],
    description: 'Psychology increasingly requires quantitative skills alongside social science preparation.',
  },
  {
    name: 'Undeclared / Liberal Arts',
    aliases: ['undeclared', 'undecided', 'liberal arts', 'general studies'],
    required: [],
    highlyRecommended: ['balanced rigor across subjects', 'foreign language depth', 'writing intensive'],
    bonus: ['demonstrated intellectual curiosity', 'diverse advanced courses', 'research'],
    redFlags: ['narrow_focus_without_depth', 'avoiding_challenging_areas', 'rigor_avoidance'],
    description: 'Undeclared students should show breadth with depth, demonstrating ability in multiple areas.',
  },
];

// ============================================================================
// COURSE KEYWORD MAPPING
// ============================================================================

const COURSE_KEYWORDS: Record<string, string[]> = {
  calculus: ['calculus', 'calc ab', 'calc bc', 'ap calculus'],
  physics: ['physics', 'ap physics'],
  'ap physics c': ['physics c', 'mechanics', 'electricity and magnetism', 'e&m'],
  chemistry: ['chemistry', 'chem', 'ap chemistry'],
  biology: ['biology', 'bio', 'ap biology'],
  'ap computer science a': ['ap computer science a', 'ap cs a', 'apcs a'],
  'ap computer science principles': ['ap csp', 'cs principles', 'computer science principles'],
  statistics: ['statistics', 'stats', 'ap statistics'],
  'ap biology': ['ap biology', 'ap bio'],
  'ap chemistry': ['ap chemistry', 'ap chem'],
  'ap macroeconomics': ['ap macro', 'macroeconomics'],
  'ap microeconomics': ['ap micro', 'microeconomics'],
  'ap literature': ['ap literature', 'ap lit', 'ap english literature'],
  'ap language': ['ap language', 'ap lang', 'ap english language'],
  'ap history': ['ap us history', 'ap world history', 'ap european history', 'apush'],
  'ap government': ['ap government', 'ap gov', 'ap us government'],
  'ap psychology': ['ap psychology', 'ap psych'],
  'ap studio art': ['ap studio art', 'ap art', 'ap drawing'],
  'foreign language 4 years': ['spanish 4', 'french 4', 'german 4', 'chinese 4', 'latin 4', 'ap spanish', 'ap french'],
  'multivariable calculus': ['multivariable', 'calc 3', 'calculus 3', 'mv calc'],
  'linear algebra': ['linear algebra'],
  research: ['research', 'independent study', 'independent research'],
  programming: ['programming', 'coding', 'computer science', 'java', 'python', 'c++'],
};

// ============================================================================
// MAJOR ALIGNMENT ANALYZER CLASS
// ============================================================================

export class MajorAlignmentAnalyzer {
  /**
   * Analyze course selection against intended major
   */
  analyze(input: AcademicHistoryInput): MajorAlignmentResult {
    const intendedMajor = input.intended_major || 'Undeclared';

    // Find matching major category
    const majorCategory = this.findMajorCategory(intendedMajor);

    if (!majorCategory) {
      // Return generic analysis if no match
      return this.createGenericAnalysis(input, intendedMajor);
    }

    // Check requirements
    const requirementsMet = this.checkRequirements(input.courses, majorCategory.required);
    const requirementsMissing = this.findMissing(majorCategory.required, requirementsMet.map(r => r.requirement));

    // Check recommendations
    const recommendedPresent = this.checkRequirements(input.courses, majorCategory.highlyRecommended);
    const recommendedMissing = this.findMissing(majorCategory.highlyRecommended, recommendedPresent.map(r => r.requirement));

    // Check bonus courses
    const bonusCourses = this.checkRequirements(input.courses, majorCategory.bonus);

    // Check red flags
    const redFlagsTriggered = this.checkRedFlags(input.courses, majorCategory.redFlags, requirementsMissing);

    // Calculate alignment score
    const alignmentScore = this.calculateAlignmentScore(
      requirementsMet.length,
      majorCategory.required.length,
      recommendedPresent.length,
      majorCategory.highlyRecommended.length,
      bonusCourses.length,
      redFlagsTriggered.length
    );

    // Generate insights
    const strengthAreas = this.identifyStrengths(requirementsMet, recommendedPresent, bonusCourses);
    const gapAreas = this.identifyGaps(requirementsMissing, recommendedMissing, redFlagsTriggered);
    const recommendation = this.generateRecommendation(majorCategory, alignmentScore, gapAreas);
    const teachingInsight = this.generateTeachingInsight(majorCategory, alignmentScore, redFlagsTriggered);

    // Confidence based on data completeness
    const confidence = this.calculateConfidence(input);

    return {
      intendedMajor,
      matchedMajorCategory: majorCategory.name,
      alignmentScore,
      requirementsMet,
      requirementsMissing,
      recommendedPresent,
      recommendedMissing,
      bonusCourses,
      redFlagsTriggered,
      strengthAreas,
      gapAreas,
      recommendation,
      teachingInsight,
      confidence,
      researchBasis: `Section 6.9: Major-Course Mismatch is a Tier 2 (Serious) red flag. ${majorCategory.description}`,
    };
  }

  // ========================================================================
  // MAJOR MATCHING
  // ========================================================================

  private findMajorCategory(intendedMajor: string): MajorRequirements | null {
    const normalized = intendedMajor.toLowerCase().trim();

    for (const major of MAJOR_REQUIREMENTS) {
      if (major.aliases.some(alias => normalized.includes(alias))) {
        return major;
      }
    }

    // Fallback to undeclared if no match
    return MAJOR_REQUIREMENTS.find(m => m.name === 'Undeclared / Liberal Arts') || null;
  }

  // ========================================================================
  // REQUIREMENTS CHECKING
  // ========================================================================

  private checkRequirements(
    courses: CourseRecord[],
    requirements: string[]
  ): Array<{ requirement: string; courseName: string; grade: string; level: string }> {
    const found: Array<{ requirement: string; courseName: string; grade: string; level: string }> = [];

    for (const req of requirements) {
      const keywords = COURSE_KEYWORDS[req.toLowerCase()] || [req.toLowerCase()];
      const matchingCourse = courses.find(course => {
        const courseLower = course.name.toLowerCase();
        return keywords.some(keyword => courseLower.includes(keyword));
      });

      if (matchingCourse) {
        found.push({
          requirement: req,
          courseName: matchingCourse.name,
          grade: matchingCourse.grade,
          level: matchingCourse.level,
        });
      }
    }

    return found;
  }

  private findMissing(required: string[], found: string[]): string[] {
    const foundLower = found.map(f => f.toLowerCase());
    return required.filter(r => !foundLower.includes(r.toLowerCase()));
  }

  // ========================================================================
  // RED FLAG CHECKING
  // ========================================================================

  private checkRedFlags(
    courses: CourseRecord[],
    flags: string[],
    missingRequirements: string[]
  ): MajorAlignmentResult['redFlagsTriggered'] {
    const triggered: MajorAlignmentResult['redFlagsTriggered'] = [];

    for (const flag of flags) {
      let flagTriggered = false;
      let explanation = '';
      let severity: 'critical' | 'serious' | 'moderate' = 'moderate';

      switch (flag) {
        case 'no_physics':
          if (!courses.some(c => c.name.toLowerCase().includes('physics'))) {
            flagTriggered = true;
            explanation = 'No physics courses found in transcript';
            severity = 'serious';
          }
          break;

        case 'no_calculus':
          if (!courses.some(c => c.name.toLowerCase().includes('calculus'))) {
            flagTriggered = true;
            explanation = 'No calculus courses found in transcript';
            severity = 'serious';
          }
          break;

        case 'stopped_at_precalc':
          const hasPrecalc = courses.some(c => c.name.toLowerCase().includes('precalc'));
          const hasCalc = courses.some(c => c.name.toLowerCase().includes('calculus'));
          if (hasPrecalc && !hasCalc) {
            flagTriggered = true;
            explanation = 'Stopped at pre-calculus without proceeding to calculus';
            severity = 'moderate';
          }
          break;

        case 'no_programming':
          if (!courses.some(c =>
            c.name.toLowerCase().includes('programming') ||
            c.name.toLowerCase().includes('computer science') ||
            c.name.toLowerCase().includes('coding')
          )) {
            flagTriggered = true;
            explanation = 'No programming or computer science courses found';
            severity = 'moderate';
          }
          break;

        case 'stopped_at_algebra2':
          const hasAlg2 = courses.some(c =>
            c.name.toLowerCase().includes('algebra 2') ||
            c.name.toLowerCase().includes('algebra ii')
          );
          const hasPrecalcOrHigher = courses.some(c =>
            c.name.toLowerCase().includes('precalc') ||
            c.name.toLowerCase().includes('calculus')
          );
          if (hasAlg2 && !hasPrecalcOrHigher) {
            flagTriggered = true;
            explanation = 'Math sequence stopped at Algebra 2';
            severity = 'serious';
          }
          break;

        case 'no_lab_sciences':
          const labSciences = courses.filter(c =>
            c.name.toLowerCase().includes('biology') ||
            c.name.toLowerCase().includes('chemistry') ||
            c.name.toLowerCase().includes('physics')
          );
          if (labSciences.length < 2) {
            flagTriggered = true;
            explanation = 'Fewer than 2 lab sciences taken';
            severity = 'serious';
          }
          break;

        case 'no_biology':
          if (!courses.some(c => c.name.toLowerCase().includes('biology'))) {
            flagTriggered = true;
            explanation = 'No biology courses found';
            severity = 'serious';
          }
          break;

        case 'no_chemistry':
          if (!courses.some(c => c.name.toLowerCase().includes('chem'))) {
            flagTriggered = true;
            explanation = 'No chemistry courses found';
            severity = 'serious';
          }
          break;

        case 'dropped_after_honors_chem':
          const honorsChem = courses.find(c =>
            c.name.toLowerCase().includes('chem') &&
            (c.level === 'honors' || c.level === 'accelerated')
          );
          const apChem = courses.find(c => c.name.toLowerCase().includes('ap chem'));
          if (honorsChem && !apChem) {
            flagTriggered = true;
            explanation = 'Did not continue to AP Chemistry after Honors';
            severity = 'moderate';
          }
          break;

        case 'no_math_beyond_algebra2':
          if (!courses.some(c =>
            c.name.toLowerCase().includes('precalc') ||
            c.name.toLowerCase().includes('calculus') ||
            c.name.toLowerCase().includes('statistics')
          )) {
            flagTriggered = true;
            explanation = 'No math courses beyond Algebra 2 level';
            severity = 'serious';
          }
          break;

        case 'no_econ_courses':
          if (!courses.some(c =>
            c.name.toLowerCase().includes('econ') ||
            c.name.toLowerCase().includes('business')
          )) {
            flagTriggered = true;
            explanation = 'No economics or business courses taken';
            severity = 'moderate';
          }
          break;

        case 'dropped_language_early':
          const languageCourses = courses.filter(c =>
            c.name.toLowerCase().includes('spanish') ||
            c.name.toLowerCase().includes('french') ||
            c.name.toLowerCase().includes('german') ||
            c.name.toLowerCase().includes('chinese') ||
            c.name.toLowerCase().includes('latin')
          );
          const languageYears = new Set(languageCourses.map(c => c.year)).size;
          if (languageYears > 0 && languageYears < 3) {
            flagTriggered = true;
            explanation = `Foreign language studied for only ${languageYears} year(s)`;
            severity = 'moderate';
          }
          break;

        case 'no_writing_intensive':
          const writingCourses = courses.filter(c =>
            c.name.toLowerCase().includes('english') ||
            c.name.toLowerCase().includes('writing') ||
            c.name.toLowerCase().includes('literature')
          );
          const apWriting = writingCourses.filter(c => c.level === 'ap');
          if (apWriting.length === 0) {
            flagTriggered = true;
            explanation = 'No AP-level English/writing courses taken';
            severity = 'moderate';
          }
          break;

        case 'minimal_humanities_courses':
          const humanities = courses.filter(c =>
            c.name.toLowerCase().includes('history') ||
            c.name.toLowerCase().includes('english') ||
            c.name.toLowerCase().includes('literature') ||
            c.name.toLowerCase().includes('philosophy')
          );
          if (humanities.filter(c => ['ap', 'ib_hl'].includes(c.level)).length < 2) {
            flagTriggered = true;
            explanation = 'Fewer than 2 AP/IB humanities courses';
            severity = 'moderate';
          }
          break;

        case 'single_year_science':
          const sciences = courses.filter(c =>
            c.name.toLowerCase().includes('biology') ||
            c.name.toLowerCase().includes('chemistry') ||
            c.name.toLowerCase().includes('physics')
          );
          const scienceYears = new Set(sciences.map(c => c.year)).size;
          if (scienceYears < 3) {
            flagTriggered = true;
            explanation = `Science courses only span ${scienceYears} year(s)`;
            severity = 'moderate';
          }
          break;

        case 'no_ap_science':
          if (!courses.some(c =>
            (c.name.toLowerCase().includes('ap') || c.level === 'ap') &&
            (c.name.toLowerCase().includes('bio') ||
             c.name.toLowerCase().includes('chem') ||
             c.name.toLowerCase().includes('physics'))
          )) {
            flagTriggered = true;
            explanation = 'No AP-level science courses taken';
            severity = 'serious';
          }
          break;

        case 'rigor_avoidance':
          const totalCourses = courses.length;
          const advancedCourses = courses.filter(c => ['ap', 'ib_hl', 'honors'].includes(c.level));
          if (totalCourses > 0 && advancedCourses.length / totalCourses < 0.3) {
            flagTriggered = true;
            explanation = 'Less than 30% of courses are advanced level';
            severity = 'moderate';
          }
          break;
      }

      if (flagTriggered) {
        triggered.push({ flag, severity, explanation });
      }
    }

    return triggered;
  }

  // ========================================================================
  // SCORE CALCULATION
  // ========================================================================

  private calculateAlignmentScore(
    reqMet: number,
    reqTotal: number,
    recMet: number,
    recTotal: number,
    bonusCount: number,
    flagCount: number
  ): number {
    let score = 40; // Base score

    // Requirements (max 40 points)
    if (reqTotal > 0) {
      score += (reqMet / reqTotal) * 40;
    } else {
      score += 40; // No requirements = full credit
    }

    // Recommendations (max 30 points)
    if (recTotal > 0) {
      score += (recMet / recTotal) * 30;
    }

    // Bonus courses (max 20 points)
    score += Math.min(bonusCount * 5, 20);

    // Red flag penalties
    score -= flagCount * 15;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // ========================================================================
  // INSIGHTS
  // ========================================================================

  private identifyStrengths(
    requirementsMet: MajorAlignmentResult['requirementsMet'],
    recommendedPresent: MajorAlignmentResult['recommendedPresent'],
    bonusCourses: MajorAlignmentResult['bonusCourses']
  ): string[] {
    const strengths: string[] = [];

    if (requirementsMet.length > 0) {
      const apRequirements = requirementsMet.filter(r => r.level === 'ap');
      if (apRequirements.length > 0) {
        strengths.push(`AP-level preparation in ${apRequirements.map(r => r.requirement).join(', ')}`);
      }
    }

    if (recommendedPresent.length >= 3) {
      strengths.push('Strong coverage of recommended preparatory courses');
    }

    if (bonusCourses.length > 0) {
      strengths.push(`Additional depth through: ${bonusCourses.map(b => b.bonus).join(', ')}`);
    }

    return strengths;
  }

  private identifyGaps(
    requirementsMissing: string[],
    recommendedMissing: string[],
    redFlags: MajorAlignmentResult['redFlagsTriggered']
  ): string[] {
    const gaps: string[] = [];

    if (requirementsMissing.length > 0) {
      gaps.push(`Missing required courses: ${requirementsMissing.join(', ')}`);
    }

    if (recommendedMissing.length >= 3) {
      gaps.push(`Many recommended courses not taken: ${recommendedMissing.slice(0, 3).join(', ')}`);
    }

    for (const flag of redFlags) {
      if (flag.severity === 'critical' || flag.severity === 'serious') {
        gaps.push(flag.explanation);
      }
    }

    return gaps;
  }

  private generateRecommendation(
    major: MajorRequirements,
    score: number,
    gaps: string[]
  ): string {
    if (score >= 80) {
      return `Strong alignment with ${major.name}. Continue building depth and consider research or independent projects to stand out.`;
    }

    if (score >= 60) {
      if (gaps.length > 0) {
        return `Good foundation for ${major.name}, but address these gaps: ${gaps[0]}. Consider summer courses or online programs if senior year doesn't allow adding courses.`;
      }
      return `Good foundation for ${major.name}. Focus on strengthening with additional recommended courses.`;
    }

    if (score >= 40) {
      return `Some preparation for ${major.name}, but significant gaps exist. Consider whether this major aligns with your actual academic interests, or plan to address missing prerequisites.`;
    }

    return `Course selection does not strongly support ${major.name} as intended major. Either pivot intended major to match current preparation, or explain your path to this major in applications.`;
  }

  private generateTeachingInsight(
    major: MajorRequirements,
    score: number,
    redFlags: MajorAlignmentResult['redFlagsTriggered']
  ): string {
    if (redFlags.some(f => f.severity === 'critical')) {
      return `Major-Course Mismatch is a Tier 2 (Serious) red flag in admissions. Saying you want to study ${major.name} without the required coursework signals either poor planning or lack of genuine interest. Address this in your application with concrete plans (summer programs, gap year courses, or a compelling explanation).`;
    }

    if (score >= 80) {
      return `Your coursework clearly supports your interest in ${major.name}. Admissions officers will see alignment between your stated goals and academic choices - this builds credibility for your application narrative.`;
    }

    if (score >= 60) {
      return `You have a reasonable foundation for ${major.name}, but could be stronger. Remember that selective schools receive many applications from students with perfect alignment - differentiate through depth, research, or related extracurriculars.`;
    }

    return `There's a disconnect between your intended major and coursework. Colleges will notice this. Either (1) adjust your intended major to match your actual academic interests, or (2) explain your path convincingly - perhaps you discovered this interest late, or your school had limited options.`;
  }

  // ========================================================================
  // CONFIDENCE & GENERIC ANALYSIS
  // ========================================================================

  private calculateConfidence(input: AcademicHistoryInput): number {
    let confidence = 100;

    // Less confidence without intended major
    if (!input.intended_major) confidence -= 30;

    // Less confidence with few courses
    if (input.courses.length < 20) confidence -= 15;

    // Less confidence without multiple years
    const years = new Set(input.courses.map(c => c.year)).size;
    if (years < 3) confidence -= 20;

    return Math.max(20, confidence);
  }

  private createGenericAnalysis(input: AcademicHistoryInput, intendedMajor: string): MajorAlignmentResult {
    return {
      intendedMajor,
      matchedMajorCategory: null,
      alignmentScore: 50,
      requirementsMet: [],
      requirementsMissing: [],
      recommendedPresent: [],
      recommendedMissing: [],
      bonusCourses: [],
      redFlagsTriggered: [],
      strengthAreas: [],
      gapAreas: [],
      recommendation: `Unable to analyze alignment for "${intendedMajor}" - consider specifying a more common major category for detailed analysis.`,
      teachingInsight: 'When selecting courses, consider what preparation your intended major requires. Research schools you\'re interested in to understand their expectations for admitted students.',
      confidence: 30,
      researchBasis: 'Section 6.9: Course selection should align with stated academic interests.',
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const majorAlignmentAnalyzer = new MajorAlignmentAnalyzer();

/**
 * Convenience function for major alignment analysis
 */
export function analyzeMajorAlignment(input: AcademicHistoryInput): MajorAlignmentResult {
  return majorAlignmentAnalyzer.analyze(input);
}
