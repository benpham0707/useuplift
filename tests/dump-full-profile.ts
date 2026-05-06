/**
 * Full Profile Dump — Dumps the COMPLETE EssayProfile from a Conversator V2
 * analysis pipeline run into a comprehensive, readable markdown file.
 *
 * Runs the same analysis pipeline as the E2E test (L1-L4, no L5) but instead
 * of coaching turns, dumps EVERY field of the resulting EssayProfile to markdown.
 *
 * Usage:
 *   ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/dump-full-profile.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from project root BEFORE any service imports
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

import { analysisOrchestrator } from '../src/services/essayIntelligence/analysis/analysisOrchestrator';
import type { PipelineResult } from '../src/services/essayIntelligence/analysis/analysisOrchestrator';
import type { EssayProfile } from '../src/services/essayIntelligence/profileTypes';

// ============================================================================
// CONFIG
// ============================================================================

// Essay can be overridden via CLI arg: `npx tsx ... --essay <path-or-corpus-filename>`.
// If the value contains a path separator, it's treated as a path; otherwise it's
// looked up in tests/calibration/top-tier-reference/essays/. Defaults to the
// fixture piano-essay.
const ESSAY_PATH = (() => {
  const idx = process.argv.indexOf('--essay');
  if (idx < 0 || !process.argv[idx + 1]) {
    return path.join(__dirname, 'fixtures', 'piano-essay.txt');
  }
  const arg = process.argv[idx + 1];
  if (arg.includes('/')) return path.resolve(arg);
  return path.join(__dirname, 'calibration', 'top-tier-reference', 'essays', arg);
})();
const ESSAY_LABEL = path.basename(ESSAY_PATH).replace(/\.txt$/, '');
const OUTPUT_DIR = path.join(__dirname, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, `full-profile-${ESSAY_LABEL}.md`);
const OUTPUT_JSON = path.join(OUTPUT_DIR, `full-profile-${ESSAY_LABEL}.json`);

// ============================================================================
// HELPERS
// ============================================================================

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/** Safe JSON dump for complex nested objects */
function jsonBlock(obj: unknown): string {
  return '```json\n' + JSON.stringify(obj, null, 2) + '\n```';
}

/** Format a cost value */
function cost(n: number): string {
  return `$${n.toFixed(4)}`;
}

/** Format milliseconds to human-readable */
function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${s}s`;
}

/** Safe access — returns '(not available)' for null/undefined */
function safe(val: unknown): string {
  if (val === null || val === undefined) return '(not available)';
  if (typeof val === 'string') return val || '(empty)';
  return String(val);
}

/** Render observation entries as a markdown list */
function renderObservations(obs: Array<{ observation: string; confidence: number; evidence: string }> | undefined): string {
  if (!obs || obs.length === 0) return '  (none)\n';
  return obs.map(o =>
    `  - **${o.observation}**\n    - Confidence: ${o.confidence}\n    - Evidence: "${o.evidence}"`
  ).join('\n') + '\n';
}

// ============================================================================
// SECTION RENDERERS
// ============================================================================

function renderPipelineOverview(result: PipelineResult, essayText: string, pipelineTimeMs: number): string {
  const lines: string[] = [];
  lines.push('## 1. Pipeline Overview\n');
  lines.push(`- **Essay length**: ${essayText.length} chars, ${essayText.split(/\n\n+/).length} paragraphs`);
  lines.push(`- **Layers completed**: ${result.layersCompleted.join(', ')}`);
  lines.push(`- **Layers failed**: ${result.layersFailed.length > 0 ? result.layersFailed.map(f => `${f.layer}: ${f.message}`).join(', ') : 'none'}`);
  lines.push(`- **Total cost**: ${cost(result.costSummary.totalCost)}`);
  lines.push(`- **Total time**: ${formatTime(pipelineTimeMs)} (${pipelineTimeMs}ms)`);
  lines.push(`- **Confidence level**: ${result.confidenceLevel}`);
  lines.push('');

  if (result.improvementPhase) {
    const ip = result.improvementPhase;
    lines.push(`### Improvement Phase`);
    lines.push(`- **Level**: ${ip.level}`);
    lines.push(`- **Reasoning**: ${ip.reasoning}`);
    lines.push(`- **Coaching lens**: ${ip.coachingLens}`);
    lines.push(`- **Readiness assessment**: ${ip.readinessAssessment}`);
    lines.push(`- **Near boundary**: ${ip.nearBoundary ?? 'N/A'}`);
    lines.push(`- **Focus areas**: ${ip.focusAreas.join('; ') || '(none)'}`);
    lines.push(`- **Deferred areas**: ${ip.deferredAreas.join('; ') || '(none)'}`);
    lines.push(`- **Legacy readiness**: essay=${ip.legacyReadiness.essayLevel}, paragraph=${ip.legacyReadiness.paragraphLevel}, sentence=${ip.legacyReadiness.sentenceLevel}, word=${ip.legacyReadiness.wordLevel}`);
    if (ip.dimensionPhases.length > 0) {
      lines.push(`\n**Dimension Phases:**`);
      for (const dp of ip.dimensionPhases) {
        lines.push(`- **${dp.dimension}**: ${dp.level} — ${dp.reasoning}`);
        lines.push(`  - Coaching approach: ${dp.coachingApproach}`);
      }
    }
    if (ip.transition) {
      lines.push(`\n**Phase Transition:**`);
      lines.push(`- Prior: ${ip.transition.priorLevel}, Genuine shift: ${ip.transition.isGenuineShift}`);
      lines.push(`- Reasoning: ${ip.transition.transitionReasoning}`);
    }
  }

  lines.push('\n### Layer Cost Breakdown\n');
  lines.push('| Layer | Cost | Input Tokens | Output Tokens | Cache Read | Time |');
  lines.push('|-------|------|-------------|---------------|------------|------|');
  for (const lc of result.costSummary.layers) {
    const tu = lc.tokenUsage;
    lines.push(`| ${lc.layer} | ${cost(lc.cost)} | ${tu.inputTokens} | ${tu.outputTokens} | ${tu.cacheReadTokens} | ${lc.timingMs}ms |`);
  }
  lines.push(`| **TOTAL** | **${cost(result.costSummary.totalCost)}** | **${result.costSummary.totalTokenUsage.inputTokens}** | **${result.costSummary.totalTokenUsage.outputTokens}** | **${result.costSummary.totalTokenUsage.cacheReadTokens}** | **${result.costSummary.totalTimingMs}ms** |`);

  return lines.join('\n') + '\n';
}

function renderAOFirstRead(profile: EssayProfile): string {
  const lines: string[] = [];
  lines.push('## 2. AO First Read\n');

  if (!profile.aoFirstRead) {
    lines.push('(not available — AO First Read call may have failed)\n');
    return lines.join('\n');
  }

  const ao = profile.aoFirstRead;
  lines.push(`- **Hook moment**: ${safe(ao.hookMoment)}`);
  lines.push(`- **Committee one-liner**: ${safe(ao.committeeOneLiner)}`);
  lines.push(`- **Distinctiveness signal**: ${safe(ao.distinctivenessSignal)}`);
  lines.push(`- **Put-down risk**: ${safe(ao.putDownRisk)}`);
  lines.push(`\n**Gut Reaction:**\n`);
  lines.push(`> ${ao.gutReaction}`);

  return lines.join('\n') + '\n';
}

