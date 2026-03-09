/**
 * Context Builder Service
 *
 * Extracts targeted context slices from an EssayUnderstanding for LLM prompts.
 * Used by analysis layers (L2-L5) and the coaching system (L6).
 *
 * All rendering is pure string formatting — no LLM calls.
 * Token budgets are enforced per-slice to keep prompts within limits.
 */

import { estimateTokens } from '../../lib/llm/claude';
import type {
  IContextBuilder,
  ConversationFocus,
  ContextRoute,
  ContextSlice,
  AssembledContext,
  EssayUnderstanding,
  RunningUnderstanding,
  StructuralCartography,
  ParagraphDeepAnalysis,
  EssayDNA,
  ParagraphScoreMatrix,
  ParagraphUnderstanding,
  SentenceUnderstanding,
  ConversationInsight,
} from './types';

// ============================================================================
// TOKEN BUDGET TARGETS PER FOCUS TYPE
// ============================================================================

const FOCUS_TOKEN_BUDGETS: Record<ConversationFocus['type'], number> = {
  essay_overview: 800,
  paragraph: 1800,
  sentence: 1200,
  word: 800,
  dimension: 1200,
  comparison: 2000,
  structural: 1000,
  brainstorming: 500,
};

// Per-slice token budgets for truncation decisions
const SLICE_TOKEN_BUDGETS: Record<ContextSlice['type'], number> = {
  essayDNA: 500,
  paragraphAnalysis: 600,
  sentenceBreakdown: 400,
  structuralMap: 400,
  voiceProfile: 200,
  conversationInsights: 300,
  improvementPriorities: 300,
  crossReferences: 200,
};

// ============================================================================
// SERVICE
// ============================================================================

export class ContextBuilder implements IContextBuilder {

  /**
   * Maps a conversation focus to the right context slices and token estimate.
   */
  route(focus: ConversationFocus): ContextRoute {
    const slices: ContextSlice[] = [];

    switch (focus.type) {
      case 'essay_overview':
        slices.push({ type: 'essayDNA' });
        slices.push({ type: 'improvementPriorities' });
        break;

      case 'paragraph':
        slices.push({ type: 'essayDNA' });
        slices.push({ type: 'paragraphAnalysis', index: focus.index });
        slices.push({ type: 'sentenceBreakdown', paragraphIndex: focus.index });
        slices.push({ type: 'conversationInsights', level: 'paragraph', index: focus.index });
        slices.push({ type: 'crossReferences', paragraphIndex: focus.index });
        break;

      case 'sentence':
        slices.push({ type: 'essayDNA' });
        slices.push({ type: 'paragraphAnalysis', index: focus.paragraphIndex });
        slices.push({ type: 'sentenceBreakdown', paragraphIndex: focus.paragraphIndex });
        break;

      case 'word':
        slices.push({ type: 'sentenceBreakdown', paragraphIndex: focus.paragraphIndex });
        slices.push({ type: 'voiceProfile' });
        break;

      case 'dimension':
        slices.push({ type: 'essayDNA' });
        slices.push({ type: 'improvementPriorities' });
        break;

      case 'comparison':
        slices.push({ type: 'essayDNA' });
        for (const idx of focus.paragraphIndices) {
          slices.push({ type: 'paragraphAnalysis', index: idx });
          slices.push({ type: 'crossReferences', paragraphIndex: idx });
        }
        break;

      case 'structural':
        slices.push({ type: 'essayDNA' });
        slices.push({ type: 'structuralMap' });
        break;

      case 'brainstorming':
        slices.push({ type: 'conversationInsights', level: 'essay' });
        break;
    }

    return {
      focus,
      contextSlices: slices,
      estimatedTokens: FOCUS_TOKEN_BUDGETS[focus.type],
    };
  }

