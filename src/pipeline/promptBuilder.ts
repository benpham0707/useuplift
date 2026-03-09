/**
 * Prompt Builder — Assembles system + user prompts for the annotation pipeline
 *
 * Constructs a single Sonnet call that produces inline text annotations.
 * System prompt is structured so the first ~80% is static (cacheable).
 *
 * V2 Architecture:
 * - Dimensions organized into 3 interconnected clusters (Structure, Craft, Character)
 * - Deep content analysis findings (heuristic) integrated per-cluster
 * - Annotation budget distributed across clusters (not a flat count)
 *
 * Integration points:
 * - dimensionRegistry: 15 scoring dimensions with weights
 * - essayProfileRegistry: essay-type-specific weight overrides, anti-patterns, tone
 * - featureExtractor output: deterministic text features for feature summary
 * - Wave 2 analyzers: deep content analysis (structure, theme, character, insight)
 */

import { dimensionRegistry, essayProfileRegistry } from '../workshop';
import type { EssayProfileManifest } from '../workshop/shared/types';
import { estimateTokens } from '../lib/llm/claude';
import type {
  AssembledPrompt,
  AnnotationPipelineConfig,
  EnrichedFeatures,
  RawLLMAnnotation,
  AnnotationSeverity,
} from './types';
import type { NarrativeAnalysisResult } from '../workshop/scoring/narrativeAnalyzerTypes';
import type { DeepContentAnalysis } from './contentAnalysisTypes';
import type { PatternManifest, StrategyManifest } from '../workshop/shared/types';
import { getStructureInsights, getDynamicsInsights, simpleHash } from '../workshop/scoring/narrativeLLMTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_ANNOTATIONS = 15;

/** Severity definitions included in the system prompt */
const SEVERITY_DEFINITIONS: Record<AnnotationSeverity, string> = {
  critical:
    'A fundamental issue that significantly undermines the essay. Must be addressed for the essay to succeed. Examples: incoherent structure, missing thesis, factual errors, off-topic content.',
  important:
    'A significant issue that noticeably weakens the essay. Should be addressed for a strong submission. Examples: weak opening, underdeveloped scene, telling instead of showing.',
  suggestion:
    'An optional improvement that would elevate the essay. Nice to address but not essential. Examples: tighter word choice, additional sensory detail, stronger transition.',
  strength:
    'An effective element worth recognizing and building on. Highlights what the writer is doing well. Examples: vivid dialogue, authentic voice, compelling opening scene.',
};

// ============================================================================
// DIMENSION CLUSTERS
// ============================================================================

interface DimensionCluster {
  name: string;
  focusQuestion: string;
  dimensionIds: string[];
  annotationBudget: number;
  interconnectionGuidance: string;
}

const DIMENSION_CLUSTERS: DimensionCluster[] = [
  {
    name: 'Structure & Arc',
    focusQuestion: 'How is this essay BUILT? What does the architecture reveal about the writer?',
    dimensionIds: [
      'narrative_structure',
      'structural_coherence_flow',
      'narrative_dynamics',
      'opening_hook_engagement',
      'closing_impact_resolution',
    ],
    annotationBudget: 5,
    interconnectionGuidance:
      'Consider how these dimensions interact: Does the opening set up what the closing resolves? Do transitions create narrative momentum? Is pacing proportional to emotional importance? Does the arc create meaning beyond chronology?',
  },
  {
    name: 'Craft & Voice',
    focusQuestion: 'How does this essay SOUND? What does the language reveal about the writer?',
    dimensionIds: [
      'originality_voice_authenticity',
      'tonal_sophistication',
      'word_economy_craft',
      'narrative_craft_storytelling',
    ],
    annotationBudget: 5,
    interconnectionGuidance:
      'Consider how these dimensions interact: Does word choice reveal the writer\'s identity (voice as craft)? Are tonal shifts deliberate choices serving the story? Does showing vs telling reflect trust in the reader? Is the language tight AND evocative?',
  },
  {
    name: 'Character & Meaning',
    focusQuestion: 'What does this essay reveal about WHO this person is? What would an AO take away?',
    dimensionIds: [
      'thematic_depth_reflection',
      'authenticity_specificity_detail',
      'emotional_resonance_vulnerability',
      'growth_transformation_arc',
      'intellectual_vitality_curiosity',
      'argument_rhetorical_craft',
    ],
    annotationBudget: 5,
    interconnectionGuidance:
      'Consider how these dimensions interact: Does authentic detail support emotional resonance? Is growth shown through specific changed behavior (not stated)? Does intellectual curiosity drive the personal narrative? Is the implicit argument earned through lived experience?',
  },
];