function renderNorthStar(profile: EssayProfile): string {
  const lines: string[] = [];
  lines.push('## 3. North Star (Full)\n');

  const ns = profile.northStar;
  lines.push(`- **Active scale**: ${ns.activeScale}`);
  lines.push(`- **Confidence**: ${ns.confidence}`);
  lines.push(`- **Last updated by**: ${ns.lastUpdatedBy}`);

  // Through-line summary from index
  const nsSummary = profile.index.northStarSummary;
  lines.push(`- **Through-line summary (index)**: ${safe(nsSummary.throughLineSummary)}`);
  lines.push(`- **Maturity**: ${nsSummary.maturity}`);

  // Through-line map
  lines.push('\n### Through-Line Map\n');
  if (ns.throughLineMap) {
    const tlm = ns.throughLineMap;
    lines.push(`- **Central element**: ${tlm.centralElement}`);
    lines.push(`- **Element type**: ${tlm.elementType}`);
    lines.push(`- **Transformation**: ${tlm.transformation}`);
    lines.push(`- **Connection refs**: ${tlm.connectionRefs.join(', ') || '(none)'}`);
    lines.push('\n**Journey:**\n');
    for (const j of tlm.journey) {
      const loc = j.location.sentence !== undefined
        ? `P${j.location.paragraph + 1}S${j.location.sentence + 1}`
        : `P${j.location.paragraph + 1}`;
      lines.push(`- **${loc}** [${j.narrativeMove}]: ${j.meaningAtPoint}`);
    }
  } else {
    lines.push('(null — not active for this essay scale)');
  }

  // Structural Roles Map
  lines.push('\n### Structural Roles Map\n');
  if (ns.structuralRolesMap.length > 0) {
    for (const role of ns.structuralRolesMap) {
      lines.push(`- **P${role.paragraphs.map(p => p + 1).join(',')}** — Role: "${role.role}"`);
      lines.push(`  - Significance: ${role.significance}`);
      lines.push(`  - Weight: ${role.weight}`);
    }
  } else {
    lines.push('(empty)');
  }

  // Trajectory
  lines.push('\n### Trajectory\n');
  if (ns.trajectory) {
    const t = ns.trajectory;
    lines.push(`**Current state**: ${t.currentState}\n`);
    lines.push('**Plausible paths:**\n');
    for (const p of t.plausiblePaths) {
      lines.push(`- **${p.description}** (text support: ${p.textSupport})`);
      for (const r of p.requirements) {
        lines.push(`  - Requires: ${r}`);
      }
    }
    lines.push('\n**Unrealized connections:**\n');
    for (const uc of t.unrealizedConnections) {
      lines.push(`- ${uc.description} (at ${uc.locations.map(l => `P${l[0]+1}S${l[1]+1}`).join(', ')})`);
    }
  } else {
    lines.push('(null — not active for this essay scale)');
  }

  // Distinctiveness Signature
  lines.push('\n### Distinctiveness Signature\n');
  const ds = ns.distinctivenessSignature;
  lines.push(`**Articulation**: ${ds.articulation}\n`);
  lines.push(`**Entanglement refs**: ${ds.entanglementRefs.join(', ') || '(none)'}`);
  lines.push('\n**Non-interchangeable factors:**\n');
  for (const f of ds.nonInterchangeableFactors) {
    lines.push(`- ${f}`);
  }

  // Intent Bridge
  lines.push('\n### Intent Bridge\n');
  if (ns.intentBridge) {
    const ib = ns.intentBridge;
    lines.push(`- **Student intent**: ${safe(ib.studentIntent)}`);
    lines.push(`- **System reading**: ${ib.systemReading}`);
    lines.push(`- **Source insight IDs**: ${ib.sourceInsightIds.join(', ') || '(none)'}`);
    if (ib.alignments.length > 0) {
      lines.push('\n**Alignments:**\n');
      for (const a of ib.alignments) {
        lines.push(`- **${a.aspect}** [${a.alignment}]: ${a.detail}`);
      }
    }
  } else {
    lines.push('(null)');
  }

  // Evolution
  if (ns.evolution) {
    lines.push('\n### North Star Evolution\n');
    lines.push(`- **Version**: ${ns.evolution.version}`);
    lines.push(`- **Core identity stable**: ${ns.evolution.coreIdentityStable}`);
    lines.push(`- **Stability assessment**: ${ns.evolution.stabilityAssessment}`);
    if (ns.evolution.changelog.length > 0) {
      lines.push('\n**Changelog:**\n');
      for (const c of ns.evolution.changelog) {
        lines.push(`- **${c.field}**: "${c.previousValue}" -> "${c.newValue}" (trigger: ${c.trigger})`);
      }
    }
  }

  return lines.join('\n') + '\n';
}

function renderScoreMatrix(profile: EssayProfile): string {
  const lines: string[] = [];
  lines.push('## 4. Score Matrix (Full)\n');

  if (!profile.scoreMatrix) {
    lines.push('(not available — L4 may have failed)\n');
    return lines.join('\n');
  }

  const sm = profile.scoreMatrix;

  // Per-paragraph scores table
  lines.push('### Per-Paragraph Scores\n');
  lines.push('| P# | Effectiveness | Structural | Voice | Emotional | Thematic | Priority | Verdict |');
  lines.push('|----|-------------|-----------|-------|-----------|---------|----------|---------|');
  for (const p of sm.paragraphs) {
    lines.push(`| P${p.index + 1} | ${p.scores.effectiveness} | ${p.scores.structural} | ${p.scores.voice} | ${p.scores.emotional} | ${p.scores.thematic} | ${p.priorityForImprovement} | ${p.verdict} |`);
  }

  // Cross-paragraph patterns
  lines.push('\n### Cross-Paragraph Patterns\n');
  if (sm.crossParagraphPatterns.length > 0) {
    for (const p of sm.crossParagraphPatterns) {
      lines.push(`- ${p}`);
    }
  } else {
    lines.push('(none)');
  }

  // Prioritized improvements
  lines.push('\n### Prioritized Improvements\n');
  if (sm.prioritizedImprovements.length > 0) {
    for (const imp of sm.prioritizedImprovements) {
      lines.push(`- **P${imp.paragraph + 1}** [${imp.expectedImpact}]: ${imp.improvement}`);
      lines.push(`  - Why: ${imp.whyThisMatters}`);
    }
  } else {
    lines.push('(none)');
  }

  // Coaching map
  if (sm.coachingMap) {
    const cm = sm.coachingMap;
    lines.push('\n### Coaching Map\n');

    lines.push('**Transformative Insight:**\n');
    lines.push(`> ${cm.transformativeInsight.insight}`);
    lines.push(`- Evidence locations: ${cm.transformativeInsight.evidenceLocations.map(l => l.sentence !== undefined ? `P${l.paragraph+1}S${l.sentence+1}` : `P${l.paragraph+1}`).join(', ')}`);
    lines.push(`- Why this transforms: ${cm.transformativeInsight.whyThisTransforms}`);
    lines.push(`- Requires student awareness: ${cm.transformativeInsight.requiresStudentAwareness}`);

    lines.push('\n**Priorities:**\n');
    for (const p of cm.priorities) {
      lines.push(`- **${p.priority}** [${p.expectedImpact}]`);
      lines.push(`  - Target: P${p.target.paragraphs.map(x => x+1).join(',')} — ${p.target.description}`);
      lines.push(`  - Architectural reason: ${p.architecturalReason}`);
      lines.push(`  - Unlocks next: ${p.unlocksNext}`);
    }

    lines.push('\n**Protected Strengths:**\n');
    for (const s of cm.protectedStrengths) {
      lines.push(`- ${s.description}`);
      lines.push(`  - Locations: ${s.locations.map(l => l.sentence !== undefined ? `P${l.paragraph+1}S${l.sentence+1}` : `P${l.paragraph+1}`).join(', ')}`);
      lines.push(`  - Why protect: ${s.whyProtect}`);
    }

    // Scope 1 Phase 1: emergentPatterns and scoreTensions are now string[]
    // (flattened from the legacy Array<{pattern, evidence, implication}> and
    // Array<{paragraph, tension, interpretation, coachingImplication}> shapes
    // for ~10x token reduction). Backward compat: profiles persisted before
    // Phase 1 are flattened by buildCoachingMap() at load time, so by the
    // time this renderer sees them they're always strings.
    lines.push('\n**Emergent Patterns:**\n');
    for (const p of cm.emergentPatterns) {
      lines.push(`- ${p}`);
    }

    lines.push('\n**Score Tensions:**\n');
    for (const t of cm.scoreTensions) {
      lines.push(`- ${t}`);
    }
  }

  return lines.join('\n') + '\n';
}