  /**
   * Renders selected slices into a formatted context string.
   */
  assemble(understanding: EssayUnderstanding, slices: ContextSlice[]): AssembledContext {
    const renderedParts: string[] = [];
    const includedSlices: ContextSlice[] = [];

    for (const slice of slices) {
      const rendered = this.renderSlice(understanding, slice);
      if (rendered.length > 0) {
        const budget = SLICE_TOKEN_BUDGETS[slice.type];
        const truncated = this.truncateToTokenBudget(rendered, budget);
        renderedParts.push(truncated);
        includedSlices.push(slice);
      }
    }

    const contextText = renderedParts.join('\n\n');

    return {
      contextText,
      estimatedTokens: estimateTokens(contextText),
      includedSlices,
    };
  }

  /**
   * Builds context for a Layer 3 Sonnet paragraph-walk call.
   *
   * Includes: full essay text with [P1]/[P2] markers, target paragraph highlighted,
   * Layer 1 metrics, Layer 2 structural info, RunningUnderstanding, voice profile.
   */
  buildParagraphWalkContext(
    understanding: EssayUnderstanding,
    paragraphIndex: number,
    runningUnderstanding: RunningUnderstanding | null,
    structuralMap: StructuralCartography,
  ): string {
    const sections: string[] = [];

    // 1. Full essay text with paragraph markers
    sections.push(this.renderEssayWithMarkers(understanding, paragraphIndex));

    // 2. Layer 1 metrics for this paragraph
    const para = understanding.paragraphs[paragraphIndex];
    if (para) {
      sections.push(this.renderLayer1Metrics(para));
    }

    // 3. Layer 2 structural info for this paragraph
    const structuralRole = structuralMap.paragraphRoles.find(r => r.index === paragraphIndex);
    if (structuralRole) {
      sections.push([
        '=== STRUCTURAL CONTEXT (Layer 2) ===',
        `Role: ${structuralRole.role}`,
        `Narrative function: ${structuralRole.narrativeFunction}`,
        `Strength contribution: ${structuralRole.strengthContribution}`,
        structuralRole.weaknessFlag ? `Weakness flag: ${structuralRole.weaknessFlag}` : null,
        `Arc type: ${structuralMap.arcType} (confidence: ${structuralMap.arcConfidence})`,
        `Central theme: ${structuralMap.centralTheme}`,
      ].filter(Boolean).join('\n'));
    }

    // 4. Transitions touching this paragraph
    const relevantTransitions = structuralMap.transitions.filter(
      t => t.fromParagraph === paragraphIndex || t.toParagraph === paragraphIndex,
    );
    if (relevantTransitions.length > 0) {
      const transLines = relevantTransitions.map(
        t => `  P${t.fromParagraph + 1} → P${t.toParagraph + 1}: ${t.quality} (${t.mechanism})`,
      );
      sections.push(`Transitions:\n${transLines.join('\n')}`);
    }

    // 5. RunningUnderstanding
    if (runningUnderstanding) {
      sections.push(this.renderRunningUnderstanding(runningUnderstanding));
    }

    // 6. Voice profile
    if (understanding.voiceProfileSnapshot) {
      const vp = understanding.voiceProfileSnapshot;
      sections.push([
        '=== VOICE PROFILE ===',
        `Register: ${vp.register.primary}${vp.register.secondary ? ` / ${vp.register.secondary}` : ''}`,
        `Formality: ${vp.linguistics.formality}`,
        `Vocabulary: ${vp.linguistics.vocabularyLevel}`,
        `Avg sentence length: ${vp.linguistics.averageSentenceLength} words`,
        vp.linguistics.signatureWords.length > 0
          ? `Signature words: ${vp.linguistics.signatureWords.join(', ')}`
          : null,
      ].filter(Boolean).join('\n'));
    }

    return sections.join('\n\n');
  }

