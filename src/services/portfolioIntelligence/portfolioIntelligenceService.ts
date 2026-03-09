/**
 * Portfolio Intelligence Service
 *
 * Cross-essay analysis for theme overlap, narrative gaps, and coverage optimization.
 * 3-phase pipeline:
 *   Phase 1: Theme Extraction (LLM, parallel per essay)
 *   Phase 2: Overlap Detection (deterministic)
 *   Phase 3: Gap Analysis (deterministic)
 */

import { callClaude, calculateCost } from '@/lib/llm/claude';
import type {
  PortfolioAnalysisInput,
  PortfolioEssay,
  PortfolioAnalysis,
  EssayThemeExtraction,
  ThemeCluster,
  ThemeCategory,
  ThemeOverlap,
  NarrativeGap,
  CoverageDimension,
} from './types';

/** Coverage dimensions every portfolio should address */
const COVERAGE_DIMENSIONS = [
  'identity',
  'growth',
  'intellectual_curiosity',
  'leadership',
  'community_impact',
  'resilience',
  'creativity',
  'global_awareness',
] as const;

type CoverageDimensionName = (typeof COVERAGE_DIMENSIONS)[number];

/** Target strength by tier — higher tiers demand stronger coverage across more dimensions */
const TIER_TARGETS: Record<string, Record<CoverageDimensionName, number>> = {
  ivy_elite: {
    identity: 0.8,
    growth: 0.7,
    intellectual_curiosity: 0.8,
    leadership: 0.7,
    community_impact: 0.6,
    resilience: 0.6,
    creativity: 0.5,
    global_awareness: 0.4,
  },
  highly_selective: {
    identity: 0.7,
    growth: 0.6,
    intellectual_curiosity: 0.7,
    leadership: 0.6,
    community_impact: 0.5,
    resilience: 0.5,
    creativity: 0.4,
    global_awareness: 0.3,
  },
  very_selective: {
    identity: 0.6,
    growth: 0.5,
    intellectual_curiosity: 0.6,
    leadership: 0.5,
    community_impact: 0.4,
    resilience: 0.4,
    creativity: 0.3,
    global_awareness: 0.2,
  },
  selective: {
    identity: 0.5,
    growth: 0.4,
    intellectual_curiosity: 0.5,
    leadership: 0.4,
    community_impact: 0.3,
    resilience: 0.3,
    creativity: 0.2,
    global_awareness: 0.2,
  },
};

/** Map theme categories to coverage dimensions */
const CATEGORY_TO_DIMENSION: Record<ThemeCategory, CoverageDimensionName[]> = {
  identity: ['identity'],
  growth: ['growth', 'resilience'],
  passion: ['intellectual_curiosity'],
  community: ['community_impact'],
  challenge: ['resilience', 'growth'],
  intellectual: ['intellectual_curiosity'],
  creative: ['creativity'],
  leadership: ['leadership'],
  service: ['community_impact', 'global_awareness'],
};

/** LLM response shape for theme extraction */
interface ThemeExtractionLLMResponse {
  primaryTheme: {
    label: string;
    category: ThemeCategory;
    evidence: string[];
    strength: number;
  };
  secondaryThemes: Array<{
    label: string;
    category: ThemeCategory;
    evidence: string[];
    strength: number;
  }>;
  qualitiesDemonstrated: string[];
}

const THEME_EXTRACTION_SYSTEM_PROMPT = `You are an expert college admissions counselor with 20+ years of experience reading thousands of application essays. Your task is to extract the core themes from a student's essay.

Analyze the essay and identify:
1. The PRIMARY theme — the central narrative thread
2. SECONDARY themes — supporting narrative threads (1-4)
3. Key qualities demonstrated by the student

For each theme, provide:
- label: A concise 2-5 word label (e.g., "Immigrant Identity", "Scientific Curiosity")
- category: One of: identity, growth, passion, community, challenge, intellectual, creative, leadership, service
- evidence: 2-3 short quotes from the essay that support this theme
- strength: How strongly this theme comes through (0.0-1.0)

For qualitiesDemonstrated, list 3-5 character qualities the essay reveals (e.g., "perseverance", "empathy", "intellectual curiosity").

Respond with valid JSON only.`;

