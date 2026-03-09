/**
 * Prestige Research Service — JIT Entity Prestige Assessment
 *
 * Uses Sonnet to research the prestige/selectivity of programs, competitions,
 * and organizations not found in the static Knowledge Base (~350 entries).
 * Results are permanently cached in Supabase so each entity is only researched once.
 *
 * Architecture:
 *   1. Extract entity names from description that aren't in KB
 *   2. Check Supabase cache for each entity
 *   3. Research unknown entities via Sonnet (conservative assessment)
 *   4. Cache results permanently
 *   5. Enrich evidence.recognitions with findings
 *
 * Cost: ~$0.003-0.005 per unique entity (small prompt, small response)
 * After warm-up: most common entities cached, cost approaches $0
 */

import { callClaude } from '@/lib/llm/claude';
import { tryParseClaudeJSON } from '../../../../commonAppWorkshop/utils/jsonParser';
import { findRecognitionsInText } from './knowledge';
import type { ExtractedEvidence } from './types';
import type {
  PrestigeResearchResult,
  PrestigeResearchRequest,
  PrestigeResearchConfig,
} from './prestigeResearchTypes';

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';

const DEFAULT_CONFIG: PrestigeResearchConfig = {
  maxEntitiesPerActivity: 2,
  modelId: SONNET_MODEL,
  skipWeakSignals: true,
  enableCache: true,
};

class PrestigeResearchService {
  private config: PrestigeResearchConfig;

  constructor(config: Partial<PrestigeResearchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Research unknown entities in an activity description.
   * Returns enrichment data for entities with prestige signal (tier <= 3).
   */
  async researchUnknownEntities(
    evidence: ExtractedEvidence,
    description: string,
    category: string,
  ): Promise<PrestigeResearchResult[]> {
    // Skip weak signal activities — not enough context for meaningful research
    if (this.config.skipWeakSignals && evidence.overallSignalStrength === 'weak') {
      return [];
    }

    // Step 1: Extract entity candidates not in KB
    const candidates = this.extractUnknownEntities(evidence, description);
    if (candidates.length === 0) return [];

    // Step 2: Research each candidate (cache-first)
    const results: PrestigeResearchResult[] = [];
    for (const candidate of candidates.slice(0, this.config.maxEntitiesPerActivity)) {
      try {
        // Check cache first
        const cached = await this.checkCache(candidate.entityName);
        if (cached) {
          results.push(cached);
          continue;
        }

        // Research via Sonnet
        const result = await this.researchEntity({
          entityName: candidate.entityName,
          context: description,
          category,
        });

        if (result) {
          results.push(result);
          // Cache permanently (fire-and-forget)
          this.writeCache(result).catch(err =>
            console.warn('[PrestigeResearch] Cache write failed:', err)
          );
        }
      } catch (err) {
        console.warn(`[PrestigeResearch] Failed to research "${candidate.entityName}":`, err);
      }
    }

    return results;
  }

  /**
   * Extract entity names from evidence that aren't in the KB.
   * Uses recognitions from extraction + proper noun detection from description.
   */
  extractUnknownEntities(
    evidence: ExtractedEvidence,
    description: string,
  ): Array<{ entityName: string; source: 'recognition' | 'description' }> {
    const kbMatches = findRecognitionsInText(description);
    const kbNames = new Set(kbMatches.map(m => m.entry.name.toLowerCase()));

    const candidates: Array<{ entityName: string; source: 'recognition' | 'description' }> = [];
    const seen = new Set<string>();

    // Check extracted recognitions — any not in KB are candidates
    for (const rec of evidence.recognitions) {
      const normalized = rec.name.toLowerCase().trim();
      if (normalized && !kbNames.has(normalized) && !seen.has(normalized)) {
        // Only research if the name looks substantial (>= 3 chars, not generic)
        if (normalized.length >= 3 && !isGenericTerm(normalized)) {
          seen.add(normalized);
          candidates.push({ entityName: rec.name, source: 'recognition' });
        }
      }
    }

    // Also detect capitalized proper nouns in description that might be program names
    // Pattern: 2+ consecutive capitalized words (e.g., "Summer Science Program", "PROMYS")
    const properNounPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+|[A-Z]{2,}[A-Z0-9]*)\b/g;
    let match: RegExpExecArray | null;
    while ((match = properNounPattern.exec(description)) !== null) {
      const name = match[1].trim();
      const normalized = name.toLowerCase();
      if (
        normalized.length >= 4 &&
        !kbNames.has(normalized) &&
        !seen.has(normalized) &&
        !isGenericTerm(normalized)
      ) {
        seen.add(normalized);
        candidates.push({ entityName: name, source: 'description' });
      }
    }

    return candidates;
  }