// ============================================================================
// PROMPT BUILDER
// ============================================================================

export class PromptBuilder {
  /**
   * Build the assembled prompt for the annotation pipeline.
   */
  buildPrompt(
    text: string,
    config: AnnotationPipelineConfig,
    enrichedFeatures: EnrichedFeatures,
  ): AssembledPrompt {
    const profile = essayProfileRegistry.getProfile(config.essayType);
    const maxAnnotations = config.maxAnnotations ?? DEFAULT_MAX_ANNOTATIONS;

    const systemPrompt = this.buildSystemPrompt(config, profile);
    const userPrompt = this.buildUserPrompt(text, config, enrichedFeatures, maxAnnotations);

    const systemTokens = estimateTokens(systemPrompt);
    const userTokens = estimateTokens(userPrompt);
    const expectedOutput = maxAnnotations * 150;

    return {
      systemPrompt,
      userPrompt,
      estimatedTokens: {
        system: systemTokens,
        user: userTokens,
        expectedOutput,
      },
    };
  }

  // ==========================================================================
  // SYSTEM PROMPT (cached portion)
  // ==========================================================================

  private buildSystemPrompt(
    config: AnnotationPipelineConfig,
    profile: EssayProfileManifest | undefined,
  ): string {
    const parts: string[] = [];

    // 1. Role definition (static, cacheable)
    parts.push(this.buildRoleDefinition());

    // 2. Clustered dimension reference (static after startup, cacheable)
    parts.push(this.buildClusteredDimensionReference());

    // 3. Annotation JSON schema (static, cacheable)
    parts.push(this.buildAnnotationSchema());

    // 4. Severity definitions (static, cacheable)
    parts.push(this.buildSeverityDefinitions());

    // 5. Few-shot annotation examples (static, cacheable)
    parts.push(this.buildFewShotExamples());

    // --- Dynamic portion below (varies by essay type) ---

    // 6. Essay profile block
    if (profile) {
      parts.push(this.buildProfileBlock(profile));
    }

    // 7. Teaching sophistication lens
    if (config.teachingSophistication) {
      parts.push(this.buildTeachingSophisticationBlock(config.teachingSophistication));
    }

    // 8. Expertise context (activity essays only)
    const expertiseBlock = this.buildExpertiseContext(config);
    if (expertiseBlock) {
      parts.push(expertiseBlock);
    }

    return parts.join('\n\n');
  }

  private buildRoleDefinition(): string {
    return `You are a world-class college admissions writing coach with deep expertise in essay craft, narrative structure, and what top-tier admissions officers look for. You provide precise, text-anchored feedback that helps students strengthen their essays through specific, actionable annotations.

Your annotations must:
- Anchor to exact text spans with character offsets and paragraph indices
- Balance identifying issues with recognizing strengths
- Provide insight (what you observe + why it matters) and concrete suggestions
- Use a natural mentor voice — warm but direct, never condescending
- Include rewrite examples when they would clarify the suggestion
- Cover different dimensions of writing quality across three interconnected clusters`;
  }

  /**
   * Build dimension reference organized into 3 clusters.
   * Each cluster has a focus question, its dimensions with weights,
   * and guidance on how dimensions within the cluster interact.
   */
  private buildClusteredDimensionReference(): string {
    const dimensions = dimensionRegistry.getAll();
    const dimMap = new Map(dimensions.map(d => [d.id, d]));

    const clusterBlocks: string[] = [];

    for (const cluster of DIMENSION_CLUSTERS) {
      const lines: string[] = [];
      lines.push(`### ${cluster.name}`);
      lines.push(`*${cluster.focusQuestion}*`);
      lines.push('');

      for (const dimId of cluster.dimensionIds) {
        const dim = dimMap.get(dimId);
        if (dim) {
          lines.push(`- **${dim.displayName}** (${dimId}, weight: ${(dim.weight * 100).toFixed(0)}%)`);
        }
      }

      lines.push('');
      lines.push(cluster.interconnectionGuidance);

      clusterBlocks.push(lines.join('\n'));
    }

    return `## Scoring Dimensions — Three Interconnected Clusters

Your annotations should be organized across these three clusters. Each cluster represents a different lens for evaluating the essay. Annotations within a cluster should reflect how its dimensions interact.

${clusterBlocks.join('\n\n')}

Distribute your annotations across ALL three clusters. Do not concentrate feedback in a single cluster.`;
  }

