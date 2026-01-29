/**
 * Academic Teaching Service
 *
 * Research-backed teaching for academic profile evaluation.
 * Provides "WHY" explanations, technique guidance, and citations
 * for all academic feedback - inspired by PIQ Workshop's teaching system.
 *
 * KEY PRINCIPLE: Don't just tell students their GPA is "competitive" -
 * explain what that means, why it matters, and how colleges actually view it.
 *
 * @version 1.0
 * @date January 2026
 */

import {
  COURSE_LEVEL_HIERARCHY,
  AP_DIFFICULTY_TIERS,
  SCHOOL_CONTEXT_TIERS,
  GPA_EXPECTATIONS,
  ACADEMIC_RED_FLAGS,
  INTERNATIONAL_CURRICULA,
  HOMESCHOOL_VALIDATION,
} from './academicHistoryAnalyzer';

// ============================================================================
// TYPES
// ============================================================================

export type AcademicIssueType =
  // GPA-related
  | 'gpa_context_interpretation'
  | 'gpa_inflation_deflation'
  | 'gpa_test_mismatch'
  | 'class_rank_context'

  // Rigor-related
  | 'rigor_maximization'
  | 'rigor_avoidance'
  | 'ap_difficulty_context'
  | 'course_progression'
  | 'subject_depth_gaps'
  | 'major_course_mismatch'

  // Trajectory-related
  | 'ascending_trajectory'
  | 'descending_trajectory'
  | 'senior_year_decline'
  | 'inconsistent_performance'
  | 'rigor_dip_recovery'

  // Special contexts
  | 'dual_enrollment_value'
  | 'homeschool_validation'
  | 'international_conversion'

  // Red flags
  | 'academic_dishonesty'
  | 'grade_manipulation'
  | 'strategic_avoidance'

  // Testing
  | 'test_optional_strategy'
  | 'ap_exam_validation'
  | 'testing_gaps';

export interface AcademicTeachingMoment {
  issue_type: AcademicIssueType;

  // WHY this matters - the core teaching
  why_section: {
    headline: string;
    explanation: string;
    admissions_perspective: string;
    common_misconception?: string;
  };

  // Research backing
  research_support: {
    primary_citation: Citation;
    supporting_citations: Citation[];
    key_statistic?: string;
  };

  // Practical guidance
  guidance: {
    what_to_do: string[];
    what_to_avoid: string[];
    how_to_present: string;
  };

  // Context-specific adjustments
  context_notes?: {
    for_stem_applicants?: string;
    for_humanities_applicants?: string;
    for_first_gen?: string;
    for_international?: string;
  };
}

export interface Citation {
  source: string;
  author?: string;
  quote: string;
  module_reference: string;
  year?: string;
}

// ============================================================================
// ACADEMIC TEACHING KNOWLEDGE BASE
// Research-backed explanations for every academic assessment type
// ============================================================================

