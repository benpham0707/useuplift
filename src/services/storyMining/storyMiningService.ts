/**
 * Story Mining Service
 * Phase 3 — 3-pass pipeline that extracts narrative moments from student
 * activity profiles and ranks them by prompt fit.
 *
 * Pass 1 (Haiku): Extract concrete moments from activities
 * Pass 2 (Haiku): Cluster, score distinctiveness + reflection depth
 * Pass 3 (Sonnet): Rank seeds per prompt, generate narrative angles
 *
 * Additional methods:
 * - deepenSeed: Expand a seed with sensory/temporal detail (Sonnet)
 * - rankForPrompt: Re-rank existing seeds for a specific prompt (Haiku)
 */

import crypto from 'crypto';
import { callClaude, calculateCost, type ClaudeResponse } from '../../lib/llm/claude';
import type { EmotionalRegister } from '../commonAppWorkshop/types/stage0Types';
import type {
  StorySeed,
  StoryMiningResult,
  StoryMiningActivity,
  TargetPrompt,
  StoryMiningInput,
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const SONNET_MODEL = 'claude-sonnet-4-5-20250929';

const VALID_REGISTERS: EmotionalRegister[] = [
  'energetic_enthusiasm',
  'quiet_intensity',
  'melancholy_loss',
  'defiant_irreverent',
  'wonder_curiosity',
  'warmth_connection',
];

// ============================================================================
// INTERNAL TYPES (LLM response shapes)
// ============================================================================

interface RawMoment {
  activityIds: string[];
  moment: string;
  whatHappened: string;
  whatStudentFelt: string;
  whatWasAtStake: string;
  relevantQuotes: string[];
}

interface ClusteredMoment {
  moment: string;
  activityIds: string[];
  whatHappened: string;
  whatStudentFelt: string;
  whatWasAtStake: string;
  relevantQuotes: string[];
  cluster: string;
  distinctivenessScore: number;
  distinctivenessReasoning: string;
  uniqueElements: string[];
  reflectionDepthScore: number;
  possibleInsights: string[];
  suggestedRegister: string;
  emotionalCore: string;
}

interface ClusterGroup {
  theme: string;
  moments: ClusteredMoment[];
  clusterStrength: number;
}

interface RankedSeedForPrompt {
  momentIndex: number;
  fitScore: number;
  fitReasoning: string;
  narrativeAngles: string[];
}

interface Pass3PromptRanking {
  promptId: string;
  topSeeds: RankedSeedForPrompt[];
}

interface Pass3Result {
  rankings: Pass3PromptRanking[];
}

// ============================================================================
// TOKEN TRACKING
// ============================================================================

interface TokenAccumulator {
  input: number;
  output: number;
  cost: number;
}

function accumulateTokens(acc: TokenAccumulator, response: ClaudeResponse): void {
  acc.input += response.usage.input_tokens;
  acc.output += response.usage.output_tokens;
  acc.cost += calculateCost(response.usage);
}

// ============================================================================
// SAFE JSON PARSING
// ============================================================================

function safeParseJSON<T>(text: string, fallback: T): T {
  try {
    let jsonString = text.trim();

    // Try extracting from code blocks
    const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
    }

    // Try finding JSON array
    const firstBracket = jsonString.indexOf('[');
    const lastBracket = jsonString.lastIndexOf(']');
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');

    // Determine whether it's an array or object
    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      if (lastBracket > firstBracket) {
        jsonString = jsonString.substring(firstBracket, lastBracket + 1);
      }
    } else if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(jsonString) as T;
  } catch {
    console.warn('[StoryMining] Failed to parse JSON response, using fallback');
    return fallback;
  }
}

function validateRegister(value: string): EmotionalRegister {
  if (VALID_REGISTERS.includes(value as EmotionalRegister)) {
    return value as EmotionalRegister;
  }
  // Attempt normalization: lowercase, replace spaces/hyphens with underscores
  const normalized = value.toLowerCase().replace(/[\s-]+/g, '_');
  if (VALID_REGISTERS.includes(normalized as EmotionalRegister)) {
    return normalized as EmotionalRegister;
  }
  return 'wonder_curiosity'; // Safe default
}

// ============================================================================
// PROMPTS
// ============================================================================