  private buildAnnotationSchema(): string {
    return `## Output Schema

Return a JSON array of annotation objects. Each annotation must match this exact schema:

\`\`\`json
{
  "span": {
    "text": "exact quoted substring from the essay",
    "startOffset": 0,
    "endOffset": 42,
    "paragraphIndex": 0
  },
  "dimensionId": "one of the dimension IDs listed above",
  "severity": "critical | important | suggestion | strength",
  "isStrength": false,
  "insight": "What you observe and why it matters. 1-3 sentences, mentor voice.",
  "suggestion": "Concrete direction to improve, or for strengths, why it works. 1-2 sentences.",
  "rewriteExample": "Optional concrete rewrite demonstrating the suggestion.",
  "applicableCommand": "Optional command ID if an editing command applies.",
  "confidence": 0.85
}
\`\`\`

Field rules:
- \`span.text\`: Must be an EXACT substring of the essay text. The system will verify this.
- \`span.startOffset\` / \`span.endOffset\`: Character offsets (0-indexed, end exclusive). Must match where \`span.text\` appears.
- \`span.paragraphIndex\`: 0-indexed paragraph number (paragraphs are separated by blank lines).
- \`dimensionId\`: Must be one of the dimension IDs listed above.
- \`severity\`: "strength" when \`isStrength\` is true; "critical", "important", or "suggestion" when \`isStrength\` is false.
- \`isStrength\`: true for positive feedback, false for issues/improvements.
- \`confidence\`: Your confidence in this annotation, 0.0 to 1.0.
- \`rewriteExample\`: Provide when a concrete rewrite would help; omit for strengths or when the suggestion is clear enough.
- \`applicableCommand\`: Omit unless you know a specific editing command applies.`;
  }

  private buildSeverityDefinitions(): string {
    const lines = Object.entries(SEVERITY_DEFINITIONS).map(
      ([sev, def]) => `- **${sev}**: ${def}`,
    );

    return `## Severity Definitions

${lines.join('\n')}

Balance: aim for roughly 30-40% strengths and 60-70% issues across your annotations. Every essay has things it does well.`;
  }

  private buildFewShotExamples(): string {
    return `## Annotation Examples

**Good annotation (strength — Structure & Arc cluster):**
\`\`\`json
{
  "span": { "text": "The fluorescent lights hummed above as I slid my grandmother's ring across the pawnshop counter", "startOffset": 0, "endOffset": 91, "paragraphIndex": 0 },
  "dimensionId": "opening_hook_engagement",
  "severity": "strength",
  "isStrength": true,
  "insight": "This opening grounds the reader in a vivid, specific moment. The fluorescent lights and grandmother's ring create immediate sensory context while signaling emotional weight — we understand something precious is being given up before you say it directly. It also establishes the pawnshop as a physical and metaphorical space that the essay can return to.",
  "suggestion": "This works because it drops the reader into a world only YOU inhabit. The AO is already curious: why is this person at a pawnshop? What's the story behind the ring? That's a strong curiosity gap.",
  "confidence": 0.92
}
\`\`\`

**Good annotation (issue — Character & Meaning cluster):**
\`\`\`json
{
  "span": { "text": "This experience taught me the importance of perseverance and hard work", "startOffset": 1205, "endOffset": 1273, "paragraphIndex": 4 },
  "dimensionId": "thematic_depth_reflection",
  "severity": "important",
  "isStrength": false,
  "insight": "This conclusion falls into the 'lesson statement' trap — it tells the reader what to think instead of letting the story's meaning emerge naturally. Admissions officers read thousands of essays that end with 'I learned perseverance.' This generic takeaway undercuts the specific, personal story you've built and fails the portability test: this lesson could come from anyone's essay.",
  "suggestion": "Instead of stating the lesson, show how this experience changed your behavior or perspective in a specific way. What do you do differently now? What small moment captures the shift?",
  "rewriteExample": "Now when I face a problem set that seems impossible, I think of that pawnshop counter — and I slide my work forward anyway.",
  "confidence": 0.88
}
\`\`\``;
  }

