/**
 * WritingQualityEngine Reference Essay Fixtures
 *
 * Eight carefully crafted essays covering the full quality spectrum.
 * Each essay is an ExperienceEntry compatible with the analysis engine.
 *
 * Usage: import { WQE_REFERENCE_ESSAYS } from './wqe-reference-essays';
 *
 * Archetype Coverage:
 *   1. excellent            - High scores across all dimensions
 *   2. mediocre             - Middle-of-road, competent but flat
 *   3. weak                 - Vague, templated, no story
 *   4. ai_generated         - Polished but inauthentic (ChatGPT-style)
 *   5. very_short           - Under 80 words, edge case
 *   6. register_inconsistent - Mixed formal/informal voice
 *   7. strong_narrative_arc - Clear tension-resolution-insight
 *   8. pure_reflection      - No events, pure introspection
 */

import { ExperienceEntry } from '../../src/core/types/experience';
import { EssayArchetype, ExpectedScoreRanges } from '../integration/wqe-types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// HELPER: Build ExperienceEntry with defaults
// ============================================================================

function makeEntry(
  overrides: Partial<ExperienceEntry> & { description_original: string; title: string; category: ExperienceEntry['category'] }
): ExperienceEntry {
  return {
    id: uuidv4(),
    user_id: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    time_span: 'September 2023 - June 2025',
    start_date: '2023-09-01',
    end_date: '2025-06-15',
    hours_per_week: 4,
    weeks_per_year: 36,
    tags: [],
    version: 1,
    ...overrides,
  };
}

// ============================================================================
// 1. EXCELLENT — High scores across all dimensions
// ============================================================================

export const EXCELLENT_ESSAY = makeEntry({
  title: 'Community Health Clinic Volunteer',
  organization: 'Eastside Community Health Center',
  role: 'Patient Navigator & Intake Coordinator',
  category: 'service',
  tags: ['healthcare', 'community', 'leadership'],
  hours_per_week: 4,
  weeks_per_year: 40,
  description_original:
    `Most Wednesdays smelled like bleach and citrus. I learned which regulars ` +
    `wanted to talk and which just needed silence while I checked them in. ` +
    `Started as a greeter, but three months in, I noticed patients struggling ` +
    `with our intake form—some couldn't read English well, others seemed ` +
    `overwhelmed by medical jargon. I redesigned the form with my supervisor ` +
    `Ana, cutting questions from 47 to 22 and adding simple icons. Wait times ` +
    `dropped from 18 minutes to 9, and patients started asking follow-up ` +
    `questions instead of just nodding. By spring, I was training two freshmen ` +
    `to run intake so the system wouldn't collapse when I graduated. I used to ` +
    `think efficiency meant speed, but I learned it actually means removing the ` +
    `barriers that make people feel small. That insight changed how I approach ` +
    `every group project now—I pause and ask what we're missing, not just what ` +
    `we need to do faster.`,
});

// ============================================================================
// 2. MEDIOCRE — Competent but flat, decent facts, no depth
// ============================================================================

export const MEDIOCRE_ESSAY = makeEntry({
  title: 'Robotics Club Member',
  organization: 'School Robotics Team',
  role: 'Programming Lead',
  category: 'academic',
  tags: ['STEM', 'leadership', 'programming'],
  hours_per_week: 6,
  weeks_per_year: 35,
  description_original:
    `I served as Programming Lead for our school's robotics team during my ` +
    `junior and senior years. I coordinated the programming subteam, which ` +
    `consisted of 5 members. We met twice weekly to develop code for our ` +
    `competition robot. I implemented a new version control system using ` +
    `GitHub, which improved our team's efficiency. During competitions, I was ` +
    `responsible for troubleshooting code issues and making real-time ` +
    `adjustments. Our team placed 3rd at the regional competition and ` +
    `qualified for states. I also mentored two sophomore programmers, ` +
    `teaching them Java and robot control systems. This experience improved ` +
    `my technical skills and leadership abilities.`,
});

// ============================================================================
// 3. WEAK — Vague, templated, buzzword-heavy
// ============================================================================

export const WEAK_ESSAY = makeEntry({
  title: 'Volunteer Work',
  organization: 'Local Organization',
  role: 'Volunteer',
  category: 'service',
  hours_per_week: 2,
  weeks_per_year: 20,
  description_original:
    `I was responsible for helping with various tasks at a local organization. ` +
    `I was passionate about making a difference in my community and was ` +
    `thrilled to be part of such an impactful team. I learned a lot about ` +
    `teamwork and responsibility. I helped organize events and coordinate ` +
    `with other volunteers. It was a great experience that taught me the ` +
    `value of hard work and dedication. I feel like I made a big impact ` +
    `on the community.`,
});

// ============================================================================
// 4. AI-GENERATED — Polished, formulaic, suspiciously perfect structure
// ============================================================================

