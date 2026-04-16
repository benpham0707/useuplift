/**
 * AnalysisContextBuilder — Smart context retrieval for analysis pipeline.
 *
 * Replaces brute-force profile context dumping in L3.5 (analysis pass) and
 * L5 (annotation service) with paragraph-relevant context selection.
 *
 * The key insight: when scoring/annotating P3, the LLM doesn't need voice
 * shifts at P0, emotional peaks at P5, or earnedness mechanisms from P1→P4.
 * It needs the holistic dimensions that have DATA at P3.
 *
 * Architecture:
 *   1. buildRelevanceIndex() — pre-compute which dimensions matter per paragraph (once)
 *   2. buildSharedDigest() — compact cacheable shared context (essay text + 1-line digests)
 *   3. buildParagraphContext() — paragraph-relevant holistic context (per-call)
 *
 * The shared digest replaces the full holistic profile dump (~3000-5000 tokens)
 * with ~800-1200 tokens of 1-line summaries. Paragraph-specific detail moves
 * from the shared block into per-call context, filtered by relevance.
 */

import type {
  EssayProfile,
  HolisticDimension,
  VoiceShift,
  EarnedMoment,
  EarningMechanism,
  CrossDimensionEntanglement,
  Connection,
  StructuralRole,
} from '../profileTypes';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Pre-computed relevance map for a single paragraph.
 * Built once per analysis pass, reused across all parallel calls.
 */
export interface ParagraphRelevance {
  paragraphIndex: number;
  relevantDimensions: Set<HolisticDimension>;

  // Sliced data — only what's relevant to THIS paragraph
  voiceShiftsHere: VoiceShift[];
  emotionalPeaksHere: Array<{ location: [number, number]; emotion: string; intensity: string }>;
  earnedMomentsHere: EarnedMoment[];
  earningMechanismsFromHere: Array<{ moment: EarnedMoment; mechanism: EarningMechanism }>;
  connectionsInvolving: Connection[];
  entanglementsHere: CrossDimensionEntanglement[];
  thematicThreadsHere: string[];
  pivotPointsHere: Array<{ description: string }>;
  throughLinePointsHere: Array<{ meaningAtPoint: string; narrativeMove: string }>;
  structuralRole: StructuralRole | null;
  craftStrengthsHere: string[];
  craftGrowthEdgesHere: string[];
}

export type AnalysisLayer = 'l3_5' | 'l5';

// ============================================================================
// MAIN CLASS
// ============================================================================

export class AnalysisContextBuilder {

  /**
   * Pre-compute relevance for all paragraphs. Called ONCE before parallel calls.
   * O(P × D) where P = paragraphs, D = total holistic data points.
   */
  buildRelevanceIndex(profile: Readonly<EssayProfile>): Map<number, ParagraphRelevance> {
    const index = new Map<number, ParagraphRelevance>();

    for (let i = 0; i < profile.paragraphs.length; i++) {
      index.set(i, this.computeParagraphRelevance(profile, i));
    }

    return index;
  }

