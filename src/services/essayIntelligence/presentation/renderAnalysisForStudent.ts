/**
 * renderAnalysisForStudent — Produces the student-facing analysis document.
 *
 * This is the document the student sees BEFORE entering coaching conversations.
 * It transforms the internal EssayProfile into a structured, readable analysis
 * that answers the student's natural questions in order:
 *   1. "What would an AO think?" (committee one-liner + gut reaction)
 *   2. "What does my essay look like to an expert?" (annotated essay)
 *   3. "What should I fix first?" (revision priorities)
 *   4. "How does my essay work structurally?" (structural map)
 *   5. "Where am I overall?" (assessment + phase + strengths + portrait)
 *
 * NO LLM calls. Pure transformation of existing profile data.
 * Same input → same output (deterministic).
 */

import type { EssayProfile, Finding } from '../profileTypes';
import type {
  StudentAnalysisDocument,
  AOReactionSection,
  AnnotatedEssaySection,
  AnnotatedParagraph,
  InlineAnnotation,
  RevisionPriority,
  StructuralMapEntry,
  OverallAssessmentSection,
  RenderOptions,
} from './types';

// ============================================================================
// TECHNIQUE ROUTE NAMES (subset for student-facing display)
// ============================================================================

const TECHNIQUE_DISPLAY_NAMES: Record<string, string> = {
  'SUMMARY-TO-SCENE': 'Summary → Scene',
  'COLD OPEN / SENSORY TIMESTAMP': 'Sensory Opening',
  'SOMATIC VULNERABILITY': 'Physical Detail',
  'NAMED CHARACTER': 'Named People',
  'EVIDENCE ANCHORING': 'Evidence Grounding',
  'COLLABORATIVE SPECIFICITY': 'Collaborative Credit',
  'RITUAL DETAIL / BOOKEND INVERSION': 'Earned Closing',
  'VOICE COMPARISON': 'Voice Consistency',
  'FUNCTIONAL DETAIL': 'Purposeful Detail',
  'ANTI-LESSON': 'Honest Growth',
  'STAKES ESTABLISHMENT': 'Real Stakes',
  'SCENE EXPANSION': 'Expand Key Moments',
  'BRIDGE SENTENCE': 'Transition Bridge',
  'DEFINITIONAL PIVOT': 'Own Your Words',
  'SUSTAINED VULNERABILITY': 'Emotional Honesty',
  'NARRATIVE ARC': 'Story Arc',
  'ENACTED PARALLEL': 'Show the Connection',
};

// ============================================================================
// PHASE TRANSLATIONS
// ============================================================================

const PHASE_STUDENT_LANGUAGE: Record<string, { name: string; explanation: string }> = {
  foundation: {
    name: 'Foundation',
    explanation: 'Your essay has an idea worth developing, but it needs concrete scenes and specific evidence before we can refine the writing. Right now the reader hears your thesis — they need to experience it.',
  },
  architecture: {
    name: 'Architecture',
    explanation: 'Your essay has a clear identity, but the reader\'s journey has gaps. Some paragraphs earn the reader\'s attention; others lose it. We need to fix the structure before polishing the sentences.',
  },
  craft: {
    name: 'Craft',
    explanation: 'Your structure works. Now each sentence needs to carry its weight. We\'re looking at word choices, verb patterns, and the specific moments where generic language replaces specific observation.',
  },
  polish: {
    name: 'Polish',
    explanation: 'Your essay is strong. We\'re in precision mode — every word, every rhythm, every transition. The goal: make this the essay the AO remembers.',
  },
  distinction: {
    name: 'Distinction',
    explanation: 'Your essay is competitive. The question now: what makes this the essay the admissions committee brings up in discussion? We\'re looking for the moments that are unmistakably YOU.',
  },
};

// ============================================================================
// STRUCTURAL ROLE TRANSLATIONS
// ============================================================================