  /**
   * Builds context for Layer 4 crystallization.
   *
   * Includes: serialized final RunningUnderstanding, paragraph score summaries,
   * structural map summary.
   */
  buildCrystallizationContext(
    understanding: EssayUnderstanding,
    finalRunningUnderstanding: RunningUnderstanding,
    allParagraphAnalyses: ParagraphDeepAnalysis[],
  ): string {
    const sections: string[] = [];

    // 1. Final RunningUnderstanding
    sections.push(this.renderRunningUnderstanding(finalRunningUnderstanding));

    // 2. Paragraph score summaries
    const paraLines = allParagraphAnalyses
      .sort((a, b) => a.paragraphIndex - b.paragraphIndex)
      .map(pa => [
        `P${pa.paragraphIndex + 1}: score=${pa.overallScore}/100`,
        `  Top strength: ${pa.topStrength}`,
        `  Top improvement: ${pa.topImprovement}`,
        `  Structural role: ${pa.structural.actualRole} (effectiveness: ${pa.structural.roleEffectiveness}/100)`,
        `  Voice authenticity: ${pa.emotional.voiceAuthenticity}/100`,
        `  Admissions impact: ${pa.admissionsImpact}`,
      ].join('\n'));

    sections.push(`=== PARAGRAPH SUMMARIES ===\n${paraLines.join('\n\n')}`);

    // 3. Structural map summary (if available)
    if (understanding.structuralCartography) {
      const sc = understanding.structuralCartography;
      sections.push([
        '=== STRUCTURAL MAP ===',
        `Arc: ${sc.arcType} (confidence: ${sc.arcConfidence})`,
        `Central theme: ${sc.centralTheme}`,
        `Theme progression: ${sc.themeProgression}`,
        sc.thematicGaps.length > 0 ? `Thematic gaps: ${sc.thematicGaps.join('; ')}` : null,
        `Pacing: ${sc.pacingNotes}`,
        sc.flatSpots.length > 0 ? `Flat spots: P${sc.flatSpots.map(i => i + 1).join(', P')}` : null,
      ].filter(Boolean).join('\n'));
    }

    // 4. Features summary (if available)
    if (understanding.features) {
      const f = understanding.features;
      sections.push([
        '=== DETERMINISTIC FEATURES ===',
        `Words: ${f.wordCount} | Sentences: ${f.sentenceCount} | Paragraphs: ${f.paragraphCount}`,
        `Vocabulary richness: ${f.vocabularyRichness.toFixed(2)}`,
        `Sensory details: ${f.sensoryDetailCount} | Emotion words: ${f.emotionWordCount}`,
        `Opening scene: ${f.hasOpeningScene} | Dialogue: ${f.hasDialogue} (${f.dialogueCount})`,
      ].join('\n'));
    }

    return sections.join('\n\n');
  }

  /**
   * Builds context for Layer 5 annotation generation.
   *
   * Includes: Essay DNA (~500 tokens), improvement priorities (~300 tokens),
   * per-paragraph top issue + top strength (~200 tokens), sentence breakdowns
   * for weak paragraphs only.
   */
  buildAnnotationContext(understanding: EssayUnderstanding): string {
    const sections: string[] = [];

    // 1. Essay DNA
    if (understanding.essayDNA) {
      sections.push(this.renderEssayDNA(understanding.essayDNA));
    }

    // 2. Improvement priorities
    if (understanding.paragraphScoreMatrix) {
      sections.push(this.renderImprovementPriorities(understanding.paragraphScoreMatrix));
    }

    // 3. Per-paragraph top issue + top strength
    const paraSummaries: string[] = [];
    for (const para of understanding.paragraphs) {
      if (para.deepAnalysis) {
        paraSummaries.push(
          `P${para.index + 1}: strength="${para.deepAnalysis.topStrength}" | improvement="${para.deepAnalysis.topImprovement}" | score=${para.deepAnalysis.overallScore}`,
        );
      }
    }
    if (paraSummaries.length > 0) {
      sections.push(`=== PARAGRAPH HIGHLIGHTS ===\n${paraSummaries.join('\n')}`);
    }

    // 4. Sentence breakdowns for weak paragraphs only
    const weakParagraphs = understanding.paragraphs.filter(p => {
      if (!p.deepAnalysis) return false;
      return p.deepAnalysis.overallScore < 50;
    });

    if (weakParagraphs.length > 0) {
      const sentSections: string[] = [];
      for (const para of weakParagraphs) {
        if (para.deepAnalysis && para.deepAnalysis.sentences.length > 0) {
          const sentLines = para.deepAnalysis.sentences.map(s => {
            const marker = s.isStrength ? '+' : s.issue ? '-' : ' ';
            const detail = s.issue || (s.isStrength ? 'strength' : '');
            return `  [${marker}] S${s.index + 1}: "${truncateText(s.text, 60)}" — ${detail}`;
          });
          sentSections.push(`P${para.index + 1} sentences:\n${sentLines.join('\n')}`);
        }
      }
      if (sentSections.length > 0) {
        sections.push(`=== WEAK PARAGRAPH SENTENCE DETAIL ===\n${sentSections.join('\n\n')}`);
      }
    }

    return sections.join('\n\n');
  }

