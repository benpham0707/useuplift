/**
 * renderStudentDocumentMarkdown — projects a StudentAnalysisDocument to
 * readable markdown for snapshot output and Phase 4 parity-gate diffing.
 *
 * The structured JSON (StudentAnalysisDocument) is the canonical form; this
 * projection exists so audits and Phase 6 verification regens can read the
 * student-facing output without parsing JSON.
 *
 * Pure function. No LLM calls.
 */

import type {
  StudentAnalysisDocument,
  AnnotatedParagraph,
  RevisionPriority,
  StructuralMapEntry,
} from './types';

export function renderStudentDocumentMarkdown(doc: StudentAnalysisDocument): string {
  const out: string[] = [];

  out.push(`# Student Analysis — ${doc.meta.improvementPhase} phase`);
  out.push('');
  out.push(`> Generated ${doc.meta.generatedAt}. ${doc.meta.paragraphCount} paragraphs, ${doc.meta.essayWordCount} words. Confidence: ${doc.meta.analysisConfidence}.`);
  out.push('');

  // ── §1 Annotated essay ──
  out.push(`## 1. Annotated essay (${doc.annotatedEssay.annotationCount} annotations)`);
  out.push('');
  for (const para of doc.annotatedEssay.paragraphs) {
    out.push(renderParagraphMarkdown(para));
  }

  // ── §2 Revision priorities ──
  out.push('## 2. Revision priorities');
  out.push('');
  if (doc.revisionPriorities.length === 0) {
    out.push('_No revision priorities yet._');
    out.push('');
  } else {
    for (const p of doc.revisionPriorities) {
      out.push(renderRevisionPriorityMarkdown(p));
    }
  }

  // ── §3 Structural map ──
  out.push('## 3. Structural map');
  out.push('');
  out.push('| P | Role | Effectiveness | Weight |');
  out.push('|---|---|---|---|');
  for (const e of doc.structuralMap) {
    out.push(renderStructuralRowMarkdown(e));
  }
  out.push('');

  // ── §4 Overall assessment ──
  out.push('## 4. Overall assessment');
  out.push('');
  out.push(`**Phase**: ${doc.overallAssessment.phase}`);
  out.push('');
  out.push(doc.overallAssessment.phaseExplanation);
  out.push('');
  out.push('**Strengths**:');
  for (const s of doc.overallAssessment.strengths) {
    out.push(`- ${s}`);
  }
  out.push('');
  out.push(`**Central idea**: ${doc.overallAssessment.centralIdea}`);
  out.push('');
  out.push(`**Distinctiveness**: ${doc.overallAssessment.distinctiveness}`);
  out.push('');
  out.push(`**Writer portrait**: ${doc.overallAssessment.writerPortrait}`);
  out.push('');

  return out.join('\n');
}

function renderParagraphMarkdown(para: AnnotatedParagraph): string {
  const lines: string[] = [];
  lines.push(`### P${para.index + 1}`);
  lines.push('');
  lines.push('> ' + para.text.replace(/\n/g, '\n> '));
  lines.push('');
  if (para.inlineAnnotations.length === 0) {
    lines.push('_No inline annotations._');
    lines.push('');
    return lines.join('\n');
  }
  for (const a of para.inlineAnnotations) {
    const tag = a.nature === 'strength' ? '✓' : '△';
    const ref = a.priorityRef !== null ? ` _(→ priority ${a.priorityRef})_` : '';
    lines.push(`- ${tag} **${truncate(a.spanText, 80)}** — ${a.observation}${ref}`);
    if (a.detail) lines.push(`    ${a.detail}`);
  }
  lines.push('');
  return lines.join('\n');
}

function renderRevisionPriorityMarkdown(p: RevisionPriority): string {
  const lines: string[] = [];
  const paras = p.paragraphs.length > 0
    ? ` _(P${p.paragraphs.map((i) => i + 1).join(', P')})_`
    : '';
  lines.push(`### ${p.rank}. ${p.title}${paras}`);
  lines.push('');
  lines.push(`_${p.craftTechnique} • ${p.impact} impact_`);
  lines.push('');
  if (p.whyItMatters) {
    lines.push(p.whyItMatters);
    lines.push('');
  }
  return lines.join('\n');
}

function renderStructuralRowMarkdown(e: StructuralMapEntry): string {
  return `| P${e.paragraphIndex + 1} | ${escape(e.role)} | ${escape(e.effectiveness)} | \`${e.weight}\` |`;
}

function escape(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}