export class PortfolioIntelligenceService {
  /**
   * Analyze a portfolio of essays for theme overlap, gaps, and coverage.
   */
  async analyzePortfolio(input: PortfolioAnalysisInput): Promise<PortfolioAnalysis> {
    const tier = input.targetTier ?? 'highly_selective';

    // Phase 1: Extract themes from each essay (parallel LLM calls)
    const { essayThemes, totalCost } = await this.extractThemes(input.essays);

    // Phase 2: Detect overlaps between essays (deterministic)
    const overlaps = this.detectOverlaps(essayThemes);

    // Phase 3: Analyze gaps and coverage (deterministic)
    const { gaps, coverage, diversityScore } = this.analyzeGaps(essayThemes, tier);

    // Build summary
    const summary = this.buildSummary(essayThemes, overlaps, gaps, diversityScore);

    return {
      essayThemes,
      overlaps,
      gaps,
      coverage,
      diversityScore,
      summary,
      totalCost,
    };
  }

  /**
   * Phase 1: Extract themes from each essay using Haiku (parallel).
   */
  private async extractThemes(
    essays: PortfolioEssay[]
  ): Promise<{ essayThemes: EssayThemeExtraction[]; totalCost: number }> {
    let totalCost = 0;

    const settled = await Promise.allSettled(
      essays.map(async (essay): Promise<{ extraction: EssayThemeExtraction; cost: number }> => {
        const response = await callClaude<ThemeExtractionLLMResponse>({
          systemPrompt: THEME_EXTRACTION_SYSTEM_PROMPT,
          userPrompt: `Analyze this ${essay.essayType} essay and extract its themes:\n\n${essay.text}`,
          model: 'claude-haiku-4-5-20251001',
          temperature: 0.3,
          maxTokens: 1500,
          useJsonMode: true,
          cacheSystemPrompt: true,
        });

        const cost = calculateCost(response.usage, 'claude-haiku-4-5-20251001');
        const content = response.content;

        return {
          extraction: {
            essayId: essay.id,
            essayType: essay.essayType,
            primaryTheme: this.normalizeTheme(content.primaryTheme),
            secondaryThemes: (content.secondaryThemes ?? []).map((t) => this.normalizeTheme(t)),
            qualitiesDemonstrated: content.qualitiesDemonstrated ?? [],
          },
          cost,
        };
      })
    );

    const results: EssayThemeExtraction[] = [];
    for (let i = 0; i < settled.length; i++) {
      const outcome = settled[i];
      if (outcome.status === 'fulfilled') {
        results.push(outcome.value.extraction);
        totalCost += outcome.value.cost;
      } else {
        console.error(`[PortfolioIntelligence] Theme extraction failed for essay ${essays[i].id}:`, outcome.reason);
        // Provide a fallback extraction so partial analysis can continue
        results.push({
          essayId: essays[i].id,
          essayType: essays[i].essayType,
          primaryTheme: { label: 'Unknown', category: 'identity', evidence: [], strength: 0 },
          secondaryThemes: [],
          qualitiesDemonstrated: [],
        });
      }
    }

    return { essayThemes: results, totalCost };
  }

  /** Normalize a theme from LLM output, clamping strength to [0,1] */
  private normalizeTheme(raw: ThemeExtractionLLMResponse['primaryTheme']): ThemeCluster {
    return {
      label: raw.label ?? 'Unknown',
      category: this.validateCategory(raw.category),
      evidence: Array.isArray(raw.evidence) ? raw.evidence.slice(0, 3) : [],
      strength: Math.max(0, Math.min(1, raw.strength ?? 0.5)),
    };
  }

  /** Validate theme category, defaulting to 'identity' for unexpected values */
  private validateCategory(cat: string): ThemeCategory {
    const valid: ThemeCategory[] = [
      'identity', 'growth', 'passion', 'community', 'challenge',
      'intellectual', 'creative', 'leadership', 'service',
    ];
    return valid.includes(cat as ThemeCategory) ? (cat as ThemeCategory) : 'identity';
  }