export const AI_GENERATED_ESSAY = makeEntry({
  title: 'Environmental Sustainability Initiative',
  organization: 'Green Future Alliance',
  role: 'Project Coordinator',
  category: 'leadership',
  tags: ['environment', 'sustainability', 'leadership'],
  hours_per_week: 5,
  weeks_per_year: 40,
  description_original:
    `As Project Coordinator for the Green Future Alliance, I spearheaded a ` +
    `comprehensive sustainability initiative that fundamentally transformed ` +
    `our school's environmental footprint. I orchestrated a team of 12 ` +
    `dedicated volunteers to implement a three-pronged approach encompassing ` +
    `waste reduction, energy conservation, and community awareness. Our ` +
    `strategic implementation of recycling infrastructure resulted in a 40% ` +
    `decrease in landfill waste. Furthermore, I cultivated meaningful ` +
    `partnerships with local businesses to sponsor our annual Earth Day ` +
    `celebration, which attracted over 500 attendees. This transformative ` +
    `experience illuminated the profound impact that passionate, purpose-driven ` +
    `leadership can have on creating sustainable change within communities. ` +
    `The invaluable lessons I gleaned about stakeholder management, strategic ` +
    `planning, and collaborative problem-solving will undoubtedly serve me ` +
    `well in my future endeavors.`,
});

// ============================================================================
// 5. VERY SHORT — Under 80 words, edge case for pipeline
// ============================================================================

export const VERY_SHORT_ESSAY = makeEntry({
  title: 'School Newspaper',
  organization: 'High School Gazette',
  role: 'Writer',
  category: 'arts',
  hours_per_week: 2,
  weeks_per_year: 30,
  description_original:
    `I wrote articles for the school newspaper covering sports and student ` +
    `events. Published 10 articles over two years. Interviewed coaches and ` +
    `athletes. Learned AP style formatting.`,
});

// ============================================================================
// 6. REGISTER INCONSISTENT — Mixed formal and casual voice
// ============================================================================

export const REGISTER_INCONSISTENT_ESSAY = makeEntry({
  title: 'Debate Team Captain',
  organization: 'Lincoln High School Debate Society',
  role: 'Captain & Tournament Organizer',
  category: 'academic',
  tags: ['debate', 'public speaking', 'leadership'],
  hours_per_week: 8,
  weeks_per_year: 36,
  description_original:
    `As captain of the Lincoln High School Debate Society, I was responsible ` +
    `for the strategic development of argumentation frameworks utilized by ` +
    `our team members. Ngl it was super stressful sometimes lol. I ` +
    `implemented a systematic methodology for evidence categorization that ` +
    `enhanced our preparatory efficacy. But honestly the best part was just ` +
    `hanging out with my squad after practice and roasting each other's ` +
    `arguments. Our team achieved unprecedented success at the state ` +
    `championship, securing a commendable third-place finish. I helped my ` +
    `teammates get way better at not choking during cross-ex which was lowkey ` +
    `the hardest part. The juxtaposition of rigorous intellectual discourse ` +
    `with genuine interpersonal connections has profoundly shaped my ` +
    `understanding of effective communication.`,
});

// ============================================================================
// 7. STRONG NARRATIVE ARC — Clear tension-resolution-insight
// ============================================================================

export const STRONG_NARRATIVE_ARC_ESSAY = makeEntry({
  title: 'Youth Orchestra First Chair',
  organization: 'City Youth Philharmonic',
  role: 'First Chair Violin & Section Leader',
  category: 'arts',
  tags: ['music', 'leadership', 'performance'],
  hours_per_week: 10,
  weeks_per_year: 44,
  description_original:
    `My hands shook so badly during the Tchaikovsky concerto audition that ` +
    `my bow skittered across the D string like a stone on water. Maestro Kang ` +
    `stopped me after eight bars. I wanted to disappear. For three weeks ` +
    `afterward, I couldn't pick up my violin without my stomach clenching. ` +
    `My teacher, Mrs. Okafor, didn't say "practice more." She said, "Play ` +
    `the passage that scares you most, but play it ugly on purpose." That ` +
    `sounded insane, but I tried it. Something released. The fear wasn't ` +
    `about wrong notes—it was about being seen failing. Once I played badly ` +
    `on purpose, the stakes evaporated. By December I'd won the concerto ` +
    `seat and was coaching three younger violinists through their own ` +
    `audition anxiety using Mrs. Okafor's method. Now before any performance ` +
    `I play one measure terribly, on purpose, backstage. My section thinks ` +
    `I'm weird. But I haven't frozen since.`,
});

// ============================================================================
// 8. PURE REFLECTION — No specific events, introspective only
// ============================================================================

export const PURE_REFLECTION_ESSAY = makeEntry({
  title: 'Personal Journaling Practice',
  organization: '',
  role: 'Self-directed',
  category: 'arts',
  tags: ['writing', 'reflection', 'personal growth'],
  hours_per_week: 3,
  weeks_per_year: 52,
  description_original:
    `I think a lot about the difference between knowing something and ` +
    `understanding it. Most of my classmates memorize formulas and move on. ` +
    `I sit with ideas until they make sense in my body, not just my head. ` +
    `Writing in my journal every morning has taught me that understanding ` +
    `arrives slowly, in fragments. Sometimes I write the same thought five ` +
    `different ways before I find the version that feels honest. I have come ` +
    `to believe that clarity is not about removing complexity but about ` +
    `finding the right container for it. This practice has changed how I ` +
    `listen in class, how I read literature, and how I argue with friends. ` +
    `I do not rush to conclusions anymore. I let ideas breathe.`,
});