const SYSTEM_PROMPT = `You are an expert college admissions essay strategist. You specialize in discovering compelling, authentic story seeds from student activities. You understand that the best essays come from specific MOMENTS — not summaries — and you have a gift for identifying the instants that reveal character, growth, and genuine passion.

Always respond with valid JSON. No markdown, no explanation outside the JSON structure.`;

function buildPass1Prompt(activities: StoryMiningActivity[]): string {
  const activityList = activities.map((a, i) => (
    `Activity ${i + 1} [ID: ${a.id}]:
  Name: ${a.name}
  Role: ${a.role}
  Category: ${a.category}
  Description: ${a.description}
  ${a.hoursPerWeek ? `Hours/week: ${a.hoursPerWeek}` : ''}
  ${a.weeksPerYear ? `Weeks/year: ${a.weeksPerYear}` : ''}
  ${a.yearsActive ? `Years active: ${a.yearsActive}` : ''}
  ${a.achievements ? `Achievements: ${a.achievements}` : ''}`
  )).join('\n\n');

  return `Extract 8-12 specific MOMENTS (not summaries) from these activities. A moment is a concrete instant: a decision, a conflict, an emotion, a surprise, a failure, a realization.

Each moment must have:
- The specific instant (what happened in that exact moment)
- What happened (the context and action)
- What the student felt (the emotional reality)
- What was at stake (why it mattered)
- Relevant quotes (actual phrases from the activity descriptions that relate to this moment — use the student's own words)

ACTIVITIES:
${activityList}

Respond with a JSON array of objects:
[
  {
    "activityIds": ["<id of activity/activities this moment draws from>"],
    "moment": "<the specific instant in 1-2 sentences>",
    "whatHappened": "<context and action>",
    "whatStudentFelt": "<emotional reality>",
    "whatWasAtStake": "<why it mattered>",
    "relevantQuotes": ["<actual phrases from descriptions>"]
  }
]

Extract 8-12 moments. Prioritize moments that are SPECIFIC and CONCRETE over general themes. Look for hidden moments embedded in descriptions — the turning points, the failures, the surprises, the decisions that could have gone differently.`;
}

function buildPass2Prompt(moments: RawMoment[]): string {
  const momentList = moments.map((m, i) => (
    `Moment ${i + 1}:
  Instant: ${m.moment}
  What happened: ${m.whatHappened}
  Feeling: ${m.whatStudentFelt}
  Stakes: ${m.whatWasAtStake}
  Source activities: ${m.activityIds.join(', ')}
  Quotes: ${m.relevantQuotes.join(' | ')}`
  )).join('\n\n');

  return `Group these moments by theme and score each one.

MOMENTS:
${momentList}

For EACH moment, provide:
1. A theme/cluster name (group related moments together)
2. Distinctiveness score 1-10: How unique is this to THIS specific student vs. any student?
3. Distinctiveness reasoning: Why this score?
4. Unique elements: What specific details only THIS student would have?
5. Reflection depth score 1-10: How much insight potential does this moment have?
6. Possible insights: What could the student discover by reflecting on this moment?
7. Suggested emotional register (one of: energetic_enthusiasm, quiet_intensity, melancholy_loss, defiant_irreverent, wonder_curiosity, warmth_connection)
8. Emotional core: The feeling at the heart of this moment in one phrase

CRITICAL SCORING RULES:
- Scores MUST range from 2-9. Giving all moments a 6-7 is NOT acceptable.
- At least one distinctiveness score must be ≤4 (something common to many students).
- At least one distinctiveness score must be ≥8 (something truly unique).
- At least one reflection depth score must be ≤4 and at least one must be ≥8.
- JUSTIFY every score — a 3 should explain why it's common, an 8 should explain why it's rare.

Also group moments into clusters and rate each cluster's strength (1-10).

Respond with JSON:
{
  "clusters": [
    {
      "theme": "<cluster theme name>",
      "moments": [
        {
          "moment": "<the specific instant>",
          "activityIds": ["<ids>"],
          "whatHappened": "<context>",
          "whatStudentFelt": "<feeling>",
          "whatWasAtStake": "<stakes>",
          "relevantQuotes": ["<quotes>"],
          "cluster": "<theme name>",
          "distinctivenessScore": <2-9>,
          "distinctivenessReasoning": "<why this score>",
          "uniqueElements": ["<specific unique details>"],
          "reflectionDepthScore": <2-9>,
          "possibleInsights": ["<what student could discover>"],
          "suggestedRegister": "<emotional_register>",
          "emotionalCore": "<feeling in one phrase>"
        }
      ],
      "clusterStrength": <1-10>
    }
  ]
}`;
}