  /**
   * Check Supabase cache for a previously researched entity.
   */
  private async checkCache(entityName: string): Promise<PrestigeResearchResult | null> {
    if (!this.config.enableCache) return null;

    try {
      const { supabaseAdmin } = await this.getSupabaseAdmin();
      const normalized = entityName.toLowerCase().trim();

      const { data, error } = await supabaseAdmin
        .from('prestige_research_cache')
        .select('research_result, model_version')
        .eq('entity_name_normalized', normalized)
        .single();

      if (error || !data) return null;

      // Only use cache if model version matches (invalidate on model upgrade)
      const row = data as unknown as { research_result: PrestigeResearchResult; model_version: string };
      if (row.model_version !== this.config.modelId) return null;

      return row.research_result;
    } catch {
      return null;
    }
  }

  /**
   * Write research result to Supabase cache for permanent reuse.
   */
  private async writeCache(result: PrestigeResearchResult): Promise<void> {
    if (!this.config.enableCache) return;

    try {
      const { supabaseAdmin } = await this.getSupabaseAdmin();
      const normalized = result.entityName.toLowerCase().trim();

      await supabaseAdmin
        .from('prestige_research_cache')
        .upsert({
          entity_name_normalized: normalized,
          research_result: result,
          model_version: result.modelVersion,
        }, {
          onConflict: 'entity_name_normalized',
        });
    } catch (err) {
      console.warn('[PrestigeResearch] Cache write error:', err);
    }
  }

  /**
   * Research a single entity via Sonnet.
   */
  private async researchEntity(
    request: PrestigeResearchRequest
  ): Promise<PrestigeResearchResult | null> {
    const systemPrompt = `You evaluate the prestige and selectivity of programs, competitions, organizations, and awards mentioned in college application activity descriptions. You are conservative — if unsure about an entity, rate it as tier 4 with low confidence. Overrating prestige is worse than underrating it.`;

    const userPrompt = `Evaluate the prestige and selectivity of this entity:

Entity: "${request.entityName}"
Activity context: "${request.context.slice(0, 300)}"
Activity category: "${request.category}"

Based on your knowledge, assess:
1. Entity type (program/competition/organization/institution/award/unknown)
2. Selectivity tier:
   - Tier 1: Extremely selective, nationally/internationally elite (<2% acceptance or equivalent prestige)
   - Tier 2: Highly selective, strong national recognition (2-15% acceptance or equivalent)
   - Tier 3: Moderately selective or well-known regional (15-40% acceptance or equivalent)
   - Tier 4: Open admission, local, or unknown
3. Scope (international/national/state/regional/local/school)
4. Approximate acceptance rate if known (as string like "~5%" or null)
5. Notable factors (array of strings)
6. Is this a real, verifiable entity? (boolean)

IMPORTANT: If you are NOT confident about this entity, set confidence to "low" and selectivityTier to 4. Do NOT guess or inflate prestige.

Respond in JSON:
{
  "entityType": "<type>",
  "selectivityTier": <1-4>,
  "confidence": "<high|medium|low>",
  "reasoning": "<1-2 sentence explanation>",
  "scope": "<scope>",
  "acceptanceRate": "<rate or null>",
  "notableFactors": ["<factor>"],
  "isVerifiable": <boolean>
}`;

    try {
      const response = await callClaude(userPrompt, {
        model: this.config.modelId,
        systemPrompt,
        maxTokens: 512,
      });

      if (!response.content) {
        console.warn('[PrestigeResearch] Empty Sonnet response');
        return null;
      }

      const parsed = tryParseClaudeJSON<Record<string, unknown>>(
        typeof response.content === 'string' ? response.content : String(response.content)
      );
      if (!parsed) {
        console.warn('[PrestigeResearch] Failed to parse Sonnet response');
        return null;
      }

      // Validate and construct result
      const validTiers = [1, 2, 3, 4] as const;
      const tier = validTiers.includes(parsed.selectivityTier as 1 | 2 | 3 | 4)
        ? (parsed.selectivityTier as 1 | 2 | 3 | 4)
        : 4;

      const validConfidences = ['high', 'medium', 'low'] as const;
      const confidence = validConfidences.includes(parsed.confidence as 'high' | 'medium' | 'low')
        ? (parsed.confidence as 'high' | 'medium' | 'low')
        : 'low';

      const validScopes = ['international', 'national', 'state', 'regional', 'local', 'school'] as const;
      const scope = validScopes.includes(parsed.scope as typeof validScopes[number])
        ? (parsed.scope as typeof validScopes[number])
        : 'local';

      const validTypes = ['program', 'competition', 'organization', 'institution', 'award', 'unknown'] as const;
      const entityType = validTypes.includes(parsed.entityType as typeof validTypes[number])
        ? (parsed.entityType as typeof validTypes[number])
        : 'unknown';

      return {
        entityName: request.entityName,
        entityType,
        selectivityTier: tier,
        confidence,
        reasoning: String(parsed.reasoning ?? ''),
        scope,
        acceptanceRate: parsed.acceptanceRate != null ? String(parsed.acceptanceRate) : null,
        notableFactors: Array.isArray(parsed.notableFactors)
          ? parsed.notableFactors.map(String)
          : [],
        isVerifiable: Boolean(parsed.isVerifiable ?? false),
        researchedAt: new Date().toISOString(),
        modelVersion: this.config.modelId,
      };
    } catch (err) {
      console.warn('[PrestigeResearch] Research failed:', err);
      return null;
    }
  }