// ============================================================================
// EXPECTED SCORE RANGES
// ============================================================================

/**
 * Expected score ranges per archetype.
 * These are intentionally wide for the initial baseline capture.
 * They get tightened after the first golden baseline is established.
 */
export const EXPECTED_RANGES: Record<EssayArchetype, ExpectedScoreRanges> = {
  excellent: {
    nqi: [72, 95],
    dimensions: {
      voice_integrity: [7, 10],
      specificity_evidence: [7, 10],
      narrative_arc_stakes: [6, 10],
      reflection_meaning: [7, 10],
    },
    forbiddenFlags: ['robotic_manufactured_voice', 'too_short'],
  },
  mediocre: {
    nqi: [50, 72],
    dimensions: {
      voice_integrity: [4, 7],
      specificity_evidence: [5, 8],
      reflection_meaning: [3, 6],
    },
    requiredFlags: [],
    forbiddenFlags: ['robotic_manufactured_voice'],
  },
  weak: {
    nqi: [30, 55],
    dimensions: {
      voice_integrity: [2, 5],
      specificity_evidence: [1, 4],
      reflection_meaning: [2, 5],
    },
    requiredFlags: ['buzzword_heavy'],
  },
  ai_generated: {
    nqi: [35, 65],
    dimensions: {
      voice_integrity: [2, 5],
    },
    requiredFlags: ['essay_voice_detected'],
    forbiddenFlags: [],
  },
  very_short: {
    nqi: [20, 50],
    dimensions: {},
    requiredFlags: ['too_short'],
  },
  register_inconsistent: {
    nqi: [35, 60],
    dimensions: {
      voice_integrity: [2, 5],
      craft_language_quality: [2, 5],
    },
  },
  strong_narrative_arc: {
    nqi: [68, 92],
    dimensions: {
      narrative_arc_stakes: [7, 10],
      voice_integrity: [7, 10],
      reflection_meaning: [6, 10],
    },
    forbiddenFlags: ['no_turning_point', 'weak_narrative_structure'],
  },
  pure_reflection: {
    nqi: [50, 75],
    dimensions: {
      reflection_meaning: [6, 10],
      narrative_arc_stakes: [2, 5],
      specificity_evidence: [2, 5],
    },
    requiredFlags: ['no_metrics'],
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export interface ReferenceEssay {
  archetype: EssayArchetype;
  entry: ExperienceEntry;
  expected: ExpectedScoreRanges;
  /** Short human description for reports */
  description: string;
}

export const WQE_REFERENCE_ESSAYS: ReferenceEssay[] = [
  {
    archetype: 'excellent',
    entry: EXCELLENT_ESSAY,
    expected: EXPECTED_RANGES.excellent,
    description: 'Strong narrative with vivid detail, concrete metrics, genuine reflection',
  },
  {
    archetype: 'mediocre',
    entry: MEDIOCRE_ESSAY,
    expected: EXPECTED_RANGES.mediocre,
    description: 'Competent facts and structure, but flat voice and no deeper meaning',
  },
  {
    archetype: 'weak',
    entry: WEAK_ESSAY,
    expected: EXPECTED_RANGES.weak,
    description: 'Vague, buzzword-heavy, no concrete evidence or story',
  },
  {
    archetype: 'ai_generated',
    entry: AI_GENERATED_ESSAY,
    expected: EXPECTED_RANGES.ai_generated,
    description: 'ChatGPT-style: polished, formulaic, suspiciously perfect structure',
  },
  {
    archetype: 'very_short',
    entry: VERY_SHORT_ESSAY,
    expected: EXPECTED_RANGES.very_short,
    description: 'Under 80 words, tests pipeline edge case handling',
  },
  {
    archetype: 'register_inconsistent',
    entry: REGISTER_INCONSISTENT_ESSAY,
    expected: EXPECTED_RANGES.register_inconsistent,
    description: 'Alternates between academic prose and teen slang',
  },
  {
    archetype: 'strong_narrative_arc',
    entry: STRONG_NARRATIVE_ARC_ESSAY,
    expected: EXPECTED_RANGES.strong_narrative_arc,
    description: 'Clear failure-insight-growth arc with sensory detail',
  },
  {
    archetype: 'pure_reflection',
    entry: PURE_REFLECTION_ESSAY,
    expected: EXPECTED_RANGES.pure_reflection,
    description: 'No specific events, all introspection and philosophical voice',
  },
];

/**
 * Quick lookup by archetype.
 */
export const ESSAYS_BY_ARCHETYPE: Record<EssayArchetype, ReferenceEssay> = Object.fromEntries(
  WQE_REFERENCE_ESSAYS.map(e => [e.archetype, e])
) as Record<EssayArchetype, ReferenceEssay>;