function renderHolisticUnderstanding(profile: EssayProfile): string {
  const lines: string[] = [];
  lines.push('## 5. Holistic Understanding (All 8 Sections)\n');

  // 5.1 Voice Identity
  lines.push('### 5.1 Voice Identity\n');
  const vi = profile.voiceIdentity;
  if (vi) {
    lines.push(`- **Signature**: ${vi.signature}`);
    lines.push(`- **Register**: ${vi.register}`);
    lines.push(`- **Distinctive patterns**: ${vi.distinctivePatterns.join('; ') || '(none)'}`);
    lines.push(`- **Evolution**: ${vi.evolution}`);
    if (vi.authenticVsPerformed.length > 0) {
      lines.push('\n**Authentic vs Performed:**\n');
      for (const avp of vi.authenticVsPerformed) {
        lines.push(`- P${avp.location[0]+1}S${avp.location[1]+1} [${avp.assessment}]: ${avp.reasoning}`);
      }
    }
  } else {
    lines.push('(not available)');
  }

  // 5.2 Voice Map
  lines.push('\n### 5.2 Voice Map\n');
  const vm = profile.voiceMap;
  if (vm) {
    // Register
    lines.push('**Register:**\n');
    lines.push(`- Baseline: ${vm.register.baseline}`);
    if (vm.register.observations.length > 0) {
      for (const obs of vm.register.observations) {
        const loc = obs.location.sentenceRange
          ? `P${obs.location.paragraph+1}S${obs.location.sentenceRange[0]+1}-S${obs.location.sentenceRange[1]+1}`
          : `P${obs.location.paragraph+1}`;
        lines.push(`- ${loc} [${obs.dimensions.join(',')}]: ${obs.observation}`);
      }
    }

    // Vocabulary Fingerprint
    lines.push('\n**Vocabulary Fingerprint:**\n');
    lines.push(`- Baseline: ${vm.vocabularyFingerprint.baseline}`);
    if (vm.vocabularyFingerprint.domains?.length > 0) {
      for (const d of vm.vocabularyFingerprint.domains) {
        lines.push(`- Domain "${d.domain}" (P${d.paragraphs.map(p=>p+1).join(',')}): ${d.exampleWords.join(', ')}`);
      }
    }
    if (vm.vocabularyFingerprint.observations.length > 0) {
      for (const obs of vm.vocabularyFingerprint.observations) {
        lines.push(`- P${obs.location.paragraph+1}: ${obs.observation}`);
      }
    }

    // Sentence Rhythm
    lines.push('\n**Sentence Rhythm:**\n');
    lines.push(`- Baseline: ${vm.sentenceRhythm.baseline}`);
    for (const obs of vm.sentenceRhythm.observations) {
      lines.push(`- P${obs.location.paragraph+1}: ${obs.observation}`);
    }

    // Perspective Distance
    lines.push('\n**Perspective Distance:**\n');
    lines.push(`- Baseline: ${vm.perspectiveDistance.baseline}`);
    for (const obs of vm.perspectiveDistance.observations) {
      lines.push(`- P${obs.location.paragraph+1}: ${obs.observation}`);
    }

    // Tonal Disposition
    lines.push('\n**Tonal Disposition:**\n');
    lines.push(`- Baseline: ${vm.tonalDisposition.baseline}`);
    lines.push(`- Dominant qualities: ${vm.tonalDisposition.dominantQualities?.join(', ') || '(none)'}`);
    for (const obs of vm.tonalDisposition.observations) {
      lines.push(`- P${obs.location.paragraph+1}: ${obs.observation}`);
    }

    // Stability Regions
    if (vm.stabilityRegions?.length > 0) {
      lines.push('\n**Stability Regions:**\n');
      for (const sr of vm.stabilityRegions) {
        lines.push(`- P${sr.paragraphs.map(p=>p+1).join(',')}: ${sr.voiceCharacter}`);
      }
    }

    // Shifts
    if (vm.shifts?.length > 0) {
      lines.push('\n**Voice Shifts:**\n');
      for (const s of vm.shifts) {
        const loc = s.location.sentence !== undefined
          ? `P${s.location.paragraph+1}S${s.location.sentence+1}`
          : `P${s.location.paragraph+1}`;
        lines.push(`- ${loc} (${s.location.boundary})`);
        lines.push(`  - Dimensions: ${s.dimensions.join(', ')}`);
        lines.push(`  - From: ${s.fromDescription}`);
        lines.push(`  - To: ${s.toDescription}`);
        lines.push(`  - Intentionality: ${s.intentionality.assessment} (confidence: ${s.intentionality.confidence})`);
        lines.push(`  - Reasoning: ${s.intentionality.reasoning}`);
        if (s.servesFunction) lines.push(`  - Serves function: ${s.servesFunction}`);
      }
    }

    // Code Switching
    if (vm.codeSwitching?.length > 0) {
      lines.push('\n**Code Switching:**\n');
      for (const cs of vm.codeSwitching) {
        lines.push(`- P${cs.location.paragraph+1}S${cs.location.sentence+1}: "${cs.text}"`);
        lines.push(`  - Language: ${cs.language}, Trigger: ${cs.trigger}`);
        lines.push(`  - Cultural function: ${cs.culturalFunction}`);
      }
    }
  } else {
    lines.push('(not available)');
  }

  // 5.3 Emotional Topography
  lines.push('\n### 5.3 Emotional Topography\n');
  const et = profile.emotionalTopography;
  if (et) {
    lines.push(`- **Arc trajectory**: ${et.arcTrajectory}`);
    lines.push(`- **Authenticity assessment**: ${et.authenticityAssessment}`);
    lines.push(`- **Undertones**: ${et.undertones.join('; ') || '(none)'}`);

    if (et.peakMoments.length > 0) {
      lines.push('\n**Peak Moments:**\n');
      for (const pm of et.peakMoments) {
        lines.push(`- P${pm.location[0]+1}S${pm.location[1]+1} — ${pm.emotion} (${pm.intensity})`);
      }
    }

    if (et.emotionalProgression.length > 0) {
      lines.push('\n**Emotional Progression:**\n');
      for (const ep of et.emotionalProgression) {
        lines.push(`- P${ep.paragraph+1}: ${ep.register} — ${ep.shift}`);
      }
    }

    if (et.showVsTell.length > 0) {
      lines.push('\n**Show vs Tell:**\n');
      for (const svt of et.showVsTell) {
        lines.push(`- P${svt.location[0]+1}S${svt.location[1]+1} [${svt.assessment}]: ${svt.detail}`);
      }
    }
  } else {
    lines.push('(not available)');
  }

  // 5.4 Moment Earnedness Map
  lines.push('\n### 5.4 Moment Earnedness Map\n');
  const mem = profile.momentEarnednessMap;
  if (mem) {
    lines.push(`**Structural observation**: ${mem.structuralObservation}\n`);
    if (mem.moments.length > 0) {
      for (const m of mem.moments) {
        lines.push(`#### Moment: P${m.location.paragraph+1}S${m.location.sentence+1} [${m.momentType}]`);
        lines.push(`- **Description**: ${m.description}`);
        lines.push(`- **Payload**: ${m.payload}`);
        if (m.mechanisms.length > 0) {
          lines.push('- **Mechanisms** (earning arrows):');
          for (const mech of m.mechanisms) {
            const loc = mech.location.sentence !== undefined
              ? `P${mech.location.paragraph+1}S${mech.location.sentence+1}`
              : `P${mech.location.paragraph+1}`;
            lines.push(`  - [${mech.type}] ${loc}: ${mech.contribution}`);
          }
        }
        if (m.gaps.length > 0) {
          lines.push('- **Gaps** (what is missing):');
          for (const g of m.gaps) {
            lines.push(`  - ${g}`);
          }
        }
      }
    } else {
      lines.push('(no significant moments detected)');
    }
  } else {
    lines.push('(not available)');
  }

  // 5.5 Thematic Architecture
  lines.push('\n### 5.5 Thematic Architecture\n');
  const ta = profile.thematicArchitecture;
  if (ta) {
    lines.push(`- **Central thesis**: ${ta.centralThesis}`);
    lines.push(`- **Thesis confidence**: ${ta.thesisConfidence}`);
    lines.push(`- **Thesis evolution**: ${ta.thesisEvolution}`);
    lines.push(`- **Subtext**: ${ta.subtext}`);
    lines.push(`- **Contradictions**: ${ta.contradictions.join('; ') || '(none)'}`);

    if (ta.threads.length > 0) {
      lines.push('\n**Thematic Threads:**\n');
      for (const t of ta.threads) {
        const introLoc = t.introducedAt.sentence !== undefined
          ? `P${t.introducedAt.paragraph+1}S${t.introducedAt.sentence+1}`
          : `P${t.introducedAt.paragraph+1}`;
        const appearances = t.appearances.map(a => a.sentence !== undefined ? `P${a.paragraph+1}S${a.sentence+1}` : `P${a.paragraph+1}`).join(', ');
        lines.push(`- **${t.thread}** [${t.strength}]`);
        lines.push(`  - Introduced at: ${introLoc}`);
        lines.push(`  - Appearances: ${appearances}`);
      }
    }
  } else {
    lines.push('(not available)');
  }

  // 5.6 Narrative Strategy
  lines.push('\n### 5.6 Narrative Strategy\n');
  const nsStrat = profile.narrativeStrategy;
  if (nsStrat) {
    lines.push(`- **Primary strategy**: ${nsStrat.primaryStrategy}`);
    lines.push(`- **Strategy rationale**: ${nsStrat.strategyRationale}`);
    lines.push(`- **Arc type**: ${nsStrat.arcType}`);
    lines.push(`- **Arc momentum**: ${nsStrat.arcMomentum}`);
    lines.push(`- **Pacing analysis**: ${nsStrat.pacingAnalysis}`);
    if (nsStrat.turningPoint) {
      lines.push(`- **Turning point**: P${nsStrat.turningPoint.paragraph+1}S${nsStrat.turningPoint.sentence+1}`);
    } else {
      lines.push(`- **Turning point**: (none detected)`);
    }

    if (nsStrat.pivotPoints.length > 0) {
      lines.push('\n**Pivot Points:**\n');
      for (const pp of nsStrat.pivotPoints) {
        const loc = pp.location.sentence !== undefined
          ? `P${pp.location.paragraph+1}S${pp.location.sentence+1}`
          : `P${pp.location.paragraph+1}`;
        lines.push(`- ${loc}: ${pp.description}`);
      }
    }

    if (nsStrat.structuralChoices.length > 0) {
      lines.push('\n**Structural Choices:**\n');
      for (const sc of nsStrat.structuralChoices) {
        lines.push(`- ${sc}`);
      }
    }
  } else {
    lines.push('(not available)');
  }

  // 5.7 Character Revelation
  lines.push('\n### 5.7 Character Revelation\n');
  const cr = profile.characterRevelation;
  if (cr) {
    lines.push(`**Writer Portrait:**\n\n> ${cr.writerPortrait}\n`);
    if (cr.essayOnlyPortrait) {
      lines.push(`**Essay-Only Portrait:**\n\n> ${cr.essayOnlyPortrait}\n`);
    }
    lines.push(`- **Values revealed**: ${cr.valuesRevealed.join('; ') || '(none)'}`);
    lines.push(`- **Growth arc**: ${cr.growthArc}`);
    lines.push(`- **Intellectual fingerprint**: ${cr.intellectualFingerprint}`);
    lines.push(`- **Blind spots**: ${cr.blindSpots.join('; ') || '(none)'}`);
    lines.push(`- **Revealed qualities**: ${cr.revealedQualities.join('; ') || '(none)'}`);
  } else {
    lines.push('(not available)');
  }

  // 5.8 Craft Assessment
  lines.push('\n### 5.8 Craft Assessment\n');
  const ca = profile.craftAssessment;
  if (ca) {
    lines.push(`- **Image system**: ${ca.imageSystem}`);
    lines.push(`- **Sentence patterns**: ${ca.sentencePatterns}`);
    lines.push(`- **Word patterns**: ${ca.wordPatterns}`);

    // Quality Gap 1: render the Signature Move callout BEFORE strengthSignatures.
    // Populated case shows the one-sentence claim + an evidence table with
    // 1-indexed paragraph display. Null case renders a teaching block that
    // explains what null means so a reader doesn't infer the system "missed it".
    lines.push('\n### Signature Move\n');
    if (ca.signatureMove) {
      const sm = ca.signatureMove;
      lines.push(`> ${sm.oneSentenceName}\n`);
      lines.push(`**Why it is theirs**: ${sm.whyItIsTheirs}\n`);
      lines.push(`**Reader effect**: ${sm.readerEffect}\n`);
      lines.push('| # | Kind | Where | Detail |');
      lines.push('|---|---|---|---|');
      for (let i = 0; i < sm.instances.length; i++) {
        const inst = sm.instances[i];
        let where: string;
        let detail: string;
        if (inst.kind === 'sentence_quote') {
          const sentence = inst.location.sentence;
          where = sentence != null
            ? `P${inst.location.paragraph + 1}S${sentence + 1}`
            : `P${inst.location.paragraph + 1}`;
          detail = `"${inst.quotedText}" — ${inst.whatThisInstanceShows}`;
        } else if (inst.kind === 'paragraph_compression') {
          where = `P${inst.paragraph + 1}`;
          detail = inst.whatThisInstanceShows;
        } else {
          where = `P${inst.paragraphs.map((p) => p + 1).join(',')}`;
          detail = inst.whatThisInstanceShows;
        }
        // Escape pipe characters in detail to avoid breaking markdown table rendering
        const escaped = detail.replace(/\|/g, '\\|').replace(/\n/g, ' ');
        lines.push(`| ${i + 1} | ${inst.kind} | ${where} | ${escaped} |`);
      }
      lines.push('');
    } else {
      lines.push('*No single defining move identified for this essay.*\n');
      lines.push('Your essay\'s craft is distributed across multiple strengths rather than concentrated in one identity-defining technique. Both shapes can succeed — some essays earn admission through one unforgettable move, others through sustained competence across many craft elements. See your **Strength Signatures** below for the full picture of your craft.\n');
    }

    if (ca.strengthSignatures.length > 0) {
      lines.push('\n**Strength Signatures:**\n');
      for (const ss of ca.strengthSignatures) {
        lines.push(`- **${ss.quality}** (P${ss.paragraphs.map(p=>p+1).join(',')}): ${ss.evidence}`);
      }
    }

    if (ca.growthEdges.length > 0) {
      lines.push('\n**Growth Edges:**\n');
      for (const ge of ca.growthEdges) {
        lines.push(`- **${ge.quality}** (P${ge.paragraphs.map(p=>p+1).join(',')}): ${ge.description}`);
      }
    }
  } else {
    lines.push('(not available)');
  }

  return lines.join('\n') + '\n';
}