  // ============================================================================
  // PRIVATE SLICE RENDERERS
  // ============================================================================

  private renderSlice(understanding: EssayUnderstanding, slice: ContextSlice): string {
    switch (slice.type) {
      case 'essayDNA':
        return understanding.essayDNA
          ? this.renderEssayDNA(understanding.essayDNA)
          : '';

      case 'paragraphAnalysis':
        return this.renderParagraphAnalysis(understanding, slice.index);

      case 'sentenceBreakdown':
        return this.renderSentenceBreakdown(understanding, slice.paragraphIndex);

      case 'structuralMap':
        return understanding.structuralCartography
          ? this.renderStructuralMap(understanding.structuralCartography)
          : '';

      case 'voiceProfile':
        return understanding.voiceProfileSnapshot
          ? this.renderVoiceProfile(understanding)
          : '';

      case 'conversationInsights':
        return this.renderConversationInsights(understanding, slice.level, slice.index);

      case 'improvementPriorities':
        return understanding.paragraphScoreMatrix
          ? this.renderImprovementPriorities(understanding.paragraphScoreMatrix, slice.paragraphIndex)
          : '';

      case 'crossReferences':
        return this.renderCrossReferences(understanding, slice.paragraphIndex);
    }
  }

  private renderEssayDNA(dna: EssayDNA): string {
    const lines: string[] = [
      '=== ESSAY DNA ===',
      `Thesis: ${dna.thesis}`,
      `Emotional core: ${dna.emotionalCore}`,
      `Student intent: ${dna.studentIntent}`,
      `Committee pitch: ${dna.committeePitch}`,
      `Memorability: ${dna.memorabilityFactor}`,
      `Arc: ${dna.arcType} | Best beat: ${dna.bestBeat}`,
    ];

    if (dna.missingBeat) {
      lines.push(`Missing beat: ${dna.missingBeat}`);
    }

    lines.push(`Voice: ${dna.voiceSignature}`);

    if (dna.authenticPhrases.length > 0) {
      lines.push(`Authentic phrases: "${dna.authenticPhrases.join('", "')}"`);
    }

    if (dna.voiceRisks.length > 0) {
      lines.push(`Voice risks: ${dna.voiceRisks.join('; ')}`);
    }

    lines.push(`Structural strategy: ${dna.structuralStrategy}`);
    lines.push(`EQI: ${dna.overallEQI}/100 | ${dna.impressionLabel} | ${dna.readinessLevel}`);
    lines.push(`Application fit: ${dna.applicationFit}`);

    if (dna.topStrengths.length > 0) {
      lines.push('Strengths:');
      for (const s of dna.topStrengths) {
        lines.push(`  - ${s.quality}: ${s.evidence} [P${s.paragraphs.map(p => p + 1).join(',')}]`);
      }
    }

    if (dna.topImprovements.length > 0) {
      lines.push('Improvements:');
      for (const imp of dna.topImprovements) {
        lines.push(`  - ${imp.quality} (${imp.expectedImpact}): ${imp.currentState} → ${imp.targetState} [P${imp.paragraphs.map(p => p + 1).join(',')}]`);
      }
    }

    return lines.join('\n');
  }