const ACADEMIC_TEACHING_KNOWLEDGE_BASE: Record<AcademicIssueType, AcademicTeachingMoment> = {
  // ========================================================================
  // GPA-RELATED TEACHING
  // ========================================================================

  gpa_context_interpretation: {
    issue_type: 'gpa_context_interpretation',
    why_section: {
      headline: 'Your GPA is always evaluated in context - never in isolation',
      explanation: `Admissions officers don't just look at your GPA number. They evaluate it against what was possible at your school, the rigor of courses you chose, and how your performance compares to your classmates. A 3.7 at Phillips Exeter (where grade deflation is real) signals something different than a 3.7 at a school with significant grade inflation.`,
      admissions_perspective: 'We almost always evaluate students in comparison to fellow students at their own high schools. Since no two high schools are alike, it\'s impossible to hold students to the same standards.',
      common_misconception: 'Many students think a 4.0 is a 4.0 everywhere. In reality, admissions officers spend significant time understanding the grading practices and opportunities at each school.',
    },
    research_support: {
      primary_citation: {
        source: 'CollegeVine',
        quote: 'Colleges almost always evaluate students in comparison to the fellow students at their own high schools.',
        module_reference: 'Section 6.5: School Context Calibration',
      },
      supporting_citations: [
        {
          source: 'MIT Admissions',
          quote: 'We look for students who maximize their opportunities, whatever those may be.',
          module_reference: 'Section 6.5',
        },
      ],
      key_statistic: 'Schools send detailed profiles showing GPA distributions, course offerings, and context - AOs spend significant time reviewing these.',
    },
    guidance: {
      what_to_do: [
        'Understand your school\'s grading culture and how it compares',
        'Take the most rigorous courses available to you',
        'If your school has grade deflation, note this in your additional info section',
      ],
      what_to_avoid: [
        'Don\'t assume your GPA will be compared directly to other applicants',
        'Don\'t neglect rigor to protect a perfect GPA',
      ],
      how_to_present: 'Let your transcript speak for itself, but provide context in additional info if your school has unusual grading practices.',
    },
  },

  gpa_inflation_deflation: {
    issue_type: 'gpa_inflation_deflation',
    why_section: {
      headline: 'Grade inflation is real - and admissions officers know it',
      explanation: `Since 1998, the percentage of high school seniors with A averages jumped from 38.9% to nearly 50%. This means a "high GPA" doesn't distinguish you like it used to. Admissions officers increasingly rely on test scores, AP exams, and school profiles to understand what grades actually mean.`,
      admissions_perspective: 'We know some schools hand out As freely while others rarely give them. That\'s why we look at the rigor of your choices and external validation like AP scores.',
      common_misconception: 'Students often think their strong GPA guarantees academic competitiveness. In reality, selective schools assume most applicants have strong GPAs - they\'re looking for what else sets you apart.',
    },
    research_support: {
      primary_citation: {
        source: 'ACT Research / Education Week',
        quote: 'In 2016, 47% of high school seniors graduated with an A average, up from 38.9% in 1998.',
        module_reference: 'Section 6.6: Grade Interpretation',
      },
      supporting_citations: [
        {
          source: 'Opportunity Insights (Harvard/Stanford)',
          quote: 'Higher SAT/ACT scores are associated with higher college GPAs, but higher high school GPAs are not.',
          module_reference: 'Section 6.6',
        },
      ],
      key_statistic: 'At Stanford, 73.3% of admitted students had 4.0 GPAs - the GPA alone doesn\'t differentiate.',
    },
    guidance: {
      what_to_do: [
        'Focus on course rigor over raw GPA',
        'Use AP/IB exams to validate your grades',
        'Understand your school\'s inflation/deflation pattern',
      ],
      what_to_avoid: [
        'Don\'t assume your 4.0 is sufficient at selective schools',
        'Don\'t sacrifice rigor for grade protection',
      ],
      how_to_present: 'Let your course selection and external exam scores demonstrate your true academic level.',
    },
  },

  gpa_test_mismatch: {
    issue_type: 'gpa_test_mismatch',
    why_section: {
      headline: 'When GPA and test scores tell different stories, admissions officers notice',
      explanation: `A significant gap between your GPA and standardized test scores creates a question mark. High GPA with low scores may suggest grade inflation at your school. High scores with lower GPA may indicate you're not working to your potential - or that your school grades very hard. Either way, it's a data point that needs interpretation.`,
      admissions_perspective: 'We use test scores to validate what grades tell us. When they diverge significantly, we try to understand why.',
      common_misconception: 'Some students think test-optional means the mismatch doesn\'t matter. Admissions officers still notice the pattern in your application.',
    },
    research_support: {
      primary_citation: {
        source: 'Opportunity Insights Research',
        quote: 'Higher SAT/ACT scores are associated with higher college GPAs but higher high school GPAs are not.',
        module_reference: 'Section 6.6: Grade Interpretation',
      },
      supporting_citations: [
        {
          source: 'NACAC Admissions Trends',
          quote: 'Test scores remain one of the primary methods for comparing students across different schools.',
          module_reference: 'Section 6.6',
        },
      ],
      key_statistic: 'Research shows standardized test scores predict college GPA better than high school GPA.',
    },
    guidance: {
      what_to_do: [
        'If your scores are lower than your GPA suggests, consider test-optional',
        'If your GPA is lower than your scores, address grade deflation in additional info',
        'Use AP/IB exam scores to provide additional validation',
      ],
      what_to_avoid: [
        'Don\'t submit scores that create significant unexplained discrepancies',
        'Don\'t ignore the mismatch - address it thoughtfully',
      ],
      how_to_present: 'Be strategic about which data points you emphasize. If there\'s a legitimate explanation, provide it concisely.',
    },
  },

  class_rank_context: {
    issue_type: 'class_rank_context',
    why_section: {
      headline: 'Over 50% of high schools no longer report class rank',
      explanation: `Class rank has become less meaningful as schools have moved away from reporting it. Many schools stopped due to grade inflation making ranks arbitrary, or to avoid penalizing students in competitive environments. If your school reports rank, it\'s one data point - if not, admissions officers rely on GPA, course rigor, and school profile.`,
      admissions_perspective: 'We understand that class rank is increasingly unavailable. We evaluate students within their school context using all available information.',
      common_misconception: 'Students sometimes worry that not having a class rank hurts them. In reality, it\'s now the norm at many schools.',
    },
    research_support: {
      primary_citation: {
        source: 'NACAC State of College Admission Report',
        quote: 'More than 50% of high schools no longer report class rank.',
        module_reference: 'Section 6.6: Grade Interpretation',
      },
      supporting_citations: [
        {
          source: 'CollegeVine',
          quote: 'Schools stopped reporting rank due to grade compression and competitive concerns.',
          module_reference: 'Section 6.6',
        },
      ],
    },
    guidance: {
      what_to_do: [
        'If your school reports rank and you\'re in top 10%, that\'s helpful context',
        'If no rank is reported, ensure your transcript shows strong course rigor',
        'Let your counselor\'s letter provide comparative context',
      ],
      what_to_avoid: [
        'Don\'t stress if your school doesn\'t rank',
        'Don\'t compare yourself to applicants from schools with different rank policies',
      ],
      how_to_present: 'Trust that your counselor and school profile will provide the context admissions needs.',
    },
  },

  // ========================================================================
  // RIGOR-RELATED TEACHING
  // ========================================================================

  rigor_maximization: {
    issue_type: 'rigor_maximization',
    why_section: {
      headline: 'Taking the most rigorous curriculum available matters more than raw AP count',
      explanation: `Admissions officers evaluate whether you challenged yourself with what your school offers. If your school has 20 APs and you took 8, that\'s different than taking 8 out of 8 available. The question is: "Did this student maximize their opportunities?" Taking all available rigor at a school with 5 APs shows more initiative than picking easy courses at a school with 20.`,
      admissions_perspective: 'We assess whether a student challenged themselves with AP, IB, or Honors courses, and whether they pursued rigor without their grades suffering.',
      common_misconception: 'Many students think there\'s a magic number of APs they need. The real question is what percentage of available rigor you pursued.',
    },
    research_support: {
      primary_citation: {
        source: 'IvyWise',
        quote: 'Admissions officers assess whether a student challenged themselves with AP, IB, or Honors courses, and whether they pursued rigor without their grades suffering.',
        module_reference: 'Section 6.1: Course Level Hierarchy',
      },
      supporting_citations: [
        {
          source: 'IvyMax Data',
          quote: 'Harvard average is 8 APs, but majority of admits took 12+ when available.',
          module_reference: 'Section 6.1',
        },
      ],
      key_statistic: 'Students who take most rigorous available are viewed more favorably than those who take more courses but avoid the hardest ones.',
    },
    guidance: {
      what_to_do: [
        'Take the most challenging courses in your areas of interest/intended major',
        'Prioritize rigor in core subjects: math, science, English, history, foreign language',
        'If school offerings are limited, seek dual enrollment or online APs',
      ],
      what_to_avoid: [
        'Don\'t avoid the hardest courses to protect your GPA',
        'Don\'t take random APs - choose courses aligned with your interests',
      ],
      how_to_present: 'Your transcript should show you sought challenge progressively across all four years.',
    },
    context_notes: {
      for_stem_applicants: 'STEM applicants should have Calc BC, Physics, Chemistry at AP level minimum',
      for_humanities_applicants: 'History, Literature, Language APs show depth in humanities',
      for_first_gen: 'If guidance was limited, explain how you learned about rigorous courses',
    },
  },

  rigor_avoidance: {
    issue_type: 'rigor_avoidance',
    why_section: {
      headline: 'A 4.0 with easy courses is a red flag, not an achievement',
      explanation: `Admissions officers can spot "GPA protection" strategies immediately. Choosing regular courses when AP is available, or avoiding challenging subjects entirely, signals risk-aversion rather than intellectual curiosity. A student with a 3.8 in maximum rigor is typically viewed more favorably than a 4.0 who avoided challenge.`,
      admissions_perspective: 'We\'d rather see a student get a B in AP than an A in regular. The choice to challenge yourself matters.',
      common_misconception: 'Some students and parents believe maintaining a perfect GPA is paramount. In reality, selective colleges are suspicious of perfect GPAs with light course loads.',
    },
    research_support: {
      primary_citation: {
        source: 'Section 6.9: Academic Red Flags',
        quote: 'Rigor avoidance with high GPA is a Tier 2 (Serious) red flag: <3 AP/IB courses with 3.9+ GPA and 10+ APs available.',
        module_reference: 'Section 6.9: Academic Red Flags',
      },
      supporting_citations: [
        {
          source: 'CollegeVine',
          quote: 'Taking easy courses to maintain a high GPA is a strategy that backfires at selective colleges.',
          module_reference: 'Section 6.1',
        },
      ],
    },
    guidance: {
      what_to_do: [
        'Choose rigor over GPA protection',
        'If you dropped from a hard course, explain what you learned',
        'Demonstrate intellectual courage through your choices',
      ],
      what_to_avoid: [
        'Don\'t avoid AP in your intended major area',
        'Don\'t drop to regular just to guarantee an A',
      ],
      how_to_present: 'If your course choices look risk-averse, address it in additional info - ideally with context about growth or circumstances.',
    },
  },

  ap_difficulty_context: {
    issue_type: 'ap_difficulty_context',
    why_section: {
      headline: 'Not all APs are equal - admissions knows which are hardest',
      explanation: `AP courses vary dramatically in difficulty. Physics C E&M and Chemistry have pass rates under 55%, while Environmental Science and Human Geography exceed 70%. Taking multiple Tier 1 (hardest) APs signals genuine readiness for college-level challenge. A student with 6 hard APs shows more than one with 10 easy ones.`,
      admissions_perspective: 'We know which APs are truly challenging. The difficulty of your AP portfolio matters, not just the count.',
      common_misconception: 'Students often optimize for AP count rather than AP quality. Admissions officers aren\'t fooled by this strategy.',
    },
    research_support: {
      primary_citation: {
        source: 'College Board / AP Score Distributions',
        quote: 'Physics C E&M has historically had one of the lowest pass rates at around 40%.',
        module_reference: 'Section 6.2: AP Course Difficulty Tiers',
      },
      supporting_citations: [
        {
          source: 'PrepScholar Analysis',
          quote: 'AP courses can be grouped into difficulty tiers based on pass rates and 5-rates.',
          module_reference: 'Section 6.2',
        },
      ],
      key_statistic: 'Tier 1 APs (Physics C, Chemistry, Calc BC) have 12-30% 5-rates vs 18%+ for easier APs.',
    },
    guidance: {
      what_to_do: [
        'Include at least some Tier 1 or Tier 2 APs in your portfolio',
        'Align AP choices with intended major (STEM majors need STEM APs)',
        'Balance difficulty with success - Bs in hard APs are better than skipping them',
      ],
      what_to_avoid: [
        'Don\'t load up on "easy" APs just to inflate count',
        'Don\'t avoid the hard APs in your intended field',
      ],
      how_to_present: 'Quality over quantity. A focused, rigorous AP portfolio aligned with your interests is most compelling.',
    },
  },

  major_course_mismatch: {
    issue_type: 'major_course_mismatch',
    why_section: {
      headline: 'Your coursework should match your stated academic interests',
      explanation: `If you say you want to study engineering but haven\'t taken AP Physics or Calculus BC, that\'s a major red flag. Your course choices are the primary evidence of your academic interests. Claiming passion for a field without the corresponding coursework appears either disingenuous or poorly planned.`,
      admissions_perspective: 'We want to see that you\'ve already begun exploring your intended major through your course choices.',
      common_misconception: 'Some students think they can claim any major without preparation. Competitive programs expect relevant coursework.',
    },
    research_support: {
      primary_citation: {
        source: 'Section 6.9: Academic Red Flags',
        quote: 'Major-Course Mismatch is a Tier 2 (Serious) red flag: STEM major without Calc BC/Physics, etc.',
        module_reference: 'Section 6.9: Academic Red Flags',
      },
      supporting_citations: [
        {
          source: 'MIT Admissions',
          quote: 'We expect students interested in STEM to have challenged themselves with advanced math and science.',
          module_reference: 'Section 6.4: Course Sequencing',
        },
      ],
    },
    guidance: {
      what_to_do: [
        'Take the most advanced available courses in your intended field',
        'If courses weren\'t available, pursue dual enrollment or online options',
        'Show depth in your area of interest, not just breadth',
      ],
      what_to_avoid: [
        'Don\'t claim a major without corresponding preparation',
        'Don\'t wait until senior year to take key courses',
      ],
      how_to_present: 'Your transcript should make your interests obvious even before reading your essays.',
    },
    context_notes: {
      for_stem_applicants: 'STEM: Calc BC, Physics, Chemistry, CS are typically expected',
      for_humanities_applicants: 'Humanities: Multiple history, literature, language courses expected',
    },
  },

  // ========================================================================
  // TRAJECTORY-RELATED TEACHING
  // ========================================================================

  ascending_trajectory: {
    issue_type: 'ascending_trajectory',
    why_section: {
      headline: 'An upward grade trend can be one of your strongest assets',
      explanation: `Colleges love to see improvement. A student who went from 3.2 freshman year to 3.9 junior year shows growth, resilience, and maturity. This pattern suggests you\'ll continue improving in college. It\'s more compelling than a static 3.6 because it shows trajectory and capacity for development.`,
      admissions_perspective: 'We\'re admitting you for who you\'re becoming, not just who you\'ve been. Upward trajectories are very positive signals.',
      common_misconception: 'Students with rough freshman years often think they\'re doomed. An upward trajectory can actually be a strength in your narrative.',
    },
    research_support: {
      primary_citation: {
        source: 'Empowerly',
        quote: 'Junior year is widely regarded as the most important year for GPA evaluation. These are the most recent grades colleges see when students apply.',
        module_reference: 'Section 6.6: Grade Interpretation',
      },
      supporting_citations: [
        {
          source: 'CollegeVine',
          quote: 'An upward trend shows growth mindset and ability to overcome challenges.',
          module_reference: 'Section 6.6',
        },
      ],
    },
    guidance: {
      what_to_do: [
        'Maintain your trajectory through senior year',
        'Consider addressing your growth in essays if it\'s a meaningful story',
        'Show that the improvement reflects genuine development, not course-shopping',
      ],
      what_to_avoid: [
        'Don\'t drop your guard senior year (senioritis)',
        'Don\'t attribute improvement to easier courses - it should come from growth',
      ],
      how_to_present: 'Your transcript tells the story, but you can reinforce the growth narrative in essays if relevant.',
    },
  },

  descending_trajectory: {
    issue_type: 'descending_trajectory',
    why_section: {
      headline: 'A downward grade trend raises serious questions',
      explanation: `Declining grades create concern about your ability to handle college rigor. If your grades are dropping as courses get harder, admissions officers wonder: will this continue in college? A downward trend needs explanation - and ideally, recovery evidence.`,
      admissions_perspective: 'We need to understand what\'s happening. Is it circumstances? Loss of motivation? Inability to handle rigor? Without context, we have to assume the worst.',
    },
    research_support: {
      primary_citation: {
        source: 'Section 6.9: Academic Red Flags',
        quote: 'Descending trajectory is a red flag requiring explanation.',
        module_reference: 'Section 6.6: Grade Interpretation',
      },
      supporting_citations: [],
    },
    guidance: {
      what_to_do: [
        'If there are circumstances, explain them in additional info',
        'Show recovery in most recent grades if possible',
        'Have your counselor provide context if appropriate',
      ],
      what_to_avoid: [
        'Don\'t ignore the pattern and hope it won\'t be noticed',
        'Don\'t make excuses without taking accountability',
      ],
      how_to_present: 'Address it briefly but directly. Focus on what you learned and how you\'re addressing it.',
    },
  },

  senior_year_decline: {
    issue_type: 'senior_year_decline',
    why_section: {
      headline: 'Senior year grades matter more than many students think',
      explanation: `74.1% of colleges consider senior year grades important in admissions decisions, and 22% rescind at least one admission offer annually due to senior year performance. "Senioritis" is not an excuse - colleges expect you to maintain your academic standards through graduation.`,
      admissions_perspective: 'We make decisions based on who we think you are. Significant senior year decline makes us question if we misjudged you.',
    },
    research_support: {
      primary_citation: {
        source: 'NACAC / Education Week',
        quote: '74.1% of colleges consider senior year grades important when making admissions decisions. 22% of colleges rescinded at least one admission per year.',
        module_reference: 'Section 6.9: Academic Red Flags',
      },
      supporting_citations: [],
      key_statistic: '22% of colleges rescind at least one admission offer per year due to senior year performance.',
    },
    guidance: {
      what_to_do: [
        'Maintain rigor and effort through senior year',
        'Remember that mid-year and final transcripts are sent to colleges',
        'If circumstances cause a dip, communicate proactively with colleges',
      ],
      what_to_avoid: [
        'Don\'t assume admission is final until you graduate',
        'Don\'t drop from AP to regular senior year',
        'Don\'t let grades slide significantly',
      ],
      how_to_present: 'The best approach is prevention. If a dip occurs, communicate with your colleges proactively.',
    },
  },

  // ========================================================================
  // SPECIAL CONTEXT TEACHING
  // ========================================================================

  dual_enrollment_value: {
    issue_type: 'dual_enrollment_value',
    why_section: {
      headline: 'Dual enrollment is valued - but not equally to AP/IB at selective schools',
      explanation: `Dual enrollment shows initiative and college readiness, but elite colleges view it differently than AP/IB. Community college courses are treated roughly like honors courses. University courses carry more weight. The key value is demonstrating you can succeed in a college environment - but it doesn\'t replace the standardized validation of AP exams.`,
      admissions_perspective: 'At Top Elites or Ivy, dual enrollment works as evidence of course rigor. In some cases, it doesn\'t mean anything at all - especially if it\'s instead of APs that were available.',
    },
    research_support: {
      primary_citation: {
        source: 'CollegeVine',
        quote: 'At Top Elites or Ivy, the presence of Dual-Enrollment coursework on your transcript only works as evidence of course rigor.',
        module_reference: 'Section 6.3: Dual Enrollment Evaluation',
      },
      supporting_citations: [
        {
          source: 'CollegeAdvisor',
          quote: 'Dual enrollment classes are looked at similarly to Honors classes by most schools.',
          module_reference: 'Section 6.3',
        },
      ],
    },
    guidance: {
      what_to_do: [
        'Use DE for subjects not available as AP (e.g., Linear Algebra, advanced languages)',
        'Choose university DE over community college when possible',
        'Earn As - anything less undermines the value proposition',
      ],
      what_to_avoid: [
        'Don\'t substitute DE for available APs at selective schools',
        'Don\'t take easy community college courses just for college credit',
      ],
      how_to_present: 'Highlight DE courses that show intellectual initiative beyond what your school offers.',
    },
  },

  homeschool_validation: {
    issue_type: 'homeschool_validation',
    why_section: {
      headline: 'Homeschool students need external validation - grades alone aren\'t enough',
      explanation: `Colleges can\'t evaluate parent-assigned grades the same way they evaluate school grades. Homeschooled students need external validation through standardized tests, AP exams, dual enrollment grades, competition results, and outside recommendations. The more external data points, the more confidently colleges can assess preparation.`,
      admissions_perspective: 'We need ways to benchmark homeschool students against traditional applicants. External measures are essential.',
    },
    research_support: {
      primary_citation: {
        source: 'Harvard Admissions',
        quote: 'Test scores provide external validation that transcripts alone cannot offer.',
        module_reference: 'Section 6.8: Homeschool Evaluation',
      },
      supporting_citations: [
        {
          source: 'MIT Admissions',
          quote: 'External coursework helps us evaluate academic preparation consistently.',
          module_reference: 'Section 6.8',
        },
      ],
    },
    guidance: {
      what_to_do: [
        'Take SAT/ACT and submit scores (test-optional may not help homeschoolers)',
        'Take multiple AP exams and score well (5s and 4s)',
        'Complete dual enrollment courses with verifiable grades',
        'Participate in academic competitions for benchmarking',
        'Get recommendations from non-family adults who know your academic work',
      ],
      what_to_avoid: [
        'Don\'t rely solely on parent-created transcripts',
        'Don\'t skip standardized testing without strong external validation',
      ],
      how_to_present: 'Build a portfolio of external validation that makes your academic strength undeniable.',
    },
  },

  international_conversion: {
    issue_type: 'international_conversion',
    why_section: {
      headline: 'International credentials need translation - your grades may be stronger than you think',
      explanation: `US colleges have extensive experience evaluating international curricula. IB scores of 38+ are highly competitive. A-Level A*A*A is equivalent to a US 4.0. The key is understanding how your system translates and providing context where needed.`,
      admissions_perspective: 'We evaluate students within their educational system. Strong performance in IB, A-Levels, or rigorous national curricula is well understood.',
    },
    research_support: {
      primary_citation: {
        source: 'IB Organization / University Research',
        quote: 'A score of 38+ is typically competitive for Ivy League admission.',
        module_reference: 'Section 6.7: International Curricula',
      },
      supporting_citations: [],
    },
    guidance: {
      what_to_do: [
        'Understand how your curriculum converts to US standards',
        'Provide predicted scores early if final scores come after application',
        'Have your counselor explain any unusual aspects of your system',
      ],
      what_to_avoid: [
        'Don\'t assume US schools won\'t understand your curriculum',
        'Don\'t undersell your achievements',
      ],
      how_to_present: 'Present your credentials confidently with any necessary context about your educational system.',
    },
  },

  // ========================================================================
  // TESTING-RELATED TEACHING
  // ========================================================================

  test_optional_strategy: {
    issue_type: 'test_optional_strategy',
    why_section: {
      headline: 'Test-optional doesn\'t mean test-blind - your decision sends a signal',
      explanation: `When colleges see no test scores, they wonder why. If your scores are strong (above the school\'s median), submitting helps. If they\'re below median but your GPA is strong, test-optional may make sense. The key is understanding that omitting scores doesn\'t make them irrelevant - it creates an open question.`,
      admissions_perspective: 'We evaluate applications holistically. But when scores are absent, we look more carefully at other academic indicators.',
    },
    research_support: {
      primary_citation: {
        source: 'NACAC State of College Admission',
        quote: 'Test scores remain one of the primary methods for comparing students across different schools.',
        module_reference: 'Section 6.6: Grade Interpretation',
      },
      supporting_citations: [],
    },
    guidance: {
      what_to_do: [
        'Submit if scores are at or above the school\'s middle 50%',
        'Consider test-optional if scores are significantly below your GPA',
        'Use AP exam scores as alternative validation if available',
      ],
      what_to_avoid: [
        'Don\'t assume test-optional is always better',
        'Don\'t go test-optional at schools where scores would help you',
      ],
      how_to_present: 'Make a school-by-school decision based on where your scores fall relative to admitted student profiles.',
    },
  },

  ap_exam_validation: {
    issue_type: 'ap_exam_validation',
    why_section: {
      headline: 'AP exam scores validate your course grades',
      explanation: `AP exams are externally scored and standardized. When your exam scores match your course grades, it confirms your school\'s rigor. When there\'s a mismatch (A in class, 2 on exam), it raises questions about grade inflation. Strong AP scores (4s and 5s) strengthen your academic profile significantly.`,
      admissions_perspective: 'AP scores help us understand what grades really mean at your school. Consistent performance validates everything.',
    },
    research_support: {
      primary_citation: {
        source: 'College Board',
        quote: 'AP exam scores provide standardized, externally-validated assessment of college-level learning.',
        module_reference: 'Section 6.2: AP Course Difficulty Tiers',
      },
      supporting_citations: [],
    },
    guidance: {
      what_to_do: [
        'Report 4s and 5s - they strengthen your application',
        'Consider not reporting 1s and 2s (if self-reporting is optional)',
        'If grades and scores diverge, address it if there\'s a good explanation',
      ],
      what_to_avoid: [
        'Don\'t assume low AP scores won\'t matter',
        'Don\'t take AP courses without preparing for the exam',
      ],
      how_to_present: 'Strong AP scores should be prominently displayed. Weak scores in otherwise strong areas may need brief context.',
    },
  },

  testing_gaps: {
    issue_type: 'testing_gaps',
    why_section: {
      headline: 'Having no testing at all creates uncertainty',
      explanation: `While test-optional policies are widespread, having no standardized test data (no SAT, ACT, AP exams, or other external measures) makes it harder for colleges to evaluate your preparation. At minimum, AP exam scores can provide valuable external validation.`,
      admissions_perspective: 'Without any external testing, we rely entirely on school context and grades - which makes evaluation harder.',
    },
    research_support: {
      primary_citation: {
        source: 'Section 6.8: Homeschool Evaluation',
        quote: 'External validation through testing is critical for students without traditional school context.',
        module_reference: 'Section 6.8',
      },
      supporting_citations: [],
    },
    guidance: {
      what_to_do: [
        'Take AP exams in your strongest subjects',
        'Consider SAT/ACT if you test well',
        'Ensure some form of external academic validation',
      ],
      what_to_avoid: [
        'Don\'t assume you can skip all testing',
        'Don\'t leave colleges with no external data points',
      ],
      how_to_present: 'Provide multiple forms of external validation if standardized testing isn\'t your strength.',
    },
  },

  // ========================================================================
  // RED FLAG TEACHING
  // ========================================================================

  academic_dishonesty: {
    issue_type: 'academic_dishonesty',
    why_section: {
      headline: 'Academic dishonesty is the most serious academic red flag',
      explanation: `Any documented cheating, plagiarism, or falsification is grounds for rejection - and potentially rescinded admission. Colleges take integrity extremely seriously. If you have a disciplinary record, you must disclose it honestly and show genuine reflection and growth.`,
      admissions_perspective: 'Integrity is non-negotiable. We will not admit students we cannot trust academically.',
    },
    research_support: {
      primary_citation: {
        source: 'NACAC Ethical Standards',
        quote: 'Academic dishonesty is grounds for rescinding admission offers.',
        module_reference: 'Section 6.9: Academic Red Flags',
      },
      supporting_citations: [],
    },
    guidance: {
      what_to_do: [
        'If required to disclose, be completely honest',
        'Show genuine reflection on what you learned',
        'Demonstrate how you\'ve changed since the incident',
      ],
      what_to_avoid: [
        'Never lie about disciplinary history',
        'Don\'t minimize the seriousness of the violation',
      ],
      how_to_present: 'Complete honesty is essential. Focus on accountability and growth.',
    },
  },

  grade_manipulation: {
    issue_type: 'grade_manipulation',
    why_section: {
      headline: 'Any misrepresentation of academic record is grounds for rejection',
      explanation: `Colleges verify transcripts. Any attempt to alter grades, fabricate courses, or misrepresent academic history will be discovered and result in rejection - or rescinded admission even years later.`,
      admissions_perspective: 'We verify everything. Dishonesty in the application is disqualifying.',
    },
    research_support: {
      primary_citation: {
        source: 'Section 6.9: Academic Red Flags',
        quote: 'Transcript falsification is a Tier 1 (Disqualifying) red flag with no mitigation.',
        module_reference: 'Section 6.9: Academic Red Flags',
      },
      supporting_citations: [],
    },
    guidance: {
      what_to_do: [
        'Ensure all self-reported information matches official transcripts',
        'If there are errors on your transcript, work with your school to correct them officially',
      ],
      what_to_avoid: [
        'Never alter or misrepresent any academic information',
      ],
      how_to_present: 'Be completely accurate in all self-reported academic information.',
    },
  },

  strategic_avoidance: {
    issue_type: 'strategic_avoidance',
    why_section: {
      headline: 'Choosing easy courses to protect GPA is obvious to admissions officers',
      explanation: `Admissions officers review thousands of transcripts and can immediately spot "GPA protection" strategies. Taking regular courses when AP is available, avoiding subjects that might be challenging, or dropping down from honors - these patterns signal you\'re optimizing for grades rather than learning.`,
      admissions_perspective: 'We want students who seek challenge, not students who avoid it. Risk aversion in course selection is a negative signal.',
    },
    research_support: {
      primary_citation: {
        source: 'Section 6.9: Academic Red Flags',
        quote: 'Strategic Course Avoidance: Avoiding challenging courses to protect GPA signals prioritizing grades over learning.',
        module_reference: 'Section 6.6: Grade Interpretation',
      },
      supporting_citations: [],
    },
    guidance: {
      what_to_do: [
        'Choose rigor, especially in your areas of interest',
        'Accept that Bs in hard courses are better than As in easy ones',
        'Show intellectual courage through your choices',
      ],
      what_to_avoid: [
        'Don\'t drop to regular to guarantee an A',
        'Don\'t avoid hard courses in your intended major',
      ],
      how_to_present: 'Your course selection should demonstrate intellectual curiosity and willingness to be challenged.',
    },
  },

  // ========================================================================
  // ADDITIONAL REQUIRED TEACHING MOMENTS
  // ========================================================================

  course_progression: {
    issue_type: 'course_progression',
    why_section: {
      headline: 'Course progression shows intellectual growth and preparation',
      explanation: `Colleges want to see logical progression in your coursework - from foundational courses to advanced ones, especially in your areas of interest. A student who takes Algebra → Geometry → Algebra 2 → Pre-Calc → Calc demonstrates systematic preparation. Skipping prerequisites or stagnating at the same level raises questions.`,
      admissions_perspective: 'We look for students who build progressively on their knowledge and challenge themselves more each year.',
    },
    research_support: {
      primary_citation: {
        source: 'Section 6.4: Course Sequencing',
        quote: 'Course progression should show increasing challenge and deepening expertise.',
        module_reference: 'Section 6.4: Course Sequencing',
      },
      supporting_citations: [],
    },
    guidance: {
      what_to_do: [
        'Follow logical sequences in core subjects',
        'Advance to higher levels when available',
        'Show progression in your intended major area',
      ],
      what_to_avoid: [
        'Don\'t plateau at the same level for multiple years',
        'Don\'t skip foundational courses without reason',
      ],
      how_to_present: 'Your transcript should show clear progression from introductory to advanced work.',
    },
  },

  subject_depth_gaps: {
    issue_type: 'subject_depth_gaps',
    why_section: {
      headline: 'Depth in core subjects matters more than breadth',
      explanation: `Having advanced work in multiple areas is good, but having depth in none is concerning. If you\'ve taken AP in 8 subjects but never went beyond introductory level in any one area, that signals breadth without depth. Colleges want to see at least one area where you\'ve gone deep.`,
      admissions_perspective: 'We value students who demonstrate genuine intellectual depth in at least one area.',
    },
    research_support: {
      primary_citation: {
        source: 'MIT Admissions',
        quote: 'We look for depth of engagement, not just breadth of exposure.',
        module_reference: 'Section 6.1: Course Level Hierarchy',
      },
      supporting_citations: [],
    },
    guidance: {
      what_to_do: [
        'Develop depth in your area of passion',
        'Take multiple advanced courses in at least one subject',
        'Show progression within a discipline',
      ],
      what_to_avoid: [
        'Don\'t spread yourself so thin that you lack depth anywhere',
        'Don\'t avoid going deep in challenging subjects',
      ],
      how_to_present: 'Highlight where you\'ve developed real expertise, not just surface-level exposure.',
    },
  },

  inconsistent_performance: {
    issue_type: 'inconsistent_performance',
    why_section: {
      headline: 'Inconsistent grades create uncertainty about your academic profile',
      explanation: `Significant variation in your grades - As in some subjects, Cs in others without clear pattern - raises questions. Are you only engaged when interested? Do you struggle with certain teaching styles? Colleges want to understand the story behind the inconsistency.`,
      admissions_perspective: 'We try to understand what inconsistent performance means. Is it about genuine weakness, engagement, or external factors?',
    },
    research_support: {
      primary_citation: {
        source: 'Section 6.6: Grade Interpretation',
        quote: 'Inconsistent grades may indicate engagement issues or external factors requiring explanation.',
        module_reference: 'Section 6.6: Grade Interpretation',
      },
      supporting_citations: [],
    },
    guidance: {
      what_to_do: [
        'If there are external factors, address them in additional info',
        'Show strong performance in your areas of passion',
        'Work to improve in weak areas senior year',
      ],
      what_to_avoid: [
        'Don\'t ignore the pattern - it will be noticed',
        'Don\'t let weak areas get worse',
      ],
      how_to_present: 'If there\'s a pattern (strong in STEM, weak in humanities, or vice versa), that\'s more explainable than random inconsistency.',
    },
  },

  rigor_dip_recovery: {
    issue_type: 'rigor_dip_recovery',
    why_section: {
      headline: 'A GPA dip when increasing rigor is normal - recovery is what matters',
      explanation: `When students move from honors to AP, or take on significantly more challenge, a temporary GPA dip is expected and even positive. It shows you\'re willing to challenge yourself. The key is what happens next: did you adapt and recover, or did you retreat to easier courses?`,
      admissions_perspective: 'We expect grades to adjust when rigor increases. What we look for is how you respond - recovery shows resilience.',
    },
    research_support: {
      primary_citation: {
        source: 'CollegeVine',
        quote: 'A temporary GPA dip when increasing rigor shows intellectual courage. Recovery demonstrates resilience.',
        module_reference: 'Section 6.6: Grade Interpretation',
      },
      supporting_citations: [],
    },
    guidance: {
      what_to_do: [
        'Don\'t panic if grades dip when taking harder courses',
        'Focus on adapting and improving in subsequent semesters',
        'Show the recovery in your transcript',
      ],
      what_to_avoid: [
        'Don\'t retreat to easier courses after a dip',
        'Don\'t use the dip as an excuse to avoid future challenge',
      ],
      how_to_present: 'The dip-and-recovery pattern is positive. It shows you challenged yourself and grew.',
    },
  },
};