function renderAdmissionsPositioning(profile: EssayProfile): string {
  const lines: string[] = [];
  lines.push('## 6. Admissions Positioning\n');

  const ap = profile.admissionsPositioning;
  if (!ap) {
    lines.push('(not available)\n');
    return lines.join('\n');
  }

  lines.push(`- **Tellability summary**: ${ap.tellabilitySummary}`);
  lines.push(`- **Memorability**: ${ap.memorability}`);
  lines.push(`- **Institutional fit**: ${ap.institutionalFit}`);
  lines.push(`- **Portfolio position**: ${ap.portfolioPosition}`);
  lines.push(`- **AO takeaway**: ${ap.aoTakeaway}`);

  if (ap.archetypeContext) {
    lines.push(`\n**Archetype:**`);
    lines.push(`- Archetype: ${ap.archetypeContext.archetype}`);
    lines.push(`- Pool density: ${ap.archetypeContext.poolDensity}`);
    lines.push(`- Differentiator: ${safe(ap.archetypeContext.differentiator)}`);
  }

  lines.push('\n**Distinctiveness Factors:**\n');
  for (const df of ap.distinctivenessFactors) {
    lines.push(`- ${df}`);
  }

  lines.push('\n**Red Flags:**\n');
  if (ap.redFlags.length > 0) {
    for (const rf of ap.redFlags) {
      lines.push(`- ${rf}`);
    }
  } else {
    lines.push('(none)');
  }

  return lines.join('\n') + '\n';
}