function buildPass3Prompt(
  clusters: ClusterGroup[],
  targetPrompts: TargetPrompt[]
): string {
  // Flatten all moments with indices for reference
  const allMoments: ClusteredMoment[] = [];
  for (const cluster of clusters) {
    for (const moment of cluster.moments) {
      allMoments.push(moment);
    }
  }

  const momentList = allMoments.map((m, i) => (
    `Seed ${i} [Cluster: ${m.cluster}]:
  Moment: ${m.moment}
  Emotional core: ${m.emotionalCore}
  Distinctiveness: ${m.distinctivenessScore}/10 — ${m.distinctivenessReasoning}
  Reflection depth: ${m.reflectionDepthScore}/10
  Register: ${m.suggestedRegister}
  Unique elements: ${m.uniqueElements.join(', ')}`
  )).join('\n\n');

  const promptList = targetPrompts.map(p => (
    `Prompt [ID: ${p.id}]: "${p.promptText}"`
  )).join('\n');

  return `For each target essay prompt, rank the top 3 story seeds by fit. For each top seed, suggest 2 genuinely different narrative angles (different ways to frame this story for this prompt). Explain why this seed fits this prompt specifically.

IMPORTANT: The top-ranked seed MUST differ across prompts. If seed 0 is #1 for prompt A, a DIFFERENT seed must be #1 for prompt B. Each prompt calls for different qualities — match accordingly.

STORY SEEDS:
${momentList}

TARGET PROMPTS:
${promptList}

For each prompt, rank top 3 seeds and for each:
- fitScore (1-10): How well does this seed match THIS specific prompt?
- fitReasoning: Why does this seed work for THIS prompt (not just in general)?
- narrativeAngles: 2 genuinely different approaches to framing this seed for this prompt. Each angle should suggest a different opening, structure, or thematic lens.

Respond with JSON:
{
  "rankings": [
    {
      "promptId": "<prompt id>",
      "topSeeds": [
        {
          "momentIndex": <index from seed list above>,
          "fitScore": <1-10>,
          "fitReasoning": "<why this seed fits THIS prompt>",
          "narrativeAngles": [
            "<angle 1: a specific narrative approach>",
            "<angle 2: a genuinely different approach>"
          ]
        }
      ]
    }
  ]
}`;
}

function buildDeepenSeedPrompt(seed: StorySeed): string {
  return `You are helping a student develop a story seed into a richer narrative foundation. This seed has been identified as having strong potential. Your job is to ask probing questions and then ANSWER them with plausible, evocative details that deepen the moment.

STORY SEED:
Moment: ${seed.moment}
Emotional core: ${seed.emotionalCore}
Source quotes: ${seed.seedQuotes.join(' | ')}
Current narrative angles: ${seed.narrativeAngles.join(' | ')}
Register: ${seed.suggestedRegister}

Deepen this seed by exploring:
1. What happened in the 5 minutes BEFORE this moment? Set the scene — what was the student doing, thinking, expecting?
2. What happened in the 5 minutes AFTER? What was the immediate aftermath — physical sensations, first thoughts, what they noticed?
3. Sensory details: What were they wearing? What did they hear? What did the room/space look/smell/feel like?
4. The micro-decisions: What small choice did the student make in this moment that reveals character?
5. What they DIDN'T do: What was the obvious/easy path they rejected?

Respond with JSON:
{
  "deepenedMoment": "<the moment, now richer with before/after/sensory detail — 3-5 sentences>",
  "enrichedEmotionalCore": "<deeper emotional truth uncovered>",
  "sensoryDetails": ["<specific sensory detail 1>", "<detail 2>", "<detail 3>"],
  "microDecisions": ["<small revealing choice 1>", "<choice 2>"],
  "beforeMoment": "<what happened in the 5 min before>",
  "afterMoment": "<what happened in the 5 min after>",
  "additionalNarrativeAngles": ["<new angle based on deeper understanding>"],
  "newSeedQuotes": ["<phrases that could open the essay>"],
  "additionalUniqueElements": ["<newly discovered unique details>"],
  "additionalInsights": ["<deeper possible reflections>"]
}`;
}