  /**
   * Build the SHARED (cacheable) context block — compact holistic digest.
   * Contains: essay text + 1-line summaries + paragraph roles + connection topology.
   * Replaces the full holistic profile dump.
   */
  buildSharedDigest(profile: Readonly<EssayProfile>, layer: AnalysisLayer): string {
    const parts: string[] = [];

    // Essay text with paragraph/sentence markers (always needed)
    parts.push('=== ESSAY TEXT ===');
    for (const para of profile.paragraphs) {
      parts.push(`\n[P${para.index}]`);
      for (const sentence of para.sentences) {
        parts.push(`  [P${para.index}S${sentence.index}] ${sentence.text}`);
      }
    }

    // Profile index summary
    parts.push('\n=== PROFILE INDEX ===');
    parts.push(
      `Essay: ${profile.index.essayLength.paragraphs} paragraphs, ` +
      `${profile.index.essayLength.sentences} sentences, ` +
      `${profile.index.essayLength.words} words`,
    );
    parts.push(`Confidence: ${profile.index.confidenceLevel}`);

    // Holistic DIGEST — 1-line summaries instead of full sections
    parts.push('\n=== HOLISTIC DIGEST ===');
    if (profile.thematicArchitecture?.centralThesis) {
      parts.push(`Thesis: ${profile.thematicArchitecture.centralThesis} (confidence: ${profile.thematicArchitecture.thesisConfidence})`);
    }
    if (profile.voiceIdentity?.signature) {
      parts.push(`Voice: ${profile.voiceIdentity.signature}`);
    }
    if (profile.voiceMap?.register?.baseline) {
      parts.push(`Register: ${profile.voiceMap.register.baseline}`);
    }
    if (profile.emotionalTopography?.arcTrajectory) {
      parts.push(`Emotional arc: ${profile.emotionalTopography.arcTrajectory}`);
    }
    if (profile.narrativeStrategy?.primaryStrategy) {
      parts.push(`Strategy: ${profile.narrativeStrategy.primaryStrategy}`);
    }
    if (profile.characterRevelation?.writerPortrait) {
      parts.push(`Character: ${profile.characterRevelation.writerPortrait.slice(0, 150)}`);
    }
    if (profile.admissionsPositioning?.tellabilitySummary) {
      parts.push(`AO takeaway: ${profile.admissionsPositioning.tellabilitySummary}`);
    }
    if (profile.craftAssessment?.sentencePatterns) {
      parts.push(`Craft patterns: ${profile.craftAssessment.sentencePatterns}`);
    }
    if (profile.momentEarnednessMap?.structuralObservation) {
      parts.push(`Earnedness: ${profile.momentEarnednessMap.structuralObservation}`);
    }

    // Voice shift count (quick signal — detail goes in paragraph blocks)
    const shiftCount = profile.voiceMap?.shifts?.length ?? 0;
    if (shiftCount > 0) {
      parts.push(`Voice shifts: ${shiftCount} detected`);
    }

    // Entanglement count
    const entanglementCount = profile.entanglements?.length ?? 0;
    if (entanglementCount > 0) {
      parts.push(`Entanglements: ${entanglementCount} cross-dimension moments`);
    }

    // Paragraph role map (1 line per paragraph — always needed for cross-calibration)
    parts.push('\n=== PARAGRAPH ROLES ===');
    for (const para of profile.paragraphs) {
      if (para.understanding) {
        parts.push(`P${para.index}: ${para.understanding.role} — ${para.understanding.function}`);
      }
    }

    // Connection topology (compact — from→to + tags, no descriptions)
    const activeConns = profile.connections?.all.filter(c => c.status === 'active') ?? [];
    if (activeConns.length > 0) {
      parts.push(`\n=== CONNECTIONS (${activeConns.length} active) ===`);
      for (const conn of activeConns) {
        parts.push(`  P${conn.from.paragraph}→P${conn.to.paragraph} [${conn.routingTags.join(',')}] (${conn.strengthCategory})`);
      }
    }

    // L5-only additions: North Star summary (needed for every annotation's northStarConnection)
    if (layer === 'l5' && profile.northStar) {
      parts.push('\n=== NORTH STAR (summary) ===');
      if (profile.northStar.throughLineMap) {
        parts.push(`Through-line: ${profile.northStar.throughLineMap.centralElement} — ${profile.northStar.throughLineMap.transformation}`);
      }
      if (profile.northStar.structuralRolesMap.length > 0) {
        parts.push('Structural roles:');
        for (const role of profile.northStar.structuralRolesMap) {
          parts.push(`  P${role.paragraphs.join('+P')}: ${role.role} [${role.weight}]`);
        }
      }
      if (profile.northStar.distinctivenessSignature?.articulation) {
        parts.push(`Distinctiveness: ${profile.northStar.distinctivenessSignature.articulation}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Build paragraph-specific context using task-aware compression.
   *
   * NOT a filter (include/exclude) — a contextualizer. Every holistic dimension
   * is ALWAYS represented, compressed to what matters for evaluating THIS paragraph.
   * Includes: progression context (what happens before/at/after), absence signals
   * (what's NOT here that's elsewhere), and cross-paragraph dependencies.
   *
   * The LLM always gets the complete picture for this paragraph's neighborhood,
   * not just events that happen to exist at this paragraph index.
   */
  buildParagraphContext(
    profile: Readonly<EssayProfile>,
    paragraphIndex: number,
    relevance: ParagraphRelevance,
    layer: AnalysisLayer,
  ): string {
    const pi = paragraphIndex;
    const parts: string[] = [];
    parts.push(`=== P${pi} HOLISTIC CONTEXT ===`);

    // ── STRUCTURAL ROLE (always) ──
    if (relevance.structuralRole) {
      parts.push(`\nSTRUCTURAL ROLE: ${relevance.structuralRole.role} [${relevance.structuralRole.weight}]`);
      parts.push(`  ${relevance.structuralRole.significance}`);
    } else {
      parts.push(`\nSTRUCTURAL ROLE: No specific role assigned to P${pi}.`);
    }

    // ── VOICE — progression through this paragraph ──
    const allShifts = profile.voiceMap?.shifts ?? [];
    const shiftsBefore = allShifts.filter(s => s.location?.paragraph !== undefined && s.location.paragraph < pi);
    const shiftsHere = relevance.voiceShiftsHere;
    const shiftsAfter = allShifts.filter(s => s.location?.paragraph !== undefined && s.location.paragraph > pi);
    const stabilityRegion = (profile.voiceMap?.stabilityRegions ?? []).find(
      r => r.paragraphs.includes(pi),
    );

    parts.push('\nVOICE AT P' + pi + ':');
    if (shiftsHere.length > 0) {
      for (const shift of shiftsHere) {
        parts.push(
          `  SHIFT here: ${shift.fromDescription ?? '?'} → ${shift.toDescription ?? '?'}` +
          (shift.intentionality ? ` (${shift.intentionality.assessment})` : ''),
        );
      }
    } else if (stabilityRegion) {
      parts.push(`  STABLE — part of stability region P${stabilityRegion.paragraphs.join('-P')}: "${stabilityRegion.voiceCharacter}"`);
    } else {
      parts.push(`  No shift detected at P${pi}.`);
    }
    // Neighboring shifts for arc context
    const nearestBefore = shiftsBefore.length > 0 ? shiftsBefore[shiftsBefore.length - 1] : null;
    const nearestAfter = shiftsAfter.length > 0 ? shiftsAfter[0] : null;
    if (nearestBefore) {
      parts.push(`  Prior shift at P${nearestBefore.location?.paragraph}: ${nearestBefore.fromDescription} → ${nearestBefore.toDescription}`);
    }
    if (nearestAfter) {
      parts.push(`  Next shift at P${nearestAfter.location?.paragraph}: ${nearestAfter.fromDescription} → ${nearestAfter.toDescription}`);
    }

    // ── EMOTIONAL — progression through this paragraph ──
    const emotionalProg = profile.emotionalTopography?.emotionalProgression ?? [];
    const prevEmotion = emotionalProg.find(p => p.paragraph === pi - 1);
    const hereEmotion = emotionalProg.find(p => p.paragraph === pi);
    const nextEmotion = emotionalProg.find(p => p.paragraph === pi + 1);
    const peaksHere = relevance.emotionalPeaksHere;
    const showTellHere = (profile.emotionalTopography?.showVsTell ?? []).filter(
      s => s.location[0] === pi,
    );

    parts.push('\nEMOTION AT P' + pi + ':');
    // Arc progression: previous → here → next
    const arcParts: string[] = [];
    if (prevEmotion) arcParts.push(`P${pi - 1}: ${prevEmotion.register}`);
    if (hereEmotion) arcParts.push(`P${pi}: ${hereEmotion.register}${hereEmotion.shift ? ` (${hereEmotion.shift})` : ''}`);
    if (nextEmotion) arcParts.push(`P${pi + 1}: ${nextEmotion.register}`);
    if (arcParts.length > 0) {
      parts.push(`  Progression: ${arcParts.join(' → ')}`);
    }
    if (peaksHere.length > 0) {
      for (const peak of peaksHere) {
        parts.push(`  PEAK at P${peak.location[0]}S${peak.location[1]}: ${peak.emotion} (${peak.intensity})`);
      }
    } else {
      // Note absence if neighboring paragraphs have peaks
      const nearbyPeaks = (profile.emotionalTopography?.peakMoments ?? []).filter(
        p => Math.abs(p.location[0] - pi) <= 1 && p.location[0] !== pi,
      );
      if (nearbyPeaks.length > 0) {
        parts.push(`  No peak here. Neighboring peaks: ${nearbyPeaks.map(p => `P${p.location[0]}: ${p.emotion}`).join(', ')}`);
      }
    }
    if (showTellHere.length > 0) {
      parts.push(`  Show/tell: ${showTellHere.map(s => `S${s.location[1]}: ${s.assessment}`).join(', ')}`);
    }

    // ── EARNEDNESS — moments at and earned by this paragraph ──
    const momentsHere = relevance.earnedMomentsHere;
    const earningFromHere = relevance.earningMechanismsFromHere;
    if (momentsHere.length > 0 || earningFromHere.length > 0) {
      parts.push('\nEARNEDNESS:');
      for (const m of momentsHere) {
        const gapNote = m.gaps.length > 0 ? ` | GAPS: ${m.gaps.join('; ')}` : '';
        parts.push(`  Moment here P${m.location.paragraph}S${m.location.sentence}: ${m.description} [${m.mechanisms.length} mechanisms${gapNote}]`);
        if (layer === 'l5') {
          for (const mech of m.mechanisms.slice(0, 3)) {
            parts.push(`    ${mech.type} from P${mech.location.paragraph}: ${mech.contribution.slice(0, 100)}`);
          }
        }
      }
      for (const { moment, mechanism } of earningFromHere) {
        parts.push(`  P${pi} earns P${moment.location.paragraph}S${moment.location.sentence} via ${mechanism.type}: ${mechanism.contribution.slice(0, 80)}`);
      }
    } else {
      // Check if this paragraph SHOULD be earning something but isn't
      const allMoments = profile.momentEarnednessMap?.moments ?? [];
      const momentsThisCouldEarn = allMoments.filter(m =>
        m.location.paragraph > pi && m.gaps.length > 0,
      );
      if (momentsThisCouldEarn.length > 0) {
        parts.push(`\nEARNEDNESS: P${pi} doesn't earn any moments. Note: P${momentsThisCouldEarn[0].location.paragraph} has ${momentsThisCouldEarn[0].gaps.length} gap(s) — this paragraph might be the place to address them.`);
      }
    }

    // ── THROUGH-LINE ──
    if (relevance.throughLinePointsHere.length > 0) {
      parts.push('\nTHROUGH-LINE:');
      for (const pt of relevance.throughLinePointsHere) {
        parts.push(`  ${pt.narrativeMove}: ${pt.meaningAtPoint}`);
      }
    } else {
      // Check if through-line is active nearby
      const journey = profile.northStar?.throughLineMap?.journey ?? [];
      const nearbyPoints = journey.filter(j => Math.abs(j.location.paragraph - pi) <= 1);
      if (nearbyPoints.length > 0 && journey.length > 0) {
        parts.push(`\nTHROUGH-LINE: Not active at P${pi}. Active at: ${nearbyPoints.map(j => `P${j.location.paragraph} (${j.narrativeMove})`).join(', ')}`);
      }
    }

    // ── CONNECTIONS involving this paragraph ──
    if (relevance.connectionsInvolving.length > 0) {
      parts.push(`\nCONNECTIONS (${relevance.connectionsInvolving.length}):`);
      for (const conn of relevance.connectionsInvolving.slice(0, 5)) {
        parts.push(`  P${conn.from.paragraph}→P${conn.to.paragraph} [${conn.routingTags.join(',')}]: ${conn.description.slice(0, 120)}`);
      }
    }

    // ── ENTANGLEMENTS ──
    if (relevance.entanglementsHere.length > 0) {
      parts.push('\nENTANGLEMENTS:');
      for (const e of relevance.entanglementsHere) {
        parts.push(`  [${e.dimensions.join('+')}] ${e.description.slice(0, 120)}`);
      }
    }

    // ── THEMATIC THREADS ──
    if (relevance.thematicThreadsHere.length > 0) {
      parts.push(`\nTHREADS: ${relevance.thematicThreadsHere.join(', ')}`);
    }

    // ── NARRATIVE PIVOTS ──
    if (relevance.pivotPointsHere.length > 0) {
      parts.push(`\nNARRATIVE PIVOT: ${relevance.pivotPointsHere.map(p => p.description).join('; ')}`);
    }

    // ── CRAFT at this paragraph ──
    if (relevance.craftStrengthsHere.length > 0 || relevance.craftGrowthEdgesHere.length > 0) {
      parts.push('\nCRAFT:');
      if (relevance.craftStrengthsHere.length > 0) {
        parts.push(`  Strengths: ${relevance.craftStrengthsHere.join('; ')}`);
      }
      if (relevance.craftGrowthEdgesHere.length > 0) {
        parts.push(`  Growth edges: ${relevance.craftGrowthEdgesHere.join('; ')}`);
      }
    }

    return parts.join('\n');
  }

  // --------------------------------------------------------------------------
  // PRIVATE: Relevance computation
  // --------------------------------------------------------------------------

  private computeParagraphRelevance(
    profile: Readonly<EssayProfile>,
    paragraphIndex: number,
  ): ParagraphRelevance {
    const relevantDimensions = new Set<HolisticDimension>();

    // Voice shifts at this paragraph
    const voiceShiftsHere = (profile.voiceMap?.shifts ?? []).filter(
      s => s.location?.paragraph === paragraphIndex,
    );
    if (voiceShiftsHere.length > 0) relevantDimensions.add('voice');

    // Emotional peaks at this paragraph
    const emotionalPeaksHere = (profile.emotionalTopography?.peakMoments ?? []).filter(
      p => p.location[0] === paragraphIndex,
    );
    if (emotionalPeaksHere.length > 0) relevantDimensions.add('emotion');

    // Earned moments AT this paragraph
    const earnedMomentsHere = (profile.momentEarnednessMap?.moments ?? []).filter(
      m => m.location.paragraph === paragraphIndex,
    );
    if (earnedMomentsHere.length > 0) {
      relevantDimensions.add('emotion');
      relevantDimensions.add('narrative');
    }

    // Earning mechanisms FROM this paragraph (this paragraph earns a moment elsewhere)
    const earningMechanismsFromHere: Array<{ moment: EarnedMoment; mechanism: EarningMechanism }> = [];
    for (const moment of profile.momentEarnednessMap?.moments ?? []) {
      for (const mech of moment.mechanisms) {
        if (mech.location.paragraph === paragraphIndex) {
          earningMechanismsFromHere.push({ moment, mechanism: mech });
        }
      }
    }
    if (earningMechanismsFromHere.length > 0) {
      relevantDimensions.add('narrative');
    }

    // Connections involving this paragraph
    const connectionsInvolving = (profile.connections?.all ?? []).filter(
      c => c.status === 'active' &&
        (c.from.paragraph === paragraphIndex || c.to.paragraph === paragraphIndex),
    );
    if (connectionsInvolving.length > 0) {
      // Infer dimensions from routing tags
      for (const conn of connectionsInvolving) {
        for (const tag of conn.routingTags) {
          if (tag === 'structural') relevantDimensions.add('structure');
          if (tag === 'thematic') relevantDimensions.add('theme');
          if (tag === 'earning' || tag === 'emotional') relevantDimensions.add('emotion');
          if (tag === 'contrastive' || tag === 'narrative') relevantDimensions.add('narrative');
          if (tag === 'voice') relevantDimensions.add('voice');
        }
      }
    }

    // Entanglements at this paragraph
    const entanglementsHere = (profile.entanglements ?? []).filter(
      e => e.location.paragraph === paragraphIndex,
    );
    if (entanglementsHere.length > 0) {
      for (const e of entanglementsHere) {
        for (const dim of e.dimensions) {
          relevantDimensions.add(dim);
        }
      }
    }

    // Thematic threads at this paragraph
    const thematicThreadsHere: string[] = [];
    for (const thread of profile.thematicArchitecture?.threads ?? []) {
      if (
        thread.introducedAt.paragraph === paragraphIndex ||
        thread.appearances?.some(a => a.paragraph === paragraphIndex)
      ) {
        thematicThreadsHere.push(thread.thread);
        relevantDimensions.add('theme');
      }
    }

    // Pivot points at this paragraph
    const pivotPointsHere = (profile.narrativeStrategy?.pivotPoints ?? []).filter(
      p => p.location.paragraph === paragraphIndex,
    );
    if (pivotPointsHere.length > 0) relevantDimensions.add('narrative');

    // Through-line journey points at this paragraph
    const throughLinePointsHere = (profile.northStar?.throughLineMap?.journey ?? [])
      .filter(j => j.location.paragraph === paragraphIndex)
      .map(j => ({ meaningAtPoint: j.meaningAtPoint, narrativeMove: String(j.narrativeMove) }));
    if (throughLinePointsHere.length > 0) {
      relevantDimensions.add('narrative');
      relevantDimensions.add('theme');
    }

    // Structural role covering this paragraph
    const structuralRole = (profile.northStar?.structuralRolesMap ?? []).find(
      r => r.paragraphs.includes(paragraphIndex),
    ) ?? null;
    if (structuralRole) relevantDimensions.add('structure');

    // Craft strengths/growth edges at this paragraph
    const craftStrengthsHere = (profile.craftAssessment?.strengthSignatures ?? [])
      .filter(s => s.paragraphs.includes(paragraphIndex))
      .map(s => `${s.quality}: ${s.evidence.slice(0, 60)}`);
    const craftGrowthEdgesHere = (profile.craftAssessment?.growthEdges ?? [])
      .filter(g => g.paragraphs.includes(paragraphIndex))
      .map(g => `${g.quality}: ${g.description.slice(0, 60)}`);
    if (craftStrengthsHere.length > 0 || craftGrowthEdgesHere.length > 0) {
      relevantDimensions.add('craft');
    }

    return {
      paragraphIndex,
      relevantDimensions,
      voiceShiftsHere,
      emotionalPeaksHere,
      earnedMomentsHere,
      earningMechanismsFromHere,
      connectionsInvolving,
      entanglementsHere,
      thematicThreadsHere,
      pivotPointsHere: pivotPointsHere.map(p => ({ description: p.description })),
      throughLinePointsHere,
      structuralRole,
      craftStrengthsHere,
      craftGrowthEdgesHere,
    };
  }
}

export const analysisContextBuilder = new AnalysisContextBuilder();
