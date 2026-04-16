/**
 * historical-intelligence fixtures — 3 synthetic EssayProfile sessions that
 * simulate one essay evolving across three revision cycles.
 *
 * Design intent:
 *   session1: rough draft. tell_mode findings at P2, P4, P6. Strong voice
 *             markers, no weaknesses. No revisionHistory.
 *   session2: P2 tell_mode addressed (anchor removed from essay text).
 *             P4 and P6 still have tell_mode. Voice markers preserved.
 *             One new registerShift. revisionHistory = session1 snap.
 *   session3: P4 + P6 "addressed" via flattened rewrites. Voice markers
 *             partially lost (2 of 3 gone). vividnessSignal = 'flattened'.
 *             revisionHistory = session1 + session2 snaps.
 *
 * ESSAY_TEXT_* constants are exported so the test can reconstruct text
 * deterministically (same join ordering as the snapshot extractor).
 */

import type { EssayProfile, Finding } from '../../../src/services/essayIntelligence/profileTypes';
import type {
  ProfileSnapshot,
  RevisionHistory,
} from '../../../src/services/essayIntelligence/history/profileSnapshot';

// ============================================================================
// ESSAY TEXTS (high overlap across versions to avoid substantial_rewrite resets)
// ============================================================================

// Paragraph scaffolding kept stable — only the tell_mode anchor phrases
// in P2/P4/P6 change between sessions.
const P0 = 'The practice room hummed with the long decay of an E-minor chord, and my laptop screen glowed next to the sheet music.';
const P1 = 'My hands moved between piano keys and keyboard keys in a rhythm I had spent months teaching myself to trust.';
const P3 = 'Between drafts of the arrangement I ran my code again, watching the spectrum analyzer paint the room with small signatures.';
const P5 = 'Nights stacked into a small routine that still felt like an open question every time I sat down to work.';
const P7 = 'I closed the lid, saved the stem files, and walked out with more problems than I had brought in.';

// Session 1 — rough, tell_mode phrasing in P2/P4/P6.
const S1_P2 = 'I felt inspired by the way software could extend what a piano could say to a listener.';
const S1_P4 = 'It was profoundly meaningful to see the two craft traditions finally come together in my work.';
const S1_P6 = 'That experience was transformative and genuinely shaped how I think about creative disciplines today.';

// Session 2 — P2 rewritten to scene; P4 + P6 still tell_mode (different
// anchors so addressed detection can tell them apart cleanly).
const S2_P2 = 'I pressed a chord with one hand and watched the waveform spike across my screen with the other.';
const S2_P4 = 'It was incredibly powerful to watch the two fields collide in a single rehearsal.';
const S2_P6 = 'The project was transformative in ways I had not anticipated when I started it last year.';

// Session 3 — P4 + P6 "addressed" but in a flattened register. P2 stays
// grounded. High token overlap against session 2 keeps substantial_rewrite
// from archiving.
const S3_P4 = 'The two fields touched inside a single rehearsal and I wrote down what happened after.';
const S3_P6 = 'The project ended with more open questions than I had expected to carry into the new year.';

const SESSION1_PARAGRAPHS = [P0, P1, S1_P2, P3, S1_P4, P5, S1_P6, P7];
const SESSION2_PARAGRAPHS = [P0, P1, S2_P2, P3, S2_P4, P5, S2_P6, P7];
const SESSION3_PARAGRAPHS = [P0, P1, S2_P2, P3, S3_P4, P5, S3_P6, P7];

export const ESSAY_TEXT_SESSION1 = SESSION1_PARAGRAPHS.join('\n\n');
export const ESSAY_TEXT_SESSION2 = SESSION2_PARAGRAPHS.join('\n\n');
export const ESSAY_TEXT_SESSION3 = SESSION3_PARAGRAPHS.join('\n\n');

// ============================================================================
// FINDING HELPERS
// ============================================================================

function mkFinding(
  id: string,
  paragraph: number,
  anchor: string,
): Finding {
  return {
    id,
    claim: `tell-mode anchor at P${paragraph}: "${anchor}"`,
    scope: {
      type: 'paragraph',
      paragraph,
      textEvidence: [{ text: anchor, location: { paragraph } }],
    },
    maturity: 'confirmed',
    maturityReasoning: 'fixture',
    coachingValue: 'high',
    dimensions: ['tell_mode'] as Finding['dimensions'],
    buildsOn: [],
    relatedTo: [],
    source: 'walk',
    deepeningPotential: null,
    raisesQuestions: [],
    evidence: [
      {
        text: anchor,
        location: { paragraph },
        type: 'present',
      },
    ],
    lineage: [],
    createdAt: '2026-04-01T00:00:00.000Z',
    lastUpdated: '2026-04-01T00:00:00.000Z',
  } as Finding;
}