  private buildProfileBlock(profile: EssayProfileManifest): string {
    const parts: string[] = [`## Essay Type: ${profile.displayName}`];

    const overrides = Object.entries(profile.dimensionWeightOverrides);
    if (overrides.length > 0) {
      const overrideLines = overrides.map(
        ([dimId, weight]) =>
          `- ${dimId}: ${((weight as number) * 100).toFixed(0)}%`,
      );
      parts.push(
        `Dimension weight adjustments for this essay type (prioritize higher-weighted dimensions):\n${overrideLines.join('\n')}`,
      );
    }

    if (profile.antiPatterns.length > 0) {
      parts.push(
        `Common mistakes for this essay type — flag these if detected:\n${profile.antiPatterns.map((ap) => `- ${ap}`).join('\n')}`,
      );
    }

    if (profile.teachingTone) {
      const tone = profile.teachingTone;
      parts.push(
        `Teaching tone: ${tone.formality} formality, ${tone.encouragement} encouragement, ${tone.directness} directness.`,
      );
    }

    return parts.join('\n\n');
  }

  private buildTeachingSophisticationBlock(
    level: 'foundational' | 'intermediate' | 'advanced',
  ): string {
    const lensMap: Record<string, string> = {
      foundational:
        'This essay needs foundational guidance. Focus on clear, concrete suggestions with rewrite examples. Explain WHY each change matters. Prioritize critical and important issues over nuanced suggestions. Use encouraging language — this writer is still developing their craft.',
      intermediate:
        'This essay shows solid fundamentals. Push toward more sophisticated craft: varied sentence rhythm, layered subtext, stronger voice. Balance encouragement with direct challenges to elevate the writing. Provide rewrite examples for non-obvious improvements.',
      advanced:
        'This essay demonstrates strong writing ability. Focus on subtle refinements: micro-level word choice, tonal precision, structural resonance. Be direct and specific — this writer can handle candid feedback. Prioritize suggestions over basic issues. Skip obvious advice.',
    };

    return `## Teaching Sophistication: ${level}\n\n${lensMap[level]}`;
  }

  // ==========================================================================
  // USER PROMPT
  // ==========================================================================

  private buildUserPrompt(
    text: string,
    config: AnnotationPipelineConfig,
    enrichedFeatures: EnrichedFeatures,
    maxAnnotations: number,
  ): string {
    const parts: string[] = [];

    // 1. Full essay text with paragraph markers
    parts.push(this.buildMarkedEssay(text));

    // 2. Feature summary (deterministic stats)
    parts.push(this.buildFeatureSummary(enrichedFeatures));

    // 3. Narrative analysis summary (if available from scoring pipeline)
    if (enrichedFeatures.narrativeAnalysis) {
      const essayHash = simpleHash(text);
      parts.push(this.buildNarrativeAnalysisSummary(enrichedFeatures.narrativeAnalysis, essayHash));
    }

    // 4. Deep content analysis section (heuristic findings per cluster)
    parts.push(this.buildClusteredPreAnalysisSection(
      enrichedFeatures.deepContentAnalysis,
    ));

    // 5. Detected patterns and strategy (Wave 3 registry findings)
    const registryBlock = this.buildRegistryFindings(enrichedFeatures);
    if (registryBlock) {
      parts.push(registryBlock);
    }

    // 7. Expertise match summary (activity essays)
    if (enrichedFeatures.expertiseSignals) {
      parts.push(this.buildExpertiseMatchSummary(enrichedFeatures));
    }

    // 8. College context (why_us essays)
    const collegeBlock = this.buildCollegeContext(config);
    if (collegeBlock) {
      parts.push(collegeBlock);
    }

    // 9. Instructions with cluster-based annotation budget
    const includeStrengths = config.includeStrengths !== false;
    parts.push(this.buildInstructions(maxAnnotations, includeStrengths));

    return parts.join('\n\n');
  }

  private buildMarkedEssay(text: string): string {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    const marked = paragraphs
      .map((p, i) => `[P${i}] ${p.trim()}`)
      .join('\n\n');

    return `## Essay Text\n\n${marked}`;
  }