function buildRankForPromptPrompt(seeds: StorySeed[], promptText: string): string {
  const seedList = seeds.map((s, i) => (
    `Seed ${i} [ID: ${s.id}]:
  Moment: ${s.moment}
  Emotional core: ${s.emotionalCore}
  Distinctiveness: ${s.distinctiveness.score}/10
  Reflection depth: ${s.reflectionDepth.score}/10
  Register: ${s.suggestedRegister}
  Angles: ${s.narrativeAngles.join(' | ')}`
  )).join('\n\n');

  return `Re-rank these story seeds for a specific essay prompt. The best seed for this prompt may NOT be the one with the highest general scores — it should be the one whose specific moment, emotional core, and register best match what this prompt is asking for.

ESSAY PROMPT: "${promptText}"

STORY SEEDS:
${seedList}

For EACH seed, score its fit for this specific prompt (1-10) and explain why. Then sort by fit score descending.

Respond with JSON:
{
  "rankedSeeds": [
    {
      "seedIndex": <index from list above>,
      "seedId": "<the seed's ID>",
      "fitScore": <1-10>,
      "fitReasoning": "<why this seed does or doesn't fit this prompt>"
    }
  ]
}`;
}

// ============================================================================
// SERVICE
// ============================================================================

export class StoryMiningService {
  /**
   * Mine stories from student activities using a 3-pass pipeline.
   *
   * Pass 1 (Haiku): Extract 8-12 concrete moments
   * Pass 2 (Haiku): Cluster + score distinctiveness and reflection depth
   * Pass 3 (Sonnet): Rank seeds per prompt, generate narrative angles
   */
  async mineStories(input: StoryMiningInput): Promise<StoryMiningResult> {
    const sessionId = crypto.randomUUID();
    const tokens: TokenAccumulator = { input: 0, output: 0, cost: 0 };

    // Provide default prompts if none specified
    const targetPrompts: TargetPrompt[] = input.targetPrompts && input.targetPrompts.length > 0
      ? input.targetPrompts
      : [
          { id: 'common-app-1', promptText: 'Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story.' },
          { id: 'common-app-2', promptText: 'The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?' },
          { id: 'common-app-5', promptText: 'Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.' },
        ];

    // ---- PASS 1: Extract moments (Haiku) ----
    const pass1Response = await callClaude<string>({
      model: HAIKU_MODEL,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildPass1Prompt(input.activities),
      maxTokens: 4096,
      temperature: 0.7,
      useJsonMode: true,
      cacheSystemPrompt: true,
    });
    accumulateTokens(tokens, pass1Response);

    const rawMoments = safeParseJSON<RawMoment[]>(
      typeof pass1Response.content === 'string' ? pass1Response.content : JSON.stringify(pass1Response.content),
      []
    );

    if (rawMoments.length === 0) {
      throw new Error('[StoryMining] Pass 1 failed: no moments extracted');
    }

    // Validate activityIds reference actual activities
    const validActivityIds = new Set(input.activities.map(a => a.id));
    for (const moment of rawMoments) {
      moment.activityIds = moment.activityIds.filter(id => validActivityIds.has(id));
      if (moment.activityIds.length === 0) {
        // Assign to first activity as fallback
        moment.activityIds = [input.activities[0].id];
      }
      // Ensure relevantQuotes is always an array
      if (!Array.isArray(moment.relevantQuotes)) {
        moment.relevantQuotes = [];
      }
    }

    // ---- PASS 2: Cluster + score (Haiku) ----
    const pass2Response = await callClaude<string>({
      model: HAIKU_MODEL,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildPass2Prompt(rawMoments),
      maxTokens: 6144,
      temperature: 0.5,
      useJsonMode: true,
      cacheSystemPrompt: true,
    });
    accumulateTokens(tokens, pass2Response);

    const pass2Data = safeParseJSON<{ clusters: ClusterGroup[] }>(
      typeof pass2Response.content === 'string' ? pass2Response.content : JSON.stringify(pass2Response.content),
      { clusters: [] }
    );

    if (pass2Data.clusters.length === 0) {
      throw new Error('[StoryMining] Pass 2 failed: no clusters generated');
    }

    // Flatten all clustered moments for pass 3
    const allClusteredMoments: ClusteredMoment[] = [];
    for (const cluster of pass2Data.clusters) {
      for (const moment of cluster.moments) {
        allClusteredMoments.push(moment);
      }
    }

    // ---- PASS 3: Rank + narrative angles (Sonnet) ----
    const pass3Response = await callClaude<string>({
      model: SONNET_MODEL,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildPass3Prompt(pass2Data.clusters, targetPrompts),
      maxTokens: 6144,
      temperature: 0.7,
      useJsonMode: true,
      cacheSystemPrompt: true,
    });
    accumulateTokens(tokens, pass3Response);

    const pass3Data = safeParseJSON<Pass3Result>(
      typeof pass3Response.content === 'string' ? pass3Response.content : JSON.stringify(pass3Response.content),
      { rankings: [] }
    );

    // ---- ASSEMBLE SEEDS ----
    // Build a map: momentIndex -> best prompt fits + narrative angles
    const momentPromptFits = new Map<number, { promptId: string; fitScore: number; fitReasoning: string; narrativeAngles: string[] }[]>();
    const momentBestAngles = new Map<number, string[]>();

    for (const ranking of pass3Data.rankings) {
      for (const topSeed of ranking.topSeeds) {
        const idx = topSeed.momentIndex;
        if (!momentPromptFits.has(idx)) {
          momentPromptFits.set(idx, []);
        }
        momentPromptFits.get(idx)!.push({
          promptId: ranking.promptId,
          fitScore: topSeed.fitScore,
          fitReasoning: topSeed.fitReasoning,
          narrativeAngles: topSeed.narrativeAngles || [],
        });

        // Collect all narrative angles for this moment
        if (!momentBestAngles.has(idx)) {
          momentBestAngles.set(idx, []);
        }
        for (const angle of (topSeed.narrativeAngles || [])) {
          if (!momentBestAngles.get(idx)!.includes(angle)) {
            momentBestAngles.get(idx)!.push(angle);
          }
        }
      }
    }

    // Create StorySeed for each clustered moment
    const seeds: StorySeed[] = allClusteredMoments.map((cm, idx) => {
      const promptFits = momentPromptFits.get(idx) || [];
      const angles = momentBestAngles.get(idx) || [];

      // Extract seed quotes from relevant quotes, falling back to description fragments
      const seedQuotes = this.extractSeedQuotes(cm, input.activities);

      // Ensure at least 2 narrative angles
      const narrativeAngles = angles.length >= 2
        ? angles
        : [
            ...angles,
            ...this.generateFallbackAngles(cm, 2 - angles.length),
          ];

      return {
        id: crypto.randomUUID(),
        moment: cm.moment,
        sourceActivityIds: cm.activityIds,
        emotionalCore: cm.emotionalCore || cm.whatStudentFelt,
        distinctiveness: {
          score: this.clampScore(cm.distinctivenessScore),
          reasoning: cm.distinctivenessReasoning || 'Score based on moment analysis',
          uniqueElements: cm.uniqueElements || [],
        },
        reflectionDepth: {
          score: this.clampScore(cm.reflectionDepthScore),
          possibleInsights: cm.possibleInsights || [],
        },
        promptFit: promptFits.map(pf => ({
          promptId: pf.promptId,
          fitScore: this.clampScore(pf.fitScore),
          fitReasoning: pf.fitReasoning,
        })),
        narrativeAngles,
        suggestedRegister: validateRegister(cm.suggestedRegister || 'wonder_curiosity'),
        seedQuotes,
      };
    });

    // ---- BUILD CLUSTERS ----
    const clusterMap = new Map<string, { seedIds: string[]; strength: number }>();
    for (let i = 0; i < allClusteredMoments.length; i++) {
      const cm = allClusteredMoments[i];
      const theme = cm.cluster || 'uncategorized';
      if (!clusterMap.has(theme)) {
        const matchingCluster = pass2Data.clusters.find(c => c.theme === theme);
        clusterMap.set(theme, {
          seedIds: [],
          strength: matchingCluster?.clusterStrength ?? 5,
        });
      }
      clusterMap.get(theme)!.seedIds.push(seeds[i].id);
    }

    const clusters = Array.from(clusterMap.entries()).map(([theme, data]) => ({
      theme,
      seedIds: data.seedIds,
      clusterStrength: data.strength,
    }));

    // ---- TOP RECOMMENDATIONS ----
    // For each prompt, pick the top-ranked seed
    const topRecommendations: StoryMiningResult['topRecommendations'] = [];
    const usedSeedIds = new Set<string>();

    for (const ranking of pass3Data.rankings) {
      const sortedTopSeeds = [...ranking.topSeeds].sort((a, b) => b.fitScore - a.fitScore);

      // Find the best seed not already recommended for another prompt
      let chosen = sortedTopSeeds[0];
      for (const candidate of sortedTopSeeds) {
        const seedIdx = candidate.momentIndex;
        if (seedIdx >= 0 && seedIdx < seeds.length && !usedSeedIds.has(seeds[seedIdx].id)) {
          chosen = candidate;
          break;
        }
      }

      if (chosen && chosen.momentIndex >= 0 && chosen.momentIndex < seeds.length) {
        const seedId = seeds[chosen.momentIndex].id;
        usedSeedIds.add(seedId);
        topRecommendations.push({
          promptId: ranking.promptId,
          recommendedSeedId: seedId,
          reasoning: chosen.fitReasoning,
        });
      }
    }

    return {
      sessionId,
      userId: input.userId,
      seeds,
      clusters,
      topRecommendations,
      metadata: {
        generatedAt: new Date().toISOString(),
        modelUsed: `${HAIKU_MODEL} (passes 1-2), ${SONNET_MODEL} (pass 3)`,
        tokensUsed: { input: tokens.input, output: tokens.output },
        cost: tokens.cost,
      },
    };
  }