function translateStructuralRole(role: string, paragraphIndex: number, totalParagraphs: number): string {
  const lower = role.toLowerCase();

  if (paragraphIndex === 0 || lower.includes('hook') || lower.includes('opening') || lower.includes('establishment')) {
    return 'Your opening — where you have 3 seconds to keep the reader';
  }
  if (paragraphIndex === totalParagraphs - 1 || lower.includes('close') || lower.includes('resolution') || lower.includes('aspiration')) {
    return 'Your closing — the last thing the reader remembers';
  }
  if (lower.includes('fulcrum') || lower.includes('pivot') || lower.includes('turn')) {
    return 'The turning point — your essay pivots here';
  }
  if (lower.includes('evidence') || lower.includes('proof') || lower.includes('demonstration')) {
    return 'Where you show your evidence — the concrete proof';
  }
  if (lower.includes('bridge') || lower.includes('transition')) {
    return 'The bridge — connects two parts of your story';
  }
  if (lower.includes('synthesis') || lower.includes('connection')) {
    return 'Where you connect the threads';
  }
  // Fallback: use the role itself, cleaned up
  return role.replace(/_/g, ' ');
}

function translateStructuralWeight(weight: string): 'load-bearing' | 'supporting' | 'transitional' | 'decorative' {
  const lower = weight.toLowerCase();
  if (lower.includes('load') || lower.includes('critical') || lower.includes('essential')) return 'load-bearing';
  if (lower.includes('support')) return 'supporting';
  if (lower.includes('transition')) return 'transitional';
  if (lower.includes('decorat') || lower.includes('nice')) return 'decorative';
  return 'supporting'; // default
}

// ============================================================================
// MAIN RENDER FUNCTION
// ============================================================================

export function renderAnalysisForStudent(
  profile: Readonly<EssayProfile>,
  options: RenderOptions = { mode: 'initial' },
): StudentAnalysisDocument {
  const maxPriorities = options.maxPriorities ?? 5;

  return {
    committeeOneLiner: buildCommitteeOneLiner(profile),
    aoReaction: buildAOReaction(profile),
    annotatedEssay: buildAnnotatedEssay(profile),
    revisionPriorities: buildRevisionPriorities(profile, maxPriorities),
    structuralMap: buildStructuralMap(profile),
    overallAssessment: buildOverallAssessment(profile),
    meta: {
      essayWordCount: profile.paragraphs.reduce((sum, p) => sum + p.text.split(/\s+/).length, 0),
      paragraphCount: profile.paragraphs.length,
      improvementPhase: profile.index.improvementPhase?.level ?? 'foundation',
      analysisConfidence: profile.index.confidenceLevel ?? 'initial',
      generatedAt: new Date().toISOString(),
    },
  };
}

// ============================================================================
// SECTION BUILDERS
// ============================================================================

function buildCommitteeOneLiner(profile: Readonly<EssayProfile>): string {
  if (profile.aoFirstRead?.committeeOneLiner) {
    return profile.aoFirstRead.committeeOneLiner;
  }
  // Fallback: construct from archetype
  const archetype = profile.admissionsPositioning?.archetypeContext?.archetype;
  if (archetype) return `Student writing a "${archetype}" essay`;
  return 'Essay analysis complete — see details below';
}

function buildAOReaction(profile: Readonly<EssayProfile>): AOReactionSection {
  const ao = profile.aoFirstRead;
  const archCtx = profile.admissionsPositioning?.archetypeContext;

  const poolDensityMap: Record<string, string> = {
    saturated: 'AOs read dozens of essays like this every cycle.',
    common: 'This essay type is common — AOs see many similar versions.',
    moderate: 'This essay type appears regularly but isn\'t overwhelming.',
    rare: 'This is an uncommon essay approach — the reader\'s attention is less fatigued.',
  };

  return {
    gutReaction: ao?.gutReaction ?? 'No AO reaction available.',
    putDownRisk: (ao?.putDownRisk as 'high' | 'moderate' | 'low') ?? 'moderate',
    hookMoment: ao?.hookMoment ?? null,
    archetype: archCtx?.archetype ?? 'unclassified',
    archetypeFrequency: poolDensityMap[archCtx?.poolDensity ?? ''] ?? '',
  };
}