  private buildFeatureSummary(enrichedFeatures: EnrichedFeatures): string {
    const f = enrichedFeatures.features;

    const signals: string[] = [
      `Word count: ${f.wordCount}`,
      `Sentences: ${f.sentenceCount} (avg ${f.avgSentenceLength.toFixed(1)} words)`,
      `Paragraphs: ${f.paragraphCount}`,
      `Vocabulary richness: ${(f.vocabularyRichness * 100).toFixed(0)}%`,
      `Sentence variety: ${(f.sentenceVarietyScore * 100).toFixed(0)}%`,
      `Passive voice ratio: ${(f.passiveVoiceRatio * 100).toFixed(0)}%`,
    ];

    if (f.clicheCount > 0) signals.push(`Cliches detected: ${f.clicheCount}`);
    if (f.bannedTermCount > 0) signals.push(`AI-sounding terms: ${f.bannedTermCount}`);
    if (f.fillerPhraseCount > 0) signals.push(`Filler phrases: ${f.fillerPhraseCount}`);
    if (f.sensoryDetailCount > 0) signals.push(`Sensory details: ${f.sensoryDetailCount}`);
    if (f.emotionWordCount > 0) signals.push(`Emotion words: ${f.emotionWordCount}`);
    if (f.dialogueCount > 0) signals.push(`Dialogue instances: ${f.dialogueCount}`);
    if (f.vulnerabilityMarkerCount > 0) signals.push(`Vulnerability markers: ${f.vulnerabilityMarkerCount}`);
    if (f.reflectionMarkerCount > 0) signals.push(`Reflection markers: ${f.reflectionMarkerCount}`);
    if (f.growthLanguageCount > 0) signals.push(`Growth language: ${f.growthLanguageCount}`);
    if (f.rhetoricalDeviceCount > 0) signals.push(`Rhetorical devices: ${f.rhetoricalDeviceCount}`);
    if (f.hasOpeningScene) signals.push('Opening scene: detected');

    return `## Feature Summary (deterministic analysis)\n\n${signals.join('\n')}`;
  }

  private buildExpertiseMatchSummary(enrichedFeatures: EnrichedFeatures): string {
    const signals = enrichedFeatures.expertiseSignals!;
    const parts: string[] = ['## Expertise Signals'];

    if (signals.expertiseDomain) {
      parts.push(`Domain: ${signals.expertiseDomain}`);
    }
    if (signals.impressivenessLevel) {
      parts.push(`Impressiveness: ${signals.impressivenessLevel}`);
    }
    if (signals.detectedNameDrops.length > 0) {
      parts.push(
        `Name-drops detected (may be filler): ${signals.detectedNameDrops.join(', ')}`,
      );
    }
    if (signals.proofOfWork.length > 0) {
      parts.push(
        `Proof of work indicators: ${signals.proofOfWork.join(', ')}`,
      );
    }

    return parts.join('\n');
  }

  private buildExpertiseContext(config: AnnotationPipelineConfig): string | null {
    if (config.essayType !== 'activity_to_essay' || !config.activityContext) {
      return null;
    }

    const ctx = config.activityContext;
    const parts: string[] = [
      `## Activity Context`,
      `Activity: ${ctx.title}`,
      `Role: ${ctx.role}`,
      `Category: ${ctx.category}`,
    ];

    if (ctx.intendedMajor) {
      parts.push(`Intended major: ${ctx.intendedMajor}`);
    }

    parts.push(
      '',
      'For activity descriptions, prioritize: specificity of impact/outcome over tech name-drops, quantified results, and unique contribution. AOs care about PROBLEM, SCALE, and OUTCOME — not tool names.',
    );

    return parts.join('\n');
  }

  private buildCollegeContext(config: AnnotationPipelineConfig): string | null {
    if (config.essayType !== 'why_us' || !config.collegeContext) {
      return null;
    }

    const ctx = config.collegeContext;
    const parts: string[] = [
      `## College Context`,
      `College: ${ctx.collegeName}`,
    ];

    if (ctx.coreValues && ctx.coreValues.length > 0) {
      parts.push(`Core values: ${ctx.coreValues.join(', ')}`);
    }
    if (ctx.specificPrograms && ctx.specificPrograms.length > 0) {
      parts.push(`Specific programs: ${ctx.specificPrograms.join(', ')}`);
    }

    parts.push(
      '',
      'For "Why Us" essays, check that the student demonstrates genuine knowledge of the college, connects their interests to specific programs/opportunities, and avoids generic praise that could apply to any school.',
    );

    return parts.join('\n');
  }