function mkProfile(args: {
  paragraphs: string[];
  findings: Finding[];
  voiceMarkers: string[];
  voiceWeaknesses?: string[];
  registerShifts?: Array<{ paragraph: number; from: string; to: string; driver?: string }>;
  revisionHistory?: RevisionHistory;
}): EssayProfile {
  const base = {
    index: {
      improvementPhase: {
        level: 'craft',
        reasoning: 'mid-revision polish',
        focusAreas: ['tell→scene', 'voice repetition'],
        deferredAreas: ['structural reordering'],
        readinessAssessment: 'iterating',
        legacyReadiness: { essayLevel: 3, paragraphLevel: 3, sentenceLevel: 2, wordLevel: 1 },
        dimensionPhases: [],
        coachingLens: 'tighten tell-mode moments',
        transition: null,
      },
    },
    paragraphs: args.paragraphs.map((text, i) => ({ index: i, text })),
    findings: args.findings,
    voiceIdentity: {
      signature: 'piano + code reflective voice',
      register: 'contemplative',
      distinctivePatterns: [],
      evolution: '',
      authenticVsPerformed: [],
      primaryRegister: 'contemplative-technical',
      voiceMarkers: args.voiceMarkers,
      voiceWeaknesses: args.voiceWeaknesses ?? [],
      registerShifts: args.registerShifts ?? [],
    },
    admissionsPositioning: {
      archetypeContext: {
        archetype: 'music as life metaphor',
        poolDensity: 'common',
        differentiator: 'AI DJ specificity',
      },
    },
    northStar: { activeScale: 'personal_statement' },
    metadata: {
      confidenceLevel: 'comprehensive',
      lastUpdatedLayer: 4,
      paragraphsCovered: args.paragraphs.map((_, i) => i),
      conversationInsightsCount: 0,
      totalAnalysisCost: 0,
      createdAt: '2026-04-01T00:00:00.000Z',
      lastMutatedAt: '2026-04-01T00:00:00.000Z',
      legacyProfile: false,
    },
    revisionHistory: args.revisionHistory,
  };
  return base as unknown as EssayProfile;
}

// ============================================================================
// SESSION PROFILES (standalone — no revisionHistory attached)
// ============================================================================

export const SESSION1_PROFILE: EssayProfile = mkProfile({
  paragraphs: SESSION1_PARAGRAPHS,
  findings: [
    mkFinding('F2', 2, 'I felt inspired'),
    mkFinding('F4', 4, 'It was profoundly meaningful'),
    mkFinding('F6', 6, 'That experience was transformative'),
  ],
  voiceMarkers: ['em-dash pivots', 'concrete verbs', 'sensory timestamps'],
  voiceWeaknesses: [],
  registerShifts: [],
});

export const SESSION2_PROFILE: EssayProfile = mkProfile({
  paragraphs: SESSION2_PARAGRAPHS,
  findings: [
    // P2 addressed (anchor "I felt inspired" no longer in text)
    mkFinding('F4b', 4, 'It was incredibly powerful'),
    mkFinding('F6b', 6, 'The project was transformative'),
  ],
  // 2 markers + 1 weakness → deriveVividness returns 'balanced'. This seeds
  // the "vivid → balanced → flattened" flattening trajectory needed for the
  // over-revision warning to fire at session 3.
  voiceMarkers: ['em-dash pivots', 'concrete verbs'],
  voiceWeaknesses: ['reaches for closure'],
  registerShifts: [
    { paragraph: 4, from: 'contemplative', to: 'expository', driver: 'thesis recap' },
  ],
});

export const SESSION3_PROFILE: EssayProfile = mkProfile({
  paragraphs: SESSION3_PARAGRAPHS,
  findings: [
    // P4 + P6 anchors gone — but voice weakened
  ],
  // Only 1 marker left (lose "concrete verbs" and "sensory timestamps") AND
  // 3 weaknesses so `deriveVividness` → 'flattened' (m=1, w=3).
  voiceMarkers: ['em-dash pivots'],
  voiceWeaknesses: ['reaches for closure', 'abstract endings', 'polished generality'],
  registerShifts: [
    { paragraph: 4, from: 'contemplative', to: 'expository', driver: 'thesis recap' },
  ],
});