// ============================================================================
// ACADEMIC TEACHING SERVICE
// ============================================================================

export class AcademicTeachingService {
  /**
   * Get complete teaching moment for an academic issue
   */
  getTeaching(issueType: AcademicIssueType): AcademicTeachingMoment | null {
    return ACADEMIC_TEACHING_KNOWLEDGE_BASE[issueType] || null;
  }

  /**
   * Get WHY explanation for an issue
   */
  getWhyExplanation(issueType: AcademicIssueType): string | null {
    const teaching = this.getTeaching(issueType);
    if (!teaching) return null;

    return `${teaching.why_section.headline}\n\n${teaching.why_section.explanation}`;
  }

  /**
   * Get admissions perspective on an issue
   */
  getAdmissionsPerspective(issueType: AcademicIssueType): string | null {
    const teaching = this.getTeaching(issueType);
    return teaching?.why_section.admissions_perspective || null;
  }

  /**
   * Get citations for an issue
   */
  getCitations(issueType: AcademicIssueType): Citation[] {
    const teaching = this.getTeaching(issueType);
    if (!teaching) return [];

    return [
      teaching.research_support.primary_citation,
      ...teaching.research_support.supporting_citations,
    ];
  }

  /**
   * Get all teaching for a list of issues
   */
  getTeachingBundle(issueTypes: AcademicIssueType[]): AcademicTeachingMoment[] {
    return issueTypes
      .map((type) => this.getTeaching(type))
      .filter((t): t is AcademicTeachingMoment => t !== null);
  }