  /**
   * Phase 2: Detect theme overlaps between essay pairs (deterministic).
   *
   * Flags when 2+ essays share the same primary theme category or very similar labels.
   */
  private detectOverlaps(essayThemes: EssayThemeExtraction[]): ThemeOverlap[] {
    const overlaps: ThemeOverlap[] = [];

    for (let i = 0; i < essayThemes.length; i++) {
      for (let j = i + 1; j < essayThemes.length; j++) {
        const a = essayThemes[i];
        const b = essayThemes[j];

        // Check primary-primary category overlap
        if (a.primaryTheme.category === b.primaryTheme.category) {
          const labelSimilarity = this.labelSimilarity(
            a.primaryTheme.label,
            b.primaryTheme.label
          );
          const severity = labelSimilarity > 0.7 ? 'high' : labelSimilarity > 0.4 ? 'medium' : 'low';

          overlaps.push({
            essayIds: [a.essayId, b.essayId],
            overlappingTheme: `${a.primaryTheme.label} / ${b.primaryTheme.label}`,
            overlapCategory: a.primaryTheme.category,
            severity,
            suggestion: this.overlapSuggestion(a.primaryTheme.category, severity),
          });
        }

        // Check primary of A vs secondary of B
        for (const sec of b.secondaryThemes) {
          if (
            a.primaryTheme.category === sec.category &&
            sec.strength > 0.5
          ) {
            overlaps.push({
              essayIds: [a.essayId, b.essayId],
              overlappingTheme: `${a.primaryTheme.label} / ${sec.label}`,
              overlapCategory: a.primaryTheme.category,
              severity: 'low',
              suggestion: `Essay ${b.essayId} touches on ${sec.label} as a secondary theme — consider de-emphasizing it to let the primary theme of essay ${a.essayId} own this space.`,
            });
          }
        }

        // Check primary of B vs secondary of A (reverse direction)
        for (const sec of a.secondaryThemes) {
          if (
            b.primaryTheme.category === sec.category &&
            sec.strength > 0.5
          ) {
            overlaps.push({
              essayIds: [a.essayId, b.essayId],
              overlappingTheme: `${b.primaryTheme.label} / ${sec.label}`,
              overlapCategory: b.primaryTheme.category,
              severity: 'low',
              suggestion: `Essay ${a.essayId} touches on ${sec.label} as a secondary theme — consider de-emphasizing it to let the primary theme of essay ${b.essayId} own this space.`,
            });
          }
        }
      }
    }

    return overlaps;
  }

  /** Calculate label similarity using normalized word overlap (Jaccard) */
  private labelSimilarity(a: string, b: string): number {
    const wordsA = a.toLowerCase().split(/\s+/);
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = wordsA.filter((w) => wordsB.has(w)).length;
    const unionSet = new Set(wordsA);
    b.toLowerCase().split(/\s+/).forEach((w) => unionSet.add(w));
    return unionSet.size === 0 ? 0 : intersection / unionSet.size;
  }

  /** Generate differentiation suggestion based on category and severity */
  private overlapSuggestion(category: ThemeCategory, severity: string): string {
    const suggestions: Record<ThemeCategory, string> = {
      identity: 'Show different facets of identity — one essay might focus on cultural heritage while another explores a chosen identity or evolving self-perception.',
      growth: 'Differentiate the type of growth — academic maturation vs. emotional resilience vs. perspective shift. Each essay should reveal a distinct transformation.',
      passion: 'Channel passion into different domains or explore the same passion from contrasting angles (creation vs. community vs. competition).',
      community: 'Distinguish scope and role — leading a community effort vs. being changed by one, or local impact vs. broader awareness.',
      challenge: 'Vary the nature of adversity — external obstacles vs. internal struggles vs. intellectual challenges. Avoid the "overcomer" pattern in multiple essays.',
      intellectual: 'Show intellectual curiosity across domains or depths — one essay on deep exploration, another on interdisciplinary connection.',
      creative: 'Highlight different creative modes — artistic expression vs. problem-solving creativity vs. creative leadership.',
      leadership: 'Differentiate leadership styles — formal authority vs. quiet influence vs. collaborative leadership vs. mentorship.',
      service: 'Distinguish motivation and impact — direct service vs. systemic change vs. community building.',
    };

    const base = suggestions[category];
    if (severity === 'high') {
      return `HIGH PRIORITY: Both essays center on the same ${category} theme. AOs will notice the redundancy. ${base}`;
    }
    return base;
  }