  private renderParagraphAnalysis(understanding: EssayUnderstanding, index: number): string {
    const para = understanding.paragraphs[index];
    if (!para?.deepAnalysis) return '';

    const da = para.deepAnalysis;
    return [
      `=== P${index + 1} DEEP ANALYSIS ===`,
      `Overall: ${da.overallScore}/100 | Top strength: ${da.topStrength} | Top improvement: ${da.topImprovement}`,
      '',
      `[Structural] Role: ${da.structural.actualRole} (intended: ${da.structural.intendedRole}), effectiveness: ${da.structural.roleEffectiveness}/100`,
      `  Placement: ${da.structural.placementVerdict}`,
      `  Essential content: ${da.structural.essentialContent}`,
      da.structural.currentGaps.length > 0 ? `  Gaps: ${da.structural.currentGaps.join('; ')}` : null,
      '',
      `[Rhetoric] Claim: ${da.rhetoric.primaryClaim || 'none'} | Evidence quality: ${da.rhetoric.evidenceQuality}/100`,
      `  Persuasiveness: ${da.rhetoric.persuasiveness}/100 | Unique contribution: ${da.rhetoric.uniqueContribution}`,
      da.rhetoric.redundancyWithOtherParagraphs ? `  Redundancy: ${da.rhetoric.redundancyWithOtherParagraphs}` : null,
      '',
      `[Emotional] Register: ${da.emotional.emotionalRegister} | Authenticity: ${da.emotional.voiceAuthenticity}/100 | Depth: ${da.emotional.emotionalDepth}/100`,
      `  Show vs tell: ${da.emotional.showVsTellVerdict}`,
      da.emotional.strongestEmotionalMoment ? `  Strongest moment: ${da.emotional.strongestEmotionalMoment}` : null,
      da.emotional.emotionalGap ? `  Gap: ${da.emotional.emotionalGap}` : null,
      '',
      `[Craft] Rhythm: ${da.craft.sentenceRhythmAssessment} | Image quality: ${da.craft.imageQuality}/100 | Voice consistency: ${da.craft.voiceConsistency}/100`,
      da.craft.craftStandout ? `  Standout: ${da.craft.craftStandout}` : null,
      da.craft.craftWeakness ? `  Weakness: ${da.craft.craftWeakness}` : null,
      '',
      `[Admissions] ${da.admissionsImpact}`,
    ].filter(line => line !== null).join('\n');
  }

  private renderSentenceBreakdown(understanding: EssayUnderstanding, paragraphIndex: number): string {
    const para = understanding.paragraphs[paragraphIndex];
    if (!para?.deepAnalysis || para.deepAnalysis.sentences.length === 0) return '';

    const lines: string[] = [`=== P${paragraphIndex + 1} SENTENCE BREAKDOWN ===`];
    for (const s of para.deepAnalysis.sentences) {
      const marker = s.isStrength ? '+' : s.issue ? '-' : ' ';
      lines.push(`[${marker}] S${s.index + 1} (${s.role}, eff: ${s.effectiveness}/100): "${truncateText(s.text, 80)}"`);
      if (s.issue) lines.push(`  Issue: ${s.issue}`);
      if (s.suggestion) lines.push(`  Suggestion: ${s.suggestion}`);
      if (s.wordFlags.length > 0) {
        const flags = s.wordFlags.map(f => `"${f.word}" → ${f.alternative}`).join(', ');
        lines.push(`  Word flags: ${flags}`);
      }
    }

    return lines.join('\n');
  }

