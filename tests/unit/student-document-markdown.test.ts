// ============================================================================
// renderStudentDocumentMarkdown — smoke test
// ============================================================================
// Projects a StudentAnalysisDocument to readable markdown for snapshot output
// and Phase 4 parity-gate diffing. This test validates the projection
// covers every section without needing a full pipeline run.
//
// Phase 2 deliverable. Zero LLM cost.

import { describe, it, expect } from 'vitest';

import { renderStudentDocumentMarkdown } from '../../src/services/essayIntelligence/presentation/renderStudentDocumentMarkdown';
import type { StudentAnalysisDocument } from '../../src/services/essayIntelligence/presentation/types';

function buildSyntheticDoc(): StudentAnalysisDocument {
  return {
    committeeOneLiner: 'A student writing a crochet-as-care essay — diligent, careful, not yet vivid.',
    aoReaction: {
      gutReaction: 'Steady writer, modest stakes. I want to keep reading but not because anything has hooked me yet.',
      putDownRisk: 'moderate',
      hookMoment: 'The grandmother\'s hands appear in P3.',
      archetype: 'inheritance-of-craft',
      archetypeFrequency: 'AOs read dozens of essays like this every cycle.',
    },
    annotatedEssay: {
      paragraphs: [
        {
          index: 0,
          text: 'I learned to crochet from my grandmother. We sat on the porch in summer.',
          inlineAnnotations: [
            {
              spanText: 'learned to crochet from my grandmother',
              observation: 'Stating the setup; not yet showing it.',
              nature: 'growth',
              priorityRef: 1,
            },
          ],
        },
        {
          index: 1,
          text: 'Each loop she taught me had a name and a purpose I forgot.',
          inlineAnnotations: [
            {
              spanText: 'name and a purpose I forgot',
              observation: 'The forgetting is the more interesting half — lead with it.',
              nature: 'strength',
              priorityRef: null,
            },
          ],
        },
      ],
      annotationCount: 2,
    },
    revisionPriorities: [
      {
        rank: 1,
        title: 'Open in scene, not summary',
        whyItMatters: 'The reader meets craft essays every day. The opening is where you earn the next paragraph.',
        paragraphs: [0],
        craftTechnique: 'Summary → Scene',
        impact: 'transformative',
      },
      {
        rank: 2,
        title: 'Name what the grandmother\'s hands looked like',
        whyItMatters: 'The detail you almost give in P3 is the essay\'s strongest moment.',
        paragraphs: [2],
        craftTechnique: 'Physical Detail',
        impact: 'significant',
      },
    ],
    structuralMap: [
      { paragraphIndex: 0, role: 'opening — first impression', effectiveness: 'underdeveloped', weight: 'load-bearing' },
      { paragraphIndex: 1, role: 'evidence', effectiveness: 'lands quietly', weight: 'supporting' },
    ],
    overallAssessment: {
      phase: 'Architecture',
      phaseExplanation: 'Structure is taking shape; the sentences can wait.',
      strengths: ['Honest voice', 'Earned restraint'],
      centralIdea: 'The work of inheritance is in what you almost forget.',
      distinctiveness: 'The forgetting frame is uncommon in inheritance-of-craft essays.',
      writerPortrait: 'Patient, slightly understated, more interested in others than self.',
    },
    meta: {
      essayWordCount: 280,
      paragraphCount: 5,
      improvementPhase: 'architecture',
      analysisConfidence: 'enriched',
      generatedAt: '2026-05-14T18:30:00.000Z',
    },
  };
}

describe('renderStudentDocumentMarkdown — section coverage', () => {
  it('renders every section header', () => {
    const md = renderStudentDocumentMarkdown(buildSyntheticDoc());
    expect(md).toContain('# Student Analysis — architecture phase');
    expect(md).toContain('## 1. Committee one-liner');
    expect(md).toContain('## 2. AO reaction');
    expect(md).toContain('## 3. Annotated essay (2 annotations)');
    expect(md).toContain('## 4. Revision priorities');
    expect(md).toContain('## 5. Structural map');
    expect(md).toContain('## 6. Overall assessment');
  });

  it('surfaces the committee one-liner as a blockquote', () => {
    const md = renderStudentDocumentMarkdown(buildSyntheticDoc());
    expect(md).toContain('> A student writing a crochet-as-care essay');
  });

  it('renders inline annotations with nature glyph + priority ref', () => {
    const md = renderStudentDocumentMarkdown(buildSyntheticDoc());
    expect(md).toContain('△ **learned to crochet from my grandmother**');
    expect(md).toContain('(→ priority 1)');
    expect(md).toContain('✓ **name and a purpose I forgot**');
  });

  it('renders 1-indexed paragraph numbers in revision priorities', () => {
    const md = renderStudentDocumentMarkdown(buildSyntheticDoc());
    // Priority 1 referenced P[0] internally; renders as P1.
    expect(md).toContain('### 1. Open in scene, not summary _(P1)_');
    expect(md).toContain('### 2. Name what the grandmother\'s hands looked like _(P3)_');
  });

  it('renders structural map as a markdown table', () => {
    const md = renderStudentDocumentMarkdown(buildSyntheticDoc());
    expect(md).toContain('| P | Role | Effectiveness | Weight |');
    expect(md).toContain('| P1 | opening — first impression | underdeveloped | `load-bearing` |');
  });

  it('renders strengths as a markdown list', () => {
    const md = renderStudentDocumentMarkdown(buildSyntheticDoc());
    expect(md).toContain('- Honest voice');
    expect(md).toContain('- Earned restraint');
  });

  it('handles empty revision priorities gracefully', () => {
    const doc = buildSyntheticDoc();
    doc.revisionPriorities = [];
    const md = renderStudentDocumentMarkdown(doc);
    expect(md).toContain('_No revision priorities yet._');
  });

  it('handles a paragraph with no inline annotations', () => {
    const doc = buildSyntheticDoc();
    doc.annotatedEssay.paragraphs[0].inlineAnnotations = [];
    const md = renderStudentDocumentMarkdown(doc);
    expect(md).toContain('_No inline annotations._');
  });
});