  /**
   * Phase 3: Gap analysis — what dimensions does the portfolio miss?
   */
  private analyzeGaps(
    essayThemes: EssayThemeExtraction[],
    tier: string
  ): { gaps: NarrativeGap[]; coverage: CoverageDimension[]; diversityScore: number } {
    const targets = TIER_TARGETS[tier] ?? TIER_TARGETS.highly_selective;

    // Accumulate coverage per dimension
    const dimensionStrength: Record<CoverageDimensionName, { total: number; count: number }> = {} as any;
    for (const dim of COVERAGE_DIMENSIONS) {
      dimensionStrength[dim] = { total: 0, count: 0 };
    }

    for (const et of essayThemes) {
      const allThemes = [et.primaryTheme, ...et.secondaryThemes];
      for (const theme of allThemes) {
        const dims = CATEGORY_TO_DIMENSION[theme.category] ?? [];
        for (const dim of dims) {
          dimensionStrength[dim].total += theme.strength;
          dimensionStrength[dim].count += 1;
        }
      }
    }

    // Build coverage analysis
    const coverage: CoverageDimension[] = COVERAGE_DIMENSIONS.map((dim) => {
      const { total, count } = dimensionStrength[dim];
      const strength = count === 0 ? 0 : Math.min(1, total / count);
      const target = targets[dim];
      let status: CoverageDimension['status'];
      if (count === 0) status = 'missing';
      else if (strength >= target) status = 'strong';
      else if (strength >= target * 0.6) status = 'adequate';
      else status = 'weak';

      return { dimension: dim, essayCount: count, strength, target, status };
    });

    // Identify gaps
    const gaps: NarrativeGap[] = [];
    for (const cov of coverage) {
      if (cov.status === 'missing' || cov.status === 'weak') {
        gaps.push({
          dimension: cov.dimension,
          importance: this.gapImportance(cov.dimension as CoverageDimensionName, tier),
          suggestion: this.gapSuggestion(cov.dimension as CoverageDimensionName),
        });
      }
    }

    // Diversity score: percentage of dimensions at adequate+ level
    const coveredCount = coverage.filter((c) => c.status === 'strong' || c.status === 'adequate').length;
    const diversityBase = (coveredCount / COVERAGE_DIMENSIONS.length) * 100;

    // Bonus for no missing dimensions
    const hasMissing = coverage.some((c) => c.status === 'missing');
    const diversityScore = Math.min(100, Math.max(0, Math.round(diversityBase + (hasMissing ? 0 : 20))));

    return { gaps, coverage, diversityScore };
  }

  /** Determine gap importance based on dimension and tier */
  private gapImportance(
    dim: CoverageDimensionName,
    tier: string
  ): NarrativeGap['importance'] {
    const criticalDims: CoverageDimensionName[] = ['identity', 'intellectual_curiosity'];
    const importantDims: CoverageDimensionName[] = ['growth', 'leadership', 'community_impact'];

    if (tier === 'ivy_elite' || tier === 'highly_selective') {
      if (criticalDims.includes(dim)) return 'critical';
      if (importantDims.includes(dim)) return 'important';
    } else {
      if (criticalDims.includes(dim)) return 'important';
    }
    return 'nice_to_have';
  }

  /** Generate actionable suggestion for a missing dimension */
  private gapSuggestion(dim: CoverageDimensionName): string {
    const suggestions: Record<CoverageDimensionName, string> = {
      identity: 'Add an essay that reveals who you are at your core — your values, background, or the lens through which you see the world.',
      growth: 'Include an essay showing a meaningful transformation — how you changed your mind, overcame a limitation, or evolved through experience.',
      intellectual_curiosity: 'Write about a question, idea, or subject that genuinely excites you. Show your mind at work, not just your accomplishments.',
      leadership: 'Demonstrate a time you influenced or organized others — formal or informal. Focus on impact and approach, not title.',
      community_impact: 'Show how you contributed to a community. Emphasize the sustained impact and what you learned about collective effort.',
      resilience: 'Share a challenge or setback and what it taught you. Avoid the neat resolution — show the ongoing process of dealing with difficulty.',
      creativity: 'Highlight creative thinking — whether artistic, scientific, or entrepreneurial. Show how you approach problems in unconventional ways.',
      global_awareness: 'Include a perspective that shows awareness beyond your immediate environment — cross-cultural understanding, global issues, or systemic thinking.',
    };
    return suggestions[dim];
  }

  /** Build a human-readable executive summary */
  private buildSummary(
    essayThemes: EssayThemeExtraction[],
    overlaps: ThemeOverlap[],
    gaps: NarrativeGap[],
    diversityScore: number
  ): string {
    const parts: string[] = [];

    parts.push(`Portfolio of ${essayThemes.length} essays analyzed.`);
    parts.push(`Diversity score: ${diversityScore}/100.`);

    const highOverlaps = overlaps.filter((o) => o.severity === 'high');
    if (highOverlaps.length > 0) {
      parts.push(
        `Warning: ${highOverlaps.length} high-severity theme overlap(s) detected — AOs will notice redundancy.`
      );
    } else if (overlaps.length > 0) {
      parts.push(`${overlaps.length} minor theme overlap(s) found.`);
    } else {
      parts.push('No significant theme overlaps — good thematic diversity.');
    }

    const criticalGaps = gaps.filter((g) => g.importance === 'critical');
    if (criticalGaps.length > 0) {
      parts.push(
        `Critical gaps: ${criticalGaps.map((g) => g.dimension).join(', ')}. Address these to strengthen the portfolio.`
      );
    }

    const importantGaps = gaps.filter((g) => g.importance === 'important');
    if (importantGaps.length > 0) {
      parts.push(
        `Important gaps: ${importantGaps.map((g) => g.dimension).join(', ')}.`
      );
    }

    return parts.join(' ');
  }
}

export const portfolioIntelligenceService = new PortfolioIntelligenceService();