  /**
   * Build a ~250-token summary of the deterministic narrative analysis results.
   * Injected into the user prompt to give the Sonnet annotator structural context.
   */
  buildNarrativeAnalysisSummary(result: NarrativeAnalysisResult, essayHash?: string): string {
    const lines: string[] = ['## Narrative Analysis (deterministic)'];

    if (result.paragraphFunctions.length > 0) {
      const flow = result.narrativeFlow.functionSequence.join(' → ');
      lines.push(`Function flow: ${flow}`);
      if (result.narrativeFlow.missingFunctions.length > 0) {
        lines.push(`Missing functions: ${result.narrativeFlow.missingFunctions.join(', ')}`);
      }
      lines.push(`Function diversity: ${Math.round(result.narrativeFlow.functionDiversity * 100)}%`);
    }

    const arcLabel = result.narrativeArc.detectedArc.replace(/_/g, ' ');
    lines.push(`Arc: ${arcLabel} (${Math.round(result.narrativeArc.confidence * 100)}% confidence)`);
    lines.push(`Scene ratio: ${Math.round(result.sceneVsSummary.sceneRatio * 100)}% (ideal: 50-75%)`);

    if (result.showVsTell.tellOpportunities.length > 0) {
      lines.push(`Tell-not-show: ${result.showVsTell.tellOpportunities.length} — evaluate whether each is appropriate in context`);
    }

    lines.push(`Emotional trajectory: ${result.emotionalJourney.trajectory.pattern}, variety ${Math.round(result.emotionalJourney.trajectory.varietyScore * 100)}%`);
    lines.push(`Tension: peak ${result.tensionCurve.curve.peakTension}/10 at P${result.tensionCurve.curve.peakParagraph}, ${result.tensionCurve.evaluation.flatSpotCount} flat spot(s)`);

    if (result.specificity.overallScore < 40) {
      lines.push(`Specificity: weak (${Math.round(result.specificity.overallScore)}/100) — paragraph ${result.specificity.weakestParagraph} most abstract`);
    }

    if (result.llmEvaluationNeeded.length > 0) {
      lines.push('');
      lines.push('Heuristic limitations (evaluate with LLM):');
      for (const item of result.llmEvaluationNeeded.slice(0, 4)) {
        lines.push(`- ${item}`);
      }
    }

    if (result.topIssues.length > 0) {
      lines.push('');
      lines.push('Key narrative issues:');
      for (const issue of result.topIssues.slice(0, 3)) {
        lines.push(`- [${issue.severity}] ${issue.issue}`);
      }
    }

    if (essayHash) {
      this.appendLLMInsights(lines, essayHash);
    }

    return lines.join('\n');
  }

  private appendLLMInsights(lines: string[], essayHash: string): void {
    const structureInsights = getStructureInsights(essayHash);
    const dynamicsInsights = getDynamicsInsights(essayHash);

    if (!structureInsights && !dynamicsInsights) return;

    lines.push('');
    lines.push('## LLM Narrative Insights (from scoring pipeline)');

    if (structureInsights) {
      lines.push('');
      lines.push('**Structure**:');
      if (structureInsights.strongestMoment) {
        lines.push(`- Strongest moment (P${structureInsights.strongestMoment.paragraphIndex}): ${structureInsights.strongestMoment.why}`);
      }
      if (structureInsights.biggestOpportunity) {
        lines.push(`- Biggest opportunity (P${structureInsights.biggestOpportunity.paragraphIndex}): ${structureInsights.biggestOpportunity.why}`);
        lines.push(`  Teaching Q: ${structureInsights.biggestOpportunity.teachingQuestion}`);
      }
      if (structureInsights.whatEssayConveys) {
        lines.push(`- What structure conveys: ${structureInsights.whatEssayConveys}`);
      }
    }

    if (dynamicsInsights) {
      lines.push('');
      lines.push('**Dynamics**:');
      if (dynamicsInsights.emotionalArc) {
        lines.push(`- Emotional arc: ${dynamicsInsights.emotionalArc.summary}`);
        lines.push(`- Transformation earned: ${dynamicsInsights.emotionalArc.isTransformationEarned ? 'yes' : 'no'} — ${dynamicsInsights.emotionalArc.transformationSpecificity}`);
      }
      if (dynamicsInsights.strongestMoment) {
        lines.push(`- Strongest moment (P${dynamicsInsights.strongestMoment.paragraphIndex}): ${dynamicsInsights.strongestMoment.why}`);
      }
      if (dynamicsInsights.whatEssayConveysAboutWriter) {
        lines.push(`- What essay conveys about writer: ${dynamicsInsights.whatEssayConveysAboutWriter}`);
      }
      if (dynamicsInsights.readerTakeaway) {
        lines.push(`- Reader takeaway: ${dynamicsInsights.readerTakeaway}`);
      }
    }
  }