  /**
   * Deepen a specific seed with sensory/temporal detail.
   * Uses Sonnet for high-quality narrative expansion.
   */
  async deepenSeed(seedId: string, seed: StorySeed): Promise<StorySeed> {
    const response = await callClaude<string>({
      model: SONNET_MODEL,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildDeepenSeedPrompt(seed),
      maxTokens: 4096,
      temperature: 0.7,
      useJsonMode: true,
      cacheSystemPrompt: true,
    });

    interface DeepenResult {
      deepenedMoment: string;
      enrichedEmotionalCore: string;
      sensoryDetails: string[];
      microDecisions: string[];
      beforeMoment: string;
      afterMoment: string;
      additionalNarrativeAngles: string[];
      newSeedQuotes: string[];
      additionalUniqueElements: string[];
      additionalInsights: string[];
    }

    const data = safeParseJSON<DeepenResult>(
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
      {
        deepenedMoment: seed.moment,
        enrichedEmotionalCore: seed.emotionalCore,
        sensoryDetails: [],
        microDecisions: [],
        beforeMoment: '',
        afterMoment: '',
        additionalNarrativeAngles: [],
        newSeedQuotes: [],
        additionalUniqueElements: [],
        additionalInsights: [],
      }
    );

    // Merge deepened data into the seed
    return {
      ...seed,
      id: seedId,
      moment: data.deepenedMoment || seed.moment,
      emotionalCore: data.enrichedEmotionalCore || seed.emotionalCore,
      distinctiveness: {
        ...seed.distinctiveness,
        uniqueElements: [
          ...seed.distinctiveness.uniqueElements,
          ...data.additionalUniqueElements,
          ...data.sensoryDetails,
          ...data.microDecisions,
        ],
      },
      reflectionDepth: {
        ...seed.reflectionDepth,
        possibleInsights: [
          ...seed.reflectionDepth.possibleInsights,
          ...data.additionalInsights,
        ],
      },
      narrativeAngles: [
        ...seed.narrativeAngles,
        ...data.additionalNarrativeAngles,
      ],
      seedQuotes: [
        ...seed.seedQuotes,
        ...data.newSeedQuotes,
      ],
    };
  }