function renderConnectionsAndEntanglements(profile: EssayProfile): string {
  const lines: string[] = [];
  lines.push('## 7. Connections & Entanglements\n');

  // Connections
  lines.push('### 7.1 Connections\n');
  const conns = profile.connections;
  if (conns) {
    lines.push(`- **Graph summary**: ${conns.graphSummary}`);
    lines.push(`- **Structural islands**: ${conns.structuralIslands.length > 0 ? conns.structuralIslands.map(i => `P${i+1}`).join(', ') : '(none)'}`);
    lines.push(`- **Total connections**: ${conns.all.length}`);

    if (conns.imageRecurrences?.length > 0) {
      lines.push('\n**Image Recurrences:**\n');
      for (const ir of conns.imageRecurrences) {
        lines.push(`- "${ir.image}" at ${ir.locations.map(l => `P${l[0]+1}S${l[1]+1}`).join(', ')}`);
      }
    }

    if (conns.narrativeArcMap?.length > 0) {
      lines.push('\n**Narrative Arc Map:**\n');
      for (const n of conns.narrativeArcMap) {
        lines.push(`- ${n.role}: P${n.location[0]+1}S${n.location[1]+1}`);
      }
    }

    if (conns.redundancies?.length > 0) {
      lines.push('\n**Redundancies:**\n');
      for (const r of conns.redundancies) {
        lines.push(`- P${r.paragraphs.map(p=>p+1).join(',')}: ${r.overlappingContent}`);
      }
    }

    // R2 fix: filter out scout-tentative connections from rendered output.
    // Tentative connections are walker working memory; only foundational /
    // significant / supporting strength connections are rendered. The full
    // list (including tentative) remains accessible via profile.connections.all
    // for downstream layers that need it. Drops ~46 of 59 connections in
    // typical essays = ~77% reduction in §7.1 length.
    const renderedConns = conns.all.filter(
      (c) => c.strengthCategory !== 'tentative',
    );
    const suppressedCount = conns.all.length - renderedConns.length;
    lines.push(
      `\n**All Connections (Detailed):** ${renderedConns.length} of ${conns.all.length} ` +
        `(suppressed ${suppressedCount} tentative scout-discovered connections; ` +
        `set strengthCategory ≥ supporting to render)\n`,
    );
    for (const c of renderedConns) {
      const fromStr = c.from.sentence !== undefined
        ? `P${c.from.paragraph+1}S${c.from.sentence+1}`
        : `P${c.from.paragraph+1}`;
      const toStr = c.to.sentence !== undefined
        ? `P${c.to.paragraph+1}S${c.to.sentence+1}`
        : `P${c.to.paragraph+1}`;
      lines.push(`#### Connection ${c.id}: ${fromStr} -> ${toStr}`);
      lines.push(`- **From label**: ${c.from.label}`);
      lines.push(`- **To label**: ${c.to.label}`);
      lines.push(`- **Description**: ${c.description}`);
      if (c.reverseIllumination) {
        lines.push(`- **Reverse illumination**: ${c.reverseIllumination}`);
      }
      if (c.routingTags.length > 0) {
        lines.push(`- **Routing tags**: ${c.routingTags.join(', ')}`);
      }
      // R4-related: when significance equals description verbatim, suppress
      // the duplicate. The LLM emits identical strings into both fields
      // for ~30% of connections (audit §3.5).
      if (c.significance && c.significance.trim() !== c.description.trim()) {
        lines.push(`- **Significance**: ${c.significance}`);
      }
      lines.push(`- **Strength**: ${c.strengthCategory}`);
      lines.push(`- **Directionality**: ${c.directionality}`);
      lines.push(`- **Discovered by**: ${c.discoveredBy}`);
      lines.push(`- **Status**: ${c.status}`);
      if (c.relatedFindings.length > 0) {
        lines.push(`- **Related findings**: ${c.relatedFindings.join(', ')}`);
      }
      if (c.invalidation) {
        lines.push(`- **Invalidation**: ${c.invalidation.reason} (trigger: ${c.invalidation.trigger})`);
      }
      lines.push('');
    }
  } else {
    lines.push('(not available)');
  }

  // Entanglements
  lines.push('### 7.2 Entanglements\n');
  const ents = profile.entanglements;
  if (ents && ents.length > 0) {
    for (const e of ents) {
      const loc = e.location.sentence !== undefined
        ? `P${e.location.paragraph+1}S${e.location.sentence+1}`
        : `P${e.location.paragraph+1}`;
      lines.push(`#### Entanglement ${e.id}: ${e.dimensions.join(' + ')} at ${loc}`);
      lines.push(`- **Description**: ${e.description}`);
      lines.push(`- **Significance**: ${e.significance}`);
      lines.push(`- **Cross-refs**: ${e.crossRefs.join(', ')}`);
      lines.push('');
    }
  } else {
    lines.push('(none)');
  }

  return lines.join('\n') + '\n';
}