  private async getSupabaseAdmin(): Promise<{ supabaseAdmin: import('@supabase/supabase-js').SupabaseClient }> {
    const { supabaseAdmin } = await import('@/supabase/admin');
    return { supabaseAdmin };
  }
}

/**
 * Enrich evidence recognitions with prestige research results.
 * Adds research results with tier <= 3 as new recognition entries.
 */
export function enrichEvidenceWithPrestige(
  evidence: ExtractedEvidence,
  results: PrestigeResearchResult[]
): void {
  for (const result of results) {
    if (result.selectivityTier > 3) continue; // Only enrich with notable entities
    if (result.confidence === 'low' && result.selectivityTier > 2) continue; // Skip low-confidence tier 3

    // Map selectivity tier to recognition level
    const level: ExtractedEvidence['recognitions'][0]['level'] =
      result.selectivityTier === 1
        ? (result.scope === 'international' ? 'international' : 'national')
        : result.selectivityTier === 2
          ? 'national'
          : 'regional';

    // Avoid duplicate recognitions
    const alreadyExists = evidence.recognitions.some(
      r => r.name.toLowerCase() === result.entityName.toLowerCase()
    );
    if (alreadyExists) continue;

    evidence.recognitions.push({
      name: result.entityName,
      level,
      isVerifiable: result.isVerifiable,
      selectivityContext: result.acceptanceRate
        ? `${result.acceptanceRate} acceptance rate — ${result.reasoning}`
        : result.reasoning,
    });
  }
}

/** Check if a term is too generic to be a meaningful entity name */
function isGenericTerm(normalized: string): boolean {
  const generic = new Set([
    'the', 'and', 'for', 'with', 'from', 'this', 'that',
    'club', 'team', 'group', 'class', 'school', 'program',
    'community', 'service', 'project', 'event', 'volunteer',
    'leadership', 'member', 'president', 'captain', 'founder',
    'national', 'state', 'local', 'regional', 'international',
    'high school', 'middle school', 'elementary',
  ]);
  return generic.has(normalized);
}

// Export singleton
export const prestigeResearchService = new PrestigeResearchService();