  /**
   * Re-rank existing seeds for a specific prompt.
   * Uses Haiku for fast re-ranking.
   * Returns seeds sorted by fit for this prompt.
   */
  async rankForPrompt(seeds: StorySeed[], promptText: string): Promise<StorySeed[]> {
    if (seeds.length === 0) return [];

    const response = await callClaude<string>({
      model: HAIKU_MODEL,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildRankForPromptPrompt(seeds, promptText),
      maxTokens: 4096,
      temperature: 0.3,
      useJsonMode: true,
      cacheSystemPrompt: true,
    });

    interface RankResult {
      rankedSeeds: {
        seedIndex: number;
        seedId: string;
        fitScore: number;
        fitReasoning: string;
      }[];
    }

    const data = safeParseJSON<RankResult>(
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
      { rankedSeeds: [] }
    );

    if (data.rankedSeeds.length === 0) {
      // Return original order if ranking failed
      return seeds;
    }

    // Sort by fitScore descending and map back to seeds
    const sorted = [...data.rankedSeeds].sort((a, b) => b.fitScore - a.fitScore);

    const rankedSeeds: StorySeed[] = [];
    const usedIndices = new Set<number>();

    for (const ranked of sorted) {
      const idx = ranked.seedIndex;
      if (idx >= 0 && idx < seeds.length && !usedIndices.has(idx)) {
        usedIndices.add(idx);

        // Update promptFit with the new ranking
        const updatedSeed: StorySeed = {
          ...seeds[idx],
          promptFit: [
            // Keep existing fits for other prompts
            ...seeds[idx].promptFit.filter(pf => pf.fitReasoning !== ranked.fitReasoning),
            {
              promptId: 'custom',
              fitScore: this.clampScore(ranked.fitScore),
              fitReasoning: ranked.fitReasoning,
            },
          ],
        };
        rankedSeeds.push(updatedSeed);
      }
    }

    // Append any seeds not included in the ranking
    for (let i = 0; i < seeds.length; i++) {
      if (!usedIndices.has(i)) {
        rankedSeeds.push(seeds[i]);
      }
    }

    return rankedSeeds;
  }