function buildAnnotatedEssay(profile: Readonly<EssayProfile>): AnnotatedEssaySection {
  const paragraphs: AnnotatedParagraph[] = [];

  for (const para of profile.paragraphs) {
    const annotations: InlineAnnotation[] = [];

    // Use findings scoped to this paragraph as inline annotations
    const paraFindings = profile.findings.filter(f =>
      f.status === 'active' &&
      f.scope.type === 'paragraph' &&
      f.scope.paragraph === para.index,
    );

    for (const finding of paraFindings.slice(0, 2)) {
      // Try to extract a span from the finding's evidence
      const spanText = finding.evidence?.[0]?.text?.slice(0, 60) ?? para.text.slice(0, 50);
      annotations.push({
        spanText,
        observation: finding.claim,
        nature: finding.coachingValue === 'contextual' ? 'strength' : 'growth',
        priorityRef: null, // TODO: cross-reference with revision priorities
      });
    }

    // Also add strength annotations from craft assessment
    const craftStrengths = (profile.craftAssessment?.strengthSignatures ?? [])
      .filter(s => s.paragraphs.includes(para.index));
    for (const strength of craftStrengths.slice(0, 1)) {
      annotations.push({
        spanText: strength.evidence.slice(0, 60),
        observation: `Strength: ${strength.quality}`,
        nature: 'strength',
        priorityRef: null,
      });
    }

    paragraphs.push({
      index: para.index,
      text: para.text,
      inlineAnnotations: annotations,
    });
  }

  const totalAnnotations = paragraphs.reduce((sum, p) => sum + p.inlineAnnotations.length, 0);

  return {
    paragraphs,
    annotationCount: totalAnnotations,
  };
}

function buildRevisionPriorities(
  profile: Readonly<EssayProfile>,
  maxPriorities: number,
): RevisionPriority[] {
  const priorities: RevisionPriority[] = [];

  // Primary source: coachingMap priorities
  const coachingPriorities = profile.scoreMatrix?.coachingMap?.priorities ?? [];
  for (const cp of coachingPriorities.slice(0, maxPriorities)) {
    priorities.push({
      rank: priorities.length + 1,
      title: cp.action ?? cp.architecturalReason ?? 'Revision needed',
      whyItMatters: cp.architecturalReason ?? '',
      paragraphs: cp.paragraphs ?? [],
      craftTechnique: matchTechniqueForPriority(cp.action ?? '', profile),
      impact: cp.expectedImpact === 'high' ? 'transformative'
        : cp.expectedImpact === 'medium' ? 'significant'
        : 'incremental',
    });
  }

  // Fallback: build from active findings if no coaching map
  if (priorities.length === 0) {
    const activeFindings = profile.findings
      .filter(f => f.status === 'active')
      .sort((a, b) => {
        const order: Record<string, number> = { critical: 0, high: 1, medium: 2, contextual: 3, diagnostic: 4 };
        return (order[a.coachingValue] ?? 2) - (order[b.coachingValue] ?? 2);
      })
      .slice(0, maxPriorities);

    for (const finding of activeFindings) {
      const paragraphs = finding.scope.type === 'paragraph'
        ? [finding.scope.paragraph ?? 0]
        : finding.scope.type === 'cross_paragraph'
        ? (finding.scope.paragraphs ?? [])
        : [];

      priorities.push({
        rank: priorities.length + 1,
        title: finding.claim,
        whyItMatters: finding.evidence?.[0]?.text ?? '',
        paragraphs,
        craftTechnique: matchTechniqueForFinding(finding),
        impact: finding.coachingValue === 'critical' ? 'transformative'
          : finding.coachingValue === 'high' ? 'significant'
          : 'incremental',
      });
    }
  }

  return priorities;
}