  /**
   * Get context-specific guidance
   */
  getContextualGuidance(
    issueType: AcademicIssueType,
    context: 'stem' | 'humanities' | 'first_gen' | 'international'
  ): string | null {
    const teaching = this.getTeaching(issueType);
    if (!teaching?.context_notes) return null;

    switch (context) {
      case 'stem':
        return teaching.context_notes.for_stem_applicants || null;
      case 'humanities':
        return teaching.context_notes.for_humanities_applicants || null;
      case 'first_gen':
        return teaching.context_notes.for_first_gen || null;
      case 'international':
        return teaching.context_notes.for_international || null;
      default:
        return null;
    }
  }

  /**
   * Format a complete teaching response with research backing
   */
  formatTeachingResponse(issueType: AcademicIssueType): string {
    const teaching = this.getTeaching(issueType);
    if (!teaching) return '';

    const sections: string[] = [];

    // Headline
    sections.push(`## ${teaching.why_section.headline}`);

    // Explanation
    sections.push(teaching.why_section.explanation);

    // Admissions perspective
    sections.push(`\n**How Admissions Officers See It:**\n"${teaching.why_section.admissions_perspective}"`);

    // Common misconception
    if (teaching.why_section.common_misconception) {
      sections.push(`\n**Common Misconception:**\n${teaching.why_section.common_misconception}`);
    }

    // Key statistic
    if (teaching.research_support.key_statistic) {
      sections.push(`\n**Key Statistic:** ${teaching.research_support.key_statistic}`);
    }

    // Guidance
    sections.push('\n**What To Do:**');
    teaching.guidance.what_to_do.forEach((item) => {
      sections.push(`- ${item}`);
    });

    sections.push('\n**What To Avoid:**');
    teaching.guidance.what_to_avoid.forEach((item) => {
      sections.push(`- ${item}`);
    });

    // Citation
    const citation = teaching.research_support.primary_citation;
    sections.push(`\n---\n*Source: ${citation.source} - "${citation.quote}" (${citation.module_reference})*`);

    return sections.join('\n');
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const academicTeachingService = new AcademicTeachingService();

/**
 * Convenience function to get teaching for an academic issue
 */
export function getAcademicTeaching(issueType: AcademicIssueType): AcademicTeachingMoment | null {
  return academicTeachingService.getTeaching(issueType);
}

/**
 * Convenience function to get formatted teaching response
 */
export function formatAcademicTeaching(issueType: AcademicIssueType): string {
  return academicTeachingService.formatTeachingResponse(issueType);
}
