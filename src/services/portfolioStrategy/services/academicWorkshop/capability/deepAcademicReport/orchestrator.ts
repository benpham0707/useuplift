// @ts-nocheck
/**
 * Deep Academic Report Orchestrator
 *
 * Main entry point for generating a deep academic report.
 * Replaces the monolith's DeepAcademicReportService class with a functional approach.
 *
 * Pipeline:
 * 1. Assemble enriched context (synchronous, ~5ms)
 * 2. Generate research context (template, $0)
 * 3. Generate identity, challenges, roadmap in PARALLEL (LLM, ~$0.15)
 * 4. Post-process: validate and clean LLM output
 * 5. Generate bottom line summary (Haiku, ~$0.002)
 * 6. Assemble final report with metadata
 *
 * Key improvements over monolith:
 * - B6: Promise.allSettled for partial failure resilience
 * - B7: Request-scoped cost tracking (no singleton state)
 * - D3: Haiku-powered bottom line synthesis (not verbatim extraction)
 * - D4: Post-processing validation catches LLM mistakes
 */

import type { DeepAcademicReport, DeepAcademicReportInput, ReportMetadata, AcademicIdentitySection, ChallengesAndRealitySection, StrategicRoadmapSection } from './types';
import type { ValidationIssue } from './validation/postProcessing';
import { assembleEnrichedContext } from './context/contextAssembly';
import { generateAcademicIdentity } from './generators/identityGenerator';
import { generateChallengesAndReality } from './generators/challengesGenerator';
import { generateStrategicRoadmap } from './generators/roadmapGenerator';
import { generateResearchContext } from './generators/researchGenerator';
import { generateBottomLine } from './generators/bottomLineGenerator';
import { validateReportOutput, fixRoadmapPostProcessing } from './validation/postProcessing';
import { generateTemplateFallback } from './fallback/templateFallback';
import { deepAcademicReportCache, generateHashedCacheKey } from '../../../../utils/caching';

// ============================================================================
// V4: Cross-section consistency validation
// ============================================================================

