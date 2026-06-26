/**
 * renderAnalysisForStudent — Produces the student-facing analysis document.
 *
 * This is the document the student sees BEFORE entering coaching conversations.
 * It transforms the internal EssayProfile into a structured, readable analysis
 * that answers the student's natural questions in order:
 *   1. "What does my essay look like to an expert?" (annotated essay)
 *   2. "What should I fix first?" (revision priorities)
 *   3. "How does my essay work structurally?" (structural map)
 *   4. "Where am I overall?" (assessment + phase + strengths + portrait)
 *
 * NO LLM calls. Pure transformation of existing profile data.
 * Same input → same output (deterministic).
 */

import type { EssayProfile, Finding } from '../profileTypes';
import type { L5AnnotationResult, L5Annotation } from '../analysis/deepAnnotationService';
import type {
  StudentAnalysisDocument,
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
  annotations?: L5AnnotationResult | null,
): StudentAnalysisDocument {
  const maxPriorities = options.maxPriorities ?? 5;

  // Priorities first — the annotated essay links each paragraph's growth note to
  // the deep priority that covers it (emit-don't-transform: reference the
  // counselor-grade coaching, don't re-derive a shallow copy of it inline).
  const revisionPriorities = buildRevisionPriorities(profile, maxPriorities);

  return {
    annotatedEssay: buildAnnotatedEssay(profile, revisionPriorities, annotations),
    revisionPriorities,
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

function buildAnnotatedEssay(
  profile: Readonly<EssayProfile>,
  priorities: readonly RevisionPriority[],
  l5?: L5AnnotationResult | null,
): AnnotatedEssaySection {
  const paragraphs: AnnotatedParagraph[] = [];

  // paragraph index → rank of the FIRST revision priority that covers it, so a
  // paragraph's note can point the student to the full coaching block.
  const priorityByPara = new Map<number, number>();
  for (const p of priorities) {
    for (const pi of p.paragraphs) {
      if (!priorityByPara.has(pi)) priorityByPara.set(pi, p.rank);
    }
  }

  // The REAL inline annotations: per-span L5 notes (a note on a SPECIFIC sentence,
  // each with a model rewrite in the student's voice). Grouped by paragraph,
  // surfaced subset only. When present, these ARE the annotated essay. The
  // paragraph-level strength/growth summary below is only a fallback for when L5
  // didn't run — it is NOT the inline-annotation experience.
  const l5ByPara = new Map<number, L5Annotation[]>();
  for (const grp of l5?.paragraphAnnotations ?? []) {
    const surfaced = (grp.annotations ?? []).filter(
      (a) => a.surfaced !== false && (a.content ?? '').trim().length > 0,
    );
    if (surfaced.length > 0) l5ByPara.set(grp.paragraphIndex, surfaced);
  }
  const haveL5 = l5ByPara.size > 0;

  for (const para of profile.paragraphs) {
    const annotations: InlineAnnotation[] = [];
    const seen = new Set<string>();
    const add = (a: InlineAnnotation): void => {
      const key = a.observation.trim().toLowerCase().slice(0, 100);
      if (!a.observation.trim() || seen.has(key)) return;
      seen.add(key);
      annotations.push(a);
    };

    if (haveL5) {
      // ── Per-span L5 annotations: anchor → observation → why → MODEL REWRITE ──
      const anns = [...(l5ByPara.get(para.index) ?? [])].sort(
        (a, b) => (a.priority ?? 9) - (b.priority ?? 9),
      );
      for (const a of anns) {
        add({
          spanText: clampToWord(a.location?.spanText || para.text, 90),
          observation: a.content,
          whyItMatters: a.teachingRationale || a.stakes || undefined,
          rewrite: a.rewriteExample || undefined,
          nature: a.type === 'strength' ? 'strength' : 'growth',
          priorityRef: priorityByPara.get(para.index) ?? null,
        });
      }
    } else {
      // ── FALLBACK (L5 not run): paragraph-level strengths + growth-edge summary.
      //    Coarser than the per-span annotations above; kept so the section is
      //    never empty when annotations are disabled.
      const pa = para.analysis;
      const onFirstPara = (paras: number[] | undefined): boolean =>
        !paras || paras.length === 0 ? true : Math.min(...paras) === para.index;

      for (const s of (pa?.strengthSignatures ?? []).filter(s => onFirstPara(s.paragraphs))) {
        add({ spanText: clampToWord(s.evidence || para.text, 80), observation: s.quality, nature: 'strength', priorityRef: null });
      }
      for (const ge of (pa?.growthEdges ?? []).filter(ge => onFirstPara(ge.paragraphs))) {
        add({
          spanText: firstQuotedSpan(ge.description) ?? clampToWord(para.text, 60),
          observation: ge.quality,
          detail: ge.description || undefined,
          nature: 'growth',
          priorityRef: priorityByPara.get(para.index) ?? null,
        });
      }
      const craftStrengths = (profile.craftAssessment?.strengthSignatures ?? [])
        .filter(s => s.paragraphs.length > 1 && Math.min(...s.paragraphs) === para.index);
      for (const s of craftStrengths) {
        add({ spanText: clampToWord(s.evidence || para.text, 80), observation: s.quality, nature: 'strength', priorityRef: null });
      }
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

  // Primary source: coachingMap priorities.
  //
  // The student-facing coaching is `cp.priority` — a full counselor-grade mentor
  // block (it carries both the "why" and a concrete, enacted "how", in plain
  // voice). `cp.architecturalReason` is the INTERNAL why, written in system
  // register ("North Star", "structural role", "95 structural score") — it is
  // deliberately NOT shown to the student (internal-machinery ban). Paragraphs
  // live on `cp.target.paragraphs`; `cp.expectedImpact` already matches the
  // RevisionPriority impact union verbatim. (The prior code read `cp.action` /
  // `cp.paragraphs` / mapped 'high'|'medium' — none of which exist on the type —
  // so it silently dropped the deep coaching, showed the jargon reason for BOTH
  // title and body, lost paragraphs, and always rendered "incremental".)
  const coachingPriorities = profile.scoreMatrix?.coachingMap?.priorities ?? [];
  for (const cp of coachingPriorities.slice(0, maxPriorities)) {
    const body = cp.unlocksNext
      ? `${cp.priority}\n\n**Once you do this:** ${cp.unlocksNext}`
      : cp.priority;
    priorities.push({
      rank: priorities.length + 1,
      title: cp.target?.description ?? 'Revision needed',
      whyItMatters: body,
      paragraphs: cp.target?.paragraphs ?? [],
      craftTechnique: matchTechniqueForPriority(cp.priority ?? cp.target?.description ?? '', profile),
      impact: cp.expectedImpact ?? 'incremental',
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

/**
 * Truncate to at most `max` characters WITHOUT cutting mid-word: trim back to
 * the last whitespace boundary and append an ellipsis. Prevents student-facing
 * spans like "...a small menagerie of crit".
 */
function clampToWord(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut;
  return base.replace(/[\s,;:.–—'"-]+$/, '') + '…';
}

/**
 * Pull the first quoted fragment (the writer's own words) out of a growth-edge
 * description so the annotation can anchor to a real span. Handles straight and
 * curly quotes. Returns null when the description contains no quotation.
 */
function firstQuotedSpan(text: string): string | null {
  // Require the opening quote to follow start/whitespace and the closing quote to
  // precede whitespace/punctuation/end. This excludes mid-word apostrophes in
  // contractions/possessives ("grandmother's", "narrator's"), which would
  // otherwise be mistaken for quote delimiters and yield garbage spans.
  const m = text.match(/(?:^|\s)['"‘“]([^'"‘’“”]{6,}?)['"’”](?=\s|[.,;:!?)]|$)/);
  return m ? clampToWord(m[1], 80) : null;
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
    // protectedStrengths entries are { description, locations, whyProtect } —
    // the field is `description`, NOT `strength`. The old `(ps as any).strength`
    // never matched, so every strength rendered as the literal "[object Object]".
    strengths.push(typeof ps === 'string' ? ps : ((ps as { description?: string }).description ?? String(ps)));
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