  // ---------- PRIVATE HELPERS ----------

  /**
   * Extract seed quotes from clustered moment data and original activity descriptions.
   * Quotes must be actual phrases from the student's activity descriptions.
   */
  private extractSeedQuotes(
    moment: ClusteredMoment,
    activities: StoryMiningActivity[]
  ): string[] {
    const quotes: string[] = [];

    // Use relevantQuotes from extraction pass
    if (moment.relevantQuotes && moment.relevantQuotes.length > 0) {
      quotes.push(...moment.relevantQuotes);
    }

    // If we still need quotes, pull phrases from source activity descriptions
    if (quotes.length === 0) {
      for (const actId of moment.activityIds) {
        const activity = activities.find(a => a.id === actId);
        if (activity) {
          // Extract meaningful phrases (sentences or substantial fragments)
          const sentences = activity.description
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length >= 15 && s.length <= 200);

          if (sentences.length > 0) {
            // Pick up to 2 sentences that seem most relevant
            quotes.push(...sentences.slice(0, 2));
          }
        }
      }
    }

    // Ensure at least one quote
    if (quotes.length === 0) {
      quotes.push(moment.moment);
    }

    return quotes;
  }

  /**
   * Generate fallback narrative angles when LLM didn't provide enough.
   */
  private generateFallbackAngles(moment: ClusteredMoment, count: number): string[] {
    const fallbacks = [
      `Open with the moment of ${moment.emotionalCore || 'realization'}, then zoom out to show why it matters`,
      `Start with what was at stake (${moment.whatWasAtStake || 'the challenge'}), then reveal the turning point`,
      `Begin with a sensory detail from the scene, let the reader discover the significance gradually`,
      `Frame as a before/after: who the student was before this moment vs. after`,
    ];
    return fallbacks.slice(0, count);
  }

  /**
   * Clamp a score to 1-10 range, defaulting to 5 if invalid.
   */
  private clampScore(score: number | undefined | null): number {
    if (score === undefined || score === null || isNaN(score)) return 5;
    return Math.max(1, Math.min(10, Math.round(score)));
  }
}

export const storyMiningService = new StoryMiningService();