  // ==========================================================================
  // CLUSTERED PRE-ANALYSIS SECTION
  // ==========================================================================

  /**
   * Build a cluster-organized pre-analysis section from Wave 2 heuristic
   * deep content analysis. Each cluster gets findings relevant to its
   * focus area, giving Sonnet targeted context for annotations.
   */
  buildClusteredPreAnalysisSection(
    deepContent?: DeepContentAnalysis,
  ): string {
    if (!deepContent) return '';

    const sections: string[] = ['## Pre-Analysis Findings (organized by cluster)'];

    // ---- Structure & Arc ----
    sections.push(this.buildStructureClusterFindings(deepContent));

    // ---- Craft & Voice ----
    sections.push(this.buildCraftClusterFindings(deepContent));

    // ---- Character & Meaning ----
    sections.push(this.buildCharacterClusterFindings(deepContent));

    return sections.join('\n\n');
  }

  private buildStructureClusterFindings(
    deepContent: DeepContentAnalysis,
  ): string {
    const lines: string[] = ['### Structure & Arc'];

    const s = deepContent.structure;
    lines.push(`Arc: ${s.detectedArc.replace(/_/g, ' ')} (${Math.round(s.arcConfidence * 100)}% conf)`);
    if (s.beats.length > 0) {
      const beatLabels = s.beats.map(b => `${b.beatType}(P${b.paragraphIndices.join(',P')})`);
      lines.push(`Beats: ${beatLabels.join(' → ')}`);
    }
    if (s.diagnostics.missingBeats.length > 0) {
      lines.push(`Missing beats: ${s.diagnostics.missingBeats.join(', ')}`);
    }
    lines.push(`Pacing: ${s.pacing.balance} (setup: ${Math.round(s.pacing.setupRatio * 100)}%, payoff: ${Math.round(s.pacing.payoffRatio * 100)}%)`);

    // Thematic coherence (tangential paragraphs affect structure)
    const t = deepContent.theme;
    if (t.thematicCoherence.tangentialParagraphs.length > 0) {
      lines.push(`Tangential paragraphs: P${t.thematicCoherence.tangentialParagraphs.join(', P')} (low thematic overlap with essay core)`);
    }

    return lines.join('\n');
  }

  private buildCraftClusterFindings(
    deepContent: DeepContentAnalysis,
  ): string {
    const lines: string[] = ['### Craft & Voice'];

    const t = deepContent.theme;
    lines.push(`Show/tell ratio: ${Math.round(t.showDontTell.showRatio * 100)}% showing (${t.showDontTell.tellingMarkerCount} telling markers, ${t.showDontTell.showingMarkerCount} showing markers)`);

    return lines.join('\n');
  }

  private buildCharacterClusterFindings(
    deepContent: DeepContentAnalysis,
  ): string {
    const lines: string[] = ['### Character & Meaning'];

    const c = deepContent.character;
    lines.push(`Character revelation peak: ${c.peakLevel.replace(/_/g, ' ')} at P${c.peakParagraphIndex}`);
    if (c.vulnerability.vulnerabilityMarkerCount > 0) {
      lines.push(`Vulnerability: ${c.vulnerability.isEarned ? 'earned (grounded in detail)' : 'performed (lacks grounding)'}`);
    }

    const i = deepContent.insight;
    lines.push(`Insight depth: ${i.depth.level} (location: ${i.depth.insightLocation.replace(/_/g, ' ')})`);
    if (i.depth.markers.isCliche) {
      lines.push(`Insight uses cliche language — evaluate whether context redeems it`);
    }
    if (i.uniqueness.hasCallbackStructure) {
      lines.push(`Callback structure: final paragraphs echo opening`);
    }

    const t = deepContent.theme;
    if (t.clicheDetection.clicheDetected) {
      const themes = t.clicheDetection.matchedThemes.map(m => m.label).join(', ');
      lines.push(`Cliche topic: ${themes} — verdict: ${t.clicheDetection.verdict.replace(/_/g, ' ')}`);
    }
    lines.push(`Thematic coherence: ${Math.round(t.thematicCoherence.overallCoherence * 100)}%`);

    return lines.join('\n');
  }