  private renderStructuralMap(sc: StructuralCartography): string {
    const lines: string[] = [
      '=== STRUCTURAL MAP ===',
      `Arc: ${sc.arcType} (confidence: ${sc.arcConfidence}) — ${sc.arcVerification}`,
      `Theme: ${sc.centralTheme}`,
      `Progression: ${sc.themeProgression}`,
      `Pacing: ${sc.pacingNotes}`,
    ];

    if (sc.thematicGaps.length > 0) {
      lines.push(`Gaps: ${sc.thematicGaps.join('; ')}`);
    }
    if (sc.flatSpots.length > 0) {
      lines.push(`Flat spots: P${sc.flatSpots.map(i => i + 1).join(', P')}`);
    }

    lines.push('');
    lines.push('Paragraph roles:');
    for (const pr of sc.paragraphRoles) {
      lines.push(`  P${pr.index + 1}: ${pr.role} — ${pr.narrativeFunction}${pr.weaknessFlag ? ` [!${pr.weaknessFlag}]` : ''}`);
    }

    if (sc.transitions.length > 0) {
      lines.push('');
      lines.push('Transitions:');
      for (const t of sc.transitions) {
        lines.push(`  P${t.fromParagraph + 1} → P${t.toParagraph + 1}: ${t.quality} (${t.mechanism})`);
      }
    }

    return lines.join('\n');
  }

  private renderVoiceProfile(understanding: EssayUnderstanding): string {
    const vp = understanding.voiceProfileSnapshot;
    if (!vp) return '';

    return [
      '=== VOICE PROFILE ===',
      `Register: ${vp.register.primary}${vp.register.secondary ? ` / ${vp.register.secondary}` : ''} (confidence: ${vp.register.confidence})`,
      `Formality: ${vp.linguistics.formality} | Vocabulary: ${vp.linguistics.vocabularyLevel}`,
      `Avg sentence: ${vp.linguistics.averageSentenceLength} words (variety: ${vp.linguistics.sentenceLengthVariety}/10)`,
      `Fragment use: ${vp.linguistics.fragmentUse}`,
      vp.linguistics.signatureWords.length > 0
        ? `Signature words: ${vp.linguistics.signatureWords.join(', ')}`
        : null,
      `Energy: ${vp.personality.energy} | Humor: ${vp.personality.humor}`,
    ].filter(Boolean).join('\n');
  }

  private renderConversationInsights(
    understanding: EssayUnderstanding,
    level: 'essay' | 'paragraph' | 'sentence',
    index?: number,
  ): string {
    let insights: ConversationInsight[] = [];

    switch (level) {
      case 'essay':
        insights = understanding.conversationInsights;
        break;
      case 'paragraph':
        if (index !== undefined && understanding.paragraphs[index]) {
          insights = understanding.paragraphs[index].conversationInsights;
        }
        break;
      case 'sentence':
        // For sentence level, index encodes paragraphIndex; we collect all sentence insights
        if (index !== undefined && understanding.paragraphs[index]) {
          for (const sent of understanding.paragraphs[index].sentences) {
            insights.push(...sent.conversationInsights);
          }
        }
        break;
    }

    if (insights.length === 0) return '';

    const lines: string[] = [`=== CONVERSATION INSIGHTS (${level}) ===`];
    for (const ins of insights) {
      lines.push(`- [${ins.aspect}] "${truncateText(ins.studentStatement, 80)}" → ${ins.insight}`);
    }

    return lines.join('\n');
  }

  private renderImprovementPriorities(
    matrix: ParagraphScoreMatrix,
    paragraphIndex?: number,
  ): string {
    let priorities = matrix.improvementPriorities;
    if (paragraphIndex !== undefined) {
      priorities = priorities.filter(p =>
        p.target.toLowerCase().includes(`p${paragraphIndex + 1}`) ||
        p.target.toLowerCase().includes(`paragraph ${paragraphIndex + 1}`),
      );
    }

    if (priorities.length === 0) return '';

    const lines: string[] = ['=== IMPROVEMENT PRIORITIES ==='];
    for (const p of priorities) {
      lines.push(`${p.rank}. [${p.expectedImpact}] ${p.target}: ${p.issue}`);
      lines.push(`   Approach: ${p.suggestedApproach}`);
    }

    return lines.join('\n');
  }