function matchTechniqueForPriority(action: string, _profile: Readonly<EssayProfile>): string {
  const lower = action.toLowerCase();
  if (lower.includes('scene') || lower.includes('summary')) return 'Summary → Scene';
  if (lower.includes('opening') || lower.includes('hook')) return 'Sensory Opening';
  if (lower.includes('ending') || lower.includes('closing') || lower.includes('ritual')) return 'Earned Closing';
  if (lower.includes('specific') || lower.includes('detail') || lower.includes('evidence')) return 'Evidence Grounding';
  if (lower.includes('parallel') || lower.includes('connection')) return 'Show the Connection';
  if (lower.includes('collaborat') || lower.includes('team') || lower.includes('solo')) return 'Collaborative Credit';
  if (lower.includes('expand') || lower.includes('compress') || lower.includes('pacing')) return 'Expand Key Moments';
  if (lower.includes('voice') || lower.includes('register')) return 'Voice Consistency';
  return 'Craft Improvement';
}

function matchTechniqueForFinding(finding: Finding): string {
  const lower = finding.claim.toLowerCase();
  for (const [keyword, display] of Object.entries(TECHNIQUE_DISPLAY_NAMES)) {
    // Simple keyword matching against finding claim
    const keywords = keyword.toLowerCase().split(/[\/\s]+/);
    if (keywords.some(kw => kw.length > 3 && lower.includes(kw))) {
      return display;
    }
  }
  return 'Craft Improvement';
}

function buildStructuralMap(profile: Readonly<EssayProfile>): StructuralMapEntry[] {
  const entries: StructuralMapEntry[] = [];
  const totalParagraphs = profile.paragraphs.length;

  for (const para of profile.paragraphs) {
    // Find structural role from North Star
    const nsRole = (profile.northStar?.structuralRolesMap ?? []).find(
      r => r.paragraphs.includes(para.index),
    );

    // Get analysis verdict if available
    const analysis = para.analysis;
    const verdict = analysis?.paragraphVerdict ?? para.understanding?.role ?? '';

    entries.push({
      paragraphIndex: para.index,
      role: nsRole
        ? translateStructuralRole(nsRole.role, para.index, totalParagraphs)
        : translateStructuralRole(para.understanding?.role ?? 'unknown', para.index, totalParagraphs),
      effectiveness: verdict,
      weight: nsRole
        ? translateStructuralWeight(nsRole.weight)
        : (para.index === 0 || para.index === totalParagraphs - 1 ? 'load-bearing' : 'supporting'),
    });
  }

  return entries;
}

function buildOverallAssessment(profile: Readonly<EssayProfile>): OverallAssessmentSection {
  const phase = profile.index.improvementPhase;
  const phaseKey = phase?.level ?? 'foundation';
  const phaseInfo = PHASE_STUDENT_LANGUAGE[phaseKey] ?? PHASE_STUDENT_LANGUAGE.foundation;

  // Strengths from coaching map protected strengths or craft assessment
  const strengths: string[] = [];
  const protectedStrengths = profile.scoreMatrix?.coachingMap?.protectedStrengths ?? [];
  for (const ps of protectedStrengths.slice(0, 3)) {
    strengths.push(typeof ps === 'string' ? ps : (ps as any).strength ?? String(ps));
  }
  // Fallback: craft strengths
  if (strengths.length === 0) {
    for (const sig of (profile.craftAssessment?.strengthSignatures ?? []).slice(0, 3)) {
      strengths.push(`${sig.quality} (${sig.evidence.slice(0, 60)})`);
    }
  }

  return {
    phase: phaseInfo.name,
    phaseExplanation: phase?.reasoning
      ? `${phaseInfo.explanation}\n\n${phase.reasoning}`
      : phaseInfo.explanation,
    strengths: strengths.length > 0 ? strengths : ['Analysis in progress — strengths will be identified after full review'],
    centralIdea: profile.thematicArchitecture?.centralThesis ?? 'Central idea not yet identified',
    distinctiveness: profile.northStar?.distinctivenessSignature?.articulation
      ?? profile.admissionsPositioning?.archetypeContext?.differentiator
      ?? 'Distinctiveness analysis pending',
    writerPortrait: profile.characterRevelation?.writerPortrait ?? 'Writer portrait not yet generated',
  };
}