function renderParagraphProfiles(profile: EssayProfile): string {
  const lines: string[] = [];
  lines.push('## 8. Paragraph Profiles\n');

  for (const para of profile.paragraphs) {
    const wordCount = para.text.split(/\s+/).length;
    lines.push(`### Paragraph ${para.index + 1} (${wordCount} words, ${para.sentences.length} sentences)\n`);
    lines.push(`**Text**: ${para.text.slice(0, 200)}${para.text.length > 200 ? '...' : ''}\n`);
    lines.push(`**Tags**: ${para.tags.join(', ') || '(none)'}`);

    if (para.walkSkipped) {
      lines.push(`\n**WALK SKIPPED**: Failed at ${para.walkSkipped.failedAt} — ${para.walkSkipped.errorSummary}`);
    }

    // Paragraph understanding
    if (para.understanding) {
      const pu = para.understanding;
      lines.push('\n**Understanding:**\n');
      lines.push(`- Role: ${pu.role}`);
      lines.push(`- Function: ${pu.function}`);
      lines.push(`- Narrative contribution: ${pu.narrativeContribution}`);
      lines.push(`- Emotional register:`);
      lines.push(`  - Dominant emotion: ${pu.emotionalRegister.dominantEmotion}`);
      lines.push(`  - Depth: ${pu.emotionalRegister.depth}`);
      lines.push(`  - Authenticity: ${pu.emotionalRegister.authenticity}`);
      lines.push(`  - Show vs Tell: ${pu.emotionalRegister.showVsTell}`);
      lines.push(`  - Strongest moment: ${safe(pu.emotionalRegister.strongestMoment)}`);
      lines.push(`- Craft profile:`);
      lines.push(`  - Rhythm pattern: ${pu.craftProfile.rhythmPattern}`);
      lines.push(`  - Image usage: ${pu.craftProfile.imageUsage}`);
      lines.push(`  - Voice consistency: ${pu.craftProfile.voiceConsistency}`);
      lines.push(`  - Standout moment: ${safe(pu.craftProfile.standoutMoment)}`);
    }

    // Paragraph analysis
    if (para.analysis) {
      const pa = para.analysis;
      lines.push('\n**Analysis:**\n');
      lines.push(`- Effectiveness: ${pa.effectiveness}/100`);
      lines.push(`- Verdict: ${pa.verdict}`);
      if (pa.strengthSignatures.length > 0) {
        lines.push('- Strength signatures:');
        for (const ss of pa.strengthSignatures) {
          lines.push(`  - **${ss.quality}**: ${ss.evidence}`);
        }
      }
      if (pa.growthEdges.length > 0) {
        lines.push('- Growth edges:');
        for (const ge of pa.growthEdges) {
          lines.push(`  - **${ge.quality}**: ${ge.description}`);
        }
      }
    }

    // Sentence profiles
    lines.push('\n**Sentences:**\n');
    for (const sent of para.sentences) {
      lines.push(`#### S${sent.index + 1}: "${sent.text.slice(0, 120)}${sent.text.length > 120 ? '...' : ''}"\n`);

      if (sent.understanding) {
        const su = sent.understanding;
        lines.push('**Understanding:**\n');
        lines.push('*Observed Functions:*\n');
        lines.push(renderObservations(su.observedFunctions));
        // R3 fix: suppress always-empty schema stubs. The previous renderer
        // emitted "*Inferred Intents:* (none)", "*Narrative Contributions:*
        // (none)", "Rhetorical functions: (none)", "Tags: (none)",
        // "Connection refs: (none)", "Finding refs: (none)" for every
        // sentence regardless of population. Suppressing when empty drops
        // ~6 lines per sentence × N sentences = ~150-200 lines per dump.
        if (su.inferredIntents && su.inferredIntents.length > 0) {
          lines.push('*Inferred Intents:*\n');
          lines.push(renderObservations(su.inferredIntents));
        }
        if (su.narrativeContributions && su.narrativeContributions.length > 0) {
          lines.push('*Narrative Contributions:*\n');
          lines.push(renderObservations(su.narrativeContributions));
        }
        if (su.rhetoricalFunctions.length > 0) {
          lines.push(`- Rhetorical functions: ${su.rhetoricalFunctions.join(', ')}`);
        }
        // Paragraph contribution and Primary function are duplicates in practice
        // (see audit §1.5). Render Primary function only; skip Paragraph contribution
        // when it equals Primary function. Keep Significance.
        const primary = su.primaryFunction;
        const paraContrib = su.paragraphContribution;
        if (primary) {
          lines.push(`- Primary function: ${primary}`);
          if (paraContrib && paraContrib !== primary) {
            lines.push(`- Paragraph contribution: ${paraContrib}`);
          }
        } else if (paraContrib) {
          lines.push(`- Paragraph contribution: ${paraContrib}`);
        }
        if (su.significance) {
          lines.push(`- Significance: ${su.significance}`);
        }
        if (su.tags.length > 0) {
          lines.push(`- Tags: ${su.tags.join(', ')}`);
        }
        if (su.connectionRefs.length > 0) {
          lines.push(`- Connection refs: ${su.connectionRefs.join(', ')}`);
        }
        if (su.findingRefs.length > 0) {
          lines.push(`- Finding refs: ${su.findingRefs.join(', ')}`);
        }

        if (su.craft) {
          // Scope 1 Phase 1: voiceAlignment dropped from SentenceCraft.
          // Legacy profiles that still carry the field are ignored.
          lines.push(`- Craft: rhythm=${su.craft.rhythm || '(uncharacterized)'}, techniques=[${su.craft.techniques.join(', ')}]`);
        }
        if (su.significantChoices.length > 0) {
          lines.push('- Significant word choices:');
          for (const sc of su.significantChoices) {
            lines.push(`  - "${sc.word}": ${sc.significance}`);
          }
        }
      }

      if (sent.analysis) {
        const sa = sent.analysis;
        lines.push('\n**Analysis:**\n');
        lines.push(`- Effectiveness: ${sa.effectiveness}/100`);
        lines.push(`- Reasoning: ${sa.effectivenessReasoning}`);
        lines.push(`- Is strength: ${sa.isStrength}, Is problem: ${sa.isProblem}`);
        lines.push(`- Priority for improvement: ${sa.priorityForImprovement}`);
        lines.push('- Strengths:');
        lines.push(renderObservations(sa.strengths));
        lines.push('- Weaknesses:');
        lines.push(renderObservations(sa.weaknesses));
      }
      lines.push('');
    }
    lines.push('---\n');
  }

  return lines.join('\n') + '\n';
}