  private renderCrossReferences(understanding: EssayUnderstanding, paragraphIndex: number): string {
    if (!understanding.finalUnderstanding) return '';

    const ru = understanding.finalUnderstanding;
    const connections = ru.connections.filter(
      c => c.paragraphs[0] === paragraphIndex || c.paragraphs[1] === paragraphIndex,
    );
    const redundancies = ru.redundancies.filter(
      r => r.paragraphs.includes(paragraphIndex),
    );

    if (connections.length === 0 && redundancies.length === 0) return '';

    const lines: string[] = [`=== CROSS-REFERENCES (P${paragraphIndex + 1}) ===`];

    if (connections.length > 0) {
      lines.push('Connections:');
      for (const c of connections) {
        const other = c.paragraphs[0] === paragraphIndex ? c.paragraphs[1] : c.paragraphs[0];
        lines.push(`  ${c.type} with P${other + 1}: ${c.description}`);
      }
    }

    if (redundancies.length > 0) {
      lines.push('Redundancies:');
      for (const r of redundancies) {
        const others = r.paragraphs.filter(p => p !== paragraphIndex).map(p => `P${p + 1}`);
        lines.push(`  Overlaps with ${others.join(', ')}: ${r.overlappingContent}`);
      }
    }

    return lines.join('\n');
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Renders the full essay text with [P1]/[P2] markers and highlights the target paragraph.
   */
  private renderEssayWithMarkers(understanding: EssayUnderstanding, targetIndex: number): string {
    const lines: string[] = ['=== FULL ESSAY TEXT ==='];

    for (const para of understanding.paragraphs) {
      const marker = `[P${para.index + 1}]`;
      if (para.index === targetIndex) {
        lines.push(`${marker} >>> ANALYZING THIS PARAGRAPH <<<`);
        lines.push(para.text);
        lines.push('>>> END TARGET PARAGRAPH <<<');
      } else {
        lines.push(`${marker} ${para.text}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Renders Layer 1 deterministic metrics for a paragraph.
   */
  private renderLayer1Metrics(para: ParagraphUnderstanding): string {
    const lines: string[] = [
      `=== LAYER 1 METRICS (P${para.index + 1}) ===`,
      `Specificity: ${para.specificityScore}/100 | Scene/summary: ${para.sceneOrSummary}`,
    ];

    if (para.functionAnalysis) {
      lines.push(`Function: ${para.functionAnalysis.primaryFunction} (confidence: ${para.functionAnalysis.confidence})`);
    }

    // Sentence-level metrics summary
    const sentMetrics = para.sentences
      .filter(s => s.metrics)
      .map(s => s.metrics);
    if (sentMetrics.length > 0) {
      const avgWordCount = sentMetrics.reduce((sum, m) => sum + m.wordCount, 0) / sentMetrics.length;
      const passiveCount = sentMetrics.filter(m => m.isPassiveVoice).length;
      const clicheCount = sentMetrics.filter(m => m.hasCliche).length;
      const sensoryCount = sentMetrics.filter(m => m.hasSensoryLanguage).length;
      const concreteCount = sentMetrics.filter(m => m.hasConcreteDetail).length;

      lines.push(`Sentences: ${sentMetrics.length} | Avg words/sent: ${avgWordCount.toFixed(1)}`);
      lines.push(`Passive: ${passiveCount} | Cliches: ${clicheCount} | Sensory: ${sensoryCount} | Concrete: ${concreteCount}`);
    }

    // Word flags summary
    const allFlags = para.sentences.flatMap(s => s.flaggedWords);
    if (allFlags.length > 0) {
      const flagsByCategory = new Map<string, number>();
      for (const fw of allFlags) {
        for (const flag of fw.flags) {
          flagsByCategory.set(flag.category, (flagsByCategory.get(flag.category) || 0) + 1);
        }
      }
      const flagSummary = Array.from(flagsByCategory.entries())
        .map(([cat, count]) => `${cat}:${count}`)
        .join(', ');
      lines.push(`Word flags: ${flagSummary}`);
    }

    return lines.join('\n');
  }

  /**
   * Serializes RunningUnderstanding into readable text.
   */
  private renderRunningUnderstanding(ru: RunningUnderstanding): string {
    const lines: string[] = [
      '=== RUNNING UNDERSTANDING ===',
      `Thesis: ${ru.emergingThesis} (confidence: ${ru.thesisConfidence})`,
    ];

    if (ru.thematicThreads.length > 0) {
      lines.push('Thematic threads:');
      for (const t of ru.thematicThreads) {
        lines.push(`  "${t.thread}" [${t.strength}] — introduced P${t.introducedAt + 1}, last P${t.lastSeenAt + 1}`);
      }
    }

    lines.push(`Arc: ${ru.arcSoFar}`);
    if (ru.arcType) lines.push(`Arc type: ${ru.arcType}`);
    lines.push(`Momentum: ${ru.currentMomentum}`);
    if (ru.turningPointDetected !== null) {
      lines.push(`Turning point at P${ru.turningPointDetected + 1}`);
    }

    // Voice fingerprint
    const vf = ru.voiceFingerprint;
    lines.push(`Voice: ${vf.dominantRegister} (consistency: ${vf.consistencyScore}/100)`);
    if (vf.authenticMoments.length > 0) {
      lines.push(`Authentic moments: "${vf.authenticMoments.slice(0, 3).join('", "')}"`);
    }
    if (vf.voiceDrifts.length > 0) {
      for (const d of vf.voiceDrifts) {
        lines.push(`  Drift at P${d.paragraph + 1}: ${d.from} → ${d.to}`);
      }
    }

    // Emotional journey
    if (ru.emotionalPeak) {
      lines.push(`Emotional peak: P${ru.emotionalPeak.paragraph + 1} — ${ru.emotionalPeak.moment}`);
    }

    // Key strengths/weaknesses
    if (ru.strengthsFound.length > 0) {
      lines.push(`Strengths: ${ru.strengthsFound.map(s => `${s.quality} [P${s.paragraph + 1}]`).join(', ')}`);
    }
    if (ru.weaknessesFound.length > 0) {
      lines.push(`Weaknesses: ${ru.weaknessesFound.map(w => `${w.quality}(${w.severity}) [P${w.paragraph + 1}]`).join(', ')}`);
    }

    // AO takeaway
    lines.push(`AO takeaway: ${ru.aoTakeaway}`);
    if (ru.memorabilityFactor) {
      lines.push(`Memorability: ${ru.memorabilityFactor}`);
    }
    if (ru.revealedQualities.length > 0) {
      lines.push(`Revealed qualities: ${ru.revealedQualities.join(', ')}`);
    }

    return lines.join('\n');
  }

  /**
   * Truncates text to fit within a token budget.
   */
  private truncateToTokenBudget(text: string, maxTokens: number): string {
    const currentTokens = estimateTokens(text);
    if (currentTokens <= maxTokens) return text;

    // Approximate character limit from token budget
    const charLimit = maxTokens * 4;
    const truncated = text.substring(0, charLimit);

    // Try to break at a line boundary
    const lastNewline = truncated.lastIndexOf('\n');
    if (lastNewline > charLimit * 0.7) {
      return truncated.substring(0, lastNewline) + '\n[...truncated]';
    }

    return truncated + '\n[...truncated]';
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/** Truncate text with ellipsis for display */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// ============================================================================
// SINGLETON
// ============================================================================

export const contextBuilder = new ContextBuilder();
