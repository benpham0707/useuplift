/**
 * Prompt Builder — Assembles system + user prompts for the annotation pipeline
 *
 * Constructs a single Sonnet call that produces inline text annotations.
 * System prompt is structured so the first ~80% is static (cacheable).
 *
 * Integration points:
 * - dimensionRegistry: 13 scoring dimensions with weights
 * - essayProfileRegistry: essay-type-specific weight overrides, anti-patterns, tone
 * - featureExtractor output: deterministic text features for feature summary
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
import { getStructureInsights, getDynamicsInsights, simpleHash } from '../workshop/scoring/narrativeLLMTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_ANNOTATIONS = 12;

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
// PROMPT BUILDER
// ============================================================================

export class PromptBuilder {
  /**
   * Build the assembled prompt for the annotation pipeline.
   *
   * @param text - The essay text to analyze
   * @param config - Pipeline configuration (essay type, context, etc.)
   * @param enrichedFeatures - Extracted features + expertise signals
   * @returns AssembledPrompt with system/user prompts and token estimates
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
    // Estimate ~150 tokens per annotation for output
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

    // 2. Dimension reference (static after startup, cacheable)
    parts.push(this.buildDimensionReference());

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
- Cover different dimensions of writing quality, not just grammar`;
  }

  private buildDimensionReference(): string {
    const dimensions = dimensionRegistry.getAll();

    const dimLines = dimensions.map(
      (d) => `- ${d.id}: ${d.displayName} (weight: ${(d.weight * 100).toFixed(0)}%)`,
    );

    return `## Scoring Dimensions (13 total)

Your annotations should cover these writing quality dimensions. Weight indicates relative importance in the overall Essay Quality Index (EQI):

${dimLines.join('\n')}

Distribute your annotations across multiple dimensions. Do not cluster all feedback on a single dimension.`;
  }

  private buildAnnotationSchema(): string {
    // Describe the RawLLMAnnotation shape the LLM must produce
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
  "dimensionId": "one of the 13 dimension IDs listed above",
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
- \`dimensionId\`: Must be one of the 13 dimension IDs listed above.
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

**Good annotation (strength):**
\`\`\`json
{
  "span": { "text": "The fluorescent lights hummed above as I slid my grandmother's ring across the pawnshop counter", "startOffset": 0, "endOffset": 91, "paragraphIndex": 0 },
  "dimensionId": "authenticity_specificity",
  "severity": "strength",
  "isStrength": true,
  "insight": "This opening grounds the reader in a vivid, specific moment. The fluorescent lights and grandmother's ring create immediate sensory context while signaling emotional weight — we understand something precious is being given up before you say it directly.",
  "suggestion": "This is effective because it SHOWS the sacrifice rather than telling us about it. The specific detail of the pawnshop counter makes this feel real and lived-in.",
  "confidence": 0.92
}
\`\`\`

**Good annotation (issue):**
\`\`\`json
{
  "span": { "text": "This experience taught me the importance of perseverance and hard work", "startOffset": 1205, "endOffset": 1273, "paragraphIndex": 4 },
  "dimensionId": "thematic_depth",
  "severity": "important",
  "isStrength": false,
  "insight": "This conclusion falls into the 'lesson statement' trap — it tells the reader what to think instead of letting the story's meaning emerge naturally. Admissions officers read thousands of essays that end with 'I learned perseverance.' This generic takeaway undercuts the specific, personal story you've built.",
  "suggestion": "Instead of stating the lesson, show how this experience changed your behavior or perspective in a specific way. What do you do differently now? What small moment captures the shift?",
  "rewriteExample": "Now when I face a problem set that seems impossible, I think of that pawnshop counter — and I slide my work forward anyway.",
  "confidence": 0.88
}
\`\`\``;
  }

  private buildProfileBlock(profile: EssayProfileManifest): string {
    const parts: string[] = [`## Essay Type: ${profile.displayName}`];

    // Weight overrides
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

    // Anti-patterns
    if (profile.antiPatterns.length > 0) {
      parts.push(
        `Common mistakes for this essay type — flag these if detected:\n${profile.antiPatterns.map((ap) => `- ${ap}`).join('\n')}`,
      );
    }

    // Teaching tone
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

    // 2. Feature summary
    parts.push(this.buildFeatureSummary(enrichedFeatures));

    // 2b. Narrative analysis summary (if available)
    // Pass essay hash so cached LLM insights from scoring pipeline can be injected.
    if (enrichedFeatures.narrativeAnalysis) {
      const essayHash = simpleHash(text);
      parts.push(this.buildNarrativeAnalysisSummary(enrichedFeatures.narrativeAnalysis, essayHash));
    }

    // 2c. Deep content analysis summary (Wave 2 — structure, theme, character, insight)
    if (enrichedFeatures.deepContentAnalysis) {
      parts.push(this.buildDeepContentAnalysisSummary(enrichedFeatures.deepContentAnalysis));
    }

    // 3. Expertise match summary (activity essays)
    if (enrichedFeatures.expertiseSignals) {
      parts.push(this.buildExpertiseMatchSummary(enrichedFeatures));
    }

    // 4. College context (why_us essays)
    const collegeBlock = this.buildCollegeContext(config);
    if (collegeBlock) {
      parts.push(collegeBlock);
    }

    // 5. Instructions
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

    // Only include non-zero detection counts
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
   * Now includes function-based analysis and explicit heuristic limitations.
   */
  buildNarrativeAnalysisSummary(result: NarrativeAnalysisResult, essayHash?: string): string {
    const lines: string[] = ['## Narrative Analysis (deterministic)'];

    // Function flow
    if (result.paragraphFunctions.length > 0) {
      const flow = result.narrativeFlow.functionSequence.join(' → ');
      lines.push(`Function flow: ${flow}`);
      if (result.narrativeFlow.missingFunctions.length > 0) {
        lines.push(`Missing functions: ${result.narrativeFlow.missingFunctions.join(', ')}`);
      }
      lines.push(`Function diversity: ${Math.round(result.narrativeFlow.functionDiversity * 100)}%`);
    }

    // Arc
    const arcLabel = result.narrativeArc.detectedArc.replace(/_/g, ' ');
    lines.push(`Arc: ${arcLabel} (${Math.round(result.narrativeArc.confidence * 100)}% confidence)`);

    // Scene/Summary
    lines.push(`Scene ratio: ${Math.round(result.sceneVsSummary.sceneRatio * 100)}% (ideal: 50-75%)`);

    // Show/Tell — now with context
    if (result.showVsTell.tellOpportunities.length > 0) {
      lines.push(`Tell-not-show: ${result.showVsTell.tellOpportunities.length} — evaluate whether each is appropriate in context`);
    }

    // Emotional journey
    lines.push(`Emotional trajectory: ${result.emotionalJourney.trajectory.pattern}, variety ${Math.round(result.emotionalJourney.trajectory.varietyScore * 100)}%`);

    // Tension
    lines.push(`Tension: peak ${result.tensionCurve.curve.peakTension}/10 at P${result.tensionCurve.curve.peakParagraph}, ${result.tensionCurve.evaluation.flatSpotCount} flat spot(s)`);

    // Specificity
    if (result.specificity.overallScore < 40) {
      lines.push(`Specificity: weak (${Math.round(result.specificity.overallScore)}/100) — paragraph ${result.specificity.weakestParagraph} most abstract`);
    }

    // Heuristic limitations — explicit about what LLM should evaluate
    if (result.llmEvaluationNeeded.length > 0) {
      lines.push('');
      lines.push('Heuristic limitations (evaluate with LLM):');
      for (const item of result.llmEvaluationNeeded.slice(0, 4)) {
        lines.push(`- ${item}`);
      }
    }

    // Top issues (max 3)
    if (result.topIssues.length > 0) {
      lines.push('');
      lines.push('Key narrative issues:');
      for (const issue of result.topIssues.slice(0, 3)) {
        lines.push(`- [${issue.severity}] ${issue.issue}`);
      }
    }

    // Inject LLM-derived insights if available from the scoring pipeline cache
    if (essayHash) {
      this.appendLLMInsights(lines, essayHash);
    }

    return lines.join('\n');
  }

  /**
   * Append cached LLM narrative insights from the Haiku+Sonnet scoring pipeline.
   * These enrich the annotation pipeline's Sonnet prompt with deep understanding.
   * Uses essay-hash-keyed cache lookup to avoid cross-essay contamination.
   */
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

  /**
   * Build a ~200-token summary of deep content analysis for the Sonnet prompt.
   * Covers: essay structure, theme signals, character revelation, insight depth.
   */
  buildDeepContentAnalysisSummary(analysis: DeepContentAnalysis): string {
    const lines: string[] = ['## Deep Content Analysis (deterministic)'];

    // Structure
    const s = analysis.structure;
    const arcLabel = s.detectedArc.replace(/_/g, ' ');
    lines.push(`Structure: ${arcLabel} arc (${Math.round(s.arcConfidence * 100)}% conf), ${s.pacing.balance} pacing`);
    if (s.beats.length > 0) {
      const beatLabels = s.beats.map(b => `${b.beatType}(P${b.paragraphIndices.join(',P')})`);
      lines.push(`Beats: ${beatLabels.join(' → ')}`);
    }
    if (s.diagnostics.missingBeats.length > 0) {
      lines.push(`Missing beats: ${s.diagnostics.missingBeats.join(', ')}`);
    }

    // Theme
    const t = analysis.theme;
    lines.push(`Show/tell ratio: ${Math.round(t.showDontTell.showRatio * 100)}% (${t.showDontTell.tellingMarkerCount} telling, ${t.showDontTell.showingMarkerCount} showing)`);
    if (t.clicheDetection.clicheDetected) {
      const themes = t.clicheDetection.matchedThemes.map(m => m.label).join(', ');
      lines.push(`Cliché topic: ${themes} — verdict: ${t.clicheDetection.verdict.replace(/_/g, ' ')}`);
    }
    if (t.thematicCoherence.tangentialParagraphs.length > 0) {
      lines.push(`Tangential paragraphs: P${t.thematicCoherence.tangentialParagraphs.join(', P')} (low thematic overlap)`);
    }
    lines.push(`Thematic coherence: ${Math.round(t.thematicCoherence.overallCoherence * 100)}%`);

    // Character
    const c = analysis.character;
    lines.push(`Character revelation peak: ${c.peakLevel.replace(/_/g, ' ')} at P${c.peakParagraphIndex}`);
    if (c.vulnerability.vulnerabilityMarkerCount > 0) {
      lines.push(`Vulnerability: ${c.vulnerability.isEarned ? 'earned (grounded in detail)' : 'performed (lacks grounding detail)'}`);
    }
    if (c.observations.length > 0) {
      for (const obs of c.observations.slice(0, 2)) {
        lines.push(`- ${obs}`);
      }
    }

    // Insight
    const i = analysis.insight;
    lines.push(`Insight depth: ${i.depth.level.replace(/_/g, ' ')} (score ${i.depth.score}/100, location: ${i.depth.insightLocation.replace(/_/g, ' ')})`);
    if (i.depth.markers.isCliche) {
      lines.push(`Insight uses cliché language — evaluate whether the surrounding context redeems it`);
    }
    if (i.uniqueness.hasCallbackStructure) {
      lines.push(`Essay has callback structure (final paragraphs echo opening)`);
    }
    if (i.depth.strongestPassage) {
      lines.push(`Strongest insight: "${i.depth.strongestPassage.slice(0, 100)}${i.depth.strongestPassage.length > 100 ? '...' : ''}"`);
    }

    return lines.join('\n');
  }

  private buildInstructions(maxAnnotations: number, includeStrengths: boolean): string {
    const strengthNote = includeStrengths
      ? 'Include both strengths and issues. Aim for ~35% strength annotations and ~65% issues.'
      : 'Focus on issues and improvements only.';

    return `## Instructions

Analyze this essay and produce ${maxAnnotations} annotations as a JSON array.

${strengthNote}

Annotation distribution:
- Cover at least 4 different dimensions across your annotations
- Spread annotations across different parts of the essay (opening, middle, closing)
- Include at least 1 annotation about the opening and 1 about the closing
- For issues, vary severity levels — not everything is "important"

Requirements:
1. Each \`span.text\` must be an EXACT substring of the essay text above.
2. Character offsets must be accurate — count from the start of the raw essay text (not including [P0] markers).
3. Prioritize the most impactful feedback first.
4. For issues, provide actionable suggestions. For strengths, explain WHY it works.
5. Include rewrite examples for non-obvious improvements.
6. Match your teaching tone to the sophistication level indicated above.

Return ONLY the JSON array. No markdown fencing, no explanation text.`;
  }
}

/** Singleton prompt builder */
export const promptBuilder = new PromptBuilder();