function renderFindings(profile: EssayProfile): string {
  const lines: string[] = [];
  lines.push('## 9. Findings\n');

  if (profile.findings.length === 0) {
    lines.push('(no findings)\n');
    return lines.join('\n');
  }

  const active = profile.findings.filter(f => f.maturity !== 'superseded');
  const superseded = profile.findings.filter(f => f.maturity === 'superseded');

  lines.push(`**Total**: ${profile.findings.length} (${active.length} active, ${superseded.length} superseded)\n`);

  for (const f of profile.findings) {
    const scopeStr = f.scope.type === 'essay_level' ? 'essay-level'
      : f.scope.type === 'cross_paragraph' ? `P${(f.scope.paragraphs ?? []).map(p => p + 1).join('+')}`
      : f.scope.paragraph !== undefined ? `P${f.scope.paragraph + 1}` : f.scope.type;

    lines.push(`### Finding ${f.id} [${f.maturity}/${f.coachingValue}] — ${scopeStr}\n`);
    lines.push(`- **Claim**: ${f.claim}`);
    lines.push(`- **Dimensions**: ${f.dimensions.join(', ')}`);
    lines.push(`- **Source**: ${f.source}`);
    lines.push(`- **Maturity reasoning**: ${f.maturityReasoning}`);
    lines.push(`- **Deepening potential**: ${safe(f.deepeningPotential)}`);
    lines.push(`- **Builds on**: ${f.buildsOn.join(', ') || '(none)'}`);
    lines.push(`- **Related to**: ${f.relatedTo.join(', ') || '(none)'}`);
    lines.push(`- **Raises questions**: ${f.raisesQuestions.join('; ') || '(none)'}`);
    lines.push(`- **Status**: ${f.maturity}${f.supersededBy ? ` (superseded by ${f.supersededBy}: ${f.supersessionReason})` : ''}`);

    if (f.evidence.length > 0) {
      lines.push('- **Evidence**:');
      for (const ev of f.evidence) {
        const locStr = ev.location
          ? (ev.location.sentence !== undefined ? `P${ev.location.paragraph+1}S${ev.location.sentence+1}` : `P${ev.location.paragraph+1}`)
          : 'essay-level';
        lines.push(`  - [${ev.type}] ${locStr}: "${ev.text}"`);
      }
    }

    if (f.scope.textEvidence?.length > 0) {
      lines.push('- **Scope text evidence**:');
      for (const te of f.scope.textEvidence) {
        const locStr = te.location.sentence !== undefined
          ? `P${te.location.paragraph+1}S${te.location.sentence+1}`
          : `P${te.location.paragraph+1}`;
        lines.push(`  - ${locStr}: "${te.text.slice(0, 100)}${te.text.length > 100 ? '...' : ''}"`);
      }
    }

    if (f.lineage.length > 0) {
      lines.push('- **Lineage**:');
      for (const l of f.lineage) {
        lines.push(`  - ${l.previousMaturity} -> ${l.newMaturity} (trigger: ${l.trigger}): ${l.reasoning}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n') + '\n';
}

function renderEssayUnderstanding(profile: EssayProfile): string {
  const lines: string[] = [];
  lines.push('## 10. Essay Understanding Prose\n');

  const eu = profile.essayUnderstanding;
  if (!eu) {
    lines.push('(not available)\n');
    return lines.join('\n');
  }

  lines.push(`- **Maturity**: ${eu.maturity}`);
  lines.push(`- **Central tension**: ${eu.centralTension}`);

  lines.push('\n**Full Understanding Prose:**\n');
  lines.push(`> ${eu.prose.split('\n').join('\n> ')}`);

  lines.push('\n**Confirmed Insights:**\n');
  if (eu.confirmedInsights.length > 0) {
    for (const ci of eu.confirmedInsights) {
      lines.push(`- ${ci}`);
    }
  } else {
    lines.push('(none)');
  }

  lines.push('\n**Active Hypotheses:**\n');
  if (eu.activeHypotheses.length > 0) {
    for (const ah of eu.activeHypotheses) {
      lines.push(`- ${ah}`);
    }
  } else {
    lines.push('(none)');
  }

  if (eu.growthLog.length > 0) {
    lines.push('\n**Growth Log:**\n');
    for (const gl of eu.growthLog) {
      lines.push(`- [${gl.trigger}] ${gl.whatChanged}`);
    }
  }

  return lines.join('\n') + '\n';
}

function renderCoherenceReport(profile: EssayProfile): string {
  const lines: string[] = [];
  lines.push('## 11. Coherence Report\n');

  if (!profile.coherenceReport) {
    lines.push('(not available — L4 may have failed)\n');
    return lines.join('\n');
  }

  const cr = profile.coherenceReport;
  lines.push(`- **Is coherent**: ${cr.isCoherent}`);
  lines.push(`- **Contradictions found**: ${cr.contradictions.length}`);

  if (cr.contradictions.length > 0) {
    lines.push('\n**Contradictions:**\n');
    for (const c of cr.contradictions) {
      lines.push(`### ${c.severity.toUpperCase()}: ${c.sectionA} vs ${c.sectionB}\n`);
      lines.push(`- **Claim A**: ${c.claimA}`);
      lines.push(`- **Claim B**: ${c.claimB}`);
      lines.push(`- **Nature**: ${safe(c.nature)}`);
      lines.push(`- **Routing category**: ${safe(c.routingCategory)}`);
      lines.push(`- **Can coexist**: ${c.canCoexist ?? 'N/A'}`);
      lines.push(`- **Suggested resolution**: ${c.suggestedResolution}`);
      lines.push(`- **Likely resolution**: ${safe(c.likelyResolution)}`);
      if (c.evidenceA) lines.push(`- **Evidence A**: "${c.evidenceA}"`);
      if (c.evidenceB) lines.push(`- **Evidence B**: "${c.evidenceB}"`);
      lines.push(`- **Source**: ${safe(c.source)}`);
      lines.push('');
    }
  }

  if (cr.programmaticContradictions?.length) {
    lines.push('\n**Programmatic Contradictions:**\n');
    for (const pc of cr.programmaticContradictions) {
      lines.push(`- **${pc.type}** [${pc.severity}]${pc.consumed ? ' (consumed)' : ''}`);
      lines.push(`  - A: ${pc.evidenceA.section} — "${pc.evidenceA.claim}"`);
      lines.push(`  - B: ${pc.evidenceB.section} — "${pc.evidenceB.claim}"`);
    }
  }

  if (cr.northStarAssessment) {
    const nsa = cr.northStarAssessment;
    lines.push('\n**North Star Assessment:**\n');
    lines.push(`- Passes irreplaceability test: ${nsa.passesIrreplaceabilityTest}`);
    lines.push(`- Reasoning: ${nsa.reasoning}`);
    lines.push(`- Missing insight: ${safe(nsa.missingInsight)}`);
  }

  return lines.join('\n') + '\n';
}

function renderQuestionQueue(profile: EssayProfile): string {
  const lines: string[] = [];
  lines.push('## 12. Question Queue\n');

  if (!profile.questionQueue || profile.questionQueue.length === 0) {
    lines.push('(no questions in queue)\n');
    return lines.join('\n');
  }

  const open = profile.questionQueue.filter(q => q.status === 'open');
  const resolved = profile.questionQueue.filter(q => q.status === 'resolved');
  const filtered = profile.questionQueue.filter(q => q.status === 'filtered');

  lines.push(`**Total**: ${profile.questionQueue.length} (${open.length} open, ${resolved.length} resolved, ${filtered.length} filtered)\n`);

  for (const q of profile.questionQueue) {
    lines.push(`### ${q.id} [${q.status}/${q.priority}] — ${q.source}`);
    lines.push(`- **Question**: ${q.question}`);
    lines.push(`- **Expected insight**: ${q.expectedInsight}`);
    lines.push(`- **Dimensions**: ${q.dimensions.join(', ')}`);
    lines.push(`- **Anchor paragraph**: ${q.anchorParagraph !== undefined ? `P${q.anchorParagraph + 1}` : '(essay-level)'}`);
    lines.push(`- **Iterations survived**: ${q.iterationsSurvived}`);
    lines.push(`- **Spawned questions**: ${q.spawnedQuestions.join(', ') || '(none)'}`);
    if (q.resolution) lines.push(`- **Resolution**: ${q.resolution}`);
    lines.push('');
  }

  return lines.join('\n') + '\n';
}

function renderProfileIndex(profile: EssayProfile): string {
  const lines: string[] = [];
  lines.push('## 13. Profile Index (Compact)\n');

  const idx = profile.index;
  lines.push(`- **Essay length**: ${idx.essayLength.paragraphs} paragraphs, ${idx.essayLength.sentences} sentences, ${idx.essayLength.words} words`);
  lines.push(`- **Confidence**: ${idx.confidenceLevel}`);
  lines.push(`- **Topic tags**: ${idx.topicTags.join(', ')}`);
  lines.push(`- **Full analysis count**: ${idx.fullAnalysisCount}`);
  lines.push(`- **Last comprehensive at**: ${safe(idx.lastComprehensiveAt)}`);

  lines.push('\n**Paragraph Digest:**\n');
  lines.push('| P# | Role Summary | Tags | Themes | Sentences | Strengths | Weaknesses | Connections | Priority |');
  lines.push('|----|-------------|------|--------|-----------|-----------|------------|-------------|----------|');
  for (const pd of idx.paragraphDigest) {
    lines.push(`| P${pd.index+1} | ${pd.roleSummary} | ${pd.tags.join(',')} | ${pd.themes.join(',')} | ${pd.sentenceCount} | ${pd.hasStrengths} | ${pd.hasWeaknesses} | ${pd.connectionCount} | ${pd.improvementPriority} |`);
  }

  if (idx.connectionGraph.length > 0) {
    lines.push('\n**Connection Graph (compact):**\n');
    for (const cg of idx.connectionGraph) {
      const fromStr = cg.from.sentence !== undefined ? `P${cg.from.paragraph+1}S${cg.from.sentence+1}` : `P${cg.from.paragraph+1}`;
      const toStr = cg.to.sentence !== undefined ? `P${cg.to.paragraph+1}S${cg.to.sentence+1}` : `P${cg.to.paragraph+1}`;
      lines.push(`- ${cg.id}: ${fromStr} -> ${toStr} [${cg.routingTags.join(',')}] ${cg.strengthCategory} (${cg.status})`);
    }
  }

  lines.push('\n**Staleness Snapshot:**\n');
  lines.push(`- Strong stale: ${idx.stalenessSnapshot.strongStale.join(', ') || '(none)'}`);
  lines.push(`- Moderate stale: ${idx.stalenessSnapshot.moderateStale.join(', ') || '(none)'}`);
  lines.push(`- Weak stale: ${idx.stalenessSnapshot.weakStale.join(', ') || '(none)'}`);

  if (idx.activeConcerns.length > 0) {
    lines.push('\n**Active Concerns:**\n');
    for (const ac of idx.activeConcerns) {
      const locStr = ac.location[1] !== null ? `P${ac.location[0]+1}S${(ac.location[1] as number)+1}` : `P${ac.location[0]+1}`;
      lines.push(`- [${ac.severity}] ${locStr}: ${ac.concern}`);
    }
  }

  if (idx.sectionTokenCounts) {
    lines.push('\n**Section Token Counts:**\n');
    lines.push(jsonBlock(idx.sectionTokenCounts));
  }

  if (idx.findingSummary) {
    lines.push('\n**Finding Summary:**\n');
    lines.push(`- Total active: ${idx.findingSummary.totalActive}`);
    lines.push(`- By maturity: ${JSON.stringify(idx.findingSummary.byMaturity)}`);
    if (idx.findingSummary.topFindings.length > 0) {
      lines.push('- Top findings:');
      for (const tf of idx.findingSummary.topFindings) {
        lines.push(`  - ${tf.id} [${tf.maturity}/${tf.coachingValue}]: ${tf.claim}`);
      }
    }
  }

  return lines.join('\n') + '\n';
}

function renderMetadata(profile: EssayProfile): string {
  const lines: string[] = [];
  lines.push('## 14. Profile Metadata\n');

  const md = profile.metadata;
  lines.push(`- **Confidence level**: ${md.confidenceLevel}`);
  lines.push(`- **Last updated layer**: ${md.lastUpdatedLayer}`);
  lines.push(`- **Paragraphs covered**: ${md.paragraphsCovered.join(', ')}`);
  lines.push(`- **Conversation insights count**: ${md.conversationInsightsCount}`);
  lines.push(`- **Total analysis cost**: ${cost(md.totalAnalysisCost)}`);
  lines.push(`- **Created at**: ${md.createdAt}`);
  lines.push(`- **Last mutated at**: ${md.lastMutatedAt}`);
  lines.push(`- **Legacy profile**: ${md.legacyProfile}`);

  // Conversation insights (should be empty for pipeline-only run)
  lines.push('\n### Conversation Insights\n');
  if (profile.conversationInsights.length > 0) {
    for (const ci of profile.conversationInsights) {
      lines.push(`- ${ci.id} [${ci.category}]: "${ci.sourceText}"`);
    }
  } else {
    lines.push('(none — expected for pipeline-only run)');
  }

  // Pattern insights
  lines.push('\n### Pattern Insights\n');
  if (profile.patternInsights.length > 0) {
    for (const pi of profile.patternInsights) {
      lines.push(`- ${pi.id}: ${pi.pattern} (${pi.instanceCount} instances)`);
      lines.push(`  - Implication: ${pi.implication}`);
    }
  } else {
    lines.push('(none)');
  }

  // Student declared context
  lines.push('\n### Student Declared Context\n');
  lines.push(profile.studentDeclaredContext || '(empty)');

  // Structured context
  if (profile.structuredContext) {
    lines.push('\n### Structured Student Context\n');
    lines.push(jsonBlock(profile.structuredContext));
  }

  // Edit history
  lines.push('\n### Edit History\n');
  if (profile.editHistory.length > 0) {
    lines.push(`${profile.editHistory.length} version records`);
    lines.push(jsonBlock(profile.editHistory));
  } else {
    lines.push('(none — expected for first analysis)');
  }

  return lines.join('\n') + '\n';
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ERROR: ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const essayText = fs.readFileSync(ESSAY_PATH, 'utf-8').trim();
  const wordCount = essayText.split(/\s+/).length;
  console.log(`[Profile Dump] Essay loaded: ${essayText.length} chars, ${wordCount} words`);

  // Run the analysis pipeline (L1-L4, no L5 annotations)
  console.log('[Profile Dump] Running full analysis pipeline (L1-L4)...');
  const pipelineStart = Date.now();

  const pipelineResult = await analysisOrchestrator.analyzeEssay({
    essayId: `full-profile-dump-${ESSAY_LABEL}`,
    essayText,
    essayType: 'common_app',
    includeAnnotations: false,
  });

  const pipelineTimeMs = Date.now() - pipelineStart;
  const profile = pipelineResult.profile as EssayProfile;

  console.log(`[Profile Dump] Pipeline complete in ${formatTime(pipelineTimeMs)}`);
  console.log(`[Profile Dump] Layers completed: ${pipelineResult.layersCompleted.join(', ')}`);
  console.log(`[Profile Dump] Layers failed: ${pipelineResult.layersFailed.map(f => `${f.layer}: ${f.message}`).join(', ') || 'none'}`);
  console.log(`[Profile Dump] Total cost: ${cost(pipelineResult.costSummary.totalCost)}`);

  // Check for critical failures
  const criticalLayers = ['L3', 'L3.75', 'L3.5'];
  const failedCritical = pipelineResult.layersFailed.filter(f =>
    criticalLayers.some(cl => f.layer.includes(cl))
  );
  if (failedCritical.length > 0) {
    const failMsg = failedCritical.map(f => `${f.layer}: ${f.message}`).join(', ');
    console.error(`[Profile Dump] CRITICAL PIPELINE FAILURE: ${failMsg}`);
    console.error('[Profile Dump] Dumping partial profile anyway...');
  }

  // Assemble the markdown output
  const sections: string[] = [];

  const analysisDate = new Date().toISOString().split('T')[0];
  const totalCostStr = cost(pipelineResult.costSummary.totalCost);

  sections.push(`# Uplift Conversator V2 — Complete Analysis Profile`);
  sections.push(`## Essay: ${path.basename(ESSAY_PATH)} (${wordCount} words)`);
  sections.push(`## Analysis date: ${analysisDate}`);
  sections.push(`## Cost: ${totalCostStr} | Time: ${formatTime(pipelineTimeMs)}`);
  sections.push('');
  sections.push('---');
  sections.push('');

  sections.push(renderPipelineOverview(pipelineResult, essayText, pipelineTimeMs));
  sections.push('---\n');
  sections.push(renderAOFirstRead(profile));
  sections.push('---\n');
  sections.push(renderNorthStar(profile));
  sections.push('---\n');
  sections.push(renderScoreMatrix(profile));
  sections.push('---\n');
  sections.push(renderHolisticUnderstanding(profile));
  sections.push('---\n');
  sections.push(renderAdmissionsPositioning(profile));
  sections.push('---\n');
  sections.push(renderConnectionsAndEntanglements(profile));
  sections.push('---\n');
  sections.push(renderParagraphProfiles(profile));
  sections.push('---\n');
  sections.push(renderFindings(profile));
  sections.push('---\n');
  sections.push(renderEssayUnderstanding(profile));
  sections.push('---\n');
  sections.push(renderCoherenceReport(profile));
  sections.push('---\n');
  sections.push(renderQuestionQueue(profile));
  sections.push('---\n');
  sections.push(renderProfileIndex(profile));
  sections.push('---\n');
  sections.push(renderMetadata(profile));

  // Write output
  ensureOutputDir();
  const output = sections.join('\n');
  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');

  // R6 fix: persist the profile JSON next to the markdown so future
  // audits / re-renders / lint checks don't require an API re-run.
  // Serialized via JSON.stringify with 2-space indent for diffability.
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(profile, null, 2), 'utf-8');
  console.log(`[Profile Dump] Profile JSON persisted to: ${OUTPUT_JSON}`);
  console.log(`\n[Profile Dump] Output written to: ${OUTPUT_FILE}`);
  console.log(`[Profile Dump] Output size: ${(output.length / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error('[Profile Dump] Fatal error:', err);
  process.exit(1);
});