function validateCrossSectionConsistency(
  identity: AcademicIdentitySection,
  challenges: ChallengesAndRealitySection,
  roadmap: StrategicRoadmapSection
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check: roadmap doesn't recommend courses as "low risk" when related challenge exists
  const challengeTitles = challenges.challenges.map(c => c.title.toLowerCase());
  for (const rec of roadmap.courseStrategy.recommended) {
    const courseLower = rec.course.toLowerCase();
    for (const challengeTitle of challengeTitles) {
      const firstWord = challengeTitle.split(' ')[0];
      if (firstWord.length > 3 && courseLower.includes(firstWord) && rec.risk === 'low') {
        issues.push({
          type: 'cross_section_contradiction',
          severity: 'warning',
          section: `roadmap.courseStrategy.recommended: ${rec.course}`,
          description: `Course recommended as "low risk" but related challenge "${challengeTitle}" exists — consider marking as "medium" risk`,
          action: 'flagged',
        });
      }
    }
  }

  // Check: all priorities marked 'critical' — max 1 should be critical
  const criticalCount = roadmap.priorities.filter(p => p.impact === 'critical').length;
  if (criticalCount > 1) {
    issues.push({
      type: 'cross_section_contradiction',
      severity: 'warning',
      section: 'roadmap.priorities',
      description: `${criticalCount} priorities marked 'critical' — only 1 should be critical for clear prioritization`,
      action: 'flagged',
    });
  }

  return issues;
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

export async function generateDeepAcademicReport(
  input: DeepAcademicReportInput
): Promise<DeepAcademicReport> {
  const startTime = Date.now();

  // Request-scoped cost tracking (B7 fix — no singleton state)
  let accumulatedCost = 0;
  const accumulatedTokens = { input: 0, output: 0 };
  const trackUsage = (usage: { input_tokens?: number; output_tokens?: number } | undefined): void => {
    if (!usage) return;
    const inp = usage.input_tokens || 0;
    const out = usage.output_tokens || 0;
    accumulatedTokens.input += inp;
    accumulatedTokens.output += out;
    accumulatedCost += (inp / 1_000_000) * 3 + (out / 1_000_000) * 15;
  };

  // V6: Create a Haiku-aware wrapper for bottom line cost tracking
  const trackHaikuUsage = (usage: { input_tokens?: number; output_tokens?: number } | undefined): void => {
    if (!usage) return;
    const inp = usage.input_tokens || 0;
    const out = usage.output_tokens || 0;
    accumulatedTokens.input += inp;
    accumulatedTokens.output += out;
    accumulatedCost += (inp / 1_000_000) * 0.80 + (out / 1_000_000) * 4;
  };

  // Step 1: Assemble enriched context
  const ctx = assembleEnrichedContext(input);

  // Step 2: Template section (always works)
  const researchContext = generateResearchContext(ctx);

  const sectionSources: Record<string, 'llm' | 'template'> = {
    researchContext: 'template',
  };
  let usedFallback = false;

  // Step 3: Parallel LLM sections with Promise.allSettled (B6 fix)
  const [identityResult, challengesResult, roadmapResult] = await Promise.allSettled([
    generateAcademicIdentity(ctx, trackUsage),
    generateChallengesAndReality(ctx, trackUsage),
    generateStrategicRoadmap(ctx, trackUsage),
  ]);

  // Handle partial failures with template fallback
  let fallback: ReturnType<typeof generateTemplateFallback> | null = null;
  const getFallback = () => {
    if (!fallback) fallback = generateTemplateFallback(ctx);
    return fallback;
  };

  let identity;
  if (identityResult.status === 'fulfilled') {
    sectionSources.academicIdentity = 'llm';
    identity = identityResult.value;
  } else {
    console.error('[DeepAcademicReport] Identity generation failed:', identityResult.reason);
    sectionSources.academicIdentity = 'template';
    usedFallback = true;
    identity = getFallback().academicIdentity;
  }

  let challenges;
  if (challengesResult.status === 'fulfilled') {
    sectionSources.challengesAndReality = 'llm';
    challenges = challengesResult.value;
  } else {
    console.error('[DeepAcademicReport] Challenges generation failed:', challengesResult.reason);
    sectionSources.challengesAndReality = 'template';
    usedFallback = true;
    challenges = getFallback().challengesAndReality;
  }

  let roadmap;
  if (roadmapResult.status === 'fulfilled') {
    sectionSources.strategicRoadmap = 'llm';
    roadmap = roadmapResult.value;
  } else {
    console.error('[DeepAcademicReport] Roadmap generation failed:', roadmapResult.reason);
    sectionSources.strategicRoadmap = 'template';
    usedFallback = true;
    roadmap = getFallback().strategicRoadmap;
  }

  // Step 4: Post-processing validation (D4)
  // R18: Pass roadmap for stat dedup validation
  const validation = validateReportOutput(identity, challenges, input.intendedMajor, roadmap);

  // H2 + C2: Roadmap post-processing (score band fix + recommend/avoid contradictions)
  const roadmapFix = fixRoadmapPostProcessing(roadmap);
  roadmap = roadmapFix.roadmap;

  // V4: Cross-section consistency check
  const crossSectionIssues = validateCrossSectionConsistency(
    validation.cleaned.identity, validation.cleaned.challenges, roadmap
  );
  const allIssues = [...validation.issues, ...roadmapFix.issues, ...crossSectionIssues];

  if (allIssues.length > 0) {
    console.warn(`[DeepAcademicReport] Post-processing found ${allIssues.length} issues:`,
      allIssues.map(i => `${i.type}: ${i.description}`).join('; '));
  }

  // Step 5: Bottom Line synthesis (D3 — Haiku call, runs AFTER sections)
  // V6: Use Haiku-specific cost tracking for bottom line call
  const bottomLine = await generateBottomLine(
    validation.cleaned.identity, validation.cleaned.challenges, roadmap, trackHaikuUsage
  );

  // Step 6: Assemble final report
  const metadata: ReportMetadata = {
    generationTimeMs: Date.now() - startTime,
    estimatedCost: accumulatedCost,
    tokenUsage: { ...accumulatedTokens },
    sectionSources,
    usedFallback,
  };

  return {
    bottomLine,
    academicIdentity: validation.cleaned.identity,
    challengesAndReality: validation.cleaned.challenges,
    strategicRoadmap: roadmap,
    researchContext,
    metadata,
  };
}

// ============================================================================
// CACHED WRAPPER
// ============================================================================

/**
 * Cache-first wrapper around generateDeepAcademicReport().
 * Returns cached report if available, otherwise generates and caches.
 *
 * Reports cost ~$0.13 and depend on static transcript data,
 * so caching with a 2-hour TTL is safe within a session.
 */
export async function getOrGenerateDeepAcademicReport(
  input: DeepAcademicReportInput
): Promise<DeepAcademicReport> {
  const { key, hash } = generateHashedCacheKey(
    'deep-report',
    'deep_academic_report',
    input
  );

  const cached = deepAcademicReportCache.get(key);
  if (cached !== null) {
    console.log('[DeepAcademicReport] Cache hit — returning cached report');
    return cached as DeepAcademicReport;
  }

  console.log('[DeepAcademicReport] Cache miss — generating report');
  const report = await generateDeepAcademicReport(input);
  deepAcademicReportCache.set(key, report, hash);

  return report;
}
