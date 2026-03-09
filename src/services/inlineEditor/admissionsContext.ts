/**
 * Admissions Context Builder
 *
 * Assembles 200-300 token admissions intelligence context from existing
 * knowledge bases. No LLM calls — pure data assembly.
 *
 * Injected into inline editor system prompts to give editing suggestions
 * the "admissions officer perspective" that generic tools lack.
 */

import type { WorkshopEssayType } from '@/workshop/shared/types';

/**
 * Build a compact admissions intelligence context block for LLM prompt injection.
 *
 * Pure data assembly — NO LLM calls, NO network requests.
 * Returns empty string if no useful context can be assembled.
 *
 * @param essayType - Optional essay type to pull anti-patterns for
 * @param collegeId - Optional college ID (lowercase key from ELITE_SCHOOL_VALUE_MATRICES)
 * @returns 200-300 token context block, or empty string
 */
export function buildAdmissionsContext(essayType?: string, collegeId?: string): string {
  const sections: string[] = [];

  // 1. Always include AO reading time context
  try {
    const { AO_READING_PROCESS } = require(
      '@/services/portfolioStrategy/services/activityWorkshop/expertCounselorKnowledgeBase'
    );

    const timeCtx = AO_READING_PROCESS.timeAllocation;
    sections.push(
      'AO READING CONTEXT:',
      `- AOs spend ${timeCtx.academicScan.duration} on academics, ${timeCtx.activityAndEssayScan.duration} on essays/activities`,
      `- ${timeCtx.activityAndEssayScan.criticalInsight}`,
      `- Committee pitch: ${AO_READING_PROCESS.committeePitchTest.goldStandard}`,
    );
  } catch {
    // Knowledge base not available — skip
  }

  // 2. If essayType provided, pull anti-patterns from the essay profile registry
  if (essayType) {
    try {
      const { essayProfileRegistry } = require('@/workshop/registry/essayProfileRegistry');
      // Trigger auto-import of profile files (sync — profiles register at module scope)
      require('@/workshop/essay-profiles/index');

      const profile = essayProfileRegistry.getProfile(essayType as WorkshopEssayType);
      if (profile?.antiPatterns && profile.antiPatterns.length > 0) {
        const topAntiPatterns = profile.antiPatterns.slice(0, 5);
        sections.push(
          '',
          `ANTI-PATTERNS FOR ${profile.displayName.toUpperCase()}:`,
          ...topAntiPatterns.map(ap => `- Avoid: ${ap}`),
        );
      }
    } catch {
      // Essay profiles not available — skip
    }
  }

  // 3. If collegeId provided, pull school-specific values
  if (collegeId) {
    try {
      const { ELITE_SCHOOL_VALUE_MATRICES } = require(
        '@/services/portfolioStrategy/knowledge/schoolValueDatabase'
      );

      const school = ELITE_SCHOOL_VALUE_MATRICES[collegeId.toLowerCase()];
      if (school) {
        sections.push(
          '',
          `${school.name.toUpperCase()} VALUES:`,
          ...school.distinctiveValues.primary.slice(0, 3).map((v: string) => `- ${v}`),
        );

        if (school.essayPreferences) {
          sections.push(`- Tone preference: ${school.essayPreferences.tonePreference}`);
          if (school.essayPreferences.topicsToAvoid.length > 0) {
            sections.push(`- Topics to avoid: ${school.essayPreferences.topicsToAvoid.slice(0, 3).join('; ')}`);
          }
        }
      }
    } catch {
      // School database not available — skip
    }

    // Also check SCHOOL_INTELLIGENCE archetypes for broader context
    try {
      const { SCHOOL_INTELLIGENCE } = require(
        '@/services/portfolioStrategy/services/activityWorkshop/expertCounselorKnowledgeBase'
      );

      const matchingArchetype = SCHOOL_INTELLIGENCE.archetypes.find(
        (a: { schools: string[] }) =>
          a.schools.some((s: string) => s.toLowerCase() === collegeId.toLowerCase())
      );

      if (matchingArchetype) {
        sections.push(
          '',
          `SCHOOL ARCHETYPE (${matchingArchetype.name}):`,
          `- They value: ${matchingArchetype.whatTheyValue.primary}`,
          `- Description advice: ${matchingArchetype.descriptionAdvice}`,
        );
      }
    } catch {
      // Knowledge base not available — skip
    }
  }

  // Return empty string if nothing was assembled
  if (sections.length === 0) {
    return '';
  }

  return sections.join('\n');
}