  // ==========================================================================
  // REGISTRY FINDINGS (Wave 3)
  // ==========================================================================

  /**
   * Build a section summarizing detected patterns and writing strategy.
   * Patterns are detected heuristically by the pattern registry.
   * Strategy is matched from structure analysis + strategy detection signals.
   */
  private buildRegistryFindings(enrichedFeatures: EnrichedFeatures): string | null {
    const patterns = enrichedFeatures.detectedPatterns;
    const strategy = enrichedFeatures.detectedStrategy;

    if ((!patterns || patterns.length === 0) && !strategy) return null;

    const lines: string[] = ['## Detected Patterns & Strategy'];

    if (strategy) {
      lines.push('');
      lines.push(`**Detected writing strategy: ${strategy.displayName}**`);
      lines.push(strategy.description);
      lines.push('');
      lines.push('When annotating, consider whether the writer is using this strategy intentionally and effectively:');
      for (const pitfall of strategy.teaching.pitfalls.slice(0, 3)) {
        lines.push(`- Watch for: ${pitfall}`);
      }
    }

    if (patterns && patterns.length > 0) {
      lines.push('');
      lines.push('**Detected prose patterns:**');

      const byCategory = new Map<string, PatternManifest[]>();
      for (const p of patterns) {
        const list = byCategory.get(p.category) ?? [];
        list.push(p);
        byCategory.set(p.category, list);
      }

      for (const [category, categoryPatterns] of byCategory) {
        for (const p of categoryPatterns) {
          lines.push(`- ${category}: **${p.displayName}** — recognize as a strength if executed well, flag if underutilized`);
        }
      }
    }

    return lines.join('\n');
  }

  // ==========================================================================
  // INSTRUCTIONS
  // ==========================================================================

  private buildInstructions(maxAnnotations: number, includeStrengths: boolean): string {
    const strengthNote = includeStrengths
      ? 'Include both strengths and issues. Aim for ~35% strength annotations and ~65% issues.'
      : 'Focus on issues and improvements only.';

    // Calculate per-cluster budgets
    const totalBudget = maxAnnotations;
    const clusterBudgets = DIMENSION_CLUSTERS.map(c => {
      const scaled = Math.round((c.annotationBudget / 15) * totalBudget);
      return Math.max(3, scaled);
    });
    // Adjust to hit exact total
    const sum = clusterBudgets.reduce((a, b) => a + b, 0);
    if (sum > totalBudget) {
      clusterBudgets[clusterBudgets.length - 1] -= (sum - totalBudget);
    }

    return `## Instructions

Analyze this essay and produce ${maxAnnotations} annotations as a JSON array.

${strengthNote}

Annotation distribution by cluster:
- **Structure & Arc**: ~${clusterBudgets[0]} annotations (opening, closing, transitions, pacing, arc)
- **Craft & Voice**: ~${clusterBudgets[1]} annotations (voice, tone, word choice, narrative technique)
- **Character & Meaning**: ~${clusterBudgets[2]} annotations (theme, authenticity, emotion, growth, insight)

Within each cluster, cover multiple dimensions — don't collapse everything into one dimension.
Spread annotations across different parts of the essay (opening, middle, closing).
For each cluster, include at least 1 strength annotation.

Requirements:
1. Each \`span.text\` must be an EXACT substring of the essay text above.
2. Character offsets must be accurate — count from the start of the raw essay text (not including [P0] markers).
3. Prioritize the most impactful feedback first.
4. For issues, provide actionable suggestions. For strengths, explain WHY it works in the context of the essay's overall goals.
5. Include rewrite examples for non-obvious improvements.
6. Match your teaching tone to the sophistication level indicated above.
7. Use the pre-analysis findings to inform your annotations — the heuristic and pattern detection data gives you a running start. Build on it, don't just repeat it.

Return ONLY the JSON array. No markdown fencing, no explanation text.`;
  }
}

/** Singleton prompt builder */
export const promptBuilder = new PromptBuilder();
